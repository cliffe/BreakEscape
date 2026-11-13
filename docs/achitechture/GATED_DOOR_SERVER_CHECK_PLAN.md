# Gated-door tailgating: a server check (plan)

Scope: make the credit for passing a gated `openFor` door a fact the server establishes, not a
client control a tampered client grants itself. The player may still stand wherever the client
puts the avatar. What the server owns is whether the pass was earned, and whether the room's
contents open. No code here; this is the plan the implementation works from. Every code claim is
pinned to a file and line at the current tree.

**The credential check.** The credential path (§3.3b) reads the server's rfid possession check,
`rfid_lock_passes?` (`app/models/break_escape/game.rb:3081` call site in `validate_unlock`; defined
at `game.rb:2545`). For a `requires`-only rfid lock (no `access` list), it delegates to
`rfid_requires_held?` (`game.rb:2563`), which returns true only when the player provably holds, in
server state, a non-revoked keycard (`held_keycard_ref_ids`, `game.rb:2588`) or a live clone (an
`rfid_cloner` held, with the id recorded in `server_clones`) whose id is named in the lock's
`requires`. Both split rooms are `requires`-only, so this is the check that proves possession: a POST
with no card can no longer open the door (`game.rb:2545-2552`), and the clone POST sends no
`card_ids` (`doors.js:684-693`), so the server reads possession from its own state, never from the
request. The credential credit reads that same server result.

## 1. The weakness as it stands

A gated room is opened, and the tailgate credited, in the player's browser.

1. An NPC on a route (the lab's Len) runs a route waypoint `action.unlockRoom`
   (`scenarios/lab_physical_pentest/scenario.json.erb:1601`). Its behaviour calls
   `NPCGameBridge.unlockDoor`, which POSTs `/unlock` with `method: npc`
   (`public/break_escape/js/systems/npc-behavior.js:1999-2001`).
2. `validate_unlock` (`app/models/break_escape/game.rb:3081`) accepts it: for `method: npc` it
   returns `npc_mapping_unlocks_door?(npc_id, target_id)` (defined at
   `game.rb:3521`), which is true because Len carries an `unlockDoor: secure_area` eventMapping
   (`scenario.json.erb:1640`, a never-firing `eventPattern: len_never_fires` mapping that exists
   only to grant this permission). No gate, position or credential check.
3. The `unlock` action's door branch calls `serve_opened_room(target_id)`
   (`app/controllers/break_escape/games_controller.rb:1140`), which calls `unlock_room!`
   (`game.rb:116`). From then on `secure_area` is in `unlockedRooms`, so `GET room/<id>` serves it
   (`games_controller.rb:526-544`) and a `sync_state` with `currentRoom: secure_area` is accepted
   (`merge_last_write_wins_sections`, `games_controller.rb:2098-2107`). The room is server-open
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
  checked by `npc_mapping_unlocks_door?` (`game.rb:3521`); the player's own credential unlock is
  checked by `validate_unlock` (`rfid_lock_passes?`, `game.rb:2545`, for an rfid door;
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
  POSTs `notifyServerUnlock(doorSprite, 'door', 'rfid')` (`public/break_escape/js/systems/doors.js:693`),
  so `validate_unlock` sees it as a `method: rfid` door unlock. Both split rooms are
  `locked:true, lockType:rfid, requires:<card>` with **no `access` list**
  (lab `secure_area`, `scenarios/lab_physical_pentest/scenario.json.erb:2122-2124`;
  `test_gate_tailgate` `staff_room`, `scenarios/test_gate_tailgate/scenario.json.erb:156-161`). For
  such a lock, `rfid_lock_passes?` (`game.rb:2545`) delegates to `rfid_requires_held?`
  (`game.rb:2563`), which returns true only when the player provably holds a non-revoked keycard or
  a live clone (an `rfid_cloner` held) whose id is in the lock's `requires`, read from server-held
  inventory and `server_clones` and ignoring the client-sent `card_ids` (the clone POST sends none,
  `doors.js:684-693`). So the server rfid check proves possession, and the credential credit reads
  that result. The lab's `cm_records_badge` is reachable through an `rfid_cloner`;
  `test_gate_tailgate`'s `test_staff_badge` likewise. viaCredential credits only when that server
  possession check has passed (§3.3b).
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
- **A split gate's `playerMayPassIf` must be server-owned.** When a split gate names a
  `playerMayPassIf`, that global must be one a client `sync_state` cannot write (a worn-costume
  global, an imported global, or a server-credit global). If it is client-writable, a tampered
  client could set it and forge the viaPass credit, so the validator (§12) rejects a client-writable
  pass global on a split gate as an error. This is why `test_gate_tailgate`'s `visitor_pass` is made
  a worn, server-set pass (§6): a split gate earns its pass path only through a global the server
  owns.
- Two helpers, because the two paths key on different things:
  - `gated_route_room?(npc_id, room_id)` (NPC-keyed): true when a scenario `doors[]` entry has
    `connectedRoom == room_id` and a `gate.openFor` naming `npc_id`, and the split condition holds.
    Selects only the `method: npc` route branch.
  - `split_gated_door?(room_id)` (door-keyed, attempt-independent): true when the room's door has a
    `gate.openFor` and the split condition holds. Selects the credential branch (3.3b), where the
    `method: rfid` unlock carries `attempt: null` and the NPC-keyed helper would never match.
- **The runtime split predicate, model-side.** Both helpers run in the model, so they must not
  reimplement the validator's full card/cloner reachability pass. The runtime test is the simplest
  safe one: a gate splits when its `playerMayPassIf` is a server-owned global, **or** the scenario
  contains an `rfid_cloner` object at all (presence is enough; the model does not trace whether a
  specific card is reachable from it). This can over-split (mark a gate split when its particular
  card is not in fact cloneable), but an over-split gate credits nothing it should not: the viaPass
  credit still needs a true server-owned global and the viaCredential credit is still gated on the
  possession check (§3.3b), so a wrongly split gate just keeps its room in `npcRouteRooms` until one
  of those passes, exactly as a non-split gate would stay client-trusted. The validator (§11) owns
  the sharper reachability check and warns the author; the model stays cheap and conservative.

### 3.2 Serving the room

- `GET room/<id>` (`games_controller.rb:506-544`) serves a room in `unlockedRooms` **or**
  `npcRouteRooms`, so Len's own passage and an honest player who walks up to the room still load
  it. The accessibility check at `:533` gains the second list. A served room is not an earned
  room: it exposes the route room's objects, their readable text and its NPCs to an un-promoted
  (possibly tampered) client. That is the accepted line, a gate keeps a player out, not a secret,
  but it is narrower than "nothing leaks", so each take-or-credit vector is accounted for here.
  - **Loose collectibles stay blocked.** The pickup path refuses an item in a locked room not in
    `unlockedRooms` (`games_controller.rb:2661-2667`) and `update_room` is gated on `room_unlocked?`
    (`:1008`), so no loose item in the route room can be taken.
  - **Sign-in PCs and flag or launch stations are already room-gated.** A sign-in is reached only
    through `object_reachable?` (`network_access.rb:124`, `!room['locked'] || room_unlocked?`), and a
    VM launch or flag station through the launcher gate (`games_controller.rb:1897`,
    `!room_unlocked?(launcher_room_id) -> :forbidden`); both read `room_unlocked?`, which is
    `unlockedRooms`/`startRoom` only (`game.rb:122`), so a room in `npcRouteRooms` alone is not
    unlocked for either. The builder must not weaken those two gates thinking the room split now
    covers them: it does not, they cover themselves.
  - **Locked containers and any object unlock were the one un-room-gated vector.** The object branch
    of `/unlock` (`games_controller.rb:1151-1168`) calls `unlock_object!` with no check that the
    object's room is reachable, and a set of feedback helpers that answer an invalid attempt
    (`pin_cracker_feedback` `game.rb:3277`, `password_case_mismatch?` `game.rb:3290`,
    `uid_only_refusal?` `game.rb:2633`) likewise answer for an object in any room. A new object-action
    gate (§3.6) refuses an object whose containing room is in `npcRouteRooms`, so a locked container,
    its served contents, and the hint leaks from these feedback helpers are all blocked in a
    served-but-unearned route room.
  - **An unlocked container's contents are served, and accepted.** `GET /container`
    (`games_controller.rb:616-627`) serves a container's contents once `check_container_unlocked` is
    true, with no containing-room gate. §3.6 stops a *locked* route-room container from ever being
    unlocked, so its contents stay hidden; but a container that is not locked (or carries no lock) in a
    route room has its contents served by this endpoint. This is the same accepted "served, not
    takeable" line as readable text: pickup stays room-gated (`:2661-2667`), so the contents are seen
    but nothing in them can be taken. No secret, so it is accepted and named here for completeness.
  - **The object-action gate sees scenario-defined objects only.** The predicate resolves a room
    through `login_scope_of`, which reads `scenario_data['rooms']` (`game.rb:1913`). An object added at
    runtime lives in `player_state['room_states'][room_id]['objects_added']` (`add_item_to_room!`,
    `game.rb:464-466`) and resolves to `room_id: nil`, so it is not gated. This stays permissive (it
    never refuses an honest player); the only effect is that a locked container *dropped at runtime*
    into a route room (an NPC KO drop, say) could be unlocked early. No current scenario does this, and
    such drops are usually takeable loot whose pickup is room-gated, so it is a leak-side limit noted
    here, not a soft-lock.
  - **Readable text is served, and accepted.** `filtered_room_data` (`game.rb:1603-1627`) strips
    `requires`, locked `contents` and author notes, but not a readable note's `text`. So a code
    written into a readable note in a route room does reach an un-promoted client. Under the cheat
    policy this is accepted: learning a code early only saves the walk, because the object the code
    opens is itself gated. When that object sits in the route room, §3.6 refuses it until promotion.
    When it sits in another room reached only through the route room (the lab's `p4_safe` in `P4`,
    opened by the `7041` written on `deeds_signout` in `secure_area`), the object-action gate does
    not reach it and the optional credit can be claimed early; this residual is accepted
    (Decisions, Q5). The validator warns the author wherever a route room's readable text carries a
    server-enforced lock code (§12), so no password or key is placed there unknowingly.
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

In `merge_last_write_wins_sections` (`games_controller.rb:2098`), accept `currentRoom` for a room in
`npcRouteRooms` exactly as for an unlocked room (extend the guard at `:2101-2104`), so the avatar
and saved room agree and the slip-in works. Then, if the room is in `npcRouteRooms` and not in
`unlockedRooms`, run the pass check: the gate's `playerMayPassIf` is a server-owned global and is
true. **Server-owned** is the runtime predicate "the name is in
`worn_global_names + imported_global_names + SERVER_OWNED_GLOBAL_NAMES`"
(`wearables.rb:26`, `carry_over.rb:70`, `game.rb:1798`), the same set a client `sync_state` cannot
write. On a pass, promote with the `viaPass` block. On a fail, accept the room and do nothing else;
item collection reads `unlockedRooms` and the room stays locked, so the honest no-vest slip-in
stands in the room, collects nothing, is credited nothing, and is turned round by the ink as
designed.

`sync_state` loads the row with `SYNC_STATE_COLUMNS` only (`games_controller.rb:2027`, no
`scenario_data`), so **every** scenario read on this path raises `ActiveModel::MissingAttributeError`.
This is not limited to reading the gate blob. The viaPass credit runs the whole `complete_task!` call
tree, and that tree reads `scenario_data` in five places, every one of them unconditional:

- the promotion guard `!room_unlocked?` -> `start_room?` -> `scenario_data['startRoom']`;
- `complete_task!` -> `initialize_objectives`, whose first line reads `scenario_data['objectives']`;
- `complete_task!` -> `find_task_in_scenario` -> `scenario_data['objectives']`;
- `complete_task!` -> `process_task_completion` -> `apply_task_set_globals!` -> `scenario_data['globalVariables']`
  (whenever the credited task has an `onComplete.setGlobal`);
- `complete_task!` -> `check_aim_completion` -> `scenario_data['objectives']`, and the sibling
  `recheck_pending_mission_conclusions!` -> `scenario_data['objectives']`, both called inside
  `complete_task!`.

So a `pick` for the gate blob alone, or threading the scenario into the guard and a couple of named
calls, still raises in `initialize_objectives` before any credit is written.

The fix is a **`scenario_data`-only load on the sync path**, done once per request and only when a
credit is about to fire. The moment the pass check decides to promote (room in `npcRouteRooms`, not
in `unlockedRooms`, and the server-owned `playerMayPassIf` is true), fetch the scenario once through
the existing `stored_scenario_data` single-source helper (`game.rb:797-806`, which reads the loaded
attribute on a full load and does one `pick` on the sync row) and set it on the in-memory record
before the credit runs, so every `scenario_data` read in the call tree above resolves normally with
no per-call keyword threading. Clear the attribute's dirty state after setting it (it is immutable
and identical to the stored value) so the record's `save!` does not rewrite the large `scenario_data`
column; the write stays narrow (`player_state` and the stat columns), as a plain sync.

This cannot clobber the in-flight merge. `sync_state` builds its result entirely in `player_state`
(`merge_last_write_wins_sections` mutates `player_state['currentRoom']`, `merge_global_variables!`
writes `player_state['globalVariables']`, and so on); `scenario_data` is a different attribute that
the merge never touches and never reads back. Setting `scenario_data` adds nothing to and removes
nothing from the merge being built.

Cost per sync: **zero on a sync that credits nothing**. The `stored_scenario_data` fetch is reached
only after the promotion decision is made, so a sync with no `currentRoom` for a route room, or one
whose pass check fails, issues no extra query and reads no scenario. On the rare crediting sync it is
one `pick` of `scenario_data`, read-only and server-held; with the dirty state cleared the follow-up
`save!` carries the same columns a normal sync would. SYNC SIZE is unchanged: the scenario is never
part of the client payload (§9).

#### 3.3b Credential path, in the `unlock` action

In the `unlock` action's door branch (`serve_opened_room` call at `games_controller.rb:1139`), select the credential path
with the door-keyed `split_gated_door?(target_id)`, independent of `attempt`. Credit viaCredential
only when the **server possession check passes**: the player provably holds a keycard or a live
clone whose `card_id` is in the door's `requires`. That check is `rfid_lock_passes?` ->
`rfid_requires_held?` (`game.rb:2545`, `2563`), which returns false for a `requires`-only lock when
the player holds nothing, read for `method: rfid`; `has_key_in_inventory?` (`game.rb:252`) for
`method: key`. The credit is gated on that server possession result, never on a client-sent boolean.
Because `validate_unlock` already refuses to open the door without possession, a non-holder never
reaches this branch; the credit site asserts the same possession result so the two cannot drift. When possession passes and the room is not yet in
`unlockedRooms`, promote with the `viaCredential` block. Capture "the room is not yet in
`unlockedRooms`" before `serve_opened_room` runs, because its `unlock_room!` adds the room and a check
made after it would never credit. `serve_opened_room` still runs; the added
steps are the `creditOnPass.viaCredential` write, the `npcRouteRooms` delete, and a `save!` after
the credit write (a `viaCredential` block that sets a global but completes no task would otherwise
not persist, since only `complete_task!` saves at its tail). All of this sits inside the existing
`ActiveRecord::Base.transaction` opened at `games_controller.rb:1137`, so a mid-write failure rolls
back the credit, the room unlock and the list delete together. This credits the clone the moment the
server validates the badge, whether or not Len's route has already recorded the room, and covers
`test_gate_tailgate`'s `test_staff_badge` unlock.

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
  gate `creditOnPass.*.setGlobal`, and union it into the **local `read_only` list** built at
  `game.rb:340` (`imported_global_names + wearable_read_only_globals`), the same list the wearables
  use, **not** the frozen `SERVER_OWNED_GLOBAL_NAMES` constant (`game.rb:1798`,
  `%w[se_captures].freeze`), which is a separate `reject` at `:337` and takes no scenario-derived
  list. A game with no
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
`unlock_room!`. `serve_opened_room` (`games_controller.rb:2244`) does three things: `unlock_room!`,
`filtered_room_data`, and `track_npc_encounters`. The route-room branch skips only the first; it must
still compose `filtered_room_data(room_id)` and run `track_npc_encounters(room_id, room_data)`, or
NPCs in the route room go untracked until the room is promoted. Select the branch with `@game.gated_route_room?(attempt, target_id)` **and**
`!@game.room_unlocked?(target_id)`: after promotion the room is unlocked, and on reload the gate is
rebuilt shut so Len re-walks and re-POSTs `method: npc`, where `validate_unlock` returns true early
via `room_unlocked?` (`game.rb:3084-3089`). The `!room_unlocked?` guard stops a re-fired route
unlock re-appending an already-earned room and breaking the two-lists-disjoint invariant. Every
existing caller's boolean contract is untouched.

### 3.6 The object-action gate for served route rooms

A served route room (§3.2) exposes its objects to an un-promoted client. Two kinds of server path act
on an object without checking that its room is reachable:

- the `/unlock` object branch (`games_controller.rb:1151`, `unlock_object!` then the contents in the
  answer at `:1168`), which yields contents or a credit (an `unlock_object` task completes on unlock);
- a set of **feedback helpers** that answer an invalid attempt and share one shape: each carries the
  guard `return false/nil if target_type != 'door' && unlock_scope_refused?(target_id)`, resolves the
  lock for an object in any room, and is called in the controller's `unless is_valid` block
  (`games_controller.rb:1117-1128`). They are `pin_cracker_feedback` (`game.rb:3277`, pips),
  `password_case_mismatch?` (`game.rb:3290`, the case hint) and `uid_only_refusal?` (`game.rb:2633`,
  the `uid_only` reason that tells a tampered client an rfid object is rfid-locked and that its held
  copy is UID-only). Each leaks how close an attempt is, for an object the player has not earned reach
  to. The gate below covers **these feedback helpers** as a class, named by the shared
  `unlock_scope_refused?` guard, so a further helper added later with the same pattern is caught by the
  same rule. (`unlock_session_refusal`, `game.rb:2758`, carries the same guard but answers only for an
  object under a held session with `path_unlocked?`, which a route room, never signed into, cannot
  satisfy; it is already unreachable for a route-room object, so it needs no new guard. Gating it for
  symmetry is harmless if the builder prefers.)

A single model predicate gates all of these: `object_in_unpromoted_route_room?(target_id)` resolves the
object's room (`login_scope_of(target_id)&.[](:room_id)`, `game.rb:1913`, which already walks rooms
and nested containers) and returns true when that room is in `player_state['npcRouteRooms']` and not
in `unlockedRooms`. All of these paths run in the `unlock`/feedback flow on a full game load, so
`scenario_data` is present (unlike the sync path), and `login_scope_of` reads it directly.

- **The valid-path refusal is its own controller guard, before `unlock_object!`.** `validate_unlock`
  runs first (`games_controller.rb:1103`) and returns true for a route-room object an honest key-holder
  targets, so flow reaches the object branch and `unlock_object!` (`:1152`) with no room check. The
  feedback-helper `nil` returns below live only in the `unless is_valid` block (`:1105-1129`) and so
  cover only the *invalid*-attempt branch; they do nothing for a valid attempt. So the refusal for the
  valid path is a **distinct controller guard**, checked before `unlock_object!` and before any
  write. The object branch sits inside the `ActiveRecord::Base.transaction` (`:1137`), so the guard
  goes either just before that transaction (keyed on `target_type`) or first thing in the object
  branch; both refuse before anything is written. When `target_type != 'door'` and the predicate
  holds, render a clear "not reachable yet" answer (`success: false`, `reason: room_not_reachable`,
  `status: :forbidden`) and return, so no `unlock_object!`, no contents in the answer, and no flag
  submission runs. The builder wires both insertion points: this valid-path controller guard, and the
  feedback-helper returns below.
- **The feedback helpers return `nil`/`false` when the predicate holds.** `pin_cracker_feedback`,
  `password_case_mismatch?` and `uid_only_refusal?` each return `nil`/`false` for a route-room object,
  mirroring their existing `unlock_scope_refused?` guard, so the pad counts the attempt as any other
  wrong code and leaks no pips, case hint or `uid_only` reason for a route-room object.
- **Transient honest-refusal window, viaPass path only.** viaPass promotes on the `currentRoom` sync
  (§3.3a), not on an `/unlock`, so an honest hi-vis player who enters `secure_area` and unlocks a
  container there within the same batch, before the promoting `currentRoom` sync lands, hits the
  valid-path `room_not_reachable` refusal. The server marks it **retryable** (`success: false`,
  `reason: room_not_reachable`, `retryable: true`, `status: :forbidden`). The object-unlock path owns
  its own retry, in its own client system. Object unlocks reach the server through two client routes:
  `notifyServerUnlock` (`unlock-system.js`, the key/lockpick/biometric/bluetooth/rfid null-attempt
  methods) and the five minigames that POST their own code directly (pin, password, combination,
  cryptex, flag). **All of them funnel through one shared helper, `unlockWithRouteRoomRetry`**
  (`utils/lock-scope-refusal.js`): `apiClient.unlock` throws on a 403 with the refusal body on
  `error.body` (`api-client.js:47-57` sets `err.status` and `err.body`), and the helper recognises a
  `room_not_reachable` retryable body, awaits one `window.stateSync.sync()` (which promotes the room
  via viaPass) **wrapped so a rejecting sync still proceeds to the one re-post**, then re-posts the same
  `apiClient.unlock` once; on a successful re-post the unlock completes, so no hard error reaches the
  player in the short pre-promotion window. (Chunk A built the retry inline in `notifyServerUnlock`
  only; Chunk B extracted the shared helper and routed the five minigames through it, closing the
  review R1 MAJOR 2 gap where those paths bypassed the retry.) The retry fires only on this
  reason-and-flag body, so every other refusal, and every door unlock (`type === 'door'`, never gated
  by §3.6), is unchanged. This is the **same
  rule** the `enter_room` completion follows in its own system (§8.3): one sync, one re-post, bounded,
  then surface. The two refusals are handled in two different client systems (`unlock-system.js` for
  the object unlock, `objectives-manager.js` for the completion); they do not share one code path, they
  apply the one rule. The credential path has no such window: it promotes synchronously inside the
  `/unlock` door branch (§3.3b) before any object unlock.

Doors are unaffected: the gate is only on the object branch (`target_type != 'door'`). A door into a
route room is the split itself (§3.5); its objects are what this gate holds. After promotion the room
leaves `npcRouteRooms`, the predicate is false, and the object opens normally, so an honest player who
earns the pass is never blocked.

**Why this is the right line, not a general room gate.** Gating every object unlock on its room being
in `unlockedRooms` would be a broad change with regression risk across every scenario (many objects
sit in rooms a player opens by other means). This gate fires only for the narrow, new case this plan
creates: a room served through `npcRouteRooms`. Reading a code from a readable note in such a room
stays allowed, because a code only saves time; the object it opens is what the server refuses, and it
refuses it precisely while the room is served-but-unearned.

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
  no-vest slip-in stay client-driven. A tampered client can still place the avatar inside the room and
  read the route room's objects, including a readable note's text. It still cannot take a **loose
  collectible** (pickup reads `unlockedRooms`, `games_controller.rb:2661-2667`), unlock a container or
  get its contents or feedback (the object-action gate, §3.6), reach a sign-in PC or a flag/launch
  station (already room-gated), or earn the finding. The one residual is a code in a readable note
  whose object sits in another room reached through the route room (lab `p4_safe`, Q5): there the
  optional credit can be claimed early, nothing taken. This is the accepted "a gate keeps a player
  out, not a secret" line: an honest player always reaches the room the intended way (wear the hi-vis,
  or clone the badge), and a cheat saves at most the walk, not the earn.

## 6. Which scenarios use gated doors, and how each keeps working

`grep -rl '"openFor"' scenarios/` returns four files. Note that `lockType: rfid` does **not** by
itself mean the door opened with a held card: both split rooms are `requires`-only with no `access`
list, so the server check for them is `rfid_requires_held?` (`game.rb:2563`), which proves possession
from server-held state; a POST with no card does not open the door.

| Scenario | Gated room(s) | `openFor` | `playerMayPassIf` | Room `requires` | Cloner? | Splits? |
|---|---|---|---|---|---|---|
| `lab_physical_pentest` | `secure_area` (door `:1370`) | `len` | `courier_ready` (worn, server-owned) | `cm_records_badge` (`:1371`) | yes | yes (both paths) |
| `test_gate_tailgate` | `staff_room` (door `:50-52`) | `sam` | `visitor_pass` (made worn, server-owned) | `test_staff_badge` (`:51`) | yes | yes (both paths) |
| `test_bark_bubbles` | `store_a`, `store_b` (`:50-51`) | `dana` | none | `store_a_badge`, `store_b_badge` | no | no |
| `test_access_habits` | `store_a`, `store_b` (`:1195-1211`) | `gary`, `sara` | none | `store_a_badge`, `store_b_badge` (`:1427`, `:1455`) | no | no |

- **`lab_physical_pentest`.** Splits (server-owned pass `courier_ready` and cloneable
  `cm_records_badge`). Hi-vis wearer: `courier_ready` server-true (proven by `POST /wear`), so on
  the `currentRoom` sync it is promoted via `viaPass`, setting `kp_badge_tailgated` and
  `tailgate_in`. Clone: presenting `cm_records_badge` is a `method: rfid` unlock (`doors.js:693`),
  credited via `viaCredential` in the `unlock` action **only when the server possession check
  passes** (`rfid_lock_passes?` -> `rfid_requires_held?`, `game.rb:2545`, `2563`), setting
  `kp_records_cloned` and `tailgate_in`. No-vest slip-in: stands in the room via `npcRouteRooms`, no
  promotion, no credit, turned round as designed. Tampered sync of either credit global: dropped.
  Scenario edits: add `creditOnPass` to the gate; **delete the client credit writers found by grep,
  not line number** (today the `setGlobal` writers are `:915` and `:932`); and **delete the two
  `room_entered:secure_area` client `completeTask` backstops** (`:728`, `:729`). Once `tailgate_in`
  is `serverCompletedOnly` (§7), those backstops can never complete the task; they would only be
  rejected by the `complete_task!` guard and logged on every entry while their condition holds. Move
  the removed mappings to `tmp/delete/` per the common rules, staging the removal by explicit path.
  Keep the presentation mappings (`len_at_door` `:923`, `player_on_floor` `:754`, `kp_tailgate_cue`
  `:759`).
- **`test_gate_tailgate`.** Splits on both paths. The credential path splits (`test_staff_badge` is
  cloneable; `staff_clone_held` and an `rfid_cloner` are present), and its viaCredential credit is
  gated on the same possession check (`rfid_requires_held?`, `game.rb:2563`): `staff_room` is also
  `requires`-only, so an rfid unlock by a non-holder does not open it or credit it. For the pass path,
  `visitor_pass` is **made a worn, server-set pass** (Q1): the fixture gives the player a visitor-pass
  wearable whose worn global is `visitor_pass` (set only by `POST /wear`, read-only to `sync_state`
  via `wearable_read_only_globals`), and the client `set_global visitor_pass` writer at
  `scenario.json.erb:138` is removed. So `visitor_pass` is server-owned and the viaPass path splits,
  proving the strong pass path in the fixture. The gate gains a `creditOnPass` with a declared
  server-credit global (for example `test_staff_entered`) in both `viaCredential` and `viaPass`, so
  there is a server-owned global to assert on. The objective `enter_staff` is an `enter_room` task
  (`:37`), now server-validated against the player's room record (§8), so the fixture asserts on that
  task as well as on server state (room in `unlockedRooms`, `test_staff_entered` set).
- **`test_bark_bubbles` and `test_access_habits`.** Neither splits: no server-owned pass, and no
  cloner (`grep -c rfid_cloner` is 0 in both), so `store_a_badge` / `store_b_badge` exist only as
  the guards' cards and the rooms' `requires` and can never be held. They stay exactly as today,
  client-trusted and uncredited, presentation-only demos of the holds-doors rule. Nothing to
  migrate, test or forge. Record the carve-out in a short README note in each scenario directory
  (`scenarios/test_bark_bubbles/`, `scenarios/test_access_habits/`): these two gates are
  presentation-only and are deliberately left client-trusted, so no server credit or split applies.

## 7. `tailgate_in` and any credited task must be server-completed only

`complete_task!` (`game.rb:3675`) has no guard for a manual task, so a direct
`POST /complete_task tailgate_in` marks it complete with no check, the same trusted path a tampered
client uses, which would defeat the fix. So this is a requirement, not an option. Two sides:

- **Reject the client forge, on both client routes.** Derive a `serverCompletedOnly` set from every
  gate `creditOnPass.*.completeTask`. The complete-side guard sits at the top of `complete_task!`
  itself (`game.rb:3675`), not only in the `POST /complete_task` controller action, because
  `creditOnPass` calls the model method directly and the `trusted` bypass below must be visible to
  it. The guard rejects a `serverCompletedOnly` task unless `trusted` is true. The skip route is a
  separate path: `skip_task!` (`game.rb:3798`) marks the task `skipped` and runs
  `check_aim_completion(task['aimId'])` (`:3815`) for any task id the client names, so a tampered
  `skip_task tailgate_in` would reach the `tailgate` aim without the passage. Add a second
  `serverCompletedOnly` check in `skip_task!` that refuses a credited task.
- **Let the server through.** `creditOnPass` completes the task by calling
  `complete_task!(task_id, trusted: true)`. Add a `trusted:` keyword to the signature (today
  `complete_task!(task_id, validation_data = {})`, `game.rb:3675`), so
  `complete_task!(task_id, validation_data = {}, trusted: false)`. It must be a real keyword, never
  read out of `validation_data`, so a client cannot smuggle `{ "trusted": true }` through the
  request body: the client callers pass the request hash positionally into `validation_data`. The
  guard is skipped only when `trusted` is true. This mirrors the globals side, where
  `write_server_globals!` bypasses the read-only check that `sync_state` obeys.

`serverCompletedOnly` derives and memoises like `serverCreditGlobals` (3.4). The validator enforces
that every credited task is server-completed-only.

## 8. The `enter_room` objective, server-validated

An `enter_room` task today completes on trust. The `when 'enter_room'` branch of `complete_task!`
(`game.rb:3745`) carries only the comment "Trust the client for this low-stakes validation" and runs
no check, so a tampered client can `POST .../objectives/tasks/<id>` for an `enter_room` task without
ever going near the room. This section makes the server check the task against its own record of
where the player is, while never refusing a player who honestly entered.

### 8.1 What the server already knows about the player's room

The server does not track the avatar's pixel position, but it holds a durable, monotonic record of
every room the player has reached:

- **`unlockedRooms`.** A non-start room becomes accessible only through a server-checked unlock of
  its door (`serve_opened_room` -> `unlock_room!`, `game.rb:116`), and `GET room/<id>` both requires
  that membership and auto-adds the room on access (`games_controller.rb:526`, `:539-541`). So the
  room is in `unlockedRooms` **before** the avatar can physically enter it, and it stays there once
  added (the list never shrinks on leaving).
- **`startRoom`** and an awareness **world room** (`awareness_world_room?`), both open from the
  start.
- **`npcRouteRooms`** (this plan, §3.1): a room an NPC route opened for the player's slip-in. The
  player may legitimately stand in such a room before earning it, and an `enter_room` task on it must
  still complete.
- **`currentRoom`** (last synced): the room the avatar currently occupies, accepted by
  `merge_last_write_wins_sections` (`games_controller.rb:2098`) only for a room already in
  `unlockedRooms`/`startRoom` (and, per §3.3a, `npcRouteRooms`), so a client cannot sync
  `currentRoom` to a room it has not legitimately reached.

### 8.2 The check

Add a model predicate `player_reached_room?(room_id)`: true when the room is in `unlockedRooms`, is
the `startRoom`, is an awareness world room, is in `npcRouteRooms`, or equals the saved
`currentRoom`. Replace the trust comment in the `enter_room` branch of `complete_task!`
(`game.rb:3745`) with: refuse (`{ success: false, error: 'Room not reached', retryable: true }`)
unless `player_reached_room?(task['targetRoom'])`. The refusal is marked **retryable** so the client
can re-sync and re-post rather than strand the task (§8.3). `complete_task!` runs on a full game
load, so `scenario_data` is present and `start_room?`/`awareness_world_room?` read it directly.

**The durable terms carry the check; the `currentRoom` disjunct is defensive.**
`merge_last_write_wins_sections` (`games_controller.rb:2098`) only ever sets the saved `currentRoom`
to a room already in `unlockedRooms`/`startRoom` (and, per §3.3a, `npcRouteRooms`), so a legitimate
saved `currentRoom` is always a member of one of the other disjuncts already. The `currentRoom` term
therefore adds no coverage of its own; it is kept as a harmless belt-and-braces disjunct, and a
builder must not read it as doing independent work or weaken the durable terms in reliance on it. The
awareness-world case likewise rests on `awareness_world_room?` (and the auto-unlock of a world room
into `unlockedRooms` on `GET room`), not on `currentRoom`, which the sync guard does not admit for a
world room directly.

This is a **server sanity check**, not a hard secret gate (cheat policy: room entry is control-flow,
low stakes). The union is permissive on purpose: it passes every player who honestly reached the
room and refuses only a forge that never unlocked the door, never slipped in on a route, and never
synced `currentRoom` there. Because `merge_last_write_wins_sections` already refuses a `currentRoom`
for a room the player has not legitimately reached, the forge cannot fake the one soft signal either.

### 8.3 Network delays, races and reconnect

**The guarantee is the door unlock's durable write, not any client ordering.** A locked door is
entered only through a server-checked unlock: `handleUnlock` -> `notifyServerUnlock` -> `POST /unlock`
-> `serve_opened_room` -> `unlock_room!` (`game.rb:116`), which appends the room to `unlockedRooms`.
An **unlocked** door or open doorway is not a bypass either: `handleUnlock`
(`unlock-system.js:696`) still POSTs `method: unlocked` (`:721-755`), so the server still runs
`unlock_room!`. The client awaits that POST (it opens the door and runs `loadRoom` inside the `.then`
of `notifyServerUnlock`) before the avatar can cross, and the `enter_room` completion fires only on
`handleRoomEntered` after the avatar is inside. So `unlockedRooms` holds the target **before** the
avatar physically enters and therefore before the completion POST can be sent, on every honest route.
`unlockedRooms` is monotonic (it never shrinks when the player leaves) and persisted, so once written
it is there for the check no matter how the later requests are delayed, dropped, duplicated,
reconnected or reloaded. `player_reached_room?` reading `unlockedRooms` is what makes the honest
completion pass; nothing downstream has to arrive in order.

**A pre-flush, where it helps, only improves timing; it is not load-bearing.** Reuse the proven
conclude-race pre-flush pattern (`ObjectivesManager.flushPendingGlobals()`): before posting an
`enter_room` completion, `ObjectivesManager` awaits a `window.stateSync.sync()` so any pending
`currentRoom` and entry-driven globals reach the server first. `sync()` sends `buildChanges()` deltas
only, and nothing when nothing changed, so there is no state growth (§9), and it is scoped to the
`enter_room` completion path so every other scenario keeps its current timing. It is a courtesy that
flushes the soft `currentRoom` signal early; because the check passes on durable `unlockedRooms`
regardless, a client that cannot or does not pre-flush (an old tab loaded before this change, a
dropped or aborted sync) still completes honestly. This is why the live proof (§13) must prove the
completion with the pre-flush delayed, aborted and absent, not merely present.

**The refusal is retryable, so a residual race never strands a task.** On the rare path where the
durable membership is not yet visible to the completion (below), the server answers
`{ success: false, error: 'Room not reached', retryable: true }`. The client awaits one
`window.stateSync.sync()` (flushing `currentRoom` and picking up the server's latest durable state),
**wrapped so a rejecting sync still proceeds to the one re-post** (the re-sync is awaited for its
ordering, never for its success, the same tolerance the pre-flush has), then re-posts the completion
once; only a re-post that is still refused surfaces to the player. So a true forge (never unlocked,
never slipped in) is refused and surfaced, while any honest ordering gap self-heals on the next sync.
The object-unlock refusal (§3.6) applies the same rule in its own client system: one sync, one
re-post, bounded. They are two handlers applying one rule, not one shared code path.

**The NPC-route slip-in has a second durable write the pre-flush does not order.** For a route-room
`enter_room` (`test_gate_tailgate`'s `enter_staff`), the durable membership is `npcRouteRooms`,
written by the gate NPC's `method: npc` route POST, a separate client->server request the pre-flush
does not touch. Honest play still holds because the client gate only opens once the NPC holds the
door, which means that route POST has already fired and `npcRouteRooms` is written before the avatar
can pass; and if a tight race still loses it, the retryable refusal re-posts after the next sync. So
the slip-in completes without a bespoke ordering step.

**A bounded in-memory re-send queue for offline and network failures.** The retryable re-post above
heals an ordering gap within one request. A longer failure needs the queue. A plain offline drop does
not throw: `serverCompleteTask` catches the `fetch` rejection and returns
`{ success: false, transient: true, error }` (`objectives-manager.js:1149`), and a 5xx returns the same
shape (`:1140-1142`). `serverCompleteTaskWithRetry` loops four times over its roughly 2.25s backoff
(150, 300, 600, 1200 ms; `:607-625`) and returns that transient object. Back in `completeTask`, a
transient return lands in the `!response.success` branch (`:687-694`), which reverts the task to active
at `:689` and alerts: this is the dominant offline path. The other feed is the thrown-error catch
(`:719-731`), which reverts at `:725` and fires only when something in the `try` throws, not on a plain
network drop. Today, after either revert, the completion re-fires only when the avatar next crosses the
room boundary. To cover the offline-then-reconnect case, `ObjectivesManager` keeps a small re-send
queue of `enter_room` completions that failed for a transient or network reason, fed from both those
points:

- **In memory only, never in `player_state`.** The queue is a field on `ObjectivesManager`, so it is
  never part of any sync payload and the SYNC SIZE RULE is untouched.
- **Keyed by task id, so it cannot grow.** Each entry is keyed by the completion's task id; re-queuing a
  task already present is a no-op, so the queue holds at most one entry per `enter_room` task in the
  scenario (a handful), never one per attempt.
- **Scoped to `enter_room`.** Only `enter_room` completions enter it; every other task keeps its
  current behaviour and never queues.
- **Fed only by a transient or network failure.** The enqueue sits in the `!response.success` branch
  (`:687-694`), keyed on `response.transient === true` (the exhausted-retry/offline path), and in the
  thrown-error catch (`:719-731`). A genuine non-retryable refusal (`!transient && !retryable`) reverts
  and alerts as today without enqueuing, and an inline `retryable` refusal (`room_not_reachable`, the
  honest residual race or a forge) is handled by the one-sync-one-repost path above, not the queue. So
  a forge never enters the queue.
- **Drained through the normal completion path, so the bound is explicit and no ending is dropped.**
  There is no sync-success event in `state-sync.js` (`sync()` at `state-sync.js:598-605` resolves to a
  boolean from `_syncOnce` at `:618-671` and fires no event or callback), and `ObjectivesManager` has
  no sync-success subscription. Rather than add one, the drain fires from two points inside
  `ObjectivesManager` itself: a `window.addEventListener('online', ...)` handler (the proven precedent
  is `conclude-mission.js:156`), and each sync `ObjectivesManager` already awaits (the conclude-race
  pre-flush at `:613-615` and the inline retryable re-sync). Both call `drainEnterRoomQueue()`, guarded
  against re-entry so a drain-triggered sync does not recurse. The `online` listener alone already meets
  the reconnect requirement; adding no event to the shared `state-sync` module keeps the change inside
  one file. Draining **removes the entry, then re-runs `this.completeTask(taskId)`** (never a bare
  `serverCompleteTask`), so a drained completion goes through the full path at `:662-718`: the
  `endingCheck` confirm, the `missionConcluded` end-screen trigger and the conclude-race `warning`
  pre-flush all still apply to a task that ends a mission. Because only a fresh transient or thrown
  failure re-adds the id (the feed rule above), a drained entry that comes back any **not-transient**
  outcome, success or any refusal (`room_not_reachable` retryable among them, whose race the inline
  one-sync-one-repost path owns), is simply gone. So the bound is explicit: the queue drops on success
  and on any not-transient refusal and can never retry forever; `complete_task!`'s already-completed
  branch makes a duplicate a no-op, so draining never double-credits.

Because the completion reads durable `unlockedRooms`, a drained re-post succeeds whenever the player
honestly reached the room, and `complete_task!`'s already-completed branch makes a duplicate a no-op, so
draining can never double-credit.

**Reload while offline.** The queue is memory-only, so a reload clears it. The room is still in
`unlockedRooms` on the server (durable, monotonic), and the `enter_room` task reloads active (the
offline failure left it active, `:689` or `:725`). The self-heal does not need a boundary crossing.
`currentPlayerRoom` is a module-level `''` reset on load (`rooms.js:103`, `:1038`), so the first
`updatePlayerRoom` tick after a reload sees `'' -> <roomId>` for the room the avatar already occupies
and emits `room_entered` (emit guard `rooms.js:3178`, emit `:3200`). `ObjectivesManager` subscribes at
`:352` and calls `handleRoomEntered` (`:550`), which re-fires `completeTask` for the active `enter_room`
task (`:558`); the completion reads the persisted `unlockedRooms` and passes. The one ordering gap:
`handleRoomEntered` returns early while `!this.initialized` (`:551`), so if that first `updatePlayerRoom`
tick runs before `ObjectivesManager` finishes initialising (`this.initialized = true` at `:110`), the
single auto-emit is dropped and, because `currentPlayerRoom` is then set, no further emit comes until
the avatar actually leaves and re-enters.

**Chunk F closes that gap with an init replay.** At the end of `initialize` (after `:110`), replay the
current room once: if `window.currentPlayerRoom` is a non-empty string, call
`handleRoomEntered(window.currentPlayerRoom)`. This is recommended because it is small (one guarded
call) and safe: `handleRoomEntered` only completes an active `enter_room` task for that room,
`completeTask` early-returns for a task already `completed`/`completing` (`:657`), and the server check
is idempotent, so the replay can never double-complete or complete a task for a room the player has not
reached. If init runs before the first tick, `currentPlayerRoom` is still `''` and the replay is a
no-op, but init is then finished so the tick's own emit is caught; if init runs after the tick, the
dropped emit is recovered by the replay. So the standing-in-the-room self-heal lands in both orderings,
and the conservative guarantee stays "the next crossing completes it" for anything the replay does not
cover. So reload-while-offline is covered by this init replay and the on-entry re-fire, not by the
queue, and the accepted low-stakes behaviour (a task may stay active until the player next crosses a
room boundary) still holds as the floor.

Why the pre-flush, not a server grace timer or deferred completion: it needs no per-task pending
state on the server (a grace timer or a deferred-completion queue would add state that must expire
and persist, against the spirit of the SYNC SIZE RULE), and the durable `unlockedRooms`/`npcRouteRooms`
record is the real guarantee, which the pre-flush only orders, not creates. Each listed condition is
covered:

- **Entry sync arrives after the completion POST, or never arrives.** `unlockedRooms` already holds
  the room (written by the door unlock before entry); the check passes regardless of the sync.
- **Pre-flush delayed, aborted or absent (old tab).** Same durable membership; the completion passes
  without the pre-flush. The pre-flush only orders the soft `currentRoom` signal.
- **Slow, retried or duplicated completion.** The check reads the durable lists and is idempotent;
  `complete_task!`'s already-completed branch makes a duplicate completion a no-op, so a retry or
  duplicate never double-credits.
- **Offline then reconnect.** A completion POST cannot be sent while offline. The failed completion is
  held in the bounded in-memory re-send queue (above), re-posted on the browser `online` event and on
  the next successful state sync. `unlockedRooms` persisted across the gap, so the re-post passes.
- **Reload mid-entry (including reload while offline).** `unlockedRooms` is persisted and the task
  reloads active; `currentRoom` is restored on reload. With the Chunk F init replay, the post-reload
  auto-detection of the room the avatar already stands in re-fires the completion through
  `handleRoomEntered` without a crossing (whichever of init and the first `updatePlayerRoom` tick runs
  first); the next crossing re-fires it as the fallback. A completion attempted after reload reads the
  persisted `unlockedRooms` and passes. (Room entry is low-stakes control flow, so a task left active
  after reload until the player next crosses a room boundary is acceptable.)
- **Room entered then left before the task posts.** `currentRoom` has moved on, but `unlockedRooms`
  still holds the target (monotonic), so the check passes. This is exactly why the union includes
  `unlockedRooms` and not only `currentRoom`.

### 8.4 Scenarios with `enter_room` tasks

`grep -rl '"type": *"enter_room"'` over `scenarios/*/scenario.json.erb` returns 17 scenario files:
`m01_first_contact`, `m02_ransomed_trust`, `m04_critical_failure`, `m05_insider_trading`,
`m06_follow_the_money`, `m07_architects_gambit`, `m09_digital_archaeology`, `m10_full_disclosure`,
`sis02_energy`, `sis03_cyber_insurance`, `lab_social_engineering`, and the `test_*` fixtures
(`test_objectives`, `test_behind_wall_fade`, `test_ink_email`, `test_clone_left_card`,
`test_bark_bubbles`, `test_gate_tailgate`). Every `enter_room` target is a room the player walks
into, which the door unlock has already added to `unlockedRooms`, so each keeps completing unchanged:

- **Deployed missions.** `m01_first_contact`, `sis02_energy` and `lab_social_engineering` all have
  `enter_room` tasks (`sis01_healthcare` has none). Each target room is reached through its door
  unlock, so `player_reached_room?` is true at completion time; the pre-flush adds only a sync
  ordering, no payload change. (`m01` and the deployed missions keep their cached audio untouched:
  this change is in `complete_task!` and `objectives-manager.js`, not in any voiced line or audio
  path.)
- **Missions with cached audio** (the `m`-series and `sis` missions carry a `tts_cache`): the change
  touches neither the scenario text nor the audio, so the cache is unaffected.
- **Fixtures.** `test_gate_tailgate`'s `enter_staff` becomes an asserted, server-validated entry
  (§6). The other fixtures complete their `enter_room` tasks as before.

This is its own build chunk (§14, Chunk F).

## 9. SYNC SIZE RULE

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

The `enter_room` pre-flush (§8.3) adds no synced state: it awaits a `window.stateSync.sync()` that
sends `buildChanges()` deltas only, and nothing when nothing changed, before the completion POST. No
new key is added to the payload and `player_reached_room?` reads only existing server-held lists.

Net new synced-state growth: zero per-sync. Three bounded server-owned lists, each a one-time
derivation whose size is fixed by the scenario, none of them part of the client-to-server payload.

## 10. Stored games, format and upgrade

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
  already holds the full row and runs before the first collection or `currentRoom` sync. Run the
  all-split-rooms scan in the game `show` action (`games_controller.rb:193`), which is room-agnostic
  and loads the full row, so it sees every split room in one pass before its own state writes. Do
  **not** scope it to the per-room `GET room/<id>` (`:506`): that request carries one room id, so
  wiring the scan there would miss a split room the player is not currently loading. When the scan
  does run on a request that then serves a room, it must run **before** that request's auto-unlock
  block (`:539-541`), whose `if !is_unlocked` reads only `unlockedRooms` (`:526`), or the same `GET`
  would re-append the room it just removed. Do not wire it to `sync_state`, which loads the row
  without `scenario_data` and is often the first request after deploy.

## 11. Reload, slow client, offline client

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

## 12. Validator and schema

Schema (`scripts/scenario-schema.json`, the gate object at `:4067-4082`):

- Add `creditOnPass`: an object of named path-blocks (`viaPass`, `viaCredential`), each
  `{ setGlobal?: { <name>: <value> }, completeTask?: <taskId> }`.

Validator (`scripts/validate_scenario.rb`):

- For each gated `openFor` door, warn if the gate would **not** split (no server-owned
  `playerMayPassIf`, no obtainable `requires` card) yet names a `creditOnPass`: the credit could
  never fire. Reuse the card/cloner reachability pass in `check_access_model` (around
  `scripts/validate_scenario.rb:2201-2250`) for "obtainable card".
- **A split gate's `playerMayPassIf` must be server-owned (error).** For a gate that splits, if it
  names a `playerMayPassIf`, that global must be one a client `sync_state` cannot write: a
  worn-costume global (named by some wearable's worn global), an imported global, or a server-credit
  global. A client-writable pass global on a split gate is an **error**, because a tampered client
  could set it and forge the viaPass promotion. Detect worn-costume globals from the scenario's
  wearables, the same union the runtime uses for the viaPass check (`worn_global_names`,
  `imported_global_names`, `serverCreditGlobals`).
- A `creditOnPass.*.completeTask` must name an existing task; each `setGlobal` name must be a
  declared global and must be listed as a server-credit global (so the author knows it becomes
  read-only). Warn if a credit global still has a client `setGlobal` mapping writing it (a half-done
  migration). Warn if a `creditOnPass.completeTask` task is not in the server-completed-only set
  (section 7).
- **Readable server-enforced codes in a split gated room (warn).** The runtime gates now cover the
  object vectors: a sign-in PC and a flag or launch station are already refused in a route room (they
  read `room_unlocked?`, which `npcRouteRooms` does not satisfy; `network_access.rb:124`,
  `games_controller.rb:1897`), and a locked container, its contents and the attempt-feedback hints
  (pin pips, password case, the `uid_only` reason) are refused by the object-action gate (§3.6). None
  of those needs a validator rule. What no runtime gate
  can catch is a **readable note**: `filtered_room_data` serves its `text`, and a code in that text is
  learned the moment the room is served. So for every split gated door's `connectedRoom`, scan the
  room's readable objects (`readable: true`) and warn if any object's `text` contains a value that is
  the `requires` of a server-enforced lock (pin, password, key, combination, rfid) anywhere in the
  scenario. Reuse the lock-code set the access-model pass already builds (`check_access_model`, around
  `scripts/validate_scenario.rb:2201-2250`). The warning tells the author that this code leaks to an
  un-promoted client, so they keep real secrets (a password, a working key code) out of a route room's
  readable text, or accept it where, as in the lab, the leak only saves time (Q5). A warning, not an
  error, because the lab's `deeds_signout`/`7041` is a deliberate teaching pattern the author keeps.
- The dungeon-graph edge for a split gated door should read "gated: credential or server pass". The
  generator's gate-label block (`scripts/generate_dungeon_graph.rb:489-508`) only labels a gate that
  has a `noHold` and skips any gate with a `playerMayPassIf` (`:498-500`), so the lab's gate gets no
  label today. Extend the generator to emit the credential/pass label for a split gated door and
  regenerate. Do not hand-edit `dungeon_graph.*`, which the generator overwrites; restore any
  unrelated rewrite.

## 13. Tests and live proofs

Rails (`test/controllers/break_escape/`, `test/models/break_escape/`), one each:

1. `sync currentRoom: secure_area` with no hi-vis, no card: room accepted (avatar not desynced),
   NOT in `unlockedRooms`, no credit global, `tailgate_in` incomplete. (The designed slip-in.)
2. `POST /wear` the hi-vis, then `sync currentRoom: secure_area`: promoted to `unlockedRooms`,
   `kp_badge_tailgated` server-true, `tailgate_in` complete. This runs the whole viaPass credit on
   the narrow sync row (no `scenario_data` column), so it proves the `scenario_data`-only load: with
   the scenario fetched once via `stored_scenario_data` and set on the record before the credit, the
   guard, `initialize_objectives`, `find_task_in_scenario`, `apply_task_set_globals!`,
   `check_aim_completion` and `recheck_pending_mission_conclusions!` all read it, and none raises
   `MissingAttributeError`. Assert the saved row still carries `currentRoom` and the merged globals
   (the in-flight `player_state` merge was not clobbered), **and** that the save did not write the
   `scenario_data` column (`saved_changes.keys` excludes `scenario_data`), so a builder who forgets to
   clear the dirty state after the `scenario_data`-only load is caught by a red test, not a silent
   per-credit rewrite of the large column.
3. Hold the cloned `cm_records_badge`, no hi-vis, `POST /unlock method: rfid` on the records door:
   credited via `viaCredential`, `kp_records_cloned` server-true, `tailgate_in` complete, before and
   without any `method: npc` route having run.
3b. **Negative credential test.** `POST /unlock method: rfid` on the records door with **no clone and
   no keycard** held: `rfid_lock_passes?` -> `rfid_requires_held?` (`game.rb:2545`, `2563`) refuses,
   the door does not open, the room is not in `unlockedRooms`, `kp_records_cloned` stays false,
   `tailgate_in` incomplete. This pins the credential path's server enforcement; both split rooms are
   `requires`-only, so the gap is not lab-specific.
4. `sync globalVariables: { kp_badge_tailgated: true }` before earning: dropped (read-only via
   `serverCreditGlobals`); stays false.
5. `POST /complete_task tailgate_in` directly: rejected (`serverCompletedOnly`).
5b. `POST /skip_task tailgate_in` directly: rejected; the `tailgate` aim is not reached.
5c. `POST /complete_task tailgate_in` with body `{ "trusted": true }`: still rejected (`trusted` is a
   keyword, not read from `validation_data`).
6. Forge `method: npc` for the gate NPC: lands in `npcRouteRooms` only; serving the room does not
   promote it, `unlockedRooms` unchanged.
7. `playerMayPassIf` is a client-writable global: forge it true on a gate whose pass global is not
   server-owned, sync `currentRoom`: no `viaPass` promotion, because the name is not server-owned.
   (The validator refuses such a gate as a split, §12; this test pins the runtime behaviour.)
8. Hold a wrong card (a clone whose `card_id` is not in the door's `requires`) and claim the
   credential path: `rfid_requires_held?` finds no held card whose id is in `requires`, refuses the
   unlock, and no promotion or credit follows.
9. Migration: seed a game with `secure_area` in `unlockedRooms`, every credit global false,
   `tailgate_in` incomplete, credit writers removed: the game `show` demotion scan moves the room
   back into `npcRouteRooms`, sets `routeRoomsMigrated`, and a following `GET room/secure_area`
   auto-unlock does not re-add it; wearing the hi-vis and entering then credits it. A second seeded
   game with the credit already true is left in `unlockedRooms`, untouched.
10. `GET room` on a route room (not migrated) leaves `unlockedRooms` unchanged (the auto-unlock
   guard, 3.2).
11a. **Object-action gate, refused while unpromoted (§3.6, Chunk A).** Seed `secure_area` in
   `npcRouteRooms` (route run, not promoted) holding a locked container with a readable finding inside.
   `POST /unlock` on that container with the right key held: refused (`status: :forbidden`,
   `reason: room_not_reachable`, `retryable: true`), not in `unlockedObjects`, no contents in the
   answer, any `unlock_object` task incomplete. This is the un-promoted-with-the-right-code refusal, and
   it stands on Chunk A alone (the room never promotes without the credit). (Lab or `test_gate_tailgate`
   fixture.)
11b. **Object-action gate, accepted after promotion (§3.6, Chunk B).** Continuing from 11a, wear the
   pass / promote `secure_area` (viaPass on the `currentRoom` sync, or viaCredential on an rfid unlock):
   the container unlocks, contents are served, and the `unlock_object` task completes. This half needs
   Chunk B's promotion, so it lives in Chunk B and depends on Chunk A's gate (build order A then B).
11c. **Object-unlock re-post is idempotent (§3.6, Chunk B).** With `secure_area` promoted, `POST /unlock`
   the same container twice (modelling the object-path client re-post after the sync): the first unlocks
   and completes the `unlock_object` task; the second reads `unlockedObjects` membership and is a no-op,
   so the task credit and any credited global or counter is written once, not twice. **Guarantee:** the
   post-promotion unlock is idempotent, so the §3.6 re-post cannot double-fire the object-task credit.
12. **Feedback leaks gated (§3.6).** With a PIN cracker held and a pin-locked object in a route room, a
   wrong `POST /unlock method:pin`: no `feedback` pips in the answer while the room is in
   `npcRouteRooms`; after promotion the pips return. Same shape for the password case-mismatch hint, and
   for the `uid_only` reason (a UID-only copy against an rfid-locked object in a route room returns no
   `reason: uid_only` while the room is unpromoted, and returns it after promotion).
13. **Honest object unlock unaffected (§3.6).** An object in an ordinary unlocked room unlocks exactly
   as today: the predicate is false (room not in `npcRouteRooms`), so a player who never meets a gate
   sees no change.

**`enter_room` server validation (§8).** Rails, one per case, each asserting a legitimate player is
never refused, and each written so it would **fail if the check or its guarantee were removed**. The
guarantee under test throughout is that the server-checked door unlock writes the target into
`unlockedRooms` (or the route POST into `npcRouteRooms`) before the avatar can enter, so the durable
membership is present however the later `currentRoom` sync or pre-flush behaves.

14. **Honest entry, room unlocked, `currentRoom` elsewhere.** Target in `unlockedRooms`, saved
   `currentRoom` is another room (models a delayed, dropped or not-yet-sent entry sync):
   `complete_task!` for the `enter_room` task succeeds. **Guarantee:** the pre-entry `unlockedRooms`
   write carries the check. Fails if `player_reached_room?` read only `currentRoom` (regression), or
   if the trust comment is restored (then nothing is asserted).
15. **Forge, never reached.** Target not in `unlockedRooms`/`npcRouteRooms`, not `startRoom`/world,
   `currentRoom` never synced there: `complete_task!` refuses with
   `{ success: false, error: 'Room not reached', retryable: true }` and the task stays active.
   **Guarantee:** the check itself. Fails (silently passes a forge) if the trust comment is restored.
16. **Route-room slip-in.** Target in `npcRouteRooms` only: `enter_room` completes
   (`player_reached_room?` true). **Guarantee:** the route POST's `npcRouteRooms` write. Fails if the
   union omits `npcRouteRooms`, refusing the honest slip-in.
17. **No prior sync at all (old tab).** Target in `unlockedRooms`, no `currentRoom` ever set (null),
   no entry-driven global written: a completion posted directly, as an old tab with no pre-flush
   would, succeeds. **Guarantee:** durable `unlockedRooms`, with no reliance on `currentRoom` or any
   pre-flush. Fails if the check required `currentRoom` to equal the target.
18. **Duplicated or retried completion is idempotent.** With the target in `unlockedRooms`, complete
   the `enter_room` task twice (and a third, modelling a client retry): the first succeeds, each
   later call is a no-op via `complete_task!`'s already-completed branch, and any credited global or
   counter is written once, not multiplied. **Guarantee:** idempotent completion plus a check that
   reads only durable state. Fails if a duplicate re-ran the credit or the task flipped back to active.
19. **Entered then left.** Target in `unlockedRooms`, `currentRoom` already moved to another room:
   completion still succeeds. **Guarantee:** `unlockedRooms` is monotonic. Fails if the union were
   narrowed to `currentRoom` only.
20. **Start room / world room.** An `enter_room` task on `startRoom` (or an awareness world room)
   completes with no unlock at all. **Guarantee:** the `startRoom`/`awareness_world_room?` disjuncts.
21. **Retryable refusal self-heals, then forge stays refused.** First complete with the target in no
   durable list and no `currentRoom`: refused, `retryable: true`, task active. Then add the target to
   `unlockedRooms` (modelling the sync that the client's retry flushes) and re-post: succeeds. Finally
   a target that is never added stays refused on every re-post. **Guarantee:** the refusal is
   retryable, so an honest ordering gap heals on re-post while a true forge is still refused. Fails if
   the refusal were a hard, non-retryable error (an honest residual race would strand the task) or if
   the second completion ignored the newly durable membership.

Node (`bin/test-js`): the client gate is unchanged, so its tests stand. Add a scenario-scan check
that no client `setGlobal` writer of `kp_badge_tailgated` / `kp_records_cloned` remains in the lab.
Add `objectives-manager` tests for the `enter_room` completion path:

- **Pre-flush ordering (happy path).** The path awaits a `stateSync.sync()` before the completion
  POST (mirroring the conclude-race node test) and posts exactly once.
- **Completion does not depend on the pre-flush.** With `stateSync.sync()` stubbed to reject or to be
  absent (an old tab), the completion POST is still sent; the pre-flush is awaited but its outcome
  never blocks the POST. Fails if a pre-flush error swallowed the completion.
- **Retryable refusal re-syncs and re-posts once.** When the completion returns
  `{ success: false, retryable: true, error: 'Room not reached' }`, the client awaits one
  `stateSync.sync()` and re-posts; a second `retryable` refusal surfaces to the player (one alert, no
  infinite loop). This exercises the §8.3 retry and would fail if `retryable` were treated as a hard
  refusal (task stranded) or retried without bound.
- **Retryable refusal with a rejecting re-sync still re-posts once.** With `stateSync.sync()` stubbed to
  reject, a `retryable` refusal still awaits the (rejecting) sync, swallows its rejection, and sends the
  single re-post. Fails if the re-sync rejection propagated and swallowed the re-post (the honest
  residual-race player would otherwise see the generic "Could not save" error).
- **Offline re-send queue, feed and bound.** A transient return (`{ success: false, transient: true }`,
  the exhausted-retry/offline path landing in the `:687-694` branch) of an `enter_room` completion
  queues the task id; a thrown error (the `:719-731` catch) also queues it; a non-transient refusal
  (`!transient`, retryable or not) reverts without queuing. Firing the `window` `online` event drains
  the queue (re-posting through `completeTask`) once and it succeeds; a sync `ObjectivesManager` itself
  awaits also drains it. A drained entry whose re-post comes back a non-transient refusal is dropped (it
  is not re-added, because only a transient or thrown failure feeds the queue), so it never retries
  forever. Re-queuing the same task id does not grow the queue (at most one entry per task id). Fails if
  the enqueue were wired only to the `:719` catch (missing the dominant offline path), if the queue were
  unbounded, never drained, or drained a forge.
- **Queued completion that concludes a mission.** A queued `enter_room` completion is the task that
  concludes a mission. On drain the queue re-runs `completeTask`, so the `missionConcluded` end-screen
  path (`:697-700`) and the conclude-race `warning` pre-flush (`:701-718`) still fire; assert the end
  screen is triggered (`handleMissionConcluded`) on the drained re-post. Fails if the drain re-posted a
  bare `serverCompleteTask` and bypassed the ending handling.

Node (`bin/test-js`), the object-unlock retry (§3.6), in a `unlock-system` test file, exercising
`notifyServerUnlock` with a stubbed `apiClient.unlock` and `window.stateSync.sync`:

- **Object unlock retries on a `room_not_reachable` retryable body.** When `apiClient.unlock` throws a
  403 whose `error.body` is `{ success: false, reason: 'room_not_reachable', retryable: true }`,
  `notifyServerUnlock` awaits one `stateSync.sync()` and re-posts once; the second post (after
  promotion) returns success, so the unlock completes and no denied outcome reaches the player.
- **Forged object unlock stays refused after its one re-post.** When both the first and the re-posted
  `apiClient.unlock` return the `room_not_reachable` refusal (the room never promotes), the client
  re-posts exactly once and then surfaces the refusal; it does not loop. Fails if the retry spun or
  never surfaced.
- **Rejecting re-sync still re-posts the object unlock once.** With `stateSync.sync()` stubbed to reject,
  the object-unlock retry swallows the rejection and still sends its single re-post.
- **No retry for other refusals or doors.** A non-`room_not_reachable` refusal, or a `type === 'door'`
  unlock, is not retried (returned as today), so unrelated unlock paths are untouched.

Validator: run `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph` on all
four scenarios; regenerate and commit the lab's dungeon graph (the gated-door edge label changes).

**Live proof** (keyless server on the assigned port, per the builder rules). Drive the lab to the
records door with a tampered client: `POST sync currentRoom: secure_area` and
`globalVariables: { kp_badge_tailgated: true }` with no hi-vis and no clone, and confirm the server
leaves `kp_badge_tailgated` false and the debrief does not read the tailgate as earned, while the
avatar still stands in the room (no snap-back). Then the honest run (wear hi-vis, walk in) is
promoted and credited, and the clone run (present `cm_records_badge`) is credited via the rfid
unlock. The tampered step is the proof the fix bites. Record game ids in the build log.

**Live proof, `enter_room` under real network delays (§8).** In a headless browser (keyless server
on the assigned port, `setFPS(20)`, fixed steps on), prove the honest completion against delays the
player can actually meet, and keep the forge refused. The door `/unlock` is allowed to land normally
in every honest case (it is what writes the durable `unlockedRooms` membership); what is delayed,
dropped or skipped is the soft `currentRoom` sync and the pre-flush. Each case names the guarantee it
proves. Record game ids in the build log.

1. **Delayed, then dropped, `currentRoom` and pre-flush.** With the door `/unlock` already landed,
   use Playwright `route` to delay the entry `sync_state` by several seconds and, in a repeat,
   `abort` it entirely. Drive the honest player into the target room and post the `enter_room`
   completion. It completes and is not refused in either run. **Proves:** the server-checked unlock
   wrote `unlockedRooms` before the client could enter, so the completion does not depend on the
   `currentRoom` sync or the pre-flush landing (or landing at all).
2. **Old tab, no pre-flush.** With the pre-flush disabled (simulating a tab opened before this
   change), post the completion with no prior `currentRoom` sync for the target. It completes.
   **Proves:** the durable `unlockedRooms` write, not the client pre-flush, is load-bearing; an old
   client is not refused.
3. **Offline then reconnect, the client's own queue re-posts.** With the door `/unlock` already landed,
   drive the honest player into the target room, then take the browser offline with Playwright's
   `context.setOffline(true)` and fire the `enter_room` completion: the retries exhaust, it returns a
   transient failure, reverts to active at `:689`, and enters the in-memory re-send queue from that
   transient branch (§8.3). Assert the task id is actually in the queue before reconnect, so the proof
   fails if the enqueue were wired only to the thrown-error catch and missed the dominant offline path.
   Then `context.setOffline(false)`, which fires the browser `online` event. The client's own `online`
   handler drains the queue through `completeTask`, with no proof-driver re-post, and it completes.
   **Proves:** the queue is fed from the real offline path, `unlockedRooms` persisted across the gap, and
   the client recovers by itself on reconnect; reconnection timing does not refuse an honest player.
4. **Duplicated or retried completion.** Fire the `enter_room` completion twice (and let the client
   retry path re-post). Both report success, the task is completed once, and any credited global or
   counter is written once. **Proves:** idempotent completion over durable state; a retry or
   duplicate never double-credits or flips the task back to active.
5. **Forge, refused.** With a tampered client that never entered the room (target in no durable
   list), `POST` the `enter_room` completion directly. The server refuses it
   (`Room not reached`, `retryable: true`), the client re-syncs and re-posts once, the room is still
   not durably reached, and the refusal surfaces; the task stays active. **Proves:** the check bites
   on a true forge, and the retryable refusal does not launder a forge into a pass.

## 14. Build split (chunks a fresh agent can do under about 150k tokens each)

- **Chunk A: server split and serve.** `npcRouteRooms` list; `gated_route_room?` and
  `split_gated_door?` helpers; the `unlock` action route-room branch (3.5); `GET room` and
  auto-unlock changes (3.2); `currentRoom` acceptance for route rooms (3.3a, acceptance only); the
  object-action gate (§3.6): the valid-path controller guard on the `/unlock` object branch (rendering
  `{ success: false, reason: room_not_reachable, retryable: true, status: :forbidden }`) and the
  `nil`/`false` returns in `pin_cracker_feedback`, `password_case_mismatch?` and `uid_only_refusal?`.
  **The object-path client retry (§3.6):** in `notifyServerUnlock` (`unlock-system.js:22-45`, catch at
  `:39-41`), recognise a `room_not_reachable` retryable `error.body`, await one `window.stateSync.sync()`
  wrapped so a rejecting sync still proceeds, and re-post the `apiClient.unlock` once, returning the
  re-post's answer on success and surfacing the refusal otherwise (fires only on that reason-and-flag
  body, never for a door). Rails tests 1, 6, 10, 11a, 12, 13; the four `unlock-system` object-retry node
  tests (§13). No credit yet.
- **Chunk B: the credit, server-owned.** `creditOnPass` schema; `serverCreditGlobals` derivation and
  read-only union (3.4); `write_server_globals!` credit write; the `viaPass` check on `currentRoom`
  with the `scenario_data`-only load (fetch via `stored_scenario_data` once, only when a credit is
  about to fire, set on the record so the whole `complete_task!` call tree reads it; 3.3a, B2). Rails
  tests 2, 4, 7. **The credential write (viaCredential, 3.3b)** reads the rfid possession check
  `rfid_lock_passes?` -> `rfid_requires_held?` (`game.rb:2545`, `2563`), merged on main: the credit
  is gated on that server possession result, never on the client-sent `card_ids` (the clone POST
  sends none). Wire the viaCredential credit to that result (3.3b, B1) and add Rails tests 3, 3b, 8.
  **The object-action gate's acceptance path (§3.6)** needs promotion, so its acceptance and idempotency
  tests land here: Rails tests 11b (container unlocks and the `unlock_object` task completes after
  promotion) and 11c (the object-unlock re-post is idempotent, crediting the task once). Build order is
  Chunk A then Chunk B: A builds the gate and the client retry, B promotes and proves acceptance.
- **Chunk C: server-completed tasks.** `serverCompletedOnly` set; the `complete_task!` and
  `skip_task!` guards; the `trusted:` keyword (section 7). Rails tests 5, 5b, 5c.
- **Chunk D: scenario migration and lab edits.** Add `creditOnPass` to the lab gate; remove the
  client credit writers (`:915`, `:932`) and the two `room_entered:secure_area` `completeTask`
  backstops (`:728`, `:729`) into `tmp/delete/`; the soft-lock demotion (section 10). Rails test 9;
  node scenario-scan.
- **Chunk E: fixtures, validator, graph, live proof.** `test_gate_tailgate` `creditOnPass` fixture
  with `visitor_pass` made a worn, server-owned pass (§6, Q1); validator rules (section 12), including
  the server-owned-pass-global rule; dungeon-graph label and regenerate; the four-scenario validator
  run and the keyless-server live proof (section 13).
- **Chunk F: `enter_room` server validation (§8).** `player_reached_room?`; the check and the
  `retryable` refusal in the `enter_room` branch of `complete_task!` (`game.rb:3745`); the
  `objectives-manager.js` pre-flush on the `enter_room` completion path and its handling of a
  `retryable` refusal (one re-sync wrapped so a rejecting sync still proceeds, then one re-post, then
  surface); the **bounded in-memory re-send queue** of failed `enter_room` completions (§8.3): a field
  on `ObjectivesManager`, keyed by task id, fed from the two failure points in `completeTask` (the
  transient/offline branch `objectives-manager.js:687-694`, enqueuing on `response.transient === true`,
  and the thrown-error catch `:719-731`), drained by a `window` `online` listener and by the syncs
  `ObjectivesManager` itself awaits (the pre-flush `:613-615` and the inline retryable re-sync) through a
  re-entry-guarded `drainEnterRoomQueue()` that re-runs `this.completeTask(taskId)` so the end-screen and
  conclude-race handling at `:662-718` still apply, dropped on success or any not-transient outcome,
  never in `player_state` (no sync-success hook is added to `state-sync.js`); and the **init replay**
  that closes the reload-in-room ordering gap (§8.3): at the end of `initialize` (after `:110`), if
  `window.currentPlayerRoom` is non-empty, call `handleRoomEntered(window.currentPlayerRoom)` once.
  Rails tests 14-21; the node pre-flush, old-tab, retry, rejecting-re-sync, offline-queue and
  queued-mission-conclude tests; the five-case browser live proof under real network delays (section 13),
  with Case 3 driving real offline and online via Playwright `context.setOffline` and asserting the task
  entered the queue from the transient path. Independent of Chunks A-E, so it can build in parallel.

## 15. Decisions (2026-11-13)

- **Q1.** Every split gate's `playerMayPassIf` must be a server-owned global the client cannot write
  (validator-enforced, §12); `test_gate_tailgate`'s `visitor_pass` is made a worn, server-set pass so
  its viaPass path splits and the fixture proves the strong pass path (§6).
- **Q2.** Land the full change now. The rfid possession check (`rfid_lock_passes?` ->
  `rfid_requires_held?`, `game.rb:2545`, `2563`) is merged on main, so the credential path is built
  in Chunk B against that check, with no deferral.
- **Q3.** `test_bark_bubbles` and `test_access_habits` stay presentation-only (client-trusted,
  uncredited), with the carve-out recorded in a short README note in each scenario directory (§6).
- **Q4.** `enter_room` tasks are validated server-side against the player's durable room record
  (`unlockedRooms`/`startRoom`/world room/`npcRouteRooms`/`currentRoom`), with a conclude-race-style
  client pre-flush for ordering; built as its own chunk (§8, Chunk F).
- **Q5.** Accept the cross-room code leak (`p4_safe`): the credit is optional and nothing is taken.
  The §12 validator warning records any server-enforced lock code placed in a route room's readable
  text.
- **Q6.** Phish-evidence recording is out of scope here (see below).

## 16. Out of scope (scheduled later)

- **Phish-evidence recording.** Making submitted phishing evidence a server-owned capture is a
  separate hardening item, scheduled after this work lands; it is not designed or built here.
