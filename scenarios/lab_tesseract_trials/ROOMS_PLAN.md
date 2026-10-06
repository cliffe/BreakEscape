# The Keyholder Trials: university rooms plan

Status: **Phases 0-1 built and committed** (`ed2be44c`, `4d840ff0`); **Phase 2 built, not yet committed** (build notes in sections 9 and 10). Plan written 2026-10-06 against HEAD `532bd7d3` (the room-dressing pass on the current maps is commit `1c18b9a3`). Kind of game: a lab scenario with SAFETYNET spy framing (AGENTS.md "Lab, demo and test scenarios"; brief `docs/agents/TESSERACT_TRIALS_BRIEF.md`). Aim of this plan: rooms that read as the Computing building of a UK university in freshers' week, with every scenario object landing on a proper map slot.

User direction (via the orchestrator, during planning): be ambitious, design a new map for **every** room type named (foyer/atrium, computer teaching lab, student common room, corridor with lockers, pigeonholes and noticeboards, library with Special Collections, academic office, maker space/workshop, lecture theatre, seminar room); place the rooms that have no scenario room yet, spread **existing** clues into them rather than adding locks, and keep the middle play-time estimate under about 90 minutes.

Previews for this plan were rendered into the session scratchpad (`/tmp/claude-1000/.../scratchpad/rooms-plan/current/`, `.../hospital/`, `.../other/`), which is lost when the session ends. Re-make them with:

```bash
python3 scripts/render_room_preview.py room_reception room_lab room_break hall_1x2gu room_library_1x2gu small_office_room3_1x1gu room_IT --sheet --grid --out <scratch>/current
python3 scripts/render_room_preview.py 'room_hospital_*' --sheet --out <scratch>/hospital
```

## 1. What reads as "university" now, and what doesn't

All seven current maps are drawn on `room1.png` (`office-updated`): lavender walls and the purple office carpet of m01's corporate office. Nothing in any of them says "university": no crest or school sign, no noticeboards, timetables or society posters, no rows of PCs, no projector, no lockers, no kitchen. The preview also shows the conditional slots (bags, briefcases, safes, keys) that the scenario doesn't claim; in game those stay hidden, so the in-game rooms are emptier than the previews.

| Room (map) | Preview evidence | Reads as university | Doesn't |
|---|---|---|---|
| Foyer (`room_reception`, shared by 29 scenarios) | An office reception counter with a PC, desk phone and two floor safes; framed landscape pictures; four potted palms; two pairs of wooden waiting chairs. | Nothing. | A corporate lobby. No sign, crest, info screen or freshers' stand. The Byte Wall, plaque, poster, ASCII chart and paper tape have no slots (slot audit: 5 NO SLOT), so the heritage display is pinned onto bare floor and wall. |
| Teaching lab (`room_lab`, 3 scenarios) | Three office desks with mixed PCs, a server cabinet, two filing cabinets, a **chalkboard on an easel**, lamp-stands, two palms. | A few PCs. | A small IT office. No rows of benches facing a front wall, no projector screen; the easel chalkboard is on the skill's "school chalkboard" list. Tom's whiteboard has no slot. |
| Common room (`room_break`, 5) | Two big armchairs backed against the wall, a wall of bookcases, stacks of wooden chairs, four tables, palms. | Seating. | A library waiting room. No kitchen, lockers or noticeboard; noticeboard, vending machine, coffee station and Cliffe's laptop have no slots (4 NO SLOT). |
| Corridor (`hall_1x2gu`, 6) | Framed pictures on the wall; bags, safes and briefcases strewn along it (all conditional). In game (`build_evidence/smoke-8-workshop.png`) a plain purple strip with the pigeonholes standing in the middle of the floor. | Nothing. | No lockers, noticeboards or signs. Poster, pigeonholes, tag and directory have no slots (4 NO SLOT). |
| Library (`room_library_1x2gu`, 1) | Four bookcases (two along the wall, two free-standing), two armchairs, two lamp-stands. | Bookcases. | No issue desk, no returns, no Special Collections; slip and book have no slots (2 NO SLOT), the safe is a plain floor safe. |
| Sidhu's office (`small_office_room3_1x1gu`, 2) | One bookcase, a desk with a PC, a swivel chair. | An office. | Tiny: about three by two tiles of visible floor, because the common room's north wall covers its bottom two rows. His whiteboard has no slot. |
| Workshop (`room_IT`, 6) | Two desk pairs with PCs, server cabinets, a chalkboard easel, a landscape picture, a table of cameras and drives. | Some kit. | An IT office, not a maker space: no benches, tools, printers or electronics. |

Two findings shape the rest of this plan:

1. **The 10x6 and 5x6 rooms in this building show only two rows of floor.** Every room in grid row −1 (corridor, library, Sidhu's office) has a 10x10 room directly south of it, whose 2-tile north wall is drawn over the smaller room's bottom two rows (README "Wall tile convention"; visible in `smoke-8-workshop.png`, where the corridor shows two floor rows between the workshop's and the foyer's walls). So those rooms have a usable band of y 64-128 only. `validate_room()` checks only the last row for rooms 6 tiles high (`scripts/generate_rooms.py:998`, `bottom_rows = 1 if room["height"] <= 6 else 2`), because the hospital corridors are not covered. **Builders in this plan keep gameplay feet above y 128 in every 10x6 and 5x6 room**, a rule stricter than the validator.
2. **A scenario `type` or `as-type` that ends in a digit can never claim a map slot.** `TiledItemPool` indexes slots by image name with trailing digits stripped (`public/break_escape/js/core/rooms.js:173-191`) and looks up the object's `type` as given (`rooms.js:248-249`), so `"type": "plaque1"`, `"notes4"`, `"whiteboard2"`, `"pigeonholes1"`, `"notice_board1"`, `"vending_machine1"`, `"coffee_station1"`, `"directory_sign1"` and `"book1"` all miss whatever map they are on. That accounts for most of today's 17 NO SLOT lines. The fix is in the scenario, not the maps: `"position": "as-type:<base>"` (for example `as-type:plaque`), keeping the object's `type`. The same applies to a `sprite` override with a digit (`"sprite": "conference_screen1"` falls back to the `pc` type, `rooms.js:2195-2201`). Section 2 lists the `as-type` each object needs.

Other facts the layouts rely on (all checked in code):

- Only objects in a map's **`tables`** layer collide with the player: the bottom quarter of the sprite, inset 10 px each side (`rooms.js:1904` passes `'table'`; body at `rooms.js:2569-2588`). Everything in `items` is walk-through and depth-sorted; wheeled chairs collide and can be pushed. A row of lecture seats in `items` will not stop the player.
- An unclaimed decor sprite is hidden if a claimed sprite in the same room has the **same image name** (`rooms.js:1959`, `:2295`). Claimed slots and decor of the same base type use different images (for example a `pc9` guest terminal among `pc12` decor PCs).
- Scenario objects claim slots in layer order `items`, `table_items`, `conditional_items`, `conditional_table_items`, first unreserved first (`rooms.js:248-275`). Decor PCs in `table_items` are therefore claimed before a `conditional_table_items` PC slot; the slot meant for a scenario PC goes **first** in `table_items`.
- The player spawns at the start room's (160, 144) (`public/break_escape/js/core/player.js:1364-1376`); the foyer keeps that spot clear.
- A room's tileset name is its texture key (`rooms.js:1758`, `map.addTilesetImage(tileset.name, tileset.name)`), so each new floor sheet needs one `this.load.image` line in `game.js`.
- `slot_audit.py`, `predict_door_sides.py` and `check_room_walls.py --scenario` all look maps up by the type name. `room_it`'s file is `room_IT.json`, so today the slot audit skips the workshop and `predict_door_sides.py` fails on it; `check_room_walls.py --scenario` only collects types matching `room_[A-Za-z0-9_]+` (`check_room_walls.py:97`), so it skips `hall_1x2gu` and `small_office_room3_1x1gu`. All new names below are lower case and start `room_uni_`, which every tool picks up.

## 2. The proposed room set

### 2.0 Shared decisions

**Ten scenario rooms, ten new map types, all new builder rooms.** None of the current seven maps is edited or split: each is shared with other scenarios (room_reception by 29, room_it and hall_1x2gu by 6, room_break by 5, room_lab by 3, small_office_room3 by 2, the library by 1), so changing them would change those scenarios too. Each new map is a builder function in `scripts/generate_rooms.py`, so it can be regenerated and reviewed; none is hand-maintained.

| Scenario room | Map type | Size (template) | Floor sheet | New in graph? |
|---|---|---|---|---|
| foyer | `room_uni_foyer` | 10x10 (`10x10`) | `room_uni_foyer` | no |
| teaching_lab | `room_uni_lab` | 10x10 | `room_uni_carpet` | no |
| common_room | `room_uni_common` | 10x10 | `room_uni_common` | no |
| corridor | `room_uni_corridor` | 10x6 (`10x6_hall`) | `room_uni` | no |
| library | `room_uni_library` | 10x6 (`10x6_hall`) | `room_uni_library` | no |
| sidhu_office | `room_uni_office` | **10x6** (`10x6_hall`; was 5x6) | `room_uni_carpet` | no |
| workshop | `room_uni_workshop` | 10x10 | `room_uni_workshop` | no |
| lecture_theatre | `room_uni_lecture` | 20x10 (new `20x10`) | `room_uni_lecture` | **yes** (Phase 2) |
| special_collections | `room_uni_special` | 10x10 | `room_uni_special` | **yes** (Phase 2) |
| seminar_room | `room_uni_seminar` | 10x10 | `room_uni_carpet` | **yes** (Phase 2) |

Sidhu's office grows from 5x6 to 10x6. It sits under the common room's north wall either way, so in the 5x6 map the player had about three by two tiles of floor; at 10x6 it has a usable strip, and it can carry the north door to the seminar room in Phase 2 with the doors aligning (section 3). The grid and every existing door stay where they are (checked, section 3).

**Floor and wall sheets (free, scripted).** A new `scripts/room_gen/make_uni_tileset.py`, written the way `make_hospital_tileset.py` is: open `room6.png`, `raise_back_wall(src, sheet_floor_top(SRC))` first (so every sheet is on the 2-tile standard by construction), repaint room6's back-wall grey and side-wall grey with the university palette, paint the skirting rows `FLOOR_TOP-5`..`FLOOR_TOP-3` in the accent, then fill `FLOOR_BOX` with each variant's pixel function. Tile indices stay room6's, so maps keep `ROOM6_FIRSTGID` (701) and only the tileset's `name` and `image` change. It can import `is_floor` and `FLOOR_BOX` from `make_hospital_tileset.py`; the carpet and rug painters there use module-level hospital colours and `RUG_BOX`, so copy them into the new script with the university palette as parameters rather than importing them (don't edit the hospital script).

Palette (default; question Q5): back wall warm off-white (232, 226, 212), side wall (214, 207, 192), skirting a deep "Miskatonic teal" (38, 98, 108) over (24, 66, 74). One wall treatment for the whole building, so it reads as one place; the floors tell rooms apart:

| Sheet | Floor | Used by | 1:1 decal (10x10 rooms lay the 320 px sheet out cell for cell, so paint lands at the same room pixels and draws under every sprite) |
|---|---|---|---|
| `room_uni` | blue-grey sheet vinyl with flecks | corridor | none (halls remap rows via `room6_hall_floor`, so no decals) |
| `room_uni_carpet` | charcoal-blue carpet tiles, quarter-turned grain | lab, Sidhu's office, seminar room | none |
| `room_uni_foyer` | cream terrazzo with coloured chips | foyer | a brass-ring inlay with an "M" centred on (160, 176), radius 26, under the player's feet at the spawn (the spawn point (160, 144) is the sprite centre; the feet are about 32 px lower) |
| `room_uni_lecture` | blue carpet; y 64-127 a grey vinyl "front" strip | lecture theatre | tier nosings: a 2 px light line and 1 px shadow at y 128, 160, 192, 224, 256, 288. They run the full width, so they survive the 20-wide column repeat |
| `room_uni_common` | warm carpet | common room | kitchen safety-vinyl patch under the kitchenette, x 224-288, y 64-128 |
| `room_uni_library` | deep green carpet | library | none |
| `room_uni_special` | oxblood carpet | Special Collections | a rug under the reading table, x 64-206, y 140-214 (same painter as `make_exec`'s rug) |
| `room_uni_workshop` | sealed grey concrete | workshop | a yellow and black hazard line round the bench zone, a 2 px border on x 116-192, y 132-206 |

**Builder plumbing** (all in `scripts/generate_rooms.py`, section 5 has the full list): a `UNI_FLOOR_SHEETS` dict (map name to sheet), read by `room_tilesets()` beside the existing `room_hospital*` branch (`generate_rooms.py:288-305`, with `HOSPITAL_FLOOR_VARIANTS` at `:308`); 10x10 rooms use `build_room(..., use_room6=True)`; 10x6 rooms use `template_key="10x6_hall"` with `room_override=room6_hall_floor(10, 6)` as `_hospital_hall()` does (`:1700-1744`); the lecture theatre uses a new `20x10` template (section 2.9).

**Conventions in the tables below.** Coordinates are room pixels, `x` = left edge, `y` = feet (bottom edge), as `make_obj()` takes them. "(H)" = new hand-drawn art and "(P0-P3)" = a PixelLab batch (section 4); until that art exists the builder uses the placeholder named. Layer `ct` = `conditional_table_items`, `ci` = `conditional_items`, `ti` = `table_items`. Items marked "Phase 3 only: omit until registered" are left out of the builder until their art is registered (`lookup()` raises `KeyError` on an unknown name, `generate_rooms.py:168-176`). Catalog `objects` placed in the `tables` layer (`it_workbench1`, `kitchen_counter_sink1`) are made with `make_obj("objects", ...)` and appended to the tables list, as `room_hospital_staff` does. A **claimed slot** is where a scenario object lands; it names the object id and the `as-type` the scenario needs (section 1, finding 2). Decor is drawn whenever nothing claims it. Every wall item keeps top ≥ 12, bottom ≤ 59 and x inside 64-256 (10 wide) on the back wall, or x 12-30 / 290-308 on a side wall below the door row; every floor item keeps its feet out of the NW and NE 2x3-tile corners, x ≥ 24 and right ≤ W−24, and out of the bottom two rows. Wall-backed furniture stands with its top edge on y 70, as the existing builders do (`room_hospital_hall`'s vending machine at 104,130, height 60). **Recessed** means a tall item whose feet sit at y 74 and top at y ≥ 12: it stands on the floor line and takes only 10 px of floor, the way the ward corridor's clinical sink does; it's the only kind of floor furniture the 10x6 rooms can take without blocking their two-row strip.

**Spacing rule (revised after reviews 1 and 2).** A tap gathers every interactable whose bounds contain the tap point or whose anchor is within 32 px of it (`public/break_escape/js/core/game.js:1723-1742`, `TAP_SLOP = TILE_SIZE`), and two or more raise a pick-one menu. Only objects with `interactable` set are gathered (`game.js:1750`): scenario objects (`rooms.js:368`) and swivel chairs (`rooms.js:2695-2698`); plain decor is not, so decor may sit close to an interactable but a `chair-*` may not. So neighbouring interactables need **at least 32 px of clear space between their edges**, not just between their top-left corners; for side-by-side wall items that means the next item's left edge is ≥ 32 px past the previous one's right edge. An NPC counts too. Its tile position is its body centre, the feet (`npc-sprites.js:116-123`), so an NPC at pixel (x, y) has sprite bounds x−40..x+40, y−71..y+9 and a tap anchor at (x, y−31); those bounds, plus 32 px, must stay off every interactable. **Closed doors count as well** (`game.js:1797-1813`: anchor at the door's centre, `doors.js:451`, gathered within 64 px), so keep wall interactables away from door corners. Section 2 names the few accepted pairs; the browser walk taps every claimed object and reports any menu. The exceptions are pairs that belong together, named where they occur.

### 2.1 Foyer / atrium: `room_uni_foyer` (10x10, builder)

A Computing-school atrium on the first day of freshers' week: the school's crest sign, the 1979 heritage display (the Byte Wall teaching corner), a display case of old media, and the CryptoSecure stand where Jordan works the crowd. The player starts standing on the brass "M" inlay.

Doors: north (corridor) NW corner, centre (48, 32); west (lab) and east (common room) on row 2, centres (16, 80) and (304, 80); south (lecture theatre, Phase 2) SW corner, centre (48, 288), in the bottom rows the lecture theatre's wall covers. Keep clear: the corners, the W-E door lane y 64-128, the spawn area (the player's feet land near (160, 176); keep x 128-192, y 150-200 free of furniture), and a south lane x 32-96 from y 96 to 256.

```
     0   1   2   3   4   5   6   7   8   9
 0   #  [N]   .  p   .  B  [crest] c   #      p plaque, B Byte Wall, c powers-of-two chart (≥ 32 px gaps, clear of the N door)
 1   #  [N]  #   .   .   .   .   .   .   #
 2  [W]  .   .   .   .   .   .   .   .  [E]     W-E lane
 3   ^   .   .   .   .  @M   .   .   .   f      @ spawn on the inlay, f fire point (E wall)
 4   ^   .   .   .   .   .   .  [ display  ]    display case: ASCII chart, paper tape
 5   ^   .   .   J   .   .   .  [  case    ]    J Jordan, behind his stand
 6   ^   .   . [ CryptoSecure  ] b   .   .       b pull-up banner
 7   ^   .   . [ stand: lockbox, laptop ]  .
 8   ^  [S]  (covered by the lecture theatre's north wall)
 9   ^  [S]
     ^ = west poster on the side wall; south lane x 32-96 kept clear
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `plaque1` | items | 82, 52 (x 82-106) | `display_plaque`, needs `as-type:plaque` |
| `alarm_panel` | items | 138, 52 (x 138-155; `alarm_panel2` 138-170) | `byte_wall` (type `alarm_panel`, no change). Later `alarm_panel2` (P2, the 1979 front panel, ≤ 32x30) at the same anchor; the base type stays `alarm_panel`, so the scenario needs no edit |
| `chart2` | items | 222, 52 (x 222-241) | `powers_of_two_poster` (type `chart`, no change) |
| `uni_crest_sign1` (H, **44x22**) | items | 174, 42 (x 174-218) | decor: crest and "COMPUTING" (decor is not gathered by a tap, so it may sit between the Byte Wall and the chart) |
| `uni_poster1` (H, Freshers' Week, 16x21) | items | 14, 136 | decor, west wall |
| `fire_alarm_point1` | items | 292, 132 | decor, east wall |
| `desk1` (P1: `display_case1`, 64x36) | tables | 206, 196 | heritage display table (replaces the scenario's dynamic `heritage_display_table`). When `display_case1` replaces it, recompute the two fractions to keep 32 px between the papers, or accept one menu for the pair |
| `notes4` | ct, on the display, x_frac 0.17, surface 0.45 (x about 207-234) | | `ascii_chart`, needs `as-type:notes` (listed before the tape in `ct`, matching scenario order) |
| `notes2` | ct, x_frac 0.86, surface 0.45 (x about 265-281) | | `paper_tape`, needs `as-type:notes`. 31-32 px clear of the chart: check the menu in the browser walk; if one shows, move the tape onto the case's front edge (surface 0.55) |
| `desk1` | tables | 100, 240 | CryptoSecure stand (stays `desk1`: a 64 px PixelLab stand couldn't hold the lockbox and laptop 32 px apart, so `fair_stand1` was dropped from P1) |
| `briefcase11` | ct, on the stand, x_frac 0.16, surface 0.45 (x about 101-124) | | `cryptosecure_lockbox` (type `briefcase`, no change) |
| `laptop6` (17x12) | ct, x_frac 0.83, surface 0.40 (x about 156-173) | | `signup_laptop`; the smaller laptop leaves 32 px clear of the lockbox |
| `cryptosecure_banner1` (H, 22x58) | items | 182, 240 | decor |

NPCs: `jordan_pike` at tile (3.6, 5.3) = x 115, feet 170, standing beside the west end of his stand, just south-west of the spawn; his sprite bounds (x 75-155, y 99-179) and their 32 px margin stay off the lockbox and laptop on the stand. Hidden NPCs stay at 500, 500.

### 2.2 Computer teaching lab: `room_uni_lab` (10x10, builder)

Two long benches of PCs facing a front wall with a projector screen and a whiteboard, a lecturer's desk at the front, a printer at the back. In Phase 1 Tom teaches here; from Phase 2 the lab keeps the PCs (L3 and L8a) and Tom gives his induction in the lecture theatre.

Door: east, row 2, centre (304, 80). Keep clear: the corners, the east lane y 64-128 from x 288 to the aisle, the aisle x 192-222 down the east side of the benches, the bottom two rows.

```
     0   1   2   3   4   5   6   7   8   9
 0   #   #  [WB] [projector scr]   k   #   #      WB whiteboard2, k clock
 1   #   #   .   .   .   .   .   .   #   #
 2   t   .   .   .   .   .   .  T   .  [E]      t timetable (W wall), T Tom (Phase 1)
 3   |  [=pc==pc==pc==LA]  .  [lecturer]  n     LA lab account PC, n "no food" sign (E wall)
 4   |   c   c   c   c   .  [  desk   ]  |      c chairs facing north
 5   |  [=pc==pc==pc==GT]  .   .   .   . |      GT Keyholder guest terminal (black pc9)
 6   |   c   c   c   c   .   .   .   .   |
 7   |   .   .   .   .   .   .  bin  [copier]
 8-9 (kept clear)
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `whiteboard2` | items | 70, 50 (x 70-114) | Phase 1: `tom_board`, needs `as-type:whiteboard`. Phase 2: decor. West of Tom, so his sprite doesn't cover it |
| `projector_screen1` (H, 88x42) | items | 122, 54 | decor (screen showing "Welcome to Computing") |
| `wall_clock1` | items | 222, 46 | decor |
| `uni_timetable1` (H, 16x22) | items | 14, 140 | decor, west wall |
| `uni_poster7` (H, "No food or drink", 16x21) | items | 292, 140 | decor, east wall |
| `desk1` ×2 (bench row 1) | tables | 36, 132 and 114, 132 | rows 88 px apart (review 1): a 39 px desk plus a 32 px chair plus a gap |
| `desk1` ×2 (bench row 2) | tables | 36, 220 and 114, 220 | |
| `hospital_desk1` (lecturer's desk) | tables | 222, 150 | decor; `laptop1` at x_frac 0.35, surface 0.40 and `office-misc-lamp3` at 0.85, 0.20 (ti) |
| `pc11` | **ti, first pc entry**, on desk (114,132), x_frac 0.80, surface 0.30 | | `lab_account_pc` |
| `pc9` | **ti, second pc entry**, on desk (114,220), x_frac 0.80, surface 0.30 | | `keyholder_guest_terminal` |
| `pc12` ×6 | ti, after the two above: desks (36,132) at 0.30 and 0.78, (114,132) at 0.30, (36,220) at 0.30 and 0.78, (114,220) at 0.30 | | decor |
| `chair-white-2-rotate5` ×4 | items | x 46 and 84 at y 160 and at y 248 | decor (wheeled, face north). None within 32 px of a claimed PC (the nearest chair ends at x 116; the PCs start at about x 157). The two chairs in a row are 6 px apart, so tapping one can offer the other: accepted, since chairs only get kicked |
| `photocopier1` | items | 248, 250 | decor |
| `bin8` | items | 226, 250 | decor (out of the aisle) |

The two claimed PCs go first in `table_items`, because scenario `pc` objects search `table_items` before any conditional layer and would otherwise take decor PCs; they use images (`pc11`, `pc9`) no decor PC uses, so no decor PC is hidden. Both sit at the aisle end of their bench; the player reaches them from the aisle corner or from the gap behind the row (the browser walk confirms which).

NPCs: Phase 1 `tom_shaw` at (7.6, 2.9) = x 243, feet 93, by the lecturer's desk. His sprite bounds (x 203-283, y 22-102) clear the whiteboard (x ≤ 114) and the lab account PC (x ≤ 192). Phase 2: none.

### 2.3 Student common room: `room_uni_common` (10x10, builder)

A student common room: noticeboard of society posters, a snack machine, a row of student lockers with Candidate Locker 4 at the end, a kitchenette with a hot-water boiler, a coffee station, a sofa round a low table, and a high table where Cliffe hides from his committee.

Door: west, row 2, centre (16, 80). Keep clear: the west lane y 64-128, the floor under the noticeboard (x 64-110, y 64-100), the floor in front of the lockers (x 156-230, y 132-170), the bottom two rows (covered by the lecture theatre's wall from Phase 2).

```
     0   1   2   3   4   5   6   7   8   9
 0   #   #  [NB]  s s [vend][lockers 1-3][4] [boiler]#     NB noticeboard, s society posters
 1   #   #   .   .  [    ][          ][ ] [counter]#     kitchen vinyl under the counter
 2  [W]  .   .   .  [    ][          ][ ]    .    #
 3   f   .   .   .   .   .   .   .   .   .  [cof]        f fire point, cof coffee station
 4   |   .   .   .   .   .   .   .   .   .   |
 5   | [sofa]  [low table] ch  .   .   .   .   |
 6   |   .   .   .   .   .   C  [high table]  |         Cliffe at the table's west end, laptop at its east end
 7   |   M   .   .   .   .   .   .   .   .   |           M Megan
 8-9 (covered from Phase 2)
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `notice_board1` | items | 68, 50 | `common_noticeboard`, needs `as-type:notice_board` |
| `uni_poster2`, `uni_poster3` (H, society and CTF-night posters) | items | 116, 46 and 136, 46 | decor |
| `hot_water_boiler1` | items | 236, 56 | decor |
| `fire_alarm_point1` | items | 14, 132 | decor, west wall |
| `vending_machine1` | items | 114, 130 | `common_vending_machine`, needs `as-type:vending_machine` |
| `student_lockers1` (H, staff_lockers1 renumbered 1-3, 50x62) | items | 160, 132 | decor |
| `student_locker1` (H, one column of the same art, numbered 4, about 17x62) | ci | 210, 132 | `candidate_locker_4`, needs `as-type:student_locker` |
| `kitchen_counter_sink1` | tables (catalog kind `objects`: `make_obj("objects", ...)` appended to the tables list, as `room_hospital_staff` does at `generate_rooms.py:1586-1596`) | 230, 110 | decor; `kettle1` (0.25, 0.25) and `mugs_tray1` (0.70, 0.30) on it (ti) |
| `coffee_station1` | items | 258, 172 | `coffee_station`, needs `as-type:coffee_station` |
| `sofa1` (P1: `uni_sofa1`) | items | 48, 214 | decor |
| `smalldesk1` (low table) | tables | 108, 214 | decor, `office-misc-cup2` at x_frac 0.5, surface 0.35 (ti) |
| `hospital_chair1` | items | 162, 210 | decor, faces the low table |
| `smalldesk1` (high table) | tables | 220, 240 | |
| `laptop1` | ct, on the high table, x_frac 0.70, surface 0.40 (x about 243-267) | | `cliffe_laptop` (type `laptop`, `sprite` `laptop1`; lands by its type) |

NPCs: `megan_oyelaran` at (2.4, 7.6) = x 77, feet 243, below the sofa; `cliffe_schreuders` at (5.3, 7.4) = x 170, feet 237, west of his high table. His sprite bounds (x 130-210, y 166-246) keep 32 px off the laptop (x ≥ 243), and stay clear of Locker 4 (y ≤ 132) and the coffee station (x ≥ 258).

### 2.4 Corridor: `room_uni_corridor` (10x6, builder)

The Computing corridor: a recessed bank of lockers, the department noticeboard with the Trial V poster pinned to it, the post-room pigeonholes, CryptoSecure's wall-mounted drop box with its tag, a fire point, and a narrow directory by the east door. Only y 64-128 is floor (finding 1), and the corridor is a through route in all four directions, so it has **no free-standing floor furniture**.

Doors: south (foyer) SW corner, centre (48, 160), drawn in the foyer's wall; north (workshop) NE corner, centre (272, 32); west (library) and east (Sidhu's office) row 2.

```
     0   1     2-3       3-4        5     6     7     8     9
 0   #   .   [lockers ][NB+poster] [PH] cs [DB+tag]  [N]  #     PH pigeonholes, cs CryptoSecure poster, DB drop box
 1   #   .    [recessed]  .          .     .        .    [N]  #
 2  [W]  .  . . . . . . . . . . . . . . . . . . . . . .   d [E]   d directory (E wall)
 3   f   .  . . . . . . . . . . . . . . . . . . . . . .   .  |    f fire point (W wall)
 4-5 [S] (covered by the foyer's north wall)
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `student_lockers1` (H) | items | 58, 74 (recessed, top 12; foot centre x 83, outside the NW corner) | decor |
| `notice_board1` | items | 112, 50 | decor (nothing in this room claims a noticeboard) |
| `notes6` | **ci, first notes entry** | 114, 54 (x 114-128, on the board's left half; feet 54 > 50 so it draws over it) | `trial_v_poster` (type `notes`, `sprite` `notes6`; no change) |
| `pigeonholes1` | items | 160, 52 (x 160-188, 32 px clear of the poster) | `pigeonholes`, needs `as-type:pigeonholes` |
| `uni_poster4` (H, CryptoSecure "Verify everything") | items | 192, 46 | decor |
| `drop_box1` (H, wall-mounted post box with a keypad and the CryptoSecure mark, 20x24) | ci | 220, 54 (x 220-240, 32 px clear of the pigeonholes and clear of the workshop door's tap range) | `cryptosecure_drop_box`, needs `as-type:drop_box` (stays a locked container) |
| `notes3` | **ci, second notes entry** | 226, 59 (x 226-240, on the box: feet 59 > 54) | `drop_box_tag`, needs `as-type:notes`. Shares a pick-one menu with the box: a tag tied to its box is a pair |
| `fire_alarm_point1` | items | 14, 128 | decor, west wall |
| `uni_directory1` (H, narrow wall directory, 16x32) | items | 292, 128 (east wall, just below the door row) | `floor_directory`, needs `as-type:uni_directory`. Shares a pick-one menu with the east door (Sidhu's office): the only visible side-wall strip is y 96-128, next to the door, so this is an accepted pair; the directory names that door anyway |

Interactable spacing on the back wall: poster x 114-128, pigeonholes 160-188, drop box and tag 220-240 (6 px further west than round 1 had them, to keep the drop box out of the workshop door's tap range), so 32 px of clear wall between each (section 2.0 rule). The old wide `directory_sign1` doesn't fit on this wall with everything else, which is why the directory becomes a narrow side-wall sign. `validate_room()` will warn "wall items overlap" for notice board/poster and drop box/tag (`generate_rooms.py:825-828`): both are deliberate (pinned on), so note them in the check-1 report.

NPCs: none.

### 2.5 Library (issue desk and returns): `room_uni_library` (10x6, builder)

The library's front of house: shelves along the back wall, the issue desk with the returns on it (the Codebreakers copy with the slip inside), the librarian's empty chair, and from Phase 2 the stairs/door up to Special Collections in the NE corner. Only y 64-128 is floor; the strip west of the desk is the librarian's side and is not walked.

Doors: east (corridor) row 2; north (Special Collections, Phase 2) NE corner, centre (272, 32).

```
     0   1    2     3     4    5   6     7    8   9
 0   #   #  [bookcase][bookcase][bookcase] [LIBRARY sign] [N] #
 1   #   #  [ recessed shelves          ]   .     .     [N] #
 2   #  tr   ch  [ issue desk: book+slip ]  .  (safe P1)  [E]     tr book trolley (P0), ch librarian's chair
 3   #   .    .  [                       ]  .     .      .  |
 4-5 (covered by the lab's north wall)
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `bookcase` ×3 | items | 64, 74; 107, 74; 150, 74 (recessed) | decor |
| `uni_sign_library1` (H, "LIBRARY · QUIET PLEASE", 44x14) | items | 200, 34 | decor |
| `hospital_desk2` (issue desk) | tables | 124, 124 | |
| `book1` | ct, on the desk, x_frac 0.62, surface 0.35 | | `codebreakers_book` (`sprite` `book` already matches base `book`; no change) |
| `notes4` | ct, x_frac 0.80, surface 0.50 | | `returns_slip`, needs `as-type:notes`. Shares a pick-one menu with the book: the slip is tucked in that book |
| `office-misc-lamp4` | ti, x_frac 0.15, surface 0.20 | | decor |
| `hospital_chair_south` | items | 100, 110 | decor, the librarian's chair |
| `safe1` | ci | 232, 120 | **Phase 1 only**: `special_collections_safe`. From Phase 2 the safe is in Special Collections and this slot is unclaimed, so it isn't drawn |
| `book_trolley1` (P0) | items | 40, 118 | decor, **Phase 3 only: omit until registered** |

The desk is reached from its east end (x 186-230). From there the slip is in reach; the book's top-left (about 153, 73) may be just out of reach (review 1). Both open from the same pick-one menu, so this is fine if the slip is reachable; the browser walk confirms it, and if the book alone matters to a player, move it to x_frac 0.72. NPCs: none.

### 2.6 Special Collections: `room_uni_special` (10x10, builder, Phase 2)

A quiet, warmer room up from the library: glass-fronted bookcases, a reading table with green lamps on a rug, the old department archive safe, display cases of 1970s media. The Special Collections safe (L6) moves here; its contents already include the 1979 job tape and the candidate file, which suit this room.

Door: south (library) SE corner, centre (272, 288), drawn in the library's wall. Keep clear: the east lane x 256-288 from the door up to y 120, the bottom two rows (covered).

```
     0   1   2   3   4   5   6   7   8   9
 0   #   #  [SPECIAL COLLECTIONS sign] [portrait] #   #
 1   #   #   .   .   .   .   .   .   #   #
 2   #   #  [bookcase][bookcase][bookcase][bookcase] .  #
 3   |  pc  [  (bookcases stand on the wall)    ]  .  ^
 4   |   .   ch      ch      .   .   .   .   .  ^      ch chairs, ^ east lane to the door
 5   |  ch  [ reading table on the rug ]  ch  .  ^
 6   |   .   .   .   .   .   .   .  [safe] .  ^
 7   | [case]  .   .   .   .   .   .   .   .  ^        case display case (P1), pc plan chest (P1)
 8-9 [S] (covered by the library's north wall)
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `uni_sign_special1` (H, "SPECIAL COLLECTIONS · BY APPOINTMENT", 64x14) | items | 100, 40 | decor |
| `picture11` | items | 190, 44 | decor (the founder's portrait) |
| `bookcase` ×4 | items | 64, 120; 107, 120; 150, 120; 193, 120 (top edge on y 70) | decor |
| `hospital_conference_table` (reading table) | tables | 72, 206 | decor; on it (ti): `office-misc-lamp4` at x_frac 0.2 and 0.8, surface 0.20 (P3: `bankers_lamp1`), and `book1` at 0.5, surface 0.40 |
| `hospital_chair2`, `hospital_chair1` | items | 54, 200 and 200, 200 | decor, at the table ends facing it |
| `hospital_chair_south` ×2 | items | 110, 150 and 160, 150 | decor, north side facing it |
| `safe1` | ci | 220, 236 | `special_collections_safe` (type `safe`, no change) |
| `display_case1` (P1) | items | 28, 250 | decor, **Phase 3 only: omit until registered** |
| `plan_chest1` (P1) | items | 28, 140 | decor, **Phase 3 only: omit until registered** |

NPCs: none.

### 2.7 Academic office (Sidhu's office): `room_uni_office` (10x6, builder)

A working academic's office: a door card with his office hours, shelves of journals, a year planner, a desk against the wall with his PC and a spare copy of his hashing handout. In Phase 1 Sidhu and his ledger whiteboard are here as now; from Phase 2 he is next door in the seminar room, and the door card says so.

Doors: west (corridor) row 2; north (seminar room, Phase 2) NE corner, centre (272, 32). Keep clear: the W-to-N route along y 100-128.

```
     0   1     2      3     4     5     6     7    8    9
 0   #   #  [card][ledger WB][bookcase] [yr planner] .  [N] #
 1   #   #   .    [ (P1)  ][recessed]  [  desk    ]  .  [N] #
 2  [W]  .   .   .   .   S   .   .     [pc  notes ] .   .  #      S Sidhu (Phase 1)
 3   |   .   .   .   .   .   .   .   .   .   .   .   .   |       route W door to N door, y 100-128
 4-5 (covered by the common room's north wall)
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `uni_doorcard1` (H, 20x24: "Dr S. Selvarajan. Office hours Tue 2-4. Seminar room through the back.") | items | 66, 50 | decor; optional flavour object from Phase 2 (`as-type:uni_doorcard`, `readDisplay: gameDisplay`, `addToNotes: false`) to point players to the seminar room |
| `whiteboard1` | ci | 92, 50 | **Phase 1 only**: `ledger_whiteboard`, needs `as-type:whiteboard`. Unclaimed (hidden) from Phase 2 |
| `bookcase` | items | 142, 74 (recessed) | decor |
| `year_planner1` | items | 192, 48 | decor |
| `smalldesk1` | tables | 194, 111 (top edge on y 70, the wall-backed rule; collision y 101-111 leaves a 17 px lane below, enough for the player's 18x10 body, `player.js:150`) | |
| `pc7` | ti, x_frac 0.35, surface 0.30 | | decor |
| `office-misc-cup` | ti, x_frac 0.60, surface 0.40 | | decor |
| `notes1` | ct, x_frac 0.82, surface 0.50 | | `fn07_desk_copy` (type `notes`, no change) |

NPCs: Phase 1 `sidhu_selvarajan` at (4.85, 3.8) = x 155, feet 122, beside the ledger: his bounds (x 115-195) with their margin stay off the handout (x ≥ 228), and his body (bottom y 127) stays in the visible strip. The board (x 92-136) sits behind his left shoulder; tapping the board's right edge may also offer Sidhu, which is accepted (the man and his board). Phase 2: none.

### 2.8 Seminar room: `room_uni_seminar` (10x10, builder, Phase 2)

The department seminar room Sidhu has just used for his blockchain reading group: a long table with chairs round it, a flip chart, windows with blinds, and his toy ledger still on the whiteboard. Sidhu and the ledger whiteboard (the Vigenère key for L7) move here.

Door: south (Sidhu's office) SE corner, centre (272, 288). Keep clear: the east lane x 256-288, the floor under the whiteboard (x 120-190, y 64-118), the bottom two rows (covered).

```
     0   1   2   3   4   5   6   7   8   9
 0   #   #  [blinds] [ ledger WB ] [blinds] #   #
 1   #   #   .   .   .   .   .   .   #   #
 2   #  fc   .   .   .   .   S   .   .   ^       fc flip chart, S Sidhu
 3   |  fc   .  cs  cs  cs   .   .   .   ^       cs chairs facing south (north side)
 4   |   .  ce [ seminar table  ] ce  .  ^       ce end chairs
 5   |   .   .  [               ]  .  .  ^
 6   |   .   .  cn  cn  cn   .   .   .   ^       cn chairs seen from behind (south side)
 7   |  wc   .   .   .   .   .   .   .   ^       wc water cooler
 8-9 [S] (covered by the office's north wall)
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `window_blinds1` ×2 | items | 70, 50 and 196, 50 | decor |
| `whiteboard1` | items | 130, 50 | `ledger_whiteboard`, needs `as-type:whiteboard` |
| `hospital_conference_table` | tables | 90, 206 | decor; on it (ti): `office-misc-pens` at x_frac 0.3, surface 0.35 and `mugs_tray1` at 0.7, 0.35 |
| `hospital_chair_south` ×3 | items | 104, 150; 145, 150; 186, 150 | decor |
| `hospital_chair_north` ×3 | items | 104, 232; 145, 232; 186, 232 | decor |
| `hospital_chair2`, `hospital_chair1` | items | 70, 200 and 220, 200 | decor |
| `flip_chart1` | items | 44, 130 | decor |
| `water_cooler1` | items | 40, 250 | decor |

NPCs: `sidhu_selvarajan` at (6.75, 3.7) = x 216, feet 118, beside his whiteboard (sprite bounds x 176-256, y 47-127, clear of the board at x 130-174). His opening ("Come in, come in. ... That's my whiteboard. It's from my blockchain lecture.", `ink/npc_sidhu.ink`, start knot) fits this room unchanged.

### 2.9 Lecture theatre: `room_uni_lecture` (20x10, builder, Phase 2)

The school's main lecture theatre, just after the first-year induction: a projector screen and a whiteboard at the front, a demonstration bench and lectern, and tiered rows of seats facing the front. Tom gives the induction here: he hands over the laptop and Field Notes 1-3, and his "Hi three ways" is on the whiteboard.

Size and template: 20x10 (4x2 GU), the same size as `room_hospital_ward`, so there is a precedent in the engine and the door code. The builder needs a `20x10` template, **added to `scripts/room_gen/templates.json`** (`build_room()` reads width, height, `walls` and `doors` from `TEMPLATES[key]`, `generate_rooms.py:325-338`). Build each 20-wide row from the 10x10 template's row by the column map `COLS_20 = [0..8] + [1, 2, 3] + [2..9]`, for `walls` and `room` alike. That is the ward's pattern for its back-wall rows; its floor rows use `[8, 8, 8]` in the middle instead, but with the new sheets any interior column works, because `FLOOR_BOX` (x 32-288) is plain floor and the carpet grain alternates by tile parity anyway (and the lecture sheet's tier lines are full-width). Write the `doors` layer explicitly (zeros, with 101/102 in columns 1 and 18 of rows 0-1 and 495 in columns 0 and 19 of rows 2 and 7, matching `tilesets_ref.json`'s `door_side_sheet_32` firstgid 495; don't copy the ward's layers, which use 475). The engine ignores the doors layer (README "Door art is generated") and `validate_room()` only checks object gids (`generate_rooms.py:867-873`), so this is for tidiness in Tiled. The room layer is `ROOM6_FIRSTGID + row*10 + COLS_20[col]`, passed as `room_override`.

Door: north (foyer) NW corner, centre (48, 32). The room is not covered at the bottom, but the builder keeps the bottom two rows clear anyway (validator rule). Keep clear: the west aisle x 32-96 from the door down, the centre aisle x 274-340, the east aisle x 576-608, the floor under the whiteboard (x 100-164, y 64-110).

```
      0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
 0    # [N] # ex[WB] .  .  [ projector screen ]  .  clk .  .  .  .  #  #
 1    # [N] #  .  .  .   .  .  .  .  .  .  .  .  .  .  .  .  #  #
 2    #  .  .  .  .  .  T [bench] [lectern] .  .  .  .  .  .  .  .  .  #      T Tom
 3    |  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  f      f fire point (E wall)
 4    |  .  .  s  s  s  s  s  s  .  .  .  s  s  s  s  s  s  s  .  |      s seats facing north, row 1
 5    |  .  .  s  s  s  s  s  s  .  .  .  s  s  s  s  s  s  s  .  |      row 2
 6    |  .  .  s  s  s  s  s  s  .  .  .  s  s  s  s  s  s  s  .  |      row 3
 7    |  (tier lines painted into the floor sheet every row from y 128)
 8-9  (kept clear)
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `exit_sign1` | items | 80, 30 | decor |
| `whiteboard2` | items | 110, 50 | `tom_board`, needs `as-type:whiteboard` |
| `projector_screen1` (H) | items | 276, 54 | decor |
| `wall_clock1` | items | 420, 46 | decor |
| `uni_poster1` (H) | items | 500, 46 | decor |
| `fire_alarm_point1` | items | 612, 132 | decor, east wall |
| `desk1` (demonstration bench) | tables | 240, 118 | decor; on it (ti): `laptop6` at x_frac 0.3, surface 0.40 and `office-misc-speakers` at 0.75, 0.25 |
| `smalldesk2` (P0: `lectern1`, swapped in Phase 3) | tables | 326, 118 | decor |
| `hospital_chair_north` ×69 (P1: `lecture_seat_row1`, still in `items`) | items | rows at feet y 170, 202, 234; x 96 to 258 step 18 (10 a row) and x 340 to 556 step 18 (13 a row) | decor. `hospital_chair_*` aren't wheeled (`rooms.js:2471` only gives wheels to `chair-*` and `-rotateN` names), so the rows stay put |
| collision rectangles | `Object Layer 1` | one per seat row and block: x 96-274 and x 340-572, y (row feet − 14) to (row feet), named `collision` | Object format: an `id`, `"name": "collision"`, `x`, `y`, `width`, `height`, no `gid`, and **`y` is the top edge** (the engine adds `height/2` to `y`, `rooms.js:2783-2789`), unlike tile objects whose `y` is the bottom. No shipped map uses these yet, so the Phase 2 walk tries to walk and click-to-move through a row. | makes the rows solid with the aisles open. The engine already turns `Object Layer 1` rectangles named `collision` into static bodies (`rooms.js:2777-2810`); `build_room()` always writes that layer empty, so add a `collisions=[...]` parameter that fills it (tooling only, no engine change). This also avoids the seams a row of 64 px `tables` sprites would leave: a table body is the bottom quarter inset 10 px each side (`rooms.js:2576-2583`), so two abutting sprites leave a 20 px gap, wider than the player's 18 px body (`player.js:150`) |

NPCs: `tom_shaw` at (6.6, 3.9) = x 211, feet 125, at the west end of the bench, east of his whiteboard so he doesn't stand in front of it.

### 2.10 Maker space / workshop: `room_uni_workshop` (10x10, builder)

Cliffe's maker space: the Hacktivity scoreboard and his build screen on the wall, a safety sign and a pegboard of tools, an island workbench (the relay terminal sits on it, reachable from three sides), an electronics bench, shelving of parts, and a 3D printer. The hazard line on the floor marks the bench zone.

Door: south (corridor) SE corner, centre (272, 288), drawn in the corridor's wall. Keep clear: the east lane x 250-288 from the door to y 100, the floor under the two screens (x 64-180, y 64-100), the bottom two rows (covered).

```
     0   1   2   3   4   5   6   7   8   9
 0   #   #  [score][build] gl [pegboard]  #   #      score Hacktivity scoreboard, build Cliffe's build, gl safety sign
 1   #   #   .   .   .   .   .   .   #   #
 2   #   .   .   .   .   .  [elec bench]  ^         ^ east lane to the door
 3   | [shelf]   .   .   .   .   .   .   ^
 4   | [     ]   . [workbench + relay] .   ^         hazard line round the bench zone
 5   |   .   .   . [                 ] .   ^
 6   | [kvm/3D]  C   .   .   .   .   .   ^           C Cliffe
 7   | [      ]  .   .   .   .   .   .   ^
 8-9 [S] (covered by the corridor's north wall)
```

| Sprite | Layer | x, y | Claimed by / role |
|---|---|---|---|
| `conference_screen1` | items | 70, 52 | `hacktivity_scoreboard`, needs `as-type:conference_screen` (and its `sprite` and pinned position removed) |
| `smartscreen` | items | 130, 50 | `cliffe_build_screen` (already `as-type:smartscreen`) |
| `uni_poster6` (H, "Safety glasses must be worn") | items | 186, 46 | decor |
| `pegboard_tools1` (P1, ≤ 44x32, wall) | items | 206, 52 | decor, **Phase 3 only: omit until registered** |
| `it_workbench1` | tables (catalog kind `objects`: `make_obj("objects", ...)` appended to the tables list) | 124, 198 | the island bench |
| `pc5` | ct, on the bench, x_frac 0.50, surface 0.30 | | `relay_terminal` (type `pc`, no change) |
| `smalldesk1` (P2: `electronics_bench1`) | tables | 196, 130 | decor; on it (ti): `office-misc-hdd6` at x_frac 0.3, surface 0.30 and `office-misc-camera` at 0.75, 0.25 |
| `binder_shelves1` (P2: `component_drawers1`) | items | 28, 150 | decor |
| `kvm_cart1` (P0: `printer_3d1`) | items | 36, 240 | decor |

NPCs: `cliffe_workshop` at (2.8, 7.0) = x 90, feet 224, west of the bench (sprite bounds x 50-130 clear the relay PC at x about 137-171).

### 2.11 NPC standing spots

| NPC | Room | Tile (x, y) | Pixels (x, feet) | Phase |
|---|---|---|---|---|
| `jordan_pike` | foyer | 3.6, 5.3 | 115, 170 | 1 |
| `tom_shaw` | teaching_lab | 7.6, 2.9 | 243, 93 | 1 only |
| `tom_shaw` | lecture_theatre | 6.6, 3.9 | 211, 125 | 2 |
| `megan_oyelaran` | common_room | 2.4, 7.6 | 77, 243 | 1 |
| `cliffe_schreuders` | common_room | 5.3, 7.4 | 170, 237 | 1 |
| `sidhu_selvarajan` | sidhu_office | 4.85, 3.8 | 155, 122 | 1 only |
| `sidhu_selvarajan` | seminar_room | 6.75, 3.7 | 216, 118 | 2 |
| `cliffe_workshop` | workshop | 2.8, 7.0 | 90, 224 | 1 |
| `briefing_cutscene`, `closing_debrief_person` | foyer (hidden) | 500, 500 | | unchanged |

### 2.12 Scenario edits these maps need (follow-on work, not done by the map builder)

The map builder edits no scenario file. Whoever owns `scenario.json.erb` makes these, after re-reading it (another agent dressed the current maps in `1c18b9a3`):

**With Phase 1 (re-skin):**
1. Room `type`s to the `room_uni_*` names in 2.0.
2. The `as-type`s named in the tables: `plaque`, `notes` (×4: ASCII chart, paper tape, drop-box tag, returns slip), `whiteboard` (×2), `notice_board`, `vending_machine`, `coffee_station`, `student_locker`, `pigeonholes`, `drop_box`, `uni_directory`, `conference_screen`.
3. Remove explicit `x`/`y` positions from every object that now has a slot: explicit coordinates override the slot after matching (`rooms.js:2241-2242`), which is how today's pins work round the missing slots. Remove the dynamic `heritage_display_table` object (the map has the table). Remove `hacktivity_scoreboard`'s `sprite`.
4. NPC positions from 2.11.
5. `slot_audit.py --verbose --notes` must then show every object `ok`.

**With Phase 2 (new rooms):** see section 3.

## 3. Layout and connections

### 3.1 Recommendation

Add the three rooms the user asked for and change nothing else in the graph: a **lecture theatre** south of the foyer, **Special Collections** north of the library, and a **seminar room** north of Sidhu's office. No new locks. Three existing pieces move into them, each to a room where it makes more sense than where it is now, and each move keeps every lock's place in the chain:

| Moves | From | To | Why it reads better | Chain effect |
|---|---|---|---|---|
| Tom Shaw, his laptop and Field Notes 1-3 (NPC `tom_shaw`, items held), his "Hi" whiteboard (`tom_board`) | teaching lab | lecture theatre | Tom "looks after the first-years this week" (`ink/npc_tom.ink`, first meeting); a first-year induction is a lecture-theatre event, and the "Hi three ways" board becomes the lecture's worked example | None. The lecture theatre is open and off the start room; the laptop is still the first thing the briefing sends you for. The guest terminal (L3) and your lab account (L8a) stay in the lab |
| The Special Collections safe (L6) and its contents (Trial VII, the candidate file, the 1979 job tape) | library | Special Collections | The safe, the job tape and Ghost's file are archive material; the library keeps the returns desk, where the slip (Trial VI) is found | L6's clue (slip, library) and lock (safe, Special Collections) are now one open door apart, instead of in the same room. Both are still behind L5 |
| Sidhu Selvarajan (NPC) and his ledger whiteboard (`ledger_whiteboard`, the Vigenère key) | Sidhu's office | seminar room | His own line is "That's my whiteboard. It's from my blockchain lecture" (`ink/npc_sidhu.ink`, start knot): a teaching room fits it better than his office. His office keeps the desk copy of the hash handout and a door card pointing to the seminar room | None: the seminar room is reached through his office, which is behind L4 as before. The key is still useless until Trial VII (L6) |

What doesn't move: Jordan, the stand and L1 (foyer); Locker 4 / L2, Megan and early Cliffe (common room); the guest terminal / L3 and the lab account PC (lab); the poster, pigeonholes, drop box and directory (corridor); the workshop and everything in it. The chain in SOLUTION_GUIDE.md ("The chain at a glance") is unchanged except for the walks.

The lecture theatre is the "freshers' talk" room the user suggested. A "projected Trial" was considered and not recommended: the only Trials that could move there without changing the order of the chain are I-III, which are bound to Jordan's stand, Locker 4 and the lab terminal, and moving Trial V (the corridor poster) into an open room would put an Act 2 clue in Act 1.

### 3.2 The building

```
 grid y   x: -2 .. -1                   0 .. 1                       2 .. 3
  -3..-2  [ SPECIAL COLLECTIONS ]      [ WORKSHOP (L9 key) ]         [ SEMINAR ROOM ]
           room_uni_special 10x10       room_uni_workshop 10x10       room_uni_seminar 10x10
           safe L6                      relay L10, scoreboard         Sidhu, ledger whiteboard
                 | S (SE)                      | S (SE)                      | S (SE)
  -1      [ LIBRARY (L5 PIN) ] --W-- [ CORRIDOR (L4 pw) ] --E-- [ SIDHU'S OFFICE ]
           room_uni_library 10x6      room_uni_corridor 10x6       room_uni_office 10x6
           issue desk, slip           poster, pigeonholes L7,      desk copy of FN7,
                                      drop box L8b                 door card
                                           | S (SW)
   0..1   [ TEACHING LAB ] -----W----- [ FOYER (start) ] -----E----- [ COMMON ROOM ]
           room_uni_lab 10x10          room_uni_foyer 10x10          room_uni_common 10x10
           guest terminal L3,          Jordan, stand L1,             Locker 4 L2, Megan,
           lab account PC              Byte Wall exhibits            Cliffe (early)
                                           | S (SW)
   2..3                               [ LECTURE THEATRE ]  (x 0..3, 20 wide)
                                       room_uni_lecture 20x10: Tom, laptop, FN1-3, "Hi" board
```

New connections (each one added on both rooms): `foyer.south` ↔ `lecture_theatre.north`; `library.north` ↔ `special_collections.south`; `sidhu_office.north` ↔ `seminar_room.south`. Every existing connection stays.

**Checked.** I ran the layout maths in `scripts/check_door_alignment.py` (its `dims`, `pos_single` and `door` functions, which read sizes from the maps `game.js` registers) over a mock of this graph with stand-in maps of the same sizes (`room_lab` for 10x10, `hall_1x2gu` for 10x6, `room_hospital_ward` for 20x10), plus an overlap test of the placed rectangles. All nine door pairs align and no rooms overlap. Positions (grid units): foyer (0,0), corridor (0,−1), lab (−2,0), common room (2,0), workshop (0,−3), library (−2,−1), Sidhu's office (2,−1), lecture theatre (0,2), Special Collections (−2,−3), seminar room (2,−3); the existing seven are exactly where they are now. Door centres (room pixels), which the maps in section 2 keep clear:

| Room | Doors |
|---|---|
| foyer | N (48,32), S (48,288), E (304,80), W (16,80) |
| corridor | S (48,160), N (272,32), W (16,80), E (304,80) |
| lecture theatre | N (48,32) |
| library | E (304,80), N (272,32) |
| Special Collections | S (272,288) |
| Sidhu's office | W (16,80), N (272,32) |
| seminar room | S (272,288) |
| workshop | S (272,288) |
| lab / common room | E (304,80) / W (16,80) |

The foyer↔lecture theatre pair is the one unequal-width N/S link (10 vs 20 tiles). It aligns because the foyer's origin has even parity, so both doors land on the left (README "Which corner a door lands on"); keep the lecture theatre as the foyer's **only** south connection. Its north wall also covers the common room's bottom two rows (x 2-3 lie under the lecture theatre's x 0-3), which section 2.3 keeps clear. Once the scenario has the new rooms, re-run `check_door_alignment.py` and the validator's overlap check on the real file (section 6); `predict_door_sides.py` only takes a `.json.erb` (it failed on the plain-JSON mock), so run it on the scenario then.

### 3.3 Play time

The solution guide prices one room-to-room walk at 15 to 30 seconds and the whole mission at **76 minutes (58-94)** (`SOLUTION_GUIDE.md`, "Unit times used", "Per act and total"). What this plan adds:

| Change | Required hops before → after | Added (min) | Notes |
|---|---|---|---|
| Tom in the lecture theatre | Arrival foyer→lab→foyer and later foyer→lab→foyer for L3: 4 → foyer→theatre→foyer and foyer→lab→foyer: 4 | 0 to 0.3 | Same hop count; the theatre is bigger, so a few seconds more walking |
| Safe in Special Collections | L5-L6: corridor→library (1) → corridor→library→Special Collections (2) | 0.3 to 0.5 | |
| Sidhu and the ledger in the seminar room | L7: library→corridor→office→corridor (3) → Special Collections→library→corridor→office→seminar→office→corridor (6) | 0.8 to 1.5 | The heaviest lock (L7, 7-12 min) gets the most walking; the door card and the directory point the way |
| First look round three new rooms and the bigger rooms | | 2 to 4 | Mostly reading decor and the two pointer signs. Keep new readables to the two pointers so this stays small |
| Optional: take the signed report to Sidhu at the climax | workshop→corridor→office (2 each way) → workshop→corridor→office→seminar (3 each way) | 0 to 0.5 | Optional, not in the guide's totals |
| A reload mid-Act 2/3 (not in the totals) | | +0.5 per reload | Reloads respawn at the foyer; Special Collections and the seminar room are one hop further |

**Estimate: +3 to +6 minutes, middle about +4.5, so about 80 minutes (61-100).** The middle stays under the 90-minute slot the guide recommends for a class. To keep it there:

1. **No new readable clue-like objects.** The new rooms carry decor plus exactly two flavour readables that point the way (the office door card and the directory). Every other new prop is decor, not interactable.
2. **Name the rooms where the player looks.** `door_sign` on all ten rooms ("Lecture Theatre 1", "Special Collections", "Seminar Room 2", "Dr S. Selvarajan"); the corridor directory lists the seminar room ("East: Dr S. Selvarajan; Seminar Room 2 beyond"); the library's sign points to Special Collections.
3. **Keep each required object in the room's first sightline.** The safe, the ledger and Tom are placed in view from their room's door (section 2).
4. **Run the timed blind playtest DESIGN.md already requires** (D3) on the expanded graph. If the middle comes out over 85, apply the fallback below before anything in DESIGN.md's cut list (Q3).

**Fallback (if the timed run says so):** keep the new maps and drop the extra hops. Put the safe back on the library's Phase 1 slot (2.5) and/or Sidhu and the ledger back in his office (2.7 keeps the Phase 1 whiteboard slot; drop the door-card flavour object then, since it says the seminar room is through the back and sits too close to the board). The new rooms stay as optional places to look round. Each saves half a minute to a minute and needs only scenario edits. (A roped-off Special Collections corner inside the library isn't an option: the library's two-row strip has no space for it, 2.5.)

### 3.4 Scenario edits for Phase 2 (follow-on, not done by the map builder)

1. Add rooms `lecture_theatre` (`room_uni_lecture`), `special_collections` (`room_uni_special`) and `seminar_room` (`room_uni_seminar`), all unlocked, with the connections in 3.2 and a `door_sign` each.
2. Move `tom_shaw` (with `itemsHeld` unchanged) and `tom_board` to `lecture_theatre`; `special_collections_safe` (contents unchanged) to `special_collections`; `sidhu_selvarajan` and `ledger_whiteboard` to `seminar_room`. Positions from 2.11; objects take the slots in 2.6, 2.8 and 2.9.
3. Text that names a place:
   - `ink/opening_briefing.ink` (the briefing's laptop line) "Get a lab laptop from Dr Shaw in the teaching lab, west of the foyer." → "... in the lecture theatre, south of the foyer." **Spoken** (briefing, Aoede).
   - `ink/npc_tom.ink` (first-meeting knot) "Your lab account's on that PC." → name the place: "Your lab account's on a PC in the teaching lab, west of the foyer." **Spoken** (Tom, Fenrir).
   - The floor directory's observations (not spoken).
   - The written brief, `scenario.json.erb:133` (`kh_txt[:brief]`): "get a lab laptop from Dr Shaw in the teaching lab first" → "... in the lecture theatre first" (shown, not spoken).
   - Tom's player choice in `ink/npc_tom.ink`: "That CryptoSecure terminal on your desk. Is it yours?" → "That CryptoSecure terminal in your lab. Is it yours?" (a player line, not voiced).
   - Optional flavour object: the office door card (2.7).
   Lines checked and left alone: Tom's "Someone's put a terminal in my lab I never ordered" (still his lab), his narrated "slides a battered department laptop across the desk" (the demonstration bench), Sidhu's opening, HaX's "The guest terminal's in the teaching lab" and "Your private key is on your lab account in the teaching lab" (`phone_agent_0x99.ink:279`, `:308`).
   So **two spoken lines** change. If this lab's audio has already been generated, list them for the TTS cost (AGENTS.md "Spoken-line changes cost money"); if not, no cost.
4. Re-run the dialogue checks for the two changed knots (`dialoguelint.mjs`, ink compile) and the static checks in section 6.

## 4. New art

Search first (skill "New or replacement art"): every placeholder named in section 2 is already in `scripts/room_gen/catalog.json`, so **Phases 1 and 2 ship with no PixelLab spend at all**, on existing sprites plus the free hand-drawn items below. PixelLab art (Phase 3) swaps placeholders at the same anchors.

### 4.1 Hand-drawn (free)

Drawn with PIL at native size, outline and palette sampled from neighbouring sprites (`getcolors`), checked at 8x beside them (skill table, row 1). Wall items are registered with `register_object.py --wall`; floor items without `--wall`. No crest or logo copies a real institution: Miskatonic is fictional, and the crest is a plain shield with an "M".

| Name | Size (px) | Kind | Where | What |
|---|---|---|---|---|
| `uni_crest_sign1` | 44x22 | wall | foyer | shield with "M" and "COMPUTING" |
| `projector_screen1` | 88x42 | wall | lab, lecture theatre | white screen in a grey case, a title slide ("Welcome to Computing") |
| `cryptosecure_banner1` | 22x58 | floor | foyer | pull-up banner on its foot, CryptoSecure mark and "THE KEYHOLDER STUDENTSHIP" |
| `drop_box1` | 20x24 | wall | corridor | wall-mounted steel post box with a slot, a small keypad and the CryptoSecure mark |
| `student_lockers1` | 50x62 | floor (recessed or wall-backed) | common room, corridor | pixel edit of `staff_lockers1`: letters P/B/C replaced by 1, 2, 3 |
| `student_locker1` | about 17x62 | floor | common room | one column of the same art, numbered 4, with a four-digit keypad (Candidate Locker 4) |
| `uni_directory1` | 16x32 | wall (side) | corridor | narrow directory panel, four lines |
| `uni_doorcard1` | 20x24 | wall | Sidhu's office | name card and office-hours slip |
| `uni_sign_library1` | 44x14 | wall | library | "LIBRARY · QUIET PLEASE" |
| `uni_sign_special1` | 64x14 | wall | Special Collections | "SPECIAL COLLECTIONS · BY APPOINTMENT" |
| `uni_timetable1` | 16x22 | wall (side) | lab | lab timetable grid |
| `uni_poster1` .. `uni_poster4`, `uni_poster6`, `uni_poster7` | 16x21 each (as `health_poster1`) | wall | foyer, common room, corridor, lab, workshop, lecture theatre | Freshers' Week; Cyber Security Society; Hacktivity CTF night; CryptoSecure "Verify everything"; "Safety glasses must be worn"; "No food or drink" |

Seventeen images (`uni_poster5` is not used). Free, but still shown to the user in small sets with feedback (user rule): first the crest sign, one poster and the renumbered lockers, then the rest. `student_locker1` (Locker 4) needs a small four-digit keypad drawn on its door, because the locker's text asks for four digits; `drop_box1` has a keypad, not a padlock, because it opens with a password. Optional, P3: a `conference_screen2` with a "HACKTIVITY" leaderboard face, edited from `conference_screen1`; if made, it replaces `conference_screen1` in the workshop map with no scenario change (same base type).

### 4.2 PixelLab (Phase 3)

`scripts/room_gen/pixellab_props.py props OUT --canvas N --refs a,b --items items.json --theme "UK university furniture and equipment"`, dry run first, then read `contact.png`, pick frames, install with `import_pixellab_objects.py` (trims only) and register. About 20 generations per call. **One batch at a time, each with the user's go-ahead** (skill: ask before about 20 generations; user rule: one at a time or small batches with feedback, PixelLab first, at target size, never downscaled). Check `python3 tools/pixellab_pipeline.py balance` before and after each batch. A frame at the wrong scale is regenerated on a different canvas, never resized. References must be no bigger than the canvas and live in `assets/objects/` (`pixellab_props.py:60-63`), which is why the refs below differ per canvas.

| Batch | Canvas, refs | Items (two phrasings each) | Target size | Replaces | Priority |
|---|---|---|---|---|---|
| **P0, pilot** | 48; `photocopier1`, `coffee_station1` | `lectern1` (lecture-theatre lectern with a small screen and a gooseneck microphone); `book_trolley1` (library returns trolley with books); `printer_3d1` (desktop 3D printer on a small cabinet) | 32x46; 40x36; 32x46 | `smalldesk2` (theatre); none (library); `kvm_cart1` (workshop) | high: settles the university style before the rest |
| P1 | 64; `it_workbench1`, `binder_shelves1` | `lecture_seat_row1` (three fixed tip-up seats with a shared writing ledge, seen from behind); `display_case1` (glass-topped display case on legs, old computer tapes and punched cards inside); `uni_sofa1` (low modern two-seat sofa); `plan_chest1` (wooden plan chest); `pegboard_tools1` (wall pegboard with hand tools); `laser_cutter1` (desktop laser cutter) | 64x32; 64x36; 56x40; 48x36; 44x32 (wall); 64x44 | 69 `hospital_chair_north` (row sprites overlapping a few px, still in `items`; the collision rectangles stay); `desk1` (foyer display); `sofa1`; none; none; none | high (seat row, display case), medium |
| P2 | 48; `photocopier1`, `supply_boxes1` | `electronics_bench1` (bench with an oscilloscope and a soldering station); `component_drawers1` (cabinet of small parts drawers); `alarm_panel2` (1970s computer front panel with a column of eight lamps and toggle switches, wall-mounted: the Byte Wall; after picking a frame, hand-edit the lamps so 64, 8, 4 and 1 are lit, as the plaque's text says, `scenario.json.erb` `display_plaque`); `robot_arm1` (desktop robot arm on a stand); `beanbag1` (two beanbags); `stanchions1` (two brass posts with a red rope) | 48x40; 40x48; ≤ 32x30 (wall); 32x40; 40x28; 40x32 | `smalldesk1` (workshop); `binder_shelves1`; `alarm_panel` (Byte Wall, no scenario change); none; none; none | medium (the Byte Wall is high for the teaching corner) |
| P3, optional | 24; `office-misc-lamp4`, `kettle1` | `bankers_lamp1` (green banker's lamp); `pi_cluster1` (stack of Raspberry Pi boards); `soldering_iron1` (iron in its stand); `journal_stack1` (stack of journals) | about 16-20 each | `office-misc-lamp4` (Special Collections) | low |

**PixelLab total: about 80 generations planned (four batches of about 20), with a reserve of two re-roll batches, so a ceiling of about 120.** P0 is a go/no-go on the style; if the user stops after P0 or P1, the maps still work on their placeholders. New placements of P1/P2 art that have no placeholder (laser cutter, robot arm, beanbags, stanchions, plan chest, book trolley) are added to the builders when the art lands, with their own render check.

The Byte Wall and the CryptoSecure stand banner are already on `ART_NEEDED.md` (P2, P3); this plan's `alarm_panel2` and `cryptosecure_banner1` cover them. Add the rest of this section to `ART_NEEDED.md` when Phase 3 is scheduled.

### 4.3 Floor and wall sheets (free, scripted)

Eight sheets from `make_uni_tileset.py` (2.0): `room_uni`, `room_uni_carpet`, `room_uni_foyer`, `room_uni_lecture`, `room_uni_common`, `room_uni_library`, `room_uni_special`, `room_uni_workshop`, written to `public/break_escape/assets/tiles/rooms/`. No image generation: room6's geometry, repainted. Each is checked with `sheet_floor_top()` = 64 before any map uses it.

## 5. Engine and registration touch points

No new engine functionality. Every step below registers an asset in a list the engine and tools already read; no JavaScript logic, server code or minigame changes. The checks that back this: maps load by key from `game.js` `tilemapTiledJSON` lines; room sheets load by tileset name (`rooms.js:1758`); objects resolve through the extras tileset that `register_object.py` maintains; the validator and `check_door_alignment.py` read room sizes from the maps `game.js` registers (`validate_scenario.rb:3710-3735`, `check_door_alignment.py:24-25`); a 20x10 room already loads and lays out (`room_hospital_ward`, used by m02 and sis01).

| Touch point | What to add | For |
|---|---|---|
| `public/break_escape/js/core/game.js`, `preload()` after the `room_hospital_staff` map line | `this.load.tilemapTiledJSON('room_uni_<x>', 'rooms/room_uni_<x>.json');` with a short comment, ×10: foyer, lab, common, corridor, library, special, office, seminar, lecture, workshop | every map |
| same file, after the `room_hospital_kitchen` image line | `this.load.image('room_uni<_variant>', 'tiles/rooms/room_uni<_variant>.png');` ×8 | every sheet (key = tileset name) |
| `scripts/scenario-schema.json`, room `type` enum (from line 280) | the ten names | validator schema |
| `README_scenario_design.md`, "Available Room Types" table | one row each: size in GU, one-line description, the slots it offers (as the hospital rows do) | authors |
| `scripts/generate_rooms.py` | ten builder functions; each added to the `builders` dict in `main()`; `UNI_FLOOR_SHEETS` and the `room_tilesets()` branch; the `20x10` template (in `templates.json` or a helper); a docstring line on the stricter bottom-rows rule for covered 10x6 rooms. The "hand-maintained" comment list above `builders` is **not** touched: none of these maps is hand-maintained | builds |
| `scripts/room_gen/make_uni_tileset.py` (new) | the sheet script (2.0) | sheets |
| `scripts/room_gen/register_object.py` | run once per new object: `--wall` for `uni_crest_sign1`, `projector_screen1`, `drop_box1`, `uni_directory1`, `uni_doorcard1`, `uni_sign_library1`, `uni_sign_special1`, `uni_timetable1`, `uni_poster*`, `pegboard_tools1`, `alarm_panel2` (see the caveat below); without `--wall` for the rest. It updates `catalog.json`, `tilesets_ref.json`, `objects_hospital_extras.tsx`, the `game.js` image preload and, with `--wall`, `WALL_MOUNTED_EXTRAS` | objects |

Caveats for the builder:

- `register_object.py --wall` adds the name with trailing digits stripped to `WALL_MOUNTED_EXTRAS`. `is_wall_mounted()` (`generate_rooms.py:735-742`) matches `alarm_panel` only as an exact name, so `alarm_panel2` **does** need `--wall` (it then adds `alarm_panel` to the set). `notes*` names are wall-mounted already.
- `room_edit.py floor` only knows room6 and `room_hospital*` sheets; it isn't needed, because these maps are builder rooms that pick their sheet in `UNI_FLOOR_SHEETS`.
- `validate_room()` bans plants only in `room_hospital*` rooms; the university rooms may carry plants, but none of the layouts above uses floor plants in covered rows, where they'd be hidden.
- The extras tileset is called `objects_hospital_extras` but is the general home for new props (its docstring); nothing to rename.

## 6. Build order and verification

Each phase ships on its own and leaves the mission playable. Cheapest and most visible first. Model choice per AGENTS.md: Opus for the builders (layout judgement), Sonnet for the browser walks, a fresh Opus reviewer after each phase.

### Phase 0: tooling (no visible change, about an hour)

1. `scripts/room_gen/make_uni_tileset.py` and the eight sheets.
2. `generate_rooms.py`: `UNI_FLOOR_SHEETS` + the `room_tilesets()` branch; the `20x10` template; the docstring rule.
3. `game.js`: the eight `this.load.image` lines.

Checks: `python3 -c "import sys; sys.path.insert(0,'scripts/room_gen'); from room_geometry import sheet_floor_top as t; import glob; [print(p, t(p)) for p in sorted(glob.glob('public/break_escape/assets/tiles/rooms/room_uni*.png'))]"` prints 64 for all eight. To prove the `room_tilesets()` change leaves the existing builders alone (`generate_rooms.py --check` only re-validates the existing .json files, `:1974-1977`), a scratch script imports `generate_rooms`, calls each existing builder function by name (the `builders` dict is local to `main()`, so list them in the script), and saves the returned dicts as JSON **before** the edit; after the edit it runs again and diffs. Don't compare with the committed `.tmj`: 10 of the 11 builders already differ from it in `tilesets` (extras registered since their last regeneration) and `room_hospital_reception` in its layers too (hand edits), as review 2 found by running it. `game.js` copied to `<scratch>/x.mjs` and `node --check`ed. Look at each sheet at 4x.

### Phase 1: re-skin the seven existing rooms (free art only)

1. Hand-drawn items (4.1) and `register_object.py` for each.
2. Seven builders: `room_uni_foyer`, `_lab`, `_common`, `_corridor`, `_library`, `_office`, `_workshop` (sections 2.1-2.5, 2.7, 2.10, Phase 1 slots included). Register the seven maps (section 5).
3. The scenario edits in 2.12 (by the scenario owner; re-read the file first).

Checks, in this order:

| # | Check | Command | Pass |
|---|---|---|---|
| 1 | Builders | `python3 scripts/generate_rooms.py room_uni_foyer room_uni_lab ...` (regenerates and validates each), then `python3 scripts/generate_rooms.py --check room_uni_foyer ...` | no "bad GIDs"; every WARN fixed or justified in the phase report. Expected and justified: "wall items overlap" for the corridor's notice board/poster and drop box/tag (pinned on, deliberately) |
| 2 | Wall standard | `python3 scripts/room_gen/check_room_walls.py 'room_uni_*'` and `--scenario scenarios/lab_tesseract_trials/scenario.json.erb` | every map reads 64 |
| 3 | Look | `python3 scripts/render_room_preview.py 'room_uni_*' --sheet --grid --scale 2 --out <scratch>/p1` | read every image: theme fit, nothing on the door corners or lanes, wall items inside the frame, claimed slots where section 2 puts them |
| 4 | Slots | `python3 scripts/room_gen/slot_audit.py --verbose --notes scenarios/lab_tesseract_trials/scenario.json.erb` | 0 problems; every object `ok` on the slot section 2 names; notes prompts answered |
| 5 | Doors | `python3 scripts/check_door_alignment.py scenarios/lab_tesseract_trials/scenario.json.erb` and `python3 scripts/predict_door_sides.py scenarios/lab_tesseract_trials/scenario.json.erb` | all OK; corners as the table in 3.2 |
| 6 | Validator | `ruby scripts/validate_scenario.rb scenarios/lab_tesseract_trials/scenario.json.erb` (with `--skip-ink --no-graph` if another agent is editing the mission) | 0 errors; warnings no more than DESIGN.md's seven deliberate ones; no new overlap or sprite warnings |
| 7 | Rendered verifiers | `ruby scenarios/lab_tesseract_trials/tools/render_scenario.rb <scratch>/r.json 42`, then `python3 scenarios/lab_tesseract_trials/tools/verify_rendered_independent.py <scratch>/r.json` and the CyberChef one as its header says | ALL PASS (they find artefacts by id, so moving rooms must not change them) |
| 8 | Other scenarios | none: no shared map changed. Run `slot_audit.py --all` only to confirm the count of old problems elsewhere is unchanged | same count as before |
| 9 | Browser walk | a Sonnet playtest agent on the keyless server (`PLAYTEST_PORT=3001`), following the skill's step 5 list | below |

The browser walk for Phase 1 (numbered checklist, pass/fail with evidence, scratchpad only, kill only its own PIDs): screenshot every room; spawn not on top of Jordan or furniture; walk every door both ways (retry the first `enter` through a north door); in the corridor, library and office, walk the full strip end to end and reach each door (the two-row band); reach and open every claimed object listed in section 2 from where a player would stand, tap each one and report any pick-one menu (only the pairs section 2 names are expected), and report world x,y, texture key and depth for each; Locker 4 opens as a locker and asks for the PIN; the scoreboard and build screen open as before; no duplicate sprites, no "No Tiled item found" logs, no 4xx/5xx, no console errors. Unlock rooms server-side for the layout check and say so.

### Phase 2: the three new rooms and the expanded graph (free art only)

1. Builders `room_uni_lecture`, `room_uni_special`, `room_uni_seminar`; register them.
2. Scenario edits in 3.4, including the two spoken lines.
3. Checks 1-7 again on all ten rooms, plus: the door table in 3.2 matches `check_door_alignment.py` on the real file; the validator's geometry check reports no overlap; ink compile and `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_tesseract_trials/` for the changed knots.
4. Browser: the Phase 1 walk for the new rooms, the foyer's south door both ways, the lecture theatre's seat rows don't trap the player, Tom's hand-over works in the theatre, Sidhu's scene and FN7/FN10 hand-over work in the seminar room, the safe opens in Special Collections.
5. **A timed blind playtest** of the whole mission (DESIGN.md D3, SOLUTION_GUIDE "Time estimate"), with a stopwatch per block. Middle over 85 minutes: apply the fallback in 3.3 and re-time.

### Phase 3: PixelLab props (with the user's go-ahead, batch by batch)

1. P0 pilot; show the contact sheet to the user; stop until they approve the style.
2. P1, then P2, then (optional) P3, each approved separately; balance checked before and after.
3. Install, register, swap the placeholders in the builders, add the new placements.
4. Checks 1-4 and 6 after each batch, a short browser look at the changed rooms. When the seat-row art replaces the chairs, re-check that it still lines up with the collision rectangles and the aisles stay open.

### Phase 4: polish

Anything the reviews and walks raise; `ART_NEEDED.md` and `DESIGN.md` section 3 brought up to date (room types, the room table, the build notes); `SOLUTION_GUIDE.md`'s room map (`:51-88`), its "Before the first lock" Tom line (`:112`) and its time estimate updated from the timed run; `TESTING_WALKTHROUGH.md`'s room references (Tom's room, the L3 and Sidhu steps, about `:45`, `:65`, `:90`, `:202`).

## 7. Open questions for the user

| # | Question | Recommended default | Why |
|---|---|---|---|
| Q1 | Build the expanded ten-room graph (Phase 2), or re-skin the seven rooms only? | Both, Phase 2 after Phase 1 ships | The user asked for every room type; the estimate is about +4.5 minutes (about 80 middle), inside the 90-minute slot, and the fallback in 3.3 recovers most of it |
| Q2 | Tom's induction in the lecture theatre (two spoken lines change), or Tom stays in the lab and the theatre is decor only? | Lecture theatre | It gives the room a reason to visit at no extra hops; the lines are short |
| Q3 | Sidhu and his ledger in the seminar room, or in his office as now? | Seminar room | His own opening line is about "my blockchain lecture"; no ink change; about +1 minute on L7 |
| Q4 | Special Collections as its own room (safe moves there), or the safe stays in the library? | Its own room | The archive suits the safe's contents (job tape, candidate file); +0.5 minute |
| Q5 | University palette: warm off-white walls with a deep teal skirting? Does Miskatonic have a house colour you want? | Off-white and teal | Reads modern-UK-campus and is distinct from the hospital mint and the office lavender |
| Q6 | PixelLab: about 80 generations in four batches (ceiling about 120 with re-rolls), P0 pilot first? | Yes to P0 now; decide P1-P3 after seeing it | Phases 1-2 don't need it; P0 settles the style for the least spend |
| Q7 | Lecture theatre 20x10 (as the ward) or 15x10? | 20x10 | Precedent in the engine (ward), more of a "theatre"; walking cost is a few seconds |
| Q8 | Offer the `room_uni_*` maps to other scenarios (README rows written generally), or keep them Keyholder-only? | Written generally | Same registration either way; future campus labs can reuse them |
| Q9 | The corridor's directory becomes a narrow side-wall sign (the wide one no longer fits beside lockers, pigeonholes, noticeboard and drop box). Fine? | Yes | The alternative is dropping the corridor lockers, which you asked for |

## 8. Review log

Ink line numbers are not quoted in 3.4: the ink was being edited during planning (review 2 found every number from round 1 had moved), so the plan quotes the text and names the knot.

### Round 1 (fresh Opus reviewer, read-only; verdict "ready after fixes")

| # | Finding (tag) | Outcome |
|---|---|---|
| 1 | Spacing used top-left to top-left; the tap rule (`game.js:1723-1742`) is bounds or anchor within 32 px, so the corridor wall, foyer wall, stand and display case raised pick-one menus (major) | Fixed: rule restated in 2.0 as 32 px clear between edges, NPC bounds included; corridor, foyer wall, stand (smaller `laptop6`) and display case re-spaced; box and tag kept as a named pair |
| 2 | Lab bench rows 64 px apart, so chairs covered the next row's PCs, including the guest terminal; swivel chairs are interactable (major) | Fixed: rows 88 px apart, no chair under a claimed PC, bin moved out of the aisle |
| 3 | Cliffe's sprite covered his laptop (major) | Fixed: table and Cliffe moved; the same check run on every NPC moved Tom (lab), Sidhu (office and seminar room) and Cliffe (workshop) off their fixtures |
| 4 | Phase 2 text edits missed the written brief (`scenario.json.erb:133`), Tom's player choice (`npc_tom.ink:52`), and the walkthrough and solution-guide room references (major) | Fixed in 3.4 and Phase 4; still two spoken lines |
| 5 | 20x10 template: `validate_room()` doesn't check tile-layer gids; the ward's floor rows use a different column map; a helper-only template must go into `TEMPLATES` (minor) | Fixed: text corrected, template goes in `templates.json` |
| 6 | Seat-row sprites in `tables` would leave 20 px seams (minor) | Fixed: rows stay in `items`, collision rectangles in `Object Layer 1` (existing engine support) via a new `build_room` parameter |
| 7 | Missing table-item fractions; catalog `objects` in the tables layer; Phase 3 art named in Phase 1-2 tables; `display_case1` batch and size inconsistent; office desk top 59; tileset helpers can't simply be imported (minor) | Fixed: fractions given, conventions added, "omit until registered" marked, `display_case1` moved to P1 at 64x36 (and `fair_stand1` dropped, since a 64 px stand can't keep its two slots apart), desk feet 111, helpers copied not imported |
| 8 | Counts wrong (ten map types, seventeen images); lab and library reach notes (minor) | Fixed |
| 9 | Phase 0's `--check` doesn't prove existing builders are unchanged (minor) | Fixed: a no-write comparison against the committed `.tmj` |
| 10 | Art briefs vs scenario text: Byte Wall lamp pattern, drop-box keypad, Locker 4 keypad (minor) | Fixed in 4.1 and 4.2 |
| 11 | Expected "wall items overlap" WARNs; hand-drawn art in one go; aisle bin; Sidhu behind a chair (minor) | Fixed (WARNs pre-justified in check 1; hand-drawn shown in small sets); the chair point is moot after Sidhu moved |

Withdrawn: none. The reviewer's note that the sheet and map share a name (`room_uni_foyer`) was left as an assumption by the reviewer, not a finding; the plan keeps the names: there is a precedent, `room_reception` is both a tilemap key and an image key in `game.js` (`tilemapTiledJSON('room_reception', ...)` and `load.image('room_reception', 'tiles/rooms/room1.png')`), and that room loads in 29 scenarios.

### Round 2 (fresh Opus reviewer, read-only, confirmation; verdict "ready after fixes")

The reviewer scripted every placement (catalog sizes, `place_on_table` maths), reach (32 px from the player's sprite centre to an object's top-left), pick-one menus, a walkability flood fill from every door, and ran the real `validate_room()` on in-memory mocks including the 20x10 template. Result before the fixes below: every claimed object reachable from visible floor, every room one connected area from every door, the seat rows trap nobody, door positions clean, and only the two WARNs the plan already expects.

| # | Finding (tag) | Outcome |
|---|---|---|
| 1 | The spacing rule left out closed doors, which a tap also gathers (`game.js:1797-1813`); the foyer plaque shared a menu with the L4 corridor door, the corridor drop box with the L9 workshop door, the directory with the office door (major) | Fixed: doors added to the rule; foyer wall re-spaced (plaque 82, Byte Wall 138, crest 174, chart 222); corridor wall shifted 6 px west (lockers at 58); directory + east door named as an accepted pair (no other visible spot on that wall); the browser walk now taps every claimed object and reports menus |
| 2 | NPC bounds were 9 px off: the tile position is the body centre (`npc-sprites.js:116-123`), so bounds run y−71..y+9; Jordan, Cliffe (common room) and Phase 1 Sidhu still raised menus (minor) | Fixed: rule restated; Jordan (3.6, 5.3), Cliffe (5.3, 7.4), Sidhu (4.85, 3.8); Tom's quoted bounds corrected; Sidhu-and-his-board named as an accepted pair in Phase 1 |
| 3 | Phase 0's no-write comparison can't pass: existing builders already differ from their committed `.tmj` (minor) | Fixed: snapshot builder output before the edit and diff after |
| 4 | Ink line numbers in 3.4 had moved; Sidhu's opening text has changed (minor) | Fixed: text quoted with the knot named; the new Sidhu line still fits the seminar room |
| 5 | The foyer inlay was under the player's torso, not the feet (minor) | Fixed: centred on (160, 176); spawn keep-clear stated in feet terms |
| 6 | `Object Layer 1` collision rectangles have no shipped user; format not stated; `y` is the top edge (minor) | Fixed: format given; the Phase 2 walk tries to walk and click-to-move through a row |
| 7 | Lab chairs 6 px apart, and one offered the guest terminal (minor) | Fixed: two chairs a row, none within 32 px of a claimed PC; chair-to-chair menus accepted |
| 8 | `pc12` count said 5, listed 6 (minor) | Fixed |
| 9 | The fallback didn't deal with the door card (minor) | Fixed: drop the door-card object if Sidhu goes back to his office |

Withdrawn: none. Not acted on: the reviewer's note that Tom's lab sprite touches the lab's east door for about 6% of taps; too small to matter, and Tom leaves the lab in Phase 2.

## 9. Phase 0-1 build notes (2026-10-06)

Built by the room builder (Opus). Nothing committed. No PixelLab or Gemini spend: every new image is hand-drawn or a scripted repaint.

### What was built

**Phase 0 (tooling).**
- `scripts/room_gen/make_uni_tileset.py` writes the eight sheets in 4.3 (`room_uni`, `_carpet`, `_foyer`, `_lecture`, `_common`, `_library`, `_special`, `_workshop`). Each is room6 raised to the 2-tile wall, repainted with the Q5 palette, and checked with `sheet_floor_top()` = 64 before it is written (the script exits otherwise). Decals as section 2.0: brass "M" inlay at (160, 176) r 26, kitchen vinyl patch, rug, hazard line, lecture tier nosings and vinyl front strip.
- `generate_rooms.py`: `UNI_FLOOR_SHEETS` (all ten map names) and its branch in `room_tilesets()`; the docstring rule on covered 10x6 rooms (feet above y 128).
- `templates.json`: the `20x10` template, built from the 10x10 rows by `COLS_20`, with the explicit doors layer (101/102 in columns 1 and 18, 495 in columns 0 and 19 of rows 2 and 7).
- `game.js`: eight `this.load.image` lines for the sheets.
- No-change proof: the eleven existing builders, called by name from a scratch script, give the same output before and after every edit in this run, apart from `tilesets` (which grew by the 17 newly registered objects).

**Phase 1.**
- Hand-drawn art, all 17 items in 4.1, from `scripts/room_gen/make_uni_props.py` (PIL at native size; palette from `directory_sign1`, `exit_sign1`, `fire_action_notice1`, `whiteboard1` and the sheets' teal; the lockers are pixel edits of `staff_lockers1`). Registered with `register_object.py`: `--wall` for the crest, projector screen, drop box, directory, door card, two signs, timetable and six posters; without for the banner and both locker sprites (tiles 122-138, gids 923-939). `uni_sign_special1` and the lecture/special sheets are made but not yet used (Phase 2).
- Seven builders (`room_uni_foyer`, `_lab`, `_common`, `_corridor`, `_library`, `_office`, `_workshop`) following sections 2.1-2.5, 2.7 and 2.10, with a small `_Uni` helper so each builder lists its layout and nothing else. Registered: game.js tilemaps, schema enum (the seven built maps only; Phase 2 adds the other three), README room table, `builders` dict.
- Scenario edits (2.12): the seven room types; `as-type` on every digit-suffixed type and on the new slots (`plaque`, `notes` ×4, `whiteboard` ×2, `notice_board`, `vending_machine`, `coffee_station`, `student_locker`, `pigeonholes`, `drop_box`, `uni_directory`, `conference_screen`); every pinned `x`/`y` removed from slotted objects; `heritage_display_table` removed; the scoreboard's `sprite` removed; NPC positions from 2.11. Object ids, locks, `requires`, contents, tasks, event mappings and note references are untouched. The validator rewrote `dungeon_graph.md/.html` (the display table node is gone).

### Deviations from the plan, and why

1. **Floor directory is 16x18, not 16x32.** In the browser, once the corridor's east door had been opened (so there was no door object left to share a menu with), clicking the doorway opened the directory instead of walking through: its top-left anchor (292, 96) was 20 px from the door centre. At 16x18 with its feet still at y 128, the anchor is (292, 110), 32.3 px from (304, 80), and `enter sidhu_office` then went through first time. It now lists three directions (W, E, N) with thick chevrons; thin arrowheads read as crosses at this size. Residual: a click on the lower edge of the doorway (y > 90) can still offer the directory when the player is beside it.
2. **Common room fire point on the east wall** (292, 132), not the west. On the west wall it sat back to back with the foyer's east-wall call point, two red boxes side by side.
3. **No chair east of the common room's low table.** Cliffe's spot (5.3, 7.4) stands on it; the sofa still serves the table.
4. **Two carpet palettes nudged:** the charcoal and green carpets carry a little more colour than first drawn, because `check_room_walls` reads a dark, near-neutral row as the floor line and found no floor at all on the grey version.
5. Schema enum has seven names now, not ten (only the built maps are registered).

### Check results (final state)

| Check | Result |
|---|---|
| `generate_rooms.py <7 rooms>` and `--check` | no bad gids; 2 WARNs, both expected (corridor notice board / Trial V poster, drop box / tag: pinned on) |
| `check_room_walls.py 'room_uni_*'` and `--scenario` | 0 maps off the standard (all 64) |
| `slot_audit.py --verbose --notes` | 0 problems (was 17), 0 notes prompts; every object `ok` on the slot section 2 names |
| `slot_audit.py --all` | 143 problems (was 160: the 17 fixed here; nothing else changed) |
| `check_door_alignment.py` | 6/6 OK |
| `predict_door_sides.py` | foyer N=LEFT, corridor N=RIGHT S=LEFT, workshop S=RIGHT, side doors TOP(y2.5), as in 3.2 |
| `validate_scenario.rb` | 0 errors, 8 warnings: the 7 deliberate ones in DESIGN.md plus the logged second-debrief `onceOnly` one. The three room-dressing warnings (`tableItems`, two foyer spacing) are gone |
| Rendered verifiers (`render_scenario.rb` + `verify_rendered_independent.py`) | ALL PASS on seeds 42, 777, 9001 |
| JSON / JS | catalog, tilesets_ref, templates, schema parse; `game.js` passes `node --check` |

### Browser walk (keyless :3001, headless)

Rooms were unlocked server-side (`corridor`, `library`, `workshop` via `unlock_room!`) for the layout check; nothing was earned, so this is a layout run, not a solvability run. Games: 1600 (the HEAD scenario, for the "before" shots), 1601 and 1602 (taps, doors, positions), 1603 (common room with Cliffe visible). `verify-run.rb`: 1601 and 1602 both "progress recorded". Session logs are in the session scratchpad (`rooms-build/after-*.jsonl`).

- Spawn at (160, 144) on the inlay, clear of Jordan and furniture.
- Every door walked both ways. The harness's `enter` needs a retry on N doors and can't find an opened door from the far side (`no-known-doorway`, a known quirk); walking through with `moveTo` works every time.
- 10x6 strips: the office walked end to end (W door to x 274); the corridor and library walked to each door.
- Every claimed object and NPC tapped. All open directly with no pick-one menu, except the drop box and tag (the plan's accepted pair). Locked objects open their own pads (lockbox, guest terminal, Locker 4 as a PIN pad, pigeonholes, drop box, safe, relay terminal, scoreboard). The harness flags some as "mismatch" because the pad's title ("Enter password for item", "Facility Alarm Panel") differs from the object name; the right object opened in each case.
- Reach notes: the guest terminal (pc9) is reached by click-to-move into the gap between the benches, not by the harness's straight-line approach; the Codebreakers book from behind the issue desk; Megan and the common-room Cliffe from the east. Cliffe (common room) is hidden once `workshop_open` is set, by design, so he was checked in a fresh game.
- Texture keys and depths as intended: `alarm_panel`, `plaque1`, `chart2`, `briefcase11`, `laptop6`, `whiteboard2`, `pc11`, `pc9`, `student_locker1`, `notice_board1`, `vending_machine1`, `coffee_station1`, `laptop1`, `pigeonholes1`, `drop_box1`, `uni_directory1`, `whiteboard1`, `book`, `safe1`, `pc5`, `conference_screen1`, `info_screen1` (the build screen keeps its `info_screen1` sprite on the `smartscreen` slot).
- No "No Tiled item found" or random-position logs; console errors are only the expected TTS 503s. Duplicate scan: the only repeats are the engine's door sprites at shared N/S doors and the drop box's hover highlight (depth 9000, alpha 0.29), neither from the maps.

### Evidence (`build_evidence/rooms/`)

- `before-<room>.png` ×7 (game 1600, HEAD scenario, old maps) and `after-<room>.png` ×7, plus `after-foyer-spawn.png`.
- `previews-contact.png` (render_room_preview of the seven maps, grid), `floor-sheets-2x.png` (all eight sheets).
- `props-signs-8x.png`, `props-posters-boxes-8x.png`, `props-lockers-screen-6x.png` (the hand-drawn art beside the existing sprites it was matched to).

### For Phase 2 onward

- `uni_sign_special1`, `room_uni_lecture`, `room_uni_special` and the `20x10` template are ready; the `collisions=[...]` parameter for `build_room()` (2.9) is not written yet.
- Add the three new names to the schema enum, game.js tilemaps and README when their maps exist.
- Phase 2 moves Sidhu and the ledger to the seminar room: the office's `whiteboard1` slot then goes unclaimed and hidden, as planned. Tom's lab position (7.6, 2.9) stands in front of the wall clock; moot once he moves to the lecture theatre.
- The floor directory's text still lists West/East/North only; Phase 2's observations edit (seminar room beyond the office) fits its three-line art.
- Harness tips for the next walk: the `enter` retries and `moveTo` fallbacks above; server unlocks set `workshop_open` once the workshop is entered, which hides the common-room Cliffe.

## 10. Phase 2 build notes (2026-10-06)

Built by the room builder (Opus) after the coordinator's review of Phases 0-1. Nothing committed. No PixelLab or Gemini spend.

### What was built

- **Three builders** in `generate_rooms.py`, following 2.6, 2.8 and 2.9: `room_uni_lecture` (20x10 on the `20x10` template, room layer by `COLS_20`), `room_uni_special` and `room_uni_seminar`. Registered in game.js (tilemaps), the schema enum, the README room table and `builders`.
- **`build_room(collisions=[...])`** and `_Uni.collision()` exist as planned, but nothing uses them (deviation 1).
- **Scenario moves** (3.4):
  - rooms `lecture_theatre`, `special_collections` and `seminar_room` added, all unlocked, with door signs "Lecture Theatre 1", "Special Collections" and "Seminar Room 2";
  - the three links added on both sides (foyer S, library N, office N);
  - Tom (with `itemsHeld` unchanged) and `tom_board` moved to the lecture theatre at (6.6, 3.9);
  - the safe and its contents moved to Special Collections;
  - Sidhu and `ledger_whiteboard` moved to the seminar room at (6.75, 3.7);
  - the office keeps the FN7 desk copy and gains the door-card flavour object `sidhu_door_card` (`as-type:uni_doorcard`, `readDisplay: gameDisplay`, `addToNotes: false`, "Seminar room through the back.");
  - the floor directory's observations now name what lies beyond each door (Special Collections, Seminar Room 2, Lecture Theatre 1).
- **Text edits** (3.4.3):
  - the briefing's laptop line;
  - Tom's lab-account line;
  - Tom's terminal choice ("in your lab");
  - the written brief ("in the lecture theatre first");
  - header comments in `npc_tom.ink` and `npc_sidhu.ink`;
  - the scenario's own `tools/kstates.mjs` regex for Tom's choice, which matched the old wording.
- **Review fixes**:
  1. The foyer terrazzo is calmer: fewer, lower-contrast chips (`p2-foyer-terrazzo-3x.png`). Only `room_uni_foyer.png` changed; the other seven sheets are byte-identical.
  2. The workshop has a parts rack against the back wall (`supply_shelves1`), boxed stock (`supply_boxes1`) and a cable on the floor between the benches. The electronics bench moved to the south-east and gained a fan. The scoreboard, build screen, relay PC and Cliffe's spot stay clear.
  3. In a fresh game with no server unlocks (1604, before its unlocks), Cliffe stands in the common room and talks (`p2-fresh-common_room-cliffe.png`).

### Spoken lines changed

No audio is cached for this lab yet (`tts_cache/` has no `lab_tesseract_trials` folder), so none of these has a TTS cost yet.

| Speaker (voice) | Before | After |
|---|---|---|
| HaX, briefing (Aoede) | "Get a lab laptop from Dr Shaw in the teaching lab, west of the foyer. Then go and be found." | "Get a lab laptop from Dr Shaw in the lecture theatre, south of the foyer. Then go and be found." |
| Tom (Fenrir) | "Your lab account's on that PC. I've put a key pair on it. Have a read of the README; you'll want the private one before the week's out." | Split in two, because the edited line came to 36 words, over dialoguelint's 30-word cap: "Your lab account's on a PC in the teaching lab, west of the foyer." / "I've put a key pair on it. Have a read of the README; you'll want the private one before the week's out." |

Not spoken: Tom's player choice ("That CryptoSecure terminal in your lab. Is it yours?"), the written brief, the door card and the directory.

### Deviations, and why

1. **The lecture seat rows are made solid by writing ledges, not by `Object Layer 1` collision rectangles.**
   - The rectangles break the room. `createRoom` throws "Cannot access 'room' before initialization": the collision branch uses `room` at `rooms.js` ~2807, but `const room` is declared at ~2826. The exception aborts the rest of the room's setup, so Tom never spawned (game 1604, first visit).
   - Fixing that is an engine change, so it goes to the user/orchestrator; it is a one-line move of the `const room` declaration above the object-layer block.
   - Instead, two hand-drawn writing ledges (`lecture_ledge1` 198x12 and `lecture_ledge2` 252x12, in `make_uni_props.py`, registered without `--wall`) sit in the `tables` layer in front of each row and block, at feet y (row - 22).
   - A table's body is its bottom quarter inset 10 px each side. Each ledge is 20 px wider than its seat block, so the body covers exactly the seats: x 96-274 and 340-572.
   - In the browser the player can't walk or click through a row from front or back, and can step into a row from the aisles and back out. Reading-wise, a ledge on the back of each row is what a lecture theatre has anyway.
2. **`book1` had no texture as decor.** game.js loads `objects/book1.png` only under the key `book`, so an unclaimed `book1` map sprite drew as a missing-texture box (Special Collections' reading table). I added a `book1` key for the same image next to that line; a scan of all ten maps finds no other image they use that game.js doesn't load.
3. **Special Collections omits the Phase 3 placeholders** (display case, plan chest), as the plan marks them; nothing stands in for them yet.

### Check results

| Check | Result |
|---|---|
| `generate_rooms.py --check` (all ten) | 2 WARNs, the expected corridor pair |
| `check_room_walls.py --scenario` | 0 maps off the standard |
| `slot_audit.py --verbose --notes` | 0 problems, 0 notes prompts; `--all` 143 (unchanged) |
| `check_door_alignment.py` | 9/9 OK (the six old links plus foyer↔lecture, library↔Special Collections, office↔seminar) |
| `predict_door_sides.py` | as 3.2: foyer N and S LEFT; library, office, SC, seminar and workshop N/S RIGHT; lecture N LEFT |
| `validate_scenario.rb` | 0 errors, 8 warnings (the same 8 as Phase 1; the two "multiple solution paths" warnings now cite the new rooms); room layout geometry OK, no overlaps |
| Rendered verifiers | ALL PASS on seeds 42, 777, 9001 |
| Ink compile | 9/9 |
| tagdiff vs HEAD | before: STRUCTURE UNCHANGED; after: STRUCTURE UNCHANGED (prose: briefing 1 line, Tom 2 lines plus the split) |
| dialoguelint | none |
| inkcheck | 12/12 (the 11 entry points plus the briefing with `--no-memo`) |
| loopcheck | 40/40 (the backgrounds round's state matrix) |
| kstates | ALL PASS (54) after the regex update |
| reopencheck | HaX 1800 reopens and Ghost 1800 reopens, 0 problems |
| Existing builders | output identical apart from `tilesets` |

The check outputs are in `build_evidence/rooms/phase2_checks/`, along with `ink_text_diff.txt` and `verify-run-1604.txt`.

### Browser walk (keyless :3001, headless, game 1604)

- **Fresh game first**, with no server unlocks: Cliffe is visible in the common room and talks. The lecture theatre is open from the start, so Tom's hand-over was played for real: "Get a lab laptop" completed, and the laptop and FN1-FN3 were received. The transcript shows the new split lines.
- **Then** corridor, library and workshop were unlocked server-side for the layout tour. `verify-run.rb`: 9 rooms beyond the first.
- All ten rooms visited and screenshotted. New doors walked both ways: foyer↔lecture theatre, library↔Special Collections, office↔seminar room.
- Taps:
  - Tom's whiteboard, Tom, the safe (password pad), the door card (game display), the FN7 desk copy, the ledger whiteboard, Sidhu, the directory and all four workshop interactables open directly;
  - no new pick-one menus.
- All scenario objects sit on their slots with the intended textures (`whiteboard2` in the theatre, `safe1` in SC, `whiteboard1` in the seminar room, `uni_doorcard1` in the office). The office's Phase 1 whiteboard slot stays hidden.
- No missing textures after the `book1` fix. Duplicates are only the engine's door sprites at shared N/S doors. Console errors are only TTS 503s.
- Harness quirks, as in Phase 1: `enter` needs retries, the first `moveTo` after a side-door crossing can be ignored, and straight-line `moveToNear` needs a waypoint round furniture.

### Evidence (`build_evidence/rooms/`)

- `p2-after-<room>.png` for all ten rooms. The Phase 1 `after-*` shots are the "before" for the seven existing rooms; the three new rooms have none.
- `p2-lecture_theatre-tom.png`, `p2-sidhu_office-doorcard.png`, `p2-fresh-common_room-cliffe.png`
- `p2-previews-contact.png` (all ten maps), `p2-props-ledges-4x.png`, `p2-foyer-terrazzo-3x.png`
- `phase2_checks/` (text outputs)

### For the next phase

- Engine (needs approval): move `const room = rooms[roomId]` above the `Object Layer 1` block in `rooms.js createRoom`. After that, `build_room(collisions=...)` can replace the ledges' collision role, and the ledges can stay as decor.
- Phase 3 placeholders still in use:
  - the `smalldesk2` lectern;
  - `hospital_chair_north` seats (the P1 `lecture_seat_row1` art should keep the ledges' line, row feet - 22);
  - the electronics bench, the workshop's printer/cart, and the Special Collections display case and plan chest.
- Phase 4: SOLUTION_GUIDE, TESTING_WALKTHROUGH and DESIGN.md still describe Tom in the lab, the safe in the library and Sidhu in his office. The timed blind playtest (D3) on the expanded graph is still outstanding.
