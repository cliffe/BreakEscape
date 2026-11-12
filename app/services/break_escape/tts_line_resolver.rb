module BreakEscape
  # The line of a game's scenario that a /tts request asks for (anti-abuse).
  # The request only chooses a line: the result is that line's own text, and
  # it alone is voiced, keyed, recorded and looked up from then on, so the
  # request's text never reaches the voice or the cache key. Matching rule:
  # TtsService.match_form.
  #
  # An NPC voices only its own lines: lines the scenario's stories voice as
  # that NPC (TtsLineExtractor#spoken_line, the batch's own reading), lines of
  # its own story the extractor can't place that the client would voice as it
  # (InkTextValidator with voiced_as), its barks, and the scenario's shared
  # chatter. Never the narrator's lines or another speaker's, and never a
  # line's speaker prefix.
  #
  # GamesController#tts and the mission test (tts_mission_lines_test.rb) both
  # call this, so the test checks the endpoint's own chain.
  class TtsLineResolver
    # line: the text to voice, or nil with status (a Rails status symbol) and error
    Result = Struct.new(:line, :status, :error, keyword_init: true)

    # @param scenario_name [String, nil] the mission's name (extractor cache key)
    # @param scenario_data [Hash] the game's scenario
    # @param compile [Boolean] compile an .ink newer than its JSON first (the
    #   game does; tests read the committed JSON, InkStoryFile)
    # @param story_file [#call, nil] storyPath => compiled story path, or nil;
    #   only for fixture tests. The game and the mission tests use InkStoryFile,
    #   the lookup GamesController#ink uses, so all of them read the same file.
    # @param player_name [String] the only value a player_name() line is voiced with
    def initialize(scenario_name:, scenario_data:, compile: true, story_file: nil,
                   player_name: TtsService::PLAYER_NAME_DEFAULT)
      @scenario_name = scenario_name
      @scenario_data = scenario_data
      @story_file = story_file || ->(story_path) { InkStoryFile.find(story_path, compile: compile) }
      @player_name = player_name
    end

    # @param npc [Hash] the NPC or object record the request names
    # @return [Result]
    def resolve(npc_id, npc, text)
      if npc_id == 'narrator' && npc['skipTextValidation']
        # The narrator: lines the client voices as the narrator (a Narrator:
        # prefix or a #speaker:narrator tag), its own barks, and Narrator:
        # lines the extractor can't place (glue, player_name(), stories that
        # host no voiced conversation).
        line = spoken_line(npc_id, text) || ScenarioBarkValidator.canonical(npc, text) ||
               narrator_line_in_stories(text)
        return found(line) if line

        refuse(:forbidden, 'Text not found in scenario stories', "Narrator text not in any scenario story for #{npc_id}", text)
      elsif npc['storyPath']
        story = @story_file.call(npc['storyPath'])
        unless story
          Rails.logger.error "[TTS] Ink story file not found for NPC #{npc_id}: #{npc['storyPath']}"
          return Result.new(status: :not_found, error: 'NPC story file not found')
        end

        # A co-speaker's line can live in another NPC's story (Vance in HaX's
        # debrief, HaX in Netherton's): spoken_line finds it under the speaker.
        # Barks (eventMappings / timedMessages) and chatter sit beside a story.
        line = spoken_line(npc_id, text) || own_story_line(npc_id, npc, story.to_s, text) ||
               ScenarioBarkValidator.canonical(npc, text) || shared_chatter_line(npc, text)
        return found(line) if line

        refuse(:forbidden, 'Text not found in NPC story or barks', "Text validation failed for NPC #{npc_id}", text)
      elsif npc['voice'].is_a?(Hash)
        # Scenario-only NPC with no story of its own: its barks, shared chatter,
        # or lines it speaks in another NPC's story (a director in a briefing).
        line = ScenarioBarkValidator.canonical(npc, text) || shared_chatter_line(npc, text) ||
               spoken_line(npc_id, text)
        return found(line) if line

        refuse(:forbidden, 'Text not found in NPC barks or scenario stories', "Bark text validation failed for NPC #{npc_id}", text)
      elsif npc['voice'].is_a?(String)
        # Room object with a fixed voice message
        wanted = TtsService.match_form(text)
        return found(npc['voice'].strip) if wanted.present? && wanted == TtsService.match_form(npc['voice'])

        refuse(:forbidden, 'Text not found in object', "Text validation failed for room object #{npc_id}", text)
      else
        Result.new(status: :bad_request, error: 'Cannot validate text for this object')
      end
    end

    # The NPC or object record npc_id names in a scenario: the top-level
    # narrator, a room NPC, a room object (e.g. a phone item with ttsVoice),
    # then a headless record (social.characters.*.emailRecord, data contract
    # 00 S8), after every room so a room NPC or object keeps its id.
    def self.find_npc(scenario_data, npc_id)
      return scenario_data['narrator'] if npc_id == 'narrator' && scenario_data['narrator']

      scenario_data['rooms']&.each_value do |room|
        room['npcs']&.each { |npc| return npc if npc['id'] == npc_id }
        room['objects']&.each { |obj| return obj if obj['id'] == npc_id }
      end
      Game.headless_npc_records(scenario_data).find { |npc| npc['id'] == npc_id }
    end

    # The extractor for this scenario (cached across requests), or nil.
    def extractor
      return @extractor if defined?(@extractor)

      @extractor = @scenario_name ? TtsLineExtractor.cached(@scenario_name, @scenario_data) : nil
    rescue StandardError => e
      Rails.logger.warn "[TTS] Line extractor failed for #{@scenario_name}: #{e.class}: #{e.message}"
      @extractor = nil
    end

    private

    # A voice message is voiced only as its transcript (own_story_line), so a
    # line still marked "voice:" on any path is refused, never read out with it
    def found(line)
      return refuse(:forbidden, 'Voice message marker in line', 'Line still marked voice:', line) if line.match?(VOICE_MESSAGE)

      Result.new(line: line)
    end

    def refuse(status, error, log, text)
      Rails.logger.warn "[TTS] #{log}: #{text.truncate(60)}"
      Result.new(status: status, error: error)
    end

    # The line, as the batch voices it, that a story of this scenario voices
    # as npc_id with this text, or nil. A request carrying the speaker's own
    # prefix ("Kevin Park: ...", "Narrator: ...") is served the line without
    # it, so the prefix is never voiced; another speaker's prefix finds nothing.
    def spoken_line(npc_id, text)
      ex = extractor
      return nil unless ex

      line = ex.spoken_line(npc_id, text)
      return line if line

      speaker, rest = ex.voiced_as(text, npc_id)
      speaker == npc_id && rest != text.strip ? ex.spoken_line(npc_id, rest) : nil
    end

    # A phone-chat voice message: "voice: ..." (phone-chat-ui.js addMessage)
    VOICE_MESSAGE = /\Avoice:\s*/i.freeze

    # A line of the NPC's own story that the client voices as this NPC. Where
    # the story hosts a voiced conversation the extractor has read its placed
    # lines already, so only what it can't place is looked at here. A voice
    # message ("voice: ..." in a phone-chat thread, phone-chat-ui.js) is voiced
    # as the transcript after "voice:", whatever the record: the client sends
    # that transcript for any contact it opens in phone-chat, phone or person.
    # A phone contact's text conversation voices only its voice messages.
    def own_story_line(npc_id, npc, story, text)
      ex = extractor
      voiced_as =
        if ex
          lambda do |raw|
            speaker, voiced = ex.voiced_as(raw, npc_id)
            speaker == npc_id ? voiced : nil
          end
        else
          own = [npc_id, npc['displayName']].compact.map(&:downcase)
          lambda do |raw|
            prefix, rest = InkLineWalker.split_prefix(raw)
            next raw.strip if prefix.nil?

            own.include?(prefix.downcase) ? rest : nil
          end
        end
      host = ex&.hosts&.any? { |h| h['id'] == npc_id && h['storyPath'] == npc['storyPath'] }
      options = { player_names: [@player_name] }
      line = host ? InkTextValidator.canonical(story, text, voiced_as: voiced_as, placed: false, **options) : nil
      return line if line

      voice_message = lambda do |raw|
        voiced = voiced_as.call(raw)
        voiced&.match?(VOICE_MESSAGE) ? voiced.sub(VOICE_MESSAGE, '').strip.presence : nil
      end
      # A host's voice messages the extractor has placed already (as their
      # transcript), so only its unplaced ones are indexed here
      line = InkTextValidator.canonical(story, "voice: #{text}", voiced_as: voice_message, placed: !host, **options)
      return line if line
      return nil if host || npc['npcType'] == 'phone'

      InkTextValidator.canonical(story, text, voiced_as: voiced_as, **options)
    end

    # A Narrator: line of one of this game's stories, as the story has it
    # (prefix left off), or nil. Each story is indexed once (InkTextValidator).
    def narrator_line_in_stories(text)
      stories = []
      @scenario_data['rooms']&.each_value do |room|
        room['npcs']&.each { |n| stories << n['storyPath'] }
      end
      Array(@scenario_data['npcs']).each { |n| stories << n['storyPath'] if n.is_a?(Hash) }
      stories.compact.uniq.each do |story|
        path = @story_file.call(story)
        line = path && InkTextValidator.canonical(path.to_s, text, player_names: [@player_name], narrator_only: true)
        return line if line
      end
      nil
    end

    # A line of the scenario's shared chatter pools, which any NPC with a
    # voice may speak (office life, OFFICE_LIFE_PLAN 11.3).
    def shared_chatter_line(npc, text)
      return nil unless npc['voice'].is_a?(Hash)

      ScenarioBarkValidator.canonical_shared(@scenario_data, text)
    end
  end
end
