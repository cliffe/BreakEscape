require 'test_helper'

module BreakEscape
  # Slice 9.1 step 1 (ACCESS_MODEL_SLICE_9_1_PLAN.md, 5.1 and 5.2): the loader expands habits
  # into the saved scenario data, the claim check reads the owner's screenHabit, and the
  # scripts' copy agrees with the server. NpcHabits is reached by name with no require: the
  # proof that the engine's autoloader finds lib/break_escape/npc_habits.rb.
  class NpcHabitsLoaderTest < ActiveSupport::TestCase
    PASSWORD = 'Habits-Loader-PW-1'

    def owner(id, pc_id, extra = {})
      { 'id' => id, 'displayName' => id.capitalize, 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
        'creds' => { 'username' => id, 'password' => "#{PASSWORD}-#{id}" },
        'needsHome' => pc_id, 'needs' => { 'coffee' => { 'decayPerMin' => 30, 'urgentAt' => 40 } } }.merge(extra)
    end

    def login_pc(id, extra = {})
      { 'id' => id, 'type' => 'pc', 'name' => id, 'locked' => true, 'lockType' => 'login' }.merge(extra)
    end

    def scenario(npcs:, objects:, extra: {})
      { 'scenario_brief' => 'habits loader fixture', 'startRoom' => 'office',
        'rooms' => { 'office' => { 'type' => 'room_office', 'connections' => {}, 'objects' => objects, 'npcs' => npcs } } }
        .merge(extra)
    end

    def build(data, player_state: {})
      create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                         scenario: data, player_state: { 'unlockedRooms' => ['office'] }.merge(player_state))
    end

    def npc_in(game, id)
      game.scenario_data['rooms']['office']['npcs'].find { |n| n['id'] == id }
    end

    def claim_status(game, pc_id)
      game.claim_login_session!(pc_id)[:status]
    end

    test 'NpcHabits is found by the autoloader' do
      assert_equal %w[low medium high], BreakEscape::NpcHabits::LEVELS
    end

    test 'a game holds the expanded habits and the filled screenHabit, and no PC gains a field' do
      game = build(scenario(npcs: [owner('dana', 'dana_pc', 'role' => 'front_desk'),
                                   owner('ian', 'ian_pc', 'awareness' => 'high', 'habits' => { 'writesDown' => true })],
                            objects: [login_pc('dana_pc'), login_pc('ian_pc')],
                            extra: { 'roles' => { 'front_desk' => { 'awareness' => 'low' } } }))
      game.reload
      assert_equal({ 'locksScreen' => 'never', 'holdsDoors' => true }, npc_in(game, 'dana')['habits'])
      assert_equal({ 'lockChance' => 0 }, npc_in(game, 'dana')['screenHabit'])
      assert_equal({ 'locksScreen' => 'always', 'holdsDoors' => false, 'writesDown' => true }, npc_in(game, 'ian')['habits'])
      assert_equal({ 'lockChance' => 1 }, npc_in(game, 'ian')['screenHabit'])
      game.scenario_data['rooms']['office']['objects'].each do |pc|
        refute pc.key?('lockChance'), pc['id']
        refute pc.key?('locksScreenOnLeave'), pc['id']
      end
      assert_equal 'never', game.npc_habit(npc_in(game, 'dana'), 'locksScreen')
      assert game.written_down?(npc_in(game, 'ian'))
      refute game.written_down?(npc_in(game, 'dana'))
      assert_nil game.npc_habit({ 'id' => 'x' }, 'locksScreen')
    end

    test 'the loader writes gate.noHold for a careful guard, and the room data carries it without the habits' do
      guard = ->(id, level) { { 'id' => id, 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 }, 'awareness' => level } }
      data = scenario(npcs: [guard.call('sara', 'high'), guard.call('gary', 'low')], objects: [])
      data['rooms']['office']['connections'] = { 'north' => 'store_a', 'south' => 'store_b' }
      data['rooms']['office']['doors'] = [
        { 'connectedRoom' => 'store_a', 'direction' => 'north', 'gate' => { 'openFor' => ['gary'] } },
        { 'connectedRoom' => 'store_b', 'direction' => 'south', 'gate' => { 'openFor' => ['sara'] } }
      ]
      data['rooms']['store_a'] = { 'type' => 'room_office', 'connections' => { 'south' => 'office' }, 'locked' => true }
      data['rooms']['store_b'] = { 'type' => 'room_office', 'connections' => { 'north' => 'office' }, 'locked' => true }
      game = build(data)
      game.reload
      doors = game.scenario_data['rooms']['office']['doors']
      refute doors[0]['gate'].key?('noHold'), 'a holder gets none'
      assert_equal ['sara'], doors[1]['gate']['noHold']
      room = game.filtered_room_data('office')
      assert_equal ['sara'], room['doors'][1]['gate']['noHold']
      room['npcs'].each { |npc| refute npc.key?('habits'), npc['id'] }
    end

    test 'the owner of a PC with a screenOwner and no authored id is filled' do
      data = scenario(npcs: [owner('dana', nil, 'awareness' => 'low').tap { |n| n.delete('needsHome') }],
                      objects: [{ 'type' => 'pc', 'name' => 'Desk', 'workstation' => true, 'screenOwner' => 'dana' }])
      game = build(data)
      assert_equal 'office_pc_0', game.scenario_data['rooms']['office']['objects'][0]['id']
      assert_equal({ 'lockChance' => 0 }, npc_in(game, 'dana')['screenHabit'])
    end

    test 'a second prepare_scenario_data! changes nothing' do
      game = build(scenario(npcs: [owner('dana', 'dana_pc', 'awareness' => 'medium')], objects: [login_pc('dana_pc')]))
      once = game.scenario_data.deep_dup
      game.prepare_scenario_data!
      assert_equal once, game.scenario_data
    end

    test 'a game made with Game.create! and hand-set scenario_data is untouched' do
      data = scenario(npcs: [owner('dana', 'dana_pc', 'awareness' => 'low')], objects: [login_pc('dana_pc')])
      game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                          scenario_data: data.deep_dup)
      assert_equal data, game.reload.scenario_data
    end

    test 'a game is created from each malformed fixture' do
      fixtures = [
        scenario(npcs: [owner('dana', 'dana_pc', 'habits' => 'careless')], objects: [login_pc('dana_pc')]),
        scenario(npcs: [owner('dana', 'dana_pc', 'awareness' => 3)], objects: [login_pc('dana_pc')]),
        scenario(npcs: [owner('dana', 'dana_pc', 'role' => 'x')], objects: [login_pc('dana_pc')],
                 extra: { 'roles' => [{ 'x' => { 'awareness' => 'low' } }] }),
        scenario(npcs: ['dana', 7], objects: [login_pc('dana_pc')])
      ]
      fixtures.each do |data|
        game = nil
        assert_nothing_raised { game = build(data) }
        assert game.persisted?
      end
    end

    test 'a claim at the PC of a never owner is granted and at the PC of an always owner refused' do
      data = scenario(npcs: [owner('dana', 'dana_pc', 'awareness' => 'low'), owner('ian', 'ian_pc', 'awareness' => 'high')],
                      objects: [login_pc('dana_pc'), login_pc('ian_pc')])
      game = build(data)
      assert_equal :ok, claim_status(game, 'dana_pc')
      assert_equal :unprocessable_entity, claim_status(game, 'ian_pc')
    end

    test 'the claim check reads an authored screenHabit, without any habit' do
      cases = {
        { 'lockChance' => 0 } => :ok,
        # Owner claim q78: with nothing to meet Dana's need, her only leave is a knock-out, which
        # has no time-away estimate, so a threshold alone never leaves the screen open
        { 'lockIfAwayOverSeconds' => 20 } => :unprocessable_entity,
        { 'lockChance' => 1 } => :unprocessable_entity,
        nil => :unprocessable_entity
      }
      cases.each do |habit, expected|
        extra = habit ? { 'screenHabit' => habit } : {}
        game = build(scenario(npcs: [owner('dana', 'dana_pc', extra)], objects: [login_pc('dana_pc')]))
        assert_equal expected, claim_status(game, 'dana_pc'), habit.inspect
        assert_equal habit, npc_in(game, 'dana')['screenHabit'] if habit
      end

      # The same threshold with a coffee to fetch: a short trip can leave the screen open
      coffee = { 'id' => 'coffee_1', 'type' => 'notes', 'name' => 'Coffee', 'affordance' => { 'satisfies' => 'coffee' } }
      game = build(scenario(npcs: [owner('dana', 'dana_pc', 'screenHabit' => { 'lockIfAwayOverSeconds' => 20 })],
                            objects: [login_pc('dana_pc'), coffee]))
      assert_equal :ok, claim_status(game, 'dana_pc'), 'a threshold with a need source'

      game = build(scenario(npcs: [owner('dana', 'dana_pc', 'screenHabit' => { 'lockChance' => 0 })],
                            objects: [login_pc('dana_pc', 'locksScreenOnLeave' => true)]))
      assert_equal :unprocessable_entity, claim_status(game, 'dana_pc'), 'the PC field wins'

      game = build(scenario(npcs: [owner('dana', 'dana_pc', 'screenHabit' => { 'lockChance' => 0 })],
                            objects: [login_pc('dana_pc', 'policy' => 'instant')],
                            extra: { 'policies' => { 'instant' => { 'autoLockMin' => 0 } } }))
      assert_equal :unprocessable_entity, claim_status(game, 'dana_pc'), 'autoLockMin 0 still refuses'
    end

    test "the scripts' copy agrees with the server on room object ids and filled habits" do
      raw = scenario(
        npcs: [owner('dana', 'office_pc_1', 'awareness' => 'low'), owner('ian', nil, 'awareness' => 'high').tap { |n| n.delete('needsHome') },
               owner('mei', 'mei_pc', 'habits' => { 'locksScreen' => 'sometimes' })],
        objects: [{ 'type' => 'desk', 'name' => 'Desk', 'contents' => [{ 'type' => 'notes', 'name' => 'n' },
                                                                         { 'type' => 'box', 'name' => 'b', 'contents' => [{ 'type' => 'key', 'name' => 'k' }] }] },
                  { 'type' => 'pc', 'name' => 'Dana PC', 'workstation' => true },
                  { 'type' => 'pc', 'name' => 'Ian PC', 'lockType' => 'login', 'locked' => true, 'screenOwner' => 'ian',
                    'contents' => [{ 'type' => 'text_file', 'name' => 'f' }] },
                  login_pc('mei_pc')]
      )
      copy, = BreakEscape::NpcHabits.expanded_copy(raw)
      game = build(raw)

      ids = lambda do |data|
        out = []
        walk = ->(list) { list.each { |o| out << o['id']; walk.call(o['contents'] || []) } }
        walk.call(data['rooms']['office']['objects'])
        out
      end
      assert_equal ids.call(game.scenario_data), ids.call(copy)
      %w[dana ian mei].each do |id|
        server = npc_in(game, id)['screenHabit']
        refute_nil server, id
        assert_equal server, copy['rooms']['office']['npcs'].find { |n| n['id'] == id }['screenHabit'], id
      end
    end
  end
end
