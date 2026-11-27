# P-KC handover (Carrholme kit)

Branch `feat/ca-living-office-w2`, worktree `.claude/worktrees/b-ca-lo-w2` (shared with other packages — the index races; see Gotchas).

## Done (committed, content clean in HEAD)

All five P-KC files are committed and `git diff HEAD` is empty for them. They landed in commit **b55ba4c60** (which is labelled "P-SBM ..." because a concurrent P-SBM commit swept my staged files out of the shared index — the content is correct and on the branch; history was not rewritten).

- `AW/office_kits/carrholme_services.json` — `water_cooler` source `kit_cooler` at `position {8.2, 5.6}`, no capacity, no chatter, `useFrom {dx:0,dy:1}` (front/south). `pool: null` + `poolExempt` reason. Yusuf Demir: one `thirst` need, coordinate `needsHome {training_room, 3, 7, south}`, voice Alnilam.
- `scenarios/_office_kit/ink/yusuf_demir_ambient.{ink,json}` — `start` (hello, diverts on `kit_defend_done` + `kit_ep == "ca11"`), `ca11` stub (branches on `kit_key_caught`), `bye` sticky exit. Compiled clean.
- `living_office_build/W2_LINES_carrholme.md` — 2 lines / 3 clips against budget (shared start 1, stub ca11 1; pool 0, exempt). Self npc-dialog-review (2l): 0/0/0.
- `living_office_build/GATE_D_carrholme.md` — offline results + proof 11 plan; **verdicts PENDING the live run**.

## Offline checks (passed)

- `python3 -m unittest test_office_kit`: 74 OK.
- `proof5.py`: only diff is the expected `ca00_first_play/ink/anjali_rao.ink` (P-X0, pending). No Carrholme diff.
- `office_kit.check_pool`/`room_objects`/`room_npcs` accept the kit; cooler copied verbatim with position, no chatter; Yusuf keeps his need and home.

## Open / to do

1. **Live proof 11 + proof 4 (:3004, detached worktree `x-w2-kc`).** Not yet run (stopped at the 150k context limit). Setup is in `GATE_D_carrholme.md`: create `git worktree add --detach` from HEAD, repoint the `test_ca_office_kit` fixture row to `company: carrholme_services`, `ep: ca11`, `ambient: ["yusuf_demir"]`, map `training_room -> room_aw_carrholme` in the fixture `mission.json`, regenerate via `apply_training_room.py`, keyless server on :3004, `window.__test.throttleFps(20)`, five thirst cycles. Record: cooler created at (8.2,5.6) by the fallback (no bind), no collision body (expected), click-to-move routes round it, no walker inside its footprint, Yusuf leaves home/drinks/sits again at (3,7), learner start→host→kiosk path never blocked. If (8.2,5.6) fails the walk, move within col 8 rows 5-7 (try (8.2,6.0)) and update both the kit and the gate doc. Also run `bundle exec ruby -Itest test/unit/break_escape/ink_compiled_staleness_test.rb` (proof 4) with `BUNDLE_PATH=.../vendor/bundle`.

2. **Cross-package BLOCKER for P-TEST / I.** `test/js/social-awareness-office-kit.test.mjs` test "pool exemption" asserts an exempt kit has **no sources** (around line 696): `assert.ok(Array.isArray(kit.sources) && kit.sources.length === 0 ...)`. This contradicts brief v4 D12 and section 4.1 (Carrholme and Quayholt each declare a `kit_cooler` with a `position`; only Quayholt's carries chatter). The test's own comment at ~line 701 anticipates "Quayholt and Carrholme may gain a source", so the assertion is stale. Fix: an exempt kit may carry sources, but none may carry `affordance.chatter` (mirror `office_kit.check_pool`). P-KC does not own this file. Until it is fixed, that one subtest fails on a correct Carrholme/Quayholt kit.

## Gotchas

- **Shared worktree / shared git index.** Several packages (P-KC, P-KQ, P-SBM, P-GEN, H-packages) commit in this one worktree at the same time. `git add` then `git commit` races: another agent's commit can sweep your staged files, and a plain `git commit` can sweep theirs. Commit with an explicit pathspec (`git commit -m .. -- <your paths>`) and verify with `git diff HEAD -- <paths>` afterwards. Never bare `git stash`.
- I/O slip caught and fixed: an early Write of the ink went to the main checkout `scenarios/_office_kit/ink/` instead of the worktree; moved into the worktree, main checkout left clean.
- The pre-existing gwen/agnieszka subtest failures in the office-kit suite are other agents' uncommitted WIP, not P-KC.
