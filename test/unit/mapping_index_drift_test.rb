# frozen_string_literal: true

require 'minitest/autorun'
require 'json'
require_relative '../../tools/check_mapping_index_drift'

# tools/check_mapping_index_drift.rb: eventMappings may be appended to or edited, never shifted.
class MappingIndexDriftTest < Minitest::Test
  def erb(npcs)
    JSON.generate('rooms' => { 'r' => { 'npcs' => npcs } }) + "<%# fixture %>"
  end

  def npc(id, patterns, extra = {})
    { 'id' => id, 'eventMappings' => patterns.map { |p| { 'eventPattern' => p }.merge(extra) } }
  end

  def check(base, head)
    MappingDrift.check_texts('s', erb(base), erb(head))
  end

  def test_append_ok
    assert_empty check([npc('a', %w[x y])], [npc('a', %w[x y z])])
  end

  def test_mid_insert_fails
    out = check([npc('a', %w[x y])], [npc('a', %w[x n y])])
    assert_equal ['MAPDRIFT s a base[1]=y head[1]=n'], out
  end

  def test_removal_fails
    out = check([npc('a', %w[x y z])], [npc('a', %w[x z])])
    assert_equal ['MAPDRIFT s a base[1]=y head[1]=z', 'MAPDRIFT s a base[2]=z head[2]=(missing)'], out
  end

  def test_content_edit_ok
    base = [npc('a', %w[x y], 'onceOnly' => true)]
    head = [npc('a', %w[x y], 'onceOnly' => false)]
    assert_empty check(base, head)
  end

  def test_new_npc_ok
    assert_empty check([npc('a', %w[x])], [npc('a', %w[x]), npc('b', %w[q r])])
  end

  def test_npc_removed_ok
    assert_empty check([npc('a', %w[x]), npc('b', %w[q])], [npc('a', %w[x])])
  end

  def test_npcs_found_anywhere
    base = JSON.generate('startRoom' => 'r', 'phoneNpcs' => [npc('p', %w[x y])])
    head = JSON.generate('startRoom' => 'r', 'phoneNpcs' => [npc('p', %w[n x y])])
    assert_equal 2, MappingDrift.check_texts('s', base, head).size
  end
end
