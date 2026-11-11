require 'test_helper'

module BreakEscape
  # Every line normal play voices in m01 to m10 and lab_physical_pentest, sent
  # through the /tts endpoint's own chain (TtsLineResolver, which
  # GamesController#tts calls): each must be accepted and keyed exactly as the
  # batch keys it, so no clip on disk goes silent and none is generated twice.
  #
  # Rows: every batch entry (host lines, co-speakers in another NPC's story,
  # narrator lines, pretext outcomes, room objects), every chatter line, every
  # bark, and every line of a host story the walker can't place (glue, a
  # divert mid-line, player_name()). Stories are the committed compiled JSON,
  # as the endpoint reads them when the .ink is not newer.
  class TtsMissionLinesTest < ActiveSupport::TestCase
    MISSIONS = /\A(m(0[1-9]|10)_[a-z_]+|lab_physical_pentest)\z/.freeze

    # Voiced lines that print a scenario value, by mission. Anything else that
    # prints a variable is either player text (a carried-over global) or game
    # state, and must not be voiced.
    PRINTED_ALLOWED = { 'm08_the_mole' => %w[suite_code] }.freeze

    def self.missions
      Dir.glob(Engine.root.join('scenarios', '*', 'scenario.json.erb').to_s).sort.filter_map do |erb|
        name = File.basename(File.dirname(erb))
        next unless name.match?(MISSIONS)

        [name, JSON.parse(ERB.new(File.read(erb)).result(Mission::ScenarioBinding.new({}).get_binding))]
      end
    end

    # The compiled story the endpoint reads for a storyPath (without compiling)
    def self.story_file(story_path)
      base = Engine.root.join(story_path).to_s
      [base, base.sub(/\.json\z/, '.ink.json'), base.sub(/\.ink\.json\z/, '.json')].find { |c| File.exist?(c) }
    end

    def self.missions_data
      @missions_data ||= missions
    end

    def setup
      @svc = TtsService.new
    end

    test "the mission list is the expected eleven" do
      assert_equal 11, self.class.missions_data.size
    end

    test "every line normal play voices resolves at the endpoint to its existing key, none refused" do
      counts = Hash.new(0)
      failures = []
      self.class.missions_data.each do |name, data|
        ex = TtsLineExtractor.new(name, data)
        resolver = TtsLineResolver.new(scenario_name: name, scenario_data: data,
                                       story_file: self.class.method(:story_file))
        check = lambda do |kind, npc_id, text, expected_key, delivery = nil|
          counts[kind] += 1
          npc = TtsLineResolver.find_npc(data, npc_id)
          voice = npc && (npc['voice'].is_a?(Hash) ? npc['voice'] : npc['ttsVoice'])
          next failures << "#{name} #{kind} #{npc_id}: no NPC or voice" unless voice

          result = resolver.resolve(npc_id, npc, text)
          next failures << "#{name} #{kind} #{npc_id} refused (#{result.status}): #{text[0, 70]}" unless result.line

          voice = ex.voices[npc_id] || voice
          note = delivery && ex.delivery_for(npc_id, result.line, delivery)
          key = @svc.cache_key_for(result.line, voice['name'], voice['style'], voice['language'], *[note].compact)
          expected = expected_key || @svc.cache_key_for(text, voice['name'], voice['style'], voice['language'])
          failures << "#{name} #{kind} #{npc_id} key changed: #{text[0, 50]} -> #{result.line[0, 50]}" unless key == expected
        end

        ex.entries.each do |e|
          kind = e.npc_id == 'narrator' ? :narrator : (e.source == e.npc_id ? :batch : :co_speaker)
          check.call(kind, e.npc_id, e.text, e.key, e.delivery)
        end
        ex.each_chatter_line { |npc_id, text, _path| check.call(:chatter, npc_id, text, nil) }
        each_bark(data) { |npc_id, text| check.call(:bark, npc_id, text, nil) }
        each_unplaced_line(ex) { |npc_id, text| check.call(:unplaced, npc_id, text, nil) }
      end

      assert_empty failures, failures.first(40).join("\n")
      %i[batch co_speaker narrator chatter bark unplaced].each do |kind|
        assert_operator counts[kind], :>, 0, "no #{kind} rows checked"
      end
      assert_operator counts.values.sum, :>, 7_000
    end

    # The conversation modes npc-manager.js can open from an eventMapping. A new
    # mode must be added here, with the reading the client gives its lines.
    CLIENT_MODES = %w[person-chat phone-chat video-call].freeze

    # Built from the scenario's own records and mappings, not from the
    # extractor's host list, so an NPC the extractor leaves out (m02 Ghost's
    # video calls were) still has its lines sent. Each NPC with a story and a
    # voice, for each way the client opens it with voice:
    #   person NPC: person-chat over the whole story;
    #   video-call mapping, or a timedConversation with videoCall or that mode
    #     (any npcType): person-chat from its knot, following every divert;
    #   voiced phone-chat mapping, voiced timedConversation, or `voiced: true`
    #     on the contact: the phone call's knots up to the home knot, no narration.
    # Every line is sent as the client sends it and must be accepted with
    # the same text.
    test "every line a voiced conversation can request resolves, video calls and voiced phone calls included" do
      counts = Hash.new(0)
      failures = []
      self.class.missions_data.each do |name, data|
        ex = TtsLineExtractor.new(name, data)
        resolver = TtsLineResolver.new(scenario_name: name, scenario_data: data,
                                       story_file: self.class.method(:story_file))
        variables = ex.instance_variable_get(:@variables)
        dynamic = ex.send(:dynamic_variables)
        each_story_npc(data) do |npc|
          Array(npc['eventMappings']).each do |m|
            mode = m.is_a?(Hash) ? m['conversationMode'] : nil
            failures << "#{name} #{npc['id']}: unknown conversationMode #{mode}" if mode && !CLIENT_MODES.include?(mode)
          end
          path = self.class.story_file(npc['storyPath'])
          next failures << "#{name} #{npc['id']}: story not found" unless path

          ink = JSON.parse(File.read(path))
          readings = conversation_knots(npc, ink)
          next if readings.empty?

          walker = InkLineWalker.from_file(path, variables: variables, dynamic: dynamic)
          walker.lines.each do |line|
            knot = TtsLineExtractor.line_knot(line.path)
            readings.each do |kind, knots|
              next unless knots.nil? || knots.include?(knot)

              speaker, text = ex.resolve(line, npc['id'], notes: false)
              next if speaker.nil? || speaker == 'player'
              next if kind == :phone_call && (speaker == 'narrator' || ex.send(:phone_narration?, line.tags))

              counts[kind] += 1
              record = TtsLineResolver.find_npc(data, speaker)
              next failures << "#{name} #{kind} #{speaker}: no record" unless record

              result = resolver.resolve(speaker, record, text)
              if result.line.nil?
                failures << "#{name} #{kind} #{npc['id']}/#{speaker} refused (#{result.status}): #{text[0, 70]}"
              elsif TtsService.match_form(result.line) != TtsService.match_form(text)
                failures << "#{name} #{kind} #{speaker} voiced other text: #{text[0, 50]} -> #{result.line[0, 50]}"
              end
            end
          end
        end
      end

      assert_empty failures, failures.first(40).join("\n")
      %i[person_chat video_call phone_call].each do |kind|
        assert_operator counts[kind], :>, 0, "no #{kind} rows checked"
      end
    end

    test "no voiced mission line prints a variable, except the listed scenario values" do
      printed = []
      self.class.missions_data.each do |name, data|
        ex = TtsLineExtractor.new(name, data)
        variables = ex.instance_variable_get(:@variables)
        dynamic = ex.send(:dynamic_variables)
        allowed = PRINTED_ALLOWED.fetch(name, [])
        ex.hosts.map { |h| self.class.story_file(h['storyPath']) }.compact.uniq.each do |path|
          voiced = InkLineWalker.from_file(path, variables: variables, dynamic: dynamic)
          names = voiced.ink_defaults.keys | variables.keys.map(&:to_s)
          # Every variable treated as changed in play, except the allowed ones:
          # a line that resolves only with a variable read as a constant drops out
          strict = InkLineWalker.from_file(path, variables: variables, dynamic: names - allowed)
          (voiced.lines.map(&:raw) - strict.lines.map(&:raw)).uniq.each do |raw|
            printed << "#{name} #{File.basename(path)}: #{raw[0, 80]}"
          end
        end
      end
      assert_empty printed, "voiced lines that print a variable"
    end

    test "a carried-over global is never read as a constant by the extractor" do
      self.class.missions_data.each do |name, data|
        imported = TtsLineExtractor.imported_names(data)
        next if imported.empty?

        ex = TtsLineExtractor.new(name, data)
        assert_empty imported & ex.instance_variable_get(:@variables).keys.to_set, name
        assert imported.subset?(ex.send(:dynamic_variables)), name
      end
    end

    private

    def each_story_npc(data)
      (data['rooms'] || {}).each_value do |room|
        Array(room['npcs']).each { |npc| yield npc if npc['storyPath'] && npc['voice'].is_a?(Hash) }
      end
    end

    # { reading => knots (nil for the whole story) } for the ways the client
    # opens this NPC with voice (npc-manager.js, phone-call-voice.js).
    def conversation_knots(npc, ink)
      readings = {}
      readings[:person_chat] = nil unless npc['npcType'] == 'phone'
      knot = ->(k) { k.to_s.split('.').first }
      timed = npc['timedConversation'].is_a?(Hash) ? npc['timedConversation'] : nil
      video_timed = timed && (timed['videoCall'] == true || timed['conversationMode'] == 'video-call')
      mappings = Array(npc['eventMappings']).select { |m| m.is_a?(Hash) }

      video = mappings.select { |m| m['conversationMode'] == 'video-call' }
                      .map { |m| knot.call(m['targetKnot'] || m['knot'] || npc['currentKnot'] || 'start') }
      video << knot.call(timed['targetKnot']) if video_timed && timed['targetKnot']
      readings[:video_call] = TtsLineExtractor.reachable_knots(ink, video.uniq, nil) if video.any?

      phone = mappings.select { |m| m['conversationMode'] == 'phone-chat' && m['voiced'] == true }
                      .map { |m| knot.call(m['targetKnot'] || m['knot']) }
      phone << knot.call(timed['targetKnot']) if timed && !video_timed && timed['voiced'] == true && timed['targetKnot']
      phone << knot.call(npc['currentKnot'] || 'start') if npc['voiced'] == true
      if npc['npcType'] == 'phone' && phone.any?
        readings[:phone_call] = TtsLineExtractor.reachable_knots(ink, phone.compact.uniq, knot.call(npc['currentKnot'] || 'start'))
      end
      readings
    end

    def each_bark(data)
      seen = Set.new
      npcs = []
      npcs << data['narrator'] if data['narrator']
      (data['rooms'] || {}).each_value { |room| npcs.concat(Array(room['npcs'])) }
      npcs.concat(Game.headless_npc_records(data))
      npcs.each do |npc|
        next unless npc['id'] && npc['voice'].is_a?(Hash)

        # Chatter pools are their own rows
        own_chatter = ScenarioBarkValidator.chatter_texts(npc['chatter'])
        (ScenarioBarkValidator.bark_texts(npc) - own_chatter).each do |text|
          next if TtsService.match_form(text).blank? || !seen.add?([npc['id'], text])

          yield npc['id'], text
        end
      end
    end

    # Lines of each host story the walker can't place, as the client would
    # send them and for the speaker it would send them as.
    def each_unplaced_line(ex)
      ex.hosts.each do |host|
        path = self.class.story_file(host['storyPath'])
        next unless path

        walker = InkLineWalker.cached_for_file(path)
        shown = []
        walker.unresolved.each do |u|
          slots = Array(u.slots)
          if slots.empty?
            shown << u.text unless u.text.include?('{')
          elsif u.template && slots.all? { |k| k == :player_name }
            shown << u.template.map { |part| part.is_a?(Symbol) ? TtsService::PLAYER_NAME_DEFAULT : part }.join.gsub(/[ \t]+/, ' ')
          end
        end
        shown.concat(InkTextValidator.send(:glued_runs, walker.unresolved))
        shown.uniq.each do |raw|
          npc_id, text = ex.voiced_as(raw, host['id'])
          next if npc_id.nil? || npc_id == 'player' || TtsService.match_form(text).blank?
          # A co-speaker's unplaced line in another NPC's story has no route but
          # the extractor's, which can't place it (glue): not voiced before either
          next unless npc_id == host['id'] || npc_id == 'narrator'

          yield npc_id, text
        end
      end
    end
  end
end
