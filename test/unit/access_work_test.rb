require 'test_helper'

# Access model slice 9.2 step A-1 (ACCESS_MODEL_SLICE_9_2_PLAN.md, section 10): the resolver in
# BreakEscape::AccessWork that the server and the validator share.
class AccessWorkTest < ActiveSupport::TestCase
  AW = BreakEscape::AccessWork

  def scenario(extra = {})
    {
      'officePresets' => true,
      'defaultPolicy' => 'managed',
      'policies' => { 'managed' => { 'usb' => 'allowed' }, 'no_social' => { 'social' => 'blocked' } },
      'resources' => {
        'email' => { 'kind' => 'email' },
        'finance_share' => { 'kind' => 'file_share', 'access' => { 'roles' => ['finance'] }, 'downIf' => 'finance_share_down' },
        'printer' => { 'kind' => 'printer', 'object' => 'office_printer', 'downIf' => 'printer_jammed' }
      },
      'roles' => {
        'staff' => { 'workNeeds' => ['email'], 'frustration' => { 'perFail' => 20 } },
        'finance' => { 'workNeeds' => ['finance_share'], 'frustration' => { 'easePerSuccess' => 5 } }
      },
      'rooms' => {
        'office' => {
          'objects' => [
            { 'id' => 'dana_pc', 'type' => 'pc', 'lockType' => 'login', 'affordance' => { 'satisfies' => 'work', 'useSeconds' => 5 } },
            { 'id' => 'plain_pc', 'type' => 'pc' },
            { 'id' => 'tablet', 'type' => 'tablet1', 'affordance' => { 'satisfies' => 'work', 'useSeconds' => 3 } },
            { 'id' => 'hot_desk', 'type' => 'pc', 'lockType' => 'login', 'affordance' => { 'satisfies' => 'work', 'useSeconds' => 7 } },
            { 'id' => 'dead_pc', 'type' => 'pc', 'lockType' => 'login', 'affordance' => { 'satisfies' => 'work', 'offWhen' => 'dead' } },
            { 'id' => 'kiosk', 'type' => 'kiosk1', 'workstation' => true, 'affordance' => { 'satisfies' => 'work' } }
          ],
          'npcs' => []
        }
      }
    }.merge(extra)
  end

  def npc(extra = {})
    { 'id' => 'dana', 'role' => %w[finance], 'creds' => { 'username' => 'dreyes', 'password' => 'x' },
      'needsHome' => 'dana_pc', 'needs' => { 'work' => { 'decayPerMin' => 6, 'urgentAt' => 50 } } }.merge(extra)
  end

  test 'role order with staff last; +, - and bare entries' do
    d = scenario
    assert_equal %w[finance staff], AW.npc_roles(npc)
    assert_equal %w[finance staff], AW.npc_roles(npc('role' => %w[staff finance]))
    assert_equal %w[finance_share email], AW.work_list(d, npc)
    assert_equal %w[finance_share email printer], AW.work_list(d, npc('workNeeds' => ['+printer']))
    assert_equal %w[finance_share printer], AW.work_list(d, npc('workNeeds' => ['printer', '-email']))
    assert_equal %w[email], AW.work_list(d, npc('role' => nil, 'workNeeds' => nil))
  end

  test 'an NPC with no role and no account resolves nothing' do
    bare = { 'id' => 'temp', 'needs' => { 'work' => {} } }
    assert_equal [], AW.work_list(scenario, bare)
    assert_not AW.work_plan?(scenario, bare)
  end

  test 'frustration merged field by field: defaults, roles in order, own' do
    d = scenario
    assert_equal({ 'perFail' => 20.0, 'easePerSuccess' => 5.0, 'breakDrain' => 10.0 }, AW.frustration(d, npc))
    assert_equal 34.0, AW.frustration(d, npc('frustration' => { 'perFail' => 34 }))['perFail']
    assert_equal 5.0, AW.frustration(d, npc('frustration' => { 'perFail' => 34 }))['easePerSuccess']
    assert_equal 25.0, AW.frustration({}, npc)['perFail']
  end

  test 'no plan for an NPC with a resolved list and no work need' do
    assert AW.work_plan?(scenario, npc)
    assert_not AW.work_plan?(scenario, npc('needs' => { 'caffeine' => {} }))
    assert_nil AW.plan(scenario, npc('needs' => {}))
  end

  test 'the plan holds ids, kinds, admitted and downIf, never a name or a network' do
    d = scenario
    d['resources']['email']['name'] = 'Email system'
    plan = AW.plan(d, npc('workNeeds' => ['+printer']))
    assert_equal 10.0, plan['breakDrain']
    assert_equal [{ 'id' => 'finance_share', 'kind' => 'file_share', 'admitted' => true, 'downIf' => 'finance_share_down' },
                  { 'id' => 'email', 'kind' => 'email', 'admitted' => true },
                  { 'id' => 'printer', 'kind' => 'printer', 'admitted' => true, 'downIf' => 'printer_jammed', 'object' => 'office_printer' }],
                 plan['needs']
    kai = npc('id' => 'kai', 'role' => nil, 'workNeeds' => ['+finance_share'])
    assert_equal false, AW.plan(d, kai)['needs'].find { |n| n['id'] == 'finance_share' }['admitted']
    assert_not_includes JSON.generate(plan), 'Email system'
  end

  test 'routes only with networks: [[]] on the same network or none, [] on another' do
    d = scenario('networks' => { 'corp' => { 'name' => 'Corp' }, 'fin' => { 'name' => 'Fin' } })
    d['rooms']['office']['network'] = 'corp'
    d['resources']['email']['network'] = 'corp'
    d['resources']['finance_share']['network'] = 'fin'
    needs = AW.plan(d, npc)['needs'].to_h { |n| [n['id'], n['routes']] }
    assert_equal [], needs['finance_share']
    assert_equal [[]], needs['email']
    assert_nil AW.plan(scenario, npc)['needs'].first['routes']
  end

  test 'can fail: each cause, and none' do
    d = scenario
    assert AW.can_fail?(d, npc, 'work'), 'a downIf'
    email_only = npc('role' => nil)
    assert_not AW.can_fail?(d, email_only, 'work'), 'email only, no downIf, a live PC'
    assert AW.can_fail?(d, email_only.merge('needsHome' => 'dead_pc'), 'work'), 'its station has an offWhen'
    assert AW.can_fail?(d, npc('id' => 'kai', 'role' => nil, 'workNeeds' => ['+finance_share']), 'work'), 'not admitted'
    borrow = email_only.merge('workarounds' => [{ 'at' => 50, 'do' => 'borrow_session', 'pc' => 'dead_pc' }])
    assert AW.can_fail?(d, borrow, 'work'), 'a borrow PC with an offWhen'
    net = scenario('networks' => { 'a' => { 'name' => 'A' } })
    net['resources']['email']['network'] = 'a'
    assert AW.can_fail?(net, email_only, 'work'), 'a [] route'
    assert_not AW.can_fail?(d, npc('needs' => {}), 'work'), 'no plan'
    social = email_only.merge('needs' => { 'social_media' => {} }, 'phone' => false, 'needsHome' => 'dana_pc')
    assert_not AW.can_fail?(d, social, 'social_media')
    d['rooms']['office']['objects'][0]['policy'] = 'no_social'
    assert AW.can_fail?(d, social, 'social_media')
    assert_not AW.can_fail?(d, social.merge('phone' => true), 'social_media'), 'a phone never fails'
  end

  test 'a use time from an affordance, from a preset and from the 20 second default' do
    d = scenario
    assert_equal 5.0, AW.use_seconds(d, AW.object(d, 'dana_pc'))
    assert_equal 10.0, AW.use_seconds(d, AW.object(d, 'plain_pc')), 'desk_pc preset'
    assert_equal 20, AW.use_seconds(d, AW.object(d, 'dead_pc'))
    assert_equal 20, AW.use_seconds(scenario('officePresets' => false), AW.object(d, 'plain_pc'))
  end

  test 'the desk rule: each workstation field, and a plain pc with presets on and off' do
    d = scenario
    { 'workstation' => true, 'locksScreenOnLeave' => true, 'lockChance' => 0, 'lockType' => 'login' }.each do |k, v|
      assert AW.desk?(d, { 'id' => 'x', 'type' => 'tablet1', k => v }), k
    end
    assert AW.desk?(d, AW.object(d, 'plain_pc'))
    assert_not AW.desk?(scenario('officePresets' => false), AW.object(d, 'plain_pc'))
    assert_not AW.desk?(d, AW.object(d, 'tablet'))
  end

  test "an NPC's places for a need and its shortest use time, with a non-desk object shorter than its station" do
    d = scenario
    who = npc('workarounds' => [{ 'at' => 50, 'do' => 'borrow_session', 'pc' => 'hot_desk' }])
    assert_equal %w[dana_pc hot_desk tablet], AW.places(d, who, 'work')
    assert_equal 3.0, AW.shortest_use_seconds(d, who, 'work')
    d['rooms']['office']['objects'].delete_if { |o| o['id'] == 'tablet' }
    assert_equal 5.0, AW.shortest_use_seconds(d, who, 'work')
    assert_equal 20, AW.shortest_use_seconds(d, npc('needsHome' => nil), 'work')
  end

  test 'the causes the server owns, each alone and none' do
    d = scenario
    assert_equal [], AW.owned_causes(d, npc, 'work')
    kai = npc('id' => 'kai', 'role' => nil, 'workNeeds' => ['+finance_share'])
    assert_equal [{ 'id' => 'finance_share', 'why' => 'no_access' }], AW.owned_causes(d, kai, 'work')
    net = scenario('networks' => { 'a' => { 'name' => 'A' } })
    net['resources']['email']['network'] = 'a'
    assert_equal [{ 'id' => 'email', 'why' => 'unreachable' }], AW.owned_causes(net, npc('role' => nil), 'work')
    social = npc('needs' => { 'social_media' => {} }, 'phone' => false)
    d['rooms']['office']['objects'][0]['policy'] = 'no_social'
    assert_equal [{ 'id' => 'dana_pc', 'why' => 'social_blocked' }], AW.owned_causes(d, social, 'social_media')
    assert_equal [{ 'id' => 'dana_pc', 'why' => 'locked_out' }],
                 AW.owned_causes(scenario, npc, 'work', { 'dana_pc' => { 'dreyes' => true } })
  end

  test 'belongs to the NPC' do
    d = scenario
    assert AW.cause_belongs?(d, npc, 'work', { 'id' => 'finance_share', 'why' => 'down' })
    assert_not AW.cause_belongs?(d, npc, 'work', { 'id' => 'printer', 'why' => 'down' }), 'not in its list'
    assert_not AW.cause_belongs?(d, npc, 'work', { 'id' => 'finance_share', 'why' => 'no_access' }), 'admitted'
    assert AW.cause_belongs?(d, npc, 'work', { 'id' => 'dana_pc', 'why' => 'off' })
    assert_not AW.cause_belongs?(d, npc, 'work', { 'id' => 'hot_desk', 'why' => 'off' })
    assert_not AW.cause_belongs?(d, npc, 'work', { 'id' => 'dana_pc', 'why' => 'bored' })
  end

  test 'the floors' do
    assert_in_delta 0.9 * 4 * 60 - 3, AW.park_floor(npc), 0.001
    assert_in_delta 0.9 * 0.5 * 60 - 3, AW.park_floor(npc('needsDeferMin' => 0.5)), 0.001
    assert_in_delta 0.9 * 5 - 3, AW.use_floor(scenario('rooms' => { 'o' => { 'objects' => [scenario['rooms']['office']['objects'][0]] } }), npc, 'work'), 0.001
  end
end
