require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3a, step 4 (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md,
  # sections 4.4, 4.5 and 5): file shares, the lookups that reach them, and the
  # accounts map of GET /capture_secrets.
  class NetworkSharesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    OFFICE = 'jack_comms_port'.freeze
    LEDGER_STUB = { 'id' => 'ledger_archive', 'type' => 'network_share', 'name' => 'Ledger-Archive (\\\\HB-FS01\\Ledger-Archive)',
                    'takeable' => false, 'locked' => false, 'hasContents' => true }.freeze

    def state
      @game.reload.player_state
    end

    def plant_office
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def write_state
      @game.reload
      yield @game.player_state
      @game.save!
    end

    def contents_ids(id, foothold: nil)
      body = container(id, foothold: foothold)
      assert_response :success, body.inspect
      body['contents'].map { |c| c['id'] }
    end

    # ---- the rule of 4.5 --------------------------------------------------------------

    test 'an open share opens from the view with a foothold' do
      build_network_game
      plant_office
      assert_equal ['inbox_letter'], contents_ids('scanned_inbox')
      assert_includes response.body, NS::INBOX_LETTER_TEXT
    end

    test 'an open share opens through a local desktop with no foothold, and with neither it is 404' do
      build_network_game
      container('scanned_inbox')
      assert_response :not_found
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success
      assert_equal ['inbox_letter'], contents_ids('scanned_inbox')
      stubs = container('sam_pc')['contents'].select { |c| c['type'] == 'network_share' }
      assert_equal ['scanned_inbox'], stubs.map { |c| c['id'] }
    end

    # lab_physical_pentest's records share: listed by its folder names and never opened. With
    # no contents the view row carries its observations, and no desktop maps it as a folder.
    test 'a share with no contents is listed with its observations and mapped on no desktop' do
      data = NS.scenario
      data['resources']['listed_only'] = { 'kind' => 'file_share', 'name' => 'Listed-Only', 'host' => NS::FS_HOST,
                                           'network' => 'office_lan', 'observations' => 'Top folders: one per client.' }
      build_network_game({}, data)
      plant_office
      row = network_view(OFFICE)['footholds'].first['hosts'].find { |h| h['id'] == 'listed_only' }
      assert_equal 'Top folders: one per client.', row['observations']
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success
      stubs = container('sam_pc')['contents'].select { |c| c['type'] == 'network_share' }
      assert_equal ['scanned_inbox'], stubs.map { |c| c['id'] }
    end

    test 'a session on another network or on no network does not reach a share' do
      build_network_game
      sign_in('bench_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success
      container('scanned_inbox')
      assert_response :not_found
      assert_equal ['bench_note'], contents_ids('bench_notes')
      sign_in('offline_pc', 'lfox', NS::LENA_PASSWORD)
      assert_response :success
      refute(container('offline_pc')['contents'].any? { |c| c['type'] == 'network_share' })
      container('ledger_archive')
      assert_response :not_found
    end

    test 'a protected share is a stub on an admitted account desktop, local or remote, and on no other' do
      build_network_game
      plant_office
      container('ledger_archive')
      assert_response :not_found, 'a foothold alone does not open a share with an access list'
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      desktop = container('lena_pc', foothold: OFFICE)['contents']
      assert_equal %w[lena_local ledger_archive scanned_inbox], desktop.map { |c| c['id'] },
                   'the profile first, then the mapped shares sorted by id'
      assert_equal LEDGER_STUB, desktop[1]
      assert_equal %w[ledger_handover ledger_yearend], contents_ids('ledger_archive')

      write_state { |ps| ps['unlockedRooms'] << 'finance_office' }
      assert_includes container('lena_pc')['contents'].map { |c| c['id'] }, 'ledger_archive'

      write_state { |ps| ps['sessions'] = {} }
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      refute_includes container('sam_pc')['contents'].map { |c| c['id'] }, 'ledger_archive'
      container('ledger_archive')
      assert_response :not_found

      sign_in('bench_pc', 'lfox', NS::LENA_PASSWORD)
      assert_equal ['bench_notes'], container('bench_pc')['contents'].select { |c| c['type'] == 'network_share' }.map { |c| c['id'] }
    end

    # ---- Copy and Move ----------------------------------------------------------------

    test 'Move from an open share opened in the view, and not without a foothold' do
      build_network_game
      body = add_item('text_file', 'inbox_letter', NS::INBOX_LETTER_NAME, source_resource_id: 'scanned_inbox', transfer: 'move')
      assert_response :unprocessable_entity
      assert_equal 'Item not found in scenario: text_file', body['message']
      plant_office
      body = add_item('text_file', 'inbox_letter', NS::INBOX_LETTER_NAME, source_resource_id: 'scanned_inbox', transfer: 'move')
      assert_equal true, body['success'], body.inspect
      assert_includes held_ids, 'inbox_letter'
      assert_equal [], contents_ids('scanned_inbox')
    end

    test 'Copy from a mapped share on an admitted desktop keeps it listed; Move of a copy-only file is refused' do
      build_network_game
      plant_office
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      body = add_item('text_file', 'ledger_handover', NS::HANDOVER_NAME, source_pc_id: 'lena_pc', transfer: 'move')
      assert_response :unprocessable_entity
      assert_equal 'This file can only be copied', body['message']
      body = add_item('text_file', 'ledger_handover', NS::HANDOVER_NAME, source_pc_id: 'lena_pc', transfer: 'copy')
      assert_equal true, body['success'], body.inspect
      assert_includes state['copiedItems'], 'ledger_handover'
      assert_includes contents_ids('ledger_archive'), 'ledger_handover'
    end

    test 'Copy and Move from a protected share are refused without an admitted desktop' do
      build_network_game
      plant_office
      body = add_item('text_file', 'ledger_handover', NS::HANDOVER_NAME, source_resource_id: 'ledger_archive', transfer: 'copy')
      assert_equal 'Item not found in scenario: text_file', body['message']
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      %w[copy move].each do |transfer|
        body = add_item('text_file', 'ledger_handover', NS::HANDOVER_NAME, source_pc_id: 'sam_pc', transfer: transfer)
        assert_response :unprocessable_entity
        assert_equal false, body['success']
        body = add_item('text_file', 'inbox_letter', NS::INBOX_LETTER_NAME, source_pc_id: 'offline_pc', transfer: transfer)
        assert_equal false, body['success']
      end
      refute_includes held_ids, 'ledger_handover'

      body = add_item('text_file', 'inbox_letter', NS::INBOX_LETTER_NAME, source_pc_id: 'sam_pc', transfer: 'copy')
      assert_equal true, body['success'], 'an open share maps on any desktop on its network'
    end

    test 'Copy and Move from a remote desktop on the same share' do
      build_network_game
      plant_office
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      body = add_item('text_file', 'inbox_letter', NS::INBOX_LETTER_NAME, source_pc_id: 'lena_pc', transfer: 'move')
      assert_equal true, body['success'], body.inspect
      refute_includes contents_ids('scanned_inbox', foothold: nil), 'inbox_letter'
    end

    # ---- a locked folder in a share ---------------------------------------------------

    test 'a locked folder in a share is refused without an admitted source and opens with one' do
      build_network_game
      plant_office
      body = unlock_object('ledger_yearend', 'pin', NS::YEAREND_PIN)
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'message' => 'Invalid attempt' }, body)
      container('ledger_yearend')
      assert_response :not_found

      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      container('ledger_yearend')
      assert_response :forbidden, 'admitted but still locked'
      unlock_object('ledger_yearend', 'pin', '0000')
      assert_response :unprocessable_entity
      body = unlock_object('ledger_yearend', 'pin', NS::YEAREND_PIN)
      assert_response :success, body.inspect
      assert_equal ['yearend_report'], body['contents'].map { |c| c['id'] }
      assert_equal ['yearend_report'], contents_ids('ledger_yearend')
      body = add_item('text_file', 'yearend_report', NS::YEAREND_REPORT_NAME, source_pc_id: 'lena_pc', transfer: 'copy')
      assert_equal true, body['success'], body.inspect
    end

    test 'POST /unlock with method unlocked on a share admitted to no source writes nothing' do
      build_network_game
      plant_office
      unlock_object('ledger_archive', 'unlocked')
      assert_response :unprocessable_entity
      refute_includes Array(state['unlockedObjects']), 'ledger_archive'
    end

    # ---- lookups ----------------------------------------------------------------------

    test 'a plain inventory add of a share item is refused even with a foothold held' do
      build_network_game
      plant_office
      body = add_item('text_file', 'inbox_letter', NS::INBOX_LETTER_NAME)
      assert_response :unprocessable_entity
      assert_equal 'Item not found in scenario: text_file', body['message']
    end

    test 'a refused share id on /unlock and /inventory answers exactly as an invented id' do
      build_network_game
      plant_office
      unlock_object('no_such_object_x1', 'unlocked')
      invented = answer_for('no_such_object_x1')
      %w[ledger_archive ledger_handover ledger_yearend].each do |id|
        unlock_object(id, 'unlocked')
        assert_equal invented, answer_for(id), id
        assert_equal({ 'success' => false, 'message' => 'Invalid attempt' }, response.parsed_body)
      end
      add_item('text_file', 'no_such_item_x1', 'Nothing', source_resource_id: 'ledger_archive')
      invented = answer_for('no_such_item_x1')
      add_item('text_file', 'ledger_handover', NS::HANDOVER_NAME, source_resource_id: 'ledger_archive')
      assert_equal invented, answer_for('ledger_handover')
      add_item('text_file', 'no_such_item_x1', 'Nothing', source_resource_id: 'no_such_share')
      assert_equal invented, answer_for('no_such_item_x1')
    end

    # Review R1, m7: a resource with no network is reached by nothing (3.4), however
    # open its access list and whatever the player holds.
    test 'a resource with no network is never reached or listed, with a foothold and a session held' do
      data = NS.scenario
      data['resources']['loose_share'] = {
        'kind' => 'file_share', 'name' => 'Loose-Share', 'host' => 'NO-NET-01',
        'contents' => [{ 'id' => 'loose_file', 'type' => 'text_file', 'name' => 'loose.txt', 'takeable' => true,
                         'text' => 'LOOSE-FILE-TEXT-5520' }]
      }
      build_network_game({}, data)
      plant_office
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success
      container('no_such_container_x1')
      invented = answer_for('no_such_container_x1')
      container('loose_share')
      assert_equal invented, answer_for('loose_share')
      container('loose_share', foothold: OFFICE)
      assert_response :not_found
      add_item('text_file', 'loose_file', 'loose.txt', source_resource_id: 'loose_share')
      assert_response :unprocessable_entity
      network_view
      refute_includes response.body, 'loose_share'
      refute_includes response.body, 'Loose-Share'
      refute_includes container('sam_pc').to_json, 'loose_share', 'no desktop maps it'
    end

    # Nothing forbids an author putting a sign-in object in a share yet (step 5's
    # validator will). It must not tell a browser with no source that the id exists, and
    # it is no desktop to one with a source.
    test 'a sign-in object inside a share answers as an invented id with no source, and is no desktop with one' do
      data = NS.scenario
      data['resources']['scanned_inbox']['contents'] << {
        'id' => 'share_kiosk', 'type' => 'pc', 'name' => 'Share kiosk', 'locked' => true, 'lockType' => 'login',
        'access' => { 'roles' => ['staff'] },
        'contents' => [{ 'id' => 'share_kiosk_file', 'type' => 'text_file', 'name' => 'kiosk.txt', 'text' => 'SHARE-KIOSK-TEXT-4471' }]
      }
      build_network_game({}, data)
      container('no_such_container_x1')
      invented = answer_for('no_such_container_x1')
      container('share_kiosk')
      assert_equal invented, answer_for('share_kiosk')

      plant_office
      body = container('share_kiosk')
      assert_response :forbidden
      assert_equal 'unreachable', body['reason']
      refute_includes response.body, 'SHARE-KIOSK-TEXT-4471'
    end

    # ---- GET /capture_secrets accounts ------------------------------------------------

    def lena_npc(scenario)
      scenario['rooms']['lobby']['npcs'].find { |npc| npc['id'] == 'lena' }
    end

    def captures(entries, reveal: true)
      scenario = NS.scenario
      scenario['social']['captures']['revealSecret'] = reveal
      # The target ids the entries below use, declared as a scenario declares them: a target id
      # declared nowhere is never served (engine plan section 6).
      lena_npc(scenario)['usePayload']['targetId'] = 'lena'
      scenario['social']['phishTargets'] = [{ 'id' => 'portal' }, { 'id' => 'stray' }]
      build_network_game({ 'globalVariables' => { 'se_captures' => entries } }, scenario)
      get game_path('capture_secrets'), as: :json
      assert_response :success
      response.parsed_body
    end

    test 'accounts holds an account capture username and not a landing-page address' do
      body = captures({
                        'lena' => { 'targetId' => 'lena', 'kind' => 'credential', 'address' => ' LFox ', 'at' => 1 },
                        'portal' => { 'targetId' => 'portal', 'kind' => 'credential', 'address' => NS::LANDING_ADDRESS, 'at' => 2 }
                      })
      assert_equal({ 'lena' => 'LFox' }, body['accounts'])
      assert_equal({ 'lena' => NS::LENA_PASSWORD, 'portal' => NS::LANDING_SECRET }, body['secrets'])
    end

    test 'with revealSecret off accounts still holds the username and secrets is empty' do
      body = captures({ 'lena' => { 'targetId' => 'lena', 'kind' => 'credential', 'address' => 'lfox', 'at' => 1 } }, reveal: false)
      assert_equal({ 'lena' => 'lfox' }, body['accounts'])
      assert_equal({}, body['secrets'])
    end

    test 'the single-secret fallback never adds an entry to accounts, nor does an account with no capture route' do
      body = captures({
                        'stray' => { 'targetId' => 'stray', 'kind' => 'credential', 'address' => 'nobody@harbour.example', 'at' => 1 },
                        'ian' => { 'targetId' => 'ian', 'kind' => 'credential', 'address' => 'ishaw', 'at' => 2 }
                      })
      assert_equal NS::LANDING_SECRET, body['secrets']['stray'], 'the fallback served the stray entry'
      assert_equal({}, body['accounts'])
    end
  end
end
