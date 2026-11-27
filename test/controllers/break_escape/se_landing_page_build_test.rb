# frozen_string_literal: true

require 'test_helper'
require 'json'
require_relative '../../support/capture_proof_scenario'

module BreakEscape
  # Phish evidence Route 1 (docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md sections 3.2, 15
  # tests 1, 4, 12). POST se/landing_page records the build the server verified itself: it
  # validates the client's choices against the page's authored menus and recomputes the verdict
  # with BreakEscape::PhishScore, never trusting a client score. Nothing reads the store for the
  # gate yet (chunk 3), so these tests assert only the write and the refusals.
  class SeLandingPageBuildTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    CP = CaptureProofScenario

    # The authored sign-in page from the shared parity fixture (page id payroll_login), with its
    # full brand/domain/wording/field/target menus, dropped into a CP scenario as its landing page.
    PAGE = JSON.parse(
      File.read(File.expand_path('../../fixtures/files/phish_score_parity/fixtures.json', __dir__))
    )['pages']['signin'].freeze

    # The authored fake-check page from the same parity fixture (page id e10_check, target
    # visitor), its own host/pretext/steps/urgency menus. ca10_downloads_and_fake_checks ships a
    # pageType: 'fakeCheck' page, so the route's valid_check_choices? / recompute branch is live.
    FAKECHECK = JSON.parse(
      File.read(File.expand_path('../../fixtures/files/phish_score_parity/fixtures.json', __dir__))
    )['pages']['fakecheck'].freeze

    # All four persuasion factors full (genuine host, matching pretext, smooth steps, calm
    # urgency): credibility 100, over the visitor threshold of 70.
    CHECK_CONVINCING = { 'check' => { 'hostId' => 'genuine', 'pretextId' => 'fits',
                                      'stepsId' => 'smooth', 'urgencyId' => 'calm' } }.freeze

    CONVINCING = { 'brand' => 'ledgerwell', 'purpose' => 'payslip', 'domainId' => 'd_word',
                   'logo' => 'crisp', 'wording' => 'w_formal', 'fields' => %w[email password],
                   'padlock' => true }.freeze
    WEAK = { 'brand' => 'ledgerwell', 'purpose' => 'signin', 'domainId' => 'd_letter',
             'logo' => 'blurry', 'wording' => 'w_slips', 'fields' => %w[email password card_number],
             'padlock' => false }.freeze

    def se_scenario
      scenario = CP.scenario
      scenario['social'] ||= {}
      scenario['social']['landingPages'] = [PAGE.deep_dup]
      scenario['social']['phishTargets'] = [{ 'id' => 'lord' }]
      scenario
    end

    def fakecheck_scenario
      scenario = CP.scenario
      scenario['social'] ||= {}
      scenario['social']['landingPages'] = [FAKECHECK.deep_dup]
      scenario['social']['phishTargets'] = [{ 'id' => 'visitor' }]
      scenario
    end

    def build_game(scenario = se_scenario, player_state = {})
      @game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'] }.merge(player_state)
      )
    end

    def game_path(suffix)
      "/break_escape/games/#{@game.id}/#{suffix}"
    end

    def post_build(page_id: 'payroll_login', target_id: 'lord', choices: CONVINCING)
      post game_path('se/landing_page'),
           params: { pageId: page_id, targetId: target_id, choices: choices }, as: :json
    end

    def store
      @game.reload.player_state['seLandingPages'] || {}
    end

    test 'a convincing build records built, the server meetsThreshold and credibility' do
      build_game
      post_build(choices: CONVINCING)
      assert_response :success, response.body
      assert_equal true, response.parsed_body['success']

      entry = store['payroll_login']
      assert entry, 'the build is stored under its page id'
      assert_equal true, entry['built']
      assert_equal true, entry['meetsThreshold']
      assert_equal 87, entry['credibility']
      assert_equal 'lord', entry['targetId']
    end

    test 'a weak build records built true but meetsThreshold false (the server verdict, not the body)' do
      build_game
      post_build(choices: WEAK)
      assert_response :success, response.body

      entry = store['payroll_login']
      assert_equal true, entry['built']
      assert_equal false, entry['meetsThreshold']
      assert_equal 34, entry['credibility']
    end

    test 'an off-menu domainId is refused and nothing is stored (test 4)' do
      build_game
      post_build(choices: CONVINCING.merge('domainId' => 'd_nonexistent'))
      assert_response :unprocessable_entity
      assert_equal 'invalid', response.parsed_body['reason']
      assert_empty store
    end

    test 'an unknown pageId is refused' do
      build_game
      post_build(page_id: 'no_such_page')
      assert_response :unprocessable_entity
      assert_empty store
    end

    test 'a target the page is not authored for is refused' do
      build_game
      post_build(target_id: 'stranger')
      assert_response :unprocessable_entity
      assert_empty store
    end

    test 'an off-menu wording id is refused' do
      build_game
      post_build(choices: CONVINCING.merge('wording' => 'w_injected'))
      assert_response :unprocessable_entity
      assert_empty store
    end

    test 'an unknown form field id is refused' do
      build_game
      post_build(choices: CONVINCING.merge('fields' => %w[email password secret_backdoor]))
      assert_response :unprocessable_entity
      assert_empty store
    end

    test 'hostile oversized pageId is refused with no exception and nothing stored (test 12)' do
      build_game
      post_build(page_id: 'x' * 5000)
      assert_response :unprocessable_entity
      assert_empty store
    end

    test 'a rebuild is last-score-wins: a weak page rebuilt convincing updates the verdict' do
      build_game
      post_build(choices: WEAK)
      assert_response :success
      assert_equal false, store['payroll_login']['meetsThreshold']

      post_build(choices: CONVINCING)
      assert_response :success
      entry = store['payroll_login']
      assert_equal true, entry['meetsThreshold']
      assert_equal 87, entry['credibility']
      assert_equal 1, store.size, 'the rebuild replaces the entry, it does not add a row'
    end

    # A+B R2 minor 1: a reload re-drive (body redrive:true) must never downgrade a recorded build.
    # A convincing page is recorded, then a re-drive posts weaker choices (a drifted client global):
    # the server keeps the stronger recorded verdict. A normal rebuild (no flag) would last-wins.
    test 'a re-drive never downgrades a recorded convincing build' do
      build_game
      post_build(choices: CONVINCING)
      assert_response :success
      assert_equal true, store['payroll_login']['meetsThreshold']

      post game_path('se/landing_page'),
           params: { pageId: 'payroll_login', targetId: 'lord', choices: WEAK, redrive: true }, as: :json
      assert_response :success
      entry = store['payroll_login']
      assert_equal true, entry['meetsThreshold'], 'the re-drive does not replace the strong build with a weak one'
      assert_equal 87, entry['credibility'], 'the recorded convincing verdict is kept'
      assert_equal true, response.parsed_body['meetsThreshold'], 'the answer reports the kept strong verdict'
    end

    # An honest deliberate weaken (no re-drive flag) still lowers the verdict (live case f: a
    # rebuild replaces the entry), so the downgrade guard bites only the reload re-drive.
    test 'an honest rebuild without the re-drive flag still lowers a convincing build' do
      build_game
      post_build(choices: CONVINCING)
      assert_response :success
      assert_equal true, store['payroll_login']['meetsThreshold']

      post_build(choices: WEAK)
      assert_response :success
      assert_equal false, store['payroll_login']['meetsThreshold'], 'a normal rebuild is last-wins'
    end

    test 'a convincing fakeCheck build records the server verdict from the check choices' do
      build_game(fakecheck_scenario)
      post_build(page_id: 'e10_check', target_id: 'visitor', choices: CHECK_CONVINCING)
      assert_response :success, response.body
      assert_equal true, response.parsed_body['success']

      entry = store['e10_check']
      assert entry, 'the fake-check build is stored under its page id'
      assert_equal true, entry['built']
      assert_equal true, entry['meetsThreshold']
      assert_equal 100, entry['credibility']
      assert_equal 'visitor', entry['targetId']
      # normalise_build_choices keeps the four-key check only, server-verified, off the body score.
      assert_equal({ 'hostId' => 'genuine', 'pretextId' => 'fits', 'urgencyId' => 'calm',
                     'stepsId' => 'smooth' }, entry['choices']['check'])
    end

    test 'an off-menu fakeCheck host id is refused and nothing is stored' do
      build_game(fakecheck_scenario)
      post_build(page_id: 'e10_check', target_id: 'visitor',
                 choices: { 'check' => CHECK_CONVINCING['check'].merge('hostId' => 'evil_host') })
      assert_response :unprocessable_entity
      assert_equal 'invalid', response.parsed_body['reason']
      assert_empty store
    end
  end
end
