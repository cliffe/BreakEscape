require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # The no-exposure test (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md, section 6),
  # beside the first slice's no-password test. With no foothold and no session, no
  # response names a network, a resource or anything in a share, and a share's id gets
  # the answer an invented id gets on that route.
  class NetworkNoExposureTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    ALL_ROOMS = %w[lobby comms_room server_room workshop desk_room finance_office kiosk_room store].freeze

    test 'with no foothold and no session no read route names a network, a resource or a share item' do
      build_network_game('unlockedRooms' => ALL_ROOMS.dup)
      get game_path('scenario'), as: :json
      assert_response :success
      refute_exposed('/scenario')
      ALL_ROOMS.each do |room_id|
        get game_path("room/#{room_id}"), as: :json
        assert_response :success
        refute_exposed("/room/#{room_id}")
      end
      %w[sam_pc lena_pc kiosk_pc bench_pc].each do |pc_id|
        get game_path('login_accounts'), params: { pc_id: pc_id }
        assert_response :success, response.body
        refute_exposed("/login_accounts #{pc_id}")
      end
      get game_path('capture_secrets'), as: :json
      assert_response :success
      refute_exposed('/capture_secrets')

      # With captures present (review R1, m8): an empty se_captures cannot leak, so read
      # the route again with entries written as a browser writes them, in a scenario that
      # declares Lena's target id and no capture proof, so her entry is served. The
      # password side of this (B1) is the test below.
      build_network_game({ 'unlockedRooms' => ALL_ROOMS.dup }, lena_declared_scenario)
      forge_captures
      get game_path('capture_secrets'), as: :json
      assert_response :success
      assert response.parsed_body['secrets'].any?, 'the captures were read'
      refute_exposed('/capture_secrets with captures')
    end

    # Slice 9.3b sub-slice K (5.1, beat N1): a bare jack foothold with no pivot session
    # names no linked network. The foothold reaches office_lan only; server_net is unnamed
    # everywhere and its host is refused exactly as an invented id is.
    test 'a bare foothold with no pivot session names no linked network' do
      build_network_game({ 'unlockedRooms' => ALL_ROOMS.dup }, NS.with_pivot)
      take_drop_box
      plant('comms_port')
      assert_response :success

      network_view('jack_comms_port')
      refute_exposed('/network bare foothold', NS::SERVER_STRINGS)

      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: 'jack_comms_port')
      assert_response :forbidden
      refute_exposed('/login server host', NS::SERVER_STRINGS)

      get game_path('scenario'), as: :json
      assert_response :success
      refute_exposed('/scenario with office foothold', NS::SERVER_STRINGS)
    end

    # se_captures as any browser can write it through PUT /sync_state: a credential
    # capture of Lena's username and one of the landing page's address, with no phish.
    def forge_captures
      captures = {
        'lena' => { 'targetId' => 'lena', 'kind' => 'credential', 'address' => 'lfox', 'at' => 1 },
        'portal' => { 'targetId' => 'portal', 'kind' => 'credential', 'address' => NS::LANDING_ADDRESS, 'at' => 2 }
      }
      put game_path('sync_state'), params: { globalVariables: { 'se_captures' => captures } }, as: :json
      assert_response :success, response.body
    end

    # The fixture with Lena's capture route declaring her target id, so an entry keyed
    # 'lena' is one the scenario could have written. With proof: her capture proof, a
    # session on her own PC (which admits only finance).
    def lena_declared_scenario(proof: false)
      scenario = NS.scenario
      lena = scenario['rooms']['lobby']['npcs'].find { |npc| npc['id'] == 'lena' }
      lena['usePayload']['targetId'] = 'lena'
      lena['captureProof'] = [{ 'session' => 'lena_pc' }] if proof
      scenario
    end

    # B1 (docs/achitechture/ACCESS_MODEL_SLICE_9_3A_SERVER_CODE_REVIEW_R1.md): the server
    # trusted se_captures written through PUT /sync_state, so a forged entry earned the
    # account holder's password from GET /capture_secrets. Fixed by the engine plan's
    # capture proofs (section 6, stream E4): an entry whose target id no capture route
    # declares is skipped, and in a scenario that declares proofs an account's password
    # is served only once one of its proofs holds.
    test 'B1: a se_captures entry forged through PUT /sync_state earns no password' do
      build_network_game('unlockedRooms' => ALL_ROOMS.dup)
      forge_captures
      get game_path('capture_secrets'), as: :json
      assert_response :success
      NS::PASSWORDS.each { |password| refute_includes response.body, password, 'a forged capture earned a password' }
      refute_includes response.body, NS::LANDING_SECRET, 'a forged capture earned the landing-page secret'
    end

    test 'B1: with a declared target id and a capture proof, a forged entry earns nothing until the proof holds' do
      build_network_game({ 'unlockedRooms' => ALL_ROOMS.dup }, lena_declared_scenario(proof: true))
      forge_captures
      get game_path('capture_secrets'), as: :json
      assert_response :success
      NS::PASSWORDS.each { |password| refute_includes response.body, password, 'a forged capture earned a password' }
      assert_equal({}, response.parsed_body['accounts'], 'an account with no proof holding is not offered')

      # The proof: a session on Lena's PC, made through the real sign-in.
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD)
      assert_equal true, body['success'], body.inspect
      get game_path('capture_secrets'), as: :json
      assert_equal NS::LENA_PASSWORD, response.parsed_body['secrets']['lena']
      assert_equal({ 'lena' => 'lfox' }, response.parsed_body['accounts'])
      refute_includes response.body, NS::LANDING_SECRET
    end

    test 'GET /network with no foothold is empty, and with one names only its own network' do
      build_network_game
      assert_equal({ 'footholds' => [] }, network_view)
      refute_exposed('/network with no foothold')

      take_drop_box
      plant('comms_port')
      assert_response :success
      network_view
      ([NS::OFFICE_NAME] + NS::OFFICE_RESOURCE_STRINGS).each { |text| assert_includes response.body, text }
      refute_exposed('/network on office_lan', [NS::WORKSHOP_NAME] + NS::WORKSHOP_RESOURCE_STRINGS + NS::SHARE_ITEM_STRINGS)
      get game_path('scenario'), as: :json
      refute_exposed('/scenario with a foothold', NS::OFFICE_RESOURCE_STRINGS + NS::WORKSHOP_RESOURCE_STRINGS + NS::SHARE_ITEM_STRINGS)
    end

    test 'a door unlock carries no exposed string in its room data' do
      build_network_game
      post game_path('unlock'), params: { targetType: 'door', targetId: 'finance_office', attempt: '4455', method: 'pin' }, as: :json
      assert_response :success, response.body
      assert response.parsed_body['roomData'], 'the unlock returned the room data'
      refute_exposed('door /unlock')
    end

    test 'GET /container on a resource or a folder in one answers as an invented id does' do
      build_network_game
      %w[scanned_inbox ledger_archive ledger_yearend bench_notes print_queue].each do |id|
        container('no_such_container_x1')
        invented = answer_for('no_such_container_x1')
        container(id)
        assert_equal invented, answer_for(id), "GET /container #{id}"
        assert_response :not_found
        refute_exposed("/container/#{id}")
      end
    end

    test 'POST /unlock on a resource, an item in one or its locked folder answers as an invented id does' do
      build_network_game
      unlock_object('no_such_object_x1', 'unlocked')
      invented_unlocked = answer_for('no_such_object_x1')
      unlock_object('no_such_object_x1', 'pin', '0000')
      invented_pin = answer_for('no_such_object_x1')
      assert_equal 422, invented_unlocked.first
      %w[scanned_inbox inbox_letter ledger_archive ledger_handover ledger_yearend].each do |id|
        unlock_object(id, 'unlocked')
        assert_equal invented_unlocked, answer_for(id), "unlock #{id} with method unlocked"
        unlock_object(id, 'pin', '0000')
        assert_equal invented_pin, answer_for(id), "unlock #{id} with a wrong PIN"
        refute_exposed("/unlock #{id}")
      end
      refute_includes Array(@game.reload.player_state['unlockedObjects']), 'scanned_inbox'
    end

    test 'POST /inventory add of a share item with no source answers as an invented item does' do
      build_network_game
      add_item('text_file', 'no_such_item_x1', 'Nothing')
      invented = answer_for('no_such_item_x1')
      assert_equal 422, invented.first
      [['inbox_letter', NS::INBOX_LETTER_NAME], ['ledger_handover', NS::HANDOVER_NAME], ['bench_note', NS::BENCH_NOTE_NAME]].each do |id, name|
        add_item('text_file', id, name)
        assert_equal invented, answer_for(id), "add #{id}"
        refute_exposed("/inventory add #{id}")
      end
      refute_includes held_ids, 'inbox_letter'
    end

    test 'POST /inventory add of a share item from a share or a desktop with no session answers as an invented item does' do
      build_network_game
      [{ source_resource_id: 'scanned_inbox' }, { source_resource_id: 'ledger_archive' }, { source_pc_id: 'sam_pc' },
       { source_pc_id: 'lena_pc' }].each do |source|
        add_item('text_file', 'no_such_item_x1', 'Nothing', **source)
        invented = answer_for('no_such_item_x1')
        assert_equal 422, invented.first
        [['inbox_letter', NS::INBOX_LETTER_NAME], ['ledger_handover', NS::HANDOVER_NAME]].each do |id, name|
          add_item('text_file', id, name, **source)
          assert_equal invented, answer_for(id), "add #{id} with #{source}"
          refute_exposed("/inventory add #{id} with #{source}")
        end
      end
      assert_equal [], held_ids
    end

    test 'a share item text is only ever in a /container answer' do
      build_network_game
      take_drop_box
      plant('comms_port')
      post game_path('login'), params: { pc_id: 'lena_pc', username: 'lfox', password: NS::LENA_PASSWORD, foothold: 'jack_comms_port' },
                               as: :json
      assert_response :success
      texts = [NS::INBOX_LETTER_TEXT, NS::HANDOVER_TEXT, NS::YEAREND_REPORT_TEXT]
      network_view
      refute_exposed('/network', texts)
      get game_path('scenario'), as: :json
      refute_exposed('/scenario', texts)
      container('lena_pc', foothold: 'jack_comms_port')
      refute_exposed('the desktop', texts)
      container('scanned_inbox')
      assert_includes response.body, NS::INBOX_LETTER_TEXT
    end
  end
end
