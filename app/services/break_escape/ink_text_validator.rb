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
    # (ASCII case, punctuation, spacing and invisible characters aside, the
    # same letters and digits). Candidates, in order:
    #   1. whole lines as the client shows them (InkLineWalker#lines);
    #   2. each ^text fragment on its own;
    #   3. lines the walker could not place (glue, a divert mid-line) as their
    #      own text, if they print no value;
    #   4. pieces of a glued line (`<>`) joined: 2 to MAX_GLUED pieces in a row
    #      from the same container, each joined with a space, none printing a
    #      value;
    #   5. lines whose only printed values are player_name(): the ink's text
    #      with the game's player name (player_names, as the server holds it)
    #      put in.
    # A line that prints any other value (a number, game state, a string
    # variable changed in play, an unknown variable, another external
    # function) is never voiced: voiced lines print no variables, and a slot
    # filled from the request would voice the request's text.
    #
    # Each story's candidates are indexed once (by match form), so a request
    # costs one hash lookup however long the story is.
    #
    # @param ink_json_path [String] Path to compiled .json file
    # @param text [String] Requested text (may or may not include "Speaker: " prefix)
    # @param player_names [Array<String>] what a player_name() slot may hold
    # @param narrator_only [Boolean] only lines with a Narrator: prefix
    # @return [String, nil] the story's text for the line, or nil
    def self.canonical(ink_json_path, text, player_names: [TtsService::PLAYER_NAME_DEFAULT], narrator_only: false)
      return nil unless File.exist?(ink_json_path)

      wanted = TtsService.match_form(text)
      return nil if wanted.blank?

      walker = InkLineWalker.cached_for_file(ink_json_path)
      index_for(ink_json_path.to_s, walker, Array(player_names), narrator_only)[wanted]
    rescue JSON::ParserError => e
      Rails.logger.warn "[TTS] Unreadable ink JSON #{ink_json_path}: #{e.message}"
      nil
    end

    # @return [Boolean]
    def self.validate(ink_json_path, text, **options)
      !canonical(ink_json_path, text, **options).nil?
    end

    MAX_GLUED = 4
    # A line the client voices as the narrator (person-chat parseDialogueLine)
    NARRATOR_LINE = /\ANarrator\s*(\[[^\]]*\])?\s*:/i.freeze

    # { match form => the story's text } for one story, built on first use and
    # kept while the walker (cached per file, by mtime and size) is the same.
    def self.index_for(path, walker, player_names, narrator_only)
      entry = index_cache[path]
      entry = index_cache[path] = { walker: walker, indexes: Concurrent::Map.new } unless entry && entry[:walker].equal?(walker)
      entry[:indexes].compute_if_absent([player_names, narrator_only]) do
        build_index(walker, player_names, narrator_only).freeze
      end
    end

    def self.index_cache
      @index_cache ||= Concurrent::Map.new
    end

    def self.build_index(walker, player_names, narrator_only)
      index = {}
      keep = ->(raw) { !narrator_only || raw.to_s.strip.match?(NARRATOR_LINE) }
      walker.lines.each { |line| add_line(index, line.raw) if keep.call(line.raw) }
      walker.fragments.each { |fragment| add_line(index, fragment) if keep.call(fragment) }
      walker.unresolved.each do |u|
        next unless keep.call(u.text)

        slots = Array(u.slots)
        if slots.empty?
          # A line still holding a `{...}` placeholder is not text the client shows
          add_line(index, u.text) unless u.text.include?('{')
        elsif u.template && slots.all? { |kind| kind == :player_name }
          player_names.each do |name|
            add_line(index, u.template.map { |part| part.is_a?(Symbol) ? name : part }.join.gsub(/[ \t]+/, " "))
          end
        end
      end
      glued_runs(walker.unresolved).each { |joined| add_line(index, joined) if keep.call(joined) }
      index
    end

    # The line itself, the line without its speaker prefix, or (if the client
    # stripped an internal "phrase: " too) without a second prefix, each under
    # its match form, as the story has it. The first candidate wins a form.
    def self.add_line(index, ink_text)
      candidate = ink_text.to_s.strip
      # Ink stores "^Sarah: Hello" but client may send just "Hello"
      dialog_only = candidate.sub(/\A[^:]+:\s*/, "")
      # A dialog line like "...manage the response: contain the attack" may be sent by the
      # client as just "contain the attack" if client-side colon-splitting misfired.
      dialog_after_colon = dialog_only.sub(/\A[^:]+:\s*/, "")
      [candidate, dialog_only, dialog_after_colon].each do |variant|
        form = TtsService.match_form(variant)
        index[form] ||= variant if form.present?
      end
    end

    # Every run of 2 to MAX_GLUED glue pieces in a row from one container,
    # joined. A piece that prints a value ends the run.
    def self.glued_runs(unresolved)
      runs = []
      unresolved.each_with_index do |u, i|
        next unless u.reason == 'glue' && Array(u.slots).empty?

        pieces = [u.text]
        unresolved[(i + 1)..].each do |nxt|
          break unless nxt.reason == 'glue' && nxt.path == u.path && Array(nxt.slots).empty? && pieces.length < MAX_GLUED

          pieces << nxt.text
          runs << pieces.join(" ").gsub(/[ \t]+/, " ").strip
        end
      end
      runs
    end
    private_class_method :index_for, :index_cache, :build_index, :add_line, :glued_runs
  end
end
