require 'test_helper'
require_relative '../../support/lock_step_routes'

module BreakEscape
  # S8c unit 15, the carried table: a gated item the player carries (a room takeable, an NPC's
  # briefcase, a start item, a grant) and G4 for plain carriers (ambiguity A4): a hand-built
  # request for a carried container that has left the player is refused as an invented id, and
  # every flow a click can reach still passes. Through the real routes and the real gate.
  class LockStepCarriedTest < ActionDispatch::IntegrationTest
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
      grant = case_item('grantcase', '3333')
      { 'startRoom' => 'hall',
        'startItemsInInventory' => [case_item('startcase', '2222')],
        'timers' => [{ 'actions' => [{ 'type' => 'give_item', 'item' => grant }] }],
        'rooms' => { 'hall' => { 'type' => 'room_office', 'connections' => {},
                                 'objects' => [case_item('roomcase', '1111', 'droppable' => true),
                                               { 'type' => 'bag1', 'id' => 'plainbag', 'name' => 'Plain bag', 'takeable' => true,
                                                 'locked' => true, 'lockType' => 'pin', 'requires' => '9090',
                                                 'contents' => [memo('plainbag_memo')] }],
                                 'npcs' => [{ 'id' => 'amy', 'habits' => { 'approvesPrompts' => 'always' } },
                                            { 'id' => 'bob', 'itemsHeld' => [case_item('bobcase', '4444',
                                                                                       'secondStep' => { 'kind' => 'push', 'owner' => 'amy' },
                                                                                       'contents' => [memo('bobcase_memo'),
                                                                                                      case_item('inner', '5555')])] }] } } }
    end

    setup do
      travel_to T0
      build_step_game(scenario, 'encounteredNPCs' => %w[amy bob])
    end
    teardown { travel_back }

    def held_ids
      Array(game_state['inventory']).map { |i| i['id'] }
    end

    # the real route: the client removing an item from the tray (a give away, a drop, a bin)
    def remove_from_inventory!(id)
      post game_path('inventory'), params: { action_type: 'remove', item: { id: id } }, as: :json
      assert_response :success, response.body
    end

    def take(id, type = 'briefcase', npc: nil)
      add_item({ 'type' => type, 'id' => id, 'name' => "Case #{id}" }, npc ? { source_npc_id: npc } : {})
    end

    def pass_and_open(id, pin)
      assert_equal true, unlock('object', id, pin, 'pin')[1]['secondStep'], id
      assert_equal 200, mfa('prompt', "object:#{id}")[0]
      status, body = unlock('object', id, pin, 'pin')
      assert_equal [200, true], [status, body['success']], id
      body
    end

    # ---- every carried home ----

    test 'a start item is held from the start, gated like any lock, and opens after its step' do
      assert_includes held_ids, 'startcase'
      assert_nil game_state['inventory'].find { |i| i['id'] == 'startcase' }['contents']
      body = pass_and_open('startcase', '2222')
      assert_equal %w[startcase_memo], body['contents'].map { |c| c['id'] }
    end

    test 'a room takeable is taken, gated, and opens after its step' do
      assert_equal [404], [container('roomcase')[0]]
      assert_equal 200, take('roomcase')[0]
      body = pass_and_open('roomcase', '1111')
      assert_equal %w[roomcase_memo], body['contents'].map { |c| c['id'] }
    end

    test 'an item an NPC carries is given, gated, and opens after its step; a nested carrier asks its own gate' do
      assert_equal 200, take('bobcase', npc: 'bob')[0]
      body = pass_and_open('bobcase', '4444')
      assert_equal %w[bobcase_memo inner], body['contents'].map { |c| c['id'] }
      assert_nil body['contents'].last['contents'], 'the inner case is listed without its contents'
      _, gate = unlock('object', 'inner', '5555', 'pin')
      assert_equal 'inner', gate['targetId']
      assert_not_includes response.body, 'WORDS-inner_memo'
    end

    test 'a declared grant is claimed, gated, and opens after its step' do
      assert_equal 200, take('grantcase')[0]
      body = pass_and_open('grantcase', '3333')
      assert_equal %w[grantcase_memo], body['contents'].map { |c| c['id'] }
    end

    test 'the inner case of a briefcase the player never opened is refused as an invented id' do
      take('bobcase', npc: 'bob')
      same = unlock('object', 'no_such_thing_x', '5555', 'pin')
      assert_equal same, unlock('object', 'inner', '5555', 'pin')
      assert_equal 404, container('inner')[0]
      assert_equal [404, NOT_FOUND], mfa('prompt', 'object:inner')
    end

    # ---- drop and pick up, removal, re-add ----

    test 'a gated case dropped in an open room and picked up keeps its step and its request count' do
      take('roomcase')
      unlock('object', 'roomcase', '1111', 'pin')
      mfa('prompt', 'object:roomcase') if false
      before = game_state.dig('lockSteps', 'object:roomcase').deep_dup
      assert before
      item = game_state['inventory'].find { |i| i['id'] == 'roomcase' }.dup
      post game_path('update_room'), params: { roomId: 'hall', actionType: 'add_object', sourceType: 'player_drop',
                                               data: item.merge('x' => 64, 'y' => 64) }, as: :json
      assert_equal 200, response.status, response.body
      remove_from_inventory!('roomcase')
      assert_equal 'push', unlock('object', 'roomcase', '1111', 'pin')[1]['kind'], 'still reachable where it was dropped'
      assert_equal 200, take('roomcase')[0]
      assert_equal before.slice('kind', 'n', 'nonce'), game_state.dig('lockSteps', 'object:roomcase').slice('kind', 'n', 'nonce')
      assert_equal 1, game_state['inventory'].count { |i| i['id'] == 'roomcase' }, 'a re-add is not held twice'
      assert_equal 200, take('roomcase')[0]
      assert_equal 1, game_state['inventory'].count { |i| i['id'] == 'roomcase' }
    end

    test 'a briefcase an NPC gave, once it has left the player, is refused on every exit' do
      take('bobcase', npc: 'bob')
      pass_and_open('bobcase', '4444')
      remove_from_inventory!('bobcase')
      same = unlock('object', 'no_such_thing_x', '4444', 'pin')
      assert_equal same, unlock('object', 'bobcase', '4444', 'pin')
      assert_equal 404, container('bobcase')[0]
      assert_equal [404, NOT_FOUND], mfa('prompt', 'object:bobcase')
      assert_equal 422, add_item({ 'type' => 'notes1', 'id' => 'bobcase_memo', 'name' => 'Memo bobcase_memo' })[0]
    end

    test 'a client-built gated item loses its step and gets a fresh id, and opens nothing' do
      forged = case_item('forgedcase', '0000').except('contents')
      add_item(forged)
      assert_equal 422, response.status
      assert_not_includes held_ids, 'forgedcase'
      assert_empty(game_state['lockSteps'] || {})
    end

    # ---- R1-SERVER3 and R1-SERVER4: what stays in reach, and what each add route puts back ----

    # The limit, pinned: the server keeps no record of a take, so a takeable room object that has
    # left the player is still in reach where it was authored (every other carried home is refused).
    test 'a takeable room object that has left the player stays in reach by a hand-built request' do
      assert_equal 200, take('roomcase')[0]
      remove_from_inventory!('roomcase')
      assert_not_includes held_ids, 'roomcase'
      assert_equal true, unlock('object', 'roomcase', '1111', 'pin')[1]['secondStep']
      assert_equal 200, mfa('prompt', 'object:roomcase')[0]
      status, body = unlock('object', 'roomcase', '1111', 'pin')
      assert_equal 200, status
      assert_equal 'WORDS-roomcase_memo', body['contents'][0]['text']
      assert_equal 200, container('roomcase')[0]
    end

    test 're-add after removal, one test per route: a start item and an NPC item cannot come back, a grant item and a room object can' do
      refused = [422, { 'success' => false, 'message' => 'Item not found in scenario: briefcase' }]
      # start item: refused once gone, so the step cannot be reached either
      remove_from_inventory!('startcase')
      assert_equal refused, take('startcase')
      assert_equal INVALID, unlock('object', 'startcase', '2222', 'pin')[1]
      # an item an NPC gave: refused by the give route again, and by the plain route
      assert_equal 200, take('bobcase', npc: 'bob')[0]
      remove_from_inventory!('bobcase')
      assert_equal refused, take('bobcase', npc: 'bob')
      assert_equal refused, take('bobcase')
      assert_equal INVALID, unlock('object', 'bobcase', '4444', 'pin')[1]
      # a grant item: gone is refused, added again it asks both checks again
      assert_equal 200, take('grantcase')[0]
      remove_from_inventory!('grantcase')
      assert_equal INVALID, unlock('object', 'grantcase', '3333', 'pin')[1]
      assert_equal 200, take('grantcase')[0]
      assert_equal true, unlock('object', 'grantcase', '3333', 'pin')[1]['secondStep']
      # a room object: takeable again, the step still its own
      assert_equal 200, take('roomcase')[0]
      remove_from_inventory!('roomcase')
      assert_equal 200, take('roomcase')[0]
      assert_equal true, unlock('object', 'roomcase', '1111', 'pin')[1]['secondStep']
    end

    # ---- G4 for plain carriers, and the shipped scenarios ----

    test 'a plain carrier that is a room takeable stays reachable where it lies and when held' do
      assert_equal true, unlock('object', 'plainbag', '9090', 'pin')[1]['success']
      take('plainbag', 'bag1')
      assert_equal 200, container('plainbag')[0]
    end

    def gaps_scenario
      JSON.parse(ScenarioBinding.render(File.read(File.expand_path('../../../scenarios/test_unlock_gaps/scenario.json.erb', __dir__))))
    end

    # G4 for a scenario with no gated object is INERT today (the brief's resolver answers nil
    # when nothing is gated, and a KO release has no leg in Rule D: npc_container_unlock_test). These
    # two pin what the shipped scenarios do now, so turning G4 on is a decision that flips them.
    test 'test_unlock_gaps: the start cryptex and the courier bag behave as before the stage, held or not' do
      build_step_game(gaps_scenario, 'encounteredNPCs' => %w[test_courier])
      assert_includes held_ids, 'test_start_cryptex'
      assert_equal true, unlock('object', 'test_start_cryptex', 'TINDER', 'cryptex')[1]['success']
      assert_equal 200, container('test_start_cryptex')[0]
      assert_equal INVALID, unlock('object', 'test_courier_bag', 'Satchel42', 'password')[1], 'not given yet'
      assert_equal 404, container('test_courier_bag')[0]
      assert_equal 200, add_item({ 'type' => 'bag1', 'id' => 'test_courier_bag', 'name' => 'Courier Bag' }, source_npc_id: 'test_courier')[0]
      assert_equal true, unlock('object', 'test_courier_bag', 'Satchel42', 'password')[1]['success']
      assert_equal 200, container('test_courier_bag')[0]
    end
  end
end
