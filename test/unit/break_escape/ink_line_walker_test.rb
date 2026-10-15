require 'test_helper'

module BreakEscape
  # Fixture: test/fixtures/files/ink_line_walker/walker_fixture.ink, compiled with
  # inklecate to walker_fixture.json (recompile both if the .ink changes).
  class InkLineWalkerTest < ActiveSupport::TestCase
    FIXTURE = Engine.root.join('test/fixtures/files/ink_line_walker/walker_fixture.json').to_s

    setup do
      @walker = InkLineWalker.from_file(FIXTURE, variables: { 'codename' => 'Kestrel' })
      @pairs = @walker.lines.map(&:to_a)
      @raws = @walker.lines.map(&:raw)
    end

    test "keeps escaped quotes inside a line" do
      assert_includes @pairs, ['Kevin Park', 'She said "performance issues" and left.']
    end

    test "returns narrator prefixes, including Narrator[none]" do
      assert_includes @pairs, ['Narrator', 'The lights flicker overhead.']
      assert_includes @pairs, ['Narrator[none]', 'Nobody else is in the room.']
    end

    test "returns unprefixed lines with a nil prefix" do
      assert_includes @pairs, [nil, 'This line has no speaker prefix.']
    end

    test "fills a variable from scenario globals before the ink default" do
      assert_includes @pairs, ['Kevin Park', 'Your codename is Kestrel.']
      refute(@raws.any? { |r| r.include?('Nightjar') })
    end

    test "fills a string variable from its ink VAR default" do
      assert_includes @pairs, ['Kevin Park', 'Ask Agent HaX about the logs.']
    end

    test "logs a numeric game-state interpolation instead of guessing" do
      refute(@raws.any? { |r| r.include?('clues') })
      assert(@walker.unresolved.any? { |u| u.text.include?('You found') && u.reason.include?('clue_count') })
    end

    test "logs both halves of a glued line and returns neither" do
      refute(@raws.any? { |r| r.include?('first half') || r.include?('glued half') })
      glued = @walker.unresolved.select { |u| u.reason == 'glue' }.map(&:text)
      assert_includes glued, 'Kevin Park: The first half'
      assert_includes glued, 'and the glued half.'
    end

    test "expands an inline conditional into one line per branch" do
      assert_includes @pairs, ['Kevin Park', 'Steady now. Keep going.']
      assert_includes @pairs, ['Kevin Park', 'Breathe. Keep going.']
      assert_includes @pairs, ['Kevin Park', 'Five people signed in.']
      assert_includes @pairs, ['Kevin Park', 'Six people signed in.']
    end

    test "expands a true-only conditional to the line with and without it" do
      assert_includes @pairs, ['Kevin Park', 'Check the logs again, please.']
      assert_includes @pairs, ['Kevin Park', 'Check the logs, please.']
    end

    test "expands a sequence nested inside a conditional" do
      assert_includes @pairs, ['Kevin Park', 'Still here. Sit down.']
      assert_includes @pairs, ['Kevin Park', 'Back so soon? Sit down.']
      assert_includes @pairs, ['Kevin Park', 'First visit? Sit down.']
    end

    test "expands conditionals nested in conditionals, past their condition checks" do
      ['Outer.', 'Inner calm.', 'Seq one.', 'Seq two.'].each do |text|
        assert_includes @pairs, ['Kevin Park', text]
      end
    end

    test "skips a conditional inside a choice label" do
      refute(@raws.any? { |r| r.include?('Conditional label') || r.include?('Other label') })
      refute(@walker.unresolved.any? { |u| u.text.include?('label') })
      assert_includes @pairs, ['Kevin Park', 'After choice three.']
    end

    test "logs a line that would expand past MAX_VARIANTS instead of yielding it" do
      refute(@raws.any? { |r| r.include?(' and E and ') || r.include?('now.') && r.include?(' and ') })
      assert(@walker.unresolved.any? { |u| u.reason.include?("more than #{InkLineWalker::MAX_VARIANTS}") })
    end

    test "expands a plain-text sequence into one line per branch" do
      %w[Back\ again? What\ now? Go\ on.].each do |alt|
        assert_includes @pairs, ['Kevin Park', alt]
      end
    end

    test "skips choice labels but keeps the lines after a choice" do
      refute(@raws.any? { |r| r.include?('Choice label') })
      assert_includes @pairs, ['Kevin Park', 'After choice one.']
      assert_includes @pairs, ['Kevin Park', 'After choice two.']
    end

    test "leaves tags out of the text and records them on the line" do
      line = @walker.lines.find { |l| l.text == 'Tagged line.' }
      assert line
      assert_equal ['influence_increased', 'speaker:npc'], line.tags
      refute(@raws.any? { |r| r.include?('influence_increased') || r.include?('speaker:') })
    end

    test "returns player lines with their prefix for the caller to drop" do
      assert_includes @pairs, ['Player', "I'm the player talking."]
      assert_includes @pairs, ['You', 'Me again.']
    end

    test "fragments are unescaped and include choice labels" do
      assert_includes @walker.fragments, 'Kevin Park: She said "performance issues" and left. '
      assert_includes @walker.fragments, 'Choice label one'
    end

    test "split_prefix mirrors the client's parseDialogueLine" do
      assert_equal ['Narrator[maya_chen]', 'Hi.'], InkLineWalker.split_prefix('Narrator[ maya_chen ]: Hi.')
      assert_equal ['Narrator', 'Rain.'], InkLineWalker.split_prefix('narrator:  Rain.')
      assert_equal ['Agent HaX', 'Time: now.'], InkLineWalker.split_prefix('Agent HaX: Time: now.')
      assert_equal [nil, 'Speaker:'], InkLineWalker.split_prefix('Speaker:')
      assert_equal [nil, 'No colon here'], InkLineWalker.split_prefix('No colon here')
    end
  end

  class TtsLineExtractorTest < ActiveSupport::TestCase
    STORY = 'test/fixtures/files/ink_line_walker/walker_fixture.json'.freeze
    MAYA_STORY = 'test/fixtures/files/ink_line_walker/maya_own.json'.freeze
    KEVIN_VOICE = { 'name' => 'Puck', 'style' => 'Nervous IT admin.', 'language' => 'en-GB' }.freeze
    MAYA_VOICE = { 'name' => 'Kore', 'style' => 'Calm.', 'language' => 'en-GB' }.freeze
    NARRATOR_VOICE = { 'name' => 'Algenib', 'style' => 'Noir.', 'language' => 'en-GB' }.freeze

    def scenario(maya_story: nil)
      maya = { 'id' => 'maya_chen', 'displayName' => 'Maya Chen', 'npcType' => 'person', 'voice' => MAYA_VOICE }
      maya['storyPath'] = maya_story if maya_story
      {
        'player' => { 'displayName' => 'Agent Zero' },
        'narrator' => { 'id' => 'narrator', 'voice' => NARRATOR_VOICE },
        'globalVariables' => { 'codename' => 'Kestrel' },
        'rooms' => {
          'office' => {
            'npcs' => [
              { 'id' => 'kevin_park', 'displayName' => 'Kevin Park', 'npcType' => 'person',
                'voice' => KEVIN_VOICE, 'storyPath' => STORY },
              maya
            ],
            'objects' => [
              { 'id' => 'desk_phone', 'voice' => 'Voicemail text.', 'ttsVoice' => KEVIN_VOICE }
            ]
          }
        }
      }
    end

    def entries_for(data)
      TtsLineExtractor.new('walker_test', data).entries.map { |e| [e.npc_id, e.text] }
    end

    test "resolves each line to the speaker the client sends" do
      entries = entries_for(scenario)
      assert_includes entries, ['kevin_park', 'She said "performance issues" and left.']
      assert_includes entries, ['narrator', 'The lights flicker overhead.']
      assert_includes entries, ['narrator', 'Nobody else is in the room.']
      assert_includes entries, ['kevin_park', 'This line has no speaker prefix.']
      assert_includes entries, ['maya_chen', "I'm the co-speaker here."]
      assert_includes entries, ['kevin_park', 'Go on.']
      assert_includes entries, ['desk_phone', 'Voicemail text.']
      refute(entries.any? { |_, t| t.include?('player talking') || t == 'Me again.' })
    end

    test "voices each line with its speaker's voice and keys it like the endpoint" do
      extractor = TtsLineExtractor.new('walker_test', scenario)
      service = TtsService.new
      narr = extractor.entries.find { |e| e.text == 'The lights flicker overhead.' }
      assert_equal NARRATOR_VOICE, narr.voice
      assert_equal service.cache_key_for(narr.text, 'Algenib', 'Noir.', 'en-GB'), narr.key
      maya = extractor.entries.find { |e| e.npc_id == 'maya_chen' }
      assert_equal MAYA_VOICE, maya.voice
    end

    test "skips a co-speaker line the endpoint would refuse" do
      extractor = TtsLineExtractor.new('walker_test', scenario(maya_story: MAYA_STORY))
      entries = extractor.entries.map { |e| [e.npc_id, e.text] }
      refute(entries.any? { |_, text| text == "I'm the co-speaker here." })
      assert_includes entries, ['maya_chen', 'Something else entirely.']
      assert(extractor.notes.any? { |n| n.reason.include?('endpoint refuses') })
    end

    test "drops narrator lines when the scenario has no narrator voice" do
      data = scenario
      data.delete('narrator')
      extractor = TtsLineExtractor.new('walker_test', data)
      refute(extractor.entries.any? { |e| e.npc_id == 'narrator' })
      assert(extractor.notes.any? { |n| n.reason.include?('no voice config for narrator') })
    end
  end
end
