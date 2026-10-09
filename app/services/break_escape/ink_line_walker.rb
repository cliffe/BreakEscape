require 'json'

module BreakEscape
  # Reads a compiled ink story (the .json the client loads) and returns its
  # spoken lines as the person-chat client sees them: one line per ink
  # Continue(), with text fragments joined up to each newline, choice labels
  # and tags left out, and `{VAR}` interpolations filled in.
  #
  # Shared by TtsLineExtractor (what the TTS batch generates) and
  # InkTextValidator (what the TTS endpoint accepts), so both read ink the
  # same way.
  #
  # Lines the walker can't reconstruct without running the story (glue,
  # inline conditionals, sequences, expressions, unknown variables) are not
  # guessed: they go to #unresolved and are left out of #lines.
  class InkLineWalker
    Line = Struct.new(:prefix, :text, :raw, :tags, :path, keyword_init: true) do
      # [speaker_prefix_or_nil, text]
      def to_a
        [prefix, text]
      end
    end

    Unresolved = Struct.new(:path, :text, :reason, keyword_init: true)

    NARRATOR_CHARACTER_PREFIX = /\ANarrator\s*\[\s*([^\]]*)\s*\]\s*:\s*(.+)\z/im
    NARRATOR_PREFIX = /\ANarrator\s*:\s*(.+)\z/im

    # Keys of a container's trailing dict that are flags or names, not content.
    CONTAINER_META_KEYS = %w[#f #n].freeze
    # A trailing dict carrying any of these is a control object, not sub-containers.
    CONTROL_KEYS = %w[-> f() ->t-> x() VAR= temp= * ^-> VAR? CNT? #].freeze

    # Most lines one ink line may expand to (branches of sequences and inline
    # conditionals multiply). A line that would expand further is logged instead.
    MAX_VARIANTS = 16

    class TooManyVariants < StandardError; end

    attr_reader :unresolved

    def self.from_file(path, variables: {}, dynamic: [])
      new(JSON.parse(File.read(path)), variables: variables, dynamic: dynamic)
    end

    # Variables a story changes: `~ x = ...` reassignments and `#set_global:x:` tags.
    def changed_variables
      @changed_variables ||= begin
        names = reassigned_variables.dup
        fragments.each do |f|
          m = f.match(/\Aset_global:([^:\s]+)/)
          names << m[1] if m
        end
        names
      end
    end

    # Cached per path and mtime, for the endpoint (one walk per story edit).
    def self.cached_for_file(path)
      path = path.to_s
      stamp = [File.mtime(path), File.size(path)]
      cached = file_cache[path]
      return cached[:walker] if cached && cached[:stamp] == stamp

      walker = from_file(path)
      walker.lines
      file_cache[path] = { stamp: stamp, walker: walker }
      walker
    end

    def self.file_cache
      @file_cache ||= Concurrent::Map.new
    end

    # Split a line the way the client's parseDialogueLine does.
    # Returns [prefix_or_nil, text]; prefix is e.g. "Narrator", "Narrator[none]", "Kevin Park".
    def self.split_prefix(raw)
      line = raw.to_s.strip
      if (m = line.match(NARRATOR_CHARACTER_PREFIX))
        return ["Narrator[#{m[1].strip}]", m[2].strip]
      end
      if (m = line.match(NARRATOR_PREFIX))
        return ['Narrator', m[1].strip]
      end

      colon = line.index(':')
      return [nil, line] unless colon

      speaker = line[0...colon].strip
      text = line[(colon + 1)..].strip
      return [nil, line] if speaker.empty? || text.empty?

      [speaker, text]
    end

    # @param ink [Hash, String] parsed compiled ink, or its JSON text
    # @param variables [Hash] scenario globalVariables; they win over the ink VAR defaults
    # @param dynamic [Enumerable<String>] variables changed elsewhere (other stories, set_global tags)
    def initialize(ink, variables: {}, dynamic: [])
      @ink = ink.is_a?(String) ? JSON.parse(ink) : ink
      @variables = (variables || {}).transform_keys(&:to_s)
      @dynamic = dynamic.map(&:to_s).to_set
      @unresolved = []
      @lines = nil
    end

    # Spoken lines in story order (duplicates kept).
    # @return [Array<Line>]
    def lines
      walk_story unless @lines
      @lines
    end

    # Every ^text fragment in the story, unescaped (choice labels and tags included).
    def fragments
      @fragments ||= begin
        out = []
        collect_fragments(@ink['root'], out)
        out
      end
    end

    # The ink's own VAR defaults (from the root "global decl" container).
    def ink_defaults
      @ink_defaults ||= parse_global_decl
    end

    # Variable names assigned somewhere in the story after declaration, so
    # their default is only the starting value.
    def reassigned_variables
      @reassigned_variables ||= begin
        names = Set.new
        find_reassignments(@ink['root'], names)
        names
      end
    end

    private

    def walk_story
      @lines = []
      root = @ink['root']
      walk(root, 'root') if root.is_a?(Array)
    end

    # Walks one container. Returns true when it ended with text that had no
    # newline yet (so the text continues somewhere the walker can't follow).
    def walk(container, path)
      state = { buf: [], partial: nil, tags: [], in_ev: false, in_str: false, in_tag: false, ev_parts: [] }
      last_index = container.length - 1
      skip_to = 0

      container.each_with_index do |item, i|
        next if i < skip_to

        case item
        when String
          handle_string(item, state, path)
        when Hash
          if state[:in_ev]
            state[:ev_parts] << item
            next
          end
          if item.key?('#')
            # Pre-v21 tag form {"#": "text"}
            state[:tags] << item['#'].to_s
            next
          end
          if i == last_index && (item.keys & CONTROL_KEYS).empty?
            item.each do |name, sub|
              next if CONTAINER_META_KEYS.include?(name)
              walk(sub, "#{path}.#{name}") if sub.is_a?(Array)
            end
            next
          end
          if item.key?('->') && !text_of(state).empty?
            state[:partial] ||= 'divert mid-line'
          end
        when Array
          # Inside "str"…"/str" is choice-label text, which nobody voices.
          next if state[:in_str]

          begin
            if (alternatives = sequence_alternatives(item))
              state[:buf] << alternatives
              next
            end
            if (group = conditional_group(container, i))
              state[:buf] << group[:options]
              skip_to = group[:resume]
              next
            end
          rescue TooManyVariants
            state[:partial] ||= "expands to more than #{MAX_VARIANTS} variants"
            skip_to = conditional_end(container, i) || i + 1
            next
          end
          state[:partial] ||= 'inline conditional or sequence' unless text_of(state).empty?
          dangling = walk(item, "#{path}[#{i}]")
          state[:partial] ||= 'continues after an inline conditional or sequence' if dangling
        when Numeric, TrueClass, FalseClass
          state[:ev_parts] << item if state[:in_ev]
        end
      end

      tail = text_of(state)
      return false if tail.empty?

      @unresolved << Unresolved.new(path: "#{path}(unterminated)", text: tail,
                                    reason: state[:partial] || 'text with no newline (glue, choice start or inline content)')
      true
    end

    def handle_string(item, state, path)
      if item == '#'
        state[:in_tag] = true
        state[:tag_buf] = +''
        return
      end
      if item == '/#'
        state[:in_tag] = false
        state[:tags] << state[:tag_buf].strip
        return
      end
      if state[:in_tag]
        state[:tag_buf] << item[1..] if item.start_with?('^')
        return
      end

      case item
      when 'ev'
        state[:in_ev] = true
        state[:ev_parts] = []
        return
      when '/ev'
        state[:in_ev] = false
        return
      when 'str'
        state[:in_str] = true
        state[:ev_parts] << :str_start if state[:in_ev]
        return
      when '/str'
        state[:in_str] = false
        return
      end

      if state[:in_ev]
        if item == 'out'
          interpolate(state)
        elsif !state[:in_str]
          state[:ev_parts] << item
        end
        return
      end
      return if state[:in_str]

      if item == "\n"
        flush(state, path)
      elsif item == '<>'
        if text_of(state).empty?
          # Glue at the start of a line joins it to the line before.
          retract_last_line(state, path)
        else
          state[:glue_next] = true
        end
        state[:partial] ||= 'glue'
      elsif item.start_with?('^')
        state[:buf] << item[1..]
      end
    end

    # Fill in an `ev {VAR?: x} out /ev` interpolation.
    def interpolate(state)
      parts = state[:ev_parts]
      state[:ev_parts] = []
      if parts.length == 1 && parts[0].is_a?(Hash) && parts[0].key?('VAR?')
        name = parts[0]['VAR?']
        known = @variables.key?(name) || ink_defaults.key?(name)
        value = @variables.key?(name) ? @variables[name] : ink_defaults[name]
        state[:buf] << (known ? format_value(value) : "{#{name}}")
        if !known
          state[:partial] ||= "unknown variable #{name}"
        elsif !value.is_a?(String)
          # Counters and flags are game state: the starting value is a guess.
          state[:partial] ||= "variable #{name} is game state (starts as #{value.inspect})"
        elsif reassigned_variables.include?(name) || @dynamic.include?(name)
          state[:partial] ||= "variable #{name} changes during play"
        end
      else
        label = parts.map { |p| p.is_a?(Hash) ? p.keys.first + ':' + p.values.first.to_s : p.to_s }.join(' ')
        state[:buf] << "{#{label}}"
        state[:partial] ||= "expression {#{label}}"
      end
    end

    def flush(state, path)
      buf = state[:buf]
      raw = text_of(state)
      partial = state[:partial]
      tags = state[:tags]
      state[:buf] = []
      state[:partial] = nil
      state[:tags] = []
      state[:last_lines] = nil
      return if raw.empty?

      if state.delete(:glue_next)
        # Glue at the end of this line pulls the next line onto it.
        state[:partial] = 'glue'
      end

      if partial
        @unresolved << Unresolved.new(path: path, text: raw, reason: partial)
        return
      end

      variants = expand(buf)
      if variants.nil?
        @unresolved << Unresolved.new(path: path, text: raw, reason: "expands to more than #{MAX_VARIANTS} variants")
        return
      end

      start = @lines.length
      variants.each do |variant|
        prefix, text = self.class.split_prefix(variant)
        @lines << Line.new(prefix: prefix, text: text, raw: variant, tags: tags, path: path)
      end
      state[:last_lines] = start...@lines.length
    end

    def retract_last_line(state, path)
      range = state[:last_lines]
      return unless range

      @lines.slice!(range).each do |line|
        @unresolved << Unresolved.new(path: path, text: line.raw, reason: 'glue')
      end
      state[:last_lines] = nil
    end

    # A `{&a|b|c}` / `{~a|b}` / `{!a|b}` sequence whose branches are inline
    # content that rejoins the line straight after it: each branch is a line
    # the client can show, so all are returned. Anything else (branches that
    # divert elsewhere or hold logic) returns nil and is left to the caller.
    def sequence_alternatives(container)
      named = container.last
      return nil unless named.is_a?(Hash)

      branches = named.reject { |k, _| CONTAINER_META_KEYS.include?(k) }
      return nil if branches.empty? || !branches.keys.all? { |k| k.match?(/\As\d+\z/) }

      # Each branch diverts back to the "nop" that ends the sequence container,
      # after which the parent line carries on.
      last_content = container.length - 2
      return nil unless last_content >= 0 && container[last_content] == 'nop'

      back = ".^.^.#{last_content}"
      options = []
      branches.keys.sort_by { |k| k[1..].to_i }.each do |key|
        body = branches[key]
        return nil unless body.is_a?(Array) && body.first == 'pop'

        branch = branch_options(body[1..], back)
        return nil unless branch

        options.concat(branch)
      end
      check_variants!(options.uniq)
    end

    # An inline conditional `{cond: a|b}` / `{cond: a}`: consecutive branch
    # containers [{"->": ".^.b"(, "c": true)}, {"b": [...]}] in the parent,
    # ended by a "nop" that every branch diverts back to. Returns every
    # branch's text (plus "" when no branch is unconditional) and the index
    # to resume at, or nil when the shape isn't that.
    def conditional_group(container, index)
      nop = conditional_end(container, index)
      return nil unless nop

      back = ".^.^.^.#{nop}"
      options = []
      has_else = false
      (index...nop).each do |j|
        branch_container = container[j]
        divert = branch_container[0]
        has_else = true unless divert['c']
        branch = branch_options(branch_container[1]['b'], back)
        return nil unless branch

        options.concat(branch)
      end
      options << '' unless has_else
      { options: check_variants!(options.uniq), resume: nop + 1 }
    end

    # Index of the "nop" closing a run of conditional branch containers that
    # starts at index, or nil.
    def conditional_end(container, index)
      j = index
      j += 1 while j < container.length && conditional_branch?(container[j])
      return nil if j == index || container[j] != 'nop'

      j
    end

    def conditional_branch?(item)
      item.is_a?(Array) && item.length == 2 &&
        item[0].is_a?(Hash) && item[0]['->'] == '.^.b' && (item[0].keys - %w[-> c]).empty? &&
        item[1].is_a?(Hash) && item[1]['b'].is_a?(Array)
    end

    # The texts one branch can produce: inline content (text, nested
    # sequences and conditionals) followed by a divert back to `back`.
    def branch_options(body, back)
      items = body.dup
      items.pop while items.last.nil? && !items.empty?
      divert = items.pop
      return nil unless divert.is_a?(Hash) && divert.keys == ['->'] && divert['->'] == back

      inline_options(items)
    end

    # Every text a run of inline content can produce, or nil if it holds
    # anything but text, "nop" and nested sequences or conditionals.
    def inline_options(items)
      options = ['']
      i = 0
      while i < items.length
        item = items[i]
        parts =
          if item.is_a?(String) && item.start_with?('^')
            [item[1..]]
          elsif item == 'nop'
            ['']
          elsif item == 'ev'
            # A nested conditional's test: skip it, unless it prints something.
            close = (i...items.length).find { |k| items[k] == '/ev' }
            return nil unless close && !items[i...close].include?('out')

            i = close
            ['']
          elsif item.is_a?(Array) && (seq = sequence_alternatives(item))
            seq
          elsif item.is_a?(Array) && (group = conditional_group(items, i))
            i = group[:resume] - 1
            group[:options]
          else
            return nil
          end
        options = check_variants!(options.flat_map { |o| parts.map { |p| o + p } }.uniq)
        i += 1
      end
      options
    end

    def check_variants!(options)
      raise TooManyVariants if options.length > MAX_VARIANTS

      options
    end

    # Every line a buffer can make, or nil past MAX_VARIANTS.
    def expand(buf)
      variants = ['']
      buf.each do |part|
        options = part.is_a?(Array) ? part : [part]
        variants = variants.flat_map { |v| options.map { |o| v + o } }
        return nil if variants.length > MAX_VARIANTS
      end
      variants.map { |v| v.gsub(/[ \t]+/, ' ').strip }.reject(&:empty?).uniq
    end

    # Ink's own output cleanup: collapse runs of inline whitespace, trim.
    # (A sequence or conditional shows as its first branch here; flush expands every branch.)
    def text_of(state)
      state[:buf].map { |part| part.is_a?(Array) ? part.first.to_s : part }.join.gsub(/[ \t]+/, ' ').strip
    end

    def format_value(value)
      case value
      when Float then value == value.floor ? value.to_i.to_s : value.to_s
      else value.to_s
      end
    end

    def parse_global_decl
      root = @ink['root']
      decl = root.is_a?(Array) && root.last.is_a?(Hash) ? root.last['global decl'] : nil
      return {} unless decl.is_a?(Array)

      defaults = {}
      stack = []
      in_str = false
      str = +''
      decl.each do |item|
        case item
        when 'str' then in_str = true; str = +''
        when '/str' then in_str = false; stack << str
        when String
          str << item[1..] if in_str && item.start_with?('^')
        when Numeric, TrueClass, FalseClass then stack << item
        when Hash
          if item.key?('VAR=')
            defaults[item['VAR=']] = stack.pop
          else
            stack << item
          end
        end
      end
      defaults
    end

    def find_reassignments(node, names)
      case node
      when Array
        node.each { |child| find_reassignments(child, names) }
      when Hash
        names << node['VAR='] if node.key?('VAR=') && node['re']
        node.each_value do |child|
          find_reassignments(child, names) if child.is_a?(Array) || child.is_a?(Hash)
        end
      end
    end

    def collect_fragments(node, out)
      case node
      when Array then node.each { |child| collect_fragments(child, out) }
      when Hash then node.each_value { |child| collect_fragments(child, out) }
      when String then out << node[1..] if node.start_with?('^') && node.length > 1
      end
    end
  end
end
