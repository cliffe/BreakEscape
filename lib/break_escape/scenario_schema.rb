# frozen_string_literal: true

require 'json'

module BreakEscape
  # Step 2b of the scenario format hardening. One schema resolver, so the schema is the single
  # source that tells a note from an id from free data. Every walker in app/, lib/ and scripts/
  # that decides "note, id or data" carries a Node beside each value and asks this resolver; no
  # list of property names is kept in code.
  #
  # Three kinds of key (the schema says which):
  #   * a property  - a field name the schema declares, or a "_" key a closed block admits through
  #                   step 2's "^_" pattern (a note);
  #   * an id       - a key of a map (rooms, NPC needs, globals): data, never a note;
  #   * free data   - anything under a node marked "x-free-data": true (object/array globals,
  #                   minigameData, config, usePayload, ...): game state or minigame input, never
  #                   a note, read by every walker like any other key.
  #
  # Resolution is driven by the data being walked (each walker holds a Node and asks child/item as
  # it descends), so the schema is never walked without finite data to bound it.
  module ScenarioSchema
    # The free-data sentinel. child(FREE, k) and item(FREE) are FREE; no key under it is a note.
    FREE = Object.new
    def FREE.to_s; 'ScenarioSchema::FREE'; end
    def FREE.inspect; 'ScenarioSchema::FREE'; end

    DEFAULT_PATH = File.expand_path('../../scripts/scenario-schema.json', __dir__)

    # Every pointer the code passes to ScenarioSchema.at. A start the schema file does not hold is
    # skipped, so a small fixture schema loads with the default. at() on a pointer not in STARTS
    # raises, so a new start cannot bypass this list.
    STARTS = [
      '#',
      '#/definitions/room',
      '#/definitions/item',
      '#/definitions/item/properties/contents',
      '#/definitions/npc/properties/eventMappings',
      '#/definitions/eventMapping'
    ].freeze

    # A Node is the set of schema locations that may describe a value (after following local $refs
    # and flattening allOf/anyOf/oneOf into their branches). Keywords beside a $ref are ignored
    # (draft-04). Nodes are interned by their branch set, so recursion (item contents, itemsHeld)
    # terminates.
    class Node
      attr_reader :table, :branches

      attr_reader :object_branches, :array_branches

      def initialize(table, branches)
        @table = table
        @branches = branches
        # branches that can hold an object (a type that includes "object", or no type) and that can
        # hold an array; computed now, since the Node is frozen.
        @object_branches = branches.select { |b| ScenarioSchema.type_allows?(b, 'object') }
        @array_branches = branches.select { |b| ScenarioSchema.type_allows?(b, 'array') }
        @free_branch = branches.any? { |b| b['x-free-data'] == true }
        freeze
      end

      def free_branch?
        @free_branch
      end

      # Every property name declared across the object-capable branches.
      def declared_property_keys
        @object_branches.flat_map { |b| (b['properties'] || {}).keys }.uniq
      end
    end

    # Compiled table for one schema document. Holds the parsed schema and interns Nodes.
    class Table
      attr_reader :root_schema

      def initialize(root_schema, starts: STARTS)
        @root_schema = root_schema
        @node_cache = {}
        # eager-touch each start so a broken $ref under one raises at load, not first use.
        starts.each { |ptr| node_at(ptr) rescue nil if ptr == '#' || pointer_exists?(ptr) }
      end

      def root
        node_at('#')
      end

      # The Node at a json pointer into this schema (unrestricted; the module-level at() enforces
      # STARTS before calling here). Raises, naming the pointer, when the path is missing or its
      # schema derefs to nothing (a broken $ref).
      def node_at(pointer)
        raw = resolve_pointer_raw(pointer)
        raise ArgumentError, "schema pointer not found: #{pointer}" if raw.nil?

        schema = deref(raw)
        raise ArgumentError, "broken $ref at schema pointer: #{pointer}" unless schema.is_a?(Hash)

        make_node([schema])
      end

      # Whether the raw path exists (before dereferencing the final node), so a broken $ref at a
      # start still counts as present and node_at raises on it.
      def pointer_exists?(pointer)
        !resolve_pointer_raw(pointer).nil?
      end

      # Follow a $ref chain.
      def deref(node, depth = 0)
        while node.is_a?(Hash) && node['$ref'].is_a?(String) && node['$ref'].start_with?('#/') && depth < 40
          node = node['$ref'].sub('#/', '').split('/').reduce(@root_schema) { |n, s| n.is_a?(Hash) ? n[s] : nil }
          depth += 1
        end
        node
      end

      # Expand a raw schema hash into its branches: deref, then include the node itself plus the
      # flattened branches of every allOf/anyOf/oneOf. Dedup by object identity.
      def expand(schema, seen = nil)
        seen ||= {}
        d = deref(schema)
        return [] unless d.is_a?(Hash)
        return [] if seen.key?(d.object_id)

        seen[d.object_id] = true
        out = [d]
        %w[allOf anyOf oneOf].each do |comb|
          Array(d[comb]).each { |b| out.concat(expand(b, seen)) }
        end
        out
      end

      # Intern a Node from one or more raw schema hashes (each a location).
      def make_node(schemas)
        branches = []
        schemas.each { |s| branches.concat(expand(s)) }
        branches.uniq!(&:object_id)
        return nil if branches.empty?

        key = branches.map(&:object_id).sort
        @node_cache[key] ||= Node.new(self, branches)
      end

      # Eager enumeration (orchestrator ruling): yield [node, path] for every distinct Node first
      # reached from the root and from each start pointer, following child for every declared
      # property name and for the probe keys, and item. FREE and an already-seen Node are not
      # explored again. Uses the very same classify code as the lazy resolver, so the schema-walk
      # test's Explore and Reach run against the real resolution. path is the data path that first
      # reached the Node (String keys, "[]" for an array item).
      def explore(starts: STARTS, probes: %w[probe _probe])
        return enum_for(:explore, starts: starts, probes: probes) unless block_given?

        seen = {}
        stack = []
        push = lambda do |node, path|
          return unless node.is_a?(Node)
          return if seen.key?(node.object_id)

          seen[node.object_id] = true
          stack << [node, path]
        end
        push.call(root, [])
        starts.each do |ptr|
          next if ptr == '#'
          next unless pointer_exists?(ptr)

          push.call(node_at(ptr), [ptr])
        end
        until stack.empty?
          node, path = stack.pop
          yield node, path
          node.declared_property_keys.each { |k| push.call(ScenarioSchema.child(node, k), path + [k]) }
          probes.each { |p| push.call(ScenarioSchema.child(node, p), path + [p]) }
          push.call(ScenarioSchema.item(node), path + ['[]'])
        end
      end

      # Raw-schema structural walk: yield [schema_hash, pointer] for every subschema location in the
      # document, recursing through the schema-structural keywords only. A $ref node is a reference,
      # not a location (draft-04 ignores its siblings), so it is not yielded and not descended into;
      # its target is yielded where it is defined under definitions. A "^_" patternProperties entry
      # is a note schema and is not descended into.
      def each_raw_location(node = @root_schema, pointer = '#', &blk)
        return unless node.is_a?(Hash)
        return if node.key?('$ref')

        blk.call(node, pointer)
        (node['properties'] || {}).each { |k, v| each_raw_location(v, "#{pointer}/properties/#{k}", &blk) }
        (node['patternProperties'] || {}).each do |k, v|
          next if k == '^_'

          each_raw_location(v, "#{pointer}/patternProperties/#{k}", &blk)
        end
        ap = node['additionalProperties']
        each_raw_location(ap, "#{pointer}/additionalProperties", &blk) if ap.is_a?(Hash)
        items = node['items']
        if items.is_a?(Hash)
          each_raw_location(items, "#{pointer}/items", &blk)
        elsif items.is_a?(Array)
          items.each_with_index { |b, i| each_raw_location(b, "#{pointer}/items/#{i}", &blk) }
        end
        %w[allOf anyOf oneOf].each do |comb|
          Array(node[comb]).each_with_index { |b, i| each_raw_location(b, "#{pointer}/#{comb}/#{i}", &blk) }
        end
        (node['definitions'] || {}).each { |k, v| each_raw_location(v, "#{pointer}/definitions/#{k}", &blk) }
      end

      private

      # The raw schema node at a pointer (intermediate segments dereferenced, the final node left
      # as authored so a broken $ref is visible to node_at). nil when a segment is missing.
      def resolve_pointer_raw(pointer)
        return @root_schema if pointer == '#' || pointer == '#/'

        segs = pointer.sub(%r{\A#/?}, '').split('/').map { |s| s.gsub('~1', '/').gsub('~0', '~') }
        node = @root_schema
        segs.each do |seg|
          node = deref(node)
          node = node.is_a?(Hash) ? node[seg] : nil
          return nil if node.nil?
        end
        node
      end
    end

    class << self
      # Read a schema file, compile it into a Table and return the Table. Raises, naming the
      # pointer, on a missing or unparsable file or a broken $ref under a start.
      def load(path, starts: STARTS)
        raise ArgumentError, "schema file not found: #{path}" unless File.exist?(path)

        schema = begin
          JSON.parse(File.read(path))
        rescue JSON::ParserError => e
          raise ArgumentError, "schema file unparsable (#{path}): #{e.message}"
        end
        table = Table.new(schema, starts: starts)
        # eager check of each start that the file holds, so a broken $ref raises here.
        starts.each do |ptr|
          next if ptr == '#'
          next unless table.pointer_exists?(ptr)

          table.node_at(ptr)
        end
        table
      end

      # The process table for scripts/scenario-schema.json, loaded on first use under a Mutex.
      def root
        @root_mutex ||= Mutex.new
        @root_mutex.synchronize { @root_table ||= load(DEFAULT_PATH) }
        @root_table.root
      end

      # The Node at a pointer in the process schema. Raises on a pointer not in STARTS, so a new
      # start cannot skip the compile.
      def at(pointer)
        raise ArgumentError, "pointer not in STARTS: #{pointer}" unless STARTS.include?(pointer)

        @root_mutex ||= Mutex.new
        @root_mutex.synchronize { @root_table ||= load(DEFAULT_PATH) }
        @root_table.node_at(pointer)
      end

      # Engine initializer body. With eager_load it loads the schema (raising on a broken one) and,
      # for the default path, installs the process table; otherwise it does nothing, so rake tasks
      # never read the schema.
      def boot_check!(app, path: DEFAULT_PATH)
        return unless app.config.eager_load

        table = load(path)
        if path == DEFAULT_PATH
          @root_mutex ||= Mutex.new
          @root_mutex.synchronize { @root_table = table }
        end
        table
      end

      # The Node of the value under a Hash key (rules 1-4 below). nil or FREE pass through.
      def child(node, key)
        classify(node, key.to_s).last
      end

      # The Node of an Array's items.
      def item(node)
        return FREE if node.equal?(FREE)
        return nil unless node.is_a?(Node)

        items = node.array_branches.map { |b| b['items'] }.select { |i| i.is_a?(Hash) }
        return node.table.make_node(items) unless items.empty?
        return FREE if node.array_branches.any? { |b| b['x-free-data'] == true }

        nil
      end

      def id_key?(node, key)
        classify(node, key.to_s).first == :id
      end

      def free?(node)
        return true if node.equal?(FREE)
        node.is_a?(Node) && node.free_branch?
      end

      # [:property|:id|:free|:undeclared, child_node]. Rules, in order, over the object-capable
      # branches of the Node.
      def classify(node, key)
        return [:undeclared, nil] if node.nil?
        return [:free, FREE] if node.equal?(FREE)
        return [:undeclared, nil] unless node.is_a?(Node)

        obranches = node.object_branches

        # 1. property: declared by name, or matched by a patternProperties pattern on a branch that
        #    is NOT a map (a map branch's patternProperties are never consulted).
        decl = []
        obranches.each do |b|
          if b['properties'].is_a?(Hash) && b['properties'].key?(key)
            decl << b['properties'][key]
          end
          next if map_branch?(b)

          (b['patternProperties'] || {}).each do |pat, sub|
            decl << sub if Regexp.new(pat).match?(key)
          end
        end
        return [:property, node.table.make_node(decl)] unless decl.empty?

        # 2. id: any branch is a map.
        map_branches = obranches.select { |b| map_branch?(b) }
        unless map_branches.empty?
          addl = map_branches.map { |b| b['additionalProperties'] }.select { |a| a.is_a?(Hash) }
          return [:id, addl.empty? ? nil : node.table.make_node(addl)]
        end

        # 3. free data.
        return [:free, FREE] if obranches.any? { |b| b['x-free-data'] == true }

        # 4. undeclared.
        [:undeclared, nil]
      end

      # A branch is a map when its additionalProperties is a schema or it carries "x-id-map": true.
      def map_branch?(branch)
        branch['additionalProperties'].is_a?(Hash) || branch['x-id-map'] == true
      end

      # Eager enumeration over the process schema (see Table#explore).
      def explore(**opts, &blk)
        @root_mutex ||= Mutex.new
        @root_mutex.synchronize { @root_table ||= load(DEFAULT_PATH) }
        @root_table.explore(**opts, &blk)
      end

      # Raw-schema location walk over the process schema (see Table#each_raw_location).
      def each_raw_location(&blk)
        @root_mutex ||= Mutex.new
        @root_mutex.synchronize { @root_table ||= load(DEFAULT_PATH) }
        @root_table.each_raw_location(&blk)
      end

      # The ways a raw schema location is open, as the schema-walk test's Marks part reads them:
      #   "obj"  - type explicitly allows object, with no properties and no additionalProperties schema
      #   "arr"  - type explicitly allows array, with no items schema
      #   "bare" - no type and constrains nothing at all (only description / x-marks)
      # additionalProperties:true is not a schema, so an empty "additionalProperties": true object is
      # open, while one that also declares properties is not (it has properties).
      def open_kinds(raw)
        return [] unless raw.is_a?(Hash)

        kinds = []
        t = raw['type']
        type_is_object = t == 'object' || (t.is_a?(Array) && t.include?('object'))
        type_is_array = t == 'array' || (t.is_a?(Array) && t.include?('array'))
        ap_schema = raw['additionalProperties'].is_a?(Hash)
        kinds << 'obj' if type_is_object && !raw.key?('properties') && !ap_schema
        kinds << 'arr' if type_is_array && !raw.key?('items')
        constrains = %w[$ref allOf anyOf oneOf enum const properties items].any? { |k| raw.key?(k) } ||
                     ap_schema || raw['additionalProperties'] == true
        kinds << 'bare' if !raw.key?('type') && !constrains
        kinds
      end

      # The x- marks a raw location carries, as "x-id-map:true" / "x-free-data:true" strings.
      def marks_on(raw)
        out = []
        out << "x-id-map:#{raw['x-id-map']}" if raw.is_a?(Hash) && raw.key?('x-id-map')
        out << "x-free-data:#{raw['x-free-data']}" if raw.is_a?(Hash) && raw.key?('x-free-data')
        out
      end

      # A combinator branch that holds only "required" describes no location (exempt from Marks).
      def only_required?(raw)
        raw.is_a?(Hash) && raw.key?('required') && (raw.keys - %w[required]).empty?
      end

      # A raw location that is a map: additionalProperties is a schema, or it carries x-id-map:true.
      def map_location?(raw)
        raw.is_a?(Hash) && (raw['additionalProperties'].is_a?(Hash) || raw['x-id-map'] == true)
      end

      # true when a schema branch's type allows the given JSON type (absent type allows anything).
      def type_allows?(branch, json_type)
        t = branch['type']
        return true if t.nil?
        return t == json_type if t.is_a?(String)
        return t.include?(json_type) if t.is_a?(Array)

        true
      end
    end
  end
end
