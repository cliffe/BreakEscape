# frozen_string_literal: true

require_relative 'scenario_schema' unless defined?(BreakEscape::ScenarioSchema)

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

    # Yield [value, node, path] for every value in data (data itself first), each paired with the
    # schema Node, ScenarioSchema::FREE, or nil that describes it. path is the keys (String) and
    # array indices (Integer) that reached the value. Descends with child and item, so oneOf/anyOf
    # and $ref are resolved by the data's actual shape, never guessed.
    def walk(data, node, path = [], &block)
      block.call(data, node, path)

      case data
      when Hash
        data.each do |k, v|
          ks = k.to_s
          walk(v, ScenarioSchema.child(node, ks), path + [ks], &block)
        end
      when Array
        inode = ScenarioSchema.item(node)
        data.each_with_index { |v, i| walk(v, inode, path + [i], &block) }
      end
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
