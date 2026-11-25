require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # Ops S5bc unit 11 (ruling A, server): a governed USB port that names its PC with `portOf` lets
  # an admin session at that PC plant a storage stick the port's policy refuses, the same override
  # a keystroke device already gets (usb_install_overridden). Every case goes through the real
  # inventory route. Without such a session, or without a usable `portOf`, the refusal stands.
  class PortOverrideTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    OFFICE = KS::OFFICE

    STICK = { 'id' => 'kit_stick', 'type' => 'usb_stick', 'name' => 'USB stick', 'takeable' => true,
              'usbClass' => 'storage' }.freeze

    # Ports (none is a sign-in PC): dock_sam and dock_lena name their PC, dock_jake names jake_pc,
    # dock_missing names an id nobody has, dock_plain names a plain object, dock_free has no portOf.
    def port_scenario(admins: %w[sam lena jake])
      data = KS.scenario
      data['rooms'].each_value do |room|
        Array(room['npcs']).each do |npc|
          npc['creds']['admin'] = true if npc['creds'].is_a?(Hash) && admins.include?(npc['id'])
        end
      end
      data['policies']['storage_blocked'] = { 'accepts' => ['password'], 'remote' => 'allowed', 'usb' => 'blocked' }
      data['policies']['counted']['usb'] = 'blocked'
      data['logSources'] = { 'usb' => { 'title' => 'USB', 'events' => ['usb_install_overridden'] } }
      data['credentials']['lena_token'] = { 'kind' => 'token', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                                            'proof' => { 'foothold' => OFFICE }, 'label' => 'token', 'expiresMin' => 4 }
      desk = data['rooms']['desk_room']['objects']
      desk << { 'id' => 'plain_box', 'type' => 'table', 'name' => 'Plain box' }
      { 'dock_sam' => 'sam_pc', 'dock_lena' => 'lena_pc', 'dock_jake' => 'jake_pc', 'dock_missing' => 'no_such_pc',
        'dock_plain' => 'plain_box', 'dock_free' => nil }.each do |id, port|
        dock = { 'id' => id, 'type' => 'pc', 'name' => id, 'policy' => 'storage_blocked',
                 'requiresItem' => 'kit_stick', 'consumesItem' => true,
                 'triggerOnInteract' => [{ 'type' => 'remove_item', 'item' => 'kit_stick' }] }
        dock['portOf'] = port if port
        desk << dock
      end
      data
    end

    def build(scenario = port_scenario, stick = STICK)
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake], 'footholds' => KS.office_foothold,
                           'unlockedRooms' => NetworkRequests::OPEN_ROOMS + ['finance_office'],
                           'inventory' => [stick.dup] }, scenario)
    end

    def game
      @game.reload
    end

    def sign_in_sam
      assert sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)['success']
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

    # The real route: the tray's remove of the stick, used on a dock.
    def plant(dock)
      post game_path('inventory'), params: { action_type: 'remove', item: { id: 'kit_stick' }, used_on: dock }, as: :json
      response.parsed_body
    end

    def held_ids
      game.player_state['inventory'].map { |i| i['id'] }
    end

    def planted
      Array(game.player_state['plantedItems'])
    end

    def usb_rows
      game.log_rows_for('usb')
    end

    def assert_refused(dock, label = nil)
      body = plant(dock)
      assert_response :unprocessable_entity, label
      assert_equal 'usb_refused', body['reason'], label
      assert_includes held_ids, 'kit_stick', label
      assert_empty planted, label
      assert_empty usb_rows, label
    end

    def assert_planted(dock, pc, label = nil)
      body = plant(dock)
      assert_response :success, "#{label} #{body}"
      assert body['success'], label
      refute_includes held_ids, 'kit_stick', label
      assert_equal [{ 'item' => 'kit_stick', 'on' => dock }], planted, label
      assert_equal 1, usb_rows.size, label
      row = usb_rows.first
      assert_equal 'usb_install_overridden', row['event'], label
      assert_equal({ 'device' => 'storage' }, row['detail'], label)
      assert_equal({ 'kind' => 'pc', 'id' => pc }, row['where'], label)
      row
    end

    test 'port_pc reads a non-empty string and nothing else' do
      assert_equal 'sam_pc', CaptureModel.port_pc('portOf' => 'sam_pc')
      [nil, {}, { 'portOf' => '' }, { 'portOf' => '  ' }, { 'portOf' => 4 }, { 'portOf' => ['sam_pc'] }, 'sam_pc'].each do |obj|
        assert_nil CaptureModel.port_pc(obj), obj.inspect
      end
    end

    test 'a stick is refused at the port with no session, a user session, and a locked admin session' do
      build
      assert_refused 'dock_sam', 'no session'

      build(port_scenario(admins: %w[lena jake]))
      assert sign_in('sam_pc', 'sokafor', NS::SAM_PASSWORD)['success']
      assert_equal 'user', game.session_access('sam_pc')
      assert_refused 'dock_sam', 'user session'

      build
      sign_in_sam
      post game_path('lock_session'), params: { pc_id: 'sam_pc' }, as: :json
      assert_refused 'dock_sam', 'locked admin session'
    end

    test 'a keyboard admin at the named PC plants the stick and one row is written as the session account' do
      build
      sign_in_sam
      assert game.keyboard_admin?('sam_pc')
      row = assert_planted('dock_sam', 'sam_pc')
      assert_equal({ 'account' => 'sokafor' }, row['as'])
    end

    test 'the override covers a keystroke (hid class) device too, and is refused without the admin session' do
      hid = STICK.merge('usbClass' => 'hid', 'name' => 'Keystroke injector')
      build(port_scenario, hid)
      assert_refused 'dock_sam', 'no session'
      build(port_scenario, hid)
      sign_in_sam
      body = plant('dock_sam')
      assert body['success'], body.to_s
      assert_equal [{ 'item' => 'kit_stick', 'on' => 'dock_sam' }], planted
      assert_equal [{ 'device' => 'hid' }], usb_rows.map { |r| r['detail'] }
      assert_equal({ 'kind' => 'pc', 'id' => 'sam_pc' }, usb_rows.first['where'])
    end

    test 'a remote admin at the named PC plants the stick' do
      build
      sign_in_lena_remote
      assert_equal 'admin', game.session_access('lena_pc')
      refute game.keyboard_admin?('lena_pc')
      assert_planted 'dock_lena', 'lena_pc'
    end

    test 'a relay admin session at the named PC plants the stick (needs the relay level fix, unit 02)' do
      build
      set_session('sam_pc', { 'id' => 'sam', 'via' => 'credential', 'credential' => 'sam_assist', 'relay' => true })
      assert_equal 'admin', game.session_access('sam_pc')
      assert_planted 'dock_sam', 'sam_pc'
    end

    test 'a session at another PC, even an admin one, does not override' do
      build
      assert sign_in('jake_pc', 'jbrooks', KS::JAKE_PASSWORD)['success']
      assert game.session_admin?('jake_pc')
      assert_refused 'dock_sam', 'admin session at jake_pc, port of sam_pc'
    end

    test 'an admin session that has ended does not override' do
      build
      post game_path('login'), params: { pc_id: 'lena_pc', credential: 'lena_token', foothold: OFFICE }, as: :json
      assert response.parsed_body['success'], response.body
      assert_equal 'admin', game.session_access('lena_pc')
      travel_to(Time.current + 2.hours) do
        assert_nil game.session_access('lena_pc')
        assert_refused 'dock_lena', 'expired token session'
      end

      build
      sign_in_sam
      @game.reload
      @game.player_state['sessions'].delete('sam_pc')
      @game.save!
      assert_refused 'dock_sam', 'session gone'
    end

    test 'a portOf naming a missing id or a plain object never overrides, nor does a port with no portOf' do
      build
      sign_in_sam
      assert_refused 'dock_missing', 'missing id'
      assert_refused 'dock_plain', 'not a sign-in PC'
      assert_refused 'dock_free', 'no portOf'
      assert_refused 'dock_jake', 'port of a PC with no session'
    end

    test 'a plant the policy allows anyway writes no row' do
      data = port_scenario
      data['policies']['storage_blocked']['usb'] = 'allowed'
      build(data)
      sign_in_sam
      body = plant('dock_sam')
      assert body['success'], body.to_s
      assert_equal [{ 'item' => 'kit_stick', 'on' => 'dock_sam' }], planted
      assert_empty usb_rows
    end
  end
end
