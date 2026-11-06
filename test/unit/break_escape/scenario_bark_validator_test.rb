require 'test_helper'

module BreakEscape
  class ScenarioBarkValidatorTest < ActiveSupport::TestCase
    # ─── bark_texts ───────────────────────────────────────────────────────────

    test "bark_texts collects bark from eventMappings" do
      npc = { "eventMappings" => [{ "eventPattern" => "foo", "bark" => "Hello!" }] }
      assert_includes ScenarioBarkValidator.bark_texts(npc), "Hello!"
    end

    test "bark_texts collects sendTimedMessage.message from eventMappings" do
      npc = {
        "eventMappings" => [
          { "eventPattern" => "foo", "sendTimedMessage" => { "delay" => 5000, "message" => "On my way." } }
        ]
      }
      assert_includes ScenarioBarkValidator.bark_texts(npc), "On my way."
    end

    test "bark_texts collects message from timedMessages" do
      npc = { "timedMessages" => [{ "delay" => 3000, "message" => "Timer bark." }] }
      assert_includes ScenarioBarkValidator.bark_texts(npc), "Timer bark."
    end

    test "bark_texts collects from all sources at once" do
      npc = {
        "eventMappings" => [
          { "eventPattern" => "a", "bark" => "EventBark" },
          { "eventPattern" => "b", "sendTimedMessage" => { "message" => "DelayedBark" } }
        ],
        "timedMessages" => [{ "message" => "TimedBark" }]
      }
      texts = ScenarioBarkValidator.bark_texts(npc)
      assert_includes texts, "EventBark"
      assert_includes texts, "DelayedBark"
      assert_includes texts, "TimedBark"
    end

    test "bark_texts ignores mappings with no bark or sendTimedMessage" do
      npc = { "eventMappings" => [{ "eventPattern" => "foo", "targetKnot" => "some_knot" }] }
      assert_empty ScenarioBarkValidator.bark_texts(npc)
    end

    test "bark_texts returns empty array for NPC with no bark fields" do
      assert_empty ScenarioBarkValidator.bark_texts({})
    end

    # ─── validate ─────────────────────────────────────────────────────────────

    test "validate returns true for exact matching bark text" do
      npc = { "eventMappings" => [{ "bark" => "I'm coming!" }] }
      assert ScenarioBarkValidator.validate(npc, "I'm coming!")
    end

    test "validate is case-insensitive" do
      npc = { "eventMappings" => [{ "bark" => "MAJOR INCIDENT DECLARED" }] }
      assert ScenarioBarkValidator.validate(npc, "major incident declared")
    end

    test "validate strips punctuation differences" do
      npc = { "eventMappings" => [{ "bark" => "Something's wrong, please help!" }] }
      # Normalisation strips apostrophes and commas → "somethings wrong please help"
      assert ScenarioBarkValidator.validate(npc, "Something's wrong, please help!")
    end

    test "validate returns false when text is not in any bark field" do
      npc = { "eventMappings" => [{ "bark" => "I'm coming!" }] }
      refute ScenarioBarkValidator.validate(npc, "Some totally different text")
    end

    test "validate returns false for blank text" do
      npc = { "eventMappings" => [{ "bark" => "Hello" }] }
      refute ScenarioBarkValidator.validate(npc, "")
      refute ScenarioBarkValidator.validate(npc, nil)
    end

    test "validate returns false for NPC with no bark fields" do
      refute ScenarioBarkValidator.validate({}, "Some text")
    end

    test "validate matches against timedMessage text" do
      npc = { "timedMessages" => [{ "message" => "Patient alert received" }] }
      assert ScenarioBarkValidator.validate(npc, "Patient alert received")
    end

    # ─── chatter (OFFICE_LIFE_PLAN 11.3) ─────────────────────────────────────

    test "bark_texts collects the NPC's own chatter pools, arrays and { lines } objects" do
      npc = { "chatter" => { "cooler" => ["Busy day?"], "grumble" => { "lines" => ["Not now."], "hush" => true } } }
      texts = ScenarioBarkValidator.bark_texts(npc)
      assert_includes texts, "Busy day?"
      assert_includes texts, "Not now."
    end

    test "bark_texts ignores chatter false and non-string lines" do
      assert_empty ScenarioBarkValidator.bark_texts({ "chatter" => false })
      assert_empty ScenarioBarkValidator.bark_texts({ "chatter" => { "cooler" => [nil, 3, " "] } })
    end

    test "validate_shared accepts a scenario chatter line and refuses others" do
      scenario = { "chatter" => { "cooler" => ["Friday drinks again?"], "gossip" => { "lines" => ["Psst."] } } }
      assert ScenarioBarkValidator.validate_shared(scenario, "friday drinks again")
      assert ScenarioBarkValidator.validate_shared(scenario, "Psst.")
      refute ScenarioBarkValidator.validate_shared(scenario, "Something else.")
      refute ScenarioBarkValidator.validate_shared({ "chatter" => false }, "Psst.")
      refute ScenarioBarkValidator.validate_shared({}, "Psst.")
      refute ScenarioBarkValidator.validate_shared(nil, "Psst.")
    end

  end
end
