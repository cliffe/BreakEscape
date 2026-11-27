require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Step 2b phase B1: author notes ("_"-prefixed property names) are not live. A grant_foothold or
  # give_item an author parked inside a note never widens what the server honours, while a grant
  # inside free data (an esd-pushbutton's minigameData.completionActions) is honoured exactly as it
  # is today, and an id that starts with "_" (an "_annex" room) is not a note. Driven through the
  # real POST /network/implant and POST /network/plant routes.
  class NetworkNotesNotLiveTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario

    BADUSB = { 'id' => 'kit_badusb', 'type' => 'usb_stick', 'name' => 'Keystroke device',
               'takeable' => true, 'usbClass' => 'hid' }.freeze
    NOTE_BOX = { 'id' => 'kit_note_box', 'type' => 'pc', 'sprite' => 'drop_box1', 'name' => 'Note drop box',
                 'takeable' => true, 'rogueDevice' => true }.freeze
    FREE_BOX = { 'id' => 'kit_free_box', 'type' => 'pc', 'sprite' => 'drop_box1', 'name' => 'Free drop box',
                 'takeable' => true, 'rogueDevice' => true }.freeze

    # The NS fixture plus: an "_annex" room whose PC carries a live session grant (an id that starts
    # with "_" is a room id, not a note); a "_draft" note on note_pc holding a session grant (dead);
    # a first-match PC with a note-held copy ahead of the live action; an esd-pushbutton item whose
    # free-data completionActions hold a grant_foothold and two give_items (one rogue device).
    LOGIN = { 'locked' => true, 'lockType' => 'login', 'access' => { 'roles' => ['staff'] } }.freeze

    def notes_scenario
      data = NS.scenario
      data['startItemsInInventory'] = [BADUSB.dup]

      # A give_item granting NOTE_BOX, parked only inside a "_draft" note: never a declared device.
      data['rooms']['lobby']['objects'] << {
        'id' => 'draft_crate', 'type' => 'safe', 'name' => 'Draft crate',
        '_draft' => { 'triggerOnInteract' => [{ 'type' => 'give_item', 'item' => NOTE_BOX.dup }] }
      }

      data['rooms']['_annex'] = {
        'type' => 'room_office', 'connections' => {},
        'objects' => [
          { 'id' => 'annex_pc', 'type' => 'pc', 'name' => 'Annex PC', 'host' => 'HB-ANNEX-01', 'network' => 'office_lan',
            'triggerOnInteract' => [
              { 'type' => 'grant_foothold', 'pc' => 'annex_pc', 'needsSession' => true,
                'needsHeld' => 'kit_badusb', 'name' => 'Annex grant' }
            ] }.merge(LOGIN)
        ]
      }

      data['rooms']['desk_room']['objects'] << {
        'id' => 'note_pc', 'type' => 'pc', 'name' => 'Draft PC', 'host' => 'HB-DRAFT-01', 'network' => 'office_lan',
        '_draft' => {
          'triggerOnInteract' => [
            { 'type' => 'grant_foothold', 'pc' => 'note_pc', 'needsSession' => true,
              'needsHeld' => 'kit_badusb', 'name' => 'Draft grant' }
          ]
        }
      }.merge(LOGIN)

      # The "_draft" note copy sits first in walk order, the live action second: with the skip only
      # the live action survives, so grant_foothold_action_for's first match is the live one.
      data['rooms']['kiosk_room']['objects'] << {
        'id' => 'fm_pc', 'type' => 'pc', 'name' => 'First-match PC', 'host' => 'HB-FM-01', 'network' => 'office_lan',
        '_draft' => {
          'triggerOnInteract' => [
            { 'type' => 'grant_foothold', 'pc' => 'fm_pc', 'needsSession' => true,
              'needsHeld' => 'kit_absent', 'name' => 'Note copy' }
          ]
        },
        'triggerOnInteract' => [
          { 'type' => 'grant_foothold', 'pc' => 'fm_pc', 'needsSession' => true,
            'needsHeld' => 'kit_badusb', 'name' => 'Live copy' }
        ]
      }.merge(LOGIN)

      data['rooms']['desk_room']['objects'] << {
        'id' => 'esd_panel', 'type' => 'esd-pushbutton', 'name' => 'Pushbutton panel',
        'minigameData' => {
          'completionActions' => [
            { 'type' => 'grant_foothold', 'pc' => 'sam_pc', 'needsSession' => true,
              'needsHeld' => 'kit_badusb', 'name' => 'ESD grant' },
            { 'type' => 'give_item', 'item' => FREE_BOX.dup }
          ]
        }
      }
      data
    end

    # The player holds the BadUSB (needsHeld for the session grants) and both rogue boxes, so a
    # plant attempt reaches held_rogue_device: kit_free_box is declared (free data), kit_note_box
    # is not (note only).
    def build(player_state = {})
      inv = [BADUSB.dup, NOTE_BOX.dup, FREE_BOX.dup]
      build_network_game({ 'inventory' => inv }.merge(player_state), notes_scenario)
    end

    def implant(pc_id, shape)
      post game_path('network/implant'), params: { pc_id: pc_id, shape: shape }, as: :json
      response.parsed_body
    end

    def state
      @game.reload.player_state
    end

    def session_at(*pc_ids)
      pc_ids.to_h { |pc| [pc, { 'id' => 'ian', 'via' => 'claim' }] }
    end

    # ---- implant: notes are dead, free data and "_annex" ids are live ----

    test 'the enumerator sees the live and free-data grants but never the note-held ones' do
      build
      pcs = NetworkModel.grant_foothold_actions(@game.scenario_data).map { |a| a[:pc] }.sort
      assert_equal %w[annex_pc fm_pc sam_pc], pcs, 'note_pc (in a _draft) and the note copy are gone'
    end

    test 'a grant_foothold only inside a _draft note is refused as no action' do
      build('sessions' => session_at('note_pc'))
      body = implant('note_pc', 'session')
      assert_response :not_found
      assert_equal 'no_action', body['reason']
      refute state['footholds']&.key?('implant_note_pc')
    end

    test 'a grant in a room whose id starts with _ (an _annex room) is honoured' do
      build('sessions' => session_at('annex_pc'))
      body = implant('annex_pc', 'session')
      assert_response :success, body.inspect
      assert body['success']
      assert_equal 'implant_annex_pc', body['foothold']['id']
      assert state['footholds'].key?('implant_annex_pc')
    end

    test 'a note-held copy ahead of the live action does not win the first match' do
      build('sessions' => session_at('fm_pc'))
      body = implant('fm_pc', 'session')
      assert_response :success, body.inspect
      assert body['success']
      assert_equal 'Live copy', state['footholds']['implant_fm_pc']['name'],
                   'the live action, not the note-held copy, is stored'
    end

    test 'a grant_foothold inside free-data completionActions is honoured' do
      build('sessions' => session_at('sam_pc'))
      body = implant('sam_pc', 'session')
      assert_response :success, body.inspect
      assert body['success']
      assert_equal 'implant_sam_pc', body['foothold']['id']
    end

    # ---- plant: a rogue device declared only in a note is not a device; a free-data one is ----

    test 'a rogue device granted only inside a note is not a declared device' do
      build
      defs = NetworkModel.rogue_device_definitions(@game.scenario_data).map { |d| d[:item]['id'] }
      refute_includes defs, 'kit_note_box', 'the note give_item is not a declared rogue device'
      assert_includes defs, 'kit_free_box', 'the free-data give_item is declared'
      assert_includes defs, 'kit_dropbox', 'the authored room rogue device is declared'
    end

    test 'POST network/plant refuses a rogue device granted only inside a note' do
      build
      body = plant('comms_port', 'kit_note_box')
      assert_response :unprocessable_entity
      assert_equal 'no_device', body['reason']
      refute state['footholds']&.key?(foothold_key('comms_port'))
    end

    test 'POST network/plant honours a rogue device granted in free-data completionActions' do
      build
      body = plant('comms_port', 'kit_free_box')
      assert_response :success, body.inspect
      assert body['success']
    end

    def foothold_key(jack_id)
      "foothold_#{jack_id}"
    end
  end
end
