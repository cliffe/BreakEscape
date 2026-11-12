require 'test_helper'
require 'json'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s
require_relative '../support/access_social_scenario'

# Sub-slice C (ACCESS_MODEL_SLICE_9_2_PLAN.md 9.2 and 11): the leak scanner's feed rules. Each can
# fail (a planted feed text or a fact keyed with its text) and pass (a correct bootstrap whose ids
# and names share words with a fact's labels, and posts after the server served them).
class AccessLeakScannerFeedTest < ActiveSupport::TestCase
  SCENARIO = '/break_escape/games/1/scenario'.freeze
  FEED = '/break_escape/games/1/feed_post'.freeze

  def data
    AccessSocialScenario.scenario
  end

  def rows(*list)
    list.each_with_index.map { |(method, path, body), i| ['r.jsonl', i + 1, { 'method' => method, 'path' => path, 'status' => 200, 'body' => body }] }
  end

  def summary(findings)
    findings.map { |f| [f.line, f.rule, f.owner] }
  end

  def bootstrap
    { 'social' => { 'intelFacts' => { 'jake_office' => data['social']['intelFacts']['jake_office'] } },
      'rooms' => { 'office' => { 'type' => 'room_office' } }, 'feedPosts' => {} }
  end

  def first_answer
    entry = data['social']['intelFacts']['jake_pet_name']
    { 'npcId' => 'jake', 'index' => 0, 'post' => { 'id' => 'jake_post_1', 'text' => AccessSocialScenario::POSTS[0], 'fact' => 'jake_pet_name' },
      'fact' => { 'id' => 'jake_pet_name', 'entry' => entry }, 'site' => 'friendface', 'person' => 'jake', 'done' => false }
  end

  test 'counts every feed post and feed fact' do
    c = AccessLeakScanner.new(data).counts
    assert_equal 5, c[:feed_posts], 'jake 3, lena 1, omar 1'
    assert_equal 2, c[:feed_facts]
  end

  test "a feed fact's text planted in a bootstrap is reported" do
    b = bootstrap
    b['social']['intelBoard'] = { 'hint' => AccessSocialScenario::FACT_TEXTS['jake_pet_name'] }
    assert_equal [[1, 'feed_text', 'fact:jake_pet_name']], summary(AccessLeakScanner.new(data).scan(rows(['GET', SCENARIO, b])))
  end

  test 'an object keyed by a feed fact id with a text key is reported, even with other text' do
    b = bootstrap
    b['social']['intelFacts']['jake_pet_name'] = { 'label' => 'Pet', 'text' => 'something else entirely, long enough' }
    assert_equal [[1, 'feed_fact_key', 'fact:jake_pet_name']], summary(AccessLeakScanner.new(data).scan(rows(['GET', SCENARIO, b])))
  end

  test 'a post text in room data before its answer is reported, and the authored feed key too' do
    room = { 'room' => { 'npcs' => [{ 'id' => 'jake', 'bio' => "says: #{AccessSocialScenario::POSTS[1]}" }] } }
    assert_equal [[1, 'feed_text', 'feed:jake|jake_post_2']], summary(AccessLeakScanner.new(data).scan(rows(['GET', '/break_escape/games/1/room/office', room])))
    leaked = { 'room' => { 'npcs' => [{ 'id' => 'jake', 'feed' => { 'site' => 'friendface' } }] } }
    assert_equal [[1, 'withheld_key', 'npc:jake/feed']], summary(AccessLeakScanner.new(data).scan(rows(['GET', '/break_escape/games/1/room/office', leaked])))
  end

  test 'a correct bootstrap whose ids and names share words with the labels is clean' do
    b = bootstrap
    b['rooms']['pet_shop'] = { 'type' => 'room_office', 'door_sign' => 'Pet Year Office' }
    b['npcs'] = [{ 'id' => 'jake', 'displayName' => 'Jake Brooks', 'hasFeed' => true }]
    assert_empty AccessLeakScanner.new(data).scan(rows(['GET', SCENARIO, b]))
  end

  test 'after one /feed_post: the first post and fact are allowed there and later; the second is still reported' do
    later = bootstrap.merge('feedPosts' => { 'jake' => { 'site' => 'friendface', 'person' => 'jake', 'done' => false,
                                                         'posts' => [first_answer.slice('index', 'post', 'fact')] } })
    later['social']['intelFacts']['jake_pet_name'] = first_answer['fact']['entry']
    clean = AccessLeakScanner.new(data).scan(rows(['POST', FEED, first_answer], ['GET', SCENARIO, later]))
    assert_empty clean
    leaked = later.deep_dup
    leaked['notes'] = [{ 'text' => AccessSocialScenario::FACT_TEXTS['jake_wedding_year'] }]
    assert_equal [[2, 'feed_text', 'fact:jake_wedding_year']],
                 summary(AccessLeakScanner.new(data).scan(rows(['POST', FEED, first_answer], ['GET', SCENARIO, leaked])))
  end

  test "a GET /scenario feedPosts block is allowed as far as the game's feedRevealed count, no further" do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'n' => 1 } } })
    body = bootstrap.merge('feedPosts' => { 'jake' => { 'site' => 'friendface', 'person' => 'jake', 'posts' => [
      first_answer.slice('index', 'post', 'fact'),
      { 'index' => 1, 'post' => { 'id' => 'jake_post_2', 'text' => AccessSocialScenario::POSTS[1] } }
    ] } })
    findings = AccessLeakScanner.new(data, game: game).scan(rows(['GET', SCENARIO, body]))
    assert_equal [[1, 'feed_text', 'feed:jake|jake_post_2']], summary(findings)
  end

  def feed_item(i)
    post = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'jake' }['feed']['posts'][i]
    item = { 'index' => i, 'post' => post.slice('id', 'text', 'fact') }
    item['fact'] = { 'id' => post['fact'], 'entry' => data['social']['intelFacts'][post['fact']] } if post['fact']
    item
  end

  def jake_feed(*items)
    { 'jake' => { 'site' => 'friendface', 'person' => 'jake', 'done' => false, 'posts' => items } }
  end

  test 'review R1 M1: a premature reveal in GET /scenario is reported although the game later revealed it' do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'n' => 3 } } })
    early = bootstrap.merge('feedPosts' => jake_feed(feed_item(0), feed_item(1)))
    log = rows(['POST', FEED, first_answer], ['GET', SCENARIO, early],
               ['POST', FEED, first_answer.merge('index' => 1, 'post' => feed_item(1)['post'], 'fact' => feed_item(1)['fact'])],
               ['POST', FEED, first_answer.merge('index' => 2, 'post' => feed_item(2)['post'], 'fact' => nil)])
    scanner = AccessLeakScanner.new(data, game: game)
    found = summary(scanner.scan(log))
    assert_includes found, [2, 'feed_text', 'feed:jake|jake_post_2']
    assert_includes found, [2, 'feed_text', 'fact:jake_wedding_year']
    assert_empty found.reject { |f| f[0] == 2 }, 'the later answers serve posts 2 and 3 in order'
    assert_empty scanner.feed_fallback
  end

  test "review R1 M1: a feedPosts item is judged by its post id, never by the response's index" do
    mislabelled = feed_item(1).merge('index' => 0)
    body = bootstrap.merge('feedPosts' => jake_feed(mislabelled))
    found = summary(AccessLeakScanner.new(data).scan(rows(['POST', FEED, first_answer], ['GET', SCENARIO, body])))
    assert_includes found, [2, 'feed_text', 'feed:jake|jake_post_2']
  end

  test 'C2: a /feed_post answer serving a post out of authored order is marked by its body id, no false leak' do
    # Under C2 the server serves reactive posts out of authored order, so a /feed_post answer
    # carrying jake_post_2 before jake_post_1 is the serving event itself (the server decides), not
    # a leak: the scanner reads the served id from the body and raises no false feed_text finding.
    second = first_answer.merge('post' => feed_item(1)['post'], 'fact' => feed_item(1)['fact'])
    found = summary(AccessLeakScanner.new(data).scan(rows(['POST', FEED, second])))
    assert_empty found
    # and a later bootstrap may then list jake_post_2 (shown), but not the still-unserved jake_post_1
    later = bootstrap.merge('feedPosts' => jake_feed(feed_item(1), feed_item(0)))
    later['social']['intelFacts']['jake_wedding_year'] = feed_item(1)['fact']['entry']
    found2 = summary(AccessLeakScanner.new(data).scan(rows(['POST', FEED, second], ['GET', SCENARIO, later])))
    assert_includes found2, [2, 'feed_text', 'feed:jake|jake_post_1']
    refute_includes found2.map { |f| f[2] }, 'feed:jake|jake_post_2'
  end

  test 'review R1 M1: a log that starts after reveals falls back to the saved count and says so' do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'n' => 1 } } })
    body = bootstrap.merge('feedPosts' => jake_feed(feed_item(0)))
    body['social']['intelFacts']['jake_pet_name'] = first_answer['fact']['entry']
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty scanner.scan(rows(['GET', SCENARIO, body]))
    assert_equal ['jake'], scanner.feed_fallback
  end

  test 'C2: a resumed run whose feedRevealed is the new shown shape lists an out-of-order reactive post, no false leak' do
    # jake's saved reveal set holds jake_post_3 (ordered index 2) ahead of jake_post_1, as a
    # reactive_first feed would serve it. The scanner reads the ids from `shown`, so a feedPosts
    # block listing them in reveal order raises no false feed_text leak, and the base is right.
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'shown' => %w[jake_post_3 jake_post_1], 'at' => 0 } } })
    body = bootstrap.merge('feedPosts' => jake_feed(
      { 'index' => 0, 'post' => feed_item(2)['post'] },
      first_answer.merge('index' => 1).slice('index', 'post', 'fact')
    ))
    body['social']['intelFacts']['jake_pet_name'] = first_answer['fact']['entry']
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty summary(scanner.scan(rows(['GET', SCENARIO, body])))
    assert_equal ['jake'], scanner.feed_fallback
    # a post not in the saved shown set is still reported
    leaked = bootstrap.merge('feedPosts' => jake_feed(feed_item(1)))
    assert_includes summary(AccessLeakScanner.new(data, game: game).scan(rows(['GET', SCENARIO, leaked]))),
                    [1, 'feed_text', 'feed:jake|jake_post_2']
  end

  test 'C2: a legacy { n, at } feedRevealed migrates to the first n ordered ids for the base' do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'n' => 2, 'at' => 0 } } })
    body = bootstrap.merge('feedPosts' => jake_feed(feed_item(0), feed_item(1)))
    body['social']['intelFacts']['jake_pet_name'] = first_answer['fact']['entry']
    body['social']['intelFacts']['jake_wedding_year'] = feed_item(1)['fact']['entry']
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty summary(scanner.scan(rows(['GET', SCENARIO, body])))
    assert_equal ['jake'], scanner.feed_fallback
  end

  # Review C R2 m2: an answer the capture logged with bodyError (the body was lost on a reload)
  def lost_answer
    ['r.jsonl', 0, { 'method' => 'POST', 'path' => FEED, 'status' => 200, 'bodyError' => 'Response body is unavailable' }]
  end

  def numbered(list)
    list.each_with_index.map { |(src, _n, row), i| [src, i + 1, row] }
  end

  test 'review C R2 m2: a lost /feed_post body does not let an earlier bootstrap show a post' do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'n' => 2 } } })
    early = bootstrap.merge('feedPosts' => jake_feed(feed_item(0)))
    log = numbered(rows(['GET', SCENARIO, early], ['POST', FEED, first_answer]) + [lost_answer])
    scanner = AccessLeakScanner.new(data, game: game)
    found = summary(scanner.scan(log))
    assert_includes found, [1, 'feed_text', 'feed:jake|jake_post_1'], 'the first bootstrap is judged with no post out'
    assert_equal ['jake'], scanner.feed_unknown
    assert_empty scanner.feed_fallback, 'no reveal is counted from the first line'
  end

  test 'review C R2 m2: after a lost /feed_post body the next post is allowed, from that line on' do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'n' => 2 } } })
    later = bootstrap.merge('feedPosts' => jake_feed(feed_item(0), feed_item(1)))
    log = numbered(rows(['POST', FEED, first_answer]) + [lost_answer] + rows(['GET', SCENARIO, later]))
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty scanner.scan(log)
    assert_equal ['jake'], scanner.feed_unknown
  end

  test 'review C R2 m2: reveals beyond the lost bodies still count from the first line (a resumed game with a lost body)' do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'n' => 2 } } })
    body = bootstrap.merge('feedPosts' => jake_feed(feed_item(0)))
    body['social']['intelFacts']['jake_pet_name'] = first_answer['fact']['entry']
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty scanner.scan(numbered(rows(['GET', SCENARIO, body]) + [lost_answer]))
    assert_equal ['jake'], scanner.feed_fallback
    assert_equal ['jake'], scanner.feed_unknown
  end

  # Review C R3 m1: a resumed game (the bootstrap already lists Lena's post) with a lost answer
  # captured later. The capture's time and the saved time of each NPC's last reveal tell whether
  # the lost answer could have been that NPC's reveal.
  T0 = Time.utc(2026, 11, 12, 10, 0, 0)

  def at(row, seconds)
    row[2]['t'] = (T0 + seconds).iso8601(3)
    row
  end

  def lena_feed
    lena = data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'lena' }
    { 'lena' => { 'site' => 'friendface', 'person' => 'lena', 'done' => true,
                  'posts' => [{ 'index' => 0, 'post' => lena['feed']['posts'][0].slice('id', 'text') }] } }
  end

  test "review C R3 m1: a lost answer after an NPC's last saved reveal is not counted for it (resumed game, one NPC)" do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'lena' => { 'n' => 1, 'at' => (T0 - 600).to_f } } })
    resumed = bootstrap.merge('feedPosts' => lena_feed)
    log = numbered([at(rows(['GET', SCENARIO, resumed])[0], 0), at(lost_answer, 30)])
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty scanner.scan(log), "Lena's post was out before the log began"
    assert_equal ['lena'], scanner.feed_fallback
    assert_empty scanner.feed_unknown
  end

  test "review C R3 m1: one lost answer is counted only for the NPC whose last reveal it could be (two NPCs)" do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'lena' => { 'n' => 1, 'at' => (T0 - 600).to_f },
                                                               'jake' => { 'n' => 1, 'at' => (T0 + 29.5).to_f } } })
    resumed = bootstrap.merge('feedPosts' => lena_feed)
    later = bootstrap.merge('feedPosts' => lena_feed.merge(jake_feed(feed_item(0))))
    later['social']['intelFacts']['jake_pet_name'] = first_answer['fact']['entry']
    log = numbered([at(rows(['GET', SCENARIO, resumed])[0], 0), at(lost_answer, 30), at(rows(['GET', SCENARIO, later])[0], 40)])
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty scanner.scan(log)
    assert_equal ['jake'], scanner.feed_unknown
    assert_equal ['lena'], scanner.feed_fallback
  end

  test "review C R3 m1: Jake's post in a bootstrap before the lost answer that revealed it is still reported" do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'n' => 1, 'at' => (T0 + 29.5).to_f } } })
    early = bootstrap.merge('feedPosts' => jake_feed(feed_item(0)))
    log = numbered([at(rows(['GET', SCENARIO, early])[0], 0), at(lost_answer, 30)])
    found = summary(AccessLeakScanner.new(data, game: game).scan(log))
    assert_includes found, [1, 'feed_text', 'feed:jake|jake_post_1']
  end

  # Capture npcId: the capture tags a /feed_post line with the request's npc_id, so a lost answer
  # is credited to that NPC only. Lena and Jake both have a last reveal after the one lost row;
  # Lena's post was out before the log began (a resumed game) and the lost row was Jake's.
  def two_reveals_after_lost_row(tag)
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'lena' => { 'shown' => ['lena_post_1'], 'at' => (T0 + 31).to_f },
                                                               'jake' => { 'n' => 1, 'at' => (T0 + 32).to_f } } })
    resumed = bootstrap.merge('feedPosts' => lena_feed)
    later = bootstrap.merge('feedPosts' => lena_feed.merge(jake_feed(feed_item(0))))
    later['social']['intelFacts']['jake_pet_name'] = first_answer['fact']['entry']
    lost = at(lost_answer, 30)
    lost[2]['npcId'] = tag if tag
    [game, numbered([at(rows(['GET', SCENARIO, resumed])[0], 0), lost, at(rows(['GET', SCENARIO, later])[0], 40)])]
  end

  test 'capture npcId: one tagged lost row is credited to its NPC only, so the other counts from the first line' do
    game, log = two_reveals_after_lost_row('jake')
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty scanner.scan(log), "Lena's post was out before the log began; Jake's came with the lost row"
    assert_equal ['jake'], scanner.feed_unknown
    assert_equal ['lena'], scanner.feed_fallback
  end

  test 'capture npcId: a lost row tagged for Jake does not let an earlier bootstrap show his post' do
    game, log = two_reveals_after_lost_row('jake')
    log[0][2]['body'] = bootstrap.merge('feedPosts' => lena_feed.merge(jake_feed(feed_item(0))))
    found = summary(AccessLeakScanner.new(data, game: game).scan(log))
    assert_includes found, [1, 'feed_text', 'feed:jake|jake_post_1']
    refute(found.any? { |_l, _r, owner| owner.include?('lena') }, 'Lena is clean')
  end

  test 'capture npcId: the shares from tagged rows never pass the number of lost rows' do
    game, log = two_reveals_after_lost_row('lena')
    scanner = AccessLeakScanner.new(data, game: game)
    scanner.scan(log)
    assert_equal ['lena'], scanner.feed_unknown, 'one lost row, one share'
    assert_equal ['jake'], scanner.feed_fallback
  end

  test 'capture npcId: an untagged lost row (an older capture file) is still counted for both NPCs' do
    game, log = two_reveals_after_lost_row(nil)
    scanner = AccessLeakScanner.new(data, game: game)
    found = summary(scanner.scan(log))
    assert_equal %w[jake lena], scanner.feed_unknown.sort
    assert_includes found, [1, 'feed_text', 'feed:lena|lena_post_1'], 'the old rule: the lost row may have been her reveal'
  end

  test 'capture npcId R1 m1: a lost row whose query names an npc_id is treated as untagged' do
    game, log = two_reveals_after_lost_row('jake')
    log[1][2]['query'] = 'npc_id=lena'
    scanner = AccessLeakScanner.new(data, game: game)
    found = summary(scanner.scan(log))
    assert_equal %w[jake lena], scanner.feed_unknown.sort, 'the server revealed for the query, so the tag is not trusted'
    assert_includes found, [1, 'feed_text', 'feed:lena|lena_post_1']
  end

  test 'capture npcId R1 m1: a readable answer whose tag and body disagree makes the scanner ignore every tag' do
    game, log = two_reveals_after_lost_row('jake')
    readable = rows(['POST', FEED, first_answer])[0]
    readable[2]['npcId'] = 'lena'
    log = numbered([log[0], at(readable, 10), log[1], log[2]])
    scanner = AccessLeakScanner.new(data, game: game)
    found = summary(scanner.scan(log))
    assert scanner.feed_tags_ignored
    assert_equal ['lena'], scanner.feed_unknown, 'the lost row is judged by the old rule: it may be Lena\'s'
    assert_includes found, [1, 'feed_text', 'feed:lena|lena_post_1']
  end

  test 'capture npcId R1 m2: an NPC that a tag ruled out of the only lost row is listed for the note' do
    game, log = two_reveals_after_lost_row('jake')
    scanner = AccessLeakScanner.new(data, game: game)
    scanner.scan(log)
    assert_equal ['lena'], scanner.feed_ruled_out
    refute scanner.feed_tags_ignored
    game, log = two_reveals_after_lost_row(nil)
    scanner = AccessLeakScanner.new(data, game: game)
    scanner.scan(log)
    assert_empty scanner.feed_ruled_out, 'an untagged row rules nobody out'
  end

  test 'capture npcId R1 m3: one tagged and one untagged lost row give each NPC one share, and a Lena leak before the untagged row is found' do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'lena' => { 'shown' => ['lena_post_1'], 'at' => (T0 + 31).to_f },
                                                               'jake' => { 'n' => 1, 'at' => (T0 + 32).to_f } } })
    tagged = at(lost_answer, 20)
    tagged[2]['npcId'] = 'jake'
    between = bootstrap.merge('feedPosts' => lena_feed)
    later = bootstrap.merge('feedPosts' => lena_feed.merge(jake_feed(feed_item(0))))
    later['social']['intelFacts']['jake_pet_name'] = first_answer['fact']['entry']
    log = numbered([at(rows(['GET', SCENARIO, bootstrap])[0], 0), tagged, at(rows(['GET', SCENARIO, between])[0], 25),
                    at(lost_answer, 30), at(rows(['GET', SCENARIO, later])[0], 40)])
    scanner = AccessLeakScanner.new(data, game: game)
    found = summary(scanner.scan(log))
    assert_equal %w[jake lena], scanner.feed_unknown.sort
    assert_empty scanner.feed_fallback
    assert_equal [[3, 'feed_text', 'feed:lena|lena_post_1']], found.select { |_l, _r, o| o.include?('lena') }.uniq,
                 "Jake's tagged row is not hers, so her post before the untagged row is a leak"
    refute(found.any? { |l, _r, _o| l == 5 }, 'the last bootstrap is clean')
  end

  test 'capture npcId R1 m3: a lost row tagged for an NPC with no feed gives nobody a share' do
    game, log = two_reveals_after_lost_row('nobody')
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty scanner.scan(log)
    assert_empty scanner.feed_unknown
    assert_equal %w[jake lena], scanner.feed_fallback.sort
    assert_equal %w[jake lena], scanner.feed_ruled_out.sort
  end

  test 'review C R2 nit: a blank post id is skipped, as the server skips it' do
    d = data.deep_dup
    jake = d['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'jake' }
    jake['feed']['posts'].unshift({ 'id' => '  ', 'text' => 'A blank id post the server never serves, long enough.' })
    found = summary(AccessLeakScanner.new(d).scan(rows(['POST', FEED, first_answer])))
    assert_empty found, 'the first answer serves jake_post_1, the first post with an id'
  end

  test 'review R1 n3: two posts with the same text are both served by either' do
    d = data.deep_dup
    lena = d['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == 'lena' }
    lena['feed']['posts'][0]['text'] = AccessSocialScenario::POSTS[0]
    assert_empty summary(AccessLeakScanner.new(d).scan(rows(['POST', FEED, first_answer])))
  end

  test 'review R1 n4: a bootstrap whose social.intelFacts is not an object is reported' do
    b = bootstrap
    b['social'].delete('intelFacts')
    assert_equal [[1, 'feed_fact_key', 'social.intelFacts']], summary(AccessLeakScanner.new(data).scan(rows(['GET', SCENARIO, b])))
  end

  # ── sub-slice C2: a reactive post with a feed fact (no-exposure fixture) ──
  REACTIVE_TEXT = 'Server down again, second time this week on the finance share.'.freeze
  REACTIVE_FACT_TEXT = 'Jake Brooks keeps the finance backups on a personal drive.'.freeze

  # jake's feed gains a reactive vent post carrying its own feed fact
  def reactive_data
    d = data.deep_dup
    d['social']['intelFacts']['jake_vent_fact'] = { 'label' => 'Backups', 'subject' => 'jake', 'text' => REACTIVE_FACT_TEXT }
    jake = d['rooms']['office']['npcs'][0]
    jake['feed']['order'] = 'reactive_first'
    jake['feed']['posts'] << { 'id' => 'jake_vent', 'text' => REACTIVE_TEXT, 'fact' => 'jake_vent_fact',
                               'when' => { 'cause' => 'down', 'need' => 'work' } }
    d
  end

  def vent_answer
    entry = { 'label' => 'Backups', 'subject' => 'jake', 'text' => REACTIVE_FACT_TEXT }
    { 'npcId' => 'jake', 'index' => 0, 'post' => { 'id' => 'jake_vent', 'text' => REACTIVE_TEXT, 'fact' => 'jake_vent_fact' },
      'fact' => { 'id' => 'jake_vent_fact', 'entry' => entry }, 'site' => 'friendface', 'person' => 'jake', 'done' => false }
  end

  test 'C2: the scanner counts a reactive post and its feed fact' do
    c = AccessLeakScanner.new(reactive_data).counts
    assert_equal 6, c[:feed_posts], 'jake 4 (one reactive), lena 1, omar 1'
    assert_equal 3, c[:feed_facts]
  end

  test 'C2 no-exposure: a reactive post or its fact in a bootstrap before its serve is reported; the serving answer is clean' do
    d = reactive_data
    # before the condition holds, the reactive post text in any response is a leak
    leaked_post = bootstrap.merge('notes' => [{ 'text' => REACTIVE_TEXT }])
    assert_equal [[1, 'feed_text', 'feed:jake|jake_vent']], summary(AccessLeakScanner.new(d).scan(rows(['GET', SCENARIO, leaked_post])))
    # its fact text keyed by the feed fact id is both a text leak and a keyed-object leak
    leaked_fact = bootstrap
    leaked_fact['social']['intelFacts']['jake_vent_fact'] = { 'label' => 'Backups', 'text' => REACTIVE_FACT_TEXT }
    assert_equal [[1, 'feed_text', 'fact:jake_vent_fact'], [1, 'feed_fact_key', 'fact:jake_vent_fact']],
                 summary(AccessLeakScanner.new(d).scan(rows(['GET', SCENARIO, leaked_fact])))
    # an object merely keyed by the fact id with an unrelated text is still the keyed-object leak
    other = bootstrap
    other['social']['intelFacts']['jake_vent_fact'] = { 'label' => 'Backups', 'text' => 'unrelated text, long enough here.' }
    assert_equal [[1, 'feed_fact_key', 'fact:jake_vent_fact']], summary(AccessLeakScanner.new(d).scan(rows(['GET', SCENARIO, other])))
    # once the server serves the vent, the post and fact are allowed in its answer and a later bootstrap
    later = bootstrap.merge('feedPosts' => jake_feed(vent_answer.slice('index', 'post', 'fact')))
    later['social']['intelFacts']['jake_vent_fact'] = vent_answer['fact']['entry']
    assert_empty AccessLeakScanner.new(d).scan(rows(['POST', FEED, vent_answer], ['GET', SCENARIO, later]))
  end

  test 'a report line never quotes a feed text' do
    b = bootstrap
    b['x'] = AccessSocialScenario::POSTS[2]
    scanner = AccessLeakScanner.new(data)
    lines = scanner.report_lines(scanner.scan(rows(['GET', SCENARIO, b])))
    assert_equal 1, lines.length
    refute_includes lines[0], AccessSocialScenario::POSTS[2]
  end
end
