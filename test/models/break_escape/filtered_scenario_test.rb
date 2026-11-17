require 'test_helper'

module BreakEscape
  class FilteredScenarioTest < ActiveSupport::TestCase
    setup do
      @scenario_data = {
        "scenario_brief" => "Test mission",
        "startRoom" => "start",
        "startItemsInInventory" => [
          { "type" => "phone", "name" => "Test Phone" }
        ],
        "rooms" => {
          "start" => {
            "type" => "room_office",
            "connections" => { "north" => "next_room" },
            "locked" => false,
            "objects" => [
              { "type" => "desk", "name" => "Desk", "takeable" => false }
            ],
            "npcs" => [
              { "id" => "npc1", "displayName" => "NPC One" }
            ]
          },
          "next_room" => {
            "type" => "room_server",
            "connections" => { "south" => "start" },
            "locked" => true,
            "lockType" => "key",
            "requires" => "key123",
            "objects" => [
              { "type" => "server", "name" => "Server", "takeable" => false }
            ]
          }
        }
      }
    end

    test 'filtered_scenario_for_bootstrap removes room contents' do
      # Create a game with custom scenario data, bypassing the generate callback
      mission = break_escape_missions(:ceo_exfil)
      player = break_escape_demo_users(:test_user)

      game = Game.new(
        mission: mission,
        player: player,
        scenario_data: @scenario_data
      )
      # Manually skip callback and save
      game.save(validate: false)

      filtered = game.filtered_scenario_for_bootstrap

      # Check top-level fields are preserved
      assert_equal "Test mission", filtered["scenario_brief"]
      assert_equal "start", filtered["startRoom"]
      assert filtered["startItemsInInventory"].present?

      # Check rooms structure exists
      assert filtered["rooms"].present?
      assert filtered["rooms"]["start"].present?
      assert filtered["rooms"]["next_room"].present?
    end

    test 'filtered_scenario_for_bootstrap preserves navigation structure' do
      mission = break_escape_missions(:ceo_exfil)
      player = break_escape_demo_users(:test_user)

      game = Game.new(mission: mission, player: player, scenario_data: @scenario_data)
      game.save(validate: false)

      filtered = game.filtered_scenario_for_bootstrap

      start_room = filtered["rooms"]["start"]

      # Keep connections for navigation
      assert_equal({ "north" => "next_room" }, start_room["connections"])

      # Keep type for room rendering
      assert_equal "room_office", start_room["type"]

      # Keep lock info for validation
      assert_equal false, start_room["locked"]
    end

    test 'filtered_scenario_for_bootstrap keeps a room chatBackground' do
      mission = break_escape_missions(:ceo_exfil)
      player = break_escape_demo_users(:test_user)
      data = @scenario_data.deep_dup
      data["rooms"]["next_room"]["chatBackground"] = "assets/backgrounds/rooms/server.png"

      game = Game.new(mission: mission, player: player, scenario_data: data)
      game.save(validate: false)

      filtered = game.filtered_scenario_for_bootstrap
      assert_equal "assets/backgrounds/rooms/server.png", filtered["rooms"]["next_room"]["chatBackground"]
      assert_not filtered["rooms"]["start"].key?("chatBackground")
    end

    test 'filtered_scenario_for_bootstrap keeps a room lockedHint' do
      # lockedHint is the door's "how to get the key" line. unlock-system.js appends it
      # to the locked-door toast, so it must survive the bootstrap filter (lab R3 F1):
      # the hint is authored on the room but never reached the client before.
      mission = break_escape_missions(:ceo_exfil)
      player = break_escape_demo_users(:test_user)
      data = @scenario_data.deep_dup
      data["rooms"]["next_room"]["lockedHint"] = "Collect the key from Ruth once your plan is signed off."

      game = Game.new(mission: mission, player: player, scenario_data: data)
      game.save(validate: false)

      filtered = game.filtered_scenario_for_bootstrap
      assert_equal "Collect the key from Ruth once your plan is signed off.",
                   filtered["rooms"]["next_room"]["lockedHint"]
      assert_not filtered["rooms"]["start"].key?("lockedHint")
    end

    test 'filtered_scenario_for_bootstrap removes objects and npcs' do
      mission = break_escape_missions(:ceo_exfil)
      player = break_escape_demo_users(:test_user)

      game = Game.new(mission: mission, player: player, scenario_data: @scenario_data)
      game.save(validate: false)

      filtered = game.filtered_scenario_for_bootstrap

      start_room = filtered["rooms"]["start"]

      # Objects and NPCs should be removed
      assert_nil start_room["objects"]
      assert_nil start_room["npcs"]
    end

    test 'filtered_scenario_for_bootstrap keeps the lock state but never the answer' do
      mission = break_escape_missions(:ceo_exfil)
      player = break_escape_demo_users(:test_user)

      game = Game.new(mission: mission, player: player, scenario_data: @scenario_data)
      game.save(validate: false)

      filtered = game.filtered_scenario_for_bootstrap

      locked_room = filtered["rooms"]["next_room"]

      # The client needs to know the door is locked and how; the server validates against its own
      # scenario_data, so the answer itself never leaves this method (hardening step 3).
      assert_equal true, locked_room["locked"]
      assert_equal "key", locked_room["lockType"]
      assert_nil locked_room["requires"]
      refute_includes filtered.to_json, "key123"
    end

    test 'filtered_scenario_for_bootstrap gives a PIN room its pad length, drops the PIN, keeps an rfid card ref' do
      data = @scenario_data.deep_dup
      data['rooms']['next_room'].merge!('lockType' => 'pin', 'requires' => '48213')
      data['rooms']['card_room'] = { 'type' => 'room_office', 'connections' => {}, 'locked' => true,
                                     'lockType' => 'rfid', 'requires' => ['staff_badge'] }
      game = Game.new(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                      scenario_data: data)
      game.save(validate: false)

      rooms = game.filtered_scenario_for_bootstrap['rooms']
      assert_nil rooms['next_room']['requires']
      assert_equal 5, rooms['next_room']['pinLength']
      assert_equal ['staff_badge'], rooms['card_room']['requires']
      refute_includes game.filtered_scenario_for_bootstrap.to_json, '48213'
    end

    # ─── targetFlags security tests ──────────────────────────────────────────

    OBJECTIVES_WITH_FLAGS = [
      {
        "aimId"  => "capture_flag",
        "title"  => "Capture the Flag",
        "tasks"  => [
          {
            "taskId"      => "submit_flag_1",
            "type"        => "submit_flags",
            "title"       => "Submit the CTF flag",
            "targetFlags" => ["FLAG{s3cr3t_v4lu3}", "FLAG{4n0th3r_s3cr3t}"]
          },
          {
            "taskId"     => "visit_server",
            "type"       => "enter_room",
            "title"      => "Enter the server room",
            "targetRoom" => "next_room"
          }
        ]
      }
    ].freeze

    test 'filtered_scenario_for_bootstrap strips targetFlags from objectives' do
      mission = break_escape_missions(:ceo_exfil)
      player  = break_escape_demo_users(:test_user)
      data    = @scenario_data.merge("objectives" => OBJECTIVES_WITH_FLAGS)

      game = Game.new(mission: mission, player: player, scenario_data: data)
      game.save(validate: false)

      filtered = game.filtered_scenario_for_bootstrap

      assert filtered["objectives"].present?, "Objectives should still be present"
      filtered["objectives"].each do |aim|
        aim["tasks"]&.each do |task|
          assert_nil task["targetFlags"],
            "targetFlags must be stripped from client-facing scenario (task: #{task['taskId']})"
        end
      end
    end

    test 'filtered_scenario_for_bootstrap preserves objective structure without targetFlags' do
      mission = break_escape_missions(:ceo_exfil)
      player  = break_escape_demo_users(:test_user)
      data    = @scenario_data.merge("objectives" => OBJECTIVES_WITH_FLAGS)

      game = Game.new(mission: mission, player: player, scenario_data: data)
      game.save(validate: false)

      filtered   = game.filtered_scenario_for_bootstrap
      aim        = filtered["objectives"].first
      flag_task  = aim["tasks"].find { |t| t["taskId"] == "submit_flag_1" }
      enter_task = aim["tasks"].find { |t| t["taskId"] == "visit_server" }

      assert_equal "capture_flag",          aim["aimId"]
      assert_equal "Capture the Flag",      aim["title"]
      assert_equal "submit_flags",          flag_task["type"]
      assert_equal "Submit the CTF flag",   flag_task["title"]
      assert_nil   flag_task["targetFlags"], "targetFlags removed"
      assert_equal "next_room",             enter_task["targetRoom"]
    end

    test 'filtered_scenario_for_bootstrap does not mutate the stored scenario_data' do
      mission = break_escape_missions(:ceo_exfil)
      player  = break_escape_demo_users(:test_user)
      data    = @scenario_data.merge("objectives" => OBJECTIVES_WITH_FLAGS)

      game = Game.new(mission: mission, player: player, scenario_data: data)
      game.save(validate: false)

      game.filtered_scenario_for_bootstrap

      # Original stored objectives must retain targetFlags for server-side validation
      original_task = game.scenario_data["objectives"].first["tasks"].first
      assert_equal ["FLAG{s3cr3t_v4lu3}", "FLAG{4n0th3r_s3cr3t}"],
        original_task["targetFlags"],
        "Stored scenario_data must not be mutated — server needs targetFlags for validation"
    end

    test 'objectives_state strips targetFlags' do
      mission = break_escape_missions(:ceo_exfil)
      player  = break_escape_demo_users(:test_user)
      data    = @scenario_data.merge("objectives" => OBJECTIVES_WITH_FLAGS)

      game = Game.new(mission: mission, player: player, scenario_data: data)
      game.save(validate: false)

      state = game.objectives_state
      assert state["objectives"].present?
      state["objectives"].each do |aim|
        aim["tasks"]&.each do |task|
          assert_nil task["targetFlags"],
            "targetFlags must be stripped from objectives_state (task: #{task['taskId']})"
        end
      end
    end

    test 'objectives_state does not mutate stored scenario_data' do
      mission = break_escape_missions(:ceo_exfil)
      player  = break_escape_demo_users(:test_user)
      data    = @scenario_data.merge("objectives" => OBJECTIVES_WITH_FLAGS)

      game = Game.new(mission: mission, player: player, scenario_data: data)
      game.save(validate: false)

      game.objectives_state

      original_task = game.scenario_data["objectives"].first["tasks"].first
      assert_equal ["FLAG{s3cr3t_v4lu3}", "FLAG{4n0th3r_s3cr3t}"],
        original_task["targetFlags"],
        "objectives_state must not mutate stored scenario_data"
    end

    test 'filtered_scenario_for_bootstrap does not modify original' do
      mission = break_escape_missions(:ceo_exfil)
      player = break_escape_demo_users(:test_user)

      game = Game.new(mission: mission, player: player, scenario_data: @scenario_data)
      game.save(validate: false)

      original_rooms = game.scenario_data["rooms"].keys
      filtered = game.filtered_scenario_for_bootstrap

      # Original should still have all data
      assert game.scenario_data["rooms"]["start"]["objects"].present?
      assert game.scenario_data["rooms"]["start"]["npcs"].present?

      # Filtered should not
      assert_nil filtered["rooms"]["start"]["objects"]
      assert_nil filtered["rooms"]["start"]["npcs"]
    end

    # ── Flag-answer leak guard ──────────────────────────────────────────────
    #
    # Flag values are the answers. They are validated server-side, and the
    # client only ever needs a count. A regression here hands every player the
    # solutions via DevTools, silently — which is exactly what happened when
    # flag-station objects carried their own `flags` array into lazily-loaded
    # room payloads. These tests fail loudly if any client-facing payload ever
    # carries a flag value again.

    FLAG_VALUE_PATTERN = /flag\{[^}]*\}/i.freeze

    def game_with_flag_scenario
      scenario = @scenario_data.deep_dup
      scenario['flags'] = {
        'target_vm' => { 'flag_1' => 'flag{alpha_secret}', 'flag_2' => 'flag{beta_secret}' }
      }
      scenario['rooms']['next_room']['objects'] << {
        'type' => 'flag-station',
        'id' => 'dropsite',
        'acceptsVms' => ['target_vm'],
        'flags' => ['flag{alpha_secret}', 'target_vm:flag_2'],
        'hintOnlyFlags' => { 'flag{alpha_secret}' => 'Used elsewhere' }
      }
      scenario['rooms']['next_room']['npcs'] = [
        { 'id' => 'courier', 'displayName' => 'Courier',
          'itemsHeld' => [
            { 'type' => 'launch-device', 'id' => 'held_device',
              'flags' => ['flag{beta_secret}'] }
          ] }
      ]

      game = Game.new(mission: break_escape_missions(:ceo_exfil),
                      player: break_escape_demo_users(:test_user),
                      scenario_data: scenario)
      game.save(validate: false)
      game
    end

    test 'bootstrap payload contains no flag values' do
      game = game_with_flag_scenario
      assert_no_match FLAG_VALUE_PATTERN, game.filtered_scenario_for_bootstrap.to_json
    end

    test 'room payloads contain no flag values, including NPC-held stations' do
      game = game_with_flag_scenario

      game.scenario_data['rooms'].each_key do |room_id|
        json = game.send(:filtered_room_data, room_id).to_json
        assert_no_match FLAG_VALUE_PATTERN, json,
                        "room '#{room_id}' leaked a flag value to the client"
      end
    end

    test 'flag stations expose a count instead of the flag values' do
      game = game_with_flag_scenario
      room = game.send(:filtered_room_data, 'next_room')

      station = room['objects'].find { |o| o['type'] == 'flag-station' }
      assert station, 'flag-station should still be present'
      assert_nil station['flags'], 'flag values must not reach the client'
      assert_equal 2, station['flagCount'], 'client needs the count for its UI'
      assert_nil station['hintOnlyFlags'], 'hint-only flags are server-side only'

      # Non-secret fields the client genuinely uses must survive.
      assert_equal ['target_vm'], station['acceptsVms']
      assert_equal 'dropsite', station['id']
    end

    test 'characterSprites lists person and both NPC sheets and the player sheet once each' do
      @scenario_data['player'] = { 'id' => 'player', 'spriteSheet' => 'female_hacker_hood_v2' }
      @scenario_data['rooms']['start']['npcs'] = [
        { 'id' => 'guard', 'npcType' => 'person', 'spriteSheet' => 'male_security_guard_v2', 'storyPath' => 'secret.json' },
        { 'id' => 'guard2', 'npcType' => 'person', 'spriteSheet' => 'male_security_guard_v2' },
        { 'id' => 'default_sprite', 'npcType' => 'person' },
        { 'id' => 'handler', 'npcType' => 'phone', 'spriteSheet' => 'agent_hax', 'phoneId' => 'player_phone' }
      ]
      @scenario_data['rooms']['next_room']['npcs'] = [
        { 'id' => 'manager', 'npcType' => 'both', 'spriteSheet' => 'female_office_worker_v2' },
        { 'id' => 'patient', 'npcType' => 'person', 'spriteSheet' => 'bed_ms_chen' },
        { 'id' => 'player_double', 'npcType' => 'person', 'spriteSheet' => 'female_hacker_hood_v2' }
      ]
      game = Game.new(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                      scenario_data: @scenario_data)
      game.save(validate: false)

      filtered = game.filtered_scenario_for_bootstrap

      assert_equal %w[male_security_guard_v2 hacker female_office_worker_v2 bed_ms_chen female_hacker_hood_v2],
                   filtered['characterSprites']
      assert_not_includes filtered['characterSprites'], 'agent_hax', 'phone NPCs have no world sprite'

      # Only the keys reach the client: rooms still carry no NPC data at all.
      filtered['rooms'].each do |room_id, room|
        assert_nil room['npcs'], "room '#{room_id}' leaked NPCs into the bootstrap payload"
      end
      json = filtered.to_json
      %w[guard handler manager secret.json player_phone].each do |npc_detail|
        assert_no_match(/"#{Regexp.escape(npc_detail)}"/, json, "bootstrap payload leaked '#{npc_detail}'")
      end
    end

    test 'characterSprites is empty without sprite NPCs or a player sheet' do
      game = Game.new(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                      scenario_data: @scenario_data)
      game.save(validate: false)

      # The setup's only NPC has no npcType, so it gets no world sprite.
      assert_equal [], game.filtered_scenario_for_bootstrap['characterSprites']
    end

    test 'NPC-held flag devices are filtered too' do
      game = game_with_flag_scenario
      room = game.send(:filtered_room_data, 'next_room')

      held = room['npcs'].first['itemsHeld'].first
      assert_nil held['flags'], 'NPC-held device leaked flag values'
      assert_equal 1, held['flagCount']
    end

    test 'password room keeps its pad options but loses the answer' do
      scenario = @scenario_data.deep_dup
      scenario['rooms']['next_room'].merge!(
        'locked' => true, 'lockType' => 'password', 'requires' => 'hunter2',
        'maxAttempts' => 6, 'passwordHint' => 'A pet', 'showHint' => true,
        'postitNote' => 'Pet name', 'showPostit' => true, 'showKeyboard' => true
      )
      game = Game.new(mission: break_escape_missions(:ceo_exfil),
                      player: break_escape_demo_users(:test_user),
                      scenario_data: scenario)
      game.save(validate: false)

      room = game.send(:filtered_room_data, 'next_room')
      assert_nil room['requires'], 'the answer must not reach the client'
      assert_equal 6, room['maxAttempts']
      assert_equal 'A pet', room['passwordHint']
      assert_equal true, room['showHint']
      assert_equal 'Pet name', room['postitNote']
      assert_equal true, room['showPostit']
      assert_equal true, room['showKeyboard']
    end

    test 'bootstrap keeps door pad options for locked rooms and drops the answer' do
      scenario = @scenario_data.deep_dup
      scenario['rooms']['next_room'].merge!(
        'locked' => true, 'lockType' => 'password', 'requires' => 'hunter2',
        'maxAttempts' => 6, 'passwordHint' => 'A pet', 'showHint' => true, 'showKeyboard' => true
      )
      game = Game.new(mission: break_escape_missions(:ceo_exfil),
                      player: break_escape_demo_users(:test_user),
                      scenario_data: scenario)
      game.save(validate: false)

      room = game.filtered_scenario_for_bootstrap['rooms']['next_room']
      assert_equal 6, room['maxAttempts']
      assert_equal 'A pet', room['passwordHint']
      assert_equal true, room['showHint']
      assert_equal true, room['showKeyboard']
      # `requires` stays in this layer; the controller strips it before sending
      assert_nil room['objects'], 'contents are still lazy-loaded'
    end

    # Review R2 m1: the model's bootstrap strips a declared grant's contents itself, not
    # only the controller, so every caller of the model method is safe.
    test 'filtered_scenario_for_bootstrap strips a timer grant contents' do
      scenario = @scenario_data.deep_dup
      scenario['timers'] = [
        { 'id' => 'drop', 'delay' => 1000, 'actions' => [
          { 'type' => 'give_item', 'item' => {
            'type' => 'text_file', 'id' => 'secret_file', 'name' => 'Session',
            'contents' => [{ 'type' => 'notes', 'name' => 'share.txt', 'text' => 'SECRET-HOST-01' }]
          } }
        ] }
      ]
      game = Game.new(mission: break_escape_missions(:ceo_exfil),
                      player: break_escape_demo_users(:test_user),
                      scenario_data: scenario)
      game.save(validate: false)

      item = game.filtered_scenario_for_bootstrap['timers'][0]['actions'][0]['item']
      assert_equal true, item['hasContents']
      assert_nil item['contents']
      refute_includes game.filtered_scenario_for_bootstrap.to_json, 'SECRET-HOST-01'
      assert game.scenario_data['timers'][0]['actions'][0]['item'].key?('contents'),
             'the stored scenario keeps the contents'
    end

    # ─── lock-answer strip parity (6a-2 deferred minors) ─────────────────────
    # The requires-strip rule lives in three places folded onto
    # Game::CARD_REFERENCE_LOCK_TYPES: Game#filter_inventory_for_client!,
    # Game#filter_requires_and_contents_recursive and
    # GamesController#filter_requires_recursive. These prove a nil lockType, the
    # filters' idempotency, and that the model filter and the controller filter
    # agree on `requires` for every lock kind.

    LOCK_KIND_REQUIRES = {
      'pin' => '48213', 'password' => 'hunter2', 'key' => 'brass_key',
      'rfid' => ['staff_badge'], 'biometric' => 'Mrs Moo', 'bluetooth' => '00:11:22:33:44:55'
    }.freeze
    REQUIRES_KEPT_KINDS = BreakEscape::Game::CARD_REFERENCE_LOCK_TYPES # rfid, biometric, bluetooth

    def filter_game
      Game.new(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user))
    end

    def controller_filter(obj)
      copy = obj.deep_dup
      BreakEscape::GamesController.new.send(:filter_requires_recursive, copy)
      copy
    end

    def model_filter(obj)
      copy = obj.deep_dup
      filter_game.send(:filter_requires_and_contents_recursive, copy)
      copy
    end

    test 'a nil lockType keeps requires in both the model filter and the controller filter' do
      obj = { 'id' => 'legacy_pc', 'type' => 'pc', 'locked' => true, 'requires' => 'password' }
      assert_equal 'password', model_filter(obj)['requires'],
                   'no lockType: the model filter leaves the inert requires in place'
      assert_equal 'password', controller_filter(obj)['requires'],
                   'no lockType: the controller filter leaves the inert requires in place'
    end

    test 'the model filter and the controller filter agree on requires for every lock kind' do
      LOCK_KIND_REQUIRES.each do |kind, value|
        obj = { 'id' => "lock_#{kind}", 'locked' => true, 'lockType' => kind, 'requires' => value }
        model_req = model_filter(obj)['requires']
        ctrl_req  = controller_filter(obj)['requires']
        assert_equal model_req, ctrl_req, "model and controller disagree on requires for #{kind}"
        if REQUIRES_KEPT_KINDS.include?(kind)
          assert_equal value, model_req, "#{kind} is a card-reference kind: requires is kept"
        else
          assert_nil model_req, "#{kind} is an answer kind: requires is stripped"
        end
      end
    end

    test 'the controller requires filter is idempotent' do
      LOCK_KIND_REQUIRES.each do |kind, value|
        obj = { 'id' => "lock_#{kind}", 'locked' => true, 'lockType' => kind, 'requires' => value }
        once = controller_filter(obj)
        twice = controller_filter(once)
        assert_equal once, twice, "controller filter is not idempotent for #{kind}"
      end
    end

    test 'filtered_scenario_for_bootstrap is idempotent over its own room payload' do
      data = @scenario_data.deep_dup
      data['rooms']['next_room'].merge!('lockType' => 'pin', 'requires' => '48213')
      game = Game.new(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                      scenario_data: data)
      game.save(validate: false)

      once = game.filtered_scenario_for_bootstrap
      twice = game.filtered_scenario_for_bootstrap
      assert_equal once, twice, 'two bootstrap filters of the same game give the same output'
      # Feeding the bootstrap room payload back through the controller filter changes nothing.
      room = once['rooms']['next_room']
      assert_equal room, controller_filter(room),
                   'the controller filter is a no-op on an already-filtered bootstrap room'
    end
  end
end
