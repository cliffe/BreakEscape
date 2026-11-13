# frozen_string_literal: true

# Step 2b: author_notes (and, through it, scenario_schema) so the whole-tree walkers skip notes.
require_relative 'author_notes' unless defined?(BreakEscape::AuthorNotes)

module BreakEscape
  # Wearable items (docs/achitechture/WEARABLE_BUILD_LOG.md): the scenario-level rules the server
  # (Game::Wearables) and the validator (scripts/validate_wearable.rb) share, so both agree on
  # which items are wearable and which globals they own.
  #
  # An item is wearable when it has a `wearable` object with a non-empty `costume` and `global`.
  module WearableModel
    module_function

    # The normalised spec of an item's `wearable`, or nil when it is not a usable one.
    # { 'costume' =>, 'global' =>, 'unseenOnly' => bool, 'ignore' => [ids] }
    def spec(item)
      return nil unless item.is_a?(Hash)

      raw = item['wearable']
      return nil unless raw.is_a?(Hash)

      costume = raw['costume']
      global = raw['global']
      return nil unless costume.is_a?(String) && !costume.strip.empty?
      return nil unless global.is_a?(String) && !global.strip.empty?

      ignore = raw['seenBy'].is_a?(Hash) ? Array(raw['seenBy']['ignore']).grep(String) : []
      { 'costume' => costume, 'global' => global, 'unseenOnly' => raw['unseenOnly'] == true, 'ignore' => ignore }
    end

    # Every hash in the scenario that carries a `wearable` key: [{ item:, path: }]. Walks the whole
    # tree, so room objects, their contents, give_item items in any action list and NPC itemsHeld
    # are all found.
    def wearable_items(scenario)
      out = []
      # Step 2b: each_live skips "_" notes and visits free data in full; prune the `wearable`
      # subtree, as the by-hand walk did, since nothing wearable nests under another wearable.
      AuthorNotes.each_live(scenario, ScenarioSchema.root, prune: ->(k) { k == 'wearable' }) do |node, _snode, keys|
        out << { item: node, path: tree_path(keys) } if node.is_a?(Hash) && node.key?('wearable')
      end
      out
    end

    # The dotted/indexed path string the walkers report, built from an each_live key path.
    def tree_path(keys)
      keys.each_with_object(+'') do |k, s|
        if k.is_a?(Integer)
          s << "[#{k}]"
        else
          s << '/' unless s.empty?
          s << k
        end
      end
    end

    # The worn globals the scenario declares, sorted and unique.
    def worn_globals(scenario)
      wearable_items(scenario).filter_map { |e| spec(e[:item])&.dig('global') }.uniq.sort
    end

    # Every place in the scenario JSON that writes a global by name, outside the wear system:
    # set_global actions and setGlobal maps. [{ name:, path: }]
    def global_writers(scenario)
      out = []
      # Step 2b: each_live skips "_" notes and visits free data in full, so the 32 corpus
      # set_global writers inside item minigameData (free data) are still collected.
      AuthorNotes.each_live(scenario, ScenarioSchema.root) do |node, _snode, keys|
        next unless node.is_a?(Hash)

        path = tree_path(keys)
        out << { name: node['key'], path: path } if node['type'] == 'set_global' && node['key'].is_a?(String)
        if node['setGlobal'].is_a?(Hash)
          node['setGlobal'].each_key { |name| out << { name: name.to_s, path: "#{path}/setGlobal" } }
        end
      end
      out
    end
  end
end
