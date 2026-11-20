# frozen_string_literal: true

class AddMetadataToBreakEscapeMissions < ActiveRecord::Migration[7.0]
  def change
    add_column :break_escape_missions, :secgen_scenario, :string
    add_column :break_escape_missions, :collection, :string, default: 'default'

    add_index :break_escape_missions, :collection
  end
end
