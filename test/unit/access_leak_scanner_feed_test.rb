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

  test 'review R1 M1: a /feed_post answer out of order is reported' do
    second = first_answer.merge('post' => feed_item(1)['post'], 'fact' => feed_item(1)['fact'])
    found = summary(AccessLeakScanner.new(data).scan(rows(['POST', FEED, second])))
    assert_includes found, [1, 'feed_text', 'feed:jake|jake_post_2']
  end

  test 'review R1 M1: a log that starts after reveals falls back to the saved count and says so' do
    game = Struct.new(:player_state).new({ 'feedRevealed' => { 'jake' => { 'n' => 1 } } })
    body = bootstrap.merge('feedPosts' => jake_feed(feed_item(0)))
    body['social']['intelFacts']['jake_pet_name'] = first_answer['fact']['entry']
    scanner = AccessLeakScanner.new(data, game: game)
    assert_empty scanner.scan(rows(['GET', SCENARIO, body]))
    assert_equal ['jake'], scanner.feed_fallback
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

  test 'a report line never quotes a feed text' do
    b = bootstrap
    b['x'] = AccessSocialScenario::POSTS[2]
    scanner = AccessLeakScanner.new(data)
    lines = scanner.report_lines(scanner.scan(rows(['GET', SCENARIO, b])))
    assert_equal 1, lines.length
    refute_includes lines[0], AccessSocialScenario::POSTS[2]
  end
end
