module BreakEscape
  class ScenarioBarkValidator
    # Validate that text matches one of an NPC's scenario-defined bark texts.
    #
    # Bark texts are sourced from:
    #   - npc['eventMappings'][].bark                     — inline bark on an event
    #   - npc['eventMappings'][].sendTimedMessage.message — deferred bark from an event
    #   - npc['timedMessages'][].message                  — scheduled timed messages
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

      texts
    end

    private_class_method def self.normalize(text)
      text.to_s.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
    end
  end
end
