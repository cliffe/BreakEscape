# frozen_string_literal: true

require 'test_helper'
require 'json'

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
