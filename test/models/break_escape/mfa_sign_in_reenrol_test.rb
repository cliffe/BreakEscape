require 'test_helper'
require_relative '../../support/keyring_login_scenario'
require_relative '../../support/helpdesk_answer_shapes'

module BreakEscape
  # S8b unit 14: the sign-in second step once a helpdesk has re-enrolled an account onto the
  # player's own phone, at model level with time frozen.
  class MfaSignInReenrolTest < ActiveSupport::TestCase
    include HelpdeskAnswerShapes

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)
    Shaped = Struct.new(:status, :parsed_body)
    EVENTS = %w[mfa_challenge mfa_code_ok mfa_code_wrong mfa_code_locked mfa_expired mfa_prompt_sent
                mfa_prompt_approved mfa_prompt_denied signin_fail signin_ok signin_refused signin_lockout
                helpdesk_request account_mfa_reenrolled account_password_reset].freeze
    FOB = { 'id' => 'sam_fob', 'type' => 'code_device', 'owner' => 'sam' }.freeze
    SAM_PHONE = { 'id' => 'sam_phone', 'type' => 'phone_friendface', 'owner' => 'sam' }.freeze

    def build(kind: 'code', device: true, reset: %w[mfa], state: {})
      data = KS.scenario
      data['logSources'] = { 'mfa' => { 'title' => 'MFA', 'events' => EVENTS } }
      data['policies']['gate'] = { 'mfa' => kind, 'remote' => 'allowed', 'maxAttempts' => 50 }
      %w[sam_pc jake_pc].each do |id|
        data['rooms']['desk_room']['objects'].find { |o| o['id'] == id }['policy'] = 'gate'
      end
      lobby = data['rooms']['lobby']['objects']
      if device && kind == 'code'
        lobby << FOB.merge('name' => 'Fob', 'takeable' => true)
        lobby << { 'id' => 'jake_fob', 'type' => 'code_device', 'name' => 'Jake fob', 'owner' => 'jake', 'takeable' => true }
      end
      lobby << SAM_PHONE.merge('name' => 'Sam phone', 'takeable' => true) if kind != 'code'
      data['rooms'].each_value do |r|
        Array(r['npcs']).each { |n| n['habits'] = { 'approvesPrompts' => 'never' } if n['id'] == 'sam' } if kind != 'code'
      end
      game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                scenario: data, player_state: { 'currentRoom' => 'lobby' }.merge(state))
      reset.each { |what| game.account_resets['sam'] = (game.account_resets['sam'] || {}).merge(what => true) }
      game.save!
      game
    end

    setup do
      travel_to T0
      @game = build
    end

    teardown { travel_back }

    def shape(name, res)
      assert_answer_shape(name, Shaped.new(Rack::Utils::SYMBOL_TO_STATUS_CODE[res[:status]], JSON.parse(res[:body].to_json)))
    end

    def shape_body(name, body, status: :ok)
      shape(name, { status: status, body: body })
    end

    def first_step(game = @game, user: 'sokafor', pw: NS::SAM_PASSWORD, pc: 'sam_pc')
      game.attempt_login!(pc, user, pw)
    end

    def own_code(game = @game, id: 'sam')
      game.code_device_code("own:#{id}")
    end

    def old_code(game = @game, id: 'sam')
      game.code_device_code("#{id}_fob")
    end

    def hold(game, *items)
      game.player_state['inventory'] = items.map { |i| i.slice('id', 'type', 'owner') }
    end

    def later(seconds)
      travel_to Time.zone.at(Time.current.to_i + seconds)
    end

    def session?(game = @game, pc = 'sam_pc')
      !game.player_state.dig('sessions', pc).nil?
    end

    # ---- an account that is NOT re-enrolled behaves as before

    test 'an account not re-enrolled: no own forms, no ownPhone, the old device and phone as before' do
      game = build(reset: [])
      assert_equal :no_device, game.mfa_own_device_answer('sam')
      assert_equal :no_phone, game.mfa_own_phone_answer
      res = first_step(game)
      assert_equal({ success: false, mfaRequired: true, mfa: 'code', pcId: 'sam_pc', npcId: 'sam' }, res[:body])
      hold(game, FOB)
      held = game.mfa_device_answer('sam_fob')
      assert_equal %i[deviceId displayName npcId code secondsLeft used], held.keys
      assert_equal old_code(game), held[:code]
      assert_equal :ok, game.verify_sign_in_code!('sam_pc', old_code(game))[:status]
      assert session?(game)
    end

    test 'a game no desk touched never gains the reset keys through the sign-in step' do
      game = build(reset: [])
      game.player_state.delete('accountResets')
      first_step(game)
      hold(game, FOB)
      game.mfa_device_answer('sam_fob')
      assert_equal :no_phone, game.mfa_own_phone_answer
      game.verify_sign_in_code!('sam_pc', old_code(game))
      assert_not game.player_state.key?('accountResets')
      assert_not game.player_state.key?('helpdeskTries')
    end

    test 'a password reset alone does not re-enrol the second step' do
      game = build(reset: %w[password])
      assert_equal :no_device, game.mfa_own_device_answer('sam')
      assert_equal :no_phone, game.mfa_own_phone_answer
      assert_nil first_step(game)[:body][:ownPhone]
    end

    test 'another account is refused the own forms and keeps its own device' do
      assert_equal :no_device, @game.mfa_own_device_answer('jake')
      assert_equal :no_device, @game.mfa_own_device_answer('nobody')
      assert_equal :no_device, @game.mfa_own_device_answer(nil)
      res = first_step(@game, user: 'jbrooks', pw: KS::JAKE_PASSWORD, pc: 'jake_pc')
      assert_nil res[:body][:ownPhone]
    end

    test 'no policy declares a second step: not found, as for any device' do
      data = KS.scenario
      game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                scenario: data, player_state: { 'currentRoom' => 'lobby' })
      game.account_resets['sam'] = { 'mfa' => true }
      assert_equal :not_found, game.mfa_own_device_answer('sam')
    end

    # ---- code kind, re-enrolled

    test 'the first step answers ownPhone and matches the shared shape' do
      res = first_step
      assert_equal :ok, res[:status]
      assert_equal true, res[:body][:ownPhone]
      shape('login.mfa_required_own_code', res)
      assert_equal 'code', @game.player_state['mfaPending']['sam_pc']['kind']
    end

    test 'a code account with no device declared still owes the step once re-enrolled' do
      game = build(device: false)
      res = first_step(game)
      assert_equal 'code', res[:body][:mfa]
      assert_equal true, res[:body][:ownPhone]
      assert_equal :ok, game.verify_sign_in_code!('sam_pc', own_code(game))[:status]
      assert session?(game)
      plain = build(device: false, reset: [])
      assert_equal true, first_step(plain)[:body][:success]
    end

    test 'the own phone shows its code, once used it says so, and the old device shows none' do
      res = @game.mfa_own_device_answer('sam')
      shape_body('device.own', res)
      assert_equal own_code, res[:code]
      assert_equal 'own:sam', res[:deviceId]
      assert_equal 'My phone', res[:displayName]
      assert_equal false, res[:used]
      first_step
      assert_equal :ok, @game.verify_sign_in_code!('sam_pc', own_code)[:status]
      shape_body('device.own_used', @game.mfa_own_device_answer('sam'))
      hold(@game, FOB)
      held = @game.mfa_device_answer('sam_fob')
      shape_body('device.unenrolled', held)
      assert_not held.key?(:code)
      assert_not_includes held.to_json, old_code
    end

    test 'the own code signs in, and only once per window' do
      first_step
      res = @game.verify_sign_in_code!('sam_pc', own_code)
      assert_equal :ok, res[:status]
      shape('verify.own_passed', res)
      assert session?
      assert_includes @game.log_rows_for('mfa').map { |r| r['event'] }, 'mfa_code_ok'
      @game.player_state['sessions'].delete('sam_pc')
      first_step
      again = @game.verify_sign_in_code!('sam_pc', own_code)
      assert_equal :unprocessable_entity, again[:status]
      assert_equal 'used', again[:body][:stale]
      assert_not session?
      later(MfaModel::STEP_SECONDS)
      assert_equal :ok, @game.verify_sign_in_code!('sam_pc', own_code)[:status]
    end

    test 'the old device code no longer signs in and counts as a wrong code' do
      first_step
      assert_not_equal own_code, old_code
      res = @game.verify_sign_in_code!('sam_pc', old_code)
      assert_equal :unprocessable_entity, res[:status]
      assert_equal true, res[:body][:mfaIncorrect]
      assert_not session?
      assert_equal 1, @game.player_state['mfaPending']['sam_pc']['tries']
      assert_equal 1, @game.player_state['mfaAccounts']['sam']['wrong']
      assert_includes @game.log_rows_for('mfa').map { |r| r['event'] }, 'mfa_code_wrong'
    end

    test 'wrong own codes are counted and close the step exactly as for any code' do
      first_step
      wrong = own_code == '000000' ? '000001' : '000000'
      MfaModel::MAX_CODE_TRIES.times { @game.verify_sign_in_code!('sam_pc', wrong) }
      assert_nil @game.player_state['mfaPending']['sam_pc']
      assert_not session?
    end

    test 'the own phone code is for that account only: it does not pass another account' do
      jake = first_step(@game, user: 'jbrooks', pw: KS::JAKE_PASSWORD, pc: 'jake_pc')
      assert_nil jake[:body][:ownPhone]
      res = @game.verify_sign_in_code!('jake_pc', own_code)
      assert_equal :unprocessable_entity, res[:status]
      assert_nil @game.player_state.dig('sessions', 'jake_pc')
      assert_equal :ok, @game.verify_sign_in_code!('jake_pc', old_code(@game, id: 'jake'))[:status]
    end

    test 'the route is judged again before the own code is read' do
      first_step
      @game.scenario_data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['access'] = { 'people' => ['lena'] }
      res = @game.verify_sign_in_code!('sam_pc', own_code)
      assert_equal :unprocessable_entity, res[:status]
      assert res[:body][:notPermitted]
      assert_not session?
    end

    test 'a re-enrolment granted by a desk is what turns the own forms on' do
      data = KS.scenario
      data['logSources'] = { 'mfa' => { 'title' => 'MFA', 'events' => EVENTS } }
      data['policies']['gate'] = { 'mfa' => 'code', 'remote' => 'allowed', 'maxAttempts' => 50 }
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['policy'] = 'gate'
      data['helpdesks'] = { 'it_desk' => { 'npc' => 'ria', 'verify' => 'questions', 'questions' => %w[staff_no],
                                           'minCorrect' => 1, 'maxTries' => 3, 'resets' => %w[mfa],
                                           'questionLabels' => { 'staff_no' => 'Staff number' } } }
      npcs = data['rooms']['lobby']['npcs']
      npcs << { 'id' => 'ria', 'displayName' => 'Ria Desk', 'npcType' => 'person', 'position' => { 'x' => 6, 'y' => 2 } }
      npcs.find { |n| n['id'] == 'sam' }['creds']['recovery'] = { 'staff_no' => 'A-1042' }
      game = create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                                scenario: data, player_state: { 'currentRoom' => 'lobby', 'encounteredNPCs' => %w[ria sam] })
      assert_equal :no_device, game.mfa_own_device_answer('sam')
      granted = game.request_helpdesk!('it_desk', 'sokafor', 'mfa', { 'staff_no' => 'A-1042' })
      assert_equal true, granted[:body][:granted]
      assert_kind_of Hash, game.mfa_own_device_answer('sam')
      assert_equal true, first_step(game)[:body][:ownPhone]
    end

    # ---- push kinds, re-enrolled

    test 'a re-enrolled push account waits on its own phone and is approved with no phone held' do
      game = build(kind: 'push')
      res = first_step(game)
      assert_equal :ok, res[:status]
      assert_equal true, res[:body][:ownPhone]
      prompt = game.prompt_sign_in!('sam_pc')
      shape('prompt.waiting_own', prompt)
      assert_not game.player_state['inventory'].to_a.any? { |i| i['type'] == 'phone_friendface' }
      approved = game.approve_sign_in!('sam_pc', own: true)
      assert_equal :ok, approved[:status]
      assert_equal 'own_phone', approved[:body][:approvedBy]
      shape('approve.own_passed', approved)
      row = game.log_rows_for('mfa').find { |r| r['event'] == 'mfa_prompt_approved' }
      assert_equal 'own_phone', row['detail']['approver']
      assert session?(game)
    end

    test 'holding the old phone does not make the approval its own: the row still says own_phone' do
      game = build(kind: 'push')
      hold(game, SAM_PHONE)
      first_step(game)
      game.prompt_sign_in!('sam_pc')
      assert_equal :no_phone, game.mfa_phone_answer('sam')
      game.approve_sign_in!('sam_pc', own: true)
      row = game.log_rows_for('mfa').find { |r| r['event'] == 'mfa_prompt_approved' }
      assert_equal 'own_phone', row['detail']['approver']
    end

    test 'the own phone lists the waiting requests of re-enrolled accounts only' do
      game = build(kind: 'push')
      assert_equal [], game.mfa_own_phone_answer[:requests]
      first_step(game)
      game.prompt_sign_in!('sam_pc')
      answer = game.mfa_own_phone_answer
      assert_equal %w[sam_pc], answer[:requests].map { |r| r[:pcId] }
      assert_equal 'sokafor', answer[:requests].first[:username]
      shape_body('phone.own', answer)
      other = build(kind: 'push', reset: [])
      first_step(other)
      other.prompt_sign_in!('sam_pc')
      assert_equal :no_phone, other.mfa_own_phone_answer
    end

    test 'a re-enrolled number-matching account needs the right number' do
      game = build(kind: 'push_number_match')
      res = first_step(game)
      assert_equal true, res[:body][:ownPhone]
      assert res[:body][:number]
      game.prompt_sign_in!('sam_pc')
      list = game.mfa_own_phone_answer
      shape_body('phone.own_number_match', list)
      right = res[:body][:number]
      numbers = list[:requests].first[:numbers]
      assert_includes numbers, right
      wrong = numbers.find { |n| n != right }
      cancelled = game.approve_sign_in!('sam_pc', number: wrong, own: true)
      shape('approve.cancelled', cancelled)
      assert_not session?(game)
      again = first_step(game)
      game.prompt_sign_in!('sam_pc')
      assert_equal :unprocessable_entity, game.approve_sign_in!('sam_pc', own: true)[:status]
      assert_not session?(game)
      ok = game.approve_sign_in!('sam_pc', number: again[:body][:number], own: true)
      assert_equal :ok, ok[:status]
      assert session?(game)
    end

    test 'the number-matching own-push first step matches the shared shape' do
      game = build(kind: 'push_number_match')
      shape('login.mfa_required_own_push', first_step(game))
    end

    test 'an account not re-enrolled is refused the own phone approval' do
      game = build(kind: 'push', reset: [])
      first_step(game)
      game.prompt_sign_in!('sam_pc')
      assert_equal :no_phone, game.approve_sign_in!('sam_pc')
      assert_not session?(game)
    end

    # ---- typed sign-in

    test 'a password reset notes a typed sign-in only when the second step passes' do
      game = build(reset: %w[mfa password])
      first_step(game)
      assert_nil game.account_resets['sam']['typed']
      wrong = own_code(game) == '000000' ? '000001' : '000000'
      game.verify_sign_in_code!('sam_pc', wrong)
      assert_nil game.account_resets['sam']['typed']
      assert_equal :ok, game.verify_sign_in_code!('sam_pc', own_code(game))[:status]
      assert_equal true, game.account_resets['sam']['typed']
    end

    test 'an account with no password reset never gains typed' do
      first_step
      @game.verify_sign_in_code!('sam_pc', own_code)
      assert_nil @game.account_resets['sam']['typed']
    end

    test 'R1-SERVER6: reading the own phone and the own device writes nothing, even in memory' do
      @game.save!
      before = @game.reload.player_state.deep_dup
      @game.mfa_own_device_answer('sam')
      assert_equal before, @game.player_state
      @game.mfa_own_phone_answer
      assert_equal before, @game.player_state
      assert_nil @game.player_state['mfaAccounts']&.dig('sam')
    end

    test 'R2-SERVER3: reading the own phone creates no mfaPending key when the game has none' do
      @game.player_state.delete('mfaPending')
      @game.save!
      before = @game.reload.player_state.deep_dup
      refute before.key?('mfaPending')
      @game.mfa_own_phone_answer
      assert_equal before, @game.player_state
    end

    test 'R1-SERVER6: a used window still reads as used without creating an entry' do
      @game.player_state['mfaAccounts'] = { 'sam' => { 'used' => (T0.to_i / MfaModel::STEP_SECONDS) + 5 } }
      assert_equal true, @game.mfa_own_device_answer('sam')[:used]
    end
  end
end
