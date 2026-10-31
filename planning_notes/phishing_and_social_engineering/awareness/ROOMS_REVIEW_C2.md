# Awareness training rooms: review, cycle 2

Reviewer: fresh Opus, read-only, 2026-10-27. Skills: `mission-room-dressing` and `mission-room-lighting`, against
TRAINING_ROOM_PLAN.md, BRAND_SET.md and the method of ROOMS_REVIEW_C1.md. C1's fixes landed in 4501b7c26.

Scope: `room_aw_brightwell`, `room_aw_tarrowby`, `room_aw_quayholt`, `room_aw_merrin_sallow` as used by the 38
awareness shells.

| Room | Shells (company from `social.awarenessEpisode.company`) |
|---|---|
| `room_aw_brightwell` | E1 and E7 (full and defend), finance pre/post (8) |
| `room_aw_tarrowby` | E2, E6, HR and mobile pre/post (12) |
| `room_aw_quayholt` | E3, E5, general and helpdesk pre/post (12) |
| `room_aw_merrin_sallow` | E4, executive pre/post (6) |

Where fixes go: map changes in `scripts/room_gen/build_aw_rooms.py` (then run it and `--check`), art in
`make_aw_props.py` / `make_aw_tileset.py`, positions in `training_room.py`, light in `training_room_lighting.json`, then
`apply_training_room.py --refresh`. Never a shell by hand.

## What was run

- `build_aw_rooms.py --check`: all eight files `same`. The maps on disk are exactly what the script builds, so C1's
  m6 holds and every fix below is a script edit.
- `check_room_walls.py 'room_aw_*'`: floor at 64 on all four.
- `generate_rooms.py --check` on the four: OK (22–26 objects). Warnings are the expected kinds: bottom two rows (no
  room to the south), N-door corners (no doors), the extinguisher on the east strip, one floor plant in Quayholt.
- `slot_audit.py --notes --verbose` on the four defend shells and `awareness_e7_voice_ceo`: kiosk `ok` on its slot at
  238,140; 0 problems, 0 notes prompts.
- A Python check over all 38 shells against `training_room.py`: every shell has the right map type for its company,
  scenario and room `lighting` equal to `training_room_lighting.json`, `startPosition` (6, 6.2), host at (5.5, 3.8),
  one kiosk with no `position`, no `chatBackground`, and no other room objects. No drift.
- `lighting_lookup.rb room_aw_quayholt`: all 12 Quayholt shells carry the same block; the map's light sources are
  `fire_alarm_point1` (switched off) and `info_screen1` (turned down); `aw_pc_off1` matches no emitter, as intended.
- `render_room_preview.py 'room_aw_*' --sheet --grid --scale 2`, plus a 6x sheet of the logo plates, posters and the
  new C1 props built from the PNGs.
- **Not run: the in-game lit and dark tours and the walk-and-tap.** `tools/playtest/lighting-tour.sh` fails at
  `new-game.rb` because `bin/rails` cannot boot: another session is midway through a rebase of `main` and
  `lib/break_escape.rb` (also `game-menu.js`, `success-screen.js`) holds conflict markers. The coordinator asked for
  no live work until that is resolved. The "In game" section below lists what is still owed; findings that depend on
  it are marked *(map only)*.

## Screenshots

`planning_notes/phishing_and_social_engineering/awareness/playtests/ROOMS_C2_screenshots/`:

| File | What |
|---|---|
| `maps_contact_sheet.png`, `map_<room>.png` | map renders, 32px grid, 2x |
| `signs_6x.png` | the four logo plates, range poster, oat box, queue screen, posters, hard hat, PC (off), studio and slate chairs, folder, clipboard, info screen, at 6x (viewing only) |
| `zoom_merrin_fig.png` | Merrin's fig standing alone in open floor (m2) |

## C1 findings: are they closed?

| C1 | Status | Evidence |
|---|---|---|
| M1 coffee tray is an HP consumable | **closed** | `mugs_tray1` gone from all four maps (`build_aw_rooms.py` `COMPANY_OPS`: oat box, hard hat, binders, deleted in Merrin). No sprite in any map is in `DRINKABLE_CUPS` (`consumables.js:43-51`); Brightwell's `coffee_station1` is not. In-game tap check owed |
| M2 Quayholt logo reads "9UAYHOLT" | **closed** | `make_aw_props.py:40-44` gives `LOGO_FONT` its own 4-wide Q on a copy of `U.FONT`; reads QUAYHOLT and QUEUE (`signs_6x.png`). The same font's W now stands out instead (m1 below) |
| M3 rooms too alike | **mostly closed**, residue m3 | Floors now oatmeal / blue-grey vinyl / blue carpet / concrete (`make_aw_tileset.py:47-51`); Tarrowby has slate chairs, no flip chart, cones, hard hat, clipboard; Quayholt a plant, binders, queue screen; Merrin studio chairs, lamp, drawings, sofa. Brightwell and Quayholt still share the teal chairs and the window-and-radiator left wall |
| m1 Brightwell not a food company | **closed** | `aw_brightwell_oatbox1` on the table, `aw_brightwell_range1` (three product boxes under RANGE) on the back wall |
| m2 journal stack over the north edge | **closed** | Quayholt #25 and Merrin #25 at feet 246 (top 219, table top from 215); Brightwell uses `m09_folder1`, Tarrowby `aes_clipboard1` |
| m3 Quayholt decor looks usable | **closed (map)** | PC is `aw_pc_off1` (dark screen, no emitter), phone swapped for `office-misc-headphones`, the sign-in screen for `aw_quayholt_queue1`. Tap behaviour owed in game |
| m4 info screen glare | **fixed, unconfirmed** | `training_room_lighting.json:33` `info_screen` 0.25 / 24. Needs the lit tour |
| m5 Brightwell sun doesn't show | **fixed, unconfirmed** | `training_room_lighting.json:11` radius 110, intensity 0.5, y 2.6. Needs the lit tour beside Quayholt |
| m6 no build script | **closed** | `build_aw_rooms.py --check` reproduces all four maps byte for byte |
| t1 N and & glyphs | **closed** | 4-wide N, new & (`make_aw_props.py:42-43`): INSURANCE, MERRIN & read correctly |
| t2 host against the back wall | **closed (map)** | `HOST_POSITION` y 3.8 (`training_room.py:28`), in all 38 shells. Head-clear-of-skirting owed in game |
| t3 Merrin chairs roll | **closed** | `aw_studio_chair_s1/_n1` are plain sprites: no `chair-` prefix, no `-rotate`, not in `STATIC_SWIVEL_PROPS` (`rooms.js:2488-2492`) |
| t4 Tarrowby wall and corner | **closed** | rota board at x 100, hi-vis at 262, stacked chairs at 268 (off the east strip) |
| t5 info screen shows a calendar | **closed** | the queue face is drawn (`aw_quayholt_queue1`); the calendar screen stays as a second screen, which is fine |

## Counts

| Blocker | Major | Minor | Trivial |
|---|---|---|---|
| 0 | 0 | 4 | 4 |

These are from the map renders, the scripts and the shells. The in-game pass (below) may add to them.

## Findings

### Minor

**m1. The logo font's W reads as an H: "BRIGHTHELL", "TARROHBY", "SALLOH".**
The 3x5 W in `U.FONT` is `#.#/#.#/###/###/#.#`, an H with a thick bar (`signs_6x.png`; pixel dump of
`aw_logo_brightwell1.png` rows 3–7). Three of the four plates carry a W, and the plate hangs over the host in every
session. It is the same problem as C1's M2 (the course teaches reading a company name letter by letter, and
Brightwell's look-alike is `brightwel1foods.example`). Graded minor rather than major because a W misread as H is less
definite than Q as 9, and context mostly carries it.
*Fix:* in `scripts/room_gen/make_aw_props.py:40-44`, add a 5-wide W to the `LOGO_FONT.update`, e.g.
`"W": ["#...#", "#...#", "#.#.#", "#.#.#", ".#.#."]`. The longest line, BRIGHTWELL, grows from x 17–55 to 17–57 and
still ends inside the rule (x 59). Optionally a 5-wide M for MERRIN (`#...#`, `##.##`, `#.#.#`, `#...#`, `#...#`).
Rerun the script, look at the four plates at 8x, then `build_aw_rooms.py --check` (the maps don't change).

**m2. Merrin's fig stands alone in the open floor.** `planter_fig1` (#31, x 96, feet 140, 32x61) is about 70px out
from the back wall with nothing near it (`zoom_merrin_fig.png`, `map_merrin_sallow.png`). It reads as a pot left in the
middle of the room, not a planted corner, and it will sit in the left of the POV strip as a stray object.
*Fix:* in `build_aw_rooms.py` `COMPANY_OPS["merrin_sallow"]`, change the `add` to the west wall below the report
poster, about x 34, feet 176 (x 34–66, y 115–176: clear of the poster at x 14–30, the plan chest and the north chair
tops at y 184). Or set it beside the plan chest at the back wall if the print (#3, x 96–136, y 20–46) is moved right.

**m3. Brightwell and Quayholt still share most of their furniture.** After C1's fixes the floors and table dressing
differ, but both keep the seminar's teal `hospital_chair_*` set (#5–#10, #12), the same window and radiator at x 36,
and near-white back walls (`maps_contact_sheet.png`, top left and top right). Tarrowby and Merrin now each have their
own chairs; these two are the pair a finance learner and a general learner could still mix up in the POV, where the
chairs and the window are what show besides the plate.
*Fix:* recolour one set, as M3 did for Tarrowby. In `make_aw_props.py` `dressing()`, add a loop like the slate one
(`recolour(src, dst, hue, sat_scale, val_scale)`, line 285) that makes `aw_chair_south_<c>1`, `aw_chair_north_<c>1`,
`aw_chair_w_<c>1`: charcoal or heather-purple for Quayholt, or Brightwell's brand green. Register them with
`register_object.py`, then add the seven `sprite` ops to that company in `build_aw_rooms.py`. Swapping Quayholt's
window (#2) for a second screen or a framed policy print would also help, but the chairs alone should do.

**m4. Tarrowby's daylight comes from a notice board.** *(map only)* `training_room_lighting.json:23` keeps the
seminar window's light at tile (1.75, 2.3), cool white, radius 72, 0.3. C1's fix replaced Tarrowby's window with
`notice_board1` ("an inside depot room", `build_aw_rooms.py` tarrowby ops), so the pool now falls under the notice
board from no source. The mood line says rooflights.
*Fix:* in `training_room_lighting.json` `tarrowby_logistics.room.lights`, move it to the middle of the floor as a
rooflight, about `{ "x": 4.5, "y": 5, "color": "#dfe8f4", "radius": 110, "intensity": 0.25 }`, or drop the entry and
let the `#bcc2cc` ambient carry the room. Then `apply_training_room.py --refresh` and the lit tour.

### Trivial

**t1. The second line of three plates is hard to read.** FOODS, LOGISTICS and INSURANCE are drawn in a pale tint of
the accent under a rule, while SALLOW is white (`signs_6x.png`). On purple, INSURANCE is the faintest. In
`make_aw_props.py` `logo()` (line 146), draw the second line in `WHITE` or a lighter `mix()`, as Merrin's.

**t2. Tarrowby's notice board and hi-vis hooks touch the corner lines.** `notice_board1` (#2, x 30) and
`aes_hivis_hook1` (#30, x 262–292) meet the side-wall diagonals (crop of `map_tarrowby.png`). In
`build_aw_rooms.py` move #2 to x 34 and the hooks to x 258 (still clear of the map at 222–252).

**t3. Brightwell's back wall is full.** Five hangings from x 36 to 298 with 6–12px gaps; `aw_brightwell_range1`
(#31, x 268–298) almost reaches the east corner. In `build_aw_rooms.py` brightwell ops, delete the year planner (#3) and
move the range poster into its place (about x 96), so the back wall reads window, range, logo, bar chart.

**t4. Stale text around the rooms.** `public/break_escape/js/core/game.js:238` says Brightwell has a "charcoal carpet"
(now oatmeal); `training_room.py:17` still says the module is "not yet imported by the generators";
TRAINING_ROOM_PLAN §3.2–§3.5 and §10 list the pre-C1 dressing (flip charts, `conference_screen1`, `phone3`, grey
chairs); HANDOVER §1 puts E7 in Merrin & Sallow, but both E7 shells and BRAND_SET put it at Brightwell. Fix the two
comments when those files are next touched, and add a one-line "dressing now lives in `build_aw_rooms.py`" note to the
plan, so the POV stage reads the map, not the tables.

## Checked and fine (from the maps and shells)

- **Kiosk.** On its slot in all 38 shells. No floor object within 32px of its top-left (238,80); the nearest are wall
  hangings (Brightwell `whiteboard2` and range, Tarrowby map), about 60px away and not interactable. Free floor on
  three sides in every room. It remains the only lit screen on the floor, under its own `offsetY: -20` glow.
- **Host.** (5.5, 3.8) in every shell: 80x80 tap frame x 136–216, y 82–162. Nothing on the floor inside it in any
  room (Merrin's fig ends at x 128, Quayholt's plant at 76), and it stays 22px clear of the kiosk.
- **Spawn** (6, 6.2) is clear floor in all four, between host and kiosk.
- **Layout.** Each room keeps the shared skeleton: training table lower left, host under the plate, kiosk right,
  refreshments or a client corner lower right. Props are square to the walls; the angled ones are the kiosk screen,
  the fig or plant and Quayholt's east-end chair. Tarrowby's vending machine and Brightwell's coffee and water stand
  front-on against the south wall, which is this game's convention for that wall.
- **Company reads.** Brightwell now reads as a food firm (oat box, range poster, oatmeal carpet, green plate);
  Tarrowby as a depot (slate stacking chairs, cones, hard hat, clipboard, notice board, rota, route map, hi-vis,
  vending, vinyl); Quayholt as an insurer with a service desk (queue screen, switched-off spare position with a
  headset, LOCK poster, blue carpet); Merrin & Sallow as a studio (plan chest, print, crit table with lamp and
  drawings, studio chairs, sofa, concrete). None carries lab or mission branding.
- **Lighting config.** Day office, `mode` on, alarm glow off, kiosk glow on in all four; ambients above the
  `#a8b0c0` floor; Quayholt's screens turned down; Merrin's lamp at 0.5 / 40. Nothing flickers or uses motion,
  right for a room the learner never leaves.

## In game: owed when Rails boots again

Run C1's method on fresh games on keyless :3001 (one at a time, own game ids, stop each by id):

1. `lighting-tour.sh scenarios/<shell>/scenario.json.erb <out> --close-intro --check --player training_room:6,6:up`
   on the four defend shells. That gives the lit shot, `mode=on` and the ambient, plus a dark shot with the player
   (the rooms never go dark in play, so the dark shot only checks the kiosk glow carries the room).
2. Confirm C1 m4 (no white halo from `info_screen1` reaching the Quayholt plate) and m5 (a visible warm pool under
   Brightwell's window; Brightwell and Quayholt no longer look the same lit).
3. Merrin: the window light (tile 7.55, 2.3, cool white, radius 96, 0.4) is centred about 6px above the kiosk's
   top-left. Check the kiosk screen glow still stands out there; if it is washed out, move the light to x 7, y 2.6 or
   drop it to 0.3 in `training_room_lighting.json`.
4. Host at y 3.8: head clear of the skirting, under the plate, in all four.
5. Walk and tap: kiosk opens with one tap in reach and no menu; host opens `person-chat` with no menu; taps on the
   Quayholt PC, headset and screens, the oat box, the hard hat and the Merrin chairs do nothing, show no heal toast and
   push nothing.
6. Copy the shots into `ROOMS_C2_screenshots/` as `game_<co>.png`, `game_<co>_dark.png` and add a line per result
   here.

## POV backgrounds: can they start?

Yes, after this cycle's fixes and the in-game pass above. None of the findings moves the host, the kiosk, the table or
the spawn, so the layout the POV copies is settled. The fixes that touch what a POV shows are m1 and t1 (the plate
behind the host), m3 (Quayholt's chairs) and t2/t3 (back-wall hangings): land those first, re-render, and make the four
concepts from the result. If the in-game pass turns up nothing above minor, cycle 3 can be a short confirm round rather
than a full review.

## Outside this stage (not graded)

- Host sprites are still placeholders (`female_blowse_v2` for six hosts across all four companies, `female_scientist_v2`
  for Merrin's Thandiwe Moyo, `male_telecom_v2` in hi-vis for Quayholt's Darren Price). The character stage owns these.
- No `chatBackground` yet; due at the POV stage.

## Assumptions

- Assumption: the conflict in `lib/break_escape.rb` belongs to another session's rebase; I left it alone and did no
  live checks, as the coordinator asked.
- Assumption: the "dark" render C1 asked for is the tour's `--player` dark shot, since every room is `mode: on` and
  never goes dark in play.
- Assumption: m1 (W as H) is graded minor, one step below C1's M2, because context carries the word more readily.
- Assumption: Tarrowby's cones and Merrin having no refreshments were judged in keeping and not raised.

## In-game pass

Run 2026-10-27 on keyless :3001, one game at a time, after the awareness bridges had finished. Games: Brightwell
`awareness_e1_invoice_fraud_defend` 4485, Tarrowby `awareness_e2_cv_lures_defend` 4488, Quayholt
`awareness_e3_helpdesk_reset_defend` 4490, Merrin Sallow `awareness_e4_exec_whaling_defend` 4491. Tours by
`lighting-tour.sh <shell> <out> --close-intro --check --player training_room:6,6:up`, with the lit shot as
`training_room-a.png` and the dark shot as `training_room-player-dark.png`. Judgements on the shots are visual; no pixel
measurements were taken.

Shots: `playtests/ROOMS_C2_screenshots/game_{brightwell,tarrowby,quayholt,merrin_sallow}.png` (lit) and
`game_<co>_dark.png` (dark). The `--check` output read `mode=on` and a lit ambient in all four, with the player
shot showing the kiosk torch.

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | Lit and dark tours, four defend shells | PASS | Games 4485, 4488, 4490, 4491; eight shots copied |
| 2 | C1 m4: no white halo from `info_screen1` on the Quayholt plate | PASS | Lit shot shows no halo on the plate |
| 3 | C1 m5: warm pool under Brightwell's window; Brightwell and Quayholt no longer alike | PASS, with minor m5a | Pools and colours differ, Brightwell cream and Quayholt blue-purple. The pool under the window is faint, see m5a |
| 4 | Merrin window light does not wash out the kiosk glow | PASS | The kiosk glow is the first thing read in the dark shot. No change to `training_room_lighting.json` |
| 5 | Host at y 3.8: head clear of skirting, under the plate, in all four | PASS | Host stands clear of the skirting and below the plate in all four lit shots |
| 6a | Kiosk opens with one tap, no menu | PASS | Bridge: one `interact` on `training_kiosk` opened `episode-runner`; `interactionMenu` null, in all four games (2/2 assertions each) |
| 6b | Host opens `person-chat` with no menu | PASS | Bridge: one `interact` on the host opened `person-chat`; `interactionMenu` null, in all four games (2/2 assertions each) |
| 6c | Taps on Quayholt PC, headset and screens, oat box, hard hat, Merrin chairs do nothing | NOT RUN | These props are map art with no scenario or map object behind them, so there is no id to tap and no heal toast or push to check. "Does nothing" holds by construction, not by observation |
| 7 | Copy shots to `ROOMS_C2_screenshots/` as `game_<co>.png` and `game_<co>_dark.png` | PASS | Eight files |

### New findings

- **m5a (minor).** The warm pool under Brightwell's window is faint in the lit shot. It reads, but the window-side
  light could be a step warmer or wider to carry the difference from Quayholt by light as well as colour. Fix is in
  `training_room_lighting.json`, then `apply_training_room.py --refresh`.
- **t4 (trivial).** Merrin's desk lamp is the second-brightest point in the dark shot, close to the kiosk glow. The
  kiosk still reads first. Left as it is.

### Summary

Eight of nine rows PASS. Row 6c was not run in game (no tappable object). The walk-and-tap bridge scripts are in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw-checks2/tap/`, not committed.
