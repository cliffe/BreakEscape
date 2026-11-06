# Seat-box experiments (option G)

Date: 2026-11-06. Status: experiments done, recommendation below; engine change not made.

> **Superseded in part (user, Q0, 2026-11-06):** office chairs keep their own 18x8 body; the 12x8
> shrink and the empty chair's `keep` are dropped. The plan of record is `SEAT_BOX_PLAN.md`.

Option G: while someone sits, their collision box (and the chair's) shrinks to a small block
at the centre of the chair's castor base. Desks keep a box of their own. A chair rolls in
until the block meets the desk's box and physics stops it there. Desks stay ordinary table
groups (Tiled `tables` + `table_items`), so monitors and lamps draw with their desk.

## Set-up

- Scenario `scenarios/test_desk_seating`, room map `room_test_desk_seating` (20x10, the
  Ledgerwell shell; preloaded in `core/game.js`). Top row: `desk1`, `smalldesk1`, `zds_desk1`
  (the most-used desks after server racks), each with a `chair-darkgray-1` swivel chair (the
  most-used swivel chair, body 18x8) and a `hospital_chair_north` static chair in front, a PC
  and a lamp on `table_items`, and a swivel chair off `desk1`'s east end. Bottom row: `desk1`
  and `smalldesk1` used from behind (chairs to the north), and two `desk1`s 24 px apart.
- Loading it: the game only plays missions with a DB row, so the scenario is not registered.
  Runs used one game row of `test_seating` whose `scenario_data` was swapped for this scenario
  (the same kind of test-only edit as `new-game.rb --start-room`). No seeds, no `db:` task.
- Prototype: `seating.js` `seatedBlock()`. With `window.__seatBox = { w, h }` set, the
  driver's body on a swivel chair is a w x h block centred on the chair body's centre (the
  castor base) instead of the chair's whole footprint. Off by default; unit test in
  `test/js/seating.test.mjs`. The chair's own body is already off while someone sits on it
  (unchanged), and standing restores the driver's walking box (unchanged).
- Desk boxes were changed live for the sweep (no engine change): today's bottom quarter vs
  the floor footprint (the top surface's depth in rows: 16 for `desk1`/`zds_desk1`, 28 for
  `smalldesk1`), each with a 10 px side inset or none.
- Every roll is a held arrow key through `window.__test.walk` (the real input path); getting
  up is Space, Space (stand on the seat, jump off). Only the start of each case (chair and
  player placed before sitting) is set directly.

## Recommendation

- **Seated block: 12 x 8**, centred on the castor base, kept on the empty chair as well
  (`keep: true`), or at least never more than ~4 px smaller than the chair's own body along
  the roll axis (see "Standing up" for why).
- **Desk box: the floor footprint, no side inset.** Height = the top surface's depth in sprite
  rows (16 for `desk1`/`zds_desk1`, 28 for `smalldesk1`), ending at the floor line; full
  sprite width. Today's box (bottom quarter, 10 px inset) is right from the front only.
- **Getting off needs a rule after all:** the landing spot must not be on, or across, a desk.
- Walkers keep their 18 x 10 box and still pass between desks a chair-width apart.

The footprint depth isn't known to the engine. It needs a per-sprite number (a small table
like `TOP` in the experiment driver, or measured from the art once, as `sitShift` does).

## Measurements

216 rolls: 4 desk boxes x 6 block sizes (off = the chair's own 18x8 body, 4x4, 8x4, 8x6,
12x8, 16x12) x 9 cases. Raw rows: scratchpad `seat-box/sweep.json`. F = the desk's floor line
(sprite bottom). Positions are the block centre (castor base) in world px.

**From the front** (sitter faces north). Every desk box ends at F, so all four give the
same stop: the block's top edge meets F, and the castor base stops at F + h/2. Hip =
F - 13 + h/2 (4x4: F-13, 8x6: F-12, 12x8: F-11, 16x12: F-9). Never inside the footprint.
Chair and sitter draw over the desk group (chair depth F + 8.5 vs desk F + 0.5).

**From behind** (sitter faces south, as Tomasz).

| Desk box | `desk1` castor stop | `smalldesk1` castor stop |
|---|---|---|
| bottom quarter | F-14 to F-12: 2-4 px inside the footprint (back edge F-16) | F-14 to F-12: **12-16 px inside** (back edge F-28): rolled under the top |
| footprint | F-22 to F-18: 2-6 px behind the back edge | F-34 to F-30: 2-6 px behind the back edge |

With the footprint box the hip sits 5 px below `desk1`'s top edge and 5 px above
`smalldesk1`'s; the desk group draws over the sitter's legs, as it should for someone behind
a desk. The quarter box sinks a `smalldesk1` sitter to the shoulders.

**From the sides** (sitter faces east or west, `desk1` and `zds_desk1` ends, `smalldesk1`).
Inset 10: the castor stops 1-8 px inside the desk's end (inside the footprint) for every block
size. Inset 0: castor at the end + w/2 (12x8: 6 px clear). Side-on chairs sit level with the
footprint, so their depth (F - 0.5) is just under the desk's: the desk's end leg draws over
the chair's front castor and the sitter's feet. That reads as "at the end of the desk" in the
screenshots; it is the one place a chair is partly behind a desk, and only by its castor.

**Block size.** Stops move by half the block: 4x4 vs 16x12 is 4 px front/behind, 6 px at the
sides. Below 8 px high the sitter is tucked further than looks natural with `desk1`'s legs;
16x12 leaves a visible gap at the sides. 12x8 is the middle and matches `chair-darkgray-1`'s
own body height, so its empty body fits where it stopped.

**Standing up.**
- Today's `standSpot` tries the spot in front first. Tucked in, "in front" is the desk: the
  player landed on the desk top region (feet F-16 to F-24), inside or behind its box, in 100%
  of front and side cases at every size; from behind, the spot was on the far side of the
  desk (through it). The prototype (on only while `__seatBox` is set) skips spots whose walking
  box overlaps a static body or whose line from the chair crosses one. With it, every case
  landed on the near side (front: F+8, beside the chair) and walked away 50+ px.
- A block smaller than the chair's own body leaves that body sunk into the desk box when it
  comes back on standing. Arcade only separates overlaps up to 4 px (OVERLAP_BIAS) without
  motion, so it stays sunk (4x4 to 8x6 from the front; every size below 18 wide at the sides).
  The prototype's `keep: true` gives the empty chair the same block, which clears it.

**Walkers.** Two `desk1`s 24 px apart (sprite gap): box gap 44 px with a 10 px inset, 24 px
with none. The 18 px walking box got through with every desk box (walked 80 px south
through the gap). The inset can go.

**Static chairs.** `hospital_chair_north` in front of `desk1`: the sitter draws correctly
(seated at the chair's seat, over the desk group), and the hop-off (a move key) returned the
player to the approach spot south of the chair, clear of the desk box. Static chairs have no
body, so option G doesn't change them; their map placement sets the look.

## What the NPC side needs (office-life session, not changed here)

- `seatNPC`/`updateNeedsSeat`: on a swivel chair, give the chair (or the NPC) the same block,
  and pull the chair out to the contact line (front: castor at F + 4 for 12x8; behind: at the
  footprint's back edge - 4), not to the NPC's feet: today `slideChairFootTo(feet)` puts the
  chair wherever the work cell is (one tile south of the PC with `useFrom.dy: 1`).
- `tuckIn` (12 px forward on leaving) should stop where the block meets the desk box rather
  than move a fixed 12 px, or it pushes the chair into the desk.
- `unseatNPC`/`standSpot`: the same landing rule as the player (not on or across a desk).
- `fidgetChair`'s 2 px back / 3 px sideways rolls stay clear of the box with 12x8.
- Swivel chairs on the floor are dynamic bodies; check needs NPCs' paths around empty chairs
  (the original reason the lab's desks were made non-colliding was NPCs wedging).

## Part 2: the accounts floor (prepared, not committed)

Patch: scratchpad `seat-box/part2_lab_desks.patch` (`git apply --check` clean against HEAD
`b38b32099`; not run in a browser). It does this:

- `room_lw_accounts`: desks #44-48 back to `tables`; lamps #62-64 and ledger #65 to
  `table_items`, moved onto the desk tops (bottom 135 / 231 / 233; before, they hung 2 px past
  the floor line); four `pc1` placeholders on `table_items`; five `chair-darkgray-1` swivel
  chairs, front ones with the castor at F + 4 (Chris, Melanie, Sofia, spare desk) and Tomasz's
  behind desk #46 at its footprint's back edge - 4. The map gains the `objects` tileset
  (firstgid 115), hence the large diff. `room_edit.py` refused it ("firstgid clash": its
  check wants new tilesets above the highest firstgid, and this map's room tileset is at
  1500); the patch was made with a copy whose check tests real overlap. That fix belongs in
  `scripts/room_gen/room_edit.py`.
- `scenario.json.erb` (open_plan): `staff_pc`, `usb_target_pc`, `usb_malware_note`,
  `staff_pc_2` lose `elevation` and move up half a tile (y 3.5 / 6.5) so the monitor stands on
  the top surface (base row F - 25, about the table-surface plan's figure); the five `aw_chair_*`
  objects and their ERB comments go.
- Desk boxes are still today's engine boxes. Tomasz's chair is placed, not rolled, so it
  works with them; a player rolling to his desk from behind would go 2-4 px under the top.

**Can scenario PCs join table items reliably?** Only with care.
- A scenario object takes the first unreserved Tiled item of its base type, searching
  `items` before `table_items` (rooms.js `findMatchFor`), in Tiled order, in scenario order.
  Its explicit `position` then overrides x/y, and it is grouped with the table it overlaps
  (southmost if several), so with explicit positions the order only decides which
  placeholder image each one gets.
- It breaks when the counts or order are off. A table item with no overlapping table is
  still grouped with the nearest table at any distance (`findClosestTable` fallback), taking
  that desk's depth. Here five objects are type `pc` and the map has four placeholders:
  `cable_note` (off the desks, 5th in order) gets none and keeps its own depth, which is
  right; inserting an off-desk `pc` object before `staff_pc_2` would steal a placeholder and
  draw at a desk's depth. An `items`-layer `pc` would be taken first and never grouped.
- Suggested engine fix: group a matched table item only when it overlaps a table, otherwise
  treat it as an ordinary item.
- `planted_deviceA` (a sprite with no placeholder) keeps its `elevation: 22`.
- The office-life session should check the needs NPCs' work cells after the PCs move up half
  a tile (the approach cell comes from the object's position plus `useFrom`).

## Files

- Prototype: `public/break_escape/js/systems/seating.js` (`seatedBlock`, `clearOfTables`,
  `keep` in `standUp`, the landing check in `standSpot`); every change is inert unless
  `window.__seatBox` is set. Test: `test/js/seating.test.mjs`.
- Screenshots (scratchpad `seat-box/`): `best_*.png` (12x8 keep, footprint box, no inset, each
  direction and the static chair), `contact_best.png`, `contact_sizes.png` (4x4 / 8x6 / 12x8 /
  16x12 against today's box), `sweep.json`, `exp.js` (the driver).
