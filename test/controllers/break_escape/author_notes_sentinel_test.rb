require 'test_helper'

module BreakEscape
  # Step 2b review R1 (orchestrator addition): a sentinel backstop that does not depend on the
  # route audit. `scenarios/test_author_notes/scenario.json` carries a "_" author note holding a
  # unique "SENTINEL-" value in every kind of block the schema lets a note sit in that a player
  # route can ship (rooms, objects, contents, NPCs, intel facts, feed posts, objectives, tasks,
  # the command board, items held, network and social blocks, phone, mail). This test plays the
  # main routes of that game and asserts no response body carries a sentinel value or a "_sentinel"
  # note key, while free data and "_" ids still ship. It fails before the feed/objectives strips.
  class AuthorNotesSentinelTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SCENARIO_PATH = Engine.root.join('scenarios', 'test_author_notes', 'scenario.json').freeze

    def setup
      @scenario = JSON.parse(File.read(SCENARIO_PATH))
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: @scenario,
        player_state: { 'currentRoom' => 'lobby',
                        'unlockedRooms' => %w[lobby vault _annex],
                        'unlockedObjects' => %w[crate folder],
                        'encounteredNPCs' => %w[guard jake] }
      )
    end

    # Every response body collected while the main routes are played.
    def play_main_routes
      bodies = {}
      capture = lambda do |name|
        assert_response :success, "#{name} did not return 200 (got #{response.status})"
        bodies[name] = response.body
      end

      get scenario_game_url(@game), as: :json
      capture.call('bootstrap')

      %w[lobby vault _annex].each do |room|
        get room_game_url(@game, room_id: room), as: :json
        capture.call("room/#{room}")
      end

      get "/break_escape/games/#{@game.id}/container/crate", as: :json
      capture.call('container/crate')

      # Feed: jake has a social_media need and a feed citing the jake_secret fact, which carries a
      # "_sentinelFact" note. Revealing the post ships the fact entry through feed_answer (the B1
      # route). The phone route serves the revealed posts too.
      post feed_post_game_url(@game), params: { npc_id: 'jake' }, as: :json
      capture.call('feed_post')
      post friendface_phone_game_url(@game), params: { posts: 1 }, as: :json
      capture.call('friendface_phone')

      get objectives_game_url(@game), as: :json
      capture.call('objectives')

      get capture_secrets_game_url(@game), as: :json
      capture.call('capture_secrets')

      get network_game_url(@game), as: :json
      capture.call('network')

      get scenario_game_url(@game), as: :json
      capture.call('bootstrap_inventory')

      put sync_state_game_url(@game), params: { playerState: {} }, as: :json
      capture.call('sync_state')

      bodies
    end

    test 'no main route ships a sentinel note value or a _sentinel note key' do
      bodies = play_main_routes
      bodies.each do |name, body|
        refute_includes body, 'SENTINEL', "#{name} shipped a sentinel note value"
        refute_includes body, '_sentinel', "#{name} shipped a _sentinel note key"
      end
    end

    test 'free data and _ ids still ship in the bootstrap' do
      get scenario_game_url(@game), as: :json
      assert_response :success
      body = response.body
      assert_includes body, 'FREE-GLOBAL-VALUE-555', 'a free (object-valued global) value must ship'
      assert_includes body, '_secretglobal', 'a "_" global id must ship'
      assert_includes body, '_annex', 'a room id starting with "_" must ship'
    end

    test 'the feed actually reveals the fact, so this route is exercised (guards the must-fail case)' do
      post feed_post_game_url(@game), params: { npc_id: 'jake' }, as: :json
      assert_response :success
      body = response.parsed_body
      assert_equal 'jake_post_1', body.dig('post', 'id'), 'the feed post must reveal for the sentinel test to bite'
      assert_equal 'jake_secret', body.dig('fact', 'id'), 'the cited intel fact must ship (stripped of its note)'
    end

    test 'GET /objectives ships the objective, so this route is exercised (guards the must-fail case)' do
      get objectives_game_url(@game), as: :json
      assert_response :success
      ids = (response.parsed_body['objectives'] || []).map { |a| a['aimId'] }
      assert_includes ids, 'aim_1', 'the objective must ship (stripped of its note) for the sentinel test to bite'
    end

    # Resolver-driven coverage: every "_" note the scenario carries is classified a note by the
    # schema resolver (not by a name list), and the fixture covers each required block kind. If a
    # future edit drops a block, this fails rather than silently narrowing the backstop.
    test 'the resolver confirms every seeded sentinel is a note and the required block kinds are covered' do
      note_keys = []
      walk = lambda do |val, node|
        case val
        when Hash
          val.each do |k, v|
            ks = k.to_s
            is_note = AuthorNotes.note?(node, ks)
            note_keys << ks if is_note && ks.start_with?('_sentinel')
            walk.call(v, ScenarioSchema.child(node, ks)) unless is_note
          end
        when Array
          inode = ScenarioSchema.item(node)
          val.each { |v| walk.call(v, inode) }
        end
      end
      walk.call(@scenario, ScenarioSchema.root)

      # One unique note key per required note-capable block kind the schema resolver admits a note
      # in and a player route can ship.
      required = {
        'room' => '_sentinelRoom', 'object' => '_sentinelObj', 'contents' => '_sentinelContents',
        'npc' => '_sentinelNpc', 'intel fact' => '_sentinelFact', 'feed post' => '_sentinelFeedPost',
        'objective' => '_sentinelAim', 'task' => '_sentinelTask', 'command board' => '_sentinelBoard',
        'items held' => '_sentinelHeld', 'start item' => '_sentinelStart', 'phone' => '_sentinelPhone',
        'network' => '_sentinelNet', 'wifi' => '_sentinelWifi', 'social' => '_sentinelSocial',
        'mail' => '_sentinelMail', 'policy' => '_sentinelPolicy', 'resource' => '_sentinelRes'
      }
      required.each do |kind, key|
        assert_includes note_keys, key, "no sentinel note resolved for block kind '#{kind}' (#{key})"
      end
      assert_operator note_keys.length, :>=, 18, 'expected at least 18 sentinel notes'
    end
  end
end
