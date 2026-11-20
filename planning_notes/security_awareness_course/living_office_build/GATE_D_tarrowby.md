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

## Live run 1 (2026-11-20, :3002, partial)

Throwaway worktree `.claude/worktrees/x-w2-kt` (detached at c7ad4cc91, not merged). Fixture: scenarios/test_ca_office_kit/scenario.json.erb overwritten there with ca01_invoice_fraud_defend re-kitted by `office_kit.apply_kit` for `tarrowby_logistics` (Fatima, Chidi, Zainab) plus the Tarrowby room fields (script `mkfix.py` in the scratchpad). Keyless server on :3002, mission 278 via the app's new-game form. Driver: playtest-session.js, headless, throttle 20 fps. Game ids: 10905-10907 probes, **10908 run A** (natural thirst, 130 s). Evidence in scratchpad `w2_gateD/tarrowby/` (runA.out/.log, A_00..A_10.png, A_contact.png).

### Proof 11 (one natural cycle each; five cycles NOT yet done)

- **Seats: PASS, no home change.** All three start seated (`sit_south_frame_000`) on the north-side `aw_chair_south_slate1` chairs. Sprite x equals the chair centre exactly (Fatima 60, Chidi 100, Zainab 140; dx 0) and feet y 215. After each drink they walk back and sit again on the same chair (Fatima t=25.4 s, Zainab 33.4 s, Chidi 50.6 s, same dx 0). Homes (2,6), (3,6), (4,6) snap to the chair centres. Screenshots A_contact.png (start, drinking, one back, all back).
- **Vending bind: PASS.** One `drinks_vending1` sprite, `kit_vending` at (222, 239), size 42x61, matching the drawn tile (6.94, 9.38) bottom edge (y 300); the kit source has no `position`. No second vending sprite, so no fallback. No collision body (`body` false), as the brief expects.
- **Thirst trip: PASS.** Zainab (55 start) left at 3.6 s, Fatima (45) was already using, Chidi (60) left at 19 s once a slot freed (capacity 2). Each: `npc_arrived` then `npc_use_started:kit_vending` then `npc_used` then `npc_returned_post`.
- **No stop in a prop footprint: PASS.** Standing stops (use cells) at (237,236), (269,235), (199,238), all outside vending (x 222-264, y 239-300) and stacked chairs (268-288, 255-300). Seated stops have feet on the table's top edge (y 215) and are the seat, not a stop.
- **Not yet run:** cycles 2-5 (force with `__test.needs.set(id,'thirst',10)`, about 50 s per cycle for three staff); the learner start (6,6.2) to host (5.5,3.8) and kiosk path with staff at the vending (`moveToNear` adaeze_okafor and training_kiosk) and click-to-move round the vending.

### Proof 3 form

- **Kiosk closed (kit_quiet false): PASS.** Pairs at `kit_vending` spoke three lines, all `npc_chatted:kit_vending`, topic `kit_tarrowby`, speakers in the pair: Zainab "Back off the road at last." (her own line), Fatima "Depot's heaving today." (pool), Chidi "Who's on the Shipley run?" (pool). Each also `npc_overheard`.
- **Kiosk open (kit_quiet true): NOT yet run.** Open `training_kiosk`, click `.epr-start` (state change sets kit_quiet), force two staff to thirst 10, expect no `npc_chatted:kit_vending`.
- **Stubs open/close on the sticky exit:** NOT yet run (click each colleague, check the start line and `+ [See you later.]` closes).

### Handover for the next agent

Re-create the fixture: `python3 <scratchpad>/w2_gateD/tarrowby/mkfix.py <x-w2-kt>/planning_notes/phishing_and_social_engineering/awareness <x-w2-kt>`; server from x-w2-kt (`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=.../vendor/bundle bundle exec rails server -b 127.0.0.1 -p 3002`); `run.sh <name> <jsonl>` and `mk.py` (monitor) are in the same scratchpad folder. Use a 300000 ms timeout and keep each route under 280 s.

Verdict so far: seats PASS (no kit change), bind PASS, one cycle PASS, footprints PASS, pool closed PASS. Pending: cycles 2-5, learner path, pool kiosk-open, stubs.
