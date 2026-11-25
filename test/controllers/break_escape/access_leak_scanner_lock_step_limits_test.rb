require 'test_helper'
require_relative '../../support/lock_step_scanner_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c unit 28: the limits the first scanner review (S8c_scanner_R1.md) left open, narrowed where the real answers allow it.
  #  - an answer a PC's form sends with a `message` (mfaIncorrect, stale, expired, codeLocked, tooSoon) and which carries none is the
  #    lock's with its echo dropped: in a scenario with a PC step open it is no longer read as the PC's;
  #  - an open answer says `type`: object for an object lock, door for a door (unlock answers, games_controller#unlock);
  #  - every shipped scenario builds the scanner's state: the id-less ArgumentError is raised for a gated lock with no id only.
  class AccessLeakScannerLockStepLimitsTest < ActiveSupport::TestCase
    include LockStepScannerRows

    # R1-SCANNER11: every lock answer below is read from the shared answers (answers.json) through `answer(name)`; only the PC form's
    # own answers (login, a PC's refusal with its `message`) are written here.
    def mixed
      data = mfa_data
      room = data['rooms'].values.find { |r| r.is_a?(Hash) && r['objects'].is_a?(Array) }
      room['objects'] << { 'id' => 'gordon_locker', 'name' => 'Locker', 'type' => 'safe', 'locked' => true,
                           'secondStep' => { 'kind' => 'code', 'owner' => 'gordon' }, 'contents' => [note('locker_memo')] }
      room['objects'] << { 'id' => 'gordon_fob', 'type' => 'code_device', 'owner' => 'gordon', 'name' => 'Code device' }
      room['objects'] << { 'id' => 'gordon_box', 'name' => 'Box', 'type' => 'safe', 'locked' => true,
                           'secondStep' => { 'kind' => 'push', 'owner' => 'gordon' }, 'contents' => [note('box_memo')] }
      room['npcs'] = Array(room['npcs']) + [{ 'id' => 'gordon', 'displayName' => 'Gordon', 'habits' => { 'approvesPrompts' => 'always' } }]
      data
    end

    def scan(data)
      scan_rows(@rows, data)
    end

    def pc_code_step(data)
      pc_steps(data).find { |x| x.last == 'code' }
    end

    def gate_gordon_locker
      answer('gate_code') { |b| b['targetId'] = 'gordon_locker'; b['npcId'] = 'gordon' }
    end

    def code_lock_run(name, **opts)
      data = mixed
      step = pc_code_step(data)
      start
      pc_required(step)
      gate_gordon_locker
      answer(name, **opts)
      data
    end

    test 'a lock refusal with its echo dropped is no longer read as the PC\'s when a PC step is open' do
      %w[verify_wrong verify_dropped verify_stale_used verify_closed].each do |name|
        data = code_lock_run(name, echo: false)
        assert(scan(data).any? { |f| f.rule == 'lock_step_answer' && f.owner.start_with?('lockstep:refusal') }, name)
      end
    end

    test 'the PC\'s own refusals, which carry their message, and the lock\'s with its echo stay clean' do
      message = BreakEscape::Game::LOGIN_INCORRECT
      [{ 'success' => false, 'message' => message, 'mfaIncorrect' => true }, { 'success' => false, 'message' => message, 'expired' => true }].each do |body|
        data = mixed
        start
        pc_required(pc_code_step(data))
        gate_gordon_locker
        raw('POST', 'mfa/verify', body, status: 422)
        assert_equal [], scan(data).select { |f| f.rule == 'lock_step_answer' }, body.keys.inspect
      end
      data = code_lock_run('verify_wrong')
      assert_equal [], lock_findings(scan(data))
    end

    test 'an open answer of the wrong type for its lock is reported' do
      data = mixed
      [['object', 'door'], ['object', nil], ['object', 'object']].each do |(_want, got)|
        start
        answer('gate_push') { |b| b['targetId'] = 'gordon_box'; b['npcId'] = 'gordon' }
        answer('prompt_passed')
        answer('open_object') do |b|
          b['contents'] = [note('box_memo')]
          got ? b['type'] = got : b.delete('type')
        end
        found = lock_findings(scan(data)).map(&:last)
        if got == 'object'
          assert_equal [], found
        else
          assert_includes found, 'lockstep:open:type:object:gordon_box', got.inspect
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
      assert_equal %w[demo_ops_second_step test_ops_lock_step], gated.sort
      # and the other half of the name: a gated lock with no id does raise
      data = mixed
      data['rooms'].values.each { |r| Array(r['objects']).each { |o| o.delete('id') if o['secondStep'] } }
      start
      raw('GET', 'scenario', {})
      assert_raises(ArgumentError) { scan(data) }
    end
  end
end
