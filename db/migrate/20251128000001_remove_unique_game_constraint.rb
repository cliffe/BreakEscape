# frozen_string_literal: true

# Remove unique constraint on games to allow multiple games per player+mission
# This is needed for VM/CTF flag integration where each VM set gets its own game instance
class RemoveUniqueGameConstraint < ActiveRecord::Migration[7.0]
  def change
    # Remove the unique index
    remove_index :break_escape_games,
                 name: 'index_games_on_player_and_mission',
                 if_exists: true

    # Add non-unique index for performance
    # This maintains query performance without enforcing uniqueness
    add_index :break_escape_games,
              [:player_type, :player_id, :mission_id],
              name: 'index_games_on_player_and_mission_non_unique'
  end
end
