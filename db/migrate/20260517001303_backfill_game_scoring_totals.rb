class BackfillGameScoringTotals < ActiveRecord::Migration[7.0]
  def up
    # Only backfill for games with scenario data
    BreakEscape::Game.find_each do |game|
      next unless game.scenario_data.present?

      objectives = game.scenario_data['objectives'] || []

      total_tasks = objectives.sum { |aim| (aim['tasks'] || []).size }
      total_aims = objectives.size

      game.update_columns(
        total_tasks: total_tasks,
        total_aims: total_aims
      )
    rescue => e
      Rails.logger.warn "Failed to backfill game #{game.id}: #{e.message}"
    end
  end

  def down
    # No-op - data is safe to leave
  end
end
