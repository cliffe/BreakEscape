# frozen_string_literal: true

require 'test_helper'
require 'json'
require_relative '../../support/capture_proof_scenario'

module BreakEscape
  # The one-time legacy phish-evidence import over the real routes (chunk B,
  # docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md sections 9.1, 14). The scenario bootstrap on a
  # legacy save takes the lock via legacy_phish_evidence?, runs migrate_legacy_phish_evidence!
  # before the capture stamp in one locked pass, so the stamp (now reading the two server stores
  # the migration wrote, chunk C) proves the capture at once. sync_state never runs it, and the
  # server-owned phishEvidenceMigrated flag is never accepted from a sync body.
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
                   'the stamp in the same locked pass proves the capture off the two server stores the migration wrote'
    end

    # Chunk C: an honest legacy save with NO surviving sent mail (the mailbox cap trimmed it) now
    # gets the credential on its first bootstrap. The migration imports the landed send off the
    # durable victim.submitted marker and the re-derived build, and the chunk C reader reads that
    # server store, so capture_secrets serves the secret with no stored sent message at all.
    test 'an honest legacy save with no surviving sent mail is stamped and serves the secret on its first bootstrap' do
      build_game(legacy_state(with_sent_mail: false))
      refute @game.player_state.key?('mailState'), 'this old save kept no sent mail record'

      get game_path('scenario'), as: :json
      assert_response :success

      state = @game.reload.player_state
      assert_equal true, state.dig('sePhishSends', 'lord/kit_payroll_page', 'landed'),
                   'the send is imported off the victim.submitted marker, not a sent mail record'
      assert_equal true, state.dig('seCaptures', 'lord', 'proven'), 'the capture is stamped proven'

      get "#{game_path('capture_secrets')}", as: :json
      assert_response :success
      assert_equal 'Sofia2026!', JSON.parse(response.body).dig('secrets', 'lord'),
                   'the chunk C reader serves the secret off the migrated server store'
    end

    # Minor 1 (review R1): the pure pre-store co-migration. A save made before chunk A holds its
    # capture claim AND its build/send facts in two client globals, with no top-level seCaptures and
    # no server stores. On one bootstrap migrate_legacy_captures! recreates the capture from
    # globalVariables.se_captures, migrate_legacy_phish_evidence! fills the two server stores from
    # globalVariables.se_landing_pages, and the stamp runs, all in the one locked pass. The old
    # client co-writes the se_captures global with the victim.submitted transition, so an honest
    # pre-store save always carries both globals together.
    def legacy_globals_state(choices: CONVINCING)
      page = { 'pageId' => 'payroll_login', 'targetId' => 'lord', 'built' => true,
               'credibility' => 99, 'meetsThreshold' => true, 'choices' => choices,
               'victim' => { 'visited' => true, 'submitted' => true }, 'at' => 1_731_600_000_000 }
      {
        'currentRoom' => 'office', 'unlockedRooms' => ['office'],
        'globalVariables' => {
          'se_captures' => { 'lord' => { 'targetId' => 'lord', 'kind' => 'credential',
                                         'address' => 's.lord@ledgerwell.example', 'at' => 1_731_600_000_000 } },
          'se_landing_pages' => { 'payroll_login' => page }
        }
      }
    end

    test 'a pure pre-store save with both legacy globals co-migrates and serves the secret on one bootstrap' do
      build_game(legacy_globals_state)
      before = @game.player_state
      assert before.dig('globalVariables', 'se_captures', 'lord'), 'the legacy capture global is present before the bootstrap'
      assert before.dig('globalVariables', 'se_landing_pages', 'payroll_login'), 'the legacy build global is present before the bootstrap'
      assert_empty before['seCaptures'] || {}, 'no top-level capture record before the bootstrap'
      assert_empty before['seLandingPages'] || {}, 'no server build store before the bootstrap'
      assert_empty before['sePhishSends'] || {}, 'no server send store before the bootstrap'

      get game_path('scenario'), as: :json
      assert_response :success

      state = @game.reload.player_state
      assert_equal true, state['phishEvidenceMigrated'], 'the phish-evidence migration ran and set its flag'
      assert_nil state.dig('globalVariables', 'se_captures'), 'migrate_legacy_captures! consumed the legacy capture global'
      assert_equal true, state.dig('seCaptures', 'lord', 'proven'),
                   'the capture is recreated from the legacy global and proven in the same locked pass'
      assert_equal true, state.dig('seLandingPages', 'payroll_login', 'meetsThreshold'), 'the build store is populated'
      assert_equal true, state.dig('sePhishSends', 'lord/kit_payroll_page', 'landed'), 'the send store is populated'

      get game_path('capture_secrets'), as: :json
      assert_response :success
      assert_equal 'Sofia2026!', JSON.parse(response.body).dig('secrets', 'lord'),
                   'capture_secrets serves the secret after the one-bootstrap co-migration'
    end

    # The weak-choices twin, withheld, now carrying the legacy se_captures global. Chunk C closes the
    # gap where migrate_legacy_captures! stamped a phish target proven: true off the client global
    # alone: a phish capture now follows the server-store path, recorded proven only when the
    # re-derived build evidence holds. So the honest co-migrating save (CONVINCING, served) and its
    # weak twin (below threshold, withheld) carry the same two legacy globals; only the choices
    # differ. The build's domain is below the page's threshold, so the server re-derives
    # meetsThreshold: false, no send lands, the stamp cannot prove the capture and capture_secrets
    # withholds the secret.
    WEAK_CHOICES = CONVINCING.merge('domainId' => 'd_unrelated').freeze

    test 'the weak-choices twin keeps the se_captures global, migrates an unmet build and the secret is withheld' do
      build_game(legacy_globals_state(choices: WEAK_CHOICES))
      assert @game.player_state.dig('globalVariables', 'se_captures', 'lord'),
             'the weak twin carries the same legacy capture global as the honest save'

      get game_path('scenario'), as: :json
      assert_response :success

      st = @game.reload.player_state
      assert_equal true, st['phishEvidenceMigrated'], 'the migration ran'
      assert_nil st.dig('globalVariables', 'se_captures'), 'migrate_legacy_captures! consumed the legacy capture global'
      assert st.dig('seCaptures', 'lord').is_a?(Hash), 'the capture is recreated from the legacy global'
      assert_equal false, st.dig('seLandingPages', 'payroll_login', 'meetsThreshold'),
                   'the server re-derives the weak build as not meeting the threshold'
      assert_equal false, st.dig('sePhishSends', 'lord/kit_payroll_page', 'landed'),
                   'a build that does not meet the threshold lands no send'
      refute st.dig('seCaptures', 'lord', 'proven'),
             'the phish capture is recorded unproven off the client global and the stamp cannot prove it'

      get game_path('capture_secrets'), as: :json
      assert_response :success
      assert_nil JSON.parse(response.body).dig('secrets', 'lord'), 'the secret is withheld for a weak build'
    end

    # A legacy se_captures global for a phish target with NO se_landing_pages at all (the old client
    # dropped or never wrote the build global). migrate_legacy_captures! records the capture unproven
    # (a phish target is never proven off the client global), migrate_legacy_phish_evidence! finds no
    # build to import, and the stamp has no server evidence to prove it off. The secret is withheld.
    test 'a phish se_captures global with no se_landing_pages migrates unproven and the secret is withheld' do
      build_game(
        'currentRoom' => 'office', 'unlockedRooms' => ['office'],
        'globalVariables' => {
          'se_captures' => { 'lord' => { 'targetId' => 'lord', 'kind' => 'credential',
                                         'address' => 's.lord@ledgerwell.example', 'at' => 1_731_600_000_000 } }
        }
      )

      get game_path('scenario'), as: :json
      assert_response :success

      st = @game.reload.player_state
      assert_nil st.dig('globalVariables', 'se_captures'), 'migrate_legacy_captures! consumed the legacy capture global'
      assert st.dig('seCaptures', 'lord').is_a?(Hash), 'the capture is recreated from the legacy global'
      refute st.dig('seCaptures', 'lord', 'proven'), 'with no build evidence the phish capture stays unproven'
      assert_empty st['seLandingPages'] || {}, 'no build store: there was no se_landing_pages to migrate'

      get game_path('capture_secrets'), as: :json
      assert_response :success
      assert_nil JSON.parse(response.body).dig('secrets', 'lord'),
                 'the secret is withheld with no landing page build'
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
      assert_empty state['seLandingPages'] || {}, 'the build store stays empty on a sync'
      assert_empty state['sePhishSends'] || {}, 'the send store stays empty on a sync'
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
