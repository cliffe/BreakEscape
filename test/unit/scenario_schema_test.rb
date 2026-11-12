# frozen_string_literal: true

require 'minitest/autorun'
require 'json'
require_relative '../../lib/break_escape/scenario_schema'
require_relative '../../lib/break_escape/author_notes'

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
  # Every rendered template, walked from the root, has no setGlobal/setVariable-shaped key under
  # nil. Deferred to phase B (needs the validator's ERB renderer); the build log tracks it.
end
