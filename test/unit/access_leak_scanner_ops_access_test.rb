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
  FACTORY_NAME = 'Factory accounts'.freeze
  FACTORY_SUMMARY = 'Devices often ship with a published account.'.freeze

  def data
    S.techniques_scenario
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
      'footholdId' => S::OFFICE, 'host' => 'Sam desk' }.merge(extra)
  end

  def grant_answer(access: nil, foothold: S::OFFICE)
    extra = access ? { 'access' => access } : {}
    row({ 'success' => true, 'grant' => 'session', 'session' => session_hash(extra.merge('footholdId' => foothold)) }, path: TECH, method: 'POST')
  end

  def credential_answer
    row({ 'success' => true, 'grant' => 'credential', 'keyringChanged' => true }, path: TECH, method: 'POST')
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
    { 'username' => 'sam', 'displayName' => 'Sam', 'via' => 'technique', 'remote' => true }.merge(extra)
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

  test 'a whole clean run in the shapes the server sends reports nothing' do
    shown = view(techniques: { 'factory_accounts' => held_entry }, hosts: [pc_row(session: host_session('openHere' => true, 'access' => 'admin'), blocked: true)])
    rows = [view, inv_add('card_factory'), refusal('wrong_class'), grant_answer, grant_answer(access: 'admin'), credential_answer, shown]
    assert_empty scan(rows)
  end
end
