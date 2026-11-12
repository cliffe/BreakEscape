# frozen_string_literal: true

require 'minitest/autorun'
require 'json'
require 'tmpdir'
require_relative '../../lib/break_escape/scenario_schema'
require_relative '../../lib/break_escape/author_notes'

# Step 2b. ScenarioSchema (child, item, id_key?, free?) and AuthorNotes (note?, each_live,
# strip_notes!), proved against a fixture schema loaded with ScenarioSchema.load and the default
# starts. Every rule the plan lists has a case here.
class AuthorNotesTest < Minitest::Test
  SS = BreakEscape::ScenarioSchema
  AN = BreakEscape::AuthorNotes

  FIXTURE = File.expand_path('../fixtures/files/author_notes_schema.json', __dir__)

  def setup
    @table = SS.load(FIXTURE)
    @root = @table.root
  end

  def child(node, *keys)
    keys.reduce(node) { |n, k| SS.child(n, k) }
  end

  # Rule 1: a declared or pattern-matched "_" property is a note.
  def test_note_on_object_property
    closed = child(@root, 'closed')
    assert AN.note?(closed, '_comment'), 'declared _comment is a note'
    assert AN.note?(closed, '_why'), '^_ pattern match is a note'
    refute AN.note?(closed, 'name'), 'a plain property is not a note'
  end

  # Rule 2: a key of a map is an id, whatever its first character.
  def test_room_id_is_not_a_note
    rooms = child(@root, 'rooms')
    assert SS.id_key?(rooms, '_annex')
    refute AN.note?(rooms, '_annex')
  end

  def test_global_name_is_id_xidmap_true
    globals = child(@root, 'globals')
    assert SS.id_key?(globals, '_g')
    refute AN.note?(globals, '_g')
    assert_nil SS.child(globals, '_g'), 'open id-map value has nil child'
  end

  def test_need_name_is_id
    needs = child(@root, 'rooms', '_annex', 'needs')
    assert SS.id_key?(needs, '_n')
    refute AN.note?(needs, '_n')
  end

  # Rule 1 under an id: a "_" key inside a "_" room's object is a note.
  def test_underscore_key_inside_underscore_room_object
    obj = SS.item(child(@root, 'rooms', '_annex', 'objects'))
    assert AN.note?(obj, '_note')
    refute AN.note?(obj, 'id')
  end

  # x-id-map: false: fixed field names, so a "_" key is a note.
  def test_xidmap_false_is_note
    narrator = child(@root, 'narrator')
    assert AN.note?(narrator, '_x')
    refute AN.note?(narrator, 'voice')
  end

  # Free data: nothing is a note, and children stay FREE.
  def test_free_data_is_never_a_note
    mg = child(@root, 'minigameData')
    assert SS.free?(mg)
    refute AN.note?(mg, '_x')
    assert_equal SS::FREE, SS.child(mg, '_x')
    assert_equal SS::FREE, SS.child(mg, 'anything')
    refute AN.note?(SS::FREE, '_y'), 'no key under FREE is a note'
  end

  # A map that also declares properties: the property is reached as a property, every other key is
  # an id.
  def test_map_with_properties
    phish = child(@root, 'phish')
    assert SS.id_key?(phish, '_x')
    refute AN.note?(phish, '_x')
    refute SS.id_key?(phish, 'byChoice')
    assert_equal :property, SS.classify(phish, 'byChoice').first
  end

  def test_character_id
    chars = child(@root, 'characters')
    assert SS.id_key?(chars, '_hero')
    refute AN.note?(chars, '_hero')
  end

  # A map node that also carries a "^_" pattern: the pattern is not consulted, so a "_" key is an id.
  def test_patterned_map_key_is_id
    pm = child(@root, 'patternedMap')
    assert SS.id_key?(pm, '_x')
    refute AN.note?(pm, '_x')
  end

  # A key declared by the typed branch beside a free branch is a property; a "_" key there is still
  # not a note, because the location is free.
  def test_typed_branch_beside_free_branch
    mixed = child(@root, 'mixed')
    assert_equal :property, SS.classify(mixed, 'socialGuess').first
    assert SS.free?(mixed)
    refute AN.note?(mixed, '_x')
  end

  # Under nil every "_" key is a note.
  def test_under_nil
    assert AN.note?(nil, '_x')
    refute AN.note?(nil, 'x')
    assert_nil SS.child(nil, 'x')
  end

  def test_strip_notes
    data = {
      'closed' => { 'name' => 'n', '_comment' => 'c' },
      'rooms' => { '_annex' => { 'objects' => [{ 'id' => 'o', '_note' => 'x' }], 'needs' => { '_n' => {} } } },
      'globals' => { '_g' => 1 },
      'minigameData' => { '_x' => { '_deep' => 2 } },
      'narrator' => { 'voice' => 'v', '_x' => 'note' }
    }
    out = AN.strip_notes!(deep_dup(data), @root)
    assert_equal({ 'name' => 'n' }, out['closed'])
    assert_equal({ 'objects' => [{ 'id' => 'o' }], 'needs' => { '_n' => {} } }, out['rooms']['_annex'])
    assert_equal({ '_g' => 1 }, out['globals'])
    assert_equal({ '_x' => { '_deep' => 2 } }, out['minigameData'], 'free data ships as authored')
    assert_equal({ 'voice' => 'v' }, out['narrator'])
    assert_same out, AN.strip_notes!(out, @root), 'returns its argument'
  end

  def test_each_live_visits_free_skips_notes
    data = {
      'closed' => { 'name' => 'n', '_comment' => 'c' },
      'minigameData' => { '_x' => { '_deep' => 2 } },
      'narrator' => { 'voice' => 'v', '_x' => 'note' }
    }
    paths = []
    AN.each_live(data, @root) { |_v, _n, keys| paths << keys }
    assert_includes paths, %w[minigameData _x], 'free value visited'
    assert_includes paths, %w[minigameData _x _deep], 'free value visited deeply'
    refute_includes paths, %w[closed _comment], 'a note is skipped'
    refute_includes paths, %w[narrator _x], 'a note is skipped'

    skipped = []
    AN.each_live(data, @root, free: :skip) { |_v, _n, keys| skipped << keys }
    refute(skipped.any? { |k| k.first == 'minigameData' }, 'free: :skip skips the free subtree')
    assert_includes skipped, %w[closed name], 'non-free still walked'
  end

  def test_at_restricted_to_starts
    assert_raises(ArgumentError) { SS.at('#/definitions/not_a_start') }
  end

  def test_load_broken_ref_raises
    Dir.mktmpdir do |dir|
      path = File.join(dir, 'broken.json')
      File.write(path, JSON.generate(
        'type' => 'object',
        'properties' => {},
        'definitions' => { 'room' => { '$ref' => '#/definitions/missing' } }
      ))
      err = assert_raises(ArgumentError) { SS.load(path) }
      assert_match(/room/, err.message)
    end
  end

  def test_load_missing_file_raises
    assert_raises(ArgumentError) { SS.load('/no/such/schema.json') }
  end

  private

  def deep_dup(obj)
    JSON.parse(JSON.generate(obj))
  end
end
