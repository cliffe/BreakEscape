# CA engine review: E1 side-door gates and the live window, round 2

Scope: the E1 fix round only, `git diff d875187e3..c1b5eed10` restricted to the E1 commits 244915830 (door-gates.js, doors.js), d3d97c0c3 (tests, `test_side_door_gate_east_start`) and c1b5eed10 (locked-hint-refusals count), judged against the R1 findings. The npc-behavior.js, apply-actions.js and npc-manager.js hunks in the same range are E4 work and are not reviewed here. doors.js and door-gates.js are byte-identical at c1b5eed10 and at the worktree HEAD (06cf82124).

**Totals: 0 B, 1 M, 6 m**

## Tests run

Plain `node`, at HEAD: door-gates-r1-fixes 9/9, door-gates-side 22/22, door-gates 22/22, door-gates-bar 27/27, door-gates-player-open 12/12, door-gates-no-hold 13/13, lab-ux-ui 31/31, locked-hint-refusals 9/9, door-snap 4/4, npc-walk-gate 23/23. (The first npc-walk-gate run showed 22/1; four reruns were clean. It probably raced the f4ec3ce90 commit landing in the shared tree.)

Against 1fdfc0c97 (source tree exported with `git archive`, new test files copied in): door-gates-r1-fixes fails 9/9, each on its assertion (not a load error): B1 sprite destroyed counts 2 and 1, M1 `'exit'` where `'inert_enter'` is expected, gate opened on a 403, m1 target 564 inside the door tile 532..564, m4 `cx` missing. The edited suites fail where they should (side 4, door-gates 1, bar 2, locked-hint 1). The claim "all 9 fail on 1fdfc0c97" holds.

## R1 findings: verdicts

- **B1: fixed on the path that matters.** `handleDoorInteraction` (`doors.js:677-684`) loads an unloaded, not-locked connected room before routing, then looks the gate up again. `createRoom` creates and registers door sprites synchronously before `loadRoom` resolves (`rooms.js:2046`), so the second lookup sees the adopted group. The ca12-style case (start in the secured room, outer room unlocked) now reaches `clickOutcome` and gets `'exit'`. `loadRoom` shares in-flight loads (`rooms.js:950-967`), so a second click after the 300 ms repeat window joins the same load, and the group repeat guard (`doors.js:687`) stops a second `exitOpen`. The guards in `finishOpeningDoor` (`:917-918`), `processRoomDoors` (`:974-980`) and `removeMatchingDoorSprite` (`:1140-1141`) are correct as far as they go. The second route (outer room locked, so no pre-load) is only partly fixed: see m1.
- **M1: fixed.** `clickOutcome` returns `'inert_enter'` for any inert click from outside and opens nothing (`door-gates.js:682`). `enterThroughInertGate` (`doors.js:807-821`) loads first and calls `exitOpen` only if the room exists and the window is still inert. No double open: `if (!g.open)` guards it, and an open gate from outside now also loads the room (R1's `'leave'` gap). A 403 leaves the gate shut with "Access denied". One gap remains for a loaded but unearned room: m2.
- **m1 fixed** (`WALK_THROUGH_SIDE_PX = 1.5 * TILE`, test asserts the target is clear of both door tiles). **m2 fixed** (lab-ux-ui stub has two sprites a tile apart, asserts a shared `gateKey` and equal targets). **m4 fixed** (`_gateInfo` carries `cx, cy`; bar and door-gates fixtures updated). **m6 half fixed:** the door-gates.js header is right now, but the plan text is not (m6 below).
- **m3** (inert gate stays `openFor`-only for NPCs): decided and documented in the header. Accepted.
- **m5**: moved to `E1_validator_todo.md` for E4. Accepted.

## Server-side bypass

None added. The only new requests are the `'unlocked'` handshake, sent only for a sprite whose `locked === false`. `validate_unlock` refuses `'unlocked'` for a scenario-locked room (`game.rb:5052-5056`) and grants it for an unlocked one, which an ordinary door click already did. `enterThroughInertGate` sends nothing for a locked room and relies on `GET /room/:id` refusing it. Entering a loaded-but-unearned room stays client-side only: objects there are refused as an unpromoted route room (`game.rb:338-343`), which matches the cheat-resistance policy.

## Major

**M1. B1 and M1 have no live proof yet, and the unit tests stub everything the fix depends on.**
`door-gates-r1-fixes.test.mjs:26-29` stubs `notifyServerUnlock`, `isRepeatInteraction`, `waitForRoomReady` and `loadRoom`, and `:58` makes the pathfinding manager a set of no-ops. The real path runs through `roomDataCache`, `waitForRoomReady`, NPC lazy loading before `createRoom`, and the grid rebuild 250 ms later. The fix round records no browser run on `test_side_door_gate_east_start` (its dungeon_graph files are still untracked in this worktree), and R1's 1b proof is still owed. This is the same pattern the standing rule warns about: helper tests pass while the live path breaks.
Fix: before E1 is called done, run on a keyless server:
1. `test_side_door_gate_east_start`: click the west door at once. Check that the gate opens for you, both sprites survive (`window.doorGates.groups` has one group with two sprites), and you walk out. Then step back into the lobby side and check that the gate shuts and the doorway cells are blocked (`pathfindingManager.openSideDoorCorridors` is empty).
2. `test_side_door_gate` with the window off: click from `west_room` during the opener's first 8 s dwell. Expect the handshake and load, then the gate opens. With the window on, expect a refusal.
3. The lab records-door tailgate re-run that plan line 469 asks for, now that every unlocked-door click goes through the pre-load (m3).

## Minor

**m1. `reassert()` leaves a side corridor carved through a shut gate, and the player's unlock is spent with no way out.**
`doors.js:928` (`finishOpeningDoor` stores the corridor at the clicked sprite's `worldX/worldY`), `door-gates.js:370-381` (`reassert` calls `unmarkDoor(g.x, g.y, ...)`), `npc-pathfinding.js:992-993` (a corridor is dropped only within 2 px).
This is the route the pre-load skips: the player starts in the secured room, the outer room is key-locked, and he unlocks it (or `DISABLE_LOCKS` is set). `finishOpeningDoor` runs while the sprite is still pending, so it calls `markSideDoorCorridor` at the secured room's sprite. That sprite sits 32 px from `g.x` (the outer sprite, which registered the group). `reassert` restores the bodies, but `unmarkDoor(g.x, ...)` misses the stored corridor, so every later `rebuildWorldGrid` carves the doorway open again while the gate is shut. Click-to-move and NPC plans then route into the gate body and stall. The click itself ends in `reassert`, so the gate stays shut: the player has used his key and must click again. No shipped or planned scenario has a key-locked outer room with the secured room loaded first, so this is narrow. `door-gates-r1-fixes.test.mjs:93-113` cannot catch it because `unmarkDoor` is a no-op there.
Fix: in `reassert`, unmark at every sprite of the group as well as at `g.x/g.y`: `for (const s of g.sprites) pm.unmarkDoor?.(s.doorProperties.worldX, s.doorProperties.worldY, s.doorProperties.direction)`. Do the same in `register`'s adoption branch (`:326-331`). Then, in `processRoomDoors`, after `reassert` returns true, route the click through `clickOutcome` so the player leaves through the gate he just unlocked (`window.doorGates.clickOutcome(g, {...}) === 'exit'`). Test: a recording pathfinding stub that asserts `openSideDoorCorridors` is empty after the reassert.

**m2. An inert click into a room that is loaded but not unlocked for the player skips the handshake.**
`doors.js:810-813`: the `'unlocked'` handshake runs only when `!window.rooms[room]`. A split gate's route NPC (`gated_route_room?`, `games_controller.rb:1304-1310`) can load a scenario-unlocked secured room into `npcRouteRooms` without adding it to `unlockedRooms`. The inert click then opens the gate with no handshake, and every object in the room is refused (`room_not_reachable`, then a refusal after the one retry). An ordinary door handshakes on every click, so "an inert gate is an ordinary door" is not quite met. ca12 is safe because its secured room is the start room.
Fix: send the handshake whenever the entry sprite has `locked === false`, loaded or not. Split `loadRoomBehindDoor` into `handshake` and `load`, and in `enterThroughInertGate` always run the handshake for an unlocked entry. While here: when the window goes live during the load (`:815` false with the room loaded), call `refuseAtGate` rather than the plain toast, so the guard's bark and `door_gate_denied` fire as for any live refusal.

**m3. Every first click on an ordinary unlocked door now sends the unlock handshake twice and plays the lock sound late.**
`doors.js:680-684` then `:773` (`handleUnlock`), `unlock-system.js:1052` (`playUISound('lock')`), `:1092-1104` (second `'unlocked'` POST).
The pre-load applies to every door with no gate whose connected room is not loaded and not locked, in every scenario. The flow is now: handshake, then the full room load (fetch, NPC lazy load, `createRoom`), then `handleUnlock`, which plays the lock sound and sends the same handshake again. Its `roomData` is cached into `roomDataCache` for a room that is already loaded, so the entry is never used and never cleared. The door still visibly opens after the load, as before, but the click sound and first feedback now wait for the whole room load, and the server does two unlock writes. Nothing breaks (`unlock_room!` is idempotent).
Fix: when the pre-load ran and found no gate, finish the click directly with the handshake's response: `unlockTarget(doorSprite, 'door', doorSprite.layer, resp)` on success, the usual "Access denied" otherwise, instead of calling `handleUnlock`. Play `playUISound('lock')` at the top of the pre-load branch. Test: an unlocked ordinary door to an unloaded room gives exactly one `notifyServerUnlock` call and one open.

**m4. The fix note says the pending-sprite half of R1 M2 is closed by the B1 guards. It is not, on the NPC path.**
`doors.js:1110-1118` (`openDoorForNpc`), `:958` (`needsLoading` is false for `byNpc`).
`openDoor(..., { byNpc })` never loads the far room, so `processRoomDoors` runs at once, before any adoption. `isGate` is still false, and the secured room's pending sprite is destroyed, with its side corridor stored. When the outer room loads later, the group has only the outer sprite and the stored corridor keeps the doorway carved (the m1 problem again). This needs a walk whose door list was built before the outer room loaded, which the landed walk-in code (spawn in the far room) mostly rules out. The client cannot tell a pending gate sprite from any other door before the outer room loads, because the gate config is not in the bootstrap scenario (`rooms.js:2044-2045`).
Fix: in `openDoorForNpc`, refuse a side door whose `connectedRoom` is not loaded (the walker fades or re-plans, as for any unusable door), or have npc-walk `ensureLoaded` the far room before it opens a door, as walk-out already does. Correct the claim in R1's fix-round note.

**m5. `unlockDoor` on a gate sprite is now a silent no-op.**
`doors.js:917-918`. `unlockDoor` is also reached from person-chat `#unlock_door` (`person-chat-conversation.js:473-477`), propped-door workarounds (`npc-workarounds.js:456-466`, `:495-499`) and `unlockTarget`. Before this round, those destroyed the gate (opened for good). Now they set `locked = false`, cache room data and do nothing: no load, no open, no log. `unlockTarget` still emits `door_unlocked`. No shipped gated scenario uses these paths (its `unlockDoor` mappings are never-firing placeholders the server needs), so this matters only for future content.
Fix: in `finishOpeningDoor`, when the sprite is a gate, log a warning naming the caller. For a non-NPC call, load the connected room and call `window.doorGates.playerOpen(props.connectedRoom)`, so an NPC or a prop that lets the player in actually opens the gate once.

**m6. Plan and comment drift.**
`CA_PILOT_MECHANICS_PLAN.md:103` still says the side `walkThroughTarget` is `y: g.y + TILE / 2` and that `g.x/g.y` is a top-left corner. `:437` still says "one tile into the far room, not two" (it is 1.5 tiles). `doors.js:688-691` lists the outcomes a click can get without `'inert_enter'`.
Fix: plan 1.5 should read `{ x: cx ± 1.5 * TILE, y: cy }` and say that `g.x/g.y` is the registering sprite's centre. Line 437 should say 1.5 tiles. Add `'inert_enter'` to the doors.js comment.

## The new tests

They test the right things and fail for the right reasons on 1fdfc0c97. Gaps:
- No test that an ordinary unlocked door still opens exactly once after the pre-load (m3). This is the one change that touches every scenario.
- `:93-113` (the reassert case) puts the player in `lobby` while he clicks the studio's own sprite from studio-side coordinates. The case it describes has him inside `studio`. Set `currentPlayerRoom = 'studio'`, and give it a pathfinding stub that records the corridor (m1).
- No test where the pre-load's `loadRoom` resolves with no room (403) and the click falls back to the ordinary path.
- No test for the window going live during the inert load (refusal), or for an inert click into a loaded route room (m2).

## The M2 deferral plan

Sound. It identifies the real cause: the walker's door is the outer sprite, whose `locked` is the secured room's, so `doorClosed` is false and the approach leg is skipped. Asking `approachPoint` for an `openFor` walker and letting proximity open the gate is the right mechanism. The plan's own test pair (an `openFor` walker spawned 160 px out walks through; a walker not on `openFor` is not routed) covers it. It has since landed as 0e32243cb and f4ec3ce90 (after this round's range). A quick read shows it matches the plan: the approach runs before the `doorClosed` check, and `npc-walk-gate` passes 23/23. Not covered by the plan or its tests: a gate that stays shut when the walker arrives (a barred player beside it, so the guard is turned back). The through leg then heads for a shut gate and ends in the stall-and-fade fallback. That is acceptable, but it should be a named test case. Whether `snap()` keeps a side approach on the doorway's centre row was not checked.
