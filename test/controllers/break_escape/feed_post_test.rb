require 'test_helper'
require_relative '../../support/access_social_scenario'

module BreakEscape
  # Access model slice 9.2 step C-1 (ACCESS_MODEL_SLICE_9_2_PLAN.md 8.3, 9.1, 9.2 and 9.4):
  # POST /feed_post, the feed facts withheld from the bootstrap, feedPosts on a load, hasFeed in
  # room data and the no-exposure checks for posts and their facts.
  class FeedPostTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    FLOOR = (0.9 * 60) - 3 # jake's period is 60 s (plan 8.3)

    def build(scenario: AccessSocialScenario.scenario, player_state: {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[jake lena omar nia] }.merge(player_state)
      )
    end

    def ask(npc_id)
      post feed_post_game_url(@game), params: { npc_id: npc_id }, as: :json
      response.parsed_body
    end

    def scenario_body
      get scenario_game_url(@game), as: :json
      assert_response :success
      response.body
    end

    def room_body(room = 'office')
      get room_game_url(@game, room_id: room), as: :json
      assert_response :success
      response.body
    end

    # Every object anywhere in a JSON value keyed by one of `ids` and holding a `text` key
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

    test 'posts come out in order, one per call, each with its fact entry; done with the last and after it' do
      build
      t = Time.current
      a = travel_to(t) { ask('jake') }
      assert_equal 0, a['index']
      assert_equal({ 'id' => 'jake_post_1', 'text' => AccessSocialScenario::POSTS[0], 'fact' => 'jake_pet_name', 'date' => 'Monday' }, a['post'])
      assert_equal 'jake_pet_name', a.dig('fact', 'id')
      assert_equal AccessSocialScenario::FACT_TEXTS['jake_pet_name'], a.dig('fact', 'entry', 'text')
      assert_equal %w[friendface jake], [a['site'], a['person']]
      assert_equal false, a['done']
      b = travel_to(t + FLOOR + 1) { ask('jake') }
      assert_equal [1, 'jake_post_2', 'jake_wedding_year'], [b['index'], b.dig('post', 'id'), b.dig('fact', 'id')]
      c = travel_to(t + (2 * (FLOOR + 1))) { ask('jake') }
      assert_equal [2, 'jake_post_3', nil, true], [c['index'], c.dig('post', 'id'), c['fact'], c['done']]
      d = travel_to(t + (3 * (FLOOR + 1))) { ask('jake') }
      assert_equal({ 'npcId' => 'jake', 'post' => nil, 'done' => true }, d)
      assert_equal %w[jake_post_1 jake_post_2 jake_post_3], @game.reload.player_state.dig('feedRevealed', 'jake', 'shown')
    end

    test 'the pace floor: a second post too soon is refused and writes nothing' do
      build
      t = Time.current
      travel_to(t) { ask('jake') }
      at = @game.reload.player_state.dig('feedRevealed', 'jake', 'at')
      a = travel_to(t + FLOOR - 2) { ask('jake') }
      assert_nil a['post']
      assert_equal false, a['done']
      assert_equal true, a['tooSoon']
      assert_equal 1, a['revealed'], 'the posts out so far'
      assert_equal({ 'shown' => ['jake_post_1'], 'at' => at }, @game.reload.player_state.dig('feedRevealed', 'jake'))
      b = travel_to(t + FLOOR + 1) { ask('jake') }
      assert_equal 'jake_post_2', b.dig('post', 'id')
    end

    test 'an NPC with no need, no feed, not met or unknown gets nothing' do
      build(player_state: { 'encounteredNPCs' => %w[omar nia] })
      assert_equal({ 'npcId' => 'omar', 'post' => nil, 'done' => true }, ask('omar'))
      assert_equal({ 'npcId' => 'nia', 'post' => nil, 'done' => true }, ask('nia'))
      ask('jake')
      assert_response :forbidden
      ask('nobody')
      assert_response :forbidden
      assert_equal({}, @game.reload.player_state['feedRevealed'])
    end

    test 'a tampered npc_id (a list, a hash, a number) is refused and writes nothing' do
      build
      [['jake'], { 'id' => 'jake' }, 7].each do |bad|
        post feed_post_game_url(@game), params: { npc_id: bad }, as: :json
        assert_response :forbidden
      end
      assert_equal({}, @game.reload.player_state['feedRevealed'])
    end

    test 'the bootstrap holds every ordinary fact and no feed fact, and intelFacts stays an object' do
      build
      body = JSON.parse(scenario_body)
      facts = body.dig('social', 'intelFacts')
      assert_kind_of Hash, facts
      assert_equal ['jake_office'], facts.keys
      assert_equal({}, body['feedPosts'])
    end

    test 'only feed facts are withheld: with every fact a feed fact, intelFacts is an empty object' do
      data = AccessSocialScenario.scenario
      data['social']['intelFacts'].delete('jake_office')
      data['social']['osint']['sites'][0]['profiles'][0]['posts'] = []
      build(scenario: data)
      assert_equal({}, JSON.parse(scenario_body).dig('social', 'intelFacts'))
    end

    test 'feedPosts holds exactly the revealed posts and their facts, and done' do
      build
      t = Time.current
      travel_to(t) { ask('jake') }
      travel_to(t + 1) { ask('lena') }
      fp = JSON.parse(scenario_body)['feedPosts']
      assert_equal %w[jake lena], fp.keys.sort
      jake = fp['jake']
      assert_equal %w[friendface jake false], [jake['site'], jake['person'], jake['done'].to_s]
      assert_equal ['jake_post_1'], jake['posts'].map { |p| p.dig('post', 'id') }
      assert_equal AccessSocialScenario::FACT_TEXTS['jake_pet_name'], jake['posts'][0].dig('fact', 'entry', 'text')
      assert_equal true, fp['lena']['done']
      assert_nil fp['lena']['posts'][0]['fact']
    end

    test 'room data: feed and deliberate are in no room response; hasFeed only for an NPC with a feed and the need' do
      build
      body = room_body
      refute_includes body, '"feed"'
      refute_includes body, 'deliberate'
      npcs = JSON.parse(body).dig('room', 'npcs') || JSON.parse(body)['npcs']
      by_id = npcs.to_h { |n| [n['id'], n] }
      assert_equal true, by_id['jake']['hasFeed']
      assert_equal true, by_id['lena']['hasFeed']
      assert_nil by_id['omar']['hasFeed']
      assert_nil by_id['nia']['hasFeed']
    end

    test 'no exposure: before a post, no response holds a post or feed fact text, or an object keyed by a feed fact id with text' do
      build
      feed_ids = %w[jake_pet_name jake_wedding_year]
      secrets = AccessSocialScenario::POSTS + AccessSocialScenario::FACT_TEXTS.values + [AccessSocialScenario::LENA_POST]
      bodies = [scenario_body, room_body, room_body('lobby')]
      bodies.each do |b|
        secrets.each { |text| refute_includes b, text }
        assert_empty keyed_with_text(JSON.parse(b), feed_ids)
      end
      assert_includes bodies[0], AccessSocialScenario::ORDINARY_FACT_TEXT
    end

    test 'no exposure after one post: the first post and fact are in its answer and GET /scenario, the second nowhere' do
      build
      post feed_post_game_url(@game), params: { npc_id: 'jake' }, as: :json
      first = response.body
      later = [scenario_body, room_body]
      [first, later[0]].each do |b|
        assert_includes b, AccessSocialScenario::POSTS[0]
        assert_includes b, AccessSocialScenario::FACT_TEXTS['jake_pet_name']
      end
      refute_includes later[1], AccessSocialScenario::POSTS[0]
      ([first] + later).each do |b|
        refute_includes b, AccessSocialScenario::POSTS[1]
        refute_includes b, AccessSocialScenario::FACT_TEXTS['jake_wedding_year']
        assert_empty keyed_with_text(JSON.parse(b), ['jake_wedding_year'])
      end
      # A too-soon answer carries nothing of the second post either
      post feed_post_game_url(@game), params: { npc_id: 'jake' }, as: :json
      refute_includes response.body, AccessSocialScenario::POSTS[1]
    end

    test 'hostile post text is served verbatim as a JSON string, never altered' do
      data = AccessSocialScenario.scenario
      hostile = '<img src=x onerror=alert(1)> **bold** -- `tick` & "quote"'
      data['rooms']['office']['npcs'][0]['feed']['posts'][0]['text'] = hostile
      build(scenario: data)
      assert_equal hostile, ask('jake').dig('post', 'text')
    end

    test 'review C R1 m3: a feed-only NPC gets no npcFrustration entry when its room loads' do
      build(player_state: { 'encounteredNPCs' => [] })
      room_body
      state = @game.reload.player_state['npcFrustration'] || {}
      refute state.key?('omar'), 'omar has a feed and no need: nothing to record'
      assert_includes @game.player_state['encounteredNPCs'], 'omar', 'the room load met him'
    end

    test 'review C R1 n5: a game saved before C (no feedRevealed key) loads and serves its first post' do
      build
      state = @game.player_state.except('feedRevealed')
      @game.update_column(:player_state, state)
      get scenario_game_url(@game), as: :json
      assert_response :success
      assert_equal({}, response.parsed_body['feedPosts'])
      assert_equal 'jake_post_1', ask('jake').dig('post', 'id')
      assert_equal ['jake_post_1'], @game.reload.player_state.dig('feedRevealed', 'jake', 'shown')
    end

    test 'review C R1 n5: /feed_post runs under the game lock' do
      src = File.read(GamesController.instance_method(:feed_post).source_location[0])
      list = src[/around_action :with_game_lock, only: \[([^\]]*)\]/m, 1]
      assert list, 'the lock has an only: list'
      assert_includes list.scan(/:(\w+)/).flatten, 'feed_post'
    end

    test 'a reset drops feedRevealed' do
      build
      ask('jake')
      post reset_game_url(@game), as: :json
      assert_equal({}, @game.reload.player_state['feedRevealed'] || {})
    end

    # ── sub-slice C2: reactive posts chosen by the server ──────────────────

    VENT_TEXT = 'Server down again, second time this week on the finance share.'.freeze
    VENT_FACT_TEXT = 'Jake Brooks keeps the finance backups on a personal drive.'.freeze

    # jake gains a work need on `srv` (downIf srv_down) and a reactive vent post. `order` sets the
    # feed order; the three ordered posts of AccessSocialScenario stay.
    def reactive_scenario(order: 'reactive_first')
      data = AccessSocialScenario.scenario
      data['resources'] = { 'srv' => { 'kind' => 'file_share', 'name' => 'Finance share', 'downIf' => 'srv_down' } }
      data['globalVariables'] = { 'srv_down' => false }
      data['social']['intelFacts']['jake_vent_fact'] =
        { 'label' => 'Backups', 'subject' => 'jake', 'text' => VENT_FACT_TEXT }
      jake = data['rooms']['office']['npcs'][0]
      jake['needs'] = jake['needs'].merge('work' => { 'decayPerMin' => 40, 'urgentAt' => 50, 'initial' => 60 })
      jake['workNeeds'] = ['srv']
      jake['feed']['order'] = order
      jake['feed']['posts'] << { 'id' => 'jake_vent', 'text' => VENT_TEXT, 'fact' => 'jake_vent_fact',
                                 'when' => { 'cause' => 'down', 'need' => 'work' } }
      data
    end

    # make jake's reactive `cause: down` condition hold: the resource is down and he has failed at it
    def arm_outage!
      @game.reload
      @game.player_state['globalVariables'] = { 'srv_down' => true }
      @game.player_state['npcFrustration'] = { 'jake' => { 'level' => 30, 'failWhy' => { 'work' => ['down'] },
                                                          'failAt' => { 'work' => 1.0 }, 'easeAt' => {},
                                                          'done' => [], 'lastSpent' => {}, 'lockedOut' => [] } }
      @game.save!
    end

    test 'C2: a reactive post is served only once its condition holds (reactive_first)' do
      build(scenario: reactive_scenario)
      # condition not armed: the ordered post comes out, the vent is held back
      a = ask('jake')
      assert_equal 'jake_post_1', a.dig('post', 'id')
      refute_includes response.body, VENT_TEXT

      # a fresh game with the outage armed serves the vent ahead of the ordered stream
      build(scenario: reactive_scenario)
      arm_outage!
      b = ask('jake')
      assert_equal 'jake_vent', b.dig('post', 'id')
      assert_equal VENT_TEXT, b.dig('post', 'text')
      assert_equal 'jake_vent_fact', b.dig('fact', 'id')
      assert_equal VENT_FACT_TEXT, b.dig('fact', 'entry', 'text')
      assert_equal 0, b['index']
      assert_equal ['jake_vent'], @game.reload.player_state.dig('feedRevealed', 'jake', 'shown')
    end

    test 'C2: a feed with an un-triggered reachable reactive post keeps done false and a null serve writes nothing' do
      build(scenario: reactive_scenario(order: 'facts_first'))
      t = Time.current
      # drain the three ordered posts (srv_down false, so the vent never fires)
      3.times { |i| travel_to(t + (i * (FLOOR + 1))) { ask('jake') } }
      shown = @game.reload.player_state.dig('feedRevealed', 'jake', 'shown')
      assert_equal %w[jake_post_1 jake_post_2 jake_post_3], shown
      # the reactive vent is unshown and still reachable: done stays false, nothing served, no write
      c = travel_to(t + (3 * (FLOOR + 1))) { ask('jake') }
      assert_equal({ 'npcId' => 'jake', 'post' => nil, 'done' => false }, c)
      assert_equal shown, @game.reload.player_state.dig('feedRevealed', 'jake', 'shown')
      refute_includes response.body, VENT_TEXT
    end

    test 'C2: the pace floor still bites for a reactive serve, and tooSoon carries no reactive text' do
      build(scenario: reactive_scenario)
      arm_outage!
      t = Time.current
      travel_to(t) { ask('jake') } # serves jake_vent
      a = travel_to(t + FLOOR - 2) { ask('jake') }
      assert_equal true, a['tooSoon']
      assert_nil a['post']
      assert_equal 1, a['revealed']
      refute_includes response.body, VENT_TEXT # the next ordered post text is not leaked either
    end

    test 'C2: feed_posts_for_client lists an out-of-order reactive post in reveal order with no nil error' do
      build(scenario: reactive_scenario)
      # the server served the reactive post first, then an ordered one (reveal order, not authored)
      @game.reload
      @game.player_state['feedRevealed'] = { 'jake' => { 'shown' => %w[jake_vent jake_post_1], 'at' => Time.current.to_f } }
      @game.save!
      arm_outage! # keep the condition live so nothing is treated as dead; shown is kept from above
      @game.reload
      @game.player_state['feedRevealed'] = { 'jake' => { 'shown' => %w[jake_vent jake_post_1], 'at' => Time.current.to_f } }
      @game.save!
      fp = JSON.parse(scenario_body)['feedPosts']['jake']
      assert_equal %w[jake_vent jake_post_1], fp['posts'].map { |p| p.dig('post', 'id') }
      assert_equal [0, 1], fp['posts'].map { |p| p['index'] }
      assert_equal false, fp['done']
    end

    test 'C2 R2 nit: a saved shown id the scenario no longer has is skipped, not sent as an empty post' do
      build(scenario: reactive_scenario(order: 'facts_first'))
      @game.reload
      @game.player_state['feedRevealed'] = { 'jake' => { 'shown' => %w[jake_post_1 gone_post jake_post_2], 'at' => Time.current.to_f } }
      @game.save!
      fp = JSON.parse(scenario_body)['feedPosts']['jake']
      assert_equal %w[jake_post_1 jake_post_2], fp['posts'].map { |p| p.dig('post', 'id') }
      assert_equal [0, 2], fp['posts'].map { |p| p['index'] }, 'each kept post keeps its reveal index'
      refute(fp['posts'].any? { |p| p['post'].nil? || p['post'].empty? })
    end

    test 'C2: a C-shape { n, at } entry migrates through reveal_feed_post! and feed_posts_for_client with no nil error' do
      build(scenario: reactive_scenario(order: 'facts_first'))
      at = Time.current.to_f - 1000
      @game.reload
      @game.player_state['feedRevealed'] = { 'jake' => { 'n' => 1, 'at' => at } }
      @game.save!
      # GET /scenario renders the first ordered post from the legacy count without a nil error
      fp = JSON.parse(scenario_body)['feedPosts']['jake']
      assert_equal ['jake_post_1'], fp['posts'].map { |p| p.dig('post', 'id') }
      # the next /feed_post serves the second ordered post and rewrites the record in the new shape
      b = ask('jake')
      assert_equal 'jake_post_2', b.dig('post', 'id')
      assert_equal %w[jake_post_1 jake_post_2], @game.reload.player_state.dig('feedRevealed', 'jake', 'shown')
    end

    test 'C2 tampered: a reactive condition that does not hold yields no reactive post, and no text anywhere until served' do
      build(scenario: reactive_scenario)
      secrets = [VENT_TEXT, VENT_FACT_TEXT]
      # before any serve, the vent and its fact are in no response and not keyed in intelFacts
      bodies = [scenario_body, room_body, room_body('lobby')]
      bodies.each do |b|
        secrets.each { |s| refute_includes b, s }
        assert_empty keyed_with_text(JSON.parse(b), ['jake_vent_fact'])
      end
      # a use with the condition unarmed serves the ordered post, never the vent
      a = ask('jake')
      assert_equal 'jake_post_1', a.dig('post', 'id')
      secrets.each { |s| refute_includes response.body, s }
    end

    test 'C2 tampered: extra request fields cannot force a reactive post' do
      build(scenario: reactive_scenario)
      # the client forges condition inputs; the route reads only npc_id, so the vent stays held
      post feed_post_game_url(@game), params: { npc_id: 'jake', cause: 'down', when: { cause: 'down' },
                                               force: true, srv_down: true }, as: :json
      body = response.parsed_body
      assert_equal 'jake_post_1', body.dig('post', 'id')
      refute_includes response.body, VENT_TEXT
    end
  end
end
