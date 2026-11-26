# CA engine review: E1 side-door gates and the live window, round 1

Commit reviewed: `1fdfc0c97` (door-gates.js, doors.js, global-condition.js, `test_side_door_gate`, `door-gates-side.test.mjs`, edits to `door-gates.test.mjs` and `lab-ux-ui.test.mjs`).
Spec: `CA_PILOT_MECHANICS_PLAN.md` 1.5 E1 (lines 100-121), section 3 E1 checks (lines 437-439, 464, 469), steps 1 and 1b (lines 480-481), risk at line 517; `tmp/handover/ca0/ca12_shell_todo.md` (E1 gate block, Camila); `ca15_shell_todo.md` (no E1 items: the ca15 side door has no gate).
Deferred by design and not raised: validator and graph work (`tmp/handover/ca0/E1_validator_todo.md`, owned by E4), the 1b live proof.

**Totals: 1 B, 2 M, 6 m**

Suites run at `4cf007870` with plain `node`: door-gates-side 22/22, door-gates 22/22, lab-ux-ui 31/31, door-gates-bar 27/27, door-gates-player-open 12/12, door-gates-no-hold 13/13, npc-walk-gate 21/21.

## The lab-ux-ui change: a correction, not a regression

The test's expected side walk target moved from `{148,116}`/`{52,116}` to `{148,100}`/`{84,100}`. No shipped scenario can see the difference:

- **No scenario has a side-door gate today.** Every door `gate` block in `scenarios/` is on a north or south door: `lab_physical_pentest` (`secure_area`, north, the records-area tailgate), `test_gate_tailgate` (north), `test_access_habits` (north, south), `test_bark_bubbles` (south, south). The new `test_side_door_gate` is the only east/west one. The `"gate"` hits in `m10_full_disclosure` are an ink knot name, not door config. `lab_social_engineering` has no door gate. No office kit carries `openFor`.
- **The old side branch was dead code in the game.** Before E1, `register()` refused any sprite with `isSideDoor`, and doors.js sets that flag on every east/west sprite (`doors.js:534`). The old lab-ux-ui case got into the side branch only because its stub left `isSideDoor` out.
- **The new y is right and the old one was wrong.** Door sprites have origin (0.5, 0.5) (`doors.js:480`), and a side door's `doorY` is already the tile centre ("2.5 tiles from top corner (center of door)", `doors.js:247`, `:285`). The carved corridor is the middle two 8 px rows, `cy ± 8` (`npc-pathfinding.js` `_carveSideDoorCorridor`). `g.y + 16` put the target on the blocked bottom row.
- **North/south paths are unchanged.** N/S keys get no prefix (`_doorway` returns `this._key(x, y)`). `cx/cy` equal `x/y` for N/S, so every distance, `doorRect`, `doorBodyRect` and `walkThroughTarget` value is the same as before. `groupAtPosition(..., 'north')` reads the plain key. `isInert` is false with no `activeIf`. The N/S cases in lab-ux-ui, door-gates and door-gates-bar pass unchanged. The live lab records-door regression (plan line 469) is still to be run under 1b.

## The implementer's deviations

1. **Walk-through y is `cy` (the sprite centre), not `g.y + 16`.** Accepted. The plan assumed `g.x/g.y` was a top-left corner, which it is not (see above). Update the plan text at 1.5 (the `walkThroughTarget` bullet) so it does not mislead the next reader. The x distance is a separate question (m1).
2. **`activeIf` read through `window.parseActionCondition`.** Accepted. This follows the existing pattern: `window.evaluateActionCondition` is already exported the same way for `apply-actions.js:218`, for the same reason (`global-condition.js:129-136`). door-gates.js has no imports and is loaded by data URL in eleven test files, and `door-gates-side.test.mjs:14` now checks that it stays import-free. `main.js:19` imports global-condition.js before any gate ticks. If the parser is missing, `isInert` returns live and caches nothing (`door-gates.js:386-387`). That leaves the gate as an access control, which is the safe default.
3. **Side keys carry an `s` prefix.** Accepted. N/S keys stay byte-identical, so nothing saved or tested against the old key format moves, and a side key cannot collide with an N/S key (test `:71`). The fallback order of `groupAtPosition` without a direction (N/S, then east-derived, then west-derived, `door-gates.js:366-374`) is never used now that every caller passes `direction`. It could be dropped, or kept with a comment saying so.

## Blocking

**B1. A gate whose secured room loads first can be destroyed by an ordinary click before the outer room loads. ca12 hits this, because its start room is the secured room.**
`doors.js:670-674` (gate detection: `props.gateKey` or `groupAtPosition`), `doors.js:914-923` (`processRoomDoors` calls `removeMatchingDoorSprite`), `doors.js:1056-1090` (`removeMatchingDoorSprite` does not check for gates), `door-gates.js:279-283` (an unconfigured sprite waits in `pending`).
The gate config is on the outer room's door entry, the one into the locked room (ca12: the lobby's entry to `training_room`). The secured room's own sprite knows nothing about the gate until the outer room loads and adopts it. ca12 starts the learner in `training_room` (`scenario.json.erb:10`), and the lobby is not loaded until `enterWorld` or a door opens it (no adjacent-room preloading in `rooms.js`). Before the call, the learner clicks the studio's east door:
1. `gateKey` is unset and `groupAtPosition` finds no group, so the click takes the ordinary-door path. The lobby is unlocked, so `openDoor` runs.
2. `openDoor` loads the lobby. The lobby's west sprite is created and registers the gate, adopting the pending studio sprite.
3. `processRoomDoors` then calls `removeMatchingDoorSprite(lobby, ...)`, which destroys the lobby's gate sprite, and `openDoor` destroys the studio sprite.
The doorway is now open for good: the group has only destroyed sprites (`_prune`) and no bodies. During the live window the learner walks into the studio without the hi-vis, and Yusuf's gate does nothing. The same happens after a reload inside any secured room: the lab's `secure_area` after a tailgate, then a click to leave. So the existing N/S gates have the same weakness. ca12 makes it reachable on a first visit. `test_side_door_gate` starts in the outer room (`west_room`), so its live proof cannot catch this.
Fix (both parts):
- In `handleDoorInteraction`, for a door with no gate group whose `connectedRoom` is not loaded, `await window.loadRoom(connectedRoom)` before the ordinary path. Then look up `gateKey`/`groupAtPosition` again and send the click to `clickOutcome` if a gate now exists.
- Make `removeMatchingDoorSprite` (and `openDoor` itself) refuse to destroy a sprite for which `window.doorGates.isGate(sprite)` is true.
Tests: a unit test with a stub scene, the secured-room sprite registered first and the outer sprite registered during a stubbed `loadRoom`, checking that both sprites survive and the click routes to the gate. Also a `test_side_door_gate` variant (or a second start mode) with `startRoom: east_room`, clicking the door before `west_room` has loaded.

## Major

**M1. An inert gate opens from outside before anyone knows the server will serve the room behind it. When the server refuses, the learner walks through an open doorway into a room that was never loaded.**
`door-gates.js:650-654` (`clickOutcome`: inert means `exitOpen` at once), `doors.js:684-694` (fire-and-forget `loadRoom`, after the gate is already open).
Server side this is safe, which answers the cheat-resistance question. The inert click sends no unlock request. `GET /room/:id` serves only the start room, `unlockedRooms`, the awareness world room or an NPC route room (`games_controller.rb:578-592`) and answers 403 otherwise. A route room is served without promotion, so its object actions stay gated (`game.rb` `object_in_unpromoted_route_room?`). A `currentRoom` sync into an unearned room is refused (`may_sync_current_room?`). So the click cannot put a locked room's contents in the learner's hands without the server agreeing. That matches the policy: the server enforces keys and secrets, and gates and tailgating are best-effort.
What breaks is the client. `loadRoom` logs a 403 and resolves with no room (NPC_WALK_IN_OUT_HANDOVER line 166), but the gate is already open and its bodies are off, so the learner walks into empty space and the room sync is refused. There are three cases:
- ca12 is safe: the secured room `training_room` is the start room.
- `test_side_door_gate` is unsafe in principle. `east_room` is not locked, but it is not in `unlockedRooms` either, because only an ordinary door's `unlocked` handshake adds it. So the inert click loads it only if the opener's route has already made it loadable. Click during the opener's first 8 s dwell to see this.
- A future shell with `activeIf` on a gate into a key-locked room that is not the start or world room fails every time.
The `'leave'` branch (an inert gate that is already open, say held by an NPC on the outer side) does not try to load the room at all.
Fix:
- For an inert click from outside, have `clickOutcome` return a new outcome (`'inert_enter'`) without calling `exitOpen`. In doors.js, if the secured room is not loaded: for a room that is not locked, run the ordinary `notifyServerUnlock(doorSprite, 'door', 'unlocked')` handshake; for any room, `await loadRoom`. Then call `exitOpen` only if `window.rooms[securedRoom]` exists. Otherwise give the normal refusal.
- Do the same load on `'leave'` from outside.
- Add a validator rule to E1_validator_todo.md: an `activeIf` gate whose secured room is `locked` and is neither `startRoom` nor the awareness world room gets a WARN ("outside its window the gate opens onto a room the server will not serve until it is unlocked").

**M2. A walk-in through a shut gate gets no approach leg. Unless the walker spawns within `openRadius`, it stalls and fades.**
`npc-walk.js:427` (`doorClosed` requires `!props.locked`), `npc-walk.js:443-467` (`goTo`), `npc-walk.js:218-226` (`doorUsable`), `npc-walk.js:432-435` (`openWalkerDoor` goes through `openDoorForNpc`, which refuses gates at `doors.js:1049`).
This answers the walk-in question. A registered gate does override the locked-door fade: `doorUsable` checks `isGate` first and asks only whether the walker is on `openFor`. So once the gate has registered, Camila (on `openFor`) is planned through the lobby-studio door even though the studio is key-locked, where before E1 she would have faded at the door. Two gaps remain at the seam between VID1 and E1:
- **No approach.** Walking in from the lobby, the door Camila uses is the lobby's sprite. Its `locked` reads the studio's lock (true), so `doorClosed` is false and `goTo` goes straight to the target through a shut gate. The side corridor is not carved while the gate is shut, so there is no path. The walk stalls (3 s), re-plans, and fades in view. The gate opens for her only if she happens to spawn within 64 px of the doorway centre. VID1 left the walker's gate approach out (`_approachRouteGate`, handover line 32), and plan section 0 assumes "still opens for her through `openFor`".
- **The pending sprite.** Before the outer room loads, the studio-side sprite is a plain unlocked door to npc-walk, which can open it with `openDoorForNpc` (the B1 path, by NPC). Walk-out loads the far room first (`ensureLoaded`), so this needs a walk that does not, such as a walk-in whose door list was built before the load.
Fix: in `goTo`, when `E.doorGates()?.isGate(d.sprite)` and the walker is on its `openFor`, ask `doorGates.approachPoint(w.id, here, [here room, far room])`. That returns the in-radius spot, on the doorway's centre row for a side gate. Walk there first and let proximity open the gate; the `gateOpened()` re-ask (`door-gates.js:529`) covers the re-path. Add a test in `npc-walk-gate.test.mjs`: an `openFor` walker spawned 160 px from a shut side gate walks through with `how === 'walked'`.

## Minor

**m1. The side walk target ends on the far door tile, inside the door body.**
`door-gates.js:127-129` (`WALK_THROUGH_SIDE_PX = TILE`), `:689-691`. From the boundary `cx`, one tile is the centre of the far room's door tile, which is that room's wall column (side sprites sit "0.5 tiles from the edge", `doors.js:247`, `:285`). The learner stops on the door's body footprint, so `playerHoldsDoorway` keeps the gate open, and the overlap exception keeps the body off, until he walks on. Nothing breaks, but it is not "clear of a side wall" (the comment at `:125-126`), and the N/S rule takes two tiles for the same reason.
Fix: `WALK_THROUGH_SIDE_PX = 1.5 * TILE` (the centre of the first floor tile past the wall column). Assert in the side test that the target lies outside `doorRect(g)`.

**m2. The edited lab-ux-ui stub no longer models a side doorway.**
`test/js/lab-ux-ui.test.mjs:465-485`, `:507-514`. `gateSetup('east')` puts both sprites at x 100. With the new keys the east sprite groups at `s` + (116,100) and the west sprite at `s` + (84,100), so `b` sits in `pending` and never joins. The case still passes because it reads only `a`.
Fix: put the far sprite at x 132 for side directions, assert that both share `gateKey`, and assert that `walkThroughTarget(b, ...)` matches `walkThroughTarget(a, ...)`. Alternatively, drop this case in favour of `door-gates-side.test.mjs:163`, which already covers it with real geometry.

**m3. Outside its window, a gate is still closed to every NPC walker not on `openFor`, and the door-pass hook cannot help.**
`npc-walk.js:218-226`; `doors.js:1049`. The plan calls an inert gate an ordinary door "from both sides", but only for the learner. A walker not on `openFor` gets `doorUsable` false. If the hook then says yes, `openByHook` calls `openDoorForNpc`, which returns false for a gate, so the walk stalls and fades. ca12 does not need this today, since Camila, Jun and Delphine are all on `openFor`.
Fix: either let `doorUsable` treat an inert gate as passable, with door-gates opening an inert gate for any walker within `openRadius` whose `wantsToCrossGate` is true, or write down in the plan and the door-gates header that an inert gate stays `openFor`-only for NPCs. The validator's walk check (gate `openFor` lacks the NPC = ERROR) already catches the authoring side.

**m4. Turn-back events and `_gateInfo` report the registering sprite, not the doorway centre.**
`door-gates.js:779`, header `:63`. For a side gate, `x, y` in `door_gate_guard_turned_back` is the outer room's sprite position, 16 px off the doorway centre. ca12's Delphine 3 and Yusuf 3 are still to be written; if they key on position, they will be off by that much. `guardTurnedBack`'s identity check at `:835` relies on `g.x`, so leave `x, y` as they are.
Fix: add `cx, cy` to the payload and to `_gateInfo`, and document both in the header.

**m5. A side gate on a room with several east or west connections may never pair.**
`doors.js:255-278` (`placeEastDoorsMultiple` spaces the doors along the parent's height), `rooms.js:1661+` (stacked children). The child's matching west door comes from `placeWestDoorSingle` (`child.y + 2.5 tiles`), so the two sprites can sit at different y. The `_key` grouping (8 px rounding) then never joins them, and the far sprite stays pending as an ordinary door. This misalignment already exists visually, but the gate fails silently on top of it.
Fix: add a validator WARN to E1_validator_todo.md for a gate on an east or west door when either room has more than one connection on that side. Optionally, `register` could log a console warning when a side gate still has only one sprite after both rooms are loaded.

**m6. Small doc drift.**
The plan, 1.5 (`walkThroughTarget` "stays correct ... `y: g.y + TILE / 2`"), contradicts the shipped code (deviation 1). The comment at `door-gates.js:125-126` ("clear of ... a side wall") is not true at one tile (m1). The `inert: true` flag on `door_gate_closed` is read when the gate closes, not when it opened (`_afterToggle`, `:470-475`). Say so in the header, so that a mapping that counts open/close pairs knows the two can differ when the window changes mid-hold.

## Missing test cases

- B1: secured-room sprite first, outer room loaded during a click on it. The gate survives, both sprites stay, the click goes to `clickOutcome`, and `removeMatchingDoorSprite` leaves a gate sprite alone. Also a live variant of `test_side_door_gate` starting in `east_room`.
- M1: an inert outside click when `loadRoom` resolves with no room (403). The gate stays shut or is closed again, and the learner is refused. An inert click on an already open gate from outside loads the secured room. The `doors.js:684-694` branch has no unit test at all today.
- M2: an `openFor` walker spawned outside `openRadius` of a shut side gate walks through (`npc-walk-gate.test.mjs`). A walker not on `openFor` at an inert gate behaves as m3 decides.
- The side walk target lies outside `doorRect` and on the carved centre row (m1).
- The live window flips to live while the learner stands in an open inert side doorway: the body stays off until he steps off (overlap exception), and then he is barred.
- The live window flips while the gate is open: `inert` differs between the open and close events (m6).
- Pending adoption with the real pathfinding manager in the order "secured room first": after adoption and a rebuild, the doorway cells are blocked until the gate opens (`door-gates.js:316-323`).
- Lighting under an open side gate (the plan's [check during implementation] for `lighting.js:1790`). The code reads `props.open`, which the gate sets, so it is probably fine; one live screenshot in 1b settles it.
- Validator and graph cases, as listed in `tmp/handover/ca0/E1_validator_todo.md` (E4).

## Not checked here

- Live behaviour (1b): the `test_side_door_gate` proof and the lab records-door tailgate re-run. The latter matters less now that the N/S paths are shown to be unchanged, but plan line 469 still asks for it.
- Whether `openDoor`'s far-room bookkeeping recreates a destroyed gate sprite after a reload (it bears on how lasting B1's damage is).
