require 'test_helper'
require_relative '../../support/lock_step_routes'
require_relative '../../support/access_model_scenario'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # S8c unit 15, the objects table: a second step on a lock that is an object, driven through the
  # real routes against the real gate on scenarios/test_ops_lock_step/ and on fragments with a
  # gated object in an account profile and in a share. Every answer the helpers read is scanned
  # for what must never leave early (the lock's contents) and for the four server-only state keys.
  class LockStepObjectsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include LockStepRoutes

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_lock_step/scenario.json.erb', __dir__)
    NPCS = %w[moira gordon priya dana].freeze
    LOG = 'step_audit'.freeze
    PC_PASSWORD = 'Harrowgate-Rec-27'.freeze
    ZIP_PASSWORD = 'Lanternfield-Zip-58'.freeze
    # what the closed PC and its archive hold
    PC_WORDS = ['"records_note"', 'Test note from the records PC', '"audit_zip"', 'quarterly_export', 'audit_extract',
                'Test export', 'export_summary'].freeze
    LOCKER_WORDS = ['locker_memo', 'Test memo from the staff locker'].freeze

    def real_scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build_real(state = {})
      build_step_game(real_scenario, { 'encounteredNPCs' => NPCS }.merge(state))
    end

    setup { travel_to T0 }
    teardown { travel_back }

    def rows(event = nil)
      list = BreakEscape::Game.find(@game.id).log_rows_for(LOG)
      event ? list.select { |r| r['event'] == event } : list
    end

    def unlocked_objects
      Array(game_state['unlockedObjects'])
    end

    def record(subject)
      (game_state['lockSteps'] || {})[subject]
    end

    # pester the owner until the push passes (moira approves on the third prompt)
    def pester(subject, times = 3)
      out = nil
      times.times do |i|
        later(3) if i.positive?
        out = mfa('prompt', subject)
      end
      out
    end

    def open_pc!
      unlock('object', 'moira_pc', PC_PASSWORD, 'password')
      pester('object:moira_pc')
      unlock('object', 'moira_pc', PC_PASSWORD, 'password')
    end

    # ---- wrong first factor, right first factor ----

    test 'a wrong first factor is today refusal on every gated lock and starts nothing' do
      build_real
      [['moira_locker', '0000', 'pin'], ['moira_pc', 'nope', 'password'], ['priya_safe', '1111', 'pin'],
       ['dana_cabinet', 'nope', 'password']].each do |id, attempt, method|
        status, body = unlock('object', id, attempt, method)
        assert_equal 422, status
        assert_equal INVALID.merge(), body.slice('success', 'message') if body.keys.sort == %w[message success]
        assert_equal %w[message success], body.keys.sort, "#{id} carries no hint of a step"
      end
      assert_empty(game_state['lockSteps'] || {})
      assert_empty rows
      assert_nothing_leaked(*LOCKER_WORDS, *PC_WORDS)
    end

    test 'a right first factor shows the gate and nothing of the lock, and the lock stays shut' do
      build_real
      status, body = unlock('object', 'moira_locker', '4817', 'pin')
      assert_equal 200, status
      assert_equal %w[kind npcId secondStep success targetId targetType], body.keys.sort
      assert_equal 'no-store', response.headers['Cache-Control'] if false
      assert_equal 404, container('moira_locker')[0]
      assert_equal 422, add_item({ 'type' => 'notes1', 'id' => 'locker_memo', 'name' => 'Locker memo' })[0]
      assert_not_includes unlocked_objects, 'moira_locker'
      assert_equal 'push', record('object:moira_locker')['kind']
      assert_equal 1, rows('mfa_challenge').sum { |r| r['n'] || 1 }
      assert_equal({ 'method' => 'pin' }, rows('mfa_challenge').first['detail'])
      assert_nothing_leaked(*LOCKER_WORDS)
    end

    test 'a repeat of the first factor on a live step is the same gate and writes nothing more' do
      build_real
      first = unlock('object', 'moira_locker', '4817', 'pin')
      before = game_state.deep_dup
      assert_equal first, unlock('object', 'moira_locker', '4817', 'pin')
      assert_equal before, game_state
      assert_equal 1, rows('mfa_challenge').sum { |r| r['n'] || 1 }
    end

    # ---- each kind end to end ----

    test 'push: the owner approves after being asked three times, the next post opens, the record goes' do
      build_real
      unlock('object', 'moira_locker', '4817', 'pin')
      status, body = mfa('prompt', 'object:moira_locker')
      assert_equal [200, false, 'owner'], [status, body['approved'], body['waiting']]
      later(3)
      mfa('prompt', 'object:moira_locker')
      later(3)
      assert_equal [200, { 'success' => true, 'stepPassed' => true, 'approvedBy' => 'owner', 'targetType' => 'object', 'targetId' => 'moira_locker' }], mfa('prompt', 'object:moira_locker')
      assert_not_includes unlocked_objects, 'moira_locker', 'a pass opens nothing by itself'
      status, body = unlock('object', 'moira_locker', '4817', 'pin')
      assert_equal 200, status
      assert_equal true, body['success']
      assert_equal %w[locker_memo], body['contents'].map { |c| c['id'] }
      assert_includes unlocked_objects, 'moira_locker'
      assert_nil record('object:moira_locker')
      # a second post, and the same after a reload
      assert_equal true, unlock('object', 'moira_locker', '4817', 'pin')[1]['success']
      assert_equal 200, container('moira_locker')[0]
      assert_equal 200, add_item({ 'type' => 'notes1', 'id' => 'locker_memo', 'name' => 'Locker memo' })[0]
      assert_equal 1, rows('mfa_challenge').sum { |r| r['n'] || 1 }, 'the open posts issue no second step'
      assert_equal 1, rows('mfa_prompt_approved').size
      assert_nothing_leaked
    end

    test 'code: the held device shows the code, and a pass opens the safe' do
      build_real
      unlock('object', 'priya_safe', '2603', 'pin')
      assert_equal [403, { 'success' => false, 'error' => 'no such device' }], mfa('verify', 'object:priya_safe', code: '123456')
      hold!('priya_device')
      assert_equal [422, { 'success' => false, 'mfaIncorrect' => true, 'targetType' => 'object', 'targetId' => 'priya_safe' }], mfa('verify', 'object:priya_safe', code: '000000') if device_code('priya_device') != '000000'
      assert_equal [200, { 'success' => true, 'stepPassed' => true, 'targetType' => 'object', 'targetId' => 'priya_safe' }], mfa('verify', 'object:priya_safe', code: device_code('priya_device'))
      status, body = unlock('object', 'priya_safe', '2603', 'pin')
      assert_equal [200, true, %w[safe_memo]], [status, body['success'], body['contents'].map { |c| c['id'] }]
      assert_nil record('object:priya_safe')
      assert_equal 1, rows('mfa_code_ok').size
      assert_equal 0, rows.count { |r| r.to_json.include?(device_code('priya_device')) }
    end

    test 'push with number matching: the right number from the held phone passes, a wrong one drops the step' do
      build_real
      open_pc!
      status, gate = unlock('object', 'audit_zip', ZIP_PASSWORD, 'password')
      assert_equal 200, status
      assert_equal ['push_number_match', 'gordon'], [gate['kind'], gate['npcId']]
      assert_includes 10..99, gate['number']
      hold!('gordon_phone')
      assert_equal 'held_phone', mfa('prompt', 'object:audit_zip')[1]['waiting']
      row = phone('gordon', 'object:audit_zip')[1]['requests'].first
      assert_equal %w[n name numbers targetId targetType], row.keys.sort
      assert_equal 1, row['n']
      assert_equal row['numbers'].sort, row['numbers']
      assert_includes row['numbers'], gate['number']
      # a wrong number cancels and drops the record
      wrong = (row['numbers'] - [gate['number']]).first
      assert_equal [422, { 'success' => false, 'cancelled' => true, 'targetType' => 'object', 'targetId' => 'audit_zip' }], mfa('approve', 'object:audit_zip', number: wrong)
      assert_nil record('object:audit_zip')
      assert_equal [422, expired_for('object:audit_zip')], mfa('approve', 'object:audit_zip', number: wrong)
      # again, rightly
      _, gate = unlock('object', 'audit_zip', ZIP_PASSWORD, 'password')
      later(3)
      assert_equal [200, { 'success' => true, 'stepPassed' => true, 'approvedBy' => 'player', 'targetType' => 'object', 'targetId' => 'audit_zip' }],
                   mfa('approve', 'object:audit_zip', number: gate['number'])
      status, body = unlock('object', 'audit_zip', ZIP_PASSWORD, 'password')
      assert_equal [200, %w[audit_extract]], [status, body['contents'].map { |c| c['id'] }]
      assert_equal 1, rows('mfa_prompt_denied').size
      assert_equal ['held_phone'], rows('mfa_prompt_approved').map { |r| r['detail']['approver'] }.select { |a| a == 'held_phone' }
    end

    test 'a lock whose owner never passes answers the gate, then waits for ever' do
      build_real
      unlock('object', 'dana_cabinet', 'Cedarmoor-Fin-91', 'password')
      3.times do
        later(3)
        assert_equal 'owner', mfa('prompt', 'object:dana_cabinet')[1]['waiting']
      end
      assert_equal [403, { 'success' => false, 'error' => 'no such phone' }], mfa('approve', 'object:dana_cabinet', number: 50)
      assert_not_includes unlocked_objects, 'dana_cabinet'
      assert_nothing_leaked('cabinet_memo', 'Test memo from the finance cabinet')
    end

    test 'a pass waits past the five minutes a pending step lives, and opens on the next right first factor' do
      build_real
      unlock('object', 'moira_locker', '4817', 'pin')
      pester('object:moira_locker')
      later(3600)
      assert_equal true, unlock('object', 'moira_locker', '4817', 'pin')[1]['success']
    end

    test 'an unpassed step is dropped after five minutes and the first factor starts it again' do
      build_real
      unlock('object', 'moira_locker', '4817', 'pin')
      later(301)
      assert_equal [422, expired_for('object:moira_locker')], mfa('prompt', 'object:moira_locker')
      assert_equal 200, unlock('object', 'moira_locker', '4817', 'pin')[0]
      assert_equal 2, rows('mfa_challenge').sum { |r| r['n'] || 1 }
    end

    def find_by_id(tree, id, out = [])
      case tree
      when Hash
        out << tree if tree['id'] == id
        tree.each_value { |v| find_by_id(v, id, out) }
      when Array then tree.each { |v| find_by_id(v, id, out) }
      end
      out
    end

    test 'a gated object is sent with no contents key at all, not even an empty list, until it opens' do
      build_real
      unlock('object', 'moira_locker', '4817', 'pin')
      add_item({ 'type' => 'briefcase', 'id' => 'gordon_briefcase', 'name' => "Gordon's briefcase" }, source_npc_id: 'gordon')
      [room('office')[1], bootstrap[1], game_state['inventory']].each do |tree|
        %w[moira_pc moira_locker priya_safe dana_cabinet gordon_briefcase].each do |id|
          find_by_id(tree, id).select { |o| o['type'] }.each { |o| assert_not o.key?('contents'), "#{id} carries contents" }
        end
      end
      assert_equal 200, container('moira_pc')[0] if false
    end

    # ---- the client says "item" for every object lock ----

    test 'targetType item is an object for the gate and for every mfa action, and the answers say object' do
      build_real
      hold!('priya_device')
      post game_path('unlock'), params: { targetType: 'item', targetId: 'moira_locker', attempt: '4817', method: 'pin' }, as: :json
      assert_equal [200, true, 'object'], [response.status, response.parsed_body['secondStep'], response.parsed_body['targetType']]
      item = { target_type: 'item', target_id: 'moira_locker' }
      post game_path('mfa/prompt'), params: item, as: :json
      assert_equal [200, 'object', 'moira_locker'], [response.status, *response.parsed_body.values_at('targetType', 'targetId')]
      later(3)
      post game_path('mfa/prompt'), params: item, as: :json
      later(3)
      post game_path('mfa/prompt'), params: item, as: :json
      assert_equal [true, 'object'], response.parsed_body.values_at('stepPassed', 'targetType')
      post game_path('unlock'), params: { targetType: 'item', targetId: 'moira_locker', attempt: '4817', method: 'pin' }, as: :json
      assert_equal [200, true], [response.status, response.parsed_body['success']]
      # code, approve and phone
      post game_path('unlock'), params: { targetType: 'item', targetId: 'priya_safe', attempt: '2603', method: 'pin' }, as: :json
      post game_path('mfa/verify'), params: { target_type: 'item', target_id: 'priya_safe', code: device_code('priya_device') }, as: :json
      assert_equal [200, 'object'], [response.status, response.parsed_body['targetType']]
      post game_path('mfa/approve'), params: { target_type: 'item', target_id: 'dana_cabinet', number: 1 }, as: :json
      assert_equal [422, 'object'], [response.status, response.parsed_body['targetType']], 'no step issued for it: expired'
      get game_path('mfa/phone'), params: { npc_id: 'dana', target_type: 'item', target_id: 'dana_cabinet' }
      assert_equal 403, response.status
      # an unknown type is refused as before
      post game_path('unlock'), params: { targetType: 'banana', targetId: 'dana_cabinet', attempt: 'Cedarmoor-Fin-91', method: 'password' }, as: :json
      assert_equal [422, INVALID], [response.status, response.parsed_body]
      post game_path('mfa/prompt'), params: { target_type: 'banana', target_id: 'dana_cabinet' }, as: :json
      assert_equal [422, GENERIC], [response.status, response.parsed_body]
    end

    # ---- ids only on /mfa/*, the phone ----

    test 'the mfa routes take an id only: a name or a generated id is not found' do
      build_real
      unlock('object', 'moira_locker', '4817', 'pin')
      ['Staff locker', 'office_safe_1', 'MOIRA_LOCKER', 'moira_locker '].each do |ref|
        assert_equal [404, NOT_FOUND], mfa('prompt', "object:#{ref}"), ref
        assert_equal [404, NOT_FOUND], mfa('approve', "object:#{ref}", number: 1), ref
        assert_equal [404, NOT_FOUND], mfa('verify', "object:#{ref}", code: '123456'), ref
      end
      assert_equal 200, mfa('prompt', 'object:moira_locker')[0]
    end

    test 'the phone lists the one request of the lock named, only on the owner phone, and never un-named' do
      build_real
      hold!('dana_phone')
      unlock('object', 'dana_cabinet', 'Cedarmoor-Fin-91', 'password')
      unlock('object', 'moira_locker', '4817', 'pin')
      mfa('prompt', 'object:dana_cabinet')
      mfa('prompt', 'object:moira_locker')
      list = phone('dana', 'object:dana_cabinet')[1]['requests']
      assert_equal [%w[object dana_cabinet]], list.map { |r| [r['targetType'], r['targetId']] }
      assert_equal({ 'requests' => [] }, phone('dana', 'object:moira_locker')[1], 'a lock of another owner')
      assert_equal({ 'requests' => [] }, phone('dana', 'object:priya_safe')[1], 'a lock with no step issued')
      assert_equal [403, { 'success' => false, 'error' => 'no such phone' }], phone('moira', 'object:moira_locker')
      # the lock form without a valid target is the old PC form, and carries no lock request
      get game_path('mfa/phone'), params: { npc_id: 'dana' }
      assert_empty Array(response.parsed_body['requests']).select { |r| r['targetType'] == 'object' }
    end

    # ---- the skips ----

    def skip_scenario(flag: false)
      locker = { 'type' => 'safe', 'id' => 'lk', 'name' => 'Locker', 'locked' => true, 'lockType' => 'pin', 'requires' => '1234',
                 'secondStep' => { 'kind' => 'push', 'owner' => 'amy' },
                 'contents' => [{ 'type' => 'notes1', 'id' => 'lk_memo', 'name' => 'Memo', 'takeable' => true }] }
      objects = [locker]
      if flag
        objects << { 'type' => 'notes1', 'id' => 'station', 'name' => 'Station', 'flagRewards' => {
          'FLAG{OPEN_LK}' => { 'type' => 'unlock_object', 'objectId' => 'lk' } } }
      end
      { 'startRoom' => 'hall',
        'rooms' => { 'hall' => { 'type' => 'room_office', 'connections' => {}, 'objects' => objects,
                                 'npcs' => [{ 'id' => 'amy', 'unlockable' => ['lk'] }] } } }
    end

    test 'a hand-built npc post does not skip the step, and a flag reward the server accepts does' do
      build_step_game(skip_scenario(flag: true), 'encounteredNPCs' => ['amy'])
      status, body = unlock('object', 'lk', 'amy', 'npc')
      assert_equal [200, true, 'lk'], [status, body['secondStep'], body['targetId']]
      assert_not_includes unlocked_objects, 'lk'
      assert_equal 422, unlock('object', 'lk', '', 'flag_reward')[0], 'no flag claimed: refused'
      assert_not_includes unlocked_objects, 'lk'
      build_step_game(skip_scenario(flag: true), 'encounteredNPCs' => ['amy'], 'flag_rewards_claimed' => ['FLAG{OPEN_LK}'])
      status, body = unlock('object', 'lk', '', 'flag_reward')
      assert_equal [200, true, %w[lk_memo]], [status, body['success'], body['contents'].map { |c| c['id'] }]
      assert_includes unlocked_objects, 'lk'
      assert_empty(game_state['lockSteps'] || {})
      assert_empty rows
    end

    test 'a flag reward the server does not accept is refused for a gated lock' do
      build_step_game(skip_scenario, 'encounteredNPCs' => ['amy'], 'flag_rewards_claimed' => ['FLAG{OPEN_LK}'])
      assert_equal 422, unlock('object', 'lk', '', 'flag_reward')[0]
      assert_not_includes unlocked_objects, 'lk'
    end

    # ---- a child of a closed gated container (Rule C), every caller and every exit ----

    test 'validate_unlock has one caller in app and lib, and it passes the resolved target' do
      callers = Dir[File.expand_path('../../../{app,lib}/**/*.rb', __dir__)].flat_map do |f|
        File.readlines(f).each_with_index.filter_map do |line, i|
          "#{File.basename(f)}:#{i + 1}" if line.match?(/\bvalidate_unlock\(/) && !line.match?(/def validate_unlock|#/)
        end
      end
      # the two lines of one call (a ternary), wherever the controller puts them
      assert_equal %w[games_controller.rb games_controller.rb], callers.map { |c| c.split(':').first }
      assert_equal 1, callers.map { |c| c.split(':').last.to_i }.each_cons(2).count { |a, b| b == a + 1 }
      assert_includes File.read(File.expand_path('../../../app/controllers/break_escape/games_controller.rb', __dir__)),
                      'resolved: resolved)'
    end

    test 'a child of the closed PC is refused by id, by name and by every generated id, and no answer holds its contents' do
      build_real
      same = unlock('object', 'no_such_thing_x', ZIP_PASSWORD, 'password')
      assert_equal [422, INVALID], same
      ['audit_zip', 'quarterly_export.zip', 'records_note', 'audit_extract', 'office_zip_archive_1', 'office_zip_archive_0',
       'office_pc_1', 'Records note'].each do |ref|
        assert_equal same, unlock('object', ref, ZIP_PASSWORD, 'password'), ref
        assert_equal same, unlock('object', ref, ZIP_PASSWORD, 'unlocked'), "#{ref} unlocked"
        assert_equal same, unlock('object', ref, ZIP_PASSWORD, 'npc'), "#{ref} npc"
      end
      assert_equal [404], [container('audit_zip')[0]]
      assert_equal [404], [container('moira_pc')[0]]
      assert_equal [422, 'Item not found in scenario: zip_archive'],
                   add_item({ 'type' => 'zip_archive', 'id' => 'audit_zip', 'name' => 'quarterly_export.zip' }).then { |s, b| [s, b['message']] }
      assert_equal 422, add_item({ 'type' => 'text_file', 'id' => 'audit_extract', 'name' => 'export_summary.txt' })[0]
      assert_equal 422, add_item({ 'type' => 'notes1', 'id' => 'records_note', 'name' => 'Records note' })[0]
      room('office')
      bootstrap
      put game_path('sync_state'), params: { currentRoom: 'office' }, as: :json
      (@seen ||= []) << { path: 'sync_state', status: response.status, body: response.body }
      %w[object:audit_zip object:records_note].each { |s| assert_equal [404, NOT_FOUND], mfa('prompt', s) }
      assert_empty(game_state['lockSteps'] || {})
      assert_empty unlocked_objects
      assert_empty rows, 'a refusal as an invented id writes no row'
      assert_nothing_leaked(*PC_WORDS)
    end

    test 'the right password for the child answers as an invented id while the PC is closed, not a gate' do
      build_real
      assert_equal [422, INVALID], unlock('object', 'audit_zip', ZIP_PASSWORD, 'password')
      # the PC's own first factor is a gate, whose answer holds nothing of what is inside
      status, body = unlock('object', 'moira_pc', PC_PASSWORD, 'password')
      assert_equal [200, true], [status, body['secondStep']]
      assert_equal [422, INVALID], unlock('object', 'audit_zip', ZIP_PASSWORD, 'password')
      pester('object:moira_pc')
      assert_equal [422, INVALID], unlock('object', 'audit_zip', ZIP_PASSWORD, 'password'), 'a pass is not an open'
      assert_equal 404, container('moira_pc')[0]
    end

    test 'after the parent step passes and the PC opens, the child own gate is asked' do
      build_real
      status, body = open_pc!
      assert_equal 200, status
      assert_equal %w[records_note audit_zip], body['contents'].map { |c| c['id'] }
      zip = body['contents'].last
      assert_nil zip['contents'], 'the archive is listed without its contents'
      assert_not_includes body.to_json, 'audit_extract'
      assert_equal 200, container('moira_pc')[0]
      assert_equal 404, container('audit_zip')[0], 'the archive is still gated'
      status, gate = unlock('object', 'audit_zip', ZIP_PASSWORD, 'password')
      assert_equal [200, true, 'push_number_match'], [status, gate['secondStep'], gate['kind']]
      assert_not_includes response.body, 'audit_extract'
      assert_equal [422, INVALID], unlock('object', 'audit_zip', 'wrong', 'password')
      assert_nothing_leaked('audit_extract', 'Test export', 'export_summary')
    end

    test 'the inventory never takes a gated object not yet open, nor a child of one' do
      build_real
      open_pc!
      assert_equal 422, add_item({ 'type' => 'text_file', 'id' => 'audit_extract', 'name' => 'export_summary.txt' })[0]
      assert_equal 200, add_item({ 'type' => 'notes1', 'id' => 'records_note', 'name' => 'Records note' })[0]
      assert_equal %w[records_note], game_state['inventory'].map { |i| i['id'] }
    end

    # ---- profile and share fragments ----

    def profile_scenario
      data = AccessModelScenario.routes_scenario
      folder = data['accountProfiles']['jake_files']['contents'][1]
      raise 'unexpected fixture' unless folder['id'] == 'jake_archive'

      folder['secondStep'] = { 'kind' => 'push', 'owner' => 'dana' }
      data['rooms']['finance']['npcs'].find { |n| n['id'] == 'dana' }['habits'] = { 'approvesPrompts' => 'always' }
      folder['locked'] = true
      folder['lockType'] = 'pin'
      folder['requires'] = '2468'
      folder['contents'] = [{ 'id' => 'jake_inner', 'type' => 'text_file', 'name' => 'Inner.txt', 'takeable' => true,
                              'text' => 'INNER-PROFILE-WORDS' },
                            { 'id' => 'jake_deep', 'type' => 'zip_archive', 'name' => 'deep.zip', 'locked' => true, 'lockType' => 'pin',
                              'requires' => '1357', 'contents' => [{ 'id' => 'jake_deep_doc', 'type' => 'text_file',
                                                                     'name' => 'deep.txt', 'text' => 'DEEP-PROFILE-WORDS' }] }]
      data
    end

    test 'a gated folder in an account profile: its child is refused while it is closed, and asked for after it opens' do
      build_step_game(profile_scenario, 'encounteredNPCs' => %w[jake dana], 'unlockedRooms' => %w[lobby finance],
                                        'currentRoom' => 'finance')
      post login_game_url(@game), params: { pc_id: 'jake_pc', username: 'jbrooks', password: AccessModelScenario::JAKE_PASSWORD }, as: :json
      assert response.parsed_body['success'], response.body
      same = unlock('object', 'no_such_thing_x', '1357', 'pin')
      %w[jake_deep Inner.txt deep.zip].each do |ref|
        assert_equal same, unlock('object', ref, '1357', 'pin'), ref
      end
      assert_equal 404, container('jake_deep')[0]
      assert_equal 404, container('jake_archive')[0]
      room('finance')
      bootstrap
      status, gate = unlock('object', 'jake_archive', '2468', 'pin')
      assert_equal [200, true, 'dana'], [status, gate['secondStep'], gate['npcId']]
      assert_equal same, unlock('object', 'jake_deep', '1357', 'pin'), 'a gate for the parent is not an open'
      assert_equal 200, mfa('prompt', 'object:jake_archive')[0] # dana always approves a push
      assert_equal same, unlock('object', 'jake_deep', '1357', 'pin'), 'a pass is not an open'
      status, body = unlock('object', 'jake_archive', '2468', 'pin')
      assert_equal [200, true], [status, body['success']]
      assert_includes unlocked_objects, 'jake_archive'
      assert_not_includes body.to_json, 'DEEP-PROFILE-WORDS'
      assert_nothing_leaked('DEEP-PROFILE-WORDS')
      status, deep = unlock('object', 'jake_deep', '1357', 'pin')
      assert_equal [200, %w[jake_deep_doc]], [status, deep['contents'].map { |c| c['id'] }], 'the child has no gate of its own'
    end

    def share_scenario
      data = NetworkModelScenario.scenario
      share = data['resources']['ledger_archive']
      folder = share['contents'].find { |c| c['id'] == 'ledger_yearend' }
      folder['secondStep'] = { 'kind' => 'push', 'owner' => 'lena' }
      data['rooms']['lobby']['npcs'].find { |n| n['id'] == 'lena' }['habits'] = { 'approvesPrompts' => 'always' }
      folder['contents'] = [{ 'id' => 'yearend_report', 'type' => 'text_file', 'name' => 'Year-end report', 'text' => 'SHARE-REPORT-WORDS' },
                            { 'id' => 'ye_deep', 'type' => 'zip_archive', 'name' => 'ye.zip', 'locked' => true, 'lockType' => 'pin',
                              'requires' => '1357', 'contents' => [{ 'id' => 'ye_deep_doc', 'type' => 'text_file', 'name' => 'ye.txt',
                                                                     'text' => 'SHARE-DEEP-WORDS' }] }]
      data
    end

    test 'a gated folder in a share: its child is refused while it is closed, and asked for after it opens' do
      build_step_game(share_scenario, 'encounteredNPCs' => %w[sam lena ian], 'currentRoom' => 'lobby',
                                      'unlockedRooms' => %w[lobby comms_room desk_room workshop kiosk_room store])
      add_item({ 'type' => 'pc', 'id' => 'kit_dropbox', 'name' => 'Network drop box' })
      post game_path('network/plant'), params: { jack_id: 'comms_port' }, as: :json
      assert_response :success, response.body
      post game_path('login'), params: { pc_id: 'lena_pc', username: 'lfox', password: NetworkModelScenario::LENA_PASSWORD,
                                         foothold: 'jack_comms_port' }, as: :json
      assert response.parsed_body['success'], response.body
      same = unlock('object', 'no_such_thing_x', '1357', 'pin')
      %w[ye_deep ye.zip].each { |ref| assert_equal same, unlock('object', ref, '1357', 'pin'), ref }
      assert_equal 404, container('ye_deep')[0]
      assert_includes [403, 404], container('ledger_yearend')[0]
      assert_equal 422, add_item({ 'type' => 'text_file', 'id' => 'yearend_report', 'name' => 'Year-end report' },
                                 source_pc_id: 'lena_pc', transfer: 'copy')[0]
      bootstrap
      status, gate = unlock('object', 'ledger_yearend', NetworkModelScenario::YEAREND_PIN, 'pin')
      assert_equal [200, 'lena'], [status, gate['npcId']]
      assert_equal same, unlock('object', 'ye_deep', '1357', 'pin')
      assert_equal 200, mfa('prompt', 'object:ledger_yearend')[0]
      assert_equal same, unlock('object', 'ye_deep', '1357', 'pin'), 'a pass is not an open'
      status, body = unlock('object', 'ledger_yearend', NetworkModelScenario::YEAREND_PIN, 'pin')
      assert_equal [200, true], [status, body['success']]
      assert_not_includes body.to_json, 'SHARE-DEEP-WORDS'
      assert_nothing_leaked('SHARE-DEEP-WORDS')
      status, deep = unlock('object', 'ye_deep', '1357', 'pin')
      assert_equal [200, %w[ye_deep_doc]], [status, deep['contents'].map { |c| c['id'] }], 'the child has no gate of its own'
    end
  end
end
