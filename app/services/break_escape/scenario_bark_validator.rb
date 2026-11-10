module BreakEscape
  class ScenarioBarkValidator
    # Validate that text matches one of an NPC's scenario-defined bark texts.
    #
    # Bark texts are sourced from:
    #   - npc['eventMappings'][].bark                     — inline bark on an event
    #   - npc['eventMappings'][].sendTimedMessage.message — deferred bark from an event
    #   - npc['timedMessages'][].message                  — scheduled timed messages
    #   - npc['chatter'][<topic>]                         — the NPC's own chatter pools
    #                                                       (office life, OFFICE_LIFE_PLAN 11.3)
    #
    # Scenario-level chatter pools (scenario['chatter']) can be spoken by any NPC
    # with a voice: validate_shared checks those.
    #
    # Comparison is normalised (lowercase, strip punctuation, collapse whitespace)
    # to be resilient to minor punctuation differences between the scenario JSON
    # and what the client actually renders/sends.
    #
    # @param npc  [Hash]   NPC data hash from the loaded scenario
    # @param text [String] Text the client is requesting TTS for
    # @return [Boolean]
    def self.validate(npc, text)
      return false if text.blank?

      normalized_request = normalize(text)

      bark_texts(npc).any? { |bark_text| normalize(bark_text) == normalized_request }
    end

    # Collect every possible bark string from a scenario NPC definition.
    # @param npc [Hash]
    # @return [Array<String>]
    def self.bark_texts(npc)
      texts = []

      Array(npc["eventMappings"]).each do |mapping|
        texts << mapping["bark"] if mapping["bark"].present?

        stm = mapping["sendTimedMessage"]
        texts << stm["message"] if stm.is_a?(Hash) && stm["message"].present?
      end

      Array(npc["timedMessages"]).each do |msg|
        texts << msg["message"] if msg["message"].present?
      end

      texts.concat(chatter_texts(npc["chatter"]))
    end

    # True when text is a line of one of the scenario's own chatter pools
    # (scenario['chatter']), which any NPC with a voice may speak. The caller
    # checks that the NPC has a voice.
    # @param scenario [Hash] the game's scenario data
    # @param text [String]
    # @return [Boolean]
    def self.validate_shared(scenario, text)
      return false if text.blank? || !scenario.is_a?(Hash)

      normalized_request = normalize(text)
      chatter_texts(scenario["chatter"]).any? { |line| normalize(line) == normalized_request }
    end

    # Every line of a chatter config: { topic => [lines] | { "lines" => [lines], ... } }.
    # `false` (built-ins off) and anything else malformed give no lines.
    # @return [Array<String>]
    def self.chatter_texts(chatter)
      return [] unless chatter.is_a?(Hash)

      chatter.values.flat_map do |pool|
        lines = pool.is_a?(Hash) ? pool["lines"] : pool
        Array(lines).select { |l| l.is_a?(String) && l.strip.present? }
      end
    end

    private_class_method def self.normalize(text)
      text.to_s.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
    end
  end
end
