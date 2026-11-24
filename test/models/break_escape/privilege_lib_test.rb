require 'test_helper'

module BreakEscape
  # S5a unit 04: the pure pieces. The USB override keyword, the session-grant walk and the two new
  # ops log events and the profile kind.
  class PrivilegeLibTest < ActiveSupport::TestCase
    AW = BreakEscape::AccessWork
    CM = BreakEscape::CaptureModel

    def scenario(usb)
      { 'policies' => { 'locked' => { 'usb' => usb } } }
    end

    PC = { 'id' => 'pc1', 'type' => 'pc', 'lockType' => 'login', 'policy' => 'locked' }.freeze
    STICK = { 'usbClass' => 'storage' }.freeze
    HID = { 'usbClass' => 'hid' }.freeze

    test 'plant_refused? truth table without admin' do
      assert AW.plant_refused?(scenario('blocked'), PC, STICK)
      assert AW.plant_refused?(scenario('blocked'), PC, HID)
      assert AW.plant_refused?(scenario('storage_blocked'), PC, STICK)
      assert_not AW.plant_refused?(scenario('storage_blocked'), PC, HID)
      assert_not AW.plant_refused?(scenario('allowed'), PC, STICK)
      assert_not AW.plant_refused?(scenario('blocked'), PC, { 'name' => 'no class' })
    end

    test 'admin: true overrides, nothing else does' do
      assert_not AW.plant_refused?(scenario('blocked'), PC, STICK, admin: true)
      assert_not AW.plant_refused?(scenario('storage_blocked'), PC, STICK, admin: true)
      assert AW.plant_refused?(scenario('blocked'), PC, STICK, admin: false)
      assert AW.plant_refused?(scenario('blocked'), PC, STICK, admin: 'yes')
      assert AW.plant_refused?(scenario('blocked'), PC, STICK, admin: 1)
      assert AW.plant_refused?(scenario('blocked'), PC, STICK, admin: nil)
    end

    test 'the NPC-side habit reader still applies the policy' do
      data = scenario('storage_blocked').merge(
        'resources' => { 'reports' => { 'kind' => 'file_share' } },
        'rooms' => { 'office' => { 'npcs' => [], 'objects' => [
          PC.merge('id' => 'kim_pc', 'affordance' => { 'satisfies' => 'work', 'useSeconds' => 5 })
        ] } }
      )
      kim = { 'id' => 'kim', 'needsHome' => 'kim_pc', 'workNeeds' => ['reports'],
              'needs' => { 'work' => { 'decayPerMin' => 40 } },
              'habits' => { 'usb' => { 'every' => 2 } } }
      assert AW.usb_habit_refused?(data, kim)
      data['policies']['locked']['usb'] = 'allowed'
      assert_not AW.usb_habit_refused?(data, kim)
    end

    def grant(pc, extra = {})
      { 'type' => 'grant_foothold', 'pc' => pc, 'needsSession' => true }.merge(extra)
    end

    test 'session_grant_pc finds a top-level grant' do
      assert_equal 'a_pc', CM.session_grant_pc('triggerOnInteract' => [{ 'type' => 'show_message' }, grant('a_pc')])
    end

    test 'session_grant_pc finds a grant inside confirm_action onConfirm' do
      obj = { 'triggerOnInteract' => [{ 'type' => 'confirm_action',
                                        'onConfirm' => [{ 'type' => 'remove_item', 'item' => 'x' }, grant('sam_pc')] }] }
      assert_equal 'sam_pc', CM.session_grant_pc(obj)
    end

    test 'session_grant_pc is depth-first in list order' do
      nested_first = { 'triggerOnInteract' => [
        { 'type' => 'confirm_action', 'onConfirm' => [grant('inner_pc')] }, grant('outer_pc')
      ] }
      assert_equal 'inner_pc', CM.session_grant_pc(nested_first)
      flat_first = { 'triggerOnInteract' => [
        grant('outer_pc'), { 'type' => 'confirm_action', 'onConfirm' => [grant('inner_pc')] }
      ] }
      assert_equal 'outer_pc', CM.session_grant_pc(flat_first)
    end

    test 'session_grant_pc counts a grant with a condition and skips one without needsSession' do
      assert_equal 'c_pc', CM.session_grant_pc('triggerOnInteract' => [grant('c_pc', 'condition' => 'flag_set')])
      obj = { 'triggerOnInteract' => [{ 'type' => 'grant_foothold', 'pc' => 'plain_pc' }, grant('later_pc')] }
      assert_equal 'later_pc', CM.session_grant_pc(obj)
    end

    test 'session_grant_pc skips a grant whose pc is blank, as the validator and the client do' do
      [nil, '', '  ', 7].each do |blank|
        obj = { 'triggerOnInteract' => [{ 'type' => 'grant_foothold', 'needsSession' => true, 'pc' => blank }, grant('later_pc')] }
        assert_equal 'later_pc', CM.session_grant_pc(obj), blank.inspect
        assert_nil CM.session_grant_pc('triggerOnInteract' => [{ 'type' => 'grant_foothold', 'needsSession' => true, 'pc' => blank }])
      end
    end

    test 'session_grant_pc answers nil when there is no grant' do
      assert_nil CM.session_grant_pc('triggerOnInteract' => [{ 'type' => 'remove_item', 'item' => 'x' }])
      assert_nil CM.session_grant_pc('triggerOnInteract' => [{ 'type' => 'confirm_action', 'onConfirm' => nil }])
      assert_nil CM.session_grant_pc({})
      assert_nil CM.session_grant_pc(nil)
    end

    test 'the two new events are registered as written' do
      read = OpsLogEvents::EVENTS['admin_profile_read']
      assert_equal 'ADMIN_READ', read[:label]
      assert_equal %w[pc], read[:places]
      assert_equal %w[ok], read[:results]
      assert_equal({ 'profile' => { id: 'profile' } }, read[:detail])
      usb = OpsLogEvents::EVENTS['usb_install_overridden']
      assert_equal 'USB_OVERRIDE', usb[:label]
      assert_equal %w[pc], usb[:places]
      assert_equal %w[ok], usb[:results]
      assert_equal({ 'device' => %w[storage hid] }, usb[:detail])
      assert_nil usb[:save_limit]
      assert_nil usb[:once]
    end

    test 'the profile kind names a held profile and nothing else' do
      game = Struct.new(:scenario_data).new('accountProfiles' => { 'priya' => { 'for' => [] } })
      kind = OpsLogEvents::KINDS['profile']
      assert_equal 'priya', kind[:name].call(game, 'priya')
      assert_nil kind[:name].call(game, 'nobody')
      assert_nil kind[:room].call(game, 'priya')
      assert_nil kind[:name].call(Struct.new(:scenario_data).new({}), 'priya')
    end
  end
end
