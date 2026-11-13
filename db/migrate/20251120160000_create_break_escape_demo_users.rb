class CreateBreakEscapeDemoUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :break_escape_demo_users do |t|
      t.string :handle, null: false
      t.string :role, default: 'user', null: false

      t.timestamps
    end

    add_index :break_escape_demo_users, :handle, unique: true
  end
end
