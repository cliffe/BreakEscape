# frozen_string_literal: true

require 'test_helper'
require 'json'
require_relative '../../scripts/validate_realism_skin'

# Stage S6 unit 23: real identifiers live only in the realism catalog. No file in the folder of a scenario
# that declares `services`, and no file of the generated catalog index, holds an advisory id, a framework
# module path or a vulnerability nickname (the default `auxiliary/scanner/<word>/<class>_f<n>` form is
# the one exemption), and nothing under public/ or app/assets/ holds a catalog entry's module.
class RealismSeparationTest < ActiveSupport::TestCase
  ROOT = File.expand_path('../..', __dir__)
  DEFAULT_FORM = %r{\Aauxiliary/scanner/[a-z0-9_]+/[a-z_]+_f\d+\z}.freeze
  TEXT_EXTENSIONS = %w[.json .erb .md .html .ink .js .txt].freeze

  def nick_patterns
    realism_skin_nickname_patterns(realism_word_list(REALISM_NICKNAMES_PATH))
  end

  def readable(path)
    text = File.binread(path).force_encoding('UTF-8')
    text.valid_encoding? ? text : nil
  end

  def real_fragments(text)
    realism_skin_real_ids(text, nick_patterns).reject { |frag| frag =~ DEFAULT_FORM }
  end

  def services_scenarios
    Dir.glob(File.join(ROOT, 'scenarios/*/scenario.json.erb')).select { |file| File.read(file).include?('"services"') }
       .map { |file| File.dirname(file) }.sort
  end

  test 'at least the ops scenarios are found by their services key' do
    names = services_scenarios.map { |dir| File.basename(dir) }
    assert_includes names, 'test_ops_skin'
    assert_includes names, 'test_ops_scan'
  end

  test 'no file in a scenario folder that declares services holds an advisory id, framework path or nickname' do
    problems = []
    services_scenarios.each do |dir|
      Dir.glob(File.join(dir, '**/*')).select { |f| File.file?(f) && TEXT_EXTENSIONS.include?(File.extname(f)) }.each do |file|
        text = readable(file)
        next unless text

        real_fragments(text).each { |frag| problems << "#{file.delete_prefix("#{ROOT}/")}: #{frag.length > 40 ? "#{frag[0, 40]}..." : frag}" }
      end
    end
    assert_empty problems
  end

  test 'the catalog index is clean the same way' do
    index = File.join(ROOT, 'docs/REALISM_CATALOG_INDEX.md')
    assert_equal [], real_fragments(File.read(index))
  end

  test 'the plan and the server review doc hold no listed nickname' do
    docs = %w[docs/achitechture/OPS_REALISM_SKIN_PLAN.md docs/agents/ops_core_build/reviews/S6_server_R1.md]
    problems = []
    docs.each do |rel|
      File.readlines(File.join(ROOT, rel), encoding: 'UTF-8').each_with_index do |line, i|
        problems << "#{rel}:#{i + 1}" if nick_patterns.any? { |pat| line.match?(pat) }
      end
    end
    assert_empty problems
  end

  test 'the scan sees what it is meant to see (a made-up advisory id, a path and a nickname)' do
    assert_not_empty real_fragments('see cve-9999-0001 here')
    assert_not_empty real_fragments('uses exploit/spare/world/probe')
    assert_not_empty real_fragments("the #{File.readlines(REALISM_NICKNAMES_PATH).reject { |l| l.start_with?('#') || l.strip.empty? }.first.strip.tr('_', ' ')} issue")
    assert_empty real_fragments('auxiliary/scanner/storage/unpatched_f1')
    path = %w[exploit area thing probe].join('/')
    assert_not_empty real_fragments("module:#{path}"), 'glued to a label'
    assert_not_empty real_fragments(%("text":"module:#{path}")), 'inside JSON with no space after the colon'
    assert_not_empty real_fragments(path.capitalize), 'capitalised'
    assert_not_empty real_fragments(path.upcase), 'upper case'
  end

  # Test fixtures and the realism tests may hold an advisory-shaped string only when it is plainly invented:
  # an impossible year (0000, 9999, 31), an impossible number (999), or a placeholder tail.
  INVENTED_ID = /\A(cve|can)[-_](0000|9999)[-_]\d+\z|\Ams(31[-_]\d{3}|\d\d[-_]999)\z|\Akb(0000000|9999999)\z|\A(rhsa|dsa|usn)[-_]9999|\A(ghsa|zdi)[-_](00|99|x)/i.freeze

  def uninvented_ids(text)
    text.scan(/(?<![A-Za-z0-9])(?:(?:cve|can)[-_]\d{4}[-_]\d+|ms\d\d[-_]\d{3}|kb\d{6,7}|(?:rhsa|dsa|usn|ghsa|zdi)[-_][A-Za-z0-9][A-Za-z0-9_-]*)/i)
        .reject { |tok| tok =~ INVENTED_ID }
  end

  test 'the invented-id check accepts invented forms and refuses a plausible one' do
    %w[CVE-0000-11111 cve-9999-1 MS31-901 ms99-999 kb9999999 zdi_99 ZDI-00-0001 GHSA-xxxx RHSA-9999].each do |ok|
      assert_empty uninvented_ids(ok), ok
    end
    # Realistic shapes computed at run time from numbers no scheme has issued (a century ahead, a gap year),
    # so no real advisory id is written here, whole or in parts.
    far = Time.now.year + 100
    gap = 45
    ["CVE-#{far}-4242", "MS#{gap}-123", "ZDI-#{gap}-123", "kb#{8_000_000 + 4242}"].each do |bad|
      assert_equal [bad], uninvented_ids(bad), bad
    end
  end

  test 'test fixtures and realism tests hold only plainly invented advisory-shaped strings' do
    files = Dir.glob(File.join(ROOT, 'test/fixtures/realism_catalog/**/*')).select { |f| File.file?(f) } +
            Dir.glob(File.join(ROOT, 'test/{unit,controllers,models,lib,support}/**/*realism*')).select { |f| File.file?(f) } +
            Dir.glob(File.join(ROOT, 'test/**/*{ops_skin,network_skin,network_realism,access_leak_scanner_ops}*')).select { |f| File.file?(f) }
    assert_operator files.length, :>=, 20
    problems = files.uniq.flat_map do |file|
      text = readable(file)
      text ? uninvented_ids(text).map { |tok| "#{file.delete_prefix("#{ROOT}/")}: #{tok}" } : []
    end
    assert_empty problems
  end

  test 'no file under public/ or app/assets/ holds a catalog entry module' do
    modules = BreakEscape::RealismCatalog.entry_ids.filter_map { |id| BreakEscape::RealismCatalog.lookup(id)['module'] }
    assert_operator modules.length, :>=, 3
    problems = []
    %w[public app/assets].each do |folder|
      Dir.glob(File.join(ROOT, folder, '**/*')).select { |f| File.file?(f) }.each do |file|
        next if File.size(file) > 8_000_000

        text = readable(file)
        next unless text

        modules.each { |mod| problems << file.delete_prefix("#{ROOT}/") if text.include?(mod) }
      end
    end
    assert_empty problems.uniq
  end
end
