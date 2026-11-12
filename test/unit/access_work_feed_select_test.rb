require 'test_helper'

# Access model slice 9.2 C2 (ACCESS_MODEL_SLICE_9_2_C2_PLAN.md sections 3 and 4): the pure
# AccessWork.select_feed_post over hand-built feeds, feedRevealed, npcFrustration, globals and
# lockout keys. One case per order mode asserts the exact served sequence; the condition
# predicates and the `done` rule are pinned here, with no database.
class AccessWorkFeedSelectTest < ActiveSupport::TestCase
  AW = BreakEscape::AccessWork

  def data(globals = {})
    { 'resources' => { 'srv' => { 'id' => 'srv', 'downIf' => 'srv_down' },
                       'printer' => { 'id' => 'printer', 'downIf' => 'printer_down' } },
      'globalVariables' => { 'srv_down' => false, 'printer_down' => false, 'calm' => false }.merge(globals) }
  end

  # a feed NPC with a work plan on `srv` and a social_media need; `posts` and `order` are given
  def npc(posts, order: nil, work: %w[srv], workarounds: nil)
    feed = { 'site' => 'friendface', 'person' => 'jake', 'posts' => posts }
    feed['order'] = order if order
    n = { 'id' => 'jake', 'needs' => { 'work' => {}, 'social_media' => { 'decayPerMin' => 4, 'urgentAt' => 40 } },
          'workNeeds' => work, 'feed' => feed }
    n['workarounds'] = workarounds if workarounds
    n
  end

  def o(id)
    { 'id' => id, 'text' => "ordered post #{id} long enough" }
  end

  def r(id, cond)
    { 'id' => id, 'text' => "reactive post #{id} long enough", 'when' => cond }
  end

  def entry(failwhy: {}, level: 0, easeat: {}, failat: {}, done: [], last: {})
    { 'level' => level, 'failWhy' => failwhy, 'easeAt' => easeat, 'failAt' => failat, 'done' => done, 'lastSpent' => last }
  end

  # Serve repeatedly, appending each chosen id, until nothing is served; returns [sequence, done]
  def serve_all(d, n, fe, globals, keys = [])
    shown = []
    final_done = nil
    loop do
      res = AW.select_feed_post(d, n, { 'shown' => shown }, fe, globals, keys)
      final_done = res['done']
      break if res['post'].nil?

      shown << res['post']
    end
    [shown, final_done]
  end

  # authored order [o1, r1, o2]; r1 fires on a live `down`
  def mixed_feed(order)
    npc([o('o1'), r('r1', { 'cause' => 'down', 'need' => 'work' }), o('o2')], order: order)
  end

  def down_entry
    entry(failwhy: { 'work' => ['down'] })
  end

  test 'facts_first drains the ordered queue before any reactive post' do
    n = mixed_feed('facts_first')
    seq, done = serve_all(data('srv_down' => true), n, down_entry, data('srv_down' => true)['globalVariables'])
    assert_equal %w[o1 o2 r1], seq
    assert_equal true, done
  end

  test 'facts_first is the default order' do
    n = mixed_feed(nil)
    seq, = serve_all(data('srv_down' => true), n, down_entry, data('srv_down' => true)['globalVariables'])
    assert_equal %w[o1 o2 r1], seq
  end

  test 'reactive_first lets an eligible reactive post jump the ordered queue' do
    n = mixed_feed('reactive_first')
    seq, = serve_all(data('srv_down' => true), n, down_entry, data('srv_down' => true)['globalVariables'])
    assert_equal %w[r1 o1 o2], seq
  end

  test 'mixed honours authored position for an eligible reactive post' do
    n = mixed_feed('mixed')
    seq, = serve_all(data('srv_down' => true), n, down_entry, data('srv_down' => true)['globalVariables'])
    assert_equal %w[o1 r1 o2], seq
  end

  test 'mixed skips an un-true reactive post and picks it up on a later reveal' do
    n = mixed_feed('mixed')
    g = data['globalVariables'] # srv_down false: r1 not eligible yet
    # First drain what is eligible now: o1, o2 (r1 skipped), done stays false (r1 still reachable)
    res1 = AW.select_feed_post(data, n, { 'shown' => [] }, down_entry, g)
    assert_equal 'o1', res1['post']
    res2 = AW.select_feed_post(data, n, { 'shown' => %w[o1] }, down_entry, g)
    assert_equal 'o2', res2['post']
    res3 = AW.select_feed_post(data, n, { 'shown' => %w[o1 o2] }, down_entry, g)
    assert_nil res3['post']
    assert_equal false, res3['done'], 'r1 is reachable but not yet true'
    # Now the outage holds: r1 becomes eligible and is served
    gd = data('srv_down' => true)['globalVariables']
    res4 = AW.select_feed_post(data('srv_down' => true), n, { 'shown' => %w[o1 o2] }, down_entry, gd)
    assert_equal 'r1', res4['post']
    assert_equal true, res4['done']
  end

  test 'cause fires only while a down cause is live, and stops after the need is met again' do
    n = npc([r('vent', { 'cause' => 'down', 'need' => 'work' })], order: 'reactive_first')
    gd = data('srv_down' => true)['globalVariables']
    # down holds and the NPC has failed at it
    assert_equal 'vent', AW.select_feed_post(data('srv_down' => true), n, { 'shown' => [] }, down_entry, gd)['post']
    # the cause cleared (global false now): the live enumeration no longer holds
    assert_nil AW.select_feed_post(data, n, { 'shown' => [] }, down_entry, data['globalVariables'])['post']
  end

  test 'cause does not fire while the cause holds but the NPC has not yet failed at it' do
    n = npc([r('vent', { 'cause' => 'down', 'need' => 'work' })], order: 'reactive_first')
    gd = data('srv_down' => true)['globalVariables']
    # down holds but failWhy is empty: no counted failure has recorded the why yet
    assert_nil AW.select_feed_post(data('srv_down' => true), n, { 'shown' => [] }, entry, gd)['post']
    # once a failure records the why, it fires
    assert_equal 'vent', AW.select_feed_post(data('srv_down' => true), n, { 'shown' => [] }, down_entry, gd)['post']
  end

  test 'a two-down-able-resource cause holds while either resource is down' do
    n = npc([r('vent', { 'cause' => 'down', 'need' => 'work' })], order: 'reactive_first', work: %w[srv printer])
    fe = entry(failwhy: { 'work' => ['down'] })
    # only the printer is down
    gp = data('printer_down' => true)['globalVariables']
    assert_equal 'vent', AW.select_feed_post(data('printer_down' => true), n, { 'shown' => [] }, fe, gp)['post']
    # neither down: nothing fires
    assert_nil AW.select_feed_post(data, n, { 'shown' => [] }, fe, data['globalVariables'])['post']
  end

  test 'frustrationAtLeast and frustrationBelow read the entry level and are false with no entry' do
    atl = npc([r('hot', { 'frustrationAtLeast' => 50 })], order: 'reactive_first')
    assert_equal 'hot', AW.select_feed_post(data, atl, { 'shown' => [] }, entry(level: 60), data['globalVariables'])['post']
    assert_nil AW.select_feed_post(data, atl, { 'shown' => [] }, entry(level: 40), data['globalVariables'])['post']
    assert_nil AW.select_feed_post(data, atl, { 'shown' => [] }, nil, data['globalVariables'])['post']
    below = npc([r('calm', { 'frustrationBelow' => 20 })], order: 'reactive_first')
    assert_equal 'calm', AW.select_feed_post(data, below, { 'shown' => [] }, entry(level: 10), data['globalVariables'])['post']
    assert_nil AW.select_feed_post(data, below, { 'shown' => [] }, nil, data['globalVariables'])['post'], 'false before any entry'
  end

  test 'workaround holds for a lasting kind in done and a repeating kind in lastSpent' do
    was = [{ 'do' => 'borrow_session', 'pc' => 'ian_pc' }]
    n = npc([r('borrowed', { 'workaround' => 'borrow_session' })], order: 'reactive_first', workarounds: was)
    assert_nil AW.select_feed_post(data, n, { 'shown' => [] }, entry, data['globalVariables'])['post']
    done = AW.select_feed_post(data, n, { 'shown' => [] }, entry(done: [0]), data['globalVariables'])
    assert_equal 'borrowed', done['post']
    spent = AW.select_feed_post(data, n, { 'shown' => [] }, entry(last: { '0' => { 'done' => true } }), data['globalVariables'])
    assert_equal 'borrowed', spent['post']
  end

  test 'needMet holds only when the need failed and then recovered (easeAt later than failAt)' do
    n = npc([r('fixed', { 'needMet' => 'work' })], order: 'reactive_first')
    none = AW.select_feed_post(data, n, { 'shown' => [] }, entry(failat: { 'work' => 10 }), data['globalVariables'])
    assert_nil none['post'], 'failed but not yet eased'
    met = AW.select_feed_post(data, n, { 'shown' => [] }, entry(failat: { 'work' => 10 }, easeat: { 'work' => 20 }), data['globalVariables'])
    assert_equal 'fixed', met['post']
  end

  test 'needMet also holds after a workaround-driven ease while the cause still holds (author caveat)' do
    n = npc([r('fixed', { 'needMet' => 'work' })], order: 'reactive_first')
    gd = data('srv_down' => true)['globalVariables']
    fe = entry(failat: { 'work' => 10 }, easeat: { 'work' => 20 }, failwhy: { 'work' => ['down'] })
    assert_equal 'fixed', AW.select_feed_post(data('srv_down' => true), n, { 'shown' => [] }, fe, gd)['post']
  end

  test 'global reads the merged globals and fires before any frustration entry' do
    n = npc([r('party', { 'global' => 'calm' })], order: 'reactive_first')
    gd = data('calm' => true)['globalVariables']
    assert_equal 'party', AW.select_feed_post(data('calm' => true), n, { 'shown' => [] }, nil, gd)['post']
    assert_nil AW.select_feed_post(data, n, { 'shown' => [] }, nil, data['globalVariables'])['post']
  end

  test 'done: only once the ordered queue is spent and every reactive post is shown or dead' do
    # a reactive post gated on an undeclared global is statically dead, so it never holds the feed open
    dead = npc([o('o1'), r('never', { 'global' => 'undeclared' })], order: 'facts_first')
    seq, done = serve_all(data, dead, entry, data['globalVariables'])
    assert_equal %w[o1], seq
    assert_equal true, done, 'the dead reactive post does not keep the feed open'
    # a reachable but un-triggered reactive post keeps done false
    live = npc([o('o1'), r('vent', { 'cause' => 'down', 'need' => 'work' })], order: 'facts_first')
    res = AW.select_feed_post(data, live, { 'shown' => %w[o1] }, down_entry, data['globalVariables'])
    assert_nil res['post']
    assert_equal false, res['done'], 'the reactive post is reachable, so the feed stays open'
  end

  test 'feed_shown_ids migrates a C-shape { n, at } to the first n ordered ids' do
    n = mixed_feed('mixed') # authored [o1, r1, o2]; ordered ids are o1, o2
    assert_equal %w[o1], AW.feed_shown_ids(n, { 'n' => 1, 'at' => 0 })
    assert_equal %w[o1 o2], AW.feed_shown_ids(n, { 'n' => 2, 'at' => 0 })
    assert_equal %w[r1 o1], AW.feed_shown_ids(n, { 'shown' => %w[r1 o1] }), 'the new shape is used verbatim'
  end
end
