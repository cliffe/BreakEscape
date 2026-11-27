# Table surfaces plan: adversarial review, round 1

Plan: `docs/achitechture/TABLE_SURFACE_PLAN.md` at 74ca26e20. Reviewer: read-only, Opus. Date 2026-11-06.

Every number below was re-derived from the code, the room JSON and the sprite PNGs, not taken
from the plan. Scratch work: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/tsreview/`
(`mock.py`, `mock_accounts.png`: one accounts desk composited in engine depth order, now / plan /
plan with the lamp moved; `../tapcheck.py`: tap-menu pairs before and after).

## Re-derived numbers

| Case | Inputs | Result | Plan says |
|---|---|---|---|
| Accounts PCs (`staff_pc`, `staff_pc_2`, `usb_target_pc`, `usb_malware_note`) | `pc` key loads `objects/pc1.png` (game.js:388), 28×23, last opaque row 22; tile y 4 → top 128, base 151; desk1 items-layer at Tiled y 160, h 39 → top 121, front row 16 → 137 | 151 − 137 = **14 px south**; depth 151 + 0.5 + 20 = 171.5 vs desk 160.5 | 14 south, 171.5 / 160.5. Correct |
| `planted_deviceA` | icon_deviceA 20×15, last row 14; tile y 4 → base 143 | 6 px south | Correct |
| Accounts north chairs | aw_chair_north 16×26, seat [8, 13] (seating.js:205, 209); tile y 5 → top 160, foot 186, hip 173 | hip 13 below floor line 160, 36 below front 137 | Correct |
| Tomasz | aw_chair_south_slate1 16×32 at tile (11, 4) → 128–160; desk 344, 121–160 | chair foot 160 = desk floor; 16 px south of the back line 144 | Correct |
| m10 `core_access_key` | `notes` → notes1.png 16×16, last row 12; y 4.8 → 153.6, base 166.6; zds_desk3 in `tables` at 131, top 0 / front 16 | 166.6 − 147 = **19.6 px south** | Correct |
| Plan's proposed fix, accounts | PC base to front − 2 = 135 → top 112; chair foot 160 + 7 = 167 → hip 154 | PC moves 16 px north, hip 19 px north; **monitor top 9 px above the desk's back edge** | "6–14 px north", "about 19 px" |

The plan's measurements hold. The trouble is in what it builds on them.

## What "floating north" means

The plan is right on the geometry. The PC base sits 14 px south of the front edge, the keyboard
(rows 18–22 → y 146–151) is drawn over the lip and the drawer pedestal, and the stand is on the
front face. Nothing about the PC is north of the top.

My read: the user judged the PC against the sitter and the desk's front face, not against the
top's back edge. In `accounts_seated_clean.png` the monitor stands up on the pale top while the
worker sits a full tile below the desk. In `accounts_slice3_needicon.png`, with nobody seated, the
keyboard hangs over the drawers, so the whole unit hovers in front of the desk. In screen terms,
north means up, and the PC reads as lifted off the furniture, far above the person using it. Both
complaints describe one gap: monitor and worker are too far apart, with the desk edge between
them.

That reading matters because the plan moves **both** things north: the PC by 16 px, the hip by 19 px.
The monitor-to-sitter gap shrinks by 3 px. The snapped monitor's top (112) also rises 9 px past the
desk's back edge (121). In the mock (`mock_accounts.png`, middle panel) the PC now peeks over the
back of the desk behind the worker's head. That is correct 3/4 projection, but it may look *more*
"north" to the person who reported it. The plan has to settle this before any engine work (B1).

## Findings

| ID | Sev | Section | Finding | Evidence | Suggested fix |
|---|---|---|---|---|---|
| B1 | B | 1.3, 7.4 Q1, 7.1 | The fix may go the wrong way for the user. Q1 ("which way is floating north") is left until after slices 1–7, but the plan's own fix moves the PC and the sitter north together. The gap the user complained about barely changes, and the monitor ends up sticking out above the desk's back edge. Eight slices would then rest on a reading of the report that nobody has checked with the user. | PC 151→135 base (−16), hip 173→154 (−19), gap −3 px; monitor top 112 vs back edge 121; mock middle panel | Before slice 1, show the user a three-panel mock: now / plan / an alternative (sitter in, PC on the top but shifted ~10 px sideways off the head, or a monitor-only sprite with the keyboard at the front edge). `mock.py` does it in seconds. Freeze the target (where the base goes, where the hip goes) from that answer. |
| M1 | M | 4, 4.1 | `on` cannot find the accounts desks. Items-layer desks are built after the scenario pass and are not in `tableObjects`/`tableGroups`, so `tableUnder` over sprites finds nothing for an `on` item, and "joins that table's group" has no group to join. 26 desk placements across the rooms are items-layer (all five on the accounts floor). | rooms.js:1952–1971 (groups from the `tables` layer only); scenario loop 2042 runs before unreserved regular items 2367; my scan: 299 `tables`, 26 `items`, 2 `conditional_items`, 1 `conditional_table_items` desk placements | Build a surface index from `objectsByLayer` (raw Tiled objects in every layer, plus mode A tables) before the scenario pass. Snap from that, and set depth to desk floor + 0.5 + 0.01·n directly for items-layer desks. Add an items-layer desk to the test scenario. |
| M2 | M | 4.2 risk, 7.3 | The approach-cell shift is bigger than the plan says, and it hits the first mission to opt in. `approachCell` = nearest walkable cell to the sprite centre + `useFrom`·32 on an **8 px** grid, so the 16 px snap moves every accounts home cell the full 16 px: y 172 → 156, inside the desk rectangle (121–160). With the desks non-colliding, that cell is walkable, so a standing worker's feet are 4 px above the floor line and the desk front draws over them (depth 156.5 < 160.5). Slice 8 opts the lab in first, but the fix sits in slice 6, in the other session's files. | npc-needs.js:1800–1811, 1650–1655 (centre); constants.js:37 `PATHFINDING_STEP = 8`; centre 139.5→123.5, +32 → 171.5→155.5 | Make the approach-ref change a hard prerequisite for opting in any needs mission, or use the data-only fix: `useFrom.dy` 1 → 1.5 on the four PCs (the schema allows numbers, scenario-schema.json:5043), which puts the cell back at 172. Lint 1 can suggest the new `dy` whenever it moves a needs object. |
| M3 | M | 4.2, 4.3, 6 | The seating split doesn't cover the accounts floor. Chris, Melanie and Sofia are needs NPCs on scenario **static** chairs. The needs path slides only swivels, and the plan's placed-sitter hook is for `"seated": true`. So nothing moves `hampshire_chair`, `pierce_chair` or `lord_chair`, and `spare_desk_chair` (no sitter) is never touched at all. Section 4.3 still promises "the four north chairs come in about 19 px". The "6–16 px on the accounts floor" slide in 4.2 is for a slide that never runs there. | seating.js:1141 (`if (near.seat.kind === 'swivel') slideChairFootTo`), 1142 (calls `seatNPC`), 826–858; scenario.json.erb:1040–1082 | Static chairs are authored data. Fix them in the scenario (row 1 chairs y 5 → 4.40625, foot 167; row 2 y 8 → 7.40625; `tomasz_chair` y 4 → 3.4375, foot 142), with lint 2 giving the number. Keep the runtime move for swivels only, and say whether the `seatNPC` hook fires for needs sitters (it is called from both paths). |
| M4 | M | 4.2 | A per-chair `reach` is the wrong lever. Seat points differ per facing (FAMILIES), and swivel sitters turn: needs sitters to face the player in chat, placed sitters within 96 px. A single reach is right for one facing only. A sitter turned south on a chair pulled flush to the desk sits with its back in the desk top. | seating.js:170–185 (seat per facing), 1097–1108, 921–931 | Take the sitter line from the desk alone: hip y = contact line − k, with one global k (k = 6 on desk1 gives the plan's hip 154). Place the chair from its seat point for the current facing, and re-solve when a swivel turns. No new per-chair data, and no render tests per family. |
| M5 | M | 4.2 (`tuckIn`) | Physics will push back on the pulled-in swivel. Chairs collide with every immovable body, tables included. A chair foot at contact + reach overlaps the table's bottom-quarter body by about h/3 − reach. While the NPC is seated the chair is immovable, but `unseatNPC` restores that, and `tuckIn` then pushes it 12 px further in, so Arcade separation pops it back out. The plan calls the tucked look "the look wanted" without checking this. | object-physics.js:43–50; seating.js:847, 870, 878, 1153–1157; rooms.js:2635–2644 (table body) | For colliding desks, clamp the chair target so its body clears the table body, or skip the chair–table collider while tucked. Prove it in `test_needs_sims` with a `tables`-layer desk: stand, tuck, wait 2 s, check the chair hasn't moved. |
| M6 | M | 1.5, 4.3, 5 | The most visible "on the desk" faults in the user's screenshots aren't covered. The accounts floor's three `bankers_lamp1` (base 162: 25 px south of the front edge, 2 px past the floor line) and `notes_ledger1` (base 258 vs 233) sit in the items layer of a hand-dressed room. `on`, `tableItems`, `place_on_table`, lint 1 (scenario objects only) and `slot_audit.py` (Tiled `table_items` only) all miss them. The scratch audit skips the items layer too. | room_lw_accounts.json items layer (lamps at x 232/392/232, Tiled y 162/162/258; ledger y 258); 963dc0462 hand-dressed; mock right panel | Run the item-off-surface check over the `items` and `conditional_items` layers too, for any prop whose x-centre is over a desk with an entry. Fix the accounts props with `room_edit.py`, and list them in 4.3. |
| M7 | M | 4.1 Generators, 7.1 slice 7 | Redefining `surface_frac` as a fraction of the band silently re-tunes about 30 existing calls that were set by eye against sprite height. Example: `office-misc-lamp3` at 0.18 on desk1 goes from row 7.0 to row 2.9. "Rebuild the rooms" also risks overwriting rooms that have drifted from their generator through hand edits. | generate_rooms.py:200–221, calls at 582–1728 | Add a new keyword (`band_frac`) and keep the old one. Move only the `y` of the affected `table_items` in place (`room_edit.py`) instead of rebuilding whole rooms. |
| M8 | M | 2.3, 3, 7.1 | Nothing keeps the data current. `register_object.py` makes five edits for a new prop, none of them for surfaces. The measurer picks sprites by a name regex. The engine and both lints skip any texture without an entry, so a new desk silently gets today's behaviour. The base-row cache the validator needs is a second generated file that can go stale. | register_object.py:6–13; callers make_*_props.py, pixellab_props.py; plan 2.2/5 | `register_object.py` runs the measurer on surface-like names (or takes `--surface`) and writes a `measured` entry. Add a test that every texture in any `tables` layer, and every catalog name matching the surface regex, has an entry or sits in an explicit `notSurface` list, and that the base-row cache matches the PNGs. Keeping the data out of `catalog.json` is fine: the browser needs it, and the catalog isn't served. |
| M9 | M | 7.2 | The tests can't catch a regression in another mission. The proofs cover the accounts floor, the new test scenario and `test_needs_sims`. Flipping sitters on by default changes needs rooms in sis01 and m02, and nothing compares them. | needs missions: sis01_healthcare, lab_physical_pentest, m02_ransomed_trust (+4 test scenarios); `seated`: lab and test_seating only | Take a position snapshot before and after each slice: every room sprite's x, y and depth, for every scenario (the scratch `render_all.rb` already renders them all). Assert that only opted-in objects moved. Add sis01's and m02's needs rooms to the live sitter check before the default flips. |
| M10 | M | 4.1 | The field name `on` overwrites Phaser's `GameObject.on`. `applyScenarioProperties` copies every scenario key onto the sprite except `texture`, `x` and `y`, so `"on": true` replaces that sprite's EventEmitter method. Nothing calls `.on(` on scenario room sprites today, so the damage is latent: the first listener anyone adds, or any Phaser path that uses it, throws. | rooms.js:393–396 | Rename it (`onTable`), or add `on` to the skip list and read it only from `scenarioData`. |
| m1 | m | 2.1 | Two values can't describe side-on counters or oval tops. `m09_hatch_counter1/2` (22×104, 16×104) have a vertical band of columns, not rows, and the plan's "hand value" route can't put that in `{top, front}`. `lw_oval_table1`'s usable width changes row by row, so one pair of insets lets items hang off the curved ends. | contact_sheet_03/04 | Add an optional `rect` (or `axis: "x"`) for side-on sprites and an `ellipse` flag (or per-row insets), or list them as `notSurface`. |
| m2 | m | 2, 4 | Angled and mirrored tables aren't covered. My scan of all room JSONs found 0 rotated and 0 flipped table sprites, but the props rule allows one or two angled props per room, and `applyTiledProperties` honours `rotation`, `flipX` and `flipY`. | rooms.js:342–357, 2617–2619 | `surfaceOf` returns null when rotation ≠ 0 (and the lint skips it). Mirror `inset` and `clear` under `flipX`. |
| m3 | m | 4.1, 7.3 | Items wider than the top, and stacked items, are undefined. When an item is wider than x1 − x0 the clamp has no answer. Sorting by base row puts a sheet lying on a laptop *behind* the laptop, because its base is further north. | plan 4.1, 7.3 | Centre and warn when the item is too wide. Let `onTable: "<item id>"` mean the named item's depth + 0.01. |
| m4 | m | 5 | Both lints will raise false alarms. Lint 2 flags every south-facing chair south of the north contact line, including chairs whose backs face a desk. Lint 1 can flag a wall-mounted item whose rectangle overlaps a desk against the back wall. | plan 5.1, 5.2 | Lint 2 only when the desk lies in the chair's facing direction. Lint 1 skips wall-mounted items (`WALL_MOUNTED_EXTRAS`, or back-wall auto-elevation > 0). |
| m5 | m | 5 | Taking lint sprite sizes from `catalog.json` gets the engine's aliases wrong. The catalog has `pc` at 36×24 (pc.png), but the engine's `pc` key is pc1.png at 28×23, and `notes` is notes1.png. | catalog.json `objects.pc`; game.js:388, 391 | Read the `load.image` key map from game.js (as the scratch audit does), or have the measurer emit a key → {w, h, baseRow} cache. |
| m6 | m | 7.3 | The plan understates how much a pulled-in sitter hides the monitor. In the mock the head covers 35% of the screen (20% today) on all three accounts PCs, because the sitter's centre (x 72) is over the monitor (x 67–86). That makes Melanie's locked or unlocked screen harder to read. | mock.py coverage: 49/240 now, 85/240 plan | Nudge the PC about 10 px off the chair's centre in the scenario, or accept it knowingly. |
| m7 | m | 6 | The ownership table leaves out office-life depth rules that depend on the PC's depth. A left-behind item takes `home.sp.depth + 0.1`, and tray slots lift above their copier. The PC's depth falls from 171.5 to about 160.51; accounts items still sort correctly, but the handover note should name these. | 5cccaf6ea, npc-needs.js (left-behind depth lift) | Add both to the note for the office-life session, with a test in `npc-left-behind.test.mjs` that has the home object in a table group. |
| m8 | m | 2.1, 2.3, 1.2 | Small factual slips. game.js never loads `objects_tileset.json`, so it isn't "next to" anything in preload. "Or the collision box's bottom if lower" can never apply, because the box's bottom is the sprite's bottom. The head top is about 137, not 143. `place_on_table` is in `scripts/generate_rooms.py`, not `scripts/room_gen`. | rooms.js:2635–2644; game.js preload; ev_accounts_crop.png | Correct the text. |
| m9 | m | 7.3 | The 33 px tap-menu rule doesn't break, but the accounts floor already breaks it. Before the snap, three pairs raise a menu: `captures_terminal` centre → `staff_pc_2` origin 30.5 px, `staff_pc` → `planted_deviceA` 21.4, and `usb_target_pc` → `usb_malware_note` 21.4 (the last two only after their reveals). After the snap: 21.2, 18.3 and 21.4. No new pairs appear, and chairs drop out (`withoutChairsIfOthers`). | tapcheck.py; game.js:2582–2615 | Mention it to the lab owner. Snapping isn't the cause, but the terminal pair moves from borderline to clear. |
| m10 | m | 2.1 | The north contact line (floor − (front − top)) assumes the top's depth in rows equals its depth on the floor. That's plausible for desk1, but unchecked for tall-legged tables (hospital_conference_table: top 28 rows, legs 25). | contact_sheet_01 | Check one south-facing sitter at the conference table in the test scenario before trusting the formula. |

## The questions asked

1. **Numbers.** Right, as shown above, for the accounts PCs, the accounts chairs, Tomasz and m10. The
   plan's PC move is 16 px (to front − 2), not "6–14".
2. **Two values.** Enough for flat desks, conference tables (the north side follows from the same
   two numbers) and L-desks built from two sprites. Not enough for side-on counters, oval tops,
   rotated or mirrored sprites, or items wider than the top (m1–m3).
3. **Depth.** Table-group depth (desk floor + 0.5 + 0.01·n) is right for a player behind the desk
   (feet < 121, drawn behind), a player in front (feet > 160.5, drawn over, which is better than
   today's 171.5, where anyone up to 11 px south of the desk is drawn behind the PC), and a sitter
   behind (chair at 142, the desk top hides the sitter below y 121). It is wrong for stacked items
   (m3) and needs a rule for wall items (m4). Items-layer desks have no group yet (M1).
4. **Reach.** Not broken. The accounts desks don't collide, so the player can stand anywhere. For a
   colliding desk1, the nearest a player can stand puts the snapped PC's top within 22 px (under 32).
   Approach cells do move: 16 px, into the desk on the accounts floor (M2). The tap-menu pairs are
   in m9.
5. **Seating.** Take the sitter line from the desk, not from a per-chair reach (M4). No desk:
   unchanged. Two desks: pick the one in the facing direction. A chair facing away: leave it, and
   don't lint it (m4). Swivels that turn: re-solve per facing (M4). Tuck and physics: M5. The split
   with office life works only after fixing M2 and M3. The accounts floor needs static chairs moved
   in data, which touches no office-life file.
6. **Blast radius.** Sitters on by default touch sis01, m02 and the lab (needs), plus the lab and
   test_seating (seated). Items stay opt-in. Scenarios with hand-tuned `elevation` keep it unless
   they add `onTable`. Opt-in then default is sound once the snapshot diff in M9 exists.
7. **Data.** A separate served file is right. It needs `register_object.py` to add entries and a
   coverage test against drift (M8).
8. **Tests.** Not enough on their own (M9).
9. **Simpler.** Below.

## Something simpler that fixes both faults

For the floor the user looked at, a data-only change fixes both faults today, with no engine work:

- PCs and `usb_malware_note`: y 4 → 3.5 (and 7 → 6.5), `elevation` 20 → 26, so the base is 135
  and the depth 161.5, just above the desk's 160.5. `planted_deviceA`: y → 3.75, elevation 26 (base 135, depth 161.5).
- `useFrom.dy` 1 → 1.5 on the four PCs, so the home cells stay at 172 and 268.
- North chairs: y 5 → 4.40625 and 8 → 7.40625 (foot 167). `tomasz_chair`: y 4 → 3.4375 (foot 142).
- Lamps and ledger: `room_edit.py` moves them to base 135 and 231.

Then build lints 1 and 2 (with M6's items-layer coverage and m4's facing test), which print exactly
those numbers for every other mission. That is slices 1, 2 and 4 of the plan, with the data file
feeding the lints. The engine `onTable`, the table-group depth and the swivel slide become a
later, optional step, built against the user's answer to B1.

## Verdict

**Revise.** Measuring a top and a front per sprite is right, and the measurements check out. The
order of work, the seating mechanism and the coverage need rework. Settle B1 with the user first,
then do data and lints, then the engine.

Counts: **B 1, M 10, m 10.**
