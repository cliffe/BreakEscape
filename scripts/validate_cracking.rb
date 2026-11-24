# frozen_string_literal: true

# Hash records and the offline cracker (S7 unit 09, feature A21). One entry point, check_cracking,
# called by scripts/validate_scenario.rb after check_credentials. Game abstraction only: it reads
# the recipe a hash record carries (crack.password, crack.facts, crack.difficulty,
# crack.passwordPattern) and the sources of the facts it names, and never prints a password.
# Docs: docs/agents/ops_core_build/S7_BUILD_BRIEF.md, section 4.
require 'set'
require_relative '../lib/break_escape/crack_difficulty'
require_relative '../lib/break_escape/credential_model'
require_relative '../lib/break_escape/declared_grants'
require_relative '../lib/break_escape/access_identities'
require_relative '../lib/break_escape/access_work'

OPS_CRACK_CAP = 64
CRACK_CLASSES = %w[strong guessable reused common].freeze
CRACK_FACT_PREFIX = 'se_intel_'
CRACK_SECONDS_RANGE = (10..600).freeze

# Every item-shaped Hash (a string type) that carries revealsFacts, with its key chain and ancestors.
def crack_reveal_items(data)
  out = []
  walk = lambda do |node, chain, ancestors|
    case node
    when Hash
      out << { item: node, chain: chain, ancestors: ancestors } if node.key?('revealsFacts') && node['type'].is_a?(String)
      node.each { |k, v| walk.call(v, chain + [k.to_s], ancestors + [node]) }
    when Array
      node.each_with_index { |v, i| walk.call(v, chain + [i], ancestors + [node]) }
    end
  end
  walk.call(data, [], [])
  out
end

# Every Hash that has the key, anywhere, with its ancestors.
def crack_hashes_with(data, key)
  out = []
  walk = lambda do |node, ancestors|
    case node
    when Hash
      out << { node: node, ancestors: ancestors } if node.key?(key)
      node.each_value { |v| walk.call(v, ancestors + [node]) }
    when Array
      node.each { |v| walk.call(v, ancestors + [node]) }
    end
  end
  walk.call(data, [])
  out
end

# R2-4: fact id => where else it is awarded: a mail highlight, a pretext call's intel list, or a
# grant_fact action that is not a flag reward.
def crack_other_award_paths(data)
  out = {}
  walk = lambda do |node, path, under_rewards|
    case node
    when Hash
      out[node['fact']] ||= path if !under_rewards && node['type'] == 'grant_fact' && node['fact'].is_a?(String)
      out[node['grants']] ||= "a mail highlight at #{path}" if node['grants'].is_a?(String) && path.include?('highlights')
      if node['grants'].is_a?(Hash)
        Array(node['grants']['intel']).each { |f| out[f] ||= "a pretext call at #{path}" if f.is_a?(String) }
      end
      node.each { |k, v| walk.call(v, "#{path}/#{k}", under_rewards || k == 'flagRewards') }
    when Array
      node.each_with_index { |v, i| walk.call(v, "#{path}/#{i}", under_rewards) }
    end
  end
  walk.call(data, '', false)
  out.transform_values { |w| w.start_with?('a ') ? w : "a grant_fact action at #{w[0, 80]}" }
end

# R1-C2: any item of type capture_log that holds captures, anywhere in the scenario.
def crack_has_capture_log?(data)
  found = false
  walk = lambda do |node|
    case node
    when Hash
      found = true if node['type'] == 'capture_log' && node['holds'].is_a?(Hash) && node['holds']['captures'] == true
      node.each_value { |v| walk.call(v) } unless found
    when Array
      node.each { |v| walk.call(v) unless found }
    end
  end
  walk.call(data)
  found
end

# Whether this revealsFacts item is somewhere the server sees the player get it.
def crack_item_is_source?(entry, data)
  item = entry[:item]
  chain = entry[:chain]
  return true if chain.include?('startItemsInInventory')

  rooms_at = chain.index('rooms')
  held_at = chain.rindex('itemsHeld')
  if held_at
    owner = entry[:ancestors].reverse.find { |a| a.is_a?(Hash) && a['itemsHeld'].is_a?(Array) }
    return false unless owner

    if owner['flagRewards'].is_a?(Array)
      return owner['flagRewards'].any? do |r|
        r.is_a?(Hash) && r['type'] == 'give_item' &&
          (r['item_name'].to_s == item['name'].to_s && !item['name'].to_s.empty?)
      end
    end
    return rooms_at ? item['takeable'] == true : false
  end
  # An inline item under a flag reward is never given: the server reads the station's itemsHeld
  return false if chain.include?('flagRewards')

  return false unless rooms_at && chain[rooms_at + 2] == 'objects'

  # rooms.<id>.objects[i](.contents[j]...)*. A container's contents are served as it is opened;
  # a room object, a container's content item, a share file or a PC file counts when takeable (the
  # server refuses an add of an item that is not: "Item is not takeable").
  rest = chain[(rooms_at + 4)..] || []
  return item['takeable'] == true if rest.empty?
  item['takeable'] == true
end

def crack_object_ids(data)
  ids = Set.new
  walk = lambda do |node|
    case node
    when Hash
      ids << node['id'].to_s if node['id'].is_a?(String) && (node.key?('type') || node.key?('name'))
      node.each_value { |v| walk.call(v) }
    when Array
      node.each { |v| walk.call(v) }
    end
  end
  walk.call(data['rooms'])
  ids
end

def crack_object_text?(data, object_id)
  found = nil
  walk = lambda do |node|
    case node
    when Hash
      found = node if found.nil? && node['id'].to_s == object_id && (node.key?('type') || node.key?('name'))
      node.each_value { |v| walk.call(v) } if found.nil?
    when Array
      node.each { |v| walk.call(v) } if found.nil?
    end
  end
  walk.call(data['rooms'])
  return true unless found

  %w[readable text observations contents description].any? do |k|
    v = found[k]
    v.is_a?(String) ? !v.strip.empty? : (v.is_a?(Array) || v.is_a?(Hash)) && !v.empty?
  end
end

# Capture secrets anywhere in the scenario: a hash with a string secret and a targetId or address.
def crack_capture_secrets(data)
  secrets = []
  walk = lambda do |node|
    case node
    when Hash
      secrets << node['secret'] if node['secret'].is_a?(String) && !node['secret'].empty? && (node.key?('targetId') || node.key?('address'))
      node.each_value { |v| walk.call(v) }
    when Array
      node.each { |v| walk.call(v) }
    end
  end
  walk.call(data)
  secrets
end

# Bare fact ids the scenario's feed posts give, each with one leading se_intel_ removed.
def crack_feed_fact_ids(data)
  BreakEscape::CredentialModel.room_npcs(data).flat_map do |npc|
    BreakEscape::AccessWork.feed_posts(npc).filter_map do |post|
      post['fact'].delete_prefix(CRACK_FACT_PREFIX) if post['fact'].is_a?(String) && !post['fact'].empty?
    end
  end.to_set
end

def check_cracking(json_data)
  issues = []
  return issues unless json_data.is_a?(Hash)

  cm = BreakEscape::CredentialModel
  cd = BreakEscape::CrackDifficulty
  err  = ->(msg) { issues << "❌ ERROR: cracking: #{msg}" }
  warn = ->(msg) { issues << "⚠️ WARNING: cracking: #{msg}" }

  social = json_data['social'].is_a?(Hash) ? json_data['social'] : {}
  fact_ids = social['intelFacts'].is_a?(Hash) ? social['intelFacts'].keys.map(&:to_s).to_set : Set.new
  bad_fact = lambda do |id|
    return "is not a string" unless id.is_a?(String)
    return "carries the #{CRACK_FACT_PREFIX} prefix; name the bare social.intelFacts id" if id.start_with?(CRACK_FACT_PREFIX)
    return "is not a social.intelFacts id" unless fact_ids.include?(id)

    nil
  end

  # ---- items: revealsFacts ----------------------------------------------------------------
  declared = BreakEscape::DeclaredGrants.for(json_data).map { |g| g['item'] }
  reveal_entries = crack_reveal_items(json_data)
  item_ids = Hash.new(0)
  reveal_entries.each do |e|
    item = e[:item]
    label = "item '#{item['id'].to_s[0, 60]}'"
    facts = item['revealsFacts']
    err.call("#{label}: revealsFacts must be a list of fact ids") unless facts.is_a?(Array)
    err.call("an item with revealsFacts has no id (a fact's source must be an item the server can name)") if !item['id'].is_a?(String) || item['id'].empty?
    if declared.any? { |d| d.equal?(item) } || e[:ancestors].any? { |a| declared.any? { |d| d.equal?(a) } }
      err.call("#{label}: a timer or object action hands this item over, so the server cannot see the player earn its facts")
    end
    type = item['type'].to_s
    if BreakEscape::DeclaredGrants::ALWAYS_ALLOWED.include?(type) || BreakEscape::DeclaredGrants::DECOR_CUPS.include?(type)
      err.call("#{label}: revealsFacts on a notepad or decor cup has no effect (the client builds these)")
    end
    Array(facts).each do |f|
      problem = bad_fact.call(f)
      err.call("#{label}: revealsFacts entry #{f.to_s[0, 60].inspect} #{problem}") if problem
    end
  end
  # Two definitions with one id where either carries revealsFacts.
  with_reveals = reveal_entries.map { |e| e[:item]['id'] }.grep(String).reject(&:empty?).to_set
  unless with_reveals.empty?
    counts = Hash.new(0)
    walk = lambda do |node|
      case node
      when Hash
        counts[node['id']] += 1 if node['id'].is_a?(String) && node['type'].is_a?(String) && with_reveals.include?(node['id'])
        node.each_value { |v| walk.call(v) }
      when Array
        node.each { |v| walk.call(v) }
      end
    end
    walk.call(json_data)
    counts.each { |id, n| err.call("item id '#{id[0, 60]}' is defined #{n} times and carries revealsFacts; the server reads the stored copy, so give each its own id") if n > 1 }
  end

  # ---- grant_fact flag rewards ------------------------------------------------------------
  grant_fact_ids = Set.new
  crack_hashes_with(json_data, 'flagRewards').each do |h|
    rewards = h[:node]['flagRewards']
    rewards = rewards.values if rewards.is_a?(Hash) # the hash form { "<flag>": { type, ... } } (R2-3)
    Array(rewards).each do |r|
      next unless r.is_a?(Hash) && r['type'] == 'grant_fact'

      problem = bad_fact.call(r['fact'])
      if problem
        err.call("grant_fact flag reward fact #{r['fact'].to_s[0, 60].inspect} #{problem}")
      else
        grant_fact_ids << r['fact']
      end
    end
  end

  # R2-4: the server withholds a fact named by revealsFacts or a flag grant_fact until it sees it
  # earned, so a second award path the server cannot see (a mail highlight, a pretext call, a
  # grant_fact action on an object or in dialogue) would do nothing.
  other_paths = Hash.new { |h, k| h[k] = [] }
  crack_other_award_paths(json_data).each { |fid, where| other_paths[fid] << where }
  (reveal_entries.flat_map { |e| Array(e[:item]['revealsFacts']).grep(String) }.to_set | grant_fact_ids).each do |fid|
    next unless other_paths.key?(fid)

    err.call("fact `#{fid}` is awarded by an item or flag reward and also by #{other_paths[fid].first}; the server withholds it until it sees it earned there, so the second path does nothing. Give each fact one award path")
  end

  # ---- fact sources -----------------------------------------------------------------------
  item_fact_ids = reveal_entries.select { |e| crack_item_is_source?(e, json_data) && !declared.any? { |d| d.equal?(e[:item]) } }
                                .flat_map { |e| Array(e[:item]['revealsFacts']).grep(String) }.to_set
  feed_fact_ids = crack_feed_fact_ids(json_data)
  server_sources = item_fact_ids | feed_fact_ids | grant_fact_ids

  # ---- hash records -----------------------------------------------------------------------
  creds = json_data['credentials'].is_a?(Hash) ? json_data['credentials'] : {}
  hashes = creds.select { |_id, e| e.is_a?(Hash) && e['kind'] == 'hash' }
  capture_secrets = crack_capture_secrets(json_data)
  reveal_secret = social['captures'].is_a?(Hash) && social['captures']['revealSecret'] == true
  accounts = cm.room_npcs(json_data).select { |n| BreakEscape::AccessIdentities.account?(n) }
  object_ids = crack_object_ids(json_data)

  # R1-S10: the server keeps at most 64 earned facts and 64 cracked accounts, and drops the rest quietly
  stampable = item_fact_ids | grant_fact_ids
  if stampable.size > OPS_CRACK_CAP
    err.call("this scenario has #{stampable.size} distinct stampable facts (revealsFacts and grant_fact); the server keeps at most #{OPS_CRACK_CAP} earned facts")
  end
  if hashes.size > OPS_CRACK_CAP
    err.call("this scenario has #{hashes.size} hash records; the server keeps at most #{OPS_CRACK_CAP} cracked accounts")
  end

  # R1-C2: a hash row is only listed, and the cracker only opens, from the capture log
  unless hashes.empty? || crack_has_capture_log?(json_data)
    err.call("this scenario has hash records but no capture log item (type capture_log with holds.captures true) the player can hold; the capture log is the only way to list a hash and open the cracker")
  end

  hashes.each do |id, entry|
    label = "credential '#{id.to_s[0, 64]}'"
    npc = cm.account_npc(json_data, entry['account'])
    err.call("#{label} account '#{entry['account'].to_s[0, 60]}' is not an account holder") unless npc
    err.call("#{label} is a hash and must not set connectsTo (a hash never signs in)") if entry.key?('connectsTo')
    proof = entry['proof'].is_a?(Hash) ? entry['proof'] : {}
    unless %w[held technique_card].any? { |k| cm.present_string?(proof[k]) }
      err.call("#{label} proof must be `held` (a hash file the player holds) or `technique_card`; no other proof kind lists a hash row")
    end

    crack = entry['crack'].is_a?(Hash) ? entry['crack'] : {}
    habits = npc && npc['habits'].is_a?(Hash) ? npc['habits'] : {}
    written = crack['password']
    habit_class = habits['password']
    klass = written || habit_class
    password = npc && npc['creds'].is_a?(Hash) ? npc['creds']['password'] : nil

    # Difficulty: an unknown grade from either place.
    resolved = cd.resolve(entry, npc)
    if resolved.nil?
      err.call("#{label} has an unknown difficulty grade (crack.difficulty or the account's habits.passwordDifficulty); the grades are #{cd::GRADES.join(', ')}")
    end
    grade = [crack['difficulty'], habits['passwordDifficulty']].find { |g| cd::GRADES.include?(g) }

    # Class.
    if npc
      if klass.nil?
        err.call("#{label} has no password class: set crack.password or give the account a habits.password")
      elsif !CRACK_CLASSES.include?(klass)
        err.call("#{label} password class #{klass.to_s[0, 40].inspect} is not one of #{CRACK_CLASSES.join(', ')}")
        klass = nil
      end
      err.call("#{label} account '#{npc['id'].to_s[0, 60]}' has no creds.password, so there is nothing to crack") unless cm.present_string?(password)
    end
    warn.call("#{label} class '#{written}' differs from the account's habit '#{habit_class}'; the record wins, so the habit's clue text and the cracker disagree") if written && habit_class && written != habit_class

    # Facts.
    facts = crack['facts']
    if klass == 'guessable'
      if !facts.is_a?(Array) || facts.empty? || facts.length > 4
        err.call("#{label} is guessable and must set crack.facts: 1 to 4 bare social.intelFacts ids")
      else
        err.call("#{label} crack.facts repeats an id") if facts.uniq.length != facts.length
        facts.each do |f|
          problem = bad_fact.call(f)
          if problem
            err.call("#{label} crack.facts entry #{f.to_s[0, 60].inspect} #{problem}")
          elsif !server_sources.include?(f)
            err.call("#{label}: fact `#{f}` must come from an item the server sees the player get (a takeable item, a share or container file, a takeable NPC held item, a flag reward item or a start item), a feed post or a `grant_fact` flag reward")
          end
        end
        band = grade && cd.fact_band(grade)
        count = facts.uniq.length
        if band && !band.cover?(count)
          expected = band.min == band.max ? band.min.to_s : "#{band.min} or #{band.max}"
          warn.call("#{label}: difficulty `#{grade}` expects #{expected} facts; this recipe has #{count}")
        end
      end
    elsif crack.key?('facts')
      err.call("#{label} sets crack.facts but its class is #{klass.nil? ? 'unresolved' : "'#{klass}'"}; facts belong to a guessable recipe only")
    end

    # Grade on a strong password.
    warn.call("#{label}: difficulty has no effect on a strong password; it is a dead end at every grade") if klass == 'strong' && grade

    # Salted and crackSeconds.
    if entry.key?('crackSeconds')
      cs = entry['crackSeconds']
      if !cs.is_a?(Integer) || !CRACK_SECONDS_RANGE.cover?(cs)
        err.call("#{label} crackSeconds must be a whole number of seconds from #{CRACK_SECONDS_RANGE.min} to #{CRACK_SECONDS_RANGE.max}")
      elsif resolved && !resolved[:salted]
        err.call("#{label} sets crackSeconds but the record is not salted (salted resolves to false); only a salted record waits")
      end
    end

    # Pattern.
    if crack.key?('passwordPattern')
      pid = crack['passwordPattern']
      if klass && klass != 'guessable'
        warn.call("#{label} sets crack.passwordPattern on a '#{klass}' password; a pattern clue belongs to a guessable one")
      end
      if !pid.is_a?(String) || !object_ids.include?(pid)
        err.call("#{label} crack.passwordPattern #{pid.to_s[0, 60].inspect} names no object")
      elsif !crack_object_text?(json_data, pid)
        warn.call("#{label} crack.passwordPattern '#{pid}' names an object with no readable text, so it backs nothing")
      end
    end

    # Reused and capture overlap warnings.
    next unless cm.present_string?(password)

    if klass == 'reused'
      others = accounts.reject { |a| a['id'] == (npc && npc['id']) }.any? { |a| a['creds'].is_a?(Hash) && a['creds']['password'] == password }
      warn.call("#{label} is a reused password but no other account, registry password entry or capture target holds an equal password") unless others || capture_secrets.include?(password)
    end
    warn.call("#{label} account password equals a capture target's secret while social.captures.revealSecret is not true; the cracker would hand over what the capture hides") if capture_secrets.include?(password) && !reveal_secret
  end

  # R1-L13: an unsalted direct hit hands over every other held unsalted record with an equal password, whatever that
  # record's own class (OpsCracking#crack_grant!). Accounts with an unsalted hash record and equal passwords, one of them
  # strong or guessable, would be given away without their own recipe; usually a copied NPC whose password was not changed.
  # (Salted records neither batch nor receive a batch, so a salted pair, such as a guessable and a reused account, is silent.)
  unsalted_groups = Hash.new { |h, k| h[k] = {} }
  hashes.each do |_id, entry|
    npc = cm.account_npc(json_data, entry['account'])
    password = npc && npc['creds'].is_a?(Hash) ? npc['creds']['password'] : nil
    next unless cm.present_string?(password)

    resolved = cd.resolve(entry, npc)
    next unless resolved && resolved[:salted] == false

    crack = entry['crack'].is_a?(Hash) ? entry['crack'] : {}
    habits = npc['habits'].is_a?(Hash) ? npc['habits'] : {}
    unsalted_groups[password][npc['id']] = crack['password'] || habits['password']
  end
  unsalted_groups.each_value do |members|
    next if members.size < 2

    weak = members.select { |_npc_id, klass| %w[strong guessable].include?(klass) }.keys
    next if weak.empty?

    warn.call("accounts #{members.keys.map { |a| a.to_s[0, 40] }.sort.join(', ')} have unsalted hash records and equal passwords, and #{weak.map { |a| a.to_s[0, 40] }.sort.join(', ')} " \
              "is strong or guessable: an unsalted crack of any of them would grant the others without their own recipe; give each account its own password")
  end

  # R2-L6: a cracked entry shows the password whatever the salt. Hash-record accounts with equal passwords, where a strong or
  # guessable one sits beside an easier one (common, or guessable beside strong), hand the harder password over by value.
  # A guessable or strong account beside a reused one is silent (the reused record needs its partner first).
  value_groups = Hash.new { |h, k| h[k] = {} }
  hashes.each do |_id, entry|
    npc = cm.account_npc(json_data, entry['account'])
    password = npc && npc['creds'].is_a?(Hash) ? npc['creds']['password'] : nil
    next unless cm.present_string?(password) && cd.resolve(entry, npc)

    crack = entry['crack'].is_a?(Hash) ? entry['crack'] : {}
    habits = npc['habits'].is_a?(Hash) ? npc['habits'] : {}
    value_groups[password][npc['id']] = crack['password'] || habits['password']
  end
  value_groups.each_value do |members|
    classes = members.values
    next unless (classes.include?('strong') && (classes.include?('guessable') || classes.include?('common'))) ||
                (classes.include?('guessable') && classes.include?('common'))

    warn.call("accounts #{members.keys.map { |a| a.to_s[0, 40] }.sort.join(', ')} have hash records and equal passwords of different classes: " \
              "cracking the easier one shows the password of the harder one without its recipe, salted or not; give each account its own password")
  end

  # ---- policies: accepts hash --------------------------------------------------------------
  if json_data['policies'].is_a?(Hash)
    json_data['policies'].each do |pname, policy|
      next unless policy.is_a?(Hash) && policy['accepts'].is_a?(Array) && policy['accepts'].include?('hash')

      err.call("policy '#{pname.to_s[0, 60]}' accepts 'hash'; a hash never signs in")
    end
  end

  issues
end
