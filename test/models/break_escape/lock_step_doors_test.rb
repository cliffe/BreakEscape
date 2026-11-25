require 'test_helper'

module BreakEscape
  # S8c unit 17: the NPC grant on a gated door.
  class LockStepDoorsModelTest < ActiveSupport::TestCase
    def scenario(gated: true)
      vault = { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '9999' }
      vault['secondStep'] = { 'kind' => 'push', 'owner' => 'amy' } if gated
      { 'startRoom' => 'hall',
        'rooms' => { 'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' }, 'objects' => [] },
                     'vault' => vault } }
    end

    def build_game(gated: true)
      Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                   scenario_data: scenario(gated: gated),
                   player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] })
    end

    test 'write, read and persist' do
      g = build_game
      assert_nil g.npc_step_opener_for('vault')
      g.note_npc_step_grant!('vault', 'amy')
      assert_equal 'amy', g.npc_step_opener_for('vault')
      assert_equal({ 'door:vault' => 'amy' }, g.reload.player_state['npcStepGrants'])
      assert_equal 'amy', g.npc_step_opener_for('vault')
    end

    test 'clear removes the grant and never creates the key' do
      g = build_game
      g.player_state.delete('npcStepGrants')
      assert_nil g.clear_npc_step_grant!('vault')
      assert_not g.player_state.key?('npcStepGrants')
      g.note_npc_step_grant!('vault', 'amy')
      g.clear_npc_step_grant!('vault')
      assert_nil g.npc_step_opener_for('vault')
      assert_equal({}, g.player_state['npcStepGrants'])
    end

    test 'opening the room clears the grant and the opener is nil for an unlocked room' do
      g = build_game
      g.note_npc_step_grant!('vault', 'amy')
      g.note_npc_step_grant!('other', 'bob')
      g.unlock_room!('vault')
      grants = g.reload.player_state['npcStepGrants']
      assert_not grants.key?('door:vault')
      assert_equal 'bob', grants['door:other']
      assert_nil g.npc_step_opener_for('vault')
      # a grant still stored for an unlocked room is never reported
      g.player_state['npcStepGrants']['door:vault'] = 'amy'
      assert_nil g.npc_step_opener_for('vault')
      assert_nil g.npc_step_opener_for('hall')
    end

    test 'a scenario with no gated door creates nothing' do
      g = build_game(gated: false)
      assert_nil g.npc_step_opener_for('vault')
      g.clear_npc_step_grant!('vault')
      g.unlock_room!('vault')
      assert_equal({}, g.reload.player_state['npcStepGrants'])
    end

    test 'blank ids write nothing' do
      g = build_game
      assert_nil g.note_npc_step_grant!('vault', '')
      assert_nil g.note_npc_step_grant!('', 'amy')
      assert_equal({}, g.player_state['npcStepGrants'])
    end

    test 'the bootstrap field appears and goes' do
      g = build_game
      assert_not g.filtered_scenario_for_bootstrap['rooms']['vault'].key?('npcStepOpener')
      g.note_npc_step_grant!('vault', 'amy')
      assert_equal 'amy', g.filtered_scenario_for_bootstrap['rooms']['vault']['npcStepOpener']
      g.unlock_room!('vault')
      assert_not g.filtered_scenario_for_bootstrap['rooms']['vault'].key?('npcStepOpener')
    end
  end
end
