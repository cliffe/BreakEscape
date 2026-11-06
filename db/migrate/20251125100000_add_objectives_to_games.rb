class AddObjectivesToGames < ActiveRecord::Migration[7.0]
  def change
    # Objectives state stored in player_state JSONB (already exists)
    # Add helper columns for quick queries and stats
    add_column :break_escape_games, :objectives_completed, :integer, default: 0
    add_column :break_escape_games, :tasks_completed, :integer, default: 0
  end
end
