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
    # Scenarios whose source authors both a kind:'link' payload kit and phish targets.
    def self.phish_scenarios
      Dir.glob(Engine.root.join('scenarios', '*', 'scenario.json.erb')).filter_map do |path|
        raw = File.read(path)
        next unless raw.include?('"kind": "link"') && raw.include?('phishTargets')

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

    # A page's link kit (id + landing page id), the page def and an authored phish target for it.
    def link_case(scenario)
      social = scenario['social'] || {}
      kits = Array(social.dig('mailClient', 'payloadKit'))
      phish_ids = Array(social['phishTargets']).filter_map { |t| t.is_a?(Hash) ? t['id'] : t }
      pages = Array(social['landingPages'])

      kits.each do |kit|
        next unless kit.is_a?(Hash) && kit['kind'] == 'link' && kit['landingPageId'].is_a?(String)

        page = pages.find { |p| p.is_a?(Hash) && p['id'] == kit['landingPageId'] }
        next unless page

        brands = Array(page['brands'])
        target_id = (Array(page['targets'].is_a?(Hash) ? page['targets'].keys : []) & phish_ids).first
        target_id ||= phish_ids.first
        next unless target_id

        return { kit_id: kit['id'], page_id: kit['landingPageId'], page: page,
                 brands: brands, target_id: target_id }
      end
      nil
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

    phish_scenarios.each do |name|
      test "superset: a client-landed case on #{name} passes the server gate" do
        scenario = render_scenario(name)
        kase = link_case(scenario)
        assert kase, "#{name} authors a link kit wired to a page with a phish target"

        choices = convincing_choices(kase[:page], kase[:brands])
        verdict = PhishScore.score(kase[:page], choices, kase[:target_id])
        assert_equal true, verdict[:meets_threshold],
                     "#{name}: the derived choices must score convincing (client would land), got #{verdict.inspect}"

        # The client judge lands this exact case: describeVictimOutcome submits only when
        # meetsThreshold (above) and the send landed, which an authored send to this target does.
        game = game_for(scenario, kase[:page_id], kase[:target_id], choices)
        result = game.record_phish_send!(
          { 'targetId' => kase[:target_id], 'kitId' => kase[:kit_id], 'fromAccount' => nil },
          scenario: game.scenario_data
        )
        entry = (game.player_state['sePhishSends'] || {})["#{kase[:target_id]}/#{kase[:kit_id]}"]
        assert entry, "#{name}: the send is recorded"
        assert_equal true, entry['landed'],
                     "#{name}: the server gate must pass the client-landed case (#{result.inspect})"
      end
    end
  end
end
