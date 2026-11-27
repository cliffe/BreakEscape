require 'test_helper'

module BreakEscape
  # Step 2b (plan item 5, Tests "Rails, captures"). A capture writer or a capture proof an author
  # parked inside a "_" note is dead on the server: it never serves a secret, never shadows a live
  # writer of the same target id, and never turns proof-gating on or satisfies it. Driven through
  # GET /capture_secrets. Free data holds no notes, so a writer there is honoured (covered by the
  # phase B1 network and corpus proofs).
  class CaptureNotesNotLiveTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    LIVE_SECRET = 'LIVE-SURF-111'.freeze     # the live addCapture secret for "surfed"
    NOTE_SECRET = 'NOTE-SURF-222'.freeze      # a note-held copy for "surfed", placed first
    NOTE_ONLY_SECRET = 'NOTE-ONLY-333'.freeze # a note-only writer, target "noteonly"
    QUINN_PW = 'Quinn-Pass-444'.freeze        # an account password that opens a PC

    # A fixture with: a surfed capture (a note-held writer first, the live writer second, same
    # target id); a note-only writer; and the account holder quinn (password opens quinn_pc). The
    # note_proof flag adds a note-held mapping proof; the live_proof flag adds a live captureProof
    # on a separate NPC (so the scenario declares proofs independently of quinn).
    def scenario_data(note_proof: false, live_proof: false)
      watcher = {
        'id' => 'watcher', 'npcType' => 'person', 'displayName' => 'Watcher',
        # A note first: its addCapture for "surfed" must neither serve nor shadow the live one.
        '_draft' => { 'addCapture' => { 'targetId' => 'surfed', 'kind' => 'credential',
                                        'address' => 'surf-addr', 'secret' => NOTE_SECRET } },
        # A note-only writer for "noteonly": its target id is never declared.
        '_draft_only' => { 'addCapture' => { 'targetId' => 'noteonly', 'kind' => 'credential',
                                             'address' => 'only-addr', 'secret' => NOTE_ONLY_SECRET } },
        'eventMappings' => [
          { 'eventPattern' => 'player_surfed',
            'addCapture' => { 'targetId' => 'surfed', 'kind' => 'credential',
                              'address' => 'surf-addr', 'secret' => LIVE_SECRET } }
        ]
      }
      quinn = {
        'id' => 'quinn', 'npcType' => 'person', 'displayName' => 'Quinn',
        'creds' => { 'username' => 'q.reed', 'password' => QUINN_PW },
        'eventMappings' => [
          { 'eventPattern' => 'never',
            'addCapture' => { 'targetId' => 'quinn', 'kind' => 'credential', 'address' => 'q.reed' } }
        ]
      }
      # A note-held mapping proof on quinn: with the skip it must not turn gating on.
      quinn['_proof_draft'] = { 'addCapture' => { 'targetId' => 'quinn_proof', 'kind' => 'credential',
                                                  'address' => 'q.reed',
                                                  'proof' => { 'dropped' => 'kit_q' } } } if note_proof
      npcs = [watcher, quinn]
      if live_proof
        # A live captureProof on a separate NPC turns gating on independently of quinn.
        npcs << { 'id' => 'sofia', 'npcType' => 'person', 'displayName' => 'Sofia',
                  'creds' => { 'username' => 's.lord', 'password' => 'Sofia-Pass-555' },
                  'eventMappings' => [{ 'eventPattern' => 'never',
                                        'addCapture' => { 'targetId' => 'sofia', 'kind' => 'credential',
                                                          'address' => 's.lord' } }],
                  'captureProof' => [{ 'dropped' => 'kit_s' }] }
      end
      {
        'startRoom' => 'office',
        'social' => { 'captures' => { 'revealSecret' => true } },
        'rooms' => {
          'office' => {
            'type' => 'room_office', 'connections' => {},
            'objects' => [
              { 'id' => 'quinn_pc', 'type' => 'pc', 'name' => "Quinn's PC", 'locked' => true,
                'lockType' => 'login', 'access' => { 'people' => ['quinn'] } }
            ],
            'npcs' => npcs
          }
        }
      }
    end

    def build_game(scenario, earned: {}, player_state: {})
      Game.create!(mission: break_escape_missions(:ceo_exfil), player: break_escape_demo_users(:test_user),
                   scenario_data: scenario,
                   player_state: { 'currentRoom' => 'office', 'unlockedRooms' => ['office'],
                                   'globalVariables' => { 'se_captures' => earned } }.merge(player_state))
    end

    def secrets_for(game)
      get capture_secrets_game_url(game), as: :json
      assert_response :success
      response.parsed_body['secrets']
    end

    test 'a note-held writer neither serves nor shadows the live secret of the same target id' do
      earned = { 'surfed' => { 'targetId' => 'surfed', 'kind' => 'credential', 'address' => 'surf-addr',
                               'at' => 1, 'proven' => true } }
      game = build_game(scenario_data, earned: earned)
      out = secrets_for(game)
      assert_equal LIVE_SECRET, out['surfed'], 'the live secret is served, not the note copy'
      refute_includes response.body, NOTE_SECRET
    end

    test 'a note-only writer target is never declared, so its secret is never served' do
      earned = { 'noteonly' => { 'targetId' => 'noteonly', 'kind' => 'credential', 'address' => 'only-addr',
                                 'at' => 1, 'proven' => true } }
      game = build_game(scenario_data, earned: earned)
      out = secrets_for(game)
      assert_nil out['noteonly']
      refute_includes response.body, NOTE_ONLY_SECRET
    end

    test 'a note-only proof does not turn proof-gating on: the account password is served as today' do
      # Only proof in the scenario is note-held; with the skip the scenario declares none, so
      # quinn's account password is served as it would be with no proofs at all.
      earned = { 'quinn' => { 'targetId' => 'quinn', 'kind' => 'credential', 'address' => 'q.reed',
                              'at' => 1, 'proven' => true } }
      game = build_game(scenario_data(note_proof: true), earned: earned)
      out = secrets_for(game)
      assert_equal QUINN_PW, out['quinn'], 'gating stayed off, so the password is served'
    end

    test 'a note-held proof does not satisfy gating: with a live proof elsewhere the password is withheld' do
      # A live captureProof (sofia) turns gating on. quinn's password opens quinn_pc, and quinn's
      # only satisfying proof is note-held, so with the skip quinn has no proof and is withheld,
      # even though droppedItems would make the note proof hold if it were read.
      earned = { 'quinn' => { 'targetId' => 'quinn', 'kind' => 'credential', 'address' => 'q.reed',
                              'at' => 1, 'proven' => true } }
      game = build_game(scenario_data(note_proof: true, live_proof: true), earned: earned,
                        player_state: { 'droppedItems' => ['kit_q'] })
      out = secrets_for(game)
      assert_nil out['quinn'], 'the note proof does not satisfy gating, so the password stays withheld'
      refute_includes response.body, QUINN_PW
    end
  end
end
