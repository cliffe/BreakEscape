# frozen_string_literal: true

require_relative '../../scripts/validate_secret_leaks'

module BreakEscape
  # Shared payload-scan engine for the fresh-state scan (6a-1) and the opened-state scan (6a-2).
  #
  # The classifier puts a response leaf in one of four classes by its authored source node (the
  # ScenarioSchema Node for the leaf's source path) and the object the leaf sits on:
  #   1. a source path marked x-serverOnly (on a route its x-servedBy does not name): fails.
  #   2. a source path under globalVariables / minigameData / scenarioData: step 3's leak rule, with
  #      acknowledged clues when `acknowledgedClues` is present.
  #   3. a declared field with no mark: authored clue text. Still value-checked (review R1 M1): a
  #      string that equals or contains a value-matchable answer is reported as a class 2 finding
  #      (coverable by acknowledgedClues on the enclosing object), unless the field is one whose job
  #      is to show a secret in the world (CLASS3_VALUE_EXEMPT_KEYS). Other authored text passes.
  #   4. an undeclared key, or a constructed answer with no source path: the value check.
  #
  # What the scan does NOT detect, and so cannot claim: it reports no class 1, class 2 or unexempted
  # class 4 *value-matchable* leaf, not "no secret ships". It cannot see a secret shorter than 6
  # characters (most PINs, a 4-letter cryptex word) embedded in a longer string, nor a combination
  # quoted in prose, because answer_matches_leaf? cannot match those without unacceptable false
  # positives (4821, 1234, 12-30-5 occur in ordinary text, dates and room numbers); and it does not
  # value-check the in-world clue-delivery fields (CLASS3_VALUE_EXEMPT_KEYS). Those stay human-review
  # territory.
  module PayloadLeafClassifier
    module_function

    # Is a Node (or its branches) marked x-serverOnly, and in which form?
    # Returns one of: nil (not marked), true (unconditional), or a Hash ({unlessLockType:[...]}
    # or {whenLockType:[...]}).
    def server_only_mark(node)
      return nil unless node.is_a?(BreakEscape::ScenarioSchema::Node)

      node.branches.each do |b|
        next unless b.is_a?(Hash) && b.key?('x-serverOnly')

        return b['x-serverOnly']
      end
      nil
    end

    # The routes a Node's x-servedBy names (a String, Array of Strings, or a Hash with a "route").
    def served_routes(node)
      return [] unless node.is_a?(BreakEscape::ScenarioSchema::Node)

      node.branches.flat_map do |b|
        s = b.is_a?(Hash) ? b['x-servedBy'] : nil
        case s
        when String then [s]
        when Array then s.flat_map { |e| e.is_a?(Hash) ? [e['route']].compact : [e] }
        when Hash then [s['route']].compact
        else []
        end
      end
    end

    # The keys a Node's x-servedBy allows on a route (a hash entry's "key"), for the class 4
    # serving-field allowance: creds.password is served only under the `postitNote` key on
    # GET /login_accounts. [] means the route serves the value under any key.
    def served_keys(node, route)
      return [] unless node.is_a?(BreakEscape::ScenarioSchema::Node)

      node.branches.flat_map do |b|
        s = b.is_a?(Hash) ? b['x-servedBy'] : nil
        Array(s).select { |e| e.is_a?(Hash) && e['route'] == route && e['key'] }.map { |e| e['key'] }
      end
    end

    # Class a leaf by its source node and the lock type resolved from the object it sits on.
    def classify(node, route:, lock_type: nil)
      return :class4 unless node.is_a?(BreakEscape::ScenarioSchema::Node)

      mark = server_only_mark(node)
      if mark == true
        return served_routes(node).include?(route) ? :class3 : :class1
      elsif mark.is_a?(Hash) && mark['unlessLockType']
        return mark['unlessLockType'].include?(lock_type) ? :not_secret : :class1
      elsif mark.is_a?(Hash) && mark['whenLockType']
        return mark['whenLockType'].include?(lock_type) ? :class1 : :not_secret
      end

      :class3
    end

    # Whether an acknowledgedClues entry covers a (lock_id, container) pair: { lock, in, ... }.
    def clue_covers?(clue, lock_id, container)
      return false unless clue.is_a?(Hash)
      return false if lock_id.nil?

      clue['lock'].to_s == lock_id.to_s && clue['in'].to_s == container.to_s
    end

    # Would step 3's leak rule report this class-2 leaf?
    def class2_reports?(answers, leaf, clues)
      matching = answers.select { |a| SecretLeaks.answer_matches_leaf?(a, leaf) }
      return false if matching.empty?

      matching.any? { |a| clues.none? { |c| clue_covers?(c, a[:lock_id], leaf[:container]) } }
    end
  end

  # The recursive walk and the scan helpers, shared by both scan tests. Pure: every method takes
  # the schema node and the data and emits findings; no instance state.
  module PayloadScan
    module_function

    SS = BreakEscape::ScenarioSchema
    C = BreakEscape::PayloadLeafClassifier

    # The content-object node (a container's contents[] item), for the GET /container subtree.
    CONTENTS_ITEM = SS.item(SS.at('#/definitions/item/properties/contents'))
    # The bootstrap renames `startItemsInInventory` to `playerInventory`; walk it with the
    # item-array node so an item's `name`/`observations` is class 3, not an undeclared class 4 leaf.
    ITEM_ARRAY = SS.at('#/definitions/item/properties/contents')

    # Scan tuning for the M1 class-3 value check (the scan, never the shared match rule): declared
    # fields whose job is to show a secret to the player in the world.
    CLASS3_VALUE_EXEMPT_KEYS = %w[postitNote text message observations].freeze

    # Walk one response body with its source node and return findings.
    def scan_body(node, body, route, root_path, scenario_path, answers, clues)
      findings = []
      walk_leaf(node, body, root_path, route, nil, false, nil, nil, nil, answers, clues) do |klass, path, value, container|
        findings << { scenario: scenario_path, route: route, path: path, klass: klass, value: value, container: container }
      end
      findings
    end

    # The scan body over an in-memory payload (no HTTP, no scenario tag), for fixtures.
    def scan_subtree_findings(node, body, route, root_path, answers, clues)
      findings = []
      walk_leaf(node, body, root_path, route, nil, false, nil, nil, nil, answers, clues) do |klass, path, value, container|
        findings << { route: route, path: path, klass: klass, value: value, container: container }
      end
      findings
    end

    # Recursive walk. Carries: the schema node; the lock type resolved from the nearest object; a
    # flag that an unconditional server-only ancestor withholds this route (precedence); the
    # class-2 source kind (:global/:minigame/:scenario_data) and container once under one of those
    # blocks. Yields [klass, path, value, container] for every leaf that fails.
    def walk_leaf(node, data, path, route, lock_type, under_withheld, class2, container, obj_id, answers, clues, &emit)
      case data
      when Hash
        here_lock = data['lockType'].is_a?(String) ? data['lockType'] : lock_type
        here_id = data['id'].is_a?(String) ? data['id'] : container_object_id(container)
        child_obj_id = data['id'].is_a?(String) ? data['id'] : obj_id
        data.each do |k, v|
          child = (node.equal?(SS.root) && k == 'playerInventory') ? ITEM_ARRAY : SS.child(node, k)
          child_withheld = under_withheld
          unless under_withheld
            mark = C.server_only_mark(child)
            child_withheld = true if mark == true && !C.served_routes(child).include?(route)
          end

          child_class2, child_container = descend_class2(k, v, class2, container, here_id)
          walk_leaf(child, v, "#{path}/#{k}", route, here_lock, child_withheld, child_class2, child_container,
                    child_obj_id, answers, clues, &emit)
        end
      when Array
        item = SS.item(node)
        if class2
          leaf = { value: data, path: path, container: container, source: class2 }
          emit.call(:class2, path, data, container) if C.class2_reports?(answers, leaf, clues)
        end
        data.each_with_index do |v, i|
          walk_leaf(item, v, "#{path}[#{i}]", route, lock_type, under_withheld, class2, container, obj_id,
                    answers, clues, &emit)
        end
      else
        classify_scalar(node, data, path, route, lock_type, under_withheld, class2, container, obj_id,
                        answers, clues, &emit)
      end
    end

    # Set the class-2 source and container when descending into a leak block.
    def descend_class2(key, _value, class2, container, here_id)
      case key
      when 'globalVariables', 'savedGlobalVariables'
        [:pending_global, container]
      when 'minigameData'
        [:minigame, here_id]
      when 'scenarioData'
        [:scenario_data, here_id]
      else
        if class2 == :pending_global
          [:global, "global:#{key}"]
        else
          [class2, container]
        end
      end
    end

    def container_object_id(container)
      return nil unless container.is_a?(String)

      container.start_with?('global:') ? nil : container
    end

    def classify_scalar(node, value, path, route, lock_type, under_withheld, class2, container, obj_id, answers, clues)
      return if value.nil?

      if class2 && class2 != :pending_global
        leaf = { value: value, path: path, container: container, source: class2 }
        yield(:class2, path, value, container) if C.class2_reports?(answers, leaf, clues)
        return
      end

      if under_withheld
        yield(:class1, path, value, container)
        return
      end

      case C.classify(node, route: route, lock_type: lock_type)
      when :class1
        yield(:class1, path, value, container)
      when :class4
        return unless value_is_a_secret?(answers, value)
        return if class4_served?(route, path)

        yield(:class4, path, value, container)
      when :class3
        return unless value.is_a?(String)
        return if class3_value_exempt?(route, path)

        leaf = { value: value, path: path, container: obj_id, source: :class3 }
        yield(:class2, path, value, obj_id) if C.class2_reports?(answers, leaf, clues)
      end
    end

    def value_is_a_secret?(answers, value)
      leaf = { value: value }
      answers.any? { |a| SecretLeaks.answer_matches_leaf?(a, leaf) }
    end

    # The post fields the feed legitimately ships under the feedPosts block: mirrors
    # BreakEscape::SocialFeed::POST_KEYS (the post block the browser renders) plus the feed's
    # site/person and a reply's name labels. An answer under any OTHER key in the block is still
    # reported (feedPosts_test proves both: the allowed field passes, the stray key is caught).
    FEED_POST_DISPLAY_KEYS = %w[id text fact date note replyTo site person replyToPerson namedPerson].freeze

    # The class-4 serving-field allowance for the scanned routes, mirroring the x-servedBy marks:
    # creds.password is served under `postitNote` on GET /login_accounts, a Wi-Fi psk under `psk`
    # on GET /network. The feed routes serve a revealed post's own display text (and the OSINT fact
    # entry it earned) through `x-servedBy: feedPosts`.
    def class4_served?(route, path)
      key = path.split('/').last.to_s.sub(/\[\d+\]\z/, '')
      (route == 'GET /login_accounts' && key == 'postitNote') ||
        (route == 'GET /network' && key == 'psk') ||
        (feed_route?(route) && feed_post_served?(path, key))
    end

    # GET scenario carries feedPosts in the bootstrap; POST /friendface_phone returns a slice of it.
    def feed_route?(route)
      route == 'GET scenario' || route == 'POST /friendface_phone'
    end

    # A leaf inside the feedPosts block that the feed is entitled to ship: a post's own authored
    # display field, or a revealed OSINT fact entry (`.../fact/entry/...`, the clue the player
    # earned by revealing the post). Anything else under feedPosts stays value-checked.
    def feed_post_served?(path, key)
      return false unless path.include?('/feedPosts/')
      return true if path.include?('/fact/entry')

      FEED_POST_DISPLAY_KEYS.include?(key)
    end

    def class3_value_exempt?(_route, path)
      key = path.split('/').last.to_s.sub(/\[\d+\]\z/, '')
      CLASS3_VALUE_EXEMPT_KEYS.include?(key)
    end
  end
end
