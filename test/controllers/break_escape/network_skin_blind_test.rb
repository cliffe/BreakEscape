require 'test_helper'
require_relative '../../support/network_ops_scenario'

module BreakEscape
  # S6 (the command-line skin): the server is blind to the skin. The skin is a browser choice read
  # from `?net_skin=` in the page URL and from the player's browser storage; no route reads a
  # `skin` or `net_skin` parameter. Each network and ops route is played twice on the real
  # test_ops_access scenario, once as the client sends it today and once with `skin` and
  # `net_skin` parameters added, and both the answers and the state they leave must be equal.
  class NetworkSkinBlindTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include NetworkOpsRequests

    SCENARIO_PATH = File.expand_path('../../../scenarios/test_ops_access/scenario.json.erb', __dir__)
    OFFICE = 'jack_office_port'.freeze
    PRINTER = 'printer01.admin_page.factory_login'.freeze
    SKIN_PARAMS = [{ skin: 'cli', net_skin: 'cli' }, { skin: 'gui', net_skin: 'gui' }, { skin: 'nonsense', net_skin: '<b>x</b>' }].freeze
    # Times and ids the server makes up on each run; they differ between any two games.
    VOLATILE = /\A(?:at|ts|time|timestamp|created_at|updated_at|id|game_id|serverMs|elapsedMs|opsLogClockAt|opsLogSaves)\z/

    def scenario
      JSON.parse(ScenarioBinding.render(File.read(SCENARIO_PATH)))
    end

    # Writes the keys that vary between two runs as a fixed word, whatever their depth.
    def steady(value)
      case value
      when Hash then value.to_h { |k, v| [k, k.to_s.match?(VOLATILE) ? '-' : steady(v)] }
      when Array then value.map { |v| steady(v) }
      else value
      end
    end

    def send_request(verb, suffix, params, extra)
      public_send(verb, game_path(suffix), params: params.merge(extra), as: :json)
      [response.status, steady(response.parsed_body)]
    end

    # The whole script: every network and ops route, and the answer of each.
    def play(extra)
      game = create_access_game(
        mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
        player_state: { 'currentRoom' => 'lobby', 'encounteredNPCs' => %w[ian],
                        'unlockedRooms' => %w[lobby comms_room supply_room back_office] }
      )
      @game = game
      unlock_object('lobby_cabinet', 'unlocked')
      add_item('technique_card', 'card_factory', 'Field note: factory accounts')
      add_item('pc', 'kit_dropbox', 'Network drop box')
      answers = []
      answers << send_request(:post, 'network/plant', { jack_id: 'office_port' }, extra)
      answers << send_request(:get, 'network', { foothold: OFFICE }, extra)
      answers << send_request(:post, 'network/scan', { foothold: OFFICE, network_id: 'office_lan' }, extra)
      %w[printer01 files01 vault01 desk01].each do |host|
        answers << send_request(:post, 'network/scan', { foothold: OFFICE, host_id: host }, extra)
      end
      [%w[printer01 admin_page], %w[files01 files]].each do |host, service|
        answers << send_request(:post, 'network/check', { foothold: OFFICE, host_id: host, service: service }, extra)
      end
      answers << send_request(:post, 'network/confirm', { foothold: OFFICE, finding_id: PRINTER }, extra)
      answers << send_request(:post, 'network/technique', { foothold: OFFICE, finding_id: PRINTER, item_id: 'card_factory' }, extra)
      answers << send_request(:post, 'network/technique', { foothold: OFFICE, finding_id: PRINTER, item_id: 'card_missing' }, extra)
      answers << send_request(:get, 'network', { foothold: OFFICE }, extra)
      answers << send_request(:post, 'network/unplug', { jack_id: 'office_port' }, extra)
      answers << send_request(:get, 'network', {}, extra)
      state = steady(Game.find(game.id).player_state)
      rows = steady(Game.find(game.id).log_rows_for('access_audit'))
      [answers, state, rows]
    end

    test 'the script reaches every network and ops route and gets real answers' do
      answers, = play({})
      statuses = answers.map(&:first)
      assert_includes statuses, 200
      assert answers.first.last.is_a?(Hash)
      assert_operator answers.length, :>=, 14
    end

    SKIN_PARAMS.each_with_index do |extra, index|
      test "answers, state and audit rows are the same with the parameters #{extra.values.inspect} (#{index})" do
        plain_answers, plain_state, plain_rows = play({})
        skinned_answers, skinned_state, skinned_rows = play(extra)
        plain_answers.zip(skinned_answers).each_with_index do |(plain, skinned), step|
          assert_equal plain, skinned, "step #{step} differs"
        end
        assert_equal plain_state, skinned_state
        assert_equal plain_rows, skinned_rows
        refute_includes skinned_state.to_json, 'net_skin'
        refute_includes skinned_state.to_json, 'skin'
      end
    end
  end
end
