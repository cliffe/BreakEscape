# Table surfaces plan: adversarial review, round 2

Plan: `docs/achitechture/TABLE_SURFACE_PLAN.md` at d89b756d8. Reviewer: fresh, read-only, Opus.
Date 2026-11-06. No live run: every claim below comes from the code, the room JSON, the
scenario files and the sprite PNGs. Scratch scripts:
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/tsr2/`
(`sit.py`: seated-frame bounds over all 108 atlases with sit frames; `order.py`: which table
groups change order under a base-row sort).

## R1 fixes, re-checked against the code

| R1 | Landed? | What I checked |
|---|---|---|
| B1 | Yes | Section 0 records the user's choice; `tsplan/mock_layering.png` panel 3 matches the positions in 0.1 (PC top 112, lamp foot at the front of the top, hip 154). |
| M1 | Yes, with two gaps (m3, m9) | Groups are built from `tables` before the scenario pass (rooms.js:1952–1971, scenario pass 1982), so a `tables`-layer desk is there when an `onTable` item is made. All five accounts desks are in `items` (room_lw_accounts.json ids 44–48) and get no body today (`processObject` adds one only for `type === 'table'`, rooms.js:2625). The NPC checks the flag would skip all require `obj.body` (npc-sprites.js:969, 1099; npc-behavior.js:2366). |
| M2 | Yes | `approachCell` takes the object's `x, y` plus `useFrom × 32` (npc-needs.js:2071–2080). PC centre 112 + 11.5 = 123.5, + 1.5 × 32 = 171.5, the same cell as today's 139.5 + 32. Schema allows a number (scenario-schema.json:5047). |
| M3 | Yes | Static chairs as data. Numbers check: `aw_chair_north_*` 16×26, seat [8, 13]: y 141 → hip 154, foot 167; 237 → 250 / 263. `tomasz_chair` (`aw_chair_south_slate1` 16×32, seat [8, 15]) at y 109 → hip 124, foot 141. |
| M4 | Yes, but see M2 and m1 | One global `k` per side, chair placed from its seat point. The constants hold across characters (m1), but the back-side rule fails on shallow tops (M2). |
| M5 | Yes, in the hand-off note | Clamp arithmetic checks: office40 (body 13.3, drop 20) gives hip 155 on `desk1`; exec (21.3, 38) and white32 (10.7, 22) never bind. Chairs do collide with any immovable body (object-physics.js:43–50). |
| M6 | Yes | Lamp 23×25 and ledger 20×12 numbers in 7.0 put both bases on the top; lint 1 lists the `items` and `conditional_items` layers. |
| M10 | Yes | `onTable` is not a Phaser `GameObject` member. `applyScenarioProperties` still copies it onto the sprite (rooms.js:393–396), which does no harm. |

## Findings

| ID | Sev | Section | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| M1 | M | 4.0 item 3, 4.3, 7.1 slices 0–1 | **Slice 1's base-row sort is global and needs data slice 1 doesn't have.** The final pass sorts every table group, not just opted-in ones, so switching from `sprite.y` to base row reorders existing groups in most missions. That breaks 4.3's "opt-in, so nothing moves" and fails the slice 0 gate ("only opted-in objects may move") on the first slice. `baseRows` arrives in slice 3. Slice 1 says "no surface data" and doesn't say it measures at load. | rooms.js:2407–2420 (all groups); `order.py`: 59 of 132 Tiled groups with two or more items change order when sorted by bottom instead of top, across 36 rooms, including `room_office` (the stock template in about 40 scenarios), `room_IT` and `room_hospital_office_it` | In slice 1, apply the new order only to groups that hold an `onTable` or `tableItems` item, and keep `sprite.y` for the rest. Or make the global reorder a separate step with its own diff, reviewed by eye. Say where slice 1 gets base rows: sprite bottom (`y + height`, no data), or an alpha scan at load like `sitShift`. Move the switch to measured `baseRows` into slice 3. |
| M2 | M | 0.2 row 2, 4.2 | **The back-sitter rule puts the chair in front of a shallow desk.** Row 2 needs chair foot ≤ F − 1. The rule gives foot = F − (front − top) − 20 + drop, so it holds only when drop ≤ depth + 19. The plan checks `desk1` only and quotes 23 px as the largest south-facing drop. The exec swivel's south drop is 27 (64 − 37), so it fails on any top shallower than 8 rows: `aes_console1` 5, `hce_console_table1` 4, `lecture_ledge1/2` 5, `m10_console_controls1` 5, `lw_credenza1` 7, `m10_key_console1` 7, `reception_counter1` about 6. `exec_chair_black1` (23) fails below 4. The chair and sitter then sort over the desk and its items. | FAMILIES exec south seat [19, 37] on a 64-px sheet (seating.js:178–181, chair-exec-rotate1.png 38×64); depths from `table_surfaces_estimates.json` | Clamp the back-side hip to `min(northContact − kBack, F − 1 − drop)`. Have lint 2 and `deskSeat` apply the same clamp, and put a shallow console with an exec swivel behind it in the slice 5 test scenario. Fix the "largest drop 23" sentence. |
| M3 | M | 4.0 item 2, 7.1 slice 1 | **Grouped scenario objects lose their sprite-variant listeners.** The existing table-item branch sets depth and stores the sprite but never calls `registerSpriteVariantListeners`. Only the non-table branches do. If `onTable` joins a group through that branch, any opted-in object with `spriteVariants` stops swapping texture live. It already happens today: m02 `ehr_terminal_ward` (type `pc`, sprite `pc_ransomware`, variant back to `pc` on `ward_recovering`, no position) can match only the `pc` placeholders in `conditional_table_items` in `room_hospital_ward`. If it does, it is grouped and never swaps until a reload. That's from the code, not checked live: tell the m02 owner. | rooms.js:2296–2312 (no listener), 2316 and 2330 (the only two call sites); m02 scenario.json.erb (`ehr_terminal_ward`); room_hospital_ward.json `conditional_table_items` `pc.png` at x 464 and 554 | In slice 1, register variant listeners for every grouped scenario object, in all three join paths (placeholder, `onTable`, `tableItems`). When a swap changes the texture height, re-sort the group. Put an `onTable` item with `spriteVariants` in `test_table_surfaces`, and check the m02 ward terminal live. |
| m1 | m | 4.2 | The constants aren't body measurements. `s ≈ 13` is the `aw_chair_*` seat-to-foot drop (26 − 13). A south-facing figure's body reaches 19 px below the hip in all 108 atlases, and nothing measures `d ≈ 7`. The constants do hold across characters, because the hip is the anchor: with the runtime `sitShift`, the head top sits 36 ± 1 px above the hip facing north (106 of 108 atlases) and 37 ± 1 facing south. The north-facing body below the hip varies 13–19 px, but the chair back covers it. | `sit.py` over assets/characters; seating.js:41–71 | Call `kFront` and `kBack` constants tuned on panel 3 and on Tomasz, cite the head-top spread as the reason they carry over to other characters, and drop the `s ± d` derivation. |
| m2 | m | 2.1, 7.1, 8 | Slice numbering for the conference-table check doesn't agree: 2.1 says slice 6, 7.1 and section 8 say slice 5. Lint 2 (slice 4) trusts the north contact line before either. | plan lines 280–283, 732–734, 823 | Run the conference-table sitter check in slice 4 with the lint fixtures, or have lint 2 skip tables whose top is deeper than its legs until it's done. |
| m3 | m | 4.0, 5.3 | Lint 3 would break a scenario match. `m10_key_console1` sits in `conditional_items` in `room_m10_core`, and m10's `key_console` uses it through `"position": "as-type:m10_key_console"`. The item pool doesn't index `tables`, so "move it to `tables`" sends the console to a random position. | room_m10_core.json `conditional_items`; m10 scenario.json.erb:4280–4283; rooms.js `TiledItemPool` indexes `items`, `table_items`, `conditional_items`, `conditional_table_items` only | Lint 3: skip `conditional_*` layers, and any `items` object a scenario object claims by type, sprite or `as-type`. Such a surface needs another way into a group (a later slice), or none. |
| m4 | m | 6 (note item 3), 0.2 row 4 | Other depth lifts break the "group stays below F + 1" rule, and the note names only two. An item an NPC puts down takes `target.depth + 1`, a cosmetic copy `producer.depth + 1`, a tray slot `+ 0.5`. The lighting glow draws at `obj.depth + 0.01` / `+ 0.02`, the same value as the next group item's. The ownership table puts "screen glow" in `npc-office-visuals.js`, which has no glow: it is in `lighting.js`, a file that isn't office life. | npc-needs.js:2007, 2284–2285, 2331, 2370; lighting.js:1124, 1143 | Name all four in the note. Move the glow row to `lighting.js` and give glows `+ 0.005`, or the group a 0.02 step. |
| m5 | m | 7.1 slice 0 | The snapshot diff will be noisy, and it reports the wrong thing. Objects with no position and no Tiled match land at random (`Math.random`), and so do mode A tables without coordinates, so every run differs. A raw depth change is often invisible, while an order flip between overlapping sprites is what a player sees. | rooms.js:655–657, 2091–2094 | Seed `Math.random` in the snapshot run, or tag and skip randomly placed sprites. Report pairs whose rectangles overlap and whose depth order flipped, as well as moved x, y. |
| m6 | m | 5.1, 5.2 | The lints read data that lives in other languages. Lint 2 (Ruby) needs each chair's seat point and height, which exist only in `seating.js` (`STATIC_SEATS`, `FAMILIES`, neither exported). Lint 1 needs `WALL_MOUNTED_EXTRAS`, which is in `generate_rooms.py`. Copying them by hand will drift, and exporting from `seating.js` touches a file that office life shares. | seating.js:170–223; validate_scenario.rb has no seat data | Have the measurer write seat points (parsed from `seating.js`) and the wall-mounted set into `table_surfaces.json`, with a test that the copy matches its source. |
| m7 | m | 4.2, 5.2 | "In the facing direction within 24 px" is never defined, and 1.3's own example sits on the boundary. Tomasz's chair today has hip 143 and foot 160 against a north contact line of 144: whether the desk is "to the south" depends on whether you measure from the hip or the foot. | plan 1.3, 4.2, 5.2 | Define it: the chair's x-centre is within the table's x range, and the seat point lies within 24 px of the contact line on the side the chair faces from (the hip is north of the far edge for a south-facing chair). Add Tomasz's current chair as a lint fixture that must fire. |
| m8 | m | 7.0, 4.1 | A one-pixel mismatch. 4.1 puts the lowest opaque row at `frontY − 2` (135 on `desk1`), but 7.0's numbers put the bottom edge there: `pc1` at y 112 has its last opaque row at 134, and so does the lamp at Tiled y 135. Slice 3's snap then moves them 1 px unless the tolerance is at least 1. | pc1.png 28×23, bbox to row 22; bankers_lamp1.png 23×25 | State `tolerance ≥ 1`, or use 113 and Tiled y 136 in 7.0. |
| m9 | m | 7.0 | `room_edit.py` can `relayer` but has no operation to set a Tiled custom property. `room_lw_accounts.json` is in `json.dump` format, so `collides: false` has to go in through the Python API (`set_fields(oid, properties=[...])`), not the CLI. | room_edit.py:15–21, 239–240, 306–310 | Say so in 7.0, or add a `prop ID NAME VALUE` operation with a test. |
| m10 | m | 4.0 item 2 | Join timing. `onTable: "<id>"` can name a host that comes later in the scenario, and `onTable: true` can come before a mode A table it overlaps. Mode A groups are created during the scenario pass (rooms.js:2115–2116), so neither has a group when the item is made. | rooms.js:2042, 2115 | Collect `onTable` items and resolve them in the final pass (2407), after all tables and hosts exist. |
| m11 | m | 0.2 row 1, 7.3 | On a `collides: false` desk the player walks through the footprint, and the step-over effect treats a desk-top lamp or PC as a floor item (any type that isn't table, chair, desk, safe or workstation). Accounts already does this today, with the lamps on the floor. | player-effects.js:71–92 | Skip grouped items (`sprite.tableGroup` or similar) in the step-over check. |
| m12 | m | 0.2 rows 3 and 6 | Two small inaccuracies in the order table. A desk with back-wall elevation (rooms.js:2606–2610) draws over walkers whose feet are a few px south of `F`, so "feet south of F + 0.5 draws over the items" doesn't hold there. Feet in (F, F + 0.5) interleave with the items by index (over items 1 … 100·(feet − F)), not "between the desk and its items". Neither is visible in practice. | player.js:958–966, npc-sprites.js:628–640 | Reword the two cells. |

## The questions asked

1. **R1 fixes.** All landed. M4 has a gap in its rule (M2), and M1 has two edge cases (m3, m9).
2. **Depth order.** The step stays below F + 1 for up to 49 items. No sitter the rule places can
   sort between desk and items: front chair feet are at least F + 13 (smallest north-facing drop:
   `aw_chair_north` and `hospital_chair_north`, 13), and back chair feet are at most F − 3 on
   `desk1`. That bound fails on shallow tops (M2). Walkers sort by fractional feet: at F ± 1 they
   sort correctly, and in (F, F + 0.5) they interleave with the items, which no one will notice
   (m12). A monitor taller than the top is drawn over a walker behind the desk, which is correct.
   Wall items keep their elevation; under a desk they draw beneath it, which is also correct.
   Stacking needs late resolution (m10). Other depth lifts break the cap (m4).
3. **`collides: false`.** Nothing that matters needs a desk body. Sight occlusion ignores desks
   (pattern at npc-sight-occlusion.js:39). Interaction reach checks walls only
   (interaction-walls.js header). The tap menu lists interactables, and desks aren't. The unstick
   and table-collider code (npc-behavior.js:2366–2412, npc-sprites.js:969) and the pathfinding
   grid (npc-pathfinding.js:269–276) need a body, so a bodiless desk drops out. One side effect
   the plan doesn't mention: `hasWorldPhysicsLineOfSight` treats table bodies as blockers
   (npc-pathfinding.js:743–785), so a colliding desk blocks a guard's line of sight to the player
   today, and a `collides: false` one won't. For accounts nothing changes, because those desks
   have no body now. The player walking through is today's accounts behaviour, so it isn't a
   regression. Other rooms get it only by opting in, or by following lint 3, which keeps today's
   bodiless items-layer behaviour.
4. **Sitter numbers.** The values are right for the accounts chairs and Tomasz. They carry over to
   other characters to within ±1 px at the head (m1). On shallow tops they fail (M2).
5. **Quick-fix order.** Slice 1 isn't as small as the plan says, and it isn't safe as written:
   the sort change touches 36 rooms, and no source for base rows is named (M1). It also has to
   avoid the variant-listener gap (M3). With those fixed, slice 1 changes nothing outside opted-in
   groups, and slice 2 is data only. The slice 0 snapshot catches depth changes, but needs a seed
   and an overlap-order report to be usable (m5).
6. **Ownership.** No office-life file is touched in slices 1–5, unless lint 2's seat data is
   exported from `seating.js` (m6). The hand-off note leaves out three depth lifts and
   misattributes the glow (m4). The accounts scenario edits fall in a file the lab expansion is
   still committing to (9e4807763), so Q7's "ask the lab's owner" is the right default.
7. **New and wrong.** M1 (the sort switch was added in this revision), M2 ("always" for back
   sitters, and the 23 px figure), m1 (the derivation), m3 (lint 3), m4 (glow file).

## Verdict

**Ready with conditions.** The accounts quick fix (slice 1, then slice 2) can go ahead once
slice 1 limits the new sort to opted-in groups and names its base-row source (M1), and
registers sprite-variant listeners for grouped items (M3). Fix M2 before lint 2 or the swivel
slice prints any back-side numbers. The minors can be folded in as the slices land.

Counts: **B 0, M 3, m 12.**
