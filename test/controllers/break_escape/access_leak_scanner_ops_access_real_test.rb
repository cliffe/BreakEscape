require 'test_helper'
require_relative '../../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops core S3 post-landing tidy (S2S3 R3-4): the leak scanner run over REAL answers of a game of
  # scenarios/test_ops_access, played as ops_access_scenario_test plays it (sweep, scans, checks, confirms, two
  # cards picked up, a credential grant, a session grant at the blocked vault host, its step up, a second
  # foothold). The answers are recorded as the browser's log would hold them (inventory adds carry the
  # recorder's `inv` tag); the whole run must report nothing, and one fault at a time is injected into a copy
  # of one answer and must be reported. The grant answers are judged untagged, so the scanner reads the finding
  # from the answer, as it must for a log made before the recorder tagged requests.
  class AccessLeakScannerOpsAccessRealTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_access/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    ANNEX = 'jack_annex_port'.freeze
    PRINTER = 'printer01.admin_page.factory_login'.freeze
    FIRST = 'vault01.archive.old_release'.freeze
    SECOND = 'vault01.archive.old_release_admin'.freeze
    ALL_FINDINGS = %w[printer01.admin_page.factory_login printer01.admin_page.old_banner files01.files.open_share
                      files01.backup.backup_list desk01.remote_desk.shipped_login vault01.archive.old_release
                      vault01.archive.old_release_admin].freeze
    CHECKS = [%w[printer01 admin_page], %w[files01 files], %w[files01 backup], %w[vault01 archive], %w[desk01 remote_desk]].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    # One recorded answer, in the browser log's shape; `inv` and `tech` are the recorder's tags.
    def rec(extra = {})
      @log << { 'method' => request.request_method, 'path' => request.path, 'status' => response.status,
                'body' => response.parsed_body }.merge(extra)
      @log.last
    end

    def take(type, id, name, container: nil)
      if container
        unlock_object(container, 'unlocked')
        rec
      end
      add_item(type, id, name)
      rec('inv' => { 'action' => 'add', 'itemId' => id, 'usedOn' => nil })
    end

    def view_at(foothold)
      network_view(foothold)
      rec
    end

    def grant(finding, card, foothold: OFFICE)
      ops_technique(foothold, finding, card)
      assert_response :success, response.body
      rec
    end

    # The played run. @marks names the rows a test injects into.
    def run_game
      @log = []
      @marks = {}
      build_network_game({ 'unlockedRooms' => %w[lobby comms_room supply_room back_office], 'encounteredNPCs' => %w[ian] }, scenario)
      bootstrap_scenario
      rec
      get game_path('room/lobby'), as: :json
      rec
      take('technique_card', 'card_factory', 'Field note: factory accounts', container: 'lobby_cabinet')
      take('notes1', 'printer_manual', 'Printer manual', container: 'supply_cupboard')
      take('pc', 'kit_dropbox', 'Network drop box')
      plant('office_port')
      rec
      ops_scan(OFFICE, network_id: 'office_lan')
      rec
      %w[printer01 files01 vault01 desk01].each do |h|
        ops_scan(OFFICE, host_id: h)
        rec
      end
      CHECKS.each do |host, service|
        ops_check(OFFICE, host_id: host, service: service)
        row = rec
        @marks[:printer_check] ||= row
      end
      @marks[:checked_view] = view_at(OFFICE)
      ALL_FINDINGS.each do |id|
        ops_confirm(OFFICE, id)
        rec
      end
      get game_path('keyring'), as: :json
      @marks[:keyring_before] = rec
      @marks[:view_before_grant] = view_at(OFFICE)
      @marks[:credential_grant] = grant(PRINTER, 'card_factory')
      get game_path('keyring'), as: :json
      rec
      sign_in_credential
      take('technique_card', 'card_release', 'Field note: storage updates')
      @marks[:view_before_session] = view_at(OFFICE)
      @marks[:session_grant] = grant(FIRST, 'card_release')
      get game_path('container/vault01'), params: { foothold: OFFICE }, as: :json
      @marks[:container] = rec
      @marks[:view_with_session] = view_at(OFFICE)
      @marks[:admin_grant] = grant(SECOND, 'card_release')
      @marks[:view_admin] = view_at(OFFICE)
      take('pc', 'kit_dropbox_2', 'Spare drop box')
      plant('annex_port')
      rec
      @marks[:annex_view] = view_at(ANNEX)
      @log
    end

    def sign_in_credential
      post game_path('login'), params: { pc_id: 'files01', credential: 'print_admin', foothold: OFFICE }, as: :json
      assert_response :success, response.body
      rec
    end

    def lines(rows)
      rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }
    end

    def scan(rows)
      AccessLeakScanner.new(scenario).scan(lines(rows))
    end

    def deep(row)
      Marshal.load(Marshal.dump(row))
    end

    def owners(findings)
      findings.map(&:owner).uniq.sort
    end

    # Judges `replacement` in the place of the logged row `mark`, after every row that came before it.
    def judged_in_place(mark, replacement)
      index = @log.index { |r| r.equal?(mark) }
      rows = @log.first(index) + [replacement]
      scan(rows).select { |f| f.line == index + 1 }
    end

    def first_host(row, id)
      row['body']['footholds'].first['hosts'].find { |h| h['id'] == id }
    end

    test 'the whole played run, uninjected, reports nothing' do
      run_game
      assert_operator @log.length, :>, 40
      assert_equal [], scan(@log).map { |f| [f.line, f.rule, f.owner, f.route] }
      assert_equal 'session', @marks[:session_grant]['body']['grant']
      assert_equal 'credential', @marks[:credential_grant]['body']['grant']
      assert_equal 'admin', @marks[:admin_grant]['body']['session']['access']
    end

    test 'the same run with each grant tagged by the recorder reports nothing' do
      run_game
      tagged = @log.map do |r|
        next r unless r['path'].end_with?('/network/technique')

        finding = { @marks[:credential_grant] => PRINTER, @marks[:session_grant] => FIRST, @marks[:admin_grant] => SECOND }[r]
        finding ? r.merge('tech' => { 'findingId' => finding }) : r
      end
      assert_equal [], scan(tagged).map { |f| [f.line, f.rule, f.owner] }
    end

    test 'a techniques entry for a card not held is reported in the view' do
      run_game
      row = deep(@marks[:checked_view])
      row['body']['techniques'] = { 'release_notes' => { 'name' => 'Release notes', 'worksOn' => { 'class' => 'unpatched' }, 'itemId' => 'card_release' } }
      assert_includes owners(judged_in_place(@marks[:checked_view], row)), 'ops:technique:release_notes'
    end

    test 'a held card entry that names a card item not held is reported' do
      run_game
      row = deep(@marks[:view_before_session])
      entry = row['body']['techniques']['factory_accounts']
      assert entry, 'the view carries the held factory card'
      entry['itemId'] = 'card_older'
      assert_includes owners(judged_in_place(@marks[:view_before_session], row)), 'ops:technique:factory_accounts'
    end

    test 'openHere in the view of another foothold than the one the session came through is reported' do
      run_game
      row = deep(@marks[:annex_view])
      vault = first_host(row, 'vault01')
      assert vault, 'the annex view lists the vault host'
      vault['session'] = { 'username' => 'iokafor', 'displayName' => 'Ian Okafor', 'via' => 'technique', 'remote' => true, 'openHere' => true }
      found = judged_in_place(@marks[:annex_view], row)
      assert_includes owners(found), 'ops:key:openHere'
      assert_empty judged_in_place(@marks[:annex_view], deep(@marks[:annex_view])), 'the real annex view is clear'
    end

    test 'the credential id before its grant is reported in the keyring and in a view' do
      run_game
      row = deep(@marks[:keyring_before])
      row['body']['entries'] << { 'id' => 'print_admin', 'label' => 'Print admin', 'kind' => 'saved_connection' }
      assert_includes owners(judged_in_place(@marks[:keyring_before], row)), "ops:grant:#{PRINTER}"
      view = deep(@marks[:view_before_grant])
      view['body']['footholds'].first['extra'] = 'print_admin'
      assert_includes owners(judged_in_place(@marks[:view_before_grant], view)), "ops:grant:#{PRINTER}"
    end

    test 'via technique and admin access on the vault row before their grants are reported' do
      run_game
      row = deep(@marks[:view_before_session])
      vault = first_host(row, 'vault01')
      vault['session'] = { 'username' => 'iokafor', 'via' => 'technique' }
      assert_includes owners(judged_in_place(@marks[:view_before_session], row)), 'ops:key:via'
      step_up = deep(@marks[:view_with_session])
      first_host(step_up, 'vault01')['session']['access'] = 'admin'
      assert_includes owners(judged_in_place(@marks[:view_with_session], step_up)), 'ops:key:access'
    end

    test 'the finding id as a technique key in the session answer, and a changed grant answer shape, are reported' do
      run_game
      grant = deep(@marks[:session_grant])
      grant['body']['session']['technique'] = FIRST
      assert_includes owners(judged_in_place(@marks[:session_grant], grant)), 'ops:key:technique'
      shaped = deep(@marks[:credential_grant])
      shaped['body']['session'] = { 'npcId' => 'ian' }
      assert_includes owners(judged_in_place(@marks[:credential_grant], shaped)), 'ops:technique:answer'
    end

    test 'a services key in the room answer and the host names before the sweep are reported' do
      run_game
      room = deep(@log[1])
      room['body']['objects'] ||= []
      room['body']['objects'] << { 'id' => 'extra_obj', 'services' => [] }
      assert_includes owners(judged_in_place(@log[1], room)), 'ops:key:services'
    end

    test 'an ops key or a listed device row in the unswept plant network block is reported; the real block is clear' do
      run_game
      real = @marks[:view_with_session]
      block = real['body']['footholds'].first['networks'].find { |b| b['id'] == 'plant_lan' }
      assert block, 'the view shows the plant network once the vault session is held'
      assert_equal [], block['hosts'], 'unswept: no host listed'
      assert_empty judged_in_place(real, deep(real))
      with_ops = deep(real)
      with_ops['body']['footholds'].first['networks'].find { |b| b['id'] == 'plant_lan' }['ops'] = true
      assert_includes owners(judged_in_place(real, with_ops)), 'ops:network:plant_lan'
      with_row = deep(real)
      with_row['body']['footholds'].first['networks'].find { |b| b['id'] == 'plant_lan' }['hosts'] << { 'id' => 'pumpctl01', 'kind' => 'device', 'sprite' => 'x' }
      assert_includes owners(judged_in_place(real, with_row)), 'ops:network:plant_lan'
    end
  end
end
