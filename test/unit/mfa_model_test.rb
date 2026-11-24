require 'test_helper'

# S8a unit 03: BreakEscape::MfaModel, pure functions of the authored scenario.
class MfaModelTest < ActiveSupport::TestCase
  MM = BreakEscape::MfaModel
  KEY = 'test-key'.freeze

  def dev(id = 'dev1', owner = 'jake')
    { 'type' => 'code_device', 'id' => id, 'name' => 'Token', 'owner' => owner }
  end

  def scen(objects: [], npcs: [], start: [], extra: {})
    { 'rooms' => { 'r' => { 'objects' => objects, 'npcs' => npcs } }, 'startItemsInInventory' => start }.merge(extra)
  end

  test 'kinds' do
    assert_equal 'push', MM.kind({ 'mfa' => 'push' })
    assert_equal 'code', MM.kind({ 'mfa' => 'code' })
    assert_equal 'none', MM.kind({ 'mfa' => 'sms' })
    assert_equal 'none', MM.kind({})
    assert_equal 'none', MM.kind(nil)
  end

  test 'enrolment: only the literal false exempts' do
    assert MM.enrolled?({ 'id' => 'a' })
    assert MM.enrolled?({ 'creds' => { 'mfa' => 'false' } })
    assert MM.enrolled?({ 'creds' => { 'mfa' => 0 } })
    assert MM.enrolled?({ 'creds' => { 'mfa' => true } })
    refute MM.enrolled?({ 'creds' => { 'mfa' => false } })
  end

  test 'device lookup in each home' do
    assert_equal 'dev1', MM.device_for(scen(objects: [dev]), 'jake')['id']
    assert_equal 'dev1', MM.device_for(scen(objects: [{ 'type' => 'safe', 'contents' => [dev] }]), 'jake')['id']
    assert_equal 'dev1', MM.device_for(scen(npcs: [{ 'id' => 'bob', 'itemsHeld' => [dev] }]), 'jake')['id']
    assert_equal 'dev1', MM.device_for(scen(start: [dev]), 'jake')['id']
    assert_nil MM.device_for(scen(objects: [dev]), 'ann')
    assert_nil MM.device_for(scen, 'jake')
    assert_nil MM.device_for(scen(objects: [dev]), nil)
  end

  test 'held_item_sources' do
    held = ->(npc) { MM.held_item_sources(scen(npcs: [npc.merge('itemsHeld' => [dev])])) }
    assert_equal [], held.call({ 'id' => 'a', 'koImmune' => true })
    assert_equal [], held.call({ 'id' => 'a', 'npcType' => 'phone' })
    assert_equal [{ type: 'code_device', id: 'dev1', via: :knock_out }], held.call({ 'id' => 'a' })
    assert_equal [], MM.held_item_sources(scen(npcs: [{ 'id' => 'a', 'itemsHeld' => [dev] }], extra: { 'disableAttacks' => true }))
    offer = { 'id' => 'a', 'koImmune' => true, 'note' => '# give_item:code_device' }
    assert_equal [{ type: 'code_device', id: 'dev1', via: :offer }], held.call(offer)
    assert_equal [{ type: 'code_device', id: 'dev1', via: :object }], MM.held_item_sources(scen(objects: [dev]))
    assert_equal [{ type: 'code_device', id: 'dev1', via: :start }], MM.held_item_sources(scen(start: [dev]))
    assert_equal [], MM.held_item_sources({ 'rooms' => {}, 'headless' => [dev], 'declaredGrants' => [dev] })
    assert_equal [], MM.held_item_sources(scen(objects: [{ 'type' => 'key', 'id' => 'k' }]))
  end

  test 'a code is six digits, fixed for key and time, and differs by device' do
    c = MM.code(KEY, 7, 'dev1', 100)
    assert_match(/\A\d{6}\z/, c)
    assert_equal c, MM.code(KEY, 7, 'dev1', 100)
    refute_equal c, MM.code(KEY, 7, 'own:jake', 100)
    refute_equal c, MM.code(KEY, 7, 'dev1', 101)
    refute_equal c, MM.code(KEY, 8, 'dev1', 100)
    refute_equal c, MM.code('other', 7, 'dev1', 100)
  end

  test 'code_state across the windows' do
    codes = (97..100).to_h { |w| [w, MM.code(KEY, 1, 'd', w)] }
    assert_equal [:right, nil], MM.code_state(codes[100], codes, nil, 100)
    assert_equal [:right, nil], MM.code_state(codes[99], codes, nil, 100)
    assert_equal [:stale, :expired], MM.code_state(codes[98], codes, nil, 100)
    assert_equal [:stale, :expired], MM.code_state(codes[97], codes, nil, 100)
    assert_equal [:wrong, nil], MM.code_state('000000x', codes, nil, 100)
    assert_equal [:right, nil], MM.code_state(codes[100], codes, 99, 100)
    assert_equal [:stale, :used], MM.code_state(codes[100], codes, 100, 100)
    assert_equal [:stale, :used], MM.code_state(codes[99], codes, 100, 100)
    assert_equal [:stale, :used], MM.code_state(codes[99], codes, 99, 100)
    assert_equal [:wrong, nil], MM.code_state(nil, codes, nil, 100)
  end

  test 'numbers: three different values in a fixed order, changing with subject and nonce' do
    n = MM.numbers(KEY, 1, 's', 'jake', 0)
    assert_equal 3, n[:choices].uniq.size
    assert_equal [n[:right], *n[:wrong]].sort, n[:choices].sort
    assert n[:choices].all? { |v| v.between?(10, 99) }
    assert_equal n, MM.numbers(KEY, 1, 's', 'jake', 0)
    refute_equal n, MM.numbers(KEY, 1, 'other', 'jake', 0)
    refute_equal n, MM.numbers(KEY, 1, 's', 'jake', 1)
    orders = (0..40).map { |i| MM.numbers(KEY, 1, 's', 'jake', i)[:choices].index(MM.numbers(KEY, 1, 's', 'jake', i)[:right]) }
    assert orders.uniq.size > 1
  end

  test 'prompt_habit per level and authored' do
    sc = {}
    assert_equal 'pestered', MM.prompt_habit({ 'awareness' => 'low' }, sc)
    assert_equal 'never', MM.prompt_habit({ 'awareness' => 'medium' }, sc)
    assert_equal 'never', MM.prompt_habit({ 'awareness' => 'high' }, sc)
    assert_equal 'never', MM.prompt_habit({ 'id' => 'a' }, sc)
    assert_equal 'always', MM.prompt_habit({ 'awareness' => 'high', 'habits' => { 'approvesPrompts' => 'always' } }, sc)
    assert_equal 'pestered', MM.prompt_habit({ 'awareness' => 'low', 'habits' => { 'approvesPrompts' => 'bogus' } }, sc)
  end

  test 'prompt_patience bounds' do
    assert_equal 3, MM.prompt_patience({})
    assert_equal 2, MM.prompt_patience({ 'habits' => { 'promptPatience' => 2 } })
    assert_equal 9, MM.prompt_patience({ 'habits' => { 'promptPatience' => 9 } })
    assert_equal 3, MM.prompt_patience({ 'habits' => { 'promptPatience' => 1 } })
    assert_equal 3, MM.prompt_patience({ 'habits' => { 'promptPatience' => 10 } })
    assert_equal 3, MM.prompt_patience({ 'habits' => { 'promptPatience' => '5' } })
  end

  test 'constants' do
    assert_equal 60, MM::STEP_SECONDS
    assert_equal 300, MM::CODE_CLOSED_SECONDS
    assert_equal 5, MM::MAX_CODE_TRIES
  end
end
