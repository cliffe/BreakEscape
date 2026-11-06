# Seat box (option G): build plan

Status: plan for adversarial review, 2026-11-06. No engine, room or scenario file has changed
for it. Main input: `SEAT_BOX_EXPERIMENTS.md` (commit 9df5647b9) and its scratch outputs in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/seat-box/`
(`sweep.json`, `contact_best.png`, `contact_sizes.png`, `part2_lab_desks.patch`, and the two
audit scripts this plan used, `tables_usage.py` and `box_audit.py`).

The user's design, in short:

- While someone sits on a swivel chair, their collision box and the chair's shrink to a small
  block at the centre of the chair's castor base. The desk keeps a box of its own. A chair rolls
  in until the block meets the desk box and physics stops it there, so a chair is never drawn
  behind or inside a desk.
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

## 1. The design and its numbers

### 1.1 Numbers, each traced to its evidence

| What | Value | Evidence |
|---|---|---|
| Seated block | **12 × 8 px**, centred on the castor base | 216 rolls: 4 desk boxes × 6 block sizes × 9 cases (`sweep.json`; EXPERIMENTS "Measurements"). Stops move by half the block. Below 8 px high the sitter tucks further in than looks natural against `desk1`'s legs. At 16 × 12 a gap shows at the desk ends (`contact_sizes.png`, rows 1–4). 12 × 8 matches the 18 × 8 body's height, so the empty chair's body fits where it stopped |
| Castor base | the centre of the chair's existing body for the office chairs: `{w 18, h 8, x 11, y 31}` in the 40 × 40 rotation frame | `STATIC_SWIVEL_PROPS` for `chair-darkgray-1`, `chair-grey-1` and `chair-grey-4` (rooms.js:770–775); the prototype centres on it (`sitOn`, seating.js:461–466). The other families are unmeasured (section 5) |
| The empty chair keeps the block | `keep: true` | Without it, standing restores the 18 × 8 body sunk into the desk box. Arcade only separates up to 4 px (`OVERLAP_BIAS`) without motion, so the chair stayed sunk at 4 × 4 to 8 × 6 from the front, and at every size under 18 wide at the sides (EXPERIMENTS "Standing up") |
| Desk box | **the floor footprint**: from `F − foot` to `F`, the desk's full opaque width, no side inset | From behind, the bottom-quarter box let the castor stop 2–4 px inside `desk1`'s footprint and 12–16 px inside `smalldesk1`'s (rolled under the top). The footprint box stops it 2–6 px behind the back edge (EXPERIMENTS table "From behind"). At the sides, the 10 px inset let the castor stop 1–8 px inside. Inset 0 stops it at the end + w/2 (6 px clear for 12 × 8) |
| `foot` for the tested desks | `desk1` 16, `zds_desk1` 16, `smalldesk1` 28 (sprite rows = floor px) | the experiment's `TOP` table (`exp.js`:10), proved by the sweep. The table-surface measurer gives `smalldesk1` `top 2, front 26` (24 rows), because it leaves out the 2 outline rows and the highlight row. The real top runs over rows 0–26 (the lip starts at row 27), so `foot` is a separate field, not `front − top` (2.2) |
| Front contact | castor at `F + h/2` (F + 4 for 12 × 8); hip `F − 11`; chair depth F + 8.5 over the desk group's F + 0.5 | EXPERIMENTS "From the front"; `best_front_*.png` |
| Back contact | castor `F − foot − 6 … F − foot − 2`; hip 5 px below `desk1`'s top edge; the desk group draws over the sitter's legs | EXPERIMENTS "From behind"; `best_behind_*.png` |
| Side contact | castor at the end + 6; chair depth F − 0.5, so the end leg draws over the front castor and the feet (accepted: it reads as "at the end of the desk") | EXPERIMENTS "From the sides"; `best_east_end_desk1.png`, `best_west_end_zds.png` |
| Landing rule on standing | reject a spot whose 18 × 10 walking box overlaps an immovable body, or whose line from the chair crosses one (sampled at ¼, ½, ¾ with a 2 × 2 probe) | Without it the player landed on the desk top or behind it in 100% of front and side cases, and across the desk from behind. With it every case landed on the near side and walked 50+ px away (EXPERIMENTS "Standing up") |
| Walker box | unchanged, 18 × 10 | Two `desk1`s 24 px apart: the box gap is 24 px with no inset, and the walker crossed it with every desk box |
| Static chairs | unchanged (no body) | `hospital_chair_north` in front of `desk1`: sits correctly, and hops off to the approach spot clear of the desk box (EXPERIMENTS "Static chairs") |

### 1.2 The drawing order with G

`TABLE_SURFACE_PLAN.md` 0.2 still holds, with one change to row 1: no one can stand inside a
desk's footprint any more, because the footprint is the box. A walker behind the desk stops
with their feet at `F − foot − 5` at the nearest, drawn under the desk group. Rows 2 (sitter
behind) and 5 (sitter in front) are now kept in place by physics: the block stops the chair at
the contact line, so a chair foot can't end up between `F − foot` and `F`. The one exception is
the side case above, which is cosmetic.

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
    "smalldesk1": { "foot": 28, "source": "experiment" },
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
number box for each sprite. An agent fills it and the user checks it once (Q3). `smalldesk1` is
the one known disagreement, 27 measured against 28 tested: keep 28 (`experiment`), because 28
is what the sweep proved. Tall-legged tables whose top is deeper than their legs
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
is scaled. `deskBoxOf` returns null (fallback) for rotation ≠ 0, mirrors `x` under `flipX`,
and multiplies by `scaleX`/`scaleY`, so later rooms behave.

## 3. Engine changes, in slices

Each slice is one commit (engine before data), with explicit paths. The node suite
(`bin/test-js`) and the Rails suite run before each engine commit. Any new static import in an
engine module goes on each JS test harness copy list. Ownership is in section 6: slices 1–5
and 8 are this work, slice 6 is the office-life session's, and slice 7 is the lab.

### Slice 0: the walk audit, before anything changes

The room snapshot (a7640b314) records sprite positions and depths. A desk box change moves
neither, so the snapshot can't see this plan's main risk, and it leaves out swivel chairs and
NPCs. So slice 0 adds a walkability record to the same run.

- `room-snapshot.mjs --walk` also writes, for each room:
  - every enabled immovable body (from the same sources as `rebuildWorldGrid`,
    npc-pathfinding.js:269–279);
  - the world grid's blocked cells for the room's rectangle;
  - the **key points**: the player start, each door's approach point, each NPC's spawn and
    patrol or route waypoints, every needs station's `approachCell`, and the nearest walkable
    cell to every interactable object.
- Two init-script switches let one game row be loaded both ways with no scenario edit:
  `window.__deskBoxes = 'legacy' | 'footprint'` (read in slice 2) and
  `window.__seatBox = false` (read in slice 1).
- `walk-audit-diff.mjs before.json after.json` runs a flood fill over each room's grid from its
  doors and reports:
  - (a) key points reachable before and not after;
  - (b) interactables whose nearest walkable cell moves past `INTERACTION_RANGE` (32 px,
    constants.js:65);
  - (c) NPC spawns, waypoints or needs cells now inside a body;
  - (d) swivel chairs whose body overlaps a desk body at load (Arcade won't separate more than
    4 px, so these stay sunk);
  - (e) the cells added per room.

  It exits 1 on (a)–(d) outside `--allow`.
- `test_desk_seating` gets a `Mission` row (`mission.json` exists; `db:seed` is allowed, the
  other `db:` tasks are not). Live checks then use `new-game.rb` like every other scenario,
  in place of the experiment's swapped game row.
- **Baseline:** one `snapshot-games.sh` TSV for all scenarios, then
  `room-snapshot.mjs --walk` with `__deskBoxes = 'legacy'`. Every later slice is compared
  against this baseline, on the same game rows.

### Slice 1: the seated block, the empty-chair block, the landing rule (player)

Files: `seating.js` (the player parts: `sitOn`, `standUp`, `standSpot`, the prototype's
`seatedBlock` and `clearOfTables`) and a new pure module, `systems/seat-box.js`, which the NPC
half (slice 6) imports as well.

- `seat-box.js` exports:
  - `SEAT_BLOCKS`: block per seat family, `{ w, h, cx, cy }` in rotation-frame px, the centre
    being the castor base. `office40`: `{ 12, 8, 20, 35 }`, the centre of the 18 × 8 body at
    (11, 31). `white32` and `exec` stay out until section 5 measures them, and those chairs
    keep today's behaviour (the whole body), so nothing untested changes.
  - `blockFor(chair)`: the family's block, or null.
  - `walkBoxClear(scene, x, y, ignore)`: true when an 18 × 10 walking box with its feet at
    (x, y) overlaps no enabled immovable body. It uses the static and immovable sources that
    `rebuildWorldGrid` uses, so desks, walls, locked doors and immovable furniture all count.
    The prototype looked only at static bodies in `room.objects`, which misses wall boxes.
  - `pathClear(scene, from, to, ignore)`: the prototype's ¼, ½, ¾ samples with a 2 × 2 probe.
  - `sweepBlock(scene, rect, dx, dy, ignore)`: how far a block can move along (dx, dy) before
    it meets an immovable body. Slice 6 uses it for the NPC slide and tuck targets, and it is
    pure geometry over the real bodies, so it needs no footprint data.
- **On sitting** (`sitOn`): the driver's body becomes `blockFor(chair)`, centred on the castor
  base. With no block, the whole body as now.
- **On standing** (`standUp`): the chair keeps the block (`keep`), for chairs with a block only.
- **Landing** (`standSpot`): the order of tries is unchanged (forward, then round the compass),
  plus `walkBoxClear` and `pathClear`. If no spot passes, the current fallback
  (`findNearestWalkableWorldCell(cx, cy + reach, 3)`), then the approach point the player sat
  from (`state.approach`), which was walkable when they sat.
- The landing rule is **global** and not behind a flag. Today's `standSpot` lands the player on
  or behind a desk when the chair faces one (EXPERIMENTS: 100% of front and side cases), and
  that happens with today's boxes too, so this is a fix everywhere.
- The block applies only while someone sits, and to the empty chair after it has been sat on.
  Whether every `office40` chair should start with the block at load is Q2.
- `window.__seatBox` stays as a test-only off switch (`false` = today's behaviour). The
  experiment's `{ w, h }` form goes.

Tests (`seating.test.mjs`, a new `seat-box.test.mjs`): `blockFor` for each family (null for
white and exec until slice 5); `walkBoxClear` and `pathClear` against fake bodies (a desk
between the chair and the spot, a wall box, the chair itself ignored); `sweepBlock` stops at
the contact line from all four sides; and the `standUp` fallback order.

### Slice 2: desk boxes from the footprint data (opt-in)

Files: `table_surfaces.json` (new), `systems/desk-footprints.js` (new), `game.js` (preload),
`rooms.js` (the Tiled table body at 2635–2660 and the mode A body at 2134–2148, through one
shared `applyTableBody(sprite)`), and `measure_table_surfaces.py --footprint`.

- `deskBoxOf(sprite)` returns `{ x, y, w, h }` in sprite px from the entry (with `x`, `floor`,
  scale and `flipX` applied), or null when the texture has no `foot`, is in `legacyBox`, or is
  rotated.
- `applyTableBody` uses the footprint box when the room has opted in and `deskBoxOf` gives
  one. Otherwise it keeps today's box exactly (`w − 20` × `h / 4`, offset (10, `3h/4`)).
- **Opt-in:** a room field in the scenario, `"deskBoxes": "footprint"`. The default is
  `legacy` until slice 8. `window.__deskBoxes` overrides it for the audit. The lab's
  `open_plan` and `test_desk_seating` opt in.
- The body is still cut a frame after creation (`delayedCall(0)`). The sight-occlusion cache
  key already includes body height (npc-sight-occlusion.js:333–334), and the grid rebuild
  runs 200 ms after the load (npc-pathfinding.js:113), so both see the new box. Slice 2 checks
  this live: grid cells over a desk before and after.
- Data for this slice: the three `experiment` entries, the 24 confident `measured` entries
  after a look at the contact sheet, and the `legacyBox` list. The low-confidence textures
  stay on the fallback until their hand values are in (Q3), so they don't hold the slice up.

Tests: `deskBoxOf` for an entry, no entry, `legacyBox`, rotation, `flipX`, scale and `floor`
padding; `applyTableBody` choosing legacy or footprint by opt-in and override; a Python
coverage test (2.4); a Python test that `--footprint` reproduces `desk1` 16 and `smalldesk1` 27
from the PNGs. Live: `test_desk_seating`, all 9 experiment cases (front, behind, sides, the
24 px gap, the static chair), rolled with the arrow keys through `window.__test.walk` as the
experiment did, on both box modes. The footprint numbers must match section 1.1 to ±1 px, and
the screenshots must match `best_*.png`.

### Slice 3: group a matched table item only when it overlaps a desk

File: `rooms.js` only.

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

### Slice 4: `room_edit.py` firstgid check

File: `scripts/room_gen/room_edit.py` (`ensure_sprite`, 283–295). Today it asserts that a new
tileset's `firstgid` is above the highest existing `firstgid` plus its tile count. That
refuses `room_lw_accounts`, whose room tileset sits at 1500, when the `objects` tileset goes
in at 115. The new check is real overlap: the new range `[firstgid, firstgid + tilecount)`
must miss every existing range. An image-collection tileset's range is
`[firstgid, firstgid + max(tile id) + 1)`, and one with neither `tilecount` nor tiles counts
as 1. The message names the clashing tileset. A small `unittest` file
(`scripts/room_gen/test_room_edit.py`) covers a clean insert below a high tileset, a real
clash and the external-`source` case. This slice depends on nothing else and can run in
parallel with slice 1. Slice 7 needs it, so that the lab patch can be made with the real tool.

### Slice 5: the untested chairs (section 5)

Data only, plus tests: measured blocks for `white32` and `exec` go into `SEAT_BLOCKS`, and
grey-1 and grey-4 are confirmed against `office40`.

### Slice 6: the NPC half (office-life session; note in section 6)

### Slice 7: the lab (section 7)

### Slice 8: footprint boxes by default

Once slices 2 and 6 have been live for the lab and the regressions in section 4 pass:

1. run the walk audit over every scenario with `__deskBoxes = 'footprint'`, against the slice 0
   baseline;
2. fix each flagged room with `room_edit.py`: move a desk a few px in place, put a desk on
   `legacyBox`, or accept the closure where walking between two touching desks was a bug;
3. flip the default to `footprint`. `"deskBoxes": "legacy"` stays as a per-room escape hatch.

One commit for the engine default, then one per room JSON, each with explicit paths.

## 4. Blast radius: every desk's box changes

### 4.1 What changes

Today a desk's body is the bottom quarter of the sprite, inset 10 px each side. For `desk1`
(78 × 39) that is 58 × 9.75 px at `F − 9.75 … F`. The footprint box is 78 × 16 at
`F − 16 … F`. The south edge stays at `F`, so nothing changes for someone in front of a desk.
The ends move out by 10 px each. The north edge moves north by `foot − H/4`:

| Desk | Today's depth | Footprint depth | North edge moves |
|---|---|---|---|
| `desk1`, `zds_desk1` | 9.75 | 16 | 6 px |
| `smalldesk1` | 10.25 | 28 | 18 px |
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
  Interaction reach from behind gets 6–18 px longer for items at the back of a top. Walk-audit
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

1. **Walk audit** (slice 0) on every scenario, `legacy` against `footprint`, same game rows.
   Checks (a)–(d) fail the run outside `--allow`, and (e) is the cell list for the review.
   Each flagged room gets a 2× screenshot with the old and new boxes drawn, for a look.
2. **Room snapshot diff** (a7640b314) after each slice: slice 2 must show no sprite moved or
   flipped (a box isn't a sprite). Slice 3 lists its regrouped items and nothing else.
3. **Patrol and needs regressions**, live on :3001, each scenario run twice from the same
   game row, with `window.__deskBoxes` set by an init script. Each run records: stuck-in-wall
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
4. **A validator warning** (Ruby, reading `table_surfaces.json` and the room JSON) for
   opted-in rooms: an NPC position, waypoint or seated chair foot inside a footprint box.
   Static, cheap, and it catches new scenarios after slice 8.

### 4.5 Opt-in first, then the default

Opt-in first (slice 2), default later (slice 8). Reasons:

- the lab needs the footprint box now, and nothing else does;
- 102 rooms change walkability, and the audit's list should be worked through room by room,
  not discovered in playtests;
- the fallback is exactly today's box, so an opted-out room is untouched.

Slice 8 flips the default once the walk audit is clean, or every remaining flag has an
accepted reason in the log.

## 5. The chairs the experiment didn't test

| Chair | Placements | Frame, body today | What's unknown |
|---|---|---|---|
| `chair-darkgray-1` (tested) | 32 in 9 rooms | 40 × 40, `{18, 8}` at (11, 31) | none |
| `chair-grey-1`, `chair-grey-4` | 13 + 12 in 9 + 4 rooms | 40 × 40, the same body (rooms.js:770–775); start offsets differ by 1–2 px | whether the castor base is at the body centre in all 8 frames |
| `chair-white-1/2-rotateN` | 32 | 32 × 32, generic body 22 × 10.7 at (5, 21.3) | castor centre, block size (12 × 8 may be too wide for a 32 px frame), contact numbers |
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
   `desk1` and `smalldesk1`, front, behind and east end. Run blocks 8 × 6, 10 × 6, 12 × 8 and
   16 × 12 against the footprint boxes, plus standing, as the experiment did:
   2 families × 4 blocks × 6 cases = 48 rolls.
3. **Pick per family** by the experiment's tests: no castor inside a footprint, the hip to
   the desk's edge as in `best_*.png`, the empty chair not left sunk after standing. Write
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
may be free. This work edits only the player parts of `seating.js`. Both sessions commit in
turn, with explicit paths.

**Note to hand over** (send when slices 1 and 2 have landed):

> Seat box (option G), slice 6 is yours. Plan: `docs/achitechture/SEAT_BOX_PLAN.md`.
> Slices 1–2 added `systems/seat-box.js` (`blockFor(chair)`, `sweepBlock(scene, rect, dx,
> dy, ignore)`, `walkBoxClear`, `pathClear`) and `systems/desk-footprints.js` (`deskBoxOf`).
> In rooms with `"deskBoxes": "footprint"`, desks now have a body the size of their floor
> footprint, full width, ending at the floor line. A swivel chair with a block (`office40`
> today: darkgray, grey-1, grey-4) shrinks to a 12 × 8 block at its castor base while
> anyone sits on it, and keeps that block once they stand. The player side and the landing
> rule are done. Please:
> 1. **Block.** In `seatNPC`, for a chair with `blockFor(chair)`, give the chair's body the
>    block (centred on the castor). Keep it in `unseatNPC`. The NPC's own body stays
>    collision-none and immovable while seated, as now.
> 2. **Slide target.** `updateNeedsSeat` pulls a swivel to the NPC's feet
>    (`slideChairFootTo(near.obj, feet.x, feet.y)`, seating.js:1178), which puts the chair on
>    the work cell, a tile from the desk. Instead, start from that point and run
>    `sweepBlock` along the facing direction. Stop where the block meets a body, if it does
>    within 24 px. Otherwise keep today's target. That gives castor `F + 4` in front, and the
>    footprint's back edge − 4 behind: the positions the lab patch places by hand.
> 3. **`tuckIn`** (seating.js:1190): move `min(TUCK_PX, sweep distance)`, not a fixed 12 px.
>    `slideChairFootTo` sets the position directly and physics never pushes back, so a fixed
>    tuck puts the chair into the desk.
> 4. **Getting up.** `standAt` stays the home cell. Where there is none, `standSpot` already
>    has the landing rule (slice 1); please confirm the needs path never lands across a desk.
> 5. **Fidget** (`fidgetChair`, 2 px back, 3 px sideways): clamp with `sweepBlock`. The
>    experiment says 12 × 8 clears, but check it at the sides.
> 6. **Paths round empty swivel chairs.** Chairs are dynamic bodies, not in the grid, and NPCs
>    collide with them (`setupNPCChairCollisions`). Wedging on the accounts floor was the
>    original reason its desks were made non-colliding (2f0562567). Check that needs NPCs pass
>    tucked, empty chairs in the lab and in `test_needs_sims` with no stuck lines.
> 7. **Approach cells in the lab.** The lab patch moves the four PCs up half a tile (y 3.5 /
>    6.5), so `approachCell` (object centre + `useFrom` × 32, nearest walkable cell) moves
>    16 px north, into `desk1`'s footprint box (F − 16 … F). Slice 7 sets `useFrom.dy` 1 →
>    1.5 on `staff_pc`, `staff_pc_2` and `usb_target_pc`, which puts the cells back. A
>    general "approach from the desk's contact line" is optional.
> 8. **Depth lifts.** Monitors and lamps now sit in desk groups at `F + 0.5 + 0.01·i`. Check
>    the four relative lifts in `npc-needs.js` (put-down +1, cosmetic +1, tray slot +0.5,
>    left-behind +0.1; `TABLE_SURFACE_PLAN.md` 6, note item 3) with a grouped object in a
>    test.
> 9. **Tests.** Add a footprint desk and an `office40` swivel to
>    `test/js/fixtures/needs-sims-world.mjs`. Sit, stand, tuck and wait 2 s, then assert the
>    chair hasn't moved and its block doesn't overlap the desk. Live: `test_needs_sims`
>    (hip against the contact line; back to the same chair after coffee, 80c2a8dd5),
>    `test_needs_leash`, and the lab after slice 7.

## 7. The lab (Part 2)

`part2_lab_desks.patch` (scratchpad `seat-box/`) does the following:

- in `room_lw_accounts`, moves desks #44–48 back to `tables`, and the lamps #62–64 and ledger
  #65 onto the desk tops in `table_items`;
- adds four `pc1` placeholders and five `chair-darkgray-1` swivels (front castors at F + 4;
  Tomasz's behind desk #46 at the back edge − 4);
- in `open_plan`, drops `elevation` from the PCs and moves them to y 3.5 / 6.5, and deletes
  the five `aw_chair_*` objects.

It still applies cleanly to HEAD (`git apply --check` at 9df5647b9, today).

**Order.** It goes in after:

1. the agent now adding expansion step 9 and the coffee queue to the lab has committed. Both
   touch `scenario.json.erb`, and the queue may touch the floor's layout;
2. slices 1–4 (block, landing, footprint boxes, the grouping fix, `room_edit.py`);
3. slice 6. Without it, needs NPCs pull their swivels out to the work cell a tile from the
   desk, which is not panel 3's look.

**Steps** (Opus implements, since it's judgement-heavy; a fresh Opus reviews):

1. Rebuild the room half with the fixed `room_edit.py`, not by applying the scratch JSON
   hunks, which will be stale after step 9. Re-apply the scenario hunks by hand. Add:
   - `"deskBoxes": "footprint"` on `open_plan`;
   - `useFrom.dy` 1 → 1.5 on `staff_pc`, `staff_pc_2` and `usb_target_pc` (6, item 7);
   - a check that `cable_note` stays off the desks (slice 3) and that no new `pc` object
     before `staff_pc_2` steals a placeholder.
2. Static checks: `ruby scripts/validate_scenario.rb` (with `--skip-ink --no-graph` if the
   lab's owner is mid-edit), `python3 scripts/check_door_alignment.py`, room depth, reopencheck,
   the snapshot and walk audit for `lab_physical_pentest` (allowed to change: `open_plan` only).
3. Live proof on :3001:
   - **Score 100:** a scripted full run (Haiku, the playtest-scenario skill), confirmed with
     `verify-run.rb`.
   - **Staff at desks:** Chris, Melanie and Sofia seated with the castor at F + 4 ± 1 and the
     hip at F − 11. Tomasz behind desk #46 with the castor at the back edge − 4 ± 2. Chairs
     tucked when their owner is away. Back from coffee to the same chair. Read through
     `window.__test` and logged as numbers.
   - **The beats:** every floor beat fires.
     - Len's PIN surf at the records door (`kp_pin_surfed`).
     - The USB drop on Sofia's PC (`usb_target_pc` accepts).
     - The planted device.
     - Caught at the desk.
     - The coffee queue.
     - The shared printer.
     - The tap-menu pairs from `TABLE_SURFACE_PLAN.md` 7.3 (`captures_terminal`/
       `staff_pc_2`, `staff_pc`/`planted_deviceA`, `usb_target_pc`/`usb_malware_note`) still
       open the right object.
   - **Panel 3's look:** a 2× screenshot of the accounts floor, set beside R1's
     `tsreview/mock_accounts.png` panel 3 and `tsplan/mock_layering.png` panel 4. Monitors at
     the back of the tops, lamps on the tops, workers tucked with heads over the lip, and
     Tomasz behind his desk with it drawn over his legs. The user looks at it before the
     commit.
4. Commit the room JSON and the scenario separately, with explicit paths. Who commits the
   scenario is Q6.

## 8. Tests, live proof, risks, open questions

### 8.1 Tests and live proof, per slice

| Slice | Unit and static | Live (:3001, headless, one browser, stopped by PID) |
|---|---|---|
| 0 | the diff tool against two fixture snapshots (a closed gap, a waypoint in a body, a sunk chair) | baseline snapshot and walk record for every scenario; the tool must print its coverage and fail on a missing `room_office` scenario or a room with tables |
| 1 | `seat-box.test.mjs`, `seating.test.mjs` (1, slice 1) | `test_desk_seating` with today's boxes: sit, roll, stand in the 9 cases, landing on the near side every time; a regression sit-and-roll in one `room_office` mission |
| 2 | `deskBoxOf`, `applyTableBody`, the Python coverage and `--footprint` tests | the 9 cases on footprint boxes against 1.1 (±1 px) and `best_*.png`; grid cells over a desk before and after; walk audit for the two opted-in scenarios |
| 3 | grouping unit test; variant-listener test | snapshot diff lists only the regrouped items; the lab's `cable_note` at its own depth |
| 4 | `test_room_edit.py` | none (tool only) |
| 5 | `blockFor` for the new families | the 48-roll sweep and its contact sheet |
| 6 | office life's fixture tests (6, item 9) | `test_needs_sims`, `test_needs_leash`, the lab |
| 7 | validator, door alignment, depth, reopencheck | score 100, seated staff numbers, beats, panel 3 screenshot (7) |
| 8 | the walk audit clean over every scenario | the regressions in 4.4 on footprint boxes, then one blind look at three high-change rooms (`room_office`, `room_uni_staff`, `room_IT`) |

Look at every screenshot before calling a slice done. A claim that a slice is fixed needs the
live path, not only a unit test that passes.

### 8.2 Risks

- **Paths close in shared rooms.** 102 rooms change, including `room_office` (64
  scenarios). Handled by opt-in, the walk audit, and room fixes before the default flips.
- **NPCs inside new boxes** loop in the unstick routine. Walk-audit check (c) covers this,
  plus the validator warning.
- **Sunk chairs at load.** One known (`room_lw_briefing`). Check (d) finds any more, and the
  fix is a 1–6 px move in place.
- **Wrong footprints** for deep-topped tables or hand-measured props block too much or too
  little. The contact-sheet review, and the fallback for anything not yet checked.
- **The exec chair from behind.** Its 64 px back may cover the desk behind it oddly when
  tucked. Seen in the slice 5 sweep before its block is written.
- **The side case** draws the castor under the desk's end leg (1.1). Accepted in the
  experiment; Q7.
- **No landing spot** in a cramped corner: the player goes back to the approach point. If
  that is now blocked (a pushed chair), they stay seated and get a "no room to stand" line
  (`window.gameAlert`) in place of landing on a desk.
- **Shared tree.** `seating.js` is shared with office life and the lab is being edited by
  another agent. Commit in turn with explicit paths, re-read files just before editing, and
  never stash, `checkout --` or reset.
- **The `__deskBoxes` / `__seatBox` overrides** are test-only. A unit test asserts that
  nothing in the engine sets them (as the prototype's test does).

### 8.3 Open questions (recommended default first)

- **Q1. Opt-in first, then the default?** Default: yes. Opt-in per room (`"deskBoxes":
  "footprint"`) in slice 2; the default flips in slice 8, after the walk audit is clean and
  the regressions pass.
- **Q2. Do empty office chairs start with the block at load?** Default: yes, for the
  `office40` family. A chair that has been sat on keeps the block anyway, so the at-load state
  is one every room reaches in play. Starting there gives one body per chair in all states,
  and leaves fewer chairs sunk at load. The cost: the empty chair's body is 6 px narrower, so
  walkers and NPCs pass 3 px closer on each side, and the walk audit's check (d) covers it.
  If the user prefers the tested behaviour only, the block starts on the first sit.
- **Q3. Who checks the hand footprints?** Default: a review page with crops, the proposed
  box and number boxes, filled by an agent and checked once by the user.
- **Q4. Do unreserved Tiled table items follow the overlap rule too?** Default: yes. 10 items
  in 7 rooms change depth (slice 3); each flipped pair on the snapshot diff gets a look.
- **Q5. `smalldesk1` `foot`: 28 (tested) or 27 (measured)?** Default: 28, because it's the
  value the sweep proved. One px only matters from behind.
- **Q6. Who commits the lab scenario?** Default: this work prepares it after step 9 and the
  queue land, and the lab's owner or the user commits.
- **Q7. Side-on chairs at a desk end.** Default: accept the castor under the end leg (it reads
  as "at the end of the desk"). The alternative, lifting side-facing chairs by +1 depth near
  a desk, risks drawing the chair over the desk's top.
- **Q8. Rooms the walk audit flags in slice 8.** Default: move the desk a few px in place with
  `room_edit.py`. `legacyBox` only for a room whose layout can't move, and closures between
  touching desks accepted as fixes.
- **Q9. Other missions' desks on the `items` layer** (bodiless, as the lab's were). Default:
  out of scope. The validator can list them, and moving one is that mission owner's call.

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
