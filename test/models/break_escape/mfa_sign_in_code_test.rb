require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8a unit 13: the sign-in second step, code kind, at model level with time frozen.
  class MfaSignInCodeTest < ActiveSupport::TestCase
    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)
    MFA_EVENTS = %w[mfa_challenge mfa_code_ok mfa_code_wrong mfa_code_locked mfa_expired signin_fail signin_ok
                    signin_refused signin_lockout].freeze

    def build(policy: {}, extra_state: {}, device: true)
      data = KS.scenario
      data['logSources'] = { 'mfa' => { 'title' => 'MFA', 'events' => MFA_EVENTS } }
      data['policies']['gate'] = { 'mfa' => 'code', 'remote' => 'allowed', 'maxAttempts' => 50 }.merge(policy)
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['policy'] = 'gate'
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'jake_pc' }['policy'] = 'gate'
      if device
        data['rooms']['lobby']['objects'] << { 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob',
                                               'owner' => 'sam', 'takeable' => true }
        data['rooms']['lobby']['objects'] << { 'id' => 'jake_fob', 'type' => 'code_device', 'name' => 'Jake fob',
                                               'owner' => 'jake', 'takeable' => true }
      end
      create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                         scenario: data, player_state: { 'currentRoom' => 'lobby' }.merge(extra_state))
    end

    setup do
      travel_to T0
      @game = build
    end

    teardown { travel_back }

    def first_step(game = @game, user: 'sokafor', pw: NS::SAM_PASSWORD, **route)
      game.attempt_login!('sam_pc', user, pw, **route)
    end

    def code(game = @game)
      game.code_device_code('sam_fob')
    end

    def wrong_code(game = @game)
      code(game) == '000000' ? '000001' : '000000'
    end

    def events(game = @game)
      game.log_rows_for('mfa').map { |r| r['event'] }
    end

    def pending(game = @game)
      game.player_state['mfaPending']['sam_pc']
    end

    test 'a right password owes a second step: record, answer, no session, failures kept, one row' do
      @game.player_state['loginFailures'] = { 'sam_pc|sokafor' => { 'n' => 2, 'seq' => 1 } }
      res = first_step
      assert_equal :ok, res[:status]
      assert_equal({ success: false, mfaRequired: true, mfa: 'code', pcId: 'sam_pc', npcId: 'sam' }, res[:body])
      assert_nil @game.player_state['sessions']['sam_pc']
      assert_equal 2, @game.player_state['loginFailures']['sam_pc|sokafor']['n']
      rec = pending
      assert_equal 'code', rec['kind']
      assert_equal 'sam', rec['npcId']
      assert_equal 1, rec['nonce']
      assert_equal 0, rec['tries']
      assert_equal T0.to_i, rec['at']
      assert_nil rec['foothold']
      assert_equal false, rec['fromGiven']
      assert_equal ['mfa_challenge'], events
      row = @game.log_rows_for('mfa').first
      assert_equal 'keyboard', row['detail']['route']
      assert_equal 'sokafor', row['as']['account']
      assert_not_includes @game.reload.player_state['mfaPending'].to_json, code
    end

    test 'the order: unknown account and wrong password never reach the step; lockout and refusal come first' do
      assert_equal 422, Rack::Utils.status_code(first_step(pw: 'nope')[:status])
      assert_empty @game.player_state['mfaPending'] || {}
      assert_equal 422, Rack::Utils.status_code(first_step(user: 'nobody')[:status])
      assert_empty @game.player_state['mfaPending'] || {}
      # a right password for an account the access list refuses: the refusal, no record
      @game.scenario_data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['access'] = { 'people' => ['sam'] }
      res = @game.attempt_login!('sam_pc', 'lfox', NS::LENA_PASSWORD)
      assert res[:body][:notPermitted]
      assert_empty @game.player_state['mfaPending'] || {}
      assert_not_includes events, 'mfa_challenge'
      # locked out: the lockout answer, no record
      @game.player_state['loginLockouts'] = ['sam_pc|sokafor']
      assert first_step[:body][:lockedOut]
      assert_empty @game.player_state['mfaPending'] || {}
    end

    test 'mfa_step_for answers none for each none case' do
      pc = @game.find_login_pc('sam_pc')[:object]
      sam = @game.scenario_room_npc('sam')
      assert_equal 'code', @game.mfa_step_for(pc, sam)
      assert_equal 'code', @game.mfa_kind_for(pc)
      assert_equal false, @game.mfa_reenrolled?('sam')
      # a policy that asks for none
      @game.scenario_data['policies']['gate']['mfa'] = 'none'
      assert_equal 'none', @game.mfa_step_for(pc, sam)
      @game.scenario_data['policies']['gate'].delete('mfa')
      assert_equal 'none', @game.mfa_step_for(pc, sam)
      @game.scenario_data['policies']['gate']['mfa'] = 'code'
      # an account that is not enrolled
      sam_exempt = sam.merge('creds' => sam['creds'].merge('mfa' => false))
      assert_equal 'none', @game.mfa_step_for(pc, sam_exempt)
      # code kind and no declared device
      assert_equal 'none', build(device: false).mfa_step_for(pc, sam)
      # the PC holds this account's own locked session: unlocking needs no step; another account does
      @game.player_state['sessions'] = { 'sam_pc' => { 'id' => 'sam', 'via' => 'password', 'locked' => true } }
      assert_equal 'none', @game.mfa_step_for(pc, sam)
      @game.player_state['sessions']['sam_pc']['id'] = 'lena'
      assert_equal 'code', @game.mfa_step_for(pc, sam)
      @game.player_state['sessions']['sam_pc'].delete('locked')
      assert_equal 'code', @game.mfa_step_for(pc, sam)
    end

    test 'a locked own session unlocks with the password alone' do
      @game.player_state['sessions'] = { 'sam_pc' => { 'id' => 'sam', 'via' => 'password', 'locked' => true } }
      res = first_step
      assert res[:body][:success]
      assert_nil @game.player_state['mfaPending']['sam_pc']
    end

    test 'a new first step overwrites the record and counts the start' do
      first_step
      first_step
      assert_equal 1, @game.player_state['mfaPending'].size
      assert_equal 2, pending['nonce']
      assert_equal 2, @game.player_state['mfaAccounts']['sam']['started']
    end

    test 'the right code signs in, drops the record, clears the failures and writes one row' do
      first_step
      @game.player_state['loginFailures'] = { 'sam_pc|sokafor' => { 'n' => 2, 'seq' => 1 } }
      res = @game.verify_sign_in_code!('sam_pc', code)
      assert_equal :ok, res[:status]
      assert res[:body][:success]
      assert_equal 'sam', res[:body]['npcId']
      assert_equal({ 'id' => 'sam', 'via' => 'password' }, @game.player_state['sessions']['sam_pc'])
      assert_nil @game.player_state['mfaPending']['sam_pc']
      assert_nil @game.player_state['loginFailures']['sam_pc|sokafor']
      assert_equal %w[mfa_challenge signin_ok mfa_code_ok], events
      assert_includes @game.player_state['signedInPcs'], 'sam_pc'
    end

    test 'the session is written with the stored foothold route' do
      @game.player_state['footholds'] = KS.office_foothold
      res = first_step(foothold: KS::OFFICE)
      assert res[:body][:mfaRequired]
      assert_equal KS::OFFICE, pending['foothold']
      assert_equal 'foothold', @game.log_rows_for('mfa').first['detail']['route']
      res = @game.verify_sign_in_code!('sam_pc', code)
      assert res[:body][:success]
      assert_equal KS::OFFICE, @game.player_state['sessions']['sam_pc']['foothold']
    end

    test 'the route is judged again at the second step: unplugged foothold, account removed from the list' do
      @game.player_state['footholds'] = KS.office_foothold
      first_step(foothold: KS::OFFICE)
      @game.player_state['footholds'] = {}
      res = @game.verify_sign_in_code!('sam_pc', code)
      assert_equal :forbidden, res[:status]
      assert_nil @game.player_state['sessions']['sam_pc']
      assert_not_includes events, 'mfa_code_wrong'

      first_step
      @game.scenario_data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['access'] = { 'people' => ['ian'] }
      res = @game.verify_sign_in_code!('sam_pc', code)
      assert res[:body][:notPermitted]
      assert_nil @game.player_state['sessions']['sam_pc']
      assert_equal %w[mfa_challenge mfa_challenge], events
    end

    test 'a wrong code counts a lockout failure, writes a row and says how many tries are left' do
      first_step
      res = @game.verify_sign_in_code!('sam_pc', wrong_code)
      assert_equal :unprocessable_entity, res[:status]
      assert res[:body][:mfaIncorrect]
      assert_equal 4, res[:body][:attemptsLeft]
      assert_equal 1, @game.player_state['loginFailures']['sam_pc|sokafor']['n']
      assert_equal %w[mfa_challenge signin_fail mfa_code_wrong].sort, events.sort
      assert pending
      assert_nil @game.player_state['sessions']['sam_pc']
    end

    test 'the fifth wrong try drops the record: expired, with its rows' do
      first_step
      4.times { @game.verify_sign_in_code!('sam_pc', wrong_code) }
      res = @game.verify_sign_in_code!('sam_pc', wrong_code)
      assert res[:body][:expired]
      assert_nil @game.player_state['mfaPending']['sam_pc']
      assert_equal 1, events.count('mfa_expired')
      assert_equal 5, @game.log_rows_for('mfa').find { |r| r['event'] == 'mfa_code_wrong' }['n']
      # nothing pending now: the generic refusal, no row
      before = events.size
      res = @game.verify_sign_in_code!('sam_pc', code)
      assert_equal Game::LOGIN_INCORRECT, res[:body][:message]
      assert_equal before, events.size
    end

    test 'the closing call writes one mfa_code_locked row; a closed step answers codeLocked with no row' do
      @game.scenario_data['policies']['gate'].delete('maxAttempts')
      @game.player_state['mfaAccounts'] = { 'sam' => { 'wrong' => 29, 'started' => 1 } }
      first_step
      res = @game.verify_sign_in_code!('sam_pc', wrong_code)
      assert res[:body][:mfaIncorrect]
      assert_equal 1, events.count('mfa_code_locked')
      first_step
      before = events.size
      res = @game.verify_sign_in_code!('sam_pc', code)
      assert res[:body][:codeLocked]
      assert_operator res[:body][:retryIn], :>, 0
      assert_equal before, events.size
      assert_nil @game.player_state['sessions']['sam_pc']
      travel_to T0 + MfaModel::CODE_CLOSED_SECONDS + 1
      first_step
      assert @game.verify_sign_in_code!('sam_pc', code)[:body][:success]
    end

    test 'stale and malformed codes write no row and count nothing' do
      first_step
      good = code
      assert @game.verify_sign_in_code!('sam_pc', good)[:body][:success]
      first_step
      before = events.size
      res = @game.verify_sign_in_code!('sam_pc', good)
      assert_equal 'used', res[:body][:stale]
      res = @game.verify_sign_in_code!('sam_pc', '12ab')
      assert res[:body][:mfaIncorrect]
      assert_equal before, events.size
      assert_equal 0, pending['tries']
      assert_nil @game.player_state['loginFailures']['sam_pc|sokafor']
    end

    test 'a locked-out account is refused at the second step' do
      first_step
      @game.player_state['loginLockouts'] = ['sam_pc|sokafor']
      assert @game.verify_sign_in_code!('sam_pc', code)[:body][:lockedOut]
      assert_nil @game.player_state['sessions']['sam_pc']
    end

    test 'an unknown PC and no record answer plainly' do
      assert_equal :not_found, @game.verify_sign_in_code!('nope', '123456')[:status]
      assert_equal Game::LOGIN_INCORRECT, @game.verify_sign_in_code!('sam_pc', code)[:body][:message]
    end

    test 'a record older than the pending time is gone' do
      first_step
      travel_to T0 + MfaModel::PENDING_SECONDS + 5
      assert_equal Game::LOGIN_INCORRECT, @game.verify_sign_in_code!('sam_pc', code)[:body][:message]
      assert_nil @game.player_state['sessions']['sam_pc']
    end

    test 'held_code_device wants the authored item held and not forged' do
      assert_nil @game.held_code_device('sam')
      item = { 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob', 'owner' => 'sam' }
      @game.player_state['inventory'] = [{ 'scenarioData' => item }]
      assert @game.held_code_device('sam')
      assert_nil @game.held_code_device('jake')
      @game.player_state['inventory'] = [{ 'scenarioData' => item.merge('owner' => 'jake') }]
      assert_nil @game.held_code_device('sam')
      @game.player_state['inventory'] = [{ 'scenarioData' => item.merge('id' => 'other_fob') }]
      assert_nil @game.held_code_device('sam')
    end

    test 'mfa_device_answer: not found, not held, then the code and seconds left' do
      assert_equal :not_found, @game.mfa_device_answer('nope')
      assert_equal :no_device, @game.mfa_device_answer('sam_fob')
      @game.player_state['inventory'] = [{ 'id' => 'sam_fob', 'type' => 'code_device', 'name' => 'Fob', 'owner' => 'sam' }]
      answer = @game.mfa_device_answer('sam_fob')
      assert_equal 'sam_fob', answer[:deviceId]
      assert_equal 'sam', answer[:npcId]
      assert_equal code, answer[:code]
      assert_equal 60 - (T0.to_i % 60), answer[:secondsLeft]
      assert_equal false, answer[:used]
      first_step
      assert @game.verify_sign_in_code!('sam_pc', code)[:body][:success]
      assert_equal true, @game.mfa_device_answer('sam_fob')[:used]
      # no policy declares a kind
      @game.scenario_data['policies']['gate'].delete('mfa')
      assert_equal :not_found, @game.mfa_device_answer('sam_fob')
    end

    test 'an assist invite sign-in never reaches the step' do
      state = { 'inventory' => [KS.held('jake_assist_code')] }
      game = build(extra_state: state)
      res = game.attempt_credential_login!('jake_pc', 'jake_assist', { relay: true })
      assert_equal :ok, res[:status], res.inspect
      assert game.player_state['sessions']['jake_pc']
      assert_empty game.player_state['mfaPending'] || {}
      assert_empty game.log_rows_for('mfa').select { |r| r['event'].start_with?('mfa_') }
    end

    test 'a claim never reaches the step' do
      @game.claim_login_session!('sam_pc')
      assert_empty @game.player_state['mfaPending'] || {}
      assert_empty events.select { |e| e.start_with?('mfa_') }
    end

    test 'with no mfa in any policy the first step is the old one' do
      game = build(policy: { 'mfa' => 'none' })
      res = first_step(game)
      assert res[:body][:success]
      assert_nil game.player_state['mfaPending']&.[]('sam_pc')
      assert_equal %w[signin_ok], events(game)
    end

    test 'push_number_match answers the one right number and nothing else' do
      game = build(policy: { 'mfa' => 'push_number_match' })
      res = first_step(game)
      assert_equal 'push_number_match', res[:body][:mfa]
      numbers = MfaModel.numbers(game.send(:mfa_key), game.id, 'pc:sam_pc', 'sam', game.player_state['mfaPending']['sam_pc']['nonce'])
      assert_equal numbers[:right], res[:body][:number]
      assert_not_includes game.player_state['mfaPending']['sam_pc'].to_json, numbers[:wrong].first.to_s if numbers[:wrong].first.to_s.size > 2
      assert_nil game.player_state['sessions']['sam_pc']
    end
  end
end
