class FixUniqueGameConstraint < ActiveRecord::Migration[7.0]
  def up
    # Drop the unique index if it exists
    execute 'DROP INDEX IF EXISTS index_games_on_player_and_mission;'

    # Add a non-unique index with the same columns
    begin
      add_index :break_escape_games,
                [:player_type, :player_id, :mission_id],
                name: 'index_games_on_player_and_mission_non_unique',
                if_not_exists: true
    rescue
      # Index might already exist, that's okay
    end
  end

  def down
    # Not reversible
  end
end
