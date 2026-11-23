# Handover: core step 9 part B (S3, N15): technique_card type and keyring proof kind

Done (all committed).
- `public/break_escape/assets/objects/technique_card.png`: byte copy of `qr_card.png` (cmp checked); `core/game.js:538` `load.image('technique_card', ...)`.
- `lib/break_escape/credential_model.rb`: `PROOF_KINDS` gains `technique_card`.
- `app/models/break_escape/credential_keyring.rb`: `when 'technique_card'` in `credential_proof_holds?`; private-style reader `technique_finding_used?(finding_id)` (a public concern method; the technique route should call it for its repeat test): true only when `player_state['opsUsed']` is an Array of strings including the finding id (a non-empty String).
- State shape read: `player_state['opsUsed'] = [findingId, ...]` (plan section 8).
- Tests: `test/js/technique-card-item.test.mjs` (6 pass); keyring tests extended in `test/unit/credential_model_test.rb`, `test/models/break_escape/credential_keyring_test.rb` (64 runs, with the model and route files), `test/controllers/break_escape/keyring_route_test.rb`. keyring*/access_model_* controller tests: 183 runs, 0 failures. `bin/ops-golden-compare`: 12 runs, 0 failures. Rubocop clean. 30 node tests whose harness copies game.js pass.

Grep of section 4.3 (`public/break_escape/js`, `scripts/`): no JS keys on `technique_card`; no code treats a type containing `card` specially by substring/regex (`includes('card')`, `/card/`, `endsWith('card')` found nothing; hits were only `wrong_card`/`no_card` reason strings, `revoke_card`, `card_scan` sound, `clone_card`). Only `scripts/validate_network_ops.rb` (builder 9a) mentions `technique_card`, as the item field. The tray-slot and toast exclusions are `/^notes\d*$/` only (inventory.js:456, 712, 976).

For the next builders.
- `opsUsed` is NOT yet in `Game::ACCESS_STATE_DEFAULTS` (`app/models/break_escape/game.rb` ~3096-3100 holds `opsDiscovered`, `opsFindings` only). Add `'opsUsed' => []` there (step 10), as the server-owned guard keys off that list; my tests set the state directly. `network_ops_state_delta_test.rb` already expects it never to be synced.
- The technique route (step 10) must append the finding id to `player_state['opsUsed']` once (grant of a credential), then answer `keyringChanged: true`; the entry then appears in `GET /keyring` with no further change. Credential entries must be `saved_connection` with `proof: { technique_card: '<findingId>' }`.
