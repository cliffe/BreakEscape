class CreateBreakEscapePlayerPreferences < ActiveRecord::Migration[7.0]
  def change
    create_table :break_escape_player_preferences do |t|
      # Polymorphic association to User (Hacktivity) or DemoUser (Standalone)
      t.references :player, polymorphic: true, null: false, index: true

      # Player customization
      t.string :selected_sprite  # NULL until player chooses
      t.string :in_game_name, default: 'Zero', null: false

      t.timestamps
    end

    # Ensure one preference record per player
    add_index :break_escape_player_preferences,
              [:player_type, :player_id],
              unique: true,
              name: 'index_player_prefs_on_player'
  end
end
