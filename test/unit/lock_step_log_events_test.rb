# frozen_string_literal: true

require 'test_helper'

module BreakEscape
  # Ops core S8c unit 05: the eight multi-factor log events also take an object or a door as their place,
  # and mfa_challenge names the lock's first-factor method.
  class LockStepLogEventsTest < ActiveSupport::TestCase
    NAMES = %w[mfa_challenge mfa_code_ok mfa_code_wrong mfa_code_locked mfa_expired mfa_prompt_sent mfa_prompt_approved mfa_prompt_denied].freeze
    METHODS = %w[key lockpick rfid biometric bluetooth ble pin password combination cryptex npc].freeze

    setup do
      @mission = Mission.create!(name: 'test_simple_success', display_name: 'Lock step log', published: true, difficulty_level: 1)
      @player = break_escape_demo_users(:test_user)
      scenario = {
        'startRoom' => 'lobby', 'logSources' => { 'mfa' => { 'title' => 'MFA', 'events' => ['mfa_*'] } },
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => { 'north' => 'vault' },
                                  'objects' => [{ 'id' => 'safe_a', 'type' => 'safe', 'lockType' => 'pin', 'requires' => '1234', 'name' => 'Safe A' }] },
                     'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin', 'requires' => '4321', 'connections' => { 'south' => 'lobby' } } }
      }
      @game = create_access_game(mission: @mission, player: @player, scenario: scenario)
      @game.player_state['opsLogClockAt'] = 1_763_550_000_000
      @game.save!
    end

    teardown { BreakEscape::OpsLog::Current.reset }

    def write(event, result:, where:, detail: nil)
      @game.write_log_row!(event, as: nil, where: where, result: result, detail: detail)
    end

    test 'all eight events list pc, object and door' do
      NAMES.each { |n| assert_equal %w[pc object door], OpsLogEvents::EVENTS[n][:places], n }
      assert_empty OpsLogEvents.problems(OpsLogEvents::EVENTS, OpsLogEvents::KINDS)
    end

    test 'each event accepts a row at an object and at a door' do
      NAMES.each do |n|
        result = OpsLogEvents::EVENTS[n][:results].first
        assert write(n, result: result, where: { kind: 'object', id: 'safe_a' }), "#{n} object"
        assert write(n, result: result, where: { kind: 'door', id: 'vault' }), "#{n} door"
        assert_raises(OpsLog::Malformed, n) { write(n, result: result, where: { kind: 'jack', id: 'x' }) }
      end
    end

    test 'mfa_challenge accepts each method and refuses another word' do
      METHODS.each do |m|
        assert write('mfa_challenge', result: 'ok', where: { kind: 'object', id: 'safe_a' }, detail: { 'method' => m }), m
      end
      assert_equal METHODS, OpsLogEvents::EVENTS['mfa_challenge'][:detail]['method']
      %w[telepathy fingerprint].each do |m|
        assert_raises(OpsLog::Malformed, m) { write('mfa_challenge', result: 'ok', where: { kind: 'door', id: 'vault' }, detail: { 'method' => m }) }
      end
      assert write('mfa_challenge', result: 'ok', where: { kind: 'door', id: 'vault' }, detail: { 'route' => 'keyboard', 'method' => 'pin' })
    end

    test 'mfa_prompt_approved still lists own_phone' do
      assert_includes OpsLogEvents::EVENTS['mfa_prompt_approved'][:detail]['approver'], 'own_phone'
      assert write('mfa_prompt_approved', result: 'ok', where: { kind: 'object', id: 'safe_a' }, detail: { 'approver' => 'own_phone' })
    end
  end
end
