require 'test_helper'
require 'minitest/mock'

module BreakEscape
  class AvatarUnlocksTest < ActiveSupport::TestCase
    # nightshade and agent_hax have full 8-direction atlases and headshots;
    # bed_mr_pryce is a bed sprite (no walk atlas); male_spy_v2 is already in the menu.
    SCENARIO = {
      'startRoom' => 'lobby',
      'rooms' => {
        'lobby' => { 'npcs' => [
          { 'id' => 'mole', 'displayName' => 'Nightshade', 'npcType' => 'person', 'spriteSheet' => 'nightshade' },
          { 'id' => 'handler', 'displayName' => 'Agent HaX', 'npcType' => 'person', 'spriteSheet' => 'agent_hax' },
          { 'id' => 'patient', 'displayName' => 'Mr Pryce', 'npcType' => 'person', 'spriteSheet' => 'bed_mr_pryce' },
          { 'id' => 'guard', 'displayName' => 'Guard', 'npcType' => 'person', 'spriteSheet' => 'male_spy_v2' }
        ] },
        'vault' => { 'npcs' => [
          { 'id' => 'ravi', 'displayName' => 'Ravi Anand', 'npcType' => 'person', 'spriteSheet' => 'ravi_anand' }
        ] }
      }
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @player = break_escape_demo_users(:test_user)
      Game.where(player: @player).destroy_all
      PlayerPreference.where(player: @player).destroy_all
    end

    def create_game(encountered:, scenario: SCENARIO)
      Game.create!(mission: @mission, player: @player,
                   scenario_data: scenario.deep_dup,
                   player_state: { 'unlockedRooms' => ['lobby'], 'encounteredNPCs' => encountered })
    end

    def conclude(game)
      game.update!(status: 'completed', mission_concluded_at: Time.current)
    end

    test 'avatar_sprite? needs a walk atlas and a headshot' do
      assert AvatarUnlocks.avatar_sprite?('nightshade')
      refute AvatarUnlocks.avatar_sprite?('bed_mr_pryce')
      refute AvatarUnlocks.avatar_sprite?('no_such_sprite')
      refute AvatarUnlocks.avatar_sprite?('../nightshade')
    end

    test 'an in-progress game unlocks nothing' do
      game = create_game(encountered: %w[mole])
      assert_nil game.reload.player_state['unlockedAvatars']
      assert_empty AvatarUnlocks.for_player(@player)
    end

    test 'completing a game stores the encountered NPCs whose sprites can be avatars' do
      game = create_game(encountered: %w[mole patient guard])
      conclude(game)

      stored = game.reload.player_state['unlockedAvatars']
      assert_equal [{ 'sprite' => 'nightshade', 'name' => 'Nightshade', 'npcId' => 'mole' },
                    { 'sprite' => 'male_spy_v2', 'name' => 'Guard', 'npcId' => 'guard' }], stored
    end

    test 'NPCs never encountered are not unlocked' do
      conclude(create_game(encountered: %w[mole]))
      unlocked = AvatarUnlocks.for_player(@player)
      assert_equal %w[nightshade], unlocked.keys
      assert_equal [@mission.display_name], unlocked['nightshade']['missions']
    end

    test 'NPCs met after completion are added, and a reset keeps the unlocks' do
      game = create_game(encountered: %w[mole])
      conclude(game)
      game.player_state['encounteredNPCs'] << 'ravi'
      game.save!
      assert_equal %w[nightshade ravi_anand], game.reload.player_state['unlockedAvatars'].map { |e| e['sprite'] }

      game.reset_player_state!
      assert_equal %w[nightshade ravi_anand], game.reload.player_state['unlockedAvatars'].map { |e| e['sprite'] }
    end

    test 'unlockableAvatar false withholds an NPC' do
      scenario = SCENARIO.deep_dup
      scenario['rooms']['lobby']['npcs'][0]['unlockableAvatar'] = false
      conclude(create_game(encountered: %w[mole handler], scenario: scenario))
      assert_equal %w[agent_hax], AvatarUnlocks.for_player(@player).keys
    end

    test 'a game completed before unlocks were recorded is backfilled' do
      game = create_game(encountered: %w[mole])
      conclude(game)
      game.player_state.delete('unlockedAvatars')
      game.update_column(:player_state, game.player_state)

      assert_equal %w[nightshade], AvatarUnlocks.for_player(@player).keys
      assert_equal 'nightshade', game.reload.player_state['unlockedAvatars'].first['sprite']
    end

    test 'preferences offer and accept unlocked avatars only' do
      pref = PlayerPreference.create!(player: @player, selected_sprite: 'female_hacker_hood_v2')
      pref.selected_sprite = 'nightshade'
      refute pref.valid?

      conclude(create_game(encountered: %w[mole]))
      pref = PlayerPreference.find(pref.id)
      assert_includes pref.available_sprites, 'nightshade'
      pref.selected_sprite = 'nightshade'
      assert pref.valid?, pref.errors.full_messages.inspect
    end

    test 'an unlocked character is choosable in any mission, including one they appear in' do
      conclude(create_game(encountered: %w[mole]))
      pref = PlayerPreference.create!(player: @player, selected_sprite: 'nightshade')

      assert pref.sprite_valid_for_scenario?(SCENARIO)
      assert pref.sprite_valid_for_scenario?(SCENARIO.merge('validSprites' => %w[female_hacker_hood]))
      assert pref.sprite_valid_for_scenario?(nil)
    end

    test 'the catalogue reads the published missions, real templates included' do
      Mission.create!(name: 'm08_the_mole', display_name: 'The Mole', published: true)
      Mission.create!(name: 'm01_first_contact', display_name: 'First Contact', published: true)
      catalogue = AvatarUnlocks.catalogue
      assert_includes catalogue.keys, 'nightshade'
      assert_includes catalogue['nightshade']['missions'], 'The Mole'
      # Starter sprites are characters too, named after the NPC who wears them.
      # (m01's Sarah O'Brien; m08's analyst got her own sprite on 2026-10-17.)
      assert_includes catalogue.keys, 'male_hacker_hood_v2'
      refute_equal 'Female office worker', catalogue['female_office_worker_v2']['name']
      assert_includes catalogue['female_office_worker_v2']['missions'], 'First Contact'
    end

    CATALOGUE = {
      'female_hacker_hood_v2' => { 'sprite' => 'female_hacker_hood_v2', 'name' => 'Female hacker hood', 'missions' => [] },
      'male_hacker_hood_v2' => { 'sprite' => 'male_hacker_hood_v2', 'name' => 'Male hacker hood', 'missions' => [] },
      'male_spy_v2' => { 'sprite' => 'male_spy_v2', 'name' => 'Guard', 'missions' => ['First Contact'] },
      'nightshade' => { 'sprite' => 'nightshade', 'name' => 'Nightshade', 'missions' => ['The Mole'] },
      'netherton' => { 'sprite' => 'netherton', 'name' => 'Director Netherton', 'missions' => ['The Mole'] }
    }.freeze

    test 'the menu lists the mission characters, then unlocked, then locked' do
      conclude(create_game(encountered: %w[mole]))
      pref = PlayerPreference.create!(player: @player, selected_sprite: 'female_hacker_hood_v2')
      scenario = SCENARIO.merge('validSprites' => %w[female_hacker_hood male_hacker_hood])

      menu = AvatarUnlocks.stub(:catalogue, CATALOGUE.deep_dup) { pref.avatar_menu(scenario) }

      assert_equal %w[female_hacker_hood_v2 male_hacker_hood_v2 nightshade male_spy_v2 netherton], menu.map { |e| e['sprite'] }
      assert_equal %w[mission mission unlocked locked locked], menu.map { |e| e['status'] }
      assert_equal 'Guard', menu[3]['name'], 'every character is named after their NPC'
      assert_equal [@mission.display_name], menu[2]['missions']
    end

    test 'without validSprites or a game, the starter set is the always-available list' do
      pref = PlayerPreference.create!(player: @player, selected_sprite: 'female_hacker_hood_v2')
      menu = AvatarUnlocks.stub(:catalogue, CATALOGUE.deep_dup) { pref.avatar_menu(nil) }
      starter = menu.select { |e| e['status'] == 'starter' }.map { |e| e['sprite'] }
      assert_equal PlayerPreference::AVAILABLE_SPRITES, starter
      assert_equal %w[nightshade netherton], menu.select { |e| e['status'] == 'locked' }.map { |e| e['sprite'] }
    end

    test 'a validSprites character is choosable only in that mission' do
      Mission.create!(name: 'm08_the_mole', display_name: 'The Mole', published: true)
      pref = PlayerPreference.create!(player: @player, selected_sprite: 'female_hacker_hood_v2')
      scenario = { 'rooms' => {}, 'validSprites' => %w[netherton] }

      pref.scenario_context = scenario
      pref.selected_sprite = 'netherton'
      assert pref.valid?, pref.errors.full_messages.inspect
      pref.save!
      assert pref.sprite_valid_for_scenario?(scenario)

      fresh = PlayerPreference.find(pref.id)
      refute fresh.sprite_valid_for_scenario?({ 'rooms' => {} }), 'not available in a mission without it'
      fresh.in_game_name = 'Renamed'
      assert fresh.valid?, 'renaming keeps the character'
    end

    test 'a sprite with no walk atlas is never an avatar' do
      conclude(create_game(encountered: %w[patient]))
      assert_empty AvatarUnlocks.for_player(@player)
    end
  end
end
