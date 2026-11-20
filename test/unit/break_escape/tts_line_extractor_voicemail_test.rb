require 'test_helper'
require 'json'

module BreakEscape
  # Phone calls A6 (plan 2.6, 4.2): a `ring.voicemailKnot` is a voicemail the client runs silently into
  # the thread. Its `voice:` lines, prefix stripped, are voiced under the contact's id (a tap on the
  # bubble sends them to /tts). Nothing else in the knot is, and the knot does not widen the call
  # walk. The client twin is the voicemail run in test/js/phone-voicemail-run.test.mjs.
  class TtsLineExtractorVoicemailTest < ActiveSupport::TestCase
    STORY = BreakEscape::Engine.root.join('scenarios/test_phone_calls/ink/caller_voicemail.json').to_s
    VOICE = { 'name' => 'Kore', 'style' => 'Phone.', 'language' => 'en-GB' }.freeze
    VM_ONE = 'You did not pick up. That is fine.'.freeze
    VM_TWO = 'Leave this with me. I will ring again.'.freeze
    HOME_LINE = 'Unknown number. Nothing to say yet.'.freeze
    CALL_LINE = 'You picked up this time. Good.'.freeze

    def ring(extra = {})
      { 'eventPattern' => 'x', 'conversationMode' => 'phone-chat', 'targetKnot' => 'ring_call',
        'ring' => { 'onMissed' => 'voicemail', 'voicemailKnot' => 'ring_vm' } }.merge(extra)
    end

    def npc(extra = {})
      { 'id' => 'caller_vm', 'displayName' => 'Caller VM', 'npcType' => 'phone', 'currentKnot' => 'start',
        'voice' => VOICE, 'storyPath' => STORY, 'eventMappings' => [ring] }.merge(extra)
    end

    def entries_for(npc_hash)
      data = { 'rooms' => { 'r' => { 'npcs' => [npc_hash] } } }
      TtsLineExtractor.new('voicemail_test', data).entries
    end

    def texts_for(npc_hash)
      entries_for(npc_hash).map(&:text)
    end

    test "the voice: lines of the voicemail knot are listed, prefix stripped, under the contact's id" do
      entries = entries_for(npc)
      vm = entries.select { |e| [VM_ONE, VM_TWO].include?(e.text) }
      assert_equal [VM_ONE, VM_TWO], vm.map(&:text)
      assert_equal ['caller_vm'], vm.map(&:npc_id).uniq
      refute(entries.any? { |e| e.text.start_with?('voice:') })
    end

    test "the call's own lines are still listed, the home knot is not, and the voicemail adds only its two lines" do
      texts = texts_for(npc)
      assert_includes texts, CALL_LINE
      refute_includes texts, HOME_LINE
      without = texts_for(npc('eventMappings' => [ring('ring' => true)]))
      assert_equal [], without & [VM_ONE, VM_TWO], 'a ring with no voicemail knot lists neither line'
      assert_equal (without + [VM_ONE, VM_TWO]).sort, texts.sort
    end

    test "voicemail_knots collects each ring.voicemailKnot, a timed ring too; none for a plain ring or a video call" do
      assert_equal ['ring_vm'], TtsLineExtractor.voicemail_knots(npc)
      timed = { 'targetKnot' => 'ring_call', 'ring' => { 'voicemailKnot' => 'other_vm.stitch' } }
      assert_equal %w[other_vm], TtsLineExtractor.voicemail_knots(npc('eventMappings' => [], 'timedConversation' => timed))
      assert_equal [], TtsLineExtractor.voicemail_knots(npc('eventMappings' => [ring('ring' => true)]))
      video = { 'targetKnot' => 'ring_call', 'videoCall' => true, 'ring' => { 'voicemailKnot' => 'ring_vm' } }
      assert_equal [], TtsLineExtractor.voicemail_knots(npc('eventMappings' => [], 'timedConversation' => video))
      assert_equal [], TtsLineExtractor.voicemail_knots(npc('eventMappings' => [ring('conversationMode' => 'person-chat')]))
      assert_equal [], TtsLineExtractor.voicemail_knots(npc('eventMappings' => [ring('ring' => { 'voicemailKnot' => '' })]))
    end

    test "a voicemail line is accepted by the endpoint's spoken-line check under the contact's id, with no delivery note" do
      extractor = TtsLineExtractor.new('voicemail_test', { 'rooms' => { 'r' => { 'npcs' => [npc] } } })
      assert extractor.spoken_line('caller_vm', VM_ONE)
      assert_nil extractor.entries.find { |e| e.text == VM_ONE }.delivery
    end

    test "a knot that is not a voicemail knot is not voiced just because it holds voice: lines" do
      assert_equal [], texts_for(npc('eventMappings' => [ring('ring' => { 'onMissed' => 'voicemail', 'voicemailKnot' => 'nope' })])) & [VM_ONE, VM_TWO]
    end
  end
end
