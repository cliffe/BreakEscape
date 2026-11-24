require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

# Ops S7 fix (leak scanner review R2-L1): an intel fact's entry, label and text are values the server withholds until the
# player has earned the fact. Judged against the real scenarios/test_ops_crack: dana_pet is awarded by an item
# (revealsFacts), dana_year by a flag reward (grant_fact), dana_town is a feed fact (the feed rules own it). Every case is
# tested both ways: the earned fact in the place and shape the server sends it is clean, anywhere else is a finding.
class AccessLeakScannerFactTest < ActiveSupport::TestCase
  SCENARIO = File.expand_path('../../scenarios/test_ops_crack/scenario.json.erb', __dir__)
  BASE = '/break_escape/games/1'.freeze

  Game = Struct.new(:earned) do
    def credential_proof_holds?(_id, _entry)
      true
    end

    def earned_fact_ids
      earned
    end

    def player_state
      {}
    end

    def crack_token(*)
      nil
    end

    def password_held_for?(_npc)
      false
    end
  end

  PET = { 'label' => "Dana's cat", 'subject' => 'dana', 'source' => 'desk_notes', 'text' => 'Dana has a cat called Juniper.' }.freeze
  YEAR = { 'label' => "Dana's start year", 'subject' => 'dana', 'source' => 'records_station', 'text' => 'Dana joined the firm in 2003.' }.freeze
  TOWN = { 'label' => "Dana's home town", 'subject' => 'dana', 'source' => 'dana_post_1', 'text' => 'Dana grew up in Ashby.' }.freeze

  def scenario
    @scenario ||= JSON.parse(BreakEscape::ScenarioBinding.render(File.read(SCENARIO)))
  end

  def scan(rows, earned: :none)
    lines = rows.each_with_index.map { |r, i| ['r.jsonl', i + 1, r] }
    game = earned == :none ? nil : Game.new(earned)
    AccessLeakScanner.new(scenario, game: game).scan(lines)
  end

  def fact_hits(rows, **opts)
    scan(rows, **opts).select { |f| f.rule == 'fact_unearned' }.map { |f| [f.line, f.owner] }
  end

  def get(path, body, status: 200)
    { 'method' => 'GET', 'path' => "#{BASE}/#{path}", 'status' => status, 'body' => body }
  end

  def post(path, body, status: 200)
    { 'method' => 'POST', 'path' => "#{BASE}/#{path}", 'status' => status, 'body' => body }
  end

  def bootstrap(*pairs)
    get('scenario', { 'social' => { 'intelFacts' => pairs.to_h } })
  end

  def inventory(facts, extra = {})
    post('inventory', { 'success' => true, 'facts' => facts }.merge(extra))
  end

  def flag(rewards)
    post('flags', { 'success' => true, 'rewards' => rewards })
  end

  def grant_reward(entry = YEAR, fact = 'dana_year')
    { 'type' => 'grant_fact', 'fact' => fact, 'label' => "Dana's start year", 'entry' => entry }
  end

  def give_reward(facts)
    { 'type' => 'give_item', 'item' => { 'type' => 'note' }, 'success' => true, 'facts' => facts }
  end

  ALL = %w[dana_pet dana_year].freeze

  # ---- bootstrap ----------------------------------------------------------------------------------

  test 'bootstrap: an unearned fact entry is a finding, an earned one after the answer that granted it is clean' do
    assert_equal [[1, 'fact:dana_pet']], fact_hits([bootstrap(['dana_pet', PET])], earned: [])
    assert_equal [[1, 'fact:dana_year']], fact_hits([bootstrap(['dana_year', YEAR])], earned: [])
    rows = [inventory({ 'dana_pet' => PET }), bootstrap(['dana_pet', PET])]
    assert_empty fact_hits(rows, earned: ALL)
    assert_empty scan(rows, earned: ALL)
  end

  test 'bootstrap: an entry before the granting answer, or for a fact no answer granted, is a finding even when the game ends up earning it' do
    rows = [bootstrap(['dana_pet', PET]), inventory({ 'dana_pet' => PET })]
    assert_equal [[1, 'fact:dana_pet']], fact_hits(rows, earned: ALL)
    assert_equal [[1, 'fact:dana_year']], fact_hits([bootstrap(['dana_year', YEAR])], earned: ALL)
    assert_equal [[1, 'fact:dana_pet']], fact_hits([bootstrap(['dana_pet', PET])])
  end

  test 'bootstrap: a changed entry, or the entry of an earned fact under another place, is a finding' do
    altered = [inventory({ 'dana_pet' => PET }), bootstrap(['dana_pet', PET.merge('text' => 'Dana has a cat called Juniper, and a dog.')])]
    assert_equal [[2, 'fact:dana_pet']], fact_hits(altered, earned: ALL)
    other = [inventory({ 'dana_pet' => PET }), get('scenario', { 'social' => { 'other' => { 'dana_pet' => PET } } })]
    assert_equal [[2, 'fact:dana_pet']], fact_hits(other, earned: ALL)
    # a non-200 answer grants nothing, and its entry is a finding
    refused = [inventory({ 'dana_pet' => PET }).merge('status' => 422), bootstrap(['dana_pet', PET])]
    assert_equal [[1, 'fact:dana_pet'], [2, 'fact:dana_pet']], fact_hits(refused, earned: ALL)
  end

  # ---- inventory facts ----------------------------------------------------------------------------

  test 'inventory: facts of an item fact are clean when earned, a finding when unearned' do
    assert_empty fact_hits([inventory({ 'dana_pet' => PET })], earned: ALL)
    assert_empty fact_hits([inventory({ 'dana_pet' => PET }, 'already' => true)], earned: ALL)
    assert_equal [[1, 'fact:dana_pet']], fact_hits([inventory({ 'dana_pet' => PET })], earned: [])
    assert_equal [[1, 'fact:dana_pet']], fact_hits([inventory({ 'dana_pet' => PET })], earned: %w[dana_year])
  end

  test 'inventory: a flag-reward-only fact, or an entry outside the top-level facts, is a finding' do
    assert_equal [[1, 'fact:dana_year']], fact_hits([inventory({ 'dana_year' => YEAR })], earned: ALL)
    nested = post('inventory', { 'success' => true, 'item' => { 'facts' => { 'dana_pet' => PET } } })
    assert_equal [[1, 'fact:dana_pet']], fact_hits([nested], earned: ALL)
    other_route = get('room/lobby', { 'facts' => { 'dana_pet' => PET } })
    assert_equal [[1, 'fact:dana_pet']], fact_hits([other_route], earned: ALL)
  end

  # ---- grant_fact entry ---------------------------------------------------------------------------

  test 'grant_fact: the reward entry is clean for the earned fact and a finding unearned' do
    assert_empty fact_hits([flag([grant_reward])], earned: ALL)
    assert_equal [[1, 'fact:dana_year']], fact_hits([flag([grant_reward])], earned: [])
    assert_equal [[1, 'fact:dana_year']], fact_hits([flag([grant_reward])], earned: %w[dana_pet])
  end

  test 'grant_fact: an entry of another fact, in the wrong place, or on a refused answer is a finding' do
    # the reward's own label is the other fact's label, which that fact's grant has not yet earned
    assert_equal [[1, 'fact:dana_year'], [1, 'fact:dana_pet']], fact_hits([flag([grant_reward(PET)])], earned: ALL)
    moved = { 'type' => 'grant_fact', 'fact' => 'dana_year', 'meta' => { 'entry' => YEAR } }
    assert_equal [[1, 'fact:dana_year']], fact_hits([flag([moved])], earned: ALL)
    assert_equal [[1, 'fact:dana_year']], fact_hits([flag([grant_reward]).merge('status' => 422)], earned: ALL)
    keyed = { 'type' => 'grant_fact', 'fact' => 'dana_year', 'entry' => { 'dana_year' => YEAR } }
    assert_equal [[1, 'fact:dana_year']], fact_hits([flag([keyed])], earned: ALL)
  end

  # ---- give_item facts ----------------------------------------------------------------------------

  test 'give_item: the reward facts are clean for the earned item fact and a finding unearned' do
    assert_empty fact_hits([flag([give_reward({ 'dana_pet' => PET })])], earned: ALL)
    assert_equal [[1, 'fact:dana_pet']], fact_hits([flag([give_reward({ 'dana_pet' => PET })])], earned: [])
  end

  test 'give_item: a flag-reward-only fact in the facts, or the facts on a grant_fact reward, is a finding' do
    assert_equal [[1, 'fact:dana_year']], fact_hits([flag([give_reward({ 'dana_year' => YEAR })])], earned: ALL)
    wrong = { 'type' => 'grant_fact', 'fact' => 'dana_year', 'facts' => { 'dana_year' => YEAR } }
    assert_equal [[1, 'fact:dana_year']], fact_hits([flag([wrong])], earned: ALL)
  end

  # ---- plain text and label -----------------------------------------------------------------------

  test 'text: a fact text in any string is a finding until the fact is granted, then clean' do
    note = get('room/lobby', { 'note' => 'Dana has a cat called Juniper.' })
    longer = get('room/lobby', { 'note' => 'She said: Dana has a cat called Juniper. Honest.' })
    assert_equal [[1, 'fact:dana_pet']], fact_hits([note], earned: [])
    assert_equal [[1, 'fact:dana_pet']], fact_hits([longer], earned: [])
    assert_equal [[1, 'fact:dana_pet']], fact_hits([note, inventory({ 'dana_pet' => PET })], earned: ALL)
    assert_empty fact_hits([inventory({ 'dana_pet' => PET }), note, longer], earned: ALL)
    assert_equal [[1, 'fact:dana_pet']], fact_hits([note])
  end

  test 'label: a fact label as a whole string is a finding until the fact is granted, then clean' do
    label = get('room/lobby', { 'tag' => "Dana's cat" })
    assert_equal [[1, 'fact:dana_pet']], fact_hits([label], earned: [])
    assert_equal [[1, 'fact:dana_pet']], fact_hits([label, inventory({ 'dana_pet' => PET })], earned: ALL)
    assert_empty fact_hits([inventory({ 'dana_pet' => PET }), label], earned: ALL)
  end

  test 'label: the authored label of a grant_fact reward in room data is that reward text, not the withheld entry' do
    room = ->(path_key, text) { get('room/lobby', { 'room' => { 'objects' => [{ 'id' => 'st', path_key => [{ 'type' => 'grant_fact', 'fact' => 'dana_year', 'label' => text }] }] } }) }
    assert_empty fact_hits([room.call('flagRewards', "Dana's start year")], earned: [])
    assert_equal [[1, 'fact:dana_year']], fact_hits([room.call('other', "Dana's start year")], earned: [])
    assert_equal [[1, 'fact:dana_year']], fact_hits([room.call('flagRewards', 'Dana joined the firm in 2003.')], earned: [])
  end

  test 'an unlock answer with a fact entry under a new key is a finding even for an earned fact' do
    rows = [inventory({ 'dana_pet' => PET }), post('unlock', { 'success' => true, 'clue' => { 'dana_pet' => PET } })]
    assert_equal [[2, 'fact:dana_pet']], fact_hits(rows, earned: ALL)
  end

  # ---- feed facts are the feed rules' --------------------------------------------------------------

  test 'a feed fact is judged by the feed rules only, never twice' do
    found = scan([bootstrap(['dana_town', TOWN])], earned: [])
    assert_includes found.map(&:rule), 'feed_fact_key'
    assert_empty found.select { |f| f.rule == 'fact_unearned' }
    served = [post('feed_post', { 'npcId' => 'dana', 'post' => { 'id' => 'dana_post_1' }, 'fact' => { 'id' => 'dana_town', 'text' => TOWN['text'] } })]
    assert_empty scan(served + [bootstrap(['dana_town', TOWN])], earned: %w[dana_town]).select { |f| f.rule == 'fact_unearned' }
  end

  test 'the rule is in RULE_TEXT' do
    assert AccessLeakScanner::RULE_TEXT.key?('fact_unearned')
  end

  test 'the hash form of flagRewards awards a fact too' do
    data = JSON.parse(scenario.to_json)
    holder = nil
    walk = lambda do |n|
      case n
      when Hash then (holder = n if n['flagRewards'].is_a?(Array) && n['flagRewards'].any? { |r| r['fact'] == 'dana_year' }); n.each_value { |v| walk.call(v) }
      when Array then n.each { |v| walk.call(v) }
      end
    end
    walk.call(data)
    assert holder, 'the scenario has a flag reward for dana_year'
    holder['flagRewards'] = { 'flag{x}' => holder['flagRewards'].first }
    data['social']['intelFacts']['dana_year'] = YEAR
    lines = [['r.jsonl', 1, bootstrap(['dana_year', YEAR])]]
    found = AccessLeakScanner.new(data, game: Game.new([])).scan(lines)
    assert_equal ['fact_unearned'], found.map(&:rule)
    lines = [['r.jsonl', 1, flag([grant_reward])]]
    assert_empty AccessLeakScanner.new(data, game: Game.new(ALL)).scan(lines)
  end
end
