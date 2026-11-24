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

    # ---- a gated lock in a room the player has not opened (scanner review owner point 3, and R1-SERVER5) ----

    def invented_unlock
      unlock('object', 'nothing_here', '8888', 'pin')
    end

    test 'a gated safe in an unopened room is refused as an invented id is, and does not open by hand' do
      same = invented_unlock
      assert_equal [422, INVALID], same
      assert_equal same, unlock('object', 'vaultsafe', '8888', 'pin'), 'right PIN'
      assert_equal same, unlock('object', 'Vault safe', '8888', 'pin'), 'by its name'
      assert_equal same, unlock('object', 'vaultsafe', '8888', 'unlocked'), 'unlocked'
      invented = container('nothing_here')
      real = container('vaultsafe')
      assert_equal 404, invented.first
      assert_equal invented.first, real.first
      assert_equal JSON.generate(invented.last).gsub('nothing_here', 'X'), JSON.generate(real.last).gsub('vaultsafe', 'X')
      assert_not_includes Array(game_state['unlockedObjects']), 'vaultsafe'
      assert_equal({}, game_state['lockSteps'] || {})
      assert_nothing_leaked('WORDS-vault_memo', 'vault_memo')
    end

    test 'once the room is opened by its own door the same safe gates and opens as ever' do
      assert_equal 200, unlock('door', 'vault', '0000', 'pin').first
      status, gate = unlock('object', 'vaultsafe', '8888', 'pin')
      assert_equal [200, true], [status, gate['secondStep']]
      3.times { |i| later(3) if i.positive?; mfa('prompt', 'object:vaultsafe') }
      status, body = unlock('object', 'vaultsafe', '8888', 'pin')
      assert_equal 200, status
      assert_equal 'WORDS-vault_memo', body['contents'][0]['text']
    end

    test 'every /mfa action names a gated id in an unopened room exactly as it names an invented one' do
      %w[prompt approve].each do |route|
        assert_equal mfa(route, 'object:nothing_here'), mfa(route, 'object:vaultsafe'), route
      end
      assert_equal [404, NOT_FOUND], mfa('verify', 'object:vaultsafe', code: '123456')
      assert_equal [404, NOT_FOUND], mfa('prompt', 'object:vaultsafe')
      assert_equal [404, NOT_FOUND], mfa('approve', 'object:vaultsafe', number: 1)
      # the room reached: the same ids now answer expired (a real lock, no step begun)
      unlock('door', 'vault', '0000', 'pin')
      assert_equal [422, expired_for('object:vaultsafe')], mfa('prompt', 'object:vaultsafe')
    end

    # ---- GET scenario never serves a prompt habit, whatever kind of NPC record carries it ----

    HABITS = { 'approvesPrompts' => 'always', 'promptPatience' => 4, 'screen' => 'locks' }.freeze

    test 'no served answer carries approvesPrompts or promptPatience, for a room NPC, a headless character or a mail contact' do
      data = scenario
      data['rooms']['hall']['npcs'] << { 'id' => 'ward', 'displayName' => 'Ward', 'npcType' => 'person', 'habits' => HABITS.dup }
      data['rooms']['hall']['npcs'].first['habits'] = HABITS.dup
      data['social'] = {
        'characters' => { 'ghost' => { 'channels' => { 'email' => 'ghost_mail' },
                                       'emailRecord' => { 'habits' => HABITS.dup, 'itemsHeld' => [] } } },
        'mailClient' => { 'contacts' => [{ 'name' => 'Pat', 'npc' => 'pat_mail',
                                           'emailRecord' => { 'habits' => HABITS.dup } }] }
      }
      build_step_game(data, 'encounteredNPCs' => %w[amy ward])
      [bootstrap, room('hall'), room('vault')].each do |status, body|
        text = JSON.generate(body)
        assert_not_includes text, 'approvesPrompts', status.to_s
        assert_not_includes text, 'promptPatience', status.to_s
      end
      # the screen habit is not secret and still ships for a headless record
      social = bootstrap.last['social']
      assert_equal 'locks', social.dig('characters', 'ghost', 'emailRecord', 'habits', 'screen')
      assert_equal 'locks', social.dig('mailClient', 'contacts', 0, 'emailRecord', 'habits', 'screen')
    end

    # ---- playtest beat 12d: a reload between requests keeps the count, and the pane sends each prompt ----

    test 'the count survives a repeat gate (a reload), the gate sends no prompt, and the owner approves on the third' do
      data = scenario
      data['rooms']['hall']['npcs'].first['habits'] = { 'approvesPrompts' => 'pestered', 'promptPatience' => 3 }
      build_step_game(data, 'encounteredNPCs' => %w[amy])
      # the click and the pane: a gate, then the pane's own first prompt; each later click repeats both
      first = nil
      2.times do |i|
        later(3) if i.positive?
        _, gate = unlock('object', 'realsafe', '7777', 'pin')
        assert_equal true, gate['secondStep'], 'a repeat gate on the live record is asked again, not passed'
        _, first = mfa('prompt', 'object:realsafe')
        assert_equal [i + 1, false], first.values_at('promptsSent', 'approved')
      end
      # three gates in a row send no prompt of their own
      3.times { unlock('object', 'realsafe', '7777', 'pin') }
      later(3)
      _, third = mfa('prompt', 'object:realsafe')
      assert_equal true, third['stepPassed'], 'the third prompt is approved on arrival: the pane opens already passed'
      assert_equal 'owner', third['approvedBy']
      assert_equal 200, unlock('object', 'realsafe', '7777', 'pin').first
    end
  end
end
