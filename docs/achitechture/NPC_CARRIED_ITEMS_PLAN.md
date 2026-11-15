# NPC carried items: server-tracked held items

## Build status (slices A and B done; slice C out of scope)

Slices A (server) and B (client wiring) are built and tested. Slice C (KO while
carrying, reload mid-carry) is not built; its hooks are noted below.

Design as built, differences from the plan:

- Reveal slots (a copier output and the like: `outputOf` / `revealOnGlobal` /
  `leftBehindChance`) are excluded from the carriable allowlist, so their existing
  client-only place-then-file flow is unchanged and a filed slot never reappears
  after a reload. `placeHeld`'s put-down call is then a no-op for them.
- Put-down reachability is checked against the pick-up room's adjacency
  (`rooms_connected?`), because the server does not track a needs NPC's live room.
  Same room or a connected room is allowed; the controller's unlocked-room gate
  still applies.
- `apply_npc_carry!` suppresses a carried held item only when the player has taken
  it into inventory, not via `delivered_item_ids` (the carried id lives in the
  origin room's `objects_removed`, which `delivered_item_ids` unions, so it would
  wrongly suppress the held item).
- The npcCarry jsonb write needs `player_state_will_change!` before the save: an
  intermediate save in `remove_item_from_room!` otherwise reset dirty tracking and
  the nested entry was dropped.
- The sync merge (`merge_npc_carry!`) validates against the allowlist only when
  scenario_data is loaded; the narrow sync load rebuilds the entry from known keys
  (extra keys dropped, bounded by the NPC count), and the serve path re-validates
  every stored carry, so a non-carriable stored entry is inert (never served, put
  down or consumed).

Commits (branch build/ol-carry): slice A `d86a1bacc`, slice B `018b240b9`,
persistence fix + Rails tests `1956a6e84`, JS test `b8f8801b0`.

Tests: Rails `npc_carried_items_test.rb` 15 runs, 56 assertions, 0 failures;
reload_persistence + forged_ko_drop + game_test 190 runs, 801 assertions, 0
failures; rubocop 0 offences on the changed files; `bin/test-js` 674 files passed,
0 failed (includes the new `test/js/npc-carry-wiring.test.mjs`, 5 tests, and the
unchanged needs golden tests). train-smoke on m01/m02 NOT run (budget).

### Live proof (keyless server :3095 from the worktree, game 5512)

Game 5512 (`new-game.rb test_needs_sims`). Amara (a needs NPC in the office)
carries `office_mugs`. The authoritative check reads the room-fetch endpoint
directly. All carry/put-down/consume actions answered `{"success":true}` / 200.

| step | action | server | office floor | amara itemsHeld | kitchen/office landing |
| ---- | ------ | ------ | ------------ | --------------- | ---------------------- |
| 1 | carry office_mugs | 200 | mug gone | office_mugs | - |
| 2 | put_down office px333/py444 | 200 | 1 mug @ (333,444) | empty | lands once |
| 3 | reload (re-fetch) | - | 1 mug @ (333,444) | empty | not duplicated |
| 4 | carry again + consume_carried | 200 + 200 | mug gone | empty | - |
| 5 | reload after consume | - | mug gone | empty | stays gone |

put_down into the locked kitchen answered 403 (the unlocked-room gate), not 422.

Server log: the only `Completed 422` was a pre-token attempt rejected for
`Can't verify CSRF token authenticity` (before the harness sent the X-CSRF-Token
header); every carry_object / put_down_object / consume_carried request that
carried the token answered 200. No carry-logic 422.

Not yet run (budget): the README browser tour rows touching carries with a
page-error check, and the real headless needs-NPC drive (the needs walk is flaky
headless per the scenario README; the HTTP drive above exercises the same server
endpoints and persistence).

### Slice C hooks (not built)

- KO while carrying: `npc-hostile.js` KO handling (`dropNPCItems`, ~719) should ask
  the needs world to drop the carried item into the KO room and end the carry as a
  put-down into that room at the body position. The server put-down already accepts
  the carrier's room when it is reachable; a KO drop would need the KO room treated
  as reachable (the KO-drop trust, as `add_item_to_room!` does for `npc_defeated`).
  `npcCarry[npc_id]` must be cleared on the KO drop.
- Reload mid-carry: already correct server-side (the object is served in the NPC's
  itemsHeld from the npcCarry delta and absent from its origin room). No client
  restore code is needed for correctness; the needs system may stow/drop on its next
  tick. A future reload-time rule could set it down at the NPC.
- Player takes the carried item: `apply_npc_carry!` already suppresses the held item
  once it is in inventory; on delivery the `npcCarry` entry should also be cleared
  (hook: wherever `npc_given_items` / delivery is recorded).



User direction (verbatim): "When an NPC picks up an item it should be in held
items, and can be moved."

Today an object an NPC picks up to carry (a mug for coffee, dirty mugs to the
washing-up tray, a printout fetched to a desk, Neil's page, a fetched chair) is
tracked only on the client. The server still believes the object sits in its
scenario room. The symptom logged as E-carry-422: a carry finishes, the client
asks the server to `remove_object` the mug, and the server answers 422, so the
mug survives in the world and comes back on reload.

This plan moves a carried object into the carrying NPC's held items server-side.
Its location follows the NPC. When the NPC puts it down, it lands there. The 422
goes because the server always knows which room the object is in.

---

## 1. Current flow and the exact cause of the 422

### Client carry (all in `public/break_escape/js/systems/npc-needs.js`, the
engine world object built by `createEngineWorld`)

- `pickUp(npcId, itemId)` (npc-needs.js:5580). `findSprite` locates the sprite and
  its current room `f.roomId`. It deletes `rooms[f.roomId].objects[f.key]`, marks
  the sprite `_npcCarried`, and records `rec._needsCarried[itemId] = { sprite,
  roomId: f.roomId, key: f.key }`. It touches `rec.itemsHeld = rec.itemsHeld || []`
  but never pushes the carried item into it. No server call. The server still
  lists the object in its scenario room.
- `consumeHeld(npcId, itemId)` (npc-needs.js:5601). On a use that uses the item up
  (the washing-up tray, a drink), it destroys the sprite and calls
  `RoomStateSync.removeItemFromRoom(held.roomId, itemId)` (npc-needs.js:5608).
- `dropHeld` (npc-needs.js:5610) and `placeHeld` (npc-needs.js:5632) put the sprite
  down client-side and re-register it under the NPC's current room (`sp.roomId` is
  set to the behaviour room, e.g. the kitchen), with no server call.
- `_completeUse` routes a plain carried item to `consumeHeld`
  (npc-needs.js:3586); `_abandon` (npc-needs.js:3968-3969) drops or stows it.

### Server remove path

- `RoomStateSync.removeItemFromRoom(roomId, itemId)`
  (public/break_escape/js/systems/room-state-sync.js:104) POSTs
  `actionType: 'remove_object'` to `update_room`.
- `GamesController#update_room` (games_controller.rb:1027) first checks
  `@game.room_unlocked?(room_id)` (games_controller.rb:1039), then calls
  `@game.remove_item_from_room!(room_id, item_id)` (games_controller.rb:1064).
- `Game#remove_item_from_room!` (game.rb:1096) calls `item_in_room?(room_id,
  item_id)` (game.rb:1115, defined game.rb:1550). That returns true only when the
  id is a scenario object of `room_id` (and not in `objects_removed`), or is in
  that room's `objects_added`. If the object is not known in `room_id`, it returns
  false (game.rb:1116-1119).
- A false return makes the controller render `{ success: false }` with
  `status: :unprocessable_entity` (games_controller.rb:1106-1107). That is the 422.

### The 422 cause (two lines)

The client removes the mug naming the room the NPC walked it into (its current
room), but server-side the mug is a scenario object of a different room, so
`item_in_room?` returns false (game.rb:1115-1119) and `remove_item_from_room!`
returns false, which `update_room` renders as 422 (games_controller.rb:1106-1107).
Root cause: the server never learned the object moved, because pick-up and
put-down are client-only; `office_mugs` lives in `office` scenario-side, and an
abandoned carry re-registers its sprite under `kitchen` (dropHeld,
npc-needs.js:5624-5625), so a later carry picks it up "from the kitchen" and the
remove names a room the object was never declared in.

---

## 2. Design

A carried object becomes a held item of the NPC, tracked by one small per-NPC
delta. Its served location follows the NPC. The client stops naming arbitrary
rooms in remove calls; it reports pick-up, put-down and consume against the NPC,
and the server resolves the room from what it stored.

### Data shape (small, delta, keyed per NPC)

A new ring-keyed section `npcCarry`, added to `RING_KEYED_SECTIONS`
(games_controller.rb:2189), so it merges per NPC like `npcHostility` and never
grows a re-sent blob. One entry per carrying NPC:

```
player_state['npcCarry'][npc_id] = {
  "itemId":   "office_mugs",   # a scenario object id, validated against the allowlist
  "fromRoom": "office"         # the room the object was picked up from (its scenario room)
}
```

At most one carried item per NPC (the needs system carries one at a time). The
entry is written on pick-up and deleted on put-down, consume, KO-drop or delivery.
Because the section is keyed and merged, and the entry is a two-field record
rebuilt field by field from known keys (the `npcHostility` pattern,
KO_POSITION_ON_RELOAD.md "How it travels"), repeated syncs are idempotent and the
stored size is bounded by the NPC count.

The origin room's loss of the object rides the existing room-states delta: pick-up
adds `itemId` to `player_state['room_states'][fromRoom]['objects_removed']`, so the
object stops being served in its home room. Put-down adds it to the target room's
`objects_added` (the add_item_to_room! machinery) at a position.

### Pick up

New `actionType: 'carry_object'` on `update_room` (or a dedicated endpoint). The
client sends `{ npcId, itemId, fromRoom }`. The server:

1. Validates (section 3): object is carriable, NPC may carry, the object is in
   `fromRoom` now, `fromRoom` is unlocked.
2. Writes `npcCarry[npc_id] = { itemId, fromRoom }`.
3. Adds `itemId` to `room_states[fromRoom]['objects_removed']` (reusing
   `remove_item_from_room!`), so the object leaves its room.

Served: `filtered_room_data` (game.rb:2073) injects the carried object into the
carrying NPC's `itemsHeld` from the scenario object definition (so it shows in the
hand via office visuals and can be taken), wherever that NPC is served. This
answers "it should be in held items".

### Put down

New `actionType: 'put_down_object'`: `{ npcId, itemId, toRoom, position }`. The
server:

1. Confirms `npcCarry[npc_id]['itemId'] == itemId` (the NPC really carries it).
2. Validates `toRoom` unlocked and reachable from the NPC.
3. Adds the object to `toRoom` via the existing `add_item_to_room!` persistence
   (game.rb:934), persisting the server-side scenario definition of `itemId` (not
   client fields), only `position` from the client, `takeable/interactable/active/
   visible = true` (as add_item_to_room! already does, game.rb:1003-1005).
4. Deletes `npcCarry[npc_id]`.

The object now lands in `toRoom` and a reload serves it there.

### Consume (used up)

New `actionType: 'consume_carried'`: `{ npcId, itemId }`. The server confirms the
`npcCarry` entry, deletes it, and leaves the origin room's `objects_removed` in
place (the object is gone for good). No room is named by the client, so there is
no wrong-room 422. This replaces the current `consumeHeld -> removeItemFromRoom`
call that fails.

### KO while carrying

Match today's KO drop. On KO, `dropNPCItems` (npc-hostile.js:719) drops the NPC's
scenario `itemsHeld` to the room floor via `addItemToRoom(npcRoomId, ...,
source_type: 'npc_defeated')` (npc-hostile.js:896), guarded server-side by
`add_item_to_room!` (game.rb:944-993). A carried needs object lives in
`_needsCarried`, not in that `itemsHeld` array, so it is not dropped today.

Design: when a carrying NPC is knocked out, the carried object drops to the KO
room floor, like its gifts. Client: `npc-hostile.js` KO handling asks the needs
world to drop the carried item (`dropHeld`) in the KO room and the carry endpoint
is told to end as a put-down into the KO room at the body position (server
validates `toRoom` is the room the NPC is in, same trust as the KO drop). The
`npcCarry` entry is cleared. This reuses the KO-drop room rule (an NPC drops where
it fell) rather than inventing a new one. A koImmune NPC never carries into a KO,
so nothing special is needed there.

### The player takes it, or it is a takeable item

Because the carried object is served in the NPC's `itemsHeld`, the existing
give/take flow and `npc_given_items` handle a player taking it: once given, the
item id joins `delivered_item_ids` (game.rb:1465) and is suppressed from
`itemsHeld` on every subsequent serve (game.rb:2264-2275). On delivery the server
also clears the `npcCarry` entry (the NPC no longer holds it). `delivered_item_ids`
already unions inventory, `objects_added` and `objects_removed`, so a carried item
the player takes is not resurrected in its origin room.

### Reload in the middle of a carry

On reload the server serves the object in the carrying NPC's `itemsHeld` (from the
`npcCarry` delta), and not in its origin room (origin `objects_removed`). The
client's needs state is fresh after a reload (it does not restore an in-flight
carry job), so the NPC is not mid-walk holding it; the item is simply shown as a
held item of that NPC until a new job moves it, the player takes it, or (if the
scenario prefers) a reload-time rule sets it back down at the NPC. Preferred
simple rule: on reload, a still-carried item is served in `itemsHeld`; the needs
system may stow/drop it on its next tick (it already stows revealed slots on
sight, npc-needs.js:5751). No new client restore code is required for correctness;
the object is never lost and never duplicated.

---

## 3. Security (client is untrusted)

The server hard-enforces, matching the cheat-resistance rule in AGENTS.md (secrets,
keys and forged items are server-enforced; see the existing `add_item_to_room!`
guards, game.rb:944-1006).

- **Carriable allowlist.** The server computes, from `scenario_data`, the set of
  carriable object ids: scenario objects that carry a `needsTag` (the office-life
  carry points: `office_mugs`, `washing_up_tray` and the fetch/print slots are the
  only objects the needs system carries) **and** are not keys or locked content. A
  `carry_object` for any id outside this set is refused. This is what stops a
  client dragging a keycard or a locked item into a hand. Reject outright any
  candidate that is `locked`, has `requires`, `opens_lock`, `keyPins`, non-empty
  `contents`, or type in the key/credential families. A carriable object is
  ordinary office furniture dressing, never a lock key.
- **The object must really be there to pick up.** `carry_object` requires
  `item_in_room?(fromRoom, itemId)` true now and `room_unlocked?(fromRoom)` true,
  so an object in a locked or unreached room cannot be carried out.
- **Which NPCs can carry.** Only scenario NPCs (`scenario_npc_ids`,
  game.rb:5224) that are needs NPCs (have a `needs`/`needsHome` block). A client
  naming a stranger NPC, or an NPC id from another game, is refused (the
  `npcHostility` precedent, KO doc section "Server-side validation").
- **Put-down reachability.** `put_down_object` requires `room_unlocked?(toRoom)`
  and that `toRoom` is the NPC's current/served room or adjacent to it (the needs
  system only ever sets a carried item down in the room it walked to). This stops a
  client teleporting an object into a room next to the player, or into the player's
  hands, by naming an arbitrary room.
- **No forged items.** Put-down and the served held item are built from the
  server-side scenario definition of `itemId` (`add_item_to_room!` already does
  this, game.rb:1003-1005). The client supplies only `position`. A client cannot
  invent an object, change its type, or attach flags/launch payloads.
- **One item per NPC, must match.** `put_down_object` and `consume_carried` only
  act when `npcCarry[npc_id]['itemId'] == itemId`. A client cannot consume or place
  an item the server has no record of the NPC carrying.
- **Idempotent and bounded.** The delta is keyed per NPC and rebuilt from known
  keys; repeats are no-ops; extra keys are never stored (the KO-position
  precedent). A carried-item id already delivered or dropped is a no-op, not a
  second add (mirrors game.rb:977-983).

Net: the only objects that can enter this path are declared office-life carry
objects, moved by their own needs NPCs, between unlocked reachable rooms, with the
object persisted from the scenario definition. Keys, credentials, locked content
and forged items cannot.

---

## 4. Tests to write

### JS unit (node --test, add files to the bin/test-js harness copy lists)

- `pickUp` records the carried item and the engine reports it as a held item of
  the NPC; the sprite leaves its origin room's `objects`.
- `consumeHeld`/`dropHeld`/`placeHeld` call the new endpoints with the NPC and
  item, never a client-named arbitrary room, and are no-ops when the NPC holds
  nothing.
- KO while carrying drops the carried item in the KO room.

### Rails (test/controllers and test/models, including hostile input)

- `carry_object` moves the object out of its origin room and into the NPC's served
  `itemsHeld` (GET room of origin no longer lists it; the NPC's room serves it
  held).
- `put_down_object` lands the object in the target room at the position, from the
  scenario definition, and clears the carry entry.
- `consume_carried` clears the carry entry and leaves the object gone; no 422
  (the E-carry regression test: carry then consume answers 200, the object does
  not come back on a re-fetch).
- Hostile input: carry of a non-carriable id (a keycard, a locked object, an id
  with `opens_lock`/`keyPins`/`contents`); carry from a locked/unreached room;
  carry by a non-needs or unknown NPC; carry of another game's object/NPC id;
  put-down into a locked or far room; put-down/consume of an item the NPC does not
  carry; forged item fields in the put-down body (type/flags ignored, scenario def
  wins). Each is refused and writes nothing.
- Delta hygiene: syncing the same carry twice leaves `npcCarry` unchanged and
  bounded; extra keys in the entry are dropped (the KO-position no-growth test
  pattern).

### Live proof (keyless server from the worktree, headless at setFPS(20))

- Fresh `test_needs_sims` game. Drive a needs NPC (Grace) through the
  `dirty_mugs` carry office -> washing-up tray in the kitchen. Read the room-fetch
  endpoint directly: before, the mug is in `office`; after pick-up, `office` no
  longer serves it and Grace serves it held; after the tray use, the mug is gone
  and a reload keeps it gone. No 422 in the server log for the carry.
- Reload mid-carry: pick up, reload (about:blank then back), confirm the object is
  served held by the NPC and not duplicated in its origin room.
- KO while carrying: knock the carrying NPC out, confirm the carried object drops
  to the KO room floor and a reload keeps it there.

---

## 5. Size estimate

**L.** New server delta section with its own validation, two or three new
`update_room` actions, serve-into-itemsHeld in `filtered_room_data`, a carriable
allowlist, and client wiring across three systems plus the KO drop, each needing
unit, Rails hostile-input and live proof. Larger than M, so the coordinator
proposes it to the integrator before building.

Files touched:

- `app/models/break_escape/game.rb` — `npcCarry` merge/validation, carriable
  allowlist, `carry_object!`/`put_down_carried!`/`consume_carried!`, serve carried
  items into NPC `itemsHeld` in `apply_room_state_changes!`/`filtered_room_data`,
  clear on delivery.
- `app/controllers/break_escape/games_controller.rb` — new `update_room` action
  branches; add `npcCarry` to `RING_KEYED_SECTIONS` (line 2189).
- `public/break_escape/js/systems/room-state-sync.js` — new carry/put-down/consume
  sync calls (replacing the wrong-room `removeItemFromRoom` for carries).
- `public/break_escape/js/systems/npc-needs.js` — `pickUp`/`consumeHeld`/
  `dropHeld`/`placeHeld` call the new calls and record the item in `itemsHeld`.
- `public/break_escape/js/systems/npc-hostile.js` — KO while carrying drops the
  carried item.
- Tests: `test/js/*` (new), `test/controllers/break_escape/*` and
  `test/models/break_escape/*` (new or extended), harness copy lists for new JS
  modules.

### Slices (splittable)

- **Slice A (server only):** `npcCarry` delta, validation, allowlist, the three
  actions, serve-into-itemsHeld, Rails + hostile-input tests. No client change yet;
  prove with endpoint-level Rails tests.
- **Slice B (client wiring):** repoint `pickUp`/`consumeHeld`/`dropHeld`/
  `placeHeld` at the new endpoints, record the carried item in `itemsHeld`, JS
  units, live proof of the mug carry with no 422.
- **Slice C (KO and reload):** KO-while-carrying drop and reload-mid-carry
  behaviour, with their live proofs.

### Live proof through the game client

Keyless server on :3095 from this worktree, headless, `setFPS(20)` with fixed steps on, fresh
`test_needs_sims` games. Driver: `tools/playtest/npc-carry-live-proof.mjs` (Grace notices the office
mugs and carries them to the washing-up tray; the `consume` beat lets her finish, the `drop` beat
suspends her mid-carry with `npcNeedsSystem.control('grace', 'suspend')`). The room fetch is read
before, mid-carry, after and after an `about:blank` reload.

| Check | Result | Evidence |
|---|---|---|
| Pick-up | PASS | `carry_object` grace/office_mugs 200 in games 5515, 5516, 5517, 5522, 5523; room fetch mid-carry: office has no mug, Grace `itemsHeld: [office_mugs]` |
| Consume at the tray | PASS | games 5517 and 5523: `consume_carried` grace/office_mugs 200 (roomId kitchen); after it the office and kitchen fetches hold no mug and Grace's `itemsHeld` is empty |
| Reload after consume | PASS | about:blank then back: office, kitchen and lounge fetches hold no mug; no mug in `window.rooms` |
| Put-down (job aborted or suspended) | PASS | games 5515, 5516, 5522: `put_down_object` 200 with the NPC position; fetch shows one `office_mugs` in the office at that `position` and Grace's `itemsHeld` empty |
| Reload after put-down | PASS | game 5522: the same single mug at `px 119.2, py 111.4` after the reload, none in the kitchen or lounge, one object in `window.rooms` |
| No `remove_object` for the mug, no mug 422 | PASS | 0 `remove_object` requests in the whole server log; every carry_object, put_down_object and consume_carried for `office_mugs` answered 200 |
| Page errors | PASS for the mug beats | 0 pageerrors, 0 console errors in games 5515, 5516, 5522 (see the next row for 5517) |
| Copier output carried by Amara | FINDING | `carry_object` and `put_down_object` for `copier_out_a` (a reveal slot, outside the allowlist) both answer 422 (6 in the log, games 5517 and 5523); the client ignores them, but they show as console errors. The plan's "put-down is a no-op" holds for the game state, not the status code |
| README tour rows 1, 3, 5, 6 (`needs-tour-regression.mjs`, game 5523) | rows 3, 5, 6 PASS; row 1 FAIL | row 1 missed the `see_queue_chat` task (151 s); 0 page errors, 0 stuck. Row 1 is the queue chat, not a carry path; not compared against a run without this branch |
| train-smoke m01 and m02 (games 5524, 5525) | PASS | `TRAIN-SMOKE 2 games, 0 failed` |

Not done: KO while carrying and reload mid-carry (slice C).
