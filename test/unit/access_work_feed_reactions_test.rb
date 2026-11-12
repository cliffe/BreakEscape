require 'test_helper'

# Friendface reactions (docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md section 5.1): the pure
# AccessWork.feed_reactions over hand-built feeds and a hand-built feedRevealed record. `serve`
# plays the route's write (shown, seq, to), as C3's reply test does, so serve orders replay
# exactly with no database.
class AccessWorkFeedReactionsTest < ActiveSupport::TestCase
  AW = BreakEscape::AccessWork
  DOWN = { 'cause' => 'down', 'need' => 'work' }.freeze
  NEVER = { 'global' => 'no_such_global' }.freeze

  def npc(id, posts, reacts: nil, order: 'reactive_first', site: 'friendface', person: id)
    feed = { 'site' => site, 'person' => person, 'posts' => posts, 'order' => order }
    feed['reacts'] = reacts if reacts
    { 'id' => id, 'needs' => { 'work' => {}, 'social_media' => { 'decayPerMin' => 60, 'urgentAt' => 40 } },
      'workNeeds' => %w[srv], 'feed' => feed }
  end

  def data(npcs)
    { 'resources' => { 'srv' => { 'id' => 'srv', 'downIf' => 'srv_down' } },
      'globalVariables' => { 'srv_down' => true },
      'rooms' => { 'r1' => { 'npcs' => npcs } } }
  end

  def own(id, cond = DOWN, extra = {})
    { 'id' => id, 'text' => "own post #{id} long enough", 'when' => cond }.merge(extra)
  end

  def ordered(id)
    { 'id' => id, 'text' => "ordered post #{id} long enough" }
  end

  def re_to(id, target, instead, cond = DOWN)
    { 'id' => id, 'text' => "{name}, reply #{id} long enough", 'replyTo' => target, 'insteadOf' => instead, 'when' => cond }
  end

  def re_c(id, complaint, instead, cond = DOWN)
    { 'id' => id, 'text' => "{name}, reply #{id} long enough", 'replyToComplaint' => complaint,
      'insteadOf' => instead, 'when' => cond }
  end

  def down_entry
    { 'level' => 0, 'failWhy' => { 'work' => ['down'] }, 'easeAt' => {}, 'failAt' => {}, 'done' => [], 'lastSpent' => {} }
  end

  def serve(d, store, npc_id)
    n = AW.room_npc(d, npc_id)
    entry = store[npc_id] || {}
    res = AW.select_feed_post(d, n, entry, down_entry, d['globalVariables'], [], nil, revealed: AW.revealed_map(d, store))
    return res if res['post'].nil?

    seq = AW.next_seq(store)
    to = AW.feed_to_map(entry)
    to = to.merge(res['post'] => res['to']) if res['to']
    store[npc_id] = { 'shown' => AW.feed_shown_ids(n, entry) + [res['post']], 'at' => 0,
                      'seq' => AW.feed_seq_map(entry).merge(res['post'] => seq), 'to' => to }
    res
  end

  # Flatten to [target, npc, key, via] for compact assertions
  def flat(map)
    map.flat_map { |t, list| list.map { |r| [t, r['npc'], r['key'], r['via']] } }.sort
  end

  def rx(d, store, **kw)
    flat(AW.feed_reactions(d, store, **kw))
  end

  # ── F15: three vents on one complaint, each NPC one vent and one complaint reply ──

  def f15(asha: nil, kofi: nil, mei: nil)
    data([npc('asha', [own('asha_vent', DOWN, 'complaint' => 'drive'), re_c('asha_re', 'drive', 'asha_vent')],
              reacts: asha || [{ 'to' => 'mei_re', 'key' => 'like' }]),
          npc('kofi', [own('kofi_vent', DOWN, 'complaint' => 'drive'), re_c('kofi_re', 'drive', 'kofi_vent')],
              reacts: kofi || [{ 'toComplaint' => 'drive', 'key' => 'sad' }]),
          npc('mei', [own('mei_vent', DOWN, 'complaint' => 'drive'), re_c('mei_re', 'drive', 'mei_vent')],
              reacts: mei || [{ 'toComplaint' => 'drive', 'key' => 'sad' }, { 'to' => 'kofi_re', 'key' => 'like' }])])
  end

  # ── F16: the mutual pair with the answer and the second reply ──

  def f16(tom_reacts: nil, ivy_reacts: nil)
    ivy = [own('ivy_vent'), re_to('ivy_re_tom', 'tom_vent', 'ivy_vent'), own('ivy_still'),
           re_to('ivy_answer', 'ivy_vent', 'ivy_still')]
    tom = [own('tom_vent'), re_to('tom_re_ivy', 'ivy_vent', 'tom_vent'), own('tom_still'),
           re_to('tom_again', 'ivy_vent', 'tom_still')]
    data([npc('ivy', ivy, reacts: ivy_reacts || [{ 'to' => 'tom_re_ivy', 'key' => 'like' }]),
          npc('tomasz', tom, reacts: tom_reacts || [
                { 'to' => 'ivy_answer', 'key' => 'sad', 'alongside' => 'tom_again' },
                { 'to' => 'ivy_vent', 'key' => 'angry', 'alongside' => 'tom_still' }
              ])])
  end

  test 'F15: sad comes with Kofi\'s reply, and Asha (done) likes Mei\'s reply with it' do
    d = f15
    store = {}
    assert_equal 'asha_vent', serve(d, store, 'asha')['post']
    assert_empty rx(d, store)
    assert_equal 'kofi_re', serve(d, store, 'kofi')['post']
    assert_equal [['asha_vent', 'kofi', 'sad', 'kofi_re']], rx(d, store)
    assert_equal 'mei_re', serve(d, store, 'mei')['post']
    assert_equal [%w[asha_vent kofi sad kofi_re], %w[asha_vent mei sad mei_re],
                  %w[kofi_re mei like mei_re], %w[mei_re asha like mei_re]], rx(d, store)
    # The answer for Mei's serve carries the three whose via is her reply
    assert_equal 3, rx(d, store, via: 'mei_re').size
    # Lists are in key order, then reactor id
    assert_equal %w[kofi mei], AW.feed_reactions(d, store)['asha_vent'].map { |r| r['npc'] }
  end

  test 'F16: Ivy likes with her answer, Tomasz sad with his second reply, the angry never comes' do
    d = f16
    store = {}
    %w[ivy tomasz].each { |w| serve(d, store, w) }
    assert_empty rx(d, store), 'Ivy is not done after her vent, so her like waits'
    assert_equal 'ivy_answer', serve(d, store, 'ivy')['post']
    assert_equal [%w[tom_re_ivy ivy like ivy_answer]], rx(d, store)
    assert_equal 'tom_again', serve(d, store, 'tomasz')['post']
    assert_equal [%w[ivy_answer tomasz sad tom_again], %w[tom_re_ivy ivy like ivy_answer]], rx(d, store)
  end

  test 'stability: every step contains the one before, in both request orders' do
    [%w[asha kofi mei], %w[mei kofi asha], %w[kofi asha mei]].each do |order|
      d = f15
      store = {}
      prev = []
      order.each do |w|
        serve(d, store, w)
        now = rx(d, store)
        assert_empty prev - now, "#{order}: a reaction moved or vanished"
        prev = now
      end
    end
    [%w[ivy tomasz ivy tomasz], %w[tomasz ivy tomasz ivy]].each do |order|
      d = f16
      store = {}
      prev = []
      order.each do |w|
        serve(d, store, w)
        now = rx(d, store)
        assert_empty prev - now
        prev = now
      end
    end
  end

  # ── the done-before rule ──

  def two(x_posts, x_reacts, t_posts = [ordered('t1')])
    data([npc('t', t_posts), npc('x', x_posts, reacts: x_reacts)])
  end

  test 'a to reaction comes with the reactor\'s first post after its target, not before' do
    d = two([ordered('x1'), ordered('x2'), ordered('x3')], [{ 'to' => 't1', 'key' => 'like' }])
    store = {}
    serve(d, store, 'x')
    serve(d, store, 't')
    assert_empty rx(d, store)
    serve(d, store, 'x')
    assert_equal [%w[t1 x like x2]], rx(d, store)
    serve(d, store, 'x')
    assert_equal [%w[t1 x like x2]], rx(d, store)
  end

  test 'done before the target: reacts with the target; done after: with its next post' do
    d = two([ordered('x1')], [{ 'to' => 't1', 'key' => 'like' }])
    store = {}
    serve(d, store, 'x')
    serve(d, store, 't')
    assert_equal [%w[t1 x like t1]], rx(d, store)
    assert_equal [%w[t1 x like t1]], rx(d, store, via: 't1')

    d = two([ordered('x1'), ordered('x2')], [{ 'to' => 't1', 'key' => 'like' }])
    store = {}
    serve(d, store, 'x')
    serve(d, store, 't')
    serve(d, store, 'x')
    assert_equal [%w[t1 x like x2]], rx(d, store)
  end

  test 'not done and no later post gives nothing; done with no post served gives nothing' do
    d = two([ordered('x1'), own('x2', NEVER.merge('need' => 'work')), own('x3')], [{ 'to' => 't1', 'key' => 'like' }])
    store = {}
    assert_equal 'x3', serve(d, store, 'x')['post']
    serve(d, store, 't')
    refute AW.feed_done?(d, AW.room_npc(d, 'x'), ['x3'])
    assert_empty rx(d, store)

    d = two([own('x1', NEVER)], [{ 'to' => 't1', 'key' => 'like' }])
    assert AW.feed_done?(d, AW.room_npc(d, 'x'), [])
    store = {}
    serve(d, store, 't')
    assert_empty rx(d, store)
  end

  test 'feed_done? is pure and monotone over every subset of each fixture feed' do
    feeds = f15['rooms']['r1']['npcs'] + f16['rooms']['r1']['npcs'] +
            [npc('u', [ordered('u1'), own('u2', NEVER), own('u3')]), npc('o', [ordered('o1'), ordered('o2')])]
    d = data(feeds)
    feeds.each do |n|
      ids = AW.feed_posts(n).map { |p| p['id'] }
      subsets = (0..ids.size).flat_map { |k| ids.combination(k).to_a }
      subsets.each do |s|
        a = AW.feed_done?(d, n, s)
        assert_equal a, AW.feed_done?(d, n, s.dup), 'pure'
        next unless a

        subsets.select { |b| (s - b).empty? }.each do |sup|
          assert AW.feed_done?(d, n, sup), "#{n['id']}: #{sup} is a superset of #{s} but not done"
        end
      end
    end
  end

  # ── targets ──

  test 'the reactor\'s own post is never a target, and another site gives nothing' do
    d = data([npc('t', [ordered('t1')], site: 'other'),
              npc('x', [ordered('x1'), ordered('x2'), ordered('x3')], reacts: [{ 'to' => 'x1', 'key' => 'like' }, { 'to' => 't1', 'key' => 'sad' }])])
    store = {}
    serve(d, store, 'x')
    serve(d, store, 't')
    serve(d, store, 'x')
    serve(d, store, 'x')
    assert_empty rx(d, store)
  end

  test 'a reaction to a reply and to an answer' do
    d = f16(tom_reacts: [{ 'to' => 'ivy_answer', 'key' => 'laugh' }], ivy_reacts: [{ 'to' => 'tom_re_ivy', 'key' => 'like' }])
    store = {}
    %w[ivy tomasz ivy tomasz].each { |w| serve(d, store, w) }
    assert_equal [%w[ivy_answer tomasz laugh tom_again], %w[tom_re_ivy ivy like ivy_answer]], rx(d, store)
  end

  test 'toComplaint picks the oldest served vent that is not the reactor\'s; with alongside the oldest before it' do
    d = data([npc('a', [ordered('a1'), own('a_vent', DOWN, 'complaint' => 'c')]),
              npc('b', [own('b_vent', DOWN, 'complaint' => 'c')]),
              npc('x', [own('x_vent', DOWN, 'complaint' => 'c'), ordered('x1'), ordered('x2')],
                  reacts: [{ 'toComplaint' => 'c', 'key' => 'sad' }])])
    store = {}
    serve(d, store, 'x') # x_vent (reactive first)
    serve(d, store, 'b')
    serve(d, store, 'a') # a1
    serve(d, store, 'a') # a_vent
    serve(d, store, 'x') # x1
    assert_equal [%w[b_vent x sad x1]], rx(d, store)

    d['rooms']['r1']['npcs'][2]['feed']['reacts'] = [{ 'toComplaint' => 'c', 'key' => 'sad', 'alongside' => 'x1' }]
    assert_equal [%w[b_vent x sad x1]], rx(d, store)
  end

  test 'alongside: only with that post, never when spent or unserved, never before its target' do
    d = data([npc('t', [ordered('t1')]),
              npc('x', [ordered('x1'), ordered('x2')], reacts: [{ 'to' => 't1', 'key' => 'like', 'alongside' => 'x1' }])])
    store = {}
    serve(d, store, 'x')
    serve(d, store, 't')
    serve(d, store, 'x')
    assert_empty rx(d, store), 'x1 came before t1'
    d['rooms']['r1']['npcs'][1]['feed']['reacts'][0]['alongside'] = 'x2'
    assert_equal [%w[t1 x like x2]], rx(d, store)
    d['rooms']['r1']['npcs'][1]['feed']['reacts'][0]['alongside'] = 'x9'
    assert_empty rx(d, store)
    # Spent: Tomasz's angry rides tom_still, but tom_again filled its slot
    d = f16
    store = {}
    %w[ivy tomasz ivy tomasz].each { |w| serve(d, store, w) }
    refute(rx(d, store).any? { |r| r[2] == 'angry' })
  end

  test 'one per reactor and post: lowest seq(V) wins, then authored order' do
    d = two([ordered('x1')], [{ 'to' => 't1', 'key' => 'like', 'alongside' => 'x1' }, { 'to' => 't1', 'key' => 'sad' }])
    store = {}
    serve(d, store, 'x')
    serve(d, store, 't')
    assert_equal [%w[t1 x sad t1]], rx(d, store), 'the with-target plain reaction wins; the alongside one never qualifies'

    d = two([ordered('x1'), ordered('x2')], [{ 'to' => 't1', 'key' => 'angry', 'alongside' => 'x2' }, { 'to' => 't1', 'key' => 'sad' }])
    store = {}
    %w[x t x].each { |w| serve(d, store, w) }
    assert_equal [%w[t1 x angry x2]], rx(d, store), 'same V, earlier authored wins'
  end

  test 'via is applied after the dedupe: a loser whose via is the filtered post never appears' do
    d = two([ordered('x1'), ordered('x2'), ordered('x3')],
            [{ 'to' => 't1', 'key' => 'sad' }, { 'to' => 't1', 'key' => 'like', 'alongside' => 'x3' }])
    store = {}
    %w[x t x x].each { |w| serve(d, store, w) }
    assert_equal [%w[t1 x sad x2]], rx(d, store)
    assert_empty rx(d, store, via: 'x3')
    full = AW.feed_reactions(d, store)
    map = AW.revealed_map(d, store)
    %w[x1 x2 x3 t1].each do |v|
      want = full.transform_values { |l| l.select { |r| r['via'] == v } }.reject { |_k, l| l.empty? }
      assert_equal want, AW.feed_reactions(d, store, revealed: map, via: v)
    end
  end

  test 'the route\'s post-write map (pre-write map plus the new entry) equals revealed_map of the written store' do
    d = f16
    store = {}
    %w[ivy tomasz ivy].each do |w|
      before = AW.revealed_map(d, store)
      res = serve(d, store, w)
      added = before.merge(res['post'] => { 'npc' => w, 'seq' => store[w]['seq'][res['post']],
                                             'to' => res['to'] && res['to']['post'],
                                             'reply' => AW.reply_post?(AW.feed_posts(AW.room_npc(d, w)).find { |p| p['id'] == res['post'] }) })
      assert_equal AW.revealed_map(d, store), added
    end
  end

  # ── saves from before C3, drawability, junk ──

  test 'a save with no seq derives nothing; a mixed save counts no-seq posts only for done-before' do
    d = two([ordered('x1')], [{ 'to' => 't1', 'key' => 'like' }])
    store = { 'x' => { 'shown' => ['x1'], 'at' => 0 }, 't' => { 'shown' => ['t1'], 'at' => 0 } }
    assert_empty rx(d, store)
    store['t']['seq'] = { 't1' => 1 }
    assert_equal [%w[t1 x like t1]], rx(d, store), 'x1 has no seq, counts as below t1 and x is done'
    store = { 'x' => { 'shown' => ['x1'], 'at' => 0, 'seq' => { 'x1' => 2 } }, 't' => { 'shown' => ['t1'], 'at' => 0 } }
    assert_empty rx(d, store), 'a no-seq post is never a target'
  end

  test 'drawable: each condition alone stops a post being a T or a V' do
    d = f16
    store = {}
    %w[ivy tomasz ivy].each { |w| serve(d, store, w) }
    assert_equal [%w[tom_re_ivy ivy like ivy_answer]], rx(d, store)

    # A V (Ivy's answer) whose stored `to` names an unserved post, then a non-room NPC
    s2 = store.deep_dup
    s2['ivy']['to']['ivy_answer'] = { 'post' => 'nope', 'npc' => 'tomasz' }
    assert_empty rx(d, s2)
    s3 = store.deep_dup
    s3['ivy']['to']['ivy_answer'] = { 'post' => 'ivy_vent', 'npc' => 'ghost' }
    assert_empty rx(d, s3)
    # A T (Tomasz's reply) with no stored `to` and no usable replyTo fallback
    s4 = store.deep_dup
    s4['tomasz']['to'] = {}
    d4 = d.deep_dup
    d4['rooms']['r1']['npcs'][1]['feed']['posts'][1].delete('replyTo')
    d4['rooms']['r1']['npcs'][1]['feed']['posts'][1]['replyToComplaint'] = 'zz'
    assert_empty rx(d4, s4)
    # An NPC that no longer feeds
    d5 = d.deep_dup
    d5['rooms']['r1']['npcs'][1]['needs'].delete('social_media')
    assert_empty rx(d5, store)
    # A reactor whose feed.person is not a non-empty string
    d6 = d.deep_dup
    d6['rooms']['r1']['npcs'][0]['feed']['person'] = 7
    assert_empty rx(d6, store)
  end

  test 'junk reacts is skipped or its extra field ignored, never raised on' do
    junk = ['nope', 7, nil, { 'to' => 't1' }, { 'to' => 't1', 'toComplaint' => 'c', 'key' => 'like' },
            { 'to' => 't1', 'key' => 'love' }, { 'to' => '', 'key' => 'like' }, { 'to' => 't1', 'key' => 'sad', 'alongside' => 3 }]
    d = two([ordered('x1')], junk + [{ 'to' => 't1', 'key' => 'laugh', 'extra' => true }])
    store = {}
    serve(d, store, 'x')
    serve(d, store, 't')
    assert_equal [%w[t1 x laugh t1]], rx(d, store)
    d['rooms']['r1']['npcs'][1]['feed']['reacts'] = 'not an array'
    assert_empty rx(d, store)
    assert_equal({}, AW.feed_reactions(d, nil))
  end

  test 'REACTION_KEYS is the four keys in display order' do
    assert_equal %w[like laugh sad angry], AW::REACTION_KEYS
  end
end
