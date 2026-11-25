require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops S8a unit 22 (feature A22, brief section 3): on the real test_ops_mfa scenario, at each step
  # of a run no answer a browser can fetch (the bootstrap, each room, a sync, each PC desktop, the
  # cabinet, the network view, the sign-in answers) holds a code, the three number choices, the
  # keys approvesPrompts, promptPatience, awareness, creds, mfaPending, mfaAccounts or mfaPrompts,
  # or an owner's password; and a forged sync body carrying those keys changes nothing. The codes
  # reach the browser only from GET mfa/device while the device is held, and the choices only from
  # GET mfa/phone while the phone is held.
  class OpsMfaNoExposureTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_mfa/scenario.json.erb', __dir__)
    T0 = Time.zone.at(1_800_000_000)
    OFFICE = 'jack_office_port'.freeze
    HANA = ['hquill', 'Quillmere-Hana-31'].freeze
    CAL = ['cmoss', 'Mossbank-Cal-12'].freeze
    NIA = ['nfaraday', 'Faradale-Nia-58'].freeze
    SECRET_KEYS = %w[approvesPrompts promptPatience awareness creds mfaPending mfaAccounts mfaPrompts numbers choices].freeze
    PASSWORDS = ['Quillmere-Hana-31', 'Brandwick-Ines-44', 'Tidewater-Sync-90', 'Mossbank-Cal-12', 'Kaporwell-Dev-77',
                 'Faradale-Nia-58'].freeze
    DEVICES = %w[hana_device ines_device].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build(player_state = {})
      build_network_game({ 'unlockedRooms' => %w[lobby floor store], 'encounteredNPCs' => %w[hana ines svc_sync cal dev nia] }
                           .merge(player_state), scenario)
    end

    setup do
      travel_to T0
      build
    end

    teardown do
      travel_back
      OpsLog::Current.reset
    end

    def hash_keys(node, out = [])
      case node
      when Hash then node.each { |k, v| out << k.to_s; hash_keys(v, out) }
      when Array then node.each { |v| hash_keys(v, out) }
      end
      out
    end

    def codes
      game = Game.find(@game.id)
      base = Time.current.to_i / MfaModel::STEP_SECONDS
      DEVICES.flat_map do |id|
        (base - 3..base + 1).map { |w| MfaModel.code(Rails.application.key_generator.generate_key('break_escape/mfa'), game.id, id, w) }
      end
    end

    def answers
      list = []
      bootstrap_scenario
      list << ['bootstrap', response.body]
      Game.find(@game.id).scenario_data['rooms'].each_key do |room_id|
        get game_path("room/#{room_id}"), as: :json
        list << ["room #{room_id}", response.body]
      end
      put game_path('sync_state'), params: { playerState: {} }, as: :json
      list << ['sync', response.body]
      get game_path('container/lobby_cabinet'), as: :json
      list << ['cabinet', response.body]
      get game_path('network'), params: { foothold: OFFICE }, as: :json
      list << ['network', response.body]
      get game_path('keyring'), as: :json
      list << ['keyring', response.body]
      list
    end

    def assert_clean(label, extra = [])
      (answers + extra).each do |name, body|
        keys = hash_keys(JSON.parse(body))
        SECRET_KEYS.each { |k| refute_includes keys, k, "#{label} #{name} carries the key #{k}" }
        PASSWORDS.each do |pw|
          # an authored note in a room is the earned secret, and only there
          refute_includes body, pw, "#{label} #{name} carries a password" unless name.start_with?('room ')
        end
        codes.each { |c| refute_includes body, "\"#{c}\"", "#{label} #{name} carries a code" }
      end
    end

    def signed(label, user, pc, foothold: nil)
      params = { pc_id: pc, username: user[0], password: user[1] }
      params[:foothold] = foothold if foothold
      post game_path('login'), params: params, as: :json
      [label, response.body]
    end

    test 'no answer holds a code, the number choices, a habit, a creds key or a pending key at any step' do
      assert_clean('fresh')
      take_drop_box
      plant('office_port')
      assert_clean('with a foothold')
      step = signed('first step at a code PC', HANA, 'code_pc1', foothold: OFFICE)
      assert_clean('pending code step', [step])
      post game_path('mfa/verify'), params: { pc_id: 'code_pc1', code: '000000' }, as: :json
      assert_clean('after a wrong code', [['verify', response.body]])
      step = signed('first step at a push PC', CAL, 'push_pc')
      assert_clean('pending push step', [step])
      post game_path('mfa/prompt'), params: { pc_id: 'push_pc' }, as: :json
      assert_clean('after a prompt', [['prompt', response.body]])
      step = signed('first step at a number-matching PC', NIA, 'match_pc')
      # the one right number is sent on purpose (the sign-in screen shows it), the choices never
      assert_kind_of Integer, JSON.parse(step[1])['number']
      assert_clean('pending number match', [step])
      get game_path('mfa/phone'), params: { npc_id: 'nia' }, as: :json
      assert_response :forbidden
      assert_clean('phone refused', [['phone', response.body]])
      get game_path('mfa/device'), params: { item_id: 'hana_device' }, as: :json
      assert_response :forbidden
      assert_not_includes response.body, codes.first
    end

    test 'the code reaches the browser only from the held device, the choices only from the held phone' do
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'code_device', id: 'ines_device', name: 'Code device' } }, as: :json
      assert_response :success, response.body
      get game_path('mfa/device'), params: { item_id: 'ines_device' }, as: :json
      assert_response :success
      assert_includes codes, response.parsed_body['code']
      assert_clean('device held')
      post game_path('update_room'), params: { roomId: 'store', actionType: 'update_npc_state',
                                               data: { npcId: 'nia', stateChanges: { isKO: true, currentHP: 0 } } }, as: :json
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'phone_friendface', id: 'nia_phone', name: "Nia's phone" },
                                             source_npc_id: 'nia' }, as: :json
      assert_response :success, response.body
      signed('number', NIA, 'match_pc')
      get game_path('mfa/phone'), params: { npc_id: 'nia' }, as: :json
      assert_response :success
      assert_equal 3, response.parsed_body['requests'].first['numbers'].size
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_clean('phone held')
    end

    test 'a forged sync body carrying the server-owned keys changes nothing' do
      signed('step', HANA, 'code_pc1')
      before = Game.find(@game.id).player_state.slice('mfaPending', 'mfaAccounts', 'mfaPrompts', 'sessions')
      forged = { 'code_pc1' => { 'id' => 'hana', 'via' => 'password' } }
      put game_path('sync_state'),
          params: { sessions: forged, mfaPending: {}, mfaAccounts: { 'hana' => { 'used' => 0 } }, mfaPrompts: { 'cal' => 99 },
                    playerState: { sessions: forged, mfaPending: {}, mfaAccounts: {}, mfaPrompts: { 'cal' => 99 } } }, as: :json
      after = Game.find(@game.id).player_state.slice('mfaPending', 'mfaAccounts', 'mfaPrompts', 'sessions')
      assert_equal before, after
      assert_nil after['sessions']['code_pc1']
    end
  end
end
