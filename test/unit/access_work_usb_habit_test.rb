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

  STICK = { 'type' => 'usb', 'id' => 'kim_usb', 'name' => "Kim's USB stick", 'usbClass' => 'storage', 'takeable' => true }.freeze

  test 'the stick: the first usb item with an id in itemsHeld, only for a habit NPC' do
    held = [{ 'type' => 'key', 'id' => 'k' }, { 'type' => 'usb', 'name' => 'no id' }, STICK, STICK.merge('id' => 'second')]
    assert_equal 'kim_usb', AW.usb_stick(kim('itemsHeld' => held))['id']
    assert_nil AW.usb_stick(kim)
    assert_nil AW.usb_stick(kim('itemsHeld' => [STICK], 'usbHabit' => nil)), 'no habit, no habit stick'
  end

  # Review R2 m4: a HID device is never the habit's stick
  test 'the stick is a storage usb item (usbClass storage or none), never a HID device' do
    hid = { 'type' => 'usb', 'id' => 'kim_hid', 'name' => 'Keylogger', 'usbClass' => 'hid' }
    assert_nil AW.usb_stick(kim('itemsHeld' => [hid]))
    assert_equal 'kim_usb', AW.usb_stick(kim('itemsHeld' => [hid, STICK]))['id']
    assert_equal 'kim_x', AW.usb_stick(kim('itemsHeld' => [hid, { 'type' => 'usb', 'id' => 'kim_x' }]))['id']
  end

  test 'the plan names the stick' do
    assert_equal({ 'every' => 2, 'setGlobal' => 'kim_emailed', 'stick' => 'kim_usb' },
                 AW.plan(scenario, kim('itemsHeld' => [STICK]))['usb'])
  end

  test 'the files: the authored contents, else one default work_file.txt' do
    files = AW.usb_stick_files(STICK)
    assert_equal 1, files.size
    assert_equal({ 'type' => 'text_file', 'id' => 'kim_usb_work_file', 'name' => 'work_file.txt' },
                 files[0].slice('type', 'id', 'name'))
    assert_equal AW::USB_STICK_DEFAULT_TEXT, files[0]['text']
    own = [{ 'type' => 'text_file', 'id' => 'f1', 'name' => 'rota.txt', 'text' => 'Rota.' }]
    assert_equal own, AW.usb_stick_files(STICK.merge('contents' => own))
    assert_equal 'work_file.txt', AW.usb_stick_files(STICK.merge('contents' => []))[0]['name']
  end

  test 'every habit stick in the rooms' do
    s = scenario
    s['rooms']['office']['npcs'] = [kim('itemsHeld' => [STICK]), { 'id' => 'nadia', 'itemsHeld' => [STICK.merge('id' => 'n_usb')] }]
    assert_equal [%w[kim kim_usb]], AW.usb_habit_sticks(s).map { |npc, stick| [npc['id'], stick['id']] }
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
