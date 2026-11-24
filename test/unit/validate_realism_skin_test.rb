# frozen_string_literal: true

require 'test_helper'
require 'json'
require 'tmpdir'
require 'fileutils'
require 'open3'
require_relative '../../scripts/validate_realism_skin'
require_relative '../../lib/break_escape/scenario_binding'

# The realism skin validator (S6 unit 22): one passing and one failing scenario fragment per error and
# per warning, against the invented catalogs under test/fixtures/realism_catalog/skin/. Every advisory
# id and nickname written here is made up (a year far in the future, never an assigned id).
class ValidateRealismSkinTest < ActiveSupport::TestCase
  ROOT = File.expand_path('../..', __dir__)
  CATALOGS = File.join(ROOT, 'test/fixtures/realism_catalog/skin')
  VALID = File.join(CATALOGS, 'valid')
  BROKEN = File.join(CATALOGS, 'broken')
  PASSWORD = 'ember-lantern-2290'

  def base
    {
      'scenario_brief' => 'Test.',
      'networks' => {
        'office' => { 'name' => 'Office network', 'discovery' => 'scan',
                      'cli' => { 'range' => '10.20.30.0/24',
                                 'hosts' => { 'filesrv' => { 'address' => '10.20.30.5' },
                                              'printsrv' => { 'address' => '10.20.30.6' } } } },
        'lab' => { 'name' => 'Lab network', 'discovery' => 'scan',
                   'cli' => { 'range' => '10.20.40.0/24', 'hosts' => { 'labbox' => { 'address' => '10.20.40.7' } } } }
      },
      'hosts' => {
        'filesrv' => { 'name' => 'File server', 'network' => 'office', 'services' => [
          { 'name' => 'storage', 'port' => 4455, 'product' => 'Quillbox', 'version' => '2.1',
            'cli' => { 'protocol' => 'tcp', 'service' => 'quillbox', 'banner' => 'Quillbox 2.1 ready' },
            'weaknesses' => [
              { 'id' => 'w_one', 'class' => 'unpatched', 'severity' => 'high', 'realism' => 'skin_weak_one' },
              { 'id' => 'w_two', 'class' => 'unpatched', 'severity' => 'medium', 'realism' => 'skin_weak_two' }
            ],
            'decoys' => [
              { 'id' => 'd_one', 'class' => 'misconfig', 'severity' => 'low', 'realism' => 'skin_look_one',
                'falseBecause' => 'That entry is only a leftover label.' }
            ] }
        ] },
        'printsrv' => { 'name' => 'Print server', 'network' => 'office', 'services' => [
          { 'name' => 'spool', 'port' => 6600, 'product' => 'Marlowe', 'version' => '1.4',
            'cli' => { 'service' => 'marlowe', 'banner' => 'Marlowe 1.4 relay' },
            'weaknesses' => [{ 'id' => 'w_three', 'class' => 'misconfig', 'severity' => 'low', 'realism' => 'skin_weak_three' }] }
        ] },
        'labbox' => { 'name' => 'Lab box', 'network' => 'lab' }
      }
    }
  end

  def mut
    s = JSON.parse(JSON.generate(base))
    yield s
    s
  end

  def svc(s, host = 'filesrv', idx = 0)
    s['hosts'][host]['services'][idx]
  end

  def run_check(s, **opts)
    opts[:catalog_dir] ||= VALID
    opts[:index_path] = nil unless opts.key?(:index_path)
    check_realism_skin(s, **opts)
  end

  def errors(s, **opts)
    run_check(s, **opts).grep(/ERROR/)
  end

  def warnings(s, **opts)
    run_check(s, **opts).grep(/WARNING/)
  end

  def assert_error(s, fragment, **opts)
    found = errors(s, **opts)
    assert(found.any? { |e| e.include?(fragment) }, "expected an error with #{fragment.inspect}, got:\n#{found.join("\n")}")
  end

  def refute_errors(s, **opts)
    assert_empty errors(s, **opts), errors(s, **opts).join("\n")
  end

  def with_nicknames(words)
    Dir.mktmpdir do |dir|
      path = File.join(dir, 'nicknames.txt')
      File.write(path, "#{words.join("\n")}\n")
      yield path
    end
  end

  def banner!(s, text)
    svc(s)['cli']['banner'] = text
  end

  # An unlinked variant of the base: no links, no banners differ.
  def unlinked
    mut do |s|
      s['hosts'].each_value do |h|
        Array(h['services']).each do |sv|
          (sv['weaknesses'].to_a + sv['decoys'].to_a).each { |f| f.delete('realism') }
        end
      end
    end
  end

  test 'the base scenario passes with no error and no warning' do
    assert_empty run_check(base), run_check(base).join("\n")
  end

  test 'a scenario with no networks, hosts or cli is left alone' do
    assert_empty run_check({ 'scenario_brief' => 'Nothing here.' })
    assert_empty run_check({ 'rooms' => {} })
  end

  # ---- ranges and addresses ----

  test 'a range outside the private ranges is an error and a private one passes' do
    s = mut { |m| m['networks']['office']['cli']['range'] = '203.0.113.0/24' }
    assert_error s, 'outside the three private ranges'
    s = mut { |m| m['networks']['office']['cli']['range'] = '172.32.0.0/24' }
    assert_error s, 'outside the three private ranges'
    %w[172.16.0.0/24 172.31.255.0/24 192.168.7.0/24 10.0.0.0/16].each do |range|
      s = mut { |m| m['networks']['lab']['cli']['range'] = range; m['networks']['lab']['cli']['hosts'] = {} }
      refute_errors s
    end
  end

  test 'a prefix outside /16 to /30 is an error and the ends pass' do
    %w[10.0.0.0/8 10.0.0.0/15 10.20.30.0/31].each do |range|
      s = mut { |m| m['networks']['lab']['cli']['range'] = range; m['networks']['lab']['cli']['hosts'] = {} }
      assert_error s, 'a prefix outside /16 to /30'
    end
    %w[10.30.0.0/16 10.20.40.4/30].each do |range|
      s = mut { |m| m['networks']['lab']['cli']['range'] = range; m['networks']['lab']['cli']['hosts'] = {} }
      refute_errors s
    end
  end

  test 'host bits set in the range is an error' do
    s = mut { |m| m['networks']['lab']['cli']['range'] = '10.20.40.9/24'; m['networks']['lab']['cli']['hosts'] = {} }
    assert_error s, 'host bits set'
  end

  test 'overlapping ranges are an error and adjacent ones pass' do
    s = mut do |m|
      m['networks']['lab']['cli']['range'] = '10.20.30.128/25'
      m['networks']['lab']['cli']['hosts'] = {}
    end
    assert_error s, "networks 'lab' and 'office' have overlapping ranges"
    s = mut do |m|
      m['networks']['lab']['cli']['range'] = '10.20.31.0/24'
      m['networks']['lab']['cli']['hosts'] = {}
    end
    refute_errors s
  end

  test 'an address needs a range, must sit inside it and not be its first or last' do
    s = mut { |m| m['networks']['lab']['cli'].delete('range'); m['networks']['office']['cli'].delete('range') }
    assert_error s, 'has an address but the network has no range'
    s = mut { |m| m['networks']['lab']['cli']['hosts']['labbox']['address'] = '10.20.41.7' }
    assert_error s, 'is outside the network\'s range'
    s = mut { |m| m['networks']['lab']['cli']['hosts']['labbox']['address'] = '10.20.40.0' }
    assert_error s, 'network or broadcast address'
    s = mut { |m| m['networks']['lab']['cli']['hosts']['labbox']['address'] = '10.20.40.255' }
    assert_error s, 'network or broadcast address'
    s = mut { |m| m['networks']['lab']['cli']['hosts']['labbox']['address'] = '10.20.40.1' }
    refute_errors s
  end

  test 'one address on two networks is an error' do
    s = mut do |m|
      m['networks']['lab']['cli']['range'] = '10.20.30.0/23'
      m['networks']['office']['cli']['range'] = '10.20.30.0/24'
      m['networks']['lab']['cli']['hosts']['labbox']['address'] = '10.20.30.5'
    end
    found = errors(s)
    assert(found.any? { |e| e.include?('is also used by host') }, found.join("\n"))
  end

  test 'a cli.hosts key must be a host on that network and at most 64 characters' do
    s = mut { |m| m['networks']['lab']['cli']['hosts']['filesrv'] = { 'address' => '10.20.40.9' } }
    assert_error s, "key 'filesrv' is not a host on network 'lab'"
    s = mut { |m| m['networks']['lab']['cli']['hosts']['h' * 65] = { 'address' => '10.20.40.9' } }
    assert_error s, 'is longer than 64 characters'
    refute(errors(s).any? { |e| e.include?('h' * 65) }, 'the long key is not echoed in full')
  end

  test 'range all or none across the discovery networks' do
    s = mut { |m| m['networks']['lab']['cli'].delete('range'); m['networks']['lab']['cli']['hosts'] = {} }
    assert_error s, "no range on: 'lab'"
    s = mut do |m|
      m['networks'].each_value { |n| n.delete('cli') }
    end
    refute_errors s
  end

  test 'two services of one host on one port are an error whatever the protocol' do
    s = mut do |m|
      m['hosts']['filesrv']['services'] << { 'name' => 'storage_udp', 'port' => 4455, 'product' => 'Quillbox',
                                             'version' => '2.1', 'cli' => { 'protocol' => 'udp' } }
    end
    assert_error s, 'on the same port 4455'
    s['hosts']['filesrv']['services'].last['port'] = 4456
    refute(errors(s).any? { |e| e.include?('same port') })
  end

  test 'a network id equal to a host, room object or resource id is an error' do
    s = mut { |m| m['networks']['filesrv'] = { 'name' => 'Clash' } }
    assert_error s, "network 'filesrv' has the same id as a host"
    s = mut do |m|
      m['rooms'] = { 'r' => { 'objects' => [{ 'id' => 'office', 'type' => 'pc' }] } }
    end
    assert_error s, "network 'office' has the same id as a room object"
    s = mut { |m| m['resources'] = { 'lab' => { 'kind' => 'printer', 'name' => 'P', 'network' => 'lab' } } }
    assert_error s, "network 'lab' has the same id as a resource"
  end

  # ---- links ----

  test 'a link naming no entry, and one id linked twice, are errors' do
    s = mut { |m| svc(m)['weaknesses'][0]['realism'] = 'skin_nothing_here' }
    assert_error s, "finding 'filesrv.storage.w_one' links realism id 'skin_nothing_here', which names no catalog entry"
    s = mut { |m| svc(m)['weaknesses'][1]['realism'] = 'skin_weak_one' }
    assert_error s, "realism id 'skin_weak_one' is linked by more than one finding"
  end

  test 'a catalog that does not validate gives one error and no link is checked' do
    s = mut { |m| svc(m)['weaknesses'][0]['realism'] = 'skin_nothing_here' }
    found = errors(s, catalog_dir: BROKEN)
    assert_equal 1, found.length, found.join("\n")
    assert_includes found.first, 'the realism catalog does not validate (file: skin_entries.json); catalog task: fix the catalog'
    refute_includes found.first, 'skin_nothing_here'
  end

  test 'a scenario with no link reads nothing from a catalog that does not validate' do
    refute_errors unlinked, catalog_dir: BROKEN
    refute_errors unlinked, catalog_dir: File.join(CATALOGS, 'does_not_exist')
  end

  test 'links all or none' do
    s = mut { |m| svc(m)['weaknesses'][1].delete('realism') }
    assert_error s, "not linked: 'filesrv.storage.w_two'"
  end

  test 'linked entries all hold advisories or none, and output or none' do
    s = mut { |m| svc(m)['weaknesses'][1]['realism'] = 'skin_no_advisory' }
    assert_error s, "linked entries must all hold advisories or none; no advisories for: 'filesrv.storage.w_two'"
    s = mut { |m| svc(m)['weaknesses'][1]['realism'] = 'skin_no_output' }
    assert_error s, 'linked entries must all hold output or none'
  end

  test 'a decoy entry with an advisory and output count no weakness entry has is an error' do
    s = mut { |m| svc(m)['decoys'][0]['realism'] = 'skin_two_advisories' }
    assert_error s, 'no weakness in this scenario links an entry with the same advisory and output counts'
    assert_error s, '(advisories 2, output 2, auxiliary/4)'
  end

  test 'banner on some finding-holding services and not on others is an error' do
    s = mut { |m| svc(m, 'printsrv')['cli'].delete('banner') }
    assert_error s, "none on: 'spool'"
    s = mut { |m| m['hosts'].each_value { |h| Array(h['services']).each { |sv| sv['cli'].delete('banner') } } }
    refute_errors s
  end

  test 'linked modules on one service must share first segment and length, and a decoy form must exist among weaknesses' do
    s = mut { |m| svc(m)['weaknesses'][1]['realism'] = 'skin_long_module' }
    assert_error s, "service 'filesrv.storage': the linked modules differ in first segment or number of segments (auxiliary/4 and auxiliary/5)"
    s = mut { |m| svc(m)['weaknesses'][1]['realism'] = 'skin_exploit_form' }
    assert_error s, 'auxiliary/4 and exploit/4'
    s = mut { |m| svc(m)['decoys'][0]['realism'] = 'skin_long_module' }
    assert_error s, 'whose module form (auxiliary/5) is used by no weakness'
    s = mut { |m| svc(m)['decoys'][0]['realism'] = 'skin_look_wordy' }
    refute(errors(s).any? { |e| e.include?('module form') || e.include?('differ in first') })
  end

  # ---- text rules ----

  test 'a banner with a tab and one with a non-ASCII letter are errors' do
    s = mut { |m| banner!(m, "Quillbox 2.1\tready") }
    assert_error s, 'cli.banner: the characters rule matched'
    s = mut { |m| banner!(m, "Quillbox 2.1 réady") }
    assert_error s, 'the characters rule matched'
  end

  test 'path, credential and host forms in a cli string are errors with the plain form' do
    {
      '/etc/quill/conf' => 'path', 'See ~/notes for 2.1' => 'path', 'Files in var/log/app' => 'path',
      'Quillbox 2.1 user:pass' => 'credential', 'Login admin/admin works' => 'credential',
      'password=hunter2xyz' => 'credential', 'Quillbox 2.1 at 203.0.113.9' => 'host',
      'Quillbox 2.1 at quill.example.org' => 'host', 'Quillbox 2.1 http://quill' => 'host'
    }.each do |text, rule|
      s = mut { |m| banner!(m, text) }
      assert_error s, "the #{rule} rule matched"
    end
    s = mut { |m| banner!(m, 'Quillbox 2.1 /etc/quill') }
    assert(errors(s).any? { |e| e.include?("matched '/etc/quill'") && e.include?('name the thing in words') })
  end

  test 'the passing look-alikes raise no error' do
    [
      'Quillbox 2.1 SMB/CIFS', 'Quillbox 2.1 over TCP/IP', 'Quillbox 2.1 HTTP/1.1', 'Guest/anonymous access enabled',
      'Anonymous login: allowed', 'Read/Write/Execute', 'timeout=30', 'SSH host key: RSA', 'Weak TLS 1.0 enabled',
      'Quillbox 2.1 at 10.20.30.5:4455', 'Quillbox 2.1 at quill.local', 'Quillbox 2.1 at quill.internal'
    ].each do |text|
      s = mut { |m| banner!(m, text) }
      refute_errors s
    end
  end

  test 'the weaker telltale words are warnings' do
    s = mut { |m| banner!(m, 'Quillbox 2.1 is safe') }
    refute_errors s
    assert(warnings(s).any? { |w| w.include?("the weak_telltale rule matched 'safe'") })
    s = mut { |m| svc(m)['cli']['service'] = 'real' }
    assert(warnings(s).any? { |w| w.include?('weak_telltale') })
  end

  test 'a telltale word in a cli string is an error' do
    s = mut { |m| banner!(m, 'Quillbox 2.1 decoy') }
    assert_error s, "the telltale rule matched 'decoy'"
  end

  # ---- passwords ----

  def with_npc(s)
    s['rooms'] = { 'r' => { 'npcs' => [{ 'id' => 'clerk', 'displayName' => 'Clerk',
                                          'creds' => { 'username' => 'clerk', 'password' => PASSWORD } }] } }
    s
  end

  test 'a service cli string or a linked entry holding an NPC password is an error' do
    s = with_npc(mut { |m| banner!(m, "Quillbox 2.1 #{PASSWORD}") })
    assert_error s, "holds the password of NPC 'clerk'"
    refute(errors(s).any? { |e| e.include?(PASSWORD) }, 'the password is not echoed')
    s = with_npc(mut { |m| svc(m)['weaknesses'][1]['realism'] = 'skin_keeps_secret' })
    assert_error s, "an entry linked by finding 'filesrv.storage.w_two'"
    refute_errors with_npc(mut { |_m| nil })
  end

  # ---- real identifiers ----

  test 'a made-up advisory id in a cli string or in the scenario text of an ops scenario is an error' do
    s = mut { |m| banner!(m, 'Quillbox 2.1 CVE-9999-12345') }
    assert_error s, "holds 'CVE-9999-12345'"
    %w[ms99-999 kb9999999 rhsa-9999 GHSA-xxxx can-9999-12 zdi_99].each do |id|
      s = mut { |m| m['hosts']['filesrv']['name'] = "File server #{id}" }
      assert_error s, "host 'filesrv' name holds"
    end
    s = mut { |m| svc(m)['weaknesses'][0]['summary'] = 'Same as cve_9999_4242 in the notes.' }
    assert_error s, "finding 'filesrv.storage.w_one' summary holds 'cve_9999_4242'"
    s = mut { |m| m['objectives'] = [{ 'title' => 'Read CVE-9999-1' }] }
    assert_error s, "objectives[0]/title holds 'CVE-9999-1'"
    s = mut { |m| m['hosts']['filesrv']['name'] = 'File server' ; m['scenario_brief'] = 'Mentions kb9999999 once.' }
    assert_error s, 'scenario_brief holds'
  end

  test 'an identifier preceded by a letter or digit is not a match' do
    s = mut { |m| m['hosts']['filesrv']['name'] = 'File server xcve-9999-1234 and 9ms99-999' }
    refute_errors s
  end

  test 'a framework path form is an error and look-alikes pass' do
    s = mut { |m| banner!(m, 'Quillbox 2.1 exploit/area/thing') }
    assert(errors(s).any? { |e| e.include?("holds 'exploit/area/thing'") })
    s = mut { |m| m['hosts']['filesrv']['name'] = 'Use auxiliary/scanner/quill/check_it today' }
    assert_error s, "host 'filesrv' name holds 'auxiliary/scanner/quill/check_it'"
    s = mut { |m| m['hosts']['filesrv']['name'] = 'Files/Scans/Reports and exploit/area only' }
    refute_errors s
  end

  # Built at run time, so no file holds a whole real-form id or path.
  def made_path(first = 'exploit', *rest)
    [first, *(rest.empty? ? %w[area thing probe] : rest)].join('/')
  end

  test 'a path form glued to a label, capitalised, or after punctuation is an error' do
    path = made_path
    ["See module:#{path} for it.", "Text #{path.capitalize} here", "Text #{path.upcase} here", "(#{path})", "see\n#{path}\n"].each do |text|
      s = mut { |m| m['hosts']['filesrv']['name'] = text }
      assert(errors(s).any? { |e| e.include?("host 'filesrv' name holds") }, text)
    end
    s = mut { |m| svc(m)['weaknesses'][0]['summary'] = "See module:#{path} for it." }
    assert(errors(s).any? { |e| e.include?("finding 'filesrv.storage.w_one' summary holds") })
    %w[Files/Scans/Reports my_exploit/a/b a/exploit/b/c].each do |text|
      s = mut { |m| m['hosts']['filesrv']['name'] = "Look at #{text}" }
      refute_errors s
    end
  end

  test 'technique, item, card, sign, note and file text and NPC names are read for real identifiers' do
    adv = %w[CVE 9999 12345].join('-')
    path = made_path
    cases = {
      'technique name' => ->(m) { m['techniques'] = { 'tq' => { 'name' => "Read #{adv} first.", 'summary' => 'x' } } },
      'technique summary' => ->(m) { m['techniques'] = { 'tq' => { 'name' => 'Note', 'summary' => "Needs #{path}" } } },
      'item name' => ->(m) { m['rooms'] = { 'r' => { 'objects' => [{ 'id' => 'o1', 'type' => 'notes4', 'name' => "Card #{adv}" }] } } },
      'sign text' => ->(m) { m['rooms'] = { 'r' => { 'objects' => [{ 'id' => 'o1', 'type' => 'notes4', 'name' => 'Sign', 'text' => "Read #{adv} first." }] } } },
      'file text in a share' => ->(m) { m['rooms'] = { 'r' => { 'objects' => [{ 'id' => 'o1', 'type' => 'pc', 'files' => [{ 'name' => 'a.txt', 'text' => "module:#{path}" }] }] } } },
      'npc name' => ->(m) { m['rooms'] = { 'r' => { 'npcs' => [{ 'id' => 'n1', 'displayName' => "Pat #{adv}" }] } } }
    }
    cases.each do |name, edit|
      s = mut { |m| edit.call(m) }
      assert(errors(s).any? { |e| e.include?('holds') && e.include?('real advisory id') }, "#{name} is not read")
    end
  end

  test 'a comment key and an underscore key are not read, and a scenario with no services is not read' do
    adv = %w[CVE 9999 12345].join('-')
    s = mut { |m| m['_comment'] = "see #{adv}"; m['rooms'] = { 'r' => { 'objects' => [{ 'id' => 'o1', '_note' => adv }] } } }
    refute_errors s
  end

  test 'a nickname of the deny list is an error, joined by a space, underscore or hyphen' do
    with_nicknames(%w[quillstorm quill_flood]) do |path|
      s = mut { |m| m['hosts']['filesrv']['name'] = 'The Quillstorm box' }
      assert_error s, "host 'filesrv' name holds 'Quillstorm'", nicknames_path: path
      s = mut { |m| m['hosts']['filesrv']['name'] = 'quill-flood alert' }
      assert_error s, 'holds', nicknames_path: path
      s = mut { |m| m['hosts']['filesrv']['name'] = 'a quillstormy box' }
      refute_errors s, nicknames_path: path
      s = mut { |m| m['hosts']['filesrv']['name'] = 'the quillflood box' }
      assert_error s, 'holds', nicknames_path: path
    end
  end

  test 'a banner with the vendor word left off is still compared with the service version' do
    s = mut { |m| svc(m)['product'] = 'Tarnwick Quillbox'; banner!(m, 'Quillbox 9.9 ready') }
    assert(errors(s).any? { |e| e.include?('9.9') }, errors(s).join("\n"))
    s = mut { |m| svc(m)['product'] = 'Tarnwick Quillbox'; banner!(m, 'Quillbox 2.1 ready') }
    refute_errors s
  end

  test 'a service word that only matches once joined into its default script is an error' do
    s = unlinked
    svc(s)['name'] = 'usn'
    svc(s)['weaknesses'][0]['class'] = 'misconfig'
    assert_error s, "finding 'filesrv.usn.w_one' default script holds 'usn-'"
    s = unlinked
    svc(s)['name'] = 'quillstorm'
    with_nicknames(%w[quillstorm]) do |path|
      assert_error s, "default module holds 'quillstorm'", nicknames_path: path
    end
    refute_errors unlinked
  end

  test 'a scenario with no services is not read for real identifiers' do
    s = { 'scenario_brief' => 'Mentions CVE-9999-12345 and auxiliary/scanner/a/b.',
          'objectives' => [{ 'title' => 'Read ms99-999' }],
          'rooms' => { 'r' => { 'objects' => [{ 'id' => 'mail', 'type' => 'email', 'content' => 'See kb9999999.' }] } },
          'networks' => { 'office' => { 'name' => 'Office kb9999999' } } }
    refute_errors s
    assert_empty realism_skin_ink_wording(["Ian: The CVE-9999-12345 note.", 'Ian: Nothing more.'], 'x.ink')
  end

  # ---- version agreement ----

  test 'a banner naming a real product or a different version after the product is an error' do
    s = mut { |m| banner!(m, 'Quillbox 3.0 ready') }
    assert_error s, 'gives version 3.0 after the product, but the service\'s version is 2.1'
    s = mut { |m| banner!(m, 'quillbox v2.1 ready') }
    refute_errors s
    s = mut { |m| banner!(m, 'Apache ready') }
    assert_error s, "names a real product ('apache')"
    s = mut { |m| banner!(m, 'Welcome, version 7 only') }
    refute_errors s
  end

  test 'a linked entry title or output line with another version after the product is an error' do
    s = mut { |m| svc(m)['weaknesses'][1]['realism'] = 'skin_version_off' }
    assert_error s, "an entry linked by finding 'filesrv.storage.w_two'"
    s = mut { |m| svc(m)['weaknesses'][1]['realism'] = 'skin_version_line' }
    assert_error s, 'gives version 9.9 after the product'
  end

  # ---- warnings ----

  test 'a decoy entry sharing a content word with its falseBecause is a warning quoting only that word' do
    s = mut do |m|
      svc(m)['decoys'][0]['realism'] = 'skin_look_wordy'
      svc(m)['decoys'][0]['falseBecause'] = 'That gateway is hidden from outsiders.'
    end
    refute_errors s
    found = warnings(s)
    assert(found.any? { |w| w.include?("shares the word 'gateway'") }, found.join("\n"))
    assert_equal 1, found.length, found.join("\n")
    refute_includes found.first, 'Quillbox spool queue lists'
    assert_empty warnings(mut { |m| svc(m)['decoys'][0]['falseBecause'] = 'That label is only a leftover.' })
  end

  test 'networkView or a cli object where no host declares services is a warning' do
    s = { 'networkView' => { 'defaultSkin' => 'cli' },
          'networks' => { 'office' => { 'name' => 'Office', 'cli' => { 'range' => '10.1.2.0/24' } } },
          'hosts' => { 'box' => { 'name' => 'Box', 'network' => 'office' } } }
    found = warnings(s)
    assert(found.any? { |w| w.include?("'networkView' is set but no host declares services") }, found.join("\n"))
    assert(found.any? { |w| w.include?("'networks/office/cli' is set") })
    assert_empty warnings(base)
    assert_empty warnings({ 'networks' => { 'office' => { 'name' => 'Office' } } })
  end

  test 'skin-specific wording in objectives, hints and mails of an ops scenario is a warning' do
    s = mut do |m|
      m['objectives'] = [{ 'title' => 'Click the Sweep button',
                           'tasks' => [{ 'title' => 'Type scan at the prompt' }, { 'title' => 'Sweep the office network' }] }]
      m['rooms'] = { 'r' => { 'objects' => [
        { 'id' => 'note', 'type' => 'notes', 'requiresItemHint' => 'Press the key, then confirm it.' },
        { 'id' => 'mail', 'type' => 'email', 'content' => 'Open the terminal and check the host.' },
        { 'id' => 'ok', 'type' => 'notes', 'requiresItemHint' => 'Use the technique on the finding.' }
      ] } }
    end
    found = warnings(s)
    assert(found.any? { |w| w.include?("'objectives[0]/title': names a control ('Click') beside an action ('Sweep')") }, found.join("\n"))
    assert(found.any? { |w| w.include?('objectives[0]/tasks[0]/title') })
    refute(found.any? { |w| w.include?('tasks[1]') })
    assert(found.any? { |w| w.include?("requiresItemHint': names a control ('Press the')") })
    assert(found.any? { |w| w.include?('rooms/r/objects[1]/content') })
    refute(found.any? { |w| w.include?('objects[2]') })
    refute_errors s
    # A scenario with no services is not read.
    assert_empty warnings({ 'objectives' => [{ 'title' => 'Click the Sweep button' }] })
  end

  test 'the ink half of the wording warning reads an ops scenario ink line and skips comments' do
    lines = ['// Click the sweep button', 'Ian: Click the button to sweep the net.', 'Ian: Sweep the office network.',
             '* [Type scan] Ian: Fine.']
    found = realism_skin_ink_wording(lines, 'ian.ink')
    assert_equal 2, found.length, found.join("\n")
    assert_includes found.first, "'ian.ink' line 2: names a control ('Click') beside an action ('sweep')"
    assert(found.all? { |w| w.start_with?('⚠️ WARNING: realism skin:') })
    assert realism_skin_uses_services?(base)
    refute realism_skin_uses_services?({ 'networks' => { 'a' => { 'name' => 'A' } } })
  end

  # ---- messages ----

  test 'no message holds a string of the test catalog' do
    strings = Dir.glob(File.join(VALID, '*.json')).flat_map do |f|
      JSON.parse(File.read(f))['entries'].values.flat_map do |e|
        [e['title'], e['module'], e['script']] + Array(e['advisories']) + Array(e['output'])
      end
    end.compact.select { |t| t.length >= 8 }
    messages = []
    cases = [
      ->(m) { svc(m)['weaknesses'][0]['realism'] = 'skin_nothing_here' },
      ->(m) { svc(m)['weaknesses'][1]['realism'] = 'skin_version_off' },
      ->(m) { svc(m)['weaknesses'][1]['realism'] = 'skin_keeps_secret'; with_npc(m) },
      ->(m) { svc(m)['weaknesses'][1]['realism'] = 'skin_no_advisory' },
      ->(m) { svc(m)['weaknesses'][1]['realism'] = 'skin_long_module' },
      ->(m) { svc(m)['weaknesses'][1]['realism'] = 'skin_exploit_form' },
      ->(m) { svc(m)['decoys'][0]['realism'] = 'skin_two_advisories' },
      ->(m) { svc(m)['decoys'][0]['realism'] = 'skin_look_wordy'; svc(m)['decoys'][0]['falseBecause'] = 'That gateway is hidden.' },
      ->(m) { svc(m)['weaknesses'][1].delete('realism') }
    ]
    cases.each { |c| messages.concat(run_check(mut { |m| c.call(m) })) }
    messages.concat(run_check(mut { |m| svc(m)['weaknesses'][0]['realism'] = 'skin_nothing_here' }, catalog_dir: BROKEN))
    assert messages.length >= 9
    messages.each do |msg|
      strings.each { |t| refute_includes msg, t }
    end
  end

  # ---- the graph and the whole validator ----

  test 'the dungeon graph is the same with and without networkView, the cli objects and the links' do
    src = File.join(ROOT, 'scenarios/test_ops_skin')
    json = JSON.parse(BreakEscape::ScenarioBinding.render(File.read(File.join(src, 'scenario.json.erb')), {}))
    graphs = {}
    Dir.mktmpdir do |work|
      { 'plain' => json, 'skinned' => skinned(json) }.each do |name, data|
        dir = File.join(work, name)
        FileUtils.cp_r(src, dir)
        FileUtils.rm_f(Dir.glob(File.join(dir, 'dungeon_graph.*')))
        FileUtils.rm_f(File.join(dir, 'scenario.json.erb'))
        File.write(File.join(dir, 'scenario.json'), JSON.pretty_generate(data))
        _out, status = Open3.capture2e('ruby', File.join(ROOT, 'scripts/generate_dungeon_graph.rb'),
                                       File.join(dir, 'scenario.json'), chdir: ROOT)
        assert status.success?, "graph generator failed for #{name}"
        graphs[name] = JSON.parse(File.read(File.join(dir, 'dungeon_graph.json')))
      end
    end
    assert_equal graphs['plain'].except('scenario'), graphs['skinned'].except('scenario')
  end

  def skinned(json)
    data = JSON.parse(JSON.generate(json))
    data['networkView'] = { 'defaultSkin' => 'cli' }
    data['networks'].each_value { |n| n['cli'] = { 'range' => '10.50.1.0/24' } }
    hosts = (data['hosts'] || {}).values + data['rooms'].values.flat_map { |r| Array(r['objects']) }
    hosts.each do |h|
      Array(h['services']).each do |sv|
        sv['cli'] = { 'protocol' => 'tcp', 'banner' => 'Invented banner' }
        (Array(sv['weaknesses']) + Array(sv['decoys'])).each { |f| f['realism'] = 'filehold_update_lag' }
      end
    end
    data
  end

  test 'a shipped ops scenario gets no realism skin line from the whole validator' do
    out, = Open3.capture2e('ruby', 'scripts/validate_scenario.rb', 'scenarios/test_ops_skin/scenario.json.erb',
                           '--no-graph', chdir: ROOT)
    refute_includes out, 'realism skin'
  end
end
