require 'test_helper'
require_relative 'ops_helpdesk_scenario_test'
require_relative 'access_leak_scanner_helpdesk_r1b_test'

module BreakEscape
  # Ops S8b fix round 2, scanner review (S8b_R2_scanner.md). Part one scans rows made by the REAL routes of the shipped
  # test_ops_helpdesk scenario (R2-SCANNER1, R2-SCANNER3); part two builds captures with the helpers of the earlier scanner test files
  # (R2-SCANNER2, R2-SCANNER4).
  class AccessLeakScannerHelpdeskR2RealTest < OpsHelpdeskScenarioTest
    OpsHelpdeskScenarioTest.instance_methods(false).grep(/\Atest_/).each { |m| undef_method m }
    WIM_NEW = 'Slate-Harrow-63'.freeze
    SCOPE_KEYS = %w[accepted forThisPc].freeze

    def scenario
      data = super
      if @wim_pw
        wim = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'wim' }
        wim['creds']['resetPassword'] = WIM_NEW
      end
      if @wim_hash
        data['credentials'] ||= {}
        data['social'] ||= {}
        data['social']['intelFacts'] ||= {}
        data['credentials']['wim_hash'] = { 'kind' => 'hash', 'account' => 'wim', 'label' => 'Stored record: Wim',
                                            'proof' => { 'held' => 'wim_hash_file' }, 'crack' => { 'password' => 'common' } }
        data['rooms']['front_office']['objects'] << { 'type' => 'text_file', 'id' => 'wim_hash_file', 'name' => 'wim_record.dat', 'takeable' => true,
                                                      'readable' => false, 'credential' => 'wim_hash', 'position' => { 'x' => 3, 'y' => 3 },
                                                      'observations' => 'A stored account record.' }
      end
      data
    end

    def scan_rows(rows, data = scenario, game: nil)
      AccessLeakScanner.new(data, **(game ? { game: game } : {})).scan(rows.each_with_index.map { |r, i| ['r2.jsonl', i + 1, r] })
    end

    def tess_entry(row)
      row['body']['entries'].find { |e| e['id'] == 'tess.reset' }
    end

    def copy(row)
      Marshal.load(Marshal.dump(row))
    end

    # ---- R2-SCANNER1: both honest forms of the pc_id keyring entry ----

    test 'R2-SCANNER1: the plain entry the server gives for a refused from route and the scoped entry for an open screen are both clean' do
      grant = ask_row(TESS[0], 'password', TESS_ANSWERS)
      assert_equal true, grant['body']['granted']
      scoped = get_row('keyring', { pc_id: 'records_pc' })
      assert_equal [true, true], SCOPE_KEYS.map { |k| tess_entry(scoped)[k] }, 'the server gave the scoped entry'
      plain = get_row('keyring', { pc_id: 'records_pc', from: 'front_pc' }) # no session at front_pc: the server leaves the scope keys out
      assert_equal [], SCOPE_KEYS & tess_entry(plain).keys, 'the server gave the plain entry'
      [scoped, plain].each do |r|
        found = scan_rows([grant, r])
        assert_empty found, found.map { |f| [f.rule, f.owner, f.json_path] }.inspect
      end
      assert_empty scan_rows([grant, scoped, plain])
    end

    test 'R2-SCANNER1: a third shape of the pc_id entry, a scope key alone, a wrong value, a wrong key, or no grant, is still reported' do
      grant = ask_row(TESS[0], 'password', TESS_ANSWERS)
      scoped = get_row('keyring', { pc_id: 'records_pc' })
      plain = get_row('keyring', { pc_id: 'records_pc', from: 'front_pc' })
      cases = {
        'plain, one scope key alone (forThisPc)' => [grant, copy(plain).tap { |r| tess_entry(r)['forThisPc'] = true }],
        'plain, one scope key alone (accepted)' => [grant, copy(plain).tap { |r| tess_entry(r)['accepted'] = true }],
        'scoped, accepted missing' => [grant, copy(scoped).tap { |r| tess_entry(r).delete('accepted') }],
        'scoped, forThisPc false' => [grant, copy(scoped).tap { |r| tess_entry(r)['forThisPc'] = false }],
        'scoped, accepted wrong' => [grant, copy(scoped).tap { |r| tess_entry(r)['accepted'] = !tess_entry(r)['accepted'] }],
        'plain, a third key' => [grant, copy(plain).tap { |r| tess_entry(r)['extra'] = 1 }],
        'scoped, a third key' => [grant, copy(scoped).tap { |r| tess_entry(r)['extra'] = 1 }],
        'plain, no grant' => [plain],
        'scoped, no grant' => [scoped],
        'plain, the password in another key' => [grant, copy(plain).tap { |r| r['body']['captures'] = { 'x' => TESS_NEW } }],
        'plain, a different scope key name' => [grant, copy(plain).tap { |r| tess_entry(r)['forThisPC'] = true }]
      }
      cases.each do |label, rows|
        assert(scan_rows(rows).any? { |f| f.owner.start_with?('helpdesk:') }, label)
      end
    end

    test 'R3-SCANNER3: the scoped entry under a query that names no sign-in PC is reported' do
      grant = ask_row(TESS[0], 'password', TESS_ANSWERS)
      scoped = get_row('keyring', { pc_id: 'records_pc' })
      assert(scan_rows([grant, scoped]).empty?, 'the honest scoped row is clean')
      ['pc_id=ghost_pc', 'pc_id=audit_log_pc', 'pc_id=ghost_pc&pc_id=records_pc', 'pc_id=records_pc&pc_id=ghost_pc',
       'pc_id=records_pc;pc_id=ghost_pc', 'pc_id=ghost_pc;pc_id=records_pc'].each do |q|
        r = copy(scoped)
        r['query'] = q
        assert(scan_rows([grant, r]).any? { |f| f.owner.start_with?('helpdesk:') }, q)
      end
    end

    # ---- R3-SCANNER3: one account with a cracked entry and a reset entry ----

    test 'R3-SCANNER3: a cracked entry and a reset entry of one account are each judged on their own proof' do
      @wim_pw = true
      @wim_hash = true
      build
      @log = []
      take_row('wim_hash_file', 'text_file', 'wim_record.dat')
      get_row('keyring', {}, :k0)
      post_row('crack', { hash_id: 'wim_hash', facts: [] }, :crack)
      get_row('keyring', {}, :k_cracked)
      ask_row(WIM[0], 'password', WIM_ANSWERS, :grant)
      get_row('keyring', {}, :k_both)
      both = @log.last
      old = WIM[1]
      ids = both['body']['entries'].map { |e| e['id'] }
      assert_includes ids, 'wim.cracked'
      assert_includes ids, 'wim.reset'
      game = Game.find(@game.id)
      found = scan_rows(@log, scenario, game: game)
      assert_empty found, found.map { |f| [f.rule, f.owner, f.line] }.inspect
      entry = ->(rows, id) { rows.last['body']['entries'].find { |e| e['id'] == id } }
      owners = lambda do |rows|
        scan_rows(rows, scenario, game: game).map { |f| [f.rule, f.owner] }
      end
      swapped = copy_rows(@log)
      entry.call(swapped, 'wim.cracked')['password'] = WIM_NEW
      assert(owners.call(swapped).any? { |r, _| r == 'crack_unearned' }, 'cracked entry carrying the reset password')
      reset_old = copy_rows(@log)
      entry.call(reset_old, 'wim.reset')['password'] = old
      assert(owners.call(reset_old).any? { |_, o| o.start_with?('helpdesk:') }, 'reset entry carrying the cracked password')
      no_crack = copy_rows(@log)
      no_crack.delete_at(@log.index { |r| r['path'].end_with?('/crack') })
      assert(owners.call(no_crack).any? { |r, _| r == 'crack_unearned' }, 'a cracked entry with no crack proof')
    end

    def copy_rows(rows)
      Marshal.load(Marshal.dump(rows))
    end

    # ---- R2-SCANNER3: a repeat password grant drops nothing on the server ----

    test 'R2-SCANNER3: an honest own-phone approval after a REPEAT password grant is clean' do
      @wim_pw = true
      build
      @log = []
      ask_row(WIM[0], 'password', WIM_ANSWERS)
      ask_row(WIM[0], 'mfa', WIM_ANSWERS)
      sign_in_row('ops_pc', [WIM[0], WIM_NEW])
      get_row('mfa/phone', { own: 1 })
      repeat = ask_row(WIM[0], 'password', WIM_ANSWERS)
      assert_equal true, repeat['body']['granted']
      assert_includes state['mfaPending'].keys, 'ops_pc', 'the server kept the pending step'
      post "#{game_path('mfa/approve')}?own=1", params: { pc_id: 'ops_pc' }, as: :json
      a = rec
      assert_equal 'own_phone', a['body']['approvedBy']
      found = scan_rows(@log)
      assert_empty found, found.map { |f| [f.rule, f.owner, f.line] }.inspect
    end
  end

  class AccessLeakScannerHelpdeskR2Test < AccessLeakScannerHelpdeskR1bTest
    AccessLeakScannerHelpdeskR1bTest.instance_methods(false).grep(/\Atest_/).each { |m| undef_method m }

    # ---- R2-SCANNER2: a first password grant clears the wrong-code count on the server ----

    def lockout_rows(*ns)
      @lockout_fixture ||= File.readlines(File.expand_path('../../fixtures/files/ops_mfa_verify_lockout_rows.jsonl', __dir__)).map { |l| JSON.parse(l) }.to_h { |r| [r['n'], r] }
      ns.map { |n| Marshal.load(Marshal.dump(@lockout_fixture.fetch(n))) }
    end

    def scan_with_game(rows, data)
      AccessLeakScanner.new(data, game: Game.new(scenario_data: data)).scan(rows.each_with_index.map { |r, i| ['lock.jsonl', i + 1, r] })
    end

    test 'R2-SCANNER2: a lock answer the server cannot give after a credited password grant is reported' do
      data = scenario
      assert_empty scan_with_game(lockout_rows(*(54..63)), data), 'control: eight wrong codes, the lock on the eighth'
      assert_includes rules(scan_with_game(lockout_rows(60, 61, 62, 63), data)), 'lockout_list', 'control: two wrong codes are not a lock'
      # six wrong codes, the grant (the server clears the count), then two more wrong codes and a lock: the server cannot lock there
      attack = lockout_rows(*(54..59)) + [grant_pw('body.lockoutPcIds' => [])] + lockout_rows(60, 61, 62, 63)
      assert_includes rules(scan_with_game(attack, data)), 'lockout_list'
    end

    test 'R2-SCANNER2: a grant before any wrong code changes nothing for the lock rule' do
      assert_empty scan_with_game([grant_pw('body.lockoutPcIds' => [])] + lockout_rows(*(54..63)), scenario)
    end

    test 'R2-SCANNER2 limit: the honest lock after wrong codes and a grant is reported (the scanner marks the pair unknown, never clears it)' do
      honest = lockout_rows(*(54..59)) + [grant_pw('body.lockoutPcIds' => [])] + lockout_rows(*(54..63))
      assert_includes rules(scan_with_game(honest, scenario)), 'lockout_list'
    end

    # ---- R2-SCANNER4: the owner named twice ----

    test 'R2-SCANNER4: the old phone list is a finding when ANY npc_id value is a re-enrolled account' do
      data = scenario
      list = { 'requests' => [{ 'pcId' => 'code_pc1', 'host' => 'x', 'username' => 'u', 'n' => 1 }] }
      ['npc_id=hana', 'npc_id=nia&npc_id=hana', 'npc_id=hana&npc_id=nia'].each do |q|
        found = scan([grant_mfa, row('GET', 'mfa/phone', { 'status' => 200, 'body' => list }, query: q)], data)
        assert_includes helpdesk_owners(found), 'helpdesk:old:phone', q
      end
      ['npc_id=nia;npc_id=hana', 'npc_id=hana;npc_id=nia', 'x=1;npc_id=hana', 'npc_id=hana;x=1'].each do |q|
        found = scan([grant_mfa, row('GET', 'mfa/phone', { 'status' => 200, 'body' => list }, query: q)], data)
        assert_includes helpdesk_owners(found), 'helpdesk:old:phone', q
      end
      ['npc_id=nia&npc_id=nia', 'npc_id=nia&x=1', 'npc_id=nia;x=1'].each do |q|
        assert_empty helpdesk_only(scan([grant_mfa, row('GET', 'mfa/phone', { 'status' => 200, 'body' => list }, query: q)], data)), q
      end
    end

    test 'R2-SCANNER4: the old device code is a finding when ANY item_id value is the re-enrolled account\'s device' do
      data = scenario
      device = { 'deviceId' => 'hana_device', 'displayName' => npc_of(data, 'hana')['displayName'] || 'hana', 'npcId' => 'hana', 'code' => '111222', 'secondsLeft' => 5, 'used' => false }
      ['item_id=hana_device&item_id=nia_device', 'item_id=nia_device&item_id=hana_device', 'item_id=nia_device;item_id=hana_device',
       'x=1;item_id=hana_device', 'item_id=hana_device;x=1'].each do |q|
        found = scan([grant_mfa, own_device('hana'), take('hana_device'), row('GET', 'mfa/device', { 'status' => 200, 'body' => device }, query: q)], data)
        assert_includes helpdesk_owners(found), 'helpdesk:old:code', q
      end
    end
  end
end
