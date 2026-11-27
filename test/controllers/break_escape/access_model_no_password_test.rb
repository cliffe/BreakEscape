require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # The no-password test (ACCESS_MODEL_PLAN.md section 6): GET /scenario, GET
  # /room/:id, a door POST /unlock, GET /capture_secrets (with no entry, and with a
  # forged entry for an NPC that has no capture route), GET /login_accounts and GET
  # /container/:id signed out. No response carries an NPC password, a sign-in PC's
  # contents or an account profile.
  class AccessModelNoPasswordTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    SECRETS = (AccessModelScenario::PASSWORDS + [AccessModelScenario::PC_LOCAL_MARKER, AccessModelScenario::PROFILE_MARKER]).freeze

    def build(player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: AccessModelScenario.scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }.merge(player_state)
      )
    end

    def assert_no_secrets(context)
      SECRETS.each { |secret| refute_includes response.body, secret, "#{context} leaks #{secret}" }
    end

    test 'GET /scenario carries no password, profile or sign-in PC contents' do
      build
      get scenario_game_url(@game), as: :json
      assert_response :success
      assert_no_secrets('/scenario')
      refute response.parsed_body.key?('accountProfiles')
      assert_equal 'corp_default', response.parsed_body['defaultPolicy']
    end

    test 'GET /room/:id carries no password and keeps the card' do
      build
      get room_game_url(@game, room_id: 'lobby'), as: :json
      assert_response :success
      assert_no_secrets('/room/lobby')
      assert_equal AccessModelScenario::LEN_CARD, response.parsed_body['room']['npcs'][0]['rfidCard']

      @game.unlock_room!('finance')
      get room_game_url(@game, room_id: 'finance'), as: :json
      assert_response :success
      assert_no_secrets('/room/finance')
      jake = response.parsed_body['room']['npcs'].find { |n| n['id'] == 'jake' }
      assert_equal AccessModelScenario::JAKE_CARD, jake['rfidCard']
      pc = response.parsed_body['room']['objects'].find { |o| o['id'] == 'jake_pc' }
      assert_equal true, pc['hasContents']
    end

    test 'a door unlock carries no password in its room data' do
      build
      post unlock_game_url(@game), params: { targetType: 'door', targetId: 'finance', attempt: '4321', method: 'pin' }, as: :json
      assert_response :success, response.body
      assert response.parsed_body['roomData']['npcs'].any?, 'the unlock returned the room data'
      assert_no_secrets('door /unlock')
    end

    # update_room no longer takes move_npc from a client (friendface phone code review R5 M1);
    # a server-side move still stores the NPC in npcs_added, so the withholding is still checked
    test 'an NPC moved between rooms is withheld in the room it joins' do
      build('unlockedRooms' => %w[lobby finance])
      assert @game.move_npc_to_room!('jake', 'finance', 'lobby')
      get room_game_url(@game, room_id: 'lobby'), as: :json
      assert_response :success
      assert response.parsed_body['room']['npcs'].any? { |n| n['id'] == 'jake' }, 'Jake joined the lobby'
      assert_no_secrets('/room/lobby after move_npc')
    end

    test 'GET /capture_secrets with no entry serves nothing' do
      build
      get capture_secrets_game_url(@game), as: :json
      assert_response :success
      assert_equal({ 'secrets' => {} }, response.parsed_body)
      assert_no_secrets('/capture_secrets, no entry')
    end

    test 'GET /capture_secrets with a forged entry for an NPC with no capture route serves nothing' do
      build('globalVariables' => { 'se_captures' => {
        'dana' => { 'targetId' => 'dana', 'kind' => 'credential', 'address' => 'dwhite', 'at' => 1 }
      } })
      get capture_secrets_game_url(@game), as: :json
      assert_response :success
      assert_equal({ 'secrets' => {} }, response.parsed_body)
      assert_no_secrets('/capture_secrets, forged entry')
    end

    test 'GET /login_accounts carries no password' do
      build('unlockedRooms' => %w[lobby finance])
      get login_accounts_game_url(@game), params: { pc_id: 'jake_pc' }
      assert_response :success
      assert_equal %w[jbrooks DWhite], response.parsed_body['loginAccounts'].map { |t| t['username'] }
      assert_no_secrets('/login_accounts')
    end

    test 'GET /container/:id signed out carries no password, PC contents or profile' do
      build('unlockedRooms' => %w[lobby finance], 'unlockedObjects' => %w[jake_pc jake_files_content_1])
      get "/break_escape/games/#{@game.id}/container/jake_pc", as: :json
      assert_response :forbidden
      assert_no_secrets('/container/jake_pc signed out')
      get "/break_escape/games/#{@game.id}/container/jake_files_content_1", as: :json
      assert_response :forbidden
      assert_no_secrets('/container/jake_files_content_1 signed out')
    end

    # Code review R1, M1: an unscoped object without contents that shares a name with a
    # folder under a sign-in PC (or with the PC itself) must not open the generic container
    # path to them.
    FOLDER_MARKER = 'PC-FOLDER-FILE-TEXT'.freeze

    def build_name_collision(lobby_names)
      data = AccessModelScenario.scenario
      data['rooms']['lobby']['objects'] = lobby_names.map { |name| { 'type' => 'notes', 'name' => name, 'text' => 'a note' } }
      pc = data['rooms']['finance']['objects'].find { |o| o['id'] == 'jake_pc' }
      pc['contents'] << { 'type' => 'folder', 'name' => 'Archive folder', 'locked' => false,
                          'contents' => [{ 'type' => 'text_file', 'name' => 'Old.txt', 'text' => FOLDER_MARKER }] }
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby finance] }
      )
    end

    test 'a name shared with a lobby note does not open a sign-in PC folder with no session' do
      build_name_collision(['Archive folder'])
      post unlock_game_url(@game), params: { targetType: 'object', targetId: 'Archive folder', method: 'unlocked' }, as: :json
      refute_includes response.body, FOLDER_MARKER, '/unlock by a colliding name leaks the PC folder'
      assert_no_secrets('/unlock Archive folder')
      get "/break_escape/games/#{@game.id}/container/#{ERB::Util.url_encode('Archive folder')}", as: :json
      assert response.status >= 400, "GET /container answered #{response.status}: #{response.body}"
      refute_includes response.body, FOLDER_MARKER, '/container by a colliding name leaks the PC folder'
    end

    test "a name shared with a lobby note does not open the sign-in PC's own contents with no session" do
      build_name_collision(["Jake's PC"])
      post unlock_game_url(@game), params: { targetType: 'object', targetId: "Jake's PC", method: 'unlocked' }, as: :json
      assert_no_secrets("/unlock Jake's PC")
      get "/break_escape/games/#{@game.id}/container/#{ERB::Util.url_encode("Jake's PC")}", as: :json
      assert response.status >= 400, "GET /container answered #{response.status}: #{response.body}"
      assert_no_secrets("/container Jake's PC")
    end

    test 'POST /unlock of a scoped folder with no session is refused and carries no contents' do
      build_name_collision([])
      post unlock_game_url(@game), params: { targetType: 'object', targetId: 'Archive folder', method: 'unlocked' }, as: :json
      assert response.status >= 400, "/unlock answered #{response.status}"
      refute_includes response.body, FOLDER_MARKER
      assert_no_secrets('/unlock scoped folder')
      refute_includes Array(@game.reload.player_state['unlockedObjects']), 'Archive folder'
    end

    test 'POST /inventory add of a sign-in PC file with no session is refused and carries no text' do
      build('unlockedRooms' => %w[lobby finance])
      post inventory_game_url(@game), params: { action_type: 'add',
                                                item: { type: 'text_file', name: 'Local.txt' } }, as: :json
      assert response.status >= 400, "/inventory answered #{response.status}"
      assert_no_secrets('/inventory add, no source PC')
      post inventory_game_url(@game), params: { action_type: 'add', source_pc_id: 'jake_pc', transfer: 'move',
                                                item: { type: 'text_file', name: 'Local.txt' } }, as: :json
      assert response.status >= 400, "/inventory answered #{response.status}"
      assert_no_secrets('/inventory add from jake_pc, no session')
      refute(Array(@game.reload.player_state['inventory']).any? { |i| i['name'] == 'Local.txt' })
    end

    test 'failed sign-ins carry no password' do
      build('unlockedRooms' => %w[lobby finance])
      [['jbrooks', 'wrong'], ['jbrooks', AccessModelScenario::JAKE_PASSWORD.downcase], ['nobody', 'x']].each do |username, password|
        post login_game_url(@game), params: { pc_id: 'jake_pc', username: username, password: password }, as: :json
        assert_response :unprocessable_entity
        assert_no_secrets("/login as #{username}")
      end
    end

    # Slice 9.2 C review R1, M2 (ACCESS_MODEL_SLICE_9_2_PLAN.md 9.2): a fixture NPC with work
    # needs, a frustration block, a workaround and a feed with a feed fact. No route the browser
    # can call carries the feed, a post's text, a feed fact's text or an object keyed by a feed
    # fact id with text before the server reveals it; after one /feed_post, the second post and
    # its fact are still nowhere.
    #
    # Review R2 M1: each route below answers 200 with the data it serves on success. Fay sits in
    # finance, behind the PIN door, and each pass starts with finance locked again, so the door
    # unlock answers with her room. The sign-in, the inventory add, the ink, the ease report, the
    # workaround and an object update all succeed; a server-side move takes Fay to the lobby
    # first, so GET /room/lobby serves the record the move stored.
    FEED_POSTS = ['Fay adopted a cat called Pickles today, so happy.', 'Fay ran the 2011 city marathon, still proud.'].freeze
    FEED_FACTS = { 'fay_cat' => 'Fay Ngata has a cat called Pickles.', 'fay_marathon' => 'Fay Ngata ran a marathon in 2011.' }.freeze
    FEED_STORY = 'test/fixtures/files/ink_line_walker/text_match_fixture.json'.freeze
    # The routes whose answer holds Fay's NPC record on success. GET /scenario strips every
    # room's NPCs (filtered_scenario_for_bootstrap), so its checks are the text and fact-key ones.
    FAY_ROUTES = ['POST /unlock door', 'GET /room/finance', 'GET /room/lobby'].freeze

    def build_feed
      data = AccessModelScenario.scenario
      data['social']['intelFacts'] = FEED_FACTS.to_h { |id, text| [id, { 'label' => id, 'subject' => 'fay', 'text' => text }] }
      data['social']['osint'] = { 'sites' => [{ 'id' => 'friendface', 'type' => 'social', 'name' => 'Friendface',
                                                'profiles' => [{ 'person' => 'fay', 'name' => 'Fay Ngata', 'posts' => [] }] }] }
      data['rooms']['lobby']['objects'] = [{ 'id' => 'club_flyer', 'type' => 'notes', 'name' => 'Running club flyer',
                                             'takeable' => true, 'text' => 'The club meets on Tuesdays.' }]
      data['rooms']['finance']['npcs'] << {
        'id' => 'fay', 'displayName' => 'Fay Ngata', 'npcType' => 'person', 'position' => { 'x' => 4, 'y' => 2 },
        'storyPath' => FEED_STORY,
        'needs' => { 'social_media' => { 'decayPerMin' => 60, 'urgentAt' => 40, 'initial' => 50 } },
        'workNeeds' => ['email'], 'frustration' => { 'perFail' => 20 },
        'workarounds' => [{ 'at' => 50, 'do' => 'emit', 'event' => 'fay_vented' }],
        'feed' => { 'site' => 'friendface', 'person' => 'fay', 'posts' => [
          { 'id' => 'fay_post_1', 'text' => FEED_POSTS[0], 'fact' => 'fay_cat', 'deliberate' => true },
          { 'id' => 'fay_post_2', 'text' => FEED_POSTS[1], 'fact' => 'fay_marathon' }
        ] }
      }
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby], 'encounteredNPCs' => %w[fay len],
                        # Fay at 60 with her workaround handed over, so its "done" is answered
                        'npcFrustration' => { 'fay' => { 'level' => 60, 'hands' => 1,
                                                         'handed' => { '0' => { 'hand' => 1, 'time' => 0 } } } } }
      )
    end

    # Finance locked again and Fay back in it, so a pass opens the door and moves her afresh
    def relock_finance!
      @game.reload
      @game.player_state['unlockedRooms'] = %w[lobby]
      @game.player_state['room_states'] = {}
      @game.save!
    end

    # One successful response, labelled, from every route that can carry NPC or feed data and the
    # ones next to them (review C R3 nit: not GET /network, sync_state or the other routes that
    # carry no NPC data, nor npc_workaround's prop_door merge). Each must answer 200: a route
    # that starts refusing fails here instead of passing the leak checks quietly.
    def every_route_body
      relock_finance!
      base = "/break_escape/games/#{@game.id}"
      calls = [
        ['POST /unlock door', -> { post unlock_game_url(@game), params: { targetType: 'door', targetId: 'finance', attempt: '4321', method: 'pin' }, as: :json }],
        ['GET /scenario', -> { get scenario_game_url(@game), as: :json }],
        ['GET /scenario_map', -> { get scenario_map_game_url(@game), as: :json }],
        ['GET /room/finance', -> { get room_game_url(@game, room_id: 'finance'), as: :json }],
        ['GET /ink', -> { get ink_game_url(@game), params: { npc: 'fay' } }],
        ['GET /objectives', -> { get objectives_game_url(@game), as: :json }],
        ['GET /capture_secrets', -> { get capture_secrets_game_url(@game), as: :json }],
        ['GET /login_accounts', -> { get login_accounts_game_url(@game), params: { pc_id: 'jake_pc' } }],
        ['POST /login', lambda {
          post login_game_url(@game), params: { pc_id: 'jake_pc', username: 'jbrooks', password: AccessModelScenario::JAKE_PASSWORD }, as: :json
        }],
        ['GET /container', -> { get "#{base}/container/jake_pc", as: :json }],
        ['POST /inventory', lambda {
          post inventory_game_url(@game), params: { action_type: 'add', item: { id: 'club_flyer', type: 'notes', name: 'Running club flyer' } }, as: :json
        }],
        ['POST /npc_frustration', lambda {
          post npc_frustration_game_url(@game), params: { reports: [{ npc_id: 'fay', event: 'ease', need: 'social_media' }] }, as: :json
        }],
        ['POST /npc_workaround', -> { post npc_workaround_game_url(@game), params: { npc_id: 'fay', index: 0, hand: 1 }, as: :json }],
        ['POST /update_room', lambda {
          post update_room_game_url(@game), params: { roomId: 'lobby', actionType: 'update_object_state',
                                                      data: { objectId: 'club_flyer', stateChanges: { opened: true } } }, as: :json
        }],
        # The move is server-side now (review R5 M1): it takes Fay to the lobby as before
        ['GET /room/lobby', lambda {
          @game.reload.move_npc_to_room!('fay', 'finance', 'lobby')
          get room_game_url(@game, room_id: 'lobby'), as: :json
        }]
      ]
      calls.map do |label, call|
        call.call
        assert_equal 200, response.status, "#{label} answered #{response.status}: #{response.body[0, 300]}"
        [label, response.body]
      end
    end

    # The routes that serve Fay's record on success do serve it, so the structural checks run
    def assert_fay_served(bodies, stage)
      bodies.to_h.slice(*FAY_ROUTES).each do |label, body|
        refute_empty fay_records(JSON.parse(body)), "#{stage}: #{label} serves no record for fay"
      end
      assert_equal FAY_ROUTES.sort, (bodies.map(&:first) & FAY_ROUTES).sort
      answers = JSON.parse(bodies.to_h['POST /npc_frustration'])['answers']
      assert_equal 'fay', answers[0]['npcId']
      refute answers[0]['refused'], "#{stage}: the ease report was refused"
    end

    def fay_records(value, found = [])
      case value
      when Hash
        found << value if value['id'] == 'fay'
        value.each_value { |v| fay_records(v, found) }
      when Array then value.each { |v| fay_records(v, found) }
      end
      found
    end

    def keyed_with_text(value, ids, found = [])
      case value
      when Hash
        value.each do |k, v|
          found << k if ids.include?(k) && v.is_a?(Hash) && v.key?('text')
          keyed_with_text(v, ids, found)
        end
      when Array then value.each { |v| keyed_with_text(v, ids, found) }
      end
      found
    end

    def assert_feed_withheld(bodies, texts, fact_ids, stage)
      bodies.each do |label, body|
        texts.each { |text| refute_includes body, text, "#{stage}: #{label} carries a feed text" }
        parsed = begin
          JSON.parse(body)
        rescue JSON::ParserError
          nil
        end
        next unless parsed

        assert_empty keyed_with_text(parsed, fact_ids), "#{stage}: #{label} keys a feed fact with its text"
        fay_records(parsed).each do |rec|
          %w[feed workNeeds frustration].each { |key| refute rec.key?(key), "#{stage}: #{label} ships fay's #{key}" }
        end
      end
    end

    test 'review C R1 M2: the feed, its posts and feed facts reach no route before the server reveals them' do
      build_feed
      bodies = every_route_body
      assert_equal 15, bodies.length
      assert_fay_served(bodies, 'before a post')
      assert(bodies.any? { |label, b| label == 'GET /room/finance' && b.include?('"hasFeed":true') }, 'the room says fay has a feed')
      assert_feed_withheld(bodies, FEED_POSTS + FEED_FACTS.values, FEED_FACTS.keys, 'before a post')
      assert_kind_of Hash, JSON.parse(bodies.to_h['GET /scenario']).dig('social', 'intelFacts'), 'intelFacts stays an object'

      post feed_post_game_url(@game), params: { npc_id: 'fay' }, as: :json
      assert_response :success
      assert_equal 'fay_post_1', response.parsed_body.dig('post', 'id')
      first = response.body
      later = every_route_body
      assert_fay_served(later, 'after one post')
      assert_includes later.to_h['GET /scenario'], FEED_POSTS[0], 'GET /scenario feedPosts carries the revealed post'
      assert_feed_withheld([['POST /feed_post', first]] + later, [FEED_POSTS[1], FEED_FACTS['fay_marathon']], ['fay_marathon'], 'after one post')
      assert_feed_withheld(later.reject { |label, _| label == 'GET /scenario' }, [FEED_POSTS[0], FEED_FACTS['fay_cat']], ['fay_cat'], 'after one post, outside its own routes')
    end

    test 'GET /capture_secrets serves the password of an account holder with a capture route once earned' do
      build('globalVariables' => { 'se_captures' => {
        'jake' => { 'targetId' => 'jake', 'kind' => 'credential', 'address' => 'jbrooks', 'at' => 1 }
      } })
      get capture_secrets_game_url(@game), as: :json
      assert_response :success
      assert_equal({ 'secrets' => { 'jake' => AccessModelScenario::JAKE_PASSWORD } }, response.parsed_body)
      refute_includes response.body, AccessModelScenario::DANA_PASSWORD
    end
  end
end
