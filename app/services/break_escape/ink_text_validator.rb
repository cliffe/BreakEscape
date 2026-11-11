require 'json'

module BreakEscape
  class InkTextValidator
    # Finds the line of an NPC's compiled Ink story that a TTS request asks for,
    # and returns the story's own text for it. The endpoint voices and keys that
    # text, never the request, so a request can only choose a line.
    #
    # The story is read with InkLineWalker (the same reader the TTS batch uses),
    # so escaped quotes, joined fragments and sequences match the text the
    # client actually shows. Compiled Ink stores dialogue as ^-prefixed strings,
    # e.g. "^Sarah: Hi! You must be the IT contractor."
    #
    # The client sends text WITHOUT the speaker prefix (just "Hi! You must be...")
    # since speaker detection happens client-side via parsing.
    #
    # A request matches a line when both have the same TtsService.match_form
    # (case, punctuation, spacing and invisible characters aside, the same
    # letters and digits). Candidates, in order:
    #   1. whole lines as the client shows them (InkLineWalker#lines);
    #   2. each ^text fragment on its own;
    #   3. lines the walker could not place (glue, a divert mid-line) as their
    #      own text;
    #   4. pieces of a glued line (`<>`) joined: 2 to MAX_GLUED pieces in a row
    #      from the same container, each joined with a space;
    #   5. lines that print a value the server can't know (player_name(), a
    #      variable changed in play): the request must be the line's ink text
    #      around each value, and each value one the slot allows (SLOT_VALUES:
    #      a player name the client can print, a number, or short plain ASCII
    #      text). The returned text is the ink's text with those values put in.
    #
    # @param ink_json_path [String] Path to compiled .json file
    # @param text [String] Requested text (may or may not include "Speaker: " prefix)
    # @return [String, nil] the story's text for the line, or nil
    def self.canonical(ink_json_path, text)
      return nil unless File.exist?(ink_json_path)

      wanted = TtsService.match_form(text)
      return nil if wanted.blank?

      walker = InkLineWalker.cached_for_file(ink_json_path)

      walker.lines.each do |line|
        found = line_match(line.raw, wanted)
        return found if found
      end

      walker.fragments.each do |fragment|
        found = line_match(fragment, wanted)
        return found if found
      end

      walker.unresolved.each do |u|
        # A line still holding a `{...}` placeholder is not text the client shows
        next if u.template.nil? && u.text.include?('{')

        found = u.template ? template_match(u.template, text) : line_match(u.text, wanted)
        return found if found
      end

      glued_runs(walker.unresolved).each do |joined|
        found = line_match(joined, wanted)
        return found if found
      end

      nil
    rescue JSON::ParserError => e
      Rails.logger.warn "[TTS] Unreadable ink JSON #{ink_json_path}: #{e.message}"
      nil
    end

    # @return [Boolean]
    def self.validate(ink_json_path, text)
      !canonical(ink_json_path, text).nil?
    end

    # What each kind of printed value in a template line may be. ASCII only, so
    # every character voiced is one the cache key keeps. :text (a string
    # variable changed in play, an unknown variable, another external function)
    # is up to 32 letters, digits, spaces, '.', "'" and '-', starting and ending
    # with a letter or digit: the only request text that is ever voiced.
    SLOT_VALUES = {
      player_name: TtsService::PLAYER_NAME_VALUES.map { |v| Regexp.escape(v) }.join("|"),
      number: "-?[0-9]{1,9}(?:\\.[0-9]{1,6})?|true|false",
      text: "[A-Za-z0-9](?:[A-Za-z0-9 .'-]{0,30}[A-Za-z0-9])?"
    }.freeze
    # What may sit between two words of the ink's text in a request: anything
    # that is not a letter, mark or digit (punctuation, spaces, invisibles).
    GAP = '[^\p{L}\p{M}\p{N}_]'.freeze
    MAX_SLOTS = 4
    MAX_GLUED = 4

    # The line itself, the line without its speaker prefix, or (if the client
    # stripped an internal "phrase: " too) without a second prefix: whichever
    # has the request's match form, as the story has it.
    def self.line_match(ink_text, wanted)
      candidate = ink_text.to_s.strip
      return candidate if TtsService.match_form(candidate) == wanted

      # Ink stores "^Sarah: Hello" but client may send just "Hello"
      dialog_only = candidate.sub(/\A[^:]+:\s*/, "")
      return dialog_only if TtsService.match_form(dialog_only) == wanted

      # A dialog line like "...manage the response: contain the attack" may be sent by the
      # client as just "contain the attack" if client-side colon-splitting misfired.
      dialog_after_colon = dialog_only.sub(/\A[^:]+:\s*/, "")
      return dialog_after_colon if dialog_after_colon.present? && TtsService.match_form(dialog_after_colon) == wanted

      nil
    end

    # Match a request against a template line (with and without its speaker
    # prefix). Returns the ink's text with the request's values filled in.
    def self.template_match(template, text)
      return nil if template.count { |part| part.is_a?(Symbol) } > MAX_SLOTS

      request = text.to_s.unicode_normalize(:nfc)
      variants = [template]
      if template.first.is_a?(String) && template.first.match?(/\A[^:]+:/)
        variants << [template.first.sub(/\A[^:]+:\s*/, ""), *template.drop(1)]
      end

      variants.each do |parts|
        values = request.match(template_regexp(parts))&.captures
        next unless values

        filled = parts.map { |part| part.is_a?(Symbol) ? slot_value(part, values.shift) : part }.join
        return filled.gsub(/[ \t]+/, " ").strip
      end
      nil
    rescue ArgumentError, Encoding::CompatibilityError
      nil
    end

    # Words of the ink's text in order with a GAP between them (any GAP or none
    # next to a value), each value captured by its kind's SLOT_VALUES pattern.
    # Case-insensitive.
    def self.template_regexp(parts)
      pattern = +"\\A#{GAP}*"
      parts.each do |part|
        if part.is_a?(Symbol)
          pattern << "(#{SLOT_VALUES.fetch(part)})#{GAP}*"
        else
          words = TtsService.match_form(part).to_s.split(" ")
          next if words.empty?

          pattern << words.map { |w| Regexp.escape(w) }.join("#{GAP}+") << "#{GAP}*"
        end
      end
      Regexp.new(pattern << "\\z", Regexp::IGNORECASE)
    end
    # Every run of 2 to MAX_GLUED glue pieces in a row from one container, joined.
    def self.glued_runs(unresolved)
      runs = []
      unresolved.each_with_index do |u, i|
        next unless u.reason == 'glue'

        pieces = [u.text]
        unresolved[(i + 1)..].each do |nxt|
          break unless nxt.reason == 'glue' && nxt.path == u.path && pieces.length < MAX_GLUED

          pieces << nxt.text
          runs << pieces.join(" ").gsub(/[ \t]+/, " ").strip
        end
      end
      runs
    end

    # A player name as the client prints it, whatever case the request used
    def self.slot_value(kind, value)
      return value unless kind == :player_name

      TtsService::PLAYER_NAME_VALUES.find { |name| name.casecmp?(value) } || value
    end
    private_class_method :line_match, :template_match, :template_regexp, :slot_value, :glued_runs
  end
end
