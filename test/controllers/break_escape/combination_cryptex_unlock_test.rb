require 'test_helper'

# Unlock gaps build (2026-11-12): Game#validate_unlock had no combination or cryptex branch,
# so neither lock ever opened on the server. Both now check the answer against the lock's
# `requires`, which never reaches the client (nor do the old client-side copies of the
# answer, `combination` and `cryptexConfig.answer`).
module BreakEscape
  class CombinationCryptexUnlockTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
      @game = Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end

    def unlock(target_id, attempt, method, type: 'object')
      params = { targetType: type, targetId: target_id, method: method }
      params[:attempt] = attempt unless attempt.nil?
      post unlock_game_url(@game), params: params, as: :json
    end

    # ── combination padlock ──────────────────────────────────────────────

    test 'a combination padlock opens with the right dials and returns its contents' do
      unlock('locker', '12-30-5', 'combination')

      assert_response :success, response.body
      assert_equal ['locker_note'], response.parsed_body['contents'].map { |c| c['id'] }
      assert_includes @game.reload.player_state['unlockedObjects'], 'locker'
    end

    test 'a wrong combination is refused and opens nothing' do
      unlock('locker', '12-30-6', 'combination')

      assert_response :unprocessable_entity
      assert_nil response.parsed_body['contents']
      refute_includes @game.reload.player_state['unlockedObjects'], 'locker'
    end

    test 'a missing or blank combination is refused' do
      unlock('locker', nil, 'combination')
      assert_response :unprocessable_entity

      unlock('locker', '', 'combination')
      assert_response :unprocessable_entity
      refute_includes @game.reload.player_state['unlockedObjects'], 'locker'
    end

    test 'a combination door opens with the right dials and not with wrong ones' do
      unlock('vault', '1-2-3', 'combination', type: 'door')
      assert_response :unprocessable_entity

      unlock('vault', nil, 'combination', type: 'door')
      assert_response :unprocessable_entity

      unlock('vault', '7-21-39', 'combination', type: 'door')
      assert_response :success, response.body
      assert_includes @game.reload.player_state['unlockedRooms'], 'vault'
    end

    test 'another method cannot open a combination padlock' do
      unlock('locker', '12-30-5', 'pin')
      assert_response :unprocessable_entity

      unlock('locker', '12-30-5', 'cryptex')
      assert_response :unprocessable_entity
    end

    # ── cryptex ──────────────────────────────────────────────────────────

    test 'a cryptex opens with the right word and returns its contents' do
      unlock('cryptex_box', 'CIPHER', 'cryptex')

      assert_response :success, response.body
      assert_equal ['scroll'], response.parsed_body['contents'].map { |c| c['id'] }
    end

    test 'a wrong cryptex word is refused and opens nothing' do
      unlock('cryptex_box', 'CIPHEX', 'cryptex')

      assert_response :unprocessable_entity
      assert_nil response.parsed_body['contents']
      refute_includes @game.reload.player_state['unlockedObjects'], 'cryptex_box'
    end

    test 'a missing or blank cryptex word is refused' do
      unlock('cryptex_box', nil, 'cryptex')
      assert_response :unprocessable_entity

      unlock('cryptex_box', '   ', 'cryptex')
      assert_response :unprocessable_entity
    end

    test 'another method cannot open a cryptex' do
      unlock('cryptex_box', 'CIPHER', 'password')
      assert_response :unprocessable_entity
    end

    # ── the answers stay on the server ───────────────────────────────────

    test 'neither the combination nor the cryptex word reaches the client' do
      get room_game_url(@game, room_id: 'lobby'), as: :json
      assert_response :success
      body = response.body
      refute_includes body, 'CIPHER'
      refute_includes body, '12-30-5'
      objects = response.parsed_body.dig('room', 'objects') || response.parsed_body['objects'] || []
      locker = objects.find { |o| o['id'] == 'locker' }
      box = objects.find { |o| o['id'] == 'cryptex_box' }
      refute_nil locker
      refute_nil box
      refute locker.key?('requires')
      refute locker.key?('combination'), 'the old client copy of the combination is stripped'
      refute box.key?('requires')
      refute box['cryptexConfig'].key?('answer'), 'the old client copy of the cryptex word is stripped'
      assert_equal 6, box['cryptexConfig']['wheelCount'], 'the rest of the cryptex config still ships'

      get scenario_game_url(@game), as: :json
      assert_response :success
      refute_includes response.body, 'CIPHER'
      refute_includes response.body, '7-21-39'
    end

    # ── R1 M2: a cryptex door ────────────────────────────────────────────

    test 'a cryptex door ships its wheels in the bootstrap, never its word, and opens with it' do
      get scenario_game_url(@game), as: :json
      assert_response :success
      archive = response.parsed_body.dig('rooms', 'archive')
      refute_nil archive
      assert_equal 'cryptex', archive['lockType']
      assert_equal 4, archive.dig('cryptexConfig', 'wheelCount'), 'the door pad needs the wheel count'
      assert_equal 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0', archive.dig('cryptexConfig', 'alphabets', 0)
      refute archive.key?('requires')
      refute archive['cryptexConfig'].key?('answer')
      refute_includes response.body, 'KEYS'

      unlock('archive', 'KEYZ', 'cryptex', type: 'door')
      assert_response :unprocessable_entity
      unlock('archive', 'KEYS', 'combination', type: 'door')
      assert_response :unprocessable_entity
      unlock('archive', 'keys', 'cryptex', type: 'door')
      assert_response :success, response.body
      assert_includes @game.reload.player_state['unlockedRooms'], 'archive'
    end

    # ── R1 m3: a locked start item never ships its answer ────────────────

    test 'a locked start item is stored without its answer and ships none' do
      data = scenario.merge('startItemsInInventory' => [
        { 'type' => 'cryptex', 'id' => 'pocket_cryptex', 'name' => 'Pocket Cryptex', 'takeable' => true,
          'locked' => true, 'lockType' => 'cryptex', 'requires' => 'RIDDLE',
          'cryptexConfig' => { 'wheelCount' => 6, 'answer' => 'RIDDLE' } },
        { 'type' => 'briefcase', 'id' => 'start_case', 'name' => 'Case', 'takeable' => true,
          'locked' => true, 'lockType' => 'combination', 'requires' => '3-14-15', 'combination' => [3, 14, 15] }
      ])
      @game = Game.create!(mission: @mission, player: @owner, scenario_data: data, player_state: state)
      # R2 M2: stored filtered, as a picked-up item is; the server's check reads the scenario
      held = @game.reload.player_state['inventory']
      refute_includes held.to_json, 'RIDDLE', 'the stored start item holds no answer'
      refute_includes held.to_json, '3-14-15'
      assert_equal 6, held.find { |i| i['id'] == 'pocket_cryptex' }.dig('cryptexConfig', 'wheelCount')

      get scenario_game_url(@game), as: :json
      assert_response :success
      inv = response.parsed_body['playerInventory']
      refute_nil inv, response.body[0, 300]
      cryptex = inv.find { |i| i['id'] == 'pocket_cryptex' }
      kase = inv.find { |i| i['id'] == 'start_case' }
      refute cryptex.key?('requires')
      refute cryptex['cryptexConfig'].key?('answer')
      assert_equal 6, cryptex.dig('cryptexConfig', 'wheelCount')
      refute kase.key?('requires')
      refute kase.key?('combination')
      refute_includes response.body, 'RIDDLE'
      refute_includes response.body, '3-14-15'

      # The add reply (here the "already held" path) sends the inventory back filtered too
      post inventory_game_url(@game), params: { action_type: 'add', item: { type: 'cryptex', id: 'pocket_cryptex', name: 'Pocket Cryptex' } }, as: :json
      assert_response :success, response.body
      refute_includes response.body, 'RIDDLE'
      refute_includes response.body, '3-14-15'
      assert_equal false, @game.reload.player_state['inventory'].to_json.include?('RIDDLE'),
                   'the stored copy holds no answer either'
    end

    # ── answer comparison ────────────────────────────────────────────────

    test 'a combination compares its numbers, a cryptex ignores case and outer spaces' do
      match = ->(type, secret, attempt) { Game.lock_answer_matches?(type, secret, attempt) }

      assert match.('combination', '12-30-05', '12-30-5')
      assert match.('combination', [12, 30, 5], '12-30-5')
      assert match.('combination', '12 30 5', '12-30-5')
      refute match.('combination', '12-30-5', '12-30')
      refute match.('combination', '12-30-5', '12-30-5-0')
      refute match.('combination', '12-30-5', '30-12-5')
      refute match.('combination', '12-30-5', 'twelve')
      refute match.('combination', nil, '')
      refute match.('combination', '', '')

      assert match.('cryptex', 'CIPHER', 'cipher')
      assert match.('cryptex', ' CIPHER ', 'CIPHER')
      refute match.('cryptex', 'CIPHER', 'CIPHERS')
      refute match.('cryptex', '', '')
      refute match.('cryptex', nil, nil)
      refute match.('cryptex', 'CIPHER', ['CIPHER'])
    end

    private

    def scenario
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'locked' => false, 'connections' => { 'north' => 'vault' },
            'objects' => [
              {
                'type' => 'safe', 'id' => 'locker', 'name' => 'Locker',
                'locked' => true, 'lockType' => 'combination', 'requires' => '12-30-5',
                'combination' => [12, 30, 5],
                'contents' => [{ 'type' => 'notes', 'id' => 'locker_note', 'name' => 'Note', 'takeable' => true }]
              },
              {
                'type' => 'safe', 'id' => 'cryptex_box', 'name' => 'Cryptex',
                'locked' => true, 'lockType' => 'cryptex', 'requires' => 'CIPHER',
                'cryptexConfig' => { 'wheelCount' => 6, 'answer' => 'CIPHER' },
                'contents' => [{ 'type' => 'notes', 'id' => 'scroll', 'name' => 'Scroll', 'takeable' => true }]
              }
            ]
          },
          'vault' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'combination', 'requires' => '7-21-39',
            'connections' => { 'south' => 'lobby', 'north' => 'archive' }, 'objects' => []
          },
          'archive' => {
            'type' => 'room_office', 'locked' => true, 'lockType' => 'cryptex', 'requires' => 'KEYS',
            'cryptexConfig' => { 'wheelCount' => 4, 'answer' => 'KEYS',
                                 'alphabets' => Array.new(4, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0') },
            'connections' => { 'south' => 'vault' }, 'objects' => []
          }
        }
      }
    end

    def state
      {
        'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [], 'inventory' => [],
        'encounteredNPCs' => [], 'globalVariables' => {}, 'notes' => [], 'health' => 100,
        'objectivesState' => { 'tasks' => {}, 'aims' => {} }
      }
    end
  end
end
