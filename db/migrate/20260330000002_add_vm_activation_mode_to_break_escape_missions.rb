class AddVmActivationModeToBreakEscapeMissions < ActiveRecord::Migration[7.0]
  def change
    add_column :break_escape_missions, :vm_activation_mode, :string,
               default: 'eager', null: false
  end
end
