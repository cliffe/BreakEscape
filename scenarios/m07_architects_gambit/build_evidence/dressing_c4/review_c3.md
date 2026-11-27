# m07 room dressing review, cycle 3 (read-only)

Sources: builders `scripts/generate_rooms.py` 4324-4570, generated `room_pnw_*.json`, in-game shots `build_evidence/dressing_c2/<room>-a.png` (game 2440), grid previews `build_evidence/dressing_c2/grid/`, sprite sheets in `assets/objects` and `assets/tables` (contact sheet in this folder, `sprites.png`), `slot_audit.py --verbose --notes` (0 problems; 2 notes prompts on Tomb Gamma, which is a takeable loose printout, so leaving it is correct), the scenario text (erb 1565-2133), and the depth rules in `rooms.js` (items: feet + 0.5, `rooms.js:2552-2555`; table items: table depth + 0.01·n, `rooms.js:2357-2364`).

Tap check: I read `taps.py` against `game.js:2100-2140`. The rule matches: bounds contain the tap, or within 32 px (`TAP_SLOP = TILE_SIZE`) of `obj.x,y`, which is the top-left for map objects (origin 0,0) and the centre for NPC sprites. Only `obj.interactable` objects count, so decor is ignored. Its output is unchanged from cycle 2: no centre tap gathers two things. Edge overlaps remain: ops map/video wall 21%, SCADA countdown/historian 28%, historian/projection 19%, projection/Mercer 11%, genhall ATS/log 9%.

## Cycle-2 findings: closed?

| id | status | evidence |
|---|---|---|
| M1 SCADA countdown behind Mercer | closed | countdown x 30-106; Mercer now covers only the decor SCADA CONTROL plate (`scada_control-a.png`) |
| M2 office desk as master position | closed | `pnw_master_desk1` charcoal, reads as a different desk from the supervisor's `desk1` |
| M3 Elena with nothing to work at | closed | `kvm_cart1` x 110-147, feet 200, beside her |
| m1 key/chair overlap, chair off dais | closed | desk feet 304, key top 260; chair E removed; supervisor chair static |
| m2 sheet "under the fob" but 55 px off | left, reason holds | key top-left 123,260 and sheet 178,270: putting them together means a two-item menu; the wording is a text change |
| **m3 signs of evacuation** | **not closed** | the mug and the headset are drawn behind their consoles (see m-A below) |
| m4 video wall too small | closed | x 114-273 |
| m5 SCADA chair in walk band | closed | removed |
| m6 historian/projection | partly, acceptable | edge-only 19%, centre clean |
| m7 monitor over mimic | left, acceptable | |
| m8 clip read as on the floor | closed | paper sits on rack 4's door (`server_room-a.png`) |
| m9 perforation under racks | closed | dotted row y 96-128, in front of the back row |
| m10 badge station | closed | `pnw_badge_printer1` |
| m11 bare west strip / repeated cooler | closed | waiting seats; drinks machine |
| m12 arch against wall | closed | arch on the queue line |
| m13 "N LOT" | closed | MUSTER / NORTH / LOT |
| m14 log/panel | closed | 0% (one pixel row) |
| m15 ATS cover | partly | a cover is there but reads as a kickplate under the cabinet (m-F) |
| m16 bench | closed | `aes_trestle2` |
| m17 Tomb Gamma placement | closed | wedged in the ladder, visible |
| m18 lifted trench plate | partly | the open slot reads as one more grille; no cables show (m-H) |
| m19 junction box | closed | air mover |

## Findings

### Major

**M-1. Server hall: the SCADA Backup Server is a three-quarter rack at the end of a row of front-on racks.**
`r.solid("servers4", 262.0, 168.0)` (`generate_rooms.py:4446`). `servers4` (26×47) shows its top face and right side. The five `server_rack1` (30×55, front-on) beside it end at x 262, and it is 4 px narrower and 8 px shorter than they are. In `server_room-a.png` the blue box at the east end of the middle row clearly turns towards the viewer. The skill's square-to-the-walls rule names racks specifically, and this is the scenario object the whole cascade runs on.
Fix: hand-draw a front-on 30×55 blue palette swap of `server_rack1` (blue frame, green/amber LEDs, keeps the BKP tag), register it as `pnw_backup_server1`, and set `"position": "as-type:pnw_backup_server"` on the SCADA Backup Server (erb ~1837). Place it at x 262, feet 170 in line with the row, and keep `pnw_backup_tag1` on it. This is a recolour, not a rescale, so it costs nothing. The kvm cart then becomes the room's only angled piece.

### Minor

**m-A. Ops floor: the "coffee still warm" mug and the dropped headset can't be seen (cycle-2 m3 not closed).**
`office-misc-cup` at x 250-261, feet 136 and `office-misc-headphones` at x 60-75, feet 134 are items-layer sprites with depth 136.5 and 134.5 (`generate_rooms.py:4396-4397`). `pnw_console_pos1` and console A have feet at 156 (depth 156.5), and their pixels at those spots are opaque (117/121 under the cup, 154/165 under the headset). The grid preview and `operations_floor-a.png` show neither. The Abandoned Operator Workstation's own observation (erb 1681) mentions the coffee.
Fix: headset: `r.on(consoleA, "office-misc-headphones", 0.30, 0.40)`, because console A is in the tables layer, so its table items draw on top. Mug: `pnw_console_pos1` must stay in `items` for `as-type`, so draw the mug into the `pnw_console_pos1` sprite in `make_pnw_props.py`, at the desk's right end next to the "3" tag. For more evacuation detail, add a second mug with `r.on` on back-row console D (a tables-layer console).

**m-B. Ops floor: the photocopier is three-quarter against the south wall, a third angled piece; the two angled chairs are the same sprite at the same angle.**
`photocopier1` (`generate_rooms.py:4415`) shows its left side and output tray. The room already has two `aes_office_chair1` at the same three-quarter angle (4395, 4411), which look copy-pasted. Also, the position-3 chair (x 236-269, y 138-192) overlaps the desk's front leg, so it reads as tucked in rather than "pushed back".
Fix: swap the photocopier for a front-on unit (a filing cabinet or `printer`-type front sprite, or a hand-drawn front-on copier). Mirror one chair (an exact pixel mirror saved as its own sprite, no resize). Drop the position-3 chair to feet about 204 so it clears the desk front.

**m-C. SCADA: the countdown's bottom line, "AWAITING HOST", sits right on the operator console's monitors.**
Countdown y 20-52 (`generate_rooms.py:4470`); console monitors start at y 51 (`pnw_console2` x 40-104, feet 100). In `grid/room_pnw_scada.png` the text baseline touches the bezels. Fix: feet 46 (top 14, still ≥ 12). That makes the countdown/historian edge overlap no worse.

**m-D. SCADA: Mercer is "at the master console" (erb 1893), but he stands 22 px east of the desk's end with nothing in front of him.**
Desk x 112-190; Mercer x 212-236. Moving the desk is constrained: 8 px east brings the projection's centre within 32 px of Mercer's centre (a centre-tap menu). Fix: decor only. Add a narrow charcoal desk return (a hand-drawn tables-layer piece about 18×39 in the master desk's palette) at x 192-210, feet 104. It closes the gap, so he stands at the end of the console, and decor adds no tap candidates. Optional.

**m-E. Generator hall: the GEN 1-3 plates read as labelling the battery racks.**
Plates at x 268/372/476, y 31-40 (`generate_rooms.py:4515-4516`) sit directly over `pnw_batteries1` racks, with the gensets 100 px further south in their boxes (`generator_room-a.png`). Fix: either stencil GEN 1/2/3 on the floor inside each hatched box in `make_pnw_tileset.py`, or keep the plates and redraw them as "GEN 1 START BATT" so the pairing is deliberate.

**m-F. Generator hall: ATS-1's cover reads as a kickplate under a closed cabinet.**
`pnw_ats_cover1` (26×9) at x 104-130, y 107-116 (`generate_rooms.py:4504`) lines up squarely under the ATS's feet (104) and has the same steel colour. The ATS sprite still shows a closed door with a keypad, so nothing says "cover off" (erb 2008). Fix: lean a taller cover (about 14×30, hand-drawn) against the wall inside the hatched box at x 156-170, feet 100, with the screws on the floor in front. That floor is empty and in front of no readable fixture.

**m-G. Checkpoint: the east strip and the east wall below the door are bare.**
x 232-288, y 176-244 between the drinks machine (feet 174) and the lockers (top about 244) is empty terrazzo, and the east wall carries nothing (`grid/room_pnw_checkpoint.png`). Hollis patrols x 96-224, so it is free. Fix: a side-wall item on the east wall at x 292-306 (a key safe or first-aid box), and a `coat_stand1` with a hi-vis vest left on it, or a pile of visitor lanyards on a stool. Either says that people left fast.

**m-H. Cable vault: the lifted trench plate shows a dark grille, not an open pit with cables.**
The pit at x 124-160, y 66-80 (`make_pnw_tileset.py`, vault sheet) is near-black with a dotted pattern, the same texture language as the chequer plates. The three cables don't read (crop `vault_pit.png` here). Fix: give the pit a lit lip on its south edge and draw the three cables as thick dark-red/black sheathed runs with highlights, one with a cut end towards Park.

**m-I. Server hall and generator hall carry no sign of the evacuation.**
Evacuation details are all in the checkpoint (muster board) and the ops floor (empty chairs). The server hall (`generate_rooms.py:4430-4454`) and the generator hall (4500-4537) are tidy. Fix, decor only and outside the lanes: server hall, one rack door hanging open in the back row (a hand-drawn variant of `server_rack1`) or a hi-vis vest on the relay desk; generator hall, a dropped ear-defender set and a clipboard on the trestle.

## Repeats and coherence

- Neighbouring rooms share no fixture sprite that reads as a copy. The checks: ops and server hall (consoles vs racks), server hall and SCADA (`pnw_console2` appears in SCADA and ops, which are not neighbours; the same vendor's console is plausible), genhall and vault (`aes_trestle2` X-frame vs `aes_trestle1` A-frame, `pnw_cable_trolley1` vs `aes_cable_drum1`, different enough).
- The building hangs together: each room has its own wall colour and accent line (green, teal, red for SCADA, yellow for the vault), the same fire point and extinguisher on the west wall, and signage plates from one family. The wordmark is at the entrance. It reads as one utility.
- No floating or clipping at game scale other than m-A (hidden) and the position-3 chair (m-B).
- Wall items, door lanes and covered rows: no regressions from cycle 2.

## Housekeeping (not counted)

- `pnw_ops_sign1` and `pnw_security_sign1` are preloaded in `game.js:1057,1062` but placed nowhere. Place one or drop the preload.
- The `room_pnw_ops` docstring still lists "an alarm panel and a clock" (`generate_rooms.py:4372-4373`); both are gone.

## Per-room verdict

| Room | Verdict | Open |
|---|---|---|
| security_checkpoint | done (polish optional) | m-G |
| operations_floor | needs a short cycle | m-A (cycle-2 fix that did not land), m-B |
| server_room | needs another cycle | M-1; m-I |
| scada_control | done (polish optional) | m-C, m-D |
| generator_room | done (polish optional) | m-E, m-F, m-I |
| cable_vault | done (polish optional) | m-H |

Counts: 0 blockers, 1 major, 9 minors.

## Assumptions

- Assumption: the cycle-2 shots and previews match the current builders (apart from the checkpoint mat), so I did not regenerate anything.
- Assumption: rating `servers4` a major rests on the user's square-to-the-walls rule naming racks; cycle 2 passed it.
- Assumption: Mercer's tile (7,3) is fixed by the story, so m-D only adds decor.
