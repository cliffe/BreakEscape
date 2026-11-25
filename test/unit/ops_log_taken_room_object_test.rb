# frozen_string_literal: true

require 'test_helper'

module BreakEscape
  # Ops S8c fix (R2-SERVER5): a gated room object the player took is logged where the player has it,
  # as a gated item an NPC held is: no room while carried, the room it lies in once dropped.
  class OpsLogTakenRoomObjectTest < ActiveSupport::TestCase
    setup do
      @mission = Mission.create!(name: 'test_simple_success', display_name: 'Taken', published: true, difficulty_level: 1)
      case_item = { 'id' => 'roomcase', 'type' => 'briefcase', 'name' => 'Room case', 'takeable' => true, 'locked' => true,
                    'lockType' => 'pin', 'requires' => '1', 'secondStep' => { 'kind' => 'push', 'owner' => 'amy' }, 'contents' => [] }
      scenario = { 'startRoom' => 'hall', 'rooms' => {
        'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' }, 'objects' => [case_item, { 'id' => 'plainbox', 'type' => 'safe', 'name' => 'Box' }],
                    'npcs' => [{ 'id' => 'amy' }] },
        'vault' => { 'type' => 'room_office', 'connections' => { 'south' => 'hall' }, 'objects' => [] } } }
      @game = create_access_game(mission: @mission, player: break_escape_demo_users(:test_user), scenario: scenario)
      @kind = OpsLogEvents::KINDS['object']
    end

    def room_of(id)
      @kind[:room].call(@game, id)
    end

    test 'authored in the hall, taken, then dropped in the vault, then gone' do
      assert_equal 'hall', room_of('roomcase')
      item = { 'id' => 'roomcase', 'type' => 'briefcase', 'name' => 'Room case' }
      @game.player_state['inventory'] = [item]
      assert_nil room_of('roomcase'), 'held: no room'
      @game.player_state['inventory'] = []
      @game.player_state['room_states'] = { 'vault' => { 'objects_added' => [item] } }
      assert_equal 'vault', room_of('roomcase'), 'dropped: where it lies'
      assert_equal 'hall', room_of('plainbox'), 'an ungated room object keeps its authored room'
    end
  end
end
