require 'test_helper'
require 'minitest/mock'
require_relative '../../support/access_social_scenario'

module BreakEscape
  # Friendface reactions (docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md sections 5.3, 5.4, 7 and
  # 11): reactions derived from feedRevealed ride the /feed_post answer that serves the post they
  # come out with and GET /scenario's feedPosts. Every absence check sits beside a presence check
  # on the same fixture and request, so a raise cannot pass both.
  class FeedPostReactionsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    FLOOR = (0.9 * 60) - 3
    DOWN = { 'global' => 'drive_down' }.freeze
    IVY_PHONE = { 'type' => 'phone_friendface', 'id' => 'ivy_phone', 'name' => "Ivy's phone", 'takeable' => true, 'phoneOf' => 'ivy' }.freeze

    IVY_REACTS = [{ 'to' => 'tom_re_ivy', 'key' => 'like' }, { 'to' => 'tom_again', 'key' => 'laugh' }].freeze
    TOM_REACTS = [{ 'to' => 'ivy_answer', 'key' => 'sad', 'alongside' => 'tom_again' }].freeze

    teardown { SocialFeed.rescue_reactions_in_test = false }

    def post_(id, text, extra = {})
      { 'id' => id, 'text' => text, 'when' => DOWN }.merge(extra)
    end

    def scenario(reacts: true, ivy_person: 'ivy')
      s = AccessSocialScenario.scenario
      s['globalVariables'] = { 'drive_down' => true }
      s['social']['people'] = [{ 'id' => 'ivy', 'forms' => { 'first' => 'Ivy', 'full' => 'Ivy Clarke' } },
                               { 'id' => 'tomasz', 'forms' => { 'first' => 'Tomasz' } }]
      s['social']['osint']['sites'][0]['profiles'] += [{ 'person' => ivy_person, 'name' => 'Ivy Clarke', 'posts' => [] },
                                                        { 'person' => 'tomasz', 'name' => 'Tomasz Nowak', 'posts' => [] }]
      ivy_feed = { 'site' => 'friendface', 'person' => ivy_person, 'order' => 'reactive_first', 'posts' => [
        post_('ivy_vent', 'Shared drive down again, nothing will save at all.'),
        post_('ivy_re_tom', 'Not just you {name}, mine has gone as well.', 'replyTo' => 'tom_vent', 'insteadOf' => 'ivy_vent'),
        post_('ivy_still', 'Two hours and the shared drive is still down.'),
        post_('ivy_answer', '{name}, did IT ever ring you back about it?', 'replyTo' => 'ivy_vent', 'insteadOf' => 'ivy_still')
      ] }
      tom_feed = { 'site' => 'friendface', 'person' => 'tomasz', 'order' => 'reactive_first', 'posts' => [
        post_('tom_vent', 'Shared drive is gone. Lovely start to the week.'),
        post_('tom_re_ivy', 'Same here {name}, I lost my whole morning to it.', 'replyTo' => 'ivy_vent', 'insteadOf' => 'tom_vent'),
        post_('tom_still', 'Still no shared drive. I have given up for today.'),
        post_('tom_again', '{name}, they told me tomorrow at the earliest.', 'replyTo' => 'ivy_vent', 'insteadOf' => 'tom_still')
      ] }
      if reacts
        ivy_feed['reacts'] = IVY_REACTS.map(&:dup)
        tom_feed['reacts'] = TOM_REACTS.map(&:dup)
      end
      ivy = AccessSocialScenario.npc('ivy', 'displayName' => 'Ivy Clarke', 'needs' => AccessSocialScenario.social_need,
                                            'itemsHeld' => [IVY_PHONE.dup], 'feed' => ivy_feed)
      tom = AccessSocialScenario.npc('tomasz', 'displayName' => 'Tomasz Nowak', 'needs' => AccessSocialScenario.social_need,
                                               'feed' => tom_feed)
      s['rooms']['office']['npcs'] += [tom, ivy]
      s
    end

    def build(inventory: [], **opts)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario(**opts),
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[jake lena ivy tomasz], 'inventory' => inventory }
      )
    end

    def ask(npc_id, extra = {})
      post feed_post_game_url(@game), params: { npc_id: npc_id }.merge(extra), as: :json
      response.parsed_body
    end

    def load_scenario
      get scenario_game_url(@game), as: :json
      assert_response :success
      response
    end

    def feed_posts
      load_scenario.parsed_body['feedPosts']
    end

    def item(posts, npc, pid)
      posts[npc]['posts'].find { |p| p.dig('post', 'id') == pid }
    end

    # Ivy vents, Tomasz replies, Ivy answers, Tomasz replies again: one met use each, paced
    def full_thread(start = Time.current)
      [travel_to(start) { ask('ivy') }, travel_to(start + 1) { ask('tomasz') },
       travel_to(start + FLOOR + 2) { ask('ivy') }, travel_to(start + FLOOR + 3) { ask('tomasz') }]
    end

    def rx(postid, npc, key, person = npc)
      { 'postId' => postid, 'npc' => npc, 'person' => person, 'key' => key }
    end

    test 'each answer carries exactly the reactions that come out with its post, done-before included' do
      build
      res = full_thread
      assert_equal %w[ivy_vent tom_re_ivy ivy_answer tom_again], res.map { |r| r.dig('post', 'id') }
      # No reaction yet: no key, beside the third answer that has one
      refute res[0].key?('reactions')
      refute res[1].key?('reactions')
      assert_equal [rx('tom_re_ivy', 'ivy', 'like')], res[2]['reactions']
      # Tomasz's own (alongside) sad and Ivy's laugh on his post, since her feed was done: key order
      assert_equal [rx('tom_again', 'ivy', 'laugh'), rx('ivy_answer', 'tomasz', 'sad')], res[3]['reactions']
    end

    test 'feedPosts puts each reaction on its target item, replies included; FEED_ITEM_KEYS unchanged' do
      build
      full_thread
      posts = feed_posts
      assert_equal [{ 'npc' => 'ivy', 'person' => 'ivy', 'key' => 'like' }], item(posts, 'tomasz', 'tom_re_ivy')['reactions']
      assert_equal [{ 'npc' => 'ivy', 'person' => 'ivy', 'key' => 'laugh' }], item(posts, 'tomasz', 'tom_again')['reactions']
      assert_equal [{ 'npc' => 'tomasz', 'person' => 'tomasz', 'key' => 'sad' }], item(posts, 'ivy', 'ivy_answer')['reactions']
      refute item(posts, 'ivy', 'ivy_vent').key?('reactions')
      assert_equal %w[index seq post fact replyToNpc replyToPerson namedNpc namedPerson], SocialFeed::FEED_ITEM_KEYS
    end

    test 'null, tooSoon and refused answers carry none; the next served answer carries its reactions' do
      build
      t = Time.current
      travel_to(t) { ask('ivy') }
      travel_to(t + 1) { ask('tomasz') }
      soon = travel_to(t + 2) { ask('ivy') }
      assert soon['tooSoon']
      refute soon.key?('reactions')
      refused = travel_to(t + FLOOR + 2) { ask('ivy', object_id: 'not_a_place') }
      assert refused['refused']
      refute refused.key?('reactions')
      served = travel_to(t + FLOOR + 3) { ask('ivy') }
      assert_equal [rx('tom_re_ivy', 'ivy', 'like')], served['reactions']
      served2 = travel_to(t + FLOOR + 4) { ask('tomasz') }
      assert_equal 2, served2['reactions'].size
      null = travel_to(t + (3 * FLOOR)) { ask('tomasz') }
      assert_nil null['post']
      refute null.key?('reactions')
    end

    test 'player_state and feedRevealed are identical to the same run with reacts removed' do
      build(reacts: false)
      plain = full_thread
      plain_state = @game.reload.player_state
      build
      with = full_thread
      assert_equal 2, with[3]['reactions'].size
      state = @game.reload.player_state
      assert_equal plain_state.keys.sort, state.keys.sort
      strip = ->(fr) { fr.transform_values { |e| e.except('at') } }
      assert_equal strip.call(plain_state['feedRevealed']), strip.call(state['feedRevealed'])
      assert_equal plain.map { |r| r.except('reactions') }, with.map { |r| r.except('reactions') }
    end

    test 'the rescue: a derivation fault keeps the post, is reported, and feedPosts still ships' do
      build(reacts: false)
      plain = full_thread
      build
      SocialFeed.rescue_reactions_in_test = true
      reports = []
      boom = ->(*_a, **_k) { raise ArgumentError, 'boom' }
      res = nil
      Rails.error.stub(:report, ->(e, **kw) { reports << [e, kw] }) do
        AccessWork.stub(:feed_reactions, boom) do
          res = full_thread
          posts = feed_posts
          assert_equal 4, posts.values.sum { |b| b['posts'].size }
          refute(posts.values.any? { |b| b['posts'].any? { |p| p.key?('reactions') } })
        end
      end
      assert_equal plain, res
      assert_equal 4, @game.reload.player_state['feedRevealed'].values.sum { |e| e['shown'].size }
      served = reports.select { |_e, kw| kw.dig(:context, :post_id) }
      assert_equal %w[ivy_vent tom_re_ivy ivy_answer tom_again], served.map { |_e, kw| kw[:context][:post_id] }
      assert(served.all? { |_e, kw| kw[:context][:game_id] == @game.id && kw[:handled] })
      # Paired: the same run without the stub carries reactions
      SocialFeed.rescue_reactions_in_test = false
      build
      assert_equal 2, full_thread[3]['reactions'].size
    end

    # The dummy app shows exceptions, so a re-raise reaches the test as a 500, not a rescued 200
    test 'with the rescue off (the default) a derivation fault raises in test' do
      build
      ask('ivy')
      AccessWork.stub(:feed_reactions, ->(*_a, **_k) { raise ArgumentError, 'boom' }) do
        begin
          ask('tomasz')
          assert_response :internal_server_error
        rescue ArgumentError
          pass
        end
      end
      # Paired: the same request with the rescue on answers with its post
      build
      ask('ivy')
      SocialFeed.rescue_reactions_in_test = true
      AccessWork.stub(:feed_reactions, ->(*_a, **_k) { raise ArgumentError, 'boom' }) do
        Rails.error.stub(:report, ->(*_a, **_k) {}) { assert_equal 'tom_re_ivy', ask('tomasz').dig('post', 'id') }
      end
    end

    test 'the test-only phone path carries reactions; a game open carries no posts' do
      build
      full_thread
      # The player takes Ivy's phone only after the thread (a held phone stops her phone posts)
      @game.reload.player_state['inventory'] = [IVY_PHONE.dup]
      @game.save!
      post friendface_phone_game_url(@game), params: { npc_id: 'ivy', posts: 1 }, as: :json
      with = response.parsed_body
      ans = with.dig('feedPosts', 'ivy', 'posts').find { |p| p.dig('post', 'id') == 'ivy_answer' }
      assert_equal [{ 'npc' => 'tomasz', 'person' => 'tomasz', 'key' => 'sad' }], ans['reactions']
      post friendface_phone_game_url(@game), params: { npc_id: 'ivy' }, as: :json
      refute_includes response.body, '"reactions"'
      refute_includes response.body, 'feedPosts'
    end

    test 'reacts is in neither the room data nor the bootstrap; the bootstrap carries the derived reactions' do
      build
      full_thread
      body = load_scenario.body
      refute_includes body, '"reacts"'
      assert_includes body, '"reactions"'
      get room_game_url(@game, room_id: 'office'), as: :json
      refute_includes response.body, '"reacts"'
      refute_includes response.body, 'alongside'
    end

    test 'tampering: extra fields on /feed_post are ignored, and no /feed_react route exists' do
      build(reacts: false)
      t = Time.current
      plain = [travel_to(t) { ask('ivy') }, travel_to(t + 1) { ask('tomasz') }]
      build
      extra = { reaction: 'like', key: 'angry', post_id: 'tom_vent', to: 'ivy_vent', alongside: 'tom_still' }
      tampered = [travel_to(t) { ask('ivy', extra) }, travel_to(t + 1) { ask('tomasz', extra) }]
      assert_equal plain, tampered
      ivy3 = travel_to(t + FLOOR + 2) { ask('ivy', extra) }
      assert_equal [rx('tom_re_ivy', 'ivy', 'like')], ivy3['reactions']
      begin
        post "#{game_url(@game)}/feed_react", params: { post_id: 'tom_vent', key: 'like' }, as: :json
        assert_response :not_found
      rescue ActionController::RoutingError
        pass
      end
    end

    test 'sizes: each item and the answer growth follow the encoder (section 5.4)' do
      build(ivy_person: 'ivy<&>')
      res = full_thread
      enc = ->(s) { s.to_json.bytesize - 2 }
      res.each do |r|
        list = r['reactions'] || next
        list.each do |i|
          assert_equal 43 + enc.call(i['postId']) + enc.call(i['npc']) + enc.call(i['person']) + enc.call(i['key']),
                       i.to_json.bytesize
        end
        n = list.size
        growth = 15 + (n * 43) + (n - 1) + list.sum { |i| %w[postId npc person key].sum { |k| enc.call(i[k]) } }
        assert_equal growth, r.to_json.bytesize - r.except('reactions').to_json.bytesize
      end
      assert_equal 'ivy<&>', res[2]['reactions'][0]['person']
      posts = feed_posts
      total = 0
      posts.each_value do |b|
        b['posts'].each do |p|
          next unless p['reactions']

          p['reactions'].each { |i| assert_equal 31 + enc.call(i['npc']) + enc.call(i['person']) + enc.call(i['key']), i.to_json.bytesize }
          total += p.to_json.bytesize - p.except('reactions').to_json.bytesize
        end
      end
      assert total.positive? && total < 500, "feedPosts growth #{total}"
    end
  end
end
