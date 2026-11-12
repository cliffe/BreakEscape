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

  # The precise layer alone, so a near miss there can be checked although the cautious layer
  # (might_leave) allows the same owner for another reason
  def route(d, pc: :jake_pc)
    OC.precise_route(d, jake(d), pc == :jake_pc ? jake_pc(d) : pc)
  end

  NO_STORY = ->(_path) { nil }

  # Both layers, as the server and the validator call it
  def full(d, story: NO_STORY)
    OC.leave_route(d, jake(d), jake_pc(d), story: story)
  end

  test 'nothing sends the owner away' do
    assert_nil route(data)
    assert_nil full(data)
    assert OC.never_leaves?(data, jake(data), jake_pc(data), story: NO_STORY)
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

  # R2 B1: a droppable source or accepting place goes wherever the player puts it, so the room it
  # was authored in is no leash test
  test 'a droppable source or accepting place is never leashed to its authored room' do
    leashed = lambda do |&blk|
      data do |x|
        jake(x)['needsRooms'] = ['office']
        blk.call(x)
      end
    end
    plain = leashed.call { |x| add(x, 'lobby', { 'id' => 'cup', 'affordance' => { 'satisfies' => ['caffeine'] } }) }
    assert_nil route(plain), 'a fixed source outside needsRooms is leashed'
    source = leashed.call { |x| add(x, 'lobby', { 'id' => 'cup', 'droppable' => true, 'affordance' => { 'satisfies' => ['caffeine'] } }) }
    assert_equal 'need:caffeine:cup', route(source)
    magnet = leashed.call do |x|
      add(x, 'lobby', { 'id' => 'donuts', 'droppable' => true, 'affordance' => { 'satisfies' => ['caffeine'], 'magnet' => { 'servings' => 4 } } })
    end
    assert_equal 'need:caffeine:donuts', route(magnet)
    nested = leashed.call do |x|
      add(x, 'lobby', { 'id' => 'cupboard', 'type' => 'cabinet',
                        'contents' => [{ 'id' => 'cup2', 'droppable' => true, 'affordance' => { 'satisfies' => ['caffeine'] } }] })
    end
    assert_equal 'need:caffeine:cup2', route(nested)
    tray = leashed.call do |x|
      jake(x)['needs'] = {}
      jake(x)['interests'] = { 'mail' => 2 }
      add(x, 'office', { 'id' => 'letter', 'needsTag' => 'mail' })
      add(x, 'lobby', { 'id' => 'tray', 'droppable' => true, 'affordance' => { 'accepts' => 'mail' } })
    end
    assert_equal 'interest:mail', route(tray)
  end

  # R2 B2: _socialCandidate adds social_media to the own station, and that use prints
  test 'a print hook on the own station used for social media prints' do
    social = lambda do |habit: {}|
      data do |x|
        jake(x)['needs'] = { 'social_media' => { 'decayPerMin' => 2, 'urgentAt' => 40 } }
        jake(x)['onUse'] = { 'jake_pc' => { 'revealOutput' => 'printer' } }
        jake(x)['printHabit'] = habit unless habit.nil?
        add(x, 'office', { 'id' => 'printer', 'type' => 'printer' })
      end
    end
    assert_equal 'prints', route(social.call)
    assert_nil route(social.call(habit: nil)), 'no printHabit: the print is never fetched'
    other = data do |x|
      jake(x)['needs'] = { 'social_media' => { 'decayPerMin' => 2, 'urgentAt' => 40 } }
      jake(x)['onUse'] = { 'lamp' => { 'revealOutput' => 'printer' } }
      jake(x)['printHabit'] = {}
      add(x, 'office', { 'id' => 'lamp' })
    end
    assert_nil route(other), 'social media is added to the own station only'
  end

  # R2 design: the cautious layer allows the claim wherever the owner has any movement source
  # the precise layer does not model exactly. Each fixture has no precise route.
  test 'every movement source the mirror does not model exactly allows the claim' do
    cases = {
      'patrol' => ->(x) { jake(x)['behavior'] = { 'patrol' => { 'waypoints' => [{ 'x' => 3, 'y' => 3 }] } } },
      'patrol (bounds)' => ->(x) { jake(x)['behavior'] = { 'patrol' => { 'bounds' => { 'x' => 1, 'y' => 1, 'width' => 4, 'height' => 4 } } } },
      'scripted_move' => ->(x) { jake(x)['eventMappings'] = [{ 'eventPattern' => 'alarm', 'patrolOverride' => { 'targetTile' => { 'x' => 2, 'y' => 2 } } }] },
      'scripted_move (map)' => ->(x) { jake(x)['eventMappings'] = { 'alarm' => { 'patrolOverride' => { 'targetTile' => { 'x' => 2, 'y' => 2 } } } } },
      'scripted_move (navigateToPlayer)' => ->(x) { jake(x)['eventMapping'] = [{ 'eventPattern' => 'seen', 'navigateToPlayer' => true, 'knot' => 'hi' }] },
      'ink_patrol' => ->(x) { jake(x)['storyPath'] = 'scenarios/x/ink/jake.json' },
      'ink_patrol (changeStoryPath)' => lambda { |x|
        jake(x)['storyPath'] = 'scenarios/x/ink/quiet.json'
        jake(x)['eventMappings'] = [{ 'eventPattern' => 'go', 'changeStoryPath' => 'scenarios/x/ink/jake.json' }]
      },
      'social_media' => ->(x) { jake(x)['needs'] = { 'social_media' => { 'decayPerMin' => 2, 'urgentAt' => 40 } } },
      'station_hook' => ->(x) { jake(x)['onUse'] = { 'jake_pc' => { 'revealOutput' => 'printer' } } },
      'interest' => ->(x) { jake(x)['interests'] = { 'mail' => 2 } },
      'phones' => ->(x) { jake(x)['answersPhones'] = true },
      'prints' => ->(x) { jake(x)['printHabit'] = { 'fetchAfterSeconds' => [10, 20] } },
      'prints (command, no needsHome)' => lambda { |x|
        jake(x).delete('needsHome')
        jake(x)['eventMappings'] = [{ 'eventPattern' => 'go', 'needs' => { 'print' => 'copier' } }]
      },
      'droppable' => lambda { |x|
        jake(x)['needsRooms'] = ['office']
        add(x, 'lobby', { 'id' => 'cup', 'droppable' => true, 'affordance' => { 'satisfies' => ['caffeine'], 'private' => true, 'owners' => ['dana'] } })
      }
    }
    story = ->(path) { path.end_with?('jake.json') ? '["#","^patrol_mode:on","/#"]' : '["^Hello."]' }
    cases.each do |name, edit|
      d = data { |x| edit.call(x) }
      assert_nil route(d), "#{name}: no precise route in the fixture"
      want = "might:#{name.split(' ').first}"
      assert_equal want, full(d, story: story), name
      refute OC.never_leaves?(d, jake(d), jake_pc(d), story: story), name
    end
  end

  test 'the cautious layer still refuses an owner with no movement source' do
    quiet = data do |x|
      jake(x)['storyPath'] = 'scenarios/x/ink/quiet.json'
      jake(x)['behavior'] = { 'facePlayer' => true }
      jake(x)['eventMappings'] = [{ 'eventPattern' => 'go', 'knot' => 'hello', 'needs' => { 'set' => { 'caffeine' => 90 } } }]
      add(x, 'lobby', { 'id' => 'cup', 'droppable' => true, 'affordance' => { 'satisfies' => ['work'] } })
    end
    assert_nil full(quiet, story: ->(_p) { '["^Hello."]' }), 'an ink story with no patrol tag, a set command, an unrelated droppable'
    assert_nil full(quiet, story: ->(_p) { nil }), 'an unreadable story moves nobody'
  end

  test 'the default story reader stays inside scenarios' do
    assert_nil OC.default_story_text('config/database.yml')
    assert_nil OC.default_story_text('../../etc/passwd.json')
    assert_nil OC.default_story_text('scenarios/no_such/ink/none.json')
    text = OC.default_story_text('scenarios/test_access_habits/ink/owner.json')
    assert text.is_a?(String) && !text.include?('patrol_mode'), 'Noor\'s story is read and has no patrol tag'
  end
end
