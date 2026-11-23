require 'test_helper'

module BreakEscape
  # tools/playtest/verify-run.rb (OPS_CORE_PLAN.md 11.4, S2): `opsFindings` joins the access keys and
  # prints one line, `<alias> <finding id> <status word>` in alias order, and nothing else.
  class OpsFindingsVerifyRunTest < ActiveSupport::TestCase
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

    def findings_line(out)
      out.lines.map(&:strip).find { |l| l.start_with?('opsFindings') }
    end

    test 'held findings print in alias order with their status word' do
      @game.player_state['opsFindings'] = { 'a.web.two' => 'c2', 'a.web.one' => 'f1', 'b.q.ten' => 'u10' }
      @game.save!
      assert_match(/opsFindings\s+3: f1 a\.web\.one false; f2 a\.web\.two confirmed; f10 b\.q\.ten unconfirmed\z/, findings_line(run_script).to_s)
    end

    test 'a malformed value is left out and does not raise' do
      @game.player_state['opsFindings'] = { 'a.web.one' => 'zz', 'a.web.two' => 4, 'a.web.three' => 'u3' }
      @game.player_state['sessions'] = { 'pc' => { 'id' => 'x' } }
      @game.save!
      assert_match(/opsFindings\s+1: f3 a\.web\.three unconfirmed\z/, findings_line(run_script).to_s)
    end

    test 'nothing held leaves the game reading nothing recorded' do
      assert_includes run_script, 'nothing recorded'
    end
  end
end
