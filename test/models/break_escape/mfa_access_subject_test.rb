# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8a unit 14: the subject functions of the second sign-in step, push and approve.
  class MfaAccessSubjectTest < ActiveSupport::TestCase
    KS = KeyringLoginScenario
    PC_B = { kind: 'pc', id: 'pc:b' }.freeze
    T0 = Time.zone.at(1_800_000_000)
    PC = { kind: 'pc', id: 'jake_pc' }.freeze
    OTHER = { kind: 'test_only', id: 'x1' }.freeze
    PHONE = { 'id' => 'ann_phone', 'type' => 'phone_friendface', 'name' => 'Ann phone', 'owner' => 'ann' }.freeze

    setup do
      Game.include(MfaAccess) unless Game.include?(MfaAccess)
      @map = {}
      travel_to T0
    end

    teardown { travel_back }

    def scenario(habits)
      data = KS.scenario
      data['rooms']['lobby']['npcs'] << { 'id' => 'ann', 'displayName' => 'Ann', 'npcType' => 'person',
                                          'position' => { 'x' => 3, 'y' => 3 }, 'habits' => habits }
      data['rooms']['lobby']['objects'] << PHONE.merge('takeable' => true)
      data
    end

    def build(habits = { 'approvesPrompts' => 'always' }, state = {})
      @game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                 scenario: scenario(habits), player_state: { 'currentRoom' => 'lobby' }.merge(state))
    end

    def issue(kind = 'push', key = 'pc:a')
      @game.issue_second_step!(@map, key, 'ann', kind)
    end

    def send_prompt(key: 'pc:a', subject: PC, map: @map, **opts)
      @game.send_second_step_prompt(map, key, subject, npc_id: 'ann', **opts)
    end

    def later(seconds)
      travel_to Time.zone.at(Time.current.to_i + seconds)
    end

    def hold_phone
      @game.player_state['inventory'] = [PHONE.slice('id', 'type', 'owner')]
    end

    def prompts
      @game.player_state['mfaPrompts']
    end

    test 'no live push record is expired, and a code record is not a push record' do
      build
      assert_equal :expired, send_prompt
      @game.issue_second_step!(@map, 'pc:a', 'ann', 'code')
      assert_equal :expired, send_prompt
    end

    test 'case 1: a re-enrolled pc subject waits on the own phone; another subject skips it' do
      build({ 'approvesPrompts' => 'never' })
      issue
      assert_equal [:waiting, 'own_phone'], send_prompt(reenrolled: true)
      assert_nil prompts['ann']
      later(3)
      assert_equal [:waiting, 'owner'], send_prompt(reenrolled: true, subject: OTHER)
    end

    test 'case 2: the held owner phone takes the prompt and does not raise the count' do
      build({ 'approvesPrompts' => 'always' })
      hold_phone
      issue
      assert_equal [:waiting, 'held_phone'], send_prompt
      assert_nil prompts['ann']
    end

    test 'case 3: a taken phone that is not held is nobody' do
      build({ 'approvesPrompts' => 'always' }, 'phonesTaken' => ['ann'])
      issue
      assert_equal :nobody, send_prompt
    end

    test 'case 4: a knocked-out owner approves nothing' do
      build({ 'approvesPrompts' => 'always' }, 'npcHostility' => { 'ann' => { 'ko' => true } })
      issue
      assert_equal :nobody, send_prompt
      assert_equal :no_phone, @game.approve_second_step(@map, 'pc:a', PC, npc_id: 'ann')
    end

    test 'case 5: always approves and resets the count' do
      build({ 'approvesPrompts' => 'always' })
      issue
      assert_equal :passed, send_prompt
      assert_equal 0, prompts['ann']
    end

    test 'never does not approve; the count survives a new attempt and resets on approval' do
      build({ 'approvesPrompts' => 'never' })
      issue
      assert_equal [:waiting, 'owner'], send_prompt
      later(3)
      assert_equal [:waiting, 'owner'], send_prompt
      issue
      later(3)
      send_prompt
      assert_equal 3, prompts['ann']
      hold_phone
      assert_equal :passed, @game.approve_second_step(@map, 'pc:a', PC, npc_id: 'ann')
      assert_equal 0, prompts['ann']
    end

    test 'pestered approves at patience 3 and at an authored patience' do
      build({ 'approvesPrompts' => 'pestered' })
      issue
      2.times { assert_equal [:waiting, 'owner'], send_prompt.tap { later(3) } }
      assert_equal :passed, send_prompt
      build({ 'approvesPrompts' => 'pestered', 'promptPatience' => 5 })
      @map.clear
      issue
      4.times { assert_equal [:waiting, 'owner'], send_prompt.tap { later(3) } }
      assert_equal :passed, send_prompt
    end

    test 'too soon, then the cap drops the record' do
      build({ 'approvesPrompts' => 'never' })
      issue
      send_prompt
      assert_equal [:too_soon, 2], send_prompt
      later(1)
      assert_equal [:too_soon, 1], send_prompt
      (MfaModel::MAX_PROMPTS - 1).times { later(3); send_prompt }
      later(3)
      assert_equal :expired, send_prompt
      assert_nil @map['pc:a']
    end

    test 'number matching is never approved by the owner' do
      build({ 'approvesPrompts' => 'always' })
      issue('push_number_match')
      assert_equal [:waiting, 'owner'], send_prompt
      assert_equal 1, prompts['ann']
    end

    test 'numbers are stable within an attempt and differ for the next' do
      build
      rec = issue('push_number_match')
      a = @game.second_step_numbers(PC, rec, npc_id: 'ann')
      assert_equal a, @game.second_step_numbers(PC, rec, npc_id: 'ann')
      assert_equal 3, a[:choices].uniq.size
      assert_includes a[:choices], a[:right]
      rec2 = issue('push_number_match')
      refute_equal a[:choices], @game.second_step_numbers(PC, rec2, npc_id: 'ann')[:choices]
    end

    test 'approve: needs the held phone, deny and a wrong number cancel, the right number passes' do
      build
      rec = issue('push_number_match')
      right = @game.second_step_numbers(PC, rec, npc_id: 'ann')
      assert_equal :no_phone, @game.approve_second_step(@map, 'pc:a', PC, npc_id: 'ann', number: right[:right])
      hold_phone
      assert_equal :cancelled, @game.approve_second_step(@map, 'pc:a', PC, npc_id: 'ann', number: right[:wrong][0])
      assert_nil @map['pc:a']
      assert_nil @game.player_state['mfaAccounts']['ann']['wrong']
      rec = issue('push_number_match')
      right = @game.second_step_numbers(PC, rec, npc_id: 'ann')[:right]
      assert_equal :cancelled, @game.approve_second_step(@map, 'pc:a', PC, npc_id: 'ann', number: right, deny: true)
      rec = issue('push_number_match')
      right = @game.second_step_numbers(PC, rec, npc_id: 'ann')[:right]
      assert_equal :passed, @game.approve_second_step(@map, 'pc:a', PC, npc_id: 'ann', number: right)
      assert @map['pc:a']
    end

    test 'requests list waiting pushes once per subject, numbers unmarked, in model order' do
      build
      issue('push', 'pc:a')
      issue('push_number_match', 'pc:b')
      @game.issue_second_step!(@map, 'pc:c', 'ann', 'code')
      other = { 'pc:a' => { 'kind' => 'push', 'n' => 9, 'at' => T0.to_i } }
      list = @game.second_step_requests([{ kind: 'pc', map: @map }, { kind: 'pc', map: other }], npc_id: 'ann')
      assert_equal %w[pc:pc:a pc:pc:b], list.map { |r| r['key'] }
      assert_equal %w[pc:a pc:b], list.map { |r| r['id'] }
      assert_equal 0, list[0]['n']
      assert_nil list[0]['numbers']
      assert_equal @game.second_step_numbers(PC_B, @map['pc:b'], npc_id: 'ann')[:choices], list[1]['numbers']
    end

    test 'another subject kind: passed leaves the record, numbers and request keys differ, shared per-owner entries move' do
      build({ 'approvesPrompts' => 'always' })
      pc_rec = issue('push_number_match', 'x1')
      door = { kind: 'door', id: 'x1' }
      door_map = { 'x1' => pc_rec.merge('nonce' => pc_rec['nonce']) }
      pc_numbers = @game.second_step_numbers({ kind: 'pc', id: 'x1' }, pc_rec, npc_id: 'ann')
      assert_equal pc_numbers, @game.second_step_numbers({ kind: 'pc', id: 'x1' }, pc_rec, npc_id: 'ann')
      refute_equal pc_numbers[:choices], @game.second_step_numbers(door, pc_rec, npc_id: 'ann')[:choices]
      list = @game.second_step_requests([{ kind: 'pc', map: @map }, { kind: 'door', map: door_map }], npc_id: 'ann')
      assert_equal %w[door:x1 pc:x1], list.map { |r| r['key'] }.sort
      assert_equal 2, list.size
      assert_equal pc_numbers[:choices], list.find { |r| r['key'] == 'pc:x1' }['numbers']
      refute_equal pc_numbers[:choices], list.find { |r| r['key'] == 'door:x1' }['numbers']
      issue('push', 'x1')
      assert_equal 2, @game.player_state['mfaAccounts']['ann']['started']
      assert_equal :passed, send_prompt(key: 'x1', subject: OTHER)
      assert @map['x1']
      issue('push', 'x1')
      assert_equal [:waiting, 'own_phone'], send_prompt(key: 'x1', subject: PC, reenrolled: true)
      @game.issue_second_step!(@map, 'x1', 'ann', 'push')
      later(3)
      assert_equal :passed, send_prompt(key: 'x1', subject: OTHER, reenrolled: true)
      assert_equal :no_phone, @game.approve_second_step(@map, 'x1', OTHER, npc_id: 'ann', reenrolled: true)
      assert @map['x1']
    end
  end
end
