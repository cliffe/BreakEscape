require 'test_helper'

# Access model slice 9.2 C3 (ACCESS_MODEL_SLICE_9_2_C3_PLAN.md section 3): replies between NPCs,
# chosen by the pure AccessWork.select_feed_post over hand-built feeds and a hand-built
# feedRevealed record. `serve` plays the route's write (shown, seq, to) so request orders can be
# replayed exactly, with no database.
class AccessWorkFeedReplyTest < ActiveSupport::TestCase
  AW = BreakEscape::AccessWork
  DOWN = { 'cause' => 'down', 'need' => 'work' }.freeze

  def npc(id, posts, order: 'reactive_first', site: 'friendface', display: nil)
    n = { 'id' => id, 'needs' => { 'work' => {}, 'social_media' => { 'decayPerMin' => 60, 'urgentAt' => 40 } },
          'workNeeds' => %w[srv], 'feed' => { 'site' => site, 'person' => id, 'posts' => posts, 'order' => order } }
    n['displayName'] = display if display
    n
  end

  def data(npcs, social: nil)
    d = { 'resources' => { 'srv' => { 'id' => 'srv', 'downIf' => 'srv_down' } },
          'globalVariables' => { 'srv_down' => true },
          'rooms' => { 'r1' => { 'npcs' => npcs } } }
    d['social'] = social if social
    d
  end

  def own(id, cond = DOWN, extra = {})
    { 'id' => id, 'text' => "own post #{id} long enough", 'when' => cond }.merge(extra)
  end

  def ordered(id)
    { 'id' => id, 'text' => "ordered post #{id} long enough" }
  end

  def re_to(id, target, instead, cond = DOWN, extra = {})
    { 'id' => id, 'text' => "{name}, reply #{id} long enough", 'replyTo' => target, 'insteadOf' => instead,
      'when' => cond }.merge(extra)
  end

  def re_c(id, complaint, instead, cond = DOWN)
    { 'id' => id, 'text' => "{name}, reply #{id} long enough", 'replyToComplaint' => complaint,
      'insteadOf' => instead, 'when' => cond }
  end

  def down_entry
    { 'level' => 0, 'failWhy' => { 'work' => ['down'] }, 'easeAt' => {}, 'failAt' => {}, 'done' => [], 'lastSpent' => {} }
  end

  # One met use for `npc_id`, written as the route writes it. Returns the selection result.
  def serve(d, store, npc_id, frustration: down_entry)
    n = AW.room_npc(d, npc_id)
    entry = store[npc_id] || {}
    res = AW.select_feed_post(d, n, entry, frustration, d['globalVariables'], [], nil,
                              revealed: AW.revealed_map(d, store))
    return res if res['post'].nil?

    seq = AW.next_seq(store)
    to = AW.feed_to_map(entry)
    to = to.merge(res['post'] => res['to']) if res['to']
    store[npc_id] = { 'shown' => AW.feed_shown_ids(n, entry) + [res['post']], 'at' => 0,
                      'seq' => AW.feed_seq_map(entry).merge(res['post'] => seq), 'to' => to }
    res
  end

  def ids(results)
    results.map { |r| r['post'] }
  end

  # ── Ivy and Tomasz: a mutual pair, the answer and the second reply (section 2) ──

  def pair(tom_second: true, ivy_answer: true)
    ivy = [own('ivy_vent'), re_to('ivy_re_tom', 'tom_vent', 'ivy_vent'), own('ivy_still')]
    ivy << re_to('ivy_answer', 'ivy_vent', 'ivy_still') if ivy_answer
    tom = [own('tom_vent'), re_to('tom_re_ivy', 'ivy_vent', 'tom_vent'), own('tom_still')]
    tom << re_to('tom_again', 'ivy_vent', 'tom_still') if tom_second
    data([npc('tomasz', tom), npc('ivy', ivy)])
  end

  test 'a reply is not served until its thread is open, then fills its post slot' do
    d = pair
    store = {}
    assert_equal 'ivy_vent', serve(d, store, 'ivy')['post']
    res = serve(d, store, 'tomasz')
    assert_equal 'tom_re_ivy', res['post']
    assert_equal({ 'post' => 'ivy_vent', 'npc' => 'ivy' }, res['to'])
  end

  test 'mutual pair, Ivy first: reply, answer, second reply, and both feeds finish' do
    d = pair
    store = {}
    seq = %w[ivy tomasz ivy tomasz].map { |who| serve(d, store, who) }
    assert_equal %w[ivy_vent tom_re_ivy ivy_answer tom_again], ids(seq)
    assert_equal({ 'post' => 'ivy_vent', 'npc' => 'tomasz' }, seq[2]['to'])
    assert_equal({ 'post' => 'ivy_vent', 'npc' => 'ivy' }, seq[3]['to'])
    assert seq[2]['done'] && seq[3]['done']
    assert_nil serve(d, store, 'ivy')['post']
    assert_nil serve(d, store, 'tomasz')['post']
    assert_equal [1, 2, 3, 4], %w[ivy_vent tom_re_ivy ivy_answer tom_again].map { |i| AW.revealed_map(d, store)[i]['seq'] }
  end

  test 'mutual pair, Tomasz first: the mirror image, and the answer and second reply come out as own posts' do
    d = pair
    store = {}
    seq = %w[tomasz ivy ivy tomasz].map { |who| serve(d, store, who) }
    assert_equal %w[tom_vent ivy_re_tom ivy_still tom_still], ids(seq)
    assert seq.last['done']
  end

  test 'a second reply waits for the answer: due first, its post comes out and the reply is spent' do
    d = pair
    store = {}
    assert_equal %w[ivy_vent tom_re_ivy tom_still], ids(%w[ivy tomasz tomasz].map { |w| serve(d, store, w) })
    assert_equal 'ivy_answer', serve(d, store, 'ivy')['post']
    assert_nil serve(d, store, 'tomasz')['post']
    assert AW.feed_done?(d, AW.room_npc(d, 'tomasz'), store['tomasz']['shown'])
  end

  test 'one-way link with the replier first: both vent' do
    ivy = [own('ivy_vent')]
    tom = [own('tom_vent'), re_to('tom_re_ivy', 'ivy_vent', 'tom_vent')]
    d = data([npc('tomasz', tom), npc('ivy', ivy)])
    store = {}
    assert_equal %w[tom_vent ivy_vent], ids([serve(d, store, 'tomasz'), serve(d, store, 'ivy')])
  end

  test 'an answer is closed until another NPC replies, and comes out as its post when the thread post was never served' do
    d = pair
    store = {}
    serve(d, store, 'ivy')
    assert_equal 'ivy_still', serve(d, store, 'ivy')['post'], 'no reply yet: the answer is spent'
    assert_equal 'tom_re_ivy', serve(d, store, 'tomasz')['post']
    # Tomasz first: Ivy replies, and her answer names her own vent, never served
    store2 = {}
    assert_equal %w[tom_vent ivy_re_tom ivy_still], ids(%w[tomasz ivy ivy].map { |w| serve(d, store2, w) })
  end

  # ── The complaint shorthand (q66) ──

  def complaint(extra = {})
    npcs = %w[asha kofi mei].map do |w|
      posts = [own("#{w}_vent", DOWN, 'complaint' => 'drive'), re_c("#{w}_re", 'drive', "#{w}_vent")]
      posts += extra[w] || []
      npc(w, posts)
    end
    data(npcs)
  end

  test 'complaint of three in all six request orders: one vent, two replies into it, every feed finishes' do
    %w[asha kofi mei].permutation.each do |order|
      d = complaint
      store = {}
      res = order.map { |w| serve(d, store, w) }
      assert_equal "#{order[0]}_vent", res[0]['post'], order.inspect
      assert_equal ["#{order[1]}_re", "#{order[2]}_re"], ids(res[1..]), order.inspect
      res[1..].each { |r| assert_equal({ 'post' => "#{order[0]}_vent", 'npc' => order[0] }, r['to']) }
      assert(res.all? { |r| r['done'] }, order.inspect)
    end
  end

  test 'three-NPC complaint: a second complaint reply waits for the poster, not a third NPC' do
    extra = { 'kofi' => [own('kofi_later'), re_c('kofi_again', 'drive', 'kofi_later')],
              'asha' => [own('asha_later'), re_c('asha_answer', 'drive', 'asha_later')] }
    d = complaint(extra)
    store = {}
    assert_equal %w[asha_vent kofi_re mei_re kofi_later], ids(%w[asha kofi mei kofi].map { |w| serve(d, store, w) })

    d = complaint(extra)
    store = {}
    %w[asha kofi mei].each { |w| serve(d, store, w) }
    # asha_answer here is a complaint reply: her own vent is excluded and no other vent is out
    assert_equal 'asha_later', serve(d, store, 'asha')['post']
    assert_equal 'kofi_later', serve(d, store, 'kofi')['post']
  end

  test 'three-NPC complaint: with the poster answer out after Mei, Kofi replies again into the thread' do
    extra = { 'kofi' => [own('kofi_later'), re_c('kofi_again', 'drive', 'kofi_later')],
              'asha' => [own('asha_later'), re_to('asha_answer', 'asha_vent', 'asha_later')] }
    d = complaint(extra)
    store = {}
    res = %w[asha kofi mei asha kofi].map { |w| serve(d, store, w) }
    assert_equal %w[asha_vent kofi_re mei_re asha_answer kofi_again], ids(res)
    assert_equal({ 'post' => 'asha_vent', 'npc' => 'mei' }, res[3]['to'], 'answer names the newest replier')
    assert_equal({ 'post' => 'asha_vent', 'npc' => 'asha' }, res[4]['to'])
  end

  test 'named threads: a third NPC reply does not open a second reply; the answer does' do
    ivy = [own('ivy_vent'), own('ivy_still'), re_to('ivy_answer', 'ivy_vent', 'ivy_still')]
    tom = [own('tom_vent'), re_to('tom_re', 'ivy_vent', 'tom_vent'), own('tom_still'), re_to('tom_again', 'ivy_vent', 'tom_still')]
    zed = [own('zed_vent'), re_to('zed_re', 'ivy_vent', 'zed_vent')]
    d = data([npc('ivy', ivy), npc('tomasz', tom), npc('zed', zed)])
    store = {}
    assert_equal %w[ivy_vent tom_re zed_re], ids(%w[ivy tomasz zed].map { |w| serve(d, store, w) })
    probe = store.deep_dup
    assert_equal 'tom_still', serve(d, probe, 'tomasz')['post']
    assert_equal 'ivy_answer', serve(d, store, 'ivy')['post']
    assert_equal 'tom_again', serve(d, store, 'tomasz')['post']
  end

  test 'a second complaint reply whose first thread is closed joins another served vent where it has not spoken' do
    extra = { 'kofi' => [own('kofi_later'), re_c('kofi_again', 'drive', 'kofi_later')] }
    d = complaint(extra)
    store = {}
    serve(d, store, 'asha')
    serve(d, store, 'kofi')
    # Mei's vent comes out on its own (an edited order: Mei's reply already spent elsewhere)
    store['mei'] = { 'shown' => ['mei_vent'], 'at' => 0, 'seq' => { 'mei_vent' => 3 }, 'to' => {} }
    res = serve(d, store, 'kofi')
    assert_equal 'kofi_again', res['post']
    assert_equal({ 'post' => 'mei_vent', 'npc' => 'mei' }, res['to'])
  end

  test 'two candidate threads: the lower seq wins, and authored order breaks a tie' do
    d = complaint
    store = { 'asha' => { 'shown' => ['asha_vent'], 'seq' => { 'asha_vent' => 5 } },
              'mei' => { 'shown' => ['mei_vent'], 'seq' => { 'mei_vent' => 2 } } }
    assert_equal({ 'post' => 'mei_vent', 'npc' => 'mei' }, serve(d, store.deep_dup, 'kofi')['to'])
    kofi = [own('kofi_vent'), re_to('kofi_a', 'asha_vent', 'kofi_vent'), re_to('kofi_m', 'mei_vent', 'kofi_vent')]
    d2 = data([npc('asha', [own('asha_vent')]), npc('mei', [own('mei_vent')]), npc('kofi', kofi)])
    tie = { 'asha' => { 'shown' => ['asha_vent'], 'seq' => { 'asha_vent' => 4 } },
            'mei' => { 'shown' => ['mei_vent'], 'seq' => { 'mei_vent' => 4 } } }
    assert_equal 'kofi_a', serve(d2, tie, 'kofi')['post']
  end

  test 'a second answer waits for a further reply by another NPC' do
    ivy = [own('ivy_vent'), own('ivy_s1'), re_to('ivy_a1', 'ivy_vent', 'ivy_s1'), own('ivy_s2'), re_to('ivy_a2', 'ivy_vent', 'ivy_s2')]
    tom = [own('tom_vent'), re_to('tom_re', 'ivy_vent', 'tom_vent'), own('tom_s'), re_to('tom_again', 'ivy_vent', 'tom_s')]
    d = data([npc('ivy', ivy), npc('tomasz', tom)])
    store = {}
    assert_equal %w[ivy_vent tom_re ivy_a1], ids(%w[ivy tomasz ivy].map { |w| serve(d, store, w) })
    probe = store.deep_dup
    assert_equal 'ivy_s2', serve(d, probe, 'ivy')['post']
    assert_equal 'tom_again', serve(d, store, 'tomasz')['post']
    res = serve(d, store, 'ivy')
    assert_equal 'ivy_a2', res['post']
    assert_equal 'tomasz', res['to']['npc']
  end

  test 'last word: an NPC never follows itself in a thread' do
    words = [{ npc: 'ivy', seq: 1 }, { npc: 'tomasz', seq: 2 }]
    refute AW.thread_open_to?(words, 'ivy', 'tomasz')
    assert AW.thread_open_to?(words, 'ivy', 'ivy')
    refute AW.thread_open_to?([{ npc: 'ivy', seq: 1 }], 'ivy', 'ivy')
  end

  # ── The order modes ──

  test 'substitution in each order mode, with the exact served sequence' do
    { 'reactive_first' => %w[tom_re o1], 'facts_first' => %w[o1 tom_re], 'mixed' => %w[o1 tom_re] }.each do |mode, want|
      tom = [ordered('o1'), own('tom_vent'), re_to('tom_re', 'ivy_vent', 'tom_vent')]
      d = data([npc('ivy', [own('ivy_vent')]), npc('tomasz', tom, order: mode)])
      store = { 'ivy' => { 'shown' => ['ivy_vent'], 'seq' => { 'ivy_vent' => 1 } } }
      assert_equal want, ids([serve(d, store, 'tomasz'), serve(d, store, 'tomasz')]), mode
      assert_nil serve(d, store, 'tomasz')['post']
    end
  end

  test 'mixed: a reply listed before its post does not come out at its own index' do
    tom = [re_to('tom_re', 'ivy_vent', 'tom_vent'), ordered('o1'), own('tom_vent')]
    d = data([npc('ivy', [own('ivy_vent')]), npc('tomasz', tom, order: 'mixed')])
    store = { 'ivy' => { 'shown' => ['ivy_vent'], 'seq' => { 'ivy_vent' => 1 } } }
    assert_equal %w[o1 tom_re], ids([serve(d, store, 'tomasz'), serve(d, store, 'tomasz')])
  end

  test 'a reply whose own when holds while its post does not is not served' do
    tom = [own('tom_vent', { 'global' => 'never_set' }), re_to('tom_re', 'ivy_vent', 'tom_vent')]
    d = data([npc('ivy', [own('ivy_vent')]), npc('tomasz', tom)])
    store = { 'ivy' => { 'shown' => ['ivy_vent'], 'seq' => { 'ivy_vent' => 1 } } }
    assert_nil serve(d, store, 'tomasz')['post']
  end

  test 'a set is spent in both directions' do
    d = pair
    n = AW.room_npc(d, 'tomasz')
    res = AW.select_feed_post(d, n, { 'shown' => ['tom_re_ivy'] }, down_entry, d['globalVariables'])
    assert_equal 'tom_still', res['post'], 'tom_vent is spent by its reply'
    res = AW.select_feed_post(d, n, { 'shown' => ['tom_vent'] }, down_entry, d['globalVariables'],
                              revealed: { 'ivy_vent' => { 'npc' => 'ivy', 'seq' => 1, 'to' => nil, 'reply' => false } })
    assert_equal 'tom_still', res['post'], 'the reply is spent by its post'
  end

  # ── Runtime guards ──

  test 'runtime guards: never served, the post comes out instead and its fact stays grantable' do
    ivy_other = npc('ivy2', [own('ivy2_vent')], site: 'other')
    cases = {
      'another site' => [re_to('re', 'ivy2_vent', 'tom_vent')],
      'own complaint vent' => [re_c('re', 'tc', 'tom_vent')],
      'insteadOf a reply' => [re_to('re0', 'ivy_vent', 'tom_vent'), re_to('re', 'ivy_vent', 're0')],
      'insteadOf its own replyTo' => [re_to('re', 'tom_vent', 'tom_vent')],
      'missing when' => [re_to('re', 'ivy_vent', 'tom_vent').except('when')],
      'both thread fields' => [re_to('re', 'ivy_vent', 'tom_vent').merge('replyToComplaint' => 'x')],
      'no thread field' => [{ 'id' => 're', 'text' => 'stray reply long enough', 'insteadOf' => 'tom_vent', 'when' => DOWN }]
    }
    cases.each do |name, replies|
      tom = [own('tom_vent', DOWN, 'complaint' => 'tc')] + replies
      d = data([npc('ivy', [own('ivy_vent')]), ivy_other, npc('tomasz', tom)])
      store = { 'ivy' => { 'shown' => ['ivy_vent'], 'seq' => { 'ivy_vent' => 1 } },
                'ivy2' => { 'shown' => ['ivy2_vent'], 'seq' => { 'ivy2_vent' => 2 } } }
      res = serve(d, store, 'tomasz')
      assert_equal 'tom_vent', res['post'], name
      assert_nil res['to'], name
    end

    tom = [ordered('o1'), re_to('re', 'ivy_vent', 'o1')]
    d = data([npc('ivy', [own('ivy_vent')]), npc('tomasz', tom)])
    assert_equal 'o1', serve(d, { 'ivy' => { 'shown' => ['ivy_vent'] } }, 'tomasz')['post'], 'insteadOf an ordered post'

    tom = [own('tom_vent', DOWN, 'fact' => 'tom_fact'), re_to('re', 'ivy_vent', 'tom_vent')]
    d = data([npc('ivy', [own('ivy_vent')]), npc('tomasz', tom)])
    assert_equal 'tom_vent', serve(d, { 'ivy' => { 'shown' => ['ivy_vent'] } }, 'tomasz')['post'], 'insteadOf a fact post'
    assert_includes AW.feed_facts(d), 'tom_fact'
  end

  test 'a replyTo naming a served reply is never open' do
    d = pair
    store = {}
    serve(d, store, 'ivy')
    serve(d, store, 'tomasz')
    zed = [own('zed_vent'), re_to('zed_re', 'tom_re_ivy', 'zed_vent')]
    d['rooms']['r1']['npcs'] << npc('zed', zed)
    assert_equal 'zed_vent', serve(d, store, 'zed')['post']
  end

  test 'a post with any reply field is never an own post: shown ids, facts and done skip it' do
    stray = { 'id' => 'stray', 'text' => 'stray reply long enough', 'insteadOf' => 'o1', 'fact' => 'stray_fact' }
    n = npc('jake', [ordered('o1'), stray, ordered('o2')])
    d = data([n])
    assert_equal %w[o1 o2], AW.feed_shown_ids(n, { 'n' => 3 })
    refute_includes AW.feed_facts(d), 'stray_fact'
    store = {}
    assert_equal %w[o1 o2], 3.times.map { serve(d, store, 'jake')['post'] }.compact
    assert AW.feed_done?(d, n, %w[o1 o2])
  end

  test 'feed_done? turns true when the post can never fire, with its reply unshown' do
    tom = [own('tom_vent', { 'global' => 'undeclared_global' }), re_to('tom_re', 'ivy_vent', 'tom_vent')]
    d = data([npc('ivy', [own('ivy_vent')]), npc('tomasz', tom)])
    assert AW.feed_done?(d, AW.room_npc(d, 'tomasz'), [])
  end

  # ── Records and helpers ──

  test 'feed_seq_map and feed_to_map drop junk, and next_seq stops at 2^31 - 1' do
    entry = { 'seq' => { 'a' => 3, '' => 4, 'b' => 0, 'c' => 2**31, 'd' => '5', 'e' => 2**31 - 1 },
              'to' => { 'r' => { 'post' => 'p', 'npc' => 'n' }, 's' => { 'post' => '' }, 't' => 'x', '' => { 'post' => 'p', 'npc' => 'n' } } }
    assert_equal({ 'a' => 3, 'e' => 2**31 - 1 }, AW.feed_seq_map(entry))
    assert_equal({ 'r' => { 'post' => 'p', 'npc' => 'n' } }, AW.feed_to_map(entry))
    assert_equal({}, AW.feed_seq_map({ 'seq' => [1] }))
    assert_equal({}, AW.feed_to_map(nil))
    assert_equal 1, AW.next_seq({})
    assert_equal 4, AW.next_seq({ 'x' => { 'seq' => { 'a' => 3 } }, 'y' => { 'n' => 2, 'at' => 1 } })
    assert_equal 2**31 - 1, AW.next_seq({ 'x' => entry })
  end

  test 'an existing six-argument call still binds lockout_keys' do
    n = npc('jake', [own('p', { 'cause' => 'locked_out', 'need' => 'work' })])
    res = AW.select_feed_post(data([n]), n, {}, down_entry, {}, [])
    assert_nil res['post']
    assert_nil res['to']
  end

  test 'friendface_name takes forms.first, then the profile name, then displayName, then the id' do
    n = npc('asha', [], display: 'Asha Rao')
    site = { 'id' => 'friendface', 'profiles' => [{ 'person' => 'asha', 'name' => 'Asha R.' }] }
    full = { 'people' => [{ 'id' => 'asha', 'forms' => { 'first' => 'Asha' } }], 'osint' => { 'sites' => [site] } }
    assert_equal 'Asha', AW.friendface_name(data([n], social: full), n)
    empty_first = full.merge('people' => [{ 'id' => 'asha', 'forms' => { 'first' => ' ' } }])
    assert_equal 'Asha R.', AW.friendface_name(data([n], social: empty_first), n)
    assert_equal 'Asha Rao', AW.friendface_name(data([n], social: { 'people' => [] }), n)
    assert_equal 'asha', AW.friendface_name(data([n.except('displayName')]), n.except('displayName'))
    long = npc('asha', [], display: "A\u0007sha #{'x' * 60}")
    name = AW.friendface_name(data([long]), long)
    assert_equal 40, name.length
    refute_match(/[[:cntrl:]]/, name)
  end

  test 'set_member_ids lists every reply, one with no insteadOf included, and every post an insteadOf names' do
    n = npc('tomasz', [own('tom_vent'), own('tom_other'), re_to('tom_re', 'ivy_vent', 'tom_vent'),
                       { 'id' => 'loose', 'text' => 'loose reply long enough', 'replyTo' => 'ivy_vent' }])
    assert_equal %w[tom_re loose tom_vent].sort, AW.set_member_ids(n).sort
  end
end
