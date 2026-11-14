# frozen_string_literal: true

require_relative 'scenario_schema' unless defined?(BreakEscape::ScenarioSchema)
require_relative 'author_notes' unless defined?(BreakEscape::AuthorNotes)

module BreakEscape
  # Step 4 of the scenario format hardening. One shared schema walker: it visits the data and the
  # matching schema Node together, resolving $ref, oneOf and anyOf by the data's shape (through
  # ScenarioSchema.child and .item, which classify each key over the branches that can hold the
  # value in hand). Steps 6a and 6b reuse it. Plain Ruby, no Rails.
  #
  # The reference and id checks (validate_scenario.rb) drive it from schema annotations: a property
  # that names something carries "x-ref": "<kind>" (on the property, or, for an array of
  # references, on its items), and ref_kind reads it off the Node the walker pairs with each value.
  module SchemaWalk
    module_function

    # Yield [value, node, path] for every live value in data (data itself first), each paired with
    # the schema Node, ScenarioSchema::FREE, or nil that describes it. path is the keys (String) and
    # array indices (Integer) that reached the value. Descends with child and item, so oneOf/anyOf
    # and $ref are resolved by the data's actual shape, never guessed. "_" author notes (step 2b, by
    # the schema through AuthorNotes.note?, never by a name list) are skipped, so 6a and 6b can reuse
    # the walk without a note ever counting as live data; free data holds no notes and is walked in
    # full. This routes through AuthorNotes.each_live, the one walker that already pairs data with
    # schema and honours notes and free data together.
    def walk(data, node, path = [], &block)
      AuthorNotes.each_live(data, node, keys: path, &block)
    end

    # The "x-ref" kind a Node declares (the first object- or array-capable branch that carries one),
    # or nil. A string value is a reference when its own Node declares x-ref; an array's items each
    # resolve their own Node, whose x-ref (on the items schema) names the kind.
    def ref_kind(node)
      return nil unless node.is_a?(ScenarioSchema::Node)

      node.branches.each do |b|
        return b['x-ref'] if b.is_a?(Hash) && b['x-ref'].is_a?(String)
      end
      nil
    end

    # A readable path for a message: "rooms/closet/objects[0]/completeTask".
    def path_string(path)
      out = +''
      path.each do |seg|
        if seg.is_a?(Integer)
          out << "[#{seg}]"
        else
          out << '/' unless out.empty?
          out << seg
        end
      end
      out
    end
  end
end
