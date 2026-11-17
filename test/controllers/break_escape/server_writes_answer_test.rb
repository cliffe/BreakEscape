require 'test_helper'

module BreakEscape
  # Tailgate sync: a server-side credit during sync_state (viaPass) or the door unlock
  # (viaCredential) writes globals and completes a task the client did not ask for. The answer to
  # that same request carries them back as serverGlobals / serverCompletedTasks, so the client
  # learns them without a reload. The record is per request and never persisted.
  class ServerWritesAnswerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    def scenario(conclude: false)
      gate = { 'openFor' => ['len'], 'openRadius' => 72, 'playerMayPassIf' => 'courier_ready',
               'creditOnPass' => {
                 'viaPass' => { 'setGlobal' => { 'kp_badge_tailgated' => true }, 'completeTask' => 'tailgate_in' },
                 'viaCredential' => { 'setGlobal' => { 'kp_records_cloned' => true }, 'completeTask' => 'tailgate_in' }
               } }
      {
        'startRoom' => 'lobby',
        'globalVariables' => { 'courier_ready' => false, 'kp_badge_tailgated' => false,
                               'kp_records_cloned' => false, 'inside_records' => false, 'note' => '' },
        'disguises' => { 'hivis' => { 'sprite' => 'courier_hivis' } },
        'objectives' => [
          { 'aimId' => 'a1', 'title' => 'Get in', 'missionConclusion' => conclude, 'tasks' => [
            # onComplete.setGlobal runs server-side on the trusted completion (apply_task_set_globals!)
            { 'taskId' => 'tailgate_in', 'title' => 'Past the records door', 'type' => 'manual', 'status' => 'active',
              'onComplete' => { 'setGlobal' => { 'inside_records' => true } } }
          ] }
        ],
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'secure_area' },
            'doors' => [{ 'connectedRoom' => 'secure_area', 'direction' => 'north', 'requires' => 'badge', 'gate' => gate }],
            'objects' => [
              { 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' },
              { 'type' => 'hivis', 'id' => 'vest', 'name' => 'Hi-vis', 'takeable' => true,
                'wearable' => { 'costume' => 'hivis', 'global' => 'courier_ready' } }
            ],
            'npcs' => [{ 'id' => 'len', 'displayName' => 'Len', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                         'eventMappings' => [{ 'eventPattern' => 'len_never_fires', 'unlockDoor' => 'secure_area' }] }]
          },
          'secure_area' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid', 'requires' => 'badge', 'objects' => [] }
        }
      }
    end

    def build(player_state = {}, opts = {})
      conclude = opts[:conclude]
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario(conclude: conclude),
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }.merge(player_state)
      )
    end

    def vest_item
      { 'type' => 'hivis', 'id' => 'vest', 'name' => 'Hi-vis', 'wearable' => { 'costume' => 'hivis', 'global' => 'courier_ready' } }
    end

    def cloner_item
      { 'type' => 'rfid_cloner', 'id' => 'cloner', 'name' => 'RFID cloner' }
    end

    def tailgate_into_route_room(game)
      post wear_game_url(game), params: { item_id: 'vest', worn: true }, as: :json
      assert_response :success, response.body
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', attempt: 'len', method: 'npc' }, as: :json
      assert_response :success
      refute response.parsed_body.key?('serverGlobals'), 'the NPC route records a route room and credits nothing'
    end

    test 'the sync_state answer carries the viaPass credit globals and the completed task' do
      game = build('inventory' => [vest_item])
      tailgate_into_route_room(game)

      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :success
      body = response.parsed_body
      assert_equal true, body.dig('serverGlobals', 'kp_badge_tailgated'), 'the credit global rides the answer'
      assert_equal true, body.dig('serverGlobals', 'inside_records'), 'the task onComplete.setGlobal rides it too'
      assert_equal ['tailgate_in'], body['serverCompletedTasks']
      refute body['serverGlobals'].key?('courier_ready'), 'a global the server did not write here is not sent'
    end

    test 'a plain sync carries no server writes, and the record is never stored' do
      game = build('inventory' => [vest_item])
      tailgate_into_route_room(game)
      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert response.parsed_body.key?('serverGlobals')

      st = game.reload.player_state
      refute st.key?('serverGlobals')
      refute st.key?('serverCompletedTasks')
      used = BreakEscape::Game.find(game.id)
      used.record_server_global_writes(['kp_badge_tailgated'])
      assert_equal ['kp_badge_tailgated'], used.server_write_record[:globals], 'a writer fills the record on its instance'
      assert_nil BreakEscape::Game.find(game.id).instance_variable_get(:@server_write_record),
                 'a fresh load starts with no record'
      before = st.to_json.bytesize

      put sync_state_game_url(game), params: { currentRoom: 'secure_area', globalVariables: { note: 'x' } }, as: :json
      assert_response :success
      body = response.parsed_body
      refute body.key?('serverGlobals'), 'the next sync does not resend the earlier write'
      refute body.key?('serverCompletedTasks')
      after = game.reload.player_state.to_json.bytesize
      assert_operator after - before, :<=, 20, 'player_state grows only by the client global, not a write log'
    end

    test 'the door unlock answer carries the viaCredential credit' do
      game = build('inventory' => [cloner_item],
                   'serverClones' => { 'badge' => { 'source' => { 'npc' => 'clerk' }, 'uidOnly' => false } })
      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :success
      body = response.parsed_body
      assert_equal true, body.dig('serverGlobals', 'kp_records_cloned')
      assert_equal true, body.dig('serverGlobals', 'inside_records')
      assert_equal ['tailgate_in'], body['serverCompletedTasks']
      refute game.reload.player_state.key?('serverGlobals')

      post unlock_game_url(game), params: { targetType: 'door', targetId: 'secure_area', method: 'rfid' }, as: :json
      assert_response :success
      refute response.parsed_body.key?('serverGlobals'), 'an already-open door credits nothing again'
    end

    test 'a stale-but-recent sync answer still carries the credit it earned' do
      game = build('inventory' => [vest_item])
      tailgate_into_route_room(game)
      # Two syncs land first and record writes in the ring, so 1500 falls inside it (stale but recent)
      [1000, 2000].each do |ts|
        put sync_state_game_url(game), params: { clientTs: ts, globalVariables: { note: "n#{ts}" } }, as: :json
        assert_response :success
        refute response.parsed_body.key?('serverGlobals')
      end

      put sync_state_game_url(game), params: { clientTs: 1500, currentRoom: 'secure_area' }, as: :json
      assert_response :success
      body = response.parsed_body
      assert_equal true, body['stale'], 'the older request is answered stale'
      assert_equal true, body.dig('serverGlobals', 'kp_badge_tailgated')
      assert_equal ['tailgate_in'], body['serverCompletedTasks']
    end

    test 'a refused sync (format 409) carries no server writes and stores none' do
      game = build('inventory' => [vest_item])
      tailgate_into_route_room(game)
      game.update_columns(scenario_data: game.scenario_data.merge('formatVersion' => BreakEscape::FormatUpgrade.current + 5))

      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :conflict
      body = response.parsed_body
      refute body.key?('serverGlobals')
      refute body.key?('serverCompletedTasks')
      refute game.reload.player_state.dig('globalVariables', 'kp_badge_tailgated'), 'nothing was credited'
    end

    test 'a credit that concludes the mission says so on the answer' do
      game = build({ 'inventory' => [vest_item] }, conclude: true)
      tailgate_into_route_room(game)
      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      assert_response :success
      assert_equal 'tailgate_in', response.parsed_body['serverMissionConcluded']
      assert game.reload.mission_concluded_at.present?

      put sync_state_game_url(game), params: { currentRoom: 'secure_area', globalVariables: { note: 'x' } }, as: :json
      refute response.parsed_body.key?('serverMissionConcluded'), 'said once, on the request that concluded it'
    end

    test 'a credit that does not conclude the mission sends no conclusion' do
      game = build('inventory' => [vest_item])
      tailgate_into_route_room(game)
      put sync_state_game_url(game), params: { currentRoom: 'secure_area' }, as: :json
      refute response.parsed_body.key?('serverMissionConcluded')
    end
  end
end
