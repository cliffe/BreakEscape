# Office life sims build plan: review round 3 (server, sync, cheat resistance)

B 0 / M 1 / m 1

Remit: server endpoints, sync size and delta compliance, cheat resistance, across all slices
of `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md`. Checked against the live branch
(`build/ol-sims` at 168875583). Line numbers below are from that checkout.

## What verifies

Most of the plan's server and sync claims hold up against the code:

- **Delta sync.** `globalVariables`, `npcVisibility`, `npcHostility` and `triggeredEvents` are
  all keyed sections that send only changed keys (`state-sync.js:13`), so every new global, every
  `onceOnly` `triggeredEvents` key, SIMS-1's hostility entries and SIMS-8's visibility booleans go
  as deltas. `SERVER_OWNED_GLOBALS` holds only `se_captures` (`state-sync.js:63`), so
  `sian_frustration` and `leftover_pizza_servings` are not skipped and sync normally. Nothing in
  any slice grows with play time.
- **Frustration (SIMS-7).** The engine writes `${npcId}_frustration` as a global only on a change
  (`npc-needs.js:2537`), so the "delta on the 30-second sync" claim is accurate, and the server
  `npcFrustration` record is bounded (`MAX_REPORTS 20`, `MAX_CAUSES 8`,
  `npc_frustration.rb:17-22`). This matches OLMP 7's `<npc>_frustration` row exactly (one integer
  global plus a server record of about 450 bytes, reports batched at most 20).
- **KO and player drops (SIMS-1, SIMS-6).** The KO-drop gate rebuilds the item from the server's
  own `itemsHeld` copy and refuses anything not held (`game.rb:486-523`, `find_npc_held_item`
  `game.rb:1151`). Ava's carried `office_mugs` are not in her `itemsHeld`, so the server refuses
  them on a KO, exactly as the plan predicts (5.1 case b). A player drop is rebuilt from the held
  inventory copy and refused unless `droppable: true` (`game.rb:541-550`); the pizza is droppable.
- **Pizza room-state (SIMS-6).** `leftover_pizza_servings` is mirrored in the engine-owned
  `<id>_servings` global and survives a reload (`npc-needs.js:739-744, 903`). `removeMagnet` posts
  a server `removeItemFromRoom` (`npc-needs.js:5299`), so the last-serving removal is recorded,
  and the 0-servings-on-load path finishes a restored box cleanly (`npc-needs.js:912-925`). The
  three room-state records (two removals, one add) are correct.
- **No secrets.** Nothing new guards a secret, key, password or forged item; every new global
  completes optional tasks only. Objective event names all emit with matching payloads
  (`npc_use_failed`, `npc_checked:<objectId>`, `desk_phone_unanswered` at `npc-needs.js:4141`,
  `object_revealed` with `{producerId, npcId, objectId}` at `npc-needs.js:5207`, and the rest).
- **SIMS-8 (backlog).** The `hasPresentNpc` change for scheduled NPCs is correctly aimed
  (`game.rb:1323`): the current filter only excludes phone and `initiallyHidden` NPCs, so a
  not-yet-arrived scheduled NPC would wrongly claim room presence for the door-spill fallback.

## Findings

### M1. Section 6.2 misstates the NPC filter: Sian's `workNeeds` and `frustration` are withheld, not shipped

`docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md:530` (section 6.2) says new NPC fields reach the
client "because `withhold_npc_secrets!` removes only `WITHHELD_NPC_KEYS` (game.rb:5620, 5656)" and
`:531` adds "none of the fields used here is withheld".

That is wrong for SIMS-7. `withhold_npc_secrets!` removes two lists: `WITHHELD_NPC_KEYS` (creds,
awareness, habits, role, workarounds) at `game.rb:5656` and `WITHHELD_WORK_NPC_KEYS` at
`game.rb:5657`. The second list is `%w[workNeeds frustration feed usbHabit]` (`game.rb:5624`) and
it strips exactly the two fields the plan gives Sian in 3.4 (`workNeeds: ["+manager_printer"]` and
`frustration: { perFail: 34 }`, `:255`). Those fields never reach the browser as authored.

The slice still functions, because `compile_npc_plan!` runs just before the strip
(`game.rb:5599-5600`, inside the recursive NPC filter) and attaches a resolved `work` plan built by
`AccessWork.plan`. The client needs system reads only that compiled plan: `_plan` reads
`this._rec(s).work` (`npc-needs.js:2100-2103`), and `_countFailure` takes its drain from
`plan.breakDrain` (`npc-needs.js:2234`), never from a raw `perFail` or `frustration` field. The
authored `perFail` is applied server-side in `NpcFrustration`, not client-side.

So SIMS-7 depends on `compile_npc_plan!` returning a non-nil plan, which it does only when
`work_plan?` holds (`access_work.rb:1147-1148`): a valid top-level `resources` block with
`manager_printer` present and `+manager_printer` resolving to a non-empty work list. The plan does
provide the `resources` entry (3.3, `:434`) and does run the work validator (5.7), so the
dependency is met, but the stated reason the fields "reach the client" is false.

Fix: correct 6.2 to say the work fields are withheld by `WITHHELD_WORK_NPC_KEYS`
(`game.rb:5624, 5657`) and reach the client only as the server-compiled `work` plan
(`compile_npc_plan!`, `game.rb:5599, 5632`); add one line to SIMS-7 (5.7) noting the slice depends
on the compiled plan and on a valid top-level `resources` block, not on the raw fields shipping,
and that the frustration level is server-owned (reported via `POST /games/:id/npc_frustration`,
served back through `npcFrustration` in the bootstrap).

### m1. "reach the client through the bootstrap" is imprecise: NPC fields ship on the lazy room load

The remit phrasing and the plan (6.2 at `:530`, and the sync preamble in 6.5) speak of new NPC and
object fields reaching the client "through the bootstrap". NPC and object contents are stripped
from the bootstrap payload (`filtered_scenario_for_bootstrap` removes all room contents,
`game.rb:1289`); the bootstrap keeps only navigation metadata plus `characterSprites`. NPC records,
including the compiled `work` plan and every unwithheld field, actually arrive on the lazy
`/room/:room_id` load through `filtered_room_data` and `filter_requires_and_contents_recursive`
(`game.rb:5598-5602`). The plan does cite `filtered_room_data` at `:530`, so it is aware of the
path, but the "through the bootstrap" wording in the same sentence is loose.

Fix: say NPC and object fields reach the client on the lazy room load (`filtered_room_data`), not
the bootstrap, which carries only room metadata and sprite keys.
