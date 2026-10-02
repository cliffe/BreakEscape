require 'test_helper'

# Lifted fingerprints survive a reload: sync_state stores them (merged per owner,
# unknown owners and keys dropped) and the scenario payload hands them back.
module BreakEscape
  class BiometricSamplesTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    PLAYER_STATE = {
      'currentRoom' => 'lobby',
      'unlockedRooms' => ['lobby'],
      'unlockedObjects' => [],
      'inventory' => [],
      'encounteredNPCs' => [],
      'globalVariables' => {},
      'notes' => [],
      'health' => 100,
      'objectivesState' => { 'tasks' => {}, 'aims' => {} }
    }.freeze

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)

      PlayerPreference.find_or_create_by!(player: @owner) do |pref|
        pref.selected_sprite = 'female_spy'
        pref.in_game_name    = 'TestAgent'
      end

      @game = Game.create!(mission: @mission, player: @owner, scenario_data: scenario,
                           player_state: PLAYER_STATE.deep_dup)
    end

    test 'two samples for one owner are stored as one with the higher quality' do
      sync([sample(quality: 0.6), sample(quality: 0.9, sourceObjectId: 'mug')])

      stored = @game.reload.player_state['biometricSamples']
      assert_equal 1, stored.length
      assert_in_delta 0.9, stored.first['quality']
      assert_equal 'mug', stored.first['sourceObjectId']
    end

    test 'identified is ORed and the earliest collectedAt kept across syncs' do
      sync([sample(quality: 0.5, identified: true, collectedAt: '2026-10-01T12:00:00Z')])
      sync([sample(quality: 0.8, identified: false, collectedAt: '2026-10-01T13:00:00Z')])

      stored = @game.reload.player_state['biometricSamples'].first
      assert_in_delta 0.8, stored['quality']
      assert_equal true, stored['identified']
      assert_equal '2026-10-01T12:00:00Z', stored['collectedAt']
    end

    test 'a sample whose owner is not in the scenario is dropped' do
      sync([sample(owner: 'Somebody Invented'), sample(owner: 'Nested Owner', quality: 0.7)])

      owners = @game.reload.player_state['biometricSamples'].map { |s| s['owner'] }
      assert_equal ['Nested Owner'], owners, 'an owner inside a container counts; an invented one does not'
    end

    test 'unknown keys are stripped and quality is clamped' do
      sync([sample(quality: 7.5, evil: 'x', data: 'raw')])

      stored = @game.reload.player_state['biometricSamples'].first
      assert_equal 1.0, stored['quality']
      assert_not stored.key?('evil')
      assert_not stored.key?('data')
    end

    test 'the list is capped at 50' do
      owners = (1..60).map { |i| "Owner #{i}" }
      @game.update!(scenario_data: scenario.merge('extraOwners' => owners.map { |o| { 'fingerprintOwner' => o } }))

      sync(owners.map { |o| sample(owner: o) })

      assert_equal 50, @game.reload.player_state['biometricSamples'].length
    end

    test 'add_biometric_sample! uses the same merge' do
      @game.add_biometric_sample!(sample(quality: 0.4).stringify_keys)
      @game.add_biometric_sample!(sample(quality: 0.2).stringify_keys)

      stored = @game.reload.player_state['biometricSamples']
      assert_equal 1, stored.length
      assert_in_delta 0.4, stored.first['quality']
    end

    test 'GET scenario returns savedBiometricSamples after a sync' do
      get scenario_game_url(@game)
      assert_response :success
      assert_nil response.parsed_body['savedBiometricSamples']

      sync([sample(quality: 0.88, identified: true)])
      get scenario_game_url(@game)

      saved = response.parsed_body['savedBiometricSamples']
      assert_equal 1, saved.length
      assert_equal 'Robert Vance', saved.first['owner']
      assert_in_delta 0.88, saved.first['quality']
      assert_equal true, saved.first['identified']
    end

    private

    def sync(samples)
      put sync_state_game_url(@game), params: { biometricSamples: samples }, as: :json
      assert_response :success
    end

    def sample(over = {})
      { id: 'fp_robert_vance', type: 'fingerprint', owner: 'Robert Vance', ownerId: 'robert_vance',
        ownerName: 'Robert Vance', quality: 0.6, rating: 'Fair', pattern: 'loop', identified: false,
        sourceObjectId: 'panel', sourceRoomId: 'lobby', sourceName: 'Panel', surface: 'glossy_dark',
        collectedAt: '2026-10-01T12:00:00Z' }.merge(over)
    end

    def scenario
      {
        'startRoom' => 'lobby',
        'rooms' => {
          'lobby' => {
            'type' => 'room_office', 'locked' => false, 'connections' => {}, 'npcs' => [],
            'objects' => [
              { 'type' => 'pc', 'id' => 'panel', 'name' => 'Panel', 'hasFingerprint' => true,
                'fingerprintOwner' => 'Robert Vance' },
              { 'type' => 'safe', 'id' => 'box', 'name' => 'Box',
                'contents' => [{ 'type' => 'cup', 'id' => 'mug', 'hasFingerprint' => true,
                                 'fingerprintOwner' => 'Nested Owner' }] }
            ]
          }
        },
        'globalVariables' => {},
        'objectives' => []
      }
    end
  end
end
