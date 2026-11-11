require 'test_helper'
require_relative '../../support/access_work_scenario'

module BreakEscape
  # Access model slice 9.2 step A-3 (ACCESS_MODEL_SLICE_9_2_PLAN.md 5.4 and 9.1): POST
  # /npc_frustration, its checks in order, the pace floors and the GET /scenario block.
  class NpcFrustrationTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include ActiveSupport::Testing::TimeHelpers

    ALL_NPCS = %w[dana kai ian amy omar temp_user].freeze

    def build(scenario: AccessWorkScenario.scenario, globals: {}, player_state: {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby office],
                        'encounteredNPCs' => ALL_NPCS.dup,
                        'globalVariables' => { 'finance_share_down' => false, 'printer_jammed' => false,
                                               'ian_pc_unplugged' => false }.merge(globals) }.merge(player_state)
      )
    end

    def set_global(name, value)
      @game.reload
      @game.player_state['globalVariables'][name] = value
      @game.save!
    end

    def report(*reports)
      post npc_frustration_game_url(@game), params: { reports: reports }, as: :json
      (response.parsed_body.is_a?(Hash) && response.parsed_body["answers"]) || flunk("#{response.status} #{response.body[0, 300]}")
    end

    def fail_r(npc, cause_id, why, object_id, need: 'work', rearmed: nil)
      r = { npc_id: npc, event: 'fail', need: need, object_id: object_id, missing: [{ id: cause_id, why: why }] }
      r[:rearmed] = rearmed unless rearmed.nil?
      r
    end

    def ease_r(npc, object_id, need: 'work')
      { npc_id: npc, event: 'ease', need: need, object_id: object_id }
    end

    def dana_down
      fail_r('dana', 'finance_share', 'down', 'dana_pc')
    end
    def omar_down(**kw)
      fail_r('omar', 'printer', 'down', 'omar_pc', **kw)
    end

    def level(npc)
      @game.reload.player_state.dig('npcFrustration', npc, 'level')
    end

    test 'an unknown NPC, an NPC not yet met and an NPC that cannot fail are refused' do
      build(globals: { 'finance_share_down' => true }, player_state: { 'encounteredNPCs' => %w[kai amy] })
      a = report(fail_r('nobody', 'finance_share', 'down', 'dana_pc'), dana_down,
                 fail_r('amy', 'email', 'down', 'amy_pc'))
      assert_equal [true, true, true], a.map { |x| x['refused'] }
      assert_nil level('dana')
    end

    test 'a stale fail writes nothing and is accepted once the server has the global' do
      build
      assert_equal({ 'npcId' => 'dana', 'stale' => true }, report(dana_down).first)
      assert_nil @game.reload.player_state.dig('npcFrustration', 'dana', 'failAt')
      set_global('finance_share_down', true)
      a = report(dana_down).first
      assert_equal 34, a['level']
      assert_equal 0, a['previous']
      assert_nil a['run']
    end

    test 'a first fail at once: a station already off when the room loads (W6)' do
      build(globals: { 'ian_pc_unplugged' => true })
      a = report(fail_r('ian', 'ian_pc', 'off', 'ian_pc')).first
      assert_equal 20, a['level']
      assert_equal 1, a['tell']
    end

    test 'a fail raises the level by perFail and stops at 100; settled there' do
      build(globals: { 'finance_share_down' => true })
      t = Time.current
      levels = (0..3).map do |i|
        travel_to(t + (i * 25)) { report(dana_down).first }
      end
      assert_equal [34, 68, 100, 100], levels.map { |a| a['level'] }
      assert_equal [false, false, true, true], levels.map { |a| a['settled'] }
    end

    test 'a second fail inside the park floor is too soon; the NPC\'s other need is counted' do
      data = AccessWorkScenario.scenario
      data['policies']['no_social'] = { 'social' => 'blocked' }
      data['rooms']['office']['objects'].find { |o| o['id'] == 'dana_pc' }['policy'] = 'no_social'
      data['rooms']['office']['objects'].find { |o| o['id'] == 'dana_pc' }['affordance']['satisfies'] = %w[work social_media]
      dana = data['rooms']['office']['npcs'].find { |n| n['id'] == 'dana' }
      dana['needs']['social_media'] = { 'decayPerMin' => 4, 'urgentAt' => 40 }
      dana['phone'] = false
      build(scenario: data, globals: { 'finance_share_down' => true })
      t = Time.current
      travel_to(t) { report(dana_down) }
      a = travel_to(t + 10) { report(dana_down, fail_r('dana', 'dana_pc', 'social_blocked', 'dana_pc', need: 'social_media')) }
      assert_equal true, a[0]['tooSoon']
      assert_equal 68, a[1]['level']
    end

    test "W4's re-arm: a down fail, an ease a use time later and a down fail after that are all accepted" do
      build(globals: { 'printer_jammed' => true })
      t = Time.current
      a = travel_to(t) { report(omar_down).first }
      set_global('printer_jammed', false)
      b = travel_to(t + 5) { report(ease_r('omar', 'omar_pc')).first }
      set_global('printer_jammed', true)
      c = travel_to(t + 10) { report(omar_down).first }
      assert_equal [20, 10, 30], [a, b, c].map { |x| x['level'] }
    end

    test 'an unplug during a met use: an ease and an off fail in one request are both accepted' do
      data = AccessWorkScenario.scenario
      data['globalVariables']['omar_pc_unplugged'] = false
      data['rooms']['office']['objects'].find { |o| o['id'] == 'omar_pc' }['affordance']['offWhen'] = 'omar_pc_unplugged'
      build(scenario: data, globals: { 'printer_jammed' => true })
      t = Time.current
      travel_to(t) { report(omar_down) }
      set_global('printer_jammed', false)
      set_global('omar_pc_unplugged', true)
      a = travel_to(t + 5) { report(ease_r('omar', 'omar_pc'), fail_r('omar', 'omar_pc', 'off', 'omar_pc')) }
      assert_equal [10, 30], a.map { |x| x['level'] }
    end

    test 'rearmed with no ease: accepted after the use floor, too soon before it' do
      build(globals: { 'printer_jammed' => true })
      t = Time.current
      travel_to(t) { report(omar_down) }
      assert travel_to(t + 1) { report(omar_down(rearmed: true)).first['tooSoon'] }
      assert_equal 40, travel_to(t + 2.5) { report(omar_down(rearmed: true)).first['level'] }
    end

    test 'a rearmed fail with a cause the server owns keeps the park floor (W5, locked_out)' do
      build(globals: { 'finance_share_down' => true })
      t = Time.current
      travel_to(t) { report(fail_r('kai', 'finance_share', 'no_access', 'kai_pc')) }
      assert travel_to(t + 5) { report(fail_r('kai', 'finance_share', 'no_access', 'kai_pc', rearmed: true)).first['tooSoon'] }
      # Kai listing only the share's down, marked rearmed, while the global is true: still the park floor
      assert travel_to(t + 6) { report(fail_r('kai', 'finance_share', 'down', 'kai_pc', rearmed: true)).first['tooSoon'] }
      assert_equal 40, travel_to(t + 25) { report(fail_r('kai', 'finance_share', 'down', 'kai_pc', rearmed: true)).first['level'] }

      build(globals: { 'finance_share_down' => true }, player_state: { 'loginLockouts' => ['dana_pc|dreyes'] })
      travel_to(t) { report(dana_down) }
      assert travel_to(t + 5) { report(fail_r('dana', 'dana_pc', 'locked_out', 'dana_pc', rearmed: true)).first['tooSoon'] }
    end

    test 'R5 n1: an owned-cause fail after an off-only fail is held to the use floor, and the next off fail to the park floor' do
      data = AccessWorkScenario.scenario
      data['globalVariables']['kai_pc_unplugged'] = false
      data['rooms']['office']['objects'].find { |o| o['id'] == 'kai_pc' }['affordance']['offWhen'] = 'kai_pc_unplugged'
      build(scenario: data)
      t = Time.current
      assert_equal 20, travel_to(t) { report(fail_r('kai', 'finance_share', 'no_access', 'kai_pc')).first['level'] }
      set_global('kai_pc_unplugged', true)
      assert_equal 40, travel_to(t + 25) { report(fail_r('kai', 'kai_pc', 'off', 'kai_pc')).first['level'] }
      set_global('kai_pc_unplugged', false)
      assert_equal 60, travel_to(t + 35) { report(fail_r('kai', 'finance_share', 'no_access', 'kai_pc', rearmed: true)).first['level'] }
      set_global('kai_pc_unplugged', true)
      assert travel_to(t + 40) { report(fail_r('kai', 'kai_pc', 'off', 'kai_pc', rearmed: true)).first['tooSoon'] }
    end

    test 'a cause or object that does not belong to the NPC is refused' do
      build(globals: { 'finance_share_down' => true, 'printer_jammed' => true, 'ian_pc_unplugged' => true })
      a = report(fail_r('dana', 'printer', 'down', 'dana_pc'),            # not in her list
                 fail_r('dana', 'ian_pc', 'off', 'dana_pc'),              # another NPC's station
                 fail_r('dana', 'finance_share', 'down', 'ian_pc'),       # another NPC's PC
                 fail_r('dana', 'finance_share', 'down', 'coffee'))       # not a place
      assert_equal [true] * 4, a.map { |x| x['refused'] }
    end

    test 'twenty rearmed fails at the own station in one request are floored by its use time' do
      build(globals: { 'printer_jammed' => true })
      a = report(*Array.new(20) { omar_down(rearmed: true) })
      assert_equal 20, a.first['level']
      assert(a.drop(1).all? { |x| x['tooSoon'] })
      assert_equal 20, level('omar')
      post npc_frustration_game_url(@game), params: { reports: Array.new(21) { omar_down } }, as: :json
      assert_response :unprocessable_entity
    end

    test 'places with no authored or preset use time: the 20 second default' do
      data = AccessWorkScenario.scenario
      data['rooms']['office']['objects'].find { |o| o['id'] == 'omar_pc' }['affordance'].delete('useSeconds')
      build(scenario: data, globals: { 'printer_jammed' => true })
      t = Time.current
      travel_to(t) { report(omar_down) }
      assert travel_to(t + 14) { report(omar_down(rearmed: true)).first['tooSoon'] }
      assert_equal 40, travel_to(t + 16) { report(omar_down(rearmed: true)).first['level'] }
    end

    test 'the park floor is 0.9 x needsDeferMin x 60 - 3, tested a second either side' do
      build(globals: { 'printer_jammed' => true })
      t = Time.current
      travel_to(t) { report(omar_down) }
      assert travel_to(t + 23) { report(omar_down).first['tooSoon'] }
      assert_equal 40, travel_to(t + 25) { report(omar_down).first['level'] }
    end

    test 'GET /scenario carries the level and a hold while the floor runs, none after' do
      build(globals: { 'printer_jammed' => true })
      t = Time.current
      travel_to(t) { report(omar_down) }
      travel_to(t + 10) do
        get scenario_game_url(@game), as: :json
        omar = response.parsed_body['npcFrustration']['omar']
        assert_equal 20, omar['level']
        assert_equal 1, omar['tell']
        assert_in_delta 14, omar['hold']['work'], 0.2
      end
      travel_to(t + 30) do
        get scenario_game_url(@game), as: :json
        refute response.parsed_body['npcFrustration']['omar'].key?('hold')
      end
    end

    test 'eases: refused for an unadmitted resource, floored, stop at 0, never run' do
      build(globals: { 'finance_share_down' => true, 'printer_jammed' => true })
      assert report(ease_r('kai', 'kai_pc')).first['refused']
      t = Time.current
      travel_to(t) { report(omar_down) }
      set_global('printer_jammed', false)
      a = travel_to(t + 5) { report(ease_r('omar', 'omar_pc'), ease_r('omar', 'omar_pc')) }
      assert_equal 10, a[0]['level']
      assert a[1]['tooSoon']
      b = travel_to(t + 10) { report(ease_r('omar', 'omar_pc')).first }
      assert_equal 0, b['level']
      c = travel_to(t + 15) { report(ease_r('omar', 'omar_pc')).first }
      assert_equal 0, c['level']
      assert_nil c['run']
      assert_equal 0, c['tell']
    end

    test 'tell: 0 at 0, 1 below the warning, 2 when one more failure reaches a workaround or 100' do
      build(globals: { 'finance_share_down' => true, 'printer_jammed' => true })
      assert_equal 2, report(dana_down).first['tell'], 'Dana: 34, a workaround at 50 is one failure away'
      t = Time.current
      tells = (0..3).map { |i| travel_to(t + (i * 25)) { report(omar_down).first['tell'] } }
      assert_equal [1, 1, 1, 2], tells, 'Omar: no workarounds, perFail 20: 20, 40, 60, 80'
    end

    test 'a reset clears it; a game whose player_state lacks the key answers as an empty one' do
      build(globals: { 'printer_jammed' => true })
      report(omar_down)
      @game.reload.reset_player_state!
      assert_equal({}, @game.reload.player_state['npcFrustration'])
      @game.player_state.delete('npcFrustration')
      @game.player_state['encounteredNPCs'] = ALL_NPCS.dup
      @game.player_state['globalVariables'] = { 'printer_jammed' => true }
      @game.save!
      get scenario_game_url(@game), as: :json
      assert_equal({}, response.parsed_body['npcFrustration'])
      assert_equal 20, report(omar_down).first['level']
    end

    test 'a door unlock records metAt for an NPC that can fail, and none for one that cannot' do
      data = AccessWorkScenario.scenario
      data['rooms']['office']['lockType'] = 'pin'
      data['rooms']['office']['requires'] = '4321'
      build(scenario: data, player_state: { 'unlockedRooms' => ['lobby'], 'encounteredNPCs' => [] })
      post unlock_game_url(@game), params: { targetType: 'door', targetId: 'office', attempt: '4321', method: 'pin' }, as: :json
      assert_response :success, response.body
      state = @game.reload.player_state['npcFrustration']
      assert state['dana']['metAt']
      refute state.key?('amy')
    end

    test 'the no-exposure test over the routes that exist: no password, workaround or resource name' do
      data = AccessWorkScenario.scenario
      data['rooms']['office']['lockType'] = 'pin'
      data['rooms']['office']['requires'] = '4321'
      build(scenario: data, globals: { 'printer_jammed' => true },
            player_state: { 'unlockedRooms' => ['lobby'], 'encounteredNPCs' => [] })
      bodies = []
      get scenario_game_url(@game), as: :json
      bodies << response.body
      post unlock_game_url(@game), params: { targetType: 'door', targetId: 'office', attempt: '4321', method: 'pin' }, as: :json
      bodies << response.body
      get room_game_url(@game, room_id: 'office'), as: :json
      bodies << response.body
      report(omar_down)
      bodies << response.body
      get scenario_game_url(@game), as: :json
      bodies << response.body
      bodies.each_with_index do |body, i|
        AccessWorkScenario::PASSWORDS.each { |pw| refute_includes body, pw, "response #{i}" }
        AccessWorkScenario::RESOURCE_NAMES.each { |name| refute_includes body, name, "response #{i}" }
        refute_includes body, AccessWorkScenario::POST_TEXT, "response #{i}"
        refute_match(/"do":\s*"borrow_session"/, body, "response #{i}")
        refute_includes body, '"workNeeds"', "response #{i}"
      end
    end
  end
end
