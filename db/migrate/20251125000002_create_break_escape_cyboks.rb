# frozen_string_literal: true

class CreateBreakEscapeCyboks < ActiveRecord::Migration[7.0]
  def change
    create_table :break_escape_cyboks do |t|
      t.string :ka                    # Knowledge Area code (e.g., "AC", "F", "WAM")
      t.string :topic                 # Topic within the KA
      t.string :keywords              # Keywords as comma-separated string (matches Hacktivity)
      t.string :cybokable_type        # Polymorphic type
      t.integer :cybokable_id         # Polymorphic ID

      t.timestamps
    end

    add_index :break_escape_cyboks, :cybokable_id
    add_index :break_escape_cyboks, %i[cybokable_type cybokable_id]
    add_index :break_escape_cyboks, :ka
  end
end
