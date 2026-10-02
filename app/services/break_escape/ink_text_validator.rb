require 'json'

module BreakEscape
  class InkTextValidator
    # Validate that text exists in the NPC's compiled Ink JSON.
    # Compiled Ink stores dialog as ^-prefixed strings, e.g.:
    #   "^Sarah: Hi! You must be the IT contractor."
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

      ink_data = File.read(ink_json_path)
      normalized_request = normalize(text)

      # Extract all ^-prefixed text strings from the compiled Ink JSON
      # These are the dialog lines in Ink's compiled format
      ink_data.scan(/"(\^[^"]*)"/).flatten.each do |ink_text|
        # Remove the ^ prefix
        clean_text = ink_text[1..]

        # Match against the full text (with speaker prefix)
        return true if normalize(clean_text) == normalized_request

        # Also match against text with speaker prefix stripped
        # Ink stores "^Sarah: Hello" but client may send just "Hello"
        dialog_only = clean_text.sub(/\A[^:]+:\s*/, "")
        return true if normalize(dialog_only) == normalized_request

        # Also match if the client stripped an internal "phrase: " prefix from the dialog.
        # A dialog line like "...manage the response: contain the attack" may be sent by the
        # client as just "contain the attack" if client-side colon-splitting misfired.
        # Accept if normalized_request matches dialog_only with any leading "x: " stripped.
        dialog_after_colon = dialog_only.sub(/\A[^:]+:\s*/, "")
        return true if dialog_after_colon.present? && normalize(dialog_after_colon) == normalized_request

        # Also accept if the Ink string (stripped of speaker) is contained within
        # the requested text. This handles Ink variable substitutions like {player_name()}
        # which split a single dialog line into multiple ^-strings at compile time,
        # e.g. "^Agent 0x99: " + [var] + "^, thanks for getting here on short notice."
        # The client sends the fully-rendered text; we check that a meaningful static
        # fragment from the story is present within it.
        normalized_fragment = normalize(dialog_only)
        if normalized_fragment.length >= 10 && normalized_request.include?(normalized_fragment)
          return true
        end
      end

      false
    end

    private

    def self.normalize(text)
      text.to_s.downcase.gsub(/[^\w\s]/, "").strip.gsub(/\s+/, " ")
    end
  end
end
