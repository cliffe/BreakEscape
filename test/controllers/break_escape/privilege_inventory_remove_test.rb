require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Ops S5a unit 07 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md, "A lapsed override never costs the item"): the
  # inventory `remove` action with `used_on` asks the plant policy first. An override that has
  # lapsed (token expiry, an unplugged foothold, an outage) answers 422 usb_refused and removes
  # and records nothing. Sessions are made through the real routes.
  class PrivilegeInventoryRemoveTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    OFFICE = KS::OFFICE
    LINE = 'USB devices are disabled on this PC.'.freeze

    STICK = { 'id' => 'kit_stick', 'type' => 'usb_stick', 'name' => 'USB stick', 'takeable' => true,
              'usbClass' => 'storage' }.freeze

    # sam, lena and jake are administrators unless `admins` says otherwise. Every governed PC
    # blocks USB. sam_pc and lena_pc take a stick directly; sam_dock takes it through a confirm
    # whose grant needs a session at jake_pc.
    def usb_scenario(admins: %w[sam lena jake], tokens: false, usb: 'blocked')
      data = KS.scenario
      data['rooms'].each_value do |room|
        Array(room['npcs']).each do |npc|
          npc['creds']['admin'] = true if npc['creds'].is_a?(Hash) && admins.include?(npc['id'])
        end
      end
      if tokens
        data['credentials']['lena_token'] = { 'kind' => 'token', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                                              'proof' => { 'foothold' => OFFICE }, 'label' => 'HB-FIN-02 sign-in token',
                                              'expiresMin' => 4 }
      end
      data['policies']['usb_blocked'] = { 'accepts' => ['password'], 'remote' => 'allowed', 'usb' => usb }
      take = { 'requiresItem' => 'kit_stick', 'triggerOnInteract' => [{ 'type' => 'remove_item', 'item' => 'kit_stick' }] }
      desk = data['rooms']['desk_room']['objects']
      desk.find { |o| o['id'] == 'sam_pc' }.merge!({ 'policy' => 'usb_blocked' }.merge(take))
      desk.find { |o| o['id'] == 'jake_pc' }['policy'] = 'usb_blocked'
      data['policies']['counted']['usb'] = usb
      data['rooms']['finance_office']['objects'].find { |o| o['id'] == 'lena_pc' }.merge!(take)
      desk << { 'id' => 'sam_dock', 'type' => 'pc', 'name' => 'Stick dock', 'policy' => 'usb_blocked',
                'requiresItem' => 'kit_stick', 'consumesItem' => true,
                'triggerOnInteract' => [{ 'type' => 'confirm_action', 'text' => 'Plug it in?',
                                          'onConfirm' => [{ 'type' => 'remove_item', 'item' => 'kit_stick' },
                                                          { 'type' => 'grant_foothold', 'pc' => 'jake_pc', 'needsSession' => true,
                                                            'needsHeld' => 'kit_stick' }] }] }
      data
    end

    def build(scenario = usb_scenario)
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake], 'footholds' => KS.office_foothold,
                           'unlockedRooms' => NetworkRequests::OPEN_ROOMS + ['finance_office'],
                           'inventory' => [STICK.dup] }, scenario)
    end

    def state
      @game.reload.player_state
    end

    def held_ids
      state['inventory'].map { |i| i['id'] }
    end

    def planted
      Array(state['plantedItems'])
    end

    def remove(item_id, used_on = nil)
      params = { action_type: 'remove', item: { id: item_id } }
      params[:used_on] = used_on if used_on
      post game_path('inventory'), params: params, as: :json
      response.parsed_body
    end

    def assert_refused_and_kept(body)
      assert_response :unprocessable_entity, body.to_s
      assert_equal false, body['success']
      assert_equal 'usb_refused', body['reason']
      assert_equal LINE, body['error']
      assert_equal %w[error reason success], body.keys.sort, 'nothing else is sent'
      assert_includes held_ids, 'kit_stick'
      assert_empty planted
    end

    def sign_in_sam
      assert sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)['success']
    end

    def sign_in_jake
      assert sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)['success']
    end

    def set_global(name, value)
      @game.reload
      @game.player_state['globalVariables'] = (@game.player_state['globalVariables'] || {}).merge(name => value)
      @game.save!
    end

    def add_held(*items)
      @game.reload
      @game.player_state['inventory'] += items
      @game.save!
    end

    # ---- a lapsed override --------------------------------------------------------------------

    test 'a token admin session past expiry is refused and the stick stays' do
      build(usb_scenario(tokens: true))
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_token', foothold: OFFICE }, as: :json
      assert response.parsed_body['success'], response.body
      assert_equal 'admin', @game.reload.session_access('lena_pc')

      body = remove('kit_stick', 'lena_pc')
      assert_response :success, body.to_s
      refute_includes held_ids, 'kit_stick', 'live admin: the plant goes through'

      build(usb_scenario(tokens: true))
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_token', foothold: OFFICE }, as: :json
      assert response.parsed_body['success'], response.body
      travel_to(Time.current + 2.hours) do
        assert_refused_and_kept(remove('kit_stick', 'lena_pc'))
      end
    end

    test 'a foothold admin session after its foothold is unplugged is refused' do
      build
      add_held(KS.held('lena_rdp_file'))
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_rdp', foothold: OFFICE }, as: :json
      assert response.parsed_body['success'], response.body
      assert_equal 'admin', @game.reload.session_access('lena_pc')
      @game.reload.player_state['footholds'] = {}
      @game.save!

      assert_refused_and_kept(remove('kit_stick', 'lena_pc'))
    end

    test 'a PC switched off drops a keyboard admin session and refuses the stick, through a confirm object too' do
      build
      sign_in_jake
      assert @game.reload.keyboard_admin?('jake_pc')
      set_global(KS::JAKE_OFF_GLOBAL, true)
      assert_refused_and_kept(remove('kit_stick', 'sam_dock'))
    end

    # S5a R1 F12: the brief's third case, a remote admin session whose network an outage takes down.
    test 'an outage on the network of a remote admin session refuses the stick' do
      data = usb_scenario
      data['networks']['office_lan']['offWhen'] = 'lena_net_down'
      data['globalVariables'] = (data['globalVariables'] || {}).merge('lena_net_down' => false)
      build(data)
      add_held(KS.held('lena_rdp_file'))
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_rdp', foothold: OFFICE }, as: :json
      assert response.parsed_body['success'], response.body
      assert_equal 'admin', @game.reload.session_access('lena_pc')
      set_global('lena_net_down', true)
      assert_nil @game.reload.session_access('lena_pc'), 'the outage drops the route'
      assert_refused_and_kept(remove('kit_stick', 'lena_pc'))
    end

    # S5a R1 F5: an object in a room the player has not opened is not probed by a remove.
    test 'a remove aimed at an object in a locked room answers as before, whatever the policy' do
      build
      @game.reload.player_state['unlockedRooms'] -= ['finance_office']
      @game.save!
      body = remove('kit_stick', 'lena_pc')
      assert_response :success, body.to_s
      assert_equal({ 'success' => true }, body)
      assert_empty planted
    end

    # ---- a plant that is accepted -------------------------------------------------------------

    test 'a plant under keyboard admin is removed and recorded, a repeat changes nothing' do
      build
      sign_in_sam
      body = remove('kit_stick', 'sam_pc')
      assert_response :success, body.to_s
      assert body['success']
      refute_includes held_ids, 'kit_stick'
      assert_equal [{ 'item' => 'kit_stick', 'on' => 'sam_pc' }], planted

      again = remove('kit_stick', 'sam_pc')
      assert_response :success, again.to_s
      assert again['success']
      assert_equal 1, planted.size, 'the retry removes nothing and records nothing more'
    end

    test 'the same plant through a confirm object follows the grant PC' do
      build
      sign_in_jake
      body = remove('kit_stick', 'sam_dock')
      assert_response :success, body.to_s
      assert_equal [{ 'item' => 'kit_stick', 'on' => 'sam_dock' }], planted
    end

    test 'a plant the policy accepts is removed and recorded as today' do
      build(usb_scenario(admins: [], usb: 'allowed'))
      sign_in_sam
      assert_response :success
      body = remove('kit_stick', 'sam_pc')
      assert_response :success, body.to_s
      refute_includes held_ids, 'kit_stick'
      assert_equal 1, planted.size
    end

    # ---- the stricter check and the early returns that still answer as before ------------------

    test 'a user session refuses a blocked stick that used to be removed silently' do
      build(usb_scenario(admins: %w[lena jake]))
      sign_in_sam
      assert_refused_and_kept(remove('kit_stick', 'sam_pc'))
    end

    test 'no session at all refuses a blocked stick too' do
      build
      assert_refused_and_kept(remove('kit_stick', 'sam_pc'))
    end

    test 'no used_on, an item not held and an object that does not take the item answer as today' do
      build(usb_scenario(admins: []))
      body = remove('kit_stick')
      assert_response :success, body.to_s
      assert body['success']
      refute_includes held_ids, 'kit_stick'
      assert_empty planted

      build(usb_scenario(admins: []))
      body = remove('kit_nothing', 'sam_pc')
      assert_response :success, body.to_s
      assert_equal({ 'success' => true }, body)

      build(usb_scenario(admins: []))
      body = remove('kit_stick', 'jake_pc')
      assert_response :success, body.to_s
      refute_includes held_ids, 'kit_stick'
      assert_empty planted, 'jake_pc takes no stick: nothing recorded'
    end

    test 'a hideable item is never judged by the policy check' do
      data = usb_scenario(admins: [])
      data['rooms']['lobby']['objects'] << STICK.merge('hideable' => { 'spots' => [{ 'room' => 'desk_room' }] })
      build(data)
      body = remove('kit_stick', 'sam_pc')
      assert_response :success, body.to_s
      refute_includes held_ids, 'kit_stick'
    end
  end
end
