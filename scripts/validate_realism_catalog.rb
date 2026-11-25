#!/usr/bin/env ruby
# frozen_string_literal: true

# The realism catalog validator (docs/agents/ops_core_build/S6_BUILD_BRIEF.md, unit 20).
#
#   ruby scripts/validate_realism_catalog.rb [--dir DIR] [--index FILE] [--scenarios DIR]
#
# Checks every file of config/break_escape/realism_catalog/ (shape, duplicate keys, ids and modules
# unique across files, the text rules, the catalog-only rules, and the append-only comparison with
# docs/REALISM_CATALOG_INDEX.md). When nothing is wrong it rewrites the index; when anything is
# wrong it rewrites nothing and exits 1.
#
# A message names the file, the catalog id, the field and the rule. It never quotes a catalog string.

require 'json'
require 'set'
require 'strscan'
require 'optparse'
require 'securerandom'
require 'digest'
require 'erb'
require 'open3'
begin
  require 'json-schema'
rescue LoadError
  warn 'ERROR: json-schema gem is required for validation. Install it with: gem install json-schema (or add gem "json-schema" to the Gemfile, then bundle install)'
  exit 1
end
JSON::Validator.use_multi_json = false if JSON::Validator.respond_to?(:use_multi_json=)
require_relative 'realism_text_rules'
require_relative '../lib/break_escape/scenario_binding'

REALISM_ROOT = File.expand_path('..', __dir__)
REALISM_CATALOG_DIR = File.join(REALISM_ROOT, 'config/break_escape/realism_catalog').freeze
REALISM_SCHEMA_PATH = File.join(REALISM_ROOT, 'config/break_escape/realism_catalog.schema.json').freeze
REALISM_INDEX_PATH = File.join(REALISM_ROOT, 'docs/REALISM_CATALOG_INDEX.md').freeze
REALISM_NICKNAMES_PATH = File.join(REALISM_ROOT, 'scripts/real_vuln_nicknames.txt').freeze
REALISM_PRODUCTS_PATH = File.join(REALISM_ROOT, 'scripts/real_product_names.txt').freeze
REALISM_SCENARIO_SCHEMA_PATH = File.join(REALISM_ROOT, 'scripts/scenario-schema.json').freeze
REALISM_SCENARIOS_DIR = File.join(REALISM_ROOT, 'scenarios').freeze

# The ids whose script may mirror the id: the three the index held when the mirror rule landed. A row added to
# the index by hand never widens this list.
REALISM_MIRROR_EXEMPT = %w[filehold_link_setting filehold_release_line filehold_update_lag].freeze
REALISM_ID_FORM = /\A[a-z][a-z0-9_]{2,47}\z/.freeze
REALISM_FIRST_SEGMENTS = %w[auxiliary exploit post].freeze
REALISM_ADVISORY_IN_ID = [
  /(?<![a-z0-9])cve[-_]\d{4}[-_]\d+/i, /(?<![a-z0-9])can[-_]\d{4}[-_]\d+/i, /(?<![a-z0-9])ms\d\d[-_]\d{3}/i,
  /(?<![a-z0-9])kb\d{6,7}/i, /(?<![a-z0-9])(rhsa|dsa|usn|ghsa|zdi)[-_]/i
].freeze

RealismProblem = Struct.new(:level, :file, :id, :field, :rule) do
  def to_s
    label = level == :error ? 'ERROR' : 'WARNING'
    "#{label}: realism catalog: #{file}: #{id}: #{field}: #{rule}"
  end
end

def realism_problem(list, file, id, field, rule, level = :error)
  list << RealismProblem.new(level, file, id, field, rule)
end

# A catalog id only when it has the id form; otherwise a position, so odd text is never echoed.
def realism_id_label(id, position)
  id.is_a?(String) && id =~ REALISM_ID_FORM ? id : "entry #{position}"
end

def realism_word_list(path)
  return [] unless path && File.exist?(path)

  File.readlines(path).map(&:strip).reject { |l| l.empty? || l.start_with?('#') }.map(&:downcase)
end

# ---- duplicate keys: JSON.parse keeps the last, so read the text ourselves ----------------------

def realism_scan_string(ss)
  ss.skip(/\s*/)
  raw = ss.scan(/"(?:[^"\\]|\\.)*"/)
  raw ? raw[1..-2] : nil
end

def realism_scan_value(ss, path, dups)
  ss.skip(/\s*/)
  if ss.scan(/\{/)
    seen = Set.new
    ss.skip(/\s*/)
    return if ss.scan(/\}/)

    loop do
      key = realism_scan_string(ss)
      break if key.nil?

      ss.skip(/\s*/)
      ss.scan(/:/)
      dups << (path + [key]) unless seen.add?(key)
      realism_scan_value(ss, path + [key], dups)
      ss.skip(/\s*/)
      break if ss.scan(/\}/) || !ss.scan(/,/)
    end
  elsif ss.scan(/\[/)
    ss.skip(/\s*/)
    return if ss.scan(/\]/)

    index = 0
    loop do
      realism_scan_value(ss, path + [index], dups)
      index += 1
      ss.skip(/\s*/)
      break if ss.scan(/\]/) || !ss.scan(/,/)
    end
  elsif ss.check(/"/)
    realism_scan_string(ss)
  else
    ss.scan(/[^,\]\}\s]+/)
  end
end

def realism_duplicate_keys(text)
  dups = []
  realism_scan_value(StringScanner.new(text), [], dups)
  dups
end

# ---- schema errors without their values --------------------------------------------------------

REALISM_SCHEMA_RULES = {
  'AdditionalProperties' => 'unknown_key', 'Required' => 'required', 'Pattern' => 'form', 'MinLength' => 'length',
  'MaxLength' => 'length', 'MinItems' => 'count', 'MaxItems' => 'count', 'Type' => 'type'
}.freeze

def realism_schema_problems(data, file, problems, schema)
  errors = JSON::Validator.fully_validate(schema, data, errors_as_objects: true)
  seen = Set.new
  errors.each do |e|
    parts = e[:fragment].to_s.sub(%r{\A#/?}, '').split('/')
    rule = REALISM_SCHEMA_RULES[e[:failed_attribute].to_s] || e[:failed_attribute].to_s.downcase
    id = '-'
    field = '(file)'
    if parts.first == 'entries' && parts.length >= 2
      entries = data['entries'].is_a?(Hash) ? data['entries'].keys : []
      id = realism_id_label(parts[1], entries.index(parts[1]).to_i + 1)
      field = parts.length > 2 ? parts[2..].join('/') : '(entry)'
    elsif parts.first == 'entries'
      field = 'entries'
      next if rule == 'unknown_key' # the id-form check names the entry by position
    end
    if rule == 'required' && (m = e[:message].to_s.match(/required property of '(\w+)'/))
      field = m[1]
    end
    next unless seen.add?([file, id, field, rule])

    realism_problem(problems, file, id, field, rule)
  end
end

# ---- one file -----------------------------------------------------------------------------------

# JSON.parse warns about a duplicate key on newer json gems; the duplicate-key scan reports it instead.
def realism_quiet_parse(text)
  verbose = $VERBOSE
  $VERBOSE = nil
  JSON.parse(text)
ensure
  $VERBOSE = verbose
end

def realism_check_file(path, problems, schema)
  file = File.basename(path)
  text = File.read(path)
  data = realism_quiet_parse(text)
  unless data.is_a?(Hash)
    realism_problem(problems, file, '-', '(file)', 'type')
    return nil
  end
  realism_duplicate_keys(text).each do |p|
    if p.first == 'entries' && p.length == 2
      realism_problem(problems, file, realism_id_label(p[1], 0), '(entry)', 'duplicate_id_in_file')
    else
      field = p.last.to_s =~ /\A[a-z_]{1,24}\z/ ? p.last.to_s : '(key)'
      realism_problem(problems, file, '-', field, 'duplicate_key')
    end
  end
  if data['entries'].is_a?(Hash)
    data['entries'].each_key.with_index(1) do |id, i|
      realism_problem(problems, file, "entry #{i}", 'id', 'id_form') unless id =~ REALISM_ID_FORM
    end
  end
  realism_schema_problems(data, file, problems, schema)
  data
rescue JSON::ParserError, EncodingError
  realism_problem(problems, file, '-', '(file)', 'parse_error')
  nil
rescue SystemCallError
  realism_problem(problems, file, '-', '(file)', 'unreadable')
  nil
end

def realism_default_form_module?(mod, classes)
  mod =~ %r{\Aauxiliary/scanner/[a-z0-9_]+/(#{classes.map { |c| Regexp.escape(c) }.join('|')})_f\d+\z}
end

# Lower-cased, with `-` and `_` removed: two names that squash equal mirror each other.
def realism_squash(text)
  text.to_s.downcase.delete('-_')
end

def realism_whole_word?(text, word)
  text.to_s =~ /(?<![A-Za-z0-9])#{Regexp.escape(word)}(?![A-Za-z0-9])/i
end

def realism_check_entry(file, id, entry, problems, ctx)
  # id
  ids = realism_id_label(id, 0)
  text_rule = lambda do |value, field, kind|
    RealismTextRules.check(value, kind: kind).each do |f|
      realism_problem(problems, file, ids, field, f.rule, f.level)
    end
    if value =~ /\d+\.\d+\.\d+\.\d+/
      realism_problem(problems, file, ids, field, 'dotted_quad')
    end
  end
  text_rule.call(id, 'id', :id)
  realism_problem(problems, file, ids, 'id', 'advisory_form') if REALISM_ADVISORY_IN_ID.any? { |re| id =~ re }
  ctx[:nicknames].each do |n|
    realism_problem(problems, file, ids, 'id', 'nickname') if realism_whole_word?(id, n.tr(' -', '__'))
  end
  ctx[:products].each do |name|
    realism_problem(problems, file, ids, 'id', 'real_product_name') if realism_whole_word?(id.tr('_', ' '), name)
  end
  return unless entry.is_a?(Hash)

  if entry['title'].is_a?(String)
    text_rule.call(entry['title'], 'title', :prose)
    ctx[:products].each do |name|
      realism_problem(problems, file, ids, 'title', 'real_product_name') if realism_whole_word?(entry['title'], name)
    end
  end
  if entry['module'].is_a?(String)
    mod = entry['module']
    text_rule.call(mod, 'module', :module)
    unless REALISM_FIRST_SEGMENTS.include?(mod.split('/').first)
      realism_problem(problems, file, ids, 'module', 'first_segment')
    end
    realism_problem(problems, file, ids, 'module', 'default_form') if realism_default_form_module?(mod, ctx[:classes])
  end
  if entry['script'].is_a?(String)
    text_rule.call(entry['script'], 'script', :script)
    # A script named for its id is exempt only when the id is on the frozen list of ids (its script is frozen
    # by the identity digest and cannot be renamed).
    if realism_squash(entry['script']) == realism_squash(id) && !ctx[:exempt].include?(id)
      realism_problem(problems, file, ids, 'script', 'script_mirrors_id')
    end
  end
  Array(entry['advisories']).each_with_index do |a, i|
    text_rule.call(a, "advisories/#{i}", :text) if a.is_a?(String)
  end
  Array(entry['output']).each_with_index do |line, i|
    next unless line.is_a?(String)

    text_rule.call(line, "output/#{i}", :prose)
    ctx[:products].each do |name|
      realism_problem(problems, file, ids, "output/#{i}", 'real_product_name') if realism_whole_word?(line, name)
    end
  end
end

# ---- the index ----------------------------------------------------------------------------------

def realism_form(entry)
  mod = entry['module'].to_s.split('/')
  "advisories #{Array(entry['advisories']).length}, output #{Array(entry['output']).length}, #{mod.first}/#{mod.length}"
end

# The identity of an entry: a short digest of the fields that say what the id means (title, module, script).
# The index holds the digest, never the text. An id whose identity changes has been reused.
def realism_identity(entry)
  Digest::SHA256.hexdigest([entry['title'], entry['module'], entry['script']].map(&:to_s).join("\0"))[0, 12]
end

# The content freeze: a short digest of the fields a shipped scenario relies on (advisories and output).
# `-` in the index means not frozen yet. The index holds the digest, never the text.
def realism_content(entry)
  Digest::SHA256.hexdigest(JSON.generate([Array(entry['advisories']), Array(entry['output'])]))[0, 12]
end

# A row: | id | file | form | scenarios | identity | content |
# The identity cell is optional in a legacy index and the content cell in a five-column one.
INDEX_ROW = %r{\A\|\s*([a-z][a-z0-9_]*)\s*\|\s*([^|]*?)\s*\|\s*(advisories \d+, output \d+, [a-z]+/\d+)\s*\|\s*([^|]*?)\s*\|(?:\s*([0-9a-f]{12})\s*\|(?:\s*([0-9a-f]{12}|-)\s*\|)?)?\s*\z}.freeze
INDEX_HEADER = /\A\|\s*id\s*\|/.freeze
INDEX_RULER = /\A\|[\s|:-]+\z/.freeze

# [rows, unreadable]: rows is { id => { form:, identity:, content: } }; unreadable is the 1-based numbers of table lines
# that are neither the header, the ruler nor a readable row. A missing file reads as nil.
def realism_read_index(path)
  return nil unless path && File.exist?(path)

  rows = {}
  unreadable = []
  five = false
  six = false
  File.readlines(path).each_with_index do |line, i|
    line = line.chomp.lstrip
    next unless line.start_with?('|')

    if line =~ INDEX_HEADER
      columns = line.split('|').length
      five = columns > 5 # a five-column file: every row needs its identity cell
      six = columns > 6 # a six-column file: every row needs its content cell too
      next
    end
    next if line =~ INDEX_RULER

    m = line.match(INDEX_ROW)
    if m && !rows.key?(m[1]) && !(five && m[5].nil?) && !(six && m[6].nil?)
      rows[m[1]] = { form: m[3], identity: m[5], content: m[6] }
    else
      unreadable << (i + 1)
    end
  end
  [rows, unreadable]
end

# `unreadable`, when given, collects the names of scenarios that hold a realism link but could not be read.
def realism_scenario_links(scenarios_dir, unreadable = nil)
  links = Hash.new { |h, k| h[k] = [] }
  return links unless scenarios_dir && Dir.exist?(scenarios_dir)

  Dir.glob(File.join(scenarios_dir, '*', 'scenario.json{.erb,}')).sort.each do |path|
    text = File.read(path)
    next unless text.include?('"realism"')

    name = File.basename(File.dirname(path))
    json = path.end_with?('.erb') ? BreakEscape::ScenarioBinding.render(text, {}) : text
    realism_collect_links(JSON.parse(json)) { |id| links[id] << name unless links[id].include?(name) }
  rescue StandardError
    unreadable << name if unreadable && name
    next
  end
  links
end

def realism_collect_links(node, &block)
  case node
  when Hash
    %w[weaknesses decoys].each do |key|
      Array(node[key]).each { |f| yield f['realism'] if f.is_a?(Hash) && f['realism'].is_a?(String) }
    end
    node.each_value { |v| realism_collect_links(v, &block) }
  when Array
    node.each { |v| realism_collect_links(v, &block) }
  end
end

# `old` is the rows of the index being replaced: a digest a row has is kept. A row without one gets a digest
# when at least one linking scenario folder is not a test folder (its name does not start with `test_`).
def realism_content_cell(id, entry, links, old)
  held = old && old[id] && old[id][:content]
  return held if held && held != '-'

  links[id].any? { |name| !name.start_with?('test_') } ? realism_content(entry) : '-'
end

def realism_index_text(map, files, links, old = nil)
  lines = [
    '# Realism catalog index',
    '',
    'Generated by `ruby scripts/validate_realism_catalog.rb`. Do not edit by hand. It holds catalog ids,',
    'their file, their form, the scenarios that link them, an identity digest (of title, module and script)',
    'and a content digest (of advisories and output; `-` until a scenario that is not a test scenario links',
    'the id, then frozen for good), and no catalog text. Ids are append-only: an id is never removed or',
    'renamed, its form never changes, and it never gets a new meaning (a new meaning is a new id). Once the',
    'catalog holds entries this file must exist; the validator fails closed when it is missing or a row',
    'cannot be read.',
    '',
    '| id | file | form | scenarios | identity | content |',
    '| --- | --- | --- | --- | --- | --- |'
  ]
  map.keys.sort.each do |id|
    scenarios = links[id].sort
    lines << "| #{id} | #{files[id]} | #{realism_form(map[id])} | #{scenarios.empty? ? '-' : scenarios.join(', ')} | #{realism_identity(map[id])} | #{realism_content_cell(id, map[id], links, old)} |"
  end
  "#{lines.join("\n")}\n"
end

# Commits (full history) that ever held the index file, or :shallow when the checkout lacks history, or nil
# when the index is not inside a git work tree (a scratch copy). `--first-index` is allowed only on nil or [].
def realism_index_history(index_path)
  dir = File.dirname(File.expand_path(index_path))
  return nil unless Dir.exist?(dir)

  inside, st = Open3.capture2('git', 'rev-parse', '--is-inside-work-tree', chdir: dir, err: File::NULL)
  return nil unless st.success? && inside.strip == 'true'

  shallow, = Open3.capture2('git', 'rev-parse', '--is-shallow-repository', chdir: dir, err: File::NULL)
  return :shallow if shallow.strip == 'true'

  revs, st = Open3.capture2('git', 'log', '--full-history', '--format=%H', '--', File.expand_path(index_path), chdir: dir, err: File::NULL)
  st.success? ? revs.split : :shallow
end

# ---- the whole catalog --------------------------------------------------------------------------

# Returns the problems (RealismProblem). Pass `write_index: true` to rewrite the index when there are none.
def check_realism_catalog(dir = REALISM_CATALOG_DIR, index_path: REALISM_INDEX_PATH, nicknames_path: REALISM_NICKNAMES_PATH,
                          products_path: REALISM_PRODUCTS_PATH, schema_path: REALISM_SCHEMA_PATH,
                          scenarios_dir: REALISM_SCENARIOS_DIR, write_index: false, first_index: false,
                          mirror_exempt: REALISM_MIRROR_EXEMPT)
  problems = []
  schema = JSON.parse(File.read(schema_path))
  scenario_schema = JSON.parse(File.read(REALISM_SCENARIO_SCHEMA_PATH))
  classes = scenario_schema.dig('definitions', 'weakness', 'properties', 'class', 'enum') || []
  read = realism_read_index(index_path)
  ctx = { nicknames: realism_word_list(nicknames_path), products: realism_word_list(products_path), classes: classes,
          exempt: mirror_exempt }

  map = {}
  files = {}
  modules = {}
  Dir.glob(File.join(dir, '*.json')).sort.each do |path|
    file = File.basename(path)
    data = realism_check_file(path, problems, schema)
    next unless data && data['entries'].is_a?(Hash)

    data['entries'].each_with_index do |(id, entry), i|
      label = realism_id_label(id, i + 1)
      realism_problem(problems, file, label, 'id', 'duplicate_id') if map.key?(id)
      if entry.is_a?(Hash) && entry['module'].is_a?(String)
        realism_problem(problems, file, label, 'module', 'duplicate_module') if modules.key?(entry['module'])
        modules[entry['module']] = true
      end
      next if map.key?(id)

      map[id] = entry
      files[id] = file
      realism_check_entry(file, id, entry, problems, ctx)
    end
  end

  if first_index && index_path
    history = realism_index_history(index_path)
    if history == :shallow
      realism_problem(problems, 'index', '-', '(history)', 'first_index_history_unknown')
    elsif history && !history.empty?
      realism_problem(problems, 'index', '-', '(history)', 'first_index_refused')
    end
  end

  if read.nil?
    # Fail closed: with entries in the catalog, a missing index would let any removal pass unseen.
    realism_problem(problems, 'index', '-', '(file)', 'index_missing') if index_path && !map.empty? && !first_index
  else
    rows, unreadable = read
    unreadable.each { |n| realism_problem(problems, 'index', "line #{n}", '(row)', 'index_row_unreadable') }
    rows.each do |id, row|
      entry = map[id]
      if entry.nil?
        realism_problem(problems, 'index', id, '(entry)', 'index_id_missing')
      elsif entry.is_a?(Hash) && entry['module'].is_a?(String)
        realism_problem(problems, 'index', id, 'form', 'index_form_changed') if realism_form(entry) != row[:form]
        if row[:identity] && realism_identity(entry) != row[:identity]
          realism_problem(problems, 'index', id, 'identity', 'index_identity_changed')
        end
        if row[:content] && row[:content] != '-' && realism_content(entry) != row[:content]
          realism_problem(problems, 'index', id, 'content', 'index_content_changed')
        end
      end
    end
  end

  if write_index && problems.none? { |p| p.level == :error } && index_path && (read || first_index || map.empty?)
    unreadable = []
    links = realism_scenario_links(scenarios_dir, unreadable)
    # A scenario that links entries but cannot be read would show as unlinked: do not write that index.
    unreadable.each { |name| realism_problem(problems, 'scenarios', name, '(scenario)', 'scenario_unreadable') }
    File.write(index_path, realism_index_text(map, files, links, read&.first)) if unreadable.empty?
  end
  problems
end

# The index text the validator would write for a catalog folder (tests).
def realism_index_for(dir = REALISM_CATALOG_DIR, scenarios_dir: REALISM_SCENARIOS_DIR, index_path: nil)
  map = {}
  files = {}
  Dir.glob(File.join(dir, '*.json')).sort.each do |path|
    JSON.parse(File.read(path))['entries'].each do |id, entry|
      map[id] ||= entry
      files[id] ||= File.basename(path)
    end
  end
  realism_index_text(map, files, realism_scenario_links(scenarios_dir), realism_read_index(index_path)&.first)
end

if $PROGRAM_NAME == __FILE__
  opts = { dir: REALISM_CATALOG_DIR, index: REALISM_INDEX_PATH, scenarios: REALISM_SCENARIOS_DIR }
  OptionParser.new do |o|
    o.on('--dir DIR') { |v| opts[:dir] = v }
    o.on('--index FILE') { |v| opts[:index] = v }
    o.on('--scenarios DIR') { |v| opts[:scenarios] = v }
    o.on('--first-index', 'write the index although it does not exist yet (the very first run only)') { opts[:first] = true }
  end.parse!
  problems = check_realism_catalog(opts[:dir], index_path: opts[:index], scenarios_dir: opts[:scenarios], write_index: true,
                                   first_index: opts[:first] || false)
  problems.each { |p| puts p }
  if problems.any? { |p| p.level == :error }
    puts 'Realism catalog does not validate; the index was not rewritten.'
    exit 1
  end
  puts 'Realism catalog is clean; index written.'
end
