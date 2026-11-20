require 'test_helper'
require 'json'

# BreakEscape::HidingSpots (docs/achitechture/PLANT_HIDING_PLAN.md, sections 4, 7 and 11): the
# plant rule, spot resolution, decor_spots against the real reception map, and the proof rule.
class HidingSpotsUnitTest < ActiveSupport::TestCase
  HS = BreakEscape::HidingSpots
  ROOT = File.expand_path('../..', __dir__)

  test 'plant_key? accepts every prefix and refuses every never name' do
    %w[plant-large11 plant-large12-top-ani1 plant-large13 planter_fig1 planter-box1 fig_plant1
       wilted_plant1].each { |k| assert HS.plant_key?(k), k }
    %w[plant-large-displacement1 notes_plantlog1 m10_sign_plant desk1 plantation1 bin1 ].each { |k| refute HS.plant_key?(k), k }
    refute HS.plant_key?(nil)
    refute HS.plant_key?('')
  end

  # Integrator decision 2026-11-17: the 12x10 tucked device covers small plants, so they are not
  # hiding spots by default. Follow-up: a smaller overlay for them.
  test 'small plants are not default hiding spots, but hidingSpot true opts one in' do
    %w[plant-flat-pot1 plant-flat-pot7 office-misc-smallplant office-misc-smallplant5
       plant-large1 plant-large2 plant-large4 plant-large6 plant-large9 plant-large10].each do |k|
      refute HS.plant_key?(k), k
      assert HS.plant_family_key?(k), k
      refute HS.spot_object?('sprite' => k), k
      assert HS.spot_object?('sprite' => k, 'hidingSpot' => true), k
      assert_nil HS.decor_room_and_image("reception_#{k}_5", %w[reception]), k
    end
    # 11 and up are large (the digit lookahead stops plant-large1 matching plant-large11)
    %w[plant-large11 plant-large12-top-ani1 plant-large13].each { |k| assert HS.plant_key?(k), k }
  end

  test 'the plant lists match the JS lists in systems/plant-hiding.js' do
    src = File.read(File.join(ROOT, 'public/break_escape/js/systems/plant-hiding.js'))
    list = lambda do |name|
      body = src[/export const #{name} = \[(.*?)\];/m, 1]
      refute_nil body, "#{name} not found in plant-hiding.js"
      body.scan(/'([^']+)'/).flatten
    end
    js_small = src[%r{export const SMALL_PLANT = /\^(.*)/;}, 1]
    refute_nil js_small, 'SMALL_PLANT not found in plant-hiding.js'
    assert_equal HS::SMALL_PLANT.source.sub('\\A', ''), js_small
    assert_equal HS::PLANT_PREFIXES, list.call('PLANT_PREFIXES')
    assert_equal HS::PLANT_NEVER, list.call('PLANT_NEVER')
  end

  test 'spot_object? reads the authored sprite or type and honours hidingSpot' do
    assert HS.spot_object?('sprite' => 'planter_fig1')
    assert HS.spot_object?('type' => 'plant-large13')
    refute HS.spot_object?('sprite' => 'desk1', 'type' => 'plant-large13'), 'the sprite wins over the type'
    assert HS.spot_object?('sprite' => 'bin1', 'hidingSpot' => true)
    refute HS.spot_object?('sprite' => 'plant-large13', 'hidingSpot' => false)
  end

  test 'a room id that is a prefix of another cannot be confused' do
    assert_equal ['reception', 'plant-large13'], HS.decor_room_and_image('reception_plant-large13_34', %w[reception reception_annex])
    assert_equal ['reception_annex', 'plant-large13'], HS.decor_room_and_image('reception_annex_plant-large13_9', %w[reception reception_annex])
    assert_nil HS.decor_room_and_image('reception_annex_plant-large13_9', %w[reception])
    assert_nil HS.decor_room_and_image('reception_plant-large13_x', %w[reception])
    assert_nil HS.decor_room_and_image('reception_notes_plantlog1_9', %w[reception])
  end

  test 'spot ids must be short and use the allowed characters' do
    assert HS.valid_spot_id?('reception_plant-large13_34')
    refute HS.valid_spot_id?('a' * 129)
    refute HS.valid_spot_id?('a b')
    refute HS.valid_spot_id?(nil)
    refute HS.valid_spot_id?(12)
  end

  def reception_map
    JSON.parse(File.read(File.join(ROOT, 'public/break_escape/assets/rooms/room_reception.json')))
  end

  test 'decor_spots on room_reception lists exactly Tiled ids 76 to 79 (33 and 34 are small plants)' do
    ids = HS.decor_spots(reception_map, 'reception', 'rooms' => { 'reception' => { 'objects' => [] } }).map { |s| s[:tiled_id] }
    assert_equal [76, 77, 78, 79], ids.sort
    assert_includes HS.decor_spots(reception_map, 'reception', {}).map { |s| s[:id] }, 'reception_plant-large12-top-ani1_77'
  end

  test 'decor_spots leaves out a plant a scenario object reserves and one whose type is a start item' do
    ids = ->(sc) { HS.decor_spots(reception_map, 'reception', sc).map { |s| s[:tiled_id] } }
    # The client hands the first Tiled item of the base type to a scenario object with no position.
    reserved = { 'rooms' => { 'reception' => { 'objects' => [{ 'id' => 'p', 'type' => 'plant-large12-top-ani1' }] } } }
    assert_equal 3, ids.call(reserved).length
    positioned = { 'rooms' => { 'reception' => { 'objects' => [{ 'id' => 'p', 'type' => 'plant-large12-top-ani1', 'position' => { 'x' => 1, 'y' => 1 } }] } } }
    assert_equal [76, 77, 78, 79], ids.call(positioned).sort
    # A reservation by a small type is taken from the whole plant-large family (small plants
    # included) and leaves the large animated plants alone.
    small_reserved = { 'rooms' => { 'reception' => { 'objects' => [{ 'id' => 'p', 'type' => 'plant-large4' }] } } }
    assert_equal [76, 77, 78, 79], ids.call(small_reserved).sort
    start = { 'startItemsInInventory' => [{ 'id' => 'x', 'type' => 'plant-large12-top-ani' }] }
    assert_equal [76, 79], ids.call(start).sort
  end

  test 'proof_satisfiable? for a hideable item: no on needs a room, on needs a spot' do
    cm = BreakEscape::CaptureModel
    kit = { 'id' => 'kit', 'hideable' => { 'rooms' => ['reception'] } }
    objs = [{ 'id' => 'pot', 'sprite' => 'plant-large13' }, { 'id' => 'desk', 'sprite' => 'desk1' }]
    assert cm.proof_satisfiable?({ 'planted' => 'kit' }, { 'kit' => kit }, objs)
    assert cm.proof_satisfiable?({ 'planted' => 'kit', 'on' => 'pot' }, { 'kit' => kit }, objs)
    assert cm.proof_satisfiable?({ 'planted' => 'kit', 'on' => 'reception_plant-large13_34' }, { 'kit' => kit }, objs)
    refute cm.proof_satisfiable?({ 'planted' => 'kit', 'on' => 'desk' }, { 'kit' => kit }, objs)
    refute cm.proof_satisfiable?({ 'planted' => 'kit', 'on' => 'comms_plant-large4_34' }, { 'kit' => kit }, objs)
    refute cm.proof_satisfiable?({ 'planted' => 'kit' }, { 'kit' => { 'id' => 'kit', 'hideable' => { 'rooms' => [] } } }, objs)
  end

  test 'proof_satisfiable? with the scenario decides `on` through resolve_spot: rooms, exclude and spots' do
    cm = BreakEscape::CaptureModel
    scenario = { 'rooms' => {
      'reception' => { 'objects' => [{ 'id' => 'pot', 'sprite' => 'plant-large13' }, { 'id' => 'pot_x', 'sprite' => 'plant-large11' }] },
      'comms' => { 'objects' => [{ 'id' => 'comms_pot', 'sprite' => 'plant-large12' }] }
    } }
    objs = cm.top_level_room_objects(scenario)
    proof = ->(on) { { 'planted' => 'kit', 'on' => on } }
    sat = ->(hideable, on) { cm.proof_satisfiable?(proof.call(on), { 'kit' => { 'id' => 'kit', 'hideable' => hideable } }, objs, scenario: scenario) }
    assert sat.call({ 'rooms' => ['reception'] }, 'pot')
    refute sat.call({ 'rooms' => ['reception'] }, 'comms_pot'), 'a plant in a room the item may not be hidden in'
    refute sat.call({ 'rooms' => ['reception'], 'exclude' => ['pot_x'] }, 'pot_x')
    assert sat.call({ 'rooms' => ['reception'], 'exclude' => ['pot_x'] }, 'pot')
    refute sat.call({ 'rooms' => ['reception'], 'spots' => ['pot'] }, 'pot_x')
    assert sat.call({ 'rooms' => ['reception'], 'spots' => ['pot'] }, 'pot')
  end
end
