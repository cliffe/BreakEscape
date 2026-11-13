# Gated-door tailgating: a server check (plan)

Scope: make the credit for passing a gated `openFor` door a fact the server establishes, not a
client control a tampered client grants itself. The player may still stand wherever the client
puts the avatar. What the server owns is whether the pass was earned, and whether the room's
contents open. No code here; this is the plan the implementation works from. Every code claim is
pinned to a file and line at the current tree.

## 1. The weakness as it stands

A gated room is opened, and the tailgate credited, in the player's browser.

1. An NPC on a route (the lab's Len) runs a route waypoint `action.unlockRoom`
   (`scenarios/lab_physical_pentest/scenario.json.erb:1601`). Its behaviour calls
   `NPCGameBridge.unlockDoor`, which POSTs `/unlock` with `method: npc`
   (`public/break_escape/js/systems/npc-behavior.js:1999-2001`).
2. `validate_unlock` (`app/models/break_escape/game.rb:3050`) accepts it: for `method: npc` it
   returns `npc_mapping_unlocks_door?(npc_id, target_id)` (`game.rb:3077-3080`, defined at
   `game.rb:3478`), which is true because Len carries an `unlockDoor: secure_area` eventMapping
   (`scenario.json.erb:1640`, a never-firing `eventPattern: len_never_fires` mapping that exists
   only to grant this permission). No gate, position or credential check.
3. The `unlock` action's door branch calls `serve_opened_room(target_id)`
   (`app/controllers/break_escape/games_controller.rb:1140`), which calls `unlock_room!`
   (`game.rb:116`). From then on `secure_area` is in `unlockedRooms`, so `GET room/<id>` serves it
   (`games_controller.rb:526-544`) and a `sync_state` with `currentRoom: secure_area` is accepted
   (`merge_last_write_wins_sections`, `games_controller.rb:2094-2101`). The room is server-open
   for the player the moment Len's route runs, before the player has worn a disguise or cloned a
   badge.
4. The credit is client-written. In the lab the two findings are plain declared globals set by
   event mappings: `kp_badge_tailgated` at `scenario.json.erb:915`
   (`room_entered:secure_area` with `len_at_door` and `courier_ready`) and `kp_records_cloned` at
   `:932` (`door_gate_player_opened`), each also completing the manual task `tailgate_in`, with
   `room_entered:secure_area` backstops at `:728` and `:729`. All are ordinary globals and a
   manual task, so a tampered client sets either with one `sync_state` and completes `tailgate_in`
   with one `complete_task`, without going near the door.

The client gate (`public/break_escape/js/systems/door-gates.js`) is a sound presentation control:
it bars an honest player until a guard holds the door or the player's credential opens it. It
proves nothing to the server. The weakness is on the shared trunk; it is not a regression from any
one branch.

## 2. What the server can and cannot observe

The server never sees the physical gate animation, and it holds no NPC positions: NPCs are
simulated in the client, so "I walked in behind Len" is not an observable fact server-side. What
the server does own, and can check:

- **Which rooms entered `unlockedRooms` through a server-checked unlock.** Len's route unlock is
  checked by `npc_mapping_unlocks_door?` (`game.rb:3478`); the player's own credential unlock is
  checked by `validate_unlock` (`rfid_lock_passes?`, `game.rb:2539`, for an rfid door;
  `has_key_in_inventory?`, `game.rb:252`, for a key door).
- **Which globals are server-owned and true.** A worn costume global such as `courier_ready` is
  written only by `POST /wear` and is read-only to `sync_state`
  (`wearable_read_only_globals`, `app/models/break_escape/wearables.rb:38-42`; the read-only union
  applied in `merge_global_variables!`, `game.rb:340`). Imported globals are server-held
  (`imported_global_names`, `app/models/break_escape/carry_over.rb:70`). A named server-set global
  such as `se_captures` is in `SERVER_OWNED_GLOBAL_NAMES` (`game.rb:1798`) and dropped from every
  client write (`game.rb:337`).
- **Which cards the player holds** (`held_inventory_item`, `wearables.rb`; `card_ids` passed to
  `validate_unlock`).

So the server can prove the pass was *earned*, not that the avatar reached a pixel. Two provable
passes, and one unprovable case:

- **Credential pass.** The player presents the room's `requires` card at the gate. The clone path
  already POSTs `notifyServerUnlock(doorSprite, 'door', 'rfid')`
  (`public/break_escape/js/systems/doors.js:693`), so `validate_unlock` sees it as a `method: rfid`
  door unlock and `rfid_lock_passes?` checks it against the cards the server knows are held. The
  lab's `cm_records_badge` is reachable through an `rfid_cloner`; `test_gate_tailgate`'s
  `test_staff_badge` likewise.
- **Server-owned pass global.** `playerMayPassIf` names a global the server owns, so its truth
  means the player earned the disguise through a server-checked act. `courier_ready` is worn and
  server-owned, so it qualifies.
- **Pure holds-doors tailgate (unprovable).** A gate with no `playerMayPassIf` and whose room's
  `requires` the player can never obtain (no cloner) has nothing the server could check. These
  gates stay presentation-only (section 6).

## 3. The server model

Keep the record of a room an NPC's badge opened apart from the record of a room the player has
*earned*. The player may stand in either; only the earned one credits the pass and opens the
room's contents to collection. Entry is never refused, which preserves the lab's designed no-vest
slip-in (the player follows Len in, earns nothing, Len re-challenges and Ruth sends them back out),
and keeps the saved `currentRoom` in step with the avatar so there is no snap-back.

### 3.1 A new list, and which gates split

- `player_state['npcRouteRooms']` (array of room ids): a room an NPC route opened for the player
  but not yet earned. Defaults to `[]` on first read.
- A gate **splits** (its NPC route unlock records the room in `npcRouteRooms` rather than
  `unlockedRooms`) only when a provable path into it exists: its `playerMayPassIf` is a
  server-owned global, **or** the room's `requires` is a card the player can obtain (a cloneable
  card with an `rfid_cloner` present). A gate with neither does **not** split: it stays
  client-trusted and uncredited exactly as today, because the server could check nothing and there
  is nothing to forge (it credits no server-owned global and gates no server outcome).
- Two helpers, because the two paths key on different things:
  - `gated_route_room?(npc_id, room_id)` (NPC-keyed): true when a scenario `doors[]` entry has
    `connectedRoom == room_id` and a `gate.openFor` naming `npc_id`, and the split condition holds.
    Selects only the `method: npc` route branch.
  - `split_gated_door?(room_id)` (door-keyed, attempt-independent): true when the room's door has a
    `gate.openFor` and the split condition holds. Selects the credential branch (3.3b), where the
    `method: rfid` unlock carries `attempt: null` and the NPC-keyed helper would never match.

### 3.2 Serving the room

- `GET room/<id>` (`games_controller.rb:506-544`) serves a room in `unlockedRooms` **or**
  `npcRouteRooms`, so Len's own passage and an honest player who walks up to the room still load
  it. The accessibility check at `:533` gains the second list. A served room is not an earned
  room: this exposes the route room's objects and NPCs to an un-promoted (possibly tampered)
  client, which is the accepted caveat that a gate keeps a player out, not a secret. Collection
  stays blocked (3.3), so nothing can be taken.
- The auto-unlock on room access (`games_controller.rb:539-541`) must not promote an
  `npcRouteRooms`-only room. Its guard at `:539` is `if !is_unlocked`, and `is_unlocked` at `:526`
  reads only `unlockedRooms`, so without a change it would append the route room to `unlockedRooms`
  on the first `GET`. Guard it: do not auto-add a room that is in `npcRouteRooms` and not already in
  `unlockedRooms`.

### 3.3 Two provable paths, credited at two server events

The two paths reach the server as two different events, so each is credited where it happens.

**Promote** means, for either event: `unlock_room!` the room, delete its id from `npcRouteRooms`
(keep the two lists disjoint, or "in `npcRouteRooms` means unearned" misfires after promotion), and
apply the path's `creditOnPass` block (3.4). Each earn check is gated on
`!room_unlocked?(room_id)`, so a room already opened by one path is never re-credited by the other.

#### 3.3a Pass-global path, on `currentRoom`

In `merge_last_write_wins_sections` (`games_controller.rb:2094`), accept `currentRoom` for a room in
`npcRouteRooms` exactly as for an unlocked room (extend the guard at `:2096-2098`), so the avatar
and saved room agree and the slip-in works. Then, if the room is in `npcRouteRooms` and not in
`unlockedRooms`, run the pass check: the gate's `playerMayPassIf` is a server-owned global and is
true. **Server-owned** is the runtime predicate "the name is in
`worn_global_names + imported_global_names + SERVER_OWNED_GLOBAL_NAMES`"
(`wearables.rb:26`, `carry_over.rb:70`, `game.rb:1798`), the same set a client `sync_state` cannot
write. On a pass, promote with the `viaPass` block. On a fail, accept the room and do nothing else;
item collection reads `unlockedRooms` and the room stays locked, so the honest no-vest slip-in
stands in the room, collects nothing, is credited nothing, and is turned round by the ink as
designed.

`sync_state` loads the row with `SYNC_STATE_COLUMNS` only (`games_controller.rb:2022`, no
`scenario_data`), so reading `@game.scenario_data` there raises. The pass check needs the gate's
`playerMayPassIf` name and the `creditOnPass.viaPass` block, which live only in the scenario door.
Load them on the sync path with a targeted `pick`, the pattern this path already uses for the
start-room check (`Game.where(id: @game.id).pick(Arel.sql("scenario_data->>'startRoom'"))`,
`games_controller.rb:2097`) and for `worn_global_names` (`wearables.rb:33`). Read the door blob once
and reuse it for the credit derivation (3.4) in the same request.

#### 3.3b Credential path, in the `unlock` action

In the `unlock` action's door branch (`games_controller.rb:1139-1148`), select the credential path
with the door-keyed `split_gated_door?(target_id)`, independent of `attempt`. When that door is
being unlocked by its own `requires` credential (`validate_unlock` already true for `method: rfid`
via `rfid_lock_passes?`, `game.rb:2539`, the shipped case for both split rooms which are
`lockType: rfid`; or `method: key` via `has_key_in_inventory?`) and the room is not yet in
`unlockedRooms`, promote with the `viaCredential` block there. `serve_opened_room` still runs; the
added step is the `creditOnPass.viaCredential` write, the `npcRouteRooms` delete, and a `save!`
after the credit write (a `viaCredential` block that sets a global but completes no task would
otherwise not persist, since only `complete_task!` saves at its tail). This credits the clone the
moment the server validates the badge, whether or not Len's route has already recorded the room,
and covers `test_gate_tailgate`'s `test_staff_badge` unlock.

### 3.4 The credit, set and owned by the server

Add an optional `creditOnPass` on the gate, with a block per provable path:

    "gate": { "openFor": ["len"], "playerMayPassIf": "courier_ready", "openRadius": 72,
              "holdMs": 2500,
              "creditOnPass": {
                "viaPass":       { "setGlobal": { "kp_badge_tailgated": true }, "completeTask": "tailgate_in" },
                "viaCredential": { "setGlobal": { "kp_records_cloned":  true }, "completeTask": "tailgate_in" } } }

At promotion the server applies the block for the path that passed: it sets the named globals and
completes the named task. This reproduces the lab's two distinct findings (hi-vis tailgate and
cloned badge), both completing `tailgate_in`.

**Making the credit globals server-owned (the teeth).** A plain declared global is not read-only:
`merge_global_variables!` (`game.rb:332`) protects only
`SERVER_OWNED_GLOBAL_NAMES + imported_global_names + wearable_read_only_globals` (`:337`, `:340`),
so a client `sync_state` to `kp_badge_tailgated` would otherwise write straight through. Mirror the
wearables mechanism on both sides:

- **Read-only list.** Derive `player_state['serverCreditGlobals']`, the distinct names in every
  gate `creditOnPass.*.setGlobal`, and union it into `read_only` at `game.rb:340`. A game with no
  stored list (made before this field) derives it from its own scenario snapshot and memoises into
  `player_state` without `save!`, the way `worn_global_names` does (`wearables.rb:33-34`), so the
  derivation is safe on the read path. On the `sync_state` path the row carries no `scenario_data`,
  so read it on its own there with a `pick`, as `worn_global_names` does.
- **Write side.** The server's own `creditOnPass` write bypasses the read-only check by writing
  through `write_server_globals!` (`wearables.rb:136-139`), straight to
  `player_state['globalVariables']`, not through `merge_global_variables!` (which would drop its own
  write). Every client `sync_state` to those names is dropped; only this path sets them.

The lab's Ruth debrief still reads `kp_badge_tailgated` and `kp_records_cloned` in ink
(`scenario.json.erb:678-679`), now true only because the server set them.

### 3.5 `validate_unlock` keeps its boolean contract

`validate_unlock` returns a boolean, consumed as one at `games_controller.rb:1103`, and
`serve_opened_room(room_id)` always calls `unlock_room!`. So the route-room split must branch in the
controller `unlock` action, not inside `serve_opened_room` or `validate_unlock`. For a split route
room reached by `method: npc`: validate as now (still returns true), but before calling
`serve_opened_room`, record the room in `npcRouteRooms` and return the served room data without
`unlock_room!`. Select the branch with `@game.gated_route_room?(attempt, target_id)` **and**
`!@game.room_unlocked?(target_id)`: after promotion the room is unlocked, and on reload the gate is
rebuilt shut so Len re-walks and re-POSTs `method: npc`, where `validate_unlock` returns true early
via `room_unlocked?` (`game.rb:3055-3058`). The `!room_unlocked?` guard stops a re-fired route
unlock re-appending an already-earned room and breaking the two-lists-disjoint invariant. Every
existing caller's boolean contract is untouched.

## 4. What the client sends, what the server checks

- **Client, unchanged in shape.** Len's route still POSTs `/unlock method: npc`; the player's
  passage still arrives as `sync_state` with `currentRoom`; the clone still POSTs
  `/unlock method: rfid` (`doors.js:693`). No new field is required; the server decides from its own
  state.
- **Server checks, by event.** On a `currentRoom` for an `npcRouteRooms` room: accept the room,
  then if `playerMayPassIf` is server-owned and true, promote via `viaPass`. On a `method: rfid` or
  `key` unlock of a split gated door whose `requires` the player holds: promote via `viaCredential`.
  On fail, leave it a route room. Everything read (inventory, server-owned globals) is server-held.
- The client gate (`door-gates.js`) is unchanged. It still bars the honest player and still opens
  for a held credential or an honest pass. It is now backed by a server check of the credit, not the
  whole of the control. The credit globals the client reads (for its own presentation) stay true
  only when the server sets them.

## 5. What stays best effort, and why

Under the cheat policy a client shortcut that only saves time is acceptable; access honest play
could never reach must be refused; and hardening must never block a student playing as intended.

- **Server-enforced (a secret or server outcome is at stake).** The room's *contents* open only on a
  server-proven pass (credential or server-owned disguise). The credit globals and `tailgate_in`
  become server-owned, so forging them is refused. The aim behind `tailgate_in` is reachable only
  through the server-checked passage (section 7).
- **Best effort (control-flow only).** The physical gate animation, the avatar's position, and the
  no-vest slip-in stay client-driven. A tampered client can still place the avatar inside the room
  and read the route room's objects; it still cannot *take* anything (collection reads
  `unlockedRooms`) or earn the finding. This is the accepted "a gate keeps a player out, not a
  secret" line: an honest player always reaches the room the intended way (wear the hi-vis, or clone
  the badge), and a cheat saves at most the walk, not the earn.

## 6. Which scenarios use gated doors, and how each keeps working

`grep -rl '"openFor"' scenarios/` returns four files.

| Scenario | Gated room(s) | `openFor` | `playerMayPassIf` | Room `requires` | Cloner? | Splits? |
|---|---|---|---|---|---|---|
| `lab_physical_pentest` | `secure_area` (door `:1370`) | `len` | `courier_ready` (worn, server-owned) | `cm_records_badge` (`:1371`) | yes | yes (both paths) |
| `test_gate_tailgate` | `staff_room` (door `:50-52`) | `sam` | `visitor_pass` (client-set) | `test_staff_badge` (`:51`) | yes | yes (credential; pass only if Q2) |
| `test_bark_bubbles` | `store_a`, `store_b` (`:50-51`) | `dana` | none | `store_a_badge`, `store_b_badge` | no | no |
| `test_access_habits` | `store_a`, `store_b` (`:1195-1211`) | `gary`, `sara` | none | `store_a_badge`, `store_b_badge` (`:1427`, `:1455`) | no | no |

- **`lab_physical_pentest`.** Splits (server-owned pass `courier_ready` and cloneable
  `cm_records_badge`). Hi-vis wearer: `courier_ready` server-true (proven by `POST /wear`), so on
  the `currentRoom` sync it is promoted via `viaPass`, setting `kp_badge_tailgated` and
  `tailgate_in`. Clone: presenting `cm_records_badge` is a `method: rfid` unlock (`doors.js:693`),
  credited via `viaCredential` in the `unlock` action, setting `kp_records_cloned` and
  `tailgate_in`. No-vest slip-in: stands in the room via `npcRouteRooms`, no promotion, no credit,
  turned round as designed. Tampered sync of either credit global: dropped. Scenario edits: add
  `creditOnPass` to the gate; **delete the client credit writers found by grep, not line number**
  (today the `setGlobal` writers are `:915` and `:932`; re-audit the `room_entered:secure_area`
  backstops at `:728` and `:729`, which must not re-credit after the server owns the globals). Keep
  the presentation mappings (`len_at_door` `:923`, `player_on_floor` `:754`, `kp_tailgate_cue`
  `:759`).
- **`test_gate_tailgate`.** The credential path splits (`test_staff_badge` is cloneable;
  `staff_clone_held` and an `rfid_cloner` are present). `visitor_pass` is client-set, so the pass
  path does not split as shipped (section 11, Q2). The fixture adds a gate `creditOnPass` with a new
  declared server-credit global (for example `test_staff_entered`) in both `viaCredential` and
  `viaPass`, so there is a server-owned global to assert on. The objective `enter_staff` is an
  `enter_room` task (`:37`), which `complete_task!` trusts outright, so the fixture asserts on server
  state (room in `unlockedRooms`, `test_staff_entered` set), not on that task (section 11, Q5).
- **`test_bark_bubbles` and `test_access_habits`.** Neither splits: no server-owned pass, and no
  cloner (`grep -c rfid_cloner` is 0 in both), so `store_a_badge` / `store_b_badge` exist only as
  the guards' cards and the rooms' `requires` and can never be held. They stay exactly as today,
  client-trusted and uncredited, presentation-only demos of the holds-doors rule. Nothing to
  migrate, test or forge. Note the carve-out in each scenario's README.

## 7. `tailgate_in` and any credited task must be server-completed only

`complete_task!` (`game.rb:3632`) has no guard for a manual task, so a direct
`POST /complete_task tailgate_in` marks it complete with no check, the same trusted path a tampered
client uses, which would defeat the fix. So this is a requirement, not an option. Two sides:

- **Reject the client forge, on both client routes.** Derive a `serverCompletedOnly` set from every
  gate `creditOnPass.*.completeTask`. The complete-side guard sits at the top of `complete_task!`
  itself (`game.rb:3632`), not only in the `POST /complete_task` controller action, because
  `creditOnPass` calls the model method directly and the `trusted` bypass below must be visible to
  it. The guard rejects a `serverCompletedOnly` task unless `trusted` is true. The skip route is a
  separate path: `skip_task!` (`game.rb:3738`) marks the task `skipped` and runs
  `check_aim_completion(task['aimId'])` (`:3751`) for any task id the client names, so a tampered
  `skip_task tailgate_in` would reach the `tailgate` aim without the passage. Add a second
  `serverCompletedOnly` check in `skip_task!` that refuses a credited task.
- **Let the server through.** `creditOnPass` completes the task by calling
  `complete_task!(task_id, trusted: true)`. Add a `trusted:` keyword to the signature (today
  `complete_task!(task_id, validation_data = {})`, `game.rb:3632`), so
  `complete_task!(task_id, validation_data = {}, trusted: false)`. It must be a real keyword, never
  read out of `validation_data`, so a client cannot smuggle `{ "trusted": true }` through the
  request body: the client callers pass the request hash positionally into `validation_data`. The
  guard is skipped only when `trusted` is true. This mirrors the globals side, where
  `write_server_globals!` bypasses the read-only check that `sync_state` obeys.

`serverCompletedOnly` derives and memoises like `serverCreditGlobals` (3.4). The validator enforces
that every credited task is server-completed-only.

## 8. SYNC SIZE RULE

Player state synced between client and server must not grow so data is constantly re-sent. This
plan adds three server-owned derived lists and reuses the existing `globalVariables` sync.

- `npcRouteRooms` (array of room ids): bounded by the number of split gated rooms in the scenario
  (one in the lab, a handful at most). It holds only rooms not yet earned; on promotion the id is
  deleted, so it shrinks to empty after the player earns entry and never both lists hold the same
  id. It is **server-written only**: the client POSTs `method: npc` and `currentRoom`, never the
  list, so it is never re-sent and never grows per sync. The server does not send it to the client
  in `sync_state`; it is internal promotion bookkeeping.
- `serverCreditGlobals` and `serverCompletedOnly` (arrays of names): each derived once from the
  scenario at game creation, or memoised without `save!` on first read (as `worn_global_names`
  does). Bounded by scenario authorship (the lab: two credit globals, one task). Server-held,
  read-only lists; neither is sent by the client nor re-sent per sync.
- The credit globals themselves live in `globalVariables`, already synced. They **replace** the
  existing client-set globals of the same names, so they add no new keys. Each `sync_state` sends
  the client's `globalVariables` delta as today; the server drops client writes to the credit
  names, so those keys never bounce between client and server.

Net new synced-state growth: zero per-sync. Three bounded server-owned lists, each a one-time
derivation whose size is fixed by the scenario, none of them part of the client-to-server payload.

## 9. Stored games, format and upgrade

- **No format bump.** `npcRouteRooms`, `serverCreditGlobals` and `serverCompletedOnly` default or
  derive on first read and memoise without a write, so a save made before this field reads as an
  empty/derived list and keeps working. No `db:migrate` and no scenario format version change.
- **Soft-lock migration (the one real upgrade case).** A game where Len's route already ran has
  `secure_area` in `unlockedRooms` but, if the player had not yet worn the hi-vis or cloned a badge,
  no credit set. After deploy, promotion only runs for a room in `npcRouteRooms`, the room is in
  `unlockedRooms`, and the client credit writers are gone, so `kp_badge_tailgated` could never
  become true and `tailgate_in` would lock forever. Fix: a one-shot demotion. On the first request
  that holds `scenario_data`, if a split gate's room is in `unlockedRooms` but all of its
  `creditOnPass` globals are still false/unset and the credited task is incomplete, move the room
  back into `npcRouteRooms` and set a `routeRoomsMigrated` flag so it runs once. The next entry
  re-runs the earn check (via `viaPass` on the `currentRoom` sync, or `viaCredential` on an rfid
  unlock). A player who already earned it (credit global true) is left in `unlockedRooms`,
  untouched.
- **Migration trigger and ordering.** The demotion reads the scenario, so pin it to a request that
  already holds the full row and runs before the first collection or `currentRoom` sync: the room
  `GET` / game show (`games_controller.rb:506`, `:193`). It must run **before** that request's own
  auto-unlock block (`:539-541`), whose `if !is_unlocked` reads only `unlockedRooms` (`:526`), or the
  same `GET` would re-append the room it just removed. Do not wire it to `sync_state`, which loads
  the row without `scenario_data` and is often the first request after deploy.

## 10. Reload, slow client, offline client

- **Reload.** The gate is rebuilt shut and Len re-walks and re-POSTs `method: npc`. If the room is
  already promoted, `validate_unlock` returns true early via `room_unlocked?` and nothing changes;
  if not, the route unlock re-routes to `npcRouteRooms` (the `!room_unlocked?` guard keeps the lists
  disjoint). Promotion and the credit globals persist in `player_state`, so an earned finding
  survives reload. The lab's Mission Brief reappearing on reload is intended and not in scope.
- **Slow client.** The viaPass check runs whenever a `currentRoom` for an `npcRouteRooms` room
  arrives, and is idempotent (gated on `!room_unlocked?`). A client that batches syncs is credited
  on the first `currentRoom` that carries the earned state; a delay only delays the credit, it does
  not drop or double it.
- **Offline then reconnect.** The client has not synced, so the server has credited nothing, which
  is honest: the player has not provably entered. On reconnect the route re-POSTs and the player's
  `currentRoom` / credential arrives, and promotion runs then. No double-credit, because promotion
  deletes from `npcRouteRooms` and each earn check is gated on `!room_unlocked?`.

## 11. Validator and schema

Schema (`scripts/scenario-schema.json`, the gate object at `:4067-4082`):

- Add `creditOnPass`: an object of named path-blocks (`viaPass`, `viaCredential`), each
  `{ setGlobal?: { <name>: <value> }, completeTask?: <taskId> }`.

Validator (`scripts/validate_scenario.rb`):

- For each gated `openFor` door, warn if the gate would **not** split (no server-owned
  `playerMayPassIf`, no obtainable `requires` card) yet names a `creditOnPass`: the credit could
  never fire. Reuse the card/cloner reachability pass in `check_access_model` (around
  `scripts/validate_scenario.rb:2201-2250`) for "obtainable card".
- A `creditOnPass.*.completeTask` must name an existing task; each `setGlobal` name must be a
  declared global and must be listed as a server-credit global (so the author knows it becomes
  read-only). Warn if a credit global still has a client `setGlobal` mapping writing it (a half-done
  migration). Warn if a `creditOnPass.completeTask` task is not in the server-completed-only set
  (section 7).
- The dungeon-graph edge for a split gated door should read "gated: credential or server pass". The
  generator's gate-label block (`scripts/generate_dungeon_graph.rb:489-508`) only labels a gate that
  has a `noHold` and skips any gate with a `playerMayPassIf` (`:498-500`), so the lab's gate gets no
  label today. Extend the generator to emit the credential/pass label for a split gated door and
  regenerate. Do not hand-edit `dungeon_graph.*`, which the generator overwrites; restore any
  unrelated rewrite.

## 12. Tests and live proofs

Rails (`test/controllers/break_escape/`, `test/models/break_escape/`), one each:

1. `sync currentRoom: secure_area` with no hi-vis, no card: room accepted (avatar not desynced),
   NOT in `unlockedRooms`, no credit global, `tailgate_in` incomplete. (The designed slip-in.)
2. `POST /wear` the hi-vis, then `sync currentRoom: secure_area`: promoted to `unlockedRooms`,
   `kp_badge_tailgated` server-true, `tailgate_in` complete, proving the pass check loads the gate
   via its own `pick` on a sync row that carries no `scenario_data`.
3. Hold the cloned `cm_records_badge`, no hi-vis, `POST /unlock method: rfid` on the records door:
   credited via `viaCredential`, `kp_records_cloned` server-true, `tailgate_in` complete, before and
   without any `method: npc` route having run.
4. `sync globalVariables: { kp_badge_tailgated: true }` before earning: dropped (read-only via
   `serverCreditGlobals`); stays false.
5. `POST /complete_task tailgate_in` directly: rejected (`serverCompletedOnly`).
5b. `POST /skip_task tailgate_in` directly: rejected; the `tailgate` aim is not reached.
5c. `POST /complete_task tailgate_in` with body `{ "trusted": true }`: still rejected (`trusted` is a
   keyword, not read from `validation_data`).
6. Forge `method: npc` for the gate NPC: lands in `npcRouteRooms` only; serving the room does not
   promote it, `unlockedRooms` unchanged.
7. `playerMayPassIf` is a client-writable global (test_gate_tailgate `visitor_pass` as shipped):
   forge it true, sync `currentRoom`: no `viaPass` promotion, because the name is not server-owned.
8. Clone a UID-only / wrong card and claim the credential path: `rfid_lock_passes?` refuses, no
   promotion.
9. Migration: seed a game with `secure_area` in `unlockedRooms`, every credit global false,
   `tailgate_in` incomplete, credit writers removed: a `GET room/secure_area` moves the room back
   into `npcRouteRooms`, sets `routeRoomsMigrated`, and that request's auto-unlock does not re-add
   it; wearing the hi-vis and entering then credits it. A second seeded game with the credit already
   true is left in `unlockedRooms`, untouched.
10. `GET room` on a route room (not migrated) leaves `unlockedRooms` unchanged (the auto-unlock
   guard, 3.2).

Node (`bin/test-js`): the client gate is unchanged, so its tests stand. Add a scenario-scan check
that no client `setGlobal` writer of `kp_badge_tailgated` / `kp_records_cloned` remains in the lab.

Validator: run `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph` on all
four scenarios; regenerate and commit the lab's dungeon graph (the gated-door edge label changes).

**Live proof** (keyless server on the assigned port, per the builder rules). Drive the lab to the
records door with a tampered client: `POST sync currentRoom: secure_area` and
`globalVariables: { kp_badge_tailgated: true }` with no hi-vis and no clone, and confirm the server
leaves `kp_badge_tailgated` false and the debrief does not read the tailgate as earned, while the
avatar still stands in the room (no snap-back). Then the honest run (wear hi-vis, walk in) is
promoted and credited, and the clone run (present `cm_records_badge`) is credited via the rfid
unlock. The tampered step is the proof the fix bites. Record game ids in the build log.

## 13. Build split (chunks a fresh agent can do under about 150k tokens each)

- **Chunk A: server split and serve.** `npcRouteRooms` list; `gated_route_room?` and
  `split_gated_door?` helpers; the `unlock` action route-room branch (3.5); `GET room` and
  auto-unlock changes (3.2); `currentRoom` acceptance for route rooms (3.3a, acceptance only). Rails
  tests 1, 6, 10. No credit yet.
- **Chunk B: the credit, server-owned.** `creditOnPass` schema; `serverCreditGlobals` derivation and
  read-only union (3.4); `write_server_globals!` credit write; the `viaPass` check on `currentRoom`
  (3.3a) and the `viaCredential` write in the `unlock` action (3.3b). Rails tests 2, 3, 4, 7, 8.
- **Chunk C: server-completed tasks.** `serverCompletedOnly` set; the `complete_task!` and
  `skip_task!` guards; the `trusted:` keyword (section 7). Rails tests 5, 5b, 5c.
- **Chunk D: scenario migration and lab edits.** Add `creditOnPass` to the lab gate; remove the
  client credit writers and re-audit the backstops; the soft-lock demotion (section 9). Rails test 9;
  node scenario-scan.
- **Chunk E: fixtures, validator, graph, live proof.** `test_gate_tailgate` `creditOnPass` fixture;
  validator rules (section 11); dungeon-graph label and regenerate; the four-scenario validator run
  and the keyless-server live proof (section 12).

## 14. Open questions for the user

- **Q1. `visitor_pass` server-owned?** `test_gate_tailgate`'s `playerMayPassIf: visitor_pass` is
  client-set, so as shipped only its credential path splits and an honest `visitor_pass` player is
  not credited via `viaPass`. Require every split gate's pass global to be server-owned
  (validator-enforced) and make `visitor_pass` a server-set pass, or allow a client pass global and
  rely on the credential path there? **Recommend:** require server-owned; make `visitor_pass`
  server-set so the fixture proves the strong path.
- **Q2. Scope now.** Land the full change for the lab now (split, server-owned credit, migration,
  server-completed tasks), or land only the server split and defer the credit machinery? **Recommend:**
  the full change now, since the lab is the shipped teaching scenario.
- **Q3. The two holds-doors demos.** `test_bark_bubbles` and `test_access_habits` are carved out of
  the split (nothing provable, nothing forgeable). Any objection to leaving them presentation-only,
  noted in each README? **Recommend:** leave them; they credit nothing and gate no outcome.
- **Q4. `enter_room` objective.** `test_gate_tailgate`'s `enter_staff` is an `enter_room` task that
  `complete_task!` trusts, so the fixture asserts server state, not that task. Validate `enter_room`
  against server `currentRoom`/`unlockedRooms` as part of this work, or keep it a separate follow-on?
  **Recommend:** separate follow-on; assert server state in the fixture for now.
