require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Keyring K2 (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md 3.8 and 7.3): the session record's
  # readers. A relay session is a sink: never a pivot, a share source, a mapped drive or an
  # implant host, opened only by relay=1 and never at the holder's keyboard. A foothold credential
  # session is judged as a remote password session and ends on unplug, even when opened at the
  # target's keyboard.
  class CredentialSessionsTest < ActiveSupport::TestCase
    KS = KeyringLoginScenario
    OFFICE = KS::OFFICE

    setup do
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: KS.scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby comms_room desk_room workshop kiosk_room store],
                        'encounteredNPCs' => %w[sam lena ian jake], 'footholds' => KS.office_foothold }
      )
    end

    def relay_at_jake
      @game.player_state['sessions'] = { 'jake_pc' => { 'id' => 'jake', 'via' => 'credential', 'credential' => 'jake_assist',
                                                        'relay' => true } }
    end

    def password_at_jake
      @game.player_state['sessions'] = { 'jake_pc' => { 'id' => 'jake', 'via' => 'password' } }
    end

    def set_global(name, value)
      @game.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge(name => value)
    end

    def info(pc_id)
      @game.find_login_pc(pc_id)
    end

    # ---- session_route_up? --------------------------------------------------------------------

    test 'a relay session is up until its invite ends or its PC is off' do
      relay_at_jake
      assert @game.session_route_up?('jake_pc')

      @game.player_state['endedCredentials'] = ['jake_assist']
      refute @game.session_route_up?('jake_pc'), 'an ended invite'

      @game.player_state['endedCredentials'] = []
      set_global(KS::JAKE_OFF_GLOBAL, true)
      refute @game.session_route_up?('jake_pc'), 'an off PC'
    end

    test 'a foothold credential session is up while its foothold reaches the PC' do
      @game.player_state['sessions'] = { 'lena_pc' => { 'id' => 'lena', 'via' => 'credential', 'credential' => 'lena_rdp',
                                                        'foothold' => OFFICE } }
      assert @game.session_route_up?('lena_pc')
      @game.player_state['footholds'] = {}
      refute @game.session_route_up?('lena_pc')
    end

    # ---- the relay invariant ------------------------------------------------------------------

    test 'a relay at jake_pc is no pivot to server_net, while a password session there is' do
      password_at_jake
      assert_includes @game.structural_reach(OFFICE), 'server_net', 'the control: a password session pivots'

      # Same game object, same session key: the reach cache must still miss (reach_cache_key)
      relay_at_jake
      refute_includes @game.structural_reach(OFFICE), 'server_net'
      refute_includes @game.player_reach(OFFICE), 'server_net'
      assert_empty @game.view_session_hosts
      assert_empty @game.reach_session_hosts
    end

    test 'a relay session is no share source and maps no shares' do
      @game.player_state['footholds'] = {}
      ledger = @game.scenario_data['resources']['ledger_archive']
      jake_pc = info('jake_pc')[:object]
      jake = @game.scenario_room_npc('jake')

      password_at_jake
      assert @game.resource_admits_player?(ledger), 'the control: a finance password session opens the finance share'
      refute_empty @game.mapped_shares(jake_pc, jake)

      relay_at_jake
      refute @game.resource_admits_player?(ledger)
      assert_empty @game.mapped_shares(jake_pc, jake)
    end

    # ---- prune --------------------------------------------------------------------------------

    test 'prune runs to a fixed point and never ends a relay session' do
      @game.player_state['sessions'] = {
        'jake_pc' => { 'id' => 'jake', 'via' => 'credential', 'credential' => 'jake_assist', 'relay' => true },
        'sv_fs02' => { 'id' => 'ian', 'via' => 'password', 'foothold' => OFFICE }
      }
      assert_equal ['sv_fs02'], @game.prune_unreachable_sessions!
      assert @game.player_state['sessions'].key?('jake_pc')
      assert_equal [], @game.prune_unreachable_sessions!
    end

    test 'a foothold credential session ends on unplug, as a password session does' do
      @game.player_state['sessions'] = { 'lena_pc' => { 'id' => 'lena', 'via' => 'credential', 'credential' => 'lena_rdp',
                                                        'foothold' => OFFICE } }
      @game.player_state['footholds'] = {}
      assert_equal ['lena_pc'], @game.prune_unreachable_sessions!
    end

    test 'a saved-connection session opened at the target keyboard keeps its foothold and still ends on unplug' do
      @game.player_state['sessions'] = { 'lena_pc' => { 'id' => 'lena', 'via' => 'credential', 'credential' => 'lena_rdp',
                                                        'foothold' => OFFICE } }
      @game.save!
      @game.settle_session_at_keyboard!('lena_pc')
      assert_equal OFFICE, @game.player_state['sessions']['lena_pc']['foothold']

      @game.player_state['footholds'] = {}
      assert_equal ['lena_pc'], @game.prune_unreachable_sessions!
    end

    # ---- reload -------------------------------------------------------------------------------

    test 'reload_ended_session_ids holds claims and relays; claimed_session_ids holds claims only' do
      @game.player_state['sessions'] = {
        'jake_pc' => { 'id' => 'jake', 'via' => 'credential', 'credential' => 'jake_assist', 'relay' => true },
        'sam_pc' => { 'id' => 'sam', 'via' => 'claim' },
        'lena_pc' => { 'id' => 'lena', 'via' => 'credential', 'credential' => 'lena_rdp', 'foothold' => OFFICE }
      }
      assert_equal %w[jake_pc sam_pc], @game.reload_ended_session_ids.sort
      assert_equal %w[sam_pc], @game.claimed_session_ids
      refute @game.sessions_for_client.key?('jake_pc')
      assert @game.sessions_for_client.key?('lena_pc')
    end

    # ---- desktop requests ---------------------------------------------------------------------

    test 'desktop_request_allowed? checks relay=1 against the record and never falls to the keyboard rule' do
      jake = info('jake_pc')
      password_at_jake
      assert @game.desktop_request_allowed?(jake, nil), 'the control: the keyboard opens a password session'
      refute @game.desktop_request_allowed?(jake, { relay: true }), 'relay=1 with no relay record'
      assert_equal 'unreachable', @game.desktop_refusal(jake, { relay: true })

      relay_at_jake
      assert @game.desktop_request_allowed?(jake, { relay: true })
      refute @game.desktop_request_allowed?(jake, nil), 'the holder keyboard never opens the shared screen'
      refute @game.desktop_request_allowed?(jake, { foothold: OFFICE })
      refute @game.desktop_request_allowed?(jake, OFFICE), 'a bare foothold id is read as a foothold route'
      refute @game.desktop_request_allowed?(jake, { from: 'sam_pc' }), 'from (K4) is not built'

      set_global(KS::JAKE_OFF_GLOBAL, true)
      refute @game.desktop_request_allowed?(jake, { relay: true })
      assert_equal 'not_responding', @game.desktop_refusal(jake, { relay: true })
    end

    test 'unlock_session_refusal answers not_responding for an off host under a relay session' do
      relay_at_jake
      set_global(KS::JAKE_OFF_GLOBAL, true)
      refusal = @game.unlock_session_refusal('object', 'jake_notes')
      assert_equal 'not_responding', refusal && refusal[:reason]

      password_at_jake
      refusal = @game.unlock_session_refusal('object', 'jake_notes')
      assert_equal 'off', refusal && refusal[:reason], 'the control: a keyboard session at an off PC'
    end

    test 'a relay session takes no implant' do
      relay_at_jake
      refute @game.send(:remote_route_session?, { 'id' => 'jake', 'via' => 'password' })
      assert @game.send(:remote_route_session?, @game.player_state['sessions']['jake_pc'])
    end
  end
end
