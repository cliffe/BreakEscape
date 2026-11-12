require 'test_helper'

# The USB habit (docs/achitechture/USB_HABIT_PLAN.md, user decision q39): a work use at the
# NPC's station that copies to a stick its policy refuses fails with the cause usb_refused.
class AccessWorkUsbHabitTest < ActiveSupport::TestCase
  AW = BreakEscape::AccessWork

  def scenario(usb: 'storage_blocked')
    {
      'policies' => { 'locked' => { 'usb' => usb } },
      'globalVariables' => { 'kim_emailed' => false },
      'resources' => { 'reports' => { 'kind' => 'file_share' } },
      'rooms' => {
        'office' => {
          'objects' => [
            { 'id' => 'kim_pc', 'type' => 'pc', 'lockType' => 'login', 'policy' => 'locked',
              'affordance' => { 'satisfies' => 'work', 'useSeconds' => 5 } },
            { 'id' => 'other_pc', 'type' => 'pc', 'lockType' => 'login', 'policy' => 'locked',
              'affordance' => { 'satisfies' => 'work', 'useSeconds' => 5 } }
          ],
          'npcs' => []
        }
      }
    }
  end

  def kim(extra = {})
    { 'id' => 'kim', 'needsHome' => 'kim_pc', 'workNeeds' => ['reports'],
      'needs' => { 'work' => { 'decayPerMin' => 40 }, 'social_media' => { 'decayPerMin' => 60 } },
      'usbHabit' => { 'every' => 2, 'setGlobal' => 'kim_emailed' } }.merge(extra)
  end

  USB = { 'id' => 'kim_pc', 'why' => 'usb_refused' }.freeze

  test 'usb_refused is a fail cause' do
    assert_includes AW::FAIL_CAUSES, 'usb_refused'
  end

  test 'refused: storage_blocked and blocked refuse a stick, allowed does not' do
    assert AW.usb_habit_refused?(scenario, kim)
    assert AW.usb_habit_refused?(scenario(usb: 'blocked'), kim)
    assert_not AW.usb_habit_refused?(scenario(usb: 'allowed'), kim)
    assert_not AW.usb_habit_refused?(scenario, kim('usbHabit' => nil)), 'no habit'
    assert_not AW.usb_habit_refused?(scenario, kim('workNeeds' => [])), 'no work plan'
    assert_not AW.usb_habit_refused?(scenario, kim('needsHome' => nil)), 'no station'
  end

  test 'every: 1 to 10, default 2' do
    assert_equal 2, AW.usb_every(kim('usbHabit' => {}))
    assert_equal 3, AW.usb_every(kim('usbHabit' => { 'every' => 3 }))
    assert_equal 2, AW.usb_every(kim('usbHabit' => { 'every' => 0 }))
    assert_equal 2, AW.usb_every(kim('usbHabit' => { 'every' => 11 }))
    assert_equal 2, AW.usb_every(kim('usbHabit' => { 'every' => 2.5 }))
  end

  test 'can fail: only through the habit here' do
    assert AW.can_fail?(scenario, kim, 'work')
    assert_not AW.can_fail?(scenario(usb: 'allowed'), kim, 'work')
    assert_not AW.can_fail?(scenario, kim('usbHabit' => nil), 'work')
  end

  test 'belongs: work at the station only' do
    assert AW.cause_belongs?(scenario, kim, 'work', USB)
    assert_not AW.cause_belongs?(scenario, kim, 'work', { 'id' => 'other_pc', 'why' => 'usb_refused' })
    assert_not AW.cause_belongs?(scenario, kim, 'social_media', USB)
    # Review R1 m2: only for an NPC whose station refuses its habit
    assert_not AW.cause_belongs?(scenario, kim('usbHabit' => nil), 'work', USB), 'no habit'
    assert_not AW.cause_belongs?(scenario(usb: 'allowed'), kim, 'work', USB), 'the policy allows USB'
  end

  test 'holds: work at the station while the policy refuses; never owned' do
    assert AW.cause_holds?(scenario, kim, 'work', USB, {}, [])
    assert_not AW.cause_holds?(scenario(usb: 'allowed'), kim, 'work', USB, {}, [])
    assert_not AW.cause_holds?(scenario, kim, 'social_media', USB, {}, [])
    assert_not AW.cause_holds?(scenario, kim, 'work', { 'id' => 'other_pc', 'why' => 'usb_refused' }, {}, [])
    assert_equal [], AW.owned_causes(scenario, kim, 'work'), 'an ease at the station stays possible'
  end

  test 'reachable and live for the C2 cause predicate' do
    assert AW.cause_why_reachable?(scenario, kim, 'work', 'usb_refused')
    assert_not AW.cause_why_reachable?(scenario(usb: 'allowed'), kim, 'work', 'usb_refused')
    assert_not AW.cause_why_reachable?(scenario, kim, 'social_media', 'usb_refused')
    assert_equal [USB], AW.cause_candidates(scenario, kim, 'work', 'usb_refused')
    assert AW.cause_why_holds?(scenario, kim, 'work', 'usb_refused', {}, [])
  end

  test 'the plan carries usb { every, setGlobal }; an undeclared global is left out' do
    assert_equal({ 'every' => 2, 'setGlobal' => 'kim_emailed' }, AW.plan(scenario, kim)['usb'])
    assert_equal({ 'every' => 2 }, AW.plan(scenario, kim('usbHabit' => { 'every' => 2, 'setGlobal' => 'nope' }))['usb'])
    assert_nil AW.plan(scenario, kim('usbHabit' => nil))['usb']
  end

  test 'a reactive post keyed on cause usb_refused: served only after a recorded usb fail' do
    posts = [{ 'id' => 'ordered', 'text' => 'x' }, { 'id' => 'vent', 'text' => 'y', 'when' => { 'cause' => 'usb_refused', 'need' => 'work' } }]
    npc = kim('feed' => { 'order' => 'reactive_first', 'posts' => posts })
    entry = { 'level' => 25, 'failAt' => { 'work' => 1 }, 'failWhy' => { 'work' => ['usb_refused'] } }
    assert_equal 'vent', AW.select_feed_post(scenario, npc, nil, entry, {}, [])['post']
    other = entry.merge('failWhy' => { 'work' => ['down'] })
    assert_equal 'ordered', AW.select_feed_post(scenario, npc, nil, other, {}, [])['post']
    assert_equal 'ordered', AW.select_feed_post(scenario(usb: 'allowed'), npc, nil, entry, {}, [])['post'], 'the cause no longer holds'
    assert AW.when_reachable?(scenario, npc, posts[1]['when'])
    assert_not AW.when_reachable?(scenario(usb: 'allowed'), npc, posts[1]['when']), 'a dead post where USB is allowed'
  end
end
