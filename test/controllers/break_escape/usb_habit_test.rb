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
      travel_to(t) { report(usb_fail) }
      b = travel_to(t + 6) { report({ npc_id: 'amy', event: 'ease', need: 'work', object_id: 'amy_pc' }).first }
      assert_not b['refused']
      assert_equal 10, b['level']
    end

    test 'where the policy allows USB the fail is refused and writes nothing' do
      build(scenario(usb: 'allowed'))
      assert_equal({ 'npcId' => 'amy', 'refused' => true }, report(usb_fail).first,
                   'amy cannot fail at all: her only cause needs a refusing policy')
      assert_nil state.dig('npcFrustration', 'amy')
      assert_equal false, state.dig('globalVariables', 'amy_emailed')
    end

    test 'usb_refused for social media, or naming another PC, is refused' do
      build
      a = report(usb_fail(need: 'social_media'), usb_fail(id: 'hot_desk'))
      assert(a.all? { |x| x['refused'] })
      assert_equal false, state.dig('globalVariables', 'amy_emailed')
    end
  end
end
