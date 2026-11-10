# frozen_string_literal: true

require 'json'
require_relative 'access_identities' unless defined?(BreakEscape::AccessIdentities)
require_relative 'network_model' unless defined?(BreakEscape::NetworkModel)

module BreakEscape
  # Access model slice 9.2 (docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md, section 10): one
  # resolver for work, outages and frustration, called by the server (Game) and by the validator,
  # so the two cannot drift apart. It resolves an NPC's work list (its roles in order, `staff`
  # last, then its own `+` and `-`), its frustration settings (defaults, then role defaults, then
  # its own, field by field), its workarounds, the "can fail" rule, use times, the desk rule, an
  # NPC's places for a need and its shortest use time there, and the causes the server owns.
  #
  # Plain Ruby with no Rails methods, as AccessIdentities and NetworkModel are.
  module AccessWork
    module_function

    FRUSTRATION_DEFAULTS = { 'perFail' => 25, 'easePerSuccess' => 10, 'breakDrain' => 10 }.freeze
    FRUSTRATION_BOUNDS = { 'perFail' => [1, 100], 'easePerSuccess' => [0, 100], 'breakDrain' => [0, 50] }.freeze
    NEEDS_DEFAULT_USE_SECONDS = 20   # npc-needs.js: clamp(useSeconds, 0, 600), else 20
    NEEDS_DEFER_MIN = 4              # npc-needs.js NEEDS_DEFER_MIN
    SOCIAL_USE_SECONDS = 20          # plan 8.1: socialUse.useSeconds default
    JUDGED_NEEDS = %w[work social_media].freeze
    WORKAROUND_KINDS = %w[writes_down prop_door emit borrow_session share_login].freeze
    PRESETS_FILE = File.expand_path('../../public/break_escape/js/data/office-presets.json', __dir__)
    FAIL_CAUSES = %w[down unreachable no_access off locked_out social_blocked].freeze
    # The causes no event in play can clear (plan 9.1, gate 2)
    OWNED_CAUSES = %w[no_access unreachable_never social_blocked locked_out].freeze

    # ── scenario reads ──────────────────────────────────────────────────

    def resources(data) = NetworkModel.resources(data)

    def roles_block(data)
      r = data.is_a?(Hash) ? data['roles'] : nil
      r.is_a?(Hash) ? r : {}
    end

    # The NPC's roles in authored order with `staff` last (AccessIdentities.identity_roles adds
    # the implicit staff of an NPC with creds or a card).
    def npc_roles(npc)
      roles = AccessIdentities.identity_roles(npc)
      roles.include?('staff') ? (roles - ['staff']) + ['staff'] : roles
    end

    # Every room object (recursing into contents) by id: { obj, room_id, room }
    def object_index(data)
      NetworkModel.room_objects(data).each_with_object({}) do |e, h|
        id = e[:object]['id']
        h[id] ||= { obj: e[:object], room_id: e[:room_id], room: e[:room] } if id.is_a?(String) && !id.empty?
      end
    end

    def object(data, id) = (id.is_a?(String) ? object_index(data)[id]&.dig(:obj) : nil)

    # ── work list, frustration, workarounds ─────────────────────────────

    # The NPC's resolved work list: the union of its roles' workNeeds (roles in order, staff
    # last), then its own entries ("x" or "+x" adds, "-x" removes). Ids only, in order.
    def work_list(data, npc)
      return [] unless npc.is_a?(Hash)

      out = []
      roles = roles_block(data)
      npc_roles(npc).each do |role|
        Array(roles.dig(role, 'workNeeds')).each do |id|
          next unless id.is_a?(String)

          id = id.delete_prefix('+')
          out << id unless id.empty? || id.start_with?('-') || out.include?(id)
        end
      end
      Array(npc['workNeeds']).each do |entry|
        next unless entry.is_a?(String) && !entry.empty?

        if entry.start_with?('-')
          out.delete(entry[1..])
        else
          id = entry.delete_prefix('+')
          out << id unless id.empty? || out.include?(id)
        end
      end
      out
    end

    # Defaults, then each field from the first of the NPC's roles that sets it, then its own
    def frustration(data, npc)
      out = FRUSTRATION_DEFAULTS.dup
      roles = roles_block(data)
      FRUSTRATION_DEFAULTS.each_key do |field|
        role = npc_roles(npc).find { |r| roles.dig(r, 'frustration').is_a?(Hash) && roles.dig(r, 'frustration', field).is_a?(Numeric) }
        out[field] = roles.dig(role, 'frustration', field) if role
      end
      own = npc.is_a?(Hash) && npc['frustration'].is_a?(Hash) ? npc['frustration'] : {}
      FRUSTRATION_DEFAULTS.each_key { |f| out[f] = own[f] if own[f].is_a?(Numeric) }
      FRUSTRATION_BOUNDS.each { |f, (lo, hi)| out[f] = out[f].to_f.clamp(lo, hi) }
      out
    end

    # The NPC's own list, else the first of its roles that has one; never merged
    def workarounds(data, npc)
      return npc['workarounds'].select { |w| w.is_a?(Hash) } if npc.is_a?(Hash) && npc['workarounds'].is_a?(Array)

      roles = roles_block(data)
      role = npc_roles(npc).find { |r| roles.dig(r, 'workarounds').is_a?(Array) }
      role ? roles.dig(role, 'workarounds').select { |w| w.is_a?(Hash) } : []
    end

    def need?(npc, name) = npc.is_a?(Hash) && npc['needs'].is_a?(Hash) && npc['needs'][name].is_a?(Hash)

    # A `work` plan: a work need and a non-empty resolved list (plan 5.2, "judged")
    def work_plan?(data, npc) = need?(npc, 'work') && !work_list(data, npc).empty?

    def phone?(npc) = npc.is_a?(Hash) && npc['phone'] != false

    # Judged: work with a plan, or social_media
    def judged?(data, npc, need)
      case need
      when 'work' then work_plan?(data, npc)
      when 'social_media' then need?(npc, 'social_media')
      else false
      end
    end

    def defer_min(npc)
      v = npc.is_a?(Hash) ? npc['needsDeferMin'] : nil
      v.is_a?(Numeric) && v.positive? ? v.to_f.clamp(0.1, 120) : NEEDS_DEFER_MIN
    end

    # ── objects: affordances, use times, desks ──────────────────────────

    def preset_table
      @preset_table ||= File.file?(PRESETS_FILE) ? (JSON.parse(File.read(PRESETS_FILE))['presets'] || {}) : {}
    end

    def presets_on?(data) = data.is_a?(Hash) && data['officePresets'] == true

    # office-presets.js presetIdFor, ignoring the scenario switch
    def preset_id(obj)
      return nil unless obj.is_a?(Hash)
      return nil if !obj['id'].is_a?(String) || obj['id'].empty? || obj['decor'] == true
      return nil if obj['affordance'] == false || obj['takeable'] == true || obj['lockType']
      return (preset_table.key?(obj['officeType']) ? obj['officeType'] : nil) if obj['officeType'].is_a?(String)

      preset_table.find { |_id, p| Array(p['types']).include?(obj['type']) }&.first
    end

    # The object's affordance: its own fields over its preset (presets on); nil for none
    def affordance(data, obj)
      return nil if !obj.is_a?(Hash) || obj['affordance'] == false

      own = obj['affordance'].is_a?(Hash) ? obj['affordance'] : nil
      pid = presets_on?(data) ? preset_id(obj) : nil
      return own unless pid

      (preset_table.dig(pid, 'affordance') || {}).merge(own || {})
    end

    def satisfies?(data, obj, need) = Array(affordance(data, obj)&.dig('satisfies')).include?(need)

    # The needs system's use time: authored, else the preset's, else 20 seconds
    def use_seconds(data, obj)
      v = affordance(data, obj)&.dig('useSeconds')
      v.is_a?(Numeric) && v.finite? ? v.to_f.clamp(0, 600) : NEEDS_DEFAULT_USE_SECONDS
    end

    # A desk (plan 5.2): a workstation by isWorkstation's rule, or an object whose preset is desk_pc
    def desk?(data, obj)
      return false unless obj.is_a?(Hash)
      return true if obj['id'].is_a?(String) && !obj['id'].empty? &&
                     (obj['workstation'] == true || obj.key?('locksScreenOnLeave') || obj.key?('lockChance') || obj['lockType'] == 'login')

      presets_on?(data) && preset_id(obj) == 'desk_pc'
    end

    def station(data, npc)
      home = npc.is_a?(Hash) ? npc['needsHome'] : nil
      home.is_a?(String) ? object(data, home) : nil
    end

    # PCs the NPC's borrow_session workarounds name
    def borrow_pcs(data, npc)
      workarounds(data, npc).filter_map { |w| w['pc'] if w['do'] == 'borrow_session' && w['pc'].is_a?(String) }.uniq
    end

    # The NPC's places for a judged need (plan 9.1): its own station, a PC a borrow_session names,
    # or an object that satisfies the need and is not a desk. Ids, sorted.
    def places(data, npc, need)
      out = []
      st = station(data, npc)
      out << st['id'] if st && satisfies?(data, st, need)
      borrow_pcs(data, npc).each { |pc| out << pc if object(data, pc) }
      object_index(data).each_value do |e|
        o = e[:obj]
        out << o['id'] if satisfies?(data, o, need) && !desk?(data, o)
      end
      out.uniq.sort
    end

    # The NPC's shortest use time for a need over its places (and, for social_media with a
    # phone, the phone use); 20 seconds when it has none
    def shortest_use_seconds(data, npc, need)
      times = places(data, npc, need).map { |id| use_seconds(data, object(data, id)) }
      if need == 'social_media'
        su = npc.is_a?(Hash) && npc['socialUse'].is_a?(Hash) ? npc['socialUse']['useSeconds'] : nil
        social = su.is_a?(Numeric) ? su.to_f.clamp(0, 600) : SOCIAL_USE_SECONDS
        st = station(data, npc)
        times << social if phone?(npc) || (st && places(data, npc, need).include?(st['id']))
      end
      times.min || NEEDS_DEFAULT_USE_SECONDS
    end

    # ── resources, admission, reach ─────────────────────────────────────

    def admitted?(resource, npc)
      return true unless resource.is_a?(Hash) && !resource['access'].nil?

      AccessIdentities.acl_admits?(resource['access'], npc)
    end

    def present_string?(v) = v.is_a?(String) && !v.strip.empty?

    # Routes from the NPC's home station to a resource, or nil in a scenario with no networks
    def routes(data, npc, resource)
      return nil if NetworkModel.networks(data).empty?

      st_id = npc.is_a?(Hash) ? npc['needsHome'] : nil
      entry = st_id.is_a?(String) ? object_index(data)[st_id] : nil
      net = entry ? NetworkModel.network_of(entry[:obj], entry[:room]) : nil
      NetworkModel.reach_conditions(data, net, resource)
    end

    # The work plan the server attaches to a room NPC as `work` (plan 5.2): ids, kinds and
    # global names, never a display name or a network. nil for an NPC with no plan.
    def plan(data, npc)
      return nil unless work_plan?(data, npc)

      res = resources(data)
      needs = work_list(data, npc).filter_map do |id|
        r = res[id]
        next nil unless r

        entry = { 'id' => id, 'kind' => r['kind'].is_a?(String) ? r['kind'] : nil, 'admitted' => admitted?(r, npc) }
        entry['downIf'] = r['downIf'] if present_string?(r['downIf'])
        entry['object'] = r['object'] if present_string?(r['object'])
        rt = routes(data, npc, r)
        entry['routes'] = rt unless rt.nil?
        entry
      end
      { 'breakDrain' => frustration(data, npc)['breakDrain'], 'needs' => needs }
    end

    # ── can fail, belongs to, owned causes ──────────────────────────────

    def off_when?(data, obj) = !obj.nil? && !affordance(data, obj)&.dig('offWhen').nil? && affordance(data, obj)['offWhen'] != false && affordance(data, obj)['offWhen'] != ''

    def policy_of(data, obj)
      name = obj.is_a?(Hash) && present_string?(obj['policy']) ? obj['policy'] : data['defaultPolicy']
      p = present_string?(name) && data['policies'].is_a?(Hash) ? data['policies'][name] : nil
      p.is_a?(Hash) ? p : nil
    end

    def social_blocked?(data, npc)
      policy_of(data, station(data, npc))&.dig('social') == 'blocked'
    end

    # "Can fail" (plan 9.1): the scenario makes a failure possible for this NPC and need
    def can_fail?(data, npc, need)
      case need
      when 'work'
        return false unless work_plan?(data, npc)

        res = resources(data)
        list = work_list(data, npc).filter_map { |id| res[id] }
        return true if list.any? { |r| !admitted?(r, npc) || present_string?(r['downIf']) }
        return true if list.any? { |r| (rt = routes(data, npc, r)) && (rt.empty? || rt.any? { |route| !route.empty? }) }

        pcs = [station(data, npc)] + borrow_pcs(data, npc).map { |id| object(data, id) }
        pcs.compact.any? { |pc| off_when?(data, pc) }
      when 'social_media'
        return false unless need?(npc, 'social_media') && !phone?(npc)

        st = station(data, npc)
        !st.nil? && (social_blocked?(data, npc) || off_when?(data, st))
      else
        false
      end
    end

    # Whether a cause in a report names this NPC's own thing (plan 9.1, "Belongs to the NPC")
    def cause_belongs?(data, npc, need, cause)
      return false unless cause.is_a?(Hash) && FAIL_CAUSES.include?(cause['why'].to_s) && cause['id'].is_a?(String)

      id = cause['id']
      case cause['why']
      when 'down', 'unreachable'
        need == 'work' && work_list(data, npc).include?(id) && resources(data).key?(id)
      when 'no_access'
        need == 'work' && work_list(data, npc).include?(id) && !admitted?(resources(data)[id], npc)
      else # off, locked_out, social_blocked
        st = station(data, npc)
        (st && st['id'] == id) || borrow_pcs(data, npc).include?(id)
      end
    end

    # The causes the server owns that hold for an NPC and need (plan 9.1, gate 2): none can
    # clear in play. `lockouts` is player_state.loginLockouts (sub-slice L reads it).
    def owned_causes(data, npc, need, lockouts = nil)
      out = []
      if need == 'work' && work_plan?(data, npc)
        res = resources(data)
        work_list(data, npc).each do |id|
          r = res[id]
          next unless r

          out << { 'id' => id, 'why' => 'no_access' } unless admitted?(r, npc)
          rt = routes(data, npc, r)
          out << { 'id' => id, 'why' => 'unreachable' } if rt && rt.empty?
        end
      end
      st = station(data, npc)
      out << { 'id' => st['id'], 'why' => 'social_blocked' } if need == 'social_media' && st && social_blocked?(data, npc)
      out << { 'id' => st['id'], 'why' => 'locked_out' } if st && locked_out_at?(npc, st, lockouts)
      out
    end

    # Sub-slice L: whether loginLockouts holds the NPC's username at its station
    def locked_out_at?(npc, st, lockouts)
      return false unless lockouts.is_a?(Hash) && AccessIdentities.account?(npc)

      user = AccessIdentities.normalise_username(npc.dig('creds', 'username'))
      entry = lockouts[st['id']]
      list = entry.is_a?(Hash) ? entry.keys : Array(entry)
      list.map { |u| AccessIdentities.normalise_username(u) }.include?(user)
    end

    # The pace floors (plan 9.1), in seconds of server time
    def park_floor(npc) = (0.9 * defer_min(npc) * 60) - 3
    def use_floor(data, npc, need) = [(0.9 * shortest_use_seconds(data, npc, need)) - 3, 0].max
  end
end
