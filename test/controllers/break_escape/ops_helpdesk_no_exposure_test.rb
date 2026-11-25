require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops S8b unit 23 (feature A23, brief section 8): on the real test_ops_helpdesk scenario, at each step of a run no answer a
  # browser can fetch (the bootstrap, each room, a sync, a PC desktop, the network view, the keyring, the sign-in answers and
  # the helpdesk answers) holds a `recovery` key, a recovery map, a reset password not yet granted, `verify`, `minCorrect`,
  # `maxTries`, a desk's `questions` list, `accountResets` or `helpdeskTries`; a forged sync body carrying the two state keys
  # changes nothing; and the typed username is echoed in no answer.
  #
  # The facts that are public by design are excluded by name: Tess's and Wim's staff numbers sit in the staff file (a room
  # answer) and the line managers in the team post (the bootstrap), so those two values are not checked in those answers; every
  # other place must not carry them, and the answers of Ugo and Vera (written nowhere) must be in no answer at all.
  class OpsHelpdeskNoExposureTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_helpdesk/scenario.json.erb', __dir__)
    T0 = Time.zone.at(1_800_000_000)
    SAM = ['s.okoro', 'Okoro-Front-26'].freeze
    TESS = ['t.ama', 'Ambergate-Tess-27'].freeze
    WIM = ['w.duarte', 'Duarte-Signal-72'].freeze
    VERA = ['v.holt', 'Holtwell-Vera-35'].freeze
    TESS_NEW = 'Cobalt-Fenwick-58'.freeze
    UGO_NEW = 'Lantern-Quay-63'.freeze
    TESS_ANSWERS = { 'staff_no' => '40517', 'manager' => 'Nell Brook' }.freeze
    WIM_ANSWERS = { 'staff_no' => '40612', 'manager' => 'Pia Hart' }.freeze
    WRONG = { 'staff_no' => '00000', 'manager' => 'Nobody' }.freeze
    TYPED = 'zz.typed.stranger'.freeze
    SECRET_KEYS = %w[recovery resetPassword helpdesks verify minCorrect maxTries questions accountResets helpdeskTries creds
                     mfaPending mfaAccounts mfaPrompts].freeze
    HIDDEN_VALUES = ['40233', 'Ruth Mace', '40388'].freeze
    PUBLIC_VALUES = ['40517', '40612', 'Nell Brook', 'Pia Hart'].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    setup do
      travel_to T0
      build_network_game({ 'unlockedRooms' => %w[front_office service_desk records], 'currentRoom' => 'front_office',
                           'encounteredNPCs' => %w[ria omar sam wim tess ugo vera] }, scenario)
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

    # [label, body text, kind] for every answer a browser can fetch now. `kind` marks the two that carry public facts.
    def answers
      list = []
      bootstrap_scenario
      list << ['bootstrap', response.body, :public]
      Game.find(@game.id).scenario_data['rooms'].each_key do |room_id|
        get game_path("room/#{room_id}"), as: :json
        list << ["room #{room_id}", response.body, room_id == 'records' ? :public : nil]
      end
      put game_path('sync_state'), params: { playerState: {} }, as: :json
      list << ['sync', response.body, nil]
      %w[front_pc ops_pc records_pc vault_pc].each do |pc|
        get game_path("container/#{pc}"), as: :json
        list << ["container #{pc}", response.body, nil]
      end
      get game_path('network'), as: :json
      list << ['network', response.body, nil]
      get game_path('keyring'), as: :json
      list << ['keyring', response.body, :keyring]
      list
    end

    # `granted` names the reset passwords that have been granted (they may be in the keyring, and in `extra` grant answers only).
    def assert_clean(label, extra = [], granted: [])
      (answers + extra).each do |name, body, kind|
        keys = hash_keys(JSON.parse(body))
        SECRET_KEYS.each { |k| refute_includes keys, k, "#{label} #{name} carries the key #{k}" }
        [TESS_NEW, UGO_NEW].each do |pw|
          next if kind == :keyring && granted.include?(pw)
          next if kind == :grant && granted.include?(pw)

          refute_includes body, pw, "#{label} #{name} carries a reset password"
        end
        HIDDEN_VALUES.each { |v| refute_includes body, v, "#{label} #{name} carries a recovery answer written nowhere" }
        PUBLIC_VALUES.each { |v| refute_includes body, v, "#{label} #{name} carries a recovery answer" unless kind == :public }
        refute_includes body, TYPED, "#{label} #{name} echoes the typed username"
      end
    end

    def ask(username, what, answers, desk: 'it_desk', pc: nil, label: nil)
      params = { desk_id: desk, username: username, what: what, answers: answers }
      params[:pc_id] = pc if pc
      post game_path('helpdesk/request'), params: params, as: :json
      [label || "helpdesk #{what} #{username}", response.body, :grant]
    end

    def signed(pc, creds)
      post game_path('login'), params: { pc_id: pc, username: creds[0], password: creds[1] }, as: :json
      ["sign-in #{pc}", response.body, nil]
    end

    test 'no answer holds a recovery answer, a desk setting, a state key or a reset password at any step' do
      assert_clean('fresh')
      step = ask(TYPED, 'password', WRONG, label: 'unknown name')
      assert_clean('after a stranger is refused', [step])
      3.times { ask('u.reyes', 'password', WRONG) }
      step = ask('u.reyes', 'password', WRONG, label: 'blocked')
      assert_equal 'blocked', JSON.parse(step[1])['reason']
      assert_clean('after a stop', [step])
      3.times { post game_path('login'), params: { pc_id: 'records_pc', username: TESS[0], password: 'nope-nope' }, as: :json }
      step = ask(TESS[0], 'password', TESS_ANSWERS, label: 'password grant')
      assert_equal TESS_NEW, JSON.parse(step[1])['password']
      assert_clean('after the grant', [step], granted: [TESS_NEW])
      step = ask(TESS[0], 'password', TESS_ANSWERS, label: 'password grant again')
      assert_clean('after asking twice', [step], granted: [TESS_NEW])
      step = signed('records_pc', [TESS[0], TESS_NEW])
      assert_clean('signed in with the new password', [step], granted: [TESS_NEW])
      step = signed('front_pc', SAM)
      assert_clean('signed in at the front PC', [step], granted: [TESS_NEW])
      step = ask(WIM[0], 'mfa', WIM_ANSWERS, pc: 'front_pc', label: 'mfa grant')
      assert_clean('after a second-step reset', [step], granted: [TESS_NEW])
      step = signed('ops_pc', WIM)
      assert_equal true, JSON.parse(step[1])['ownPhone']
      assert_clean('pending own-phone push', [step], granted: [TESS_NEW])
      get game_path('mfa/phone'), params: { own: 1 }, as: :json
      assert_clean('own phone list', [['phone', response.body, nil]], granted: [TESS_NEW])
      post game_path('mfa/approve'), params: { pc_id: 'ops_pc', own: 1 }, as: :json
      assert_clean('own-phone approval', [['approve', response.body, nil]], granted: [TESS_NEW])
      step = ask('v.holt', 'mfa', {}, desk: 'id_desk', label: 'callback refusal')
      assert_clean('callback refused', [step], granted: [TESS_NEW])
    end

    test 'a typed stranger is echoed in no answer, and a refusal and a stranger are one answer' do
      refused = ask('u.reyes', 'password', WRONG)
      stranger = ask(TYPED, 'password', WRONG)
      assert_equal refused[1], stranger[1]
      assert_not_includes stranger[1], TYPED
      post game_path('helpdesk/request'), params: { desk_id: 'it_desk', username: TYPED * 3, what: 'mfa', answers: { 'staff_no' => TYPED } }, as: :json
      assert_not_includes response.body, TYPED
      assert_clean('after strangers')
    end

    test 'a forged sync body carrying accountResets and helpdeskTries changes nothing' do
      ask('u.reyes', 'password', WRONG)
      before = Game.find(@game.id).player_state.slice('accountResets', 'helpdeskTries', 'loginFailures', 'loginLockouts', 'sessions')
      forged_resets = { 'tess' => { 'password' => true, 'mfa' => true, 'typed' => true } }
      put game_path('sync_state'),
          params: { accountResets: forged_resets, helpdeskTries: {}, playerState: { accountResets: forged_resets, helpdeskTries: {} } }, as: :json
      after = Game.find(@game.id).player_state.slice('accountResets', 'helpdeskTries', 'loginFailures', 'loginLockouts', 'sessions')
      assert_equal before, after
      assert_nil after['accountResets']
      assert_equal 1, after['helpdeskTries']['it_desk|u.reyes']['n']
      get game_path('keyring'), as: :json
      assert_not_includes response.body, TESS_NEW
      # and nothing the forged body claimed grants anything: the sign-in with the old password still stands
      assert_equal true, JSON.parse(signed('records_pc', TESS)[1])['success']
    end
  end
end
