# frozen_string_literal: true

require 'openssl'
require_relative 'access_identities' unless defined?(BreakEscape::AccessIdentities)
require_relative 'access_work' unless defined?(BreakEscape::AccessWork)
require_relative 'npc_habits' unless defined?(BreakEscape::NpcHabits)

module BreakEscape
  # The multi-factor sign-in model (S8a, feature A22), read from the authored scenario. Plain Ruby,
  # no Rails and no ActiveSupport, so the validator and the dungeon-graph generator can require it
  # and agree with the server, as CredentialModel is shared. Every function is deterministic: no
  # random draw, and no clock (the caller passes the window).
  module MfaModel
    module_function

    KINDS = %w[none push push_number_match code].freeze
    OWNER_BOUND_TYPES = %w[phone_friendface code_device].freeze
    CODE_DEVICE = 'code_device'

    STEP_SECONDS = 60
    PENDING_SECONDS = 300
    PROMPT_GAP_SECONDS = 2
    MAX_PROMPTS = 20
    MAX_CODE_TRIES = 5
    MAX_CODE_WRONG_TOTAL = 30
    CODE_CLOSED_SECONDS = 300

    PROMPT_PRESETS = { 'low' => 'pestered', 'medium' => 'never', 'high' => 'never' }.freeze
    PROMPT_HABITS = %w[never pestered always].freeze
    DEFAULT_PATIENCE = 3

    # A policy's `mfa` value if it is a valid kind, else 'none'
    def kind(policy)
      value = policy.is_a?(Hash) ? policy['mfa'] : nil
      KINDS.include?(value) ? value : 'none'
    end

    # An account is enrolled unless `creds.mfa` is the literal false ("false" and 0 do not exempt)
    def enrolled?(npc)
      creds = npc.is_a?(Hash) ? npc['creds'] : nil
      !(creds.is_a?(Hash) && creds['mfa'] == false)
    end

    # Every authored item (room objects and their contents, NPC itemsHeld, start items), each as
    # { item:, via:, npc: } where npc is the holding room NPC (a Hash) or nil
    def each_authored_item(scenario)
      out = []
      walk = lambda do |list, via, npc|
        Array(list).each do |o|
          next unless o.is_a?(Hash)

          out << { item: o, via: via, npc: npc }
          walk.call(o['contents'], via, npc)
          walk.call(o['itemsHeld'], via, npc)
        end
      end
      rooms = scenario.is_a?(Hash) && scenario['rooms'].is_a?(Hash) ? scenario['rooms'] : {}
      rooms.each_value do |room|
        next unless room.is_a?(Hash)

        walk.call(room['objects'], :object, nil)
        Array(room['npcs']).each do |npc|
          next unless npc.is_a?(Hash)

          Array(npc['itemsHeld']).each do |held|
            next unless held.is_a?(Hash)

            out << { item: held, via: :held, npc: npc }
            walk.call(held['contents'], :held, npc)
          end
        end
      end
      walk.call(scenario.is_a?(Hash) ? scenario['startItemsInInventory'] : nil, :start, nil)
      out
    end

    # The authored code_device whose owner is the NPC, by the phone's walk: room objects and their
    # contents, NPC itemsHeld, start items. nil when there is none.
    def device_for(scenario, npc_id)
      return nil unless npc_id.is_a?(String) && !npc_id.empty?

      found = each_authored_item(scenario).find do |e|
        e[:item]['type'] == CODE_DEVICE && e[:item]['id'].is_a?(String) && e[:item]['owner'] == npc_id
      end
      found && found[:item]
    end

    # The items of OWNER_BOUND_TYPES (or any type, when `types` is given) the player can come to
    # hold, as [{ type:, id:, via: }], via one of :object, :start, :offer, :knock_out. A room NPC's
    # itemsHeld item counts only when its story offers that type or the NPC can be knocked out.
    # `story_file` (optional block) maps a storyPath to a readable path or nil. Headless records
    # and declared grants never count.
    def held_item_sources(scenario, types = OWNER_BOUND_TYPES, &story_file)
      attacks_off = scenario.is_a?(Hash) && scenario['disableAttacks'] == true
      out = []
      each_authored_item(scenario).each do |e|
        item = e[:item]
        type = item['type']
        next unless types.include?(type) && item['id'].is_a?(String)

        case e[:via]
        when :object, :start
          out << { type: type, id: item['id'], via: e[:via] }
        when :held
          npc = e[:npc]
          if AccessWork.offer_texts(npc, &story_file).any? { |t| AccessWork.offers_item_text?(t, type) }
            out << { type: type, id: item['id'], via: :offer }
          elsif !attacks_off && npc['koImmune'] != true && npc['npcType'] != 'phone'
            out << { type: type, id: item['id'], via: :knock_out }
          end
        end
      end
      out
    end

    def digest(key, message)
      OpenSSL::HMAC.digest('SHA256', key.to_s, message)
    end

    # Six digits, zero padded, from HMAC-SHA256 over "<game id>|<device id>|<window>"
    def code(key, game_id, device_id, window)
      n = digest(key, "#{game_id}|#{device_id}|#{window}")[0, 8].unpack1('Q>')
      format('%06d', n % 1_000_000)
    end

    # How a typed code stands. `codes` maps window => code for window-3..window. Answers
    # [state, reason]: [:right, nil] for the current or previous window's code when that window is
    # later than `used_window` (nil = none used); [:stale, :used] for such a code whose window is
    # used; [:stale, :expired] for the code of an older of the last four windows; else [:wrong, nil].
    def code_state(typed, codes, used_window, window)
      typed = typed.to_s
      return [:wrong, nil] unless codes.is_a?(Hash)

      live = [window, window - 1]
      live.each do |w|
        next unless codes[w].is_a?(String) && codes[w] == typed

        return [:right, nil] if used_window.nil? || w > used_window
      end
      return [:stale, :used] if live.any? { |w| codes[w].is_a?(String) && codes[w] == typed }
      return [:stale, :expired] if [window - 2, window - 3].any? { |w| codes[w].is_a?(String) && codes[w] == typed }

      [:wrong, nil]
    end

    PERMUTATIONS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].freeze

    # One HMAC gives the right two-digit number (10..99), two different wrong ones, and the order
    # of the three. { right:, wrong: [a, b], choices: [three, in display order] }
    def numbers(key, game_id, subject_key, npc_id, nonce)
      d = digest(key, "#{game_id}|#{subject_key}|#{npc_id}|#{nonce}")
      right = 10 + (d[0, 4].unpack1('N') % 90)
      pool = (10..99).to_a - [right]
      a = pool.delete_at(d[4, 4].unpack1('N') % pool.size)
      b = pool.delete_at(d[8, 4].unpack1('N') % pool.size)
      order = PERMUTATIONS[d[12, 4].unpack1('N') % 6]
      base = [right, a, b]
      { right: right, wrong: [a, b], choices: order.map { |i| base[i] } }
    end

    # Authored habits.approvesPrompts if valid, else the preset for the NPC's level, else 'never'
    def prompt_habit(npc, scenario)
      habits = npc.is_a?(Hash) ? npc['habits'] : nil
      own = habits.is_a?(Hash) ? habits['approvesPrompts'] : nil
      return own if PROMPT_HABITS.include?(own)

      PROMPT_PRESETS[NpcHabits.level_of(npc, scenario)] || 'never'
    end

    # Authored habits.promptPatience if an integer 2..9, else 3
    def prompt_patience(npc)
      habits = npc.is_a?(Hash) ? npc['habits'] : nil
      v = habits.is_a?(Hash) ? habits['promptPatience'] : nil
      v.is_a?(Integer) && v.between?(2, 9) ? v : DEFAULT_PATIENCE
    end
  end
end
