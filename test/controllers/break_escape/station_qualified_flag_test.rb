require 'test_helper'

module BreakEscape
  # Two stations accepting the same VM produce colliding unqualified flag ids:
  # each numbers its flags from 1 within its OWN flags array, so the launch
  # device's only flag and the drop site's first flag are both "vm-flag1".
  # This is the m01_first_contact shape (a launch-device with a name but no id,
  # plus a flag-station with an id).
  #
  # The engine now also offers a station-qualified id, "<stationKey>:<vm>-flagN".
  # A task opting in to the qualified form binds to one station; a task left in
  # the legacy form behaves exactly as it always did.
  class StationQualifiedFlagTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    FLAG_DROP  = 'flag{drop_one}'.freeze
    FLAG_LAUNCH = 'flag{launch_code}'.freeze

    def build_game(target_flags)
      Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: {
          'startRoom' => 'reception',
          'flags' => {
            'target_vm' => { 'flag_1' => FLAG_DROP, 'flag_3' => FLAG_LAUNCH }
          },
          'objectives' => [{
            'aimId' => 'aim_flags',
            'tasks' => [{
              'taskId' => 'submit_drop_flag',
              'type' => 'submit_flags',
              'targetFlags' => target_flags
            }]
          }],
          'rooms' => {
            'reception' => {
              'type' => 'room_reception',
              'objects' => [
                {
                  'type' => 'flag-station',
                  'id' => 'flag_station_dropsite',
                  'name' => 'Drop Site',
                  'acceptsVms' => ['target_vm'],
                  'flags' => ['target_vm:flag_1']
                },
                {
                  # No id — station key falls back to name, as m01's does.
                  'type' => 'launch-device',
                  'name' => 'ENTROPY Launch Device',
                  'acceptsVms' => ['target_vm'],
                  'flags' => ['target_vm:flag_3']
                }
              ]
            }
          }
        }
      )
    end

    def submit(game, flag, station_id)
      post flags_game_url(game), params: { flag: flag, stationId: station_id }, as: :json
      JSON.parse(response.body)
    end

    def task_state(game, task_id = 'submit_drop_flag')
      game.reload.player_state.dig('objectivesState', 'tasks', task_id) || {}
    end

    test 'both stations still generate the same unqualified id (the collision is real)' do
      game = build_game(['target_vm-flag1'])

      body = submit(game, FLAG_LAUNCH, 'ENTROPY Launch Device')
      assert_equal true, body['success'], body.inspect
      assert_equal 'target_vm-flag1', body['flagId']

      body = submit(game, FLAG_DROP, 'flag_station_dropsite')
      assert_equal true, body['success'], body.inspect
      assert_equal 'target_vm-flag1', body['flagId']
    end

    test 'legacy unqualified targetFlags completes from either station (unchanged behaviour)' do
      game = build_game(['target_vm-flag1'])

      body = submit(game, FLAG_LAUNCH, 'ENTROPY Launch Device')

      assert_includes body['completedTasks'], 'submit_drop_flag'
      assert_equal 'completed', task_state(game)['status']
      assert_equal ['target_vm-flag1'], task_state(game)['submittedFlags']
    end

    test 'qualified targetFlags is NOT completed by a submission at the other station' do
      game = build_game(['flag_station_dropsite:target_vm-flag1'])

      body = submit(game, FLAG_LAUNCH, 'ENTROPY Launch Device')

      assert_equal true, body['success'], body.inspect
      assert_empty body['completedTasks']
      assert_nil task_state(game)['status']
    end

    test 'qualified targetFlags completes when submitted at its own station' do
      game = build_game(['flag_station_dropsite:target_vm-flag1'])

      # The wrong-station submission first, to prove it did not help.
      submit(game, FLAG_LAUNCH, 'ENTROPY Launch Device')
      body = submit(game, FLAG_DROP, 'flag_station_dropsite')

      assert_includes body['completedTasks'], 'submit_drop_flag'
      assert_equal 'completed', task_state(game)['status']
      assert_equal ['flag_station_dropsite:target_vm-flag1'], task_state(game)['submittedFlags']
    end
  end
end
