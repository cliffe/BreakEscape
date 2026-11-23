require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S3 (OPS_CORE_PLAN.md sections 5.4, 6, 7 and 13): POST /network/technique and
  # use_technique!, driven through the real routes on the S3 fixture
  # (NetworkOpsScenario.techniques_scenario). The hostile and free tests are other files.
  class NetworkTechniqueTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    SECOND = NetworkOpsScenario::SECOND_JACK
    NOS = NetworkOpsScenario
    LOG_KEYS = %w[opsLog opsLogSeq opsLogSaves].freeze
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze
    BAD_REQUEST = { 'success' => false, 'reason' => 'bad_request' }.freeze

    SERVICE_OF = { 'files' => %w[gated step_up step_admin needy], 'mail' => %w[sheet_gated raw_one swap_in token_gated invite_gated] }.freeze

    # The finding id of a weakness or decoy of sam_pc (web unless the fixture puts it on files or mail).
    def fid(id)
      service = SERVICE_OF.find { |_name, ids| ids.include?(id) }&.first || 'web'
      "sam_pc.#{service}.#{id}"
    end

    def rows(event)
      ops_rows.select { |row| row['event'] == event }
    end

    def session_at(pc_id)
      ops_state['sessions']&.[](pc_id)
    end

    def refused(finding_id, item_id, reason, status: :unprocessable_entity, foothold: OFFICE)
      body = ops_technique(foothold, finding_id, item_id)
      assert_response status, response.body
      assert_equal false, body['success']
      assert_equal reason, body['reason']
      body
    end

    # What a refusal must leave alone: everything the player's state holds but the log.
    def state_without_log
      ops_state.except(*LOG_KEYS)
    end

    # ---- the 400 and the two 404s ---------------------------------------------------------------

    test 'a missing, non-string, empty or over-long parameter is one 400 with no row' do
      techniques_game
      before = state_without_log
      full = { foothold: OFFICE, finding_id: fid('factory_login'), item_id: 'card_factory' }
      bad = [{ foothold: nil }, { finding_id: nil }, { item_id: nil }, { foothold: '' }, { item_id: 'x' * 201 },
             { finding_id: %w[a] }, { item_id: { a: 1 } }, { foothold: 7 }]
      bad.each do |change|
        post game_path('network/technique'), params: full.merge(change), as: :json
        assert_response :bad_request, change.inspect
        assert_equal BAD_REQUEST, response.parsed_body
      end
      assert_empty rows('technique_refused')
      assert_equal before, state_without_log
    end

    test 'every earned-nothing request is the one 404 with no row, no save and no state change' do
      techniques_game(cards: %w[card_factory card_ghost panel_sheet])
      forged = card_entry('card_build', 'clientAdded' => true)
      game = Game.find(@game.id)
      game.player_state['inventory'] << forged
      game.save!
      stamp = Game.find(@game.id).updated_at
      before = state_without_log
      cases = [
        [OFFICE, 'sam_pc.web.invented', 'card_factory'],          # an invented finding id
        [OFFICE, 'sam_pc.web.nothing', 'card_factory'],           # an id of the form, never made
        [OFFICE, 'sam_pc.files.factory_login', 'card_factory'],   # a service with no such finding
        ['jack_nothing', fid('factory_login'), 'card_factory'],   # a foothold not held
        [SECOND, fid('factory_login'), 'card_factory'],           # a foothold not held (the second jack, unplanted)
        [OFFICE, fid('factory_login'), 'card_build'],             # a forged card
        [OFFICE, fid('factory_login'), 'card_listing'],           # a card not held
        [OFFICE, fid('factory_login'), 'card_ghost'],             # a held card naming no registry key
        [OFFICE, fid('factory_login'), 'panel_sheet'],            # a held item that is no card
        [OFFICE, fid('factory_login'), 'no_such_item'],           # an item that does not exist
        [OFFICE, "#{fid('factory_login')}x", 'card_factory']
      ]
      cases.each do |foothold, finding, item|
        body = ops_technique(foothold, finding, item)
        assert_response :not_found, [foothold, finding, item].inspect
        assert_equal NOT_FOUND, body
      end
      assert_empty rows('technique_refused')
      assert_empty rows('technique_used')
      assert_equal before, state_without_log
      assert_equal stamp, Game.find(@game.id).updated_at, 'a 404 saves nothing'
    end

    test 'a card named by an inventory copy but never on the scenario is not read from the copy' do
      techniques_game(cards: [])
      game = Game.find(@game.id)
      game.player_state['inventory'] << card_entry('card_factory', 'technique_card' => 'build_flaw')
      game.save!
      body = ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_response :success, response.body
      assert_equal true, body['success']
      assert_equal "#{fid('factory_login')}", session_at('sam_pc')['technique']
      assert_equal 'factory_accounts', rows('technique_used').first['detail']['technique'], 'the authored definition names the technique'
    end

    # ---- the 403 and the 422s, in order --------------------------------------------------------

    test 'a host that is off answers 403 not_responding with a refused row, before any status or match check' do
      techniques_game
      set_global('lab_off', true)
      body = refused('lab_box.web.lab_open', 'card_factory', 'not_responding', status: :forbidden)
      assert_equal %w[reason success], body.keys.sort
      row = rows('technique_refused').first
      assert_equal 'refused', row['result']
      assert_equal 'not_responding', row['detail']['reason']
      assert_equal 'host', row['where']['kind']
      assert_equal 'lab_box', row['where']['id']
      assert_equal 'factory_accounts', row['detail']['technique']
      assert_match(/\Af\d+\z/, row['detail']['finding'])
      refute_includes ops_state['opsUsed'].to_a, 'lab_box.web.lab_open'
    end

    test 'each refusal past the 404s names one code, writes one refused row and changes nothing else' do
      techniques_game(cards: %w[card_factory card_build card_wrongprod card_wrongver card_listing])
      set_global(NOS::PATCHED_GLOBAL, true)
      table = [
        [fid('raw_one'), 'card_factory', 'not_confirmed'],
        [fid('old_banner'), 'card_factory', 'false_positive'],
        [fid('quiet_leak'), 'card_listing', 'no_grant'],
        [fid('quiet_leak'), 'card_factory', 'no_grant'],
        [fid('patched_one'), 'card_factory', 'fixed'],
        [fid('patched_one'), 'card_build', 'fixed'],
        [fid('old_build'), 'card_factory', 'wrong_class'],
        [fid('old_build'), 'card_wrongprod', 'wrong_product'],
        [fid('old_build'), 'card_wrongver', 'wrong_version']
      ]
      before = state_without_log
      table.each do |finding, card, reason|
        body = refused(finding, card, reason)
        assert_equal %w[reason success], body.keys.sort, "#{reason} carries nothing else"
      end
      assert_equal before, state_without_log
      kept = rows('technique_refused')
      assert_equal table.size, kept.sum { |row| row['n'] || 1 }
      assert_equal(%w[not_confirmed false_positive no_grant fixed wrong_class wrong_product wrong_version],
                   kept.map { |row| row['detail']['reason'] }.uniq)
      assert(kept.all? { |row| row['where'] == { 'kind' => 'pc', 'id' => 'sam_pc' } })
      assert_empty rows('technique_used')
    end

    test 'a refusal merges into one row with a count and saves only while the helper stores it' do
      techniques_game
      12.times { refused(fid('old_build'), 'card_factory', 'wrong_class') }
      kept = rows('technique_refused')
      assert_equal 1, kept.size
      assert_equal 10, kept.first['n'], 'the row stops growing at ten'
    end

    test 'a need not met is need_unmet with its kind and label, the first unmet in order' do
      techniques_game(cards: %w[card_factory])
      body = refused(fid('gated'), 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'global', 'label' => NOS::DOOR_LABEL }, body['need'])
      assert_equal %w[need reason success], body.keys.sort
      body = refused(fid('needy'), 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'credential', 'label' => NOS::LENA_LABEL }, body['need'], 'credential comes before item')
      body = refused(fid('sheet_gated'), 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'item', 'label' => NOS::MANUAL_NAME }, body['need'])
      body = refused(fid('step_up'), 'card_factory', 'need_unmet')
      assert_equal 'session', body['need']['kind']
      assert_equal 'HB-DESK-01', body['need']['label']
      assert_empty ops_state['sessions'].to_h
    end

    test 'the need predicate and the finding row agree: a met need is ticked and the use proceeds' do
      techniques_game(cards: %w[card_factory], state: {})
      set_global(NOS::DOOR_GLOBAL, true)
      assert_equal false, ops_confirm(OFFICE, fid('step_up'))['finding']['needs'].first['met']
      body = ops_technique(OFFICE, fid('gated'), 'card_factory')
      assert_response :success, response.body
      assert_equal 'session', body['grant']
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_equal true, ops_confirm(OFFICE, fid('step_up'))['finding']['needs'].first['met']
    end

    # ---- the grants ----------------------------------------------------------------------------

    test 'a session grant writes the technique record, signedInPcs, opsUsed and one technique_used row' do
      techniques_game
      body = ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_response :success, response.body
      assert_equal true, body['success']
      assert_equal 'session', body['grant']
      assert_nil body['already']
      assert_nil body['keyringChanged']
      assert_nil body['endedPcIds']
      assert_equal 'technique', body['session']['via']
      assert_equal true, body['session']['remote']
      assert_equal OFFICE, body['session']['footholdId']
      assert_equal 'HB-DESK-01', body['session']['host']
      assert_equal 'sam', body['session']['npcId']
      assert_nil body['session']['access'], 'a user session carries no access key'
      assert_equal({ 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'user', 'technique' => fid('factory_login') },
                   session_at('sam_pc'))
      assert_includes ops_state['signedInPcs'], 'sam_pc'
      assert_equal [fid('factory_login')], ops_state['opsUsed']
      used = rows('technique_used')
      assert_equal 1, used.size
      assert_equal 'ok', used.first['result']
      assert_equal 'session', used.first['detail']['grant']
      assert_equal 'user', used.first['detail']['access']
      assert_equal 'factory_accounts', used.first['detail']['technique']
      assert_equal({ 'kind' => 'pc', 'id' => 'sam_pc' }, used.first['where'])
      assert_equal 'sokafor', used.first['as']['account']
      assert_empty rows('technique_refused')
    end

    test 'a repeat of a session grant answers already with the live session and changes no state' do
      techniques_game
      first = ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      state = ops_state.except(*LOG_KEYS)
      again = ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_response :success, response.body
      assert_equal true, again['already']
      assert_equal first['session'], again['session']
      assert_equal 'session', again['grant']
      assert_equal state, ops_state.except(*LOG_KEYS)
      assert_equal [fid('factory_login')], ops_state['opsUsed']
      used = rows('technique_used')
      assert_equal 1, used.size, 'the repeat merges into the row'
      assert_equal 2, used.first['n']
    end

    test 'a repeat is tested after the card, the reach and the host: a dropped card or an off host is refused' do
      techniques_game(cards: %w[card_factory], second: false)
      ops_technique(OFFICE, 'lab_box.web.lab_open', 'card_factory')
      set_global('lab_off', true)
      refused('lab_box.web.lab_open', 'card_factory', 'not_responding', status: :forbidden)
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      game = Game.find(@game.id)
      game.player_state['inventory'] = []
      game.save!
      assert_equal NOT_FOUND, ops_technique(OFFICE, fid('factory_login'), 'card_factory')
    end

    test 'a credential grant adds the finding id to opsUsed once, answers keyringChanged and shows in the keyring' do
      techniques_game
      get game_path('keyring'), as: :json
      refute_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
      body = ops_technique(OFFICE, NOS::SPOOL, 'card_factory')
      assert_response :success, response.body
      assert_equal({ 'success' => true, 'grant' => 'credential', 'keyringChanged' => true }, body)
      assert_equal [NOS::SPOOL], ops_state['opsUsed']
      get game_path('keyring'), as: :json
      assert_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
      used = rows('technique_used').first
      assert_equal 'credential', used['detail']['grant']
      assert_nil used['detail']['access']
      assert_nil used['as']
      assert_equal({ 'kind' => 'host', 'id' => 'print_srv' }, used['where'])
      again = ops_technique(OFFICE, NOS::SPOOL, 'card_factory')
      assert_equal({ 'success' => true, 'already' => true, 'grant' => 'credential', 'keyringChanged' => false }, again)
      assert_equal [NOS::SPOOL], ops_state['opsUsed']
      assert_equal 1, rows('technique_used').size
      assert_equal 2, rows('technique_used').first['n']
    end

    test 'the keyring proof holds only through the server-owned opsUsed, not a sync body' do
      techniques_game
      put game_path('sync_state'), params: { globalVariables: { opsUsed: [NOS::SPOOL] }, opsUsed: [NOS::SPOOL] }, as: :json
      assert_response :success, response.body
      assert_equal [], ops_state['opsUsed']
      get game_path('keyring'), as: :json
      refute_includes response.parsed_body['entries'].map { |e| e['id'] }, 'print_admin'
    end

    # ---- sessions: the step up, footholds, a session that ended ---------------------------------

    test 'the step up replaces a technique session in place and keeps its foothold, with access admin shown everywhere' do
      techniques_game
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      body = refused(fid('step_admin'), 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'session', 'label' => 'HB-DESK-01' }, body['need'])
      body = ops_technique(OFFICE, fid('step_up'), 'card_factory')
      assert_response :success, response.body
      assert_equal 'admin', body['session']['access']
      record = session_at('sam_pc')
      assert_equal({ 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'admin', 'technique' => fid('step_up') }, record)
      assert_equal 1, ops_state['sessions'].size
      assert_equal 'admin', rows('technique_used').last['detail']['access']
      reload = bootstrap_scenario
      assert_equal 'admin', reload['sessions']['sam_pc']['access']
      row = view_hosts.find { |h| h['id'] == 'sam_pc' }
      assert_equal 'admin', row['session']['access']
      assert_equal 'technique', row['session']['via']
      step = ops_technique(OFFICE, fid('step_admin'), 'card_factory')
      assert_response :success, response.body
      assert_equal 'admin', step['session']['access']
    end

    test 'the step up from a password session at user replaces it and keeps the foothold' do
      techniques_game
      answer = sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      assert_nil answer['access'], 'a password session carries no access key'
      assert_equal({ 'id' => 'sam', 'via' => 'password', 'foothold' => OFFICE }, session_at('sam_pc'))
      body = ops_technique(OFFICE, fid('step_up'), 'card_factory')
      assert_response :success, response.body
      assert_equal 'admin', body['session']['access']
      assert_equal 'technique', session_at('sam_pc')['via']
      assert_equal OFFICE, session_at('sam_pc')['foothold']
      assert_equal 'admin', session_at('sam_pc')['access']
    end

    test 'only a technique session can feed a step up that needs admin' do
      techniques_game
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      body = refused(fid('step_admin'), 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'session', 'label' => 'HB-DESK-01' }, body['need'])
    end

    test 'a locked session does not meet a session need' do
      techniques_game
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      game = Game.find(@game.id)
      game.player_state['sessions']['sam_pc']['locked'] = true
      game.save!
      body = refused(fid('step_up'), 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'session', 'label' => 'HB-DESK-01' }, body['need'])
    end

    test 'a use through a second foothold is a new use that moves the session' do
      techniques_game(second: true)
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_equal OFFICE, session_at('sam_pc')['foothold']
      body = ops_technique(SECOND, fid('factory_login'), 'card_factory')
      assert_response :success, response.body
      assert_nil body['already'], 'another foothold is not a repeat'
      assert_equal SECOND, body['session']['footholdId']
      assert_equal SECOND, session_at('sam_pc')['foothold']
      assert_equal [fid('factory_login')], ops_state['opsUsed'], 'opsUsed holds the finding once'
      assert_equal 2, rows('technique_used').sum { |row| row['n'] || 1 }
      again = ops_technique(SECOND, fid('factory_login'), 'card_factory')
      assert_equal true, again['already']
    end

    test 'the second foothold runs every check: a refusal there is the refusal as ever' do
      techniques_game(second: true)
      body = refused(fid('step_up'), 'card_factory', 'need_unmet', foothold: SECOND)
      assert_equal({ 'kind' => 'session', 'label' => 'HB-DESK-01' }, body['need'])
    end

    test 'a grant again after the session ended is a new grant with its own use' do
      techniques_game
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_equal 'password', session_at('sam_pc')['via']
      body = ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_nil body['already']
      assert_equal 'technique', session_at('sam_pc')['via']
      assert_equal [fid('factory_login')], ops_state['opsUsed']
    end

    test 'a different account at the PC replaces the session and ends the sessions opened from it' do
      data = NOS.techniques_scenario
      mail = data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['services'].find { |svc| svc['name'] == 'mail' }
      mail['weaknesses'] << NOS.weak('swap_in', 'default_creds', 'low', 'grants' => { 'session' => { 'account' => 'ian', 'access' => 'user' } })
      techniques_game(data: data)
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      post game_path('login'), params: { pc_id: 'lena_pc', username: 'lfox', password: NetworkModelScenario::LENA_PASSWORD, from: 'sam_pc' }, as: :json
      assert_response :success, response.body
      assert_equal 'sam_pc', session_at('lena_pc')['from']
      ops_confirm(OFFICE, fid('swap_in'))
      body = ops_technique(OFFICE, fid('swap_in'), 'card_factory')
      assert_response :success, response.body
      assert_equal ['lena_pc'], body['endedPcIds']
      assert_nil session_at('lena_pc')
      assert_equal 'ishaw', body['session']['username']
    end

    # ---- the need order, itemType, no_grant before fixed, the alias on the rows (S3 server R1 m5 to m7) ----

    ORDER_ITEM = { 'id' => 'panel_sheet', 'type' => 'notes', 'name' => NOS::MANUAL_NAME, 'takeable' => true, 'text' => 'Panel sheet.' }.freeze

    # sam_pc gains a `chat` service: `ordered` needs a credential, an item, a session and a global (all unmet);
    # `typed` needs an itemType; `typed_card` needs the technique_card itemType; `quiet_fixed` grants nothing and
    # has a fixedIf.
    def ordered_scenario
      data = NOS.techniques_scenario
      sam = data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['services']
      sam << NOS.service('chat', 8000)
      sam.last['weaknesses'] = [
        NOS.weak('ordered', 'default_creds', 'low', 'grants' => NOS.sam_grant,
                                                    'needs' => { 'credential' => 'lena_login', 'item' => 'panel_sheet', 'session' => 'user',
                                                                 'global' => NOS::DOOR_GLOBAL, 'label' => NOS::DOOR_LABEL }),
        NOS.weak('typed', 'default_creds', 'low', 'grants' => NOS.sam_grant, 'needs' => { 'itemType' => 'notes', 'label' => NOS::NOTES_LABEL }),
        NOS.weak('typed_card', 'default_creds', 'low', 'grants' => NOS.sam_grant, 'needs' => { 'itemType' => 'technique_card', 'label' => 'A field note' }),
        NOS.weak('quiet_fixed', 'misconfig', 'low', 'fixedIf' => NOS::PATCHED_GLOBAL)
      ]
      data
    end

    def ordered_game(state: {})
      techniques_game(data: ordered_scenario, state: state)
      ops_check(OFFICE, host_id: 'sam_pc', service: 'chat')
      %w[ordered typed typed_card quiet_fixed].each { |id| ops_confirm(OFFICE, "sam_pc.chat.#{id}") }
    end

    def hold_item(item)
      game = Game.find(@game.id)
      game.player_state['inventory'] << item.dup
      game.save!
    end

    test 'the needs are met and refused in the order credential, item, session, global' do
      ordered_game
      id = 'sam_pc.chat.ordered'
      assert_equal 'credential', refused(id, 'card_factory', 'need_unmet')['need']['kind']
      pivot_through_lena
      assert_equal 'item', refused(id, 'card_factory', 'need_unmet')['need']['kind']
      hold_item(ORDER_ITEM)
      body = refused(id, 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'session', 'label' => 'HB-DESK-01' }, body['need'])
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      body = refused(id, 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'global', 'label' => NOS::DOOR_LABEL }, body['need'])
      assert_empty rows('technique_used')
      set_global(NOS::DOOR_GLOBAL, true)
      ops_technique(OFFICE, id, 'card_factory')
      assert_response :success, response.body
      assert_equal [id], ops_state['opsUsed']
    end

    test 'an itemType need is refused, then met by a held item of that type; a card never meets it' do
      ordered_game
      id = 'sam_pc.chat.typed'
      body = refused(id, 'card_factory', 'need_unmet')
      assert_equal({ 'kind' => 'itemType', 'label' => NOS::NOTES_LABEL }, body['need'])
      assert_equal false, need_met(id, 'itemType')
      hold_item(ORDER_ITEM)
      assert_equal true, need_met(id, 'itemType')
      ops_technique(OFFICE, id, 'card_factory')
      assert_response :success, response.body
      assert_equal 'session', response.parsed_body['grant']
      body = refused('sam_pc.chat.typed_card', 'card_factory', 'need_unmet')
      assert_equal 'itemType', body['need']['kind']
      assert_equal false, need_met('sam_pc.chat.typed_card', 'itemType'), 'a card held does not meet a technique_card itemType need'
    end

    test 'a finding with no grants and a fixedIf is no_grant, before fixed, once the fixedIf is true' do
      ordered_game
      set_global(NOS::PATCHED_GLOBAL, true)
      before = state_without_log
      body = refused('sam_pc.chat.quiet_fixed', 'card_factory', 'no_grant')
      assert_equal %w[reason success], body.keys.sort
      assert_equal before, state_without_log
      assert_equal 'no_grant', rows('technique_refused').last['detail']['reason']
    end

    test 'rows carry the f<n> alias and never the long finding id, on a refusal, a grant and a repeat' do
      techniques_game
      refused(fid('old_build'), 'card_factory', 'wrong_class')
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      refusal = rows('technique_refused').first
      grant = rows('technique_used').first
      assert_equal 2, grant['n']
      [refusal, grant].each { |row| assert_match(/\Af\d+\z/, row['detail']['finding']) }
      refute_equal refusal['detail']['finding'], grant['detail']['finding']
      log = ops_state.slice(*LOG_KEYS).to_json
      [fid('old_build'), fid('factory_login'), 'factory_login', 'old_build'].each { |text| refute_includes log, text }
    end

    # ---- a need is met only by a LIVE session or a still-usable credential (S3 server R1 M1) -----

    LIVE_T0 = Time.utc(2026, 11, 23, 9, 0, 0)

    teardown { travel_back }

    # The S3 fixture plus a token and an assist invite for Sam's PC, and two weaknesses on the mail service
    # whose only need is each credential.
    def live_need_scenario
      data = NOS.techniques_scenario
      data['credentials']['sam_token'] = { 'kind' => 'token', 'account' => 'sam', 'connectsTo' => 'sam_pc', 'label' => 'Sam token',
                                           'proof' => { 'foothold' => OFFICE }, 'expiresMin' => 4 }
      data['credentials']['sam_assist'] = { 'kind' => 'assist_invite', 'account' => 'sam', 'connectsTo' => 'sam_pc', 'label' => 'Sam assist',
                                            'proof' => { 'held' => 'sam_assist_code' } }
      data['rooms']['lobby']['objects'] << { 'id' => 'sam_assist_code', 'type' => 'text_file', 'name' => 'Assist code', 'takeable' => true,
                                             'credential' => 'sam_assist', 'text' => 'Assist code.' }
      mail = data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['services'].find { |svc| svc['name'] == 'mail' }
      mail['weaknesses'] += [NOS.weak('token_gated', 'default_creds', 'low', 'grants' => NOS.sam_grant, 'needs' => { 'credential' => 'sam_token' }),
                             NOS.weak('invite_gated', 'default_creds', 'low', 'grants' => NOS.sam_grant, 'needs' => { 'credential' => 'sam_assist' })]
      data
    end

    def live_game(state: {})
      travel_to LIVE_T0
      held = { 'id' => 'sam_assist_code', 'type' => 'text_file', 'name' => 'Assist code', 'takeable' => true, 'credential' => 'sam_assist', 'text' => 'Assist code.' }
      techniques_game(data: live_need_scenario, state: { 'inventory' => [card_entry('card_factory'), held] }.merge(state))
    end

    def need_met(finding_id, kind)
      body = ops_confirm(OFFICE, finding_id)
      flunk body.inspect unless body['finding']
      body['finding']['needs'].find { |need| need['kind'] == kind }['met']
    end

    def token_sign_in
      post game_path('login'), params: { pc_id: 'sam_pc', credential: 'sam_token', foothold: OFFICE }, as: :json
      assert_response :success, response.body
    end

    def assert_need_unmet(finding_id, kind)
      before = state_without_log
      body = refused(finding_id, 'card_factory', 'need_unmet')
      assert_equal kind, body['need']['kind']
      assert_equal before, state_without_log, 'a refused step up changes nothing'
      assert_equal false, need_met(finding_id, kind), 'the row tick agrees with the refusal'
    end

    test 'an expired token session at the PC does not meet a session need; a live one does' do
      live_game
      token_sign_in
      assert_equal 'credential', session_at('sam_pc')['via']
      assert_equal true, need_met(fid('step_up'), 'session'), 'a live token session meets the need'
      travel 5.minutes
      assert_need_unmet(fid('step_up'), 'session')
      assert_equal 'credential', session_at('sam_pc')['via'], 'the expired record is still in the slot'
      assert_empty rows('technique_used')
    end

    test 'a live token session feeds the step up, which then grants the lasting admin technique session' do
      live_game
      token_sign_in
      body = ops_technique(OFFICE, fid('step_up'), 'card_factory')
      assert_response :success, response.body
      assert_equal 'admin', body['session']['access']
      assert_equal 'technique', session_at('sam_pc')['via']
    end

    test 'a relay record at the PC does not meet a session need; a live session does' do
      live_game
      post game_path('login'), params: { pc_id: 'sam_pc', credential: 'sam_assist', relay: true }, as: :json
      assert_response :success, response.body
      assert_equal true, session_at('sam_pc')['relay']
      assert_need_unmet(fid('step_up'), 'session')
      sign_in('sam_pc', 'sokafor', NetworkModelScenario::SAM_PASSWORD, foothold: OFFICE)
      assert_equal true, need_met(fid('step_up'), 'session')
    end

    test 'an expired token does not meet a credential need; a live one does' do
      live_game
      assert_equal true, need_met(fid('token_gated'), 'credential')
      body = ops_technique(OFFICE, fid('token_gated'), 'card_factory')
      assert_response :success, response.body
      assert_equal true, body['success']
      travel 5.minutes
      game = Game.find(@game.id)
      game.player_state['opsUsed'] = []
      game.player_state['sessions'] = {}
      game.save!
      assert_need_unmet(fid('token_gated'), 'credential')
    end

    test 'an ended assist invite does not meet a credential need; a live one does' do
      live_game
      assert_equal true, need_met(fid('invite_gated'), 'credential')
      game = Game.find(@game.id)
      game.player_state['endedCredentials'] = ['sam_assist']
      game.save!
      assert_need_unmet(fid('invite_gated'), 'credential')
    end

    # ---- what reaches the browser ---------------------------------------------------------------

    test 'GET /network has no techniques key with no card held, and the exact body of a game with none' do
      techniques_game(cards: [])
      body = network_view
      assert_equal %w[footholds], body.keys
      techniques_game(cards: %w[card_ghost])
      assert_equal %w[footholds], network_view.keys, 'a card naming no registry key lists nothing'
    end

    test 'GET /network lists held cards with itemId, the first in id order, and nothing about a card not held' do
      techniques_game(cards: %w[card_factory_b card_factory card_build])
      body = network_view
      assert_equal %w[build_flaw factory_accounts], body['techniques'].keys
      factory = body['techniques']['factory_accounts']
      assert_equal %w[itemId name summary worksOn], factory.keys.sort
      assert_equal 'card_factory', factory['itemId']
      assert_equal 'Factory accounts', factory['name']
      assert_equal({ 'class' => 'default_creds' }, factory['worksOn'])
      assert_equal 'card_build', body['techniques']['build_flaw']['itemId']
      assert_equal %w[itemId name worksOn], body['techniques']['build_flaw'].keys.sort
      %w[other_product other_version listing_flaw unheld_flaw Elsewhere].each { |text| refute_includes body.to_json, text }
      assert_equal 'card_factory', network_view(OFFICE)['techniques']['factory_accounts']['itemId']
    end

    test 'worksOn is sent by its named keys only: an author note at either level never reaches GET /network' do
      data = NOS.techniques_scenario
      data['techniques']['build_flaw']['_note'] = 'NOTE-TOP'
      data['techniques']['build_flaw']['worksOn']['_note'] = 'NOTE-WORKS-ON'
      data['techniques']['build_flaw']['worksOn']['extra'] = 'EXTRA-KEY'
      techniques_game(cards: %w[card_build], data: data)
      body = network_view
      assert_equal({ 'class' => 'unpatched', 'product' => NOS::WEB_PRODUCT, 'versions' => [NOS::VERSION_SECRET] }, body['techniques']['build_flaw']['worksOn'])
      %w[NOTE-TOP NOTE-WORKS-ON EXTRA-KEY _note].each { |text| refute_includes body.to_json, text }
    end

    test 'a technique whose worksOn is not a Hash with a class is not listed' do
      data = NOS.techniques_scenario
      data['techniques']['build_flaw']['worksOn'] = 'nonsense'
      techniques_game(cards: %w[card_build card_factory], data: data)
      assert_equal %w[factory_accounts], network_view['techniques'].keys
    end

    test 'a forged card entry is never listed and never works' do
      techniques_game(cards: [])
      game = Game.find(@game.id)
      game.player_state['inventory'] << card_entry('card_factory', 'clientAdded' => true)
      game.save!
      assert_equal %w[footholds], network_view.keys
      assert_equal NOT_FOUND, ops_technique(OFFICE, fid('factory_login'), 'card_factory')
    end

    test 'neither the bootstrap nor a refusal carries a grant, an account or the registry before it is earned' do
      techniques_game
      body = refused(fid('old_build'), 'card_factory', 'wrong_class')
      text = bootstrap_scenario.to_json + body.to_json + response.body
      %w[techniques factory_accounts Factory\ accounts sokafor opsUsed grants].each { |word| refute_includes text, word }
    end

    # ---- no log source ---------------------------------------------------------------------------

    test 'with no log source a refusal writes no row and saves nothing, and a grant still saves' do
      data = NOS.techniques_scenario(logged: false)
      techniques_game(data: data)
      stamp = Game.find(@game.id).updated_at
      refused(fid('old_build'), 'card_factory', 'wrong_class')
      assert_equal stamp, Game.find(@game.id).updated_at
      assert_empty ops_rows
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_equal [fid('factory_login')], ops_state['opsUsed']
    end
  end
end
