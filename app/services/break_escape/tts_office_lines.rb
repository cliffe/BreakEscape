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
  # The extractor's entries are already unique by cache key (voice and text), so a shared line two
  # NPCs with one voice could speak counts once; the stage 2 price and the merge gate's
  # "0 uncached office-life clips" both count these distinct keys. A line whose key a person-chat
  # line already holds is listed under that line, not here.
  class TtsOfficeLines
    CHATTER_PATHS = %w[npc.chatter scenario.chatter].freeze

    Clip = Struct.new(:npc_id, :text, :kind, :knot, :key, :cached, keyword_init: true)
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
      @extractor = TtsLineExtractor.new(scenario_name, scenario_data, tts_service: tts_service, chatter: true)
    end

    # { knot => 'exchange' | 'call' } over every room NPC.
    def office_knots
      out = {}
      (@data['rooms'] || {}).each_value do |room|
        Array(room.is_a?(Hash) ? room['npcs'] : nil).each do |npc|
          next unless npc.is_a?(Hash)

          Array(npc['exchanges']).each { |e| out[e['knot']] ||= 'exchange' if e.is_a?(Hash) && e['knot'].is_a?(String) }
          Array(npc['phoneCalls']).each { |e| out[e['knot']] ||= 'call' if e.is_a?(Hash) && e['knot'].is_a?(String) }
        end
      end
      out
    end

    def report
      knots = office_knots
      clips = @extractor.entries.filter_map do |e|
        if CHATTER_PATHS.include?(e.path)
          kind = 'chatter'
          knot = nil
        else
          knot = TtsLineExtractor.line_knot(e.path.to_s.split(':', 2).last)
          kind = knots[knot]
          next unless kind
        end
        [e.voice, Clip.new(npc_id: e.npc_id, text: e.text, kind: kind, knot: knot, key: e.key,
                           cached: File.exist?(@cache_dir.join(@scenario_name, "#{e.key}.mp3")))]
      end
      voices = clips.group_by { |voice, _| [voice['name'], voice['style'], voice['language']] }.map do |(name, style, lang), list|
        cl = list.map(&:last)
        label = [name, lang, style && "style #{Digest::SHA256.hexdigest(style.to_s)[0, 8]}"].compact.join(' ')
        Voice.new(label: label, npc_ids: cl.map(&:npc_id).uniq.sort, clips: cl)
      end
      Report.new(scenario: @scenario_name, voices: voices.sort_by(&:label))
    end
  end
end
