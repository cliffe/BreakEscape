# frozen_string_literal: true

require 'test_helper'
require 'json'
require_relative '../../support/capture_proof_scenario'

module BreakEscape
  # The one-time legacy phish-evidence import at the model level (chunk B,
  # docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md sections 9, 9.1). A save made before the two
  # server stores existed holds its build and send facts in the client global
  # globalVariables.se_landing_pages. migrate_legacy_phish_evidence! re-derives the build verdict
  # with PhishScore (never trusting the old meetsThreshold) and imports a landed send off the
  # save's own durable victim.submitted marker, gated on that re-derived build, once.
  class PhishLegacyMigrationTest < ActiveSupport::TestCase
    CP = CaptureProofScenario

    # The authored sign-in page from the shared parity fixture, with a capture block added so a
    # phish credential resolves to it (phish_evidence_page_for keys on the page capture address).
    PAGE = JSON.parse(
      File.read(File.expand_path('../../fixtures/files/phish_score_parity/fixtures.json', __dir__))
    )['pages']['signin'].merge(
      'capture' => { 'address' => 's.lord@ledgerwell.example', 'secret' => 'Sofia2026!' }
    ).freeze

    # On-menu choices that re-score above the lord threshold of 70 (credibility 87, meets true),
    # the same set the Route 1 build test uses.
    CONVINCING = { 'brand' => 'ledgerwell', 'purpose' => 'payslip', 'domainId' => 'd_word',
                   'logo' => 'crisp', 'wording' => 'w_formal', 'fields' => %w[email password],
                   'padlock' => true }.freeze
    # On-menu but weak choices: credibility 34, below threshold, so they re-score meets false.
    WEAK = { 'brand' => 'ledgerwell', 'purpose' => 'signin', 'domainId' => 'd_letter',
             'logo' => 'blurry', 'wording' => 'w_slips', 'fields' => %w[email password card_number],
             'padlock' => false }.freeze

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

    # A legacy save: the durable client evidence lives in globalVariables.se_landing_pages, with the
    # victim.submitted marker the old reader keyed on. mail_state is optional (the mailbox cap can
    # trim the sent record before the save is taken).
    def legacy_page(choices:, submitted: true, built: true, meets_forged: true)
      page = {
        'pageId' => 'payroll_login', 'targetId' => 'lord', 'built' => built,
        'credibility' => 99, 'meetsThreshold' => meets_forged, 'choices' => choices,
        'at' => 1_731_600_000_000
      }
      page['victim'] = { 'visited' => true, 'submitted' => true } if submitted
      page
    end

    def build_game(page: legacy_page(choices: CONVINCING), extra_state: {})
      state = {
        'currentRoom' => 'office', 'unlockedRooms' => ['office'],
        'globalVariables' => { 'se_landing_pages' => { 'payroll_login' => page } }
      }.merge(extra_state)
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: state
      )
    end

    def migrate
      @game.migrate_legacy_phish_evidence!(scenario: @game.scenario_data)
    end

    def land_store
      @game.player_state['seLandingPages'] || {}
    end

    def send_store
      @game.player_state['sePhishSends'] || {}
    end

    test 'legacy_phish_evidence? is true for a legacy save and false once migrated' do
      build_game
      assert @game.legacy_phish_evidence?, 'a non-empty se_landing_pages with no flag needs migration'
      assert_equal true, migrate
      refute @game.legacy_phish_evidence?, 'the flag closes the predicate'
    end

    test 'an honest old save migrates to the server verdict and an imported landed send, with no sent mail' do
      build_game(page: legacy_page(choices: CONVINCING))
      refute @game.player_state.key?('mailState'), 'this old save kept no sent mail record'

      assert_equal true, migrate

      build = land_store['payroll_login']
      assert build, 'the build store is populated for the page'
      assert_equal true, build['built']
      assert_equal true, build['meetsThreshold'], 'the verdict is the server re-score, not the old record'
      assert_equal 87, build['credibility']
      assert_equal 'lord', build['targetId']

      send = send_store['lord/kit_payroll_page']
      assert send, 'the send store is keyed targetId/kitId'
      assert_equal true, send['landed'], 'landed off the re-derived build, not a surviving sent mail'
      assert_equal 'kit_payroll_page', send['kitId']
      assert_equal 'payroll_login', send['pageId']
      assert_equal true, @game.player_state['phishEvidenceMigrated']
      assert @game.player_state.dig('globalVariables', 'se_landing_pages'),
             'the legacy global is left in place for the builder UI'
    end

    test 'a forged old save with junk choices migrates to meetsThreshold false and landed false' do
      build_game(page: legacy_page(choices: WEAK, meets_forged: true))
      assert_equal true, migrate

      build = land_store['payroll_login']
      assert_equal false, build['meetsThreshold'], 'the forged meetsThreshold true is re-derived to false'
      assert_equal 34, build['credibility']

      send = send_store['lord/kit_payroll_page']
      assert send, 'a send is still recorded for the submitted marker'
      assert_equal false, send['landed'], 'but it does not land over a below-threshold page'
    end

    test 'off-menu choices migrate as not built: no store entry, player rebuilds' do
      build_game(page: legacy_page(choices: CONVINCING.merge('domainId' => 'd_nonexistent')))
      assert_equal true, migrate

      assert_nil land_store['payroll_login'], 'an off-menu build is not imported'
      assert_empty send_store
      assert_equal true, @game.player_state['phishEvidenceMigrated'], 'the flag is still set so it never re-runs'
    end

    test 'a built page never sent imports the build but no send' do
      build_game(page: legacy_page(choices: CONVINCING, submitted: false))
      assert_equal true, migrate

      assert land_store['payroll_login'], 'the build store is populated'
      assert_empty send_store, 'no victim.submitted marker, so no landed send is imported'
    end

    test 'an already-proven capture is left untouched while the stores still populate' do
      build_game(page: legacy_page(choices: CONVINCING), extra_state: {
        'seCaptures' => { 'lord' => { 'targetId' => 'lord', 'kind' => 'credential',
                                      'address' => 's.lord@ledgerwell.example', 'proven' => true, 'at' => 5 } }
      })
      assert_equal true, migrate

      capture = @game.player_state['seCaptures']['lord']
      assert_equal true, capture['proven'], 'a finished phish keeps its result'
      assert_equal 5, capture['at'], 'the capture entry is not rewritten'
      assert land_store['payroll_login'], 'the build store still populates for the reader'
      assert send_store['lord/kit_payroll_page'], 'the send store still populates'
    end

    test 'the writer runs once: a second call is a no-op even after se_landing_pages is edited' do
      build_game(page: legacy_page(choices: CONVINCING))
      assert_equal true, migrate, 'the first run migrates and sets the flag'
      first_send = send_store['lord/kit_payroll_page'].dup

      # Simulate another writer taking the lock after a tampered client edits the client global.
      @game.player_state['globalVariables']['se_landing_pages']['payroll_login']['choices'] = WEAK
      @game.player_state['globalVariables']['se_landing_pages']['evil'] =
        legacy_page(choices: CONVINCING).merge('pageId' => 'evil', 'targetId' => 'lord')

      assert_equal false, migrate, 'the entry guard returns at once once the flag is set'
      assert_equal first_send, send_store['lord/kit_payroll_page'], 'the first-run send is untouched'
      assert_equal 1, land_store.size, 'no new page is imported on the second pass'
      assert_equal true, land_store['payroll_login']['meetsThreshold'], 'the edited choices are never re-read'
    end

    test 'first-wins on landed true: an existing landed send is not overwritten' do
      build_game(page: legacy_page(choices: CONVINCING), extra_state: {
        'sePhishSends' => { 'lord/kit_payroll_page' => { 'targetId' => 'lord', 'kitId' => 'kit_payroll_page',
                                                         'pageId' => 'payroll_login', 'landed' => true, 'at' => 1 } }
      })
      assert_equal true, migrate
      assert_equal 1, send_store['lord/kit_payroll_page']['at'], 'the earlier landed send wins'
    end

    test 'an empty se_landing_pages still sets the flag so it never re-runs' do
      build_game
      @game.player_state['globalVariables']['se_landing_pages'] = {}
      # legacy_phish_evidence? is false here, but a lock taken by another writer still calls the
      # migration; it must set the flag and not re-read on every later bootstrap.
      assert_equal true, migrate
      assert_equal true, @game.player_state['phishEvidenceMigrated']
      assert_empty land_store
      assert_empty send_store
    end
  end
end
