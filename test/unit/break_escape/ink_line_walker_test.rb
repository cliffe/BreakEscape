require 'test_helper'

module BreakEscape
  # Fixture: test/fixtures/files/ink_line_walker/walker_fixture.ink, compiled with
  # inklecate to walker_fixture.json (recompile both if the .ink changes).
  class InkLineWalkerTest < ActiveSupport::TestCase
    FIXTURE = Engine.root.join('test/fixtures/files/ink_line_walker/walker_fixture.json').to_s

    setup do
      @walker = InkLineWalker.from_file(FIXTURE, variables: { 'codename' => 'Wychbourne' })
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
      assert_includes @pairs, ['Kevin Park', 'Your codename is Wychbourne.']
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
        'globalVariables' => { 'codename' => 'Wychbourne' },
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

    test "lists a co-speaker line under the co-speaker even when their own story lacks it" do
      extractor = TtsLineExtractor.new('walker_test', scenario(maya_story: MAYA_STORY))
      entries = extractor.entries.map { |e| [e.npc_id, e.text] }
      assert_includes entries, ['maya_chen', "I'm the co-speaker here."]
      assert_includes entries, ['maya_chen', 'Something else entirely.']
      refute(extractor.notes.any? { |n| n.reason.include?('endpoint refuses') })
      assert_equal MAYA_VOICE, extractor.entries.find { |e| e.text == "I'm the co-speaker here." }.voice
    end

    test "drops narrator lines when the scenario has no narrator voice" do
      data = scenario
      data.delete('narrator')
      extractor = TtsLineExtractor.new('walker_test', data)
      refute(extractor.entries.any? { |e| e.npc_id == 'narrator' })
      assert(extractor.notes.any? { |n| n.reason.include?('no voice config for narrator') })
    end
  end

  # Vance speaks in HaX's debrief (m04): by prefix and by #speaker tag, while
  # his own story holds other lines.
  class TtsLineExtractorCoSpeakerTest < ActiveSupport::TestCase
    HOST = 'test/fixtures/files/ink_line_walker/cospeaker_host.json'.freeze
    VANCE_OWN = 'test/fixtures/files/ink_line_walker/cospeaker_vance_own.json'.freeze
    HAX_VOICE = { 'name' => 'Aoede', 'style' => 'Calm handler.', 'language' => 'en-GB' }.freeze
    VANCE_VOICE = { 'name' => 'Charon', 'style' => 'Tired engineer.', 'language' => 'en-GB' }.freeze

    def scenario
      {
        'rooms' => {
          'control' => {
            'npcs' => [
              { 'id' => 'agent_0x99_debrief', 'displayName' => 'Agent HaX', 'npcType' => 'person',
                'voice' => HAX_VOICE, 'storyPath' => HOST },
              { 'id' => 'robert_vance', 'displayName' => 'Robert Vance', 'npcType' => 'person',
                'voice' => VANCE_VOICE, 'storyPath' => VANCE_OWN }
            ]
          }
        }
      }
    end

    test "attributes prefixed and #speaker-tagged co-speaker lines to the co-speaker's voice" do
      extractor = TtsLineExtractor.new('walker_test', scenario)
      service = TtsService.new
      ['Nobody gets to call it an accident.', "It'll hurt us. People should still know."].each do |text|
        entry = extractor.entries.find { |e| e.text == text }
        assert entry, "missing: #{text}"
        assert_equal 'robert_vance', entry.npc_id
        assert_equal VANCE_VOICE, entry.voice
        assert_equal service.cache_key_for(text, 'Charon', 'Tired engineer.', 'en-GB'), entry.key
      end
      assert_equal 'agent_0x99_debrief', extractor.entries.find { |e| e.text == 'You made the disclosure call.' }.npc_id
    end

    test "spoken_by? matches a line only for the speaker it is attributed to" do
      extractor = TtsLineExtractor.new('walker_test', scenario)
      assert extractor.spoken_by?('robert_vance', 'Nobody gets to call it an accident.')
      assert extractor.spoken_by?('robert_vance', "it'll hurt us people should still know")
      refute extractor.spoken_by?('robert_vance', 'You made the disclosure call.')
      refute extractor.spoken_by?('agent_0x99_debrief', 'Nobody gets to call it an accident.')
      refute extractor.spoken_by?('robert_vance', 'Words nobody wrote.')
    end

    test "expands an inline conditional whose rejoin divert is an absolute path" do
      walker = InkLineWalker.from_file(Engine.root.join(HOST).to_s)
      raws = walker.lines.map(&:raw)
      assert_includes raws, 'Agent HaX: They spent years on this. Tonight you turned it round.'
      assert_includes raws, 'Agent HaX: They spent years on this. Tonight you took it off them.'
      assert_empty walker.unresolved
    end
  end

  # A phone contact's story is voiced only when a call is marked `voiced` (F17),
  # and then as the phone voices it: no narration, no player lines.
  class TtsLineExtractorVoicedCallTest < ActiveSupport::TestCase
    CALL = 'test/fixtures/files/ink_line_walker/phone_call_host.json'.freeze
    HUB_CALL = 'test/fixtures/files/ink_line_walker/phone_call_hub.json'.freeze
    HAX_VOICE = { 'name' => 'Aoede', 'style' => 'Calm handler.', 'language' => 'en-GB' }.freeze
    DIRECTOR_VOICE = { 'name' => 'Charon', 'style' => 'Weary director.', 'language' => 'en-GB' }.freeze
    NARRATOR_VOICE = { 'name' => 'Algenib', 'style' => 'Noir.', 'language' => 'en-GB' }.freeze

    def scenario(mapping: {}, timed: nil, story: CALL, current: nil)
      hax = { 'id' => 'agent_0x99', 'displayName' => 'Agent HaX', 'npcType' => 'phone',
              'voice' => HAX_VOICE, 'storyPath' => story,
              'eventMappings' => [{ 'eventPattern' => 'game_loaded', 'conversationMode' => 'phone-chat',
                                    'targetKnot' => 'call' }.merge(mapping)] }
      hax['currentKnot'] = current if current
      hax['timedConversation'] = timed if timed
      {
        'narrator' => { 'id' => 'narrator', 'voice' => NARRATOR_VOICE },
        'rooms' => {
          'office' => {
            'npcs' => [
              hax,
              { 'id' => 'director_netherton', 'displayName' => 'Director Netherton', 'npcType' => 'phone',
                'voice' => DIRECTOR_VOICE }
            ]
          }
        }
      }
    end

    def entries_for(data)
      TtsLineExtractor.new('walker_test', data).entries.map { |e| [e.npc_id, e.text] }
    end

    test "a phone story with no voiced call is not voiced" do
      assert_empty entries_for(scenario)
      assert_empty entries_for(scenario(mapping: { 'voiced' => true, 'conversationMode' => 'person-chat' }))
    end

    test "a voiced phone-chat mapping voices the contact's and the co-speaker's lines" do
      entries = entries_for(scenario(mapping: { 'voiced' => true }))
      assert_equal [
        ['agent_0x99', "Don't hang up."],
        ['director_netherton', "Put her on when she's done."],
        ['agent_0x99', 'Stay on the line.']
      ], entries
    end

    test "a voiced timedConversation counts too, and the endpoint accepts the co-speaker's line" do
      extractor = TtsLineExtractor.new('walker_test', scenario(timed: { 'targetKnot' => 'call', 'voiced' => true }))
      assert_equal 3, extractor.entries.size
      assert extractor.spoken_by?('director_netherton', "Put her on when she's done.")
      refute extractor.spoken_by?('agent_0x99', 'The line crackles.')
      refute extractor.spoken_by?('narrator', 'The line crackles.')
      service = TtsService.new
      entry = extractor.entries.find { |e| e.npc_id == 'director_netherton' }
      assert_equal service.cache_key_for("Put her on when she's done.", 'Charon', 'Weary director.', 'en-GB'), entry.key
    end

    # F20: only the call's own knots, up to the contact's home knot (currentKnot)
    test "a voiced call voices only its own knots: the hub reply and a hub topic are left out" do
      data = scenario(mapping: { 'voiced' => true }, story: HUB_CALL, current: 'hub')
      extractor = TtsLineExtractor.new('walker_test', data)
      assert_equal [
        ['agent_0x99', "Don't hang up."],
        ['agent_0x99', 'Here is the plan.'],
        ['agent_0x99', 'Back to your desk.']
      ], extractor.entries.map { |e| [e.npc_id, e.text] }
      refute extractor.spoken_by?('agent_0x99', 'Nothing yet.')
      refute extractor.spoken_by?('agent_0x99', 'The vault is sealed.')
      ink = JSON.parse(File.read(Engine.root.join(HUB_CALL)))
      assert_equal Set.new(%w[call briefing]), TtsLineExtractor.call_knots(data.dig('rooms', 'office', 'npcs', 0), ink)
    end

    # A call the player starts (a desk phone's pretext call) has no event mapping: `voiced: true`
    # on the contact marks it, and the contact's own knot is the call's start.
    test "voiced: true on the contact voices the call from its currentKnot, not its narration" do
      data = scenario(story: HUB_CALL, current: 'call')
      data['rooms']['office']['npcs'][0].delete('eventMappings')
      assert_empty entries_for(data)
      data['rooms']['office']['npcs'][0]['voiced'] = true
      extractor = TtsLineExtractor.new('walker_test', data)
      assert_includes extractor.entries.map { |e| [e.npc_id, e.text] }, ['agent_0x99', "Don't hang up."]
      assert_includes extractor.entries.map { |e| e.npc_id }.uniq, 'agent_0x99'
      refute extractor.spoken_by?('narrator', 'The line crackles.')
      npc = data['rooms']['office']['npcs'][0]
      ink = JSON.parse(File.read(Engine.root.join(HUB_CALL)))
      assert_equal ['call'], TtsLineExtractor.call_start_knots(npc)
      assert_includes TtsLineExtractor.call_knots(npc, ink), 'call'
    end

    # A pretext call's authored goodbye (social.pretextNpcs outcomes.<id>.line) is spoken on
    # finalise, outside the ink: it is voiced when the call's phone NPC is voiced.
    def pretext_scenario(voiced: true, line: "Sorry, I'm going to stop you there.")
      data = scenario(story: HUB_CALL, current: 'call')
      npc = data['rooms']['office']['npcs'][0]
      npc.delete('eventMappings')
      npc['voiced'] = true if voiced
      data['social'] = {
        'characters' => { 'dev' => { 'displayName' => 'Dev', 'channels' => { 'phone' => 'agent_0x99' } } },
        'pretextNpcs' => [{ 'character' => 'dev', 'callId' => 'c',
                            'outcomes' => { 'got_it' => {}, 'reported' => { 'line' => line, 'setGlobal' => { 'x' => true } },
                                            'walked_away' => {} } }]
      }
      data
    end

    test "a pretext outcome line is voiced with the voiced phone NPC's voice and accepted by the endpoint" do
      extractor = TtsLineExtractor.new('walker_test', pretext_scenario)
      entry = extractor.entries.find { |e| e.text.start_with?('Sorry, ') }
      assert entry, 'outcome line should be listed'
      assert_equal 'agent_0x99', entry.npc_id
      assert_equal HAX_VOICE, entry.voice
      assert_equal TtsService.new.cache_key_for("Sorry, I'm going to stop you there.", 'Aoede', 'Calm handler.', 'en-GB'), entry.key
      assert extractor.spoken_by?('agent_0x99', "Sorry, I'm going to stop you there!")
      refute extractor.spoken_by?('director_netherton', "Sorry, I'm going to stop you there.")
      refute extractor.spoken_by?('agent_0x99', 'Something else entirely.')
    end

    test "a pretext outcome line is not voiced when the call is not voiced" do
      extractor = TtsLineExtractor.new('walker_test', pretext_scenario(voiced: false))
      assert_empty extractor.entries.select { |e| e.text.start_with?('Sorry, ') }
      refute extractor.spoken_by?('agent_0x99', "Sorry, I'm going to stop you there.")
    end

    test "the endpoint cache stamp changes when an outcome line is edited" do
      a = TtsLineExtractor.new('walker_test', pretext_scenario).cache_stamp
      b = TtsLineExtractor.new('walker_test', pretext_scenario(line: 'Different words.')).cache_stamp
      refute_equal a, b
    end

    test "voiced: true on a contact with no currentKnot starts at start" do
      npc = { 'voiced' => true }
      assert TtsLineExtractor.voiced_call?(npc)
      assert_equal ['start'], TtsLineExtractor.call_start_knots(npc)
      refute TtsLineExtractor.voiced_call?({})
    end

    test "the call boundary is the home knot: with home 'start' the hub is reached, and no targetKnot voices nothing" do
      entries = entries_for(scenario(mapping: { 'voiced' => true }, story: HUB_CALL))
      assert_includes entries, ['agent_0x99', 'Nothing yet.']
      assert_includes entries, ['agent_0x99', 'The vault is sealed.']
      extractor = TtsLineExtractor.new('walker_test', scenario(mapping: { 'voiced' => true, 'targetKnot' => nil }, story: HUB_CALL, current: 'hub'))
      assert_empty extractor.entries
      assert(extractor.notes.any? { |n| n.reason.include?('no targetKnot') })
    end
  end
end
