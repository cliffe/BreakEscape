require 'test_helper'

module BreakEscape
  # tools/playtest/verify-run.rb (OPS_CORE_PLAN.md 11.4, S3): `opsUsed` joins the access keys and prints one
  # line of finding ids (with the alias when the finding is held); a technique session's line shows its level
  # and the finding that granted it. Ids and words only.
  class OpsUsedVerifyRunTest < ActiveSupport::TestCase
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

    def line(out, name)
      out.lines.map(&:strip).find { |l| l.start_with?(name) }
    end

    test 'used findings print in alias order, a finding not held by its bare id, once each' do
      @game.player_state['opsFindings'] = { 'a.web.two' => 'c2', 'a.web.one' => 'c1' }
      @game.player_state['opsUsed'] = ['a.web.two', 'z.q.loose', 'a.web.one', 'a.web.two']
      @game.save!
      assert_match(/opsUsed\s+3: f1 a\.web\.one; f2 a\.web\.two; z\.q\.loose\z/, line(run_script, 'opsUsed').to_s)
    end

    test 'a value that is not a finding id word is left out and nothing raises' do
      @game.player_state['opsUsed'] = ['a.web.one', 'two words', 4, { 'x' => 1 }, nil, "line\nbreak"]
      @game.save!
      out = run_script
      assert_match(/opsUsed\s+1: a\.web\.one\z/, line(out, 'opsUsed').to_s)
      refute_includes out, 'two words'
      @game.player_state['opsUsed'] = 'nope'
      @game.save!
      assert_match(/opsUsed\s+0\z/, line(run_script, 'opsUsed').to_s)
    end

    test 'a technique session line shows its level and granting finding, and a password session shows neither' do
      @game.player_state['sessions'] = {
        'vault01' => { 'id' => 'ian', 'via' => 'technique', 'foothold' => 'jack_a', 'access' => 'admin', 'technique' => 'v.admin.step_up' },
        'desk01' => { 'id' => 'sam', 'via' => 'technique', 'foothold' => 'jack_a', 'access' => 'root', 'technique' => 'not an id' },
        'lena_pc' => { 'id' => 'lena', 'via' => 'password' }
      }
      @game.save!
      sessions = line(run_script, 'sessions').to_s
      assert_includes sessions, 'vault01 = ian (technique, remote, foothold jack_a, access admin, granted by v.admin.step_up)'
      assert_includes sessions, 'desk01 = sam (technique, remote, foothold jack_a)'
      assert_includes sessions, 'lena_pc = lena (password)'
      refute_includes sessions, 'root'
      refute_includes sessions, 'not an id'
    end

    test 'only the opsUsed key being set still prints the access section' do
      @game.player_state['opsUsed'] = ['a.web.one']
      @game.save!
      assert_includes run_script, 'access model'
    end
  end
end
