module BreakEscape
  class PlayerPreference < ApplicationRecord
    self.table_name = 'break_escape_player_preferences'

    # Associations
    belongs_to :player, polymorphic: true

    # Constants - Available sprite sheets (must match game.js preload and assets on disk).
    # A <key>_v2 entry is a redrawn version of <key>; it counts as <key> for validSprites.
    AVAILABLE_SPRITES = %w[
      female_hacker_hood
      female_hacker_hood_v2
      female_hacker_hood_down
      female_hacker_hood_down_v2
      female_office_worker
      female_security_guard
      female_security_guard_v2
      female_telecom
      female_spy
      female_scientist
      female_blowse
      male_hacker_hood
      male_hacker_hood_v2
      male_hacker_hood_down
      male_hacker_hood_down_v2
      male_office_worker
      male_security_guard
      male_security_guard_v2
      male_telecom
      male_spy
      male_scientist
      male_nerd
    ].freeze

    # Get the texture key for game injection (must match game.js preload keys)
    def self.sprite_filename(sprite_name)
      sprite_name
    end

    # Validations
    validates :player, presence: true
    validates :selected_sprite, inclusion: { in: AVAILABLE_SPRITES }, allow_nil: true
    validates :in_game_name, presence: true, length: { in: 1..20 }, format: {
      with: /\A[a-zA-Z0-9_ ]+\z/,
      message: 'only allows letters, numbers, spaces, and underscores'
    }

    # Callbacks
    before_validation :set_defaults, on: :create

    # Check if selected sprite is valid for a given scenario
    def sprite_valid_for_scenario?(scenario_data)
      # If no sprite selected, invalid (player must choose)
      return false if selected_sprite.blank?

      # If scenario has no restrictions, any sprite is valid
      return true unless scenario_data['validSprites'].present?

      valid_sprites = Array(scenario_data['validSprites'])

      # Check if sprite matches any pattern
      valid_sprites.any? do |pattern|
        self.class.sprite_matches_pattern?(selected_sprite, pattern)
      end
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

    # Check if player has selected a sprite
    def sprite_selected?
      selected_sprite.present?
    end

    private

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
