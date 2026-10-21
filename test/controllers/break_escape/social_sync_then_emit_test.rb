require 'test_helper'

# Sync, then emit (05 "Bridging", N6; 00 section 11; packet P3-C), the server half.
# The triage starter writes triage_percent, _reportRate, _pass and _done, waits for
# a sync_state the server confirmed, and only then emits the event whose mapping
# POSTs the task. These tests drive that order over HTTP: the globals land, then
# complete_task finds the aim's concludeRequires met. They also show what the
# order protects against (a POST before the sync leaves the gate unmet), that a
# refused (403) sync saves nothing, and that replays are idempotent, which the
# reopen re-emit relies on.
module BreakEscape
  class SocialSyncThenEmitTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    TRIAGE_GLOBALS = {
      'triage_percent' => 72, 'triage_reportRate' => 0.5, 'triage_pass' => true, 'triage_done' => true
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user) # == current_player in standalone

      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end

      @game = Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: player_state)
    end

    def scenario
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => { 'type' => 'room_office', 'locked' => false, 'connections' => { 'north' => 'soc' },
                       'objects' => [], 'npcs' => [] },
          'soc' => { 'type' => 'room_office', 'locked' => true, 'connections' => { 'south' => 'lobby' },
                     'objects' => [], 'npcs' => [] }
        },
        'globalVariables' => {
          'triage_percent' => 0, 'triage_reportRate' => 0, 'triage_pass' => false, 'triage_done' => false
        },
        'objectives' => [{
          'aimId' => 'defend', 'title' => 'Defend the inbox', 'status' => 'active',
          'missionConclusion' => true,
          'concludeRequires' => { 'globals' => ['triage_pass'] },
          'tasks' => [{ 'taskId' => 'triage_passed', 'title' => 'Pass the triage round',
                        'type' => 'manual', 'status' => 'active' }]
        }]
      }
    end

    def player_state
      {
        'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [],
        'inventory' => [], 'encounteredNPCs' => [], 'notes' => [], 'health' => 100,
        'globalVariables' => {
          'triage_percent' => 0, 'triage_reportRate' => 0, 'triage_pass' => false, 'triage_done' => false
        },
        'objectivesState' => { 'tasks' => {}, 'aims' => {} }
      }
    end

    def sync(params, expect: :success)
      put sync_state_game_url(@game), params: params, as: :json
      assert_response expect
      response.parsed_body
    end

    def complete(task_id)
      post complete_task_game_url(@game, task_id: task_id), as: :json
      assert_response :success
      response.parsed_body
    end

    test 'the triage globals land before complete_task, so the concludeRequires gate is met' do
      body = sync({ globalVariables: TRIAGE_GLOBALS, clientTs: 1000 })
      assert_equal true, body['success']
      refute body['stale']
      globals = @game.reload.player_state['globalVariables']
      assert_equal true, globals['triage_pass']
      assert_equal true, globals['triage_done']
      assert_equal 72, globals['triage_percent']

      result = complete('triage_passed')
      assert_equal true, result['success']
      assert_equal true, result['missionConcluded'], 'the gate saw triage_pass at the instant of the POST'
      assert_nil result['warning']

      @game.reload
      assert_equal 'completed', @game.player_state.dig('objectivesState', 'tasks', 'triage_passed', 'status')
      assert @game.mission_concluded_at.present?
      assert_equal 'completed', @game.status
    end

    test 'a task POST before the sync finds the gate unmet (what the order prevents)' do
      result = complete('triage_passed')
      assert_equal true, result['success']
      assert_equal false, result['missionConcluded']
      assert_match(/required objectives/i, result['warning'].to_s)
      assert_nil @game.reload.mission_concluded_at
    end

    test 'the same sync replayed is idempotent, and so is the task POST' do
      sync({ globalVariables: TRIAGE_GLOBALS, clientTs: 1000 })
      first = complete('triage_passed')
      assert_equal true, first['missionConcluded']
      @game.reload
      concluded_at = @game.mission_concluded_at
      tasks_completed = @game.tasks_completed
      score = @game.score

      # The same request again (a retry the first answer did not reach): stale, nothing changes
      body = sync({ globalVariables: TRIAGE_GLOBALS, clientTs: 1000 })
      assert_equal true, body['stale']
      # A re-issued retry with a fresh clientTs: same values, nothing changes
      sync({ globalVariables: TRIAGE_GLOBALS, clientTs: 1001 })
      # The reopen re-emit's POST
      again = complete('triage_passed')
      assert_equal 'Already completed', again['message']

      @game.reload
      assert_equal TRIAGE_GLOBALS, @game.player_state['globalVariables'].slice(*TRIAGE_GLOBALS.keys)
      assert_equal tasks_completed, @game.tasks_completed, 'the task counted once'
      assert_equal score, @game.score
      assert_equal concluded_at.to_i, @game.mission_concluded_at.to_i, 'the conclusion time did not move'
    end

    test 'reopen: done already on the server from a flush, task incomplete, completes once' do
      # The pagehide flush carried the globals; the tab closed before the emit
      sync({ globalVariables: TRIAGE_GLOBALS, clientTs: 5000 })
      assert_nil @game.reload.player_state.dig('objectivesState', 'tasks', 'triage_passed')

      # The reopen confirms a sync (nothing new to send) and re-emits: one POST
      sync({ globalVariables: TRIAGE_GLOBALS, clientTs: 6000 })
      result = complete('triage_passed')
      assert_equal true, result['missionConcluded']
      assert_equal 1, @game.reload.tasks_completed
    end

    test 'a refused sync (403) saves no triage global' do
      body = sync({ globalVariables: TRIAGE_GLOBALS, currentRoom: 'soc', clientTs: 1000 }, expect: :forbidden)
      assert_equal false, body['success']
      globals = @game.reload.player_state['globalVariables']
      assert_equal false, globals['triage_pass'], 'the refusal rolled back the whole request'
      assert_equal false, globals['triage_done']
    end
  end
end
