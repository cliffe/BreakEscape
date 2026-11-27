require 'test_helper'

module BreakEscape
  # F19: an NPC eventMapping with `unlockDoor` lets that NPC open the named door
  # through the 'npc' unlock path, without the met-NPC + `unlockable` rule that
  # ink #unlock_door needs. Other rooms and other NPCs are still refused.
  class NpcMappingUnlockDoorTest < ActiveSupport::TestCase
    setup do
      @game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: {
          'startRoom' => 'hall',
          'rooms' => {
            'hall' => {
              'type' => 'room_office',
              'connections' => { 'north' => 'vault', 'east' => 'annex' },
              'npcs' => [
                { 'id' => 'handler', 'npcType' => 'phone',
                  'eventMappings' => [{ 'eventPattern' => 'global_variable_changed:alarm_off', 'unlockDoor' => 'vault' },
                                      { 'eventPattern' => 'x', 'unlockDoor' => %w[annex] }] },
                { 'id' => 'bystander', 'npcType' => 'person' }
              ]
            },
            'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'k' },
            'annex' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'k' },
            'cellar' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'key', 'requires' => 'k' }
          }
        },
        player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [], 'encounteredNPCs' => [] }
      )
    end

    test 'a mapping naming the room authorises the npc unlock, even unmet' do
      assert @game.validate_unlock('door', 'vault', 'handler', 'npc')
      assert @game.validate_unlock('door', 'annex', 'handler', 'npc'), 'a list form works too'
    end

    test 'a room no mapping names, or another NPC, is still refused' do
      assert_not @game.validate_unlock('door', 'cellar', 'handler', 'npc')
      assert_not @game.validate_unlock('door', 'vault', 'bystander', 'npc')
      assert_not @game.validate_unlock('door', 'vault', 'nobody', 'npc')
    end

    test 'the unlock persists in player state' do
      assert @game.validate_unlock('door', 'vault', 'handler', 'npc')
      @game.unlock_room!('vault')
      assert_includes @game.reload.player_state['unlockedRooms'], 'vault'
    end
  end
end
