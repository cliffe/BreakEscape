require 'test_helper'

module BreakEscape
  # Server validation of enter_room task completion (plan section 8, Chunk F).
  # complete_task! must pass every player who honestly reached the room (via the
  # durable unlockedRooms / npcRouteRooms write, the start room or an awareness
  # world room) and refuse a forge with a retryable error, never stranding an
  # honest player. Each test is written so it would fail if the check or its
  # guarantee were removed.
  class EnterRoomValidationTest < ActiveSupport::TestCase
    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
    end

    # Build a game whose only objective is an enter_room task on `target`, with the
    # player_state lists set as given. `world_room` adds an awareness world room.
    def build_game(target:, unlocked: [], route_rooms: [], current: nil,
                   start_room: 'reception', world_room: nil)
      scenario = {
        'startRoom' => start_room,
        'rooms' => {},
        'objectives' => [{
          'aimId' => 'explore', 'title' => 'Explore', 'status' => 'active', 'order' => 0,
          'tasks' => [{
            'taskId' => 'enter_target', 'title' => 'Enter the target room',
            'type' => 'enter_room', 'targetRoom' => target, 'status' => 'active'
          }]
        }]
      }
      if world_room
        scenario['social'] = { 'awarenessEpisode' => { 'world' => { 'room' => world_room } } }
      end
      Game.create!(
        mission: @mission, player: @player, scenario_data: scenario,
        player_state: {
          'currentRoom' => current, 'unlockedRooms' => unlocked,
          'npcRouteRooms' => route_rooms, 'unlockedObjects' => [], 'inventory' => [],
          'encounteredNPCs' => [], 'globalVariables' => {}, 'health' => 100
        }
      )
    end

    def task_status(game)
      game.player_state.dig('objectivesState', 'tasks', 'enter_target', 'status')
    end

    # 14. Honest entry, room unlocked, currentRoom elsewhere (a delayed/dropped sync).
    test "14 honest entry passes when the room is unlocked even though currentRoom is elsewhere" do
      game = build_game(target: 'office1', unlocked: %w[reception office1], current: 'reception')
      result = game.complete_task!('enter_target')
      assert result[:success], "honest completion must not be refused: #{result.inspect}"
      assert_equal 'completed', task_status(game)
    end

    # 15. Forge, never reached.
    test "15 a forge that never reached the room is refused, retryable, task stays active" do
      game = build_game(target: 'office1', unlocked: ['reception'], current: 'reception')
      result = game.complete_task!('enter_target')
      refute result[:success]
      assert_equal 'Room not reached', result[:error]
      assert_equal true, result[:retryable]
      refute_equal 'completed', task_status(game)
    end

    # 16. Route-room slip-in (npcRouteRooms only).
    test "16 a route-room slip-in completes on npcRouteRooms membership alone" do
      game = build_game(target: 'secure_area', unlocked: ['reception'],
                        route_rooms: ['secure_area'], current: 'reception')
      result = game.complete_task!('enter_target')
      assert result[:success], "honest slip-in must complete: #{result.inspect}"
      assert_equal 'completed', task_status(game)
    end

    # 17. No prior sync at all (old tab): unlockedRooms carries it, currentRoom nil.
    test "17 completion succeeds with the room unlocked and no currentRoom ever set" do
      game = build_game(target: 'office1', unlocked: %w[reception office1], current: nil)
      result = game.complete_task!('enter_target')
      assert result[:success], "an old tab with no currentRoom must not be refused: #{result.inspect}"
      assert_equal 'completed', task_status(game)
    end

    # 18. Duplicated / retried completion is idempotent.
    test "18 a duplicated completion is idempotent and does not flip the task back to active" do
      game = build_game(target: 'office1', unlocked: %w[reception office1], current: 'office1')
      first = game.complete_task!('enter_target')
      assert first[:success]
      assert_equal 'completed', task_status(game)

      second = game.complete_task!('enter_target')
      assert second[:success]
      assert_equal 'Already completed', second[:message]
      third = game.complete_task!('enter_target')
      assert third[:success]
      assert_equal 'completed', task_status(game), 'the task stays completed across retries'
    end

    # 19. Entered then left: currentRoom has moved on, unlockedRooms still holds it.
    test "19 completion still succeeds after the player left the target room" do
      game = build_game(target: 'office1', unlocked: %w[reception office1], current: 'reception')
      result = game.complete_task!('enter_target')
      assert result[:success], "monotonic unlockedRooms must carry the check: #{result.inspect}"
      assert_equal 'completed', task_status(game)
    end

    # 20. Start room / world room, no unlock at all.
    test "20 an enter_room task on the start room completes with no unlock" do
      game = build_game(target: 'reception', unlocked: [], current: nil, start_room: 'reception')
      game.player_state['unlockedRooms'] = []
      result = game.complete_task!('enter_target')
      assert result[:success], "the start room disjunct must pass: #{result.inspect}"
      assert_equal 'completed', task_status(game)
    end

    test "20b an enter_room task on an awareness world room completes with no unlock" do
      game = build_game(target: 'world_room', unlocked: ['reception'], current: nil,
                        start_room: 'reception', world_room: 'world_room')
      result = game.complete_task!('enter_target')
      assert result[:success], "the awareness world-room disjunct must pass: #{result.inspect}"
      assert_equal 'completed', task_status(game)
    end

    # 21. Retryable refusal self-heals, then a true forge stays refused.
    test "21 a retryable refusal heals once the room is durable, a forge stays refused" do
      game = build_game(target: 'office1', unlocked: ['reception'], current: 'reception')

      first = game.complete_task!('enter_target')
      refute first[:success]
      assert_equal true, first[:retryable]
      refute_equal 'completed', task_status(game)

      # Model the client's retry: the flushed sync made the room durable.
      game.player_state['unlockedRooms'] << 'office1'
      healed = game.complete_task!('enter_target')
      assert healed[:success], "the honest ordering gap must heal on re-post: #{healed.inspect}"
      assert_equal 'completed', task_status(game)

      # A second game whose target is never added stays refused on every re-post.
      forge = build_game(target: 'office1', unlocked: ['reception'], current: 'reception')
      refute forge.complete_task!('enter_target')[:success]
      refute forge.complete_task!('enter_target')[:success]
      refute_equal 'completed', task_status(forge)
    end

    # The predicate directly, to pin each disjunct (defensive currentRoom term included).
    test "player_reached_room? covers each durable disjunct and the soft currentRoom term" do
      game = build_game(target: 'x', unlocked: ['reception'], current: 'reception')
      assert game.player_reached_room?('reception'), 'startRoom / unlockedRooms'
      game.player_state['unlockedRooms'] = %w[reception office1]
      assert game.player_reached_room?('office1'), 'unlockedRooms'
      game.player_state['npcRouteRooms'] = ['secure_area']
      assert game.player_reached_room?('secure_area'), 'npcRouteRooms'
      game.player_state['currentRoom'] = 'lobby'
      assert game.player_reached_room?('lobby'), 'soft currentRoom disjunct'
      refute game.player_reached_room?('vault'), 'a room in no list is refused'
      refute game.player_reached_room?(nil), 'a blank room id is refused'
    end
  end
end
