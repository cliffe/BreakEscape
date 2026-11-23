require 'test_helper'
require_relative '../support/network_ops_scenario'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops core S2 (OPS_CORE_PLAN.md 11.4, N14): the check, confirm and never tags of the leak scanner's
# collect_ops_secrets, and the structural services rule (S1 R3-1). Rows and answers have the shapes
# network_ops.rb really sends (ops_finding_row, check_service!, confirm_finding!).
class AccessLeakScannerOpsFindingsTest < ActiveSupport::TestCase
  S = NetworkOpsScenario
  CATALOG = File.expand_path('../fixtures/ops_findings_catalog', __dir__)
  VIEW = '/break_escape/games/1/network'.freeze
  CHECK = '/break_escape/games/1/network/check'.freeze
  CONFIRM = '/break_escape/games/1/network/confirm'.freeze
  SCAN = '/break_escape/games/1/network/scan'.freeze
  ROOM = '/break_escape/games/1/room/lobby'.freeze
  BOOT = '/break_escape/games/1/scenario'.freeze

  # The findings scenario with two catalog links: the admin weakness links fx_login, the old-banner decoy
  # links fx_banner. fx_panel and fx_other are in the catalog and nothing links them.
  def data
    d = S.findings_scenario
    web = d['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['services'].find { |svc| svc['name'] == 'web' }
    web['weaknesses'].find { |w| w['id'] == 'factory_login' }['realism'] = 'fx_login'
    web['decoys'].first['realism'] = 'fx_banner'
    d
  end

  def row(body, path: VIEW, method: 'GET')
    { 'method' => method, 'path' => path, 'status' => 200, 'body' => body }
  end

  def scan(rows, ops_steps: nil, scenario: data)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    AccessLeakScanner.new(scenario, catalog_folder: CATALOG).scan(lines, ops_steps: ops_steps)
  end

  def summary(findings)
    findings.map { |f| [f.line, f.rule, f.owner] }
  end

  def owners(findings)
    findings.map(&:owner).uniq.sort
  end

  # An unconfirmed finding row, as ops_finding_row builds it.
  def unconfirmed(id, klass, severity, summary, number, extra = {})
    { 'id' => "#{S::WEB}.#{id}", 'alias' => "f#{number}", 'hostId' => 'sam_pc', 'service' => 'web', 'class' => klass,
      'severity' => severity, 'summary' => summary, 'status' => 'unconfirmed' }.merge(extra)
  end

  def factory_row(extra = {})
    unconfirmed('factory_login', 'default_creds', 'high', S::FACTORY_SUMMARY, 1, extra)
  end

  def check_answer(findings)
    row({ 'success' => true, 'hostId' => 'sam_pc', 'service' => 'web', 'findings' => findings }, path: CHECK, method: 'POST')
  end

  def confirm_answer(finding)
    row({ 'success' => true, 'finding' => finding }, path: CONFIRM, method: 'POST')
  end

  def view_with(findings)
    row({ 'footholds' => [{ 'hosts' => [{ 'id' => 'sam_pc', 'kind' => 'pc', 'findings' => findings }] }] })
  end

  def scanned(host_id)
    row({ 'success' => true, 'host' => { 'id' => host_id, 'kind' => 'pc', 'scanned' => true } }, path: SCAN, method: 'POST')
  end

  def registered
    AccessLeakScanner.new(data, catalog_folder: CATALOG).instance_variable_get(:@ops_strings)
  end

  test 'the collector tags a finding check, a decoy reason and need labels confirm, and link ids and globals never' do
    strings = registered
    assert_equal :check, strings[S::FACTORY_SUMMARY].first[:tag]
    assert_equal 'sam_pc.web', strings[S::FACTORY_SUMMARY].first[:step]
    assert_equal :check, strings['FX-TITLE-LOGIN placeholder login weakness'].first[:tag]
    assert_equal :check, strings['example/fx/login'].first[:tag]
    assert_equal :check, strings['FX-OUT-BANNER-1 invented line'].first[:tag]
    assert_equal [:confirm, S::OLD_BANNER], strings[S::BANNER_FALSE].first.values_at(:tag, :step)
    assert_equal :confirm, strings[S::DOOR_LABEL].first[:tag]
    refute strings.key?(S::LENA_LABEL), 'a credential label is shown in the keyring first, so it is not a confirm string (S2 R2 N5)'
    refute strings.key?(S::MANUAL_NAME), 'an item name is shown on the item first, so it is not a confirm string (S2 R2 N5)'
    %w[fx_login fx_banner example/fx/panel example/fx/other FX-NOTE-LOGIN\ author\ note,\ never\ served.].each do |text|
      assert_equal [:never], strings[text].map { |e| e[:tag] }.uniq, "#{text} is never"
    end
    assert_equal [:never], strings[S::DOOR_GLOBAL].map { |e| e[:tag] }.uniq
    assert_equal [:never], strings[S::PATCHED_GLOBAL].map { |e| e[:tag] }.uniq
    refute strings.key?('example/fx/login') && strings['example/fx/login'].any? { |e| e[:tag] == :never }, 'a linked module is a check string'
  end

  test 'a summary in a view before its service is checked is reported; the check answer earns it' do
    leak = view_with([factory_row])
    assert_includes owners(scan([leak])), "ops:finding:#{S::FACTORY}"
    assert_empty scan([check_answer([factory_row]), leak])
    assert_includes owners(scan([leak, check_answer([factory_row])])), "ops:finding:#{S::FACTORY}"
    assert_empty scan([leak], ops_steps: ['check:sam_pc.web'])
  end

  test 'a check on another service earns nothing, and a failed or refused check earns nothing' do
    leak = view_with([factory_row])
    other = row({ 'success' => true, 'hostId' => 'print_srv', 'service' => 'queue', 'findings' => [] }, path: CHECK, method: 'POST')
    assert_includes owners(scan([other, leak])), "ops:finding:#{S::FACTORY}"
    refused = row({ 'success' => false, 'reason' => 'not_responding', 'hostId' => 'sam_pc', 'service' => 'web' }, path: CHECK, method: 'POST')
    assert_includes owners(scan([refused, leak])), "ops:finding:#{S::FACTORY}"
  end

  test 'two GET /network answers that list a finding never earn its check: the finding is a leak in both' do
    # A /network answer earns no check, whatever it carries; only a successful POST /network/check does.
    assert_includes owners(scan([view_with([factory_row]), view_with([factory_row])])), "ops:finding:#{S::FACTORY}"
  end

  test 'class and severity count only as the value of their own key' do
    assert_includes owners(scan([view_with([factory_row])])), "ops:finding:#{S::FACTORY}"
    quiet = row({ 'note' => 'high', 'level' => 'default_creds' })
    assert_empty scan([quiet])
    assert_includes owners(scan([row({ 'class' => 'weak_auth' })])), "ops:finding:#{S::SIDE_ENTRY}"
  end

  test 'a linked entry strings are check strings and the link id and an unlinked module are never' do
    cli = { 'title' => 'FX-TITLE-LOGIN placeholder login weakness', 'module' => 'example/fx/login', 'advisories' => ['FX-ADV-0001'] }
    assert_includes owners(scan([view_with([factory_row('cli' => cli)])])), "ops:finding:#{S::FACTORY}"
    assert_empty scan([check_answer([factory_row('cli' => cli)])])
    # never: a link id, an unlinked entry's module, at any stage and after the check
    after = check_answer([factory_row])
    assert_includes owners(scan([after, row({ 'realism' => 'fx_login' })])), "ops:finding:#{S::FACTORY}"
    assert_includes owners(scan([after, view_with([factory_row('cli' => { 'module' => 'example/fx/other' })])])), 'ops:catalog:fx_other'
    assert_includes owners(scan([after, row({ 'text' => 'example/fx/panel' })])), 'ops:catalog:fx_panel'
  end

  test 'a decoy reason is a leak before its confirm, and not at its own confirm answer' do
    decoy = unconfirmed('old_banner', 'unpatched', 'medium', S::BANNER_SUMMARY, 2)
    shown = decoy.merge('status' => 'false', 'falseBecause' => S::BANNER_FALSE)
    assert_includes owners(scan([check_answer([decoy]), view_with([shown])])), "ops:finding:#{S::OLD_BANNER}"
    assert_empty scan([check_answer([decoy]), confirm_answer(shown), view_with([shown])])
    other = confirm_answer(factory_row('status' => 'confirmed', 'needs' => []))
    assert_includes owners(scan([check_answer([decoy]), other, view_with([shown])])), "ops:finding:#{S::OLD_BANNER}"
  end

  test 'a confirmed finding need labels are a leak before the confirm, and the check answer cannot carry them' do
    needs = [{ 'kind' => 'global', 'label' => S::DOOR_LABEL, 'met' => false }]
    side = unconfirmed('side_entry', 'weak_auth', 'medium', 'The side entry relies on a door being left open.', 3)
    confirmed = side.merge('status' => 'confirmed', 'needs' => needs)
    assert_includes owners(scan([check_answer([side]), check_answer([confirmed])])), "ops:finding:#{S::SIDE_ENTRY}"
    assert_empty scan([check_answer([side]), confirm_answer(confirmed), view_with([confirmed])])
  end

  test 'a global name is never sent as a value; the bootstrap globalVariables key is not judged' do
    boot = row({ 'globalVariables' => { S::DOOR_GLOBAL => false } }, path: BOOT)
    assert_empty scan([boot])
    assert_includes owners(scan([view_with([factory_row('fixed' => S::PATCHED_GLOBAL)])], ops_steps: ['check:sam_pc.web'])), "ops:finding:#{S::FACTORY}"
    assert_includes owners(scan([row({ 'text' => S::DOOR_GLOBAL }, path: ROOM)])), "ops:finding:#{S::SIDE_ENTRY}"
  end

  test 'a global name as a JSON key outside the top-level globalVariables is a leak, at any depth, and is not printed' do
    side = { 'id' => S::SIDE_ENTRY, 'extra' => { S::DOOR_GLOBAL => true } }
    found = scan([row({ 'footholds' => [{ 'hosts' => [side] }] })])
    assert_equal ["ops:finding:#{S::SIDE_ENTRY}"], owners(found)
    refute(found.any? { |f| f.json_path.to_s.include?(S::DOOR_GLOBAL) }, 'the report shows the redacted path')
    fixed_key = scan([row({ 'a' => [{ S::PATCHED_GLOBAL => false }] }, path: ROOM)])
    assert_includes owners(fixed_key), "ops:finding:#{S::FACTORY}"
    mapped = scan([row({ 'note' => { 'globalVariables' => { S::DOOR_GLOBAL => false } } }, path: ROOM)])
    assert_includes owners(mapped), "ops:finding:#{S::SIDE_ENTRY}", 'only the top-level globalVariables map is the declared-globals place (N6)'
    nested = scan([row({ 'globalVariables' => { 'deeper' => { S::DOOR_GLOBAL => true } } }, path: BOOT)])
    assert_includes owners(nested), "ops:finding:#{S::SIDE_ENTRY}", 'only the direct children of globalVariables are exempt'
  end

  test 'the structural rule: a services key or scanned true on a known host row is a leak before its scan, whatever the strings' do
    bare = { 'id' => 'sam_pc', 'kind' => 'pc', 'services' => [{ 'name' => 'x1', 'port' => 22 }] }
    view = row({ 'footholds' => [{ 'hosts' => [bare] }] })
    assert_equal [[1, 'ops_string', 'ops:service:sam_pc']], summary(scan([view]))
    assert_equal [[1, 'ops_string', 'ops:service:sam_pc']], summary(scan([row({ 'footholds' => [{ 'hosts' => [{ 'id' => 'sam_pc', 'scanned' => true }] }] })]))
    assert_empty scan([scanned('sam_pc'), view])
    assert_equal [[2, 'ops_string', 'ops:service:sam_pc']], summary(scan([scanned('lab_box'), view]))
    assert_empty scan([row({ 'footholds' => [{ 'hosts' => [{ 'id' => 'not_a_host', 'services' => [] }] }] })])
  end

  test 'a refused scan does not earn the structural rule' do
    refused = row({ 'success' => false, 'reason' => 'not_responding' }, path: SCAN, method: 'POST')
    view = row({ 'hosts' => [{ 'id' => 'sam_pc', 'services' => [{ 'name' => 'x1', 'port' => 22 }] }] })
    assert_equal [[2, 'ops_string', 'ops:service:sam_pc']], summary(scan([refused, view]))
  end
end
