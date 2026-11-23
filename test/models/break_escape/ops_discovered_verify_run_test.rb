require 'test_helper'

module BreakEscape
  # tools/playtest/verify-run.rb (OPS_CORE_PLAN.md 11.4, S1): `opsDiscovered` joins the access keys
  # and prints one line, ids in id order, nothing that is not an id.
  class OpsDiscoveredVerifyRunTest < ActiveSupport::TestCase
    SCRIPT = File.expand_path('../../../tools/playtest/verify-run.rb', __dir__)

    setup do
      scenario = { 'startRoom' => 'lobby', 'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {}, 'objects' => [] } } }
      @game = create_access_game(mission: Mission.create!(name: 'test_simple_success', display_name: 'V', published: true, difficulty_level: 1),
                                 player: break_escape_demo_users(:test_user), scenario: scenario)
    end

    def run_script
      ARGV.replace([@game.id.to_s])
      out, = capture_io do
        verbose = $VERBOSE
        $VERBOSE = nil
        load SCRIPT
      rescue SystemExit
        nil
      ensure
        $VERBOSE = verbose
      end
      out
    end

    def opsline(out)
      out.lines.map(&:strip).find { |l| l.start_with?('opsDiscovered') }
    end

    test 'a game with nothing recorded prints the access line without the ops line' do
      assert_includes run_script, 'nothing recorded'
    end

    test 'swept networks and scanned hosts print in id order' do
      @game.player_state['opsDiscovered'] = { 'networks' => %w[plant_lan office_lan], 'hosts' => %w[printer01 doorctl01] }
      @game.save!
      out = run_script
      assert_includes out, 'access model'
      assert_match(/opsDiscovered\s+2: networks office_lan plant_lan; hosts doorctl01 printer01/, opsline(out).to_s)
    end

    test 'an empty list is left out of the line' do
      @game.player_state['opsDiscovered'] = { 'networks' => %w[office_lan], 'hosts' => [] }
      @game.save!
      assert_match(/opsDiscovered\s+1: networks office_lan\z/, opsline(run_script).to_s)
    end

    test 'a malformed record prints nothing and does not raise' do
      @game.player_state['opsDiscovered'] = { 'networks' => 'office_lan', 'hosts' => [nil, { 'a' => 1 }] }
      @game.player_state['sessions'] = { 'pc' => { 'id' => 'x' } }
      @game.save!
      assert_match(/opsDiscovered\s+0/, opsline(run_script).to_s)
    end
  end
end
