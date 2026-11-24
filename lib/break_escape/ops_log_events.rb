# frozen_string_literal: true

module BreakEscape
  # The registry of ops log events and of the kinds of thing a row can name
  # (docs/achitechture/OPS_LOG_ROWS_PLAN.md, section 13.5). Plain Ruby with no Rails dependency, so
  # the validator reads the same list the helper (BreakEscape::OpsLog) checks against.
  #
  # Each plan adds its events to EVENTS, one line per event, in the build stage that adds the
  # action. The shape of an entry:
  #
  #   'signin_refused' => { label: 'SIGN_IN', places: %w[pc], results: %w[denied blocked],
  #                         detail: { 'route' => %w[keyboard foothold] },
  #                         save_limit: { 'denied' => 10, 'blocked' => 10 } }
  #
  # places     the where.kind values allowed; [] or absent means the event has no place
  # results    the closed list: lowercase words of 2 to 16 letters
  # save_limit optional map of result to an Integer from 1 to 99
  # merge      optional, only false: the event's rows never merge into an earlier row (always append)
  # detail     at most 4 keys, each with one of four rule types (RULE_TYPES below)
  # label      the upper-case word shown in the EVENT column
  module OpsLogEvents
    # L1a registers no event: each stage and sibling plan adds its own lines here.
    # L1b: badge, sign-in and session rows (OPS_LOG_ROWS_PLAN.md 13.8).
    EVENTS = {
      'badge_swipe' => { label: 'BADGE', places: %w[door object], results: %w[ok denied], save_limit: { 'denied' => 10 }, detail: { 'flagged' => { count: 1, show: false } } },
      'signin_ok' => { label: 'SIGN_IN', places: %w[pc], results: %w[ok],
                       detail: { 'method' => %w[password credential], 'route' => %w[keyboard foothold from relay] } },
      'signin_fail' => { label: 'SIGN_IN', places: %w[pc], results: %w[fail] },
      'signin_lockout' => { label: 'SIGN_IN', places: %w[pc], results: %w[ok] },
      'signin_refused' => { label: 'SIGN_IN', places: %w[pc], results: %w[denied blocked],
                            detail: { 'kind' => %w[local domain] }, # S5c
                            save_limit: { 'denied' => 10, 'blocked' => 10 } },
      'session_end' => { label: 'SESSION', places: %w[pc], results: %w[ok] },
      'session_lock' => { label: 'SESSION', places: %w[pc], results: %w[ok] },
      # Ops core S1: a sweep and a host scan (OPS_CORE_PLAN.md section 13).
      'network_swept' => { label: 'NET_SWEEP', places: %w[network], results: %w[ok], detail: { 'from' => { id: 'foothold' } }, save_limit: { 'ok' => 10 } },
      'host_scanned' => { label: 'HOST_SCAN', places: %w[host pc], results: %w[ok], detail: { 'from' => { id: 'foothold' } } },
      # Ops core S2: a service check and a confirm (section 13).
      'service_checked' => { label: 'SVC_CHECK', places: %w[host pc], results: %w[ok], detail: { 'service' => { id: 'service' } } },
      'finding_confirmed' => { label: 'CONFIRM', places: %w[host pc], results: %w[ok], detail: { 'finding' => { alias: 'finding' }, 'status' => %w[confirmed false] } },
      # Ops core S3: a technique card used on a finding, refused or granted (section 13).
      'technique_refused' => { label: 'TECHNIQUE', places: %w[host pc], results: %w[refused],
                               detail: { 'finding' => { alias: 'finding' }, 'technique' => { id: 'technique' },
                                         'reason' => %w[not_responding not_confirmed false_positive no_grant fixed wrong_class wrong_product wrong_version need_unmet] },
                               save_limit: { 'refused' => 10 } },
      'technique_used' => { label: 'TECHNIQUE', places: %w[host pc], results: %w[ok],
                            detail: { 'finding' => { alias: 'finding' }, 'technique' => { id: 'technique' },
                                      'grant' => %w[session credential], 'access' => %w[user admin] },
                            save_limit: { 'ok' => 10 } },
      # Privilege (S5a): an admin session reads an owner's profile; an admin session overrides the USB policy.
      'admin_profile_read' => { label: 'ADMIN_READ', places: %w[pc], results: %w[ok], detail: { 'profile' => { id: 'profile' } } },
      'usb_install_overridden' => { label: 'USB_OVERRIDE', places: %w[pc], results: %w[ok], detail: { 'device' => %w[storage hid] } },
      # Ops S5b: an admin session collects the cached accounts of a PC; `count` is how many hash records arrived
      # (a number, 1 to 8). No account name, hash or token is a detail value.
      'credentials_harvested' => { label: 'CRED_COLLECT', places: %w[pc], results: %w[ok], detail: { 'count' => { count: 8 } } },
      # Ops log L3: a jack plugged or unplugged, an access point joined, a share folder opened
      # (OPS_LOG_ROWS_PLAN.md 13.8). No identity on the network rows; the folder row names no file.
      # `merge: false` (L3 R2-1): the link rows never merge into an earlier row, so a plant after an unplug
      # is its own row and the log reads up, down, up in order; the source cap bounds them.
      'net_link_up' => { label: 'NET_LINK_UP', places: %w[jack], results: %w[ok], merge: false },
      'net_link_down' => { label: 'NET_LINK_DOWN', places: %w[jack], results: %w[ok], merge: false },
      'net_wifi_join' => { label: 'NET_WIFI_JOIN', places: %w[ap], results: %w[ok] },
      'share_folder_opened' => { label: 'SHARE_OPEN', places: %w[share], results: %w[ok], detail: { 'folder' => { id: 'object' } } },
      # Ops core S8a: the second step of a sign-in (multi-factor). No code, number or secret is ever a detail value;
      # a repeat merges into the earlier row.
      'mfa_challenge' => { label: 'MFA', places: %w[pc], results: %w[ok], detail: { 'route' => %w[keyboard foothold from] } },
      'mfa_code_ok' => { label: 'MFA', places: %w[pc], results: %w[ok] },
      'mfa_code_wrong' => { label: 'MFA', places: %w[pc], results: %w[fail] },
      'mfa_code_locked' => { label: 'MFA', places: %w[pc], results: %w[locked] },
      'mfa_expired' => { label: 'MFA', places: %w[pc], results: %w[expired] },
      'mfa_prompt_sent' => { label: 'MFA', places: %w[pc], results: %w[ok] },
      'mfa_prompt_approved' => { label: 'MFA', places: %w[pc], results: %w[ok], detail: { 'approver' => %w[owner held_phone own_phone] } },
      'mfa_prompt_denied' => { label: 'MFA', places: %w[pc], results: %w[denied] }
    }.freeze

    # Shared result words (13.5); an event's own list may use any lowercase word of 2 to 16 letters.
    SHARED_RESULTS = %w[ok fail denied granted refused blocked expired].freeze

    DETAIL_RULE_TYPES = %i[count id alias].freeze # a rule is also an Array of codes
    MAX_DETAIL_KEYS = 4
    MAX_COUNT = 9
    ID_PATTERN = /\A[A-Za-z0-9_.:-]{1,40}\z/.freeze
    ALIAS_PATTERN = /\A[a-z][0-9]{1,3}\z/.freeze
    CODE_PATTERN = /\A[a-z][a-z0-9_]{0,15}\z/.freeze
    RESULT_PATTERN = /\A[a-z]{2,16}\z/.freeze
    EVENT_PATTERN = /\A[a-z][a-z0-9_]{1,39}\z/.freeze
    LABEL_PATTERN = /\A[A-Z][A-Z0-9_]{0,15}\z/.freeze

    # Each kind of thing maps to two lookups over (game, id): :name answers the display name, or
    # nil when the id does not resolve to a thing of that kind; :room answers the room that holds
    # it, or nil (a door's id is its room). The lambdas call only methods Game already has, so
    # this file loads without Rails.
    KINDS = {
      'door' => {
        name: lambda { |game, id|
          room = OpsLogEvents.room_hash(game, id)
          room && ([room['door_sign'], room['name']].find { |t| t.is_a?(String) && !t.empty? } || id)
        },
        room: ->(game, id) { OpsLogEvents.room_hash(game, id) && id }
      },
      'object' => {
        name: ->(game, id) { OpsLogEvents.object_name(game.login_scope_of(id), id) },
        room: ->(game, id) { game.login_scope_of(id)&.[](:room_id) }
      },
      'pc' => {
        name: ->(game, id) { OpsLogEvents.object_name(game.find_login_pc(id), id) },
        room: ->(game, id) { game.find_login_pc(id)&.[](:room_id) }
      },
      'jack' => {
        name: ->(game, id) { OpsLogEvents.object_name(OpsLogEvents.jack_entry(game, id), id) },
        room: ->(game, id) { OpsLogEvents.jack_entry(game, id)&.[](:room_id) }
      },
      'ap' => {
        name: ->(game, id) { OpsLogEvents.object_name(OpsLogEvents.ap_entry(game, id), id) },
        room: ->(game, id) { OpsLogEvents.ap_entry(game, id)&.[](:room_id) }
      },
      'account' => {
        name: ->(game, id) { OpsLogEvents.account_npc(game, id)&.dig('creds', 'username') },
        room: ->(_game, _id) { nil }
      },
      'npc' => {
        name: ->(game, id) { OpsLogEvents.npc_named(game, id) },
        room: ->(_game, _id) { nil }
      },
      'card' => {
        name: ->(game, id) { OpsLogEvents.card_item(game, id) && (OpsLogEvents.card_item(game, id)['name'] || id) },
        room: ->(_game, _id) { nil }
      },
      'network' => {
        name: ->(game, id) { OpsLogEvents.network_named(game, id) },
        room: ->(_game, _id) { nil }
      },
      # A `hosts` entry (a host with no sign-in); a sign-in host is a 'pc'.
      'host' => {
        name: ->(game, id) { OpsLogEvents.device_named(game, id) },
        room: ->(_game, _id) { nil }
      },
      # A service by its name, which is its id on its host (ops core S2). Its authored label shows only when every host
      # that declares a service of that name gives it the same label (service_named); else the name.
      'service' => {
        name: ->(game, id) { OpsLogEvents.service_named(game, id) },
        room: ->(_game, _id) { nil }
      },
      # A technique card registry entry by its id, shown by its name (ops core S3).
      'technique' => {
        name: ->(game, id) { OpsLogEvents.technique_named(game, id) },
        room: ->(_game, _id) { nil }
      },
      # An account profile id (S5a), shown by the display name of the one account it is for, else the kind word.
      'profile' => {
        name: ->(game, id) { OpsLogEvents.profile_named(game, id) },
        room: ->(_game, _id) { nil }
      },
      # A file share by its record id, shown by its name (ops log L3). A share has no room.
      'share' => {
        name: ->(game, id) { OpsLogEvents.share_named(game, id) },
        room: ->(_game, _id) { nil }
      },
      # A foothold id: a network jack ("jack_<id>" or the jack's id), an access point, or a PC
      # (an implanted one); shown by that thing's display name.
      'foothold' => {
        name: ->(game, id) { OpsLogEvents.foothold_name(game, id) },
        room: ->(_game, _id) { nil }
      }
    }.freeze

    module_function

    def room_hash(game, id)
      rooms = game.scenario_data.is_a?(Hash) ? game.scenario_data['rooms'] : nil
      room = rooms.is_a?(Hash) ? rooms[id.to_s] : nil
      room.is_a?(Hash) ? room : nil
    end

    def object_name(info, id)
      return nil unless info.is_a?(Hash) && info[:object].is_a?(Hash)

      name = info[:object]['name']
      name.is_a?(String) && !name.empty? ? name : id.to_s
    end

    def jack_entry(game, id)
      entry = NetworkModel.jacks(game.scenario_data).find { |e| e[:object]['id'].to_s == id.to_s }
      entry && { object: entry[:object], room_id: entry[:room_id] }
    end

    def ap_entry(game, id)
      NetworkModel.room_objects(game.scenario_data).find do |e|
        e[:object]['wifiAp'] == true && e[:object]['id'].to_s == id.to_s
      end
    end

    def account_npc(game, id)
      wanted = game.class.normalise_username(id)
      return nil if wanted.empty?

      game.account_npcs.find do |npc|
        game.class.normalise_username(npc['creds']['username']) == wanted
      end
    end

    def npc_named(game, id)
      npc = game.class.scenario_room_npcs(game.scenario_data).find { |n| n['id'].to_s == id.to_s }
      return nil unless npc

      [npc['displayName'], npc['name'], npc['id']].find { |v| v.is_a?(String) && !v.empty? }
    end

    # An rfid card or clone item the scenario declares: a keycard (by id or card_id) or a card
    # an NPC carries (creds.card).
    def card_item(game, id)
      found = nil
      walk = lambda do |node|
        next if found

        case node
        when Hash
          if node['type'] == 'keycard' && [node['id'], node['card_id']].map(&:to_s).include?(id.to_s)
            found = node
          end
          node.each_value { |v| walk.call(v) }
        when Array
          node.each { |v| walk.call(v) }
        end
      end
      walk.call(game.scenario_data)
      found
    end

    def network_named(game, id)
      net = NetworkModel.networks(game.scenario_data)[id.to_s]
      net && (net['name'] || id.to_s)
    end

    def device_named(game, id)
      entry = NetworkModel.hosts(game.scenario_data)[id.to_s]
      entry && (entry['name'] || id.to_s)
    end

    # The service's authored label (the words its tile shows) when every host that declares a
    # service of that name gives it the same label; else its name (the kind word shows). nil when no
    # host declares one. A lookup is given no place, so a name two hosts label differently is not
    # guessed at.
    def service_named(game, id)
      data = game.scenario_data
      found = []
      NetworkModel.networks(data).each_key do |net|
        NetworkModel.hosts_on(net, data).each do |rec|
          rec[:services].each { |svc| found << svc if svc['name'] == id.to_s }
        end
      end
      return nil if found.empty?

      labels = found.map { |svc| svc['label'] }.uniq
      label = labels.first
      labels.size == 1 && label.is_a?(String) && !label.empty? ? label : id.to_s
    end

    def share_named(game, id)
      entry = NetworkModel.resources(game.scenario_data)[id.to_s]
      return nil unless entry.is_a?(Hash)

      entry['name'].is_a?(String) && !entry['name'].empty? ? entry['name'] : id.to_s
    end

    def technique_named(game, id)
      entry = NetworkModel.techniques(game.scenario_data)[id.to_s]
      entry && (entry['name'].is_a?(String) && !entry['name'].empty? ? entry['name'] : id.to_s)
    end

    # nil when the scenario holds no such profile. A profile has no authored name; the desktop
    # shows an account's files under the account's tile, so the name is the display name of the one
    # account the profile is for (as the sign-in tile shows it). The kind word shows (the id comes
    # back) when no account, several accounts, or an account with no displayName is admitted.
    # This is the lookup that decides whether the profile exists (a row's check); what a reader shows
    # is profile_shown_name.
    def profile_named(game, id)
      profiles = game.scenario_data.is_a?(Hash) ? game.scenario_data['accountProfiles'] : nil
      profile = profiles.is_a?(Hash) ? profiles[id.to_s] : nil
      return nil unless profile.is_a?(Hash)

      owner = profile_owner(game, profile)
      name = owner && owner['displayName']
      name.is_a?(String) && !name.empty? ? name : id.to_s
    end

    def profile_owner(game, profile)
      owners = BreakEscape::Game.scenario_room_npcs(game.scenario_data).select do |npc|
        BreakEscape::Game.account_holder?(npc) && BreakEscape::Game.acl_admits?(profile['for'], npc)
      end
      owners.size == 1 ? owners.first : nil
    end

    # What a log reader's profile cell shows (R4-8): the owner's display name only when the PC the row names shows that
    # account's tile to anyone at its sign-in screen (its `loginPicker` lists everyone, the PC admits the account, it is not
    # headless and its remote screen is "tiles"); at a PC whose picker is "known" or false, a headless one, one whose remote
    # screen is "typed", or a row that names no PC, the kind word, so the cell never gives a name the game has not shown
    # there. nil when the profile does not exist.
    def profile_shown_name(game, id, where)
      named = profile_named(game, id)
      return named if named.nil? || named == id.to_s

      pc = where.is_a?(Hash) && where['kind'] == 'pc' && where['id'].is_a?(String) ? game.find_login_pc(where['id'])&.dig(:object) : nil
      owner = pc && profile_owner(game, game.scenario_data['accountProfiles'][id.to_s])
      picker = pc.key?('loginPicker') ? pc['loginPicker'] : 'accounts' if pc
      shown = pc && !BreakEscape::NetworkModel.headless?(pc) && game.remote_screen(pc) == 'tiles'
      owner && shown && picker == 'accounts' && BreakEscape::CredentialModel.pc_admits_account?(pc, owner) ? named : id.to_s
    end

    def foothold_name(game, id)
      raw = id.to_s.sub(/\Ajack_/, '')
      thing = jack_entry(game, raw) || ap_entry(game, raw) || game.find_login_pc(raw)
      return object_name(thing, raw) if thing

      # A joined Wi-Fi foothold ("wifi_<network>") and an implant ("implant_<pc>") (ops core S1)
      wifi = id.to_s[/\Awifi_(.+)\z/, 1]
      return network_named(game, wifi) if wifi && NetworkModel.networks(game.scenario_data).key?(wifi)

      pc = id.to_s[/\Aimplant_(.+)\z/, 1]
      pc && game.find_login_pc(pc) ? object_name(game.find_login_pc(pc), pc) : nil
    end

    # Checks every entry of an event table against 13.5; answers a list of problems (empty when
    # well formed). Shared by the EVENTS spec and, later, the validator.
    def problems(events = EVENTS, kinds = KINDS)
      events.flat_map { |name, entry| entry_problems(name, entry, kinds) }
    end

    def entry_problems(name, entry, kinds)
      return ["#{name}: not a registered event shape"] unless name.is_a?(String) && name.match?(EVENT_PATTERN) && entry.is_a?(Hash)

      out = []
      out << "#{name}: label" unless entry[:label].is_a?(String) && entry[:label].match?(LABEL_PATTERN)
      places = entry[:places] || []
      out << "#{name}: places" unless places.is_a?(Array) && places.all? { |kind| kinds.key?(kind) }
      results = entry[:results]
      out << "#{name}: results" unless results.is_a?(Array) && !results.empty? && results.all? { |r| r.is_a?(String) && r.match?(RESULT_PATTERN) }
      out.concat(detail_problems(name, entry[:detail] || {}, kinds))
      out.concat(limit_problems(name, entry[:save_limit], results))
      out << "#{name}: merge must be false" if entry.key?(:merge) && entry[:merge] != false
      out
    end

    def detail_problems(name, detail, kinds)
      return ["#{name}: detail not a map"] unless detail.is_a?(Hash)

      out = []
      out << "#{name}: more than #{MAX_DETAIL_KEYS} detail keys" if detail.size > MAX_DETAIL_KEYS
      detail.each do |key, rule|
        out << "#{name}: detail key #{key}" unless key.is_a?(String) && key.match?(CODE_PATTERN)
        out.concat(rule_problems(name, key, rule, kinds))
      end
      out
    end

    def rule_problems(name, key, rule, kinds)
      where = "#{name}.#{key}"
      if rule.is_a?(Array)
        ok = !rule.empty? && rule.all? { |c| c.is_a?(String) && c.match?(CODE_PATTERN) }
        return ok ? [] : ["#{where}: codes"]
      end
      return ["#{where}: rule is not an Array or a Hash"] unless rule.is_a?(Hash)

      types = rule.keys & DETAIL_RULE_TYPES
      return ["#{where}: exactly one rule type"] unless types.size == 1 && (rule.keys - types - [:show]).empty?
      return ["#{where}: show must be false"] if rule.key?(:show) && rule[:show] != false

      case types.first
      when :count
        max = rule[:count]
        max.is_a?(Integer) && max.between?(1, MAX_COUNT) ? [] : ["#{where}: count max must be an Integer from 1 to #{MAX_COUNT}"]
      when :id
        kinds.key?(rule[:id]) ? [] : ["#{where}: id kind #{rule[:id].inspect} has no KINDS entry"]
      when :alias
        rule[:alias].is_a?(String) && !rule[:alias].empty? ? [] : ["#{where}: alias"]
      end
    end

    def limit_problems(name, limits, results)
      return [] if limits.nil?
      return ["#{name}: save_limit not a map"] unless limits.is_a?(Hash)

      limits.flat_map do |result, limit|
        problems = []
        problems << "#{name}: save_limit result #{result} not in results" unless Array(results).include?(result)
        problems << "#{name}: save_limit #{limit.inspect} outside 1..99" unless limit.is_a?(Integer) && limit.between?(1, 99)
        problems
      end
    end
  end
end
