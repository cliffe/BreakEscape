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
      assert_equal 3, @game.reload.player_state.dig('feedRevealed', 'jake', 'n')
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
      assert_equal({ 'n' => 1, 'at' => at }, @game.reload.player_state.dig('feedRevealed', 'jake'))
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

    test 'a reset drops feedRevealed' do
      build
      ask('jake')
      post reset_game_url(@game), as: :json
      assert_equal({}, @game.reload.player_state['feedRevealed'] || {})
    end
  end
end
