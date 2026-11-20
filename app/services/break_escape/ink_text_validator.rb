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
    # same letters and digits). Candidates:
    #   1. whole lines as the walker places them (InkLineWalker#lines), unless
    #      placed: false (the story is a host the TtsLineExtractor already
    #      reads, so only what it cannot place is wanted here);
    #   2. lines the walker could not place (glue, a divert mid-line) as their
    #      own text, if they print no value;
    #   3. pieces of a glued line (`<>`) joined: 2 to MAX_GLUED pieces in a row
    #      from the same container, each joined with a space, none printing a
    #      value;
    #   4. lines whose only printed values are player_name(): the ink's text
    #      with the game's player name (player_names, as the server holds it)
    #      put in.
    # A line that prints any other value (a number, game state, a string
    # variable changed in play, an unknown variable, another external
    # function) is never voiced, nor any piece of it: voiced lines print no
    # variables, and a slot filled from the request would voice the
    # request's text.
    #
    # Who may voice a line: with narrator_only, only Narrator: lines; with
    # voiced_as (a callable from the line's raw ink text to the text the
    # client voices it with as this NPC, or nil when the client voices it as
    # someone else), only that NPC's lines. A line's speaker prefix is never
    # voiced: a request with or without it is served the text after it.
    #
    # Each story's candidates are indexed once (by match form), so a request
    # costs one hash lookup however long the story is.
    #
    # @param ink_json_path [String] Path to compiled .json file
    # @param text [String] Requested text (may or may not include "Speaker: " prefix)
    # @param player_names [Array<String>] what a player_name() slot may hold
    # @param narrator_only [Boolean] only lines with a Narrator: prefix
    # @param voiced_as [#call, nil] raw line => voiced text for this NPC, or nil
    # @param placed [Boolean] include the lines the walker places
    # @return [String, nil] the story's text for the line, or nil
    def self.canonical(ink_json_path, text, player_names: [TtsService::PLAYER_NAME_DEFAULT], narrator_only: false,
                       voiced_as: nil, placed: true)
      wanted = TtsService.match_form(text)
      return nil if wanted.blank?

      walker = InkLineWalker.cached_for_file(ink_json_path)
      Array(index_for(ink_json_path.to_s, walker, Array(player_names), placed)[wanted]).each do |raw|
        prefix, rest = InkLineWalker.split_prefix(raw)
        voiced =
          if narrator_only
            prefix&.match?(NARRATOR_PREFIX) ? rest : nil
          elsif voiced_as
            voiced_as.call(raw)
          else
            prefix ? rest : raw
          end
        return voiced if voiced.present?
      end
      nil
    rescue JSON::ParserError, Errno::ENOENT, Errno::EISDIR => e
      # A missing story, or one replaced or half written by a recompile
      # between two reads: no line, so the request is refused, not a 500.
      Rails.logger.warn "[TTS] Unreadable ink JSON #{ink_json_path}: #{e.class}: #{e.message}"
      nil
    end

    # @return [Boolean]
    def self.validate(ink_json_path, text, **options)
      !canonical(ink_json_path, text, **options).nil?
    end

    MAX_GLUED = 4
    # The prefix of a line the client voices as the narrator (InkLineWalker.split_prefix)
    NARRATOR_PREFIX = /\ANarrator(\[|\z)/i.freeze

    # { match form => [raw ink text, ...] } for one story, built on first use
    # and kept while the walker (cached per file, by mtime and size) is the same.
    def self.index_for(path, walker, player_names, placed)
      entry = index_cache[path]
      entry = index_cache[path] = { walker: walker, indexes: Concurrent::Map.new } unless entry && entry[:walker].equal?(walker)
      entry[:indexes].compute_if_absent([player_names, placed]) do
        build_index(walker, player_names, placed).each_value(&:freeze).freeze
      end
    end

    def self.index_cache
      @index_cache ||= Concurrent::Map.new
    end

    def self.build_index(walker, player_names, placed)
      index = {}
      walker.lines.each { |line| add_line(index, line.raw) } if placed
      walker.unresolved.each do |u|
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
      glued_runs(walker.unresolved).each { |joined| add_line(index, joined) }
      index
    end

    # The whole line and the line without its speaker prefix, each a form a
    # request may arrive in.
    def self.match_forms(raw)
      _prefix, rest = InkLineWalker.split_prefix(raw)
      [TtsService.match_form(raw.to_s.strip), TtsService.match_form(rest)].compact.uniq
    end

    def self.add_line(index, ink_text)
      raw = ink_text.to_s.strip
      match_forms(raw).each do |form|
        next if form.empty?

        list = (index[form] ||= [])
        list << raw unless list.include?(raw)
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
    private_class_method :index_for, :index_cache, :build_index, :match_forms, :add_line, :glued_runs
  end
end
