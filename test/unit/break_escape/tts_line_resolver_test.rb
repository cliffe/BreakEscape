require 'test_helper'
require 'tmpdir'

module BreakEscape
  # TtsLineResolver rules not covered by the fixture scenario in
  # tts_text_match_test.rb: phone text conversations and stories that host no
  # voiced conversation.
  class TtsLineResolverTest < ActiveSupport::TestCase
    VOICE = { 'name' => 'Kore', 'style' => nil, 'language' => 'en-GB' }.freeze

    def story(dir, name, lines)
      File.write(File.join(dir, name), { 'inkVersion' => 21,
                                         'root' => [lines.flat_map { |l| ["^#{l}", "\n"] } + ['done'], 'done', nil] }.to_json)
      File.join(dir, name)
    end

    def resolver(data)
      TtsLineResolver.new(scenario_name: "resolver_test_#{data.hash}", scenario_data: data, story_file: ->(path) { path })
    end

    def line(data, npc_id, text)
      resolver(data).resolve(npc_id, TtsLineResolver.find_npc(data, npc_id), text).line
    end

    test "a phone contact's text conversation voices only its voice messages, as the transcript" do
      Dir.mktmpdir do |dir|
        path = story(dir, 'phone.json', ['voice: Meet me by the lifts.', 'Dana Lee: voice: Bring the badge.',
                                         'Just a text, not voiced.', 'Narrator: The phone buzzes.'])
        data = { 'rooms' => { 'r' => { 'npcs' => [
          { 'id' => 'dana', 'displayName' => 'Dana Lee', 'npcType' => 'phone', 'voice' => VOICE, 'storyPath' => path }
        ] } } }
        assert_equal 'Meet me by the lifts.', line(data, 'dana', 'meet me by the lifts')
        assert_equal 'Bring the badge.', line(data, 'dana', 'Bring the badge.')
        assert_nil line(data, 'dana', 'Just a text, not voiced.')
        assert_nil line(data, 'dana', 'The phone buzzes.')
        assert_nil line(data, 'dana', 'voice: Meet me by the lifts.')
      end
    end

    test "a story that hosts no voiced conversation voices only the NPC's own lines" do
      Dir.mktmpdir do |dir|
        path = story(dir, 'desk.json', ['Ann Ross: Over here.', 'Not prefixed, so mine.', 'Bob Hale: Not me.',
                                        'Narrator: The rain stops.'])
        data = { 'rooms' => { 'r' => {
          'objects' => [{ 'id' => 'desk_terminal', 'displayName' => 'Ann Ross', 'storyPath' => path, 'ttsVoice' => VOICE }],
          'npcs' => [{ 'id' => 'bob', 'displayName' => 'Bob Hale', 'voice' => VOICE }]
        } } }
        assert_equal 'Over here.', line(data, 'desk_terminal', 'Ann Ross: Over here.')
        assert_equal 'Not prefixed, so mine.', line(data, 'desk_terminal', 'Not prefixed, so mine.')
        assert_nil line(data, 'desk_terminal', 'Not me.')
        assert_nil line(data, 'desk_terminal', 'The rain stops.')
      end
    end

    # Plan 2.10 (A1 R1 M2): on a voiced phone call an id prefix names its record even when that
    # record shares the host's display name; person-chat keeps the same-name rule (it sends the
    # conversation's own id, person-chat-minigame.js isOwnNpcByName).
    HAX_STORY = { 'inkVersion' => 21, 'listDefs' => {},
                  'root' => [[['done', { '#n' => 'g-0' }], nil], 'done',
                             { 'start' => ['^hax_post: Listen up.', "\n", '^Agent HaX: And me.', "\n", '^Plain line.', "\n", 'end', nil] }] }.freeze
    VOICE_A = { 'name' => 'Kore', 'style' => 'Phone.', 'language' => 'en-GB' }.freeze
    VOICE_B = { 'name' => 'Puck', 'style' => 'In person.', 'language' => 'en-GB' }.freeze

    def same_name_pair(dir, host)
      File.write(File.join(dir, 'hax.json'), HAX_STORY.to_json)
      { 'rooms' => { 'r' => { 'npcs' => [
        { 'id' => 'hax_post', 'displayName' => 'Agent HaX', 'npcType' => 'person', 'voice' => VOICE_B },
        { 'id' => 'agent_0x99', 'displayName' => 'Agent HaX', 'voice' => VOICE_A,
          'storyPath' => File.join(dir, 'hax.json') }.merge(host)
      ] } } }
    end

    test "a voiced call's id prefix voices the named record even when it shares the host's display name" do
      Dir.mktmpdir do |dir|
        data = same_name_pair(dir, 'npcType' => 'phone', 'voiced' => true, 'currentKnot' => 'start')
        by_text = TtsLineExtractor.new('same_name_call', data).entries.to_h { |e| [e.text, e.npc_id] }
        assert_equal 'hax_post', by_text['Listen up.'], 'the id names the record'
        assert_equal 'agent_0x99', by_text['And me.'], 'a display name that two records share stays with the host'
        assert_equal 'agent_0x99', by_text['Plain line.']
        # The endpoint's side: the client's request (npc_id hax_post) is accepted, under hax_post only
        assert_equal 'Listen up.', line(data, 'hax_post', 'Listen up.')
        assert_nil line(data, 'agent_0x99', 'Listen up.')
        assert_equal 'And me.', line(data, 'agent_0x99', 'And me.')
      end
    end

    test "person-chat keeps the same-name rule: the id prefix voices the conversation's own record" do
      Dir.mktmpdir do |dir|
        data = same_name_pair(dir, 'npcType' => 'person')
        by_text = TtsLineExtractor.new('same_name_person', data).entries.to_h { |e| [e.text, e.npc_id] }
        assert_equal 'agent_0x99', by_text['Listen up.']
        assert_nil line(data, 'hax_post', 'Listen up.')
      end
    end

    # R2 m1: the client strips the contact's own display name before it reads a prefix
    # (contactNames), so "Ghost: ..." on host ghost_phone stays with ghost_phone even when another
    # voiced record has the id `ghost`, whichever comes first in the scenario.
    GHOST_STORY = { 'inkVersion' => 21, 'listDefs' => {},
                    'root' => [[['done', { '#n' => 'g-0' }], nil], 'done',
                               { 'start' => ['^Ghost: Hello there.', "\n", '^ghost phone: Own id with spaces.', "\n",
                                             '^GHOST_PHONE: Own id.', "\n", '^ghost: Same as its name.', "\n", '^ghost_old: Named by id.', "\n", 'end', nil] }] }.freeze

    [true, false].each do |person_first|
      test "a voiced call line prefixed with the host's own display name stays with the host (record order #{person_first ? 'person first' : 'host first'})" do
        Dir.mktmpdir do |dir|
          File.write(File.join(dir, 'ghost.json'), GHOST_STORY.to_json)
          person = { 'id' => 'ghost', 'displayName' => 'Ghost Person', 'npcType' => 'person', 'voice' => VOICE_B }
          host = { 'id' => 'ghost_phone', 'displayName' => 'Ghost', 'npcType' => 'phone', 'voiced' => true,
                   'currentKnot' => 'start', 'voice' => VOICE_A, 'storyPath' => File.join(dir, 'ghost.json') }
          other = { 'id' => 'ghost_old', 'displayName' => 'Ghost Old', 'npcType' => 'person', 'voice' => VOICE_B }
          data = { 'rooms' => { 'r' => { 'npcs' => person_first ? [person, other, host] : [host, other, person] } } }
          by_text = TtsLineExtractor.new("ghost_name_#{person_first}", data).entries.to_h { |e| [e.text, e.npc_id] }
          assert_equal 'ghost_phone', by_text['Hello there.'], 'the contact\'s own display name'
          assert_equal 'ghost_phone', by_text['Own id with spaces.']
          assert_equal 'ghost_phone', by_text['Own id.']
          assert_equal 'ghost_phone', by_text['Same as its name.'], '"ghost" is also the host\'s display name: the client strips it'
          assert_equal 'ghost_old', by_text['Named by id.'], 'another record\'s id still names that record'
          # The endpoint accepts what the client sends: the own-name line under the host
          assert_equal 'Hello there.', line(data, 'ghost_phone', 'Hello there.')
          assert_nil line(data, 'ghost', 'Hello there.')
        end
      end
    end

    test "a missing story is a 404, not an error" do
      data = { 'rooms' => { 'r' => { 'npcs' => [{ 'id' => 'ann', 'voice' => VOICE, 'storyPath' => 'nowhere.json' }] } } }
      result = TtsLineResolver.new(scenario_name: 'resolver_missing', scenario_data: data, story_file: ->(_) { nil })
                              .resolve('ann', TtsLineResolver.find_npc(data, 'ann'), 'Anything.')
      assert_nil result.line
      assert_equal :not_found, result.status
    end

    test "only the narrator id gets the narrator's rules, whatever flags another NPC carries" do
      Dir.mktmpdir do |dir|
        path = story(dir, 'host.json', ['Narrator: The rain stops.', 'Hello there.'])
        data = { 'narrator' => { 'id' => 'narrator', 'skipTextValidation' => true, 'voice' => VOICE },
                 'rooms' => { 'r' => { 'npcs' => [
                   { 'id' => 'ann', 'skipTextValidation' => true, 'voice' => VOICE, 'storyPath' => path }
                 ] } } }
        assert_equal 'The rain stops.', line(data, 'narrator', 'The rain stops.')
        assert_nil line(data, 'ann', 'The rain stops.')
        assert_equal 'Hello there.', line(data, 'ann', 'Hello there.')
      end
    end
  end
end
