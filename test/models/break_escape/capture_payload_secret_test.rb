require 'test_helper'

module BreakEscape
  # A capture secret that is not an account password (a PIN read at a keypad, a code off a
  # desk) is withheld from every route and served by capture_secrets_for_client only once
  # se_captures records it, with the capture proof and lock-code rules accounts follow.
  class CapturePayloadSecretTest < ActiveSupport::TestCase
    PIN = '7302'.freeze

    def scenario(extra_mapping: {}, lock_pin: nil, proofs: false)
      lobby_objects = [{ 'id' => 'bug_spot', 'type' => 'notes', 'name' => 'Spot', 'requiresItem' => 'bug',
                         'triggerOnInteract' => [{ 'type' => 'remove_item', 'item' => 'bug' }] }]
      if lock_pin
        lobby_objects << { 'id' => 'safe', 'type' => 'safe', 'name' => 'Safe', 'locked' => true,
                           'lockType' => 'pin', 'requires' => lock_pin }
      end
      npcs = [
        { 'id' => 'watcher', 'npcType' => 'person',
          'eventMappings' => [{ 'eventPattern' => 'player_watched',
                                'addCapture' => { 'targetId' => 'surfed', 'kind' => 'credential', 'address' => 'door',
                                                  'secret' => PIN }.merge(extra_mapping) }] },
        { 'id' => 'keyholder', 'npcType' => 'person', 'usePayload' => { 'address' => 'pad', 'secret' => 'KEY-881' },
          'eventMappings' => [{ 'eventPattern' => 'npc_used:bug_spot',
                                'addCapture' => { 'targetId' => 'keyholder_pad', 'kind' => 'credential' } }] }
      ]
      if proofs
        npcs << { 'id' => 'acct', 'npcType' => 'person', 'creds' => { 'username' => 'a.c', 'password' => 'Acct-Pass-1' },
                  'captureProof' => [{ 'dropped' => 'qr' }],
                  'eventMappings' => [{ 'eventPattern' => 'x', 'addCapture' => { 'targetId' => 'acct', 'kind' => 'credential' } }] }
      end
      {
        'startRoom' => 'lobby',
        'social' => { 'captures' => { 'revealSecret' => true } },
        'rooms' => { 'lobby' => { 'type' => 'room_office', 'connections' => {}, 'npcs' => npcs, 'objects' => lobby_objects } }
      }
    end

    def game_for(data, captures = {})
      game = Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                          scenario_data: data,
                          player_state: { 'currentRoom' => 'lobby', 'unlockedRooms' => ['lobby'],
                                          'globalVariables' => { 'se_captures' => captures } })
      game.prepare_scenario_data!
      game
    end

    def entry(id)
      { id => { 'targetId' => id, 'kind' => 'credential', 'at' => 1 } }
    end

    test 'nothing is served before the capture is recorded, and the room answer has no secret' do
      game = game_for(scenario)
      assert_equal({}, game.capture_secrets_for_client)
      json = game.filtered_room_data('lobby').to_json
      refute_includes json, PIN
      refute_includes json, 'KEY-881'
    end

    test 'a recorded mapping capture and a recorded usePayload capture are served' do
      # The usePayload has no targetId: it fills the addCapture mapping on its own NPC
      game = game_for(scenario, entry('surfed').merge(entry('keyholder_pad')))
      assert_equal({ 'surfed' => PIN, 'keyholder_pad' => 'KEY-881' }, game.capture_secrets_for_client)
    end

    test 'a secret the client wrote into its own capture entry is ignored' do
      forged = { 'surfed' => { 'targetId' => 'surfed', 'kind' => 'credential', 'secret' => 'mine', 'at' => 1 } }
      assert_equal({ 'surfed' => PIN }, game_for(scenario, forged).capture_secrets_for_client)
    end

    test 'an undeclared target id and a foothold entry are never served' do
      captures = entry('nobody').merge('surfed' => { 'targetId' => 'surfed', 'kind' => 'foothold', 'at' => 1 })
      assert_equal({}, game_for(scenario, captures).capture_secrets_for_client)
    end

    test 'not served when the scenario does not reveal secrets' do
      data = scenario
      data['social']['captures']['revealSecret'] = false
      assert_equal({}, game_for(data, entry('surfed')).capture_secrets_for_client)
    end

    test 'a capture with a proof is served only once the proof holds' do
      game = game_for(scenario(extra_mapping: { 'proof' => { 'dropped' => 'qr' } }), entry('surfed'))
      assert_equal({}, game.capture_secrets_for_client)
      game.player_state['droppedItems'] = ['qr']
      assert_equal({ 'surfed' => PIN }, game.capture_secrets_for_client)
    end

    test 'in a scenario with proofs, a lock code with no proof is not served; elsewhere it is' do
      assert_equal({}, game_for(scenario(lock_pin: PIN, proofs: true), entry('surfed')).capture_secrets_for_client)
      assert_equal({ 'surfed' => PIN }, game_for(scenario(lock_pin: PIN), entry('surfed')).capture_secrets_for_client)
    end

    test 'an account capture keeps its proof rule: an authored secret on its mapping is not a way round it' do
      # The account's password is also a lock code, so its proof is required
      data = scenario(proofs: true, lock_pin: 'Acct-Pass-1')
      acct = data['rooms']['lobby']['npcs'].last
      acct['eventMappings'][0]['addCapture']['secret'] = 'Acct-Pass-1'
      game = game_for(data, entry('acct').tap { |e| e['acct']['address'] = 'a.c' })
      assert_equal({}, game.capture_secrets_for_client)
      refute_includes game.filtered_room_data('lobby').to_json, 'Acct-Pass-1'
      game.player_state['droppedItems'] = ['qr']
      assert_equal({ 'acct' => 'Acct-Pass-1' }, game.capture_secrets_for_client)
    end

    # Every scenario: no authored capture secret (usePayload, addCapture, an add_capture
    # action's or a landing page's capture) appears in the bootstrap or in any room answer.
    test 'no scenario ships a capture secret in its bootstrap or any room answer' do
      checked = 0
      Dir.glob(Rails.root.join('../../scenarios/*/scenario.json.erb')).sort.each do |erb|
        name = File.basename(File.dirname(erb))
        data = JSON.parse(ERB.new(File.read(erb)).result(Mission::ScenarioBinding.new({}).get_binding))
        game = Game.new(scenario_data: data, player_state: { 'unlockedRooms' => [], 'globalVariables' => {} })
        game.prepare_scenario_data!
        secrets = []
        walk = lambda do |node|
          case node
          when Hash
            Game::CAPTURE_SECRET_KEYS.each do |key|
              s = node[key].is_a?(Hash) ? node[key]['secret'] : nil
              secrets << s if s.is_a?(String) && !s.empty?
            end
            node.each_value { |v| walk.call(v) }
          when Array then node.each { |v| walk.call(v) }
          end
        end
        walk.call(game.scenario_data)
        next if secrets.empty?

        checked += 1
        answers = { 'bootstrap' => game.filtered_scenario_for_bootstrap.to_json }
        game.scenario_data['rooms'].each_key { |room_id| answers["room #{room_id}"] = game.filtered_room_data(room_id).to_json }
        answers.each do |where, json|
          secrets.uniq.each { |s| refute_includes json, s.to_json, "#{name} #{where} ships a capture secret" }
        end
      end
      assert_operator checked, :>=, 3, 'the scan found the capture scenarios'
    end
  end
end
