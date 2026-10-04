require 'test_helper'

module BreakEscape
  class PlayerPreferencesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @player = break_escape_demo_users(:test_user)
      # Ensure a preference record exists for the test player
      @preference = PlayerPreference.find_or_create_by!(
        player: @player
      ) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end
      # Guarantee the fields we expect
      @preference.update!(selected_sprite: 'female_hacker_hood_v2', in_game_name: 'TestAgent')
    end

    teardown do
      # Clean up preferences created during tests to avoid cross-test pollution
      PlayerPreference.where(player: @player).destroy_all
    end

    # ─── GET /configuration ──────────────────────────────────────────────────

    test 'show returns 200 and renders the configuration page' do
      get configuration_url
      assert_response :success
    end

    test 'show exposes available sprites to the view' do
      get configuration_url
      assert_response :success
      # The view uses @available_sprites; check that at least one known sprite is in the body
      assert_match(/female_hacker_hood/, response.body)
    end

    test 'show displays current player name and sprite' do
      get configuration_url
      assert_response :success
      assert_match(/TestAgent/, response.body)
    end

    # ─── PATCH /configuration — JSON ─────────────────────────────────────────

    test 'update with valid sprite and name returns JSON success' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'male_spy_v2', in_game_name: 'Agent99' } },
            headers: { 'Accept' => 'application/json' }

      assert_response :success
      json = JSON.parse(response.body)
      assert json['success']
      assert_equal 'male_spy_v2', json['data']['selected_sprite']
      assert_equal 'Agent99',  json['data']['in_game_name']

      @preference.reload
      assert_equal 'male_spy_v2', @preference.selected_sprite
      assert_equal 'Agent99',  @preference.in_game_name
    end

    test 'update persists selected_sprite to database' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'male_scientist_v2', in_game_name: 'TestAgent' } },
            headers: { 'Accept' => 'application/json' }

      assert_response :success
      @preference.reload
      assert_equal 'male_scientist_v2', @preference.selected_sprite
    end

    test 'update persists in_game_name to database' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'female_hacker_hood', in_game_name: 'HackerZero' } },
            headers: { 'Accept' => 'application/json' }

      assert_response :success
      @preference.reload
      assert_equal 'HackerZero', @preference.in_game_name
    end

    # ─── PATCH /configuration — validation failures ───────────────────────────

    test 'update returns 422 when sprite is not in the allowed list' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'invalid_sprite_xyz', in_game_name: 'TestAgent' } },
            headers: { 'Accept' => 'application/json' }

      assert_response :unprocessable_entity
      json = JSON.parse(response.body)
      assert_equal false, json['success']
      assert json['errors'].any?
    end

    test 'update returns 422 when in_game_name is blank' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'female_spy', in_game_name: '' } },
            headers: { 'Accept' => 'application/json' }

      assert_response :unprocessable_entity
      json = JSON.parse(response.body)
      assert_equal false, json['success']
    end

    test 'update returns 422 when in_game_name exceeds 20 characters' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'female_spy', in_game_name: 'A' * 21 } },
            headers: { 'Accept' => 'application/json' }

      assert_response :unprocessable_entity
      json = JSON.parse(response.body)
      assert_equal false, json['success']
    end

    test 'update returns 422 when in_game_name contains invalid characters' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'female_spy', in_game_name: 'Agent<script>' } },
            headers: { 'Accept' => 'application/json' }

      assert_response :unprocessable_entity
      json = JSON.parse(response.body)
      assert_equal false, json['success']
    end

    test 'update does not persist invalid data on failure' do
      original_sprite = @preference.selected_sprite

      patch configuration_url,
            params: { player_preference: { selected_sprite: 'totally_fake_sprite', in_game_name: 'TestAgent' } },
            headers: { 'Accept' => 'application/json' }

      assert_response :unprocessable_entity
      @preference.reload
      assert_equal original_sprite, @preference.selected_sprite
    end

    # ─── PATCH /configuration — HTML redirect ────────────────────────────────

    test 'update with valid params redirects to configuration page for HTML requests' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'male_nerd', in_game_name: 'Nerd42' } }

      assert_redirected_to configuration_url
    end

    test 'update with valid params and game_id redirects to the game' do
      mission = break_escape_missions(:ceo_exfil)
      game = Game.create!(
        mission: mission,
        player: @player,
        scenario_data: { 'startRoom' => 'lobby', 'rooms' => {} },
        player_state: {
          'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'],
          'unlockedObjects' => [], 'inventory' => [], 'encounteredNPCs' => [],
          'globalVariables' => {}, 'biometricSamples' => [], 'biometricUnlocks' => [],
          'bluetoothDevices' => [], 'notes' => [], 'health' => 100
        }
      )

      patch configuration_url,
            params: {
              game_id: game.id,
              player_preference: { selected_sprite: 'male_nerd', in_game_name: 'Nerd42' }
            }

      assert_redirected_to game_url(game)
    end

    # ─── PlayerPreferencePolicy ───────────────────────────────────────────────
    # In standalone mode current_player owns the preference, so show/update succeed.
    # The policy class is exercised implicitly via authorize(@player_preference).

    test 'policy allows the preference owner to view configuration' do
      get configuration_url
      # 200 proves Pundit did not raise NotAuthorizedError
      assert_response :success
    end

    test 'policy allows the preference owner to update configuration' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'female_scientist', in_game_name: 'TestAgent' } },
            headers: { 'Accept' => 'application/json' }
      assert_response :success
    end

    # ─── Scenario-scoped avatar filtering ────────────────────────────────────

    test 'all sprites are selectable when no game_id is given' do
      get configuration_url
      assert_response :success
      assert_select 'label.sprite-card.invalid', count: 0
    end

    test 'configuration screen with a female_* restriction marks male sprites as invalid' do
      game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: @player,
        scenario_data: { 'startRoom' => 'lobby', 'rooms' => {}, 'validSprites' => ['female_*'] },
        player_state: {
          'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'],
          'unlockedObjects' => [], 'inventory' => [], 'encounteredNPCs' => [],
          'globalVariables' => {}, 'biometricSamples' => [], 'biometricUnlocks' => [],
          'bluetoothDevices' => [], 'notes' => [], 'health' => 100
        }
      )

      get configuration_url(game_id: game.id)
      assert_response :success

      # Female sprites must be selectable: no invalid class, radio not disabled
      assert_select 'label.invalid[data-sprite="female_spy_v2"]', count: 0
      assert_select 'label.invalid[data-sprite="female_scientist_v2"]', count: 0
      assert_select 'input.sprite-radio[value="female_spy_v2"][disabled]', count: 0
      assert_select 'input.sprite-radio[value="female_scientist_v2"][disabled]', count: 0

      # Male sprites must be locked: invalid class + disabled radio
      assert_select 'label.invalid[data-sprite="male_spy_v2"]',    count: 1
      assert_select 'label.invalid[data-sprite="male_nerd_v2"]',   count: 1
      assert_select 'input.sprite-radio[value="male_spy_v2"][disabled]'
      assert_select 'input.sprite-radio[value="male_nerd_v2"][disabled]'
    end

    test 'configuration screen with a wildcard restriction marks all sprites as valid' do
      game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: @player,
        scenario_data: { 'startRoom' => 'lobby', 'rooms' => {}, 'validSprites' => ['*'] },
        player_state: {
          'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'],
          'unlockedObjects' => [], 'inventory' => [], 'encounteredNPCs' => [],
          'globalVariables' => {}, 'biometricSamples' => [], 'biometricUnlocks' => [],
          'bluetoothDevices' => [], 'notes' => [], 'health' => 100
        }
      )

      get configuration_url(game_id: game.id)
      assert_response :success
      assert_select 'label.sprite-card.invalid', count: 0
    end

    # ─── Available sprites constant ───────────────────────────────────────────

    test 'PlayerPreference::AVAILABLE_SPRITES offers only the v2 sprites' do
      sprites = PlayerPreference::AVAILABLE_SPRITES
      assert_includes sprites, 'female_hacker_hood_v2'
      assert_includes sprites, 'male_spy_v2'
      assert_includes sprites, 'male_hacker_hood_down_v2'
      assert_equal 16, sprites.length
      assert sprites.all? { |s| s.end_with?('_v2') }, "Menu should only offer v2 sprites: #{sprites.inspect}"
      assert_not_includes sprites, 'female_hacker_hood'
      assert_not_includes sprites, 'male_spy'
    end

    # Character atlases are loaded by key (systems/character-textures.js), so a menu
    # sprite only needs its atlas files in assets/characters.
    test 'every available sprite has an atlas the game can load by key' do
      characters = Engine.root.join('public/break_escape/assets/characters')
      PlayerPreference::AVAILABLE_SPRITES.each do |sprite|
        %w[png json].each do |ext|
          assert characters.join("#{sprite}.#{ext}").exist?, "menu sprite '#{sprite}' has no #{sprite}.#{ext}"
        end
      end
    end

    # ─── Legacy (pre-v2) sprite keys ─────────────────────────────────────────

    test 'LEGACY_SPRITES maps each original key to its v2 redraw' do
      assert_equal 'male_spy_v2', PlayerPreference::LEGACY_SPRITES['male_spy']
      assert_equal 'female_hacker_hood_down_v2', PlayerPreference::LEGACY_SPRITES['female_hacker_hood_down']
      assert_equal PlayerPreference::AVAILABLE_SPRITES.sort, PlayerPreference::LEGACY_SPRITES.values.sort
      assert_equal 'male_spy_v2', PlayerPreference.current_sprite('male_spy_v2')
      assert_nil PlayerPreference.current_sprite(nil)
    end

    test 'a saved legacy sprite reads back as its v2 key and stays valid' do
      @preference.update_column(:selected_sprite, 'male_spy')
      @preference.reload
      assert_equal 'male_spy', @preference.read_attribute_before_type_cast(:selected_sprite)
      assert_equal 'male_spy_v2', @preference.selected_sprite
      assert @preference.valid?, @preference.errors.full_messages.join(', ')
      assert @preference.sprite_valid_for_scenario?({ 'validSprites' => ['male_*'] })
    end

    test 'update accepts a legacy sprite key and stores the v2 key' do
      patch configuration_url,
            params: { player_preference: { selected_sprite: 'female_spy', in_game_name: 'TestAgent' } },
            headers: { 'Accept' => 'application/json' }

      assert_response :success
      assert_equal 'female_spy_v2', JSON.parse(response.body)['data']['selected_sprite']
      assert_equal 'female_spy_v2', @preference.reload.read_attribute_before_type_cast(:selected_sprite)
    end

    test 'configuration screen marks the v2 card selected for a saved legacy sprite' do
      @preference.update_column(:selected_sprite, 'male_nerd')
      get configuration_url
      assert_response :success
      assert_select 'label.sprite-card.selected[data-sprite="male_nerd_v2"]', count: 1
      assert_select 'label.sprite-card[data-sprite="male_nerd"]', count: 0
      assert_select 'label.sprite-card[data-sprite="male_nerd_v2"] .sprite-label', text: 'Male nerd'
    end

    test 'every available sprite has an atlas and a headshot on disk' do
      dir = Engine.root.join('public/break_escape/assets/characters')
      PlayerPreference::AVAILABLE_SPRITES.each do |sprite|
        %W[#{sprite}.png #{sprite}.json #{sprite}_headshot.png].each do |file|
          assert File.exist?(dir.join(file)), "Missing #{file} for menu sprite '#{sprite}'"
        end
      end
    end

    test 'an exact validSprites name also accepts its _v2 redraw, and nothing else' do
      scenario = { 'validSprites' => %w[male_hacker_hood female_hacker_hood_down] }
      @preference.update!(selected_sprite: 'male_hacker_hood_v2')
      assert @preference.sprite_valid_for_scenario?(scenario)
      @preference.update!(selected_sprite: 'female_hacker_hood_down_v2')
      assert @preference.sprite_valid_for_scenario?(scenario)
      @preference.update!(selected_sprite: 'male_hacker_hood_down_v2')
      assert_not @preference.sprite_valid_for_scenario?(scenario)
      @preference.update!(selected_sprite: 'male_security_guard_v2')
      assert_not @preference.sprite_valid_for_scenario?(scenario)
    end

    test 'configuration screen shows v2 hacker sprites as selectable under an exact validSprites list' do
      game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: @player,
        scenario_data: { 'startRoom' => 'lobby', 'rooms' => {}, 'validSprites' => %w[male_hacker_hood female_hacker_hood] },
        player_state: {
          'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'],
          'unlockedObjects' => [], 'inventory' => [], 'encounteredNPCs' => [],
          'globalVariables' => {}, 'biometricSamples' => [], 'biometricUnlocks' => [],
          'bluetoothDevices' => [], 'notes' => [], 'health' => 100
        }
      )

      get configuration_url(game_id: game.id)
      assert_response :success
      assert_select 'label.sprite-card[data-sprite="male_hacker_hood_v2"]', count: 1
      assert_select 'label.invalid[data-sprite="male_hacker_hood_v2"]', count: 0
      assert_select 'label.invalid[data-sprite="female_hacker_hood_v2"]', count: 0
      assert_select 'label.invalid[data-sprite="male_security_guard_v2"]', count: 1
      assert_select 'img.sprite-headshot[src^="/break_escape/assets/characters/female_security_guard_v2_headshot.png"]',
                    count: 1
    end

    test 'each available sprite is accepted by update' do
      # Spot-check a sample of sprites to ensure none are rejected by validation
      sample = PlayerPreference::AVAILABLE_SPRITES.first(4)
      sample.each do |sprite|
        patch configuration_url,
              params: { player_preference: { selected_sprite: sprite, in_game_name: 'TestAgent' } },
              headers: { 'Accept' => 'application/json' }
        assert_response :success, "Expected sprite '#{sprite}' to be accepted"
      end
    end
  end
end
