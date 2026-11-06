# Handover: seated-scale fixes (2026-11-06)

Applies the fixes the user approved from `SEATED_SCALE_AUDIT.md` ("make all the recommended changes").
Scripts: `tools/seated_scale/` (`fix_sprites.py`, `fix_maps.py` with `maplib.py`, `audit_snapshot.py`).
Both fix scripts dry-run by default and are safe to re-run (they act only on original heights).

## Done

| Item | What changed | Commit |
|---|---|---|
| 7 waiting chairs | `seating.js` seat y 23 -> 19 (no test pinned 23); bin/test-js 399/399, rails 953 runs 0 failures | ed78e44c7 |
| 5, 6, 3 sprites | hospital chair family +4 rows (north, dup row 20) / +3 (south, dup row 27); `m10_steel_chair1` +5 (dup row 21); `hospital_desk1/2` -4 (rows 33-36), `exec_desk1` -4 (rows 31-34); `scripts/room_gen/catalog.json` heights | 607c80b3a |
| maps | hospital rooms 526e56493; awareness rooms 955d9ca83; m10 dfe4c022e; all other rooms f4ceaf3bb; test_desk_seating (item placement only) 00f04d534 |
| 9 | `docs/IDEAS_BACKLOG.md` "Rear-view monitor sprites" | with this note |

Map rules (`fix_maps.py`): shorter desks keep their floor line (placement height -4, y kept) and the
items on them move down 4; chairs keep their top (height and y +k); `smalldesk1` -> `desk3`,
`smalldesk2` -> `desk2` where a desk chair (static or swivel, not sofas) stands within 8 px / 16 px
(14 desks: 12 + 2); `bankers_lamp1` -> `office-misc-lamp4` everywhere, centre and base kept;
monitors/lamps moved to 3 rows behind the top's front edge, flat items moved only when more than
2 px past it (to 0). Embedded tileset `imageheight` and `tables.tsx`, `objects.tsx`,
`objects_hospital_extras.tsx` updated. `room_lw_accounts.json` got a new `office-misc-lamp4` tile
(id 673). 80 desk items moved in the map pool (plus 11 in the test room).

Snapshot (games from `ts-build/games_all.tsv`, scratchpad `scale-fix/`): before and after both
159/161 (probe_tailgate no game, timed_messages_example times out: known). Diff: 440 moves, 12 depth
flips, all expected: desk items backwards, shorter desks' tops 4 px lower, swapped desks and lamps,
lamp glows (`be_light_*`) following their lamps, and depth ties between items on one desk. Items
hanging past the front edge (`audit_snapshot.py`, lights excluded): 386 -> 94; all 94 left are
scenario-placed `pc11` at -2 rows on `desk1` in shared office rooms (1 px short of the -3 rule,
not in any map pool; left).

Live screenshots on :3001 (scratchpad `scale-fix/shots/`, driver `sitcase.sh`): test_desk_seating
game 893 (`1_test_desk1.png`), m02 game 795 it_department (`2_m02_it_hospital.png`), ca00 game 701
training room (`3_ca00_aw_chair.png`), m10 game 803 workshop (`4_m10_steel_chair.png`), m01 game 794
reception (`5_m01_waiting_chair.png`).

## Left

1. Lab regression (`scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md` recipe, Haiku,
   `verify-run.rb --tasks <id>` score 100). The lab's open_plan now shows lamp4 instead of the banker's lamp.
2. m02 critical-path spot check (hospital desks and chairs changed in five of its rooms).
3. Protected maps (not edited, user rule): `room_lw_office` pc8 id 8, pc6 id 20 (y -2), pc12 id 14
   (y -2) on `zds_desk1`; the five protected maps keep old tile `imageheight`s (Tiled metadata only).
   None of them places a changed desk or chair.

## Gotchas

- `room_office.tmj` exports to `room_office2.json`; twins are matched by name and each object is
  checked (same image, x, y) before a twin edit; none were skipped.
- Scenario `position` objects are not in maps: `audit_snapshot.py` on a snapshot is the check.
- The game draws objects from the top (y - height), so sprite height changes alone move the floor line.
