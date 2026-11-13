require 'test_helper'

module BreakEscape
  # Answer-size guard for the player-state sync-delta work (SYNC_DELTAS_PLAN 10.2).
  #
  # The q77 rule: synced player state must stay bounded and change by delta. This test
  # builds games from the real scenarios through Game#generate_scenario_data, posts the
  # bodies the node test (10.1) committed to test/fixtures/files/sync_bodies/* through the
  # real routes, and asserts on response.body.bytesize only. It fails if a network answer
  # ever carries the cloner's saved_cards list, or if an answer grows past its bound.
  #
  # The GET /scenario bounds are the base commit's bootstrap sizes, measured by the builder
  # in the baseline run (section 9) and recorded in SYNC_DELTAS_BUILD_LOG.md's Baseline
  # table on base commit 6a834437c; a branch bootstrap must stay within base + 1 KB.
  class SyncPayloadSizeTest < ActionDispatch::IntegrationTest
    # GET /scenario bootstrap bytes on base commit 6a834437c (build log Baseline table).
    BASE_BOOTSTRAP_BYTES = {
      'test_access_networks' => 5_833,
      'test-rfid'            => 1_103,
      'lab_social_engineering' => 69_125,
      'lab_physical_pentest' => 23_762
    }.freeze

    FIXTURES = File.expand_path('../fixtures/files/sync_bodies', __dir__)

    def fixture_body(name)
      JSON.parse(File.read(File.join(FIXTURES, "#{name}.json")))
    end

    def game_path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    # Build a game from a real scenario folder, through the access model loader.
    def build_real_game(scenario_name, player_state = {})
      mission = Mission.create!(name: scenario_name, display_name: scenario_name, published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user))
      if player_state.any?
        @game.player_state = (@game.player_state || {}).merge(player_state)
        @game.save!
      end
      @game.reload
    end

    # A 50-card rfid_cloner in the game's inventory, the shape an old save written by
    # update_saved_cards has (SYNC_DELTAS_PLAN 10.2). No real route can fill such a list.
    def seed_legacy_cloner!
      cards = Array.new(50) do |n|
        { 'card_id' => "legacy-#{n}", 'name' => "Legacy card #{n}", 'rfid_protocol' => 'EM4100',
          'rfid_hex' => format('%010X', n), 'rfid_facility' => n % 256, 'rfid_card_number' => n,
          'rfid_data' => { 'cardId' => "legacy-#{n}", 'hex' => format('%010X', n), 'facility' => n % 256, 'cardNumber' => n },
          'timestamp' => 1_731_460_000_000 + n }
      end
      cloner = { 'id' => 'rfid_cloner', 'type' => 'rfid_cloner', 'name' => 'Card copier', 'saved_cards' => cards }
      @game.player_state['inventory'] = Array(@game.player_state['inventory']) + [cloner]
      @game.save!
      @game.reload
    end

    def no_saved_cards?(body)
      !body.to_json.include?('saved_cards')
    end

    # ---- POST /inventory: add and remove, with the legacy cloner held --------------------

    test 'inventory add and remove answer under 100 bytes and carry no saved_cards' do
      build_real_game('test_access_networks', 'inventory' => [{ 'id' => 'probe_item', 'type' => 'note', 'name' => 'Probe' }])
      seed_legacy_cloner!

      post game_path('inventory'), params: { action_type: 'add', item: { id: 'probe_item', type: 'note', name: 'Probe' } }, as: :json
      assert_response :success
      assert_operator response.body.bytesize, :<, 100, "add answer #{response.body.bytesize}B: #{response.body}"
      assert no_saved_cards?(JSON.parse(response.body)), 'add answer carries no saved_cards'

      post game_path('inventory'), params: { action_type: 'remove', item: { id: 'probe_item' } }, as: :json
      assert_response :success
      assert_operator response.body.bytesize, :<, 100, "remove answer #{response.body.bytesize}B: #{response.body}"
      assert no_saved_cards?(JSON.parse(response.body)), 'remove answer carries no saved_cards'
    end

    # ---- POST /network/*: delta answers, with the legacy cloner held ---------------------

    test 'network plant and unplug delta answers stay under 1500 bytes and carry no saved_cards' do
      build_real_game('test_access_networks', 'currentRoom' => 'comms_room',
                       'unlockedRooms' => %w[lobby comms_room desk_room workshop kiosk_room store])
      seed_legacy_cloner!
      # Hold the drop box so the plant succeeds and the unplug adds it back.
      post game_path('inventory'), params: { action_type: 'add', item: { type: 'pc', id: 'kit_dropbox', name: 'Network drop box' } }, as: :json

      post game_path('network/plant'), params: { jack_id: 'comms_port', delta: true }, as: :json
      plant = response
      assert_operator plant.body.bytesize, :<, 1500, "plant answer #{plant.body.bytesize}B: #{plant.body}"
      assert no_saved_cards?(JSON.parse(plant.body)), 'plant delta answer carries no saved_cards'

      post game_path('network/unplug'), params: { jack_id: 'comms_port', delta: true }, as: :json
      unplug = response
      assert_operator unplug.body.bytesize, :<, 1500, "unplug answer #{unplug.body.bytesize}B: #{unplug.body}"
      assert no_saved_cards?(JSON.parse(unplug.body)), 'unplug delta answer carries no saved_cards'
    end

    # ---- POST /clone_card: the MIFARE fixture --------------------------------------------

    test 'clone_card answers under 200 bytes' do
      build_real_game('test-rfid', 'encounteredNPCs' => ['security_guard'])
      body = fixture_body('clone_card_mifare')
      post game_path('clone_card'), params: body, as: :json
      assert_response :success
      answer = JSON.parse(response.body)
      assert answer['recorded'], "the clone records: #{response.body}"
      assert_operator response.body.bytesize, :<, 200, "clone_card answer #{response.body.bytesize}B: #{response.body}"
      assert no_saved_cards?(answer), 'clone_card answer carries no saved_cards'
    end

    # ---- PUT /sync_state: the capture fixtures -------------------------------------------

    test 'a lab_social_engineering credential capture answer stays under 600 bytes' do
      build_real_game('lab_social_engineering', 'currentRoom' => 'office', 'unlockedRooms' => ['office'])
      body = fixture_body('capture_sync_social')
      put game_path('sync_state'), params: body, as: :json
      assert_response :success
      answer = JSON.parse(response.body)
      assert answer.dig('captures', 'lord'), "the answer records lord: #{response.body}"
      assert_operator response.body.bytesize, :<, 600, "capture answer #{response.body.bytesize}B: #{response.body}"
    end

    test 'a lab_physical_pentest foothold capture answer carries the long note whole and stays under 1200 bytes' do
      build_real_game('lab_physical_pentest', 'currentRoom' => 'open_plan', 'unlockedRooms' => ['open_plan'])
      body = fixture_body('capture_sync_physical')
      put game_path('sync_state'), params: body, as: :json
      assert_response :success
      answer = JSON.parse(response.body)
      entry = answer.dig('captures', 'store_controller')
      assert entry, "the answer records store_controller: #{response.body}"
      # The note rides whole (SYNC_DELTAS_PLAN 10.2): the scenario's authored note, 693 chars.
      assert entry['note'].to_s.length > 600, "the note rides whole: #{entry['note'].to_s.length} chars"
      assert_operator response.body.bytesize, :<, 1200, "capture answer #{response.body.bytesize}B: #{response.body}"
    end

    # ---- GET /scenario: the whole bootstrap stays within base + 1 KB ---------------------

    test 'GET /scenario bootstrap stays within the base commit measure plus 1 KB' do
      BASE_BOOTSTRAP_BYTES.each do |scenario_name, base_bytes|
        build_real_game(scenario_name)
        get game_path('scenario'), as: :json
        assert_response :success
        size = response.body.bytesize
        assert_operator size, :<=, base_bytes + 1024,
                        "#{scenario_name} bootstrap #{size}B exceeds base #{base_bytes}B + 1 KB"
      end
    end
  end
end
