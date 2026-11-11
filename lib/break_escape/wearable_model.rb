# frozen_string_literal: true

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
      walk = lambda do |node, path|
        case node
        when Hash
          out << { item: node, path: path } if node.key?('wearable')
          node.each { |k, v| walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}") unless k == 'wearable' }
        when Array
          node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
        end
      end
      walk.call(scenario, '')
      out
    end

    # The worn globals the scenario declares, sorted and unique.
    def worn_globals(scenario)
      wearable_items(scenario).filter_map { |e| spec(e[:item])&.dig('global') }.uniq.sort
    end

    # The spec for an item id, from the first wearable item in the scenario with that id.
    def spec_for_id(scenario, item_id)
      return nil if item_id.to_s.empty?

      entry = wearable_items(scenario).find { |e| e[:item]['id'].to_s == item_id.to_s && spec(e[:item]) }
      entry && spec(entry[:item])
    end

    # Every place in the scenario JSON that writes a global by name, outside the wear system:
    # set_global actions and setGlobal maps. [{ name:, path: }]
    def global_writers(scenario)
      out = []
      walk = lambda do |node, path|
        case node
        when Hash
          if node['type'] == 'set_global' && node['key'].is_a?(String)
            out << { name: node['key'], path: path }
          end
          if node['setGlobal'].is_a?(Hash)
            node['setGlobal'].each_key { |name| out << { name: name.to_s, path: "#{path}/setGlobal" } }
          end
          node.each { |k, v| walk.call(v, path.empty? ? k.to_s : "#{path}/#{k}") }
        when Array
          node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]") }
        end
      end
      walk.call(scenario, '')
      out
    end
  end
end
