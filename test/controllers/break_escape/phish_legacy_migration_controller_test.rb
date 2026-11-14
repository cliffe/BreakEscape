# frozen_string_literal: true

require 'test_helper'
require 'json'
require_relative '../../support/capture_proof_scenario'

module BreakEscape
  # The one-time legacy phish-evidence import over the real routes (chunk B,
  # docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md sections 9.1, 14). The scenario bootstrap on a
  # legacy save takes the lock via legacy_phish_evidence?, runs migrate_legacy_phish_evidence!
  # before the capture stamp in one locked pass, and (chunk B keeps the old client-evidence reader)
  # stamps the capture off the client globals the save still holds. sync_state never runs it, and
  # the server-owned phishEvidenceMigrated flag is never accepted from a sync body.
  class PhishLegacyMigrationControllerTest < ActionDispatch::IntegrationTest
    CP = CaptureProofScenario

    PAGE = JSON.parse(
      File.read(File.expand_path('../../fixtures/files/phish_score_parity/fixtures.json', __dir__))
    )['pages']['signin'].merge(
      'capture' => { 'address' => 's.lord@ledgerwell.example', 'secret' => 'Sofia2026!' }
    ).freeze

    CONVINCING = { 'brand' => 'ledgerwell', 'purpose' => 'payslip', 'domainId' => 'd_word',
                   'logo' => 'crisp', 'wording' => 'w_formal', 'fields' => %w[email password],
                   'padlock' => true }.freeze

    def scenario
      data = CP.scenario
      data['social'] ||= {}
      data['social']['landingPages'] = [PAGE.deep_dup]
      data['social']['phishTargets'] = [{ 'id' => 'lord' }]
      data['social']['mailClient'] = { 'payloadKit' => [
        { 'id' => 'kit_payroll_page', 'kind' => 'link', 'landingPageId' => 'payroll_login' }
      ] }
      data
    end

    # A full legacy save: the durable se_landing_pages marker the old reader keys on, plus a sent
    # mail record (so the old client-evidence reader also holds and the bootstrap stamps the
    # capture), and the capture itself recorded unproven.
    def legacy_state(with_sent_mail: true)
      page = { 'pageId' => 'payroll_login', 'targetId' => 'lord', 'built' => true,
               'credibility' => 99, 'meetsThreshold' => true, 'choices' => CONVINCING,
               'victim' => { 'visited' => true, 'submitted' => true }, 'at' => 1_731_600_000_000 }
      state = {
        'currentRoom' => 'office', 'unlockedRooms' => ['office'],
        'globalVariables' => { 'se_landing_pages' => { 'payroll_login' => page } },
        'seCaptures' => { 'lord' => { 'targetId' => 'lord', 'kind' => 'credential',
                                      'address' => 's.lord@ledgerwell.example', 'proven' => false } }
      }
      if with_sent_mail
        state['mailState'] = { 'mailboxes' => { 'lord' => { 'messages' => [
          { 'folder' => 'sent', 'landed' => true, 'targetId' => 'lord', 'link' => { 'kitId' => 'kit_payroll_page' } }
        ] } } }
      end
      state
    end

    def build_game(player_state)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: player_state
      )
    end

    def game_path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    test 'the scenario bootstrap on a legacy save takes the lock, migrates the stores and stamps the capture' do
      build_game(legacy_state)
      refute @game.player_state['phishEvidenceMigrated'], 'not migrated before the bootstrap'

      get game_path('scenario'), as: :json
      assert_response :success

      state = @game.reload.player_state
      assert_equal true, state['phishEvidenceMigrated'], 'the migration ran and set its flag'
      assert_equal true, state.dig('seLandingPages', 'payroll_login', 'meetsThreshold'), 'the build store is populated'
      assert_equal true, state.dig('sePhishSends', 'lord/kit_payroll_page', 'landed'), 'the send store is populated'
      assert_equal true, state.dig('seCaptures', 'lord', 'proven'),
                   'the stamp in the same locked pass proves the capture off the client evidence the save still holds'
    end

    test 'the two server stores and the flag never ride the bootstrap back to the client' do
      build_game(legacy_state)
      get game_path('scenario'), as: :json
      assert_response :success
      boot = JSON.parse(response.body)

      assert_nil boot['seLandingPages'], 'the build store is server-owned, off the client copy'
      assert_nil boot['sePhishSends'], 'the send store is server-owned, off the client copy'
      assert_nil boot['phishEvidenceMigrated'], 'the server-owned flag is off the client copy'
      # se_landing_pages is still a client UI global, so it ships in savedGlobalVariables for the builder.
      assert boot.dig('savedGlobalVariables', 'se_landing_pages'), 'the legacy UI global is left in place'
    end

    test 'sync_state does not run the migration' do
      build_game(legacy_state)
      put game_path('sync_state'), params: { currentRoom: 'office' }, as: :json
      assert_response :success

      state = @game.reload.player_state
      assert_nil state['phishEvidenceMigrated'], 'sync_state must not run the bootstrap-only migration'
      assert_nil state['seLandingPages'], 'the build store stays empty on a sync'
      assert_nil state['sePhishSends'], 'the send store stays empty on a sync'
    end

    test 'phishEvidenceMigrated is never accepted from a sync_state body' do
      build_game(legacy_state)
      put game_path('sync_state'),
          params: { phishEvidenceMigrated: true,
                    globalVariables: { 'phishEvidenceMigrated' => true, 'some_flag' => true } },
          as: :json
      assert_response :success

      state = @game.reload.player_state
      assert_nil state['phishEvidenceMigrated'],
                 'the top-level server-owned flag is never set from the request body'
    end
  end
end
