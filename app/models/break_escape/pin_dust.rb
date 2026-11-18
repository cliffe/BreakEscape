module BreakEscape
  # Dusting a PIN pad with the fingerprint kit. The grease and wear on a keypad show which
  # digits a code uses (not their order), so a dusted pad greys out every key the PIN does
  # not contain. The teaching point: 5,040 four-digit codes with distinct digits drop to 24.
  #
  # The PIN never leaves the server. The only thing sent is the sorted set of its distinct
  # digits, and only while a real (non-forged) fingerprint kit is in the server's copy of
  # the inventory. Dust is opt-in: a lock sets `dustable: true` (room for a door), and may
  # give `dustHint`, a line the pad shows once dusted. Anything else answers 422.
  #
  # player_state key (in Game::ACCESS_STATE_DEFAULTS):
  #   pinDusted  { "door:<room>" or "object:<id>" => "0179" }  server-written only, never read
  #              from a sync body and never in the bootstrap. Keyed by the lock's canonical id, so
  #              at most one short string per PIN lock in the scenario (bounded by authorship),
  #              never re-sent: the pad asks for its own lock when it opens (a delta of one lock).
  module PinDust
    extend ActiveSupport::Concern

    FINGERPRINT_KIT_TYPE = 'fingerprint_kit'.freeze

    def has_fingerprint_kit_in_inventory?
      Array(player_state['inventory']).any? do |item|
        next false unless item.is_a?(Hash)
        next false if BreakEscape::ItemIdentity.client_forged?(item)

        item['scenarioData']&.dig('type') == FINGERPRINT_KIT_TYPE || item['type'] == FINGERPRINT_KIT_TYPE
      end
    end

    # The PIN lock a pad targets, or nil. The same gates the cracker's pips use: a target
    # under a sign-in scope the player has not opened, or in a served-but-unearned route
    # room, answers as if nothing were there.
    def pin_dust_lock(target_type, target_id)
      return nil unless target_id.present?
      return nil if target_type.to_s != 'door' && unlock_scope_refused?(target_id.to_s)
      return nil if target_type.to_s != 'door' && object_in_unpromoted_route_room?(target_id.to_s)

      lock = target_type.to_s == 'door' ? room_data(target_id.to_s) : find_scenario_object(target_id.to_s)
      return nil unless lock.is_a?(Hash) && lock['lockType'] == 'pin' && lock['requires'].present?

      lock
    end

    # Peek (apply false): the digits already dusted at this lock, if any. Needs no kit and
    # tells nothing for a lock that was never dusted, or is not a PIN lock.
    # Apply (apply true): dust the lock now. One time per lock; a second ask returns the
    # same record. Returns { status:, body: } for the controller.
    def pin_dust!(target_type, target_id, apply:)
      # Like unlock: a pad on a door says 'door', anything else (the client sends 'item' for a
      # safe or PC) is an object.
      target_type = target_type.to_s == 'door' ? 'door' : 'object'
      lock = pin_dust_lock(target_type, target_id)
      key = pin_dust_key(target_type, target_id, lock)
      record = pin_dust_records[key]

      unless apply
        return { status: :ok, body: { success: true, dusted: false } } unless record.present? && lock

        return { status: :ok, body: pin_dust_body(record, lock) }
      end

      return pin_dust_refusal(:forbidden, 'no_kit', 'You need a fingerprint kit to dust a keypad.') unless has_fingerprint_kit_in_inventory?
      return pin_dust_refusal(:not_found, 'nothing_to_dust', 'Nothing to dust here.') unless lock
      return pin_dust_refusal(:unprocessable_entity, 'not_dustable', 'This keypad cannot be dusted.') unless lock['dustable'] == true

      if record.blank?
        record = lock['requires'].to_s.chars.select { |c| c.match?(/\A\d\z/) }.uniq.sort.join
        player_state['pinDusted'] = pin_dust_records.merge(key => record)
        save!
      end
      { status: :ok, body: pin_dust_body(record, lock) }
    end

    private

    # Canonical lock id, so an alias (name, generated id) cannot make a second record.
    # A door is keyed by room id; an object by its scenario id when it has one.
    def pin_dust_key(target_type, target_id, lock)
      canonical = target_type == 'door' ? target_id.to_s : (lock.is_a?(Hash) && lock['id'].present? ? lock['id'].to_s : target_id.to_s)
      "#{target_type}:#{canonical}"
    end

    def pin_dust_records
      recs = player_state['pinDusted']
      recs.is_a?(Hash) ? recs : {}
    end

    def pin_dust_body(record, lock)
      body = { success: true, dusted: true, digits: record.chars }
      body[:hint] = lock['dustHint'].to_s if lock['dustHint'].is_a?(String) && lock['dustHint'].present?
      body
    end

    def pin_dust_refusal(status, reason, message)
      { status: status, body: { success: false, reason: reason, message: message } }
    end
  end
end
