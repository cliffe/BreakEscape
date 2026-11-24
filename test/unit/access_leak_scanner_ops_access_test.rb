require 'test_helper'
require_relative '../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops core S3 (OPS_CORE_PLAN.md 7, 11.4, N15): the `card held` and `grant` tags of the leak scanner's
# collect_ops_secrets and its structural rules for technique cards, technique answers and session keys.
# Rows and answers have the shapes the server really sends (ops_held_techniques, use_technique!,
# ops_technique_refusal, login_session_answer, host_row, ops_finding_row, keyring_for_client).
class AccessLeakScannerOpsAccessTest < ActiveSupport::TestCase
  S = NetworkOpsScenario
  BASE = '/break_escape/games/1'.freeze
  VIEW = "#{BASE}/network".freeze
  TECH = "#{BASE}/network/technique".freeze
  CHECK = "#{BASE}/network/check".freeze
  CONFIRM = "#{BASE}/network/confirm".freeze
  INV = "#{BASE}/inventory".freeze
  KEYRING = "#{BASE}/keyring".freeze
  ROOM = "#{BASE}/room/lobby".freeze
  BOOT = "#{BASE}/scenario".freeze
  STEP_UP = 'sam_pc.files.step_up'.freeze
  FACTORY_NAME = 'Factory accounts'.freeze
  FACTORY_SUMMARY = 'Devices often ship with a published account.'.freeze

  def data
    S.techniques_scenario
  end

  def pivot_scenario
    S.pivot_techniques_scenario
  end

  def row(body, path: VIEW, method: 'GET', status: 200, extra: {})
    { 'method' => method, 'path' => path, 'status' => status, 'body' => body }.merge(extra)
  end

  def scan(rows, ops_steps: nil, scenario: data)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    AccessLeakScanner.new(scenario).scan(lines, ops_steps: ops_steps)
  end

  def owners(findings)
    findings.map(&:owner).uniq.sort
  end

  def registered
    AccessLeakScanner.new(data).instance_variable_get(:@ops_strings)
  end

  # A successful POST /inventory add, tagged as the recorder tags it.
  def inv_add(item_id, status: 200)
    row({ 'success' => true }, path: INV, method: 'POST', status: status, extra: { 'inv' => { 'action' => 'add', 'itemId' => item_id, 'usedOn' => nil } })
  end

  def held_entry(item_id = 'card_factory', extra = {})
    { 'name' => FACTORY_NAME, 'summary' => FACTORY_SUMMARY, 'worksOn' => { 'class' => 'default_creds' }, 'itemId' => item_id }.merge(extra)
  end

  def view(techniques: nil, hosts: [], foothold: S::OFFICE)
    body = { 'footholds' => [{ 'id' => foothold, 'hosts' => hosts, 'networks' => [] }] }
    body['techniques'] = techniques if techniques
    row(body)
  end

  def session_hash(extra = {})
    { 'npcId' => 'sam', 'username' => 'sam', 'displayName' => 'Sam', 'via' => 'technique', 'remote' => true,
      'footholdId' => S::OFFICE, 'host' => 'HB-DESK-01' }.merge(extra)
  end

  # The recorder's `tech` tag (the request's finding_id) is what names the finding while the capture holds
  # the request; `tag: false` is a capture without it, where the scanner reads the answer instead.
  def tech_tag(finding, tag)
    tag ? { 'tech' => { 'findingId' => finding } } : {}
  end

  def grant_answer(access: nil, foothold: S::OFFICE, finding: access == 'admin' ? STEP_UP : S::FACTORY, tag: true)
    extra = access ? { 'access' => access } : {}
    row({ 'success' => true, 'grant' => 'session', 'session' => session_hash(extra.merge('footholdId' => foothold)) },
        path: TECH, method: 'POST', extra: tech_tag(finding, tag))
  end

  def credential_answer(finding: S::SPOOL, tag: true)
    row({ 'success' => true, 'grant' => 'credential', 'keyringChanged' => true }, path: TECH, method: 'POST', extra: tech_tag(finding, tag))
  end

  def refusal(reason, need: nil)
    body = { 'success' => false, 'reason' => reason }
    body['need'] = need if need
    row(body, path: TECH, method: 'POST', status: 422)
  end

  def pc_row(session: nil, blocked: false)
    host = { 'id' => 'sam_pc', 'kind' => 'pc', 'name' => 'Sam desk', 'host' => 'Sam desk', 'sprite' => 'pc_desktop', 'headless' => false,
             'remoteSignIn' => !blocked }
    host['session'] = session if session
    host
  end

  def host_session(extra = {})
    { 'username' => 'sokafor', 'displayName' => 'Sam', 'via' => 'technique', 'remote' => true }.merge(extra)
  end

  test 'the collector tags a held technique card strings card, a granted credential grant, and an uncarried registry id never' do
    strings = registered
    assert_equal [:card, 'factory_accounts'], strings[FACTORY_NAME].first.values_at(:tag, :step)
    assert_equal :card, strings[FACTORY_SUMMARY].first[:tag]
    assert_includes strings[S::WEB_PRODUCT].map { |e| e[:tag] }, :card, 'a product a technique works on'
    assert_includes strings[S::VERSION_SECRET].map { |e| e[:tag] }, :card, 'a version a technique works on'
    assert_equal :grant, strings['print_admin'].first[:tag]
    assert_equal :grant, strings['Lab admin'].first[:tag]
    assert_equal [:never], strings['unheld_flaw'].map { |e| e[:tag] }, 'no card carries it'
    refute strings.key?('factory_accounts'), 'a registry id a card carries is public with the card'
  end

  test 'the technique registry is never sent: a techniques key outside the held map, and a worksOn key outside it, are leaks' do
    registry = { 'techniques' => data['techniques'] }
    assert_includes owners(scan([row(registry, path: BOOT)], ops_steps: ['card:factory_accounts'])), 'ops:key:techniques'
    assert_includes owners(scan([row({ 'a' => { 'techniques' => {} } }, path: ROOM)])), 'ops:key:techniques'
    assert_includes owners(scan([row({ 'footholds' => [{ 'techniques' => {} }] })])), 'ops:key:techniques'
    assert_includes owners(scan([row({ 'worksOn' => { 'class' => 'misconfig' } }, path: ROOM)])), 'ops:key:worksOn'
    assert_empty scan([view(techniques: { 'factory_accounts' => held_entry })], ops_steps: ['card:factory_accounts'])
  end

  test 'a techniques entry for a card the player does not hold is a leak, and the inventory add of the card earns it' do
    leak = view(techniques: { 'factory_accounts' => held_entry })
    assert_includes owners(scan([leak])), 'ops:technique:factory_accounts'
    assert_empty scan([inv_add('card_factory'), leak])
    assert_includes owners(scan([leak, inv_add('card_factory')])), 'ops:technique:factory_accounts', 'the card came after the view'
  end

  test 'a refused, untagged or other-item inventory answer earns no card' do
    leak = view(techniques: { 'factory_accounts' => held_entry })
    refused = inv_add('card_factory', status: 422)
    refused['body'] = { 'success' => false, 'message' => 'no' }
    assert_includes owners(scan([refused, leak])), 'ops:technique:factory_accounts'
    assert_includes owners(scan([inv_add('card_build'), leak])), 'ops:technique:factory_accounts', 'another card'
    assert_includes owners(scan([inv_add('lobby_poster'), leak])), 'ops:technique:factory_accounts', 'not a card item'
    untagged = inv_add('card_factory')
    untagged.delete('inv')
    assert_includes owners(scan([untagged, leak])), 'ops:technique:factory_accounts'
    removed = inv_add('card_factory')
    removed['inv']['action'] = 'remove'
    assert_includes owners(scan([removed, leak])), 'ops:technique:factory_accounts'
  end

  test 'a card in the starting inventory is held from the first answer' do
    scenario = data
    scenario['rooms']['lobby']['objects'].delete_if { |o| o['id'] == 'card_factory' }
    scenario['startItemsInInventory'] = [{ 'id' => 'card_factory', 'type' => 'technique_card', 'name' => 'Field note start',
                                           'technique_card' => 'factory_accounts' }]
    assert_empty scan([view(techniques: { 'factory_accounts' => held_entry })], scenario: scenario)
  end

  test 'a held entry carries only name, summary, worksOn and itemId, and an itemId that is a card of that technique' do
    steps = ['card:factory_accounts']
    extra = view(techniques: { 'factory_accounts' => held_entry('card_factory', 'grants' => { 'credential' => 'print_admin' }) })
    assert_includes owners(scan([extra], ops_steps: steps)), 'ops:technique:factory_accounts'
    wrong = view(techniques: { 'factory_accounts' => held_entry('card_build') })
    assert_includes owners(scan([wrong], ops_steps: steps)), 'ops:technique:factory_accounts'
    unknown = view(techniques: { 'invented' => held_entry })
    assert_includes owners(scan([unknown], ops_steps: steps + ['card:invented'])), 'ops:technique:invented'
    assert_empty scan([view(techniques: { 'factory_accounts' => held_entry('card_factory_b') })], ops_steps: steps)
  end

  test 'a technique name, summary, product or version is a leak before its card is held and clear after' do
    text = row({ 'text' => "#{FACTORY_NAME} is in the registry" }, path: ROOM)
    assert_includes owners(scan([text])), 'ops:technique:factory_accounts'
    assert_empty scan([inv_add('card_factory'), text])
    summary = row({ 'note' => FACTORY_SUMMARY }, path: ROOM)
    assert_includes owners(scan([summary])), 'ops:technique:factory_accounts'
    assert_empty scan([summary], ops_steps: ['card:factory_accounts'])
    version = row({ 'note' => S::VERSION_SECRET }, path: ROOM)
    assert_includes owners(scan([version])), 'ops:technique:build_flaw'
    assert_empty scan([inv_add('card_build'), version])
    ghost = row({ 'note' => 'unheld_flaw' }, path: ROOM)
    assert_includes owners(scan([ghost], ops_steps: ['card:unheld_flaw'])), 'ops:technique:unheld_flaw', 'an id no card carries is never'
  end

  test 'a technique answer carries only its own keys: a grant, a session without a technique key, a refusal with a need of two keys' do
    assert_empty scan([grant_answer])
    assert_empty scan([credential_answer])
    assert_empty scan([refusal('wrong_class'), refusal('need_unmet', need: { 'kind' => 'item', 'label' => 'Panel installer sheet' })])
    assert_includes owners(scan([row({ 'success' => true, 'grant' => 'session', 'finding' => 'sam_pc.web.x',
                                       'session' => session_hash }, path: TECH, method: 'POST')])), 'ops:technique:answer'
    assert_includes owners(scan([row({ 'success' => true, 'grant' => 'credential', 'keyringChanged' => true, 'credential' => 'print_admin' },
                                     path: TECH, method: 'POST')])), 'ops:technique:answer'
    assert_includes owners(scan([row({ 'success' => true, 'grant' => 'credential', 'session' => session_hash }, path: TECH, method: 'POST')])),
                    'ops:technique:answer'
    assert_includes owners(scan([refusal('no_grant', need: { 'kind' => 'item', 'label' => 'x' })])), 'ops:technique:answer'
    assert_includes owners(scan([refusal('need_unmet', need: { 'kind' => 'item', 'label' => 'x', 'met' => false })])), 'ops:technique:answer'
    assert_includes owners(scan([row({ 'success' => false, 'reason' => 'fixed', 'finding' => 'f1' }, path: TECH, method: 'POST', status: 422)])),
                    'ops:technique:answer'
  end

  test 'a session record key technique is never sent, in any answer' do
    leaked = grant_answer
    leaked['body']['session']['technique'] = 'sam_pc.web.factory_login'
    assert_includes owners(scan([leaked])), 'ops:key:technique'
    row_with = view(hosts: [pc_row(session: host_session('technique' => 'sam_pc.web.factory_login'))])
    assert_includes owners(scan([grant_answer, row_with])), 'ops:key:technique'
  end

  test 'via technique is sent only after a technique session was granted, and never in a scan, check or confirm answer' do
    shown = view(hosts: [pc_row(session: host_session)])
    assert_includes owners(scan([shown])), 'ops:key:via'
    assert_empty scan([grant_answer, shown])
    assert_includes owners(scan([credential_answer, shown])), 'ops:key:via', 'a credential grant is no session'
    in_check = row({ 'success' => true, 'hostId' => 'sam_pc', 'service' => 'web', 'findings' => [], 'session' => host_session }, path: CHECK, method: 'POST')
    assert_includes owners(scan([grant_answer, in_check])), 'ops:key:via'
    in_confirm = row({ 'success' => true, 'finding' => { 'via' => 'technique' } }, path: CONFIRM, method: 'POST')
    assert_includes owners(scan([grant_answer, in_confirm])), 'ops:key:via'
  end

  test 'an access key is sent only as admin, and only after an admin technique session was granted' do
    admin = view(hosts: [pc_row(session: host_session('access' => 'admin'))])
    assert_includes owners(scan([grant_answer, admin])), 'ops:key:access', 'no admin grant yet'
    assert_empty scan([grant_answer(access: 'admin'), admin])
    user = view(hosts: [pc_row(session: host_session('access' => 'user'))])
    assert_includes owners(scan([grant_answer(access: 'admin'), user])), 'ops:key:access', 'user is never sent'
    assert_includes owners(scan([grant_answer(access: 'user')])), 'ops:key:access'
    authored = row({ 'objects' => [{ 'id' => 'desk', 'access' => { 'roles' => ['it'] } }, { 'id' => 'desk2', 'access' => %w[sam] }] }, path: ROOM)
    assert_empty scan([authored]), 'an authored access list or map is another thing'
  end

  test 'openHere is sent only in the view of the foothold a technique session came through' do
    open_row = pc_row(session: host_session('openHere' => true), blocked: true)
    own = view(hosts: [open_row])
    other = view(hosts: [open_row], foothold: S::SECOND_JACK)
    assert_includes owners(scan([own])), 'ops:key:openHere', 'before any grant'
    assert_empty scan([grant_answer, own])
    assert_includes owners(scan([grant_answer, other])), 'ops:key:openHere'
    both = row({ 'footholds' => [own['body']['footholds'].first, { 'id' => S::SECOND_JACK, 'hosts' => [pc_row(session: host_session, blocked: true)] }] })
    found = scan([grant_answer, both])
    assert_equal ['ops:host_row'], owners(found), 'a blocked host lists a session only in the view of the foothold it came through'
    elsewhere = row({ 'host' => { 'session' => { 'openHere' => true } } }, path: BOOT)
    assert_includes owners(scan([grant_answer, elsewhere])), 'ops:key:openHere'
    open_allowed = view(hosts: [pc_row(session: host_session)], foothold: S::SECOND_JACK)
    assert_empty scan([grant_answer, open_allowed]), 'a host that allows remote sign-in lists the session in any view'
  end

  test 'a granted credential id or label is a leak in a keyring answer before the credential grant, and clear after it' do
    keyring = row({ 'rev' => 'r1', 'entries' => [{ 'id' => 'print_admin', 'kind' => 'saved_connection', 'label' => 'Print admin' }], 'captures' => {} }, path: KEYRING)
    assert_includes owners(scan([keyring])), 'ops:grant:print_srv.queue.spool_default'
    assert_empty scan([credential_answer, keyring])
    assert_includes owners(scan([grant_answer, keyring])), 'ops:grant:print_srv.queue.spool_default', 'a session grant yields no credential'
    assert_empty scan([row({ 'rev' => 'r0', 'entries' => [], 'captures' => {} }, path: KEYRING)])
  end

  test 'a finding row names no technique, and its needs rows have only kind, label and met' do
    base = { 'id' => S::FACTORY, 'alias' => 'f1', 'hostId' => 'sam_pc', 'service' => 'web', 'class' => 'default_creds', 'severity' => 'high',
             'summary' => 'x', 'status' => 'unconfirmed' }
    steps = ['check:sam_pc.web']
    findings = ->(rows_) { scan([row({ 'success' => true, 'hostId' => 'sam_pc', 'service' => 'web', 'findings' => rows_ }, path: CHECK, method: 'POST')], ops_steps: steps) }
    assert_empty findings.call([base])
    assert_includes owners(findings.call([base.merge('technique' => 'factory_accounts')])), "ops:finding:#{S::FACTORY}"
    assert_includes owners(findings.call([base.merge('summary' => 'build_flaw')])), "ops:finding:#{S::FACTORY}"
    assert_includes owners(findings.call([base.merge('worksOn' => {})])), "ops:finding:#{S::FACTORY}"
    confirmed = base.merge('status' => 'confirmed')
    confirm_steps = steps + ["confirm:#{S::FACTORY}"]
    good = row({ 'success' => true, 'finding' => confirmed.merge('needs' => [{ 'kind' => 'session', 'label' => 'Sam desk', 'met' => false }]) },
               path: CONFIRM, method: 'POST')
    assert_empty scan([good], ops_steps: confirm_steps)
    [{ 'kind' => 'session', 'label' => 'Sam desk', 'met' => false, 'session' => 'admin' },
     { 'kind' => 'level', 'label' => 'Sam desk', 'met' => false },
     { 'kind' => 'session', 'label' => 'Sam desk', 'met' => false, 'technique' => 'x' }].each do |need|
      bad = row({ 'success' => true, 'finding' => confirmed.merge('needs' => [need]) }, path: CONFIRM, method: 'POST')
      assert_includes owners(scan([bad], ops_steps: confirm_steps)), "ops:finding:#{S::FACTORY}", need.inspect
    end
    grants = row({ 'success' => true, 'finding' => confirmed.merge('needs' => [], 'grants' => {}) }, path: CONFIRM, method: 'POST')
    assert_includes owners(scan([grants], ops_steps: confirm_steps)), "ops:finding:#{S::FACTORY}"
  end

  test 'a credential label or an item name shown elsewhere first is no false confirm leak (S2 R2 N5)' do
    scenario = data
    label = scenario['credentials']['lena_login']['label']
    keyring = row({ 'rev' => 'r1', 'entries' => [{ 'id' => 'lena_login', 'kind' => 'password', 'label' => label }], 'captures' => {} }, path: KEYRING)
    tray = row({ 'success' => true, 'item' => { 'id' => 'panel_sheet', 'name' => S::MANUAL_NAME } }, path: INV, method: 'POST')
    assert_empty scan([keyring, tray], scenario: scenario)
    unconfirmed = { 'id' => S::FACTORY, 'alias' => 'f1', 'hostId' => 'sam_pc', 'service' => 'web', 'class' => 'default_creds', 'severity' => 'high',
                    'summary' => 'x', 'status' => 'unconfirmed' }
    early = row({ 'success' => true, 'hostId' => 'sam_pc', 'service' => 'web', 'findings' => [unconfirmed.merge('needs' => [{ 'kind' => 'credential', 'label' => label, 'met' => true }])] },
                path: CHECK, method: 'POST')
    assert_includes owners(scan([early], ops_steps: ['check:sam_pc.web'], scenario: scenario)), "ops:finding:#{S::FACTORY}", 'the needs key before the confirm is the structural leak'
  end

  # ---- S3 R2 N-13-1, N-13-2: each step is earned for the one thing granted ----------------------------

  LAB_OPEN = S::LAB_OPEN
  SV_FINDING = S::PIVOT_FINDING

  def keyring_with(*entries)
    row({ 'rev' => 'r1', 'entries' => entries.map { |id, label| { 'id' => id, 'kind' => 'saved_connection', 'label' => label } }, 'captures' => {} }, path: KEYRING)
  end

  def two_credentials
    scan_data = data
    assert scan_data['credentials'].key?('print_admin') && scan_data['credentials'].key?('lab_admin')
    scan_data
  end

  test 'N-13-1: a grant of one credential releases that finding only, the other credential id and label stay a leak' do
    spool = keyring_with(%w[print_admin Print\ admin])
    lab = keyring_with(['lab_admin', 'Lab admin'])
    first = scan([credential_answer(finding: S::SPOOL), spool, lab], scenario: two_credentials)
    assert_equal ["ops:grant:#{LAB_OPEN}"], owners(first), 'the first grant clears its own id and label, not the second credential'
    assert_equal [3], first.map(&:line).uniq, 'and only on the later line'
    assert_empty scan([credential_answer(finding: S::SPOOL), credential_answer(finding: LAB_OPEN), spool, lab], scenario: two_credentials)
    assert_equal ["ops:grant:#{S::SPOOL}"], owners(scan([credential_answer(finding: LAB_OPEN), spool, lab], scenario: two_credentials))
    assert_equal ["ops:grant:#{S::SPOOL}", "ops:grant:#{LAB_OPEN}"].sort, owners(scan([spool, lab]))
  end

  test 'N-13-1: a repeat answer, a refusal and an unknown finding tag release nothing' do
    spool = keyring_with(%w[print_admin Print\ admin])
    repeat = row({ 'success' => true, 'already' => true, 'grant' => 'credential', 'keyringChanged' => false }, path: TECH, method: 'POST',
                 extra: tech_tag(S::SPOOL, false))
    assert_includes owners(scan([repeat, spool])), "ops:grant:#{S::SPOOL}", 'an untagged repeat names no finding'
    assert_includes owners(scan([credential_answer(finding: 'print_srv.queue.invented'), spool])), "ops:grant:#{S::SPOOL}"
    assert_includes owners(scan([credential_answer(finding: S::FACTORY), spool])), "ops:grant:#{S::SPOOL}", 'a session finding is no credential grant'
    assert_includes owners(scan([refusal('need_unmet'), spool])), "ops:grant:#{S::SPOOL}"
  end

  test 'N-13-1: with no request tag the answer is read: both unconfirmed fails closed, one confirmed earns that finding only' do
    spool = keyring_with(%w[print_admin Print\ admin])
    lab = keyring_with(['lab_admin', 'Lab admin'])
    untagged = credential_answer(tag: false)
    both = scan([untagged, spool, lab])
    assert_equal ["ops:grant:#{LAB_OPEN}", "ops:grant:#{S::SPOOL}"].sort, owners(both), 'two granting findings and no way to tell which: nothing earned'
    one = scan([untagged, spool, lab], ops_steps: ["confirm:#{S::SPOOL}"])
    assert_equal ["ops:grant:#{LAB_OPEN}"], owners(one)
    named = scan([spool, lab], ops_steps: ["granted:credential:#{S::SPOOL}", "granted:credential:#{LAB_OPEN}"])
    assert_empty named, 'the caller can name each step'
    assert_equal ["ops:grant:#{LAB_OPEN}"], owners(scan([spool, lab], ops_steps: ["granted:credential:#{S::SPOOL}"]))
  end

  test 'N-13-2: a session at one host does not clear another host row, its admin level or its openHere' do
    scenario = pivot_scenario
    sv_row = { 'id' => 'sv_fs02', 'kind' => 'pc', 'name' => 'FS02', 'host' => 'FS02', 'remoteSignIn' => false,
               'session' => host_session('username' => 'ishaw', 'access' => 'admin', 'openHere' => true) }
    sam_row = pc_row(session: host_session('access' => 'admin', 'openHere' => true), blocked: true)
    admin_grant = grant_answer(access: 'admin')
    both = view(hosts: [sam_row, sv_row])
    found = scan([admin_grant, both], scenario: scenario)
    assert_equal %w[ops:host_row ops:key:access ops:key:openHere ops:key:via], owners(found)
    assert(found.all? { |f| f.line == 2 })
    sv_grant = row({ 'success' => true, 'grant' => 'session', 'session' => session_hash('footholdId' => S::OFFICE, 'npcId' => 'ian', 'host' => 'FS02',
                                                                                           'access' => 'admin') },
                   path: TECH, method: 'POST', extra: tech_tag(SV_FINDING, true))
    assert_empty scan([admin_grant, sv_grant, both], scenario: scenario), 'each host is clear after its own grant'
    only_user_sv = row({ 'success' => true, 'grant' => 'session', 'session' => session_hash('footholdId' => S::OFFICE, 'npcId' => 'ian', 'host' => 'FS02') },
                       path: TECH, method: 'POST', extra: tech_tag(SV_FINDING, true))
    assert_includes owners(scan([admin_grant, only_user_sv, both], scenario: scenario)), 'ops:key:access', 'a user grant at FS02 gives no admin there'
  end

  test 'N-13-2: openHere and a blocked row are cleared by the foothold the session came through, for that host only' do
    scenario = pivot_scenario
    sam_open = pc_row(session: host_session('openHere' => true), blocked: true)
    through_second = view(hosts: [sam_open], foothold: S::SECOND_JACK)
    assert_includes owners(scan([grant_answer, through_second], scenario: scenario)), 'ops:key:openHere', 'granted through the office foothold'
    second_grant = grant_answer(foothold: S::SECOND_JACK)
    assert_empty scan([grant_answer, second_grant, through_second], scenario: scenario)
    replaced = scan([grant_answer, second_grant, view(hosts: [sam_open])], scenario: scenario)
    assert_includes owners(replaced), 'ops:key:openHere', 'a PC holds one session: the new grant takes the earlier foothold back'
  end

  test 'N-13-2: a session read without a request tag is earned only for the one finding the answer fits' do
    admin = view(hosts: [pc_row(session: host_session('access' => 'admin'))])
    untagged = grant_answer(access: 'admin', tag: false)
    assert_includes owners(scan([untagged, admin])), 'ops:key:access', 'several admin findings fit, none confirmed'
    assert_empty scan([untagged, admin], ops_steps: ["confirm:#{STEP_UP}"])
  end

  test 'N-13-2: a held card entry must name an item the player holds, not another item of the same technique' do
    steps = ['card:factory_accounts']
    other = view(techniques: { 'factory_accounts' => held_entry('card_factory_b') })
    assert_empty scan([other], ops_steps: steps), 'the caller names the technique'
    assert_includes owners(scan([inv_add('card_factory'), other])), 'ops:technique:factory_accounts'
    assert_empty scan([inv_add('card_factory_b'), other])
    assert_empty scan([inv_add('card_factory'), view(techniques: { 'factory_accounts' => held_entry })])
  end

  test 'a whole clean run in the shapes the server sends reports nothing' do
    shown = view(techniques: { 'factory_accounts' => held_entry }, hosts: [pc_row(session: host_session('openHere' => true, 'access' => 'admin'), blocked: true)])
    rows = [view, inv_add('card_factory'), refusal('wrong_class'), grant_answer, grant_answer(access: 'admin'), credential_answer, shown]
    assert_empty scan(rows)
  end

  # ---- post-landing tidy: R3-1, R3-6, R3-7 ---------------------------------------------------------

  def twin_scenario(on_network: true)
    d = data
    if on_network
      lena = d['rooms'].values.flat_map { |r| r['objects'] }.find { |o| o['id'] == 'lena_pc' }
      lena['host'] = 'HB-DESK-01'
      lena['services'] = [S.service('web', 80)]
      lena['services'].first['weaknesses'] = [S.weak('twin', 'default_creds', 'low', 'grants' => S.sam_grant)]
    end
    d
  end

  test 'R3-1: a session re-granted untagged after a sign-out earns nothing when two PCs share its host label' do
    d = twin_scenario
    steps = ["confirm:#{S::FACTORY}", 'confirm:lena_pc.web.twin']
    shown = ->(id) { view(hosts: [pc_row(session: host_session).merge('id' => id, 'host' => 'HB-DESK-01')]) }
    # the first grant is tagged by the recorder (session:sam_pc earned); the second has no tag, as after a sign-out
    found = scan([grant_answer, grant_answer(tag: false), shown.call('lena_pc')], ops_steps: steps, scenario: d)
    assert_includes owners(found), 'ops:key:via', 'the untagged repeat must not credit lena_pc'
    assert(found.any? { |f| f.line == 3 })
    # a label only one PC carries is exact: the same run on the plain fixture credits sam_pc
    assert_empty scan([grant_answer, grant_answer(tag: false), shown.call('sam_pc')], ops_steps: ["confirm:#{S::FACTORY}"])
    # tagged by the recorder, each grant is exact even with the shared label
    twin_grant = grant_answer(finding: 'lena_pc.web.twin')
    assert_empty scan([twin_grant, shown.call('lena_pc')], ops_steps: steps, scenario: d).select { |f| f.line == 2 }
  end

  test 'R3-1: a sign-in PC on no network that shares a label with a networked PC makes the label ambiguous' do
    d = data
    room = d['rooms'].values.first
    room.delete('network')
    room['objects'] << { 'id' => 'offgrid_pc', 'type' => 'pc', 'name' => 'Offgrid', 'lockType' => 'login', 'host' => 'HB-DESK-01', 'takeable' => false }
    assert_nil BreakEscape::NetworkModel.network_of(room['objects'].last, room), 'the PC is on no network'
    labels = AccessLeakScanner.new(d).instance_variable_get(:@ops_host_by_label)
    refute labels.key?('HB-DESK-01'), 'the networked PC and the off-network PC share the label'
    assert_equal 'sam_pc', AccessLeakScanner.new(data).instance_variable_get(:@ops_host_by_label)['HB-DESK-01']
  end

  test 'R3-6 a: a grant answer whose session carries a key outside the session set is an answer-shape finding' do
    %w[foothold fromHost findingId].each do |key|
      bad = grant_answer
      bad['body']['session'][key] = 'x'
      assert_includes owners(scan([bad])), 'ops:technique:answer', key
    end
    assert_empty scan([grant_answer])
  end

  test 'R3-6 b: keyringChanged on a session grant, and endedPcIds or a session on a credential grant, are answer-shape findings' do
    session = grant_answer
    session['body']['keyringChanged'] = true
    assert_includes owners(scan([session])), 'ops:technique:answer'
    credential = credential_answer
    credential['body']['endedPcIds'] = ['sam_pc']
    assert_includes owners(scan([credential])), 'ops:technique:answer'
    with_session = credential_answer
    with_session['body']['session'] = session_hash
    assert_includes owners(scan([with_session])), 'ops:technique:answer'
    assert_empty scan([credential_answer])
  end

  test 'R3-6 d: a later user-level session at a PC takes its admin step back' do
    admin_view = view(hosts: [pc_row(session: host_session('access' => 'admin'))])
    assert_empty scan([grant_answer(access: 'admin'), admin_view])
    user_after = scan([grant_answer(access: 'admin'), grant_answer, admin_view])
    assert_includes owners(user_after), 'ops:key:access'
    assert(user_after.all? { |f| f.line == 3 })
  end

  test 'R3-7 a: a services key in a room or bootstrap answer, and a top-level hosts key, are findings by name' do
    assert_empty scan([row({ 'rooms' => {} }, path: BOOT), row({ 'objects' => [{ 'id' => 'sam_pc' }] }, path: ROOM)])
    in_room = row({ 'objects' => [{ 'id' => 'plain_obj', 'services' => [] }] }, path: ROOM)
    assert_equal ['ops:key:services'], owners(scan([in_room]))
    in_boot = row({ 'startRoom' => 'lobby', 'rooms' => { 'lobby' => { 'objects' => [{ 'id' => 'x', 'services' => [{ 'name' => 'web' }] }] } } }, path: BOOT)
    assert_equal ['ops:key:services'], owners(scan([in_boot]))
    assert_equal ['ops:key:hosts'], owners(scan([row({ 'startRoom' => 'lobby', 'hosts' => {} }, path: BOOT)]))
    assert_equal ['ops:key:hosts'], owners(scan([row({ 'hosts' => [] }, path: ROOM)]))
  end

  def block(id, rows: [], extra: {})
    { 'id' => id, 'name' => 'Net', 'via' => nil, 'hosts' => rows, 'route' => 'up', 'swept' => false }.merge(extra)
  end

  def block_view(net_block, foothold: S::OFFICE)
    row({ 'footholds' => [{ 'id' => foothold, 'hosts' => [], 'networks' => [net_block] }] })
  end

  test 'R3-7 b: an unswept discovery block may list only held PCs, carry no ops key, and no services or hosts key in a row' do
    net = data['networks'].keys.find { |id| BreakEscape::NetworkModel.discovery?(data, id) }
    assert net, 'the fixture has a discovery network'
    recs = BreakEscape::NetworkModel.hosts_on(net, data)
    other = recs.find { |r| r[:kind] == 'device' }[:id]
    pc = recs.find { |r| r[:kind] != 'device' }[:id]
    clean = block_view(block(net))
    assert_empty scan([clean])
    assert_equal ["ops:network:#{net}"], owners(scan([block_view(block(net, extra: { 'ops' => true }))]))
    device_row = { 'id' => other, 'kind' => 'device', 'sprite' => 'x' }
    assert_equal ["ops:network:#{net}"], owners(scan([block_view(block(net, rows: [device_row]))]))
    held = { 'id' => pc, 'kind' => 'pc', 'name' => 'Held PC', 'session' => { 'username' => 'sam', 'displayName' => 'Sam' } }
    assert_empty scan([block_view(block(net, rows: [held]))])
    assert_includes owners(scan([block_view(block(net, rows: [held.merge('services' => [])]))])), "ops:network:#{net}"
    assert_equal ["ops:network:#{net}"], owners(scan([block_view(block(net, rows: [held.merge('hosts' => [])]))]))
    swept = { 'success' => true, 'network' => block(net, rows: [device_row], extra: { 'swept' => true, 'ops' => true }) }
    assert_empty scan([row(swept, path: "#{BASE}/network/scan", method: 'POST')]), 'once swept, rows and ops are the sweep answer'
  end
end
