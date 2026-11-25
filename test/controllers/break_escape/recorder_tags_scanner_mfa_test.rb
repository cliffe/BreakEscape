require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Scanner hardening U1a (was ops follow-up C3, which asserted the scanner ignored the tags): the scanner now reads the
  # recorder's `pc` tag. The rows are the real ones (ops_mfa_real_capture_rows.jsonl, and the two ops_privilege_browser_run
  # files); the only change made is the tag on every POST row of the six PC routes, `{ 'pcId' => <the PC> }`, or `nil` when the
  # recorder could not read the request. A tagged capture is judged with no `--signin` or `--logout` name (and is refused if given
  # one); the same rows with the tags `nil` are judged as the untagged capture is; a tag that names another PC is read, and a
  # tag that names no PC of the scenario is an `ops_tag` finding.
  class RecorderTagsScannerMfaTest < ActiveSupport::TestCase
    FIXTURES = File.expand_path('../../fixtures/files', __dir__)
    NAMES = %w[hana@code_pc1#1 cal@plain_pc#1].freeze
    # The sign-in names the untagged privilege capture needs (as access_leak_scanner_privilege_real_test.rb names them).
    BROWSER_SIGNINS = %w[uma@bay_pc#1 adel@bay_pc#1 adel@bay_pc#2 adel@bay_pc#5].freeze
    PC_ROUTES = %w[login logout lock_session mfa/verify mfa/prompt mfa/approve].freeze
    # The PC each real POST row of the capture names (rows 95, 97, 100 and 107 are at Accounts PC, row 278 at Shipping PC).
    MFA_PCS = { 95 => 'code_pc1', 97 => 'code_pc1', 100 => 'code_pc1', 107 => 'code_pc1', 278 => 'plain_pc' }.freeze

    def scenario(name = 'test_ops_mfa')
      JSON.parse(ScenarioBinding.render(File.read(File.expand_path("../../../scenarios/#{name}/scenario.json.erb", __dir__))))
    end

    def mfa_rows
      File.readlines(File.join(FIXTURES, 'ops_mfa_real_capture_rows.jsonl')).map { |l| JSON.parse(l) }.sort_by { |r| r['n'] }
    end

    # R1-C2: the tag is the recorder's own output (recorder_tag_rows.jsonl, rebuilt and checked by test/js/playtest-session-capture.test.mjs),
    # looked up by PC id; a missing id fails here rather than being made up.
    def recorder_pc_tag(pc_id)
      @recorder_tags ||= File.readlines(File.join(FIXTURES, 'recorder_tag_rows.jsonl')).map { |l| JSON.parse(l) }
      row = @recorder_tags.find { |r| r.dig('pc', 'pcId') == pc_id }
      assert row, "the recorder fixture has no pc tag for #{pc_id}"
      row['pc']
    end

    def pc_route?(row)
      row['method'] == 'POST' && PC_ROUTES.any? { |r| row['path'].end_with?("/#{r}") }
    end

    def tagged(rows, &pc_for)
      rows.map do |row|
        copy = Marshal.load(Marshal.dump(row))
        copy['pc'] = pc_for.call(copy) if pc_route?(copy)
        copy
      end
    end

    def untag(rows)
      rows.map { |r| r.reject { |k, _| k == 'pc' } }
    end

    def scan(rows, data, **opts)
      scanner = AccessLeakScanner.new(data)
      findings = scanner.scan(rows.each_with_index.map { |r, i| ['capture.jsonl', i + 1, r] }, **opts)
      [findings.map { |f| [f.line, f.rule, f.owner, f.route] }, scanner.unused_entries]
    end

    test 'the real MFA capture, tagged with the PC of each row, is judged clean with no names; null tags give the untagged result' do
      plain = mfa_rows
      assert_equal 5, plain.count { |r| pc_route?(r) }, 'the capture holds five POST rows on the PC routes'
      base = scan(plain, scenario, signins: NAMES)
      assert_equal [[], []], base, 'the untagged run with its names is clean'
      bare_base = scan(plain, scenario)
      assert_equal [['mfa_session', 'mfa:session:cal'], ['mfa_session', 'mfa:session:hana']], bare_base.first.map { |f| f[1, 2] }.uniq.sort

      rows = tagged(plain) { |r| recorder_pc_tag(MFA_PCS.fetch(r['n'])) }
      assert_equal 5, rows.count { |r| r.key?('pc') }
      assert_nil AccessLeakScanner.tag_problem({ 'capture.jsonl' => rows }, :required)
      assert_equal [[], []], scan(rows, scenario, tags: :required), 'P1: the tags place the sign-ins, so no --signin name is needed'
      assert_equal [[], []], scan(rows, scenario), 'the library default (:auto) reads them too'
      assert_raises(ArgumentError, 'a name beside a tag is refused') { scan(rows, scenario, signins: NAMES) }
      assert_raises(ArgumentError) { scan(rows, scenario, logouts: ['hana@code_pc1#1']) }
      assert_match(/tagged mode|holds recorder tags/, AccessLeakScanner.tag_problem({ 'capture.jsonl' => rows }, :absent))

      unreadable = tagged(plain) { |_r| nil }
      assert_equal 5, unreadable.count { |r| r.key?('pc') }
      assert_nil AccessLeakScanner.tag_problem({ 'capture.jsonl' => unreadable }, :required)
      assert_equal bare_base, scan(unreadable, scenario), 'null tags place nothing: the result of the untagged run with no names'
      assert_raises(ArgumentError) { scan(unreadable, scenario, signins: NAMES) }

      assert_raises(ArgumentError, 'stripping every tag, with tags required') { scan(untag(rows), scenario, tags: :required) }
      assert_equal bare_base, scan(untag(rows), scenario), 'stripped, :auto reads it as untagged'
    end

    test 'a tag that names a different PC of the scenario is read (and no longer changes nothing); a tag that names no PC is a finding' do
      wrong = tagged(mfa_rows) { |_r| recorder_pc_tag('plain_pc') }
      refute_equal [[], []], scan(wrong, scenario), 'the sign-ins of code_pc1 are no longer placed there'
      rows = tagged(mfa_rows) { |_r| recorder_pc_tag('bay_pc') }
      found = scan(rows, scenario).first
      assert_includes found.map { |f| f[1] }, 'ops_tag'
      assert_equal [], found.select { |f| f[1] == 'ops_tag' && !f[2].start_with?('tag:') }
      assert_empty found.map(&:inspect).grep(/bay_pc/), 'a finding never names the tag value'
    end

    # The next desktop row (a `container/<pc>` answer) after a POST names the PC the request was about; a lock row names it itself.
    def privilege_rows
      %w[ops_privilege_browser_run_1.jsonl ops_privilege_browser_run_2.jsonl].map do |name|
        File.readlines(File.join(FIXTURES, name)).map { |l| JSON.parse(l) }
      end
    end

    # The PC a real POST row was at, as the recorder would have read it from the request: a sign-in is at the PC of the next
    # desktop row of a sign-in PC; a sign-out or lock is at the PC of the latest one before it (the lock answer names it).
    def pc_of_row(rows, i, pcs)
      id = ->(r) { r['method'] == 'GET' ? r['path'][%r{/container/(\w+)\z}, 1] : nil }
      if rows[i]['path'].end_with?('/login')
        ahead = rows[(i + 1)..].map { |r| id.call(r) }.compact.find { |c| pcs.include?(c) }
        ahead || 'bay_pc'
      elsif rows[i]['path'].end_with?('/lock_session')
        rows[i].dig('body', 'pcId')
      else
        rows[0...i].reverse.map { |r| id.call(r) }.compact.find { |c| pcs.include?(c) } || 'bay_pc'
      end
    end

    test 'the real privilege browser capture, tagged, is clean with no names; the untagged one still needs them' do
      files = privilege_rows
      pcs = scenario('test_ops_privilege').then { |d| AccessLeakScanner.new(d).instance_variable_get(:@priv_pcs).keys }
      source = ->(list) { list.each_with_index.flat_map { |rows, f| rows.each_with_index.map { |r, i| ["run_#{f + 1}.jsonl", i + 1, r] } } }
      judge = lambda do |list, **opts|
        scanner = AccessLeakScanner.new(scenario('test_ops_privilege'))
        found = scanner.scan(source.call(list), **opts).map { |f| [f.source, f.line, f.rule, f.owner, f.route] }
        [found, scanner.unused_entries]
      end
      assert_equal [[], []], judge.call(files, signins: BROWSER_SIGNINS), 'the untagged run, with its names, is clean as before'
      assert_equal [[], []], judge.call(files, signins: BROWSER_SIGNINS, tags: :absent)
      refute_equal [[], []], judge.call(files), 'untagged and unnamed, it is not'

      tagged_files = files.map do |rows|
        rows.each_with_index.map do |row, i|
          copy = Marshal.load(Marshal.dump(row))
          copy['pc'] = recorder_pc_tag(pc_of_row(rows, i, pcs)) if pc_route?(copy)
          copy
        end
      end
      assert_operator tagged_files.flatten.count { |r| r.key?('pc') }, :>=, 14
      assert_nil AccessLeakScanner.tag_problem({ 'run_1.jsonl' => tagged_files[0], 'run_2.jsonl' => tagged_files[1] }, :required)
      assert_equal [[], []], judge.call(tagged_files, tags: :required), 'P1, P3, P6, P12: the tags need no --signin name'
      assert_raises(ArgumentError) { judge.call(tagged_files, signins: BROWSER_SIGNINS) }
      nil_files = files.map { |rows| rows.map { |r| pc_route?(r) ? r.merge('pc' => nil) : r } }
      assert_equal judge.call(files), judge.call(nil_files), 'null tags: judged as the untagged run with no names'
    end

    test 'a row with a login key is still refused, so the tag key must stay pc' do
      row = mfa_rows.first.merge('login' => { 'pcId' => 'code_pc1' })
      assert_match(/holds a `login` tag/, AccessLeakScanner.tag_problem({ 'capture.jsonl' => [row] }, :auto))
      assert_raises(ArgumentError) { scan([row], scenario) }
    end
  end
end
