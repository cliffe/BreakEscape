require 'test_helper'

# State that has to survive a page reload (approval log m03 item 6, D5):
# aims opened by unlockCondition, aims/tasks opened by ink tags or
# eventMappings, the RFID cloner's saved cards, and NPC-local ink variables.
# Driven over HTTP because the client only sees what the endpoints return.
module BreakEscape
  class ReloadPersistenceTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    PLAYER_STATE = {
      'currentRoom' => 'lobby',
      'unlockedRooms' => ['lobby'],
      'unlockedObjects' => [],
      'inventory' => [],
      'encounteredNPCs' => [],
      'globalVariables' => {},
      'notes' => [],
      'health' => 100,
      'objectivesState' => { 'tasks' => {}, 'aims' => {} }
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)

      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_spy'
        pref.in_game_name    = 'TestAgent'
      end
    end

    # =========================================================================
    # Aim statuses on load
    # =========================================================================

    test 'an aim opened by aimCompleted comes back active, not locked' do
      game = create_game(aims: { 'first' => 'completed' })

      aims = scenario_json(game).dig('objectivesState', 'aims')

      assert_equal 'active', aims.dig('second', 'status'),
                   'The client opens this aim when first completes but never tells the server'
      assert_equal 'completed', aims.dig('first', 'status')
    end

    test 'an aim waiting on its condition stays locked' do
      game = create_game(aims: {})

      aims = scenario_json(game).dig('objectivesState', 'aims')

      assert_nil aims['second'], 'Unmet unlockCondition must not reveal the aim'
      assert_nil aims['both']
    end

    test 'aimsCompleted needs every listed aim' do
      partial = create_game(aims: { 'first' => 'completed' })
      assert_nil scenario_json(partial).dig('objectivesState', 'aims', 'both')

      full = create_game(aims: { 'first' => 'completed', 'second' => 'completed' })
      assert_equal 'active', scenario_json(full).dig('objectivesState', 'aims', 'both', 'status')
    end

    test 'a locked aim with no unlockCondition comes back active once a task is done' do
      game = create_game(tasks: { 'hidden_task' => 'completed' })

      assert_equal 'active', scenario_json(game).dig('objectivesState', 'aims', 'hidden', 'status')
    end

    test 'a task done early reveals its aim although the aimCompleted condition is unmet' do
      game = create_game(tasks: { 'second_task' => 'completed' })

      aim = scenario_json(game).dig('objectivesState', 'aims', 'second')
      assert_equal 'active', aim['status'],
                   'Matches revealAimForTask: the player sees the aim they are making progress on'
      assert_equal true, aim['revealedEarly'], 'The client still runs unlockAim once first completes'
    end

    test 'an aim revealed by a task once its condition is met is not marked early' do
      game = create_game(aims: { 'first' => 'completed' }, tasks: { 'second_task' => 'completed' })

      aim = scenario_json(game).dig('objectivesState', 'aims', 'second')
      assert_equal 'active', aim['status']
      assert_nil aim['revealedEarly']
    end

    test 'aimsCompleted gives way to a task done early too' do
      game = create_game(aims: { 'first' => 'completed' }, tasks: { 'both_task' => 'completed' })

      assert_equal 'active', scenario_json(game).dig('objectivesState', 'aims', 'both', 'status')
    end

    test 'partial progress on a task reveals its aim' do
      game = create_game
      game.player_state['objectivesState']['tasks']['second_task'] = { 'progress' => 1 }
      game.save!

      assert_equal 'active', scenario_json(game).dig('objectivesState', 'aims', 'second', 'status')
    end

    test 'a task unlocked by ink reveals its aim; an authored-active task with no record does not' do
      unlocked = create_game(tasks: { 'locked_task' => 'active' })
      assert_equal 'active', scenario_json(unlocked).dig('objectivesState', 'aims', 'hidden', 'status')

      untouched = create_game(tasks: { 'second_task' => 'active' })
      assert_nil scenario_json(untouched).dig('objectivesState', 'aims', 'second'),
                 'An active status on a task authored active is not progress'
    end

    test 'a stored aim status is never overridden by the derivation' do
      game = create_game(aims: { 'second' => 'completed' }, tasks: { 'second_task' => 'completed' })

      assert_equal 'completed', scenario_json(game).dig('objectivesState', 'aims', 'second', 'status')
    end

    test 'a story gate (globalVariable) keeps the aim hidden through early progress until the global is set' do
      unset = create_game(tasks: { 'gated_task' => 'completed' })
      assert_nil scenario_json(unset).dig('objectivesState', 'aims', 'gated')

      set = create_game(tasks: { 'gated_task' => 'completed' }, globals: { 'gate_open' => true })
      assert_equal 'active', scenario_json(set).dig('objectivesState', 'aims', 'gated', 'status')
    end

    test 'a globalVariable condition alone does not reveal an aim with no completed task' do
      game = create_game(globals: { 'gate_open' => true })

      assert_nil scenario_json(game).dig('objectivesState', 'aims', 'gated'),
                 'The client only checks that condition when a task completes'
    end

    test 'derivation does not change the stored state' do
      game = create_game(aims: { 'first' => 'completed' })
      scenario_json(game)

      assert_nil game.reload.player_state.dig('objectivesState', 'aims', 'second')
    end

    test 'the objectives endpoint reports the same derived state' do
      game = create_game(aims: { 'first' => 'completed' })

      get objectives_game_url(game)

      assert_response :success
      assert_equal 'active', response.parsed_body.dig('state', 'aims', 'second', 'status')
    end

    # =========================================================================
    # Unlocks from ink tags and eventMappings
    # =========================================================================

    test 'an ink-unlocked aim is recorded and survives a reload' do
      game = create_game

      post unlock_objective_game_url(game), params: { kind: 'aim', objective_id: 'hidden' }, as: :json

      assert_response :success
      assert_equal 'active', game.reload.player_state.dig('objectivesState', 'aims', 'hidden', 'status')
      assert_equal 'active', scenario_json(game).dig('objectivesState', 'aims', 'hidden', 'status')
    end

    test 'an ink-unlocked task is recorded' do
      game = create_game

      post unlock_objective_game_url(game), params: { kind: 'task', objective_id: 'locked_task' }, as: :json

      assert_response :success
      assert_equal 'active', game.reload.player_state.dig('objectivesState', 'tasks', 'locked_task', 'status')
    end

    test 'unlocking never reopens a completed aim' do
      game = create_game(aims: { 'first' => 'completed' })

      post unlock_objective_game_url(game), params: { kind: 'aim', objective_id: 'first' }, as: :json

      assert_response :success
      assert_equal 'completed', game.reload.player_state.dig('objectivesState', 'aims', 'first', 'status')
    end

    test 'unlocking an unknown objective is refused' do
      game = create_game

      post unlock_objective_game_url(game), params: { kind: 'aim', objective_id: 'nope' }, as: :json
      assert_response :unprocessable_entity

      post unlock_objective_game_url(game), params: { kind: 'room', objective_id: 'first' }, as: :json
      assert_response :unprocessable_entity
    end

    # =========================================================================
    # Skipped tasks (sis01 tidy round F2): closed off by the story, shown as
    # skipped, never counted as completed, and not blocking their aim
    # =========================================================================

    test 'a skipped task is recorded, survives a reload and is not counted as completed' do
      game = create_game

      post skip_task_game_url(game, task_id: 'hidden_task'), as: :json

      assert_response :success
      assert_equal 'skipped', response.parsed_body['status']
      game.reload
      assert_equal 'skipped', game.player_state.dig('objectivesState', 'tasks', 'hidden_task', 'status')
      assert game.player_state.dig('objectivesState', 'tasks', 'hidden_task', 'skippedAt').present?
      assert_equal 0, game.tasks_completed.to_i
      assert_equal 'skipped', scenario_json(game).dig('objectivesState', 'tasks', 'hidden_task', 'status')
    end

    test 'a skipped task lets its aim complete, with the gap costing the task share of the score' do
      game = create_game

      post skip_task_game_url(game, task_id: 'first_task'), as: :json

      assert_response :success
      game.reload
      assert_equal 'completed', game.player_state.dig('objectivesState', 'aims', 'first', 'status')
      assert_equal 1, game.objectives_completed
      assert_equal 0, game.tasks_completed.to_i
      assert_in_delta (1.0 / game.total_aims) * 30, game.calculate_task_score, 0.001,
                      'aim share only: the skipped task earns nothing'
      assert_equal 'active', scenario_json(game).dig('objectivesState', 'aims', 'second', 'status'),
                   'the aim it opens comes back active'
    end

    test 'skipping leaves a completed task alone; repeating a skip changes nothing' do
      game = create_game(tasks: { 'first_task' => 'completed' })

      post skip_task_game_url(game, task_id: 'first_task'), as: :json
      assert_response :success
      assert_equal 'completed', game.reload.player_state.dig('objectivesState', 'tasks', 'first_task', 'status')

      post skip_task_game_url(game, task_id: 'hidden_task'), as: :json
      at = game.reload.player_state.dig('objectivesState', 'tasks', 'hidden_task', 'skippedAt')
      post skip_task_game_url(game, task_id: 'hidden_task'), as: :json
      assert_response :success
      assert_equal at, game.reload.player_state.dig('objectivesState', 'tasks', 'hidden_task', 'skippedAt')
      assert_equal 0, game.objectives_completed.to_i, 'hidden still has an open task'
    end

    test 'a skipped task can still be completed, and then counts' do
      game = create_game
      post skip_task_game_url(game, task_id: 'hidden_task'), as: :json

      post complete_task_game_url(game, task_id: 'hidden_task'), as: :json

      assert_response :success
      game.reload
      assert_equal 'completed', game.player_state.dig('objectivesState', 'tasks', 'hidden_task', 'status')
      assert_equal 1, game.tasks_completed
    end

    test 'skipping an unknown task is refused' do
      game = create_game

      post skip_task_game_url(game, task_id: 'nope'), as: :json

      assert_response :unprocessable_entity
    end

    test 'a skipped task never meets concludeRequires.tasksCompleted' do
      game = create_game
      aim = { 'concludeRequires' => { 'tasksCompleted' => ['hidden_task'] } }
      game.player_state['objectivesState']['tasks']['hidden_task'] = { 'status' => 'skipped' }

      assert_equal ['task:hidden_task'], game.unmet_conclude_requirements(aim)
    end

    # =========================================================================
    # show_scenario_brief "once" (sis01 tidy round F3)
    # =========================================================================

    test 'the Mission Brief shown flag is recorded by sync_state and returned on load' do
      game = create_game
      assert_nil scenario_json(game)['scenarioBriefShown'], 'not shown yet on a new game'

      put sync_state_game_url(game), params: { scenarioBriefShown: false }, as: :json
      assert_nil game.reload.player_state['scenarioBriefShown'], 'false never sets it'

      put sync_state_game_url(game), params: { scenarioBriefShown: true }, as: :json
      assert_response :success
      assert_equal true, game.reload.player_state['scenarioBriefShown']
      assert_equal true, scenario_json(game)['scenarioBriefShown']

      put sync_state_game_url(game), params: { scenarioBriefShown: false }, as: :json
      assert_equal true, game.reload.player_state['scenarioBriefShown'], 'never cleared by a sync'
    end

    # =========================================================================
    # RFID cloner saved cards
    # =========================================================================

    CARD = {
      'name' => 'Executive Keycard', 'card_id' => 'victoria_keycard',
      'rfid_protocol' => 'EM4100', 'rfid_hex' => '0A1B2C3D4E',
      'rfid_data' => { 'uid' => '0A1B2C3D4E' }, 'timestamp' => 1_700_000_000_000
    }.freeze

    test 'cloned cards are stored on the cloner and come back on load' do
      game = create_game(inventory: [{ 'type' => 'rfid_cloner', 'name' => 'RFID Cloner', 'id' => 'cloner' }])

      post inventory_game_url(game), params: { action_type: 'update_saved_cards', saved_cards: [CARD] }, as: :json

      assert_response :success
      cloner = scenario_json(game)['playerInventory'].find { |i| i['type'] == 'rfid_cloner' }
      assert_equal ['victoria_keycard'], cloner['saved_cards'].map { |c| c['card_id'] }
      assert_equal '0A1B2C3D4E', cloner['saved_cards'].first.dig('rfid_data', 'uid')
    end

    test 'saved cards replace the previous list' do
      game = create_game(inventory: [{ 'type' => 'rfid_cloner', 'name' => 'RFID Cloner',
                                       'saved_cards' => [CARD] }])
      second = CARD.merge('card_id' => 'guard_badge', 'name' => 'Guard Badge')

      post inventory_game_url(game), params: { action_type: 'update_saved_cards', saved_cards: [CARD, second] }, as: :json

      assert_response :success
      assert_equal %w[victoria_keycard guard_badge],
                   game.reload.player_state['inventory'].first['saved_cards'].map { |c| c['card_id'] }
    end

    test 'saving cards without a cloner is refused' do
      game = create_game

      post inventory_game_url(game), params: { action_type: 'update_saved_cards', saved_cards: [CARD] }, as: :json

      assert_response :unprocessable_entity
    end

    test 'more cards than the cloner holds is refused' do
      game = create_game(inventory: [{ 'type' => 'rfid_cloner', 'name' => 'RFID Cloner' }])
      cards = Array.new(Game::MAX_SAVED_CARDS + 1) { |i| CARD.merge('card_id' => "c#{i}") }

      post inventory_game_url(game), params: { action_type: 'update_saved_cards', saved_cards: cards }, as: :json

      assert_response :unprocessable_entity
      assert_nil game.reload.player_state['inventory'].first['saved_cards']
    end

    # =========================================================================
    # NPC-local ink variables
    # =========================================================================

    test 'NPC ink variables sync, merge per NPC and come back on load' do
      game = create_game

      put sync_state_game_url(game),
          params: { npcInkVariables: { 'victoria' => { 'recruitment_discussed' => true, 'trust' => 2 },
                                       'guard' => { 'player_warned' => false } } },
          as: :json
      assert_response :success

      put sync_state_game_url(game),
          params: { npcInkVariables: { 'victoria' => { 'recruitment_discussed' => true, 'trust' => 3 } } },
          as: :json
      assert_response :success

      saved = scenario_json(game)['savedNpcInkVariables']
      assert_equal({ 'recruitment_discussed' => true, 'trust' => 3 }, saved['victoria'])
      assert_equal({ 'player_warned' => false }, saved['guard'], 'An NPC not in this sync keeps its variables')
    end

    test 'only scalar ink variables are kept' do
      game = create_game

      put sync_state_game_url(game),
          params: { npcInkVariables: { 'victoria' => { 'met' => true, 'name' => 'V', 'list' => { 'a' => 1 } } } },
          as: :json

      assert_response :success
      assert_equal({ 'met' => true, 'name' => 'V' }, game.reload.player_state.dig('npcInkVariables', 'victoria'))
    end

    test 'an oversized ink-variable sync is dropped without losing what was saved' do
      game = create_game

      put sync_state_game_url(game), params: { npcInkVariables: { 'victoria' => { 'met' => true } } }, as: :json
      huge = { 'blob' => 'x' * (Game::MAX_NPC_INK_VARIABLES_BYTES + 1) }
      put sync_state_game_url(game), params: { npcInkVariables: { 'victoria' => huge } }, as: :json

      assert_response :success
      assert_equal({ 'met' => true }, game.reload.player_state.dig('npcInkVariables', 'victoria'))
    end

    test 'a sync without ink variables leaves them alone' do
      game = create_game
      put sync_state_game_url(game), params: { npcInkVariables: { 'victoria' => { 'met' => true } } }, as: :json

      put sync_state_game_url(game), params: { globalVariables: { 'briefing_played' => true } }, as: :json

      assert_response :success
      assert_equal({ 'met' => true }, game.reload.player_state.dig('npcInkVariables', 'victoria'))
      assert_equal true, game.player_state.dig('globalVariables', 'briefing_played')
    end

    # =========================================================================
    # Fired onceOnly / maxTriggers eventMapping handlers
    # =========================================================================

    test 'fired one-shot handlers sync, keep the larger count and come back on load' do
      game = create_game
      key = 'security_guard_patrol:room_entered:server_room:1'

      put sync_state_game_url(game), params: { triggeredEvents: { key => 1, 'hax:a:0' => 2 } }, as: :json
      assert_response :success
      put sync_state_game_url(game), params: { triggeredEvents: { 'hax:a:0' => 1, 'hax:b:3' => 1 } }, as: :json
      assert_response :success

      saved = scenario_json(game)['savedTriggeredEvents']
      assert_equal({ key => 1, 'hax:a:0' => 2, 'hax:b:3' => 1 }, saved,
                   'A stale lower count from another tab must not lower a saved one')
    end

    test 'bad trigger entries are dropped' do
      game = create_game

      put sync_state_game_url(game),
          params: { triggeredEvents: { 'ok:x:0' => 1, 'zero:x:0' => 0, 'text:x:0' => 'yes', ('k' * 400) => 1 } },
          as: :json

      assert_response :success
      assert_equal({ 'ok:x:0' => 1 }, game.reload.player_state['triggeredEvents'])
    end

    test 'too many trigger keys is refused without losing what was saved' do
      game = create_game
      put sync_state_game_url(game), params: { triggeredEvents: { 'ok:x:0' => 1 } }, as: :json

      flood = (0..Game::MAX_TRIGGERED_EVENTS).to_h { |i| ["n:e:#{i}", 1] }
      put sync_state_game_url(game), params: { triggeredEvents: flood }, as: :json

      assert_response :success
      assert_equal({ 'ok:x:0' => 1 }, game.reload.player_state['triggeredEvents'])
    end

    # =========================================================================
    # Phone threads (E9) and pending timed texts (E12)
    # =========================================================================

    test 'phone threads sync per contact and come back on load' do
      game = create_game
      hax = { 'history' => [{ 'type' => 'npc', 'text' => 'Intro', 'timestamp' => 1, 'read' => true, 'preloaded' => true },
                            { 'type' => 'npc', 'text' => 'Guidance', 'timestamp' => 2, 'read' => false, 'timed' => true }],
              'storyState' => '{"flow":"x"}', 'storyPath' => 'hax.json', 'currentKnot' => 'start',
              'deferredTags' => ['complete_task:x'], 'deferredGlobals' => { 'met_hax' => true } }

      put sync_state_game_url(game),
          params: { phoneState: { 'hax' => hax, 'recruiter' => { 'history' => [{ 'type' => 'npc', 'text' => 'Hi' }] } } },
          as: :json
      assert_response :success
      put sync_state_game_url(game),
          params: { phoneState: { 'recruiter' => { 'history' => [{ 'type' => 'npc', 'text' => 'Hi' },
                                                                   { 'type' => 'player', 'text' => 'No.' }] } } },
          as: :json
      assert_response :success

      saved = scenario_json(game)['savedPhoneState']
      assert_equal hax, saved['hax'], 'A contact not in this sync keeps its thread'
      assert_equal %w[Hi No.], saved['recruiter']['history'].map { |m| m['text'] }
    end

    test 'phone thread entries are cleaned and an oversized sync is refused' do
      game = create_game
      put sync_state_game_url(game),
          params: { phoneState: { 'hax' => { 'history' => [{ 'type' => 'npc', 'text' => 'Ok', 'evil' => 'x', 'read' => 'yes' },
                                                           { 'type' => 'npc' }, 'junk'],
                                             'storyState' => { 'not' => 'a string' } } } },
          as: :json
      assert_response :success
      assert_equal({ 'history' => [{ 'type' => 'npc', 'text' => 'Ok' }] },
                   game.reload.player_state.dig('phoneState', 'hax'))

      flood = (0..40).to_h { |i| ["npc#{i}", { 'history' => [{ 'type' => 'npc', 'text' => 'x' * 3999 }] * 5 }] }
      put sync_state_game_url(game), params: { phoneState: flood }, as: :json
      assert_response :success
      assert_equal ['hax'], game.reload.player_state['phoneState'].keys
    end

    test 'pending timed texts replace the saved set and come back on load' do
      game = create_game
      put sync_state_game_url(game),
          params: { timedMessages: { 'pending' => [{ 'id' => 'map:a', 'npcId' => 'hax', 'text' => 'One', 'remainingMs' => 4000,
                                                     'skipIfGlobal' => 'done' }],
                                     'delivered' => ['npc:hax:0'] } },
          as: :json
      assert_response :success
      put sync_state_game_url(game),
          params: { timedMessages: { 'pending' => [{ 'npcId' => 'hax', 'text' => 'Two', 'remainingMs' => -5 },
                                                   { 'npcId' => 'hax' }],
                                     'delivered' => ['npc:hax:0', 'npc:hax:1'] } },
          as: :json
      assert_response :success

      saved = scenario_json(game)['savedTimedMessages']
      assert_equal [{ 'npcId' => 'hax', 'text' => 'Two', 'remainingMs' => 0 }], saved['pending'],
                   'The client sends its whole set; a delivered text drops out'
      assert_equal ['npc:hax:0', 'npc:hax:1'], saved['delivered']
    end

    # =========================================================================
    # Game clock and scenario timers (D14), NPC visibility (N2)
    # =========================================================================

    test 'the game clock and timer state sync, only move forward, and come back on load' do
      game = create_game

      put sync_state_game_url(game), params: { scenarioClock: {
        elapsedMs: 1_404_000,
        timers: { elapsedMs: 1_404_000, fired: ['bed4_1'], cancelled: [], started: { 'bed2' => 60_000 } }
      } }, as: :json
      assert_response :success

      # A delayed older sync (from before the timer fired) can't wind anything back
      put sync_state_game_url(game), params: { scenarioClock: {
        elapsedMs: 1_000_000,
        timers: { fired: [], cancelled: ['ico'], started: { 'bed2' => 10_000 } }
      } }, as: :json
      assert_response :success

      clock = scenario_json(game)['savedScenarioClock']
      assert_equal 1_404_000, clock['elapsedMs']
      assert_equal 1_404_000, clock['timers']['elapsedMs']
      assert_nil clock['changeLog']
      assert_equal %w[bed4_1], clock['timers']['fired']
      assert_equal %w[ico], clock['timers']['cancelled']
      assert_equal({ 'bed2' => 60_000 }, clock['timers']['started'])
    end

    test 'a timer that has fired drops its running time; bad clock entries are dropped' do
      game = create_game
      put sync_state_game_url(game), params: { scenarioClock: {
        elapsedMs: 5000, timers: { fired: [], started: { 'bed2' => 4000 } }
      } }, as: :json
      put sync_state_game_url(game), params: { scenarioClock: {
        elapsedMs: 'lots',
        changeLog: [{ k: 'ignored', v: 1, t: 5 }],
        timers: { fired: ['bed2', 42], started: { 'x' => -5 } }
      } }, as: :json
      assert_response :success

      clock = game.reload.player_state['scenarioClock']
      assert_equal 5000, clock['elapsedMs']
      assert_nil clock['changeLog'], 'there is no general change log any more'
      assert_equal %w[bed2], clock['timers']['fired']
      assert_equal({}, clock['timers']['started'])
    end

    test 'command board log: earliest stamp wins, settled entries kept, sent only with a board' do
      game = create_game
      put sync_state_game_url(game), params: { commandBoardLog: [{ id: 'ncsc_notified', t: 42_000 }, { id: 'pump_dose_error_caught', t: -1 }] }, as: :json
      put sync_state_game_url(game), params: { commandBoardLog: [{ id: 'ncsc_notified', t: 99_000 }, { id: 'bad', t: 'x' }, { id: 'siem', t: 50_000 }] }, as: :json
      assert_response :success

      assert_equal [{ 'id' => 'pump_dose_error_caught', 't' => -1 }, { 'id' => 'ncsc_notified', 't' => 42_000 }, { 'id' => 'siem', 't' => 50_000 }],
                   game.reload.player_state['commandBoardLog']
      json = scenario_json(game)
      assert_nil json['commandBoard'], 'no board in this scenario'
      assert_nil json['savedCommandBoardLog']

      game.scenario_data['rooms']['lobby']['objects'] = [{ 'type' => 'command_board', 'id' => 'command_board' }]
      game.save!
      json = scenario_json(game)
      assert_equal({}, json['commandBoard'])
      assert_equal 3, json['savedCommandBoardLog'].length
    end

    test 'NPC visibility syncs, the latest value wins, and it comes back on load' do
      game = create_game
      put sync_state_game_url(game), params: { npcVisibility: { 'hamza' => true, 'priya' => false } }, as: :json
      put sync_state_game_url(game), params: { npcVisibility: { 'priya' => true, 'bad' => 'yes' } }, as: :json
      assert_response :success

      assert_equal({ 'hamza' => true, 'priya' => true }, scenario_json(game)['savedNpcVisibility'])
    end

    test 'update_npc_state accepts isVisible (it used to be dropped and the update refused)' do
      game = create_game
      game.scenario_data['rooms']['lobby']['npcs'] = [{ 'id' => 'hamza', 'npcType' => 'person' }]
      game.save!

      post update_room_game_url(game), params: {
        roomId: 'lobby', actionType: 'update_npc_state',
        data: { npcId: 'hamza', stateChanges: { isVisible: true } }
      }, as: :json

      assert_response :success
      assert_equal true, game.reload.player_state.dig('room_states', 'lobby', 'npc_states', 'hamza', 'isVisible')
    end

    private

    def scenario_json(game)
      get scenario_game_url(game)
      assert_response :success
      response.parsed_body
    end

    def create_game(aims: {}, tasks: {}, inventory: [], globals: {})
      state = PLAYER_STATE.deep_dup
      state['globalVariables'] = globals.dup
      aims.each  { |id, status| state['objectivesState']['aims'][id]  = { 'status' => status } }
      tasks.each { |id, status| state['objectivesState']['tasks'][id] = { 'status' => status } }
      state['inventory'] = inventory.map(&:deep_dup)
      Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end

    def scenario
      task = ->(id, extra = {}) { { 'taskId' => id, 'title' => id, 'type' => 'custom', 'status' => 'active' }.merge(extra) }
      {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'locked' => false, 'connections' => {},
                                  'objects' => [], 'npcs' => [] } },
        'globalVariables' => {},
        'objectives' => [
          { 'aimId' => 'first', 'title' => 'First', 'status' => 'active', 'order' => 0,
            'tasks' => [task.call('first_task')] },
          { 'aimId' => 'second', 'title' => 'Second', 'status' => 'locked', 'order' => 1,
            'unlockCondition' => { 'aimCompleted' => 'first' },
            'tasks' => [task.call('second_task')] },
          { 'aimId' => 'both', 'title' => 'Both', 'status' => 'locked', 'order' => 2,
            'unlockCondition' => { 'aimsCompleted' => %w[first second] },
            'tasks' => [task.call('both_task')] },
          { 'aimId' => 'hidden', 'title' => 'Hidden', 'status' => 'locked', 'order' => 3,
            'tasks' => [task.call('hidden_task'), task.call('locked_task', 'status' => 'locked')] },
          { 'aimId' => 'gated', 'title' => 'Gated', 'status' => 'locked', 'order' => 4,
            'unlockCondition' => { 'globalVariable' => 'gate_open' },
            'tasks' => [task.call('gated_task'), task.call('gated_task_2')] }
        ]
      }
    end
  end
end
