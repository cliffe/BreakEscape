require 'test_helper'

module BreakEscape
  # VM weave fixes (scenarios/VM_INTEGRATION_REVIEW.md):
  #  R9: a refused flag carries a reason (invalid, wrong_station, already_submitted),
  #      and a wrong-station refusal names the owning station once the player has
  #      found it (its room is unlocked), never before.
  #  R1: a flag reward's optional `label` reaches the client with the reward.
  class FlagRejectionTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    FLAG_DROP   = 'flag{drop_one}'.freeze
    FLAG_VAULT  = 'flag{vault_one}'.freeze

    def build_game
      Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: {
          'startRoom' => 'reception',
          'flags' => { 'target_vm' => { 'flag_1' => FLAG_DROP, 'flag_2' => FLAG_VAULT } },
          'objectives' => [],
          'rooms' => {
            'reception' => {
              'type' => 'room_reception',
              'objects' => [
                {
                  'type' => 'flag-station', 'id' => 'drop_site', 'name' => 'Drop Site Terminal',
                  'acceptsVms' => ['target_vm'], 'flags' => ['target_vm:flag_1'],
                  'flagRewards' => [
                    { 'type' => 'emit_event', 'event_name' => 'drop_in', 'label' => 'The relay logs the upload' }
                  ]
                },
                {
                  'type' => 'flag-station', 'id' => 'front_desk', 'name' => 'Front Desk Console',
                  'acceptsVms' => ['other_vm'], 'flags' => []
                }
              ]
            },
            'vault' => {
              'type' => 'room_office', 'locked' => true,
              'objects' => [
                {
                  'type' => 'flag-station', 'id' => 'vault_station', 'name' => 'Vault Console',
                  'acceptsVms' => ['target_vm'], 'flags' => ['target_vm:flag_2']
                }
              ]
            }
          }
        }
      )
    end

    def submit(game, flag, station_id)
      post flags_game_url(game), params: { flag: flag, stationId: station_id }, as: :json
      [response.status, JSON.parse(response.body)]
    end

    test 'a wrong-station refusal names a station the player has found' do
      game = build_game
      status, body = submit(game, FLAG_DROP, 'front_desk')
      assert_equal 422, status
      assert_equal 'wrong_station', body['reason']
      assert_equal 'Drop Site Terminal', body['ownerStationName']
    end

    test 'a wrong-station refusal does not name a station in a room still locked' do
      game = build_game
      _, body = submit(game, FLAG_VAULT, 'front_desk')
      assert_equal 'wrong_station', body['reason']
      assert_nil body['ownerStationName']

      game.unlock_room!('vault')
      _, body = submit(game, FLAG_VAULT, 'front_desk')
      assert_equal 'Vault Console', body['ownerStationName']
    end

    test 'an unknown flag is refused as invalid' do
      game = build_game
      status, body = submit(game, 'flag{nope}', 'drop_site')
      assert_equal 422, status
      assert_equal 'invalid', body['reason']
    end

    test 'a second submission is refused as already_submitted' do
      game = build_game
      _, first = submit(game, FLAG_DROP, 'drop_site')
      assert_equal true, first['success'], first.inspect
      _, body = submit(game, FLAG_DROP, 'drop_site')
      assert_equal false, body['success']
      assert_equal 'already_submitted', body['reason']
    end

    test 'a reward label reaches the client' do
      game = build_game
      _, body = submit(game, FLAG_DROP, 'drop_site')
      reward = body['rewards'].find { |r| r['type'] == 'emit_event' }
      assert_equal 'The relay logs the upload', reward['label']
    end
  end
end
