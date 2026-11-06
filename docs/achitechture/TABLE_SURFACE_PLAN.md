# Table surfaces: plan

Status: plan and measurement prototype only. First version 2026-11-06 (74ca26e20);
revised the same day after review round 1 (`TABLE_SURFACE_PLAN_REVIEW_R1.md`, 1 B, 10 M,
10 m) and the user's answer to B1. No engine code or scenario has changed. Prototype:
`scripts/room_gen/measure_table_surfaces.py`.

The report: PC monitors sit too far north of the desk they are on, and NPCs sit too far
south of their desk instead of right up against it. The question: does each table need a
mapping of its top, and is one value (the y where the top starts) enough?

Short answer: two values per sprite, `top` and `front` (sprite rows), are enough for both
faults. Everything else the engine needs can be derived from them and the sprite's own
height. A few sprites with things drawn on their tops also need a back-panel range or x
insets, entered by hand.

The user's rule (2026-11-06) sets how items on a desk are drawn: they belong to the
desk's **table group** (the Tiled `tables` and `table_items` layers, scenario
`tableItems`, the group's `baseDepth`) and draw by the group's depth rule, never raised
with a hand-set `position.elevation`. Section 0 states the drawing order; section 4.0
extends the existing table-group code to cover the cases it misses today. Section 8 lists
every R1 finding and what became of it.

All y values below are room pixels (y down) unless marked "sprite rows". Tiles are 32 px.

## 0. Decisions and the drawing order

### 0.1 What the user decided

- **The look is R1's mock panel 3** (`…/scratchpad/tsreview/mock_accounts.png`): the PC
  and the banker's lamp stand at the back of the desk, the keyboard on the top, and the
  worker tucked in against the desk with the head and shoulders over the lip.
- **Q1 is closed.** "Floating too far north" meant the accounts floor PCs: the monitor and
  keyboard sprite reads as hovering over the desk's front lip. Section 1.3's geometry
  (bases 14 px south of the front edge) is the fault the user saw.
- **Layering:** "These aren't layered correctly. Monitors should be on a table items
  layer." Panel 3 drew the PC and lamp with their own-bottom depth (135.5), so the desk
  (160.5) was drawn over them: the keyboard, the PC stand and the lamp's foot vanished
  behind the top, and both seemed to perch on the back edge. In a table group they draw
  over the desk.

Panel 3's positions on `desk1` (top 121, front 137, floor 160): PC top 112, base row 135
(front − 2); lamp base row 135; hip 154; north chair foot 167. The monitor (rows 0–14,
y 112–126) rises 9 px past the back edge, which is how a monitor at the back of a 16-row
top looks in this projection; the keyboard (y 130–135) lies on the top.

### 0.2 The drawing order in a table group

Depths are the engine's (`setDepthAndStore`, `updatePlayerDepth`, `poseSprite`): an
object's depth is its bottom + 0.5; the player and walking NPCs use feet + 0.5; a sitter
uses its chair's depth − 0.01 when facing north (the chair back drawn over it) and + 0.01
otherwise. With `F` = the desk's floor line (sprite bottom) and `n` items in the group,
from back to front:

| # | What | Depth | Condition that keeps it in its place |
|---|---|---|---|
| 1 | Player or NPC walking behind the desk | feet + 0.5 < F + 0.5 | feet north of `F`. On a colliding desk the body stops them at the box; on a `collides: false` desk they can stand inside the footprint (feet `F − 16 … F`) and the desk's front hides their legs: the intended walk-behind effect |
| 2 | Sitter behind the desk (facing south) and their chair | chair foot + 0.5 ± 0.01 < F + 0.5 | chair foot ≤ `F − 1`; the 4.2 rule puts it at about `northContact − 3` |
| 3 | The desk | F + 0.5 (+ back-wall elevation, if any) | the group's `baseDepth` |
| 4 | Items on the desk, back to front | F + 0.5 + 0.01·i, i = 1…n, ordered by **base row** | i ≤ 49, so the group stays below F + 1. A stacked item (`onTable: "<item id>"`) goes straight after its host |
| 5 | Sitter in front of the desk (facing north), with the chair back over them | chair foot + 0.5 − 0.01 | chair foot ≥ `F + 1`. True for every chair the 4.2 rule places (the smallest seat-to-foot drop is 13 px) |
| 6 | Player or NPC walking in front | feet + 0.5 > F + 1 | feet south of `F + 0.5`; a player whose feet are within half a pixel of `F` is drawn between the desk and its items, which no one can see |

Rows 1–2 are drawn under the items, so a monitor on the desk covers the torso of the
person behind it, as it should. Rows 5–6 are drawn over the items, so the tucked worker's
head covers the lower part of the monitor (R1 m6: 35% of the screen on the accounts PCs;
the user chose this look). Wall items keep their back-wall elevation and are not table
items.

### 0.3 The mock's faults against this order

`…/scratchpad/tsplan/mock_layering.png` (from `tsplan/mock2.py`, same inputs as R1's
`mock.py`): panel 1 is today, panel 2 is R1's panel 3 as drawn, panel 3 is the same
positions in the desk's group, panel 4 adds a sitter behind and walkers behind and in
front.

| Mock (R1 panel) | Fault | Breaks row |
|---|---|---|
| Now | PC at 171.5 (elevation 20) sorts over anyone with feet up to 11 px south of the floor line; keyboard over the lip | 4 and 6 (item out of the group, own depth past F + 1) |
| Now | lamp at 162.5 (Tiled bottom 162, items layer) is a floor object in front of the desk, not on it | 4 |
| Panel 2 (PC base 135, sorted by own bottom) | desk drawn over the PC: keyboard and stand hidden | 4 (item depth 135.5 < F + 0.5) |
| Panel 3 (lamp base 135, sorted by own bottom) | desk drawn over the lamp's stand and foot, so the shade floats over the back edge | 4 |
| Panels 2–3 | sitter correct (167.49, over everything on the desk) | none |

## 1. What goes wrong today, and why

### 1.1 Anatomy of a desk sprite

Every desk is drawn in the same three-quarter view. From `desk1.png` (78×39), row by row:

| Sprite rows | What it is |
|---|---|
| 0–15 | the flat top (the usable surface, 16 rows deep) |
| 16–18 | the dark front lip |
| 19–38 | legs and the drawer pedestal, with the floor showing between them |
| 39 | floor line (sprite bottom): where the desk stands |

An item stands on the desk when its base row (lowest opaque row) falls between the back
edge (row 0) and the front edge (row 16). Below row 16 it is drawn over the lip or the
legs and reads as hanging off the front or floating in front of the desk. Above row 0 it
hangs over whatever is behind the desk.

Nothing in the engine knows where rows 0 and 16 are. Every placement path uses a guess.

### 1.2 How an item "on" a table gets its y

There are four paths, and none of them knows where the top is:

1. **Scenario object with tile coordinates** (`position: {x, y}`), `rooms.js` ~2289–2293
   and ~2323–2326. The sprite's top-left goes to `room + (x, y) × 32`, origin (0,0). The
   author picks `y` by eye in 1/32-tile steps, and because the item then sorts by its own
   bottom, they add `position.elevation` to push it in front of the desk
   (`setDepthAndStore`, ~426–450: depth = bottom + 0.5 + elevation).
2. **`tableItems`, mode A** (a table the scenario creates, ~2192–2216). Items are spread
   across the width and their bottom goes on the **sprite bottom**:
   `targetBottomY = tableSprite.y + tableSprite.height`. That is the floor line, not the
   top. On `desk1` it puts every item 23 px south of the front edge (39 − 16); on
   `desk-ceo2` 27 px (61 − 34).
3. **`tableItems`, mode B** (the nth Tiled table). Items from a `table_items` layer keep
   their Tiled position; any other item gets the same sprite-bottom rule as mode A.
4. **Tiled `table_items` placed by the room generators**, `scripts/generate_rooms.py`
   `place_on_table`.
   The base goes at `surface_frac × sprite height` from the top, and the header tells
   authors to use 0.15–0.50 for every desk. That fraction is right for `smalldesk1`
   (front at 26/41 = 0.63) but wrong for `desk1` (16/39 = 0.41) and `hospital_desk1`
   (18/48 = 0.375): at 0.5 an item lands 3.5 px and 6 px south of their front edges.

Only `test_table_items` uses `tableItems` (modes A and B); real missions use paths 1 and 4.
`position.elevation` is used by 15 objects in three scenarios, 13 of them in
`lab_physical_pentest`.

**Which of these join a table group today** (`rooms.js` ~1952–1971, 2296–2312,
2381–2426). Groups are built only from the Tiled `tables` layer, plus mode A tables. An
item joins one in three ways: it is in a `tableItems` list; it is an unreserved Tiled
`table_items` object; or it is a scenario object that happened to match a Tiled
`table_items` / `conditional_table_items` placeholder by type, in which case
`findClosestTable` picks the overlapping table, or else the nearest by centre. Path 1
objects with no placeholder (every accounts PC) never join a group, and nor does anything
on a desk in the `items` layer, because that desk has no group. Items in a group are
sorted by `sprite.y`, not by base row.

### 1.3 The evidence: lab_physical_pentest, accounts floor (`open_plan`, `room_lw_accounts`)

Screenshots: `…/scratchpad/lpp-seating/accounts_seated_clean.png` and
`…/scratchpad/lpp-slice3/accounts_slice3_needicon.png` (room drawn at 2×). The desks are
`desk1` in the items layer at x 48 / 184 / 344, top 121, floor line 160 (and a second row
at top 217, floor 256). Measured surface: back edge 121, front edge 137.

| Object | Placement | Base row | Surface band | Error |
|---|---|---|---|---|
| `staff_pc` (`pc` → `pc1.png`, 28×23: monitor rows 0–14, stand 15–17, keyboard 18–22) | tile (2, 4), elevation 20 | 151 | 121–137 | **14 px south** of the front edge |
| `staff_pc_2` | tile (6, 4), elevation 20 | 151 | 121–137 | 14 px south |
| `usb_target_pc` | tile (2, 7), elevation 20 | 247 | 217–233 | 14 px south |
| `usb_malware_note` (`pc`) | tile (3, 7), elevation 22 | 247 | 217–233 | 14 px south |
| `planted_deviceA` (`icon_deviceA`) | tile (3, 4), elevation 22 | 143 | 121–137 | 6 px south |

In the crops the monitor face fills the desk top (rows 128–142) while the keyboard is
drawn over the lip and the pedestal (the pink keys sit in front of the grey drawers). The
base is too far **south**, not north. What reads as "floating" is the combination of three
things:

- the monitor's screen sits at the back of a shallow 16-row top, with the keyboard below
  the lip, so the PC and the desk don't share a contact line;
- `elevation: 20` makes the PC's depth 171.5 against the desk's 160.5, so anyone standing
  up to 20 px south of the desk is drawn behind the PC;
- the sitter is 36 px south of the front edge (below), so the monitor looks far away from
  the person using it.

Where the base really is north of the top (the literal reading of the report), it is in
other missions; see 1.5. A placement from measured data fixes both directions. The user
has since confirmed the accounts reading (0.1), so Q1 is closed.

**Seated staff.** The chairs are static `aw_chair_north_*` (16×26, seat point [8, 13]),
placed by tile one row south of each PC: `hampshire_chair` (2, 5), `pierce_chair` (6, 5),
`lord_chair` (2, 8), and the empty `spare_desk_chair` on the second row. Chair top 160 (= the desk's floor
line), so the sitter's hip lands at 173:

- 13 px south of the desk's floor line (160),
- 36 px south of the desk's front edge (137).

A seated figure's head top is about 36 px above the hip, at ~137 (R1, from
`ev_accounts_crop.png`), so the head starts at the desk's front edge and the rest of the
sitter is below the lip. That matches the crop: the backs of the heads start where the lip
ends, with an empty band of floor-coloured leg space between the person and the top.

There is no collision box here: commit 2f0562567 made the accounts desks non-colliding (they
are items-layer sprites, which get no body; `generate_rooms._Uni.solid` would add one). The
contact line is therefore the floor line, 160.

**Tomasz** (`tomasz_chair`, static `aw_chair_south_slate1` 16×32 at tile (11, 4)) sits
**on** the supervisor's desk: the chair spans y 128–160 over the desk's 121–160. Chair and
desk share the floor line 160, so the sitter is drawn over the desk and the front face of
the desk shows behind his legs. A south-facing sitter belongs behind the desk: the chair's
foot at or above the desk's back line in floor space (160 − 16 = 144), and the desk drawn
over his legs. Error: 16 px (19 px to the 4.2 target, foot 141).

**Props on the desks** (R1 M6). The room's own `items` layer (hand-dressed, 963dc0462)
has three `bankers_lamp1` (23×25, Tiled bottoms 162, 162, 258: base 25 px south of the
front edge and 2 px past the floor line) and a `notes_ledger1` (bottom 258 against a
band of 217–233). They are floor objects standing in front of the desks, not items on
them, and no scenario path, `tableItems` list or generator touches them.

### 1.4 How a seated NPC's position comes out

`seating.js` never looks at the desk. The hips go on the chair's seat point
(`poseSprite`, ~769: `seatPoint` = chair top-left + `STATIC_SEATS`/`FAMILIES` anchor,
minus the atlas hip `SIT_HIP`). So the sitter is wherever the chair is:

- **Placed sitters** (`"seated": true`, `seatNPC`): the chair is where the scenario put
  it, in tile steps. The authoring convention is "the PC's tile + `useFrom` dy 1", i.e. the
  chair's top on the next tile boundary. For a `desk1` whose floor line is on a tile
  boundary that puts the hip 13 px south of the floor line; for a desk at an off-tile y
  (the generators place desks at y 140, 150, 152, 189 …) it varies by up to a tile.
- **Needs sitters** (`updateNeedsSeat`, ~1080–1150): the chair search starts from
  `needsSeatRef` (the home cell when within `POST_SNAP` = 48 px, commit 80c2a8dd5). A
  swivel chair is then slid so its foot lands on that point
  (`slideChairFootTo(near.obj, feet.x, feet.y)`). The home cell is
  `approachCell(obj)` = nearest walkable grid cell to the object's centre + `useFrom` × 32.
  So the chair's foot is on a pathfinding cell centre, which sits a body-clearance away
  from any collision box (the grid pads bodies by a cell horizontally and 2 px
  vertically). The sitter can never come closer to the desk than the walkable grid lets a
  standing NPC come. Only swivel chairs are slid (`seating.js` ~1141); a needs NPC on a
  scenario static chair, as Chris, Melanie and Sofia are on the accounts floor, sits
  wherever the scenario put the chair (R1 M3).

That is the root cause for both kinds of sitter: the chair is put where a standing person
would stand, and nothing pulls it in to the desk edge.

Table collision, where a desk has one, is the bottom quarter of the sprite inset 10 px
(`processObject` ~2624–2650 and mode A ~2121–2133). For `desk1` that is 9.75 px tall at
sprite rows 29–39: shallower than the 16-row top, so the collision covers the legs, not
the desk's footprint.

### 1.5 The same faults in other missions

From a scratch audit (`…/scratchpad/table-surface/audit_on_table.py` over every rendered
scenario, desks limited to the 26 sprites the prototype measures with confidence, each base
row the item's lowest opaque row):

| Mission, room | Object | Desk | Base | Band | Error |
|---|---|---|---|---|---|
| m10_full_disclosure, `core` | `core_access_key` ("an envelope on the desk") | `zds_desk3` | 166.6 | 131–147 | 19.6 px south |
| m10_full_disclosure, `server_hall` | `release_staging_card` ("tucked under the console's edge") | `desk1` | 121.8 | 79–95 | 26.8 px south (past the floor line: intended or not, Q4) |
| m09_digital_archaeology, `reading_room` | `catalogue_login_slip` | `desk1` | 79.4 | 51–67 | 12.4 px south |
| sis01_healthcare, `major_incident_room` | the ransom note (`notes`, tile (6, 4)) | `hospital_conference_table` | 141 | 147–175 | **6 px north** of the back edge |
| sis02_energy, `scada_control_room` | `incident_response_folder` | `smalldesk2` | 101 | 66–90 | 11 px south |
| m02_ransomed_trust and sis01_healthcare, `it_department` / `it_security_office` | Tiled `pc5`, `notes1` (generator `surface_frac` 0.5) | `hospital_desk1/2` | 125, 127 | 104–120 | 5, 7 px south |
| ca12_visitor_tailgater, `lobby` | Tiled `pc8` | `zds_desk1` | 224 | 195–211 | 13 px south |
| lab_physical_pentest, `briefing_room` | `kit_deviceB` (elevation 30) | `lw_credenza1` | 58.4 | 41–48 | 10.4 px south |
| lab_physical_pentest, `reception` | Tiled `hq_badge_printer1` | `lw_credenza1` | 176 | 161–168 | 8 px south |
| test_seating, `seat_office` | `dale_pc`, `nadia_pc` | `zds_desk1` | 183 | 139–155 | 28 px south |

The stock `room_office` template's `office-misc-lamp3` measures 11.7 px south of `desk1`'s
front edge in about 40 scenarios; it is a Tiled placement whose object is scaled, so check
it by eye before counting it.

No other scenario places a sitter by a desk with explicit coordinates, so the seating
fault outside lab_physical_pentest is the needs path (1.4), which every needs mission
shares.

## 2. The data

### 2.1 One value or more?

One value is not enough. The y where the top starts (`top`) stops items floating north,
but it cannot tell where the top ends, and most of the faults above are items south of
the front edge. A second value, `front`, the first row of the front face below the top,
closes the band. It is also the line a south-side sitter's torso meets.

With `top` and `front` in sprite rows and the sprite's floor line (its bottom row) the
engine can derive everything else:

| Derived | Formula (room px; `y0` = sprite top, `H` = sprite height) | Used for |
|---|---|---|
| surface band | `y0 + top` … `y0 + front − 1` | where an item's base may go |
| depth of the desk on the floor | `front − top` | the footprint |
| south contact line | `y0 + H` (the floor line; a table's collision box ends there too) | where a north-facing sitter's body meets the desk |
| north contact line | `y0 + H − (front − top)` | where a south-facing sitter's body meets the desk |

The north line assumes the top's depth in rows equals its depth on the floor (R1 m10).
That holds for `desk1`; for tall-legged tables such as `hospital_conference_table` (top
28 rows, legs 25) it is checked with a south-facing sitter in the test scenario (slice 6)
before the lint trusts it.

Two values are not enough for side-on sprites, oval tops or rotated sprites (R1 m1, m2).
These are handled without new required fields: the two `m09_hatch_counter` sprites and
`foosball_table2` go in a `notSurface` list; `lw_oval_table1` gets wider `inset`s (a
per-row or ellipse shape waits until someone puts an item on it); `surfaceOf` returns
null for a sprite with rotation ≠ 0, and mirrors `inset` and `clear` under `flipX`.

### 2.2 Fields

The smallest set that fixes both faults is the first two. The rest are optional and only
for sprites that need them.

| Field | Type | Default | Meaning |
|---|---|---|---|
| `top` | int, sprite rows | required | first row of the usable top (back edge) |
| `front` | int, sprite rows | required | first row of the front face (front edge) |
| `inset` | `[left, right]` px | `[2, 2]` | keep item centres this far inside the top's ends (rounded or bevelled tops, end panels) |
| `backPanel` | `[row0, row1]` | none | a hutch, screen riser or back panel drawn above the top: items never stand there, and a sitter behind the desk is hidden by it |
| `clear` | `[[x0, x1], …]` px | whole width | spans of the top not already covered by items drawn into the art (`desk-ceo2`'s lamp and plant, `credenza1`'s phone and orchid) |
| `source` | `"measured"` / `"hand"` | | provenance: `measured` came from the prototype and was checked on the contact sheet |

Two top-level lists sit beside `sprites`: `notSurface` (texture keys the measurer's name
filter catches that are not usable tops) and `baseRows` (texture key → `{w, h, baseRow}`
for every item texture, keyed by the engine's `load.image` keys, so `pc` is `pc1.png`
at 28×23 and `notes` is `notes1.png`; R1 m5). The measurer writes both.

A north-side seating edge does not need its own field: it is the north contact line
above. A desk that is only ever used from behind (the reception counters) still uses
the same two numbers.

### 2.3 Where it lives

A new file, `public/break_escape/assets/table_surfaces.json`:

```json
{
  "version": 1,
  "sprites": {
    "desk1":       { "top": 0,  "front": 16, "source": "measured" },
    "smalldesk1":  { "top": 2,  "front": 26, "source": "measured" },
    "desk-ceo2":   { "top": 20, "front": 34, "clear": [[10, 66]], "source": "hand" },
    "hce_trading_station1": { "top": 36, "front": 41, "backPanel": [0, 35], "source": "hand" }
  }
}
```

(`desk-ceo2` and `hce_trading_station1` values are illustrative until checked.)

Why not `scripts/room_gen/catalog.json`: the catalog is not served to the browser, has
1,030 entries of which about 80 are surfaces, and is rewritten by `register_object.py`.
A separate file in the served assets folder can be read by all three consumers:

- the engine, with `this.load.json('tableSurfaces', 'table_surfaces.json')` in `preload`
  (`game.js`, beside the `tilemapTiledJSON` room loads; `objects_tileset.json` is not
  loaded there, as the first version said);
- the validator, which already reads room tilemaps from `public/break_escape/assets/rooms`
  (`geom_room_dimensions`, `validate_scenario.rb` ~5207);
- the generators (`generate_rooms.place_on_table`, `room_edit.py`, the per-site
  `make_*` builders) through one helper in `scripts/room_gen/room_geometry.py`.

Keys are texture keys, as in `STATIC_SEATS`. A sprite with variants (`desk1`/`desk2`/
`desk3`, `zds_desk1`/`zds_desk3`) gets one entry each; they measure the same.

## 3. Measuring it

### 3.1 The prototype

`scripts/room_gen/measure_table_surfaces.py` (free: Pillow and numpy only, no
generation). It reads `catalog.json`, takes the 11 `tables` entries and every `objects`
entry whose name looks like a surface (desk, table, bench, counter, console, workbench,
credenza, sideboard, trestle, carrel, ledge, kitchenette, stall, trolley, plan chest),
minus chairs, lamps and the like, and measures each PNG:

- **Pass 1, top run.** From the first opaque row (skipping a 1–2 px outline), grow a run
  of rows that stay wide and close in colour (median of the middle 60% of each row) to the
  run so far. Accept it if it is 15–75% of the sprite's height and ends at a real edge.
  This is the plain-desk case.
- **Pass 2, dominant band.** For props with things drawn on the top, find runs of rows
  where one colour covers at least 30% of the width, score them by length, share and how
  high they sit, then walk the back edge up while the top's colour still shows round the
  drawn items.
- Confidence from the edge's contrast, the top's evenness, a plausible depth share and
  how much of the top's rows the top colour covers. Pass 2 is capped at 0.55, so nothing
  it finds passes review on its own.

Outputs: `table_surfaces_estimates.json` (per sprite: `surfaceTop`, `surfaceFront`,
`insetL`, `insetR`, `backPanel`, `confidence`, `method`, the rooms that use it) and
`contact_sheet_NN.png` (each sprite at 4×, nearest-neighbour by an integer factor, green
line at the top, red at the front, blue insets, orange back panel). Run:

```
python3 scripts/room_gen/measure_table_surfaces.py --out <dir>
```

### 3.2 Results (run 2026-11-06)

Outputs from this run:
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/table-surface/`
(`table_surfaces_estimates.json`, `contact_sheet_01.png` … `04.png`).

60 sprites measured. Checked by eye on the contact sheets:

| Group | Count | Sprites |
|---|---|---|
| Right, confidence ≥ 0.6 (pass 1) | 26 | desk1, desk2, desk3, smalldesk1, smalldesk2, zds_desk1, zds_desk3, display_table1, exec_desk1, hospital_desk1, hospital_desk2, hospital_conference_table, zds_conference_table1, reception_table1, aes_trestle1, aes_trestle2, m10_steel_bench1, plan_chest2, hq_interview_table1, lecture_ledge1, lecture_ledge2, lw_credenza1, pnw_master_desk1, pnw_desk_return1, m10_console_controls1, aes_tool_trolley1 |
| Right but flagged low (pass 2): accept after a look | 12 | desk-ceo1, desk-ceo2, kitchen_counter_sink1, electronics_bench2, hce_console_table1, hq_console1, lw_oval_table1, m10_key_console1, m10_steel_stand1, qdc_lab_desk1, qdc_optical_bench1, pnw_console1 |
| Wrong: need a hand value | 22 | glass_coffee_table1, sideboard1, credenza1, reception_counter1, it_workbench1, it_workbench2, exec_desk_mahogany1, aes_security_desk1, aes_console1, hce_reception_desk1, hce_trading_station1, pnw_console2, qdc_cctv_desk1, qdc_kitchenette1, qdc_kitchenette2, study_carrels1, marble_desk1, freshers_stall2, m09_box_trolley1, foosball_table2, m09_hatch_counter1, m09_hatch_counter2 |

So 38 of 60 are right (63%), and every one of the 26 that pass the confidence bar is right.
Weighted by use, the right ones cover 187 of the 238 room placements found (79%). The
misses are almost all PixelLab props with monitors, sinks or ornaments drawn on their tops,
where the top's colour is broken up, and a few odd shapes (the two `m09_hatch_counter`
sprites are side-on counters whose "front" is vertical; `foosball_table2` is not a surface
at all and can be dropped). A hand value for those 22 is a few minutes each on the
contact sheet; nearly all of them are used in one or two rooms.

## 4. Engine use (to build after review)

### 4.0 Table groups: extend what exists

Every desk an item can stand on is a table group, and every item on a desk is in that
group. The group is the existing one: a sprite in the Tiled `tables` layer (or a mode A
table), its `table_items` / `conditional_table_items`, scenario `tableItems`, and
`baseDepth`. Four small changes to `rooms.js` let it cover the cases it misses:

1. **`collides: false` on a table** (R1 M1). A Tiled custom property on a `tables`-layer
   object (and a scenario field of the same name on a mode A table) that skips
   `physics.add.existing` in `processObject` (~2624–2656) and in mode A (~2121–2140). The
   desk is still a group with a `baseDepth`; it just has no body, so the player, NPCs and
   chairs pass through it, the pathfinding grid (built from static bodies,
   `npc-pathfinding.js` `rebuildWorldGrid`) leaves its cells walkable, and the NPC
   table-overlap checks (`npc-sprites.js` ~971, ~1101; `npc-behavior.js` ~2371) skip it
   because they all require `obj.body`. That is exactly how an items-layer desk behaves
   today, so moving the accounts desks into `tables` with `collides: false` keeps
   2f0562567's fix (no NPC unstick spam or drift) by construction.
2. **`onTable`** on a scenario object (R1 M10: not `on`, which `applyScenarioProperties`
   would copy over Phaser's `GameObject.on`, `rooms.js` ~393–396). `"onTable": true`
   joins the group of the table whose sprite rectangle the item overlaps (south-most if
   several, as `findClosestTable` does), with no fall-back to the nearest table: an item
   that overlaps none keeps its own depth and gets a console warning and a lint.
   `"onTable": "<id>"` names a scenario table or another item (a sheet on a laptop: R1
   m3), and the item goes straight after its host in the group order. This replaces
   joining by matching a Tiled placeholder of the same type, which is fragile (an
   unrelated object of the same type elsewhere in the room grabs a placeholder and is
   then grouped with the nearest table, overlapping or not). Placeholders keep working
   as they do.
3. **Order by base row.** The final pass (~2407–2426) sorts by `sprite.y + baseRow`
   (the lowest opaque row, from `baseRows`) instead of `sprite.y`, puts a stacked item
   after its host, and caps the step so the group stays below `baseDepth + 0.5`
   (0.01 × i up to 49 items, then 0.5 / (n + 1)).
4. **`position.elevation` is ignored on a grouped item**, as it already is for Tiled table
   items (`sprite.elevation = 0`), with a validator warning when both are given.

Items-layer desks (R1 M1: 26 placements, all five on the accounts floor) are not given
groups by the engine. They move to the `tables` layer in the room JSON with
`room_edit.py`, keeping their x and y, with `collides: false` where the room had them
non-colliding on purpose. A room lint (5.3) flags any texture with a surface entry in an
`items` or `conditional_items` layer. One knock-on: mode B maps the nth scenario table to
the nth Tiled table, so adding desks to `tables` shifts those indices; only
`test_table_items` uses mode B, and its rooms have no items-layer desks.

Why the flag and not a shallow or custom collision box. Any static body, however
shallow, goes into the pathfinding grid (padded a cell sideways, 2 px vertically), takes
part in the NPC table-overlap and unstick checks, and collides with every swivel chair
(`object-physics.js` 43–50). Those are what made NPCs wedge on the accounts floor; a
shallower box shrinks the problem but keeps all four mechanisms. A custom box is still
possible later as a Tiled property, but it changes pathfinding cells in every room that
uses it, which is Q3's separate decision. The cost of the flag: on a `collides: false`
desk the player can walk into the footprint, drawn behind the desk (row 1 of 0.2), which
the accounts floor already allows today.

The module `public/break_escape/js/systems/table-surfaces.js` owns the data and the
geometry. It exports:

- `surfaceOf(sprite)` → `{ backY, frontY, floorY, x0, x1, panel }` in world px, or null
  when the texture has no entry, is in `notSurface`, or is rotated (then every caller
  keeps today's behaviour);
- `snapBase(item, table, { tolerance })` → the y that puts the item's base row in the
  band (unchanged if already inside by `tolerance`);
- `deskSeat(chair, facing, roomId)` → the hip y a sitter on that chair should have (4.2),
  or null when no desk with an entry lies in the facing direction within 24 px.

There is no separate `tableUnder` index: the groups are the index, built from the
`tables` layer before the scenario pass (~1952–1971), so an `onTable` item can find its
group at the point it is created.

New static imports must be added to each JS test harness copy list (`bin/test-js` runs
plain `node`).

### 4.1 Items on a table

- **`onTable` items** keep their author x (clamped inside the insets and `clear` spans;
  an item wider than `x1 − x0` is centred, with a warning) and have their y snapped so
  the base row is in the band, once surface data exists (slice 3). Before that (slice 1),
  `onTable` only joins the group and the author sets y.
- **Where in the band.** Default base row `frontY − 2`. That puts a PC's keyboard at the
  front of the top and its monitor at the back edge (panel 3), and a lamp's foot near the
  front with the shade above the back. An author y already inside the band is kept, so a
  ledger or in-tray can sit further back.
- **Mode A and mode B** (`tableItems`): replace `targetBottomY = table bottom` with a
  layout inside the band: one row with bases at `frontY − 2`, items spread across
  `x0…x1`; with more items than fit, a second row with bases at `backY + 0.4 × depth`.
  Explicit table-relative `x`/`y` on a table item stay as they are.
- **Generators** (R1 M7): a new keyword `band_frac` (0 = back edge, 1 = front edge) on
  `place_on_table`; `surface_frac` keeps its meaning, so the ~30 existing calls are not
  re-tuned. Rooms whose items are off the band have those `table_items` moved in place
  with `room_edit.py` (y only), not rebuilt from the generator, because several rooms
  have hand edits their generator would overwrite. New generator code uses `band_frac`.
- **Hand-dressed props** (R1 M6): lamps, ledgers, in-trays and the like on a desk move
  from `items` to `table_items` with `room_edit.py`, with their base in the band. The
  existing unreserved-table-item path then groups them.

The item's base row is its lowest opaque row, read from `baseRows` (the engine can also
measure it once per texture at load, as `seating.js` does for hip rows), so padded PNGs
land right.

### 4.2 Sitters at a desk

The sitter line comes from the desk, not from per-chair data (R1 M4). For a sitter whose
desk lies in their facing direction:

- **Facing north, desk to the north** (in front of the desk on screen):
  `hip = southContact − kFront`, `kFront = 6`.
- **Facing south, desk to the south** (behind the desk): `hip = northContact − kBack`,
  `kBack = 20`.

Both constants come from two body measurements in the 80×80 atlases: a seat height `s`
(hip to floor contact, about 13 px) and a half body depth `d` (back of the hip to the
belly, about 7 px). A sitter's body touches the desk's edge in floor space, so the floor
point is `contact + d` in front and `contact − d` behind, and the hip is `s` above it:
`kFront = s − d = 6`, `kBack = s + d = 20`. One constant can't serve both, because the
two sitters touch opposite edges. On `desk1` this gives hip 154 in front (panel 3) and
124 behind (Tomasz: chair foot 141).

The chair goes wherever puts that hip on the chair's seat point for the current facing:
`chair.y = hip − seat[facing].y`, using the same `seatPoint` numbers `poseSprite` already
uses (`poseSprite` then places the sprite by `SIT_HIP` as now). No new data per chair. Checks, all from 0.2: a
front sitter's chair foot must be ≥ `F + 1` (the smallest drop from seat to foot is 13 px
on the `aw_chair_*` chairs, so it always is), and a back sitter's chair foot ≤ `F − 1`
(the largest south-facing drop is 23 px, `exec_chair_black1`: foot 147 on `desk1`).

Cases:

- **Static chairs** are authored data and never move at run time (R1 M3). The lint (5.2)
  prints the y that puts the chair's seat on the rule, and the author or the quick fix
  (7.0) writes it into the scenario. This covers every accounts chair, including the
  empty `spare_desk_chair`.
- **Swivel chairs** move at run time. When a sitter sits, `deskSeat` gives the hip and
  the chair is slid to match. When a swivel turns (to face the player in chat, or a
  placed sitter within 96 px), the hip is re-solved for the new facing (unchanged if the
  desk is no longer in the facing direction) and the chair is re-placed from that
  facing's seat point, so the chair, not the sitter, takes up the difference between
  facings (1 px for `office40`, up to 11 px for `exec`). A sitter that
  swivels round to face away from the desk keeps their back at the desk's edge, which is
  where a real person would be.
- **Colliding desks and swivels** (R1 M5): the chair's body is the bottom third of the
  sprite (or its `swivelBody`), and the desk's is the bottom quarter ending at `F`, so the
  slide target is clamped so that the chair body's top is at least 1 px south of `F`
  (`foot ≥ F + chairBodyHeight + 1`). For `office40` (body 13.3 px, drop 20) that gives
  hip 155 on `desk1`, 1 px short of the rule; for `exec` (body 21.3 px, drop 38) the
  clamp never binds. `tuckIn` uses the
  same clamp, so Arcade separation has nothing to push against. On a `collides: false`
  desk there is no body and no clamp.
- **Chair facing away from the desk**, a side-facing chair (`chair-waiting-*`, club
  chairs) or no desk within 24 px in the facing direction: unchanged, and not linted
  (R1 m4).
- **Two desks**: the one in the facing direction; if both, the nearer.

Who applies it: static chairs by data (this work, slices 2 and 5). Swivel chairs by
`seatNPC`, which both the placed (`"seated": true`) and the needs paths call
(`seating.js` ~826–858, ~1141–1142); `seatNPC`, `updateNeedsSeat` and `tuckIn` are
office-life code, so the swivel part is that session's slice (6), with `deskSeat` as the
only interface. The NPC's `standAt` stays the home cell, so getting up lands on a
walkable cell.

**Approach cells** (R1 M2). `approachCell(obj)` is the nearest walkable cell (8 px grid)
to the object's sprite centre + `useFrom` × 32. Moving a PC 16 px north moves its centre
and the home cell 16 px north, from 172 to 156, inside the desk rectangle. The data-only
fix: `useFrom.dy` 1 → 1.5 on the four accounts PCs (the schema allows numbers,
`scenario-schema.json` ~5043), which puts the cell back at 172 (268 for the second row).
This touches no office-life file, so the lab's first opt-in needs nothing from that
session. Lint 1 suggests the new `dy` whenever it moves an object with a `useFrom`. A
general fix (approach from the table's contact line for a grouped item) is offered to the
office-life session as optional, not a prerequisite.

### 4.3 Existing scenarios

Opt-in, so nothing moves until a mission asks for it:

- Items join a group only with `onTable`, a `tableItems` list, a Tiled `table_items`
  placement, or a placeholder match (as today). Snapping applies only to `onTable` and
  `tableItems` items once slice 3 lands.
- Static chairs move only when their scenario y is edited. Swivel sitters move only in
  rooms where the scenario sets `"seatAtDesk": true` on the room or the NPC, until the
  default flips (Q2).
- `position.elevation` keeps working for everything outside a group.

What changes when each is opted in:

| Mission | Visible change |
|---|---|
| lab_physical_pentest | the five accounts-floor desks move to `tables` (`collides: false`); the four PCs, `usb_malware_note` and `planted_deviceA` join their desk's group, base 135 / 231, `elevation` removed, `useFrom.dy` 1.5; the three lamps and the ledger move to `table_items` with bases on the top; the four north chairs come in 19 px (foot 167 / 263); Tomasz's chair to foot 141; `kit_deviceB`, `visitor_book`, the badge printer settle on the credenzas |
| m10_full_disclosure | `core_access_key` moves 20 px north onto the desk; `release_staging_card` only if Q4 says it belongs on the desk |
| m09_digital_archaeology | `catalogue_login_slip` 12 px north |
| sis01_healthcare | the ransom note moves 6 px south onto the conference table; `it_security_office` PC and notes 5–7 px north (`room_edit.py`) |
| sis02_energy | `incident_response_folder` 11 px north |
| m02_ransomed_trust | `it_department` PC and notes 5–7 px north (`room_edit.py`) |
| ca12_visitor_tailgater | the lobby PC 13 px north (`room_edit.py`) |
| every needs mission | needs sitters at swivel chairs come in to the desk edge (office-life slice, after Q2) |

## 5. Lints

Warnings, not errors, each with the fix written out. Lints 1 and 2 go in
`validate_scenario.rb`; lint 3 and the Tiled half of lint 1 go in
`scripts/room_gen/slot_audit.py`, which the validator already has room geometry for.

1. **Item off the surface, or on it but not in its group.** Any sprite whose x-centre is
   over a table with an entry and whose rectangle overlaps the table's: scenario objects
   with tile coordinates, and Tiled objects in `items`, `conditional_items`,
   `table_items` and `conditional_table_items` (R1 M6). It fires when the base is outside
   the band by more than 2 px, or the item is in the band but would not join the group
   (a scenario object without `onTable`, a Tiled object outside `table_items`). Message:
   the error in px, the y that puts the base at `frontY − 2`, and "add `\"onTable\":
   true`" or "move it to `table_items`". An `elevation` on such an object gets "drop
   `elevation`, add `onTable`". When the move shifts an object that has a `useFrom`, it
   also prints the `useFrom.dy` that keeps the approach cell where it was (R1 M2). Skipped:
   `"onFloor": true` (Q4), wall-mounted items (`WALL_MOUNTED_EXTRAS`, or a base inside the
   back-wall band that gives auto-elevation > 0; R1 m4), `notSurface` and rotated tables.
2. **Static chair off the desk edge.** A static chair (`STATIC_SEATS`) whose facing
   points at a desk with an entry within 24 px (R1 m4: a chair with its back to the desk
   is skipped): its seat point is more than 2 px from the 4.2 hip. Message: the error in
   px and the chair's corrected y in tiles.
3. **Desk in the wrong layer.** A texture with a surface entry in an `items` or
   `conditional_items` layer. Message: "move it to `tables`", plus "with
   `collides: false`" (items-layer desks have no body today, so this keeps behaviour).

Sizes and base rows come from `baseRows` in `table_surfaces.json`, keyed by the engine's
`load.image` keys (R1 m5), so the validator needs no image library and doesn't use the
catalog's sizes, which differ for aliased keys (`pc`, `notes`).

## 6. Ownership

A separate Claude session owns the office-life files: `npc-needs*`, the needs parts of
`seating.js` (`seatNPC` as the needs path uses it, `updateNeedsSeat`, `needsSeatRef`,
`tuckIn`, `startFetch`/`advanceFetch`, fidget), `npc-office-visuals.js` and
`workstation-state.js`. This work does not edit them.

| File | Part | Owner | Change |
|---|---|---|---|
| `rooms.js` | table groups, `processObject` table body, mode A | this work | 4.0 (slice 1), snap (slice 3) |
| `table-surfaces.js` (new), `game.js` preload, `table_surfaces.json` | | this work | slices 1, 3 |
| validator, `slot_audit.py`, `measure_table_surfaces.py`, `register_object.py`, `generate_rooms.py` | | this work | slices 3, 4, 7 |
| room JSONs, scenario files | data | this work, with each mission's owner told | slices 2, 5, 7, 8 |
| `seating.js` | `seatNPC`, `updateNeedsSeat`, `tuckIn` | office life | swivel slide to `deskSeat`, the collision clamp (slice 6) |
| `npc-needs.js` | `approachCell`, left-behind depth | office life | optional; see the note |
| `npc-office-visuals.js` | screen glow | office life | re-check the glow offset on a moved PC |
| `workstation-state.js` | | office life | none |

Static chairs are scenario data and need nothing from `seating.js`, so slices 1–5 and
the accounts quick fix touch no office-life file.

**Note to hand to the office-life session** (send after slice 3 lands):

> Table surfaces, slice 6 is yours. `systems/table-surfaces.js` now exports
> `deskSeat(chair, facing, roomId)`: the hip y a sitter should have so they meet the desk
> in their facing direction (null when there is no desk within 24 px). Please:
> 1. In `seatNPC` (both paths), for a swivel chair when the room or NPC has
>    `seatAtDesk`, slide the chair so its seat point for the facing lands on that hip;
>    re-solve when the sitter turns. Clamp so the chair body's top stays ≥ 1 px south of
>    a colliding desk's floor line; apply the same clamp in `tuckIn`.
> 2. Keep `standAt` on the home cell. Accounts PCs now carry `useFrom.dy: 1.5`, so their
>    home cells don't move; a general approach-from-contact-line rule for grouped items
>    is optional.
> 3. Grouped items now sit at `desk floor + 0.5 + 0.01·i` (PCs on the accounts floor fall
>    from 171.5 to about 160.51). Check the left-behind lift (`home.sp.depth + 0.1`,
>    5cccaf6ea) and the tray-slot lift still sort as meant, with a case in
>    `npc-left-behind.test.mjs` whose home object is in a table group.
> 4. Tests: extend `test/js/fixtures/needs-sims-world.mjs` with a `tables`-layer desk
>    (colliding) and a `collides: false` desk; stand, tuck, wait 2 s, assert the chair
>    hasn't moved; live: sitter hip against the contact line in `test_needs_sims`, and
>    the 80c2a8dd5 case (back to the same chair after coffee).

If both sessions must touch `seating.js` in one day, commit in turn, each with explicit
paths.

## 7. Quick fix, build slices, tests, live proof, risks, open questions

### 7.0 The accounts floor first: can a scenario-only fix do it?

No. The user's rule needs the PCs, lamps and ledger in their desk's table group, and
today that cannot be reached from the scenario alone:

- groups are built only from the Tiled `tables` layer, and the accounts desks are in
  `items` (a room JSON edit, not a scenario edit);
- moving them to `tables` today gives each a body (bottom quarter, inset 10 px), which
  reverses 2f0562567 and brings the NPC wedging back;
- a scenario object joins a group only by matching a Tiled `table_items` placeholder of
  its type, taken in scenario order. The open-plan room has five `pc` objects (the four
  on the accounts desks, then `cable_note`, scenario ~960) and `planted_deviceA` needs a
  placeholder of its own type. Four `pc` placeholders would work, but only by count: one
  `pc` object added or moved earlier in the list and `cable_note` takes a placeholder
  and is grouped with whichever desk is nearest by centre, with no warning.

R1's data-only fix (`elevation` 20 → 26) gets the depth roughly right but is the hand-set
elevation the user ruled out. So the quick fix comes straight after **slice 1** (a small
`rooms.js` change, no surface data), and is then data only:

| File | Object | Change |
|---|---|---|
| `room_lw_accounts.json` (`room_edit.py`) | the five `desk1` | `items` → `tables`, same x/y, property `collides: false` |
| | `bankers_lamp1` × 3 | `items` → `table_items`, Tiled y 162 → 135, 162 → 135, 258 → 231 |
| | `notes_ledger1` | `items` → `table_items`, Tiled y 258 → 231 |
| `scenario.json.erb` | `staff_pc`, `staff_pc_2` | y 4 → 3.5, drop `elevation`, `onTable: true`, `useFrom.dy` 1 → 1.5 |
| | `usb_target_pc`, `usb_malware_note` | y 7 → 6.5, drop `elevation`, `onTable: true`; `usb_target_pc` `useFrom.dy` 1 → 1.5 |
| | `planted_deviceA` | y 4 → 3.75, drop `elevation`, `onTable: true` |
| | `hampshire_chair`, `pierce_chair` | y 5 → 4.40625 (foot 167, hip 154) |
| | `lord_chair`, `spare_desk_chair` | y 8 → 7.40625 (foot 263) |
| | `tomasz_chair` | y 4 → 3.40625 (foot 141, hip 124) |

Then a live look at the accounts floor at 2× for the user, against `mock_layering.png`
panels 3–4, before anything else moves. The scenario edit belongs to the lab's owner;
this work prepares it and hands it over unless told to commit it.

### 7.1 Slices

0. **Snapshot tool** (R1 M9), before any engine change: a headless run on :3001 that
   loads every scenario's rooms through `window.__test` and writes each room sprite's
   x, y and depth to JSON. Each later slice diffs against it, and only opted-in objects
   may move.
1. **Table-group plumbing** (`rooms.js`): `collides: false`, `onTable` (true or an id),
   sort by base row with the capped step, `elevation` ignored in a group, the warning
   for an `onTable` item over no table. Unit tests on the group order (the six rows of
   0.2) and a focused scenario `scenarios/test_table_surfaces` with a `tables` desk, a
   `collides: false` desk, an `onTable` PC, a stacked item, a lamp in `table_items`, and
   mode A and B lists. Live: read depths through `window.__test`, assert the 0.2 order,
   walk the player behind and in front, screenshot at 2×.
2. **Accounts quick fix** (7.0), data only.
3. **Surface data and snap.** Run the measurer, accept the 26 confident values and the
   12 flagged-but-right ones after a look, enter the 22 hand values on the contact-sheet
   page (Q6), write `table_surfaces.json` with `notSurface` and `baseRows`; a `--write`
   mode that refuses to overwrite a `hand` entry. `table-surfaces.js`, the preload, the
   snap for `onTable` and `tableItems` (4.1), unit tests on the geometry. Keeping it
   current (R1 M8): `register_object.py` runs the measurer on a surface-like name (or
   takes `--surface` / `--not-surface`) and writes a `measured` entry, and the PixelLab
   prop import calls the same hook; a test fails when a texture in any `tables` layer,
   or a catalog name matching the surface regex, has neither an entry nor a `notSurface`
   line, or when `baseRows` doesn't match the PNGs.
4. **Lints** (5.1–5.3), with fixture tests.
5. **Static chairs and items elsewhere**: apply the lint's numbers mission by mission
   (4.3 table), each mission's owner told. Add to the test scenario a south-facing
   sitter at `hospital_conference_table` (R1 m10) and a chair facing away.
6. **Swivel sitters** (office-life session, the note in 6).
7. **Generators**: `band_frac` on `place_on_table`; move the off-band `table_items` in
   place with `room_edit.py`; commit each room with explicit paths.
8. **Defaults**: after slices 5–6 and a review of the lab live, decide Q2 with the
   snapshot diff over every needs mission.

### 7.2 Tests and live proof

Per the standing rule, each engine slice gets unit tests, the focused test scenario and a
live browser check on the keyless :3001 server (headless, `bootstrap {"tutorial":
"decline","resume":"new"}`, one browser, stopped by its PID). Slice 1: the 0.2 order read
through `window.__test` (desk, items, a walker at feet `F − 10` and `F + 10`, a sitter
each side), plus a screenshot at 2× of each case room. Slice 3: each `onTable` item's base
against the band. Slices 5–6: the sitter's hip against the 4.2 target, before and after,
in the accounts floor, `test_needs_sims` and the sis01 and m02 needs rooms (R1 M9), and a
check that a needs NPC still gets up onto a walkable cell and returns to the same chair
after coffee (80c2a8dd5). Every slice: the snapshot diff (slice 0).

### 7.3 Risks

- **Approach cells shift** when a PC moves (4.2). Covered by `useFrom.dy` in data and
  printed by lint 1.
- **Click and reach targets move.** A PC 16 px further north is 16 px further from a
  player south of the desk. On the accounts floor the desks don't collide, so the player
  can still stand anywhere; for a colliding `desk1` the nearest a player can stand puts
  the PC's top within 22 px (R1). The tap-menu pairs the accounts floor already has
  (`captures_terminal`/`staff_pc_2`, `staff_pc`/`planted_deviceA`,
  `usb_target_pc`/`usb_malware_note`: R1 m9) get no worse; mention them to the lab's
  owner.
- **Occlusion.** The tucked sitter's head covers about 35% of the monitor on the accounts
  PCs (R1 m6), the look the user chose. If Melanie's screen state must be read on the map,
  nudge that PC about 10 px sideways in the scenario.
- **Walking into a `collides: false` desk.** The player is drawn behind it (0.2 row 1).
  This is today's accounts behaviour; Q8 asks whether to block the player only.
- **Room JSON edits** churn files that generators also write; move objects in place with
  `room_edit.py`, one room per commit, explicit paths.
- **Shared tree.** Office-life work is in flight in `seating.js` and the needs fixtures;
  slices 0–5 and 7 stay off those files.

### 7.4 Open questions (recommended default first)

- **Q1. Closed** (user, 2026-11-06): the fault is the accounts PCs hovering over the
  front lip; the look is R1 panel 3; items on a desk go in its table group (0.1).
- **Q2. Opt-in or default-on for swivel sitters?** Default: opt-in per mission
  (`seatAtDesk`) until the lab has been reviewed live; then default-on with a 24 px
  tolerance, decided on the snapshot diff. Items stay opt-in (`onTable`) with lint 1.
- **Q3. Should colliding desks get a box that follows the surface?** The bottom-quarter
  box (9.75 px on `desk1`) is shallower than the footprint (16 px). Default: leave it;
  `collides: false` covers the desks that must not block NPCs. A custom box is a
  separate decision because it moves pathfinding cells in every room.
- **Q4. Things deliberately at the edge.** `release_staging_card` is "tucked under the
  console's edge". Default: `"onFloor": true` (or no `onTable`) keeps it where it is, and
  lint 1 skips it.
- **Q5. Closed by M1**: the accounts desks stay non-colliding, now as `tables` with
  `collides: false`.
- **Q6. Hand values: who checks them?** Default: a review page with the contact-sheet
  crops and number boxes, filled by an agent and checked once by the user.
- **Q7. Who commits the accounts quick fix?** Default: this work prepares the room JSON
  and scenario edits after slice 1 and asks the lab's owner (or the user) before
  committing the scenario.
- **Q8. Should a `collides: false` desk still block the player?** Default: no (today's
  behaviour). A `collides: "player"` variant would need a body the pathfinding grid and
  NPC checks ignore, which is new engine work.

## 8. Changes after review R1

| ID | Sev | Outcome | Where |
|---|---|---|---|
| B1 | B | Fixed. The user chose panel 3 and the table-group layering rule, and confirmed the accounts reading of "floating north". Section 0 states the target and the drawing order; the corrected mock is `tsplan/mock_layering.png` | 0, 7.4 Q1 |
| M1 | M | Fixed. Items-layer desks move to the `tables` layer; `collides: false` keeps them bodiless, so the 2f0562567 fix holds. Chosen over a shallow or custom box because any static body enters the pathfinding grid, the NPC overlap/unstick checks and the chair colliders. `onTable` joins the group explicitly. A test-scenario room covers a `collides: false` desk | 4.0, 5.3, 7.1 slice 1 |
| M2 | M | Fixed in data: `useFrom.dy` 1 → 1.5 on the four accounts PCs keeps the home cells at 172 / 268; lint 1 prints the `dy` for any moved `useFrom` object. No office-life file in the lab's first opt-in; the general rule is optional for that session | 4.2, 5.1, 7.0 |
| M3 | M | Fixed. Static chairs are data: their y comes from lint 2 and goes in the scenario (accounts numbers in 7.0, including `spare_desk_chair` and Tomasz). The runtime move is for swivels only, through `seatNPC`, which serves both paths; that is the office-life slice | 4.2, 7.0, 6 |
| M4 | M | Fixed. No per-chair `reach`. The hip comes from the desk: `contact − k` with `kFront = 6` and `kBack = 20`, both from one seat height and one body depth; the chair is placed from its seat point for the current facing and re-solved on a turn. A single k can't serve both sides | 4.2 |
| M5 | M | Fixed. Swivel slide targets and `tuckIn` are clamped so the chair body clears a colliding desk's body; no clamp on a `collides: false` desk. Proof in the office-life note (stand, tuck, wait 2 s) | 4.2, 6 |
| M6 | M | Fixed. Lamps and the ledger move to `table_items` with bases on the top (7.0); lint 1 covers the `items`, `conditional_items` and table-item layers | 1.3, 4.1, 5.1, 7.0 |
| M7 | M | Fixed. New `band_frac` keyword; `surface_frac` unchanged; off-band items moved in place with `room_edit.py`, no whole-room rebuilds | 4.1, 7.1 slice 7 |
| M8 | M | Fixed. `register_object.py` and the PixelLab import write entries; a coverage test over `tables` layers and surface-like catalog names (or `notSurface`); `baseRows` checked against the PNGs | 2.2, 7.1 slice 3 |
| M9 | M | Fixed. Slice 0 snapshot of every scenario's room sprites, diffed after each slice; sis01 and m02 needs rooms in the live sitter check before Q2 | 7.1, 7.2 |
| M10 | M | Fixed. The field is `onTable` | 4.0 |
| m1 | m | Fixed: hatch counters and `foosball_table2` in `notSurface`; the oval table gets wider insets, a shape field waits for a real use | 2.1 |
| m2 | m | Fixed: rotated tables return null; `flipX` mirrors `inset` and `clear` | 2.1 |
| m3 | m | Fixed: an item wider than the top is centred with a warning; `onTable: "<item id>"` stacks after its host | 4.0, 4.1 |
| m4 | m | Fixed: lint 2 only when the desk is in the chair's facing direction; lint 1 skips wall-mounted items | 5 |
| m5 | m | Fixed: `baseRows` keyed by the engine's load keys | 2.2, 5 |
| m6 | m | Accepted: the user chose panel 3, where the head covers the monitor's lower part; a 10 px sideways nudge is the fallback if a screen must be read on the map | 0.2, 7.3 |
| m7 | m | Fixed: left-behind and tray-slot depth lifts named in the office-life note, with a test | 6 |
| m8 | m | Fixed: `objects_tileset.json` remark, the contact-line clause, head top ~137, `place_on_table` path | 1.2, 1.3, 2.1, 2.3 |
| m9 | m | Noted for the lab's owner; snapping makes no pair worse | 7.3 |
| m10 | m | Fixed: a south-facing sitter at `hospital_conference_table` in the test scenario before lint 2 trusts the north line | 2.1, 7.1 slice 5 |

R1's "something simpler" is taken in spirit: the accounts floor is fixed first, as data.
It can't be data alone, because the layering rule needs table groups the scenario can't
reach today (7.0), so the order is slice 0–1, then the quick fix, then data and lints,
then the engine snap and the office-life slice.
