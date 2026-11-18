require 'test_helper'
require_relative '../../support/fake_hacktivity_vm'

module BreakEscape
  # D144: what a game does with its VM set, by set state and by endpoint. Hacktivity mode is
  # faked (FakeHacktivityVm); standalone mode is the dummy app as it is.
  class VmSetGateTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    FLAG = 'flag{one}'.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
      @other   = break_escape_demo_users(:other_user)
      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_hacker_hood_v2'
        pref.in_game_name    = 'TestAgent'
      end
      @game = make_game(@owner)
      # Hacktivity scores a flag through this callback; record every call.
      @cb_calls = []
      @saved_callback = BreakEscape.configuration.on_flag_submit
      BreakEscape.configuration.on_flag_submit = ->(_game, key, _vm) { @cb_calls << key }
    end

    teardown do
      BreakEscape.configuration.on_flag_submit = @saved_callback
      FakeHacktivityVm.uninstall!
      @owner.update!(role: 'user')
    end

    def make_game(player, vm_set_id: 11, status: 'in_progress')
      state = { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'], 'unlockedObjects' => [], 'inventory' => [],
                'encounteredNPCs' => [], 'globalVariables' => {}, 'health' => 100,
                'standalone_flags' => [FLAG], 'submitted_flags' => [], 'vm_ips' => { 'kali' => '10.0.0.5' } }
      state['vm_set_id'] = vm_set_id if vm_set_id
      scenario = {
        'startRoom' => 'lobby',
        'flags' => { 'target_vm' => { 'flag_1' => FLAG } },
        'rooms' => { 'lobby' => { 'type' => 'room_reception', 'connections' => {}, 'locked' => false,
                                  'objects' => [{ 'id' => 'cache', 'type' => 'safe', 'name' => 'Cache', 'locked' => true,
                                                  'lockType' => 'flag', 'requires' => 'target_vm:flag_1' }] } }
      }
      Game.create!(mission: @mission, player: player, scenario_data: scenario, player_state: state, status: status)
    end

    def fake_set(**opts)
      s = FakeHacktivityVm::FakeSet.new(id: 11, user_id: @owner.id, **opts)
      s.vms = FakeHacktivityVm::FlagVms.new([FakeHacktivityVm::FlagVm.new([FLAG], 'kali')])
      s.define_singleton_method(:user) { nil }
      s
    end

    def install(set, solved: false)
      FakeHacktivityVm.install!(sets: [set], solved: solved)
    end

    def config_value(key)
      response.body[/#{key}: '([^']*)'/, 1]
    end

    # ---- POST /flags ----------------------------------------------------------------

    test 'flags: a released set refuses a new flag with 422 and the reason, and scores nothing' do
      install(fake_set(relinquished: true))
      post flags_game_url(@game), params: { flag: FLAG }, as: :json
      assert_response :unprocessable_entity
      body = JSON.parse(response.body)
      assert_equal 'vm_released', body['reason']
      assert_equal Game::VM_RELEASED_MESSAGE, body['message']
      assert_empty FakeHacktivityVm.scored
      assert_empty @cb_calls, 'on_flag_submit not called'
      assert_empty @game.reload.player_state['submitted_flags']
    end

    test 'flags: only the flag solved before release is accepted; another is refused (per set and flag)' do
      other_flag = 'flag{two}'
      @game.player_state['standalone_flags'] = [FLAG, other_flag]
      @game.save!
      s = fake_set(relinquished: true)
      s.vms = FakeHacktivityVm::FlagVms.new([FakeHacktivityVm::FlagVm.new([FLAG, other_flag], 'kali')])
      install(s, solved: [[11, FLAG]])

      post flags_game_url(@game), params: { flag: other_flag }, as: :json
      assert_response :unprocessable_entity
      assert_equal 'vm_released', JSON.parse(response.body)['reason']

      post flags_game_url(@game), params: { flag: FLAG }, as: :json
      assert_response :success
      assert_empty @cb_calls
      assert_empty FakeHacktivityVm.scored
    end

    test 'flags: a flag solved on a different set does not count' do
      install(fake_set(relinquished: true), solved: [[99, FLAG]])
      post flags_game_url(@game), params: { flag: FLAG }, as: :json
      assert_response :unprocessable_entity
      assert_empty @cb_calls
    end

    test 'unlock: solving flag A does not open a lock that wants flag B' do
      install(fake_set(relinquished: true), solved: [[11, 'flag{other}']])
      unlock_cache
      assert_response :unprocessable_entity
      assert_not @game.reload.object_unlocked?('cache')
    end

    test 'flags: a released set takes a flag already solved on it, with no new score' do
      install(fake_set(relinquished: true), solved: true)
      post flags_game_url(@game), params: { flag: FLAG }, as: :json
      assert_response :success
      assert_equal true, JSON.parse(response.body)['success']
      assert_empty FakeHacktivityVm.scored, 'no host scoring call'
      assert_includes @game.reload.player_state['submitted_flags'], FLAG
      assert_empty @cb_calls, 'on_flag_submit not called'
    end

    test 'flags: a live set scores as today' do
      install(fake_set)
      post flags_game_url(@game), params: { flag: FLAG }, as: :json
      assert_response :success
      assert_includes FakeHacktivityVm.scored, FLAG
      assert_equal [FLAG], @cb_calls, 'live: on_flag_submit is the host scoring route'
    end

    test 'flags: standalone / no VM set behaves as today' do
      standalone = make_game(@owner, vm_set_id: nil)
      post flags_game_url(standalone), params: { flag: FLAG }, as: :json
      assert_response :success
      assert_includes standalone.reload.player_state['submitted_flags'], FLAG
    end

    test 'flags: a VM-free game in Hacktivity mode behaves as today' do
      install(fake_set(relinquished: true))
      vm_free = make_game(@owner, vm_set_id: nil)
      post flags_game_url(vm_free), params: { flag: FLAG }, as: :json
      assert_response :success
      assert_empty FakeHacktivityVm.scored
    end

    test "flags: another player's game is refused before any state check" do
      install(fake_set(relinquished: true))
      theirs = make_game(@other)
      post flags_game_url(theirs), params: { flag: FLAG }, as: :json
      assert_response :forbidden
    end

    # ---- POST /unlock (flag lock) ----------------------------------------------------

    def unlock_cache
      post unlock_game_url(@game), params: { targetType: 'object', targetId: 'cache', attempt: FLAG, method: 'flag' },
                                   as: :json
    end

    test 'unlock: a released set will not open a flag-lock with a new flag' do
      install(fake_set(relinquished: true))
      unlock_cache
      assert_response :unprocessable_entity
      assert_equal 'vm_released', JSON.parse(response.body)['reason']
      assert_not @game.reload.object_unlocked?('cache')
      assert_empty FakeHacktivityVm.scored
    end

    test 'unlock: a released set opens it for a flag already solved there, with no new score' do
      install(fake_set(relinquished: true), solved: true)
      unlock_cache
      assert_response :success
      assert @game.reload.object_unlocked?('cache')
      assert_empty FakeHacktivityVm.scored
    end

    test 'unlock: a live set opens it and scores' do
      install(fake_set)
      unlock_cache
      assert_response :success
      assert @game.reload.object_unlocked?('cache')
      assert_includes FakeHacktivityVm.scored, FLAG
    end

    test 'unlock: standalone opens it as today' do
      standalone = make_game(@owner, vm_set_id: nil)
      post unlock_game_url(standalone), params: { targetType: 'object', targetId: 'cache', attempt: FLAG, method: 'flag' },
                                        as: :json
      assert_response :success
      assert standalone.reload.object_unlocked?('cache')
    end

    # ---- vm_panel / unlock_vm_console / vm_set_panel ---------------------------------

    test 'vm_panel: a live set redirects to the host VM page; a released one is 404' do
      install(fake_set)
      get vm_panel_game_url(@game), params: { vm_title: 'kali' }
      assert_response :redirect
      assert_match(%r{/fake/events/7/batches/5/vm_sets/11/vms/kali}, response.location)

      install(fake_set(relinquished: true))
      get vm_panel_game_url(@game), params: { vm_title: 'kali' }
      assert_response :not_found
    end

    test 'vm_panel: a live set still needs an in_progress game (q2: no wider console access)' do
      install(fake_set)
      @game.update!(status: 'abandoned')
      get vm_panel_game_url(@game), params: { vm_title: 'kali' }
      assert_response :redirect, 'the policy refuses an abandoned game before the state check'
      assert_no_match(/fake/, response.location)
    end

    test 'unlock_vm_console: live answers ok, released 404, standalone 404' do
      set = fake_set
      install(set)
      post unlock_vm_console_game_url(@game), params: { vm_title: 'kali' }
      assert_response :success
      assert_equal 1, set.vms.first.console_calls

      released = fake_set(relinquished: true)
      install(released)
      post unlock_vm_console_game_url(@game), params: { vm_title: 'kali' }
      assert_response :not_found
      assert_equal 0, released.vms.first.console_calls, 'a released set is never touched'

      FakeHacktivityVm.uninstall!
      post unlock_vm_console_game_url(@game), params: { vm_title: 'kali' }
      assert_response :not_found
    end

    test 'vm_set_panel: live redirects, released 404' do
      install(fake_set)
      get vm_set_panel_game_url(@game)
      assert_response :redirect
      assert_match(%r{/fake/events/7/batches/5/vm_sets/11}, response.location)

      install(fake_set(relinquished: true))
      get vm_set_panel_game_url(@game)
      assert_response :not_found
    end

    test "vm_set_panel: another student's game id is refused, and no set ids leak" do
      install(fake_set)
      theirs = make_game(@other)
      get vm_set_panel_game_url(theirs)
      assert_response :redirect
      assert_no_match(/fake|vm_sets/, response.location.to_s)
      assert_equal 'You are not authorized to perform this action.', flash[:alert]
    end

    test 'vm_set_panel: an admin may follow another student game to their live set' do
      install(fake_set)
      theirs = make_game(@other)
      # The demo current player is test_user; make it an admin for this request
      @owner.update!(role: 'admin')
      get vm_set_panel_game_url(theirs)
      # The set is held by @owner in the fake, not by the other student, so the state is
      # released for that game and the answer is 404: the admin is let in by the policy
      # (not redirected to root) but the gate still refuses a set nobody holds.
      assert_response :not_found
    end

    test 'vm_set_panel: an account manager is treated like the policy says (managing staff are let in)' do
      install(fake_set)
      theirs = make_game(@other)
      @owner.update!(role: 'account_manager')
      get vm_set_panel_game_url(theirs)
      assert_response :not_found
    end

    test 'vm_set_panel: standalone is 404 for the owner, redirect to root for a stranger' do
      get vm_set_panel_game_url(@game)
      assert_response :not_found
      get vm_set_panel_game_url(make_game(@other))
      assert_response :redirect
    end

    # ---- new_session -----------------------------------------------------------------

    test 'new_session: a live set is copied into the new game' do
      install(fake_set)
      assert_difference -> { Game.count }, 1 do
        post new_session_game_url(@game)
      end
      assert_response :success
      fresh = Game.order(:id).last
      assert_equal 11, fresh.player_state['vm_set_id']
      assert_equal 'abandoned', @game.reload.status
    end

    test 'new_session: a released set is not copied; the old game is left as it was' do
      install(fake_set(relinquished: true))
      assert_no_difference -> { Game.count } do
        post new_session_game_url(@game)
      end
      assert_response :unprocessable_entity
      body = JSON.parse(response.body)
      assert_equal 'vm_released', body['reason']
      assert_equal Game::VM_RELEASED_NEW_SESSION_MESSAGE, body['error']
      assert_not_equal Game::VM_RELEASED_MESSAGE, body['error']
      assert_equal 'in_progress', @game.reload.status
    end

    test 'new_session: standalone copies vm context exactly as before' do
      post new_session_game_url(@game)
      assert_response :success
      fresh = Game.order(:id).last
      assert_equal 11, fresh.player_state['vm_set_id']
      assert_equal({ 'kali' => '10.0.0.5' }, fresh.player_state['vm_ips'])
    end

    test 'new_session: a VM-free game in Hacktivity mode starts as before' do
      install(fake_set(relinquished: true))
      vm_free = make_game(@owner, vm_set_id: nil)
      assert_difference -> { Game.count }, 1 do
        post new_session_game_url(vm_free)
      end
      assert_response :success
    end

    test "new_session: another player's game is refused" do
      install(fake_set)
      theirs = make_game(@other)
      assert_no_difference -> { Game.count } do
        post new_session_game_url(theirs)
      end
      assert_response :redirect
    end

    # ---- the page config -------------------------------------------------------------

    test 'show: a released set sends vmSetState released and no panel, widget or activate URL' do
      install(fake_set(relinquished: true))
      get game_url(@game)
      assert_response :success
      assert_equal 'released', config_value('vmSetState')
      assert_equal '', config_value('vmPanelUrl')
      assert_equal '', config_value('vmSetPanelUrl')
      assert_equal '', config_value('vmSetActivateUrl')
    end

    test 'show: a live set sends the panel, widget and activate URLs' do
      install(fake_set)
      get game_url(@game)
      assert_response :success
      assert_equal 'live', config_value('vmSetState')
      assert_match(%r{/vm_panel\z}, config_value('vmPanelUrl'))
      assert_match(%r{/fake/events/7/batches/5/vm_sets/11}, config_value('vmSetPanelUrl'))
      assert_match(%r{/activate\z}, config_value('vmSetActivateUrl'))
    end

    test 'show: standalone and VM-free games send state none and the old values' do
      get game_url(@game)
      assert_equal 'none', config_value('vmSetState')
      assert_equal '', config_value('vmPanelUrl')
      assert_equal '', config_value('vmSetPanelUrl')

      install(fake_set(relinquished: true))
      get game_url(make_game(@owner, vm_set_id: nil))
      assert_equal 'none', config_value('vmSetState')
      assert_match(%r{/vm_panel\z}, config_value('vmPanelUrl'), 'Hacktivity mode keeps its panel URL for a VM-free game')
    end

    test 'show: host-supplied names never reach the released config or the refusal' do
      hostile = %q{</script><script>alert('x')</script>}
      set = fake_set(relinquished: true)
      set.sec_gen_batch.define_singleton_method(:name) { hostile }
      install(set)
      get game_url(@game)
      assert_no_match(%r{</script><script>alert}, response.body)
      post flags_game_url(@game), params: { flag: FLAG }, as: :json
      assert_no_match(/alert/, response.body)
      assert_equal Game::VM_RELEASED_MESSAGE, JSON.parse(response.body)['message']
    end
  end
end
