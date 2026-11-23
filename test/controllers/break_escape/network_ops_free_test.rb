require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S2 (OPS_CORE_PLAN.md 11.2, "the loop costs nothing but rows"): confirming every
  # finding of a service, decoys and weaknesses alike, changes no state beyond the statuses and the
  # log, and adds no state key. The card half is NetworkOpsFreeCardTest below (S3).
  class NetworkOpsFreeTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    NOS = NetworkOpsScenario

    setup do
      hold_office_foothold({}, NOS.findings_scenario)
      sweep_and_scan('sam_pc')
      ops_check(OFFICE, host_id: 'sam_pc', service: 'web')
    end

    def comparable(state)
      state.except('opsFindings', 'opsLog', 'opsLogSeq', 'opsLogClockAt')
    end

    test 'confirming every finding of a service changes only the statuses and the log, and adds no state key' do
      before = ops_state.deep_dup
      ids = before['opsFindings'].keys
      assert_equal 4, ids.length
      ids.each { |id| ops_confirm(OFFICE, id) }
      after = ops_state
      assert_equal comparable(before), comparable(after), 'a confirm changed state beyond statuses and the log'
      assert_equal before.keys.sort, after.keys.sort, 'a confirm added or removed a state key'
      assert_equal ids.sort, after['opsFindings'].keys.sort
      assert_equal before['opsFindings'].transform_values { |v| v[1..] }, after['opsFindings'].transform_values { |v| v[1..] },
                   'aliases are never changed by a confirm'
      assert_equal %w[c f c c], ids.sort.map { |id| after['opsFindings'][id][0] }
    end

    test 'a confirm costs no inventory, no global and no session' do
      before = ops_state.deep_dup
      ops_findings = before['opsFindings'].keys
      ops_findings.each { |id| ops_confirm(OFFICE, id) }
      after = ops_state
      %w[inventory globalVariables sessions signedInPcs footholds credentialClock keyringGained].each do |key|
        assert before.key?(key), "the state has no #{key} to compare" if %w[inventory globalVariables footholds].include?(key)
        assert_equal before[key], after[key], key
      end
    end

    test 'the confirms write one row each and a repeat of any writes none' do
      ids = ops_state['opsFindings'].keys
      ids.each { |id| ops_confirm(OFFICE, id) }
      assert_equal 4, ops_rows.count { |row| row['event'] == 'finding_confirmed' }
      ids.each { |id| ops_confirm(OFFICE, id) }
      assert_equal 4, ops_rows.count { |row| row['event'] == 'finding_confirmed' }
    end

    test 'checking every service of every scanned host adds findings and the checked list and nothing else' do
      sweep_and_scan('print_srv')
      before = ops_state.deep_dup
      ops_check(OFFICE, host_id: 'sam_pc', service: 'files')
      ops_check(OFFICE, host_id: 'print_srv', service: 'queue')
      after = ops_state
      assert_equal comparable(before).except('opsDiscovered'), comparable(after).except('opsDiscovered')
      assert_equal before.keys.sort, after.keys.sort
      assert_equal %w[hosts networks services], after['opsDiscovered'].keys.sort
      assert_equal ['sam_pc.web'], before['opsDiscovered']['services']
      assert_equal %w[print_srv.queue sam_pc.files sam_pc.web], after['opsDiscovered']['services'].sort,
                   'each check adds its service to the checked list'
      assert_equal [NOS::SPOOL], after['opsFindings'].keys - before['opsFindings'].keys,
                   'the print server check adds exactly its one finding'
      assert_equal before['opsFindings'], after['opsFindings'].slice(*before['opsFindings'].keys),
                   'a check never changes a finding already held'
    end
  end

  # Ops core S3 (OPS_CORE_PLAN.md 11.2, the same row): trying a card is free. Cards tried on findings
  # change no state beyond the grants a matching card earns and the log, and wrong uses cost nothing:
  # the right card still works, with the answer a fresh game gives. Each refusal past the two 404s
  # (the 403 included) writes a `technique_refused` row passed with `save_limit: true` and saves only
  # while the helper's result is stored: the first ten at a host in a five-minute window of server
  # time, whatever the card, finding or reason; none after, until the window ends; none with no log source.
  class NetworkOpsFreeCardTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    OFFICE = NetworkOpsScenario::OFFICE
    NOS = NetworkOpsScenario
    ALL_CARDS = NOS::TECH_CARDS.keys.freeze
    T0 = 1_763_550_000_000
    GRANT_KEYS = %w[sessions signedInPcs opsUsed].freeze

    # Counts Game#save! calls while switched on (the requests load their own Game), as network_scan_test does.
    module FreeSaveCounter
      class << self
        attr_accessor :on, :count
      end

      def save!(*args, **opts)
        FreeSaveCounter.count += 1 if FreeSaveCounter.on
        super
      end
    end
    Game.prepend(FreeSaveCounter)

    def saves_during
      FreeSaveCounter.count = 0
      FreeSaveCounter.on = true
      yield
      FreeSaveCounter.count
    ensure
      FreeSaveCounter.on = false
    end

    def fid(id)
      service = { 'files' => %w[gated step_up step_admin needy], 'mail' => %w[sheet_gated raw_one] }.find { |_n, ids| ids.include?(id) }&.first || 'web'
      "sam_pc.#{service}.#{id}"
    end

    def refusal_rows
      ops_rows.select { |row| row['event'] == 'technique_refused' }
    end

    def log_free(state)
      state.reject { |key, _| key.start_with?('opsLog') }
    end

    # Twelve refusals at sam_pc, none of them alike in finding, card and reason together.
    REFUSALS = [
      %w[old_build card_factory], %w[old_build card_wrongprod], %w[old_build card_wrongver], %w[raw_one card_factory], %w[old_banner card_factory],
      %w[quiet_leak card_factory], %w[gated card_factory], %w[needy card_factory], %w[sheet_gated card_factory], %w[step_up card_factory],
      %w[old_banner card_build], %w[quiet_leak card_build]
    ].freeze

    test 'trying every card on every finding changes no state beyond the grants it earns, the log and no state key' do
      techniques_game(cards: ALL_CARDS)
      before = ops_state.deep_dup
      findings = before['opsFindings'].keys.sort
      assert_operator findings.size, :>=, 12
      findings.product(ALL_CARDS).each do |finding, card|
        ops_technique(OFFICE, finding, card)
        assert_includes [200, 403, 404, 422], response.status, [finding, card].inspect
        assert_equal 404, response.status if card == 'card_ghost'
      end
      after = ops_state
      changed = (before.keys | after.keys).reject { |key| before[key] == after[key] || key.start_with?('opsLog') }
      assert_equal [], changed - GRANT_KEYS, 'a card use changed state outside the grants and the log'
      assert_equal [], (after.keys - before.keys).reject { |key| key.start_with?('opsLog') } - GRANT_KEYS, 'a card use added a state key'
      assert_equal before['opsFindings'], after['opsFindings'], 'trying a card never changes a status or an alias'
      assert_equal before['opsDiscovered'], after['opsDiscovered']
      assert_equal %w[sam_pc], after['sessions'].to_h.keys
      assert_equal 'technique', after['sessions']['sam_pc']['via']
      assert_equal after['opsUsed'].uniq, after['opsUsed'], 'a finding is in opsUsed once'
      %w[inventory globalVariables footholds credentialClock keyringGained].each { |key| assert_equal before[key], after[key], key }
    end

    test 'after many wrong uses the right card still works, with the answer a fresh game gives' do
      techniques_game(cards: ALL_CARDS)
      fresh = ops_technique(OFFICE, fid('old_build'), 'card_build')
      assert_response :success, response.body
      fresh_rows = ops_rows.count { |row| row['event'] == 'technique_used' }
      techniques_game(cards: ALL_CARDS)
      wrong = REFUSALS.cycle.first(40)
      wrong.each do |finding, card|
        ops_technique(OFFICE, fid(finding), card)
        assert_includes [403, 422], response.status
      end
      assert_empty Array(ops_state['opsUsed'])
      assert_empty ops_state['sessions'].to_h
      body = ops_technique(OFFICE, fid('old_build'), 'card_build')
      assert_response :success, response.body
      assert_equal fresh, body
      assert_nil body['already']
      assert_equal fresh_rows, ops_rows.count { |row| row['event'] == 'technique_used' }
      assert_equal [fid('old_build')], ops_state['opsUsed']
    end

    test 'confirming and trying cards leaves the inventory, the globals and the statuses as they were' do
      techniques_game(cards: ALL_CARDS)
      before = log_free(ops_state).deep_dup
      REFUSALS.each { |finding, card| ops_technique(OFFICE, fid(finding), card) }
      ops_state['opsFindings'].each_key { |id| ops_confirm(OFFICE, id) unless id.end_with?('.raw_one') }
      assert_equal before, log_free(ops_state), 'wrong uses and repeat confirms change only the log'
    end

    test 'the first ten refusals at a host in a window save, whatever the card, finding or reason, and the rest do not until the window ends' do
      OpsLog.with_clock(T0) do
        techniques_game(cards: ALL_CARDS)
        counts = REFUSALS.map { |finding, card| saves_during { ops_technique(OFFICE, fid(finding), card) } }
        assert_equal [1] * 10 + [0, 0], counts
        assert_operator refusal_rows.sum { |row| row['n'] || 1 }, :<=, 10, 'the helper dropped the last two'
        assert_equal [0] * 3, Array.new(3) { saves_during { ops_technique(OFFICE, fid('old_build'), 'card_factory') } }
        # A refusal at another host has its own budget (the 403 not_responding included).
        set_global('lab_off', true)
        assert_equal 1, saves_during { ops_technique(OFFICE, 'lab_box.web.lab_open', 'card_factory') }
        assert_equal 403, response.status
        assert_equal 'lab_box', refusal_rows.last['where']['id']
        assert_equal 'refused', refusal_rows.last['result']
      end
      OpsLog.with_clock(T0 + OpsLog::SAVE_WINDOW_MS + 1_000) do
        assert_equal 1, saves_during { ops_technique(OFFICE, fid('old_build'), 'card_factory') }
        assert_equal 422, response.status
      end
    end

    test 'a refusal sent twice writes its row twice, merged into a count' do
      OpsLog.with_clock(T0) do
        techniques_game(cards: ALL_CARDS)
        2.times { ops_technique(OFFICE, fid('old_build'), 'card_factory') }
        assert_equal 1, refusal_rows.size
        assert_equal 2, refusal_rows.first['n']
        assert_equal 'wrong_class', refusal_rows.first['detail']['reason']
        assert_nil refusal_rows.first['as']
      end
    end

    test 'with no log source a refusal writes no row and saves nothing, a 404 included, and a grant still saves' do
      techniques_game(cards: ALL_CARDS, data: NOS.techniques_scenario(logged: false))
      counts = REFUSALS.map { |finding, card| saves_during { ops_technique(OFFICE, fid(finding), card) } }
      assert_equal [0] * REFUSALS.size, counts
      assert_equal 0, saves_during { ops_technique(OFFICE, 'sam_pc.web.invented', 'card_factory') }
      assert_empty ops_rows
      assert_equal 1, saves_during { ops_technique(OFFICE, fid('old_build'), 'card_build') }
      assert_response :success
      assert_equal [fid('old_build')], ops_state['opsUsed']
    end
  end
end
