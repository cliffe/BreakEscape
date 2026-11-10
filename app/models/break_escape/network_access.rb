module BreakEscape
  # Networks for the player (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md, slice 9.3a):
  # footholds gained by planting a rogue device in a network jack, the link item that
  # stands for each, the network view, remote sign-in through a foothold, hosts with no
  # screen of their own, and file shares.
  #
  # The scenario-level rules (membership, jacks, hosts, resources, reach) are in
  # BreakEscape::NetworkModel, which the validator and the dungeon graph share. This
  # concern holds the player-side model code, so Game takes only small hooks.
  #
  # player_state keys (in Game::ACCESS_STATE_DEFAULTS):
  #   footholds        { footholdId => { 'via', 'network', 'source', 'device', 'seq' } }
  #   gainedFootholds  [jackId, ...], every jack a foothold was ever gained from
  module NetworkAccess
    extend ActiveSupport::Concern

    # Top-level scenario keys the bootstrap never ships (section 6).
    WITHHELD_SCENARIO_KEYS = %w[networks networkLinks resources].freeze
    # Fields deleted from every object the server sends: membership, and the jack's
    # link name and holder, which arrive on the link item (section 6).
    WITHHELD_OBJECT_FIELDS = %w[network linkName linkStoreIn].freeze

    def withhold_network_keys!(filtered)
      WITHHELD_SCENARIO_KEYS.each { |key| filtered.delete(key) }
      filtered
    end

    # Room data (section 6): each jack carries jackPlanted, true while the server holds a
    # foothold there, so the jack's look survives a reload.
    def attach_network_state!(objects)
      Array(objects).each do |obj|
        next unless obj.is_a?(Hash)

        obj['jackPlanted'] = network_footholds.key?(foothold_id_for(obj['id'])) if NetworkModel.jack?(obj)
        attach_network_state!(obj['contents']) if obj['contents'].is_a?(Array)
      end
    end

    # A jack's foothold id (4.1).
    def foothold_id_for(jack_id)
      "jack_#{jack_id}"
    end

    # The footholds held now. A game from before this slice has no key: read as none.
    def network_footholds
      held = player_state.is_a?(Hash) ? player_state['footholds'] : nil
      held.is_a?(Hash) ? held : {}
    end

    def gained_footholds
      list = player_state.is_a?(Hash) ? player_state['gainedFootholds'] : nil
      list.is_a?(Array) ? list : []
    end

    # Ids for items in a resource's contents (3.4): `<resourceId>_content_<n>`, nested
    # as Game#stamp_contents_ids! nests them. Called by stamp_scenario_object_ids!.
    def stamp_resource_content_ids!
      NetworkModel.resources(scenario_data).each do |resource_id, resource|
        next unless resource['contents'].is_a?(Array)

        resource['contents'].each_with_index do |item, i|
          next unless item.is_a?(Hash)

          item['id'] ||= "#{resource_id}_content_#{i}"
          stamp_contents_ids!(item)
        end
      end
    end
  end
end
