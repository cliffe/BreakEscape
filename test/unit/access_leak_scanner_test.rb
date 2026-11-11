require 'test_helper'
require 'json'
require 'stringio'
require 'tmpdir'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# The access model's leak check (docs/achitechture/ACCESS_MODEL_PLAN.md, step 6):
# tools/playtest/lib/access_leak_scanner.rb over a fixture scenario and a fixture
# responses file (test/fixtures/files/access_leak/), and the access-leak-check.rb runner.
class AccessLeakScannerTest < ActiveSupport::TestCase
  JAKE_PASSWORD = 'Biscuit2019'.freeze
  DANA_PASSWORD = 'Daisy-Chain-77'.freeze
  SECRET_TEXTS = %w[PROFILE-BUDGET-SECRET-TEXT ARCHIVE-INNER-SECRET-TEXT PC-LOCAL-SECRET-TEXT
                    LOCKED-LEDGER-SECRET-TEXT].freeze
  ROOM = '/break_escape/games/1/room/finance'.freeze

  def scenario
    JSON.parse(file_fixture('access_leak/scenario.json').read)
  end

  def fixture_lines
    file_fixture('access_leak/responses.jsonl').read.lines.each_with_index.map do |text, i|
      ['responses.jsonl', i + 1, JSON.parse(text)]
    end
  end

  def scan(body, path: ROOM, method: 'GET', data: scenario, before: [])
    rows = before + [{ 'method' => method, 'path' => path, 'status' => 200, 'cmdSeq' => 4, 'body' => body }]
    AccessLeakScanner.new(data).scan(rows.each_with_index.map { |row, i| ['r.jsonl', i + 1, row] })
  end

  def summary(findings)
    findings.map { |f| [f.line, f.rule, f.owner] }
  end

  test 'the fixture responses file gives exactly the planted findings' do
    findings = AccessLeakScanner.new(scenario).scan(fixture_lines)
    assert_equal [
      [4, 'password', 'npc:jake'],
      [4, 'withheld_key', 'npc:jake/creds'],
      [6, 'password', 'npc:dana'],
      [7, 'signin_content', 'item:jake_local'],
      [8, 'profile_content', 'item:jake_budget'],
      [9, 'locked_content', 'item:ledger']
    ], summary(findings)
    finding = findings.first
    assert_equal "GET #{ROOM}", finding.route
    assert_equal 5, finding.cmd_seq
    assert_equal '$.room.npcs[0].creds.password', finding.json_path
  end

  test 'a password planted in room data is reported, the same password in an authored note is not' do
    planted = { 'room' => { 'npcs' => [{ 'id' => 'dana', 'nickname' => "aka #{DANA_PASSWORD}" }] } }
    assert_equal [[1, 'password', 'npc:dana']], summary(scan(planted))

    note = { 'room' => { 'objects' => [{ 'id' => 'lobby_note', 'type' => 'notes',
                                         'text' => "Dana's login, do not share: #{DANA_PASSWORD}" }] } }
    assert_empty scan(note)
    # The note's text carried without its id (the notepad, a reload's saved notes) is still the note.
    notepad = { 'notes' => [{ 'title' => 'Sticky note', 'text' => "Dana's login, do not share: #{DANA_PASSWORD}" }] }
    assert_empty scan(notepad)
    # A postitNote on the PC is a deliberate clue too.
    postit = { 'room' => { 'objects' => [{ 'id' => 'jake_pc', 'postitNote' => 'pw Biscuit2019 (temporary)' }] } }
    assert_empty scan(postit)
    # The bare password lifted out of the note is not.
    bare = { 'room' => { 'objects' => [{ 'id' => 'other', 'hint' => DANA_PASSWORD }] } }
    assert_equal [[1, 'password', 'npc:dana']], summary(scan(bare))
  end

  test 'a /capture_secrets answer is allowed only under revealSecret for an NPC with a capture route' do
    path = '/break_escape/games/1/capture_secrets'
    assert_empty scan({ 'secrets' => { 'jake' => JAKE_PASSWORD } }, path: path)
    assert_equal [[1, 'password', 'npc:dana']], summary(scan({ 'secrets' => { 'dana' => DANA_PASSWORD } }, path: path))

    hidden = scenario
    hidden['social']['captures']['revealSecret'] = false
    assert_equal [[1, 'password', 'npc:jake']],
                 summary(scan({ 'secrets' => { 'jake' => JAKE_PASSWORD } }, path: path, data: hidden))
    # The capture route counts only on /capture_secrets.
    assert_equal [[1, 'password', 'npc:jake']], summary(scan({ 'secrets' => { 'jake' => JAKE_PASSWORD } }))
  end

  # Engine plan section 6: the capture log device's page text, and capture proofs.
  test 'a page text row is checked like a /capture_secrets answer, and served_npcs narrows the exception' do
    page = ->(text) { [['dom.jsonl', 1, { 'dom' => text, 'label' => 'capture log' }]] }
    assert_empty AccessLeakScanner.new(scenario).scan(page.call("Recruitment\n#{JAKE_PASSWORD}"))
    findings = AccessLeakScanner.new(scenario).scan(page.call("Dana\n#{DANA_PASSWORD}"))
    assert_equal [[1, 'password', 'npc:dana']], summary(findings)
    assert_equal 'page capture log', findings.first.route

    # A proof not holding: the server would not serve Jake, so his password is a finding.
    no_proof = AccessLeakScanner.new(scenario, served_npcs: [])
    assert_equal [[1, 'password', 'npc:jake']], summary(no_proof.scan(page.call(JAKE_PASSWORD)))
    rows = [['r.jsonl', 1, { 'method' => 'GET', 'path' => '/break_escape/games/1/capture_secrets', 'status' => 200,
                             'body' => { 'secrets' => { 'jake' => JAKE_PASSWORD } } }]]
    assert_equal [[1, 'password', 'npc:jake']], summary(no_proof.scan(rows))
    assert_empty AccessLeakScanner.new(scenario, served_npcs: ['jake']).scan(rows)
  end

  test 'profile text in a room response is reported and in a container response is not' do
    budget = { 'id' => 'jake_budget', 'type' => 'text_file', 'name' => 'Q3 budget forecast.xlsx',
               'text' => 'PROFILE-BUDGET-SECRET-TEXT' }
    assert_equal [[1, 'profile_content', 'item:jake_budget']], summary(scan({ 'room' => { 'objects' => [budget] } }))
    # Any sign-in PC's desktop may carry a profile; the profile's own folder may carry its items.
    assert_empty scan({ 'contents' => [budget] }, path: '/break_escape/games/1/container/jake_pc')
    inner = { 'id' => 'jake_inner', 'text' => 'ARCHIVE-INNER-SECRET-TEXT' }
    assert_empty scan({ 'contents' => [inner] }, path: '/break_escape/games/1/container/jake_archive')
    # Another object's container is not the profile's.
    assert_equal [[1, 'profile_content', 'item:jake_budget']],
                 summary(scan({ 'contents' => [budget] }, path: '/break_escape/games/1/container/shelf'))
    # A name alone is content too.
    assert_equal [[1, 'profile_content', 'item:jake_budget']],
                 summary(scan({ 'item' => { 'name' => 'Q3 budget forecast.xlsx' } }))
  end

  test 'a profile folder\'s own /unlock answer may carry its contents, nothing else may' do
    unlock = '/break_escape/games/1/unlock'
    inner = { 'success' => true, 'hasContents' => true,
              'contents' => [{ 'id' => 'jake_inner', 'name' => 'Inner memo.txt', 'text' => 'ARCHIVE-INNER-SECRET-TEXT' }] }
    assert_empty scan(inner, path: unlock, method: 'POST')
    # A profile file that is not inside a folder has no /unlock answer of its own.
    top = { 'success' => true, 'contents' => [{ 'id' => 'jake_budget', 'text' => 'PROFILE-BUDGET-SECRET-TEXT' }] }
    assert_equal [[1, 'profile_content', 'item:jake_budget']], summary(scan(top, path: unlock, method: 'POST'))
    # The folder's contents anywhere else in an /unlock answer (a door's room data) are not its answer.
    door = { 'success' => true, 'roomData' => { 'objects' => [{ 'id' => 'x', 'text' => 'ARCHIVE-INNER-SECRET-TEXT' }] } }
    assert_equal [[1, 'profile_content', 'item:jake_inner']], summary(scan(door, path: unlock, method: 'POST'))
  end

  test 'sign-in PC content is allowed only in that PC\'s container response' do
    local = { 'id' => 'jake_local', 'text' => 'PC-LOCAL-SECRET-TEXT' }
    assert_empty scan({ 'contents' => [local] }, path: '/break_escape/games/1/container/jake_pc')
    assert_equal [[1, 'signin_content', 'item:jake_local']],
                 summary(scan({ 'contents' => [local] }, path: '/break_escape/games/1/container/finance_cabinet'))
    assert_equal [[1, 'signin_content', 'item:jake_local']],
                 summary(scan({ 'room' => { 'objects' => [{ 'id' => 'jake_pc', 'contents' => [local] }] } }))
    # Once served by its own route, the file can travel (inventory, a reload's bootstrap).
    served = { 'method' => 'GET', 'path' => '/break_escape/games/1/container/jake_pc', 'body' => { 'contents' => [local] } }
    assert_empty scan({ 'inventory' => [local] }, path: '/break_escape/games/1/scenario', before: [served])
  end

  test 'a locked container\'s contents are reported while it is marked locked and not after' do
    ledger = { 'id' => 'ledger', 'name' => 'Finance ledger', 'text' => 'LOCKED-LEDGER-SECRET-TEXT' }
    cabinet = { 'id' => 'finance_cabinet', 'locked' => true, 'contents' => [ledger] }
    assert_equal [[1, 'locked_content', 'item:ledger']], summary(scan({ 'room' => { 'objects' => [cabinet] } }))
    assert_empty scan({ 'room' => { 'objects' => [cabinet.merge('locked' => false)] } })
    assert_empty scan({ 'contents' => [ledger] }, path: '/break_escape/games/1/container/finance_cabinet')
    # Marked locked without its contents: nothing leaked.
    assert_empty scan({ 'room' => { 'objects' => [cabinet.except('contents')] } })
  end

  test 'public strings and short names are not secrets' do
    data = scenario
    # A profile item named like a public object is not told apart from it.
    data['accountProfiles']['jake_files']['contents'] << { 'id' => 'dup', 'type' => 'notes', 'name' => 'Visitor log',
                                                            'text' => 'Nothing to see.' }
    assert_empty scan({ 'room' => { 'objects' => [{ 'name' => 'Visitor log', 'text' => 'Nothing to see.' }] } }, data: data)
    data['accountProfiles']['jake_files']['contents'] << { 'id' => 'mail', 'type' => 'email_client', 'name' => 'Mail' }
    assert_empty scan({ 'label' => 'Mail' }, data: data)
  end

  # Networks (ACCESS_MODEL_SLICE_9_3_PLAN.md, step 6): a network, a protected share with a
  # folder, and a short-named printer. The door sign "Comms Room" is also a resource host.
  def network_scenario
    data = scenario
    data['networks'] = { 'office_lan' => { 'name' => 'Harbour office LAN' } }
    data['resources'] = {
      'ledger_archive' => {
        'kind' => 'file_share', 'name' => 'Ledger-Archive', 'host' => 'HB-FS01', 'network' => 'office_lan',
        'access' => { 'roles' => ['finance'] },
        'contents' => [
          { 'id' => 'ledger_2024', 'type' => 'text_file', 'name' => 'ledger_2024.xlsx', 'text' => 'SHARE-LEDGER-SECRET-TEXT' },
          { 'id' => 'audit_dir', 'type' => 'folder', 'name' => 'Audit folder', 'locked' => true,
            'contents' => [{ 'id' => 'audit_memo', 'type' => 'text_file', 'name' => 'audit_memo.txt',
                             'text' => 'SHARE-AUDIT-SECRET-TEXT' }] }
        ]
      },
      'pq' => { 'kind' => 'printer', 'name' => 'PrnQ', 'host' => 'Comms Room', 'network' => 'office_lan',
                'observations' => 'A print queue anyone on the LAN can read.' }
    }
    data['rooms'].values.first['door_sign'] = 'Comms Room'
    data
  end

  def scan_net(body, path: ROOM, method: 'GET', before: [])
    scan(body, path: path, method: method, data: network_scenario, before: before)
  end

  test 'a network name planted in room data is reported, the same name in a /network answer is not' do
    planted = { 'room' => { 'objects' => [{ 'id' => 'sign', 'text' => 'Welcome to the Harbour office LAN' }] } }
    assert_equal [[1, 'network_string', 'network:office_lan']], summary(scan_net(planted))
    view = { 'footholds' => [{ 'id' => 'jack_x', 'network' => { 'id' => 'office_lan', 'name' => 'Harbour office LAN' },
                               'hosts' => [{ 'id' => 'ledger_archive', 'name' => 'Ledger-Archive', 'host' => 'HB-FS01' }] }] }
    assert_empty scan_net(view, path: '/break_escape/games/1/network')
    assert_empty scan_net(view, path: '/break_escape/games/1/network/plant', method: 'POST')
    # The bootstrap may name the network only in its footholds block.
    assert_empty scan_net(view, path: '/break_escape/games/1/scenario')
    assert_equal [[1, 'network_string', 'network:office_lan']],
                 summary(scan_net({ 'globals' => { 'x' => 'Harbour office LAN' } }, path: '/break_escape/games/1/scenario'))
    # A desktop's share stub is a /container answer.
    stub = { 'contents' => [{ 'id' => 'ledger_archive', 'name' => 'Ledger-Archive (\\\\HB-FS01\\Ledger-Archive)' }] }
    assert_empty scan_net(stub, path: '/break_escape/games/1/container/jake_pc')
    # A resource's host and observations are secrets too, and there is no exception for NPC work.
    work = { 'npcs' => [{ 'id' => 'jake', 'work' => { 'note' => 'Saving to HB-FS01 now' } }] }
    assert_equal [[1, 'network_string', 'resource:ledger_archive']], summary(scan_net(work))
    obs = { 'text' => 'A print queue anyone on the LAN can read.' }
    assert_equal [[1, 'network_string', 'resource:pq']], summary(scan_net(obs))
  end

  # An item opened by POST /unlock comes back with its contents, as GET /container would
  # send them (the lab's BadUSB remote session names its file server's host). The exemption
  # covers every network string there, as on /container: authored container text is the
  # author's choice, reviewed with the scenario, not a server leak.
  test 'a host named in the contents of an /unlock answer is not reported, elsewhere in it is' do
    unlock = '/break_escape/games/1/unlock'
    opened = { 'success' => true, 'hasContents' => true,
               'contents' => [{ 'id' => 'note', 'text' => 'Mapped drive: the records share on HB-FS01.' }] }
    assert_empty scan_net(opened, path: unlock, method: 'POST')
    stray = { 'success' => true, 'message' => 'Opened on HB-FS01' }
    assert_equal [[1, 'network_string', 'resource:ledger_archive']], summary(scan_net(stray, path: unlock, method: 'POST'))
    assert_equal [[1, 'network_string', 'resource:ledger_archive']], summary(scan_net(opened, path: ROOM))
    # Not only hosts: a network name or a resource's observations in those contents pass too.
    named = { 'success' => true, 'contents' => [{ 'id' => 'note', 'text' => 'On the Harbour office LAN since May.' }] }
    assert_empty scan_net(named, path: unlock, method: 'POST')
    assert_equal [[1, 'network_string', 'network:office_lan']], summary(scan_net(named, path: ROOM))
  end

  test 'a five-letter resource name is reported only as a whole value' do
    assert_equal [[1, 'network_string', 'resource:pq']], summary(scan_net({ 'label' => 'PrnQ' }))
    assert_empty scan_net({ 'label' => 'Send to PrnQ later' })
  end

  test 'a network string that is also a door sign is skipped' do
    assert_empty scan_net({ 'room' => { 'door_sign' => 'Comms Room' } })
  end

  test 'a share item is allowed only in a container answer for its share or a folder in it' do
    file = { 'id' => 'ledger_2024', 'name' => 'ledger_2024.xlsx', 'text' => 'SHARE-LEDGER-SECRET-TEXT' }
    assert_equal [[1, 'share_content', 'item:ledger_2024']], summary(scan_net({ 'room' => { 'objects' => [file] } }))
    assert_empty scan_net({ 'contents' => [file] }, path: '/break_escape/games/1/container/ledger_archive')
    assert_equal [[1, 'share_content', 'item:ledger_2024']],
                 summary(scan_net({ 'contents' => [file] }, path: '/break_escape/games/1/container/jake_pc'))
    memo = { 'id' => 'audit_memo', 'text' => 'SHARE-AUDIT-SECRET-TEXT' }
    assert_empty scan_net({ 'contents' => [memo] }, path: '/break_escape/games/1/container/audit_dir')
    assert_empty scan_net({ 'success' => true, 'contents' => [memo] }, path: '/break_escape/games/1/unlock', method: 'POST')
    # Even the /network view may not carry a share's content.
    assert_equal [[1, 'share_content', 'item:ledger_2024']],
                 summary(scan_net({ 'footholds' => [{ 'hosts' => [file] }] }, path: '/break_escape/games/1/network'))
    # Once served by its share, a copied file may travel with the inventory.
    served = { 'method' => 'GET', 'path' => '/break_escape/games/1/container/ledger_archive', 'body' => { 'contents' => [file] } }
    assert_empty scan_net({ 'inventory' => [file] }, path: '/break_escape/games/1/inventory', method: 'POST', before: [served])
  end

  # Review R1 M2: a share item that holds a password on purpose (the feature scenario's letter)
  # is a clue only where the share's content may be, never a global exemption.
  def share_clue_scenario
    data = network_scenario
    data['resources']['ledger_archive']['contents'] << {
      'id' => 'dana_letter', 'type' => 'text_file', 'name' => 'scan_0412.pdf',
      'text' => "Welcome aboard. Your first password is #{DANA_PASSWORD}.",
      'observations' => "A scanned letter. It reads #{DANA_PASSWORD} at the bottom."
    }
    data
  end

  def scan_clue(body, path: ROOM, method: 'GET', before: [])
    scan(body, path: path, method: method, data: share_clue_scenario, before: before)
  end

  test 'a share letter\'s password is not reported in its share\'s /container answer, or a folder in it' do
    letter = { 'id' => 'dana_letter', 'name' => 'scan_0412.pdf', 'text' => "Welcome aboard. Your first password is #{DANA_PASSWORD}.",
               'observations' => "A scanned letter. It reads #{DANA_PASSWORD} at the bottom." }
    assert_empty scan_clue({ 'contents' => [letter] }, path: '/break_escape/games/1/container/ledger_archive')
    # Once served by its share, it may follow into the inventory and the notepad.
    served = { 'method' => 'GET', 'path' => '/break_escape/games/1/container/ledger_archive', 'body' => { 'contents' => [letter] } }
    assert_empty scan_clue({ 'inventory' => [letter] }, path: '/break_escape/games/1/inventory', method: 'POST', before: [served])
    assert_empty scan_clue({ 'notes' => [{ 'text' => "A scanned letter. It reads #{DANA_PASSWORD} at the bottom." }] },
                           path: '/break_escape/games/1/sync_state', method: 'PUT', before: [served])
  end

  test 'a share letter\'s password in a room answer before any serve is reported, under its id or another' do
    obs = "A scanned letter. It reads #{DANA_PASSWORD} at the bottom."
    under_own_id = { 'room' => { 'objects' => [{ 'id' => 'dana_letter', 'observations' => obs }] } }
    under_other_id = { 'room' => { 'objects' => [{ 'id' => 'desk_tray', 'observations' => obs }] } }
    assert_includes summary(scan_clue(under_own_id)), [1, 'password', 'npc:dana']
    assert_includes summary(scan_clue(under_other_id)), [1, 'password', 'npc:dana']
    # And in the /container answer for another PC, or the /network view.
    assert_includes summary(scan_clue({ 'contents' => [{ 'id' => 'dana_letter', 'observations' => obs }] },
                                      path: '/break_escape/games/1/container/jake_pc')), [1, 'password', 'npc:dana']
    assert_includes summary(scan_clue({ 'footholds' => [{ 'hosts' => [{ 'id' => 'x', 'observations' => obs }] }] },
                                      path: '/break_escape/games/1/network')), [1, 'password', 'npc:dana']
  end

  test 'no network finding line holds a value' do
    scanner = AccessLeakScanner.new(network_scenario)
    rows = [{ 'method' => 'GET', 'path' => ROOM, 'cmdSeq' => 1,
              'body' => { 'Harbour office LAN' => 'HB-FS01', 'x' => 'PrnQ', 'f' => 'SHARE-LEDGER-SECRET-TEXT' } }]
    findings = scanner.scan(rows.each_with_index.map { |row, i| ['r.jsonl', i + 1, row] })
    out = scanner.report_lines(findings).join("\n")
    assert_equal %w[share_content item:ledger_2024 network_string resource:ledger_archive network_string resource:pq],
                 findings.flat_map { |f| [f.rule, f.owner] }
    ['Harbour office LAN', 'HB-FS01', 'PrnQ', 'SHARE-LEDGER-SECRET-TEXT', 'Ledger-Archive'].each { |s| refute_includes out, s }
    assert_equal 3, scanner.counts[:share_items]
  end

  test 'no output line holds a secret value' do
    scanner = AccessLeakScanner.new(scenario)
    findings = scanner.scan(fixture_lines)
    out = scanner.report_lines(findings).join("\n")
    refute_empty findings
    secrets = [JAKE_PASSWORD, DANA_PASSWORD, 'Q3 budget forecast.xlsx', 'Local notes on this PC.txt'] + SECRET_TEXTS
    secrets.each { |s| refute_includes out, s }
    assert_includes out, 'owner=npc:jake'
    assert_includes out, "route=GET #{ROOM}"
    assert_includes out, 'response=responses.jsonl:4'
    assert_includes out, 'command at log seq 5'
  end

  test 'redact guards an output line that would carry a value' do
    scanner = AccessLeakScanner.new(scenario)
    assert_equal 'at=$.[withheld]', scanner.redact("at=$.#{JAKE_PASSWORD}")
  end

  test 'access-leak-check.rb prints findings without values and exits 1, or 0 when clean' do
    game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                              scenario: scenario)
    out, status = run_check(game.id, file_fixture('access_leak/responses.jsonl').to_s)
    assert_equal 1, status, out
    assert_includes out, '14 responses from 1 file(s)'
    assert_includes out, '2 NPC password(s)'
    assert_match(/^password\s+2 /, out)
    assert_match(/^locked_content\s+1 /, out)
    assert_match(/^withheld_key\s+1 /, out)
    assert_includes out, 'VERDICT: 6 finding(s)'
    ([JAKE_PASSWORD, DANA_PASSWORD] + SECRET_TEXTS).each { |s| refute_includes out, s }

    Dir.mktmpdir do |dir|
      clean = File.join(dir, 'clean.jsonl')
      File.write(clean, file_fixture('access_leak/responses.jsonl').read.lines.first(3).join)
      out, status = run_check(game.id, clean)
      assert_equal 0, status, out
      assert_includes out, 'VERDICT: no leaks found.'
    end
  end

  # ---- Slice 9.1 (ACCESS_MODEL_SLICE_9_1_PLAN.md, section 6): the note, the saved copy and
  # the withheld keys.

  OMAR_PASSWORD = 'Omar-Note-PW-7731'.freeze
  NOTE = "ohaddad / #{OMAR_PASSWORD}".freeze
  LOGIN = '/break_escape/games/1/login_accounts?pc_id=omar_pc'.freeze

  def habits_scenario
    {
      'startRoom' => 'office',
      'rooms' => { 'office' => {
        'type' => 'room_office', 'connections' => {},
        'objects' => [{ 'id' => 'omar_pc', 'type' => 'pc', 'name' => "Omar's PC", 'locked' => true, 'lockType' => 'login' },
                      { 'id' => 'hot_desk', 'type' => 'pc', 'name' => 'Hot desk', 'locked' => true, 'lockType' => 'login' }],
        'npcs' => [
          { 'id' => 'omar', 'npcType' => 'person', 'needsHome' => 'omar_pc', 'habits' => { 'writesDown' => true },
            'creds' => { 'username' => 'ohaddad', 'password' => OMAR_PASSWORD } },
          { 'id' => 'twin', 'npcType' => 'person', 'creds' => { 'username' => 'twin', 'password' => OMAR_PASSWORD } }
        ]
      } }
    }
  end

  def habits_game
    create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                       scenario: habits_scenario, player_state: { 'unlockedRooms' => ['office'] })
  end

  def rows(*bodies)
    bodies.each_with_index.map do |(path, body), i|
      ['r.jsonl', i + 1, { 'method' => 'GET', 'path' => path, 'status' => 200, 'cmdSeq' => i, 'body' => body }]
    end
  end

  def note_answer(pc_id = 'omar_pc', extra = {})
    [LOGIN.sub('omar_pc', pc_id), { 'pc_id' => pc_id, 'loginAccounts' => [], 'postitNote' => NOTE }.merge(extra)]
  end

  test "a note at $.postitNote of the owner's own /login_accounts answer is allowed, for every NPC sharing it" do
    game = habits_game
    scanner = AccessLeakScanner.new(game.scenario_data, game: game)
    assert_empty scanner.scan(rows(note_answer))
  end

  test 'the password elsewhere in that body, in another PC answer, in room data or with no game is reported' do
    game = habits_game
    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(rows(note_answer('omar_pc', 'extra' => NOTE)))
    assert_equal [[1, 'password', 'npc:omar'], [1, 'password', 'npc:twin']], summary(findings)
    assert_equal '$.extra', findings.first.json_path

    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(rows(note_answer('hot_desk')))
    assert_equal %w[npc:omar npc:twin], findings.map(&:owner)

    room = ['/break_escape/games/1/room/office', { 'room' => { 'objects' => [{ 'id' => 'omar_pc', 'note' => NOTE }] } }]
    assert_equal 2, AccessLeakScanner.new(game.scenario_data, game: game).scan(rows(room)).length

    assert_equal 2, AccessLeakScanner.new(game.scenario_data).scan(rows(note_answer)).length, 'no game, no exception'
  end

  test 'savedNotes holds the note only after a /login_accounts line carried it, across files in order' do
    game = habits_game
    saved = ['/break_escape/games/1/scenario', { 'savedNotes' => [{ 'id' => 'n1', 'text' => NOTE }] }]
    assert_empty AccessLeakScanner.new(game.scenario_data, game: game).scan(rows(note_answer, saved))

    two_files = [['a.jsonl', 1, rows(note_answer).first[2]], ['b.jsonl', 1, rows(saved).first[2]]]
    assert_empty AccessLeakScanner.new(game.scenario_data, game: game).scan(two_files)

    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(rows(saved))
    assert_equal %w[npc:omar npc:twin], findings.map(&:owner)
  end

  test 'an NPC record with a withheld key is reported by key and NPC id; social characters and awareness are not' do
    body = {
      'room' => { 'npcs' => [{ 'id' => 'omar', 'habits' => { 'writesDown' => true } }] },
      'stray' => { 'id' => 'len', 'npcType' => 'person', 'role' => 'guard' },
      'social' => { 'characters' => { 'jo' => { 'role' => 'manager' } }, 'awareness' => { 'episodes' => [] } }
    }
    findings = scan(body, data: habits_scenario)
    assert_equal [[1, 'withheld_key', 'npc:omar/habits'], [1, 'withheld_key', 'npc:len/role']], summary(findings)
    lines = AccessLeakScanner.new(habits_scenario).report_lines(findings)
    lines.each { |line| refute_includes line, 'writesDown' }
    lines.each { |line| refute_includes line, 'guard' }
  end

  private

  def run_check(game_id, *files)
    script = Rails.root.join('../../tools/playtest/access-leak-check.rb').to_s
    old_argv = ARGV.dup
    ARGV.replace([game_id.to_s, *files])
    out = StringIO.new
    status = 0
    old_stdout = $stdout
    $stdout = out
    begin
      load script
    rescue SystemExit => e
      status = e.status
    ensure
      $stdout = old_stdout
      ARGV.replace(old_argv)
    end
    [out.string, status]
  end
  # Slice 9.2 sub-slice B: a workaround's kind beside its target is reported outside a hand-over
  test 'a workaround is reported outside a hand-over, and allowed as a run or in npcFrustration' do
    data = scenario
    npc = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.first
    npc['workarounds'] = [{ 'at' => 50, 'do' => 'prop_door', 'door' => 'store_room', 'prop' => 'wedge' }]
    run = { 'index' => 0, 'hand' => 1, 'do' => 'prop_door', 'dwell' => 4, 'door' => 'store_room', 'prop' => 'wedge' }
    leaked = scan({ 'npcs' => [{ 'id' => 'x', 'hint' => run }] }, data: data)
    assert_equal [[1, 'workaround', "#{npc['id']}[0]"]], summary(leaked)
    assert_empty scan({ 'answers' => [{ 'npcId' => npc['id'], 'run' => run }] }, path: '/break_escape/games/1/npc_frustration',
                                                                             method: 'POST', data: data)
    assert_empty scan({ 'npcFrustration' => { npc['id'] => { 'pending' => [run], 'done' => [{ 'index' => 0, 'do' => 'prop_door' }] } } },
                      path: '/break_escape/games/1/scenario', data: data)
    assert_empty scan({ 'do' => 'prop_door', 'door' => 'other_room' }, data: data), 'another target is not this workaround'
    assert_equal 1, AccessLeakScanner.new(data).counts[:workarounds]
  end

  test 'an authored workaround entry (it carries at) is reported anywhere, a writes_down included' do
    entry = { 'at' => 50, 'do' => 'writes_down' }
    assert_equal [[1, 'workaround', 'authored writes_down']], summary(scan({ 'npcs' => [{ 'id' => 'x', 'list' => [entry] }] }))
    leaked = scan({ 'npcFrustration' => { 'mei' => { 'pending' => [entry] } } }, path: '/break_escape/games/1/scenario')
    assert_equal [[1, 'workaround', 'authored writes_down']], summary(leaked), 'no exemption for an authored entry'
    assert_empty scan({ 'do' => 'writes_down', 'index' => 0, 'hand' => 1 }), 'a run has no at'
  end

end
