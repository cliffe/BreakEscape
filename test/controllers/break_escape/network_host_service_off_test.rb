require 'test_helper'
require_relative '../../support/network_model_scenario'

module BreakEscape
  # Networks slice 9.3b, plan 5.2 "A host whose own service is off": a sign-in host whose
  # office-life `affordance.offWhen` (9.2's field) holds on the server shows as not responding
  # in the view, and a remote sign-in, a remote desktop and a scoped request under a remote
  # session there are refused 403 not_responding. A session already held there is kept, and
  # works again once the service is back. Off is off at the keyboard too (user decision q72):
  # a walk-up sign-in, a claim, the keyboard desktop and its mapped shares are refused 403 off.
  class NetworkHostServiceOffTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    NS = NetworkModelScenario
    OFFICE = 'jack_comms_port'.freeze
    LENA_OFF = 'lena_pc_unplugged'.freeze

    def state
      @game.reload.player_state
    end

    def set_global(name, value)
      @game.reload
      @game.player_state['globalVariables'] ||= {}
      @game.player_state['globalVariables'][name] = value
      @game.save!
    end

    # lena_pc's service is off while lena_pc_unplugged is true; sam_pc uses the
    # `{ name: value }` form of offWhen.
    def scenario_with_service_off(lena_off:, sam_power: 'on')
      data = NS.scenario
      pcs = data['rooms'].values.flat_map { |room| room['objects'] || [] }
      pcs.find { |o| o['id'] == 'lena_pc' }['affordance'] = { 'offWhen' => LENA_OFF }
      pcs.find { |o| o['id'] == 'sam_pc' }['affordance'] = { 'offWhen' => { 'sam_pc_power' => 'off' } }
      data['globalVariables'] = (data['globalVariables'] || {}).merge(LENA_OFF => lena_off, 'sam_pc_power' => sam_power)
      data
    end

    # The pivot fixture (office_lan linked to server_net) with Lena's PC switchable
    def with_pivot_foothold
      data = NS.with_pivot
      lena = data['rooms'].values.flat_map { |room| room['objects'] || [] }.find { |o| o['id'] == 'lena_pc' }
      lena['affordance'] = { 'offWhen' => LENA_OFF }
      data['globalVariables'] = (data['globalVariables'] || {}).merge(LENA_OFF => false)
      build_network_game({}, data)
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def with_foothold(lena_off:, sam_power: 'on', player_state: {})
      build_network_game(player_state, scenario_with_service_off(lena_off: lena_off, sam_power: sam_power))
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    def row(id)
      view = network_view(OFFICE)
      view['footholds'].find { |f| f['id'] == OFFICE }['hosts'].find { |h| h['id'] == id }
    end

    test 'a host whose offWhen holds is listed as not responding, with no sign-in or session' do
      with_foothold(lena_off: true)
      lena = row('lena_pc')
      assert lena, 'the host stays listed (its name is already exposed by its network)'
      assert_equal false, lena['responding']
      refute lena.key?('remoteSignIn'), 'no sign-in is offered'
      refute lena.key?('session'), 'no session is offered'

      kiosk = row('kiosk_pc')
      refute kiosk.key?('responding'), 'a host with no offWhen carries no responding field'
      assert kiosk.key?('remoteSignIn')
    end

    test 'a remote sign-in to a host whose service is off is 403 not_responding, before the password is read' do
      with_foothold(lena_off: true)
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'not_responding', body['reason']
      assert_equal 'PC not responding', body['message']
      refute body.to_json.include?('lfox'), 'nothing about the account comes back'
      refute state['sessions'].to_h.key?('lena_pc'), 'no session is written'
      assert_empty state['loginFailures'].to_h, 'no failed attempt is counted'

      # Switched back on, the same request signs in and the row offers it again.
      set_global(LENA_OFF, false)
      assert_equal true, row('lena_pc')['remoteSignIn']
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :success, body.inspect
    end

    test 'a held remote session is kept while the service is off, its desktop and scoped requests refused, and reopens' do
      with_foothold(lena_off: false)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      assert_equal 'Lena Fox', row('lena_pc')['session']['displayName']

      set_global(LENA_OFF, true)
      container('lena_pc', foothold: OFFICE)
      assert_response :forbidden
      assert_equal 'not_responding', response.parsed_body['reason'], 'the row and the refusal say the same'
      container('lena_local')
      assert_response :forbidden, 'a file on the host is refused under the remote session'
      @game.reload
      refute @game.session_route_up?('lena_pc'), 'the scoped-request test reads the service too'
      assert state['sessions'].key?('lena_pc'), 'the session is kept'
      assert_equal false, row('lena_pc')['responding']

      set_global(LENA_OFF, false)
      body = container('lena_pc', foothold: OFFICE)
      assert_response :success, body.inspect
      assert_includes body['contents'].map { |c| c['id'] }, 'lena_local'
    end

    test 'the hash form of offWhen matches on value' do
      with_foothold(lena_off: false, sam_power: 'off')
      assert_equal false, row('sam_pc')['responding'], "{ name: value } holds when the global equals the value"
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD, foothold: OFFICE)
      assert_response :forbidden

      set_global('sam_pc_power', 'on')
      refute row('sam_pc').key?('responding'), 'another value does not hold'
    end

    # q72: off is off at the keyboard too
    test 'at the keyboard of an off PC the sign-in, its screen and a claim are refused with "This PC is off."' do
      with_foothold(lena_off: false, sam_power: 'off')
      body = sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :forbidden
      assert_equal 'off', body['reason']
      assert_equal 'This PC is off.', body['message']
      refute state['sessions'].to_h.key?('sam_pc')
      assert_empty state['loginFailures'].to_h, 'no failed attempt is counted'

      get game_path('login_accounts'), params: { pc_id: 'sam_pc' }, as: :json
      assert_response :forbidden
      assert_equal 'off', response.parsed_body['reason'], 'the sign-in screen is not shown'

      post game_path('login'), params: { pc_id: 'sam_pc', claim: 'owner' }, as: :json
      assert_response :forbidden
      assert_equal 'off', response.parsed_body['reason'], 'an unlocked screen cannot be claimed either'

      set_global('sam_pc_power', 'on')
      get game_path('login_accounts'), params: { pc_id: 'sam_pc' }, as: :json
      assert_response :success
      body = sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)
      assert_response :success, body.inspect
    end

    # q72, and review R2 m1: a keyboard session is kept, but its desktop, its folders and its
    # mapped shares are refused, the add path as well as the read, so a share cannot be
    # written or taken from while it cannot be read
    test 'a keyboard session at an off PC is kept, its desktop, files and shares refused, and works again' do
      # Lena's office is unlocked, so her PC can be walked up to
      with_foothold(lena_off: false, player_state: { 'unlockedRooms' => OPEN_ROOMS + ['finance_office'] })
      body = sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD)
      assert_response :success, body.inspect
      body = container('lena_pc')
      assert_response :success
      assert_includes body['contents'].map { |c| c['id'] }, 'ledger_archive'

      set_global(LENA_OFF, true)
      body = container('lena_pc')
      assert_response :forbidden
      assert_equal 'off', body['reason']
      assert_equal 'This PC is off.', body['error']
      container('lena_local')
      assert_response :forbidden, 'a file on the PC is refused'
      container('ledger_archive')
      assert_response :not_found, 'the mapped share is not served'
      add_item('text_file', 'ledger_handover', NS::HANDOVER_NAME, source_pc_id: 'lena_pc', transfer: 'copy')
      assert_not_equal 200, response.status, 'a file from the share cannot be taken'
      refute((state['inventory'] || []).any? { |i| i['id'] == 'ledger_handover' }, 'nothing was added')
      add_item('text_file', 'lena_local', 'budget.txt', source_pc_id: 'lena_pc')
      assert_not_equal 200, response.status, 'nor a file on the PC itself'
      assert state['sessions'].key?('lena_pc'), 'the session is kept'

      set_global(LENA_OFF, false)
      body = container('lena_pc')
      assert_response :success, body.inspect
      add_item('text_file', 'ledger_handover', NS::HANDOVER_NAME, source_pc_id: 'lena_pc', transfer: 'copy')
      assert_response :success, response.body
    end

    # Review R1 M1: a switched-off PC is off for everything that goes through it, so it relays
    # no pivot. structural_reach still counts it, so nothing is pruned.
    test 'an off host carries no onward pivot; the onward session is kept and returns with the power' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      body = sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :success, body.inspect

      set_global(LENA_OFF, true)
      refute_includes @game.player_reach(OFFICE), 'server_net', 'the off host relays nothing onward'
      assert_includes @game.structural_reach(OFFICE), 'server_net', 'the structure is unchanged'
      server = network_view(OFFICE)['footholds'].find { |f| f['id'] == OFFICE }['networks'].find { |b| b['id'] == 'server_net' }
      assert_equal 'down', server && server['route'], 'the onward session shows in a down block'
      container('sv_fs02', foothold: OFFICE)
      assert_response :forbidden
      state['sessions'].then { |s| assert s.key?('sv_fs02') && s.key?('lena_pc'), 'both sessions are kept' }

      set_global(LENA_OFF, false)
      assert_includes @game.player_reach(OFFICE), 'server_net'
      body = container('sv_fs02', foothold: OFFICE)
      assert_response :success, body.inspect
    end

    test 'a fresh sign-in across the link through an off pivot host is refused' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      set_global(LENA_OFF, true)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      assert_response :forbidden
      refute state['sessions'].key?('sv_fs02')
    end

    # Review R1 M2: a share is not served through a session at an off host, nor through a remote
    # session whose route is down
    test 'a share is not served through a session at an off host or over a route that is down' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      container('ledger_archive')
      assert_response :success, 'served through Lena (finance) while her PC is on'
      container('backup_vault')
      assert_response :success, 'served through Ian (it) at the server host'

      set_global(LENA_OFF, true)
      container('ledger_archive')
      assert_response :not_found, 'not through an off host'
      @game.reload
      refute @game.session_route_up?('sv_fs02'), "the server session's route is down"
      container('backup_vault')
      assert_response :not_found, 'not through a remote session whose route is down'

      set_global(LENA_OFF, false)
      container('ledger_archive')
      assert_response :success
      container('backup_vault')
      assert_response :success
    end

    test 'an off row names a session that is kept there' do
      with_foothold(lena_off: false)
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      set_global(LENA_OFF, true)
      lena = row('lena_pc')
      assert_equal 'Lena Fox', lena['heldAs']
      refute lena.key?('session')
    end

    # Review R2 m2: an up block is labelled with a host that answers, never an off one. A down
    # block still names the off host.
    test 'the via of an up block skips an off session host' do
      data = NS.with_pivot
      pcs = data['rooms'].values.flat_map { |room| room['objects'] || [] }
      pcs.find { |o| o['id'] == 'sam_pc' }['affordance'] = { 'offWhen' => 'sam_pc_off' }
      data['globalVariables'] = (data['globalVariables'] || {}).merge('sam_pc_off' => false)
      build_network_game({}, data)
      take_drop_box
      plant('comms_port')
      %w[lena_pc sam_pc].each do |pc|
        creds = pc == 'sam_pc' ? ['sokafor', NS::SAM_PASSWORD] : ['lfox', NS::LENA_PASSWORD]
        sign_in(pc, *creds, foothold: OFFICE)
        assert_response :success, response.body
      end
      server_block = lambda do
        network_view(OFFICE)['footholds'].find { |f| f['id'] == OFFICE }['networks'].find { |b| b['id'] == 'server_net' }
      end
      # jsonb keeps sam_pc ahead of lena_pc (shorter key), so Sam's session has the lower seq
      assert_equal 'sam_pc', server_block.call['via']['hostId'], 'with both on, the lower seq names it'

      set_global('sam_pc_off', true)
      block = server_block.call
      assert_equal 'up', block['route'], 'the route runs through Lena'
      assert_equal 'lena_pc', block['via']['hostId'], 'the label names the host that answers'
    end

    # Review R2 nit 3: nothing prunes a session while its host is off (a reload, an unrelated
    # sign-out), since the prune reads structural_reach
    test 'a reload and an unrelated sign-out while a pivot host is off keep both sessions' do
      with_pivot_foothold
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      sign_in('sv_fs02', 'ishaw', NS::IAN_PASSWORD, foothold: OFFICE)
      sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body

      set_global(LENA_OFF, true)
      bootstrap_scenario
      assert_response :success
      post game_path('logout'), params: { pc_id: 'sam_pc' }, as: :json
      assert_response :success
      sessions = state['sessions']
      assert sessions.key?('lena_pc') && sessions.key?('sv_fs02'), 'both sessions are kept'

      set_global(LENA_OFF, false)
      body = container('sv_fs02', foothold: OFFICE)
      assert_response :success, body.inspect
    end

    # ---- review R3 m1: a PIN folder under a session at an off PC ----

    VAULT_PIN = '1357'.freeze

    # lena_pc carries a PIN-locked folder; Lena's office is open so her PC can be walked up to
    def with_lena_vault(lena_off: false)
      data = scenario_with_service_off(lena_off: lena_off)
      lena = data['rooms'].values.flat_map { |room| room['objects'] || [] }.find { |o| o['id'] == 'lena_pc' }
      lena['contents'] << { 'id' => 'lena_vault', 'type' => 'safe', 'name' => 'Vault', 'locked' => true, 'lockType' => 'pin',
                            'requires' => VAULT_PIN,
                            'contents' => [{ 'id' => 'vault_note', 'type' => 'text_file', 'name' => 'note.txt', 'takeable' => true,
                                             'text' => 'vault' }] }
      build_network_game({ 'unlockedRooms' => OPEN_ROOMS + ['finance_office'] }, data)
      take_drop_box
      plant('comms_port')
      assert_response :success, response.body
    end

    test 'a PIN under a keyboard session at an off PC answers 403 off, right or wrong, and works again' do
      with_lena_vault
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD)
      assert_response :success, response.body
      unlock_object('lena_vault', 'pin', '0000')
      assert_response :unprocessable_entity, 'on: a wrong PIN is a wrong PIN'

      set_global(LENA_OFF, true)
      [VAULT_PIN, '0000'].each do |attempt|
        body = unlock_object('lena_vault', 'pin', attempt)
        assert_response :forbidden
        assert_equal 'off', body['reason']
        assert_equal 'This PC is off.', body['message']
        refute body.to_json.include?(VAULT_PIN), 'the PIN is never told'
      end
      refute_includes Array(state['unlockedObjects']), 'lena_vault'

      set_global(LENA_OFF, false)
      body = unlock_object('lena_vault', 'pin', VAULT_PIN)
      assert_response :success, body.inspect
    end

    test 'a PIN under a remote session at an off host answers 403 not_responding' do
      with_lena_vault
      sign_in('lena_pc', 'lfox', NS::LENA_PASSWORD, foothold: OFFICE)
      assert_response :success, response.body
      set_global(LENA_OFF, true)
      body = unlock_object('lena_vault', 'pin', VAULT_PIN)
      assert_response :forbidden
      assert_equal 'not_responding', body['reason']
    end

    test 'a PIN under a PC the player holds no session on still answers as a wrong code' do
      with_lena_vault(lena_off: true)
      body = unlock_object('lena_vault', 'pin', VAULT_PIN)
      assert_response :unprocessable_entity
      assert_equal 'Invalid attempt', body['message']
      refute body.key?('reason'), 'nothing says the PC is off to a player who never saw the folder'
      unlock_object('no_such_vault', 'pin', VAULT_PIN)
      assert_equal 'Invalid attempt', response.parsed_body['message']
    end
  end
end
