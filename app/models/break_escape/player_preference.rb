module BreakEscape
  class PlayerPreference < ApplicationRecord
    self.table_name = 'break_escape_player_preferences'

    # Associations
    belongs_to :player, polymorphic: true

    # Starter characters: always available outside a game and in a mission that
    # declares no validSprites. Every other character comes from a mission's
    # validSprites or is unlocked by completing a mission (see AvatarUnlocks).
    # A <key>_v2 entry is a redrawn version of <key>; it counts as <key> for validSprites.
    AVAILABLE_SPRITES = %w[
      female_hacker_hood_v2
      female_hacker_hood_down_v2
      female_office_worker_v2
      female_security_guard_v2
      female_telecom_v2
      female_scientist_v2
      female_blowse_v2
      male_hacker_hood_v2
      male_hacker_hood_down_v2
      male_office_worker_v2
      male_security_guard_v2
      male_telecom_v2
      male_spy_v2
      male_nerd_v2
    ].freeze

    # Original sprites replaced by a v2 redraw. Saved preferences and requests may still
    # name them; selected_sprite reads and writes them as the v2 key, so old rows keep
    # working without a data migration and the menu shows them as selected.
    LEGACY_SPRITES = AVAILABLE_SPRITES.to_h { |v2| [v2.delete_suffix('_v2'), v2] }.freeze

    # Sprites taken out of the avatar menu because they now belong to one story
    # character (male_scientist and male_scientist_v2 became Agent 0x47 "Nightshade",
    # the m08 mole; female_spy and female_spy_v2 became Agent HaX, key agent_hax).
    # A player whose saved selection names one of them is moved to
    # RETIRED_FALLBACK_SPRITE on read, so their game still loads and the preferences
    # page and updates still validate.
    RETIRED_SPRITES = %w[male_scientist male_scientist_v2 female_spy female_spy_v2].freeze
    RETIRED_FALLBACK_SPRITE = 'male_hacker_hood_v2'

    # Sprite the avatar menu previews before the player has chosen one. selected_sprite
    # itself stays NULL until the player picks (see set_defaults).
    DEFAULT_SPRITE = 'female_hacker_hood_v2'

    # Map a legacy sprite key to its v2 replacement; other keys pass through unchanged.
    def self.current_sprite(sprite_name)
      return RETIRED_FALLBACK_SPRITE if RETIRED_SPRITES.include?(sprite_name)

      LEGACY_SPRITES.fetch(sprite_name, sprite_name)
    end

    # Get the texture key for game injection (must match game.js preload keys)
    def self.sprite_filename(sprite_name)
      sprite_name
    end

    # Validations
    validates :player, presence: true
    validate :selected_sprite_available
    validates :in_game_name, presence: true, length: { in: 1..20 }, format: {
      with: /\A[a-zA-Z0-9_ ]+\z/,
      message: 'only allows letters, numbers, spaces, and underscores'
    }

    # Callbacks
    before_validation :set_defaults, on: :create

    # Avatars this player has unlocked by completing missions (see AvatarUnlocks):
    # { sprite => { 'sprite', 'name', 'missions' } }. Memoised per instance;
    # reload or a new instance picks up later unlocks.
    def unlocked_avatars
      @unlocked_avatars ||= AvatarUnlocks.for_player(player)
    end

    # Scenario of the game the player is choosing for, when there is one: its
    # validSprites decide which characters are always available. Set by the
    # controllers before an update so validation sees the menu the player saw.
    attr_accessor :scenario_context

    # Sprites the player can choose: the mission's own characters (see
    # AvatarUnlocks.mission_sprites) and every character they have unlocked.
    def available_sprites(scenario_data = scenario_context)
      (AvatarUnlocks.mission_sprites(scenario_data) + unlocked_avatars.keys).uniq
    end

    # The full menu, locked characters included (see AvatarUnlocks.menu).
    def avatar_menu(scenario_data = scenario_context)
      AvatarUnlocks.menu(unlocked_avatars, scenario_data)
    end

    def reload(*)
      @unlocked_avatars = nil
      super
    end

    # Check if selected sprite is valid for a given scenario
    def sprite_valid_for_scenario?(scenario_data)
      # If no sprite selected, invalid (player must choose)
      return false if selected_sprite.blank?

      available_sprites(scenario_data).include?(selected_sprite)
    end

    # Pattern matching for sprite validation
    # Supports:
    # - Exact match: "female_hacker"
    # - Wildcard: "female_*" (all female sprites)
    # - Wildcard: "*_hacker" (all hacker sprites)
    # - Wildcard: "*" (all sprites)
    # A redrawn "<key>_v2" sprite also matches any pattern its "<key>" matches, so a
    # scenario listing "male_hacker_hood" accepts "male_hacker_hood_v2" as well.
    def self.sprite_matches_pattern?(sprite, pattern)
      return true if pattern == '*'

      # Convert wildcard pattern to regex
      regex_pattern = Regexp.escape(pattern).gsub('\*', '.*')
      regex = /\A#{regex_pattern}\z/

      sprite.match?(regex) || sprite.delete_suffix('_v2').match?(regex)
    end

    def selected_sprite
      self.class.current_sprite(super)
    end

    def selected_sprite=(value)
      super(self.class.current_sprite(value))
    end

    # Check if player has selected a sprite
    def sprite_selected?
      selected_sprite.present?
    end

    private

    # Checked only when the sprite changes, so renaming outside a game keeps a
    # character that only the previous mission made available.
    def selected_sprite_available
      return if selected_sprite.nil? || !will_save_change_to_selected_sprite?
      return if available_sprites.include?(selected_sprite)

      errors.add(:selected_sprite, 'is not available')
    end

    def set_defaults
      # Seed in_game_name from player.handle if available
      if in_game_name.blank? && player.respond_to?(:handle) && player.handle.present?
        self.in_game_name = player.handle
      end

      # Fallback to 'Zero' if still blank
      self.in_game_name = 'Zero' if in_game_name.blank?

      # NOTE: selected_sprite left NULL - player MUST choose before first game
    end
  end
end
