require 'test_helper'

module BreakEscape
  # S5b unit 09: the keyring's `harvested` proof. A hash record whose proof is
  # { harvested: <pcId> } lists only once the pair "<pcId>|<npcId>" is in the server's
  # `harvestedAccounts`, for that PC only, and never carries a password.
  class HarvestedProofTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    PASSWORD = 'Lena-Fox-1971'.freeze

    def scenario
      {
        'startRoom' => 'office',
        'rooms' => { 'office' => {
          'type' => 'room_office', 'connections' => {},
          'npcs' => [
            { 'id' => 'lena', 'displayName' => 'Lena Fox', 'creds' => { 'username' => 'lfox', 'password' => PASSWORD } },
            { 'id' => 'jake', 'displayName' => 'Jake Brooks', 'creds' => { 'username' => 'jbrooks', 'password' => 'Jake-B-2002' } }
          ],
          'objects' => []
        } },
        'credentials' => {
          'lena_hash' => { 'kind' => 'hash', 'account' => 'lena', 'proof' => { 'harvested' => 'desk_a' },
                           'crack' => { 'password' => 'reused' } },
          'jake_hash' => { 'kind' => 'hash', 'account' => 'jake', 'proof' => { 'harvested' => 'desk_b' },
                           'crack' => { 'password' => 'reused' } },
          # a password record can not take the kind
          'lena_pw' => { 'kind' => 'password', 'account' => 'lena', 'proof' => { 'harvested' => 'desk_a' } }
        }
      }
    end

    def build_game(extra = {})
      data = scenario.merge('formatVersion' => BreakEscape::FormatUpgrade.current)
      game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user))
      state = game.player_state.merge('currentRoom' => 'office', 'unlockedRooms' => ['office'], 'inventory' => []).merge(extra)
      game.update_columns(scenario_data: data, player_state: state)
      game.reload
    end

    def entries(game)
      game.keyring_for_client[:entries]
    end

    def hash_ids(game)
      entries(game).select { |e| e['kind'] == 'hash' }.map { |e| e['id'] }
    end

    test 'no row lists before the pair is set' do
      game = build_game
      assert_empty hash_ids(game)
      assert_empty entries(game)
    end

    test 'a row lists only for the pair set, for that PC only' do
      game = build_game('harvestedAccounts' => ['desk_a|lena'])
      assert_equal %w[lena_hash], hash_ids(game)
      # the same account at another PC does not count
      other = build_game('harvestedAccounts' => ['desk_b|lena'])
      assert_empty hash_ids(other)
      # a pair for another account does not list this record
      third = build_game('harvestedAccounts' => ['desk_a|jake'])
      assert_empty hash_ids(third)
    end

    test 'the row has no password and a password record never takes the kind' do
      game = build_game('harvestedAccounts' => ['desk_a|lena'])
      assert_equal %w[lena_hash], entries(game).map { |e| e['id'] }
      assert_not_includes JSON.generate(entries(game)), PASSWORD
      assert_nil entries(game).first['password']
      assert_not game.credential_proof_holds?('lena_pw', scenario['credentials']['lena_pw'])
    end

    test 'bad stored values never hold' do
      [nil, 'desk_a|lena', { 'desk_a|lena' => true }, [1, nil], ['desk_a|', '|lena', 'desk_a lena']].each do |value|
        game = build_game('harvestedAccounts' => value)
        assert_empty hash_ids(game), value.inspect
      end
    end

    test 'an account already cracked reads cracked' do
      game = build_game('harvestedAccounts' => ['desk_a|lena'])
      assert_equal 'ready', entries(game).first['status']
      game = build_game('harvestedAccounts' => ['desk_a|lena'], 'crackedAccounts' => ['lena'])
      assert_equal 'cracked', entries(game).find { |e| e['id'] == 'lena_hash' }['status']
    end

    test 'the keyring rev changes when a pair is added' do
      game = build_game
      before = game.keyring_for_client[:rev]
      game.player_state['harvestedAccounts'] = ['desk_a|lena']
      after_one = game.keyring_for_client[:rev]
      game.player_state['harvestedAccounts'] = %w[desk_a|lena desk_b|jake]
      after_two = game.keyring_for_client[:rev]
      assert_equal 3, [before, after_one, after_two].uniq.length
    end

    test 'POST /crack on an uncollected harvested hash is the 404, and works once collected' do
      game = build_game
      post crack_game_url(game), params: { hash_id: 'lena_hash', facts: [] }, as: :json
      assert_response :not_found
      assert_equal({ 'success' => false, 'reason' => 'not_found' }, response.parsed_body)
      assert_not_includes response.body, PASSWORD

      game.update_columns(player_state: game.player_state.merge('harvestedAccounts' => ['desk_a|lena']))
      post crack_game_url(game), params: { hash_id: 'lena_hash', facts: [] }, as: :json
      assert_response :success
    end
  end
end
