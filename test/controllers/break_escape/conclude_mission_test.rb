require 'test_helper'

# Mission conclusion: the client decides the story has ended, the server decides
# whether the technical work the scenario declared was actually done.
#
# These tests exist because every bug in this endpoint so far survived the
# model-level checks and was only caught by driving a real browser. The endpoint
# returned HTTP 500 on every call (missing from before_action :set_game, then a
# missing GamePolicy#conclude_mission?), while Game#conclude_mission! — tested
# directly — worked perfectly. So these go over HTTP, through the router, the
# filters and Pundit, which is the part that was broken.
module BreakEscape
  class ConcludeMissionTest < ActionDispatch::IntegrationTest
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
      @owner   = break_escape_demo_users(:test_user) # == current_player in standalone
      @other   = break_escape_demo_users(:other_user)

      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_spy'
        pref.in_game_name    = 'TestAgent'
      end
    end

    # =========================================================================
    # The endpoint answers at all
    # =========================================================================

    test 'conclude returns JSON, not a 500' do
      game = create_game(gated_scenario)

      post conclude_game_url(game)

      assert_response :success
      assert_equal 'application/json', response.media_type,
                   'A 500 error page here is the original bug: the action was missing from ' \
                   'before_action :set_game, so @game was nil when authorize ran.'
    end

    # =========================================================================
    # The gate
    # =========================================================================

    test 'refuses when declared technical work is outstanding, and names it' do
      game = create_game(gated_scenario)

      post conclude_game_url(game)
      body = JSON.parse(response.body)

      assert_equal false, body['success']
      assert_equal 'in_progress', body['status']
      assert_nil body['missionConcludedAt']
      assert_equal %w[task:submit_ssh_flag task:submit_sudo_flag].sort, body['missing'].sort,
                   'The player must be told what is outstanding, not merely refused.'

      game.reload
      assert_equal 'in_progress', game.status
      assert_nil game.mission_concluded_at
    end

    test 'refuses while only part of the work is done' do
      game = create_game(gated_scenario, tasks: { 'submit_ssh_flag' => 'completed' })

      post conclude_game_url(game)
      body = JSON.parse(response.body)

      assert_equal false, body['success']
      assert_equal ['task:submit_sudo_flag'], body['missing']
    end

    test 'concludes once the declared work is done' do
      game = create_game(gated_scenario, tasks: {
        'submit_ssh_flag'  => 'completed',
        'submit_sudo_flag' => 'completed'
      })

      post conclude_game_url(game)
      body = JSON.parse(response.body)

      assert_equal true, body['success']
      assert_empty body['missing']
      assert_equal 'completed', body['status']
      assert body['missionConcludedAt'].present?

      game.reload
      assert_equal 'completed', game.status
      assert game.mission_concluded_at.present?
      assert game.completed_at.present?
    end

    test 'a scenario declaring no gate trusts the client' do
      game = create_game(ungated_scenario)

      post conclude_game_url(game)
      body = JSON.parse(response.body)

      assert_equal true, body['success'],
                   'With no concludeRequires, reaching the end of the story is the whole condition.'
      game.reload
      assert_equal 'completed', game.status
    end

    test 'globals can gate as well as tasks' do
      game = create_game(global_gated_scenario)

      post conclude_game_url(game)
      assert_equal ['global:backdoor_fully_exploited'], JSON.parse(response.body)['missing']

      game.player_state['globalVariables']['backdoor_fully_exploited'] = true
      game.save!

      post conclude_game_url(game)
      assert_equal true, JSON.parse(response.body)['success']
    end

    # =========================================================================
    # Story tasks must NOT gate
    # =========================================================================

    test 'requiresCompleted does not withhold the ending' do
      # The m02 soft-lock: every aim complete, credits shown, and the game stuck
      # in in_progress forever because one story task had a single completion
      # route. Story tasks cost score, never the ending.
      game = create_game(gated_scenario(requires_completed: %w[talk_to_someone read_a_note]),
                         tasks: { 'submit_ssh_flag' => 'completed', 'submit_sudo_flag' => 'completed' })

      post conclude_game_url(game)

      assert_equal true, JSON.parse(response.body)['success'],
                   'Unfinished story tasks must not block conclusion.'
    end

    # =========================================================================
    # Idempotency and authorisation
    # =========================================================================

    test 'concluding twice is safe and reports alreadyConcluded' do
      game = create_game(ungated_scenario)

      post conclude_game_url(game)
      first = JSON.parse(response.body)['missionConcludedAt']

      post conclude_game_url(game)
      body = JSON.parse(response.body)

      assert_equal true, body['alreadyConcluded']
      assert_equal first, body['missionConcludedAt'], 'The timestamp must not move on a repeat call.'
    end

    test "cannot conclude another player's game" do
      game = Game.create!(mission: @mission, player: @other,
                          scenario_data: ungated_scenario, player_state: PLAYER_STATE.deep_dup)

      post conclude_game_url(game)

      assert_response :redirect, 'Pundit must deny this the way it denies every other game action.'
      game.reload
      assert_equal 'in_progress', game.status
    end

    private

    def create_game(scenario, tasks: {})
      state = PLAYER_STATE.deep_dup
      tasks.each { |id, status| state['objectivesState']['tasks'][id] = { 'status' => status } }
      Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end

    def base_scenario(conclusion_aim)
      {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'locked' => false, 'connections' => {}, 'objects' => [], 'npcs' => [] } },
        'globalVariables' => { 'backdoor_fully_exploited' => false },
        'objectives' => [conclusion_aim]
      }
    end

    def gated_scenario(requires_completed: nil)
      aim = {
        'aimId' => 'finish', 'title' => 'Finish', 'status' => 'active',
        'missionConclusion' => true,
        'concludeRequires' => { 'tasksCompleted' => %w[submit_ssh_flag submit_sudo_flag] },
        'tasks' => [
          { 'taskId' => 'submit_ssh_flag',  'title' => 'SSH flag',  'type' => 'submit_flags', 'status' => 'active' },
          { 'taskId' => 'submit_sudo_flag', 'title' => 'sudo flag', 'type' => 'submit_flags', 'status' => 'active' }
        ]
      }
      aim['requiresCompleted'] = requires_completed if requires_completed
      base_scenario(aim)
    end

    def ungated_scenario
      base_scenario({
        'aimId' => 'finish', 'title' => 'Finish', 'status' => 'active',
        'missionConclusion' => true,
        'tasks' => [{ 'taskId' => 'talk_to_someone', 'title' => 'Talk', 'type' => 'manual', 'status' => 'active' }]
      })
    end

    def global_gated_scenario
      base_scenario({
        'aimId' => 'finish', 'title' => 'Finish', 'status' => 'active',
        'missionConclusion' => true,
        'concludeRequires' => { 'globals' => ['backdoor_fully_exploited'] },
        'tasks' => [{ 'taskId' => 'talk_to_someone', 'title' => 'Talk', 'type' => 'manual', 'status' => 'active' }]
      })
    end
  end
end
