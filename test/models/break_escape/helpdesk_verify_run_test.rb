require 'test_helper'

module BreakEscape
  # tools/playtest/verify-run.rb (S8b unit 17, feature A23): the access section adds, for a game that holds a desk's state or a
  # scenario with a desk, one `accountResets` row (per account with an entry: reset password, reset second step, new password
  # typed, each yes or no) and one `helpdeskTries` row (per entry: the desk id, the account id or `other`, the count and
  # `stopped yes|no`). Words, counts and ids only: never a password, an answer or a username that is not an account.
  class HelpdeskVerifyRunTest < ActiveSupport::TestCase
    SCRIPT = File.expand_path('../../../tools/playtest/verify-run.rb', __dir__)
    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)
    T0 = Time.zone.at(1_800_000_000)
    SECRET = 'Tern-Harbour-41'.freeze

    setup do
      travel_to T0
      @scenario = JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
      @scenario['rooms'].each_value do |room|
        (room['npcs'] || []).each { |npc| npc['creds']['resetPassword'] = SECRET if npc['id'] == 'hana' }
      end
      @scenario['helpdesks'] = { 'it_desk' => { 'npc' => 'ria', 'verify' => 'questions', 'questions' => %w[staff_no], 'resets' => %w[password mfa] } }
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: @scenario, player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby floor store] })
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    def run_script(*extra)
      ARGV.replace(extra + [@game.id.to_s])
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

    def line(out, name)
      out.lines.map(&:strip).find { |l| l.start_with?(name) }
    end

    test 'a fresh game of a scenario with a desk prints both rows with no entries' do
      out = run_script
      assert_match(/accountResets\s+0\z/, line(out, 'accountResets').to_s)
      assert_match(/helpdeskTries\s+0\z/, line(out, 'helpdeskTries').to_s)
    end

    test 'the words and counts come from the saved state, and the stop follows the clock' do
      state = @game.player_state
      state['accountResets'] = { 'hana' => { 'password' => true, 'typed' => true }, 'nia' => { 'mfa' => true }, 'cal' => {} }
      state['helpdeskTries'] = { 'it_desk|hquill' => { 'n' => 3, 'seq' => 1, 'stoppedAt' => T0.to_i - 10 },
                                 'it_desk|nobody' => { 'n' => 2, 'seq' => 2 } }
      @game.save!
      out = run_script
      resets = line(out, 'accountResets').to_s
      assert_includes resets, 'hana reset password yes, reset second step no, new password typed yes'
      assert_includes resets, 'nia reset password no, reset second step yes, new password typed no'
      assert_includes resets, 'cal reset password no, reset second step no, new password typed no'
      tries = line(out, 'helpdeskTries').to_s
      assert_includes tries, 'it_desk hana count 3, stopped yes'
      assert_includes tries, 'it_desk other count 2, stopped no'
      refute_includes out, 'nobody'
      refute_includes out, 'hquill'
      travel_to T0 + HelpdeskModel::DESK_STOP_SECONDS
      assert_includes line(run_script, 'helpdeskTries').to_s, 'it_desk hana count 3, stopped no'
    end

    test 'the --access section prints the same rows and no password ever prints' do
      @game.player_state['accountResets'] = { 'hana' => { 'password' => true } }
      @game.save!
      out = run_script('--access')
      assert_includes line(out, 'accountResets').to_s, 'hana reset password yes'
      refute_includes out, SECRET
      refute_includes run_script, SECRET
    end

    test 'values that are not ids, flags or counts are left out or read as no or zero and nothing raises' do
      @game.player_state['accountResets'] = { 'two words' => { 'password' => true }, 'hana' => 'nope', 'nia' => { 'password' => 'yes' } }
      @game.player_state['helpdeskTries'] = { 'bad desk|x' => { 'n' => 1 }, 'it_desk|hquill' => { 'n' => -3, 'stoppedAt' => 'now' }, 7 => {} }
      @game.save!
      out = run_script
      resets = line(out, 'accountResets').to_s
      assert_includes resets, 'hana reset password no, reset second step no, new password typed no'
      assert_includes resets, 'nia reset password no, reset second step no, new password typed no'
      refute_includes out, 'two words'
      tries = line(out, 'helpdeskTries').to_s
      assert_includes tries, 'it_desk hana count 0, stopped no'
      refute_includes out, 'bad desk'
    end

    test 'a scenario with no desk and a game with no state prints neither row' do
      scenario = JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
      game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                scenario: scenario, player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby floor store] })
      ARGV.replace([game.id.to_s])
      out, = capture_io do
        load SCRIPT
      rescue SystemExit
        nil
      end
      refute_includes out, 'accountResets'
      refute_includes out, 'helpdeskTries'
    end
  end
end
