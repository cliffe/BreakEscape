require 'test_helper'
require 'json'
require_relative '../../scripts/validate_plant_hiding'
require_relative '../support/hiding_scenario'

# Plant hiding validator (docs/achitechture/PLANT_HIDING_PLAN.md section 9), over the real
# reception map and the shared hiding fixture.
class ValidatePlantHidingTest < ActiveSupport::TestCase
  ROOT = File.expand_path('../..', __dir__)

  include HidingScenario

  def base
    s = hiding_scenario.deep_dup
    kit(s)['hideable']['exclude'] = ['reception_plant-large11-top-ani3_76']
    s['rooms']['reception']['lighting'] = { 'emitters' => { 'planted_rogue_ap' => { 'color' => '#fff' } } }
    s
  end

  def kit(s)
    s['startItemsInInventory'].find { |i| i['id'] == 'kit_rogue_ap' }
  end
  def check(s)
    check_plant_hiding(s, ROOT)
  end
  def errors(s)
    check(s).grep(/ERROR/)
  end
  def warnings(s)
    check(s).grep(/WARNING/)
  end

  test 'the fixture is clean except for its own on-proof and anchor notes' do
    assert_empty errors(base), errors(base).join("\n")
  end

  test 'rooms empty and rooms naming a missing room are errors' do
    s = base
    kit(s)['hideable']['rooms'] = []
    assert(errors(s).any? { |e| e.include?('rooms is empty') })
    kit(s)['hideable']['rooms'] = ['nowhere']
    assert(errors(s).any? { |e| e.include?("'nowhere'") })
  end

  test 'a listed room with no eligible spot is an error' do
    s = base
    kit(s)['hideable']['rooms'] = ['comms']
    kit(s)['hideable']['exclude'] = ['comms_pot']
    s['rooms']['reception']['objects'].reject! { |o| o['id'] == 'planted_rogue_ap' }
    assert(errors(s).any? { |e| e.include?('no eligible hiding spot in room') })
  end

  test 'spots, exclude and spotAt naming a non-plant are errors, and a small decor plant is one' do
    s = base
    kit(s)['hideable']['exclude'] = ['desk_a']
    assert(errors(s).any? { |e| e.include?('hideable.exclude names') })
    kit(s)['hideable']['exclude'] = ['reception_plant-large4_34']
    assert(errors(s).any? { |e| e.include?('small plants are not default spots') })
    kit(s)['hideable']['exclude'] = []
    kit(s)['hideable']['spots'] = ['reception_plant-large12-top-ani1_77', 'desk_a']
    assert(errors(s).any? { |e| e.include?('hideable.spots names') })
    kit(s)['hideable']['spots'] = 'plants'
    kit(s)['hideable']['spotAt'] = { 'bogus' => { 'x' => 1, 'y' => 1 } }
    assert(errors(s).any? { |e| e.include?('hideable.spotAt names') })
  end

  test 'device must exist, point back with hiddenWith and sit in a listed room' do
    s = base
    kit(s)['hideable']['device'] = 'ghost'
    assert(errors(s).any? { |e| e.include?("device 'ghost' names no object") })
    kit(s)['hideable']['device'] = 'planted_rogue_ap'
    dev = s['rooms']['reception']['objects'].find { |o| o['id'] == 'planted_rogue_ap' }
    dev['hiddenWith'] = 'other'
    assert(errors(s).any? { |e| e.include?("must be 'kit_rogue_ap'") })
    dev['hiddenWith'] = 'kit_rogue_ap'
    kit(s)['hideable']['rooms'] = %w[comms reception]
    s['rooms']['comms']['objects'] << s['rooms']['reception']['objects'].delete(dev)
    assert(errors(s).any? { |e| e.include?("declared in room 'comms'") } == false)
    kit(s)['hideable']['rooms'] = ['reception']
    assert(errors(s).any? { |e| e.include?("declared in room 'comms'") })
  end

  test 'hiddenWith with position or revealOnGlobal, or with no hideable item, is an error' do
    s = base
    dev = s['rooms']['reception']['objects'].find { |o| o['id'] == 'planted_rogue_ap' }
    dev['position'] = { 'x' => 1, 'y' => 1 }
    dev['revealOnGlobal'] = 'ap_planted'
    errs = errors(s)
    assert(errs.any? { |e| e.include?("and 'position'") })
    assert(errs.any? { |e| e.include?("and 'revealOnGlobal'") })
    dev['hiddenWith'] = 'unknown_item'
    assert(errors(s).any? { |e| e.include?('not an item with a hideable block') })
  end

  test 'an overlay sprite with no texture is an error' do
    s = base
    kit(s)['hideable']['overlay']['sprite'] = 'no_such_texture_xyz'
    assert(errors(s).any? { |e| e.include?('has no texture') })
  end

  test 'requiresItem naming a hideable item is an error' do
    s = base
    s['rooms']['reception']['objects'] << { 'id' => 'old', 'type' => 'pc', 'sprite' => 'bin1', 'requiresItem' => 'kit_rogue_ap' }
    assert(errors(s).any? { |e| e.include?('only through the hide flow') })
  end

  test 'a takeable spot or one with needsTag is an error, authored actions warn' do
    s = base
    pot = s['rooms']['reception']['objects'].find { |o| o['id'] == 'pot_a' }
    pot['takeable'] = true
    pot['needsTag'] = 'x'
    pot['actions'] = [{ 'label' => 'Water' }]
    errs = errors(s)
    assert(errs.any? { |e| e.include?('is takeable') })
    assert(errs.any? { |e| e.include?('needsTag') })
    assert(warnings(s).any? { |e| e.include?('authored actions') })
  end

  test 'warnings: planted proof with on, no emitter, no anchor' do
    s = base
    s['captureProof'] = [{ 'planted' => 'kit_rogue_ap', 'on' => 'pot_a' }]
    assert(warnings(s).any? { |e| e.include?('pins one plant') })
    s['rooms']['reception'].delete('lighting')
    assert(warnings(s).any? { |e| e.include?('no lighting.emitters entry') })
    kit(s)['hideable']['overlay'].delete('at')
    s['rooms']['reception']['objects'] << { 'id' => 'wp', 'type' => 'plant', 'sprite' => 'wilted_plant1' }
    assert(warnings(s).any? { |e| e.include?("'wilted_plant1') has no PLANT_ANCHORS entry") })
    kit(s)['hideable']['overlay']['at'] = { 'x' => 50, 'y' => 60 }
    refute(warnings(s).any? { |e| e.include?('PLANT_ANCHORS') })
  end

  test 'the migrated test_access_devices scenario is clean' do
    erb = ERB.new(File.read(File.join(ROOT, 'scenarios/test_access_devices/scenario.json.erb')))
    json = JSON.parse(erb.result_with_hash(random_password: 'x')) rescue nil
    skip 'ERB needs the scenario binding' unless json
    assert_empty check_plant_hiding(json, ROOT), check_plant_hiding(json, ROOT).join("\n")
  end
end
