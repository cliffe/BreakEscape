require 'test_helper'
require_relative '../../support/lock_step_scanner_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops hardening U3 (HARDENING_BUILD_BRIEF 3.5): the lock rules read two things the recorder and the server add.
  #  - P11: in a tagged run the row's `pc` tag says whose request an echo-less lock-form answer answers; it is the PC's only when that
  #    PC has an open step of a kind the route serves, and a null tag is never the PC's. An untagged run keeps the old rule.
  #  - K1: an answer with `routeRoom: true` (a route room not yet promoted) never marks its room opened and un-marks one that was; the
  #    room re-opens only by a door open that proves it, or a 200 object unlock whose echo names a non-movable object of exactly that room.
  # Server answers are read from the shared answers (answers.json); only the PC form's own answers and the marked room answers are
  # written here, the marker being the one key the server (U4) adds.
  class AccessLeakScannerLockStepTagsTest < ActiveSupport::TestCase
    include LockStepScannerRows

    PC_MESSAGE = BreakEscape::Game::LOGIN_INCORRECT

    # ---- P11 --------------------------------------------------------------------------------------------------------------

    def mixed
      data = mfa_data
      room = data['rooms'].values.find { |r| r.is_a?(Hash) && r['objects'].is_a?(Array) }
      room['objects'] << lock_obj('gordon_locker', 'code', 'gordon', [note('locker_memo')])
      room['npcs'] = Array(room['npcs']) + [{ 'id' => 'gordon', 'displayName' => 'Gordon', 'habits' => { 'approvesPrompts' => 'always' } }]
      data
    end

    def tagged(row, pc)
      row['pc'] = pc.nil? ? nil : { 'pcId' => pc }
      row
    end

    # a code-step PC login, the lock's gate, then an echo-less refusal of mfa/verify, the tag being `pc` (a PC id, or nil for null)
    def refusal_run(data, tag_with, pc_tag: nil, tagged_run: true)
      step = pc_steps(data).find { |x| x.last == 'code' }
      start
      row = pc_required(step) && @rows.last
      tagged(row, step[0]) if tagged_run
      answer('gate_code') { |b| b['targetId'] = 'gordon_locker'; b['npcId'] = 'gordon' }
      refusal = raw('POST', 'mfa/verify', { 'success' => false, 'message' => PC_MESSAGE, 'mfaIncorrect' => true }, status: 422)
      tagged(refusal, tag_with == :own ? step[0] : pc_tag) if tagged_run
      [step, refusal]
    end

    def refusal_findings(data)
      scan_rows(@rows, data).select { |f| f.rule == 'lock_step_answer' && f.owner.start_with?('lockstep:refusal') }
    end

    test 'T14: a tagged echo-less refusal is the PC\'s only when its tag names the PC with the open step' do
      data = mixed
      refusal_run(data, :own)
      assert_equal [], refusal_findings(data)
    end

    test 'T14b: a null tag, or a tag naming a PC with no open step, is never the PC\'s' do
      data = mixed
      other = (pc_steps(data).map(&:first).uniq + AccessLeakScanner.new(data).instance_variable_get(:@priv_pcs).keys).uniq
      step = pc_steps(data).find { |x| x.last == 'code' }
      idle = other.find { |pc| pc != step[0] && pc_steps(data).none? { |s| s.first == pc && s.last == 'code' } }
      refusal_run(data, :other, pc_tag: nil)
      assert_includes refusal_findings(data).map(&:owner), 'lockstep:refusal:mfa/verify'
      if idle
        data = mixed
        refusal_run(data, :other, pc_tag: idle)
        assert_includes refusal_findings(data).map(&:owner), 'lockstep:refusal:mfa/verify'
      end
    end

    test 'T15: an untagged run keeps the old rule (any open step of the kind owns it)' do
      data = mixed
      refusal_run(data, :own, tagged_run: false)
      assert_equal [], refusal_findings(data)
    end

    test 'T15b: a tagged PC with a step of the wrong kind for the route does not own it' do
      data = mixed
      step = pc_steps(data).find { |x| x.last == 'push' }
      skip 'no push PC step in the scenario' unless step
      start
      tagged(pc_required(step) && @rows.last, step[0])
      answer('gate_code') { |b| b['targetId'] = 'gordon_locker'; b['npcId'] = 'gordon' }
      tagged(raw('POST', 'mfa/verify', { 'success' => false, 'message' => PC_MESSAGE, 'mfaIncorrect' => true }, status: 422), step[0])
      assert_includes refusal_findings(data).map(&:owner), 'lockstep:refusal:mfa/verify'
    end

    # ---- K1 ---------------------------------------------------------------------------------------------------------------

    # a route room `vault` with a lock step: two fixed gated locks (one to prove with, one to probe with), a fixed container holding a
    # nested takeable lock (T17d), a top-level takeable lock, and a second room that authors a clashing id
    def vault_data
      data = mixed
      data['rooms']['vault'] = {
        'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '9999', 'connections' => {},
        'objects' => [
          lock_obj('vault_safe', 'code', 'gordon', [note('vault_memo')]),
          lock_obj('vault_box', 'code', 'gordon', [note('box_memo')]),
          { 'id' => 'vault_desk', 'type' => 'desk', 'name' => 'Desk', 'contents' => [lock_obj('desk_carry', 'code', 'gordon', [note('carry_memo')]).merge('takeable' => true)] },
          lock_obj('vault_pocket', 'code', 'gordon', [note('pocket_memo')]).merge('takeable' => true)
        ]
      }
      data['rooms']['annex'] = { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '8888', 'connections' => {},
                                 'objects' => [{ 'id' => 'vault_box_twin', 'type' => 'notes', 'name' => 'twin' }] }
      data
    end

    def door_open(marked: false, ids: %w[vault_desk])
      body = { 'success' => true, 'type' => 'door',
               'roomData' => { 'type' => 'room_office', 'locked' => true, 'objects' => ids.map { |i| { 'id' => i, 'type' => 'desk', 'name' => i } } } }
      body['routeRoom'] = true if marked
      raw('POST', 'unlock', body)
    end

    def get_room(marked: false)
      body = { 'type' => 'room_office', 'objects' => [{ 'id' => 'vault_desk', 'type' => 'desk', 'name' => 'Desk' }] }
      body['routeRoom'] = true if marked
      raw('GET', 'room/vault', body)
    end

    # an object unlock answer (200) whose echo names `id`
    def object_unlock(id, type: 'object', marked: false, echo: true)
      body = { 'success' => true, 'type' => 'object' }
      body.merge!('targetType' => type, 'targetId' => id) if echo
      body['routeRoom'] = true if marked
      raw('POST', 'unlock', body)
    end

    def probe_gate
      answer('gate_code') { |b| b['targetId'] = 'vault_box'; b['npcId'] = 'gordon' }
    end

    def shut?(data)
      scan_rows(@rows, data).any? { |f| f.owner == 'lockstep:gate:room:object:vault_box' }
    end

    test 'T17: a door open of a route room marked routeRoom does not open the room; the same open without the key does' do
      data = vault_data
      start
      door_open
      probe_gate
      refute shut?(data), 'an honest open opens the room'
      start
      door_open(marked: true)
      probe_gate
      assert shut?(data), 'a marked open must leave the room shut'
    end

    test 'T17: a marked answer un-marks a room that was opened, GET room as well as a door open' do
      data = vault_data
      [-> { get_room(marked: true) }, -> { door_open(marked: true) }].each do |marker|
        start
        door_open
        marker.call
        probe_gate
        assert shut?(data)
      end
    end

    test 'T17b: a door open that proves the room re-opens it' do
      data = vault_data
      start
      door_open(marked: true)
      door_open
      probe_gate
      refute shut?(data)
    end

    test 'T17b: a bare GET room opens nothing new, marked or not' do
      data = vault_data
      start
      door_open(marked: true)
      get_room
      probe_gate
      assert shut?(data)
    end

    test 'T17c: an object unlock whose echo names a fixed object of exactly that room re-opens it' do
      data = vault_data
      start
      door_open(marked: true)
      object_unlock('vault_safe')
      probe_gate
      refute shut?(data)
    end

    test 'T17c: an echo-less object answer, a door echo, an unknown id, or a marked answer proves nothing' do
      data = vault_data
      [-> { object_unlock('vault_safe', echo: false) },
       -> { object_unlock('vault_safe', type: 'door') },
       -> { object_unlock('no_such_object') },
       -> { object_unlock('vault_safe', marked: true) }].each_with_index do |proof, i|
        start
        door_open(marked: true)
        proof.call
        probe_gate
        assert shut?(data), "case #{i}"
      end
    end

    test 'T17c: an id of two rooms proves nothing' do
      data = vault_data
      data['rooms']['annex']['objects'] << { 'id' => 'vault_safe', 'type' => 'notes', 'name' => 'dup' }
      start
      door_open(marked: true)
      object_unlock('vault_safe')
      probe_gate
      assert shut?(data)
    end

    test 'T17d: a movable object, at the top level or nested in a fixed container, proves nothing (R5-m2)' do
      data = vault_data
      scanner = AccessLeakScanner.new(data)
      start
      raw('GET', 'scenario', {})
      scanner.scan(@rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
      assert_includes scanner.instance_variable_get(:@ls_room_ids)['vault'], 'desk_carry', 'the room proof itself still holds the nested id'
      %w[desk_carry vault_pocket].each do |id|
        start
        door_open(marked: true)
        object_unlock(id)
        probe_gate
        assert shut?(data), id
      end
    end

    test 'inert: a capture with no routeRoom key is judged as before' do
      data = vault_data
      start
      door_open
      get_room
      object_unlock('vault_safe')
      probe_gate
      refute shut?(data)
    end
  end
end
