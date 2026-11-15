# Office Life Sims build plan: review R2 (server, sync size, cheat resistance)

B 0 / M 1 / m 2

Scope: `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md`, checked against the server
(`app/models/break_escape/game.rb`, `app/controllers/break_escape/games_controller.rb`),
the sync path (`public/break_escape/js/state-sync.js`, `systems/room-state-sync.js`),
`systems/npc-needs.js`, `systems/workstation-state.js`, `systems/npc-hostile.js`,
`systems/consumables.js`, and OLMP section 7. Rules applied: player-state-delta-sync,
cheat-resistance-policy, load-bearing-oddities, hacktivity-fixture-scenarios.

## What holds up

- **Sync is genuinely delta.** `globalVariables`, `npcVisibility`, `npcHostility`,
  `triggeredEvents` are keyed sections sent key-by-key against `this.confirmed`
  (state-sync.js:13, buildChanges 443-462); a reload seeds `confirmed` from the saved
  blocks (seedFromSaved 96), so the first sync sends only what truly changed. Needs
  levels, positions, queues, move ids, chats and magnet knowledge never enter
  `buildSharedSections` or `buildPlayerSections` (state-sync.js:345, 383), so nothing in
  these slices grows with play time. Every per-slice count the plan gives is a fixed
  authored ceiling.
- **`room_states.objects_added` does not ride the growing payload.** Drops go through the
  separate `add_object` / `remove_object` actions (games_controller.rb:1013, 1027), not
  `sync_state`, so the dropped pizza and KO items are one-shot server writes, deduplicated
  by id in `add_item_to_room!` (game.rb:561). SIMS-5's exhausted box is removed and kept
  gone via `_finishMagnet` -> `world.removeMagnet` -> `remove_object` (npc-needs.js:939),
  the same path the cake uses, so the reload claim holds.
- **Cheat gates match the plan's 6.2.** Player drop is rebuilt from the held copy and
  refused unless `droppable: true` (game.rb:547). A KO drop records the KO and requires the
  item match an NPC-held item and the NPC be allowed to drop it (game.rb:499-523). New NPC
  and object fields reach the client because `withhold_npc_secrets!` is a deny list, not an
  allow list (WITHHELD_NPC_KEYS game.rb:5620, deleted at 5656); none of the sims fields
  (`needs`, `chatter`, `exchanges`, `affordance`, `officeType`, `printHabit`, `screenHabit`,
  `lockChance`, `needsRooms`, `needsAvoidRooms`, `onUse`) is withheld. `globalVarOnKO` and
  `taskOnKO` exist and set only an optional global and task (npc-hostile.js:363, 381), which
  the policy allows as best-effort. `item_consumed` carries `itemId: data.id`
  (consumables.js:218), so SIMS-3's `drink_a_coffee` condition `data.itemId === 'kitchen_cup'`
  is sound.
- **OLMP section 7 agrees.** Workstation globals are 3 per owned workstation
  (`_screen_locked`, `_owner_away`, `_accessed`; workstation-state.js:294, 536, 626),
  matching OLMP's "3 booleans per owned workstation", and the showcase stays at six owned
  workstations under the cap of 8. `heard_`, servings (cap 2) and the dropped-magnet rows
  all line up. npcFrustration is untouched because the showcase omits work needs (row 36),
  so there is no `npcFrustration` record to grow. SIMS-6's request to add an
  `npcVisibility` row to OLMP section 7 is correct: no such row exists today.

## M1 (major): Ava's carried mug will be refused by the KO-drop gate; SIMS-1 overstates persistence

`app/models/break_escape/game.rb:1151` (`find_npc_held_item`) returns nil unless the dropped
item matches the NPC's authored `itemsHeld`; a non-match is rejected at
`add_item_to_room!` (game.rb:489). SIMS-1 gives Ava no `itemsHeld`; her mug is a *carry job*
(`interests: dirty_mugs` carrying the world object `office_mugs`), picked up at run time, so
it is not in any authored `itemsHeld`. When she is knocked out mid-carry, a drop sent as
`npc_defeated` for `office_mugs` fails that gate and is not persisted, so after a reload the
mug is gone, not "dropped once where she fell" (plan SIMS-1 case (b), and the Sync line "at
most two objects_added entries (the mugs, the notebook)"). Ben's notebook is fine: it is
authored `itemsHeld` (`ben_notebook`), so his drop matches and persists; that is the clean
comparison, and it is exactly the server's cheat gate doing its job.

This is the heart of what E1 is meant to discover, so the plan does not have to pre-solve
it, but it should stop presenting the mug's persistence as the expected result. Fix: in
SIMS-1, name `game.rb:1151` / `game.rb:489` as the gate the mug must pass, state that a
carry-job item dropped on KO is the likely failure case, and either (a) give Ava an authored
`itemsHeld` item to carry so the KO drop has a home record (the probe then tests both an
authored drop and a carry-job drop), or (b) record "carry-job items do not survive a KO
drop" as a candidate E1 finding. The live proof already dumps server `objects_added`, so it
will catch this; the Sync section should read "at most two objects_added entries (the
notebook always; the mug only if a carry-job KO drop is accepted)".

## m1 (minor): SIMS-5 sync table omits the second room's removal on exhaustion

SIMS-5's Sync line lists "one objects_added entry when dropped ... and the lounge's removal
of it". On the last serving the box is removed from the room it was dropped in
(facilities_office), a second `objects_removed` record written by `remove_object`
(npc-needs.js:939 -> room-state-sync.js:124). It is still one authored item and does not
grow, but the table should name this removal so the accounting is complete. No code change.

## m2 (minor): OLMP section 9's slice numbers are stale against this plan

The remit's cross-check is OLMP section 7, which is consistent. OLMP section 9, however,
still numbers the E6 arrival fix as "SIMS-1" and the E1 probe as "SIMS-2" (swapped from this
plan, where E1 is SIMS-1 in a new `test_needs_attack` and the arrival fix is SIMS-2), and
calls vending "SIMS-6", schedules "SIMS-5", summon "SIMS-4". This plan notes OLMP "was
written when m06 was the pilot", so the drift is OLMP's, not this plan's, but an integrator
reading OLMP section 9 could act on the wrong slice. Fix: when OLMP is next touched, renumber
its section 9 and the E6 reference to match this plan, or add a one-line note in this plan's
section 1 pointing out that OLMP section 9's slice numbers predate the m02 rollout.

## Not findings (checked and clear)

- SIMS-6 (backlog) `hasPresentNpc`: the plan correctly flags that
  `filtered_scenario_for_bootstrap` (game.rb:1323) only skips phone and
  `behavior.initiallyHidden` NPCs, so a scheduled-but-not-arrived NPC would read as present;
  the plan's own engine list adds the schedule skip there. Accurate.
- The flush size cap (60 KB, state-sync.js:5) is nowhere near reached at these counts.
- The showcase sits above OLMP's per-mission reveal-global and onceOnly caps; the plan
  justifies this as a test floor (not a shipped mission), which is sound, and each key is
  still one boolean set once.
