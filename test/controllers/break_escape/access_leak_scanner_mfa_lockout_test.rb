require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8a fix (playtest 3): a lock that a run's own wrong second-step codes reach is not a `lockout_list` leak. The rows are
  # rows 54 to 63 of the real capture of game 129 of scenarios/test_ops_mfa (test/fixtures/files/ops_mfa_verify_lockout_rows.jsonl):
  # a first step at the Accounts PC for Hana, five wrong codes (the fifth ends the step), a new first step, two more wrong codes
  # and the lock answer of the eighth (`maxAttempts` is 8 for that PC). Each near miss is one change to a copy and stays a finding.
  class AccessLeakScannerMfaLockoutTest < ActiveSupport::TestCase
    FIXTURE = File.expand_path('../../fixtures/files/ops_mfa_verify_lockout_rows.jsonl', __dir__)

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__))))
    end

    def real
      @real ||= File.readlines(FIXTURE).map { |l| JSON.parse(l) }.to_h { |r| [r['n'], r] }
    end

    def rows(*ns)
      ns.map { |n| Marshal.load(Marshal.dump(real.fetch(n))) }
    end

    def lockouts(list, with_game: true)
      data = scenario
      scanner = AccessLeakScanner.new(data, game: with_game ? Game.new(scenario_data: data) : nil)
      scanner.scan(list.each_with_index.map { |r, i| ['capture.jsonl', i + 1, r] }).select { |f| f.rule == 'lockout_list' }.map { |f| [f.line, f.owner] }
    end

    # rows 54 to 63 in order: the capture's own lines 1 to 10 (row 60 is line 7, the lock answer line 10)
    def honest_list
      rows(*(54..63).to_a)
    end

    test 'the fixture holds nothing the scanner reports on its own rows, bar the lock answer the rule below credits' do
      data = scenario
      all = AccessLeakScanner.new(data, game: Game.new(scenario_data: data)).scan(honest_list.each_with_index.map { |r, i| ['capture.jsonl', i + 1, r] })
      assert_equal [], all.map { |f| [f.rule, f.line] }
      assert_equal [[10, 'lockedOut']], lockouts(honest_list, with_game: false)
    end

    test 'the same body on another route, verb or status stays a finding' do
      %w[mfa/prompt mfa/approve].each do |route|
        list = honest_list
        list.last['path'] = list.last['path'].sub('mfa/verify', route)
        got = lockouts(list)
        assert_equal [[10, 'lockedOut']], got, route
      end
      list = honest_list
      list.last['method'] = 'GET'
      assert_equal [[10, 'lockedOut']], lockouts(list)
      [200, 403, 429].each do |status|
        list = honest_list
        list.last['status'] = status
        assert_equal [[10, 'lockedOut']], lockouts(list), status.to_s
      end
      list = honest_list
      list.last['path'] += '.json'
      assert_equal [[10, 'lockedOut']], lockouts(list)
    end

    test 'extra, missing or altered keys stay findings' do
      [{ 'pcId' => 'code_pc1' }, { 'username' => 'hquill' }, { 'retryIn' => 300 }, { 'loginLockouts' => [] }].each do |extra|
        list = honest_list
        list.last['body'].merge!(extra)
        assert_not_empty lockouts(list), extra.keys.first
      end
      %w[message success attemptsLeft].each do |key|
        list = honest_list
        list.last['body'].delete(key)
        assert_equal [[10, 'lockedOut']], lockouts(list), key
      end
      { 'attemptsLeft' => 1, 'success' => true, 'lockedOut' => false, 'message' => 'Another message' }.each do |key, value|
        list = honest_list
        list.last['body'][key] = value
        assert_not_empty lockouts(list), key
      end
      list = honest_list
      list.last['body'] = { 'success' => false, 'message' => 'This account is locked on this PC', 'attemptsLeft' => 0, 'lockedOut' => { 'lockedOut' => true } }
      assert_not_empty lockouts(list)
    end

    test 'no game, no open step, a push step only, or two open steps stay findings' do
      assert_equal [[10, 'lockedOut']], lockouts(honest_list, with_game: false)
      assert_equal [[1, 'lockedOut']], lockouts(rows(63))
      # the step closed by the fifth wrong code and not opened again
      assert_equal [[9, 'lockedOut']], lockouts(rows(54, 55, 56, 57, 58, 59, 61, 62, 63))
      push = honest_list
      push.each { |r| r['body']['mfa'] = 'push' if r['body'].key?('mfa') }
      assert_equal [[10, 'lockedOut']], lockouts(push)
      two = honest_list
      other = Marshal.load(Marshal.dump(real.fetch(54)))
      other['body'] = other['body'].merge('pcId' => 'code_pc2', 'npcId' => 'ines')
      two.insert(6, other)
      assert_equal [[11, 'lockedOut']], lockouts(two)
    end

    test 'a step for another account or PC than the wrong codes counted for stays a finding' do
      list = honest_list
      list[6]['body'] = list[6]['body'].merge('npcId' => 'cal')
      # the lock now follows a step of another account whose own count is 2
      assert_equal [[10, 'lockedOut']], lockouts(list)
      list = honest_list
      list[6]['body'] = list[6]['body'].merge('pcId' => 'code_pc2')
      assert_equal [[10, 'lockedOut']], lockouts(list)
    end

    test 'too few wrong codes, a pass between them, a second lock answer stay findings' do
      list = honest_list
      list.delete_at(8)
      assert_equal [[9, 'lockedOut']], lockouts(list)
      list = honest_list
      list << Marshal.load(Marshal.dump(list.last))
      assert_equal [[11, 'lockedOut']], lockouts(list)
      # a pass answer between the wrong codes starts the count again
      list = honest_list
      pass = { 'method' => 'POST', 'path' => list.last['path'], 'status' => 200,
               'body' => { 'success' => true, 'npcId' => 'hana', 'username' => 'hquill', 'displayName' => 'Hana Quill', 'via' => 'password' } }
      list.insert(8, pass, Marshal.load(Marshal.dump(list[6])))
      assert_equal [[12, 'lockedOut']], lockouts(list)
    end

    test 'a lock reached by wrong passwords and wrong codes together stays a finding' do
      list = honest_list
      password = { 'method' => 'POST', 'path' => list.last['path'].sub('mfa/verify', 'login'), 'status' => 422,
                   'body' => { 'success' => false, 'message' => 'Incorrect username or password', 'attemptsLeft' => 3 } }
      list.delete_at(8)
      list.insert(8, password)
      assert_equal [[10, 'lockedOut']], lockouts(list)
    end
  end
end
