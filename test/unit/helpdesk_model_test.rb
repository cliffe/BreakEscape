require 'test_helper'

# S8b unit 02: BreakEscape::HelpdeskModel, pure functions of the authored scenario.
class HelpdeskModelTest < ActiveSupport::TestCase
  HM = BreakEscape::HelpdeskModel

  def scen(desk = {})
    { 'helpdesks' => { 'it' => { 'npc' => 'ria', 'verify' => 'questions', 'questions' => %w[a b c] }.merge(desk) } }
  end

  def desk(extra = {})
    HM.desks(scen(extra))['it']
  end

  test 'absent or malformed helpdesks give an empty map' do
    assert_equal({}, HM.desks({}))
    assert_equal({}, HM.desks(nil))
    assert_equal({}, HM.desks({ 'helpdesks' => [] }))
    assert_equal({}, HM.desks({ 'helpdesks' => { 'x' => 'y' } }))
    assert_nil HM.forms({})
  end

  test 'defaults and bounds' do
    d = desk
    assert_equal 3, d['maxTries']
    assert_equal 3, d['minCorrect']
    assert_equal [], d['resets']
    assert_equal 5, desk('maxTries' => 5)['maxTries']
    [0, 10, '3', nil, 2.5].each { |v| assert_equal 3, desk('maxTries' => v)['maxTries'] }
    assert_equal %w[password mfa], desk('resets' => %w[mfa bogus password password])['resets']
    assert_equal [], desk('resets' => 'password')['resets']
  end

  test 'invalid verify is read as questions with all required' do
    d = desk('verify' => 'telepathy', 'minCorrect' => 1)
    assert_equal 'questions', d['verify']
    assert_equal 3, d['minCorrect']
    assert_equal 'none', desk('verify' => 'none')['verify']
    assert_equal 'callback', desk('verify' => 'callback')['verify']
  end

  test 'minCorrect below, at and above' do
    assert_equal 1, desk('minCorrect' => 1)['minCorrect']
    assert_equal 3, desk('minCorrect' => 3)['minCorrect']
    assert_equal 3, desk('minCorrect' => 4)['minCorrect']
    assert_equal 3, desk('minCorrect' => 0)['minCorrect']
    assert_equal 3, desk('minCorrect' => 'x')['minCorrect']
  end

  test 'desk_for_npc' do
    id, d = HM.desk_for_npc(scen, 'ria')
    assert_equal 'it', id
    assert_equal 'ria', d['npc']
    assert_nil HM.desk_for_npc(scen, 'other')
    assert_nil HM.desk_for_npc(scen, nil)
  end

  test 'normalise_answer' do
    assert_equal 'a b c', HM.normalise_answer("  A   B\tC ")
    assert_equal 64, HM.normalise_answer('x' * 100).length
    assert_equal '', HM.normalise_answer(nil)
    assert_equal '', HM.normalise_answer(12)
    assert_equal '', HM.normalise_answer(['a'])
    assert_equal 64, HM.normalise_answer('é' * 70).length
  end

  test 'clean_username and tries_key' do
    assert_equal 'AB', HM.clean_username("A\u0000B\n")
    assert_equal 64, HM.clean_username('u' * 80).length
    assert_equal '', HM.clean_username(nil)
    assert_equal 'it|s.okoro', HM.tries_key('it', '  S.Okoro ')
  end

  test 'answers_right and rule_met? with minCorrect' do
    rec = { 'a' => 'Alpha', 'b' => 'Beta Two', 'c' => 'Gamma' }
    d = desk('minCorrect' => 2)
    given = { 'a' => ' alpha ', 'b' => 'beta  two', 'c' => 'wrong' }
    assert_equal 2, HM.answers_right(d, rec, given)
    assert HM.rule_met?(d, rec, given)
    assert_not HM.rule_met?(d, rec, { 'a' => 'alpha' })
    assert_not HM.rule_met?(desk, rec, given)
    assert HM.rule_met?(desk, rec, { 'a' => 'alpha', 'b' => 'beta two', 'c' => 'gamma' })
    assert_equal 0, HM.answers_right(d, rec, 'junk')
    assert_equal 0, HM.answers_right(d, nil, given)
  end

  test 'empty answer against empty recovery value is wrong' do
    d = desk('questions' => ['a'], 'minCorrect' => 1)
    assert_not HM.rule_met?(d, { 'a' => '' }, { 'a' => '' })
    assert_not HM.rule_met?(d, {}, { 'a' => '' })
    assert_not HM.rule_met?(d, { 'a' => '  ' }, { 'a' => ' ' })
    assert_not HM.rule_met?(desk('questions' => []), {}, {})
  end

  test 'forms carries the three keys and nothing else' do
    hostile = scen('verify' => 'callback', 'resets' => %w[password], 'maxTries' => 2, 'minCorrect' => 1, 'secret' => 'x',
                   'questionLabels' => { 'a' => 'L' * 60, 'b' => 7, 'zzz' => 'not asked' })
    f = HM.forms(hostile)
    assert_equal ['it'], f.keys
    assert_equal %w[npc questionLabels resets], f['it'].keys.sort
    assert_equal 'ria', f['it']['npc']
    assert_equal %w[password], f['it']['resets']
    assert_equal({ 'a' => 'L' * 40 }, f['it']['questionLabels'])
  end

  test 'covers? per rule' do
    npc = { 'creds' => { 'resetPassword' => 'pw', 'recovery' => { 'a' => '1', 'b' => '2', 'c' => '3' } } }
    q = desk('resets' => %w[password mfa])
    assert HM.covers?(q, npc, 'password')
    assert HM.covers?(q, npc, 'mfa')
    assert_not HM.covers?(q, npc, 'bogus')
    assert_not HM.covers?(desk('resets' => %w[mfa]), npc, 'password')
    no_pw = { 'creds' => { 'recovery' => npc['creds']['recovery'] } }
    assert_not HM.covers?(q, no_pw, 'password')
    assert HM.covers?(q, no_pw, 'mfa')
    short = { 'creds' => { 'resetPassword' => 'pw', 'recovery' => { 'a' => '1', 'b' => '' } } }
    assert_not HM.covers?(q, short, 'password')
    none = desk('verify' => 'none', 'resets' => %w[password])
    assert HM.covers?(none, { 'creds' => { 'resetPassword' => 'pw' } }, 'password')
    cb = desk('verify' => 'callback', 'resets' => %w[mfa])
    assert HM.covers?(cb, { 'creds' => {} }, 'mfa')
    assert_not HM.covers?(q, nil, 'mfa')
  end

  test 'a desk serves directory and domain accounts, never an account-only or a local account' do
    assert HM.desk_serves_account?({ 'creds' => {} })
    assert HM.desk_serves_account?({ 'creds' => { 'accountKind' => 'domain', 'domain' => 'northwind' } })
    assert_not HM.desk_serves_account?({ 'accountOnly' => true, 'creds' => {} })
    assert_not HM.desk_serves_account?({ 'creds' => { 'accountKind' => 'local', 'localTo' => ['pc'] } })
    assert_not HM.desk_serves_account?(nil)
    none = desk('verify' => 'none', 'resets' => %w[password mfa])
    assert_not HM.covers?(none, { 'accountOnly' => true, 'creds' => { 'resetPassword' => 'pw' } }, 'mfa')
    assert_not HM.covers?(none, { 'creds' => { 'accountKind' => 'local', 'resetPassword' => 'pw' } }, 'password')
  end
end
