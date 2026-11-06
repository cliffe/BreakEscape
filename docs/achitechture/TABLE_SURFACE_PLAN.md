# Table surfaces: plan

Status: plan and measurement prototype only (2026-11-06). No engine code or scenario has
changed. Prototype: `scripts/room_gen/measure_table_surfaces.py`.

The report: PC monitors sit too far north of the desk they are on, and NPCs sit too far
south of their desk instead of right up against it. The question: does each table need a
mapping of its top, and is one value (the y where the top starts) enough?

Short answer: two values per sprite, `top` and `front` (sprite rows), are enough for both
faults. Everything else the engine needs can be derived from them and the sprite's own
height. A few sprites with things drawn on their tops also need a back-panel range or x
insets, entered by hand.

All y values below are room pixels (y down) unless marked "sprite rows". Tiles are 32 px.

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
4. **Tiled `table_items` placed by the room generators**, `generate_rooms.place_on_table`.
   The base goes at `surface_frac × sprite height` from the top, and the header tells
   authors to use 0.15–0.50 for every desk. That fraction is right for `smalldesk1`
   (front at 26/41 = 0.63) but wrong for `desk1` (16/39 = 0.41) and `hospital_desk1`
   (18/48 = 0.375): at 0.5 an item lands 3.5 px and 6 px south of their front edges.

Only `test_table_items` uses `tableItems` (modes A and B); real missions use paths 1 and 4.
`position.elevation` is used by 15 objects in three scenarios, 13 of them in
`lab_physical_pentest`.

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
other missions; see 1.5. A placement from measured data fixes both directions, so the plan
doesn't depend on which reading is right. Open question Q1 asks for one look at the
corrected accounts floor before the defaults are frozen.

**Seated staff.** The chairs are static `aw_chair_north_*` (16×26, seat point [8, 13]),
placed by tile one row south of each PC: `hampshire_chair` (2, 5), `pierce_chair` (6, 5),
`lord_chair` (2, 8), and the empty `spare_desk_chair` on the second row. Chair top 160 (= the desk's floor
line), so the sitter's hip lands at 173:

- 13 px south of the desk's floor line (160),
- 36 px south of the desk's front edge (137).

A seated 60 px figure's head is about 30 px above the hip, at ~143, so the whole sitter is
below the desk's lip. That matches the crop: the backs of the heads start where the lip
ends, with an empty band of floor-coloured leg space between the person and the top.

There is no collision box here: commit 2f0562567 made the accounts desks non-colliding (they
are items-layer sprites, which get no body; `generate_rooms._Uni.solid` would add one). The
contact line is therefore the floor line, 160.

**Tomasz** (`tomasz_chair`, static `aw_chair_south_slate1` 16×32 at tile (11, 4)) sits
**on** the supervisor's desk: the chair spans y 128–160 over the desk's 121–160. Chair and
desk share the floor line 160, so the sitter is drawn over the desk and the front face of
the desk shows behind his legs. A south-facing sitter belongs behind the desk: the chair's
foot at or above the desk's back line in floor space (160 − 16 = 144), and the desk drawn
over his legs. Error: 16 px.

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
  standing NPC come.

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
| south contact line | `y0 + H` (the floor line), or the collision box's bottom edge if lower | a north-facing sitter's chair stops here |
| north contact line | `y0 + H − (front − top)` | a south-facing sitter behind the desk stops here |

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
  (`game.js`), next to the existing `objects_tileset.json`;
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

A new module, `public/break_escape/js/systems/table-surfaces.js`, owns the data and the
geometry. It exports:

- `surfaceOf(sprite)` → `{ backY, frontY, floorY, x0, x1, panel }` in world px, or null
  when the texture has no entry (then every caller keeps today's behaviour);
- `tableUnder(roomId, x, y)` → the table sprite whose x span holds `x` and whose sprite
  rectangle holds `y`, among the room's `tables` layer, items-layer desks with an entry,
  and scenario-created tables;
- `snapBase(item, table, { tolerance })` → the y that puts the item's base row in the
  band (unchanged if already inside by `tolerance`);
- `deskContact(chair, facing)` → the y the chair's foot should go to so the sitter meets
  the desk, or null if no desk with an entry is in front of the chair.

New static imports must be added to each JS test harness copy list (`bin/test-js` runs
plain `node`).

### 4.1 Items on a table

- **`on`** (new, optional) on any scenario object: `"on": true` means "the table under
  me"; `"on": "<id>"` names a scenario table (mode A) or an object id. The item keeps its
  author x (clamped inside the insets and `clear` spans) and its y is snapped so its base
  row is in the band. It joins that table's group, so its depth is the table's depth +
  0.01 × n, the same as Tiled table items (`rooms.js` ~2407–2426). `elevation` is then
  ignored, with a validator warning if both are given.
- **Mode A and mode B** (`tableItems`): replace `targetBottomY = table bottom` with a
  layout inside the band: one row with bases at `frontY − 2`, items spread across
  `x0…x1`; with more items than fit, a second row with bases at `backY + 0.4 × depth`.
  Explicit table-relative `x`/`y` on a table item stay as they are.
- **Generators**: `place_on_table(..., surface_frac=)` takes the fraction of the band, not
  of the sprite height (0 = back edge, 1 = front edge), so 0.5 means mid-top on every
  desk. Rebuilt rooms change only where an item's base moves.

The item's base row is its lowest opaque row, measured once per texture at load (the same
way `seating.js` measures hip rows), so padded PNGs land right.

### 4.2 Sitters at a desk

The target the user asked for: the sitter touches the desk's contact line.

- **North-facing sitter (south of the desk)**: the chair's foot goes to
  `southContact + reach`, where `reach` is how far the chair's foot is behind the front of
  its seat. `reach` is a new per-chair number next to the seat point in
  `STATIC_SEATS`/`FAMILIES`, read from the same 8-facing render tests that set the seat
  points. A starting value for the static office chairs is 7 px (their front legs start
  at sprite row 19 of 26). For the accounts chairs the foot moves from 186 to 167, about
  19 px north, and the hip from 173 to about 154, so the head and shoulders overlap the
  desk's lip and the front of its top, which is how a person at a desk looks from behind.
  The exact `reach` is tuned once per chair family on the live render (Q1). Depth is unchanged (the chair is still south of the desk's floor line, so the
  sitter draws in front).
- **South-facing sitter (behind the desk)**: the chair's foot goes to
  `northContact − 2`, so it sorts behind the desk and the desk's front face hides the
  sitter's legs (Tomasz). With a `backPanel`, the panel hides the sitter's lower body too.
- **Side-facing sitters** (`chair-waiting-*`, club chairs) are left alone.

Where it is applied:

- Placed sitters (`seatNPC` for `"seated": true`): once, when the NPC sits, the chair is
  moved by `deskContact` if the desk is within 24 px. Static chairs have no body, so moving
  them is safe; swivel chairs use `placeBody`.
- Needs sitters (`updateNeedsSeat`): the swivel chair is slid to
  `(feet.x, deskContact ?? feet.y)` instead of `(feet.x, feet.y)`. The NPC's
  `standAt` stays the home cell, so getting up lands on a walkable cell and not inside the
  desk's collision. The sitter's own body is already out of collision while seated
  (`checkCollision.none = true`), so overlapping the desk's collision box is harmless.

**Seat from the home cell (commit 80c2a8dd5).** `needsSeatRef` decides where the chair
search starts (the home cell when within 48 px) and that does not change: `NEAR_CHAIR`
(36 px) and `FETCH_RANGE` are still measured from the home cell. Only the slide target
moves, by at most `reach` + the cell's clearance (about 6–16 px on the accounts floor).
`tuckIn` pushes the chair 12 px in the facing direction when the NPC leaves; after the
change the tucked chair would sit inside the desk's footprint, which is the look wanted,
but it must not block the home cell: check the tucked chair's body against the
pathfinding grid in the tests.

**Risk to the needs world.** `approachCell(obj)` starts from the object's sprite
**centre** + `useFrom` × 32. Snapping a PC 14 px north moves its centre 14 px north and
can move its approach cell by one grid step. Either the snap keeps the needs world on the
pre-snap centre (store `sprite._approachRef`), or `approachCell` uses the table's south
contact line for an object that is `on` a table. Both are in office-life files (section 6).

### 4.3 Existing scenarios

Opt-in, so nothing moves until a mission asks for it:

- Items move only when they have `on`, or are in a `tableItems` list (only
  `test_table_items` uses one), or come from a rebuilt generator room.
- Sitters move only in rooms where the scenario sets `"seatAtDesk": true` on the room or
  the NPC. After a review of one mission, flip the default to on with a 24 px tolerance:
  a chair farther than that from any desk is left where it is.
- `position.elevation` keeps working for everything without `on`.

What changes when each is opted in:

| Mission | Visible change |
|---|---|
| lab_physical_pentest | the five accounts-floor PCs and devices move 6–14 px north onto the top and lose `elevation`; the four north chairs come in about 19 px; Tomasz moves behind his desk (16 px north); `kit_deviceB`, `visitor_book`, the badge printer settle on the credenzas |
| m10_full_disclosure | `core_access_key` moves 20 px north onto the desk; `release_staging_card` only if Q4 says it belongs on the desk |
| m09_digital_archaeology | `catalogue_login_slip` 12 px north |
| sis01_healthcare | the ransom note moves 6 px south onto the conference table; `it_security_office` PC and notes 5–7 px north (generator rebuild) |
| sis02_energy | `incident_response_folder` 11 px north |
| m02_ransomed_trust | `it_department` PC and notes 5–7 px north (generator rebuild) |
| ca12_visitor_tailgater | the lobby PC 13 px north (generator rebuild) |
| every needs mission | needs sitters at swivel chairs come in to the desk edge |

## 5. Validator lints

Both in `validate_scenario.rb`, as warnings (not errors), each with the fix written out:

1. **Item off the surface.** A scenario object with tile coordinates whose sprite's
   x-centre is over a table with an entry, whose sprite rectangle overlaps the table's,
   and whose base row is outside the band by more than 2 px. Message: the error in px, the
   y (in tiles) that would put it mid-band, and "or add `\"on\": true`". An object with
   `elevation` over a table gets a suggestion to replace it with `on`. Objects marked
   with a new `"onFloor": true` (deliberately at the edge or under it, Q4) are skipped.
2. **Sitter off the desk edge.** A static chair, or a chair a seated NPC will take, within
   40 px of a desk with an entry: a north-facing chair whose foot is more than 4 px from
   `southContact + reach`, or a south-facing chair whose foot is south of
   `northContact`. Message: the error in px and the corrected y.

The sprite sizes come from `catalog.json` (w, h), and the base rows from a small cache of
lowest-opaque-row values written by the measurer, so the validator needs no image
library. The same check over Tiled `table_items` goes in `scripts/room_gen/slot_audit.py`
for the generators.

## 6. Ownership

A separate Claude session owns the office-life files: `npc-needs*`, the needs parts of
`seating.js`, `npc-office-visuals.js` and `workstation-state.js`. This plan touches them as
follows:

| File | Part | Owner | Change |
|---|---|---|---|
| `seating.js` | `STATIC_SEATS`, `FAMILIES` (`reach`), `seatNPC`, `poseSprite` | this work | add `reach`; placed sitters call `deskContact` |
| `seating.js` | `updateNeedsSeat`, `needsSeatRef`, `tuckIn`, `startFetch`/`advanceFetch` | office life | slide target uses `deskContact`; check `tuckIn` |
| `npc-needs.js` | `approachCell`, `describe`/`centreOf` | office life | keep approach cells stable when an object is snapped |
| `npc-office-visuals.js` | screen glow, typing icons | office life | none expected (they follow sprite positions); re-check the screen glow offset on a snapped PC |
| `workstation-state.js` | | office life | none |
| `rooms.js`, `table-surfaces.js` (new), `game.js` preload, validator, generators | | this work | everything else |

How to coordinate: land the new module, the data file and the `rooms.js` item path first
(slices 1–3), which touch no office-life file. Then hand the office-life session a short
note naming `deskContact(chair, facing)` and the two changes above, with the test
fixture to extend (`test/js/fixtures/needs-sims-world.mjs`, which it is editing now). Don't
edit their files from this work; if both sessions must touch `seating.js` in one day,
commit in turn, each with explicit paths.

## 7. Build slices, tests, live proof, risks, open questions

### 7.1 Slices

1. **Data.** Run the measurer, accept the 26 confident values and the 12 flagged-but-right
   ones after a look, enter the 22 hand values on the contact sheet (an artifact page with
   a row per sprite and a number box for each line would make this a quick pick), write
   `table_surfaces.json`. Add a `--write` mode that refuses to overwrite a `hand` entry.
2. **Module and loader.** `table-surfaces.js`, the preload entry, unit tests on the
   geometry (band, contact lines, insets, unknown texture → null).
3. **Items.** `on`, the mode A/B layout, depth grouping, the base-row cache. Test scenario
   `scenarios/test_table_surfaces` with one room per case: `desk1`, `smalldesk1`,
   `hospital_desk1`, `desk-ceo2` (drawn items), a back-panel console; an item with `on`,
   one with `on` and `elevation`, mode A and mode B lists.
4. **Lints.** Both validator checks, with tests on fixtures; `slot_audit.py` for Tiled.
5. **Placed sitters.** `reach` per chair from the render tests; `seatNPC` snap behind
   `seatAtDesk`; Tomasz's case and a north-facing case in the test scenario.
6. **Needs sitters** (office-life session). Slide target, `standAt`, `tuckIn` check,
   approach-cell stability.
7. **Generators.** `place_on_table` on the band; rebuild the rooms whose items move and
   diff the JSON.
8. **Missions.** Opt in lab_physical_pentest first, review it live, then the others in the
   table in 4.3, then decide on the default (Q2).

### 7.2 Tests and live proof

Per the standing rule, each engine slice gets unit tests, the focused test scenario and a
live browser check on the keyless :3001 server (headless, `bootstrap {"tutorial":
"decline","resume":"new"}`, one browser, stopped by its PID). Live proof for slice 3:
read each item's `y + height` and the table's band through `window.__test` and assert the
base is inside it, plus a screenshot at 2× of each case room. For slices 5–6: the sitter's
hip y against the desk's contact line, before and after, in the accounts floor and in
`test_needs_sims`, and a check that a needs NPC still gets up onto a walkable cell and
returns to the same chair after coffee (the 80c2a8dd5 case).

### 7.3 Risks

- **Approach cells shift** when a PC snaps (4.2). Mitigation in the needs world, before
  any needs mission opts in.
- **Click and reach targets move.** Interaction reach is measured to the sprite; a PC
  14 px further north is 14 px further from a player standing south of the desk. Check
  `interaction-reach` distances on the accounts floor after the snap.
- **Occlusion.** Sitters pulled in overlap the monitor's lower edge. That is correct for
  someone at a desk, but an object hidden behind a sitter can become hard to click; the
  tap menu still lists it.
- **Depth ties.** Items joining a table group sort by y inside the group; a tall item at
  the back can draw over a short one at the front if both have the same y. Sort by base
  row, not sprite y.
- **Generator rebuilds** churn whole room JSONs; rebuild one room at a time and commit each
  with explicit paths.
- **Shared tree.** Office-life work is in flight in `seating.js` and the needs fixtures;
  keep slices 1–5 off those files.

### 7.4 Open questions (recommended default first)

- **Q1. Which way is "floating north"?** In the accounts evidence the PC bases are 14 px
  south of the front edge and the monitors fill the top; the literal north case is the
  sis01 ransom note. Default: build from the measured band, which fixes both, and show the
  user the corrected accounts floor before freezing `front − 2` as the default base row.
- **Q2. Opt-in or default-on?** Default: opt-in per mission (`on` for items, `seatAtDesk`
  for sitters) until lab_physical_pentest has been reviewed; then default-on for sitters
  with a 24 px tolerance, items stay opt-in with a lint.
- **Q3. Should desk collision follow the surface?** The bottom-quarter box (9.75 px on
  `desk1`) is shallower than the desk's footprint (16 px). Default: leave collision alone in
  this work; the contact line is the floor line or the box's bottom, whichever is lower.
  Changing collision moves pathfinding cells everywhere and is a separate decision.
- **Q4. Things deliberately at the edge.** `release_staging_card` is "tucked under the
  console's edge" and lands past the floor line. Default: an explicit `"onFloor": true`
  (or no `on`) keeps such items where they are, and the lint skips them.
- **Q5. The accounts desks have no collision** (commit 2f0562567, to stop NPC unstick
  spam). Default: keep it so; sitters still meet the floor line.
- **Q6. Hand values: who checks them?** Default: an artifact page with the contact-sheet
  crops and number boxes, filled by the user or an agent and reviewed once by the user.
