require 'json'
require 'erb'
require 'set'
require 'open3'
require 'pathname'

module BreakEscape
  # Builds the set of TTS cache keys a scenario can still request, for the cache
  # pruner (TtsCachePruner). A cached MP3 whose key is not in this set no longer
  # matches any line of dialogue.
  #
  # The client asks POST /games/:id/tts for { npc_id, text }; the server looks the
  # voice up from npc_id and keys the file on (normalised text, voice name, style,
  # language). So the expected set is every text the client might send, crossed
  # with every voice configured in the scenario. Crossing with every voice (rather
  # than guessing which NPC speaks which line) keeps the set a superset: a file is
  # only called an orphan when its text matches nothing in the scenario under any
  # of its voices.
  #
  # Texts come from (all unioned):
  #   1. Ink source (.ink, following INCLUDEs), expanded statically: every branch of
  #      inline alternatives and conditionals ({a|b}, {&a|b}, {cond: a|b}), choice
  #      output, glued lines joined, tags/comments/diverts stripped.
  #   2. Compiled ink (.json): every stored text fragment, as the server's
  #      InkTextValidator and the batch processor read it.
  #   3. A runtime walk of each compiled ink with inkjs
  #      (scripts/ink_runtime_check/voicelines.mjs): composed lines as Continue()
  #      prints them, from every knot and stitch, every choice, two global states.
  #   4. Every string in the rendered scenario.json.erb: barks, timed messages,
  #      fixed-text voice objects, phone voice messages, and anything else.
  # Each text is also tried with up to two leading "Name:" prefixes removed and,
  # for multi-line scenario strings, with a prefix removed from each line, matching
  # what person-chat, phone-chat (voice:) and barks strip before asking for audio.
  class TtsExpectedLines
    Voice = Struct.new(:name, :style, :language)

    MAX_COMBINATIONS = 256
    WALKER = "scripts/ink_runtime_check/voicelines.mjs".freeze

    attr_reader :scenario_name, :voices, :texts, :warnings, :ink_json_files, :ink_source_files,
                :walk_status, :variable_lines, :scenario_data

    # @param scenario_name [String] scenario directory name
    # @param scenarios_dir [Pathname] where scenario directories live
    # @param runtime_walk [Boolean] run the inkjs walk (needs node)
    # @param walk_time [Integer] seconds per ink file for the walk
    def initialize(scenario_name, scenarios_dir: BreakEscape::Engine.root.join("scenarios"),
                   engine_root: BreakEscape::Engine.root, runtime_walk: true, walk_time: 8)
      @scenario_name = scenario_name
      @scenario_dir = Pathname.new(scenarios_dir).join(scenario_name)
      @engine_root = Pathname.new(engine_root)
      @runtime_walk = runtime_walk
      @walk_time = walk_time
      @voices = []
      @texts = Set.new          # normalised texts
      @source_of = {}           # normalised text => first source label (for explanations)
      @warnings = []
      @ink_json_files = []
      @ink_source_files = []
      @variable_lines = 0
      @walk_status = runtime_walk ? :pending : :skipped
      @keys = nil
    end

    def build!
      @scenario_data = render_scenario
      collect_voices(@scenario_data)
      collect_scenario_strings(@scenario_data)
      collect_ink_files(@scenario_data)
      @known_values = known_variable_values(@scenario_data)
      @ink_source_files.each { |f| add_ink_source(f) }
      @ink_json_files.each { |f| add_compiled_fragments(f) }
      run_runtime_walk if @runtime_walk
      self
    end

    # Hash of cache key => [normalised text, Voice]
    def keys
      @keys ||= begin
        h = {}
        @texts.each do |norm|
          @voices.each do |v|
            h[TtsService.cache_key_for_normalized(norm, v.name, v.style, v.language)] = [norm, v]
          end
        end
        h
      end
    end

    def include_key?(key)
      keys.key?(key)
    end

    def source_of(normalised)
      @source_of[normalised]
    end

    def voice_configured?(name, style, language)
      @voices.any? { |v| v.name == name && v.style == style && v.language == language }
    end

    # Text the server would still accept for some voiced speaker in this scenario
    # (the /tts endpoint's own validation: InkTextValidator, ScenarioBarkValidator,
    # fixed voice strings). Used for files whose sidecar names their exact text.
    def requestable_text?(text)
      return false if text.to_s.strip.empty?
      return true if @ink_json_files.any? { |f| InkTextValidator.validate(f.to_s, text) }
      norm = TtsService.normalize_text(text)
      each_hash(@scenario_data) do |h|
        return true if h["voice"].is_a?(Hash) && ScenarioBarkValidator.validate(h, text)
        return true if h["voice"].is_a?(String) && TtsService.normalize_text(h["voice"]) == norm
      end
      false
    end

    # Candidate output lines for one ink source text (public for tests)
    def self.ink_source_candidates(source)
      InkSource.new.candidates(source)
    end

    # Text variants the client may send for one output line
    def self.text_variants(text)
      t = text.to_s.strip
      out = [t]
      s1 = t.sub(/\A[^:\n]+:\s*/, "")
      out << s1
      out << s1.sub(/\A[^:\n]+:\s*/, "")
      if t.include?("\n")
        # phoneBarkText: each line's own "Name:" prefix dropped, lines joined
        lines = t.split("\n").map(&:strip).reject(&:empty?)
        out << lines.map { |l| l.sub(/\A[^:\n]+:\s*/, "") }.join("\n")
        # ...and the player's and narrator's lines left out (phone-chat-speaker.js)
        npc_lines = lines.reject { |l| l =~ /\A(?:you|player|narrator(?:\s*\[[^\]]*\])?)\s*:/i }
        out << npc_lines.join("\n") << npc_lines.map { |l| l.sub(/\A[^:\n]+:\s*/, "") }.join("\n")
      end
      out.uniq
    end

    private

    def add_text(text, source)
      self.class.text_variants(text).each do |variant|
        norm = TtsService.normalize_text(variant)
        next if norm.empty?
        @source_of[norm] ||= source
        @keys = nil if @texts.add?(norm)
      end
    end

    # Render scenario.json.erb as the batch processor does (empty VM context).
    def render_scenario
      template = @scenario_dir.join("scenario.json.erb")
      raise "Scenario template not found: #{template}" unless File.exist?(template)
      erb = ERB.new(File.read(template))
      JSON.parse(erb.result(Mission::ScenarioBinding.new({}).get_binding))
    end

    def each_hash(obj, &block)
      case obj
      when Hash
        yield obj
        obj.each_value { |v| each_hash(v, &block) }
      when Array
        obj.each { |v| each_hash(v, &block) }
      end
    end

    def each_string(obj, &block)
      case obj
      when String then yield obj
      when Hash then obj.each_value { |v| each_string(v, &block) }
      when Array then obj.each { |v| each_string(v, &block) }
      end
    end

    # Every voice config anywhere in the scenario: NPC `voice`, narrator, object `ttsVoice`
    def collect_voices(data)
      seen = Set.new
      each_hash(data) do |h|
        [h["voice"], h["ttsVoice"]].each do |cfg|
          next unless cfg.is_a?(Hash) && cfg["name"].present?
          v = Voice.new(cfg["name"], cfg["style"], cfg["language"])
          @voices << v if seen.add?(v.to_a)
        end
      end
      @warnings << "no voice configs found" if @voices.empty?
    end

    def collect_scenario_strings(data)
      each_string(data) { |s| add_text(s, "scenario.json.erb") if s =~ /[[:alpha:]]/ }
    end

    def collect_ink_files(data)
      json_files = Set.new
      ink_files = Set.new
      refs = []
      each_hash(data) do |h|
        %w[storyPath inkPath inkFile].each { |k| refs << h[k] if h[k].is_a?(String) && h[k].present? }
      end
      refs.uniq.each do |ref|
        path = resolve_story(ref)
        if path.nil?
          @warnings << "story file not found: #{ref}"
          next
        end
        json = path.extname == ".ink" ? path.sub_ext(".json") : path
        ink = path.sub_ext(".ink")
        json_files << json if File.exist?(json)
        ink_files << ink if File.exist?(ink)
      end
      # Everything in the scenario's own ink folder, referenced or not
      ink_dir = @scenario_dir.join("ink")
      if Dir.exist?(ink_dir)
        Dir.glob(ink_dir.join("*.json")).each { |f| json_files << Pathname.new(f) }
        Dir.glob(ink_dir.join("*.ink")).each { |f| ink_files << Pathname.new(f) }
      end
      @ink_json_files = json_files.to_a.sort
      @ink_source_files = with_includes(ink_files.to_a).sort
      @ink_json_files.each do |json|
        ink = json.sub_ext(".ink")
        if File.exist?(ink) && File.mtime(ink) > File.mtime(json)
          @warnings << "compiled ink older than source (recompile): #{relative(json)}"
        end
      end
    end

    def resolve_story(ref)
      candidates = []
      p = Pathname.new(ref)
      candidates << p if p.absolute?
      candidates << @engine_root.join(ref)
      candidates << @scenario_dir.join(File.basename(ref))
      candidates << @scenario_dir.join("ink", "#{File.basename(ref, '.*')}.json")
      candidates.find { |c| File.exist?(c) }
    end

    def with_includes(files)
      all = Set.new
      queue = files.dup
      until queue.empty?
        f = Pathname.new(queue.shift)
        next unless all.add?(f)
        File.foreach(f) do |line|
          next unless line =~ /\A\s*INCLUDE\s+(\S.*?)\s*\z/
          inc = f.dirname.join(Regexp.last_match(1))
          if File.exist?(inc) then queue << inc
          else @warnings << "INCLUDE not found: #{Regexp.last_match(1)} (from #{relative(f)})"
          end
        end
      end
      all.to_a
    end

    def add_ink_source(file)
      src = File.read(file)
      parser = InkSource.new(@known_values || {})
      parser.candidates(src).each { |line| add_text(line, "ink:#{File.basename(file)}") }
      @variable_lines += parser.variable_lines
    rescue => e
      @warnings << "could not read #{relative(file)}: #{e.message}"
    end

    # Values a printed variable can take: ink VAR/CONST defaults across the
    # scenario's ink, scenario globalVariables (synced into ink), and the client's
    # player_name() fallbacks.
    def known_variable_values(data)
      values = Hash.new { |h, k| h[k] = [] }
      @ink_source_files.each do |f|
        InkSource.declared_values(File.read(f)).each { |k, v| values[k].concat(v) }
      rescue StandardError
        next
      end
      Hash(data["globalVariables"]).each do |k, v|
        values[k] << v.to_s if v.is_a?(String) || v.is_a?(Numeric)
      end
      values["player_name"].concat(["Agent", "Agent Zero", "Agent 0x00"])
      values.transform_values { |v| v.uniq.first(8) }
    end

    def add_compiled_fragments(file)
      File.read(file).scan(/"\^((?:[^"\\]|\\.)*)"/).flatten.each do |frag|
        text = begin
          JSON.parse(%("#{frag}"))
        rescue JSON::ParserError
          frag
        end
        add_text(text, "json:#{File.basename(file)}") unless text.strip.empty?
      end
    end

    def run_runtime_walk
      node = ENV["NODE"].presence || "node"
      walker = @engine_root.join(WALKER)
      unless File.exist?(walker) && system(node, "--version", out: File::NULL, err: File::NULL)
        @walk_status = :unavailable
        @warnings << "runtime ink walk unavailable (node or #{WALKER} missing): static scan only"
        return
      end
      return @walk_status = :done if @ink_json_files.empty?

      groups = @ink_json_files.each_slice((@ink_json_files.size / 4.0).ceil).to_a
      results = groups.map do |group|
        Thread.new do
          Open3.capture3(node, walker.to_s, "--time=#{@walk_time}", *group.map(&:to_s))
        end
      end.map(&:value)
      capped = []
      results.each do |stdout, stderr, status|
        unless status.success?
          @warnings << "runtime ink walk failed: #{stderr.to_s.lines.first&.strip}"
          next
        end
        JSON.parse(stdout).each do |file, r|
          Array(r["lines"]).each { |line| add_text(line, "walk:#{File.basename(file)}") }
          capped << File.basename(file) if r["capped"]
          Array(r["errors"]).first(1).each { |e| @warnings << "walk error in #{File.basename(file)}: #{e}" }
        end
      end
      @walk_status = capped.empty? ? :done : :capped
      @walk_capped = capped
    rescue => e
      @walk_status = :unavailable
      @warnings << "runtime ink walk failed: #{e.message}"
    end

    def relative(path)
      Pathname.new(path).relative_path_from(@engine_root).to_s
    rescue ArgumentError
      path.to_s
    end

    # Static expansion of ink source into candidate output lines.
    class InkSource
      attr_reader :variable_lines

      # values: { "player_name" => ["Agent Zero", ...] } printed for {player_name}
      # or {player_name()}; any other printed variable is taken as empty.
      def initialize(values = {})
        @variable_lines = 0
        @values = values
      end

      # VAR/CONST declarations with literal values in an ink source
      def self.declared_values(source)
        out = Hash.new { |h, k| h[k] = [] }
        source.scan(/^\s*(?:VAR|CONST)\s+(\w+)\s*=\s*(.+?)\s*(?:\/\/.*)?$/) do |name, raw|
          v = raw.strip
          v = v[1..-2] if v =~ /\A".*"\z/
          out[name] << v unless v =~ /\A(true|false)\z/
        end
        out
      end

      def candidates(source)
        src = source.gsub(%r{/\*.*?\*/}m, "")
        cleaned = []
        src.each_line do |raw|
          cleaned.concat(clean_line(raw.chomp))
        end
        lines = []
        cleaned.each_with_index do |l, i|
          lines << l
          # Glue: "a <>" + "b", or "a" + "<> b", printed as one line
          joined = l
          j = i
          while j + 1 < cleaned.size && (joined.rstrip.end_with?("<>") || cleaned[j + 1].lstrip.start_with?("<>")) && j - i < 3
            joined = "#{joined} #{cleaned[j + 1]}"
            j += 1
            lines << joined
          end
        end
        out = Set.new
        lines.each do |l|
          expand(l.gsub("<>", " ")).each do |e|
            text = unescape(e).gsub(/\s+/, " ").strip
            out << text unless text.empty?
          end
        end
        out.to_a
      end

      # One source line => zero or more text strings still holding inline braces
      def clean_line(line)
        l = line.strip
        return [] if l.empty?
        return [] if l =~ /\A(==|=\s*\w|~|VAR\s|CONST\s|INCLUDE\s|EXTERNAL\s|LIST\s|TODO\b|->|<-|\/\/)/
        variants = [l]
        variants << l.sub(%r{//.*\z}, "") if l.include?("//")
        variants.flat_map { |v| clean_body(v) }.uniq
      end

      def clean_body(l)
        choice = false
        if l =~ /\A((?:[*+]\s*)+)/
          choice = true
          l = l[Regexp.last_match(0).length..]
        else
          l = l.sub(/\A(?:-(?!>)\s*)+/, "")
        end
        l = l.sub(/\A\(\s*\w+\s*\)\s*/, "")
        l = l.sub(/\A(?:\{[^{}]*\}\s*)+/, "") if choice
        l = l.sub(/(?<!\\)#.*\z/, "")
        bodies =
          if choice && (m = l.match(/\A(.*?)(?<!\\)\[(.*?)(?<!\\)\](.*)\z/))
            [m[1] + m[3], m[1] + m[2]]
          else
            [l]
          end
        bodies.map { |b| b.sub(/\s*->.*\z/, "").strip }.reject(&:empty?)
      end

      def expand(str, depth = 0)
        return [str] if depth > 8
        results = [""]
        split_top(str).each do |type, s|
          opts = type == :lit ? [s] : brace_options(s, depth)
          results = results.product(opts).map(&:join).uniq.first(MAX_COMBINATIONS)
        end
        results
      end

      def brace_options(inner, depth)
        parts = split_on(inner, "|")
        opts = []
        if parts.size == 1
          cond, body = split_first_colon(inner)
          if body
            opts.concat(expand(body, depth + 1))
            opts << ""
          else
            # {variable} or {function()}: try the values it is known to take
            name = inner.strip.sub(/\(\s*\)\z/, "")
            known = @values[name]
            @variable_lines += 1 if known.nil? || known.empty?
            opts.concat(Array(known).map(&:to_s))
            opts << ""
          end
        else
          first = parts[0]
          plain = first.sub(/\A\s*(?:stopping|cycle|shuffle|once)\s*:/, "").sub(/\A\s*[&~!$]/, "")
          sets = [[plain, *parts[1..]]]
          _cond, body = split_first_colon(first)
          sets << [body, *parts[1..]] if body
          sets.each { |ps| ps.each { |p| opts.concat(expand(p, depth + 1)) } }
          opts << ""
        end
        opts.uniq.first(MAX_COMBINATIONS)
      end

      # [[:lit, text], [:brace, inner], ...] at the top level
      def split_top(str)
        segs = []
        buf = +""
        inner = +""
        depth = 0
        i = 0
        while i < str.length
          c = str[i]
          if c == "\\" && i + 1 < str.length
            (depth.positive? ? inner : buf) << str[i, 2]
            i += 2
            next
          end
          if c == "{"
            if depth.zero?
              segs << [:lit, buf]
              buf = +""
              inner = +""
            else
              inner << c
            end
            depth += 1
          elsif c == "}" && depth.positive?
            depth -= 1
            depth.zero? ? segs << [:brace, inner] : inner << c
          else
            (depth.positive? ? inner : buf) << c
          end
          i += 1
        end
        segs << [:lit, "{#{inner}"] if depth.positive?
        segs << [:lit, buf]
        segs
      end

      def split_on(str, sep)
        parts = []
        buf = +""
        depth = 0
        i = 0
        while i < str.length
          c = str[i]
          if c == "\\" && i + 1 < str.length
            buf << str[i, 2]
            i += 2
            next
          end
          depth += 1 if c == "{"
          depth -= 1 if c == "}" && depth.positive?
          if c == sep && depth.zero?
            parts << buf
            buf = +""
          else
            buf << c
          end
          i += 1
        end
        parts << buf
      end

      def split_first_colon(str)
        parts = split_on(str, ":")
        return [str, nil] if parts.size < 2
        [parts[0], parts[1..].join(":")]
      end

      def unescape(str)
        str.gsub(/\\(.)/, '\1')
      end
    end
  end
end
