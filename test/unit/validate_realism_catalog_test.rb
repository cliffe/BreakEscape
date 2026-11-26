# frozen_string_literal: true

require 'test_helper'
require 'json'
require 'tmpdir'
require 'fileutils'
require 'open3'
require_relative '../../scripts/validate_realism_catalog'

# The realism catalog validator and the text rules (S6 unit 20), over the committed catalog and the
# invented fixtures under test/fixtures/realism_catalog/catalog_faults/.
class ValidateRealismCatalogTest < ActiveSupport::TestCase
  ROOT = File.expand_path('../..', __dir__)
  FAULTS = File.join(ROOT, 'test/fixtures/realism_catalog/catalog_faults')
  EXPECTED = JSON.parse(File.read(File.join(FAULTS, 'EXPECTED.json')))
  SCRIPT = File.join(ROOT, 'scripts/validate_realism_catalog.rb')
  NO_SCENARIOS = File.join(FAULTS, 'no_scenarios_here')

  def run_check(name, index: nil)
    dir = File.join(FAULTS, name)
    opts = { scenarios_dir: NO_SCENARIOS }
    idx = File.join(dir, 'index.md')
    opts[:index_path] = index || (File.exist?(idx) ? idx : File.join(dir, 'no_index.md'))
    opts[:first_index] = true unless index || File.exist?(idx) # a fixture without an index is a first run
    %w[nicknames products].each do |kind|
      path = File.join(dir, "#{kind}.txt")
      opts[:"#{kind}_path"] = path if File.exist?(path)
    end
    opts[:nicknames_path] ||= File.join(dir, 'none.txt')
    list = File.join(dir, 'mirror_exempt.txt')
    opts[:mirror_exempt] = File.read(list).split if File.exist?(list)
    check_realism_catalog(dir, **opts)
  end

  def errors(problems)
    problems.select { |p| p.level == :error }
  end

  def fixture_strings(dir)
    out = []
    Dir.glob(File.join(dir, '*.json')).each do |f|
      realism_quiet_parse(File.read(f))['entries'].to_h.each_value do |e|
        next unless e.is_a?(Hash)

        out << e['title'] << e['module'] << e['script'] << Array(e['advisories']) << Array(e['output'])
      end
    end
    out.flatten.compact.select { |s| s.length >= 6 }
  end

  test 'every file of the real catalog folder passes' do
    problems = check_realism_catalog
    assert_empty errors(problems).map(&:to_s)
  end

  test 'the committed index equals what the validator would write and holds no catalog string' do
    text = File.read(REALISM_INDEX_PATH)
    assert_equal realism_index_for, text, 'rerun scripts/validate_realism_catalog.rb'
    Dir.glob(File.join(REALISM_CATALOG_DIR, '*.json')).each do |f|
      JSON.parse(File.read(f))['entries'].each_value do |e|
        ([e['title'], e['module'], e['script']] + Array(e['advisories']) + Array(e['output'])).each do |s|
          assert_not_includes text, s
        end
      end
    end
  end

  test 'the training fixtures are of one form and use only invented advisory ids' do
    data = JSON.parse(File.read(File.join(REALISM_CATALOG_DIR, 'training_fixtures.json')))['entries']
    assert_equal 3, data.length
    assert_equal 1, data.values.map { |e| realism_form(e) }.uniq.length
    data.each_value do |e|
      e['advisories'].each { |a| assert_match(/\ACVE-0000-\d+\z/, a) }
    end
  end

  # demo_ops_terminal shows the Terminal's realism text on the invented FileHold
  # entries; the owner accepted that this freezes their content (2026-11-25,
  # SHOWCASE_TOUR_PLAN decision 1). No other non-test scenario may link them.
  FIXTURE_SHOWCASES = %w[demo_ops_terminal].freeze

  test 'only test scenarios and the approved showcase link entries of the training fixtures' do
    ids = JSON.parse(File.read(File.join(REALISM_CATALOG_DIR, 'training_fixtures.json')))['entries'].keys
    links = realism_scenario_links(REALISM_SCENARIOS_DIR)
    ids.each do |id|
      links[id].each do |name|
        next if FIXTURE_SHOWCASES.include?(name)

        assert_match(/\Atest_/, name, "#{id} linked from a non-test scenario")
      end
    end
  end

  EXPECTED.each do |name, (rule, field)|
    test "fault #{name} is reported with its rule and field" do
      problems = errors(run_check(name))
      hit = problems.find { |p| p.rule == rule && p.field == field }
      assert hit, "expected #{rule} on #{field} in #{name}, got #{problems.map(&:to_s)}"
      strings = fixture_strings(File.join(FAULTS, name))
      problems.each do |p|
        message = p.to_s
        assert_includes message, p.file
        assert_includes message, p.rule
        strings.each { |s| assert_not_includes message, s }
      end
    end
  end

  Dir.children(FAULTS).grep(/\Apass_/).each do |name|
    test "passing fixture #{name} has no error" do
      assert_empty errors(run_check(name)).map(&:to_s)
    end
  end

  %w[index_missing_id index_form_changed].each do |name|
    test "the command line leaves the index unchanged for #{name}" do
      Dir.mktmpdir do |tmp|
        index = File.join(tmp, 'index.md')
        FileUtils.cp(File.join(FAULTS, name, 'index.md'), index)
        before = File.binread(index)
        out, status = Open3.capture2e('ruby', SCRIPT, '--dir', File.join(FAULTS, name), '--index', index,
                                      '--scenarios', NO_SCENARIOS, chdir: ROOT)
        assert_not status.success?, out
        assert_equal before, File.binread(index)
      end
    end
  end

  test 'the command line writes the index for an added id' do
    Dir.mktmpdir do |tmp|
      index = File.join(tmp, 'index.md')
      FileUtils.cp(File.join(FAULTS, 'pass_added_id', 'index.md'), index)
      out, status = Open3.capture2e('ruby', SCRIPT, '--dir', File.join(FAULTS, 'pass_added_id'), '--index', index,
                                    '--scenarios', NO_SCENARIOS, chdir: ROOT)
      assert status.success?, out
      text = File.read(index)
      assert_includes text, 'added_note'
      assert_includes text, 'sample_note'
    end
  end

  # ---- the index fails closed (R1-S2) ---------------------------------------------------------

  def copy_catalog(tmp, name = 'pass_ordinary')
    dir = File.join(tmp, 'cat')
    FileUtils.mkdir_p(dir)
    FileUtils.cp(Dir.glob(File.join(FAULTS, name, '*.json')), dir)
    index = File.join(tmp, 'index.md')
    problems = check_realism_catalog(dir, index_path: index, scenarios_dir: NO_SCENARIOS, write_index: true, first_index: true)
    assert_empty errors(problems).map(&:to_s)
    [dir, index]
  end

  def check_copy(dir, index)
    errors(check_realism_catalog(dir, index_path: index, scenarios_dir: NO_SCENARIOS)).map(&:rule)
  end

  def edit_entries(dir)
    file = Dir.glob(File.join(dir, '*.json')).first
    data = JSON.parse(File.read(file))
    yield data['entries']
    File.write(file, JSON.generate(data))
  end

  test 'a missing index is an error and nothing is written unless --first-index is given' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      File.delete(index)
      assert_equal ['index_missing'], check_copy(dir, index)
      out, status = Open3.capture2e('ruby', SCRIPT, '--dir', dir, '--index', index, '--scenarios', NO_SCENARIOS, chdir: ROOT)
      assert_not status.success?, out
      assert_not File.exist?(index)
      out, status = Open3.capture2e('ruby', SCRIPT, '--dir', dir, '--index', index, '--scenarios', NO_SCENARIOS, '--first-index', chdir: ROOT)
      assert status.success?, out
      assert File.exist?(index)
    end
  end

  test 'a scenario that links entries but cannot be read stops the index being written' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      scen = File.join(tmp, 'scen', 'broken_one')
      FileUtils.mkdir_p(scen)
      File.write(File.join(scen, 'scenario.json'), '{ "realism": ')
      before = File.binread(index)
      problems = check_realism_catalog(dir, index_path: index, scenarios_dir: File.join(tmp, 'scen'), write_index: true)
      assert(errors(problems).any? { |p| p.rule == 'scenario_unreadable' && p.id == 'broken_one' })
      assert_equal before, File.binread(index)
    end
  end

  test 'a hand-edited row that can no longer be read is an error, not a skipped row' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      text = File.read(index)
      File.write(index, text.sub(/advisories \d+, /, 'advisories one, '))
      assert_includes check_copy(dir, index), 'index_row_unreadable'
      # the same edit together with the removal of that id from the catalog is still an error
      edit_entries(dir) { |e| e.delete('sample_note') }
      assert_includes check_copy(dir, index), 'index_row_unreadable'
    end
  end

  test 'a removed id and a renamed id are errors' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      edit_entries(dir) { |e| e.delete('other_note') }
      assert_equal ['index_id_missing'], check_copy(dir, index)
      dir2, index2 = copy_catalog(File.join(tmp, 'two').tap { |d| FileUtils.mkdir_p(d) })
      edit_entries(dir2) { |e| e['renamed_note'] = e.delete('other_note') }
      assert_equal ['index_id_missing'], check_copy(dir2, index2)
    end
  end

  test 'an id reused with new text is an error even when the form is unchanged' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      edit_entries(dir) do |e|
        e['sample_note']['title'] = 'Quillmark gateway wholly different note'
        e['sample_note']['module'] = 'auxiliary/gather/quillmark/different_one'
        e['sample_note']['script'] = 'quillmark-different'
      end
      assert_equal ['index_identity_changed'], check_copy(dir, index)
      # a change of the advisories or the output alone is not a reuse
      dir2, index2 = copy_catalog(File.join(tmp, 'two').tap { |d| FileUtils.mkdir_p(d) })
      edit_entries(dir2) { |e| e['sample_note']['output'] = ['State: another state line.', 'Disclosed: 0000-02-02.'] }
      assert_empty check_copy(dir2, index2)
    end
  end

  test 'the written index carries an identity digest and no catalog text' do
    Dir.mktmpdir do |tmp|
      _dir, index = copy_catalog(tmp)
      rows = File.readlines(index).grep(/\A\| (sample|other)_note/)
      assert_equal 2, rows.length
      rows.each { |r| assert_match(/\| [0-9a-f]{12} \| (?:[0-9a-f]{12}|-) \|\s*\z/, r) }
      assert_not_includes File.read(index), 'Quillmark'
    end
  end

  # ---- the mirror rule and the content freeze (follow-up B5) ----------------------------------

  def link_scenarios(tmp, links)
    root = File.join(tmp, 'scen')
    links.each do |name, ids|
      FileUtils.mkdir_p(File.join(root, name))
      weaknesses = ids.map { |id| { 'realism' => id } }
      File.write(File.join(root, name, 'scenario.json'), JSON.generate('rooms' => { 'a' => { 'weaknesses' => weaknesses } }))
    end
    root
  end

  def write_index(dir, index, scenarios)
    problems = check_realism_catalog(dir, index_path: index, scenarios_dir: scenarios, write_index: true)
    assert_empty errors(problems).map(&:to_s)
  end

  def row_of(index, id)
    File.readlines(index).find { |l| l.start_with?("| #{id} ") }
  end

  def check_with(dir, index, scenarios)
    errors(check_realism_catalog(dir, index_path: index, scenarios_dir: scenarios)).map { |p| [p.rule, p.field] }
  end

  test 'a script that mirrors its id is an error unless the id already has a row in the index' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      assert_empty check_copy(dir, index)
      # an id with no row is not exempt, however the look-alike is spelt
      { 'fresh_note' => 'fresh-note', 'plain_note' => 'plainnote' }.each do |id, script|
        edit_entries(dir) do |e|
          e[id] = e['other_note'].merge('module' => "auxiliary/gather/quillmark/#{id}", 'script' => script)
        end
      end
      assert_equal %w[script_mirrors_id] * 2, check_copy(dir, index)
      edit_entries(dir) { |e| e['fresh_note']['script'] = 'fresh-note-tool' }
      assert_equal %w[script_mirrors_id], check_copy(dir, index)
    end
  end

  test 'R1-B4: a row added to the index by hand does not exempt a mirrored script' do
    dir = File.join(FAULTS, 'pass_mirror_in_index')
    problems = errors(check_realism_catalog(dir, index_path: File.join(dir, 'index.md'), scenarios_dir: NO_SCENARIOS,
                                                nicknames_path: File.join(dir, 'none.txt')))
    assert_includes problems.map(&:rule), 'script_mirrors_id'
    assert_equal %w[filehold_link_setting filehold_release_line filehold_update_lag], REALISM_MIRROR_EXEMPT
  end

  test 'a first index cannot exempt a mirrored script' do
    problems = errors(run_check('script_mirrors_id'))
    assert(problems.any? { |p| p.rule == 'script_mirrors_id' && p.field == 'script' })
  end

  test 'a digest is written only for a link from a scenario that is not a test scenario, and it stays' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      only_test = link_scenarios(tmp, 'test_alpha' => %w[sample_note other_note])
      write_index(dir, index, only_test)
      assert_match(/\| - \|\s*\z/, row_of(index, 'sample_note'))
      assert_match(/\| - \|\s*\z/, row_of(index, 'other_note'))

      shipped = link_scenarios(tmp, 'test_alpha' => %w[sample_note], 'm99_real' => %w[sample_note])
      write_index(dir, index, shipped)
      digest = row_of(index, 'sample_note')[/\| ([0-9a-f]{12}) \|\s*\z/, 1]
      assert digest, row_of(index, 'sample_note')
      assert_equal digest, realism_content(JSON.parse(File.read(Dir.glob(File.join(dir, '*.json')).first))['entries']['sample_note'])
      assert_match(/\| - \|\s*\z/, row_of(index, 'other_note'))

      # the link is removed: the digest stays
      write_index(dir, index, NO_SCENARIOS)
      assert_includes row_of(index, 'sample_note'), "| #{digest} |"
    end
  end

  test 'a frozen entry fails when its output or advisories change, and an unfrozen one may change' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      shipped = link_scenarios(tmp, 'm99_real' => %w[sample_note])
      write_index(dir, index, shipped)
      assert_empty check_with(dir, index, shipped)
      edit_entries(dir) { |e| e['sample_note']['output'] = ['State: another state line.', 'Disclosed: 0000-02-02.'] }
      assert_equal [%w[index_content_changed content]], check_with(dir, index, shipped)
      edit_entries(dir) do |e|
        e['sample_note']['output'] = ['State: sample state line.', 'Disclosed: 0000-01-01.']
        e['sample_note']['advisories'] = ['CVE-0000-22222']
      end
      assert_equal [%w[index_content_changed content]], check_with(dir, index, shipped)
      # other_note has a `-` row: its output and advisories may change
      edit_entries(dir) do |e|
        e['sample_note']['advisories'] = ['CVE-0000-11111']
        e['other_note']['output'] = ['State: changed line.']
        e['other_note']['advisories'] = ['CVE-0000-33333', 'CVE-0000-44444']
      end
      assert_empty check_with(dir, index, shipped)
    end
  end

  test 'a five-column index still reads and is written back with six columns; a six-column row needs its content cell' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      lines = File.readlines(index).map do |l|
        l.sub(/ \| (?:[0-9a-f]{12}|-) \|\s*\z/, " |\n").sub('| identity | content |', '| identity |').sub('| --- | --- | --- | --- | --- | --- |', '| --- | --- | --- | --- | --- |')
      end
      File.write(index, lines.join)
      assert_empty check_copy(dir, index), 'a five-column index reads'
      write_index(dir, index, NO_SCENARIOS)
      assert_includes File.read(index), '| identity | content |'
      assert_match(/\| [0-9a-f]{12} \| - \|\s*\z/, row_of(index, 'sample_note'))
      text = File.readlines(index)
      i = text.index { |l| l.start_with?('| sample_note') }
      File.write(index, text.dup.tap { |l| l[i] = l[i].sub(/ \| - \|\s*\z/, " |\n") }.join)
      assert_includes check_copy(dir, index), 'index_row_unreadable'
    end
  end

  test 'the history check finds a digest that was cleared or changed' do
    Dir.mktmpdir do |tmp|
      repo = File.join(tmp, 'repo')
      FileUtils.mkdir_p(File.join(repo, 'docs'))
      dir, index = copy_catalog(tmp)
      shipped = link_scenarios(tmp, 'm99_real' => %w[sample_note])
      write_index(dir, index, shipped)
      path = File.join(repo, 'docs/REALISM_CATALOG_INDEX.md')
      git(repo, 'init', '-q')
      FileUtils.cp(index, path)
      git(repo, 'add', '.')
      git(repo, 'commit', '-q', '-m', 'index with a digest')
      assert_empty index_history_problems(repo)
      original = File.read(path)
      File.write(path, original.sub(/ \| [0-9a-f]{12} \|(\s*)\z/, ' | - |\1'))
      assert(index_history_problems(repo).any? { |m| m.include?('sample_note') && m.include?('content') })
      File.write(path, original.sub(/ \| [0-9a-f]{12} \|(\s*)\z/, ' | aaaaaaaaaaaa |\1'))
      assert(index_history_problems(repo).any? { |m| m.include?('sample_note') && m.include?('content') })
      File.write(path, original)
      assert_empty index_history_problems(repo)
    end
  end

  # Every earlier committed version of the index: each id, form and identity in it is still in the index now
  # (a hand-edited or regenerated index cannot drop or change a row of the history). It needs full history:
  # a shallow checkout is an error, not a pass (R2-2). Returns the problems found in the repository at `root`.
  def index_history_problems(root, rel = 'docs/REALISM_CATALOG_INDEX.md')
    shallow, = Open3.capture2('git', 'rev-parse', '--is-shallow-repository', chdir: root, err: File::NULL)
    if shallow.strip == 'true'
      return ['shallow checkout: the index history is missing; fetch full history (for CI, fetch-depth: 0)']
    end

    revs, status = Open3.capture2('git', 'log', '--full-history', '--format=%H', '--', rel, chdir: root, err: File::NULL)
    return ['git log failed'] unless status.success?

    now = realism_read_index(File.join(root, rel))&.first || {}
    problems = []
    revs.split.each do |rev|
      text, st = Open3.capture2('git', 'show', "#{rev}:#{rel}", chdir: root, err: File::NULL)
      next unless st.success?

      Dir.mktmpdir do |tmp|
        file = File.join(tmp, 'old.md')
        File.write(file, text)
        realism_read_index(file).first.each do |id, row|
          problems << "#{id} was in the index at #{rev[0, 9]} and is gone" unless now.key?(id)
          next unless now.key?(id)

          problems << "#{id} changed form since #{rev[0, 9]}" if row[:form] != now[id][:form]
          problems << "#{id} changed identity since #{rev[0, 9]}" if row[:identity] && row[:identity] != now[id][:identity]
          if row[:content] && row[:content] != '-' && row[:content] != now[id][:content]
            problems << "#{id} changed content since #{rev[0, 9]}"
          end
        end
      end
    end
    problems
  end

  test 'every row of every earlier committed index is still in the index' do
    _out, status = Open3.capture2('git', 'rev-parse', '--git-dir', chdir: ROOT, err: File::NULL)
    skip 'not a git work tree' unless status.success?
    assert_empty index_history_problems(ROOT)
  end

  def git(dir, *args)
    out, st = Open3.capture2e('git', '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', *args, chdir: dir)
    assert st.success?, out
    out
  end

  # A scratch repository with two commits that hold an index (the second adds a row).
  def scratch_repo(tmp)
    repo = File.join(tmp, 'repo')
    FileUtils.mkdir_p(File.join(repo, 'docs'))
    dir, index = copy_catalog(tmp)
    git(repo, 'init', '-q')
    FileUtils.cp(index, File.join(repo, 'docs/REALISM_CATALOG_INDEX.md'))
    git(repo, 'add', '.')
    git(repo, 'commit', '-q', '-m', 'index one')
    File.write(File.join(repo, 'other.txt'), 'x')
    git(repo, 'add', '.')
    git(repo, 'commit', '-q', '-m', 'second')
    [repo, dir, index]
  end

  test 'the history check passes on full history and finds a dropped row' do
    Dir.mktmpdir do |tmp|
      repo, = scratch_repo(tmp)
      assert_empty index_history_problems(repo)
      path = File.join(repo, 'docs/REALISM_CATALOG_INDEX.md')
      kept = File.readlines(path).reject { |l| l.start_with?('| sample_note') }
      File.write(path, kept.join)
      assert(index_history_problems(repo).any? { |m| m.include?('sample_note') && m.include?('is gone') })
    end
  end

  test 'the history check is an error, not a pass, in a shallow checkout' do
    Dir.mktmpdir do |tmp|
      repo, = scratch_repo(tmp)
      clone = File.join(tmp, 'shallow')
      out, st = Open3.capture2e('git', 'clone', '-q', '--depth', '1', "file://#{repo}", clone)
      assert st.success?, out
      problems = index_history_problems(clone)
      assert(problems.any? { |m| m.include?('shallow checkout') }, problems.inspect)
    end
  end

  test '--first-index is refused when an earlier commit held an index, and in a shallow checkout' do
    Dir.mktmpdir do |tmp|
      repo, dir, = scratch_repo(tmp)
      path = File.join(repo, 'docs/REALISM_CATALOG_INDEX.md')
      File.delete(path)
      problems = check_realism_catalog(dir, index_path: path, scenarios_dir: NO_SCENARIOS, write_index: true, first_index: true)
      assert_equal ['first_index_refused'], errors(problems).map(&:rule)
      assert_not File.exist?(path), 'no index is written'
      out, status = Open3.capture2e('ruby', SCRIPT, '--dir', dir, '--index', path, '--scenarios', NO_SCENARIOS, '--first-index', chdir: ROOT)
      assert_not status.success?, out
      assert_not File.exist?(path)

      git(repo, 'checkout', '-q', '--', 'docs')
      clone = File.join(tmp, 'shallow')
      _o, st = Open3.capture2e('git', 'clone', '-q', '--depth', '1', "file://#{repo}", clone)
      assert st.success?
      cpath = File.join(clone, 'docs/REALISM_CATALOG_INDEX.md')
      File.delete(cpath)
      problems = check_realism_catalog(dir, index_path: cpath, scenarios_dir: NO_SCENARIOS, write_index: true, first_index: true)
      assert_equal ['first_index_history_unknown'], errors(problems).map(&:rule)
    end
  end

  test '--first-index still works where no commit ever held an index' do
    Dir.mktmpdir do |tmp|
      repo = File.join(tmp, 'repo')
      FileUtils.mkdir_p(File.join(repo, 'docs'))
      git(repo, 'init', '-q')
      File.write(File.join(repo, 'a.txt'), 'x')
      git(repo, 'add', '.')
      git(repo, 'commit', '-q', '-m', 'one')
      dir, = copy_catalog(tmp)
      path = File.join(repo, 'docs/REALISM_CATALOG_INDEX.md')
      problems = check_realism_catalog(dir, index_path: path, scenarios_dir: NO_SCENARIOS, write_index: true, first_index: true)
      assert_empty errors(problems).map(&:to_s)
      assert File.exist?(path)
    end
  end

  test 'a five-column index row with its identity cell removed, or indented, is unreadable' do
    Dir.mktmpdir do |tmp|
      dir, index = copy_catalog(tmp)
      lines = File.readlines(index)
      i = lines.index { |l| l.start_with?('| sample_note') }
      File.write(index, lines.dup.tap { |l| l[i] = l[i].sub(/ \| [0-9a-f]{12} \| (?:[0-9a-f]{12}|-) \|\s*\z/, " |\n") }.join)
      assert_includes check_copy(dir, index), 'index_row_unreadable'
      File.write(index, lines.dup.tap { |l| l[i] = " #{l[i]}" }.join)
      assert_empty check_copy(dir, index), 'an indented but intact row is read'
      File.write(index, lines.dup.tap { |l| l.delete_at(i) }.then { |l| l.insert(i, " | gone_note | f.json | advisories 1, output 1, a/1 | - | 0123456789ab | - |\n") }.join)
      assert_includes check_copy(dir, index), 'index_id_missing'
    end
  end

  test 'a message never quotes a catalog string even for a bad id' do
    Dir.mktmpdir do |tmp|
      File.write(File.join(tmp, 'a.json'), JSON.generate('entries' => { 'Bad Id!' => { 'title' => 't', 'module' => 'auxiliary/a/b', 'script' => 'x' } }))
      problems = check_realism_catalog(tmp, index_path: File.join(tmp, 'none.md'), scenarios_dir: NO_SCENARIOS)
      assert errors(problems).any? { |p| p.rule == 'id_form' }
      problems.each { |p| assert_not_includes p.to_s, 'Bad Id' }
    end
  end

  test 'a parse error is named by file' do
    Dir.mktmpdir do |tmp|
      File.write(File.join(tmp, 'broken.json'), '{ not json')
      problems = check_realism_catalog(tmp, index_path: File.join(tmp, 'none.md'), scenarios_dir: NO_SCENARIOS)
      assert(problems.any? { |p| p.rule == 'parse_error' && p.file == 'broken.json' })
    end
  end

  # ---- the text rules -------------------------------------------------------------------------

  def rules(text, kind: :prose)
    RealismTextRules.errors(text, kind: kind).map(&:rule)
  end

  test 'text rules refuse a line that reads as a step or a request form' do
    {
      'State: send an oversized name field to the sign-in form to trigger it.' => 'instruction',
      'Run the check twice, then request the admin page with a blank session.' => 'instruction',
      'Check it twice, then send the long name.' => 'instruction',
      'Type the long name into the box' => 'instruction',
      'The shellcode is large' => 'instruction',
      'A payload of 400 bytes' => 'instruction',
      'GET cgi-bin/status.php returns the build' => 'instruction',
      'Request index.php?id=1 shows the error' => 'instruction',
      'POST to api/login with a long name' => 'instruction',
      'The page cgi-bin/status.php shows the build' => 'request_form',
      'Seen at status/page?name=x here' => 'request_form',
      'Options (-sV) give more' => 'flag',
      'etc/shadow readable' => 'request_form',
      # R2-6: steps the first rules passed
      'Please send an oversized name field' => 'instruction', 'First send a long name' => 'instruction',
      'Next, run the check' => 'instruction', 'You can request the admin page blank' => 'instruction',
      'Use a blank session on the admin page' => 'instruction', 'Submit a long name to the form' => 'instruction',
      'Open the admin page with no session' => 'instruction', 'Append two dots to the name' => 'instruction',
      'Log in with a blank password' => 'instruction', 'api/login takes a long name' => 'request_form',
      'cgi-bin/status shows it' => 'request_form', 'id=1 shows error' => 'request_form',
      # R3-1: steps written without an article
      'Send oversized name field' => 'instruction', 'Send 300 characters in the name' => 'instruction',
      'Run check twice' => 'instruction', 'Request admin page with blank session' => 'instruction',
      'Enter 300 letters as name' => 'instruction', 'Upload large file' => 'instruction',
      'Set name longer than 64' => 'instruction', 'Type admin as user' => 'instruction',
      'Supply empty token' => 'instruction', 'Bypass login with blank name' => 'instruction',
      'Overflow name field' => 'instruction', 'Inject long name' => 'instruction',
      'Trigger fault with long name' => 'instruction', 'Then send long name' => 'instruction',
      'State: send long name' => 'instruction', 'Delete session cookie' => 'instruction',
      'Put long name in field' => 'instruction', 'Post long name to form' => 'instruction',
      'Craft long name' => 'instruction', 'Execute check as guest' => 'instruction',
      'Use blank password' => 'instruction', 'Submit long name twice' => 'instruction',
      'Visit admin page' => 'instruction', 'Open admin page with no session' => 'instruction',
      'Append dots to name' => 'instruction', 'Type 2 device' => 'instruction', 'Set 3 of 5 loaded' => 'instruction',
      'Try a blank password' => 'instruction', 'Leave the password blank' => 'instruction',
      'Just send a long name' => 'instruction', 'You must send a long name' => 'instruction'
    }.each do |text, rule|
      assert_includes rules(text), rule, text
    end
  end

  test 'text rules pass honest state, version and date lines' do
    ['State: update lag of two releases.', 'State: release line is behind.', 'Disclosed: 0000-01-01.', 'Type: file share',
     'Settings are shared', 'Getting older', 'Posted notice is stale', 'Update service is running, then restarts',
     'TCP/IP', 'HTTP/1.1', 'Users/groups listed', 'Release line 2.4.x is behind', 'FileHold 3.2 ready, e.g. for guests',
     'Server time 14:02', 'Server time 14:02:30',
     # R2-5: honest state lines the first rules refused
     'Run level 3 reached', 'Request queue is long', 'Upload limit 20 MB', 'State: upload limit is 20 MB', 'Send queue empty', 'Delete protection on', 'Status: delete pending', 'Execute permission: off',
     'Trigger warnings: none', 'Quillbox/1.x ready', 'HTTP/1.x only', 'SMB/v2.x enabled', 'Opt/out recorded',
     'Boot/recovery mode'].each { |text| assert_empty rules(text), text }
  end

  test 'text rules pass the ordinary look-alikes' do
    [
      'SMB/CIFS', 'TCP/IP', 'HTTP/1.1', 'Guest/anonymous access enabled', 'Anonymous login: allowed',
      'Read/Write/Execute', 'timeout=30', 'SSH host key: RSA', 'Weak TLS 1.0 enabled',
      'Reachable at 10.1.2.3:445', 'Name host01.local', 'Disclosed: 0000-03-14.'
    ].each { |text| assert_empty rules(text), text }
  end

  test 'text rules refuse each bad form' do
    {
      "caf\u00e9" => 'characters', "tab\there" => 'characters', 'back\\slash' => 'backslash',
      'a %41 b' => 'percent_escape', 'v 0x41414141' => 'hex_literal', 'a <b>' => 'angle_bracket',
      'a ; b' => 'shell_metacharacter', 'run --now' => 'flag', 'id 0123456789abcdef' => 'encoded_blob',
      'blob QWxhZGRpbjpvcGVuU2VzYW1lMTI=' => 'encoded_blob', 'see /etc/x' => 'path', 'see ../x' => 'path',
      'see C:/x' => 'path', 'see a/b/' => 'path', 'see etc/a/b' => 'path', 'user:pass' => 'credential',
      'admin/admin' => 'credential', 'password=abc' => 'credential', 'user=bob' => 'credential',
      'host 203.0.113.9' => 'host', 'at http://x' => 'host', 'at www.x' => 'host', 'at quill.example.org' => 'host',
      'a Decoy b' => 'telltale', 'not vulnerable' => 'telltale', 'it is patched' => 'telltale'
    }.each { |text, rule| assert_includes rules(text), rule, text }
  end

  test 'text rules for a module or script join telltale words by underscore or hyphen and refuse equal segments' do
    assert_includes rules('auxiliary/x/fake_thing', kind: :module), 'telltale'
    assert_includes rules('fake-thing', kind: :script), 'telltale'
    assert_includes rules('auxiliary/a/a/b', kind: :module), 'credential'
    assert_empty rules('auxiliary/a/b/c', kind: :module)
  end

  test 'weaker telltale words are warnings and a scenario check returns the fragment' do
    found = RealismTextRules.check('a real thing', kind: :prose, scenario: true)
    assert_equal [:warning], found.map(&:level)
    assert_equal 'real', found.first.fragment
    assert_nil RealismTextRules.check('a real thing').first.fragment
  end
end
