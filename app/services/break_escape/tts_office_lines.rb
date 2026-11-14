module BreakEscape
  # V6 (OFFICE_LIFE_MISSIONS_PLAN.md section 4 and 10): every office-life clip a scenario can
  # request, per voice, with its cached state under the current cache key. Read only: it renders
  # the scenario, runs TtsLineExtractor with chatter on, and looks for each clip's MP3. No key, no
  # generation, no database writes.
  #
  # Office-life clips are NPC chatter pool lines (an NPC's own `chatter`, and the scenario's shared
  # pools, which the extractor yields once for every voiced NPC), and the lines of exchange and
  # phone-call knots (an NPC's `exchanges[].knot` and `phoneCalls[].knot`). EventMapping `bark`
  # lines are outside the extractor and so outside this report (plan section 10).
  #
  # Clips are keyed as the client requests them: chatter, exchanges and desk-phone calls play
  # through NpcChatterVoice with no delivery note (npc-needs-chatter.js), so an exchange line
  # tagged #delivery: is keyed without it. Keys are unique within this report (a shared line two
  # NPCs with one voice could speak counts once); the stage 2 price and the merge gate's
  # "0 uncached office-life clips" both count these distinct keys. A clip whose key a person-chat
  # line also holds is still listed, marked shared.
  class TtsOfficeLines
    CHATTER_PATHS = %w[npc.chatter scenario.chatter].freeze

    Clip = Struct.new(:npc_id, :text, :kind, :knot, :key, :cached, :shared, keyword_init: true)
    Voice = Struct.new(:label, :npc_ids, :clips, keyword_init: true) do
      def characters
        clips.sum { |c| c.text.length }
      end
      def uncached
        clips.reject(&:cached)
      end
    end
    Report = Struct.new(:scenario, :voices, keyword_init: true) do
      def clips
        voices.flat_map(&:clips)
      end
      def characters
        clips.sum { |c| c.text.length }
      end
      def uncached
        clips.reject(&:cached)
      end
    end

    def self.for_scenario(scenario_name, cache_dir: TtsService::CACHE_DIR)
      new(scenario_name, TtsLineExtractor.render_scenario(scenario_name), cache_dir: cache_dir).report
    end

    def initialize(scenario_name, scenario_data, cache_dir: TtsService::CACHE_DIR, tts_service: TtsService.new)
      @scenario_name = scenario_name
      @data = scenario_data
      @cache_dir = Pathname.new(cache_dir.to_s)
      @tts_service = tts_service
      @extractor = TtsLineExtractor.new(scenario_name, scenario_data, tts_service: tts_service, chatter: true)
    end

    # { [storyPath, knot] => 'exchange' | 'call' } over every room NPC: the knot lives in the story
    # of the NPC that holds the exchanges or phoneCalls entry, so a knot of the same name in another
    # story is not office life.
    def office_knots
      out = {}
      (@data['rooms'] || {}).each_value do |room|
        Array(room.is_a?(Hash) ? room['npcs'] : nil).each do |npc|
          next unless npc.is_a?(Hash) && npc['storyPath'].is_a?(String)

          { 'exchanges' => 'exchange', 'phoneCalls' => 'call' }.each do |field, kind|
            Array(npc[field]).each do |e|
              out[[npc['storyPath'], e['knot']]] ||= kind if e.is_a?(Hash) && e['knot'].is_a?(String)
            end
          end
        end
      end
      out
    end

    def key_for(text, voice)
      @tts_service.cache_key_for(text, voice['name'], voice['style'], voice['language'])
    end

    def report
      knots = office_knots
      clips = []
      seen = {}
      add = lambda do |npc_id, text, kind, knot|
        voice = @extractor.voices[npc_id]
        next unless voice

        key = key_for(text, voice)
        next if seen[key]

        seen[key] = true
        clips << [voice, Clip.new(npc_id: npc_id, text: text, kind: kind, knot: knot, key: key,
                                  cached: File.exist?(@cache_dir.join(@scenario_name, "#{key}.mp3")))]
      end
      @extractor.each_host_story_line do |_host, story, line_path, npc_id, text|
        knot = TtsLineExtractor.line_knot(line_path)
        kind = knots[[story, knot]]
        add.call(npc_id, text, kind, knot) if kind
      end
      @extractor.each_chatter_line { |npc_id, text, _path| add.call(npc_id, text, 'chatter', nil) }
      person = person_chat_keys(knots)
      clips.each { |_v, c| c.shared = person.include?(c.key) }
      voices = clips.group_by { |voice, _| [voice['name'], voice['style'], voice['language']] }.map do |(name, style, lang), list|
        cl = list.map(&:last)
        label = [name, lang, style && "style #{Digest::SHA256.hexdigest(style.to_s)[0, 8]}"].compact.join(' ')
        Voice.new(label: label, npc_ids: cl.map(&:npc_id).uniq.sort, clips: cl)
      end
      Report.new(scenario: @scenario_name, voices: voices.sort_by(&:label))
    end

    # Cache keys of the person-chat batch: the extractor's entries outside chatter pools and
    # office-life knots.
    def person_chat_keys(knots)
      stories = @extractor.hosts.to_h { |h| [h['id'], h['storyPath']] }
      @extractor.entries.reject do |e|
        CHATTER_PATHS.include?(e.path) ||
          knots.key?([stories[e.source], TtsLineExtractor.line_knot(e.path.to_s.split(':', 2).last)])
      end.map(&:key).to_set
    end
  end
end
