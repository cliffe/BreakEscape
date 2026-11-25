require 'test_helper'
require_relative '../../support/lock_step_routes'
require_relative '../../support/access_work_scenario'
require_relative '../../support/lock_step_real_rows'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c round 2 fixes for the scanner (docs/agents/ops_core_build/reviews/S8c_R2_scanner.md): the honest runs of R2-SCANNER1,
  # R2-SCANNER2 and R2-SCANNER3 are played on the REAL routes of small scenarios of their own, every answer recorded as a row, and the
  # scanner must report nothing; then copies of those rows are edited for each proof the allowance needs.
  class AccessLeakScannerLockStepR2fixRoutesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include LockStepRoutes
    include LockStepRealRows

    setup do
      @now = T0
      travel_to @now
      @rows = []
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    def later(seconds)
      @now += seconds
      travel_to @now
    end

    def rec(verb, suffix, params = {})
      if verb == :get
        get game_path(suffix), params: params
      else
        post game_path(suffix), params: params, as: :json
      end
      row = { 't' => Time.current.utc.iso8601(3), 'method' => verb.to_s.upcase, 'path' => "/break_escape/games/#{@game.id}/#{suffix}",
              'status' => response.status, 'body' => (response.parsed_body rescue nil) }
      row['query'] = params.to_query if verb == :get && !params.empty?
      @rows << row
      row['body']
    end

    def found(data, rows = @rows)
      pairs(scan_with(rows, data))
    end

    def note(id)
      { 'id' => id, 'type' => 'notes1', 'name' => id, 'text' => "text of #{id}", 'readable' => true }
    end

    def safe(id, pin, owner, contents)
      { 'id' => id, 'type' => 'safe', 'name' => id.tr('_', ' '), 'locked' => true, 'lockType' => 'pin', 'requires' => pin,
        'secondStep' => { 'kind' => 'push', 'owner' => owner }, 'contents' => contents }
    end

    def scenario(closet_objects)
      { 'startRoom' => 'hall',
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault', 'east' => 'closet', 'west' => 'store' },
                      'objects' => [safe('amy_box', '3333', 'amy', [note('box_memo')])],
                      'npcs' => [{ 'id' => 'amy', 'displayName' => 'Amy', 'habits' => { 'approvesPrompts' => 'always' } }] },
          'closet' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '4321',
                        'connections' => { 'west' => 'hall' }, 'objects' => closet_objects },
          'store' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '5555',
                       'connections' => { 'east' => 'hall' }, 'objects' => [note('store_note'), safe('store_safe', '7777', 'amy', [note('store_memo')])] },
          'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '2222',
                       'connections' => { 'south' => 'hall' }, 'secondStep' => { 'kind' => 'push', 'owner' => 'amy' },
                       'objects' => [note('vault_note'), safe('vault_safe', '8888', 'amy', [note('vault_memo')])] }
        } }
    end

    def prompt_until_passed(type, id)
      6.times do
        later(3)
        break if rec(:post, 'mfa/prompt', target_type: type, target_id: id)['stepPassed']
      end
    end

    # ---- R2-SCANNER2 ------------------------------------------------------------------------------------------------------

    test 'R2-SCANNER2 the honest open of an ordinary locked room whose objects author no id is clean beside a gated door' do
      data = scenario([{ 'type' => 'notes1', 'name' => 'Memo', 'text' => 'hello', 'readable' => true }])
      build_step_game(data, 'encounteredNPCs' => %w[amy])
      rec(:post, 'unlock', targetType: 'door', targetId: 'closet', attempt: '4321', method: 'pin')
      rec(:get, 'room/closet')
      open = @rows.first
      assert_equal 'closet_notes1_0', open['body']['roomData']['objects'].first['id'], 'the real route generates this id'
      assert_equal [], found(data)
    end

    test 'R2-SCANNER2 a generated id of an id-less object inside a container and an NPC holding an id-less item are known too' do
      closet = [{ 'type' => 'safe', 'name' => 'Box', 'locked' => false, 'contents' => [{ 'type' => 'notes1', 'name' => 'Inner', 'text' => 'x', 'readable' => true }] }]
      data = scenario(closet)
      data['rooms']['closet']['npcs'] = [{ 'id' => 'clerk', 'displayName' => 'Clerk', 'itemsHeld' => [{ 'type' => 'key', 'name' => 'Spare' }] }]
      build_step_game(data, 'encounteredNPCs' => %w[amy])
      rec(:post, 'unlock', targetType: 'door', targetId: 'closet', attempt: '4321', method: 'pin')
      assert_equal [], found(data)
    end

    test 'R2-SCANNER2 gated content, or an id the scenario does not generate, in that open is still reported' do
      data = scenario([{ 'type' => 'notes1', 'name' => 'Memo', 'text' => 'hello', 'readable' => true }])
      build_step_game(data, 'encounteredNPCs' => %w[amy])
      rec(:post, 'unlock', targetType: 'door', targetId: 'closet', attempt: '4321', method: 'pin')
      leak = deep(@rows)
      leak.first['body']['roomData']['objects'] = [{ 'id' => 'vault_note', 'type' => 'notes1', 'name' => 'x' }]
      assert_includes found(data, leak), ['lock_step_answer', 'lockstep:open:no-echo'] # the gated room's own id places it
      other = deep(@rows)
      other.first['body']['roomData']['objects'].first['id'] = 'closet_notes1_7'
      assert_includes found(data, other), ['lock_step_content', 'lockstep:content:door:vault']
    end

    test 'R2-SCANNER2 owner decision: the open of a locked room with no objects and no NPCs is placed nowhere and reports nothing' do
      data = scenario([])
      build_step_game(data, 'encounteredNPCs' => %w[amy])
      body = rec(:post, 'unlock', targetType: 'door', targetId: 'closet', attempt: '4321', method: 'pin')
      assert_equal [], body['roomData']['objects']
      assert_equal [], found(data)
      # a room answer that carries anything is judged as before: an NPC the scenario does not know belongs to the gated doors
      carry = deep(@rows)
      carry.first['body']['roomData']['npcs'] = [{ 'id' => 'stranger', 'displayName' => 'S' }]
      assert_includes found(data, carry), ['lock_step_content', 'lockstep:content:door:vault']
    end

    # ---- R2-SCANNER1 ------------------------------------------------------------------------------------------------------

    test 'R2-SCANNER1 gated safes inside an ordinary room and a gated room: refused while shut, honest once the room has opened' do
      data = scenario([note('closet_note')])
      build_step_game(data, 'encounteredNPCs' => %w[amy])
      rec(:post, 'unlock', targetType: 'item', targetId: 'store_safe', attempt: '7777', method: 'pin')
      rec(:post, 'mfa/prompt', target_type: 'object', target_id: 'store_safe')
      rec(:post, 'unlock', targetType: 'item', targetId: 'vault_safe', attempt: '8888', method: 'pin')
      rec(:post, 'mfa/prompt', target_type: 'object', target_id: 'vault_safe')
      assert_equal [422, 404, 422, 404], @rows.map { |r| r['status'] }, 'the server refuses both as an invented id'
      assert_equal [], found(data), 'G1 the refusals'
      rec(:post, 'unlock', targetType: 'door', targetId: 'store', attempt: '5555', method: 'pin')
      rec(:get, 'room/store')
      rec(:post, 'unlock', targetType: 'item', targetId: 'store_safe', attempt: '7777', method: 'pin')
      prompt_until_passed('object', 'store_safe')
      rec(:post, 'unlock', targetType: 'item', targetId: 'store_safe', attempt: '7777', method: 'pin')
      assert_equal [], found(data), 'G2 the safe of the ordinary room'
      rec(:post, 'unlock', targetType: 'door', targetId: 'vault', attempt: '2222', method: 'pin')
      prompt_until_passed('door', 'vault')
      rec(:post, 'unlock', targetType: 'door', targetId: 'vault', attempt: '2222', method: 'pin')
      rec(:get, 'room/vault')
      rec(:post, 'unlock', targetType: 'item', targetId: 'vault_safe', attempt: '8888', method: 'pin')
      prompt_until_passed('object', 'vault_safe')
      rec(:post, 'unlock', targetType: 'item', targetId: 'vault_safe', attempt: '8888', method: 'pin')
      rec(:get, 'container/vault_safe')
      assert_equal [], found(data), 'G3 the whole honest run'
      # the same gates, with the room that holds the safe not yet served in the capture: reported
      store_gate = @rows.index { |r| r['body'].is_a?(Hash) && r['body']['secondStep'] == true && r['body']['targetId'] == 'store_safe' }
      moved = deep(@rows)
      moved.delete_at(moved.index { |r| r['path'].end_with?('room/store') })
      moved.delete_at(moved.index { |r| r['body'].is_a?(Hash) && r['body']['type'] == 'door' && r['body']['roomData'] && r['body']['roomData']['objects'].to_s.include?('store_safe') })
      assert store_gate
      assert_includes found(data, moved), ['lock_step_answer', 'lockstep:gate:room:object:store_safe']
    end

    # ---- R2-SCANNER3 ------------------------------------------------------------------------------------------------------

    def reward_data(reward_object: 'lk')
      locker = safe('lk', '1234', 'amy', [note('lk_memo')])
      { 'startRoom' => 'hall', 'flags' => { 'target_vm' => { 'flag_1' => 'flag{one}' } },
        'rooms' => { 'hall' => { 'type' => 'room_office', 'connections' => {},
          'objects' => [locker, { 'type' => 'flag-station', 'id' => 'station', 'name' => 'Flag Station', 'acceptsVms' => ['target_vm'],
                                  'flags' => ['target_vm:flag_1'], 'flagRewards' => reward_object ? [{ 'type' => 'unlock_object', 'objectId' => reward_object }] : [] }],
          'npcs' => [{ 'id' => 'amy', 'displayName' => 'Amy' }] } } }
    end

    def play_flag_reward
      data = reward_data
      build_step_game(data, 'encounteredNPCs' => %w[amy])
      rec(:post, 'flags', flag: 'flag{one}', stationId: 'station')
      rec(:post, 'unlock', targetType: 'item', targetId: 'lk', attempt: '', method: 'flag_reward')
      rec(:get, 'container/lk')
      rec(:get, 'room/hall')
      data
    end

    test 'R2-SCANNER3 the honest flag reward that opens a gated object is clean, with the rows the real routes gave' do
      data = play_flag_reward
      assert_equal 'unlock_object', @rows[0]['body']['rewards'].first['type']
      assert_equal 'lk', @rows[1]['body']['targetId']
      assert_equal [], found(data)
    end

    test 'R2-SCANNER3 without the proof the open of the object is reported: no reward authored, one for another object, an open before the answer, a refused answer' do
      data = play_flag_reward
      assert(found(reward_data(reward_object: nil), @rows).any? { |r, o| r == 'lock_step_content' && o == 'lockstep:open:object:lk' })
      assert(found(reward_data(reward_object: 'other'), @rows).any? { |r, o| r == 'lock_step_content' && o == 'lockstep:open:object:lk' })
      early = deep(@rows)
      early[0], early[1] = early[1], early[0]
      assert(found(data, early).any? { |r, o| r == 'lock_step_content' && o == 'lockstep:open:object:lk' })
      refused = deep(@rows)
      refused[0]['status'] = 422
      refused[0]['body'] = { 'success' => false, 'message' => 'no' }
      assert(found(data, refused).any? { |r, o| r == 'lock_step_content' && o == 'lockstep:open:object:lk' })
    end
  end
end
