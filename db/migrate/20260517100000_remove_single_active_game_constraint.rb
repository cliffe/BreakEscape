class RemoveSingleActiveGameConstraint < ActiveRecord::Migration[7.0]
  def up
    # Remove the partial unique index that limited players to one in-progress
    # game per mission. Players can now have multiple concurrent game instances.
    remove_index :break_escape_games,
                 name: 'idx_break_escape_games_one_active_per_player_mission',
                 if_exists: true
  end

  def down
    # Restore the partial unique index (one active game per player+mission)
    add_index :break_escape_games,
              [:player_type, :player_id, :mission_id],
              name: 'idx_break_escape_games_one_active_per_player_mission',
              unique: true,
              where: "status = 'in_progress'"
  end
end
