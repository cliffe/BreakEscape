class AddScoringTotalsToGames < ActiveRecord::Migration[7.0]
  def change
    add_column :break_escape_games, :total_tasks, :integer, default: 0, null: false
    add_column :break_escape_games, :total_aims, :integer, default: 0, null: false

    add_index :break_escape_games, [:total_tasks, :tasks_completed], name: 'index_games_on_task_progress'
    add_index :break_escape_games, [:total_aims, :objectives_completed], name: 'index_games_on_aim_progress'
  end
end
