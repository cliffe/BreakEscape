# Hardening: RFID requires-only trust gap

Branch `build/hard-rfid`. Closes the server trust gap in `Game#rfid_lock_passes?`.

## The gap

A `POST /unlock` with `method: "rfid"` on an rfid lock that has `requires` but no `access`
list (a "requires-only" lock) returned true for a player who held no card and no clone.
`rfid_lock_passes?` returned `!rfid_requires_revoked?(lock)`, and `rfid_requires_revoked?`
returns false whenever the server sees no held required card, so the door opened for anyone.
The client's requires-only path (step 1a direct unlock, step 1b clone reader, and the gate
clone-as-entry in doors.js) sends method `rfid` with no `card_ids`, so the server had nothing
to check against and leaned on the trust rule.

## Why the trusted rule existed

It was `access`-model slice 9.2 (commit 544b164fe, ACCESS_MODEL_PLAN.md s4.1 line 196: "On a
mixed lock a `requires` card keeps today's client-trusted rule"). Pre-access-model, every rfid
unlock was client-trusted; the access-model work only hardened the new `access`-list path and
left the old `requires` path trusted to avoid regressing the many requires-only missions. The
revoked-cards fix later layered `rfid_requires_revoked?` on top so a cancelled card is refused,
but kept the "no held card -> open" leak intact.

## Honest ways a player opens a requires-only rfid lock (all scenarios audited)

Audited every `lockType: "rfid"` lock without `access` across all scenarios/missions. The
required card is obtained in exactly these ways, all of which leave server-held state:

1. A physical keycard picked up, a start item, or `#give_item` from an NPC: becomes a keycard
   item in the server inventory. Its id is `card_id`, else `opens_lock`/`key_id`
   (`ItemIdentity.lock_ref`), exactly as the client's `evaluateRfidCredential` resolves it.
   Several real missions (m01 server_keycard, m02 server_room_keycard, m05 office_keycard,
   sis02 battery_hall_badge and workshop_rfid_key) use keycards with **`opens_lock` and no
   explicit `card_id`**, so the server must resolve by `lock_ref`, not `card_id` alone.
2. A clone made with the rfid cloner via `#clone_keycard`: every real `#clone_keycard` tag
   names the speaking NPC's **own** card (verified: m03 receptionist_badge/victoria_keycard_clone,
   m04 facility_keycard_level1/server_room_keycard, m05 employee_badge, m06 cto_badge, m07 and
   m08 server_zone_badge, m09 reading_staff_door/stacks_card, m10 tg_power_room_card,
   lab_physical_pentest cm_records_badge, test_clone_left_card clerk_card, test_gate_tailgate
   test_staff_badge). The server records those in `serverClones` (`record_card_clone!`), so it
   sees them while an `rfid_cloner` is held. No scenario uses a placeholder clone (a
   `#clone_keycard` for a card the speaking NPC does not own, which the server does not record)
   to open a requires-only lock, so the "works only through requires" placeholder path does not
   gate any honest completion.
3. A "phantom" requires id that no card declares, opened server-side by an NPC's `unlockDoor`
   mapping (m09 stacks_release, m10 tg_story_lock_blast_tunnel / _security_office / _workshop_floor
   / _gallery). Honest play opens these with `method: "npc"` (HaX's mapping) or they are already
   in `unlockedRooms`; the early `room_unlocked?` / `npc_mapping_unlocks_door?` returns handle
   them before the rfid branch. The rfid+no-card path that currently opens them is the cheat the
   gap describes, and closing it is correct.

So every honest requires-only open is provable from server-held state (inventory keycard by
`card_id` or `lock_ref`, or a recorded clone while the cloner is held). None needs the trust rule.

## The fix

Server only, `app/models/break_escape/game.rb`:

- New `rfid_requires_held?(lock)`: true when the player provably holds a non-revoked card whose
  id is named in the lock's `requires`. A keycard counts when its `card_id` or `lock_ref`
  (opens_lock/key_id) is a required id; a recorded clone counts while an `rfid_cloner` is held.
  A UID-only clone counts only at a lock with `acceptsUIDOnly: true` (same rule the access-list
  path applies via `rfid_passing_card_id`). Revoked ids are excluded (left-card consequence).
- New `held_keycard_ref_ids`: inventory keycard ids resolved as `card_id` else `lock_ref`,
  mirroring the client's `getCardId`. `held_keycard_ids` (card_id only, needed by the access
  list to resolve an NPC identity) is unchanged, so the access path is untouched.
- `rfid_lock_passes?`: for a lock with no `access`, return `rfid_requires_held?(lock)`; for an
  `access` lock with no `card_ids` (the mixed lock opened by its requires), also return
  `rfid_requires_held?(lock)` instead of the old "requires present and not revoked". The
  `access` + `card_ids` path is unchanged.
- Remove `rfid_requires_revoked?` (its revocation check is subsumed by excluding revoked ids in
  `rfid_requires_held?`).

Client: no change. The requires-only path already sends method `rfid` with no `card_ids`, and
that is all the server needs. doors.js and unlock-system.js are untouched, so no node test or
harness copy-list change.

## Stored games in progress

Reads only existing server state (inventory, `serverClones`, the `revoked_card_ids` global).
A game mid-play with the required keycard in inventory still opens the door; a door already in
`unlockedRooms`/`unlockedObjects` stays open via the early return. No field is added, renamed or
migrated, so pre-existing snapshots keep working.

## SYNC SIZE accounting

No new per-game state. `rfid_requires_held?` reads `player_state['inventory']`,
`player_state['serverClones']` and `player_state.globalVariables.revoked_card_ids`, all already
synced. `card_ids` is a request-only param, never stored. The sync payload is unchanged in size
and shape; nothing new is re-sent each sync.

## Tests

(filled after the build)

## Handover

(filled if context runs out)
