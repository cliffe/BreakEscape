require 'test_helper'

module BreakEscape
  # The server-owned capture record (sync deltas R2, 6a): record_capture!, record_shared_login!
  # and migrate_legacy_captures! at the model level, against the real lab_physical_pentest and
  # test_access_work scenarios. Serving stays main's authored path (capture_payload_secret_test,
  # lab_physical_pentest_secrets_test); this test owns the recording machinery.
  class CaptureRecordTest < ActiveSupport::TestCase
    setup do
      mission = Mission.create!(name: 'lab_physical_pentest', display_name: 'Physical pentest', published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
      @scenario = @game.scenario_data
    end

    def record(input)
      @game.record_capture!(input, scenario: @scenario, by: :client)
    end

    def authored_note(target_id)
      CaptureModel.capture_candidates(@scenario, target_id, 'foothold').first&.dig(:fields, 'note') ||
        CaptureModel.capture_candidates(@scenario, target_id, 'credential').first&.dig(:fields, 'note')
    end

    test 'a declared foothold is recorded with the scenario note whole, whatever the client sent' do
      note = authored_note('store_controller')
      assert note && note.length > 100, 'the fixture has a long authored note'

      result = record('targetId' => 'store_controller', 'kind' => 'foothold', 'note' => 'client lie', 'host' => 'anything')
      assert_equal :recorded, result[:result]
      entry = result[:entry]
      assert_equal note, entry['note'], 'the stored note is the scenario note, whole'
      assert_equal 'store_controller', entry['targetId']
      assert_equal 'foothold', entry['kind']
      assert_equal true, entry['proven']
      assert entry['at'].is_a?(Numeric)
    end

    test 'an account-holder credential stores the account username as its address' do
      # lord's dev_qr mapping is overlaid with its usePayload host; sending that host stores the
      # overlaid candidate, whose address is still the account username (default_account_address!).
      host = CaptureModel.capture_candidates(@scenario, 'lord', 'credential').map { |c| c[:fields]['host'] }.compact.first
      result = record('targetId' => 'lord', 'kind' => 'credential', 'host' => host)
      assert_equal :recorded, result[:result]
      assert_equal 's.lord', result[:entry]['address']
      refute result[:entry].key?('secret'), 'the record never stores a secret'
    end

    test 'first capture wins' do
      assert_equal :recorded, record('targetId' => 'len', 'kind' => 'credential')[:result]
      second = record('targetId' => 'len', 'kind' => 'credential', 'host' => 'other')
      assert_equal :already, second[:result]
      assert_equal 1, @game.player_state['seCaptures'].length
    end

    test 'a writer with no kind counts as credential' do
      result = record('targetId' => 'len')
      assert_equal :recorded, result[:result]
      assert_equal 'credential', result[:entry]['kind']
    end

    test 'an undeclared target is refused' do
      assert_equal 'undeclared', record('targetId' => 'nobody', 'kind' => 'credential')[:reason]
    end

    test 'a bad kind, an over-long client field and an over-long target id are refused invalid' do
      assert_equal 'invalid', record('targetId' => 'len', 'kind' => 'password')[:reason]
      assert_equal 'invalid', record('targetId' => 'len', 'kind' => 'credential', 'host' => 'x' * (CaptureModel::MAX_CAPTURE_FIELD_CHARS + 1))[:reason]
      assert_equal 'invalid', record('targetId' => 'z' * (CaptureModel::MAX_CAPTURE_TARGET_CHARS + 1), 'kind' => 'credential')[:reason]
    end

    test 'a capture for A naming B address is stored with A own scenario address' do
      result = record('targetId' => 'lord', 'kind' => 'credential', 'address' => 's.hampshire')
      assert_equal :recorded, result[:result]
      assert_equal 's.lord', result[:entry]['address']
    end

    test 'migrate_legacy_captures! moves an old global into the record and deletes the global' do
      @game.player_state['globalVariables'] = { 'se_captures' => {
        'len' => { 'targetId' => 'len', 'kind' => 'credential', 'secret' => '4471', 'at' => 7 },
        'ghost' => { 'targetId' => 'ghost', 'kind' => 'credential', 'at' => 8 }
      } }
      assert @game.legacy_captures?
      assert_equal true, @game.migrate_legacy_captures!(scenario: @scenario)

      record = @game.player_state['seCaptures']
      assert record['len'].is_a?(Hash)
      assert_equal 7, record['len']['at'], 'the stored time is kept'
      refute record['len'].key?('secret'), 'the client secret is never stored'
      refute record.key?('ghost'), 'an undeclared target is dropped'
      refute @game.player_state['globalVariables'].key?('se_captures'), 'the legacy global is deleted'
    end

    test 'captures_for_client carries no secret and no proven' do
      record('targetId' => 'len', 'kind' => 'credential')
      entry = @game.captures_for_client['len']
      assert_equal 'len', entry['targetId']
      refute entry.key?('proven')
      refute entry.key?('secret')
    end
  end

  # Heard shares (test_access_work): the server composes and records them itself.
  class CaptureSharedLoginRecordTest < ActiveSupport::TestCase
    setup do
      mission = Mission.create!(name: 'test_access_work', display_name: 'Access work', published: true, difficulty_level: 1)
      @game = Game.create!(mission: mission, player: break_escape_demo_users(:test_user)).reload
      @scenario = @game.scenario_data
    end

    test 'a heard share is recorded from the server composition and backfilled' do
      result = @game.record_shared_login!('sam', scenario: @scenario)
      assert_equal :recorded, result[:result]
      entry = result[:entry]
      assert_equal 'sam', entry['targetId']
      assert_equal 'credential', entry['kind']
      assert_equal 'sokafor', entry['address']
      assert_includes entry['note'], 'Sam Okafor told'
      assert_equal true, entry['proven']
    end

    test 'a client claim for a share-only target not in sharedLogins is refused server_only' do
      assert_equal 'server_only', @game.record_capture!({ 'targetId' => 'sam', 'kind' => 'credential' }, scenario: @scenario)[:reason]
    end

    test 'a client claim for a share-only target in sharedLogins records the server composition' do
      @game.player_state['sharedLogins'] = ['sam']
      result = @game.record_capture!({ 'targetId' => 'sam', 'kind' => 'credential', 'address' => 'lie' }, scenario: @scenario)
      assert_equal :recorded, result[:result]
      assert_equal 'sokafor', result[:entry]['address']
    end

    test 'record_shared_logins! backfills every sharedLogins id without an entry' do
      @game.player_state['sharedLogins'] = ['sam']
      assert @game.unrecorded_shared_logins?
      assert_equal true, @game.record_shared_logins!(scenario: @scenario)
      assert @game.player_state['seCaptures']['sam'].is_a?(Hash)
      refute @game.unrecorded_shared_logins?
    end
  end
end
