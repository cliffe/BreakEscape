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
    # Comparison is on TtsService.match_form (case, punctuation, spacing and
    # invisible characters aside, the same letters and digits), to be resilient
    # to minor punctuation differences between the scenario JSON and what the
    # client renders. canonical returns the scenario's own text, which is what
    # the endpoint voices and keys.
    #
    # @param npc  [Hash]   NPC data hash from the loaded scenario
    # @param text [String] Text the client is requesting TTS for
    # @return [String, nil] the bark as the scenario has it
    def self.canonical(npc, text)
      first_match(bark_texts(npc), text)
    end

    # @return [Boolean]
    def self.validate(npc, text)
      !canonical(npc, text).nil?
    end

    # Collect every possible bark string from a scenario NPC definition.
    # @param npc [Hash]
    # @return [Array<String>]
    def self.bark_texts(npc)
      event_bark_texts(npc) + chatter_texts(npc["chatter"])
    end

    # The barks an NPC says on events and timers, without its chatter pools:
    # eventMappings `bark` and `sendTimedMessage.message`, and `timedMessages`.
    # TtsLineExtractor lists these in the batch.
    # @param npc [Hash]
    # @return [Array<String>]
    def self.event_bark_texts(npc)
      raw_event_bark_texts(npc).filter_map do |text|
        spoken = spoken_bark_text(npc, text)
        spoken unless spoken.empty?
      end
    end

    # The barks as authored, before the client's own-name strip.
    # @param npc [Hash]
    # @return [Array<String>]
    def self.raw_event_bark_texts(npc)
      texts = []

      Array(npc["eventMappings"]).each do |mapping|
        next unless mapping.is_a?(Hash)

        texts << mapping["bark"] if mapping["bark"].present?

        stm = mapping["sendTimedMessage"]
        texts << stm["message"] if stm.is_a?(Hash) && stm["message"].present?
      end

      Array(npc["timedMessages"]).each do |msg|
        texts << msg["message"] if msg.is_a?(Hash) && msg["message"].present?
      end

      texts
    end

    # JS \s (and String#trim) as a regexp class body. Single-quoted on purpose:
    # the regexp engine reads the \u escapes, Ruby must not.
    JS_SPACE = '\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff'
    PLAYER_LINE = /\A(?:you|player)[#{JS_SPACE}]*:[#{JS_SPACE}]*[^#{JS_SPACE}]/i
    NARRATOR_LINE = /\Anarrator(?:[#{JS_SPACE}]*\[[^\]]*\])?[#{JS_SPACE}]*:[#{JS_SPACE}]*[^#{JS_SPACE}]/i
    PREFIX_TAIL = /\A[#{JS_SPACE}]*:[#{JS_SPACE}]*/

    # What the client voices for a bark: a port of phoneBarkText
    # (phone-chat-speaker.js), which npc-barks.js runs every bark through before
    # it sends the text to /tts. Per line (split on newlines, trimmed, blanks
    # dropped): a `You:` / `Player:` line and a `Narrator:` line are left out,
    # and a leading `<displayName>:`, `<id>:` or `<id with spaces>:` naming the
    # NPC itself is dropped (case-insensitive, any space around the colon; kept
    # when nothing would remain). Remaining lines are rejoined with a newline.
    #
    # Whitespace is JS's `\s` and `trim()`: the Unicode spaces including NBSP
    # and U+FEFF. Ruby's [[:space:]] is nearly that set but also takes U+0085
    # and lacks U+FEFF, so JS_SPACE lists the JS set outright. Case folding
    # follows JS `/i` without the `u` flag (see fold_char). One difference
    # remains: JS works in UTF-16 units, so a name with characters outside the
    # BMP could fold differently there; no scenario has one. The Unicode
    # version also differs: Ruby 2.7.8 uses Unicode 12.1 tables, current JS
    # engines newer ones, so a few letters added since fold differently
    # (16 inputs, among them U+019B, U+0264, U+1C8A, U+2C5F, U+A7C1 and most of
    # U+A7C8 to U+A7F6); no scenario name uses them.
    # @param npc [Hash]
    # @param text [String]
    # @return [String] '' when nothing in it is the NPC's
    def self.spoken_bark_text(npc, text)
      return "" unless text.is_a?(String)

      names = own_names(npc)
      text.split("\n").map { |l| js_strip(l) }.reject(&:empty?).filter_map do |line|
        next if line.match?(PLAYER_LINE) || line.match?(NARRATOR_LINE)

        strip_own_prefix(line, names)
      end.join("\n")
    end

    # String#strip for JS whitespace.
    private_class_method def self.js_strip(str)
      str.gsub(/\A[#{JS_SPACE}]+|[#{JS_SPACE}]+\z/, "")
    end

    # JS's regexp /i (no `u` flag) canonicalisation of one character: its
    # single-character uppercase, unless that is several characters or maps a
    # non-ASCII character to ASCII. Ruby's own /i uses full case folding
    # (ß matches "ss"), which JS does not.
    private_class_method def self.fold_char(char)
      up = char.upcase
      return char if up.length != 1 || (char.ord >= 128 && up.ord < 128)

      up
    end

    # The names an NPC's own lines may be prefixed with, longest first, as
    # contactNames does: displayName, id, and id with underscores as spaces.
    private_class_method def self.own_names(npc)
      id = npc["id"]
      [npc["displayName"], id, id.is_a?(String) ? id.tr("_", " ") : nil]
        .select { |n| n.is_a?(String) && !js_strip(n).empty? }
        .map { |n| js_strip(n).downcase }.uniq.sort_by { |n| -n.length }
    end

    private_class_method def self.strip_own_prefix(line, names)
      line_chars = line.chars
      names.each do |name|
        name_chars = name.chars
        next if line_chars.length < name_chars.length
        next unless name_chars.each_with_index.all? { |c, i| fold_char(c) == fold_char(line_chars[i]) }

        tail = line_chars[name_chars.length..].join
        m = tail.match(PREFIX_TAIL)
        next unless m

        rest = js_strip(tail[m[0].length..])
        return rest.empty? ? line : rest
      end
      line
    end

    # True when text is a line of one of the scenario's own chatter pools
    # (scenario['chatter']), which any NPC with a voice may speak. The caller
    # checks that the NPC has a voice.
    # @param scenario [Hash] the game's scenario data
    # @param text [String]
    # @return [Boolean]
    def self.validate_shared(scenario, text)
      !canonical_shared(scenario, text).nil?
    end

    # The scenario chatter line text asks for, as the scenario has it, or nil.
    def self.canonical_shared(scenario, text)
      return nil unless scenario.is_a?(Hash)

      first_match(chatter_texts(scenario["chatter"]), text)
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

    private_class_method def self.first_match(candidates, text)
      wanted = TtsService.match_form(text)
      return nil if wanted.blank?

      candidates.each do |candidate|
        return candidate.strip if candidate.is_a?(String) && TtsService.match_form(candidate) == wanted
      end
      nil
    end
  end
end
