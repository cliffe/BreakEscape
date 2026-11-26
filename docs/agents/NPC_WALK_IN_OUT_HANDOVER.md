# NPC walk-in / walk-out: handover (stage A, 2026-11-25)

Stage A agent stopped at the context limit before writing any code. This note has everything it read, so the next agent can start building at once. Read the plan (`docs/agents/NPC_WALK_IN_OUT_PLAN.md`, sections 2-7 and the new section 13) and this note. You do not need to re-read the code listed under "Findings" unless a line number has moved.

## Done
- Plan section 13 records the orchestrator's decisions and the scope change (ca12 dropped; the file list is updated).
- Code read and design settled (below). No engine, test or scenario file has been changed.

## Open (all of stage A)
1. `public/break_escape/js/systems/npc-walk.js` (new).
2. `npc-behavior.js`, `npc-manager.js`, `doors.js` (`openDoorForNpc`), `interactions.js` (a one-line "no talk while walking out" guard), `core/game.js` (a dynamic import that installs the walk module).
3. Validator, schema, `validate_office_life.rb`, `owner_claim.rb` plus its test.
4. The five `test/js/npc-walk-*.test.mjs` files.
5. `scenarios/test_npc_walk_in_out/`.
6. The m09 Dillard, m10 `monitor_guard` and m10 `farah_guard` conversions.
7. The test, validator and mapping-drift runs, then `docs/agents/NPC_WALK_IN_OUT_PROOF_SCRIPT.md`.

## Design settled (follow this)

**No static import of npc-walk.js, so no harness copy lists change.** About 15 harnesses copy `npc-behavior.js` and about 50 copy `npc-manager.js` with hand-rewritten import lists. Avoid all of that:
- `npc-walk.js` exports `installNpcWalk(manager, env?)` plus pure helpers (`rectInView`, `npcRectAt`, the spawn BFS). Its only import is `TILE_SIZE`/`PATHFINDING_STEP` from `../utils/constants.js`, which has no imports, so node tests can import it straight from the repo.
- `core/game.js:2083-2085` already loads `npc-behavior.js` with a dynamic import. Straight after `new module.NPCBehaviorManager(...)`, add `import('../systems/npc-walk.js').then(m => m.installNpcWalk(window.npcBehaviorManager))`.
- The installer adds `manager.walkNPCIn(id, opts)`, `walkNPCOut(id, opts)`, `isWalkingOut(id)`, a `walks` Map and `manager._walkTick(time, playerPos)`. In `NPCBehaviorManager.update` (`npc-behavior.js:295-328`), call `this._walkTick?.(time, playerPos)` after the behaviour loop.
- `npc-manager.js` calls `window.npcBehaviorManager.walkNPCIn?.(...)`. If that is missing, fall back to `setNPCVisible`.

**Behaviour hooks in `npc-behavior.js` (generic, no walk import):**
- `goToAndStay` (`:3479`): store `opts.onArrive` as `this._moveOnArrive`, `opts.arrivalData` as `this._moveArrivalData` and `!!opts.silentArrival` as `this._moveSilent`. Clear all three in `cancelMove` (`:3562`).
- `_triggerGoToStayArrival` (`:3592`): take those three and clear them. Emit `npc_arrived` unless the move is silent, spreading `arrivalData` into the payload. Then call `onArrive(arrivedPos)`.
- `updateCurrentRoom` (`:1018-1041`): also set `npcData.roomId` while `this._walk` is set, as route walkers already do.
- `wantsToCrossGate` (`:2625`): return true when `this._walk` is set and the gate's two rooms are the walk's current room and its far room. `turnBackFromGate`: return false for a walker, who waits and falls back on `timeoutMs`.
- Wall colliders: generalise `_ensureRouteWallColliders` (`:2468`) into `_ensureWallCollidersFor(roomIds)`, which uses the same `_routeWallRooms` set (made in the constructor at `:541`), and call it for the far room before the NPC is placed there.
- Gate approach (`_approachRouteGate`) for walks: not needed for the orchestrator's cases. Leave it out and say so in the plan.

**Mapping plumbing in `npc-manager.js`:**
- Add `walkIn: mapping.walkIn ?? undefined, walkOut: mapping.walkOut ?? undefined` beside `setVisible` at `:1537`.
- Handle them beside `setVisible` at `:1982`.
- Deferral for `walkIn`: the speech tail runs from `:2073` (`_openMappingConversation`) to `:2130` (bark, or knot bark). Wrap that tail in a closure. When `config.walkIn` started a walk that was not instant, run the closure on the walk promise's `.then` and return; otherwise run it now. `currentKnot` (`:2013`) still applies at once.
- `walkOut`: start the walk at the handler, and let the bark run as usual.
- `recordNpcVisibility(npcId, visible, { persistOnly } = {})` (`:2593`): with `persistOnly`, set the map entry only and leave `entry.isVisible` alone.

**Walk flow (in npc-walk.js):**
- Walk-in:
  - If the NPC's room is not loaded or it has no sprite: call `setNPCVisible(true)`, emit `npc_arrived` with `how: 'instant'` and resolve.
  - If the NPC is already visible and not leaving: no-op (resolve `'already'`, no event).
  - If the NPC is walking out: cancel that walk and walk back to `to`.
  - Otherwise: record visible at the trigger, choose the spawn (loading the far room if needed, waiting up to 3 s), then call `manager.setNPCVisible(id, true)`. In the same tick, place the body at the spawn and call `goToAndStay(toX, toY, speed, { owner: 'walk', arrivalData: { walk: 'in', how }, onArrive })`.
- Walk-out:
  - If the NPC is hidden: no-op.
  - Otherwise: record hidden with `persistOnly` and `window.stateSync?.requestSoon?.()`. A hostile, conscious NPC fades out in place. Otherwise choose the exit (loading the far room if it is unlocked) and call `goToAndStay(..., { owner: 'walk', silentArrival: true, onArrive })`.
  - The tick ends the walk early once the NPC is in the far room and out of view. At the end: fade if still in view, then `setNPCVisible(false)`, move the hidden sprite to its scenario `position` in its home room (body off), reset `behavior.roomId`, `npcData.roomId` and `homePosition`, and emit `npc_left:<id>` `{ npcId, to, how }`.
- Placing a body: enable the body, call `sprite.body.reset(sprite.x, sprite.y)`, take `dx = sprite.x - body.center.x` (and the same for y), then `body.reset(x + dx, y + dy)`.
- A tile converts to world as `room.position + tile * 32` (`npc-manager.js:1948-1952`).
- Fade: tween `sprite.alpha` over 400 ms with `scene.tweens`. When a fade-in ends, set alpha to 1, because `npc-sprite-style.js:133-135` adopts any outside alpha as its base.
- In view: the sprite rectangle (feet up to the frame height) overlaps `scene.cameras.main.worldView`, grown by 32 px. No camera means out of view.

**Doors and spawn search:**
- Each loaded room has `window.rooms[id].doorSprites[]` with `doorProperties { roomId, connectedRoom, direction, worldX, worldY, locked, isSideDoor, gateKey }`.
- Look for the door in the NPC's room or in the far room. An opened door's sprite is destroyed but keeps its props.
- Gates: `window.doorGates.isGate(sprite)`; the openFor list is in `doorGates.groups.get(sprite.doorProperties.gateKey).cfg.openFor`.
- Search the grid: `pathfindingManager.worldGrid[cy][cx] === 0` is walkable; `worldGridBounds { minX, minY, cols, rows, step = 8 }`; room extents are in `pathfindingManager.roomBounds` (Map of `worldX`, `worldY`, `mapWidth`, `mapHeight` in tiles).
- Breadth-first search from the snapped door mouth (`findNearestWalkableWorldCell`) into the far room's bounds only, and take the first cell that is out of view. That cell is connected to the door by construction. If no cell qualifies, use the doorway fade.
- Unlocked doors are walkable on the grid from creation (`doors.js:613-622`).

**[check] resolved: closed doors do not block NPCs.** No NPC-to-door physics collider exists. The only NPC-facing door code is `npc-sprites.js:816-827`, a rect list for the player-pass logic. So `openDoorForNpc` is visual and grid only.
- Build `openDoorForNpc(doorSprite, npcId)` as an `opts` path through `openDoor` (`doors.js:836`): `openDoor(sprite, { byNpc })`.
- Do not load the far room on that path (the walk has loaded it already).
- Do not emit `door_opened`: scenario mappings listen for it as a player action. Emit `door_opened_by_npc` instead.
- Export it and set `window.openDoorForNpc`.

**No talk while walking out:** in `systems/interactions.js:939`, before the hostile check, add `if (window.npcBehaviorManager?.isWalkingOut?.(sprite.npcId)) return;`.

**Readers of `isHiddenByMapping`** (`scenario-music-events.js:183`, `player-damage-interrupt.js:117`, `npc-hostile.js:294`, `npc-manager.js:1353`): each treats a walker going out as already gone. That is acceptable, because a hostile NPC fades in place anyway.

## Scenario facts
- **m09** `archive_guard` (`scenario.json.erb:1502` position (3.5, 8); mappings at `:1520-1535`):
  - Mapping 0: replace `setVisible: true` with `"walkIn": { "from": "loading_dock" }`.
  - `open_stacks` connects S `loading_dock`, W `reading_room` and E `server_closet` (`:1403`). `loading_dock` has no lock (`:922-930`).
  - Mapping 1 (catch-up) stays unchanged.
- **m10** `monitor_guard` (`:4178`, position (3, 4.5)):
  - Mapping at `:4193`: replace `"setVisible": false, "delayMs": 3500` with `"walkOut": { "to": "server_hall" }, "delayMs": 1500`.
  - The bark comes from monitor_guard, not farah.
- **m10** `farah_guard` (`:4199`, position (5, 4.5)) is the second NPC who vanishes on gallery entry:
  - `:4214`: `room_entered:gallery`, `talked_round`, `setVisible: false`, no delay.
  - Story: Farah "went home" once Imran is talked round, and the monitor guard asks "Where's Farah?" So she should be gone before the player arrives.
  - Proposal: change `:4214` in place to `"walkOut": { "to": "server_hall" }` (a no-op if she is already hidden), and APPEND a mapping `{ "eventPattern": "global_variable_changed:imran_outcome", "condition": "value === 'talked_round'", "onceOnly": true, "walkOut": { "to": "server_hall" } }` so she leaves out of sight when Imran is talked round (instant if the gallery is not loaded).
  - Then run `ruby tools/check_mapping_index_drift.rb main`.
  - The `after_end_json.('gallery')` partial is mapping 0 on both guards, so count indices from there.
- Do not touch ca12, `office_kits/merrin_sallow.json`, the defend twin, `test_ca12_fallback`, `door-gates.js`, `lighting.js`, `state-sync.js` or server controllers.

## Validator
- `scripts/validate_scenario.rb:3965-3975`: add the walk checks after the `patrolOverride` block.
- `scripts/scenario-schema.json:5175`: add `walkIn` and `walkOut` beside `patrolOverride`.
- `validate_office_life.rb:301`: hint `'walks'` when a mapping has `walkIn` or `walkOut`.
- `lib/break_escape/owner_claim.rb:140`: add `m['walkIn'] || m['walkOut']`.
- Pop check: run it over every scenario first. If it flags only the known cases, it is a WARN; otherwise it is INFO. It must never turn the train RED.

## Commits
- `78f5f5b5c`: plan (previous agent).
- The handover commit: this note and the plan decisions (hash in `git log`).

## Gotchas
- The scene's live `rooms` object is `window.rooms`, and `window.loadRoom` returns a promise. `waitForRoomReady` (`systems/room-ready.js`) waits for a room to finish building.
- A hidden NPC's `update` never runs (`npc-behavior.js:951`), so the walk tick must live in the manager.
- A `goToAndStay` issued by needs or a script mid-walk replaces `_moveOnArrive`. The walk then sees no arrival and must end on its timeout fallback.
- Ports 3026 and 3027 only. Never run `db:` tasks.

## B2 status (data-side checks, done)
- `scripts/validate_scenario.rb`: `check_npc_walk` (shape, unknown keys, speed/timeoutMs, both-in-one, phone NPC, setVisible/patrolOverride clash, far room exists and is connected, gate `openFor` lacks the NPC = ERROR, locked non-gate = WARN, tiles outside the room's tilemap = ERROR, `walkIn.to` differs from `position` = WARN) and `check_npc_pop`, both wired into the common-issues run. Not checked: a tile "on a wall" (no wall data in the validator).
- Pop check level: INFO (`POP_CHECK_LEVEL = :info`). Over all 205 scenarios it hits 95 NPCs, 91 outside the known four (m09 `archive_guard`, m10 `monitor_guard`, `farah_guard`, ca12 `kit_camila_ospina`); m10 alone has 63. To go WARN later, narrow the heuristic or clear the audit list, then set `:warn`. It never produces a red error.
- Validator before/after over every scenario (`--no-graph --no-lint --skip-ink --no-known-failures`): 20 error lines, 1787 warning lines both times, per-scenario counts identical.
- `scenario-schema.json` (`walkIn`, `walkOut` beside `setPatrolSpeed`), `validate_office_life.rb` (`walks` hint), `owner_claim.rb` (`scripted_move` for walkIn/walkOut) plus two cases in `test/unit/owner_claim_test.rb`, `test/js/npc-walk-validator.test.mjs` (16 tests).
- Not done here (other stages): scenario conversions, README_scenario_design.md, IDEAS_BACKLOG audit list (the 91 NPCs; list is reproducible by running the validator and grepping "pop check").
- Run Rails tests from a worktree with `BUNDLE_PATH=<main checkout>/vendor/bundle`.

## B1 status (2026-11-25)
Done (commits 1fe72e3c3, b5dfe683e, plus this note):
- `systems/npc-walk.js`: `installNpcWalk(manager, env?)` adds `walkNPCIn(id, opts)`, `walkNPCOut(id, opts)` (promises of `how`: walked | faded | instant | already | noop | cancelled; settled-at-call promises carry `.immediate`), `isWalkingOut(id)`, `walks` Map, `_walkTick`. Pure helpers exported: `rectInView`, `npcRectAt`, `bfsOutOfView`, `doorsOfRoom`, `doorUsable`, `inRoomBounds`, `roomAt`, `placeBody`.
- Events: walk-in ends with `npc_arrived:<id>` `{ owner: 'walk', walk: 'in', how }`; walk-out ends with `npc_left:<id>` `{ npcId, to, how }`; NPC-opened doors emit `door_opened_by_npc` `{ roomId, connectedRoom, direction, npcId }`.
- Hooks: `core/game.js` dynamic import; `npc-behavior.js` (`_walkTick` in update, goToAndStay `onArrive`/`arrivalData`/`silentArrival`, `updateCurrentRoom` while `_walk`, `wantsToCrossGate`/`turnBackFromGate` for walkers, `_ensureWallCollidersFor`); `npc-manager.js` (fields, handler, speech deferral, `recordNpcVisibility(..., { persistOnly })`); `doors.js` `openDoorForNpc(sprite, npcId)` (+ `window.openDoorForNpc`); `interactions.js` guard; test bridge `window.__test.npcWalk.in/out/state`.
- Tests: four `test/js/npc-walk-*.test.mjs` (40 tests), all pass; 174 of 175 related files pass.

Open:
- `validator-office-life-events.test.mjs` fails: the new engine literal `npc_left` must be added to an event list in `scripts/validate_office_life.rb` (around line 66, beside `npc_arrived`). That file belongs to the validator agent.
- Deviations from the plan: walk-in timeout with `to` in view fades in at `to` (not at the inner doorway mouth); doors are scored by straight-line distance, not path length; the spawn cell is not path-checked to `to` (BFS connectivity only); `_approachRouteGate` for walks left out as the handover says.
- No live browser proof yet (scenario `test_npc_walk_in_out` and m09/m10 conversions are later stages). m10 `farah_guard`: in-place `walkOut` only, no appended mapping (plan section 13).

## B3 status (2026-11-25)
Done (commits e08489a67, 439b5b5aa, plus the proof-script commit):
- Door-pass hook for CA0: `setNpcDoorPassHook(fn)` exported from `npc-walk.js`, also `window.npcWalk.setDoorPassHook`. Asked (via `askDoorPassHook`) only when `doorUsable` says no, in both `chooseSpawn` and `chooseExit`, with `{ roomId, connectedRoom, direction, npcId }`. true / promise of true: the far room is loaded, then `openDoorForNpc(sprite, id, { passedByHook: true })` (doors.js now opens a locked door on that flag; a gate still returns false there, so CA0's door-gates side must open the gate). Throw, reject, non-true or no answer in `DOOR_PASS_HOOK_TIMEOUT_MS` (2000) = false. One hook; a second replaces it with console.warn; null clears. Never cached. Env override `hookTimeoutMs` for tests.
- Shared test world moved to `test/js/helpers/npc-walk-world.mjs` (not a test file); `npc-walk-gate.test.mjs` 21 tests (13 new); door/npc/walk suites 107/107 files pass.
- `scenarios/test_npc_walk_in_out/`: validator 0 errors, 8 warnings (porter's two mappings on one event, intended; no talk portraits; locked vault walkIn, intended). Not in Hacktivity fixtures.
- `docs/agents/NPC_WALK_IN_OUT_PROOF_SCRIPT.md`.

Open:
- The scenario has no mission row yet, so no live run: `new-game.sh` needs it (seeds), which needs AC0's yes.
- Case (b) is "open doorway, room loaded" (player visits the store first): an unloaded room always sits behind a closed door, so the unloaded route is case (c).
- Same-room offscreen (a) needs a viewport smaller than the 20x10 ward (proof uses 800x600); NPC tile positions in `room_m10_hall` were chosen from its collision layer, not checked live.

## Live-failure fix pass (branch fix/npc-walk-live), handover at ~150k tokens

### Causes found
- m09 stall: walk-in through a CLOSED door. open_stacks south door (48,288, open:false, unlocked) blocks the path grid until opened, and the walker sat at the far-room door mouth (82,358) more than DOOR_OPEN_PX (48) away, so the tick never opened it. Console: "[archive_guard] No path found to waypoint, will retry in 2s" every 2 s, then the 20 s timeout fade. Engine bug, not the m09 layout. Reproduced live on :3026 (game 13502) via `__test.npcWalk.in('archive_guard', {from:'loading_dock'})`.
- m10 fade in view: fadeOutAndEnd faded in view at the exit cell and reported w.how. Fix: onOutArrive/replanOut.
- Walk-ins stop ~1 tile short: npc-behavior.js:1429-1450 stops at 1 tile unless arriveWithin is set. Fix: arriveWithin WALK_ARRIVE_PX (10) in inGoOpts.
- Bridge bug: `window.__test.walk` clobbered bridge.walk(direction, ms). Renamed to `npcWalk` (test-bridge/index.js ~2318), docs updated.
- makeEnv scene fallback now also tries pathfindingManager.scene and game.scene.manager.scenes[0] (manager.scene is always set in NPCBehaviorManager's constructor).

### Done (uncommitted at time of writing; see commit below)
npc-walk.js: goTo() (approach closed door, open, then move), replanOut/onOutArrive, onStall (3 s: re-issue, next door out of view, then onTimeout fade), chooseSpawn/chooseExit exclude/ignoreTo options, constants WALK_STALL_MS/WALK_MAX_REPLANS/WALK_ARRIVE_PX. Closed = `props.open === false` (stub doors with open undefined behave as before).

### Not done
1. Unit tests: none added yet. Needed: closed-door walk-in does leg 1 to approach then opens (openDoorForNpc) then final move; walk-out arrival in view re-plans (moves.length grows, how stays 'walked'), none reachable -> 'faded'; stall (advance clock >3 s, tick) re-plans/falls back; walk-in goToAndStay opts carry arriveWithin 10. Run `node --test test/js/npc-walk-*.test.mjs` ONE FILE AT A TIME: running all at once showed "Unable to deserialize cloned data" on gate/in-out/mappings (runner isolation, not yet confirmed as unrelated; check by running each file alone, and on git stash-free HEAD~ via worktree if needed). Then bin/test-js for door/NPC/walk suites.
2. m09 conversation on arrival: mapping keeps conversationMode person-chat + targetKnot start; npc-manager.js:2159 defers `speak()` to walk-in resolve, so it should open. Live run (game 13502) showed a PersonChatMinigame opening after the faded arrival, so it does fire; the earlier proof's "no chat" needs re-checking after the fix. Dillard's behaviour only exists once open_stacks is loaded; with the player elsewhere and the room never visited, walkNPCIn takes the 'instant' path.
3. Live proof table not run: m09 (real trigger is Tran's sight challenge in server_closet, door locked; a hand emit of player_spotted:jesse_tran opened Tran's chat but did not set tran_alerted; the Auto mode classifier denied hand-setting a global, so use `__test.npcWalk.in` or ask the user), m10 run A/B (start game with --set flag2_submitted=true flag3_submitted=true gallery_shutter_cut=true gallery_camera_blinded=true, run A also imran_outcome=talked_round; m01_maya_ko style imports need --imports=<file>), cases a-f on test_npc_walk_in_out (id 281). Case c (courier, unloaded annex, 3 s 'choosing') still undiagnosed: check E.loadRoom/window.loadRoom for walk_annex and the ward east door's locked flag.
4. Case e porter fade in view should be fixed by replanOut; re-prove.
5. Proof script docs updated for npcWalk and the camera accessor (window.pathfindingManager.scene).
6. Not yet run: ruby tools/check_mapping_index_drift.rb main (no mapping changes made).

### Live setup left behind
Keyless server on :3026 (pid via tools/playtest/stop... `tools/playtest/stop-keyless-server.sh 3026`), session 13502 (`tools/playtest/session-stop.sh 13502`). Helper scripts in the scratchpad walkfix/: boot.sh GAME, c.sh, probe.js, dump.js, insp.js. Games 13499-13502 are mine (m09).

## Test and case c pass (branch fix/npc-walk-live)

- "Unable to deserialize cloned data" on npc-walk-gate/in-out/mappings is the `node --test` IPC bug the header of `bin/test-js` describes (emoji logs). Each file passes alone with plain `node <file>` (21, 18, 7 tests), so it is not a code failure. Use `bin/test-js` or `node <file>`, not `node --test`.
- New `test/js/npc-walk-recovery.test.mjs` (17 tests): closed-door approach (+ `door_opened_by_npc`, locked door untouched, undefined `open` unchanged), walk-out re-plan, 4 re-plans then `faded`, never back into the room left, stall (walk-out re-plan; walk-in re-issue, other door, `faded`), `arriveWithin` 10, bridge `npcWalk`/`walk(direction, ms)`, makeEnv scene fallbacks, refused load, slow load. World helper gained `closed`, `annex`, a `door_opened_by_npc` emitting stub and `clock`/`loadDock`.
- Case c cause: `GET /games/:id/room/walk_annex` answers 403 "Room not accessible" (`games_controller.rb:592`) for a room not in `unlockedRooms` (and not start, world or route room). Opening an unlocked door through the player unlocks it; a never-visited annex is not. `loadRoom` logs and resolves with no room, so the walk waited the full 3 s and doorway-faded. Checked live on :3026: 403 on a fresh game; on a game made with `--unlock walk_annex` the courier loads the annex, fires one `door_opened_by_npc`, walks in and reports `walked`.
- Fixes: `ensureLoaded` (`npc-walk.js:294`) stops waiting as soon as `loadRoom` settles without the room (no 3 s dead time on a refusal); case c now needs `new-game.sh 281 --unlock walk_annex` (brief and proof script updated).
- Open: a walk-in from a room the player never unlocked always doorway-fades (safe, but not a walk). Serving an unlocked, adjacent, never-visited room as a route room (served, not promoted, `record_npc_route_room!`) would let it walk; that is a server access change, so it is the owner's call. Real conversions (m09, m10) work only where the far room is already unlocked.
- Suites: walk, door and npc JS files, 124 of 124 pass under `bin/test-js`. No Ruby touched.

## Live-failure pass 2 (branch fix/npc-walk-live), handover at ~150k tokens

### Causes
- Case e (porter fade in view, 4 re-plans): two causes. (1) The driver's `__test.interact('walk_porter')` is a click; the game walks the player towards him, the camera follows and the exit cell comes into view. Check the no-chat rule with `window.handleObjectInteraction(<sprite>)` instead (no player movement). (2) Real engine bug: walk-out legs had no `arriveWithin`, so goToAndStay stopped 1 tile short of the exit cell. The BFS picks the nearest out-of-view cell, which sits on the view boundary, so the walker stopped in view and every re-plan repeated it. Fixed: `startOutLeg` passes `arriveWithin: WALK_ARRIVE_PX`.
- Case f (lobby doorway fade): geometry. The lobby is 320 px deep; an 800x600 camera centred on the ward shows all of it, so no out-of-view cell exists and the fade is the correct fallback. At 800x420 the walk works (live: 'walked', first visible out of view). Proof viewport changed to 800x420 (proof script).
- Case b (first run only, clerk visible in view): not reproduced in three reruns. Probable cause is the player/camera moving between the spawn search and the show. Added `recheckSpawn` (npc-walk.js, before `inGoOpts`): looks again just before beginIn, picks again twice, then fades in at the doorway. Unit test added.
- A deeper pick margin (WALK_PICK_DEPTH) was tried and removed: in the annex it left no out-of-view cell (courier faded), because the button position, hence the camera, varies per run.

### Commits
528b1e676 (arriveWithin on out legs, recheckSpawn, deep margin, tests, proof script), then a follow-up that removes the deep margin (see git log).

### Tests
bin/test-js test/js/npc-walk-*.test.mjs: 6 of 6 files pass (recovery now 19 tests, incl. out-leg arriveWithin and the spawn re-check). Door and npc suites not re-run since the change.

### Not done
- Re-run of a-f at the final commit: the run before removing the deep margin gave a, b, f walked with first visible out of view; c faded (margin, now removed), d faded (expected), e faded because the porter's out-of-view cells were gone at that player position (margin, now removed). Re-run needed.
- m10 A and B: driver fixed (walkproof4/drive.mjs: enterRoomClear closes the phone chat and retries on minigame-active). Not run yet. New game flags: see the m10 section of the proof script (`--set flag2_submitted=true flag3_submitted=true gallery_shutter_cut=true gallery_camera_blinded=true`, A also `imran_outcome=talked_round`).
- RESULTS.md at scratchpad walkproof4/RESULTS.md not written.
- bin/test-js on door and npc files; validator not needed (scenario unchanged).

### Live setup left behind
Keyless server on :3026 from this worktree (stop: tools/playtest/stop-keyless-server.sh 3026). Driver and analyser: scratchpad walkproof4/ (VH env var sets viewport height, default 420; `node drive.mjs c1|m09|m09t|m10a|m10b <gameId>`; `python3 analyse.py <folder>`). Games 13523-13530 plus later ones are mine; the port in drive.mjs is 3026.

## Live-failure pass 3 (branch fix/npc-walk-live, 3ba8a5f56)

### Root causes
- m10 stall and 20 s timeout: the player stands just inside the gallery (feet x 660, door x 624, door gap 24 px). Walk moves (owner 'walk') could not squeeze past the player: `_mayPassPlayer` (npc-behavior.js, about line 1929) allowed only owner 'needs'. The routed guard kept its line and the collider pushed the player back through the door at about 4 px/s (walkproof4 probe: player x 664 to 574 with the driver idle). The guards reached server_hall only once the camera had followed the shoved player in, so they timed out and faded in view. Fix: owner 'walk' may pass too (same 2.5 s wait as needs walks; hostile, KO'd and squeezePastPlayer:false still never pass).
- Case e (4 re-plans): exit cells were the nearest out-of-view cell, on the view edge. The leg stops up to WALK_ARRIVE_PX short and a few px of camera drift brings it back inside the margin, so each re-plan repeated it. Fix: walk-out exits prefer a cell WALK_PICK_DEPTH_PX (64) clear of the view edge, best effort (else the deepest out-of-view cell, never none): `bfsOutOfView` depthOf/preferDepth, `viewGap`.
- An unseen hide after re-plans ran out or a timeout reported 'faded'. fadeOutAndEnd now reports 'walked' when the walker is out of view and through its door (the tick's early-end rule); in view it still fades and reports 'faded'.
- Not a cause: m10 geometry. server_hall is x 0-640, zoom 1, view 800 wide; with the player at the gallery door the view starts at x 260, so server_hall x < 212 is out of view (engine margin). Exit cells [100,124] and [116,124]. No scenario change needed. Caveat: a wider window or a player who steps back into server_hall leaves no out-of-view cell; the fade fallback then applies.

### Design
Kept the plan-time pick with the tick's early end (hide the first moment the walker is through the door and out of view); the exit cell is only a cap. Deep picks apply to walk-out exits and re-plans only: deep walk-in spawns landed against the far wall and stuck (cases a and f, game 13562), so spawns keep the nearest cell plus recheckSpawn. API, how values and event payloads unchanged.

### Commits
b98f3ba76 (pass the player, deep exit picks, unseen end reports walked, tests), 6a665d1e3 (tests), 3ba8a5f56 (spawns back to nearest cell).

### Proof
Scratchpad walkproof5/RESULTS.md. m10 A and B pass; c1 a-e pass; f fails (below).

### Open
- Case f: walk_inspector spawned at (116,260) in walk_lobby, its body ended at (146,326) and never moved (stall x2, timeout, faded in at the target). Spawn code equals f72d751b2 (f passed there from (116,164)); the cell differed because the player stood elsewhere (x 334, y -67: the driver's moveTo before f may not have finished). Likely a BFS cell that is grid-walkable but whose body overlaps a wall or prop collider near the lobby's south wall, so physics ejects it out of the grid. Next step: log the spawn cell, the lobby bounds and walls; consider snapping spawns with findNearestWalkableWorldCell and a body-clearance check.
- Mapping drift check not run (scenario not changed).

## Live-failure pass 4: case f (branch fix/npc-walk-live)

### Cause (confirmed live, not the suspected collider overlap)
`placeBody` (npc-walk.js) moved every spawn by the body offset. Phaser 3.60 `body.reset(x, y)` puts the body at the sprite's top-left and ignores the body offset until the next physics step re-adds it (`updateFromGameObject`). `placeBody` measured the sprite-to-body gap from that stale body and never re-synced, so after one frame the body centre sat (+30, +66) from the requested cell (offset 30,66 from npc-sprites.js). Probe (walkproof6/probe.mjs, per-call trace of body.reset/updateFromGameObject): `reset(146,295)` left body (106,255), centre (116,260) as asked; the next `updateFromGameObject` made it (136,321), centre (146,326). A cell at y 260 therefore landed at y 326, past the lobby's south wall (wall boxes at y 312-320, grid blocked there): no path, stalls, 20 s timeout, fade in view. Spawns that happened to land inside the room (116,164 became 146,230) "worked", so the bug hid. No physics push, no collider overlap (the probe lists no body near the cell). `seating.js` placeBody already knew the quirk.

### Fixes (npc-walk.js)
- `placeBody`: `updateFromGameObject()` plus prev/prevFrame copy and `updateCenter()` after each reset, so the feet stay at the cell after the next step (as seating.js does).
- `bfsOutOfView`: new `clear` (cells; accept only cells whose neighbours within that many cells are walkable, i.e. the 20x10 body fits) and `skip(x, y)`. `chooseSpawn` tries `clear: 1` first, then any walkable cell, so the nearest-out-of-view preference stays.
- Stall fallback (`onStall`): after the first re-issue, a walk-in still out of view re-spawns at another out-of-view cell: another door first, else another cell behind the same door (at least `WALK_RESPAWN_GAP_PX` = 48 px from every cell already tried, `w.triedAt`). The fade is the last resort (`from` as a fixed tile cannot respawn). Before this, `onStall` only tried other doors, so a one-door room went straight to the timeout fade.

### Tests
test/js/npc-walk-view.test.mjs (placeBody on a Phaser-style body that models the reset/sync quirk; clear; skip), test/js/npc-walk-recovery.test.mjs (respawn at another cell, never repeats a cell, fixed tile fades; stall tests rewritten with `stallUntilSettled`). bin/test-js over `ls test/js | grep -E "npc|door|walk"`: 124 of 124 pass.

### Proof
Scratchpad walkproof6/RESULTS.md. Forced spawn at (116,260): body stays at (116,260), the walk completes as 'walked'.

### Open
- Case c (courier into the never-visited annex) walks or fades depending on where the player stands (camera): run 1 walked, run 2 doorway-faded (annex wholly in view). By design, unchanged.
- Mapping drift check not run (no scenario change).
- m10 A/B not re-run at this commit (driver stalled on a repeating phone chat; see walkproof6/RESULTS.md for the setup: `--start-room server_hall` plus the flags). They passed at 3ba8a5f56; this pass changed placeBody (all walk-in spawns), spawn picks and the stall fallback, not the walk-out code, so a re-run is still owed.
- Servers: :3026 stopped.
