# Replays every m01 flag submission through the real server code path against
# REAL cached m01 games from the DB, inside a rolled-back transaction, and dumps
# the resulting task/aim outcomes as JSON. Run once before the station-qualified
# change and once after; the two dumps must be byte-identical.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/m01-noop-replay.rb <out.json>
require 'json'

out_path = ARGV[0] or abort 'usage: m01-noop-replay.rb <out.json>'

games = BreakEscape::Game.where(mission_id: 'm01_first_contact').order(:id).to_a
games = BreakEscape::Game.all.select { |g| g.scenario_data.to_s.include?('shatter_server') }.sort_by(&:id) if games.empty?
abort 'no m01 games found' if games.empty?

report = { games: [] }

games.each do |game|
  ctrl = BreakEscape::GamesController.new
  ctrl.instance_variable_set(:@game, game)

  entry = { id: game.id, mission: game.mission_id, flags: [] }

  # Every literal flag value the scenario knows about, from its flag stations.
  flag_refs = []
  (game.scenario_data['rooms'] || {}).each_value do |room|
    (room['objects'] || []).each do |o|
      flag_refs.concat(Array(o['flags'])) if %w[flag-station launch-device].include?(o['type'])
    end
    (room['npcs'] || []).each do |n|
      (n['itemsHeld'] || []).each do |it|
        flag_refs.concat(Array(it['flags'])) if %w[flag-station launch-device].include?(it['type'])
      end
    end
  end
  flag_refs.uniq!

  ActiveRecord::Base.transaction do
    flag_refs.each do |ref|
      value = ctrl.send(:resolve_flag_value, ref)
      next if value.blank?
      station = ctrl.send(:find_flag_station_for_flag, value)
      fid = ctrl.send(:generate_flag_identifier, value, station)
      # Mirror production: the new code path offers both candidate identifiers.
      ids = if ctrl.respond_to?(:generate_flag_identifiers, true)
              ctrl.send(:generate_flag_identifiers, value, station)
      else
              [fid].compact
      end
      outcomes = ids.any? ? game.process_flag_task_completions!(ids) : { completed_tasks: [], updated_tasks: [] }
      entry[:flags] << {
        ref: ref,
        station: station && (station['id'] || station['name']),
        flagId: fid,
        completed: outcomes[:completed_tasks].sort,
        updated: outcomes[:updated_tasks].sort
      }
    end
    entry[:tasks_after] = (game.player_state.dig('objectivesState', 'tasks') || {})
                          .transform_values { |v| v.is_a?(Hash) ? v.slice('status', 'submittedFlags', 'progress') : v }
                          .sort.to_h
    entry[:aims_after] = (game.player_state.dig('objectivesState', 'aims') || {})
                         .transform_values { |v| v.is_a?(Hash) ? v.slice('status') : v }.sort.to_h
    entry[:mission_concluded] = !game.mission_concluded_at.nil?
    raise ActiveRecord::Rollback
  end

  report[:games] << entry
end

File.write(out_path, JSON.pretty_generate(report))
puts "games replayed: #{report[:games].map { |g| g[:id] }.join(', ')}"
puts "wrote #{out_path} (#{File.size(out_path)} bytes)"
