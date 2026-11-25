# NPC walk-in / walk-out plan

Status: phase 1 (design and file list), 2026-11-25. Branch `feat/npc-walk-in-out`, from main a2ae50dda. No engine or scenario code changed yet. Owner rule: an NPC who appears or leaves mid-scene walks in from out of view and walks out of frame. A fade is only the fallback.

Items marked **[check]** were read from code but not proven at runtime; the implementer confirms each one in the focused test scenario before relying on it.

## 1. Problem and current behaviour

- Show and hide are one eventMapping field, `setVisible`, handled in `systems/npc-manager.js:1982-1986`, which calls `npcBehaviorManager.setNPCVisible` (`systems/npc-behavior.js:401`). That flips the sprite and body at once, records the value (`npcManager.recordNpcVisibility`, `npc-manager.js:2593`), and syncs it as the bounded boolean section `npcVisibility` (`state-sync.js:565-567`, server `game.rb:6290 merge_npc_visibility!`). On a reload the record wins over `behavior.initiallyHidden` (`npc-manager.js:377-380`, `npc-sprites.js:238`).
- NPC positions are not persisted. After a reload a visible NPC stands at its scenario `position`; a `patrolOverride` destination is lost. The walk design keeps that rule instead of adding a position section.
- Walking already exists: `goToAndStay` (`npc-behavior.js:3479`) plans on the world grid with `findWorldPath`, so it can cross rooms when both are loaded and the doorway is walkable, and fires `npc_arrived:<id>` with `owner`, `moveId`, `pathLeft` on arrival (`:3624`). A move owned by anything but needs suspends needs (`onExternalMove`). Multi-room patrol routes add what a plain `goToAndStay` lacks: route-room preload (`:913-928`), wall colliders per route room (`_ensureRouteWallColliders`, `:2468`), walking to a shut gate's approach point when a leg is blocked (`_approachRouteGate`, `:2431`), and gate turn-back (`wantsToCrossGate`/`turnBackFromGate`, `:2625-2660`). Only route walkers get `npcData.roomId` updated as they change room (`updateCurrentRoom`, `:1036-1041`).
- Doors: unlocked doors are walkable on the grid from creation (`doors.js:613-622`), locked ones are blocked, closed doors keep a dynamic immovable body until opened (`npc-sprites.js:816`), and `openDoor` (`doors.js:836`) is player-centred (it loads the far room and destroys the sprite). Gates open for `openFor` NPCs by proximity (`door-gates.js:22`), north and south doors only today (CA0's E1 adds side doors).
- A loaded room is revealed at once (`rooms.js:1053`), so "out of view" means outside the camera's `worldView`, or in a room that is not loaded.
- Lighting already follows live NPC positions: a motion room switches on when a visible NPC stands on its floor (`lighting.js:1186`, `npcInRoom`). Nothing to change there.

The three owner cases today:

| Case | Where | How it pops |
|---|---|---|
| m09 Lyle Dillard, `archive_guard` | `open_stacks` (3.5, 8); room connects S `loading_dock`, W `reading_room`, E `server_closet` | `behavior.initiallyHidden`; mapping 0 on `global_variable_changed:tran_alerted` does `setVisible: true` plus `conversationMode: person-chat`, `targetKnot: start` in one go. Tran spots the player in `server_closet`, so Dillard appears in the stacks and the line opens at the same instant. Mapping 1 is a catch-up `setVisible: true` on `room_entered:open_stacks`. |
| m10 `monitor_guard` | `gallery` (3, 4.5); W `server_hall` (unlocked), E `core` (pin) | On `room_entered:gallery` with `gallery_camera_blinded`: bark "Camera's dead again. I'll go and look." (onceOnly), then a second mapping `setVisible: false, delayMs: 3500` (not onceOnly). |
| ca12 Camila, `kit_camila_ospina` | `training_room` (8.5, 2.5), beside the east door to `lobby`; kit `office_kits/merrin_sallow.json` set piece `ca12_visitor` | Kit mapping 2 (1-based) `setVisible: true`, mapping 3 `delayMs: 2000` `patrolOverride` to (6.5, 4.5). Exits: `patrolOverride` back to (8.5, 2.5) (7, 11, 12, 15), then `npc_arrived` + `setVisible: false` (8, 13, 16), and the 150 s `kit_ca12_done` timer hides her wherever she is (17). Mapping 14 is an inert placeholder. |

Noticed, not in scope: m10 `farah_guard` is hidden by `setVisible: false` on `room_entered:gallery` with no delay, so she vanishes as the player walks in. 226 `setVisible` uses exist across 20 scenarios; most are identity swaps or off-screen. Section 8 adds a check that lists the visible ones for a later audit.

## 2. Scenario-facing interface

Two new eventMapping fields, beside `setVisible` and `patrolOverride`. They replace `setVisible` in the same mapping, so an existing mapping changes in place and keeps its index.

```json
"walkIn":  true | { "from": "<roomId>" | "offscreen" | { "room": "<roomId>", "x": 1, "y": 2 },
                    "to": { "x": 6.5, "y": 4.5 }, "speed": 90, "timeoutMs": 20000 }
"walkOut": true | { "to": "<roomId>" | "offscreen" | { "room": "<roomId>", "x": 1, "y": 2 },
                    "speed": 90, "timeoutMs": 20000 }
```

- `walkIn`: the NPC becomes visible out of view and walks to `to` (tiles in the NPC's own room). `to` defaults to the NPC's scenario `position`, and authors should keep it that way: the position is where a reload puts the NPC (section 5). `from` is a connected room id (enter through the door to it), `"offscreen"` (the nearest out-of-view floor of the NPC's own room, for long rooms), or an explicit tile. Omitted or `true`: pick automatically (section 3).
- `walkOut`: the NPC walks off and is hidden once out of view. `to` mirrors `from`.
- `speed` defaults to the NPC's patrol speed; `timeoutMs` defaults to 20000 and bounds every wait (path, gate, door).
- **Deferral.** In a mapping with `walkIn`, `conversationMode` (with its `targetKnot`) and `bark` wait for arrival, so the NPC walks in and then speaks. Every other field (`setGlobal`, `needs`, `targetKnot` without a conversation) applies at once. In a mapping with `walkOut`, `bark` plays at once and the walk starts with it, so the NPC talks as they turn to go.
- **Events.** A walk-in ends with the usual `npc_arrived:<id>` (data adds `owner: 'walk'`, `walk: 'in'`, `how: 'walked' | 'faded' | 'instant'`), so existing arrival mappings with `data.owner !== 'needs'` keep working. A walk-out ends with a new `npc_left:<id>` `{ npcId, to, how }` after the NPC is hidden; it never fires `npc_arrived`, so exit-tile arrival mappings cannot misfire.
- **No-ops.** `walkIn` on an NPC that is already visible and not leaving does nothing but the deferred fields; `walkOut` on a hidden NPC does nothing (so m10's non-onceOnly mapping stays harmless on re-entry). A `walkIn` that arrives during a `walkOut` of the same NPC cancels the walk-out and walks back to `to`.
- The engine API under it, for tests and the test bridge: `npcBehaviorManager.walkNPCIn(npcId, opts)` and `walkNPCOut(npcId, opts)`, both returning a promise that settles with `how`.

## 3. Choosing "out of view"

**In view** means: the NPC's sprite rectangle at that point (body feet plus the frame's height above) overlaps the camera's `worldView` grown by a margin of one tile. A point in a room that is not loaded is out of view. With no camera (node tests, headless stubs) everything counts as out of view. The check runs on `scene.cameras.main.worldView`, the same source `npc-world-bubbles.js` uses. Lighting is ignored (a dark room still shows a silhouette).

**Walk-in spawn**, for a door room F of the NPC's room T:
1. Find the doorway between T and F from `calculateDoorPositionsForRoom` (as `door-gaps.js` does). Skip it if it is a locked non-gate door, or a gate without this NPC in `openFor`.
2. If F is loaded: breadth-first search over the world grid from the doorway into F only, and take the first walkable cell (nearest the door) that is out of view and from which `findWorldPath` reaches `to` (gate legs allowed, section 4). Spawn there.
3. If F is not loaded and the scenario has it unlocked: `loadRoom(F)` (the multi-room route preload already does this), wait up to 3 s, then step 2. If F is locked, or the load fails or times out: doorway fallback (section 7).
4. `from` omitted: score every doorway of T by path length from the doorway to `to`, drop doorways where the player stands within two tiles of the door (never step out of the door the player is standing in), and take the first that gives a spawn by steps 1-3. None: doorway fallback at the nearest usable door; none at all: fade in at `to`.
5. `"offscreen"`: the same search, seeded from `to` across T's own floor. Explicit tile: used as given; if it is in view at the trigger, the NPC still starts there but fades in over the first 400 ms.

**Walk-out exit**: the same doorway choice in reverse (`to` room, else the doorway nearest by path, with the same player-in-doorway rule). The NPC walks to the first out-of-view cell beyond the door, but the walk ends early on any tick where the NPC is past the doorway and out of view (the camera moves with the player, so a fixed target is only a cap). If the far room is locked or will not load, the NPC walks to the near doorway mouth and does the doorway fade.

## 4. Pathing

- Build on `goToAndStay` with `opts.owner = 'walk'` (so needs suspend through `onExternalMove`, and `npc_arrived` carries the owner). No new path planner.
- Lift three route-walker pieces into helpers that a walk also calls: wall colliders for every room on the walk (`_ensureRouteWallColliders` generalised to a room list), `npcData.roomId` updated in `updateCurrentRoom` while `_walk` is set (sight checks, LOS, conversation range read it), and the gate approach (`_approachRouteGate`) when the first plan fails and a shut gate naming the NPC lies between the rooms. `gateOpened()` already clears the retry timer so the walk re-plans the moment the gate opens.
- `wantsToCrossGate(gate)` also answers true while a walk's remaining path crosses that gate, so `door-gates.js` turn-back and hold logic treat a walker like a route walker. A turn-back during a walk waits and retries until `timeoutMs`, then falls back (section 7).
- **Closed unlocked doors.** A walker within one tile of a closed, unlocked, non-gate door opens it with a new `openDoorForNpc(doorSprite)` in `doors.js`: the open animation and body off, the grid marked, no far-room load and no player transition. **[check]** whether a closed door body blocks an NPC body today (the route walkers may rely on `unlockRoom` actions to open sprites); if it does not, `openDoorForNpc` is visual only.
- The walk's speed overrides patrol speed through `goToAndStay`'s `speed`, restored on arrival as today.
- A seated NPC stands first (`goToAndStay` unseats). A hostile, conscious NPC is not walked (chase logic owns it): walk-out fades instead.
- Player in the way: the existing player-pass logic (`_tickPlayerPass`) applies, since a walk is a `goToAndStay`.

## 5. Reload and persistence

- `walkIn` records `visible: true` at the trigger, `walkOut` records `false` at the trigger, both through `recordNpcVisibility`, synced at once as `setVisible` is (`npc-manager.js:1822`). The section stays a bounded `{ npcId: bool }`; no new synced field, nothing grows. `walkOut` writes the record with a new `{ persistOnly: true }` option that leaves `entry.isVisible` true until the NPC is actually hidden, so systems that mirror `isVisible` onto the sprite (`npc-office-visuals.js:279`, health bars) do not hide a walker mid-walk. **[check]** every reader of `isHiddenByMapping` for a walker-out (the hostile music check reads it).
- A reload mid-walk-in shows the NPC at its scenario `position` (hence the rule that `to` is the position). A reload mid-walk-out leaves the NPC hidden.
- Deferred speech is not replayed after a reload mid-walk: the onceOnly record has been written and the triggering event will not fire again. Anything that must survive goes on an arrival mapping gated on a global, or in a server timer, as the CA kit already does (`kit_ca12_t_door`).
- **The route room is not loaded** (CA0's question, a reload mid step-away): a walk-in whose far room is not loaded loads it if it is unlocked (section 3 step 3), else uses the doorway fade. A walk on an NPC whose own room is not loaded (no sprite) is instant: the record is written, `npc_arrived`/`npc_left` fire with `how: 'instant'`, and deferred fields run at once (as `setVisible` behaves now).
- After a walk-out the hidden sprite is moved back to its scenario position and home room (`relocateNPCSprite` style), so a later `walkIn` or `setVisible` starts from home, not from the far room.

## 6. Door gates and lighting

- A walk may cross a gate only if the gate's `openFor` names the NPC. The gate opens by proximity as for any `openFor` NPC and holds for `holdMs` after the walker leaves the radius. The anti-tailgate rule is untouched: the walker opening the gate does not open it to a barred player.
- Camila stays on the lobby gate's `openFor` (CA0 1.7). Her walk-in crosses the gate from the lobby side, her walk-out from the studio side. Side-door gates depend on CA0's E1; until E1 lands, the ca12 lobby door is an ordinary unlocked door in the test scenario and in ca12, and the walk opens it with `openDoorForNpc`.
- Order of shared files with CA0 (`doors.js`, `door-gates.js`, `npc-behavior.js`, `npc-manager.js`, `office_kits/merrin_sallow.json`): agreed with CA0 before implementation; the gate-related part of this plan touches only `wantsToCrossGate` in `npc-behavior.js` and no line of `door-gates.js`.
- Lighting: no change. A walker into a motion room switches it on through `npcInRoom` (`lighting.js:1186`). `lighting.js:733` counts `initiallyHidden` NPCs as absent at load, which stays right.

## 7. Fade fallback

The fade is 400 ms of alpha on the sprite (and its seated or breathing images), tweened from and back to the style base so `npc-sprite-style.js:135` does not adopt a mid-tween alpha as its base. It runs in these cases only, each logged once with the reason:

1. **Doorway fallback, walk-in**: no usable far room (locked, will not load in 3 s, or a gate that does not name the NPC). The NPC starts on the near doorway mouth at alpha 0 and fades in as it walks to `to`.
2. **Doorway fallback, walk-out**: the same conditions on the way out. The NPC walks to the near doorway mouth and fades out stepping into the doorway.
3. **Timeout** (`timeoutMs`): no path, gate held, or stuck. Walk-in: if `to` is out of view, place there instantly; else fade in at the inside doorway mouth and walk the rest. Walk-out: fade out where the NPC stands.
4. **Hostile and conscious** at a walk-out: fade out in place.
5. **Explicit spawn tile in view** (section 3 step 5): fade in over the first 400 ms of the walk.

Instant (no fade, no walk): the NPC's room is not loaded, so nobody can see it.

## 8. Validator checks

In `scripts/validate_scenario.rb`, next to the `patrolOverride` checks (`:3965-3975`), and in `scripts/scenario-schema.json` (mapping properties, beside `patrolOverride` at `:5175`):

- Schema: `walkIn`/`walkOut` as `true` or the object form above; unknown sub-keys get the usual hint.
- ERROR: `walkIn` or `walkOut` with `setVisible` or `patrolOverride` in the same mapping; on a phone NPC; `from`/`to` naming a room not connected to the NPC's room; the door to it a gate whose `openFor` lacks the NPC; `to` tile outside the room or on a wall (the `patrolOverride` tile check).
- WARN: the door to `from`/`to` is locked and not a gate ("will fade at the doorway"); `walkIn.to` differs from the NPC's `position` ("a reload puts the NPC at position").
- WARN (pop check, new): `setVisible` in a mapping on `room_entered:<the NPC's own room>`, in a mapping that also has a `bark`, or `setVisible: false` on `npc_arrived:<self>` (the old walk-to-the-door-then-vanish pattern): "use walkIn/walkOut". Implementation runs it over every scenario first; if it reports more than about ten hits outside the three cases, it ships as INFO and the list goes to `docs/IDEAS_BACKLOG.md` as an audit item rather than failing anything.
- `scripts/validate_office_life.rb:301` (hint for hidden NPCs) and `lib/break_escape/owner_claim.rb:140` (`walkIn`/`walkOut` count as `scripted_move`, like `patrolOverride`).
- Index rule: the conversions below change mappings in place or retire them as inert placeholders; nothing is removed. Run `tools/check_mapping_index_drift.rb main` on m09, m10, ca12, its defend twin and `test_ca12_fallback`.

## 9. Converting the three cases

**m09 Dillard** (`scenarios/m09_digital_archaeology/scenario.json.erb`, `archive_guard`):
- Mapping 0: `setVisible: true` becomes `"walkIn": { "from": "loading_dock" }`. `conversationMode`/`targetKnot` stay; the line now opens when he reaches (3.5, 8). He comes up from the dock (Tran called building security), and the player is in `server_closet`, so the walk is mostly out of view, as intended: the stacks are where he waits.
- Mapping 1 (catch-up on `room_entered:open_stacks`): unchanged. With the visibility record it is a no-op today; it stays as a guard for old saves.
- Check that (3.5, 8) is reachable from the dock doorway on the grid (room dressing R4 moved it to clear the patrol turn).

**m10 monitor guard** (`scenarios/m10_full_disclosure/scenario.json.erb` ~4193):
- The bark mapping is unchanged. The `setVisible: false, delayMs: 3500` mapping becomes `"walkOut": { "to": "server_hall" }, "delayMs": 1500`. `core` is pin-locked; `server_hall` is the way out. The player usually entered from `server_hall`, so the guard walks past them to the west door (player-pass logic). The walk-out ends once he is through the door and off camera.

**ca12 Camila** (kit `office_kits/merrin_sallow.json` set piece `ca12_visitor`, regenerated into `scenarios/ca12_visitor_tailgater/` and checked in `scenarios/test_ca12_fallback/`):
- Kit `position` moves from (8.5, 2.5) to (6.5, 4.5), her arrival tile.
- Mapping 2: `setVisible: true` becomes `"walkIn": { "from": "lobby", "speed": 90 }`.
- Mapping 3 (the delayed `patrolOverride`): retired in place as an inert placeholder (the mapping-14 form), since the walk-in now carries her to (6.5, 4.5). Mapping 4 (`npc_arrived`, `owner !== 'needs'`) still fires on the walk-in's arrival.
- Mappings 7, 11, 12, 15 (`patrolOverride` to the door tile): become `"walkOut": { "to": "lobby", "speed": 90 }`, keeping their delays, globals and conditions.
- Mappings 8, 13, 16 (`npc_arrived` + `setVisible: false` + `setGlobal kit_ca12_done`): `eventPattern` becomes `npc_left:kit_camila_ospina` and `setVisible` is dropped; conditions and `setGlobal` stay.
- Mapping 17 (`kit_ca12_done` hides her): `setVisible: false` becomes `walkOut: { "to": "lobby" }`, so the 150 s timer sends her out instead of vanishing her; after 8/13/16 she is already hidden, so it is a no-op.
- Mappings 14 (placeholder) and 18 (needs resume) unchanged. No mapping is appended.
- Regen into scratch, confirm a no-change regen is byte-identical to HEAD first, then copy in only the changed files (CA0 section 0). Check the defend twin for the same set piece.

## 10. Test plan

Node unit tests (`test/js/`, plain `node` under `bin/test-js`; add any new static import to every harness copy list that copies `npc-behavior.js` or `npc-manager.js`):
- `npc-walk-view.test.mjs`: the in-view rule (sprite rectangle, margin, no camera, unloaded room) and the spawn search on a stub grid (nearest out-of-view cell, door skipped when locked or the gate lacks the NPC, the player-in-doorway rule, `"offscreen"`).
- `npc-walk-in-out.test.mjs`: the walk state machine on a stub behaviour (as `npc-behavior-arrival.test.mjs` does): records at trigger, `persistOnly` keeps `isVisible`, deferral of `conversationMode`/`bark` to arrival, `npc_arrived` data for walk-in, `npc_left` and no `npc_arrived` for walk-out, early end when out of view past the door, no-ops, walk-in cancelling a walk-out, every fallback branch in section 7 with its `how`, return to home after a walk-out, timeout.
- `npc-walk-mappings.test.mjs`: `npc-manager.js` mapping plumbing (fields copied at `:1537`, `setVisible` still works, deferred fields not run early).
- `npc-walk-gate.test.mjs`: `wantsToCrossGate` true for a walker whose path crosses the gate, false otherwise.
- Validator: a fixture test for each new ERROR/WARN, in the style of `door-gates-validator.test.mjs`.
- Ruby: `test/unit/owner_claim_test.rb` gains a `walkIn`/`walkOut` case.

Focused scenario `scenarios/test_npc_walk_in_out/` (with `mission.json`, ink, README, dungeon graph): a hub room with four doors (an unlocked room on the north, a locked room on the east, a gate room on the south naming the walker, an unloaded far room on the west), buttons (objects with `triggerOnInteract` setting globals) that fire: walk-in from each door, walk-out to each door, `"offscreen"` in a long room, explicit in-view tile, walk-in with a deferred conversation, a hostile walk-out, and a walk-in whose room is not loaded. Expected `how` per case is in its README.

Live browser proof on a keyless server from the worktree, port **3026** (3027 as the spare), never any other port; games made with `tools/playtest/new-game.rb`, driven only by ids created in that run; no `db:` tasks:
- `test_npc_walk_in_out`: screenshots at the trigger (NPC absent), mid-walk (NPC visible inside the doorway), arrival; and for each fallback. Reload mid-walk-in and mid-walk-out and screenshot the result.
- m09 on the `m01_maya_ko` branch with `tran_alerted` set in game (not by console where avoidable): Dillard walks in, then the line opens.
- m10 gallery with the camera blinded: bark, then he walks off west.
- ca12 step-away: Camila walks in through the lobby door, each exit choice walks her out, and a reload mid step-away.
- Then AGENTS.md "Verifying work": Rails suite, reopen check, `bin/test-js`, validator over every scenario, and a browser regression of `test_npc_visibility`, `test_gate_tailgate`, `test_npc_patrol_override`.

## 11. Exact file list

Created:
- `public/break_escape/js/systems/npc-walk.js` (view rule, spawn/exit search, walk state machine, fade; no static imports beyond what `npc-behavior.js` already pulls, so harness lists stay stable)
- `test/js/npc-walk-view.test.mjs`
- `test/js/npc-walk-in-out.test.mjs`
- `test/js/npc-walk-mappings.test.mjs`
- `test/js/npc-walk-gate.test.mjs`
- `test/js/npc-walk-validator.test.mjs`
- `scenarios/test_npc_walk_in_out/scenario.json.erb`, `mission.json`, `README.md`, `ink/test_npc_walk_in_out.ink` and its compiled `.json`, plus the generated `dungeon_graph.{json,md,html}`

Edited:
- `public/break_escape/js/systems/npc-behavior.js` (manager `walkNPCIn`/`walkNPCOut`; `wantsToCrossGate`; room-list wall colliders; `npcData.roomId` while walking; gate approach for a walk; `npc_arrived` data)
- `public/break_escape/js/systems/npc-manager.js` (mapping fields at `:1537`, handler beside `setVisible` at `:1982`, deferral, `recordNpcVisibility` `persistOnly`)
- `public/break_escape/js/systems/doors.js` (`openDoorForNpc`)
- `public/break_escape/js/systems/test-bridge/` (the file that exposes NPC helpers: `walkIn`/`walkOut` for the live proof) **[check]** exact file name
- `scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `scripts/validate_office_life.rb`
- `lib/break_escape/owner_claim.rb`, `test/unit/owner_claim_test.rb`
- `scenarios/m09_digital_archaeology/scenario.json.erb`
- `scenarios/m10_full_disclosure/scenario.json.erb`
- `planning_notes/phishing_and_social_engineering/awareness/office_kits/merrin_sallow.json`, and the regenerated `scenarios/ca12_visitor_tailgater/scenario.json.erb`, its defend twin if it carries the set piece, and `scenarios/test_ca12_fallback/scenario.json.erb`
- Test harness copy lists in `test/js/` that copy `npc-behavior.js` or `npc-manager.js`, if `npc-walk.js` is imported statically
- Docs: `docs/IDEAS_BACKLOG.md` (close the ca12 Camila item; add the pop-check audit list and m10 `farah_guard`), `README_scenario_design.md` (eventMapping reference: `walkIn`/`walkOut`, the "no pop" rule), `docs/agents/VALIDATOR_DECISIONS.md` only if a known-failure entry is needed

Not edited: `door-gates.js`, `lighting.js`, `state-sync.js`, server `game.rb`/`games_controller.rb` (the synced section is unchanged).

## 12. Open questions (recommended default in brackets)

1. Load an unlocked far room just so an NPC can walk in from it, or fade at the doorway? [Load it, as route preload does; fade only if locked or slow.]
2. Can the player talk to an NPC who is walking out? [No: clicks get nothing while leaving; a walk-in NPC is talkable once arrived.]
3. Dillard's entry door: `loading_dock` (south) or `reading_room` (west)? [`loading_dock`: building security arrives from the staff entrance.]
4. m10 guard's exit: `server_hall` past the player, or a doorway fade at the locked `core` door? [`server_hall`.]
5. Deferred speech lost on a reload mid-walk: acceptable, or persist a pending flag? [Acceptable; no new synced state.]
6. Ship the pop check as WARN or INFO? [Decide on the hit count; INFO if more than about ten outside the three cases.]
