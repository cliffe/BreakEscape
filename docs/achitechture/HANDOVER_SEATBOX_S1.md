# Seat box slice 1: handover (2026-11-06)

Plan: `SEAT_BOX_PLAN.md` slice 1 (R3 revision), **player half only**. The brief kept NPC behaviour
unchanged: `unseatNPC` still calls the old compass loop (now `legacyStandSpot` behind the
`standSpot` wrapper), `seatNPC` records no `st.approach`, `pickStandSpot` has no `npc` flag. Those
are slice 6. Scratch: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/seatbox-s1/` (`S/` below).

## Done

| Commit | What |
|---|---|
| 4130d7555 | `systems/seat-box.js` (new, no imports), `seating.js` stand-up order, tests, superseded line in `SEAT_BOX_EXPERIMENTS.md` |

- `seat-box.js`: `SEAT_BLOCKS.office40`, `seatFamilyOf`, `blockFor`, `walkBoxClear` (rectangle
  `extra`), `pathClear` (¼, ½, ¾ and every 4 px, 2 × 2 probe), `chairRect` (from the sprite),
  `localStandGrid` (= `buildWorldGrid({ exclude })`, full size), `nearestCell`, `floodStandCells`,
  `sweepBlock` (tested, unused until slice 6).
- `seating.js`: `landingSpot` → `playerStandSpot` (1.3 order over the local grid, chair rectangle in
  the box check, `state.facing` at stand time); voluntary approach only within 32 px and line clear;
  `jumpOff` refuses with "No room to stand up here."; `standUp` wraps the spot choice in try/catch
  (falls back to the approach, `via: 'error-approach'`); `window.seating.lastStand = { via, x, y,
  forced }` on every swivel stand; `window.__seatBox === false` runs `legacyStandSpot` and a
  `jumpOff` that never refuses (via `legacy-compass` / `legacy-fallback` / `legacy-none`).
  `seatedBlock(body)` always returns the chair body; the `keep` branch is gone.
- No test harness copies `seating.js` (only `core/game.js` imports it, and tests read game.js as
  text), so the new import needed no copy-list change.

Tests: `seat-box.test.mjs` 12/12, `seating.test.mjs` 24/24 (named desk1 cases through a rig that
drives the real `trySit` / `place` / `onJumpKey` / `standUp`; east-then-north facing with a control
that shows the sit-time facing would go round the corner; cramped; boxed in; baked chair; throw).
Full node suite 402/402 (`S/testjs.out`). Rails 953 runs, 0 failures, 1 skip (`S/rails.out`).
Reopen check: 4 problems, all m09 phone ink ("restart after an end replays the opening"), not
seating (`S/reopen.out`). The same 4 were logged before today's engine work
(`scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md`:39).

### Demo, `test_desk_seating` (game 892, live, headless :3001)

Driver: `S/desk-demo.mjs <gid> <legacy|footprint> <out.json> [false]`. It loads through
`tools/playtest/lib/all-rooms-loader.mjs`, presses Enter past the title screen, closes the `notes`
minigame (without that `__test.walk` and `pressKey` are blocked and nothing rolls), then installs
slice 2's driver `scratchpad/seatbox-s2s4/exp.js` and runs its 9 cases (`seatbox-s2s4/cases.js`:
roll into the desk with held arrows, then Space, Space) and a forced `standUp()` from behind desk1.

| Case | Footprint boxes: stand at, via | Legacy boxes: stand at |
|---|---|---|
| front desk1 (F 140) | 68,148 compass | 68,148 |
| front smalldesk1 | 204,148 | 204,148 |
| front zds_desk1 | 340,148 | 340,148 |
| **behind desk1** (back edge 264) | **108,252** | 108,260 |
| behind smalldesk1 (back 253) | 244,244 | 252,268 (beside the east end, x > 250; legacy box lets the chair sink) |
| east end desk1 | 132,156 | 124,156 |
| west end zds | 308,108 (beside the end, x < 320; same as game 876) | 340,124 |
| east end zds | 404,156 | 396,156 |
| west end smalldesk1 | 188,108 (x < 200, beside) | 204,108 |
| **forced behind desk1** | **108,252** | 108,260 |

Every case stood (not seated after), none in a desk box, walk-away 52–55 px, every via `compass`.
Outputs `S/demo-footprint.json`, `S/demo-legacy.json` (+ `.png`). **Not done:** the cramped live case
(a chair between desk1's back and a wall). The room has no wall near a desk; the 24 px gap between
`desk1_89` and `desk1_90` is the nearest thing (castor about (450, 272)). Unit tests cover cramped
and boxed in.

## In progress

**Stand audit, new order** (started 19:41, background, `STAND_AUDIT_PID=3388097`, its headless browser
is a child; stop by that PID only):

    node tools/playtest/stand-audit.mjs tools/playtest/baselines/seatbox-s0-stand-games.tsv \
      --out S/stand-new.json --shots S/refused-shots > S/stand-new.log

About 70 minutes (expect it to end about 20:50). The log ends with summary lines (`chairs ...`,
`stands ...: landed, in a body, across a desk, refused`, `via {...}`). First rows: biometric_breach
19 chairs, **0 bad landings** (baseline: 8 across a desk), 0 refused. `--shots` writes a 2× screenshot
per refused voluntary stand, named `<mission>__<chair>.png`, taken after the audit with the chair back
at its placed spot (not seated).

## Open (next agent)

1. When the audit ends: compare with `tools/playtest/baselines/seatbox-s0-stand.json` (224 across a
   desk, 0 in a body). Pass = **0 in a body and 0 across a desk** for the new order. Build the refused
   list from `S/stand-new.json` (`games[m].results[*].voluntary.refused`): mission, room (`room`),
   chair id, texture, facing, screenshot path. Look at every screenshot. The user must see this list
   before slice 1 counts as done (it is not approved by anyone yet). A review page artifact suits it
   (AGENTS.md "Asking the user for input").
2. **Legacy side by side** (`--seat-box false`): a full run is another 70 minutes. Suggested: the
   top-offender rows only (`--only biometric_breach,ceo_exfil,lockpick_gauntlet,test_desk_seating`)
   and check they match the baseline's numbers (the baseline ran today's old code, which
   `__seatBox === false` keeps). Then commit the new-order JSON as
   `tools/playtest/baselines/seatbox-s1-stand.json` and note it in `SEAT_BOX_BASELINES.md`.
3. **Walk audit**: no map changed since `00f04d534` (checked `git log 00f04d534..HEAD` on rooms,
   scenarios and js: only slice 1), and slice 1 changes no body or grid, so compare against the
   committed baseline directly:
   ```
   node tools/playtest/room-snapshot.mjs tools/playtest/baselines/seatbox-s0-walk-games.tsv S/snap.json --walk S/walk.json --desk-boxes legacy
   node tools/playtest/walk-audit-diff.mjs tools/playtest/baselines/seatbox-s0-walk.json S/walk.json --all-geometry
   ```
   Expect 0 differences.
4. **Lab regression** (score 100): replay of game 685's commands, extracted to `S/lab-cmds.jsonl`
   (41 commands, one JSON per line, from
   `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s11/lab-685.jsonl`).
   `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb lab_physical_pentest`,
   `tools/playtest/session-start.sh --url http://127.0.0.1:3001/break_escape/games/<id> --headless true`,
   then each line through `tools/playtest/cmd.sh <id> '<json>' 600`, then
   `ruby tools/playtest/verify-run.rb --tasks <id>`. Pass: score 100, no "No path found" / "Failed to
   escape wall", no console errors in `drain`. The lab's staff chairs are static, so slice 1 should
   change nothing there. Add a line to the lab log's "Office-life slices"-style note only if the
   lab owner wants it; record the game id here.
5. Regression sit-and-roll in one `room_office` mission (m01 main_office_area): the stand audit covers
   m01's chairs; a manual roll is optional.
6. Live NPC checks from the plan (test_seating swivel NPC, baked grid) are **slice 6**, since NPC
   stand-up is unchanged here.

## Browser etiquette seen

Max two headless browsers across all sessions. Other agents ran `playtest-session.js` on games 894 and
895 the whole time; load stayed 12–20. Wait loop used:
`l=$(cut -d' ' -f1 /proc/loadavg); n=$(ps -eo args | grep -E "^node .*(playtest-session|stand-audit|room-snapshot)" | grep -vc grep)`.

## Guesses and limits

- NPC half left out on the brief's instruction (keep NPC behaviour unchanged); the plan's slice 1 NPC
  bullets (`st.approach`, `homeFacing`, step 6, `unseatNPC` staying seated) move to slice 6.
- `pathClear` samples every 4 px as well as ¼, ½, ¾: stricter than the plan, so a thin body can't sit
  between samples on a 32 px approach line.
- `walkBoxClear` counts every enabled static body and every enabled immovable body (the grid's
  sources), including immovable NPCs and any static sensor body; the stand audit's "in a body" check
  uses the same rule.
- `window.seating.lastStand` is set for swivel stands only (static chairs return the approach).
- `jumpOff` also catches a throw (falls back to `standUp()`, which then lands on the approach).
