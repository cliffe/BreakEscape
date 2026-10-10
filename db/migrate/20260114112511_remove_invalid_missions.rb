class RemoveInvalidMissions < ActiveRecord::Migration[7.0]
  def up
    # Remove missions that were incorrectly seeded from utility directories
    # These directories (compiled, ink) don't contain playable scenarios
    BreakEscape::Mission.where(name: ['compiled', 'ink']).destroy_all
  end

  def down
    # Can't restore deleted missions - this is a cleanup migration
    # If needed, re-run seeds to recreate (though these should be skipped)
  end
end
