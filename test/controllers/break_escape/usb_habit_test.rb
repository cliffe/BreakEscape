require 'test_helper'
require_relative '../../support/access_work_scenario'

module BreakEscape
  # The USB habit (docs/achitechture/USB_HABIT_PLAN.md, user decision q39) on the real routes:
  # the plan in room data, a usb_refused fail recorded by POST /npc_frustration with its
  # workaround global, and a reactive post keyed on the cause served by POST /feed_post.
  # AccessWorkScenario's default policy sets usb storage_blocked, so every PC refuses a stick.
  class UsbHabitTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    VENT = 'IT blocked my USB stick again, so the report went by email.'.freeze

    # amy: email only on a live PC, so the habit is her only way to fail
    def scenario(usb: 'storage_blocked')
      data = AccessWorkScenario.scenario
      data['policies']['managed']['usb'] = usb
      data['globalVariables']['amy_emailed'] = false
      data['social']['osint']['sites'][0]['profiles'] << { 'person' => 'amy', 'name' => 'Amy', 'posts' => [] }
      amy = data['rooms']['office']['npcs'].find { |n| n['id'] == 'amy' }
      amy['usbHabit'] = { 'every' => 2, 'setGlobal' => 'amy_emailed' }
      amy['needs']['social_media'] = { 'decayPerMin' => 60, 'urgentAt' => 40, 'initial' => 50 }
      amy['feed'] = { 'site' => 'friendface', 'person' => 'amy', 'order' => 'reactive_first',
                      'posts' => [{ 'id' => 'amy_ordered', 'text' => 'Plant survived the weekend.' },
                                  { 'id' => 'amy_vent', 'text' => VENT, 'when' => { 'cause' => 'usb_refused', 'need' => 'work' } }] }
      data
    end

    def build(data = scenario)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => %w[dana kai ian amy omar temp_user],
                        'globalVariables' => { 'amy_emailed' => false } }
      )
    end

    def report(*reports)
      post npc_frustration_game_url(@game), params: { reports: reports }, as: :json
      response.parsed_body['answers'] || flunk("#{response.status} #{response.body[0, 300]}")
    end

    def usb_fail(need: 'work', id: 'amy_pc')
      { npc_id: 'amy', event: 'fail', need: need, object_id: 'amy_pc', missing: [{ id: id, why: 'usb_refused' }] }
    end

    # A met work use at the station: the client reports it even at level 0 (review R1 m1)
    def station_use
      { npc_id: 'amy', event: 'ease', need: 'work', object_id: 'amy_pc' }
    end

    def state
      @game.reload.player_state
    end

    test 'room data carries work.usb and withholds usbHabit' do
      build
      get room_game_url(@game, room_id: 'office'), as: :json
      assert_response :success
      amy = response.parsed_body.dig('room', 'npcs').find { |n| n['id'] == 'amy' }
      assert_equal({ 'every' => 2, 'setGlobal' => 'amy_emailed' }, amy.dig('work', 'usb'))
      assert_not amy.key?('usbHabit')
    end

    test 'a usb_refused fail is recorded with its global, then the reactive post is served' do
      build
      report(station_use)
      a = report(usb_fail).first
      assert_equal 20, a['level']
      assert_equal ['usb_refused'], state.dig('npcFrustration', 'amy', 'failWhy', 'work')
      assert_equal true, state.dig('globalVariables', 'amy_emailed')

      post feed_post_game_url(@game), params: { npc_id: 'amy' }, as: :json
      assert_equal 'amy_vent', response.parsed_body.dig('post', 'id')
      assert_equal VENT, response.parsed_body.dig('post', 'text')
    end

    test 'before any usb fail the vent is held back' do
      build
      post feed_post_game_url(@game), params: { npc_id: 'amy' }, as: :json
      assert_equal 'amy_ordered', response.parsed_body.dig('post', 'id')
      refute_includes response.body, VENT
    end

    test 'not an owned cause: an ease at the station after a usb fail is accepted' do
      build
      t = Time.current
      travel_to(t) { report(station_use, usb_fail) }
      b = travel_to(t + 6) { report(station_use).first }
      assert_not b['refused']
      assert_equal 10, b['level']
    end

    # Review R1 m1: the server counts the uses, so a refusal is accepted only on every nth
    test 'a usb fail is accepted only on a use that carries a copy, and the count is saved' do
      build
      t = Time.current
      first = travel_to(t) { report(usb_fail).first }
      assert first['refused'], 'the first use carries no copy (every 2)'
      assert_nil state.dig('npcFrustration', 'amy', 'level')

      travel_to(t + 1) { report(station_use) }
      assert_equal 1, state.dig('npcFrustration', 'amy', 'usbUses'), 'a met use at level 0 is counted and saved'
      assert_equal 0, state.dig('npcFrustration', 'amy', 'level')
      assert_equal 20, travel_to(t + 2) { report(usb_fail).first['level'] }
      assert_equal 0, state.dig('npcFrustration', 'amy', 'usbUses')

      # A forged refusal on the very next use, past the park floor: refused, nothing written
      late = t + 2 + AccessWork.park_floor(scenario['rooms']['office']['npcs'].find { |n| n['id'] == 'amy' }) + 1
      assert travel_to(late) { report(usb_fail).first['refused'] }
      assert_equal 20, state.dig('npcFrustration', 'amy', 'level')

      # The count is not sent to the client
      get scenario_game_url(@game), as: :json
      refute_includes response.body, 'usbUses'
    end

    test 'a held-back ease is not counted' do
      build
      t = Time.current
      travel_to(t) { report(station_use, usb_fail) }
      travel_to(t + 6) { report(station_use) }
      too_soon = travel_to(t + 7) { report(station_use).first }
      assert too_soon['tooSoon']
      assert_equal 1, state.dig('npcFrustration', 'amy', 'usbUses')
    end

    # Review R1 n1: amy's other place (a shared kiosk, not a desk) cannot carry her station's refusal
    test 'usb_refused with an object_id other than the station is refused' do
      data = scenario
      data['rooms']['office']['objects'] << { 'type' => 'kiosk', 'id' => 'kiosk', 'name' => 'Kiosk',
                                              'affordance' => { 'satisfies' => 'work', 'useSeconds' => 5 } }
      build(data)
      assert_includes AccessWork.places(data, data['rooms']['office']['npcs'].find { |n| n['id'] == 'amy' }, 'work'), 'kiosk'
      report(station_use)
      assert report(usb_fail.merge(object_id: 'kiosk')).first['refused']
      assert_equal 20, report(usb_fail).first['level'], 'the same refusal at the station is accepted'
    end

    test 'where the policy allows USB the fail is refused and writes nothing' do
      build(scenario(usb: 'allowed'))
      assert_equal({ 'npcId' => 'amy', 'refused' => true }, report(usb_fail).first,
                   'amy cannot fail at all: her only cause needs a refusing policy')
      assert_nil state.dig('npcFrustration', 'amy')
      assert_equal false, state.dig('globalVariables', 'amy_emailed')
    end

    # Review R1 M1: usb_refused always holds and is not owned, so `rearmed` once opened the use
    # floor for it, and a tampered client climbed 0 to 100 in about 12 s. With every 1 the use
    # count never stands in the way, so only the pace floor is under test here.
    test 'rearmed usb_refused fails inside the park floor come back tooSoon' do
      data = scenario
      data['rooms']['office']['npcs'].find { |n| n['id'] == 'amy' }['usbHabit']['every'] = 1
      build(data)
      t = Time.current
      answers = (0..4).map do |i|
        travel_to(t + (i * 3)) { report(usb_fail.merge(rearmed: true)).first }
      end
      assert_equal 20, answers.first['level']
      answers.drop(1).each { |a| assert a['tooSoon'], "expected tooSoon, got #{a.inspect}" }
      assert_equal 20, state.dig('npcFrustration', 'amy', 'level')
    end

    test 'usb_refused for social media, or naming another PC, is refused' do
      build
      a = report(usb_fail(need: 'social_media'), usb_fail(id: 'hot_desk'))
      assert(a.all? { |x| x['refused'] })
      assert_equal false, state.dig('globalVariables', 'amy_emailed')
    end
  end
end
