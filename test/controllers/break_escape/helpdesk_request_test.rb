# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/helpdesk_route_scenario'

module BreakEscape
  # S8b unit 13: POST /games/:id/helpdesk/request through the real route. Time is frozen.
  class HelpdeskRequestTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    HS = HelpdeskRouteScenario
    T0 = Time.zone.at(1_800_000_000)

    def build(desk_overrides: {}, state: {})
      build_network_game({ 'encounteredNPCs' => %w[ria sam lena ian] }.merge(state), HS.scenario(desk_overrides))
    end

    setup do
      travel_to T0
      build
    end

    teardown { travel_back }

    def ask(fields = {})
      body = { desk_id: 'it_desk', username: 'sokafor', what: 'password', answers: HS::RIGHT_SAM }.merge(fields)
      body.delete_if { |_k, v| v == :omit }
      post game_path('helpdesk/request'), params: body, as: :json
    end

    def state
      @game.reload.player_state
    end

    def rows
      @game.reload.log_rows_for('desk')
    end

    def session_at(pc_id, session)
      @game.player_state['sessions'] = { pc_id => session }
      @game.save!
    end

    # --- a grant, with each kind of session at the PC -------------------------------------------

    test 'a grant with no pc_id: the password, no-store, the account marked and a keyring entry' do
      ask
      assert_response :success, response.body
      assert_equal 'no-store', response.headers['Cache-Control']
      body = response.parsed_body
      assert_equal true, body['granted']
      assert_equal HS::SAM_RESET, body['password']
      assert_equal({ 'password' => true }, state['accountResets']['sam'])
      assert_equal %w[helpdesk_request account_password_reset], rows.map { |r| r['event'] }
    end

    test 'a grant at a PC with a keyboard session' do
      session_at('sam_pc', { 'id' => 'sam', 'via' => 'password' })
      ask(pc_id: 'sam_pc')
      assert_response :success, response.body
      assert_equal 'password', response.parsed_body['what']
    end

    test 'a grant at a PC with a remote session' do
      session_at('sam_pc', { 'id' => 'sam', 'via' => 'credential', 'relay' => true })
      ask(pc_id: 'sam_pc')
      assert_response :success, response.body
      assert_equal 'password', response.parsed_body['what']
    end

    test 'a grant at a PC with a technique session' do
      session_at('sam_pc', { 'id' => 'sam', 'via' => 'technique', 'technique' => 'f1' })
      ask(pc_id: 'sam_pc')
      assert_response :success, response.body
      assert_equal 'password', response.parsed_body['what']
    end

    # --- unavailable ------------------------------------------------------------------------

    test 'unavailable: no session at the PC, a session only at another PC, a locked session' do
      ask(pc_id: 'sam_pc')
      assert_response :unprocessable_entity
      assert_equal({ 'reason' => 'unavailable' }, response.parsed_body)

      session_at('lena_pc', { 'id' => 'lena', 'via' => 'password' })
      ask(pc_id: 'sam_pc')
      assert_equal({ 'reason' => 'unavailable' }, response.parsed_body)

      session_at('sam_pc', { 'id' => 'sam', 'via' => 'password', 'locked' => true })
      ask(pc_id: 'sam_pc')
      assert_response :unprocessable_entity
      assert_equal({ 'reason' => 'unavailable' }, response.parsed_body)
      assert_empty state['accountResets'].to_h
    end

    test 'a pc_id that is not a sign-in PC and an invented one give the same body' do
      session_at('sam_pc', { 'id' => 'sam', 'via' => 'password' })
      ask(pc_id: 'ian')
      not_pc = [response.status, response.parsed_body]
      ask(pc_id: 'no_such_pc')
      invented = [response.status, response.parsed_body]
      assert_equal [422, { 'reason' => 'unavailable' }], not_pc
      assert_equal not_pc, invented
    end

    test 'in person (no pc_id) needs no session' do
      assert_empty state['sessions'].to_h
      ask
      assert_response :success, response.body
    end

    test 'unavailable: the desk NPC not met, knocked out, or a reset the desk does not offer' do
      build(state: { 'encounteredNPCs' => %w[sam] })
      ask
      assert_equal [422, { 'reason' => 'unavailable' }], [response.status, response.parsed_body]

      build(state: { 'npcHostility' => { 'ria' => { 'ko' => true } } })
      ask
      assert_equal 'unavailable', response.parsed_body['reason']

      build(desk_overrides: { 'resets' => %w[password] })
      ask(what: 'mfa')
      assert_equal 'unavailable', response.parsed_body['reason']
    end

    test 'an unknown desk is 404 not_found' do
      ask(desk_id: 'nope')
      assert_response :not_found
      assert_equal({ 'reason' => 'not_found' }, response.parsed_body)
      assert_equal 'no-store', response.headers['Cache-Control']
    end

    # --- refusals and the stop: nothing secret, nothing about what was right --------------------

    test 'refusals count down, stop at the last, then block with retryIn and lift after 300 seconds' do
      bodies = 3.times.map do
        ask(answers: HS::WRONG)
        assert_response :unprocessable_entity
        assert_equal 'no-store', response.headers['Cache-Control']
        response.parsed_body
      end
      assert_equal [{ 'reason' => 'refused', 'triesLeft' => 2 }, { 'reason' => 'refused', 'triesLeft' => 1 },
                    { 'reason' => 'refused', 'triesLeft' => 0 }], bodies
      travel_to T0 + 100
      ask
      assert_response :unprocessable_entity
      assert_equal({ 'reason' => 'blocked', 'retryIn' => 200 }, response.parsed_body)
      travel_to T0 + 300
      ask
      assert_response :success, response.body
    end

    test 'an unknown username and wrong answers give the same status and body, and no refusal holds a secret' do
      ask(answers: HS::WRONG)
      known = [response.status, response.parsed_body]
      ask(username: 'nobody', answers: HS::RIGHT_SAM)
      unknown = [response.status, response.parsed_body]
      assert_equal known, unknown
      assert_equal %w[reason triesLeft], response.parsed_body.keys.sort
      ask(username: 'nobody2', answers: HS::WRONG)
      ask(username: 'nobody3', answers: HS::WRONG)
      ask(username: 'nobody3', answers: HS::WRONG)
      ask(username: 'nobody3', answers: HS::WRONG)
      ask(username: 'nobody3', answers: HS::WRONG)
      assert_equal 'blocked', response.parsed_body['reason']
      raw = response.body
      [HS::SAM_RESET, 'sokafor', 'nobody3', 'A-1042', 'Dana Pryce', 'nope'].each do |secret|
        assert_not_includes raw, secret
      end
      all_rows = JSON.generate(rows)
      ['A-1042', 'Dana Pryce', 'nope'].each { |text| assert_not_includes all_rows, text }
      assert_not_includes all_rows, HS::SAM_RESET
    end

    test 'the typed username is never echoed in any answer' do
      ask(username: 'zz-typed-name', answers: HS::WRONG)
      assert_not_includes response.body, 'zz-typed-name'
      ask(username: 'zz-typed-name', desk_id: 'nope')
      assert_not_includes response.body, 'zz-typed-name'
      ask(username: 'zz-typed-name', pc_id: 'invented')
      assert_not_includes response.body, 'zz-typed-name'
    end

    # --- parameters -----------------------------------------------------------------------------

    test 'bad_request: a missing or non-string desk_id, username or what' do
      %i[desk_id username what].each do |field|
        ask(field => :omit)
        assert_response :bad_request, "#{field} missing"
        assert_equal({ 'reason' => 'bad_request' }, response.parsed_body)
        assert_equal 'no-store', response.headers['Cache-Control']
        ask(field => '')
        assert_response :bad_request, "#{field} empty"
        ask(field => 7)
        assert_response :bad_request, "#{field} number"
        ask(field => %w[a])
        assert_response :bad_request, "#{field} array"
      end
      assert_empty rows
      assert_empty state['helpdeskTries'].to_h
    end

    test 'bad_request: answers that is an array, a string or holds a non-string; absent answers is fine' do
      ask(answers: %w[A-1042 Dana])
      assert_response :bad_request
      ask(answers: 'A-1042')
      assert_response :bad_request
      ask(answers: { 'staff_no' => 5, 'manager' => 'Dana Pryce' })
      assert_response :bad_request
      ask(answers: { 'staff_no' => { 'a' => 'b' } })
      assert_response :bad_request
      assert_empty state['helpdeskTries'].to_h
      ask(answers: :omit)
      assert_response :unprocessable_entity
      assert_equal 'refused', response.parsed_body['reason']
    end

    test 'bad_request: a pc_id that is not a string or has 65 characters; 64 is accepted' do
      ask(pc_id: 7)
      assert_response :bad_request
      ask(pc_id: %w[sam_pc])
      assert_response :bad_request
      ask(pc_id: 'p' * 65)
      assert_response :bad_request
      ask(pc_id: 'é' * 65)
      assert_response :bad_request
      ask(pc_id: 'p' * 64)
      assert_response :unprocessable_entity
      assert_equal 'unavailable', response.parsed_body['reason']
      ask(pc_id: 'é' * 64)
      assert_equal 'unavailable', response.parsed_body['reason']
    end

    test 'bad_request: a body over 4 KB is refused before it is read, and nothing is counted' do
      ask(answers: { 'staff_no' => 'x' * 5000, 'manager' => 'Dana Pryce' })
      assert_response :bad_request
      assert_equal({ 'reason' => 'bad_request' }, response.parsed_body)
      assert_equal 'no-store', response.headers['Cache-Control']
      assert_empty state['helpdeskTries'].to_h
      assert_empty rows
    end

    test 'an over-long username or answer is cut, not refused as a bad request' do
      ask(username: 'u' * 500, answers: { 'staff_no' => 'A-1042' + (' ' * 3000), 'manager' => 'Dana Pryce' })
      assert_response :unprocessable_entity
      assert_equal 'refused', response.parsed_body['reason']
      assert_equal 1, state['helpdeskTries'].size
      assert_operator state['helpdeskTries'].keys.first.length, :<=, 'it_desk|'.length + 64
    end

    # --- authorisation and the policy -----------------------------------------------------------

    test 'another player cannot use the route on this game' do
      other = Game.create!(mission: @game.mission, player: break_escape_demo_users(:other_user)).reload
      other.update!(scenario_data: HS.scenario, player_state: { 'encounteredNPCs' => %w[ria sam] })
      post "/break_escape/games/#{other.id}/helpdesk/request",
           params: { desk_id: 'it_desk', username: 'sokafor', what: 'password', answers: HS::RIGHT_SAM }, as: :json
      assert_not response.successful?
      assert_not_includes response.body, HS::SAM_RESET
      assert_nil other.reload.player_state['accountResets']
    end

    test 'per-role access: the owner and an admin are allowed, another user is not' do
      owner = GamePolicy.new(break_escape_demo_users(:test_user), @game)
      other = GamePolicy.new(break_escape_demo_users(:other_user), @game)
      admin_user = BreakEscape::DemoUser.find(break_escape_demo_users(:other_user).id)
      admin_user.define_singleton_method(:admin?) { true }
      admin = GamePolicy.new(admin_user, @game)
      assert owner.helpdesk_request?
      assert admin.helpdesk_request?
      assert_not other.helpdesk_request?
    end

    test 'the route accepts POST only' do
      get game_path('helpdesk/request')
      assert_response :not_found
    end

    # --- state, rows and the secret guard ---------------------------------------------------------

    test 'a repeat of a grant gives the same body and writes no new row' do
      ask
      first = response.parsed_body
      count = rows.size
      ask
      assert_equal first, response.parsed_body
      assert_equal count, rows.size
    end

    test 'neither server-owned state key is sent by the game state sync' do
      ask(answers: HS::WRONG)
      assert state['helpdeskTries'].present?
      get game_path('scenario')
      assert_not_includes response.body, 'helpdeskTries'
      assert_not_includes response.body, 'accountResets'
    end

    test 'a row holding a resetPassword is refused by the secret guard with a secret in error' do
      events = { 'tst_hd' => { label: 'TST', places: %w[desk], results: %w[ok] } }
      OpsLog.with_events(events) do
        @game.scenario_data['logSources']['desk']['events'] << 'tst_hd'
        # a desk whose id is the reset password resolves, so the guard (not the lookup) refuses it
        @game.scenario_data['helpdesks'][HS::SAM_RESET] = HS.desk
        error = assert_raises(OpsLog::SecretInRow) do
          @game.write_log_row!('tst_hd', as: nil, where: { kind: 'desk', id: HS::SAM_RESET }, result: 'ok')
        end
        assert error.message.start_with?('secret in'), error.message
        assert_not_includes error.message, HS::SAM_RESET
      end
    end
  end
end
