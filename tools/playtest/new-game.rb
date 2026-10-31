# Create a playtest game the same way the standalone "new game" form does.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <mission> [flag_hints.xml] [--imports=none|latest|<file.json>]
#
# <mission> is the scenario name ("m02_ransomed_trust") or the numeric id.
#
# Flags come from a SecGen flag-hints XML, seeded BEFORE save! so the scenario
# ERB renders with them. With no XML the scenario is read to work out which VM
# it wants and how many flags, and stand-in values are synthesised — so the
# usual case is one argument and no XML to write. Pass an XML only to control
# the exact values (a real SecGen build, or reproducing someone else's run).
#
# Aborts rather than handing back a game with no valid flags: that failure makes
# every flag submission return "Invalid flag" and looks exactly like a scenario
# bug halfway through a run.
#
# --imports (carry-over, docs/agents/CARRY_OVER_PLAN.md) sets what a mission
# with importGlobals takes from earlier missions:
#   none    (the default) every import at its default: "never played". Every
#           local playtest shares one demo player, so without this an earlier
#           test run's finished m06 would leak into the next m07 run.
#   latest  look the player's finished runs up, as a real game does.
#   <file>  a JSON object { "m06_assets_seized": true, "m06_completed": true }.
# Games started from the browser UI always look up (latest).
#
# Test-only head-start options (they edit this one game row, nothing in the
# engine; a normal "new game" cannot reach them). Repeatable; both
# `--opt value` and `--opt=value` work:
#   --start-room ROOM_ID   begin in that room (rewrites THIS game's copy of
#                          scenario_data['startRoom'], so it is unlocked, loaded
#                          and the spawn point). Must be a room id in the scenario.
#                          Phone NPCs (npcType "phone") defined in the original start
#                          room are moved into the new start room in this game's copy,
#                          because the client only loads the start room's NPCs at boot
#                          and would otherwise never register them (contacts, hub,
#                          #unlock_door). Other NPCs stay where they are.
#   --carry-npc NPC_ID     also move this NPC (any type) from the original start room
#                          into the new start room. Repeatable. It spawns at its
#                          x/y in the new room, so use for position-free NPCs.
#   --unlock ROOM_ID       also mark a room unlocked (the start room always is)
#   --set name=value       set a global variable. value is parsed as JSON when it
#                          can be (true, false, 3, "x"), else kept as a string
#   --give ITEM_ID         put a scenario item in the inventory, found by its
#                          object id (rooms, containers, NPC itemsHeld, startItems);
#                          the room copy is marked removed so it is not doubled
#   --complete-task TASK_ID  mark an objective task completed in the stored state, the
#                          way Game#complete_task! does (completedAt, onComplete unlockTask/
#                          unlockAim/setGlobal, aim completion, tasks_completed, score,
#                          mission conclusion) but WITHOUT its per-type validation, so
#                          e.g. an npc_conversation task needs no met NPC. Repeatable.
#                          Unknown ids abort and list the tasks. Client eventMappings that
#                          would have fired on completion do NOT replay.
#   --submit-flag FLAG_ID  record a VM flag as submitted the way POST /flags does, with no VM:
#                          Game#submit_flag, the station's flagRewards (give_item,
#                          unlock_door, emit_event; set_global/unlock_object applied
#                          straight to the state) and submit_flags task progress. FLAG_ID is
#                          vm:flag_N, vm-flagN or station:vm-flagN. Repeatable. Unknown ids
#                          abort and list the flags. Hacktivity scoring is skipped.
# Set globals sit in player_state like any played-in value; imported globals
# (importGlobals) are re-applied by the server, so use --imports=<file> for those.
# --help prints this text.

if ARGV.include?('--help') || ARGV.include?('-h')
  puts File.read(__FILE__).lines.take_while { |l| l.start_with?('#') }.map { |l| l.sub(/\A# ?/, '') }.join
  exit
end

imports_opt = 'none'
start_room_opt = nil
unlock_opts = []
carry_opts = []
set_opts = []
give_opts = []
complete_opts = []
flag_opts = []
head_start = { '--start-room' => ->(v) { start_room_opt = v }, '--unlock' => ->(v) { unlock_opts << v }, '--carry-npc' => ->(v) { carry_opts << v },
               '--set' => ->(v) { set_opts << v }, '--give' => ->(v) { give_opts << v },
               '--complete-task' => ->(v) { complete_opts << v }, '--submit-flag' => ->(v) { flag_opts << v } }
rest = []
args = ARGV.dup
until args.empty?
  a = args.shift
  name, inline = a.split('=', 2)
  if head_start.key?(name)
    val = inline || args.shift
    abort "#{name} needs a value (see --help)" if val.nil?
    head_start[name].call(val)
  else
    rest << a
  end
end
ARGV.replace(rest)
ARGV.reject! { |a| a.start_with?('--imports=') && (imports_opt = a.split('=', 2)[1]) }
arg = ARGV[0] or abort 'usage: new-game.rb <mission_name_or_id> [flag_hints.xml] [--imports=none|latest|<file.json>] [--start-room R] [--unlock R] [--set k=v] [--give ITEM_ID] [--complete-task TASK_ID] [--submit-flag FLAG_ID]  (--help for details)'
xml_path = ARGV[1]

mission = if arg =~ /\A\d+\z/
            BreakEscape::Mission.find_by(id: arg)
else
            BreakEscape::Mission.find_by(name: arg)
end
unless mission
  names = BreakEscape::Mission.pluck(:id, :name).map { |i, n| "#{i}\t#{n}" }
  abort "No mission '#{arg}'. Available:\n#{names.join("\n")}"
end

# Which VM does this scenario draw flags from, and how many does it reference?
# Both come from the un-rendered template: `flags_for_vm('vm', [...])` names the
# VM, and "vm:flag_N" references fix the count.
def scenario_flag_needs(mission)
  template = mission.scenario_path.join('scenario.json.erb')
  template = mission.scenario_path.join('scenario.json') unless File.exist?(template)
  return {} unless File.exist?(template)

  src = File.read(template)
  needs = Hash.new(0)
  src.scan(/"([a-z0-9_]+):flag_(\d+)"/i) do |vm, n|
    needs[vm] = [needs[vm], n.to_i].max
  end
  # targetFlags entries reference "station_id:vm_name-flagN" (a dash before
  # "flag", not "vm:flag_N") — e.g. m02's
  # "flag_station_dropsite:hospital_backup_server-flag4". Without this, the
  # scan above never sees these references at all, so `needs` silently falls
  # back to the flags_for_vm(...) minimum of 1 even when a scenario's own
  # targetFlags reference flag2/flag3/flag4 — undercounting the flags a real
  # playtest game needs seeded, and every submission past the first then
  # returns "Invalid flag" for reasons indistinguishable from a scenario bug.
  src.scan(/"[a-z0-9_]+:([a-z0-9_]+)-flag(\d+)"/i) do |vm, n|
    needs[vm] = [needs[vm], n.to_i].max
  end
  # A VM named in a helper but with no explicit flag_N reference still needs one.
  src.scan(/(?:flags_for_vm|vm_flags_json)\(\s*'([^']+)'/) do |(vm)|
    needs[vm] = [needs[vm], 1].max
  end
  needs
end

state = {}
needs = scenario_flag_needs(mission)

if xml_path && File.exist?(xml_path)
  by_vm = BreakEscape::Mission.parse_flag_hints_xml(File.read(xml_path))
  source = "xml:#{xml_path}"
elsif needs.any?
  # Distinctive values, never flag{1}..flag{N}: when something goes wrong a
  # generic value is indistinguishable from the others in a response body.
  by_vm = needs.each_with_object({}) do |(vm, count), acc|
    acc[vm] = (1..count).map { |i| "flag{#{mission.name}_#{vm}_#{i}_#{SecureRandom.hex(3)}}" }
  end
  source = 'derived from scenario'
else
  by_vm = {}
  source = 'none (no VM flags in this scenario)'
end

if by_vm.any?
  state['flags_by_vm'] = by_vm
  state['standalone_flags'] = by_vm.values.flatten.uniq
end

g = BreakEscape::Game.new(
  player: BreakEscape::DemoUser.first || BreakEscape::DemoUser.create!(username: 'playtest'),
  mission: mission
)
case imports_opt
when 'latest' then nil
when 'none' then state[BreakEscape::CarryOver::OVERRIDES_KEY] = {}
else
  abort "--imports file not found: #{imports_opt}" unless File.exist?(imports_opt)
  overrides = JSON.parse(File.read(imports_opt))
  abort '--imports file must hold a JSON object' unless overrides.is_a?(Hash)
  state[BreakEscape::CarryOver::OVERRIDES_KEY] = overrides
end

g.player_state = state
g.save!

# Head start (test only). Runs after the first save so the game's own scenario
# copy exists; every edit is to this row.
head_start_notes = []
if [start_room_opt, unlock_opts, set_opts, give_opts, carry_opts].any?(&:present?)
  rooms = g.scenario_data['rooms'] || {}
  ([start_room_opt] + unlock_opts).compact.each do |r|
    abort "No room '#{r}' in #{mission.name}. Rooms: #{rooms.keys.join(', ')}" unless rooms.key?(r)
  end
  ps = g.player_state
  if start_room_opt
    sd = g.scenario_data
    orig_start = sd['startRoom']
    sd['startRoom'] = start_room_opt
    if orig_start != start_room_opt
      # The game spawns at startPosition (room-relative TILES) if the scenario has one, else a fixed
      # 160,144 px offset: right for a 10x9-tile room, inside the wall of a smaller one. Put the player
      # on the middle tile of the new start room, from its room file's size.
      room_type = sd.dig('rooms', start_room_opt, 'type')
      room_json = File.expand_path("../../public/break_escape/assets/rooms/#{room_type}.json", __dir__)
      if room_type && File.exist?(room_json)
        rj = JSON.parse(File.read(room_json))
        if rj['width'].to_i > 4 && rj['height'].to_i > 4
          sd['startPosition'] = { 'x' => rj['width'] / 2.0, 'y' => rj['height'] / 2.0 }
          head_start_notes << "startPosition=#{sd['startPosition'].values.join(',')} (tiles)"
        end
      end
      from_npcs = Array(sd.dig('rooms', orig_start, 'npcs'))
      moving, staying = from_npcs.partition { |n| n['npcType'] == 'phone' || carry_opts.include?(n['id']) }
      missing = carry_opts - moving.map { |n| n['id'] }
      abort "--carry-npc: no NPC #{missing.join(', ')} in original start room #{orig_start}" if missing.any?
      if moving.any?
        sd['rooms'][orig_start]['npcs'] = staying
        dest = (sd['rooms'][start_room_opt]['npcs'] ||= [])
        moving.each { |n| dest << n unless dest.any? { |d| d['id'] == n['id'] } }
        head_start_notes << "moved NPCs #{moving.map { |n| n['id'] }.join(',')} #{orig_start} -> #{start_room_opt}"
      end
    end
    g.scenario_data = sd
    ps['currentRoom'] = start_room_opt
    head_start_notes << "start_room=#{start_room_opt}"
  end
  ps['unlockedRooms'] = (Array(ps['unlockedRooms']) + [start_room_opt].compact + unlock_opts).uniq
  head_start_notes << "unlocked=#{ps['unlockedRooms'].join(',')}"
  gv = (ps['globalVariables'] ||= {})
  set_opts.each do |kv|
    k, v = kv.split('=', 2)
    abort "--set wants name=value, got '#{kv}'" if k.blank? || v.nil?
    gv[k] = begin
      JSON.parse(v)
    rescue JSON::ParserError
      v
    end
    head_start_notes << "set #{k}=#{gv[k].inspect}"
  end
  give_opts.each do |item_id|
    found = nil
    owner_room = nil
    owner_npc = nil
    walk = lambda do |node, room, npc|
      case node
      when Hash
        npc = node['id'] if node['itemsHeld'].is_a?(Array) && node['id'].present?
        if node['id'] == item_id && found.nil?
          found = node
          owner_room = room
          owner_npc = npc
        end
        node.each_value { |v| walk.call(v, room, npc) }
      when Array then node.each { |v| walk.call(v, room, npc) }
      end
    end
    rooms.each { |rid, rd| walk.call(rd, rid, nil) }
    walk.call(g.scenario_data['startItemsInInventory'], nil, nil)
    abort "--give: no object with id '#{item_id}' in #{mission.name}" unless found
    item = found.deep_dup
    item['takeable'] = true
    ps['inventory'] = Array(ps['inventory'])
    ps['inventory'] << item unless ps['inventory'].any? { |i| i['id'] == item_id }
    if owner_npc
      # The client re-validates NPC-held items against the server on load and
      # drops them ("NPC not encountered") unless the NPC has been met.
      ps['encounteredNPCs'] = (Array(ps['encounteredNPCs']) + [owner_npc]).uniq
      g.player_state = ps
      g.record_npc_gift!(owner_npc, item)
      ps = g.player_state
      head_start_notes << "met #{owner_npc}"
    elsif owner_room
      rs = ((ps['room_states'] ||= {})[owner_room] ||= { 'objects_added' => [], 'objects_removed' => [], 'object_states' => {}, 'npc_states' => {} })
      rs['objects_removed'] << item_id unless rs['objects_removed'].include?(item_id)
    end
    head_start_notes << "give #{item_id} (#{item['type']}, from #{owner_npc || owner_room || 'startItems'})"
    head_start_notes << "NOTE #{item_id} is a notes item: it opens in the notepad, not the inventory" if item['type'] == 'notes'
  end
  g.player_state = ps
  g.save!
end

# Objective / flag head start (test only, script-only: nothing in the engine
# calls this file). Mirrors Game#complete_task! (minus validation) and the
# GamesController#submit_flag pipeline, writing straight to this game's row.
if complete_opts.any? || flag_opts.any?
  g.reload
  sd = g.scenario_data
  g.send(:initialize_objectives)
  ps = g.player_state

  all_tasks = Array(sd['objectives']).flat_map { |a| Array(a['tasks']).map { |t| t['taskId'] } }
  bad = complete_opts - all_tasks
  abort "--complete-task: unknown task(s) #{bad.join(', ')}. Tasks:\n  #{all_tasks.join("\n  ")}" if bad.any?

  # Flag ids: every spelling resolves to a flag VALUE through flags_by_vm
  # (scenario_data['flags'] as a second source).
  vm_flags = {}
  (ps['flags_by_vm'] || {}).each { |vm, arr| vm_flags[vm] = Array(arr) if arr.is_a?(Array) }
  (sd['flags'] || {}).each do |vm, h|
    next unless h.is_a?(Hash)
    vm_flags[vm] ||= h.sort_by { |k, _| k[/\d+/].to_i }.map { |_, v| v }
  end
  flag_index = {}
  vm_flags.each do |vm, arr|
    arr.each_with_index do |val, i|
      flag_index["#{vm}:flag_#{i + 1}"] = val
      flag_index["#{vm}-flag#{i + 1}"] = val
    end
  end
  stations = []
  (sd['rooms'] || {}).each do |rid, room|
    Array(room['objects']).each { |o| stations << [rid, o] if %w[flag-station launch-device].include?(o['type']) }
    Array(room['npcs']).each { |n| Array(n['itemsHeld']).each { |o| stations << [rid, o] if %w[flag-station launch-device].include?(o['type']) } }
  end
  stations.each do |_rid, st|
    key = st['id'].presence || st['name']
    Array(st['acceptsVms']).first.then do |vm|
      next unless vm
      Array(st['flags']).each_with_index { |_, i| (v = flag_index["#{vm}-flag#{i + 1}"]) && flag_index["#{key}:#{vm}-flag#{i + 1}"] = v }
    end
  end
  resolve = ->(ref) { ref.is_a?(String) && ref.match?(/\A[^:]+:flag_\d+\z/) ? (flag_index[ref] || g.resolve_flag_ref(ref)) : ref }
  bad = flag_opts.reject { |f| flag_index.key?(f) }
  if bad.any?
    abort "--submit-flag: unknown flag id(s) #{bad.join(', ')}. Known (vm:flag_N / vm-flagN):\n  " +
          flag_index.keys.select { |k| k.include?(':flag_') }.map { |k| "#{k} (#{k.sub(':flag_', '-flag')})" }.join("\n  ")
  end

  # ---- tasks ----
  complete_opts.each do |tid|
    task = g.send(:find_task_in_scenario, tid)
    if ps.dig('objectivesState', 'tasks', tid, 'status') == 'completed'
      head_start_notes << "complete-task #{tid}: already completed"
      next
    end
    ps = g.player_state # re-fetch: save! can hand back a fresh copy
    ps['objectivesState']['tasks'][tid] = (ps['objectivesState']['tasks'][tid] || {}).merge('status' => 'completed', 'completedAt' => Time.current.iso8601)
    g.send(:process_task_completion, task)
    g.send(:check_aim_completion, task['aimId'])
    g.send(:recheck_pending_mission_conclusions!)
    g.tasks_completed = (g.tasks_completed || 0) + 1
    g.score = g.calculate_task_score.round
    g.save!
    aim_done = g.player_state.dig('objectivesState', 'aims', task['aimId'], 'status') == 'completed'
    head_start_notes << "complete-task #{tid} (aim #{task['aimId']}#{aim_done ? ' now complete' : ''})"
  end

  # ---- flags ----
  flag_opts.each do |fid|
    value = flag_index[fid]
    res = g.submit_flag(value)
    unless res[:success]
      head_start_notes << "submit-flag #{fid}: #{res[:message]}"
      next
    end
    ps = g.player_state
    station = nil
    stations.each do |_rid, st|
      refs = Array(st['flags'])
      if refs.any? { |r| resolve.call(r).to_s.casecmp?(value) }
        station = st
        break
      end
    end
    if station.nil?
      stations.each do |rid, st|
        next unless Array(st['acceptsVms']).any? { |vm| vm_flags[vm]&.include?(value) }
        station = st
        break
      end
    end
    if station.nil?
      (sd['rooms'] || {}).each_value do |room|
        Array(room['objects']).each do |o|
          station ||= o if o['lockType'] == 'flag' && o['requires'] && resolve.call(o['requires']).to_s.casecmp?(value)
        end
      end
    end
    fvm = fid[/\A(?:[^:]+:)?(.+?)(?::flag_|-flag)/, 1]
    ids = []
    if station && (vm = Array(station['acceptsVms']).first) && (idx = Array(station['flags']).find_index { |r| resolve.call(r).to_s.casecmp?(value) })
      legacy = "#{vm}-flag#{idx + 1}"
      key = station['id'].presence || station['name'].presence
      ids = key ? ["#{key}:#{legacy}", legacy] : [legacy]
    end
    # rewards
    rewards = []
    if station && station['flagRewards']
      fr = station['flagRewards']
      sid = station['id'] || station['name']
      if fr.is_a?(Hash)
        k = fr.keys.find { |kk| kk.downcase == value.downcase }
        rewards << fr[k] if k
      elsif station['requires']
        rewards.concat(fr)
      else
        i = Array(station['flags']).find_index { |r| resolve.call(r).to_s.casecmp?(value) }
        rewards << fr[i] if i && fr[i]
      end
      rewards.map! { |r| r.merge('flag_station_id' => sid) }
    end
    applied = []
    unless ps['flag_rewards_claimed']&.include?(value)
      rewards.each do |r|
        case r['type']
        when 'give_item'
          item = Array(station['itemsHeld']).find { |i| i['type'] == r['item_type'] || i['name'] == r['item_name'] }
          if item then g.add_inventory_item!(item); applied << "give_item #{item['type']}" else applied << 'give_item: item not found in station' end
        when 'unlock_door'
          room = r['target_room'] || r['room_id']
          g.unlock_room!(room) if room
          applied << "unlock_door #{room}"
        when 'emit_event'
          ev = r['event_name'] || "flag_submitted:#{value}"
          ps = g.player_state
          (ps['pending_events'] ||= []) << { 'name' => ev, 'data' => { 'flag' => value, 'timestamp' => Time.current.to_i } }
          applied << "emit_event #{ev} (queued; client fires on load)"
        when 'set_global'
          ps = g.player_state
          (ps['globalVariables'] ||= {})[r['key']] = r['value']
          applied << "set_global #{r['key']}=#{r['value'].inspect}"
        when 'unlock_object'
          oid = r['object_id'] || r['target_object'] || r['id']
          oid ? (g.unlock_object!(oid); applied << "unlock_object #{oid}") : applied << 'unlock_object: no id in reward'
        else
          applied << "#{r['type']} (client-only, not applied)"
        end
      end
      ps = g.player_state
      (ps['flag_rewards_claimed'] ||= []) << value
      g.save!
    end
    outcome = ids.any? ? g.process_flag_task_completions!(ids) : { completed_tasks: [], updated_tasks: [] }
    head_start_notes << "submit-flag #{fid} -> station=#{station && (station['id'] || station['name'])} flagIds=#{ids.first(2).join('|')} rewards=[#{applied.join('; ')}] tasks_completed=#{outcome[:completed_tasks].inspect} tasks_updated=#{outcome[:updated_tasks].inspect}"
  end
  g.save!
end

# Sprite-restricted missions (validSprites) redirect the game page to the
# configuration screen when the shared demo user's saved sprite is not allowed,
# so window.__test never appears. Switch the preference to an allowed sprite for
# the run and record the original in sprite-restore-<game>.txt; session-stop.sh
# (or restore-sprite.rb) puts it back.
pref = g.player.respond_to?(:ensure_break_escape_preference!) ? (g.player.ensure_break_escape_preference!; g.player.break_escape_preference) : g.player.preference
if pref && !pref.sprite_valid_for_scenario?(g.scenario_data)
  pick = BreakEscape::PlayerPreference::AVAILABLE_SPRITES.find do |sp|
    BreakEscape::PlayerPreference.sprite_matches_pattern?(sp, '*') &&
      Array(g.scenario_data['validSprites']).any? { |pat| BreakEscape::PlayerPreference.sprite_matches_pattern?(sp, pat) }
  end
  abort "No available sprite matches validSprites #{g.scenario_data['validSprites'].inspect}" unless pick
  orig = pref.read_attribute(:selected_sprite)
  File.write(File.join(__dir__, "sprite-restore-#{g.id}.txt"), "#{pref.id}\t#{pick}\t#{orig}\n")
  pref.update_column(:selected_sprite, pick)
  puts "SPRITE_SWITCHED=#{orig.inspect} -> #{pick} (restored by session-stop.sh / restore-sprite.rb #{g.id})"
end

valid = g.send(:extract_valid_flags_from_scenario)
puts "MISSION=#{mission.name} (id #{mission.id})"
puts "GAME_ID=#{g.id}"
puts "URL=http://127.0.0.1:#{ENV.fetch('PLAYTEST_PORT', '3000')}/break_escape/games/#{g.id}"
puts "FLAG_SOURCE=#{source}"
puts "HEAD_START=#{head_start_notes.join(' | ')}" if head_start_notes.any?
if g.scenario_data['importedGlobals'].present?
  puts "IMPORTS=#{imports_opt} #{g.scenario_data['importedGlobals'].keys.map { |k| "#{k}=#{g.scenario_data['globalVariables'][k].inspect}" }.join(' ')}"
end
puts "FLAGS_EXPECTED=#{needs.map { |vm, n| "#{vm}:#{n}" }.join(' ')}" if needs.any?
puts "VALID_FLAGS=#{valid.length}"

if needs.any? && valid.empty?
  abort "PREFLIGHT FAIL: scenario references #{needs.inspect} but no valid flags rendered."
end
if needs.any? && valid.length < needs.values.sum
  warn "PREFLIGHT WARN: #{valid.length} valid flags but #{needs.values.sum} referenced — " \
       'some flag submissions will fail. Check the VM name.'
end
puts 'PREFLIGHT OK'

# The session needs the flag values to substitute <flag:N>. Write them out in
# the same XML shape the --flags option reads, so setup is one command.
if by_vm.any?
  out = mission.scenario_path.join('..', '..', 'tools', 'playtest',
                                   "#{mission.name}-flags-game#{g.id}.xml").cleanpath
  xml = +"<?xml version=\"1.0\"?>\n<flag_hints xmlns=\"http://www.github/cliffe/SecGen/marker\">\n"
  by_vm.each do |vm, flags|
    xml << "  <system>\n    <system_name>#{vm}</system_name>\n"
    flags.each { |f| xml << "    <challenge><flag>#{f}</flag></challenge>\n" }
    xml << "  </system>\n"
  end
  xml << "</flag_hints>\n"
  File.write(out, xml)
  puts "FLAGS_XML=#{out.to_s.sub("#{Dir.pwd}/", '')}"
end
