require 'test_helper'

module BreakEscape
  # A KO drop's identity comes from the server's record of what the NPC holds, never from the
  # client. find_npc_held_item matches a held item with no id by type and name, so a drop that
  # named another scenario item's id used to be stored under that id (add_item_to_room! kept the
  # client id when the held item had none). Picked up, add_inventory_item! re-stamped that other
  # item's `credential` onto it, and the keyring's `held` proof fired for a file the player never
  # reached.
  #
  # Held items get `<npcId>_held_<n>` at creation (stamp_scenario_object_ids!), so a fresh game has
  # no id-less held item. A save made before that stamping has them: the setup writes scenario_data
  # with update_columns, which skips the stamping, to reproduce such a save.
  class KnockoutDropItemIdTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      mission = Mission.create!(name: 'test_simple_success', display_name: 'KO drop id', published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
      data = scenario.merge('formatVersion' => BreakEscape::FormatUpgrade.current)
      @game.update_columns(scenario_data: data,
                           player_state: @game.player_state.merge('currentRoom' => 'office', 'unlockedRooms' => %w[office]))
    end

    # lena_rdp_file (a credential item) sits in a locked vault the player cannot reach. Mark, in the
    # office, holds an id-less text file of the same type and an id-less, nameless one, as an old
    # save has them. (A nameless id-less item is refused as a drop, as before this fix: the client
    # always sends a generated id, and find_npc_held_item matches type alone only with no id.)
    def scenario
      {
        'scenario_brief' => 'KO drop id test', 'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'connections' => { 'north' => 'vault' },
            'npcs' => [
              { 'id' => 'lena', 'displayName' => 'Lena Fox', 'creds' => { 'username' => 'lfox', 'password' => 'Ledger-Lena-9' } },
              { 'id' => 'mark', 'displayName' => 'Mark', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                'itemsHeld' => [
                  { 'type' => 'text_file', 'name' => 'notes.txt', 'takeable' => true, 'text' => 'Nothing here.' },
                  { 'type' => 'lockpick', 'takeable' => true }
                ] }
            ],
            'objects' => [
              { 'id' => 'lena_pc', 'type' => 'pc', 'lockType' => 'login', 'name' => 'Lena PC', 'host' => 'HB-FIN-02',
                'access' => { 'people' => %w[lena] } }
            ]
          },
          'vault' => {
            'locked' => true, 'lockType' => 'key', 'requires' => 'vault_key',
            'connections' => { 'south' => 'office' }, 'npcs' => [],
            'objects' => [
              { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'takeable' => true,
                'credential' => 'lena_rdp', 'text' => 'Saved connection.' }
            ]
          }
        },
        'credentials' => {
          'lena_rdp' => { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                          'proof' => { 'held' => 'lena_rdp_file' } }
        }
      }
    end

    def knock_out_mark
      get room_game_url(@game, room_id: 'office'), as: :json # meets Mark
      assert_response :success
      post update_room_game_url(@game), params: {
        roomId: 'office', actionType: 'update_npc_state',
        data: { npcId: 'mark', stateChanges: { isKO: true, currentHP: 0 } }
      }, as: :json
      assert_response :success
    end

    def drop(item)
      post update_room_game_url(@game), params: {
        roomId: 'office', actionType: 'add_object', data: item.merge('x' => 64, 'y' => 64),
        sourceNpcId: 'mark', sourceType: 'npc_defeated'
      }, as: :json
      response
    end

    def take(item)
      post inventory_game_url(@game), params: { action_type: 'add', item: item }, as: :json
      response
    end

    def added
      Array(@game.reload.player_state.dig('room_states', 'office', 'objects_added'))
    end

    def keyring_ids
      get keyring_game_url(@game), as: :json
      assert_response :success
      response.parsed_body.fetch('entries').map { |e| e['id'] }
    end

    def inventory
      Array(@game.reload.player_state['inventory'])
    end

    test 'the setup reproduces an old save: Mark\'s held items have no id' do
      mark = @game.scenario_data['rooms']['office']['npcs'].find { |n| n['id'] == 'mark' }
      assert(mark['itemsHeld'].all? { |i| i['id'].nil? })
    end

    test 'a KO drop naming another item\'s id is not stored under it, and earns no held proof' do
      knock_out_mark
      drop('type' => 'text_file', 'name' => 'notes.txt', 'id' => 'lena_rdp_file')
      dropped = added

      # Try every id the forger could pick it up by: none of them reaches lena_rdp_file's credential
      take('type' => 'text_file', 'name' => 'notes.txt', 'id' => 'lena_rdp_file')
      dropped.each { |o| take('type' => o['type'], 'name' => o['name'], 'id' => o['id']) }

      refute_includes keyring_ids, 'lena_rdp', "a forged drop id minted the held proof: #{inventory.inspect}"
      refute(inventory.any? { |i| (i['scenarioData'] || i)['credential'].present? }, inventory.inspect)
      refute(inventory.any? { |i| (i['scenarioData'] || i)['id'] == 'lena_rdp_file' }, inventory.inspect)
      refute(dropped.any? { |o| o['id'] == 'lena_rdp_file' }, "the client's id was kept: #{dropped.inspect}")
    end

    test 'the credential restamp never stamps a client-added object, whatever its id' do
      forged = { 'id' => 'lena_rdp_file', 'type' => 'text_file', ItemIdentity::CLIENT_ADDED_MARKER => true }
      @game.send(:restamp_item_credential!, forged)
      refute forged.key?('credential')

      honest = { 'id' => 'lena_rdp_file', 'type' => 'text_file' }
      @game.send(:restamp_item_credential!, honest)
      assert_equal 'lena_rdp', honest['credential']
    end

    test 'an id-less held item still drops under a server id and is picked up' do
      knock_out_mark
      # The client sends its own generated id for an item with none (npc-hostile.js dropNPCItems)
      assert_equal 200, drop('type' => 'text_file', 'name' => 'notes.txt', 'id' => 'dropped_mark_0_1700000000000').status
      assert_equal ['mark_held_0'], added.map { |o| o['id'] }, 'the server names it as a fresh game would'
      assert_equal 'Nothing here.', added.first['text'], 'the full held definition is stored'

      # A retried drop is stored once
      assert_equal 200, drop('type' => 'text_file', 'name' => 'notes.txt', 'id' => 'dropped_mark_0_1700000000001').status
      assert_equal 1, added.size

      # Picked up by the client's own id, as the sprite still has it before a reload: found by name
      assert_equal 200, take('type' => 'text_file', 'name' => 'notes.txt', 'id' => 'dropped_mark_0_1700000000000').status
      assert_equal 200, take('type' => 'text_file', 'name' => 'notes.txt', 'id' => 'mark_held_0').status
      stored = inventory.find { |i| i['id'] == 'mark_held_0' }
      assert stored, inventory.inspect
      refute stored.key?('credential')
    end
  end

  # The honest path for a held item that does carry a credential: it still stamps on pick-up.
  class KnockoutDropCredentialTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: {
          'scenario_brief' => 'KO drop credential', 'startRoom' => 'office',
          'rooms' => {
            'office' => {
              'npcs' => [
                { 'id' => 'lena', 'displayName' => 'Lena Fox', 'creds' => { 'username' => 'lfox', 'password' => 'Ledger-Lena-9' } },
                { 'id' => 'mark', 'displayName' => 'Mark', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                  'itemsHeld' => [
                    { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'takeable' => true,
                      'credential' => 'lena_rdp', 'text' => 'Saved connection.' }
                  ] }
              ],
              'objects' => [
                { 'id' => 'lena_pc', 'type' => 'pc', 'lockType' => 'login', 'name' => 'Lena PC', 'host' => 'HB-FIN-02',
                  'access' => { 'people' => %w[lena] } }
              ]
            }
          },
          'credentials' => {
            'lena_rdp' => { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                            'proof' => { 'held' => 'lena_rdp_file' } }
          }
        },
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => %w[office] }
      )
    end

    test 'a legitimate KO drop of a credential item stamps its credential when picked up' do
      get room_game_url(@game, room_id: 'office'), as: :json
      post update_room_game_url(@game), params: {
        roomId: 'office', actionType: 'update_npc_state',
        data: { npcId: 'mark', stateChanges: { isKO: true, currentHP: 0 } }
      }, as: :json
      assert_response :success
      post update_room_game_url(@game), params: {
        roomId: 'office', actionType: 'add_object',
        data: { 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'id' => 'lena_rdp_file', 'x' => 64, 'y' => 64 },
        sourceNpcId: 'mark', sourceType: 'npc_defeated'
      }, as: :json
      assert_response :success

      post inventory_game_url(@game), params: {
        action_type: 'add', item: { 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'id' => 'lena_rdp_file' }
      }, as: :json
      assert_response :success
      stored = @game.reload.player_state['inventory'].find { |i| i['id'] == 'lena_rdp_file' }
      assert stored
      assert_equal 'lena_rdp', stored['credential']

      get keyring_game_url(@game), as: :json
      assert_includes response.parsed_body.fetch('entries').map { |e| e['id'] }, 'lena_rdp'
    end
  end
end
