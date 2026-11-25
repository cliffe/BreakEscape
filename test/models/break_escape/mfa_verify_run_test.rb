require 'test_helper'

module BreakEscape
  # tools/playtest/verify-run.rb (S8a unit 23, feature A22): the access section adds, for a scenario with a second step or a
  # game holding its state, one row per account (started, wrong, used, closed yes or no), one per owner (the prompt count) and
  # one per sign-in PC (`pending <kind>` or `pending none`). Words, counts and ids only: never a code, a number or a nonce.
  class MfaVerifyRunTest < ActiveSupport::TestCase
    SCRIPT = File.expand_path('../../../tools/playtest/verify-run.rb', __dir__)
    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)
    T0 = Time.zone.at(1_800_000_000)

    setup do
      travel_to T0
      @scenario = JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
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

    def reload
      @game = Game.find(@game.id)
    end

    test 'a fresh game of the feature scenario prints every sign-in PC as pending none and no account or prompt' do
      out = run_script
      assert_match(/mfaAccounts\s+0\z/, line(out, 'mfaAccounts').to_s)
      assert_match(/mfaPrompts\s+0\z/, line(out, 'mfaPrompts').to_s)
      pending = line(out, 'mfaPending').to_s
      assert_includes pending, 'code_pc1 pending none'
      assert_includes pending, 'push_pc pending none'
      assert_includes pending, 'match_pc pending none'
      assert_includes pending, 'plain_pc pending none'
      refute_match(/pending (push|code|push_number_match)/, pending)
    end

    test 'the counts, the closed word and the pending kinds come from the saved state' do
      state = @game.player_state
      state['mfaAccounts'] = { 'hana' => { 'started' => 3, 'wrong' => 2, 'used' => 29_999_990, 'closedAt' => T0.to_i - 10, 'nonce' => 7731 },
                               'ines' => { 'started' => 1 },
                               'cal' => { 'started' => 2, 'wrong' => 30, 'closedAt' => T0.to_i - 600 } }
      state['mfaPrompts'] = { 'cal' => 2, 'nia' => 0 }
      state['mfaPending'] = { 'code_pc1' => { 'id' => 'code_pc1', 'kind' => 'code', 'n' => 0, 'tries' => 1, 'nonce' => 7731,
                                              'at' => T0.to_i - 5, 'last' => 0, 'npcId' => 'hana' },
                              'push_pc' => { 'kind' => 'push', 'nonce' => 4411 },
                              'match_pc' => { 'kind' => 'push_number_match', 'nonce' => 5512 } }
      @game.save!
      out = run_script
      accounts = line(out, 'mfaAccounts').to_s
      assert_includes accounts, 'cal started 2, wrong 30, used no, closed no'
      assert_includes accounts, 'hana started 3, wrong 2, used yes, closed yes'
      assert_includes accounts, 'ines started 1, wrong 0, used no, closed no'
      assert_match(/mfaAccounts\s+3:/, accounts)
      assert_match(/mfaPrompts\s+2: cal 2; nia 0\z/, line(out, 'mfaPrompts').to_s)
      pending = line(out, 'mfaPending').to_s
      assert_includes pending, 'code_pc1 pending code'
      assert_includes pending, 'push_pc pending push'
      assert_includes pending, 'match_pc pending push_number_match'
      assert_includes pending, 'plain_pc pending none'
      # a stored window, nonce, time or tries count never prints
      %w[29999990 7731 4411 5512].each { |value| refute_includes out, value }
    end

    test 'the closed word follows the clock' do
      @game.player_state['mfaAccounts'] = { 'hana' => { 'started' => 1, 'wrong' => 30, 'closedAt' => T0.to_i } }
      @game.save!
      assert_includes line(run_script, 'mfaAccounts').to_s, 'closed yes'
      travel_to T0 + (MfaModel::CODE_CLOSED_SECONDS + 1)
      assert_includes line(run_script, 'mfaAccounts').to_s, 'closed no'
    end

    test 'values that are not ids, counts or kinds are left out or read as zero and nothing raises' do
      @game.player_state['mfaAccounts'] = { 'two words' => { 'started' => 1 }, 'hana' => 'nope', 'ines' => { 'started' => -4, 'wrong' => '9', 'used' => 'x' },
                                            "line\nbreak" => {} }
      @game.player_state['mfaPrompts'] = { 'cal' => 'many', 'a b' => 3 }
      @game.player_state['mfaPending'] = { 'code_pc1' => 'nope', 'push_pc' => { 'kind' => 'a secret kind' }, 'bad pc' => { 'kind' => 'code' } }
      @game.save!
      out = run_script
      accounts = line(out, 'mfaAccounts').to_s
      assert_includes accounts, 'ines started 0, wrong 0, used no, closed no'
      assert_includes accounts, 'hana started 0, wrong 0, used no, closed no'
      assert_match(/mfaPrompts\s+1: cal 0\z/, line(out, 'mfaPrompts').to_s)
      pending = line(out, 'mfaPending').to_s
      assert_includes pending, 'code_pc1 pending none'
      assert_includes pending, 'push_pc pending none'
      refute_includes out, 'secret kind'
      refute_includes out, 'two words'
      refute_includes out, 'bad pc'
    end

    test 'a real sign-in, wrong codes and prompts show their counts and never a code or a number' do
      @game.attempt_login!('code_pc1', 'hquill', 'Quillmere-Hana-31')
      reload
      2.times { reload.verify_sign_in_code!('code_pc1', '000000') }
      reload.attempt_login!('push_pc', 'cmoss', 'Mossbank-Cal-12')
      reload.prompt_sign_in!('push_pc')
      reload.attempt_login!('match_pc', 'nfaraday', 'Faradale-Nia-58')
      out = run_script
      accounts = line(out, 'mfaAccounts').to_s
      assert_includes accounts, 'hana started 1, wrong 2, used no, closed no'
      assert_includes accounts, 'cal started 1, wrong 0, used no, closed no'
      assert_includes accounts, 'nia started 1, wrong 0, used no, closed no'
      assert_includes line(out, 'mfaPrompts').to_s, 'cal 1'
      pending = line(out, 'mfaPending').to_s
      assert_includes pending, 'code_pc1 pending code'
      assert_includes pending, 'push_pc pending push'
      assert_includes pending, 'match_pc pending push_number_match'
      key = Rails.application.key_generator.generate_key('break_escape/mfa')
      base = Time.current.to_i / MfaModel::STEP_SECONDS
      %w[hana_device ines_device].product((base - 3..base + 1).to_a).each do |device, window|
        refute_includes out, MfaModel.code(key, @game.id, device, window)
      end
      number = reload.player_state['mfaPending']['match_pc']
      numbers = MfaModel.numbers(key, @game.id, 'match_pc', 'nia', number['nonce'])
      numbers[:choices].each { |n| refute_match(/\b#{n}\b/, out.lines.grep(/mfa/).join) }
    end

    test 'the --access section prints the same rows' do
      @game.player_state['mfaPrompts'] = { 'cal' => 4 }
      @game.save!
      assert_includes line(run_script('--access'), 'mfaPrompts').to_s, 'cal 4'
    end

    test 'a scenario with no second step and no state prints none of the rows' do
      scenario = { 'startRoom' => 'lobby', 'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {}, 'objects' => [] } } }
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario)
      out = run_script('--access')
      refute_includes out, 'mfaAccounts'
      refute_includes out, 'mfaPending'
      refute_includes out, 'mfaPrompts'
    end
  end
end
