# Player state deltas: build log

Branch: `build/sync-deltas` (off `main` at 6a834437c). Worktree
`.claude/worktrees/p-sync-build`, `node_modules` symlinked to `../p-9-2-h/node_modules`,
`.bundle/config` copied from `../p-9-2-h`.

Plan: `docs/achitechture/SYNC_DELTAS_PLAN.md` (Final). Build order is plan section 9. Tests follow
the shared brief's test lock rule: run every changed test file and every file that imports a changed
module, no full suites, no lock. The orchestrator runs the full suites per merge batch.

Standing constraints for this build:
- Another build (C3 replies, `build/c3-replies`) is editing `social_feed.rb` and `access_work.rb`
  at the same time. Keep edits to those two files minimal.
- Live proof uses a keyless server on port 3050 or higher, never :3000; check the port is free
  first; run headless (`--headless` to session-start.sh), `setFPS(20)` with fixed steps on.
- Never run `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop`, `db:setup`. The dev
  database is shared.
- Env: `export RBENV_VERSION=2.7.8` in every shell; postgres up
  (`pg_lsclusters | grep -q online || pg_ctlcluster 16 main start`).

## Progress

| Step (plan s9) | State |
|---|---|
| Import plan, audit, R1-R5 reviews | Done, committed |
| 1. Groundwork: named constants in game.rb | Done, committed, tested |
| 1. Groundwork: `stableJson` + `StateSync.stableJson` | Done, committed, tested |
| 1. Groundwork: `cpWithin`/`cpSlice` (three copies + shared node test) | Done, committed, tested |
| 1. Groundwork: phone `keyOf` option + stableJson wiring at the sync call sites | Done, committed, tested |
| 1. Groundwork: remove unused `ApiClient.syncState`/`updateInventory` | Done, committed, tested |
| 1. Groundwork: `stableJson` in `buildChanges`/`mailJobsChangeKey` (item 2) | Done, committed, tested (`06815b055`) |
| 1. Groundwork: export clips (item 4: clipMail*, phone/ink mirrors, mail constants) | Done, committed, tested (`9f85871c6`) |
| 1. Groundwork: constants test + literal scan (item 5, part) | Done, committed, tested (`3c7d13c96`) |
| 1. Groundwork: shared sanitiser fixture behaviour test (item 5, rest) | Done, committed, tested (`efe00765a`) |
| 1. Groundwork: registerPart/track, item_for_answer, prepare_bootstrap_state!, refuse_oversized_body (item 6) | Done, committed, tested (`0136faad5`) |
| 1. Groundwork: live-proof tools (item 8) + baseline (item 9) | Tool + `--seed-full-cloner` built and tested; baseline bootstrap/case-A numbers recorded (see Baseline) |
| Controller test for savedCurrentRoom (task 3) | Done, committed, tested (`853b69a59`) |
| 2. R1 seeding | Done, committed, tested (`c12d9d1e7`) |
| 3. P2 inventory/network answers | Done, committed, tested |
| 4. P1 cloner one-card deltas | Done, committed, tested |
| Merge main (batch 9, 33c003230) into the branch | Done (`f03396201`); capture tests reran green |
| 5. R3 capture-log seen keys | Done, committed, tested (`cb269170c`) |
| 6a-server. R2 recording machinery + migration + sync interception + carry-over guard + validator | Done, committed, tested (`a4401fb83`, `eea02e21a`, `cf05062a4`). Live browser proof NOT run (budget); HTTP/route proof is in captures_sync_test. See "6a-server session" below |
| 6a-client. capture-client.js + main.js wiring + SERVER_OWNED_GLOBALS flip + drop the mirror | Done, committed, tested + live-proven (`360232028`, `627caa0db`). See "6a-client session" below |
| Merge main (`f2d53bb40`, unlock-gaps-r1) into the branch | Done (`ccc1ec435`); delta replies kept, item_for_answer/inventory_answer_fields now filter like client_inventory. See "builder 6 session" |
| 6a-server review R1 fixes (M1, M2, N1-N4) + tests | Done, committed, tested (`5620ec5b6`). See "builder 6 session" |
| Clone-merge verification (task 1): branch's `cloneFrom: 'world'` records a world-card copy | Done, code + live proven (game 1894); no fix needed. See "builder 8 session" |
| 6b. R2 reveal/proof gating | Done, committed, tested (`9271f4435`). Route tests only; live cases D-F not run. See "builder 8 session" |
| 6b review R1 fixes (M1 doc, m1, n1, n2) | Done, committed, tested. See "builder 10 session" |
| 7. Node request-size cases (10.1) + sync_bodies fixtures | Done, committed, tested (`7d73e62c7`). See "builder 9 session" |
| 7. Rails answer-size test (10.2) | Done, committed, tested (`29a3a0815`). See "builder 9 session" |
| 7. Live proof A to F (10.3) | A/B-bootstrap (builder 9), E (builder 11) and F (builder 12) done; B/C/D full drives open |
| Merge main (b7d500ccf) into the branch | Done (`c6df37c82`); 1 conflict (IDEAS_BACKLOG), affected tests + validator green. See "builder 11 session" |
| 8. One release later: remove transition code | Not started (separate release) |

## Plan amendment (orchestrator ruling, 2026-11-12): 6a reconciled with main's serving path

The 6a blocker above (plan 6.3's writer-path `candidate_secret` overlapping main's merged
usePayload-secret fix) is resolved by the following ruling. It amends plan sections 6.2, 6.3, 6.4,
6.7 and 9 for the build; the plan text is left as written and this amendment governs where they
differ.

1. **One serving path, main's.** `Game#capture_secrets_for_client` keeps serving through
   `authored_capture_secret` / `authored_capture_secrets` (game.rb:1250 to 1364):
   - writer and `usePayload` secrets are looked up by target id against the authored
     `scenario_data` (`authored_capture_secrets`), not by a stored `writer` path;
   - the account-holder guard, the proof gates and the hard-access-value guard
     (`hard_access_capture_value?`, `CaptureModel.hard_access_values`) all stay;
   - plan 6.3's `candidate_secret`, its writer pass in `capture_secrets_for_client`, the stored
     `writer` key and `legacySecret` are DROPPED. No second candidate-secret or writer-path pass is
     added. Len's PIN is already served by main's `authored_capture_secret` (it is not a hard-access
     value: the records door is RFID/badge-locked, so the event-gated PIN opens no lock).
2. **6a's job is the size and ownership change.** `seCaptures` becomes server-owned:
   - the server records an entry when a capture is claimed (the sync `captures` part and the
     heard-share composition), taking every field from the scenario (plan 6.3 part 1 and part 4);
   - `se_captures` stops being a client-synced `globalVariables` section of `PUT /sync_state`;
   - an old save's `globalVariables.se_captures` migrates into `player_state['seCaptures']` once,
     on the bootstrap;
   - the client reads the record from the bootstrap (`captures`) and from the sync answer deltas;
   - `capture_secrets_for_client` and `NetworkAccess#account_capture_usernames` read the
     server-owned record (`se_captures_record`, which returns `player_state['seCaptures']` when
     present, else resolves the legacy global in memory for an old save and so keeps main's capture
     tests green), with the same semantics as today.
   - Every entry recorded under 6a is stored `proven: true` (as today, everything is revealable).
3. **R5 residue kept, applied on main's path:** m1 (authored capture-string limits + validator
   error), n1 (payload-owner handled by main's `build_authored_capture_secrets`, which already skips
   an account holder's writer and a username-addressed writer), n2 (`strip.empty?` in the
   account-holder test, already so in `CaptureModel.present_string?`), n4/n5/n6 taken where cheap.
   Plan 6.3's own `candidate_secret` payload-owner guard is moot because the writer pass is dropped.
4. **Live proof** (ruling point 3): the capture tests on main stay green
   (`capture_payload_secret_test`, `capture_payload_secret_routes_test`, `capture_secret_endpoint_test`,
   `lab_physical_pentest_secrets_test`, the `capture_proofs` tests), then Len's shoulder-surf beat
   played on the earned path in lab_physical_pentest.

## Plan amendment (6b review R1, M1, orchestrator ruling 2026-11-12): phish part 2 is advisory

The 6b review's M1 (a forged phish serves a hard-access capture secret because part 2 evidence is
client-synced) is accepted as best effort under q78, pending the user's answer to q87. The gate's
behaviour is unchanged: a landing-page `capture.secret` that is a hard-access value (a lock code,
PSK or flag) is served on the client-asserted part 2 evidence (a built landing-page record in
`globalVariables.se_landing_pages` plus a landed sent mail). This is the same best-effort boundary
the 6a review accepted for the bare-claim window: a forger only skips their own gameplay, there is
no cross-player or system impact, and honest play produces the same evidence. Authors must not put
a value behind a phish gate that they also want hard-enforced. The server-owned fix (record the
landing-page build and each phishing send on the server) is logged in docs/IDEAS_BACKLOG.md.

### 6b review n1 (logged, kept): part 3 is stricter than main's account pass

The review's n1 notes that `capture_evidence_holds?` requires a non-empty proof list to hold even
when the captured account's password opens nothing, where main's account pass short-circuits
(`account_capture_served?` returns true when `account_password_opens_something?` is false). Kept
deliberately: the direction is safe (it only ever withholds, never over-serves) and no authored
scenario hits it today (the lab account passwords all open something). An author who adds a
`captureProof` to an account whose password opens nothing would find the capture withheld until the
proof holds. Noted at the code site (capture_proofs.rb `capture_evidence_holds?`) and here.

## This session (2026-11-12, builder 11: merge main b7d500ccf + live case E; case F open)

### Merge main (b7d500ccf) -> `c6df37c82`
Merged main (ux-access toasts/password-minigame/container CSS, tap-pick game.js/player.js/
tap-pick.js/npc-pathfinding.js, hardening step 1 strict validator) into the branch. One conflict,
`docs/IDEAS_BACKLOG.md`: both sides appended backlog bullets; kept both (the sync deltas 6b review
M1 bullet, plus main's tap-pick R4 m1 and scenario-format hardening known-limit bullets). All other
paths auto-merged. The three files changed on both sides (`core/game.js`, `main.js`,
`scripts/validate_scenario.rb`) merged textually; the merged validator parses and the affected
tests pass, so the auto-merges are sound. (The `<<<<<<<`/`>>>>>>>` lines in
`physical_pentest_followup/STAGE_DIRECTIONS_M09_M10_REVIEW_R1.md` are pre-existing committed doc
content inside a code fence, not a merge conflict.)

### Tests after the merge (affected files, no lock)
- **Validator (strict, --no-graph):** lab_physical_pentest, lab_social_engineering,
  test_access_networks and test-rfid each exit 0 with 0 lines carrying the error cross. This
  branch adds no validator errors; no known-failures entry added for this branch's scenarios.
- **`MERGE_BATCH=1 node --test test/js/validator-known-failures.test.mjs`:** 15/15 pass.
- **JS (every test file importing a changed module, 110 files):** 1555 tests, 1554 pass, 1 fail:
  `event-mapping-unlock-door.test.mjs` is the pre-existing environmental node test-runner IPC
  error ("Unable to deserialize cloned data"); its own assertion passes (`ok 1 - the mapping config
  carries unlockDoor`). Not a regression (documented in Gotchas).
- **Rails (changed controllers/models: games, captures_sync, mail_state_sync, capture_proofs,
  capture_secret_endpoint, capture_payload_secret_routes, saved_current_room, network_inventory_
  delta, npc_frustration, capture_record, capture_secret, capture_payload_secret, sanitiser_cases,
  carry_over, sync_payload_size):** 236 runs, 1158 assertions, 0 failures. (Main changed no app/lib
  Ruby, so the merge introduces no Rails source change.)

### Live case E (an old save) -> PASS
Two keyless headless servers, shared dev DB, `setFPS(20)` and fixed steps on: base `6a834437c` on
:3246 (from p-sync-base), branch on :3245 (from p-sync-build). Games created from the base worktree
so the stored `scenario_data` is base-era: **1947** (lab_physical_pentest), **1948** (test-rfid).

Base phase (:3246, the real page): in 1947, `window.recordSECapture` ran the honest Len PIN beat
(targetId `len`, secret `4471`, the exact object the `player_watched_reader` eventMapping builds);
the first `PUT /sync_state` body carried `globalVariables.se_captures` (old format), and the base DB
row then held `globalVariables.se_captures = { len }`, `seCaptures` nil, 2 notes. In 1948, the real
RFID clone (`startRFIDMinigame` clone mode, source `{ npc_id: 'security_guard' }`, then
`handleSaveCard`) saved master_keycard: base DB row held `saved_cards = [master_keycard]` and
`serverClones = { master_keycard }`, `seCaptures` nil. Old-format save confirmed on both.

Branch phase (:3245, same game ids, same DB): the branch bootstrap migrated once. Checks:
- **migration runs once:** 1947 DB after the branch load has `globalVariables.se_captures` gone and
  `seCaptures = { len }`; `migrate_legacy_captures!` runs only while `legacy_captures?` holds, which
  it no longer does, so a second load is a no-op.
- **captures still show / secret served per 6b:** `GET /capture_secrets` returns
  `{"secrets":{"len":"4471"},"accounts":{}}`. The migrated legacy entry is grandfathered
  `proven: true`, so the PIN is served (6b reveal gate satisfied for a legacy entry).
- **cloned card still works at its door:** 1948 on the branch, the engine's real server path
  `ApiClient.unlock('door','test_secure',null,'rfid')` (no `card_ids`; the server validates against
  its own `serverClones`) answered `{ success: true, hasRoomData: true }`. The branch bootstrap's
  `repair_saved_cards!` also kept `saved_cards = [master_keycard]`.
- **nothing lost:** notes count preserved (2); saved_cards and serverClones preserved.
- **first PUT /sync_state is a small delta:** on both branch loads no `PUT /sync_state` fired in the
  observation window (nothing resent), the smallest possible delta; no body carried `se_captures`.
- **player_state shape:** `seCaptures` present, `globalVariables.se_captures` absent (DB dump).

Driver scripts (scratchpad, not committed): `e_base_drive.mjs`, `e_branch_verify.mjs`,
`e_door_server.mjs`; DB dump `dump.rb`.

### Live case F (an old tab) -> OPEN (handover)
Not run. Method for the next session: open a tab on the base server (:3246), drive the old-shape
state (a `lord` QR capture writing `globalVariables.se_captures`, Len's PIN, a chat-clone of
`cm_records_badge` sent as `{ npc_id }`, an action-menu clone of Melanie's comms card, a device
plant), keep the tab open, then stop the base process on :3246 and restart :3246 with the BRANCH
code (the tab's old `?v=` modules keep sending old shapes). Trigger a sync from the still-open tab
and check every `PUT /sync_state`, `POST /clone_card`, `POST /inventory` (`update_saved_cards`) and
`POST /network/plant` answers 200 and does not corrupt state (the server intercepts the
`se_captures` global and accepts `update_saved_cards` for one release, plan 5.4); then reload onto
branch code and check the capture is in the record, the tablet shows Len's PIN via
`/capture_secrets`, and Len's badge is listed (restored by `repair_saved_cards!`). The comms card is
the expected exception (action-menu clone sends no source on the old tab, so it is not recorded and
not listed after reload; copying it again on the new client lists it). The server-side acceptance of
the old shapes is already covered by the Rails suites (`captures_sync_test`, `mail_state_sync_test`,
`network_inventory_delta_test`, the clone tests); case F is the request-captured live confirmation.
The clearest portable harness is one Playwright script that keeps the page open while a child
process restarts :3246 onto the branch.

Both servers stopped at the end of this session.

## This session (2026-11-12, builder 12: live case F, an old tab across a server swap) -> PASS

One Playwright page held open for the whole run while a child process swapped the server on
:3246: base `6a834437c` (p-sync-base) first, then the branch `1fba1baa7` (p-sync-build) on the
same port, same dev DB. Keyless headless servers, `setFPS(20)`, fixed steps on. No engine or
server code changed. Games created by the base worktree's `new-game.rb lab_physical_pentest
--give kit_cloner --give kit_dropbox --unlock store_room --unlock open_plan`, so the stored
`scenario_data` is base-era.

- **Game 1972 (main run):** every old-shape action on the base server, then the same actions
  again from the old tab after the swap.
- **Game 1977 (variant):** as 1972, but the action-menu clone of Melanie's comms card happens
  only on the old tab after the swap, to test the predicted comms-card exception.
- Game 1964 was a first attempt with a driver fault (Len not yet encountered, so `/clone_card`
  answered 403 "NPC not encountered"; the authored captures not found in `window.gameScenario`).
  Not a result; ignore it.

Swap fidelity: the two worktrees have different `test/dummy/tmp/development_secret.txt`, so a
plain swap would have failed every POST on the CSRF check (a deploy keeps one secret_key_base).
For the run the base worktree's secret file was set to the branch's, and restored afterwards.

### Old-shape state driven on the base server (the real page)
- `GET /room/open_plan` (as the client loads a room): records Len and Melanie as encountered and
  supplies Len's `rfidCard` and the `pierce_comms_card` object.
- Len's PIN: `window.recordSECapture` with the authored `player_watched_reader` capture object
  (`len`, `4471`). The `PUT /sync_state` body carried `globalVariables.se_captures` (old shape).
- Chat clone of `cm_records_badge`: `startRFIDMinigame` clone mode with `cloneSource { npc_id: 'len' }`,
  the reader's real Save button: `POST /clone_card {npc_id, card_id}` 200 `recorded: true`, then
  `POST /inventory update_saved_cards` (full list) 200.
- Action-menu clone (1972 only on base): `window.objectActions()` on the card, "Clone it with the
  flipper", Save. No `cloneSource`, so no `/clone_card`; `update_saved_cards` 200. Ruth's
  `card_cloned` mapping added the `comms_card_cloned` capture to the old global.
- Device plant: `networkLinks.plant('network_port', 'kit_dropbox')`: `POST /network/plant` 200;
  the engine events added `network_drop` and `dropbox_view` captures to the old global.
- Base DB after (1972): `globalVariables.se_captures = {len, dropbox_view, network_drop,
  comms_card_cloned}`, `seCaptures` nil, `saved_cards = [cm_records_badge, lw_comms_card]`,
  `serverClones = {cm_records_badge}`, foothold `jack_network_port`, notes 3.

### Old tab on the branch server (base modules still loaded)
DB dump straight after the swap is identical to the base dump (the restart changes nothing).
Every request from the old tab, both games:

| Request (old tab, branch server) | 1972 | 1977 | Notes |
|---|---|---|---|
| `GET /room/open_plan` | 200 | 200 | |
| `PUT /sync_state` (new `reception_pretext` capture, whole old `se_captures` map) | 200, req 2,281 B, resp 2,082 B | 200, req 1,797 B, resp 1,598 B | server intercepts the global and migrates it |
| `POST /inventory update_saved_cards` (chat-clone overwrite) | 200 | 200 | filtered merge |
| `POST /clone_card {npc_id: len}` | 200 `recorded: true` | 200 `recorded: true` | |
| `PUT /sync_state` (comms clone capture) | none (already held) | 200, req 4,472 B, resp 2,082 B | |
| `POST /inventory update_saved_cards` (menu clone, no source) | 200 | 200 | `lw_comms_card` not added (no `serverClones` key) |
| `POST /network/unplug` | 200 | 200 | |
| `POST /network/plant` | 200 (`first: false`) | 200 (`first: false`) | |

No 4xx or 5xx on any watched request in either game after the swap.

State diff, old-tab phase (DB dump before and after, path level):
- `globalVariables.se_captures` removed; `seCaptures` added with the same keys plus the new one
  (1972: len, dropbox_view, network_drop, comms_card_cloned, reception_pretext; 1977 the same).
  Each migrated entry carries `proven: true`; `len` no longer stores `secret` (served from the
  scenario, as the 6a ruling says).
- cloner `saved_cards`: only the `cm_records_badge` timestamp changed; nothing dropped.
- footholds: unplug then plant left `jack_network_port` at `seq 1`, `gainedFootholds =
  [network_port]`, the link item back in the inventory and `kit_dropbox` not duplicated.
- 1977 also gained `kp_comms_cloned: true`, `opt_clone_in_place` completed and the two
  `card_cloned` triggered events, all from the old tab's own syncs (as on the base).
- Nothing else changed apart from the clock and `lastSyncClientTs`. Notes count stayed 3.

### After the reload onto branch code
| Check | 1972 | 1977 |
|---|---|---|
| captures in the record (`seCaptures`, DB) | 5 entries, legacy global gone | 5 entries, legacy global gone |
| `GET /capture_secrets` | 200 `{"secrets":{"len":"4471"},"accounts":{}}` | same |
| Len's badge listed (client cloner `saved_cards`) | yes | yes |
| comms card listed | yes (see below) | no (the expected exception) |
| foothold shown by the client | `jack_network_port` | `jack_network_port` |
| branch `PUT /sync_state` after reload | none fired | 200, 1,036 B, no `se_captures` |

The comms-card exception holds as predicted when the card is first copied on the old tab after
the swap (1977): no source, no `serverClones` key, so the branch's filtered `update_saved_cards`
does not add it and it is not listed after the reload. Copying it again on the new client lists
it. When the card was already copied and stored on the base server before the swap (1972), it
stays listed after the reload, because the filtered merge never removes a stored card. Such a
card has no `serverClones` entry, so it is the same case as an old save's legacy card (case E).

### Observations (no bug found)
- For one release an old tab keeps re-sending its whole `globalVariables.se_captures` map on each
  sync that touches it (up to 4,472 B here), and the branch answers each with a `captures` part
  listing every entry it sent (1,598 to 2,082 B). The old client ignores the answer part. Bounded by
  the authored capture count and gone once the tab reloads; the new client sends no `se_captures`.
- The empty `{}` third note in both games is a driver artefact: the base phase pushed a plain
  string into `gameState.notes`, which the base stored as `{}`. It was there before the swap and
  is unchanged by it.

Driver (scratchpad, not committed): `p-sync-f/f_drive.mjs` (one page, child-process server swap;
`GAME`, `MENU_ON_BASE=0`, `RUN_TAG`), `p-sync-f/dump.rb`, `p-sync-f/diff.mjs`; results
`f_result.json` (1972) and `v2_f_result.json` (1977) with per-phase `state_*.json` dumps. Both
servers stopped at the end.

## This session (2026-11-12, builder 10: 6b review R1 fixes M1/m1/n1/n2)

Applied the sync deltas 6b review R1 fixes. Server-only Ruby plus docs; no JS changed, so no JS
harness copy-list change and no JS rerun.

- **M1 (doc only, no gate change):** the plan amendment above (part 2 advisory) and a
  docs/IDEAS_BACKLOG.md entry (record the landing-page build and each phishing send on the server
  so part 2's evidence is server-owned).
- **m1 (`games_controller.rb`, `capture_proofs.rb`):** a forged, never-provable unproven entry no
  longer makes every later evidence-carrying sync load `scenario_data` to run a stamp that finds
  nothing. New `CaptureProofs#phish_evidence_fingerprint` is a cheap, bounded, scenario-free
  fingerprint of the part 2 evidence (each page's built / meetsThreshold / victim.submitted flags
  and the landed sent-mail (targetId, kitId) set, plus the request's own sent messages). sync_state
  takes the fingerprint before the merge (only when an unproven entry exists), and the capture step
  compares the post-merge fingerprint: when it is unchanged, no new phish evidence arrived and the
  scenario load and stamp are skipped. Computed only, never stored, so no synced state grows.
- **n2 (`capture_proofs.rb`):** `each_stored_sent_message` now materialises the mailbox scan once
  per request and memoises it against the mailboxes hash identity, so several `capture_revealable?`
  / stamp checks (or several unproven entries) reuse one walk. `merge_mail_state!` replaces
  `player_state['mailState']` with a fresh object, so a merge within the request changes the
  identity and the memo recomputes; the readers never mutate mail, so the memo holds through their
  loop.
- **n1 (logged, no behaviour change):** see the amendment above; a comment at
  `capture_evidence_holds?` records the deliberate stricter part 3.

**Tests (affected files, no lock):** `capture_record_test` (model: a `phish_evidence_fingerprint`
stability/advance case and an `each_stored_sent_message` memo-identity case) and
`capture_proofs_test` (controller: an `m1` case that counts the `SELECT scenario_data` queries and
asserts 0 for a sync with no new phish evidence and >= 1 when the page is built, via a
`sql.active_record` notification subscriber) -> 48 runs, 241 assertions, 0 failures. Regression set
green: `captures_sync_test` + `mail_state_sync_test` (18 runs), `games_controller_test` (63 runs),
`capture_secret_test` + `lab_physical_pentest_secrets_test` + `capture_payload_secret_test` +
`capture_payload_secret_routes_test` + `capture_secret_endpoint_test` (55 + 61 runs across the two
batches), all 0 failures.

## This session (2026-11-12, builder 9: step 7 size tests + live proof)

### Node request-size cases (10.1) -> `7d73e62c7`
`test/js/sync-request-sizes.test.mjs` (8 cases, plain `node --test`, all green), the q77 size
guard. Each builder case measures the real request body where the client builds it and writes it
to `test/fixtures/files/sync_bodies/*.json` under `--write-fixtures`, so the Rails test posts the
same bytes. Measured sizes (all within bound):
- buildChanges after seedFromBootstrap: matching load -> `null` (0 B); different room ->
  `buildchanges_room_only.json`, currentRoom + clock + timedMessages only, 174 B (< 1000).
- exportPhoneState with `keyOf=stableJson` after a jsonb-reordered restore -> `{}` (no resend).
- EM4100 clone_card body `clone_card_em4100.json` 417 B (< 600); fully cracked MIFARE Classic
  (16 sectors) `clone_card_mifare.json` ~1861 B JSON file, body itself < 1500.
- capture-client `captures` part, one credential (lab_social lord) 118 B, one foothold
  (lab_physical store_controller) 60 B; both < 300. Fixtures wrap them as the sync body.
- capture-log seen writes: three new rows -> three `__capture_log_seen:<key>` booleans, each < 60 B.
No new static engine import, so no JS harness copy-list change.

### Rails answer-size test (10.2) -> `29a3a0815`
`test/integration/sync_payload_size_test.rb` (6 cases, green). Builds games from the real
test_access_networks, test-rfid, lab_social_engineering and lab_physical_pentest through
`Game#generate_scenario_data`, seeds a 50-card legacy `rfid_cloner` by hand (the old-save shape no
route can fill), posts the 10.1 fixtures, and asserts `response.body.bytesize` only:
- `/inventory` add + remove with the 50-card cloner held: both < 100 B, no `saved_cards`.
- `/network/plant` + `/network/unplug` with `delta:true`, cloner held: both < 1500 B, no
  `saved_cards`.
- `/clone_card` MIFARE fixture (NPC path, guard holds master_keycard): recorded, < 200 B.
- `PUT /sync_state` capture fixture, lab_social lord credential: answer records lord, < 600 B.
- `PUT /sync_state` capture fixture, lab_physical store_controller foothold: the 693-char note
  rides whole, answer < 1200 B.
- `GET /scenario` for all four scenarios: within the base commit measure + 1 KB (base figures from
  the Baseline table, commit 6a834437c, written as `BASE_BOOTSTRAP_BYTES`).

### Live proof (10.3): bootstrap + A + B-bootstrap run; C to F open

Two keyless headless servers, shared dev DB: branch `build/sync-deltas` on :3235 (from
p-sync-build), base `6a834437c` on :3236 (from p-sync-base). `setFPS(20)`, fixed steps on.
Games created by the branch `new-game.rb`: 1907 (test_access_networks + `--seed-full-cloner`,
50 cards = 12,903 B), 1908 and 1909 (lab_social_engineering). Both servers stopped after the run.

**P1/P2, bootstrap and the inventory echo (game 1907, test_access_networks + full cloner):**

| Request | Base (:3236) | Branch (:3235) |
|---|---:|---:|
| `GET /scenario` resp | 18,973 B (saved_cards in playerInventory) | 19,220 B (saved_cards in playerInventory) |
| `POST /inventory` boot echo | 13,303 B (carries the 50-card list) | 31 B (no saved_cards) |

The 50-card list rides `GET /scenario`'s `playerInventory` once per load on both, which the rule
allows (bounded, once per load). P2 is proven: the `POST /inventory` echo drops from 13,303 B to
31 B and no longer carries `saved_cards`. Branch `GET /scenario` 19,220 B is within base 18,973 + 1 KB.

**R1, first `PUT /sync_state` after each load (lab_social_engineering):**

| Phase | Base (:3236, game 1908) | Branch (:3235, game 1909) |
|---|---:|---:|
| load1 (fresh game, nothing confirmed yet) | 5,021 B | 5,004 B |
| first sync after reload 1 | 5,471 B | 917 B |
| first sync after reload 2 | 5,470 B | 602 B |

R1 is proven: the base resends the whole client state (~5.47 KB) on every reload; the branch sends
only the delta after a reload (602 to 917 B: `currentRoom` with the clock and timed-text riders,
plus what the tool changed during play). Answer 16 B each on both.

**Open live cases (handover):** the full case B drive (plant/unplug/join/implant answer sizes) and
cases C to F (cloner reload, captures D, old save E, old tab F, with Len's PIN timing) are not yet
implemented in `sync-delta-proof.mjs` (only bootstrap, A and a B-bootstrap stub exist). The size
tests (10.1/10.2) already cover the network delta answer size and the capture answer sizes
non-live; the remaining live work is the request-captured proof for C to F per plan 10.3.

### Live proof follow-up (2026-11-12, builder 10): branch clone spot-check; C to F full drives still open

Two keyless headless servers were up for this (branch on :3240 from p-sync-build, base `6a834437c`
on :3241 from p-sync-base, shared dev DB), `setFPS(20)` and fixed steps on. Game 1935 (test-rfid)
created by the branch `new-game.rb`.

Branch-side clone spot-check (game 1935, test-rfid, master_keycard via the chat-clone source
`{ npc_id: 'security_guard' }`, driving the real `window.ApiClient.cloneCard(source, cardId, card)`
with the UI click substituted and the wire identical): `POST /clone_card` answered 45 B with
`{ success: true, recorded: true, saved: true }`, no `saved_cards` in the answer and no
`update_saved_cards` request; the saved card persists server-owned (`access.savedCards()` lists
`master_keycard` after a fresh load). The same direct call on the base server answered
`{ success: true, recorded: true }` (no `saved` field; the base client still saves the whole list
client-side through `/inventory update_saved_cards`). This confirms the P1 win on the real branch
page: the clone answer carries no card list.

**Still open (full before/after UI drives for cases B, C, D, E, F).** Not completed, and NOT
faked. The honest before/after these cases ask for is portable UI-level driving that runs the same
way on both servers, because the base commit serves different client code (no 3-arg `cloneCard`,
no `savedCardForServer`, the save rides `persistSavedCards` -> `/inventory update_saved_cards`; the
network answers echo the whole inventory). A direct branch-module drive is wire-identical on the
branch only, so it cannot produce the base "before" for the same action. The remaining work:
- **B (network):** drive `window.networkLinks.plant/unplug/join/implant` through a reachable jack /
  AP in test_access_networks (needs the network view opened), with `--seed-full-cloner`, recording
  each answer size and checking no `saved_cards`; `networkLinks.*` exists on both servers, so B is
  the most portable of the five and the best next target.
- **C (clone):** complete the real RFID clone minigame (or drive each client's own save path) for
  master_keycard (chat), ceo_keycard (action menu, world id stamped live) and a repeat, on both
  servers; reload and check the doors.
- **D (captures + Len's PIN):** the phish landing in lab_social and the QR route plus Len's PIN
  2.5 s window polling in lab_physical (stand at the ledger shelves, poll
  `window.gameState.globalVariables` every 100 ms, click only when `len_at_door` and `len_keying`
  are both true, up to three rounds).
- **E / F (old save, old tab):** the base-to-branch swap and the old-tab restart; architecturally
  the heaviest.
These remain a multi-session effort (prior sessions reached the same conclusion). The size tests
(10.1/10.2) and builder 9's live bootstrap/A/B-bootstrap table already bound the request and answer
sizes non-live and for the first-sync and bootstrap paths; cases B to F are the per-action live
request captures still owed.

## This session (2026-11-12, builder 8: clone-merge verification + 6b)

### Clone-merge verification (task 1) -> no fix needed
Merge `ccc1ec435` kept this branch's `action-menu.js:84` call `cloneFrom: 'world'` (dropping main's
`cloneSource: {object_id}`). Confirmed the branch's path still records a world-card copy:
- **Code.** The action menu passes `cardToClone: data` (data = `sprite.scenarioData`, the room
  object, which carries `id`). `recordCloneOnServer` (rfid-minigame.js:384) builds
  `body = { object_id: cardData.id }` when `cardData.id` is present (:394). The world keycard in
  test_clone_left_card carries `id: "clerk_card_item"` (scenario.json.erb:117), so the body is
  `{ object_id: "clerk_card_item" }` -> `record_card_clone!` records it via `clone_source_keycard`.
  main's `cloneSource: {object_id}` produced the same body; it is redundant given `cardData.id`.
- **Live** (keyless :3220, game 1894, test_clone_left_card). Drove the live page's real
  `ApiClient.cloneCard({object_id:'clerk_card_item'},'clerk_card',card)` (the exact body the
  action-menu->recordCloneOnServer path builds for a world card; UI click substituted, wire
  identical). Answer `{success:true, recorded:true, saved:true}`. After reload, server state:
  `serverClones["clerk_card"] = { source:{ object:"clerk_card_item" }, uidOnly:false }`, and the
  saved display card is stored under the SERVER's own name ("Clerk's access card"), not the
  client-sent name (P1 identity-from-server holds). The vault door is `lockType rfid requires
  clerk_card`, which the clone emulates, so it opens. No `PUT /sync_state` body carried
  `se_captures`. Verdict: the merge choice is correct; no restore needed.

### 6b (R2 reveal/proof gating) -> `9271f4435`
Built per plan 6.3-6.8 as amended by the orchestrator ruling (serving stays main's
`authored_capture_secret` path; 6b adds a `capture_revealable?` gate on the readers, no writer pass).
- **CaptureModel** (`lib/break_escape/capture_model.rb`): `target_capture_proofs(data, target_id)`
  (part 3, keyed on the captured account: account holder's `proofs_for` when the candidate address
  is a username, else the owner/payload_owner `captureProof` and the candidate's own `proof`);
  `pages_with_secret(data)` (single-secret fallback page set).
- **CaptureProofs** (`app/models/break_escape/capture_proofs.rb`): `capture_evidence_holds?`
  (foothold -> true; credential: part 2 phish page record + landed sent mail from stored mailState
  or `extra_sent`; part 3 proofs), `capture_revealable?`, `stamp_proven_captures!`,
  `stampable_captures?`, `unproven_captures?`, private `phish_evidence_page_for`/
  `phish_page_evidence_holds?`/`each_stored_sent_message`. `record_capture!` now computes `proven`
  via `capture_evidence_holds?` instead of hard `true`. `record_shared_login!`/migration keep
  `proven: true` (heard shares and migrated 6a entries are grandfathered).
- **Readers** (`game.rb` `capture_secrets_for_client`, `network_access.rb`
  `account_capture_usernames`): skip an entry unless `capture_revealable?`.
- **se_captures_record** (`game.rb`): a legacy `globalVariables.se_captures` fallback now returns
  each entry marked `proven: true` (an old save is grandfathered; plan 6.3 "every kept entry taken
  as proven"). This is why the four capture_secret/endpoint/proofs tests that seed the legacy
  global stay green.
- **Bootstrap** (`game.rb`): `bootstrap_state_needs_write?` ORs `stampable_captures?`;
  `run_bootstrap_writers!` runs `stamp_proven_captures!` so a secret earned across a reload serves
  without a fresh sync.
- **Sync step** (`games_controller.rb` `apply_capture_sync_step(stale:)`): after recording, on a
  non-stale request, stamps with the request's own sent messages
  (`Game#incoming_sent_messages`); the scenario is also loaded (and the stamp runs) when an
  unproven entry exists and the request carries globalVariables or mailState, even with no new
  capture. A stale request never stamps (its mail is not merged).
- **N1 follow-up** (`game.rb` `stored_scenario_data`): reuses the loaded `scenario_data` attribute
  on a full load (GET /scenario, /capture_secrets) and only queries on the narrow sync load, so
  GET /scenario loses the extra pick. One source either way (`with_lock` reloads all columns).

**Behaviour checked (task 2):** Len's PIN in lab_physical_pentest is still served on the honest
earned path (not proof-gated, not a phish target -> `capture_evidence_holds?` true at record;
lab_physical_pentest_secrets_test green). A forged phish page claim (a capture recorded on a client
claim with no built page / sent mail) is NO LONGER served (new tests
`6b: a landing page capture claimed with no phish evidence is not served` and
`6b: a stale request records but does not serve a phish credential`); adding the evidence later
serves it and stamps proven, and un-building the page afterwards keeps it served. A 6a-grandfathered
`proven: true` entry is still served with no evidence. lab_physical_pentest's account captures
(hampshire/lord/pierce) were already proof-gated by the account pass under 6a; 6b's part 3 keys on
the same proofs, so no change there.

**Tests (affected files, no lock):** capture_secret/capture_payload_secret/
lab_physical_pentest_secrets/capture_proofs/capture_secret_endpoint/capture_payload_secret_routes
(89 runs) green after adapting one capture_proofs case to supply the phish evidence and adding four
6b cases (31 runs); capture_record + captures_sync + capture_secret (68 runs) green; network_withholding
+ access_model_withholding + npc_workaround_h + access_leak_scanner (98 runs) green;
games_controller + mail_state_sync + reload_persistence (141 runs) green. No JS changed (6b is
server-only); no harness copy-list change.

### Open after this session (builder 8)
- **Step 7** NOT started: node request-size cases (plan 10.1) + `test/js/sync-delta-proof.test.mjs`
  is the only size-ish JS test present; the 10.1 body-builder size cases and
  `test/fixtures/files/sync_bodies/*` fixtures do not exist. Rails `test/integration/
  sync_payload_size_test.rb` (10.2) does not exist; use the Baseline table figures
  (`GET /scenario` base bytes per scenario above). Live A-F via
  `tools/playtest/sync-delta-proof.mjs` against `.claude/worktrees/p-sync-base` on a second
  keyless server (>= 3205) not run; cases C-F are not yet implemented in the tool (only bootstrap,
  A, B stubs). Record before/after.
- **6b live cases D, E, F** (plan 10.3) not run; 6b is proven only at route/model level.
- Server on :3220 and tmp scripts were cleaned up at end of session.

## This session (2026-11-12, builder 6: merge main f2d53bb40 + 6a-server review R1 fixes)

### Merge of main `f2d53bb40` (unlock-gaps-r1) -> `ccc1ec435`
unlock-gaps-r1 added `Game#client_inventory` (a filtered deep copy via `filter_inventory_for_client!`),
stored start items filtered, and made every network route echo `client_inventory`. This branch's P2
replaced those echoes with the delta replies. Conflicts in four files, all resolved to keep the delta
contract:
- `network_access.rb` (7 conflicts) and `games_controller.rb` (3 conflicts): kept this branch's
  delta replies (no inventory echo on add/remove/plant/unplug/join/implant; `{ success: true }` /
  `{ already: true }`), dropped main's `inventory: client_inventory` on those answers.
- `game.rb`: kept both sides -- this branch's `bootstrap_state_needs_write?`/`run_bootstrap_writers!`
  and main's `client_inventory`/`filter_inventory_for_client!`.
- `action-menu.js`: kept this branch's world-keycard clone call (`cloneFrom: 'world'`, the P1 5.2
  convention rfid-minigame.js and interactions.js use), dropped main's superseded `cloneSource:
  {object_id}`.
Then, as the merge spec and unlock-gaps' build log ask, routed the delta's `added` items and the
non-delta compatibility echo through the same stripping as `client_inventory`:
`item_for_answer` now calls `filter_inventory_for_client!` after dropping `saved_cards`, and
`inventory_answer_fields`'s non-delta branch returns `{ inventory: client_inventory }` instead of the
raw stored array. `item_for_answer_test` gains a lock-answer-strip case. Bootstrap/reload still send
`client_inventory` (untouched). Tests (affected, no lock): network delta/footholds/wifi/implants +
start_item_answer_network (71 runs), the 7 capture tests (72 runs), games_controller + lab secrets +
item_for_answer (110 runs), JS rfid-clone-card/inventory-tray/network-links/network-view (118) -- all
green.

### 6a-server review R1 fixes (M1, M2, N1-N4) -> `5620ec5b6`
- **M1** (`scripts/validate_capture_log.rb`): error when an authored capture `note`/`roleLabel`/
  `address`/`host` contains a `CaptureModel.hard_access_values` value (substring, >= 3 chars). Keeps
  the note channel as safe as the withheld `secret` channel.
- **M2** (`capture_model.rb` + `validate_capture_log.rb`): `default_account_address!` now applies only
  to a self-capture (`owner_id == targetId`); the validator errors when a cross-target **credential**
  capture on an account holder authors no address (a foothold keys on host, so it is exempt).
  lab_physical_pentest's `usb_lure` foothold (written on holder `lord`) is correctly not flagged.
- **N1** (`game.rb` + `games_controller.rb`): one `Game#stored_scenario_data` helper
  (`where(id:).pick(:scenario_data)`) now feeds the sync step (apply_capture_sync_step, biometric
  merge) and the bootstrap writers (`run_bootstrap_writers!`), so the two capture paths read one
  scenario source.
- **N2** (`games_controller.rb`): the over-cap refusal loop skips an id already in `@capture_answers`,
  so a duplicate target past the 64-cap is not answered and refused at once.
- **N3** (`capture_model.rb`): `shared_login_capture` clips the composed note to
  `MAX_CAPTURE_NOTE_CHARS`, the one capture string that had no authored bound.
- **N4** (`validate_scenario.rb` + `game.rb` + new `carry_over_server_owned_globals_test`): comments
  at both sites plus a guard test tie the validator's carry-over `%w[se_captures]` literal to
  `Game::SERVER_OWNED_GLOBAL_NAMES`.
Tests added: M1/M2 (validator-capture-log.test.mjs, 17 pass), N2 (captures_sync_test), N3
(capture_record_test), N4 (carry_over_server_owned_globals_test). Rails capture regression set
(capture_secret/payload/lab_secrets/proofs/routes/endpoint 89 runs, npc_workaround_h + carry_over 61
runs, capture_record + captures_sync + N4 guard 24 runs) all green. Validator `--no-graph` on
lab_physical_pentest and lab_social_engineering: 0 errors each.

### Open after this session
- **6b** (R2 reveal/proof gating, plan 6.3-6.8): NOT started. A clean separate unit; 6a stands
  without it (every 6a entry is `proven: true`). Compute `proven` in `record_capture!`, add
  `capture_evidence_holds?`/`stamp_proven_captures!`/`target_capture_proofs`, wire the stamp into the
  bootstrap and sync, with the 6b tests (plan 6.8). Entries stored under 6a keep their `proven: true`.
- **Step 7** (size tests + live cases A-F): NOT started. Node request-size cases (plan 10.1), Rails
  answer-size test (10.2) using the Baseline table figures, then the live A-F drive via
  `tools/playtest/sync-delta-proof.mjs` against the base worktree `.claude/worktrees/p-sync-base` on a
  keyless server (port >= 3205). No live browser proof run this session; the merge and review fixes are
  covered by unit/route tests only.
- Stopped at ~80 tool calls at a clean step boundary (merge + review fixes both committed) rather than
  start 6b half-done.

## This session (2026-11-12, 6a-client: the capture record leaves the client-synced state)

Built the whole "Remaining 6a-client spec" as one unit and live-proved it. Commits:
`360232028` (implementation + adapted tests), `627caa0db` (`capture-client.test.mjs`).

### What shipped
- New `public/break_escape/js/systems/capture-client.js`: `installCaptureClient(stateSync)` registers
  the `captures` sync part (build/onAnswer/pendingCount/flushKeep) and sets `window.submitSECapture`
  and `window.mirrorSECapture`. `submitCapture` mirrors the entry (`writeGlobal('se_captures', ...)`,
  first-wins), queues `{ targetId, kind, address, host, roleLabel }` and runs the sync; `onAnswer`
  replaces each answered mirror entry with the server's (secret-less) one and clears pending, drops a
  refused one from pending and the mirror; `flushKeep` keeps a pending target's sent records through
  the pagehide flush; `mirrorCapture` writes the mirror only (a heard share the server recorded).
  Only static imports: captures.js and global-writer.js.
- `main.js` (:41, :145): static import of capture-client.js and `installCaptureClient(window.stateSync)`
  right after `new StateSync`, before `start()`.
- `state-sync.js`: `SERVER_OWNED_GLOBALS = new Set(['se_captures'])`; `buildSharedSections` deletes
  server-owned keys from the outgoing globals (the build-log claim that it "already skips" them was
  wrong — it did not; the filter is new); the `CAPTURES_KEY`/`CAPTURE_ENTRY_KEYS`/`sanitizeCaptureEntry`
  guard branch is gone (the key is never sent). seedFromSaved/seedFromBootstrap already skipped it.
- Writers: mail-bridge.js `recordCapture` and apply-actions.js `recordSECapture` now call
  `window.submitSECapture` (apply-actions keeps `window.recordSECapture` and its export, returning the
  boolean straight away; its lazy captures.js import is gone; mail-bridge's unused captures.js import
  removed). npc-workarounds.js's heard-share dep now calls `window.mirrorSECapture`.
- core/game.js (:1716 area): mirrors the bootstrap `captures` into `window.gameState.globalVariables
  .se_captures` for the readers, only when the bootstrap carries `captures` or the scenario declares
  `se_captures`. The 6a-server bootstrap `savedGlobalVariables.se_captures` mirror is dropped from
  `GamesController#scenario` in the same change.
- Leak scanner (`tools/playtest/lib/access_leak_scanner.rb:683`): the revealSecret exemption moved
  from `.se_captures` to the `.captures` path (the record now rides the bootstrap/answer `captures`,
  not the global); `access_leak_scanner_test.rb` updated to the new bootstrap shape.

### Tests (affected files only, no lock)
- Rails: `access_leak_scanner_test` 43/258, `captures_sync_test` 8/28 (updated: the reload test now
  asserts `captures` ships and `savedGlobalVariables.se_captures` is absent), `capture_record_test`
  13/45, `capture_secret_test` 7/12, `lab_physical_pentest_secrets_test` 38/960, `capture_proofs_test`
  27/165, `capture_payload_secret_test` 12/207, `capture_payload_secret_routes_test` 2/24,
  `capture_secret_endpoint_test` 3/7, `reload_persistence_test` 69/254, `games_controller_test`
  63/206 — all 0 failures.
- JS: new `capture-client.test.mjs` 12/12; `state-sync` 23 (3 new: se_captures not sent, not seeded,
  a registered part makes buildChanges non-null), `social-captures` 9 (the sync-boundary tests now
  assert se_captures is left out of the outgoing globals), `add-capture-action` 4 and
  `social-mail-bridge` 23 (both install capture-client on a stub stateSync). Every test/js harness
  that copies apply-actions.js / mail-bridge.js / npc-workarounds.js / state-sync.js / captures.js
  (75 files) reran green.

### Live browser proof (keyless server :3185, headless, setFPS(20), fixed steps on)
Against the real lab_physical_pentest scenario. Games created on the shared dev DB: 1869, 1873.
- Bootstrap `GET /scenario` = 23,797 bytes (baseline 23,762, +35; still well under base+1 KB). The
  `POST /inventory` boot echo is 16 bytes now (baseline 1,088 — the earlier P2 delta step).
- Len's capture driven through the honest client path (`window.recordSECapture` with Len's authored
  fields, the exact object the `player_watched_reader` eventMapping builds, which now routes through
  `window.submitSECapture`): on a fresh game, one `PUT /sync_state` carried the `captures` part for
  `len` (131 bytes, no note) and **no** PUT body carried `se_captures`; `GET /capture_secrets` served
  `{ len: "4471" }` only after the capture (empty before); after a reload the bootstrap re-shipped it
  under `captures.len`, `savedGlobalVariables.se_captures` was absent, and the mirror held `len`.
  NB: the full diegetic drive of Len's routine (walking the beat, the 2.5 s listening window) was
  substituted with a direct call to the same client entry point the beat invokes; the wire is
  identical.

## This session (2026-11-12, 6a-server: recording machinery, migration, sync interception)

Built 6a-server as one coherent, backward-compatible unit, per the orchestrator amendment
(serving stays main's authored path; no writer pass, no candidate_secret, no legacySecret, no
stored `writer` key). Commits: `a4401fb83` (implementation + two adapted tests), `eea02e21a`
(new tests), `cf05062a4` (validator). Files: `lib/break_escape/capture_model.rb`,
`app/models/break_escape/capture_proofs.rb`, `app/models/break_escape/game.rb`,
`app/controllers/break_escape/games_controller.rb`, `app/models/break_escape/npc_frustration.rb`,
`app/models/break_escape/carry_over.rb`, `scripts/validate_capture_log.rb`,
`scripts/validate_scenario.rb`, and tests `capture_record_test.rb`, `captures_sync_test.rb`,
plus adapted `capture_proofs_test.rb` and `npc_workaround_h_test.rb`.

### What the record stores
`player_state['seCaptures'] = { targetId => { targetId, roleLabel, address, kind, host, note, at,
proven } }`, proven: true always under 6a. No secret, no `writer`. `se_captures_record` (already in
place) keeps the legacy-global fallback so an un-migrated old save still serves.

### Candidate model (`CaptureModel.capture_candidates`)
Fields taken from the scenario exactly as the honest client writes them (captures.js
makeCaptureEntry: closed keys, kind defaults to credential, blank strings dropped, no secret):
- an add_capture action / addCapture mapping's `capture` hash (plain), and overlaid with the owner
  NPC's usePayload (payload wins) where it has one;
- a standalone usePayload with its own `targetId` (an NPC with no addCapture mapping, e.g. lena);
- a phish credential, one per landing page a `social.mailClient.payloadKit` link kit names
  (address = page capture.address else the target's own address, note = page capture.note,
  roleLabel = target role); a phish foothold (host/note from the block).
- **Account-holder address defaulting:** a writer whose owner (or payload owner) holds an account
  and authors no address takes the account username as its address. This is load-bearing for
  serving: both readers key an account holder's secret on `entry['address']`
  (capture_secrets_for_client by_username, NetworkAccess#account_capture_usernames). Without it the
  test fixture's no-address account mappings (mel) and lena's usePayload-only capture are unserved.

### record_capture! selection
Picks the candidate whose client-given address/host/roleLabel all match (client blanks ignored),
plain preferred over overlaid, else the first plain candidate. Stores the candidate's fields whole.
Refuses: non-Hash, targetId not a string <=100 cp (`invalid`), kind outside credential/foothold
(`invalid`), a client address/host/roleLabel over 200 cp (`invalid`), an undeclared target
(`undeclared`), a share-only target not in sharedLogins (`server_only`). A share-only target in
sharedLogins is recorded by record_shared_login! from the server's own composition.

### Controller
`sync_state` runs `apply_capture_sync_step` after merge_grow_only_sections, on stale too: it reads
`params[:captures]` + the old-tab `params[:globalVariables]['se_captures']` values (which
merge_global_variables! drops, so the global is never stored), records each through record_capture!,
caps at MAX_CAPTURES_PER_SYNC (64, overflow refused), and answers `captures`/`capturesRefused` on
both the normal and the stale branch. Scenario loaded on demand
(`Game.where(id:).pick(:scenario_data)`) only when there is something to record or a legacy global.
`scenario` (bootstrap) ships `filtered['captures'] = captures_for_client` AND mirrors it into
`savedGlobalVariables.se_captures` so the CURRENT client's reader (core/game.js) still fills the
capture log until 6a-client ships. prepare_bootstrap_state! migrates the legacy global + backfills
heard shares under the existing lock.

### Backward compatibility held (invariants)
- Current client: a capture made in play syncs the whole se_captures global; the server intercepts
  and records it; on reload the bootstrap mirror + GET /capture_secrets (main's authored path)
  reproduce the capture log and Len's PIN. Proven at route level in captures_sync_test
  (old-tab interception, reload mirror, stale, Len's PIN served only after the beat, store_controller
  note shipped whole, old-save migration).
- No widening of the trust model: the client names the target+kind and chooses between the
  candidate values the scenario allows; every stored field comes from the scenario. An undeclared
  target is refused where before any sync could write the global. One narrowing worth noting: a
  phish credential now needs a scenario with a link kit naming the page (the honest route); two
  synthetic capture_proofs_test scenarios that lacked a kit were given one.

### Tests run (affected files, no lock)
- `capture_proofs_test capture_secret_test lab_physical_pentest_secrets_test
  capture_payload_secret_test capture_payload_secret_routes_test capture_secret_endpoint_test`
  -> 89 runs, 1375 assertions, 0 failures (the six named must-stay-green tests).
- `capture_record_test` -> 13 runs, 45 assertions, 0 failures (new).
- `captures_sync_test` -> 8 runs, 28 assertions, 0 failures (new).
- `npc_workaround_h_test` -> 34, `reload_persistence_test npc_frustration_test
  access_leak_scanner_test carry_over_test` -> 177, `access_model_no_password_test
  network_no_exposure_test network_shares_test access_model_withholding_test` -> 95 (with the one
  adapted leak assertion). All 0 failures.
- validator: lab_physical_pentest --no-graph has 0 new ❌; the length check fires on a synthetic
  over-long note/host; `validator-capture-log.test.mjs` passes.

### Live browser proof: NOT run this session (budget)
The HTTP/route proof is in captures_sync_test (CapturesSyncLabTest): against the real
lab_physical_pentest scenario, `PUT /sync_state { captures: [{ targetId: 'len', kind: 'credential' }] }`
writes `seCaptures`, `GET /capture_secrets` returns `4471` only after that call (nothing before),
and `GET /scenario` (reload) re-ships it. The full browser drive of Len's routine on a keyless
server at :3165 (session-start.sh --headless, setFPS(20), fixed steps on; walk Len's routine, click
the ledger shelves; assert seCaptures server-side, GET /capture_secrets gated, reload keeps it) is
the one remaining item for this step. No game ids were created on the dev DB this session.

### Remaining 6a-client spec (exact, for the next session)
Achieves the size win (stops the whole se_captures map riding every sync); needs 6a-server live (it
is). When 6a-client ships, DROP the `savedGlobalVariables.se_captures` mirror from
`GamesController#scenario` (the block added this session) in the same release.
1. New `public/break_escape/js/systems/capture-client.js`, imported statically by main.js and
   installed right after `new StateSync` (main.js:145) via `installCaptureClient(stateSync)`. Only
   static imports: captures.js and global-writer.js.
   - registers the sync part `captures` (state-sync registerPart: build/onAnswer/pendingCount/
     flushKeep); sets `window.submitSECapture` and `window.mirrorSECapture`.
   - `submitCapture(input)` synchronous: makeCaptureEntry; first-wins against the mirror; writes the
     mirror (`writeGlobal('se_captures', next, { openChat:false })`), adds
     `{ targetId, kind, address, host, roleLabel }` to a pending map, calls `stateSync.sync()`.
   - part `build()` returns pending entries; `onAnswer(response)` replaces each answered mirror
     entry with the server's (`response.captures`) and drops it from pending; a `capturesRefused`
     one is dropped from pending and mirror and logged; `pendingCount()` is the pending size;
     `flushKeep(changes)` returns the mailState changes that are sent records to a pending target.
   - `mirrorCapture(entry)` writes the mirror only (the heard login the server recorded itself).
2. `state-sync.js`: add `'se_captures'` to `SERVER_OWNED_GLOBALS` (:68, empty since step 2);
   `buildSharedSections` already skips SERVER_OWNED_GLOBALS; remove the CAPTURE_ENTRY_KEYS /
   guardLandingState capture branch (:46/:47/:102), since the key is never sent.
3. Writers call the window fns (no new static import; harnesses stub them): mail-bridge.js
   `recordCapture` -> `window.submitSECapture`; apply-actions.js `recordSECapture` ->
   `window.submitSECapture` (drop its lazy captures.js import, keep `window.recordSECapture`
   returning the boolean); npc-workarounds.js -> `window.mirrorSECapture`.
4. core/game.js: after the globals merge (:1705-1716), set the `se_captures` mirror from
   `gameScenario.captures` (or `{}`) only when the bootstrap carries `captures` or the scenario
   declares se_captures; drop reliance on `savedGlobalVariables.se_captures`.
5. Then drop the 6a-server bootstrap mirror (GamesController#scenario).
6. JS tests (plan 6.8): new `capture-client.test.mjs`; update `state-sync.test.mjs` (no se_captures
   in a body, none seeded, a registered part makes buildChanges non-null), `add-capture-action`,
   `social-mail-bridge`, `social-captures`, `capture-log`, and the three seed-and-read tests
   (`access-remote-signin`, `social-captures-view`, `social-report-footholds`).
7. Rails route tests `captures_sync_test.rb` already exist; the leak scanner exemption
   (access_leak_scanner.rb:677) still needs moving from `.se_captures` to the `captures` path with
   `access_leak_scanner_test.rb` (plan 6.8) — do with 6a-client or 6b.

## This session (2026-11-12, builder 7: 6a ruling recorded + reader slice)

Did two safe, committed, tested slices of 6a and stopped at the coherence boundary.

- `1eafa0586`: recorded the orchestrator's ruling as the plan amendment above.
- `849a4fa3d`: added `Game#se_captures_record` (returns `player_state['seCaptures']` when it is a
  Hash, else the legacy `globalVariables.se_captures` in place) and pointed main's two serving
  reads at it (`capture_secrets_for_client` game.rb, `account_capture_usernames`
  network_access.rb). Behaviour-preserving: with no `seCaptures` written yet, both always fall to
  the legacy global, i.e. exactly today's reads. Verified green:
  `bin/rails test capture_payload_secret_test capture_payload_secret_routes_test
  capture_secret_endpoint_test lab_physical_pentest_secrets_test capture_proofs_test
  capture_secret_test` -> 89 runs, 1375 assertions, 0 failures.

### Why 6a stopped here (coherence + budget)

The rest of 6a cannot ship as independent safe commits the way steps 1 to 5 did, because the
client flip (stop syncing the `se_captures` global, submit per-capture deltas, read captures from
the bootstrap) and the server recording (intercept the global, `record_capture!` with fields from
the scenario, bootstrap migration + ship `captures` back) must land together: if the client stops
sending the whole global but the server does not record, or the bootstrap stops shipping
`savedGlobalVariables.se_captures` but the client has no `captures` reader, live captures break on
the next reload. That coherent client+server change, with the plan-6.8 route tests and the live
proof, is larger than one session's safe budget. A fresh session should build it as ONE unit.

### Remaining 6a spec (for the next builder), per plan 6.3/6.4 AS AMENDED by the ruling

Scope note: the ruling DROPS plan 6.3's `candidate_secret`, the writer pass in
`capture_secrets_for_client`, the stored `writer` key and `legacySecret`. Serving stays main's
(`authored_capture_secret`/`authored_capture_secrets`, by target id). So the record stores only
`{ targetId, roleLabel, address, kind, host, note, at, proven }` (no `writer`). `se_captures_record`
is in place; `capture_revealable?` is trivially `entry['proven'] == true` under 6a.

Two coherent landings are possible. Recommended split:

- **6a-server (safe without the client change; the current client keeps working as the "old tab").**
  1. `CaptureModel.capture_candidates(data, target_id, kind)` -> `[{fields:{targetId,roleLabel,
     address,kind,host,note}, source:}]`, fields taken from the scenario exactly as the honest
     client writes them, so main's serving still matches: an `add_capture` action / `addCapture`
     mapping's `capture` hash; a `usePayload` overlay (`addCapture.merge(payload)`, payload wins,
     as npc-manager.js:1249 `{ ...config.addCapture }` then overlays usePayload); a phish page
     credential (address = page `capture.address` else target's own `address`, note = page
     `capture.note`, roleLabel = target `role`); a phish `foothold` (host+note from the block,
     roleLabel = target `role`). Also `CaptureModel.client_target_ids`, `share_only_target?`,
     `shared_login_capture(data, npc_id, workaround:)` (compose exactly as npc_frustration.rb
     `shared_login_body` :453-466; two-`share_login` note fix).
     Crucial for serving: `address` MUST equal the account username for an account holder and the
     page `capture.address` for a phished page, because `capture_secrets_for_client` still keys
     `by_address`/`by_username` on `entry['address']` and account_capture_usernames returns it.
  2. In `CaptureProofs` (capture_proofs.rb): `record_capture!(input, scenario:, by:)` (picks a
     candidate by matching the client's address/host/roleLabel, prefers the plain candidate, stores
     fields whole + `at` + `proven:true`; first-wins; refuses `undeclared`/`server_only`/`invalid`;
     `MAX_CAPTURE_NOTE_CHARS=2000`, `MAX_CAPTURE_FIELD_CHARS=200`, `MAX_CAPTURES_PER_SYNC=64`,
     target id <=100 cp). `record_shared_login!`, `record_shared_logins!`,
     `unrecorded_shared_logins?`. `migrate_legacy_captures!(scenario:)`, `legacy_captures?`.
     `captures_for_client(scenario:)` (the bootstrap/answer shape, no `proven`, no secret).
  3. Controller `sync_state`: a new step after `merge_grow_only_sections` (games_controller.rb:802),
     run stale too, that (a) takes `se_captures` out of the incoming globals BEFORE
     `merge_global_variables!` (:1863) and records each entry through `record_capture!`, so the
     CURRENT client's global write is server-owned and never stored; (b) records `params[:captures]`
     the same way (for the future client); (c) answers `captures`/`capturesRefused` when either was
     non-empty, including on the stale branch (:817). Load the scenario on demand only
     (`Game.where(id:@game.id).pick(:scenario_data)`, as biometricSamples does at :1947). Migration
     + `record_shared_logins!` run in `prepare_bootstrap_state!`; `filtered['captures'] =
     captures_for_client` in `scenario` (:284 area). `strip_capture_secrets!` still strips authored
     secrets; additionally keep the migrated record mirrored into `savedGlobalVariables.se_captures`
     ONLY until 6a-client ships, so the current client's reader (core/game.js:1716) still fills the
     capture log — OR land 6a-client in the same release and drop the mirror.
  4. Carry-over guard: `Game::SERVER_OWNED_GLOBAL_NAMES = %w[se_captures]`; skip an import of it in
     resolve_imported_globals / apply_imported_globals_to_state (carry_over.rb) with a logged warn;
     validator error. No scenario has one today.
  5. npc_frustration.rb: where a heard `share_login` marks the login shared (:202-209), also call
     `record_shared_login!` with the heard workaround.
  6. m1: authored capture-string limits in the validator (`scripts/validate_capture_log.rb`) +
     `test/js/validator-capture-log.test.mjs`.
- **6a-client (achieves the size win; needs 6a-server live).** New
  `public/break_escape/js/systems/capture-client.js` (installCaptureClient(stateSync):
  registerPart('captures'), window.submitSECapture/mirrorSECapture, pending map, onAnswer replaces
  the mirror, flushKeep keeps a pending phish's sent mail). main.js imports it statically and calls
  it right after `new StateSync` (main.js:145). state-sync.js: add 'se_captures' to
  `SERVER_OWNED_GLOBALS` (:68), drop the CAPTURE_ENTRY_KEYS/guardLandingState capture branch.
  mail-bridge.js `recordCapture`, apply-actions.js `recordSECapture`, npc-workarounds.js now call
  window.submitSECapture/mirrorSECapture (no new static import; harnesses stub the window fn).
  core/game.js: set the `se_captures` mirror from `gameScenario.captures` after the globals merge
  (:1705-1716). Drop the bootstrap `savedGlobalVariables.se_captures` mirror from 6a-server step 3.
  JS tests per plan 6.8 (`capture-client.test.mjs`, updated add-capture/mail-bridge/social-captures/
  capture-log tests).
- **Tests**: plan 6.8 route tests (`captures_sync_test.rb`), and the named main capture tests must
  stay green throughout (they do today via the legacy fallback in `se_captures_record`; once the
  bootstrap migrates, update the seeds that set `globalVariables.se_captures` to set `seCaptures`
  or rely on the migration, per plan 6.8). Leak scanner exemption moves to the `captures` path.
- **6b / 7 / 8**: unchanged from the plan (6b adds parts 2/3 reveal gating via
  `capture_evidence_holds?`/`stampable_captures?` on top of main's path; 7 is the size tests + live
  proof A-F vs the base worktree on :3002+; 8 removes transition code one release later).

### Live proof (ruling point 3): NOT run this session
Len's shoulder-surf beat could only be proven in part against current code (main's path already
serves the PIN on the earned route), and the ruling's key "se_captures no longer rides PUT
/sync_state" check needs 6a-client live, so the live proof is left for the session that lands 6a.

## This session (2026-11-12, builder 6: merge, step 5, 6a assessment)

Did the required merge, step 5 (R3), and stopped at the 6a boundary on a cheat-critical finding.

- Merged `main` (batch 9, 33c003230) into `build/sync-deltas` (`git merge main`, merge commit
  `f03396201`). No manual conflict resolution was needed (clean auto-merge of game.rb,
  network_access.rb, network-links.js and their tests). Reran the four capture tests the brief
  named: `capture_payload_secret_test`, `capture_payload_secret_routes_test`,
  `capture_secret_endpoint_test`, `lab_physical_pentest_secrets_test` -> 55 runs, 1198 assertions,
  0 failures.
- Step 5 (R3), commit `cb269170c`: `capture-log-model.js` gains `SEEN_PREFIX`; `readSeen` now
  returns the union of the legacy whole-list (read only) and every `__capture_log_seen:<key>`
  global whose value is `true`. `capture-log-minigame.js` writes one key per newly seen row
  (`writeGlobal(SEEN_PREFIX + k, true, { openChat: false })`) instead of rewriting the whole list.
  `test/js/capture-log.test.mjs`: the two existing seen-write tests moved to the per-row shape, plus
  a `readSeen` merge unit case and an old-save-list-only case (plan 7.5). 18 tests pass. Only
  `capture-log-minigame.js` imports the model, and no other code reads `SEEN_GLOBAL`, so no harness
  copy list changed.

### 6a (R2) is blocked on a merge conflict of design, not of text

Main's batch-9 `usePayload-secret` fix (commits `91849ba67`, merge `a5dd28d6e`) already added, in
`app/models/break_escape/game.rb`, a parallel secret-serving path that overlaps plan 6.3's proposed
R2 writer pass and `candidate_secret`:

- `authored_capture_secret(entry)`, `authored_capture_secrets`, `build_authored_capture_secrets`,
  `usepayload_captures`, `hard_access_capture_value?`, and `CaptureModel.hard_access_values`
  (lib/break_escape/capture_model.rb). `capture_secrets_for_client` (game.rb:1250) now serves a
  writer/`usePayload` secret by **target id** against the **authored `scenario_data`**, after the
  page pass and the account pass, with: the account-holder guard (skip an owner that holds an
  account, and skip an address that is an account username), AND a hard-access-value guard the
  plan's `candidate_secret` does not have (a secret equal to any password/PIN lock code, Wi-Fi PSK,
  RFID/biometric `requires` or flag is never served on the capture record alone).

Plan 6.3 (written against base 6a834437c) instead proposes a server-owned `seCaptures` record, a
writer pass keyed on the stored `writer` **path**, and a `candidate_secret` with only the
account-holder/payload-owner guard (no hard-access guard). The merge note itself says "Your step 6a
captures fix must build on it." Applying plan 6.3 mechanically would (a) duplicate the secret-serving
logic main just added, (b) drop main's hard-access-value withholding, and (c) key secrets by a
different path than main. Because this path serves passwords and PINs, getting the reconciliation
wrong is a cheat-policy regression, and it cannot be live-proven within one session (step 7 live
cases run after step 6).

This is an orchestrator/user decision, not a mechanical build. Recommended before 6a resumes:
decide whether 6a's server-owned record replaces or wraps main's `authored_capture_secret` path, and
whether the writer pass should stay keyed by target id (main's shape, simpler, already tested) or by
the stored `writer` path (plan 6.3). Whatever is chosen, the hard-access-value guard main added must
be preserved. Steps 6b/7/8 all sit behind 6a and are untouched.

## Commits (newest first)

- `cb269170c` Step 5 (R3): capture-log seen rows as one key each (see this session, above).
- `f03396201` Merge `main` (batch 9) into `build/sync-deltas`; capture tests reran green.
- Step 4 (P1): cloner saved cards as one-card deltas. Server: `add_saved_card!` (identity and
  name from the scenario definition, rfid_data from the client picked to `SAVED_CARD_DATA_KEYS`,
  per-card 4 KB and list 64 KB/50 caps, replace-in-place), `remove_saved_card!` (listed:false mark),
  `repair_saved_cards!`/`cards_need_repair?`/`saved_card_ids_to_repair` wired into
  `bootstrap_state_needs_write?`/`run_bootstrap_writers!`, `real_cloner`, `npc_card_definition_for`;
  `record_card_clone!` gains `card:` and answers `saved`/`reason`; `update_cloner_saved_cards!` is a
  filtered merge (kept for one release). Controller: `clone_card` passes `card`; `/inventory`
  `remove_saved_card`. Client: `savedCardForServer`, `removeSavedCard`, `SAVED_CARD_KEYS`/
  `SAVED_CARD_DATA_KEYS` in rfid-data.js; `persistSavedCards` deleted and saveCardToCloner no longer
  calls the server; recordCloneOnServer builds the source from `cloneFrom`/the card id, sends the
  card and `stateSync.track()`s the request; interactions.js and action-menu.js pass `cloneFrom`;
  api-client `cloneCard(source, cardId, card)`. Tests: clone_card_saved_cards_test (10, incl. the
  8 KB cap 413 and the repair), reload_persistence update_saved_cards tests rewritten to the merge,
  rfid-clone-card.test (card body, track, world/no-id warn, cross-side key-set).
- Step 3 (P2): inventory and network answers carry deltas. `/inventory` add/remove answer
  `{ success: true }` (already-held: `{ success: true, already: true }`), no inventory echo.
  Each `/network/*` route answers `added`/`removed` (through `item_for_answer`, so no saved_cards
  rides an echo) only to a request that opts in with `delta: true` (`inventory_delta_opt_in?`);
  an old tab that omits it still gets the whole-inventory echo for one release (4.4).
  `NetworkAccess#network_inventory_delta`/`inventory_answer_fields`; `delta:` kwarg on
  plant/unplug/join/implant. Client: `applyInventoryDelta` in inventory.js (window-exported);
  the four network-links.js call sites apply it; api-client sends `delta: true`; the unplug tray
  scan is gone. Tests: item_for_answer_test (model), network_inventory_delta_test (integration),
  inventory-tray applyInventoryDelta cases, network-links.test mocks moved to the delta shape, the
  games_controller add-answer test updated. `syncInventoryFromServer` and
  `inventory-server-items.test.mjs` kept for the one-release transition (removed in step 8).
- `a57264de3` Step 1 item 8 + item 9: `tools/playtest/sync-delta-proof.mjs` (live-proof
  recorder, pure parts unit-tested in `test/js/sync-delta-proof.test.mjs`), `new-game.rb
  --seed-full-cloner`, and the base-commit baseline numbers in this log.
- `853b69a59` savedCurrentRoom controller test (task 3): present for a string saved
  room, absent when the save holds no string currentRoom (strips it via update_column
  past the create callback that seeds it from startRoom).
- `0136faad5` Step 1 item 6 groundwork: state-sync `registerPart`/`track`/`_partBodies`/
  `_flushKeep`/`_partsPending` (a part rides the sync body; `syncConfirmed` awaits tracked
  clones and stays false while a part has pending entries; parts also feed the pagehide
  fallback lists). `Game#item_for_answer` (deep copy minus `saved_cards`). `prepare_bootstrap_state!`
  locked shell with `bootstrap_state_needs_write?`/`run_bootstrap_writers!` both returning
  false for now, wired into `GamesController#scenario` right after `authorize`.
  `refuse_oversized_npc_frustration` -> `refuse_oversized_body` with `OVERSIZED_BODY_LIMITS`
  (npc_frustration keeps 64 KB, clone_card gets 8 KB); `prepend_before_action` lists both.
  3 new part/track cases in social-state-sync-confirmed.
- `efe00765a` Step 1 item 5 (rest): shared sanitiser fixture
  `test/fixtures/files/sync_bodies/sanitiser_cases.json` (inputs tripping every mail/thread/
  draft/phone/ink rule + the server-stored output), with a Rails unit test
  (`sanitiser_cases_test.rb`, uses `Game.new`, no DB) and a node test
  (`sanitiser-cases.test.mjs`) asserting the client clips match by `stableJson`. Generated once
  by `scratchpad/gen_sanitiser_fixture.rb` from the real server methods; neither test writes it.
- `c12d9d1e7` Step 2 (R1): seed `confirmed` from the bootstrap (seedFromSaved/seedFromBootstrap,
  flattenSavedMailState, pickNote/pickSample, per-section `_held` null-delete gate, game.js wiring,
  server `savedCurrentRoom`). 9 R1 tests + flatten-parity test.
- `3c7d13c96` Step 1 item 5 (part): cross-side constants test + inline-literal scan in
  social-mail-state-export. (Shared-fixture behaviour test still open.)
- `9f85871c6` Step 1 item 4: client export clips mirroring the server (clipMailMessage/Thread/
  Drafts/Json, code-point phone-entry export, ink name limit), mail limit constants under the
  server's names; two existing round-trip tests moved to server-kept fields.
- `06815b055` Step 1 item 2: compare `buildChanges`/`mailJobsChangeKey` strings by `stableJson`;
  drop the now-unused `json` helper.
- `6c3a2e918` Groundwork: remove the unused `ApiClient.syncState` and `ApiClient.updateInventory`
- `3cec62ff4` Groundwork: phone `keyOf` option on `exportPhoneState`/`markPhoneStateSynced`/
  `restorePhoneState`, wired to `stableJson` at the sync call sites
- `2be60f549` Groundwork: fix `phone-player-lines` source assertion for `MAX_PHONE_TYPE_CHARS`
  (a regression the constants refactor `91da28d22` left behind)
- `b8370b88d` Groundwork: `cpWithin`/`cpSlice` code-point helpers in three module-local copies,
  with one shared node test
- `3da4b3480` Groundwork: `stableJson` for order-independent state comparison, with tests
- `91da28d22` Groundwork: name the mail/phone/ink sanitiser limits as constants in game.rb (no
  behaviour change)
- `a7294aece` Bring in the final plan, the state sync audit and plan reviews R1 to R5

## Tests run (this session)

- `bin/rails test test/models/break_escape/mail_state_test.rb
  test/controllers/break_escape/mail_state_sync_test.rb
  test/models/break_escape/phone_message_game_time_test.rb` -> 40 runs, 145 assertions, 0 failures.
  Proves the constants refactor preserves the mail and phone sanitiser behaviour.
- `bin/rails test test/controllers/break_escape/reload_persistence_test.rb` -> 69 runs, 254
  assertions, 0 failures. Covers `merge_npc_ink_variables!` (the ink constant change) and the wider
  reload path.
- `node --test test/js/state-sync.test.mjs` -> 13 pass (includes the new stableJson case).
- Every other `test/js/*` harness that imports `state-sync.js` (13 files: consumables,
  player-health-persistence, engine-fixes-round4, social-mail-scheduler, npc-hostility-persistence,
  social-landing-page-state, social-triage-starter, social-mail-state-export,
  person-chat-pending-reply, social-state-sync-confirmed, social-mail-trim, social-captures,
  npc-ko-drop-retry) -> all pass. Adding an export and a static property does not affect them.

This session (newest work):
- `node --test test/js/cp-helpers.test.mjs` -> 3 pass (the three `cpWithin`/`cpSlice` copies agree
  over ASCII, an emoji at the cut, and emoji-only strings; the cut never splits a surrogate pair).
- `node --test test/js/phone-reopen-and-persistence.test.mjs` -> 26 pass (3 new `keyOf` cases: a
  jsonb-reordered saved entry is unchanged under `stableJson`; the default `JSON.stringify` resends
  it; `restorePhoneState` seeded with `keyOf` is not resent after the NPC registers).
- `node --test test/js/phone-player-lines.test.mjs` -> 22 pass (the `MAX_PHONE_TYPE_CHARS` assertion
  fix; this test was failing on the branch before this session, from the constants refactor).
- Every `test/js/*` harness that copies `state-sync.js` (9 files) -> 104 pass; every harness that
  copies `api-client.js` (10 files) -> 114 pass; `social-mail-trim`, other phone harnesses -> pass.
  Confirms the phone `keyOf` call-site changes and the `ApiClient` deletions break nothing.

No live browser proof yet: the live cases A to F (plan 10.3) run after step 6.

## Live-proof tools and baseline (step 1 items 8 and 9, builder: proof tools)

### The tools (item 8)

`tools/playtest/sync-delta-proof.mjs` (Playwright, headless, ESM). It drives only the
page through `window.__test` and records every request to `/break_escape/games/:id/*`:
method, route (the path after the game id), request body bytes from
`request.postDataBuffer()`, response body bytes from `response.body()` where the page can
still read them (a keepalive pagehide flush is usually unreadable after the navigation,
so its field is left null and read from `player_state`/the server log instead), and
whether a `saved_cards` list rides either body. It writes a JSON record and prints a
Markdown summary table (one row per phase, method and route, with totals and maxima).
Because it only drives the page, it runs unchanged against the base server and the branch
server, which is what the before/after needs. It sets `setFPS(20)` with fixed steps ON
(never `fixedStep=false`) after the bridge is ready.

Cases: `bootstrap` (open, record `GET /scenario` only), `A` (first sync after load: play,
reload, force a sync, record each first `PUT /sync_state`), `B` (seed a full cloner, record
the bootstrap and network answers). The pure parts (`routeLabel`, `gameIdOf`, `summarise`,
`renderTable`, `hasSavedCards`, `parseArgs`) are exported and unit-tested in
`test/js/sync-delta-proof.test.mjs` (8 cases, all pass with plain `node --test`). The full
plant/unplug/join/implant drive (case B) and cases C to F (cloner, captures, Len's PIN,
old save, old tab) run with the rest of the live proof after step 6 (plan s9 item 7); the
tool's recorder and the baseline anchors below are what step 1 needs.

`tools/playtest/new-game.rb --seed-full-cloner` (no value): for test_access_networks only,
in development or test, with no cloner already held, it writes an `rfid_cloner` inventory
item carrying 50 made-up EM4100 cards (12,903 bytes, under the 64 KB cap; the plan's "about
9.5 KB" estimate omits the per-card `rfid_data`, which real cards carry) in the top-level
`saved_cards` shape an old save written by `update_saved_cards` has. The write runs inside
`g.with_lock` (reloads the row, rechecks the inventory, appends, saves once) and acts only
on the game this run created. It prints `SEEDED_FULL_CLONER=...`. Proven live: the happy
path seeded game 1777; `--seed-full-cloner` on test-rfid aborts with "only
test_access_networks".

### Baseline (item 9, base commit 6a834437c, keyless server on :3112 from the p-sync-base worktree)

Games created with this branch's `new-game.rb` against the shared dev database (step 1
changes nothing about game creation), served by the base-commit server. Game ids: 1773
test_access_networks, 1774 test-rfid, 1775 lab_social_engineering, 1776 lab_physical_pentest,
1777 test_access_networks + `--seed-full-cloner`.

**`GET /scenario` bootstrap response bytes (base commit).** This is the anchor for plan
10.2's "no larger than the base commit's measure plus 1 KB"; step 7 writes the relevant
figure into `test/integration/sync_payload_size_test.rb` as a constant (not created here;
that test is step 7, owned by another builder).

| Scenario | `GET /scenario` resp bytes | `POST /inventory` boot echo bytes |
|---|---:|---:|
| test_access_networks | 5,833 | 250 |
| test-rfid | 1,103 | 400 |
| lab_social_engineering | 69,125 | 442 |
| lab_physical_pentest | 23,762 | 1,088 |
| test_access_networks + full cloner | 18,906 | 13,303 |

The full-cloner row is the P1/P2 "before": the 12,903-byte `saved_cards` list rides both
`GET /scenario`'s `playerInventory` (18,906 vs 5,833, +13,073) and every `POST /inventory`
echo (13,303 vs 250). The tool's `saved_cards` detector flags it on `GET /scenario` and
`POST /inventory` for game 1777, and flags the empty `saved_cards: []` on test-rfid's and
lab_physical_pentest's starting cloners (present-but-empty is still the key the delta work
removes from echoes).

**Case A, first `PUT /sync_state` after load (lab_social_engineering, game 1775, base
commit).** Every first sync after a load carried the whole client state at a near-constant
size regardless of what changed: 5,438 bytes (first load), 5,470 bytes (after reload 1),
5,470 bytes (after reload 2). Answer 16 bytes each. This is R1's "before": after R1 the
first sync should send nothing, or only `currentRoom` with its riders (a few hundred bytes).

Case B's per-network-action answer sizes (each `POST /network/*` echoing the ~13 KB list)
and cases C to F are left for the post-step-6 live proof (plan s9 item 7), run against a
base-commit server the same way. The baseline recorder and the anchors above are in place
for that comparison. JSON records are in the session scratchpad (not committed): the
committed evidence is these numbers and the tool.

## What was built, in detail

### Named sanitiser constants (commit 91da28d22)

`app/models/break_escape/game.rb`. Plan 2.1 asks that every inline numeric limit in the nine
sanitiser methods that the client mirrors becomes a named constant, so the client mirror and the
constants/literal-scan test (plan 3.7) read the same values, with no change of value or behaviour.

New constants added:
- `MAX_NPC_INK_NAME_CHARS = 100` (near `MAX_NPC_INK_VARIABLES_BYTES`).
- Phone (near `PHONE_MESSAGE_KEYS`): `MAX_PHONE_TYPE_CHARS = 20`, `MAX_PHONE_STORY_PATH_CHARS = 300`,
  `MAX_PHONE_KNOT_CHARS = 200`, `MAX_PHONE_DEFERRED_TAG_CHARS = 300`, `MAX_PHONE_DEFERRED_TAGS = 100`,
  `MAX_PHONE_SCALAR_KEY_CHARS = 100`.
- Mail (near `MAIL_METRIC_COUNTS`): `MAIL_BODY_KEYS`, `MAIL_FOLDERS`, `MAX_MAIL_TELL_CHARS = 100`,
  `MAX_MAIL_TELLS = 50`, `MAX_MAIL_JSON_KEY_CHARS = 100`, `MAX_MAIL_BOX_ID_CHARS = 100`,
  `MAX_MAIL_THREAD_KEY_CHARS = 200`, `MAX_MAIL_THREAD_CHOICES = 20`, `MAIL_EXPECT_MODES`,
  `MAX_MAIL_EXPECT_TARGET_CHARS = 100`, `MAX_MAIL_EXPECT_OPTIONS = 10`,
  `MAX_MAIL_DRAFT_ACCOUNT_CHARS = 100`.

The literals were replaced in `merge_npc_ink_variables!`, `sanitize_phone_state_entry`,
`mail_state_updates`, `sanitize_mail_message`, `sanitize_mail_threads`, `sanitize_mail_drafts`,
`mail_box_id?` and `sanitize_mail_json`. After the change, those nine methods hold no bare numeric
literal other than `0`, `1`, and the `2` in `split('.', 2)` (which plan 3.7 allows by name), so the
literal-scan test will pass once it is written. `%w[jobs drafts metrics]` (a string list in
`mail_state_updates`) and `%w[currentKnot lastEnteredKnot preloadedKnot]` (in
`sanitize_phone_state_entry`) are string arrays, not numbers, so they are left as literals; the plan
names no constant for them. `sanitize_mail_metrics` and `sanitize_mail_jobs` are deliberately NOT in
the scan list (plan 3.7 names the metrics clamp `100_000` as outside the scan), so their inline
numbers were left alone.

Names match plan 2.1 exactly so the constants test in plan 3.7 can read them by the server's name.
The five existing client names that keep their own spelling (`MAIL_MESSAGE_FIELDS`,
`NPCManager.PHONE_MESSAGE_FIELDS`, `PHONE_HISTORY_MAX_MESSAGES`, `PHONE_MESSAGE_MAX_CHARS`,
`PHONE_STORY_STATE_MAX_CHARS` -> to be renamed `PHONE_STORY_STATE_MAX_BYTES`) are not touched here;
they are handled client-side when the clips and the constants test are built.

### `stableJson` (commit 3da4b3480)

`public/break_escape/js/state-sync.js`: new `export function stableJson(value)` near the `json`
helper, plus `StateSync.stableJson = stableJson;` after the class so a caller holding
`window.stateSync` reaches it as `window.stateSync.constructor.stableJson` with no import (plan 2.1
and 3.2 call sites). It is `JSON.stringify` with a replacer that returns a key-sorted copy of every
plain object (arrays kept in order, undefined dropped as `JSON.stringify` already does). It is not
yet used anywhere: wiring it into `buildChanges()` and the phone `keyOf` is still open (below).
`test/js/state-sync.test.mjs` gains one case (depth sorting, array order significant, undefined
handling, the static).

### `cpWithin` / `cpSlice` (commit b8370b88d) and the deferred-decision call

Plan 2.1 wants the two code-point helpers as module-local copies in mail-scheduler.js and
npc-conversation-state.js and as static methods on `NPCManager`, "not a shared module, so no harness
copy list changes", and then "one node test runs every copy over the same astral strings". The prior
builder flagged these two sentences as in tension and deferred them.

**Decision (this session): export the two module-local copies as named exports and test all three
directly.** The harness copy-list rule is about a module's *static imports* (if module A imports from
module B, every harness copying A must also copy B). Adding a named *export* to a module creates no
import, so it changes no copy list. The helpers therefore stay as three independent copies (satisfying
"no shared module"), and `test/js/cp-helpers.test.mjs` imports all three (the two named exports plus
`NPCManager.cpWithin`/`cpSlice`) and runs each over the same strings. This honours both sentences: no
import is added anywhere, and one test exercises every copy, so a drift in any copy fails it. The
clips in step-1 item 4 call their own module's copy, so they pick up the server's code-point cut.

The helpers: `cpWithin(s, n)` returns `s.length <= n || Array.from(s).length <= n` (the UTF-16 fast
path never undercounts code points, so it is exact); `cpSlice(s, n)` returns `s` when
`s.length <= n`, else `Array.from(s).slice(0, n).join('')`. Identical text in all three copies.

### Phone `keyOf` (commit 3cec62ff4)

`exportPhoneState`, `markPhoneStateSynced` and `restorePhoneState` take `keyOf` (default
`JSON.stringify`), used for every string they store or compare in `_phoneStateSent`.
`StateSync.buildPayload` passes `keyOf: stableJson` to `exportPhoneState`, `StateSync.confirm` to
`markPhoneStateSynced`, and `core/game.js:1800` passes
`{ keyOf: window.stateSync?.constructor?.stableJson }` to `restorePhoneState`. `window.stateSync`
exists before game restore runs (created in main.js:145), so that expression resolves. Default kept so
any caller that passes nothing falls back to today's behaviour. No import added to npc-manager.js, so
no harness copy list changes. This is the phone half of R1: a jsonb-reordered saved thread now matches
its seed and is not resent on the first sync after a load.

### Regression fix (commit 2be60f549)

`phone-player-lines.test.mjs` asserted the literal `value.length <= 20` in game.rb; the constants
refactor (`91da28d22`) changed it to `MAX_PHONE_TYPE_CHARS`, so the test was already failing on the
branch. The assertion now matches the constant and also pins `MAX_PHONE_TYPE_CHARS = 20`. Only two JS
tests read game.rb source (this one and `social-mail-state-export`); the other has no literal-limit
assertion, so no further source-assertion regressions remain from the refactor.

### Removed `ApiClient.syncState` / `updateInventory` (commit 6c3a2e918)

Both had no callers in public JS or tests (plan 9 tidy-ups). `syncState` would have sent all globals
with no `clientTs`.

## This session (2026-11-12, builder 4)

Finished the rest of step 1 except the live-proof tools, and added the savedCurrentRoom test.
Commits `efe00765a`, `0136faad5`, `853b69a59`. Tests, affected files only, no lock:
- Item 5 rest: `node --test test/js/sanitiser-cases.test.mjs` -> 5 pass (client clips match the
  fixture's server-stored outputs). `bin/rails test test/models/break_escape/sanitiser_cases_test.rb`
  -> 5 runs, 21 assertions, 0 failures (server sanitisers match the same outputs). Fixture generated
  once by `scratchpad/gen_sanitiser_fixture.rb` running the real server methods.
- Item 6: `node --test` over the 4 state-sync suites (state-sync, social-state-sync-confirmed,
  social-mail-state-export, sanitiser-cases) -> 51 pass, then over all 22 state-sync/api-client
  importers -> 231 pass (groundwork is inert with no parts registered; the 3 new part/track cases
  pass). `bin/rails test npc_frustration_test.rb reload_persistence_test.rb` -> 107 runs, 490
  assertions, 0 failures (oversized refusal still fires under the renamed filter; GET /scenario
  bootstrap unaffected by the prepare_bootstrap_state! no-op call).
- savedCurrentRoom: `bin/rails test saved_current_room_test.rb` -> 2 runs, 5 assertions, 0 failures.
- `ruby -c` on game.rb and games_controller.rb and `node --check` on state-sync.js -> OK.

No live browser proof yet (items 8, 9 open; live cases A-F run after step 6). No full suites (shared
test lock congestion rule); the orchestrator runs them per merge batch.

## This session (2026-11-12, builder 3)

Built step 1 items 2, 4, 5 (part), and all of step 2 (R1). Tests, affected files only, no lock:
- Item 2: `node --test` over the 14 state-sync importers -> 161 pass.
- Item 4: `node --test` over every mail-scheduler/npc-manager/npc-conversation-state importer
  (50 files, run individually) -> all pass except `event-mapping-unlock-door.test.mjs`, which fails
  with a node test-runner IPC error ("Unable to deserialize cloned data"); confirmed PRE-EXISTING by
  stashing all three source changes and re-running (still fails), so it is not a regression of this
  work. Two existing round-trip tests used draft/thread fields the server also drops (draft `body`,
  thread `pos`) and one oversized body; moved to server-kept fields and many clipped messages.
- Item 5 (part): `node --test test/js/social-mail-state-export.test.mjs` -> 18 pass (new constants
  test + literal scan; later +1 flatten-parity test).
- Step 2: `node --test test/js/state-sync.test.mjs` -> 20 pass (9 new R1 cases). Re-ran every
  state-sync/mail/npc importer individually -> all green except the same pre-existing event-mapping
  flake. `ruby -c` the controller and `node --check` all five changed JS files -> OK.

No Rails tests run this session (the only Ruby change is one extra read-only bootstrap field,
`savedCurrentRoom`; a controller/reload test for it is worth adding in the merge batch). No live
browser proof yet (cases A to F run after step 6).

## This session (2026-11-12, builder 5: steps 3 and 4)

Built P2 (step 3, commit `7c7b55c83`) and P1 (step 4, this commit), merged
`build/sync-proof-tools` in (merge `9263c1fdf`, both build-log sections kept, sync-delta-proof
test rerun green). Tests run (affected files only, no lock):
- P2: `item_for_answer_test` (4), `network_inventory_delta_test` (5), `network_footholds_test` +
  `network_implants_test` + `network_wifi_test` (60), `games_controller_test` + `declared_grants_test`
  (79), `inventory-tray.test.mjs` (16), `network-links.test.mjs` (65), `inventory-server-items` +
  `network-links-routing` + `network-view` (35) -> all pass.
- P1: `clone_card_saved_cards_test` (10, incl. 8 KB cap 413 + repair), `reload_persistence_test`
  (69), `access_model_rfid_test` (30), `rfid-clone-card.test.mjs` (12), and the clone-entry /
  denial / revocation / test-bridge-access / keycard-guard JS set (53) -> all pass.
- `ruby -c` game.rb + games_controller.rb, `node --check` on all five changed JS files -> OK.

### Open / outstanding for P1 (SYNC_DELTAS_PLAN 5.3, 5.4 verification; NOT yet done)
- The cloner-card census: count cloneable keycard/NPC-card definitions in test-rfid and each mission
  with a cloner, and confirm each is within the 50/64 KB bound; record the counts here.
- The `#clone_keycard` ink-tag check (m03-m10, lab_physical_pentest): confirm each tag names its own
  NPC's `rfidCard.card_id`, and rerun the keycard walk (which keycards have no `card_id`/`id`). The
  plan's walk said only m01/m02/m04/m05/m07/m08 have id-less keycards, all in itemsHeld/contents
  (taken and held, not copied in place), so the behaviour change in 5.4 is safe; re-verify before merge.
- The request-size node test (plan 5.6 / 10.1) for `savedCardForServer` of an EM4100 and a fully
  cracked MIFARE Classic card (bytes under 600 / 1 500) is not written yet; it belongs with step 7.

### Remaining steps (not started this session): 5 (R3), 6a/6b (R2), 7 (size + live proof A-F), 8.

## Handover

### Done
- Plan, audit and five reviews imported and committed (`a7294aece`).
- Groundwork constants in game.rb (`91da28d22`), behaviour preserved, mail/phone/reload tests green.
- Groundwork `stableJson` in state-sync.js with a test (`3da4b3480`), all state-sync importers green.
- `cpWithin`/`cpSlice` in three copies with a shared test (`b8370b88d`); the deferred test-access
  decision is made and recorded above.
- Phone `keyOf` option wired to `stableJson` at the three sync call sites (`3cec62ff4`), with three
  new phone-reopen cases.
- `phone-player-lines` constants-refactor regression fixed (`2be60f549`).
- Removed the unused `ApiClient.syncState`/`updateInventory` (`6c3a2e918`).

- Item 2 (`06815b055`): `buildChanges`/`mailJobsChangeKey` compare by `stableJson`; `json` helper
  removed (no remaining callers).
- Item 4 (`9f85871c6`): the mail/phone/ink export clips, exact server mirrors; mail limit constants
  under the server's names; `PHONE_STORY_STATE_MAX_CHARS` renamed `PHONE_STORY_STATE_MAX_BYTES`
  (61440, a byte limit); R5 n6 handled (clip never emits null, no-dot key not exported).
- Item 5 part (`3c7d13c96`): the constants test and the literal scan.
- Step 2 / R1 (`c12d9d1e7`): seed `confirmed` from the bootstrap; see "Step 2 (R1)" below.
- Item 5 rest (`efe00765a`): shared sanitiser fixture + paired Rails/node behaviour tests.
- Item 6 (`0136faad5`): registerPart/track/_partBodies/_flushKeep/_partsPending, item_for_answer,
  prepare_bootstrap_state! locked shell + scenario wiring, refuse_oversized_body cap table. Inert
  until steps 3/4/6a register a part or a bootstrap predicate.
- savedCurrentRoom controller test (`853b69a59`, task 3).
- Merge of main batch 9 (`f03396201`); step 5 / R3 (`cb269170c`). See the top session section.

### In progress
- None. Each commit is a clean, self-contained, tested boundary. 6a (R2) is deliberately NOT
  started: it is blocked on reconciling plan 6.3 with main's merged usePayload-secret fix (top
  session section). Steps 6b, 7 and 8 all sit behind 6a.

### Open (rest of step 1, then steps 3 to 8)

1. DONE (`3cec62ff4`). Phone `keyOf`.
2. DONE (`06815b055`). `stableJson` in `buildChanges`/`mailJobsChangeKey`.
3. DONE (`b8370b88d`). `cpWithin`/`cpSlice` three copies + shared test.
4. DONE (`9f85871c6`). The export clips.
5. DONE (`3c7d13c96` + `efe00765a`): constants test + literal scan, then the shared sanitiser
   behaviour fixture `sync_bodies/sanitiser_cases.json` with the paired Rails + node tests.
6. DONE (`0136faad5`). registerPart/track/_partBodies/_flushKeep/_partsPending (plan 2.2);
   item_for_answer (2.3); prepare_bootstrap_state! locked shell + scenario wiring (2.4);
   refuse_oversized_body with the per-action cap table (2.5). All inert until a part/predicate is
   registered by steps 3, 4 and 6a. NOTE for later steps: item_for_answer and the clone_card 8 KB
   cap have no dedicated test yet (exercised by steps 3/4); add those with P2/P1.
7. DONE (`6c3a2e918`). Deleted unused `ApiClient.syncState` and `ApiClient.updateInventory`.
8. DONE. `tools/playtest/sync-delta-proof.mjs` (recorder + cases bootstrap/A/B, pure parts
   unit-tested) and `tools/playtest/new-game.rb --seed-full-cloner` (no value, --help line, runs
   after the head-start blocks' save!, guarded on test_access_networks + dev/test + no cloner +
   `with_lock`). See "Live-proof tools and baseline" above. REMAINING for step 7: the full
   plant/unplug/join/implant drive in case B and cases C to F are scaffolded/noted but run with the
   post-step-6 live proof.
9. DONE (anchors). Baseline bootstrap sizes and case-A first-sync sizes recorded against base
   6a834437c on :3112 (see Baseline table). For step 7: write the matching `GET /scenario` figure
   into `test/integration/sync_payload_size_test.rb` as a constant from the Baseline table (that test
   file is step 7, another builder's; not created here). Case B per-network-action answers and cases
   C to F run in the post-step-6 proof.

### R5 open items to fold in (brief) -- all land in step 6a (R2), per plan s9 and R5 "Readiness"
- m1: add the authored `targetId` of every writer, every `usePayload.targetId` and every phish
  target id to the capture-log validator as an error over 100 code points, with a case in
  `test/js/validator-capture-log.test.mjs`; name the 100 `MAX_CAPTURE_TARGET_CHARS` in `CaptureModel`
  beside `MAX_CAPTURE_NOTE_CHARS` and `MAX_CAPTURE_FIELD_CHARS`.
- n1: keep both the owner and payload-owner checks in `candidate_secret`, but correct the stated
  reason in plan 6.3/6.7 wording usage, and add ONE unit fixture where the mapping owner has no
  account and the payload owner does, so the payload-owner branch is tested.
- Cheap nits: n2 (`CaptureModel` account-holder test must use `strip.empty?`, not `blank?`, or share
  one method), n3 (seed-full-cloner build details, above), n4 (composed heard-login note under the
  validator, or say so), n5 (validator warning for an `add_capture` secret under an account holder's
  subtree), n6 (clipMailMessage null/no-dot handling, above). Take them where cheap.

### Files touched (across sessions)
- `docs/achitechture/SYNC_DELTAS_PLAN.md`, `PLAYER_STATE_SYNC_AUDIT.md`,
  `SYNC_DELTAS_PLAN_REVIEW_R1..R5.md` (added from build/sync-audit)
- `app/models/break_escape/game.rb` (constants)
- `public/break_escape/js/state-sync.js` (stableJson; phone keyOf; item 2 compares; step 2 seed:
  SERVER_OWNED_GLOBALS, pickNote/pickSample, seedFromSaved, seedFromBootstrap, `_held`/`_seeded`)
- `public/break_escape/js/core/game.js` (restorePhoneState keyOf; step 2 seedFromBootstrap wiring
  + flattenSavedMailState import)
- `public/break_escape/js/systems/npc-manager.js` (cpWithin/cpSlice/utf8ByteLength statics; phone
  keyOf; item 4 `_phoneStateEntry` server mirror + phone constants, PHONE_STORY_STATE_MAX_BYTES)
- `public/break_escape/js/systems/mail-scheduler.js` (cpWithin/cpSlice; item 4 clipMail* + mail
  constants + exportMailState wiring; step 2 flattenSavedMailState)
- `public/break_escape/js/systems/npc-conversation-state.js` (cpWithin/cpSlice; item 4 ink export
  name-limit mirror + MAX_NPC_INK_NAME_CHARS)
- `app/controllers/break_escape/games_controller.rb` (step 2 `savedCurrentRoom` bootstrap field;
  item 6 `prepare_bootstrap_state!` call in `scenario`, `refuse_oversized_body` + `OVERSIZED_BODY_LIMITS`,
  `prepend_before_action` now lists `:clone_card`)
- `app/models/break_escape/game.rb` (item 6 `item_for_answer`, `prepare_bootstrap_state!` shell,
  `bootstrap_state_needs_write?`/`run_bootstrap_writers!` private stubs)
- `public/break_escape/js/state-sync.js` (item 6 `registerPart`/`track`/`_partBodies`/`_flushKeep`/
  `_partsPending`; parts wired into `buildChanges`/`_syncOnce`/`syncConfirmed`/`flush`)
- `test/fixtures/files/sync_bodies/sanitiser_cases.json` (new; item 5 cross-side fixture)
- `test/js/sanitiser-cases.test.mjs` (new; item 5 node behaviour test)
- `test/models/break_escape/sanitiser_cases_test.rb` (new; item 5 Rails behaviour test)
- `test/js/social-state-sync-confirmed.test.mjs` (item 6 part/track cases)
- `test/controllers/break_escape/saved_current_room_test.rb` (new; task 3)
- `scratchpad/gen_sanitiser_fixture.rb` is NOT in the repo (one-off generator in the session scratchpad)
- `test/js/state-sync.test.mjs` (stableJson test; 9 R1 seed cases; seedFromSaved import)
- `test/js/social-mail-state-export.test.mjs` (constants test + literal scan; flatten-parity test;
  pagehide-over-budget test moved to many clipped messages)
- `test/js/social-gap-mail-scheduler.test.mjs` (round-trip test moved to server-kept fields)
- `test/js/cp-helpers.test.mjs` (new; the shared cp-helper test)
- `test/js/phone-reopen-and-persistence.test.mjs` (new keyOf cases)
- `test/js/phone-player-lines.test.mjs` (MAX_PHONE_TYPE_CHARS assertion fix)
- `tools/playtest/sync-delta-proof.mjs` (new; item 8 live-proof recorder)
- `tools/playtest/new-game.rb` (item 8 `--seed-full-cloner` option)
- `test/js/sync-delta-proof.test.mjs` (new; item 8 pure-part tests)
- `docs/achitechture/SYNC_DELTAS_BUILD_LOG.md` (this file)

### Step 2 (R1), in detail
- `seedFromSaved(saved, mailKeys)` builds a `confirmed`-shaped map from the `saved*` blocks, every
  value a `stableJson` string. Mail is flattened by `flattenSavedMailState` (passed in, no import);
  `jobs` compares by `mailJobsChangeKey`. `seedFromBootstrap(scenario, { mailKeys })` runs once
  (`_seeded`), sets each key only where `confirmed` lacks one, and puts every saved global into
  `_held.globalVariables`.
- `_held[section]` (a Set per keyed section) gates the null-delete loop: a confirmed key missing from
  the current state is sent as `null` only when this page held it. All saved globals are held (the
  page applies them via Object.assign), so a deleted global still goes up as null; a server key the
  client never shows this page (an unregistered NPC's ink vars) is left alone. Verified by tests.
- game.js calls `seedFromBootstrap` BEFORE any restore touches the saved objects (some restores keep
  references). Server adds `savedCurrentRoom` so an unchanged room is not resent.
- Residual to watch (plan 2.1): the seed trusts the server-stored mail as already clipped, so
  `flattenSavedMailState` does not re-run the clips; the clips are idempotent on server output, so
  export == seed. If a future server sanitiser change is not mirrored in a clip, the shared fixture
  test (item 5, still open) is what should catch it.

### Gotchas
- Line numbers in the plan were taken against main 6a834437c merged into build/sync-audit; this
  branch is off the same main, so engine line numbers match (verified for the game.rb methods). Each
  reference names the function too; search the name if a line moved.
- Keep `social_feed.rb` and `access_work.rb` edits minimal (C3 replies build is in them).
- Step 6a must stand alone (ship without 6b): commit it separately so it could ship without 6b.
- Commit each step by explicit paths before testing it; check `git diff --cached --stat` first.
- No model names, no em/en dashes, UK English in repo files; no attribution lines in commits.
- `test/js/event-mapping-unlock-door.test.mjs` fails on this machine with a node test-runner IPC
  error ("Unable to deserialize cloned data due to invalid or unsupported version"); its own
  assertions pass (`# pass 1`). Confirmed PRE-EXISTING (fails with all step-1/2 source changes
  stashed), so it is environmental, not a regression. Do not chase it as a build break.
- Step 2 note: `seedFromBootstrap` must be called before the restore block mutates the saved blocks;
  it is wired at the top of game.js's restore, before the globals `Object.assign`. Keep it there.

## This session (2026-11-12, branch review R1 fixes: m1, n1, n2, case F)

Full-branch review R1 copied to `docs/achitechture/SYNC_DELTAS_BRANCH_REVIEW_R1.md` (0 blockers, 0
majors, 1 minor, 2 nits). Server-only Ruby plus docs; no JS changed, so no JS harness copy-list
change and no JS rerun. Each fix has a test that fails without it (confirmed red by reverting the
fix).

### Review R1 fixes

- **m1 (`games_controller.rb#apply_capture_sync_step`): the capture step re-sanitised the whole
  incoming mail on every non-stale sync.** `extra_sent` was computed unconditionally, then discarded
  by the early return on the common no-capture sync; `incoming_sent_messages` re-parses the mail body
  that `merge_mail_state!` already walked. Fix: compute `extra_sent` lazily, only when it can be used
  (`!stale && (incoming.any? || !@phish_fp_before.nil? || @game.legacy_captures?)`), covering every
  path that reaches `stamp_proven_captures!` with real evidence. Test
  `capture_proofs_test "m1: a plain sync does not re-walk the incoming mail a second time"` counts
  `incoming_sent_messages` calls (0 after, 1 before).

- **n1 (`game.rb#remove_saved_card!`): always saved and returned true, even on a no-op.** A tampered
  client could loop `POST /inventory remove_saved_card` with junk ids and force an unconditional
  `player_state` write each time. Fix: track whether the list changed or a `listed` mark was set and
  `save!` / return `true` only then, else return `false` with no write. The one caller ignores the
  return value, so returning `false` is safe. Test
  `clone_card_saved_cards_test "remove_saved_card! on a no-op does not save and returns false"` spies
  on `save!` (0 saves and `false` on a bogus id; 1 save and `true` on a real removal).

- **n2 (`games_controller.rb` sync_state, `capture_proofs.rb`): the pre-merge phish fingerprint
  walked the whole mailbox on every sync while any entry was unproven, including a part-3-only
  unproven entry a sync can never advance.** Fix: an unproven credential records a server-only
  `phishGated` flag at store time (`store_capture_entry`), set when `phish_evidence_page_for` names a
  landing page (part 2 evidence a sync can move); a part-3-only unproven entry carries no flag.
  New cheap predicate `phish_gated_unproven_captures?` gates `@phish_fp_before`, so a part-3-only
  unproven set skips the fingerprint. `phishGated` is never served (`captures_for_client` /
  `client_capture_entry` copy a fixed whitelist). Migrated legacy entries are always stored proven,
  so they never reach the predicate unproven. Serving is unaffected: `GET /capture_secrets` re-checks
  evidence live. Test `capture_proofs_test "n2: a part-3-only unproven entry skips the phish
  fingerprint, a phish-gated one keeps it"` counts `phish_evidence_fingerprint` calls (0 for a
  `captureProof`-gated credential, >= 1 for a landing-page credential).

### Case F investigation and fix (SYNC_DELTAS_BUILD_LOG game 1972)

Builder 12's live case F caveat: a card cloned on pre-branch code (action-menu clone via
`update_saved_cards`, no `serverClones` record) stays listed after a reload onto the branch. The
branch validates access through `held_rfid_cards`, which counts a copy only via `serverClones`, so
such a copy is listed but refused. Confirmed with a Rails test (`access_model_rfid_test`,
`assert_refused door('power_room', ...)` before the bootstrap). Cheat policy q78: access honest play
reached must not be refused, and access honest play could never reach must be refused. A copy the
player genuinely cloned on the old code is access honest play reached, so refusing it after the
deploy is a regression for a game in progress at deploy time.

Decision (safest fix, both directions of q78): on the bootstrap, reconcile each legacy copy (listed,
no `serverClones`) against what the server can still confirm, because an old save's `saved_cards`
was client-trusted and cannot by itself prove an honest clone.

- Where the server can confirm the player could have cloned the card now, a `serverClones` record is
  backfilled (`backfilled: true`) and the copy keeps its access. Confirmation
  (`confirmable_clone_source`): the card's holder NPC is in `encounteredNPCs` and is cloneable, or a
  cloneable keycard object with that id is still within reach (`clone_source_keycard`), while a real
  cloner is held.
- Where the server cannot confirm it (holder never met, no reachable object), the copy is dropped
  from the display list, so the player re-clones it honestly; access honest play could never reach
  stays refused.

New `game.rb` methods `legacy_cloned_cards?` (cheap bootstrap predicate, ORed into
`bootstrap_state_needs_write?`), `backfill_legacy_cloned_cards!` (bootstrap writer, runs before
`repair_saved_cards!`) and `confirmable_clone_source`. Idempotent: a confirmable copy gains a record
and an unconfirmable one is dropped on the first bootstrap, so the predicate is false afterwards.
Tests in `access_model_rfid_test`: `case F: a legacy copy the server can confirm is backfilled and
opens its door after a reload` and `case F: a legacy copy of a card the player never met is dropped
and stays refused` (both confirmed red with the backfill writer disabled).

### Step 4 note (accepted)

Builder 12's observation that an old tab re-sends its whole `se_captures` map for one release
(bounded by the authored capture count, stops after the reload) is recorded as accepted in
`SYNC_DELTAS_PLAN.md` section 6.5 (Old tabs / Compatibility).

### Tests run (affected files, no lock, per the 2026-11-12 test-lock rule)

All green. No JS module changed, so no node test is affected (phishGated is server-only and never
served). Rails:
- `capture_proofs_test`, `clone_card_saved_cards_test` (45 runs, 239 assertions).
- `access_model_rfid_test` (37 runs, 138 assertions).
- `captures_sync_test`, `capture_proofs_test`, `clone_card_saved_cards_test`, `access_model_rfid_test`,
  `capture_record_test`, `games_controller_test` (170 runs, 668 assertions).
- `reload_persistence_test`, `network_inventory_delta_test`, `saved_current_room_test`,
  `inventory_canonical_item_test`, `game_test` (183 runs, 733 assertions).
- `capture_secret_test`, `capture_payload_secret_test` (part of an earlier 44-run green batch).

Each new test was confirmed to fail with its fix reverted, then pass with it restored.
