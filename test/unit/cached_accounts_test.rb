require 'test_helper'

# S5b unit 04: pure readers for cached accounts and the harvested proof kind.
class CachedAccountsTest < ActiveSupport::TestCase
  CA = BreakEscape::CachedAccounts
  CM = BreakEscape::CredentialModel

  def pc(list)
    { 'id' => 'bay_pc', 'lockType' => 'login', 'cachedAccounts' => list }
  end

  test 'candidates keeps order, after and the cap' do
    list = [{ 'npc' => 'olu' }, { 'npc' => 'sam', 'after' => 'borrow' }]
    assert_equal [{ 'npc' => 'olu', 'after' => nil }, { 'npc' => 'sam', 'after' => 'borrow' }], CA.candidates(pc(list))
    many = (1..12).map { |i| { 'npc' => "n#{i}" } }
    assert_equal 8, CA.candidates(pc(many)).length
  end

  test 'malformed lists give an empty list' do
    [nil, 'x', {}, 5, [], [nil, 'x', 3, []]].each { |v| assert_equal [], CA.candidates(pc(v)) }
    assert_equal [], CA.candidates(nil)
    assert_equal [], CA.candidates({ 'id' => 'p', 'cachedAccounts' => [{ 'npc' => 'a' }] })
  end

  test 'non holders are ignored' do
    list = [{ 'npc' => '' }, { 'npc' => 5 }, { 'npc' => 'a|b' }, { 'after' => 'borrow' },
            { 'npc' => 'x', 'after' => 'later' }, { 'npc' => 'ok' }, { 'npc' => 'ok' }]
    assert_equal [{ 'npc' => 'ok', 'after' => nil }], CA.candidates(pc(list))
  end

  test 'pair' do
    assert_equal 'bay_pc|olu', CA.pair('bay_pc', 'olu')
    [[nil, 'a'], ['a', nil], ['', 'a'], ['a|b', 'c'], ['a', 'b|c'], [1, 'a']].each { |a, b| assert_nil CA.pair(a, b) }
  end

  test 'hash_record_id is nil for none or two records' do
    rec = ->(acct, pc) { { 'kind' => 'hash', 'account' => acct, 'proof' => { 'harvested' => pc } } }
    sc = { 'credentials' => { 'h1' => rec.call('olu', 'bay_pc'), 'h2' => rec.call('uma', 'bay_pc') } }
    assert_equal 'h1', CA.hash_record_id(sc, 'bay_pc', 'olu')
    assert_nil CA.hash_record_id(sc, 'bay_pc', 'sam')
    assert_nil CA.hash_record_id(sc, 'other_pc', 'olu')
    sc['credentials']['h3'] = rec.call('olu', 'bay_pc')
    assert_nil CA.hash_record_id(sc, 'bay_pc', 'olu')
    assert_nil CA.hash_record_id({}, 'bay_pc', 'olu')
    assert_nil CA.hash_record_id(nil, 'bay_pc', 'olu')
    sc['credentials']['h4'] = { 'kind' => 'password', 'account' => 'q', 'proof' => { 'harvested' => 'bay_pc' } }
    assert_nil CA.hash_record_id(sc, 'bay_pc', 'q')
  end

  test 'borrow_candidate' do
    p1 = pc([{ 'npc' => 'priya' }, { 'npc' => 'sam', 'after' => 'borrow' }])
    assert CA.borrow_candidate?(p1, 'sam')
    refute CA.borrow_candidate?(p1, 'priya')
    refute CA.borrow_candidate?(p1, 'nobody')
  end

  test 'proof_kind reads harvested' do
    assert_includes CM::PROOF_KINDS, 'harvested'
    assert_equal 'harvested', CM.proof_kind({ 'harvested' => 'bay_pc' })
    assert_nil CM.proof_kind({ 'harvested' => 'bay_pc', 'held' => 'x' })
    assert_nil CM.proof_kind({ 'harvested' => '' })
  end
end
