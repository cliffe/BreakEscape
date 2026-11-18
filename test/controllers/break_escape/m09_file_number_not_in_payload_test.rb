require 'test_helper'
require 'json'
require 'break_escape/scenario_binding'

module BreakEscape
  # Release audit m09 #2: the H&L file number (the hl_box password) sat in the drop screen's
  # textVariants, which ship with the room at load. It is now spoken by HaX in the ledger_read
  # knot of m09_phone_agent0x99.ink, so no scenario or room payload carries it. The compiled ink
  # (GET /games/:id/ink) still holds it from game start: ink text is best effort under the cheat
  # policy (SCENARIO_FORMAT_HARDENING_PLAN.md, GET ink; server-held globals were dropped at q85).
  class M09FileNumberNotInPayloadTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    NUMBER = 'HL2015-0477'.freeze

    def scenario
      @scenario ||= JSON.parse(BreakEscape::ScenarioBinding.render(
        BreakEscape::Engine.root.join('scenarios', 'm09_digital_archaeology', 'scenario.json.erb').read, {}
      ))
    end

    def build_game
      rooms = scenario['rooms'].keys
      create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => scenario['startRoom'], 'unlockedRooms' => rooms }
      )
    end

    test 'the scenario still has the box that takes the number' do
      box = scenario['rooms']['open_stacks']['objects'].find { |o| o['id'] == 'hl_box' }
      assert_equal 'password', box['lockType']
      assert_equal NUMBER, box['requires']
    end

    test 'the game-start scenario payload does not carry the number' do
      get scenario_game_url(build_game), as: :json
      assert_response :success
      refute_includes response.body, NUMBER
    end

    test 'no room payload carries the number, the reading room included' do
      game = build_game
      scenario['rooms'].each_key do |room_id|
        get room_game_url(game, room_id: room_id), as: :json
        assert_response :success, "room #{room_id}"
        # The box's own contents are served only when it opens; its requires never ships.
        refute_includes response.body, NUMBER, "room #{room_id} payload"
      end
    end

    test 'the drop screen variants no longer write the number out' do
      reading = scenario['rooms']['reading_room']['objects'].to_json
      refute_includes reading, NUMBER
    end
  end
end
