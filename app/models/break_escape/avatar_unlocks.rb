module BreakEscape
  # Character avatars a player unlocks by finishing missions.
  #
  # When a game is completed (status 'completed' or mission_concluded_at set),
  # every NPC the player encountered in it (player_state['encounteredNPCs'])
  # whose sprite works as a player avatar is written to that game's
  # player_state['unlockedAvatars'] as { 'sprite', 'name', 'npcId' }. A player's
  # unlocked avatars are the union of that list over all their completed games.
  # Game#record_avatar_unlocks keeps the list current; for_player backfills
  # games completed before the list existed.
  #
  # An NPC's sprite is unlockable when its atlas has walk and idle animations
  # in all 8 directions and it has a headshot for the menu (so bed patients and
  # placeholder sprites never qualify). A scenario can withhold one with
  # "unlockableAvatar": false on the NPC.
  #
  # Every character is treated as named: the menu (menu) lists every avatar
  # sprite, named after the NPC who wears it. A mission's own characters come
  # first and are always available in it: those its validSprites patterns
  # match, or the starter set (PlayerPreference::AVAILABLE_SPRITES) when it
  # declares none or there is no mission. Then the characters the player has
  # unlocked, also choosable, then the rest, locked.
  module AvatarUnlocks
    STATE_KEY = 'unlockedAvatars'.freeze
    DIRECTIONS = %w[north north-east east south-east south south-west west north-west].freeze
    REQUIRED_ANIMATIONS = %w[walk breathing-idle].freeze

    # sprite key -> true/false; atlases don't change while the server runs
    @avatar_sprite_cache = Concurrent::Map.new

    class << self
      # True when the sprite key can be used as a player avatar.
      def avatar_sprite?(sprite)
        return false unless sprite.is_a?(String) && sprite.match?(/\A[a-z0-9_]+\z/)

        @avatar_sprite_cache.compute_if_absent(sprite) { check_atlas(sprite) }
      end

      # Avatar unlocks earned in one game: its encountered NPCs with an
      # unlockable sprite, one entry per sprite (first NPC met wins the name).
      def for_game(game)
        encountered = Array(game.player_state&.dig('encounteredNPCs'))
        return [] if encountered.empty?

        npcs = scenario_npcs(game.scenario_data)
        encountered.filter_map { |npc_id| npc_entry(npcs[npc_id]) }.uniq { |e| e['sprite'] }
      end

      # Every NPC in a scenario that could unlock an avatar, one per sprite.
      def candidates(scenario_data)
        scenario_npcs(scenario_data).values.filter_map { |npc| npc_entry(npc) }
                                    .uniq { |e| e['sprite'] }
                                    .map { |e| e.except('npcId') }
      end

      # sprite => { 'sprite', 'name', 'missions' } for every avatar: the NPCs of
      # the published missions in mission name order (m01 first; the first NPC
      # to wear a sprite names it), then starter sprites no NPC wears. Each
      # Mission caches its own part.
      def catalogue
        entries = Mission.published.order(:name).each_with_object({}) do |mission, acc|
          mission.avatar_candidates.each do |entry|
            item = acc[entry['sprite']] ||= entry.merge('missions' => [])
            item['missions'] |= [mission.display_name]
          end
        end
        PlayerPreference::AVAILABLE_SPRITES.each do |sprite|
          entries[sprite] ||= { 'sprite' => sprite, 'name' => sprite.delete_suffix('_v2').humanize, 'missions' => [] }
        end
        entries
      end

      # Sprites always available in a scenario: those its validSprites patterns
      # match among the catalogued avatars, or the starter set when it declares
      # none (or there is no scenario).
      def mission_sprites(scenario_data, catalogue_entries = catalogue)
        patterns = scenario_data.is_a?(Hash) ? Array(scenario_data['validSprites']) : []
        return PlayerPreference::AVAILABLE_SPRITES.dup if patterns.empty?

        catalogue_entries.keys.select do |sprite|
          patterns.any? { |pattern| PlayerPreference.sprite_matches_pattern?(sprite, pattern) }
        end
      end

      # The avatar menu for a player, optionally inside one game's scenario:
      # [{ 'sprite', 'name', 'status', 'missions' }] where status is 'mission'
      # (always available in this scenario; 'starter' with no scenario),
      # 'unlocked' or 'locked', listed in that order.
      # 'missions' names the completed missions that unlocked a character, or
      # the missions a character appears in.
      def menu(unlocked, scenario_data = nil)
        catalogue_entries = catalogue
        here = mission_sprites(scenario_data, catalogue_entries)
        entry_for = lambda do |sprite|
          catalogue_entries[sprite] || { 'sprite' => sprite, 'name' => sprite.humanize, 'missions' => [] }
        end

        here_status = scenario_data.is_a?(Hash) ? 'mission' : 'starter'
        mission = here.map { |sprite| entry_for.call(sprite).merge('status' => here_status) }
        earned = unlocked.values.reject { |u| here.include?(u['sprite']) }
                         .map { |u| u.merge('status' => 'unlocked') }
        locked = catalogue_entries.values.reject { |c| here.include?(c['sprite']) || unlocked.key?(c['sprite']) }
                                  .map { |c| c.merge('status' => 'locked') }

        mission + earned + locked
      end

      # The player's unlocked avatars across all completed games, keyed by
      # sprite: { sprite => { 'sprite', 'name', 'missions' => [mission titles] } }.
      def for_player(player)
        return {} if player.nil?

        unlocked = {}
        completed_games(player).each do |game_id, mission_title, stored|
          entries = stored.is_a?(Array) ? stored : backfill(game_id)
          entries.each do |entry|
            next unless entry.is_a?(Hash) && unlockable_sprite?(entry['sprite'])

            item = unlocked[entry['sprite']] ||= { 'sprite' => entry['sprite'], 'name' => entry['name'], 'missions' => [] }
            item['missions'] |= [mission_title].compact
          end
        end
        unlocked
      end

      def unlockable_sprite?(sprite)
        sprite.present? && avatar_sprite?(sprite)
      end

      private

      def npc_entry(npc)
        return nil unless npc.is_a?(Hash) && npc['unlockableAvatar'] != false

        sprite = npc['spriteSheet']
        return nil unless unlockable_sprite?(sprite)

        { 'sprite' => sprite, 'name' => npc['displayName'].presence || sprite.humanize, 'npcId' => npc['id'] }
      end

      def completed_games(player)
        Game.where(player: player)
            .where("#{Game.table_name}.status = 'completed' OR #{Game.table_name}.mission_concluded_at IS NOT NULL")
            .left_joins(:mission)
            .pluck(:id, "#{Mission.table_name}.display_name",
                   Arel.sql("#{Game.table_name}.player_state -> '#{STATE_KEY}'"))
      end

      # A game completed before unlocks were recorded: work its list out once
      # and store it. update_column skips callbacks and updated_at, so the old
      # game's sync clock and completion hooks are untouched.
      def backfill(game_id)
        game = Game.find_by(id: game_id)
        return [] unless game

        entries = for_game(game)
        game.player_state[STATE_KEY] = entries
        game.update_column(:player_state, game.player_state)
        entries
      rescue StandardError => e
        Rails.logger.error "[BreakEscape] Avatar unlock backfill failed for game #{game_id}: #{e.class}: #{e.message}"
        []
      end

      # npc id -> npc definition, for NPCs with a world sprite
      def scenario_npcs(scenario_data)
        rooms = scenario_data.is_a?(Hash) ? scenario_data['rooms'] : nil
        return {} unless rooms.is_a?(Hash)

        rooms.values.each_with_object({}) do |room, acc|
          next unless room.is_a?(Hash) && room['npcs'].is_a?(Array)

          room['npcs'].each do |npc|
            next unless npc.is_a?(Hash) && npc['id'].present? && %w[person both].include?(npc['npcType'])

            acc[npc['id']] ||= npc
          end
        end
      end

      def check_atlas(sprite)
        dir = BreakEscape::Engine.root.join('public', 'break_escape', 'assets', 'characters')
        atlas = dir.join("#{sprite}.json")
        return false unless atlas.file? && dir.join("#{sprite}_headshot.png").file?

        animations = JSON.parse(atlas.read)['animations']
        return false unless animations.is_a?(Hash)

        REQUIRED_ANIMATIONS.all? do |anim|
          DIRECTIONS.all? { |dir_name| animations.key?("#{anim}_#{dir_name}") }
        end
      rescue JSON::ParserError, SystemCallError
        false
      end
    end
  end
end
