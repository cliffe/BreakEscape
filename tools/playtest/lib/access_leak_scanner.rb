# frozen_string_literal: true

require 'json'
require 'set'
require 'uri'

# Checks the responses a playtest captured (playtest-session.js --capture-responses) for
# access model secrets that should never have reached the browser
# (docs/achitechture/ACCESS_MODEL_PLAN.md, section 5.6 and step 6).
#
# The secrets come from the game's own scenario data, so the tester never sees them:
#
# - every room NPC's creds.password;
# - the names and texts of every item under a sign-in PC (lockType "login"), under an
#   account profile, or inside a container the scenario authors as locked.
#
# It reports:
#
# - a password anywhere in any response body, except inside an object whose authored text
#   holds it on purpose (a note or postitNote: a deliberate clue), and except a
#   /capture_secrets answer for an NPC with a capture route in a scenario that sets
#   social.captures.revealSecret;
# - the content of a sign-in PC or profile item in any response other than
#   GET /container/:id for that PC (any sign-in PC, for a profile item) or a folder inside it;
# - the content of a locked container in a response that still marks that container
#   locked: true.
#
# Networks (docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md, step 6) add secrets: every
# network name; every resource name, host and observations; the names and texts of the
# items under resources (file share contents). It reports:
#
# - a share item's content anywhere but a GET /container/:id answer for that resource or a
#   folder in it (once served that way, the item may follow into the inventory);
# - a network or resource string in any response other than GET /network, a /network/*
#   answer, a /container answer, or the footholds block of GET /scenario. There is no
#   exception for an NPC's work plan.
#
# Matching of these network strings: a string of six or more characters is matched as a
# substring; a shorter one only as a whole JSON string value; one under three characters is
# ignored; and a string that also appears somewhere public (a room, door sign, object or NPC
# name, or any other text room data ships as authored) is not a secret and is skipped.
#
# A finding names the rule, the route, the response line and the secret's owner (an NPC or
# item id), never the value. Every output line is checked against the secret values before it
# is returned, so blind runs can use it too.
#
# Usage (see tools/playtest/access-leak-check.rb):
#
#   scanner = AccessLeakScanner.new(scenario_data)
#   findings = scanner.scan(lines)   # lines: [[source_label, line_no, parsed_hash], ...]
#   scanner.report_lines(findings)
class AccessLeakScanner
  # Item fields whose strings are an item's content (its name and its text).
  CONTENT_FIELDS = %w[name text content].freeze
  # Keys under which the scenario nests further items, NPCs or objects.
  CHILD_KEYS = %w[contents itemsHeld tableItems npcs objects].freeze
  # Content strings shorter than this are too generic to tell a leak from a coincidence.
  MIN_CONTENT_LENGTH = 6
  # A password shorter than this is matched as a whole token, not as a substring.
  MIN_SUBSTRING_PASSWORD = 6
  # Network strings (network and resource names, hosts, observations, share item content):
  # this long or longer is matched as a substring, shorter only as a whole JSON string value.
  MIN_SUBSTRING_NETWORK = 6
  # Network strings shorter than this are not checked at all.
  MIN_NETWORK_STRING = 3
  # Room data keys the server withholds: their strings are not public.
  WITHHELD_ROOM_KEYS = %w[network linkName linkStoreIn creds].freeze

  Finding = Struct.new(:rule, :owner, :route, :source, :line, :cmd_seq, :json_path, keyword_init: true)

  attr_reader :passwords, :items

  def initialize(scenario_data)
    @data = scenario_data.is_a?(Hash) ? scenario_data : {}
    @passwords = {}          # password => [npc_id, ...]
    @capture_npcs = Set.new  # npc ids the capture_secrets exception covers
    @items = {}              # item_id => { strings:, scope:, profile:, pc:, ancestors:, locked_ancestors: }
    @public_strings = Set.new
    @clue_holders = Hash.new { |h, k| h[k] = Set.new } # password => item ids holding it on purpose
    @clue_texts = Hash.new { |h, k| h[k] = Set.new }   # password => authored strings holding it
    @login_pcs = Set.new
    @network_strings = {}    # string => [owner, ...] (network:<id>, resource:<id>)
    @share_items = {}        # item_id => { strings:, resource:, ancestors: }
    collect_passwords
    collect_items
    collect_network_secrets
    @items.each_value { |info| info[:strings] = info[:strings].reject { |s| @public_strings.include?(s) } }
    @items.delete_if { |_, info| info[:strings].empty? }
  end

  def counts
    {
      passwords: @passwords.values.flatten.uniq.length,
      login_items: @items.count { |_, i| i[:scope] },
      locked_items: @items.count { |_, i| i[:locked_ancestors].any? },
      network_strings: @network_strings.length,
      share_items: @share_items.length
    }
  end

  # lines: [[source, line_no, hash]]. Returns findings, deduplicated per response line, rule
  # and owner (the first JSON path is kept).
  def scan(lines)
    findings = []
    seen = Set.new
    legit = Set.new # items already served by their own allowed route earlier in the run
    lines.each do |source, line_no, row|
      next unless row.is_a?(Hash)

      body = row.key?('body') ? row['body'] : row['bodyText']
      next if body.nil?

      ctx = response_context(row)
      add = lambda do |rule, owner, json_path|
        key = [source, line_no, rule, owner]
        next if seen.include?(key)

        seen << key
        findings << Finding.new(rule: rule, owner: owner, route: ctx[:route], source: source, line: line_no,
                                cmd_seq: row['cmdSeq'], json_path: json_path)
      end
      scan_passwords(body, ctx, add)
      scan_login_content(body, ctx, legit, add)
      scan_locked_content(body, add)
      scan_share_content(body, ctx, legit, add)
      scan_network_strings(body, ctx, add)
    end
    findings
  end

  def report_lines(findings)
    findings.map do |f|
      cmd = f.cmd_seq.nil? ? 'before the first command' : "command at log seq #{f.cmd_seq}"
      redact("FINDING #{f.rule}  owner=#{f.owner}  route=#{f.route}  response=#{f.source}:#{f.line} " \
             "(#{cmd})  at=#{f.json_path}")
    end
  end

  # Replaces any secret value in an output line, as a last guard.
  def redact(text)
    out = text.dup
    secret_values.each { |v| out = out.gsub(v, '[withheld]') if v.length >= 3 }
    out
  end

  RULE_TEXT = {
    'password' => 'an NPC password in a response',
    'signin_content' => 'sign-in PC content outside its own container response',
    'profile_content' => 'profile content outside a sign-in PC container response',
    'locked_content' => 'locked container content in a response that marks it locked',
    'share_content' => 'file share content outside a container response for that share',
    'network_string' => 'a network or resource name, host or observations outside the network routes'
  }.freeze

  private

  def secret_values
    @secret_values ||= (@passwords.keys + @items.values.flat_map { |i| i[:strings] } + @network_strings.keys +
                        @share_items.values.flat_map { |i| i[:strings] }).uniq.sort_by { |v| -v.length }
  end

  # ---- catalogue ---------------------------------------------------------------------------

  def collect_passwords
    reveal = @data.dig('social', 'captures', 'revealSecret') == true
    each_room_npc do |npc|
      creds = npc['creds']
      next unless creds.is_a?(Hash)

      password = creds['password']
      next unless password.is_a?(String) && !password.empty?

      id = npc['id'].to_s
      (@passwords[password] ||= []) << id
      @capture_npcs << id if reveal && BreakEscape::Game.capture_route?(npc)
    end
  end

  def each_room_npc(&block)
    BreakEscape::Game.scenario_room_npcs(@data).each(&block)
  end

  def collect_items
    rooms = @data['rooms']
    (rooms.is_a?(Hash) ? rooms.values : []).each do |room|
      next unless room.is_a?(Hash)

      walk_children(room, base_ctx)
    end
    profiles = @data['accountProfiles']
    (profiles.is_a?(Hash) ? profiles : {}).each do |profile_id, profile|
      next unless profile.is_a?(Hash)

      walk_list(profile['contents'], base_ctx.merge(scope: :profile, profile: profile_id.to_s))
    end
    # Starting items and other top-level objects are public.
    walk_list(@data['startItemsInInventory'], base_ctx)
  end

  # Networks: the strings a foothold's view shows and the content of file shares (step 6).
  def collect_network_secrets
    public_strings = room_data_strings
    usable = ->(v) { v.is_a?(String) && v.strip.length >= MIN_NETWORK_STRING && !public_strings.include?(v.strip) }
    networks = @data['networks'].is_a?(Hash) ? @data['networks'] : {}
    networks.each do |net_id, net|
      next unless net.is_a?(Hash) && usable.call(net['name'])

      (@network_strings[net['name'].strip] ||= []) << "network:#{net_id}"
    end
    resources = @data['resources'].is_a?(Hash) ? @data['resources'] : {}
    resources.each do |res_id, res|
      next unless res.is_a?(Hash)

      %w[name host observations].each do |field|
        next unless usable.call(res[field])

        owners = (@network_strings[res[field].strip] ||= [])
        owners << "resource:#{res_id}" unless owners.include?("resource:#{res_id}")
      end
      walk_share(res['contents'], res_id.to_s, [], usable)
    end
  end

  def walk_share(list, resource_id, ancestors, usable)
    (list.is_a?(Array) ? list : []).each do |item|
      next unless item.is_a?(Hash)

      strings = CONTENT_FIELDS.filter_map { |f| item[f].strip if usable.call(item[f]) }.uniq
      label = item['id'] ? item['id'].to_s : "#{resource_id}/unnamed-#{@share_items.length + 1}"
      @share_items[label] = { strings: strings, resource: resource_id, ancestors: ancestors.dup } if strings.any?
      walk_share(item['contents'], resource_id, item['id'] ? ancestors + [item['id'].to_s] : ancestors, usable)
    end
  end

  # Every string room data ships as authored: rooms, door signs, objects and NPCs, except the
  # keys the server withholds, sign-in PC desktops and the contents of locked containers.
  def room_data_strings
    out = Set.new
    walk = lambda do |node|
      case node
      when String then out << node.strip
      when Array then node.each { |v| walk.call(v) }
      when Hash
        hidden = BreakEscape::Game.login_pc?(node) || node['locked'] == true
        node.each do |k, v|
          next if WITHHELD_ROOM_KEYS.include?(k)
          next if k == 'contents' && hidden

          walk.call(v)
        end
      end
    end
    walk.call(@data['rooms']) if @data['rooms'].is_a?(Hash)
    out
  end

  def base_ctx
    { scope: nil, profile: nil, pc: nil, ancestors: [], locked_ancestors: [] }
  end

  def walk_list(list, ctx)
    (list.is_a?(Array) ? list : []).each { |item| walk_item(item, ctx) if item.is_a?(Hash) }
  end

  def walk_children(hash, ctx)
    CHILD_KEYS.each { |key| walk_list(hash[key], ctx) }
  end

  def walk_item(item, ctx)
    note_clues(item)
    if npc_record?(item)
      walk_children(item, ctx)
      return
    end

    strings = content_strings(item)
    secret = ctx[:scope] || ctx[:locked_ancestors].any?
    if secret
      @items[item_label(item, ctx)] = {
        strings: strings, scope: ctx[:scope], profile: ctx[:profile], pc: ctx[:pc],
        ancestors: ctx[:ancestors].dup, locked_ancestors: ctx[:locked_ancestors].dup
      }
    elsif !secret
      strings.each { |s| @public_strings << s }
    end

    child_ctx = ctx.dup
    if BreakEscape::Game.login_pc?(item) && item['id']
      @login_pcs << item['id'].to_s
      child_ctx = ctx.merge(scope: :signin, pc: item['id'].to_s, profile: nil, ancestors: [])
    else
      child_ctx = ctx.merge(ancestors: ctx[:ancestors] + [item['id'].to_s]) if item['id']
      if item['locked'] == true && item['id']
        child_ctx = child_ctx.merge(locked_ancestors: ctx[:locked_ancestors] + [item['id'].to_s])
      end
    end
    walk_children(item, child_ctx)
  end

  # The item's id; an item without one (data that skipped the id stamp) is named by where it sits.
  def item_label(item, ctx)
    return item['id'].to_s if item['id']

    @unnamed = (@unnamed || 0) + 1
    parent = ctx[:ancestors].last || ctx[:pc] || ctx[:profile] || 'scenario'
    "#{parent}/unnamed-#{@unnamed}"
  end

  def npc_record?(hash)
    hash.key?('npcType') || hash.key?('creds') || hash.key?('rfidCard') && !hash.key?('type')
  end

  def content_strings(item)
    CONTENT_FIELDS.filter_map do |field|
      v = item[field]
      v.strip if v.is_a?(String) && v.strip.length >= MIN_CONTENT_LENGTH
    end.uniq
  end

  # An item (not an NPC) whose own authored strings hold a password holds it on purpose:
  # a note, a postitNote, a document (section 5.6, "Deliberate clues").
  def note_clues(item)
    return if npc_record?(item) || @passwords.empty?

    own_strings(item).each do |str|
      @passwords.each_key do |password|
        next unless contains_password?(str, password)

        @clue_texts[password] << str
        @clue_holders[password] << item['id'].to_s if item['id']
      end
    end
  end

  # Strings on the item itself and in its non-item fields (observationVariants and the like),
  # not in the items it contains.
  def own_strings(node, top: true)
    case node
    when String then [node]
    when Array then node.flat_map { |v| own_strings(v, top: false) }
    when Hash
      node.flat_map do |k, v|
        next [] if top && CHILD_KEYS.include?(k)
        next [] if !top && v.is_a?(Hash) && v.key?('type') # a nested item

        own_strings(v, top: false)
      end
    else []
    end
  end

  def contains_password?(str, password)
    return false unless str.is_a?(String)

    if password.length >= MIN_SUBSTRING_PASSWORD
      str.include?(password)
    else
      str.match?(/(?<![A-Za-z0-9])#{Regexp.escape(password)}(?![A-Za-z0-9])/)
    end
  end

  # ---- scanning ----------------------------------------------------------------------------

  def response_context(row)
    method = row['method'].to_s.upcase
    path = row['path'].to_s.split('?').first.to_s
    container = method == 'GET' && path =~ %r{/container/([^/]+)\z} ? URI.decode_www_form_component(Regexp.last_match(1)) : nil
    {
      route: "#{method} #{path}",
      container: container,
      unlock: method == 'POST' && path.end_with?('/unlock'),
      capture_secrets: path.end_with?('/capture_secrets'),
      network: path.end_with?('/network') || path.include?('/network/'),
      any_container: path.include?('/container/'),
      scenario: method == 'GET' && path.end_with?('/scenario')
    }
  end

  # Walks every string in a body, with its JSON path and the nearest enclosing hash id.
  def each_string(node, path = '$', owner_id = nil, &block)
    case node
    when String then yield node, path, owner_id
    when Array then node.each_with_index { |v, i| each_string(v, "#{path}[#{i}]", owner_id, &block) }
    when Hash
      id = node['id'].is_a?(String) || node['id'].is_a?(Integer) ? node['id'].to_s : owner_id
      node.each { |k, v| each_string(v, "#{path}.#{k}", id, &block) }
    end
  end

  def scan_passwords(body, ctx, add)
    return if @passwords.empty?

    each_string(body) do |str, json_path, holder|
      @passwords.each do |password, owners|
        next unless contains_password?(str, password)
        next if deliberate_clue?(password, str, holder)

        owners.each do |npc_id|
          next if ctx[:capture_secrets] && @capture_npcs.include?(npc_id)

          add.call('password', "npc:#{npc_id}", safe_path(json_path))
        end
      end
    end
  end

  def deliberate_clue?(password, str, holder)
    return true if holder && @clue_holders[password].include?(holder)

    @clue_texts[password].any? { |text| str.include?(text) }
  end

  def scan_login_content(body, ctx, legit, add)
    scoped = @items.select { |_, info| info[:scope] }
    return if scoped.empty?

    hits = Hash.new { |h, k| h[k] = [] }
    each_string(body) do |str, json_path|
      scoped.each do |item_id, info|
        hits[item_id] << json_path if content_match?(str, info[:strings])
      end
    end
    hits.each do |item_id, paths|
      info = scoped[item_id]
      if allowed_login_route?(info, ctx[:container]) || folder_unlock_answer?(info, ctx, paths)
        legit << item_id
        next
      end
      next if legit.include?(item_id)

      rule = info[:scope] == :profile ? 'profile_content' : 'signin_content'
      add.call(rule, "item:#{item_id}", safe_path(paths.first))
    end
  end

  # A folder inside a sign-in PC or profile (a locked archive) opened by /unlock: the server
  # answers with the folder's contents only for a session that admits it (/unlock check 1),
  # as GET /container/<folder> would. So an item inside a folder may sit in an /unlock
  # answer's top-level contents. The scanner does not know the answer's target, so a
  # wrongly served folder here is not flagged: access_model_no_password_test.rb covers
  # that class on the server.
  def folder_unlock_answer?(info, ctx, paths)
    ctx[:unlock] && info[:ancestors].any? && paths.all? { |p| p.start_with?('$.contents[') }
  end

  def allowed_login_route?(info, container)
    return false unless container
    return true if info[:ancestors].include?(container)

    info[:scope] == :profile ? @login_pcs.include?(container) : container == info[:pc]
  end

  def scan_locked_content(body, add)
    candidates = @items.select { |_, info| info[:locked_ancestors].any? }
    return if candidates.empty?

    marked = Set.new
    collect_locked_marks(body, marked)
    return if marked.empty?

    candidates.each do |item_id, info|
      next unless info[:locked_ancestors].any? { |id| marked.include?(id) }

      each_string(body) do |str, json_path|
        next unless content_match?(str, info[:strings])

        add.call('locked_content', "item:#{item_id}", safe_path(json_path))
        break
      end
    end
  end

  # A share item's content outside a GET /container answer for its resource or a folder in it.
  # Once served that way, the item may follow (an inventory answer after a Copy or a Move).
  def scan_share_content(body, ctx, legit, add)
    return if @share_items.empty?

    hits = Hash.new { |h, k| h[k] = [] }
    each_string(body) do |str, json_path|
      @share_items.each do |item_id, info|
        hits[item_id] << json_path if info[:strings].any? { |secret| network_match?(str, secret) }
      end
    end
    hits.each do |item_id, paths|
      info = @share_items[item_id]
      allowed = ctx[:container] && ([info[:resource]] + info[:ancestors]).include?(ctx[:container])
      if allowed || folder_unlock_answer?(info, ctx, paths)
        legit << "share:#{item_id}"
        next
      end
      next if legit.include?("share:#{item_id}")

      add.call('share_content', "item:#{item_id}", safe_path(paths.first))
    end
  end

  # A network or resource string outside GET /network, /network/*, /container and the
  # footholds block of /scenario.
  def scan_network_strings(body, ctx, add)
    return if @network_strings.empty?
    return if ctx[:network] || ctx[:any_container]

    each_string(body) do |str, json_path|
      next if ctx[:scenario] && json_path.start_with?('$.footholds')

      @network_strings.each do |secret, owners|
        next unless network_match?(str, secret)

        owners.each { |owner| add.call('network_string', owner, safe_path(json_path)) }
      end
    end
  end

  def network_match?(str, secret)
    s = str.strip
    s == secret || (secret.length >= MIN_SUBSTRING_NETWORK && s.include?(secret))
  end

  def collect_locked_marks(node, marked)
    case node
    when Array then node.each { |v| collect_locked_marks(v, marked) }
    when Hash
      marked << node['id'].to_s if node['id'] && node['locked'] == true
      node.each_value { |v| collect_locked_marks(v, marked) }
    end
  end

  # A name must match a whole string; a text may sit inside a longer one.
  def content_match?(str, strings)
    s = str.strip
    strings.any? { |secret| s == secret || (secret.length >= 20 && s.include?(secret)) }
  end

  def safe_path(json_path)
    redact(json_path)
  end
end
