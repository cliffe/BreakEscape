require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops follow-up C3 (decision 4 of the track C brief): the leak scanner is not changed to read the recorder's new `pc` tag, so a
  # capture that carries the tag must be accepted and judged exactly as the same capture without it. The rows are the real ones
  # (ops_mfa_real_capture_rows.jsonl, and the two ops_privilege_browser_run files); the only change made is the tag on every POST
  # row of the six PC routes, `{ 'pcId' => <the PC> }`, or `nil` when the recorder could not read the request.
  class RecorderTagsScannerMfaTest < ActiveSupport::TestCase
    FIXTURES = File.expand_path('../../fixtures/files', __dir__)
    NAMES = %w[hana@code_pc1#1 cal@plain_pc#1].freeze
    # The sign-in names the privilege capture needs (as access_leak_scanner_privilege_real_test.rb names them).
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

    def scan(rows, data, **opts)
      scanner = AccessLeakScanner.new(data)
      findings = scanner.scan(rows.each_with_index.map { |r, i| ['capture.jsonl', i + 1, r] }, **opts)
      [findings.map { |f| [f.line, f.rule, f.owner, f.route] }, scanner.unused_entries]
    end

    test 'the real MFA capture with a pc tag on every PC-route row is accepted and judged as without it' do
      plain = mfa_rows
      assert_equal 5, plain.count { |r| pc_route?(r) }, 'the capture holds five POST rows on the PC routes'
      base = scan(plain, scenario, signins: NAMES)
      assert_equal [[], []], base, 'the untagged run is clean'
      bare_base = scan(plain, scenario)
      assert_equal [['mfa_session', 'mfa:session:cal'], ['mfa_session', 'mfa:session:hana']], bare_base.first.map { |f| f[1, 2] }.uniq.sort
      { 'with the PC' => ->(r) { { 'pcId' => MFA_PCS.fetch(r['n']) } }, 'unreadable' => ->(_r) { nil } }.each do |label, pc_for|
        rows = tagged(plain, &pc_for)
        assert_equal 5, rows.count { |r| r.key?('pc') }, label
        assert_nil AccessLeakScanner.hand_tag_problem({ 'capture.jsonl' => rows }), "#{label}: the tag is not refused"
        assert_equal base, scan(rows, scenario, signins: NAMES), "#{label}: same findings and unused entries"
        assert_equal bare_base, scan(rows, scenario), "#{label}: same findings without the sign-in names"
      end
    end

    test 'a tag that names a different PC from the capture changes nothing, because the scanner does not read it yet' do
      rows = tagged(mfa_rows) { |_r| { 'pcId' => 'plain_pc' } }
      assert_equal [[], []], scan(rows, scenario, signins: NAMES)
    end

    # The next desktop row (a `container/<pc>` answer) after a POST names the PC the request was about; a lock row names it itself.
    def privilege_rows
      %w[ops_privilege_browser_run_1.jsonl ops_privilege_browser_run_2.jsonl].map do |name|
        File.readlines(File.join(FIXTURES, name)).map { |l| JSON.parse(l) }
      end
    end

    test 'the real privilege browser capture with pc tags is accepted and judged as without them' do
      signins = BROWSER_SIGNINS
      files = privilege_rows
      lines = ->(list) { list.each_with_index.flat_map { |rows, f| rows.each_with_index.map { |r, i| ["run_#{f + 1}.jsonl", i + 1, r] } } }
      judge = lambda do |list|
        scanner = AccessLeakScanner.new(scenario('test_ops_privilege'))
        found = scanner.scan(lines.call(list), signins: signins).map { |f| [f.source, f.line, f.rule, f.owner, f.route] }
        [found, scanner.unused_entries]
      end
      base = judge.call(files)
      assert_equal [[], []], base
      tagged_files = files.map do |rows|
        rows.each_with_index.map do |row, i|
          copy = Marshal.load(Marshal.dump(row))
          if pc_route?(copy)
            ahead = rows[i..].find { |r| r['path'].to_s =~ %r{/container/(\w+)\z} }
            copy['pc'] = { 'pcId' => ahead ? ahead['path'][%r{/container/(\w+)\z}, 1] : 'bay_pc' }
          end
          copy
        end
      end
      assert_operator tagged_files.flatten.count { |r| r.key?('pc') }, :>=, 14
      assert_nil AccessLeakScanner.hand_tag_problem({ 'run_1.jsonl' => tagged_files[0], 'run_2.jsonl' => tagged_files[1] })
      assert_equal base, judge.call(tagged_files)
      nil_files = files.map { |rows| rows.map { |r| pc_route?(r) ? r.merge('pc' => nil) : r } }
      assert_equal base, judge.call(nil_files)
    end

    test 'a row with a login key is still refused, so the tag key must stay pc' do
      row = mfa_rows.first.merge('login' => { 'pcId' => 'code_pc1' })
      assert_match(/holds a `login` tag/, AccessLeakScanner.hand_tag_problem({ 'capture.jsonl' => [row] }))
    end
  end
end
