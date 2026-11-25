require 'test_helper'

module BreakEscape
  # tools/playtest/verify-run.rb (S7 unit 14): the access section gains a `crack` line, one item per hash record
  # (its status word) and one per cracked account from the server's state. Ids and words only.
  class CrackVerifyRunTest < ActiveSupport::TestCase
    SCRIPT = File.expand_path('../../../tools/playtest/verify-run.rb', __dir__)

    setup do
      scenario = {
        'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {}, 'npcs' => [
          { 'id' => 'dana', 'displayName' => 'Dana', 'npcType' => 'person', 'creds' => { 'username' => 'dreyes', 'password' => 'Zq-test-pass-9' } }
        ], 'objects' => [{ 'type' => 'text_file', 'id' => 'dana_file', 'name' => 'f', 'takeable' => true, 'credential' => 'dana_hash' }] } },
        'credentials' => { 'dana_hash' => { 'kind' => 'hash', 'account' => 'dana', 'label' => 'Stored record',
                                            'proof' => { 'held' => 'dana_file' }, 'crack' => { 'password' => 'common' } } }
      }
      @game = create_access_game(mission: Mission.create!(name: 'test_simple_success', display_name: 'V', published: true, difficulty_level: 1),
                                 player: break_escape_demo_users(:test_user), scenario: scenario)
    end

    def run_script(*flags)
      ARGV.replace([@game.id.to_s, *(flags.empty? ? ['--access'] : flags)])
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

    def crack_line(out)
      out.lines.map(&:strip).find { |l| l.start_with?('crack') }
    end

    test 'a record whose proof does not hold is not listed, and a cracked account is named' do
      assert_match(/crack\s+1: dana_hash not listed\z/, crack_line(run_script).to_s)
      @game.player_state['crackedAccounts'] = ['dana', 'two words', 4]
      @game.save!
      assert_match(/crack\s+2: dana_hash not listed; cracked dana\z/, crack_line(run_script).to_s)
    end

    test 'a held record shows its status word and never a token or password' do
      @game.player_state['inventory'] = [{ 'id' => 'dana_file', 'type' => 'text_file', 'name' => 'f', 'credential' => 'dana_hash' }]
      @game.save!
      line = crack_line(run_script).to_s
      assert_match(/crack\s+1: dana_hash ready\z/, line)
      refute_includes line, 'Zq-test-pass-9'
    end

    test 'a game with no hash record and no cracking state prints no crack line' do
      plain = { 'startRoom' => 'lobby', 'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {}, 'objects' => [] } } }
      @game = create_access_game(mission: @game.mission,
                                 player: break_escape_demo_users(:test_user), scenario: plain)
      @game.player_state['opsUsed'] = ['a.web.one']
      @game.save!
      out = run_script
      assert_includes out, 'access model'
      assert_nil crack_line(out)
    end

    # ---- R1-L15 ------------------------------------------------------------------------------------

    test 'the full report (no --access) prints the crack line for a game whose only access state is a hash record' do
      @game.player_state['inventory'] = [{ 'id' => 'dana_file', 'type' => 'text_file', 'name' => 'f', 'credential' => 'dana_hash' }]
      @game.save!
      out = run_script('--tasks')
      assert_match(/crack\s+1: dana_hash ready\z/, crack_line(out).to_s)
      refute_includes out, 'nothing recorded'
    end

    test 'the habits line never prints the password class, pattern or grade, and keeps the other habits' do
      scenario = @game.scenario_data
      npc = scenario['rooms']['lobby']['npcs'].first
      npc['habits'] = { 'password' => 'guessable', 'passwordPattern' => 'pattern_note', 'passwordDifficulty' => 'hard', 'lockChance' => 0.5 }
      @game.scenario_data = scenario
      @game.save!
      out = run_script
      line = out.lines.find { |l| l.include?('npc dana') }.to_s
      assert_includes line, 'lockChance=0.5'
      %w[guessable passwordPattern pattern_note passwordDifficulty hard password=].each { |w| refute_includes line, w }
    end
  end
end
