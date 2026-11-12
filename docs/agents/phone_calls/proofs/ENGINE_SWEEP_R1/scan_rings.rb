require 'json'
require 'erb'
require 'set'
load File.join(ARGV[0],'scripts/validate_scenario.rb') rescue nil
root = ARGV[0]
# Mirror of NPCManager._ringRecheckCondition + ringConditionHolds gating
def recheck(cond, sg)
  return nil unless cond.is_a?(String) && !cond.strip.empty?
  keys = sg.is_a?(Hash) ? sg.keys : []
  terms = cond.split('&&').map(&:strip).reject(&:empty?)
  kept = keys.empty? ? terms : terms.reject { |t| t.scan(/globalVars\.([A-Za-z_$][\w$]*)/).flatten.any? { |r| keys.include?(r) } }
  kept.empty? ? nil : kept.join(' && ')
end
def walk(o, &b)
  case o
  when Hash then b.call(o); o.each_value { |v| walk(v, &b) }
  when Array then o.each { |v| walk(v, &b) }
  end
end
Dir.glob(File.join(root, 'scenarios/*/scenario.json*')).sort.each do |f|
  src = File.read(f)
  begin
    j = f.end_with?('.erb') ? render_erb_to_json(f) : JSON.parse(src)
  rescue => e
    warn "#{f}: #{e.message[0,100]}"; next
  end
  scen = File.basename(File.dirname(f))
  walk(j) do |h|
    next unless h['eventMappings']
    em = h['eventMappings']
    list = em.is_a?(Array) ? em : em.map { |k, v| (v.is_a?(Array) ? v : [v]).map { |x| x.merge('eventPattern' => k) } }.flatten
    list.each do |m|
      next unless m.is_a?(Hash) && m['ring']
      rc = recheck(m['condition'], m['setGlobal'])
      cls = if rc.nil? then 'none'
            elsif !rc.split('&&').map(&:strip).all? { |t| t =~ /^globalVars\./ } then 'SKIP(non-global term)'
            else 'RECHECK' end
      cls = 'FORCED-exempt' if m['disableClose']
      flag = (rc && rc =~ /(data\.|\bvalue\b|\bname\b)/ && cls == 'RECHECK') ? ' !!DATA-IN-RECHECK' : ''
      flag += ' !!OR' if m['condition'].to_s.include?('||')
      puts "#{scen}\t#{h['id']}\t#{m['eventPattern']}\t#{cls}#{flag}\tcond=#{m['condition']}\tset=#{m['setGlobal']&.keys}\trc=#{rc}"
    end
  end
end
