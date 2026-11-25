require 'test_helper'
require_relative '../../support/network_ops_scenario'
require_relative 'ops_privilege_scenario_test'

module BreakEscape
  # Ops S5bc fix (cross-stage interactions review M1, M2): a people helpdesk resets only the
  # directory accounts of people who can call it. Account-only and local accounts are never reset,
  # on every desk kind, and a request naming one is answered exactly as an unknown name.
  class HelpdeskAccountKindsTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include OpsPrivilegeBeats

    teardown { travel_back }

    def npc_in(data, id)
      data['rooms'].each_value { |r| Array(r['npcs']).each { |n| return n if n['id'] == id } }
      nil
    end

    # Two desks: a questions desk (Ravi) and a `none` desk (Priya). Olu is a plain directory
    # account, Uma is made local, deskadmin and labadmin are account-only.
    def helpdesk_copy
      data = beats_scenario
      data['helpdesks'] = {
        'it_desk' => { 'npc' => 'ravi', 'verify' => 'questions', 'questions' => ['staff_no'],
                       'questionLabels' => { 'staff_no' => 'Staff number' }, 'maxTries' => 3, 'resets' => %w[password mfa] },
        'open_desk' => { 'npc' => 'priya', 'verify' => 'none', 'maxTries' => 3, 'resets' => %w[password mfa] },
        'call_desk' => { 'npc' => 'sam', 'verify' => 'callback', 'maxTries' => 3, 'resets' => %w[mfa] }
      }
      npc_in(data, 'olu')['creds'].merge!('recovery' => { 'staff_no' => '40611' }, 'resetPassword' => 'Reset-Olu-71')
      npc_in(data, 'uma')['creds'].merge!('accountKind' => 'local', 'localTo' => %w[bay_pc store_pc],
                                          'recovery' => { 'staff_no' => '40612' }, 'resetPassword' => 'Reset-Uma-72')
      npc_in(data, 'deskadmin')['creds'].merge!('recovery' => { 'staff_no' => '40999' }, 'resetPassword' => 'Reset-Desk-99')
      npc_in(data, 'labadmin')['creds'].merge!('recovery' => { 'staff_no' => '40998' }, 'resetPassword' => 'Reset-Lab-98')
      data
    end

    def build_with(data)
      game = Game.new(
        id: BEATS_GAME_ID, mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
        scenario_data: data,
        player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => %w[lobby bay store it_room],
                        'encounteredNPCs' => %w[olu uma adel priya sam ravi],
                        'unlockedObjects' => %w[lobby_cabinet] }
      )
      game.prepare_scenario_data!
      game.save!
      @game = game
      @answers = {}
    end

    def desk(desk_id, username, what, answers = nil)
      params = { desk_id: desk_id, username: username, what: what }
      params[:answers] = answers if answers
      post b_path('helpdesk/request'), params: params, as: :json
      { 'status' => response.status, 'body' => response.parsed_body }
    end

    def tries_for(desk_id, name)
      entry = (b_state['helpdeskTries'] || {})[HelpdeskModel.tries_key(desk_id, name)]
      entry ? entry['n'] : 0
    end

    def keyring_text
      get b_path('keyring'), as: :json
      response.body
    end

    setup do
      travel_to(BEATS_START)
      build_with(helpdesk_copy)
    end

    # The named account is asked, and a fresh unknown name is asked the same number of times
    # (earlier asks of the same name count); the last answers must be equal bytes and the try
    # counts equal.
    def assert_same_as_unknown(desk_id, name, what, answers)
      @unknown_seq = (@unknown_seq || 0) + 1
      unknown_name = "nobody#{@unknown_seq}"
      before = tries_for(desk_id, name)
      before.times { desk(desk_id, unknown_name, what, answers) }
      named = desk(desk_id, name, what, answers)
      unknown = desk(desk_id, unknown_name, what, answers)
      assert_equal 422, named['status']
      assert_equal unknown['status'], named['status']
      assert_equal unknown['body'].to_json, named['body'].to_json
      assert_equal tries_for(desk_id, unknown_name), tries_for(desk_id, name)
    end

    test 'a questions desk refuses an account-only account with the right answers, as an unknown name' do
      assert_same_as_unknown('it_desk', 'deskadmin', 'password', { 'staff_no' => '40999' })
      assert_same_as_unknown('it_desk', 'labadmin', 'mfa', { 'staff_no' => '40998' })
      refute_includes keyring_text, 'Reset-Desk-99'
      assert_nil b_state['accountResets']&.dig('deskadmin')
      assert_nil b_state['accountResets']&.dig('labadmin')
    end

    test 'a questions desk refuses a local account with the right answers, as an unknown name' do
      assert_same_as_unknown('it_desk', 'umaquay', 'password', { 'staff_no' => '40612' })
      assert_same_as_unknown('it_desk', 'umaquay', 'mfa', { 'staff_no' => '40612' })
      refute_includes keyring_text, 'Reset-Uma-72'
    end

    test 'a none desk refuses an account-only and a local account, as an unknown name' do
      assert_same_as_unknown('open_desk', 'labadmin', 'mfa', nil)
      assert_same_as_unknown('open_desk', 'deskadmin', 'password', nil)
      assert_same_as_unknown('open_desk', 'umaquay', 'mfa', nil)
      assert_same_as_unknown('open_desk', 'umaquay', 'password', nil)
      assert_nil b_state['accountResets']&.dig('labadmin')
    end

    test 'wrong answers for an account-only account count and answer as for an unknown name' do
      assert_same_as_unknown('it_desk', 'deskadmin', 'password', { 'staff_no' => '1' })
      assert_same_as_unknown('it_desk', 'deskadmin', 'password', { 'staff_no' => '1' })
    end

    test 'a callback desk refuses an account-only and a local account, as an unknown name' do
      assert_same_as_unknown('call_desk', 'labadmin', 'mfa', nil)
      assert_same_as_unknown('call_desk', 'deskadmin', 'mfa', nil)
      assert_same_as_unknown('call_desk', 'umaquay', 'mfa', nil)
      assert_nil b_state['accountResets']&.dig('labadmin')
    end

    test 'at a full desk a new account-only name is blocked exactly as a new unknown name, and nothing is counted' do
      game = Game.find(@game.id)
      HelpdeskModel::TRIES_CAP.times do |i|
        game.helpdesk_tries["it_desk|old#{i}"] = { 'n' => 1, 'at' => BEATS_START.to_i, 'seq' => i }
      end
      game.save!
      account_only = desk('it_desk', 'deskadmin', 'password', { 'staff_no' => '40999' })
      unknown = desk('it_desk', 'nobodyatall', 'password', { 'staff_no' => '40999' })
      assert_equal 422, account_only['status']
      assert_equal 'blocked', account_only['body']['reason']
      assert_equal unknown['body'].to_json, account_only['body'].to_json
      refute b_state['helpdeskTries'].key?(HelpdeskModel.tries_key('it_desk', 'deskadmin'))
      refute b_state['helpdeskTries'].key?(HelpdeskModel.tries_key('it_desk', 'nobodyatall'))
    end

    test 'a normal directory account is still granted' do
      result = desk('it_desk', 'omarsh', 'password', { 'staff_no' => '40611' })
      assert_equal 200, result['status']
      assert_equal 'Reset-Olu-71', result['body']['password']
      assert_equal 200, desk('open_desk', 'omarsh', 'mfa')['status']
    end

    test 'the keyring and the phone route never name an account-only account after refused requests' do
      desk('it_desk', 'deskadmin', 'password', { 'staff_no' => '40999' })
      desk('open_desk', 'labadmin', 'mfa')
      desk('it_desk', 'omarsh', 'password', { 'staff_no' => '40611' })
      text = keyring_text
      %w[deskadmin labadmin].each { |name| refute_includes text, name }
      get b_path('mfa/phone'), as: :json
      %w[deskadmin labadmin].each { |name| refute_includes response.body, name }
      get b_path('mfa/phone'), params: { npc_id: 'labadmin' }, as: :json
      refute_includes response.body, 'labadmin'
    end
  end
end
