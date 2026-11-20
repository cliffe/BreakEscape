require 'test_helper'
require 'json'
require 'break_escape/scenario_binding'

module BreakEscape
  # m02 handovers: the security office wall safe (supervisor_wall_safe) is a PIN lock whose code is written
  # nowhere. The only way in is the PIN cracker from the server room field case, and the green/amber pips
  # come from the server only while the player holds one.
  class M02WallSafePipsTest < ActiveSupport::TestCase
    PIN = '5829'.freeze

    def scenario
      @scenario ||= begin
        path = BreakEscape::Engine.root.join('scenarios', 'm02_ransomed_trust', 'scenario.json.erb')
        JSON.parse(BreakEscape::ScenarioBinding.render(path.read, {}))
      end
    end

    def build(inventory)
      create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'security_office', 'unlockedRooms' => %w[security_office],
                        'inventory' => inventory }
      )
    end

    CRACKER = { 'type' => 'pin-cracker', 'id' => 'pin_cracker', 'name' => 'PIN cracker' }.freeze

    test 'the scenario carries the wall safe as a PIN lock' do
      safe = scenario['rooms']['security_office']['objects'].find { |o| o['id'] == 'supervisor_wall_safe' }
      assert safe, 'supervisor_wall_safe is in the security office'
      assert_equal 'pin', safe['lockType']
      assert_equal PIN, safe['requires'].to_s
    end

    test 'no pips without a cracker' do
      game = build([])
      assert_nil game.pin_cracker_feedback('object', 'supervisor_wall_safe', '0000')
      assert_nil game.pin_cracker_feedback('object', 'supervisor_wall_safe', PIN)
    end

    test 'pips with a cracker held, counting right place and right digit elsewhere' do
      game = build([CRACKER])
      assert_equal({ rightPlace: 0, rightNumber: 0 }, game.pin_cracker_feedback('object', 'supervisor_wall_safe', '0000'))
      assert_equal({ rightPlace: 1, rightNumber: 3 }, game.pin_cracker_feedback('object', 'supervisor_wall_safe', '5982'))
      assert_equal({ rightPlace: 4, rightNumber: 0 }, game.pin_cracker_feedback('object', 'supervisor_wall_safe', PIN))
    end

    test 'putting the cracker down takes the pips away again' do
      game = build([CRACKER])
      refute_nil game.pin_cracker_feedback('object', 'supervisor_wall_safe', '1111')
      game.player_state['inventory'] = []
      game.save!
      assert_nil game.pin_cracker_feedback('object', 'supervisor_wall_safe', '1111')
    end
  end
end
