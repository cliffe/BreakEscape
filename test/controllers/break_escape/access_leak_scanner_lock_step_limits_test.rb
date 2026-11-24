require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c unit 28: the limits the first scanner review (S8c_scanner_R1.md) left open, narrowed where the real answers allow it.
  #  - an answer a PC's form sends with a `message` (mfaIncorrect, stale, expired, codeLocked, tooSoon) and which carries none is the
  #    lock's with its echo dropped: in a scenario with a PC step open it is no longer read as the PC's;
  #  - an open answer says `type`: object for an object lock, door for a door (unlock answers, games_controller#unlock);
  #  - every shipped scenario builds the scanner's state: the id-less ArgumentError is raised for a gated lock with no id only.
  class AccessLeakScannerLockStepLimitsTest < ActiveSupport::TestCase
    BASE = '/break_escape/games/1'.freeze
    MFA_SCENARIO = File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)

    def note(id)
      { 'id' => id, 'type' => 'notes', 'name' => id }
    end

    def mixed
      data = JSON.parse(ScenarioBinding.render(File.read(MFA_SCENARIO)))
      room = data['rooms'].values.find { |r| r.is_a?(Hash) && r['objects'].is_a?(Array) }
      room['objects'] << { 'id' => 'gordon_locker', 'name' => 'Locker', 'type' => 'safe', 'locked' => true,
                           'secondStep' => { 'kind' => 'code', 'owner' => 'gordon' }, 'contents' => [note('locker_memo')] }
      room['objects'] << { 'id' => 'gordon_fob', 'type' => 'code_device', 'owner' => 'gordon', 'name' => 'Code device' }
      room['npcs'] = Array(room['npcs']) + [{ 'id' => 'gordon', 'displayName' => 'Gordon', 'habits' => { 'approvesPrompts' => 'always' } }]
      data
    end

    def start
      @clock = Time.utc(2026, 1, 1)
      @rows = []
    end

    def raw(method, path, body, status: 200, query: nil)
      @clock += 1
      row = { 't' => @clock.iso8601(3), 'method' => method, 'path' => "#{BASE}/#{path}", 'status' => status, 'body' => body }
      row['query'] = query if query
      @rows << row
    end

    def scan(data)
      AccessLeakScanner.new(data).scan(@rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
    end

    def pc_code_step(data)
      s = AccessLeakScanner.new(data)
      pcs = s.instance_variable_get(:@priv_pcs).keys
      npcs = s.instance_variable_get(:@priv_npcs).keys
      pcs.product(npcs).map { |pc, n| [pc, n, s.send(:mfa_kind_at, pc, n)] }.find { |x| x.last == 'code' }
    end

    def code_lock_run(refusal)
      data = mixed
      step = pc_code_step(data)
      start
      raw('POST', 'login', { 'success' => false, 'mfaRequired' => true, 'mfa' => 'code', 'pcId' => step[0], 'npcId' => step[1] })
      raw('POST', 'inventory', { 'success' => true }).tap { @rows.last['inv'] = { 'action' => 'add', 'itemId' => 'gordon_fob', 'usedOn' => nil } }
      raw('POST', 'unlock', { 'success' => false, 'secondStep' => true, 'kind' => 'code', 'targetType' => 'object', 'targetId' => 'gordon_locker', 'npcId' => 'gordon' })
      raw('POST', 'mfa/verify', refusal, status: 422)
      data
    end

    test 'a lock refusal with its echo dropped is no longer read as the PC\'s when a PC step is open' do
      [{ 'success' => false, 'mfaIncorrect' => true }, { 'success' => false, 'expired' => true },
       { 'success' => false, 'stale' => 'used' }, { 'success' => false, 'codeLocked' => true, 'retryIn' => 60 }].each do |body|
        data = code_lock_run(body)
        assert(scan(data).any? { |f| f.rule == 'lock_step_answer' && f.owner.start_with?('lockstep:refusal') }, body.keys.inspect)
      end
    end

    test 'the PC\'s own refusals, which carry their message, and the lock\'s with its echo stay clean' do
      message = BreakEscape::Game::LOGIN_INCORRECT
      [{ 'success' => false, 'message' => message, 'mfaIncorrect' => true }, { 'success' => false, 'message' => message, 'expired' => true }].each do |body|
        data = code_lock_run(body)
        assert_equal [], scan(data).select { |f| f.rule == 'lock_step_answer' }, body.keys.inspect
      end
      data = code_lock_run({ 'success' => false, 'mfaIncorrect' => true, 'targetType' => 'object', 'targetId' => 'gordon_locker' })
      assert_equal [], scan(data).select { |f| f.rule.start_with?('lock_step_') }
    end

    test 'an open answer of the wrong type for its lock is reported' do
      data = mixed
      step = %w[unlock]
      [['object', 'door'], ['object', nil], ['object', 'object']].each do |(_want, got)|
        start
        raw('POST', 'inventory', { 'success' => true })
        @rows.last['inv'] = { 'action' => 'add', 'itemId' => 'gordon_fob', 'usedOn' => nil }
        raw('POST', step.first, { 'success' => false, 'secondStep' => true, 'kind' => 'code', 'targetType' => 'object', 'targetId' => 'gordon_locker', 'npcId' => 'gordon' })
        raw('GET', 'mfa/device', { 'deviceId' => 'gordon_fob', 'displayName' => 'Gordon', 'npcId' => 'gordon', 'code' => '482913', 'secondsLeft' => 40, 'used' => false }, query: 'item_id=gordon_fob')
        raw('POST', 'mfa/verify', { 'success' => true, 'stepPassed' => true, 'targetType' => 'object', 'targetId' => 'gordon_locker' })
        open = { 'success' => true, 'hasContents' => true, 'contents' => [{ 'id' => 'locker_memo' }] }
        open['type'] = got if got
        raw('POST', 'unlock', open)
        found = scan(data).select { |f| f.rule.start_with?('lock_step_') }.map(&:owner)
        if got == 'object'
          assert_equal [], found
        else
          assert_includes found, 'lockstep:open:type:object:gordon_locker', got.inspect
        end
      end
    end

    test 'every shipped scenario builds the scanner state; only a gated lock with no id raises' do
      paths = Dir[File.expand_path('../../../scenarios/*/scenario.json.erb', __dir__)]
      assert_operator paths.size, :>, 20
      gated = []
      paths.each do |path|
        data = JSON.parse(ScenarioBinding.render(File.read(path)))
        gated << File.basename(File.dirname(path)) unless BreakEscape::LockStepModel.each_lock_step(data).to_a.empty?
        start
        raw('GET', 'scenario', {})
        begin
          scan(data)
        rescue ArgumentError => e
          flunk "#{path}: #{e.message}"
        end
      end
      assert_equal ['test_ops_lock_step'], gated
    end
  end
end
