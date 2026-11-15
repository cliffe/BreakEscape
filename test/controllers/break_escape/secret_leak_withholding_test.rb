require 'test_helper'
require 'minitest/mock'

module BreakEscape
  # Scenario format hardening, step 3. The server withholds a non-account capture secret that
  # opens a lock (hard_access_capture_value?), and an account password that opens a lock in a
  # proof-declaring scenario (account_capture_served?). Step 3 extends both to combination,
  # cryptex and resolved door-entry answers through CaptureModel.answer_key and lock_answer?,
  # the one normaliser Game.lock_answer_matches? also uses. These tests pin the new withholding,
  # the normaliser, and that acknowledgedClues never reaches the client.
  class SecretLeakWithholdingTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @mission = break_escape_missions(:ceo_exfil)
      @owner   = break_escape_demo_users(:test_user)
    end

    # A scenario with a combination, cryptex and password lock, and a door entry whose own
    # `requires` is a PIN resolved through the connected (pin) room. The vault's own PIN is a
    # different value, so "7781" is a hard-access value only through the door-entry walk.
    def lock_scenario
      {
        'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'type' => 'room_office', 'connections' => { 'north' => 'vault' },
            'doors' => [{ 'connectedRoom' => 'vault', 'direction' => 'north', 'requires' => '7781' }],
            'objects' => [
              { 'id' => 'combo', 'type' => 'safe', 'locked' => true, 'lockType' => 'combination',
                'requires' => '12-30-5', 'combination' => [12, 30, 5] },
              { 'id' => 'cryptex_box', 'type' => 'safe', 'locked' => true, 'lockType' => 'cryptex',
                'requires' => 'wolf', 'cryptexConfig' => { 'wheelCount' => 4, 'answer' => 'wolf' } },
              { 'id' => 'pwbox', 'type' => 'safe', 'locked' => true, 'lockType' => 'password',
                'requires' => 'satchel42' }
            ]
          },
          'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin',
                       'requires' => '9999', 'connections' => { 'south' => 'office' }, 'objects' => [] }
        }
      }
    end

    def state
      { 'currentRoom' => 'office', 'unlockedRooms' => ['office'], 'unlockedObjects' => [],
        'inventory' => [], 'encounteredNPCs' => [], 'globalVariables' => {}, 'notes' => [],
        'health' => 100, 'objectivesState' => { 'tasks' => {}, 'aims' => {} } }
    end

    def game_with(scenario)
      Game.create!(mission: @mission, player: @owner, scenario_data: scenario, player_state: state)
    end

    def served(game, secret, proof: nil)
      game.send(:authored_capture_secret, { secret: secret, proof: proof })
    end

    # ── non-account capture secrets (authored_capture_secret / hard_access) ───────────

    test 'a capture secret equal to a resolved door-entry PIN is withheld' do
      game = game_with(lock_scenario)
      assert_nil served(game, '7781'), 'the door-entry PIN opens the pin room, so the secret is held'
    end

    test 'a capture secret equal to a combination answer is withheld, in every written form' do
      game = game_with(lock_scenario)
      assert_nil served(game, '12-30-5')
      assert_nil served(game, '12-30-05'), 'a zero-padded form canonicalises to the same key'
      assert_nil served(game, '12 30 5')
    end

    test 'a capture secret equal to a cryptex answer is withheld, case-insensitively' do
      game = game_with(lock_scenario)
      assert_nil served(game, 'wolf')
      assert_nil served(game, 'WOLF'), 'cryptex folds case'
    end

    test 'a capture secret that opens nothing is still served' do
      game = game_with(lock_scenario)
      assert_equal '5', served(game, '5'), 'a stray "5" beside [12,30,5] opens nothing'
      assert_equal '30-12-5', served(game, '30-12-5'), 'the numbers out of order open nothing'
    end

    test 'a password lock stays exact: a different-case or partial match is served' do
      game = game_with(lock_scenario)
      assert_nil served(game, 'satchel42'), 'the exact password is withheld'
      assert_equal 'Satchel42', served(game, 'Satchel42'), 'passwords are not folded'
    end

    test 'a withheld secret is served once its proof holds' do
      game = game_with(lock_scenario)
      # A non-account writer with a proof serves the secret only when the proof holds. Stub the
      # gate both ways; the secret is a hard-access value either way, proving the proof branch
      # (not the hard-access branch) decides when a proof is present.
      game.stub(:capture_proof_holds?, false) do
        assert_nil served(game, '12-30-5', proof: { 'session' => 'x' })
      end
      game.stub(:capture_proof_holds?, true) do
        assert_equal '12-30-5', served(game, '12-30-5', proof: { 'session' => 'x' })
      end
    end

    # ── account passwords (account_capture_served? / account_password_opens_something?) ──

    def account_scenario(password:, declare_proofs:)
      sc = lock_scenario
      sc['rooms']['office']['npcs'] = [
        { 'id' => 'rhea', 'npcType' => 'person', 'creds' => { 'username' => 'r.m', 'password' => password },
          'eventMappings' => [{ 'eventPattern' => 'x', 'addCapture' => { 'targetId' => 'rhea', 'address' => 'r.m' } }] }
      ]
      if declare_proofs
        # A second account holder with its own captureProof makes the scenario declare proofs,
        # without giving rhea a proof of her own (so hers can never hold).
        sc['rooms']['office']['npcs'] << {
          'id' => 'sam', 'npcType' => 'person', 'creds' => { 'username' => 's.o', 'password' => 'Sam-Pass-99' },
          'eventMappings' => [{ 'eventPattern' => 'y', 'addCapture' => { 'targetId' => 'sam', 'address' => 's.o' } }],
          'captureProof' => [{ 'dropped' => 'kit_qr' }]
        }
      end
      sc
    end

    test 'an account password equal to a combination answer opens something' do
      game = game_with(account_scenario(password: '12-30-5', declare_proofs: true))
      npc = game.scenario_data['rooms']['office']['npcs'].first
      assert game.send(:account_password_opens_something?, npc)
    end

    test 'an account whose password opens a combination lock is withheld in a proof-declaring scenario' do
      game = game_with(account_scenario(password: '12-30-5', declare_proofs: true))
      rhea = game.scenario_data['rooms']['office']['npcs'].first
      refute game.send(:account_capture_served?, rhea), 'rhea has no proof that holds, so her password is held'
    end

    test 'the same account is served when the scenario declares no proofs' do
      game = game_with(account_scenario(password: '12-30-5', declare_proofs: false))
      rhea = game.scenario_data['rooms']['office']['npcs'].first
      assert game.send(:account_capture_served?, rhea)
    end

    test 'an account whose password opens nothing is served even where proofs are declared' do
      game = game_with(account_scenario(password: 'Totally-Unrelated-Pass', declare_proofs: true))
      rhea = game.scenario_data['rooms']['office']['npcs'].first
      refute game.send(:account_password_opens_something?, rhea)
      assert game.send(:account_capture_served?, rhea)
    end

    # ── CaptureModel.answer_key / lock_answer? unit cases ─────────────────────────────

    test 'answer_key canonicalises each lock kind' do
      ak = ->(kind, value) { CaptureModel.answer_key(kind, value) }

      assert_equal 'combination:12-30-5', ak.call('combination', [12, 30, 5])
      assert_equal 'combination:12-30-5', ak.call('combination', '12-30-05')
      assert_equal 'combination:12-30-5', ak.call('combination', 'L12 R30 L5')
      # The moved lambda splits any string on non-digits, so a worded password yields its digits.
      assert_equal 'combination:2024', ak.call('combination', 'Summer2024')

      assert_equal 'cryptex:wolf', ak.call('cryptex', 'WOLF')
      assert_equal 'cryptex:wolf', ak.call('cryptex', '  Wolf  ')

      assert_equal 'password:Satchel42', ak.call('password', 'Satchel42')
      assert_equal 'pin:4821', ak.call('pin', '4821')
      assert_equal 'pin:4821', ak.call('pin', 4821), 'a number is keyed by its string form'
    end

    test 'answer_key returns nil for a blank or malformed value' do
      ak = ->(kind, value) { CaptureModel.answer_key(kind, value) }

      assert_nil ak.call('combination', nil)
      assert_nil ak.call('combination', '')
      assert_nil ak.call('combination', 'twelve')
      assert_nil ak.call('combination', [])
      assert_nil ak.call('cryptex', nil)
      assert_nil ak.call('cryptex', '   ')
      assert_nil ak.call('cryptex', ['WOLF']), 'a non-String cryptex value is nil'
      assert_nil ak.call('pin', nil)
      assert_nil ak.call('password', '')
    end

    test 'lock_answer? never matches nil or a blank value' do
      keys = Set.new(['combination:12-30-5', 'pin:4821', 'cryptex:wolf'])
      refute CaptureModel.lock_answer?(keys, nil)
      refute CaptureModel.lock_answer?(keys, '')
      refute CaptureModel.lock_answer?(keys, '   ')
      assert CaptureModel.lock_answer?(keys, '12-30-5')
      assert CaptureModel.lock_answer?(keys, '4821')
      assert CaptureModel.lock_answer?(keys, 'WOLF')
      refute CaptureModel.lock_answer?(keys, '5')
    end

    # ── the bootstrap route never carries acknowledgedClues ───────────────────────────

    test 'GET /games/:id/scenario carries no acknowledgedClues key or reason' do
      sc = lock_scenario
      sc['acknowledgedClues'] = [
        { 'lock' => 'combo', 'in' => 'some_object',
          'reason' => 'UNIQUE-REASON-SENTINEL tracing the dials is the puzzle',
          'approved' => '2026-11-14: test clue' }
      ]
      game = game_with(sc)
      get scenario_game_url(game), as: :json
      assert_response :success
      refute_includes response.body, 'acknowledgedClues', 'the key must not ship'
      refute_includes response.body, 'UNIQUE-REASON-SENTINEL', 'no reason prose ships'
    end

    # ── the room route strips a pad-lock door entry's `requires`, keeps a card one ─────

    # A room reached through both a bare PIN door entry (resolves to the vault's pin lock) and an
    # rfid door entry (resolves to the secure room's rfid lock). The client validates a pad lock
    # server-side and never needs its `requires`; an rfid entry's card id is not a secret and the
    # clone-as-entry path reads it. So GET /room/:id must strip the PIN but keep the card.
    def door_strip_scenario
      {
        'startRoom' => 'office',
        'rooms' => {
          'office' => {
            'type' => 'room_office', 'connections' => { 'north' => 'vault', 'east' => 'secure' },
            'doors' => [
              { 'connectedRoom' => 'vault', 'direction' => 'north', 'requires' => '7781' },
              { 'connectedRoom' => 'secure', 'direction' => 'east', 'requires' => 'badge01' }
            ],
            'objects' => []
          },
          'vault' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'pin',
                       'requires' => '7781', 'connections' => { 'south' => 'office' }, 'objects' => [] },
          'secure' => { 'type' => 'room_office', 'locked' => true, 'lockType' => 'rfid',
                        'requires' => 'badge01', 'connections' => { 'west' => 'office' }, 'objects' => [] }
        }
      }
    end

    test 'GET /room/:id strips a bare PIN door entry requires and keeps an rfid one' do
      game = game_with(door_strip_scenario)
      get room_game_url(game, room_id: 'office'), as: :json
      assert_response :success
      doors = response.parsed_body['room']['doors']
      pin_entry = doors.find { |d| d['connectedRoom'] == 'vault' }
      rfid_entry = doors.find { |d| d['connectedRoom'] == 'secure' }
      refute pin_entry.key?('requires'), 'the pad-lock door entry must not ship its `requires`'
      refute_includes response.body, '7781', 'the vault PIN must not appear anywhere in the payload'
      assert_equal 'badge01', rfid_entry['requires'], 'the rfid card id must survive for clone-as-entry'
    end
  end
end
