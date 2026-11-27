# Harness and wall-strip fix log (October 2026)

Review-and-fix rounds for two fixes that followed the Haiku 5.5 playtest trial: the sis02 back-wall strip (engine) and the playtest harness gaps. Up to 5 rounds each; an Opus reviewer per round, the same Sonnet fixer throughout.

## Wall strip and reach (commits f4a83f4af, df7753791, 87b169b5f, cd0915e6f, 9148e73ae, e71d96a24)

### Correction (user, 2026-10-26)

The sealing in this section was a misreading of the design. The top-down view fakes depth: a room's top two wall rows overlap the bottom of the room to its north, and the player is meant to walk there, "behind" the wall. From there they may overlap objects of the room to the south, but must not interact with them, because those objects belong to a different room. Everything below that exists to seal the strip is superseded.

Reverted (by hand, not `git revert`):
- the solid 32x64 back-wall blocks in `collision.js` (`isBackWallBlock`);
- the prop exemption machinery in `object-physics.js` (`addPropWallCollider`, pending/exempt states, 250 ms settle, `watchExemptions`, generation counter, `_wallColliders` dedupe): chairs use plain `game.physics.add.collider` again;
- the one-column N/S door carve in `npc-pathfinding.js` `markDoorWalkable` (two tiles wide again);
- the test-scenario NPC moves (`test-npc-face-player`, `test-npc-personal-space` y 2 back to 1; `test-npc-patrol` bounds back to y 0);
- tests that only tested the above: `collision-back-wall-blocks`, `prop-block-exemption`, `door-carve-cells`.

Kept, because they stand on their own: `reachX`/`aimX` (reach to the nearest point of a wide object, aim at its centre, rotation handling) and its tests; the bridge refusing stand points behind a wall (`wallClearFrom` checks, ring centres along wide spans, rival measures); `snapToTileCentre` and `removeWallTilesForDoorInRoom` using `calculateDoorPositionsForRoom` (with the door-snap tests; the one-tile cut matches `removeTilesUnderDoor` and the door sprite, so it stays); the test-bridge parse test; all harness commits (a73819578, 306f8241c, cb48719c5, 275051e17, 3ed8fd83f).

Added: the same-room interaction rule. `interaction-walls.js` now decides the room of the player's feet the way `updatePlayerRoom` does (`roomIdAtFeet`: floor starts two rows below a room's top, so the strip behind a south room's back wall is the north room) and the room of a target (`roomIdOfTarget`: sprite `roomId` for objects, so a wall fixture stays in its own room; the room it stands in for NPCs and swivel chairs). `wallClearFrom`, and so `interactionLineClear`, returns false across rooms. Doors, targets with no known room and feet in no room are not blocked. Line of sight stays: it still stops the case where both are in one room with a wall tile between (the sis02 case when the room rule does not apply, and m01's Sarah behind a dividing wall). Every path goes through those two functions: E-key selection, hover info label, click interact and the interaction menu (`isObjectInInteractionRange`), `handleObjectInteraction`, stand-point searches. The click handler also sorts the objects under the tap so those in the player's room come first, since two overlapping rooms can both have an object at the tapped point. The bridge reports `otherRoom` on entities, `interact` fails with `different-room`, and rival measures ignore rivals in another room. New test: `interaction-room-rule.test.mjs`.

Live check (sis02, m01), headless harness: the player walks down behind the SCADA control room's and the engineering workshop's back walls from battery_hall_1; there E, click, and the bridge's interact refuse sis_config_panel and hmi_ops_01 (no minigame, label hidden, reason `different-room`); from the workshop floor sis_config_panel opens, including from below its right half; `moveToNear sis_config_panel` from behind the wall picks a workshop spot and opens it. m01 reception behaves the same way; Sarah still talks; the main-office chair still kicks.


#### Correction review, round 1 (314db5e34)

Revert confirmed clean (object-physics.js and npc-pathfinding.js identical to f86749de5; 13 N/S doors crossed live). Room rule agrees with `updatePlayerRoom`. m01 server room objects open. Scope widened by the user: no punching through walls.

| Severity | Count |
|---|---|
| Blocker | 1 |
| Major | 3 |
| Minor | 7 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| B1 | blocker | Items dropped by an NPC KO'd outside its home room are registered in the home room, so they can't be picked up (m01 launch device, live) | not closed: the server rejects out-of-room drops, so they are lost on reload (round 2 R2-1) |
| M1 | major | Player punches and chair kicks ignore walls and rooms (Sarah hit from behind reception's wall, live) | fixed in b8b52fae9 |
| M2 | major | Hostile NPC attacks ignore walls (unleashed Sarah KO'd the player through the wall, live) | fixed in b8b52fae9 (`feetClear` gates npc-combat); matching `npc-behavior.js` change deferred to the user |
| M3 | major | NPCs that changed room are clamped to their home room, so "wall between" from 20 px (live) | fixed in b8b52fae9 |
| m1 | minor | Feet test depends on the player body being 10 px tall | fixed in b8b52fae9 |
| m2 | minor | Feet in no room allow everything; head-start spawn can put the player in a wall | gap fallback fixed in b8b52fae9; the spawn change moved every mission's start point and is being reverted (round 2 R2-3) |
| m3 | minor | Click sort acts on a same-room object when the tap meant to walk to a front-most other-room one | fixed in b8b52fae9 |
| m4 | minor | Bridge nudge says wall-between when the cause is the room rule | fixed in b8b52fae9 |
| m5 | minor | Room-rule test is pure-function only | fixed in b8b52fae9 (`combat-room-rule.test.mjs`) |
| m6 | minor | Chair kick measured to the body, reach to the sprite (pre-existing) | fixed in b8b52fae9 (`aimAtChair`) |
| m7 | minor | F turns to face a hostile through a wall | fixed in b8b52fae9 |

#### Correction review, round 2 (b8b52fae9)

Round 1 M1, M3, m1, m3, m4, m6 and m7 confirmed closed. `window.interactionWalls.feetClear` is exposed; `aimAtChair` still obeys the wall rule.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 3 |
| Minor | 4 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| R2-1 | major | Server rejects drops outside the NPC's scenario room (422), so a reload before pickup loses them; m01 launch device would softlock (live) | fixed in f5f172428 (server accepts a KO'd NPC's drop in any room; survived a reload live) |
| R2-2 | major | `feetClear` treats an open doorway as a wall: hostile NPCs freeze 26 px away through an open door, and neither side can hit (live) | fixed in f5f172428 (rooms count as one through an open door for combat and NPC talk; NPCs keep chasing; live) |
| R2-3 | major | Spawn change moved the start in 79 missions; m10 starts on Kowalczyk, sis02 against the console (live) | fixed in f5f172428 (reverted; `new-game.rb` writes a centre `startPosition`) |
| m-1 | minor | `player.js` spawn edit is dead code | fixed in f5f172428 |
| m-2 | minor | `--start-room` keeps the original room's `startPosition` | fixed in f5f172428 |
| m-3 | minor | NPC-side combat test only matches source text; 3 of 4 mutations survive | fixed in f5f172428 (real `NPCCombat` loaded; gate mutations caught) |
| m-4 | minor | NPC feet passed without half-height; gap rule differs between the two sides | fixed in f5f172428 |


#### Correction review, round 3 (f5f172428, final)

All round 2 findings confirmed closed, R2-1 and R2-2 with live evidence. The door rule holds: about 75k feet pairs swept at m01's reception door found no punch past the gap's edge from any reachable spot. Leashed Sarah stays in reception; unleashed she follows through the door without oscillating. Clean worktree: JS 277/277 files, Rails 783 runs with 0 failures; five mutations all caught. Stopped here: no blockers or majors after round 3.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 4 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor (older code) | Server trusts a client-reported KO, and an NPC-sourced drop in the NPC's own room needs no KO and can repeat | open: hardening is a design choice (require `npc_defeated?` for every NPC drop, refuse duplicates, refuse KO of `koImmune` NPCs) |
| 2 | minor | If the KO sync fails, the drop is still posted, and is rejected for an out-of-room fall; state stays consistent because the NPC comes back armed | open, acceptable |
| 3 | minor | `throughOpenDoor` only checks room A's doors, so a one-way link is asymmetric (only `timed_messages_example`) | open: check both rooms' doors |
| 4 | minor | `new-game.rb --start-room` centre `startPosition` doesn't avoid furniture | open: snap to a walkable cell, or note it in the script header |

### Round 1

| Severity | Count |
|---|---|
| Blocker | 1 |
| Major | 0 |
| Minor | 9 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | blocker | Committed `test-bridge/index.js` doesn't parse: partial staging misplaced three hunks, so `window.__test` is missing on a clean checkout | fixed in df7753791; new test runs `node --check` on every bridge file |
| 2 | minor | N/S door carve in `npc-pathfinding.js` marks cells inside the new block walkable | fixed in 87b169b5f (one-column carve) |
| 3 | minor | Movable props on a north room's bottom row start inside the south room's blocks | fixed in 87b169b5f (props skip `isBackWallBlock`) |
| 4 | minor | Test-scenario NPCs at tile y≈1 spawn inside blocks | fixed in 87b169b5f (moved to y ≥ 2) |
| 5 | minor | Middle of three N/S doors sits on a tile boundary, corridor 16 px off centre | fixed in 87b169b5f (`snapToTileCentre`) |
| 6 | minor | Bridge `competingInteractables` measures rivals by raw x, the engine by `reachX` | fixed in 87b169b5f |
| 7 | minor | Stand-point ring centred on the top-left, so the right half of wide objects is never sampled | fixed in 87b169b5f (ring centres along the span) |
| 8 | minor | E-key angle scoring now favours wide objects over small items on them | fixed in 87b169b5f (`aimX` for angle, `reachX` for range) |
| 9 | minor | `reachX` ignores Tiled rotation | fixed in 87b169b5f (`getBounds()` when rotated) |
| 10 | minor | No test for the collision blocks or the bridge module | fixed in 87b169b5f (fake-tilemap block test) |

### Round 2

All ten round 1 findings confirmed closed (8 partly: click path, see 2).

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 6 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor | Chairs ignore all back-wall blocks, so one can end up inside a strip, out of reach | partly fixed in cd0915e6f: start-inside exemption works, the "until it leaves" clear never runs (round 3 #1) |
| 2 | minor | Click-to-interact faces the top-left, the E key the centre | fixed in cd0915e6f |
| 3 | minor | Bridge predicts facing direction from `reachX`, not `aimX` | fixed in cd0915e6f |
| 4 | minor | `snapToTileCentre` floors, so three doors space unevenly (test scenario only) | documented and tested, behaviour unchanged (only an exact boundary ties) |
| 5 | minor | `removeWallTilesForDoorInRoom` still computes its own unsnapped door x | fixed in cd0915e6f (uses `calculateDoorPositionsForRoom`) |
| 6 | minor | No unit tests for carve width, prop exemption, snapping or ring centres | partly fixed in cd0915e6f (snap, carve and prop tests); ring-centre test deferred, `state.js` needs DOM stubs, behaviour checked live |

### Round 3

Five of six round 2 findings confirmed closed. `hmi_ops_01` opening a container is expected (it's a PC with contents). Door cut-outs checked live in m06 and m07: every N/S pair matched, no fallback warnings.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 1 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor | Prop exemption never clears: Phaser calls the process callback only while bodies overlap; its unit test passes falsely | fixed in 9148e73ae (`worldstep` watcher clears it; test now calls process only while overlapping) |

Uncounted nit: `timed_messages_example` has a one-way N/S link that would hit the fallback; pre-existing, demo only. Deferred.

### Round 4

Round 3 finding 1 confirmed closed against the Phaser 3.60 source; mutation tests show the new test fails if the clear is removed.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 3 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor | An earlier 250 ms timer can settle a later window early | fixed in e71d96a24 (generation counter) |
| 2 | minor | New-room chairs get two colliders per wall box (older code) | fixed in e71d96a24 (per-prop collider map) |
| 3 | minor | Test lacks re-window, double-registration and destroyed-prop cases; Set-backed emitter hides double hooks | fixed in e71d96a24 |

### Round 5 (final)

All three round 4 findings confirmed closed, each caught by a test under mutation. Full suite at HEAD in a clean worktree: 2976 of 2977 pass; the one failure (`event-mapping-unlock-door`, a test-runner IPC error) also fails at f86749de5, before this work. `session-overlay-pause` passes at HEAD. No blockers or majors across the whole fix.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 4 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor (latent) | A repeat registration of a settled block resets it to pending for 250 ms | open: no caller repeats today. Fix: re-window only while still pending |
| 2 | minor (latent) | The collider map would hand back a destroyed collider | open: nothing destroys chair colliders. Fix: treat `!existing.world` as missing |
| 3 | minor (docs) | `object-physics.js:29-31` comment claims rooms.js registers chairs twice; it doesn't | open |
| 4 | minor (pre-existing) | Side-door bars added to a loaded room never get chair colliders | open: outside this fix |

Stopped at round 5. Live checks never covered a real hostile-NPC chase through a N/S doorway (path-level only).


## Harness gaps (commits a73819578, 306f8241c, cb48719c5, 275051e17, 3ed8fd83f)

### Round 1

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 5 |
| Minor | 11 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| M1 | major | Bootstrap can close the briefing unplayed in the typewriter gap | fixed in 306f8241c; the typewriter gap itself not hit live |
| M2 | major | `briefingPending` reports `settled:true`; m01 trace and three shot/tour scripts still assume auto-briefing | fixed in 306f8241c |
| M3 | major | `converse` stopped at a choice returns `ok:true` with the world locked | fixed in 306f8241c |
| M4 | major | Any overlay counts as an effect, even one not caused by the click | fixed in 306f8241c; stray-overlay case not provoked live |
| M5 | major | Door handler not recorded, so a neighbouring door's lock minigame passes as `ok:true` | fixed in 306f8241c; wrong-door case not provoked live |
| m6 | minor | `converse close:true` at a stop reads as finished | fixed in 306f8241c |
| m7 | minor | Dialogue opening on a choice gives a contradictory reply | fixed in 306f8241c |
| m8 | minor | `openInventoryItem` substring matching picks the first of several silently | fixed in 306f8241c |
| m9 | minor | Tray clicks aren't hit-tested | fixed in 306f8241c, scoped to `openInventoryItem` (shared `clickElement` left alone) |
| m10 | minor | `openInventoryItem` never checks the engine target | fixed in 306f8241c |
| m11 | minor | CyberChef: bad recipe passes, stale output, long input, non-player routes unmarked, popup visibility | fixed in 306f8241c |
| m12 | minor | Docs: "unpadded works" is wrong for base64 with `+` | fixed in 306f8241c |
| m13 | minor | Shell start-up limit shorter than the harness's | fixed in 306f8241c |
| m14 | minor | Session-runner header missing the new commands | fixed in 306f8241c |
| m15 | minor | "report" filename rule stated more firmly than probed | fixed in 306f8241c |
| m16 | minor | Mismatch docs don't match the code | fixed in 306f8241c |

### Round 2

Round 1 majors confirmed closed live: M1 (no typewriter gap in keyless mode; five races left the briefing open), M2 (one consumer missed, #7), M3, M4 and M5 (mostly; see #1, #2, #4). All minors closed.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 8 (plus 4 notes, #9–12) |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor | A known-class overlay that the click didn't cause still passes (proved live with a timed `gameDisplay`) | fixed in cb48719c5 (overlay must come within 150 ms of the handler) |
| 2 | minor | `targetUnverified` only set when a minigame opened | fixed in cb48719c5 |
| 3 | minor | Real note reads as `unrelated-overlay` if the centre hits the backdrop | fixed in cb48719c5 |
| 4 | minor | Approach path drops the first click's record, so a wrong-door click reads as out of range | fixed in cb48719c5; checked live with an injected door call, not a real wrong click |
| 5 | minor | `enter` hints at the wrong door's lock | fixed in cb48719c5; branch checked with a forged mismatch only |
| 6 | minor | Door records have a null name | fixed in cb48719c5 |
| 7 | minor | `tour.py` bootstrap consumer missed by M2 | fixed in cb48719c5, plus 38 bootstrap lines in `tools/playtest/se/*.jsonl`; SE suite not run |
| 8 | minor | Stale `ok:true, mismatch` example in the skill | fixed in cb48719c5 |
| 9 | minor | `autoBrief` never closes an ended dialogue that stays open (note) | fixed in cb48719c5; close branch not hit live |
| 10 | minor | `closed-at-choice` has no hint (note) | fixed in cb48719c5 |
| 11 | minor | Async `eval` rejection crashes the session (note) | fixed in cb48719c5 |
| 12 | minor | Tray hit test misfires off-viewport (note) | fixed in cb48719c5 |

### Round 3

All twelve round 2 findings confirmed closed. The 150 ms overlay window mislabels nothing today: every `gameDisplay`/`gameConfirm` call is synchronous inside a handler, and timers are correctly rejected. A fresh session starts and `window.__test` is present. SE suite subset 6/6. Unit tests at HEAD: 2976 of 2977 (the flaky pre-existing `event-mapping-unlock-door`).

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 5 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor | Async handler end time stamped when the promise is created, not when it settles (latent: only doors are async, and they raise no overlay) | fixed in 275051e17 (stamped on settle; checked live) |
| 2 | minor | `approach-click-acted` fires for an unrelated minigame with no record | not closed: `unrelated-minigame` misfires on the target door's own lock (round 4 #1) |
| 3 | minor | `docs/test-bridge.md` and SKILL.md:393 contradict the code | fixed in 275051e17 |
| 4 | minor | Failed `eval` returns an `ok:true` envelope | fixed in 275051e17 (envelope `ok:false`; SE runs 2 and 3c pass) |
| 5 | minor | 17 draft bridge bootstrap lines in planning_notes lack `autoBrief` | fixed in 275051e17 |

### Round 4

Round 3 findings 1, 3, 4 and 5 confirmed closed; 2 not closed. Full SE suite: 22 of 25 first time; m5-channels passed on rerun (load flake). `bridge-3` and `p7-episode` fail because those bridges are out of date with engine commits dbcb43f56 and eb358d5d1, not the harness: open, outside this fix. The stray `feet0` reorder was a no-op and has been discarded.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 4 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | major | `unrelated-minigame` fires on the target door's own PIN lock: the bridge measures side-door range from a different anchor than the click path (live, `test_unlock_silence`) | fixed in 3ed8fd83f (door range from the centre, `keyDistance` for E; lock tied back to the target); both halves proved live in round 5 |
| 2 | minor | `then(stamp, stamp)` swallows handler rejections from `pageErrors` | fixed in 3ed8fd83f (`finally`, window capped at 1 s); rejection reaching `pageErrors` proved live in round 5 |
| 3 | minor | `enterRoom` turns `unrelated-minigame` into "door locked, solve it" | fixed in 3ed8fd83f; proved live in round 5 (precondition simulated) |
| 4 | minor | `unrelated-minigame` hint omits delayed pickup-then-open | fixed in 3ed8fd83f |
| 5 | minor | Docs overstate the scope of `unrelated-minigame` and the promise stamp | fixed in 3ed8fd83f |

### Round 5 (final)

All five round 4 findings confirmed closed, with live proof of every branch the fixer couldn't reach. At 3ed8fd83f: all bridge files parse, unit tests 278 of 278 files, SE suite subset 20 of 20. No blockers or majors across the harness fix.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 2 |

| # | Sev | Finding | Outcome |
|---|---|---|---|
| 1 | minor | Door `inRange:true` doesn't mean the E key works (E needs side doors within 64 of the lower anchor and the centre, N/S doors within 32); `brief` drops `keyDistance` | open. Fix: add `keyInRange`, or document the thresholds and say "use `interact`, not E, for doors" |
| 2 | minor | `docs/test-bridge.md:195-196` still says E/W door range uses the lower anchor | open: one-line docs fix |

Note (from before this work): `withConfirmation`'s no-effect reply for a door reports range 32 and a facing-offset distance; doors use 64, measured plainly. Open.

Stopped at round 5.

## Open, outside these fixes

- SE bridges `bridge-3` and `p7-episode` fail because they predate engine commits dbcb43f56 (close now asks for confirmation) and eb358d5d1 (no-blame line). They need updating.
- `timed_messages_example` has a one-way N/S link (demo only).
