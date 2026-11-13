require 'test_helper'
require 'json'

module BreakEscape
  # Phone calls A5 (plan 4.2, the `call` half): a contact with a `call` entry (one, or a list) is a
  # voiced phone call; each entry's knot is a call start knot, `button: false` ones included (they
  # are what `#place_call:<knot>` dials). The home knot is never listed. The client twin is the
  # `call` cases of test/js/phone-call-knots-parity.test.mjs.
  class TtsLineExtractorCallsTest < ActiveSupport::TestCase
    STORY = BreakEscape::Engine.root.join('scenarios/test_phone_calls/ink/caller_basic.json').to_s
    VOICE = { 'name' => 'Kore', 'style' => 'Phone.', 'language' => 'en-GB' }.freeze
    HOME_LINE = 'Basic here. Text me if you need anything.'.freeze
    CALL_LINE = 'Understood. Goodbye.'.freeze

    def npc(extra = {})
      { 'id' => 'caller', 'displayName' => 'Caller', 'npcType' => 'phone', 'currentKnot' => 'start',
        'voice' => VOICE, 'storyPath' => STORY }.merge(extra)
    end

    def texts_for(npc_hash)
      data = { 'rooms' => { 'r' => { 'npcs' => [npc_hash] } } }
      TtsLineExtractor.new('calls_test', data).entries.map(&:text)
    end

    test "a single call entry makes the contact a voiced call and lists the knot's lines, not the home knot" do
      texts = texts_for(npc('call' => { 'knot' => 'ring_call' }))
      assert_includes texts, CALL_LINE
      refute_includes texts, HOME_LINE
      assert TtsLineExtractor.voiced_phone_call?(npc('call' => { 'knot' => 'ring_call' }))
    end

    test "a list of entries adds each knot, a button false entry included" do
      list = [{ 'knot' => 'ring_call', 'button' => false }, { 'knot' => 'nothing_here', 'when' => 'globalVars.x' }]
      assert_equal %w[ring_call nothing_here], TtsLineExtractor.call_start_knots(npc('call' => list))
      assert_includes texts_for(npc('call' => list)), CALL_LINE
    end

    test "malformed entries are dropped and an absent call changes nothing" do
      bad = [nil, 'ring_call', {}, { 'knot' => '' }, { 'knot' => 5 }]
      assert_equal [], TtsLineExtractor.call_start_knots(npc('call' => bad))
      refute TtsLineExtractor.voiced_phone_call?(npc('call' => bad))
      refute TtsLineExtractor.voiced_phone_call?(npc)
      refute_includes texts_for(npc), CALL_LINE
    end

    test "a call entry beside voiced and ring lists every knot once" do
      mapping = { 'eventPattern' => 'x', 'conversationMode' => 'phone-chat', 'targetKnot' => 'ring_call', 'ring' => true }
      knots = TtsLineExtractor.call_start_knots(npc('voiced' => true, 'eventMappings' => [mapping],
                                                    'call' => { 'knot' => 'ring_call' }))
      assert_equal %w[start ring_call], knots
    end

    test "the lines are the same as a ring mapping on the same knot (no new keys for the same text)" do
      mapping = { 'eventPattern' => 'x', 'conversationMode' => 'phone-chat', 'targetKnot' => 'ring_call', 'ring' => true }
      assert_equal texts_for(npc('eventMappings' => [mapping])).sort,
                   texts_for(npc('call' => { 'knot' => 'ring_call' })).sort
    end
  end
end
