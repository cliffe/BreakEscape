require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8a unit 18: the sign-in callers for push, approve and phone, at model level with time frozen.
  class MfaSignInPushTest < ActiveSupport::TestCase
    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)
    PHONE = { 'id' => 'sam_phone', 'type' => 'phone_friendface', 'name' => 'Sam phone', 'owner' => 'sam' }.freeze
    MFA_EVENTS = %w[mfa_challenge mfa_code_ok mfa_code_wrong mfa_code_locked mfa_expired mfa_prompt_sent
                    mfa_prompt_approved mfa_prompt_denied signin_fail signin_ok signin_refused signin_lockout].freeze

    def build(kind: 'push', habits: { 'approvesPrompts' => 'pestered', 'promptPatience' => 3 }, extra_state: {})
      data = KS.scenario
      data['logSources'] = { 'mfa' => { 'title' => 'MFA', 'events' => MFA_EVENTS } }
      data['policies']['gate'] = { 'mfa' => kind, 'remote' => 'allowed', 'maxAttempts' => 50 }
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['policy'] = 'gate'
      data['rooms']['lobby']['objects'] << PHONE.merge('takeable' => true)
      data['rooms'].each_value { |r| Array(r['npcs']).each { |n| n['habits'] = habits if n['id'] == 'sam' } }
      create_access_game(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                         scenario: data, player_state: { 'currentRoom' => 'lobby' }.merge(extra_state))
    end

    setup do
      travel_to T0
      @game = build
    end

    teardown { travel_back }

    def first_step(game = @game, **route)
      game.attempt_login!('sam_pc', 'sokafor', NS::SAM_PASSWORD, **route)
    end

    def hold_phone(game = @game)
      game.player_state['inventory'] = [PHONE.slice('id', 'type', 'owner')]
    end

    def later(seconds)
      travel_to Time.zone.at(Time.current.to_i + seconds)
    end

    def rows(game = @game)
      game.log_rows_for('mfa')
    end

    def events(game = @game)
      rows(game).flat_map { |r| [r['event']] * (r['n'] || 1) }
    end

    def pending(game = @game)
      game.player_state['mfaPending']['sam_pc']
    end

    test 'F9: pestering, approved on the third request; the count resets and the session opens' do
      first_step
      res = @game.prompt_sign_in!('sam_pc')
      assert_equal :ok, res[:status]
      assert_equal({ success: false, approved: false, promptsSent: 1, waiting: 'owner' }, res[:body])
      later(3)
      assert_equal 2, @game.prompt_sign_in!('sam_pc')[:body][:promptsSent]
      later(3)
      res = @game.prompt_sign_in!('sam_pc')
      assert_equal true, res[:body][:success]
      assert_equal 'owner', res[:body][:approvedBy]
      assert_equal 'password', @game.player_state['sessions']['sam_pc']['via']
      assert_nil @game.player_state['mfaPending']['sam_pc']
      assert_equal 0, @game.player_state['mfaPrompts']['sam']
      assert_equal %w[mfa_challenge mfa_prompt_sent mfa_prompt_sent mfa_prompt_sent signin_ok mfa_prompt_approved], events
      assert_equal 'owner', rows.last['detail']['approver']
    end

    test 'the count survives a reload between requests' do
      first_step
      @game.prompt_sign_in!('sam_pc')
      later(3)
      @game.prompt_sign_in!('sam_pc')
      @game.save!
      game = Game.find(@game.id)
      later(3)
      first_step(game)
      later(3)
      assert_equal true, game.prompt_sign_in!('sam_pc')[:body][:success]
      assert_equal 0, game.player_state['mfaPrompts']['sam']
    end

    test 'too soon is a 422 with the wait and counts nothing' do
      first_step
      @game.prompt_sign_in!('sam_pc')
      res = @game.prompt_sign_in!('sam_pc')
      assert_equal :unprocessable_entity, res[:status]
      assert_equal true, res[:body][:tooSoon]
      assert_equal 2, res[:body][:retryAfterS]
      assert_equal 1, pending['n']
      assert_equal 1, events.count('mfa_prompt_sent')
    end

    test 'F10: a careful owner is never approved; the cap ends the attempt with one mfa_expired row' do
      @game = build(habits: { 'approvesPrompts' => 'never' })
      first_step
      MfaModel::MAX_PROMPTS.times do
        assert_equal false, @game.prompt_sign_in!('sam_pc')[:body][:approved]
        later(3)
      end
      res = @game.prompt_sign_in!('sam_pc')
      assert_equal :unprocessable_entity, res[:status]
      assert_equal true, res[:body][:expired]
      assert_nil @game.player_state['mfaPending']['sam_pc']
      assert_nil @game.player_state['sessions']['sam_pc']
      assert_equal MfaModel::MAX_PROMPTS, events.count('mfa_prompt_sent')
      assert_equal 1, events.count('mfa_expired')
    end

    test 'no live push record is the credential refusal; a code record is not a push record' do
      assert_equal 422, Rack::Utils.status_code(@game.prompt_sign_in!('sam_pc')[:status])
      assert_equal :not_found, @game.prompt_sign_in!('nope')[:status]
      @game = build(kind: 'code')
      first_step
      assert_equal 422, Rack::Utils.status_code(@game.prompt_sign_in!('sam_pc')[:status])
      assert_not_includes events, 'mfa_prompt_sent'
    end

    test 'the route is re-judged on prompt and approve' do
      @game = build(extra_state: { 'foothold' => nil })
      res = first_step
      assert_equal 'push', res[:body][:mfa]
      @game.player_state['loginFailures'] = {}
      # make the account no longer admitted by the PC: the access list now excludes sam
      scenario = @game.scenario_data
      scenario['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['accessList'] = ['someone_else']
      @game.define_singleton_method(:pc_admits_account?) { |_pc, _npc| false }
      res = @game.prompt_sign_in!('sam_pc')
      assert_equal true, res[:body][:notPermitted]
      hold_phone
      assert_equal true, @game.approve_sign_in!('sam_pc', number: nil, deny: false)[:body][:notPermitted]
      assert_nil @game.player_state['sessions']['sam_pc']
    end

    test 'F12: with the owner phone held, approve passes with approver held_phone' do
      first_step
      hold_phone
      res = @game.approve_sign_in!('sam_pc')
      assert_equal :ok, res[:status]
      assert_equal true, res[:body][:success]
      assert_equal 'player', res[:body][:approvedBy]
      assert_equal 'mfa_prompt_approved', rows.last['event']
      assert_equal 'held_phone', rows.last['detail']['approver']
      assert_equal 'password', @game.player_state['sessions']['sam_pc']['via']
    end

    test 'approve is refused without the phone and changes nothing' do
      first_step
      assert_equal :no_phone, @game.approve_sign_in!('sam_pc')
      assert_not_nil pending
      assert_equal ['mfa_challenge'], events
    end

    test 'F13: number matching, the owner never approves, the right number with the phone does' do
      @game = build(kind: 'push_number_match', habits: { 'approvesPrompts' => 'always' })
      res = first_step
      right = res[:body][:number]
      assert_kind_of Integer, right
      3.times do
        assert_equal false, @game.prompt_sign_in!('sam_pc')[:body][:approved]
        later(3)
      end
      hold_phone
      assert_equal 'player', @game.approve_sign_in!('sam_pc', number: right)[:body][:approvedBy]
    end

    test 'F14: deny and a wrong number cancel, write one denied row and count no lockout failure' do
      @game = build(kind: 'push_number_match')
      right = first_step[:body][:number]
      hold_phone
      res = @game.approve_sign_in!('sam_pc', number: right + 1)
      assert_equal :unprocessable_entity, res[:status]
      assert_equal({ success: false, cancelled: true }, res[:body])
      assert_nil @game.player_state['mfaPending']['sam_pc']
      assert_equal 1, events.count('mfa_prompt_denied')
      assert_empty @game.player_state['loginFailures'] || {}
      first_step
      assert_equal true, @game.approve_sign_in!('sam_pc', deny: true)[:body][:cancelled]
      assert_equal 2, events.count('mfa_prompt_denied')
      assert_empty @game.player_state['loginFailures'] || {}
    end

    test 'the phone answer: no_phone unless held, else this owner requests with numbers for number matching' do
      @game = build(kind: 'push_number_match')
      first_step
      assert_equal :no_phone, @game.mfa_phone_answer('sam')
      hold_phone
      answer = @game.mfa_phone_answer('sam')
      assert_equal 1, answer[:requests].size
      req = answer[:requests].first
      assert_equal 'sam_pc', req[:pcId]
      assert_equal 'sokafor', req[:username]
      assert_equal 0, req[:n]
      assert_equal 3, req[:numbers].size
      assert_equal({ requests: [] }, @game.mfa_phone_answer('sam').merge(requests: []))
      @game = build
      hold_phone
      first_step
      assert_nil @game.mfa_phone_answer('sam')[:requests].first[:numbers]
    end
  end
end
