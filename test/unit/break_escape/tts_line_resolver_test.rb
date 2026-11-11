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
