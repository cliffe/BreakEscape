require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Owner claim decision q78 (ACCESS_MODEL_PLAN.md section 6, claim check 10; build log
  # OWNER_CLAIM_ENFORCE_BUILD_LOG.md): POST /login with claim "owner" is refused wherever honest
  # play could never leave the owner's session open, judged from scenario data alone, and still
  # honoured wherever it could.
  class OwnerClaimEnforceTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    COFFEE = { 'caffeine' => { 'decayPerMin' => 30, 'urgentAt' => 40 } }.freeze

    def build(scenario)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance] }
      )
    end

    def claim(pc_id = 'jake_pc')
      post login_game_url(@game), params: { pc_id: pc_id, claim: 'owner',
                                            globals: { "#{pc_id}_screen_locked" => false, "#{pc_id}_owner_away" => true } }, as: :json
      response.parsed_body
    end

    # Jake with a caffeine need and attacks off (so a knock-out is no leave); the block edits
    # the data further. Nothing in the base scenario satisfies caffeine.
    def scenario(attacks: false, needs: COFFEE)
      data = AccessModelScenario.routes_scenario
      data['disableAttacks'] = true unless attacks
      jake(data).merge!('needs' => needs.deep_dup)
      yield data if block_given?
      data
    end

    def jake(data)
      data['rooms']['finance']['npcs'].find { |n| n['id'] == 'jake' }
    end

    def jake_pc(data)
      data['rooms']['finance']['objects'].find { |o| o['id'] == 'jake_pc' }
    end

    def add_object(data, room, obj)
      (data['rooms'][room]['objects'] ||= []) << obj
    end

    def coffee(fields = {})
      { 'id' => 'coffee_1', 'type' => 'notes', 'name' => 'Coffee', 'affordance' => { 'satisfies' => 'caffeine' }.merge(fields) }
    end

    def refused?(label)
      body = claim
      assert_response :unprocessable_entity, label
      assert_equal({ 'success' => false, 'message' => 'Sign in required' }, body, label)
      assert_nil @game.reload.player_state.dig('sessions', 'jake_pc'), label
    end

    def honoured?(label)
      body = claim
      assert_response :success, "#{label}: #{body.inspect}"
      assert_equal 'claim', body['via'], label
      assert_equal({ 'id' => 'jake', 'via' => 'claim' }, @game.reload.player_state.dig('sessions', 'jake_pc'), label)
    end

    # A work plan for Jake (work need, a resolved work list) with nothing that can fail: the
    # resource is not defined and the policy has no maxAttempts, so no lockout.
    def judged_work(data)
      jake(data)['needs'] = { 'work' => { 'decayPerMin' => 30, 'urgentAt' => 40 } }
      jake(data)['workNeeds'] = ['ledger']
      data['policies']['corp_default']['maxAttempts'] = nil
    end

    test 'every case where honest play never leaves the screen open is refused' do
      cases = {
        'no source for the need anywhere, attacks off' => scenario,
        'no source, attacks on but the owner is koImmune' =>
          scenario(attacks: true) { |d| jake(d)['koImmune'] = true },
        'the need is met only at the owner\'s own PC' =>
          scenario { |d| jake_pc(d)['affordance'] = { 'satisfies' => 'caffeine' } },
        'the only source is private to another owner' =>
          scenario { |d| add_object(d, 'finance', coffee('private' => true, 'owners' => ['dana'])) },
        'a judged need that cannot fail, met only at another desk' =>
          scenario do |d|
            judged_work(d)
            add_object(d, 'finance', { 'id' => 'spare_pc', 'type' => 'pc', 'name' => 'Spare', 'workstation' => true,
                                       'affordance' => { 'satisfies' => 'work' } })
          end,
        'an invalid need with a source (decayPerMin 0) beside a valid one with none' =>
          scenario(needs: COFFEE.merge('tea' => { 'decayPerMin' => 0, 'urgentAt' => 40 })) do |d|
            add_object(d, 'finance', { 'id' => 'tea_1', 'type' => 'notes', 'name' => 'Tea', 'affordance' => { 'satisfies' => 'tea' } })
          end,
        'a habit whose away threshold is negative and no lock field on the PC' =>
          scenario(attacks: true) do |d|
            jake_pc(d).delete('lockChance')
            jake(d)['screenHabit'] = { 'lockIfAwayOverSeconds' => -1 }
          end,
        # Review R1 M1: a knock-out leave has no time-away estimate, so a habit threshold never
        # opens it and a habit with no lockChance locks
        'attacks on, but a knock-out always locks (a habit threshold, no lock chance, no PC field)' =>
          scenario(attacks: true) do |d|
            jake_pc(d).delete('lockChance')
            jake(d)['screenHabit'] = { 'lockIfAwayOverSeconds' => '20' }
          end,
        'revealOutput on a printer object is no print hook' =>
          scenario { |d| add_object(d, 'finance', { 'id' => 'printer', 'type' => 'notes', 'name' => 'Printer', 'revealOutput' => ['slot_1'] }) },
        # Review R2: the cautious layer refuses only an owner with no movement source at all
        'an ink story with no patrol tag, a needs set command and an unrelated droppable item' =>
          scenario do |d|
            jake(d)['storyPath'] = 'scenarios/test_access_habits/ink/owner.json'
            jake(d)['eventMappings'] << { 'eventPattern' => 'go', 'needs' => { 'set' => { 'caffeine' => 90 } } }
            add_object(d, 'lobby', { 'id' => 'stapler', 'type' => 'notes', 'name' => 'Stapler', 'droppable' => true,
                                     'affordance' => { 'satisfies' => 'work' } })
          end
      }
      cases.each do |label, data|
        build(data)
        refused?(label)
      end
    end

    test 'every case where honest play can leave the screen open is still honoured' do
      cases = {
        'attacks on: a knock-out counts as a leave' => scenario(attacks: true),
        'a source in the owner\'s room' => scenario { |d| add_object(d, 'finance', coffee) },
        'a source in another room with no leash' => scenario { |d| add_object(d, 'lobby', coffee) },
        'a source in an allowed room' =>
          scenario { |d| jake(d)['needsRooms'] = %w[finance lobby]; add_object(d, 'lobby', coffee) },
        'a source in a private room that lists the owner' =>
          scenario { |d| d['rooms']['lobby']['needsPrivateTo'] = ['jake']; add_object(d, 'lobby', coffee) },
        'a private source the owner is listed on' =>
          scenario { |d| add_object(d, 'finance', coffee('private' => true, 'owners' => ['jake'])) },
        'a source that starts hidden or switched off (it can come on)' =>
          scenario { |d| add_object(d, 'finance', coffee('offWhen' => 'power_out').merge('revealOnGlobal' => 'shown')) },
        'a source outside every room (the start inventory)' =>
          scenario { |d| d['startItemsInInventory'] = [coffee] },
        'an office preset source with presets on' =>
          scenario do |d|
            d['officePresets'] = true
            add_object(d, 'finance', { 'id' => 'machine', 'type' => 'coffee_station', 'name' => 'Coffee machine' })
          end,
        'the owner answers colleagues\' phones (a colleague\'s phone exists)' =>
          scenario do |d|
            jake(d)['answersPhones'] = true
            add_object(d, 'finance', { 'id' => 'dana_phone', 'type' => 'notes', 'name' => 'Desk phone', 'phoneOwner' => 'dana' })
          end,
        'the owner\'s own print hook with a printHabit gives an errand' =>
          scenario do |d|
            jake_pc(d)['affordance'] = { 'satisfies' => 'caffeine' }
            jake(d)['onUse'] = { 'jake_pc' => { 'revealOutput' => ['copier'] } }
            jake(d)['printHabit'] = { 'fetchAfterSeconds' => [30, 60] }
          end,
        'a print command in the owner\'s event mappings gives an errand' =>
          scenario do |d|
            jake(d)['eventMappings'] << { 'eventPattern' => 'print_now', 'needs' => { 'print' => 'copier' } }
          end,
        'attacks on with a habit lock chance below 1: a knock-out can find the PC open' =>
          scenario(attacks: true) do |d|
            jake_pc(d).delete('lockChance')
            jake(d)['screenHabit'] = { 'lockIfAwayOverSeconds' => 20, 'lockChance' => 0.3 }
          end,
        'an interest with an item and a place for it' =>
          scenario(needs: {}) do |d|
            jake(d)['interests'] = { 'mail' => { 'weight' => 1 } }
            add_object(d, 'finance', { 'id' => 'letter', 'type' => 'notes', 'name' => 'Letter', 'needsTag' => 'mail', 'takeable' => true })
            add_object(d, 'lobby', { 'id' => 'tray', 'type' => 'notes', 'name' => 'Tray', 'affordance' => { 'accepts' => 'mail' } })
          end,
        'a judged need that can fail (a lockout policy at the own PC)' =>
          scenario { |d| judged_work(d); d['policies']['corp_default']['maxAttempts'] = 5 },
        'a judged need met at a non-desk place' =>
          scenario do |d|
            judged_work(d)
            add_object(d, 'finance', { 'id' => 'archive', 'type' => 'notes', 'name' => 'Archive', 'affordance' => { 'satisfies' => 'work' } })
          end,
        'a non-judged work need met at another desk' =>
          scenario(needs: { 'work' => { 'decayPerMin' => 30, 'urgentAt' => 40 } }) do |d|
            add_object(d, 'finance', { 'id' => 'spare_pc', 'type' => 'pc', 'name' => 'Spare', 'workstation' => true,
                                       'affordance' => { 'satisfies' => 'work' } })
          end,
        'a habit threshold written as a string, read as Number() reads it (a coffee in reach)' =>
          scenario(attacks: true) do |d|
            jake_pc(d).delete('lockChance')
            jake(d)['screenHabit'] = { 'lockIfAwayOverSeconds' => '20' }
            add_object(d, 'finance', coffee)
          end,
        # Review R3 B1: no room or leash test refuses a claim, since objects change room in play
        'a source authored in a room outside needsRooms' =>
          scenario { |d| jake(d)['needsRooms'] = ['finance']; add_object(d, 'lobby', coffee) },
        'a source authored in a room in needsAvoidRooms' =>
          scenario { |d| jake(d)['needsAvoidRooms'] = ['lobby']; add_object(d, 'lobby', coffee) },
        'a source authored in a room private to somebody else' =>
          scenario { |d| d['rooms']['lobby']['needsPrivateTo'] = ['len']; add_object(d, 'lobby', coffee) },
        'a knock-out drop: a colleague holds a source, the owner\'s knock-out always locks' =>
          scenario(attacks: true) do |d|
            jake_pc(d).delete('lockChance')
            jake(d)['screenHabit'] = { 'lockIfAwayOverSeconds' => 120 }
            jake(d)['needsRooms'] = ['finance']
            d['rooms']['lobby']['npcs'].find { |n| n['id'] == 'imran' }['itemsHeld'] = [coffee]
          end,
        'a knock-out drop: a colleague holds a source, the owner is koImmune' =>
          scenario(attacks: true) do |d|
            jake(d)['koImmune'] = true
            jake(d)['needsRooms'] = ['finance']
            d['rooms']['lobby']['npcs'].find { |n| n['id'] == 'imran' }['itemsHeld'] = [coffee]
          end,
        'a carry drop: a tagged source authored outside needsRooms' =>
          scenario do |d|
            jake(d)['needsRooms'] = ['finance']
            add_object(d, 'lobby', coffee.merge('needsTag' => 'mug', 'takeable' => true))
          end,
        'a reveal slot: a source with outputOf authored outside needsRooms' =>
          scenario do |d|
            jake(d)['needsRooms'] = ['finance']
            add_object(d, 'lobby', coffee.merge('outputOf' => 'copier'))
          end,
        'an accepting place authored outside needsRooms' =>
          scenario(needs: {}) do |d|
            jake(d)['interests'] = { 'mail' => 2 }
            jake(d)['needsRooms'] = ['finance']
            add_object(d, 'finance', { 'id' => 'letter', 'type' => 'notes', 'name' => 'Letter', 'needsTag' => 'mail', 'takeable' => true })
            add_object(d, 'lobby', { 'id' => 'tray', 'type' => 'notes', 'name' => 'Tray', 'affordance' => { 'accepts' => 'mail' } })
          end,
        # Review R3 m1: a named story the server's reader cannot find might hold a patrol tag
        'cautious: a storyPath the server cannot read' =>
          scenario { |d| jake(d)['storyPath'] = 'scenarios/no_such_scenario/ink/none.json' },
        # Review R3 n4: decayPerMin and urgentAt read as Number() reads them
        'a need written with true and a one-element array, met elsewhere' =>
          scenario(needs: { 'caffeine' => { 'decayPerMin' => true, 'urgentAt' => [40] } }) { |d| add_object(d, 'lobby', coffee) },
        # Review R2 B1: a droppable source goes wherever the player puts it
        'a droppable source authored in a room outside needsRooms' =>
          scenario do |d|
            jake(d)['needsRooms'] = ['finance']
            add_object(d, 'lobby', coffee.merge('droppable' => true, 'takeable' => true))
          end,
        'a droppable accepting place authored outside needsRooms' =>
          scenario(needs: {}) do |d|
            jake(d)['interests'] = { 'mail' => 2 }
            jake(d)['needsRooms'] = ['finance']
            add_object(d, 'finance', { 'id' => 'letter', 'type' => 'notes', 'name' => 'Letter', 'needsTag' => 'mail', 'takeable' => true })
            add_object(d, 'lobby', { 'id' => 'tray', 'type' => 'notes', 'name' => 'Tray', 'droppable' => true, 'takeable' => true,
                                     'affordance' => { 'accepts' => 'mail' } })
          end,
        # Review R2 B2: social media at the own station is a need use there, and it prints
        'a print hook on the own station used for social media' =>
          scenario(needs: { 'social_media' => { 'decayPerMin' => 30, 'urgentAt' => 40 } }) do |d|
            jake(d)['onUse'] = { 'jake_pc' => { 'revealOutput' => ['copier'] } }
            jake(d)['printHabit'] = {}
          end,
        # Review R2: the cautious layer (a movement source the mirror does not model exactly)
        'cautious: a patrol on the owner' =>
          scenario { |d| jake(d)['behavior'] = { 'patrol' => { 'waypoints' => [{ 'x' => 2, 'y' => 2 }] } } },
        'cautious: a scripted move in the owner\'s event mappings' =>
          scenario { |d| jake(d)['eventMappings'] << { 'eventPattern' => 'alarm', 'patrolOverride' => { 'targetTile' => { 'x' => 1, 'y' => 1 } } } },
        'cautious: #patrol_mode in the owner\'s ink' =>
          scenario { |d| jake(d)['storyPath'] = 'scenarios/ink/test-patrol-toggle.json' },
        'cautious: a social media need' =>
          scenario(needs: { 'social_media' => { 'decayPerMin' => 30, 'urgentAt' => 40 } }),
        'cautious: a station hook with no printHabit' =>
          scenario do |d|
            jake_pc(d)['affordance'] = { 'satisfies' => 'caffeine' }
            jake(d)['onUse'] = { 'jake_pc' => { 'revealOutput' => ['copier'] } }
          end,
        'cautious: an interest whose item has nowhere to go' =>
          scenario(needs: {}) do |d|
            jake(d)['interests'] = { 'mail' => 2 }
            add_object(d, 'finance', { 'id' => 'letter', 'type' => 'notes', 'name' => 'Letter', 'needsTag' => 'mail', 'takeable' => true })
          end,
        'cautious: the owner answers phones, but nobody else has one' =>
          scenario { |d| jake(d)['answersPhones'] = true },
        'cautious: a printHabit' =>
          scenario { |d| jake(d)['printHabit'] = { 'fetchAfterSeconds' => [30, 60] } },
        'cautious: a droppable source private to somebody else' =>
          scenario { |d| add_object(d, 'lobby', coffee('private' => true, 'owners' => ['dana']).merge('droppable' => true)) }
      }
      cases.each do |label, data|
        build(data)
        honoured?(label)
      end
    end
  end
end
