class CreateBreakEscapeMissions < ActiveRecord::Migration[7.0]
  def change
    create_table :break_escape_missions do |t|
      t.string :name, null: false
      t.string :display_name, null: false
      t.text :description
      t.boolean :published, default: false, null: false
      t.integer :difficulty_level, default: 1, null: false

      t.timestamps
    end

    add_index :break_escape_missions, :name, unique: true
    add_index :break_escape_missions, :published
  end
end
