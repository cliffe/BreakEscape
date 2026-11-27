require 'test_helper'

module BreakEscape
  # An NPC capture's authored secret (usePayload.secret, an eventMappings addCapture.secret,
  # an add_capture action's capture.secret) never reaches the browser in any route that
  # carries NPC or room data, whether or not the NPC has an account. It is served only by
  # GET /capture_secrets once the server's record shows the capture was made.
  class CapturePayloadSecretRoutesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    PIN = '7302'.freeze
    PHONE_SECRET = 'PHONE-SECRET-551'.freeze
    TIMER_SECRET = 'TIMER-SECRET-662'.freeze
    OBJECT_SECRET = 'OBJECT-SECRET-773'.freeze
    HELD_SECRET = 'HELD-SECRET-884'.freeze

    def scenario_data
      {
        'startRoom' => 'lobby',
        'social' => { 'captures' => { 'revealSecret' => true } },
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'connections' => { 'north' => 'vault' },
            'npcs' => [
              { 'id' => 'keyholder', 'npcType' => 'person', 'displayName' => 'Keyholder',
                'usePayload' => { 'targetId' => 'keyholder', 'address' => 'keypad', 'secret' => PIN } },
              { 'id' => 'watcher', 'npcType' => 'person', 'displayName' => 'Watcher',
                'eventMappings' => [
                  { 'eventPattern' => 'player_watched', 'addCapture' => { 'targetId' => 'surfed', 'kind' => 'credential',
                                                                           'address' => 'door', 'secret' => PIN } }
                ],
                'itemsHeld' => [{ 'type' => 'notes', 'name' => 'Card', 'triggerOnInteract' => [
                  { 'type' => 'add_capture', 'capture' => { 'targetId' => 'held', 'kind' => 'credential', 'secret' => HELD_SECRET } }
                ] }] }
            ],
            'objects' => [
              { 'type' => 'notes', 'name' => 'Desk', 'triggerOnInteract' => [
                { 'type' => 'add_capture', 'capture' => { 'targetId' => 'desk', 'kind' => 'credential', 'secret' => OBJECT_SECRET } }
              ] }
            ]
          },
          'vault' => { 'type' => 'room_office', 'connections' => { 'south' => 'lobby' } }
        },
        'phoneNPCs' => [
          { 'id' => 'caller', 'npcType' => 'phone',
            'usePayload' => { 'targetId' => 'caller', 'secret' => PHONE_SECRET } }
        ],
        'timers' => [
          { 'id' => 't1', 'delay' => 1000, 'actions' => [
            { 'type' => 'add_capture', 'capture' => { 'targetId' => 'timed', 'kind' => 'credential', 'secret' => TIMER_SECRET } }
          ] }
        ]
      }
    end

    def build_game(player_state = {})
      game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                          scenario_data: scenario_data,
                          player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'] }.merge(player_state))
      game.prepare_scenario_data!
      game.save!
      game
    end

    SECRETS = [PIN, PHONE_SECRET, TIMER_SECRET, OBJECT_SECRET, HELD_SECRET].freeze

    test 'the bootstrap carries no capture secret, top-level phone NPCs and timers included' do
      get scenario_game_url(build_game), as: :json
      assert_response :success
      SECRETS.each { |s| refute_includes response.body, s }
    end

    test 'the room payload carries no capture secret for an NPC without an account' do
      get room_game_url(build_game, room_id: 'lobby'), as: :json
      assert_response :success
      SECRETS.each { |s| refute_includes response.body, s }
      body = response.parsed_body
      npcs = (body['room'] || body)['npcs'].index_by { |n| n['id'] }
      assert_equal({ 'targetId' => 'keyholder', 'address' => 'keypad' }, npcs['keyholder']['usePayload'])
      assert_equal 'door', npcs['watcher']['eventMappings'][0]['addCapture']['address']
    end
  end
end
