# frozen_string_literal: true

require_relative 'access_identities' unless defined?(BreakEscape::AccessIdentities)
require_relative 'access_work' unless defined?(BreakEscape::AccessWork)

module BreakEscape
  # The owner claim (POST /login with claim: "owner", ACCESS_MODEL_PLAN.md section 6) is a client
  # claim: the server cannot see NPC positions or the seeded screen roll. User decision q78: it is
  # best effort where it only saves the student time, but where honest play can never leave the
  # owner's session open the server refuses it. This module answers the "can the owner ever
  # leave?" half of that from scenario data alone, statically, for the server and the validator.
  #
  # It mirrors what makes npc-needs.js emit npc_left_post (a job whose target is not the NPC's
  # own needsHome) and what workstation-state.js counts as a leave (also a knock-out of a tracked
  # owner). Every test leans towards "can leave": a route that might exist counts, so a claim is
  # never refused where honest play could produce an open screen.
  #
  # No room or leash reasoning refuses a claim. Objects change room in play (the player drops
  # them, a knocked-out NPC drops what it held, a carry is put down where the carrier stands, a
  # reveal slot lands at its accepting place), so every object anywhere in the scenario counts as
  # reachable, whatever room it is authored in. The fixed rules kept are the ones play can never
  # get round: the owner's own needsHome is no leave, a private affordance serves only its owners,
  # and a judged need never uses another person's desk.
  #
  # Two layers. The precise routes (knock-out, phones, prints, need sources, failures, interests)
  # follow the client closely. Behind them, might_leave allows the claim wherever the owner has
  # any movement source the precise layer does not model exactly (a patrol, a scripted move, a
  # patrol_mode tag or a story that cannot be read, a station hook, social media, a movable
  # source, an interest, phones, prints): a refusal needs an owner with no movement source at all.
  #
  # Plain Ruby with no Rails methods, as AccessIdentities and AccessWork are.
  module OwnerClaim
    module_function

    # The first way honest play can make this owner leave their post, as a short label, or nil
    # when nothing ever does. Labels: "knock_out", "answers_phones", "prints",
    # "need:<name>:<object id>", "fails:<need>" (a judged need that can fail, so checks and
    # workarounds walk), "interest:<tag>". The label names the first route found, not
    # necessarily the one play uses most (a need's source elsewhere counts even where the own
    # needsHome usually serves it).
    #
    # "might:<feature>" comes from the cautious layer (might_leave).
    #
    # pc: the PC the claim is for. A knock-out leave carries no time-away estimate, so it counts
    # only where decideLocked can leave this PC open without one (open_without_estimate?). With
    # no PC given the knock-out counts, the side that never refuses an honest claim.
    #
    # story: a callable taking a storyPath and returning the story's text, or nil (the server
    # passes one that reads through InkStoryFile). Without one, default_story_text reads it.
    def leave_route(data, owner, pc = nil, story: nil)
      return nil unless data.is_a?(Hash) && owner.is_a?(Hash)

      precise = precise_route(data, owner, pc)
      return precise if precise

      cautious = AccessWork.with_index(data) do
        might_leave(data, owner, scenario_objects(data), story || method(:default_story_text))
      end
      cautious ? "might:#{cautious}" : nil
    end

    def never_leaves?(data, owner, pc = nil, story: nil)
      leave_route(data, owner, pc, story: story).nil?
    end

    # The precise layer alone: the routes the client is mirrored for closely, or nil
    def precise_route(data, owner, pc = nil)
      return nil unless data.is_a?(Hash) && owner.is_a?(Hash)

      # workstation-state.js onKnockedOut: a knock-out counts as a leave for a tracked owner.
      # The punch is refused only by disableAttacks (player-combat.js) or koImmune (npc-hostile.js).
      can_ko = data['disableAttacks'] != true && owner['koImmune'] != true
      return 'knock_out' if can_ko && (pc.nil? || open_without_estimate?(pc, owner))

      AccessWork.with_index(data) do
        objects = scenario_objects(data)
        # A colleague's desk phone (npc-needs.js _claimAnswerer): an answersPhones NPC walks only
        # to a ringing phone whose phoneOwner is somebody else
        return 'answers_phones' if owner['answersPhones'] == true && objects.any? { |e| colleague_phone?(e[:obj], owner) }

        home_id = owner['needsHome'].is_a?(String) ? owner['needsHome'] : nil
        # A print errand (slice 17) carries an owned printout to the needsHome object
        return 'prints' if prints?(data, owner, objects, home_id)

        needs = owner['needs'].is_a?(Hash) ? owner['needs'] : {}
        needs.each do |name, raw|
          next unless valid_need?(raw)

          judged = AccessWork.judged?(data, owner, name)
          # A judged use that fails queues a check visit or a workaround (npc-needs.js
          # _countFailure, npc-workarounds.js), and either can walk
          return "fails:#{name}" if judged && AccessWork.can_fail?(data, owner, name)

          # The client's _judged reads the shipped plan: work is judged only when its needs list
          # is non-empty. A workNeeds id that names no resource leaves work_plan? true and the
          # plan empty, and the client then lets work use any desk. Kept local (AccessWork.judged?
          # also drives NpcFrustration); it can only add routes.
          judged &&= client_judged_work?(data, owner) if name == 'work'
          found = objects.find do |e|
            o = e[:obj]
            next false if home_id && o['id'] == home_id   # a use of the own post never leaves it
            next false unless AccessWork.satisfies?(data, o, name)
            # _otherDesk: a judged need never uses somebody else's desk (a borrow comes from a
            # workaround, which needs a failure, handled above)
            next false if judged && AccessWork.desk?(data, o)

            # Any room counts (see the module comment): only a private affordance's owners
            permitted?(data, owner, o)
          end
          return "need:#{name}:#{found[:obj]['id']}" if found
        end

        interests = owner['interests'].is_a?(Hash) ? owner['interests'] : {}
        interests.each do |tag, raw|
          next unless valid_interest?(raw)

          # _carryCandidate: an item with the tag, and somewhere that accepts it
          # (_permitted(s, o, false): no private test for a delivery). Both may be in any room.
          item = objects.any? { |e| e[:obj]['needsTag'] == tag }
          target = objects.any? { |e| Array(AccessWork.affordance(data, e[:obj])&.dig('accepts')).include?(tag) }
          return "interest:#{tag}" if item && target
        end
      end
      nil
    end

    # The cautious layer: the first movement source on this owner that the precise routes do not
    # model exactly, or nil. Each is allowed without asking whether it can really leave the
    # screen open. OWNER_CLAIM_ENFORCE_BUILD_LOG.md ("R2 fixes", completed in "R3 fixes") lists
    # every client path that moves an NPC or an object and how it is treated.
    def might_leave(data, owner, objects, story)
      behavior = owner['behavior']
      # npc-behavior.js: a patrol (waypoints, bounds, a multi-room route, or enabled)
      return 'patrol' if behavior.is_a?(Hash) && behavior['patrol'] && behavior['patrol'] != false

      maps = mappings(owner)
      # npc-manager.js: patrolOverride (goToAndStay) and navigateToPlayer move the NPC by script
      return 'scripted_move' if maps.any? { |m| m['patrolOverride'] || m['navigateToPlayer'] }

      # person-chat-conversation.js: #patrol_mode in the owner's story, or in a story a mapping
      # switches to (changeStoryPath)
      paths = ([owner['storyPath']] + maps.map { |m| m['changeStoryPath'] }).select { |p| p.is_a?(String) && !p.empty? }.uniq
      texts = paths.map { |p| story.call(p) }
      return 'ink_patrol' if texts.any? { |t| t.to_s.include?('patrol_mode') }
      # A story that is named but cannot be read might hold the tag: allow (q78 leans that way)
      return 'story_unread' if texts.any?(&:nil?)

      needs = owner['needs'].is_a?(Hash) ? owner['needs'].select { |_, raw| valid_need?(raw) }.keys : []
      interests = owner['interests'].is_a?(Hash) ? owner['interests'].select { |_, raw| valid_interest?(raw) }.keys : []
      # _socialCandidate adds social_media to the own station, whose use can print
      return 'social_media' if needs.include?('social_media')
      return 'station_hook' if owner['onUse'].is_a?(Hash) && !owner['onUse'].empty?
      return 'interest' unless interests.empty?
      return 'phones' if owner['answersPhones'] == true
      return 'prints' if owner['printHabit'] || print_command?(owner)

      # A source that can change room (movable?), whoever may use it and wherever it lands,
      # even where it is the owner's own needsHome. A hedge: the precise layer already counts
      # every room, so this only adds the private and own-post cases.
      moved = objects.any? do |e|
        next false unless movable?(e)

        aff = AccessWork.affordance(data, e[:obj])
        aff.is_a?(Hash) && (Array(aff['satisfies']) & needs).any?
      end
      moved ? 'movable' : nil
    end

    # An object play can move to another room: droppable (item-drop.js), held by an NPC
    # (npc-hostile.js dropNPCItems drops it where the NPC falls), carried by an NPC (a needsTag:
    # npc-needs.js dropHeld puts it down where the carrier stands) or a reveal slot (outputOf:
    # placeHeld sets it down at an accepting place)
    def movable?(entry)
      o = entry[:obj]
      return false unless o.is_a?(Hash)

      o['droppable'] == true || entry[:held] == true || o['needsTag'].is_a?(String) || o.key?('outputOf')
    end

    # Every hash inside the owner's event mappings (eventMappings, else the singular
    # eventMapping, as npc-manager.js normalises them), at any depth: wider than the mapping
    # entries themselves, so a field anywhere in them counts
    def mappings(owner)
      out = []
      walk = lambda do |node|
        case node
        when Array then node.each { |n| walk.call(n) }
        when Hash
          out << node
          node.each_value { |v| walk.call(v) }
        end
      end
      walk.call(owner['eventMappings'] || owner['eventMapping'])
      out
    end

    STORY_ROOT = File.expand_path('../..', __dir__)

    # A storyPath's text, read as InkStoryFile confines it: a .json path inside scenarios/,
    # symlinks resolved. Every spelling InkStoryFile.compiled_json tries (the path, its .ink.json
    # form and its plain .json form) is read, and the .ink source, so a story edited since its
    # last compile still counts. Reading every spelling, where the server takes the first, is
    # wider, so the validator never warns where the server allows. nil when none can be read.
    def default_story_text(story_path)
      return nil unless story_path.is_a?(String) && story_path.end_with?('.json') && !story_path.include?("\0")

      root = File.join(STORY_ROOT, 'scenarios')
      real_root = File.exist?(root) ? File.realpath(root) : root
      full = File.expand_path(story_path, STORY_ROOT)
      spellings = [full, full.sub(/(?<!\.ink)\.json\z/, '.ink.json'), full.sub(/\.ink\.json\z/, '.json'),
                   full.sub(/\.(ink\.)?json\z/, '.ink')]
      texts = spellings.uniq.filter_map do |f|
        real = File.realpath(f)
        real.start_with?("#{real_root}/") && File.file?(real) ? File.read(real) : nil
      rescue SystemCallError
        nil
      end
      texts.empty? ? nil : texts.join("\n")
    end

    # decideLocked (workstation-state.js) with expectedAwayMs null, as for a knock-out: can this
    # leave find the PC open? The PC's numeric lockChance below 1 (0 opens, between 0 and 1 the
    # roll can), else its locksScreenOnLeave key set to false, else the owner's screenHabit with
    # a numeric lockChance below 1. A habit threshold (lockIfAwayOverSeconds) needs an estimate,
    # so it never opens this leave; a habit with no numeric lockChance locks.
    def open_without_estimate?(pc, owner)
      pc = {} unless pc.is_a?(Hash)
      chance = pc['lockChance']
      return chance < 1 if chance.is_a?(Numeric)
      return pc['locksScreenOnLeave'] == false if pc.key?('locksScreenOnLeave')

      habit = owner.is_a?(Hash) ? owner['screenHabit'] : nil
      return false unless habit.is_a?(Hash)

      raw = habit['lockChance']
      raw.is_a?(Numeric) && raw < 1
    end

    # An object somebody else answers to (phoneOwner set, and not this owner)
    def colleague_phone?(obj, owner)
      po = obj['phoneOwner']
      po.is_a?(String) && !po.empty? && po != owner['id']
    end

    # npc-needs.js: an owned print is fetched by an errand (_errandCandidate), a carry job to the
    # needsHome object, so needsHome must name an object. A print is owned when it comes from
    # (a) a print command: an event mapping on the owner's record whose needs.print names a
    # producer (control always owns it), or (b) the owner's own onUse hook with revealOutput on
    # an object one of their needs uses (only a need use prints, _completeJob), with a printHabit
    # (an unowned print is never fetched) and a hook chance that is not 0 or less.
    def prints?(data, owner, objects, home_id)
      return false unless home_id && objects.any? { |e| e[:obj]['id'] == home_id }
      return true if print_command?(owner)

      habit = owner['printHabit']
      return false unless habit.is_a?(Hash) || habit.is_a?(Array)

      hooks = owner['onUse'].is_a?(Hash) ? owner['onUse'] : {}
      needs = owner['needs'].is_a?(Hash) ? owner['needs'].select { |_, raw| valid_need?(raw) }.keys : []
      hooks.any? do |target_id, hook|
        next false unless hook.is_a?(Hash) && !printer_list(hook['revealOutput']).empty?
        if hook.key?('chance')
          c = AccessIdentities.js_number(hook['chance'])
          next false if c.finite? && c <= 0
        end
        target = objects.find { |e| e[:obj]['id'] == target_id }
        next false unless target
        # _socialCandidate adds social_media to the own station's satisfies for that choice, so
        # a social media use of the needsHome is a need use there and prints
        next true if target_id == home_id && needs.include?('social_media')

        needs.any? { |n| AccessWork.satisfies?(data, target[:obj], n) }
      end
    end

    # An event mapping on the owner (eventMappings as a list or a pattern map, or the singular
    # eventMapping that npc-manager.js normalises) whose needs is { print: <producer or spec> }
    def print_command?(owner)
      raw = owner['eventMappings'] || owner['eventMapping']
      maps = raw.is_a?(Hash) ? raw.values : Array(raw)
      maps.any? do |m|
        cmd = m.is_a?(Hash) ? m['needs'] : nil
        next false unless cmd.is_a?(Hash) && cmd.key?('print')

        spec = cmd['print']
        producer = spec.is_a?(String) || spec.is_a?(Array) ? spec : (spec.is_a?(Hash) ? spec['producer'] : nil)
        !printer_list(producer).empty?
      end
    end

    # printerList: a non-empty string, or the non-empty strings of a list
    def printer_list(value)
      return (value.empty? ? [] : [value]) if value.is_a?(String)

      value.is_a?(Array) ? value.select { |x| x.is_a?(String) && !x.empty? } : []
    end

    # normaliseNeed: decayPerMin and urgentAt both read by Number() as above 0
    def valid_need?(raw)
      raw.is_a?(Hash) && AccessIdentities.js_positive?(raw['decayPerMin']) &&
        AccessIdentities.js_positive?(raw['urgentAt'])
    end

    # npc-needs.js _judged for work: the shipped plan (AccessWork.plan) lists at least one need
    def client_judged_work?(data, owner)
      plan = AccessWork.plan(data, owner)
      plan.is_a?(Hash) && plan['needs'].is_a?(Array) && !plan['needs'].empty?
    end

    # normaliseInterest: a number, or { weight } read by Number(), above 0
    def valid_interest?(raw)
      return raw.positive? if raw.is_a?(Numeric)

      raw.is_a?(Hash) && AccessIdentities.js_positive?(raw['weight'])
    end

    # Every hash with a non-empty string id anywhere in the scenario, with the room it is authored
    # in (nil outside rooms: start inventory, items given later) and held: true for one nested
    # inside an NPC record (an npcs entry). Wider than the needs system's loaded room objects on
    # purpose: an item the player or a script can drop counts too. The room is informative only;
    # no test refuses on it.
    def scenario_objects(data)
      out = []
      seen = {}.compare_by_identity
      add = nil
      # A hash's values; under an npcs key the NPC records keep this level's flag and what they
      # contain is held
      add_values = lambda do |node, room_id, held|
        node.each do |k, v|
          next add.call(v, room_id, held) unless k == 'npcs' && v.is_a?(Array)

          v.each { |npc| add.call(npc, room_id, held, true) }
        end
      end
      add = lambda do |node, room_id, held, npc = false|
        case node
        when Array then node.each { |n| add.call(n, room_id, held) }
        when Hash
          next if seen[node]

          seen[node] = true
          out << { obj: node, room: room_id, held: held } if node['id'].is_a?(String) && !node['id'].empty?
          add_values.call(node, room_id, held || npc)
        end
      end
      rooms = data['rooms'].is_a?(Hash) ? data['rooms'] : {}
      rooms.each { |room_id, room| add.call(room, room_id, false) }
      add_values.call(data.reject { |k, _| k == 'rooms' }, nil, false)
      out
    end

    # _permitted(s, o, true) without the room leash (see the module comment): a private
    # affordance serves only its owners
    def permitted?(data, owner, obj)
      aff = AccessWork.affordance(data, obj)
      return true unless aff.is_a?(Hash) && aff['private'] == true

      owners_of(data, obj, aff).include?(owner['id'])
    end

    # _owners: affordance.owners, else screenOwner, else the NPCs whose needsHome is the object
    # (every one of them, where the client takes the first: wider, so never a wrongful refusal)
    def owners_of(data, obj, aff)
      return aff['owners'] if aff['owners'].is_a?(Array)
      return [obj['screenOwner']] if obj['screenOwner'].is_a?(String) && !obj['screenOwner'].empty?

      AccessIdentities.room_npcs(data).filter_map { |e| e[:npc]['id'] if e[:npc]['needsHome'] == obj['id'] }
    end
  end
end
