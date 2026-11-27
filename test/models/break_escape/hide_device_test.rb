require 'test_helper'
require_relative '../../support/hiding_scenario'

module BreakEscape
  # Hiding a device in a plant, at the model level (docs/achitechture/PLANT_HIDING_PLAN.md,
  # sections 7 and 11): Game#hide_device!, hidden_devices_for_client, the old plant path's
  # refusal and the proof rule.
  class HideDeviceModelTest < ActiveSupport::TestCase
    include HidingScenario

    DECOR_ID = 'reception_plant-large12-top-ani1_77'.freeze

    def build_game(scenario = hiding_scenario, inventory: [kit_entry], unlocked: ['reception'])
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => unlocked, 'inventory' => inventory }
      )
    end

    def state
      @game.reload.player_state.deep_dup
    end

    def planted
      Array(@game.reload.player_state['plantedItems'])
    end

    def held_ids
      Array(@game.reload.player_state['inventory']).map { |i| i['id'] }
    end

    def refused(spot, reason)
      before = state
      result = @game.hide_device!('kit_rogue_ap', spot)
      assert_equal false, result[:ok], "#{spot} should be refused"
      assert_equal reason, result[:reason], spot
      assert_equal before, state, "#{spot}: player_state unchanged"
      result
    end

    test 'success on a scenario plant and on a decor plant appends one entry and removes the held entry' do
      build_game
      result = @game.hide_device!('kit_rogue_ap', 'pot_a')
      assert_equal true, result[:ok]
      assert_equal({ 'item' => 'kit_rogue_ap', 'on' => 'pot_a', 'room' => 'reception' }, result[:hidden])
      assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => 'pot_a' }], planted
      assert_empty held_ids

      build_game
      assert_equal true, @game.hide_device!('kit_rogue_ap', DECOR_ID)[:ok]
      assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => DECOR_ID }], planted
    end

    test 'the held entry is found by scenarioData.id even when its top-level id differs' do
      build_game(inventory: [kit_entry(top_id: 'inv_7'), { 'id' => 'other', 'type' => 'key', 'scenarioData' => { 'id' => 'other' } }])
      assert_equal true, @game.hide_device!('kit_rogue_ap', 'pot_a')[:ok]
      assert_equal ['other'], held_ids, 'only the matched entry left the tray'
    end

    test 'the hide saves once' do
      build_game
      count = 0
      @game.define_singleton_method(:save!) { |*a| count += 1; super(*a) }
      @game.hide_device!('kit_rogue_ap', 'pot_a')
      assert_equal 1, count
    end

    test 'repeating the hide on the same spot answers success with the same entry and changes nothing' do
      build_game
      first = @game.hide_device!('kit_rogue_ap', 'pot_a')
      before = state
      again = @game.hide_device!('kit_rogue_ap', 'pot_a')
      assert_equal true, again[:ok]
      assert_equal first[:hidden], again[:hidden]
      assert_equal before, state
    end

    test 'hiding again on another spot refuses already_hidden and carries the existing entry' do
      build_game
      @game.hide_device!('kit_rogue_ap', 'pot_a')
      before = state
      result = @game.hide_device!('kit_rogue_ap', DECOR_ID)
      assert_equal false, result[:ok]
      assert_equal 'already_hidden', result[:reason]
      assert_equal({ 'item' => 'kit_rogue_ap', 'on' => 'pot_a', 'room' => 'reception' }, result[:hidden])
      assert_equal before, state
    end

    test 'every refusal row leaves the device in the tray' do
      build_game
      refused('bin_a_missing', 'not_a_spot') # not a scenario object, not a decor shape
      refused('desk_a', 'not_a_spot')         # not a plant
      refused('pot_b', 'not_a_spot')          # hidingSpot false
      refused('reception_plant-large13_34', 'not_a_spot') # excluded
      refused('comms_pot', 'not_a_spot')      # room not in hideable.rooms
      refused('comms_plant-large6_1', 'not_a_spot') # decor in a room not allowed
      refused('reception_notes_plantlog1_9', 'not_a_spot')
      refused('reception_plant-large-displacement1_9', 'not_a_spot')
      refused('reception_plant-large4_x', 'not_a_spot')
      refused('x' * 129, 'not_a_spot')
      refused('reception_plant-large13_34 ', 'not_a_spot')
      refused('reception_plant!_3', 'not_a_spot')
      assert_equal ['kit_rogue_ap'], held_ids
    end

    test 'a non-hideable item is refused not_hideable' do
      build_game
      before = state
      result = @game.hide_device!('captures_terminal', 'pot_a')
      assert_equal 'not_hideable', result[:reason]
      assert_equal before, state
    end

    test 'a device that is not held is refused not_held, and so is a forged clone' do
      build_game
      @game.player_state['inventory'] = []
      @game.save!
      refused('pot_a', 'not_held')
      @game.player_state['inventory'] = [kit_entry.merge('clientAdded' => true)]
      @game.save!
      refused('pot_a', 'not_held')
    end

    test 'a locked room is refused room_locked' do
      build_game(unlocked: [])
      @game.scenario_data['startRoom'] = 'comms'
      @game.save!
      refused('pot_a', 'room_locked')
    end

    test 'a spot list limits the plants and a scenario plant outside it is refused' do
      kit = KIT.deep_dup
      kit['hideable']['spots'] = ['pot_a']
      build_game(hiding_scenario(kit: kit))
      refused(DECOR_ID, 'not_a_spot')
      refused('swap_pot', 'not_a_spot')
      assert_equal true, @game.hide_device!('kit_rogue_ap', 'pot_a')[:ok]
    end

    test 'a scenario plant is read by its authored sprite, not a variant texture' do
      build_game
      assert_equal true, @game.hide_device!('kit_rogue_ap', 'swap_pot')[:ok]
    end

    test 'hidingSpot true makes a non-plant a spot' do
      build_game
      assert_equal true, @game.hide_device!('kit_rogue_ap', 'bin_a')[:ok]
    end

    test 'a second hideable item cannot take an occupied spot' do
      second = KIT.deep_dup.merge('id' => 'kit_two', 'name' => 'Second')
      second['hideable'] = second['hideable'].merge('device' => nil)
      data = hiding_scenario
      data['startItemsInInventory'] << second
      build_game(data, inventory: [kit_entry, { 'id' => 'kit_two', 'type' => 'rogue_ap', 'scenarioData' => { 'id' => 'kit_two' } }])
      assert_equal true, @game.hide_device!('kit_rogue_ap', 'pot_a')[:ok]
      result = @game.hide_device!('kit_two', 'pot_a')
      assert_equal 'occupied', result[:reason]
      assert_equal ['kit_two'], held_ids
    end

    test 'forged decor id with the right shape records the same plant as an honest hide and serves nothing extra' do
      forged_id = 'reception_plant-large99_999'
      proof = { 'planted' => 'kit_rogue_ap' }
      build_game
      assert_equal false, @game.capture_proof_holds?(proof)
      assert_equal true, @game.hide_device!('kit_rogue_ap', forged_id)[:ok]
      forged_entry = planted.first
      forged_holds = [@game.capture_proof_holds?(proof), @game.capture_proof_holds?(proof.merge('on' => 'pot_a'))]

      build_game
      @game.hide_device!('kit_rogue_ap', DECOR_ID)
      honest_entry = planted.first
      honest_holds = [@game.capture_proof_holds?(proof), @game.capture_proof_holds?(proof.merge('on' => 'pot_a'))]
      assert_equal honest_entry.keys, forged_entry.keys
      assert_equal honest_entry.except('on'), forged_entry.except('on')
      assert_equal honest_holds, forged_holds
      assert_equal [true, false], forged_holds
    end

    test 'HidingSpots.item_defs finds the kit as a start item, a room object, nested contents and an NPC itemsHeld' do
      kit = KIT.deep_dup
      as_start = HidingSpots.item_defs('startItemsInInventory' => [kit])
      as_room = HidingSpots.item_defs('rooms' => { 'r' => { 'objects' => [kit] } })
      nested = HidingSpots.item_defs('rooms' => { 'r' => { 'objects' => [{ 'id' => 'a', 'contents' => [{ 'id' => 'b', 'contents' => [kit] }] }] } })
      held = HidingSpots.item_defs('rooms' => { 'r' => { 'npcs' => [{ 'id' => 'n', 'itemsHeld' => [kit] }] } })
      [as_start, as_room, nested, held].each { |defs| assert_equal ['kit_rogue_ap'], defs.keys }
      assert_equal ['reception'], as_start['kit_rogue_ap']['rooms']
      assert_empty HidingSpots.item_defs('startItemsInInventory' => [{ 'id' => 'x' }])
    end

    test 'record_planted_item! records nothing for a hideable item, even on an authored object that takes it' do
      taker = { 'id' => 'taker', 'type' => 'pc', 'requiresItem' => 'kit_rogue_ap', 'consumesItem' => true,
                'triggerOnInteract' => [{ 'type' => 'set_global', 'key' => 'k', 'value' => true }] }
      build_game(hiding_scenario(extra_objects: [taker]))
      before = state
      assert_equal false, @game.record_planted_item!('kit_rogue_ap', 'taker')
      assert_equal before, state
    end

    test 'carriable_object? is false for an object with hiddenWith' do
      build_game
      assert_equal false, @game.send(:carriable_object?, { 'id' => 'c', 'type' => 'pc', 'hiddenWith' => 'kit_rogue_ap' })
      assert_equal true, @game.send(:carriable_object?, { 'id' => 'c', 'type' => 'pc' })
    end

    test 'capture_proof_holds? is false before and true after; with on naming another spot it stays false' do
      build_game
      refute @game.capture_proof_holds?('planted' => 'kit_rogue_ap')
      @game.hide_device!('kit_rogue_ap', 'pot_a')
      assert @game.capture_proof_holds?('planted' => 'kit_rogue_ap')
      assert @game.capture_proof_holds?('planted' => 'kit_rogue_ap', 'on' => 'pot_a')
      refute @game.capture_proof_holds?('planted' => 'kit_rogue_ap', 'on' => 'swap_pot')
    end

    test 'hidden_devices_for_client returns the entry with its room and ignores non-hideable plant records' do
      build_game
      assert_empty @game.hidden_devices_for_client
      @game.player_state['plantedItems'] = [{ 'item' => 'some_card', 'on' => 'pot_a' }]
      @game.save!
      assert_empty @game.hidden_devices_for_client
      @game.hide_device!('kit_rogue_ap', DECOR_ID)
      assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => DECOR_ID, 'room' => 'reception' }], @game.hidden_devices_for_client
    end

    test 'a record whose spot no longer resolves takes the first room in hideable.rooms' do
      build_game
      @game.player_state['plantedItems'] = [{ 'item' => 'kit_rogue_ap', 'on' => 'rogue_ap_spot' }]
      @game.save!
      assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => 'rogue_ap_spot', 'room' => 'reception' }], @game.hidden_devices_for_client
      result = @game.hide_device!('kit_rogue_ap', 'pot_a')
      assert_equal 'already_hidden', result[:reason]
      assert_equal 'reception', result[:hidden]['room']
    end

    test 'hideables_for_client carries the static definition and device data, without onHidden' do
      build_game
      defn = @game.hideables_for_client['kit_rogue_ap']
      assert_equal ['reception'], defn['rooms']
      assert_equal 'planted_rogue_ap', defn['device']
      refute defn.key?('onHidden')
      # The hideable's only room is the one the device is authored in: its console fields come
      # from the room answer, so the bootstrap does not repeat them (R1 m2).
      refute defn.key?('deviceData')
    end

    test 'deviceData is sent when the hideable has two rooms and the device is hidden in the non-authored one' do
      scn = hiding_scenario
      scn['startItemsInInventory'][0]['hideable']['rooms'] = %w[reception comms]
      build_game(scn, unlocked: %w[reception comms])
      assert_equal true, @game.hide_device!('kit_rogue_ap', 'comms_pot')[:ok]
      assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => 'comms_pot', 'room' => 'comms' }], @game.hidden_devices_for_client
      out = @game.hideables_for_client['kit_rogue_ap']['deviceData']
      assert_equal 'planted_rogue_ap', out['id']
      assert out['wifiTwin']
      assert_equal 'Ledgerwell-Staff', out['apScan'][0]['ssid']
      refute out.key?('hiddenWith'), 'only the console fields'
      assert_empty out.keys - CaptureProofs::DEVICE_DATA_FIELDS, 'no key outside the whitelist'
    end

    test 'a forged clone ahead of the real kit is skipped and the real kit is hidden' do
      forged = kit_entry.merge('clientAdded' => true)
      build_game(inventory: [forged, kit_entry(top_id: 'real_kit')])
      assert_equal true, @game.hide_device!('kit_rogue_ap', 'pot_a')[:ok]
      assert_equal ['kit_rogue_ap'], held_ids, 'the forged clone stays, the real kit (id real_kit) left'
      assert_equal [{ 'item' => 'kit_rogue_ap', 'on' => 'pot_a' }], planted
    end
  end
end
