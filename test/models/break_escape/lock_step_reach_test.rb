require 'test_helper'

module BreakEscape
  # S8c unit 16: reach of a carried object (Rule D and G4). Nothing here writes state.
  class LockStepReachTest < ActiveSupport::TestCase
    def build_game(scenario, state = {})
      game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                          scenario_data: scenario,
                          player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'] }.merge(state))
      # a new game seeds the start items into the inventory: say what is held, exactly
      game.player_state['inventory'] = state['inventory'] || []
      game
    end

    def render(name)
      path = Dir[File.expand_path("../../../scenarios/#{name}/scenario.json{.erb,}", __dir__)].min_by { |p| p.end_with?('.erb') ? 0 : 1 }
      JSON.parse(BreakEscape::ScenarioBinding.render(File.read(path, encoding: 'UTF-8')))
    end

    def bag(id, extra = {})
      { 'type' => 'bag1', 'id' => id, 'name' => id, 'locked' => true, 'lockType' => 'pin', 'requires' => '1234',
        'contents' => [{ 'type' => 'notes', 'id' => "#{id}_n" }] }.merge(extra)
    end

    def scenario(room_objects: [], npc_items: [], start: [], extra_rooms: {})
      { 'startRoom' => 'hall',
        'startItemsInInventory' => start,
        'rooms' => { 'hall' => { 'type' => 'room_office', 'objects' => room_objects,
                                 'npcs' => [{ 'id' => 'amy', 'itemsHeld' => npc_items }] } }.merge(extra_rooms) }
    end



    test 'every home is listed with its chain and home' do
      s = scenario(room_objects: [bag('r', 'takeable' => true),
                                  { 'type' => 'desk', 'id' => 'd', 'contents' => [bag('n', 'takeable' => true)] },
                                  bag('fixed')],
                   npc_items: [bag('held')], start: [bag('st')])
      g = build_game(s)
      assert_equal Set.new(%w[r n held st]), g.carried_step_ids
      assert_equal 'room', g.carried_step_chains['r']['home']
      assert_equal 'nested', g.carried_step_chains['n']['home']
      assert_equal 'npc', g.carried_step_chains['held']['home']
      assert_equal 'start', g.carried_step_chains['st']['home']
      assert_equal ['r'], g.carried_step_chains['r']['chain']
    end

    test 'an id-less carrier and a plain item are not covered' do
      g = build_game(scenario(start: [bag('x').except('id'), { 'type' => 'key', 'id' => 'k' }]))
      assert_empty g.carried_step_ids
      assert g.carried_step_reachable?({ 'type' => 'bag1' }, [])
    end

    test 'a start item: reachable while held, refused once gone, reachable again when dropped in an open room' do
      s = scenario(start: [bag('st')])
      held = build_game(s, 'inventory' => [{ 'type' => 'bag1', 'id' => 'st', 'name' => 'st' }])
      obj = s['startItemsInInventory'].first
      assert held.carried_step_reachable?(obj, [])
      assert held.carried_step_reachable?(obj['contents'].first, [obj])
      gone = build_game(s)
      assert_not gone.carried_step_reachable?(obj, [])
      assert_not gone.carried_step_reachable?(obj['contents'].first, [obj])
      dropped = build_game(s, 'room_states' => { 'hall' => { 'objects_added' => [{ 'type' => 'bag1', 'id' => 'st' }] } })
      assert dropped.carried_step_reachable?(obj, [])
      shut = build_game(s, 'room_states' => { 'vault' => { 'objects_added' => [{ 'type' => 'bag1', 'id' => 'st' }] } })
      assert_not shut.carried_step_reachable?(obj, [])
    end

    test 'a forged item with the id stands in for nothing' do
      s = scenario(start: [bag('st')])
      forged = { 'type' => 'bag1', 'id' => 'st', 'clientAdded' => true }
      g = build_game(s, 'inventory' => [forged],
                        'room_states' => { 'hall' => { 'objects_added' => [forged] } })
      assert_not g.carried_step_reachable?(s['startItemsInInventory'].first, [])
    end

    test 'an NPC item is out of reach until given, a room item stays reachable in place' do
      s = scenario(room_objects: [bag('r', 'takeable' => true)], npc_items: [bag('held')])
      g = build_game(s)
      assert_not g.carried_step_reachable?(s['rooms']['hall']['npcs'][0]['itemsHeld'][0], [])
      assert g.carried_step_reachable?(s['rooms']['hall']['objects'][0], [])
      given = build_game(s, 'inventory' => [{ 'type' => 'bag1', 'id' => 'held' }])
      assert given.carried_step_reachable?(s['rooms']['hall']['npcs'][0]['itemsHeld'][0], [])
    end

    test 'a nested takeable inside a room container is a nested home and in place' do
      s = scenario(room_objects: [{ 'type' => 'desk', 'id' => 'd', 'contents' => [bag('n', 'takeable' => true)] }])
      g = build_game(s)
      inner = s['rooms']['hall']['objects'][0]['contents'][0]
      assert g.carried_step_reachable?(inner, [s['rooms']['hall']['objects'][0]])
    end

    test 'a nested carrier inside a held briefcase follows the briefcase' do
      inner = bag('inner')
      case_item = { 'type' => 'briefcase', 'id' => 'case', 'contents' => [inner] }
      s = scenario(start: [case_item])
      assert_equal %w[case inner], build_game(s).carried_step_chains['inner']['chain']
      assert_equal Set['case'], build_game(s).carried_step_ids
      held = build_game(s, 'inventory' => [{ 'type' => 'briefcase', 'id' => 'case' }])
      assert held.carried_step_reachable?(inner, [case_item])
      assert_not build_game(s).carried_step_reachable?(inner, [case_item])
    end

    test 'a plain object nowhere near a carrier is untouched' do
      s = scenario(room_objects: [bag('fixed')], start: [bag('st')])
      g = build_game(s)
      fixed = s['rooms']['hall']['objects'][0]
      assert g.carried_step_reachable?(fixed, [])
      assert g.carried_step_reachable?(fixed['contents'][0], [fixed])
    end

    test 'the caller path is not changed' do
      s = scenario(start: [bag('st')])
      path = [s['startItemsInInventory'][0]]
      build_game(s).carried_step_reachable?({ 'id' => 'st_n' }, path)
      assert_equal 1, path.size
    end

    SURVEY = [
      ['ceo_exfil', 'room', nil], # id-less tablet: not covered
      ['test_social_m5_channels', 'room', 'm5_locked_terminal'],
      ['test_unlock_gaps', 'start', 'test_start_cryptex'],
      ['test_unlock_gaps', 'npc', 'test_courier_bag'],
      ['lab_social_engineering', 'grant', 'sofia_remote'],
      ['lab_social_engineering', 'grant', 'sofia_archive'],
      ['lab_physical_pentest', 'grant', 'records_remote_session'],
      ['test_capture_log', 'grant', 'remote_session_box']
    ].freeze

    test "unit 01's survey rows, rendered through ERB, are the carriers found" do
      SURVEY.each do |name, home, id|
        g = build_game(render(name))
        if id.nil?
          assert_not g.carried_step_chains.values.any? { |c| c['chain'].include?('reception_tablet_3') }, name
          next
        end
        row = g.carried_step_chains[id]
        assert row, "#{name}: #{id}"
        assert_equal home, row['home'], "#{name}: #{id}"
      end
      assert_equal %w[sofia_remote sofia_archive],
                   build_game(render('lab_social_engineering')).carried_step_chains['sofia_archive']['chain']
    end

    test 'the survey carriers are out of reach when gone and reachable when held' do
      g = build_game(render('test_unlock_gaps'))
      cryptex = g.scenario_data['startItemsInInventory'].find { |i| i['id'] == 'test_start_cryptex' }
      assert_not g.carried_step_reachable?(cryptex, [])
      held = build_game(render('test_unlock_gaps'), 'inventory' => [{ 'type' => cryptex['type'], 'id' => 'test_start_cryptex' }])
      assert held.carried_step_reachable?(cryptex, [])
      m5 = build_game(render('test_social_m5_channels'))
      terminal = m5.carried_step_chains['m5_locked_terminal']
      assert_equal 'room', terminal['home']
    end

    test 'a forged item loses secondStep' do
      assert_includes ItemIdentity::FORGEABLE_ITEM_FIELDS, 'secondStep'
      g = build_game(scenario)
      cleaned = g.strip_forgeable_lock_fields('type' => 'x', 'secondStep' => { 'kind' => 'push' },
                                              'scenarioData' => { 'secondStep' => {}, 'name' => 'n' })
      assert_not cleaned.key?('secondStep')
      assert_equal({ 'name' => 'n' }, cleaned['scenarioData'])
    end
  end
end
