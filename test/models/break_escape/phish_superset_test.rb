# frozen_string_literal: true

require 'test_helper'
require 'json'
require 'erb'

module BreakEscape
  # The superset property (docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md section 7; chunk A
  # review R1 minor 4). For every scenario that authors a kind:'link' landing kit wired to a page
  # plus a phish target, a case the CLIENT judge lands must pass the SERVER gate. The client judge
  # (describeVictimOutcome, landing-page-model.js) returns `submitted` only when the page's
  # meetsThreshold holds and the send landed; the server gate (record_phish_send!'s `landed`) holds
  # when the page is server-built-and-convincing and the send names an authored target and kit. The
  # two meetsThreshold verdicts are the SAME scorer on both sides, kept in parity by
  # phish_score_parity_test (and its node twin). So a convincing build (meetsThreshold) plus an
  # authored send is a client-landed case, and this test proves the server lands every one of them.
  #
  # The scenarios are found by a scan of scenarios/, not a fixed list, so a new authored phish is
  # covered the moment it ships. The convincing choices are DERIVED from each page's authored menus
  # (the best option per factor, the highest-tier .example domain to clear the careful-reader gate),
  # not hand-picked, and the derivation is checked against PhishScore before the send so a page that
  # stopped being solvable fails loudly here.
  class PhishSupersetTest < ActiveSupport::TestCase
    # Scenarios whose source authors both a kind:'link' payload kit and phish targets. The source
    # scan is only a cheap pre-filter tolerant of JSON spacing (A+B R2 minor 2: a substring match
    # of `"kind": "link"` with fixed spacing silently skips a scenario that writes it otherwise);
    # the authoritative kind match is on the PARSED JSON in link_cases, so a pre-filtered scenario
    # with no real link-kit page produces no case and the guard below still asserts coverage.
    def self.phish_scenarios
      Dir.glob(Engine.root.join('scenarios', '*', 'scenario.json.erb')).filter_map do |path|
        raw = File.read(path)
        next unless raw.match?(/"kind"\s*:\s*"link"/) && raw.include?('phishTargets')

        File.basename(File.dirname(path))
      end.sort
    end

    def render_scenario(name)
      srand(1)
      JSON.parse(
        ERB.new(File.read(Engine.root.join('scenarios', name, 'scenario.json.erb')))
          .result(BreakEscape::Mission::ScenarioBinding.new({}).get_binding)
      )
    end

    # The best option per scored factor, so the page scores as high as its menus allow: the pretext
    # brand and purpose, a crisp logo, a matching wording, exactly the real fields, the padlock on,
    # and the highest-tier look-alike domain that still ends in .example (clearing the gate).
    def convincing_choices(page, brands)
      pretext = page['pretext'] || {}
      brand_id = pretext['brandId'] || brands.first&.dig('id')
      brand = brands.find { |b| b['id'] == brand_id } || brands.first || {}
      domains = Array(brand['domains']).select { |d| d['domain'].to_s.end_with?('.example') }
      best_domain = domains.max_by { |d| d['tier'].to_i }
      wording = Array(page['wordings']).find { |w| w['match'] == true } || Array(page['wordings']).first
      {
        'brand' => brand_id,
        'purpose' => pretext['purposeId'],
        'domainId' => best_domain&.dig('id'),
        'logo' => 'crisp',
        'wording' => wording&.dig('id'),
        'fields' => Array(brand['realFields']),
        'padlock' => true
      }
    end

    # Every link-kit page in a scenario, matched on the PARSED JSON `kind` (A+B R2 minor 2, not a
    # source substring), each with its kit id, page def, brands and an authored phish target. A
    # scenario that authors two link-kit pages now yields two cases, so the one reader is checked on
    # each, not only the first.
    def link_cases(scenario)
      social = scenario['social'] || {}
      kits = Array(social.dig('mailClient', 'payloadKit'))
      phish_ids = Array(social['phishTargets']).filter_map { |t| t.is_a?(Hash) ? t['id'] : t }
      pages = Array(social['landingPages'])

      kits.filter_map do |kit|
        next unless kit.is_a?(Hash) && kit['kind'] == 'link' && kit['landingPageId'].is_a?(String)

        page = pages.find { |p| p.is_a?(Hash) && p['id'] == kit['landingPageId'] }
        next unless page

        target_id = (Array(page['targets'].is_a?(Hash) ? page['targets'].keys : []) & phish_ids).first
        target_id ||= phish_ids.first
        next unless target_id

        { kit_id: kit['id'], page_id: kit['landingPageId'], page: page,
          brands: Array(page['brands']), target_id: target_id }
      end
    end

    # A near-threshold set of choices for a page: the weakest single-factor weakening of the
    # convincing set that still meets the target threshold (A+B R2 minor 2). Catches a server that
    # rejected only just-above-threshold pages, which the always-maximal convincing set cannot. Each
    # candidate drops one factor (padlock off, a blurry logo, a lower-tier .example domain, a
    # non-matching wording); the lowest-credibility candidate that still meets is returned, or nil
    # when no weaker-but-passing set exists (then the marginal assertion is skipped for the page).
    def near_threshold_choices(page, brands, base, target_id)
      base_cred = PhishScore.score(page, base, target_id)[:credibility]
      candidates = []

      candidates << base.merge('padlock' => false)
      candidates << base.merge('logo' => 'blurry')

      brand = brands.find { |b| b['id'] == base['brand'] } || {}
      example_domains = Array(brand['domains']).select { |d| d['domain'].to_s.end_with?('.example') }
      lower = example_domains.sort_by { |d| d['tier'].to_i }.find { |d| d['id'] != base['domainId'] }
      candidates << base.merge('domainId' => lower['id']) if lower

      weak_wording = Array(page['wordings']).find { |w| w['match'] != true }
      candidates << base.merge('wording' => weak_wording['id']) if weak_wording

      passing = candidates.filter_map do |choices|
        verdict = PhishScore.score(page, choices, target_id)
        next unless verdict[:meets_threshold] == true
        next unless verdict[:credibility] < base_cred

        [verdict[:credibility], choices]
      end
      passing.min_by(&:first)&.last
    end

    def game_for(scenario_data, page_id, target_id, choices)
      game = create_access_game(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario: scenario_data,
        player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'] }
      )
      game.record_landing_page_build!(
        { 'pageId' => page_id, 'targetId' => target_id, 'choices' => choices },
        scenario: game.scenario_data
      )
      game
    end

    test 'the scan finds at least one authored-phish scenario' do
      assert self.class.phish_scenarios.any?, 'no scenario authors a link kit plus phish targets'
    end

    # Drive a build + send for one set of choices and assert the server gate lands it.
    def assert_server_lands(name, scenario, kase, choices, label)
      verdict = PhishScore.score(kase[:page], choices, kase[:target_id])
      assert_equal true, verdict[:meets_threshold],
                   "#{name}/#{kase[:page_id]} (#{label}): the choices must score convincing (client would land), got #{verdict.inspect}"

      # The client judge lands this exact case: describeVictimOutcome submits only when
      # meetsThreshold (above) and the send landed, which an authored send to this target does.
      game = game_for(scenario, kase[:page_id], kase[:target_id], choices)
      result = game.record_phish_send!(
        { 'targetId' => kase[:target_id], 'kitId' => kase[:kit_id], 'fromAccount' => nil },
        scenario: game.scenario_data
      )
      entry = (game.player_state['sePhishSends'] || {})["#{kase[:target_id]}/#{kase[:kit_id]}"]
      assert entry, "#{name}/#{kase[:page_id]} (#{label}): the send is recorded"
      assert_equal true, entry['landed'],
                   "#{name}/#{kase[:page_id]} (#{label}): the server gate must pass the client-landed case (#{result.inspect})"
    end

    phish_scenarios.each do |name|
      test "superset: every client-landed link-kit page on #{name} passes the server gate" do
        scenario = render_scenario(name)
        cases = link_cases(scenario)
        assert cases.any?, "#{name} authors a link kit wired to a page with a phish target"

        cases.each do |kase|
          convincing = convincing_choices(kase[:page], kase[:brands])
          assert_server_lands(name, scenario, kase, convincing, 'convincing')

          marginal = near_threshold_choices(kase[:page], kase[:brands], convincing, kase[:target_id])
          assert_server_lands(name, scenario, kase, marginal, 'near-threshold') if marginal
        end
      end
    end
  end
end
