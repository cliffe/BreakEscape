require 'test_helper'

# Owner claim decision q78 (OWNER_CLAIM_ENFORCE_BUILD_LOG.md): OwnerClaim.leave_route, the
# first way honest play can make an owner leave the post in a way that can leave the PC open,
# or nil. The controller test (owner_claim_enforce_test.rb) proves the same cases through
# POST /login; this one checks the route labels directly.
class OwnerClaimTest < ActiveSupport::TestCase
  OC = BreakEscape::OwnerClaim
  COFFEE = { 'caffeine' => { 'decayPerMin' => 30, 'urgentAt' => 40 } }.freeze

  # Jake in his office with a caffeine need that nothing meets, attacks off. jake_pc has no
  # lock field; the block edits the data further.
  def data(attacks: false)
    d = {
      'rooms' => {
        'office' => {
          'objects' => [{ 'id' => 'jake_pc', 'type' => 'pc', 'name' => "Jake's PC", 'lockType' => 'login' }],
          'npcs' => [
            { 'id' => 'jake', 'npcType' => 'person', 'needsHome' => 'jake_pc', 'needs' => COFFEE.deep_dup },
            { 'id' => 'dana', 'npcType' => 'person' }
          ]
        },
        'lobby' => { 'objects' => [] }
      }
    }
    d['disableAttacks'] = true unless attacks
    yield d if block_given?
    d
  end

  def jake(d)
    d['rooms']['office']['npcs'][0]
  end

  def jake_pc(d)
    d['rooms']['office']['objects'][0]
  end

  def add(d, room, obj)
    d['rooms'][room]['objects'] << obj
  end

  def assert_route(want, got, label)
    want.nil? ? assert_nil(got, label) : assert_equal(want, got, label)
  end

  def route(d, pc: :jake_pc)
    OC.leave_route(d, jake(d), pc == :jake_pc ? jake_pc(d) : pc)
  end

  test 'nothing sends the owner away' do
    assert_nil route(data)
    assert OC.never_leaves?(data, jake(data), jake_pc(data))
  end

  test 'a need source elsewhere' do
    d = data { |x| add(x, 'lobby', { 'id' => 'coffee_1', 'affordance' => { 'satisfies' => 'caffeine' } }) }
    assert_equal 'need:caffeine:coffee_1', route(d)
    d = data { |x| jake_pc(x)['affordance'] = { 'satisfies' => 'caffeine' } }
    assert_nil route(d), 'the own needsHome is no leave'
  end

  # M1: a knock-out leave has no time-away estimate, so it counts only where decideLocked can
  # leave the PC open with expectedAwayMs null
  test 'a knock-out counts only where it can find the PC open' do
    {
      { 'lockChance' => 0.5 } => 'knock_out',
      { 'lockChance' => 0 } => 'knock_out',
      { 'lockChance' => 1 } => nil,
      { 'locksScreenOnLeave' => false } => 'knock_out',
      { 'locksScreenOnLeave' => true } => nil
    }.each do |fields, want|
      d = data(attacks: true) { |x| jake_pc(x).merge!(fields) }
      assert_route want, route(d), fields.inspect
    end
    {
      { 'lockIfAwayOverSeconds' => 20 } => nil,
      { 'lockIfAwayOverSeconds' => '20' } => nil,
      { 'lockIfAwayOverSeconds' => 20, 'lockChance' => 0.3 } => 'knock_out',
      { 'lockChance' => 0 } => 'knock_out',
      { 'lockChance' => 1 } => nil
    }.each do |habit, want|
      d = data(attacks: true) { |x| jake(x)['screenHabit'] = habit }
      assert_route want, route(d), habit.inspect
    end
    d = data(attacks: true) { |x| jake_pc(x)['lockChance'] = 0.5; jake(x)['koImmune'] = true }
    assert_nil route(d), 'koImmune'
    assert_equal 'knock_out', route(data(attacks: true), pc: nil), 'no PC given: the knock-out counts'
  end

  test 'a knock-out that always locks still finds a need route behind it' do
    d = data(attacks: true) do |x|
      jake(x)['screenHabit'] = { 'lockIfAwayOverSeconds' => 20 }
      add(x, 'office', { 'id' => 'coffee_1', 'affordance' => { 'satisfies' => 'caffeine' } })
    end
    assert_equal 'need:caffeine:coffee_1', route(d)
  end

  # m2: answersPhones needs a colleague's phone to answer
  test 'answersPhones counts only with a colleague\'s phone' do
    assert_nil route(data { |x| jake(x)['answersPhones'] = true })
    own = data do |x|
      jake(x)['answersPhones'] = true
      add(x, 'office', { 'id' => 'jake_phone', 'phoneOwner' => 'jake' })
    end
    assert_nil route(own), 'his own phone is no colleague\'s'
    other = data do |x|
      jake(x)['answersPhones'] = true
      add(x, 'office', { 'id' => 'dana_phone', 'phoneOwner' => 'dana' })
    end
    assert_equal 'answers_phones', route(other)
  end

  # M2: a print command gives an owned print whatever the printHabit
  test 'a print command in the owner\'s event mappings' do
    list = data { |x| jake(x)['eventMappings'] = [{ 'eventPattern' => 'go', 'needs' => { 'print' => 'copier' } }] }
    assert_equal 'prints', route(list)
    map = data { |x| jake(x)['eventMappings'] = { 'go' => { 'needs' => { 'print' => { 'producer' => ['copier'] } } } } }
    assert_equal 'prints', route(map)
    singular = data { |x| jake(x)['eventMapping'] = [{ 'eventPattern' => 'go', 'needs' => { 'print' => ['copier'] } }] }
    assert_equal 'prints', route(singular)
    empty = data { |x| jake(x)['eventMappings'] = [{ 'eventPattern' => 'go', 'needs' => { 'print' => '' } }] }
    assert_nil route(empty), 'no producer prints nothing'
    homeless = data do |x|
      jake(x).delete('needsHome')
      jake(x)['eventMappings'] = [{ 'eventPattern' => 'go', 'needs' => { 'print' => 'copier' } }]
    end
    assert_nil route(homeless), 'no needsHome object: no errand'
    other = data { |x| x['rooms']['office']['npcs'][1]['eventMappings'] = [{ 'eventPattern' => 'go', 'needs' => { 'print' => 'copier' } }] }
    assert_nil route(other), 'a command on somebody else prints as them'
  end

  # m1: a hook prints for the owner only on their own need use, and is fetched only with a printHabit
  test 'the owner\'s own print hook with a printHabit' do
    hooked = lambda do |habit: {}, chance: :none, target: 'jake_pc'|
      data do |x|
        jake_pc(x)['affordance'] = { 'satisfies' => 'caffeine' }
        hook = { 'revealOutput' => ['copier'] }
        hook['chance'] = chance unless chance == :none
        jake(x)['onUse'] = { target => hook }
        jake(x)['printHabit'] = habit unless habit.nil?
      end
    end
    assert_equal 'prints', route(hooked.call)
    assert_equal 'prints', route(hooked.call(chance: 0.4))
    assert_nil route(hooked.call(habit: nil)), 'no printHabit: the print is never fetched'
    assert_nil route(hooked.call(chance: 0)), 'a chance of 0 never prints'
    assert_nil route(hooked.call(target: 'lamp')), 'no need uses the hooked object'
    printer = data { |x| add(x, 'office', { 'id' => 'printer', 'revealOutput' => ['slot_1'] }) }
    assert_nil route(printer), 'revealOutput on a printer object is no hook'
    dana = data do |x|
      jake_pc(x)['affordance'] = { 'satisfies' => 'caffeine' }
      x['rooms']['office']['npcs'][1].merge!('onUse' => { 'jake_pc' => { 'revealOutput' => ['copier'] } }, 'printHabit' => {})
    end
    assert_nil route(dana), 'another NPC\'s hook never sends this owner anywhere'
  end

  test 'an interest needs an item and a place the leash allows' do
    base = lambda do |room|
      data do |x|
        jake(x)['needs'] = {}
        jake(x)['interests'] = { 'mail' => 2 }
        jake(x)['needsRooms'] = ['office']
        add(x, 'lobby', { 'id' => 'letter', 'needsTag' => 'mail', 'takeable' => true })
        add(x, room, { 'id' => 'tray', 'affordance' => { 'accepts' => 'mail' } })
      end
    end
    assert_equal 'interest:mail', route(base.call('office'))
    assert_nil route(base.call('lobby')), 'the accepting place is outside needsRooms'
  end
end
