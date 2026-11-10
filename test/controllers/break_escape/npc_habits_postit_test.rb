require 'test_helper'

module BreakEscape
  # Slice 9.1 step 2 (ACCESS_MODEL_SLICE_9_1_PLAN.md, 5.3 and 6): a writesDown owner's sticky
  # note. Room data says only that a note is there (hasPostit); the text, "<username> /
  # <password>", is served only by GET /login_accounts for the owner's own reachable sign-in
  # PC, sent no-store. With the no-password test's writesDown variant.
  class NpcHabitsPostitTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    OMAR_PASSWORD = 'Omar-Note-PW-7731'.freeze
    IAN_PASSWORD = 'Ian-Plain-PW-2208'.freeze
    NOTE = "ohaddad / #{OMAR_PASSWORD}".freeze
    AUTHORED_NOTE = 'Printer code 4410'.freeze

    def scenario(office_locked: false)
      office = {
        'type' => 'room_office', 'connections' => { 'south' => 'lobby' },
        'objects' => [
          { 'id' => 'omar_pc', 'type' => 'pc', 'name' => "Omar's PC", 'locked' => true, 'lockType' => 'login',
            'contents' => [{ 'type' => 'text_file', 'name' => 'a.txt', 'text' => 'a' }] },
          { 'id' => 'ian_pc', 'type' => 'pc', 'name' => "Ian's PC", 'locked' => true, 'lockType' => 'login' },
          { 'id' => 'hot_desk', 'type' => 'pc', 'name' => 'Hot desk', 'locked' => true, 'lockType' => 'login' },
          { 'id' => 'noted_pc', 'type' => 'pc', 'name' => 'Noted PC', 'locked' => true, 'lockType' => 'login',
            'screenOwner' => 'omar', 'postitNote' => AUTHORED_NOTE },
          { 'id' => 'hidden_pc', 'type' => 'pc', 'name' => 'Hidden PC', 'locked' => true, 'lockType' => 'login',
            'screenOwner' => 'omar', 'showPostit' => false },
          { 'id' => 'len_pc', 'type' => 'pc', 'name' => "Len's PC", 'locked' => true, 'lockType' => 'login',
            'screenOwner' => 'len' }
        ],
        'npcs' => [
          { 'id' => 'omar', 'displayName' => 'Omar Haddad', 'npcType' => 'person', 'position' => { 'x' => 3, 'y' => 3 },
            'creds' => { 'username' => 'ohaddad', 'password' => OMAR_PASSWORD },
            'awareness' => 'high', 'habits' => { 'writesDown' => true }, 'needsHome' => 'omar_pc' },
          { 'id' => 'ian', 'displayName' => 'Ian Shaw', 'npcType' => 'person', 'position' => { 'x' => 5, 'y' => 3 },
            'creds' => { 'username' => 'ishaw', 'password' => IAN_PASSWORD },
            'awareness' => 'high', 'needsHome' => 'ian_pc' },
          { 'id' => 'len', 'displayName' => 'Len', 'npcType' => 'person', 'position' => { 'x' => 7, 'y' => 3 },
            'habits' => { 'writesDown' => true } }
        ]
      }
      office.merge!('locked' => true, 'lockType' => 'pin', 'requires' => '9182') if office_locked
      { 'scenario_brief' => 'postit fixture', 'startRoom' => 'lobby',
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => { 'north' => 'office' } },
                     'office' => office } }
    end

    def build(office_locked: false, data: nil, player_state: {})
      unlocked = office_locked ? ['lobby'] : %w[lobby office]
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
        scenario: data || scenario(office_locked: office_locked),
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => unlocked }.merge(player_state)
      )
    end

    def accounts(pc_id)
      get login_accounts_game_url(@game), params: { pc_id: pc_id }
    end

    def assert_no_store
      assert_equal 'no-store', response.headers['Cache-Control'], response.body
    end

    test "GET /login_accounts carries the note only for the writesDown owner's own PC, always no-store" do
      build
      accounts('omar_pc')
      assert_response :success
      assert_no_store
      assert_equal NOTE, response.parsed_body['postitNote']
      assert_equal 'omar_pc', response.parsed_body['pc_id']

      %w[hot_desk ian_pc noted_pc hidden_pc len_pc].each do |pc_id|
        accounts(pc_id)
        assert_response :success
        assert_no_store
        refute response.parsed_body.key?('postitNote'), pc_id
        refute_includes response.body, OMAR_PASSWORD, pc_id
      end

      accounts('no_such_pc')
      assert_response :not_found
      assert_no_store
    end

    test 'room data marks omar_pc with hasPostit and holds no note text for it' do
      build
      room = @game.filtered_room_data('office')
      flags = room['objects'].to_h { |o| [o['id'], o['hasPostit']] }
      assert_equal true, flags['omar_pc']
      %w[ian_pc hot_desk noted_pc hidden_pc len_pc].each { |id| assert_nil flags[id], id }
      noted = room['objects'].find { |o| o['id'] == 'noted_pc' }
      assert_equal AUTHORED_NOTE, noted['postitNote'], 'the authored note still ships in room data'
      refute_includes room.to_json, OMAR_PASSWORD
    end

    test "with omar_pc's room locked the route answers 403 and no password" do
      build(office_locked: true)
      accounts('omar_pc')
      assert_response :forbidden
      assert_no_store
      refute_includes response.body, OMAR_PASSWORD
    end

    test 'the no-password test, writesDown variant: only /login_accounts for omar_pc, then savedNotes' do
      build(office_locked: true)
      seen = lambda do |context|
        refute_includes response.body, OMAR_PASSWORD, "#{context} leaks Omar's password"
        refute_includes response.body, IAN_PASSWORD, "#{context} leaks Ian's password"
      end

      get scenario_game_url(@game), as: :json
      assert_response :success
      seen.call('/scenario')
      post unlock_game_url(@game), params: { targetType: 'door', targetId: 'office', attempt: '9182', method: 'pin' }, as: :json
      assert_response :success, response.body
      assert response.parsed_body['roomData']['objects'].find { |o| o['id'] == 'omar_pc' }['hasPostit']
      seen.call('door /unlock')
      get room_game_url(@game, room_id: 'office'), as: :json
      assert_response :success
      seen.call('/room/office')
      get "/break_escape/games/#{@game.id}/container/omar_pc", as: :json
      seen.call('/container/omar_pc signed out')
      get capture_secrets_game_url(@game), as: :json
      seen.call('/capture_secrets')
      %w[ian_pc hot_desk noted_pc hidden_pc len_pc].each do |pc_id|
        accounts(pc_id)
        seen.call("/login_accounts #{pc_id}")
      end

      accounts('omar_pc')
      assert_equal NOTE, response.parsed_body['postitNote']

      # The player saves the note: only the client writes notes.
      put sync_state_game_url(@game), params: { notes: [{ 'id' => 'note_omar', 'title' => "Omar's PC", 'text' => NOTE }] },
                                      as: :json
      assert_response :success
      seen.call('the sync answer')
      get scenario_game_url(@game), as: :json
      assert_includes response.parsed_body['savedNotes'].map { |n| n['text'] }, NOTE
      get room_game_url(@game, room_id: 'office'), as: :json
      seen.call('/room/office after the note was saved')
      get "/break_escape/games/#{@game.id}/container/omar_pc", as: :json
      seen.call('/container/omar_pc after the note was saved')
      %w[ian_pc hot_desk].each do |pc_id|
        accounts(pc_id)
        seen.call("/login_accounts #{pc_id} after the note was saved")
      end
    end

    test 'a game whose scenario data has no expanded habits serves no note' do
      data = scenario
      data['rooms']['office']['npcs'][0].delete('habits')
      data['rooms']['office']['npcs'][0].delete('awareness')
      @game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                           scenario_data: data,
                           player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office] })
      accounts('omar_pc')
      assert_response :success
      refute response.parsed_body.key?('postitNote')
      assert_nil @game.reload.filtered_room_data('office')['objects'].find { |o| o['id'] == 'omar_pc' }['hasPostit']
    end
  end
end
