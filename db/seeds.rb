# frozen_string_literal: true

puts 'Creating/Updating BreakEscape missions...'

# Directories to skip (not actual playable scenarios)
SKIP_DIRS = %w[common compiled ink].freeze

# Infer collection from scenario name for test/demo scenarios
def infer_collection(scenario_name)
  return 'testing' if scenario_name.start_with?('test', 'npc-', 'scenario')
  return 'testing' if scenario_name.include?('demo') || scenario_name.include?('test')

  'default'
end

# Apply default metadata when mission.json is missing
def apply_default_metadata(mission, scenario_name)
  mission.display_name = scenario_name.titleize if mission.display_name.blank?
  mission.description = "Play the #{scenario_name.titleize} scenario" if mission.description.blank?
  mission.difficulty_level = 3 if mission.difficulty_level.blank? || mission.difficulty_level.zero?
  mission.collection = infer_collection(scenario_name) if mission.collection.blank?
  mission.published = true
  mission
end

# List all scenario directories
scenario_root = BreakEscape::Engine.root.join('scenarios')
puts "Looking for scenarios in: #{scenario_root}"
scenario_dirs = Dir.glob("#{scenario_root}/*").select { |f| File.directory?(f) }
puts "Found #{scenario_dirs.length} directories"

created_count = 0
updated_count = 0
skipped_count = 0
deleted_count = 0
cybok_total = 0

# Track which scenarios exist on disk
scenario_names_on_disk = scenario_dirs.map { |dir| File.basename(dir) }

scenario_dirs.each do |dir|
  scenario_name = File.basename(dir)

  if SKIP_DIRS.include?(scenario_name)
    puts "  SKIP: #{scenario_name}"
    skipped_count += 1
    next
  end

  # Check for scenario.json.erb (required for valid mission)
  scenario_template = File.join(dir, 'scenario.json.erb')
  unless File.exist?(scenario_template)
    puts "  SKIP: #{scenario_name} (no scenario.json.erb)"
    skipped_count += 1
    next
  end

  mission = BreakEscape::Mission.find_or_initialize_by(name: scenario_name)
  is_new = mission.new_record?
  mission_json_path = File.join(dir, 'mission.json')

  if File.exist?(mission_json_path)
    # Load metadata from mission.json
    begin
      metadata = JSON.parse(File.read(mission_json_path))

      mission.display_name = metadata['display_name'] || scenario_name.titleize
      mission.description = metadata['description'] || "Play the #{scenario_name.titleize} scenario"
      mission.difficulty_level = metadata['difficulty_level'] || 3
      mission.secgen_scenario = metadata['secgen_scenario']
      mission.collection = metadata['collection'] || 'default'
      mission.published = true

      if mission.save
        # Sync CyBOK data
        if metadata['cybok'].present?
          cybok_count = BreakEscape::CybokSyncService.sync_for_mission(mission, metadata['cybok'])
          cybok_total += cybok_count
          puts "  #{is_new ? 'CREATE' : 'UPDATE'}: #{mission.display_name} (#{cybok_count} CyBOK)"
        else
          puts "  #{is_new ? 'CREATE' : 'UPDATE'}: #{mission.display_name}"
        end
        is_new ? created_count += 1 : updated_count += 1
      else
        puts "  ERROR: #{scenario_name} - #{mission.errors.full_messages.join(', ')}"
      end
    rescue JSON::ParserError => e
      puts "  WARN: Invalid mission.json for #{scenario_name}: #{e.message}"
      # Fall back to defaults
      apply_default_metadata(mission, scenario_name)
      if mission.save
        puts "  #{is_new ? 'CREATE' : 'UPDATE'} (defaults): #{mission.display_name}"
        is_new ? created_count += 1 : updated_count += 1
      else
        puts "  ERROR: #{scenario_name} - #{mission.errors.full_messages.join(', ')}"
      end
    end
  else
    # No mission.json - use defaults
    apply_default_metadata(mission, scenario_name)
    if mission.save
      puts "  #{is_new ? 'CREATE' : 'UPDATE'} (defaults): #{mission.display_name}"
      is_new ? created_count += 1 : updated_count += 1
    else
      puts "  ERROR: #{scenario_name} - #{mission.errors.full_messages.join(', ')}"
    end
  end
end

# Remove missions whose scenario directories no longer exist on disk
orphaned_missions = BreakEscape::Mission.where.not(name: scenario_names_on_disk)
orphaned_missions.each do |mission|
  puts "  DELETE: #{mission.display_name} (scenario directory removed)"
  mission.destroy!
  deleted_count += 1
end

puts ''
puts '=' * 50
puts "Done! #{BreakEscape::Mission.count} missions total."
puts "  Created: #{created_count}, Updated: #{updated_count}, Deleted: #{deleted_count}, Skipped: #{skipped_count}"
puts "  CyBOK entries synced: #{cybok_total}"
collections = BreakEscape::Mission.distinct.pluck(:collection).compact
puts "  Collections: #{collections.join(', ')}"
if BreakEscape::CybokSyncService.hacktivity_mode?
  puts '  Mode: Hacktivity'
else
  puts '  Mode: Standalone'
end
puts '=' * 50
