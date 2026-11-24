require 'test_helper'
require_relative '../../support/network_ops_scenario'
require_relative 'ops_privilege_scenario_test'

module BreakEscape
  # Ops S5a unit 15 (OPS_PRIVILEGE_ACCOUNTS_PLAN.md section 7, S5a part): at each step of a run on the
  # real test_ops_privilege scenario, no answer holds the key `admin` or `creds`, the administrator's
  # password, or the owner's profile items before an admin session at the owner's PC exists; and a
  # forged sync body carrying `sessions` or an `access` key changes no level.
  class OpsPrivilegeNoExposureTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_privilege/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    UMA = ['umaquay', 'Quayside-Uma-17'].freeze
    ADEL = ['adelwick', 'Lanternwick-Adel-52'].freeze
    ADMIN_PASSWORD = 'Lanternwick-Adel-52'.freeze
    OWNER_STRINGS = ['olu_notes', 'olu_folder', 'olu_budget', 'Olu notes.txt', 'Olu projects', 'Budget draft', "Olu's notes", 'the van, the toner'].freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def build
      build_network_game({ 'unlockedRooms' => %w[lobby bay store], 'encounteredNPCs' => %w[olu uma adel] }, scenario)
    end

    def hash_keys(node, out = [])
      case node
      when Hash then node.each { |k, v| out << k.to_s; hash_keys(v, out) }
      when Array then node.each { |v| hash_keys(v, out) }
      end
      out
    end

    # Every answer a browser can fetch: the bootstrap, each room, a sync, each desktop and the network view.
    def answers
      list = []
      bootstrap_scenario
      list << ['bootstrap', response.body]
      @game.reload.scenario_data['rooms'].each_key do |room_id|
        get game_path("room/#{room_id}"), as: :json
        list << ["room #{room_id}", response.body]
      end
      put game_path('sync_state'), params: { playerState: {} }, as: :json
      list << ['sync', response.body]
      %w[bay_pc store_pc].each do |pc|
        get game_path("container/#{pc}"), as: :json
        list << ["container #{pc}", response.body]
      end
      # the one route the admin profile branch widened: the owner's folder (refused unless an admin session at the bay PC)
      get game_path('container/olu_folder'), as: :json
      # a refusal repeats the id the request itself named; that is not the owner's item
      list << ['container olu_folder', response.body.sub('Container not unlocked: olu_folder', 'Container not unlocked')]
      get game_path('network'), params: { foothold: OFFICE }, as: :json
      list << ['network', response.body]
      list
    end

    def assert_world_clean(label, owner_items: false)
      answers.each do |name, body|
        keys = hash_keys(JSON.parse(body))
        refute_includes keys, 'admin', "#{label} #{name} carries the key admin"
        refute_includes keys, 'creds', "#{label} #{name} carries creds"
        # The password is the text of the authored note in the store room (the earned secret), and only there.
        refute_includes body, ADMIN_PASSWORD, "#{label} #{name} carries the administrator's password" unless name == 'room store'
        next if owner_items

        OWNER_STRINGS.each { |t| refute_includes body, t, "#{label} #{name} shows the owner's item #{t}" }
      end
    end

    def level(pc)
      Game.find(@game.id).session_access(pc)
    end

    test 'no answer holds the key admin, the administrator password or the owner profile items before an admin session at the bay PC' do
      build
      assert_world_clean('fresh')
      take_drop_box
      plant('office_port')
      assert_world_clean('with a foothold')
      assert sign_in('bay_pc', *UMA)['success']
      assert_world_clean('user session at the bay PC')
      post game_path('logout'), params: { pc_id: 'bay_pc' }, as: :json
      assert sign_in('store_pc', *ADEL, foothold: OFFICE)['success']
      assert_equal 'admin', level('store_pc')
      assert_world_clean('administrator at the records PC')
      post game_path('lock_session'), params: { pc_id: 'store_pc' }, as: :json
      assert_world_clean('locked administrator session')
    end

    test 'an administrator session at the bay PC that is then locked or signed out opens nothing of the owner' do
      build
      assert sign_in('bay_pc', *ADEL)['success']
      assert_equal 'admin', level('bay_pc')
      assert_world_clean('administrator at the bay PC', owner_items: true)
      post game_path('lock_session'), params: { pc_id: 'bay_pc' }, as: :json
      assert_nil level('bay_pc')
      assert_world_clean('locked administrator at the bay PC')
      assert sign_in('bay_pc', *ADEL)['success']
      post game_path('logout'), params: { pc_id: 'bay_pc' }, as: :json
      assert_world_clean('signed out administrator at the bay PC')
    end

    test 'the owner items appear only in an answer for an admin session at the bay PC, and then only the bay PC desktop' do
      build
      body = sign_in('bay_pc', *ADEL)
      assert_equal 'admin', body['access']
      shown = answers.select { |_, b| OWNER_STRINGS.any? { |t| b.include?(t) } }.map(&:first)
      assert_equal ['container bay_pc', 'container olu_folder'], shown
      assert_world_clean('administrator at the bay PC', owner_items: true)
    end

    test 'access appears only on an administrator session answer' do
      build
      body = sign_in('bay_pc', *UMA)
      refute body.key?('access'), body.to_s
      post game_path('logout'), params: { pc_id: 'bay_pc' }, as: :json
      body = sign_in('bay_pc', *ADEL)
      assert_equal 'admin', body['access']
      post game_path('lock_session'), params: { pc_id: 'bay_pc' }, as: :json
      get game_path('scenario'), as: :json
      refute_includes response.body, '"access":"admin"', 'a locked session sends no level'
    end

    test 'a forged sync body carrying sessions or an access key changes no level' do
      build
      assert sign_in('bay_pc', *UMA)['success']
      assert_equal 'user', level('bay_pc')
      forged = { 'bay_pc' => { 'id' => 'adel', 'via' => 'technique', 'access' => 'admin', 'foothold' => OFFICE },
                 'store_pc' => { 'id' => 'adel', 'via' => 'password', 'access' => 'admin' } }
      put game_path('sync_state'), params: { sessions: forged, access: 'admin', playerState: { sessions: forged, access: 'admin' } }, as: :json
      state = Game.find(@game.id).player_state
      assert_equal 'uma', state['sessions']['bay_pc']['id']
      assert_nil state['sessions']['store_pc']
      assert_equal 'user', level('bay_pc')
      assert_nil level('store_pc')
      get game_path('container/bay_pc'), as: :json
      OWNER_STRINGS.each { |t| refute_includes response.body, t }
    end

    test 'a stored access key on a password record is ignored' do
      build
      assert sign_in('bay_pc', *UMA)['success']
      @game.reload.player_state['sessions']['bay_pc']['access'] = 'admin'
      @game.save!
      assert_equal 'user', level('bay_pc')
      get game_path('container/bay_pc'), as: :json
      OWNER_STRINGS.each { |t| refute_includes response.body, t }
    end
  end

  # Ops S5bc unit 19 (S5BC brief 4.6, "never" list): the run of the S5b, ruling A and ruling B beats
  # on the real scenario; at the start and after every beat the bootstrap, every room answer, a sync
  # body, each desktop, GET /keyring and every collect answer so far carry none of the never-list and
  # no hash id or password before it is earned.
  class OpsPrivilegeCachedNoExposureTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsPrivilegeBeats

    NEVER_KEYS = %w[cachedAccounts cachedAt harvestedAccounts accountKind localTo accountOnly].freeze
    HASH_FOR_PAIR = { 'bay_pc|olu' => 'baypc_olu', 'bay_pc|uma' => 'baypc_uma',
                      'hot_desk|priya' => 'hotdesk_priya', 'hot_desk|sam' => 'hotdesk_sam',
                      'desk_a|deskadmin' => 'desk_a_deskadmin', 'desk_b|deskadmin' => 'desk_b_deskadmin',
                      'lab_pc|labadmin' => 'lab_labadmin' }.freeze
    PAIR_PATTERN = /\b(?:bay_pc|hot_desk|desk_a|desk_b|lab_pc)\|[a-z_]+/.freeze
    NEVER_PASSWORDS = %w[Harbourlight-Olu-08 Tidewater-Priya-31 Granary-Sam-47 Winter2026 q8-Fen-31-Lab].freeze
    # S5c: an account-only account's words (id and username are the same string) appear in no answer until a collect at one of its PCs
    ACCOUNT_ONLY_WORDS = { 'deskadmin' => ['deskadmin', 'Desk administrator'], 'labadmin' => ['labadmin', 'Lab administrator'] }.freeze
    ACCOUNT_ONLY_PCS = { 'deskadmin' => %w[desk_a|deskadmin desk_b|deskadmin], 'labadmin' => %w[lab_pc|labadmin] }.freeze
    PASSWORD_OWNER = { 'Harbourlight-Olu-08' => 'olu', 'Tidewater-Priya-31' => 'priya', 'Granary-Sam-47' => 'sam',
                       'Winter2026' => 'deskadmin', 'q8-Fen-31-Lab' => 'labadmin' }.freeze

    teardown { travel_back }

    def keys_of(node, out = [])
      case node
      when Hash then node.each { |k, v| out << k.to_s; keys_of(v, out) }
      when Array then node.each { |v| keys_of(v, out) }
      end
      out
    end

    def fetched
      list = []
      get b_path('scenario'), as: :json
      list << ['bootstrap', response.body, false]
      b_game.scenario_data['rooms'].each_key do |room|
        get b_path("room/#{room}"), as: :json
        list << ["room #{room}", response.body, false]
      end
      put b_path('sync_state'), params: { playerState: {} }, as: :json
      list << ['sync', response.body, false]
      %w[bay_pc hot_desk sam_pc store_pc].each do |pc|
        get b_path("container/#{pc}"), as: :json
        list << ["container #{pc}", response.body, false]
        get b_path("container/#{pc}"), params: { relay: 1 }, as: :json
        list << ["relay container #{pc}", response.body, false]
      end
      get b_path('keyring'), as: :json
      list << ['keyring', response.body, true]
      @answers.each { |name, entry| list << ["recorded #{name}", entry['body'].to_json, name.start_with?('keyring_')] }
      list
    end

    def checkpoint(label)
      earned = b_state['harvestedAccounts'].to_a.filter_map { |pair| HASH_FOR_PAIR[pair] }
      cracked = b_state['crackedAccounts'].to_a
      fetched.each do |name, body, keyring|
        where = "#{label}: #{name}"
        keys = keys_of(JSON.parse(body))
        NEVER_KEYS.each { |k| refute_includes keys, k, "#{where} carries the key #{k}" }
        refute_match PAIR_PATTERN, body, "#{where} carries a pair string"
        (HASH_FOR_PAIR.values - earned).each { |id| refute_includes body, id, "#{where} names the hash #{id} before its collect" }
        refute_includes body, 'harvested', "#{where} carries the proof word harvested" unless name.start_with?('recorded collect_')
        NEVER_PASSWORDS.each do |pw|
          account = PASSWORD_OWNER[pw]
          next if keyring && cracked.include?(account) && !name.start_with?('recorded collect_')

          refute_includes body, pw, "#{where} carries the password of #{account} before it is cracked" unless name.start_with?('recorded signin_')
        end
        (PASSWORDS + S5C_PASSWORDS).each { |pw| refute_includes body, pw, "#{where} carries a password" } if name.start_with?('recorded collect_')
        ACCOUNT_ONLY_WORDS.each do |account, words|
          next if (ACCOUNT_ONLY_PCS[account] & b_state['harvestedAccounts'].to_a).any?

          words.each { |w| refute_includes body, w, "#{where} names the account-only account #{account} before its collect" }
        end
      end
    end

    test 'the run in order leaks nothing from the never list, at the start and after every beat' do
      play_all_beats
      refute_empty @answers.keys.grep(/\Acollect_/)
    end
  end
end
