# Office Life Sims build plan: server, sync and cheat-resistance review (R1)

Remit: server, sync size, cheat resistance. Checked against the engine on branch `build/ol-sims`
(worktree `p-ol-sims`). Scope excludes art, dialogue, room layout and pure gameplay balance.

**B 0 / M 1 / m 4**

Nothing here blocks the plan. The server mechanisms every slice leans on already exist and behave
as the plan assumes: the delta sync (`state-sync.js`), the KO/player drop guards
(`game.rb add_item_to_room!`), the work/frustration compiler (`access_work.rb`, `game.rb:5640`),
and the game clock's reload resume (`game-clock.js`). The findings below are a sync-budget gap in
the contract the showcase is meant to prove, and four smaller corrections.

## Verified, no change needed

- **New scenario fields reach the client.** NPCs are served through `GET /room`, and
  `filtered_room_data` (`game.rb:1603`) strips only `requires`, locked `contents`, author notes,
  networks and named secret keys (`WITHHELD_NPC_KEYS`, `game.rb:5620`). It is not an allowlist, so
  `schedule`, the `needs: { summon }` / `release` eventMapping form, `workNeeds`, `restocks` and
  `affordance.stock` all pass through. `gameClock` (top level) and `resources` are not in the
  bootstrap delete list, so they ship too.
- **The work-outage data shape is right.** The plan's top-level `roles: { developer: { workNeeds,
  frustration } }` and `resources: { dev_network: { kind, object, offWhen } }` match
  `test_access_work/scenario.json.erb` (lines 2790, 2837) exactly. The server compiles each NPC's
  `work` plan (resource ids, `offWhen` values, `object`) into the NPC record and withholds the raw
  `workNeeds`/`frustration`/`role` (`game.rb:5620-5650`, `access_work.rb:93`). The bootstrap's
  `filtered.delete('roles')` (`game.rb:1351`) is therefore correct and expected, not a regression.
- **Cheat resistance holds for every takeable item.** A player drop (rota, cup, leftover lunch)
  is rebuilt from the server's held copy and rejected unless the inventory item is `droppable:true`
  (`game.rb:541-554`). A KO drop (Ollie's notebook, Grace's mugs) requires the NPC actually hold the
  item, records the KO atomically, and dedups by delivered id (`game.rb:486-523`). SIMS-2's claims
  ("accepts the drop only once the defeat is recorded", "not duplicated on reload") are already the
  server's behaviour.
- **Every new global is optional-task only.** `print_room_switch_off`, the slot globals,
  `leftover_lunch_servings`, `heard_*`, `grace_ko` and `ollie_frustration` gate no secret, key or
  required task; forging one ticks only an optional "watch" task, which the cheat-resistance policy
  permits. No new server-trusted global is introduced.
- **No end-user/organisation input.** All new fields are scenario-author content, validated by the
  scenario validator at authoring time, not runtime learner/organiser text, so
  `org-input-sanitisation` does not apply to this plan.
- **Sync pieces are bounded deltas.** Workstation booleans, slot/switch/servings/`heard_`/`*_ko`
  globals ride `globalVariables`, `npcVisibility` rides its own keyed section, `npcHostility` and
  `triggeredEvents` likewise; all are in `KEYED_SECTIONS` (`state-sync.js:13`) and sent per changed
  key. The server `npcFrustration` record is a fixed-shape per-NPC entry
  (`npc_frustration.rb`, `done`/`lockedOut` arrays bounded by workarounds/stations, `MAX_REPORTS 20`
  per batch), so it does not grow with play time. Workstation count in the finished showcase is
  about 6-7 owned stations (current sims has 2, plus `reception_pc`, `zara_laptop`, `ollie_laptop`,
  `howard_pc`), under the section-7 cap of 8.

## M1 - The missions-plan sync table (section 7) has no row for scheduled-NPC `npcVisibility`

SIMS-5 writes `npcVisibility` for up to 10 scheduled NPCs as they arrive and leave (plan line 325),
sent as a keyed delta (`state-sync.js:13,356`). The showcase exists to prove the campaign's sync
contract, but `OFFICE_LIFE_MISSIONS_PLAN.md` section 7 (`plan/office-life-missions`) has **no
`npcVisibility` row and no cap**; its only visibility mention is `initiallyHidden` reveals as a
design row (section 5, line 154), which is a different write. A campaign mission that adopts
schedules (m05's thinning evening needs them) would have a sync budget that silently omits this
state. The mechanism itself is sound (one boolean per NPC, delta, set once per transition, no growth
with time), so the fix is to the contract, not the engine.

Fix: add a row to `OFFICE_LIFE_MISSIONS_PLAN.md` section 7, e.g. "Scheduled NPC visibility
(`npcVisibility.<id>`) | npcVisibility (engine-owned) | one key each, delta on arrive/leave | one
boolean per scheduled NPC; at most N", and fold N into the worst-case count. The SIMS plan's own
section 5.5 already states the 10-key figure; the campaign plan it proves must match.

## m1 - `consumables.js` already emits an event; SIMS-3's engine change is unnecessary and the claim is wrong

SIMS-3 (plan line 297) states "`consumables.js` emits no event today, so this slice adds one emit
... (about 3 lines, the slice's only engine change)". That is false: `useConsumable` already emits
`item_consumed` with `{ itemId, itemType, itemName, healed }` (`consumables.js:216`). The
`drink_a_coffee` objective can key on the existing event with `condition: data.itemId ===
'kitchen_cup'`, leaving SIMS-3 at zero engine lines. Fix: drop the new `player_consumed:<id>` emit
and use `item_consumed`; correct the "emits no event today" sentence and the SIMS-3 engine-size
figure (section 4 table) to 0.

## m2 - SIMS-5 reload must reconcile to saved state without re-running the leave side effects

The plan says a reload "follows the game clock: before arrival hidden, between at the post, after
leaving hidden with its workstation globals as they were saved" (line 318), but does not state that
the yet-to-be-written `npc-schedule.js` 1 s clock check must *reconcile to* that final state rather
than *re-run* `leaveForDay`. If a post-leave reload re-runs the leave, three things diverge from the
save: (a) `decideLocked` is re-rolled (`workstation-state.js:147,407`) and can flip a screen the
saved `<pc>_screen_locked` recorded open to locked or vice versa; (b) the `leaving` bark and
`npc_left_for_day:<id>` re-fire; (c) a left-behind roll re-runs. Only (c) is server-protected (the
drop is deduped in `add_item_to_room!`, `game.rb:510,561`), so no item duplicates, but (a) and (b)
are not. Fix: SIMS-5 must specify a persisted per-NPC "left for day" / "arrived for day" latch
(derivable from the saved clock plus `npcVisibility`) so the reconcile applies the saved final state
and runs no side effect a second time; add a reload-after-leave assertion to
`npc-schedule.test.mjs` that the saved lock globals and `npcVisibility` are unchanged.

## m3 - The bootstrap `hasPresentNpc` flag ignores schedule state

`filtered_scenario_for_bootstrap` sets `hasPresentNpc` from NPCs that are not phones and not
`behavior.initiallyHidden` (`game.rb:1323`), for the door-spill motion-lighting fallback. A
scheduled NPC that has not yet arrived (Joe before 17:15) or has already left is hidden by the
schedule, not by `behavior.initiallyHidden`, so the filter counts it as present and a motion-sensor
room's closed-door light leak would treat the room as occupied when it is empty. Low impact in the
showcase (reception is not declared motion-sensor), but SIMS-5 should either exclude schedule-gated
NPCs from `hasPresentNpc` or document that a scheduled NPC must also carry a flag the filter checks.
Fix: extend the `hasPresentNpc` predicate (`game.rb:1323`) to skip NPCs with a `schedule` block, or
note the limitation in SIMS-5 and the OLMP E4 room-loading section.

## m4 - The home-time anchor (16:45) is before most leave times, so the lever cannot drive the leave proof

The `gameClock` anchor is `time: "16:45"` (plan line 199), but the leave schedule puts Hannah,
Amara, Tom, Grace and Zara at 17:00-17:15 and Sanjay, Rosa at 17:45-18:00 (plan lines 213-215).
Winding the office clock "on to home time" jumps game time to 16:45, which is past only Kirsty
(16:00) and Howard (16:30); it does not empty the office, contradicting the section-6 tour row ("the
office empties one by one"). In sync terms this matters because the lever is the live proof that the
`npcVisibility` leave deltas (M1) actually fire; at 16:45 most of them never trigger. Fix: set the
anchor to a time at or after the last leave (for example 18:05), or move the leave block earlier, so
one lever pull exercises every scheduled leave and its visibility delta.
