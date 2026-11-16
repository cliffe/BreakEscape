require 'test_helper'

module BreakEscape
  # The item-level `credential` is a server-only field (CREDENTIAL_KEYRING_PLAN.md section 15, R1 m1).
  # The `held` proof reads it from the stored inventory; the client never needs it. It must not ship
  # through client_inventory, an inventory echo, a lazy room load or the bootstrap scenario.
  class CredentialItemFieldTest < ActiveSupport::TestCase
    setup do
      mission = Mission.create!(name: 'test_simple_success', display_name: 'Cred field', published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
      @game.scenario_data = {
        'rooms' => {
          'office' => {
            'objects' => [
              { 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp',
                'takeable' => true, 'readable' => true, 'credential' => 'lena_rdp' },
              { 'id' => 'ops_rdp_file', 'type' => 'text_file', 'name' => 'SV-OPS-01.rdp',
                'readable' => true, 'credential' => 'ops_rdp' }
            ]
          }
        },
        'credentials' => {
          'lena_rdp' => { 'kind' => 'saved_connection', 'account' => 'lena', 'connectsTo' => 'lena_pc',
                          'proof' => { 'held' => 'lena_rdp_file' } }
        }
      }
      @game.player_state = Game::ACCESS_STATE_DEFAULTS.transform_values(&:dup).merge(
        'inventory' => [{ 'id' => 'lena_rdp_file', 'type' => 'text_file', 'name' => 'HB-FIN-02.rdp', 'credential' => 'lena_rdp' }],
        'unlockedRooms' => %w[office]
      )
    end

    test 'client_inventory strips the credential field from a held credential item' do
      item = @game.client_inventory.find { |i| i['id'] == 'lena_rdp_file' }
      assert item, 'the held item is still listed'
      refute item.key?('credential'), 'client_inventory must not ship the server-only credential field'
    end

    test 'item_for_answer strips the credential field from an inventory echo' do
      echo = @game.send(:item_for_answer, @game.player_state['inventory'].first)
      refute echo.key?('credential'), 'an inventory echo must not carry the credential field'
    end

    test 'the stored inventory keeps the credential field, so the held proof still holds' do
      assert_equal 'lena_rdp', @game.player_state['inventory'].first['credential'],
                   'the server state keeps credential (the held proof reads it)'
      assert @game.credential_proof_holds?('lena_rdp', @game.scenario_data['credentials']['lena_rdp']),
             'the held proof reads credential from the stored inventory'
    end

    test 'a lazy room load strips the credential field from a loose credential item' do
      obj = @game.filtered_room_data('office')['objects'].find { |o| o['id'] == 'ops_rdp_file' }
      assert obj, 'the loose item is still in the room payload'
      refute obj.key?('credential'), 'a loose credential item must not ship credential in a room load'
    end

    test 'the bootstrap scenario carries no credentials registry and no item credential field' do
      filtered = @game.filtered_scenario_for_bootstrap
      refute filtered.key?('credentials'), 'the bootstrap must not ship the credentials registry'
      JSON.generate(filtered).tap do |json|
        refute_includes json, '"credential"', 'no node in the bootstrap carries a credential field'
      end
    end
  end
end
