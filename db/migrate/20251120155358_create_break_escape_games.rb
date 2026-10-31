class CreateBreakEscapeGames < ActiveRecord::Migration[7.0]
  def change
    # Detect database adapter
    is_postgresql = ActiveRecord::Base.connection.adapter_name.downcase == 'postgresql'

    create_table :break_escape_games do |t|
      # Polymorphic player
      t.references :player, polymorphic: true, null: false, index: true

      # Mission reference
      t.references :mission, null: false, foreign_key: { to_table: :break_escape_missions }

      # Scenario snapshot (ERB-generated)
      # Use jsonb for PostgreSQL, json for SQLite
      if is_postgresql
        t.jsonb :scenario_data, null: false
      else
        t.json :scenario_data, null: false
      end

      # Player state
      # Use jsonb for PostgreSQL, json for SQLite
      if is_postgresql
        t.jsonb :player_state, null: false, default: {
          currentRoom: nil,
          unlockedRooms: [],
          unlockedObjects: [],
          inventory: [],
          encounteredNPCs: [],
          globalVariables: {},
          biometricSamples: [],
          biometricUnlocks: [],
          bluetoothDevices: [],
          notes: [],
          health: 100
        }
      else
        t.json :player_state, null: false, default: {
          currentRoom: nil,
          unlockedRooms: [],
          unlockedObjects: [],
          inventory: [],
          encounteredNPCs: [],
          globalVariables: {},
          biometricSamples: [],
          biometricUnlocks: [],
          bluetoothDevices: [],
          notes: [],
          health: 100
        }.to_json
      end

      # Metadata
      t.string :status, default: 'in_progress', null: false
      t.datetime :started_at
      t.datetime :completed_at
      t.integer :score, default: 0, null: false

      t.timestamps
    end

    add_index :break_escape_games,
              [:player_type, :player_id, :mission_id],
              name: 'index_games_on_player_and_mission'

    # GIN indexes only available in PostgreSQL
    if is_postgresql
      add_index :break_escape_games, :scenario_data, using: :gin
      add_index :break_escape_games, :player_state, using: :gin
    end

    add_index :break_escape_games, :status
  end
end
