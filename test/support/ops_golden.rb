# The shared "unchanged scenario" golden mechanism (docs/achitechture/OPS_LOG_ROWS_PLAN.md
# sections 10 and 12, build item 1). Every ops plan that must leave existing behaviour alone
# adds a fixture to test/fixtures/files/ops_unchanged/ and uses this; there is no second one.
#
# A fixture is JSON: a fixed script played through the real routes, and the answers and
# server state main gave when it was captured.
#
#   {
#     "name": "log_unlock_refusals", "description": "...",
#     "clock": "2026-01-15T12:00:00Z",          # frozen for the whole play (server times, token clocks)
#     "scenario": { ... },                      # scenario_data, built as the controller tests build it
#     "playerState": { ... },                   # seeded straight into the game (inventory, unlocked rooms)
#     "steps": [ { "id": "vault_wrong", "method": "POST", "path": "unlock", "params": { ... } } ],
#     "expected": { "answers": [ { "id": ..., "status": 422, "body": { ... } } ], "state": { ... } }
#   }
#
# "path" is relative to /break_escape/games/<id>/ ; the game id is replaced by "{game}" everywhere
# in the answers and the state, so two runs compare. See lib/tasks/ops_unchanged.rake for how to
# add a fixture and capture or replay it.
#
# Two normalisations (plan 12, build item 1), both applied when comparing:
#   1. every Game::ACCESS_STATE_DEFAULTS key that is empty in the live state and absent from the
#      fixture's state is dropped from the live state, so a new empty key needs no registration;
#   2. the clock is frozen (OpsGolden.play runs under travel_to), so server times and token
#      clocks are the same on every run.
require 'json'

module OpsGolden
  DIR = File.expand_path('../fixtures/files/ops_unchanged', __dir__)
  GAME_TOKEN = '{game}'.freeze
  DEFAULT_CLOCK = '2026-01-15T12:00:00Z'.freeze

  module_function

  def fixture_paths
    Dir[File.join(DIR, '*.json')].sort
  end

  def load_fixture(path)
    JSON.parse(File.read(path))
  end

  def dump(data)
    "#{JSON.pretty_generate(data)}\n"
  end

  # Plays the script on a game built from the fixture. +test+ is an ActionDispatch::IntegrationTest
  # (it supplies get/post, create_access_game and the time helpers); +mission+ and +player+ are the
  # test fixtures records the other controller tests use. Returns { 'answers' => [...], 'state' => {...} }.
  def play(test, fixture, mission:, player:)
    result = nil
    test.travel_to(Time.iso8601(fixture['clock'] || DEFAULT_CLOCK)) do
      game = test.create_access_game(mission: mission, player: player, scenario: fixture['scenario'],
                                     player_state: fixture['playerState'] || {})
      answers = fixture['steps'].map { |step| answer_for(test, game, step) }
      state = game.reload.player_state
      result = scrub({ 'answers' => answers, 'state' => state }, game.id)
    end
    result
  end

  def answer_for(test, game, step)
    url = "/break_escape/games/#{game.id}/#{step['path']}"
    params = step['params']
    case (step['method'] || 'GET').upcase
    when 'GET' then test.get(url, params: params, as: :json)
    when 'POST' then test.post(url, params: params || {}, as: :json)
    when 'PUT' then test.put(url, params: params || {}, as: :json)
    when 'PATCH' then test.patch(url, params: params || {}, as: :json)
    else raise ArgumentError, "unsupported method #{step['method']}"
    end
    response = test.response
    body = begin
      JSON.parse(response.body)
    rescue JSON::ParserError
      response.body
    end
    { 'id' => step['id'], 'status' => response.status, 'body' => body }
  end

  # The game id differs on every run: replace it in strings and in a "gameId" or "game_id" value.
  def scrub(value, game_id, key = nil)
    case value
    when Hash then value.to_h { |k, v| [k, scrub(v, game_id, k)] }
    when Array then value.map { |v| scrub(v, game_id) }
    when String then value.gsub(%r{/games/#{game_id}\b}, "/games/#{GAME_TOKEN}")
    when Integer then %w[gameId game_id].include?(key) && value == game_id ? GAME_TOKEN : value
    else value
    end
  end

  # Normalisation 1: drop each ACCESS_STATE_DEFAULTS key that is empty in +actual+ state and absent
  # from +expected+ state. +defaults+ is Game::ACCESS_STATE_DEFAULTS.
  def strip_empty_defaults(actual_state, expected_state, defaults)
    actual_state.reject do |key, value|
      defaults.key?(key) && !expected_state.key?(key) && empty?(value)
    end
  end

  def empty?(value)
    value.nil? || (value.respond_to?(:empty?) && value.empty?)
  end

  # The differences between a fixture's expected result and a live +actual+, as readable lines;
  # an empty list is a match. Answer bodies and statuses compare for equality, and so does state
  # once normalised.
  def compare(expected, actual, defaults:)
    actual = actual.merge('state' => strip_empty_defaults(actual['state'] || {}, expected['state'] || {}, defaults))
    diffs = []
    exp_answers = expected['answers'] || []
    act_answers = actual['answers'] || []
    diffs << "answer count: expected #{exp_answers.size}, got #{act_answers.size}" if exp_answers.size != act_answers.size
    exp_answers.zip(act_answers).each do |exp, act|
      next unless act

      diffs.concat(diff(exp['status'], act['status'], "answers[#{exp['id']}].status"))
      diffs.concat(diff(exp['body'], act['body'], "answers[#{exp['id']}].body"))
    end
    diffs.concat(diff(expected['state'], actual['state'], 'state'))
    diffs
  end

  def diff(expected, actual, path)
    if expected.is_a?(Hash) && actual.is_a?(Hash)
      (expected.keys | actual.keys).flat_map do |k|
        if !expected.key?(k) then ["#{path}.#{k}: unexpected, got #{actual[k].inspect}"]
        elsif !actual.key?(k) then ["#{path}.#{k}: missing, expected #{expected[k].inspect}"]
        else diff(expected[k], actual[k], "#{path}.#{k}")
        end
      end
    elsif expected.is_a?(Array) && actual.is_a?(Array) && expected.size == actual.size
      expected.each_index.flat_map { |i| diff(expected[i], actual[i], "#{path}[#{i}]") }
    elsif expected == actual
      []
    else
      ["#{path}: expected #{expected.inspect}, got #{actual.inspect}"]
    end
  end
end
