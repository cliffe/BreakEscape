# Friendface phone item: code review, round 4

Branch `build/ff-phone` at 312934495. Scope: the R3 fixes in fb47aaa72, 2a5b6e287 and 312934495,
above all the KO drop code every mission goes through (`npc-hostile.js` `withSyncRetries`,
`redropPending`, `dropNPCItems`; `Game#add_item_to_room!`, `npc_defeated?`,
`npc_held_item_delivered?`, `npc_ko_drop_pending_ids`; the `koDropPending` hook in
`npc-sprites.js`). Round 3: `FRIENDFACE_PHONE_ITEM_CODE_REVIEW_R3.md`; build log section "R3 fixes".

Counts: 0 blocker, 1 major, 2 minor, 3 nit.

## What was checked

- Every path that now records or reads a KO, against the cheat policy: a KO is a client-flow step,
  best effort, provided the server checks the NPC can drop the item.
- Idempotency against pickup, reload and room re-entry, with the client's retries.
- Every KO-able NPC with held items in m01 to m10 (scenario scan of `itemsHeld`, ids, rooms,
  `koImmune`).
- Live proof on a keyless server at :3074 (stopped afterwards), headless, physics at
  `setFPS(20)` with fixed steps on. Games created:
  - 1590 (m03): Ffion KO'd with the first answer to each drop lost; pickup; reload.
  - 1591 (m07): Ray KO'd with every KO sync and drop blocked; pickup before any drop landed; reload.
  - 1599 (m07): the same blocked KO with the hostility record synced; reload; re-drop; pickup;
    reload.
  - 1592 (m01): forged requests for Kevin, who stays in the locked `it_room` (M1).
- Tests, affected files only, no lock: JS `npc-ko-drop-retry`, `combat-room-rule`,
  `npc-hostility-persistence`, `npc-ko-immune-and-door-event`, `npc-ko-restore-pose`: 5 files
  passed. Rails `friendface_phone_test.rb` 22 runs, 105 assertions, 0 failures;
  `game_test.rb` 97 runs, 405 assertions, 0 failures.

## Live results

| Game | What was done | Requests and outcome |
|---|---|---|
| 1590 (m03) | KO Ffion; the client throws away the first answer to each drop (the request reaches the server) | KO sync 200; `add_object visitor_badge` 200 (answer lost), retried 200; `add_object dropped_ffion_rees_1_...` 200 (answer lost), retried 200. Server: one `visitor_badge`, **two** entries for the id-less keycard (m1). Pickup of both: inventory add 200, `remove_object` 200 each; the remove cleared both keycard entries. Reload: Ffion KO'd, no `koDropPending`, no sprites, both items held once. |
| 1591 (m07) | KO Ray; every KO sync and drop blocked (4 + 4 tries, then given up); pick the local badge up before anything landed | Inventory add 200 (the NPC branch: Ray met), `remove_object` 422 (nothing in the room). Retry chain already finished. Reload: Ray KO'd (from the hostility record), nothing owed, badge held once. |
| 1599 (m07) | Same blocked KO, then a forced `sync_state` so the hostility KO reaches the server; reload | Server: hostility KO, no drop. Reload: the client lays Ray down and re-drops the badge (server log "Added item keycard (hollis_server_badge) to room security_checkpoint"). Pickup: inventory add 200, `remove_object` 200. Second reload: nothing owed, no sprite, badge held once. |
| 1599 (m07), first session | Same blocked KO, session closed with no `sync_state` (the headless close fires no `pagehide`) | Server held no KO at all; after reload Ray stood again holding his badge. Nothing lost: he can be knocked out again. |
| 1592 (m01) | Forged requests, see M1 | KO claim for `it_room` 403; KO drop from Kevin 422; forged hostility KO 200; then the same KO drop 200 for his keycard and his lockpick, and the keycard pickup 200. |

## Major

### M1. A forged hostility KO lets the client take any scenario NPC's held items, unmet and behind locked doors

R3 made `npc_defeated?` true when `player_state['npcHostility'][npc_id]['ko']` is true. That
record comes from `sync_state` through `merge_npc_hostility!`, which keeps any NPC id the
scenario has (room NPCs, phone NPCs and headless email records) with no room, met or
`koImmune` check. In `add_item_to_room!` an `npc_defeated` drop is accepted outside the NPC's
room as soon as `npc_defeated?` is true, so one `sync_state` plus one `add_object` into any
unlocked room stores the NPC's full held copy (forced takeable), and the pickup is then a room
item that skips every NPC check.

Before R3 the KO route needed `update_npc_state` against the NPC's own room, which the
controller refuses unless that room is unlocked (`room_unlocked?`), and the give route needs
the NPC met (`encounteredNPCs`, written only by GET /room for an accessible room). So the
widening is real: the NPCs it adds are exactly the ones behind a lock the player has not
opened, plus headless records and `koImmune` NPCs the player has never reached.

Proof, game 1592 (m01, start room `reception_area`, `it_room` locked, Kevin not met):
`update_npc_state` for Kevin in `it_room` 403; `add_object` keycard sourced from Kevin as
`npc_defeated` 422; `sync_state {npcHostility: {kevin_park: {hostile: true, ko: true}}}` 200;
the same `add_object` 200, and the same for his lockpick; `/inventory add` of the keycard 200.
The server now holds the server room keycard (`opens_lock: server_keycard`) and a lockpick in
reception, and the keycard in the inventory, without the player entering the IT room.

Missions with KO-able held items in locked rooms, all reachable this way: m01 Kevin, m02 Gary,
m03 Victoria, m04 Relay, m06 Irina and Satoshi, m09 Noor and Sorensen, m10 Vector (security
office), Vos and the lock guard, and the `koImmune` m09 Sorensen variants and m10 Nightshade at
the gallery lock. Under the cheat policy keys are hard-enforced, so a cheat that skips a locked
door to fetch a keycard is past "best effort".

Fix: count the hostility KO only for an NPC the player has met (`encounteredNPCs`), that has a
scenario room (no headless record) and is not `koImmune`, for example inside
`npc_ko_recorded_by_hostility?`. That keeps the R3 recovery (a drop or re-drop after a failed KO
sync, live in game 1599: Ray was met) and restores the old bound. Add a Rails test for an unmet
NPC in a locked room with a forged hostility KO.

## Minor

### m1. Held items with no id get neither idempotency nor a re-drop, and several are on intended routes

`npc_held_item_delivered?` and `npc_ko_drop_pending_ids` only see held items with an `id`. For
the rest:

- A retry after a lost answer stores a second copy. Game 1590: the client generated one id for
  Ffion's keycard and sent it on both tries, and `objects_added` held two entries with that id.
  The harm is small: `remove_object` rejects every entry with the id, so the pickup cleared both,
  and a reload before the pickup draws one sprite per entry with the same id.
- A drop that never lands is not listed after a reload, and a KO'd NPC never drops again, so
  the item is gone. This window existed before R3 too.

The build log says such items are "none on an intended route". They are: m01 Kevin's lockpick,
keycard and instructions, m01 Sarah's key and badge, m02 the receptionist's and the guard's keys,
Gary's keycard and Dr Kim's badge, m03 Ffion's staff keycard and Victoria's keycard, m04
Relay's keycard. (The R3 review itself named Kevin's lockpick and keycard and Relay's card as
route items.)

Fix: for an id-less held item, check the stored id the client sent (stable across retries)
against `objects_added`, `objects_removed` and the inventory before adding; and either give
these held items ids in the scenarios or have the validator warn on an id-less held item of a
KO-able NPC. Correct the build log line.

### m2. `koImmune` is checked only in the new branch

The R3 code records no KO from a drop for a `koImmune` NPC, and `npc_ko_drop_pending_ids` skips
one. But `update_npc_state!` and `merge_npc_hostility!` both accept a KO for a `koImmune` NPC, and
`npc_defeated?` does not ask, so a tampered client still gets a `koImmune` NPC's held items
through either record. For a met NPC in an unlocked room this predates the branch (and the give
branch already hands over any met NPC's non-phone held items), so it is not a new hole; the new
guard just suggests a protection the server does not give. Fix with M1: have `npc_defeated?`
return false for a `koImmune` NPC.

## Nit

- n1. **Definite refusals are retried.** `withSyncRetries` treats a 403 or 422 the same as a
  network error, so a drop the server refuses (room not accessible, NPC not KO'd) is sent four
  times over about 6 s. Bounded and harmless; `addItemToRoom` could tell the two apart by status
  and stop on a 4xx.
- n2. **Two local sprites on re-entry were not reachable.** `loadRoom` (`rooms.js`) skips a room
  that is already loaded, and `koDropPending` only arrives on a room's first load, which is after
  a reload. I found no in-session path to a second sprite from a retry. One related case: two
  KO-able NPCs holding the same item id (m10 `vector_post` and `vector_so`, both with
  `vector_cupboard_code`). If both are knocked out in one run, the second drop shows a local
  sprite while the server answers true and stores nothing; the pickup then goes through the
  give branch. Not run live; worth one test if both can be fought in a run.
- n3. **Pending ids cost a walk per NPC per room load.** `npc_ko_drop_pending_ids` calls
  `npc_defeated?` (a scenario record walk) and, per held id, `npc_held_item_delivered?` (every
  room state and the inventory) for every NPC in every GET /room. Bounded by the scenario; fine
  today, cheap to skip for NPCs with no KO record first.

## Trust questions, answered

| Question | Answer |
|---|---|
| KO recorded from an in-room `npc_defeated` drop | No widening. It needs the NPC in that room (`npc_in_room?`), the room unlocked (controller), and an item the NPC holds; `update_npc_state` already accepted the same claim. |
| `koImmune` | The new branch refuses it; the rest of the server does not (m2). |
| Home room | The add writes the KO only to the room it is sent to, and only when the NPC is in that room; an NPC that fell elsewhere needs a KO already recorded. The hostility record bypasses this (M1). |
| Items the NPC does not hold | Refused: `find_npc_held_item` reads the scenario record, and the stored object is that held copy with only `x`, `y` and `position` from the client. |
| `clientAdded` forged items | No such field in this tree. Client item fields never reach the stored drop beyond placement, and the Friendface phone stays hard-enforced (no unsourced phone add, `phoneOf` forbidden from the client). |
| Idempotency | Holds for items with an id against retries, pickup before landing, reload and re-drop (games 1590, 1591, 1599). Not for id-less items (m1). |

## Sync size

| Added | Where | Bound | Sent |
|---|---|---|---|
| KO record from a drop | `player_state.room_states[room].npc_states[npc]`, the entry `update_npc_state` writes | One per NPC | Never re-sent; written once |
| `koDropPending` | GET /room answer only, not saved | The NPC's id'd held items, empty once they land | Once per room load |
| Retries | Client memory | At most 4 requests per KO sync and per item | Single-item requests, never the whole state |
| Duplicate id-less drops (m1) | `objects_added` | At most 3 extra entries per id-less item per KO; removed on pickup | Not synced by the client |

Nothing new grows without bound, and no sync re-sends whole state. Fixing m1 removes the only
extra growth.
