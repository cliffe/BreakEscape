require 'json'

module BreakEscape
  class InkTextValidator
    # Validate that text exists in the NPC's compiled Ink JSON.
    # The story is read with InkLineWalker (the same reader the TTS batch
    # uses), so escaped quotes, joined fragments and sequences match the text
    # the client actually shows. Compiled Ink stores dialogue as ^-prefixed
    # strings, e.g. "^Sarah: Hi! You must be the IT contractor."
    #
    # The client sends text WITHOUT the speaker prefix (just "Hi! You must be...")
    # since speaker detection happens client-side via parsing.
    #
    # @param ink_json_path [String] Path to compiled .json file
    # @param text [String] Text to validate (may or may not include "Speaker: " prefix)
    # @return [Boolean]
    def self.validate(ink_json_path, text)
      return false unless File.exist?(ink_json_path)
      return false if text.blank?

      walker = InkLineWalker.cached_for_file(ink_json_path)
      normalized_request = normalize(text)

      # Whole lines as the client shows them (fragments joined, sequences expanded).
      walker.lines.each do |line|
        return true if line_matches?(line.raw, normalized_request)
      end

      # Each ^text fragment on its own, unescaped by the JSON parser.
      walker.fragments.each do |fragment|
        return true if line_matches?(fragment, normalized_request)

        # Also accept if the Ink string (stripped of speaker) is contained within
        # the requested text. This handles Ink variable substitutions like {player_name()}
        # which split a single dialog line into multiple ^-strings at compile time,
        # e.g. "^Agent 0x99: " + [var] + "^, thanks for getting here on short notice."
        # The client sends the fully-rendered text; we check that a meaningful static
        # fragment from the story is present within it.
        normalized_fragment = normalize(fragment.sub(/\A[^:]+:\s*/, ""))
        if normalized_fragment.length >= 10 && normalized_request.include?(normalized_fragment)
          return true
        end
      end

      false
    rescue JSON::ParserError => e
      Rails.logger.warn "[TTS] Unreadable ink JSON #{ink_json_path}: #{e.message}"
      false
    end

    # Exact match on the line, the line without its speaker prefix, or (if the
    # client stripped an internal "phrase: " too) without a second prefix.
    def self.line_matches?(ink_text, normalized_request)
      return true if normalize(ink_text) == normalized_request

      # Ink stores "^Sarah: Hello" but client may send just "Hello"
      dialog_only = ink_text.sub(/\A[^:]+:\s*/, "")
      return true if normalize(dialog_only) == normalized_request

      # A dialog line like "...manage the response: contain the attack" may be sent by the
      # client as just "contain the attack" if client-side colon-splitting misfired.
      dialog_after_colon = dialog_only.sub(/\A[^:]+:\s*/, "")
      dialog_after_colon.present? && normalize(dialog_after_colon) == normalized_request
    end

    def self.normalize(text)
      text.to_s.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
    end
    private_class_method :line_matches?
  end
end
