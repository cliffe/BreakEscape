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
