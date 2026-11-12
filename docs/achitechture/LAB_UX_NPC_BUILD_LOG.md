# Lab UX, NPC half (q53 e, f, g): build log

Branch `build/lab-ux-npc`, 2026-11-12. From the backlog section "Lab follow-up: screens, gates and hints". The other four q53 items are in the lab UX UI build.

## (e) A keying event at a badge reader

**Engine** (`systems/npc-behavior.js`). A route waypoint action with `useObject` now emits `npc_used_object:<id>` `{ npcId, objectId, roomId, useMs }` as the NPC starts. A new optional `useMs` (0 to 30000) makes him stand facing the object for that long, then emits `npc_used_object_done:<id>` and runs the rest of the action (the `unlockRoom`). Without `useMs`, both events fire at once. A retried unlock does not repeat the events, and each new arrival does. A timed use counts as route "work", so a leg cut short beside the spot still counts as the arrival, the same as an unloaded `unlockRoom`. Waypoint actions run only on multi-room routes, as before.

**Lab** (`lab_physical_pentest`). Len's reader waypoint has `useMs: 2500`. Ruth's mappings set a new global `len_keyed`: false when the gate opens for him or he starts keying, true on the done event, false on `game_loaded`. The shoulder-surf (`player_watched_reader`) now needs `len_at_door && !len_keyed`. That window runs from the gate opening to the moment he has keyed, about 3.1 s, where before it was the 9 to 10 s the gate stays open. The shelves have a new "too late" hint for a look after he has keyed, and the "nobody at the keypad" hint now says to look across while he keys. Hints are toasts, so no voiced line changed. His cycle grows by 2.5 s, to about 17 s. The texts that say "about every 15 seconds" (task description, hint, ruth_phone ink) were left alone, because the ink line is voiced.

**Validator and schema.** `useMs` is checked: an error if it is not a number from 0 to 30000, a warning if there is no `useObject`, and a warning for an action on a single-room patrol. The schema and `README_scenario_design.md` cover it.

**Is the window fair?** Measured live in game 1375, at setFPS(20) with fixed steps on, standing at the ledger shelves:
- Gate opens at t, keying starts at t+0.6 s, done at t+3.1 s (the same on two cycles: 3114 ms and 3074 ms).
- A look 1.5 s after the door opens is credited (PIN on the tablet, task ticked, screenshot taken).
- A look 0.6 s after he has keyed is refused with the "too late" hint.
A student who is already at the shelves, waiting for the door as the hints say, has about 3 s from the door going dark. A student who is still walking over when it opens misses that round and catches the next one, about 17 s later.

## (f) `noticeRadius` for NPC interests

**Engine** (`systems/npc-needs.js`, two small edits). `interests.<tag>.noticeRadius` is measured in tiles from where the NPC stands to the item, and it applies on top of `noticeRooms`. The default is `NOTICE_RADIUS_TILES = 24` (768 px). Values are clamped to 0.5 to 100, and anything else falls back to the default.

**Why 24.** Every scenario that uses NPC interests was checked by rendering its ERB:
- `lab_physical_pentest` lord: notices `open_plan` (room_lw_accounts, 20 x 10 tiles, 22.4-tile diagonal). Home desk at (2, 6.5); the far corner is 17.9 tiles away.
- `test_access_work` lena, priya, kofi: one 10 x 10 room each (12.7-tile diagonal).
- `test_capture_log` sofia; `test_npc_needs` finder: one 10 x 10 room.
- `test_needs_sims` amara: office, 10 x 10.
- `test_needs_sims` grace: office and kitchen, which sit side by side (20 x 10).

Any two points inside a 20 x 10 room are at most 22.4 tiles apart, so an NPC standing in its notice room sees exactly what it saw before. The only change comes when the NPC is outside its notice rooms and more than 24 tiles from the item. Two cases: lord on a coffee trip, or grace in the lounge with a mug at the far end of the kitchen. Such an NPC now notices the item once it comes back within range, a short delay rather than a missed beat. (The `ca*`, `lab_social_engineering` and `test_social_*` scenarios use `interests` for something else, social targeting, and are not affected.)

**Validator and schema.** An error if the value is not a number from 0.5 to 100, and a warning under 2 tiles. The schema and `NPC_NEEDS_SYSTEM.md` are updated.

**Test scenario beat.** In `test_npc_needs` the finder has `noticeRadius: 4`, and the brief says so. Dropping where you start (about 3 tiles from him) still works.

**Live proof.** Game 1397 (test_npc_needs): binder dropped 7.5 tiles away in the far corner, still lying there 15 s later, finder idle. Picked up and dropped 3.1 tiles away: fetched and used (`finder_used_item`). Game 1419 (lab, default radius): the USB stick dropped at the far east end of open_plan, 15.7 tiles from lord, and he took the job at once.

## (g) The player no longer shoves routed or patrolling NPCs

**Options considered.**
- *A heavier NPC* (immovable or high mass, all the time). Rejected. An NPC that cannot be moved presses a player who is against a wall into the 8 px wall boxes. It would also change NPC-to-NPC collisions.
- *Letting the player slide past everywhere.* Safe, but the player would walk through guards in open floor.
- *Walking the NPC back to his route after a push.* This is half there already, for routed guards. The push itself, and its wall risk for the NPC, would remain.

**Chosen: a hybrid, scoped to the player pair** (`systems/npc-sprites.js`). For an NPC with `patrol.enabled` that is not hostile or KO'd, the player-NPC process callback works as follows. The engine sets `patrol.enabled` for any route it walks, not only a configured patrol: `goToAndStay` turns it on for the walk and off on arrival, and that is how a needs errand moves and how an NPC walks home after a push. So the rule covers patrols, errand walkers and the walk home (code review R2, M1, accepted as the user's q53 call, "the player not shoving routed NPCs").
- With the player more than 12 px from every wall box in the player's room and the NPC's room, and from every static body (desks, tables, collision objects; added in round 1, G2), the NPC's body is made unpushable for that one separation. The player stops against him and he keeps his line. He goes back to pushable after every physics step (`worldstep`), so NPC-to-NPC collisions are unchanged.
- With the player within 12 px of a wall, a doorway, a narrow corridor or any fixed furniture, the pair does not separate at all: the player slides past. 12 px is more than one 20 fps step of a 200 px/s NPC.
- Other NPCs are pushed as before: hostile or KO'd ones, and any NPC with no route at the moment (a needs NPC standing at its spot, or arrived from an errand). A configured patrol guard pausing at a waypoint keeps `patrol.enabled` and still holds.
The existing "wall-aware" refusal (NPC already in a wall: no push) is unchanged.

**Live proof**, headless at setFPS(20) with fixed steps on (never fixedStep false):
- Lab, game 1375, Len dwelling at (4, 4), player walking into him for 1.5 s: before the change he was shoved 53 px; after it he moves 0 px in both directions.
- Lab, along the wall while Len keys at the reader (twice): the player slides past (81 to 41 px), Len moves 0 px, wall overlap 0 for both.
- Lab, the player standing on Len's reader spot, against the wall, as he arrives and keys (twice): the player stays put, wall overlap 0.
- test-npc-patrol, game 1409, 12 contacts each with three patrollers, from both sides and diagonally. Before: the narrow-horizontal patroller (in the top wall band) was shoved from y 51 to 20, the player reached a 7 px wall overlap with patrol_basic, and the largest move along a push was 82 to 87 px. After: the narrow patroller does not move, wall overlap is 0 for the player and every NPC, and the largest move along a push is 0, 25 and 38 px. That last figure includes the NPC's own walking (random patrol), so it is an upper bound.
- The test script teleports the player beside the NPC. Teleports that landed inside a wall are skipped (2 and 1 of 12), because they are a setup artefact.

## Tests

- `test/js/npc-route-multiroom.test.mjs`: four new tests (events with and without `useMs`, hold then done then unlock once, re-emit per arrival and not on retry, a cut-short timed leg counts as the arrival). 25 pass.
- `test/js/validator-patrol-catch-locks.test.mjs`: three new tests. 12 pass.
- `test/js/npc-needs.test.mjs`: three new tests (normalising, inside and outside the radius, the room-wide default). 63 pass.
- `test/js/validator-npc-leash.test.mjs`: one new test. 10 pass.
- `test/js/npc-player-push.test.mjs` (new): the rule, wall nearness and the real collider callback on a fake scene. 6 pass.
- Full suites under the shared lock: JS 508 of 508 files pass. Rails 1796 runs, 2 failures, both in `lab_physical_pentest_secrets_test.rb`, which pinned the old wiring (`len_at_door` alone, three shelf hints, "the window is the open door, not the keying"). Updated for the keying window; that file now passes, 36 runs, 0 failures. The full Rails suite was not rerun.

## Open

- The lab's "about every 15 seconds" (task description, `hint_tailgate_now`, `ruth_phone.ink`) is now about 17 s. Left alone: the ink line is voiced.
- (Corrected in R2.) The rule in (g) was described here as patrol NPCs only. It already covered needs errands and the walk home, because both run through `goToAndStay`; see "Round 2 review fixes".
- In test-npc-patrol the narrow-horizontal patroller stands at y 51, inside the top wall band. That is a scenario quirk, unrelated to this change.

## Round 1 review fixes (2026-11-12)

Fixes for `LAB_UX_NPC_CODE_REVIEW_R1.md`, commit 8782fe028.

- **E1, the PIN window reopening with no keying.** The review's first fix. A new global `len_keying` is true from `npc_used_object:badge_reader` to `npc_used_object_done`, and false on `door_gate_closed` and `game_loaded`. The look counts on `len_at_door && len_keying`, so a gate opening as Len comes back out arms nothing. `door_gate_opened` now sets only `len_at_door`. `len_keyed` (true on done; false on keying start, the close and load) picks the "too late" toast. A fifth shelves toast covers the door open with no keying (just before he keys, or as he comes back out).
- **E2.** The task description, `hint_tailgate_now` and an ERB comment now say about every 17 seconds. The only voiced line is `ruth_phone.ink` ("every fifteen seconds or so"), left unchanged as the review advised.
- **G1.** The task text no longer says he has to squeeze past; it says the player can slip past him in the doorway. `README_scenario_design.md` now says a patrolling NPC cannot body-block, or be body-blocked, near walls.
- **G2.** The player slide now also counts static bodies (desks, tables, collision objects) within 12 px, through the arcade `overlapRect` static query (`staticRectsNear`). Two new tests; the collider test fails with the change removed.
- **F1.** `validate_npc_needs.rb` warns when `noticeRadius`, or the default 24, is less than a notice room's diagonal. `test_npc_needs` gets one warning, which is intended: the finder's radius of 4 is deliberate.
- **R1.** The Rails test refuses "before it shuts", "while it/the door is open" and "until it shuts" in the shoulder-surf texts and the shelves' observations, pins the new mappings and checks every combination of five globals for exactly one toast.
- **Nits.** F2 (comment back on `AVOID_RADIUS_TILES`), F3 (schema notes on string and 0 input), E3 (the validator's single-room warning now matches the engine: `multiRoom` true with a non-empty route, plus a test) and G5 (the code comment now says the pin lasts until the end of the physics step). Not done: a `TILE_SIZE` import in `npc-needs.js`, which has no imports and uses a bare 32 throughout.

**Tests.** 98 JS files that import a changed module or run a changed validator: all pass. Rails: `lab_physical_pentest_secrets_test.rb` 36 runs, 0 failures, plus the five other lab test files, 52 runs, 0 failures. The validator shows no ❌ on the lab.

**Live check** (keyless server on :3041, headless, setFPS(20) with fixed steps on, `[20, true]`):
- Game 1525. After Len had keyed, the records gate was shut and reopened through the real `window.doorGates.close/open`, which send the real events into the real mappings. The state then is `len_at_door` true, `len_keying` false. A real `E` at the shelves gave no credit (`kp_pin_surfed` false) and showed the new "not keying" toast.
- The same game, next round: door open at 43481 ms, keying 44187 ms (+0.7 s), `E` 0.86 s into the keying: credited, `opt_pin` ticked. The window is now the 2.5 s of keying, starting about 0.7 s after the door opens.
- Game 1513, standing at the reviewer's mid-floor spot for three rounds, did not reproduce a natural exit reopening: the gate stayed open, or Len keyed with it shut. That is why the reopening was forced. In that run Len also went about 130 s without keying after a held-shut round, which may be G4; it was not chased.
- Probe scripts: `exit_reopen_probe.js` and `exit_reopen_probe2.js` in the session scratchpad.

## R2 fixes (2026-11-12)

Fixes for `LAB_UX_NPC_CODE_REVIEW_R2.md` (commit fa610b410), after merging `main` into the branch (c61be9942, no conflicts; `npc-needs.js` keeps main's `_borrowDone(s, job, met, cut = null)`).

- **M1, accepted and documented.** The user's q53 call was "the player not shoving routed NPCs". Needs errands and the walk home after a push run through `goToAndStay`, which sets `patrol.enabled` for the walk, so they are routed NPCs and the rule applies to them as built. No engine change. Section (g) above and the Open list are corrected (they said needs walkers were pushed as before). `README_scenario_design.md` now says that any NPC walking a route (a patrol, an errand or the walk home) cannot be shoved in open floor, and that the player passes through it near walls, doorways, corridors, desks, tables and other fixed furniture; a patrol guard pausing at a waypoint still holds; an NPC that has arrived, or has no route, is pushed as before. Two new tests in `test/js/npc-player-push.test.mjs`: one reads `goToAndStay` and `npc-needs.js` to pin that errands set `patrol.enabled`; one runs the real collider with a needs errand walker (pin in open floor, slide by a desk and by a wall, pushed once arrived).
- **m1.** The README sentence names desks, tables and other fixed furniture (as above).
- **m2.** `docs/IDEAS_BACKLOG.md`, "Lab follow-up: screens, gates and hints": Len held up by a player at the records door, citing `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md` (2026-11-06) and the review's game 1579 measurement, cross-referenced to the existing R2-n3 entry for the same stall.
- **m3.** This log's description of (g) (see M1).
- **m4, the keying at a held-shut gate.** A guard whose timed `useObject` (the PIN at the reader) is the last stop before a leg across a gate that is held shut against him now turns back there, before keying, rather than keying for 2.5 s and turning back 5 s later. `door-gates.js` gains `heldShutAgainst(npcId, roomA, roomB)` (a shut gate between those rooms, the guard within its `openRadius`, and a barred player or a recent force-shut: the same rule as the turn-back timer). `NPCBehavior._turnBackBeforeUse` asks it, and on a yes resumes his own room's loop through the same code as `turnBackFromGate` (now shared as `_resumeOnThisSide`) and emits `door_gate_guard_turned_back` with `beforeUse: true`. No `npc_used_object` event, so `len_keying` never goes true and the shelves never see a keying with the door shut. Tests: three in `npc-route-multiroom.test.mjs` (turns back without keying; keys as before when not held; a use that is not the last stop never asks) and one in `door-gates-bar.test.mjs` (`heldShutAgainst` cases).
- **Nits.** n1: the test comment that called a disabled body "an open gate" is corrected. n4: the validator's `noticeRadius` warning no longer suggests a value over the 100-tile cap, and a comment says it uses the whole tilemap, walls included. n5 (R1 G3): closed with a frozen-patroller probe (below).
- **Nits left.** n1's browser probe of a guard walking the player into a desk in m04 or m09 was not run; the push runs below, in an office full of desks, cover the same collider path. n2 (a gate flicker mid-keying loses that round): noted, not changed. n3: if `ruth_phone.ink` is re-voiced for another reason, change "every fifteen seconds or so" to "every quarter of a minute or so" or "about every seventeen seconds" at the same time. n4's floor-versus-tilemap size: left, it errs towards warning.

**Tests**, without the lock: the 28 JS files that load `npc-behavior.js`, `door-gates.js` or `npc-sprites.js` all pass (npc-route-multiroom 30, door-gates-bar 24, npc-player-push 10 among them), plus `npc-needs.test.mjs` 64 and `validator-npc-leash.test.mjs` 12. Validator: `lab_physical_pentest` has no ❌ lines; `test_npc_needs` gives its one intended `noticeRadius` warning.

**Live proof**, a keyless server on :3058, headless, `setFPS(20)` with fixed steps on (`[20, true]` in every run). Probe scripts are in the session scratchpad, `uxnpc_r2fix/`.
- test_needs_sims, game 1605, the player walking straight into an errand walker (`patrol.enabled` true, `_moveOwner` "needs") for 1.2 s, 13 contacts with tom, amara and marek in the office: the player was never stuck (every run walked off at least 8 px afterwards), the bodies overlapped by 5 px at most, and wall overlap was 0 for both.
- test_needs_sims, game 1598, the player put on an errand walker's path, 7 times: the walkers stepped round him (closest 21 px), never stuck, no wall overlap.
- test_needs_sims, game 1632, the doorway check. Natural errands did not cross a doorway in 6 minutes (game 1598), so walkers were sent through the office's two doorways with the needs system's own call (`goToAndStay` with `owner: 'needs'`), with the player standing in the doorway or walking into the walker there, 16 runs. Five walkers crossed through the doorway the player stood in, passing through him (closest 0 to 8 px, overlap up to 10 px, the slide); the player could walk away in all 16, and wall overlap was 0 for the player and every walker. In some runs the needs system took the NPC back before it arrived; that is the needs system, not the collider.
- test-npc-patrol, game 1616 (G3): all nine patrollers frozen in place (their `update` a no-op, patrol still enabled), the player started 30 px away and walked into each from four sides for 1.2 s: 36 contacts, the NPC moved 0 px in every one (22 pinned, 14 slid past by a wall). So the 25 and 38 px "largest move" figures above were the patrollers' own walking. In an earlier run (game 1609) a mis-set teleport put the player inside the NPC, and the overlap resolution moved it 62 px; that is a setup artefact.
- lab_physical_pentest, game 1630 (m4): the player parked at the review's barred spot (1030, 55), 32 px from the gate, for 120 s. Barred in every sample, 14 turn-backs (one every 7 to 11 s), and no `npc_used_object:badge_reader` event at all. The review saw 7 keyings each followed by a turn-back 5 s later at the same spot.
- Games created: 1598, 1605, 1609, 1616, 1630, 1632. The server was stopped by its own PID.
