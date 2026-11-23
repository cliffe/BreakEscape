require 'test_helper'
require_relative '../../support/network_model_scenario'
require_relative '../../support/ops_log_assertions'

module BreakEscape
  # Ops log L3, part A (docs/achitechture/OPS_LOG_ROWS_PLAN.md 5.1, 11 and 13.8): the network and
  # share rows through the real routes. Every assertion reads a re-read game (Game.find), so a
  # missing save fails. It is a new file beside network_shares_test.rb and network_wifi_test.rb,
  # which stay as they were.
  class NetworkLogRowsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests
    include OpsLogAssertions

    NS = NetworkModelScenario
    OFFICE = 'jack_comms_port'.freeze
    PSK = 'seabreeze-2025'.freeze
    SOURCES = { 'net' => { 'title' => 'Network log', 'events' => ['net_*', 'share_*'] } }.freeze

    def scenario(logged: true)
      data = NS.scenario
      data['logSources'] = SOURCES.deep_dup if logged
      data['networks']['guest_wifi'] = { 'name' => 'Guest Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Guest', 'psk' => PSK } }
      objects = data['rooms']['lobby']['objects']
      objects << { 'id' => 'guest_ap', 'type' => 'pc', 'sprite' => 'wifi_ap1', 'name' => 'Guest access point',
                   'wifiAp' => true, 'network' => 'guest_wifi' }
      objects << { 'id' => 'guest_ap2', 'type' => 'pc', 'sprite' => 'wifi_ap1', 'name' => 'Guest access point (lift)',
                   'wifiAp' => true, 'network' => 'guest_wifi' }
      objects << { 'id' => 'badusb', 'type' => 'usb_stick', 'name' => 'Keystroke device', 'takeable' => true, 'usbClass' => 'hid' }
      data['timers'] = [{ 'id' => 'sam_uses_stick', 'startOnGlobal' => 'stick_dropped',
                          'actions' => [{ 'type' => 'grant_foothold', 'pc' => 'sam_pc', 'needsDropped' => 'kit_stick',
                                          'name' => 'USB foothold: Sam desk' }] }]
      data
    end

    def build(player_state = {}, data = scenario)
      build_network_game(player_state, data)
    end

    def join(ap_id, key = nil)
      params = { ap_id: ap_id }
      params[:key] = key if key
      post game_path('network/join'), params: params, as: :json
      response.parsed_body
    end

    def rows
      Game.find(@game.id).log_rows_for('net')
    end

    def stamp
      Game.find(@game.id).updated_at
    end

    def only_row(event)
      found = rows.select { |r| r['event'] == event }
      assert_equal 1, found.size, "one #{event} row, got #{rows.map { |r| r['event'] }.inspect}"
      found.first
    end

    def assert_nothing_stored
      assert_nil Game.find(@game.id).player_state['opsLog']
      assert_nil Game.find(@game.id).player_state['opsLogSeq']
    end

    # ---- plant and unplug -------------------------------------------------------------

    test 'plant writes one net_link_up row for the jack, no identity, and the plant saves it' do
      build
      take_drop_box
      body = plant('comms_port')
      assert_response :success, body.inspect
      row = only_row('net_link_up')
      assert_equal 'ok', row['result']
      assert_nil row['as']
      assert_equal({ 'kind' => 'jack', 'id' => 'comms_port' }, row['where'])
      assert_nil row['detail'], 'the link rows carry no detail'
      assert_equal 1, (row['n'] || 1)
      assert_ops_log_holds_no_secret(Game.find(@game.id))
    end

    test 'planting again at a planted jack, and every refused plant, write no row' do
      build
      take_drop_box
      plant('nowhere')
      assert_response :not_found
      plant('comms_port', 'not_held')
      assert_response :unprocessable_entity
      assert_nothing_stored
      plant('server_port') # a jack in the locked server room, out of reach
      assert_response :forbidden
      assert_nothing_stored
      plant('comms_port')
      assert_response :success
      before = stamp
      assert_equal true, plant('comms_port')['already']
      assert_equal 1, rows.size
      assert_equal before, stamp, 'a repeat plant saves nothing'
    end

    test 'a port-security refusal writes no row' do
      build({}, begin
        data = NS.with_secured_port
        data['logSources'] = SOURCES.deep_dup
        data
      end)
      take_drop_box
      plant('secure_port')
      assert_response :unprocessable_entity
      assert_equal 'port_security', response.parsed_body['reason']
      assert_nothing_stored
    end

    test 'unplug writes one net_link_down row; one with nothing plugged in, or after it, writes none' do
      build
      take_drop_box
      unplug('comms_port')
      assert_response :unprocessable_entity
      assert_nothing_stored
      plant('comms_port')
      body = unplug('comms_port')
      assert_response :success, body.inspect
      down = only_row('net_link_down')
      assert_equal 'ok', down['result']
      assert_nil down['as']
      assert_equal({ 'kind' => 'jack', 'id' => 'comms_port' }, down['where'])
      before = stamp
      unplug('comms_port')
      assert_response :unprocessable_entity
      assert_equal before, stamp
      unplug('nowhere')
      assert_response :not_found
      assert_equal %w[net_link_up net_link_down], rows.map { |r| r['event'] }
    end

    test 'a plant, unplug and plant again are three rows in order, one per plant or unplug (13.8)' do
      build
      take_drop_box
      plant('comms_port')
      unplug('comms_port')
      plant('comms_port')
      assert_equal %w[net_link_up net_link_down net_link_up], rows.map { |r| r['event'] }
      assert_equal [1, 1, 1], rows.map { |r| r['n'] || 1 }
      assert_equal ['', '', ''], Game.find(@game.id).log_rows_for_client('net')[:rows].map { |r| r[:detail] }
      assert_not Game.find(@game.id).player_state.key?('netLinkSteps'), 'no hidden step counter in player state'
    end

    test 'twelve plant and unplug steps on one jack read up, down, up in order with no merged row (merge: false)' do
      build
      take_drop_box
      6.times do
        plant('comms_port')
        assert_response :success
        unplug('comms_port')
        assert_response :success
      end
      assert_equal %w[net_link_up net_link_down] * 6, rows.map { |r| r['event'] }
      assert(rows.none? { |r| r.key?('n') }, 'no link row merged')
      assert_equal rows.map { |r| r['seq'] }.sort, rows.map { |r| r['seq'] }
      assert_not Game.find(@game.id).player_state.key?('netLinkSteps')
    end

    test 'the source cap still bounds the link rows, newest last, and the stored log stays bounded' do
      data = scenario
      data['logSources']['net']['maxRows'] = 10
      build({}, data)
      take_drop_box
      9.times do
        plant('comms_port')
        unplug('comms_port')
      end
      stored = rows
      assert_operator stored.size, :<=, 10
      assert_equal 10, stored.size
      assert(stored.each_cons(2).all? { |a, b| a['seq'] < b['seq'] }, 'in order, newest last')
      assert(stored.each_cons(2).all? { |a, b| a['event'] != b['event'] }, 'up and down alternate')
      assert_operator Game.find(@game.id).player_state['opsLog'].to_json.bytesize, :<, 10_000
    end

    # ---- join -------------------------------------------------------------------------

    test 'a join writes one net_wifi_join row for the access point, none for a wrong key, a repeat or a second point' do
      build
      body = join('guest_ap', 'wrong-key')
      assert_response :unprocessable_entity, body.inspect
      assert_nothing_stored
      join('no_such_ap', PSK)
      assert_response :not_found
      assert_nothing_stored
      body = join('guest_ap', PSK)
      assert_response :success, body.inspect
      row = only_row('net_wifi_join')
      assert_equal 'ok', row['result']
      assert_nil row['as']
      assert_equal({ 'kind' => 'ap', 'id' => 'guest_ap' }, row['where'])
      assert_nil row['detail']
      assert_equal true, join('guest_ap', PSK)['already']
      assert_equal true, join('guest_ap2', PSK)['already']
      assert_equal 1, rows.size
      assert_equal 1, rows.first['n'] || 1
      assert_ops_log_holds_no_secret(Game.find(@game.id))
    end

    test 'the Wi-Fi key never reaches a row' do
      build
      join('guest_ap', PSK)
      assert_not_includes Game.find(@game.id).player_state['opsLog'].to_json, PSK
    end

    # ---- implant ----------------------------------------------------------------------

    test 'an implanted foothold writes no row' do
      build('droppedItems' => ['kit_stick'])
      body = post(game_path('network/implant'), params: { pc_id: 'sam_pc', shape: 'dropped' }, as: :json) && response.parsed_body
      assert_response :success, body.inspect
      assert_equal 'implant_sam_pc', body.dig('foothold', 'id')
      assert_nothing_stored
    end

    # ---- no logSources ----------------------------------------------------------------

    test 'a scenario without logSources writes nothing and the same requests answer as with them' do
      answers = [true, false].map do |logged|
        build({}, scenario(logged: logged))
        out = []
        take_drop_box
        out << [plant('comms_port'), response.status]
        out << [join('guest_ap', PSK), response.status]
        out << [container('scanned_inbox', foothold: OFFICE), response.status]
        out << [unplug('comms_port'), response.status]
        assert_nothing_stored unless logged
        out.to_json.gsub(@game.id.to_s, '<id>')
      end
      assert_equal answers.first, answers.last, 'answers match byte for byte with and without logSources'
    end

    # ---- share_folder_opened ----------------------------------------------------------

    def plant_office
      take_drop_box
      plant('comms_port')
      assert_response :success
    end

    def share_rows
      rows.select { |r| r['event'] == 'share_folder_opened' }
    end

    test 'opening a share with only a foothold writes one row with no account, saves, and a repeat writes and saves nothing' do
      build
      plant_office
      before_rows = share_rows.size
      container('scanned_inbox', foothold: OFFICE)
      assert_response :success
      assert_equal before_rows + 1, share_rows.size
      row = share_rows.last
      assert_equal 'ok', row['result']
      assert_nil row['as']
      assert_equal({ 'kind' => 'share', 'id' => 'scanned_inbox' }, row['where'])
      assert_nil row['detail'], 'the share itself opened: no folder'
      before = stamp
      body = container('scanned_inbox', foothold: OFFICE)
      assert_response :success
      assert_equal before_rows + 1, share_rows.size
      assert_equal before, stamp, 'the repeat open saves nothing'
      assert_equal ['inbox_letter'], body['contents'].map { |c| c['id'] }
      assert_not_includes Game.find(@game.id).player_state['opsLog'].to_json, 'inbox_letter', 'no file is named'
      assert_not_includes Game.find(@game.id).player_state['opsLog'].to_json, NS::INBOX_LETTER_TEXT
      assert_ops_log_holds_no_secret(Game.find(@game.id))
    end

    test 'another account opening the same share writes its own row' do
      build
      plant_office
      container('scanned_inbox', foothold: OFFICE)
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success
      container('scanned_inbox')
      assert_response :success
      container('scanned_inbox')
      accounts = share_rows.map { |r| r['as'] }
      assert_equal [nil, { 'account' => 'sokafor' }], accounts
    end

    test 'a folder row names the folder id and not a file, once per folder' do
      build('unlockedRooms' => NetworkRequests::OPEN_ROOMS + ['finance_office'])
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD)
      assert_response :success
      unlock_object('ledger_yearend', 'pin', NS::YEAREND_PIN)
      assert_response :success
      container('ledger_archive')
      assert_response :success, response.body
      container('ledger_yearend')
      assert_response :success, response.body
      container('ledger_yearend')
      assert_equal 2, share_rows.size
      share, folder = share_rows
      assert_nil share['detail']
      assert_equal({ 'folder' => 'ledger_yearend' }, folder['detail'])
      assert_equal({ 'kind' => 'share', 'id' => 'ledger_archive' }, folder['where'])
      assert_equal({ 'account' => 'lfox' }, folder['as'])
      assert_not_includes Game.find(@game.id).player_state['opsLog'].to_json, 'yearend_report'
    end

    test 'refused opens write nothing: no foothold or session, a locked folder, an invented id, a listed-only share' do
      data = scenario
      data['resources']['listed_only'] = { 'kind' => 'file_share', 'name' => 'Listed-Only', 'host' => NS::FS_HOST,
                                           'network' => 'office_lan', 'observations' => 'Top folders: one per client.' }
      build({}, data)
      container('scanned_inbox')
      assert_response :not_found
      container('no_such_share')
      assert_response :not_found
      assert_nothing_stored
      plant_office
      container('listed_only', foothold: OFFICE)
      assert_response :not_found
      container('ledger_archive', foothold: OFFICE) # access-listed: a foothold does not admit it
      assert_response :not_found
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      container('ledger_yearend', foothold: OFFICE) # admitted, but the folder is locked
      assert_response :forbidden
      assert_empty share_rows
    end

    test 'with two sessions that admit a share the row names the one signed in first, on every open' do
      [%w[sam_pc sokafor], %w[lena_pc lfox]].permutation.each do |order|
        build('unlockedRooms' => NetworkRequests::OPEN_ROOMS + ['finance_office'])
        order.each do |pc, user|
          sign_in(pc, user, user == 'sokafor' ? NS::SAM_PASSWORD : NS::LENA_PASSWORD)
          assert_response :success, "#{pc} signs in"
        end
        container('scanned_inbox')
        assert_response :success
        container('scanned_inbox')
        assert_equal [{ 'account' => order.first.last }], share_rows.map { |r| r['as'] }, order.inspect
      end
    end

    test 'a share row under a foothold session does not name the foothold, the relay or the source PC' do
      build
      plant_office
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      container('ledger_archive', foothold: OFFICE)
      assert_response :success, response.body
      json = share_rows.to_json
      assert_equal 1, share_rows.size
      [OFFICE, 'comms_port', 'lena_pc'].each { |text| assert_not_includes json, text }
      assert_ops_log_holds_no_secret(Game.find(@game.id))
    end

    test 'a scenario without logSources: a share open saves nothing and a session record gains no key' do
      build({}, scenario(logged: false))
      plant_office
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_equal %w[id via], Game.find(@game.id).player_state['sessions']['sam_pc'].keys.sort
      before = stamp
      container('scanned_inbox', foothold: OFFICE)
      assert_response :success
      assert_equal before, stamp
      assert_nothing_stored
    end

    test 'the reader shows the rows by kind word or authored name, never a raw id' do
      build('unlockedRooms' => NetworkRequests::OPEN_ROOMS + ['finance_office'])
      take_drop_box
      plant('comms_port')
      join('guest_ap', PSK)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD)
      unlock_object('ledger_yearend', 'pin', NS::YEAREND_PIN)
      container('ledger_archive')
      container('ledger_yearend')
      shown = Game.find(@game.id).log_rows_for_client('net')[:rows].map { |r| r.slice(:event, :as, :where, :result, :detail) }
      assert_equal [
        { event: 'NET_LINK_UP', as: '-', where: 'Spare wall port', result: 'OK', detail: '' },
        { event: 'NET_WIFI_JOIN', as: '-', where: 'Guest access point', result: 'OK', detail: '' },
        { event: 'SHARE_OPEN', as: 'lfox', where: NS::LEDGER_NAME, result: 'OK', detail: '' },
        { event: 'SHARE_OPEN', as: 'lfox', where: NS::LEDGER_NAME, result: 'OK', detail: "folder: #{NS::YEAREND_NAME}" }
      ], shown
    end

    # ---- session_admitting ------------------------------------------------------------

    # F4: literal expected answers, so a later change of an answer fails. Lena is signed in at
    # lena_pc over the planted foothold, Sam's session at sam_pc is locked, a foothold reaches
    # the office network.
    ADMITTING_TABLE = [
      [nil, :unscoped, true],
      [{ type: 'login_pc', id: 'lena_pc' }, 'lena_pc', true],
      [{ type: 'login_pc', id: 'sam_pc' }, nil, false], # locked session
      [{ type: 'login_pc', id: 'bench_pc' }, nil, false], # no session
      [{ type: 'profile', id: 'lena_files' }, 'lena_pc', true],
      [{ type: 'profile', id: 'sam_files' }, nil, false], # Sam's session is locked: no identity
      [{ type: 'profile', id: 'nope' }, nil, false],
      [{ type: 'other', id: 'x' }, nil, false],
      [{ type: 'resource', id: 'scanned_inbox' }, 'lena_pc', true], # a session and the foothold: the session
      [{ type: 'resource', id: 'ledger_archive' }, 'lena_pc', true], # access-listed for Lena
      [{ type: 'resource', id: 'print_queue' }, 'lena_pc', true], # a printer on the office network
      [{ type: 'resource', id: 'bench_notes' }, nil, false], # on the workshop network, no pivot
      [{ type: 'resource', id: 'invented' }, nil, false]
    ].freeze

    def profile_scenario
      data = scenario
      data['accountProfiles'] = { 'lena_files' => { 'for' => { 'people' => ['lena'] }, 'contents' => [] },
                                  'sam_files' => { 'for' => { 'people' => ['sam'] }, 'contents' => [] } }
      data
    end

    test 'session_admits? and session_admitting give the literal expected answer for every scope kind' do
      build({}, profile_scenario)
      plant_office
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      post lock_session_game_url(@game), params: { pc_id: 'sam_pc' }, as: :json
      game = Game.find(@game.id)
      ADMITTING_TABLE.each do |scope, admitting, admits|
        if admitting.nil?
          assert_nil game.session_admitting(scope), "session_admitting #{scope.inspect}"
        else
          assert_equal admitting, game.session_admitting(scope), "session_admitting #{scope.inspect}"
        end
        assert_equal admits, game.session_admits?(scope), "session_admits? #{scope.inspect}"
      end
    end

    test 'relay, route down and expired token sessions admit nothing, and a foothold alone answers true for an open share' do
      build
      plant_office
      game = Game.find(@game.id)
      assert_equal :foothold, game.session_admitting({ type: 'resource', id: 'scanned_inbox' })
      assert_equal true, game.session_admits?({ type: 'resource', id: 'scanned_inbox' })
      assert_equal false, game.session_admits?({ type: 'resource', id: 'ledger_archive' }), 'a foothold does not admit an access-listed share'
      # a relay session record at a PC the player has no sign-in at
      state = game.player_state
      state['sessions'] = { 'sam_pc' => { 'id' => 'sam', 'via' => 'relay', 'from' => 'nowhere' } }
      game.update_columns(player_state: state)
      game = Game.find(@game.id)
      assert_nil game.session_admitting({ type: 'login_pc', id: 'sam_pc' })
      assert_equal false, game.session_admits?({ type: 'login_pc', id: 'sam_pc' })
      # take the foothold's route away: an unplug
      unplug('comms_port')
      game = Game.find(@game.id)
      assert_nil game.session_admitting({ type: 'resource', id: 'scanned_inbox' })
      assert_equal false, game.session_admits?({ type: 'resource', id: 'scanned_inbox' })
    end

    test 'a session and a foothold both admitting an open share answer the session, each alone answers true' do
      build
      plant_office
      assert_equal :foothold, Game.find(@game.id).session_admitting({ type: 'resource', id: 'scanned_inbox' })
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_equal 'sam_pc', Game.find(@game.id).session_admitting({ type: 'resource', id: 'scanned_inbox' })
      unplug('comms_port') # the foothold goes; Sam's session on the office network still admits it
      assert_equal 'sam_pc', Game.find(@game.id).session_admitting({ type: 'resource', id: 'scanned_inbox' })
      assert_equal true, Game.find(@game.id).session_admits?({ type: 'resource', id: 'scanned_inbox' })
    end

    # F3: the edge as built. "Oldest" is the order PCs were first signed in at (signedInPcs), not
    # the order the held sessions began. Deferred: a seq on the session record.
    test 'the account named is the first admitting session in signedInPcs order, which may not be the oldest by time' do
      build('unlockedRooms' => NetworkRequests::OPEN_ROOMS + ['finance_office'])
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD)
      post game_path('logout'), params: { pc_id: 'sam_pc' }, as: :json
      assert_response :success, response.body
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success
      container('scanned_inbox')
      assert_response :success
      # lena's session is older by time; sam_pc ranks first in signedInPcs
      assert_equal %w[sam_pc lena_pc], Game.find(@game.id).player_state['signedInPcs']
      assert_equal [{ 'account' => 'sokafor' }], share_rows.map { |r| r['as'] }
    end

    # F1: a forged request for a file, or a nameless folder, writes no row and saves nothing.
    test 'a request for a file in an admitted share answers as before and writes no row' do
      build
      plant_office
      container('scanned_inbox', foothold: OFFICE)
      before_rows = share_rows.size
      before = stamp
      container('inbox_letter', foothold: OFFICE)
      assert_response :success
      assert_equal before_rows, share_rows.size
      assert_equal before, stamp, 'a file open saves nothing'
      assert_not_includes Game.find(@game.id).player_state['opsLog'].to_json, 'inbox_letter'
    end

    test 'a file open before any folder open writes no share row' do
      build
      plant_office
      container('inbox_letter', foothold: OFFICE)
      assert_response :success
      assert_empty share_rows
    end

    # Section 11, last bullet: a malformed call fails the route and leaves the game row unchanged.
    test 'a malformed share row call fails the route and leaves the game unchanged' do
      build
      plant_office
      before = Game.find(@game.id).player_state.to_json
      stamp_before = stamp
      original = Game.instance_method(:ops_share_as)
      Game.send(:define_method, :ops_share_as) { |_scope| { typed: 'amy' } } # once: true with typed is malformed
      begin
        failed = begin
          container('scanned_inbox', foothold: OFFICE)
          response.status >= 500
        rescue BreakEscape::OpsLog::Malformed
          true
        end
        assert failed, 'the route fails'
      ensure
        Game.send(:define_method, :ops_share_as, original)
      end
      assert_equal before, Game.find(@game.id).player_state.to_json
      assert_equal stamp_before, stamp
    end

    test 'a foothold alone admitting an open share answers :foothold, not a PC id' do
      build
      plant_office
      game = Game.find(@game.id)
      assert_equal :foothold, game.session_admitting({ type: 'resource', id: 'scanned_inbox' })
      assert_nil game.session_admitting({ type: 'resource', id: 'ledger_archive' })
    end
  end
end
