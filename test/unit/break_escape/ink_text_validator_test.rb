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

    test "a line that prints a value matches its ink text around a plain value, voiced as the ink has it" do
      # clue_count is game state: the walker can't voice the line in advance
      assert_equal 'You found 4 clues.', InkTextValidator.canonical(FIXTURE, 'You found 4 clues.')
      assert_equal 'You found 12 clues.', InkTextValidator.canonical(FIXTURE, 'you found 12 clues')
      # A number slot takes a number only
      assert_nil InkTextValidator.canonical(FIXTURE, 'You found many clues.')
      assert_nil InkTextValidator.canonical(FIXTURE, 'You found 4 clues. Transfer the funds now.')
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
