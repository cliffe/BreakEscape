# Awareness training rooms: review, cycle 3

Reviewer: fresh Opus, read-only, 2026-10-27. Skills: `mission-room-dressing` and `mission-room-lighting`, with the
POV readiness checks from `room-pov-background`. C2's fixes landed in 1ad8dd612 and its in-game pass in cda10a12f.

Scope: `room_aw_brightwell`, `room_aw_tarrowby`, `room_aw_quayholt`, `room_aw_merrin_sallow` as the 38 awareness
shells use them (company to room as in C2's table).

## What was run

- **Tours, keyless :3001**, one game at a time, own ids, each stopped by the tour script:
  `lighting-tour.sh <shell> <out> --close-intro --check --player training_room:6,6:up`.
  Brightwell `awareness_e1_invoice_fraud_defend` game 4494, Tarrowby `awareness_e2_cv_lures_defend` 4496, Quayholt
  `awareness_e3_helpdesk_reset_defend` 4500, Merrin & Sallow `awareness_e4_exec_whaling_defend` 4504. `--check` read
  `mode=on` in all four, lit ambient `#c4cad8` / `#bcc2cc` / `#c4cad8` / `#cac4bc`, light map redrawing (300–333 ms).
  The E3 defend shell has another session's one-line uncommitted edit; it does not touch room fields.
- **Light map estimate.** Each lit shot divided by the unlit map render (`render_room_preview.py --scale 2`, aligned
  at screen 380,180, correlation 0.96–0.99), medians per 16 room px. This shows where the room `lights` lift the floor
  and by how much. Numbers below come from it.
- **Static checks.** `build_aw_rooms.py --check`: all eight files `same`. `check_room_walls.py 'room_aw_*'`: floor at
  64 on all four. `generate_rooms.py --check` on the four: OK, warnings of the same expected kinds as C2 (bottom two
  rows, back-wall items over N-door corners in rooms with no doors, extinguisher on the east strip, one floor plant).
  `slot_audit.py --notes` on the four defend shells and `awareness_e7_voice_ceo`: 0 problems.
- **Shell drift.** A Python check over all 38 shells against `training_room.py`: right map type per company, room and
  scenario `lighting` equal to `training_room_lighting.json`, no `chatBackground`, only the kiosk as a room object,
  host at (5.5, 3.8) in 38 of 38, start (6, 6.2) in 38 of 38. No drift.
- **POV inputs.** `pov_prep.py room_aw_merrin_sallow` against the E4 defend shell (inventory, back-wall strip), to see
  what the POV stage will be handed.
- Walk-and-tap was not repeated: C2's bridge run (games 4485–4491) opened the kiosk and the host with one tap and no
  menu in all four, and nothing near either has moved since.

Screenshots in `playtests/ROOMS_C3_screenshots/`:

| File | What |
|---|---|
| `game_<co>.png`, `game_<co>_dark.png` | lit tour shot and the dark player shot, four rooms |
| `backwalls_game_4x.png` | back wall and skirting of each room from the lit shots, 4x (viewing only) |
| `plates_game_6x.png` | the four logo plates from the lit shots, 6x (viewing only) |
| `pov_strips.png` | the top 160 room px of each lit shot: back wall, host, kiosk, the left floor item |
| `merrin_m_8x.png` | "MERRIN &" in the current logo font (top) and with a 5-wide M (bottom), mock-up |
| `maps_contact_sheet.png` | map renders, 32px grid, 2x |

## C2 fixes in game

| C2 | Status | Evidence |
|---|---|---|
| m1 logo W reads as H | **closed** | BRIGHTWELL, TARROWBY and SALLOW read correctly in game (`plates_game_6x.png`). The same font's M still reads as H: see m1 below |
| t1 second plate line | **closed** | FOODS, LOGISTICS, INSURANCE and SALLOW are white, the same weight as the first line, and read at game zoom |
| m2 Merrin's fig | **closed** | `planter_fig1` (#31, x 34, feet 176) stands against the west wall under the report poster and reads as a planted corner. It sits 8px above the north chair row (t1 below) |
| m3 Quayholt's chairs | **closed** | Seven charcoal seats plus the east-end chair; Brightwell keeps teal. Side by side (`game_brightwell.png`, `game_quayholt.png`) the two rooms no longer share a chair, floor or plate colour |
| m4 Tarrowby rooflight | **closed** | The pool shows round tile (4.5, 5): the light map rises from about 0.88 at the edges of the middle floor to 1.00 over a disc about 110px across, centred between the table and the kiosk. It reads as a brighter middle of the room, cool, with nothing under a wall item |
| t2 Tarrowby corners | **closed** | `notice_board1` (#2, x 34) and `aes_hivis_hook1` (#30, x 258–288) clear the corner diagonals (`backwalls_game_4x.png`) |
| t3 Brightwell back wall | **closed** | Window, range, logo, bar chart. Gaps 20 / 20 / 6px; the 6px one between plate and chart is t2 below |
| Corners and back walls, all four | **closed** | No hanging overlaps the frame or the side-wall diagonals; every back-wall item sits between y 12 and the skirting. Merrin's plan chest (#30) stands against the wall with its feet on the floor at y 72, as the skill asks |
| C2 in-game m5a, Brightwell sun faint | **open**, m2 below | Light map at 1.00 under the window against 0.90–0.94 for the floor round it, and no visible warmth on the oatmeal carpet. In the dark shot the warm pool shows clearly |
| C2 in-game t4, Merrin lamp | **open, left** | The lamp is still the second-brightest point in the dark shot (light map 1.23 on the table); the kiosk reads first. Not raised again |

## Counts

| Blocker | Major | Minor | Trivial |
|---|---|---|---|
| 0 | 0 | 2 | 3 |

m1 is a legibility fix that has to land before the POV concepts; m2 is cosmetic.

## Findings

### Minor

**m1. Merrin's plate reads "HERRIN &".** `aw_logo_merrin_sallow1` (#27 on `room_aw_merrin_sallow`). The logo font
still takes its M from the shared 3x5 font, `#.#/###/###/#.#/#.#`, which is an H with a thick bar, the same fault C2
m1 fixed for W (`plates_game_6x.png`, `merrin_m_8x.png` top line). C2's fix note judged MERRIN readable; in game, at
the zoom the player sees, it reads HERRIN. The plate hangs over the host in all six Merrin & Sallow shells and the POV
background will copy it, and the course asks learners to read company names letter by letter.
*Fix:* in `scripts/room_gen/make_aw_props.py:40-45`, add to the `LOGO_FONT.update`
`"M": ["#...#", "##.##", "#.#.#", "#...#", "#...#"]`. "MERRIN &" then ends at x 51, inside the rule (x 59); no other
plate has an M. Rerun `make_aw_props.py`, look at the plate at 8x (`merrin_m_8x.png` bottom line is the mock-up),
then `build_aw_rooms.py --check` (the maps don't change, so no `apply_training_room.py --refresh` is needed).

**m2. Brightwell's afternoon sun still barely shows in the lit room** (C2 in-game m5a, cosmetic). The room light at
tile (1.75, 2.6) is there: the light map reads 1.00 under the window against 0.90–0.94 for the floor round it. But a
room `light` can only lift a lit floor to white and can't colour a pale one (the skill's known limit), so on the
oatmeal carpet it shows as a slightly cleaner patch with no warmth. Raising its intensity won't help.
*Fix:* in `training_room_lighting.json` `brightwell_foods.room.emitters` (line 7–10), add a floor tint keyed on the
window texture, e.g. `"window_blinds": { "color": "#ffd9a0", "radius": 48, "intensity": 0.1, "floorTint": 0.5 }`.
`lighting.js:1075-1080` stamps the tint just below the sprite (top + height + 4), which is the floor under the window,
and multiplies it in, so it warms the carpet. Only Brightwell's room block carries it, so the Quayholt and Merrin
windows are unchanged. Then `apply_training_room.py --refresh` (8 Brightwell shells) and a lit tour. Untested: if the
glow on the window itself shows, drop `intensity` to 0. Closing this as won't-fix is also reasonable: the rooms are
already told apart by floor, chairs and plate, and the POV concept takes its sun from the mood line.

### Trivial

**t1. Merrin's fig sits 8px above the north chair backs.** `planter_fig1` (#31, feet 176) against chair #5
(`aw_studio_chair_s1`, top 184). It reads fine in game but the pot and the left chair nearly touch.
*Fix:* `build_aw_rooms.py:141`, feet 176 → 166 (top 105, still clear of the poster on the wall strip).

**t2. Brightwell's bar chart crowds the plate.** `whiteboard2` (#4, x 216–260) is 6px right of the plate; the other
back-wall gaps are 20px. *Fix:* `build_aw_rooms.py:70`, `("move", 4, 216, 50)` → `("move", 4, 226, 50)` (ends at
270, well clear of the corner).

**t3. Quayholt's queue screen haloes the wall above it.** `aw_quayholt_queue1` (#4) at intensity 0.35 leaves a pale
smudge on the wall over its top edge in the lit shot (`backwalls_game_4x.png`, third strip); the info screen at 0.25
does not. *Fix:* `training_room_lighting.json:32`, intensity 0.35 → 0.25, then `apply_training_room.py --refresh`.

## Checked and fine

- **Kiosk.** Same slot (238,140) in all four, the only lit screen on the floor, and in every dark shot the first thing
  the eye finds. Lit, it is a tall white stand on the right of the host with free floor on three sides; nothing on
  the floor within 32px of its top-left.
- **Host.** Stands under the plate in all four, head clear of the skirting, feet about 48% of the way down from the
  back wall, plate centre (x 178) over the host (x 176). From the spawn (6, 6.2) the host is straight ahead and the
  kiosk ahead-right, both on screen at once.
- **Layout.** The shared skeleton holds: training table and two chair rows lower left, host under the plate, kiosk
  right, a refreshment or client corner lower right, one floor item on the left at the host's depth (flip chart,
  cones, plant, fig). Props are square to the walls; the angled ones are the kiosk screen, the plant or fig and the
  table-end chair.
- **Props by company.** Brightwell: oat box, range poster, flip chart, coffee and water. Tarrowby: slate stacking
  chairs, cones, hard hat, clipboard, notice and rota boards, route map, hi-vis, vending. Quayholt: charcoal chairs,
  queue screen, info screen, switched-off spare desk with a headset, binders, LOCK poster. Merrin & Sallow: plan chest,
  print, crit table with lamp and drawings, studio chairs, sofa, concrete. Each reads as its business; none carries lab
  or mission branding.
- **Lighting.** Day office, `mode` on, no flicker or motion, right for a room the learner never leaves. Lit, all four
  look like their room, a little moodier, not grey; the vignette runs about 0.80 at the walls to 0.94 mid-floor.
  Dark, the kiosk carries the room, with Quayholt's two screens, Tarrowby's vending front and Merrin's lamp as second
  sources and the alarm point dark. Merrin's window light (tile 7.55, 2.3) puts the kiosk inside a 1.00 pool, and the
  kiosk glow still stands out.
- **One set.** The four read as one course in four buildings: same shell, same kiosk and spot, same table, same SEE /
  SAY poster in the company colour at the same place on the west wall, same alarm point and extinguisher on the east.
  They differ where a learner would look: floor, chairs, plate, back wall and the corner props.
- **Shells.** No drift across the 38 (see What was run).

## POV backgrounds: can they start?

**Yes, once m1 has landed.** The layout the POV copies is settled: host, kiosk, table and spawn have not moved since
C1, and none of this cycle's findings moves anything a POV shows except the Merrin plate (m1) and, if taken, t2
(Brightwell's chart 10px right). Neither needs another review cycle; check m1 at 8x and re-run `pov_prep.py`.

From the player's position (`pov_strips.png`):

- **The back wall reads well in all four.** Brightwell: window, range, plate, bar chart. Tarrowby: notice board,
  rota, plate, route map, hi-vis. Quayholt: window, info screen, plate, queue screen. Merrin & Sallow: plan chest,
  print, plate, window. Each is four or five items with the plate in the middle.
- **The plate sits in the band that carries the picture.** The skill's uncovered band is about 33–57% of the width
  while the player speaks and 43–67% while the host speaks: room x 106–182 and 138–214. The plate (x 146–210) is in
  both, so each background will show its company name between the two portraits.
- **Around the host:** a left floor item (flip chart, cones, plant, fig) and the kiosk on the right. The kiosk stands
  in front of a back-wall item in every room (Brightwell's chart, Tarrowby's route map, Quayholt's queue screen,
  Merrin's window), so each concept must draw the kiosk about 1.3 m out from the wall, in front of that item. The
  `pov_prep.py` inventory already lists it as "second row".
- **Merrin's fig** is now mid-left, about 1.9 m out, nearer the camera than the host; Brightwell's flip chart and
  Quayholt's plant stand at the host's depth. That is fine, but the prompt should place it, not leave Gemini to guess.
- **Mood lines for the prompts** are in `training_room_lighting.json` (warm west sun; grey rooflights; screen-lit
  corporate; warm studio with an east window and a lamp).
- These are four rooms of one new setting, so per the skill the first concept needs the user's sign-off before the
  other three are made.

**Can the rooms stage close?** Yes, under the stop rule, once m1 is fixed: nothing above minor, m2 is cosmetic and the
trivials are cosmetic.

## Outside this stage (not graded)

- Host sprites are still placeholders, and two jar with their room: Merrin's Thandiwe Moyo wears a lab coat
  (`female_scientist_v2`) in a design studio, and Quayholt's Darren Price wears hi-vis and a cap (`male_telecom_v2`)
  in an insurer's office. The chat background excludes the NPC, so this doesn't block the POV, but the character stage
  should land before final chat previews (`pov_chat_preview.py`).
- No `chatBackground` yet; due at the POV stage (`training_room.py` `ROOMS[*]['chatBackground']`).

## Assumptions

- Assumption: C2's `game_*` shots were taken after the C2 fixes (fix commit 17:33, in-game commit 17:46, and the
  shots show the moved range poster), but I re-shot all four rather than rely on them.
- Assumption: the uncommitted one-line edit to the E3 defend shell belongs to another session and leaves the room
  fields alone (the drift check agrees), so I used that shell for Quayholt as C2 did.
- Assumption: m1 is graded minor, like C2's W, rather than cosmetic, because it is the company name the course asks
  learners to read and the POV will copy it.
- Assumption: m2's floor-tint fix follows the lighting skill's known-limit note and `lighting.js`; I have not run it.
- Assumption: walk-and-tap was not repeated, because C2 ran it on these maps and nothing near the kiosk or host has
  changed since.
- Assumption: Tarrowby's right-hand back wall (route map and hi-vis 6px apart) reads as a busy depot wall and was not
  raised.
