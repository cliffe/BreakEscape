class AddVmSetIdToBreakEscapeGames < ActiveRecord::Migration[7.0]
  def change
    add_column :break_escape_games, :vm_set_id, :bigint
    add_index  :break_escape_games, :vm_set_id

    # Deduplicate any existing in_progress rows before adding the unique index.
    # Keep the most recently created game per player+mission; abandon the rest.
    reversible do |dir|
      dir.up do
        execute <<~SQL
          UPDATE break_escape_games
          SET status = 'abandoned'
          WHERE status = 'in_progress'
            AND id NOT IN (
              SELECT MAX(id)
              FROM break_escape_games
              WHERE status = 'in_progress'
              GROUP BY player_type, player_id, mission_id
            )
        SQL
      end
    end

    # Non-unique index for performance when querying active games
    # Allows multiple games per player+mission (needed to restart missions)
    add_index :break_escape_games,
              [:player_type, :player_id, :mission_id],
              where: "status = 'in_progress'",
              name: 'idx_break_escape_games_one_active_per_player_mission'

    # Backfill existing rows from JSONB player_state using Ruby (DB-agnostic).
    # Safety: update_columns bypasses callbacks and validations.
    reversible do |dir|
      dir.up do
        ActiveRecord::Base.connection.execute(
          "SELECT id, player_state FROM break_escape_games WHERE vm_set_id IS NULL"
        ).each do |row|
          state = row['player_state']
          next unless state

          parsed = state.is_a?(String) ? JSON.parse(state) : state
          raw_id = parsed['vm_set_id']
          next unless raw_id

          vm_set_id = raw_id.to_i
          next unless vm_set_id > 0

          ActiveRecord::Base.connection.execute(
            "UPDATE break_escape_games SET vm_set_id = #{vm_set_id} WHERE id = #{row['id']}"
          )
        end
      end
    end
  end
end
