require 'test_helper'
require_relative 'tts_mission_lines_test'

module BreakEscape
  # The "no voiced line prints a variable" check (tts_mission_lines_test.rb) reads a
  # phone contact only over the knots the extractor voices. Text-thread lines may
  # print {player_name}; a call knot, or a knot a call reaches, may not.
  class TtsPhoneTextVariablesTest < ActiveSupport::TestCase
    STORY = BreakEscape::Engine.root.join('test/fixtures/phone_text_vars/contact.json').to_s
    VOICE = { 'name' => 'Kore', 'style' => 'Phone.', 'language' => 'en-GB' }.freeze

    def printed_for(call_knot)
      npc = { 'id' => 'contact', 'displayName' => 'Contact', 'npcType' => 'phone', 'currentKnot' => 'start',
              'voice' => VOICE, 'storyPath' => STORY, 'call' => { 'knot' => call_knot } }
      ex = TtsLineExtractor.new('vars_test', { 'rooms' => { 'r' => { 'npcs' => [npc] } } })
      TtsMissionLinesTest.printed_variable_lines(ex, []).map(&:last)
    end

    test "a text-only knot that prints the player name passes" do
      assert_empty printed_for('call_clean')
    end

    test "the same contact printing it inside a call knot fails" do
      assert_equal ['Good evening, Agent.'], printed_for('call_prints')
    end

    test "a knot a call reaches counts as part of the call" do
      assert_equal ['Right, Agent.'], printed_for('call_reaches')
    end
  end
end
