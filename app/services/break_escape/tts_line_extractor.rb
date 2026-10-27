require 'json'
require 'erb'
require 'digest'

module BreakEscape
  # The TTS requests a scenario's client can make: each spoken line with the
  # npc_id the client sends and the voice the endpoint will use for it
  # (Mission#current_voice_configs), so the batch generates exactly the clips
  # that get requested.
  #
  # Covers person-chat ink stories (lines read by InkLineWalker, speaker
  # resolved as person-chat-minigame.js does) and room objects with a fixed
  # `voice` text and a `ttsVoice`. Barks and phone conversations are not voiced
  # by the batch, except a phone contact with a voiced call (`voiced: true` on a
  # phone-chat eventMapping or on its timedConversation, F17): its story is a
  # host like a person-chat one, read as phone-call-voice.js voices it (no
  # narration), but only the lines in the call's own knots (call_knots, F20).
  class TtsLineExtractor
    Entry = Struct.new(:npc_id, :text, :voice, :source, :path, :key, keyword_init: true)
    Note = Struct.new(:source, :path, :text, :reason, keyword_init: true)

    BACKGROUND_LINE = /\ABackground\s*\[\s*([^\]]+)\s*\]\s*(?::\s*(.*))?\z/im
    # person-chat-minigame.js stripSpeakerPrefix: the client strips a leftover
    # "Two Words: " / "Three Word Name: " prefix from the text it sends.
    CLIENT_STRIP_PREFIX = /\A(?:[A-Z][a-z]+ ){1,2}[A-Z][a-z]+:\s/

    attr_reader :scenario_name, :scenario_data, :voices, :notes

    # Render a scenario by its directory name (as the batch does) and extract.
    def self.for_scenario(scenario_name)
      new(scenario_name, render_scenario(scenario_name))
    end

    def self.render_scenario(scenario_name)
      mission = Mission.find_by(name: scenario_name)
      return mission.generate_scenario_data({}) if mission

      template_path = BreakEscape::Engine.root.join('scenarios', scenario_name, 'scenario.json.erb')
      erb = ERB.new(File.read(template_path))
      JSON.parse(erb.result(Mission::ScenarioBinding.new({}).get_binding))
    end

    def self.normalize(text)
      text.to_s.downcase.gsub(/[^\w\s]/, '').strip.gsub(/\s+/, ' ')
    end

    def initialize(scenario_name, scenario_data, tts_service: TtsService.new)
      @scenario_name = scenario_name
      @scenario_data = scenario_data
      @tts_service = tts_service
      @voices = Mission.voice_configs_from(scenario_data)
      @variables = scenario_data['globalVariables'] || {}
      @notes = []
      @entries = nil
    end

    # Unique by cache key, in scenario order.
    # @return [Array<Entry>]
    def entries
      extract unless @entries
      @entries
    end

    def keys
      entries.map(&:key).to_set
    end

    # Ink stories this scenario's voiced conversation hosts load.
    def hosts
      @hosts ||= begin
        list = []
        each_room_npc do |npc|
          next unless npc['storyPath'] && npc['voice'].is_a?(Hash)
          next if npc['npcType'] == 'phone' && !self.class.voiced_call?(npc)
          list << npc
        end
        Array(scenario_data['startRoomObjects']).each do |obj|
          list << obj if obj['voice'].is_a?(Hash) && obj['storyPath'] && obj['npcType'] != 'phone'
        end
        list
      end
    end

    # A phone contact whose calls are voiced: a phone-chat eventMapping or its
    # timedConversation has `voiced: true`.
    def self.voiced_call?(npc)
      return true if npc.dig('timedConversation', 'voiced') == true

      Array(npc['eventMappings']).any? do |m|
        m.is_a?(Hash) && m['voiced'] == true && m['conversationMode'] == 'phone-chat'
      end
    end

    # The knots a voiced call's lines come from (F20): those reachable from the
    # call's start knots (the targetKnot of each voiced phone-chat mapping and of
    # a voiced timedConversation) by diverts, tunnels, function calls and
    # choices, without entering the contact's home knot (its currentKnot,
    # default "start": the knot the phone opens on outside a call). Hub topics
    # and texts outside the set are not voiced. phone-call-voice.js
    # voicedCallKnots applies the same rule in the client.
    def self.call_knots(npc, ink)
      root = ink.is_a?(Hash) ? ink['root'] : nil
      named = root.is_a?(Array) ? root.last : nil
      knots = Set.new
      return knots unless named.is_a?(Hash)

      known = ->(name) { name != 'global decl' && named[name].is_a?(Array) }
      home = knot_name(npc['currentKnot'] || 'start')
      queue = call_start_knots(npc).select { |k| known.call(k) }
      until queue.empty?
        knot = queue.shift
        next unless knots.add?(knot)

        divert_targets(named[knot]).each do |target|
          nxt = knot_name(target)
          queue << nxt if nxt != home && known.call(nxt) && !knots.include?(nxt)
        end
      end
      knots
    end

    def self.call_start_knots(npc)
      knots = []
      timed = npc['timedConversation']
      knots << knot_name(timed['targetKnot']) if timed.is_a?(Hash) && timed['voiced'] == true && timed['targetKnot']
      Array(npc['eventMappings']).each do |m|
        next unless m.is_a?(Hash) && m['voiced'] == true && m['conversationMode'] == 'phone-chat'

        target = m['targetKnot'] || m['knot']
        knots << knot_name(target) if target
      end
      knots.uniq
    end

    DIVERT_KEYS = %w[-> ->t-> f() ^-> *].freeze

    # Absolute divert, tunnel, function-call and choice targets in a container.
    # Relative targets (".^.c-0") stay in the knot; a variable divert can't be followed.
    def self.divert_targets(node, out = [])
      case node
      when Array
        node.each { |n| divert_targets(n, out) }
      when Hash
        node.each do |key, value|
          if DIVERT_KEYS.include?(key)
            out << value if value.is_a?(String) && !value.start_with?('.') && !node['var']
          elsif value.is_a?(Array) || value.is_a?(Hash)
            divert_targets(value, out)
          end
        end
      end
      out
    end

    def self.knot_name(path)
      path.to_s.split('.').first.to_s
    end

    # The knot of a walker line path ("root.forced_call.second[0].c-0" -> "forced_call").
    def self.line_knot(path)
      path.to_s[/\Aroot\.([^.\[(]+)/, 1]
    end

    # The client's character registry: player first, then every scenario NPC.
    def characters
      @characters ||= begin
        chars = { 'player' => (scenario_data['player'] || {}).merge('id' => 'player') }
        each_room_npc { |npc| chars[npc['id']] ||= npc }
        Array(scenario_data['npcs']).each { |npc| chars[npc['id']] ||= npc if npc['id'] }
        chars
      end
    end

    # Which speaker the client asks for, and the text it sends, for one walker line.
    # Returns [npc_id, text], or nil when the line is not voiced (player, background).
    def resolve(line, host_id)
      raw = line.raw
      return nil if raw.match?(BACKGROUND_LINE)

      speaker = nil
      narrator = false
      text = raw
      prefix = line.prefix

      if prefix&.match?(/\ANarrator(\[|\z)/i)
        character = prefix[/\[(.*)\]/, 1]&.strip
        if character.nil? || character.empty? || character.casecmp?('none') || characters.key?(character)
          speaker = 'narrator'
          narrator = true
          text = line.text
        else
          @notes << Note.new(source: host_id, path: line.path, text: raw,
                             reason: "Narrator[#{character}] names no character; the client voices it unprefixed")
        end
      elsif prefix
        resolved = speaker_id_for(prefix, host_id)
        if resolved
          speaker = resolved
          text = line.text
        end
      end

      speaker ||= speaker_from_tags(line.tags, host_id)
      return nil if speaker == 'player'

      text = text.sub(/\A[^:]+:\s*/, '') if text.match?(CLIENT_STRIP_PREFIX)
      return nil if self.class.normalize(text).empty?

      return ['narrator', text] if narrator

      own_name = characters.dig(host_id, 'displayName')
      other = characters[speaker]
      # person-chat sends the conversation's own id when the speaker shares its
      # display name (m05's Patricia in person and on the phone).
      same_name = own_name && other && other['displayName'] == own_name
      if speaker != host_id && other && other['voice'] && !same_name
        [speaker, text]
      else
        [host_id, text]
      end
    end

    # True when some host story has a line the client voices as npc_id with
    # this text: how the endpoint accepts a co-speaker's line from another
    # NPC's story (Vance in HaX's debrief, HaX in Netherton's). Matching is on
    # the whole line as the client sends it, so only text that is in the
    # scenario's ink for that speaker is accepted.
    def spoken_by?(npc_id, text)
      wanted = self.class.normalize(text)
      return false if wanted.empty?

      spoken_lines.include?("#{npc_id}|#{wanted}")
    end

    # "npc_id|normalised text" for every voiced line of every host story.
    def spoken_lines
      @spoken_lines ||= begin
        set = Set.new
        each_host_line { |_host, _path, _line, npc_id, text| set << "#{npc_id}|#{self.class.normalize(text)}" }
        set
      end
    end

    # One extractor per scenario render and story edit, for the endpoint.
    # Keyed on the stories' paths and mtimes and the speaker-relevant fields of
    # every character, so a story edit or a recast rebuilds it.
    def self.cached(scenario_name, scenario_data)
      extractor = new(scenario_name, scenario_data, tts_service: nil)
      stamp = extractor.cache_stamp
      cached = endpoint_cache[scenario_name]
      return cached[:extractor] if cached && cached[:stamp] == stamp

      extractor.spoken_lines
      endpoint_cache[scenario_name] = { stamp: stamp, extractor: extractor }
      extractor
    end

    def self.endpoint_cache
      @endpoint_cache ||= Concurrent::Map.new
    end

    def cache_stamp
      people = characters.map do |id, c|
        [id, c['displayName'], c['voice'].present?, c['storyPath'], c['npcType']]
      end
      stories = characters.values.map { |c| c['storyPath'] }.compact.uniq.sort.map do |story|
        path = resolve_ink_path(story)
        [story, path && File.exist?(path) ? [File.mtime(path).to_f, File.size(path)] : nil]
      end
      hosts_ids = hosts.map { |h| [h['id'], h['storyPath']] }
      Digest::MD5.hexdigest(Marshal.dump([people, stories, hosts_ids, @variables.to_a.sort_by { |k, _| k.to_s }]))
    end

    private

    def extract
      @entries = []
      seen = {}

      each_host_line do |host_id, ink_path, line, npc_id, text|
        add_entry(seen, npc_id, text, host_id, "#{File.basename(ink_path)}:#{line.path}")
      end

      each_room_object do |obj|
        next unless obj['ttsVoice'].is_a?(Hash) && obj['voice'].is_a?(String)
        add_entry(seen, obj['id'], obj['voice'], obj['id'], 'object.voice')
      end
    end

    # Every voiced line of every host story, with the speaker the client asks
    # for and the text it sends. Notes unreadable stories and unresolved lines.
    def each_host_line
      hosts.each do |npc|
        host_id = npc['id']
        ink_path = resolve_ink_path(npc['storyPath'])
        unless ink_path
          @notes << Note.new(source: host_id, path: npc['storyPath'], reason: 'story file not found')
          next
        end

        walker = InkLineWalker.from_file(ink_path, variables: @variables, dynamic: dynamic_variables)
        phone = npc['npcType'] == 'phone'
        # A voiced call: only the lines in the call's own knots (F20)
        call = phone ? self.class.call_knots(npc, JSON.parse(File.read(ink_path))) : nil
        if call&.empty?
          @notes << Note.new(source: host_id, path: npc['storyPath'], reason: 'voiced call has no targetKnot in its story; nothing voiced')
        end
        in_call = ->(path) { call.nil? || call.include?(self.class.line_knot(path)) }
        lines = walker.lines.select { |line| in_call.call(line.path) }
        walker.unresolved.each do |u|
          next unless in_call.call(u.path)

          @notes << Note.new(source: host_id, path: "#{File.basename(ink_path)}:#{u.path}", text: u.text, reason: u.reason)
        end

        lines.each do |line|
          npc_id, text = resolve(line, host_id)
          # A voiced phone call shows narration muted and doesn't voice it
          next if phone && (npc_id == 'narrator' || phone_narration?(line.tags))
          yield host_id, ink_path, line, npc_id, text if npc_id
        end
      end
    end

    # Variables any of this scenario's stories change, so no story's line is
    # voiced with a starting value that play replaces.
    def dynamic_variables
      @dynamic_variables ||= begin
        names = Set.new
        story_paths = characters.values.map { |c| c['storyPath'] }.compact.uniq
        story_paths.each do |story|
          path = resolve_ink_path(story)
          names.merge(InkLineWalker.from_file(path).changed_variables) if path
        end
        names
      end
    end

    def add_entry(seen, npc_id, text, source, path)
      voice = voices[npc_id]
      unless voice
        @notes << Note.new(source: source, path: path, text: text, reason: "no voice config for #{npc_id}; the endpoint can't voice it")
        return
      end

      key = @tts_service.cache_key_for(text, voice['name'], voice['style'], voice['language'])
      return if seen[key]

      seen[key] = true
      @entries << Entry.new(npc_id: npc_id, text: text, voice: voice, source: source, path: path, key: key)
    end

    def speaker_id_for(prefix, host_id)
      wanted = prefix.downcase.strip
      return nil if wanted.empty?
      return 'player' if wanted == 'player'
      return host_id if wanted == 'npc'

      characters.each do |id, char|
        return id if id.downcase == wanted
        return id if char['displayName'] && char['displayName'].downcase == wanted
      end
      return 'player' if wanted == 'you'

      nil
    end

    # person-chat-minigame.js determineSpeaker, for a line with no resolved prefix.
    def speaker_from_tags(tags, host_id)
      Array(tags).reverse_each do |tag|
        t = tag.strip.downcase
        if t.start_with?('speaker:')
          parts = t.split(':')
          if parts.length == 2
            return 'player' if parts[1] == 'player'
            return host_id if parts[1] == 'npc'
          elsif parts.length >= 3
            id = parts[2..].join(':')
            return characters.key?(id) ? id : host_id
          end
        end
        return 'player' if t == 'player'
        return host_id if t == 'npc'
      end
      host_id
    end

    # phone-chat-speaker.js tagsSayNarrator: the last speaker tag wins.
    def phone_narration?(tags)
      Array(tags).reverse_each do |tag|
        t = tag.strip.downcase
        return true if %w[narrator speaker:narrator].include?(t)
        return false if %w[player npc].include?(t) || t.start_with?('speaker:')
      end
      false
    end

    def resolve_ink_path(story_path)
      root = BreakEscape::Engine.root
      full = root.join(story_path)
      return full if File.exist?(full)

      scenario_dir = root.join('scenarios', scenario_name)
      candidate = scenario_dir.join(File.basename(story_path))
      return candidate if File.exist?(candidate)

      candidate = scenario_dir.join('ink', "#{File.basename(story_path, '.*')}.json")
      return candidate if File.exist?(candidate)

      nil
    end

    def each_room_npc(&block)
      (scenario_data['rooms'] || {}).each_value { |room| Array(room['npcs']).each(&block) }
    end

    def each_room_object(&block)
      (scenario_data['rooms'] || {}).each_value { |room| Array(room['objects']).each(&block) }
    end
  end
end
