# frozen_string_literal: true

require_relative 'scenario_schema' unless defined?(BreakEscape::ScenarioSchema)

module BreakEscape
  # Step 2b. Author notes ("_"-prefixed property names, step 2's schema rule) are not live and
  # never ship. This module decides whether a key is a note (by the schema, through ScenarioSchema,
  # never by a list of names), walks a scenario yielding only live values, and strips notes from a
  # payload copy. Free data holds no notes and is walked in full, so a grant inside a minigame's
  # action list keeps working.
  module AuthorNotes
    module_function

    # true when key is a note at the Node: a String starting with "_" and either the Node is nil
    # (undescribed structure) or the Node is not free and the schema gives the key as a property
    # (rule 1) or as undeclared (rule 4). False for an id (rule 2), for every key of a free Node,
    # and under FREE, so inside a free-marked location no key at any depth is a note.
    def note?(node, key)
      return false unless key.is_a?(String) && key.start_with?('_')
      return true if node.nil?
      return false if ScenarioSchema.free?(node)

      kind, = ScenarioSchema.classify(node, key)
      kind == :property || kind == :undeclared
    end

    # Yield every value outside a note, with its Node and its key path. Descends with child and
    # item, skipping a Hash entry when note? is true. Free values are yielded and descended into
    # like any other, so every value inside a free-marked location is yielded. free: :skip neither
    # yields nor descends into a value whose Node is free (only step 7's upgrader passes it).
    # prune: a predicate on a key the walker does not descend into.
    def each_live(data, node, prune: nil, free: :visit, keys: [], &block)
      return if free == :skip && ScenarioSchema.free?(node)

      block.call(data, node, keys)

      case data
      when Hash
        data.each do |k, v|
          ks = k.to_s
          next if note?(node, ks)
          next if prune && prune.call(ks)

          each_live(v, ScenarioSchema.child(node, ks), prune: prune, free: free, keys: keys + [ks], &block)
        end
      when Array
        inode = ScenarioSchema.item(node)
        data.each_with_index do |v, i|
          each_live(v, inode, prune: prune, free: free, keys: keys + [i], &block)
        end
      end
    end

    # Delete every "_" key that note? calls a note, at any depth, in place, and return obj. note?
    # is false everywhere inside free data, so free data ships as authored. Run on a payload copy,
    # never on the stored scenario_data.
    def strip_notes!(obj, node)
      case obj
      when Hash
        obj.keys.each do |k|
          ks = k.to_s
          if note?(node, ks)
            obj.delete(k)
          else
            strip_notes!(obj[k], ScenarioSchema.child(node, ks))
          end
        end
      when Array
        inode = ScenarioSchema.item(node)
        obj.each { |v| strip_notes!(v, inode) }
      end
      obj
    end
  end
end
