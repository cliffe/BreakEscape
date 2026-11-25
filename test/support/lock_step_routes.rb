# Helpers for the S8c controller tests (unit 15): a game built from a scenario Hash, the real
# routes as one-line calls that return [status, body], a held item placed from the scenario's own
# declarations, and the answer comparison the fixture proof uses. Nothing here touches an
# application class.
module LockStepRoutes
  T0 = Time.zone.at(1_800_000_000)
  GENERIC = { 'success' => false, 'message' => 'Incorrect username or password' }.freeze
  INVALID = { 'success' => false, 'message' => 'Invalid attempt' }.freeze
  NOT_FOUND = { 'success' => false, 'error' => 'not found' }.freeze
  EXPIRED = { 'success' => false, 'expired' => true }.freeze
  # a lock answer names the lock the request was for (the target echo), so the expired answer does too
  def expired_for(subject)
    type, id = subject.split(':', 2)
    EXPIRED.merge('targetType' => type, 'targetId' => id)
  end

  # keys that must appear in no answer, ever (hand-on entry for unit 11)
  STATE_KEYS = %w[lockSteps npcStepGrants mfaPrompts mfaAccounts].freeze

  def game_path(suffix)
    "/break_escape/games/#{@game.id}/#{suffix}"
  end

  def build_step_game(scenario, state = {})
    @game = create_access_game(
      mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user), scenario: scenario,
      player_state: { 'currentRoom' => scenario['startRoom'], 'unlockedRooms' => [scenario['startRoom']],
                      'encounteredNPCs' => [] }.merge(state)
    )
  end

  def game_state
    BreakEscape::Game.find(@game.id).player_state
  end

  # Every answer the helpers read is kept, so a test can scan all of them for a leaked word or key
  def answer
    (@seen ||= []) << { path: request.path, status: response.status, body: response.body }
    [response.status, response.parsed_body]
  end

  # Fail when any kept answer holds a word, or a state key anywhere in its JSON
  def assert_nothing_leaked(*words)
    Array(@seen).each do |a|
      words.each do |w|
        # a refusal that repeats the id the request itself named tells nothing new
        next if a[:status] >= 400 && a[:path].include?(w.delete('"'))

        assert_not_includes a[:body], w, "#{w} in #{a[:path]} (#{a[:status]})"
      end
      parsed = begin JSON.parse(a[:body]) rescue nil end
      assert_empty all_keys(parsed) & STATE_KEYS, "state key in #{a[:path]}" if parsed
    end
  end

  def later(seconds)
    travel_to Time.zone.at(Time.current.to_i + seconds)
  end

  # ---- the routes ----

  def unlock(type, id, attempt, method, extra = {})
    post game_path('unlock'), params: { targetType: type, targetId: id, attempt: attempt, method: method }.merge(extra), as: :json
    answer
  end

  def mfa(route, subject, extra = {})
    type, id = subject.split(':', 2)
    post game_path("mfa/#{route}"), params: { target_type: type, target_id: id }.merge(extra), as: :json
    answer
  end

  def phone(npc, subject)
    type, id = subject.split(':', 2)
    get game_path('mfa/phone'), params: { npc_id: npc, target_type: type, target_id: id }
    answer
  end

  def device_code(item_id)
    get game_path('mfa/device'), params: { item_id: item_id }
    assert_response :success, response.body
    response.parsed_body['code']
  end

  def container(id)
    get game_path("container/#{id}")
    answer
  end

  def room(id)
    get game_path("room/#{id}")
    answer
  end

  def bootstrap
    get game_path('scenario')
    answer
  end

  def add_item(item, extra = {})
    post game_path('inventory'), params: { action_type: 'add', item: item }.merge(extra), as: :json
    answer
  end

  # ---- held items ----

  # Every item the scenario declares in an NPC's itemsHeld, by id
  def declared_item(scenario, id)
    found = nil
    walk = lambda do |o|
      case o
      when Hash
        found ||= o if o['id'] == id && o['type']
        o.each_value { |v| walk.call(v) }
      when Array then o.each { |v| walk.call(v) }
      end
    end
    walk.call(scenario)
    found&.deep_dup
  end

  # Put an item the scenario declares into the player's inventory (a held phone, a code device)
  def hold!(id)
    item = declared_item(@game.scenario_data, id)
    raise "no item #{id}" unless item

    game = BreakEscape::Game.find(@game.id)
    game.player_state['inventory'] = Array(game.player_state['inventory']) + [item.except('contents')]
    game.save!
    @game = game
  end

  def drop_held!(id)
    game = BreakEscape::Game.find(@game.id)
    game.player_state['inventory'] = Array(game.player_state['inventory']).reject { |i| i['id'] == id }
    game.save!
    @game = game
  end

  # ---- every key of an answer, any depth ----

  def all_keys(value, out = [])
    case value
    when Hash then value.each { |k, v| out << k.to_s; all_keys(v, out) }
    when Array then value.each { |v| all_keys(v, out) }
    end
    out
  end

  # ---- the fixture comparison ----

  def type_of(value)
    return 'boolean' if value == true || value == false
    return 'null' if value.nil?
    return 'number' if value.is_a?(Numeric)

    value.class.name
  end

  # Compare an actual body with a fixture body: the key set equal at every level, values equal
  # except at the dotted `varies` paths, where only the type is compared. Returns the differences.
  def body_differences(expected, actual, varies, path = [])
    here = path.join('.')
    if varies.include?(here)
      return type_of(expected) == type_of(actual) ? [] : ["#{here}: type #{type_of(expected)} vs #{type_of(actual)}"]
    end

    case expected
    when Hash
      return ["#{here}: not an object"] unless actual.is_a?(Hash)

      diffs = []
      missing = expected.keys - actual.keys
      extra = actual.keys - expected.keys
      diffs << "#{here}: missing keys #{missing}" unless missing.empty?
      diffs << "#{here}: extra keys #{extra}" unless extra.empty?
      (expected.keys & actual.keys).each { |k| diffs.concat(body_differences(expected[k], actual[k], varies, path + [k])) }
      diffs
    when Array
      return ["#{here}: not an array"] unless actual.is_a?(Array)
      return ["#{here}: length #{expected.length} vs #{actual.length}"] unless expected.length == actual.length

      expected.each_index.flat_map { |i| body_differences(expected[i], actual[i], varies, path + [i.to_s]) }
    else
      expected == actual ? [] : ["#{here}: #{expected.inspect} vs #{actual.inspect}"]
    end
  end
end
