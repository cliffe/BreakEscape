require 'test_helper'
require_relative '../../support/keyring_login_scenario'

module BreakEscape
  # S8a unit 20 (feature A22, M3): GET /mfa/phone. The waiting requests of a held phone, and the
  # three number choices only there. Time is frozen.
  class MfaPhoneTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkRequests

    KS = KeyringLoginScenario
    NS = NetworkModelScenario
    T0 = Time.zone.at(1_800_000_000)
    PHONE = { 'id' => 'sam_phone', 'type' => 'phone_friendface', 'name' => 'Sam phone', 'owner' => 'sam' }.freeze
    JAKE_PHONE = { 'id' => 'jake_phone', 'type' => 'phone_friendface', 'name' => 'Jake phone', 'owner' => 'jake' }.freeze

    def build(kind: 'push_number_match', held: [PHONE])
      data = KS.scenario
      data['policies']['gate'] = { 'mfa' => kind, 'remote' => 'allowed', 'maxAttempts' => 50 }
      data['rooms']['desk_room']['objects'].find { |o| o['id'] == 'sam_pc' }['policy'] = 'gate'
      data['rooms']['lobby']['objects'] << PHONE.merge('takeable' => true) << JAKE_PHONE.merge('takeable' => true)
      build_network_game({ 'encounteredNPCs' => %w[sam lena ian jake],
                           'inventory' => held.map { |h| { 'scenarioData' => h.dup, 'id' => h['id'], 'type' => h['type'], 'owner' => h['owner'] } } }, data)
    end

    setup do
      travel_to T0
      build
    end

    teardown { travel_back }

    def first_step
      post game_path('login'), params: { pc_id: 'sam_pc', username: 'sokafor', password: NS::SAM_PASSWORD }, as: :json
      response.parsed_body
    end

    test 'a held phone lists the waiting request with its three numbers, no-store' do
      right = first_step['number']
      get game_path('mfa/phone'), params: { npc_id: 'sam' }
      assert_response :success
      assert_equal 'no-store', response.headers['Cache-Control']
      req = response.parsed_body['requests'].first
      assert_equal 'sam_pc', req['pcId']
      assert_equal 'sokafor', req['username']
      assert_equal 3, req['numbers'].size
      assert_includes req['numbers'], right
    end

    test 'the numbers appear only in the held phone list' do
      build(held: [])
      body = first_step
      assert_nil body['numbers']
      assert_nil body['choices']
      get game_path('mfa/phone'), params: { npc_id: 'sam' }
      assert_response :forbidden
      assert_equal({ 'success' => false, 'error' => 'no such phone' }, response.parsed_body)
      assert_equal 'no-store', response.headers['Cache-Control']
    end

    test 'push without number matching lists the request with no numbers' do
      build(kind: 'push')
      first_step
      get game_path('mfa/phone'), params: { npc_id: 'sam' }
      assert_response :success
      assert_nil response.parsed_body['requests'].first['numbers']
    end

    test 'another owner phone, a missing npc_id and own=1 are all 403' do
      build(held: [JAKE_PHONE])
      first_step
      get game_path('mfa/phone'), params: { npc_id: 'sam' }
      assert_response :forbidden
      get game_path('mfa/phone')
      assert_response :forbidden
      build
      first_step
      get game_path('mfa/phone'), params: { npc_id: 'sam', own: '1' }
      assert_response :forbidden
    end

    test 'an unknown npc_id is 403' do
      get game_path('mfa/phone'), params: { npc_id: 'nobody' }
      assert_response :forbidden
    end
  end
end
