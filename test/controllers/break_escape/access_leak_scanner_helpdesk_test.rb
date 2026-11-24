require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8b unit 17 (feature A23, the leak scanner's helpdesk rules, tools/playtest/lib/helpdesk_leak_rules.rb): a capture is
  # built from the shared answer shapes (test/fixtures/files/helpdesk_answer_shapes.json) over scenarios/test_ops_mfa with a
  # desk, two reset passwords and recovery answers grafted on, and must report nothing. Then one fault at a time is made, or
  # one earlier row is left out, and must be reported. The earned cases are allowed and each near miss is still a finding.
  class AccessLeakScannerHelpdeskTest < ActiveSupport::TestCase
    SHAPES = JSON.parse(File.read(File.expand_path('../../fixtures/files/helpdesk_answer_shapes.json', __dir__))).reject { |k, _| k.start_with?('_') }
    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)
    BASE = '/break_escape/games/1'.freeze
    HANA_PW = 'Tern-Harbour-41'.freeze
    CAL_PW = 'Quay-Lantern-77'.freeze
    RECOVERY = { 'hana' => { 'staff_no' => '40612', 'manager' => 'Pia Hart' }, 'nia' => { 'staff_no' => '40755', 'manager' => 'Ruth Mace' } }.freeze

    setup { @tick = 0 }

    def npc_of(data, id)
      data['rooms'].each_value { |room| (room['npcs'] || []).each { |npc| return npc if npc['id'] == id } }
      nil
    end

    # test_ops_mfa with a desk grafted on. hana and nia have recovery answers (hana also a reset password); cal has a reset
    # password but no recovery answer, so the `questions` desk covers neither of cal's resets.
    def scenario
      data = JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
      RECOVERY.each { |id, rec| npc_of(data, id)['creds']['recovery'] = rec.dup }
      npc_of(data, 'hana')['creds']['resetPassword'] = HANA_PW
      npc_of(data, 'cal')['creds']['resetPassword'] = CAL_PW
      data['helpdesks'] = { 'it_desk' => { 'npc' => 'ria', 'verify' => 'questions', 'questions' => %w[staff_no manager], 'minCorrect' => 2,
                                           'maxTries' => 3, 'resets' => %w[password mfa],
                                           'questionLabels' => { 'staff_no' => 'Staff number', 'manager' => 'Line manager' } } }
      yield data if block_given?
      data
    end

    def shape(name, over = {})
      entry = Marshal.load(Marshal.dump(SHAPES.fetch(name)))
      over.each do |path, value|
        keys = path.delete_prefix('body.').scan(/[^.\[\]]+/)
        node = entry['body']
        keys[0..-2].each { |k| node = node.is_a?(Array) ? node[k.to_i] : node[k] }
        node.is_a?(Array) ? node[keys.last.to_i] = value : node[keys.last] = value
      end
      entry
    end

    def row(method, route, entry, query: nil, at: nil, extra: {})
      @tick += 1
      status = entry.is_a?(Hash) && entry.key?('status') ? entry['status'] : 200
      body = entry.is_a?(Hash) && entry.key?('body') ? entry['body'] : entry
      r = { 't' => (Time.utc(2026, 1, 1) + (at || @tick)).iso8601(3), 'method' => method, 'path' => "#{BASE}/#{route}", 'status' => status, 'body' => body }
      r['query'] = query if query
      r.merge(extra)
    end

    def grant_pw(over = {}, at = nil)
      row('POST', 'helpdesk/request', shape('helpdesk.granted_password', { 'body.password' => HANA_PW, 'body.lockoutPcIds' => ['code_pc1'] }.merge(over)), at: at)
    end

    def grant_mfa(at = nil)
      row('POST', 'helpdesk/request', shape('helpdesk.granted_mfa'), at: at)
    end

    def refusal(name = 'helpdesk.refused', over = {}, at = nil)
      row('POST', 'helpdesk/request', shape(name, over), at: at)
    end

    def reset_entry(npc, pw, over = {})
      shape('keyring.reset_entry', { 'body.id' => "#{npc}.reset", 'body.account.npcId' => npc, 'body.account.username' => npc_of(scenario, npc)['creds']['username'],
                                     'body.account.displayName' => npc, 'body.password' => pw }.merge(over))['body']
    end

    def keyring(entries, at = nil)
      row('GET', 'keyring', { 'status' => 200, 'body' => { 'rev' => 1, 'entries' => entries, 'captures' => {} } }, at: at)
    end

    def own_device(npc = 'hana', over = {})
      row('GET', 'mfa/device', shape('device.own', { 'body.deviceId' => "own:#{npc}", 'body.npcId' => npc }.merge(over)), query: "npc_id=#{npc}")
    end

    def take(item)
      row('POST', 'inventory', { 'status' => 200, 'body' => { 'success' => true } }, extra: { 'inv' => { 'action' => 'add', 'itemId' => item, 'usedOn' => nil } })
    end

    def unenrolled(over = {}, item = 'hana_device')
      row('GET', 'mfa/device', shape('device.unenrolled', { 'body.deviceId' => item, 'body.npcId' => 'hana', 'body.displayName' => npc_of(scenario, 'hana')['displayName'] || 'hana' }.merge(over)),
          query: "item_id=#{item}")
    end

    def login_own_code(pc: 'code_pc1', npc: 'hana')
      row('POST', 'login', shape('login.mfa_required_own_code', { 'body.pcId' => pc, 'body.npcId' => npc }))
    end

    def login_own_push(pc: 'match_pc', npc: 'nia', number: 47)
      row('POST', 'login', shape('login.mfa_required_own_push', { 'body.pcId' => pc, 'body.npcId' => npc, 'body.number' => number }))
    end

    def phone_own(numbers: [31, 47, 62], user: 'nfaraday', query: 'own=1')
      pc = scenario['rooms'].values.flat_map { |r| r['objects'] || [] }.find { |o| o['id'] == 'match_pc' }
      host = pc['host'] || pc['name']
      entry = { 'pcId' => 'match_pc', 'host' => host, 'username' => user, 'n' => 1, 'numbers' => numbers }
      row('GET', 'mfa/phone', { 'status' => 200, 'body' => { 'requests' => [entry] } }, query: query)
    end

    def scan(rows, data = scenario)
      lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
      AccessLeakScanner.new(data).scan(lines)
    end

    def rules(found)
      found.map(&:rule).uniq.sort
    end

    def owners(found)
      found.map(&:owner).uniq.sort
    end

    def helpdesk_only(found)
      found.select { |f| f.rule.start_with?('helpdesk_') }
    end

    # The honest run: a password grant, the keyring entry, a second-step grant for hana and one for nia, then every own form.
    def honest_run
      [grant_pw, keyring([reset_entry('hana', HANA_PW)]), grant_mfa, own_device('hana'), take('hana_device'), unenrolled, login_own_code,
       grant_mfa, login_own_push, phone_own]
    end

    # ---- every shape in the fixture, and the clean run ----

    test 'the honest run, with every own form and every desk answer, reports nothing' do
      rows = honest_run
      %w[helpdesk.refused helpdesk.refused_last helpdesk.blocked helpdesk.unavailable helpdesk.not_found helpdesk.bad_request].each do |name|
        rows << row('POST', 'helpdesk/request', shape(name), at: 9000 + rows.size)
      end
      rows << row('GET', 'scenario', { 'status' => 200, 'body' => { 'helpdeskForms' => shape('bootstrap.helpdesk_forms')['body'] } }, at: 9100)
      found = scan(rows)
      assert_empty found, found.map { |f| [f.rule, f.owner, f.source, f.line, f.json_path].inspect }.join("\n")
    end

    test 'the desk answers that need no proof are clean in any order and never need a grant first' do
      rows = %w[helpdesk.refused helpdesk.blocked helpdesk.unavailable helpdesk.not_found helpdesk.bad_request].map { |n| row('POST', 'helpdesk/request', shape(n)) }
      assert_empty scan(rows)
    end

    # ---- rule 1: the key names ----

    test 'each never key is a finding anywhere and clean without them' do
      %w[recovery resetPassword helpdesks accountResets helpdeskTries minCorrect maxTries].each do |key|
        found = scan([row('GET', 'room/lobby', { 'status' => 200, 'body' => { 'room' => { key => 1 } } })])
        assert_includes owners(found), "helpdesk:key:#{key}", key
      end
      assert_empty helpdesk_only(scan([row('GET', 'room/lobby', { 'status' => 200, 'body' => { 'room' => { 'name' => 'Lobby' } } })]))
    end

    test 'an authored recovery answer beside its question id is a finding, a label or another value is not' do
      leak = row('GET', 'room/lobby', { 'status' => 200, 'body' => { 'asked' => { 'staff_no' => '40612' } } })
      assert_includes owners(scan([leak])), 'helpdesk:recovery:staff_no'
      assert_empty helpdesk_only(scan([row('GET', 'room/lobby', { 'status' => 200, 'body' => { 'asked' => { 'staff_no' => 'Staff number' } } })]))
    end

    # ---- rule 2: the form map ----

    test 'helpdeskForms is clean at the root of the bootstrap and a finding elsewhere or with another key' do
      forms = shape('bootstrap.helpdesk_forms')['body']
      assert_empty scan([row('GET', 'scenario', { 'status' => 200, 'body' => { 'helpdeskForms' => forms } })])
      nested = row('GET', 'scenario', { 'status' => 200, 'body' => { 'game' => { 'helpdeskForms' => forms } } })
      assert_includes owners(scan([nested])), 'helpdesk:key:helpdeskForms'
      other_route = row('GET', 'room/lobby', { 'status' => 200, 'body' => { 'helpdeskForms' => forms } })
      assert_includes owners(scan([other_route])), 'helpdesk:key:helpdeskForms'
      %w[verify questions].each do |extra|
        bad = Marshal.load(Marshal.dump(forms))
        bad['it_desk'][extra] = %w[staff_no]
        assert_includes owners(scan([row('GET', 'scenario', { 'status' => 200, 'body' => { 'helpdeskForms' => bad } })])), "helpdesk:form:#{extra}"
      end
      bad = Marshal.load(Marshal.dump(forms))
      bad['it_desk']['questionLabels']['nope'] = 'Not a question'
      assert_includes owners(scan([row('GET', 'scenario', { 'status' => 200, 'body' => { 'helpdeskForms' => bad } })])), 'helpdesk:form:shape'
      bad = { 'ghost_desk' => forms['it_desk'] }
      assert_includes owners(scan([row('GET', 'scenario', { 'status' => 200, 'body' => { 'helpdeskForms' => bad } })])), 'helpdesk:form:shape'
    end

    # ---- rule 3: the request answer shapes ----

    test 'a refusal or block with another key or value, a wrong verb or a loose path is a finding' do
      extra = refusal('helpdesk.refused')
      extra['body']['right'] = %w[staff_no]
      assert_includes owners(scan([extra])), 'helpdesk:answer'
      assert_includes owners(scan([refusal('helpdesk.refused', { 'body.triesLeft' => '2' })])), 'helpdesk:answer'
      assert_includes owners(scan([refusal('helpdesk.blocked', { 'body.retryIn' => 9999 })])), 'helpdesk:answer'
      get = refusal('helpdesk.refused')
      get['method'] = 'GET'
      assert_includes owners(scan([get])), 'helpdesk:answer'
      status = refusal('helpdesk.refused')
      status['status'] = 500
      assert_includes owners(scan([status])), 'helpdesk:answer'
      assert_includes owners(scan([row('POST', 'helpdesk/request.json', shape('helpdesk.unavailable'))])), 'helpdesk:answer'
      assert_empty helpdesk_only(scan([row('POST', 'helpdesk/request', shape('helpdesk.unavailable'))]))
    end

    test 'a grant answer with an extra key, a string true or a status other than 200 earns nothing' do
      extra = grant_pw
      extra['body']['verified'] = %w[staff_no]
      found = scan([extra])
      assert_includes owners(found), 'helpdesk:answer'
      assert_includes owners(found), 'helpdesk:reset:hana'
      stringy = grant_pw
      stringy['body']['granted'] = 'true'
      found = scan([stringy])
      assert_includes owners(found), 'helpdesk:answer'
      assert_includes owners(found), 'helpdesk:reset:hana'
      refused = grant_pw
      refused['status'] = 422
      found = scan([refused, keyring([reset_entry('hana', HANA_PW)])])
      assert_includes owners(found), 'helpdesk:reset:hana'
      assert_includes owners(found), 'helpdesk:keyring:hana'
    end

    # ---- rule 4: the reset password ----

    test 'the password is clean in the credited grant answer and in the keyring entry after it' do
      assert_empty scan([grant_pw, keyring([reset_entry('hana', HANA_PW)])])
    end

    test 'the password in the bootstrap, a refusal, another route or a second field of the grant is a finding' do
      assert_includes owners(scan([row('GET', 'scenario', { 'status' => 200, 'body' => { 'note' => "new one #{HANA_PW}" } })])), 'helpdesk:reset:hana'
      refused = refusal('helpdesk.refused')
      refused['body']['hint'] = HANA_PW
      assert_includes owners(scan([refused])), 'helpdesk:reset:hana'
      twice = grant_pw
      twice['body']['lockoutPcIds'] = ['code_pc1']
      assert_includes owners(scan([grant_pw, row('GET', 'room/lobby', { 'status' => 200, 'body' => { 'text' => HANA_PW } })])), 'helpdesk:reset:hana'
      assert_includes owners(scan([row('POST', 'login', { 'status' => 200, 'body' => { 'success' => false, 'echo' => HANA_PW } })])), 'helpdesk:reset:hana'
    end

    test 'the password in the keyring before the grant, under another account, in another shape or on another route is a finding' do
      before = scan([keyring([reset_entry('hana', HANA_PW)]), grant_pw])
      assert_includes owners(before), 'helpdesk:reset:hana'
      assert_includes owners(before), 'helpdesk:keyring:hana'
      other = scan([grant_pw, keyring([reset_entry('cal', HANA_PW)])])
      assert_includes owners(other), 'helpdesk:reset:hana'
      assert_includes owners(other), 'helpdesk:keyring:cal'
      extra_key = reset_entry('hana', HANA_PW)
      extra_key['recovery'] = 'x'
      found = scan([grant_pw, keyring([extra_key])])
      assert_includes owners(found), 'helpdesk:reset:hana'
      wrong_account = reset_entry('hana', HANA_PW, 'body.account.username' => 'someone')
      assert_includes owners(scan([grant_pw, keyring([wrong_account])])), 'helpdesk:reset:hana'
      post = keyring([reset_entry('hana', HANA_PW)])
      post['method'] = 'POST'
      assert_includes owners(scan([grant_pw, post])), 'helpdesk:reset:hana'
      other_pw = scan([grant_pw, keyring([reset_entry('hana', CAL_PW)])])
      assert_includes owners(other_pw), 'helpdesk:reset:cal'
    end

    test 'a password grant for an account no desk covers earns nothing, and a value two accounts share earns neither' do
      cal = scan([grant_pw({ 'body.password' => CAL_PW })])
      assert_includes rules(cal), 'helpdesk_grant'
      assert_includes owners(cal), 'helpdesk:reset:cal'
      shared = scenario { |d| npc_of(d, 'nia')['creds']['resetPassword'] = HANA_PW }
      found = scan([grant_pw], shared)
      assert_includes rules(found), 'helpdesk_grant'
      assert_includes owners(found), 'helpdesk:reset:hana,nia'
      assert_includes rules(scan([grant_pw({ 'body.password' => 'Nobody-Has-This-1' })])), 'helpdesk_grant'
      assert_includes owners(scan([grant_pw({ 'body.lockoutPcIds' => ['no_such_pc'] })])), 'helpdesk:answer'
    end

    test 'a desk with a callback rule covers an account only while the run holds its phone' do
      callback = scenario { |d| d['helpdesks']['it_desk'].merge!('verify' => 'callback'); d['helpdesks']['it_desk'].delete('questions') }
      assert_includes rules(scan([grant_mfa, own_device('nia')], callback)), 'helpdesk_grant'
      held = [take('nia_phone'), grant_mfa, own_device('nia')]
      assert_empty helpdesk_only(scan(held, callback))
      gone = [grant_mfa, own_device('nia')]
      assert_includes owners(scan(gone, callback)), 'helpdesk:own:device'
    end

    # ---- the grant must be earned: the desk's stop ----

    test 'a grant after the desk stopped is not credited until the stop has run out' do
      stop = refusal('helpdesk.blocked', { 'body.retryIn' => 200 }, 100)
      early = scan([stop, grant_pw({}, 250), keyring([reset_entry('hana', HANA_PW)], 251)])
      assert_includes rules(early), 'helpdesk_grant'
      assert_includes owners(early), 'helpdesk:reset:hana'
      assert_empty scan([stop, grant_pw({}, 300), keyring([reset_entry('hana', HANA_PW)], 301)])
      last = refusal('helpdesk.refused_last', {}, 100)
      assert_includes rules(scan([last, grant_pw({}, 399)])), 'helpdesk_grant'
      assert_empty helpdesk_only(scan([last, grant_pw({}, 400)]))
      assert_includes rules(scan([stop, grant_mfa(250)])), 'helpdesk_grant'
      assert_empty scan([refusal('helpdesk.refused', {}, 100), grant_pw({}, 101)])
    end

    test 'a stop on a row with no readable time counts against every later grant' do
      stop = refusal('helpdesk.blocked')
      stop.delete('t')
      assert_includes rules(scan([stop, grant_pw])), 'helpdesk_grant'
      timeless = grant_pw
      timeless.delete('t')
      assert_empty scan([timeless]), 'a grant with no time and no stop earlier is credited'
      assert_includes rules(scan([refusal('helpdesk.blocked', {}, 5), timeless])), 'helpdesk_grant'
    end

    # ---- rule 5: the own-phone forms ----

    test 'an own code, the unenrolled answer, the own flag and the own phone list with no earlier second-step grant are findings' do
      assert_includes owners(scan([own_device('hana')])), 'helpdesk:own:device'
      assert_includes owners(scan([take('hana_device'), unenrolled])), 'helpdesk:own:unenrolled'
      assert_includes owners(scan([login_own_code])), 'helpdesk:own:ownPhone'
      assert_includes owners(scan([phone_own])), 'helpdesk:own:phone'
      password_only = scan([grant_pw, own_device('hana')])
      assert_includes owners(password_only), 'helpdesk:own:device'
    end

    test 'an own code is allowed after a credited second-step grant, and the code is still a finding to the second-step rule without one' do
      assert_empty scan([grant_mfa, own_device('hana')])
      assert_includes rules(scan([own_device('hana')])), 'mfa_secret'
      assert_empty scan([grant_mfa, own_device('hana', { 'body.used' => true })])
    end

    test 'an own form for an account no desk covers, or past the grants the run has, is a finding' do
      assert_includes owners(scan([grant_mfa, own_device('cal')])), 'helpdesk:own:device'
      two = [grant_mfa, own_device('hana'), own_device('nia')]
      assert_includes owners(scan(two)), 'helpdesk:own:device'
      assert_empty scan([grant_mfa, grant_mfa, own_device('hana'), own_device('nia')])
      stopped = [refusal('helpdesk.refused_last', {}, 100), grant_mfa(120), own_device('hana')]
      assert_includes owners(scan(stopped)), 'helpdesk:own:device'
    end

    test 'an own device answer with a different key set, id, name, code or time left is a finding' do
      base = [grant_mfa]
      assert_includes owners(scan(base + [own_device('hana', { 'body.deviceId' => 'own:nia' })])), 'helpdesk:own:device'
      assert_includes owners(scan(base + [own_device('hana', { 'body.displayName' => 'Vera Mbeki' })])), 'helpdesk:own:device'
      assert_includes owners(scan(base + [own_device('hana', { 'body.code' => '12345' })])), 'helpdesk:own:device'
      assert_includes owners(scan(base + [own_device('hana', { 'body.secondsLeft' => 61 })])), 'helpdesk:own:device'
      extra = own_device('hana')
      extra['body']['secret'] = 'x'
      assert_includes owners(scan(base + [extra])), 'helpdesk:own:device'
      wrong_query = own_device('hana')
      wrong_query['query'] = 'item_id=hana_device'
      assert_includes owners(scan(base + [wrong_query])), 'helpdesk:own:device'
      status = own_device('hana')
      status['status'] = 201
      assert_includes owners(scan(base + [status])), 'helpdesk:own:device'
      elsewhere = row('GET', 'room/lobby', shape('device.own', { 'body.deviceId' => 'own:hana', 'body.npcId' => 'hana' }))
      assert_includes owners(scan(base + [elsewhere])), 'helpdesk:own:device'
    end

    test 'the unenrolled answer needs the device taken, its owner, and a grant' do
      assert_empty scan([grant_mfa, take('hana_device'), unenrolled])
      assert_includes owners(scan([grant_mfa, unenrolled])), 'helpdesk:own:unenrolled'
      assert_includes owners(scan([grant_mfa, take('hana_device'), unenrolled({ 'body.npcId' => 'nia' })])), 'helpdesk:own:unenrolled'
      extra = unenrolled
      extra['body']['code'] = '123456'
      assert_includes owners(scan([grant_mfa, take('hana_device'), extra])), 'helpdesk:own:unenrolled'
    end

    test 'the own flag on the second-step answer needs the usual shape for a PC that owes the step, and a grant' do
      assert_empty scan([grant_mfa, login_own_code])
      assert_includes owners(scan([grant_mfa, login_own_code(pc: 'push_pc')])), 'helpdesk:own:ownPhone'
      assert_includes owners(scan([grant_mfa, login_own_code(npc: 'cal')])), 'helpdesk:own:ownPhone'
      stringy = login_own_code
      stringy['body']['ownPhone'] = 'true'
      assert_includes owners(scan([grant_mfa, stringy])), 'helpdesk:own:ownPhone'
      other_route = row('POST', 'mfa/verify', shape('login.mfa_required_own_code', { 'body.pcId' => 'code_pc1', 'body.npcId' => 'hana' }))
      assert_includes owners(scan([grant_mfa, other_route])), 'helpdesk:own:ownPhone'
    end

    test 'the own phone list and its number choices are allowed for an earned account at an open step and nowhere else' do
      run = [grant_mfa, login_own_push, phone_own]
      assert_empty scan(run)
      assert_includes owners(scan([grant_mfa, phone_own])), 'helpdesk:own:phone'
      assert_includes owners(scan([grant_mfa, login_own_push, phone_own(numbers: [31, 62, 70])])), 'helpdesk:own:phone'
      assert_includes owners(scan([grant_mfa, login_own_push, phone_own(user: 'someone')])), 'helpdesk:own:phone'
      assert_includes owners(scan([grant_mfa, login_own_push, phone_own(query: 'own=1&x=1')])), 'helpdesk:own:phone'
      assert_includes owners(scan([grant_mfa, login_own_push, phone_own(query: 'own=2')])), 'helpdesk:own:phone'
      no_phone = row('GET', 'mfa/phone', shape('phone.no_phone'), query: 'own=1')
      assert_empty helpdesk_only(scan([no_phone]))
      other = no_phone.merge('body' => { 'success' => false, 'error' => 'no such phone', 'code' => '123456' })
      assert_includes owners(scan([other])), 'helpdesk:own:phone'
    end

    test 'the number choices without an own query are still the second-step rule alone' do
      found = scan([grant_mfa, login_own_push, phone_own(query: 'npc_id=nia')])
      assert_includes rules(found), 'mfa_secret'
    end

    # ---- inert without a helpdesk ----

    test 'a scenario with no helpdesk, no reset password and no recovery gets no helpdesk finding and no change' do
      plain = JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
      rows = [row('GET', 'room/lobby', { 'status' => 200, 'body' => { 'recovery' => { 'staff_no' => '40612' }, 'helpdeskForms' => {}, 'ownPhone' => true } }),
              own_device('hana'), refusal('helpdesk.refused'), grant_mfa, row('GET', 'scenario', { 'status' => 200, 'body' => { 'maxTries' => 3 } })]
      found = scan(rows, plain)
      assert_empty helpdesk_only(found)
      assert_includes rules(found), 'mfa_secret', 'the second-step rule still judges the own code'
    end

    test 'the helpdesk rule texts are in the rule table' do
      assert_includes AccessLeakScanner::RULE_TEXT.keys, 'helpdesk_secret'
      assert_includes AccessLeakScanner::RULE_TEXT.keys, 'helpdesk_grant'
    end
  end
end
