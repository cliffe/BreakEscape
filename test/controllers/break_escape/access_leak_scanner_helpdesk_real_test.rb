require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8b unit 24 (feature A23, the leak scanner on REAL answers): the scanner run over unit 23's capture of the played
  # `test_ops_helpdesk` run (test/fixtures/files/ops_helpdesk_real_capture_rows.jsonl, the answers the server really gave,
  # as the browser's capture holds them). The whole run reports nothing; then ONE edit at a time is made in a copy of the
  # capture (a row removed, a field changed, a secret put in an answer) and the scanner must report it. A removed proof makes
  # everything that depended on it a finding: the scanner fails closed.
  class AccessLeakScannerHelpdeskRealTest < ActiveSupport::TestCase
    CAPTURE = File.expand_path('../../fixtures/files/ops_helpdesk_real_capture_rows.jsonl', __dir__)
    SCENARIO = File.expand_path('../../../scenarios/test_ops_helpdesk/scenario.json.erb', __dir__)
    TESS_PW = 'Cobalt-Fenwick-58'.freeze

    def data
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO)))
    end

    def capture
      File.readlines(CAPTURE).map { |l| JSON.parse(l) }
    end

    # Apply one edit to a fresh copy of the capture (the block gets the array of row hashes) and scan it.
    def tampered
      rows = capture
      yield rows
      lines = rows.each_with_index.map { |r, i| ['capture.jsonl', i + 1, r] }
      AccessLeakScanner.new(data).scan(lines)
    end

    def route(row)
      row['path'].sub(%r{\A/break_escape/games/\d+/}, '')
    end

    def index_of(rows, method, route, nth = 0, &block)
      hits = rows.each_index.select { |i| rows[i]['method'] == method && route(rows[i]) == route && (block.nil? || block.call(rows[i])) }
      hits.fetch(nth) { flunk "no row #{method} #{route} ##{nth}" }
    end

    def grant(rows, what, npc, nth = 0)
      index_of(rows, 'POST', 'helpdesk/request', nth) { |r| r['body']['granted'] == true && r['body']['what'] == what && r['body']['npcId'] == npc }
    end

    def keyring_with_reset(rows)
      index_of(rows, 'GET', 'keyring') { |r| r['body']['entries'].any? { |e| e['id'] == 'tess.reset' } }
    end

    def describe(found)
      found.map { |f| [f.rule, f.owner, f.line].inspect }.join("\n")
    end

    def owners(found)
      found.map(&:owner)
    end

    def rules(found)
      found.map(&:rule).uniq
    end

    def assert_reported(found, rule, owner = nil, message = nil)
      hit = found.any? { |f| f.rule == rule && (owner.nil? || f.owner == owner) }
      assert hit, "#{message || 'expected'} #{rule} #{owner}; got:\n#{describe(found)}"
    end

    # ---- the real run ----

    test 'the real capture of the played run reports nothing' do
      found = tampered { |_rows| }
      assert_empty found, describe(found)
    end

    test 'the capture holds each proof the rules read: both grants, the own-phone approval with its query, the hand-over and the audit rows' do
      rows = capture
      assert_equal 'own=1', rows[index_of(rows, 'POST', 'mfa/approve')]['query']
      assert_equal 'own_phone', rows[index_of(rows, 'POST', 'mfa/approve')]['body']['approvedBy']
      assert grant(rows, 'mfa', 'wim')
      assert grant(rows, 'mfa', 'vera')
      assert grant(rows, 'password', 'tess', 1)
      assert_equal 'vera_phone', rows[index_of(rows, 'POST', 'inventory') { |r| r['inv']['itemId'] == 'vera_phone' }]['inv']['itemId']
      assert index_of(rows, 'GET', 'log_rows')
      assert_equal 'SIGN_IN', rows[index_of(rows, 'GET', 'log_rows')]['body']['rows'].first['event']
    end

    # ---- the grant row and its echo ----

    test 'tamper 1: the first password grant removed, the keyring reset entry that follows is a leak' do
      found = tampered { |rows| rows.delete_at(grant(rows, 'password', 'tess')) }
      assert_reported found, 'helpdesk_secret', 'helpdesk:reset:tess'
    end

    test 'tamper 2: a grant echo naming another account is not credited' do
      found = tampered { |rows| rows[grant(rows, 'mfa', 'wim')]['body']['npcId'] = 'sam' }
      assert_reported found, 'helpdesk_grant'
      assert_includes owners(found), 'helpdesk:own:ownPhone', 'wim\'s own-phone step then has no grant'
    end

    test 'tamper 3: a grant echo naming a desk that does not cover the reset is not credited' do
      found = tampered { |rows| rows[grant(rows, 'password', 'tess')]['body']['deskId'] = 'id_desk' }
      assert_reported found, 'helpdesk_grant'
      assert_reported found, 'helpdesk_secret', 'helpdesk:reset:tess', 'the password in the grant answer'
    end

    test 'tamper 4: the echo removed (no npcId) is not credited' do
      found = tampered { |rows| rows[grant(rows, 'mfa', 'wim')]['body'].delete('npcId') }
      assert_reported found, 'helpdesk_secret', 'helpdesk:answer'
      assert_reported found, 'helpdesk_secret', 'helpdesk:own:ownPhone'
    end

    test 'tamper 5: a grant answer carrying the password of another account is a leak' do
      found = tampered { |rows| rows[grant(rows, 'password', 'tess')]['body']['password'] = 'Lantern-Quay-63' }
      assert_reported found, 'helpdesk_secret'
    end

    # ---- the own forms need their grant ----

    test 'tamper 6: the own-phone approval with no re-enrol grant for the account' do
      found = tampered { |rows| rows.delete_at(grant(rows, 'mfa', 'wim')) }
      assert_reported found, 'mfa_session', nil, 'the approval is a pass with no proof:'
      assert_reported found, 'helpdesk_secret', 'helpdesk:own:ownPhone'
    end

    test 'tamper 7: the own-code pass with no grant for the account' do
      found = tampered { |rows| rows.delete_at(grant(rows, 'mfa', 'vera')) }
      assert_reported found, 'helpdesk_secret', 'helpdesk:own:device'
      assert_reported found, 'helpdesk_secret', 'helpdesk:own:ownPhone'
    end

    test 'tamper 8: a second account\'s own forms on one account\'s grant' do
      found = tampered { |rows| rows[grant(rows, 'mfa', 'vera')]['body']['npcId'] = 'wim' } # both grants now name wim
      assert_reported found, 'helpdesk_secret', 'helpdesk:own:device'
      assert_reported found, 'helpdesk_secret', 'helpdesk:own:ownPhone'
    end

    test 'tamper 9: the own-phone approval row with no query is not proof of an own request' do
      found = tampered { |rows| rows[index_of(rows, 'POST', 'mfa/approve')].delete('query') }
      assert_reported found, 'mfa_session'
    end

    test 'tamper 10: the own-phone approval row with own=2, or a second parameter' do
      %w[own=2 own=1&x=1].each do |q|
        found = tampered { |rows| rows[index_of(rows, 'POST', 'mfa/approve')]['query'] = q }
        assert_reported found, 'mfa_session', nil, q
      end
    end

    test 'tamper 11: Vera\'s phone handed over later (callback desk, the phone not yet held at the grant) is not credited' do
      found = tampered do |rows|
        hand = index_of(rows, 'POST', 'inventory') { |r| r['inv']['itemId'] == 'vera_phone' }
        rows.insert(grant(rows, 'mfa', 'vera') + 1, rows.delete_at(hand))
      end
      assert_reported found, 'helpdesk_grant'
    end

    test 'tamper 12: Vera\'s phone hand-over row removed, the callback grant is not credited' do
      found = tampered { |rows| rows.delete_at(index_of(rows, 'POST', 'inventory') { |r| r['inv']['itemId'] == 'vera_phone' }) }
      assert_reported found, 'helpdesk_grant'
      assert_reported found, 'helpdesk_secret', 'helpdesk:own:device'
    end

    # ---- the reset password ----

    test 'tamper 13: the reset password in a room answer before the grant' do
      found = tampered { |rows| rows[1]['body']['note'] = TESS_PW }
      assert_reported found, 'helpdesk_secret', 'helpdesk:reset:tess'
    end

    test 'tamper 14: the keyring Reset entry before any grant (moved up from after the first grant)' do
      found = tampered { |rows| rows.insert(grant(rows, 'password', 'tess'), rows[keyring_with_reset(rows)].deep_dup) }
      assert_reported found, 'helpdesk_secret', 'helpdesk:reset:tess'
    end

    test 'tamper 15: the reset password in an audit-log row' do
      found = tampered { |rows| rows[index_of(rows, 'GET', 'log_rows')]['body']['rows'].first['detail'] = "typed #{TESS_PW}" }
      assert_not_empty found
      assert_includes owners(found), 'helpdesk:reset:tess'
    end

    # ---- recovery answers ----

    test 'tamper 16: a recovery answer in a room answer, as a pair, a pair of values, and inside an array' do
      {
        'map' => { 'staff_no' => '40517' },
        'values' => { 'id' => 'manager', 'answer' => 'Nell Brook' },
        'in an array under the question id' => { 'staff_no' => ['40517'] },
        'id beside the answer in an array' => { 'hint' => ['manager', 'Nell Brook'] },
        'in a nested array' => { 'hint' => [['staff_no', ['40517']]] }
      }.each do |label, extra|
        found = tampered { |rows| rows[2]['body']['extra'] = extra }
        assert_reported found, 'helpdesk_secret', nil, label
      end
    end

    test 'tamper 17: a recovery answer in a root array answer' do
      found = tampered { |rows| rows[2]['body'] = [{ 'q' => 'x' }, %w[staff_no 40517]] }
      assert_reported found, 'helpdesk_secret', 'helpdesk:recovery:pair'
    end

    # ---- a question id or an authored non-answer inside an array is not a leak ----

    test 'an array holding a question id with no answer beside it, or a label, is clean' do
      found = tampered do |rows|
        rows[2]['body']['extra'] = { 'ids' => %w[staff_no manager], 'labels' => ['Staff number', 'Line manager'], 'staff_no' => ['not an answer'] }
      end
      assert_empty found, describe(found)
    end

    # ---- the old rules still hold in the real run ----

    test 'the stop first: the same rows with the desk\'s refusals moved to the front are not clean (the stop rule is untouched)' do
      found = tampered do |rows|
        stop = rows.select { |r| route(r) == 'helpdesk/request' && r['status'] == 422 }
        rows.replace(stop + (rows - stop))
        rows.each_with_index { |r, i| r['t'] = (Time.utc(2026, 1, 1) + i).iso8601(3) }
      end
      assert_not_empty found
    end
  end
end
