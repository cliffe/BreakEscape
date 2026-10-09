require 'json'
require 'erb'

module BreakEscape
  # The TTS requests a scenario's client can make: each spoken line with the
  # npc_id the client sends and the voice the endpoint will use for it
  # (Mission#current_voice_configs), so the batch generates exactly the clips
  # that get requested.
  #
  # Covers person-chat ink stories (lines read by InkLineWalker, speaker
  # resolved as person-chat-minigame.js does) and room objects with a fixed
  # `voice` text and a `ttsVoice`. Barks and phone conversations are not voiced
  # by the batch.
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
          next unless npc['storyPath'] && npc['npcType'] != 'phone' && npc['voice'].is_a?(Hash)
          list << npc
        end
        Array(scenario_data['startRoomObjects']).each do |obj|
          list << obj if obj['voice'].is_a?(Hash) && obj['storyPath'] && obj['npcType'] != 'phone'
        end
        list
      end
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
      if speaker != host_id && other && other['voice'] && other['displayName'] != own_name
        [speaker, text]
      else
        [host_id, text]
      end
    end

    private

    def extract
      @entries = []
      seen = {}

      hosts.each do |npc|
        host_id = npc['id']
        ink_path = resolve_ink_path(npc['storyPath'])
        unless ink_path
          @notes << Note.new(source: host_id, path: npc['storyPath'], reason: 'story file not found')
          next
        end

        walker = InkLineWalker.from_file(ink_path, variables: @variables, dynamic: dynamic_variables)
        lines = walker.lines
        walker.unresolved.each do |u|
          @notes << Note.new(source: host_id, path: "#{File.basename(ink_path)}:#{u.path}", text: u.text, reason: u.reason)
        end

        lines.each do |line|
          npc_id, text = resolve(line, host_id)
          next unless npc_id
          next if refused_by_endpoint?(npc_id, host_id, text, line)

          add_entry(seen, npc_id, text, host_id, "#{File.basename(ink_path)}:#{line.path}")
        end
      end

      each_room_object do |obj|
        next unless obj['ttsVoice'].is_a?(Hash) && obj['voice'].is_a?(String)
        add_entry(seen, obj['id'], obj['voice'], obj['id'], 'object.voice')
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

    # A co-speaker with its own ink story is validated against that story at the
    # endpoint, so a line it speaks in another NPC's story is refused (403)
    # unless it is also in its own. Generating that clip would be waste.
    def refused_by_endpoint?(npc_id, host_id, text, line)
      return false if npc_id == host_id || npc_id == 'narrator'

      story = characters.dig(npc_id, 'storyPath')
      return false unless story

      own_path = resolve_ink_path(story)
      return false if own_path && InkTextValidator.validate(own_path.to_s, text)
      return false if ScenarioBarkValidator.validate(characters[npc_id], text)

      @notes << Note.new(source: host_id, path: line.path, text: line.raw,
                         reason: "spoken by #{npc_id}, whose own story doesn't contain it; the endpoint refuses it")
      true
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
