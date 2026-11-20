# Table surfaces plan: adversarial review, round 3 (confirmation)

Plan: `docs/achitechture/TABLE_SURFACE_PLAN.md` at f8dc76236. Reviewer: fresh, read-only, Opus.
Date 2026-11-06. No live run. Every claim below was checked against the code, the room JSON,
the sprite PNGs and the rendered scenario JSON in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/table-surface/rendered/`.

## R2 findings, re-checked

| R2 | Closed? | What I checked |
|---|---|---|
| M1 | Yes | Opted in = `collides: false` table, or an `onTable` / `tableItems` item (4.0). Nothing can opt in by accident today: no room JSON, tileset, `scripts/room_gen` file or engine file uses a `collides` property, and rooms.js reads no Tiled object `properties` at all, so the flag only exists once slice 1 adds the read. `tableItems` is in `test_table_items` only. `lab_tesseract_trials` once used an empty `tableItems` to get a colliding table (ROOM_DRESSING.md:14) and has since dropped it; an empty list adds no item, so it wouldn't opt in anyway. The sort at rooms.js:2407–2420 is the one place to split, and it is per group, so "byte for byte" for the rest holds |
| M2 | Yes | Exec swivel: `chair-exec-rotate1.png` 38×64, south seat [19, 37] (seating.js:174), drop 27. Clamp `hip ≤ F − 1 − drop` gives foot = hip + drop ≤ F − 1. The overshoot `drop − 19 − depth` is right (rule hip F − depth − 20 against clamp F − 1 − drop): 4 px on `hce_console_table1` (depth 4). Accounts numbers re-derived: front hip 160 − 6 = 154, `aw_chair_north` top 141 = 4.40625 tiles, foot 167; Tomasz hip 144 − 20 = 124, top 109 = 3.40625, foot 141, and the clamp (142) doesn't bind. Front overlays (`chair.depth + 0.02`, seating.js:715) stay under F + 0.5 for a back sitter. One gap on colliding desks (m4) |
| M3 | Yes, one more case (m2) | The placeholder branch (rooms.js:2296–2312) and both `tableItems` modes (2155–2223) store the sprite and never call `registerSpriteVariantListeners`; the non-table branches do (2316, 2330). The listener only calls `setTexture` (rooms.js:707–720) and leaves depth alone, so a grouped item keeps its group depth after a swap. m02: `ehr_terminal_ward` is the ward's first object; `pc_ransomware` matches nothing, then type `pc` finds no `pc` in `items`, `table_items` or `conditional_items` and takes the `conditional_table_items` `pc` at x 554 (search order rooms.js:262–267). Its rectangle overlaps `reception_table1` (440–614, 120–167), so it is grouped and never swaps. The fix is engine-only: no m02 file changes |
| m1–m4, m6, m7, m9–m12 | Yes | m4: glow offsets are at lighting.js:1124 and 1143 as cited. m9: the JSON-format `set_fields` is a dict update (room_edit.py:239–240), so a `properties` list goes in as written |
| m5 | Partly | Seed and overlap-flip report are in. How slice 0 reaches locked rooms, and what it can't see, are not (M1 below) |
| m8 | Yes, but see m5 | Tolerance stated; the reason given for it is off |

## Findings

| ID | Sev | Section | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| M1 | M | 7.1 slice 0, 7.2, 4.3 | **The slice 0 gate can't be built as written, and it can't see slice 1's global changes.** (a) "Loads every scenario's rooms through `window.__test`": `loadRoom` fetches each room from the server, which returns 403 for any room that isn't the start room or in `unlockedRooms`. A game also needs a `Mission` row (161 scenarios; 64 name `room_office`). (b) The snapshot records sprite position and depth at load. Three slice 1 changes reach every mission and leave no trace there: the glow offsets (glow images aren't room objects), the step-over skip for grouped items, and variant listeners on all groups if Q10 is yes. The gate "no change outside `test_table_surfaces` and `test_table_items`" would pass while those three ship everywhere. | rooms.js:779–866 (`loadRoom` → `/games/:id/room/:room`); games_controller.rb:456–466; tools/playtest/new-game.rb:98–100; the existing route is `tools/playtest/lighting-tour.sh` (new-game.rb, then `unlock-all-rooms.rb`, then `loadRoom` per room) | Name the mechanism: per scenario, `new-game.rb` + `unlock-all-rooms.rb` + `window.loadRoom` for every room, as lighting-tour.sh does (throwaway game rows, no `db:` tasks), or a client-only page that feeds `createRoom` from the rendered JSON. Have the tool print which scenarios and rooms it loaded, and fail when a `room_office` scenario or any room with a `tables` layer is missing. Leave NPC and player sprites out of the diff. List the three global changes in 4.3 as deliberate, and give each its own unit test: a glow under the next group item, the step-over check skipping a grouped item, a listener firing for a placeholder-grouped object |
| m1 | m | 4.0, 4.3, 6 | "Opt-in, so nothing moves until a mission asks for it" is true for depth order but not for behaviour. The step-over skip uses `sprite.tableGroup`, which every grouped item gets, so a player walking into the top three quarters of any colliding desk (body is the bottom quarter) stops hopping over its PC or lamp in every mission. That is probably a fix, but it is a global one. | player-effects.js:71–98 (any type without table/chair/desk/safe/workstation hops); rooms.js:2625–2645 (desk body) | Decide on purpose: either skip only items in opted-in groups in slice 1, or keep the global skip and say so in 4.3 next to item 5 and the glow |
| m2 | m | 4.0 item 5, 7.1 1a, 7.4 Q10 | m02 isn't the only grouped variant object. m10's `projection_desk` (`as-type:m10_field_screen_dark`, variant to `m10_field_screen_curve1`) matches a `conditional_table_items` slot in `room_m10_forward`, which has 7 tables, so it is grouped with no listener. Its condition is the imported `m07_debrief_stance`, fixed before the room loads, so players likely see no change, but Q10's "the m02 owner is told" should cover m10 too. And if Q10 is no, "listeners in opted-in groups only" can't be decided in the placeholder branch, because a group's opt-in status is only known after the final-pass `onTable` joins | m10 scenario.json.erb:2603–2613; room_m10_forward `conditional_table_items`; scan of all five scenarios with `spriteVariants`: the other matches (m07 ×2, m08 ×3, sis02, m10 `gate_hut`) come from `items` or `conditional_items` and already get listeners | Add m10 `projection_desk` to 1a and Q10. If Q10 is no, register listeners in the final pass, after opt-in is known |
| m3 | m | 4.0 item 2 | No rule for an object with `onTable` that also matches a `table_items` or `conditional_table_items` placeholder. The placeholder branch groups it with the nearest table straight away (overlapping or not), and the final-pass `onTable` join would add it again, perhaps to another group, so it is counted twice and takes the later depth. | rooms.js:2256–2312 (match first, then grouping by `findClosestTable`, which falls back to nearest by centre, 2836–2850) | `onTable` wins: when it is set, the placeholder branch takes the slot's position only and leaves grouping to the final pass. Add such an object to `test_table_surfaces` |
| m4 | m | 4.2 (colliding desks), 6 note item 1 | The physics clamp covers front sitters only. On a colliding desk a back sitter's swivel body overlaps the desk body (the bottom quarter, F − H/4 … F) whenever foot > F − H/4. The exec swivel on `desk1` under the plain rule has foot F − 9 against a body top of F − 9.75. Under the M2 clamp, on a shallow console, foot is F − 1, so the chair body lies fully inside the desk body. Arcade separates them once the chair is movable again (`unseatNPC`, `tuckIn`), as R1 M5 described for the front side. | object-physics.js:43–50 (chairs collide with every immovable body); rooms.js:2635–2644; exec body 64/3 ≈ 21 px | For a colliding desk, back side: `foot ≤ F − H/4 − 1` as well, so `hip ≤ min(northContact − kBack, F − 1 − drop, F − H/4 − 1 − drop)`. Put it in `deskSeat`, lint 2 and the office-life note. Slice 6 only, so it doesn't hold up slices 0–2 |
| m5 | m | 0.1, 4.1, 5 lint 1 | The tolerance is sound but the reason given is wrong, and it doesn't line up with lint 1. Base row 134 is inside the band 121–136 without any tolerance, so "don't move 1 px" needs nothing more than "inside the band is kept". The tolerance only matters for a base on row 137 (the lip's first row) or 120. Lint 1 fires only past 2 px, so an item 2 px outside is moved by the snap (to `frontY − 2`, a 3 px jump) with no warning. | band = `y0 + top … y0 + front − 1` (2.1); snap 4.1; lint 1 threshold 5.1 | Keep 1 px. Reword 0.1 and 4.1, then make lint 1 fire whenever the snap would move the item (outside the band by more than the tolerance) |
| m6 | m | 4.0 item 3, 2.2 | `baseRowOf` leaves four things open. (1) The threshold: `sitShift` counts alpha > 0, and the Python `baseRows` must use the same rule. (2) The cache key: key and frame, not key alone, or a frame of a sheet gets the base sheet's row. (3) "A test checks the two agree": node tests run plain `node` with no Phaser or PNG decoder, so the check has to be Python (`baseRows` against the PNGs, alpha > 0) plus a JS unit test of `baseRowOf` with a fake texture manager. (4) A swap to a texture not yet loaded happens in `load.once('complete')`, so the re-measure and re-sort must run there too. | seating.js:53–75; rooms.js:713–716; `bin/test-js` runs `node` | State all four in 4.0 item 3 and in slice 1's tests |
| m7 | m | 4.2 | "Chairs with a drop of 19 or less never fail" leaves out the south-facing chairs at 21–23: `white32` swivels 21, `aw_studio_chair_s1` 21, `hce_bench1` 21, `leather_chair1` 22, `exec_chair_black1` 23. All but the last fail only on tops of 2–3 rows or less, and no measured top is that shallow. The clamp is general, so nothing breaks; the sentence is incomplete. | seating.js:170–223 seat points; PNG heights 32, 32, 31, 52, 56 | List them, or say "the clamp covers every chair; only the exec swivel and `exec_chair_black1` bind on a measured top" |

## The questions asked

**1. R2 fixes.** All three majors landed. Under M1 nothing opts in by accident: `collides`
exists nowhere today, and a `tableItems` list has to hold an item before its group counts.
M2's maths checks out to the pixel on every case in the plan. On colliding desks the clamp
needs a second bound (m4), which is slice 6 work. For M3, all three join paths lack the
listener as the plan says, and the m02 fix is engine-only. The listener changes the
texture, not the depth, so no m02 file and no group order changes. m10 has a second
grouped variant object the plan doesn't name (m2).

**2. The three departures.**
- *Load-time base rows for good, JSON `baseRows` for the tools.* Sound. One runtime
  source, right for aliased keys and swaps. `sitShift` already does the same scan on
  80×80 frames for every seated atlas, and a bottom-up scan of a handful of item textures
  per opted-in room costs less. What's missing is the definition shared by both sides
  (m6).
- *Lower glow offsets rather than a wider group step.* Sound, and better than the
  alternative: a 0.02 step would halve the 49-item cap. The glow depth is set every
  redraw from `obj.depth` (lighting.js:1124), so it follows a re-sort. It is safe for the
  workstation-indicator owner. Indicators are `above: true` records
  (`INDICATOR_LOCKED`/`OPEN`, lighting.js:106–107), so they take `LIGHT_DEPTH + 1` and
  never the `obj.depth + …` branch. No lighting test asserts a glow depth (grep over
  `test/js/lighting-*.test.mjs`). `npc-office-visuals.js` sets held-item depths from the
  NPC, not from the glow. The only overlap is textual: the edit is in the statement
  64d70ec0f last touched, so commit in turn with explicit paths. lighting.js has no
  uncommitted edits as of this review. The change is global, though (M1, m1).
- *1 px snap tolerance.* Harmless and fine to keep. The reason given is off, and it
  needs lining up with lint 1 (m5).

**3. Slice 1 as a first build.** Small and testable, and for depth order it is opt-in:
non-opted groups keep the `sprite.y` sort untouched, and `room_office` scenarios add no
`onTable` or `collides`. It is not fully opt-in in behaviour. The glow offset and the
step-over skip are global, and so are listeners if Q10 is yes. Those are minor and
arguably fixes, but the plan says "nothing moves" and the gate as written can't see them
(M1, m1). The slice 0 gate is the right idea: seeded, with an overlap-flip report and
compared after each slice. It needs the locked-room mechanism and a coverage check before
it can catch a regression in all 64 scenarios that name `room_office`, rather than in the
handful whose rooms happen to open (M1).

**4. What would stop a builder tomorrow.** Only M1: how slice 0 loads locked rooms and
proves its coverage. Two decisions are needed before merging rather than before starting:
Q10 (listeners for every group or opted-in only) before slice 1 merges, and Q7 (who
commits the lab scenario) before slice 2's scenario edit lands. Slice 2's data checks out:
the five `desk1` (ids 44–48), three lamps (62–64) and ledger (65) are where 7.0 says, the
`tables` and `table_items` layers are empty today, and no `open_plan` scenario object
claims a desk, lamp or ledger.

## Verdict

**Ready with conditions.** Slices 0–2 can start. Conditions: settle M1 in slice 0's brief
(the locked-room route, the coverage check, and unit tests for the three global changes);
get the user's Q10 answer before slice 1 merges; and settle Q7 before slice 2's scenario
commit. Fold in m1–m3, m5 and m6 during slice 1. m4 goes into the slice 6 office-life
note, and m7 is wording.

Counts: **B 0, M 1, m 7.**
