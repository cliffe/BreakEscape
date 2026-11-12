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
  # A video call (`conversationMode: "video-call"` on an eventMapping, or a
  # timedConversation with `videoCall: true` or that mode) opens person-chat
  # for any npcType, which voices every line it shows whatever `voiced` says:
  # the knots it reaches (video_call_knots) are read as person-chat reads them.
  #
  # Office chatter (OFFICE_LIFE_PLAN 11.3): an NPC's own `chatter` pools and the
  # scenario's shared `chatter` pools are spoken on first play and cached. The
  # batch lists them under each voiced NPC only when opted in (`chatter: true`,
  # or the scenario's `"ttsPregenerateChatter": true`). `keys` (what the client
  # can request, read by tts:wasted) always includes them, so their clips are
  # never reported as unrequested.
  class TtsLineExtractor
    # delivery: the line's `#delivery:` note (person-chat lines only), or nil.
    Entry = Struct.new(:npc_id, :text, :voice, :source, :path, :key, :delivery, keyword_init: true)
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

    # Names of the scenario's carried-over globals: those resolved at game
    # creation (importedGlobals) and those it declares (importGlobals), so the
    # batch and the endpoint agree.
    def self.imported_names(scenario_data)
      names = Set.new
      record = scenario_data['importedGlobals']
      names.merge(record.keys.map(&:to_s)) if record.is_a?(Hash)
      Array(scenario_data['importGlobals']).each do |entry|
        name = CarryOver.import_name(entry)
        names << name if name
      end
      names
    end

    def self.normalize(text)
      text.to_s.downcase.gsub(/[^\w\s]/, '').strip.gsub(/\s+/, ' ')
    end

    def initialize(scenario_name, scenario_data, tts_service: TtsService.new, chatter: nil)
      @chatter = chatter.nil? ? scenario_data['ttsPregenerateChatter'] == true : chatter
      @scenario_name = scenario_name
      @scenario_data = scenario_data
      @tts_service = tts_service
      @voices = Mission.voice_configs_from(scenario_data)
      # Carried-over globals hold what the client wrote in an earlier mission,
      # so they are player text: never a constant a voiced line is read with.
      # They are left out of the variables and treated as changed in play
      # (dynamic_variables), so a line printing one stays unresolved and is
      # never voiced (neither with the player's value nor the ink's default).
      @imported = self.class.imported_names(scenario_data)
      @variables = (scenario_data['globalVariables'] || {}).reject { |name, _| @imported.include?(name.to_s) }
      @notes = []
      @entries = nil
    end

    # Unique by cache key, in scenario order.
    # @return [Array<Entry>]
    def entries
      extract unless @entries
      @entries
    end

    # Every clip key the client can request: the batch's entries plus chatter
    # lines, whether or not the batch pre-generates them.
    def keys
      set = entries.map(&:key).to_set
      return set if @chatter

      each_chatter_line do |npc_id, text, _path|
        voice = voices[npc_id]
        set << @tts_service.cache_key_for(text, voice['name'], voice['style'], voice['language']) if voice
      end
      set
    end

    # Chatter lines each voiced NPC can speak: its own `chatter` pools, then the
    # scenario's shared pools. Yields [npc_id, text, path].
    def each_chatter_line
      shared = ScenarioBarkValidator.chatter_texts(scenario_data['chatter'])
      each_room_npc do |npc|
        next unless npc['voice'].is_a?(Hash) && npc['id']
        next if npc['npcType'] == 'phone'

        ScenarioBarkValidator.chatter_texts(npc['chatter']).each { |t| yield npc['id'], t, 'npc.chatter' }
        shared.each { |t| yield npc['id'], t, 'scenario.chatter' }
      end
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

    # A phone contact whose lines are voiced: a voiced phone call
    # (voiced_phone_call?) or a video call (video_call_mapping? /
    # video_call_timed?). Person-chat voices a video call's lines whatever
    # its `voiced` flag (npc-manager.js opens it with videoCall: true).
    def self.voiced_call?(npc)
      return true if voiced_phone_call?(npc)
      return true if video_call_timed?(npc['timedConversation'])

      Array(npc['eventMappings']).any? { |m| video_call_mapping?(m) }
    end

    # A phone contact whose phone-chat calls are voiced: a phone-chat
    # eventMapping or its timedConversation has `voiced: true`, or the contact
    # itself does (a call the player starts, such as a pretext call from a desk
    # phone: its start knot is the contact's currentKnot).
    def self.voiced_phone_call?(npc)
      return true if npc['voiced'] == true
      timed = npc['timedConversation']
      return true if timed.is_a?(Hash) && timed['voiced'] == true && !video_call_timed?(timed)

      Array(npc['eventMappings']).any? do |m|
        m.is_a?(Hash) && m['voiced'] == true && m['conversationMode'] == 'phone-chat'
      end
    end

    # npc-manager.js: an event mapping with conversationMode "video-call" opens
    # person-chat with videoCall: true for any npcType.
    def self.video_call_mapping?(mapping)
      mapping.is_a?(Hash) && mapping['conversationMode'] == 'video-call'
    end

    # npc-manager.js scheduleTimedConversation: videoCall true or the
    # "video-call" mode makes the timed conversation a person-chat video call.
    def self.video_call_timed?(timed)
      timed.is_a?(Hash) && (timed['videoCall'] == true || timed['conversationMode'] == 'video-call')
    end

    # The knots a voiced phone call's lines come from (F20): those reachable from the
    # call's start knots (the targetKnot of each voiced phone-chat mapping and of
    # a voiced timedConversation) by diverts, tunnels, function calls and
    # choices, without entering the contact's home knot (its currentKnot,
    # default "start": the knot the phone opens on outside a call). Hub topics
    # and texts outside the set are not voiced. phone-call-voice.js
    # voicedCallKnots applies the same rule in the client.
    def self.call_knots(npc, ink)
      reachable_knots(ink, call_start_knots(npc), knot_name(npc['currentKnot'] || 'start'))
    end

    # The knots a video call's lines come from: those reachable from each video
    # call's target knot. Person-chat has no home-knot stop, so neither does this.
    def self.video_call_knots(npc, ink)
      reachable_knots(ink, video_call_start_knots(npc), nil)
    end

    def self.reachable_knots(ink, starts, home)
      root = ink.is_a?(Hash) ? ink['root'] : nil
      named = root.is_a?(Array) ? root.last : nil
      knots = Set.new
      return knots unless named.is_a?(Hash)

      known = ->(name) { name != 'global decl' && named[name].is_a?(Array) }
      queue = starts.select { |k| known.call(k) }
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
      knots << knot_name(npc['currentKnot'] || 'start') if npc['voiced'] == true
      timed = npc['timedConversation']
      if timed.is_a?(Hash) && timed['voiced'] == true && timed['targetKnot'] && !video_call_timed?(timed)
        knots << knot_name(timed['targetKnot'])
      end
      Array(npc['eventMappings']).each do |m|
        next unless m.is_a?(Hash) && m['voiced'] == true && m['conversationMode'] == 'phone-chat'

        target = m['targetKnot'] || m['knot']
        knots << knot_name(target) if target
      end
      knots.uniq
    end

    # npc-manager.js: a video call opens on the mapping's targetKnot (or knot),
    # else the NPC's currentKnot; a timed one on its targetKnot.
    def self.video_call_start_knots(npc)
      knots = []
      timed = npc['timedConversation']
      knots << knot_name(timed['targetKnot']) if video_call_timed?(timed) && timed['targetKnot']
      Array(npc['eventMappings']).each do |m|
        next unless video_call_mapping?(m)

        knots << knot_name(m['targetKnot'] || m['knot'] || npc['currentKnot'] || 'start')
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

    # [npc_id, text] the client voices a line of host_id's story as, for raw ink
    # text the walker could not place (glue, a divert mid-line, player_name()),
    # or nil. Same rules as resolve, with no tags and no notes recorded, and a
    # voice message keeps its "voice:" marker so TtsLineResolver can tell one.
    def voiced_as(raw, host_id)
      prefix, text = InkLineWalker.split_prefix(raw)
      line = InkLineWalker::Line.new(prefix: prefix, text: text, raw: raw.to_s.strip, tags: [], path: nil)
      resolve(line, host_id, notes: false, transcript: false)
    end

    # Which speaker the client asks for, and the text it sends, for one walker line.
    # Returns [npc_id, text], or nil when the line is not voiced (player, background).
    # With transcript: true a voice message's text is its transcript (no marker).
    def resolve(line, host_id, notes: true, transcript: true)
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
        elsif notes
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
      # A phone-chat voice message is voiced as its transcript, as the endpoint
      # and phone-chat-ui.js have it, never with the "voice:" marker
      text = text.sub(TtsLineResolver::VOICE_MESSAGE, '') if transcript && !narrator
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

    # The `#delivery:` note the scenario's ink gives the line the client voices as
    # npc_id with this text, chosen by the note the client sent, or nil. The
    # endpoint keys, voices and records the returned note, never the client's:
    # the client's note only has to match it after normalising (the key's own
    # rule), so it cannot add words of its own to the voice prompt.
    def delivery_for(npc_id, text, delivery)
      wanted = self.class.normalize(text)
      note = self.class.normalize(TtsService.clean_delivery(delivery))
      return nil if wanted.empty? || note.empty?

      delivered_lines["#{npc_id}|#{wanted}|#{note}"]
    end

    def delivered_by?(npc_id, text, delivery)
      !delivery_for(npc_id, text, delivery).nil?
    end

    # { "npc_id|normalised text|normalised note" => the ink's note } for every
    # line with a delivery note.
    def delivered_lines
      index_host_lines unless @delivered_lines
      @delivered_lines
    end

    # The `#delivery:` note person-chat sends for a line (TtsService.delivery_from_tags).
    # Voiced phone calls don't send one (phone-call-voice.js), so their lines have none;
    # a phone contact's video call is person-chat and does.
    def line_delivery(line, person_chat)
      return nil unless person_chat

      TtsService.delivery_from_tags(line.tags)
    end

    # True when some host story has a line the client voices as npc_id with
    # this text: how the endpoint accepts a co-speaker's line from another
    # NPC's story (Vance in HaX's debrief, HaX in Netherton's). Matching is on
    # the whole line as the client sends it, so only text that is in the
    # scenario's ink for that speaker is accepted.
    def spoken_by?(npc_id, text)
      !spoken_line(npc_id, text).nil?
    end

    # The line's own text (as the batch voices it) for a request that has its
    # TtsService.match_form, or nil. The endpoint voices and keys this text.
    def spoken_line(npc_id, text)
      wanted = TtsService.match_form(text)
      return nil if wanted.blank?

      spoken_lines["#{npc_id}|#{wanted}"]
    end

    # { "npc_id|match form" => the line's text } for every voiced line of every
    # host story (the first line wins where two share a match form).
    def spoken_lines
      index_host_lines unless @spoken_lines
      @spoken_lines
    end

    # Most extractors the endpoint keeps. Keyed by scenario and stamp, so players
    # of one mission whose carried-over globals differ each keep theirs instead
    # of evicting each other on every line; least recently used goes first.
    ENDPOINT_CACHE_SIZE = 32

    # One extractor per scenario render and story edit, for the endpoint.
    # Keyed on the stories' paths and mtimes and the speaker-relevant fields of
    # every character, so a story edit or a recast rebuilds it.
    def self.cached(scenario_name, scenario_data)
      extractor = new(scenario_name, scenario_data, tts_service: nil)
      key = [scenario_name, extractor.cache_stamp]
      hit = endpoint_cache_mutex.synchronize do
        found = endpoint_cache.delete(key)
        endpoint_cache[key] = found if found
        found
      end
      return hit if hit

      extractor.spoken_lines
      endpoint_cache_mutex.synchronize do
        endpoint_cache[key] = extractor
        endpoint_cache.shift while endpoint_cache.size > ENDPOINT_CACHE_SIZE
      end
      extractor
    end

    # Insertion-ordered (oldest first); guarded by endpoint_cache_mutex.
    def self.endpoint_cache
      @endpoint_cache ||= {}
    end

    def self.endpoint_cache_mutex
      @endpoint_cache_mutex ||= Mutex.new
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
      outcomes = []
      each_pretext_outcome_line { |npc_id, text, _path| outcomes << [npc_id, text] }
      Digest::MD5.hexdigest(Marshal.dump([people, stories, hosts_ids, outcomes, @variables.to_a.sort_by { |k, _| k.to_s }]))
    end

    private

    # spoken_lines and delivered_lines in one walk of the stories.
    def index_host_lines
      spoken = {}
      delivered = {}
      each_host_line do |_host, _path, line, npc_id, text, person_chat|
        norm = self.class.normalize(text)
        spoken["#{npc_id}|#{TtsService.match_form(text)}"] ||= text
        note = line_delivery(line, person_chat)
        delivered["#{npc_id}|#{norm}|#{self.class.normalize(note)}"] ||= note if note
      end
      each_pretext_outcome_line { |npc_id, text, _path| spoken["#{npc_id}|#{TtsService.match_form(text)}"] ||= text }
      @spoken_lines = spoken
      @delivered_lines = delivered
    end

    def extract
      @entries = []
      seen = {}

      each_host_line do |host_id, ink_path, line, npc_id, text, person_chat|
        add_entry(seen, npc_id, text, host_id, "#{File.basename(ink_path)}:#{line.path}",
                  line_delivery(line, person_chat))
      end

      each_pretext_outcome_line do |npc_id, text, path|
        add_entry(seen, npc_id, text, npc_id, path)
      end

      each_room_object do |obj|
        next unless obj['ttsVoice'].is_a?(Hash) && obj['voice'].is_a?(String)
        add_entry(seen, obj['id'], obj['voice'], obj['id'], 'object.voice')
      end

      return unless @chatter

      each_chatter_line { |npc_id, text, path| add_entry(seen, npc_id, text, npc_id, path) }
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
        # A phone contact: only the lines of its voiced phone calls' knots (F20)
        # and of its video calls' knots, which person-chat voices
        if phone
          ink = JSON.parse(File.read(ink_path))
          call = self.class.call_knots(npc, ink)
          video = self.class.video_call_knots(npc, ink)
          if call.empty? && video.empty?
            @notes << Note.new(source: host_id, path: npc['storyPath'], reason: 'voiced call has no targetKnot in its story; nothing voiced')
          end
        end
        in_call = ->(path) { !phone || call.include?(self.class.line_knot(path)) || video.include?(self.class.line_knot(path)) }
        lines = walker.lines.select { |line| in_call.call(line.path) }
        walker.unresolved.each do |u|
          next unless in_call.call(u.path)

          @notes << Note.new(source: host_id, path: "#{File.basename(ink_path)}:#{u.path}", text: u.text, reason: u.reason)
        end

        lines.each do |line|
          npc_id, text = resolve(line, host_id)
          next unless npc_id

          # person_chat: the line is read as person-chat voices it (narration as
          # the narrator, a #delivery: note sent): every person-chat host, and
          # a phone contact's line in a video call's knot. A voiced phone call
          # shows narration muted and doesn't voice it.
          person_chat = !phone || video.include?(self.class.line_knot(line.path))
          next if !person_chat && (npc_id == 'narrator' || phone_narration?(line.tags))

          yield host_id, ink_path, line, npc_id, text, person_chat
        end
      end
    end

    # The authored goodbye of a pretext call outcome (`social.pretextNpcs[].outcomes.<id>.line`,
    # e.g. Dev's "reported" line). The client speaks it on finalise (person-chat-pretext.js
    # finish), outside the ink story, so the walker never sees it. It is voiced only when the
    # pretext character's phone NPC is a voiced call, in that NPC's own voice
    # (phone-chat-minigame.js speakOutcomeLine). Yields [npc_id, text, path].
    def each_pretext_outcome_line
      social = scenario_data['social']
      return unless social.is_a?(Hash)

      Array(social['pretextNpcs']).each do |spec|
        next unless spec.is_a?(Hash) && spec['outcomes'].is_a?(Hash)

        char = social.dig('characters', spec['character'])
        phone_id = char.is_a?(Hash) ? char.dig('channels', 'phone') : nil
        npc = phone_id && characters[phone_id]
        next unless npc && npc['npcType'] == 'phone' && self.class.voiced_phone_call?(npc)

        spec['outcomes'].each do |outcome, cfg|
          line = cfg.is_a?(Hash) ? cfg['line'] : nil
          next unless line.is_a?(String) && !self.class.normalize(line).empty?

          yield phone_id, line, "pretextNpcs.#{spec['character']}.outcomes.#{outcome}.line"
        end
      end
    end

    # Variables any of this scenario's stories change, so no story's line is
    # voiced with a starting value that play replaces.
    def dynamic_variables
      @dynamic_variables ||= begin
        names = Set.new(@imported)
        story_paths = characters.values.map { |c| c['storyPath'] }.compact.uniq
        story_paths.each do |story|
          path = resolve_ink_path(story)
          names.merge(InkLineWalker.from_file(path).changed_variables) if path
        end
        names
      end
    end

    def add_entry(seen, npc_id, text, source, path, delivery = nil)
      voice = voices[npc_id]
      unless voice
        @notes << Note.new(source: source, path: path, text: text, reason: "no voice config for #{npc_id}; the endpoint can't voice it")
        return
      end

      key = @tts_service.cache_key_for(text, voice['name'], voice['style'], voice['language'], delivery)
      return if seen[key]

      seen[key] = true
      @entries << Entry.new(npc_id: npc_id, text: text, voice: voice, source: source, path: path, key: key,
                            delivery: delivery)
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
