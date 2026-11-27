# Seat box slice 0: handover (2026-11-06, 17:15)

**Slice 0 is done (2026-11-06, 19:10).** Both baselines are written up in `SEAT_BOX_BASELINES.md` and committed in `tools/playtest/baselines/`. The "In progress" and "Open" sections below are history.

Plan: `docs/achitechture/SEAT_BOX_PLAN.md` slice 0 (R3 revision). Scratch for this work:
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/seatbox-s0/` (called `S/` below).

## Done

| Commit | What |
|---|---|
| 10235d3bf | Golden test before the split: `test/js/npc-pathfinding-build-grid.test.mjs` + `test/js/fixtures/world-grid-fixture.mjs` (walls, static desk, disabled and movable bodies, opened east side door and north door). Golden taken from npc-pathfinding.js at f75515749 |
| 2099537a0 | The split: `buildWorldGrid({ exclude })` returns `{ grid, bounds }` (full world, live bodies, `exclude` matched by `body.gameObject`, carves and N/S corner blocks applied to its own grid); `carveSideDoorCorridor` / `applyNSDoorCornerBlocks` are pure exports; the `_carve…`/`_apply…` wrappers still write the live grid; `rebuildWorldGrid` assigns and sets up EasyStar. No new import |
| a185ce899 | Tools: `tools/playtest/swap-scenario-game.rb`, `tools/playtest/lib/all-rooms-loader.mjs`, `tools/playtest/lib/walk-record.mjs`, `tools/playtest/grid-hash.mjs`, `tools/playtest/walk-audit-diff.mjs`, `room-snapshot.mjs --walk/--desk-boxes`, `test/js/walk-audit.test.mjs` |
| 7a6a0d032 | `tools/playtest/stand-audit.mjs` |

Tests: `node test/js/npc-pathfinding-build-grid.test.mjs` 5/5, `node test/js/walk-audit.test.mjs` 12/12.
Full node suite after the split: 400/400 files (`S/testjs-split.out`). Rails suite (after the tools commit):
953 runs, 3359 assertions, 0 failures, 0 errors, 1 skip (`S/rails.out`).

**Grid hash (R3 M6), equal before and after the split:**

| Game | Before (10235d3bf) | After (2099537a0) |
|---|---|---|
| 890 m01_first_contact, side door break_room->main_office_area east opened | eda66fe5d8cac57c ×3 | eda66fe5d8cac57c ×3 |
| 891 test_seating | d38a210fb91dea3e ×3 | d38a210fb91dea3e ×3 |

Outputs `S/gridhash-before.json`, `S/gridhash-after.json`. Both rows had `openNSDoors` empty, so the N/S
corner-block path is covered by the unit golden only, not live.

`swap-scenario-game.rb test_seating test_desk_seating --unlock-all` made game **892** (Mission count 161
before and after).

## In progress

**Stand audit baseline**, started 17:10 in the background (PID 3163284, headless browser is its child;
stop by that PID only): `node tools/playtest/stand-audit.mjs S/stand-games.tsv --out S/stand-baseline.json`
→ log `S/stand-baseline.log`. Rows: the 158 missions whose rooms or scenario name a swivel chair
(`S/swivel_missions.py`), on the existing all-missions game rows from the table-surface snapshot
(`scratchpad/ts-build/games_all.tsv`, created 13:51; the other agent's room snapshot reads the same
rows), plus test_desk_seating game 892. Engine code under test = 2099537a0 (the log's header says
a185ce899, the HEAD when it started; only tools changed since). About 30 s per game with chairs, so
expect it to finish around 18:15. The JSON is rewritten after every game, so a partial file is usable.
First rows: biometric_breach 19 chairs, 8 bad landings (all "across a desk", legacy compass, the forward
step across the desk from exec and white chairs), 0 refused. Trial on 892: 6 chairs, 0 bad.

## Open (next agent)

1. When the stand audit ends, record its summary lines (chairs audited, skipped, in a body, across a
   desk, via counts) in the plan's slice 0 note or the slice 1 brief.
2. **Walk baseline (not run yet)**, after the stand audit (two-browser cap). Rows: `S/walk-games.tsv`
   (write it: `test_desk_seating 892`, `lab_physical_pentest 785` (room_lw_accounts), `lab_tesseract_trials 790`
   (room_uni_staff), `m01_first_contact 794` (room_office, room_break), tab separated name and id). Run twice
   and diff the two (expect nothing):
   ```
   node tools/playtest/room-snapshot.mjs S/walk-games.tsv S/snap-a.json --walk S/walk-a.json --desk-boxes legacy
   node tools/playtest/room-snapshot.mjs S/walk-games.tsv S/snap-b.json --walk S/walk-b.json --desk-boxes legacy
   node tools/playtest/walk-audit-diff.mjs S/walk-a.json S/walk-b.json --all-geometry
   ```
   `room_IT` and `room_office5` (two of the plan's five sample rooms) are used by no scenario at HEAD
   (case-sensitive grep), so they can't be sampled. Note the commit hash in the output (it is written
   into the walk JSON); the scale-fix agent may move desk items or maps meanwhile.
3. The walk record's pocket screenshots (check (g) "a 2× screenshot with the cells drawn") are not built:
   the diff tool is offline and lists pocket boxes in world px instead.

## Guesses and limits

- Stand audit uses `window.seating.onJumpKey()` twice for "Space, Space" (the same calls the key makes),
  not a keyboard event, so overlays don't swallow it. No session `bootstrap`: the loader sets
  `tutorial_declined` in localStorage and `?skip_resume=1`; the title screen may still be up (logged as
  `minigame` per game). Seating doesn't depend on it.
- "Approach side" = nearest walkable cell within 3 cells of castor + forward(facing) × reach.
- Chairs skipped when an NPC's feet are within 24 px of the castor (NPC updates are stubbed, so no NPC
  is actually seated). `via` is inferred for today's code (`legacy-compass`, `legacy-fallback`,
  `legacy-none`) from `findNearestWalkableWorldCell` calls; slice 1 should set `window.seating.lastStand
  = { via }` so the audit reads it.
- Walk record "desk" = static body of a room object (the `clearOfTables` rule). Check (h) considers every
  pair of bodies whose box changed, with no "facing" test for a third body between them.
- `npcBehaviorManager.update` is stubbed with a property setter installed before game.js assigns it,
  so it is a no-op from the first frame; door gates still tick and are logged.
