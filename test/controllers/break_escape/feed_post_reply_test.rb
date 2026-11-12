require 'test_helper'
require_relative '../../support/access_social_scenario'

module BreakEscape
  # Access model slice 9.2 C3 (ACCESS_MODEL_SLICE_9_2_C3_PLAN.md sections 5, 6 and 10): POST
  # /feed_post serving replies between NPCs, the seq and to records, {name} filling, feedPosts on
  # a load, the Friendface phone slice and the tampered-client cases.
  class FeedPostReplyTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    FLOOR = (0.9 * 60) - 3
    DOWN = { 'global' => 'drive_down' }.freeze
    IVY_PHONE = { 'type' => 'phone_friendface', 'id' => 'ivy_phone', 'name' => "Ivy's phone", 'takeable' => true, 'phoneOf' => 'ivy' }.freeze
    TOM_PHONE = { 'type' => 'phone_friendface', 'id' => 'tom_phone', 'name' => "Tomasz's phone", 'takeable' => true, 'phoneOf' => 'tomasz' }.freeze
    OWN_PHONE = { 'type' => 'phone_friendface', 'id' => 'my_phone', 'name' => 'Your phone', 'takeable' => true }.freeze

    def post_(id, text, extra = {})
      { 'id' => id, 'text' => text, 'when' => DOWN }.merge(extra)
    end

    def scenario(ivy_first: 'Ivy', tom_extra: {}, tom_display: 'Tomasz Nowak')
      s = AccessSocialScenario.scenario
      s['globalVariables'] = { 'drive_down' => true }
      s['social']['people'] = [{ 'id' => 'ivy', 'forms' => { 'first' => ivy_first, 'full' => 'Ivy Clarke' } },
                               { 'id' => 'tomasz', 'forms' => { 'first' => 'Tomasz' } }]
      s['social']['intelFacts']['tom_secret'] = { 'label' => 'Secret', 'subject' => 'tomasz', 'text' => 'Tomasz keeps a spare key under the mat.' }
      s['social']['osint']['sites'][0]['profiles'] += [{ 'person' => 'ivy', 'name' => 'Ivy Clarke', 'posts' => [] },
                                                        { 'person' => 'tomasz', 'name' => 'Tomasz Nowak', 'posts' => [] }]
      s['social']['osint']['sites'] << { 'id' => 'otherface', 'type' => 'social', 'name' => 'Otherface', 'profiles' => [] }
      ivy = AccessSocialScenario.npc('ivy', 'displayName' => 'Ivy Clarke', 'needs' => AccessSocialScenario.social_need,
                                            'itemsHeld' => [IVY_PHONE.dup],
                                            'feed' => { 'site' => 'friendface', 'person' => 'ivy', 'order' => 'reactive_first', 'posts' => [
                                              post_('ivy_vent', 'Shared drive down again, nothing will save at all.'),
                                              post_('ivy_re_tom', 'Not just you {name}, mine has gone as well.', 'replyTo' => 'tom_vent', 'insteadOf' => 'ivy_vent'),
                                              post_('ivy_still', 'Two hours and the shared drive is still down.'),
                                              post_('ivy_answer', '{name}, did IT ever ring you back about it?', 'replyTo' => 'ivy_vent', 'insteadOf' => 'ivy_still')
                                            ] })
      tom = AccessSocialScenario.npc('tomasz', 'displayName' => tom_display, 'needs' => AccessSocialScenario.social_need,
                                               'itemsHeld' => [TOM_PHONE.dup],
                                               'feed' => { 'site' => 'friendface', 'person' => 'tomasz', 'order' => 'reactive_first', 'posts' => [
                                                 post_('tom_vent', 'Shared drive is gone. Lovely start to the week.'),
                                                 post_('tom_re_ivy', 'Same here {name}, I lost my whole morning to it.', { 'replyTo' => 'ivy_vent', 'insteadOf' => 'tom_vent' }.merge(tom_extra)),
                                                 post_('tom_still', 'Still no shared drive. I have given up for today.'),
                                                 post_('tom_again', '{name}, they told me tomorrow at the earliest.', 'replyTo' => 'ivy_vent', 'insteadOf' => 'tom_still')
                                               ] })
      oth = AccessSocialScenario.npc('olga', 'needs' => AccessSocialScenario.social_need,
                                             'feed' => { 'site' => 'otherface', 'person' => 'olga', 'posts' => [
                                               post_('olga_vent', 'Olga posts on another site about the drive.'),
                                               post_('olga_re', '{name} on another site replying here.', 'replyTo' => 'ivy_vent', 'insteadOf' => 'olga_vent')
                                             ] })
      s['rooms']['office']['npcs'] += [tom, ivy, oth]
      s['rooms']['lobby']['objects'] << OWN_PHONE.dup
      s
    end

    def build(player_state: {}, **opts)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario(**opts),
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[jake lena ivy tomasz olga] }.merge(player_state)
      )
    end

    def ask(npc_id, extra = {})
      post feed_post_game_url(@game), params: { npc_id: npc_id }.merge(extra), as: :json
      response.parsed_body
    end

    def feed_posts
      get scenario_game_url(@game), as: :json
      assert_response :success
      response.parsed_body['feedPosts']
    end

    def open_phone(npc_id)
      post friendface_phone_game_url(@game), params: { npc_id: npc_id, posts: 1 }, as: :json
      response.parsed_body
    end

    def entry(npc)
      @game.reload.player_state.dig('feedRevealed', npc)
    end

    # Ivy vents, Tomasz replies, Ivy answers, Tomasz replies again: one met use each, paced
    def full_thread
      t = Time.current
      [travel_to(t) { ask('ivy') }, travel_to(t + 1) { ask('tomasz') },
       travel_to(t + FLOOR + 2) { ask('ivy') }, travel_to(t + FLOOR + 3) { ask('tomasz') }]
    end

    test 'a reply is served with its thread fields and {name} filled from forms.first' do
      build
      ask('ivy')
      a = ask('tomasz')
      assert_equal({ 'id' => 'tom_re_ivy', 'text' => 'Same here Ivy, I lost my whole morning to it.', 'replyTo' => 'ivy_vent' }, a['post'])
      assert_equal 2, a['seq']
      assert_equal %w[ivy ivy ivy ivy], [a['replyToNpc'], a['replyToPerson'], a['namedNpc'], a['namedPerson']]
      assert_nil a['fact']
      assert_equal false, a['done']
      assert_equal({ 'shown' => ['tom_re_ivy'], 'at' => entry('tomasz')['at'], 'seq' => { 'tom_re_ivy' => 2 },
                     'to' => { 'tom_re_ivy' => { 'post' => 'ivy_vent', 'npc' => 'ivy' } } }, entry('tomasz'))
      item = feed_posts['tomasz']['posts'].first
      assert_equal a['post'], item['post']
      assert_equal [2, 'ivy', 'ivy'], [item['seq'], item['replyToNpc'], item['namedNpc']]
    end

    test 'answer and second reply: seq and to survive every write, the spent posts never ship' do
      build
      res = full_thread
      assert_equal %w[ivy_vent tom_re_ivy ivy_answer tom_again], res.map { |r| r.dig('post', 'id') }
      assert_equal 'Tomasz, did IT ever ring you back about it?', res[2].dig('post', 'text')
      assert_equal %w[tomasz tomasz], [res[2]['namedNpc'], res[2]['namedPerson']]
      assert_equal 'Ivy, they told me tomorrow at the earliest.', res[3].dig('post', 'text')
      assert_equal [1, 2, 3, 4], res.map { |r| r['seq'] }
      assert res[2]['done'] && res[3]['done']
      assert_equal({ 'ivy_vent' => 1, 'ivy_answer' => 3 }, entry('ivy')['seq'])
      assert_equal({ 'ivy_answer' => { 'post' => 'ivy_vent', 'npc' => 'tomasz' } }, entry('ivy')['to'])
      assert_equal({ 'tom_re_ivy' => 2, 'tom_again' => 4 }, entry('tomasz')['seq'])
      assert_equal 2, entry('tomasz')['to'].size
      body = response_text_after_scenario
      %w[tom_vent ivy_re_tom ivy_still tom_still].each { |spent| refute_includes body, spent }
      ['Shared drive is gone.', 'Two hours and the shared drive', 'Still no shared drive'].each { |t| refute_includes body, t }
    end

    def response_text_after_scenario
      get scenario_game_url(@game), as: :json
      response.body
    end

    test 'a name with markup ships as the same plain string; control characters go; a long one is cut to 40' do
      build(ivy_first: '<b>Ivy</b> & co')
      ask('ivy')
      assert_equal 'Same here <b>Ivy</b> & co, I lost my whole morning to it.', ask('tomasz').dig('post', 'text')
      build(ivy_first: "I\u0001vy\u0007#{'z' * 60}")
      ask('ivy')
      text = ask('tomasz').dig('post', 'text')
      name = text.sub('Same here ', '').sub(', I lost my whole morning to it.', '')
      assert_equal 40, name.length
      refute_match(/[[:cntrl:]]/, text)
    end

    test 'a reply authored with a fact ships without it, and the fact stays in the bootstrap' do
      build(tom_extra: { 'fact' => 'tom_secret' })
      get scenario_game_url(@game), as: :json
      assert response.parsed_body.dig('social', 'intelFacts', 'tom_secret'), 'not withheld: no own post grants it'
      ask('ivy')
      a = ask('tomasz')
      assert_equal 'tom_re_ivy', a.dig('post', 'id')
      assert_nil a['fact']
      refute a['post'].key?('fact')
    end

    test 'legacy { n, at } and C2 { shown, at } entries serve, and the next serve is numbered above every value' do
      build(player_state: { 'feedRevealed' => { 'jake' => { 'n' => 1, 'at' => 1.0 },
                                                'lena' => { 'shown' => ['lena_post_1'], 'at' => 1.0, 'seq' => { 'lena_post_1' => 7 } } } })
      a = ask('jake')
      assert_equal ['jake_post_2', 8], [a.dig('post', 'id'), a['seq']]
      fp = feed_posts
      assert_equal [0, 8], fp['jake']['posts'].map { |p| p['seq'] }
      assert_equal [7], fp['lena']['posts'].map { |p| p['seq'] }
    end

    test 'a reply whose to was removed from the save is left out of feedPosts and never served again' do
      build(player_state: { 'feedRevealed' => {
              'ivy' => { 'shown' => %w[ivy_vent ivy_answer], 'at' => 1.0, 'seq' => { 'ivy_vent' => 1, 'ivy_answer' => 3 } },
              'tomasz' => { 'shown' => ['tom_re_ivy'], 'at' => 1.0, 'seq' => { 'tom_re_ivy' => 2 } }
            } })
      fp = feed_posts
      assert_equal ['ivy_vent'], fp['ivy']['posts'].map { |p| p.dig('post', 'id') }, 'an answer with no to is not drawn'
      assert_equal ['ivy_vent'], fp['tomasz']['posts'].map { |p| p.dig('post', 'replyTo') }, 'a replyTo reply falls back to its authored thread'
      refute_equal 'ivy_answer', ask('ivy').dig('post', 'id')
    end

    test 'a null serve writes nothing' do
      build(player_state: { 'feedRevealed' => {} })
      @game.player_state['globalVariables'] = { 'drive_down' => false }
      @game.save!
      a = ask('ivy')
      assert_nil a['post']
      assert_nil entry('ivy')
    end

    # ── Tampered client (section 6) ──

    test 'Tomasz before Ivy vents gets his own vent, never the reply text' do
      build
      a = ask('tomasz')
      assert_equal 'tom_vent', a.dig('post', 'id')
      refute_includes response.body, '{name}'
      refute_includes response.body, 'lost my whole morning'
    end

    test 'extra request fields are ignored' do
      build
      ask('ivy', reply_to: 'tom_vent', post_id: 'ivy_re_tom', insteadOf: 'x', complaint: 'c', name: 'Mallory')
      a = ask('tomasz', reply_to: 'nothing', post_id: 'tom_vent', name: 'Mallory')
      assert_equal 'tom_re_ivy', a.dig('post', 'id')
      assert_includes a.dig('post', 'text'), 'Ivy'
      refute_includes response.body, 'Mallory'
    end

    test 'repeated asks open neither the answer nor the second reply early' do
      build
      t = Time.current
      travel_to(t) { ask('ivy') }
      b = travel_to(t + FLOOR + 1) { ask('ivy') }
      assert_equal 'ivy_still', b.dig('post', 'id'), 'no reply out: the answer is spent, never opened early'
      c = travel_to(t + FLOOR + 2) { ask('tomasz') }
      assert_equal 'tom_re_ivy', c.dig('post', 'id')
      d = travel_to(t + FLOOR + 3) { ask('tomasz') }
      assert d['tooSoon']
      e = travel_to(t + (2 * FLOOR) + 4) { ask('tomasz') }
      assert_equal 'tom_still', e.dig('post', 'id'), 'no answer out: the second reply stays closed'
    end

    test 'pushing globals cannot open a thread whose post is not out' do
      build(player_state: { 'globalVariables' => { 'drive_down' => true } })
      assert_equal 'tom_vent', ask('tomasz').dig('post', 'id')
    end

    # ── The Friendface phone slice (q63) ──

    test 'the thread poster phone holds the served replies to its posts; the replier phone its reply; nothing unserved' do
      build
      full_thread
      # A held phone makes its NPC phoneless, so the phones reach the inventory after the thread
      @game.reload.player_state['inventory'] = [IVY_PHONE.dup, TOM_PHONE.dup, OWN_PHONE.dup]
      @game.save!
      ivy = open_phone('ivy')['feedPosts']
      assert_equal %w[ivy tomasz], ivy.keys.sort
      assert_equal %w[ivy_vent ivy_answer], ivy['ivy']['posts'].map { |p| p.dig('post', 'id') }
      assert_equal %w[tom_re_ivy tom_again], ivy['tomasz']['posts'].map { |p| p.dig('post', 'id') }
      tom = open_phone('tomasz')['feedPosts']
      assert_equal ['tomasz'], tom.keys
      assert_equal %w[tom_re_ivy tom_again], tom['tomasz']['posts'].map { |p| p.dig('post', 'id') }
      own = open_phone(nil)['feedPosts']
      assert_equal %w[ivy tomasz], own.keys.sort
      body = response.body
      %w[tom_vent ivy_re_tom ivy_still tom_still].each { |spent| refute_includes body, "\"#{spent}\"" }
    end

    test 'a reply on another site is left out of the thread poster phone' do
      build(player_state: { 'inventory' => [IVY_PHONE.dup],
                            'feedRevealed' => { 'ivy' => { 'shown' => ['ivy_vent'], 'at' => 1.0, 'seq' => { 'ivy_vent' => 1 } },
                                                'olga' => { 'shown' => ['olga_re'], 'at' => 1.0, 'seq' => { 'olga_re' => 2 },
                                                            'to' => { 'olga_re' => { 'post' => 'ivy_vent', 'npc' => 'ivy' } } } } })
      assert_equal ['ivy'], open_phone('ivy')['feedPosts'].keys
    end
  end
end
