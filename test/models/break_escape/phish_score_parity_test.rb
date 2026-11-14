# frozen_string_literal: true

require 'test_helper'
require 'json'
require 'erb'

module BreakEscape
  # Parity for the landing-page scorer (docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md
  # section 4). BreakEscape::PhishScore.score (the Ruby port) must return the same
  # credibility / meetsThreshold / blocked as the recorded JS result for each shared fixture.
  # The matching node test (test/js/social-phish-score-parity.test.mjs) asserts the JS scorer
  # in landing-page-model.js still produces those recorded results, so a change to either
  # scorer that is not mirrored fails a red test.
  class PhishScoreParityTest < ActiveSupport::TestCase
    FIXTURES = JSON.parse(
      File.read(File.expand_path('../../fixtures/files/phish_score_parity/fixtures.json', __dir__))
    ).freeze

    FIXTURES['cases'].each do |kase|
      test "port matches recorded JS result: #{kase['name']}" do
        page = FIXTURES['pages'].fetch(kase['page'])
        result = PhishScore.score(page, kase['choices'], kase['target'])
        expected = kase['expected']

        assert_equal expected['blocked'], result[:blocked], 'blocked'
        if expected['blocked']
          # A blocked page is never convincing and reports no credibility.
          assert_equal false, result[:meets_threshold], 'meets_threshold on a blocked page'
          assert_nil result[:credibility], 'credibility on a blocked page'
        else
          assert_equal expected['credibility'], result[:credibility], 'credibility'
          assert_equal expected['gatesPassed'], result[:gates_passed], 'gates_passed'
          assert_equal expected['meetsThreshold'], result[:meets_threshold], 'meets_threshold'
        end
      end
    end

    # Minor 1 (build review R1): the frozen `signin` fixture is a scoring-equivalent copy of the
    # lab's real payroll_login page, so drift between the fixture and the authored page is not
    # caught by the fixture cases alone. This reads the page straight from the rendered
    # lab_social_engineering scenario, so if an author later changes its linkThreshold, a domain
    # tier, the points table, the pretext or the field set, the port's verdict on the real page
    # moves and this test fails, flagging the drift the frozen fixture cannot. (JS/Ruby port drift
    # stays covered by the 14 generic cases above; the real-page honest-solve on the JS side is
    # the chunk-4 PhishJudge fixture.)
    def real_lab_payroll_page
      srand(1)
      data = JSON.parse(
        ERB.new(File.read(Engine.root.join('scenarios', 'lab_social_engineering', 'scenario.json.erb')))
          .result(BreakEscape::Mission::ScenarioBinding.new({}).get_binding)
      )
      Array(data.dig('social', 'landingPages')).find { |p| p.is_a?(Hash) && p['id'] == 'payroll_login' }
    end

    test 'the real lab payroll_login page scores the authored honest-convincing and weak verdicts' do
      page = real_lab_payroll_page
      assert page, 'the lab scenario still authors a payroll_login landing page'

      convincing = PhishScore.score(page, {
        'brand' => 'ledgerwell', 'purpose' => 'payslip', 'domainId' => 'd_word', 'logo' => 'crisp',
        'wording' => 'w_formal', 'fields' => %w[email password], 'padlock' => true
      }, 'lord')
      assert_equal 87, convincing[:credibility], 'the honest convincing build still scores 87'
      assert_equal true, convincing[:gates_passed]
      assert_equal true, convincing[:meets_threshold], 'the convincing build still clears the lab threshold'

      weak = PhishScore.score(page, {
        'brand' => 'ledgerwell', 'purpose' => 'signin', 'domainId' => 'd_letter', 'logo' => 'blurry',
        'wording' => 'w_slips', 'fields' => %w[email password card_number], 'padlock' => false
      }, 'lord')
      assert_equal 34, weak[:credibility]
      assert_equal false, weak[:gates_passed], 'the weak build misses the careful-reader tier gate'
      assert_equal false, weak[:meets_threshold]
    end

    test 'the point tables match the JS defaults' do
      assert_equal 15, PhishScore::DEFAULT_POINTS['brand']
      assert_equal [0, 10, 22, 35], PhishScore::DEFAULT_POINTS['domain']
      assert_equal %w[borrowedTrust pretext stepWording urgency], PhishScore::CHECK_FACTOR_ORDER
    end

    test 'a non-numeric linkThreshold reads as no threshold, never convincing' do
      page = FIXTURES['pages'].fetch('signin').dup
      page = JSON.parse(page.to_json)
      page['targets'] = { 'lord' => { 'linkThreshold' => 'oops', 'minDomainTier' => 2 } }
      result = PhishScore.score(page, {
        'brand' => 'ledgerwell', 'purpose' => 'payslip', 'domainId' => 'd_vv', 'logo' => 'crisp',
        'wording' => 'w_formal', 'fields' => %w[email password], 'padlock' => true
      }, 'lord')
      assert_equal 100, result[:credibility]
      assert_equal false, result[:meets_threshold]
    end
  end
end
