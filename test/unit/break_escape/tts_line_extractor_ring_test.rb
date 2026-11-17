require 'test_helper'
require 'json'

module BreakEscape
  # Phone calls A2b (plan 4.2, the `ring` half): a contact with a `ring` mapping or timed
  # conversation is a voiced phone call, and the call's start knot is the mapping's targetKnot,
  # with or without `voiced`. The home knot is never listed. The client twin is
  # test/js/phone-call-knots-parity.test.mjs.
  class TtsLineExtractorRingTest < ActiveSupport::TestCase
    STORY = BreakEscape::Engine.root.join('scenarios/test_phone_calls/ink/caller_basic.json').to_s
    VOICE = { 'name' => 'Kore', 'style' => 'Phone.', 'language' => 'en-GB' }.freeze
    HOME_LINE = 'Basic here. Text me if you need anything.'.freeze

    def npc(extra = {})
      { 'id' => 'caller', 'displayName' => 'Caller', 'npcType' => 'phone', 'currentKnot' => 'start',
        'voice' => VOICE, 'storyPath' => STORY }.merge(extra)
    end

    def texts_for(npc_hash)
      data = { 'rooms' => { 'r' => { 'npcs' => [npc_hash] } } }
      TtsLineExtractor.new('ring_test', data).entries.map(&:text)
    end

    test "a ring mapping without voiced lists the call knot's lines and not the home knot" do
      mapping = { 'eventPattern' => 'room_entered', 'conversationMode' => 'phone-chat', 'targetKnot' => 'ring_call', 'ring' => true }
      texts = texts_for(npc('eventMappings' => [mapping]))
      assert_includes texts, 'I only wanted to check the line works.'
      assert_includes texts, 'Understood. Goodbye.'
      refute_includes texts, HOME_LINE
      refute_includes texts, 'Nothing yet. Ring me when it matters.'
    end

    test "the object form of ring is a ring too" do
      mapping = { 'eventPattern' => 'x', 'conversationMode' => 'phone-chat', 'targetKnot' => 'ring_call', 'ring' => { 'untilAnswered' => true } }
      assert_includes texts_for(npc('eventMappings' => [mapping])), 'Understood. Goodbye.'
    end

    test "ring false, null or absent is not a call, so nothing is listed" do
      [false, nil].each do |ring|
        mapping = { 'eventPattern' => 'x', 'conversationMode' => 'phone-chat', 'targetKnot' => 'ring_call', 'ring' => ring }
        refute_includes texts_for(npc('eventMappings' => [mapping])), 'Understood. Goodbye.', "ring #{ring.inspect}"
      end
      plain = { 'eventPattern' => 'x', 'conversationMode' => 'phone-chat', 'targetKnot' => 'ring_call' }
      refute_includes texts_for(npc('eventMappings' => [plain])), 'Understood. Goodbye.'
    end

    test "a timedConversation with ring is a call; a video call with ring is not a phone call" do
      timed = { 'delay' => 1000, 'targetKnot' => 'ring_call', 'ring' => true }
      assert_includes texts_for(npc('timedConversation' => timed)), 'Understood. Goodbye.'
      assert TtsLineExtractor.voiced_phone_call?(npc('timedConversation' => timed))
      video = timed.merge('videoCall' => true)
      refute TtsLineExtractor.voiced_phone_call?(npc('timedConversation' => video))
    end

    test "a ring mapping that is not a phone-chat mapping does not make a voiced call" do
      mapping = { 'eventPattern' => 'x', 'conversationMode' => 'person-chat', 'targetKnot' => 'ring_call', 'ring' => true }
      refute TtsLineExtractor.voiced_phone_call?(npc('eventMappings' => [mapping]))
    end

    test "voiced with ring lists the same lines as ring alone (no key moves for old forms)" do
      base = { 'eventPattern' => 'x', 'conversationMode' => 'phone-chat', 'targetKnot' => 'ring_call' }
      voiced = texts_for(npc('eventMappings' => [base.merge('voiced' => true)]))
      ring = texts_for(npc('eventMappings' => [base.merge('ring' => true)]))
      both = texts_for(npc('eventMappings' => [base.merge('voiced' => true, 'ring' => true)]))
      assert_equal voiced.sort, ring.sort
      assert_equal voiced.sort, both.sort
    end
  end
end
