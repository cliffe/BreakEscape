require 'test_helper'
# The step 3 secret-leak collector and matcher. The fresh-state scan reuses its answer set
# (SecretLeaks.collect_answers) and its match rule (answer_matches_leaf?) for the class 2 and
# class 4 value checks, so one rule judges a leaked value here and in the validator.
require_relative '../../../scripts/validate_secret_leaks'

module BreakEscape
  # Fresh-state payload scan (SCENARIO_FORMAT_HARDENING_PLAN step 6a-1).
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

    # Whether an acknowledgedClues entry covers a (lock_id, container) pair, the real shape step 3
    # declares: { lock, in, reason, approved }. `lock` is the id of the room/object whose answer is
    # matched; `in` is the id of the object holding the minigameData, or `global:<name>`.
    def clue_covers?(clue, lock_id, container)
      return false unless clue.is_a?(Hash)
      return false if lock_id.nil?

      clue['lock'].to_s == lock_id.to_s && clue['in'].to_s == container.to_s
    end

    # Would step 3's leak rule report this class-2 leaf? `answers` is SecretLeaks.collect_answers
    # over the authored data; `leaf` is { value:, path:, container:, source: }; `clues` is the
    # acknowledgedClues list. Reports when an authored answer matches the leaf value and no clue
    # covers that answer's lock in this container.
    def class2_reports?(answers, leaf, clues)
      matching = answers.select { |a| SecretLeaks.answer_matches_leaf?(a, leaf) }
      return false if matching.empty?

      matching.any? { |a| clues.none? { |c| clue_covers?(c, a[:lock_id], leaf[:container]) } }
    end
  end

  # The fresh-state corpus scan runs over real routes, so it is an integration test; the classifier
  # unit tests sit beside it (they need no HTTP). One file, per the plan.
  class PayloadScanFreshStateTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SS = BreakEscape::ScenarioSchema
    C = BreakEscape::PayloadLeafClassifier

    # The content-object node (a container's contents[] item), for the GET /container subtree.
    CONTENTS_ITEM = SS.item(SS.at('#/definitions/item/properties/contents'))
    # The bootstrap renames `startItemsInInventory` to `playerInventory`, so its items have no
    # top-level schema key, but they are authored items (plan 6a-1 "Two shapes of response": an
    # inventory item is a subtree payload at the authored path of the item with that id). Walk it
    # with the item-array node so an item's `name`/`observations` is class 3, not an undeclared
    # class 4 leaf that would coincide with a lock answer (test_unlock_gaps' "Pocket Cryptex").
    ITEM_ARRAY = SS.at('#/definitions/item/properties/contents')
    EXCEPTIONS_PATH = File.expand_path('../../fixtures/files/payload_scan_exceptions.json', __dir__)

    # ── classifier unit tests (they prove the 6a-1 marks resolve to the right class) ──

    def npc_node
      SS.item(SS.child(SS.at('#/definitions/room'), 'npcs'))
    end

    test 'the server-only creds record is class 1, and its password names both serving routes' do
      creds = SS.child(npc_node, 'creds')
      assert_equal :class1, C.classify(creds, route: 'GET scenario')
      password = SS.child(creds, 'password')
      assert_equal ['GET /login_accounts', 'GET /capture_secrets'], C.served_routes(password)
      assert_equal ['postitNote'], C.served_keys(password, 'GET /login_accounts')
    end

    test 'a landing page capture secret is class 1 off its route and served by GET /capture_secrets' do
      social = SS.child(SS.root, 'social')
      capture = SS.child(SS.item(SS.child(social, 'landingPages')), 'capture')
      secret = SS.child(capture, 'secret')
      assert_equal :class1, C.classify(secret, route: 'GET scenario')
      assert_equal :class1, C.classify(secret, route: 'GET room/:id')
      assert_equal ['GET /capture_secrets'], C.served_routes(secret)
      assert_equal :class3, C.classify(secret, route: 'GET /capture_secrets')
    end

    test "an NPC usePayload secret is class 1 off its route, reached as a declared property under x-free-data" do
      secret = SS.child(SS.child(npc_node, 'usePayload'), 'secret')
      assert_equal :class1, C.classify(secret, route: 'GET scenario')
      assert_equal ['GET /capture_secrets'], C.served_routes(secret)
      assert_equal :class3, C.classify(secret, route: 'GET /capture_secrets')
      assert_equal :class4, C.classify(SS.child(SS.child(npc_node, 'usePayload'), 'host'), route: 'GET scenario')
    end

    test 'an eventMapping addCapture secret is class 1 off its route and served by GET /capture_secrets' do
      mapping = SS.item(SS.child(npc_node, 'eventMappings'))
      secret = SS.child(SS.child(mapping, 'addCapture'), 'secret')
      assert_equal :class1, C.classify(secret, route: 'GET scenario')
      assert_equal ['GET /capture_secrets'], C.served_routes(secret)
      assert_equal :class3, C.classify(secret, route: 'GET /capture_secrets')
    end

    test 'accountProfiles is class 1 off its serving route and class 3 on it' do
      ap = SS.child(SS.root, 'accountProfiles')
      assert_equal :class1, C.classify(ap, route: 'GET scenario')
      assert_equal :class3, C.classify(ap, route: 'GET /container')
    end

    test 'a declared unmarked field is class 3 and an undeclared key is class 4' do
      room = SS.at('#/definitions/room')
      door_sign = SS.child(room, 'door_sign')
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

    test 'clue_covers? matches the real acknowledgedClues shape (lock + in)' do
      clue = { 'lock' => 'interrogation_room', 'in' => 'global:suite_code', 'reason' => 'x', 'approved' => 'y' }
      assert C.clue_covers?(clue, 'interrogation_room', 'global:suite_code')
      refute C.clue_covers?(clue, 'interrogation_room', 'global:other')
      refute C.clue_covers?(clue, 'other_lock', 'global:suite_code')
      refute C.clue_covers?(clue, nil, 'global:suite_code')
    end

    test 'class2_reports? reports a matched global unless a clue covers its (lock, container)' do
      answers = [{ kind: 'pin', value: '1234', path: 'rooms/vault/requires', lock_id: 'vault' }]
      leaf = { value: '1234', path: 'globalVariables/code', container: 'global:code', source: :global }
      assert C.class2_reports?(answers, leaf, []), 'no clue: the matched global is reported'
      clue = { 'lock' => 'vault', 'in' => 'global:code' }
      refute C.class2_reports?(answers, leaf, [clue]), 'a covering clue exempts it'
      other = { value: '9999', path: 'globalVariables/x', container: 'global:x', source: :global }
      refute C.class2_reports?(answers, other, []), 'a value no answer matches is not reported'
    end

    # ── the fresh-state corpus scan over real routes ──

    SKIP_ROUTES = {
      'GET scenario_map' => 'room layout and connections without contents (games_controller.rb:443); no authored lock answer.',
      'GET objectives' => 'objectives_state with targetFlags filtered (filter_target_flags); flag answers are stripped.',
      'GET capture_secrets' => 'serves only capture secrets whose proof holds; covered by capture_payload_secret_test and capture_payload_secret_routes_test.',
      'GET ink' => 'compiled NPC scripts; a spoken code is best effort under the cheat policy and step 3 already checks the globals ink reads.',
      'POST login' => 'attempt_login! body; opened-state, fetched by 6a-2.',
      'POST network/join' => 'join_network! body; opened-state, fetched by 6a-2.',
      'POST network/plant' => 'plant_device! body; opened-state, fetched by 6a-2.',
      'POST network/implant' => 'implant_foothold! body; opened-state, fetched by 6a-2.',
      'POST feed_post' => 'reveal_feed_post! body; serialised like feedPosts (class 4), fetched by 6a-2.',
      'POST friendface_phone' => 'open_friendface_phone body; opened-state, needs a held phone item (:forbidden in a fresh inventory) and never asks posts=1; serves feedPosts (class 4), fetched by 6a-2.',
      'POST flags' => 'process_flag_rewards body; opened-state, fetched by 6a-2.',
      'POST unlock' => 'roomData / container contents after an unlock; fetched by 6a-2.',
      'GET vm_panel' => 'redirect only (Hacktivity VM panel); carries no scenario JSON payload.',
      'GET vm_set_panel' => 'redirect only (Hacktivity VM set panel); carries no scenario JSON payload.'
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
      PlayerPreference.find_or_create_by!(player: @player) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end
    end

    test 'the fresh-state scan names the routes it leaves out, each with a reason' do
      assert_equal 14, SKIP_ROUTES.size
      SKIP_ROUTES.each_value { |reason| assert reason.length > 20 }
    end

    test 'fresh-state corpus scan: no class 1, class 2 or unexempted class 4 leaf ships' do
      exceptions = load_exceptions
      used_exceptions = {}
      findings = []
      per_scenario = {}
      skipped = []

      scenario_templates.each do |scenario_path|
        name = File.basename(File.dirname(scenario_path))
        rel = "scenarios/#{name}/scenario.json.erb"
        data = render_template(scenario_path)
        if data.nil?
          skipped << name
          next
        end

        game = build_game(data)
        scn_findings = scan_game(game, rel)
        per_scenario[name] = scn_findings.size

        scn_findings.each do |f|
          if exception_covers?(exceptions, f)
            used_exceptions[[f[:scenario], f[:route], f[:path]]] = true
          else
            findings << f
          end
        end
      ensure
        game&.destroy
      end

      # A listed exception path that no longer fails is stale (as a stale known failure is).
      stale = []
      exceptions.each do |exc|
        exc['paths'].each do |path|
          key = [exc['scenario'], exc['route'], path]
          stale << "stale payload scan exception: #{exc['scenario']} #{exc['route']} #{path}" unless used_exceptions[key]
        end
      end

      report_scan(per_scenario, exceptions, skipped)

      messages = findings.map do |f|
        "#{f[:scenario]} | #{f[:route]} | #{f[:path]} | #{f[:klass]} | value=#{f[:value].inspect}"
      end
      assert_equal [], messages + stale, "payload scan findings (fresh state):\n#{(messages + stale).join("\n")}"
    end

    # A crafted payload proves the scan body catches a planted leak of each class and passes a
    # legitimate client-visible leaf (plan 6a-1 Tests: the class fixtures).
    test 'the scan body catches a planted leak of each class and passes a client-visible leaf' do
      answers = [
        { kind: 'pin', value: '4821', path: 'rooms/vault/requires', lock_id: 'vault' },
        { kind: 'password', value: 'Satchel42', path: 'creds/omar', lock_id: nil }
      ]
      clues = []

      # Class 3: a declared unmarked field (postitNote) holding the password is authored clue text.
      # Value-checked (M1) but `postitNote` is value-exempt (the written-down-password clue), so it
      # passes; a non-matching declared field passes because no answer matches it.
      room = { 'type' => 'office', 'objects' => [{ 'id' => 'desk', 'type' => 'notes', 'postitNote' => 'Satchel42' }] }
      assert_equal [], scan_subtree_findings(SS.at('#/definitions/room'), room, 'GET room/:id', 'rooms/office', answers, clues),
                   'a postitNote clue is class 3 and value-exempt, so it passes'
      plain = { 'type' => 'office', 'id' => 'hall', 'door_sign' => 'Staff only beyond this point' }
      assert_equal [], scan_subtree_findings(SS.at('#/definitions/room'), plain, 'GET room/:id', 'rooms/office', answers, clues),
                   'a declared field whose text matches no answer passes'

      # Class 3 value check (M1): a 6+ char secret in a declared, non-exempt field is reported as
      # class 2. In scenario_brief (author metadata, no enclosing object) it has no container, so no
      # acknowledgedClues entry can cover it.
      brief = { 'scenario_brief' => 'Ops note: the backup box password is Satchel42. Do not ship.' }
      fb = scan_subtree_findings(SS.root, brief, 'GET scenario', '', answers, clues)
      assert_equal [:class2], fb.map { |f| f[:klass] }, 'a 6+ char secret pasted into scenario_brief is caught'

      # The same check on a declared field inside an object carries the object id as the container, so
      # an acknowledgedClues entry keyed on (lock, object) can cover it, like a class-2 global.
      signed = { 'type' => 'office', 'id' => 'lobby', 'door_sign' => '4821' }
      fs = scan_subtree_findings(SS.at('#/definitions/room'), signed, 'GET room/:id', 'rooms/lobby', answers, clues)
      assert_equal [:class2], fs.map { |f| f[:klass] }, 'a PIN on a declared door_sign is class 2'
      assert_equal [], scan_subtree_findings(SS.at('#/definitions/room'), signed, 'GET room/:id', 'rooms/lobby', answers,
                                             [{ 'lock' => 'vault', 'in' => 'lobby' }]),
                   'an acknowledgedClues entry on the enclosing object exempts the class-3 match'

      # Class 1: a `requires` under a pin lock (resolved lock type pin) ships the answer.
      locked = { 'type' => 'office', 'objects' => [{ 'id' => 'safe', 'lockType' => 'pin', 'requires' => '4821' }] }
      f1 = scan_subtree_findings(SS.at('#/definitions/room'), locked, 'GET room/:id', 'rooms/office', answers, clues)
      assert_equal [:class1], f1.map { |f| f[:klass] }, 'a pin requires leaf is class 1'

      # Class 2: a PIN copied into a global, with no acknowledgedClues entry, is reported.
      scenario = { 'globalVariables' => { 'door_code' => '4821' } }
      f2 = scan_subtree_findings(SS.root, scenario, 'GET scenario', '', answers, clues)
      assert_equal [:class2], f2.map { |f| f[:klass] }, 'a leaked global is class 2'
      # ... and an acknowledgedClues entry covering (vault, global:door_code) exempts it.
      assert_equal [], scan_subtree_findings(SS.root, scenario, 'GET scenario', '', answers,
                                             [{ 'lock' => 'vault', 'in' => 'global:door_code' }]),
                   'an acknowledged global clue passes'

      # Class 4: the password under an undeclared key ships the answer with no serving field.
      undeclared = { 'type' => 'office', 'objects' => [{ 'id' => 'x', 'secret_note_zz' => 'Satchel42' }] }
      f4 = scan_subtree_findings(SS.at('#/definitions/room'), undeclared, 'GET room/:id', 'rooms/office', answers, clues)
      assert_equal [:class4], f4.map { |f| f[:klass] }, 'a password under an undeclared key is class 4'

      # Class 4 allowance: the same password under `postitNote` on GET /login_accounts is served.
      tiles = { 'pc_id' => 'omar_pc', 'loginAccounts' => [{ 'username' => 'omar', 'postitNote' => 'Satchel42' }] }
      assert_equal [], scan_subtree_findings(nil, tiles, 'GET /login_accounts', 'login_accounts/omar_pc', answers, clues),
                   'a written-down password under postitNote on GET /login_accounts is served (class 4 allowance)'
    end

    private

    def scenario_templates
      only = ENV['PAYLOAD_SCAN_ONLY']
      paths = Dir.glob(Rails.root.join('..', '..', 'scenarios', '*', 'scenario.json.erb').to_s).sort
      paths = Dir.glob(File.expand_path('../../../scenarios/*/scenario.json.erb', __dir__)).sort if paths.empty?
      if only && !only.empty?
        wanted = only.split(',').map(&:strip)
        paths = paths.select { |p| wanted.include?(File.basename(File.dirname(p))) }
      end
      paths
    end

    # Render under srand(1) so random PINs and tokens are the same on every run (plan 6a-1), then
    # restore the generator. nil on a render failure (the scenario is skipped and reported).
    def render_template(path)
      srand(1)
      JSON.parse(BreakEscape::ScenarioBinding.render(File.read(path)))
    rescue StandardError
      nil
    ensure
      srand(Random.new_seed)
    end

    def build_game(data)
      start = data['startRoom']
      state = {
        'currentRoom' => start, 'unlockedRooms' => (start ? [start] : []), 'unlockedObjects' => [],
        'inventory' => [], 'encounteredNPCs' => [], 'globalVariables' => {}, 'biometricSamples' => [],
        'biometricUnlocks' => [], 'bluetoothDevices' => [], 'notes' => [], 'health' => 100
      }
      game = Game.create!(mission: @mission, player: @player, scenario_data: data, player_state: state)
      game.prepare_scenario_data!
      game.reload
      game
    end

    # Fetch each fresh-state route of one game and return the scan findings over its 200 bodies.
    def scan_game(game, scenario_path)
      data = game.scenario_data
      answers = SecretLeaks.collect_answers(data)
      clues = SecretLeaks.acknowledged_clues(data)
      findings = []

      # GET scenario (the bootstrap).
      get scenario_game_url(game), as: :json
      if response.status == 200
        findings.concat(scan_body(SS.root, parsed_body, 'GET scenario', '', scenario_path, answers, clues))
      end

      # GET room/:id for every accessible room; a locked room's refusal passes.
      game.reload
      accessible = ([data['startRoom']] + Array(game.player_state['unlockedRooms'])).compact.uniq
      accessible.each do |room_id|
        next unless data.dig('rooms', room_id).is_a?(Hash)

        get room_game_url(game, room_id: room_id), as: :json
        next unless response.status == 200

        room = parsed_body['room']
        findings.concat(scan_body(SS.at('#/definitions/room'), room, 'GET room/:id', "rooms/#{room_id}",
                                  scenario_path, answers, clues)) if room.is_a?(Hash)
      end

      # Containers and sign-in PCs reachable from the accessible rooms; most refuse in fresh state.
      container_ids, login_ids = reachable_objects(data, accessible)
      container_ids.each do |cid|
        get "/break_escape/games/#{game.id}/container/#{cid}", as: :json
        next unless response.status == 200

        contents = parsed_body['contents']
        next unless contents.is_a?(Array)

        contents.each_with_index do |obj, i|
          findings.concat(scan_body(CONTENTS_ITEM, obj, 'GET /container', "container/#{cid}/contents[#{i}]",
                                    scenario_path, answers, clues))
        end
      end

      login_ids.each do |pid|
        get login_accounts_game_url(game), params: { pc_id: pid }
        next unless response.status == 200

        findings.concat(scan_body(nil, parsed_body, 'GET /login_accounts', "login_accounts/#{pid}",
                                  scenario_path, answers, clues))
      end

      # GET network with no foothold: an empty view or a refusal in the fresh state.
      get network_game_url(game), as: :json
      if response.status == 200
        findings.concat(scan_body(nil, parsed_body, 'GET /network', 'network', scenario_path, answers, clues))
      end

      findings
    end

    def parsed_body
      JSON.parse(response.body)
    rescue StandardError
      {}
    end

    # Container and sign-in PC ids that sit in the accessible rooms (so a request can reach them in
    # the fresh state). A container is an object with `contents`; a sign-in PC is Game.login_pc?.
    def reachable_objects(data, accessible)
      containers = []
      logins = []
      accessible.each do |room_id|
        room = data.dig('rooms', room_id)
        next unless room.is_a?(Hash)

        each_object(room) do |obj|
          id = obj['id']
          next unless id.is_a?(String)

          containers << id if obj['contents'].is_a?(Array)
          if Game.login_pc?(obj)
            logins << id
            containers << id
          end
        end
      end
      [containers.uniq, logins.uniq]
    end

    def each_object(node, &block)
      case node
      when Hash
        yield node if node['id'].is_a?(String)
        node.each_value { |v| each_object(v, &block) }
      when Array
        node.each { |v| each_object(v, &block) }
      end
    end

    # Walk one response body with its source node and emit findings.
    def scan_body(node, body, route, root_path, scenario_path, answers, clues)
      findings = []
      walk_leaf(node, body, root_path, route, nil, false, nil, nil, nil, answers, clues) do |klass, path, value, container|
        findings << { scenario: scenario_path, route: route, path: path, klass: klass, value: value, container: container }
      end
      findings
    end

    # The scan body over an in-memory payload, for the per-class fixture test (no HTTP).
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
        # The nearest enclosing object id, carried so a class-3 value match (M1) names a container an
        # acknowledgedClues entry can cover; a top-level field (scenario_brief) has none.
        child_obj_id = data['id'].is_a?(String) ? data['id'] : obj_id
        data.each do |k, v|
          child = (node.equal?(SS.root) && k == 'playerInventory') ? ITEM_ARRAY : SS.child(node, k)
          child_withheld = under_withheld
          unless under_withheld
            mark = C.server_only_mark(child)
            child_withheld = true if mark == true && !C.served_routes(child).include?(route)
          end

          child_class2, child_container = descend_class2(k, v, class2, container, here_id)
          # For a global block, the container is the global name at the next level, so recurse per name.
          walk_leaf(child, v, "#{path}/#{k}", route, here_lock, child_withheld, child_class2, child_container,
                    child_obj_id, answers, clues, &emit)
        end
      when Array
        item = SS.item(node)
        # In a class-2 block, a combination answer can match a whole array leaf.
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
        [:pending_global, container] # the global name is the next key
      when 'minigameData'
        [:minigame, here_id]
      when 'scenarioData'
        [:scenario_data, here_id]
      else
        if class2 == :pending_global
          [:global, "global:#{key}"] # `key` is the global name
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
        # M1: a declared authored-text string is still value-checked. If it equals or contains a
        # value-matchable answer (answer_matches_leaf?: a 6+ char password/cryptex whole word, or a
        # combination-form leaf), it is a leak, reported as class 2 and coverable by acknowledgedClues
        # keyed on the enclosing object (global:<name> is never the container here, so a top-level
        # field such as scenario_brief has no container and cannot be clue-exempted). Non-matching
        # authored text (the common case) still passes. Short secrets (under 6 chars: WOLF, a 4-digit
        # PIN) and a combination quoted in prose do not match, so they are not caught here.
        return unless value.is_a?(String)
        return if class3_value_exempt?(route, path)

        leaf = { value: value, path: path, container: obj_id, source: :class3 }
        yield(:class2, path, value, obj_id) if C.class2_reports?(answers, leaf, clues)
      end
      # :not_secret passes.
    end

    def value_is_a_secret?(answers, value)
      leaf = { value: value }
      answers.any? { |a| SecretLeaks.answer_matches_leaf?(a, leaf) }
    end

    # The class-4 serving-field allowance for the fresh-state routes, mirroring the x-servedBy marks:
    # creds.password is served under `postitNote` on GET /login_accounts, a Wi-Fi psk under `psk` on
    # GET /network. The constructed body has no source node, so the allowed key is read off the path.
    def class4_served?(route, path)
      key = path.split('/').last.to_s.sub(/\[\d+\]\z/, '')
      (route == 'GET /login_accounts' && key == 'postitNote') ||
        (route == 'GET /network' && key == 'psk')
    end

    # Scan tuning for the M1 class-3 value check (the scan, never the shared match rule): declared
    # fields whose job is to show a secret to the player in the world, where a value match is by
    # design and not a leak. Corpus evidence (build log, "Scan review R1 fixes"): across 180
    # scenarios every class-3 value match outside `scenario_brief` landed on one of these keys.
    #   postitNote    the written-down-password clue (the same field GET /login_accounts serves under
    #                 the class-4 allowance): a sticky note exists to show the password.
    #   text          note, sign and item bodies: the primary in-world clue-delivery field (a note
    #                 that reads "the code is 2817" is the intended way to learn it).
    #   message       NPC dialogue (eventMappings sendTimedMessage): spoken lines are best effort
    #                 under the cheat policy, like GET ink, which this scan already skips.
    #   observations  item examine text: in-world flavour/clue text.
    # A display `name` is NOT exempt: it is a framing field, as in step 3's narrative check
    # (validate_secret_leaks.rb NARRATIVE_STRING_KEYS), and an answer in a name is a slip. The one
    # corpus hit (test_unlock_gaps' "Pocket Cryptex" over the answer POCKET) was fixed in the
    # scenario, whose answer is now TINDER.
    # Exempting these leaves the check covering author metadata not meant as an in-world clue, above
    # all `scenario_brief` (served by GET scenario), which is the realistic leak Major 1 flagged.
    # A secret in one of these fields stays human-review territory, as do short secrets (see the
    # class-3 comment on classify_scalar).
    CLASS3_VALUE_EXEMPT_KEYS = %w[postitNote text message observations].freeze

    def class3_value_exempt?(_route, path)
      key = path.split('/').last.to_s.sub(/\[\d+\]\z/, '')
      CLASS3_VALUE_EXEMPT_KEYS.include?(key)
    end

    def load_exceptions
      return [] unless File.exist?(EXCEPTIONS_PATH)

      JSON.parse(File.read(EXCEPTIONS_PATH))
    end

    def exception_covers?(exceptions, finding)
      exceptions.any? do |exc|
        exc['scenario'] == finding[:scenario] && exc['route'] == finding[:route] &&
          Array(exc['paths']).include?(finding[:path])
      end
    end

    def report_scan(per_scenario, exceptions, skipped)
      flagged = per_scenario.reject { |_, n| n.zero? }
      puts "\n[payload scan] scenarios scanned: #{per_scenario.size}, with findings before exceptions: #{flagged.size}"
      flagged.sort.each { |name, n| puts "  #{name}: #{n}" }
      puts "  exceptions in file: #{exceptions.size}"
      puts "  skipped (render failed): #{skipped.join(', ')}" unless skipped.empty?
    end
  end
end
