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

## Merge-time step (review R1 m4)
When K4's `finance` policy (or an explicit `accepts` on `finance_desk`) merges in, add `token` to it.
`scenarios/test_access_keyring/scenario.json.erb:22`: `finance_desk` has no `accepts` on this branch, so it takes
the default list, which includes `token`. The validator warning (validate_scenario.rb:7397) catches a miss.
Not changed on this branch because K4's policy is not here.

## Run 3 (K4 merge + client half start), 2026-11-17
Done: merged build/keyring-k4 (db3986065) as f8638e2e6. Conflicts: games_controller desktop refusal
(kept K5 `expired` and K4 `no_session` branches, in that order); npc_frustration borrow done (kept
K4's lastSpent-kept ids in an `if borrow_ended.any?` block, K5's `with_token_expired_pc_ids` inside it;
a resent "done" replays endedPcIds from lastSpent but not tokenExpiredPcIds: minor gap, note for
review); build log (K4 sections first, then K5 run 2 and R1). K4 adds no `finance` policy and no
explicit `accepts` on `finance_desk`, so the "add token" step was a no-op (default list has token).
Rails after merge: 474 controller runs (credential/keyring/access/network) 0 F 0 E; 208 model/unit
runs 0 F 0 E (one run showed 1 error under load, clean on rerun; not reproduced).
bin/test-js (all but access-relay-desktop/access-from-desktop) was started in the background and had
not finished when run 3 stopped: rerun it, plus the two heavy files under ulimit, before client work.
No client code written yet.

## Client half design (run 3 reading; start here)
K3d is NOT on this branch (no minigames/capture-log/signin-rows.js), so the Sign-ins list token row
and the capture-log find toast wording are out of scope until K3d lands; say so in the build log.
1. utils/remote-host-text.js (import-free): `tokenFoundMessage` ("Session token captured: {label} for
   {displayName} on {host}."), findLine token branch; teachLine token (8.5); kindRefusedMessage token
   "{host} does not accept session tokens."; kindRefusedShort(host, kind) token "{host}: no session
   tokens." (default unchanged); `tokenExpiredMessage(label)` "{label} has expired.";
   `tokenExpiredEndedMessage(label, host)` "{label} expired. Your session on {host} ended.";
   credentialRefusalLine case 'expired'. TAG_TEXT token already exists.
2. systems/keyring.js: FIND_KINDS += token. screenEntries gains `foothold`; token shows on a foothold
   screen only when forThisPc and routes has {foothold: <screen foothold>}; an expired token (server
   sends routes []) shows greyed only if an earlier answer this page listed its proof foothold
   (keep a `_tokenProofs` credId->foothold map in remember()). unlock-system.js:503 keyringForScreen
   must pass `foothold` to screenEntries. remember(): for token entries with sessionHeld and numeric
   expiresInS call pcSessions.noteTokenExpiry(connectsTo, s); for `unchanged` answers read
   answer.expiresInS {credId: n} and map credId->connectsTo from the cached entries.
3. password-minigame.js: mergeRemoteTiles cred push adds `expired: e.expired === true`;
   renderSignInWays greys when !accepted || expired (short line: expired -> tokenExpiredMessage(label),
   refused -> kindRefusedShort(host, kind)); useCredential: expired -> message, no post; result reason
   'expired' -> mark cred.expired, rerender, line.
4. systems/pc-sessions.js (import-free: copy texts, add a test that keeps them equal to
   remote-host-text): credentialRefusalReason `b.expired` -> 'expired' (before the generic);
   token sessions store `expiresAt = Date.now() + expiresInS*1000` (signInWithCredential and load());
   per-PC timer -> linkDropped([pcId], 'token_expired'); `noteTokenExpiry`, `tokenSecondsLeft`;
   linkDropped(ids, reason, { tokenExpired }) gives tokenExpired ids the token line (desktop close or
   toast) and the rest the batch reason; _dropEnded / signOut / displaced pass the answer's
   tokenExpiredPcIds; token sessions never enter `signedIn` (load and _replace, as relay), firstAtPc false.
5. network-links.js:588 unplug emits tokenExpiredPcIds; pc-sessions listener passes it.
   npc-workarounds.js:359 passes body.tokenExpiredPcIds (filtered like endedPcIds) through deps.linkDropped.
6. utils/pc-taskbar.js: credentialSessionLine token -> "with a session token, about {n} min left"
   (n = ceil(s/60); s < 60 -> "with a session token, under a minute left"); credentialLineHtml for
   token escapes the whole line (no label span); add `refreshTokenLines(root, session)` updating
   `.desktop-account-credential` and `.pc-start-credential` text. container-minigame.js: a 60 s (or
   to-next-minute) interval after the desktop registers (line ~732), cleared in cleanup() (~802); the
   remote/from 403 branch (~661, ~671) maps reason 'expired' -> dropLocal + toast tokenExpiredMessage(label).
7. utils/lock-scope-refusal.js: add `expired` to LOCK_SCOPE_REFUSAL_TEXT (generic line, e.g. "This
   session token has expired."; the label-bearing server message would need 4 call sites changed) and
   update test/js/lock-scope-refusal.test.mjs's deepEqual of the table.
8. Tests: extend keyring-signin.test.mjs, keyring-client.test.mjs, pc-sessions.test.mjs (timer with
   fake Date/setTimeout), a pc-taskbar line test; tools/playtest/signin-fit.mjs token bar line. No new
   static imports planned, so no harness copy list should grow (check if that changes).
9. Fixture/PLAYTEST: lena_token already exists from run 2 step 9 (check PLAYTEST R12 text) and the
   build log "K5 client" section must list what R12's live check must see.

## Run 4 (2026-11-17): K3d merged, decisions applied, client started. START HERE
Commits: 79ef6957b (merge K3d), 79220e248, 714d0e00c (npc_frustration replay), 7885b5818 (proofFoothold), 85b50d291
(lock refusal helper), no-reader fix, 49a395072 (client WIP, untested), build log. See build log
"## Slice K5 run 4" for decisions, tests and the R12 checklist. Baseline before client work was green.
Design changes vs "Client half design" above: K3d IS merged now (signin-rows.js exists; its token
branch at signin-rows.js:165 is a marked hook; test/js/signin-rows.test.mjs:210 is a test.skip to fill);
step 7 is DONE differently (lockScopeRefusalLine helper, server line, five call sites); step 2 is DONE
in keyring.js (expired rows use server `proofFoothold`, plus a `tokenProofs` map) but has NO tests yet.
Open, in order:
1. Tests for keyring.js token code (noteTokenTimes full + unchanged, tokenSecondsLeft, screenEntries
   token on its foothold only / other foothold / keyboard / from / expired by proofFoothold / held token
   calls pcSessions.noteTokenExpiry) in keyring-client.test.mjs; remote-host-text token lines test.
2. signin-rows token row: "Use it on {host}'s sign-in screen, through {link}. About {n} min left."
   (under 60 s: "Under a minute left."). Pass link names (network_link items: footholdId -> name) from
   capture-log-model buildSections(items) and `tokenSecondsLeft` from capture-log-minigame.js:77-83
   (keyring answer object); fill the skipped test.
3. Steps 3, 4, 5, 6, 8 of "Client half design" (password-minigame greyed/expired, pc-sessions timer and
   noteTokenExpiry/tokenSecondsLeft + copied texts kept equal by a test, network-links/npc-workarounds
   tokenExpiredPcIds, pc-taskbar line + container-minigame interval and 403 expired, signin-fit).
4. Extend test_access_keyring PLAYTEST R12 with the build log checklist; full bin/test-js + Rails set.
Gotchas: Edit tool trims a trailing space in old_string (broke a test name once, fixed); K3d's GET
/keyring writes keyringGained, so "GET writes nothing" tests must except that key; flag-station and
password minigames no longer import LOCK_SCOPE_REFUSAL_TEXT.

## Run 5 (2026-11-17): token tests, Sign-ins row, screen states. START HERE
Commits: c79803b09 (keyring-token.test.mjs; fix: an `unchanged` answer with no map re-applied the cached
full answer's stale expiresInS, resetting the countdown), a follow-up (keyringForScreen passes
`route.foothold`, not `from ? null : foothold`), the Sign-ins token row commit, c9d864f91 (password screen).
Integrator decision logged in the build log: while the capture log is open a token row's minutes redraw
each minute from the client's own timer (no GET), as the taskbar's 60 s step; the timer stops on close.
Done: step 1 tests (test/js/keyring-token.test.mjs, 17 tests); step 2 (remote-host-text `tokenUseLine`,
`tokenTimeLeftLine`, `tokenMinutesLeft`; signin-rows `linkNames` + keyring `tokenSecondsLeft`, `row.timed`,
DOM `data-timed`; capture-log-model `linkNames(items)`; capture-log-minigame `TOKEN_ROW_REFRESH_MS` interval,
`tickTokens()`, cleared in cleanup; signin-rows.test.mjs:210 filled, capture-log.test.mjs K5 test);
step 3 (password-minigame `expired` on creds, greyed line, no post, 422 expired greys; pc-sessions
`credentialRefusalReason` b.expired -> 'expired'). Mutation checks: screen filter, foothold pass, stale
time fix, capture-log timer clear: all caught.
Open, in order: pc-sessions timer (`noteTokenExpiry`, `tokenSecondsLeft`, expiresAt from login answer and
load(), per-PC timer -> linkDropped token_expired with tokenExpiredEndedMessage; texts copied import-free +
a test keeping them equal to remote-host-text); `tokenExpiredPcIds` in network-links.js:~588 and
npc-workarounds.js:~359; pc-taskbar token line (reuse the rounding: "with a session token, about {n} min
left" / "under a minute left") + container-minigame 60 s refresh and 403 expired; signin-fit token bar and
row; PLAYTEST R12 text; full bin/test-js (heap rules in the brief) and full bin/rails test (not run in run 5;
the related 8 JS files pass).
Gotcha: a mutation run that hangs node leaves the mutated file in place; restore it before anything else.

## Run 6 (2026-11-17): pc-sessions timer, tokenExpiredPcIds, taskbar line. START HERE (Run 7)
Commits (this run, on build/keyring-k5): pc-sessions timer; "an unplug answer and a workaround answer pass
tokenExpiredPcIds"; "the desktop bar shows a token's minutes left ... a 403 expired closes with the token line".
Done: pc-sessions.js (`tokenFields`/`isToken`, `expiresAt` from login answer and load(), `_armToken`/`_disarmToken`
(timer unref'd, identity-checked), `noteTokenExpiry`, `tokenSecondsLeft(pcId)`, publicSession `tokenSecondsLeft`,
`tokenExpiredEndedMessage` copy + equality test, token sessions off `signedIn` and firstAtPc false, `linkDropped(ids,
reason, { tokenExpired })`, `_dropEnded`/signOut/displaced pass `tokenExpiredPcIds`, reason 'token_expired' closes with
the token line, toast when no desktop open); network-links unplug result/event carry `tokenExpiredPcIds`;
pc-sessions unplug listener and npc-workarounds (`deps.linkDropped(ids, tokenExpired)`) pass them; pc-taskbar
`tokenSessionLine`, `refreshTokenLines`, token branch of `credentialSessionLine`/`credentialLineHtml`;
container-minigame `TOKEN_LINE_REFRESH_MS` interval (`startTokenLineTimer`, stopped in cleanup) and the
403 `expired` branch (remote or from route: dropLocal, exitReason 'expired', toast tokenExpiredMessage(label)).
Tests added in pc-sessions, npc-workarounds, network-links, container-transfer-dialog (21 pass each file green).
Mutations caught: taskbar rounding (ceil->floor), 403 expired branch. Not caught: removing the timer's identity
check (redundant with _disarmToken on delete/replace; left as defence in depth).
Open, in order: (1) tools/playtest/signin-fit.mjs token bar line + a token row in the Sign-ins fixture (K3d section
~line 316-415 has `acct(...)` rows; add `{ id:'tok', kind:'token', ... expiresInS }` and a bar-line fixture);
(2) R12 text in scenarios/test_access_keyring PLAYTEST.md from the build log "What live check R12 must see" list
(build log line ~1399); (3) objectives-manager.js:~332 ignores pc_signed_in with relay: true; consider also ignoring
a token session (event has via 'credential' but no kind; _remoteOf could carry token: true) since the server never
records a token in signedInPcs (not done, not required by the brief); (4) build log "Slice K5 run 6" entry;
(5) full bin/test-js (node --max-old-space-size=2048; access-relay-desktop and access-from-desktop only as
`(ulimit -v 2000000; node --max-old-space-size=300 ...)`) and full bin/rails test (test DB only): NOT run yet.
Run the two heavy files for the 403 change in container-minigame (access-relay-desktop, access-from-desktop).
Gotchas: no new static imports this run (pc-taskbar deliberately has its own rounding copy, test keeps equal).
