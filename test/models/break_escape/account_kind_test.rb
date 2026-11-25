# frozen_string_literal: true

require 'test_helper'
require_relative '../../support/access_model_scenario'

module BreakEscape
  # Ops S5bc unit 17 (S5c): admission by account kind. The kind narrows the access list, never
  # widens it; a kind refusal is the existing uncounted notPermitted answer, and its signin_refused
  # row carries `kind` only when the kind did the refusing. Through the real POST /login.
  class AccountKindTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    JAKE_PASSWORD = AccessModelScenario::JAKE_PASSWORD
    DANA_PASSWORD = AccessModelScenario::DANA_PASSWORD
    SOURCES = { 'signins' => { 'title' => 'Sign-ins', 'events' => %w[signin_* session_*] } }.freeze

    def scenario
      data = AccessModelScenario.routes_scenario
      data['logSources'] = SOURCES.deep_dup
      yield data if block_given?
      data
    end

    def npc(data, id)
      data['rooms'].values.flat_map { |r| Array(r['npcs']) }.find { |n| n['id'] == id }
    end

    def pc(data, id)
      data['rooms'].values.flat_map { |r| Array(r['objects']) }.find { |o| o['id'] == id }
    end

    def build(data)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: data,
        player_state: { 'currentRoom' => 'finance', 'unlockedRooms' => %w[lobby finance] }
      )
    end

    def login(username, password, pc_id)
      post login_game_url(@game), params: { pc_id: pc_id, username: username, password: password }, as: :json
      response.parsed_body
    end

    def refused_rows
      Game.find(@game.id).log_rows_for('signins').select { |r| r['event'] == 'signin_refused' }
    end

    def assert_not_permitted(body)
      assert_response :unprocessable_entity
      assert_equal true, body['notPermitted']
    end

    test 'no kind changes nothing: the access list alone decides' do
      build(scenario)
      assert_equal 'jake', login('jbrooks', JAKE_PASSWORD, 'jake_pc')['npcId']
      assert_not_permitted login('jbrooks', JAKE_PASSWORD, 'it_pc')
      assert_nil refused_rows.last['detail']
    end

    test 'a local account signs in only at its PCs; the refusal is uncounted and its row says local' do
      build(scenario { |d| npc(d, 'jake')['creds'].merge!('accountKind' => 'local', 'localTo' => %w[profile_pc]) })
      login('jbrooks', 'nope', 'jake_pc')
      body = login('jbrooks', JAKE_PASSWORD, 'jake_pc')
      assert_not_permitted body
      assert_equal 1, @game.reload.player_state['loginFailures']['jake_pc|jbrooks']['n']
      assert_nil @game.player_state['sessions']['jake_pc']
      assert_equal({ 'kind' => 'local' }, refused_rows.last['detail'])
      assert_equal 'denied', refused_rows.last['result']
    end

    test 'a local account admitted at its own PC signs in there' do
      build(scenario { |d| npc(d, 'jake')['creds'].merge!('accountKind' => 'local', 'localTo' => %w[jake_pc]) })
      assert_equal 'jake', login('jbrooks', JAKE_PASSWORD, 'jake_pc')['npcId']
    end

    test 'a domain account needs the PC in its domain; an absent PC domain never matches' do
      data = scenario do |d|
        npc(d, 'dana')['creds'].merge!('accountKind' => 'domain', 'domain' => 'corp.example')
        pc(d, 'it_pc')['domain'] = 'corp.example'
      end
      build(data)
      assert_equal 'dana', login('dwhite', DANA_PASSWORD, 'it_pc')['npcId']

      pc(data, 'it_pc')['domain'] = 'other.example'
      build(data)
      assert_not_permitted login('dwhite', DANA_PASSWORD, 'it_pc')
      assert_equal({ 'kind' => 'domain' }, refused_rows.last['detail'])

      pc(data, 'it_pc').delete('domain')
      build(data)
      assert_not_permitted login('dwhite', DANA_PASSWORD, 'it_pc')
    end

    test 'a kind never widens: the right kind at a PC whose list refuses is refused, with no kind on the row' do
      build(scenario { |d| npc(d, 'jake')['creds'].merge!('accountKind' => 'local', 'localTo' => %w[it_pc]) })
      assert_not_permitted login('jbrooks', JAKE_PASSWORD, 'it_pc')
      assert_nil refused_rows.last['detail']
    end

    test 'a junk kind refuses and writes no kind detail' do
      build(scenario { |d| npc(d, 'jake')['creds']['accountKind'] = 'galactic' })
      assert_not_permitted login('jbrooks', JAKE_PASSWORD, 'jake_pc')
      assert_nil refused_rows.last['detail']
    end

    test 'a wrong password at a kind-refused PC is an ordinary counted failure' do
      build(scenario { |d| npc(d, 'jake')['creds'].merge!('accountKind' => 'local', 'localTo' => %w[profile_pc]) })
      login('jbrooks', 'nope', 'jake_pc')
      assert_equal 1, @game.reload.player_state['loginFailures']['jake_pc|jbrooks']['n']
      assert_empty refused_rows
    end

    test 'account_password_opens_something? follows the kind (D15)' do
      data = scenario
      build(data)
      jake = npc(@game.scenario_data, 'jake')
      assert @game.send(:account_password_opens_something?, jake)

      narrowed = scenario { |d| npc(d, 'jake')['creds'].merge!('accountKind' => 'local', 'localTo' => %w[nowhere_pc]) }
      build(narrowed)
      assert_not @game.send(:account_password_opens_something?, npc(@game.scenario_data, 'jake'))
    end
  end
end
