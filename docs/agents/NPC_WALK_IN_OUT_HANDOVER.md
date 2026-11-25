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
- Hooks: `core/game.js` dynamic import; `npc-behavior.js` (`_walkTick` in update, goToAndStay `onArrive`/`arrivalData`/`silentArrival`, `updateCurrentRoom` while `_walk`, `wantsToCrossGate`/`turnBackFromGate` for walkers, `_ensureWallCollidersFor`); `npc-manager.js` (fields, handler, speech deferral, `recordNpcVisibility(..., { persistOnly })`); `doors.js` `openDoorForNpc(sprite, npcId)` (+ `window.openDoorForNpc`); `interactions.js` guard; test bridge `window.__test.walk.in/out/state`.
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
