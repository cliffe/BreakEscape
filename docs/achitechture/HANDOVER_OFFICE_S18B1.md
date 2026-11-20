# Handover: office life slice 18b-i, the magnet (2026-11-06)

**Status: DONE (2026-11-06).** Engine, validator, schema, node tests and the showcase committed; live proof, one engine fix
(2643c23f3, a pickup during the windup), the regressions (leash game 951, lab game 952 score 100) and the docs done; the results are in
the plan's 12.4 Built line and `scenarios/test_needs_sims/README.md`. The "Left" list below is kept as the record of what was asked. Plan:
`OFFICE_LIFE_PLAN.md` 12.4 "Slices 18b-i and 18b-ii" (with the OQ31 redesign: drop anywhere), 12.8 row 5, 12.9 OQ31, 32, 35,
36, 13f.

## Done (commits on main; `git log --oneline --grep "lice 18b-i"` after a rebase)

- 91227f828 engine, validator, schema, tests:
  - `npc-needs.js`: `magnetOf(aff)` and `MAGNET_TEMPT` (exported). Registry `_magnets` (id -> cfg, kept affordance, satisfies,
    servings, `<id>_servings` key), filled by `onItemDropped(itemId)` (the live hook on `item_dropped:*`), by `scanMagnets()` on
    room loads (`_onRoomsLoaded`, so a reload finds a dropped magnet) and by every object scan (`_objects`). No scan of its own per
    tick (the tick-cost test's "no scans for a calm NPC" still holds).
  - `onItemDropped`: `magnet_placed:<id>` `{ magnetId, roomId, x, y, how: 'drop', reachable, servings }` (reachable: NPCs with a
    need it satisfies whose leash and privacy allow the room, `_roomForbidden`), and `magnet_unreachable:<id>` with a log line when
    nobody. Sight (`_sight`): an NPC in a shown magnet's room knows it (`magnet_seen`, `npc_saw_magnet:<npcId>`); shown magnets are
    cached per tick (`_shownMagnets`, one `getObject` per magnet).
  - Temptation in `_select`: a need with `urgentAt < level <= min(95, urgentAt + tempt)` of a known, live magnet whose
    `perPerson` the NPC has not used up, not parked, not starved, is tempted: known magnets only, scored against the raised
    threshold, a quiet `_useCandidate` (no leash or private notes, no `giveUp`, so never parks) and `_selectSearched` for the
    back-off when it finds nothing. An urgent need tries known magnets first (quietly), then its usual sources. A magnet nobody told
    the NPC about, or one gone or empty, is no source at all (`_magnetBarred`). The early-return guard adds `_tempting(s)`.
    `job.tempted`, `job.magnet`, `job.aff` (the affordance kept for a magnet that disappears mid-use).
  - Servings: taken as `using` starts (`_takeServing`: `serving_taken`, `magnet_serving:<id>` `{ npcId, magnetId, left }`,
    `world.setGlobal('<id>_servings', n)`); read back from `world.getGlobal` when the magnet is registered. In `_advanceJob`,
    before `_recheck`: a walker or queuer turns back with `gone` when the magnet stops showing or has 0 left; one `using` it when
    it stops showing finishes at once (`magnet_left`). `_tickMagnets`: a magnet that stops showing (picked up) clears everyone's
    knowledge (`magnet_gone`, servings kept); one showing at 0 with nobody using it is finished (`_finishMagnet`:
    `magnet_finished`, `magnet_finished:<id>`, adapter `removeMagnet`), which also covers the reload-at-0 case.
  - A tempted job's avoid turn-back sets `s.temptBack[need]` (cleared when the need is next met), read by `_recheck` as
    `mindChanged` is, since `_decay` clears `mindChanged` above `urgentAt`.
  - Hidden objects: a `revealOnGlobal` object whose global does not hold is no use target (`_hidden`); `describe` passes
    `revealOnGlobal` for objects with an affordance.
  - Adapter: `getGlobal`, `removeMagnet` (destroys the sprite, deletes it from `rooms[..].objects`,
    `RoomStateSync.removeItemFromRoom`), `dropStale` (a picked-up item's inactive sprite left in its old room no longer shadows a
    re-drop elsewhere in `findSprite`). `installNpcNeeds` listens on `item_dropped:*`.
  - Validator `check_magnets` (`validate_npc_needs.rb`): id required, `needsTag` forbidden (errors); `tempt` 0-95, `servings`
    and `perPerson` 1-1000 (errors); `<id>_servings` declared and equal to `servings` (error); `satisfies` a need no NPC has
    (warning); a magnet that is not a droppable start-inventory item (warning: only drops are built). The old "droppable without a
    needsTag" warning skips magnets. Schema `affordance.magnet`.
  - Tests: `test/js/npc-magnet.test.mjs` 15 (normalising; drop, `magnet_placed` and sight with the tick cache on and off;
    unreachable drop with a told, leashed NPC over 2 minutes: no `leashed`, `private_skipped`, `parked`, level only decays; capacity
    3 with 2 servings and three tempted walkers: two eat, the third turns back `gone` with "Missed it.", no park, finished and
    removed after the eaters; arrival at 0 never eats; `perPerson`; urgent prefers a known magnet, ignores an unknown one; a parked
    need is not tempted; a tempted avoid turn-back does not park and goes anyway the second time; pickup: walker `gone`, eater
    finishes at once, knowledge cleared, re-drop learnt again by sight, servings kept; reload from the global and the finish at 0;
    hidden object; determinism; validator fixtures). No new static imports. `GOLDEN_SIMS_DAY` unchanged.
- 60f41190f showcase (`test_needs_sims`): `cake` (`cake1`) in `startItemsInInventory`, droppable, `affordance` hunger and social,
  restores 40, 12 s, capacity 3, chatter `cake`, `eat_snack`, `magnet { tempt 30, servings 2, perPerson 1 }`; `cake_servings: 2`;
  a room-free `cake` chatter pool; Amara's hunger `{ 1, 40, 65 }`; tasks `see_cake_eaten` (`magnet_finished:cake`) and
  `see_missed_it` (`npc_turned_back:*` with `data.reason === 'gone'`), mappings on Amara's list; `game.js` preloads `cake1`.
  Validator 28 -> 30 warnings, both "Amara's hunger target fridge/microwave is in the kitchen" (as Tom's and Sanjay's).

## Live so far (:3001, headless, scratchpad `s18b1/`)

- **Game 929** (session `sess929.jsonl`, helper `lib.py`, first beat `p1.py`). The cake was meant to go down in the kitchen but
  landed in the **office**: `enter kitchen` succeeded, then `moveTo(150, 230)` walked the player back into the office (the kitchen
  is at x -320..0; the office at 0). So the leash staging in `p1.py` did nothing (restored afterwards). What it showed, unstaged:
  `magnet_placed` reachable `[amara, sanjay, tom]`, servings 2; all five office NPCs `magnet_seen` on the next tick; Tom (after his
  coffee) and Amara (after her printout) each started a **tempted** cake job; `serving_taken` 1 (Tom), 0 (Amara); pair chatter
  from the `cake` pool (`npc_chatted:cake` x3); both `used`; `magnet_finished` at tick 412 with the cake removed; `cake_servings`
  0. Eaters stood at (165, 207) and (180, 197) around the cake at (148, 236), the second beside the first (besideCell). Sanjay
  (hunger 50, in the band) was at the kitchen coffee and the servings ran out before he looked again, so no "Missed it." in this
  run. Frames: `a-drop-office-929.png` (the cake at the player's feet, blue in-range tint, its description in the toast; Tom and
  Marek at the coffee), `b-after-eating-929.png` (taken just after both finished, not an eating frame), `c-finished-929.png`.

## Left (for a fresh agent)

1. **Live proof, new game** (one cake per game; `new-game.rb test_needs_sims`, `session-start.sh --url .. --headless --log ..`,
   `bootstrap`; then `s18b1/lib.py`'s `rec()`, `st()`, `drop()`, `mlog()`, `events()`). Stop session 929 first
   (`tools/playtest/session-stop.sh`) to stay at two browsers.
   - **Kitchen drop**: `enter('kitchen')`, then `move(-160, 230)` (kitchen coordinates), `drop()`; check `currentPlayerRoom` and
     `magnet_placed.roomId === 'kitchen'`. The kitchen eats only through whoever walks in (no word of mouth until 18b-ii): switch
     the office coffee off (`applyActions([{ type: 'set_global', key: 'office_coffee_off', value: true }])`, as in S18A) so Amara
     and Tom take the kitchen coffee, see the cake and eat. Frames of the first eater in the kitchen.
   - **"Missed it."**: three in the band at once with 2 servings. An office drop while Tom, Sanjay and Amara are idle at their
     desks gives it unstaged when nobody is mid-job; else `__test.needs.set('sanjay', 'hunger', 60)` just before the drop.
     Screenshot the `gone` grumble bubble and the 2-3 eaters' stance (check whether the third stacks; plan 12.4 risk: lower the
     showcase `capacity` if they do). Also one drop in a corridor/doorway to see whether eaters block the way.
   - **Pickup mid-walk**: with walkers on the way, a real pointer click on the cake (`__test.clickAt` on its centre, as
     `s17/click.py`); confirm by `magnet_gone` in the log and `npc_turned_back` reason `gone`, not by the bridge's `interact()`.
     Then re-drop: walkers learn it again only by sight; `magnet_placed.servings` keeps the count.
   - **Reload keeping servings**: after one serving, `cmd reload` (or a page reload) mid-meal; check `cake_servings` 1, the cake at
     the same x, y (server `objects_added`), `npcNeedsSystem._servingsLeft('cake') === 1` after the room loads.
   - **Unreachable drop**: the sims have no leash; stage it by setting `s.leash = { allow: null, deny: new Set(['kitchen']) }` on
     amara, tom and sanjay (the only hunger/social NPCs) before a kitchen drop; `magnet_unreachable` in the log and nobody comes.
   - Drains: `drain` from the session; expect only the keyless TTS 503s.
2. **Regressions**: `scratchpad/leash.py <game>` on a `test_needs_leash` game; the lab by replaying `s18a/lab_args920.json`
   through `scratchpad/lab.py <game>`, then `verify-run.rb` (score 100; keylogger creds about 64 s, USB foothold about 10 s, as
   game 926). The lab's USB and QR carry a `needsTag` and no affordance, so the magnet code never sees them.
3. **Docs**: plan 12.4 Built line for 18b-i (with the choices below), sims README live-proof table, the one 18b-i line in
   `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md` "Office-life slices", `OFFICE_LIFE_HANDOVER_SESSION.md` row, this
   file marked done.
4. **Not built**: the optional declared spot (12.4 option B: `triggerOnInteract` deploy, refill at 0 when the reveal global turns
   true, `hideRevealedObject` finish, the spot validator checks). Only its "hidden object is no use target" rule is in. The plan
   allows cutting it; say so in the Built line.

## Choices made without asking (for the Built line)

1. The declared spot (option B) is cut; drops only. A magnet declared as a room object gets a validator warning.
2. Magnets are found on a drop, a room load and any object scan; there is no per-tick scan of their own (the tick-cost test asserts
   no scans for an NPC with nothing urgent).
3. A magnet the NPC does not know of is no source at all, even for an urgent need (otherwise an unknowing NPC would walk to the
   nearest food, cake included). The magnet try for an urgent need is quiet too; leash notes come from the usual-source try.
4. New events and log lines beyond the plan: `npc_saw_magnet:<npcId>`, `magnet_serving:<id>`, log `magnet_seen`, `serving_taken`,
   `magnet_gone`, `magnet_left`; `magnet_placed` also carries `servings`.
5. A tempted job's once-only avoid turn-back uses its own `temptBack` flag (the plan's "through its own flag").
6. The showcase's cake chatter is room-free; no announce pool yet (18b-ii). The description points at the kitchen.
