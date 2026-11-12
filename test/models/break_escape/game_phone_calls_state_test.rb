require 'test_helper'

module BreakEscape
  # Phone state for calls (plan 4.1, slice A4): `callEvent` on a thread row, and the saved
  # `pendingCall` slot ({ forced: [record], live: record }). All of it is player-controlled input:
  # types and sizes are checked, strings are plain text without control characters, and anything
  # else is dropped. No schema change: it all lives in player_state['phoneState'].
  class GamePhoneCallsStateTest < ActiveSupport::TestCase
    setup do
      @game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: { 'startRoom' => 'reception', 'rooms' => {} },
        player_state: { 'currentRoom' => 'reception', 'unlockedRooms' => ['reception'], 'globalVariables' => {} }
      )
    end

    def record(extra = {})
      { 'knot' => 'ring_call', 'state' => 'ringing', 'disableClose' => false, 'resume' => false,
        'onMissed' => 'callback', 'untilAnswered' => false, 'opening' => false }.merge(extra)
    end

    def save(entry)
      result = @game.send(:merge_phone_state!, { 'dev' => entry })
      [result, @game.player_state.dig('phoneState', 'dev')]
    end

    def saved_slot(pending)
      _, entry = save({ 'history' => [], 'pendingCall' => pending })
      entry && entry['pendingCall']
    end

    def saved_live(extra)
      saved_slot({ 'live' => record(extra) })&.dig('live')
    end

    def saved_row(extra)
      msg = { 'type' => 'call', 'text' => 'Missed call', 'callEvent' => 'missed', 'timestamp' => 1, 'read' => false }.merge(extra)
      _, entry = save({ 'history' => [msg] })
      entry['history']
    end

    # ---- accepted shapes ----

    test 'a call row keeps its callEvent' do
      row = saved_row({})[0]
      assert_equal 'call', row['type']
      assert_equal 'missed', row['callEvent']
      assert_equal false, row['read']
    end

    test 'every callEvent and its fixed text is accepted' do
      { 'missed' => 'Missed call', 'incoming' => 'Incoming call, 1:24', 'outgoing' => 'Outgoing call, 0:48',
        'no_answer' => 'No answer', 'voicemail' => 'Voicemail', 'missed ' => nil }.each do |event, text|
        next unless text

        row = saved_row('callEvent' => event, 'text' => text)[0]
        assert_equal event, row['callEvent']
        assert_equal text, row['text']
      end
      assert_equal 'Missed call: No caller ID', saved_row('text' => 'Missed call: No caller ID')[0]['text']
    end

    test 'an entry that has only a pendingCall is kept' do
      result, entry = save({ 'history' => [], 'pendingCall' => { 'live' => record } })
      assert_equal true, result
      assert_equal [], entry['history']
      assert_equal 'ring_call', entry.dig('pendingCall', 'live', 'knot')
    end

    test 'the slot shape: forced list and live record, every field kept' do
      forced = record('state' => 'connected', 'disableClose' => true, 'resume' => true, 'answerSeconds' => 12, 'callLabel' => 'Front desk',
                      'voicemailKnot' => 'vm.knot_1', 'withheld' => true, 'untilAnswered' => true, 'opening' => true,
                      'setGlobalOnStart' => { 'timed_ringing' => true })
      slot = saved_slot({ 'forced' => [forced, record('knot' => 'second')], 'live' => record('state' => 'held') })
      assert_equal 2, slot['forced'].length
      assert_equal forced, slot['forced'][0]
      assert_equal 'held', slot['live']['state']
    end

    test 'the old single record is kept as it is' do
      slot = saved_slot(record('disableClose' => true))
      assert_equal 'ring_call', slot['knot']
      assert_equal true, slot['disableClose']
    end

    test 'a callback waiting (state missed) is kept' do
      assert_equal 'missed', saved_live('state' => 'missed', 'onMissed' => 'voicemail', 'voicemailKnot' => 'vm')['state']
    end

    # ---- hostile input ----

    test 'an unknown callEvent is dropped from the row' do
      ['bogus', 5, nil, ['missed'], { 'a' => 1 }, 'MISSED'].each do |bad|
        refute saved_row('callEvent' => bad)[0].key?('callEvent'), "kept #{bad.inspect}"
      end
    end

    test 'a call row with free text is dropped; the rest of the thread stays' do
      ['<script>alert(1)</script>', "Missed call\u0007", "Missed call\nforged", 'x' * 200, 'Missed call <b>'].each do |bad|
        _, entry = save({ 'history' => [{ 'type' => 'call', 'text' => bad, 'callEvent' => 'missed' },
                                        { 'type' => 'npc', 'text' => 'hello', 'timestamp' => 1 }] })
        assert_equal ['hello'], entry['history'].map { |m| m['text'] }, "kept #{bad.inspect}"
      end
    end

    test 'a message type over 20 characters is still dropped' do
      _, entry = save({ 'history' => [{ 'type' => 'c' * 21, 'text' => 'Missed call', 'callEvent' => 'missed' }] })
      assert_nil entry
    end

    test 'a record without a valid knot is dropped, and with it the slot' do
      [nil, '', 5, ['a'], { 'a' => 1 }, 'has space', '<b>', 'a' * 201, "knot\u0000", 'x;y'].each do |bad|
        assert_nil saved_slot({ 'live' => record('knot' => bad) }), "kept knot #{bad.inspect}"
        assert_nil saved_slot({ 'forced' => [record('knot' => bad)] }), "kept forced knot #{bad.inspect}"
      end
    end

    test 'a 10 kB knot and a nested object in pendingCall are dropped' do
      assert_nil saved_slot({ 'live' => record('knot' => 'k' * 10_000) })
      assert_nil saved_slot({ 'live' => { 'knot' => { 'a' => { 'b' => 1 } } } })
      assert_nil saved_slot('nested')
      assert_nil saved_slot(['live'])
      assert_nil saved_slot(5)
    end

    test 'an unknown state or onMissed is dropped from the record, which survives' do
      live = saved_live('state' => 'exploding', 'onMissed' => 'rm -rf')
      assert_equal 'ring_call', live['knot']
      refute live.key?('state')
      refute live.key?('onMissed')
    end

    test 'voicemailKnot must be a valid knot too' do
      refute saved_live('voicemailKnot' => '<img src=x>').key?('voicemailKnot')
      refute saved_live('voicemailKnot' => 'a' * 500).key?('voicemailKnot')
    end

    test 'booleans must be booleans' do
      live = saved_live('disableClose' => 'true', 'resume' => 1, 'withheld' => 'yes', 'untilAnswered' => nil, 'opening' => {})
      %w[disableClose resume withheld untilAnswered opening].each { |k| refute live.key?(k), "kept #{k}" }
    end

    test 'answerSeconds: a string is dropped; negative and huge are clamped' do
      refute saved_live('answerSeconds' => '12').key?('answerSeconds')
      refute saved_live('answerSeconds' => [12]).key?('answerSeconds')
      assert_equal 0, saved_live('answerSeconds' => -50)['answerSeconds']
      assert_equal 3600, saved_live('answerSeconds' => 10**9)['answerSeconds']
      assert_equal 7, saved_live('answerSeconds' => 7.9)['answerSeconds']
    end

    test 'callLabel is plain text: HTML, control characters and long labels are dropped' do
      assert_equal 'Front desk', saved_live('callLabel' => 'Front desk')['callLabel']
      ['<img src=x onerror=alert(1)>', "Desk\u0007", "Desk\nline", 'a' * 101, 5, ['a']].each do |bad|
        refute saved_live('callLabel' => bad).key?('callLabel'), "kept #{bad.inspect}"
      end
    end

    test 'setGlobalOnStart keeps only a small map of scalars with plain names' do
      live = saved_live('setGlobalOnStart' => { 'ok_name' => true, 'bad name' => true, '<x>' => true, 'nested' => { 'a' => 1 }, 'str' => 'fine', 'long' => 'x' * 300 })
      assert_equal({ 'ok_name' => true, 'str' => 'fine' }, live['setGlobalOnStart'])
      refute saved_live('setGlobalOnStart' => 'x').key?('setGlobalOnStart')
      refute saved_live('setGlobalOnStart' => { 'a b' => true }).key?('setGlobalOnStart')
    end

    test 'unknown keys on a record are dropped' do
      live = saved_live('evil' => '<script>', 'html' => 1)
      refute live.key?('evil')
      refute live.key?('html')
    end

    test 'forced entries are capped, and bad ones are skipped without losing the good' do
      slot = saved_slot({ 'forced' => [record('knot' => 'a'), record('knot' => '<bad>'), 7, record('knot' => 'b')] })
      assert_equal %w[a b], slot['forced'].map { |r| r['knot'] }
      many = saved_slot({ 'forced' => (1..50).map { |i| record('knot' => "k#{i}") } })
      assert_equal Game::MAX_PHONE_FORCED_CALLS, many['forced'].length
    end

    test 'forced that is not a list is ignored; live survives' do
      slot = saved_slot({ 'forced' => 'x', 'live' => record })
      refute slot.key?('forced')
      assert_equal 'ring_call', slot['live']['knot']
    end

    test 'a pendingCall with nothing valid saves no key, and an entry with no history, story or call is dropped' do
      result, entry = save({ 'history' => [], 'pendingCall' => { 'live' => record('knot' => '') } })
      assert_nil entry
      assert_equal true, result
    end

    test 'the 512 kB cap still refuses' do
      big = (1..9).map { |i| { 'type' => 'npc', 'text' => 'x' * 4000, 'timestamp' => i } }
      incoming = (1..30).to_h { |n| ["npc_#{n}", { 'history' => big, 'pendingCall' => { 'live' => record } }] }
      assert_equal false, @game.send(:merge_phone_state!, incoming)
      assert_nil @game.player_state.dig('phoneState', 'npc_1')
    end

    # ---- A4 review round 1: m2, m6 ----

    test 'm2: an entry that is only { history: [], pendingCall: null } deletes the saved entry' do
      save({ 'history' => [], 'pendingCall' => { 'live' => record } })
      assert @game.player_state.dig('phoneState', 'dev')['pendingCall']
      result, entry = save({ 'history' => [], 'pendingCall' => nil })
      assert_equal true, result
      assert_nil entry
      refute @game.player_state['phoneState'].key?('dev')
    end

    test 'm2: a null pendingCall on an entry that still has a thread keeps the thread and drops the slot' do
      save({ 'history' => [], 'pendingCall' => { 'live' => record } })
      _, entry = save({ 'history' => [{ 'type' => 'npc', 'text' => 'Hello', 'timestamp' => 1 }], 'pendingCall' => nil })
      assert_equal 1, entry['history'].length
      refute entry.key?('pendingCall')
    end

    test 'm2: an empty entry without the pendingCall key does not delete anything' do
      save({ 'history' => [], 'pendingCall' => { 'live' => record } })
      save({ 'history' => [] })
      assert @game.player_state.dig('phoneState', 'dev')['pendingCall']
    end

    test 'm6: a knot with a newline after a valid line is refused (anchors are \\A and \\z)' do
      ["ring_call\n<x>", "ring_call\n", "a\nb_c"].each do |bad|
        assert_nil saved_slot({ 'live' => record('knot' => bad) }), "kept #{bad.inspect}"
      end
      refute saved_live('voicemailKnot' => "vm_knot\n<x>").key?('voicemailKnot')
    end

    test 'm6: a call row text with a newline after a valid line is refused' do
      _, entry = save({ 'history' => [{ 'type' => 'call', 'text' => "Missed call\nforged", 'callEvent' => 'missed' }] })
      assert_nil entry
    end

    test 'm6: answerSeconds Infinity and NaN (JSON 1e400) drop the key and raise nothing' do
      assert_nothing_raised do
        refute saved_live('answerSeconds' => Float::INFINITY).key?('answerSeconds')
        refute saved_live('answerSeconds' => -Float::INFINITY).key?('answerSeconds')
        refute saved_live('answerSeconds' => Float::NAN).key?('answerSeconds')
      end
      parsed = JSON.parse('{"knot":"ring_call","answerSeconds":1e400}')
      assert_nothing_raised { refute saved_live(parsed).key?('answerSeconds') }
    end

    test 'm6: setGlobalOnStart drops a string value with angle brackets, and keeps at most ten entries' do
      live = saved_live('setGlobalOnStart' => { 'a' => '<b>', 'b' => 'x>y', 'c' => 'fine' })
      assert_equal({ 'c' => 'fine' }, live['setGlobalOnStart'])
      many = saved_live('setGlobalOnStart' => (1..25).to_h { |i| ["g#{i}", i] })
      assert_equal Game::MAX_PHONE_CALL_GLOBALS, many['setGlobalOnStart'].length
    end
  end
end
