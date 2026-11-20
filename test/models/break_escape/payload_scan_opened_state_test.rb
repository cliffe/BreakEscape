require 'test_helper'
require 'minitest/mock' # Minitest's stub, for the class-method mutation (a); the suite has no mocha.
require_relative '../../support/payload_scan'

module BreakEscape
  # Opened-state payload scan (SCENARIO_FORMAT_HARDENING_PLAN step 6a-2).
  #
  # The fresh-state scan (6a-1) reaches only what a new player can see. This scan writes
  # player_state directly, as test/models/break_escape/access_model_withholding_test.rb does, to
  # open every room, object, container and sign-in session, then re-scans the same routes with the
  # shared engine (BreakEscape::PayloadScan). It also runs the identity check: every item a sign-in
  # PC serves for a session must come from that PC's own contents or a profile the session's
  # identity admits, never another account's files.
  #
  # Seeding (plan 6a-2 "The opened state"):
  #   - every room id into unlockedRooms, every object/container id at any depth into unlockedObjects
  #   - every NPC id into encounteredNPCs
  #   - for each sign-in PC, one session per account the PC admits (pc_admits_account?), each fetched
  #     separately, so render_login_desktop serves that identity's admitted profiles
  #
  # Also exercised across the corpus (review R1 fixes):
  #   - foothold seeding and GET network per foothold (m3): every grantable foothold is seeded (as
  #     network_withholding_test.rb does) and GET network is fetched for each, so the joined-network
  #     body (psk, plant/implant rows) is scanned, not only the no-foothold view.
  #   - full feed reveal and POST friendface_phone (m2): feedRevealed is seeded for every NPC with a
  #     feed, so feedPosts carries every post; every declared Friendface phone is put in the
  #     inventory and POST friendface_phone is fetched for each, and both bodies are scanned.
  #   - item pickup through POST inventory (m1): every collectible (takeable object, container item,
  #     NPC itemsHeld item, declared grant) is picked up through the real route
  #     (validate_item_collectible -> canonical_inventory_item -> add_inventory_item!), then the
  #     served playerInventory is scanned. That proves what ships: client_inventory re-runs
  #     filter_inventory_for_client!, so an unfiltered stored copy is caught only if it also gets
  #     past that serve-time filter.
  #   - POST unlock's own roomData/contents are covered by the POST-unlock fixture test below (GET
  #     room and GET container over the unlocked state serve the same filtered subtrees).
  # A refusal in the opened state is recorded with its reason (not hard-failed) when a generic seeder
  # cannot satisfy a scenario's bespoke gating (a foothold, a proof, a switched-off host, a desktop
  # or share item that needs a session the seeder did not open); the hard assertion is on leak
  # findings, the scan's real guarantee.
  #
  # Runtime: the two corpus-wide tests (the corpus scan and the identity check) are tagged out of the
  # default `bin/rails test` run (they run only with RUN_OPENED_SCAN set). The full file runs 118-146 s
  # (the corpus scan renders all 181 templates, the identity check renders them again), which crosses
  # the plan's two-minute threshold under load, so the orchestrator runs it at each merge batch
  # (`RUN_OPENED_SCAN=1 bin/rails test test/models/break_escape/payload_scan_opened_state_test.rb`). The
  # mutation tests and fixtures below are fast and stay in the default run.
  class PayloadScanOpenedStateTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SS = BreakEscape::ScenarioSchema
    C  = BreakEscape::PayloadLeafClassifier
    PS = BreakEscape::PayloadScan

    EXCEPTIONS_PATH = File.expand_path('../../fixtures/files/payload_scan_opened_exceptions.json', __dir__)

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
      PlayerPreference.find_or_create_by!(player: @player) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end
    end

    # ── the opened-state corpus scan ──

    test 'opened-state corpus scan: no class 1, class 2 or unexempted class 4 leaf ships once everything is unlocked' do
      skip 'opened-state corpus scan: set RUN_OPENED_SCAN=1 (tagged out of the default run, runs at merge batches)' unless ENV['RUN_OPENED_SCAN']
      exceptions = load_exceptions
      used_exceptions = {}
      findings = []
      per_scenario = {}
      skipped = []
      refusals = Hash.new(0)

      scenario_templates.each do |scenario_path|
        name = File.basename(File.dirname(scenario_path))
        rel = "scenarios/#{name}/scenario.json.erb"
        data = render_template(scenario_path)
        if data.nil?
          skipped << name
          next
        end

        game = build_opened_game(data)
        scn_findings, scn_refusals = scan_opened_game(game, rel)
        per_scenario[name] = scn_findings.size
        scn_refusals.each { |k| refusals[k] += 1 }

        scn_findings.each do |f|
          covering = exceptions.find { |exc| exception_matches?(exc, f[:scenario], f[:route], f[:path]) }
          if covering
            Array(covering['paths']).each do |p|
              used_exceptions[[covering['scenario'], covering['route'], p]] = true if
                f[:path] == p || f[:path].start_with?("#{p}/") || f[:path].start_with?("#{p}[")
            end
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
          stale << "stale opened-state exception: #{exc['scenario']} #{exc['route']} #{path}" unless used_exceptions[key]
        end
      end

      report_scan(per_scenario, exceptions, skipped, refusals)

      messages = findings.map do |f|
        "#{f[:scenario]} | #{f[:route]} | #{f[:path]} | #{f[:klass]} | value=#{f[:value].inspect}"
      end
      assert_equal [], messages + stale, "opened-state payload scan findings:\n#{(messages + stale).join("\n")}"
    end

    # ── the identity check (plan 6a-2 "The identity check") ──

    test 'opened-state identity check: a sign-in PC serves only its own and the session identity\'s admitted items' do
      skip 'opened-state identity check: set RUN_OPENED_SCAN=1 (tagged out of the default run, runs at merge batches)' unless ENV['RUN_OPENED_SCAN']
      violations = []
      scenario_templates.each do |scenario_path|
        name = File.basename(File.dirname(scenario_path))
        data = render_template(scenario_path)
        next if data.nil?

        game = build_opened_game(data)
        violations.concat(identity_violations(game, "scenarios/#{name}/scenario.json.erb"))
      ensure
        game&.destroy
      end
      assert_equal [], violations, "identity-check violations:\n#{violations.join("\n")}"
    end

    # ── mutation tests: they prove the scan can fail (plan 6a-2 (a)-(d)) ──

    # (a) cryptexConfig.answer carrying the cryptex answer, with strip_lock_answers! bypassed: the
    # scan fails on the path check (class 1), naming the cryptexConfig.answer path.
    test 'mutation (a): a cryptexConfig.answer copy is caught as class 1 when strip_lock_answers! is bypassed' do
      data = render_one('test_unlock_gaps')
      skip 'test_unlock_gaps not renderable' if data.nil?
      cryptex = find_first_object(data) { |o| o['lockType'] == 'cryptex' && o['cryptexConfig'].is_a?(Hash) }
      skip 'no cryptex object in test_unlock_gaps' if cryptex.nil?
      cryptex['cryptexConfig']['answer'] = cryptex['requires']

      findings = []
      Game.stub(:strip_lock_answers!, ->(_obj) { }) do
        game = build_opened_game(data)
        findings, = scan_opened_game(game, 'scenarios/test_unlock_gaps/scenario.json.erb')
        game.destroy
      end
      answer_class1 = findings.select { |f| f[:klass] == :class1 && f[:path].end_with?('cryptexConfig/answer') }
      assert answer_class1.any?, "expected a class-1 cryptexConfig/answer finding, got:\n#{findings.map { |f| f[:path] }.join("\n")}"
    end

    # (b) the two requires/contents filters replaced by identity: a PIN door's requires path is
    # among the failures (the filters strip more, so inclusion, not sole failure, is asserted).
    test 'mutation (b): bypassing the requires filters ships a locked requires (class 1)' do
      data = render_one('m01_first_contact')
      skip 'm01 not renderable' if data.nil?

      findings = with_requires_filters_bypassed do
        game = build_opened_game(data)
        f, = scan_opened_game(game, 'scenarios/m01_first_contact/scenario.json.erb')
        game.destroy
        f
      end
      req = findings.select { |f| f[:klass] == :class1 && f[:path].end_with?('/requires') }
      assert req.any?, "expected a class-1 requires finding with the filters bypassed, got #{findings.size} findings"
    end

    # (c) login_desktop_contents replaced to add every profile: the identity check fails, naming an
    # item served to a session it does not belong to. The value check alone would not catch this.
    test 'mutation (c): a login desktop that serves every profile fails the identity check' do
      data = render_one('test_access_sessions')
      skip 'test_access_sessions not renderable' if data.nil?

      violations = with_login_desktop_leaking_all_profiles do
        game = build_opened_game(data)
        v = identity_violations(game, 'scenarios/test_access_sessions/scenario.json.erb')
        game.destroy
        v
      end
      assert violations.any?, 'expected an identity-check violation when every profile is served to every session'
    end

    # (d) the accountProfiles delete removed from the bootstrap: the bootstrap ships accountProfiles,
    # caught as class 1 on GET scenario.
    test 'mutation (d): keeping accountProfiles in the bootstrap is caught as class 1 on GET scenario' do
      data = render_one('test_access_sessions')
      skip 'test_access_sessions not renderable' if data.nil?

      findings = with_bootstrap_keeping_account_profiles do
        game = build_opened_game(data)
        f, = scan_opened_game(game, 'scenarios/test_access_sessions/scenario.json.erb')
        game.destroy
        f
      end
      ap = findings.select { |f| f[:route] == 'GET scenario' && f[:path].start_with?('/accountProfiles') }
      assert ap.any?, "expected a class-1 accountProfiles finding on GET scenario, got:\n#{findings.map { |f| "#{f[:route]} #{f[:path]}" }.first(20).join("\n")}"
    end

    # ── the POST-unlock container fixture (plan 6a-2 Tests) ──

    test 'POST unlock: a freshly unlocked container ships no locked answer in its contents' do
      data = {
        'startRoom' => 'start',
        'rooms' => {
          'start' => {
            'type' => 'office', 'locked' => false, 'connections' => {},
            'objects' => [
              { 'id' => 'safe', 'type' => 'safe', 'locked' => true, 'lockType' => 'pin', 'requires' => '4821',
                'contents' => [
                  { 'id' => 'inner_case', 'type' => 'case', 'locked' => true, 'lockType' => 'password',
                    'requires' => 'Satchel42', 'name' => 'Locked case' }
                ] }
            ]
          }
        }
      }
      game = Game.create!(mission: @mission, player: @player, scenario_data: data,
                          player_state: default_state('start'))
      game.prepare_scenario_data!
      game.reload

      post unlock_game_url(game), params: { targetType: 'object', targetId: 'safe', attempt: '4821', method: 'pin' }, as: :json
      assert_equal 200, response.status, "unlock refused: #{response.body}"
      body = parsed_body
      contents = body['contents'] || body.dig('object', 'contents') || body.dig('objectData', 'contents') || []
      refute_includes contents.to_json, 'Satchel42', 'the inner locked case must not ship its answer'
      answers = SecretLeaks.collect_answers(game.scenario_data)
      findings = []
      Array(contents).each_with_index do |obj, i|
        findings.concat(PS.scan_body(PS::CONTENTS_ITEM, obj, 'GET /container', "container/safe/contents[#{i}]",
                                     'fixture', answers, []))
      end
      assert_equal [], findings.map { |f| "#{f[:path]} #{f[:klass]}" }, 'POST unlock contents leaked a secret'
    ensure
      game&.destroy
    end

    # ── the feed fixture (plan 6a-2 Tests): a reply post scanned through feedPosts ──

    test 'feedPosts: a seeded feed with a reply post ships no secret under the post text allowance' do
      data = feed_fixture_scenario
      game = Game.create!(mission: @mission, player: @player, scenario_data: data,
                          player_state: default_state('office').merge(
                            'unlockedRooms' => %w[office], 'encounteredNPCs' => %w[ivy tomasz],
                            'feedRevealed' => {
                              'ivy' => { 'shown' => %w[ivy_vent], 'at' => 1 },
                              'tomasz' => { 'shown' => %w[tom_vent tom_re_ivy], 'at' => 2,
                                            'to' => { 'tom_re_ivy' => { 'post' => 'ivy_vent', 'npc' => 'ivy' } } }
                            }
                          ))
      game.prepare_scenario_data!
      game.reload

      get scenario_game_url(game), as: :json
      assert_equal 200, response.status
      feed = parsed_body['feedPosts']
      assert feed.is_a?(Hash) && feed.key?('tomasz'), "feedPosts did not carry the reply NPC: #{feed.inspect}"
      answers = SecretLeaks.collect_answers(game.scenario_data)
      findings = PS.scan_body(nil, { 'feedPosts' => feed }, 'GET scenario', '', 'fixture', answers, [])
      assert_equal [], findings.map { |f| "#{f[:path]} #{f[:klass]}" }, 'the seeded feed leaked a secret'
    ensure
      game&.destroy
    end

    # ── the feedPosts class-4 allowance (plan 6a-2 table; review R1 m2) ──

    test 'feedPosts allowance: a post display field may carry an answer, a stray key may not' do
      data = { 'rooms' => { 'r' => { 'objects' => [
        { 'id' => 'case', 'locked' => true, 'lockType' => 'password', 'requires' => 'Satchel42' }
      ] } } }
      answers = SecretLeaks.collect_answers(data)
      assert answers.any? { |a| a[:value] == 'Satchel42' }, 'fixture answer not collected'

      # The answer in a post's own display text (the allowance applies): no finding.
      allowed = { 'feedPosts' => { 'ivy' => { 'site' => 'friendface', 'person' => 'ivy', 'done' => true,
        'posts' => [{ 'index' => 0, 'post' => { 'id' => 'p1', 'text' => 'The passcode is Satchel42.' } }] } } }
      allowed_findings = PS.scan_body(nil, allowed, 'GET scenario', '', 'fixture', answers, [])
      assert_equal [], allowed_findings.map { |f| "#{f[:path]} #{f[:klass]}" },
                   'a post display field is allowed to carry an answer'

      # The same answer under a key the feed never serves (a stray field) is still caught as class 4.
      stray = { 'feedPosts' => { 'ivy' => { 'done' => true,
        'posts' => [{ 'index' => 0, 'post' => { 'id' => 'p1', 'text' => 'hi' }, 'leakedAnswer' => 'Satchel42' }] } } }
      stray_findings = PS.scan_body(nil, stray, 'GET scenario', '', 'fixture', answers, [])
      assert(stray_findings.any? { |f| f[:klass] == :class4 && f[:path].end_with?('leakedAnswer') },
             "expected a class-4 finding for the stray key, got:\n#{stray_findings.map { |f| "#{f[:path]} #{f[:klass]}" }.join("\n")}")
    end

    private

    def default_state(start)
      {
        'currentRoom' => start, 'unlockedRooms' => [start], 'unlockedObjects' => [],
        'inventory' => [], 'encounteredNPCs' => [], 'globalVariables' => {}, 'biometricSamples' => [],
        'biometricUnlocks' => [], 'bluetoothDevices' => [], 'notes' => [], 'health' => 100, 'sessions' => {}
      }
    end

    def scenario_templates
      only = ENV['PAYLOAD_SCAN_ONLY']
      paths = Dir.glob(File.expand_path('../../../scenarios/*/scenario.json.erb', __dir__)).sort
      if only && !only.empty?
        wanted = only.split(',').map(&:strip)
        paths = paths.select { |p| wanted.include?(File.basename(File.dirname(p))) }
      end
      paths
    end

    def render_template(path)
      srand(1)
      JSON.parse(BreakEscape::ScenarioBinding.render(File.read(path)))
    rescue StandardError
      nil
    ensure
      srand(Random.new_seed)
    end

    def render_one(name)
      path = Dir.glob(File.expand_path("../../../scenarios/#{name}/scenario.json.erb", __dir__)).first
      path && render_template(path)
    end

    # A game with every room reachable and every NPC encountered, but objects still LOCKED, as a
    # direct player_state write. Objects start locked on purpose: a locked object's `requires` ships
    # in the room payload (the legacy inert PCs), and unlocking it first would strip that surface.
    # unlock_all_objects! opens them for the container pass (plan 6a-2's progressive order).
    def build_opened_game(data)
      room_ids = (data['rooms'].is_a?(Hash) ? data['rooms'].keys : [])
      npc_ids = collect_npc_ids(data)
      state = default_state(data['startRoom'])
      state['unlockedRooms'] = room_ids
      state['unlockedObjects'] = []
      state['encounteredNPCs'] = npc_ids
      game = Game.create!(mission: @mission, player: @player, scenario_data: data, player_state: state)
      game.prepare_scenario_data!
      game.reload
      game
    end

    def unlock_all_objects!(game)
      game.player_state['unlockedObjects'] = collect_object_ids(game.scenario_data)
      game.save!(validate: false)
    end

    def collect_object_ids(data)
      ids = []
      walk_hashes(data['rooms']) { |h| ids << h['id'] if h['id'].is_a?(String) }
      ids.uniq
    end

    def collect_npc_ids(data)
      ids = []
      walk_hashes(data['rooms']) do |h|
        npcs = h['npcs']
        next unless npcs.is_a?(Array)

        npcs.each { |n| ids << n['id'] if n.is_a?(Hash) && n['id'].is_a?(String) }
      end
      ids.uniq
    end

    def walk_hashes(node, &block)
      case node
      when Hash
        yield node
        node.each_value { |v| walk_hashes(v, &block) }
      when Array
        node.each { |v| walk_hashes(v, &block) }
      end
    end

    # Scan one opened game's routes. Returns [findings, refusals], where refusals is a list of
    # "route id reason" strings (recorded, not failed; the hard assertion is on findings).
    def scan_opened_game(game, scenario_path)
      data = game.scenario_data
      answers = SecretLeaks.collect_answers(data)
      clues = SecretLeaks.acknowledged_clues(data)
      findings = []
      refusals = []

      # Seed the generator for the whole route scan so a route handler that picks a random variant
      # (a sign's textVariants, an ordering) renders the same body on every run, as the plan asks
      # (a class-2/class-4 match cannot come and go). Restored in the ensure.
      srand(1)

      get scenario_game_url(game), as: :json
      findings.concat(PS.scan_body(SS.root, parsed_body, 'GET scenario', '', scenario_path, answers, clues)) if response.status == 200

      room_ids = data['rooms'].is_a?(Hash) ? data['rooms'].keys : []
      room_ids.each do |room_id|
        get room_game_url(game, room_id: room_id), as: :json
        if response.status != 200
          refusals << "GET room/:id #{room_id} #{refusal_reason}"
          next
        end
        room = parsed_body['room']
        findings.concat(PS.scan_body(SS.at('#/definitions/room'), room, 'GET room/:id', "rooms/#{room_id}",
                                     scenario_path, answers, clues)) if room.is_a?(Hash)
      end

      # Open every object now, so the container pass reaches contents (the room pass above saw the
      # locked-object `requires` surface first).
      unlock_all_objects!(game)

      container_ids, login_ids = classify_objects(data)
      # Sign-in PCs are fetched per session in the login loop below; a plain fetch of one has no
      # session and is correctly refused, so leave it out of the plain container pass.
      (container_ids - login_ids).each do |cid|
        get "/break_escape/games/#{game.id}/container/#{cid}", as: :json
        if response.status != 200
          refusals << "GET container/:id #{cid} #{refusal_reason}"
          next
        end
        contents = parsed_body['contents']
        next unless contents.is_a?(Array)

        contents.each_with_index do |obj, i|
          findings.concat(PS.scan_body(PS::CONTENTS_ITEM, obj, 'GET /container', "container/#{cid}/contents[#{i}]",
                                       scenario_path, answers, clues))
        end
      end

      login_ids.each do |pid|
        get login_accounts_game_url(game), params: { pc_id: pid }
        findings.concat(PS.scan_body(nil, parsed_body, 'GET /login_accounts', "login_accounts/#{pid}",
                                     scenario_path, answers, clues)) if response.status == 200
        # Per admitted session: scan the PC desktop with that identity signed in.
        admitted_npc_ids(game, pid).each do |npc_id|
          seed_session(game, pid, npc_id)
          get "/break_escape/games/#{game.id}/container/#{pid}", as: :json
          if response.status != 200
            refusals << "GET container/:id #{pid}@#{npc_id} #{refusal_reason}"
            next
          end
          contents = parsed_body['contents']
          next unless contents.is_a?(Array)

          contents.each_with_index do |obj, i|
            findings.concat(PS.scan_body(PS::CONTENTS_ITEM, obj, 'GET /container', "container/#{pid}@#{npc_id}/contents[#{i}]",
                                         scenario_path, answers, clues))
          end
        end
        clear_sessions(game)
      end

      # Footholds (review R1 m3): seed every grantable foothold, then GET network for each, so the
      # joined-network body (psk, plant/implant rows) is scanned, not only the no-foothold view.
      foothold_ids = seed_all_footholds!(game)
      get network_game_url(game), as: :json
      findings.concat(PS.scan_body(nil, parsed_body, 'GET /network', 'network', scenario_path, answers, clues)) if response.status == 200
      foothold_ids.each do |fid|
        get network_game_url(game, foothold: fid), as: :json
        findings.concat(PS.scan_body(nil, parsed_body, 'GET /network', "network/#{fid}", scenario_path, answers, clues)) if response.status == 200
      end

      # Feeds (review R1 m2): reveal every NPC's feed and hold every declared Friendface phone, then
      # POST friendface_phone for each owned phone; the slice is scanned here and the whole feedPosts
      # block in the re-fetched bootstrap below.
      seed_full_feeds!(game)
      seed_friendface_phones!(game).each do |npc_id|
        post friendface_phone_game_url(game), params: { npc_id: npc_id, posts: 1 }, as: :json
        findings.concat(PS.scan_body(nil, parsed_body, 'POST /friendface_phone', "friendface/#{npc_id}", scenario_path, answers, clues)) if response.status == 200
      end

      # Item pickup (review R1 m1): pick up every collectible through POST inventory, the real path
      # (validate_item_collectible -> canonical_inventory_item -> add_inventory_item!), then scan
      # the served playerInventory below (what ships, after filter_inventory_for_client!).
      pickup_collectibles(game, refusals)

      # Re-fetch the bootstrap now the feeds are revealed and the collectibles are held, and scan the
      # two server-added blocks that were empty on the first fetch (the top level was scanned there).
      get scenario_game_url(game), as: :json
      if response.status == 200
        body = parsed_body
        if body['feedPosts'].is_a?(Hash) && !body['feedPosts'].empty?
          findings.concat(PS.scan_body(nil, { 'feedPosts' => body['feedPosts'] }, 'GET scenario', '', scenario_path, answers, clues))
        end
        if body['playerInventory'].is_a?(Array)
          findings.concat(PS.scan_body(PS::ITEM_ARRAY, body['playerInventory'], 'GET scenario', 'playerInventory', scenario_path, answers, clues))
        end
      end

      [findings, refusals]
    ensure
      srand(Random.new_seed)
    end

    def refusal_reason
      body = parsed_body
      body['reason'] || "status #{response.status}"
    rescue StandardError
      "status #{response.status}"
    end

    # Container and sign-in PC ids anywhere in the scenario (every room is unlocked).
    def classify_objects(data)
      containers = []
      logins = []
      walk_hashes(data['rooms']) do |obj|
        id = obj['id']
        next unless id.is_a?(String)

        containers << id if obj['contents'].is_a?(Array)
        if Game.login_pc?(obj)
          logins << id
          containers << id
        end
      end
      [containers.uniq, logins.uniq]
    end

    # NPC ids whose account the PC admits (pc_admits_account?), so render_login_desktop has an
    # identity to serve. The PC object is looked up from the game's scenario_data.
    def admitted_npc_ids(game, pc_id)
      info = game.find_login_pc(pc_id)
      return [] unless info

      pc = info[:object]
      collect_npc_ids(game.scenario_data).select do |npc_id|
        npc = game.send(:scenario_room_npc, npc_id)
        npc && game.pc_admits_account?(pc, npc)
      end
    end

    # Seed every grantable foothold (review R1 m3), as network_withholding_test.rb seeds one: one
    # per network jack, keyed jack_<id>, on the jack's network. Returns the foothold ids.
    def seed_all_footholds!(game)
      data = game.scenario_data
      jacks = BreakEscape::NetworkModel.jacks(data).select { |e| e[:network].is_a?(String) && e[:object]['id'].is_a?(String) }
      return [] if jacks.empty?

      footholds = {}
      gained = []
      jacks.each_with_index do |e, i|
        jid = e[:object]['id']
        footholds["jack_#{jid}"] = { 'via' => 'jack', 'network' => e[:network], 'source' => jid, 'device' => {}, 'seq' => i + 1 }
        gained << jid
      end
      game.player_state['footholds'] = footholds
      game.player_state['gainedFootholds'] = gained.uniq
      game.save!(validate: false)
      footholds.keys
    end

    # Reveal every NPC feed in full (review R1 m2): every post id in authored order into `shown`, so
    # feed_posts_for_client returns every post. A reply with a cross-NPC replyTo resolves its thread
    # through AccessWork.reply_target even with an empty `to`; a self-referential reply is dropped.
    def seed_full_feeds!(game)
      data = game.scenario_data
      store = {}
      now = Time.current.to_f
      collect_npc_ids(data).each do |npc_id|
        npc = game.send(:scenario_room_npc, npc_id)
        next unless npc && BreakEscape::AccessWork.feeds?(npc)

        ids = BreakEscape::AccessWork.feed_posts(npc).map { |p| p['id'] }
        next if ids.empty?

        seq = {}
        ids.each_with_index { |pid, i| seq[pid] = i + 1 }
        store[npc_id] = { 'shown' => ids, 'at' => now, 'seq' => seq, 'to' => {} }
      end
      return if store.empty?

      game.player_state['feedRevealed'] = store
      game.save!(validate: false)
    end

    # Put every declared Friendface phone in the inventory (review R1 m2), so POST friendface_phone
    # is served. Returns the owner NPC ids to open (the player's own phone has no owner, so no POST).
    def seed_friendface_phones!(game)
      declared = game.send(:declared_friendface_phones)
      return [] if declared.empty?

      inv = (game.player_state['inventory'] ||= [])
      owners = []
      declared.each do |phone|
        next unless phone.is_a?(Hash) && phone['id'].is_a?(String)
        next if inv.any? { |i| i.is_a?(Hash) && i['id'] == phone['id'] }

        inv << phone.deep_dup
        owner = phone['owner']
        owners << owner if owner.is_a?(String) && !owner.empty?
      end
      game.save!(validate: false)
      owners.uniq
    end

    # Pick up every collectible through the real POST inventory path (review R1 m1): takeable room
    # objects and container items (no source), NPC itemsHeld items (source_npc_id) and declared
    # grants. A refusal is recorded with its reason, never hard-failed (a desktop or share item the
    # generic seeder cannot claim).
    def pickup_collectibles(game, refusals)
      data = game.scenario_data
      collect_pickup_candidates(data).each do |cand|
        params = { action_type: 'add', item: cand[:item] }
        params[:source_npc_id] = cand[:npc_id] if cand[:npc_id]
        post inventory_game_url(game), params: params, as: :json
        ok = response.status == 200 && (parsed_body['success'] || parsed_body['already'])
        refusals << "POST inventory #{cand[:label]} #{refusal_reason}" unless ok
      end
      Array(game.declared_grants).each do |grant|
        item = grant.is_a?(Hash) ? grant['item'] : nil
        next unless item.is_a?(Hash)

        post inventory_game_url(game), params: { action_type: 'add', item: client_item_for(item) }, as: :json
        ok = response.status == 200 && (parsed_body['success'] || parsed_body['already'])
        refusals << "POST inventory grant #{item['id'] || item['name']} #{refusal_reason}" unless ok
      end
    end

    # Takeable room objects and container items (recursing contents), and NPC itemsHeld items named
    # by their NPC so validate_item_collectible's NPC rule passes.
    def collect_pickup_candidates(data)
      cands = []
      rooms = data['rooms']
      return cands unless rooms.is_a?(Hash)

      add_obj = nil
      add_obj = lambda do |obj|
        return unless obj.is_a?(Hash)

        if obj['takeable'] && (obj['id'].is_a?(String) || obj['name'].is_a?(String))
          cands << { item: client_item_for(obj), npc_id: nil, label: "takeable #{obj['id'] || obj['name']}" }
        end
        Array(obj['contents']).each { |c| add_obj.call(c) }
      end
      rooms.each_value do |room|
        next unless room.is_a?(Hash)

        Array(room['objects']).each { |o| add_obj.call(o) }
        Array(room['npcs']).each do |n|
          next unless n.is_a?(Hash) && n['id'].is_a?(String)

          Array(n['itemsHeld']).each do |it|
            next unless it.is_a?(Hash)

            cands << { item: client_item_for(it), npc_id: n['id'], label: "itemsHeld #{n['id']}/#{it['id'] || it['name']}" }
          end
        end
      end
      cands
    end

    def client_item_for(item)
      { type: item['type'], id: item['id'], name: item['name'] }.compact
    end

    def seed_session(game, pc_id, npc_id)
      game.player_state['sessions'] = { pc_id.to_s => { 'id' => npc_id } }
      game.save!(validate: false)
    end

    def clear_sessions(game)
      game.player_state['sessions'] = {}
      game.save!(validate: false)
    end

    # The identity check: every item in a sign-in PC's GET container answer, for each admitted
    # session, must have an id in login_desktop_contents(pc, npc) built from the unmutated data.
    def identity_violations(game, scenario_path)
      unlock_all_objects!(game)
      data = game.scenario_data
      _containers, login_ids = classify_objects(data)
      violations = []
      login_ids.each do |pid|
        info = game.find_login_pc(pid)
        next unless info

        pc = info[:object]
        admitted_npc_ids(game, pid).each do |npc_id|
          npc = game.send(:scenario_room_npc, npc_id)
          expected = expected_item_ids(game, pc, npc)
          seed_session(game, pid, npc_id)
          get "/break_escape/games/#{game.id}/container/#{pid}", as: :json
          if response.status == 200
            contents = parsed_body['contents']
            Array(contents).each do |item|
              iid = item.is_a?(Hash) ? item['id'] : nil
              next if iid.nil? # a stub folder with no id (a mapped share) is allowed
              next if expected.include?(iid.to_s)

              violations << "#{scenario_path} | PC #{pid} | session #{npc_id} | item #{iid} not in the admitted set"
            end
          end
          clear_sessions(game)
        end
      end
      violations
    end

    # The admitted set, built from the scenario data WITHOUT going through login_desktop_contents, so
    # mutation (c) (which replaces login_desktop_contents to serve every profile) is caught: the
    # PC's own contents, each profile Game#admitted_profiles returns for this identity, and the
    # mapped share stubs. Matches by item id at any depth.
    def expected_item_ids(game, pc, npc)
      items = Array(pc['contents']).select { |i| i.is_a?(Hash) }
      game.admitted_profiles(npc).each { |_pid, profile| items += Array(profile['contents']).select { |i| i.is_a?(Hash) } }
      items += game.send(:mapped_share_stubs, pc, npc)
      ids = []
      items.each { |it| walk_hashes(it) { |h| ids << h['id'] if h['id'].is_a?(String) } }
      ids.uniq.map(&:to_s)
    end

    # Mutation helpers. Instance methods called inside the request are replaced on their class for
    # the test (instance_method save / define_method restore in an ensure).
    def with_requires_filters_bypassed
      model_orig = Game.instance_method(:filter_requires_and_contents_recursive)
      ctrl_orig = GamesController.instance_method(:filter_requires_recursive)
      Game.define_method(:filter_requires_and_contents_recursive) { |obj| obj }
      GamesController.define_method(:filter_requires_recursive) { |obj| obj }
      yield
    ensure
      Game.define_method(:filter_requires_and_contents_recursive, model_orig)
      GamesController.define_method(:filter_requires_recursive, ctrl_orig)
    end

    def with_login_desktop_leaking_all_profiles
      orig = Game.instance_method(:login_desktop_contents)
      Game.define_method(:login_desktop_contents) do |pc, _npc|
        contents = Array(pc['contents']).select { |item| item.is_a?(Hash) }
        account_profiles.each_value { |profile| contents += Array(profile['contents']).select { |i| i.is_a?(Hash) } }
        contents
      end
      yield
    ensure
      Game.define_method(:login_desktop_contents, orig)
    end

    def with_bootstrap_keeping_account_profiles
      orig = Game.instance_method(:filtered_scenario_for_bootstrap)
      Game.define_method(:filtered_scenario_for_bootstrap) do
        filtered = orig.bind(self).call
        filtered['accountProfiles'] = scenario_data['accountProfiles'] if scenario_data['accountProfiles']
        filtered
      end
      yield
    ensure
      Game.define_method(:filtered_scenario_for_bootstrap, orig)
    end

    def find_first_object(data, &block)
      found = nil
      walk_hashes(data['rooms']) { |h| found ||= h if h['id'].is_a?(String) && block.call(h) }
      found
    end

    def social_need
      { 'social_media' => { 'decayPerMin' => 60, 'urgentAt' => 40, 'initial' => 50 } }
    end

    def feed_fixture_scenario
      {
        'startRoom' => 'office',
        'globalVariables' => { 'drive_down' => true },
        'social' => {
          'people' => [{ 'id' => 'ivy', 'forms' => { 'first' => 'Ivy', 'full' => 'Ivy Clarke' } },
                       { 'id' => 'tomasz', 'forms' => { 'first' => 'Tomasz' } }]
        },
        'rooms' => {
          'office' => {
            'type' => 'office', 'locked' => false, 'connections' => {},
            'npcs' => [
              { 'id' => 'ivy', 'displayName' => 'Ivy Clarke', 'needs' => social_need,
                'feed' => { 'site' => 'friendface', 'person' => 'ivy', 'order' => 'reactive_first', 'posts' => [
                  { 'id' => 'ivy_vent', 'text' => 'Shared drive down again.', 'when' => { 'global' => 'drive_down' } }
                ] } },
              { 'id' => 'tomasz', 'displayName' => 'Tomasz Nowak', 'needs' => social_need,
                'feed' => { 'site' => 'friendface', 'person' => 'tomasz', 'order' => 'reactive_first', 'posts' => [
                  { 'id' => 'tom_vent', 'text' => 'Shared drive is gone.', 'when' => { 'global' => 'drive_down' } },
                  { 'id' => 'tom_re_ivy', 'text' => 'Same here {name}, lost my morning.',
                    'replyTo' => 'ivy_vent', 'insteadOf' => 'tom_vent', 'when' => { 'global' => 'drive_down' } }
                ] } }
            ]
          }
        }
      }
    end

    def parsed_body
      JSON.parse(response.body)
    rescue StandardError
      {}
    end

    def load_exceptions
      return [] unless File.exist?(EXCEPTIONS_PATH)

      JSON.parse(File.read(EXCEPTIONS_PATH))
    end

    # An exception covers a finding when its scenario and route match and a listed path equals the
    # finding path or is a prefix of it (a listed object/container path covers the display leaves
    # under it, so a sign's textVariants index or an item's field need not be pinned).
    def exception_covers?(exceptions, finding)
      exceptions.any? { |exc| exception_matches?(exc, finding[:scenario], finding[:route], finding[:path]) }
    end

    def exception_matches?(exc, scenario, route, path)
      return false unless exc['scenario'] == scenario && exc['route'] == route

      Array(exc['paths']).any? { |p| path == p || path.start_with?("#{p}/") || path.start_with?("#{p}[") }
    end

    def report_scan(per_scenario, exceptions, skipped, refusals)
      flagged = per_scenario.reject { |_, n| n.zero? }
      puts "\n[opened-state scan] scenarios scanned: #{per_scenario.size}, with findings before exceptions: #{flagged.size}"
      flagged.sort.each { |name, n| puts "  #{name}: #{n}" }
      puts "  exceptions in file: #{exceptions.size}"
      puts "  refusals recorded (kind => count): #{refusals.sort_by { |_, n| -n }.first(12).to_h}" unless refusals.empty?
      puts "  skipped (render failed): #{skipped.join(', ')}" unless skipped.empty?
    end
  end
end
