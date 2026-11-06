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

    test "keeps the 10-character fragment rule for interpolated and glued lines" do
      # Unchanged looseness (user decision): a request containing a 10+ character
      # story fragment passes, so runtime values the walker won't guess still validate.
      assert InkTextValidator.validate(FIXTURE, 'Your codename is Whatever.')
      assert InkTextValidator.validate(FIXTURE, 'Kevin Park: The first half and the glued half.')
      # "You found " is under 10 characters, so this one has nothing to match.
      refute InkTextValidator.validate(FIXTURE, 'You found 4 clues.')
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
