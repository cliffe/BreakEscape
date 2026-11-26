require 'test_helper'

module BreakEscape
  # tools/playtest/verify-run.rb: ops-layer work counts as progress in the plain verdict.
  class VerifyRunOpsProgressTest < ActiveSupport::TestCase
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

    def record(state)
      @game.player_state.merge!(state)
      @game.save!
      @game.update_columns(updated_at: @game.created_at + 60)
    end

    test 'a game with only sign-ins stays bootstrap only' do
      record('signedInPcs' => ['door_box'], 'sessions' => { 'door_box' => { 'level' => 1 } })
      assert_includes run_script, 'VERDICT: BOOTSTRAP ONLY'
    end

    test 'a sweep and a scan count as progress' do
      record('opsDiscovered' => { 'networks' => %w[office_lan], 'hosts' => %w[a b], 'services' => [] })
      out = run_script
      assert_includes out, 'VERDICT: progress recorded'
      assert_includes out, '1 ops networks swept, 2 ops hosts discovered'
      assert_not_includes out, 'ops services checked'
    end

    test 'findings, footholds and log rows count' do
      record('opsFindings' => { 'f1' => {} }, 'gainedFootholds' => %w[h1], 'opsLog' => { 'office_lan' => [{}, {}], 'x' => 'bad' })
      out = run_script
      assert_match(/VERDICT: progress recorded.*1 ops findings held.*1 footholds gained.*2 ops log rows/, out)
    end

    test 'malformed ops values do not crash or count' do
      record('opsDiscovered' => 'x', 'opsFindings' => [1], 'gainedFootholds' => 'y', 'opsLog' => [1])
      assert_includes run_script, 'VERDICT: BOOTSTRAP ONLY'
    end
  end
end
