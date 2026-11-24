require 'test_helper'

module BreakEscape
  # tools/playtest/verify-run.rb (OPS_PRIVILEGE_ACCOUNTS_PLAN.md S5a, unit 16): every session line of the access section
  # also prints the level the server works out now (`level admin`, `level user` or `level none`), beside the stored
  # `access` it already printed. Words and ids only. Sessions are held by hand in the real test_ops_privilege scenario.
  class PrivilegeVerifyRunTest < ActiveSupport::TestCase
    SCRIPT = File.expand_path('../../../tools/playtest/verify-run.rb', __dir__)
    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_privilege/scenario.json.erb', __dir__)

    setup do
      scenario = JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
      @game = create_access_game(mission: Mission.create!(name: 'test_simple_success', display_name: 'V', published: true, difficulty_level: 1),
                                 player: break_escape_demo_users(:test_user), scenario: scenario,
                                 player_state: { 'unlockedRooms' => %w[lobby bay store] })
    end

    def hold(sessions)
      @game.player_state['sessions'] = sessions
      @game.save!
    end

    def run_script
      ARGV.replace(['--access', @game.id.to_s])
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

    def session_line(out, pc)
      out.lines.map(&:strip).find { |l| l.start_with?('sessions') }.to_s.split('; ').find { |part| part.include?("#{pc} = ") }.to_s
    end

    test 'an administrator session prints level admin, a user session level user' do
      hold('bay_pc' => { 'id' => 'adel', 'via' => 'password' }, 'store_pc' => { 'id' => 'uma', 'via' => 'password' })
      out = run_script
      assert_match(/bay_pc = adel \(password\), level admin/, session_line(out, 'bay_pc'))
      assert_match(/store_pc = uma \(password\), level user/, session_line(out, 'store_pc'))
    end

    test 'a locked session prints level none, and the stored access is still shown beside it' do
      hold('bay_pc' => { 'id' => 'adel', 'via' => 'password', 'locked' => true },
           'store_pc' => { 'id' => 'uma', 'via' => 'technique', 'foothold' => 'jack_x', 'access' => 'admin' })
      out = run_script
      assert_match(/bay_pc = adel \(password\), level none/, session_line(out, 'bay_pc'))
      assert_includes session_line(out, 'store_pc'), 'access admin'
    end

    test 'a session of an account that is gone prints level none, and a junk record raises nothing' do
      hold('store_pc' => { 'id' => 'nobody', 'via' => 'password' }, 'bay_pc' => 'junk')
      out = run_script
      assert_includes session_line(out, 'store_pc'), 'level none'
      assert_includes session_line(out, 'bay_pc'), 'level none'
    end

    # lets a test make `session_access` raise for one run (a flag, so the prepend is harmless to other tests)
    module RaisingSessionAccess
      def session_access(*)
        raise 'boom' if Thread.current[:raise_session_access]

        super
      end
    end
    Game.prepend(RaisingSessionAccess)

    test 'a raise inside the level work prints level error, not the word of a locked session' do
      hold('bay_pc' => { 'id' => 'adel', 'via' => 'password' })
      Thread.current[:raise_session_access] = true
      out = run_script
      assert_includes session_line(out, 'bay_pc'), 'level error'
    ensure
      Thread.current[:raise_session_access] = nil
    end

    test 'a level word is one of three words and carries no password' do
      hold('bay_pc' => { 'id' => 'adel', 'via' => 'password' })
      out = run_script
      assert_match(/level (admin|user|none)\b/, out)
      refute_includes out, 'Lanternwick-Adel-52'
    end
  end
end
