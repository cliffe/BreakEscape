# Hardening: RFID trust fix, review R3 (confirmation)

Branch `build/hard-rfid`, range `2f5471209..36bd70e9b`. Read-only review; the only write is this
file. Independent confirmation that R2's blocker is closed and nothing new slipped in.

Severity counts: 0 blocker, 0 major, 1 minor (pre-existing, already filed).

## Item 1: R2 blocker closed

- Scenario byte-identical to baseline: `git diff 2f5471209..36bd70e9b -- scenarios/test-rfid-multiprotocol/scenario.json.erb`
  is empty. The revert (d3695f006) restored the exact baseline text; this branch now changes no
  scenario at all.
- Validator clean: `scripts/validate_scenario.rb scenarios/test-rfid-multiprotocol/scenario.json.erb --no-graph`
  reports 0 errors (0 known), 23 warnings, schema passed. 0 lines with the failure mark. The
  warnings are the pre-existing decoy-keycard and legacy-sprite notices. No dungeon_graph rewrite
  (ran with --no-graph).
- Honest Level 4 route completes under the hardened server (live, below).

## Item 1: browser proof (real test bridge, port 3638)

Keyless server started by hand the way `tools/playtest/start-keyless-server.sh` does (KEYLESS
confirmed in the boot log, TTS off), stopped by PID afterwards (port 3638 no longer listening).
Games created with `tools/playtest/new-game.rb test-rfid-multiprotocol --start-room mifare_custom_room`
(a documented new-game.rb head-start that unlocks the Level 3 room where guard_custom and the Level 4
door sit; the upstream EM4100/MIFARE clone minigames are not the subject here). Both pages loaded the
real engine and bridge: `window.__test` was an object and `window.breakEscapeConfig.apiBasePath` was
present. Each unlock/clone call is the page's own `fetch` in the shape of `ApiClient.unlock` /
`ApiClient.cloneCard` (same-origin, the page's CSRF token), the exact client path.

- Honest, game 3217 (holds the start rfid_cloner; guard_custom encountered at room load):
  `POST /clone_card {npc_id:"guard_custom", card_id:"corporate_badge"}` -> 200
  `{success:true, recorded:true}`. Server state after: `serverClones={"corporate_badge"=>{source:{npc:"guard_custom"}, uidOnly:false}}`
  (a MIFARE Classic Custom clone, correctly not UID-only). Then
  `POST /unlock {targetType:"door", targetId:"desfire_room", method:"rfid"}` with no card_ids ->
  200 `{success:true}` with the Level 4 roomData returned. `desfire_room` (Level 4) `requires:["corporate_badge"]`,
  so the Classic badge clone opens it, as the scenario intends. Honest play is not blocked.
- Forged, game 3218 (no clone; `serverClones={}`; guard_custom also encountered at room load):
  the same `POST /unlock desfire_room` with no card_ids -> 422 `{success:false, message:"Invalid attempt"}`.
  `rfid_requires_held?` sees no held keycard and no recorded clone whose id is in `requires`, so the
  requires-only door is refused. This is the gap the fix closes.

The two games isolate the property: both encountered the guard, only the one that actually recorded
the clone could open the door. Encountering the NPC is not enough; a server-visible held card or
recorded clone is required.

## Item 2: whole-branch diff

`git diff --stat 2f5471209..36bd70e9b` touches exactly: `app/models/break_escape/game.rb`,
`docs/IDEAS_BACKLOG.md`, `docs/achitechture/HARDENING_RFID_TRUST_BUILD_LOG.md`, the R1 and R2
review files, and three test files (`test/controllers/break_escape/access_model_rfid_test.rb`,
`test/integration/unlock_system_test.rb`, `test/models/break_escape/game_test.rb`). No ink, no
client JS, no scenario. Matches the expected set (game.rb + tests + docs only).

Re-read of the game.rb change for anything earlier rounds missed; nothing new found:

- `rfid_requires_held?` returns true only when a non-revoked keycard id in `requires` is held
  (`held_keycard_ref_ids`), or a non-revoked recorded clone matches, with a UID-only clone credited
  only at a lock with `acceptsUIDOnly`. Revoked ids are subtracted in both branches (the left-card
  consequence), and the clone branch needs a cloner held. Correct.
- `held_keycard_ref_ids` reads only server inventory, skips `client_forged?` items, resolves a card's
  id as the client does (`card_id`, else `ItemIdentity.lock_ref`), so an opens_lock-only keycard
  (m01/m02/m05/sis02) still matches. No forged id and no client input reach this path.
- CHEAT POLICY: `serverClones[id].uidOnly` is derived from the scenario's `rfid_protocol` in
  `record_card_clone!`, never from the request, and is not merged by `sync_state`; a client cannot
  mint a non-UID clone of a DESFire card. Honest play of every deployed requires-only rfid lock
  remains reachable from server-held state (R1/R2 audit; all deployed cloned cards are EM4100 /
  MIFARE_Classic, so no deployed mission needs the UID path).
- SYNC SIZE: no new per-game field; `serverClones` is keyed by card id, bounded by the scenario's
  distinct cards; `card_ids` is request-only. Payload shape unchanged.

Tests re-run (single files, no lock), all green:

- `test/controllers/break_escape/access_model_rfid_test.rb`: 53 runs, 212 assertions, 0 failures, 0 errors.
- `test/integration/unlock_system_test.rb`: 46 runs, 153 assertions, 0 failures, 0 errors.
- `test/models/break_escape/game_test.rb`: 99 runs, 413 assertions, 0 failures, 0 errors.

## Item 3: backlog entry

The new `docs/IDEAS_BACKLOG.md` entry (RFID trust fix review R2, BLOCKER 1) describes the gap
correctly. Verified against the reverted scenario and the shared ink:

- `desfire_room` (Level 4) `requires:["corporate_badge"]` (the Classic card), with no `acceptsUIDOnly`,
  so the DESFire card `executive_card` gates no lock, as the entry states.
- The shared guard ink `scenarios/ink/rfid-security-guard-fixed.ink` (used by both test-rfid and
  test-rfid-multiprotocol) declares `VAR card_uid_only` but has no choice that produces a UID-only
  clone: a card that is neither instant-clone nor needs-attack falls to the "can't clone these
  easily" branch. So nothing teaches the UID-only clone, as the entry states.
- The stated fix (a `card_uid_only` clone branch in that ink, recompiled, plus a Level 4 lock naming
  the DESFire card with `acceptsUIDOnly:true`) matches the server rule: a UID-only clone opens only
  an `acceptsUIDOnly` lock (`rfid_requires_held?`), so the server side is indeed ready.

## Minor (pre-existing, not introduced here, already filed)

- `scenarios/test-rfid-multiprotocol/scenario.json.erb:186,221-222` — the Level 4 room name and
  success note still present Level 4 as "MIFARE DESFire (UID-Only)", yet the door is opened by the
  Level 3 Classic `corporate_badge` clone and the DESFire card is inert. This narrative-vs-mechanic
  mismatch is in the baseline (the scenario is byte-identical to 2f5471209), so it predates this
  branch, and the IDEAS_BACKLOG entry already captures the work to make the DESFire UID lesson real.
  No action needed on this branch.

## Verdict

APPROVE. R2's blocker is closed by the revert (the scenario is byte-identical to baseline, validator
clean, Level 4's honest Classic-badge route opens the door and a no-card forge is refused, proven
live on the real bridge). The branch changes only game.rb, tests and docs; the three touched test
files pass; and the backlog entry describes the deferred UID-only gap accurately.
