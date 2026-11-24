require 'test_helper'
require_relative '../../scripts/validate_mfa'

module BreakEscape
  # R1-S3: a number-matching PC whose admitted owners cannot be asked is a "nobody passes" warning
  # whatever the owner's approval habit, and the warning goes when a phone can be held.
  class ValidateMfaNumberMatchTest < ActiveSupport::TestCase
    PATH = File.expand_path('../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)
    WARNING = 'nobody passes this push step'.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(PATH, encoding: 'UTF-8')))
    end

    def nia(data)
      data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'nia' }
    end

    def warnings_for(data, pc)
      check_mfa(data).select { |l| l.include?(WARNING) && l.include?("PC '#{pc}'") }
    end

    def room_of_pc(data, pc)
      data['rooms'].values.find { |r| Array(r['objects']).any? { |o| o['id'] == pc } }
    end

    test 'the shipped scenario has no such warning' do
      assert_empty warnings_for(scenario, 'match_pc')
    end

    test 'number matching, careless owner, no phone to hold: warns' do
      data = scenario
      nia(data)['awareness'] = 'low'
      nia(data)['itemsHeld'] = []
      assert_equal 1, warnings_for(data, match_pc_id(data)).size
    end

    test 'number matching, careless owner, a phone lying in the room: no warning' do
      data = scenario
      nia(data)['awareness'] = 'low'
      nia(data)['itemsHeld'] = []
      room_of_pc(data, match_pc_id(data))['objects'] << { 'id' => 'nia_loose', 'type' => 'phone_friendface',
                                                          'name' => 'Phone', 'owner' => 'nia', 'takeable' => true }
      assert_empty warnings_for(data, match_pc_id(data))
    end

    test 'plain push with a careless owner is still not a warning' do
      data = scenario
      pc = data['rooms'].values.flat_map { |r| Array(r['objects']) }.find { |o| o['policy'] == 'push_gate' }
      owner = pc['owner']
      npc = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == owner }
      npc['awareness'] = 'low'
      assert_empty warnings_for(data, pc['id'])
    end

    def match_pc_id(data)
      data['rooms'].values.flat_map { |r| Array(r['objects']) }.find { |o| o['policy'] == 'match_gate' }['id']
    end
  end
end
