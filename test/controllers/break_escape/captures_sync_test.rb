require 'test_helper'
require_relative '../../support/capture_proof_scenario'

module BreakEscape
  # The server-owned capture record over the real routes (sync deltas R2, 6a): the current
  # client's se_captures global is intercepted out of PUT /sync_state and recorded through the
  # scenario's own fields, the record survives a reload, and an old save's legacy global migrates
  # on the bootstrap. Serving (GET /capture_secrets) stays main's authored path.
  class CapturesSyncTest < ActionDispatch::IntegrationTest
    def game_path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    CP = CaptureProofScenario

    def build_game(scenario = CP.scenario, player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'] }.merge(player_state)
      )
    end

    def sync(params)
      put game_path('sync_state'), params: params, as: :json
    end

    def stored_captures
      @game.reload.player_state['seCaptures'] || {}
    end

    test 'the old-tab se_captures global is recorded and never stored as a global' do
      build_game
      sync(globalVariables: { 'se_captures' => {
        'mel' => { 'targetId' => 'mel', 'kind' => 'credential', 'address' => 'lie', 'at' => 1 }
      } })
      assert_response :success
      assert_equal 'm.pierce', stored_captures['mel']['address'], 'the scenario address is stored'
      assert_nil @game.reload.player_state.dig('globalVariables', 'se_captures'), 'no global is stored'
      assert_equal 'm.pierce', JSON.parse(response.body).dig('captures', 'mel', 'address')
      refute JSON.parse(response.body).dig('captures', 'mel').key?('proven')
    end

    test 'the capture survives a reload: the bootstrap ships it under captures, not as a global' do
      build_game
      sync(globalVariables: { 'se_captures' => { 'mel' => { 'targetId' => 'mel', 'kind' => 'credential', 'at' => 1 } } })
      assert_response :success

      get game_path('scenario'), as: :json
      boot = JSON.parse(response.body)
      assert_equal 'm.pierce', boot.dig('captures', 'mel', 'address')
      assert_nil boot.dig('savedGlobalVariables', 'se_captures'),
                 'se_captures no longer rides savedGlobalVariables; the client mirrors it from captures'
    end

    test 'an undeclared target is refused, a declared one recorded, both answered' do
      build_game
      sync(captures: [
        { 'targetId' => 'mel', 'kind' => 'credential' },
        { 'targetId' => 'nobody', 'kind' => 'credential' }
      ])
      assert_response :success
      body = JSON.parse(response.body)
      assert body.dig('captures', 'mel')
      assert_equal 'undeclared', body.dig('capturesRefused', 'nobody')
    end

    test 'a stale request still records a capture and answers captures' do
      build_game
      sync(clientTs: 1000, captures: [{ 'targetId' => 'mel', 'kind' => 'credential' }])
      assert_response :success
      @game.reload.player_state['seCaptures'] = {}
      @game.save!

      sync(clientTs: 500, captures: [{ 'targetId' => 'sofia', 'kind' => 'credential' }])
      assert_response :success
      body = JSON.parse(response.body)
      assert_equal true, body['stale']
      assert body.dig('captures', 'sofia'), 'the stale answer carries captures'
      assert stored_captures['sofia'].is_a?(Hash), 'the stale request recorded it'
    end

    test 'more than 64 entries are refused beyond the cap' do
      build_game
      caps = (0..70).map { |i| { 'targetId' => "t#{i}", 'kind' => 'credential' } }
      sync(captures: caps)
      assert_response :success
      refused = JSON.parse(response.body)['capturesRefused'] || {}
      assert refused.key?('t70'), 'an entry past the per-sync cap is refused'
    end

    test 'a duplicate target id past the cap is not refused when it was already answered (N2)' do
      build_game
      # 'mel' is declared and answered within the first 64; 63 undeclared fillers; then 'mel' again
      # as the 65th entry, which is dropped past the cap. First-wins already recorded it, so the
      # refused map must not also carry 'mel'.
      caps = [{ 'targetId' => 'mel', 'kind' => 'credential' }]
      caps += (1..63).map { |i| { 'targetId' => "t#{i}", 'kind' => 'credential' } }
      caps << { 'targetId' => 'mel', 'kind' => 'credential' }
      sync(captures: caps)
      assert_response :success
      body = JSON.parse(response.body)
      assert body.dig('captures', 'mel').is_a?(Hash), 'mel is answered'
      refute (body['capturesRefused'] || {}).key?('mel'), 'the already-answered id is not also refused'
    end
  end

  # Against the real lab_physical_pentest scenario: Len's PIN through the writer's authored path,
  # the store_controller note shipped whole, and an old save's global migrated on the bootstrap.
  class CapturesSyncLabTest < ActionDispatch::IntegrationTest
    def game_path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    setup do
      mission = Mission.create!(name: 'lab_physical_pentest', display_name: 'Physical pentest', published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
    end

    test "Len's PIN is served by GET /capture_secrets only after the capture is recorded" do
      get game_path('capture_secrets'), as: :json
      assert_nil JSON.parse(response.body)['secrets']['len'], 'nothing before the beat'

      put game_path('sync_state'), params: { captures: [{ 'targetId' => 'len', 'kind' => 'credential' }] }, as: :json
      assert_response :success

      get game_path('capture_secrets'), as: :json
      assert_equal '4471', JSON.parse(response.body)['secrets']['len']
    end

    test 'the store_controller note ships whole in the sync answer and the bootstrap' do
      note = CaptureModel.capture_candidates(@game.scenario_data, 'store_controller', 'foothold').first[:fields]['note']
      assert note.length > 100

      put game_path('sync_state'), params: { captures: [{ 'targetId' => 'store_controller', 'kind' => 'foothold' }] }, as: :json
      assert_equal note, JSON.parse(response.body).dig('captures', 'store_controller', 'note')

      get game_path('scenario'), as: :json
      assert_equal note, JSON.parse(response.body).dig('captures', 'store_controller', 'note')
    end

    test "an old save's legacy global migrates on the bootstrap and serves Len's PIN" do
      @game.player_state['globalVariables'] = { 'se_captures' => {
        'len' => { 'targetId' => 'len', 'kind' => 'credential', 'secret' => '4471', 'at' => 3 }
      } }
      @game.save!

      get game_path('scenario'), as: :json
      assert_response :success
      @game.reload
      assert @game.player_state['seCaptures']['len'].is_a?(Hash)
      assert_nil @game.player_state.dig('globalVariables', 'se_captures'), 'the global is deleted'

      get game_path('capture_secrets'), as: :json
      assert_equal '4471', JSON.parse(response.body)['secrets']['len']
    end
  end
end
