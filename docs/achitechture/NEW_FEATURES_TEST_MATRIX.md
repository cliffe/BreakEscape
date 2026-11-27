# Test coverage matrix: engine features built for lab_physical_pentest (3–5 November 2026)

Audit date: 2026-11-05. Method: grep and reading of `test/js/*.test.mjs`, `scenarios/`, `docs/`, `scripts/`. `bin/test-js` was run: 371 files passed, 0 failed. The Rails suite and the browser were not run. "Live" means a written record of the feature working in a browser; none of the records below are fresh re-runs.

Legend: yes = covered, partial = some behaviours, none = nothing found.

## Summary

| # | Feature | Unit tests | Focused test scenario | Live browser proof | Docs / schema / validator |
|---|---|---|---|---|---|
| 1 | NPC needs system | yes (14 tests, `npc-needs.test.mjs`); `needsHome` preference not asserted | `test_npc_needs` exists (partial); `test_needs_sims` in progress | test_npc_needs (near/far `npc_used`), lab game 411; none for carry deadlines or needsHome | design doc, schema, `validate_npc_needs.rb`; README silent; design doc section 15 missing |
| 2 | Gate doors | yes (`door-gates.test.mjs`, 9 tests); `playerOpen` untested | `scenarios/test_gate_tailgate` (gate, pass rule, sam loop) | `scenarios/test_gate_tailgate` games 504–510, 2026-11-05: gate open/hold/shut, never trapped, denied without pass, follow with lanyard, `playerOpen`; earlier probe_tailgate games 447–451 | `TAILGATE_REDESIGN.md`; not in schema; not in validator; README silent |
| 3 | Sight challenge extensions | yes (17 tests) | `scenarios/test_gate_tailgate` (`near` door, cooldown, `skipIfGlobal` list) | `scenarios/test_gate_tailgate` games 506/509: fires once per cooldown near the door, list-form skip with the global set; earlier probe_tailgate item 8 | README (`challengeOnSight`), schema, validator |
| 4 | Multi-room routes + route actions | partial (`npc-route-multiroom.test.mjs`): `unlockRoom` yes (refusal warns once, tested), `useObject` none | `scenarios/test_gate_tailgate` (`unlockRoom`+`useObject`, route `dwellTime`) | `scenarios/test_gate_tailgate` game 509: unlock then load once then walk, `dwellTime` 6.3 s; `useObject` ran without error, facing not asserted; earlier probe_tailgate item 12 | design doc only; `action` not in schema; no validator check |
| 5 | NPC `closeDoor`; loadRoom idempotency | closeDoor yes (mapping to bridge); idempotency: `load-room-idempotent.test.mjs` (7 tests, incl. concurrent calls and retry after failure) | `scenarios/test_gate_tailgate` (`closeDoor` mapping) | `scenarios/test_gate_tailgate` games 506/509: `closeDoor` shuts and holds the gate; `loadRoom` once in 4 laps, `rooms.staff_room` identity unchanged; earlier probe_tailgate item 5 | validator knows `closeDoor`; not in schema |
| 6 | RFID clone-as-entry | none (stubbed `false` in `door-snap.test.mjs`) | `scenarios/test_gate_tailgate` (cloner, `# clone_keycard`, door `requires`) | `scenarios/test_gate_tailgate` game 510: clone saved, door click grants entry, `door_gate_player_opened`, gate shuts after the window | code comments only; not in schema |
| 7 | `add_capture` / captures store | partial: action and store yes, `addCapture` mapping merge none | none; lab only | lab game 411 (two captures written) | schema enum, validator field list, design doc section 13 |
| 8 | Patrol clock + stuck detector | yes (`npc-patrol-clock`, `npc-stuck-detector`) | none; no scenario shows a wedge | patrol clock: none; stuck detector: none | none; `NPC_PATROL.md` not updated |
| 9 | `npc_arrived`; mapping order | arrival: needs stub only; order: none | none; lab relies on it | lab game 411 (passive PIN surf fix 9900a396e not re-proved in a record) | order not documented |
| 10 | `room_lw_records`, `room_lw_briefing`, lw signage | none (no room or asset test) | n/a | lab playtests only; no screenshots recorded | schema enum yes, `game.js` yes, catalog yes; README room table none |

## 1. NPC needs system (`systems/npc-needs.js`)

Unit tests: `test/js/npc-needs.test.mjs` (14 tests, manual clock, stub world), plus `npc-action-icons.test.mjs` and `workstation-state.test.mjs` touching it.

Covered:
- Decay and bounded cycle: caffeine NPC leaves its post within T1 and again within P.
- Seeded determinism: same seed gives an identical log, another seed differs.
- Selector: nothing matching means no option; an unreachable nearer target is skipped for a reachable farther one; nothing reachable means the NPC holds still.
- Affordances: capacity 1 stops two NPCs using the coffee machine at once; the object holds no payload.
- Item interests, pickup, carry, use: a dropped tagged item is collected and used at an accepting PC.
- `npc_used` with `playerNearby` and `playerDistance`; per-NPC payload delivery; `onUse` setGlobal (finder scenario).
- Conversation freeze and resume; scripted move suspends needs; VM pause and long-frame clamp; unreachable affordance fails visibly with a `timeout` reason; wind-up tell.

Not covered:
- `needsHome` home-object preference from f816f09a5. The fixtures set `needsHome: 'clerk_pc'` but no test places two satisfying objects and asserts the home one wins, nor that an unreachable home falls back to the nearest. Neither `_useCandidate` nor `_carryCandidate` branch is asserted. The commit changed no test.
- Carry deadline: `3 * dist / speed` with a 20 s floor, and the freeze extension that shifts `deadline` after a conversation. Only the unreachable-affordance timeout is asserted.
- A held item dropped when a job aborts (`dropHeld` is stubbed and never asserted); `noticeRooms`; per-item cooldown after a failure; `_resolveHome` object form versus `{room,x,y}` form.
- `createEngineWorld` and `installNpcNeeds` (live adapter): no test.

Other scenarios using needs: m02_ransomed_trust and sis01_healthcare contain no `decayPerMin`, `needsHome` or `affordance` keys (the word "needs" there is prose and `needs:` task lists), so f816f09a5 cannot change their behaviour. test_seating (6 `decayPerMin`, 3 `needsHome`) and lab_physical_pentest (4 and 3) do use it. The only automated check on test_seating after f816f09a5 is `seating.test.mjs`, which covers chair frame order and facing, not needs-driven choice of desk.

Scenario coverage: `scenarios/test_npc_needs` (one need, `interests`, `onUse`, `needsHome`, `usePayload`, a near/far `npc_used` pair) exercises the core. `scenarios/test_needs_sims`: **in progress**, not audited. `scenarios/test_seating` shows needsHome with seating.

Live proof: `PHYSICAL_PENTEST_PASS2.md` line 113 records near/far `npc_used` proved live in test_npc_needs; `lab_physical_pentest/BUILD_HANDOVER.md` records game 411 (all three beats fired through the needs system, score 100) and game 399. Both pre-date f816f09a5 and the reachability change 4512515ff by an unknown margin; neither names needsHome. NPC_NEEDS_SYSTEM.md notes `reachable()` bug "found live" (e80482db9). No proof for carry deadlines.

Docs: `docs/achitechture/NPC_NEEDS_SYSTEM.md` (header says "section 15 lists what exists and what is left"; the file has no section 15). Schema has `needs`, `interests`, `needsHome`, `onUse`, `affordance`. `scripts/validate_npc_needs.rb` exists and is called from `validate_scenario.rb`; the Ruby suite has no test for it (none found in `test/`). README_scenario_design.md does not mention needs.

Gaps:
- High: needsHome preference is untested. Unit test: two PCs both `satisfies: work`, NPC with `needsHome` on the farther; assert the farther is chosen, then make it unreachable and assert fallback; repeat for a carry job.
- High: after f816f09a5 nothing proves test_seating or the lab still pick the right desk in a browser. Browser run: test_needs_sims (when built) with two desks, assert each NPC uses its own via `__test.needs.log()`.
- Medium: carry deadline and freeze extension. Unit test: freeze for 60 s mid-carry, assert no timeout failure; slow NPC far target, assert deadline is 3x the travel time.
- Medium: drop on abort. Unit test: abort a carrying job and assert `dropHeld` is called with the item id.
- Low: add the missing section 15 to the design doc; add a README paragraph.

## 2. Gate doors (`systems/door-gates.js`)

Unit tests: `test/js/door-gates.test.mjs`, 9 tests.

Covered: `normaliseGate` defaults and opt-out; plain door is not a gate; opens as the guard nears, holds `holdMs`, shuts; never shuts while the guard's path crosses the doorway; never shuts on a player in the doorway; undisguised player near an open gate shuts it and keeps it shut; `closeNow` with and without force; a sprite registered while open is opened too (124be78d6); `unmarkDoor` for N/S doorways and E/W corridors.

Not covered:
- `playerOpen` and `door_gate_player_opened` (clone-as-entry window, `playerHoldUntil` honoured by the shut-on-undisguised rule at line 362).
- The click path in `doors.js` (denied toast once per click, `door_gate_denied` event, `isRepeatInteraction`). Verified only in the probe.
- `playerMayPassIf` with a missing or non-string global; reset on `initializeRooms`; far-room sprite joining by position; gate config read from the full `/room/:id` data (the bootstrap filter bug class).
- Grid unmark is covered; remarking the grid on shut is covered only by door cells in the probe.

Scenario coverage: none. `scenarios/probe_tailgate` was deleted (0305377c2) once the lab served the same purpose; the lab is the only scenario with a `gate` block.

Live proof: `TAILGATE_REDESIGN.md` "round 2": probe games 447–451, items 3, 4, 6, 7, 9, 10 pass (open, close after 2.5 s, disguised tailgate, undisguised shut, click once, never trapped). The lab smoke test (game 399/411) tailgated into `secure_area`. The newest gate commit, 7b2e541bf, is the fix the probe verified; 15e079324 (clone-as-entry, click denial regardless of server lock) came after the probe docs and has no live record.

Docs: `TAILGATE_REDESIGN.md` only. `gate` and `openFor`, `openRadius`, `holdMs`, `playerMayPassIf`, `playerOpen` are absent from `scripts/scenario-schema.json` and `validate_scenario.rb`; README_scenario_design.md has no section.

Gaps:
- High: no focused test scenario now the probe is gone, and the lab is a 7-room mission. Create `test_gate_door` (two rooms, one guard patrol, one disguise global) and drive it with `__test`.
- High: `playerOpen` and the `doors.js` click handler (see feature 6).
- Medium: schema and validator entries for `doors[].gate` (unknown key typos, `openFor` ids that are not NPCs, `playerMayPassIf` not a declared global, N/S only).
- Low: README section.

## 3. Sight challenge extensions (`systems/npc-sight-challenge.js`)

Unit tests: `test/js/npc-sight-challenge.test.mjs`, 17 tests.

Covered: default off; `true` means defaults; once per sighting with payload; cone angle; cooldown; update throttle; `rooms` list; `requireGlobal` and `skipIfGlobal` gating including a global set mid-sighting; custom event name; suppressed during minigame or conversation; hidden, KO'd and phone NPCs; a `player_spotted` mapping through NPCManager; `near` door, object and tile; near with out-of-cone and skipIfGlobal; near with `rooms` across the boundary; target room not loaded.

Not covered: `skipIfGlobal` as a **list** (schema says string; the lab uses a string; the brief says string or list, so confirm which the code accepts); the `player_in_view_near:<npc>` payload fields `targetId` and `targetType` are asserted only if the "near door" test checks them (it checks one event); the radius default of 64; `near` with a missing room followed by that room loading later. Also `sight-challenge-tutorial-prompt.test.mjs` covers the first-use prompt only.

Scenario coverage: none focused; lab only (one `challengeOnSight`, one `near`, two `skipIfGlobal`).

Live proof: probe_tailgate item 8 (in-cone undisguised fires once with `targetId`, disguised 42 samples no event, repeat after cooldown). The same record says out-of-cone and within-cooldown suppression are "unit tests only, not live".

Docs: README_scenario_design.md "Guards who challenge on sight" covers `enabled`, `cooldown`, `event`, `rooms`, `requireGlobal`, `skipIfGlobal`; `near` and `player_in_view_near` are not in the README table (grep found no `near` row). Schema has `near`, `cooldown`, `requireGlobal`, `skipIfGlobal`. Validator `known_sight_challenge_fields` includes `near`.

Gaps:
- Medium: README rows for `near` and the `player_in_view_near:<npc>` event.
- Medium: unit test for `skipIfGlobal` given an array, or document that it is string only.
- Low: assert `targetType` for door, object and tile in the existing near tests.

## 4. Multi-room NPC routes and route actions (`systems/npc-behavior.js`)

Unit tests: `test/js/npc-route-multiroom.test.mjs`, 6 tests.

Covered: `pauseForPlayer` default for route walkers; a locked route room is not preloaded; route-only NPC walks every waypoint in order, runs the unlock action, then crosses; refused unlock backs off 5 s and never advances into the unloaded room; unreachable leg backs off on the same waypoint; transition into an unloaded room waits.

Not covered:
- `useObject` route action (no test anywhere; lab has one use).
- Waypoint `dwellTime` on a **route** waypoint. `npc-stuck-detector` checks a long dwell does not trip the watch on a single-room patrol; no test shows a route NPC pausing for `dwellTime` before the action or the next leg.
- The 15 s action timeout, and "last waypoint of each room was being skipped" (b4a4fc52c fix) as a regression test: the order test may cover it by walking every waypoint, but no assertion names the wrap-around.
- `_runRouteAction` when the room is already unlocked (skips NPC unlock, only loads).

Scenario coverage: none focused; `scenarios/test-multiroom-npc` predates the work and TAILGATE_REDESIGN notes it "behaves differently" and needs "one live look" (not recorded as done). `dwellTime` single-room is used in `test_npc_visibility`, `test_event_cascade`, `test_npc_patrol_override`, `test-npc-waypoints`.

Live proof: probe_tailgate items 1, 2, 12 (loop of 7 trips in 90 s, no teleport, unlock then `/room` load without 403). Regression for single-room waypoint patrols (item 11 in the probe doc, "A11") is recorded as **not run** at the time; no later record found.

Docs: `TAILGATE_REDESIGN.md` and the lab handover. `NPC_MULTI_ROOM_NAVIGATION.md` has no mention of `unlockRoom` or `useObject`. Waypoint `action` is not in the schema; `dwellTime` is. No validator check (for example, unlockRoom naming a nonexistent room, or the last waypoint of a segment not within `openRadius` of the gate, the design rule from the probe).

Gaps:
- High: A11 regression browser run is still outstanding: m01 or m02 plus `test_npc_patrol_override` and `test-npc-patrol`/`test-multiroom-npc`.
- Medium: unit test for `useObject` (stub object with `onUse`, assert the call and that the route continues).
- Medium: validator rule for the door-side waypoint distance and `unlockRoom` room existence; schema entry for waypoint `action`.
- Low: route waypoint `dwellTime` unit test.

## 5. NPC `closeDoor` and reopening a loaded room (`npc-manager.js`, `rooms.js`)

Unit tests: `test/js/event-mapping-unlock-door.test.mjs` last test: the mapping config carries `closeDoor` and a firing mapping asks `doorGates` to force-close each room. Validator knows the key.

Not covered:
- `closeDoor` against a non-gate door (the code path logs a warning in `playerOpen`; the equivalent for `closeNow` is unasserted).
- `rooms.js loadRoom` idempotency: no test imports `rooms.js`. `npc-route-multiroom` stubs `window.loadRoom` with a function that overwrites `window.rooms[id]`, so idempotency is not tested there either (the line-53 stub always replaces the room). The behaviour is covered only live.
- The reopencheck referred to in the lab log (an existing check script) was not found in `test/`; the loop log says the Stage 0 regression result is "pending".

Scenario coverage: none; lab uses `closeDoor` once.

Live proof: probe_tailgate item 5: `loadRoom('probe_b')` called once and the `rooms.probe_b` identity unchanged. Items 6 and 10 exercise `closeNow`.

Docs: validator only; schema does not list `closeDoor` (schema has 0 `unlockDoor` entries either, so the whole mapping action family is unlisted there); README has no mention.

Gaps:
- Medium: unit test for `loadRoom` twice on the same id (extract or stub Phaser, assert the second call returns the existing room and does not re-create sprites).
- Low: `closeDoor` naming a room that is not a gate; schema entry for `closeDoor` and `unlockDoor`.

## 6. RFID clone-as-entry (`unlock-system.js`, `doors.js`, `door-gates.js`)

Unit tests: none. `evaluateRfidCredential` and `playerHoldsRfidCredentialFor` are exported and pure-ish but no test imports them (`door-snap.test.mjs` stubs `playerHoldsRfidCredentialFor` to `false`). The existing `rfid-*` tests cover the cloner, dictionary attack and denial hold, not this entry path.

Not covered: physical keycard satisfying `requires`; saved clone satisfying `requires`; wrong card; `requires` as array; the gate's `playerOpen` via `doors.js` (success toast "Access granted: cloned staff badge accepted", hold window `playerHoldUntil`, shutting after the window); `requires` taken from `gateGroup` when the clicked sprite lacks it.

Scenario coverage: none. Live proof: none found (15e079324 "restore clone-as-entry on the gate" has no record of a browser run).

Docs: code comments in `door-gates.js`; not in schema or README; lab handover not checked for teaching text.

Gaps:
- High: unit test for `evaluateRfidCredential` and `playerHoldsRfidCredentialFor` with a fake `window.gameState` (keycard held, clone saved, neither, wrong facility code).
- High: browser run: get the cloned badge in the lab, click the gate, assert `door_gate_player_opened`, walk through, assert it shuts.
- Medium: `door-gates` unit test for `playerOpen` hold and the undisguised-shut rule yielding to `playerHoldUntil`.

## 7. `add_capture` and the captures store

Unit tests: `test/js/add-capture-action.test.mjs` (4 tests: `recordSECapture` writes a credential entry, first capture wins, action records a foothold and a distinct target, no `targetId` rejected); `social-captures.test.mjs` and `social-captures-view.test.mjs` cover entry sanitising, merge, reveal flag, state-sync closed key set.

Not covered: the `addCapture` eventMapping key in `npc-manager.js` (template overlaid with the `npc_used` payload; the NPC's payload wins over the template). `grep addCapture test/js` returns nothing. Also a mapping whose payload is missing or not an object; `window.recordSECapture` absent.

Scenario coverage: lab only (5 `addCapture` entries). Not in test_npc_needs.

Live proof: lab game 411 ("both captures written"). Per-NPC secret reaching the store is the claim in `PHYSICAL_PENTEST_PASS2.md`.

Docs: schema enum includes `add_capture`; validator knows `addCapture`; NPC_NEEDS_SYSTEM.md section 13.

Gaps:
- Medium: unit test for the mapping path: fire a mapping with `addCapture` and an `npc_used` payload, assert the store entry carries the payload's secret, and that a mapping without payload writes the template.
- Low: add an `addCapture` mapping to `test_needs_sims`.

## 8. Patrol clock unification and stuck detector (`npc-behavior.js`, `npc-sprites.js`)

Unit tests: `npc-patrol-clock.test.mjs` (6 tests: `clockNow` is scene time before and after start, never epoch ms; bump handlers stamp the NPC clock; old `Date.now()` bug no longer freezes a patrol; settling ends after `settleDuration`; unreachable waypoint backs off 2 s on the scene clock). `npc-stuck-detector.test.mjs` (10 tests: re-path after `NPC_STUCK_MS`, nudge to nearest walkable cell, target drop, nudge limited to a tile, normal walk and long dwell never trip it, pause for player, player beside NPC, path request in flight, coexistence with the stall re-target).

Not covered: `clockNow` while the game is paused or the VM clock is stopped; the stuck watch on a real wedged sprite (stubbed walker); multi-room route NPCs and the watch.

Scenario coverage: none (nothing builds a wedge on purpose). Live proof: none found for either. TAILGATE_REDESIGN item 6 of "left to do" says the stuck detector and the `Date.now()` fixes were "not built" at that point; they landed later (ca9a3fd8b, 4143d47d0) with unit tests only.

Docs: none. `NPC_PATROL.md` does not mention `clockNow` or the stuck watch. No schema or validator concern.

Gaps:
- High: browser run across missions with patrolling NPCs (loop log Stage 0 says "pending"): confirm patrols still move after 4143d47d0 and nothing nudges a healthy NPC in m01, m02 and `test-npc-patrol`.
- Medium: test scenario with a patroller blocked by a pushable object, asserting recovery in the browser.
- Low: docs paragraph in `NPC_PATROL.md`.

## 9. `npc_arrived` and event-mapping order

`npc_arrived:<id>` is emitted by `npc-behavior.js` (goToAndStay arrival, now with `owner`) and consumed by the needs system. It predates this work. Unit tests: only the needs stub in `npc-needs.test.mjs` feeds arrival; no test for the real emit with `owner`, or for a scenario mapping on `npc_arrived` seeing a needs arrival (NPC_NEEDS_SYSTEM.md section 8 warns about this).

Mapping order: the lab fix 9900a396e relies on mappings being evaluated in array order (the passive-surf capture must run before Len's warning `closeDoor`). `npc-manager-triggers`, `npc-mapping-delay` and `event-mapping-unlock-door` test other things; no test asserts that two mappings on one event fire in array order, nor that a global set by the first is visible to the condition of the second.

Scenario coverage: lab only. Live proof: none found for the fix itself (the commit message states the cause; the loop log F2 is still "open").

Docs: README_scenario_design.md does not say that mappings run in array order. Validator has no ordering rule.

Gaps:
- High: unit test: two mappings on one event, the first sets a global and the second's condition reads it; assert order and the cross-visibility. Then document the rule in the README.
- Medium: browser run of the lab passive surf (F1/F2) after 9900a396e.
- Low: test that a needs arrival carries `owner: 'needs'`.

## 10. New room types and lw signage

Registration: `game.js` lines 226–232 preload `room_lw_records` and `room_lw_briefing` JSON, plus the sign images (`lw_logo_sign1`, `lw_sign_briefing1`, `lw_sign_records1`, `lw_sign_admin1`; files exist under `assets/objects`). `scripts/scenario-schema.json` enum has both room types. `scripts/room_gen/catalog.json` has all four signs. Both room JSONs exist; the lab scenario uses both types (lines 202 and 449) and the signs come from the room maps, not the scenario.

Unit tests: none. There is no test that every `room_*` type in the schema enum has a JSON file and a preload, or that every object image in the room JSONs has a loader. Scenario coverage: none; lab only. Live proof: the lab re-dress commits (0fd380536, a32434068) were done with playtests per the loop log, but no screenshot or report is in the repo.

Docs: `LEDGERWELL_SITE_LAYOUT.md` and `WAYFINDING_REVIEW.md` mention the room names; the README_scenario_design.md room table does not list any `room_lw_*` type.

Gaps:
- Medium: a node test that walks the schema room-type enum, the `game.js` tilemap preloads and `assets/rooms/*.json`, and every image key in those JSONs against `this.load.image` calls; this catches a missing preload before the browser does.
- Medium: README room table rows (slots, door positions) for the `room_lw_*` family.
- Low: one screenshot per room kept under the lab folder.

## Update 2026-11-05 (unit-test, docs and schema pass)

Closed by `1cea1c34f` and the docs commit that follows it:

| Gap | Closed by |
|---|---|
| 1 needsHome preference (use and carry, unreachable and busy fallback) | `npc-needs.test.mjs`, 7 new tests |
| 6 RFID clone-as-entry (`evaluateRfidCredential`, `playerHoldsRfidCredentialFor`) | `rfid-clone-entry.test.mjs`, 9 tests |
| 2, 6 gate `playerOpen`, hold window vs the undisguised-shut rule, `playerMayPassIf` normalisation | `door-gates-player-open.test.mjs`, 8 tests |
| 9 mapping array order and cross-visibility of a global | `event-mapping-order.test.mjs`, 5 tests; rule documented in the README |
| 4 route action `useObject` | `npc-route-multiroom.test.mjs`, 3 new tests (the action only faces the object; it does not call `onUse`) |
| 5 `loadRoom` idempotency | `load-room-idempotent.test.mjs`, 5 tests plus 1 skipped (below) | D4 (ec1dd839f): the skip is lifted; concurrent calls share one load, and a failed load can be retried.
| 3 `skipIfGlobal` list | already supported (`npc-sight-challenge.js` `skippedByGlobal`, used in a test); README now says so |
| Docs | README: gate doors, route actions and `dwellTime`, mapping order, `closeDoor`, `near`, `room_lw_*` rows. NPC_NEEDS_SYSTEM.md header no longer cites a section 15 |
| Schema | `rooms[].doors[].gate`, route waypoint `action`, eventMapping `closeDoor` added (optional) |

Found, not fixed: `loadRoom` checks `window.rooms[roomId]` before its first `await`, so two simultaneous callers (a route NPC's `unlockRoom` and the player's door click) each fetch the room and load its NPCs; `createRoom`'s own guard stops a duplicate room. Skipped test: `load-room-idempotent.test.mjs` "two simultaneous calls fetch once"; engine site `core/rooms.js` line 781.

Still open from this audit: carry deadline and freeze extension, drop-on-abort, `addCapture` mapping merge, route `dwellTime`, `room_lw_*` preload consistency test, validator rules, all browser runs.

## Prioritised gap list

High
1. needsHome preference (f816f09a5) has no assertion; test_seating and the lab depend on it. Unit test plus a two-desk browser run.
2. RFID clone-as-entry has no unit test and no live proof (feature 6), and `playerOpen` is untested.
3. No focused gate-door scenario now `probe_tailgate` is deleted; the lab is the only consumer (features 2, 3, 4, 5).
4. Event-mapping array order is relied on by the lab and untested and undocumented.
5. A11 regression and patrol clock/stuck detector live check are outstanding (loop log Stage 0 "pending"); `useObject` untested.

Medium
6. Carry deadline, freeze extension and drop-on-abort unit tests.
7. `addCapture` mapping merge path untested.
8. `loadRoom` idempotency has no direct test.
9. Schema and validator entries for `doors[].gate`, waypoint `action`, `closeDoor`; README rows for `near` and `player_in_view_near`.
10. Room-type, preload and asset consistency test for `room_lw_*`; README room table rows.

Low
11. Missing section 15 in NPC_NEEDS_SYSTEM.md; `NPC_PATROL.md` clock and stuck notes; route `dwellTime` test; `skipIfGlobal` list form decision; screenshots of the new rooms.

Needs demo: `scenarios/test_needs_sims` is in progress and was not audited. It should be the vehicle for gaps 1, 6 and 7.
