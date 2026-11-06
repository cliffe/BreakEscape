# Seat box (option G): build plan

Status: revised after review round 1 (`SEAT_BOX_PLAN_REVIEW_R1.md`, a4faba799), then updated
with the user's decisions (Q0 the 18 × 8 body, Q10 option E, the seating-scale dependency),
then revised after review round 2 (`SEAT_BOX_PLAN_REVIEW_R2.md`, 1c51fabfb), then revised
after review round 3 (`SEAT_BOX_PLAN_REVIEW_R3.md`, c938d2fdb), 2026-11-06. No room or
scenario file has changed for it.

**Revised after R3.** Every R3 finding is folded in, checked against the code at c938d2fdb; the
user's decisions are unchanged. R3's verdict was "ready with conditions"; these are the
conditions. Slices 2 and 4 were already being built when this revision was made: two R3 minors
add to slice 2 (m6, a scaled desk falls back; m7, the reopen check) and nothing changes slice 4.

| R3 | What changed | Where |
|---|---|---|
| M1 the window breaks the carve helpers | **No window.** The local stand grid is built full size with `buildWorldGrid({ exclude })`, as `rebuildWorldGrid` builds after every room load; the flood is bounded by its cell count, and a stand-up is rare. The carves run on the full grid exactly as today, so nothing clamps to a window edge. Tests: a side-door corridor and an N/S door beside the chair, and a chair at the world grid's edge, each equal to the world grid's cells but for the excluded bodies. `standUp` can no longer be left half done: a throw while choosing the spot is caught, logged and falls back to the approach point, so the player is never invisible with `isSeated` true | 1.3, slice 0, slice 1, 8.1 |
| M2 the chair's body is stale on `jumpOff` | The box check's `extra` takes **rectangles**, and `standSpot` builds the chair's from its sprite position plus the body's offset and size (as `bodyFeet` does), never from `body.left/top`, which is stale while the body is disabled (`jumpOff` chooses the spot before `standUp` re-enables and places it, seating.js:689, 534–544). Unit case: a disabled chair whose body sits away from its sprite | 1.3, slice 1 |
| M3 the player's home facing | Player: the facing at stand time (`state.facing`), as proved in game 876. NPC: `st.homeFacing`. Nothing records a sit-time facing for the player | 1.3, slice 1 |
| M4 an NPC's approach point is its chair | For an NPC seated at load, the recorded approach is its spawn, which authors put on the chair (Tomasz: both at (11, 4)). The NPC's last steps are now: the approach only if a walking box there misses the chair's rectangle; then the nearest walkable cell a no-box-check flood of the local grid reaches (it can't cross a desk); then stay seated, warn once, retry next tick. The spawn fallback goes. Unit case with the approach equal to the castor. 8.2 reworded: a forced player stand avoids desks except when boxed in, where the player goes back to where they sat down | 1.3, slice 1, 8.2 |
| M5 no cross-mission check of the landing rule | A **scripted stand audit** (`tools/playtest/stand-audit.mjs`, slice 0): every placed swivel chair in every mission row, sit, Space–Space, then a forced `standUp()`, logging the branch, the landing point and whether it is in a body or across a desk. Slice 0 takes the baseline on today's code; slice 1 runs it under the legacy switch and the new order on the same rows. Slice 1 isn't done until it passes (no landing in a body or across a desk) and the user has seen the list of chairs where a voluntary stand now refuses | slice 0, slice 1, 8.1 |
| M6 two slices short of the three proofs | Slice 0: a live grid hash on two game rows (one with an opened side door, after `unlock-all-rooms.rb`), before and after the split commit; equal hashes pass. Slice 3: two `pc` objects in `test_desk_seating` that match `table_items` placeholders, one positioned off every desk and one on a desk, with both depths read live | slice 0, slice 3, 8.1 |
| m1 the split test compares one implementation | Today's grid for the fixture world is written into the test as a golden array **before** the refactor. `exclude` is matched by `body.gameObject` | slice 0 |
| m2 the agreed order is stale | Rewritten to the office-life plan at c1111c266 (order 21, 16, 18a, 17, 18b, 19, 20): slice 21 lands first and hand-off items 2 and 6 rebase on it. The note adds that slice 7 turns the lab's staff chairs into Tiled swivels, so after slice 7 idle swivel acts on Chris, Melanie and Sofia, and slice 21's lab regression should expect it | 6 |
| m3 what `__seatBox = false` means | Today's stand-up code is kept intact behind `window.__seatBox === false` (the old compass loop and its unchecked fallback, and a `jumpOff` that never refuses), for the stand audit's comparison only. Unset means the new order. A unit test asserts nothing in the engine sets it | slice 0, slice 1 |
| m4 gate doors make the record timing-dependent | The walk record and the grid hash stub `npcBehaviorManager.update` in the page before waking the loop, so no NPC walks, sits or opens a gate while the bodies settle. The tool logs every gated door's state and fails its coverage line if one is open | slice 0 |
| m5 (d) and (h) keys | (d) takes each swivel chair's position before the loop wakes, recorded separately. (h) keys walls by room and rectangle | slice 0 |
| m6 scaled desks | `deskBoxOf` returns null (the fallback) for scale ≠ 1, as for rotation, until a scaled desk exists. **Slice 2 change** | 2.4, slice 2, 6a |
| m7 reopen check and commit order | The reopen check is added to slices 1–3 (**slice 2 change**). The order is the standing shared-tree rule: fast node tests for the touched modules, commit own files, then the full node and Rails suites and the live checks, with fixes in a follow-up commit before any later slice builds on it. AGENTS.md:227 says to run the suites before each engine commit; that conflict is settled this way and stated in section 3 | 3, 8.1 |
| m8 `sweepBlock` has no caller | Kept in slice 1, unit-tested but unused until slice 6, so the hand-off note's list of what slice 1 added stays true. Its live proof is slice 6's | slice 1 |
| m9 check (f) from the grid | (f) is computed in (h)'s geometry pass: corridors 8 ≤ gap < 10 px that border a pocket from (g) | slice 0 |

**Revised after R2.** Every R2 finding is folded in; the user's decisions are unchanged.

| R2 | What changed | Where |
|---|---|---|
| M1 flood fails for seated NPCs | Compass snapping and the flood now run over a **local stand grid**: a window of 8 cells round the chair (full size after R3 M1), built from the live bodies with the world grid's padding, leaving out the chair and its sitter. Baked or stale cells from a sitter can't trap a stand-up. `ignore` is a list (`[chair, sitter]`). Every seated NPC records the point it sat down from as its approach point, so the forced order always ends somewhere; behaviour on null is written down. New unit case (chair cells blocked in the fake grid) and live cases in `test_seating` (seated at load, and after a door opens) | 1.3, slice 1, 8.1, 8.2 |
| M2 walk audit blind spots | The walk record's grid is built by the tool with the engine's own builder, without NPC bodies or swivel chairs, after the loop is awake and the deferred bodies have settled. New check (g): walkable cells reachable from the doors before and not after (pockets). New check (h): gap and corridor geometry against the 18 × 10 walking box, from the real bodies, which sees 18–24 px gaps the grid can't | slice 0, 4.4, 8.1 |
| m1 12 × 8 leftovers | Check (f) keeps only the 8–10 px height clause. Slice 1 names what goes: the `{ w, h }` toggle in `seatedBlock` and the `keep` branch in `standUp` | slice 0, slice 1 |
| m2 experiments doc | Slice 1's commit adds a one-line "superseded by plan Q0" pointer to two sections of `SEAT_BOX_EXPERIMENTS.md` (not done in this plan-only revision) | header, slice 1 |
| m3 map property format | Read the Tiled array form and a hand-written object; tests for array, object, absent. `set-map-prop` writes the `.json` and any `.tmj` twin, through `Doc` and `PyDoc`; the validator reads the same array | 2.1, slice 2 |
| m4 voluntary approach | A voluntary stand takes the approach point only within 32 px of the castor and line clear | 1.3 |
| m5 flood spots on the chair | The box check counts the chair's own body at every step; only the line check ignores it | 1.3, slice 1 |
| m6 NPC facing | NPCs stand (and tuck) by `homeFacing`, not the facing they turned to the player with | 1.3, slice 1, 6 item 4 |
| m7 office-life slices 16–21 | The hand-off note names them and sets an agreed order for the shared `seating.js` facing code (seat box items 2 and 6 first, slice 21 after; reversed after R3 m2 to match the office-life plan's order). No answer from that session by the time slices 2–4 land: ask the user | 6 |
| m8 numbers that slice 6a may move | Hand-off item 8 and slice 7's hip line take their numbers from the scale audit; the castor lines stay | 1.1, 6 item 8, 7 |

**`SEAT_BOX_EXPERIMENTS.md` is partly superseded.** Its "Recommendation" (12 × 8 with `keep`)
and the 12 × 8 figures in "What the NPC side needs" predate Q0. Read them as history: the block
is the chair's own 18 × 8 body, and the stops are unchanged. The only engine change is to the default-off
prototype in `seating.js` (619d58928, the stand-up order in 1.3, inert unless
`window.__seatBox` is set). Main input: `SEAT_BOX_EXPERIMENTS.md` (commit 9df5647b9) and its scratch outputs in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/seat-box/`
(`sweep.json`, `contact_best.png`, `contact_sizes.png`, `part2_lab_desks.patch`, and the two
audit scripts this plan used, `tables_usage.py` and `box_audit.py`).

The user's design, in short:

- While someone sits on a swivel chair, their collision box and the chair's shrink to a small
  block at the centre of the chair's castor base. The desk keeps a box of its own. A chair rolls
  in until the block meets the desk box and physics stops it there, so a chair is never drawn
  behind or inside a desk. (After R1, settled by the user as Q0: for the office chairs the
  block is the chair's own 18 × 8 body, which already sits on the castor base and gives the
  same front and back stops as a smaller block. Nothing shrinks.)
- Desks stay ordinary table groups (Tiled `tables` and `table_items`). Monitors, lamps and other
  desk items go on the table-items layer and draw with their desk: "Monitors should be on a
  table items layer."
- The accounts-floor special case is undone. That case put the desks on the non-colliding
  `items` layer, held the PCs up with `elevation` and used static chairs with no body.

**What this replaces in `TABLE_SURFACE_PLAN.md`.** The `collides: false` table flag and the
`onTable` field are dropped (the user replaced them with G). These parts of that plan still
apply and are reused here:

- the per-texture JSON approach (2.3), `measure_table_surfaces.py` (3.1) and its measured
  results (3.2);
- the drawing order in a table group (0.2);
- the slice 0 room snapshot (`tools/playtest/snapshot-games.sh`, `room-snapshot.mjs`,
  `room-snapshot-diff.mjs`, commit a7640b314), which already loads every room through
  `unlock-all-rooms.rb` as R3 M1 asked.

The item snap (4.1), the lints (5) and the swivel-sitter `deskSeat` rule (4.2) are not part of
this plan. Section 9 says which of them G makes unnecessary.

Coordinates are room pixels, y down. `F` is a desk's floor line (the sprite's bottom edge). A
"block" is the seated collision box. Tiles are 32 px; the pathfinding grid is 8 px
(`PATHFINDING_STEP`, utils/constants.js:37).

## Changes after review R1

Evidence gathered for this revision, all on the keyless :3001 server, headless, one browser at
a time, each stopped by PID. Test games were made with the scratch `swap_game.rb` (a
`test_seating` game row whose `scenario_data` is swapped; no new Mission row, no `db:` task).

- Games **874** (B1 reproduction, prototype as committed in 9df5647b9), **875** (first
  version of the corrected order) and **876** (the order as committed in 619d58928). Session logs: scratchpad `seat-box/r1-874-session.jsonl`,
  `r1-875-session.jsonl`, `r1-876-session.jsonl`; results `r1_prove2.out`, `r1_shots.out`.
- The comparison image for M1:
  `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/seat-box/compare_12x8_vs_18x8.png`
  (front, behind and the desk's east end; 12 × 8 against 18 × 8, both on footprint boxes;
  native captures at 3×, and the desk end at 12× with a per-pixel ruler).

| Finding | Outcome | Where |
|---|---|---|
| B1 landing from behind `desk1` | **Fixed, cause found.** The committed prototype does not reproduce it: game 874, `12x8k` behind `desk1` with a fresh 18 × 8 chair body, stood at [100, 244] (walk-away 53), and so did `18x8` and `8x6k`. The most likely cause (inferred, since the earlier code wasn't saved): the verify page was running an earlier build of the check that tested only the walking box at the landing cell, not the line to it. Such a check accepts the south cell [84, 292] across the desk whenever it is under 12 px from the target (chair body 18 × 8, reach 23; or 8 × 6 with the castor at y 261), and rejects it when it isn't (8 × 6 body, reach 18). That explains all five verify rows, and the committed code has the line samples, so the doc's claim holds for the committed code but was never re-run on it until now. The unchecked fallback (`findNearestWalkableWorldCell(cx, cy + reach, 3)`, seating.js:582 at a4faba799) remains a real hazard whenever every candidate fails, so it goes. | 1.1, 1.3, slice 1 |
| B2 `db:seed` | **Fixed.** Slice 0 promotes `swap_game.rb` to `tools/playtest/swap-scenario-game.rb`. No Mission row, no seed. | slice 0 |
| M1 18 × 8 gives the same stops | **Settled by the user (Q0): the chair's own 18 × 8 body.** The 12 × 8 block, `keep` and Q2 are gone. | 1.1, Q0 |
| M2 narrow block rolls through walker-only gaps | **Fixed by rule:** a block is never narrower than the walking box (18 px). The office chairs' 18 × 8 body meets it with no change. Height (8 against 10) is covered by a walk-audit check. | 1.1, slice 1, 5 |
| M3 opt-in on the map | **Fixed.** A Tiled map property, `deskBoxes: footprint`, read in `createRoom` where the table bodies are made. Opt-in for good; generators and `room_edit.py` set it for new and rebuilt rooms. The global flip (old slice 8) is dropped. Only the landing rule is global. | 2.1, slice 2, slice 8, 4.5 |
| M4 Q2 beyond the tests | **Gone with Q0.** No block at load, because no chair's body changes. | Q0 |
| M5 two fallback orders | **Fixed.** One written order (1.3), proved live in game 876 (875 ran the earlier candidate order) and by a unit test of its branches. | 1.3 |
| M6 hand-off misses the fetch path | **Fixed.** Hand-off item for `advanceFetch` → `endFetch` → `seatNPC`, the `unseatNPC` note, an NPC stand test, and a fallback if the office-life session isn't free. | 6, slice 1 |
| M7 section 7 stale | **Rewritten** against the post-step-9 lab. Step 9's proof is now logged (game 873, 930dbc221). Left-behind items get a drawing decision. | 7 |
| m1 `smalldesk1` foot | **Fixed:** 27 (`measured`). | 1.1, 2.1, Q5 |
| m2 `room_edit` range | **Fixed:** `max(tilecount, max id + 1)`; insert in firstgid order. | slice 4 |
| m3 commit before tests | **Fixed.** | 3 |
| m4 no hand-off fallback | **Fixed** (with M6). | 6 |
| m5 walk audit scope | **Fixed:** opted-in maps plus a sample. | slice 0, 4.4 |
| m6 validator key | **Fixed:** keys on the map's property. | 4.4 |

### The user's decisions after R1

- **Q0: the 18 × 8 body.** The office chairs keep their own body while seated; desks get
  footprint boxes. The 12 × 8 shrink, the empty-chair `keep` and Q2 (block at load) are
  removed, with the slices and the hand-off note that depended on them.
- **Q10: option E** ("whichever is simplest to implement"). The left-behind items stay ordinary
  items, lifted onto their owners' desk tops with `elevation`. The step 9 owner, which is this
  session, agrees.
- **Seeding.** AGENTS.md now says standalone Break Escape `db:seed` is fine and, in Hacktivity,
  `rails break_escape:seed` (3c8956c3d). This plan still runs test scenarios by swapping one
  game's stored scenario (slice 0), so it needs no seeding.
- **Slice 6 (the NPC half).** If the office-life session isn't free, this session builds it once
  that session agrees (section 6).
- **Seating scale.** "Now that we have people sitting some of the scales need adjusting": the PC
  and lamp look too low, the desk may be too tall, and the hospital static chair's legs are too
  short. A separate scale audit (`docs/achitechture/SEATED_SCALE_AUDIT.md`, in progress) owns
  that. Slice 7's desk layout waits for its placement and scale fixes (new slice 6a), and item
  placement on the desk tops follows the audit.

## 1. The design and its numbers

### 1.1 Numbers, each traced to its evidence

| What | Value | Evidence |
|---|---|---|
| Seated block (Q0, the user's choice) | **the chair's own body, 18 × 8**, unchanged; the driver takes it while seated, as `seatedBlock` already does with no toggle (seating.js:431–435) | `verify.json` rows `18x8` and game 876: castor F + 4 in front; behind `desk1` castor 260, `smalldesk1` 248; at the desk's end, castor at end + 9. `chairInDeskBox` false in every case, so the empty chair is never left sunk. The sweep's smaller blocks (216 rolls, `sweep.json`) gave the same front and back stops; the only gain was 3 px closer at the ends, which the user turned down |
| Block width rule (M2) | a block is never narrower than the walking box (18 px); its height is 8 (the walker is 10) | A narrower block rolls through gaps of 12–18 px that no walker fits, and the player then stands up on the far side. The office chairs meet the rule as they are; it binds the families measured in section 5. Gaps of 8–10 px high (passable seated, not walking) are a walk-audit check (4.4) |
| Castor base | the centre of the chair's existing body for the office chairs: `{w 18, h 8, x 11, y 31}` in the 40 × 40 rotation frame | `STATIC_SWIVEL_PROPS` for `chair-darkgray-1`, `chair-grey-1` and `chair-grey-4` (rooms.js:770–775); the prototype centres on it (`sitOn`, seating.js:461–466). The other families are unmeasured (section 5) |
| Desk box | **the floor footprint**: from `F − foot` to `F`, the desk's full opaque width, no side inset | From behind, the bottom-quarter box let the castor stop 2–4 px inside `desk1`'s footprint and 12–16 px inside `smalldesk1`'s (rolled under the top). The footprint box stops it 2–6 px behind the back edge (EXPERIMENTS table "From behind"). At the sides, the 10 px inset let the castor stop 1–8 px inside. Inset 0 stops it at the end + w/2 (9 px clear) |
| `foot` for the tested desks | `desk1` 16, `zds_desk1` 16, `smalldesk1` **27** (sprite rows = floor px) | `desk1`/`zds_desk1` from the experiment's `TOP` table (`exp.js`:10). `smalldesk1`: rows 0–26 are the top (row 26 the highlight lip), row 27 the first dark front-face row, so the plan's own definition gives 27 (R1 m1). The sweep used 28; the 1 px is inside slice 2's ±1 px tolerance. The table-surface measurer gives `smalldesk1` `top 2, front 26` because it leaves out the outline and highlight rows, so `foot` is a separate field, not `front − top` (2.2) |
| Front contact | castor at `F + h/2` (F + 4); hip `F − 11` with today's seated pose; chair depth F + 8.5 over the desk group's F + 0.5 | EXPERIMENTS "From the front"; `best_front_*.png`; game 876. The castor line comes from the boxes alone. The hip comes from the seated pose (`sitShift`/`sitHip`, seating.js:53–90), which the scale audit may change (slice 6a), so slice 7 takes the hip figure from the audit's result (R2 m8) |
| Back contact | castor `F − foot − 6 … F − foot − 2`; hip 5 px below `desk1`'s top edge; the desk group draws over the sitter's legs | EXPERIMENTS "From behind"; `best_behind_*.png`; game 876 |
| Side contact | castor at the end + 9, with 1 column of the castor star under the end leg (x 123–125 for `desk1` at x 48). Chair depth F − 0.5, so the leg draws over it | `compare_12x8_vs_18x8.png`, detail rows (the 18 × 8 column); EXPERIMENTS "From the sides" |
| Landing rule on standing | the order in 1.3: a spot's 18 × 10 walking box must overlap no immovable body nor the chair just left, and the line from the castor base to it must cross no immovable body (sampled at ¼, ½, ¾ with a 2 × 2 probe); then a flood fill over a local grid that leaves out the chair and its sitter; never an unchecked cell picked by direction | Without it the player landed on the desk top or behind it in 100% of front and side cases, and across the desk from behind. With the order in 1.3, games 875 and 876: all 9 cases, for the 18 × 8 body and for a 12 × 8 block, landed on the near side and walked 49–58 px away, and a forced `standUp()` from behind `desk1` landed at [100, 244], north of the back edge (264). B1 explains the earlier "across the desk" rows |
| Walker box | unchanged, 18 × 10 | Two `desk1`s 24 px apart: the box gap is 24 px with no inset, and the walker crossed it with every desk box |
| Static chairs | unchanged (no body) | `hospital_chair_north` in front of `desk1`: sits correctly, and hops off to the approach spot clear of the desk box (EXPERIMENTS "Static chairs") |

### 1.2 The drawing order with G

`TABLE_SURFACE_PLAN.md` 0.2 still holds, with one change to row 1: no one can stand inside a
desk's footprint any more, because the footprint is the box. A walker behind the desk stops
with their feet at `F − foot − 5` at the nearest, drawn under the desk group. Rows 2 (sitter
behind) and 5 (sitter in front) are now kept in place by physics: the block stops the chair at
the contact line, so a chair foot can't end up between `F − foot` and `F`. The one exception is
the side case above, which is cosmetic.

### 1.3 Standing up: the one order (M5)

`standSpot` (players and NPCs) follows this order. It is built and unit-tested as the pure
`pickStandSpot` in the prototype (seating.js, 619d58928, live only with `window.__seatBox`).
"Box clear" means an 18 × 10 walking box with its feet at the spot overlaps no enabled
immovable body and not the chair just left (R2 m5: the chair is dynamic once the stand
finishes, so a walking box on top of it gets shoved). The chair is passed as a **rectangle**
built from its sprite position plus its body's offset and size, the way `bodyFeet` reads
them (seating.js:389–396), never from `body.left/top` (R3 M2). Those are stale while the body
is disabled: `jumpOff` chooses its spot before `standUp` re-enables the body and moves it to
the sprite (seating.js:689, 534–544), so after any roll the body still sits where the player
sat down. "Line clear" means the line from the castor base to
the spot crosses no enabled immovable body (¼, ½, ¾, 2 × 2 probe); it ignores the chair and the
sitter, because it starts inside them.

**The local stand grid (R2 M1).** Steps 1, 2 and 5 do not read the world grid. While an NPC
sits, `seatNPC` makes its body and its chair immovable (seating.js:950–952), and
`rebuildWorldGrid` blocks every enabled immovable body, padded one cell sideways and 2 px up
and down (npc-pathfinding.js:251–277). It rebuilds 200 ms after every room load (113), 250 ms
after every door opening (doors.js:828) and on door-gate changes (door-gates.js:243, 285), and
nothing rebuilds on unseat. So a seated NPC's chair and body are usually baked into the grid,
and stay there after the NPC stands. A flood that only steps through walkable cells can't leave
a cell ringed by them, and the compass snap can land on their padding. So `standSpot` builds a
grid of its own, **full size** (R3 M1): `buildWorldGrid({ exclude: [chair, sitter] })` marks
the **live** enabled static and immovable bodies with the world grid's padding rule, leaving
out the chair and its sitter, and applies the open-door carves, exactly as `rebuildWorldGrid`
does after every room load. It is the same builder (slice 0), so the two can't drift. An
earlier draft clipped it to a 17 × 17-cell window round the chair; R3 M1 showed the carve
helpers clamp to the grid instead of clipping (npc-pathfinding.js:676–687, 706–717), so a
side-door corridor across the window's edge got a blocked row in its middle and one wholly
outside gave a negative row index and threw. The flood is bounded by its cell count, so
the full grid costs only the build, and a stand-up is rare. Cells the chair or sitter alone blocked are walkable in it;
cells another body blocks stay blocked, and so do desks, so the flood still can't cross one.
This also covers the player sitting on a chair an NPC left since the last rebuild.

1. **Compass candidates.** At `reach` (half the chair body's longer side + 14) in the order:
   forward, the two sides, the two back diagonals, back, and the two forward diagonals last,
   counted from the **home facing**. For the player that is the facing at stand time,
   `state.facing` (R3 M3): `place()` sets it to the direction the player last rolled
   (seating.js:786–792), so it is the way they faced as they came up to the desk, which is
   what game 876 used and proved. Nothing records a sit-time facing, and one must not be
   added: sit facing east, roll north to tuck behind a desk, and a sit-time facing makes the
   forward diagonals relative to the desk (NE, NW) into back diagonals, the game 875 corner
   case. For an NPC it is `st.homeFacing`, not `st.facing`, which turns towards the player
   within 96 px (seating.js:1026–1035), while chatting (1201–1210) and, after office-life
   slice 21, at random (R2 m6). Each snaps to the nearest walkable cell of the local grid within 1 cell,
   under 12 px from the target, and must be box clear and line clear. (Forward diagonals go
   last because a chair tucked in faces its desk, and a forward diagonal steps round the desk's
   corner to its far side. In game 875, with the old order, the 18 × 8 body at the west end of
   `zds_desk1` stood at [324, 116], behind the desk's back edge. With this order, game 876
   stood at [308, 108], beside the end.)
2. **Flood fill, 4 cells.** Over the local grid, from the chair's castor cell, through
   walkable cells only (8-connected), up to 4 steps (32 px). Nearest first; the first cell that
   is box clear (the chair counted, so a cell 8 px from the castor is rejected) and line clear.
   Walking only through walkable cells means it can't reach the far side of a desk in 4 cells.
3. **The approach point**, if box clear. For the player it is `state.approach` (where they stood
   to sit). For an NPC it is the feet point it sat down from, which `seatNPC` already reads
   (`bodyFeet(sprite)` before `poseSprite`, seating.js:953) and now keeps as `st.approach` for
   every seated NPC, needs or not. **Voluntary stands** (`jumpOff`) take it only when it is
   within 32 px of the castor and line clear (R2 m4): after a roll, the approach point can be
   across the room or the far side of a desk, and `jumpOff` animates a hop to it
   (seating.js:684–710). Forced stands take it with the box check only, as before.
4. **Out of options, voluntary** (Space, Space: `jumpOff`): stay seated and show "No room to
   stand up here." (`window.gameAlert`, 2.5 s). The player can roll somewhere else. No NPC
   stand is voluntary today.
5. **Out of options, forced** (`standUp()` with no spot: KO, seating.js:675; punch and block,
   player-combat.js:101, 195; the chair going inactive, seating.js:717; E with nothing in
   reach, interactions.js:1998; `trySit` on another chair; NPC `unseatNPC`): the flood fill over
   the local grid to 8 cells with box clear only. Then, for the **player**, the approach point
   with no check (where they stood to sit down, so always a floor spot they reached on foot).
   For an **NPC**, step 6. Never a cell picked by direction alone, which is what landed the
   player across the desk.
6. **NPC last resort (R3 M4).** An NPC's recorded approach is often its chair: `seatNPC`
   records `bodyFeet(sprite)` before posing (seating.js:953), which for an NPC `seated` at
   load is its spawn, and authors put the spawn on the chair (Tomasz spawns at (11, 4) and
   `tomasz_chair` is at (11, 4), lab scenario.json.erb:659, 1153; `chairsNear` accepts any
   chair within 40 px). For needs seats the approach is also the castor, because the chair is
   slid or fetched to the feet first (1246, 1324). So for an NPC:
   1. the approach point, only if a walking box there misses the chair's rectangle;
   2. otherwise the nearest walkable cell the local-grid flood reaches, up to 8 cells, with no
      box check (walkable cells only, so it can't cross a desk);
   3. otherwise null: the NPC stays seated, `unseatNPC` returns false with `_seat` kept, and a
      console warning naming the NPC and the chair is logged once. Both callers run every tick
      (seating.js:1023 for hostile, KO or an inactive chair; 1195 for needs), so the stand is
      retried on the next tick. Both must treat a kept `_seat` as still seated, so the NPC
      isn't walked off while posed. When the chair is inactive there is no chair rectangle to
      miss, and step 1 takes the approach as it is.

**When the order returns null.** The player always has an approach point, so a forced stand
never returns null for the player; a voluntary one returns null and stays seated (step 4). An
NPC returns null only when boxed in so tightly that no walkable cell is within 8 cells and its
approach is on its chair; it stays seated and retries (step 6). The spawn-position fallback of
the R2 revision is dropped, because the spawn is the same point as the approach for every NPC
seated at load. The order never leaves an NPC standing inside its chair (today's `if (spot)`,
seating.js:981), and never uses `frontSpot`, whose forward step points into the desk a tucked
chair faces.

**A stand-up is never left half done (R3 M1).** `standUp` sets `state = null`, destroys the
proxy and restores the body (seating.js:518–531) before `landingSpot` runs (546). A throw in
between leaves the player invisible with `isSeated` true. `standUp` wraps the spot choice in a
try/catch: on a throw it logs the error and uses the approach point, then finishes as normal.

Line numbers are at a4faba799 unless they name 1c51fabfb's file (seating.js:950–981,
1026–1035, 1201–1210). Static chairs are unchanged (`landingSpot` returns the approach point;
`unseatNPC` keeps `frontSpot` for static seats).

**Proof.** Unit: `seating.test.mjs` "pickStandSpot" covers every branch but the forced 8-cell flood (slice 1 adds it), with fakes (compass on
the near side from behind a desk; flood when walls close every compass spot; approach; null for
a voluntary jump with nowhere clear; the forced approach; no branch returns the cell across
the desk). Live, game 876 (`r1_prove2.out`): the 9 experiment cases for the 18 × 8 body
(`18x8`, now the design) and a 12 × 8 block (`12x8k`), every one on the near side, not in a desk box, walk-away 49–58 px; and a forced
`standUp()` from behind `desk1` for both, landing at [100, 244] (back edge 264). The cramped
branches (2–5) were not reached live, because the test room has open floor on every case;
slice 1 adds a cramped case to its tests. Game 876 ran without the local grid or the chair in
the box check, and with the player's stand-time facing, which stays (R3 M3); neither addition
changes a case with open floor and a fresh grid, but slice 1 re-runs all 9 cases anyway, since
counting the chair can reject a compass spot that snapped to within 18 px of the castor
sideways. The stand audit (slice 0, run again in slice 1) is the cross-mission proof (R3 M5).

## 2. The desk footprint data

### 2.1 Where it lives

`public/break_escape/assets/table_surfaces.json`, the file `TABLE_SURFACE_PLAN.md` 2.3 chose,
built now with G's field first:

```json
{
  "version": 1,
  "sprites": {
    "desk1":      { "foot": 16, "source": "experiment" },
    "zds_desk1":  { "foot": 16, "source": "experiment" },
    "smalldesk1": { "foot": 27, "source": "measured" },
    "desk3":      { "foot": 16, "x": [0, 51], "source": "measured" }
  },
  "legacyBox": ["batrack", "servers", "bookcase", "bed1"]
}
```

One file serves three readers, as in the table-surface plan:

- **Engine:** `this.load.json('tableSurfaces', 'table_surfaces.json')` in `game.js`
  `preload`. A new module, `systems/desk-footprints.js`, reads it with `deskBoxOf(sprite)` and
  returns a box in sprite px, or null.
- **Validator:** `validate_scenario.rb` already reads `public/break_escape/assets/rooms`, so it
  can read this file too (used by the checks in 4.4).
- **Generators and room tools:** one helper, `desk_box(texture, x, y, w, h)` in
  `scripts/room_gen/room_geometry.py`, used by `room_edit.py`, `generate_rooms.py` and a new
  `chair_at_desk(desk, side)` placement helper (slice 7).

Keys are texture keys. Variants (`desk1`/`desk2`/`desk3`) get one entry each.

**Which maps use it** is not in this file. It is a property of the map (slice 2): a Tiled map
property `deskBoxes` with the value `footprint`, in the map JSON's top-level `properties`.
Walkability belongs to the map: `room_office` is shared by 64 scenarios, and room fixes are
made in the map with `room_edit.py`, so a flag on the map keeps the fix and the flag together.
A scenario can't turn it on or off.

### 2.2 Fields

| Field | Meaning | Default |
|---|---|---|
| `foot` | the footprint's depth in floor px: the top's depth in rows, outline included, from the first opaque row down to the row before the front face (the lip) | required for a footprint box |
| `floor` | sprite row of the floor line, if the art has transparent rows below the legs | sprite height |
| `x` | `[x0, x1]` sprite columns of the opaque top, for padded PixelLab art | `[0, width]` |
| `top`, `front` | the usable-surface band from `TABLE_SURFACE_PLAN.md` 2.2, written by the measurer as it goes, for later item work | absent |
| `source` | `experiment`, `measured` (checked on the contact sheet) or `hand` | |

`legacyBox` lists textures in `tables` layers that keep today's box on purpose: racks, servers,
beds, appliances, the hatch counters and anything else that isn't a desk.

### 2.3 Measuring it

`measure_table_surfaces.py` gets a `--footprint` mode, free (Pillow and numpy):

- `foot` = the first row of the front face, minus the first opaque row. Pass 1 already finds
  where the top's colour run ends. `foot` takes the next row that changes to the darker
  front-face colour. That gives `desk1` 16 and `smalldesk1` 27.
- `floor` = the last row with an opaque pixel, plus one (the same alpha > 0 rule as `sitShift`,
  seating.js:53–75).
- `x` = the opaque column span of the top band.
- The contact sheet draws the box as a magenta rectangle at `F − foot … F` across `x`.

**What needs a hand value.** 445 objects sit in Tiled `tables` layers, across 81 textures and
117 rooms (`tables_usage.py`).

- **Measured with confidence (≥ 0.6, pass 1):** 24 of these textures, covering 253 placements.
  Most common: `desk1` 60, `smalldesk1` 42, `zds_desk1` 34, `smalldesk2` 21, `zds_desk3` 16.
- **No estimate at all:** 31 textures, 139 placements. Almost all are non-desks for
  `legacyBox`: `batrack` alone is 86 (3 rooms), then the curtain divider, inverters, servers,
  bookcase, fridge, beds, workshop machines, the photocopier and a sofa. The exceptions are the
  five `pnw_console*_pN` sections, a `lectern1` and a `display_case3`, which need a look.
- **Low-confidence estimates:** 26 textures, 53 placements (from the 12 flagged and 22 wrong
  in `TABLE_SURFACE_PLAN.md` 3.2). They need a hand value. Most are used in one or two rooms.

The hand values go on a review page (the AGENTS.md picks page): crop, proposed box, and a
number box for each sprite. An agent fills it and the user checks it once (Q3). `smalldesk1`
takes the measured 27, so one rule covers all 24 confident textures; the sweep's 28 is inside
slice 2's ±1 px check (R1 m1). Tall-legged tables whose top is deeper than their legs
(`hospital_conference_table`, `zds_conference_table1`: about 28 rows) get a footprint box as
deep as the top. Whether that's right on the floor is what R1 m10 asked of the table-surface
plan. It gets a look on the contact sheet and a walk-round in the test room (slice 2).

### 2.4 A sprite with no entry

It keeps **today's box**: the bottom quarter, inset 10 px each side (rooms.js:2645–2654 and
mode A 2134–2148). That covers non-desks, unmeasured props and anything added later without a
measurement, so missing data can never take a desk's body away. A coverage test keeps the
fallback deliberate. It fails when a texture used in any `tables` layer, or a catalog name the
measurer's surface regex matches, has neither a `foot` entry nor a `legacyBox` line.
`register_object.py` and the PixelLab prop import call the measurer for a new surface-like
texture and write a `measured` entry or a `legacyBox` line (as `TABLE_SURFACE_PLAN.md` slice 3
planned).

Rotation and flips: no `tables`-layer object is rotated or flipped today (0 of 445), and none
is scaled. `deskBoxOf` returns null (fallback) for rotation ≠ 0 and for `scaleX` or `scaleY`
≠ 1, and mirrors `x` under `flipX`. Scale falls back rather than multiplying (R3 m6): tables
are static bodies (`physics.add.existing(sprite, true)`, rooms.js:2136, 2637), and Arcade
scales a static body's size and offset by different rules from a dynamic one's, so a multiply
invites double scaling with no scaled desk to test it on. A scaled desk gets its rule when one
exists.

## 3. Engine changes, in slices

Each slice is one commit (engine before data), with explicit paths
(`git commit -m "..." -- <paths>`, after checking `git diff --cached --stat`). The order for
each engine slice (R1 m3, R3 m7), following the standing shared-tree rule:

1. run the fast node unit tests for the touched modules (for example
   `node --test test/js/seating.test.mjs test/js/seat-box.test.mjs`) before the engine commit;
2. commit your own files, because the live servers and other agents read the shared tree;
3. straight after, run the full node suite (`bin/test-js`), the Rails suite
   (`bin/rails test`), the phone reopen check (`node scripts/ink_runtime_check/reopencheck.mjs
   scripts/ink_runtime_check/missions.json`, slices 1–3) and the slice's live checks;
4. fix anything they find in a follow-up commit, before any later slice builds on this one.
   A slice isn't done until step 3 passes.

AGENTS.md:227 says to run the suites before each engine commit. In this shared tree the
standing rule (commit own files before tests and live checks) wins, with step 1 as the guard
and step 4 as the catch; the user can overrule. Any new static import in an engine
module goes on each JS test harness copy list. Ownership is in section 6: slices 1–5 and 8 are
this work, slice 6 is the office-life session's (or this session's, once that session agrees),
slice 6a is the separate scale audit's, and slice 7 is the lab.

### Slice 0: the walk audit, before anything changes

The room snapshot (a7640b314) records sprite positions and depths. A desk box change moves
neither, so the snapshot can't see this plan's main risk, and it leaves out swivel chairs and
NPCs. So slice 0 adds a walkability record to the same run.

- **The grid builder split** (`npc-pathfinding.js`, its own commit, no behaviour change).
  `rebuildWorldGrid` becomes `buildWorldGrid({ exclude })` plus today's EasyStar set-up.
  The builder returns `{ grid, bounds }` and never touches the live grid. It always builds the
  full world rectangle (no `window` option, R3 M1). It marks the same sources with the same
  padding (251–277), skipping any body whose `body.gameObject` is in `exclude` (the list holds
  game objects; the builder iterates bodies), and applies the side-door carves and the N/S
  corner blocks (297–305) to its own grid. The carve helpers take the grid and bounds they
  write to; `markSideDoorCorridor` and `markDoorWalkable` (634–641, 177–216) still write the
  live grid, so they pass `this.worldGrid` and `this.worldGridBounds`. `rebuildWorldGrid`
  assigns the returned grid and calls `setGrid` last, as today.
  - **Behaviour-neutral proof, unit (R3 m1).** Before the refactor, the test file takes today's
    grid for a fixture world (an open side door, an open north door, a static desk, an
    immovable wall strip) and stores it as a golden array. After the refactor,
    `buildWorldGrid()` with no options must equal the golden array cell for cell. A frozen
    copy of the old function is not kept.
  - **Behaviour-neutral proof, live (R3 M6).** `tools/playtest/grid-hash.mjs <game_id>`
    loads a game the walk record's way (below: NPC updates stubbed, bodies settled), calls
    `rebuildWorldGrid()` and prints a hash of `worldGrid` and `worldGridBounds`, three times
    per load to show it is stable. Run on two game rows, one of them with an opened side door
    (after `unlock-all-rooms.rb`), on the commit before the split and again on the split
    commit. Equal hashes pass.

  The walk record (below) and the local stand grid (1.3, slice 1) both use the builder.
- `room-snapshot.mjs --walk` also writes, for each room:
  - every enabled static or immovable body (the sources `rebuildWorldGrid` uses,
    npc-pathfinding.js:269–279), **leaving out NPC bodies and swivel chairs** (R2 M2 iii).
    While an NPC sits, its body and chair are immovable (seating.js:950–952), and
    `behavior.immovable` NPCs always are (npc-sprites.js:138–139); whether an NPC is seated at
    record time depends on timing, so including them makes a legacy run and a footprint run of
    the same game row differ for reasons unrelated to desks. NPC positions are still checked,
    as key points (check (c));
  - a **walk grid** for the room's rectangle, built in the page by `buildWorldGrid` with the
    NPC and swivel-chair bodies in `exclude`. The live world grid is not used and not changed;
  - the **key points**: the player start, each door's approach point, each NPC's spawn and
    patrol or route waypoints, every needs station's `approachCell`, and the nearest walkable
    cell to every interactable object.
- **When to record (R2 M2 iv).** `room-snapshot.mjs` loads rooms with the game loop asleep
  (53–61), then waits 300 ms of wall time (65). Table and wall bodies are cut in
  `delayedCall(0)` callbacks, and the grid rebuild is a game-time `delayedCall(200)`
  (npc-pathfinding.js:113), so neither need have run. With `--walk`, after the last room
  loads, the tool wakes the loop and waits until `scene.time.now` has advanced at least 300 ms
  past the last load, then builds the walk grid itself. It doesn't rely on the engine's
  rebuild having happened.
- **No NPC moves while the bodies settle (R3 m4).** Gate doors open for NPCs
  (`door-gates.js`, Len's `openFor` in the lab, scenario.json.erb:652), disable their bodies
  and rebuild (door-gates.js:243, 285), so two records of the lab could differ at the records
  door. Before waking the loop, the tool replaces `window.npcBehaviorManager.update` with a
  no-op in the page (test-only, no engine change; it is called from game.js:2464). No NPC
  walks, sits, slides a chair or opens a gate. The tool logs every gated door's state, and its
  coverage line fails if any gate is open at record time.
- **Swivel chair positions at load (R3 m5).** Check (d) needs each swivel chair where the map
  put it, but swivels are left out of the walk record. The tool records each swivel chair's
  position and body rectangle separately, from the sprite before the loop wakes, with its
  Tiled object id. With NPC updates stubbed, no needs NPC can slide or fetch it first
  (seating.js:1160–1167, 1299–1330).
- Two init-script switches let one game row be loaded both ways with no scenario or map edit:
  `window.__deskBoxes = 'legacy' | 'footprint'` (read in slice 2, overriding the map
  property) and `window.__seatBox = false` (read in slice 1: today's stand-up code, kept
  intact for the stand audit's comparison; R3 m3).
- `walk-audit-diff.mjs before.json after.json` runs a flood fill over each room's grid from its
  doors and reports:
  - (a) key points reachable before and not after;
  - (b) interactables whose nearest walkable cell moves past `INTERACTION_RANGE` (32 px,
    constants.js:65);
  - (c) NPC spawns, waypoints or needs cells now inside a body;
  - (d) swivel chairs whose body overlaps a desk body at load (Arcade won't separate more than
    4 px, so these stay sunk), from the chair positions recorded before the loop wakes (above);
  - (e) the cells added per room;
  - (f) for opted-in maps: corridors 8 ≤ gap < 10 px high (passable seated, by an 8 px high
    block, not by the 10 px walker) that border a pocket from (g). It is computed in (h)'s
    geometry pass from the real bodies, not from the walk grid (R3 m9): an 8 px grid with 2 px
    vertical padding can't show a gap of 8–10 px. The width clause is gone
    (R2 m1): every seated block and chair body is at least 18 px wide (office chairs 18,
    `chair-white` 22, exec 28; section 5), so nothing passes sideways seated that a walker
    can't;
  - (g) **pockets** (R2 M2 ii): per room, walkable cells of the walk grid that are walkable in
    both records, reachable from a door before and not reachable after. Check (a) sees only
    key points, but `getRandomPatrolTarget` (npc-pathfinding.js:131–158) picks any walkable
    tile in the patrol bounds, so a pocket with no key point still matters. Fails on any
    pocket of 4 cells or more (16 × 16 px, about one walker's footprint); smaller ones are
    listed. Each pocket gets a 2× screenshot with the cells drawn;
  - (h) **gaps and corridors from geometry** (R2 M2 i), as `box_audit.py` does from the Tiled
    files, but from the record's real bodies of the opted-in map: every pair of bodies (desk to
    desk, desk to wall, desk to other furniture) facing each other across a gap: side by side
    (their y ranges overlap; the walker crosses the gap north to south and needs 18 px) or one
    above the other (their x ranges overlap; the walker goes along the corridor and needs
    10 px). It fails on a side gap that goes from 18 px or more to under 18, and on a corridor
    that goes from 10 px or more to under 10. The grid can't see these:
    its padding blocks any gap under about 24 px both before and after, while the player moves
    by physics with an 18 × 10 box. Gaps that end between 18 and 24 px are listed, not failed
    (open on foot, closed to click-to-move and NPCs, as many are today). Bodies are paired
    across the two records by object id, so only the boxes differ. Wall bodies have no object
    id; they are keyed by room and rectangle, which don't change between box modes (R3 m5).

  It exits 1 on (a)–(d) and (f)–(h) outside `--allow`.
- **The test scenario without a Mission row (B2).** The experiment's scratch `swap_game.rb`
  becomes `tools/playtest/swap-scenario-game.rb <host_mission> <scenario_dir> [--start-room
  <id>]`. It makes one game of an existing test mission (`test_seating`) with `new-game.rb`'s
  set-up, then replaces that one game row's `scenario_data` with the rendered scenario, the
  same kind of test-only edit as `--start-room`. It prints the game id. No `db:` task, no
  `db/seeds.rb`, no Mission row. Games 874–876 were made this way. `snapshot-games.sh`
  lists missions from the DB, so it misses `test_desk_seating`; pass that game id to the
  snapshot and walk tools explicitly.
- **Baseline, scoped (R1 m5).** Footprint boxes are opt-in per map for good (slice 2), so the
  full walk audit only runs for maps being opted in. Slice 0 records:
  - the walk record for `room_test_desk_seating` and `room_lw_accounts` (the two maps opted in
    first), with `__deskBoxes = 'legacy'`;
  - for the landing rule, which is global (slice 1): the **stand audit** baseline below, on
    today's code;
  - a sample of five high-traffic shared rooms (`room_office`, `room_uni_staff`,
    `room_IT`, `room_office5`, `room_break`) with the full walk record, so a later map opt-in
    there has a baseline ready.

  Every later slice is compared against this baseline, on the same game rows.
- **The stand audit (R3 M5).** The landing rule changes every player stand-up on every swivel
  chair in every mission, and a voluntary jump-off can now refuse where today it always lands.
  The walk record can't show where a player lands, so slice 0 adds
  `tools/playtest/stand-audit.mjs <game_id>...`, on the snapshot tool's loader (all rooms,
  `unlock-all-rooms.rb`, NPC updates stubbed as above). For each placed swivel chair
  (`chair-darkgray-1`, grey-1, grey-4, white, exec; section 5 gives 9 + 9 + 4 rooms for the
  office chairs before overlaps, plus the white and exec rooms) in every mission row
  `snapshot-games.sh` lists, plus `test_desk_seating` by game id:
  1. move the player to the chair's approach side and sit through the seating module, with the
     chair at its placed position (no roll);
  2. Space, Space (the voluntary `jumpOff`), and log the result;
  3. sit again, then a forced `standUp()`, and log it.

  Each stand logs the chair id, room, `via` (the 1.3 branch, or `legacy`), the landing point,
  whether the 18 × 10 walking box there overlaps an enabled static or immovable body ("in a
  body"), and whether the line from the castor to it crosses a desk body ("across a desk",
  `pathClear` with the chair and the player ignored). A chair with a seated NPC on it is skipped
  and listed (the NPC stand has its own tests in slice 1). No scenario edit.
  - **Baseline (slice 0):** run on today's code. Legacy landings in a body or across a desk
    are expected and listed; they are the bug slice 1 fixes.
  - **Slice 1:** run again on the same rows, under `__seatBox = false` (legacy, for the
    side-by-side) and with the new order. **Fail** on any new-order landing in a body or
    across a desk. List every chair where the voluntary stand now refuses ("No room to stand
    up here."), with a 2× screenshot of each, for the user to look at before slice 1 is called
    done.

### Slice 1: the landing rule (player and NPC)

Files: `seating.js` (`standUp`, `jumpOff`, `standSpot`, `unseatNPC`'s call to it, `seatNPC`
recording `st.approach`, and the prototype's `seatedBlock`, `clearOfTables` and
`pickStandSpot`), a new pure module, `systems/seat-box.js`, which the NPC half (slice 6)
imports as well, and `SEAT_BOX_EXPERIMENTS.md` (the R2 m2 pointer, below). It uses slice 0's
`buildWorldGrid` split.

The office chairs' seated body doesn't change (Q0): the driver already takes the chair's
18 × 8 body (`seatedBlock` with no toggle). Slice 1 is the landing rule, the helpers, and
`SEAT_BLOCKS` holding `office40` = the existing body, so slice 5 has a place to put the other
families.

- `seat-box.js` exports:
  - `SEAT_BLOCKS`: block per seat family, `{ w, h, cx, cy }` in rotation-frame px, the centre
    being the castor base. `office40`: `{ 18, 8, 20, 35 }` (the existing body at (11, 31)).
    Every block is at least 18 px wide (1.1, block width rule).
    `white32` and `exec` stay out until section 5 measures them, and those chairs keep today's
    behaviour (the whole body), so nothing untested changes.
  - `blockFor(chair)`: the family's block, or null.
  - `walkBoxClear(scene, x, y, { ignore = [], extra = [] })`: true when an 18 × 10 walking
    box with its feet at (x, y) overlaps no enabled static or immovable body outside `ignore`,
    and none of the **rectangles** in `extra` (`{ x, y, w, h }` in world px). It uses the
    sources `rebuildWorldGrid` uses, so desks, walls, locked doors and immovable furniture all
    count. The prototype looked only at static bodies in `room.objects`, which misses wall
    boxes. `ignore` is a list (R2 M1): `standSpot` passes `[sitter]`, because a sitter with
    `behavior.immovable` (npc-sprites.js:138–139; Tomasz in the lab is one) would otherwise
    block its own landing. `extra` holds the chair's rectangle (R2 m5), because once the stand
    finishes the chair is dynamic again (the player: `standUp` re-enables it, seating.js:534;
    an NPC: `unseatNPC` restores `immovable`, 975) and a walking box on top of it gets shoved
    by Arcade.
  - `chairRect(chair)`: the chair's body rectangle from its sprite position plus the body's
    offset and size, scaled as `bodyFeet` does (seating.js:389–396), never `body.left/top`
    (R3 M2). On the voluntary path `jumpOff` asks before `standUp` re-enables the body and
    `placeBody`s it (seating.js:689, 534–544), and Arcade doesn't update a disabled body, so
    its bounds are where the player sat down, not where they rolled to.
  - `pathClear(scene, from, to, { ignore = [] })`: the prototype's ¼, ½, ¾ samples with a
    2 × 2 probe. `standSpot` passes `ignore: [chair, sitter]`, since the line starts inside
    both.
  - `localStandGrid(pfm, { exclude })`: the local stand grid of 1.3, slice 0's
    `buildWorldGrid({ exclude })` at full size (no window, R3 M1). `standSpot` passes
    `exclude: [chair, sitter]`.
  - `nearestCell(grid, x, y, r)` and `floodStandCells(grid, x, y, maxCells)`: the snap and the
    prototype's `floodCells`, over the local grid instead of `pfm.worldGrid`; walkable cells
    reachable through walkable cells, nearest first.
  - `pickStandSpot(...)`: the prototype's pure order (1.3), with these changes: the voluntary
    approach check (within 32 px and line clear, R2 m4); `facing` meaning the home facing,
    which the caller passes (the player's `state.facing` at stand time, an NPC's
    `st.homeFacing`; R3 M3); and an `npc` flag that selects step 6 (R3 M4) in place of the
    player's unchecked approach.
  - `sweepBlock(scene, rect, dx, dy, ignore)`: how far a block can move along (dx, dy) before
    it meets an immovable body. Slice 6 uses it for the NPC slide and tuck targets, and it is
    pure geometry over the real bodies, so it needs no footprint data. **It ships in slice 1
    unit-tested but unused** (R3 m8): it belongs with the other block geometry in
    `seat-box.js`, and the hand-off note names it as something slice 1 added. Its live proof
    is slice 6's.
- **On sitting** (`sitOn`): no change. The driver takes the chair's body, which for `office40`
  is `blockFor(chair)`. Slice 5 decides whether `white32` and `exec` need a block of their own;
  only then does `sitOn` read `blockFor`.
- **Landing** (`standSpot`): the order in 1.3, with `walkBoxClear` (all immovable sources,
  walls and locked doors included, not only the room's static objects as in the prototype) and
  `pathClear`. `jumpOff` passes `forced: false`; every other caller is forced. The unchecked
  `findNearestWalkableWorldCell(cx, cy + reach, 3)` fallback is deleted from the default path
  (it survives only in the legacy code behind `__seatBox === false`, below).
- **`standUp` can't be left half done (R3 M1).** The call to `landingSpot` (seating.js:546)
  goes in a try/catch: on a throw, log it and use the approach point, then finish the stand.
- The landing rule is **global** and not behind a flag. Today's `standSpot` lands the player on
  or behind a desk when the chair faces one (EXPERIMENTS: 100% of front and side cases), and
  that happens with today's boxes too, so this is a fix everywhere.
- **NPCs too (M6).** `unseatNPC` calls the same `standSpot` for a seated swivel NPC with no
  `standAt` (seating.js:980 at 1c51fabfb), so slice 1 changes NPC stand-up as well. That is
  office-life code: the office-life session reviews the slice 1 diff before it is committed
  (or, under the section 6 fallback, agrees to it). Three NPC-side lines change with it:
  - `seatNPC` keeps the feet point it already reads before posing (seating.js:953) as
    `st.approach`, for every seated NPC (R2 M1). For an NPC seated at load this is usually on
    its chair, which step 6 of 1.3 allows for (R3 M4);
  - `unseatNPC` passes `st.homeFacing`, `st.approach` and `npc: true` to `standSpot`, not
    `st.facing` (R2 m6: `st.facing` follows the player within 96 px, seating.js:1026–1035,
    and while chatting, 1201–1210);
  - when `standSpot` returns null, `unseatNPC` stays seated (1.3 step 6): it returns false
    with `_seat` kept, before releasing the place or restoring the bodies, warns once per
    seating, and the next tick's call retries. The two callers (seating.js:1023, 1195) are
    checked so that a kept `_seat` stays posed and isn't walked off. Never "stand where it
    is" (today's `if (spot)`, seating.js:981), and no spawn fallback (dropped after R3 M4).
  The needs path (`standAt` set) is unchanged.
- **`window.__seatBox === false`** (R3 m3) selects today's stand-up code, kept intact for the
  stand audit's side-by-side: the old compass loop with its unchecked fallback (seating.js:
  641–648) and a `jumpOff` that never refuses. Unset (the default) is the new order. It is
  test-only; a unit test asserts nothing in the engine sets it, as the prototype's test does.
  It goes when slice 8 opts the last audited map in, or earlier if the stand audit is retired.
  The experiment's code for the smaller block goes (R2 m1): the `{ w, h }` toggle in
  `seatedBlock` (seating.js:431–435), which then always returns the chair's body, and the
  `keep` branch in `standUp` (535–542).
- **The experiments doc (R2 m2).** The slice 1 commit adds one line at the top of
  `SEAT_BOX_EXPERIMENTS.md`'s "Recommendation" and "What the NPC side needs": "Superseded by
  `SEAT_BOX_PLAN.md` Q0: the block is the chair's own 18 × 8 body; the front and back stops
  are unchanged." The office-life session may read that doc, so it should not still recommend
  12 × 8 when slice 6 starts.

Tests (`seating.test.mjs`, a new `seat-box.test.mjs`):
- `blockFor` for each family (null for white and exec until slice 5), and every block ≥ 18 wide;
- `walkBoxClear` and `pathClear` against fake bodies (a desk between the chair and the spot, a
  wall box; the sitter ignored as a list member; an immovable sitter not ignored blocks);
- **the chair counts in the box check** (R2 m5): a flood cell 8 px from the castor is rejected
  because the walking box overlaps the 18 × 8 chair body; the same cell passes the line check;
- **a disabled chair whose body is stale** (R3 M2): the chair's sprite has moved 30 px since
  its body was disabled; `chairRect` follows the sprite, a spot clear of the old body but on
  the new rectangle is rejected, and one on the old body but clear of the new rectangle passes;
- `localStandGrid`: cells covered only by the chair and the sitter are walkable, a cell also
  covered by a desk stays blocked, and every other cell equals the world grid's (R3 M1).
  Three edge cases, each compared with `buildWorldGrid()` with no options, cell for cell,
  except the excluded bodies' cells: a side-door corridor within 68 px of the chair, an N/S
  door beside it, and a chair at the world grid's edge;
- **`standUp` survives a throw** (R3 M1): with a grid builder that throws, `standUp` still
  restores the player's body, makes them visible, clears `isSeated` and lands on the approach
  point;
- **player facing** (R3 M3): a player who sat facing east and rolled north behind a desk
  stands on the desk's near side (north), counted from `state.facing`;
- `sweepBlock` stops at the contact line from all four sides;
- `pickStandSpot`, each branch of 1.3 (the prototype's test, extended), including the forced
  8-cell flood and the **voluntary approach** rule (R2 m4): an approach 40 px away, or across a
  desk, is refused for `jumpOff` and taken for a forced stand;
- named cases with fake bodies (R1 B1): **behind `desk1`** (castor 260, `F` 280, `foot` 16:
  pass means stand y < F − foot = 264); in front; at each end; **cramped** (a chair behind a desk
  with a wall 12 px north: compass all fail, the flood fill finds the cell beside the chair);
  **boxed in** (a voluntary jump returns null, a forced stand returns the approach point);
- **baked chair** (R2 M1): the fake world grid has the chair's and the sitter's padded cells
  blocked, as `rebuildWorldGrid` leaves them while an NPC sits, and every compass spot is
  closed by walls. With the world grid the order returns nothing; with the local grid the flood
  finds the cell beside the chair. The same case for the player on a chair an NPC has left;
- an **NPC stand** case: a seated NPC with no `standAt`, its chair tucked behind a desk,
  `unseatNPC` puts it on the near side; repeated with the NPC turned to face the player on a
  forward diagonal (`st.facing` ≠ `st.homeFacing`), which must still stand on the near side
  (R2 m6); and boxed in (R3 M4): every box-clear spot closed, with the recorded approach
  **equal to the castor** (as for an NPC seated at load), where it takes the nearest walkable
  cell of the no-box-check flood, outside the chair's rectangle and on the chair's side of the
  desk; and with no walkable cell within 8, where `unseatNPC` returns false, keeps `_seat`,
  warns once, and stands on a later tick once a cell opens. Never inside the chair.

Live (:3001, `test_desk_seating` through `swap-scenario-game.rb`): the 9 cases on today's boxes
and on footprint boxes, the behind-`desk1` case named in the log with its stand y, a forced
`standUp()` from behind `desk1`, and one cramped case made by placing a chair between the back
of `desk1` and a wall. Pass: every stand y < F − foot from behind, never inside a desk box,
walk-away ≥ 40 px. Then:

- **Seated NPCs with a baked grid (R2 M1)**, in `test_seating` (its swivel NPC with
  `facePlayer`, scenario.json.erb:41): it sits at load, so the 200 ms rebuild bakes its chair.
  Read `pathfindingManager.worldGrid` to confirm the chair's cells are blocked, stand the player
  within 96 px so the NPC turns, then make it stand through the test bridge (hostile, as combat
  does). Pass: it lands outside its chair, on the side its home facing puts it, and the log
  names the branch. Repeat after opening a door while it sits (doors.js:828), and once with the
  player sitting on that chair after the NPC has left it, before any rebuild.
- **The stand audit** (slice 0, R3 M5) on the baseline's game rows, legacy and new order. Pass:
  no new-order landing in a body or across a desk. The list of chairs where a voluntary stand
  now refuses, with screenshots, goes to the user; slice 1 is done once they have seen it.
- A regression sit-and-roll in one `room_office` mission.
- The phone reopen check (section 3, step 3).

### Slice 2: desk boxes from the footprint data (opt-in)

Files: `table_surfaces.json` (new), `systems/desk-footprints.js` (new), `game.js` (preload),
`rooms.js` (`createRoom` reads the map property; the Tiled table body at 2640–2655 and the mode
A body at 2136–2148, through one shared `applyTableBody(sprite, mode)`),
`measure_table_surfaces.py --footprint`, `room_edit.py` and the generators (set the property),
and `validate_scenario.rb` (reports legacy maps).

- `deskBoxOf(sprite)` returns `{ x, y, w, h }` in sprite px from the entry (with `x`, `floor`
  and `flipX` applied), or null when the texture has no `foot`, is in `legacyBox`, is
  rotated, or has `scaleX` or `scaleY` ≠ 1 (R3 m6, 2.4; a change to slice 2 as first written,
  which multiplied by the scale).
- `applyTableBody` uses the footprint box when the room's map has opted in and `deskBoxOf`
  gives one. Otherwise it keeps today's box exactly (`w − 20` × `h / 4`, offset (10, `3h/4`)).
- **Opt-in per map, for good (M3).** A Tiled map property, `deskBoxes` = `footprint`, in the
  map JSON's top-level `properties` array. `createRoom` (rooms.js:1766) already builds the
  tilemap (`gameRef.make.tilemap`, 1797); it reads the property from the tilemap's
  `properties` once, stores it on the room as `room.deskBoxes`, and both body sites read
  `room.deskBoxes` inside their `delayedCall(0)`. No map has `properties` today, so no map
  changes behaviour until it is opted in. `window.__deskBoxes` overrides it for the audit.
  - **Format (R2 m3).** Tiled 1.2 and later write `properties` as an array of
    `{ "name": "deskBoxes", "type": "string", "value": "footprint" }`, and Phaser passes it
    through as written. One small reader, `mapProperty(tilemap, name)` in
    `desk-footprints.js`, looks the name up in the array, also accepts a plain object
    (`{ "deskBoxes": "footprint" }`, for hand-written maps), and returns null when
    `properties` is absent or the name isn't there. Any value other than `footprint` means
    legacy.
  - **First maps:** `room_test_desk_seating` and `room_lw_accounts` (the lab's `open_plan`).
  - **New rooms:** `generate_rooms.py` and any other room generator write the property, and
    `room_edit.py` gets `set-map-prop deskBoxes footprint` for rebuilt rooms, run as part of
    the walk audit for that map.
  - **`set-map-prop` writes every file of the room** (R2 m3): `Room.docs` holds the JSON and,
    for 133 rooms, a `.tmj` twin (room_edit.py:271–274), and each may be a text-edited `Doc`
    or a re-dumped `PyDoc` (`make_doc`). `PyDoc` sets the key on the parsed map. `Doc` gains
    a `set_top_level(key, value)` that adds or replaces a top-level key in Tiled's
    alphabetical order (`properties` goes between `orientation` and `renderorder`) and
    adds or replaces the one named entry when the array already exists. `save()` already
    re-parses the text.
  - **No scenario field.** `deskBoxes` never goes in a scenario room, so the validator's
    `known_room_fields` (validate_scenario.rb:406) and the bootstrap filter (game.rb:819–823)
    don't change. The validator gets an info line per scenario: which of its maps are still
    legacy. It reads the property the way `mapProperty` does (array or object), so the two
    can't disagree; a shared fixture map in each form is read by both test suites.
  - **No default flip.** Legacy maps keep today's box for good, unless their mission is next
    redressed (slice 8).
- The body is still cut a frame after creation (`delayedCall(0)`). The sight-occlusion cache
  key already includes body height (npc-sight-occlusion.js:333–334), and the grid rebuild
  runs 200 ms after the load (npc-pathfinding.js:113), so both see the new box. Slice 2 checks
  this live: grid cells over a desk before and after.
- Data for this slice: the three `experiment` entries, the 24 confident `measured` entries
  after a look at the contact sheet, and the `legacyBox` list. The low-confidence textures
  stay on the fallback until their hand values are in (Q3), so they don't hold the slice up.

Tests: `deskBoxOf` for an entry, no entry, `legacyBox`, rotation, `flipX`, a scale ≠ 1
(null, the fallback; R3 m6) and `floor` padding; `mapProperty` with the Tiled array form, a plain object, `properties` absent, the name
absent and another value; `applyTableBody` choosing legacy or footprint by the map property
and the override; `room_edit.py set-map-prop` on a `Doc` file with and without a `.tmj` twin and
on a `PyDoc` file, each re-opened in both forms (`json.loads`, and `Room` reading the property
back), with a second run leaving the files byte-identical; the validator's legacy-map line on
the same fixtures; a Python
coverage test (2.4); a Python test that `--footprint` reproduces `desk1` 16 and `smalldesk1` 27
from the PNGs. Live: `test_desk_seating`, all 9 experiment cases (front, behind, sides, the
24 px gap, the static chair), rolled with the arrow keys through `window.__test.walk` as the
experiment did, on both box modes. The footprint numbers must match section 1.1 to ±1 px, and
the screenshots must match `best_*.png`. Then the phone reopen check (section 3, step 3; R3 m7,
added to slice 2 after it was first specified).

### Slice 3: group a matched table item only when it overlaps a desk

Files: `rooms.js`, and `scenarios/test_desk_seating/scenario.json.erb` for the demo case
(R3 M6, below).

- In the placeholder branch (2308–2320), a scenario object that matched a `table_items` or
  `conditional_table_items` placeholder joins a table group only if its final sprite rectangle
  (after any explicit `position`) overlaps a table's sprite rectangle. Otherwise it is stored
  as an ordinary item: `setDepthAndStore` plus `registerSpriteVariantListeners`, as the
  non-table branch does, with a console warning naming the object and the placeholder.
- `findClosestTable` (2817) gets `{ overlapOnly }`. The placeholder branch passes `true`. The
  unreserved Tiled table-item loop (2391–2410) keeps the nearest-table fallback unless Q4 says
  otherwise.
- **What it changes today.** A scenario item only moves to its own depth when it matched a
  placeholder but sits off every desk. The lab case (`cable_note` behind four `pc`
  placeholders) is the known one. The snapshot diff lists every other, and the allow-list is
  empty. **For unreserved Tiled items** (Q4): 14 of the 735 Tiled table items overlap no
  table. Four are in `room_closet`, which has no tables, so they are already ungrouped. The
  other 10 are in 7 rooms: `room_lw_records` ×4, and one each in `room_aes_ops`,
  `room_archive_1x2gu` (a `chair-white-2` in `table_items`), `room_lw_briefing`,
  `room_lw_reception`, `room_reception` and `room_servers`.

Tests: a unit test with a fake pool (an overlapping match grouped, an off-desk match stored on
its own with listeners), and `table-group-variant-listeners.test.mjs` still passing.

**Built (617891946, fix 53ed4fce4; results in `SEAT_BOX_BASELINES.md`, "Slice 3 results").** Q4
taken as yes: unreserved Tiled items follow the rule too, so no caller keeps the nearest-table
fallback. One addition found by the snapshot review: an item with no strict overlap whose bottom
is on, or up to 4 px above, a table's top edge (with x overlap) counts as on that table's back
edge (`TABLE_BACK_EDGE_PX`). `room_lw_records` rests a laptop, plants, a cup, a phone and a photo
on the desks' back edges, touching but not overlapping; at their own depth a swivel chair behind
the desk drew over the laptop. A match that found no group used to be dropped (never stored);
it is now stored at its own depth.

**Demo scenario (R3 M6).** `test_desk_seating` has no scenario objects today; its map has
`pc1` and `bankers_lamp1` placeholders in `table_items`. Slice 3 adds two `pc` objects to
`scenarios/test_desk_seating/scenario.json.erb`: one with no `position`, which takes a `pc1`
placeholder on a desk, and one whose explicit `position` puts it on open floor off every desk.
Live, through `swap-scenario-game.rb`: read both sprites' depths. Pass: the on-desk PC is in
its desk's group (depth `F + 0.5 + 0.01·i`), the off-desk PC has its own depth (bottom + 0.5)
and the console warning names it. Also the lab's `cable_note` at its own depth, the snapshot
diff, and the phone reopen check (section 3, step 3).

### Slice 4: `room_edit.py` firstgid check

File: `scripts/room_gen/room_edit.py` (`ensure_sprite`, 283–295). Today it asserts that a new
tileset's `firstgid` is above the highest existing `firstgid` plus its tile count. That
refuses `room_lw_accounts`, whose room tileset sits at 1500, when the `objects` tileset goes
in at 115. The new check is real overlap: the new range must miss every existing range. A
tileset's range is `[firstgid, firstgid + max(tilecount, max tile id + 1))`, so it agrees with
the engine (which resolves with `firstgid + tilecount`, rooms.js:478, 2468) and with Tiled
(ids beyond the count: the `objects` reference tileset has `tilecount 373` and ids up to 379,
`hospital_extras` 663 and 673; R1 m2). One with neither `tilecount` nor tiles counts as 1. The
message names the clashing tileset. `put_tileset` inserts in firstgid order rather than
appending, so the map reads the same in Tiled and in the engine. A small `unittest` file
(`scripts/room_gen/test_room_edit.py`) covers a clean insert below a high tileset, a real
clash, a tileset whose ids run past its count, the insert order, and the external-`source`
case. Slice 7's live check loads the patched map in the browser. This slice depends on nothing else and can run in
parallel with slice 1. Slice 7 needs it, so that the lab patch can be made with the real tool.

### Slice 5: the untested chairs (section 5)

Data only, plus tests: measured blocks for `white32` and `exec` go into `SEAT_BLOCKS`, and
grey-1 and grey-4 are confirmed against `office40`.

### Slice 6: the NPC half (office-life session, or this session once it agrees; section 6)

### Slice 6a: the seated scale fixes (separate audit; a dependency, not this plan's work)

With people now sitting at desks, some scales look wrong: the PC and lamp sit too low, the
desk may be too tall, and the hospital static chair's legs are too short. A separate scale
audit owns this and will write `docs/achitechture/SEATED_SCALE_AUDIT.md`. This plan doesn't
change any sprite's scale or art. What it takes from the audit:

- **Slice 7 waits** for the audit's placement and scale fixes that touch the lab's desks,
  PCs, lamps and chairs. The desk layout, the PC and lamp positions and the left-behind items'
  spots are set after those fixes, not before.
- **Item placement on the desk top follows the audit.** Where the audit gives a rule for how
  high a PC, lamp or other desk item sits on a top (or a corrected sprite), slice 7 uses it in
  place of the y 3.5 / 6.5 positions and the elevation values in section 7.
- **If a desk's art or scale changes**, its `foot` entry in `table_surfaces.json` is measured
  again (`--footprint`), and the contact numbers in 1.1 for that desk are re-rolled in
  `test_desk_seating` (slice 2's live check) before slice 7 relies on them. A desk given a
  Tiled scale ≠ 1 falls back to today's box (`deskBoxOf` returns null, R3 m6), so a scale fix
  done that way needs a scale rule in `deskBoxOf` first; redrawn art at native size needs only
  the new `foot`.
- Slices 0–5 don't wait: the landing rule, the map opt-in, the grouping fix and the
  `room_edit.py` fix don't depend on sprite scale.

### Slice 7: the lab (section 7)

### Slice 8: opt a map in when its mission is next dressed (no default flip)

There is no scheduled flip (M3). A map is opted in when a mission that uses it goes through
room dressing, or a generator makes it new. For each map:

1. take a walk record for every scenario that uses the map, legacy and footprint, on the same
   game rows (`__deskBoxes` override);
2. fix each flag with `room_edit.py`: move a desk a few px in place, put a desk on `legacyBox`,
   or accept the closure where walking between two touching desks was a bug (Q8);
3. set the map property with `room_edit.py set-map-prop deskBoxes footprint` and commit the map
   JSON on its own, with explicit paths.

A shared map (`room_office`, 64 scenarios) is opted in only when every scenario on it passes
the walk audit, and the room dressing owner agrees. The `mission-room-dressing` skill can name
this step later; that edit isn't part of this plan.

## 4. Blast radius: every desk's box in an opted-in map changes

After R1 this is the cost of opting a map in, not of a global change: no map changes until it
is opted in (slice 2), and the only global change is the landing rule (slice 1). The estimates
below are kept because they show which maps will need work when their missions are redressed.
They were computed with `smalldesk1` at 28; at 27 its north edge moves 1 px less.

### 4.1 What changes

Today a desk's body is the bottom quarter of the sprite, inset 10 px each side. For `desk1`
(78 × 39) that is 58 × 9.75 px at `F − 9.75 … F`. The footprint box is 78 × 16 at
`F − 16 … F`. The south edge stays at `F`, so nothing changes for someone in front of a desk.
The ends move out by 10 px each. The north edge moves north by `foot − H/4`:

| Desk | Today's depth | Footprint depth | North edge moves |
|---|---|---|---|
| `desk1`, `zds_desk1` | 9.75 | 16 | 6 px |
| `smalldesk1` | 10.25 | 27 | 17 px |
| conference tables | 12–14 | about 28 | 14–16 px |

### 4.2 Estimated size, from the room files

`box_audit.py` (scratchpad `seat-box/`) applies both boxes to every `tables`-layer desk with a
confident or experiment value. It uses the grid's padding rule (one cell sideways, 2 px up and
down; npc-pathfinding.js:251–266). These are estimates from the Tiled files only. Scenario-
placed tables, NPCs and doors need the slice 0 walk audit.

- **Grid cells:** 102 of the 117 rooms with tables gain blocked cells, 4,209 cells in all.
  `room_office`, which 64 scenarios use, gains 70. The most affected are `room_uni_staff`
  +132, `room_office5` +99, `room_IT` +99, `room_uni_lab` +95, `room_office4` +92 and
  `room_break` +92.
- **Side gaps:** 34 desk pairs had a box gap of 18 px or more (a walker fits) and drop under
  24 px (about the least the grid's padding leaves a path through). 28 of them drop under
  18 px, closed to a walker too. They are in 23 rooms: `room_IT`, `room_aes_plant`,
  `room_aes_reception`, `room_break`, `room_control_1x2gu`, `room_hce_lab`,
  `room_hospital_servers`, `room_lab`, `room_lw_briefing`, `room_lw_office`,
  `room_m09_reading`, `room_m09_salvage`, `room_m10_forward`, `room_m10_workshop`,
  `room_office4`, `room_office5`, `room_pnw_scada`, `room_pnw_servers`, `room_qdc_lab`,
  `room_qdc_open`, `room_se_ops`, `room_uni_lecture` and `room_zds_office`. The
  experiment's 24 px sprite gap is exactly the case that still passes.
- **North-south corridors** (the front of one desk to the back of the desk south of it): 16
  narrow below 24 px in 7 rooms. Five drop under 10 px, closed: `room_m09_salvage` (4–6 px)
  and `room_servers` (5.5–6.2 px), both where `smalldesk*` backs onto a row in front.
- **Desks that touch end to end** (gap 0, today 20 px between the inset boxes): the gap closes.
  That fixes a bug, since you could squeeze between two desks drawn as one bench.
- **Swivel chairs sunk at load:** one, a `chair-grey-1` beside a `desk1` in
  `room_lw_briefing`. **Static chairs:** none has its foot newly inside a box.

### 4.3 By concern

- **Player walking.** Arrow keys use physics, so a walker stops at the new edges. Behind a
  desk the player can no longer stand inside the footprint (the walk-behind look shrinks to
  the desk's back edge). Click-to-move uses the grid, so it routes round the added cells.
  Interaction reach from behind gets 6–17 px longer for items at the back of a top. Walk-audit
  check (b) lists any interactable that ends up out of range.
- **NPC patrols and needs routes.** Patrols path over the grid, so a closed gap reroutes them
  or, at worst, leaves a waypoint unreachable (check (a)). NPC–desk colliders
  (npc-sprites.js:967–978) and the "is this position safe" check (`npc-sprites.js` ~1050–1112) read the body, so they
  follow the new box. The unstick routine (npc-behavior.js:2366–2400) fires when an NPC's
  body overlaps a desk body. An NPC spawned, or parked by a route, inside the new footprint
  would be pushed out every tick (check (c)). Needs stations' `approachCell` is the nearest
  walkable cell to the object plus `useFrom`, so it can jump to the far side of a deeper desk.
  Check (a) watches every station's cell.
- **Gaps between desks:** above. Walkers keep their 18 × 10 box. The experiment showed 24 px
  passes, and the audit lists everything under that.
- **Sight occlusion.** Guards' cones use `npc-sight-occlusion.js`. There a prop blocks sight
  only if it is a scenario object with `"blocksSight": true` (no scenario sets it) or its key
  matches `rack|shelves|bookcase|vending|locker|filing|cabinet|inverter|chiller` at 50 px or
  taller. No desk matches, so **no cone changes**. `batrack`, which matches, is on
  `legacyBox`. `hasWorldPhysicsLineOfSight` does see the bigger bodies. It drives path
  smoothing (npc-pathfinding.js:789–810) and the chase "close in directly" and refresh checks
  (npc-behavior.js:1925, 1948), so a chaser may take one more path step round a desk end. No
  gameplay rule depends on it.
- **Pushed chairs** stop against desks sooner from behind and at the ends (`object-physics.js`
  43–50 collides every chair with every immovable body). That is the point of G.

### 4.4 How it's caught

1. **Walk audit** (slice 0), scoped (R1 m5): for each map being opted in, every scenario that
   uses it, `legacy` against `footprint`, same game rows; plus the five-room sample and the
   swivel-chair rooms for the landing rule. Checks (a)–(d) and (f)–(h) fail the run outside
   `--allow`, and (e) is the cell list for the review. The grid checks run on a walk grid
   with no NPCs or swivel chairs in it, built after the bodies settle (slice 0), so the two
   records differ only by the desk boxes. Check (g) finds pockets that hold no key point, and
   check (h) finds the 18–24 px player-only gaps the grid's padding hides (R2 M2). Each
   flagged room gets a 2× screenshot with the old and new boxes drawn, and every opted-in map
   gets one whether flagged or not (there are few), so (e) is looked at too.
2. **Room snapshot diff** (a7640b314) after each slice: slice 2 must show no sprite moved or
   flipped (a box isn't a sprite). Slice 3 lists its regrouped items and nothing else.
3. **Patrol and needs regressions**, live on :3001, each scenario run twice from the same
   game row, with `window.__deskBoxes` set by an init script. Each runs when a map it uses is
   opted in (the lab now; m03, m07 and the needs scenarios only when their maps are), and the
   needs scenarios also run once after slice 1 for the global landing rule. Each run records: stuck-in-wall
   log lines, waypoint arrivals per NPC, needs cycles finished and time away from post, and
   the scenario's own beats.
   - m03 (`m03_ghost_in_the_machine`) and m07 (`m07_architects_gambit`): the guard patrols,
     chase and leash.
   - Len in `lab_physical_pentest`: his route to the records door and the PIN-surf beat
     (`len_at_door`, `kp_pin_surfed`), plus the door gate (`openFor: ["len"]`).
   - `test_needs_sims`: every needs routine at desks, the coffee and back to the same chair
     (80c2a8dd5).
   - `test_needs_leash`: the leash and return.

   Pass: footprint runs no worse than legacy on every count, no new stuck lines, every beat
   fires. These are scripted runs, so they go to Haiku, with a Sonnet check of any "stuck"
   claim (the playtest model split).
4. **A validator warning** (Ruby, reading `table_surfaces.json` and the map JSON), keyed on
   the map (R1 m6): for every scenario room whose map has `deskBoxes: footprint`, an NPC
   position, waypoint or seated chair foot inside a footprint box. No scenario field is added,
   so `known_room_fields` doesn't change. Static, cheap, and it catches new scenarios on
   opted-in maps.

### 4.5 Opt-in per map, for good

Footprint boxes stay opt-in (slice 2), set on the map. There is no default flip (R1 M3).
Reasons:

- the user's goal is the accounts floor and future rooms; the lab needs the footprint box now,
  and nothing else does;
- a flip would change walkability in 102 rooms nobody is redecorating, and need a regression
  campaign over shipped missions (m03, m07, the lab, the needs scenarios) for a tidier sitter
  from behind;
- the fallback is exactly today's box, so a legacy map is untouched;
- generators set the property, so every new room gets footprint boxes, and maps join as their
  missions are redressed (slice 8).

The landing rule (slice 1) is the only global change, because it fixes a bug in every room.

## 5. The chairs the experiment didn't test

| Chair | Placements | Frame, body today | What's unknown |
|---|---|---|---|
| `chair-darkgray-1` (tested) | 32 in 9 rooms | 40 × 40, `{18, 8}` at (11, 31) | none |
| `chair-grey-1`, `chair-grey-4` | 13 + 12 in 9 + 4 rooms | 40 × 40, the same body (rooms.js:770–775); start offsets differ by 1–2 px | whether the castor base is at the body centre in all 8 frames |
| `chair-white-1/2-rotateN` | 32 | 32 × 32, generic body 22 × 10.7 at (5, 21.3) | castor centre, block height and contact numbers (width at least 18, the walker's, by the block width rule; the body's 22 may simply stay) |
| `chair-exec-rotateN` | 4 | 38 × 64, generic body 28 × 21.3 at (5, 42.7) | castor centre (likely well below the body centre at y 53), block, and how a tall back looks tucked from behind |
| static chairs (`hospital_chair_*` 106, `exec_chair_*` 28, `aw_chair_*` 21, waiting, club, sofas) | about 190 | no body | nothing physical. Their approach and hop-off spots, and NPCs seated on them, are covered by walk-audit (c) |

Measurement, all free:

1. **Castor centre from the art.** For each rotation sheet, find the opaque pixels in the
   bottom 6 rows of each frame (the castor star). Take the centre of their bounding box, as a
   mean over the 8 frames with the spread. Add a `castor` printout to a small script beside
   `measure_table_surfaces.py`. Accept `office40`'s (20, 35) for grey-1 and grey-4 if they
   agree within 1 px.
2. **Sweep.** Move the experiment driver (`exp.js`) into the repo as
   `tools/playtest/seat-sweep.mjs`, with `--chair` and `--blocks`. Add a row per family to
   `room_test_desk_seating` (with the fixed `room_edit.py`): a white chair and an exec chair at
   `desk1` and `smalldesk1`, front, behind and east end. Run blocks 18 × 6, 18 × 8, 18 × 10
   and the family's own body against the footprint boxes, plus standing (the 1.3 order), as the
   experiment did: 2 families × 4 blocks × 6 cases = 48 rolls. Nothing narrower than 18 (the
   block width rule, R1 M2).
3. **Pick per family** by the experiment's tests: no castor inside a footprint, the hip to
   the desk's edge as in `best_*.png`, the empty chair not left sunk after standing, and the
   landing on the near side. Prefer the family's own body where it passes, as for `office40`
   (Q0). Write
   `SEAT_BLOCKS.white32` and `.exec`, with a contact sheet like `contact_sizes.png` for the
   review.
4. **Static chairs:** one sit and hop-off per static texture that the walk audit finds next to
   an opted-in desk. Most of them aren't near one until slice 8.

Until a family is measured, its chairs keep today's behaviour (1.1, slice 1).

## 6. The office-life session's half

The office-life session owns `npc-needs*`, the needs parts of `seating.js` (`seatNPC` as the
needs path uses it, `updateNeedsSeat`, `needsSeatRef`, `tuckIn`,
`startFetch`/`advanceFetch`, the fidget), `npc-office-visuals.js` and `workstation-state.js`
(`TABLE_SURFACE_PLAN.md` 6). That session has finished slice 15 (HANDOVER_OFFICE_S15.md) and
may be free. This work edits the player parts of `seating.js`, plus the one shared function,
`standSpot`, which `unseatNPC` also calls (slice 1). Both sessions commit in turn, with explicit
paths.

**When the office-life session isn't free (R1 m4; the user agreed).** If slice 6 hasn't
started by the time slices 1–4 have landed, this session builds the NPC half itself, once the
office-life session agrees:
on the office-life plan's own fixture (`test/js/fixtures/needs-sims-world.mjs`) and tests, and
with the office-life session (or, failing that, a fresh Opus reviewer briefed with
`OFFICE_LIFE_HANDOVER_SESSION.md`) reviewing the diff before it is committed. Ask for that
agreement when sending the slice 1 diff for review, so it is settled before it is needed.

**If the office-life session doesn't answer (R2 m7 b).** Two things wait on it: its review of
slice 1 (which touches `unseatNPC`) and its agreement to the slice 6 fallback. Slices 0 and 2–4
don't wait. If neither answer has come by the time slices 2–4 have landed, ask the user
whether to go ahead (slice 1 reviewed by a fresh Opus reviewer briefed with
`OFFICE_LIFE_HANDOVER_SESSION.md`, and slice 6 built here under the fallback), rather than
wait.

**Agreed order for the shared facing code (R2 m7 a, rewritten after R3 m2).** The
office-life plan gained slices 16–21 (bd837adb2, `OFFICE_LIFE_PLAN.md` section 12), and its
revision after its own review (c1111c266) builds them in the order 21, 16, 18a, 17, 18b, 19,
20 (12.8, the "Order" column; section 13). Slice 21 (idle swivel, 12.7) is first, has no
dependencies, and isn't built yet at c938d2fdb. It changes the `want = st.homeFacing` line in
`updateNeedsSeat` (seating.js:1203 at 1c51fabfb) and calls `setChairFacing`; hand-off items 2
(slide target, seating.js:1246) and 6 (fidget clamp, `fidgetChair` 907–928) edit the same
function and its neighbour. So:

1. **Slice 21 lands first; seat box items 2 and 6 rebase on it** (inside slice 6). That order
   is safe: `setChairFacing` only changes the chair's texture and frame counter (301–310),
   never its body or position, so idle swivel can't move a chair the sweep later places.
   Whoever lands second (the slice 6 builder, on this order) re-reads `seating.js` just before
   editing and runs both sessions' `seating.test.mjs` cases.
2. One rule holds and both sides test it: the slide, the tuck, the fidget and the stand-up
   read `st.homeFacing`, never `st.facing`. `fidgetChair` already does (916); slice 1 makes
   `unseatNPC`'s stand do so (R2 m6), and item 4 below does the tuck. With that, idle swivel
   and the player-facing turn change only what is drawn.
3. **The lab changes under slice 21 once slice 7 lands.** Office-life 12.7 and 12.10 say
   slice 21 changes nothing in the lab, because Chris, Melanie and Sofia sit on
   scenario-placed static seats (`lab_physical_pentest/scenario.json.erb` 1115–1121), and only
   Tiled map chairs are swivels (rooms.js 2536–2539). Slice 7 deletes those `aw_chair_*`
   objects and puts five `chair-darkgray-1` swivels in `room_lw_accounts`, so after slice 7
   idle swivel acts on all three. Slice 21's "lab regression: no change expected" holds only
   until slice 7; after it, the lab regression should expect idle swivel on the staff (and
   none on Tomasz, a non-needs seated NPC, if 12.7's rule limits it to needs NPCs).

This session doesn't edit the office-life plan; the order goes to that session in the note
below, and is recorded in its log by that session.

**Note to hand over** (send when slices 1 and 2 have landed):

> Seat box (option G), slice 6 is yours. Plan: `docs/achitechture/SEAT_BOX_PLAN.md`.
> Slices 1–2 added `systems/seat-box.js` (`blockFor(chair)`, `sweepBlock(scene, rect, dx,
> dy, ignore)`, `walkBoxClear`, `pathClear`, `pickStandSpot`) and `systems/desk-footprints.js`
> (`deskBoxOf`). In maps with the Tiled property `deskBoxes: footprint`, desks now have a body
> the size of their floor footprint, full width, ending at the floor line. Office chairs
> (`office40`: darkgray, grey-1, grey-4) keep their own 18 × 8 body, which is the seated block;
> no chair body changes size. The player side is done. **Slice 1 also changed `standSpot`, which `unseatNPC` calls for a seated
> swivel NPC with no `standAt` (seating.js:980 at 1c51fabfb)**: it now follows the order in
> plan 1.3 and never lands across a desk. It floods a local grid that leaves out the chair and
> its sitter (a seated NPC's chair is baked into the world grid by any rebuild), every seated
> NPC keeps `st.approach` (where it sat down from), and the stand uses `st.homeFacing`. When
> nothing is clear and the approach is on the chair (an NPC seated at load), the NPC takes the
> nearest walkable cell, or stays seated and retries next tick; `unseatNPC` can now return
> false with `_seat` kept. You reviewed that diff.
>
> **Your slices 16–21.** Slice 21 (idle swivel) edits the same part of `updateNeedsSeat` as
> items 2 and 6 below. Your plan builds 21 first (order 21, 16, 18a, 17, 18b, 19, 20), so
> items 2 and 6 rebase on it. The slide, tuck, fidget and stand read `st.homeFacing`, never
> `st.facing`, so a swivel or a turn towards the player changes only what is drawn. Whoever
> lands second re-reads `seating.js` and runs both sets of tests (plan section 6, "Agreed
> order"). Slices 16–20 don't touch the seating code this plan changes. **The lab after our
> slice 7:** the staff's static `aw_chair_*` seats become Tiled `chair-darkgray-1` swivels, so
> slice 21's idle swivel then acts on Chris, Melanie and Sofia; your lab regression's "no
> change expected" holds only until then. Please:
> 1. **Block.** Nothing to do: the chair's body is already the block. The NPC's own body stays
>    collision-none and immovable while seated, as now.
> 2. **Slide target.** `updateNeedsSeat` pulls a swivel to the NPC's feet
>    (`slideChairFootTo(near.obj, feet.x, feet.y)`, seating.js:1246 at 1c51fabfb), which puts the chair on
>    the work cell, a tile from the desk. Instead, start from that point and run
>    `sweepBlock` along the facing direction. Stop where the block meets a body, if it does
>    within 24 px. Otherwise keep today's target. That gives castor `F + 4` in front, and the
>    footprint's back edge − 4 behind: the positions the lab patch places by hand.
> 3. **Fetch** (the path item 2 doesn't cover). A needs NPC with `pref: 'fetch'` pushes a
>    chair by hand to the work cell (`startFetch` → `advanceFetch`, seating.js:1266–1330 at
>    1c51fabfb), then `endFetch` → `seatNPC` there, with no sweep. So a fetched chair ends up a
>    tile out from the desk. After `advanceFetch` arrives, and before `endFetch` seats the NPC,
>    run the same sweep as item 2 from the arrival point along the facing direction. Slice 7's
>    pass line (castor at F + 4 ± 1) depends on this path too.
> 4. **`tuckIn`** (seating.js:1258 at 1c51fabfb): move `min(TUCK_PX, sweep distance)`, not a
>    fixed 12 px. `slideChairFootTo` sets the position directly and physics never pushes back,
>    so a fixed tuck puts the chair into the desk. Tuck along `st.homeFacing`: today
>    `unseatNPC` passes the current `facing` (983), so an NPC that stands while turned to the
>    player tucks its chair diagonally.
> 5. **Getting up.** `standAt` stays the home cell. Where there is none, `standSpot` follows
>    plan 1.3 (slice 1). Please confirm the needs path never lands across a desk, and keep the
>    slice 1 NPC stand tests passing (near side, turned to the player, boxed in).
> 6. **Fidget** (`fidgetChair`, 2 px back, 3 px sideways): clamp with `sweepBlock`. Check it at
>    the sides too (castor at the desk's end + 9).
> 7. **Paths round empty swivel chairs.** Chairs are dynamic bodies, not in the grid, and NPCs
>    collide with them (`setupNPCChairCollisions`). Wedging on the accounts floor was the
>    original reason its desks were made non-colliding (2f0562567). Check that needs NPCs pass
>    tucked, empty chairs in the lab and in `test_needs_sims` with no stuck lines.
> 8. **Approach cells in the lab.** Slice 7 moves the four PCs onto the desk tops, at the
>    positions the seated scale audit gives (`SEATED_SCALE_AUDIT.md`; the old sketch had y
>    3.5 / 6.5). `approachCell` (object centre + `useFrom` × 32, nearest walkable cell) moves
>    with them, and a cell that lands inside `desk1`'s footprint box (F − 16 … F) is snapped to
>    whichever side is nearer. So slice 7 sets `useFrom.dy` on `staff_pc`, `staff_pc_2` and
>    `usb_target_pc` from the PCs' final positions, to put each cell back in front of its desk
>    (with the sketch's y it was 1 → 1.5). A general "approach from the desk's contact line" is
>    optional.
> 9. **Depth lifts.** Monitors and lamps now sit in desk groups at `F + 0.5 + 0.01·i`. Check
>    the four relative lifts in `npc-needs.js` (put-down +1, cosmetic +1, tray slot +0.5,
>    left-behind +0.1; `TABLE_SURFACE_PLAN.md` 6, note item 3) with a grouped object in a
>    test.
> 10. **Tests.** Add a footprint desk and an `office40` swivel to
>    `test/js/fixtures/needs-sims-world.mjs`. Sit, stand, tuck, fetch, and wait 2 s, then
>    assert the chair hasn't moved and its body doesn't overlap the desk. Live: `test_needs_sims`
>    (hip against the contact line; back to the same chair after coffee, 80c2a8dd5),
>    `test_needs_leash`, and the lab after slice 7.

## 7. The lab (Part 2)

Rewritten after R1 M7, against the lab after step 9 (b09d50eff, logged in 930dbc221) and its
dialogue pass (3462bf359).

**What it does** (the target, as `part2_lab_desks.patch` in scratchpad `seat-box/` sketched
it before step 9):

- in `room_lw_accounts`, moves desks #44–48 back to `tables`, and the lamps #62–64 and ledger
  #65 onto the desk tops in `table_items`;
- adds four `pc1` placeholders and five `chair-darkgray-1` swivels (front castors at F + 4;
  Tomasz's behind desk #46 at the back edge − 4);
- sets the map property `deskBoxes: footprint` on `room_lw_accounts` (slice 2);
- in `open_plan`, drops `elevation` from the PCs and moves them to y 3.5 / 6.5, and deletes
  the five `aw_chair_*` objects.

**The scratch patch is a reference only.** Its scenario hunk no longer applies
(`git apply --check` fails at `scenario.json.erb:1044` since step 9). Its room hunk still
applies, but it was made with a hand-patched copy of `room_edit.py`. Both halves are rebuilt
(step 1), not applied.

**Order.** It goes in after:

1. **step 9's live proof is logged** in `IMPROVEMENT_LOOP_LOG.md`. This is now met: game 873,
   score 100, 10/10 tasks (log, "Expansion step 9", commit 930dbc221). Re-check just before
   starting that no later lab entry is open, because the lab is still being edited (the
   dialogue pass, 3462bf359, came after);
2. slices 1–4 (landing rule, footprint boxes on the map, the grouping fix, `room_edit.py`);
3. slice 6 (or its fallback, section 6). Without it, needs NPCs pull their swivels out to the
   work cell a tile from the desk, which is not panel 3's look;
4. slice 6a: the scale audit's placement and scale fixes for the lab's desks, PCs, lamps and
   chairs (`SEATED_SCALE_AUDIT.md`). The desk layout and every item position on the desk tops
   below follow the audit; where it changes a desk, that desk's `foot` and contact numbers are
   checked again first.

**The left-behind items (R1 M7).** Step 9 added `pierce_printout` (`notes`, tile (8, 5),
"left on his desk") and `hampshire_badge` (`id_badge`, tile (4, 5), "in Melanie's desk tray"),
both `leftBehindBy` with `revealOnGlobal`. Their top edge is y 160, the floor line of desks #45
and #44, at the desk ends, so today they draw on the floor beside the desks. Moved onto a top
as ordinary items, their depth (bottom + 0.5) would fall below the desk group's F + 0.5 and
the desk would hide them. **Decided: E** (the user: "whichever is simplest to implement"; the
step 9 owner, this session, agrees). The three options, kept for the record:

| Option | What | For | Against |
|---|---|---|---|
| **E (chosen)** | stay ordinary items, moved onto their owner's desk top with `position.elevation`, as the lab's PCs had and `planted_deviceA` keeps (elevation 22) | `revealOnGlobal`, `leftBehindBy` and the "gone" beat are proven on ordinary items (game 873); no new engine path; elevation lifts the depth over the desk group (elevation ≥ F − item bottom + 1) | the one place on the floor where a desk item isn't in its desk's group; it can draw over a sitter's arm by a pixel or two |
| P | a matched `table_items` placeholder (a `notes` and an `id_badge` sprite) at the spot, so the items join the desk group (slice 3 groups an overlapping match) | everything on the desk draws as one group, as the user asked for monitors | reveal and hide on a grouped table item is unproven; it needs a probe first, and the placeholder's own image shows until the item is revealed unless it is hidden too |
| F | leave them on the floor and change the text ("dropped by his desk") | no layout change | the beat's text and look were the step 9 owner's choice; a printout on the floor reads as litter, not a clean-desk failure |

E touches only `position` on two objects whose fields belong to the step 9 beat, and needs no
new engine proof. Their exact spot and elevation on the top follow the scale audit (slice 6a).

**Steps** (Opus implements, since it's judgement-heavy; a fresh Opus reviews):

1. **Rebuild the room half** with the fixed `room_edit.py` (slice 4) against the current
   `room_lw_accounts.json`, not by applying the scratch hunk: tables, table items, the five
   swivels, the four `pc1` placeholders, and `set-map-prop deskBoxes footprint`. Check the
   coffee station and its queue cells are untouched.
2. **Regenerate the scenario hunk** by hand against the current `scenario.json.erb`, as a
   fresh diff (saved in the scratchpad for the reviewer), not the old one:
   - the four PCs lose `elevation` and move onto the desk tops (the sketch's y 3.5 / 6.5,
     unless the scale audit sets a different height on the top); the five `aw_chair_*`
     objects and their ERB comments go;
   - `useFrom.dy` on `staff_pc`, `staff_pc_2` and `usb_target_pc` set from the PCs' final
     positions, so each approach cell is back in front of its desk (6, item 8; 1 → 1.5 only if
     the PCs end at the sketch's y);
   - `pierce_printout` and `hampshire_badge` onto their owners' desk tops with elevation
     (option E): on the top band as the scale audit places desk items, clear of the PC and
     lamp, and within `INTERACTION_RANGE` of the front contact line;
   - a check that `cable_note` stays off the desks (slice 3) and that no new `pc` object
     before `staff_pc_2` steals a placeholder. No `deskBoxes` field in the scenario (it is on
     the map).
3. **Static checks:** `ruby scripts/validate_scenario.rb` (with `--skip-ink --no-graph` if
   the lab's owner is mid-edit), `python3 scripts/check_door_alignment.py`, room depth,
   reopencheck, the snapshot, and the walk audit for `lab_physical_pentest` (allowed to change:
   `open_plan` only). The walk audit's key points add the coffee queue cells (`dx` −1, −2
   from the station's approach cell) and both left-behind items' nearest walkable cells.
4. **Live proof on :3001:**
   - **Score 100:** a scripted full run (Haiku, the playtest-scenario skill), confirmed with
     `verify-run.rb`.
   - **The map loads** with the `objects` tileset inserted below the room tileset at 1500
     (R1 m2): every sprite on the floor has the right image.
   - **Staff at desks:** Chris, Melanie and Sofia seated with the castor at F + 4 ± 1 and the
     hip at the figure the scale audit's seated pose gives (F − 11 with today's pose; R2 m8,
     taken from `SEATED_SCALE_AUDIT.md`'s result, not fixed here). Tomasz behind desk #46 with
     the castor at the back edge − 4 ± 2. The castor lines come from the boxes alone and stay.
     Chairs tucked when their owner is away. Back from coffee to the same chair, including a
     fetch-path NPC. Read through `window.__test` and logged as numbers.
   - **Tomasz stands** (R2 M1): he is a placed, immovable, `seated` NPC behind a desk, the
     cramped case slice 1 covers. Force him to stand once through the console (as a KO
     would; the lab may have no combat) and check he lands on the open side of his chair, not
     inside it and not across desk #46. A test-only step, run on a throwaway game row.
   - **The beats:** every floor beat fires.
     - Len's PIN surf at the records door (`kp_pin_surfed`).
     - The USB drop on Sofia's PC (`usb_target_pc` accepts).
     - The planted device.
     - Caught at the desk.
     - The coffee queue and chatter.
     - The left-behind items: revealed on the desk top, visible over the desk, readable or
       takeable from the front, and the owner noticing the badge gone.
     - The shared printer.
     - The tap-menu pairs from `TABLE_SURFACE_PLAN.md` 7.3 (`captures_terminal`/
       `staff_pc_2`, `staff_pc`/`planted_deviceA`, `usb_target_pc`/`usb_malware_note`) still
       open the right object, plus the left-behind items against the PCs beside them.
   - **Panel 3's look:** a 2× screenshot of the accounts floor, set beside R1's
     `tsreview/mock_accounts.png` panel 3 and `tsplan/mock_layering.png` panel 4. Monitors at
     the back of the tops, lamps on the tops, workers tucked with heads over the lip, and
     Tomasz behind his desk with it drawn over his legs. The user looks at it before the
     commit.
5. Commit the room JSON and the scenario separately, with explicit paths. Who commits the
   scenario is Q6.

## 8. Tests, live proof, risks, open questions

### 8.1 Tests and live proof, per slice

| Slice | Unit and static | Live (:3001, headless, one browser, stopped by PID) |
|---|---|---|
| 0 | `buildWorldGrid` with no options equals the golden array taken before the refactor (fixture world with open side and north doors; R3 m1); `exclude` matched by `body.gameObject` on the same fixture; the diff tool against fixture snapshots (a closed key point, a waypoint in a body, a sunk chair, a seated-only corridor 8–10 px high bordering a pocket for (f), a pocket with no key point for (g), a 20 px side gap closing to 14 px and a 12 px corridor closing to 6 px for (h), a 22 px gap closing to 19 px listed but not failed, walls paired by room and rectangle); the record excludes a seated NPC and its chair; `swap-scenario-game.rb` prints a game id and leaves the Mission table unchanged (count before and after) | **grid hash** (R3 M6): `grid-hash.mjs` on two game rows, one with an opened side door, equal before and after the split commit; the scoped baseline (slice 0): the two first maps and the five-room sample, each recorded twice on the same row with no difference (NPC updates stubbed, gates logged closed; R3 m4); the **stand audit** baseline over every placed swivel chair (R3 M5); the tools print their coverage |
| 1 | `seat-box.test.mjs`, `seating.test.mjs`: each branch of 1.3 (forced 8-cell flood and the voluntary approach rule included), behind `desk1`, cramped, boxed in, the chair counted in the box check, a stale disabled chair body (R3 M2), the baked-chair grid, the full-size local grid and its three edge cases (R3 M1), `standUp` surviving a throw, the player's stand-time facing (R3 M3), the NPC stand cases (near side, turned to the player, boxed in with the approach equal to the castor, nothing within 8 cells so it stays seated and retries; R3 M4), `sweepBlock`, nothing in the engine setting `__seatBox` | `test_desk_seating` on today's and footprint boxes: the 9 cases, behind `desk1` logged with its stand y, a forced stand, a cramped case; `test_seating`'s swivel NPC standing with a baked grid, after a door opening, and the player on its vacated chair; the **stand audit** on the baseline rows, legacy and new order, no new-order landing in a body or across a desk, refusals listed for the user (R3 M5); a regression sit-and-roll in one `room_office` mission; reopen check |
| 2 | `deskBoxOf` (scale ≠ 1 gives null, R3 m6); `mapProperty` (array, object, absent); `applyTableBody`; `set-map-prop` on `Doc`, `Doc` + `.tmj` and `PyDoc`; the validator's legacy-map line; the Python coverage and `--footprint` tests | the 9 cases on footprint boxes against 1.1 (±1 px) and the 18 × 8 column of `compare_12x8_vs_18x8.png`; grid cells over a desk before and after; walk audit for the two opted-in maps; a legacy map unchanged; reopen check |
| 3 | grouping unit test; variant-listener test | `test_desk_seating`'s two `pc` objects, on a desk (grouped) and off every desk (own depth) (R3 M6); snapshot diff lists only the regrouped items; the lab's `cable_note` at its own depth; reopen check |
| 4 | `test_room_edit.py` | none (tool only) |
| 5 | `blockFor` for the new families | the 48-roll sweep and its contact sheet |
| 6 | office life's fixture tests (6, item 10), including fetch | `test_needs_sims`, `test_needs_leash`, the lab |
| 6a | the scale audit's own checks; `--footprint` again for any desk whose art or scale it changes | slice 2's rolls again for a changed desk |
| 7 | validator, door alignment, depth, reopencheck | score 100, seated staff numbers, beats, panel 3 screenshot (7) |
| 8 (per map) | the walk audit clean for every scenario on that map | the 4.4 regressions that touch the map; for a shared map, a blind look at it |

Look at every screenshot before calling a slice done. A claim that a slice is fixed needs the
live path, not only a unit test that passes.

**Order of tests and commits (R3 m7).** As section 3 sets out: the fast node tests for the
touched modules before an engine commit; commit your own files with explicit paths before any
live or browser check, because the tree is shared; straight after, the full node suite, the
Rails suite, the reopen check (slices 1–3) and the live column above; fixes in a follow-up
commit before any later slice builds on it. A slice is done when its live column passes, not
when it is committed.

### 8.2 Risks

- **Paths close in shared rooms.** Only when a map is opted in (slice 8); a shared map such as
  `room_office` (64 scenarios) goes in only when the walk audit passes for every scenario on
  it. No default flip.
- **NPCs inside new boxes** loop in the unstick routine. Walk-audit check (c) covers this,
  plus the validator warning.
- **Sunk chairs at load.** One known (`room_lw_briefing`, a legacy map until its mission is
  redressed). Check (d) finds any more when a map is opted in, and the fix is a 1–6 px move in
  place.
- **Wrong footprints** for deep-topped tables or hand-measured props block too much or too
  little. The contact-sheet review, and the fallback for anything not yet checked.
- **The exec chair from behind.** Its 64 px back may cover the desk behind it oddly when
  tucked. Seen in the slice 5 sweep before its block is written.
- **The side case** draws one column of the castor star under the desk's end leg (1.1,
  `compare_12x8_vs_18x8.png`). Q7.
- **The scale audit changes a desk** after its `foot` is measured: slice 6a re-measures and
  re-rolls that desk before slice 7.
- **No landing spot** in a cramped corner: the order in 1.3. A voluntary jump-off with nothing
  clear stays seated with "No room to stand up here."; a forced stand (KO, punch, block, chair
  gone) takes the 8-cell flood fill, then the approach point. Forced stands avoid desks except
  in the boxed-in case, where the player goes back to where they sat down; after a long roll
  that point can be across a desk, which is accepted as the last resort (R3 M4). NPCs take
  their approach point only if it is off the chair, then the nearest walkable cell (which
  can't cross a desk), and otherwise stay seated and retry each tick with one warning; never
  "stand inside the chair".
- **A seated NPC that can't stand** (R3 M4) stays posed while hostile or KO until a cell opens.
  It needs a ring of blocked cells 8 deep round its chair, which no audited room has; the
  warning names it if one ever does.
- **A stale or baked world grid** (R2 M1): seated NPCs' chairs and bodies stay in the grid
  until the next rebuild. Stand-ups use the local stand grid, built from live bodies. The world
  grid itself is unchanged by this plan, so NPC paths still route round a chair someone has
  just left until the next rebuild, as today.
- **The landing rule is global**, including NPC stand-up (`unseatNPC`). The stand audit over
  every placed swivel chair (slice 0 baseline, re-run in slice 1; R3 M5), the slice 1 NPC
  tests, and office life's review of the diff cover it. A voluntary jump-off that used to land
  (often on or across a desk) can now refuse; the audit lists every such chair for the user.
- **The walk record's grid differs from the live grid** on purpose (no NPCs or swivel chairs).
  A pocket that only a seated NPC's chair closes isn't flagged; that closure is temporary and
  changes with whoever sits.
- **Shared tree.** `seating.js` is shared with office life and the lab is being edited by
  another agent. Commit in turn with explicit paths, re-read files just before editing, and
  never stash, `checkout --` or reset.
- **The `__deskBoxes` / `__seatBox` overrides** are test-only. A unit test asserts that
  nothing in the engine sets them (as the prototype's test does).

### 8.3 Open questions (recommended default first)

- **Q0. Seated block for the office chairs.** **Settled by the user: the chair's own 18 × 8
  body**, unchanged, with footprint boxes on the desks. The 12 × 8 block, the empty chair's
  `keep` and Q2 (block at load) are removed.
- **Q1. Where does the footprint opt-in live?** Settled by R1 M3: on the map (Tiled property
  `deskBoxes: footprint`), opt-in for good, set by generators for new rooms and per map when a
  mission is redressed. No default flip. The user can still ask for a flip later.
- **Q2.** Removed with Q0 (no chair body changes, so there is nothing to apply at load).
- **Q3. Who checks the hand footprints?** Default: a review page with crops, the proposed
  box and number boxes, filled by an agent and checked once by the user.
- **Q4. Do unreserved Tiled table items follow the overlap rule too?** Default: yes. 10 items
  in 7 rooms change depth (slice 3); each flipped pair on the snapshot diff gets a look.
- **Q5. `smalldesk1` `foot`: 28 (tested) or 27 (measured)?** Settled by R1 m1: 27
  (`measured`), so one rule covers every measured texture; the 1 px is inside slice 2's ±1 px
  check.
- **Q6. Who commits the lab scenario?** Default: this work prepares it (step 9 and the queue
  have landed), and the lab's owner or the user commits.
- **Q7. Side-on chairs at a desk end.** Default: accept the castor star partly under the end
  leg (it reads as "at the end of the desk"; 1 column with the 18 × 8 body). The alternative, lifting side-facing chairs by +1 depth near
  a desk, risks drawing the chair over the desk's top.
- **Q8. Rooms the walk audit flags when a map is opted in (slice 8).** Default: move the desk a few px in place with
  `room_edit.py`. `legacyBox` only for a room whose layout can't move, and closures between
  touching desks accepted as fixes.
- **Q9. Other missions' desks on the `items` layer** (bodiless, as the lab's were). Default:
  out of scope. The validator can list them, and moving one is that mission owner's call.
- **Q10. The left-behind items on the accounts desks** (section 7). **Settled: E**, ordinary
  items on the desk top with `elevation` (the user: "whichever is simplest to implement"; the
  step 9 owner, this session, agrees). Their spot on the top follows the scale audit.

## 9. What happens to the table-surface plan

- **Dropped:** `collides: false`, `onTable`, the opted-in-group rules built on them
  (`TABLE_SURFACE_PLAN.md` 4.0 items 1–3), lint 3's `collides: false` message, and the
  accounts quick fix 7.0 (the Part 2 patch replaces it).
- **Kept and reused here:** the JSON file and readers (2.3), the measurer (3), the drawing
  order (0.2, row 1 amended in 1.2), the snapshot tool (7.1 slice 0, built in a7640b314), and
  the variant listeners for grouped objects (built in 0cababc6c).
- **Not needed with G:** the `deskSeat` hip rule and its `kFront`/`kBack` constants (4.2).
  Physics now stops the chair at the desk, so the sitter's line comes from the block and the
  box. Lint 2's job (static chairs placed by hand) stays useful for static chairs. It can come
  back later, reading `foot` from the same file.
- **Still open there, and not part of this plan:** the item snap to the surface band (4.1),
  lint 1 (an item off its desk's top), the generators' `band_frac`. Once desks and items are
  in table groups they can be built on the same file, with `top` and `front` filled in by the
  measurer as it goes.
