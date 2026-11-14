# frozen_string_literal: true

require 'test_helper'
require 'break_escape/schema_walk'

module BreakEscape
  # Step 4. The shared schema walker pairs each value with its schema Node (through the step 2b
  # resolver) and reads the x-ref kind off string leaves. These test it directly, against the real
  # process schema, so the x-ref annotations and the walker are exercised together.
  class SchemaWalkTest < ActiveSupport::TestCase
    def ref_kinds(data)
      out = {}
      SchemaWalk.walk(data, ScenarioSchema.root) do |value, node, path|
        next unless value.is_a?(String)

        kind = SchemaWalk.ref_kind(node)
        out[SchemaWalk.path_string(path)] = kind if kind
      end
      out
    end

    test 'path_string renders keys and array indices' do
      assert_equal 'rooms/a/objects[0]/network', SchemaWalk.path_string(['rooms', 'a', 'objects', 0, 'network'])
      assert_equal '', SchemaWalk.path_string([])
    end

    test 'an eventMapping completeTask string resolves to the task kind' do
      data = { 'rooms' => { 'a' => { 'type' => 'room_office', 'connections' => {},
                                     'npcs' => [{ 'id' => 'b', 'type' => 'person', 'name' => 'B',
                                                  'eventMappings' => [{ 'eventPattern' => 'x', 'completeTask' => 't1' }] }] } } }
      assert_equal 'task', ref_kinds(data)['rooms/a/npcs[0]/eventMappings[0]/completeTask']
    end

    test 'a completeTask array carries x-ref on each item' do
      data = { 'rooms' => { 'a' => { 'type' => 'room_office', 'connections' => {},
                                     'npcs' => [{ 'id' => 'b', 'type' => 'person', 'name' => 'B',
                                                  'eventMappings' => [{ 'eventPattern' => 'x', 'completeTask' => %w[t1 t2] }] }] } } }
      kinds = ref_kinds(data)
      assert_equal 'task', kinds['rooms/a/npcs[0]/eventMappings[0]/completeTask[0]']
      assert_equal 'task', kinds['rooms/a/npcs[0]/eventMappings[0]/completeTask[1]']
    end

    test 'an object network field resolves to the network kind' do
      data = { 'rooms' => { 'a' => { 'type' => 'room_office', 'connections' => {},
                                     'objects' => [{ 'id' => 'pc', 'type' => 'pc', 'name' => 'PC', 'network' => 'lan' }] } } }
      assert_equal 'network', ref_kinds(data)['rooms/a/objects[0]/network']
    end

    test 'a value with no x-ref node yields no kind' do
      data = { 'rooms' => { 'a' => { 'type' => 'room_office', 'connections' => {} } } }
      assert_equal({}, ref_kinds(data))
    end

    test 'ref_kind is nil for FREE and nil nodes' do
      assert_nil SchemaWalk.ref_kind(ScenarioSchema::FREE)
      assert_nil SchemaWalk.ref_kind(nil)
    end
  end
end
