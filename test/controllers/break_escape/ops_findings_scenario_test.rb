require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops core S2 (OPS_CORE_PLAN.md 11.4, the `test_ops_findings` beats): the real
  # scenarios/test_ops_findings/scenario.json.erb driven through the routes, each assertion read from
  # a re-read game or a fresh answer. The in-browser part is PLAYTEST.md's.
  class OpsFindingsScenarioTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_findings/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    ANNEX = 'jack_annex_port'.freeze
    NOT_FOUND = { 'success' => false, 'reason' => 'not_found' }.freeze
    FACTORY = 'printer01.admin_page.factory_login'.freeze
    BANNER = 'printer01.admin_page.old_banner'.freeze
    FIRMWARE = 'camrec01.stream.old_firmware'.freeze
    SHARE = 'files01.files.open_share'.freeze
    ARCHIVE = 'files01.backup.archive_login'.freeze
    LISTING = 'files01.backup.backup_list'.freeze
    UNCONFIRMED_KEYS = %w[id alias hostId service class severity summary status].freeze
    SUMMARIES = ['still accepts the account it shipped with', 'reports an old build number', 'firmware date from years ago',
                 'open to anyone on the network', 'shared between several people', 'without signing in'].freeze
    REASONS = ['The build number is cosmetic', 'leftover from the factory image'].freeze
    NEVER = %w[grants fixedIf share_locked needs.session technique].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(player_state = {})
      build_network_game({ 'unlockedRooms' => %w[lobby comms_room supply_room], 'encounteredNPCs' => %w[ian] }.merge(player_state), scenario)
    end

    def plant_at(jack)
      add_item('pc', 'kit_dropbox', 'Network drop box') unless held_ids.include?('kit_dropbox')
      body = plant(jack)
      assert_response :success, response.body
      body
    end

    def scan(foothold, **target)
      post game_path('network/scan'), params: { foothold: foothold }.merge(target), as: :json
      response.parsed_body
    end

    def check(host, service, foothold: OFFICE)
      post game_path('network/check'), params: { foothold: foothold, host_id: host, service: service }, as: :json
      response.parsed_body
    end

    def confirm(finding_id, foothold: OFFICE)
      post game_path('network/confirm'), params: { foothold: foothold, finding_id: finding_id }, as: :json
      response.parsed_body
    end

    def entry(foothold = OFFICE)
      network_view(foothold)['footholds'].find { |f| f['id'] == foothold }
    end

    def row(host_id, foothold = OFFICE)
      entry(foothold)['networks'].find { |n| n['id'] == 'office_lan' }['hosts'].find { |r| r['id'] == host_id }
    end

    def fresh
      Game.find(@game.id)
    end

    def stored
      fresh.player_state['opsFindings'] || {}
    end

    def discovered
      fresh.player_state['opsDiscovered'] || {}
    end

    def audit(event = nil)
      rows = fresh.log_rows_for('findings_audit')
      event ? rows.select { |r| r['event'] == event } : rows
    end

    def by_id(findings, id)
      findings.find { |f| f['id'] == id }
    end

    def swept_and_scanned(*hosts)
      build
      plant_at('office_port')
      scan(OFFICE, network_id: 'office_lan')
      hosts.each { |h| scan(OFFICE, host_id: h) }
    end

    # The cupboard is opened first, as the client does for a container that is not locked (an unlock
    # of method `unlocked`), then the item is taken from it.
    def take_manual
      unlock_object('supply_cupboard', 'unlocked')
      assert_response :success, response.body
      add_item('notes1', 'printer_manual', 'Printer manual')
      assert_response :success, response.body
    end

    test 'the scenario has its network, hosts, findings and log source' do
      build
      data = fresh.scenario_data
      assert_equal %w[office_lan], data['networks'].keys
      assert_equal %w[camrec01 printer01], data['hosts'].keys.sort
      assert_equal ['findings_audit'], data['logSources'].keys
      assert_equal({}, stored)
      assert_equal [], audit
      weaknesses = data['hosts'].values.flat_map { |h| h['services'] }.flat_map { |s| Array(s['weaknesses']) }
      weaknesses += data['rooms'].values.flat_map { |r| r['objects'] || [] }.flat_map { |o| Array(o['services']) }.flat_map { |s| Array(s['weaknesses']) }
      assert_equal 4, weaknesses.length
      refute weaknesses.any? { |w| w.key?('grants') || (w['needs'] || {}).key?('session') }
    end

    test 'beat 1: before a host scan a check is 404, the same for a service that does not exist; nothing is written' do
      build
      plant_at('office_port')
      scan(OFFICE, network_id: 'office_lan')
      real = [check('printer01', 'admin_page'), response.status]
      invented = [check('printer01', 'invented_service'), response.status]
      assert_equal [NOT_FOUND, 404], real
      assert_equal real, invented
      assert_equal [NOT_FOUND, 404], [check('invented_host', 'admin_page'), response.status]
      assert_equal({}, stored)
      assert_equal [], audit('service_checked') + audit('finding_confirmed')
      refute row('printer01').key?('findings')
    end

    test 'the sweep, the scan, the view, the bootstrap and the room carry no finding, class or summary' do
      swept_and_scanned('printer01', 'camrec01')
      bodies = [response.body]
      bodies << network_view(OFFICE).to_s
      get game_path('scenario'), as: :json
      bodies << response.body
      get game_path('room/lobby'), as: :json
      bodies << response.body
      scan(OFFICE, host_id: 'printer01')
      bodies << response.body
      bodies.each do |raw|
        (SUMMARIES + REASONS + %w[default_creds unpatched falseBecause factory_login old_banner]).each do |text|
          refute_includes raw, text, "an answer before any check shows #{text}"
        end
      end
      assert_equal [], row('printer01')['services'].flat_map { |s| s.keys & %w[weaknesses decoys] }
    end

    test 'beat 2: the first check lists both findings unconfirmed, same keys, id order, aliases f1 and f2; one service_checked row' do
      swept_and_scanned('printer01')
      body = check('printer01', 'admin_page')
      assert_response :success, response.body
      assert_equal [FACTORY, BANNER], body['findings'].map { |f| f['id'] }
      assert_equal %w[f1 f2], body['findings'].map { |f| f['alias'] }
      body['findings'].each do |f|
        assert_equal UNCONFIRMED_KEYS, f.keys
        assert_equal 'unconfirmed', f['status']
      end
      assert_equal 'The admin page still accepts the account it shipped with.', by_id(body['findings'], FACTORY)['summary']
      assert_nil body['already']
      %w[needs falseBecause fixed].each { |key| refute_includes response.body, key }
      assert_equal({ FACTORY => 'u1', BANNER => 'u2' }, stored)
      assert_equal 1, audit('service_checked').length
      assert_equal 0, audit('finding_confirmed').length
      assert_includes discovered['services'], 'printer01.admin_page'
      assert_equal [FACTORY, BANNER], row('printer01')['findings'].map { |f| f['id'] }
    end

    test 'beat 3: the decoy confirms false with the authored reason' do
      swept_and_scanned('printer01')
      check('printer01', 'admin_page')
      body = confirm(BANNER)
      assert_response :success, response.body
      assert_equal 'false', body['finding']['status']
      assert_equal 'The build number is cosmetic. The panel was updated last month.', body['finding']['falseBecause']
      refute body['finding'].key?('needs')
      assert_equal 'f2', stored[BANNER]
      assert_equal 1, audit('finding_confirmed').length
      assert_equal 'false', by_id(row('printer01')['findings'], BANNER)['status']
    end

    test 'beat 4: the real finding confirms and lists its need unmet; the repeat check keeps statuses and aliases and adds no row' do
      swept_and_scanned('printer01')
      check('printer01', 'admin_page')
      confirm(BANNER)
      body = confirm(FACTORY)
      assert_equal 'confirmed', body['finding']['status']
      assert_equal [{ 'kind' => 'item', 'label' => 'Printer manual', 'met' => false }], body['finding']['needs']
      refute body['finding'].key?('fixed')
      assert_equal 'c1', stored[FACTORY]
      assert_equal 2, audit('finding_confirmed').length
      again = check('printer01', 'admin_page')
      assert_equal true, again['already']
      assert_equal [%w[f1 confirmed], %w[f2 false]], again['findings'].map { |f| [f['alias'], f['status']] }
      assert_equal 1, audit('service_checked').length
      repeat = confirm(FACTORY)
      assert_equal true, repeat['already']
      assert_equal 2, audit('finding_confirmed').length
    end

    test 'beat 5: after the manual is picked up the same finding shows the need met, with nothing written' do
      swept_and_scanned('printer01')
      check('printer01', 'admin_page')
      confirm(FACTORY)
      before = [stored.dup, audit.length]
      listed = by_id(row('printer01')['findings'], FACTORY)
      assert_equal [false], listed['needs'].map { |n| n['met'] }
      take_manual
      listed = by_id(row('printer01')['findings'], FACTORY)
      assert_equal [{ 'kind' => 'item', 'label' => 'Printer manual', 'met' => true }], listed['needs']
      assert_equal true, by_id(check('printer01', 'admin_page')['findings'], FACTORY)['needs'].first['met']
      assert_equal before, [stored, audit.length]
    end

    test 'beat 6 and 7: the file server finding confirms, then the switch makes it Fixed; the stored status stays confirmed' do
      swept_and_scanned('files01')
      body = check('files01', 'files')
      assert_equal [SHARE], body['findings'].map { |f| f['id'] }
      confirmed = confirm(SHARE)['finding']
      assert_equal 'confirmed', confirmed['status']
      assert_equal [], confirmed['needs']
      refute confirmed.key?('fixed')
      stale = by_id(row('files01')['findings'], SHARE)
      refute stale.key?('fixed')
      sync_globals('share_locked' => true)
      assert_response :success, response.body
      fixed = by_id(row('files01')['findings'], SHARE)
      assert_equal 'confirmed', fixed['status']
      assert_equal true, fixed['fixed']
      assert_equal 'c1', stored[SHARE]
    end

    test 'a fixed weakness not yet confirmed shows no sign of being fixed' do
      swept_and_scanned('files01')
      check('files01', 'files')
      before = row('files01')['findings'].first.dup
      sync_globals('share_locked' => true)
      after = row('files01')['findings'].first
      assert_equal UNCONFIRMED_KEYS, after.keys
      assert_equal before, after
    end

    test 'beat 8: the camera recorder has only a decoy; its one finding confirms false' do
      swept_and_scanned('camrec01')
      body = check('camrec01', 'stream')
      assert_equal [FIRMWARE], body['findings'].map { |f| f['id'] }
      assert_equal 'false', confirm(FIRMWARE)['finding']['status']
      assert_equal 'The date is a leftover from the factory image. The firmware was replaced when the unit was installed.',
                   by_id(row('camrec01')['findings'], FIRMWARE)['falseBecause']
    end

    test 'beat 8a: the second file service lists two findings; one needs a login nobody gives, one needs nothing' do
      swept_and_scanned('files01')
      body = check('files01', 'backup')
      assert_equal [ARCHIVE, LISTING], body['findings'].map { |f| f['id'] }
      archive = confirm(ARCHIVE)['finding']
      listing = confirm(LISTING)['finding']
      assert_equal [{ 'kind' => 'credential', 'label' => 'Note: archive login', 'met' => false }], archive['needs']
      assert_equal [], listing['needs']
      assert_equal 2, audit('finding_confirmed').length
      repeat = confirm(ARCHIVE)
      assert_equal true, repeat['already']
      assert_equal 2, audit('finding_confirmed').length
      assert_equal false, by_id(row('files01')['findings'], ARCHIVE)['needs'].first['met']
    end

    test 'beat 8b: a sync body cannot write opsFindings or opsDiscovered' do
      swept_and_scanned('printer01')
      check('printer01', 'admin_page')
      before = [stored.dup, discovered.deep_dup]
      put game_path('sync_state'), params: { opsFindings: { FACTORY => 'c9', 'files01.files.open_share' => 'c8' },
                                             opsDiscovered: { 'networks' => [], 'hosts' => [], 'services' => ['files01.files'] } }, as: :json
      assert_equal before, [stored, discovered]
      assert_equal [NOT_FOUND, 404], [confirm(SHARE), response.status]
    end

    test 'beat 9: an invented id and a weakness never checked get the same 404' do
      swept_and_scanned('printer01', 'files01')
      check('printer01', 'admin_page')
      invented = [confirm('printer01.admin_page.nothing_here'), response.status, response.body.gsub('nothing_here', '<id>')]
      unchecked = [confirm(SHARE), response.status, response.body.gsub('open_share', '<id>')]
      assert_equal [NOT_FOUND, 404], invented.first(2)
      assert_equal invented.first(2), unchecked.first(2)
      assert_equal invented.last.gsub('nothing_here', '<id>'), unchecked.last.gsub('open_share', '<id>')
      assert_equal({ FACTORY => 'u1', BANNER => 'u2' }, stored)
      assert_nil stored[SHARE]
    end

    test 'beat 10: a reload and a replant at the other port show every finding as it was' do
      swept_and_scanned('printer01', 'files01')
      check('printer01', 'admin_page')
      confirm(BANNER)
      confirm(FACTORY)
      check('files01', 'files')
      before = row('printer01')['findings']
      files = row('files01')['findings']
      bootstrap_scenario
      assert_response :success, response.body
      assert_equal before, row('printer01')['findings']
      assert_equal files, row('files01')['findings']
      unplug('office_port')
      plant_at('annex_port')
      assert_equal before, row('printer01', ANNEX)['findings']
      assert_equal files, row('files01', ANNEX)['findings']
      assert_equal 'f2', stored[BANNER]
    end

    test 'beat 11: with the switch flipped first, checking the file server lists nothing; the repeat is already; no entry is stored' do
      swept_and_scanned('files01')
      sync_globals('share_locked' => true)
      first = check('files01', 'files')
      assert_response :success, response.body
      assert_equal [], first['findings']
      assert_nil first['already']
      again = check('files01', 'files')
      assert_equal true, again['already']
      assert_equal [], again['findings']
      assert_equal({}, stored)
      assert_includes discovered['services'], 'files01.files'
      assert_equal 1, audit('service_checked').length
      refute row('files01').key?('findings')
      assert_equal [NOT_FOUND, 404], [confirm(SHARE), response.status]
    end

    test 'beat 12: every answer of a whole run holds no grants, fixedIf or global name, and no reason or need before its confirm' do
      swept_and_scanned('printer01', 'files01')
      raws = []
      take = -> { raws << response.body }
      check('printer01', 'admin_page')
      take.call
      assert_nil (JSON.parse(response.body)['findings'] || []).find { |f| f.key?('falseBecause') || f.key?('needs') }
      network_view(OFFICE)
      take.call
      REASONS.each { |text| refute_includes response.body, text, 'a view before a confirm shows a reason' }
      %w[needs falseBecause fixed].each { |key| refute_includes response.body, "\"#{key}\"", "a view before a confirm carries #{key}" }
      confirm(BANNER)
      take.call
      confirm(FACTORY)
      take.call
      check('files01', 'files')
      take.call
      sync_globals('share_locked' => true)
      confirm(SHARE)
      take.call
      network_view(OFFICE)
      take.call
      raws.each { |raw| NEVER.each { |text| refute_includes raw, text, "an answer holds #{text}" } }
    end
  end
end
