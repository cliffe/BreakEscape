# Seat box slice 0 baselines (2026-11-06)

Plan: `SEAT_BOX_PLAN.md` slice 0. Handover: `HANDOVER_SEATBOX_S0.md`. Both baselines are on today's
landing rule and legacy desk boxes, so slice 1 and later slices can diff against them.

Committed copies are in `tools/playtest/baselines/`:

| File | What |
|---|---|
| `seatbox-s0-stand.json` | Stand audit result (header says `commit a185ce899`, `seatBox` unset, `deskBoxes` map) |
| `seatbox-s0-stand-games.tsv` | Its 159 rows (name, game id, rooms, note); game ids are rows in the dev DB at 2026-11-06 |
| `seatbox-s0-walk.json` | Walk record, `--desk-boxes legacy`, taken at `00f04d534` (written into the file) |
| `seatbox-s0-walk-games.tsv` | Its four rows |

## Stand audit

Started 17:10 on 2026-11-06. The header names `a185ce899`, the HEAD when it started; the engine code
under test is `2099537a0` (the `buildWorldGrid` split), and only tools changed after that. The scale-fix commits that landed during the run changed maps, not
engine code (not checked file by file).

Totals (the run's own summary lines):

- 158 of 159 games finished. `timed_messages_example` timed out (60 s `waitForFunction`) and has no row.
- 700 chairs audited, 25 skipped (an NPC's feet within 24 px of the castor), in 80 missions that have
  swivel chairs (the other 78 rows have none).
- 1400 stands (voluntary Space, Space and forced `standUp()` per chair): 1400 landed, **0 in a body,
  224 across a desk**, 0 refused, 0 could not sit.
- Every stand reports `via: legacy-compass`. The `legacy-fallback` and `legacy-none` branches never
  ran. The across-desk count is 112 chairs, and voluntary and forced agree on each (112 + 112).
- 63 of the 80 missions with chairs have at least one across-desk chair.

### By chair type (chairs, not stands)

| Texture | Chairs | Across a desk | Facing of those |
|---|---|---|---|
| `chair-white-2-rotate6` | 102 | 98 | all north-east |
| `chair-exec-rotate1` | 13 | 13 | south |
| `chair-grey-1-rotate1` | 12 | 1 | south |
| every other texture (white-1 rotate2..8, white-2 rotate1/3/5/8, darkgray-1, grey-4, exec rotate2/5) | 573 | 0 | |

So the bug is two chair sprites. `chair-white-2-rotate6` (north-east facing, the forward step crosses
the desk) is 88 per cent of it; `chair-exec-rotate1` is every exec chair, in the CEO room and its
copies. `chair-grey-1-rotate1` has one case.

### Top offenders by mission (chairs across a desk of chairs audited)

| Mission | Bad | Audited |
|---|---|---|
| lockpick_gauntlet | 5 | 34 |
| biometric_breach | 4 | 19 |
| ceo_exfil | 4 | 19 |
| crypto1_captain_meow | 4 | 19 |
| npc-hub-demo-ghost-protocol | 4 | 24 |
| test_complex_multidirection | 4 | 19 |
| test_needs_leash | 4 | 22 |
| crypto2_rsa_asymmetric | 3 | 13 |
| test-rfid-multiprotocol | 3 | 18 |
| test_unlock_silence | 3 | 18 |
| test_vertical_layout | 3 | 13 |
| crypto3_aes_symmetric, crypto4_encoding_encryption, cybok_heist, lab_encoding_encryption | 2 | 7, 7, 7, 11 |

The CEO room (`ceo`) is 2 of 2 in every mission that uses it. The office1 to office3 rooms in the
biometric_breach family are 1 of 6 each. `test_desk_seating` (game 892): 6 chairs, 0 bad.

Skipped chairs by mission (top): test-npc-patrol 3, test_seating 3, test_needs_leash 2,
test_needs_sims 2, test-npc-face-player 2 (seated NPCs).

Re-run (needs the `stand-games.tsv` rows to exist as games on the keyless :3001 server):

    node tools/playtest/stand-audit.mjs tools/playtest/baselines/seatbox-s0-stand-games.tsv --out out.json

About 30 s per game with chairs, 70 minutes for the lot. Slice 1 runs it under `__seatBox = false`
(compare to this file) and with the new order. Fail on any new-order in-a-body or across-a-desk.

## Walk audit

Taken at `00f04d534`, `--desk-boxes legacy`, run twice, diffed with `--all-geometry`:
**0 fails, 0 coverage problems, 34 rooms, 0 pockets, 0 blocked or opened cells between the two runs, 6
listed** (check (d), a swivel's body overlapping a desk, all "already in before" so they are the
baseline). Gates 1 (closed) in `lab_physical_pentest`, none elsewhere.

| Game | Row | Rooms | Sample map |
|---|---|---|---|
| 892 | test_desk_seating | 1 | `room_test_desk_seating` |
| 785 | lab_physical_pentest | 9 | `open_plan` = `room_lw_accounts` |
| 790 | lab_tesseract_trials | 11 | `staff_office` = `room_uni_staff` |
| 794 | m01_first_contact | 13 | `main_office_area` = `room_office`, `break_room` = `room_break` |

The six listed (d) overlaps: `library_book_trolley1_23` against `library_study_carrels1_14`
(lab_tesseract_trials/library); conference_room chairs `chair-white-1-rotate7_152` and
`rotate6_154` against `desk1_91` and `desk1_94`; main_office_area chairs `chair-white-2-rotate1_155`,
`rotate3_157` and `rotate6_158` against `desk1_94`, `desk1_93` and `desk1_92` (all m01).

The plan's five sample rooms: `room_office`, `room_uni_staff` and `room_break` are covered.
`room_office5` is used by no scenario at HEAD. `room_IT` is not used under that spelling; m01
uses `room_it` (`it_room`), which is in the record, but the plan's room is not sampled as such.

Re-run (twice, then diff; expect nothing between runs, and compare a later run to the committed file):

    node tools/playtest/room-snapshot.mjs tools/playtest/baselines/seatbox-s0-walk-games.tsv snap.json --walk walk.json --desk-boxes legacy
    node tools/playtest/walk-audit-diff.mjs tools/playtest/baselines/seatbox-s0-walk.json walk.json --all-geometry

About 2.5 minutes per run. Maps changed since 00f04d534 (the scale-fix agent) will show as geometry
differences, so rebaseline from the same commit as the code under test when comparing.

## Not built

The walk record's 2x screenshots with the cells drawn (check (g)) were never built. The diff tool lists
pocket boxes in world pixels instead.

## Slice 1 results (2026-11-06)

Engine commit `4130d7555` (player half of the seat box stand-up order). Committed copy of the new-order
stand audit: `tools/playtest/baselines/seatbox-s1-stand.json` (header says `commit eebd0ed77`, `seatBox`
unset, `deskBoxes` map; the engine under test is `4130d7555` onward, and nothing under `js/` changed
afterwards that touches seating).

**Stand audit, new order**, same 159 rows as slice 0: 158 of 159 games finished (`timed_messages_example`
timed out again, as in the baseline). 700 chairs audited, 25 skipped, 1400 stands: 1400 landed, **0 in a
body, 0 across a desk, 0 refused**, 0 could not sit. Every stand reports `via: compass`. The slice 0
baseline had 224 across a desk. Refused-chair list for the user: **empty** (0 refused).

**Stand audit, legacy switch** (`--seat-box false`, top-offender rows only: `biometric_breach`,
`ceo_exfil`, `lockpick_gauntlet`, `test_desk_seating`): 78 chairs, 156 stands, 156 landed, 0 in a body,
**26 across a desk** (biometric_breach 8, ceo_exfil 8, lockpick_gauntlet 10, test_desk_seating 0; each
chair counts twice, voluntary and forced, so 4 + 4 + 5 chairs, as in the slice 0 table). Every stand
`via: legacy-compass`. The old code still reproduces its landings under the switch.

**Walk audit** against `seatbox-s0-walk.json` (`--desk-boxes legacy`, `--all-geometry`): 34 rooms, 0 fails,
0 coverage problems, **0 differences** (blocked +0, opened +0 and reachable cells equal in every room),
the same 6 listed (d) overlaps as the baseline. The map files of the four rows are unchanged since
`00f04d534`; the later commits touch only other scenarios and the lab's ink and scenario text (the games
are stored rows, so the audit read the baseline's maps).

**Lab regression**: `lab_physical_pentest` game 909, replay of 41 commands from game 685 with slice 1's
code. `verify-run.rb`: 9 tasks completed, **score 100**. No "No path found" or "Failed to escape wall".
`drain` showed 41 page errors, all "Failed to load resource ... 503", which are the keyless server's
`/tts` refusals (`games_controller.rb:691`), not seating. The lab scenario was being edited by another
agent during the run; the replay was unaffected.

