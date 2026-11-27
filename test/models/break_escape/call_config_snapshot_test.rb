require 'test_helper'

module BreakEscape
  # A game snapshots scenario_data at start, but ink is served live. When a contact
  # gains a `call`/`callLabel` entry (and its ink gains the matching #place_call) after
  # a game has begun, that game's snapshot has no entry to dial and the placed call
  # soft-locks. filtered_room_data overlays the current scenario's call config so the
  # in-progress game can still place the call. See Mission#current_call_configs.
  class CallConfigSnapshotTest < ActiveSupport::TestCase
    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
    end

    # --- Mission.call_configs_from (pure extraction) --------------------------

    test 'call_configs_from extracts call and callLabel per NPC' do
      data = {
        'rooms' => {
          'office' => {
            'npcs' => [
              { 'id' => 'agent', 'call' => [{ 'knot' => 'closing', 'button' => false }],
                'callLabel' => 'Secure line' },
              { 'id' => 'plain', 'displayName' => 'No Phone' }
            ]
          }
        }
      }

      configs = Mission.call_configs_from(data)

      assert_equal [{ 'knot' => 'closing', 'button' => false }], configs['agent']['call']
      assert_equal 'Secure line', configs['agent']['callLabel']
      # An NPC that defines neither is not in the map at all
      assert_nil configs['plain']
    end

    test 'call_configs_from keeps callLabel even without a call entry' do
      data = { 'rooms' => { 'r' => { 'npcs' => [{ 'id' => 'n', 'callLabel' => 'Line' }] } } }
      configs = Mission.call_configs_from(data)
      assert_equal 'Line', configs['n']['callLabel']
      refute configs['n'].key?('call')
    end

    test 'call_configs_from keeps the first record for a repeated id' do
      data = {
        'rooms' => {
          'a' => { 'npcs' => [{ 'id' => 'dup', 'callLabel' => 'First' }] },
          'b' => { 'npcs' => [{ 'id' => 'dup', 'callLabel' => 'Second' }] }
        }
      }
      configs = Mission.call_configs_from(data)
      assert_equal 'First', configs['dup']['callLabel']
    end

    # --- filtered_room_data overlay -------------------------------------------

    # Seed Mission#current_call_configs for the game's own Mission instance. The cache
    # is keyed on the real template mtime, so this stands in as if just computed.
    def stub_current_calls(configs)
      mtime = File.mtime(@mission.scenario_path.join('scenario.json.erb'))
      Mission.call_config_cache[@mission.name] = { mtime: mtime, configs: configs.freeze }
    end

    def game_with(npc)
      data = {
        'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'type' => 'room_office',
            'connections' => {},
            'locked' => false,
            'npcs' => [npc]
          }
        }
      }
      game = Game.new(mission: @mission, player: @player, scenario_data: data)
      game.save(validate: false)
      game
    end

    test 'filtered_room_data adds call config missing from the snapshot' do
      # Snapshot predates the call entry: the NPC has none.
      game = game_with('id' => 'agent_0x99', 'displayName' => 'Agent HaX', 'npcType' => 'phone')
      stub_current_calls('agent_0x99' => {
                           'call' => [{ 'knot' => 'closing_debrief', 'button' => false }],
                           'callLabel' => 'SAFETYNET secure line'
                         })

      npc = game.filtered_room_data('office')['npcs'].first

      assert_equal [{ 'knot' => 'closing_debrief', 'button' => false }], npc['call']
      assert_equal 'SAFETYNET secure line', npc['callLabel']
    end

    test 'filtered_room_data overrides a stale snapshot call with the current one' do
      game = game_with('id' => 'agent_0x99',
                        'call' => [{ 'knot' => 'old_knot' }],
                        'callLabel' => 'Old label')
      stub_current_calls('agent_0x99' => {
                           'call' => [{ 'knot' => 'closing_debrief', 'button' => false }],
                           'callLabel' => 'New label'
                         })

      npc = game.filtered_room_data('office')['npcs'].first

      assert_equal 'closing_debrief', npc['call'].first['knot']
      assert_equal 'New label', npc['callLabel']
    end

    test 'filtered_room_data leaves an NPC alone when the current scenario has no call for it' do
      game = game_with('id' => 'bystander', 'displayName' => 'Bystander')
      stub_current_calls('someone_else' => { 'callLabel' => 'Line' })

      npc = game.filtered_room_data('office')['npcs'].first

      refute npc.key?('call')
      refute npc.key?('callLabel')
    end
  end
end
