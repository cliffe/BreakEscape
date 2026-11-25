require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Ops S5a unit 06 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md, the USB override): an unlocked admin session
  # on the PC that judges a plant lets a device through that the PC's USB policy would refuse. The
  # implant path and the plant proof take it; a session-shaped device still takes only the
  # keyboard, and a live non-keyboard session now answers needs_console. Sessions are made through
  # the real sign-in routes; the records no route writes in the wanted shape say so.
  class AdminUsbTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    OFFICE = KS::OFFICE

    BADUSB = { 'id' => 'kit_badusb', 'type' => 'usb_stick', 'name' => 'Keystroke device', 'takeable' => true,
               'usbClass' => 'hid' }.freeze
    STICK = { 'id' => 'kit_stick', 'type' => 'usb_stick', 'name' => 'USB stick', 'takeable' => true,
              'usbClass' => 'storage' }.freeze

    # sam, lena and jake are administrators unless `admins` says otherwise. Every PC below blocks
    # USB. sam_pc and lena_pc take a stick directly (a remove_item); sam_socket is the ungoverned
    # BadUSB socket for sam_pc; sam_dock is a governed stick dock whose grant (inside a confirm)
    # needs a session at jake_pc.
    def usb_scenario(admins: %w[sam lena jake])
      data = KS.scenario
      data['rooms'].each_value do |room|
        Array(room['npcs']).each do |npc|
          npc['creds']['admin'] = true if npc['creds'].is_a?(Hash) && admins.include?(npc['id'])
        end
      end
      data['policies']['usb_blocked'] = { 'accepts' => ['password'], 'remote' => 'allowed', 'usb' => 'blocked' }
      data['policies']['counted']['usb'] = 'blocked'
      data['logSources'] = { 'usb' => { 'title' => 'USB', 'events' => ['usb_install_overridden'] } }
      take = { 'requiresItem' => 'kit_stick', 'triggerOnInteract' => [{ 'type' => 'remove_item', 'item' => 'kit_stick' }] }
      desk = data['rooms']['desk_room']['objects']
      desk.find { |o| o['id'] == 'sam_pc' }.merge!({ 'policy' => 'usb_blocked' }.merge(take))
      desk.find { |o| o['id'] == 'jake_pc' }['policy'] = 'usb_blocked'
      data['rooms']['finance_office']['objects'].find { |o| o['id'] == 'lena_pc' }.merge!(take)
      desk << { 'id' => 'sam_socket', 'type' => 'pc', 'name' => 'Desk USB socket',
                'triggerOnInteract' => [{ 'type' => 'grant_foothold', 'pc' => 'sam_pc', 'needsSession' => true,
                                          'needsHeld' => 'kit_badusb', 'name' => 'BadUSB: Sam desk' }] }
      desk << { 'id' => 'sam_dock', 'type' => 'pc', 'name' => 'Stick dock', 'policy' => 'usb_blocked',
                'requiresItem' => 'kit_stick', 'consumesItem' => true,
                'triggerOnInteract' => [{ 'type' => 'confirm_action', 'text' => 'Plug it in?',
                                          'onConfirm' => [{ 'type' => 'grant_foothold', 'pc' => 'jake_pc', 'needsSession' => true,
                                                            'needsHeld' => 'kit_stick' }] }] }
      %w[jake lena].each do |who|
        desk << { 'id' => "#{who}_socket", 'type' => 'pc', 'name' => "#{who} USB socket",
                  'triggerOnInteract' => [{ 'type' => 'grant_foothold', 'pc' => "#{who}_pc", 'needsSession' => true,
                                            'needsHeld' => 'kit_badusb' }] }
      end
      data['credentials']['lena_token'] = { 'kind' => 'token', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                                            'proof' => { 'foothold' => OFFICE }, 'label' => 'token', 'expiresMin' => 4 }
      data
    end

    def build(scenario = usb_scenario)
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake], 'footholds' => KS.office_foothold,
                           'unlockedRooms' => NetworkRequests::OPEN_ROOMS + ['finance_office'],
                           'inventory' => [BADUSB.dup, STICK.dup] }, scenario)
    end

    def state
      @game.reload.player_state
    end

    def game
      @game.reload
    end

    def sign_in_sam
      assert sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)['success']
    end

    def sign_in_jake
      assert sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)['success']
    end

    def sign_in_lena_remote
      @game.reload
      @game.player_state['inventory'] += [KS.held('lena_rdp_file')]
      @game.save!
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_rdp', foothold: OFFICE }, as: :json
      assert response.parsed_body['success'], response.body
    end

    def set_session(pc_id, record)
      @game.reload
      @game.player_state['sessions'] = (@game.player_state['sessions'] || {}).merge(pc_id => record)
      @game.save!
    end

    def implant(pc_id)
      post game_path('network/implant'), params: { pc_id: pc_id, shape: 'session' }, as: :json
      response.parsed_body
    end

    def held_ids
      state['inventory'].map { |i| i['id'] }
    end

    def usb_rows
      game.log_rows_for('usb')
    end

    # ---- the implant path -------------------------------------------------------------------

    test 'the implant is allowed under a keyboard admin session and refused under a user session' do
      build
      sign_in_sam
      body = implant('sam_pc')
      assert_response :success, body.to_s
      assert body['success']
      refute_includes held_ids, 'kit_badusb'
      assert_equal 1, usb_rows.size
      assert_equal 'usb_install_overridden', usb_rows.first['event']
      assert_equal({ 'account' => 'sokafor' }, usb_rows.first['as'])
      assert_equal({ 'kind' => 'pc', 'id' => 'sam_pc' }, usb_rows.first['where'])
      assert_equal({ 'device' => 'hid' }, usb_rows.first['detail'])

      build(usb_scenario(admins: %w[lena jake]))
      sign_in_sam
      body = implant('sam_pc')
      assert_response :unprocessable_entity
      assert_equal 'usb_refused', body['reason']
      assert_includes held_ids, 'kit_badusb'
      assert_empty usb_rows, 'a refusal writes no row'
    end

    test 'a locked admin session takes no override and a PC whose service is off none' do
      build
      sign_in_sam
      post game_path('lock_session'), params: { pc_id: 'sam_pc' }, as: :json
      body = implant('sam_pc')
      assert_response :unprocessable_entity
      assert_equal 'usb_refused', body['reason']
      assert_empty usb_rows

      build
      sign_in_jake
      @game.reload
      @game.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge(KS::JAKE_OFF_GLOBAL => true)
      @game.save!
      refute game.keyboard_admin?('jake_pc')
      refute game.send(:plant_admin?, game.find_login_pc('jake_pc')[:object])
    end

    test 'a locked admin session still takes an implant the policy allows, with no row' do
      data = usb_scenario
      data['policies']['usb_blocked']['usb'] = 'allowed'
      build(data)
      sign_in_sam
      post game_path('lock_session'), params: { pc_id: 'sam_pc' }, as: :json
      body = implant('sam_pc')
      assert_response :success, body.to_s
      assert_empty usb_rows, 'a plant the policy allows anyway writes no override row'
    end

    test 'needs_console for a foothold and a technique session, admin or not; the device stays held' do
      records = {
        'foothold admin' => { 'id' => 'sam', 'via' => 'password', 'foothold' => OFFICE },
        'technique admin' => { 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'admin' },
        'technique user' => { 'id' => 'sam', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'user' }
      }
      records.each do |label, record|
        build
        set_session('sam_pc', record)
        body = implant('sam_pc')

        assert_response :unprocessable_entity, label
        assert_equal 'needs_console', body['reason'], label
        assert_equal 'Nobody is signed in at this keyboard.', body['error'], label
        assert_includes held_ids, 'kit_badusb', label
        assert_empty usb_rows, label
      end
    end

    test 'a live relay session and a live from session answer needs_console' do
      build
      set_session('jake_pc', { 'id' => 'jake', 'via' => 'credential', 'credential' => 'jake_assist', 'relay' => true })
      body = implant('jake_pc')
      assert_response :unprocessable_entity
      assert_equal 'needs_console', body['reason']
      assert_includes held_ids, 'kit_badusb'

      build
      sign_in_sam
      set_session('jake_pc', { 'id' => 'jake', 'via' => 'password', 'from' => 'sam_pc' })
      assert_equal 'admin', game.session_access('jake_pc')
      body = implant('jake_pc')
      assert_response :unprocessable_entity
      assert_equal 'needs_console', body['reason']
      assert_includes held_ids, 'kit_badusb'
      assert_empty usb_rows
    end

    # S5a R1 F10 and open item 3: needs_console asks for a LIVE remote session (session_access not
    # nil); a locked or expired one keeps the quiet not_ready, so this term is pinned.
    test 'a locked or expired remote session keeps not_ready' do
      build
      set_session('sam_pc', { 'id' => 'sam', 'via' => 'password', 'foothold' => OFFICE, 'locked' => true })
      assert_equal 'not_ready', implant('sam_pc')['reason']
      assert_includes held_ids, 'kit_badusb'

      build
      sign_in_jake
      set_session('lena_pc', { 'id' => 'lena', 'via' => 'password', 'from' => 'jake_pc', 'locked' => true })
      assert_equal 'not_ready', implant('lena_pc')['reason']

      build
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_token', foothold: OFFICE }, as: :json
      assert response.parsed_body['success'], response.body
      assert_equal 'admin', game.session_access('lena_pc')
      travel_to(Time.current + 2.hours) do
        assert_nil game.session_access('lena_pc')
        assert_equal 'not_ready', implant('lena_pc')['reason']
      end
      assert_includes held_ids, 'kit_badusb'
      assert_empty usb_rows
    end

    test 'a PC whose service is off takes neither the implant nor the plant under admin' do
      data = usb_scenario
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'jake_pc' }
        .merge!('requiresItem' => 'kit_stick', 'triggerOnInteract' => [{ 'type' => 'remove_item', 'item' => 'kit_stick' }])
      build(data)
      sign_in_jake
      assert game.keyboard_admin?('jake_pc')
      @game.reload
      @game.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge(KS::JAKE_OFF_GLOBAL => true)
      @game.save!
      body = implant('jake_pc')
      assert_response :unprocessable_entity, body.to_s
      assert_includes held_ids, 'kit_badusb'
      refute game.record_planted_item!('kit_stick', 'jake_pc')
      assert_includes held_ids, 'kit_stick'
      assert_empty Array(state['plantedItems'])
      assert_empty usb_rows
    end

    test 'not_ready is kept for no session and for no device' do
      build
      body = implant('sam_pc')
      assert_equal 'not_ready', body['reason']
      assert_includes held_ids, 'kit_badusb'

      build
      sign_in_sam
      @game.reload
      @game.player_state['inventory'] = []
      @game.save!
      assert_equal 'not_ready', implant('sam_pc')['reason']
    end

    # ---- the plant proof ----------------------------------------------------------------------

    test 'the plant proof is allowed under a keyboard admin session, refused under a user session' do
      build
      sign_in_sam
      assert game.record_planted_item!('kit_stick', 'sam_pc')
      assert_equal [{ 'item' => 'kit_stick', 'on' => 'sam_pc' }], state['plantedItems']
      assert_equal 1, usb_rows.size
      assert_equal({ 'device' => 'storage' }, usb_rows.first['detail'])

      build(usb_scenario(admins: %w[lena jake]))
      sign_in_sam
      refute game.record_planted_item!('kit_stick', 'sam_pc')
      assert_empty Array(state['plantedItems'])
      assert_empty usb_rows
    end

    test 'the plant proof is allowed under a remote admin session (foothold) and a from session' do
      build
      sign_in_lena_remote
      assert_equal 'admin', game.session_access('lena_pc')
      assert game.record_planted_item!('kit_stick', 'lena_pc')
      assert_equal 1, usb_rows.size

      build
      set_session('lena_pc', { 'id' => 'lena', 'via' => 'password', 'from' => 'jake_pc' })
      @game.reload
      @game.player_state['sessions']['jake_pc'] = { 'id' => 'jake', 'via' => 'password' }
      @game.save!
      # the `from` session's source (jake_pc) is live, so the remote admin session overrides
      assert_equal 'admin', game.session_access('lena_pc')
      assert game.record_planted_item!('kit_stick', 'lena_pc')
    end

    # S5 ruling B (unit 02): a relay has the rights of the account relayed. A relayed administrator
    # overrides the policy (with the row); a relayed user-level account does not (a relay never steps up).
    test 'the plant proof under a relay session follows the relayed account, and is refused under a locked admin session' do
      build
      set_session('sam_pc', { 'id' => 'sam', 'via' => 'credential', 'relay' => true })
      assert_equal 'admin', game.session_access('sam_pc')
      assert game.record_planted_item!('kit_stick', 'sam_pc')
      assert_equal 1, usb_rows.size

      build(usb_scenario(admins: %w[lena jake]))
      set_session('sam_pc', { 'id' => 'sam', 'via' => 'credential', 'relay' => true })
      assert_equal 'user', game.session_access('sam_pc')
      refute game.record_planted_item!('kit_stick', 'sam_pc')
      assert_empty usb_rows

      build
      sign_in_sam
      post game_path('lock_session'), params: { pc_id: 'sam_pc' }, as: :json
      refute game.record_planted_item!('kit_stick', 'sam_pc')
      assert_empty usb_rows
    end

    test 'a plant the policy allows anyway writes no override row' do
      data = usb_scenario
      data['policies']['usb_blocked']['usb'] = 'allowed'
      build(data)
      sign_in_sam
      assert game.record_planted_item!('kit_stick', 'sam_pc')
      assert_empty usb_rows
    end

    test 'technique admin overrides and technique user does not' do
      build
      set_session('lena_pc', { 'id' => 'lena', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'admin' })
      assert game.record_planted_item!('kit_stick', 'lena_pc')

      build
      set_session('lena_pc', { 'id' => 'lena', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'user' })
      refute game.record_planted_item!('kit_stick', 'lena_pc')
    end

    test 'a needsSession object is judged at the grant PC: refused under remote admin, allowed under keyboard admin' do
      build
      # remote admin at jake_pc (a technique admin record through the foothold)
      set_session('jake_pc', { 'id' => 'jake', 'via' => 'technique', 'foothold' => OFFICE, 'access' => 'admin' })
      refute game.record_planted_item!('kit_stick', 'sam_dock')
      refute game.plant_policy_refusal('kit_stick', 'sam_dock').nil?
      # keyboard admin at sam_pc is the wrong PC: the grant names jake_pc
      sign_in_sam
      refute game.record_planted_item!('kit_stick', 'sam_dock')

      build
      sign_in_jake
      assert game.keyboard_admin?('jake_pc')
      assert_nil game.plant_policy_refusal('kit_stick', 'sam_dock')
      assert game.record_planted_item!('kit_stick', 'sam_dock')
      assert_equal({ 'kind' => 'pc', 'id' => 'jake_pc' }, usb_rows.first['where'])
    end

    # ---- plant_policy_refusal --------------------------------------------------------------

    test 'plant_policy_refusal answers the policy line under user, nil under admin and nil at each early return' do
      build(usb_scenario(admins: %w[lena jake]))
      sign_in_sam
      assert_equal 'USB devices are disabled on this PC.', game.plant_policy_refusal('kit_stick', 'sam_pc')
      assert_empty Array(state['plantedItems']), 'it writes nothing'
      assert_empty usb_rows

      assert_nil game.plant_policy_refusal('', 'sam_pc')
      assert_nil game.plant_policy_refusal('kit_stick', '')
      assert_nil game.plant_policy_refusal('kit_nothing', 'sam_pc'), 'an item not held'
      assert_nil game.plant_policy_refusal('kit_stick', 'no_such_object'), 'no target object'
      assert_nil game.plant_policy_refusal('kit_stick', 'jake_pc'), 'an object that does not take the item'

      @game.reload
      @game.player_state['inventory'] = [STICK.merge('clientAdded' => true)]
      @game.save!
      assert_nil game.plant_policy_refusal('kit_stick', 'sam_pc'), 'a client-forged item'

      build
      sign_in_sam
      assert_nil game.plant_policy_refusal('kit_stick', 'sam_pc'), 'an admin session overrides'
    end

    test 'plant_policy_refusal is nil for a hideable item' do
      data = usb_scenario
      data['rooms']['lobby']['objects'] << STICK.merge('hideable' => { 'spots' => [{ 'room' => 'desk_room' }] })
      build(data)
      sign_in_sam
      assert HidingSpots.item_defs(game.scenario_data).key?('kit_stick')
      assert_nil game.plant_policy_refusal('kit_stick', 'sam_pc')
    end

    # ---- the NPC side ----------------------------------------------------------------------

    test 'the NPC-side policy reader stays on the default while the player holds admin' do
      build
      sign_in_sam
      assert game.keyboard_admin?('sam_pc')
      obj = game.find_login_pc('sam_pc')[:object]
      assert AccessWork.plant_refused?(game.scenario_data, obj, STICK), 'the default call still refuses'
      assert AccessWork.plant_refused?(game.scenario_data, obj, STICK, admin: 'yes'), 'only exactly true overrides'
      refute AccessWork.plant_refused?(game.scenario_data, obj, STICK, admin: true)
      assert_equal 'blocked', AccessWork.usb_policy_for(game.scenario_data, obj)
    end
  end
end
