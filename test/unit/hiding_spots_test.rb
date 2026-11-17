require 'test_helper'
require 'json'

# BreakEscape::HidingSpots (docs/achitechture/PLANT_HIDING_PLAN.md, sections 4, 7 and 11): the
# plant rule, spot resolution, decor_spots against the real reception map, and the proof rule.
class HidingSpotsUnitTest < ActiveSupport::TestCase
  HS = BreakEscape::HidingSpots
  ROOT = File.expand_path('../..', __dir__)

  test 'plant_key? accepts every prefix and refuses every never name' do
    %w[plant-flat-pot1 plant-large4 plant-large12-top-ani1 planter_fig1 planter-box1 fig_plant1
       office-misc-smallplant2 wilted_plant1].each { |k| assert HS.plant_key?(k), k }
    %w[plant-large-displacement1 notes_plantlog1 m10_sign_plant desk1 plantation1 bin1 ].each { |k| refute HS.plant_key?(k), k }
    refute HS.plant_key?(nil)
    refute HS.plant_key?('')
  end

  test 'spot_object? reads the authored sprite or type and honours hidingSpot' do
    assert HS.spot_object?('sprite' => 'plant-flat-pot1')
    assert HS.spot_object?('type' => 'plant-large3')
    refute HS.spot_object?('sprite' => 'desk1', 'type' => 'plant-large3'), 'the sprite wins over the type'
    assert HS.spot_object?('sprite' => 'bin1', 'hidingSpot' => true)
    refute HS.spot_object?('sprite' => 'plant-large3', 'hidingSpot' => false)
  end

  test 'a room id that is a prefix of another cannot be confused' do
    assert_equal ['reception', 'plant-large4'], HS.decor_room_and_image('reception_plant-large4_34', %w[reception reception_annex])
    assert_equal ['reception_annex', 'plant-large4'], HS.decor_room_and_image('reception_annex_plant-large4_9', %w[reception reception_annex])
    assert_nil HS.decor_room_and_image('reception_annex_plant-large4_9', %w[reception])
    assert_nil HS.decor_room_and_image('reception_plant-large4_x', %w[reception])
    assert_nil HS.decor_room_and_image('reception_notes_plantlog1_9', %w[reception])
  end

  test 'spot ids must be short and use the allowed characters' do
    assert HS.valid_spot_id?('reception_plant-large4_34')
    refute HS.valid_spot_id?('a' * 129)
    refute HS.valid_spot_id?('a b')
    refute HS.valid_spot_id?(nil)
    refute HS.valid_spot_id?(12)
  end

  def reception_map
    JSON.parse(File.read(File.join(ROOT, 'public/break_escape/assets/rooms/room_reception.json')))
  end

  test 'decor_spots on room_reception lists exactly Tiled ids 33, 34 and 76 to 79' do
    ids = HS.decor_spots(reception_map, 'reception', 'rooms' => { 'reception' => { 'objects' => [] } }).map { |s| s[:tiled_id] }
    assert_equal [76, 77, 78, 79, 33, 34].sort, ids.sort
    assert_includes HS.decor_spots(reception_map, 'reception', {}).map { |s| s[:id] }, 'reception_plant-large12-top-ani1_77'
  end

  test 'decor_spots leaves out a plant a scenario object reserves and one whose type is a start item' do
    reserved = { 'rooms' => { 'reception' => { 'objects' => [{ 'id' => 'p', 'type' => 'plant-large4' }] } } }
    # the client hands the first Tiled item of the base type (plant-large) to the scenario object
    refute_includes HS.decor_spots(reception_map, 'reception', reserved).map { |s| s[:tiled_id] }, 33
    positioned = { 'rooms' => { 'reception' => { 'objects' => [{ 'id' => 'p', 'type' => 'plant-large4', 'position' => { 'x' => 1, 'y' => 1 } }] } } }
    assert_includes HS.decor_spots(reception_map, 'reception', positioned).map { |s| s[:tiled_id] }, 33
    start = { 'startItemsInInventory' => [{ 'id' => 'x', 'type' => 'plant-large' }] }
    refute_includes HS.decor_spots(reception_map, 'reception', start).map { |s| s[:tiled_id] }, 33
    refute_includes HS.decor_spots(reception_map, 'reception', start).map { |s| s[:tiled_id] }, 34
  end

  test 'proof_satisfiable? for a hideable item: no on needs a room, on needs a spot' do
    cm = BreakEscape::CaptureModel
    kit = { 'id' => 'kit', 'hideable' => { 'rooms' => ['reception'] } }
    objs = [{ 'id' => 'pot', 'sprite' => 'plant-large1' }, { 'id' => 'desk', 'sprite' => 'desk1' }]
    assert cm.proof_satisfiable?({ 'planted' => 'kit' }, { 'kit' => kit }, objs)
    assert cm.proof_satisfiable?({ 'planted' => 'kit', 'on' => 'pot' }, { 'kit' => kit }, objs)
    assert cm.proof_satisfiable?({ 'planted' => 'kit', 'on' => 'reception_plant-large4_34' }, { 'kit' => kit }, objs)
    refute cm.proof_satisfiable?({ 'planted' => 'kit', 'on' => 'desk' }, { 'kit' => kit }, objs)
    refute cm.proof_satisfiable?({ 'planted' => 'kit', 'on' => 'comms_plant-large4_34' }, { 'kit' => kit }, objs)
    refute cm.proof_satisfiable?({ 'planted' => 'kit' }, { 'kit' => { 'id' => 'kit', 'hideable' => { 'rooms' => [] } } }, objs)
  end
end
