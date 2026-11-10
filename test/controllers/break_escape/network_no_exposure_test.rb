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
  end
end
