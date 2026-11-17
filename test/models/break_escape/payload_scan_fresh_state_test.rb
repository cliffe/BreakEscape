require 'test_helper'
# The shared payload-scan engine (classifier + walk), extracted to test/support so the fresh-state
# scan (6a-1) and the opened-state scan (6a-2) share one body. It requires the step 3 secret-leak
# collector and matcher, whose rule judges a leaked value here and in the validator alike.
require_relative '../../support/payload_scan'

module BreakEscape
  # Fresh-state payload scan (SCENARIO_FORMAT_HARDENING_PLAN step 6a-1).
  #
  # The classifier and the walk live in BreakEscape::PayloadLeafClassifier and
  # BreakEscape::PayloadScan (test/support/payload_scan.rb); this file holds the corpus scan over
  # real routes in the fresh state, the classifier unit tests and the per-class fixture.
  class PayloadScanFreshStateTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SS = BreakEscape::ScenarioSchema
    C  = BreakEscape::PayloadLeafClassifier
    PS = BreakEscape::PayloadScan

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

    # A crafted payload proves the shared scan body catches a planted leak of each class and passes a
    # legitimate client-visible leaf (plan 6a-1 Tests: the class fixtures).
    test 'the scan body catches a planted leak of each class and passes a client-visible leaf' do
      answers = [
        { kind: 'pin', value: '4821', path: 'rooms/vault/requires', lock_id: 'vault' },
        { kind: 'password', value: 'Satchel42', path: 'creds/omar', lock_id: nil }
      ]
      clues = []

      room = { 'type' => 'office', 'objects' => [{ 'id' => 'desk', 'type' => 'notes', 'postitNote' => 'Satchel42' }] }
      assert_equal [], PS.scan_subtree_findings(SS.at('#/definitions/room'), room, 'GET room/:id', 'rooms/office', answers, clues),
                   'a postitNote clue is class 3 and value-exempt, so it passes'
      plain = { 'type' => 'office', 'id' => 'hall', 'door_sign' => 'Staff only beyond this point' }
      assert_equal [], PS.scan_subtree_findings(SS.at('#/definitions/room'), plain, 'GET room/:id', 'rooms/office', answers, clues),
                   'a declared field whose text matches no answer passes'

      brief = { 'scenario_brief' => 'Ops note: the backup box password is Satchel42. Do not ship.' }
      fb = PS.scan_subtree_findings(SS.root, brief, 'GET scenario', '', answers, clues)
      assert_equal [:class2], fb.map { |f| f[:klass] }, 'a 6+ char secret pasted into scenario_brief is caught'

      signed = { 'type' => 'office', 'id' => 'lobby', 'door_sign' => '4821' }
      fs = PS.scan_subtree_findings(SS.at('#/definitions/room'), signed, 'GET room/:id', 'rooms/lobby', answers, clues)
      assert_equal [:class2], fs.map { |f| f[:klass] }, 'a PIN on a declared door_sign is class 2'
      assert_equal [], PS.scan_subtree_findings(SS.at('#/definitions/room'), signed, 'GET room/:id', 'rooms/lobby', answers,
                                                [{ 'lock' => 'vault', 'in' => 'lobby' }]),
                   'an acknowledgedClues entry on the enclosing object exempts the class-3 match'

      locked = { 'type' => 'office', 'objects' => [{ 'id' => 'safe', 'lockType' => 'pin', 'requires' => '4821' }] }
      f1 = PS.scan_subtree_findings(SS.at('#/definitions/room'), locked, 'GET room/:id', 'rooms/office', answers, clues)
      assert_equal [:class1], f1.map { |f| f[:klass] }, 'a pin requires leaf is class 1'

      scenario = { 'globalVariables' => { 'door_code' => '4821' } }
      f2 = PS.scan_subtree_findings(SS.root, scenario, 'GET scenario', '', answers, clues)
      assert_equal [:class2], f2.map { |f| f[:klass] }, 'a leaked global is class 2'
      assert_equal [], PS.scan_subtree_findings(SS.root, scenario, 'GET scenario', '', answers,
                                                [{ 'lock' => 'vault', 'in' => 'global:door_code' }]),
                   'an acknowledged global clue passes'

      undeclared = { 'type' => 'office', 'objects' => [{ 'id' => 'x', 'secret_note_zz' => 'Satchel42' }] }
      f4 = PS.scan_subtree_findings(SS.at('#/definitions/room'), undeclared, 'GET room/:id', 'rooms/office', answers, clues)
      assert_equal [:class4], f4.map { |f| f[:klass] }, 'a password under an undeclared key is class 4'

      tiles = { 'pc_id' => 'omar_pc', 'loginAccounts' => [{ 'username' => 'omar', 'postitNote' => 'Satchel42' }] }
      assert_equal [], PS.scan_subtree_findings(nil, tiles, 'GET /login_accounts', 'login_accounts/omar_pc', answers, clues),
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

      get scenario_game_url(game), as: :json
      if response.status == 200
        findings.concat(PS.scan_body(SS.root, parsed_body, 'GET scenario', '', scenario_path, answers, clues))
      end

      game.reload
      accessible = ([data['startRoom']] + Array(game.player_state['unlockedRooms'])).compact.uniq
      accessible.each do |room_id|
        next unless data.dig('rooms', room_id).is_a?(Hash)

        get room_game_url(game, room_id: room_id), as: :json
        next unless response.status == 200

        room = parsed_body['room']
        findings.concat(PS.scan_body(SS.at('#/definitions/room'), room, 'GET room/:id', "rooms/#{room_id}",
                                     scenario_path, answers, clues)) if room.is_a?(Hash)
      end

      container_ids, login_ids = reachable_objects(data, accessible)
      container_ids.each do |cid|
        get "/break_escape/games/#{game.id}/container/#{cid}", as: :json
        next unless response.status == 200

        contents = parsed_body['contents']
        next unless contents.is_a?(Array)

        contents.each_with_index do |obj, i|
          findings.concat(PS.scan_body(PS::CONTENTS_ITEM, obj, 'GET /container', "container/#{cid}/contents[#{i}]",
                                       scenario_path, answers, clues))
        end
      end

      login_ids.each do |pid|
        get login_accounts_game_url(game), params: { pc_id: pid }
        next unless response.status == 200

        findings.concat(PS.scan_body(nil, parsed_body, 'GET /login_accounts', "login_accounts/#{pid}",
                                     scenario_path, answers, clues))
      end

      get network_game_url(game), as: :json
      if response.status == 200
        findings.concat(PS.scan_body(nil, parsed_body, 'GET /network', 'network', scenario_path, answers, clues))
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
