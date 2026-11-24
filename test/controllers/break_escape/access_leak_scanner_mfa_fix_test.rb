require_relative 'access_leak_scanner_mfa_real_test'

module BreakEscape
  # Ops S8a fix, leak scanner review R1 (R1-L1 to R1-L14): each case is a copy of the real run of
  # `access_leak_scanner_mfa_real_test.rb` (`run_game`), doctored the way the review's scratch attempts did, or the honest run
  # as the browser records it (no `login` tag: the recorder writes none). The honest cases must report nothing; each answer
  # the server would never give must be a finding.
  class AccessLeakScannerMfaFixTest < AccessLeakScannerMfaRealTest
    AccessLeakScannerMfaRealTest.instance_methods(false).grep(/\Atest_/).each { |m| undef_method m }

    SESSION = ->(npc) { ['mfa_session', "mfa:session:#{npc}"] }

    # R2-L1: the browser opens the desktop of the PC it has just signed in at, and a `--signin` name stands only when that
    # desktop row follows its sign-in. So the honest run holds one `GET container/<pc>` row after each keyboard sign-in.
    def sign_in_row(pc, creds, mark, foothold: nil)
      login = super
      body = login['body']
      if body.is_a?(Hash) && body['success'] == true
        session = body.slice('npcId', 'username', 'displayName', 'via', 'portrait')
        @log << { 't' => (Time.utc(2026, 1, 1) + @log.length).iso8601(3), 'method' => 'GET', 'status' => 200,
                  'path' => login['path'].sub(%r{/login\z}, "/container/#{pc}"),
                  'body' => { 'container_id' => pc, 'contents' => [], 'session' => session } }
      end
      login
    end

    def idx(mark)
      @log.index { |r| r.equal?(@marks[mark]) }
    end

    def copy
      @log.map { |r| deep(r) }
    end

    # The run as the browser recorder writes it: no `login` tag on any row.
    def browser_run
      copy.each { |r| r.delete('login') }
    end

    def scan_all(rows, data: scenario, **opts)
      scanner = AccessLeakScanner.new(data)
      findings = scanner.scan(rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] }, **opts)
      [findings, scanner]
    end

    def mfa_of(rows, **opts)
      mfa(scan_all(rows, **opts).first)
    end

    def row(method, tail, body, extra = {})
      base = @marks[:lock]['path'].sub(%r{/lock_session\z}, '')
      { 't' => '2026-01-01T01:00:00.000Z', 'method' => method, 'path' => "#{base}/#{tail}", 'status' => 200, 'body' => body }.merge(extra)
    end

    def sessions_of(mark)
      deep(@marks[mark]['body']['sessions'])
    end

    # ---- R1-L1: --signin, --logout and the unnamed browser run --------------------------------------------------------

    test 'R1-L1 the honest browser run (no login tags) is clean with the two names and reports the two sessions without them' do
      run_game
      assert_equal [SESSION.call('cal'), SESSION.call('hana')].sort, mfa_of(browser_run)
      findings, scanner = scan_all(browser_run, signins: %w[hana@code_pc1#1 cal@plain_pc#1])
      assert_equal [], findings.map { |f| [f.line, f.rule, f.owner] }
      assert_equal [], scanner.unused_entries
      # by the row's time
      rows = browser_run
      times = [@marks[:unlock], @marks[:plain_signin]].map { |r| r['t'] }
      findings, scanner = scan_all(rows, signins: ["hana@code_pc1@#{times[0]}", "cal@plain_pc@#{times[1]}"])
      assert_equal [], findings.map { |f| [f.rule, f.owner] }
      assert_equal [], scanner.unused_entries
    end

    test 'R1-L1 a name earns no session by itself: the step PC still needs the step or a real lock' do
      run_game
      # the unlock with no lock before it, named at the step PC
      assert_includes mfa_of(without(:lock).each { |r| r.delete('login') }, signins: %w[hana@code_pc1#1 cal@plain_pc#1]), SESSION.call('hana')
      # the whole step left out, the sign-in named at the step PC
      assert_includes mfa_of(without(:hana_required, :wrong_code, :pass_code, :lock).each { |r| r.delete('login') }, signins: %w[hana@code_pc1#1 cal@plain_pc#1]), SESSION.call('hana')
      # Cal's sign-in at Shipping PC left unnamed could be the push PC's
      assert_includes mfa_of(browser_run, signins: %w[hana@code_pc1#1]), SESSION.call('cal')
    end

    test 'R1-L1 a name that is wrong, used twice or unused is refused (exit 2)' do
      run_game
      # the wrong account for the PC: the PC does not admit it
      assert_raises(ArgumentError) { scan_all(browser_run, signins: %w[cal@code_pc1#1]) }
      assert_raises(ArgumentError) { scan_all(browser_run, signins: %w[hana@push_pc#1 cal@plain_pc#1]) }
      assert_raises(ArgumentError) { scan_all(browser_run, signins: %w[nobody@plain_pc#1]) }
      # the same entry twice
      assert_raises(ArgumentError) { scan_all(browser_run, signins: %w[cal@plain_pc#1 cal@plain_pc#1]) }
      # the same row named twice, by number and by time: the second entry matches nothing
      t = @marks[:plain_signin]['t']
      _f, scanner = scan_all(browser_run, signins: ['hana@code_pc1#1', 'cal@plain_pc#1', "cal@plain_pc@#{t}"])
      assert_equal ["cal@plain_pc@#{t} (--signin)"], scanner.unused_entries
      # a row that is not there
      _f, scanner = scan_all(browser_run, signins: %w[hana@code_pc1#1 cal@plain_pc#1 cal@plain_pc#2])
      assert_equal ['cal@plain_pc#2 (--signin)'], scanner.unused_entries
      # the name given to a row that a tag or a host label already placed is not used
      _f, scanner = scan_all(copy, signins: %w[hana@code_pc1#1])
      assert_equal ['hana@code_pc1#1 (--signin)'], scanner.unused_entries
    end

    test 'R1-L1 a name pointing at a PC with no step is refuted when the next rows show the step PC desktop' do
      run_game
      session = { 'npcId' => 'hana', 'via' => 'password', 'username' => 'hquill' }
      desk = ->(pc) { row('GET', "container/#{pc}", { 'session' => session }) }
      # a bypass: the step left out, Hana's sign-in at Accounts PC (a finding) ...
      bypass = lambda do
        rows = without(:hana_required, :wrong_code, :pass_code, :lock).each { |r| r.delete('login') }
        [rows, rows.index { |r| r['body'] == @marks[:unlock]['body'] }]
      end
      rows, i = bypass.call
      assert_includes mfa_of(rows, signins: %w[hana@code_pc1#1 cal@plain_pc#1]), SESSION.call('hana')
      # ... named at Shipping PC (no step, admits her) it would pass, so the desktop that follows must agree
      rows, i = bypass.call
      rows.insert(i + 1, desk.call('code_pc1'))
      error = assert_raises(ArgumentError) { scan_all(rows, signins: %w[hana@plain_pc#1 cal@plain_pc#1]) }
      assert_match(/hana@plain_pc/, error.message)
      # the desktop of the PC it was named at is no refutation
      rows, i = bypass.call
      rows.insert(i + 1, desk.call('plain_pc'))
      assert_nothing_raised { scan_all(rows, signins: %w[hana@plain_pc#1 cal@plain_pc#1]) }
      # honestly named at the step PC, the desktop agrees
      rows = browser_run
      rows.insert(rows.index { |r| r['body'] == @marks[:unlock]['body'] } + 1, desk.call('code_pc1'))
      assert_equal [], mfa_of(rows, signins: %w[hana@code_pc1#1 cal@plain_pc#1])
    end

    test 'R1-L1 a named logout ends that PC only; an unnamed one ends every earned session' do
      run_game
      # after Ines passes at code_pc2: a logout, then a bootstrap that lists Cal's session at the push PC
      listing = ->(pcs) { { 'sessions' => pcs } }
      cal_session = sessions_of(:boot_end).values.find { |s| s['npcId'] == 'cal' }
      skip 'boot_end holds no Cal session' unless cal_session
      build = lambda do
        rows = browser_run
        i = rows.index { |r| r['body'] == @marks[:cal_pass]['body'] }
        j = rows.index { |r| r['body'] == @marks[:ines_pass]['body'] }
        # the desktop of the PC the sign-out was at shows nobody: the answer that confirms the named logout
        rows.insert(j + 1, row('POST', 'logout', { 'success' => true }), row('GET', 'scenario', listing.call('push_pc' => cal_session)),
                    row('GET', 'container/code_pc2', { 'container_id' => 'code_pc2', 'contents' => [], 'session' => nil }))
        [rows, i, j]
      end
      rows, = build.call
      assert_includes mfa_of(rows, signins: %w[hana@code_pc1#1 cal@plain_pc#1]), SESSION.call('cal')
      rows, = build.call
      findings, scanner = scan_all(rows, signins: %w[hana@code_pc1#1 cal@plain_pc#1], logouts: %w[ines@code_pc2#2])
      assert_equal [], findings.map { |f| [f.rule, f.owner] }
      assert_equal [], scanner.unused_entries
      # the named logout is refuted when the next bootstrap still lists that account at that PC
      rows, _i, j = build.call
      rows.insert(j + 2, row('GET', 'scenario', listing.call('code_pc2' => { 'npcId' => 'ines', 'via' => 'password' })))
      assert_raises(ArgumentError) { scan_all(rows, signins: %w[hana@code_pc1#1 cal@plain_pc#1], logouts: %w[ines@code_pc2#2]) }
      # a named logout of an account the run does not hold at that PC is unused
      rows, = build.call
      _f, scanner = scan_all(rows, signins: %w[hana@code_pc1#1 cal@plain_pc#1], logouts: %w[ines@code_pc1#2])
      assert_equal ['ines@code_pc1#2 (--logout)'], scanner.unused_entries
    end

    # ---- R1-L2: the lock mark is used up, another sign-in replaces the session --------------------------------------

    test 'R1-L2 one lock allows one unlock; another account at the PC takes the earned session away' do
      run_game
      rows = copy
      rows.insert(idx(:unlock) + 1, deep(@marks[:unlock]))
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      # lock, unlock, lock, unlock is honest
      rows = copy
      rows.insert(idx(:unlock) + 1, deep(@marks[:lock]), deep(@marks[:unlock]))
      assert_equal [], mfa(scan(rows))
      # Ines locks at code_pc2, the Sync service signs in there, then a sign-in for Ines with no step
      rows = copy
      rows.insert(idx(:ines_pass) + 1, row('POST', 'lock_session', { 'success' => true, 'pcId' => 'code_pc2', 'locked' => true }))
      j = rows.index { |r| r['body'].is_a?(Hash) && r['body']['npcId'] == 'svc_sync' }
      rows.insert(j + 1, row('POST', 'login', deep(@marks[:ines_pass]['body']), 'login' => { 'pcId' => 'code_pc2' }))
      assert_includes mfa(scan(rows)), SESSION.call('ines')
      # an endedPcIds entry takes it away too
      rows = copy
      i = idx(:lock)
      rows.insert(i + 1, row('POST', 'login', { 'success' => true, 'npcId' => 'svc_sync', 'via' => 'password', 'endedPcIds' => ['code_pc1'] }, 'login' => { 'pcId' => 'plain_pc' }))
      assert_includes mfa(scan(rows)), SESSION.call('hana')
    end

    # ---- R1-L3: the way in must be one the server gives at a step PC -------------------------------------------------

    test 'R1-L3 relay true alone exempts nothing; a typed answer, a saved connection and a technique answer owe the step' do
      run_game
      lockless = -> { without(:lock) }
      un = ->(rows) { rows.find { |r| r['path'].end_with?('/login') && r['body'].is_a?(Hash) && r['body']['success'] == true && r['body']['npcId'] == 'hana' && r['body']['via'] == 'password' } }
      assert_includes mfa(scan(lockless.call)), SESSION.call('hana') # control
      rows = lockless.call; un.call(rows)['body']['relay'] = true
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      rows = lockless.call; un.call(rows)['body'].merge!('via' => 'credential', 'kind' => 'saved_connection', 'relay' => true)
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      rows = lockless.call; un.call(rows)['body']['via'] = 'technique'
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      # the claim is the one server answer that skips the step at the keyboard
      rows = lockless.call; un.call(rows)['body']['via'] = 'claim'
      # the desktop that follows shows the same claim session (R3-5 reads a desktop's keyboard session)
      rows.each { |r| d = r['body'].is_a?(Hash) ? r['body']['session'] : nil; d['via'] = 'claim' if d.is_a?(Hash) && d['npcId'] == 'hana' }
      assert_equal [], mfa(scan(rows))
      # a bootstrap may still list a technique session
      rows = without(:pass_code, :hana_required, :wrong_code, :lock, :unlock, :token)
      rows.each { |r| s = r['body'].is_a?(Hash) && r['body']['sessions']; s['code_pc1']['via'] = 'technique' if s.is_a?(Hash) && s['code_pc1'] }
      # the desktop that follows shows the same technique session (R3-5)
      rows.each { |r| d = r['body'].is_a?(Hash) ? r['body']['session'] : nil; d['via'] = 'technique' if d.is_a?(Hash) && d['npcId'] == 'hana' }
      assert_equal [], mfa(scan(rows))
    end

    test 'R1-L3 an invite or a token needs a credential of that kind in the registry, for that account, at a PC it could be about' do
      run_game
      data = scenario
      data['credentials']['hana_invite'] = { 'kind' => 'assist_invite', 'account' => 'hana', 'connectsTo' => 'code_pc1', 'label' => 'Invite' }
      invite = lambda do |body = {}|
        rows = without(:lock)
        r = rows.find { |x| x['path'].end_with?('/login') && x['body'].is_a?(Hash) && x['body']['npcId'] == 'hana' && x['body']['via'] == 'password' }
        r['login'] = { 'pcId' => 'code_pc1' }
        r['body'] = { 'success' => true, 'npcId' => 'hana', 'username' => 'hquill', 'displayName' => 'Hana Quill', 'via' => 'credential',
                      'kind' => 'assist_invite', 'label' => 'Invite', 'relay' => true, 'host' => 'ACC01' }.merge(body)
        rows
      end
      assert_equal [], mfa(scan_all(invite.call, data: data).first)
      assert_includes mfa(scan_all(invite.call, data: scenario).first), SESSION.call('hana') # no such credential
      assert_includes mfa(scan_all(invite.call('relay' => false), data: data).first), SESSION.call('hana')
      other = deep(data)
      other['credentials']['hana_invite']['account'] = 'cal'
      assert_includes mfa(scan_all(invite.call, data: other).first), SESSION.call('hana')
      other = deep(data)
      other['credentials']['hana_invite']['connectsTo'] = 'plain_pc'
      assert_includes mfa(scan_all(invite.call, data: other).first), SESSION.call('hana')
      other = deep(data)
      other['credentials']['hana_invite']['kind'] = 'saved_connection'
      assert_includes mfa(scan_all(invite.call, data: other).first), SESSION.call('hana')
      # the token in the real run: the registry holds it for Hana at code_pc1; one for another account does not exempt it
      other = scenario
      other['credentials']['hana_token']['account'] = 'cal'
      assert_includes mfa(scan_all(copy, data: other).first), SESSION.call('hana')
      other = scenario
      other['credentials']['hana_token']['connectsTo'] = 'code_pc2'
      assert_includes mfa(scan_all(copy, data: other).first), SESSION.call('hana')
    end

    # ---- R1-L4: a session answer out of shape is judged, not skipped ------------------------------------------------

    test 'R1-L4 a sign-in success with no via, no account, an unknown account or on another spelling of the path is reported' do
      run_game
      lockless = -> { without(:lock) }
      un = ->(rows) { rows.find { |r| r['path'].end_with?('/login') && r['body'].is_a?(Hash) && r['body']['success'] == true && r['body']['npcId'] == 'hana' && r['body']['via'] == 'password' } }
      rows = lockless.call; un.call(rows)['body'].delete('via')
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      rows = lockless.call; un.call(rows)['body'].delete('npcId')
      assert_includes mfa(scan(rows)), SESSION.call('unknown')
      rows = lockless.call; un.call(rows)['body']['npcId'] = 'nobody'
      assert_includes mfa(scan(rows)), SESSION.call('unknown')
      rows = lockless.call; un.call(rows)['path'] += '.json'
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      rows = lockless.call; un.call(rows)['path'] += '/'
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      rows = lockless.call; un.call(rows)['status'] = 201
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      # an answer with no account that is at a PC that owes no step is not a finding
      rows = lockless.call; r = un.call(rows); r['body'].delete('npcId'); r['login'] = { 'pcId' => 'plain_pc' }
      assert_equal [], mfa(scan(rows))
      # a session-shaped answer on a path the scanner cannot place
      rows = lockless.call; r = un.call(rows); r['path'] = r['path'].sub(%r{/login\z}, '/somewhere/else')
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      # a pass answer on another spelling of its route earns nothing
      rows = copy; r = rows[idx(:pass_code)]; r['path'] += '.json'
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      # the bootstrap session with no via, or no account
      base = -> { without(:pass_code, :hana_required, :wrong_code, :lock, :unlock, :token) }
      rows = base.call
      rows.each { |r| s = r['body'].is_a?(Hash) && r['body']['sessions']; s['code_pc1']&.delete('via') if s.is_a?(Hash) }
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      rows = base.call
      rows.each { |r| s = r['body'].is_a?(Hash) && r['body']['sessions']; s['code_pc1']&.delete('npcId') if s.is_a?(Hash) }
      assert_includes mfa(scan(rows)), SESSION.call('unknown')
      rows = base.call
      rows.each { |r| s = r['body'].is_a?(Hash) && r['body']['sessions']; s['code_pc1']['relay'] = true if s.is_a?(Hash) && s['code_pc1'] }
      assert_includes mfa(scan(rows)), SESSION.call('hana')
    end

    # ---- R1-L5: a device or phone put down is no longer held ---------------------------------------------------------

    test 'R1-L5 a device or phone removed from the inventory earns nothing after' do
      run_game
      drop = ->(item) { row('POST', 'inventory', { 'success' => true }, 'inv' => { 'action' => 'remove', 'itemId' => item, 'usedOn' => nil }) }
      rows = copy
      rows.insert(idx(:take_device) + 1, drop.call('hana_device'))
      assert_includes mfa(scan(rows)), ['mfa_secret', 'mfa:key:code']
      # taken again after the drop: held again
      rows = copy
      rows.insert(idx(:take_device) + 1, drop.call('hana_device'), deep(@marks[:take_device]))
      assert_equal [], mfa(scan(rows))
      # a drop that failed changes nothing
      rows = copy
      d = drop.call('hana_device'); d['status'] = 422
      rows.insert(idx(:take_device) + 1, d)
      assert_equal [], mfa(scan(rows))
      # a remove row whose item the recorder could not read takes every device and phone back
      rows = copy
      rows.insert(idx(:take_device) + 1, row('POST', 'inventory', { 'success' => true }, 'inv' => nil))
      assert_includes mfa(scan(rows)), ['mfa_secret', 'mfa:key:code']
      # the phone: its choices and the approval
      rows = copy
      rows.insert(idx(:take_phone) + 1, drop.call('nia_phone'))
      found = mfa(scan(rows))
      assert_includes found, ['mfa_secret', 'mfa:key:numbers']
      assert_includes found, SESSION.call('nia')
    end

    # ---- R1-L6, R1-L11: a cancel, an expiry or a lockout closes every step it could be about -----------------------

    test 'R1-L6 a cancel with another step open closes the push steps; an approval after it needs a new step' do
      run_game
      rows = copy
      extra = deep(@marks[:cal_required]); extra['body']['npcId'] = 'dev'
      rows.insert(idx(:nia_required), extra)
      rows.delete_at(rows.index { |r| r['body'] == @marks[:nia_required2]['body'] && r['t'] == @marks[:nia_required2]['t'] })
      assert_includes mfa(scan(rows)), SESSION.call('nia')
      assert_includes mfa(scan(without(:nia_required2))), SESSION.call('nia')
      # the tag, when a recorder writes one, closes exactly that PC's step
      rows = copy
      rows.insert(idx(:nia_required), extra)
      rows.delete_at(rows.index { |r| r['body'] == @marks[:nia_required2]['body'] && r['t'] == @marks[:nia_required2]['t'] })
      rows[rows.index { |r| r['body'] == @marks[:cancel]['body'] }]['login'] = { 'pcId' => 'match_pc' }
      assert_includes mfa(scan(rows)), SESSION.call('nia')
      # the code kind is closed by an expired verify only
      rows = copy
      expired = deep(@marks[:wrong_code]); expired['body'] = { 'success' => false, 'expired' => true }
      rows.insert(idx(:wrong_code) + 1, expired)
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      rows = copy
      expired = deep(@marks[:cancel]); expired['body'] = { 'success' => false, 'expired' => true }
      rows.insert(idx(:wrong_code) + 1, expired)
      assert_equal [], mfa(scan(rows)).reject { |f| f == SESSION.call('nia') }
    end

    test 'R1-L11 a lockedOut answer on a second-step route closes the step as a cancel does' do
      run_game
      rows = copy
      locked = deep(@marks[:wrong_code]); locked['body'] = { 'success' => false, 'message' => 'x', 'lockedOut' => true }
      rows.insert(idx(:pass_code), locked)
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      rows = copy
      locked = deep(@marks[:cal_pass]); locked['status'] = 422; locked['body'] = { 'success' => false, 'lockedOut' => true }
      rows.insert(idx(:cal_pass), locked)
      assert_includes mfa(scan(rows)), SESSION.call('cal')
    end

    # ---- R1-L7: the code and numbers rules run where a code or a number can exist ----------------------------------

    test 'R1-L7 an authored code field is not a second-step code; a real code outside the device answer still is' do
      run_game
      # sis03 has no second step and a room answer with warranties[].code
      data = JSON.parse(ScenarioBinding.render(File.read(File.expand_path('../../../scenarios/sis03_cyber_insurance/scenario.json.erb', __dir__))))
      body = { 'objects' => [{ 'id' => 'x', 'minigameData' => { 'warranties' => [{ 'id' => 'w03', 'code' => 'W-03' }, { 'id' => 'w4', 'code' => '123456' }] } }] }
      room = { 'method' => 'GET', 'path' => '/break_escape/games/1/room/x', 'status' => 200, 'body' => body }
      assert_equal [], mfa(AccessLeakScanner.new(data).scan([['x', 1, room]]))
      # a scenario with a second step: an authored code that is not six digits is not a code
      room_row = lambda do |value|
        r = deep(@marks[:boot0]); r['path'] = r['path'].sub(%r{/scenario\z}, '/room/lobby')
        r['body'] = { 'objects' => [{ 'id' => 'x', 'minigameData' => { 'warranties' => [{ 'id' => 'w03', 'code' => value }] } }] }
        r
      end
      # R2-L7: only a value the scenario authors passes; one it does not author is a finding
      authored = scenario
      authored['rooms'].values.first['warrantyProbe'] = [{ 'code' => 'W-03' }, { 'code' => 'A12' }]
      assert_equal [], mfa(scan_all([room_row.call('W-03')], data: authored).first)
      assert_equal [], mfa(scan_all([room_row.call('A12')], data: authored).first)
      assert_includes mfa(scan([room_row.call('W-03')])), ['mfa_secret', 'mfa:key:code']
      assert_includes mfa(scan([room_row.call('A12')])), ['mfa_secret', 'mfa:key:code']
      # six digits, as a string, a number, spaced, or a structure: a code
      ['123456', 123_456, '123 456', '123-456', { 'x' => 1 }, [1]].each do |value|
        assert_includes mfa(scan([room_row.call(value)])), ['mfa_secret', 'mfa:key:code'], value.inspect
      end
      # the device answer itself, from a real code in the real run, is still earned
      assert_equal [], mfa(scan(@log))
      # no device authored: no code exists, and the numbers rule needs a number-matching policy
      plain = scenario
      plain['rooms'].each_value { |rm| Array(rm['objects']).each { |o| o['type'] = 'notes' if o['type'] == 'code_device' } }
      plain['policies'].each_value { |p| p['mfa'] = 'push' if p['mfa'] == 'push_number_match' }
      numbers = { 'objects' => [{ 'id' => 'x', 'numbers' => [11, 22, 33] }] }
      r = deep(room_row.call('x')); r['body'] = numbers
      assert_includes mfa(scan([r])), ['mfa_secret', 'mfa:key:numbers']
      assert_equal [], mfa(scan_all([r], data: plain).first).select { |f| f == ['mfa_secret', 'mfa:key:numbers'] } if plain['policies'].values.none? { |p| p['mfa'] == 'push_number_match' }
    end

    test 'R1-L7 every shipped scenario scans clean of second-step findings over its own room answers' do
      checked = 0
      Dir[File.expand_path('../../../scenarios/*/scenario.json.erb', __dir__)].sort.each do |path|
        data = begin
          JSON.parse(ScenarioBinding.render(File.read(path)))
        rescue StandardError
          next
        end
        next unless data.is_a?(Hash) && data['rooms'].is_a?(Hash)

        rows = data['rooms'].map do |room_id, room|
          { 'method' => 'GET', 'path' => "/break_escape/games/1/room/#{room_id}", 'status' => 200, 'body' => { 'room' => room } }
        end
        rows << { 'method' => 'GET', 'path' => '/break_escape/games/1/scenario', 'status' => 200, 'body' => { 'rooms' => data['rooms'], 'sessions' => {} } }
        found = AccessLeakScanner.new(data).scan(rows.each_with_index.map { |r, i| ['x', i + 1, r] }).select { |f| f.rule.start_with?('mfa_') }
        has_step = data['policies'].is_a?(Hash) && data['policies'].values.any? { |p| p.is_a?(Hash) && p['mfa'].to_s != '' && p['mfa'].to_s != 'none' }
        # a scenario with a second step authors no code or number key at all; the shipped ones that have none must be clean
        assert_equal [], found.map { |f| [f.rule, f.owner, path[%r{scenarios/([^/]+)/}, 1]] }, path unless has_step
        checked += 1
      end
      assert_operator checked, :>, 5
    end

    # ---- R1-L8 to R1-L14 -----------------------------------------------------------------------------------------------

    test 'R1-L8 an owner approval is judged by what the scenario says the owner does' do
      run_game
      rows = copy
      open = deep(@marks[:cal_required]); open['body']['npcId'] = 'dev'
      pass = deep(@marks[:cal_pass]); pass['body'].merge!('npcId' => 'dev', 'username' => 'dkapoor')
      rows.insert(idx(:cal_pass) + 1, open, pass)
      assert_includes mfa(scan(rows)), SESSION.call('dev') # a careful owner never approves
      # Cal, whose phone the player holds: the server answers waiting, never a pass
      rows = copy
      take = row('POST', 'inventory', { 'success' => true }, 'inv' => { 'action' => 'add', 'itemId' => 'cal_phone', 'usedOn' => nil })
      data = scenario
      data['startItemsInInventory'] = Array(data['startItemsInInventory']) + [{ 'id' => 'cal_phone', 'type' => 'phone_friendface', 'owner' => 'cal' }]
      rows.insert(idx(:cal_required) + 1, take)
      assert_includes mfa(scan_all(rows, data: data).first), SESSION.call('cal')
    end

    test 'R1-L9 a logout takes the earned session back' do
      run_game
      rows = copy
      k = rows.index { |r| r['path'].end_with?('/logout') }
      rows.insert(k + 1, deep(@marks[:boot_signed]))
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      # a tagged logout names its PC
      rows = copy
      rows[k]['login'] = { 'pcId' => 'code_pc2' }
      rows.insert(k + 1, deep(@marks[:boot_signed]))
      assert_equal [], mfa(scan(rows))
    end

    test 'R1-L10 the phone choices must hold the number the sign-in showed' do
      run_game
      rows = copy
      right = @marks[:nia_required]['body']['number']
      rows[idx(:phone)]['body']['requests'].first['numbers'] = ((10..99).to_a - [right]).first(3)
      assert_includes mfa(scan(rows)), ['mfa_secret', 'mfa:key:numbers']
    end

    test 'R1-L12 a step answer must name the PC its row is tagged with; a path and a query that disagree earn nothing' do
      run_game
      rows = copy
      rows[idx(:cal_required)]['login'] = { 'pcId' => 'plain_pc' }
      assert_includes mfa(scan(rows)), ['mfa_secret', 'mfa:answer:mfaRequired']
      rows = copy
      rows[idx(:ines_device)]['path'] += '?item_id=hana_device&x=1'
      assert_includes mfa(scan(rows)), ['mfa_secret', 'mfa:key:code']
      rows = copy
      rows[idx(:ines_device)]['path'] += '?item_id=hana_device'
      assert_includes mfa(scan(rows)), ['mfa_secret', 'mfa:key:code']
    end

    test 'R1-L13 two open steps for one account: the pass answer names its PC by the tag' do
      run_game
      rows = copy
      two = deep(@marks[:ines_required]); two['body']['npcId'] = 'hana'
      rows.insert(idx(:hana_required), two)
      assert_includes mfa(scan(rows)), SESSION.call('hana')
      rows[rows.index { |r| r['body'] == @marks[:pass_code]['body'] }]['login'] = { 'pcId' => 'code_pc1' }
      assert_equal [], mfa(scan(rows))
      # a tag naming the other PC does not close the step at this one
      rows[rows.index { |r| r['body'] == @marks[:pass_code]['body'] && r['login'] }]['login'] = { 'pcId' => 'code_pc2' }
      assert_includes mfa(scan(rows)), SESSION.call('hana')
    end

    test 'R1-L14 a blank policy name falls to the default policy as the server reads it' do
      run_game
      data = scenario
      plain = data['rooms'].values.flat_map { |rm| Array(rm['objects']) }.find { |o| o['id'] == 'plain_pc' }
      plain['policy'] = '  '
      data['defaultPolicy'] = 'code_gate'
      hana = { 'method' => 'POST', 'path' => @marks[:unlock]['path'], 'status' => 200, 'body' => deep(@marks[:unlock]['body']), 'login' => { 'pcId' => 'plain_pc' } }
      assert_includes mfa(scan_all([hana], data: data).first), SESSION.call('hana')
      plain['policy'] = 'plain_gate'
      assert_equal [], mfa(scan_all([hana], data: data).first)
    end
  end
end
