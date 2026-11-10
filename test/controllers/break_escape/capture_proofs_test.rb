require 'test_helper'
require_relative '../../support/capture_proof_scenario'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Capture proofs (docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md, section 6). Every
  # proof is earned through the real requests, never by writing player_state: an inventory remove
  # with used_on, a player_drop, a sign-in or an owner claim, a network plant.
  class CaptureProofsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    CP = CaptureProofScenario

    def build_game(scenario = CP.scenario, player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'] }.merge(player_state)
      )
    end

    def forge(*ids)
      captures = ids.each_with_index.to_h do |id, i|
        [id, { 'targetId' => id, 'kind' => 'credential', 'address' => CP::USERNAMES[id], 'at' => i + 1 }]
      end
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => captures } }, as: :json
      assert_response :success, response.body
    end

    def secrets
      get game_path('capture_secrets'), as: :json
      assert_response :success
      response.parsed_body['secrets']
    end

    def take(id, type, name)
      post game_path('inventory'), params: { action_type: 'add', item: { type: type, id: id, name: name } }, as: :json
      response.parsed_body
    end

    def remove(id, used_on = nil)
      params = { action_type: 'remove', item: { id: id } }
      params[:used_on] = used_on if used_on
      post game_path('inventory'), params: params, as: :json
      assert_response :success, response.body
    end

    def drop(id, name)
      post game_path('update_room'), params: {
        roomId: 'office', actionType: 'add_object', sourceType: 'player_drop',
        data: { id: id, type: 'usb', name: name, x: 10, y: 10 }
      }, as: :json
    end

    def planted
      @game.reload.player_state['plantedItems']
    end

    test 'a forged se_captures entry on a fresh game earns no password in a scenario that declares proofs' do
      build_game
      forge(*CP::PASSWORDS.keys)
      served = secrets
      %w[chris mel sofia ned quinn].each { |id| refute served.key?(id), "#{id} was served with no proof" }
      CP::PASSWORDS.except('opal').each_value { |pw| refute_includes response.body, pw }
    end

    test 'an account whose password opens nothing is served as today in a strict scenario' do
      build_game
      forge('opal')
      assert_equal CP::PASSWORDS['opal'], secrets['opal']
    end

    test 'planted: a room pickup then a consumesItem remove with used_on, holding after the device is taken back' do
      build_game
      forge('chris')
      take('kit_logger', 'usb', 'Inline keylogger')
      assert_response :success, response.body
      remove('kit_logger', 'chris_desk')
      assert_equal [{ 'item' => 'kit_logger', 'on' => 'chris_desk' }], planted
      assert_equal CP::PASSWORDS['chris'], secrets['chris']
      refute @game.reload.player_state.dig('room_states', 'office', 'objects_removed')&.include?('chris_desk'),
             'no removed-objects write was made for the desk'

      take('kit_logger', 'usb', 'Inline keylogger')
      remove('kit_logger')
      assert_equal [{ 'item' => 'kit_logger', 'on' => 'chris_desk' }], planted, 'taking the device back does not undo it'
      assert_equal CP::PASSWORDS['chris'], secrets['chris']
    end

    test 'planted: a start-item device removed by a confirm remove_item, through the address shorthand' do
      build_game
      forge('ned')
      refute secrets.key?('ned')
      remove('kit_box', 'box_port')
      assert_equal [{ 'item' => 'kit_box', 'on' => 'box_port' }], planted
      assert_equal CP::PASSWORDS['ned'], secrets['ned']
    end

    test 'a remove with used_on that does not consume the item, matched only by name, or in a locked room records nothing' do
      build_game
      take('kit_logger', 'usb', 'Inline keylogger')
      assert_response :success, response.body
      %w[decoy_desk chris_desk_by_name vault_desk box_port no_such_object].each do |object_id|
        post game_path('inventory'), params: { action_type: 'remove', item: { id: 'kit_logger' }, used_on: object_id }, as: :json
        assert_equal [], planted, "a remove used on #{object_id} recorded a plant"
        take('kit_logger', 'usb', 'Inline keylogger')
      end
      # Not held: nothing is recorded even at the right object.
      remove('kit_logger')
      remove('kit_logger', 'chris_desk')
      assert_equal [], planted
    end

    test 'dropped: an accepted player_drop holds, a refused drop records nothing' do
      build_game
      forge('sofia')
      drop('kit_logger', 'Inline keylogger')
      assert_equal [], @game.reload.player_state['droppedItems'], 'a refused drop (not held) is not recorded'
      refute secrets.key?('sofia')

      drop('kit_qr', 'QR card')
      assert_response :success, response.body
      assert_equal ['kit_qr'], @game.reload.player_state['droppedItems']
      assert_equal CP::PASSWORDS['sofia'], secrets['sofia']
    end

    test 'session: an owner claim alone holds the shorthand session proof' do
      build_game
      forge('mel')
      refute secrets.key?('mel')
      post game_path('login'), params: { pc_id: 'mel_pc', claim: 'owner' }, as: :json
      assert_response :success, response.body
      assert_equal CP::PASSWORDS['mel'], secrets['mel']
    end

    test 'session: a password sign-in holds the proof' do
      build_game
      forge('mel')
      body = sign_in('mel_pc', CP::USERNAMES['mel'], CP::PASSWORDS['mel'])
      assert_equal true, body['success'], body.inspect
      assert_equal CP::PASSWORDS['mel'], secrets['mel']
    end

    test 'an account with a capture route, a password that opens a PC and no proof is never served' do
      build_game
      forge('quinn')
      body = sign_in('quinn_pc', CP::USERNAMES['quinn'], CP::PASSWORDS['quinn'])
      assert_equal true, body['success'], body.inspect
      refute secrets.key?('quinn')
    end

    test 'a scenario with no proof anywhere is served as today' do
      build_game(CP.scenario_without_proofs)
      forge(*CP::PASSWORDS.keys)
      served = secrets
      CP::PASSWORDS.each { |id, pw| assert_equal pw, served[id], id }
    end

    test 'an existing game row whose frozen scenario has no proof is served as before' do
      build_game(CP.scenario_without_proofs)
      forge('chris')
      # The scenario file gaining a proof later does not change the frozen copy.
      assert_equal CP::PASSWORDS['chris'], secrets['chris']
      refute CaptureModel.declares_proofs?(@game.reload.scenario_data)
    end

    test 'a landing page capture is served as today, and the single-secret fallback refuses an undeclared target id' do
      scenario = CP.scenario
      scenario['social']['landingPages'] = [{ 'id' => 'portal', 'capture' => { 'address' => 'p@x.example', 'secret' => 'Land-Secret-1' } }]
      scenario['social']['phishTargets'] = [{ 'id' => 'phished' }]
      build_game(scenario)
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => {
        'phished' => { 'targetId' => 'phished', 'kind' => 'credential', 'address' => 'other@x.example', 'at' => 1 },
        'invented' => { 'targetId' => 'invented', 'kind' => 'credential', 'address' => 'p@x.example', 'at' => 2 }
      } } }, as: :json
      assert_equal({ 'phished' => 'Land-Secret-1' }, secrets)
    end

    test 'a stored grant contents are in neither the bootstrap nor the inventory answer' do
      scenario = CP.scenario
      scenario['timers'] = [{ 'id' => 'grant', 'afterMs' => 1000, 'actions' => [{ 'type' => 'give_item', 'item' => {
        'id' => 'session_item', 'type' => 'pc', 'name' => 'Remote session', 'storeIn' => 'capture_log',
        'contents' => [{ 'type' => 'text_file', 'name' => 'secret.txt', 'text' => 'GRANT-CONTENTS-MARKER-77' }]
      } }] }]
      build_game(scenario)
      get game_path('scenario'), as: :json
      refute_includes response.body, 'GRANT-CONTENTS-MARKER-77'
      take('session_item', 'pc', 'Remote session')
      assert_response :success, response.body
      refute_includes response.body, 'GRANT-CONTENTS-MARKER-77'
    end

    test 'an older game row with no holder and no proof keys loads' do
      build_game(CP.scenario_without_proofs)
      state = @game.player_state.except('plantedItems', 'droppedItems')
      @game.update_columns(player_state: state)
      get game_path('scenario'), as: :json
      assert_response :success
      remove('kit_box', 'box_port')
      assert_equal [{ 'item' => 'kit_box', 'on' => 'box_port' }], planted
    end

    # ---- networks: accounts and the jack proof ------------------------------------

    def network_scenario_with_proof(proof)
      scenario = NetworkModelScenario.scenario
      lena = scenario['rooms']['lobby']['npcs'].find { |n| n['id'] == 'lena' }
      lena['usePayload']['targetId'] = 'lena'
      lena['captureProof'] = [proof]
      scenario
    end

    def network_forge
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => {
        'lena' => { 'targetId' => 'lena', 'kind' => 'credential', 'address' => 'lfox', 'at' => 1 }
      } } }, as: :json
      assert_response :success
    end

    test 'in a network scenario that declares proofs, an account is absent from secrets and accounts until its proof holds' do
      build_network_game({}, network_scenario_with_proof({ 'planted' => 'kit_dropbox', 'on' => 'comms_port' }))
      network_forge
      get game_path('capture_secrets'), as: :json
      assert_equal({}, response.parsed_body['secrets'])
      assert_equal({}, response.parsed_body['accounts'])

      # A planted proof on a jack holds through gainedFootholds (9.3's own plant route).
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
      get game_path('capture_secrets'), as: :json
      assert_equal({ 'lena' => NetworkModelScenario::LENA_PASSWORD }, response.parsed_body['secrets'])
      assert_equal({ 'lena' => 'lfox' }, response.parsed_body['accounts'])
    end
  end
end
