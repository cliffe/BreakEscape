# Seat box plan: adversarial review, round 2

Reviewed: `docs/achitechture/SEAT_BOX_PLAN.md` at 3306e1369 (R1 revision 12a3732f5 plus the
user's decisions: Q0 the 18 × 8 body, Q10 option E, the seated-scale dependency as slice 6a).
Checked against `SEAT_BOX_PLAN_REVIEW_R1.md`, `SEAT_BOX_EXPERIMENTS.md` and the code at HEAD:
`seating.js` (with the default-off `pickStandSpot` prototype from 619d58928), `rooms.js` table
bodies and table-item matching, `object-physics.js`, `npc-pathfinding.js` (the world grid),
`scripts/room_gen/room_edit.py` and `tools/playtest/room-snapshot.mjs`. Read-only: no code, map
or DB change, no live run. 2026-11-06.

## R1 findings: are they fixed?

| R1 | Status | Note |
|---|---|---|
| B1 landing from behind | Closed | `pickStandSpot` (seating.js:576–597) never returns a cell picked by direction alone; slice 1 deletes the unchecked fallback (seating.js:648) and replaces `clearOfTables`, which sees only static bodies in `room.objects` (652–659), with `walkBoxClear` over every immovable source. Named unit and live cases are in slice 1. The flood step has a new hole for seated NPCs (M1 below) |
| B2 `db:seed` | Closed | Slice 0 swaps one game's stored scenario; AGENTS.md:218 now agrees, and the plan's conflict note is gone |
| M1 18 × 8 | Closed | The user chose the 18 × 8 body (Q0). Two wording leftovers (m1) |
| M2 narrow block | Closed | Every block ≥ 18 wide. One audit clause now targets a case that can't occur (m1) |
| M3 opt-in on the map | Closed | Phaser 3.60 is the CDN build (`phaser@3.60.0`); its Tiled parser copies the map JSON's top-level `properties` onto `tilemap.properties`, and `createRoom` holds the tilemap at rooms.js:1797, ahead of both body sites (2136–2148, 2637–2665), which run in `delayedCall(0)`. No map has top-level `properties` today (checked all room JSONs), so nothing changes until a map opts in. Format details in m3 |
| M4 Q2 | Closed | Gone with Q0 |
| M5 one order | Closed | 1.3 matches the code: steps `[0, 2, −2, 3, −3, 4, 1, −1]` (seating.js:580), flood 4 then approach, voluntary null, forced flood 8 then approach. See M1, m4, m5, m6 |
| M6 fetch path, NPC stand | Closed | Hand-off items 3 and 5; NPC stand test in slice 1 |
| M7 section 7 stale | Closed | Precondition logged (930dbc221); Q10 settled as E with the step 9 owner's agreement; queue cells and both items are walk-audit key points. I checked that option E can't turn into a grouped item by accident: the only notes-like map object, #65 `notes_ledger1`, has base type `notes_ledger` (rooms.js:189), so `pierce_printout` (type `notes`) won't take its placeholder |
| m1–m6 | Closed | `smalldesk1` 27; `room_edit` range and insert order (room_edit.py:283–295, 198–209 confirm today's append and assert); commit before tests; hand-off fallback; scoped audit; validator keyed on the map |

## Findings, round 2

| id | B/M/m | section | finding | evidence | fix |
|---|---|---|---|---|---|
| M1 | M | 1.3 step 2 and 5, slice 1, hand-off item 5 | **The flood fill can't leave the chair's cell when the chair or its sitter is baked into the world grid.** While an NPC sits, `seatNPC` makes both the NPC's body and the chair immovable (seating.js:950–952). `rebuildWorldGrid` blocks every enabled immovable body, padded one cell each side (npc-pathfinding.js:251–277), and runs after every room load (113) and every door opening (doors.js:828), so any rebuild while NPCs sit bakes their chairs in. Nothing rebuilds on unseat. `floodCells` only steps through walkable cells (seating.js:615), so from a cell ringed by its own chair's blocked cells it returns nothing. For an NPC whose compass candidates all fail (the cramped case slice 1 is meant to cover), step 2 finds nothing, there is no approach point, the forced flood is also empty, `pickStandSpot` returns null, and `unseatNPC` moves the NPC nowhere (`if (spot)`, seating.js:981), so it stands up inside its chair. The player hits the same problem on a chair an NPC has left since the last rebuild. Separately, `walkBoxClear` "with the sources `rebuildWorldGrid` uses" counts NPCs with `behavior.immovable` (npc-sprites.js:138–139), and the sitter itself for those, unless `ignore` names it | seating.js:600–623, 950–952, 975–981; npc-pathfinding.js:113, 251–277; doors.js:828 | Run the flood over a local copy of the grid where cells blocked only by the chair and its sitter count as walkable, or seed it from the ring of cells just outside the chair's padded block. Make `ignore` a list (`[chair, sitter]`). Say what an NPC does when the order returns null: today's `frontSpot`, or stay seated and retry next tick, but not "stand in place". Add a unit case whose fake grid has the chair's own cells blocked, and a live case: an NPC in `test_needs_sims` stands after a door has opened while it sat |
| M2 | M | slice 0 (walk audit), 4.4 item 1, 8.1 rows 0 and 8 | **The walk audit can miss the closed gaps and corridors it exists to catch, and its records are noisy.** (i) It floods the NPC grid, whose padding (one whole cell sideways, 2 px up and down; npc-pathfinding.js:254–262) already blocks any gap under about 24 px. The player moves by physics with an 18 px box. A gap of 18–24 px that a player walks through today and that footprint boxes close reads "blocked" both before and after, so nothing flags it. 4.2 counts 34 pairs that drop under 24 px; the share that started between 18 and 24 is exactly the share the audit can't see. (ii) Check (a) looks only at key points. A pocket of floor with no key point, cut off by a closed corridor, isn't flagged, yet `getRandomPatrolTarget` (npc-pathfinding.js:131–158) will still pick tiles there for patrols. Check (e) is a count and isn't reviewed unless something else flags the room. (iii) The record takes "every enabled immovable body", which includes seated NPCs and their chairs (M1) and immovable NPCs. Whether an NPC is seated when the record is taken depends on timing, so a legacy run and a footprint run of the same game row differ for reasons unrelated to desks. (iv) `room-snapshot.mjs` loads rooms with the game loop asleep (55–61) and then waits 300 ms (65). The grid rebuild is a game-time `delayedCall(200)` after each room (npc-pathfinding.js:113), so the last rebuild may not have happened yet | npc-pathfinding.js:113, 131–158, 251–278; room-snapshot.mjs:53–65; plan 4.2 side gaps | Add (g): per room, the walkable cells reachable from the doors before and not after, listed with a screenshot, failing above a small threshold. Add (h), from geometry rather than the grid, as `box_audit.py` already does: every desk-to-desk or desk-to-wall gap and corridor that goes from ≥ 18 px wide (or ≥ 10 px deep) to under it, using the real bodies of the opted-in map. Build the walk record's grid in the tool from static and immovable bodies, leaving out NPC bodies and swivel chairs, after calling `rebuildWorldGrid()` itself once every room has loaded and the loop is awake |
| m1 | m | slice 0 (f), slice 1 last bullet | Leftovers from the dropped 12 × 8 block. Check (f)'s "12–18 px wide (passable seated or by a pushed chair)" can't happen any more: every seated block and every chair body is at least 18 wide (the office chairs 18, `chair-white` 22, exec 28; plan 5). Only the 8–10 px height clause applies. Slice 1 says "so does the prototype's 12 × 8 shrink". The prototype has no fixed 12 × 8. It has the `{ w, h }` toggle in `seatedBlock` (seating.js:431–435) and the `keep` branch in `standUp` (535–542) | seating.js:431–435, 535–542 | Drop the width clause from (f) and its fixture. Reword slice 1: the `{ w, h }` toggle and the `keep` branch go |
| m2 | m | header ("main input") | `SEAT_BOX_EXPERIMENTS.md` still recommends "12 x 8 … kept on the empty chair (`keep: true`)" (33–37). Its "What the NPC side needs" list says the chair gets "the same block" and gives F + 4 "for 12x8" (104–111). The plan names it as main input, and the office-life session may read it | EXPERIMENTS 33–37, 102–113 | Add one line at the top of both sections: superseded by plan Q0 (the 18 × 8 body), with the stops unchanged |
| m3 | m | 2.1, slice 2, slice 4 | The map property's format and the second map file aren't specified. Tiled 1.2 and later write `properties` as an array of `{name, type, value}`, and Phaser passes it through as written, so `createRoom` must look the name up in an array (and should also accept an object, for hand-written maps). 133 rooms have a `.tmj` twin that `room_edit.py` edits alongside the JSON (`Room.docs`, room_edit.py:271–274). The text-edit `Doc` class has no way to add a top-level key (keys are alphabetical, so `properties` goes between `orientation` and `renderorder`) | room_edit.py:130–218, 271–274; `ls rooms/*.tmj` = 133 | Slice 2: read the array form, test the array, object and absent cases. `set-map-prop` writes both files, through `Doc` and `PyDoc`, and its round-trip test opens the result in both forms. The validator's legacy-map line reads the same array |
| m4 | m | 1.3 step 3 | For a voluntary jump-off, step 3 uses `state.approach` (where the player stood to sit) with a box check only. After a roll, that spot can be across the room or on the far side of a desk, and `jumpOff` animates a 320 ms hop to it (seating.js:696–710). That breaks "never across a desk" in the one branch the player chooses | seating.js:443, 591, 684–710 | For voluntary stands, use the approach point only if it is within the 4-cell flood radius and line clear; otherwise stay seated with the line. Forced stands keep step 5 as written |
| m5 | m | 1.3 step 2, slice 1 `walkBoxClear` | Flood candidates can land on the chair the player has just left. The box check ignores the chair (`o === chair`, seating.js:656). The nearest flood cells are 8 px from the castor, and `standUp` re-enables the chair's body (534), so the walking box and the 18 × 8 chair body can overlap by most of their height and Arcade shoves one of them. Compass spots at `reach` (half the body + 14) clear the chair by design. Flood spots don't | seating.js:534, 600–623, 631, 656 | Count the chair's body in the box check for flood and approach spots; ignore it only for the line check, which starts inside it. Add a unit case |
| m6 | m | 1.3 step 1, hand-off | The order assumes `facing` is the direction the chair is tucked towards ("forward diagonals last because a chair tucked in faces its desk"). For a seated NPC, `st.facing` turns towards the player within 96 px (seating.js:1026–1035) or while chatting (1201–1210), and `unseatNPC` passes that facing (980). Office-life slice 21 (idle swivel, `OFFICE_LIFE_PLAN.md` 12.7) will turn it at random as well. When an NPC stands while facing the player on a diagonal, that diagonal is tried first | seating.js:980, 1026–1035, 1201–1210; OFFICE_LIFE_PLAN.md 12.7 | Pass `homeFacing` (the facing the NPC sat down with) to `standSpot` for NPCs, and add it to the NPC stand test |
| m7 | m | 6 (hand-off and fallback) | Two gaps in the cross-session arrangement. (a) The office-life plan gained slices 16–21 (bd837adb2) after the hand-off note was written. Slice 21 changes `updateNeedsSeat`'s facing code (seating.js:1196–1210) and `setChairFacing`, which hand-off items 2 and 6 (slide target, fidget clamp) also change. (b) Slice 1's commit waits for the office-life session's review, and the slice 6 fallback waits for its agreement. If that session answers neither, nothing says what happens next | OFFICE_LIFE_PLAN.md section 12, 12.7; plan 6 | Name slices 16–21 in the note and agree an order for the two `seating.js` edits (seat box items 2 and 6 first is simpler, since idle swivel only turns the texture). If there is no answer by the time slices 2–4 land, ask the user rather than wait |
| m8 | m | 6 item 8, 7 step 4, 1.1 front contact | Slice 6a is wired into section 7's order, but some numbers it may change are still fixed. Hand-off item 8 fixes the PCs at y 3.5 / 6.5 and `useFrom.dy` 1 → 1.5. Slice 7's live pass line fixes the hip at F − 11, and 1.1 gives the same figure. If the audit moves desk items or changes the seated pose (`sitShift`/`sitHip`, seating.js:53–90), these go stale and the pass line fails for the wrong reason | plan 6 item 8, 7 step 4; seating.js:53–90 | Phrase item 8 as "move the approach cells with the PCs' final positions (after the scale audit)". Take slice 7's hip figure from the audit's result, keeping the castor lines (F + 4, back edge − 4), which come from the boxes alone |

## Answers to the brief's questions

1. **R1 fixed?** Yes, all 15. B1's fix holds for players on open floor; M1 shows the flood step
   failing for seated NPCs.
2. **Stand-up order (1.3).** The written order matches `pickStandSpot` exactly. The compass and
   line checks are sound: with a 23 px reach the ¼, ½, ¾ samples are under 6 px apart, so a desk
   box at least 9.75 px deep (the legacy box) can't fall between two samples. The flood can't
   cross a desk, because a padded desk blocks at least one full row of 8 px cells and the flood
   only steps through walkable cells. Problems: the flood fails when the chair is in the grid
   (M1); flood spots can overlap the chair just left (m5); the voluntary approach branch can
   jump across a desk (m4); NPC facing (m6). A forced stand that finds nothing returns null for
   NPCs, and the plan doesn't say what then (M1).
3. **Map property.** Workable. Phaser 3.60 keeps the Tiled map's `properties` on the tilemap, and
   `createRoom` has the tilemap before either table-body site runs (rooms.js:1797; 2136, 2637).
   Mode A scenario tables are built inside `createRoom` too, so one `room.deskBoxes` reaches both.
   Format and `.tmj` details in m3.
4. **Walk audit.** Not enough as written: it works on the NPC grid and on key points, so
   player-only gaps of 18–24 px and pockets with no key point can close without a flag, and
   seated NPCs add noise (M2).
5. **Anything still on the 12 × 8 work?** Only wording: check (f)'s width clause, slice 1's
   "12 × 8 shrink" line (m1), and the experiments doc's recommendation (m2). Every engine slice,
   the hand-off and Q7 now read correctly for the 18 × 8 body.
6. **Slice order and hand-offs.** Workable. Slices 0–5 have no outside dependency except the
   office-life review of slice 1. Slice 7 waits on 1–4, 6 (or its fallback) and 6a, and 6a
   correctly forces a re-measure if desk art changes. Gaps: the new office-life slice 21 overlaps
   hand-off items 2 and 6, and there's no escalation if that session doesn't answer (m7). Some
   numbers aren't yet tied to 6a (m8).

## Verdict

**Ready with conditions.** Slices 0, 2, 3 and 4 can start now. Before slice 1 is built, fold M1
into the stand-up order and its tests. Before slice 0's tools are built, fold M2 into the walk
audit, because every later map opt-in leans on it. The minors can be folded in as each slice is
written.

Counts: 0 blockers, 2 majors, 8 minors.
