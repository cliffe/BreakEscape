# frozen_string_literal: true

# Step 2b: author_notes (and, through it, scenario_schema) so collect skips notes.
require_relative 'author_notes' unless defined?(BreakEscape::AuthorNotes)

module BreakEscape
  # A scenario's own client-side give_item actions, read as the server's allowlist
  # for those rewards (docs/achitechture/DECLARED_GRANTS_PLAN.md).
  #
  # A declared grant is a { "type": "give_item", "item": {...} } node whose item has
  # a string type and an identity (id, opens_lock, legacy key_id/keyId), sitting on a
  # path the engine actually runs give_item from:
  #
  #   timers[i].actions[j]                     scenario-timer-dispatcher.js
  #   <object>.triggerOnInteract[j]            interactions.js
  #   <object>.onInteract.actions[j]           interactions.js
  #   completionActions[j]                     esd-pushbutton-minigame.js
  #   conditionalActions[k].actions[j]         esd-pushbutton-minigame.js
  #   <confirm_action>.onConfirm[j]            apply-actions.js, when the confirm_action
  #                                            itself sits on one of these paths
  #
  # Anything under flagRewards (server-delivered), eventMappings (never run) or
  # startItemsInInventory is not a grant, nor are notepad and decor cups.
  #
  # Plain Ruby, no ActiveSupport and no ItemIdentity (which uses blank?), so the
  # validator and the dungeon-graph generator require_relative this file and agree
  # with the server on what a grant is.
  module DeclaredGrants
    module_function

    ALWAYS_ALLOWED = %w[notepad].freeze
    DECOR_CUPS = %w[office-misc-cup office-misc-cup2 office-misc-cup3 office-misc-cup4
                    office-misc-cup5 coffee_cups1 mugs_tray1].freeze
    # Server-delivered or start items: neither grants nor reported as unexecuted.
    SKIPPED_KEYS = %w[flagRewards startItemsInInventory].freeze
    # Never run by the engine: not grants, and the validator reports them.
    NEVER_RUN_KEYS = %w[eventMappings].freeze

    # Everything a scenario item is identified by: the set ItemIdentity.addressed_by?
    # reads on the scenario side, and the validator's identities lambda.
    def identities(item)
      return [] unless item.is_a?(Hash)

      %w[id opens_lock key_id keyId].map { |k| item[k] }.compact.map(&:to_s).reject(&:empty?).uniq
    end

    # A give_item node whose item is identified and not always-allowed or decor.
    def identified_give_item?(node)
      return false unless node.is_a?(Hash) && node['type'] == 'give_item'

      item = node['item']
      return false unless item.is_a?(Hash) && item['type'].is_a?(String)
      return false if ALWAYS_ALLOWED.include?(item['type'])
      return false if item['decor'] == true && DECOR_CUPS.include?(item['type'])

      identities(item).any?
    end

    # [{ 'path' => 'timers[0]/actions[0]', 'item' => {...} }, ...] in walk order.
    def for(scenario_data)
      collect(scenario_data).select { |entry| entry[:executed] }.map { |e| { 'path' => e[:path], 'item' => e[:item] } }
    end

    # Identified give_items the engine never runs (e.g. under eventMappings), for the
    # validator: [{ 'path' => ..., 'item' => ... }].
    def unexecuted(scenario_data)
      collect(scenario_data).reject { |entry| entry[:executed] || entry[:excluded] }
                            .map { |e| { 'path' => e[:path], 'item' => e[:item] } }
    end

    # On a give_item node: drop the item's contents (they are served from the held
    # grant, never shipped) and mark it a container. Returns true when it stripped.
    def strip_grant_contents!(node)
      return false unless identified_give_item?(node)

      item = node['item']
      return false unless item.key?('contents')

      item.delete('contents')
      item['hasContents'] = true
      true
    end

    # strip_grant_contents! on every give_item node anywhere in the tree, for filters
    # that recurse into only some keys (Game#filter_requires_and_contents_recursive
    # does not descend into triggerOnInteract or onInteract).
    def strip_all_grant_contents!(tree)
      case tree
      when Hash
        strip_grant_contents!(tree)
        tree.each_value { |v| strip_all_grant_contents!(v) }
      when Array
        tree.each { |v| strip_all_grant_contents!(v) }
      end
      tree
    end

    # Is the give_item at this key chain on a path the engine runs?
    def executed?(keys)
      return false if keys.length < 2 || !keys[-1].is_a?(Integer)

      list_key = keys[-2]
      parent_key = keys[0...-2].reverse.find { |k| k.is_a?(String) }
      case list_key
      when 'triggerOnInteract', 'completionActions'
        true
      when 'actions'
        (parent_key == 'timers' && keys[0] == 'timers') ||
          parent_key == 'onInteract' || parent_key == 'conditionalActions'
      when 'onConfirm'
        executed?(keys[0...-2])
      else
        false
      end
    end

    def collect(scenario_data)
      out = []
      return out unless scenario_data.is_a?(Hash)

      # Step 2b: AuthorNotes.each_live skips "_" notes (so a give_item an author commented out
      # under a "_draft" never counts as declared) and visits free data in full (so a give_item
      # inside a minigame's completionActions is still declared).
      AuthorNotes.each_live(scenario_data, ScenarioSchema.root) do |node, _snode, keys|
        next unless node.is_a?(Hash) && identified_give_item?(node)

        excluded = keys.any? { |k| SKIPPED_KEYS.include?(k) }
        never_run = keys.any? { |k| NEVER_RUN_KEYS.include?(k) }
        out << { path: path_string(keys), item: node['item'],
                 excluded: excluded, executed: !excluded && !never_run && executed?(keys) }
      end
      out
    end

    def path_string(keys)
      keys.each_with_object(+'') do |k, s|
        if k.is_a?(Integer)
          s << "[#{k}]"
        else
          s << '/' unless s.empty?
          s << k
        end
      end
    end
  end
end
