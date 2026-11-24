require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S3 (OPS_CORE_PLAN.md 11.2, "network_technique_hostile_test"): forged and malformed requests
  # to POST /network/technique and the state a client must not be able to set. Every case goes through
  # the real routes on a game built from the S3 fixture (NetworkOpsScenario.techniques_scenario, with a
  # few extra weaknesses, cards and a down switch from #hostile_scenario). Each states the status, the
  # exact body, that no session, credential or state change resulted, and which log row, if any, was
  # written. The positive controls prove each refusal is the check and not a broken fixture.
  class NetworkTechniqueHostileTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    SECOND = NetworkOpsScenario::SECOND_JACK
    BENCH = NetworkOpsScenario::BENCH
    NOS = NetworkOpsScenario
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze
    NOT_FOUND_JSON = '{"success":false,"reason":"not_found"}'.freeze
    BAD_REQUEST = { 'success' => false, 'reason' => 'bad_request' }.freeze
    SERVER_KEYS = %w[opsUsed opsFindings opsDiscovered sessions signedInPcs footholds].freeze
    SERVICE_OF = { 'files' => %w[gated step_up step_admin needy], 'mail' => %w[sheet_gated raw_one patched_two raw_quiet] }.freeze
    ALL_CARDS = (NOS::TECH_CARDS.keys + %w[card_bothwrong card_prodver]).freeze

    # Counts Game#save! calls while switched on (the requests load their own Game), as network_scan_test does.
    module HostileSaveCounter
      class << self
        attr_accessor :on, :count
      end

      def save!(*args, **opts)
        HostileSaveCounter.count += 1 if HostileSaveCounter.on
        super
      end
    end
    Game.prepend(HostileSaveCounter)

    def saves_during
      HostileSaveCounter.count = 0
      HostileSaveCounter.on = true
      yield
      HostileSaveCounter.count
    ensure
      HostileSaveCounter.on = false
    end

    # ---- fixture and helpers ----------------------------------------------------------------------

    # The S3 fixture plus: two more cards (a class and product and version all wrong; a product and
    # version wrong), two more weaknesses on mail (a second fixedIf one, an unconfirmed one with no
    # grant), a credential-granting weakness on the workshop PC, and a switch that takes office_lan down.
    def hostile_scenario(**options)
      data = NOS.techniques_scenario(**options)
      objects = ->(room, id) { data['rooms'][room]['objects'].find { |o| o['id'] == id } }
      mail = objects.call('desk_room', 'sam_pc')['services'].find { |svc| svc['name'] == 'mail' }
      mail['weaknesses'] << NOS.weak('patched_two', 'default_creds', 'low', 'grants' => NOS.sam_grant, 'fixedIf' => NOS::PATCHED_GLOBAL)
      mail['weaknesses'] << NOS.weak('raw_quiet', 'misconfig', 'low')
      objects.call('workshop', 'bench_pc')['services'].first['weaknesses'] =
        [NOS.weak('bench_leak', 'default_creds', 'low', 'grants' => { 'credential' => 'print_admin' })]
      data['techniques']['both_wrong'] = { 'name' => 'Both wrong', 'worksOn' => { 'class' => 'weak_auth', 'product' => 'Elsewhere web', 'versions' => ['1.0'] } }
      data['techniques']['prod_ver'] = { 'name' => 'Prod ver', 'worksOn' => { 'class' => 'unpatched', 'product' => 'Elsewhere web', 'versions' => ['1.0'] } }
      data['rooms']['lobby']['objects'].push(
        { 'id' => 'card_bothwrong', 'type' => 'technique_card', 'name' => 'Field note both', 'technique_card' => 'both_wrong', 'takeable' => true },
        { 'id' => 'card_prodver', 'type' => 'technique_card', 'name' => 'Field note pv', 'technique_card' => 'prod_ver', 'takeable' => true }
      )
      data['networks']['office_lan']['offWhen'] = 'office_down'
      data['globalVariables']['office_down'] = false
      data
    end

    def hostile_game(cards: %w[card_factory], **options)
      techniques_game(cards: cards, data: hostile_scenario, **options)
    end

    def fid(id)
      service = SERVICE_OF.find { |_name, ids| ids.include?(id) }&.first || 'web'
      "sam_pc.#{service}.#{id}"
    end

    def log_free(state)
      state.reject { |key, _| key.start_with?('opsLog') }
    end

    def fingerprint
      { state: log_free(ops_state).deep_dup, rows: ops_rows.deep_dup, stamp: Game.find(@game.id).updated_at }
    end

    def rows(event)
      ops_rows.select { |row| row['event'] == event }
    end

    def edit_state
      game = Game.find(@game.id)
      yield game.player_state
      game.save!
    end

    def add_entries(*entries)
      edit_state { |state| state['inventory'] = Array(state['inventory']) + entries }
    end

    def set_status(finding_id, letter)
      edit_state { |state| state['opsFindings'][finding_id] = "#{letter}#{state['opsFindings'][finding_id][1..]}" }
    end

    def session_at(pc_id)
      ops_state['sessions']&.[](pc_id)
    end

    # A request the server answers with the one 404: exact status, exact bytes, and nothing else:
    # no state change, no log row, no save. Returns the raw body.
    def assert_not_found(foothold, finding, item, note = nil)
      before = fingerprint
      body = ops_technique(foothold, finding, item)
      assert_response :not_found, "#{note} #{[foothold, finding, item].inspect}"
      assert_equal NOT_FOUND, body, note
      assert_equal NOT_FOUND_JSON, response.body, note
      assert_equal before, fingerprint, "#{note}: a 404 changed state, a row or the saved copy"
      response.body
    end

    # A refusal past the 404s: status, code and the exact keys, with the state (the log aside) kept.
    def assert_refused(finding, item, reason, status: :unprocessable_entity, foothold: OFFICE, keys: %w[reason success])
      before = log_free(ops_state).deep_dup
      body = ops_technique(foothold, finding, item)
      assert_response status, response.body
      assert_equal false, body['success']
      assert_equal reason, body['reason']
      assert_equal keys, body.keys.sort
      assert_equal before, log_free(ops_state), "#{reason} changed state beyond the log"
      body
    end

    def assert_nothing_granted
      assert_equal [], Array(ops_state['opsUsed'])
      assert_empty ops_state['sessions'].to_h
      assert_empty Array(ops_state['signedInPcs'])
      assert_empty rows('technique_used')
    end

    def keyring_ids
      get game_path('keyring'), as: :json
      response.parsed_body['entries'].map { |entry| entry['id'] }
    end

    # ---- a card the player does not hold, and every forged stand-in ------------------------------

    test 'a card not held, a non-card, a forged or renamed entry and a card naming no technique are each the one 404' do
      hostile_game(cards: %w[card_factory card_ghost])
      add_entries(
        { 'id' => 'panel_sheet', 'type' => 'notes', 'name' => NOS::MANUAL_NAME, 'takeable' => true },
        card_entry('card_build', 'clientAdded' => true),
        card_entry('card_listing', 'type' => 'notes'),
        card_entry('invented_card', 'technique_card' => 'factory_accounts'),
        card_entry('zz_copy', 'name' => 'Field note card_wrongprod', 'technique_card' => 'other_product'),
        card_entry('panel_sheet', 'technique_card' => 'factory_accounts', 'type' => 'technique_card')
      )
      items = [
        'card_wrongprod',                 # an authored card the player does not hold
        'card_wrongver',
        'card_build',                     # held, but the entry carries the client-added marker
        'card_listing',                   # held, but its type is not the authored one
        'invented_card',                  # held, but no scenario item has this id
        'zz_copy',                        # a held entry named like a card the player does not hold
        'Field note card_wrongprod',      # a card named by its display name
        'panel_sheet',                    # a held item that is no card (and a copy that claims to be one)
        'card_ghost',                     # a held card whose authored technique is not in the registry
        'sam_pc', 'kit_dropbox_2',        # authored objects that are no cards
        'no_such_item', fid('factory_login'), OFFICE, 'CARD_FACTORY', ' card_factory', 'card_factory ', "card_factory\n", "card_factory\u0000"
      ]
      bodies = items.map { |item| assert_not_found(OFFICE, fid('factory_login'), item, 'card') }
      assert_equal [NOT_FOUND_JSON], bodies.uniq, 'one body for every card refusal'
      assert_nothing_granted
      assert_empty rows('technique_refused')
      # The control: the real card works on the same finding, so the 404s were the card checks.
      body = ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_response :success, response.body
      assert_equal 'session', body['grant']
      assert_equal [fid('factory_login')], ops_state['opsUsed']
    end

    test 'a held card whose inventory copy names another technique is judged by the authored definition' do
      hostile_game(cards: [])
      add_entries(card_entry('card_listing', 'technique_card' => 'factory_accounts'))
      assert_equal %w[listing_flaw], network_view['techniques'].keys, 'listed by the authored technique, not the copy'
      assert_refused(fid('factory_login'), 'card_listing', 'wrong_class')
      assert_nothing_granted
      row = rows('technique_refused').first
      assert_equal 'listing_flaw', row['detail']['technique']
      assert_equal 'wrong_class', row['detail']['reason']
      assert_equal 'refused', row['result']
    end

    test 'the inventory route cannot mint a card, and a minted one is neither listed nor usable' do
      hostile_game(cards: [])
      minted = [
        { id: 'invented_card', type: 'technique_card', name: 'Field note', technique_card: 'factory_accounts' },
        { id: 'invented_two', type: 'technique_card', name: 'Field note', technique_card: 'factory_accounts', clientAdded: false,
          scenarioData: { id: 'card_factory', type: 'technique_card', technique_card: 'factory_accounts' } }
      ]
      minted.each do |item|
        post game_path('inventory'), params: { action_type: 'add', item: item }, as: :json
        assert_response :unprocessable_entity, response.body
        assert_equal({ 'success' => false, 'message' => 'Item not found in scenario: technique_card' }, response.parsed_body)
      end
      assert_equal %w[footholds], network_view.keys, 'no card is listed'
      (minted.map { |item| item[:id] } + %w[card_factory card_build]).each do |item|
        assert_not_found(OFFICE, fid('factory_login'), item, 'minted')
      end
      assert_nothing_granted
    end

    # ---- findings ------------------------------------------------------------------------------

    def partial_game(checked: %w[web])
      state = { 'inventory' => %w[card_factory card_build].map { |id| card_entry(id) },
                'unlockedRooms' => NetworkRequests::OPEN_ROOMS + %w[server_room] }
      hold_office_foothold(state, hostile_scenario)
      sweep_and_scan('sam_pc', 'print_srv', 'lab_box')
      checked.each { |name| ops_check(OFFICE, host_id: 'sam_pc', service: name) }
    end

    test 'a finding the player does not hold, an invented id, an unchecked service and an alias are the one 404' do
      partial_game
      aliases = ops_state['opsFindings'].values
      assert_operator aliases.size, :>=, 4
      assert_match(/\A[ucf]\d+\z/, aliases.first)
      alias_ids = aliases.flat_map { |value| [value, "f#{value[1..]}", value[1..], "sam_pc.#{value}", "sam_pc.web.f#{value[1..]}"] }
      unearned = [
        fid('step_up'), fid('raw_one'),                        # real findings of services not checked
        NOS::SPOOL, 'lab_box.web.lab_open',                    # real findings of hosts scanned but not checked
        'bench_pc.web.bench_leak',                             # a real finding on a host no foothold reaches
        'sam_pc.web.invented', 'sam_pc.invented.factory_login', 'invented_pc.web.factory_login', 'sam_pc.web.', 'sam_pc.web', 'sam_pc',
        'SAM_PC.WEB.FACTORY_LOGIN', " #{fid('factory_login')}", "#{fid('factory_login')} ", "#{fid('factory_login')}\n",
        "#{fid('factory_login')}.", "#{fid('factory_login')}x", fid('factory_login')[0..-2], 'sam_pc.web.factory_login.extra',
        '../sam_pc.web.factory_login', 'sam_pc/web/factory_login', 'x' * 200
      ] + alias_ids
      bodies = unearned.map { |finding| assert_not_found(OFFICE, finding, 'card_factory', 'finding') }
      assert_equal [NOT_FOUND_JSON], bodies.uniq, 'an unearned real id answers the bytes an invented id does'
      assert_nothing_granted
      # The same requests with a card the player does not hold are the same bytes again.
      assert_equal NOT_FOUND_JSON, assert_not_found(OFFICE, fid('step_up'), 'card_listing', 'both wrong')
    end

    test 'a decoy and a real finding both answer not_confirmed before the confirm, byte for byte, and a decoy answers false_positive after' do
      partial_game
      before_decoy = ops_technique(OFFICE, fid('old_banner'), 'card_factory')
      decoy_bytes = response.body
      assert_response :unprocessable_entity
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_response :unprocessable_entity
      assert_equal decoy_bytes, response.body, 'a decoy and a real finding are alike before the confirm'
      assert_equal({ 'success' => false, 'reason' => 'not_confirmed' }, before_decoy)
      assert_equal %w[not_confirmed], rows('technique_refused').map { |row| row['detail']['reason'] }.uniq
      assert_nothing_granted
      ops_confirm(OFFICE, fid('old_banner'))
      assert_refused(fid('old_banner'), 'card_factory', 'false_positive')
      assert_nothing_granted
      # Confirmed false is final: no card, whatever it is, turns it into a grant.
      assert_refused(fid('old_banner'), 'card_build', 'false_positive')
      ops_confirm(OFFICE, fid('factory_login'))
      body = ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_response :success, response.body
      assert_equal 'session', body['grant']
    end

    test 'an unconfirmed real finding is refused whatever the card, with one refused row at its host' do
      partial_game(checked: %w[web files mail])
      %w[card_factory card_build].each { |card| assert_refused(fid('factory_login'), card, 'not_confirmed') }
      assert_refused(fid('raw_one'), 'card_factory', 'not_confirmed')
      assert_nothing_granted
      kept = rows('technique_refused')
      assert_equal 'refused', kept.first['result']
      assert_equal 'sam_pc', kept.first['where']['id']
      assert_nil kept.first['as']
    end

    # ---- footholds and reach -------------------------------------------------------------------

    test 'a foothold not held is the one 404, whatever it is called, and nothing is written' do
      hostile_game
      held = [OFFICE, fid('factory_login'), 'card_factory']
      cases = ['jack_nothing', SECOND, BENCH, 'comms_port', 'jack_comms_port ', ' jack_comms_port', 'JACK_COMMS_PORT', "#{OFFICE}\n", 'wifi_office',
               'implant_sam_pc', 'sam_pc', fid('factory_login'), 'card_factory', 'x' * 200, 'ünï-jack', "jack\u0000"]
      bodies = cases.map { |foothold| assert_not_found(foothold, held[1], held[2], 'foothold') }
      assert_equal [NOT_FOUND_JSON], bodies.uniq
      assert_nothing_granted
    end

    test 'a foothold that does not reach the host is the one 404, even after the host is used through the foothold that does' do
      hostile_game
      add_item('pc', 'kit_dropbox_2', 'Spare drop box')
      plant('bench_port')
      assert_response :success, response.body
      ops_scan(BENCH, host_id: 'bench_pc')
      ops_check(BENCH, host_id: 'bench_pc', service: 'web')
      ops_confirm(BENCH, 'bench_pc.web.bench_leak')
      assert_response :success, response.body
      invented = assert_not_found(OFFICE, 'bench_pc.web.invented', 'card_factory', 'invented')
      assert_equal invented, assert_not_found(OFFICE, 'bench_pc.web.bench_leak', 'card_factory', 'office does not reach workshop_lan')
      assert_equal invented, assert_not_found(BENCH, fid('factory_login'), 'card_factory', 'bench does not reach office_lan')
      body = ops_technique(BENCH, 'bench_pc.web.bench_leak', 'card_factory')
      assert_response :success, response.body
      assert_equal({ 'success' => true, 'grant' => 'credential', 'keyringChanged' => true }, body)
      assert_equal invented, assert_not_found(OFFICE, 'bench_pc.web.bench_leak', 'card_factory', 'after the use, the other foothold still reaches nothing')
      assert_equal ['bench_pc.web.bench_leak'], ops_state['opsUsed']
    end

    test 'another player cannot use a game they do not own, and a foothold held only in their own game is no foothold here' do
      hostile_game
      state = Game.find(@game.id).player_state.deep_dup
      mine_before = log_free(Game.find(@game.id).player_state)
      # A copy of this game owned by another player: the same footholds, card and findings, but not the caller's.
      other = create_access_game(mission: @game.mission, player: break_escape_demo_users(:other_user), scenario: hostile_scenario, player_state: state)
      get "/break_escape/games/#{other.id}/objectives", as: :json
      expected = [response.status, response.body]
      refute_equal 200, expected.first
      before = other.reload.player_state.deep_dup
      [[OFFICE, fid('factory_login'), 'card_factory'], [OFFICE, 'sam_pc.web.invented', 'x']].each do |foothold, finding, item|
        post "/break_escape/games/#{other.id}/network/technique", params: { foothold: foothold, finding_id: finding, item_id: item }, as: :json
        assert_equal expected, [response.status, response.body], 'the one answer of any route on a game that is not theirs'
        refute_includes response.body, 'session'
        assert_equal before, other.reload.player_state
      end
      assert_equal mine_before, log_free(Game.find(@game.id).player_state), 'nothing written into the caller\'s own game either'
      assert_empty rows('technique_used')
    end

    test 'a foothold and card held in the caller\'s own game are nothing in another game of theirs that holds neither' do
      hostile_game
      own_before = log_free(Game.find(@game.id).player_state)
      empty = create_access_game(mission: @game.mission, player: @game.player, scenario: hostile_scenario, player_state: {})
      before = empty.reload.player_state.deep_dup
      post "/break_escape/games/#{empty.id}/network/technique", params: { foothold: OFFICE, finding_id: fid('factory_login'), item_id: 'card_factory' }, as: :json
      assert_response :not_found
      assert_equal NOT_FOUND_JSON, response.body
      assert_equal before, empty.reload.player_state
      assert_equal own_before, log_free(Game.find(@game.id).player_state), 'the game that holds them is not touched'
    end

    test 'an unplugged foothold ends the session and the same request is the one 404, not a repeat' do
      hostile_game
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_equal 'technique', session_at('sam_pc')['via']
      unplug('comms_port')
      assert_response :success, response.body
      assert_nil session_at('sam_pc')
      assert_not_found(OFFICE, fid('factory_login'), 'card_factory', 'a stale foothold')
      assert_not_found(OFFICE, 'sam_pc.web.invented', 'card_factory', 'invented')
    end

    test 'a host powered off is 403 not_responding with one refused row, before any status or repeat answer' do
      hostile_game
      ops_technique(OFFICE, 'lab_box.web.lab_open', 'card_factory')
      assert_equal ['lab_box.web.lab_open'], ops_state['opsUsed']
      set_global('lab_off', true)
      3.times do
        body = assert_refused('lab_box.web.lab_open', 'card_factory', 'not_responding', status: :forbidden)
        assert_equal({ 'success' => false, 'reason' => 'not_responding' }, body)
        assert_equal '{"success":false,"reason":"not_responding"}', response.body
      end
      kept = rows('technique_refused')
      assert_equal 1, kept.size, 'repeats merge into one row'
      assert_equal 3, kept.first['n']
      assert_equal({ 'kind' => 'host', 'id' => 'lab_box' }, kept.first['where'])
      assert_equal 'not_responding', kept.first['detail']['reason']
      assert_equal ['lab_box.web.lab_open'], ops_state['opsUsed'], 'a refusal gives nothing'
    end

    test 'a route that is down answers the one 404 and a restored route answers as before' do
      hostile_game
      set_global('office_down', true)
      assert_not_found(OFFICE, fid('factory_login'), 'card_factory', 'route down')
      assert_not_found(OFFICE, 'lab_box.web.lab_open', 'card_factory', 'route down, other host')
      assert_not_found(OFFICE, 'sam_pc.web.invented', 'card_factory', 'route down, invented')
      set_global('office_down', false)
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      assert_response :success, response.body
    end

    # ---- wrong, missing and extra params -----------------------------------------------------------

    test 'a missing, empty, non-string or over-long parameter is one 400 whatever the finding, and 500 never' do
      hostile_game
      before = fingerprint
      full = { foothold: OFFICE, finding_id: fid('factory_login'), item_id: 'card_factory' }
      bad = [nil, '', 7, 7.5, true, false, %w[a], [], [fid('factory_login')], { a: 1 }, {}, { '0' => 'a' }, [[1]], 'x' * 201, 'ü' * 201, 'x' * 100_000,
             1 << 70]
      %i[foothold finding_id item_id].each do |key|
        bad.each do |value|
          post game_path('network/technique'), params: full.merge(key => value), as: :json
          assert_response :bad_request, "#{key} #{value.inspect[0, 30]}"
          assert_equal BAD_REQUEST, response.parsed_body
          assert_equal '{"success":false,"reason":"bad_request"}', response.body
        end
        post game_path('network/technique'), params: full.except(key), as: :json
        assert_response :bad_request, "#{key} missing"
        assert_equal BAD_REQUEST, response.parsed_body
      end
      post game_path('network/technique'), params: {}, as: :json
      assert_response :bad_request
      post game_path('network/technique'), as: :json
      assert_response :bad_request
      assert_equal before, fingerprint
    end

    test 'array and hash parameters sent as a form or a query string are a 400 too' do
      hostile_game
      before = fingerprint
      [{ finding_id: [fid('factory_login')] }, { item_id: { a: 'card_factory' } }, { foothold: [OFFICE] }, { foothold: { id: OFFICE } },
       { finding_id: [] }].each do |change|
        post game_path('network/technique'), params: { foothold: OFFICE, finding_id: fid('factory_login'), item_id: 'card_factory' }.merge(change)
        assert_response :bad_request, change.inspect
        assert_equal BAD_REQUEST, response.parsed_body
      end
      post "#{game_path('network/technique')}?finding_id[]=#{fid('factory_login')}", params: { foothold: OFFICE, item_id: 'card_factory' }
      assert_response :bad_request
      post "#{game_path('network/technique')}?item_id[a]=card_factory", params: { foothold: OFFICE, finding_id: fid('factory_login') }
      assert_response :bad_request
      assert_equal before, fingerprint
    end

    test 'a string of exactly 200 characters, a non-ASCII or control-character string is a 404, not a 400 and not a 500' do
      hostile_game
      odd = ['x' * 200, 'ü' * 200, "ünï·cødé ‮​", "\u{1F4A5}" * 50, "\t", "\e[31m", "\r\n", "a\u0000b", "\u0001\u0002", ' ', '%00', '%', '\\', '"', "'; DROP TABLE x;--",
             '<script>alert(1)</script>', '{{7*7}}', '${x}', '..', '/', '.', 'null', 'true', '0', '-1', '1e400', '[]', '{}', "\xEF\xBF\xBE"]
      odd.each do |text|
        assert_not_found(text, fid('factory_login'), 'card_factory', 'foothold')
        assert_not_found(OFFICE, text, 'card_factory', 'finding')
        assert_not_found(OFFICE, fid('factory_login'), text, 'item')
      end
      assert_nothing_granted
    end

    test 'extra parameters are ignored: a refusal is the same with them and a grant carries none of them' do
      hostile_game
      extras = { access: 'admin', via: 'password', grant: 'credential', technique: 'build_flaw', account: 'ian', as: 'ian', npc: 'ian', username: 'ian',
                 session: { id: 'ian', via: 'password', access: 'admin' }, opsUsed: [NOS::SPOOL], opsFindings: { fid('raw_one') => 'c1' }, clientAdded: true,
                 grants: { session: { account: 'ian', access: 'admin' } }, worksOn: { class: 'any' }, status: 'confirmed', alias: 'f1', host_id: 'lab_box',
                 network_id: 'office_lan', 'foothold[]' => 'jack_x', id: 'factory_login',
                 credential: 'print_admin', credential_id: 'print_admin', pc_id: 'lena_pc', level: 'admin' }
      base = { foothold: OFFICE, finding_id: fid('old_build'), item_id: 'card_factory' }
      plain = ops_technique(OFFICE, fid('old_build'), 'card_factory')
      plain_status = response.status
      before = log_free(ops_state).deep_dup
      post game_path('network/technique'), params: base.merge(extras), as: :json
      assert_equal plain_status, response.status
      assert_equal plain, response.parsed_body
      assert_equal 'wrong_class', response.parsed_body['reason']
      assert_equal before, log_free(ops_state)
      post game_path('network/technique'), params: { foothold: OFFICE, finding_id: 'sam_pc.web.invented', item_id: 'card_factory' }.merge(extras), as: :json
      assert_response :not_found
      assert_equal NOT_FOUND_JSON, response.body
      # A grant with every extra: sam, user, through the technique, once; no access in the answer.
      post game_path('network/technique'), params: base.merge(finding_id: fid('factory_login')).merge(extras), as: :json
      assert_response :success, response.body
      body = response.parsed_body
      assert_equal 'session', body['grant']
      assert_nil body['session']['access']
      assert_equal 'sam', body['session']['npcId']
      assert_equal({ 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'user', 'technique' => fid('factory_login') }, session_at('sam_pc'))
      assert_equal [fid('factory_login')], ops_state['opsUsed']
      assert_equal 'factory_accounts', rows('technique_used').first['detail']['technique']
      assert_equal 'user', rows('technique_used').first['detail']['access']
    end

    test 'extra parameters on a credential grant change nothing: the body is exactly success, grant and keyringChanged' do
      hostile_game
      extras = { credential: 'lab_admin', credential_id: 'lab_admin', pc_id: 'lena_pc', level: 'admin', access: 'admin', account: 'lena', grant: 'session',
                 session: { id: 'lena', access: 'admin' }, username: 'lfox', id: 'lab_admin', opsUsed: ['lab_box.web.lab_open'] }
      post game_path('network/technique'), params: { foothold: OFFICE, finding_id: NOS::SPOOL, item_id: 'card_factory' }.merge(extras), as: :json
      assert_response :success, response.body
      assert_equal({ 'success' => true, 'grant' => 'credential', 'keyringChanged' => true }, response.parsed_body)
      assert_equal [NOS::SPOOL], ops_state['opsUsed'], 'only the finding named in the request is recorded'
      assert_empty ops_state['sessions'].to_h
      assert_includes keyring_ids, 'print_admin'
      refute_includes keyring_ids, 'lab_admin'
      assert_equal 'credential', rows('technique_used').first['detail']['grant']
      assert_nil rows('technique_used').first['detail']['access']
    end

    # ---- state the client must not be able to set ------------------------------------------------

    def forged_body(state_session: true)
      body = {
        opsUsed: [fid('factory_login'), NOS::SPOOL], opsFindings: { fid('factory_login') => 'c1', fid('raw_one') => 'c2', fid('step_up') => 'c3' },
        opsDiscovered: { networks: %w[office_lan server_net], hosts: %w[sam_pc print_srv], services: %w[sam_pc.web sam_pc.files] },
        signedInPcs: %w[sam_pc], footholds: { 'jack_x' => { 'id' => 'jack_x' } },
        globalVariables: { opsUsed: [NOS::SPOOL], opsFindings: { fid('raw_one') => 'c1' }, sessions: { sam_pc: { id: 'sam' } }, side_door_propped: true }
      }
      if state_session
        body[:sessions] = { 'sam_pc' => { 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'admin', 'technique' => fid('step_admin') } }
      end
      body
    end

    def server_values
      state = ops_state
      SERVER_KEYS.to_h { |key| [key, state[key]] }
    end

    test 'a sync body cannot set opsUsed, opsFindings, opsDiscovered, a technique session or a foothold, and nothing is granted' do
      state = { 'inventory' => [card_entry('card_factory')], 'unlockedRooms' => NetworkRequests::OPEN_ROOMS + %w[server_room] }
      hold_office_foothold(state, hostile_scenario)
      sweep_and_scan('sam_pc', 'print_srv')
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
      before = server_values.deep_dup
      assert_equal %w[u u u u u], ops_state['opsFindings'].values.map { |value| value[0] }
      put game_path('sync_state'), params: forged_body, as: :json
      assert_response :success, response.body
      assert_equal before, server_values, 'a sync body changed a server-owned key'
      assert_equal before['sessions'], ops_state['sessions']
      # Nothing it claimed is earned: the confirm it forged is no confirm, the session it forged is no session.
      assert_refused(fid('factory_login'), 'card_factory', 'not_confirmed')
      assert_not_found(OFFICE, NOS::SPOOL, 'card_factory', 'a finding never checked')
      assert_not_found(OFFICE, fid('step_up'), 'card_factory', 'a service never checked')
      refute_includes keyring_ids, 'print_admin'
      container('sam_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'no_session', response.parsed_body['reason']
      container('sam_pc')
      assert_response :forbidden
      assert_nil bootstrap_scenario['sessions']&.[]('sam_pc')
      assert_nothing_granted
    end

    test 'a sync body cannot raise a real technique session to admin, and the answer carries no access' do
      hostile_game
      ops_technique(OFFICE, fid('factory_login'), 'card_factory')
      record = session_at('sam_pc').deep_dup
      assert_equal 'user', record['access']
      put game_path('sync_state'), params: forged_body, as: :json
      assert_response :success, response.body
      assert_equal record, session_at('sam_pc')
      assert_equal [fid('factory_login')], ops_state['opsUsed']
      answer = container('sam_pc', foothold: OFFICE)
      assert_response :success, response.body
      assert_nil answer['session']['access'], 'the session answer carries no access for a user session'
      assert_nil bootstrap_scenario['sessions']['sam_pc']['access']
      assert_nil view_hosts.find { |row| row['id'] == 'sam_pc' }['session']['access']
      refused = ops_technique(OFFICE, fid('step_admin'), 'card_factory')
      assert_response :unprocessable_entity
      assert_equal 'need_unmet', refused['reason'], 'the forged admin level meets no session need'
      assert_equal 'session', refused['need']['kind']
    end

    test 'a synced game global named opsUsed is an ordinary global: the state key is untouched and the keyring proof does not hold' do
      hostile_game
      assert_equal [], Array(ops_state['opsUsed'])
      sync_globals('opsUsed' => [NOS::SPOOL], 'opsFindings' => { 'x' => 'c1' })
      assert_response :success, response.body
      assert_equal [NOS::SPOOL], ops_state['globalVariables']['opsUsed'], 'stored as an ordinary global'
      assert_equal [], Array(ops_state['opsUsed']), 'the server state key is untouched'
      refute_includes keyring_ids, 'print_admin'
      body = ops_technique(OFFICE, NOS::SPOOL, 'card_factory')
      assert_response :success, response.body
      assert_nil body['already'], 'a synced global is not a use'
      assert_equal true, body['keyringChanged']
      assert_equal [NOS::SPOOL], ops_state['opsUsed']
      assert_includes keyring_ids, 'print_admin'
    end

    test 'forged ops keys on any other route change no server-owned key' do
      hostile_game
      before = server_values.deep_dup
      forged = forged_body
      expected = { 'sync_state' => [200, { 'success' => true }],
                   'update_room' => [400, { 'success' => false, 'message' => 'Missing roomId or actionType' }],
                   'inventory' => [400, { 'success' => false, 'message' => 'Invalid action' }],
                   'login' => [400, { 'success' => false, 'message' => 'Missing pc_id' }],
                   'logout' => [400, { 'success' => false, 'message' => 'Missing pc_id' }],
                   'unlock' => [422, { 'success' => false, 'message' => 'Invalid attempt' }],
                   'network/scan' => [400, BAD_REQUEST], 'network/check' => [400, BAD_REQUEST], 'network/confirm' => [400, BAD_REQUEST] }
      [[:put, 'sync_state'], [:post, 'update_room'], [:post, 'inventory'], [:post, 'login'], [:post, 'logout'], [:post, 'unlock'],
       [:post, 'network/scan'], [:post, 'network/check'], [:post, 'network/confirm']].each do |verb, path|
        send(verb, game_path(path), params: forged, as: :json)
        assert_equal expected[path], [response.status, response.parsed_body], "#{path}: a forged body is refused as ever"
        assert_equal before, server_values, "#{path} changed a server-owned key"
      end
    end

    # ---- replay ----------------------------------------------------------------------------------

    test 'the same granted request sent many times is one session, one opsUsed entry and rows within the save bound' do
      hostile_game
      OpsLog.with_clock(1_763_550_000_000) do
        bodies = []
        counts = Array.new(30) { saves_during { bodies << ops_technique(OFFICE, fid('factory_login'), 'card_factory') } }
        assert_equal 1, counts.first, 'the new grant saves once'
        assert_equal [1] * 10, counts[1, 10], 'a stored repeat saves once'
        assert_equal [0] * 19, counts.last(19), 'a repeat the helper drops saves nothing'
        assert_nil bodies.first['already']
        assert(bodies.drop(1).all? { |body| body['already'] == true })
        assert_equal 1, bodies.drop(1).map { |body| body['session'] }.uniq.size
        assert_equal bodies.first['session'], bodies.last['session']
      end
      assert_equal [fid('factory_login')], ops_state['opsUsed']
      assert_equal %w[sam_pc], ops_state['sessions'].keys
      used = rows('technique_used')
      assert_equal 1, used.size
      assert_equal 11, used.first['n'], 'the row merged up to the bound and no further'
      assert_empty rows('technique_refused')
    end

    test 'the same granted credential request sent many times is one opsUsed entry with keyringChanged false after the first' do
      hostile_game
      OpsLog.with_clock(1_763_550_000_000) do
        bodies = []
        counts = Array.new(25) { saves_during { bodies << ops_technique(OFFICE, NOS::SPOOL, 'card_factory') } }
        assert_equal [1] + [1] * 10 + [0] * 14, counts, 'the grant saves once, a stored repeat saves, a dropped repeat saves nothing'
        assert_equal true, bodies.first['keyringChanged']
        assert(bodies.drop(1).all? { |body| body == { 'success' => true, 'already' => true, 'grant' => 'credential', 'keyringChanged' => false } })
      end
      assert_equal [NOS::SPOOL], ops_state['opsUsed']
      assert_empty ops_state['sessions'].to_h
      assert_equal 1, rows('technique_used').size
      assert_equal 11, rows('technique_used').first['n']
    end

    test 'a refused request sent many times stores at most the bound and saves nothing after it' do
      hostile_game
      OpsLog.with_clock(1_763_550_000_000) do
        before = log_free(ops_state).deep_dup
        counts = Array.new(30) { saves_during { ops_technique(OFFICE, fid('old_build'), 'card_factory') } }
        assert_equal [1] * 10, counts.first(10)
        assert_equal [0] * 20, counts.last(20)
        stamp = Game.find(@game.id).updated_at
        ops_technique(OFFICE, fid('old_build'), 'card_factory')
        assert_equal stamp, Game.find(@game.id).updated_at, 'a dropped refusal saves nothing'
        assert_equal before, log_free(ops_state)
      end
      kept = rows('technique_refused')
      assert_equal 1, kept.size
      assert_equal 10, kept.first['n']
      assert_nothing_granted
    end

    test 'a 404 sent many times writes no row and saves nothing' do
      hostile_game
      stamp = Game.find(@game.id).updated_at
      before = fingerprint
      counts = Array.new(30) { saves_during { ops_technique(OFFICE, 'sam_pc.web.invented', 'card_factory') } }
      assert_equal [0] * 30, counts
      counts = Array.new(30) { saves_during { ops_technique(OFFICE, fid('factory_login'), 'card_listing') } }
      assert_equal [0] * 30, counts
      assert_equal before, fingerprint
      assert_equal stamp, Game.find(@game.id).updated_at
    end

    # ---- order of refusals -------------------------------------------------------------------------

    test 'a request wrong in several ways is answered with the first applicable reason in the plan order' do
      data = hostile_scenario
      techniques_game(cards: ALL_CARDS, data: data)
      ops_technique(OFFICE, fid('patched_one'), 'card_factory') # a session grant, so its repeat can be asked later
      assert_response :success, response.body
      set_global(NOS::PATCHED_GLOBAL, true)
      set_global('lab_off', true)
      set_status('lab_box.web.lab_open', 'u')
      set_status(fid('raw_quiet'), 'u')
      before = log_free(ops_state).deep_dup
      # [what is wrong, finding, card, status, reason or nil for a success, need kind]
      table = [
        ['invented finding, card not held, host off', 'sam_pc.web.invented', 'no_such_item', 404, 'not_found'],
        ['finding held, card not held, host off, unconfirmed', 'lab_box.web.lab_open', 'no_such_item', 404, 'not_found'],
        ['host off, unconfirmed, card fits', 'lab_box.web.lab_open', 'card_factory', 403, 'not_responding'],
        ['host off, unconfirmed, wrong class card', 'lab_box.web.lab_open', 'card_build', 403, 'not_responding'],
        ['a repeat, now fixed', fid('patched_one'), 'card_factory', 200, nil],
        ['unconfirmed, wrong product card', fid('raw_one'), 'card_wrongprod', 422, 'not_confirmed'],
        ['unconfirmed, no grant, wrong class', fid('raw_quiet'), 'card_factory', 422, 'not_confirmed'],
        ['false positive, no grant, wrong product', fid('old_banner'), 'card_wrongprod', 422, 'false_positive'],
        ['no grant, wrong class', fid('quiet_leak'), 'card_build', 422, 'no_grant'],
        ['fixed, wrong class', fid('patched_two'), 'card_build', 422, 'fixed'],
        ['wrong class, product and version', fid('old_build'), 'card_bothwrong', 422, 'wrong_class'],
        ['right class, wrong product and version', fid('old_build'), 'card_prodver', 422, 'wrong_product'],
        ['right class and product, wrong version', fid('old_build'), 'card_wrongver', 422, 'wrong_version'],
        ['wrong class and a need unmet', fid('gated'), 'card_wrongprod', 422, 'wrong_class'],
        ['a need unmet', fid('gated'), 'card_factory', 422, 'need_unmet'],
        ['two needs unmet: the credential first', fid('needy'), 'card_factory', 422, 'need_unmet']
      ]
      table.each do |note, finding, card, status, reason|
        body = ops_technique(OFFICE, finding, card)
        assert_equal status, response.status, "#{note}: #{response.body}"
        if reason.nil?
          assert_equal true, body['already'], note
        else
          assert_equal reason, body['reason'], note
        end
      end
      assert_equal 'credential', ops_technique(OFFICE, fid('needy'), 'card_factory')['need']['kind']
      assert_equal before, log_free(ops_state), 'no refusal in the table changed state beyond the log'
      assert_equal [fid('patched_one')], ops_state['opsUsed']
    end

    test 'the answer for an unearned id is the answer for an invented one: foothold, finding and card, byte for byte' do
      partial_game
      invented = ops_technique(OFFICE, 'sam_pc.web.invented', 'card_factory') && response.body
      unearned = [
        [OFFICE, fid('step_up'), 'card_factory'],
        ['jack_nothing', fid('factory_login'), 'card_factory'],
        [SECOND, fid('factory_login'), 'card_factory'],
        [OFFICE, fid('factory_login'), 'card_wrongprod'],
        [OFFICE, 'lab_box.web.lab_open', 'card_wrongprod'],
        [OFFICE, 'f1', 'card_factory'],
        [OFFICE, 'sam_pc.web.invented', 'no_such_item']
      ]
      unearned.each do |foothold, finding, card|
        ops_technique(foothold, finding, card)
        assert_equal 404, response.status
        assert_equal invented, response.body
        assert_equal 'application/json', response.media_type
      end
    end
  end
end
