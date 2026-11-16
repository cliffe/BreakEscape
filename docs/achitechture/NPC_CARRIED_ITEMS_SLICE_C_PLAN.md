# NPC carried items, slice C: a reload in the middle of a carry

Owner direction (D3, verbatim): "When an NPC picks up an item it should be in held
items, and can be moved."

This plan decides what happens to a carry that is in flight when the player reloads,
and what must be built for it. It stands alone: the carry design it builds on is in
`NPC_CARRIED_ITEMS_PLAN.md`.

## Recommendation

**Keep put-back. Do not build resume.** Fix one defect in put-back (it forgets where
a re-carried object was lying), push the use's flags to the server promptly after a
consume, write the reload rule down, and prove with live reloads that the NPC picks
the object up again by itself and that Sofia's `usb_foothold` stays completable from
every reload point. Size **S**.

Resume is sketched in section 6 so the owner can choose it instead; it is an **M to
L** change that brings back the failure put-back was introduced to remove.

---

## 1. How it works today

A carry is server state. `carry_object!` (game.rb) writes
`player_state['npcCarry'][npc_id] = { itemId, fromRoom }` and records the object in
`room_states[fromRoom]['objects_removed']`. The room fetch then serves the object in
the NPC's `itemsHeld` (`apply_npc_carry!`). The carry ends in one of four ways, each
an `update_room` action the server checks:

| End | Server action | Result |
|---|---|---|
| Used up at the target (mug at the washing-up tray, BadUSB plugged in) | `consume_carried!` | entry deleted, object gone for good |
| Set down (job abandoned, device refused, slot placed) | `put_down_carried!` | object added to the target room at the client position, entry deleted |
| Carrier knocked out | `ko_drop_carried!` | object added to the KO room at the body, entry deleted |
| Player takes it from the NPC | `record_npc_gift!` then `clear_npc_carry_on_delivery!` | entry deleted, object in inventory |

On a reload the client's needs state starts empty: it has no job, no `_needsCarried`
record and no carried sprite. `GET /games/:id/scenario` runs
`prepare_bootstrap_state!`, whose writer `end_stranded_carries!` ends every stored
carry: it adds the object to `fromRoom`'s `objects_added` (built from the scenario
definition) and deletes the entry. The first room fetch therefore shows the object on
the floor and the NPC free, and the needs system's ordinary interest scan
(`_carryCandidate`, every choose tick, not event driven) finds it again.

---

## 2. Is resuming worth it?

### How long a carry lasts

The `npcCarry` entry exists from pick-up to the end of the use at the target. From
the scenarios (estimates; the live proof in section 5 measures them):

- **test_needs_sims, Grace's dirty mugs.** Office to the washing-up tray in the
  kitchen (an adjacent room), at a needs speed of 80 to 90 px/s, then a 5 s use:
  about 5 s of walking and 5 s of use, so roughly **10 s**.
- **lab_physical_pentest, Sofia's BadUSB.** Picked up on the open-plan floor and
  taken to her own desk (`usb_target_pc`, her `needsHome`, same room) at 100 px/s,
  then a 6 s use: 1 to 6 s of walking plus 6 s, so roughly **7 to 12 s**.
- Copier and printout carries use reveal slots, which are outside the carriable
  allowlist and never create an entry; a reload stows them on sight, unchanged.

A reload has to land inside that window to matter at all, and a reload itself takes
a few seconds.

### What the player sees after a reload, with put-back

The object is back where the NPC picked it up, and the NPC is at its spawn point. The
NPC notices the object on its next choose tick (Sofia's `tag_deviceB` interest has
weight 3, far above her caffeine need, and covers the whole open-plan room) and walks
the carry again. The visible cost is the same few seconds of walking replayed, plus
possibly the pick-up bark once more. Nothing is lost, duplicated or stuck, and no
objective needs a second player action.

### What resume would add

With resume the NPC would spawn with the object in its hand and walk to the target.
The server does not know the NPC's live position, so the walk restarts from the spawn
point either way: resume saves only the leg from spawn to the object. For Sofia that
leg is a few tiles across her own room. For the player the two are hard to tell apart.

### What resume costs

Resume needs the client to rebuild a needs job from server data: a held sprite with
no world sprite behind it, a `_needsCarried` record, a target that may have changed,
a job deadline and a priority against needs that may now be urgent. Every case the
rebuild misses leaves the object in a hand nobody can empty and the NPC unable to
carry again, which is exactly the stranded carry that put-back exists to prevent. It
also has to store and validate a client-chosen target on the server.

### Decision

D3 asks that a picked-up item is a held item and can be moved. Both already hold: the
carried object is served in `itemsHeld`, follows the NPC, and lands wherever it is
set down or dropped. A reload replaying ten seconds of a walk does not break that
promise, and resume's benefit is a few saved seconds against a new class of stuck
state. Put-back is good enough, provided it puts the object back **where it was
lying**, which today it does not always do (section 3, C1).

---

## 3. What slice C builds

### C1. Put-back returns the object to the spot it was picked up from (defect fix)

**Defect.** `end_stranded_carries!` rebuilds the object from its scenario definition,
so it lands at the scenario `position`, read as room-relative tiles in `fromRoom`.
That is right only when the object was picked up from its own scenario spot. When it
was lying somewhere else, it is wrong:

- **Sofia's BadUSB.** `kit_deviceB` is a scenario object of `briefing_room` at
  `{ x: 2.55, y: 0.95, elevation: 30 }` (on the kit table). The player carries it to
  the open-plan floor and drops it; the drop is stored in
  `room_states['open_plan']['objects_added']` with the drop position. Sofia picks it
  up from `open_plan`, so `fromRoom` is `open_plan`, and `remove_item_from_room!`
  deletes the `objects_added` copy, losing the drop position. A reload mid-carry then
  puts the stick in `open_plan` at tile (2.55, 0.95) with elevation 30: the briefing
  table's coordinates in the wrong room, at the top of the open-plan back wall. If
  that spot is not reachable, `_nearestReachable` never selects it, Sofia never picks
  it up, and `usb_foothold` waits on the player noticing, picking it up and dropping
  it again.
- **Mugs.** A mug put down in the kitchen and carried again from the kitchen goes
  back to the kitchen at the office mug spot's coordinates.

**Fix.** In `carry_object!`, before `remove_item_from_room!`, read the `objects_added`
entry for `item_id` in `from_room`. If it has a `position`, store a sanitised copy in
the carry entry as `fromPos`:

```
player_state['npcCarry'][npc_id] = {
  "itemId":   "kit_deviceB",
  "fromRoom": "open_plan",
  "fromPos":  { "x": 6.4, "y": 5.1 }      # only when the object was a placed copy
}
```

- `fromPos` is copied from the server's own stored record, never from the request.
  Keep only the keys the drop and put-down paths write (`x`, `y`, `px`, `py`, and
  `elevation` if the stored entry has it), each passing `valid_ko_coord?`; drop every
  other key. An entry whose position fails the check stores no `fromPos`.
- `end_stranded_carries!` merges `fromPos` onto the rebuilt object as its `position`
  when present; otherwise the scenario position stays (today's behaviour, correct for
  an object picked up from its scenario spot).
- The entry is still written only by the four carry actions; `sync_state` still drops
  any incoming `npcCarry`. It stays one entry per NPC with at most three fields, so
  stored size stays bounded by the NPC count and nothing is re-sent.
- `put_down_carried!`, `consume_carried!`, `ko_drop_carried!` and the delivery clear
  ignore `fromPos`; they delete the whole entry as now.

### C2. The use's flags reach the server promptly after a consume

At the end of a use, `_completeUse` calls `consumeHeld` (which POSTs
`consume_carried` straight away) and then emits `npc_used:<target>`, whose event
mappings set globals such as `kp_usb_foothold`. Globals travel in the periodic delta
sync, with a `pagehide` keepalive flush. An ordinary reload is covered by that flush.
A tab killed without `pagehide` in the gap would leave the stick consumed on the
server and `kp_usb_foothold` unset: the stick is gone and Sofia has nothing to plug
in, so `usb_foothold` could not complete.

Fix: when `consumeCarried` succeeds, call `window.stateSync?.requestSoon?.()` (the
debounced near-immediate sync the KO path already uses), unless the implementer finds
that event-mapping global writes already request one, in which case record that in a
comment and add nothing. This narrows the gap to the debounce window; it does not
need a server change.

### C3. Documentation

- `NPC_CARRIED_ITEMS_PLAN.md`, "Reload in the middle of a carry": state the rule (a
  reload ends the carry and returns the object to the spot it was picked up from; the
  NPC re-notices it and repeats the carry), the reason resume was not built, and the
  `fromPos` field. Remove the "future work" wording.
- `scenarios/lab_physical_pentest/PLAYTEST.md` and `scenarios/test_needs_sims/README.md`:
  one line each, so a playtester who reloads mid-carry expects the replay and does not
  log it as a finding.

### Interactions (unchanged, checked by the tests)

- **KO.** A KO'd NPC cannot start a carry. A KO drop ends the carry before any reload,
  so no stranded entry is left. A reload after a refused KO drop (the known limit
  where the body is two rooms from home) ends the carry by put-back to `fromRoom`; the
  KO record is unaffected.
- **Delivery.** A take clears the entry at once, so there is nothing to put back. If
  the object is somehow in the inventory and an entry survives, put-back must not add
  a floor copy: `end_stranded_carries!` gains the same
  `carried_item_in_inventory?(item_id)` guard the other three actions already have
  (drop the entry, add nothing).
- **Hostility.** Hostile NPCs follow the KO path; put-back does not depend on the NPC
  at all, so a carrier that turned hostile has its object returned to the floor.
- **Second tab.** Opening the game in a second tab runs the bootstrap and ends the
  first tab's carry. The first tab's later consume or put-down is refused and handled
  by the existing refusal path. This limit is unchanged by this slice; it is noted in
  the plan doc rather than fixed.

---

## 4. Lab_physical_pentest: `usb_foothold` after a reload at any point

`usb_foothold` completes on `npc_used:usb_target_pc` with `data.tag === "tag_deviceB"`,
which needs Sofia to carry `kit_deviceB` to her PC and finish the 6 s use. The reload
points and what keeps the task completable:

| Reload point | Server state at load | After the reload |
|---|---|---|
| BadUSB in the player's inventory | in inventory | unchanged; drop it on the floor as before |
| Dropped on the floor, not yet noticed | `open_plan` `objects_added` at the drop spot | on the floor at the drop spot; Sofia notices it |
| Sofia walking to it | same | same |
| Sofia carrying it to her desk | `npcCarry.lord` with `fromRoom: open_plan`, `fromPos` = drop spot | put back at the drop spot (C1); Sofia re-picks and plugs it in |
| Sofia mid-use (6 s at the PC) | same as carrying | same as carrying; the use restarts in full |
| Use finished, flags not yet synced | consumed; `kp_usb_foothold` may be unsynced | covered by the `pagehide` flush on a reload, and by C2 for a killed tab |
| Use finished and synced | consumed; `kp_usb_foothold` true, task complete | unchanged; the remote-session timer starts on the global |

The `npc_picked_up:kit_deviceB` bark may play a second time on a replayed carry. That
is acceptable; if `onceOnly` already persists across a reload it will not.

---

## 5. Tests

### Rails (`test/controllers/break_escape/npc_carried_items_test.rb`)

1. **Placed copy, reload.** Put a carriable object into a non-scenario room's
   `objects_added` at a known position (the dropped-BadUSB shape, using the existing
   test scenario's mug and an adjacent room), carry it from there, then
   `GET /scenario`: the object is in that room exactly once at that position, the
   origin scenario room does not serve it, and the entry is gone. This test first
   fails on main, confirming the defect.
2. **Scenario spot, reload.** Carry from the object's own scenario spot, reload: it is
   back at the scenario position (the existing reload test keeps passing).
3. **Hostile stored position.** An `objects_added` entry whose position holds strings,
   out-of-range numbers or extra keys (`flags`, `type`, `onPickup`): the stored
   `fromPos` keeps only valid numeric keys, or is absent; the put-back object carries
   none of the extra keys.
4. **Client cannot supply `fromPos`.** A `carry_object` request body with `fromPos`
   (or `position`) is ignored; the stored entry holds only the server-derived value.
   A `sync_state` delta with an `npcCarry` entry carrying `fromPos` writes nothing.
5. **Bounded.** After a carry the entry has at most the keys `itemId`, `fromRoom`,
   `fromPos`; a repeat carry is a no-op; a second bootstrap does not write.
6. **Inventory guard.** An entry whose object is in the inventory is dropped at
   bootstrap with no floor copy added.
7. **Regression.** Put-down, consume, KO drop and the delivery clear still delete an
   entry that has `fromPos`, and add the object once (put-down and KO drop at their
   own position, not `fromPos`).

### JS (`test/js/npc-carry-wiring.test.mjs`)

- A successful `consumeCarried` calls `stateSync.requestSoon` once; a refused one
  does not. If C2 ends up as a comment only, test instead that the event-mapping
  global write requests a sync.

### Live proof (keyless server from the worktree, headless, `setFPS(20)` with fixed steps on)

Driver: a new `tools/playtest/npc-carry-reload-proof.mjs`. A reload is `about:blank`
then back to the game URL. Each beat reads the room fetch endpoint directly before and
after, records every `update_room` status, page errors and console errors, and reads
the needs debug snapshot (`job.phase`, `job.itemId`) to time the reload.

**test_needs_sims** (fresh game per beat):

- T1. Grace picks up `office_mugs` through the real needs AI; reload while
  `job.phase === 'goto_target'`. Expect: one mug in the office at its scenario spot,
  Grace's `itemsHeld` empty, and within 60 s Grace's log shows `picked_up` for
  `office_mugs` again with no driver call. Record the pick-up to `used` time of the
  first carry (the measured carry length).
- T2. Suspend Grace mid-carry so she puts the mug down in the kitchen (`put_down_object`
  200), let her carry it again from the kitchen, reload mid-carry. Expect: one mug in
  the **kitchen** at the put-down position (within 1 px), none in the office.

**lab_physical_pentest** (fresh game per beat; the driver takes `kit_deviceB`, walks
to `open_plan` and drops it through the inventory Drop action):

- L1. Reload after the drop, before Sofia moves. Expect: the stick on the floor at the
  drop position; then `npc_used:usb_target_pc`, `kp_usb_foothold` true, `usb_foothold`
  complete, the remote-session item in the inventory.
- L2. Reload right after `npc_picked_up:kit_deviceB` (walking). Expect: the stick in
  `open_plan` at the drop position (within 1 px), not at tile (2.55, 0.95); Sofia's
  `itemsHeld` empty; then the same completion as L1 with no driver help.
- L3. Reload while `job.phase === 'using'`. Expect as L2.
- L4. Reload within 200 ms after `npc_used:usb_target_pc`. Expect: the stick on no
  floor and in no hand; `kp_usb_foothold` true and `usb_foothold` complete after the
  reload; the remote session arrives.
- L5. Reload after the remote session arrives. Expect: nothing changes.

Pass across all beats: every `carry_object`, `put_down_object` and `consume_carried`
answers 200, no 422 or other 4xx or 5xx in the server log for carry actions, 0 page
errors, exactly one copy of each carried object in `window.rooms` after each reload.
Also run the `npc-carry-live-proof.mjs` consume, drop and KO beats and train-smoke on
m01 and m02 as the regression set.

---

## 6. Resume, if the owner prefers it

For comparison only; not recommended.

- **Served.** Bootstrap stops ending carries whose target is still valid. The room
  fetch serves the held object (as now) plus a `carrying: { itemId, targetId }` field
  on the NPC. No position or phase is stored: the server has neither, and the NPC
  spawns at its placement, so the client always resumes in the `goto_target` phase.
- **Client.** On needs install, for each NPC served carrying: create the held sprite
  from the served object, write `_needsCarried`, and start a carry job at
  `goto_target` with `carrying: true`, a fresh deadline, and the normal arrival,
  consume, refuse and abandon paths.
- **Safety.** `carry_object` gains `targetId`; the server requires a scenario object
  whose `affordance.accepts` contains the item's `needsTag`, in an unlocked room the
  NPC can reach, and stores it. The client still cannot name the object, its fields
  or its landing room beyond the existing bounds.
- **Invalid target or object.** At bootstrap, a target that is missing, locked or no
  longer accepting the tag, or an object that fails the allowlist, falls back to
  put-back. On the client, a target that refuses or cannot be reached makes the NPC
  set the object down where it stands (`put_down_object`, bounded as now).
- **KO, delivery, hostility.** KO drop and delivery work unchanged on the entry. An
  NPC hostile or KO'd at load gets put-back.
- **Fallback.** A served carry that the client fails to rebuild strands the object
  again; resume therefore also needs a server-side age limit (a pick-up timestamp and
  a put-back after N minutes), which grows the entry and adds a time rule.
- **Tests.** The C1 Rails set plus target validation hostile cases (non-accepting
  target, locked target, far target, another game's object), JS tests for the job
  rebuild in every phase outcome, and the same live beats with "Sofia resumes holding
  the stick" in place of "re-picks".
- **Size.** M to L: about 60 to 80 lines of server code, 120 to 200 lines in
  `npc-needs.js`, and roughly double slice C's tests.

---

## 7. Size and files (recommended slice)

**S.** About 25 lines of server code, under 10 lines of client code, 7 Rails tests,
1 JS test, one new live-proof script, three short doc edits.

- `app/models/break_escape/game.rb`: `carry_object!` captures `fromPos`;
  `end_stranded_carries!` applies it and gains the inventory guard; a small
  `sanitised_carry_position` helper.
- `public/break_escape/js/systems/npc-needs.js` (or `room-state-sync.js`, where
  `consumeCarried` resolves): `requestSoon` after a confirmed consume.
- `test/controllers/break_escape/npc_carried_items_test.rb`,
  `test/js/npc-carry-wiring.test.mjs`.
- `tools/playtest/npc-carry-reload-proof.mjs` (new).
- `docs/achitechture/NPC_CARRIED_ITEMS_PLAN.md`,
  `scenarios/lab_physical_pentest/PLAYTEST.md`, `scenarios/test_needs_sims/README.md`.

## 8. Decision for the owner

Put-back (recommended, S) or resume (M to L). Everything else in this plan follows
from that choice and needs no further sign-off.
