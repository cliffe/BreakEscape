# A1 id scan (plan 2.10): for each scenario with a phone contact, list every ink line of a phone
# contact whose prefix (text before the first colon) equals a registered NPC id, ignoring case.
#
#   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/phone_calls/scan_speaker_ids.rb
require 'json'
require 'erb'
root = BreakEscape::Engine.root
total = 0
Dir.glob(root.join('scenarios', '*', 'scenario.json.erb').to_s).sort.each do |erb|
  name = File.basename(File.dirname(erb))
  begin
    data = JSON.parse(ERB.new(File.read(erb)).result(BreakEscape::Mission::ScenarioBinding.new({}).get_binding))
  rescue StandardError
    next
  end
  npcs = []
  walk = lambda do |o|
    case o
    when Hash
      npcs << o if o['id'].is_a?(String) && (o['npcType'] || o['storyPath'] || o['displayName'] || o['voice'])
      o.each_value { |v| walk.call(v) }
    when Array then o.each { |v| walk.call(v) }
    end
  end
  walk.call(data)
  phones = npcs.select { |n| n['npcType'] == 'phone' }.uniq { |n| n['id'] }
  next if phones.empty?

  ids = npcs.map { |n| n['id'].to_s.downcase }.uniq
  phones.each do |p|
    sp = p['storyPath'].to_s.sub(/\.json\z/, '.ink')
    file = root.join(sp.start_with?('scenarios') ? sp : File.join('scenarios', name, sp))
    file = root.join('scenarios', name, sp) unless File.exist?(file)
    next unless File.exist?(file)

    File.readlines(file).each_with_index do |line, i|
      m = line.match(/\A\s*(?:[-*+]\s*)*([^:#\/"{}<>\[\]\s][^:#\/"{}<>\[\]]*?)\s*:\s*\S/)
      next unless m
      prefix = m[1].strip.downcase
      next unless ids.include?(prefix)
      own = prefix == p['id'].to_s.downcase
      puts "#{name}\t#{p['id']}\t#{File.basename(file)}:#{i + 1}\t#{m[1].strip}\t#{own ? 'own id' : (%w[narrator player].include?(prefix) ? 'excluded id' : 'OTHER ID')}"
      total += 1
    end
  end
end
puts "total hits: #{total}"
