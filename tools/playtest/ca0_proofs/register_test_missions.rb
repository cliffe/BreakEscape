# Registers named test scenarios as Mission rows (dev DB only), mirroring db/seeds.rb's
# mission.json branch, without touching any other row. Approved by AC0, 26 Nov 2026.
# Usage: BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/ca0_proofs/register_test_missions.rb name...
abort 'dev only' unless Rails.env.development?
ARGV.each do |name|
  dir = BreakEscape::Engine.root.join('scenarios', name)
  abort "no scenario.json.erb for #{name}" unless File.exist?(dir.join('scenario.json.erb'))
  m = BreakEscape::Mission.find_or_initialize_by(name: name)
  if m.persisted?
    puts "EXISTS #{m.id} #{name}"
    next
  end
  meta = File.exist?(dir.join('mission.json')) ? JSON.parse(File.read(dir.join('mission.json'))) : {}
  m.display_name = meta['display_name'] || name.titleize
  m.description = meta['description'] || "Play the #{name.titleize} scenario"
  m.difficulty_level = meta['difficulty_level'] || 3
  m.secgen_scenario = meta['secgen_scenario']
  m.collection = meta['collection'] || 'testing'
  m.published = true
  m.save!
  puts "CREATE #{m.id} #{name}"
end
