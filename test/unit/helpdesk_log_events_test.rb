require 'test_helper'

module BreakEscape
  # Ops S8b unit 03: the three helpdesk log events register, accept their detail and refuse anything else.
  class HelpdeskLogEventsTest < ActiveSupport::TestCase
    T0 = 1_763_550_000_000
    EVENTS = %w[helpdesk_request account_password_reset account_mfa_reenrolled].freeze

    SCENARIO = {
      'startRoom' => 'lobby',
      'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {},
                                'npcs' => [{ 'id' => 'ria', 'displayName' => 'Ria',
                                             'creds' => { 'username' => 'ria_ops', 'password' => 'Plum-Orchard-41' } }] } },
      'helpdesks' => { 'it_desk' => { 'npc' => 'ria', 'verify' => 'none', 'resets' => %w[password mfa] } },
      'logSources' => { 'all' => { 'title' => 'All', 'events' => %w[helpdesk_* account_*] } }
    }.freeze

    setup do
      @mission = Mission.create!(name: 'test_simple_success', display_name: 'Desk log', published: true, difficulty_level: 1)
      @game = create_access_game(mission: @mission, player: break_escape_demo_users(:test_user), scenario: SCENARIO,
                                 player_state: { 'opsLogClockAt' => T0 })
    end

    teardown { BreakEscape::OpsLog::Current.reset }

    def write(event, as:, result:, detail: nil, **rest)
      @game.write_log_row!(event, as: as, where: { kind: 'desk', id: 'it_desk' }, result: result, detail: detail, **rest)
    end

    test 'the three entries are registered last, in order' do
      assert_equal EVENTS, OpsLogEvents::EVENTS.keys.last(3)
      assert_empty OpsLogEvents.problems(OpsLogEvents::EVENTS, OpsLogEvents::KINDS)
      assert_equal({ 'blocked' => 10 }, OpsLogEvents::EVENTS['helpdesk_request'][:save_limit])
    end

    test 'helpdesk_request accepts each result and what, and refuses others' do
      %w[granted refused].each do |result|
        %w[password mfa].each { |what| assert write('helpdesk_request', as: { typed: 'amy' }, result: result, detail: { what: what }).stored? }
      end
      assert write('helpdesk_request', as: { typed: 'amy' }, result: 'blocked', detail: { what: 'mfa' }, save_limit: true).stored?
      assert_raises(OpsLog::Malformed) { write('helpdesk_request', as: { typed: 'amy' }, result: 'ok', detail: { what: 'mfa' }) }
      assert_raises(OpsLog::Malformed) { write('helpdesk_request', as: { typed: 'amy' }, result: 'granted', detail: { what: 'badge' }) }
      assert_raises(OpsLog::Malformed) { write('helpdesk_request', as: { typed: 'amy' }, result: 'granted', detail: { other: 'mfa' }) }
    end

    test 'the reset events accept an NPC id as agent and refuse anything else' do
      EVENTS.last(2).each do |event|
        assert write(event, as: { account: 'ria_ops' }, result: 'ok', detail: { agent: 'ria' }).stored?
        assert_raises(OpsLog::Malformed) { write(event, as: { account: 'ria_ops' }, result: 'ok', detail: { agent: 'nobody' }) }
        assert_raises(OpsLog::Malformed) { write(event, as: { account: 'ria_ops' }, result: 'denied', detail: { agent: 'ria' }) }
        assert_raises(OpsLog::Malformed) { write(event, as: { account: 'ria_ops' }, result: 'ok', detail: { agent: 'ria', extra: 'x' }) }
      end
    end

    test 'an unknown desk is refused as a place' do
      assert_raises(OpsLog::Malformed) do
        @game.write_log_row!('helpdesk_request', as: { typed: 'amy' }, where: { kind: 'desk', id: 'no_desk' },
                                                 result: 'granted', detail: { what: 'mfa' })
      end
    end

    test 'a secret cannot reach a detail value: the codes are closed' do
      OpsLog.note_issued_secret('Reset-Secret-9')
      assert_raises(OpsLog::Malformed) do
        write('helpdesk_request', as: { typed: 'amy' }, result: 'granted', detail: { what: 'Reset-Secret-9' })
      end
    end
  end
end
