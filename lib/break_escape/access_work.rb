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
    # The needs a lockout at the NPC's own station stops (sub-slice L; user decision q33: every
    # use of that PC, social media included)
    LOCKOUT_NEEDS = %w[work social_media].freeze

    # ── scenario reads ──────────────────────────────────────────────────

    def resources(data)
      NetworkModel.resources(data)
    end

    # Only roles whose value is an object (the schema's shape): a malformed entry (a list or a
    # string) is dropped here, so room loading and encounter tracking never raise on it.
    def roles_block(data)
      r = data.is_a?(Hash) ? data['roles'] : nil
      r.is_a?(Hash) ? r.select { |_k, v| v.is_a?(Hash) } : {}
    end

    # The NPC's roles in authored order with `staff` last (AccessIdentities.identity_roles adds
    # the implicit staff of an NPC with creds or a card).
    def npc_roles(npc)
      roles = AccessIdentities.identity_roles(npc)
      roles.include?('staff') ? (roles - ['staff']) + ['staff'] : roles
    end

    INDEX_KEY = :break_escape_access_work_index

    # Every room object (recursing into contents) by id: { obj, room_id, room }. Inside
    # with_index for the same scenario hash the walk is done once (review R1 M1).
    def object_index(data)
      held = Thread.current[INDEX_KEY]
      return held[1] if held && held[0].equal?(data)

      build_object_index(data)
    end

    def build_object_index(data)
      NetworkModel.room_objects(data).each_with_object({}) do |e, h|
        id = e[:object]['id']
        h[id] ||= { obj: e[:object], room_id: e[:room_id], room: e[:room] } if id.is_a?(String) && !id.empty?
      end
    end

    # Runs the block with the object index of `data` built once and reused (compared by
    # identity, dropped when the block ends, so a later change to the scenario hash is seen).
    # Nests: an inner call for the same hash reuses the outer index.
    def with_index(data)
      held = Thread.current[INDEX_KEY]
      return yield if held && held[0].equal?(data)

      Thread.current[INDEX_KEY] = [data, build_object_index(data)]
      begin
        yield
      ensure
        Thread.current[INDEX_KEY] = held
      end
    end

    def object(data, id)
      (id.is_a?(String) ? object_index(data)[id]&.dig(:obj) : nil)
    end

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

    def need?(npc, name)
      npc.is_a?(Hash) && npc['needs'].is_a?(Hash) && npc['needs'][name].is_a?(Hash)
    end

    # A `work` plan: a work need and a non-empty resolved list (plan 5.2, "judged")
    def work_plan?(data, npc)
      need?(npc, 'work') && !work_list(data, npc).empty?
    end

    def phone?(npc)
      npc.is_a?(Hash) && npc['phone'] != false
    end

    # Whether an NPC's ink or JSON record offers an item type (Friendface phone review R1 M1 and
    # R2 M1, m2): a give_item tag for the type, with or without a `|` or `:` selector, or a
    # give_npc_inventory_items tag whose comma filter is empty or names the type. Read by the
    # server (SocialFeed#npc_offers_item?) and by the validator, so the two cannot drift. `text`
    # is a compiled story, an .ink source or a JSON record; a tag ends at a quote, a backslash
    # (an escape in JSON), a newline or the next `#` (another ink tag on the same line).
    GIVE_INVENTORY_RE = /give_npc_inventory_items(?:\s*:([^"\\\n#]*))?/.freeze

    # The engine trims around the first colon (chat-helpers.js), so `give_item : type` gives too
    # (review R3 n1). The type must be literal: a tag built from an ink variable never matches.
    def give_item_re(type)
      /give_item\s*:\s*#{Regexp.escape(type.to_s)}(?![\w-])/
    end

    def offers_item_text?(text, type)
      return false unless text.is_a?(String) && type.is_a?(String) && !type.empty?
      return true if text.match?(give_item_re(type))

      text.scan(GIVE_INVENTORY_RE).any? do |(param)|
        types = param.to_s.split(',').map(&:strip).reject(&:empty?)
        types.empty? || types.include?(type)
      end
    end

    # The texts an NPC's offers are read from: its JSON record without itemsHeld, then its story,
    # found by `story_file` (storyPath -> path or nil; the server and the validator each resolve
    # it their own way)
    def offer_texts(npc, &story_file)
      return [] unless npc.is_a?(Hash)

      texts = [JSON.generate(npc.reject { |k, _| k == 'itemsHeld' })]
      sp = npc['storyPath']
      if sp.is_a?(String) && !sp.empty? && story_file
        path = story_file.call(sp)
        texts << File.read(path) if path && File.exist?(path)
      end
      texts
    end

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

    # Read once per process (review R2 n4): after editing office-presets.json in development,
    # restart the server before its floors and places follow the edit.
    def preset_table
      @preset_table ||= File.file?(PRESETS_FILE) ? (JSON.parse(File.read(PRESETS_FILE))['presets'] || {}) : {}
    end

    def presets_on?(data)
      data.is_a?(Hash) && data['officePresets'] == true
    end

    # office-presets.js presetIdFor, ignoring the scenario switch. One difference: Ruby treats
    # `"lockType": ""` as set where the JS treats it as unset; no scenario authors an empty
    # lockType, so the two agree on every real object.
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

    def satisfies?(data, obj, need)
      Array(affordance(data, obj)&.dig('satisfies')).include?(need)
    end

    # The needs system's use time: authored, else the preset's, else 20 seconds
    def use_seconds(data, obj)
      v = affordance(data, obj)&.dig('useSeconds')
      v.is_a?(Numeric) && v.finite? ? v.to_f.clamp(0, 600) : NEEDS_DEFAULT_USE_SECONDS
    end

    # A desk (plan 5.2): a workstation by isWorkstation's rule, or an object whose preset is desk_pc.
    # isWorkstation tests the id for truthiness; here it must be a non-empty string (an object
    # with no usable id is never a place, so the answer is the same).
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

    # PCs the NPC's borrow_session workarounds name. Not a place, station or cause yet: in
    # sub-slice A nothing is handed over, and naming a borrow PC before its hand-over would let a
    # report learn the workaround (review R1 M2). Sub-slice H adds a handed-over borrow PC back
    # to places, can_fail? and cause_belongs?. The validator still reads it for its mutters check.
    def borrow_pcs(data, npc)
      workarounds(data, npc).filter_map { |w| w['pc'] if w['do'] == 'borrow_session' && w['pc'].is_a?(String) }.uniq
    end

    # The NPC's places for a judged need (plan 9.1): its own station, or an object that satisfies
    # the need and is not a desk. Ids, sorted. (A PC a handed-over borrow_session names joins in
    # sub-slice H; see borrow_pcs.)
    def places(data, npc, need)
      with_index(data) do
        out = []
        st = station(data, npc)
        out << st['id'] if st && (satisfies?(data, st, need) || social_station?(data, npc, need))
        object_index(data).each_value do |e|
          o = e[:obj]
          out << o['id'] if satisfies?(data, o, need) && !desk?(data, o)
        end
        out.uniq.sort
      end
    end

    # The NPC's shortest use time for a need over its places (and, for social_media with a
    # phone, the phone use); 20 seconds when it has none
    def shortest_use_seconds(data, npc, need)
      with_index(data) do
        here = places(data, npc, need)
        st = station(data, npc)
        # Sub-slice C (8.1): a social_media use at the own PC takes socialUse's time, not the PC's
        own = need == 'social_media' && st ? st['id'] : nil
        times = here.reject { |id| id == own }.map { |id| use_seconds(data, object(data, id)) }
        if need == 'social_media'
          su = npc.is_a?(Hash) && npc['socialUse'].is_a?(Hash) ? npc['socialUse']['useSeconds'] : nil
          social = su.is_a?(Numeric) ? su.to_f.clamp(0, 600) : SOCIAL_USE_SECONDS
          times << social if phone?(npc) || (st && here.include?(st['id']))
        end
        times.min || NEEDS_DEFAULT_USE_SECONDS
      end
    end

    # Sub-slice C (plan 8.1): for social_media the NPC's own workstation is a source whatever its
    # affordance says (a use there takes socialUse's time and restores). Mirrors npc-needs.js
    # _socialStation.
    def social_station?(data, npc, need)
      return false unless need == 'social_media' && need?(npc, 'social_media')

      st = station(data, npc)
      !st.nil? && desk?(data, st)
    end

    # ── social media feeds (sub-slice C, plan 8.3) ──────────────────────

    # The feed's posts (hashes with a non-empty string id), or [] for an NPC with no feed
    def feed_posts(npc)
      f = npc.is_a?(Hash) ? npc['feed'] : nil
      posts = f.is_a?(Hash) && f['posts'].is_a?(Array) ? f['posts'] : []
      posts.select { |p| p.is_a?(Hash) && present_string?(p['id']) }
    end

    # Whether the NPC posts at all: a feed with posts and a usable social_media need, one with a
    # numeric decayPerMin above 0 (route check 2). Review C R1 n1: a need the server cannot pace
    # (a string or missing decayPerMin) is no feed, rather than a feed with no floor.
    def feeds?(npc)
      return false unless need?(npc, 'social_media') && !feed_posts(npc).empty?

      decay = npc['needs']['social_media']['decayPerMin']
      decay.is_a?(Numeric) && decay.positive?
    end

    # Every fact id a room NPC's feed post names, sorted: withheld from the bootstrap's
    # social.intelFacts until its post is out
    def feed_facts(data)
      AccessIdentities.room_npcs(data).flat_map { |e| feed_posts(e[:npc]).map { |p| p['fact'] } }
                      .select { |f| present_string?(f) }.uniq.sort
    end

    SOCIAL_RESTORES = 60 # plan 8.1: socialUse.restores default

    # The post period of plan 8.3, in seconds of game time: min(restores, 100 - urgentAt) /
    # decayPerMin minutes, with the smallest restores among the NPC's options (socialUse for the
    # phone and its own PC; each non-desk place's affordance) taken at the low end of the need's
    # jitter. nil for an NPC with no valid social_media need.
    def post_period_seconds(data, npc)
      n = need?(npc, 'social_media') ? npc['needs']['social_media'] : nil
      return nil unless n

      decay = n['decayPerMin'].is_a?(Numeric) ? n['decayPerMin'].to_f : 0
      return nil unless decay.positive?

      # Clamped as the client's normaliseNeed clamps them (review C R1 n1)
      urgent = n['urgentAt'].is_a?(Numeric) ? n['urgentAt'].to_f.clamp(1, 99) : 0
      jitter = n['jitterPct'].is_a?(Numeric) ? n['jitterPct'].to_f.clamp(0, 50) : 0
      su = npc['socialUse'].is_a?(Hash) ? npc['socialUse']['restores'] : nil
      options = [su.is_a?(Numeric) ? su.to_f.clamp(0, 100) : SOCIAL_RESTORES]
      st = station(data, npc)
      places(data, npc, 'social_media').each do |id|
        next if st && st['id'] == id

        r = affordance(data, object(data, id))&.dig('restores')
        options << (r.is_a?(Numeric) ? r.to_f : 0)
      end
      restores = options.min * (1 - (jitter / 100))
      ([restores, 100 - urgent].min / decay) * 60
    end

    # The server's post floor (plan 9.1): 0.9 of the period less the 3 second allowance the other
    # floors give, not below 0
    def post_floor(data, npc)
      period = post_period_seconds(data, npc)
      period ? [(0.9 * period) - 3, 0].max : 0
    end

    # ── reactive feed posts (sub-slice C2, plan ACCESS_MODEL_SLICE_9_2_C2_PLAN.md) ────────
    #
    # A feed post with a `when` is a reactive post: the server serves it only when its condition
    # holds, read from state the server already records. A post with no `when` is an ordered post
    # (C's behaviour). `feed.order` interleaves the two kinds. All of the selection, the condition
    # evaluation and the static reachability live here so the route and the validator share one
    # copy and cannot drift.

    FEED_ORDERS = %w[facts_first reactive_first mixed].freeze
    WHEN_KEYS = %w[frustrationAtLeast frustrationBelow cause need workaround needMet global].freeze

    def reactive_post?(post)
      post.is_a?(Hash) && post['when'].is_a?(Hash)
    end

    def feed_order(npc)
      o = npc.is_a?(Hash) ? npc.dig('feed', 'order') : nil
      FEED_ORDERS.include?(o) ? o : 'facts_first'
    end

    # The post ids a feedRevealed entry records as shown, in reveal order. C2 stores `shown`; a
    # game saved under C holds `{ n, at }`, so a legacy entry migrates to the first `n` ids of
    # the feed's posts (authored order) that have no `when` (C served `posts[0..n-1]`, all ordered).
    def feed_shown_ids(npc, entry)
      return [] unless entry.is_a?(Hash)

      shown = entry['shown']
      return shown.select { |i| present_string?(i) } if shown.is_a?(Array)

      n = entry['n'].is_a?(Integer) ? [entry['n'], 0].max : 0
      feed_posts(npc).reject { |p| reactive_post?(p) }.first(n).map { |p| p['id'] }
    end

    # The extracted live checks (plan 3): a cause condition and a global condition, pure over the
    # arguments. `globals` is player globals merged over the scenario defaults by key presence;
    # `lockout_keys` is player_state.loginLockouts, pre-gated by the per-NPC check record (empty
    # when no check holds), so a `locked_out` cause matches only behind the record.
    # Delegates to NetworkModel.truthy?, the single Ruby truthy source, so frustration, the feed
    # and outages read a global's truthiness one way.
    def truthy_global?(value)
      NetworkModel.truthy?(value)
    end

    def globals_hold?(cond, globals)
      globals = {} unless globals.is_a?(Hash)
      case cond
      when String then truthy_global?(globals[cond])
      when Hash then cond.all? { |k, v| globals[k.to_s] == v }
      else false
      end
    end

    # A per-cause primitive: it takes a full cause `{ 'id', 'why' }` and branches on the `why`.
    # The same rule NpcFrustration#frustration_cause_holds? used, lifted out so the live route and
    # the frustration path share one copy.
    def cause_holds?(data, npc, need, cause, globals, lockout_keys)
      return false unless cause.is_a?(Hash)

      globals = {} unless globals.is_a?(Hash)
      id = cause['id']
      case cause['why']
      when 'down'
        dn = resources(data)[id]&.dig('downIf')
        present_string?(dn) && truthy_global?(globals[dn])
      when 'unreachable'
        rt = routes(data, npc, resources(data)[id])
        !rt.nil? && rt.none? { |route| route.none? { |g| truthy_global?(globals[g.to_s]) } }
      when 'no_access'
        !admitted?(resources(data)[id], npc)
      when 'off'
        cond = affordance(data, object(data, id))&.dig('offWhen')
        !cond.nil? && globals_hold?(cond, globals)
      when 'social_blocked'
        need == 'social_media' && social_blocked?(data, npc)
      when 'locked_out'
        locked_out_at?(npc, object(data, id), lockout_keys)
      else
        false
      end
    end

    # The candidate causes of a `why` the NPC can meet for a need (plan 3): the NPC's work-list
    # resources for down/unreachable/no_access, its station for off/social_blocked/locked_out.
    def cause_candidates(data, npc, need, why)
      st = station(data, npc)
      case why
      when 'down', 'unreachable', 'no_access'
        return [] unless need == 'work'

        work_list(data, npc).select { |id| resources(data).key?(id) }.map { |id| { 'id' => id, 'why' => why } }
      when 'off'
        st ? [{ 'id' => st['id'], 'why' => 'off' }] : []
      when 'social_blocked'
        need == 'social_media' && st ? [{ 'id' => st['id'], 'why' => 'social_blocked' }] : []
      when 'locked_out'
        LOCKOUT_NEEDS.include?(need) && st ? [{ 'id' => st['id'], 'why' => 'locked_out' }] : []
      else
        []
      end
    end

    # Whether a cause with this `why` still holds now for the NPC and need: a per-why enumeration
    # over the candidate causes, true when any one holds by cause_holds? (so "Printer's down AGAIN"
    # fires only while a down-able work resource is actually down).
    def cause_why_holds?(data, npc, need, why, globals, lockout_keys)
      cause_candidates(data, npc, need, why).any? { |c| cause_holds?(data, npc, need, c, globals, lockout_keys) }
    end

    # The static sibling of cause_why_holds? (plan 3): can a cause with this `why` ever hold for
    # the NPC and need, from the scenario alone. Mirrors the can_fail? pieces.
    def cause_why_reachable?(data, npc, need, why)
      st = station(data, npc)
      case why
      when 'down'
        need == 'work' && work_list(data, npc).any? { |id| present_string?(resources(data)[id]&.dig('downIf')) }
      when 'unreachable'
        need == 'work' && work_list(data, npc).any? do |id|
          r = resources(data)[id]
          r && (rt = routes(data, npc, r)) && (rt.empty? || rt.any? { |route| !route.empty? })
        end
      when 'no_access'
        need == 'work' && work_list(data, npc).any? { |id| (r = resources(data)[id]) && !admitted?(r, npc) }
      when 'off'
        !st.nil? && off_when?(data, st)
      when 'social_blocked'
        need == 'social_media' && social_blocked?(data, npc)
      when 'locked_out'
        LOCKOUT_NEEDS.include?(need) && lockout_station?(data, npc)
      else
        false
      end
    end

    # ── condition evaluation (live) ─────────────────────────────────────

    # Whether a `when` holds now: every predicate holds (logical AND). `entry` is the NPC's raw
    # npcFrustration record, or nil before it has one (then every predicate but `global` is false).
    def when_holds?(data, npc, cond, entry, globals, lockout_keys)
      return false unless cond.is_a?(Hash) && !cond.empty?

      need = cond['need'].is_a?(String) ? cond['need'] : nil
      cond.all? { |key, val| when_predicate_holds?(data, npc, key, val, need, entry, globals, lockout_keys) }
    end

    def when_predicate_holds?(data, npc, key, val, need, entry, globals, lockout_keys)
      case key
      when 'need'
        true # a scope for cause/needMet, not a predicate of its own
      when 'global'
        globals_hold?(val, globals)
      when 'frustrationAtLeast'
        entry.is_a?(Hash) && entry['level'].to_f >= val.to_f
      when 'frustrationBelow'
        entry.is_a?(Hash) && entry['level'].to_f < val.to_f
      when 'workaround'
        entry.is_a?(Hash) && workaround_performed?(data, npc, val, entry)
      when 'needMet'
        entry.is_a?(Hash) && need_met_now?(val, need, entry)
      when 'cause'
        entry.is_a?(Hash) && cause_predicate_holds?(data, npc, val, need, entry, globals, lockout_keys)
      else
        false
      end
    end

    # The named workaround has been performed: a lasting kind in `done`, or a repeating kind whose
    # lastSpent[index].done is true. A string matches any of the NPC's workarounds of that `do`; an
    # integer names the workarounds[index].
    def workaround_performed?(data, npc, val, entry)
      was = workarounds(data, npc)
      idxs = case val
      when Integer then [val]
      when String then was.each_index.select { |i| was[i]['do'] == val }
      else []
      end
      return false if idxs.empty?

      done = entry['done'].is_a?(Array) ? entry['done'] : []
      spent = entry['lastSpent'].is_a?(Hash) ? entry['lastSpent'] : {}
      idxs.any? do |i|
        i.is_a?(Integer) && i >= 0 && i < was.size &&
          (done.include?(i) || (spent[i.to_s].is_a?(Hash) && spent[i.to_s]['done'] == true))
      end
    end

    # "Fixed at last": the need had a recorded failure and its last event was a met use
    # (failAt set, easeAt set and later). `true` means any judged need; a `need` scope narrows it.
    def need_met_now?(val, need, entry)
      needs = if JUDGED_NEEDS.include?(val) then [val]
      elsif val == true then (need ? [need] : JUDGED_NEEDS)
      else []
      end
      fails = entry['failAt']
      eases = entry['easeAt']
      return false unless fails.is_a?(Hash) && eases.is_a?(Hash)

      needs.any? { |n| fails[n] && eases[n] && eases[n].to_f > fails[n].to_f }
    end

    # A `cause` predicate holds only when both the NPC has actually failed at that why
    # (failWhy[need] lists it) and a cause with that why still holds now (cause_why_holds?).
    def cause_predicate_holds?(data, npc, val, need, entry, globals, lockout_keys)
      whys = Array(val).select { |w| FAIL_CAUSES.include?(w) }
      return false if whys.empty?

      needs = need ? [need] : JUDGED_NEEDS
      failwhy = entry['failWhy'].is_a?(Hash) ? entry['failWhy'] : {}
      needs.any? do |n|
        listed = Array(failwhy[n])
        whys.any? { |w| listed.include?(w) && cause_why_holds?(data, npc, n, w, globals, lockout_keys) }
      end
    end

    # ── static reachability (validator and the `done` test) ─────────────

    def declared_global?(data, val)
      names = case val
      when String then [val]
      when Hash then val.keys.map(&:to_s)
      else return false
      end
      gv = data.is_a?(Hash) ? data['globalVariables'] : nil
      gv.is_a?(Hash) && !names.empty? && names.all? { |n| gv.key?(n) }
    end

    def workaround_present?(data, npc, val)
      was = workarounds(data, npc)
      case val
      when Integer then val >= 0 && val < was.size
      when String then was.any? { |w| w['do'] == val }
      else false
      end
    end

    def cause_reachable?(data, npc, val, need)
      whys = Array(val).select { |w| FAIL_CAUSES.include?(w) }
      return false if whys.empty?

      needs = need ? [need] : JUDGED_NEEDS
      whys.any? { |w| needs.any? { |n| cause_why_reachable?(data, npc, n, w) } }
    end

    # True only when every predicate in the `when` is statically reachable for the NPC. Shared by
    # the validator's dead-post warning and the `done` test's branch (b).
    def when_reachable?(data, npc, cond)
      return false unless cond.is_a?(Hash) && !cond.empty?

      need = cond['need'].is_a?(String) ? cond['need'] : nil
      cond.all? { |key, val| when_predicate_reachable?(data, npc, key, val, need) }
    end

    def when_predicate_reachable?(data, npc, key, val, need)
      case key
      when 'need' then true
      when 'global' then declared_global?(data, val)
      when 'cause' then cause_reachable?(data, npc, val, need)
      when 'workaround' then workaround_present?(data, npc, val)
      when 'frustrationAtLeast', 'frustrationBelow', 'needMet'
        JUDGED_NEEDS.any? { |n| can_fail?(data, npc, n) }
      else
        false
      end
    end

    # ── selection and completion ────────────────────────────────────────

    # Whether the feed is finished (plan 4): the ordered queue is empty and every reactive post is
    # already shown or statically unable ever to fire. Reads only scenario reachability, never the
    # live globals or lockouts, so a transiently-false but reachable post keeps the feed open.
    def feed_done?(data, npc, shown)
      shown = Array(shown)
      feed_posts(npc).all? do |post|
        shown.include?(post['id']) || (reactive_post?(post) && !when_reachable?(data, npc, post['when']))
      end
    end

    # Pick the next post to serve by the feed's `order` and the eligibility tests (plan 4).
    # Returns { 'post' => id or nil, 'done' => bool }. Pure: every piece of state it reads is
    # passed in. `feed_entry` is the feedRevealed record, `frustration_entry` the raw
    # npcFrustration[id] (or nil), `globals` the merged globals, `lockout_keys` the pre-gated set.
    def select_feed_post(data, npc, feed_entry, frustration_entry, globals, lockout_keys = [])
      posts = feed_posts(npc)
      shown = feed_shown_ids(npc, feed_entry)
      eligible = lambda do |post|
        next false if shown.include?(post['id'])

        reactive_post?(post) ? when_holds?(data, npc, post['when'], frustration_entry, globals, lockout_keys) : true
      end

      chosen =
        case feed_order(npc)
        when 'reactive_first'
          posts.find { |p| reactive_post?(p) && eligible.call(p) } ||
            posts.find { |p| !reactive_post?(p) && eligible.call(p) }
        when 'mixed'
          posts.find { |p| eligible.call(p) }
        else # facts_first
          posts.find { |p| !reactive_post?(p) && eligible.call(p) } ||
            posts.find { |p| reactive_post?(p) && eligible.call(p) }
        end

      # `done` reflects the state after this serve: when a post is chosen it counts as shown, so
      # the reveal of the last post answers done (matching C's n + 1 >= posts.size)
      after = chosen ? shown + [chosen['id']] : shown
      { 'post' => chosen ? chosen['id'] : nil, 'done' => feed_done?(data, npc, after) }
    end

    # ── resources, admission, reach ─────────────────────────────────────

    def admitted?(resource, npc)
      return true unless resource.is_a?(Hash) && !resource['access'].nil?

      AccessIdentities.acl_admits?(resource['access'], npc)
    end

    def present_string?(v)
      v.is_a?(String) && !v.strip.empty?
    end

    # Routes from the NPC's home station to a resource, or nil in a scenario with no networks
    def routes(data, npc, resource)
      return nil if NetworkModel.networks(data).empty?

      st_id = npc.is_a?(Hash) ? npc['needsHome'] : nil
      entry = st_id.is_a?(String) ? object_index(data)[st_id] : nil
      net = entry ? NetworkModel.network_of(entry[:obj], entry[:room]) : nil
      NetworkModel.reach_conditions(data, net, resource)
    end

    # Routes from a borrowed PC (sub-slice H, 6.4): { resourceId => routes } for each resource in
    # the NPC's work list, or nil in a scenario with no networks. Sent in a borrow's `run`, so the
    # verdict at the hot desk uses that PC's reach.
    def routes_from(data, npc, pc_id)
      return nil if NetworkModel.networks(data).empty?

      entry = pc_id.is_a?(String) ? object_index(data)[pc_id] : nil
      net = entry ? NetworkModel.network_of(entry[:obj], entry[:room]) : nil
      res = resources(data)
      work_list(data, npc).each_with_object({}) do |id, out|
        out[id] = NetworkModel.reach_conditions(data, net, res[id]) if res[id]
      end
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

    # ── the USB policy (sub-slice U, plan 7), as pc-policy.js decides it ─

    USB_VALUES = %w[allowed storage_blocked blocked].freeze
    USB_CLASSES = %w[storage hid].freeze

    # Governed: a workstation by its own fields (isWorkstation), or an object naming a policy
    def usb_governed?(obj)
      return false unless obj.is_a?(Hash)

      (obj['id'].is_a?(String) && !obj['id'].empty? &&
        (obj['workstation'] == true || obj.key?('locksScreenOnLeave') || obj.key?('lockChance') || obj['lockType'] == 'login')) ||
        present_string?(obj['policy'])
    end

    # The object's effective usb value ('allowed' when its policy says nothing), nil when not governed
    def usb_policy_for(data, obj)
      return nil unless usb_governed?(obj)

      v = policy_of(data, obj)&.dig('usb')
      USB_VALUES.include?(v) ? v : 'allowed'
    end

    # Whether the object's policy refuses a held item (its usbClass); an item with no class never is
    def plant_refused?(data, obj, item)
      usb = usb_policy_for(data, obj)
      cls = item.is_a?(Hash) ? item['usbClass'] : nil
      return false unless usb && USB_CLASSES.include?(cls)

      usb == 'blocked' || (usb == 'storage_blocked' && cls == 'storage')
    end

    # ── can fail, belongs to, owned causes ──────────────────────────────

    def off_when?(data, obj)
      !obj.nil? && !affordance(data, obj)&.dig('offWhen').nil? && affordance(data, obj)['offWhen'] != false && affordance(data, obj)['offWhen'] != ''
    end

    def policy_of(data, obj)
      return nil unless data.is_a?(Hash)

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

        # Sub-slice L (6.6): its own sign-in PC under a policy with maxAttempts can lock it out
        return true if lockout_station?(data, npc)

        # The station only: a borrow PC counts once handed over (sub-slice H; review R1 M2)
        off_when?(data, station(data, npc))
      when 'social_media'
        return false unless need?(npc, 'social_media') && !phone?(npc)

        st = station(data, npc)
        # q33 (2026-11-12): a lockout stops every use of the PC, social media too; with no phone
        # the NPC's attempt there fails, as for work
        !st.nil? && (social_blocked?(data, npc) || off_when?(data, st) || lockout_station?(data, npc))
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
      else # off, locked_out, social_blocked: the station only (a lockout is per PC, and a failed
        # borrowed use is never reported, 6.4)
        st = station(data, npc)
        !st.nil? && st['id'] == id
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
      # Sub-slice L, widened by user decision q33 (2026-11-12): a lockout stops every use of the
      # PC, so it is an owned cause for social_media as well as work, and an ease at the station
      # for either need is refused
      out << { 'id' => st['id'], 'why' => 'locked_out' } if LOCKOUT_NEEDS.include?(need) && st && locked_out_at?(npc, st, lockouts)
      out
    end

    # Sub-slice L (6.6): the NPC's own station is a sign-in PC it owns (no screenOwner, or its
    # own id there), the NPC has an account, and the PC's policy (its own, else defaultPolicy)
    # sets a positive maxAttempts. Only then can a lockout stop its work, and only then does the
    # server answer a `check` for it.
    def lockout_station?(data, npc)
      st = station(data, npc)
      return false unless st && AccessIdentities.login_pc?(st) && AccessIdentities.account?(npc)

      owner = st['screenOwner']
      return false if present_string?(owner) && owner != npc['id']

      max = policy_of(data, st)&.dig('maxAttempts')
      max.is_a?(Numeric) && max.positive?
    end

    # Sub-slice L: whether loginLockouts (a list of "pcId|username" keys) holds the NPC's
    # username at its station
    def locked_out_at?(npc, st, lockouts)
      return false unless lockouts.is_a?(Array) && AccessIdentities.account?(npc)

      key = "#{st['id']}|#{AccessIdentities.normalise_username(npc.dig('creds', 'username'))}"
      lockouts.include?(key)
    end

    # The pace floors (plan 9.1), in seconds of server time
    def park_floor(npc)
      (0.9 * defer_min(npc) * 60) - 3
    end
    # `u` is the shortest use over AccessWork.places, which leaves out a handed-over hot desk
    # (sub-slice H) on purpose: the floor is then stricter, not looser, and honest eases are
    # spaced by the need's period, so nothing honest is refused (review R1 n3)
    def use_floor(data, npc, need)
      [(0.9 * shortest_use_seconds(data, npc, need)) - 3, 0].max
    end
  end
end
