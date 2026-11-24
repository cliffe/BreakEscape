require 'test_helper'
require_relative '../../support/lock_step_scanner_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c fixes for the second scanner review (docs/agents/ops_core_build/reviews/S8c_R1_scanner.md): the findings proved on
  # captures built from the shared answer shapes (test/fixtures/files/lock_step/answers.json, through `answer(name)`).
  class AccessLeakScannerLockStepR1fixTest < ActiveSupport::TestCase
    include LockStepScannerRows

    def scenario
      npc = ->(id) { { 'id' => id, 'displayName' => id.capitalize, 'habits' => { 'approvesPrompts' => 'always' } } }
      { 'startRoom' => 'hall',
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'records_room' },
                      'npcs' => [npc.call('moira').merge('unlockable' => ['records_room']), npc.call('priya')],
                      'objects' => [lock_obj('moira_locker', 'push', 'moira', [note('locker_memo')], name: "Moira's locker"),
                                    lock_obj('moira_desk', 'push', 'moira', [note('desk_note')]),
                                    lock_obj('moira_cabinet', 'code', 'moira', [note('cabinet_file')]),
                                    lock_obj('priya_safe', 'push_number_match', 'priya', [note('safe_note')], name: "Priya's safe"),
                                    { 'id' => 'moira_phone', 'type' => 'phone_friendface', 'owner' => 'moira', 'name' => 'p' },
                                    { 'id' => 'priya_phone', 'type' => 'phone_friendface', 'owner' => 'priya', 'name' => 'p' },
                                    { 'id' => 'moira_fob', 'type' => 'code_device', 'owner' => 'moira', 'name' => 'Code device' }] },
          'records_room' => { 'type' => 'room_records', 'connections' => { 'south' => 'hall' }, 'objects' => [note('rec_file')],
                              'locked' => true, 'secondStep' => { 'kind' => 'push', 'owner' => 'moira' } }
        } }
    end

    def mixed
      data = mfa_data
      extra = scenario
      room = data['rooms'].values.find { |r| r.is_a?(Hash) && r['objects'].is_a?(Array) }
      room['objects'].concat(extra['rooms']['hall']['objects'])
      room['npcs'] = Array(room['npcs']) + extra['rooms']['hall']['npcs']
      data['rooms'].merge!(extra['rooms'].slice('records_room'))
      data
    end

    def scan(data = scenario)
      scan_rows(@rows, data)
    end

    def lock(findings)
      lock_findings(findings)
    end

    # ---- R1-SCANNER1 --------------------------------------------------------------------------------------------------------

    test 'R1-SCANNER1 in a scenario with no lock step a PC answer that carries targetType or targetId still closes and counts as a PC answer' do
      data = mfa_data
      assert_empty BreakEscape::LockStepModel.each_lock_step(data).to_a
      message = BreakEscape::Game::LOGIN_INCORRECT
      steps = pc_steps(data)
      assert_not_empty steps
      refusals = [{ 'success' => false, 'message' => message, 'expired' => true, 'targetId' => 'zzz' },
                  { 'success' => false, 'cancelled' => true, 'targetType' => 'object' },
                  { 'success' => false, 'message' => message, 'lockedOut' => true, 'retryIn' => 60, 'targetId' => 'zzz' }]
      steps.each do |step|
        route = step[2] == 'code' ? 'mfa/verify' : 'mfa/prompt'
        pass = { 'success' => true, 'npcId' => step[1], 'via' => 'password', 'pcId' => step[0] }
        pass['approvedBy'] = 'owner' unless step[2] == 'code'
        refusals.each do |refusal|
          start
          pc_required(step)
          raw('POST', route, refusal, status: 422)
          raw('POST', route, pass)
          got = scan_rows(@rows, data).map { |f| [f.rule, f.owner] }
          assert_includes got, ['mfa_session', "mfa:session:#{step[1]}"], "#{step.inspect} #{refusal.keys.inspect}"
        end
      end
    end

    # ---- R1-SCANNER2 --------------------------------------------------------------------------------------------------------

    test 'R1-SCANNER2 every refusal and pass of the three POST routes in the shared answers is honest after its gate' do
      names = ANSWERS.select { |_n, a| a['route'].start_with?('POST /mfa') || a['route'].start_with?('POST /mfa/verify |') }.keys
      assert_includes names, 'approve_expired'
      assert_operator names.size, :>=, 12
      names.each do |name|
        route = ANSWERS[name]['route'] == 'POST /mfa/verify | /mfa/prompt | /mfa/approve' ? 'POST /mfa/verify' : ANSWERS[name]['route']
        start
        case route
        when 'POST /mfa/verify'
          take('moira_fob')
          answer('gate_code') { |b| b['targetId'] = 'moira_cabinet' }
          target = 'cabinet_file'
        when 'POST /mfa/approve'
          take('moira_phone')
          answer('gate_push')
          target = 'locker_memo'
        else
          answer('gate_push')
          target = 'locker_memo'
        end
        answer(name)
        answer('open_object') { |b| b['contents'] = [note(target)] } if name.end_with?('_passed')
        found = lock(scan).map(&:last)
        assert_equal [], found, name
      end
    end

    test 'R1-SCANNER2 an expired approve with no gate, or for a lock a refusal cannot be for, is still a finding where unplaced' do
      start
      answer('approve_expired', echo: false)
      assert_includes lock(scan), ['lock_step_answer', 'lockstep:refusal:mfa/approve']
    end

    # ---- the owner keys on the open answer -------------------------------------------------------------------------------------

    test 'an open of a gated lock is placed by its echo: honest, repeated, with no echo, naming another lock, naming none, with no pass' do
      start
      answer('gate_push')
      answer('prompt_passed')
      open_object('locker_memo')
      answer('open_object')['body']['alreadyOpen'] = true # a repeat open: no new gate, same echo
      assert_equal [], lock(scan)
      [['no echo', ->(b) { b.delete('targetType'); b.delete('targetId') }, 'lockstep:open:no-echo'],
       ['half an echo', ->(b) { b.delete('targetType') }, 'lockstep:open:echo'],
       ['a lock the scenario has not', ->(b) { b['targetId'] = 'nothing_here' }, 'lockstep:open:echo'],
       ['another lock, passed or not', ->(b) { b['targetId'] = 'moira_desk' }, 'lockstep:open:object:moira_desk'],
       ['the wrong type', ->(b) { b['targetType'] = 'door' }, 'lockstep:open:echo']].each do |label, edit, owner|
        start
        answer('gate_push')
        answer('prompt_passed')
        edit.call(answer('open_object') { |b| b['contents'] = [note('locker_memo')] }['body'])
        assert(lock(scan).any? { |_r, o| o.start_with?(owner) }, "#{label}: #{lock(scan).inspect}")
      end
      start
      answer('gate_push')
      open_object('locker_memo')
      assert_includes lock(scan), ['lock_step_content', 'lockstep:open:object:moira_locker']
    end

    test 'an open answer holds only the keys the server sends for its lock type (R1-SCANNER9), the server writes and the card answer included' do
      start
      answer('gate_push')
      answer('prompt_passed')
      answer('open_object')['body'].merge!('alreadyOpen' => true, 'cardId' => 'c1', 'serverGlobals' => { 'g' => true }, 'serverCompletedTasks' => ['t'], 'rewards' => [], 'completedTasks' => [], 'updatedTasks' => [])
      assert_equal [], lock(scan)
      %w[attemptsLeft number numbers pending roomData wrapped].each do |key|
        start
        answer('gate_push')
        answer('prompt_passed')
        answer('open_object')['body'][key] = key == 'number' ? 42 : 'x'
        assert(lock(scan).any? { |_r, o| o == 'lockstep:open:key:object:moira_locker' }, key)
      end
    end

    # ---- R1-SCANNER8 --------------------------------------------------------------------------------------------------------

    def mixed_run(open_pc_kind)
      data = mixed
      step = pc_steps(data).find { |x| x.last == open_pc_kind }
      assert step, open_pc_kind
      start
      pc_required(step)
      tick(3600)
      take('moira_phone')
      answer('gate_push')
      raw('POST', 'mfa/approve', { 'success' => false, 'cancelled' => true }, status: 422)
      answer('prompt_passed')
      open_object('locker_memo')
      [data, step]
    end

    test 'R1-SCANNER8 a PC code step open does not excuse an echo-less cancel on the approve route' do
      data, = mixed_run('code')
      assert(scan(data).any? { |f| f.rule == 'lock_step_answer' && f.owner == 'lockstep:refusal:mfa/approve' })
    end

    test 'R1-SCANNER8 a PC code step open does not excuse an echo-less waiting prompt either' do
      data = mixed
      step = pc_steps(data).find { |x| x.last == 'code' }
      start
      pc_required(step)
      answer('gate_push')
      raw('POST', 'mfa/prompt', { 'success' => false, 'approved' => false, 'promptsSent' => 1, 'waiting' => 'held_phone' })
      assert(scan(data).any? { |f| f.owner == 'lockstep:refusal:mfa/prompt' })
    end

    test 'R1-SCANNER8 what is left: a PC push step open, whose route serves the cancel, still reads an echo-less cancel as the PC\'s' do
      data = mixed
      step = pc_steps(data).find { |x| x.last == 'push' }
      skip 'no push PC step in the scenario' unless step
      start
      pc_required(step)
      answer('gate_push')
      raw('POST', 'mfa/approve', { 'success' => false, 'cancelled' => true }, status: 422)
      assert_equal [], lock(scan(data)).select { |_r, o| o.start_with?('lockstep:refusal') }
    end

    # ---- the key approvesPrompts ---------------------------------------------------------------------------------------------

    test 'the key approvesPrompts in any answer is a finding, in a scenario with a lock step' do
      [['GET', 'scenario', { 'characters' => { 'ghost' => { 'emailRecord' => { 'habits' => { 'approvesPrompts' => 'always' } } } } }],
       ['GET', 'room/hall', { 'room' => { 'npcs' => [{ 'id' => 'moira', 'habits' => { 'approvesPrompts' => 'always' } }] } }],
       ['POST', 'inventory', { 'success' => true, 'approvesPrompts' => 'always' }]].each do |method, path, body|
        start
        raw(method, path, body)
        found = scan.map { |f| [f.rule, f.owner] }
        assert(found.any? { |_r, o| o.end_with?('approvesPrompts') }, "#{path}: #{found.inspect}")
      end
    end
  end
end
