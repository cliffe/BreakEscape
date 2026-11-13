# Drops the GIN indexes on player_state and scenario_data. Nothing in the
# engine or in Hacktivity queries either column with jsonb operators, so they
# were never used to read, and every save paid to update the player_state one:
# a GIN index on a 35 KB document is rewritten for each of its keys on every
# sync. Concurrently, so a live games table isn't locked while they go.
class RemoveJsonbGinIndexesFromBreakEscapeGames < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    remove_index :break_escape_games, :player_state,
                 name: 'index_break_escape_games_on_player_state', algorithm: :concurrently, if_exists: true
    remove_index :break_escape_games, :scenario_data,
                 name: 'index_break_escape_games_on_scenario_data', algorithm: :concurrently, if_exists: true
  end

  def down
    add_index :break_escape_games, :player_state, using: :gin,
              name: 'index_break_escape_games_on_player_state', algorithm: :concurrently, if_not_exists: true
    add_index :break_escape_games, :scenario_data, using: :gin,
              name: 'index_break_escape_games_on_scenario_data', algorithm: :concurrently, if_not_exists: true
  end
end
