# K5 run 1 (server half): design mapped, NO code written

Worktree `.claude/worktrees/p-k5`, branch `build/keyring-k5`, tip `3e21ce0fd` (unchanged; nothing committed
by run 1). Run 1 read the plan (3.3, 3.6, 3.7, 3.8, 9.1, 10), the K1 build log, the K4 handover and the code,
then hit the context guard. Run 2 starts writing from this note. Brief rules still apply (no JS, no
lab_physical_pentest, no capture log files; keep edits in K4-touched files small and in separate methods;
merge build/keyring-k4 only when it is finished; build log section "## Slice K5 run 1 (server)").

## Code facts (line numbers at 3e21ce0fd)
- Clock helper: `server_now` (`npc_frustration.rb:60`, `Time.current.to_f`); tests use `travel_to`.
- Foothold ids are prefixed: a proof `{ foothold: "jack_comms_port" }` is the foothold of jack `comms_port`
  (`foothold_id_for`, network_access.rb:40). gainedFootholds stores the bare jack/AP/PC id.
- Foothold-gain sites: `plant_device!` :276-277 (foothold_id in scope), `join_network!` :384-385,
  `record_gained_ap!` :396 (already-held foothold; skip), `implant_foothold!` :527-528. Call
  `start_token_clocks!(foothold_id)` right after each gainedFootholds write, before `save!`. Stamp only when
  absent, so re-plant never restarts it.
- `ACCESS_STATE_DEFAULTS` game.rb:2860; add `'credentialClock' => {}` after `'endedCredentials'`. Never
  read from a sync body: the bootstrap/sync use whitelists, confirm with a test that PUT /sync_state with
  `credentialClock` changes nothing and GET /scenario never carries it.
- No test_access_keyring policy named `finance` exists here (only `finance_desk` with default accepts, so
  token is accepted once in DEFAULT_ACCEPTS). K4 may add `finance`; after the merge add `token` to it.
- test_access_keyring already has `ops_cookie` (saved_connection, foothold proof jack_comms_port) and
  `jake_pw_note` (`session: lena_pc`) plus task `k1_session` (unlock_object lena_pc): adding `lena_token`
  (connectsTo lena_pc) will draw the two new token warnings by design; list them in PLAYTEST.md.

## Design (do in this order, commit each step)
1. `lib/break_escape/credential_model.rb`: token `built: true`; `DEFAULT_ACCEPTS` gains `token`; add
   `token_expires_min(entry)` (Integer 1..240 else nil) and `token_proof_foothold(entry)`. Update the
   comment and the schema descriptions (scenario-schema.json :274, :290, :310 "from first use" is wrong:
   "from when its proof foothold is first gained").
2. `credential_keyring.rb` (new public methods, separate):
   - `token_entry(cred_id)` registry entry when kind token; `token_expired?(cred_id)`: clock + min*60 <=
     server_now; no clock -> not expired; invalid expiresMin -> expired (fail closed).
   - `token_expires_in_s(cred_id)`: `[(clock + min*60 - now).ceil, 0].max`, full min*60 with no clock.
   - `credential_session_expired?(session)`: via credential, entry kind token, token_expired?.
   - `start_token_clocks!(foothold_id)`: each token whose proof foothold == id, no clock, store
     `server_now`; cap 64 entries; grow-only. `stamp_token_clock!(cred_id)` for a sign-in with no clock.
   - `drop_expired_token_sessions!` -> ids; records into `@token_expired_pc_ids`.
   - `with_token_expired_pc_ids(body)` merges `tokenExpiredPcIds` when non-empty.
   - keyring: in `registry_connecting_entry` early `return registry_token_entry(row, id, entry, pc) if
     kind == 'token'`: routes `[{foothold: proof}]` when `host_reachable_through?`, `sessionHeld` (held and not
     expired), `targetOff` if routes, `remoteBlocked`, `expiresInS`, or `expired: true, routes: []`.
     `keyring_rev` must digest entries with `expiresInS` removed; add `keyring_live_expires(entries)` ->
     `{ credId => n }` for the controller's `unchanged` answer.
3. `credential_login.rb`: step 4 `kind == 'token' ? token_route_refusal(entry, pc, route) :
   credential_route_refusal(...)` (only `foothold` equal to the proof foothold; anything else, other
   footholds included, is the generic refusal; then reach 403, not_responding, remoteBlocked 422). After
   step 8: `return { 422, { success: false, expired: true } } if kind == 'token' && token_expired?(cred_id)`.
   Before save in step 9: `stamp_token_clock!(cred_id)`. `credential_session_fields` adds `expiresInS` for a
   token (covers login answer and session_for_client).
4. `game.rb` (small edits): `start_login_session!` `unless relay || token_kind?(credential)` for signedInPcs;
   `session_held_at_keyboard?` also false for an expired token session (claim guards :3375, :3444; typed
   attempt_login! does not check a held session, it replaces); `session_for_client` returns nil for an
   expired token session (sessions_for_client goes through it); `with_ended_pc_ids` -> also
   `with_token_expired_pc_ids`; `unlock_session_refusal` answers `expired` (add to UNLOCK_REFUSAL_MESSAGES,
   message "{label} has expired.") when the scoped session is an expired token.
5. `network_access.rb` (one line each): `session_route_up?` false for expired after the Hash check;
   `desktop_request_allowed?` false for expired at the top (every branch); `desktop_refusal` returns
   `'expired'` before the branches when the PC's session is expired; `reach_session_hosts` and
   `view_session_hosts` skip expired; `reach_cache_key` appends `expired_token_session_ids` (outside the
   outage block); `host_row` condition adds `&& !credential_session_expired?(session)`;
   `prune_unreachable_sessions!` starts `ended = drop_expired_token_sessions!`; unplug answer merges
   `with_token_expired_pc_ids`.
6. Controller: `keyring` unchanged branch adds `expiresInS` map when any; `logout` wraps its body in
   `with_token_expired_pc_ids`. `npc_frustration.rb:220` borrow done: add tokenExpiredPcIds likewise.
7. Validator `check_credentials` (scripts/validate_scenario.rb :7232 hint goes): token errors (no label,
   no/invalid expiresMin, proof not foothold); warnings (proof foothold network cannot reach connectsTo
   network by a BFS over `nm.linked_networks`; foothold network from jacks e[:network], `wifi_<net>`, implant
   PC's network; connectsTo policy `accepts` without token; session proof on its own connectsTo; unlock_object
   task at its connectsTo, as invite_connect_pcs); info line on every token (plan 10 wording).
8. Leak scanner `tools/playtest/lib/access_leak_scanner.rb` `scan_credentials`: `credential_clock` finding
   for any hash with a `credentialClock` key (add to the findings table :374); unit test in
   test/unit/access_leak_scanner_test.rb.
9. Fixture: `test_access_keyring` `lena_token` (plan 9.1 row: token, lena, connectsTo lena_pc,
   `proof: { foothold: jack_comms_port }`, label "HB-FIN-02 sign-in token", expiresMin 4), PLAYTEST R12 and
   the expected warnings; validate with `--skip-ink --no-graph`, checkout any rewritten dungeon_graph.
10. Tests: `test/controllers/break_escape/credential_token_test.rb` class `CredentialTokenTest` (grep for
   uniqueness). Base on credential_login_test.rb helpers and `KeyringLoginScenario.scenario` plus a
   `lena_token` entry (proof `jack_comms_port`). A second foothold reaching lena_pc: add a second office_lan
   jack in the test scenario (comms_port is the only office one; server_port/bench_port are other nets).
   Cover every plan 10 "Tests" item, hostile inputs (route given as relay/from/none/array/other foothold,
   expired token at keyboard GET /container, PUT /sync_state with credentialClock), clock unchanged by a
   second plant, a pre-K5 game (foothold held, no clock). Also unit tests for CredentialModel token
   helpers and validator fixtures (test/js/validator-credentials.test.mjs exists from K1: add cases).
   Run with `bin/rails test <files>`; also credential_login_test, keyring_*_test, network_*_test.

## For the client half (fields promised)
- POST /login token: route `{ foothold: <proof> }`; 422 `{ expired: true }`; answer `kind: "token"`, `label`,
  `expiresInS`, `remote: true`, `footholdId`.
- Bootstrap `sessions` / GET /container session: token sessions carry `expiresInS`; expired ones absent.
- GET /keyring token entry: `label`, `host`, `routes`, `sessionHeld`, `targetOff`, `remoteBlocked`,
  `expiresInS`, `expired`; `unchanged` answer carries `expiresInS: { credId: n }`.
- Desktop refusal reason `expired`; unlock refusal reason `expired`; `tokenExpiredPcIds` beside
  `endedPcIds` on POST /login, /logout, /network/unplug, /npc_workaround.

## Run 2 (server) status, 2026-11-16
Done and committed (68b44943d to 17fbda3a6): steps 1 to 6 and 10 (server tests). Build log section
"## Slice K5 run 2 (server)" lists commits, tests and deviations. Steps 7 to 9 were the parallel run (c64c0ad44).
Open: the K4 merge must add `token` to any `finance` policy; credential_login_test.rb:92 (`from` route) fails
at base 3e21ce0fd too (K4 part 1). No JS client work done (separate run). Gotcha: Ruby 2.7 keyword
splitting on test helpers with string-keyed hashes; use positional args.
