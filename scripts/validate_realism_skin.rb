# frozen_string_literal: true

# The realism skin validator (docs/agents/ops_core_build/S6_BUILD_BRIEF.md, unit 22). One entry
# point, check_realism_skin, called by scripts/validate_scenario.rb. It checks the display-only
# fields of the command-line look: `cli` on networks and services, the `realism` link on a weakness
# or decoy, and the wording of the text a scenario shows about them. It reads hosts, services and
# findings through BreakEscape::NetworkModel, and the realism catalog only when the scenario has at
# least one link. No message quotes catalog text; a message about a scenario string names the matched
# fragment of the scenario's own text and the plain form that passes.
#
#   check_realism_skin(json_data) -> ["❌ ERROR: realism skin: ...", "⚠️ WARNING: realism skin: ...", ...]
#
# Keyword options are for the tests (another catalog folder, no index, other word lists).
require 'json'
require 'set'
require_relative 'realism_text_rules'
require_relative 'validate_realism_catalog'
require_relative '../lib/break_escape/network_model'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/realism_catalog'

# The three private IPv4 ranges: [first address, prefix].
REALISM_SKIN_PRIVATE = [[0x0A000000, 8], [0xAC100000, 12], [0xC0A80000, 16]].freeze

# Real-identifier forms (an ops scenario never holds one; the catalog is the one place for them).
REALISM_SKIN_ADVISORY = [
  /(?<![A-Za-z0-9])cve[-_]\d{4}[-_]\d+/i,
  /(?<![A-Za-z0-9])can[-_]\d{4}[-_]\d+/i,
  /(?<![A-Za-z0-9])ms\d\d[-_]\d{3}/i,
  /(?<![A-Za-z0-9])kb\d{6,7}/i,
  /(?<![A-Za-z0-9])(?:(?:rhsa|dsa|usn|zdi)[-_]\d|ghsa[-_][a-z0-9]{4})/i
].freeze
# A prefix alone, for a generated default (`usn-<class>`): there a bare scheme prefix is the fault, not an ordinary word
REALISM_SKIN_ADVISORY_PREFIX = /(?<![A-Za-z0-9])(?:rhsa|dsa|usn|ghsa|zdi)[-_]/i.freeze
REALISM_SKIN_FRAMEWORK_FIRST = %w[exploit auxiliary post payload payloads encoder nop evasion scanner].freeze
# A framework module path anywhere in a string: case-insensitive, glued to a label or not, but not the tail of a
# longer word or path (a letter, digit, underscore or slash before it).
REALISM_SKIN_PATH = %r{(?<![A-Za-z0-9_/])(?:#{REALISM_SKIN_FRAMEWORK_FIRST.join('|')})(?:/[A-Za-z0-9_.-]+){2,}}i.freeze
# The one form that is not a real path: the default module of a finding (auxiliary/scanner/<word>/<class>_f<n>).
REALISM_SKIN_DEFAULT_FORM = %r{\Aauxiliary/scanner/[a-z0-9_]+/[a-z_]+_f\d+\z}.freeze

# The plain form that passes, per text rule (RealismTextRules rule names).
REALISM_SKIN_PLAIN = {
  'characters' => 'use printable ASCII letters, digits and punctuation only',
  'backslash' => 'write the text without a backslash',
  'percent_escape' => 'write the character itself, not a percent code',
  'hex_literal' => 'use a word or a short decimal number',
  'angle_bracket' => 'leave out the angle brackets and use words',
  'shell_metacharacter' => 'use a comma or the word "and" instead of ; | & or a backtick',
  'flag' => 'describe the option in words instead of a leading dash',
  'encoded_blob' => 'use a short invented word or number, not a long encoded string',
  'path' => 'name the thing in words (a pair such as SMB/CIFS is fine), not a file path',
  'credential' => 'write a label, a colon and a space, then words (for example "Anonymous login: allowed")',
  'host' => 'use a private address (10.x, 172.16 to 172.31, 192.168.x) or a name ending in .local',
  'telltale' => 'say what the service reports, never whether the finding is real or not',
  'instruction' => 'say what the scanner reports (a state, a version, a date), never what someone should do',
  'request_form' => 'say what the service reports in words, not a request, a file name with a path or a query string',
  'weak_telltale' => 'prefer a word that does not suggest whether the finding is real'
}.freeze

REALISM_SKIN_STOP_WORDS = %w[
  about after also because been before being both could does each even from have here into just more most
  once only other over same should some such than that their them then there these they this those under
  upon very were what when where which while will with would your
].to_set.freeze

REALISM_SKIN_CONTROL = /(?<![A-Za-z0-9])(clicks?|clicked|clicking|press the|buttons?|type|types|typed|typing|command line|prompt|terminal)(?![A-Za-z0-9])/i.freeze
REALISM_SKIN_ACTION = /(?<![A-Za-z0-9])(sweeps?|swept|sweeping|scans?|scanned|scanning|checks?|checked|checking|confirms?|confirmed|confirming|sign in|signs in|signed in|signing in|techniques?)(?![A-Za-z0-9])/i.freeze

# ---- small helpers ------------------------------------------------------------------------------

def realism_skin_ip(text)
  m = text.to_s.match(/\A(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\z/)
  return nil unless m

  parts = m.captures.map(&:to_i)
  return nil if parts.any? { |p| p > 255 }

  parts.inject(0) { |acc, p| (acc << 8) | p }
end

# { ip:, prefix:, first:, last:, host_bits: } for "a.b.c.d/n", else nil.
def realism_skin_cidr(text)
  m = text.to_s.match(%r{\A(\d{1,3}(?:\.\d{1,3}){3})/(\d{1,2})\z})
  return nil unless m

  ip = realism_skin_ip(m[1])
  prefix = m[2].to_i
  return nil if ip.nil? || prefix > 32

  mask = prefix.zero? ? 0 : (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF
  first = ip & mask
  { ip: ip, prefix: prefix, first: first, last: first | (~mask & 0xFFFFFFFF), host_bits: (ip & ~mask & 0xFFFFFFFF) != 0 }
end

def realism_skin_private?(cidr)
  REALISM_SKIN_PRIVATE.any? do |base, prefix|
    size = 2**(32 - prefix)
    cidr[:prefix] >= prefix && cidr[:first] >= base && cidr[:last] < base + size
  end
end

def realism_skin_clip(text, len = 40)
  s = text.to_s
  s.length > len ? "#{s[0, len]}..." : s
end

def realism_skin_nickname_patterns(nicknames)
  nicknames.map do |n|
    words = n.split(/[\s_-]+/).reject(&:empty?).map { |w| Regexp.escape(w) }
    next nil if words.empty?

    /(?<![A-Za-z0-9])#{words.join('[\s_-]*')}(?![A-Za-z0-9])/i
  end.compact
end

# Every string value of the scenario with its path, in document order; keys that start with an underscore
# (comments) are skipped. Used to read the whole of an ops scenario for real identifiers.
SKIN_NAME_KEYS = %w[image sprite src icon background].freeze

def realism_skin_all_strings(node, path = '', out = [])
  case node
  when String then out << [path, node]
  when Array then node.each_with_index { |v, i| realism_skin_all_strings(v, "#{path}[#{i}]", out) }
  when Hash
    node.each do |k, v|
      next if k.to_s.start_with?('_')
      # a file reference is a name, not text a player reads (an id or a type is still read: both can show in the Terminal)
      next if v.is_a?(String) && SKIN_NAME_KEYS.include?(k.to_s)

      realism_skin_all_strings(v, path.empty? ? k.to_s : "#{path}/#{k}", out)
    end
  end
  out
end

# Real-identifier fragments in a string: advisory forms, nicknames and (unless advisory_only) framework paths.
def realism_skin_real_ids(text, nick_patterns, advisory_only: false)
  s = text.to_s
  out = []
  REALISM_SKIN_ADVISORY.each { |re| (m = s.match(re)) && out << m[0] }
  (m = s.match(REALISM_SKIN_ADVISORY_PREFIX)) && out << m[0] if advisory_only
  nick_patterns.each { |re| (m = s.match(re)) && out << m[0] }
  unless advisory_only
    s.scan(REALISM_SKIN_PATH) do
      frag = Regexp.last_match[0].sub(/[.\-]+\z/, '')
      parts = frag.split('/', -1)
      next if parts.length < 3 || parts.any?(&:empty?)
      # `post` and `scanner` are ordinary words: a capitalised sign (`Post/Parcels/Deliveries`) is not a module path
      next if %w[post scanner].include?(parts.first.downcase) && parts.all? { |x| x =~ /\A[A-Z][A-Za-z]*\z/ }

      out << frag unless frag =~ REALISM_SKIN_DEFAULT_FORM
    end
  end
  out.uniq
end

def realism_skin_version_clash(text, product, version)
  return nil unless product.is_a?(String) && !product.empty? && version.is_a?(String) && !version.empty?

  names = [product]
  names << product.split.last if product.split.length >= 2 # a banner often drops the vendor word
  m = nil
  names.each { |n| m ||= text.to_s.match(/(?<![A-Za-z0-9])#{Regexp.escape(n)}\s+v?(\d[\w.]*)/i) }
  return nil unless m

  found = m[1].sub(/\.+\z/, '')
  norm = ->(v) { v.to_s.downcase.sub(/\Av/, '') }
  norm.call(found) == norm.call(version) ? nil : found
end

def realism_skin_wording(text)
  c = text.to_s.match(REALISM_SKIN_CONTROL)
  a = text.to_s.match(REALISM_SKIN_ACTION)
  c && a ? [c[0], a[0]] : nil
end

def realism_skin_wording_message(where, pair)
  "#{where}: names a control ('#{pair[0]}') beside an action ('#{pair[1]}'). Say what to do and to what, " \
    "for example 'sweep the office network'; never name the control, because the player may use either look"
end

# True when some host (a `hosts` entry or a sign-in object) declares services: the scenario is an ops scenario.
def realism_skin_uses_services?(json_data)
  nm = BreakEscape::NetworkModel
  return false unless json_data.is_a?(Hash)

  nm.hosts(json_data).each_value { |e| return true unless nm.services_of(e).empty? }
  nm.room_objects(json_data).any? { |e| nm.sign_in_object?(e[:object]) && !nm.services_of(e[:object]).empty? }
end

# The ink half of the wording warning: one warning per ink line of an ops scenario that pairs a control
# word with an action word. Called from the existing ink dialogue checks.
def realism_skin_ink_wording(ink_lines, source_ink_path)
  issues = []
  ink_lines.each_with_index do |line, i|
    stripped = line.strip
    next if stripped.empty? || stripped.start_with?('//', 'VAR ', 'EXTERNAL ', 'INCLUDE ', 'CONST ', '~')

    pair = realism_skin_wording(stripped.sub(/\s#.*\z/, ''))
    next unless pair

    issues << "⚠️ WARNING: realism skin: " + realism_skin_wording_message("'#{source_ink_path}' line #{i + 1}", pair)
  end
  issues
end

# [[where, text, category]] of the scenario's own text that the skin rules read.
def realism_skin_texts(json_data, carriers, findings)
  nm = BreakEscape::NetworkModel
  out = []
  %w[scenario_brief endGoal].each { |k| out << [k, json_data[k], :text] if json_data[k].is_a?(String) }
  nm.networks(json_data).each { |id, n| out << ["networks/#{id}/name", n['name'], :text] if n['name'].is_a?(String) }
  carriers.each do |id, obj|
    out << ["host '#{id}' name", obj['name'], :text] if obj['name'].is_a?(String)
    nm.services_of(obj).each do |svc|
      %w[label product version].each do |k|
        out << ["service '#{id}.#{svc['name']}' #{k}", svc[k], :text] if svc[k].is_a?(String)
      end
    end
  end
  nm.resources(json_data).each do |id, res|
    %w[name host observations].each { |k| out << ["resources/#{id}/#{k}", res[k], :text] if res[k].is_a?(String) }
  end
  findings.each do |f|
    %w[summary falseBecause].each do |k|
      out << ["finding '#{f[:finding_id]}' #{k}", f[:entry][k], :text] if f[:entry][k].is_a?(String)
    end
  end
  walk = lambda do |node, path, category|
    case node
    when String then out << [path, node, category]
    when Array then node.each_with_index { |v, i| walk.call(v, "#{path}[#{i}]", category) }
    when Hash then node.each { |k, v| walk.call(v, "#{path}/#{k}", category) }
    end
  end
  walk.call(json_data['objectives'], 'objectives', :objective) if json_data.key?('objectives')
  scan = lambda do |node, path|
    case node
    when Array then node.each_with_index { |v, i| scan.call(v, "#{path}[#{i}]") }
    when Hash
      walk.call(node.reject { |k, _| k.to_s.start_with?('_') }, path, :mail) if node['type'] == 'email'
      node.each do |k, v|
        next if k.to_s == 'objectives' && path.empty?

        here = path.empty? ? k.to_s : "#{path}/#{k}"
        if k.to_s =~ /hint/i && (v.is_a?(String) || v.is_a?(Array))
          walk.call(v, here, :hint)
        else
          scan.call(v, here)
        end
      end
    end
  end
  scan.call(json_data, '')
  out.uniq { |where, text, _| [where, text] }
end

# ---- the check ----------------------------------------------------------------------------------

def check_realism_skin(json_data, catalog_dir: REALISM_CATALOG_DIR, index_path: REALISM_INDEX_PATH,
                       nicknames_path: REALISM_NICKNAMES_PATH, products_path: REALISM_PRODUCTS_PATH)
  issues = []
  return issues unless json_data.is_a?(Hash)

  err = ->(msg) { issues << "❌ ERROR: realism skin: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: realism skin: #{msg}" }
  nm = BreakEscape::NetworkModel
  ai = BreakEscape::AccessIdentities

  nets = nm.networks(json_data)
  host_map = nm.hosts(json_data)
  objects = nm.room_objects(json_data)
  carriers = host_map.map { |id, e| [id, e] }
  objects.each do |e|
    obj = e[:object]
    carriers << [obj['id'], obj] if nm.sign_in_object?(obj) && obj['id'].is_a?(String)
  end
  uses_services = realism_skin_uses_services?(json_data)
  weaknesses = nm.weaknesses(json_data)
  decoys = nm.decoys(json_data)
  findings = weaknesses + decoys
  nicknames = realism_word_list(nicknames_path)
  nick_patterns = realism_skin_nickname_patterns(nicknames)
  passwords = ai.room_npcs(json_data).filter_map do |e|
    pw = e[:npc].is_a?(Hash) && e[:npc]['creds'].is_a?(Hash) ? e[:npc]['creds']['password'] : nil
    [e[:npc]['id'], pw] if ai.account?(e[:npc]) && pw.is_a?(String) && !pw.empty?
  end

  text_issues = lambda do |where, text, kind|
    RealismTextRules.check(text, kind: kind, scenario: true).each do |f|
      msg = "#{where}: the #{f.rule} rule matched '#{realism_skin_clip(f.fragment)}'; #{REALISM_SKIN_PLAIN[f.rule]}"
      f.level == :error ? err.call(msg) : warn.call(msg)
    end
  end
  password_issues = lambda do |where, text, who|
    passwords.each do |npc_id, pw|
      next unless text.to_s.include?(pw)

      err.call("#{where} holds the password of NPC '#{npc_id}'#{who}. A clue belongs in the text of an item, never in the Terminal's text")
    end
  end
  real_id_issues = lambda do |where, text, advisory_only = false|
    realism_skin_real_ids(text, nick_patterns, advisory_only: advisory_only).each do |frag|
      err.call("#{where} holds '#{realism_skin_clip(frag)}', which looks like a real advisory id, framework path or " \
               'vulnerability nickname. Real identifiers live only in the realism catalog; describe the issue in plain words instead')
    end
  end

  # ---- Networks: ranges, addresses, hosts ----
  ranges = {}
  address_owner = {}
  nets.each do |net_id, net|
    cli = net['cli']
    next unless cli.is_a?(Hash)

    where = "networks/#{net_id}/cli"
    range = cli['range']
    cidr = nil
    unless range.nil?
      cidr = realism_skin_cidr(range)
      if cidr.nil?
        err.call("#{where}.range '#{realism_skin_clip(range)}' is not an address range written a.b.c.d/n")
      else
        err.call("#{where}.range '#{range}' is outside the three private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)") unless realism_skin_private?(cidr)
        err.call("#{where}.range '#{range}' has a prefix outside /16 to /30") if cidr[:prefix] < 16 || cidr[:prefix] > 30
        err.call("#{where}.range '#{range}' has host bits set; write the network address, such as the first address of the block") if cidr[:host_bits]
        ranges[net_id] = cidr unless cidr[:host_bits]
      end
    end
    hosts_cli = cli['hosts']
    next unless hosts_cli.is_a?(Hash)

    members = nm.hosts_on(net_id, json_data).map { |rec| rec[:id] }
    hosts_cli.each do |key, entry|
      if key.to_s.length > 64
        err.call("#{where}.hosts key '#{realism_skin_clip(key)}' is longer than 64 characters")
        next
      end
      err.call("#{where}.hosts key '#{key}' is not a host on network '#{net_id}'") unless members.include?(key)
      next unless entry.is_a?(Hash) && entry.key?('address')

      addr = entry['address']
      ip = realism_skin_ip(addr)
      if ip.nil?
        err.call("#{where}.hosts '#{realism_skin_clip(key)}' address '#{realism_skin_clip(addr)}' is not a dotted IPv4 address")
        next
      end
      if range.nil?
        err.call("#{where}.hosts '#{key}' has an address but the network has no range")
      elsif cidr
        if ip < cidr[:first] || ip > cidr[:last]
          err.call("#{where}.hosts '#{key}' address #{addr} is outside the network's range #{range}")
        elsif ip == cidr[:first] || ip == cidr[:last]
          err.call("#{where}.hosts '#{key}' address #{addr} is the network or broadcast address of #{range}")
        end
      end
      if address_owner.key?(ip)
        prior_net, prior_host = address_owner[ip]
        err.call("#{where}.hosts '#{key}' address #{addr} is also used by host '#{prior_host}' on network '#{prior_net}'")
      else
        address_owner[ip] = [net_id, key]
      end
    end
  end
  range_nets = ranges.keys.sort
  range_nets.combination(2) do |a, b|
    next if ranges[a][:last] < ranges[b][:first] || ranges[b][:last] < ranges[a][:first]

    err.call("networks '#{a}' and '#{b}' have overlapping ranges (#{nets[a]['cli']['range']} and #{nets[b]['cli']['range']})")
  end
  discovery = nets.keys.select { |id| nm.discovery?(json_data, id) }
  ranged = discovery.select { |id| nets[id]['cli'].is_a?(Hash) && !nets[id]['cli']['range'].nil? }
  if !ranged.empty? && ranged.length < discovery.length
    missing = (discovery - ranged).map { |id| "'#{id}'" }.join(', ')
    err.call("some discovery networks have a cli.range and some do not (no range on: #{missing}); give every discovery network one, or none")
  end

  # ---- A network id must not be a host, room object or resource id ----
  unless nets.empty?
    taken = {}
    host_map.each_key { |id| taken[id] = 'host' }
    objects.each { |e| taken[e[:object]['id']] ||= 'room object' if e[:object]['id'].is_a?(String) }
    nm.resources(json_data).each_key { |id| taken[id] ||= 'resource' }
    nets.each_key do |net_id|
      err.call("network '#{net_id}' has the same id as a #{taken[net_id]}; networks, hosts, room objects and resources share one id space") if taken.key?(net_id)
    end
  end

  # ---- Services: ports, cli strings ----
  carriers.each do |host_id, obj|
    services = nm.services_of(obj)
    by_port = services.group_by { |s| s['port'] }
    by_port.each do |port, list|
      next unless port.is_a?(Integer) && list.length > 1

      err.call("host '#{host_id}' has services '#{list[0]['name']}' and '#{list[1]['name']}' on the same port #{port}; a port is used once per host, whatever the protocol")
    end
    services.each do |svc|
      cli = svc['cli']
      next unless cli.is_a?(Hash)

      label = "service '#{host_id}.#{svc['name']}'"
      %w[service banner].each do |key|
        value = cli[key]
        next unless value.is_a?(String)

        where = "#{label} cli.#{key}"
        text_issues.call(where, value, key == 'banner' ? :prose : :text)
        password_issues.call(where, value, '')
        real_id_issues.call(where, value) if uses_services
      end
      banner = cli['banner']
      next unless banner.is_a?(String)

      realism_word_list(products_path).each do |name|
        next unless realism_whole_word?(banner, name)

        err.call("#{label} cli.banner names a real product ('#{name}'); products in this game are invented")
      end
      found = realism_skin_version_clash(banner, svc['product'], svc['version'])
      err.call("#{label} cli.banner gives version #{realism_skin_clip(found, 20)} after the product, but the service's version is #{realism_skin_clip(svc['version'], 20)}") if found
    end
  end

  # ---- Real identifiers in the scenario's other text (ops scenarios only) ----
  linked = findings.select { |f| f[:entry]['realism'].is_a?(String) }
  if uses_services
    named = realism_skin_texts(json_data, carriers, findings)
    named.each { |where, text, _category| real_id_issues.call(where, text) }
    # then every other string of the scenario: technique and item names, signs, notes, file text, NPC names
    seen = named.map { |_where, text, _category| text }.to_set
    realism_skin_all_strings(json_data).each do |where, text|
      next if seen.include?(text)

      seen << text
      real_id_issues.call(where, text)
    end
    linked.each { |f| real_id_issues.call("finding '#{f[:finding_id]}' realism id", f[:entry]['realism']) }
    if linked.empty?
      findings.each do |f|
        svc_name = f[:service_name].to_s
        cls = f[:entry]['class'].to_s
        default_module = "auxiliary/scanner/#{svc_name.tr('-', '_')}/#{cls}_#{f[:id]}"
        default_script = "#{svc_name}-#{cls.tr('_', '-')}"
        [['default module', default_module], ['default script', default_script]].each do |what, text|
          real_id_issues.call("finding '#{f[:finding_id]}' #{what}", text, true)
        end
      end
    end
  end

  # ---- Wording: text about the game never names a control (warnings) ----
  if uses_services
    realism_skin_texts(json_data, carriers, findings).each do |where, text, category|
      next unless %i[objective hint mail].include?(category)

      pair = realism_skin_wording(text)
      warn.call(realism_skin_wording_message("'#{where}'", pair)) if pair
    end
  else
    warn.call("'networkView' is set but no host declares services, so the Terminal appears only while a sweep is on offer and has nothing to show after it") if json_data.key?('networkView')
    nets.each do |net_id, net|
      warn.call("'networks/#{net_id}/cli' is set but no host declares services; the Terminal reads it only for hosts with services") if net['cli'].is_a?(Hash)
    end
  end

  # ---- Links (read the catalog only when there is a link) ----
  unless linked.empty?
    problems = check_realism_catalog(catalog_dir, index_path: index_path, nicknames_path: nicknames_path,
                                                  products_path: products_path, scenarios_dir: nil)
    bad = problems.find { |p| p.level == :error }
    if bad
      err.call("the realism catalog does not validate (file: #{bad.file}); catalog task: fix the catalog")
      return issues
    end
  end
  catalog = {}
  unless linked.empty?
    BreakEscape::RealismCatalog.with_folder(catalog_dir) do
      linked.each { |f| catalog[f[:entry]['realism']] = BreakEscape::RealismCatalog.lookup(f[:entry]['realism']) }
    end
  end

  # Banner on some finding-holding services and not on others.
  holders = findings.group_by { |f| [f[:host_id], f[:service_name]] }.map { |_k, list| list.first[:service] }
  with_banner = holders.select { |svc| svc['cli'].is_a?(Hash) && svc['cli']['banner'].is_a?(String) && !svc['cli']['banner'].empty? }
  if !with_banner.empty? && with_banner.length < holders.length
    names = (holders - with_banner).map { |svc| "'#{svc['name']}'" }.join(', ')
    err.call("cli.banner is set on some services that hold a finding and not on others (none on: #{names}); set it on all of them, or none")
  end
  return issues if linked.empty?

  by_link = linked.group_by { |f| f[:entry]['realism'] }
  by_link.each do |id, list|
    next if list.length < 2

    err.call("realism id '#{id}' is linked by more than one finding (#{list.map { |f| "'#{f[:finding_id]}'" }.join(', ')}); each entry is linked once")
  end
  resolved = []
  linked.each do |f|
    entry = catalog[f[:entry]['realism']]
    if entry.nil?
      err.call("finding '#{f[:finding_id]}' links realism id '#{realism_skin_clip(f[:entry]['realism'], 48)}', which names no catalog entry (read docs/REALISM_CATALOG_INDEX.md)")
    else
      resolved << [f, entry]
    end
  end
  unlinked = findings - linked
  unless unlinked.empty?
    err.call("some findings link a realism entry and some do not (not linked: #{unlinked.map { |f| "'#{f[:finding_id]}'" }.join(', ')}); link all or none")
  end

  { 'advisories' => 'advisories', 'output' => 'output' }.each_key do |field|
    has = resolved.select { |_f, e| e[field].is_a?(Array) && !e[field].empty? }
    next if has.empty? || has.length == resolved.length

    lacking = (resolved - has).map { |f, _e| "'#{f[:finding_id]}'" }.join(', ')
    err.call("linked entries must all hold #{field} or none; no #{field} for: #{lacking}")
  end

  counts = ->(e) { [Array(e['advisories']).length, Array(e['output']).length] }
  mod_form = lambda do |e|
    segs = e['module'].to_s.split('/')
    [segs.first.to_s, segs.length]
  end
  weak_resolved = resolved.select { |f, _e| f[:kind] == 'weakness' }
  weak_counts = weak_resolved.map { |_f, e| counts.call(e) }.uniq
  weak_forms = weak_resolved.map { |_f, e| mod_form.call(e) }.uniq
  resolved.each do |f, e|
    next unless f[:kind] == 'decoy'

    unless weak_counts.include?(counts.call(e))
      err.call("decoy '#{f[:finding_id]}' links '#{f[:entry]['realism']}' with the form (#{realism_form(e)}), and no weakness in this scenario links an entry with the same advisory and output counts")
    end
    unless weak_forms.include?(mod_form.call(e))
      err.call("decoy '#{f[:finding_id]}' links '#{f[:entry]['realism']}' whose module form (#{mod_form.call(e).join('/')}) is used by no weakness in this scenario")
    end
  end
  resolved.group_by { |f, _e| [f[:host_id], f[:service_name]] }.each do |(host_id, svc), list|
    forms = list.map { |_f, e| mod_form.call(e) }.uniq
    next if forms.length < 2

    err.call("service '#{host_id}.#{svc}': the linked modules differ in first segment or number of segments (#{forms.map { |a, n| "#{a}/#{n}" }.join(' and ')})")
  end

  resolved.each do |f, e|
    where = "finding '#{f[:finding_id]}' (realism '#{f[:entry]['realism']}')"
    strings = [e['title'], e['module'], e['script']] + Array(e['advisories']) + Array(e['output'])
    password_issues.call("an entry linked by #{where}", strings.compact.join("\n"), '')
    svc = f[:service]
    ([e['title']] + Array(e['output'])).compact.each do |line|
      found = realism_skin_version_clash(line, svc['product'], svc['version'])
      next unless found

      err.call("an entry linked by #{where} gives version #{realism_skin_clip(found, 20)} after the product, but the service's version is #{realism_skin_clip(svc['version'], 20)}")
    end
    next unless f[:kind] == 'decoy' && f[:entry]['falseBecause'].is_a?(String)

    entry_words = ([e['title']] + Array(e['output'])).compact.join(' ').downcase.scan(/[a-z]{4,}/).to_set
    reason_words = f[:entry]['falseBecause'].downcase.scan(/[a-z]{4,}/).to_set
    (entry_words & reason_words).reject { |w| REALISM_SKIN_STOP_WORDS.include?(w) }.sort.each do |word|
      warn.call("decoy '#{f[:finding_id]}': its linked entry shares the word '#{word}' with the decoy's falseBecause, which may give the answer away")
    end
  end
  issues
end
