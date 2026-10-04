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

    test 'filtered_scenario_for_bootstrap preserves lock requirements' do
      mission = break_escape_missions(:ceo_exfil)
      player = break_escape_demo_users(:test_user)

      game = Game.new(mission: mission, player: player, scenario_data: @scenario_data)
      game.save(validate: false)

      filtered = game.filtered_scenario_for_bootstrap

      locked_room = filtered["rooms"]["next_room"]

      # Keep lock data for server-side validation
      assert_equal true, locked_room["locked"]
      assert_equal "key", locked_room["lockType"]
      assert_equal "key123", locked_room["requires"]
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
        { 'id' => 'handler', 'npcType' => 'phone', 'spriteSheet' => 'female_spy_v2', 'phoneId' => 'player_phone' }
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
      assert_not_includes filtered['characterSprites'], 'female_spy_v2', 'phone NPCs have no world sprite'

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
  end
end
