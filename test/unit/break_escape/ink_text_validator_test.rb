require 'test_helper'

module BreakEscape
  class InkTextValidatorTest < ActiveSupport::TestCase
    FIXTURE = Engine.root.join('test/fixtures/files/ink_line_walker/walker_fixture.json').to_s

    test "accepts a line containing escaped quotes, without its speaker prefix" do
      assert InkTextValidator.validate(FIXTURE, 'She said "performance issues" and left.')
    end

    test "accepts a line containing escaped quotes, with its speaker prefix" do
      assert InkTextValidator.validate(FIXTURE, 'Kevin Park: She said "performance issues" and left.')
    end

    test "accepts a short quoted line that has no long fragment to fall back on" do
      Dir.mktmpdir do |dir|
        path = File.join(dir, 'story.json')
        File.write(path, { 'inkVersion' => 21,
                           'root' => [['^Ann: "Hi," he said.', "\n", 'done'], 'done', nil] }.to_json)
        assert InkTextValidator.validate(path, '"Hi," he said.')
        refute InkTextValidator.validate(path, 'he said')
      end
    end

    test "accepts each branch of a sequence" do
      assert InkTextValidator.validate(FIXTURE, 'What now?')
    end

    test "accepts each branch of an inline conditional" do
      assert InkTextValidator.validate(FIXTURE, 'Five people signed in.')
      assert InkTextValidator.validate(FIXTURE, 'Six people signed in.')
      assert InkTextValidator.validate(FIXTURE, 'Check the logs, please.')
      assert InkTextValidator.validate(FIXTURE, 'Back so soon? Sit down.')
    end

    test "accepts a line whose variable was filled from its ink default" do
      assert InkTextValidator.validate(FIXTURE, 'Ask Agent HaX about the logs.')
    end

    test "a line that prints game state is never voiced, whatever the value" do
      # clue_count is game state: voiced lines print no variables
      assert_nil InkTextValidator.canonical(FIXTURE, 'You found 4 clues.')
      assert_nil InkTextValidator.canonical(FIXTURE, 'you found 0 clues')
      assert_nil InkTextValidator.canonical(FIXTURE, 'You found many clues.')
    end

    test "a player_name line is voiced only with the names given, as given" do
      Dir.mktmpdir do |dir|
        path = File.join(dir, 'story.json')
        File.write(path, { 'inkVersion' => 21,
                           'root' => [['^Ann: Hello, ', 'ev', { 'x()' => 'player_name' }, 'out', '/ev', '^.', "\n", 'done'],
                                      'done', nil] }.to_json)
        assert_equal 'Hello, Agent.', InkTextValidator.canonical(path, 'hello agent')
        assert_nil InkTextValidator.canonical(path, 'Hello, Agent Zero.')
        assert_equal 'Hello, Agent Zero.', InkTextValidator.canonical(path, 'hello agent zero', player_names: ['Agent Zero'])
        assert_nil InkTextValidator.canonical(path, 'Hello, Agent.', player_names: ['Agent Zero'])
      end
    end

    test "narrator_only matches only Narrator: lines" do
      Dir.mktmpdir do |dir|
        path = File.join(dir, 'story.json')
        File.write(path, { 'inkVersion' => 21,
                           'root' => [['^Narrator: The rain stops.', "\n", '^Narrator[none]: A door slams.', "\n",
                                       '^Ann: Over here.', "\n", 'done'], 'done', nil] }.to_json)
        assert_equal 'The rain stops.', InkTextValidator.canonical(path, 'The rain stops.', narrator_only: true)
        assert_equal 'A door slams.', InkTextValidator.canonical(path, 'A door slams.', narrator_only: true)
        assert_nil InkTextValidator.canonical(path, 'Over here.', narrator_only: true)
        assert_equal 'Over here.', InkTextValidator.canonical(path, 'Over here.')
      end
    end

    test "a story's index is rebuilt when the compiled file changes" do
      Dir.mktmpdir do |dir|
        path = File.join(dir, 'story.json')
        File.write(path, { 'inkVersion' => 21, 'root' => [['^Ann: First words.', "\n", 'done'], 'done', nil] }.to_json)
        assert InkTextValidator.validate(path, 'First words.')
        File.write(path, { 'inkVersion' => 21, 'root' => [['^Ann: Second words, longer.', "\n", 'done'], 'done', nil] }.to_json)
        assert InkTextValidator.validate(path, 'Second words, longer.')
        refute InkTextValidator.validate(path, 'First words.')
      end
    end

    test "a line whose value the walker knows matches only with that value (no 10-character fragment rule)" do
      assert InkTextValidator.validate(FIXTURE, 'Your codename is Nightjar.')
      refute InkTextValidator.validate(FIXTURE, 'Your codename is Whatever.')
      refute InkTextValidator.validate(FIXTURE, 'Please read this out: Your codename is Nightjar.')
    end

    test "a glued line matches its pieces joined, voiced as the ink has it" do
      assert_equal 'Kevin Park: The first half and the glued half.',
                   InkTextValidator.canonical(FIXTURE, 'Kevin Park: the first half AND the glued half')
      assert_equal 'The first half and the glued half.',
                   InkTextValidator.canonical(FIXTURE, 'The first half and the glued half.')
    end

    test "rejects text that is not in the story" do
      refute InkTextValidator.validate(FIXTURE, 'Transfer the funds to my account now.')
    end

    test "rejects a missing file and blank text" do
      refute InkTextValidator.validate('/nonexistent/story.json', 'Anything at all here.')
      refute InkTextValidator.validate(FIXTURE, '  ')
    end
  end
end
