require 'test_helper'

module BreakEscape
  class RoomLazyLoadTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)

      @game = Game.create!(
        mission: @mission,
        player: @player,
        scenario_data: {
          "startRoom" => "test_room",
          "rooms" => {
            "test_room" => {
              "type" => "office",
              "objects" => [],
              "connections" => {}
            },
            "test_room_2" => {
              "type" => "office",
              "objects" => [],
              "connections" => {}
            }
          }
        }
      )
    end

    test 'should return room data for valid room_id' do
      # Get a room_id from the scenario data
      room_id = @game.scenario_data['rooms']&.keys&.first
      skip 'No rooms in scenario data' unless room_id.present?

      get "/break_escape/games/#{@game.id}/room/#{room_id}"

      assert_response :success
      data = JSON.parse(response.body)

      assert_equal room_id, data['room_id']
      assert data['room'].present?
      assert data['room']['type'].present?
    end

    test 'should return 404 for non-existent room' do
      get "/break_escape/games/#{@game.id}/room/non_existent_room"

      assert_response :not_found
      data = JSON.parse(response.body)
      assert_match /Room not found/, data['error']
    end

    test 'should return 400 when room_id is missing' do
      # This would require a malformed URL, which is hard to test with helpers
      # The route constraint should prevent this in practice
      skip 'Route requires room_id parameter'
    end

    test 'room response includes all room data' do
      room_id = @game.scenario_data['rooms']&.keys&.first
      skip 'No rooms in scenario data' unless room_id.present?

      get "/break_escape/games/#{@game.id}/room/#{room_id}"

      assert_response :success
      data = JSON.parse(response.body)
      room = data['room']

      # Verify room contains expected structure
      assert room['type'].present?, 'Room should have type'
      # Room may have connections, objects, npcs, etc. - all optional
    end
  end
end
