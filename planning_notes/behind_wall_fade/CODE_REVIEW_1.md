# Behind-the-wall fade: code review 1 (slices 1 and 2)

Reviewed 2026-11-08 against DESIGN.md. Commits: 72adb6a2b, 9e09a2768, 650cd35b7, 197fe9f11, d08e4c813. Paths are relative to `public/break_escape/js/` unless they start with `test/`, `planning_notes/` or `scenarios/`. Line numbers are from the working tree (the module is unchanged since d08e4c813; lighting.js has another agent's uncommitted edits and is out of scope here).

`bin/test-js`: 422 files pass (run during this review, with the other agent's lighting.js work in the tree). The three touched suites (behind-wall-fade, npc-needs-slots, seating) pass on their own.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 12 |

Nothing found breaks the feature, regresses existing behaviour or leaves a spec decision unmet. I checked each decision in the code and against the proof screenshots. The minors are below. Item 1 needs a call from the user.

## Blockers

None.

## Majors

None.

## Minors

### 1. A closed N/S door hides the whole player, not just the legs (needs the user)

- **Evidence.** `proof/s2_5_reception_closed_door.png`: the camera is centred on the player at x = 48, and nothing of the character shows. The door sprite (32 x 64, depth `S.y + 64.45`, systems/doors.js:440-487) covers the strip's full height, and the character sprite (about 20 px wide, feet at about `S.y + 56`) sits entirely inside it. DESIGN.md §4 ("hides the player's legs") and §12 step 5 ("the player's legs hidden behind it") predicted otherwise.
- **Failure scenario.** The commonest way into the strip, walking down to a closed door from the north (DESIGN.md §2), is also the one place where the fade shows nothing of the player. The code is right: decision 9 (doors never fade) is met, and the view is the same as before the feature.
- **Fix.** Ask the user whether this is acceptable. If it is, correct the §4 sentence and the step 5 expectation so later reviewers don't report it. If not, the decision itself has to change, for example fading a closed door only while the player's body overlaps its column. That reverses part of decision 9 and brings back the black doorway cell the decision was meant to hide (§3 table).

### 2. `window.behindWallFade` publishes `clear` and `_forceK`; handover deviation 8 says it doesn't

- **Evidence.** systems/behind-wall-fade.js:370 returns `{ update, debugState, setEnabled, clear, lightWeights, _forceK }`, and :394 publishes that whole object. DESIGN.md §9 lists four members (`update, debugState, setEnabled, lightWeights`). HANDOVER.md deviation 8 says "`_forceK` ... is not on `window.behindWallFade`", which is wrong.
- **Failure scenario.** A console user, a test bridge helper or a future system calls `window.behindWallFade.clear()` while a strip is faded. `clear()` (:361-365) forgets every record and state without restoring anything, so S's sprites stay at half alpha and the hidden `walls` tiles stay invisible until the scene restarts. No record is left to release them. `_forceK('S', NaN)` from the console is harmless (the guard catches it), but it shouldn't be public.
- **Fix.** Publish `window.behindWallFade = { update: fade.update, debugState: fade.debugState, setEnabled: fade.setEnabled, lightWeights: fade.lightWeights }`, keep the shutdown hook on `fade.clear`, and leave `_forceK` only on the object `createBehindWallFade` returns. Correct deviation 8 in the handover.

### 3. A record's owner changes only when it is re-based

- **Evidence.** systems/behind-wall-fade.js:246-251 sets `rec.roomId = S` only inside the re-base branch. The release loop at :259-261 releases by `rec.roomId`.
- **Failure scenario.** Two south rooms S1 and S2 both have a state (the seam). A sprite listed in S2 and faded by S2 is re-listed under S1 (a needs `placeHeld` or `stowSprite` move between rooms) and still reaches S1's strip. If S1 comes first in `states`, S1 writes `base * k` but leaves `rec.roomId = S2`. S2's loop then finds a record for S2 that isn't in its list and releases it to `base`. The sprite draws at full alpha for that frame, and the next tick makes a fresh record under S1. It is a single-frame flash, and rare.
- **Fix.** Set `rec.roomId = S` on every write (move it out of the `if`).

### 4. `matchMedia` is queried every frame, idle included

- **Evidence.** systems/behind-wall-fade.js:289 calls `env.reducedMotion()` on every `update`, before it checks whether any state exists. `prefersReducedMotion` (:382-384) calls `window.matchMedia(...)` each time, which builds a new `MediaQueryList`. lighting.js reads it once at init (systems/lighting.js:365).
- **Failure scenario.** About 60 `MediaQueryList` allocations a second for the whole game, for a value that changes only when the OS setting changes. It costs little but it is pure waste on the per-frame path.
- **Fix.** In `installBehindWallFade`, create the `MediaQueryList` once and pass `reducedMotion: () => mql?.matches === true`. Also move the read inside the `states.size > 0` path.

### 5. The game.js hook has no guard

- **Evidence.** core/game.js:2508 `window.behindWallFade?.update(this.time.now);` sits in the middle of `update()`, unguarded. Lighting, the LOS view, `checkObjectInteractions` and the rest come after it.
- **Failure scenario.** An unexpected object in some room's `objects` throws inside `candidates` (for example a rotated object whose `getBounds` throws), and every frame from then on skips the rest of `update()`: lighting freezes and interactions stop. I found no input that throws today: `getTileAt`, `setAlpha` and the provider are all wrapped, and NaN rects are filtered by `sameValues`. The guard is cheap insurance.
- **Fix.** Wrap the body of `update(now)` in try/catch. On the first throw, log once, call `setEnabled(false)` (which restores), and keep the frame going.

### 6. Equal-depth layers would pick the wrong face

- **Evidence.** systems/behind-wall-fade.js:143-144 sorts layers by `depth` only. `Array.prototype.sort` is stable, so equal-depth layers keep creation order, and the earlier-created layer becomes the face. Phaser draws the later-added object on top at equal depth. core/rooms.js:2083-2084 gives every unnamed layer `roomWorldY + 0.4`.
- **Failure scenario.** A map with two "other" layers (say `room` and `decor`, both +0.4) and tiles from both in rows 0-1. The fade picks `room` as the face and hides `decor`, so the decor art disappears while faded. No shipped map does this today (all 148 have `walls`, `room`, `doors`, plus `props` in one, per DESIGN.md §1), so this is latent.
- **Fix.** Break ties by creation order, descending: sort `Object.values(room.layers).map((l, i) => [l, i])` by `(depth desc, i desc)`.

### 7. A state dropped because its room is gone leaves that room's records behind

- **Evidence.** systems/behind-wall-fade.js:293 `if (!room) { states.delete(id); continue; }` drops the state, but any record with `roomId === id` stays in `records` and is never released.
- **Failure scenario.** None today: `window.rooms` is replaced only at scene start (core/rooms.js:1013-1014), after the shutdown hook has cleared everything, and nothing deletes a room id (checked by grep). If a later change starts unloading rooms, those sprites keep `base * k` and `behindWallK` for good.
- **Fix.** On that branch, drop the room's records without writing (`for (const [s, r] of records) if (r.roomId === id) records.delete(s)`), or release the live ones (`release` already checks `sprite.scene`).

### 8. Unit tests that pass whatever the code does, and missing cases

- test/js/behind-wall-fade.test.mjs:426-444 ("setEnabled(false) restores everything even if one room throws") stubs `w2.S.getTileAt`, a room-level function the controller never calls. After `buildCells` it never calls any `getTileAt` again, so no throw happens. The per-room try/catch in `setEnabled` (behind-wall-fade.js:352) is untested. Fix: make one cached face's `alpha` setter throw (an `Object.defineProperty` setter on the Tile) and check that a second room's faces and sprites still restore.
- :297-324: the title promises the npc-carried case. The body sets `active = false` and deletes from `objects`, but never tests `_npcCarried`. DESIGN.md §12's "a member listed in N (ownership) is untouched" is also missing. Fix: add both.
- No test drives `installBehindWallFade` (behind-wall-fade.js:387-397): the `?behindWallFade=0` and `localStorage` kill switches, the shutdown registration, and the shape of `window.behindWallFade` (which would have caught minor 2). Fix: a test with a fake `window` (`location.search`, `localStorage`, `matchMedia`) and a fake `scene.events.once`.
- No controller test covers two south rooms with states at once (the `taken` set, minor 3), or "S loads while the player is in its strip" (DESIGN.md §7). Fix: add both. Add the latter as a room inserted into the `rooms` object between ticks.
- The static check (:465-472) uses whole-file `indexOf`. It would still pass if the call moved inside a conditional or into another function. Fix: slice out the `export function update()` body and assert the call is in it at top level.

### 9. Live proof: what the scripts check and what they don't

- planning_notes/behind_wall_fade/proof/s2_step2.mjs prints step 2's data but asserts nothing. DESIGN.md §13 says "Step 2 must pass before anything else counts", and no run log is committed, so the pass rests on the handover's word. Fix: turn the printed fields into `check()` calls (positions, door sprites active and closed, drawn tops, `fade_elevated.elevation === 32`, `_tableItems` holding `fade_desk_note`), and commit each script's console output next to the screenshots.
- proof/s2_live.mjs step 11 (the `fin` block) skips object keys matching `/ani/` without saying why, and never checks that `behindWallK` is gone from every sprite. Fix: say why the skip exists or drop it, and assert `!('behindWallK' in s)`.
- m04 (HANDOVER.md deviation 6; proof/s2_missions.mjs:11) put the player in battery_hall_1 with `player.setPosition` on a game opened with `unlock-all-rooms.rb`. §13 asked for another N/S pair, or m02's staff_room under dr_kim_office, and said not to set progress from the console. This hides no fade bug, because the controller reads only `window.rooms` and `player.body`, however they got there. It does test a state the real path rarely produces (S loaded with its north door closed), and `proof/s2_m04_engineering_workshop.png` doesn't show the player, so the slice 2 done criterion ("the player shows through the half-faded wall") is unmet for m04. The handover defers that to slice 4's strip light, which is reasonable. Fix: redo m04 in slice 4 as planned, or run the m02 staff_room pair now through doors.
- `--unlock-all` (deviation 2) only lets `loadRoom` fetch rooms the player hasn't reached. The fade doesn't depend on how a room got loaded, so it hides nothing.

### 10. The headless physics recipe: sound here, but other proofs may be affected

- **Evidence.** proof/lib.mjs:20 sets `g.loop.smoothStep = false; g.loop.minFps = 1; world.setFPS(20)` and keeps `fixedStep` on. With a fixed step, Arcade sub-steps a long frame in 50 ms steps, so the player moves 7.5 px a step (MOVEMENT_SPEED 150, utils/constants.js:39), or 11.25 px running. Both are within the separation allowance (`deltaAbs + OVERLAP_BIAS 4`) against the 8 px boxes (systems/collision.js:59-70), so walls hold. `fixedStep = false` uses the raw frame gap, which on a slow headless frame can exceed the box, so the tunnelling the implementer reports is plausible. The change lives only in the proof harness, and the fade's timing reads `scene.time.now` (core/game.js:2508), not physics, so it can't mask a fade-timing bug. Where the wall stops the feet doesn't depend on step size (separation pushes back to the box edge), so detection sees the same feet y as at 60 Hz. I couldn't reproduce either claim without starting a server.
- **Failure scenario (outside this feature).** The recipe in the auto-memory note "headless-physics-throttle" and docs/achitechture/HANDOVER_NPC_AVOIDANCE.md:211 uses `fixedStep = false`, and it appears in recent playtest sessions (tools/playtest/lab_physical_pentest-session*.jsonl, test_needs_sims-session.jsonl, test_npc_avoidance-session.jsonl). If the tunnelling claim holds, those runs could have walked the player or NPCs through walls without anyone noticing.
- **Fix.** Ask the user before changing the shared docs and memory. Then switch the recipe to `setFPS(20)` with `fixedStep` left on, and spot-check one of the earlier proofs.

### 11. Tidying and per-frame cost while in a strip

- `weightPool` (behind-wall-fade.js:134) is unused. `justBuilt` (:308-311) isn't in the state literal at :287, so it reads `undefined` on the first tick. That works, but it isn't obvious.
- While a strip is faded, each frame allocates: a `Set` and an array per room (:208, :221), a rect object per object (:225), `[...records]` per room (:259), and a `calculateDoorPositionsForRoom` call through the provider (:88, systems/door-gaps.js:11-18, no logging). `ownedElsewhere` (:224) runs before the cheap rect test for every object whose `roomId` names another room. At tens of objects a room this is fine, and idle costs only one rect test per loaded room. If profiling ever shows it, iterate `records` directly in the release loop and do the rect test before the ownership check.
- The strip cache from DESIGN.md §2 was dropped (deviation 7). That is sound: `backWallStrip` is four additions.

### 12. The reopen check's 4 problems weren't compared with the parent commit

- **Evidence.** HANDOVER.md "State": `reopencheck prints "Total problems: 4" ... not investigated`. DESIGN.md §13 makes a passing reopen check part of slice 2's done criteria.
- **Failure scenario.** Nothing in these commits touches ink, so the four are almost certainly pre-existing, but nobody has confirmed it.
- **Fix.** Run `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json` on a worktree at 72adb6a2b~1 and note that the count matches.

## Deviations in HANDOVER.md

| # | Deviation | Verdict |
|---|---|---|
| 1 | Headless physics with `setFPS(20)` | Sound, harness only (minor 10). |
| 2 | `--unlock-all` for `loadRoom` | Sound; hides nothing (minor 9). |
| 3 | Popups closed by key presses | Sound. |
| 4 | Step 6 at x = 96 | Sound: body centre 48 px from the closed door, outside the 25 px suppression reach. |
| 5 | Step 9 walk 4.5 s | Sound; the script still checks that the run stays within `48 ± 25`, so an invalid run fails. |
| 6 | m04 by `setPosition` and unlock-all | Departs from §13; hides no fade bug; the visual check is unmet until slice 4 (minor 9). |
| 7 | No strip cache | Sound. |
| 8 | `_forceK` not on window | Wrong: it is (minor 2). |
| 9 | Non-finite k drops and restores, then restarts at 1 | Sound, and it matches the spec's intent: nothing non-finite is ever written, because the check at :296 and :303 runs before any face or sprite write. |

## Verified correct

- **Detection** (behind-wall-fade.js:76-94): the strip is `[S.y, S.y + 64)` from S alone, the body's x-range overlap is used rather than its centre, there is a 4 px top margin, and the strip is open at the bottom. Feet come from `body.y + body.height`, as updatePlayerRoom uses. Every room cell in row 1 of the 148 maps has a `walls` tile (script over `assets/rooms/*.json`: 0 cells without one), so a player can't reach S's own strip from S's floor except through a doorway.
- **Doorway rule** (:47-65): this is interaction-walls' `doorClosed` with an x match. It covers an opener destroyed but still listed (inactive, `open`), a far sprite spliced out, gate doors, and a different door's x. It counts only `direction === 'north'`, and a throwing provider is ignored. door-gaps.js:9-22 builds one closure and registers it with both consumers. game.js imports door-gaps.js at :10, and both import `behind-wall-fade.js` by the same URL, so they share one module instance. Live step 9 confirms suppression.
- **Ownership** (:192-197, :222-238): iteration goes through `rooms[S].objects` by value, with `roomId` used only as a tie-break when another room also lists the sprite. North-room items in the strip are never candidates; live step 4 shows `north_card` at 1.
- **Drawn rect** (:107-119): it uses origin and display size, `getBounds()` only when rotated, and the `top < bottom - 0.5` boundary. It ignores elevation. All eight worked cases are unit-tested, and live step 6 confirms them on the real sprites.
- **Table followers**: core/rooms.js:2542 records `_tableItems` in the final group pass. Membership is re-checked every tick (listed in S, usable, not owned elsewhere, on the table by overlap or the 4 px back edge), and only a primary table's members follow. Live step 6 shows `fade_desk_note` at 0.5.
- **Companions**: npc-needs.js:3345-3346 and :3782 add and remove them; filtered by `scene`, `active` and `visible`.
- **Exclusions**: `_isNPC`, `_npcCarried` (cleared again on put-down, npc-needs.js:3303, 3655, 3683), `doorProperties` and the player. `doorSprites` are only read. Live step 5 shows both door sprites at alpha 1 with no `behindWallK`, and live step 6 shows the NPC unchanged.
- **Tiles** (:142-172): the face is the top non-null tile by depth, the tiles beneath it are hidden at the start of a fade and shown again at the end, and null doorway cells are skipped. Faces are written only while k moves or on the first tick. Restore is wrapped per cell. Tile alpha is independent of revealRoom's layer alpha. No engine code reads `tile.visible` or `tile.alpha` (grep).
- **k** (:271-313): dt comes from `scene.time.now` and is clamped to `[0, 250]`, and it is 0 on the first call, on a backwards step or on a non-finite `now`. It steps down over 150 ms and up over 200 ms, and lands exactly on 0.5 and 1. Reduced motion jumps straight to the target. The state is dropped at k = 1 with target 1.
- **Base and applied alpha** (:175-181, :242-262): another writer is detected and re-based each tick. On release, the base is written back only if nobody else has written since, and destroyed sprites are dropped without a write. Every other room-object alpha writer runs before the hook: revealRoom and showRevealedObject (core/rooms.js:3053, 3109), the `tint_objects` tween (systems/apply-actions.js:318-325, explicit `from`, so the faded value is never captured), and needs moves. Nothing after the hook writes an object's alpha (grep over systems/ and core/).
- **Release on pickup, stow, unlist, push-out and destroy**: unit-tested, and the real paths match (inventory hides and deactivates, `stowSprite` hides and re-lists, room-state-sync deletes from `objects`).
- **Shutdown and restart**: `scene.events.once('shutdown', clear)` touches no display object, and `create` installs a fresh controller. `setEnabled(false)` restores records, then tiles room by room.
- **Hooks**: game.js:2508 sits after `scenarioTimerDispatcher.update` and before lighting, passes only `this.time.now`, and does nothing when the controller is missing. seating.js:842 copies the chair's alpha on `postupdate`, after the fade. npc-needs and rooms.js add one line each and no imports. No test harness copies any of the touched modules beyond the seating stub fixed in 650cd35b7.
- **Kill switch**: `proof/s2_12_killswitch.png` is taken from the same camera position as `s2_4_hall_from_office.png`. In it the player is hidden by the opaque hall wall, while in s2_4 they show through the faded wall.
