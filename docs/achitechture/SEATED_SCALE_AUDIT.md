# Seated scale audit: desks, chairs and desk items

Date: 2026-11-06. Status: investigation and proposals only; no art, map or engine change made.

Prompted by the user on the seat-box comparison shot (seated character at `desk1` with `pc1`
and `bankers_lamp1`): "the pc and lamp too low ... this desk might be a bit too high ... the
hospital stationary chair legs are too short."

Mock-ups (native pixels, integer nearest-neighbour zoom only) are in the session scratchpad
`scale-audit/`; the scripts that made them (`lib.py`, `m1_items.py` ... `m5_combined.py`,
`chairs.py`, `sitstats.py`, `usage.py`) are beside them:

| File | Shows |
|---|---|
| `00_before_after_summary.png` | the user's case: PC and lamp moved back, `hospital_chair_north` +4 leg rows |
| `01_pc_lamp_placement.png` | PC and lamp at Tiled bottom F-15 (now) vs F-25, sitter in front and behind, two atlases |
| `02_desk_heights.png` | `desk1`, `zds_desk1`, `smalldesk1`, `hospital_desk1`, `exec_desk1`, now vs the proposed height, swivel sitter in front and a side-on sitter at the end |
| `02b_desk_heights_static_chair.png` | the same with `hospital_chair_north` in front |
| `03_static_chairs.png` | hospital chair north and south and `m10_steel_chair1`, now vs longer legs, three atlases |
| `04_other_seats.png` | waiting chairs (seat-point change), sofas and exec chairs (no change) |

F below is a desk's floor line (the sprite's bottom edge, Tiled y). Heights are in screen
pixels above the object's own floor line.

## The sitter

Measured from the seated frames (`sit_<facing>_frame_000`) with the engine's own anchors
(`SIT_HIP` in `seating.js` plus the per-atlas shift from `sit_south`):

- **Hip anchor to the sitter's lowest pixel**, all 108 atlases with `sit_from`: south 19 (every
  atlas), north 15 (13-19), east and west 18 (17-20).
- **Body rows above the sitter's floor**, read from the side-on frames of
  `male_office_worker_v2`, `female_nurse1_v2` and `agent_hax`: thigh underside (seat) 13-14,
  lap (thigh top at the knee) 20-23, elbow 24-26, shoulder about 39, head top 55-57.
- Seated and standing frames share one scale (head widths match: 14, 18, 16, 19, 16 px on five
  atlases), so nothing here comes from a scale mismatch between the states.

So a chair's seat wants to be about 13-14 px above its floor, and a desk top somewhere between
the lap (20-23) and the elbow (24-26), nearer the elbow.

## 1. PC and lamp too low

**Placement.** In `room_test_desk_seating` the top-left `desk1` has Tiled y 140 (F = 140,
top surface rows 101-116, front edge of the top at 117). `pc1` and `bankers_lamp1` have Tiled y
125: their bottom row is 124, **7 px below the top's front edge** (8 px below the last row of
the surface). The keyboard and the lamp foot hang over the apron. The sprite proportions are
not the cause: with the bottom at F-25 (bottom row 114, two rows inside the front edge) the
keyboard sits on the front of the top and the monitor foot about mid-depth, which is the look
the user chose (panel 3 of `tsplan/mock_layering.png`, which used F-26 as the base row).

**What looks right.** For items that stand up (monitors, lamps): base row 3-8 rows behind the
top's front edge, so for `desk1`/`zds_desk1` Tiled bottom F-25 to F-30. Flat or front items
(keyboards, phones, notes, mugs) can sit at the front edge (base row 0-1 px past it).

**Elsewhere.** Over the 472 unique desk-item placements in the table-surface audit, 170 have
their base more than 2 px past the top's front edge and 68 more than 6 px. Most are small:

| Item | Placements | Median base past the front edge | Where |
|---|---|---|---|
| `office-misc-lamp3` | 56 | +11.7 px | `desk1` in the shared office rooms (64 missions incl. biometric_breach, ceo_exfil, crypto*) |
| `phone5` | 61 | +2.3 px | same rooms |
| `aw_pc_off1` | 1 room | +7 px | `zds_desk1` in the awareness training room (21 missions) |
| `pc5` | 4 | +5 px | `hospital_desk1/2`, m02 and sis01 |
| PCs `pc6`, `pc8`, `pc10`, laptops, `keyboard3` | 30+ | +0.3 to +0.4 px | on the front edge: fine for keyboards, a little forward for monitors |

**Fix: (a) placement, data only.** Test room: move table items 76-81 and 86-92 up 10 px
(Tiled y 125 → 115, 135 → 125 on `smalldesk1`, and so on). Real rooms: move `office-misc-lamp3`
up 12-16 px in the shared office maps, `aw_pc_off1` up 8-12, `pc5` up 6-10 (scenario
positions in m02 and sis01). No sprite touched. The office-misc-lamp3 maps are shared by many
missions, so one map edit fixes all of them; it is a Tiled `table_items` y change and keeps the
item in its desk's table group.

## 2. Desk height against seated people

Top front edge above the floor (first apron row to the floor line), from the sprites:

| Desk | Size | Top rows | Height | vs lap 20-23 / elbow 24-26 | Used with a chair |
|---|---|---|---|---|---|
| `desk1`, `zds_desk1`, `desk2`, `desk3`, `zds_desk3` | 78/44/51 x 39 | 0-15 | **23** | between lap and elbow: right | 94 placements, 61 missions |
| `hospital_conference_table` | 126 x 55 | 2-29 | 25 | at the elbow: right | 72 missions |
| `hospital_desk1/2` | 62 x 48 | 2-18 | **28** | 2-4 px above the elbow: tall | 12 placements, 8 rooms, 3 missions (m02, sis01) |
| `exec_desk1` | 80 x 46 | 1-17 | **28** | same: tall | 4 placements, 4 missions (m02 among them) |
| `smalldesk1/2` | 50/32 x 41 | 2-26 | **14** | 6-9 px below the lap: short | 61 placements, 22 missions; 9+7 with a hospital chair, a few with swivels |

**Why `desk1` can still read high.** On the numbers `desk1` is the right height. On screen, a
swivel chair tucked in from the front stops with its castor at F+4 (seat-box experiments), so
the sitter is 4-8 px nearer the viewer than the desk's front plane. The top's front edge then
draws 4 px above the sitter's elbows and 8 px above the lap. Taking 2 leg rows off (`desk1`
at 21) brings that to 2 and 6 px: see the right column of `02_desk_heights.png`. That is a
taste call, so it goes to the user (below). Moving the PC and lamp back removes most of the
"sunk" look on its own (`00_before_after_summary.png`).

**Fixes.**
- `hospital_desk1/2`: **(b) remove 4 rows** from the dark frame (rows 33-36, plain vertical
  legs and panel), height 28 → 24. 2 sprites; 12 placements in 8 rooms, 3 missions.
- `exec_desk1`: **(b) remove 4 rows** (rows 31-34), 28 → 24. 1 sprite; 4 rooms, 4 missions.
- `smalldesk1/2`: either **(b) add 8 leg rows** (duplicate row 34), 14 → 22, or **(a) swap**
  `smalldesk1` for `desk3` (51 x 39, height 23, same footprint width) in rooms where someone
  sits at it. The +8 version looks right in the mock-up, but the very deep top (25 rows, an
  older, steeper projection) then reads as a tall box. 2 sprites, 61 placements in 37 rooms,
  22 missions; the swap would touch only the rooms with a seated NPC or chair at it.
- `desk1`/`zds_desk1`: leave at 23, unless the user prefers 21 (2 sprites, 94 placements,
  45 rooms, 61 missions; removes 2 rows from the legs and the drawn-in tower).

**How a shorter or taller desk lands in the game.** `rooms.js` places a Tiled object at
`obj.y - obj.height` (map values) with origin 0,0 and draws the texture at its real height.
Change only the PNG and the desk keeps its top where it was and its floor line moves; for a
desk that is wrong (it changes the footprint, the collision box and the gap to the chair in
front). Keep the floor: in each map set the placement's `height` to the new value (y unchanged),
update the tileset entry's `imageheight`, and move every table item and every scenario object
positioned on that desk by the same number of rows. This needs a small script over the maps
(`scripts/room_gen/room_edit.py` refuses some maps, see SEAT_BOX_EXPERIMENTS.md part 2). The
desk box table from the seat-box plan (top depth per sprite) is unchanged: only the leg rows
change.

## 3. Chairs

For each seat, where the sitter's lowest pixel lands against the chair's floor row (median
over 108 atlases, range in brackets). Positive means below the chair's floor line. Expected:
south-facing about +1 to +3 (feet in front of the chair), side-on 0 to +2, north-facing about
-3 (heels under the seat, above the rear legs' feet). The swivel `chair-darkgray-1` gives +2
south, +1 west, -3 north and looks right, so it is the reference.

| Seat | Facing | Seat point above floor | Sitter's lowest pixel | Verdict |
|---|---|---|---|---|
| `hospital_chair_north`, `_north2`, `aw_chair_north_*` | N | 13 | **+3 (+1..+7)** | **too low by about 6**: heels show below the chair's legs |
| `hospital_chair_south`, `aw_chair_south_*` | S | 17 | +3 | reads fine, but legs 11 rows vs the north view's 10 |
| `m10_steel_chair1` | S | 13 | **+7** | **too low by about 5** |
| `chair-waiting-left-1` / `-right-1` | W / E | 14 | **+5 (+4..+7)** | **seat point too low by 4** (feet through the floor) |
| `leather_sofa1`, `uni_sofa2` | S | 13 | +7 | withdrawn: feet forward off a low sofa reads right (mock-up) |
| `sofa1`, `club_chair_*`, `leather_chair1`, `aw_studio_chair_*`, `hce_bench1` | | 18-22 | -2..+2 | fine |
| `chair-darkgray-1`, grey, white swivels | all | 18-19 | -3..+2 | fine (reference) |
| `chair-exec` south, `exec_chair_black1` | S | 23-26 | -6 / -3 | fine: the feet rest on the castor star |
| `chair-exec` north, `exec_chair_back1` | N | 38 | -22 | hidden by the backrest; the 4 px lift is deliberate |

**The hospital static chair.** The user's chair is `hospital_chair_north` (the one in the test
room and in m02's scenario objects; m02 and sis01 maps also use `hospital_chair_north2` and
`hospital_chair_south`). It is one chair drawn from both sides, with recolours `aw_chair_*`
in the awareness rooms. Its legs are 10 rows below the seat's front edge (north view) and 11
(south view); the sitter's lower leg is 13-14.

**Fixes.**
- Hospital chair family: **(b) add leg rows** by duplicating a plain leg row: north views +4
  (row 20; lowest pixel then -1, range -3..+3), south views +3 (row 27), so both views have
  14 leg rows. 7 sprites (`hospital_chair_north`, `hospital_chair_north2`,
  `aw_chair_north_charcoal1`, `aw_chair_north_slate1`, `hospital_chair_south`,
  `aw_chair_south_charcoal1`, `aw_chair_south_slate1`); 126 placements in 29 rooms,
  63 missions (m02, sis01 and most of the awareness course).
  - Seat points in `STATIC_SEATS` stay as they are: they count from the top, and the game keeps
    a chair's top where it was (see the desk note), so only the floor row moves down 3-4 px.
    For a chair that is what we want: seat, backrest and the sitter stay put and the legs reach
    further down. Its depth (bottom + 0.5) rises by the same 3-4 px, which keeps it in front of
    the desk it faces.
  - Tiled metadata: update the tileset `imageheight` and each placement's `height`, with `y`
    +4 (or +3) so the top stays put. Without that, Tiled shows the old size; the game is
    unaffected either way.
  - +6 on the north view was tried and is too much: the legs show below the heels.
- `m10_steel_chair1`: **(b) +5 leg rows** (duplicate row 21). 1 sprite, 3 placements, m10 only.
- Waiting chairs: **(a) seat point** y 23 → 19 for both in `STATIC_SEATS`. Data only; check
  `test/js/seating.test.mjs` for pinned values. 38 placements, 9 rooms, 12 missions (m01's
  reception among them; no audio is affected).

## 4. Other desk items

Common table items (opaque size): monitors `pc1` 28x23, `pc5` 34x27, `pc6` 32x30, `pc8` 34x22,
`pc10` 37x28, `pc11` 31x21, `pc12` 31x24 (each with its keyboard drawn in); laptops 24x18;
`office-misc-lamp3` 9x14, `office-misc-lamp4` 12x23, `bankers_lamp1` 23x25; phones 14x16 to
16x18; `mugs_tray1` 20x15.

- **Monitors** are in proportion: placed at the back of `desk1` the screen top lands about level
  with a seated head top, as a real monitor does with the eyes. Only their placement needs the
  rule in section 1.
- **`bankers_lamp1` is too big.** It is taller than every monitor and its shade (23 px) is
  wider than `pc1`'s screen (18 px); a real banker's lamp shade is about half a monitor's width.
  Cheapest: (a) swap it for `office-misc-lamp4` (12x23) on desks where people sit. 12 placements,
  7 rooms, 16 missions. A redrawn lamp at about 14x18 would be (c), PixelLab at that exact
  size, which needs the user's approval.
- **Phones, notes, mugs and laptops** read fine against a seated person.
- **Monitors seen from behind.** Every PC sprite shows the screen side. A sitter behind a desk
  (facing south, like Tomasz in the accounts room) looks at the back of a monitor that is
  drawn facing the viewer. Options: put a laptop or no monitor on desks used from behind, or
  make rear-view monitor sprites with (c). Noted, not urgent.

## Cost summary

| Problem | Fix | Kind | Sprites | Reach |
|---|---|---|---|---|
| PC and lamp hang off the front | move items 10 px back (test room); lamp3, aw_pc_off1, pc5 in real rooms | (a) | 0 | test room; shared office maps (64 missions), training room (21), m02/sis01 |
| Hospital chair legs short | +4 rows north views, +3 south views | (b) | 7 | 126 placements, 63 missions |
| `m10_steel_chair1` low | +5 rows | (b) | 1 | m10 |
| Waiting chairs sitter sinks | seat y 23 → 19 | (a) | 0 | 12 missions |
| `hospital_desk1/2` tall | -4 rows, floor kept, items moved | (b) | 2 | m02, sis01 (+1) |
| `exec_desk1` tall | -4 rows, floor kept | (b) | 1 | 4 missions |
| `smalldesk1/2` short | +8 rows, or swap to `desk3` where sat at | (b) or (a) | 2 or 0 | 22 missions (+8), fewer for the swap |
| `desk1`/`zds_desk1` read high | none, or -2 rows | (b) | 0 or 2 | 61 missions |
| `bankers_lamp1` oversized | swap to `office-misc-lamp4`, or regenerate | (a) or (c) | 0 or 1 | 16 missions |

Sprite edits (b) are row duplications or deletions at native size, no resampling. Keep the
script that makes them in `tools/` so they can be re-run, and render each room that uses the
sprite before committing (room depth and the door alignment check are unaffected; the table
group depth follows the sprite's real height).

## For the user to choose

1. `desk1`/`zds_desk1`: keep at 23 (recommended: on the numbers it is right, and moving the PC and
   lamp back fixes most of the look) or take off 2 rows to 21.
2. `smalldesk1/2`: add 8 leg rows, or swap `smalldesk1` for `desk3` where people sit.
3. `bankers_lamp1`: swap for `office-misc-lamp4`, or approve one PixelLab regeneration at about
   14x18.
