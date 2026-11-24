require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S2 (OPS_CORE_PLAN.md sections 5.3, 6 and 13): POST /network/check and /network/confirm,
  # findings with aliases, the first-check record, the two log rows, needs with ticks and crosses,
  # and fixed weaknesses. Each test builds its own game through the real routes.
  class NetworkFindingsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    NOS = NetworkOpsScenario
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze
    BAD_REQUEST = { 'success' => false, 'reason' => 'bad_request' }.freeze
    UNCONFIRMED_KEYS = %w[id alias hostId service class severity summary status].freeze

    setup do
      findings_game
      sweep_and_scan('sam_pc')
    end

    def check_sam_web
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
    end

    def finding(body, id)
      (body['findings'] || [body['finding']]).find { |f| f['id'] == id }
    end

    def stored(id)
      ops_state['opsFindings'][id]
    end

    def rows(event)
      ops_rows.select { |row| row['event'] == event }
    end

    # ---- the check -----------------------------------------------------------------------------

    test 'a check lists the findings of the service, a decoy and a weakness built from the same keys in id order' do
      body = check_sam_web
      assert_response :success, response.body
      assert_equal true, body['success']
      assert_equal 'sam_pc', body['hostId']
      assert_equal 'web', body['service']
      assert_nil body['already'], 'a check that adds a finding never carries already'
      assert_equal [NOS::FACTORY, NOS::OLD_BANNER, NOS::OPEN_LISTING, NOS::SIDE_ENTRY], body['findings'].map { |f| f['id'] }
      body['findings'].each do |f|
        assert_equal UNCONFIRMED_KEYS, f.keys, "#{f['id']} keys, in order"
        assert_equal 'unconfirmed', f['status']
      end
      assert_equal %w[f1 f2 f3 f4], body['findings'].map { |f| f['alias'] }
      assert_equal NOS::FACTORY_SUMMARY, finding(body, NOS::FACTORY)['summary']
      assert_equal 'medium', finding(body, NOS::OLD_BANNER)['severity']
    end

    test 'a check answer holds exactly success, hostId, service and findings, and already only on a repeat that adds nothing' do
      body = check_sam_web
      assert_equal %w[findings hostId service success], body.keys.sort
      refute_includes response.body, NOS::DOOR_GLOBAL
      refute_includes response.body, NOS::PATCHED_GLOBAL
      assert_equal %w[already findings hostId service success], check_sam_web.keys.sort
    end

    test 'a confirm answer holds exactly success and finding, and already on a repeat; a false finding has no fixed key' do
      check_sam_web
      assert_equal %w[finding success], ops_confirm(OFFICE, NOS::FACTORY).keys.sort
      assert_equal %w[already finding success], ops_confirm(OFFICE, NOS::FACTORY).keys.sort
      decoy = ops_confirm(OFFICE, NOS::OLD_BANNER)['finding']
      refute decoy.key?('fixed')
      refute decoy.key?('needs')
      assert_equal UNCONFIRMED_KEYS + ['falseBecause'], decoy.keys
    end

    test 'the stored value of a finding is a letter and a number, never the finding id' do
      check_sam_web
      ops_confirm(OFFICE, NOS::FACTORY)
      ops_state['opsFindings'].each_value { |value| assert_match(/\A[ucf][0-9]{1,4}\z/, value) }
      refute_includes ops_state['opsFindings'].values.join, 'factory'
    end

    test 'a finding with no authored summary shows a line for its class' do
      body = check_sam_web
      listing = finding(body, NOS::OPEN_LISTING)
      assert_equal NetworkOps::CLASS_SUMMARIES['misconfig'], listing['summary']
    end

    test 'nothing tells a decoy from a weakness before confirm: same keys, same value types' do
      body = check_sam_web
      decoy = finding(body, NOS::OLD_BANNER)
      weak = finding(body, NOS::FACTORY)
      assert_equal weak.keys, decoy.keys
      assert_equal weak.transform_values(&:class), decoy.transform_values(&:class)
      refute_includes body.to_json, NOS::BANNER_FALSE
      refute_includes body.to_json, 'falseBecause'
      refute_includes body.to_json, 'needs'
      refute_includes body.to_json, 'fixed'
    end

    test 'a check of a host listed but not scanned, of a host out of reach, of a service the host does not have and of an unheld foothold are the one 404' do
      body = ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
      assert_response :not_found
      assert_equal NOT_FOUND, body
      ops_check(OFFICE, host_id: 'sam_pc', service: 'nope')
      assert_equal NOT_FOUND, response.parsed_body
      ops_check(OFFICE, host_id: 'sv_fs02', service: 'backup')
      assert_equal NOT_FOUND, response.parsed_body
      ops_check('jack_not_held', host_id: 'sam_pc', service: 'web')
      assert_equal NOT_FOUND, response.parsed_body
      assert_equal({}, ops_state['opsFindings'])
      assert_nil ops_state['opsDiscovered']['services']
      assert_equal [], rows('service_checked')
    end

    test 'the 400 is one body for every bad parameter and writes and saves nothing' do
      before = ops_state.deep_dup
      [
        { host_id: 'sam_pc', service: 'web' },
        { foothold: OFFICE, service: 'web' },
        { foothold: OFFICE, host_id: 'sam_pc' },
        { foothold: OFFICE, host_id: '', service: 'web' },
        { foothold: OFFICE, host_id: %w[sam_pc], service: 'web' },
        { foothold: OFFICE, host_id: 'sam_pc', service: { 'a' => 1 } },
        { foothold: OFFICE, host_id: 'h' * 201, service: 'web' },
        { foothold: OFFICE, host_id: 'sam_pc', service: 's' * 201 }
      ].each do |params|
        post game_path('network/check'), params: params, as: :json
        assert_response :bad_request
        assert_equal BAD_REQUEST, response.parsed_body, params.inspect
      end
      [{ foothold: OFFICE }, { finding_id: NOS::FACTORY }, { foothold: OFFICE, finding_id: '' },
       { foothold: OFFICE, finding_id: %w[x] }, { foothold: OFFICE, finding_id: 'f' * 201 }].each do |params|
        post game_path('network/confirm'), params: params, as: :json
        assert_response :bad_request
        assert_equal BAD_REQUEST, response.parsed_body, params.inspect
      end
      assert_equal before, ops_state
    end

    test 'a host that is powered down answers 403 not_responding on check and confirm, with no row' do
      ops_scan(OFFICE, host_id: 'lab_box') # lab_off is not set: scan while it is on
      check = ops_check(OFFICE, host_id: 'lab_box', service: 'web')
      assert_response :success, response.body
      confirm_id = check['findings'].first['id']
      set_global('lab_off', true)
      ops_check(OFFICE, host_id: 'lab_box', service: 'web')
      assert_response :forbidden
      assert_equal({ 'success' => false, 'reason' => 'not_responding' }, response.parsed_body)
      ops_confirm(OFFICE, confirm_id)
      assert_response :forbidden
      assert_equal({ 'success' => false, 'reason' => 'not_responding' }, response.parsed_body)
      assert_equal 'u1', stored(confirm_id)
      assert_equal 1, rows('service_checked').length
      assert_equal [], rows('finding_confirmed')
    end

    # ---- the first check is recorded whatever it finds ----------------------------------------

    test 'a first check of a service with no finding answers none and no already, records the service and one row' do
      body = ops_check(OFFICE, host_id: 'sam_pc', service: 'files')
      assert_response :success, response.body
      assert_equal({ 'success' => true, 'hostId' => 'sam_pc', 'service' => 'files', 'findings' => [] }, body)
      assert_equal ['sam_pc.files'], ops_state['opsDiscovered']['services']
      assert_equal 1, rows('service_checked').length
      again = ops_check(OFFICE, host_id: 'sam_pc', service: 'files')
      assert_equal({ 'success' => true, 'already' => true, 'hostId' => 'sam_pc', 'service' => 'files', 'findings' => [] }, again)
      assert_equal 1, rows('service_checked').length, 'a repeat writes nothing'
    end

    test 'a service whose only weakness is fixed checks to nothing, and a later unfix adds it without a second row' do
      findings_game(patched: true)
      sweep_and_scan('print_srv')
      body = ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
      assert_equal [], body['findings']
      assert_nil body['already']
      assert_equal ['print_srv.queue'], ops_state['opsDiscovered']['services']
      assert_equal 1, rows('service_checked').length
      assert_equal({}, ops_state['opsFindings'])
      # patched stays: a repeat adds nothing
      assert_equal true, ops_check(OFFICE, host_id: 'print_srv', service: 'queue')['already']
      # the weakness becomes unfixed
      set_global(NOS::PATCHED_GLOBAL, false)
      added = ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
      assert_nil added['already'], 'a check that adds a finding never carries already'
      assert_equal [NOS::SPOOL], added['findings'].map { |f| f['id'] }
      assert_equal 'u1', stored(NOS::SPOOL)
      assert_equal 1, rows('service_checked').length, 'no second row'
      assert_equal true, ops_check(OFFICE, host_id: 'print_srv', service: 'queue')['already']
    end

    test 'a repeat check keeps statuses and aliases, after a confirm too, and answers already' do
      first = check_sam_web
      ops_confirm(OFFICE, NOS::FACTORY)
      ops_confirm(OFFICE, NOS::OLD_BANNER)
      again = check_sam_web
      assert_equal true, again['already']
      assert_equal %w[confirmed false unconfirmed unconfirmed], again['findings'].map { |f| f['status'] }
      assert_equal first['findings'].map { |f| f['alias'] }, again['findings'].map { |f| f['alias'] }
      assert_equal 1, rows('service_checked').length
    end

    test 'a repeat check changes nothing in saved state' do
      check_sam_web
      before = ops_state.deep_dup
      check_sam_web
      assert_equal before, ops_state
    end

    # ---- aliases --------------------------------------------------------------------------------

    test 'aliases are given in the order found, carry on across services and hosts, and survive a reload' do
      sweep_and_scan('print_srv')
      check_sam_web
      body = ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
      assert_equal %w[f5], body['findings'].map { |f| f['alias'] }
      assert_equal({ NOS::FACTORY => 'u1', NOS::OLD_BANNER => 'u2', NOS::OPEN_LISTING => 'u3', NOS::SIDE_ENTRY => 'u4', NOS::SPOOL => 'u5' },
                   ops_state['opsFindings'])
      # a fresh load of the game (a reload) reads the same aliases back
      assert_equal %w[f1 f2 f3 f4], row_findings('sam_pc').map { |f| f['alias'] }
      assert_equal %w[f5], row_findings('print_srv').map { |f| f['alias'] }
    end

    test 'a weakness unfixed later takes the next alias, and an alias is never given twice' do
      findings_game(patched: true)
      sweep_and_scan('sam_pc')
      body = check_sam_web
      assert_equal [NOS::OLD_BANNER, NOS::OPEN_LISTING, NOS::SIDE_ENTRY], body['findings'].map { |f| f['id'] }
      assert_equal %w[f1 f2 f3], body['findings'].map { |f| f['alias'] }
      set_global(NOS::PATCHED_GLOBAL, false)
      later = check_sam_web
      assert_nil later['already']
      assert_equal 'f4', finding(later, NOS::FACTORY)['alias']
      assert_equal %w[f4 f1 f2 f3], later['findings'].map { |f| f['alias'] }
      assert_equal 1, rows('service_checked').length
    end

    # ---- confirm -------------------------------------------------------------------------------

    test 'confirming a weakness settles it confirmed and a decoy false, free, with a row for each' do
      check_sam_web
      body = ops_confirm(OFFICE, NOS::FACTORY)
      assert_response :success, response.body
      assert_nil body['already']
      assert_equal 'confirmed', body['finding']['status']
      assert_equal 'f1', body['finding']['alias']
      assert_equal 'c1', stored(NOS::FACTORY)
      decoy = ops_confirm(OFFICE, NOS::OLD_BANNER)['finding']
      assert_equal 'false', decoy['status']
      assert_equal NOS::BANNER_FALSE, decoy['falseBecause']
      assert_nil decoy['needs']
      assert_equal 'f2', decoy['alias']
      assert_equal 'f2', stored(NOS::OLD_BANNER)
      confirms = rows('finding_confirmed')
      assert_equal 2, confirms.length
      assert_equal [{ 'finding' => 'f1', 'status' => 'confirmed' }, { 'finding' => 'f2', 'status' => 'false' }], confirms.map { |r| r['detail'] }
      assert_equal [{ 'kind' => 'pc', 'id' => 'sam_pc' }], confirms.map { |r| r['where'] }.uniq
      assert_equal [nil], confirms.map { |r| r['as'] }.uniq
    end

    test 'a repeat confirm answers already with the settled finding, writes nothing and changes no state' do
      check_sam_web
      first = ops_confirm(OFFICE, NOS::FACTORY)
      before = ops_state.deep_dup
      again = ops_confirm(OFFICE, NOS::FACTORY)
      assert_equal true, again['already']
      assert_equal first['finding'], again['finding']
      assert_equal before, ops_state
      assert_equal 1, rows('finding_confirmed').length
    end

    test 'a confirm of an invented finding, one never checked, or a service not scanned is the one 404' do
      check_sam_web
      [NOS::SPOOL, 'sam_pc.web.nope', 'made_up', NOS::FACTORY.upcase, 'sam_pc.web'].each do |id|
        ops_confirm(OFFICE, id)
        assert_response :not_found
        assert_equal NOT_FOUND, response.parsed_body, id
      end
      first_body = response.body
      ops_confirm('jack_not_held', NOS::FACTORY)
      assert_equal NOT_FOUND, response.parsed_body
      assert_equal first_body, response.body, 'the same bytes as the other 404s'
      assert_equal [], rows('finding_confirmed')
    end

    test 'a finding is only listed on its host row after the check, with no findings key before it' do
      assert_nil row_findings('sam_pc'), 'scanned, not checked'
      refute view_hosts.find { |h| h['id'] == 'sam_pc' }.key?('findings')
      check_sam_web
      assert_equal 4, row_findings('sam_pc').length
      assert_nil row_findings('print_srv'), 'a host never scanned'
      sweep_and_scan('print_srv')
      refute view_hosts.find { |h| h['id'] == 'print_srv' }.key?('findings'), 'scanned with no finding held'
      ops_check(OFFICE, host_id: 'sam_pc', service: 'files')
      assert_equal 4, row_findings('sam_pc').length
    end

    test 'findings on a host row are in finding id order and carry the stored status' do
      check_sam_web
      ops_confirm(OFFICE, NOS::OPEN_LISTING)
      listed = row_findings('sam_pc')
      assert_equal [NOS::FACTORY, NOS::OLD_BANNER, NOS::OPEN_LISTING, NOS::SIDE_ENTRY], listed.map { |f| f['id'] }
      assert_equal %w[unconfirmed unconfirmed confirmed unconfirmed], listed.map { |f| f['status'] }
    end

    # ---- fixed ---------------------------------------------------------------------------------

    test 'a weakness whose fixedIf holds is left out of a check, and a fixed one confirmed carries fixed' do
      findings_game(patched: true)
      sweep_and_scan('sam_pc')
      body = check_sam_web
      assert_equal 3, body['findings'].length
      refute_includes body['findings'].map { |f| f['id'] }, NOS::FACTORY
      # now held and unconfirmed: patch later
      findings_game
      sweep_and_scan('sam_pc')
      check_sam_web
      set_global(NOS::PATCHED_GLOBAL, true)
      unconfirmed = row_findings('sam_pc').find { |f| f['id'] == NOS::FACTORY }
      assert_equal UNCONFIRMED_KEYS, unconfirmed.keys, 'an unconfirmed finding of a fixed weakness shows nothing about it'
      confirmed = ops_confirm(OFFICE, NOS::FACTORY)['finding']
      assert_equal 'confirmed', confirmed['status']
      assert_equal true, confirmed['fixed']
      assert_equal true, row_findings('sam_pc').find { |f| f['id'] == NOS::FACTORY }['fixed']
      set_global(NOS::PATCHED_GLOBAL, false)
      refute row_findings('sam_pc').find { |f| f['id'] == NOS::FACTORY }.key?('fixed'), 'fixed is computed on each read'
    end

    test 'an unconfirmed finding of a fixed weakness has the keys of a decoy' do
      check_sam_web
      set_global(NOS::PATCHED_GLOBAL, true)
      listed = row_findings('sam_pc')
      assert_equal listed.find { |f| f['id'] == NOS::OLD_BANNER }.keys, listed.find { |f| f['id'] == NOS::FACTORY }.keys
    end

    # ---- needs ---------------------------------------------------------------------------------

    test 'a confirmed finding lists its needs with a label and met, never a global name' do
      check_sam_web
      factory = ops_confirm(OFFICE, NOS::FACTORY)['finding']
      assert_equal [{ 'kind' => 'credential', 'label' => NOS::LENA_LABEL, 'met' => false },
                    { 'kind' => 'item', 'label' => NOS::MANUAL_NAME, 'met' => false }], factory['needs']
      door = ops_confirm(OFFICE, NOS::SIDE_ENTRY)['finding']
      assert_equal [{ 'kind' => 'global', 'label' => NOS::DOOR_LABEL, 'met' => false }], door['needs']
      refute_includes response.body, NOS::DOOR_GLOBAL
      refute_includes row_findings('sam_pc').to_json, NOS::DOOR_GLOBAL
      refute_includes row_findings('sam_pc').to_json, NOS::PATCHED_GLOBAL
    end

    test 'a confirmed weakness with no needs carries an empty list, an unconfirmed one no needs key' do
      sweep_and_scan('print_srv')
      ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
      assert_equal [NOS::SPOOL], row_findings('print_srv').map { |f| f['id'] }
      refute row_findings('print_srv').first.key?('needs')
      assert_equal [], ops_confirm(OFFICE, NOS::SPOOL)['finding']['needs']
    end

    test 'met is recomputed on each read as an item is picked up, a credential earned and a global set' do
      check_sam_web
      ops_confirm(OFFICE, NOS::FACTORY)
      ops_confirm(OFFICE, NOS::SIDE_ENTRY)
      needs = -> { row_findings('sam_pc').to_h { |f| [f['id'], f['needs']&.map { |n| n['met'] }] } }
      assert_equal [false, false], needs.call[NOS::FACTORY]
      add_item('notes', 'panel_sheet', NOS::MANUAL_NAME)
      assert_equal [false, true], needs.call[NOS::FACTORY]
      pivot_through_lena
      assert_equal [true, true], needs.call[NOS::FACTORY]
      assert_equal [false], needs.call[NOS::SIDE_ENTRY]
      set_global(NOS::DOOR_GLOBAL, true)
      assert_equal [true], needs.call[NOS::SIDE_ENTRY]
      set_global(NOS::DOOR_GLOBAL, false)
      assert_equal [false], needs.call[NOS::SIDE_ENTRY]
    end

    test 'an itemType need is met only by an unforged held item whose id is an authored item of that type' do
      check_sam_web
      ops_confirm(OFFICE, NOS::OPEN_LISTING)
      met = -> { row_findings('sam_pc').find { |f| f['id'] == NOS::OPEN_LISTING }['needs'] }
      assert_equal [{ 'kind' => 'itemType', 'label' => NOS::NOTES_LABEL, 'met' => false }], met.call
      add_item('notes', 'invented_notes', 'Invented notes') # an id that is no authored item
      assert_equal false, met.call.first['met']
      add_item('notes', 'loose_notes', 'Loose notes')
      assert_equal true, met.call.first['met']
    end

    # An inventory entry the client wrote itself carries the clientAdded marker; it can never meet a need.
    def hold_forged(id, type)
      game = BreakEscape::Game.find(@game.id)
      game.player_state['inventory'] = Array(game.player_state['inventory']) + [{ 'id' => id, 'type' => type, 'name' => id, 'clientAdded' => true }]
      game.save!
    end

    test 'a forged inventory entry with the authored id and type does not meet an item need' do
      check_sam_web
      ops_confirm(OFFICE, NOS::FACTORY)
      item = -> { row_findings('sam_pc').find { |f| f['id'] == NOS::FACTORY }['needs'].find { |n| n['kind'] == 'item' } }
      hold_forged('panel_sheet', 'notes')
      assert_equal false, item.call['met']
    end

    test 'a forged inventory entry with an authored id and type does not meet an itemType need' do
      check_sam_web
      ops_confirm(OFFICE, NOS::OPEN_LISTING)
      met = -> { row_findings('sam_pc').find { |f| f['id'] == NOS::OPEN_LISTING }['needs'].first['met'] }
      hold_forged('loose_notes', 'notes')
      assert_equal false, met.call
    end

    test 'a credential need is met by the keyring own rule: a credential whose account names no one is never met' do
      data = NOS.findings_scenario
      data['credentials']['lena_login']['account'] = 'nobody_here'
      hold_office_foothold({}, data)
      sweep_and_scan('sam_pc')
      check_sam_web
      pivot_through_lena
      need = ops_confirm(OFFICE, NOS::FACTORY)['finding']['needs'].find { |n| n['kind'] == 'credential' }
      assert_equal false, need['met'], 'the proof holds but the keyring would list nothing'
    end

    test 'a credential need is met once the keyring lists the credential' do
      check_sam_web
      pivot_through_lena
      get game_path('keyring'), as: :json
      assert_includes response.body, 'lena_login'
      need = ops_confirm(OFFICE, NOS::FACTORY)['finding']['needs'].find { |n| n['kind'] == 'credential' }
      assert_equal true, need['met']
    end

    test 'a technique_card itemType need stays in the list and is never met' do
      data = NOS.findings_scenario
      web = data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['services'].find { |svc| svc['name'] == 'web' }
      web['weaknesses'].find { |w| w['id'] == 'open_listing' }['needs'] = { 'itemType' => 'technique_card', 'label' => NOS::NOTES_LABEL }
      hold_office_foothold({}, data)
      sweep_and_scan('sam_pc')
      check_sam_web
      assert_equal [{ 'kind' => 'itemType', 'label' => NOS::NOTES_LABEL, 'met' => false }],
                   ops_confirm(OFFICE, NOS::OPEN_LISTING)['finding']['needs']
      add_item('notes', 'loose_notes', 'Loose notes')
      assert_equal false, row_findings('sam_pc').find { |f| f['id'] == NOS::OPEN_LISTING }['needs'].first['met']
    end

    test 'an itemType need is not met by an authored item of another type, or by a name' do
      check_sam_web
      ops_confirm(OFFICE, NOS::OPEN_LISTING)
      add_item('text_file', 'lena_local', 'Loose notes') # named like the notes, of another type
      assert_equal false, row_findings('sam_pc').find { |f| f['id'] == NOS::OPEN_LISTING }['needs'].first['met']
    end

    test 'an item need is met by id, never by display name' do
      check_sam_web
      ops_confirm(OFFICE, NOS::FACTORY)
      add_item('notes', 'sneaky_copy', NOS::MANUAL_NAME) # the right name, not the authored id
      item = row_findings('sam_pc').find { |f| f['id'] == NOS::FACTORY }['needs'].find { |n| n['kind'] == 'item' }
      assert_equal false, item['met']
    end

    # ---- log -----------------------------------------------------------------------------------

    test 'the service_checked row names the service and the host, with no as and no limit' do
      check_sam_web
      row = rows('service_checked').first
      assert_equal({ 'kind' => 'pc', 'id' => 'sam_pc' }, row['where'])
      assert_equal({ 'service' => 'web' }, row['detail'])
      assert_nil row['as']
      assert_equal 'ok', row['result']
    end

    def service_cells
      Game.find(@game.id).log_rows_for_client('ops')[:rows].select { |r| r[:event] == 'SVC_CHECK' }.map { |r| r[:detail] }
    end

    test 'a service row shows its authored label when the hosts agree on it, else the kind word once, never the name' do
      data = NOS.findings_scenario
      sam = data['rooms'].values.flat_map { |r| r['objects'] }.find { |o| o['id'] == 'sam_pc' }
      sam['services'].find { |svc| svc['name'] == 'files' }['label'] = 'Quill file share'
      hold_office_foothold({}, data)
      sweep_and_scan('sam_pc')
      ops_check(OFFICE, host_id: 'sam_pc', service: 'files') # one host, labelled
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')   # labelled here, not on another host
      assert_equal ['service: Quill file share', 'service'], service_cells
      refute_match(/\bfiles\b|\bweb\b/, service_cells.join(' '))
    end

    test 'the rows of a device host use the host kind' do
      sweep_and_scan('print_srv')
      ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
      assert_equal({ 'kind' => 'host', 'id' => 'print_srv' }, rows('service_checked').last['where'])
    end

    test 'no row is written for a scenario with no logSources, and the routes still answer' do
      findings_game_unlogged = ops_findings_scenario(logged: false)
      hold_office_foothold({}, findings_game_unlogged)
      sweep_and_scan('sam_pc')
      body = check_sam_web
      assert_equal 4, body['findings'].length
      ops_confirm(OFFICE, NOS::FACTORY)
      assert_response :success
      assert_equal [], ops_rows
    end
  end
end
