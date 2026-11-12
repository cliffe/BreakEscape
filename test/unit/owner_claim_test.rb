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

  test 'an interest needs an item and a place, in any room' do
    base = lambda do |room, item: true, place: true|
      data do |x|
        jake(x)['needs'] = {}
        jake(x)['interests'] = { 'mail' => 2 }
        jake(x)['needsRooms'] = ['office']
        add(x, 'lobby', { 'id' => 'letter', 'needsTag' => 'mail', 'takeable' => true }) if item
        add(x, room, { 'id' => 'tray', 'affordance' => { 'accepts' => 'mail' } }) if place
      end
    end
    assert_equal 'interest:mail', route(base.call('office'))
    assert_equal 'interest:mail', route(base.call('lobby')), 'R3: an accepting place outside needsRooms counts'
    assert_nil route(base.call('office', item: false)), 'no item with the tag'
    assert_nil route(base.call('office', place: false)), 'nowhere accepts the tag'
  end

  # R2 B1 and R3 B1: objects change room in play (the player's drop, a knock-out drop, a carry
  # put down, a reveal slot), so no room or leash test refuses a source or an accepting place
  test 'no room or leash test refuses a source or accepting place' do
    leashed = lambda do |&blk|
      data do |x|
        jake(x)['needsRooms'] = ['office']
        blk.call(x)
      end
    end
    plain = leashed.call { |x| add(x, 'lobby', { 'id' => 'cup', 'affordance' => { 'satisfies' => ['caffeine'] } }) }
    assert_equal 'need:caffeine:cup', route(plain), 'a fixed source outside needsRooms'
    avoid = data do |x|
      jake(x)['needsAvoidRooms'] = ['lobby']
      add(x, 'lobby', { 'id' => 'cup', 'affordance' => { 'satisfies' => ['caffeine'] } })
    end
    assert_equal 'need:caffeine:cup', route(avoid), 'a source in a room the owner avoids'
    priv = data do |x|
      x['rooms']['lobby']['needsPrivateTo'] = ['dana']
      add(x, 'lobby', { 'id' => 'cup', 'affordance' => { 'satisfies' => ['caffeine'] } })
    end
    assert_equal 'need:caffeine:cup', route(priv), 'a source in a room private to somebody else'
    owned = leashed.call { |x| add(x, 'office', { 'id' => 'cup', 'affordance' => { 'satisfies' => ['caffeine'], 'private' => true, 'owners' => ['dana'] } }) }
    assert_nil route(owned), 'a private affordance still serves only its owners'
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

  # R3 B1: the engine paths that put a source in a room other than its authored one, none of
  # which needs droppable. Jake is leashed to the office; the source starts in the lobby.
  test 'a held, carried or revealed source in another room allows the claim' do
    coffee = { 'id' => 'b_coffee', 'type' => 'coffee_cup', 'affordance' => { 'satisfies' => ['caffeine'], 'restores' => 40 } }
    held = lambda do |owner_extra, item|
      data(attacks: true) do |x|
        jake(x).merge!('needsRooms' => ['office']).merge!(owner_extra)
        x['rooms']['lobby']['npcs'] = [{ 'id' => 'bo', 'npcType' => 'person', 'itemsHeld' => [item] }]
      end
    end
    # npc-hostile.js dropNPCItems: the colleague is knocked out in the office and drops it there.
    # The owner's habit means a knock-out of the owner always locks, so this is the only route.
    habit = held.call({ 'screenHabit' => { 'lockIfAwayOverSeconds' => 120 } }, coffee)
    assert_equal 'need:caffeine:b_coffee', route(habit), 'knock-out drop, the owner\'s knock-out always locks'
    assert OC.scenario_objects(habit).find { |e| e[:obj]['id'] == 'b_coffee' }[:held], 'an itemsHeld entry is held'
    ko_immune = held.call({ 'koImmune' => true }, coffee)
    assert_equal 'need:caffeine:b_coffee', route(ko_immune), 'knock-out drop, the owner koImmune'
    # npc-needs.js dropHeld: a tagged source a colleague carries is put down where they stand
    tagged = data do |x|
      jake(x)['needsRooms'] = ['office']
      add(x, 'lobby', coffee.merge('id' => 'k_coffee', 'needsTag' => 'mug', 'takeable' => true))
    end
    assert_equal 'need:caffeine:k_coffee', route(tagged), 'carry drop'
    # npc-needs.js placeHeld: a reveal slot is set down at an accepting place
    slot = data do |x|
      jake(x)['needsRooms'] = ['office']
      add(x, 'lobby', coffee.merge('id' => 'slot_1', 'outputOf' => 'copier'))
    end
    assert_equal 'need:caffeine:slot_1', route(slot), 'slot placement'
    # Every one of them allows through POST /login's own entry point too
    [habit, ko_immune, tagged, slot].each { |d| refute OC.never_leaves?(d, jake(d), jake_pc(d), story: NO_STORY) }
    # The NPC record itself is not held; what it carries is
    refute OC.scenario_objects(habit).find { |e| e[:obj]['id'] == 'bo' }[:held]
    refute OC.scenario_objects(habit).find { |e| e[:obj]['id'] == 'jake_pc' }[:held]
  end

  # R3 n4: normaliseNeed and normaliseInterest read their numbers with Number()
  test 'need and interest numbers are read as Number() reads them' do
    assert OC.valid_need?({ 'decayPerMin' => true, 'urgentAt' => [40] })
    assert OC.valid_need?({ 'decayPerMin' => '2.5', 'urgentAt' => [[40]] })
    refute OC.valid_need?({ 'decayPerMin' => [1, 2], 'urgentAt' => 40 }), 'Number([1, 2]) is NaN'
    refute OC.valid_need?({ 'decayPerMin' => [true], 'urgentAt' => 40 }), 'Number([true]) is NaN'
    refute OC.valid_need?({ 'decayPerMin' => [], 'urgentAt' => 40 }), 'Number([]) is 0'
    refute OC.valid_need?({ 'decayPerMin' => false, 'urgentAt' => 40 })
    assert OC.valid_interest?({ 'weight' => true })
    refute OC.valid_interest?('2'), 'a string interest is not a number to normaliseInterest'
    npc = { 'needs' => { 'coffee' => { 'decayPerMin' => true, 'urgentAt' => [40] } } }
    assert BreakEscape::AccessIdentities.needs_tracked?(npc)
    assert BreakEscape::Game.needs_tracked?(npc)
    refute BreakEscape::Game.needs_tracked?({ 'interests' => { 'gossip' => '2' } })
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
      'movable (droppable)' => lambda { |x|
        add(x, 'lobby', { 'id' => 'cup', 'droppable' => true, 'affordance' => { 'satisfies' => ['caffeine'], 'private' => true, 'owners' => ['dana'] } })
      },
      'movable (held by an NPC)' => lambda { |x|
        x['rooms']['office']['npcs'][1]['itemsHeld'] = [{ 'id' => 'cup', 'affordance' => { 'satisfies' => ['caffeine'], 'private' => true, 'owners' => ['dana'] } }]
      },
      'movable (needsTag)' => lambda { |x|
        add(x, 'lobby', { 'id' => 'cup', 'needsTag' => 'mug', 'affordance' => { 'satisfies' => ['caffeine'], 'private' => true, 'owners' => ['dana'] } })
      },
      'movable (outputOf)' => lambda { |x|
        add(x, 'lobby', { 'id' => 'cup', 'outputOf' => 'copier', 'affordance' => { 'satisfies' => ['caffeine'], 'private' => true, 'owners' => ['dana'] } })
      },
      'story_unread' => ->(x) { jake(x)['storyPath'] = 'scenarios/x/ink/missing.json' }
    }
    story = lambda do |path|
      next nil if path.end_with?('missing.json')

      path.end_with?('jake.json') ? '["#","^patrol_mode:on","/#"]' : '["^Hello."]'
    end
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
    # R3 m1: a story that is named but cannot be read might hold a patrol tag
    assert_equal 'might:story_unread', full(quiet, story: ->(_p) { nil }), 'an unreadable story allows'
    unnamed = data { |x| jake(x)['behavior'] = { 'facePlayer' => true } }
    assert_nil full(unnamed, story: ->(_p) { nil }), 'no storyPath: nothing to read'
  end

  test 'the default story reader stays inside scenarios' do
    assert_nil OC.default_story_text('config/database.yml')
    assert_nil OC.default_story_text('../../etc/passwd.json')
    assert_nil OC.default_story_text('scenarios/no_such/ink/none.json')
    text = OC.default_story_text('scenarios/test_access_habits/ink/owner.json')
    assert text.is_a?(String) && !text.include?('patrol_mode'), 'Noor\'s story is read and has no patrol tag'
  end

  # R3 n2: the validator's reader tries every spelling InkStoryFile.compiled_json tries
  test 'the default story reader finds a story under the other JSON spelling' do
    dir = File.join(OC::STORY_ROOT, 'scenarios', "owner_claim_spelling_#{Process.pid}")
    FileUtils.mkdir_p(dir)
    File.write(File.join(dir, 'a.ink.json'), '["#","^patrol_mode:on","/#"]')
    File.write(File.join(dir, 'b.json'), '["#","^patrol_mode:off","/#"]')
    rel = "scenarios/#{File.basename(dir)}"
    assert_includes OC.default_story_text("#{rel}/a.json").to_s, 'patrol_mode:on', 'a.json names a.ink.json'
    assert_includes OC.default_story_text("#{rel}/b.ink.json").to_s, 'patrol_mode:off', 'b.ink.json names b.json'
    assert_nil OC.default_story_text("#{rel}/c.json")
  ensure
    FileUtils.rm_rf(dir) if dir
  end
end
