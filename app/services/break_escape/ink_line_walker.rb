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

    # template: for a line left out only because it prints a value the walker
    # can't know (player_name(), an unknown variable, game state, a variable
    # changed in play), its parts in order: ink text Strings, and where a value
    # goes the kind of value (:player_name, :number or :text). nil otherwise.
    # InkTextValidator matches a request against it.
    # slots: the kinds of every printed value in the line (template or not),
    # [] when it prints none. InkTextValidator never voices a line with a
    # :number or :text slot.
    Unresolved = Struct.new(:path, :text, :reason, :template, :slots, keyword_init: true)

    # A printed value in a line's buffer (see Unresolved#template). It is still
    # a String, so the line's text reads exactly as before.
    class SlotValue < String
      attr_reader :kind

      def initialize(printed, kind)
        super(printed)
        @kind = kind
      end
    end

    NARRATOR_CHARACTER_PREFIX = /\ANarrator\s*\[\s*([^\]]*)\s*\]\s*:\s*(.+)\z/im
    NARRATOR_PREFIX = /\ANarrator\s*:\s*(.+)\z/im

    # Keys of a container's trailing dict that are flags or names, not content.
    CONTAINER_META_KEYS = %w[#f #n].freeze
    # A trailing dict carrying any of these is a control object, not sub-containers.
    CONTROL_KEYS = %w[-> f() ->t-> x() VAR= temp= * ^-> VAR? CNT? #].freeze

    # Stands for a #delivery: tag the walker cannot read without running the story
    # (`#delivery: {mood}`). inkjs sends what it prints, which the server cannot
    # match, so it reads as no note and drops every note before it (review R4 M1).
    DYNAMIC_DELIVERY = 'delivery: {}'.freeze

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

    # Note on carried #delivery: tags. The client (InkEngine#continue) keeps the
    # tags of lines with no text for the next line it shows, and inkjs carries
    # them across logic and diverts. The walker carries a #delivery: note:
    #  - from a tag on its own line to the next line in the same container;
    #  - across a plain divert (`#delivery: x` then `-> knot`) or into a tunnel
    #    (`-> knot ->`) to the first line of the knot or stitch it names, when
    #    that line comes before any choice or end there. A knot that opens with a
    #    plain divert or a tunnel (a divert chain, or a knot with only stitches,
    #    which ink diverts to its first stitch) is followed. The line is then listed twice:
    #    as reached from the divert (with the note) and as reached any other way
    #    (with its own tags);
    #  - past a line that may print nothing (`{flag: A}` with no else), to that
    #    line and also to the line after it, since inkjs gives the note to
    #    whichever of them shows. Both are listed with and without the note.
    # A note is never carried past a tunnel's return or an external function
    # call: it lands in the tunnel or on nothing. A tunnel's return (`->->`)
    # ends its first-line search as `-> END` does. A note above a thread
    # (`<- knot`) goes to the thread's first line only.
    # Where the client would join the carried note to another #delivery: note on
    # the way (a redirecting knot's own note, or one on a line that may print
    # nothing), the walker drops the carried note rather than guess which wins.
    # A #delivery: tag that prints a value (`#delivery: {mood}`) is read as no
    # note that also drops every note before it, carried or on the line, so the
    # line it lands on is listed untagged (dialoguelint warns: delivery-note).
    # Glued lines and lines printing game state stay unresolved either way, so a
    # note on one is not read here (dialoguelint warns: delivery-unread).

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
      @first_lines = {}   # ink path of a container => ranges in @lines of its possible first lines, or nil
      @awaiting = []      # ink paths of containers whose first line is not yet known
      @also_next = []     # containers whose first line may print nothing, so the next line may be first
      @redirects = {}     # ink path of a container that opens with a plain divert => that divert's target
      @divert_notes = []  # [target ink path, [delivery tags]] for a note carried across a divert
      @states = []        # [ink path, walk state] of each container being walked, outermost first
      root = @ink['root']
      walk(root, 'root') if root.is_a?(Array)
      apply_divert_notes
    end

    # Lists the first line of each divert target again with the note carried to it.
    def apply_divert_notes
      inserts = Hash.new { |h, k| h[k] = [] }
      @divert_notes.uniq.each do |target, notes|
        ranges = resolved_first_lines(target)
        next unless ranges

        ranges.each do |range|
          range.each do |i|
            line = @lines[i]
            tags = after_dynamic(notes + line.tags)
            next if TtsService.delivery_from_tags(tags) == TtsService.delivery_from_tags(line.tags)

            copy = line.dup
            copy.tags = tags
            inserts[range.end] << copy unless inserts[range.end].any? { |c| c.raw == copy.raw && c.tags == tags }
          end
        end
      end
      inserts.keys.sort.reverse_each { |at| @lines.insert(at, *inserts[at]) }
    end

    # A container's possible first lines, following a container that opens with
    # a plain divert to that divert's target (a chain, or a stitch-only knot).
    def resolved_first_lines(target)
      seen = Set.new
      while target && seen.add?(target)
        ranges = @first_lines[target]
        return ranges if ranges

        target = @redirects[target]
      end
      nil
    end

    # Control leaves (a choice, divert, tunnel, end): containers still waiting
    # for their first line have none a carried note could land on.
    def first_line_unknown!
      @awaiting.each { |p| @first_lines[p] = nil unless @first_lines.key?(p) }
      @awaiting.clear
      @also_next.clear
    end

    # A plain divert or tunnel reached before any line: each container still
    # waiting for its first line, and entered with no condition on the way here
    # (only numbered sub-containers between it and this one), opens with it.
    def note_redirect(own, target)
      return unless target

      @awaiting.each do |p|
        next if @first_lines.key?(p) || @redirects.key?(p)
        # A #delivery: note of its own on the way: inkjs joins it to the carried
        # one, so the carried note is dropped here (review R3 M2)
        next if pending_note_within?(p)

        rest = if p == own then ''
               elsif p.empty? then own
               elsif own.start_with?("#{p}.") then own[(p.length + 1)..]
               end
        next unless rest && rest.split('.').all? { |seg| seg.match?(/\A\d+\z/) }

        @redirects[p] = target
      end
    end

    # Whether a container at or inside ink path p, still being walked, holds a
    # #delivery: tag not yet given to a line.
    def pending_note_within?(p)
      @states.any? do |path, state|
        next false unless p.empty? || path == p || path.start_with?("#{p}.")

        Array(state[:tags]).any? { |t| TtsService.delivery_tag?(t) } || Array(state[:maybe_tags]).any?
      end
    end

    # Tags as inkjs reads them past a dynamic #delivery: tag: every #delivery:
    # tag before the last DYNAMIC_DELIVERY is dropped.
    def after_dynamic(tags)
      at = tags.rindex(DYNAMIC_DELIVERY)
      return tags unless at

      tags.each_with_index.reject { |t, i| i < at && TtsService.delivery_tag?(t) }.map(&:first)
    end

    # A plain divert's target as an absolute ink path, or nil. Relative paths
    # count from the divert: the first ".^" is its container, each more one up.
    def divert_target(target, path)
      return nil unless target.is_a?(String) && !target.empty?
      return target unless target.start_with?('.')

      parts = ink_path(path).split('.')
      steps = target.split('.')[1..] || []
      first = true
      while steps.first == '^'
        steps.shift
        first ? first = false : parts.pop
      end
      (parts + steps).join('.')
    end

    # Walks one container. Returns true when it ended with text that had no
    # newline yet (so the text continues somewhere the walker can't follow).
    def walk(container, path)
      state = { buf: [], partial: nil, tags: [], in_ev: false, in_str: false, in_tag: false, ev_parts: [] }
      last_index = container.length - 1
      skip_to = 0
      own = ink_path(path)
      @awaiting << own unless @first_lines.key?(own)
      @states << [own, state]

      container.each_with_index do |item, i|
        next if i < skip_to

        case item
        when String
          handle_string(item, state, path)
        when Hash
          if state[:in_tag]
            # `#delivery: {mood}`: a value printed into the tag
            mark_tag_dynamic(state)
            next
          end
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
            not_slot!(state, 'divert mid-line')
          end
          plain = item.keys == ['->'] || item.keys == ['->t->']
          # `<- knot` compiles to "thread" then a plain divert
          thread = plain && i.positive? && container[i - 1] == 'thread'
          if plain && text_of(state).empty?
            target = divert_target(item['->'] || item['->t->'], path)
            # `#delivery: x` on its own line, then `-> knot`, `-> knot ->` or
            # `<- knot`: inkjs gives the note to the knot's first line (apply_divert_notes)
            notes = state[:tags].select { |t| TtsService.delivery_tag?(t) }
            @divert_notes << [target, notes] if target && notes.any?
            # A thread does not redirect: the flow carries on after it
            note_redirect(own, target) unless thread
          end
          if item.key?('->t->') || item.key?('x()') || thread
            # The note went into the tunnel or thread (or nowhere): never to the line after it
            state[:tags] = state[:tags].reject { |t| TtsService.delivery_tag?(t) }
          end
          if (item.keys & %w[-> ->t-> f() x() *]).any?
            state[:maybe_tags] = nil
            first_line_unknown!
          end
        when Array
          if state[:in_tag]
            # `#delivery: {flag: a|b}` or `{~a|b}`: a conditional or sequence printed
            # into the tag, never into the spoken line (review R5 M1)
            mark_tag_dynamic(state)
            next
          end
          # Inside "str"…"/str" is choice-label text, which nobody voices.
          next if state[:in_str]

          begin
            if (alternatives = sequence_alternatives(item, ink_path("#{path}[#{i}]")))
              state[:buf] << alternatives
              next
            end
            if (group = conditional_group(container, i, ink_path(path)))
              state[:buf] << group[:options]
              skip_to = group[:resume]
              next
            end
          rescue TooManyVariants
            not_slot!(state, "expands to more than #{MAX_VARIANTS} variants")
            skip_to = conditional_end(container, i) || i + 1
            next
          end
          not_slot!(state, 'inline conditional or sequence') unless text_of(state).empty?
          dangling = walk(item, "#{path}[#{i}]")
          not_slot!(state, 'continues after an inline conditional or sequence') if dangling
        when Numeric, TrueClass, FalseClass
          mark_tag_dynamic(state) if state[:in_tag]
          state[:ev_parts] << item if state[:in_ev] && !state[:in_tag]
        end
      end

      @awaiting.delete(own)
      @states.pop
      tail = text_of(state)
      return false if tail.empty?

      @unresolved << Unresolved.new(path: "#{path}(unterminated)", text: tail,
                                    reason: state[:partial] || 'text with no newline (glue, choice start or inline content)',
                                    slots: slot_kinds(state[:buf]))
      true
    end

    # The tag being read prints a value. tag_head keeps the static text before
    # the first printed value, which tells whether the tag's name is printed.
    def mark_tag_dynamic(state)
      state[:tag_dynamic] = true
      state[:tag_head] ||= state[:tag_buf].dup
    end

    def handle_string(item, state, path)
      if item == '#'
        state[:in_tag] = true
        state[:tag_buf] = +''
        state[:tag_dynamic] = false
        state[:tag_head] = nil
        return
      end
      if item == '/#'
        state[:in_tag] = false
        tag = state[:tag_buf].strip
        # A tag whose name is printed (`#{t}`, t = "delivery: shout") may be a
        # #delivery: tag too, so it drops the notes before it as well (review R5 m1)
        if state[:tag_dynamic] && (TtsService.delivery_tag?(tag) || !state[:tag_head].include?(':'))
          state[:tags] = after_dynamic(state[:tags] + [DYNAMIC_DELIVERY])
        else
          state[:tags] << tag
        end
        return
      end
      if state[:in_tag]
        if item.start_with?('^')
          state[:tag_buf] << item[1..]
        else
          # ev, out, /ev, str: the tag prints a value
          mark_tag_dynamic(state)
        end
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

      # A tunnel return ends the search for a first line as an end does (review R3 M1)
      if %w[end done ->-> ~ret].include?(item) && !state[:in_ev]
        state[:maybe_tags] = nil
        first_line_unknown!
        return
      end

      if item == "\n"
        flush(state, path)
      elsif item == '<>'
        if text_of(state).empty?
          # Glue at the start of a line joins it to the line before.
          retract_last_line(state, path)
        else
          state[:glue_next] = true
        end
        not_slot!(state, 'glue')
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
        printed = known ? format_value(value) : "{#{name}}"
        # A value the line can't be voiced with in advance is a slot (Unresolved#template)
        slot = !known || !value.is_a?(String) || reassigned_variables.include?(name) || @dynamic.include?(name)
        kind = known && !value.is_a?(String) ? :number : :text
        state[:buf] << (slot ? SlotValue.new(printed, kind) : printed)
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
        kind = if label == 'x():player_name' then :player_name
               elsif label.start_with?('x():') then :text
               else :number
               end
        state[:buf] << SlotValue.new("{#{label}}", kind)
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
      state[:last_unresolved] = nil
      not_slot = state.delete(:not_slot)
      if raw.empty?
        # The client (InkEngine#continue) keeps an empty line's tags for the
        # next line it shows. Only a #delivery: note is carried here, so the
        # speaker of every existing line is read exactly as before.
        state[:tags] = tags.select { |t| TtsService.delivery_tag?(t) }
        return
      end

      glued_on = false
      if state.delete(:glue_next)
        # Glue at the end of this line pulls the next line onto it.
        state[:partial] = 'glue'
        state[:not_slot] = true
        glued_on = true
      end

      maybe = state.delete(:maybe_tags)
      if partial
        template = glued_on || not_slot ? nil : template_of(buf, partial)
        @unresolved << Unresolved.new(path: path, text: raw, reason: partial, template: template, slots: slot_kinds(buf))
        state[:last_unresolved] = @unresolved.last
        first_line_unknown!
        return
      end

      variants = expand(buf)
      if variants.nil?
        @unresolved << Unresolved.new(path: path, text: raw, reason: "expands to more than #{MAX_VARIANTS} variants",
                                      slots: slot_kinds(buf))
        first_line_unknown!
        return
      end
      # `{flag: A}` with no else prints nothing when flag is false, and inkjs then
      # hands this line's tags to the next line it shows
      may_be_empty = variants.include?('')
      variants = variants.reject(&:empty?)

      start = @lines.length
      variants.each do |variant|
        prefix, text = self.class.split_prefix(variant)
        @lines << Line.new(prefix: prefix, text: text, raw: variant, tags: tags, path: path)
        next unless maybe && TtsService.delivery_from_tags(after_dynamic(maybe + tags)) != TtsService.delivery_from_tags(tags)

        # Shown after a line that may have printed nothing: also as it plays with that line's note
        @lines << Line.new(prefix: prefix, text: text, raw: variant, tags: after_dynamic(maybe + tags), path: path)
      end
      range = start...@lines.length
      state[:last_lines] = range
      newly = @awaiting.reject { |p| @first_lines.key?(p) }
      newly.each { |p| @first_lines[p] = [range] }
      @also_next.each { |p| @first_lines[p] << range if @first_lines[p] && !@first_lines[p].include?(range) }
      @awaiting.clear
      if may_be_empty
        state[:maybe_tags] = after_dynamic(Array(maybe) + tags).select { |t| TtsService.delivery_tag?(t) }
        state[:maybe_tags] = nil if state[:maybe_tags].empty?
        # A carried note reaching the next line would meet this line's own note in
        # inkjs, so only an untagged line passes the first-line role on (review R3 M2)
        @also_next = state[:maybe_tags] ? [] : (@also_next + newly).uniq
      else
        @also_next = []
      end
    end

    # Marks the line unresolved for a reason other than a printed value, so it
    # gets no template (see template_of).
    def not_slot!(state, reason)
      state[:not_slot] = true
      state[:partial] ||= reason
    end

    # Unresolved#template for a line whose only unknowns are printed values:
    # no glue (the rest of the line is elsewhere) and no sequence or conditional.
    def template_of(buf, partial)
      return nil unless partial
      return nil unless buf.any? { |part| part.is_a?(SlotValue) }
      return nil if buf.any? { |part| part.is_a?(Array) }

      buf.map { |part| part.is_a?(SlotValue) ? part.kind : part.to_s }
    end

    # The kind of every printed value in a line's buffer, in order.
    def slot_kinds(buf)
      buf.flat_map do |part|
        if part.is_a?(SlotValue) then [part.kind]
        elsif part.is_a?(Array) then slot_kinds(part)
        else []
        end
      end
    end

    def retract_last_line(state, path)
      # A templated line that the next line glues onto is not the whole line
      state[:last_unresolved]&.template = nil
      range = state[:last_lines]
      return unless range

      # Glued: that line is no longer a container's first line (and its slots in
      # @lines will be reused)
      @first_lines.each_key do |p|
        next unless @first_lines[p]

        @first_lines[p] = @first_lines[p] - [range]
        @first_lines[p] = nil if @first_lines[p].empty?
      end
      @also_next.clear
      @lines.slice!(range).each do |line|
        @unresolved << Unresolved.new(path: path, text: line.raw, reason: 'glue', slots: [])
      end
      state[:last_lines] = nil
    end

    # A `{&a|b|c}` / `{~a|b}` / `{!a|b}` sequence whose branches are inline
    # content that rejoins the line straight after it: each branch is a line
    # the client can show, so all are returned. Anything else (branches that
    # divert elsewhere or hold logic) returns nil and is left to the caller.
    def sequence_alternatives(container, absolute = nil)
      named = container.last
      return nil unless named.is_a?(Hash)

      branches = named.reject { |k, _| CONTAINER_META_KEYS.include?(k) }
      return nil if branches.empty? || !branches.keys.all? { |k| k.match?(/\As\d+\z/) }

      # Each branch diverts back to the "nop" that ends the sequence container,
      # after which the parent line carries on.
      last_content = container.length - 2
      return nil unless last_content >= 0 && container[last_content] == 'nop'

      back = [".^.^.#{last_content}"]
      back << "#{absolute}.#{last_content}" if absolute
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
    #
    # inklecate writes the divert back either relative (".^.^.^.8") or, when
    # that is shorter, absolute ("close.8"), so `absolute` is the container's
    # own ink path when the walker knows it.
    def conditional_group(container, index, absolute = nil)
      nop = conditional_end(container, index)
      return nil unless nop

      back = [".^.^.^.#{nop}"]
      back << "#{absolute}.#{nop}" if absolute
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

    # The ink runtime's absolute path for a walker path: "root.close[6]" ->
    # "close.6", "root[0][3]" -> "0.3".
    def ink_path(path)
      path.sub(/\Aroot\.?/, '').gsub(/\[(\d+)\]/, '.\\1').sub(/\A\./, '')
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
    # sequences and conditionals) followed by a divert back to one of `back`.
    def branch_options(body, back)
      items = body.dup
      items.pop while items.last.nil? && !items.empty?
      divert = items.pop
      return nil unless divert.is_a?(Hash) && divert.keys == ['->'] && Array(back).include?(divert['->'])

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
      # Empty variants are kept: the caller needs to know a line may print nothing
      variants.map { |v| v.gsub(/[ \t]+/, ' ').strip }.uniq
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
