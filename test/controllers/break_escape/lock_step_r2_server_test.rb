require 'test_helper'
require_relative '../../support/lock_step_routes'

module BreakEscape
  # S8c review round 2, the server findings (R2-SERVER1 to 8): each probe of the review as a test through the
  # real routes. A gated id is always set beside an invented one, so a difference in status, body or log row fails.
  class LockStepR2ServerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include LockStepRoutes

    STEP = { 'kind' => 'push', 'owner' => 'amy' }.freeze
    AMY = { 'id' => 'amy', 'habits' => { 'approvesPrompts' => 'always' } }.freeze

    def memo(id)
      { 'type' => 'notes1', 'id' => id, 'name' => "Memo #{id}", 'takeable' => true, 'text' => "WORDS-#{id}" }
    end

    def safe(id, pin, gated: true, extra: {})
      h = { 'type' => 'safe', 'id' => id, 'name' => id, 'locked' => true, 'lockType' => 'pin', 'requires' => pin,
            'contents' => [memo("#{id}_memo")] }.merge(extra)
      h['secondStep'] = STEP.dup if gated
      h
    end

    def case_item(id, pin)
      { 'type' => 'briefcase', 'id' => id, 'name' => "Case #{id}", 'takeable' => true, 'locked' => true,
        'lockType' => 'pin', 'requires' => pin, 'secondStep' => STEP.dup, 'contents' => [memo("#{id}_memo")] }
    end

    def base(hall_objects = [], extra_rooms = {})
      { 'startRoom' => 'hall',
        'rooms' => { 'hall' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault', 'east' => 'lab' },
                                 'objects' => hall_objects, 'npcs' => [AMY.dup] },
                     'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '0000',
                                  'connections' => { 'south' => 'hall' }, 'objects' => [],
                                  'npcs' => [{ 'id' => 'vic', 'itemsHeld' => [case_item('viccase', '2468')] }] },
                     'lab' => { 'type' => 'room_office', 'connections' => { 'west' => 'hall' }, 'objects' => [] } }.merge(extra_rooms) }
    end

    setup { travel_to T0 }
    teardown { travel_back }

    # ---- R2-SERVER1 ----

    test 'GET scenario answers 200 whatever shape social.mailClient has' do
      [[], 'x', 7, { 'contacts' => 'x' }, { 'contacts' => { 'a' => 1 } }, { 'contacts' => ['x', nil] }].each do |shape|
        data = base([safe('hsafe', '1234')])
        data['social'] = { 'mailClient' => shape,
                           'characters' => { 'ghost' => { 'emailRecord' => { 'habits' => { 'approvesPrompts' => 'always' } } } } }
        build_step_game(data, 'encounteredNPCs' => %w[amy])
        status, body = bootstrap
        assert_equal 200, status, shape.inspect
        assert_not_includes JSON.generate(body), 'approvesPrompts', shape.inspect
      end
    end

    # ---- R2-SERVER2 ----

    test 'a headless record and a mail contact lose awareness, which decides the prompt habit' do
      data = base([safe('hsafe', '1234')])
      data['social'] = {
        'characters' => { 'ghost' => { 'emailRecord' => { 'role' => 'clerk', 'habits' => { 'screen' => 'locks' }, 'awareness' => 'low' } } },
        'mailClient' => { 'contacts' => [{ 'npc' => 'pat_mail', 'emailRecord' => { 'habits' => { 'screen' => 'locks' }, 'awareness' => 'high' } }] }
      }
      build_step_game(data, 'encounteredNPCs' => %w[amy])
      _, body = bootstrap
      assert_not_includes JSON.generate(body['social']), 'awareness'
      assert_equal 'locks', body['social'].dig('characters', 'ghost', 'emailRecord', 'habits', 'screen')
    end

    # ---- R2-SERVER3 ----

    test 'the open echo names the lock by its canonical type and id, however the request named it' do
      build_step_game(base([safe('realsafe', '7777', extra: { 'name' => 'Real safe' })]), 'encounteredNPCs' => %w[amy])
      unlock('object', 'realsafe', '7777', 'pin')
      mfa('prompt', 'object:realsafe')
      [['object', 'realsafe'], ['object', 'Real safe'], ['foo', 'realsafe'], ['item', 'Real safe']].each do |type, id|
        status, body = unlock(type, id, '7777', 'pin')
        assert_equal 200, status, "#{type} #{id}"
        assert_equal %w[object realsafe], body.values_at('targetType', 'targetId'), "#{type} #{id}"
      end
    end

    # ---- R2-SERVER4 ----

    test 'a take of a gated case an unmet NPC holds answers as an invented item does' do
      build_step_game(base, 'encounteredNPCs' => %w[amy])
      invented = add_item({ 'type' => 'briefcase', 'id' => 'nothing_here' }, source_npc_id: 'vic')
      assert_equal [422, { 'success' => false, 'message' => 'Item not found in scenario: briefcase' }], invented
      assert_equal invented, add_item({ 'type' => 'briefcase', 'id' => 'viccase' }, source_npc_id: 'vic')
      state = game_state
      assert_equal invented, add_item({ 'type' => 'briefcase', 'id' => 'viccase' })
      assert_equal state, game_state, 'no row, no state change, against the invented id'
      assert_not_includes response.body, 'vic'
      assert_empty Array(game_state['inventory'])
    end

    test 'a take of an item in a closed gated safe answers as an invented item does, even beside a name twin' do
      objs = [{ 'type' => 'notes1', 'id' => 'twin', 'name' => 'safe_memo', 'takeable' => true }, safe('realsafe', '7777')]
      objs.last['contents'] = [memo('safe_memo')]
      build_step_game(base(objs), 'encounteredNPCs' => %w[amy])
      invented = add_item({ 'type' => 'notes1', 'id' => 'nothing_here' })
      assert_equal 422, invented.first
      assert_equal invented, add_item({ 'type' => 'notes1', 'id' => 'safe_memo' })
    end

    test 'the give of a gated case from an NPC the player has met still works' do
      build_step_game(base, 'encounteredNPCs' => %w[amy vic], 'unlockedRooms' => %w[hall vault])
      assert_equal 200, add_item({ 'type' => 'briefcase', 'id' => 'viccase' }, source_npc_id: 'vic').first
    end

    # ---- R2-SERVER7 ----

    test 'a gated safe in a route room the player slipped into answers retry, as a plain one does' do
      data = base([], 'lab' => { 'type' => 'room_office', 'connections' => { 'west' => 'hall' },
                                 'objects' => [safe('gsafe', '1234'), safe('psafe', '1234', gated: false)] })
      build_step_game(data, 'encounteredNPCs' => %w[amy], 'npcRouteRooms' => ['lab'])
      plain = unlock('object', 'psafe', '1234', 'pin')
      assert_equal [403, { 'success' => false, 'reason' => 'room_not_reachable', 'retryable' => true }], plain
      assert_equal plain, unlock('object', 'gsafe', '1234', 'pin')
      assert_equal({}, game_state['lockSteps'] || {})
    end

    # ---- R2-SERVER6 and R2-SERVER8 ----

    def door_scenario(locked: true)
      lab = { 'type' => 'room_office', 'connections' => { 'west' => 'hall' }, 'objects' => [],
              'secondStep' => STEP.dup }
      lab.merge!('locked' => true, 'lockType' => 'pin', 'requires' => '4321') if locked
      data = base([], 'lab' => lab)
      data['rooms']['hall']['npcs'] = [AMY.dup, { 'id' => 'carl', 'unlockable' => ['lab'] },
                                       { 'id' => 'dave', 'unlockable' => ['lab'] }, { 'id' => 'erin' }]
      data
    end

    test 'a repeat npc gate names an opener the server remembers' do
      build_step_game(door_scenario, 'encounteredNPCs' => %w[amy carl dave erin])
      first = unlock('door', 'lab', 'carl', 'npc')[1]
      assert_equal 'carl', first['opener']
      second = unlock('door', 'lab', 'dave', 'npc')[1]
      assert_equal 'dave', second['opener']
      assert_equal({ 'door:lab' => 'dave' }, game_state['npcStepGrants'])
      assert_equal 'dave', bootstrap.last.dig('rooms', 'lab', 'npcStepOpener')
    end

    test 'a pin gate then an npc post names the opener the server then holds' do
      build_step_game(door_scenario, 'encounteredNPCs' => %w[amy carl dave erin])
      unlock('door', 'lab', '4321', 'pin')
      assert_equal({}, game_state['npcStepGrants'] || {})
      body = unlock('door', 'lab', 'carl', 'npc')[1]
      assert_equal 'carl', body['opener']
      assert_equal 'carl', game_state.dig('npcStepGrants', 'door:lab')
    end

    test 'an opener that is no NPC allowed at the door is never stored or echoed, locked door or not' do
      [true, false].each do |locked|
        build_step_game(door_scenario(locked: locked), 'encounteredNPCs' => %w[amy carl dave erin])
        ['zedzedzed', 'erin', 'carl' * 400, '', nil, 'amy', %w[carl], { 'a' => 'b' }].each do |attempt|
          status, body = unlock('door', 'lab', attempt, 'npc')
          next unless body['secondStep']

          assert_equal 200, status
          assert_equal 'amy', body['opener'], "#{attempt.inspect} locked=#{locked}"
        end
        assert_not_includes JSON.generate(game_state['npcStepGrants'] || {}), 'zedzed'
        assert_not_includes JSON.generate(game_state['npcStepGrants'] || {}), 'erin'
        assert_not_includes JSON.generate(bootstrap.last.dig('rooms', 'lab')), 'zedzed'
      end
    end

    test 'an NPC the player has not met is no opener' do
      build_step_game(door_scenario(locked: false), 'encounteredNPCs' => %w[amy])
      body = unlock('door', 'lab', 'carl', 'npc')[1]
      assert_equal 'amy', body['opener'] if body['secondStep']
      assert_not_includes JSON.generate(game_state['npcStepGrants'] || {}), 'carl'
    end
  end
end
