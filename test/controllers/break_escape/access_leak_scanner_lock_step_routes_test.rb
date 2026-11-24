require 'test_helper'
require Rails.root.join('../../tools/playtest/lib/access_leak_scanner').to_s

module BreakEscape
  # Ops S8c unit 28: the two ways the real server opens a gated room with no step, and an owner that is a headless record.
  #  - POST npc_workaround of a `prop_door` answers `{ roomId, roomData }`: allowed only when the capture holds that answer (200,
  #    that exact shape, a gated door, that door's own room data) and a room NPC's workarounds author the prop for that door;
  #  - POST flags with an `unlock_door` reward answers `{ rewards: [{ type, room_id, success }] }` and the room opens (unlock_room!):
  #    GET room/<door> is honest afterwards, only when the scenario authors that reward for that door;
  #  - a lock whose owner is a headless record (social.characters.*.emailRecord) is approved by that owner as the server does
  #    (Game#find_npc_in_scenario reads headless records), unless its habit is never.
  # Each missing proof is a finding.
  class AccessLeakScannerLockStepRoutesTest < ActiveSupport::TestCase
    BASE = '/break_escape/games/1'.freeze

    def deep(value)
      Marshal.load(Marshal.dump(value))
    end

    def note(id)
      { 'id' => id, 'type' => 'notes', 'name' => id }
    end

    def lock_obj(id, owner, contents)
      { 'id' => id, 'name' => id, 'type' => 'safe', 'locked' => true, 'secondStep' => { 'kind' => 'push', 'owner' => owner }, 'contents' => contents }
    end

    def scenario(prop_door: 'records_room', reward_room: 'plant_room', ghost_habit: 'always')
      moira = { 'id' => 'moira', 'displayName' => 'Moira', 'habits' => { 'approvesPrompts' => 'always' } }
      moira['workarounds'] = [{ 'do' => 'prop_door', 'door' => prop_door, 'at' => 'hall' }] if prop_door
      station = { 'id' => 'flag_stn', 'type' => 'flag-station', 'flags' => ['flag{x}'] }
      station['flagRewards'] = { 'flag{x}' => { 'type' => 'unlock_door', 'target_room' => reward_room } } if reward_room
      { 'startRoom' => 'hall',
        'social' => { 'characters' => { 'ghost' => { 'channels' => { 'email' => 'ghost_mail' },
                                                     'emailRecord' => { 'habits' => { 'approvesPrompts' => ghost_habit } } } } },
        'rooms' => {
          'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'records_room', 'west' => 'plant_room' }, 'npcs' => [moira],
                      'objects' => [lock_obj('ghost_box', 'ghost_mail', [note('ghost_memo')]), lock_obj('nobody_box', 'nobody', [note('nobody_memo')]), station] },
          'records_room' => { 'type' => 'room_records', 'connections' => { 'south' => 'hall' }, 'objects' => [note('rec_file')],
                              'locked' => true, 'secondStep' => { 'kind' => 'push', 'owner' => 'moira' } },
          'plant_room' => { 'type' => 'room_plant', 'connections' => { 'east' => 'hall' }, 'objects' => [note('plant_note')],
                            'locked' => true, 'secondStep' => { 'kind' => 'push', 'owner' => 'moira' } }
        } }
    end

    def start
      @clock = Time.utc(2026, 1, 1)
      @rows = []
    end

    def raw(method, path, body, status: 200)
      @clock += 1
      @rows << { 't' => @clock.iso8601(3), 'method' => method, 'path' => "#{BASE}/#{path}", 'status' => status, 'body' => deep(body) }
    end

    def scan(data = scenario)
      AccessLeakScanner.new(data).scan(@rows.each_with_index.map { |r, i| ['run.jsonl', i + 1, r] })
    end

    def lock(findings)
      findings.select { |f| f.rule.start_with?('lock_step_') }.map { |f| [f.rule, f.owner] }.uniq.sort
    end

    def room_data(*ids)
      { 'type' => 'room_x', 'locked' => true, 'objects' => ids.map { |i| { 'id' => i, 'type' => 'notes', 'name' => i } } }
    end

    def prop(room: 'records_room', ids: ['rec_file'], extra: {}, status: 200, path: 'npc_workaround')
      raw('POST', path, { 'roomId' => room, 'roomData' => room_data(*ids) }.merge(extra), status: status)
    end

    def room_get(room, ids)
      raw('GET', "room/#{room}", { 'room_id' => room, 'room' => room_data(*ids) })
    end

    def flag_answer(room: 'plant_room', reward_ok: true, status: 200, type: 'unlock_door')
      raw('POST', 'flags', { 'success' => true, 'rewards' => [{ 'type' => type, 'room_id' => room, 'success' => reward_ok }] }, status: status)
    end

    # ---- prop_door ----------------------------------------------------------------------------------------------------

    test 'a prop door answer with its room data, authored for that door, is honest, and so is the room read after it' do
      start
      prop
      room_get('records_room', ['rec_file'])
      assert_equal [], lock(scan)
      start
      prop(extra: { 'setGlobal' => 'door_propped' })
      assert_equal [], lock(scan)
    end

    test 'a prop door answer is still reported when its proof is missing' do
      cases = {
        'no room NPC authors a prop for that door' => [-> { prop }, { prop_door: nil }],
        'the prop is authored for another door' => [-> { prop }, { prop_door: 'plant_room' }],
        'the answer is a refusal status' => [-> { prop(status: 403) }, {}],
        'the answer is of another route' => [-> { prop(path: 'inventory') }, {}],
        'a key the server never adds' => [-> { prop(extra: { 'token' => 'x' }) }, {}],
        'the room data is another gated room\'s' => [-> { prop(room: 'plant_room') }, {}],
        'the answer claims the prop failed' => [-> { prop(extra: { 'success' => false }) }, {}],
        'a GET of the room with no answer before it' => [-> { room_get('records_room', ['rec_file']) }, {}],
        'a prop answer for a room with no step is no excuse for a gated one' => [-> { prop(room: 'hall', ids: ['rec_file']) }, {}]
      }
      cases.each do |label, (play, opts)|
        start
        play.call
        assert_not_empty lock(scan(scenario(**opts))), label
      end
    end

    # ---- the flag reward ------------------------------------------------------------------------------------------------

    test 'a flag reward that unlocks a door, authored for that door, makes the room read after it honest' do
      start
      flag_answer
      room_get('plant_room', ['plant_note'])
      assert_equal [], lock(scan)
    end

    test 'a room read is still reported when the reward proof is missing' do
      cases = {
        'the room read comes before the reward' => [-> { room_get('plant_room', ['plant_note']); flag_answer }, {}],
        'the scenario authors the reward for another door' => [-> { flag_answer; room_get('plant_room', ['plant_note']) }, { reward_room: 'records_room' }],
        'no reward is authored' => [-> { flag_answer; room_get('plant_room', ['plant_note']) }, { reward_room: nil }],
        'the reward did not succeed' => [-> { flag_answer(reward_ok: false); room_get('plant_room', ['plant_note']) }, {}],
        'a refused flag answer' => [-> { flag_answer(status: 422); room_get('plant_room', ['plant_note']) }, {}],
        'another reward type' => [-> { flag_answer(type: 'give_item'); room_get('plant_room', ['plant_note']) }, {}],
        'the reward names another door' => [-> { flag_answer(room: 'records_room'); room_get('plant_room', ['plant_note']) }, {}]
      }
      cases.each do |label, (play, opts)|
        start
        play.call
        assert_not_empty lock(scan(scenario(**opts))), label
      end
    end

    # ---- a headless owner -------------------------------------------------------------------------------------------------

    def ghost_run(owner_id: 'ghost_mail', approved_by: 'owner')
      raw('POST', 'unlock', { 'success' => false, 'secondStep' => true, 'kind' => 'push', 'targetType' => 'object', 'targetId' => "#{owner_id == 'nobody' ? 'nobody' : 'ghost'}_box", 'npcId' => owner_id })
      raw('POST', 'mfa/prompt', { 'success' => true, 'stepPassed' => true, 'approvedBy' => approved_by, 'targetType' => 'object', 'targetId' => "#{owner_id == 'nobody' ? 'nobody' : 'ghost'}_box" })
      raw('POST', 'unlock', { 'success' => true, 'type' => 'object', 'hasContents' => true,
                              'contents' => [{ 'id' => "#{owner_id == 'nobody' ? 'nobody' : 'ghost'}_memo" }] })
    end

    test 'a headless record that owns a lock approves a prompt, as the server lets it' do
      start
      ghost_run
      assert_equal [], lock(scan)
    end

    test 'a headless owner who never approves, or an owner no record names, cannot pass a prompt' do
      start
      ghost_run
      assert_not_empty lock(scan(scenario(ghost_habit: 'never')))
      start
      ghost_run(owner_id: 'nobody')
      assert_not_empty lock(scan)
    end
  end
end
