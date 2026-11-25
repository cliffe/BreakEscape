require 'test_helper'
require 'json'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # Ops follow-up A1: a hash keyring row names the held file that proves it (`heldItem`), and the
  # answers the cracker client reads are recorded in test/js/fixtures/ops_crack/answers.json. This
  # file plays the real routes and compares the fixture with what they serve; it rewrites the fixture
  # only under RECORD_FIXTURE=1.
  class OpsCrackHeldItemTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests
    include ActiveSupport::Testing::TimeHelpers

    ROOT = File.expand_path('../../..', __dir__)
    SCENARIO_PATH = File.join(ROOT, 'scenarios/test_ops_crack/scenario.json.erb')
    FIXTURE_PATH = File.join(ROOT, 'test/js/fixtures/ops_crack/answers.json')
    FINDING = 'desk_panel.admin_page.factory_login'.freeze
    FACTS = %w[dana_pet dana_town dana_year].freeze
    PASSWORDS = %w[JuniperAshby2003 Welcome-Desk-1 Tq7-orchid-kelp-N2vX].freeze
    T0 = Time.zone.local(2026, 11, 24, 12, 0, 0)

    FILES = {
      'dana_file' => ['dana_record.dat', 'dana_hash'],
      'farah_file' => ['farah_record.dat', 'farah_hash'],
      'sparedesk_file' => ['sparedesk_record.dat', 'sparedesk_hash'],
      'eli_hash_file' => ['eli_record.dat', 'eli_hash']
    }.freeze

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    def items(*ids)
      ids.map { |id| { 'id' => id, 'type' => 'text_file', 'name' => FILES[id][0], 'credential' => FILES[id][1] } }
    end

    def build(inventory: [], extra: {})
      build_network_game({ 'unlockedRooms' => %w[lobby bay store], 'encounteredNPCs' => %w[dana farah eli deskadmin sparedesk],
                           'inventory' => items(*inventory) }.merge(extra), scenario)
    end

    def keyring
      get game_path('keyring'), as: :json
      assert_response :success, response.body
      response.parsed_body
    end

    def crack(hash_id, facts = [])
      post game_path('crack'), params: { hash_id: hash_id, facts: facts }, as: :json
      response.parsed_body
    end

    def hash_row(body, id)
      body['entries'].find { |e| e['id'] == id }
    end

    # The whole played run, as served; the fixture is this hash.
    def played_answers
      out = {}
      travel_to T0 do
        build(inventory: %w[dana_file], extra: { 'earnedFacts' => FACTS })
        out['keyringOneReady'] = keyring
        out['crackRunning'] = crack('dana_hash', %w[dana_pet dana_town])
        out['keyringRunning'] = keyring
        travel 11.seconds
        out['crackNomatch'] = crack('dana_hash', %w[dana_pet dana_town])
        assert_equal 'running', crack('dana_hash', FACTS)['status']
        travel 11.seconds
        out['crackCracked'] = crack('dana_hash', FACTS)
        out['keyringCracked'] = keyring
        out['crackRefusal'] = crack('no_such_hash', [])
      end
      travel_to T0 do
        build(inventory: %w[dana_file], extra: { 'earnedFacts' => %w[dana_pet] })
        out['crackNeedMoreFacts'] = crack('dana_hash', %w[dana_pet])
      end
      travel_to T0 do
        build(inventory: %w[dana_file farah_file])
        out['keyringTwoHashes'] = keyring
      end
      travel_to T0 do
        build(inventory: %w[eli_hash_file])
        assert_equal 'nomatch', crack('eli_hash')['status']
        out['crackInfeasible'] = crack('eli_hash', [])
        out['keyringInfeasible'] = keyring
      end
      normalise(out)
    end

    # The rev and the token differ with each game (a per-game secret); every other byte is as served.
    def normalise(node)
      case node
      when Hash
        node.each_with_object({}) do |(k, v), h|
          h[k] = if k == 'rev' && v.is_a?(String) then 'REVISION'
                 elsif k == 'token' && v.is_a?(String) then "XXXX-XXXX-XXXX-XXXX-XXXX-#{node.dig('account', 'npcId').to_s.upcase[0, 4].ljust(4, 'X')}"
                 else normalise(v)
                 end
        end
      when Array then node.map { |v| normalise(v) }
      else node
      end
    end

    test 'every file-backed hash row names its file, and the technique row names none' do
      build(inventory: %w[dana_file farah_file sparedesk_file eli_hash_file], extra: { 'opsUsed' => [FINDING] })
      body = keyring
      { 'dana_hash' => 'dana_file', 'farah_hash' => 'farah_file', 'sparedesk_hash' => 'sparedesk_file',
        'eli_hash' => 'eli_hash_file' }.each do |id, file|
        assert_equal file, hash_row(body, id)['heldItem'], id
      end
      admin = hash_row(body, 'deskadmin_hash')
      assert admin, 'the technique has run, so the row is listed'
      refute admin.key?('heldItem')
      body['entries'].select { |e| e['kind'] == 'hash' }.each do |e|
        %w[credential recipe password facts].each { |k| refute e.key?(k), "#{e['id']} has #{k}" }
      end
      PASSWORDS.each { |pw| refute_includes response.body, pw }
    end

    test 'a hash row appears only while its file is held' do
      build
      assert_empty keyring['entries'].select { |e| e['kind'] == 'hash' }
    end

    test 'the recorded answers match the real routes' do
      played = played_answers
      if ENV['RECORD_FIXTURE'] == '1'
        File.write(FIXTURE_PATH, "#{JSON.pretty_generate(played)}\n")
      end
      recorded = JSON.parse(File.read(FIXTURE_PATH))
      assert_equal played, recorded, 'answers.json is stale: rerun with RECORD_FIXTURE=1'
      assert_equal %w[cracked infeasible needMoreFacts nomatch running], %w[crackCracked crackInfeasible crackNeedMoreFacts crackNomatch crackRunning].map { |k| recorded[k]['status'] }.sort
      assert_equal 'dana_file', hash_row(recorded['keyringOneReady'], 'dana_hash')['heldItem']
      assert_equal 2, recorded['keyringTwoHashes']['entries'].count { |e| e['kind'] == 'hash' }
      assert_equal 'cracked', hash_row(recorded['keyringCracked'], 'dana_hash')['status']
      assert_equal 'cracked', hash_row(recorded['keyringCracked'], 'dana.cracked')['source']
    end
  end
end
