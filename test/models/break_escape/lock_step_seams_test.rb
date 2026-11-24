require 'test_helper'
require 'minitest/mock'

module BreakEscape
  # S8c unit 04: the seams in Game for a second step on any lock. With the concerns as stubs
  # every hook is inert; the hooks themselves are proved with stubs scoped to one object.
  class LockStepSeamsTest < ActiveSupport::TestCase
    def scenario(second_step: false)
      safe = { 'type' => 'safe', 'id' => 'safe1', 'name' => 'Safe', 'locked' => true, 'lockType' => 'pin',
               'requires' => '1234', 'contents' => [{ 'type' => 'notes', 'id' => 'n1', 'name' => 'Notes' }] }
      safe['secondStep'] = { 'kind' => 'push', 'owner' => 'amy', 'extra' => 'x' } if second_step
      vault = { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '9999' }
      vault['secondStep'] = { 'kind' => 'code', 'owner' => 'amy', 'extra' => 'x' } if second_step
      { 'startRoom' => 'hall',
        'rooms' => { 'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' }, 'objects' => [safe] },
                     'vault' => vault } }
    end

    def build_game(second_step: false)
      Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                   scenario_data: scenario(second_step: second_step),
                   player_state: { 'currentRoom' => 'hall', 'unlockedRooms' => ['hall'], 'inventory' => [] })
    end

    test 'the stubs are neutral' do
      g = build_game
      assert_empty g.second_step_ids
      assert_nil g.resolve_unlock_target('safe1')
      assert_not g.behind_closed_step?(%w[a])
      assert g.carried_step_reachable?({ 'id' => 'x' }, [])
      assert_nil g.npc_step_opener_for('vault')
      assert_nil g.lock_step_for('object', 'safe1')
      assert_equal({}, g.lock_steps_map)
      assert_empty g.carried_step_ids
      # unit 13: with nothing gated the gate and the lock actions answer as the stubs did
      assert_nil g.lock_step_gate('object', 'safe1', 'pin')
      assert_nil g.lock_step_gate('door', 'vault', 'pin')
      assert_equal :not_found, g.verify_lock_code!('object', 'safe1', '123456')
      assert_equal :not_found, g.prompt_lock!('object', 'safe1')
      assert_equal :not_found, g.approve_lock!('door', 'vault', number: 1)
      assert_equal :no_phone, g.lock_phone_answer('object', 'safe1', 'amy')
    end

    test 'state defaults are empty and survive a reset as empty' do
      g = build_game
      g.reset_player_state!
      assert_equal({}, g.player_state['lockSteps'])
      assert_equal({}, g.player_state['npcStepGrants'])
    end

    test 'inert: unlock, find and payloads are as before with and without secondStep' do
      [false, true].each do |ss|
        g = build_game(second_step: ss)
        assert_equal 'safe1', g.find_scenario_object('safe1')['id']
        assert g.validate_unlock('object', 'safe1', '1234', 'pin')
        assert_not g.validate_unlock('object', 'safe1', '0000', 'pin')
        room = g.filtered_room_data('hall')
        safe = room['objects'].first
        assert_not safe.key?('contents')
        assert safe['hasContents']
        assert_equal ss, safe.key?('secondStep')
      end
    end

    test 'unlock_object! writes an ordinary id and clear_npc_step_grant! creates no key' do
      g = build_game
      g.unlock_object!('safe1')
      assert_includes g.reload.player_state['unlockedObjects'], 'safe1'
      g.unlock_room!('vault')
      assert_not g.reload.player_state['npcStepGrants'].key?('door:vault')
    end

    test 'unlock_object! refuses a gated id' do
      g = build_game
      g.stub(:second_step_ids, Set['safe1']) do
        g.unlock_object!('safe1')
      end
      assert_not Array(g.reload.player_state['unlockedObjects']).include?('safe1')
    end

    test 'validate_unlock with resolved uses it and refuses behind a closed step or out of reach' do
      g = build_game
      obj = g.find_scenario_object('safe1')
      assert g.validate_unlock('object', 'safe1', '1234', 'pin', resolved: { object: obj, path: [] })
      g.stub(:behind_closed_step?, true) do
        assert_not g.validate_unlock('object', 'safe1', '1234', 'pin', resolved: { object: obj, path: [] })
      end
      g.stub(:carried_step_reachable?, false) do
        assert_not g.validate_unlock('object', 'safe1', '1234', 'pin', resolved: { object: obj, path: [] })
      end
    end

    test 'the already-open shortcut is off for a gated object whose step is not open' do
      g = build_game
      g.player_state['unlockedObjects'] = ['safe1']
      obj = g.find_scenario_object('safe1')
      assert g.validate_unlock('object', 'safe1', 'wrong', 'pin', resolved: { object: obj, path: [] })
      g.stub(:second_step_ids, Set['safe1']) do
        g.stub(:step_object_open?, false) do
          assert_not g.validate_unlock('object', 'safe1', 'wrong', 'pin', resolved: { object: obj, path: [] })
        end
      end
    end

    test 'find_scenario_object goes through resolve_unlock_target when gated ids exist' do
      g = build_game
      sentinel = { 'id' => 'safe1', 'sentinel' => true }
      g.stub(:second_step_ids, Set['safe1']) do
        g.stub(:resolve_unlock_target, { object: sentinel, path: [] }) do
          assert_equal sentinel, g.find_scenario_object('safe1')
        end
        g.stub(:resolve_unlock_target, nil) { assert_nil g.find_scenario_object('safe1') }
      end
    end

    test 'a gated object counts as locked in the room payload until its step is open' do
      g = build_game
      g.stub(:second_step_ids, Set['safe1']) do
        g.stub(:step_object_open?, false) do
          g.scenario_data['rooms']['hall']['objects'][0]['locked'] = false
          safe = g.filtered_room_data('hall')['objects'].first
          assert_not safe.key?('contents')
          assert safe['hasContents']
        end
        g.stub(:step_object_open?, true) do
          safe = g.filtered_room_data('hall')['objects'].first
          assert safe.key?('contents')
        end
      end
    end

    test 'bootstrap copies secondStep kind and owner and the door opener' do
      g = build_game(second_step: true)
      vault = g.filtered_scenario_for_bootstrap['rooms']['vault']
      assert_equal({ 'kind' => 'code', 'owner' => 'amy' }, vault['secondStep'])
      assert_not vault.key?('npcStepOpener')
      g.stub(:npc_step_opener_for, 'amy') do
        assert_equal 'amy', g.filtered_scenario_for_bootstrap['rooms']['vault']['npcStepOpener']
      end
      g.player_state['unlockedRooms'] << 'vault'
      g.stub(:npc_step_opener_for, 'amy') do
        assert_not g.filtered_scenario_for_bootstrap['rooms']['vault'].key?('npcStepOpener')
      end
    end

    test 'carriable_object? refuses a locked object' do
      g = build_game
      assert_not g.carriable_object?(g.find_scenario_object('safe1'))
    end

    test 'only unlock_object! and record_step_open! append to unlockedObjects' do
      root = BreakEscape::Engine.root
      hits = Dir[root.join('{app,lib}/**/*.rb')].flat_map do |f|
        File.readlines(f).each_with_index.select { |l, _| l =~ /unlockedObjects'\]\s*(<<|\+=)|unlockedObjects'\]\.(push|concat)/ }
            .map { |_, i| "#{File.basename(f)}:#{i + 1}" }
      end
      assert_equal %w[game.rb], hits.map { |h| h.split(':').first }.uniq, hits.inspect
      body = File.read(root.join('app/models/break_escape/game.rb'))
      assert_equal 1, body.scan(/unlockedObjects'\]\s*<</).size
    end
  end
end
