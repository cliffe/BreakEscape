# frozen_string_literal: true

# Social-engineering lint framework (planning_notes/phishing_and_social_engineering,
# 00_data_contract.md S11, IMPLEMENTATION_PLAN 0.7).
#
# Entry point: ValidateSocial.check(json, ...) returns an array of issue strings,
# "❌ ..." for errors and "⚠️ ..." for warnings, so tests can call it in-process.
#
# Two lints run for every scenario (they guard engine behaviour that any mission can
# hit): aim unlockCondition keys, and object id uniqueness across rooms. Everything
# else runs only when the scenario has a top-level `social` key. Each area under
# scripts/validate_social/ owns one file and exposes `check(ctx)`.
#
# --strict-social: validate_scenario.rb exits 1 when this returns an error and the
# scenario has a `social` key. A scenario without one always exits 0.
require 'json'
require 'set'

module ValidateSocial
  # raw: the rendered JSON text, when the caller has it (P2-W), so lints can tell a \u escape
  # written in the source from a raw character.
  Context = Struct.new(:json, :repo_root, :valid_item_types, :imports, :social, :raw, keyword_init: true) do
    # Globals the scenario declares itself: globalVariables minus carry-over imports
    # (prepare_carry_over_globals merges those in before the other checks run).
    def own_globals
      @own_globals ||= begin
        g = json['globalVariables'].is_a?(Hash) ? json['globalVariables'] : {}
        g.reject { |k, _| import_names.include?(k) }
      end
    end

    def all_globals
      json['globalVariables'].is_a?(Hash) ? json['globalVariables'] : {}
    end

    def import_names
      @import_names ||= Array(imports).filter_map { |e| ValidateSocial.import_name(e) }.to_set
    end
  end

  # Object types introduced by the social build (00 §11 "Pointers"). `phone` already exists.
  SOCIAL_OBJECT_TYPES = %w[mail_terminal osint-workstation case-file triage-workstation
                           page-builder report-workstation kiosk].freeze
  AIM_UNLOCK_KEYS = %w[aimCompleted aimsCompleted globalVariable equals].freeze
  SYNC_TYPES = %i[bool number string].freeze

  AREAS = [] # filled by the requires below, in the order the areas run

  def self.error?(issue)
    issue.start_with?('❌')
  end

  def self.errors(issues)
    issues.select { |i| error?(i) }
  end

  # json: the rendered scenario. imports: the importGlobals list (entries), when the
  # caller has merged them into globalVariables. valid_item_types: Set of asset file
  # stems (nil skips the sprite lint).
  def self.check(json, repo_root:, valid_item_types: nil, imports: nil, raw: nil)
    ctx = Context.new(json: json, repo_root: repo_root, valid_item_types: valid_item_types,
                      imports: imports || json['importGlobals'], social: json['social'], raw: raw)
    issues = []
    issues.concat(aim_unlock_keys(ctx))
    issues.concat(duplicate_object_ids(ctx))
    issues.concat(object_name_collisions(ctx))
    issues.concat(Options.locked_hints(json)) # engine-wide option; nothing shipped authors it
    return issues unless json['social'].is_a?(Hash)

    issues.concat(declared_globals(ctx))
    issues.concat(external_fallbacks(ctx))
    issues.concat(social_object_sprites(ctx))
    issues.concat(characters(ctx))
    AREAS.each { |area| issues.concat(area.check(ctx)) }
    issues
  end

  def self.import_name(entry)
    return nil unless entry.is_a?(Hash)
    return entry['completed'].to_s if entry.key?('completed')
    return entry['as'].to_s if entry['as'].is_a?(String) && !entry['as'].empty?

    prefix = entry['from'].to_s[/\A((?:m|sis)\d\d)_/, 1]
    prefix && entry['var'].is_a?(String) ? "#{prefix}_#{entry['var']}" : nil
  end

  # Splits json-schema messages into [social issue strings, the other messages]. A message about
  # a path under #/social (the closed social schema in scenario-schema.json) becomes a "❌ SOCIAL:
  # schema:" issue, without the gem's "in schema <uuid>" tail.
  def self.split_schema_errors(errors)
    social, other = Array(errors).partition { |e| e.to_s.match?(%r{'#/social(?:/|')}) }
    [social.map { |e| "❌ SOCIAL: schema: #{e.to_s.sub(/ in schema [0-9a-f-]+#?\s*\z/, '')}" }, other]
  end

  # ---- scenario walking ----------------------------------------------------

  def self.rooms(json)
    r = json['rooms']
    r.is_a?(Hash) ? r.select { |_, v| v.is_a?(Hash) } : {}
  end

  def self.npc_records(json)
    list = []
    rooms(json).each_value { |room| Array(room['npcs']).each { |n| list << n if n.is_a?(Hash) } }
    %w[npcs phoneNPCs].each { |k| Array(json[k]).each { |n| list << n if n.is_a?(Hash) } if json[k].is_a?(Array) }
    list
  end

  def self.characters_hash(ctx)
    c = ctx.social.is_a?(Hash) ? ctx.social['characters'] : nil
    c.is_a?(Hash) ? c.select { |_, v| v.is_a?(Hash) } : {}
  end

  # ---- generic lints -------------------------------------------------------

  # Aim unlockCondition keys. isUnlockConditionMet returns true for a key it does not
  # recognise, so any other key leaves the aim always unlocked.
  def self.aim_unlock_keys(ctx)
    issues = []
    Array(ctx.json['objectives']).each_with_index do |aim, i|
      next unless aim.is_a?(Hash) && aim['unlockCondition'].is_a?(Hash)

      cond = aim['unlockCondition']
      cond.each_key do |k|
        # _comment and other underscore keys are notes; the engine never reads them
        next if AIM_UNLOCK_KEYS.include?(k) || k.to_s.start_with?('_')

        issues << "❌ SOCIAL: /objectives[#{i}] (aim '#{aim['aimId']}') unlockCondition key '#{k}' is not supported " \
                  "(allowed: #{AIM_UNLOCK_KEYS.join(', ')}); the engine treats an unknown key as always met, so the aim would be unlocked from the start"
      end
      # equals is read only beside globalVariable; alone, the condition is always met
      if cond.key?('equals') && !cond['globalVariable'] && !cond['aimCompleted'] && !cond['aimsCompleted'].is_a?(Array)
        issues << "❌ SOCIAL: /objectives[#{i}] (aim '#{aim['aimId']}') unlockCondition has 'equals' without 'globalVariable'; " \
                  'the engine treats it as always met, so the aim would be unlocked from the start'
      end
    end
    issues
  end

  # Object ids unique across the rooms' objects arrays. The server unlock endpoint finds
  # a locked object by id (or name) in rooms[*].objects, first hit.
  def self.duplicate_object_ids(ctx)
    seen = {}
    rooms(ctx.json).each do |room_id, room|
      Array(room['objects']).each_with_index do |obj, i|
        next unless obj.is_a?(Hash) && obj['id'].is_a?(String) && !obj['id'].empty?

        (seen[obj['id']] ||= []) << "#{room_id}/objects[#{i}]"
      end
    end
    seen.select { |_, where| where.length > 1 }.map do |id, where|
      "❌ SOCIAL: object id '#{id}' is used more than once (#{where.join(', ')}); " \
        "the unlock endpoint takes the first hit by id, so the others could never be unlocked"
    end
  end

  # The unlock endpoint (find_object_in_scenario) matches obj['id'] == key || obj['name'] == key in
  # rooms[*].objects order, first hit, and the client asks with scenarioData.id || scenarioData.name.
  # So a locked object is mis-found when an earlier object has that key as its id or name. Same-id
  # duplicates are the error above; this one is a warning, as shipped missions may share names.
  def self.object_name_collisions(ctx)
    all = []
    rooms(ctx.json).each do |room_id, room|
      Array(room['objects']).each_with_index do |obj, i|
        all << [obj, "#{room_id}/objects[#{i}]"] if obj.is_a?(Hash)
      end
    end
    issues = []
    all.each do |obj, where|
      key = [obj['id'], obj['name']].find { |v| v.is_a?(String) && !v.empty? }
      next unless key
      next unless obj['locked'] == true || obj['lockType'] # only a locked object is asked to the unlock endpoint

      hit = all.find { |o, _| o['id'] == key || o['name'] == key }
      next if hit.nil? || hit[0].equal?(obj)
      next if obj['id'].is_a?(String) && hit[0]['id'] == obj['id'] # same id: reported as an error above

      issues << "⚠️ SOCIAL: #{where} is looked up by '#{key}', but #{hit[1]} matches that id or name first; " \
                "the unlock endpoint takes the first hit, so unlocking this object may open the other one instead. Give it a unique id"
    end
    issues
  end

  # A missing assets/objects/<type>.png for a social object type is an error.
  def self.social_object_sprites(ctx)
    types = ctx.valid_item_types
    return [] unless types

    issues = []
    walk = lambda do |obj, path|
      next unless obj.is_a?(Hash)

      t = obj['type']
      if SOCIAL_OBJECT_TYPES.include?(t) && !types.include?(t)
        issues << "❌ SOCIAL: '#{path}' has social object type '#{t}' but assets/objects/#{t}.png does not exist"
      end
      %w[contents itemsHeld].each { |k| Array(obj[k]).each_with_index { |c, i| walk.call(c, "#{path}/#{k}[#{i}]") } }
    end
    rooms(ctx.json).each do |room_id, room|
      Array(room['objects']).each_with_index { |o, i| walk.call(o, "/rooms/#{room_id}/objects[#{i}]") }
      Array(room['npcs']).each_with_index do |n, i|
        next unless n.is_a?(Hash)

        Array(n['itemsHeld']).each_with_index { |o, j| walk.call(o, "/rooms/#{room_id}/npcs[#{i}]/itemsHeld[#{j}]") }
      end
    end
    Array(ctx.json['startItemsInInventory']).each_with_index { |o, i| walk.call(o, "/startItemsInInventory[#{i}]") }
    issues
  end

  # Globals the social build reads or writes must be declared, and not imported.
  def self.declared_globals(ctx)
    issues = []
    check = lambda do |name, why|
      if ctx.import_names.include?(name)
        issues << "❌ SOCIAL: global '#{name}' (#{why}) is imported (importGlobals), but the social system writes it; declare it in globalVariables instead"
      elsif !ctx.own_globals.key?(name)
        issues << "❌ SOCIAL: global '#{name}' (#{why}) is not declared in globalVariables; an undeclared name is silently not synced to ink"
      end
    end
    characters_hash(ctx).each do |id, ch|
      infl = ch['influence'].is_a?(Hash) ? ch['influence'] : {}
      check.call((infl['global'] || "#{id}_influence").to_s, "influence of social.characters.#{id}")
      check.call("#{id}_latched", "threshold latch of social.characters.#{id}")
      lockout = false
      Array(ch['thresholds']).each do |t|
        next unless t.is_a?(Hash)

        Array(t['effects']).each do |e|
          next unless e.is_a?(Hash)

          case e['type']
          when 'setGlobal'
            kind = e['clearOnRearm'] ? 'band flag' : 'setGlobal target'
            check.call(e['global'].to_s, "#{kind} of threshold '#{t['id']}' on #{id}") if e['global'].is_a?(String)
          when 'lockout' then lockout = true
          end
        end
      end
      if lockout
        check.call("#{id}_lockout_until", "lockout expiry of #{id}")
        check.call("#{id}_lockout_channel", "lockout channel of #{id}")
      end
    end
    issues
  end

  # ---- ink -----------------------------------------------------------------

  def self.ink_source_path(repo_root, story_path)
    return nil unless story_path.is_a?(String) && !story_path.empty?

    File.join(repo_root, story_path.sub(/\.json\z/, '').sub(/\.ink\z/, '') + '.ink')
  end

  # [file, included files...], parsing INCLUDE lines of the .ink text.
  def self.ink_files(root_ink)
    files = []
    queue = [root_ink]
    until queue.empty?
      f = queue.shift
      next if files.include?(f) || !File.exist?(f)

      files << f
      File.readlines(f, encoding: 'UTF-8').each do |l|
        queue << File.expand_path(Regexp.last_match(1), File.dirname(f)) if l =~ /^\s*INCLUDE\s+(\S+)/
      end
    end
    files
  end

  def self.ink_lines(file)
    File.readlines(file, encoding: 'UTF-8').each_with_index.reject { |l, _| l.lstrip.start_with?('//') }
  end

  def self.arity(params)
    params.to_s.split(',').count { |p| !p.strip.empty? }
  end

  # name => [[file, line, arity], ...]
  def self.ink_externals(files)
    out = Hash.new { |h, k| h[k] = [] }
    files.each do |f|
      ink_lines(f).each do |l, i|
        out[Regexp.last_match(1)] << [f, i + 1, arity(Regexp.last_match(2))] if l =~ /^\s*EXTERNAL\s+(\w+)\s*\(([^)]*)\)/
      end
    end
    out
  end

  def self.ink_functions(files)
    out = {}
    files.each do |f|
      ink_lines(f).each do |l, _|
        # the parameter list is optional: `=== function foo ===` takes no arguments
        out[Regexp.last_match(1)] = arity(Regexp.last_match(2)) if l =~ /^\s*=+\s*function\s+(\w+)\s*(?:\(([^)]*)\))?/
      end
    end
    out
  end

  # name => [literal-source, type]
  def self.ink_vars(files)
    out = {}
    files.each do |f|
      ink_lines(f).each do |l, _|
        next unless l =~ /^\s*VAR\s+(\w+)\s*=\s*(.+?)\s*$/

        name = Regexp.last_match(1)
        src = Regexp.last_match(2).sub(%r{\s*//.*\z}, '').strip
        out[name] ||= [src, literal_type(src)]
      end
    end
    out
  end

  def self.literal_type(src)
    case src
    when 'true', 'false' then :bool
    when /\A-?\d+(?:\.\d+)?\z/ then :number
    when /\A"(?:[^"\\]|\\.)*"\z/ then :string
    end
  end

  def self.value_type(v)
    case v
    when true, false then :bool
    when Numeric then :number
    when String then :string
    end
  end

  def self.literal_matches?(src, value)
    case value
    when true, false then src == value.to_s
    when Numeric then src =~ /\A-?\d+(?:\.\d+)?\z/ && src.to_f == value.to_f
    when String then src =~ /\A"(.*)"\z/ && Regexp.last_match(1) == value
    else false
    end
  end

  # NPC id => storyPath, over every NPC record in the scenario.
  def self.npc_story_paths(json)
    npc_records(json).each_with_object({}) do |n, h|
      h[n['id'].to_s] = n['storyPath'] if n['id'] && n['storyPath'].is_a?(String)
    end
  end

  # character id => { channel name => [label, root .ink path] } for stories that exist.
  def self.character_stories(ctx)
    paths = npc_story_paths(ctx.json)
    characters_hash(ctx).each_with_object({}) do |(id, ch), out|
      stories = {}
      if ch['channels'].is_a?(Hash)
        ch['channels'].each do |chan, npc_id|
          sp = paths[npc_id.to_s]
          src = ink_source_path(ctx.repo_root, sp)
          stories[chan.to_s] = [npc_id.to_s, src] if src && File.exist?(src)
        end
      end
      if ch['emailRecord'].is_a?(Hash)
        src = ink_source_path(ctx.repo_root, ch['emailRecord']['storyPath'])
        stories['emailRecord'] = [ch['emailRecord']['storyPath'], src] if src && File.exist?(src)
      end
      out[id] = stories
    end
  end

  # Every ink story a social character uses, plus any storyPath inside `social`.
  def self.social_story_roots(ctx)
    roots = []
    character_stories(ctx).each_value { |s| s.each_value { |(_, src)| roots << src } }
    walk = lambda do |node|
      case node
      when Hash then node.each { |k, v| k == 'storyPath' && v.is_a?(String) ? roots << ink_source_path(ctx.repo_root, v) : walk.call(v) }
      when Array then node.each { |v| walk.call(v) }
      end
    end
    walk.call(ctx.social)
    roots.compact.uniq.select { |f| File.exist?(f) }
  end

  # Every EXTERNAL in a social story needs a function of the same name and arity
  # (the story then loads even where the real function is not bound). Reads .ink text.
  def self.external_fallbacks(ctx)
    issues = []
    social_story_roots(ctx).each do |root|
      files = ink_files(root)
      funcs = ink_functions(files)
      ink_externals(files).each do |name, decls|
        file, line, ar = decls.first
        rel = file.sub("#{ctx.repo_root}/", '')
        if !funcs.key?(name)
          issues << "❌ SOCIAL: #{rel}:#{line} declares EXTERNAL #{name} but the story has no '=== function #{name}(...) ===' fallback; " \
                    'an unbound external throws on the first Continue()'
        elsif funcs[name] != ar
          issues << "❌ SOCIAL: #{rel}:#{line} EXTERNAL #{name} takes #{ar} argument(s) but its fallback function takes #{funcs[name]}"
        end
      end
    end
    issues
  end

  # ---- social.characters data lints ----------------------------------------

  def self.number?(v)
    v.is_a?(Numeric)
  end

  def self.characters(ctx)
    issues = []
    stories = character_stories(ctx)
    characters_hash(ctx).each do |id, ch|
      where = "social.characters.#{id}"
      infl = ch['influence'].is_a?(Hash) ? ch['influence'] : {}
      infl_global = (infl['global'] || "#{id}_influence").to_s
      synced = Array(ch['syncedVars']).map(&:to_s)
      thresholds = Array(ch['thresholds']).select { |t| t.is_a?(Hash) }
      margin = number?(infl['rearmMargin']) ? infl['rearmMargin'] : 10

      # synced variables are declared (an import counts: it is declared by the merge)
      synced.each do |v|
        next if ctx.all_globals.key?(v)

        issues << "❌ SOCIAL: #{where}.syncedVars lists '#{v}', which is not declared in globalVariables"
      end

      # each channel story declares the influence VAR; the VARs it names match type and default
      (stories[id] || {}).each do |chan, (label, src)|
        vars = ink_vars(ink_files(src))
        rel = src.sub("#{ctx.repo_root}/", '')
        unless vars.key?(infl_global)
          issues << "❌ SOCIAL: #{where} channel '#{chan}' (#{label}, #{rel}) does not declare VAR #{infl_global}"
        end
        ([infl_global] + synced).uniq.each do |v|
          next unless vars.key?(v) && ctx.all_globals.key?(v)

          src_lit, ty = vars[v]
          decl = ctx.all_globals[v]
          if ty && value_type(decl) && ty != value_type(decl)
            issues << "❌ SOCIAL: #{rel} VAR #{v} is #{ty} but globalVariables declares #{decl.inspect} (#{value_type(decl)})"
          elsif ty && !literal_matches?(src_lit, decl)
            issues << "❌ SOCIAL: #{rel} VAR #{v} = #{src_lit} but globalVariables declares #{decl.inspect}; the default must match"
          end
        end
        vars.each_key do |v|
          next unless v.start_with?("#{id}_") && ctx.all_globals.key?(v) && v != infl_global && !synced.include?(v)

          issues << "⚠️ SOCIAL: #{rel} declares VAR #{v}, a declared global, but #{where}.syncedVars does not list it (it still syncs)"
        end
      end

      # thresholds ordered
      ids = thresholds.map { |t| t['id'] }
      dup = ids.compact.group_by(&:itself).select { |_, v| v.length > 1 }.keys
      dup.each { |d| issues << "❌ SOCIAL: #{where}.thresholds has the id '#{d}' more than once" }
      below = thresholds.select { |t| number?(t['at']) && threshold_when(t) == 'below' }
      above = thresholds.select { |t| number?(t['at']) && threshold_when(t) == 'above' }
      ordered = lambda do |list, dir, label|
        ats = list.map { |t| t['at'] }
        ok = dir == :desc ? ats.each_cons(2).all? { |a, b| a >= b } : ats.each_cons(2).all? { |a, b| a <= b }
        next if ok

        issues << "❌ SOCIAL: #{where}.thresholds are not ordered: #{label} thresholds must run #{dir == :desc ? 'from the mildest (highest at) to the most severe (lowest at)' : 'from the lowest at to the highest'} (got #{ats.join(', ')})"
      end
      ordered.call(below, :desc, '"below"')
      ordered.call(above, :asc, '"above"')
      thresholds.each_with_index do |t, i|
        issues << "❌ SOCIAL: #{where}.thresholds[#{i}] needs a numeric 'at'" unless number?(t['at'])
      end
      if number?(infl['min']) && number?(infl['max']) && infl['min'] >= infl['max']
        issues << "❌ SOCIAL: #{where}.influence min (#{infl['min']}) must be below max (#{infl['max']})"
      end
      if number?(infl['min']) && number?(infl['max']) && number?(infl['start']) && !(infl['min']..infl['max']).cover?(infl['start'])
        issues << "❌ SOCIAL: #{where}.influence start (#{infl['start']}) lies outside min..max"
      end
      # influence.start agrees with the influence global's initial value and each channel story's
      # VAR default. The engine reads the global first and falls back to start, so a mismatch
      # means the meter starts somewhere the author did not write (MECHANICS_AUDIT M3/M4 follow-up).
      if number?(infl['start'])
        decl = ctx.all_globals[infl_global]
        if ctx.all_globals.key?(infl_global) && number?(decl) && decl.to_f != infl['start'].to_f
          issues << "❌ SOCIAL: #{where}.influence start (#{infl['start']}) does not match globalVariables #{infl_global} (#{decl}); " \
                    'the game starts the meter at the global, so make the two agree'
        end
        unless ctx.all_globals.key?(infl_global)
          (stories[id] || {}).each do |chan, (label, src)|
            src_lit, ty = ink_vars(ink_files(src))[infl_global]
            next unless ty == :number && !literal_matches?(src_lit, infl['start'])

            rel = src.sub("#{ctx.repo_root}/", '')
            issues << "❌ SOCIAL: #{rel} VAR #{infl_global} = #{src_lit} but #{where}.influence start is #{infl['start']} " \
                      "(channel '#{chan}', #{label}); the default must match"
          end
        end
      end

      # clearOnRearm only on boolean targets
      thresholds.each do |t|
        Array(t['effects']).each do |e|
          next unless e.is_a?(Hash) && e['type'] == 'setGlobal' && e['clearOnRearm']

          decl = ctx.all_globals[e['global']]
          bool_value = e['value'] == true || e['value'] == false
          bool_decl = decl == true || decl == false
          unless bool_value && (bool_decl || !ctx.all_globals.key?(e['global']))
            issues << "❌ SOCIAL: #{where} threshold '#{t['id']}' sets clearOnRearm on '#{e['global']}', which is not a boolean " \
                      "(value #{e['value'].inspect}, declared default #{decl.inspect}); only boolean band flags can clear on re-arm"
          end
        end
      end

      # lockout: expiry or route; recoverTo rule
      a_values = below.select { |t| Array(t['effects']).any? }.map { |t| t['at'] }
      a = a_values.max
      thresholds.each do |t|
        Array(t['effects']).each do |e|
          next unless e.is_a?(Hash) && e['type'] == 'lockout'

          until_v = e['until']
          has_expiry = until_v.is_a?(Hash) && (number?(until_v['afterMinutes']) || until_v['global'].is_a?(String))
          if until_v.is_a?(Hash) && until_v.key?('afterMinutes') && !(number?(until_v['afterMinutes']) && until_v['afterMinutes'].positive?)
            issues << "❌ SOCIAL: #{where} threshold '#{t['id']}' lockout until.afterMinutes must be a positive number"
          end
          if until_v.is_a?(Hash) && until_v['global'].is_a?(String) && !ctx.all_globals.key?(until_v['global'])
            issues << "❌ SOCIAL: #{where} threshold '#{t['id']}' lockout until.global '#{until_v['global']}' is not declared in globalVariables"
          end
          if !has_expiry && !(e['alternativeRoute'] || ch['alternativeRoute'])
            issues << "❌ SOCIAL: #{where} threshold '#{t['id']}' has a lockout with no expiry (until must be {afterMinutes} or {global}) " \
                      'and no alternativeRoute; a failed attempt could block the critical path for good'
          end
          if !%w[channel character].include?(e['scope'])
            issues << "❌ SOCIAL: #{where} threshold '#{t['id']}' lockout scope must be 'channel' or 'character'"
          end
          if a
            # the same default as the engine (social-influence.js normaliseCharacter and
            # liftLockout): influence.start, else the influence global's declared default, else 0
            default_start = if number?(infl['start']) then infl['start']
                            elsif number?(ctx.all_globals[infl_global]) then ctx.all_globals[infl_global]
                            else 0
                            end
            rec = e.key?('recoverTo') ? e['recoverTo'] : default_start
            if !number?(rec)
              issues << "❌ SOCIAL: #{where} threshold '#{t['id']}' lockout recoverTo must be a number (got #{rec.inspect})"
            elsif rec < a + margin
              issues << "❌ SOCIAL: #{where} threshold '#{t['id']}' lockout recoverTo #{rec} is below #{a + margin} " \
                        "(highest below-threshold 'at' #{a} + rearmMargin #{margin}); the character would come back still wary"
            end
          end
        end
      end

      issues.concat(influence_display_lint(ch['influence'].is_a?(Hash) ? infl['display'] : nil, "#{where}.influence.display")) if infl.key?('display')
    end
    if ctx.social.key?('influenceDisplay')
      issues.concat(influence_display_lint(ctx.social['influenceDisplay'], 'social.influenceDisplay'))
    end
    issues
  end

  # The complete influence.display / social.influenceDisplay lint (00 S11, README AA; P1-K
  # confirmed it needs nothing more): an object, only the keys bar/number/pip, boolean values,
  # and a warning for number: true beside bar: false. Per-mount behaviour is the bar's job
  # (ui/influence-bar.js), not the validator's.
  def self.influence_display_lint(obj, where)
    return ["❌ SOCIAL: #{where} must be an object with the keys bar, number, pip"] unless obj.is_a?(Hash)

    issues = []
    obj.each do |k, v|
      issues << "❌ SOCIAL: #{where} has the key '#{k}'; only bar, number and pip are allowed" unless %w[bar number pip].include?(k)
      issues << "❌ SOCIAL: #{where}.#{k} must be true or false" if %w[bar number pip].include?(k) && v != true && v != false
    end
    issues << "⚠️ SOCIAL: #{where} sets number: true beside bar: false; bar: false hides the number too" if obj['number'] == true && obj['bar'] == false
    issues
  end

  def self.threshold_when(t)
    return t['when'] if %w[below above].include?(t['when'])

    t['at'].to_f.negative? ? 'below' : 'above'
  end
end

%w[mail osint board triage pretext landing lab].each do |area|
  require_relative "validate_social/#{area}"
end

ValidateSocial::AREAS.concat([ValidateSocial::Mail, ValidateSocial::Osint, ValidateSocial::Board,
                              ValidateSocial::Triage, ValidateSocial::Pretext, ValidateSocial::Landing,
                              ValidateSocial::Lab])

# The late options (hintsByFactor, labelBy, checklistTiming, mirrorToBehavior, lockedHint): MECHANICS_AUDIT M3
require_relative 'validate_social/options'
ValidateSocial::AREAS << ValidateSocial::Options
