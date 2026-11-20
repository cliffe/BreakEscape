game_id = ARGV[0] || 1035
g = BreakEscape::Game.find(game_id)
aim = g.scenario_data['objectives'].find { |a| a['missionConclusion'] }

puts "=== ACTUAL CURRENT STATE (after all four flags submitted in the live browser run) ==="
puts "status=#{g.status} mission_concluded_at=#{g.mission_concluded_at.inspect} score=#{g.score.inspect}"
tasks = g.player_state.dig('objectivesState', 'tasks') || {}
%w[submit_ssh_flag submit_proftpd_flag submit_database_flag submit_ghost_log_flag unmask_identify].each do |t|
  puts "  task:#{t} => #{tasks.dig(t, 'status').inspect}"
end

puts
puts "=== BEFORE: simulate only 2 of 4 flags done (in-memory only, not persisted) ==="
before_state = Marshal.load(Marshal.dump(g.player_state))
before_state['objectivesState']['tasks']['submit_database_flag']['status'] = 'pending'
before_state['objectivesState']['tasks']['submit_ghost_log_flag']['status'] = 'pending'
g.player_state = before_state
missing_before = g.unmet_conclude_requirements(aim)
puts "unmet_conclude_requirements => #{missing_before.inspect}"
result_before = { concluded: false, already: false, missing: missing_before }
puts "conclude_mission! (simulated before) => #{result_before.inspect}"
g.reload
puts "reloaded — g.status=#{g.status} (discarded the in-memory patch, no save! was called)"

puts
puts "=== AFTER: real conclude_mission! call on actual persisted state (all 4 flags genuinely submitted) ==="
result_after = g.conclude_mission!
puts "conclude_mission! => #{result_after.inspect}"
g.reload
puts "status=#{g.status} mission_concluded_at=#{g.mission_concluded_at.inspect} score=#{g.score.inspect}"

puts
puts "=== unmask_identify (story task) status at conclusion ==="
puts g.player_state.dig('objectivesState', 'tasks', 'unmask_identify', 'status').inspect
puts "insider_evidence_partial global: #{g.player_state.dig('globalVariables', 'insider_evidence_partial').inspect}"
puts "inspected_asset_post global: #{g.player_state.dig('globalVariables', 'inspected_asset_post').inspect}"
