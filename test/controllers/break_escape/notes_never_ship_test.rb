require 'test_helper'

module BreakEscape
  # Step 2b (plan item 3, Tests "notes never ship, one test per route"). An author note ("_"-prefixed
  # property) never reaches the browser on any route that carries scenario data, while an id that
  # starts with "_" and free data (object-valued globals, minigameData) still ship as authored. The
  # stored scenario_data keeps every note (the strips work on copies).
  class NotesNeverShipTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    # Values an author parked in a note: none may ship.
    NOTE_CREDS = 'NOTE-CREDS-OLD-111'.freeze   # NPC _creds_old
    NOTE_PIN   = 'NOTE-DRAFT-PIN-222'.freeze   # locked object _draft
    NOTE_PASS  = 'NOTE-CONTENTS-PW-333'.freeze # item in contents[] _note
    NOTE_BOARD = 'NOTE-BOARD-444'.freeze       # command_board commandBoard _note
    NOTE_SECRETS = [NOTE_CREDS, NOTE_PIN, NOTE_PASS, NOTE_BOARD].freeze

    # Values that must ship: a free-data value under an object global and under an object's
    # minigameData, and a saved "_" global in player_state.
    FREE_GLOBAL = 'FREE-GLOBAL-VALUE-555'.freeze
    FREE_MINIGAME = 'FREE-MINIGAME-VALUE-666'.freeze
    SAVED_NOTE = 'SAVED-GLOBAL-VALUE-777'.freeze

    def scenario_data
      {
        'startRoom' => 'lobby',
        # An object global (free data): its "_inner" key is ordinary data and ships. "_secretglobal"
        # is a global name (an id of the globalVariables map), so it ships too.
        'globalVariables' => {
          '_secretglobal' => true,
          'board_state' => { '_inner' => FREE_GLOBAL }
        },
        'rooms' => {
          'lobby' => {
            'type' => 'room_office',
            'connections' => { 'north' => 'vault', 'east' => '_annex' },
            'npcs' => [
              { 'id' => 'guard', 'npcType' => 'person', 'displayName' => 'Guard',
                'creds' => { 'password' => 'realpw' },
                '_creds_old' => { 'password' => NOTE_CREDS } }
            ],
            'objects' => [
              # A locked object; its _draft note holds a PIN. requires is stripped by the route; the
              # note is stripped by strip_notes!.
              { 'id' => 'safe', 'type' => 'safe', 'name' => 'Safe', 'locked' => true,
                'lockType' => 'pin', 'requires' => '9999',
                '_draft' => { 'triggerOnInteract' => [{ 'type' => 'unlock', 'requires' => NOTE_PIN }] } },
              # An unlocked crate whose contents hold an item with a note password.
              { 'id' => 'crate', 'type' => 'notes', 'name' => 'Crate',
                'contents' => [
                  { 'id' => 'folder', 'type' => 'notes', 'name' => 'Folder',
                    '_note' => { 'password' => NOTE_PASS } }
                ] },
              # An object with free-data minigameData: its "_free" key ships.
              { 'id' => 'console', 'type' => 'notes', 'name' => 'Console',
                'minigameData' => { '_free' => FREE_MINIGAME } },
              # A command board; its commandBoard config holds a note.
              { 'id' => 'board', 'type' => 'command_board', 'name' => 'Board',
                'commandBoard' => { 'title' => 'Ops', '_note' => NOTE_BOARD } }
            ]
          },
          'vault' => { 'type' => 'room_office', 'connections' => { 'south' => 'lobby' },
                       'locked' => true, 'lockType' => 'pin', 'requires' => '9999' },
          # A room whose id starts with "_": an id, honoured, ships.
          '_annex' => { 'type' => 'room_office', 'connections' => { 'west' => 'lobby' } }
        }
      }
    end

    def build_game(player_state = {})
      game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                          scenario_data: scenario_data,
                          player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'],
                                          'unlockedObjects' => ['crate'] }.merge(player_state))
      game.prepare_scenario_data!
      game.save!
      game
    end

    test 'the bootstrap ships no note, but ships free-data globals, "_" global ids and saved "_" globals' do
      game = build_game('globalVariables' => { '_mynote' => SAVED_NOTE })
      get scenario_game_url(game), as: :json
      assert_response :success
      NOTE_SECRETS.each { |s| refute_includes response.body, s }
      # Free data ships as authored; a "_" global name (an id) ships; a saved "_" global ships.
      assert_includes response.body, FREE_GLOBAL
      assert_includes response.body, '_secretglobal'
      assert_includes response.body, SAVED_NOTE
      body = response.parsed_body
      assert_includes body['globalVariables'].keys, '_secretglobal'
      assert_equal SAVED_NOTE, body.dig('savedGlobalVariables', '_mynote')
    end

    test 'the bootstrap commandBoard ships no note' do
      get scenario_game_url(build_game), as: :json
      assert_response :success
      refute_includes response.body, NOTE_BOARD
      board = response.parsed_body['commandBoard']
      assert_equal 'Ops', board['title']
      refute_includes board.keys, '_note'
    end

    test 'the room payload ships no NPC or object note, but ships "_" room ids and free-data minigame keys' do
      get room_game_url(build_game, room_id: 'lobby'), as: :json
      assert_response :success
      refute_includes response.body, NOTE_CREDS
      refute_includes response.body, NOTE_PIN
      # Free data under minigameData ships; a connection to a "_" room id ships.
      assert_includes response.body, FREE_MINIGAME
      assert_includes response.body, '_annex'
      body = response.parsed_body
      room = body['room'] || body
      guard = room['npcs'].find { |n| n['id'] == 'guard' }
      refute_includes guard.keys, '_creds_old'
      safe = room['objects'].find { |o| o['id'] == 'safe' }
      refute_includes safe.keys, '_draft'
    end

    test 'a "_" room reached by GET room/:id ships (an id, not a note)' do
      game = build_game('unlockedRooms' => %w[lobby _annex])
      get room_game_url(game, room_id: '_annex'), as: :json
      assert_response :success
    end

    test 'the container payload ships no note in its contents' do
      game = build_game
      get "/break_escape/games/#{game.id}/container/crate", as: :json
      assert_response :success
      refute_includes response.body, NOTE_PASS
      contents = response.parsed_body['contents']
      folder = contents.find { |i| i['id'] == 'folder' }
      refute_nil folder
      refute_includes folder.keys, '_note'
    end

    test 'the stored scenario_data still holds every note after the strips' do
      game = build_game
      get scenario_game_url(game), as: :json
      get room_game_url(game, room_id: 'lobby'), as: :json
      game.reload
      lobby = game.scenario_data['rooms']['lobby']
      guard = lobby['npcs'].find { |n| n['id'] == 'guard' }
      assert_equal({ 'password' => NOTE_CREDS }, guard['_creds_old'])
      board = lobby['objects'].find { |o| o['id'] == 'board' }
      assert_equal NOTE_BOARD, board.dig('commandBoard', '_note')
    end
  end
end
