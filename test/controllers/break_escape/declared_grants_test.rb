require 'test_helper'

# Declared grants (docs/achitechture/DECLARED_GRANTS_PLAN.md): a scenario's own
# client-side give_item actions are the server's allowlist for those rewards, the
# stored copy is the scenario's (contents stripped), and a granted container's
# contents are served from the granted item only while the player holds it. No
# hidden twin object is needed. Tested through the real endpoints.
module BreakEscape
  class DeclaredGrantsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SECRET_TEXT = 'Simulated payroll working file'.freeze
    VAULT_TEXT = 'Inside the vault'.freeze

    def remote_item
      {
        'id' => 'remote_x', 'type' => 'pc', 'name' => 'Remote X',
        'hasContents' => true, 'locked' => false, 'observations' => 'A remote session',
        'contents' => [
          { 'type' => 'text_file', 'name' => 'payroll.txt', 'takeable' => false, 'readable' => true, 'text' => SECRET_TEXT },
          {
            'type' => 'zip_archive', 'id' => 'vault_x', 'name' => 'vault.zip', 'takeable' => false,
            'locked' => true, 'lockType' => 'password', 'requires' => 'Pw2026!',
            'contents' => [{ 'type' => 'text_file', 'name' => 'inside.txt', 'readable' => true, 'text' => VAULT_TEXT }]
          }
        ]
      }
    end

    def scenario(extra_objects: [], timers_extra: [], twin: false, grant_item: nil)
      objects = [
        { 'type' => 'pc', 'id' => 'desk_pc', 'name' => 'Desk PC', 'takeable' => true },
        {
          'type' => 'vm-launcher', 'id' => 'launcher', 'name' => 'Launcher',
          'flagRewards' => [{ 'type' => 'give_item', 'item' => { 'type' => 'pc', 'id' => 'launcher_prize', 'name' => 'Launcher Prize' } }]
        },
        {
          'type' => 'flag-station', 'id' => 'station', 'name' => 'Drop Site',
          'flags' => ['vm:flag_1'],
          'itemsHeld' => [{ 'type' => 'text_file', 'id' => 'station_map', 'name' => 'Station Map', 'takeable' => true }],
          'flagRewards' => {
            'flag{one}' => { 'type' => 'give_item', 'item' => { 'type' => 'pc', 'id' => 'hash_prize', 'name' => 'Hash Prize' } }
          }
        },
        {
          'type' => 'notes', 'id' => 'sign', 'name' => 'Sign', 'takeable' => false,
          'triggerOnInteract' => [{ 'type' => 'give_item', 'item' => {
            'type' => 'pc', 'id' => 'touch_x', 'name' => 'Touch X', 'hasContents' => true, 'locked' => false,
            'contents' => [{ 'type' => 'text_file', 'name' => 'touch.txt', 'text' => 'touch secret' }]
          } }]
        }
      ] + extra_objects
      objects << remote_item.merge('takeable' => true, 'active' => false) if twin
      {
        'startRoom' => 'hall',
        'flags' => { 'vm' => { 'flag_1' => 'flag{one}' } },
        'timers' => [
          { 'id' => 'grant_remote', 'startOnGlobal' => 'foothold', 'delayMs' => 300,
            'actions' => [{ 'type' => 'give_item', 'item' => grant_item || remote_item }] },
          { 'id' => 'grant_key', 'startOnGlobal' => 'foothold', 'delayMs' => 300,
            'actions' => [{ 'type' => 'give_item', 'item' => { 'type' => 'key', 'name' => 'Side Key', 'opens_lock' => 'side_door' } }] }
        ] + timers_extra,
        'rooms' => {
          'hall' => {
            'type' => 'room_office', 'connections' => {}, 'objects' => objects,
            'npcs' => [{
              'id' => 'nina', 'displayName' => 'Nina',
              'itemsHeld' => [{ 'type' => 'text_file', 'id' => 'nina_note', 'name' => 'Nina Note', 'takeable' => true }],
              'eventMappings' => [{ 'eventPattern' => 'x', 'actions' => [
                { 'type' => 'give_item', 'item' => { 'type' => 'pc', 'id' => 'mapping_prize', 'name' => 'Mapping Prize' } }
              ] }]
            }]
          }
        }
      }
    end

    def build_game(**opts)
      Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: scenario(**opts),
        player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'unlockedObjects' => [], 'inventory' => [] }
      )
    end

    def add(game, item, extra = {})
      post inventory_game_url(game), params: { action_type: 'add', item: item }.merge(extra), as: :json
    end

    def unlock(game, id, method, attempt = nil)
      post unlock_game_url(game), params: { targetType: 'object', targetId: id, method: method, attempt: attempt }, as: :json
    end

    def container(game, id)
      get "/break_escape/games/#{game.id}/container/#{id}"
    end

    def inventory(game)
      game.reload.player_state['inventory']
    end

    # --- Allow and refuse ---------------------------------------------------

    test 'a declared grant is accepted and stored as the scenario copy without contents' do
      game = build_game
      add(game, { type: 'pc', id: 'remote_x', name: 'Remote X', opens_lock: 'side_door',
                  locked: true, keyPins: [1, 2], scenarioData: { type: 'key' } })
      assert_response :success, response.body
      stored = inventory(game).sole
      assert_equal 'remote_x', stored['id']
      assert_equal true, stored['hasContents']
      assert_equal false, stored['locked']
      refute stored.key?('contents')
      %w[opens_lock keyPins scenarioData].each { |f| refute stored.key?(f), f }
      refute_includes response.body, SECRET_TEXT
    end

    test 'a name-only claim is decided by the grant and stored with its id' do
      game = build_game
      add(game, { type: 'pc', name: 'Remote X' })
      assert_response :success, response.body
      assert_equal 'remote_x', inventory(game).sole['id']
    end

    test 'a key grant is claimed by the lock it opens' do
      game = build_game
      add(game, { type: 'key', name: 'Side Key', opens_lock: 'side_door' })
      assert_response :success, response.body
      assert_equal 'side_door', inventory(game).sole['opens_lock']
    end

    test 'undeclared, wrong-id and wrong-type claims are refused' do
      game = build_game
      add(game, { type: 'pc', id: 'nope', name: 'Nope' })
      assert_response :unprocessable_entity
      add(game, { type: 'pc', id: 'remote_y', name: 'Remote X' })
      assert_response :unprocessable_entity
      add(game, { type: 'key', id: 'remote_x' })
      assert_response :unprocessable_entity
      assert_empty inventory(game)
    end

    test 'give_items under flagRewards (hash form, vm-launcher) and eventMappings are not grants' do
      game = build_game
      add(game, { type: 'pc', id: 'hash_prize', name: 'Hash Prize' })
      assert_response :unprocessable_entity
      add(game, { type: 'pc', id: 'launcher_prize', name: 'Launcher Prize' })
      assert_response :unprocessable_entity
      add(game, { type: 'pc', id: 'mapping_prize', name: 'Mapping Prize' })
      assert_response :unprocessable_entity
      assert_empty inventory(game)
      assert_equal %w[rooms/hall/objects[3]/triggerOnInteract[0] timers[0]/actions[0] timers[1]/actions[0]],
                   game.declared_grants.map { |g| g['path'] }.sort
    end

    test 'an add naming an NPC is decided by the NPC rule, not the grant step' do
      game = build_game
      add(game, { type: 'pc', id: 'remote_x', name: 'Remote X' }, source_npc_id: 'nina')
      assert_response :unprocessable_entity
      assert_empty inventory(game)
    end

    test 'a repeat while held is not duplicated, and a claim after remove is accepted' do
      game = build_game
      2.times do
        add(game, { type: 'pc', id: 'remote_x', name: 'Remote X' })
        assert_response :success
      end
      assert_equal 1, inventory(game).length
      post inventory_game_url(game), params: { action_type: 'remove', item: { id: 'remote_x' } }, as: :json
      assert_empty inventory(game)
      add(game, { type: 'pc', id: 'remote_x', name: 'Remote X' })
      assert_response :success
      assert_equal 1, inventory(game).length
    end

    test 'an ordinary room pickup is unchanged' do
      game = build_game
      add(game, { type: 'pc', id: 'desk_pc', name: 'Desk PC' })
      assert_response :success
    end

    # A grant that shares a gated holder's identity (the validator errors on this
    # scenario, R2 M2): the grant step runs first, so the server accepts it. This
    # pins that the validator, not the server, is what stops it.
    test 'a grant sharing a flag-station item identity is accepted by the server (validator rejects the scenario)' do
      game = build_game(timers_extra: [{ 'id' => 'bad', 'actions' => [
        { 'type' => 'give_item', 'item' => { 'type' => 'text_file', 'id' => 'station_map', 'name' => 'Station Map' } }
      ] }])
      add(game, { type: 'text_file', id: 'station_map', name: 'Station Map' })
      assert_response :success
    end

    # --- Contents only while held --------------------------------------------

    test 'before the claim the granted container does not exist' do
      game = build_game
      unlock(game, 'remote_x', 'unlocked')
      assert_response :unprocessable_entity
      container(game, 'remote_x')
      assert_response :not_found
      unlock(game, 'vault_x', 'password', 'Pw2026!')
      assert_response :unprocessable_entity
    end

    test 'while held the opener, its contents and the nested archive work through the real path' do
      game = build_game
      add(game, { type: 'pc', id: 'remote_x', name: 'Remote X' })
      assert_response :success

      unlock(game, 'remote_x', 'unlocked')
      assert_response :success, response.body
      contents = response.parsed_body['contents']
      assert_equal %w[payroll.txt vault.zip], contents.map { |c| c['name'] }
      vault = contents.find { |c| c['id'] == 'vault_x' }
      refute vault.key?('requires')
      refute vault.key?('contents')
      refute_includes response.body, 'Pw2026!'

      container(game, 'remote_x')
      assert_response :success
      assert_equal %w[payroll.txt vault.zip], response.parsed_body['contents'].map { |c| c['name'] }

      unlock(game, 'vault_x', 'password', 'wrong')
      assert_response :unprocessable_entity
      unlock(game, 'vault_x', 'password', 'pw2026!')
      assert_response :unprocessable_entity
      assert_equal true, response.parsed_body['caseMismatch']
      unlock(game, 'vault_x', 'password', 'Pw2026!')
      assert_response :success, response.body
      assert_equal ['inside.txt'], response.parsed_body['contents'].map { |c| c['name'] }

      container(game, 'vault_x')
      assert_response :success
      assert_equal VAULT_TEXT, response.parsed_body['contents'].sole['text']
    end

    test 'after remove the contents stop being served' do
      game = build_game
      add(game, { type: 'pc', id: 'remote_x', name: 'Remote X' })
      unlock(game, 'remote_x', 'unlocked')
      unlock(game, 'vault_x', 'password', 'Pw2026!')
      post inventory_game_url(game), params: { action_type: 'remove', item: { id: 'remote_x' } }, as: :json

      container(game, 'remote_x')
      assert_response :not_found
      container(game, 'vault_x')
      assert_response :not_found
      unlock(game, 'remote_x', 'unlocked')
      assert_response :success
      refute response.parsed_body.key?('contents')
    end

    # --- Payloads --------------------------------------------------------------

    test 'the scenario and room payloads ship no grant contents' do
      game = build_game
      add(game, { type: 'pc', id: 'remote_x', name: 'Remote X' })

      get scenario_game_url(game)
      assert_response :success
      body = response.body
      [SECRET_TEXT, VAULT_TEXT, 'Pw2026!'].each { |s| refute_includes body, s }
      timer_item = response.parsed_body['timers'][0]['actions'][0]['item']
      assert_equal true, timer_item['hasContents']
      refute timer_item.key?('contents')
      held = response.parsed_body['playerInventory'].sole
      assert_equal 'remote_x', held['id']
      refute held.key?('contents')

      get room_game_url(game, room_id: 'hall')
      assert_response :success
      refute_includes response.body, 'touch secret'
      sign = response.parsed_body['room']['objects'].find { |o| o['id'] == 'sign' } ||
             response.parsed_body['objects']&.find { |o| o['id'] == 'sign' }
      refute_nil sign
      assert_equal true, sign['triggerOnInteract'][0]['item']['hasContents']
    end

    test 'the scenario snapshot itself keeps the contents for the server lookups' do
      game = build_game
      get scenario_game_url(game)
      assert game.reload.scenario_data['timers'][0]['actions'][0]['item']['contents'].present?
    end

    # --- Reload and reset ---------------------------------------------------------

    test 'after a reset the opener is gone and its contents are not served' do
      game = build_game
      add(game, { type: 'pc', id: 'remote_x', name: 'Remote X' })
      game.reload.reset_player_state!
      container(game, 'remote_x')
      assert_response :not_found
    end

    # --- Legacy snapshot (twin still present, grant item without contents) --------

    test 'a game whose snapshot still has the twin works as before' do
      legacy_item = remote_item.except('contents')
      game = build_game(twin: true, grant_item: legacy_item)
      add(game, { type: 'pc', id: 'remote_x', name: 'Remote X' })
      assert_response :success
      stored = inventory(game).sole
      refute stored.key?('contents')
      unlock(game, 'remote_x', 'unlocked')
      assert_response :success
      assert_equal %w[payroll.txt vault.zip], response.parsed_body['contents'].map { |c| c['name'] }
      container(game, 'remote_x')
      assert_response :success
    end
  end
end
