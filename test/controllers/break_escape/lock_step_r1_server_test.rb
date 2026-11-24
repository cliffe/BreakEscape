require 'test_helper'
require_relative '../../support/lock_step_routes'

module BreakEscape
  # S8c review round 1, the server findings (R1-SERVER1, 3, 4, 5 and the owner points): each probe of
  # the review as a test through the real routes, on one fixture scenario (the review's own).
  class LockStepR1ServerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include LockStepRoutes

    STEP = { 'kind' => 'push', 'owner' => 'amy' }.freeze

    def memo(id)
      { 'type' => 'notes1', 'id' => id, 'name' => "Memo #{id}", 'takeable' => true, 'text' => "WORDS-#{id}" }
    end

    def case_item(id, pin, extra = {})
      { 'type' => 'briefcase', 'id' => id, 'name' => "Case #{id}", 'takeable' => true, 'locked' => true, 'lockType' => 'pin',
        'requires' => pin, 'secondStep' => STEP.dup, 'contents' => [memo("#{id}_memo")] }.merge(extra)
    end

    def scenario
      { 'startRoom' => 'hall',
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' },
                      'objects' => [
                        { 'type' => 'notes1', 'id' => 'decoy', 'name' => 'Safe' },
                        { 'type' => 'safe', 'id' => 'realsafe', 'name' => 'Safe', 'locked' => true, 'lockType' => 'pin',
                          'requires' => '7777', 'secondStep' => STEP.dup, 'contents' => [memo('safe_memo')] },
                        { 'type' => 'notes1', 'id' => 'decoy2', 'name' => 'realsafe' }
                      ],
                      'npcs' => [{ 'id' => 'amy', 'habits' => { 'approvesPrompts' => 'always' } }] },
          'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '0000',
                       'connections' => { 'south' => 'hall' },
                       'objects' => [{ 'type' => 'safe', 'id' => 'vaultsafe', 'name' => 'Vault safe', 'locked' => true,
                                       'lockType' => 'pin', 'requires' => '8888', 'secondStep' => STEP.dup,
                                       'contents' => [memo('vault_memo')] }] }
        } }
    end

    setup do
      travel_to T0
      build_step_game(scenario, 'encounteredNPCs' => %w[amy])
    end
    teardown { travel_back }

    # ---- R1-SERVER1: a plain object that shares a gated container's name ----

    test 'a plain object named as the gated safe opens nothing of it by name, on any exit' do
      assert_equal [200, { 'success' => true, 'type' => 'object' }], unlock('object', 'Safe', '', 'unlocked')
      assert_includes game_state['unlockedObjects'], 'Safe'
      status, body = container('Safe')
      assert_equal 404, status, body.to_s
      assert_equal 404, container('realsafe').first, 'the shared id string is no way in either'
      assert_equal({}, game_state['lockSteps'] || {})
      status, body = add_item({ 'type' => 'notes1', 'id' => 'safe_memo', 'name' => 'Memo safe_memo' })
      assert_equal 422, status
      assert_match(/not found/i, body['message'])
      assert_nothing_leaked('WORDS-safe_memo', 'safe_memo')
    end

    test 'the gated safe still opens by its own id after the pass' do
      unlock('object', 'realsafe', '7777', 'pin')
      3.times { |i| later(3) if i.positive?; mfa('prompt', 'object:realsafe') }
      status, body = unlock('object', 'realsafe', '7777', 'pin')
      assert_equal 200, status
      assert_equal 'WORDS-safe_memo', body['contents'][0]['text']
      status, body = container('realsafe')
      assert_equal 200, status
      assert_equal 'WORDS-safe_memo', body['contents'][0]['text']
    end
  end
end
