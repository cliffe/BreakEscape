# frozen_string_literal: true

require 'test_helper'

module BreakEscape
  # Ops S8c fix: the `object` place kind of the ops log resolves an object id wherever the scenario or
  # the game state really holds it, and still refuses an id that exists nowhere.
  class OpsLogObjectKindTest < ActiveSupport::TestCase
    setup do
      @mission = Mission.create!(name: 'test_simple_success', display_name: 'Object kind', published: true, difficulty_level: 1)
      @player = break_escape_demo_users(:test_user)
      scenario = {
        'startRoom' => 'lobby', 'logSources' => { 'mfa' => { 'title' => 'MFA', 'events' => ['mfa_*'] } },
        'startItemsInInventory' => [{ 'type' => 'key', 'id' => 'start_key', 'name' => 'Start key', 'takeable' => true }],
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'connections' => { 'north' => 'back' },
            'objects' => [
              { 'id' => 'desk_a', 'type' => 'desk', 'name' => 'Desk A',
                'contents' => [{ 'id' => 'nested_box', 'type' => 'safe', 'name' => 'Nested box', 'contents' => [{ 'id' => 'deep_item', 'type' => 'key', 'name' => 'Deep item' }] }] }
            ],
            'npcs' => [{ 'id' => 'gordon', 'displayName' => 'Gordon', 'npcType' => 'person', 'roomId' => 'lobby',
                         'itemsHeld' => [{ 'id' => 'held_case', 'type' => 'briefcase', 'name' => 'Held case', 'takeable' => true,
                                           'contents' => [{ 'id' => 'in_case', 'type' => 'key', 'name' => 'In case' }] }] }]
          },
          'back' => { 'type' => 'room_office', 'connections' => { 'south' => 'lobby' }, 'objects' => [] }
        }
      }
      @game = create_access_game(mission: @mission, player: @player, scenario: scenario)
      @kind = OpsLogEvents::KINDS['object']
    end

    def name_of(id)
      @kind[:name].call(@game, id)
    end
    def room_of(id)
      @kind[:room].call(@game, id)
    end

    test 'a room object and its nested contents resolve' do
      assert_equal 'Desk A', name_of('desk_a')
      assert_equal 'lobby', room_of('desk_a')
      assert_equal 'Nested box', name_of('nested_box')
      assert_equal 'Deep item', name_of('deep_item')
      assert_equal 'lobby', room_of('deep_item')
    end

    test 'an object only in an NPC itemsHeld resolves, and so does what it holds' do
      assert_equal 'Held case', name_of('held_case')
      assert_equal 'In case', name_of('in_case')
      assert_equal 'lobby', room_of('held_case')
    end

    test 'a start inventory item resolves' do
      assert_equal 'Start key', name_of('start_key')
    end

    test 'an object the player carries resolves' do
      @game.player_state['inventory'] = [{ 'id' => 'picked_up', 'type' => 'key', 'name' => 'Picked up' }]
      assert_equal 'Picked up', name_of('picked_up')
    end

    test 'a dropped copy in another room resolves and names that room' do
      @game.player_state['room_states'] = { 'back' => { 'objects_added' => [{ 'id' => 'dropped', 'type' => 'key', 'name' => 'Dropped' }],
                                                        'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} } }
      assert_equal 'Dropped', name_of('dropped')
      assert_equal 'back', room_of('dropped')
    end

    test 'an id that exists nowhere does not resolve' do
      assert_nil name_of('nowhere')
      assert_nil room_of('nowhere')
      assert_raises(OpsLog::Malformed) do
        @game.write_log_row!('mfa_challenge', as: nil, where: { kind: 'object', id: 'nowhere' }, result: 'ok', detail: nil)
      end
    end
  end
end
