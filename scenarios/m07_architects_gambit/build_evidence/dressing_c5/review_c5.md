# m07 room dressing, cycle 5 review (closing check)

Read-only. Sources: skill section 2, ROOM_DRESSING.md cycles 1-4, `def room_pnw_*` (scripts/generate_rooms.py 4324-4590), make_pnw_tileset.py, make_pnw_props.py, review_c2.md, review_c3.md, the game-2441 shots, grid previews, first-room render, sprites, and the erb objects' text. I re-ran slot_audit and taps.py.

## Cycle 3 findings: are they closed?

| id | verdict | evidence |
|---|---|---|
| M-1 backup server | closed | `pnw_backup_server1` 30x55 front-on blue rack, same height and footprint as the row (server_room-a.png, grid). slot_audit: `servers -> pnw_backup_server1 at 256,170` |
| m-A mug/headset | closed | The mug is in `pnw_console_pos1` and shows beside the "3" tag. The headset sits on console A and draws on top (ops zoom) |
| m-B copier, chairs | closed | Binder shelves are front-on. The two pushed-back chairs are mirror images. The position-3 chair stands well back at feet 204 |
| m-C AWAITING HOST | closed | Text bottom ~y 41, monitor tops ~y 47. It reads clear (scada_control-a.png) |
| m-D Mercer at desk | closed | `pnw_desk_return1` carries the desk to x 208. Mercer stands at x 212 |
| m-E GEN plates | closed | Plates sit on each skid (generator_room-a.png) |
| m-F ATS cover | open in part | It no longer reads as a plinth, but it still doesn't read as leaning on the wall. See m-2 |
| m-G checkpoint east | closed | PPE cabinet on the east wall, coat stand by the lockers |
| m-H open trench | open in part | Lip and cut cable are drawn, but at game scale it still reads as a louvre grille. See m-3 |
| m-I evacuation signs | closed | Toolbox in the server aisle, hi-vis vest on its hook |

Reasons that still hold: m2 (handover sheet sits 55 px from the key: tap rule; the wording is not a dressing field), m6 and m7 (SCADA overlaps that only catch edge taps; the mimic still reads either side of the monitor), the Tomb Gamma notes prompt (a loose takeable printout counted by `recover_mole_evidence`), and the spare `pnw_ops_sign1`/`pnw_security_sign1`.

## Checks re-run

- slot_audit: all 21 objects on real fixtures, 0 problems. Two notes prompts, both on Tomb Gamma (reason above).
- taps.py: no centre tap gathers two things. The edge-only overlaps match the cycle-2 list exactly: ops map/video wall 21%, SCADA countdown/historian 28%, historian/projection 19%, projection/Mercer 11%, ATS/log 9%.
- Covered rows: servers feet <= 248, genhall west-half feet <= 230 (south props only at x >= 372), SCADA feet <= 112. Door lanes are clear in every room. Wall items sit inside the frames on every shot.
- Square to the walls: everything that lines a wall is front-on (racks, consoles, cabinets, shelves, lockers, counter, gensets, transformer, tank). Angled pieces: ops 2 (the two pushed-back chairs), servers 1 (KVM cart), vault 2-3 loose items (air mover, step ladder, cones). None of them line a wall.
- NPC boxes vs props: Elena has 2 px to the KVM cart, Mercer 4 px to the desk return, Park is clear of the cones and the trestle, and Hollis's patrol is clear.
- Fixture fit against the erb text: badge in the station's tray, ledger on the counter, muster board crossed off, key and sheet in the supervisor's tray, "coffee still warm" mug at position 3, survey note clipped to the rack door, log chained beside ATS-1, "cover off" prop, projection on the desk beside Mercer, Tomb Gamma by the splice housing, intercept on Park's trestle. All fit.

## Findings

No blockers or majors.

**m-1 (minor, operations floor): back-row chair F sits half behind the binder shelves and straddles the dais corner.**
`chair-grey-1` at x 220, feet 258 (generate_rooms.py:4410) covers x 220-244, y 220-258. `binder_shelves1` (48x60) at x 238, feet 300 covers x 238-286, y 240-300. They overlap at x 238-244, y 240-258, and the shelves draw over the chair's right arm and base. The base also hangs 4 px over the dais's east edge (x 224, y 248). Evidence: operations_floor-a.png around screen (830, 640); grid/room_pnw_ops.png at cells (14,15)/(15,15). Fix: remove the chair. The back row then has a single occupied seat, which also adds to the evacuation. Or move it to x 208 (it still clips the dais by 16 px), or tuck it under the console at feet 246.

**m-2 (minor, generator hall): ATS-1's cover stands free in the hatched box instead of leaning on the wall.**
`pnw_ats_cover1` (16x30) at x 156, feet 100 (generate_rooms.py:4510) has its top at y 70, which is 6 px of floor below the wall line at 64. The drawn lean is at most 2 px (make_pnw_props.py:503). At 2x it reads as a small grey bollard with a yellow sticker between the ATS and the panel (gen_ats_zoom / generator_room-a.png, screen ~(385, 350)). The text needs a cover that is visibly off ("Somebody has already had the cover off"). Fix: feet 100 → 90 so the top sits at y 60 on the skirting and the plate reads as propped against the wall. It stays clear of the ATS (x 100-136) and the panel (x 186). Optionally raise the lean to `//6`.

**m-3 (minor, cable vault): the open trench still reads as a vent grille.**
`paint_open_trench` (make_pnw_tileset.py:245-264) draws three straight, equal 2 px cables at even spacing across a 40 px pit. Their colours are close (58-92 grey on a 40 grey pit), and the "lit lip" is a single pixel row. At game scale that makes even horizontal slats: a louvre (vault_zoom; cable_vault-a.png, screen ~(665, 472)). The copper cut is 2 px of orange. This is the third pass on this detail (m18, m-H). Fix: break the regularity. Make one cable thicker with a red or orange HV sheath. Let the cables sag 1 px towards the middle and stop them short of the pit ends. Put a 2 px shadow band along the north edge and a 2 px lit lip on the south. Widen the cut gap to 4 px with copper on both faces. The cones and the lifted plate already explain it in context, so this stays minor.

**m-4 (minor, housekeeping): stale builder docstrings.**
- `room_pnw_servers` (generate_rooms.py ~4436) still lists the slot as `servers4 (SCADA Backup Server)`. It is now `pnw_backup_server1` by as-type.
- `room_pnw_genhall` (~4495-4500) says "GEN 1-3 plates over them" (they are on the skids since m-E) and "ATS-1's cover on the floor" (now leaning, m-F).

Fix: update the three phrases.

Withheld, not dressing: the pink `vm-launcher` and the oversized generic `key` sprite are shared engine object sprites. The east-wall drinks machine has no north-wall alternative (that spot is the E-door mouth and the CCTV wall). The position-3 chair's base tucks behind console F's monitors, which reads as rolled back into the next desk and suits "chair pushed back".

## Per-room verdict

| Room | Verdict |
|---|---|
| security_checkpoint | done |
| operations_floor | done (m-1 is optional polish) |
| server_room | done (m-4 docstring only) |
| scada_control | done |
| generator_room | done (m-2 optional) |
| cable_vault | done (m-3 optional) |

Counts: 0 blockers, 0 majors, 4 minors (3 visual, 1 housekeeping).

Verdict: room dressing can close. Nothing is above minor, and the four minors can be fixed during lighting or background work without another review cycle.
