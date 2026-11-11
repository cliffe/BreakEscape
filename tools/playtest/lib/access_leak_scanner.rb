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
#   social.captures.revealSecret. With served_npcs given (the game's own answer to "whose
#   password would GET /capture_secrets serve now", which applies its capture proofs), the
#   exception covers only those NPCs;
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
# - a password a share item holds on purpose (a letter, a handover note) is a deliberate clue
#   only by the same rule: in that answer, or after the item has been served that way.
#   Anywhere else it is reported as a password, like any other;
# - a network or resource string in any response other than GET /network, a /network/*
#   answer, a /container answer, the contents of an /unlock answer, or the footholds block
#   of GET /scenario. There is no exception for an NPC's work plan. The /container and
#   /unlock exemptions cover every network string (network name, resource name, host,
#   observations), not only hosts: both serve a container's authored contents, which the
#   server releases only by its own rules, so what that text names is a scenario choice.
#
# Matching of these network strings: a string of six or more characters is matched as a
# substring; a shorter one only as a whole JSON string value; one under three characters is
# ignored; and a string that also appears somewhere public (a room, door sign, object or NPC
# name, or any other text room data ships as authored) is not a secret and is skipped.
#
# Pages (engine plan section 6): a row with a "dom" key instead of a body is the text of a
# page the tester read (the capture log device, a captures terminal), labelled by its "label".
# It is checked for passwords like a /capture_secrets answer, since that is all such a page shows.
#
# Slice 9.1 (ACCESS_MODEL_SLICE_9_1_PLAN.md, section 6) adds two exceptions and one finding:
#
# - the note: a GET /login_accounts answer may hold a password at $.postitNote and nowhere
#   else in its body, when the PC its own pc_id names has an owner the game says
#   written_down? (so the scanner is handed the game, not only its scenario data). The
#   exception covers that password value in that answer, whoever else shares it;
# - the saved copy: the same value inside savedNotes, only after an earlier response line
#   (in any file given, in the order given) was a /login_accounts answer that carried it;
# - withheld keys: any NPC record (a hash with an npcType key, or an element of an array
#   under a key named npcs) with a creds, role, awareness, habits or workarounds key.
#   social.characters entries and the social.awareness block are not NPC records.
#
# Slice 9.2 sub-slice B (ACCESS_MODEL_SLICE_9_2_PLAN.md 11): every authored workaround is a
# secret until the server hands it over. A hash whose `do` is a workaround's kind beside that
# workaround's own target (`door`, `prop`, `event`, `pc` or `with`) is reported anywhere but
# where the server hands one over: a `run` or a `pending` entry (every unspent hand-over, B review
# R3 m2) in a POST /npc_frustration answer, and the `pending` and `done` lists of GET /scenario's
# npcFrustration. A password in a
# /npc_workaround answer is reported by the password rule, with one exception (sub-slice H,
# plan 6.5): a heard share_login answer `{ capture, line, note, displayName }` may hold the
# sharer's own password at $.line and $.note, when that NPC authors a share_login and the game
# (it must be given) lists it in sharedLogins; at $.capture.note too only where the scenario's
# social.captures.revealSecret is on (review R1 m3). After such an answer the same value is
# allowed inside savedNotes, and inside the se_captures global only under revealSecret. The note exception
# above follows a done writes_down through the game's written_down?.
#
# A finding names the rule, the route, the response line and the secret's owner (an NPC or
# item id), never the value. Every output line is checked against the secret values before it
# is returned, so blind runs can use it too.
#
# Usage (see tools/playtest/access-leak-check.rb):
#
#   scanner = AccessLeakScanner.new(scenario_data, game: game)   # game: optional (the note exception)
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

  # Keys an NPC record never takes to the browser (Game::WITHHELD_NPC_KEYS).
  WITHHELD_KEYS = %w[creds role awareness habits workarounds].freeze
  # Slice 9.2 (9.2): the NPC keys the server withholds beside them (Game::WITHHELD_WORK_NPC_KEYS)
  WITHHELD_WORK_KEYS = %w[workNeeds frustration feed].freeze
  # Feed texts shorter than this are not searched for (the validator warns about them, 9.2)
  MIN_FEED_TEXT = 12

  attr_reader :passwords, :items

  # served_npcs: when given, the NPC ids whose password the server would serve from
  # GET /capture_secrets now (its capture proofs applied); nil keeps the scenario-only rule.
  def initialize(scenario_data, served_npcs: nil, game: nil)
    @data = scenario_data.is_a?(Hash) ? scenario_data : {}
    @served_npcs = served_npcs&.map(&:to_s)&.to_set
    @game = game
    @noted = Set.new # passwords a /login_accounts answer has carried as its note, so far
    @shared = Set.new # passwords a heard share_login answer has carried, so far (sub-slice H)
    @passwords = {}          # password => [npc_id, ...]
    @capture_npcs = Set.new  # npc ids the capture_secrets exception covers
    @items = {}              # item_id => { strings:, scope:, profile:, pc:, ancestors:, locked_ancestors: }
    @public_strings = Set.new
    @clue_holders = Hash.new { |h, k| h[k] = Set.new } # password => item ids holding it on purpose
    @clue_texts = Hash.new { |h, k| h[k] = Set.new }   # password => authored strings holding it
    @login_pcs = Set.new
    @network_strings = {}    # string => [owner, ...] (network:<id>, resource:<id>)
    @share_items = {}        # item_id => { strings:, resource:, ancestors: }
    # password => [{ label:, holder:, texts:, resource:, ancestors: }]: share items holding a
    # password on purpose, exempt only where that item's content may be (scan_passwords)
    @share_clues = Hash.new { |h, k| h[k] = [] }
    @workarounds = [] # { npc:, index:, do:, target: [key, value] }
    # Sub-slice C: feed posts and feed facts, by text; served once a /feed_post answer has
    # carried them, or a GET /scenario feedPosts block lists them within the reveals so far
    @feed_texts = {}          # text => { owner:, post: npc|post_id, fact: id or nil }
    @feed_fact_ids = Set.new
    @feed_served = Set.new    # "npc|post_id" and "fact:<id>"
    @feed_order = Hash.new { |h, k| h[k] = [] } # npc id => [[post_id, fact id or nil], ...] as authored
    @feed_answers = Hash.new(0) # npc id => /feed_post answers with a post seen so far in the log
    @feed_base = {}             # npc id => reveals made before the log starts (a resumed game)
    @feed_fallback = []         # npc ids whose base came from the game's feedRevealed
    collect_passwords
    collect_items
    collect_network_secrets
    collect_workarounds
    collect_feeds
    @items.each_value { |info| info[:strings] = info[:strings].reject { |s| @public_strings.include?(s) } }
    @items.delete_if { |_, info| info[:strings].empty? }
  end

  def counts
    {
      passwords: @passwords.values.flatten.uniq.length,
      login_items: @items.count { |_, i| i[:scope] },
      locked_items: @items.count { |_, i| i[:locked_ancestors].any? },
      network_strings: @network_strings.length,
      share_items: @share_items.length,
      workarounds: @workarounds.length,
      feed_posts: @feed_texts.values.count { |f| f[:kind] == :post },
      feed_facts: @feed_fact_ids.length
    }
  end

  # NPCs whose GET /scenario feedPosts were judged partly against the game's saved feedRevealed
  # count, because the log holds fewer /feed_post answers than the game has revealed (a resumed
  # game). Filled by scan.
  attr_reader :feed_fallback

  # lines: [[source, line_no, hash]]. Returns findings, deduplicated per response line, rule
  # and owner (the first JSON path is kept).
  def scan(lines)
    findings = []
    seen = Set.new
    legit = Set.new # items already served by their own allowed route earlier in the run
    prepare_feed_base(lines)
    lines.each do |source, line_no, row|
      next unless row.is_a?(Hash)

      body = if row.key?('dom') then row['dom']
             elsif row.key?('body') then row['body']
             else row['bodyText']
             end
      next if body.nil?

      ctx = response_context(row)
      add = lambda do |rule, owner, json_path|
        key = [source, line_no, rule, owner]
        next if seen.include?(key)

        seen << key
        findings << Finding.new(rule: rule, owner: owner, route: ctx[:route], source: source, line: line_no,
                                cmd_seq: row['cmdSeq'], json_path: json_path)
      end
      scan_passwords(body, ctx, legit, add)
      scan_withheld_keys(body, add)
      scan_login_content(body, ctx, legit, add)
      scan_locked_content(body, add)
      scan_share_content(body, ctx, legit, add)
      scan_network_strings(body, ctx, add)
      scan_workarounds(body, ctx, add)
      note_feed_served(body, ctx)
      scan_feed(body, ctx, add)
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
    'network_string' => 'a network or resource name, host or observations outside the network routes',
    'withheld_key' => 'a withheld key (creds, role, awareness, habits, workarounds, workNeeds, frustration, feed) on an NPC record',
    'workaround' => 'a workaround (its kind beside its target) outside a hand-over',
    'feed_text' => "a feed post's or feed fact's whole text before the server served it",
    'feed_fact_key' => 'an object keyed by a feed fact id with a text key before its post was served, or a bootstrap social.intelFacts that is not an object'
  }.freeze

  private

  def secret_values
    @secret_values ||= (@passwords.keys + @items.values.flat_map { |i| i[:strings] } + @network_strings.keys +
                        @share_items.values.flat_map { |i| i[:strings] } + @feed_texts.keys).uniq.sort_by { |v| -v.length }
  end

  # ---- catalogue ---------------------------------------------------------------------------

  WORKAROUND_TARGET_KEYS = %w[door prop event pc with].freeze
  # Kept equal to BreakEscape::AccessWork::WORKAROUND_KINDS (the scanner loads no Rails code)
  WORKAROUND_KINDS = %w[writes_down prop_door emit borrow_session share_login].freeze

  # Every room NPC's own workarounds, and each role's list (an NPC with none of its own uses
  # its role's): the kind and the first target key it authors. A kind with no target (a
  # writes_down) is identified by nothing beyond its kind, so it is not catalogued.
  def collect_workarounds
    lists = []
    each_room_npc { |npc| lists << [npc['id'], npc['workarounds']] if npc['workarounds'].is_a?(Array) }
    roles = @data['roles'].is_a?(Hash) ? @data['roles'] : {}
    roles.each { |role, r| lists << ["role:#{role}", r['workarounds']] if r.is_a?(Hash) && r['workarounds'].is_a?(Array) }
    lists.each do |owner, list|
      list.each_with_index do |w, i|
        next unless w.is_a?(Hash) && w['do'].is_a?(String)

        key = WORKAROUND_TARGET_KEYS.find { |k| w[k].is_a?(String) && !w[k].empty? }
        @workarounds << { owner: owner, index: i, do: w['do'], target: [key, w[key]] } if key
      end
    end
  end

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
      # A file in a share that holds a password holds it on purpose, as a note in a room
      # does (the feature scenario's letter and handover note, slice 9.3a step 8), but only
      # where the share's content may be: kept apart from the room notes (review R1 M2)
      share_clues(item, label, resource_id, ancestors)
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

  # A share item whose own strings hold a password: recorded with its share and folders, so
  # the exemption applies only in a /container answer for that share or a folder in it, or
  # after the item has been served that way (scan_passwords, share_clue?).
  def share_clues(item, label, resource_id, ancestors)
    return if npc_record?(item) || @passwords.empty?

    own_strings(item).each do |str|
      @passwords.each_key do |password|
        next unless contains_password?(str, password)

        entry = @share_clues[password].find { |e| e[:label] == label }
        unless entry
          entry = { label: label, holder: item['id']&.to_s, texts: Set.new, resource: resource_id, ancestors: ancestors.dup }
          @share_clues[password] << entry
        end
        entry[:texts] << str
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
    if row.key?('dom')
      return { route: "page #{row['label'] || 'dom'}", container: nil, unlock: false, capture_secrets: true,
               network: false, any_container: false, scenario: false }
    end

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
      scenario: method == 'GET' && path.end_with?('/scenario'),
      login_accounts: method == 'GET' && path.end_with?('/login_accounts'),
      npc_workaround: method == 'POST' && path.end_with?('/npc_workaround')
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

  def scan_passwords(body, ctx, legit, add)
    return if @passwords.empty?

    note = ctx[:login_accounts] ? served_note_password(body) : nil
    shared = ctx[:npc_workaround] ? heard_share_password(body) : nil
    each_string(body) do |str, json_path, holder|
      @passwords.each do |password, owners|
        next unless contains_password?(str, password)
        next if deliberate_clue?(password, str, holder)
        next if share_clue?(password, str, holder, ctx, json_path, legit)
        next if note == password && json_path == '$.postitNote'
        next if @noted.include?(password) && json_path.include?('.savedNotes[')
        next if shared == password && share_path?(json_path)
        next if reveal_secret? && @shared.include?(password) && json_path.include?('.se_captures')

        owners.each do |npc_id|
          next if ctx[:capture_secrets] && @capture_npcs.include?(npc_id) && (@served_npcs.nil? || @served_npcs.include?(npc_id))

          add.call('password', "npc:#{npc_id}", safe_path(json_path))
        end
      end
    end
  end

  # The password a /login_accounts answer may carry as its note (slice 9.1, 5.3): its own
  # pc_id names a sign-in PC whose owner the game says written_down?. Recorded, so a later
  # savedNotes copy of it is allowed. nil without a game.
  def served_note_password(body)
    return nil unless @game && body.is_a?(Hash) && body['postitNote'].is_a?(String)

    pc = @game.find_login_pc(body['pc_id'].to_s)&.dig(:object)
    owner = pc && @game.login_pc_owner(pc)
    return nil unless owner && @game.written_down?(owner)

    password = owner.dig('creds', 'password')
    return nil unless password.is_a?(String) && contains_password?(body['postitNote'], password)

    @noted << password
    password
  end

  SHARE_PATHS = %w[$.line $.note].freeze

  # The capture's note (stored in the se_captures global, so in every sync and reload) holds the
  # password only where social.captures.revealSecret is on (review R1 m3)
  def share_path?(json_path)
    SHARE_PATHS.include?(json_path) || (json_path == '$.capture.note' && reveal_secret?)
  end

  def reveal_secret?
    @data.dig('social', 'captures', 'revealSecret') == true
  rescue TypeError
    false
  end

  # The password a heard share_login answer may carry (sub-slice H, plan 6.5): the capture's
  # targetId is an NPC that authors a share_login, the game lists it in sharedLogins, and the
  # password is that NPC's own. Recorded, so a later savedNotes or se_captures copy is allowed.
  # nil without a game.
  def heard_share_password(body)
    return nil unless @game && body.is_a?(Hash) && body['capture'].is_a?(Hash)
    return nil unless body['line'].is_a?(String) && body['note'].is_a?(String)

    npc_id = body['capture']['targetId'].to_s
    return nil unless @workarounds.any? { |w| w[:owner] == npc_id && w[:do] == 'share_login' }

    shared = @game.player_state.is_a?(Hash) ? @game.player_state['sharedLogins'] : nil
    return nil unless shared.is_a?(Array) && shared.map(&:to_s).include?(npc_id)

    npc = nil
    each_room_npc { |n| npc = n if n['id'].to_s == npc_id }
    password = npc&.dig('creds', 'password')
    return nil unless password.is_a?(String) && !password.empty?

    @shared << password
    @noted << password
    password
  end

  # A workaround outside the places the server hands one over (sub-slice B)
  def scan_workarounds(body, ctx, add)
    walk_hashes(body, '$') do |hash, json_path|
      next unless hash['do'].is_a?(String)

      # An authored entry carries `at`, which no run, pending or done entry does: a leak
      # anywhere, with no exemption (the only way to see a leaked writes_down, which has no target)
      if WORKAROUND_KINDS.include?(hash['do']) && hash.key?('at')
        add.call('workaround', "authored #{hash['do']}", safe_path(json_path))
        next
      end
      next if @workarounds.empty?
      next if ctx[:route].end_with?('/npc_frustration') && json_path =~ /\A\$\.answers\[\d+\]\.(run|pending\[\d+\])\z/
      next if ctx[:scenario] && json_path =~ /\A\$\.npcFrustration\.[^.]+\.(pending|done)\[\d+\]\z/

      @workarounds.each do |w|
        key, value = w[:target]
        next unless hash['do'] == w[:do] && hash[key] == value

        add.call('workaround', "#{w[:owner]}[#{w[:index]}]", safe_path(json_path))
      end
    end
  end

  # ---- sub-slice C: feeds (plan 9.2 and 11) ---------------------------------------------

  def collect_feeds
    facts = @data.dig('social', 'intelFacts')
    facts = {} unless facts.is_a?(Hash)
    each_room_npc do |npc|
      feed = npc['feed']
      next unless feed.is_a?(Hash) && feed['posts'].is_a?(Array)

      feed['posts'].each do |post|
        next unless post.is_a?(Hash) && post['id'].is_a?(String)

        key = "#{npc['id']}|#{post['id']}"
        fid = post['fact'].is_a?(String) && facts[post['fact']].is_a?(Hash) ? post['fact'] : nil
        @feed_order[npc['id'].to_s] << [post['id'], fid]
        text = post['text']
        (@feed_texts[text] ||= { kind: :post, owner: "feed:#{key}", served: [] })[:served] << key if text.is_a?(String) && text.length >= MIN_FEED_TEXT
        next unless fid

        @feed_fact_ids << fid
        ftext = facts[fid]['text']
        next unless ftext.is_a?(String) && ftext.length >= MIN_FEED_TEXT

        (@feed_texts[ftext] ||= { kind: :fact, owner: "fact:#{fid}", served: [] })[:served] << "fact:#{fid}"
      end
    end
  end

  # Reveals made before the log starts: the game's saved count less the /feed_post answers the
  # log holds. A complete log gives 0, so every reveal is judged in log order.
  def prepare_feed_base(lines)
    @feed_answers.clear
    @feed_base = {}
    @feed_fallback = []
    return if @feed_order.empty?

    in_log = Hash.new(0)
    lines.each do |_source, _no, row|
      next unless row.is_a?(Hash) && row['body'].is_a?(Hash)
      next unless row['path'].to_s.split('?').first.to_s.end_with?('/feed_post') && row['body']['post'].is_a?(Hash)

      in_log[row['body']['npcId'].to_s] += 1
    end
    revealed = @game&.player_state.is_a?(Hash) ? @game.player_state['feedRevealed'] : nil
    return unless revealed.is_a?(Hash)

    @feed_order.each_key do |npc_id|
      n = revealed[npc_id].is_a?(Hash) ? revealed[npc_id]['n'].to_i : 0
      base = n - in_log[npc_id]
      next unless base.positive?

      @feed_base[npc_id] = base
      @feed_fallback << npc_id
    end
  end

  # How many of an NPC's posts the server had revealed at this point of the log
  def feed_revealed_now(npc_id)
    (@feed_base[npc_id] || 0) + @feed_answers[npc_id]
  end

  # A /feed_post answer with a post serves the NPC's next authored post and its fact, whatever
  # the answer says, so an answer out of order is reported by scan_feed. A GET /scenario
  # feedPosts entry is allowed only for a post among the ones revealed so far (looked up by its
  # own id in the catalogue, never by the response's index) and only with that post's fact.
  def note_feed_served(body, ctx)
    return if @feed_texts.empty? && @feed_fact_ids.empty?
    return unless body.is_a?(Hash)

    if ctx[:route].end_with?('/feed_post') && body['post'].is_a?(Hash)
      npc_id = body['npcId'].to_s
      @feed_answers[npc_id] += 1
      post_id, fid = @feed_order[npc_id][feed_revealed_now(npc_id) - 1]
      serve_feed(npc_id, post_id, fid) if post_id
    elsif ctx[:scenario] && body['feedPosts'].is_a?(Hash)
      body['feedPosts'].each do |npc_id, f|
        allowed = @feed_order[npc_id.to_s].first(feed_revealed_now(npc_id.to_s))
        Array(f.is_a?(Hash) ? f['posts'] : nil).each do |item|
          next unless item.is_a?(Hash) && item['post'].is_a?(Hash)

          post_id, fid = allowed.find { |id, _| id == item['post']['id'] }
          next unless post_id

          fact = item['fact']
          serve_feed(npc_id, post_id, fact.is_a?(Hash) && fact['id'] == fid ? fid : nil)
        end
      end
    end
  end

  def serve_feed(npc_id, post_id, fid)
    @feed_served << "#{npc_id}|#{post_id}"
    @feed_served << "fact:#{fid}" if fid
  end

  def feed_served?(entry)
    entry[:served].any? { |k| @feed_served.include?(k) }
  end

  def scan_feed(body, ctx, add)
    return if @feed_texts.empty? && @feed_fact_ids.empty?

    each_string(body) do |str, json_path, _owner|
      @feed_texts.each do |text, entry|
        next unless str.include?(text)
        next if feed_served?(entry)

        add.call('feed_text', entry[:owner], safe_path(json_path))
      end
    end
    return if @feed_fact_ids.empty?

    # Plan 9.2: the bootstrap's social.intelFacts stays an object, or grantFact grants any id
    if ctx[:scenario] && body.is_a?(Hash) && body['social'].is_a?(Hash) && !body['social']['intelFacts'].is_a?(Hash)
      add.call('feed_fact_key', 'social.intelFacts', '$.social.intelFacts')
    end
    walk_hashes(body, '$') do |hash, json_path|
      hash.each do |k, v|
        next unless @feed_fact_ids.include?(k) && v.is_a?(Hash) && v.key?('text')
        next if @feed_served.include?("fact:#{k}")

        add.call('feed_fact_key', "fact:#{k}", safe_path("#{json_path}.#{k}"))
      end
    end
  end

  def walk_hashes(node, path, &block)
    case node
    when Array then node.each_with_index { |v, i| walk_hashes(v, "#{path}[#{i}]", &block) }
    when Hash
      yield node, path
      node.each { |k, v| walk_hashes(v, "#{path}.#{k}", &block) }
    end
  end

  # NPC records holding a key the server withholds: by key and NPC id, never the value.
  def scan_withheld_keys(body, add)
    walk_records(body, '$', false) do |record, json_path|
      (WITHHELD_KEYS + WITHHELD_WORK_KEYS).each do |key|
        next unless record.key?(key)

        add.call('withheld_key', "npc:#{record['id']}/#{key}", safe_path("#{json_path}.#{key}"))
      end
    end
  end

  def walk_records(node, path, under_npcs, &block)
    case node
    when Array
      node.each_with_index { |v, i| walk_records(v, "#{path}[#{i}]", under_npcs, &block) }
    when Hash
      yield node, path if node.key?('npcType') || under_npcs
      node.each do |k, v|
        next if k == 'social' && path == '$' # social.characters and social.awareness are not NPC records

        walk_records(v, "#{path}.#{k}", k == 'npcs' && v.is_a?(Array), &block)
      end
    end
  end

  def deliberate_clue?(password, str, holder)
    return true if holder && @clue_holders[password].include?(holder)

    @clue_texts[password].any? { |text| str.include?(text) }
  end

  # A share item's password where that item's content may be: a GET /container answer for its
  # share or a folder in it, a folder's own /unlock answer (as scan_share_content allows), or
  # any route once the item has been served that way (legit). Anywhere else it is a leak.
  def share_clue?(password, str, holder, ctx, json_path, legit)
    @share_clues[password].any? do |entry|
      next false unless (holder && holder == entry[:holder]) || entry[:texts].any? { |text| str.include?(text) }
      next true if legit.include?("share:#{entry[:label]}")
      next true if ctx[:container] && ([entry[:resource]] + entry[:ancestors]).include?(ctx[:container])

      ctx[:unlock] && entry[:ancestors].any? && json_path.start_with?('$.contents[')
    end
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

  # A network or resource string outside GET /network, /network/*, /container, the
  # contents of an /unlock answer (the server's other way of serving a container's contents,
  # as GET /container would, for example a held grant item whose file names a share's host)
  # and the footholds block of /scenario. Both container exemptions cover every network
  # string, by design (see the header).
  def scan_network_strings(body, ctx, add)
    return if @network_strings.empty?
    return if ctx[:network] || ctx[:any_container]

    each_string(body) do |str, json_path|
      next if ctx[:scenario] && json_path.start_with?('$.footholds')
      next if ctx[:unlock] && json_path.start_with?('$.contents[')

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
