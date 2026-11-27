# frozen_string_literal: true

require 'minitest/autorun'
require 'json'
require_relative '../../lib/break_escape/scenario_schema'
require_relative '../../lib/break_escape/author_notes'
require_relative '../../lib/break_escape/owner_claim'
require_relative '../../lib/break_escape/capture_model'

# Step 2b, the schema-walk test. It simulates the run-time walk over the schema itself, with the
# real resolver and the eager enumerator, then checks the marks. The parts follow the plan
# (section 4, step 2b, Tests, "the schema walk test"): Explore, Reach, the run-time probe walk,
# Marks, the old-rule fixture that must report its misses, and the corpus check.
#
# The eager enumerator (ScenarioSchema.explore / each_raw_location) and the lazy resolver
# (classify / child / item / note?) share one body of classify code, so this test exercises the
# very resolution the server and validator use.
#
# Phase A builds Explore, Reach, Marks, the run-time probe walk (through AuthorNotes.each_live and
# strip_notes!) and the old-rule fixture. The OwnerClaim.scenario_objects and
# CaptureModel.each_capture_writer probe assertions, and the full corpus render, join in phase B
# once those walkers carry a Node (see the build log handover).
class ScenarioSchemaWalkTest < Minitest::Test
  SS = BreakEscape::ScenarioSchema
  AN = BreakEscape::AuthorNotes

  def self.explored
    @explored ||= SS.explore.to_a
  end

  def explored
    self.class.explored
  end

  # --- Part 1. Explore ---------------------------------------------------------------------------
  # From the root and from every start pointer, child/item and the two probe keys reach the schema.
  def test_explore_reaches_the_schema
    nodes = explored
    assert_operator nodes.size, :>, 2000, "explore reached only #{nodes.size} Nodes"
    # every STARTS pointer the schema holds resolves and is a reached Node (by branch identity)
    reached_branches = {}
    nodes.each { |n, _| n.branches.each { |b| reached_branches[b.object_id] = true } }
    SS::STARTS.each do |ptr|
      next if ptr == '#'

      node = SS.at(ptr)
      assert node.is_a?(SS::Node), "start #{ptr} did not resolve to a Node"
      assert node.branches.any? { |b| reached_branches[b.object_id] }, "start #{ptr} not reached by explore"
    end
  end

  # The pointers passed to ScenarioSchema.at anywhere in app/, lib/ and scripts/ must all be in
  # STARTS (found by grep, not listed by hand), so a new start cannot skip the compile.
  def test_every_at_pointer_is_a_start
    root = File.expand_path('../..', __dir__)
    pointers = []
    Dir.glob(File.join(root, '{app,lib,scripts}/**/*.rb')).each do |f|
      File.foreach(f) do |line|
        line.scan(/ScenarioSchema\.at\(\s*(['"])(#[^'"]*)\1/) { |_q, ptr| pointers << ptr }
      end
    end
    pointers.uniq!
    missing = pointers.reject { |p| SS::STARTS.include?(p) }
    assert_empty missing, "ScenarioSchema.at pointers not in STARTS: #{missing.inspect}"
  end

  # --- Part 2. Reach -----------------------------------------------------------------------------
  # Every map location in the schema lies in some reached Node; one that does not is a $ref or
  # branch the resolver did not follow.
  def test_every_map_location_is_reached
    reached = {}
    explored.each { |n, _| n.branches.each { |b| reached[b.object_id] = true } }
    maps = []
    SS.each_raw_location { |raw, ptr| maps << [raw, ptr] if SS.map_location?(raw) }
    assert_operator maps.size, :>=, 94, "found only #{maps.size} map locations"
    missed = maps.reject { |raw, _| reached[raw.object_id] }
    assert_empty missed.map { |_, ptr| ptr }, 'map locations not reached by explore'
  end

  # --- Part 3. The run-time probe walk -----------------------------------------------------------
  # For every reached Node, note?/each_live/strip_notes! agree: a map key and a free key are never
  # notes (kept, yielded); a "_" property or undeclared "_" key is a note (stripped, skipped).
  def test_runtime_probe_walk_agrees_with_classification
    probe_val = { 'id' => 'probe', 'addCapture' => { 'targetId' => 'probe' } }
    explored.each do |node, path|
      kind, = SS.classify(node, '_probe')
      expect_note = (kind == :property || kind == :undeclared) && !SS.free?(node)
      # strip_notes! on a fresh { "_probe" => probe_val } at this Node
      data = { '_probe' => Marshal.load(Marshal.dump(probe_val)) }
      AN.strip_notes!(data, node)
      if expect_note
        assert data.empty?, "expected _probe stripped as a note at #{path.join('/')} (kind #{kind})"
      else
        assert data.key?('_probe'), "expected _probe kept (id/free) at #{path.join('/')} (kind #{kind})"
      end
      # each_live yields the kept value, skips the note
      yielded = []
      AN.each_live({ '_probe' => Marshal.load(Marshal.dump(probe_val)) }, node) { |v, _n, keys| yielded << keys }
      saw_probe = yielded.any? { |k| k == ['_probe'] }
      if expect_note
        refute saw_probe, "each_live yielded a note at #{path.join('/')}"
      else
        assert saw_probe, "each_live skipped an id/free key at #{path.join('/')}"
      end
    end
  end

  # A plain probe (no leading "_") is always kept and yielded, whatever the Node, so Reach does not
  # depend on the rule for "_" keys.
  def test_plain_probe_is_never_a_note
    explored.first(400).each do |node, path|
      data = { 'probe' => { 'id' => 'probe' } }
      AN.strip_notes!(data, node)
      assert data.key?('probe'), "plain probe stripped at #{path.join('/')}"
    end
  end

  # Build nested data from an explore data path (String keys, "[]" for an array item), placing leaf
  # at the end, so the value at that path has the walked Node.
  def build_from_path(path, leaf)
    path.reverse.reduce(leaf) { |acc, seg| seg == '[]' ? [acc] : { seg => acc } }
  end

  # Part 3, continued (phase B): the two state-carrying walkers that now hold a Node,
  # OwnerClaim.scenario_objects and CaptureModel.each_capture_writer, agree with classify at every
  # reached Node. For a Node reached by a clean data path (no "_" segment and not a start pointer),
  # place { "_probe" => { id, addCapture } } at the path and walk from the root: where "_probe" is
  # an id or free (kept), both walkers see the probe (its id is listed, its addCapture is a writer);
  # where it is a note, neither does. A "_" or "#"-start path is skipped because a note or a pointer
  # segment would block the walk before the leaf, which is not a test of the final Node.
  def test_runtime_probe_walk_owner_and_capture_agree
    probe_val = { 'id' => 'probe', 'addCapture' => { 'targetId' => 'probe' } }
    checked = 0
    explored.each do |node, path|
      next if path.any? { |s| s.is_a?(String) && (s.start_with?('_') || s.start_with?('#')) }

      kind, = SS.classify(node, '_probe')
      # The walkers key off AuthorNotes.note?, which is false whenever the Node has a free branch
      # (a typed property beside a free branch, such as socialExercise.config, is kept), so expect
      # keep by note?, not by classify's kind alone.
      expect_keep = !AN.note?(node, '_probe')
      data = build_from_path(path, { '_probe' => Marshal.load(Marshal.dump(probe_val)) })
      obj_ids = BreakEscape::OwnerClaim.scenario_objects(data).map { |o| o[:obj]['id'] }
      writers = BreakEscape::CaptureModel.each_capture_writer(data).map { |cap, _k, _p, _o| cap['targetId'] }
      loc = path.join('/')
      checked += 1
      if expect_keep
        assert_includes obj_ids, 'probe', "scenario_objects missed a kept id at #{loc} (kind #{kind})"
        assert_includes writers, 'probe', "each_capture_writer missed a kept writer at #{loc} (kind #{kind})"
      else
        refute_includes obj_ids, 'probe', "scenario_objects saw a note at #{loc} (kind #{kind})"
        refute_includes writers, 'probe', "each_capture_writer saw a note at #{loc} (kind #{kind})"
      end
    end
    assert_operator checked, :>, 1000, "only #{checked} clean-path Nodes checked"
  end

  # --- Part 4. Marks -----------------------------------------------------------------------------
  # Every open schema location carries exactly one of x-id-map:true, x-id-map:false, x-free-data:true.
  def test_every_open_location_has_exactly_one_mark
    unmarked = []
    two = []
    count = 0
    SS.each_raw_location do |raw, ptr|
      next if SS.only_required?(raw)
      next if SS.open_kinds(raw).empty?

      count += 1
      marks = SS.marks_on(raw)
      unmarked << ptr if marks.empty?
      two << ptr if marks.size > 1
    end
    assert_operator count, :>, 0
    assert_empty unmarked, 'open locations with no mark'
    assert_empty two, 'open locations with two marks'
  end

  # A map node never carries a patternProperties entry (step 2b removed the 18 "^_" patterns).
  def test_no_map_node_carries_a_pattern
    offenders = []
    SS.each_raw_location do |raw, ptr|
      next unless SS.map_location?(raw)
      next unless raw['patternProperties'].is_a?(Hash)

      offenders << ptr unless raw['patternProperties'].empty?
    end
    assert_empty offenders, 'map nodes still carry a patternProperties entry'
  end

  # --- Part 5. The old-rule fixture (the test can fail) ------------------------------------------
  # The parent-name rule (classify a key by the name of the property it sits under) misses maps the
  # schema reaches, which is why the schema-based resolver is needed. The fixture must report those
  # misses, among them the three the plan names.
  def test_parent_name_rule_reports_misses
    # names a parent-name rule would treat as id maps
    id_map_parents = %w[rooms globals globalVariables characters needs flags setGlobal setVariable].to_set
    misses = []
    SS.each_raw_location do |raw, ptr|
      next unless SS.map_location?(raw)

      parent = ptr.split('/').reject { |s| %w[properties additionalProperties items oneOf anyOf allOf].include?(s) }.last
      # the parent-name rule fails to see this map unless the property name itself is known
      misses << ptr unless id_map_parents.include?(parent)
    end
    refute_empty misses, 'the parent-name rule should miss some maps'
    # representative maps whose parent name a name rule would not key on, so it misses them
    assert misses.any? { |p| p.include?('byChoice') || p.include?('readinessSlots') || p.include?('interests') },
           "expected a parent-name miss among byChoice/readinessSlots/interests; got #{misses.first(5).inspect}"
  end

  # --- Part 6. The corpus (phase B) --------------------------------------------------------------
  # Every rendered template, walked from the root with the resolver, has no setGlobal/setVariable-
  # shaped key and no `type: set_global` hash reached under nil (an undescribed location). A map of
  # names reached under nil would treat a "_"-prefixed global name as a note; the four such maps
  # were marked x-id-map:true in phase A, so on main this list is empty. Needs the validator's ERB
  # renderer (json-schema gem), so it runs under the validator Ruby and skips when that is absent.
  # A setGlobal/setVariable MAP of names reached under nil is the hazard the plan names (the walk
  # would treat a "_"-prefixed global name as a note): this must be empty. A `type: set_global`
  # action reached under nil is harmless (its name is a value field, not a hash key, so no "_" name
  # is dropped and global_writers still collects it); it is undescribed only because objects are
  # open core kinds (scenarioData, onOwnerNoticesMissing), out of scope until the section-7 closure.
  # So those are asserted against a known list, which still catches a new one.
  KNOWN_SET_GLOBAL_UNDER_NIL = [
    'lab_physical_pentest: rooms/open_plan/objects/3/onOwnerNoticesMissing/0 (type set_global)',
    'sis01_healthcare: rooms/it_security_office/objects/1/scenarioData/minigameData/completionActions/0 (type set_global)',
    'sis01_healthcare: rooms/it_security_office/objects/1/scenarioData/minigameData/progressActions/0 (type set_global)',
    'sis01_healthcare: rooms/it_security_office/objects/1/scenarioData/minigameData/progressActions/1 (type set_global)',
    'test_clone_left_card: rooms/office/objects/2/onOwnerNoticesMissing/0 (type set_global)'
  ].sort.freeze

  def test_corpus_has_no_setglobal_map_under_nil
    begin
      require_relative '../../scripts/validate_scenario'
    rescue LoadError, StandardError => e
      skip "validator renderer unavailable (run under /usr/bin/ruby3.2): #{e.class}"
    end
    root = File.expand_path('../..', __dir__)
    templates = Dir.glob(File.join(root, 'scenarios/*/scenario.json.erb')).sort
    assert_operator templates.size, :>, 150, "found only #{templates.size} templates"
    map_findings = []
    action_findings = []
    rendered = 0
    templates.each do |path|
      scenario = File.basename(File.dirname(path))
      begin
        srand(1)
        data = render_erb_to_json(path)
      rescue StandardError
        next # a template needing vm_context or failing to parse is not part-6's concern
      end
      next unless data.is_a?(Hash)

      rendered += 1
      maps, actions = corpus_setglobal_under_nil(data)
      maps.each { |p| map_findings << "#{scenario}: #{p}" }
      actions.each { |p| action_findings << "#{scenario}: #{p}" }
    end
    assert_operator rendered, :>, 150, "rendered only #{rendered} templates"
    assert_empty map_findings, "setGlobal/setVariable MAP-of-names key reached under nil:\n#{map_findings.join("\n")}"
    assert_equal KNOWN_SET_GLOBAL_UNDER_NIL, action_findings.sort,
                 'a new (or removed) `type: set_global` action under nil; objects are open, so this ' \
                 'is harmless, but update KNOWN_SET_GLOBAL_UNDER_NIL and the build log'
  end

  SETGLOBAL_KEYS = %w[setGlobal setVariable setGlobals setVariables].freeze

  def setglobal_shaped_key?(key)
    SETGLOBAL_KEYS.include?(key) || key.end_with?('SetGlobal') || key.end_with?('SetVariable')
  end

  # Walk data from the root carrying each value's Node. Returns [map_findings, action_findings]: a
  # Hash whose own Node is nil and which carries a setGlobal-shaped key (a map of names) is a map
  # finding (the hazard); one that is a `type: set_global` action is an action finding (harmless).
  def corpus_setglobal_under_nil(data)
    maps = []
    actions = []
    walk = lambda do |node, snode, keys|
      case node
      when Hash
        if snode.nil?
          node.each_key { |k| maps << "#{keys.join('/')}/#{k}" if setglobal_shaped_key?(k.to_s) }
          actions << "#{keys.join('/')} (type set_global)" if node['type'] == 'set_global'
        end
        node.each { |k, v| walk.call(v, SS.child(snode, k.to_s), keys + [k.to_s]) }
      when Array
        inode = SS.item(snode)
        node.each_with_index { |v, i| walk.call(v, inode, keys + [i]) }
      end
    end
    walk.call(data, SS.root, [])
    [maps, actions]
  end
end
