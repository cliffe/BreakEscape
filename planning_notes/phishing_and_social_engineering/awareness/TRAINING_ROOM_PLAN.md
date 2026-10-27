# Awareness training rooms: dressing, lighting and POV plan

Status: steps 1–2 of §8 built 2026-10-22 (maps, sheets, signs, kiosk slot, lighting blocks, `training_room.py`); see
§10. The shells and generators are not wired yet. It covers ART_SCOPE.md §4b and §6c and the user's decision of
2026-10-22: each company's training room gets the full dressing and lighting passes (about five cycles), then one POV
background per company.

**Kind of game.** The awareness product: short attack-then-defend episodes for non-technical staff on the neutral corporate
skin (`ui_theme: "general"`). The rooms should read as an ordinary company's training room, not a spy set and not the
student lab. BRAND_SET.md §1 keeps the lab's brands out of the awareness product, and the same goes for the rooms: no
Tarnside room layout, no network-diagram whiteboards.

## 1. Where things stand (renders)

All renders are in the session scratchpad
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/`.
Copy any you want to keep: the scratchpad goes when the session ends.

| Render | Path |
|---|---|
| Today's map, with grid (conditional props included) | `.../scratchpad/r0/room_office.png` |
| Today's room in game (E1 defend shell, tour game 3599) | `.../scratchpad/tour_e1/training_room-a.png` |
| Candidate source offices (12 maps) | `.../scratchpad/cand/contact_sheet.png` |
| Proposed source map, with grid | `.../scratchpad/r1/room_uni_seminar.png` |
| Wall and floor sheets of five themed maps | `.../scratchpad/sheets.png` |
| Candidate props at 2x (viewing only, nothing shipped is scaled) | `.../scratchpad/props_sheet.png` |
| Chair sprites | `.../scratchpad/chairs.png` |

What the game shows today, in all 38 shells (8 Brightwell, 12 Tarrowby, 12 Quayholt, 6 Merrin & Sallow):

- m01's `room_office`: purple carpet, two pairs of cluttered desks, two school chalkboards on easels and a bookcase. None of
  it reads as a training room or as any of the four companies. The chalkboards fail the theme-fit rule.
- `slot_audit.py` reports `NO SLOT kiosk` in every shell: the kiosk lands on a random sprite and is then moved to tile
  (6,2) by an explicit `position`. In game it overlaps a chair and the corner of the right-hand desk. The p1 playtest logs
  (`tools/playtest/p1-e1-session.jsonl`, `p1-e2b-session.jsonl`) show the kiosk tap going through a pick-one menu because
  the chair is within 13px.
- The host stands at tile (3,3), in front of the left chalkboard and between two chairs.
- The player spawns at the room centre (160,144), the default when `startPosition` is absent.
- No `lighting` block and no `chatBackground`. The host's conversation opens on the plain frame.
- The tour also shows the player as a hooded figure. That belongs to the character work (ART_SCOPE §3b), not this plan.

## 2. The room: four map types from one base

**Recommendation: four awareness-owned map types, all copied from `room_uni_seminar` and dressed separately:**
`room_aw_brightwell`, `room_aw_tarrowby`, `room_aw_quayholt`, `room_aw_merrin_sallow`.

ART_SCOPE §6c proposed one shared map. The user's later decision (four POV backgrounds, full polish on each company's room)
changes the case:

1. **The POV has to match the map.** The room-pov-background skill copies the dressed layout. Four backgrounds over one
   map would either look alike apart from a sign, or show furniture the map doesn't have.
2. **One map would need conditional fixtures in 38 scenarios.** Per-company props on one map must sit in
   `conditional_items` and be claimed by a flavour object in every shell (about 6 to 10 per shell). The dressing skill
   says to split map types rather than pile up conditional fixtures, and the lab did the same (`SE_BUILD_LOG.md` A1).
3. **One base keeps the wiring identical.** The kiosk slot, host spot, spawn point and keep-clear zones are the same in
   all four, so the generators share one helper and only the map type, chat background and lighting change by company.
4. **The scenario cost is one field.** A shell picks its room with `type`, which the generators already write.

The cost is four maps to register and four rooms to take through each cycle. That is less work than it sounds: each cycle
renders all four on one contact sheet, and the shared skeleton (§3.1) is done once before the copies are made.

**Why `room_uni_seminar`.** It is already a training room: a long table with chairs, a flip chart, two windows with
radiators under them, a whiteboard, a clock and a water cooler. It is a 10x10 map on the 2-tile wall standard. It is
used only by `lab_tesseract_trials`, so copying it changes nothing there. Rejected: `room_zds_conference` (the lab's
Tarnside hub was built from it, so the awareness rooms would look like the lab), `room_hospital_meeting` (clinical green),
`room_qdc_open` and `room_zds_office` (open-plan desks, not training rooms), `room_hce_office` (one executive's office).

The awareness shells have no `connections`, so no doors are ever drawn. The copies keep the seminar's door-free back wall.

## 3. Dressing

### 3.1 Steps shared by all four

1. **New wall and floor sheets** (free, PIL, no generation). New `scripts/room_gen/make_aw_tileset.py`, modelled on
   `make_uni_tileset.py` (it imports that script's painters): room6's layout, raised with `raise_back_wall()`, the brand
   accent as the skirting line, one floor each. The coloured skirting is how the shipped themed maps carry a company
   colour (uni teal, hce orange, zds cyan, aes green, qdc purple; see `sheets.png`).

   | Sheet | Back wall | Skirting (BRAND_SET accent) | Floor |
   |---|---|---|---|
   | `room_aw_brightwell` | warm off-white | `#2f6f5e` green | `CARPET_CHARCOAL` |
   | `room_aw_tarrowby` | pale grey | `#3b5b8c` steel blue | `vinyl_pixel` (blue-grey sheet vinyl, a depot office) |
   | `room_aw_quayholt` | cool white | `#6b4c9a` purple | `CARPET_BLUE` |
   | `room_aw_merrin_sallow` | warm stone | `#8a5a2b` bronze | `concrete_pixel` (sealed concrete, an architects' studio) |

   Each sheet needs a `this.load.image` line in `game.js`, and `check_room_walls.py` must read 64 on every map.

2. **New wall signs** (free, PIL). New `scripts/room_gen/make_aw_props.py`, modelled on `make_se_props.py`, at native size:
   - `aw_logo_brightwell1`, `aw_logo_tarrowby1`, `aw_logo_quayholt1`, `aw_logo_merrin_sallow1`: 64x19 plates in each
     company's accent, white `logoText` capitals, a small mark at the left (Brightwell an ear of oats, Tarrowby a
     forward chevron, Quayholt a quay-post "Q", Merrin & Sallow a set square). No shield: that is Tarnside's mark.
     "MERRIN & SALLOW" goes on two lines (`MERRIN &` / `SALLOW`). The 3x5 font has no `&`, so the script adds one.
   - `aw_poster_report_<company>1`: 16x21 side-wall posters, accent header and "REPORT IT" over a mail icon. This is
     the one awareness message the room repeats.
   - Register with `python3 scripts/room_gen/register_object.py --wall <names>` (dry run first).

3. **Give the kiosk a map slot.** `kiosk.png` (27x60) is preloaded in `game.js:354` but isn't in the catalogue or any
   tileset, which is why every shell reports `NO SLOT`. Run `register_object.py kiosk` (not `--wall`) with `--dry-run`
   first: if it adds a second `this.load.image('kiosk', ...)` line, remove the duplicate.

4. **Copy and register** (as `SE_BUILD_LOG.md` A1 did): copy `room_uni_seminar.json` and `.tmj` to each of the four names;
   then `room_edit.py ROOM floor room_aw_<company>` on each. `room_edit.py floor` only accepts `room6` and
   `room_hospital*` images today (`room_edit.py:333`), so widen that regex to `room6|room_hospital(_[a-z]+)?|room_uni(_[a-z]+)?|room_aw_[a-z_]+`
   first. Then register each type in `game.js` (`tilemapTiledJSON`), the room-type enum in `scripts/scenario-schema.json`,
   the room table in `README_scenario_design.md`, and the hand-maintained note above `builders` in `generate_rooms.py`.
   `room_uni_seminar` itself stays as it is (`git diff` on it must be empty).

5. **The skeleton, the same in all four** (room pixels: `x` left edge, `y` feet). Ids are the seminar's, from
   `room_edit.py room_uni_seminar list`.

   | Op | Object | To | Why |
   |---|---|---|---|
   | delete | #15 `beanbag_teal1`, #16 `beanbag_orange1`, #21 `uni_timetable1` | | campus props |
   | delete | #11 `hospital_chair2` | | west end of the table would sit in the wall |
   | add `items` | `kiosk` | x 238, y 140 | the kiosk slot (§4) |
   | add `items` | `aw_logo_<company>1` | x 146, y 40 | centred at x 178, over the host (§4) |
   | add `items` | `aw_poster_report_<company>1` | x 14, y 120 | west wall strip (x 12–30) |
   | move | #1 `hospital_conference_table` | x 36, y 270 | the training table, lower left, clear of the spawn |
   | move | #5, #7, #9 `hospital_chair_south` | x 52 / 92 / 132, y 214 | north side of the table |
   | move | #6, #8, #10 `hospital_chair_north` | x 52 / 92 / 132, y 296 | south side |
   | move | #12 `hospital_chair1` (faces W) | x 166, y 262 | east end |
   | move | #23 pens, #24 mugs tray, #25 journals | x 69 / 114 / 86, y 234 / 234 / 232 | with the table (dx −54, dy +64) |
   | keep | #20 `fire_alarm_point1` | x 292, y 132 | east wall |

   Keep clear in every room: the host box x 136–216, y 64–150; the kiosk and its approach, x 230–272, y 76–175; the
   spawn box x 175–210, y 170–230. Nothing on the floor within 32px of the kiosk's top-left (238,80), so its tap never
   opens a pick-one menu again.

### 3.2 Brightwell Foods: finance training room

East Midlands food manufacturer, finance team, the afternoon payment run (E1, E7, finance checks).

| Op | Object | To | Reads as |
|---|---|---|---|
| move | #2 `window_blinds1` | x 36, y 50 | window |
| move | #17 `uni_radiator1` | x 43, y 59 | radiator under it |
| sprite + move | #3 `whiteboard1` → `year_planner1` | x 88, y 52 | payment runs and quarter end on the year planner |
| sprite + move | #4 `window_blinds1` → `whiteboard2` | x 220, y 50 | bar chart: the quarter's figures |
| delete | #18 radiator, #19 clock | | no wall space left |
| keep | #13 `flip_chart1` | x 44, y 130 | trainer's flip chart |
| move | #14 `water_cooler1` | x 262, y 296 | refreshments corner |
| add `items` | `coffee_station1` | x 232, y 296 | beside the cooler |
| keep | #22 `chairs_stacked1` | delete if the lower left feels crowded in cycle 1 | |

Brand: green skirting, green logo plate over the host, green "REPORT IT" poster. Cycle candidate: a free PIL table item,
`aw_brightwell_oatbox1` (about 12x14), a box of the company's oat bars on the training table.

### 3.3 Tarrowby Logistics: depot training room

West Yorkshire haulier and warehouse; drivers, HR and the work phone (E2, E6, HR and mobile checks).

| Op | Object | To | Reads as |
|---|---|---|---|
| move | #2 `window_blinds1`, #17 radiator | x 36, y 50 / x 43, y 59 | window onto the yard |
| sprite + move | #3 `whiteboard1` → `rota_board1` | x 92, y 46 | driver and shift rota |
| sprite + move | #4 `window_blinds1` → `m09_county_map1` | x 220, y 48 | route map of the region |
| add `items` | `aes_hivis_hook1` | x 256, y 52 | hi-vis on hooks, a depot office |
| delete | #18 radiator, #19 clock, #14 water cooler | | |
| keep | #13 `flip_chart1` | x 44, y 130 | |
| add `items` | `drinks_vending1` | x 226, y 300 | canteen-style vending |
| move | #22 `chairs_stacked1` | x 272, y 300 | spare chairs |

Brand: steel-blue skirting, logo plate and poster. Check in cycle 1 that `m09_county_map1` carries no m09 text.

### 3.4 Quayholt Insurance: service-desk training room

Bristol commercial insurer with an in-house IT service desk and single sign-on (E3, E5, general and helpdesk checks).

| Op | Object | To | Reads as |
|---|---|---|---|
| move | #2 `window_blinds1`, #17 radiator | x 36, y 50 / x 43, y 59 | window |
| sprite + move | #3 `whiteboard1` → `info_screen1` | x 90, y 48 | the service-desk queue screen |
| sprite + move | #4 `window_blinds1` → `conference_screen1` | x 218, y 54 | a sign-in screen (E5's subject) |
| delete | #18 radiator, #19 clock, #14 water cooler | | |
| keep | #13 `flip_chart1` | x 44, y 130 | |
| add `tables` | `zds_desk1` | x 206, y 296 | a spare service-desk position |
| add `table_items` | `pc8` on the desk; `keyboard1` | about x 214 / 244, y 278 / 286 | |
| add `items` | `hospital_chair_south` | x 237, y 262 | the agent's seat, behind the desk |
| add `items` | `qdc_poster_secure1` | x 14, y 170 | the LOCK poster, under the report poster |

Brand: purple skirting, logo plate and poster.

### 3.5 Merrin & Sallow Architects: studio meeting room

London architecture practice; partners and their PA (E4, executive checks).

| Op | Object | To | Reads as |
|---|---|---|---|
| delete | #2 `window_blinds1`, #17 radiator | | wall goes to the plan chest |
| add `items` | `plan_chest2` | x 36, y 72 | architects' plan chest against the back wall |
| sprite + move | #3 `whiteboard1` → `hce_art_canvas1` | x 96, y 46 | a modern print |
| move | #4 `window_blinds1`, #18 radiator | x 220, y 50 / x 227, y 59 | the big window |
| delete | #19 clock, #13 flip chart, #14 water cooler, #22 stacked chairs | | |
| add `items` | `planter_fig1` | x 96, y 140 | fig in a planter |
| sprite | #5, #7, #9 → `chair-grey-1`; #6, #8, #10 → `chair-grey-4`; #12 delete | | grey task chairs (check facing in cycle 1) |
| add `table_items` | `m10_plans1`, `bankers_lamp1` | on the table | rolled drawings, a desk lamp |
| add `items` | `leather_sofa1` | x 216, y 300 | a sofa for visiting clients |

Brand: bronze skirting, logo plate and poster. The table stays the white seminar table (it reads as a crit table). Don't
use `zds_conference_table1` with black exec chairs: that is the lab hub's arrangement.

### 3.6 Cycles and checks

Five dressing cycles (AGENTS.md), all four rooms in each:

1. `python3 scripts/render_room_preview.py 'room_aw_*' --sheet --grid --scale 2 --out <scratch>/awN`
2. `python3 scripts/generate_rooms.py --check room_aw_brightwell room_aw_tarrowby room_aw_quayholt room_aw_merrin_sallow`
3. `python3 scripts/room_gen/check_room_walls.py 'room_aw_*'` (64 on all four)
4. `python3 scripts/room_gen/slot_audit.py --notes` on one shell per company: 0 problems, and `NO SLOT kiosk` gone
5. A tour per company, on the defend shells: `awareness_e1_invoice_fraud_defend`, `awareness_e2_cv_lures_defend`,
   `awareness_e3_helpdesk_reset_defend`, `awareness_e4_exec_whaling_defend`
   (`tools/playtest/lighting-tour.sh <shell> <scratch>/<co> --close-intro --check`)
6. Critique against the dressing skill's list; stop early only when a cycle finds nothing above minor.

## 4. Placement

| What | Where | Notes |
|---|---|---|
| Host | `position: {x: 5.5, y: 3.5}` (centre at 176,112; feet near y 144) | About two-thirds across and a third down, on clear floor, the logo plate behind and above. In the POV the logo sits behind the host. The 80x80 tap frame (x 136–216) stays 22px clear of the kiosk |
| Kiosk | map slot `kiosk`, x 238, y 140 (top-left 238,80) | Claimed by `type: "kiosk"`; drop the explicit `position`. Free floor on three sides, so the player can reach its top-left from the left side (the 60px height is over the ~56px reach limit from the foot alone; check this in the playtest) |
| Player spawn | `startPosition: {x: 6, y: 6.2}` (192,198) | Below and between host and kiosk, so both are in view on arrival and the walk to either is short |

The same three positions apply in all four rooms. E3's `leila_servicedesk` is a phone contact with no position and is not
affected.

## 5. Lighting

Day office throughout; the host is in the room, so it starts lit. Mood goes in the scenario-level block (the lighting
skill's rule); since each shell has one room, that block is the company's mood. `lighting_lookup.rb room_uni_seminar` finds
no earlier lighting for this map. The fire-alarm glow is switched off and the kiosk screen glow added, as in the lab's
day office.

**Brightwell Foods** (afternoon before the three o'clock payment run; warm sun through the window)

```json
"lighting": { "enabled": true, "defaultMode": "on" }
```
```json
"lighting": {
  "emitters": {
    "kiosk": { "color": "#9fd4ff", "radius": 28, "intensity": 0.45, "effect": "screen" },
    "fire_alarm_point": [ { "intensity": 0 } ]
  },
  "lights": [ { "x": 1.75, "y": 2.3, "color": "#ffe2b0", "radius": 80, "intensity": 0.35 } ]
}
```

**Tarrowby Logistics** (early shift at the depot, greyer daylight, vending glow)

```json
"lighting": { "enabled": true, "defaultMode": "on", "ambient": "#bcc2cc" }
```
```json
"lighting": {
  "emitters": {
    "kiosk": { "color": "#9fd4ff", "radius": 28, "intensity": 0.45, "effect": "screen" },
    "drinks_vending": { "color": "#e0f0ff", "radius": 40, "intensity": 0.45 },
    "fire_alarm_point": [ { "intensity": 0 } ]
  },
  "lights": [ { "x": 1.75, "y": 2.3, "color": "#dfe8f4", "radius": 72, "intensity": 0.3 } ]
}
```

**Quayholt Insurance** (bright corporate office; the screens carry it)

```json
"lighting": { "enabled": true, "defaultMode": "on" }
```
```json
"lighting": {
  "emitters": {
    "kiosk": { "color": "#9fd4ff", "radius": 28, "intensity": 0.45, "effect": "screen" },
    "conference_screen": { "color": "#9fc0ff", "radius": 36, "intensity": 0.4, "effect": "screen" },
    "fire_alarm_point": [ { "intensity": 0 } ]
  },
  "lights": [ { "x": 1.75, "y": 2.3, "color": "#e8f0ff", "radius": 72, "intensity": 0.3 } ]
}
```

`info_screen1` and `pc8` already match `EMITTERS`; tone them down in a room emitter only if the review says they glare.

**Merrin & Sallow Architects** (warm studio, big window on the right, desk lamp)

```json
"lighting": { "enabled": true, "defaultMode": "on", "ambient": "#cac4bc" }
```
```json
"lighting": {
  "emitters": {
    "kiosk": { "color": "#9fd4ff", "radius": 28, "intensity": 0.45, "effect": "screen" },
    "bankers_lamp": { "color": "#ffd9a0", "radius": 40, "intensity": 0.5 },
    "fire_alarm_point": [ { "intensity": 0 } ]
  },
  "lights": [ { "x": 7.55, "y": 2.3, "color": "#f0f4ff", "radius": 96, "intensity": 0.4 } ]
}
```

`bankers_lamp1` matches the engine's `/(lamp)/` emitter at radius 80, intensity 0.9; the room entry turns it down. No
motion, dark or flicker modes: the learner spends the whole episode in this room. Both ambients stay above the `#a8b0c0`
readability floor. Two to four visual review rounds (AGENTS.md), then add the four rooms to `docs/agents/LIGHTING_LOG.md`.

## 6. Wiring: 38 shells and the generators

31 shells come from four generators; 7 full episodes have none.

| Source | Shells |
|---|---|
| `gen_e1_shells.py` | `awareness_e1_invoice_fraud_defend`, `awareness_{pre,post}_finance_{ab,ba}` (5) |
| `gen_e2_e4_shells.py` | `awareness_e2_cv_lures_defend`, `awareness_e4_exec_whaling_defend`, HR and executive checks (10) |
| `gen_e3_e5_shells.py` | `awareness_e3_helpdesk_reset_defend`, `awareness_e5_signin_pages_defend`, general and helpdesk checks (10) |
| `gen_e6_e7_shells.py` | `awareness_e6_texts_and_qr_defend`, `awareness_e7_voice_ceo_defend`, mobile checks (6) |
| Hand-written, no generator | `awareness_e1_invoice_fraud`, `_e2_cv_lures`, `_e3_helpdesk_reset`, `_e4_exec_whaling`, `_e5_signin_pages`, `_e6_texts_and_qr`, `_e7_voice_ceo` (7) |

Every shell already carries its company as `social.awarenessEpisode.company` (`brightwell_foods`, `tarrowby_logistics`,
`quayholt_insurance`, `merrin_sallow`), so the room can be keyed on it with no new input.

**One shared module**, `planning_notes/phishing_and_social_engineering/awareness/training_room.py`:

```python
HOST_POSITION = {'x': 5.5, 'y': 3.5}
START_POSITION = {'x': 6, 'y': 6.2}
ROOMS = {
    'brightwell_foods':   {'type': 'room_aw_brightwell',    'ambient': None,      'chatBackground': None, 'room_lighting': {...}},
    'tarrowby_logistics': {'type': 'room_aw_tarrowby',      'ambient': '#bcc2cc', 'chatBackground': None, 'room_lighting': {...}},
    'quayholt_insurance': {'type': 'room_aw_quayholt',      'ambient': None,      'chatBackground': None, 'room_lighting': {...}},
    'merrin_sallow':      {'type': 'room_aw_merrin_sallow', 'ambient': '#cac4bc', 'chatBackground': None, 'room_lighting': {...}},
}
def scenario_lighting(company): ...   # {"enabled": true, "defaultMode": "on"} plus ambient when set
def room_fields(company): ...         # type, chatBackground (only when set), lighting
```

`chatBackground` stays `None` until each POV file exists (the validator warns on a missing file); the POV step sets the
path and regenerates.

**Generator fields** (the same change in each of the four scripts):

| Function | Field | Change |
|---|---|---|
| `host_npc()` | `position` | `copy.deepcopy(training_room.HOST_POSITION)` instead of `{'x': 3, 'y': 3}` |
| `kiosk()` | `position` | remove; the map's `kiosk` slot places it |
| `scenario()` | `startPosition` | new top-level key, inserted right after `startRoom`, from `START_POSITION` |
| `scenario()` | `lighting` | new top-level key before `rooms`, `scenario_lighting(company)` |
| `scenario()` | `rooms.training_room.type` | `ROOMS[company]['type']` instead of `'room_office'` |
| `scenario()` | `rooms.training_room.chatBackground`, `.lighting` | from `room_fields(company)`, after `door_sign` |

In `scenario()`, `company = social['awarenessEpisode']['company']`; every generator already passes `social` with that
block. Import the module by path (`sys.path.insert(0, AW)`), as the scripts already locate their fragments.

**The 7 full shells.** Their formatting is mixed (two round-trip through `json.dumps(indent=2)`, five don't), so don't
re-dump them. A small `apply_training_room.py` splices the same fields into the text (the `"type": "room_office"` line,
the host's and kiosk's `position` lines, two inserted keys), then loads the result and asserts that it equals the old
JSON with exactly those fields changed. It imports `training_room.py`, so a later regeneration and a re-run of the
patcher agree.

**Drift check** (design review C3 found generator drift): regenerate all four generators into a scratch directory and
diff each `scenario.json.erb` against `scenarios/`. The only differences allowed are the six fields above. Then:

- `ruby scripts/validate_scenario.rb` on all 38 shells (restore any unrelated files it rewrites)
- `slot_audit.py --notes` on all 38: no `NO SLOT`
- the `social-p7-followups` suite and the `test/js/fixtures/social_awareness/clean_*.json` tests. The fixtures still
  say `room_office`; leave them unless a test compares them with the real shells
- a Sonnet playtest of one shell per company (host talk, kiosk tap with no pick-one menu, round complete), editing
  nothing in the repo

## 7. POV backgrounds (after dressing and lighting close)

Four, one per company, by the room-pov-background skill: `pov_prep.py` strip and inventory from each final room, a Gemini
concept (4 calls, plus roughly 4 to 8 relight or fix edits, as ART_SCOPE §6c estimates), PixelLab conversion to 400x400,
saved as `assets/backgrounds/rooms/aw_<company>_training.png`, then set in `training_room.py` and regenerated (§6). Each
concept shows the host in front of the back wall with the company's logo plate behind them, the kiosk to their right and
the skirting in the brand colour. Concept prompts state the host's ethnicity and age from BRAND_SET.md (user decision,
2026-10-22). Hosts are still on placeholder sprites until the character batches land; the background shows the room
only, so it does not wait on them.

## 8. Order and cost

1. Sheets, signs, the `kiosk` slot, the `room_edit.py floor` regex (free, PIL).
2. Copy and register the four maps; apply the shared skeleton and the per-company ops.
3. Wire the generators and the 7 full shells; drift check; validate.
4. Dressing cycles (about five), then lighting rounds (two to four).
5. POV backgrounds (metered Gemini, already approved as four).

No PixelLab or Gemini spend before step 5. No commits until the user asks; stage explicit paths.

## 9. For the user

1. Four maps instead of ART_SCOPE §6c's one (reasons in §2).
2. Merrin & Sallow on a concrete floor (an architects' studio) rather than carpet.
3. The "REPORT IT" side poster in each room: keep, or leave the walls to the logo alone.
4. The hooded player sprite seen in the tour, if that isn't intended for `female_office_worker_v2`.

## 10. Build log (2026-10-22, §8 steps 1–2)

Built: the four `room_aw_*` maps (copies of `room_uni_seminar`, which is unchanged), their sheets
(`scripts/room_gen/make_aw_tileset.py`), the logo plates and posters (`scripts/room_gen/make_aw_props.py`, registered
`--wall`), the `kiosk` catalogue entry (`register_object.py kiosk`; game.js already loaded it, so no second load line),
the wider `room_edit.py floor` regex, the registrations (game.js map and sheet loads, schema enum, README room table, the
hand-maintained note in `generate_rooms.py`), `training_room.py` and `training_room_lighting.json` beside it. Not
wired into any shell or generator (§6 is next).

Where the build differs from §3–§5, and why:

| Item | Plan | Built | Why |
|---|---|---|---|
| Poster text | "REPORT IT" over a mail icon | "SEE" header, envelope with a red alert dot, "SAY" | "REPORT IT" is 35px in the 3x5 font; the poster is 16px wide. "See it, say it" is the British reporting slogan. §9.3: kept, it reads well beside the logo |
| Merrin & Sallow floor | `concrete_pixel` | as planned | §9.2: concrete, as recommended |
| Merrin & Sallow chairs | `chair-grey-1` / `chair-grey-4` | `chair-white-1-rotate5` (north side, facing S) and `chair-white-1-rotate1` (south side, facing N) at x 46/85/124 | both grey chairs face south (their swivel frames start at S), so the south side would have faced away from the table. The oak chairs suit a studio |
| Brightwell stacked chairs | keep (#22) | deleted | at its old spot it sat on the moved table |
| Quayholt desk | `pc8` + `keyboard1` | `pc8` (x 228, feet 280) + `phone3` (x 258, feet 276) | `pc8` carries its own keyboard; the extra one overhung the desk |
| All four | — | `fire_extinguisher1` at x 292, feet 176, under the call point | the dressing skill's call point and extinguisher pair (as `room_qdc_open`) |
| Merrin `m10_plans1` | on the table | x 133, feet 236 | clear of the mugs tray |
| Kiosk emitter | no offset | `offsetY: -20` | the screen is at the top of the 60px kiosk |
| Host spot | "feet near y 144" | sprite centre (176,81), feet near y 110 in game | the engine reads `position` lower than §4 assumed; the host stands just under the logo plate, clear of the kiosk |

Checks: `check_room_walls.py 'room_aw_*'` 64 on all four; `generate_rooms.py --check` OK on all four (warnings are the
bottom-two-rows and N-door-corner kind, which don't apply to a room with no doors and nothing south of it, plus the
extinguisher on the east wall strip, as `room_qdc_open`). Slot audit and the validator were run on scratch copies of
the four defend shells with the §6 fields applied: kiosk `ok` on its slot, 0 problems, validator output identical to
the unpatched shells. In game (keyless :3001, the game's own scenario copy patched, no repo file touched): spawn at
(192,198), host and kiosk both reached by `moveToNear`, the kiosk tap opens the episode runner directly (no pick-one
menu), and the walk back to the spawn arrives.

Left for the dressing cycles: Brightwell's oat-bar box (§3.2 candidate) was not drawn; the right-hand floor between
kiosk and the bottom-right props is open in all four (the host and player stand there, so it was left).
