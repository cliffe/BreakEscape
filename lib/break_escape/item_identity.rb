# frozen_string_literal: true

module BreakEscape
  # Server-side counterpart to lockRef() in public/break_escape/js/utils/helpers.js.
  # Keep the two in step: the client decides what to send, the server decides
  # whether to believe it, and they have to agree on what the fields mean.
  #
  #   type       what class of thing this is
  #   id         which object this is (identity -- unique)
  #   opens_lock which lock it opens (a reference -- many-to-one)
  #
  # The key_id fallbacks below are BACKWARD COMPATIBILITY ONLY. A game snapshots
  # its scenario_data when it is created (game.rb, before_create
  # :generate_scenario_data_with_context), so a mission started before the
  # rename still carries the old field and must be allowed to finish. Scenario
  # files must use opens_lock; the validator errors on key_id. Drop the
  # key_id legs once the last pre-rename game has finished.
  module ItemIdentity
    module_function

    # Which lock does this item open? Never an identity.
    def lock_ref(item)
      return nil if item.blank?

      fetch(item, 'opens_lock') || fetch(item, 'key_id')
    end

    # Everything this item could reasonably be addressed by, most specific
    # first. Callers compare against the whole set rather than picking one,
    # because a key carries opens_lock and usually no id, while a document
    # carries an id and no opens_lock.
    def identity_candidates(item)
      return [] if item.blank?

      [fetch(item, 'id'), lock_ref(item)].compact.map(&:to_s).reject(&:empty?).uniq
    end

    # Does `item` refer to the same object as `other`? Type must match; then any
    # shared identity, or failing that a shared name.
    def same_item?(item, other)
      return false if item.blank? || other.blank?
      return false unless fetch(item, 'type') == fetch(other, 'type')

      ids = identity_candidates(item)
      other_ids = identity_candidates(other)
      return true if ids.any? && other_ids.any? && (ids & other_ids).any?

      name = fetch(item, 'name')
      other_name = fetch(other, 'name')
      return true if name.present? && other_name.present? && name.to_s == other_name.to_s

      # No id and no name to go on: type alone is all the object offers.
      ids.empty? && name.blank?
    end

    # Is `obj` the scenario item the client calls (type, id, name)? Identity first:
    # if both sides have one, only a shared id counts, so two items with the same
    # name but different ids are distinct. The name is used only when the scenario
    # item has no identity of its own (or the client sent none).
    def addressed_by?(obj, type, id, name)
      return false if obj.blank?
      return false unless fetch(obj, 'type') == type

      ids = identity_candidates(obj)
      key_id = fetch(obj, 'keyId')
      ids |= [key_id.to_s] if key_id.present?

      return ids.include?(id.to_s) if id.present? && ids.any?

      obj_name = fetch(obj, 'name')
      return false if obj_name.blank?

      [name, id].any? { |n| n.present? && n.to_s == obj_name.to_s }
    end

    # Reads a key from a hash that may use string or symbol keys.
    def fetch(item, key)
      return nil unless item.respond_to?(:[])

      item[key] || item[key.to_sym]
    end
  end
end
