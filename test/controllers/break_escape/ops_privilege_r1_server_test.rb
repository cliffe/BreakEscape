require 'test_helper'
require_relative 'ops_privilege_scenario_test'

module BreakEscape
  # Ops S5bc stage review round 1, server findings R1-SERVER1 to R1-SERVER4, R1-SERVER6 and
  # R1-SERVER2, on the real test_ops_privilege scenario (one field changed where a test says so).
  class OpsPrivilegeR1ServerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsPrivilegeBeats

    teardown { travel_back }

    def build_with
      travel_to(BEATS_START)
      data = beats_scenario
      yield data if block_given?
      game = Game.new(id: BEATS_GAME_ID + 777, mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                      scenario_data: data,
                      player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby bay store it_room],
                                      'encounteredNPCs' => %w[olu uma adel priya sam ravi], 'unlockedObjects' => %w[lobby_cabinet] })
      game.prepare_scenario_data!
      game.save!
      @game = game
      @answers = {}
    end

    def object_in(data, id)
      data['rooms'].values.flat_map { |r| r['objects'] || [] }.find { |o| o['id'] == id }
    end

    # ---- R1-SERVER1: access.people never names an account-only account ----

    PEOPLE = { 'people' => %w[deskadmin adel] }.freeze

    test 'R1-SERVER1 a room answer drops an account-only id from a PC access list and keeps the others' do
      build_with { |d| object_in(d, 'desk_a')['access'] = PEOPLE.deep_dup }
      get b_path('room/it_room'), as: :json
      assert_response :success
      refute_includes response.body, 'deskadmin'
      pc = response.parsed_body['room']['objects'].find { |o| o['id'] == 'desk_a' }
      assert_equal %w[adel], pc['access']['people']
    end

    def with_listed_items
      lambda do |d|
        d['rooms']['it_room']['objects'] << { 'type' => 'notes', 'id' => 'r1_loose', 'name' => 'Loose note', 'takeable' => true,
                                                'access' => { 'people' => %w[deskadmin adel] } }
        object_in(d, 'desk_b')['access'] = { 'roles' => ['it'], 'people' => %w[labadmin adel] }
        object_in(d, 'lobby_cabinet')['contents'].first['access'] = { 'people' => %w[deskadmin adel] }
        npc = d['rooms'].values.flat_map { |r| r['npcs'] || [] }.find { |n| n['id'] == 'olu' }
        npc['itemsHeld'] = Array(npc['itemsHeld']) + [{ 'type' => 'notes', 'id' => 'r1_held', 'name' => 'Held', 'takeable' => true,
                                                         'access' => { 'people' => %w[deskadmin adel] } }]
      end
    end

    test 'R1-SERVER1 a nested item, an NPC itemsHeld item and a second list drop it in every room answer' do
      build_with(&with_listed_items)
      %w[lobby it_room bay store].each do |room|
        get b_path("room/#{room}"), as: :json
        assert_response :success
        refute_includes response.body, 'deskadmin', "room #{room}"
        refute_includes response.body, 'labadmin', "room #{room}"
      end
      get b_path('room/it_room'), as: :json
      objects = response.parsed_body['room']['objects']
      assert_equal %w[adel], objects.find { |o| o['id'] == 'r1_loose' }['access']['people']
      desk_b = objects.find { |o| o['id'] == 'desk_b' }
      assert_equal %w[adel], desk_b['access']['people']
      assert_equal %w[it], desk_b['access']['roles']
    end

    test 'R1-SERVER1 a container answer and an inventory add answer drop it' do
      build_with(&with_listed_items)
      get b_path('container/lobby_cabinet'), as: :json
      assert_response :success, response.body
      refute_includes response.body, 'deskadmin'
      assert_includes response.body, 'card_stale'
      post b_path('inventory'), params: { action_type: 'add', item: { type: 'technique_card', id: 'card_stale', name: 'x' } }, as: :json
      assert_response :success, response.body
      refute_includes response.body, 'deskadmin'
    end

    test 'R1-SERVER1 the bootstrap names no account-only id from an access list' do
      build_with { |d| object_in(d, 'desk_a')['access'] = PEOPLE.deep_dup }
      get b_path('scenario'), as: :json
      assert_response :success
      refute_includes response.body, 'deskadmin'
    end

    # ---- R2-SERVER1: a room's own access list, and every answer, in every route ----

    def with_room_lists
      lambda do |d|
        d['rooms']['it_room']['access'] = { 'roles' => ['it'], 'people' => %w[deskadmin adel] }
        d['rooms']['lobby']['access'] = { 'people' => %w[deskadmin adel] }
        object_in(d, 'desk_a')['access'] = PEOPLE.deep_dup
        object_in(d, 'lobby_cabinet')['access'] = PEOPLE.deep_dup
      end
    end

    test 'R2-SERVER1 the bootstrap strips a room access list and keeps the rest' do
      build_with(&with_room_lists)
      get b_path('scenario'), as: :json
      assert_response :success
      refute_includes response.body, 'deskadmin'
      rooms = response.parsed_body['rooms']
      assert_equal %w[adel], rooms['it_room']['access']['people']
      assert_equal %w[it], rooms['it_room']['access']['roles']
      assert_equal %w[adel], rooms['lobby']['access']['people']
    end

    test 'R2-SERVER1 the room, container, network and sync answers name no account-only id' do
      build_with(&with_room_lists)
      %w[lobby it_room bay store].each do |room|
        get b_path("room/#{room}"), as: :json
        refute_includes response.body, 'deskadmin', "room #{room}"
      end
      get b_path('container/lobby_cabinet'), as: :json
      refute_includes response.body, 'deskadmin', 'container'
      get b_path('network'), as: :json
      refute_includes response.body, 'deskadmin', 'network'
      put b_path('sync_state'), params: { playerState: {} }, as: :json
      refute_includes response.body, 'deskadmin', 'sync_state'
    end

    # ---- R1-SERVER3: GET /ink and POST /tts ----

    def ink_and_tts(id)
      get b_path('ink'), params: { npc: id }
      ink = [response.status, response.body.gsub(id, '<id>')]
      post b_path('tts'), params: { npc_id: id, text: 'hello' }, as: :json
      [ink, [response.status, response.body.gsub(id, '<id>')]]
    end

    test 'R1-SERVER3 an account-only id answers /ink and /tts exactly as an invented id' do
      build_with
      hidden = ink_and_tts('deskadmin')
      invented = ink_and_tts('zz_nobody')
      assert_equal invented, hidden
      assert_equal 404, hidden[0][0]
      assert_equal 404, hidden[1][0]
      lab = ink_and_tts('labadmin')
      assert_equal invented, lab
    end

    test 'R1-SERVER3 a real person NPC still answers /ink as before' do
      build_with
      get b_path('ink'), params: { npc: 'olu' }
      assert_not_equal 404, response.status, response.body
    end

    # ---- R1-SERVER4: PUT /sync_state hostility ----

    test 'R1-SERVER4 a hostility entry for an account-only id is dropped like an invented one (scenario_data loaded)' do
      build_with
      h = { deskadmin: { hostile: true, ko: false }, zz_nobody: { hostile: true, ko: false }, olu: { hostile: true, ko: false } }
      put b_path('sync_state'), params: { npcHostility: h, playerState: { npcHostility: h } }, as: :json
      assert_response :success
      assert_equal %w[olu], b_state['npcHostility'].keys
      get b_path('scenario'), as: :json
      refute_includes response.body, 'deskadmin'
    end

    test 'R1-SERVER4 scenario_npc_ids leaves out account-only NPCs on both loads' do
      build_with
      full = Game.find(@game.id)
      assert_includes full.scenario_npc_ids, 'olu'
      refute_includes full.scenario_npc_ids, 'deskadmin'
      refute_includes full.scenario_npc_ids, 'labadmin'
      narrow = Game.select(:id, :player_state).find(@game.id)
      refute narrow.has_attribute?(:scenario_data)
      assert_includes narrow.scenario_npc_ids, 'olu'
      refute_includes narrow.scenario_npc_ids, 'deskadmin'
      refute_includes narrow.scenario_npc_ids, 'labadmin'
    end

    # ---- R1-SERVER6: the log reader's profile cell ----

    test 'R1-SERVER6 profile_shown_name gives the id for an account-only owner and the name for a person' do
      build_with do |d|
        d['accountProfiles']['desk_files'] = { 'for' => { 'people' => ['deskadmin'] }, 'name' => 'Local files',
                                                'contents' => [{ 'id' => 'desk_note', 'type' => 'text_file', 'name' => 'Build note', 'takeable' => true, 'text' => 'b' }] }
        d['accountProfiles']['sam_files'] = { 'for' => { 'people' => ['sam'] }, 'name' => 'Sam files',
                                               'contents' => [{ 'id' => 'sam_note', 'type' => 'text_file', 'name' => 'Sam note', 'takeable' => true, 'text' => 'b' }] }
      end
      pc = { 'kind' => 'pc', 'id' => 'desk_a' }
      assert_equal 'desk_files', OpsLogEvents.profile_shown_name(b_game, 'desk_files', pc)
      assert_equal 'Sam Okoro', OpsLogEvents.profile_shown_name(b_game, 'sam_files', { 'kind' => 'pc', 'id' => 'hot_desk' })
    end

    # ---- R1-SERVER2: collect on a save made before this stage ----

    test 'R1-SERVER2 a collect that adds nothing on an old save is 200 and writes no harvestedAccounts key' do
      build_with
      g = b_game
      g.update_column(:player_state, g.player_state.except('harvestedAccounts', 'cachedAt'))
      b_login('store_pc', ADEL_LOGIN)
      b_take('text_file', 'adel_assist_code', 'Adel assist code.txt')
      post b_path('harvest_credentials'), params: { pc_id: 'store_pc' }, as: :json
      assert_response :success, response.body
      assert_equal [], response.parsed_body['harvested']
      assert_not b_state.key?('harvestedAccounts')
    end
  end
end
