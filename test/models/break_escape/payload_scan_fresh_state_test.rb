require 'test_helper'

module BreakEscape
  # Fresh-state payload scan (SCENARIO_FORMAT_HARDENING_PLAN step 6a-1).
  #
  # STATUS: the leaf classifier below is live and unit-tested (classes 1, 3, 4 and the class-2
  # acknowledged-clues rule). The full corpus scan over real routes is HELD behind SCAN_PENDING
  # until hardening step 3 lands, because class 2 (a leaf under globalVariables / minigameData /
  # scenarioData) follows step 3's leak rule, and step 3's `acknowledgedClues` marker (the exemption
  # the scan reads) is not on this branch yet. The class-2 path here already reads `acknowledgedClues`
  # when the key is present, so it is correct the day step 3 lands; see the build log, "Step 6a-1 ...
  # left for after step 3".
  #
  # The classifier puts a response leaf in one of four classes by its authored source node (the
  # ScenarioSchema Node for the leaf's source path) and the object the leaf sits on:
  #   1. a source path marked x-serverOnly (on a route its x-servedBy does not name): fails.
  #   2. a source path under globalVariables / minigameData / scenarioData: step 3's leak rule, with
  #      acknowledged clues when `acknowledgedClues` is present.
  #   3. a declared field with no mark: passes (authored clue text, which step 3 allows).
  #   4. an undeclared key, or a constructed answer with no source path: the value check.
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
        when Array then s
        when Hash then [s['route']].compact
        else []
        end
      end
    end

    # Class a leaf by its source node and the lock type resolved from the object it sits on.
    # `route` is the route serving the leaf (nil treats every served-by as not matching, so a
    # server-only leaf is class 1). `lock_type` is the resolved lock type of the containing node
    # (the object's own lockType, or a door entry's connected room's), used for the conditional
    # requires and combination marks. Returns one of :class1, :class3, :class4, or :not_secret.
    def classify(node, route:, lock_type: nil)
      return :class4 unless node.is_a?(BreakEscape::ScenarioSchema::Node)

      mark = server_only_mark(node)
      if mark == true
        return served_routes(node).include?(route) ? :class3 : :class1
      elsif mark.is_a?(Hash) && mark['unlessLockType']
        # Secret unless the resolved lock type is one that keeps the value client-visible (rfid card
        # id, biometric owner, bluetooth). No resolved lock type on an object: fail closed.
        return mark['unlessLockType'].include?(lock_type) ? :not_secret : :class1
      elsif mark.is_a?(Hash) && mark['whenLockType']
        # Secret only under the named lock type (a combination copy on a combination lock).
        return mark['whenLockType'].include?(lock_type) ? :class1 : :not_secret
      end

      # No server-only mark: a declared field is authored clue text (class 3).
      :class3
    end

    # Would step 3's leak rule report this class-2 value, honouring acknowledged clues when present?
    # `clues` is scenario_data['acknowledgedClues'] (nil until step 3 stamps it). Until step 3 lands
    # this falls through to "report it", so m08's suite_code surfaces (held: not committed live).
    def class2_reports?(value, clues:)
      acknowledged = Array(clues).any? { |c| clue_covers?(c, value) }
      !acknowledged
    end

    def clue_covers?(clue, value)
      # Step 3 owns the real shape of an acknowledgedClues entry; this is a minimal match so the
      # exemption path is exercised once step 3's markers exist.
      return false unless clue.is_a?(Hash)

      [clue['value'], clue['global'], clue['in']].compact.map(&:to_s).include?(value.to_s)
    end
  end

  class PayloadScanFreshStateTest < ActiveSupport::TestCase
    SCAN_PENDING = 'payload scan held until hardening step 3 (acknowledgedClues) lands; ' \
                   'see SCENARIO_FORMAT_HARDENING_BUILD_LOG "Step 6a-1 ... left for after step 3"'.freeze

    SS = BreakEscape::ScenarioSchema
    C = BreakEscape::PayloadLeafClassifier

    # ── classifier unit tests (live now; they prove the 6a-1 marks resolve to the right class) ──

    def npc_node
      SS.item(SS.child(SS.at('#/definitions/room'), 'npcs'))
    end

    test 'the server-only creds record is class 1, and its password names the login_accounts route' do
      creds = SS.child(npc_node, 'creds')
      # creds is a whole-record server-only mark, so the record (and, by the scan's precedence rule,
      # every leaf under it that no x-servedBy exempts) is class 1 on GET scenario.
      assert_equal :class1, C.classify(creds, route: 'GET scenario')
      # creds.password is served only on GET /login_accounts (its postitNote key).
      password = SS.child(creds, 'password')
      assert_equal ['GET /login_accounts'], C.served_routes(password)
    end

    test 'accountProfiles is class 1 off its serving route and class 3 on it' do
      node = SS.root
      ap = SS.child(node, 'accountProfiles')
      assert_equal :class1, C.classify(ap, route: 'GET scenario')
      assert_equal :class3, C.classify(ap, route: 'GET /container')
    end

    test 'a declared unmarked field is class 3 and an undeclared key is class 4' do
      room = SS.at('#/definitions/room')
      door_sign = SS.child(room, 'door_sign') # declared, unmarked
      assert_equal :class3, C.classify(door_sign, route: 'GET scenario')
      assert_equal :class4, C.classify(SS.child(room, 'no_such_key_8f21'), route: 'GET scenario')
    end

    test 'cryptexConfig.answer is class 1 on both room and item' do
      %w[room item].each do |where|
        node = SS.at("#/definitions/#{where}")
        answer = SS.child(SS.child(node, 'cryptexConfig'), 'answer')
        assert_equal :class1, C.classify(answer, route: 'GET scenario'), where
      end
    end

    test 'combination is class 1 under a combination lock and not secret otherwise' do
      %w[room item].each do |where|
        comb = SS.child(SS.at("#/definitions/#{where}"), 'combination')
        assert_equal :class1, C.classify(comb, route: 'GET scenario', lock_type: 'combination'), where
        assert_equal :not_secret, C.classify(comb, route: 'GET scenario', lock_type: 'pin'), where
      end
    end

    test 'requires is secret unless the lock type keeps it client-visible, and fails closed with none' do
      %w[room item].each do |where|
        req = SS.child(SS.at("#/definitions/#{where}"), 'requires')
        assert_equal :not_secret, C.classify(req, route: 'GET scenario', lock_type: 'rfid'), where
        assert_equal :class1, C.classify(req, route: 'GET scenario', lock_type: 'pin'), where
        assert_equal :class1, C.classify(req, route: 'GET scenario', lock_type: nil), "#{where} fail-closed"
      end
    end

    test 'the class-2 rule reports a global value, and honours acknowledgedClues when present' do
      assert C.class2_reports?('1234', clues: nil), 'no clues: a global PIN is reported'
      clues = [{ 'global' => 'suite_code', 'value' => '1234' }]
      refute C.class2_reports?('1234', clues: clues), 'an acknowledged clue value is exempt'
      assert C.class2_reports?('9999', clues: clues), 'a different value is still reported'
    end

    # ── the full corpus scan over real routes: HELD until step 3 (see SCAN_PENDING) ──
    # When step 3 lands, remove the skip and build the scan here: for each scenario create a
    # standalone game (srand(1) around creation), fetch GET scenario, GET room/:id for every room,
    # GET container/:id for every container, GET login_accounts for each sign-in PC and GET network
    # with no foothold, walk every response leaf with the ScenarioSchema walker, class each leaf as
    # above, and fail on every class 1 leaf, every class 2 leaf class2_reports? returns true for, and
    # every class 4 value match with no serving field. Read exceptions from
    # test/fixtures/files/payload_scan_exceptions.json (a listed path that no longer fails is stale).
    # Routes left out, each with a reason, per the plan: GET scenario_map, GET objectives,
    # GET capture_secrets, GET ink, and the POST routes that answer with a body.
    test 'fresh-state corpus scan over every route (held for step 3)' do
      skip SCAN_PENDING
    end
  end
end
