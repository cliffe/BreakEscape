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

  # Scenario format hardening step 3: non-account capture secrets.
  CAPTURE_SECRET = 'Dossier-Phrase-7781'.freeze

  def capture_scenario
    {
      'rooms' => { 'office' => { 'type' => 'room_office', 'npcs' => [
        # A non-account NPC (no creds) whose usePayload carries a capture secret.
        { 'id' => 'informant', 'npcType' => 'person',
          'usePayload' => { 'targetId' => 'informant', 'secret' => CAPTURE_SECRET } },
        # An addCapture mapping with a secret, on a phone NPC (no account).
        { 'id' => 'hax', 'npcType' => 'phone',
          'eventMappings' => [{ 'eventPattern' => 'x', 'addCapture' => { 'targetId' => 'drop', 'secret' => 'Drop-Note-Code-99' } }] }
      ] } }
    }
  end

  test 'a non-account capture secret is served only by /capture_secrets, reported elsewhere' do
    cap = '/break_escape/games/1/capture_secrets'
    # Served through its own route: allowed.
    assert_empty scan({ 'secrets' => { 'informant' => CAPTURE_SECRET } }, path: cap, data: capture_scenario)
    # The same secret in a room response is a leak, named by its target id, never its value.
    findings = scan({ 'room' => { 'objects' => [{ 'id' => 'board', 'hint' => CAPTURE_SECRET }] } }, data: capture_scenario)
    assert_equal [[1, 'capture_secret', 'capture:informant']], summary(findings)
    refute_includes findings.first.json_path, CAPTURE_SECRET
    # A capture page the tester read (a dom row) is the other allowed place.
    page = [['dom.jsonl', 1, { 'dom' => "Captures\n#{CAPTURE_SECRET}", 'label' => 'capture log' }]]
    assert_empty AccessLeakScanner.new(capture_scenario).scan(page)
    # The mapping secret is caught the same way, by its own target id.
    mapping = scan({ 'note' => "left behind: Drop-Note-Code-99" }, data: capture_scenario)
    assert_equal [[1, 'capture_secret', 'capture:drop']], summary(mapping)
    assert_equal 2, AccessLeakScanner.new(capture_scenario).counts[:capture_secrets]
  end

  test 'an account capture secret stays with the password rule, not the capture_secret rule' do
    # A secret equal to an account holder's own creds.password is a password, not a capture secret:
    # build_authored_capture_secrets skips a writer on an account holder, and so does the scanner.
    data = { 'rooms' => { 'office' => { 'type' => 'room_office', 'npcs' => [
      { 'id' => 'rhea', 'npcType' => 'person', 'creds' => { 'username' => 'r.m', 'password' => 'Rhea-Pass-55' },
        'eventMappings' => [{ 'eventPattern' => 'x', 'addCapture' => { 'targetId' => 'rhea', 'secret' => 'Rhea-Pass-55' } }] }
    ] } } }
    findings = scan({ 'room' => { 'objects' => [{ 'id' => 'board', 'hint' => 'Rhea-Pass-55' }] } }, data: data)
    assert_equal [[1, 'password', 'npc:rhea']], summary(findings)
    assert_equal 0, AccessLeakScanner.new(data).counts[:capture_secrets]
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

  # A Wi-Fi link item (slice 9.3b W, 5.3) is the handle of a foothold the player holds; its
  # name and observations legitimately carry the network name in a plain /inventory or /room
  # answer, so a netlink_ holder is exempt. The exemption must stay narrow: the same network
  # name under any other holder in the same response is still a leak.
  test 'a network name on a netlink_ held handle is exempt, under another holder it is reported' do
    inv = '/break_escape/games/1/inventory'
    held = { 'inventory' => [{ 'id' => 'netlink_wifi_office_lan', 'name' => 'Wi-Fi: Harbour office LAN',
                               'observations' => 'A handle to the Harbour office LAN you joined.' }] }
    assert_empty scan_net(held, path: inv)
    leaked = { 'inventory' => [{ 'id' => 'stray_item', 'name' => 'Note about the Harbour office LAN' }] }
    assert_equal [[1, 'network_string', 'network:office_lan']], summary(scan_net(leaked, path: inv))
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
        'objects' => [{ 'id' => 'omar_pc', 'type' => 'pc', 'name' => "Omar's PC", 'locked' => true, 'lockType' => 'login', 'owner' => 'omar' },
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
      'room' => { 'npcs' => [{ 'id' => 'omar', 'habits' => { 'password' => 'reused' } }] },
      'stray' => { 'id' => 'len', 'npcType' => 'person', 'role' => 'guard' },
      'social' => { 'characters' => { 'jo' => { 'role' => 'manager' } }, 'awareness' => { 'episodes' => [] } }
    }
    findings = scan(body, data: habits_scenario)
    # Step 8c: a shipped habits block is flagged per server-only subkey, not as the whole block.
    assert_equal [[1, 'withheld_key', 'npc:omar/habits.password'], [1, 'withheld_key', 'npc:len/role']], summary(findings)
    lines = AccessLeakScanner.new(habits_scenario).report_lines(findings)
    lines.each { |line| refute_includes line, 'reused' }
    lines.each { |line| refute_includes line, 'guard' }
  end

  # USB habit review R1 m3: the usb habit ships only inside the resolved plan (work.usb)
  test 'an NPC record carrying a usb habit is reported; work.usb is not' do
    body = { 'room' => { 'npcs' => [{ 'id' => 'omar', 'habits' => { 'usb' => { 'every' => 2 } },
                                      'work' => { 'usb' => { 'every' => 2 } } }] } }
    assert_equal [[1, 'withheld_key', 'npc:omar/habits.usb']], summary(scan(body, data: habits_scenario))
  end

  # USB habit review R2 m2: a habit stick's files, authored or the default, are secrets outside
  # a /container or /unlock answer for the stick, and never public room strings
  STICK_TEXT = 'STICK-ROTA-SECRET-TEXT'.freeze
  NESTED_TEXT = 'STICK-NESTED-SECRET-TEXT'.freeze

  def stick_scenario(contents: nil)
    data = habits_scenario
    stick = { 'type' => 'usb', 'id' => 'omar_usb', 'name' => "Omar's USB stick", 'usbClass' => 'storage', 'takeable' => true }
    stick['contents'] = contents if contents
    omar = data['rooms']['office']['npcs'][0]
    (omar['habits'] ||= {})['usb'] = { 'every' => 2 }
    omar['itemsHeld'] = [stick]
    data
  end

  def authored_files
    [{ 'type' => 'text_file', 'id' => 'omar_rota', 'name' => 'rota.txt', 'text' => STICK_TEXT },
     { 'type' => 'zip_archive', 'id' => 'omar_zip', 'name' => 'old.zip',
       'contents' => [{ 'type' => 'text_file', 'id' => 'omar_inner', 'name' => 'inner.txt', 'text' => NESTED_TEXT }] }]
  end

  test 'a habit stick file in room data is reported; in its own container or unlock answer it is not' do
    data = stick_scenario(contents: authored_files)
    room = { 'room' => { 'npcs' => [{ 'id' => 'omar', 'itemsHeld' => [{ 'id' => 'omar_usb', 'note' => STICK_TEXT }] }] } }
    assert_equal [[1, 'stick_content', 'item:omar_rota']], summary(scan(room, data: data))

    files = { 'contents' => authored_files }
    assert_empty scan(files, path: '/break_escape/games/1/container/omar_usb', data: data)
    assert_empty scan({ 'contents' => authored_files[1]['contents'] }, path: '/break_escape/games/1/container/omar_zip', data: data)
    assert_empty scan({ 'success' => true, 'contents' => authored_files }, path: '/break_escape/games/1/unlock', method: 'POST', data: data)
    other = scan(files, path: '/break_escape/games/1/container/omar_pc', data: data)
    assert_equal ['item:omar_inner', 'item:omar_rota', 'item:omar_zip'], summary(other).map(&:last).sort
  end

  test 'the default work_file.txt is a secret too' do
    data = stick_scenario
    body = { 'inventory' => [{ 'id' => 'omar_usb', 'text' => BreakEscape::AccessWork::USB_STICK_DEFAULT_TEXT }] }
    assert_equal [[1, 'stick_content', 'item:omar_usb_work_file']], summary(scan(body, path: '/break_escape/games/1/inventory', method: 'POST', data: data))
    assert_empty scan({ 'contents' => [{ 'name' => 'work_file.txt', 'text' => BreakEscape::AccessWork::USB_STICK_DEFAULT_TEXT }] },
                      path: '/break_escape/games/1/container/omar_usb', data: data)
    assert_equal 1, AccessLeakScanner.new(data).counts[:stick_items]
  end

  # USB habit review R3 n3: a stick file named like a sign-in PC's own file is left to that file
  test "a sign-in PC's file with a stick file's name is not reported as the stick's" do
    data = stick_scenario(contents: authored_files)
    pc = data['rooms']['office']['objects'].find { |o| o['id'] == 'omar_pc' }
    pc['contents'] = [{ 'type' => 'text_file', 'id' => 'pc_rota', 'name' => 'rota.txt', 'text' => 'PC-ROTA-OWN-SECRET' }]
    answer = { 'contents' => pc['contents'] }
    assert_empty scan(answer, path: '/break_escape/games/1/container/omar_pc', data: data)
    # The stick's own text is still a secret outside its answers
    room = { 'room' => { 'npcs' => [{ 'id' => 'omar', 'note' => STICK_TEXT }] } }
    assert_equal [[1, 'stick_content', 'item:omar_rota']], summary(scan(room, data: data))
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
    assert_empty scan({ 'answers' => [{ 'npcId' => npc['id'], 'run' => nil, 'pending' => [run] }] },
                      path: '/break_escape/games/1/npc_frustration', method: 'POST', data: data), 'pending in an answer (B review R3 m2)'
    assert_equal [[1, 'workaround', "#{npc['id']}[0]"]],
                 summary(scan({ 'answers' => [{ 'npcId' => npc['id'], 'hint' => run }] }, path: '/break_escape/games/1/npc_frustration',
                                                                                     method: 'POST', data: data)),
                 'another key of an answer is not a hand-over'
    assert_empty scan({ 'npcFrustration' => { npc['id'] => { 'pending' => [run], 'done' => [{ 'index' => 0, 'do' => 'prop_door' }] } } },
                      path: '/break_escape/games/1/scenario', data: data)
    assert_empty scan({ 'do' => 'prop_door', 'door' => 'other_room' }, data: data), 'another target is not this workaround'
    assert_equal 1, AccessLeakScanner.new(data).counts[:workarounds]
  end

  test 'a Wi-Fi SSID or key is reported in any response, except a key the player can read' do
    data = scenario
    data['networks'] = { 'guest_wifi' => { 'name' => 'Guest Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Guest', 'psk' => 'seabreeze-2025' } } }
    assert_equal [[1, 'wifi_secret', 'network:guest_wifi']],
                 summary(scan({ 'psk' => 'seabreeze-2025' }, data: data))
    assert_equal [[1, 'wifi_secret', 'network:guest_wifi']],
                 summary(scan({ 'ssid' => 'Harbour-Guest' }, data: data))
    assert_equal 2, AccessLeakScanner.new(data).counts[:wifi_secrets]
    # A key the scenario deliberately shows the player in a note is not a hidden secret
    readable = scenario
    readable['networks'] = { 'guest_wifi' => { 'name' => 'Guest Wi-Fi', 'wifi' => { 'ssid' => 'Harbour-Guest', 'psk' => 'seabreeze-2025' } } }
    readable['rooms']['lobby'] ||= { 'objects' => [] }
    readable['rooms']['lobby']['objects'] << { 'id' => 'note', 'type' => 'postit_note', 'name' => 'Note',
                                               'text' => 'Guest key: seabreeze-2025' }
    assert_empty scan({ 'psk' => 'seabreeze-2025' }, data: readable), 'a readable key is not treated as hidden'
  end

  test 'an authored workaround entry (it carries at) is reported anywhere, a writes_down included' do
    entry = { 'at' => 50, 'do' => 'writes_down' }
    assert_equal [[1, 'workaround', 'authored writes_down']], summary(scan({ 'npcs' => [{ 'id' => 'x', 'list' => [entry] }] }))
    leaked = scan({ 'npcFrustration' => { 'mei' => { 'pending' => [entry] } } }, path: '/break_escape/games/1/scenario')
    assert_equal [[1, 'workaround', 'authored writes_down']], summary(leaked), 'no exemption for an authored entry'
    assert_empty scan({ 'do' => 'writes_down', 'index' => 0, 'hand' => 1 }), 'a run has no at'
  end


  # ---- Slice 9.2 sub-slice H (plan 6.5): the heard share

  SAM_PASSWORD = 'Sam-Share-PW-4417'.freeze
  SHARE = '/break_escape/games/1/npc_workaround'.freeze

  def share_scenario
    {
      'startRoom' => 'open_office',
      'rooms' => { 'open_office' => {
        'type' => 'room_office', 'connections' => {},
        'npcs' => [
          { 'id' => 'sam', 'npcType' => 'person', 'creds' => { 'username' => 'sokafor', 'password' => SAM_PASSWORD },
            'workarounds' => [{ 'at' => 50, 'do' => 'share_login', 'with' => 'ruth' }] },
          { 'id' => 'ruth', 'npcType' => 'person' },
          { 'id' => 'kim', 'npcType' => 'person', 'creds' => { 'username' => 'kim', 'password' => SAM_PASSWORD } }
        ]
      } }
    }
  end

  def share_game(shared, reveal: true)
    data = share_scenario
    data['social'] = { 'captures' => { 'revealSecret' => true } } if reveal
    create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                       scenario: data, player_state: { 'unlockedRooms' => ['open_office'], 'sharedLogins' => shared })
  end

  def heard_answer(extra = {})
    { 'capture' => { 'targetId' => 'sam', 'kind' => 'credential', 'address' => 'sokafor',
                     'note' => "Sam told Ruth his login out loud: sokafor / #{SAM_PASSWORD}" },
      'line' => "It's sokafor. Password's #{SAM_PASSWORD}.",
      'note' => "Sam told Ruth his login out loud: sokafor / #{SAM_PASSWORD}", 'displayName' => 'Sam' }.merge(extra)
  end

  def post_rows(*bodies)
    bodies.each_with_index.map do |(method, path, body), i|
      ['r.jsonl', i + 1, { 'method' => method, 'path' => path, 'status' => 200, 'cmdSeq' => i, 'body' => body }]
    end
  end

  test 'a heard share_login answer may hold the sharer\'s password at line, note and capture.note, then in savedNotes and the bootstrap captures record' do
    game = share_game(['sam'])
    saved = ['GET', '/break_escape/games/1/scenario',
             { 'savedNotes' => [{ 'id' => 'n1', 'text' => heard_answer['note'] }],
               'captures' => { 'sam' => heard_answer['capture'] } }]
    assert_empty AccessLeakScanner.new(game.scenario_data, game: game).scan(post_rows(['POST', SHARE, heard_answer], saved))
  end

  test 'R1 m3: without revealSecret the capture note and se_captures may not hold the shared password' do
    game = share_game(['sam'], reveal: false)
    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(post_rows(['POST', SHARE, heard_answer]))
    assert_equal ['$.capture.note'], findings.map(&:json_path).uniq
    plain = heard_answer
    plain['capture'] = plain['capture'].merge('note' => 'Sam told Ruth his login out loud: sokafor')
    synced = ['PUT', '/break_escape/games/1/sync_state', { 'globalVariables' => { 'se_captures' => [heard_answer['capture']] } }]
    saved = ['GET', '/break_escape/games/1/scenario', { 'savedNotes' => [{ 'id' => 'n1', 'text' => heard_answer['note'] }] }]
    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(post_rows(['POST', SHARE, plain], saved, synced))
    assert_equal [3], findings.map(&:line).uniq, 'the notes keep it; a synced se_captures copy is reported'
  end

  test 'the share exception needs the game, sharedLogins, the POST route and the allowed paths' do
    findings = AccessLeakScanner.new(share_game([]).scenario_data, game: share_game([])).scan(post_rows(['POST', SHARE, heard_answer]))
    assert_equal %w[npc:sam npc:kim], findings.map(&:owner).uniq, 'not in sharedLogins'

    game = share_game(['sam'])
    assert_equal 2, AccessLeakScanner.new(game.scenario_data).scan(post_rows(['POST', SHARE, heard_answer])).map(&:owner).uniq.length, 'no game'
    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(post_rows(['POST', SHARE, heard_answer('extra' => SAM_PASSWORD)]))
    assert_equal ['$.extra'], findings.map(&:json_path).uniq
    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(post_rows(['POST', '/break_escape/games/1/npc_frustration', heard_answer]))
    refute_empty findings, 'another route'
    saved = ['GET', '/break_escape/games/1/scenario', { 'savedNotes' => [{ 'id' => 'n1', 'text' => heard_answer['note'] }] }]
    refute_empty AccessLeakScanner.new(game.scenario_data, game: game).scan(post_rows(saved)), 'savedNotes before any heard answer'
  end

  # ── slice 9.2 sub-slice L: lockouts (plan 6.6, 9.2) ─────────────────

  LOCKOUT_FRUSTRATION = '/break_escape/games/1/npc_frustration'.freeze
  LOCKOUT_SCENARIO = '/break_escape/games/1/scenario'.freeze

  def lockout_game(recorded)
    create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                       scenario: share_scenario,
                       player_state: { 'unlockedRooms' => ['open_office'], 'loginLockouts' => ['sam_pc|sokafor'],
                                       'npcFrustration' => recorded ? { 'sam' => { 'level' => 0, 'lockedOut' => ['sam_pc'] } } : {} })
  end

  test 'L: a recorded lockout may reach the browser in a check answer and GET /scenario npcFrustration' do
    game = lockout_game(true)
    scanner = AccessLeakScanner.new(game.scenario_data, game: game)
    assert_equal 1, scanner.counts[:lockout_records]
    assert_empty scanner.scan(post_rows(['POST', LOCKOUT_FRUSTRATION, { 'answers' => [{ 'npcId' => 'sam', 'lockedOut' => true }] }],
                                        ['GET', LOCKOUT_SCENARIO, { 'npcFrustration' => { 'sam' => { 'level' => 0, 'lockedOut' => ['sam_pc'] } } }]))
  end

  test 'L: an unrecorded lockout, a lockout list or a lockedOut list elsewhere is reported' do
    game = lockout_game(false)
    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(
      post_rows(['POST', LOCKOUT_FRUSTRATION, { 'answers' => [{ 'npcId' => 'sam', 'lockedOut' => true }, { 'npcId' => 'ruth', 'lockedOut' => false }] }],
                ['GET', LOCKOUT_SCENARIO, { 'npcFrustration' => { 'sam' => { 'lockedOut' => ['sam_pc'] } }, 'loginLockouts' => ['sam_pc|sokafor'] }],
                ['GET', '/break_escape/games/1/room/open_office', { 'npcs' => [{ 'id' => 'sam', 'lockedOut' => ['sam_pc'] }], 'state' => { 'loginFailures' => {} } }])
    )
    got = findings.map { |f| [f.rule, f.owner, f.line] }.sort
    # (the list's own value is also a lockout key string, review R1 m4)
    assert_equal [['lockout_list', 'lockedOut', 3], ['lockout_list', 'lockout_key', 2], ['lockout_list', 'loginFailures', 3],
                  ['lockout_list', 'loginLockouts', 2], ['lockout_unrecorded', 'npc:sam', 1], ['lockout_unrecorded', 'npc:sam/sam_pc', 2]], got
    refute(AccessLeakScanner.new(game.scenario_data, game: game).report_lines(findings).any? { |l| l.include?('sokafor') })
  end

  test 'L: a sign-in answer saying lockedOut true is not a lockout record' do
    game = lockout_game(false)
    assert_empty AccessLeakScanner.new(game.scenario_data, game: game).scan(
      post_rows(['POST', '/break_escape/games/1/login', { 'success' => false, 'lockedOut' => true, 'attemptsLeft' => 0 }])
    )
  end

  # ── sub-slice L review round 1 (M1, m4) ─────────────────────────────

  test 'L R1 m4: a lockedOut flag outside a check or sign-in answer is reported' do
    game = lockout_game(true)
    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(
      post_rows(['GET', '/break_escape/games/1/room/open_office', { 'npcs' => [{ 'id' => 'sam', 'lockedOut' => true }] }],
                ['GET', LOCKOUT_SCENARIO, { 'npcFrustration' => { 'sam' => { 'lockedOut' => ['sam_pc'] } }, 'npcs' => [{ 'id' => 'ruth', 'lockedOut' => false }] }],
                ['POST', LOCKOUT_FRUSTRATION, { 'answers' => [{ 'npcId' => 'sam', 'lockedOut' => true }] }],
                ['POST', '/break_escape/games/1/login', { 'success' => false, 'lockedOut' => true }])
    )
    assert_equal [['lockout_list', 'lockedOut', 1], ['lockout_list', 'lockedOut', 2]], findings.map { |f| [f.rule, f.owner, f.line] }.sort
  end

  test 'L R1 m4: a lockout or failure key string is reported under any key, with no username in the report' do
    game = lockout_game(true)
    game.player_state['loginFailures'] = { 'ruth_pc|guessed' => { 'n' => 1, 'seq' => 1 } }
    scanner = AccessLeakScanner.new(game.scenario_data, game: game)
    findings = scanner.scan(
      post_rows(['PUT', '/break_escape/games/1/sync_state', { 'globals' => { 'last_try' => 'sam_pc|sokafor' } }],
                ['GET', LOCKOUT_SCENARIO, { 'log' => ['tried ruth_pc|guessed at 10:02'] }],
                ['GET', LOCKOUT_SCENARIO, { 'note' => 'sam_pc and sokafor, apart, are not a key' }])
    )
    assert_equal [['lockout_list', 'lockout_key', 1], ['lockout_list', 'lockout_key', 2]], findings.map { |f| [f.rule, f.owner, f.line] }.sort
    refute(scanner.report_lines(findings).any? { |l| l.include?('sokafor') || l.include?('guessed') })
  end

  test 'L R1 M1: GET /scenario may list the locked-out PCs at $.lockoutPcs, by id only' do
    game = lockout_game(false)
    ok = AccessLeakScanner.new(game.scenario_data, game: game).scan(post_rows(['GET', LOCKOUT_SCENARIO, { 'lockoutPcs' => ['sam_pc'] }]))
    assert_empty ok
    findings = AccessLeakScanner.new(game.scenario_data, game: game).scan(
      post_rows(['GET', LOCKOUT_SCENARIO, { 'lockoutPcs' => ['sam_pc', 'sokafor', 'ruth_pc'] }],
                ['GET', '/break_escape/games/1/room/open_office', { 'lockoutPcs' => ['sam_pc'] }],
                ['GET', LOCKOUT_SCENARIO, { 'state' => { 'lockoutPcs' => ['sam_pc'] } }])
    )
    # one finding per rule and owner on a line (the first bad entry, the guessed username)
    assert_equal [['lockout_list', 'lockoutPcs', 1, '$.lockoutPcs[1]'], ['lockout_list', 'lockoutPcs', 2, '$.lockoutPcs'], ['lockout_list', 'lockoutPcs', 3, '$.state.lockoutPcs']],
                 findings.map { |f| [f.rule, f.owner, f.line, f.json_path] }.sort
    # without the game, a key-shaped entry is still reported
    bare = AccessLeakScanner.new(game.scenario_data).scan(post_rows(['GET', LOCKOUT_SCENARIO, { 'lockoutPcs' => ['sam_pc', 'sam_pc|sokafor'] }]))
    assert_equal ['$.lockoutPcs[1]'], bare.map(&:json_path)
  end

  # ── sub-slice L review round 2 (n3, n4) ─────────────────────────────

  test 'L R2 n3: a lockout key used as a hash key is reported at its parent, with no username in the report' do
    game = lockout_game(true)
    scanner = AccessLeakScanner.new(game.scenario_data, game: game)
    findings = scanner.scan(
      post_rows(['PUT', '/break_escape/games/1/sync_state', { 'globals' => { 'attempts' => { 'sam_pc|sokafor' => 2 } } }],
                ['GET', LOCKOUT_SCENARIO, { 'attempts' => { 'sam_pc' => 2 } }])
    )
    assert_equal [['lockout_list', 'lockout_key', 1, '$.globals.attempts.[lockout key]']], findings.map { |f| [f.rule, f.owner, f.line, f.json_path] }
    refute(scanner.report_lines(findings).any? { |l| l.include?('sokafor') })
  end

  test 'L R2 n4: a failure key with a blank username is not a lockout key' do
    game = lockout_game(true)
    game.player_state['loginLockouts'] = []
    game.player_state['loginFailures'] = { 'sam_pc|' => { 'n' => 1, 'seq' => 1 } }
    assert_empty AccessLeakScanner.new(game.scenario_data, game: game).scan(
      post_rows(['GET', LOCKOUT_SCENARIO, { 'note' => 'try sam_pc|anything' }])
    )
  end

  # Credential keyring (CREDENTIAL_KEYRING_PLAN.md, section 6.1).
  CRED_SCENARIO = { 'credentials' => { 'ops_rdp' => { 'kind' => 'saved_connection' },
                                       'ops_pw' => { 'kind' => 'password' } } }.freeze

  test 'K1: a credentials key in any response is reported' do
    findings = scan({ 'credentials' => { 'ops_rdp' => { 'kind' => 'saved_connection' } } }, data: CRED_SCENARIO)
    assert_equal [[1, 'credential_registry', 'credentials']], summary(findings)
  end

  test 'K1: a registry password credential carrying its password value is reported' do
    body = { 'rev' => 'abc123', 'entries' => [
      { 'id' => 'ops_pw', 'kind' => 'password', 'source' => 'registry', 'password' => 'Hunter2-xyz' }
    ] }
    findings = scan(body, path: '/break_escape/games/1/keyring', data: CRED_SCENARIO)
    assert_equal [[1, 'credential_password_value', 'credential:ops_pw']], summary(findings)
    refute(AccessLeakScanner.new(CRED_SCENARIO).report_lines(findings).any? { |l| l.include?('Hunter2-xyz') })
  end

  test 'K1: a captured account entry may carry its password; it is not a registry leak' do
    body = { 'rev' => 'abc123', 'entries' => [
      { 'id' => 'jake.password', 'kind' => 'password', 'source' => 'capture', 'password' => 'Biscuit2019' }
    ] }
    assert_empty scan(body, path: '/break_escape/games/1/keyring', data: CRED_SCENARIO)
  end

  # A game that reports a fixed set of credential ids as holding (the scanner reads @game once).
  # captured: the NPC ids it reports as captured accounts (account_capture_usernames).
  class HeldGame
    def initialize(held, captured: [])
      @held = held
      @captured = captured
    end

    def credential_proof_holds?(id, _entry)
      @held.include?(id)
    end

    def account_capture_usernames
      @captured.to_h { |npc_id| [npc_id, "#{npc_id}@example.test"] }
    end
  end

  test 'K1: a registry credential whose proof does not hold is reported, a held one is not' do
    game = HeldGame.new(%w[ops_rdp])
    body = { 'rev' => 'abc123', 'entries' => [
      { 'id' => 'ops_rdp', 'kind' => 'saved_connection', 'source' => 'registry' },
      { 'id' => 'ops_pw', 'kind' => 'password', 'source' => 'registry' }
    ] }
    rows = [['r.jsonl', 1, { 'method' => 'GET', 'path' => '/break_escape/games/1/keyring', 'status' => 200, 'body' => body }]]
    findings = AccessLeakScanner.new(CRED_SCENARIO, game: game).scan(rows)
    assert_equal [[1, 'credential_unheld', 'credential:ops_pw']], summary(findings)
  end

  test 'K1: with no game the unheld check does not run' do
    body = { 'rev' => 'abc123', 'entries' => [
      { 'id' => 'ops_pw', 'kind' => 'password', 'source' => 'registry' }
    ] }
    assert_empty scan(body, path: '/break_escape/games/1/keyring', data: CRED_SCENARIO)
  end

  # Item 1: a GET /keyring capture entry carries the captured account's own password, as GET
  # /capture_secrets does; it is exempt (owner's own game). A registry-sourced entry is not.
  test 'K1: a captured account keyring entry with its password is exempt for the owner' do
    keyring = '/break_escape/games/1/keyring'
    body = { 'rev' => 'abc123', 'entries' => [
      { 'id' => 'jake.password', 'kind' => 'password', 'source' => 'capture', 'password' => JAKE_PASSWORD }
    ] }
    rows = [['r.jsonl', 1, { 'method' => 'GET', 'path' => keyring, 'status' => 200, 'body' => body }]]
    assert_empty AccessLeakScanner.new(scenario, game: HeldGame.new([], captured: %w[jake])).scan(rows),
                 'capture-sourced password is allowed'

    # The same password on a registry-sourced entry is still a leak.
    reg = { 'rev' => 'abc123', 'entries' => [
      { 'id' => 'jake_pw', 'kind' => 'password', 'source' => 'registry', 'password' => JAKE_PASSWORD }
    ] }
    reg_rows = [['r.jsonl', 1, { 'method' => 'GET', 'path' => keyring, 'status' => 200, 'body' => reg }]]
    findings = AccessLeakScanner.new(scenario, game: HeldGame.new([])).scan(reg_rows)
    assert_includes summary(findings), [1, 'password', 'npc:jake'], 'a registry entry password is flagged'
  end

  # Carry-in m3: the `source: "capture"` label alone exempts nothing. The entry's id must be
  # `<npcId>.password` for an account the recorded state serves as captured, and the password must
  # be that NPC's own.
  test 'K2 m3: a capture-labelled keyring password is exempt only for a captured account under its own id' do
    keyring = '/break_escape/games/1/keyring'
    scan_with = lambda do |entry, captured|
      body = { 'rev' => 'abc123', 'entries' => [entry] }
      rows = [['r.jsonl', 1, { 'method' => 'GET', 'path' => keyring, 'status' => 200, 'body' => body }]]
      summary(AccessLeakScanner.new(scenario, game: HeldGame.new([], captured: captured)).scan(rows))
    end
    own = { 'id' => 'jake.password', 'kind' => 'password', 'source' => 'capture', 'password' => JAKE_PASSWORD }
    assert_empty scan_with.call(own, %w[jake])

    # Not captured in the recorded state: flagged although the label says capture.
    assert_includes scan_with.call(own, []), [1, 'password', 'npc:jake']
    # Another NPC is captured, and the entry claims capture under a made-up id.
    forged = own.merge('id' => 'anything')
    assert_includes scan_with.call(forged, %w[jake]), [1, 'password', 'npc:jake']
    # A captured account's id carrying someone else's password.
    other = own.merge('id' => 'sam.password')
    assert_includes scan_with.call(other, %w[sam]), [1, 'password', 'npc:jake']
  end

  # A held keyring entry's label/foundIn are an intended disclosure; the sign-in item's name can
  # match them. Held-ness comes from the same proof check as credential_unheld.
  def keyring_signin_scan(entry, held:)
    data = scenario.merge('credentials' => { 'jake_pw_note' => { 'kind' => 'password' } })
    body = { 'rev' => 'abc123', 'entries' => [entry] }
    rows = [['r.jsonl', 1, { 'method' => 'GET', 'path' => '/break_escape/games/1/keyring', 'status' => 200, 'body' => body }]]
    AccessLeakScanner.new(data, game: HeldGame.new(held)).scan(rows)
  end

  test 'K1: a held keyring entry whose label and foundIn equal a sign-in item name gives no finding' do
    entry = { 'id' => 'jake_pw_note', 'kind' => 'password', 'source' => 'registry',
              'label' => 'Local notes on this PC.txt', 'foundIn' => 'Local notes on this PC.txt' }
    assert_empty keyring_signin_scan(entry, held: %w[jake_pw_note])
  end

  test 'K1: an unheld keyring entry whose label equals a sign-in item name is still flagged' do
    entry = { 'id' => 'jake_pw_note', 'kind' => 'password', 'source' => 'registry',
              'label' => 'Local notes on this PC.txt' }
    assert_equal [[1, 'signin_content', 'item:jake_local'], [1, 'credential_unheld', 'credential:jake_pw_note']],
                 summary(keyring_signin_scan(entry, held: [])).sort_by(&:last).reverse
  end

  test 'K1: file body text in a held keyring entry is still flagged' do
    entry = { 'id' => 'jake_pw_note', 'kind' => 'password', 'source' => 'registry',
              'label' => 'Local notes on this PC.txt', 'body' => 'PC-LOCAL-SECRET-TEXT' }
    assert_equal [[1, 'signin_content', 'item:jake_local']], summary(keyring_signin_scan(entry, held: %w[jake_pw_note]))
  end

  # R2 m3: the item-level `credential` field is server-only (both client filters strip it), so it is
  # a second guard flagging it in any client response.
  test 'K1: an item-level credential field in any response is reported' do
    findings = scan({ 'room' => { 'objects' => [{ 'id' => 'f', 'type' => 'text_file', 'credential' => 'lena_rdp' }] } },
                    data: CRED_SCENARIO)
    assert_equal [[1, 'credential_field', 'credential']], summary(findings)
  end

  # K5 (CREDENTIAL_KEYRING_PLAN.md, section 10): the token clock is server-only. The key never
  # appears in an answer; with a game given, a recorded clock value never appears either.
  class ClockGame
    def initialize(clock)
      @player_state = { 'credentialClock' => clock }
    end
    attr_reader :player_state
  end

  test 'K5: a credentialClock key in any response is reported, wherever it nests' do
    findings = scan({ 'playerState' => { 'credentialClock' => { 'lena_token' => 1_731_700_000.5 } } }, data: CRED_SCENARIO)
    assert_equal [[1, 'credential_clock', 'credentialClock']], summary(findings)
    refute(AccessLeakScanner.new(CRED_SCENARIO).report_lines(findings).any? { |l| l.include?('1731700000') })
  end

  test 'K5: an empty credentialClock key is still reported' do
    assert_equal [[1, 'credential_clock', 'credentialClock']],
                 summary(scan({ 'credentialClock' => {} }, data: CRED_SCENARIO))
  end

  test 'K5: a recorded token clock value in an answer is reported, an expiresInS is not' do
    game = ClockGame.new('lena_token' => 1_731_700_000.5)
    leak = [['r.jsonl', 1, { 'method' => 'GET', 'path' => '/break_escape/games/1/keyring', 'status' => 200,
                             'body' => { 'rev' => 'abc', 'entries' => [], 'note' => 1_731_700_000.5 } }]]
    assert_equal [[1, 'credential_clock', 'credentialClock']],
                 summary(AccessLeakScanner.new(CRED_SCENARIO, game: game).scan(leak))
    clean = [['r.jsonl', 1, { 'method' => 'GET', 'path' => '/break_escape/games/1/keyring', 'status' => 200,
                              'body' => { 'rev' => 'abc', 'entries' => [], 'unchanged' => true, 'expiresInS' => { 'lena_token' => 237 } } }]]
    assert_empty AccessLeakScanner.new(CRED_SCENARIO, game: game).scan(clean)
  end

  # ---- E0.3 (PHYSICAL_PENTEST_DEVICES_PLAN.md): a capture secret and a plant-proofed account ----
  # password are served legitimately only after the plant; a Wi-Fi key with a proof is judged as
  # a capture secret; a capture descriptor's secret is not public room text.
  STAFF_PSK = 'Staff-Key-8841-alpha'.freeze
  GUEST_PSK = 'Guest-Wifi-2024'.freeze
  KIERAN_PASSWORD = 'tidy-orange-ladder'.freeze
  CHRIS_PASSWORD = 'Chris-Pass-6603'.freeze
  CAPTURES = '/break_escape/games/1/capture_secrets'.freeze
  INVENTORY = '/break_escape/games/1/inventory'.freeze
  PLANT_PROOF = { 'planted' => 'kit_rogue_ap', 'on' => 'rogue_ap_spot' }.freeze

  # Ruth (a phone NPC, no account) writes the staff key with the plant proof; Kieran holds an
  # account with the same proof, admitted at hot_desk_pc; Chris's keylogger proof sits on a
  # jack, so it is not order-checked.
  def pentest_scenario(psk_proof: true)
    key_capture = { 'targetId' => 'staff_wifi_key', 'kind' => 'credential', 'secret' => STAFF_PSK }
    key_capture['proof'] = PLANT_PROOF.dup if psk_proof
    {
      'startItemsInInventory' => [{ 'type' => 'kit', 'id' => 'kit_rogue_ap', 'name' => 'Rogue AP kit' }],
      'social' => { 'captures' => { 'revealSecret' => true } },
      'networks' => {
        'office_lan' => { 'name' => 'Office LAN segment', 'wifi' => { 'ssid' => 'LW-Staff-Secure', 'psk' => STAFF_PSK } },
        'guest_net' => { 'name' => 'Guest segment', 'wifi' => { 'ssid' => 'LW-Guest', 'psk' => GUEST_PSK } }
      },
      'rooms' => {
        'reception' => {
          'type' => 'room_office',
          'objects' => [
            { 'id' => 'guest_card', 'type' => 'notes', 'name' => 'Guest Wi-Fi card',
              'text' => "Guest Wi-Fi: LW-Guest, key #{GUEST_PSK}" },
            { 'id' => 'rogue_ap_spot', 'type' => 'plant_spot', 'name' => 'Behind the plant',
              'requiresItem' => 'kit_rogue_ap', 'consumesItem' => true,
              'triggerOnInteract' => [{ 'type' => 'set_global', 'key' => 'ap_planted', 'value' => true }] },
            { 'id' => 'chris_jack', 'type' => 'network_port', 'name' => 'Port', 'networkJack' => true, 'network' => 'office_lan' },
            { 'id' => 'hot_desk_pc', 'type' => 'pc', 'name' => 'Hot desk', 'lockType' => 'login', 'locked' => true,
              'access' => { 'people' => %w[kieran chris] } }
          ],
          'npcs' => [
            { 'id' => 'ruth', 'npcType' => 'phone', 'eventMappings' => [{ 'eventPattern' => 'npc_used:laptop', 'addCapture' => key_capture }] },
            { 'id' => 'kieran', 'npcType' => 'person', 'creds' => { 'username' => 'k.doyle', 'password' => KIERAN_PASSWORD },
              'captureProof' => [PLANT_PROOF.dup],
              'eventMappings' => [{ 'eventPattern' => 'npc_used:laptop',
                                    'addCapture' => { 'targetId' => 'kieran', 'kind' => 'credential', 'address' => 'k.doyle' } }] },
            { 'id' => 'chris', 'npcType' => 'person', 'creds' => { 'username' => 'c.ward', 'password' => CHRIS_PASSWORD },
              'captureProof' => [{ 'planted' => 'kit_logger', 'on' => 'chris_jack' }],
              'eventMappings' => [{ 'eventPattern' => 'x',
                                    'addCapture' => { 'targetId' => 'chris', 'kind' => 'credential', 'address' => 'c.ward' } }] }
          ]
        }
      }
    }
  end

  # A stand-in game: only the final-state proof check is read on these routes.
  class ProofGame
    attr_reader :player_state

    def initialize(holds)
      @holds = holds
      @player_state = {}
    end

    def capture_proof_holds?(_proof)
      @holds
    end
  end

  def inv_row(inv: :absent, status: 200)
    row = { 'method' => 'POST', 'path' => INVENTORY, 'status' => status, 'body' => { 'success' => true } }
    row['inv'] = inv unless inv == :absent
    row
  end

  def plant_row(item: 'kit_rogue_ap', on: 'rogue_ap_spot')
    inv_row(inv: { 'action' => 'remove', 'itemId' => item, 'usedOn' => on })
  end

  def other_inv_row
    inv_row(inv: { 'action' => 'add', 'itemId' => 'coffee', 'usedOn' => nil })
  end

  def served_psk
    { 'method' => 'GET', 'path' => CAPTURES, 'status' => 200, 'body' => { 'secrets' => { 'staff_wifi_key' => STAFF_PSK } } }
  end

  def served_kieran
    { 'method' => 'GET', 'path' => CAPTURES, 'status' => 200, 'body' => { 'secrets' => { 'kieran' => KIERAN_PASSWORD } } }
  end

  def dom_row(text, label)
    { 'dom' => text, 'label' => label }
  end

  def plant_scan(rows, game: nil, data: pentest_scenario, served_npcs: nil)
    AccessLeakScanner.new(data, game: game, served_npcs: served_npcs)
                     .scan(rows.each_with_index.map { |row, i| ['r.jsonl', i + 1, row] })
  end

  # Several files read in argument order as one log
  def plant_scan_files(files, game: nil, served_npcs: nil)
    lines = files.flat_map { |name, rows| rows.each_with_index.map { |row, i| [name, i + 1, row] } }
    AccessLeakScanner.new(pentest_scenario, game: game, served_npcs: served_npcs).scan(lines)
  end

  test 'E0.3: a proofed PSK on /capture_secrets with no prior plant and no game is flagged' do
    assert_equal [[2, 'capture_secret', 'capture:staff_wifi_key']], summary(plant_scan([other_inv_row, served_psk]))
    assert_equal [[1, 'capture_secret', 'capture:staff_wifi_key']], summary(plant_scan([served_psk]))
  end

  test 'E0.3: a log with no POST /inventory rows and a game whose proof holds is clean (the plant predates the log)' do
    assert_empty plant_scan([served_psk], game: ProofGame.new(true))
  end

  test 'E0.3: a fully tagged log with no plant row for the item, a game whose proof holds: clean' do
    assert_empty plant_scan([other_inv_row, plant_row(item: 'kit_other', on: 'desk'), served_psk], game: ProofGame.new(true))
  end

  test 'E0.3: an untagged remove row before the served row turns the shortcut off' do
    assert_equal [[3, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([other_inv_row, inv_row(inv: nil), served_psk], game: ProofGame.new(true)))
    # A remove row with no inv key in an otherwise tagged log is unreadable too
    assert_equal [[3, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([other_inv_row, inv_row, served_psk], game: ProofGame.new(true)))
  end

  test 'E0.3: a pre-change log (no inv key on any POST /inventory row) keeps the old rules' do
    rows = [inv_row, served_psk]
    old = AccessLeakScanner.new(pentest_scenario).scan(rows.each_with_index.map { |row, i| ['r.jsonl', i + 1, row] })
    assert_empty old
    assert_empty plant_scan(rows, game: ProofGame.new(true))
    assert_empty plant_scan(rows, game: ProofGame.new(false)), 'not order-checked, and the old exemption stands'
  end

  test 'E0.3: argument order is the log order across files' do
    # The plant in a second file, served in the first: flagged
    assert_equal [[1, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan_files([['a.jsonl', [served_psk]], ['b.jsonl', [plant_row]]]))
    # A DOM file after the response file it was read beside: clean
    assert_empty plant_scan_files([['a.jsonl', [plant_row]], ['dom.jsonl', [dom_row("Wi-Fi key #{STAFF_PSK}", 'capture log')]]])
    # The DOM file passed first sits before the plant: flagged
    assert_equal [[1, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan_files([['dom.jsonl', [dom_row("Wi-Fi key #{STAFF_PSK}", 'capture log')]], ['a.jsonl', [plant_row]]]))
  end

  test 'E0.3: served before the plant row, or with a failing proof, is flagged; after a tagged plant that held, clean' do
    # No plant in the log, a game whose proof fails
    assert_equal [[1, 'capture_secret', 'capture:staff_wifi_key']], summary(plant_scan([served_psk], game: ProofGame.new(false)))
    # The plant row comes after the served row, the proof holds now
    assert_equal [[1, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([served_psk, plant_row], game: ProofGame.new(true)))
    # After the plant, a game whose proof fails (a refused plant)
    assert_equal [[2, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([plant_row, served_psk], game: ProofGame.new(false)))
    # After a tagged plant with the proof held
    assert_empty plant_scan([plant_row, served_psk], game: ProofGame.new(true))
    assert_empty plant_scan([plant_row, served_psk])
    # A plant row the server refused (not 200) is no plant
    assert_equal [[2, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([plant_row.merge('status' => 422), served_psk]))
    # A plant of the right item on another object is no plant for this proof
    assert_equal [[2, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([plant_row(on: 'chris_jack'), served_psk]))
  end

  test 'E0.3: DOM rows are exempt only when labelled as a capture page' do
    assert_equal [[2, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([plant_row, dom_row("Clients: 3, key #{STAFF_PSK}", 'rogue-ap console')]))
    assert_empty plant_scan([plant_row, dom_row("Wi-Fi key #{STAFF_PSK}", 'capture log')])
    assert_empty plant_scan([plant_row, dom_row("Wi-Fi key #{STAFF_PSK}", 'Captures terminal')])
    assert_equal [[1, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([dom_row("Wi-Fi key #{STAFF_PSK}", 'capture log'), plant_row]))
  end

  test 'E0.3: the proofed PSK anywhere else is a capture secret, not a Wi-Fi secret' do
    room = { 'method' => 'GET', 'path' => ROOM, 'status' => 200, 'body' => { 'room' => { 'objects' => [{ 'id' => 'n', 'text' => STAFF_PSK }] } } }
    scen = { 'method' => 'GET', 'path' => '/break_escape/games/1/scenario', 'status' => 200, 'body' => { 'hint' => "key #{STAFF_PSK}" } }
    boot = { 'method' => 'GET', 'path' => '/break_escape/games/1/bootstrap', 'status' => 200, 'body' => { 'x' => [STAFF_PSK] } }
    findings = plant_scan([plant_row, room, scen, boot], game: ProofGame.new(true))
    assert_equal [[2, 'capture_secret', 'capture:staff_wifi_key'], [3, 'capture_secret', 'capture:staff_wifi_key'],
                  [4, 'capture_secret', 'capture:staff_wifi_key']], summary(findings)
  end

  test 'E0.3: a PSK whose writer has no proof stays a Wi-Fi secret, flagged even on /capture_secrets' do
    findings = plant_scan([plant_row, served_psk], data: pentest_scenario(psk_proof: false))
    assert_equal [[2, 'wifi_secret', 'network:office_lan']], summary(findings)
  end

  test 'E0.3: a value only in a capture descriptor is not public room text; the printed guest key is' do
    scanner = AccessLeakScanner.new(pentest_scenario)
    public_strings = scanner.send(:room_data_strings)
    refute public_strings.any? { |s| s.include?(STAFF_PSK) }, 'an addCapture secret never ships'
    assert public_strings.any? { |s| s.include?(GUEST_PSK) }
    wifi = scanner.instance_variable_get(:@wifi_secrets)
    refute wifi.key?(GUEST_PSK), 'the guest key on the card is not a secret'
    refute wifi.key?(STAFF_PSK), 'the proofed staff key is judged as a capture secret'
    # A usePayload's secret is a descriptor too
    data = pentest_scenario
    data['rooms']['reception']['npcs'] << { 'id' => 'payload_npc', 'usePayload' => { 'targetId' => 'p', 'secret' => 'Payload-Only-Value-91' } }
    refute AccessLeakScanner.new(data).send(:room_data_strings).any? { |s| s.include?('Payload-Only-Value-91') }
  end

  test 'E0.3: an SSID not in room text is still flagged anywhere' do
    row = { 'method' => 'GET', 'path' => CAPTURES, 'status' => 200, 'body' => { 'ssid' => 'LW-Staff-Secure' } }
    assert_equal [[2, 'wifi_secret', 'network:office_lan']], summary(plant_scan([plant_row, row]))
  end

  test 'E0.3: a plant-proofed account password is order-checked on /capture_secrets' do
    # Before the tagged plant row: flagged
    assert_equal [[1, 'password', 'npc:kieran']],
                 summary(plant_scan([served_kieran, plant_row], served_npcs: %w[kieran]))
    # After it, served_npcs naming him: clean
    assert_empty plant_scan([plant_row, served_kieran], served_npcs: %w[kieran])
    # After it, served_npcs not naming him: flagged
    assert_equal [[2, 'password', 'npc:kieran']], summary(plant_scan([plant_row, served_kieran], served_npcs: %w[chris]))
    # The resumed-log rule: no inventory rows, a game whose proof holds
    assert_empty plant_scan([served_kieran], game: ProofGame.new(true), served_npcs: %w[kieran])
    # An unreadable remove row makes it unverifiable
    assert_equal [[3, 'password', 'npc:kieran']],
                 summary(plant_scan([other_inv_row, inv_row(inv: nil), served_kieran], game: ProofGame.new(true), served_npcs: %w[kieran]))
  end

  test 'E0.3: a plant-proofed account password in DOM rows' do
    assert_empty plant_scan([plant_row, dom_row("k.doyle #{KIERAN_PASSWORD}", 'capture log')], served_npcs: %w[kieran])
    assert_equal [[2, 'password', 'npc:kieran']],
                 summary(plant_scan([plant_row, dom_row("k.doyle #{KIERAN_PASSWORD}", 'rogue-ap console')], served_npcs: %w[kieran]))
  end

  test 'E0.3: a jack-proofed password and a pre-change log give the same findings as before' do
    chris = { 'method' => 'GET', 'path' => CAPTURES, 'status' => 200, 'body' => { 'secrets' => { 'chris' => CHRIS_PASSWORD } } }
    # The jack plant is not order-checked: no plant row needed, served_npcs decides as before
    assert_empty plant_scan([other_inv_row, chris], served_npcs: %w[chris])
    assert_equal [[2, 'password', 'npc:chris']], summary(plant_scan([other_inv_row, chris], served_npcs: %w[kieran]))
    # A pre-change log serving Kieran's password before any plant: the old rule (served_npcs only)
    assert_empty plant_scan([inv_row, served_kieran], served_npcs: %w[kieran])
    assert_empty plant_scan([inv_row, chris], served_npcs: %w[chris])
  end

  # ---- R1 fixes ----

  def no_on_scenario
    data = pentest_scenario
    data['rooms']['reception']['npcs'].find { |n| n['id'] == 'ruth' }['eventMappings'][0]['addCapture']['proof'] =
      { 'planted' => 'kit_rogue_ap' }
    data
  end

  test 'R1 m2: a planted proof with no on is order-checked against a plant on any non-jack object' do
    data = no_on_scenario
    assert_equal [[1, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([served_psk, plant_row], data: data, game: ProofGame.new(true)))
    assert_empty plant_scan([plant_row, served_psk], data: data, game: ProofGame.new(true))
    # A plant on a jack is no plant for a proof with no on
    assert_equal [[2, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([plant_row(on: 'chris_jack'), served_psk], data: data))
  end

  test 'R2 m1: a remove of the kit on an object that does not take it is no plant for a proof with no on' do
    data = no_on_scenario
    data['rooms']['reception']['objects'] << { 'id' => 'decoy', 'type' => 'plant_spot', 'name' => 'Decoy', 'requiresItem' => 'kit_other' }
    decoy = plant_row(on: 'decoy')
    # The decoy remove comes first, the real plant after the served row: flagged
    assert_equal [[2, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([decoy, served_psk, plant_row], data: data, game: ProofGame.new(true)))
  end

  test 'R3 m2: a remove of the kit on a taker nested in a container is no plant for a proof with no on' do
    data = no_on_scenario
    data['rooms']['reception']['objects'] << { 'id' => 'cabinet', 'type' => 'safe', 'name' => 'Cabinet', 'contents' => [
      { 'id' => 'nested_spot', 'type' => 'plant_spot', 'name' => 'Nested', 'requiresItem' => 'kit_rogue_ap',
        'consumesItem' => true, 'triggerOnInteract' => [] }
    ] }
    nested = plant_row(on: 'nested_spot')
    # The server records a plant on a top-level object only, so the nested remove is not the earliest plant
    assert_equal [[2, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([nested, served_psk, plant_row], data: data, game: ProofGame.new(true)))
  end

  test 'R1 m1: a holder with a plant proof and another kind is not passed unconditionally' do
    data = pentest_scenario
    kieran = data['rooms']['reception']['npcs'].find { |n| n['id'] == 'kieran' }
    kieran['captureProof'] = [PLANT_PROOF.dup, { 'session' => 'hot_desk_pc' }]
    # Only the plant held (the stand-in game answers per proof kind): the session proof fails now,
    # and the plant row comes after the served row, so he is flagged
    game = Class.new(ProofGame) { def capture_proof_holds?(proof); proof.key?('planted'); end }.new(true)
    assert_equal [[1, 'password', 'npc:kieran']],
                 summary(plant_scan([served_kieran, plant_row], data: data, game: game, served_npcs: %w[kieran]))
    # With the session proof holding, it is clean
    assert_empty plant_scan([served_kieran, plant_row], data: data, game: ProofGame.new(true), served_npcs: %w[kieran])
  end

  test 'R1 t1: a tagged remove with a used_on but no item id makes the log unverifiable' do
    unreadable = inv_row(inv: { 'action' => 'remove', 'itemId' => nil, 'usedOn' => 'rogue_ap_spot' })
    assert_equal [[3, 'capture_secret', 'capture:staff_wifi_key']],
                 summary(plant_scan([other_inv_row, unreadable, served_psk], game: ProofGame.new(true)))
  end
end
