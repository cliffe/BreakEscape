require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8a unit 09: the subject functions of the second sign-in step, code kind.
  class MfaAccessCodeTest < ActiveSupport::TestCase
    KS = KeyringLoginScenario
    T0 = Time.zone.at(1_800_000_000)
    SUBJECT = { kind: 'test_only', id: 'x1' }.freeze

    setup do
      Game.include(MfaAccess) unless Game.include?(MfaAccess)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: KS.scenario,
        player_state: { 'currentRoom' => 'lobby' }
      )
      @map = {}
      travel_to T0
    end

    teardown { travel_back }

    def issue(key = 'pc:a', npc = 'sam')
      @game.issue_second_step!(@map, key, npc, 'code')
    end

    def current
      @game.code_device_code('dev1')
    end

    def verify(typed, key: 'pc:a', npc: 'sam', map: @map)
      @game.verify_second_step_code(map, key, SUBJECT, typed, 'dev1', npc_id: npc)
    end

    def wrong_code
      current == '000000' ? '000001' : '000000'
    end

    test 'issue writes the record, counts the start, and a new one overwrites' do
      rec = issue
      assert_equal({ 'id' => 'pc:a', 'kind' => 'code', 'n' => 0, 'tries' => 0, 'nonce' => 1, 'at' => T0.to_i, 'last' => 0 }, rec)
      assert_equal 2, issue['nonce']
      assert_equal 1, @map.size
      assert_equal 2, @game.player_state['mfaAccounts']['sam']['started']
      assert_equal 'x', @game.issue_second_step!(@map, 'pc:a', 'sam', 'code', foothold: 'x')['foothold']
    end

    test 'a right code passes once per account, and the record is untouched' do
      issue
      code = current
      assert_equal :passed, verify(code)
      assert_equal [:stale, 'used'], verify(code)
      assert_equal T0.to_i / 60, @game.player_state['mfaAccounts']['sam']['used']
      assert @map['pc:a']
      issue('pc:b')
      assert_equal [:stale, 'used'], verify(code, key: 'pc:b')
    end

    test 'previous window code is accepted, an older one is stale expired' do
      issue
      old = current
      travel_to T0 + 60
      assert_equal :passed, verify(old)
      issue('pc:c', 'lena')
      travel_to T0 + 180
      assert_equal [:stale, 'expired'], verify(old, key: 'pc:c', npc: 'lena')
    end

    test 'wrong and malformed' do
      issue
      assert_equal :malformed, verify('12345')
      assert_equal :malformed, verify('12345a')
      assert_equal 0, @map['pc:a']['tries']
      assert_nil @game.player_state['mfaAccounts']['sam']['wrong']
      assert_equal :wrong, verify(wrong_code)
      assert_equal 1, @map['pc:a']['tries']
      assert_equal 1, @game.player_state['mfaAccounts']['sam']['wrong']
    end

    test 'the fifth wrong try expires the record' do
      issue
      4.times { assert_equal :wrong, verify(wrong_code) }
      assert_equal :expired, verify(wrong_code)
      assert_empty @map
    end

    test 'thirty wrong codes across two maps close the step, then it reopens after 300 s' do
      other = {}
      results = []
      30.times do |i|
        map = i.even? ? @map : other
        @game.issue_second_step!(map, 'pc:a', 'sam', 'code')
        results << verify(wrong_code, map: map)
      end
      assert_equal [:wrong, :closed], results.last
      assert_equal 1, results.count { |r| r.is_a?(Array) && r.last == :closed }
      issue
      right = current
      answer = verify(right)
      assert_equal :closed, answer[0]
      assert_equal 300, answer[1]
      travel_to T0 + 299
      assert_equal 1, verify(@game.code_device_code('dev1'))[1]
      travel_to T0 + 300
      issue
      assert_equal :passed, verify(@game.code_device_code('dev1'))
      assert_equal 0, @game.player_state['mfaAccounts']['sam']['wrong']
      assert_nil @game.player_state['mfaAccounts']['sam']['closedAt']
    end

    test 'tidy drops old unpassed records and keeps passed ones' do
      @map['old'] = { 'at' => T0.to_i, 'kind' => 'code' }
      @map['kept'] = { 'at' => T0.to_i, 'kind' => 'code', 'passed' => true }
      travel_to T0 + 301
      @game.tidy_pending!(@map)
      assert_equal %w[kept], @map.keys
      @map['fresh'] = { 'at' => T0.to_i + 301, 'kind' => 'code' }
      travel_to T0 + 400
      assert @game.tidy_pending!(@map).key?('fresh')
    end

    test 'a missing record answers expired and a test-only subject touches no lockout key' do
      assert_equal :expired, verify('123456')
      issue
      before = @game.player_state['loginFailures'].dup
      verify(wrong_code)
      assert_equal before, @game.player_state['loginFailures']
    end

    test 'every computed code is noted as an issued secret' do
      OpsLog::Current.issued_secrets = nil
      code = current
      assert_includes OpsLog.issued_secrets, code
    end
  end
end
