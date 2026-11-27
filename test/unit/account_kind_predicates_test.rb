require 'test_helper'

# S5c unit 05: account_kind_admits? and account_only?, and expand! skipping account-only NPCs
class AccountKindPredicatesTest < ActiveSupport::TestCase
  AI = BreakEscape::AccessIdentities

  def npc(creds)
    { 'id' => 'n', 'creds' => { 'username' => 'u' }.merge(creds) }
  end

  test 'no kind admits' do
    assert AI.account_kind_admits?({ 'id' => 'pc1' }, npc({}))
    assert AI.account_kind_admits?({}, npc({}))
    assert AI.account_kind_admits?({ 'id' => 'pc1' }, { 'id' => 'x' })
  end

  test 'local needs the pc id in localTo' do
    n = npc('accountKind' => 'local', 'localTo' => %w[a b])
    assert AI.account_kind_admits?({ 'id' => 'a' }, n)
    assert AI.account_kind_admits?({ 'id' => 'b' }, n)
    assert_not AI.account_kind_admits?({ 'id' => 'c' }, n)
    assert_not AI.account_kind_admits?({}, n)
    assert_not AI.account_kind_admits?({ 'id' => 'a' }, npc('accountKind' => 'local'))
  end

  test 'domain needs equal domains' do
    n = npc('accountKind' => 'domain', 'domain' => 'northwind')
    assert AI.account_kind_admits?({ 'id' => 'a', 'domain' => 'northwind' }, n)
    assert_not AI.account_kind_admits?({ 'id' => 'a', 'domain' => 'other' }, n)
    assert_not AI.account_kind_admits?({ 'id' => 'a' }, n)
    assert_not AI.account_kind_admits?({ 'id' => 'a', 'domain' => 'northwind' }, npc('accountKind' => 'domain'))
    assert_not AI.account_kind_admits?({ 'id' => 'a' }, npc('accountKind' => 'domain'))
  end

  test 'junk values refuse' do
    assert_not AI.account_kind_admits?({ 'id' => 'a' }, npc('accountKind' => 'local', 'localTo' => 'a'))
    assert_not AI.account_kind_admits?({ 'id' => 'a' }, npc('accountKind' => 'local', 'localTo' => [['a']]))
    assert_not AI.account_kind_admits?({ 'id' => 5 }, npc('accountKind' => 'local', 'localTo' => [5]))
    assert_not AI.account_kind_admits?({ 'id' => 'a', 'domain' => 5 }, npc('accountKind' => 'domain', 'domain' => 5))
    assert_not AI.account_kind_admits?({ 'id' => 'a' }, npc('accountKind' => 'cloud'))
    assert_not AI.account_kind_admits?({ 'id' => 'a' }, npc('accountKind' => nil))
    assert_not AI.account_kind_admits?({ 'id' => 'a' }, npc('accountKind' => ['local']))
    assert_not AI.account_kind_admits?(nil, npc('accountKind' => 'local', 'localTo' => ['a']))
  end

  test 'account_only is strict' do
    assert AI.account_only?({ 'accountOnly' => true })
    [false, nil, 'true', 1].each { |v| assert_not AI.account_only?({ 'accountOnly' => v }) }
    assert_not AI.account_only?({})
    assert_not AI.account_only?(nil)
  end

  test 'expand! leaves an account-only npc untouched' do
    scenario = { 'rooms' => { 'r' => { 'npcs' => [
      { 'id' => 'ghost', 'accountOnly' => true, 'awareness' => 'high', 'creds' => { 'username' => 'g' } },
      { 'id' => 'bob', 'awareness' => 'high' }
    ] } } }
    BreakEscape::NpcHabits.expand!(scenario)
    npcs = scenario['rooms']['r']['npcs']
    assert_not npcs[0].key?('habits')
    assert_equal 'always', npcs[1]['habits']['locksScreen']
  end
end
