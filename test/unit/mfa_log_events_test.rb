# frozen_string_literal: true

require 'test_helper'

module BreakEscape
  # Ops core S8a unit 05: the eight multi-factor log events are registered with the results and
  # detail the build brief names, and the helper accepts exactly those.
  class MfaLogEventsTest < ActiveSupport::TestCase
    EXPECTED = {
      'mfa_challenge' => { results: %w[ok], detail: { 'route' => %w[keyboard foothold from] } },
      'mfa_code_ok' => { results: %w[ok] },
      'mfa_code_wrong' => { results: %w[fail] },
      'mfa_code_locked' => { results: %w[locked] },
      'mfa_expired' => { results: %w[expired] },
      'mfa_prompt_sent' => { results: %w[ok] },
      'mfa_prompt_approved' => { results: %w[ok], detail: { 'approver' => %w[owner held_phone own_phone] } },
      'mfa_prompt_denied' => { results: %w[denied] }
    }.freeze

    setup do
      @mission = Mission.create!(name: 'test_simple_success', display_name: 'Mfa log', published: true, difficulty_level: 1)
      @player = break_escape_demo_users(:test_user)
      scenario = {
        'startRoom' => 'lobby', 'logSources' => { 'mfa' => { 'title' => 'MFA', 'events' => ['mfa_*'] } },
        'rooms' => { 'lobby' => { 'type' => 'room_office',
                                  'objects' => [{ 'id' => 'recep_pc', 'type' => 'pc', 'lockType' => 'login', 'name' => 'Reception PC' }] } }
      }
      @game = create_access_game(mission: @mission, player: @player, scenario: scenario)
      @game.player_state['opsLogClockAt'] = 1_763_550_000_000
      @game.save!
    end

    teardown { BreakEscape::OpsLog::Current.reset }

    def write(event, result: 'ok', detail: nil, where: { kind: 'pc', id: 'recep_pc' })
      @game.write_log_row!(event, as: nil, where: where, result: result, detail: detail)
    end

    test 'the eight events are registered together, in order, as pc events labelled within the pattern' do
      # Later stages register their own events after these, so the eight are
      # checked as one unbroken run rather than as the tail of the list.
      assert_includes OpsLogEvents::EVENTS.keys.each_cons(8).to_a, EXPECTED.keys
      EXPECTED.each do |name, want|
        entry = OpsLogEvents::EVENTS[name]
        assert_equal %w[pc], entry[:places], name
        assert_equal want[:results], entry[:results], name
        assert_equal want[:detail] || {}, entry[:detail] || {}, name
        assert_match OpsLogEvents::LABEL_PATTERN, entry[:label]
        assert_not entry.key?(:save_limit), "#{name} has a save limit"
        assert_not entry.key?(:merge), "#{name} turns merging off"
      end
      assert_empty OpsLogEvents.problems(OpsLogEvents::EVENTS, OpsLogEvents::KINDS)
    end

    test 'each event accepts its result and detail and refuses another value' do
      EXPECTED.each do |name, want|
        want[:results].each { |result| assert write(name, result: result, detail: want[:detail] && { want[:detail].keys.first => want[:detail].values.first.first }), name }
        assert_raises(OpsLog::Malformed, name) { write(name, result: 'granted') }
        assert_raises(OpsLog::Malformed, name) { write(name, result: want[:results].first, where: { kind: 'door', id: 'lobby' }) }
        if want[:detail]
          key = want[:detail].keys.first
          assert_raises(OpsLog::Malformed, name) { write(name, result: want[:results].first, detail: { key => 'telepathy' }) }
          assert_raises(OpsLog::Malformed, name) { write(name, result: want[:results].first, detail: { 'other' => 'x' }) }
        else
          assert_raises(OpsLog::Malformed, name) { write(name, result: want[:results].first, detail: { 'route' => 'keyboard' }) }
        end
      end
    end

    test 'every value of each detail rule is accepted' do
      EXPECTED['mfa_challenge'][:detail]['route'].each { |v| assert write('mfa_challenge', detail: { 'route' => v }) }
      EXPECTED['mfa_prompt_approved'][:detail]['approver'].each { |v| assert write('mfa_prompt_approved', detail: { 'approver' => v }) }
    end

    test 'repeats merge into one row with a count' do
      3.times { write('mfa_code_wrong', result: 'fail') }
      rows = @game.player_state.dig('opsLog', 'mfa')
      assert_equal 1, rows.size
      assert_equal 3, rows.first['n']
    end

    test 'no detail takes free text, so a code or number cannot reach a row' do
      EXPECTED.each_key do |name|
        (OpsLogEvents::EVENTS[name][:detail] || {}).each_value { |rule| assert_kind_of Array, rule, name }
      end
      BreakEscape::OpsLog.note_issued_secret('731942')
      assert_raises(OpsLog::Malformed) { write('mfa_challenge', detail: { 'route' => '731942' }) }
    end
  end
end
