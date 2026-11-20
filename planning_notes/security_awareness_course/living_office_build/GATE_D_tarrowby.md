# Gate D: Tarrowby Logistics (P-KT)

Port :3002. Throwaway worktree `x-ca-w2-tarrowby` (never merged). Proofs 4 and 11 (+ proof 3 form), per WAVE2_BUILD.md 2.4 (v4, 208b39748).

Kit commit: `2eace7034` on `feat/ca-living-office-w2`.

## Proof 4 — PASS (done offline, no server)

- `kit_*` staff `storyPath` points at `scenarios/_office_kit/ink/<person>_ambient.json`; the three new `.json` compile clean from `.ink` via `bin/inklecate` (no warnings).
- Compiled-ink staleness test covers the new files: `bundle exec ruby -Itest test/unit/break_escape/ink_compiled_staleness_test.rb` → 2 runs, 4 assertions, 0 failures (BUNDLE_PATH=main checkout vendor/bundle).
- `scenarios/_office_kit/` is a non-scenario stub folder with no `scenario.json.erb`, already skipped by the mission registry and the scenario-needing tests (pre-existing; the new files only add ink to it). 
- QS stub test `test/js/office-kit-quiet-and-stub.test.mjs`: fatima_begum, chidi_okeke, zainab_hussain all PASS (ok 13-15, 22-24, 46-48) — committed `.json` loads, start opens on a sticky-exit line, start diverts on `kit_defend_done`+`kit_ep` to each episode knot, every knot ends on `+ [See you later.] #exit_conversation`, speaker prefix == kit displayName, no state-writing tag; and the row-coverage check (ok 49) passes with Chidi excepted in ca17.
  - NOTE: 2 unrelated failures in this suite (gwen_pritchard, agnieszka_duda) come from P-SBM's committed ca13 knots (20c9e44e5), not P-KT. Flagged to P-SBM / P-TEST.

## Proof 11 — TO RUN (live, :3002) — see PKT_HANDOVER.md

Kit staff in `room_aw_tarrowby` for five need cycles. Expected (D12):
- `kit_vending` binds to the drawn `drinks_vending1` prop at tile (6.94, 9.38) via `rooms.js findMatchFor` (no explicit position); the log should show the bind, not the fallback.
- No stuck walker; staff leave home, drink at the vending (`useFrom` north, cell (6.9, 8.4)), and sit again at their coordinate homes on supported `aw_chair_south_slate1` chairs.
- Staff homes are best-estimate seat tiles: Fatima (2,6), Chidi (3,6), Zainab (4,6), all facing south. **If a staff member does not visibly seat on the drawn south chair, adjust the home to the actual seat cell and record the new coords here, then re-commit the kit.**
- The learner's start→host→kiosk path is never blocked, queue cells included.
- Record whether the vending has a collision body (drawn prop; a body is expected here, unlike the KQ/KC cooler) and that click-to-move routes to the host/kiosk fine.

## Proof 3 form — TO RUN (live, :3002)

Two Tarrowby staff at the pool source (`kit_vending`, capacity 2): a `kit_tarrowby` pool line is heard with the kiosk closed, and none with the kiosk open (`requireGlobal: { kit_quiet: false }`).

## Verdict

Proof 4: PASS. Proofs 11 and 3: pending live run (handover). Game ids to be logged here after the run.
