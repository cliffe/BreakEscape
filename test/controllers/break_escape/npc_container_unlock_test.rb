require 'test_helper'

module BreakEscape
  # Unlock gaps build (2026-11-12; USB habit code review R3 m4): a container an NPC carries (a
  # bag, a folder, a laptop) failed once a knock-out dropped it or a conversation gave it, since
  # Game#find_scenario_object never looked at NPC-held items. The server now finds such a
  # container through its give or KO record (Game#released_npc_containers), as held_usb_sticks
  # does for habit sticks, and still checks the container's own lock. A container its NPC still
  # holds, or an id the browser invents, resolves to nothing.
  class NpcContainerUnlockTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    BAG_PASSWORD = 'Satchel42'.freeze

    def scenario
      {
        'scenario_brief' => 'NPC-held containers',
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'connections' => {}, 'objects' => [],
            'npcs' => [
              { 'id' => 'courier', 'displayName' => 'Courier', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
                'itemsHeld' => [
                  { 'type' => 'bag1', 'id' => 'courier_bag', 'name' => 'Courier Bag', 'takeable' => true,
                    'locked' => true, 'lockType' => 'password', 'requires' => BAG_PASSWORD,
                    'contents' => [{ 'type' => 'notes', 'id' => 'bag_memo', 'name' => 'Delivery Memo', 'takeable' => true }] },
                  { 'type' => 'briefcase', 'id' => 'courier_folder', 'name' => 'Courier Folder', 'takeable' => true,
                    'contents' => [{ 'type' => 'notes', 'id' => 'folder_sheet', 'name' => 'Route Sheet', 'takeable' => true }] }
                ] },
              { 'id' => 'clerk', 'displayName' => 'Clerk', 'npcType' => 'person', 'position' => { 'x' => 6, 'y' => 3 },
                'itemsHeld' => [
                  { 'type' => 'briefcase', 'id' => 'clerk_case', 'name' => 'Clerk Case', 'takeable' => true,
                    'contents' => [{ 'type' => 'notes', 'id' => 'clerk_ledger', 'name' => 'Ledger', 'takeable' => true }] }
                ] }
            ]
          }
        }
      }
    end

    setup do
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby] }
      )
      # Meet both NPCs the way the game does: the room is served
      get room_game_url(@game, room_id: 'lobby'), as: :json
      assert_response :success
    end

    def unlock(target_id, attempt, method)
      post unlock_game_url(@game), params: { targetType: 'object', targetId: target_id, attempt: attempt, method: method }, as: :json
      response
    end

    def container(id)
      get "/break_escape/games/#{@game.id}/container/#{id}", as: :json
      response
    end

    def take(item, npc: nil)
      params = { action_type: 'add', item: item }
      params[:source_npc_id] = npc if npc
      post inventory_game_url(@game), params: params, as: :json
      response
    end

    def ko_drop(npc_id, item)
      post update_room_game_url(@game), params: {
        roomId: 'lobby', actionType: 'add_object', data: item.merge('x' => 64, 'y' => 64),
        sourceNpcId: npc_id, sourceType: 'npc_defeated'
      }, as: :json
      response
    end

    # ── a container a knock-out dropped ──────────────────────────────────

    test 'a dropped locked bag checks its own password, then opens and serves its contents' do
      assert_equal 200, ko_drop('courier', { 'type' => 'bag1', 'id' => 'courier_bag', 'name' => 'Courier Bag' }).status

      assert_equal 422, unlock('courier_bag', 'wrong', 'password').status
      refute_includes response.body, 'bag_memo'
      assert_equal 403, container('courier_bag').status, 'still locked'

      res = unlock('courier_bag', BAG_PASSWORD, 'password')
      assert_equal 200, res.status, res.body
      assert_equal ['bag_memo'], res.parsed_body['contents'].map { |c| c['id'] }

      res = container('courier_bag')
      assert_equal 200, res.status, res.body
      assert_equal ['bag_memo'], res.parsed_body['contents'].map { |c| c['id'] }

      res = take({ 'type' => 'notes', 'id' => 'bag_memo', 'name' => 'Delivery Memo' })
      assert_equal 200, res.status, res.body
      assert(@game.reload.player_state['inventory'].any? { |i| i['id'] == 'bag_memo' })
    end

    test 'the bag never ships its password, before or after the drop' do
      get room_game_url(@game, room_id: 'lobby'), as: :json
      refute_includes response.body, BAG_PASSWORD
      ko_drop('courier', { 'type' => 'bag1', 'id' => 'courier_bag', 'name' => 'Courier Bag' })
      get room_game_url(@game, room_id: 'lobby'), as: :json
      refute_includes response.body, BAG_PASSWORD
      refute_includes response.body, 'bag_memo'
    end

    # ── a container a conversation gave ──────────────────────────────────

    test 'a given folder opens from the tray and its contents can be taken' do
      assert_equal 422, unlock('courier_folder', nil, 'unlocked').status, 'not before the give'

      res = take({ 'type' => 'briefcase', 'id' => 'courier_folder', 'name' => 'Courier Folder' }, npc: 'courier')
      assert_equal 200, res.status, res.body

      res = unlock('courier_folder', nil, 'unlocked')
      assert_equal 200, res.status, res.body
      assert_equal ['folder_sheet'], res.parsed_body['contents'].map { |c| c['id'] }
      assert_equal 200, container('courier_folder').status

      res = take({ 'type' => 'notes', 'id' => 'folder_sheet', 'name' => 'Route Sheet' })
      assert_equal 200, res.status, res.body
    end

    test 'a give of one container does not release the other the NPC still holds' do
      take({ 'type' => 'briefcase', 'id' => 'courier_folder', 'name' => 'Courier Folder' }, npc: 'courier')

      assert_equal 422, unlock('courier_bag', BAG_PASSWORD, 'password').status
      assert_equal 404, container('courier_bag').status
    end

    # ── forged ids ───────────────────────────────────────────────────────

    test 'a container its NPC still holds is refused, even with the right answer' do
      assert_equal 422, unlock('courier_bag', BAG_PASSWORD, 'password').status
      assert_equal 422, unlock('clerk_case', nil, 'unlocked').status
      assert_equal 404, container('clerk_case').status
      res = take({ 'type' => 'notes', 'id' => 'clerk_ledger', 'name' => 'Ledger' })
      assert_equal 422, res.status, 'an item inside a container still held cannot be taken'
      refute_includes @game.reload.player_state['unlockedObjects'].to_a, 'clerk_case'
    end

    test 'a forged give record or inventory entry releases nothing' do
      # Records the browser cannot write: a client-added inventory copy, and a give record for
      # an NPC that is not in the scenario
      @game.player_state['inventory'] << { 'type' => 'briefcase', 'id' => 'clerk_case', 'name' => 'Clerk Case',
                                           BreakEscape::ItemIdentity::CLIENT_ADDED_MARKER => true }
      @game.player_state['npc_given_items'] = { 'ghost' => [{ 'type' => 'briefcase', 'id' => 'clerk_case' }] }
      @game.save!

      assert_equal 422, unlock('clerk_case', nil, 'unlocked').status
      assert_equal 422, unlock('invented_bag', nil, 'unlocked').status
      assert_equal 404, container('clerk_case').status
    end

    test 'a KO of one NPC releases only what that NPC carried' do
      ko_drop('courier', { 'type' => 'bag1', 'id' => 'courier_bag', 'name' => 'Courier Bag' })

      assert_equal 422, unlock('clerk_case', nil, 'unlocked').status
      assert_equal 200, unlock('courier_folder', nil, 'unlocked').status, 'a KO drops everything the courier holds'
    end
  end
end
