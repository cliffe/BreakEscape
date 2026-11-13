# frozen_string_literal: true

require_relative 'scenario_schema' unless defined?(BreakEscape::ScenarioSchema)
require_relative 'author_notes' unless defined?(BreakEscape::AuthorNotes)

module BreakEscape
  # Step 7 of the scenario format hardening. A format version lives inside scenario_data as a
  # top-level integer, and an ordered list of upgrade steps keyed on that number lets every reader
  # see only the current field names. Step 7 lands the mechanism with no renames: STEPS is empty,
  # so current is 0 and every game created before step 7 (no formatVersion, read as 0) is already
  # current and is never rewritten because of step 7.
  #
  # Plain Ruby (no Rails): required by the engine model, the controllers and the validator with the
  # guarded form the other lib files use. deep copies use Marshal, not ActiveSupport's deep_dup.
  module FormatUpgrade
    # A stored formatVersion that is not a non-negative Integer. Only the server writes the field,
    # so any other value is a corrupt or hand-edited game, refused like a too-new one.
    class Unreadable < StandardError; end

    # A stored formatVersion above the code's current version: code rolled back after games were
    # upgraded, or an older worktree opening a game a newer branch upgraded. Refused; nothing written.
    class TooNew < StandardError
      attr_reader :stored, :current

      def initialize(stored = nil, current = nil)
        @stored = stored
        @current = current
        super("game format #{stored.inspect} is newer than this server's #{current.inspect}")
      end
    end

    # The ordered upgrade steps, one entry per version:
    #   { version:, name:, scenario: ->(data) {}, player_state: ->(state) {}, retired: [{ path:, key:, now: }] }
    # Not frozen and never reassigned: the development-only test switch appends one step in place
    # (see Engine's break_escape.format_upgrade_test_step initializer), so nothing caches an old
    # current value. Every read goes through steps, so tests stub that one method.
    #
    # Step 8a (format 1), one outage field: `offWhen`.
    #   - a network's or resource's `downIf` (a bare global name) becomes `offWhen` in the
    #     requireGlobal form; a bare name keeps its meaning (the global is truthy), so the value
    #     carries over as it is;
    #   - an object's or item's `affordance.offWhen` moves up to the object as `offWhen`, same form;
    #     an `affordance` emptied by the move stays `{}` (step 8, "An emptied affordance").
    # Both transforms walk only live data through the resolver, so a note that names an old key, or
    # holds an old-shaped block, is left as written; neither descends into free data (free: :skip),
    # which holds no authored field names.
    STEP_8A = {
      version: 1,
      name: 'one_outage_field_offWhen',
      scenario: ->(data) { BreakEscape::FormatUpgrade.rename_outage_fields!(data, BreakEscape::ScenarioSchema.root) },
      player_state: ->(state) { BreakEscape::FormatUpgrade.rename_outage_fields_in_player_state!(state) },
      retired: [
        { path: '\Anetworks/[^/]+\z', key: 'downIf', now: 'offWhen' },
        { path: '\Aresources/[^/]+\z', key: 'downIf', now: 'offWhen' },
        { path: '(\A|/)affordance\z', key: 'offWhen', now: 'offWhen (moved up to the object)' }
      ]
    }.freeze

    # Step 8b (format 2), one owner field: `owner` on objects and items, with `private` and
    # `deskPhone` as object marks. Five old ways of naming an owner become one:
    #   - object `screenOwner` (a workstation) becomes `owner`;
    #   - object `phoneOwner` (a desk phone) becomes `owner`, and the object is marked
    #     `deskPhone: true` (today the presence of `phoneOwner` was the only marker);
    #   - object `affordance.owners` (a private object) moves up as object `owner` (a list);
    #   - object `affordance.private` moves up as object `private`; an affordance emptied by the
    #     two moves stays `{}` (step 8, "An emptied affordance");
    #   - item `phoneOf` (a Friendface phone) becomes `owner`;
    #   - item `leftBehindBy` (a left-behind item) becomes `owner`, and `leftBehindChance: 0` is
    #     written where absent (today's default), so the chance is the left-behind marker.
    # Where no owner was written, the old readers derived one from `needsHome`: a workstation's
    # owner (`AccessIdentities.owner_id`, `ownerOf`) and a private object's owners (`owners_of`)
    # fell back to the first room NPC whose `needsHome` named the object. That fallback is removed,
    # so the transform writes the derived owner explicitly: a String on a workstation (single
    # owner), a one-element list on a private object. Both transforms walk only live data through
    # the resolver (free: :skip); a note that names an old key is left as written.
    STEP_8B = {
      version: 2,
      name: 'one_owner_field',
      scenario: ->(data) { BreakEscape::FormatUpgrade.one_owner_field!(data) },
      player_state: ->(state) { BreakEscape::FormatUpgrade.one_owner_field_in_player_state!(state) },
      retired: [
        { path: nil, key: 'screenOwner', now: 'owner' },
        { path: nil, key: 'phoneOwner', now: 'owner' },
        { path: nil, key: 'phoneOf', now: 'owner' },
        { path: nil, key: 'leftBehindBy', now: 'owner' },
        { path: '(\A|/)affordance\z', key: 'owners', now: 'owner (moved up to the object)' },
        { path: '(\A|/)affordance\z', key: 'private', now: 'private (moved up to the object)' }
      ]
    }.freeze

    STEPS = [STEP_8A, STEP_8B]

    # Old keys a deployed scenario still uses, each with the step that retired it. Empty
    # (section 1 of the plan: none of the four deployed scenarios uses any retired key). The place
    # an alias would live, so the rule is built and checked, not assumed.
    ALIASES = [].freeze

    module_function

    # The single read point for STEPS, so a test stubs this one method to inject a fixture step
    # list. Runtime always returns the STEPS constant (which the dev switch may have appended to).
    def steps
      STEPS
    end

    # The code's current format version: the version of the last step, or 0 when there are none.
    # A method, never a constant, so nothing caches an old value.
    def current
      list = steps
      list.empty? ? 0 : list.last[:version]
    end

    # The version a stored scenario_data declares. An absent or nil field is 0; a non-negative
    # Integer is itself; anything else raises Unreadable. Every server path that needs the version
    # calls this; none reads data['formatVersion'] directly.
    def version_of(data)
      raw = data.is_a?(Hash) ? data['formatVersion'] : nil
      return 0 if raw.nil?
      # true / false are not Integers in Ruby, so they fall through to Unreadable.
      return raw if raw.is_a?(Integer) && raw >= 0

      raise Unreadable, "unreadable formatVersion: #{raw.inspect}"
    end

    # Run every step above the stored version, in order, on data and state in place, then stamp
    # current. Returns { ran: [names], scenario_changed: bool }. Raises TooNew when the stored
    # version is above current (nothing is run or stamped). Neither transform reads or writes inside
    # an author note or free data: each walk skips them.
    def upgrade!(data, state)
      stored = version_of(data)
      cur = current
      raise TooNew.new(stored, cur) if stored > cur

      # One deep copy of data without formatVersion, taken before any step. scenario_changed is the
      # comparison of this copy with the final data, not any step's own report (Ruby Hash/Array ==
      # is deep and ignores key order).
      before = Marshal.load(Marshal.dump(data))
      before.delete('formatVersion') if before.is_a?(Hash)

      ran = []
      steps.each do |step|
        next unless step[:version] > stored

        step[:scenario]&.call(data)
        step[:player_state]&.call(state)
        ran << step[:name]
      end

      data['formatVersion'] = cur if data.is_a?(Hash)
      after = data.is_a?(Hash) ? data.reject { |k, _| k == 'formatVersion' } : data
      { ran: ran, scenario_changed: after != before }
    end

    # Every retired key present in rendered data, with its path and new name, skipping author notes
    # and free data (AuthorNotes.each_live from the root with free: :skip). Each result:
    #   { path:, key:, now:, version:, aliased: bool }
    # path is a json-pointer-ish path to the key (its Hash's path plus the key).
    def retired_keys_in(data)
      retired = retired_entries
      return [] if retired.empty?

      found = []
      BreakEscape::AuthorNotes.each_live(data, BreakEscape::ScenarioSchema.root, free: :skip) do |value, _node, keys|
        next unless value.is_a?(Hash)

        value.each_key do |k|
          ks = k.to_s
          retired.each do |entry|
            next unless entry[:key] == ks
            next unless path_matches?(entry[:path], keys)

            found << {
              path: pointer_for(keys + [ks]),
              key: ks,
              now: entry[:now],
              version: entry[:version],
              aliased: aliased?(ks)
            }
          end
        end
      end
      found
    end

    # The flattened retired entries of every step, each tagged with its step's version.
    def retired_entries
      steps.flat_map do |step|
        Array(step[:retired]).map { |e| e.merge(version: step[:version]) }
      end
    end

    # Apply every alias to a freshly rendered template in place (old name -> new name). A no-op
    # while ALIASES is empty. The only place an old name would be read at creation; no engine, Rails
    # or validator reader keeps a fallback.
    def apply_aliases!(_data)
      # ALIASES is empty in step 7; nothing to rewrite. Later steps fill this in.
      _data
    end

    def aliased?(key)
      ALIASES.any? { |a| a[:key] == key }
    end

    # true when a retired entry's path pattern matches the data path of the Hash holding the key.
    # path is nil (match anywhere), a String (a Ruby regexp source matched against the joined path),
    # or an Array of segments (matched by ==). keys is the key path of the Hash, no trailing key.
    def path_matches?(pattern, keys)
      return true if pattern.nil?

      joined = keys.map(&:to_s).join('/')
      case pattern
      when String then Regexp.new(pattern).match?(joined)
      when Array then pattern.map(&:to_s) == keys.map(&:to_s)
      else false
      end
    end

    # A json-pointer-style path for a key path (String keys and Integer indices).
    def pointer_for(keys)
      "##{keys.map { |k| "/#{k.to_s.gsub('~', '~0').gsub('/', '~1')}" }.join}"
    end

    # Step 8a. Walk every live Hash reachable from `node` and rename the outage fields in place:
    # a bare `downIf` becomes `offWhen` (networks and resources), and an `affordance.offWhen` moves
    # up to its object as `offWhen`. Notes and free data are skipped (free: :skip), so an old key in
    # a note is left as written and no authored name lives in free data. Idempotent: on data that
    # already has the new names it does nothing.
    def rename_outage_fields!(data, node)
      BreakEscape::AuthorNotes.each_live(data, node, free: :skip) do |value, _n, _keys|
        next unless value.is_a?(Hash)

        rename_one_hash_outage_fields!(value)
      end
      data
    end

    # The player_state transform: every item copy the server stored (inventory, objects added to a
    # room, and any other list of item hashes) is walked from the item Node, and its
    # `affordance.offWhen` moves up the same way. Item copies carry no network or resource, so only
    # the affordance move applies; `rename_one_hash_outage_fields!` handles both regardless.
    def rename_outage_fields_in_player_state!(state)
      return state unless state.is_a?(Hash)

      item_node = BreakEscape::ScenarioSchema.at('#/definitions/item')
      player_state_item_lists(state).each do |list|
        next unless list.is_a?(Array)

        list.each do |item|
          BreakEscape::AuthorNotes.each_live(item, item_node, free: :skip) do |value, _n, _keys|
            rename_one_hash_outage_fields!(value) if value.is_a?(Hash)
          end
        end
      end
      state
    end

    # The lists of item hashes a sync may have stored in player_state: the held inventory
    # (add_inventory_item!), items added to a room (add_item_to_room!), and the dropped / copied /
    # cloned lists. A list that is absent is skipped.
    def player_state_item_lists(state)
      lists = []
      lists << state['inventory']
      rs = state['room_states']
      if rs.is_a?(Hash)
        rs.each_value { |room| lists << room['objects_added'] if room.is_a?(Hash) }
      end
      %w[droppedItems copiedItems serverClones].each { |k| lists << state[k] }
      lists
    end

    # Rename the outage fields of one Hash in place (shared by the scenario and player_state walks).
    # A bare `downIf` becomes `offWhen`; an `affordance.offWhen` moves up to this Hash. Each move is
    # guarded by `unless value.key?('offWhen')` so a second run or format-1 data is a no-op, and an
    # affordance emptied by the move keeps `{}`.
    def rename_one_hash_outage_fields!(value)
      if value.key?('downIf')
        dn = value.delete('downIf')
        value['offWhen'] = dn unless value.key?('offWhen')
      end

      aff = value['affordance']
      if aff.is_a?(Hash) && aff.key?('offWhen')
        moved = aff.delete('offWhen')
        value['offWhen'] = moved unless value.key?('offWhen')
      end
    end

    # Step 8b. The scenario transform: rename every owner field on every live Hash, then write an
    # explicit `owner` wherever the old `needsHome` rule derived one (a workstation or a private
    # object with no owner of its own but a room NPC whose `needsHome` names it). Phase A renames do
    # not touch `needsHome`, so phase B reads the same homes the old readers did. Idempotent: on
    # data already carrying the new names it renames nothing, and a derived owner is written only
    # where none is present.
    def one_owner_field!(data)
      BreakEscape::AuthorNotes.each_live(data, BreakEscape::ScenarioSchema.root, free: :skip) do |value, _n, _keys|
        rename_one_hash_owner_fields!(value) if value.is_a?(Hash)
      end

      home = needs_home_npc_map(data)
      each_room_object(data) do |obj|
        id = obj['id']
        next unless id.is_a?(String) && !id.empty?
        next if owner_present?(obj)

        npc = home[id]
        next unless npc

        if owner_workstation?(obj)
          obj['owner'] = npc
        elsif obj['private'] == true
          obj['owner'] = [npc]
        end
      end
      data
    end

    # The player_state transform: every item copy the server stored (inventory, objects added to a
    # room, and the dropped / copied / cloned lists) has its owner fields renamed in place. Item
    # copies carry no room structure, so no owner is derived; only the renames apply.
    def one_owner_field_in_player_state!(state)
      return state unless state.is_a?(Hash)

      item_node = BreakEscape::ScenarioSchema.at('#/definitions/item')
      player_state_item_lists(state).each do |list|
        next unless list.is_a?(Array)

        list.each do |item|
          BreakEscape::AuthorNotes.each_live(item, item_node, free: :skip) do |value, _n, _keys|
            rename_one_hash_owner_fields!(value) if value.is_a?(Hash)
          end
        end
      end
      state
    end

    # Rename the owner fields of one Hash in place (shared by the scenario and player_state walks).
    # Each move is guarded by `unless value.key?('owner')` so a second run, format-2 data, or the
    # unexpected two-field conflict is a no-op on the destination (the first field read wins), and
    # an affordance emptied by the two moves keeps `{}`.
    def rename_one_hash_owner_fields!(value)
      if value.key?('screenOwner')
        so = value.delete('screenOwner')
        value['owner'] = so unless value.key?('owner')
      end
      if value.key?('phoneOwner')
        po = value.delete('phoneOwner')
        value['owner'] = po unless value.key?('owner')
        value['deskPhone'] = true unless value.key?('deskPhone')
      end
      if value.key?('phoneOf')
        pf = value.delete('phoneOf')
        value['owner'] = pf unless value.key?('owner')
      end
      if value.key?('leftBehindBy')
        lb = value.delete('leftBehindBy')
        value['owner'] = lb unless value.key?('owner')
        value['leftBehindChance'] = 0 unless value.key?('leftBehindChance')
      end

      aff = value['affordance']
      return unless aff.is_a?(Hash)

      if aff.key?('owners')
        ow = aff.delete('owners')
        value['owner'] = ow unless value.key?('owner')
      end
      return unless aff.key?('private')

      pv = aff.delete('private')
      value['private'] = pv unless value.key?('private')
    end

    # An object already names an owner when `owner` is a non-empty String or a non-empty Array, the
    # same non-empty test the old `owner_id` reader applied to `screenOwner`.
    def owner_present?(obj)
      o = obj['owner']
      (o.is_a?(String) && !o.empty?) || (o.is_a?(Array) && !o.empty?)
    end

    # The workstation-state.js isWorkstation rule (AccessIdentities.workstation?), inlined so the
    # transform stays fixed as later steps edit the readers.
    def owner_workstation?(obj)
      return false unless obj.is_a?(Hash) && obj['id'].is_a?(String) && !obj['id'].empty?

      obj['lockType'] == 'login' || obj['workstation'] == true ||
        obj.key?('locksScreenOnLeave') || obj.key?('lockChance')
    end

    # { needsHome object id => first room NPC id (scenario order) }, the first-match rule the old
    # owner readers used. The re-anchor confirms no corpus object is two NPCs' needsHome, so the
    # first match is unambiguous.
    def needs_home_npc_map(data)
      map = {}
      rooms = data.is_a?(Hash) ? data['rooms'] : nil
      return map unless rooms.is_a?(Hash)

      rooms.each_value do |room|
        next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

        room['npcs'].each do |npc|
          next unless npc.is_a?(Hash)

          h = npc['needsHome']
          next unless h.is_a?(String) && !h.empty?
          next unless npc['id'].is_a?(String) && !npc['id'].empty?

          map[h] ||= npc['id']
        end
      end
      map
    end

    # Every object under rooms.<id>.objects (recursing into contents) and every item an NPC holds
    # (rooms.<id>.npcs[].itemsHeld, recursing likewise): the domain AccessIdentities.room_objects
    # covers, inlined for the same permanence reason.
    def each_room_object(data)
      rooms = data.is_a?(Hash) ? data['rooms'] : nil
      return unless rooms.is_a?(Hash)

      walk = lambda do |list|
        next unless list.is_a?(Array)

        list.each do |obj|
          next unless obj.is_a?(Hash)

          yield obj
          walk.call(obj['contents'])
        end
      end
      rooms.each_value do |room|
        next unless room.is_a?(Hash)

        walk.call(room['objects'])
        next unless room['npcs'].is_a?(Array)

        room['npcs'].each { |npc| walk.call(npc['itemsHeld']) if npc.is_a?(Hash) }
      end
    end

    # The development-only test switch (live proof of the reload, step 7). When the environment is
    # development and BREAK_ESCAPE_FORMAT_TEST_STEP=1, append one no-op step with version 900 to
    # STEPS, so current reads 900 and a tab on a game at 0 reloads once. 900 is far from any real
    # format number, so a game stamped by this switch can never pass for a real format. Never acts in
    # test or production. No constant is reassigned; idempotent. Returns the step it added, or nil.
    def install_dev_test_step!(env:, enabled: ENV['BREAK_ESCAPE_FORMAT_TEST_STEP'] == '1')
      return nil unless enabled
      return nil unless env.to_s == 'development'
      return nil if STEPS.any? { |s| s[:version] == 900 }

      step = {
        version: 900,
        name: 'dev_test_noop',
        scenario: ->(_data) { },
        player_state: ->(_state) { },
        retired: []
      }
      STEPS << step
      step
    end
  end
end
