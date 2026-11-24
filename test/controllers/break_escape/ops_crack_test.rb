require 'test_helper'

module BreakEscape
  # S7 unit 12: POST /games/:id/crack and the places earned facts are stamped (a take, an NPC give,
  # a give_item reward, a grant_fact reward). The route's refusals come in the brief's order, every
  # answer is no-store, and no answer carries the password before the grant or any of the four
  # server-written state keys (S7_BUILD_BRIEF.md, 4).
  class OpsCrackTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    PASSWORD = 'Gus-Rex-1980'.freeze
    COMMON_PASSWORD = 'Cal-Pass-77'.freeze
    FLAG_ONE = 'flag{crack_one}'.freeze
    FLAG_TWO = 'flag{crack_two}'.freeze
    FLAG_THREE = 'flag{crack_three}'.freeze
    STATE_KEYS = %w[earnedFacts crackRuns crackStarted crackedAccounts].freeze

    # A test switch for a transient hosting error on a flag submission (no mocking library here).
    module TransientFlagError
      class << self
        attr_accessor :on
      end

      def submit_flag(flag_key)
        return { success: false, retryable: true, message: 'transient' } if TransientFlagError.on

        super
      end
    end
    Game.prepend(TransientFlagError)

    teardown { TransientFlagError.on = false }

    def note(id, facts = nil)
      item = { 'type' => 'notes', 'id' => id, 'name' => id.tr('_', ' '), 'takeable' => true }
      item['revealsFacts'] = facts if facts
      item
    end

    def file(name)
      { 'id' => "#{name}_file", 'type' => 'text_file', 'name' => "#{name} file", 'credential' => "#{name}_hash", 'takeable' => true }
    end

    def scenario
      {
        'startRoom' => 'office',
        'social' => { 'intelFacts' => %w[pet year town club lake].to_h { |f| [f, { 'label' => f.capitalize, 'text' => "The #{f} text." }] } },
        'flags' => { 'target_vm' => { 'flag_1' => FLAG_ONE, 'flag_2' => FLAG_TWO, 'flag_3' => FLAG_THREE } },
        'timers' => [{ 'id' => 'grant_timer', 'startOnGlobal' => 'go', 'delayMs' => 300,
                       'actions' => [{ 'type' => 'give_item', 'item' => note('granted_note', %w[pet]) }] }],
        'rooms' => {
          'office' => {
            'type' => 'room_office', 'connections' => {},
            'npcs' => [
              { 'id' => 'gus', 'displayName' => 'Gus', 'creds' => { 'username' => 'ugus', 'password' => PASSWORD },
                'itemsHeld' => [note('year_note', %w[year]), note('plain_note')] },
              { 'id' => 'cal', 'displayName' => 'Cal', 'creds' => { 'username' => 'ucal', 'password' => COMMON_PASSWORD } },
              { 'id' => 'sam', 'displayName' => 'Sam', 'creds' => { 'username' => 'usam', 'password' => 'Sam-Strong-1' } }
            ],
            'objects' => [
              file('gus'), file('cal'), file('sam'),
              note('pet_note', %w[pet]),
              { 'type' => 'safe', 'id' => 'vault', 'name' => 'Vault', 'locked' => true, 'lockType' => 'key', 'requires' => 'nokey',
                'contents' => [note('vault_note', %w[club])] },
              { 'type' => 'flag-station', 'id' => 'station', 'name' => 'Station', 'acceptsVms' => ['target_vm'],
                'flags' => ['target_vm:flag_1', 'target_vm:flag_2'],
                'itemsHeld' => [note('town_note', %w[town])],
                'flagRewards' => [
                  { 'type' => 'grant_fact', 'fact' => 'club', 'label' => 'A club' },
                  { 'type' => 'give_item', 'item_type' => 'notes', 'item_name' => 'town note' }
                ] },
              { 'type' => 'safe', 'id' => 'flag_safe', 'name' => 'Flag Safe', 'locked' => true,
                'lockType' => 'flag', 'requires' => 'target_vm:flag_3',
                'flagRewards' => [{ 'type' => 'grant_fact', 'fact' => 'lake' }] }
            ]
          }
        },
        'credentials' => {
          'gus_hash' => { 'kind' => 'hash', 'account' => 'gus', 'proof' => { 'held' => 'gus_file' },
                          'crack' => { 'password' => 'guessable', 'facts' => %w[pet year] } },
          'cal_hash' => { 'kind' => 'hash', 'account' => 'cal', 'proof' => { 'held' => 'cal_file' },
                          'crack' => { 'password' => 'common' } },
          'sam_hash' => { 'kind' => 'hash', 'account' => 'sam', 'proof' => { 'held' => 'sam_file' },
                          'crack' => { 'password' => 'guessable', 'facts' => %w[pet year] }, 'salted' => true },
          'plain_pw' => { 'kind' => 'password', 'account' => 'gus', 'proof' => { 'held' => 'nothing_file' } }
        }
      }
    end

    def build_game(hold: %w[gus cal sam], start_facts: nil)
      data = scenario.merge('formatVersion' => BreakEscape::FormatUpgrade.current)
      data['startItemsInInventory'] = [note('start_note', start_facts)] if start_facts
      game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user))
      state = game.player_state.merge(
        'currentRoom' => 'office', 'unlockedRooms' => ['office'], 'unlockedObjects' => [],
        'encounteredNPCs' => %w[gus cal sam], 'globalVariables' => {},
        'inventory' => hold.map { |n| file(n).except('takeable') }
      )
      game.update_columns(scenario_data: data, player_state: state)
      game.reload
    end

    def crack(game, hash_id, facts = [], raw: nil)
      post crack_game_url(game), params: raw || { hash_id: hash_id, facts: facts }, as: :json
      response.parsed_body
    end

    def earn(game, *ids)
      game.reload.update_columns(player_state: game.player_state.merge('earnedFacts' => ids))
    end

    def earned(game)
      game.reload.earned_fact_ids
    end

    # ---- refusals, in order ------------------------------------------------------------

    test 'every answer is no-store' do
      game = build_game
      crack(game, 'cal_hash')
      assert_equal 'no-store', response.headers['Cache-Control']
      crack(game, 'nope')
      assert_equal 'no-store', response.headers['Cache-Control']
      crack(game, nil, raw: { facts: [] })
      assert_equal 'no-store', response.headers['Cache-Control']
    end

    test 'bad_request: the hash id and the facts are checked first, with the closed body' do
      game = build_game
      bad = [
        { facts: [] }, { hash_id: 5, facts: [] }, { hash_id: ['cal_hash'], facts: [] }, { hash_id: 'x' * 201, facts: [] },
        { hash_id: 'cal_hash', facts: 'pet' }, { hash_id: 'cal_hash', facts: { a: 'b' } },
        { hash_id: 'cal_hash', facts: %w[a b c d e] }, { hash_id: 'cal_hash', facts: [''] },
        { hash_id: 'cal_hash', facts: ['x' * 65] }, { hash_id: 'cal_hash', facts: [1] }
      ]
      bad.each do |raw|
        body = crack(game, nil, raw: raw)
        assert_response :bad_request, raw.inspect
        assert_equal({ 'success' => false, 'reason' => 'bad_request' }, body, raw.inspect)
      end
    end

    test 'a fact id such as staffId passes the shape check' do
      game = build_game
      body = crack(game, 'gus_hash', ['staffId'])
      assert_response :unprocessable_entity
      assert_equal 'fact_not_held', body['reason']
    end

    test 'unknown, non-hash and unheld ids give one identical 404' do
      game = build_game(hold: %w[gus cal])
      bodies = []
      %w[nope plain_pw sam_hash office.cracked].each do |id|
        bodies << crack(game, id)
        assert_response :not_found, id
      end
      assert_equal 1, bodies.uniq.size
      assert_equal({ 'success' => false, 'reason' => 'not_found' }, bodies.first)
    end

    test 'no_recipe is 422 and writes nothing' do
      game = build_game
      data = game.scenario_data.deep_dup
      data['credentials']['cal_hash']['crack'] = { 'password' => 'bogus' }
      game.update_columns(scenario_data: data)
      before = game.reload.player_state.slice(*STATE_KEYS)
      body = crack(game, 'cal_hash', ['pet'])
      assert_response :unprocessable_entity
      assert_equal({ 'success' => false, 'reason' => 'no_recipe' }, body)
      assert_equal before, game.reload.player_state.slice(*STATE_KEYS)
    end

    test 'fact_not_held is 422, compared exactly, and no_recipe comes before it' do
      game = build_game
      body = crack(game, 'gus_hash', ['pet'])
      assert_response :unprocessable_entity
      assert_equal 'fact_not_held', body['reason']
      earn(game, 'pet')
      assert_equal 'fact_not_held', crack(game, 'gus_hash', ['se_intel_pet'])['reason']
      data = game.reload.scenario_data.deep_dup
      data['credentials']['gus_hash']['crack'] = { 'password' => 'bogus' }
      game.update_columns(scenario_data: data)
      assert_equal 'no_recipe', crack(game, 'gus_hash', ['town'])['reason']
    end

    test 'an already-held account answers cracked, with an unearned pick, before no_recipe and fact_not_held' do
      game = build_game
      game.reload.update_columns(player_state: game.player_state.merge('crackedAccounts' => ['gus']))
      body = crack(game, 'gus_hash', %w[town club])
      assert_response :success
      assert_equal({ 'success' => true, 'status' => 'cracked' }, body)
    end

    # ---- the run ------------------------------------------------------------------------

    test 'a common record cracks, the keyring then lists the password, and a second post answers cracked' do
      game = build_game
      body = crack(game, 'cal_hash')
      assert_response :success
      assert_equal 'cracked', body['status']
      assert_equal 'cal', body['accountId']
      assert_equal ['cal.cracked'], body['credentialIds']
      refute_includes response.body, COMMON_PASSWORD
      assert_equal ['cal'], game.reload.player_state['crackedAccounts']

      assert_equal 'cracked', crack(game, 'cal_hash')['status']
      assert_equal ['cal'], game.reload.player_state['crackedAccounts'], 'granted once'

      get keyring_game_url(game), as: :json
      row = response.parsed_body['entries'].find { |e| e['id'] == 'cal.cracked' }
      assert_equal COMMON_PASSWORD, row['password']
    end

    test 'a guessable record: needMoreFacts, then the right pick cracks' do
      game = build_game
      earn(game, 'pet')
      body = crack(game, 'gus_hash', ['pet'])
      assert_equal 'needMoreFacts', body['status']
      assert_equal 1, body['missingCount']
      earn(game, 'pet', 'year')
      assert_equal 'nomatch', crack(game, 'gus_hash', ['pet'])['status']
      assert_equal 'cracked', crack(game, 'gus_hash', %w[year pet])['status']
    end

    test 'a salted record answers running with a wait, then grants after it' do
      game = build_game
      earn(game, 'pet', 'year')
      travel_to Time.zone.local(2026, 11, 24, 12, 0, 0) do
        body = crack(game, 'sam_hash', %w[pet year])
        assert_equal 'running', body['status']
        assert_equal 60, body['readyInSeconds']
        refute_includes response.body, 'Sam-Strong-1'
      end
      travel_to Time.zone.local(2026, 11, 24, 12, 2, 0) do
        assert_equal 'cracked', crack(game, 'sam_hash')['status']
      end
    end

    test 'two posts in turn grant once' do
      game = build_game
      2.times { crack(game, 'cal_hash') }
      assert_equal ['cal'], game.reload.player_state['crackedAccounts']
    end

    test 'POST /crack leaves the log rows unchanged' do
      game = build_game
      before = game.player_state['opsLog'].deep_dup
      crack(game, 'cal_hash')
      crack(game, 'gus_hash', ['pet'])
      assert_equal(before || {}, game.reload.player_state['opsLog'] || {})
    end

    # ---- the keyring unchanged answer ---------------------------------------------------

    test 'the unchanged keyring answer carries readyInSeconds for a running wait' do
      game = build_game
      earn(game, 'pet', 'year')
      travel_to Time.zone.local(2026, 11, 24, 12, 0, 0) do
        crack(game, 'sam_hash', %w[pet year])
        get keyring_game_url(game), as: :json
        rev = response.parsed_body['rev']
        assert_equal 60, response.parsed_body['entries'].find { |e| e['id'] == 'sam_hash' }['readyInSeconds']
        travel 10.seconds
        get keyring_game_url(game), params: { rev: rev }, as: :json
        body = response.parsed_body
        assert_equal true, body['unchanged']
        assert_equal({ 'sam_hash' => 50 }, body['readyInSeconds'])
      end
    end

    # ---- facts stamped -------------------------------------------------------------------

    test 'a take stamps the facts of the stored copy' do
      game = build_game
      post inventory_game_url(game), params: { action_type: 'add', item: note('pet_note') }, as: :json
      assert_response :success, response.body
      assert_includes earned(game), 'pet'
    end

    test 'an NPC give stamps the facts of the stored copy' do
      game = build_game
      post inventory_game_url(game), params: { action_type: 'add', item: note('year_note'), source_npc_id: 'gus' }, as: :json
      assert_response :success, response.body
      assert_includes earned(game), 'year'
    end

    test 'a give_item reward stamps the facts of the item' do
      game = build_game
      post flags_game_url(game), params: { flag: FLAG_TWO, stationId: 'station' }, as: :json
      assert_response :success, response.body
      assert_includes earned(game), 'town'
    end

    test 'a start item reveals its facts without any stamp' do
      game = build_game(start_facts: %w[lake])
      assert_includes earned(game), 'lake'
    end

    test 'a grant_fact reward is stamped when submit_flag accepts the flag, not before' do
      game = build_game
      refute_includes earned(game), 'club'
      post flags_game_url(game), params: { flag: 'flag{wrong}', stationId: 'station' }, as: :json
      refute_includes earned(game), 'club'
      post flags_game_url(game), params: { flag: FLAG_ONE, stationId: 'station' }, as: :json
      assert_response :success, response.body
      assert_includes earned(game), 'club'
      assert_includes response.parsed_body['rewards'].map { |r| r['type'] }, 'grant_fact'
    end

    test 'a grant_fact reward is stamped when a flag lock is opened, and not when a transient error rolls it back' do
      game = build_game
      TransientFlagError.on = true
      post unlock_game_url(game), params: { targetType: 'object', targetId: 'flag_safe', attempt: FLAG_THREE, method: 'flag' }, as: :json
      refute_includes earned(game), 'lake'
      TransientFlagError.on = false
      post unlock_game_url(game), params: { targetType: 'object', targetId: 'flag_safe', attempt: FLAG_THREE, method: 'flag' }, as: :json
      assert_response :success, response.body
      assert_includes earned(game), 'lake'
    end

    # ---- forgeries ------------------------------------------------------------------------

    test 'a synced se_intel global and synced state keys are ignored' do
      game = build_game
      put sync_state_game_url(game), params: {
        currentRoom: 'office', globalVariables: { 'se_intel_pet' => true },
        earnedFacts: %w[pet year], crackRuns: { 'gus_hash' => 1 }, crackStarted: { 'gus_hash' => { 'at' => 1, 'hit' => true } },
        crackedAccounts: ['gus'], flag_rewards_claimed: ['flag{x}']
      }, as: :json
      state = game.reload.player_state
      assert_empty Array(state['earnedFacts'])
      assert_empty(state['crackRuns'] || {})
      assert_empty(state['crackStarted'] || {})
      assert_empty Array(state['crackedAccounts'])
      assert_empty Array(state['flag_rewards_claimed'])
      assert_equal 'fact_not_held', crack(game, 'gus_hash', ['pet'])['reason']
    end

    test 'a set_global reward of se_intel_<id> earns nothing' do
      game = build_game
      data = game.scenario_data.deep_dup
      data['rooms']['office']['objects'].find { |o| o['id'] == 'station' }['flagRewards'][0] =
        { 'type' => 'set_global', 'key' => 'se_intel_pet', 'value' => true }
      game.update_columns(scenario_data: data)
      post flags_game_url(game), params: { flag: FLAG_ONE, stationId: 'station' }, as: :json
      refute_includes earned(game), 'pet'
    end

    test 'a declared-grant item carrying revealsFacts stamps nothing' do
      game = build_game
      post inventory_game_url(game), params: { action_type: 'add', item: note('granted_note') }, as: :json
      assert_response :success, response.body
      assert_includes game.reload.player_state['inventory'].map { |i| i['id'] }, 'granted_note'
      refute_includes earned(game), 'pet'
    end

    test 'a notepad posted with a fact item id stamps nothing' do
      game = build_game
      post inventory_game_url(game), params: { action_type: 'add',
                                               item: { 'type' => 'notepad', 'id' => 'pet_note', 'name' => 'Notepad', 'revealsFacts' => %w[pet] } },
                                     as: :json
      refute_includes earned(game), 'pet'
    end

    test 'an add_object carrying revealsFacts stamps nothing' do
      game = build_game
      post update_room_game_url(game), params: { roomId: 'office', actionType: 'add_object',
                                                 data: { 'type' => 'notes', 'id' => 'forged_note', 'name' => 'forged', 'takeable' => true,
                                                         'revealsFacts' => %w[town] } }, as: :json
      post inventory_game_url(game), params: { action_type: 'add',
                                               item: { 'type' => 'notes', 'id' => 'forged_note', 'name' => 'forged', 'revealsFacts' => %w[town] } },
                                     as: :json
      refute_includes earned(game), 'town'
    end

    test 'an NPC drop stored under a locked fact item id stamps nothing' do
      game = build_game
      post inventory_game_url(game), params: { action_type: 'add', item: note('vault_note', %w[club]), source_npc_id: 'sam' }, as: :json
      refute_includes earned(game), 'club'
    end

    # ---- R1-S1: no fact the player has not earned in the bootstrap -------------------------------

    def bootstrap_facts(game)
      get scenario_game_url(game), as: :json
      assert_response :success, response.body
      response.parsed_body.dig('social', 'intelFacts')
    end

    test 'the bootstrap holds no entry for an unearned item or flag-reward fact' do
      game = build_game
      facts = bootstrap_facts(game)
      assert_equal({}, facts)
      %w[pet year town club lake].each { |f| refute_includes response.body, "The #{f} text." }
    end

    test 'an earned fact keeps its entry in the bootstrap and an unearned one stays out' do
      game = build_game
      earn(game, 'pet', 'lake')
      facts = bootstrap_facts(game)
      assert_equal %w[lake pet], facts.keys.sort
      assert_equal 'The pet text.', facts['pet']['text']
    end

    test 'a start item fact is earned from the start, so its entry ships' do
      game = build_game(start_facts: %w[lake])
      assert_equal %w[lake], bootstrap_facts(game).keys
    end

    test 'the take that earns a fact answers with its entry' do
      game = build_game
      post inventory_game_url(game), params: { action_type: 'add', item: note('pet_note') }, as: :json
      assert_equal 'The pet text.', response.parsed_body.dig('facts', 'pet', 'text')
      post inventory_game_url(game), params: { action_type: 'add', item: note('plain_note') }, as: :json
      assert_nil response.parsed_body['facts']
    end

    test 'the flag that earns a fact answers with its entry, in the reward' do
      game = build_game
      post flags_game_url(game), params: { flag: FLAG_ONE, stationId: 'station' }, as: :json
      reward = response.parsed_body['rewards'].find { |r| r['type'] == 'grant_fact' }
      assert_equal 'The club text.', reward.dig('entry', 'text')
      post flags_game_url(game), params: { flag: FLAG_TWO, stationId: 'station' }, as: :json
      give = response.parsed_body['rewards'].find { |r| r['type'] == 'give_item' }
      assert_equal 'The town text.', give.dig('facts', 'town', 'text')
    end

    # ---- nothing secret goes out ---------------------------------------------------------------

    test 'no answer holds the password before the grant or a state key' do
      game = build_game
      earn(game, 'pet', 'year')
      bodies = []
      crack(game, 'gus_hash', %w[pet town]) rescue nil
      bodies << response.body
      get keyring_game_url(game), as: :json
      bodies << response.body
      put sync_state_game_url(game), params: { currentRoom: 'office' }, as: :json
      bodies << response.body
      bodies.each do |text|
        refute_includes text, PASSWORD
        STATE_KEYS.each { |k| refute_includes text, "\"#{k}\"" }
        refute_match(/difficulty/i, text)
      end
    end
  end
end
