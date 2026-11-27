# CA engine review: E4 actions on event mappings, round 1

Commit: `76956ae9d` "E4 engine: mapping actions, remove_world_item, start_patrol/resume_patrol, action key table and validator (tests pending)"
Spec: `CA_PILOT_MECHANICS_PLAN.md` E4 (lines 131-137), test list (442), ca12 NPC table (1.3), ca15 take-back (379, 389); `tmp/handover/ca0/ca12_shell_todo.md`, `ca15_shell_todo.md`.
Reviewer: Opus 5.5, 2026-11-26. Code not edited, nothing run in a browser; findings are from reading the code and one validator sweep over `scenarios/*/scenario.json.erb`.

**Totals: 1 B, 3 M, 7 m**

The mapping half matches the spec. `actions` is copied in `_buildMappingConfig` (`npc-manager.js:1537`) and run in `_handleEventMapping` (`:1929-1940`) after `_mappingWouldFire` (condition, onceOnly, maxTriggers, cooldown), after the `endingCheck` hold, and after the `_reconcile` early return (`:1843`), so a reconcile re-announce does not replay a toast or a take-back. A `delayMs` mapping reaches the same code once, when the delay is up. Each action's own `condition` is read in `applyActions` (`apply-actions.js:218-221`). A mapping without `actions` is unchanged. The key table matches the `apply-actions.js` case labels exactly (every label is a key; `unlock_task` and `unlock_aim` are the only extra keys, marked `tableOnly`), and `hint` reads `message`, `remove_item` reads `item`, as the table says.

`remove_world_item` follows the plan and the `npc-needs.js:6214-6221` magnet pattern. The server side is safe to repeat: `Game#remove_item_from_room!` (`game.rb:1256-1292`) answers true without a write when the id is already in `objects_removed`, false without a save when the room never held it, and the controller answers 403 before the model for a locked room (`games_controller.rb:1092`). So `objects_removed` grows by at most one id per room, once; nothing is re-sent. An NPC-carried stick is already out of `rooms[rid].objects` (`npc-needs.js:5876`), so the action is a no-op on it, as the plan says. The needs world re-reads the item each tick (`npc-needs.js:3585-3586`), so a finder walking to a stick that is taken back aborts with `item_gone`.

The `start_patrol` / `resume_patrol` design (a deep copy of the parsed patrol at construction, `_authoredPatrol`, restored by `restartAuthoredPatrol`) is the right shape: `goToAndStay` overwrites `config.patrol.waypoints` with its one target (`npc-behavior.js:3625-3632`), so without a snapshot there would be nothing to go back to. The snapshot is taken after `parseConfig` validated and converted the waypoints, so they are world coordinates. `startDeferred` reuses the auto-enable path so validation still runs, then turns the patrol off. It does not yet fit Jun's stop or the needs and walk systems (B1, M2).

## Blockers

**B1. A `patrolOverride` does not stop a multi-room route walker, so Jun's loop cannot be ended as the plan describes.**
Plan 1.3 ends Jun's loop "on `ca12_world_done`, a `patrolOverride` back to his desk". E4 gives Jun a `multiRoom` route (started by `start_patrol`) and leaves the stop to `patrolOverride`. `goToAndStay` (`npc-behavior.js:3566-3647`) sets `config.patrol.waypoints = [target]` and `_stopOnArrival`, but leaves `patrol.multiRoom` and `patrol.route` alone. The next target comes from `chooseWaypointTarget` (`:2226-2231`), which takes the multi-room branch whenever `multiRoom && route.length`, with no `_stopOnArrival` check, so `chooseWaypointTargetMultiRoom` (`:2322`) picks the next route waypoint, not the desk. When that leg's path runs out, `:1539-1542` fires `_triggerGoToStayArrival` at the route waypoint: Jun stops wherever the route was heading (possibly the lobby side of the gate), and `npc_arrived:ca12_jun_watanabe` fires there. A pending route action (`_pendingRouteAction`, `_routeUse`, `_routeWait`, `_useHeld`) is not cleared by `goToAndStay` either, so a stop that lands mid badge-tap first finishes the `useObject`. No scenario today puts a `patrolOverride` on a route walker (`grep` over `scenarios/`: the six `multiRoom: true` scenarios carry none), so this has never been exercised. The same path runs for a needs or walk-in `goToAndStay` on a route walker.
*Fix:* in `chooseWaypointTarget` take the single-room branch while a move is in flight: `if (!this._stopOnArrival && this.config.patrol.multiRoom && ...)`. In `goToAndStay`, clear `_pendingRouteAction`, `_routeWait`, `_routeUse` and `_useHeld` (as `restartAuthoredPatrol` does). Check `wantsToCrossGate` / `_approachRouteGate` (`:2703-2760`) read the route only when no move is in flight, so a stop through an active gate is not turned back by the route's segment logic. Unit test: a two-room route walker mid-route, `goToAndStay` to a tile in the other room, assert the next target is that tile and that `npc_arrived` fires within a tile of it; then `resume_patrol` puts it back on the route at the segment of the room it stands in. A simpler alternative for ca12 alone is a `stop_patrol { npc, at? }` action, but the `goToAndStay` fix also covers needs and walk-in moves on route walkers, so prefer it.

## Majors

**M1. A started patrol is not saved: after a reload a `startDeferred` NPC stands still again.**
`start_patrol` changes only `config.patrol` in memory (`npc-behavior.js:799-830`). Nothing records it in player_state, and on reload `parseConfig` turns the patrol off again (`:790`). The mapping that started it is a `global_variable_changed` mapping and the global is restored without a change event, so it does not fire again. For ca12 this happens not to matter if the reload settles the world hold at `game_loaded` (`ca12_shell_todo.md`, "the reload settles the hold"), since Jun is meant to stand at his desk afterwards anyway. Any other shell that starts a patrol on a lasting global (a guard who starts walking once an alarm global is set) gets a frozen NPC after a reload, and no validator line warns. The plan's ground rule (section 0) is reload-correct state with deltas only, and this needs no synced state at all.
*Fix:* make the start declarative: `patrol.startWhen: "<condition>"` (the `utils/global-condition.js` grammar), read once when the behaviour is built (after the restored globals are in, which `game_loaded` ordering already guarantees for registered NPCs) and again on each `global_variable_changed` for a global the condition names; when it holds the first time, call `restartAuthoredPatrol`. Keep `start_patrol` for one-off starts and say in its comment and the schema description that it does not survive a reload. Jun then carries `startWhen: "globalVars.ca12_runner_go && !globalVars.ca12_world_done"`. If that is more than E4 should take on, at least add a validator warning when a `start_patrol` action sits on a mapping whose event is `global_variable_changed:*`, pointing the author at reload behaviour, and record the gap in the plan's E4 text.

**M2. `start_patrol` / `resume_patrol` fight the needs system, the seating fetch and a walk-in or walk-out.**
`restartAuthoredPatrol` (`npc-behavior.js:800-830`) calls `unseatNPC` and `cancelMove` and then enables the patrol. It does not tell the systems that own the move:
- *Mid-need.* `goToAndStay` from a script calls `window.npcNeedsSystem.onExternalMove` (`:3608`), which aborts the job and sets `scriptSuspended` (`npc-needs.js:802-812`). `restartAuthoredPatrol` does not, so the needs state stays in its walking or using phase and re-issues its `goToAndStay` (the 3 s re-issue), which overwrites `config.patrol.waypoints` and wins. The `resumePatrol` guard (`:402`) also reads a needs move as "still on it": a needs `goToAndStay` sets `patrol.enabled = true` and leaves `_patrolOverridden` false, so `resume_patrol` returns false during any needs walk.
- *Seating.* `goToAndStay` also calls `seating.cancelFetch` (`:3568`); `restartAuthoredPatrol` does not, so a chair fetch in flight can re-issue its move.
- *Walk-in / walk-out (VID1, d8ff8d580).* `cancelMove` ends the walk's `goToAndStay` but the walk record stays in `manager.walks` with `behavior._walk` set (`npc-walk.js:410`). The walk tick then sees no progress and calls `onStall`/`onTimeout` (`npc-walk.js:816-866`), which call `cancelMove` again (turning the patrol off, `:3668`), re-issue the walk, or on a walk-out fade and `setNPCVisible(false)`. A route walker also keeps crossing gates as a walker while `_walk` is set (`npc-behavior.js:2703-2730`).
- *Same mapping.* In `_handleEventMapping` the `actions` block (`npc-manager.js:1929`) runs before `patrolOverride` (`:1956`), `setVisible`, `walkIn` and `walkOut` (`:1995-2025`). A mapping that carries both `resume_patrol` and `patrolOverride` for one NPC (the natural way to write Yusuf's mapping 8: "back to his post and the patrol restarts") ends with the override, so Yusuf stands at the post. A `start_patrol` beside a `walkIn` loses to the walk's move the same way.
None of these touch ca12 today (Yusuf and Jun have no needs, no walk-in, no seat yet; Jun's seat is a pending dressing decision), but the actions are general and nothing stops an author.
*Fix:* in `restartAuthoredPatrol`, before `cancelMove`: call `window.npcNeedsSystem?.onExternalMove?.(this.npcId, 'patrol')` and `window.seating?.cancelFetch?.(this, 'move:patrol')`, as `goToAndStay` does. If `this._walk` is set, refuse with a warning and return false (or end the walk through a new `manager.endWalk?.(id)` if one is added). Change the `resumePatrol` guard to `if (!b._patrolOverridden && b.config.patrol.enabled && !b._stopOnArrival) return false`, so any in-flight move counts as off-patrol. For the same-mapping order, either move the `actions` block after the walk fields (around `npc-manager.js:2026`) and say so in its comment, or add a validator error when one mapping has `patrolOverride`, `walkIn` or `walkOut` and a `start_patrol`/`resume_patrol` naming the same NPC. Moving the block is the smaller change and also lets a `hint` follow a `setVisible`; check nothing in the CA shells relies on the current order first (none carries `actions` yet). For Yusuf, the shell should drop mapping 8's `patrolOverride` and put `resume_patrol` there: the restart begins at waypoint 0, which is his post (`ca12_shell_todo.md`, post (1.5, 3.5)).

**M3. The take-back can race a drop that is still being saved, and can put the stick back in the tray.**
`dropItem` adds the sprite to `room.objects` before the save (`item-drop.js:477`) and saves in `persistDrop` (`:361-390`): first `add_object`, then the inventory remove. When the texture is not loaded yet, `place()` waits on it, and a sprite destroyed in that window is handed back to the inventory (`returnToTray`, `item-drop.js:528-533`). `remove_world_item` destroys the sprite and posts `remove_object` at once (`apply-actions.js:478-486`):
- texture still loading: the stick goes back into the tray, after the same list's `remove_item` has already run (ca15 lists `remove_item` before `remove_world_item`), so the learner ends up holding the stick;
- save in flight: the `remove_object` POST can reach the server before `add_object`, is answered false, and the `add_object` then lands; after a reload the stick is drawn again.
ca15's backstop and timeout paths set `ca15_drop_done` while the learner can be mid-drop, so this is reachable, if rarely.
*Fix:* when the sprite has `_dropSync`, wait for it before destroying and posting: `Promise.resolve(sp._dropSync).finally(() => { destroy; removeItemFromRoom })`. In ca15, order the list `remove_world_item` before `remove_item`, or have `remove_world_item` run a `remove_item` for the same id after its wait. Unit test with a stub `persistDrop` that resolves late.

## Minors

**m1. `restartAuthoredPatrol` can turn a rejected route into a random wander.** The "authored" check (`npc-behavior.js:802`) accepts `snap.route?.length`. When `validateMultiRoomRoute` rejects a route it sets `multiRoom = false` but leaves `route` (`:906-997`), so the snapshot passes the check, the patrol is enabled with no waypoints, `_isWaypointPatrol()` is false, and `chooseRandomPatrolTarget` runs. *Fix:* check `(snap.multiRoom && snap.route?.length)` in place of `snap.route?.length`.

**m2. `resume_patrol` silently starts a patrol that was never started.** For a `startDeferred` NPC before its `start_patrol`, `patrol.enabled` is false, so the guard at `:402` passes and the patrol starts. That blurs the two actions (an early `resume_patrol` for Jun would start his loop before `ca12_runner_go`). *Fix:* in `resumePatrol`, return false with a warning while `b.config.patrol.startDeferred` is still true; say so in the comment at `apply-actions.js:491-495`.

**m3. The validator does not check that a patrol action can do anything.** `start_patrol`/`resume_patrol` only check the NPC id exists (`validate_scenario.rb:3352-3354`). Add: the named NPC has `behavior.patrol` with waypoints, a `multiRoom` route or bounds (else the action is a runtime warning only); a `startDeferred: true` patrol that no `start_patrol` action in the scenario names (the NPC never moves) is a warning; a `startDeferred` NPC that also has `needs` is a warning until M2 is fixed. The `npc_ids` collector (`:3297`) also counts any hash with a `behavior` key, which is wider than NPCs; read `npcs` arrays and room `npcs` instead if that gives a false pass.

**m4. Client-only actions inside a mapping.** `applyActions` is called with no `gameId` (`npc-manager.js:1935`), and `unlock_door` persists only for `source === 'flag_reward'` (`apply-actions.js:285-300`). An author who writes `{ "type": "unlock_door", "room_id": ... }` in a mapping's `actions` gets a door that opens until the next reload, while the mapping's own `unlockDoor` field saves through the server (`npc-manager.js:1900-1906`). The same holds for `unlock_object` (no server persist without a `gameId`) and `complete_task` (the mapping field sequences the requests; the action does not). *Fix:* a validator warning in mapping `actions` for `unlock_door`, `unlock_object` and `complete_task`, naming the mapping field to use instead.

**m5. Actions can run twice around a reload or a dropped ring, which the comment does not say.** A onceOnly mapping that opens a conversation is saved only when the chat closes (`npc-manager.js:1774-1787`), so a reload mid-chat lets it fire again and its `actions` run a second time. A ring mapping's `setGlobal` is rolled back when `ringWhile` drops the ring (`:1804-1815`), but its actions are not. The take-backs and `take_off` are idempotent; a `hint` shows twice, and a `give_item` would give twice. *Fix:* say both in the comment at `:1929-1932` and in the schema description, and warn in the validator on `actions` together with a `ring` or a conversation-opening `conversationMode` when the list has `hint` or `give_item`.

**m6. The `remove_world_item` comment is not quite right.** `apply-actions.js:462-470` says a room that never held the item gets `success: false`. A room the learner has not unlocked gets a 403 first (`games_controller.rb:1092`), and `removeItemFromRoom` still logs its warning. Harmless, but the live-proof notes expect "one warning per room without the item", so name the 403 too. Also say that an NPC-carried stick is out of `room.objects` and so is not taken (the plan's "no-op when Joanne holds it" depends on `npc-needs.js:5876`).

**m7. Older lists: what the new check skips and adds.** The walker skips `minigameData` and `flagRewards` (`validate_scenario.rb:3366`). `flagRewards` are `applyActions` lists (`flag-station-minigame.js:1025`), so they get no key check; say why in the comment (if the server shape differs) or include them as warnings. The new `set_global` "not a declared global" line is a warning on every list, old ones included; the sweep below shows what it adds.

## Validator sweep

`ruby scripts/validate_scenario.rb <erb> --no-graph --skip-ink --no-lint` over every `scenarios/*/scenario.json.erb`, keeping only lines from `check_action_keys`:

219 scenarios. The strict mapping check reports nothing (no scenario carries a mapping `actions` list yet). The older lists produce one line in total: `demo_access_tour` `rooms/reception/objects[8]/triggerOnInteract[0]` sets `hub_stick_accepted`, which is not a declared global. That looks like a real gap in that scenario (not checked here: whether an undeclared global syncs and restores like a declared one), so it is signal rather than noise. No missing-key or unknown-key findings anywhere, so the key table's optional keys match what existing scenarios write. The ca12 and ca15 shells validate as before (ca15 spot-checked: no `check_action_keys` lines; its `unknown field` warnings for `askCue`/`whenPerceivable` are a pre-existing schema gap in `definitions/eventMapping`, not E4).

## Cheat resistance

No new server surface. `remove_world_item` uses the existing `update_room` `remove_object` request, which the client could already send for any unlocked room, and the server checks the room and the item. `start_patrol`, `resume_patrol` and `hint` are client display only. A client that skips the take-back keeps a red-team stick into the defend half; that unlocks nothing honest play could not reach, so under the policy (server enforces secrets, keys and forged items; control-flow steps stay best-effort) this is accepted. Nothing here needs a server change.

## Server sync

No new player_state field. `remove_world_item` writes one id into `room_states[room].objects_removed` per room, once, server side; repeats write nothing. Patrol state is not synced at all (M1 is the consequence). `take_off` and `remove_item` use their existing paths.

## Tests the unit tests must cover

Mapping actions (`npc-manager.js`):
1. A mapping with `actions` runs `window.applyActions` once with `source: 'event_mapping'` when it fires, and not when its condition, `onceOnly` (second firing), `maxTriggers` or cooldown blocks it.
2. A `delayMs` mapping runs its actions once, after the delay, and not if the condition stops holding by then.
3. A `_reconcile` firing runs no actions; an `endingCheck` mapping runs them only on the confirmed re-run.
4. A mapping without `actions`, and one with `actions: []` or a non-array, behaves as before.
5. Each action's own `condition` is honoured (one true, one false in one list).
6. With M2's order change (if taken): `resume_patrol` and `patrolOverride` in one mapping, and the result the fix chooses.

`remove_world_item`:
7. Loaded room: sprite and proximity ghost destroyed, key deleted, one `removeItemFromRoom(rid, id)` per named room.
8. Not loaded (no `rooms[rid]`): no throw, the POST still goes.
9. No `roomId`/`roomIds`: one call per declared room, deduplicated.
10. Absent everywhere, picked up, NPC-carried (no entry in `room.objects`): no sprite touched, no throw.
11. Missing or non-string `item`: warning, nothing sent.
12. After M3: a drop whose `_dropSync` is still pending is removed only after it settles, and the stick does not come back to the tray.
13. Server (`game_test.rb` or controller test): `remove_item_from_room!` for a `player_drop` the client never picked up returns true and leaves no `objects_added` entry (the plan's open check); a second call writes nothing; a room that never held it returns false without saving.

`start_patrol` / `resume_patrol` (`npc-behavior.js`):
14. `startDeferred: true`: built with the patrol off and validated waypoints in `_authoredPatrol`; a reveal (`setNPCVisible(true)`) does not start it; `start_patrol` does.
15. `resume_patrol` after a `patrolOverride` arrival restores the authored waypoints (not the override's single waypoint) from index 0 and the authored speed; with `speed` given, that speed.
16. `resume_patrol` while still on the patrol returns false and changes nothing.
17. Seated NPC: `start_patrol` unseats it.
18. Multi-room route: restart picks the segment of the NPC's room; and B1's override-then-resume case.
19. After M2: mid-need (needs suspended, no re-issue wins), mid-walk-in (refused or ends the walk), mid chair fetch.
20. Unknown NPC id, NPC with no authored patrol: warning, false, no throw.

Validator:
21. In a mapping's `actions`: `{ "type": "hint", "text": ... }` and `{ "type": "remove_item", "itemId": ... }` are errors; a correct list passes; `condition` and `_`-prefixed keys pass; an unknown type is an error; `confirm_action.onConfirm` is checked recursively.
22. The same mistakes in `triggerOnInteract` are warnings, not errors.
23. `remove_world_item.item` not droppable, and an undeclared `roomId`, are reported; a declared droppable passes.
24. `start_patrol` naming an undeclared NPC is reported.
25. The drift test both ways (already in `test/js/action-key-table.test.mjs`).
26. A sweep test, or a fixture run, that existing scenarios gain no new errors.

Live proof (per the real-path rule): the `test_episode_world_beat` run already planned (section 3) for the take-back, plus one run of a route walker started by `start_patrol` and stopped by a `patrolOverride` (B1), before the ca12 shell relies on either.
