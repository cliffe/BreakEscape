require 'test_helper'

module BreakEscape
  # Credential keyring K1 (CREDENTIAL_KEYRING_PLAN.md 6.2, section 3.5 `held`): the keyring's held
  # proof must hold through the real request path, not only from seeded player_state. The client
  # never sees an item's server-only `credential` (both filters strip it), so it posts the item back
  # without one; add_inventory_item! re-stamps `credential` from the scenario's own definition, so the
  # held proof matches. A client-supplied `credential` is never trusted (K1 live fix).
  class KeyringTakeRouteTest < ActionDispatch::IntegrationTest
    def game_path(id, suffix)
      "/break_escape/games/#{id}/#{suffix}"
    end

    setup do
      mission = Mission.create!(name: 'test_simple_success', display_name: 'Keyring take', published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
      data = scenario.merge('formatVersion' => BreakEscape::FormatUpgrade.current)
      @game.update_columns(scenario_data: data,
                           player_state: @game.player_state.merge('currentRoom' => 'office', 'unlockedRooms' => %w[office]))
    end

    # lena_rdp_file carries a server-only `credential`; decoy_file is a plain takeable item with none.
    def scenario
      {
        'scenario_brief' => 'keyring take route test', 'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'npcs' => [
              { 'id' => 'lena', 'displayName' => 'Lena Fox', 'creds' => { 'username' => 'lfox', 'password' => 'Ledger-Lena-9' } }
            ],
            'objects' => [
              { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'takeable' => true,
                'credential' => 'lena_rdp', 'text' => 'Saved connection.' },
              { 'id' => 'decoy_file', 'type' => 'text_file', 'name' => 'notes.txt', 'takeable' => true, 'text' => 'Nothing here.' },
              { 'id' => 'lena_pc', 'type' => 'pc', 'lockType' => 'login', 'name' => 'Lena PC', 'host' => 'HB-FIN-02',
                'access' => { 'people' => %w[lena] } }
            ]
          }
        },
        'credentials' => {
          'lena_rdp' => { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                          'proof' => { 'held' => 'lena_rdp_file' } }
        }
      }
    end

    def take(item)
      post game_path(@game.id, 'inventory'), params: { action_type: 'add', item: item }, as: :json
      response
    end

    def keyring_ids
      get game_path(@game.id, 'keyring'), as: :json
      response.parsed_body.fetch('entries').map { |e| e['id'] }
    end

    test 'taking the credential item via the route lists it on the keyring (held proof fires live)' do
      # The client posts the item exactly as it received it: no `credential` field.
      res = take('id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp')
      assert_response :success
      stored = @game.reload.player_state['inventory'].find { |i| i['id'] == 'lena_rdp_file' }
      assert stored, 'the item was stored'
      assert_equal 'lena_rdp', stored['credential'], 'the server re-stamped the credential from its own definition'
      assert_includes keyring_ids, 'lena_rdp', 'the held saved connection is listed'
    end

    test 'a client-forged credential on a plain item earns no keyring entry' do
      # The decoy item has no `credential` in the scenario; a client forging one must not mint a
      # credential. The forged value is dropped and nothing is re-stamped, so held never matches.
      take('id' => 'decoy_file', 'type' => 'text_file', 'name' => 'notes.txt', 'credential' => 'lena_rdp')
      assert_response :success
      stored = @game.reload.player_state['inventory'].find { |i| i['id'] == 'decoy_file' }
      assert stored, 'the decoy was stored'
      refute stored.key?('credential'), 'the client-supplied credential was dropped'
      refute_includes keyring_ids, 'lena_rdp', 'no credential minted from a forged field'
    end

    test 'a forged credential naming another registry id on the real item is overwritten, not honoured' do
      # The client posts the genuine item but forges a different registry id; the server re-stamps
      # from the definition, so only the authored credential (lena_rdp) is earned.
      take('id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'ops_cookie')
      assert_response :success
      stored = @game.reload.player_state['inventory'].find { |i| i['id'] == 'lena_rdp_file' }
      assert_equal 'lena_rdp', stored['credential'], 'the forged id was overwritten by the authored one'
      ids = keyring_ids
      assert_includes ids, 'lena_rdp'
      refute_includes ids, 'ops_cookie', 'the forged registry id earned nothing'
    end
  end
end
