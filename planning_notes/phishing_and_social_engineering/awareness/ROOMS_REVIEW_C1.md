# Awareness training rooms: review, cycle 1

Reviewer: fresh Opus, read-only, 2026-10-23. Skills: `mission-room-dressing` and `mission-room-lighting`
(`.claude/skills/`), against POLISH_PLAN stage 5 and TRAINING_ROOM_PLAN.md.

**Kind of game.** The awareness product: short attack-then-defend episodes for non-technical staff, on the neutral
corporate skin. Each room should read as one ordinary company's staff training room, with the kiosk as the obvious
thing to use. It should not look like a spy set or the student lab.

**Scope.** Four maps from ccc10908 (`room_aw_brightwell`, `room_aw_tarrowby`, `room_aw_quayholt`,
`room_aw_merrin_sallow`), their sheets and signs (`make_aw_tileset.py`, `make_aw_props.py`), and the wiring into the
38 shells from 5a5a87329 (`training_room.py`, `training_room_lighting.json`, `apply_training_room.py`, the four
`gen_*_shells.py`).

| Room | Company (BRAND_SET.md §2) | Shells |
|---|---|---|
| `room_aw_brightwell` | Brightwell Foods, East Midlands food manufacturer, finance team | E1, E7 (attack and defend), finance pre/post (8) |
| `room_aw_tarrowby` | Tarrowby Logistics, West Yorkshire haulier and warehouse | E2, E6, HR and mobile pre/post (12) |
| `room_aw_quayholt` | Quayholt Insurance, Bristol insurer with its own IT service desk and SSO | E3, E5, general and helpdesk pre/post (12) |
| `room_aw_merrin_sallow` | Merrin & Sallow Architects, London practice, partners and PA | E4, executive pre/post (6) |

**Where fixes go.** Never hand-edit a shell. Shell fields come from `training_room.py` and
`training_room_lighting.json`: regenerate with the four `gen_*_shells.py`, then re-run `apply_training_room.py` for the
7 full shells. The sheets and signs come from `make_aw_tileset.py` and `make_aw_props.py`. The maps are hand rooms
edited with `room_edit.py`, and m6 below proposes a build script so that map changes go through a script too.

## Counts

| Blocker | Major | Minor | Trivial |
|---|---|---|---|
| 0 | 3 | 6 | 5 |

## What was run

- `render_room_preview.py 'room_aw_*' --sheet --grid --scale 2`: one map render per room plus a contact sheet.
- `generate_rooms.py --check` on all four: OK, 23–26 objects each. The warnings are the expected kind (bottom two rows,
  N-door corners on a room with no doors, the extinguisher on the east wall strip).
- `check_room_walls.py 'room_aw_*'`: the floor starts at 64 on all four.
- `slot_audit.py --notes --verbose` on the four defend shells and `awareness_e7_voice_ceo`: the kiosk lands `ok` on its
  map slot at 238,140. 0 problems, 0 notes prompts.
- `lighting_lookup.rb room_aw_quayholt`: all 12 Quayholt shells carry the same block, and the kiosk is covered by the
  room emitter.
- `lighting-tour.sh <defend shell> --close-intro --check` for all four companies: lit, `mode=on`, ambient as designed
  (`#c4cad8` for Brightwell and Quayholt, `#bcc2cc` for Tarrowby, `#cac4bc` for Merrin), light map redrawing.
- **Live walk-and-tap in three fresh games** on keyless :3001 (games 4155 Quayholt E3 defend, 4156 Tarrowby E2
  defend, 4157 Merrin E4 defend), headless, each stopped afterwards by its own id:
  - spawn at (192,198) in all three;
  - host: `moveToNear` then a tap opens `person-chat` directly, with no pick-one menu (Quayholt and Tarrowby);
  - kiosk: a tap in reach opens `EpisodeRunnerMinigame` directly, with no menu (Quayholt and Tarrowby). From the spawn, a
    tap on the kiosk screen or base walks the player to the kiosk's west side (230,100) and shows the label. A second
    tap opens it. That is the engine's tap model everywhere, not something these rooms cause (see "Outside this stage");
  - taps on the decor PC, phone, info screen and sign-in screen (Quayholt): the player walks there and nothing else
    happens (m3);
  - the coffee tray is the only other interactable in every room (M1);
  - Merrin's chairs are swivel props and can be pushed (t3).

## Screenshots

All under `planning_notes/phishing_and_social_engineering/awareness/playtests/ROOMS_C1_screenshots/`:

| File | What |
|---|---|
| `maps_contact_sheet.png`, `map_<room>.png` | map renders, 32px grid, 2x |
| `game_brightwell.png`, `game_tarrowby.png`, `game_quayholt.png`, `game_merrin.png` | in game, lit, host and player |
| `game_backwalls.png` | the four back walls side by side, in game |
| `signs_6x.png` | logo plates, posters, screens and kiosk at 6x (viewing only) |
| `zoom_table_desk.png` | Merrin's table (lamp glow, journal stack over the chair) and the Quayholt desk |
| `walk_tarrowby_kiosk_firsttap.png` | after a tap on the kiosk from the spawn: walked, label shown |
| `walk_quayholt_kiosk_open.png` | the kiosk opened by one tap in reach |
| `walk_merrin_chairs_pushed.png` | Merrin's north-row chairs after the player walked through them |

## Findings

### Major

**M1. In all four rooms the tray of coffee is an HP consumable, which belongs to the spy game.**
`mugs_tray1` (#24, `table_items`, x 114, feet 234) is in `DRINKABLE_CUPS`
(`public/break_escape/js/systems/consumables.js:49`), so `rooms.js:2718-2732` makes it interactable decor. Walking past
the table shows the label "Tray of coffee, still warm. Drink it to get some energy back." Tapping it gives the toast
"You're not hurt. Keep the tray of coffee for later." (seen in games 4155 and 4157). It is the only interactable in the
room apart from the host and the kiosk, it sits on the training table, and it talks about health in a product for office
staff. Tapping a Merrin chair near it also opened the tray.
*Fix (maps):* swap #24 on all four maps for a non-drinkable table prop that suits the company:
`room_edit.py room_aw_<co> sprite 24 <name>`, or better the build script in m6. Suggested props:
`office-misc-box1` for Brightwell (a stand-in for the oat-bar box, see m1), `aes_clipboard1` for Tarrowby, `binders1`
for Quayholt and `m09_folder1` for Merrin, checking each name for leftover mission text at 8x. Keep the coffee in
Brightwell's `coffee_station1`, which is not a cup.
*Alternative (shells):* a company-keyed flavour object in `training_room.py` that claims `mugs_tray1` with
`healAmount: 0`, `takeable: false` and a neutral `observations` line. That needs a new field in `room_fields()`, plus
the generators and `apply_training_room.py`. The map swap is simpler and also keeps the label quiet.

**M2. The Quayholt logo plate reads "9UAYHOLT".**
`aw_logo_quayholt1.png` (`make_aw_props.py`) uses the 3x5 font's Q (`###/#.#/#.#/###/..#`), which is a 9. It is
legible at game scale (`game_backwalls.png`, `signs_6x.png`). Quayholt's look-alikes include `quayho1t.example`
(BRAND_SET.md §2), so the company's own sign looking mis-spelt works against the habit E3 and E5 teach: read the name
carefully.
*Fix:* in `make_aw_props.py`, give the logo a Q that reads as a Q, then rerun the script. A local override like the
`&` will do, for example 4 px wide `.##.`, `#..#`, `#..#`, `#.##`, `.###`, or a round 3x5 Q whose tail breaks out at
the bottom right. Assign it to a copy of the font, not via `setdefault` on the shared `U.FONT`, so other props are
unchanged. Check the result at 8x beside the other plates.

**M3. The rooms are too alike: Brightwell and Quayholt read as one room with a different sign.**
- Floors: Brightwell's `CARPET_CHARCOAL` (70,86,118) and Quayholt's `CARPET_BLUE` (58,82,128) differ by about 12 per
  channel (`make_uni_tileset.py:102-103`), and both render as the same navy carpet tile (`maps_contact_sheet.png`).
- Walls: Tarrowby's back wall (218,220,222) and Quayholt's (234,238,242) are both pale cool grey, and Brightwell's
  (232,226,212) is close to Merrin's (216,206,190) (`make_aw_tileset.py` `SHEETS`).
- The lower-left half is identical in three rooms: the white seminar table, seven teal `hospital_chair_*`, the same
  three table items (pens, tray, journal stack) and the flip chart at x 44. Only the back wall, the floor and the
  bottom-right corner change.

A learner running a pre-check, an episode and a post-check moves between rooms, and the contact sheet is the evidence
that they won't tell them apart.
*Fix:*
- In `make_aw_tileset.py`, give Brightwell a warm floor, such as an oatmeal or green-grey carpet tile (a new
  `carpet_pixel_fn` with base around (120,112,92)). That ties in with the oat mark and the warm sun of the lighting
  mood, and sets it apart from Quayholt's blue. Warm Quayholt's or Tarrowby's wall slightly so the two greys differ.
- In the maps (m6's script), dress the table per company, not just the corner: Brightwell an oat-bar box and
  payment-run folders; Tarrowby a hard hat and clipboards on the table, with `notice_board1` (H&S notices) instead of
  the flip chart; Quayholt `projector_screen1` on the back wall or a headset on the table instead of the flip chart.
- Try different seating in at least one more room: Tarrowby with plain stacking chairs if a straight-on sprite
  exists, otherwise a different chair colour.
- Keep the shared skeleton (host spot, kiosk slot, spawn, keep-clear boxes), so `training_room.py` is unchanged.

### Minor

**m1. Brightwell doesn't read as a food company.** Apart from the oat mark on the logo plate, the room is a generic
finance room: year planner, bar chart, coffee and water. TRAINING_ROOM_PLAN §3.2 lists the oat-bar box as a cycle
candidate, and it was not drawn (§10).
*Fix:* draw `aw_brightwell_oatbox1` (about 12x14, PIL, native size) in `make_aw_props.py`, register it with
`register_object.py`, and put it on the training table. It can replace the tray (M1). Optionally add a framed
product-range poster in place of `whiteboard2`, or beside it.

**m2. The journal stack hangs over the table's north edge and hides the middle north chair, in all four rooms.**
`journal_stack1` (#25) is at x 86, feet 232, 26x27, so its top is y 205. The table top starts at y 215, and chair #7
covers x 92–108, y 182–214. In game the stack covers the chair's back (`zoom_table_desk.png`, `game_*.png`).
*Fix:* move #25 to feet about 252 (the middle of the table top), or swap it for a flatter item such as `m09_folder1`
or handouts.

**m3. Quayholt has decor that looks usable and does nothing.** In the room for E3 (a phone-based helpdesk episode
with a phone contact) and E5 (fake sign-in pages):
- the spare service-desk position has a PC (`pc8` #31) and a desk phone (`phone3` #32);
- `conference_screen1` (#4) shows a sign-in page with a green button.

Tapping any of them walks the player over and nothing else happens (game 4155). In the rest of Break Escape, PCs and
phones are often things you use.
*Fix:* either drop `phone3` from the map, or give the three a short line through company-keyed flavour objects in
`training_room.py`: `takeable: false`, `as-type:` onto the sprite, `observations` such as "The spare service-desk
position. Today's session is on the kiosk." and `addToNotes: false`. Emit them in `room_fields()` (or a new
`flavour_objects(company)`), and extend `apply_training_room.py` to splice them into the 7 full shells. Check after
that a tap on the kiosk still has no rival within 32px.

**m4. Quayholt's info screen glares on the back wall.** `info_screen1` takes the default `EMITTERS` glow. In game it
leaves a white halo about 20px wide on the wall that reaches the edge of the logo plate (`game_backwalls.png`,
bottom left). TRAINING_ROOM_PLAN §5 said to turn it down if it glared.
*Fix:* add `"info_screen": { "intensity": 0.25, "radius": 24 }` to `quayholt_insurance.room.emitters` in
`training_room_lighting.json`, then regenerate and re-apply.

**m5. Brightwell's "warm afternoon sun" doesn't show.** The window light (x 1.75, y 2.3, `#ffe2b0`, radius 80,
intensity 0.35) is too faint to see. Lit Brightwell and Quayholt look the same: both use the default ambient
(`game_brightwell.png`, `game_quayholt.png`).
*Fix:* in `training_room_lighting.json`, raise the Brightwell light to about radius 110 and intensity 0.5, and move it
to y 2.6 so the pool falls on the carpet under the window. Or give Brightwell a slightly warm ambient that stays above
the `#a8b0c0` floor, such as `#cfc8bc`. Re-tour and compare with Quayholt.

**m6. No script builds the maps.** The four maps were made by copying `room_uni_seminar` and applying the ops in
TRAINING_ROOM_PLAN §3.1–§3.5 by hand. None of `scripts/room_gen/*` or `scripts/generate_rooms.py` builds them, so
cycle fixes such as M1, M3, m1 and m2 would be more hand edits that nobody can replay or review as a diff.
*Fix:* add `scripts/room_gen/build_aw_rooms.py`, which copies the seminar map and then applies the shared skeleton and
each company's ops through `room_edit.Room` with one `save()`. Check it reproduces today's four maps byte for byte (or
with only the intended diffs), then make every later dressing change in that script.

### Trivial

**t1. Font glyphs.** The 3x5 `N` is drawn like a lower-case n, so the plates read "InSURANCE" and "MERRIn", and the `&`
added in `make_aw_props.py` reads close to an 8 at 1x. Optional: give the plates a 4-wide N and a clearer &, as in M2.

**t2. The host stands against the back wall.** At `HOST_POSITION` (5.5, 3.5) the sprite's head overlaps the skirting
(top about y 55, feet about y 107). That puts the host under the logo plate, which suits the POV, so leave it unless the
POV concept wants a step forward (about y 3.8). The keep-clear box allows that.

**t3. Merrin's chairs are swivel props.** `chair-white-1-rotate*` makes them pushable (`rooms.js:2492`). Walking along
the north side of the table shoved one under the journal stack (`walk_merrin_chairs_pushed.png`). This is ordinary
engine behaviour and harmless, since the kiosk approach stays clear. If it looks messy, use a non-rotating chair.

**t4. Tarrowby's back wall and corner.** `rota_board1` (30x21) leaves a wide gap to the left of the logo, while the map
and hi-vis hooks are bunched on the right. `chairs_stacked1` (x 272, 20 wide) touches the east wall strip. Fix in the
map: move the stacked chairs to x 266, and swap in a wider shift board or move the rota board to x 100.

**t5. Quayholt's `info_screen1` shows a calendar ("23"),** not a service-desk queue. It is fine as it is. A queue face
would fit the plan's intent, if one exists or is cheap to draw.

## Checked and fine

- Kiosk: it lands on its map slot in every shell and nothing is within 32px of its top-left. Its screen glow
  (`offsetY: -20`) makes it the most noticeable object in each room. One tap in reach opens it with no menu.
- Host: on clear floor under the logo plate, 62px from the kiosk's top-left, so tapping the kiosk never brings up the
  host and the host never brings up a menu.
- Spawn (192,198): host and kiosk are both in view on arrival, and the walk to either is short.
- Props are square to the walls. The angled items are the kiosk's screen, the east-end chair and the fig, within the
  "one or two a room" rule. Wall hangings stay inside the frame and above the skirting. The call point and
  extinguisher are paired on the east wall.
- Company reads: Tarrowby (hi-vis and hard hat, route map, rota, vending, vinyl), Quayholt (screens, LOCK poster,
  service-desk position) and Merrin & Sallow (plan chest, print, fig, sofa, banker's lamp, drawings) each read as their
  company. Brightwell is the weak one (m1).
- Brand colours: skirting, logo plate and "SEE / SAY" poster in each accent from BRAND_SET.md. `m09_county_map1` and
  `qdc_poster_secure1` carry no mission or other-brand text.
- Lighting: all four are lit day rooms (`mode=on`), the alarm glow is off, and the ambients are above the readability
  floor. Tarrowby's grey reads as a depot early shift. Merrin's warm ambient and lamp suit a studio.

## Outside this stage (not graded)

- **Host and player sprites** (character stage): Quayholt's Darren Price uses `male_telecom_v2` (hi-vis vest and cap,
  reads as security or an engineer). Thandiwe Moyo at Merrin & Sallow uses `female_scientist_v2` (a lab coat). The
  Brightwell and Tarrowby hosts share `female_blowse_v2`. The player is still the hooded figure (TRAINING_ROOM_PLAN
  §9.4).
- **Tap model** (engine): a tap on an interactable out of reach walks there and shows its label, and a second tap
  uses it. That is the same in every mission. These rooms keep the walk short.
- **No `chatBackground` yet**: due at the POV stage, after dressing and lighting close.

## Assumptions

- Assumption: the kind of game and each company's identity are taken from BRAND_SET.md and TRAINING_ROOM_PLAN.md, not
  from the episode texts.
- Assumption: the walk-and-tap ran headless and drove clicks through `__test.clickAt`. A human click on the same pixels
  should behave the same, but the first-tap observation rests on the harness.
- Assumption: M3 is graded major because the user asked for variety between the four rooms. If one room per learner is
  the usual case, it could drop to minor.
