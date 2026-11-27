class AddMissionConcludedAtToBreakEscapeGames < ActiveRecord::Migration[7.0]
  def change
    add_column :break_escape_games, :mission_concluded_at, :datetime
  end
end
