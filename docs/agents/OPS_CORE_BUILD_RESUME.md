# Ops core build: resume note

Task (user, 2026-11-23): orchestrate the implementation of `docs/achitechture/OPS_CORE_PLAN.md`
per AGENTS.md, with the `fable52L` agent type in place of Opus.

Brief: `docs/agents/OPS_CORE_BUILD_BRIEF.md`. Worktree `/data/be-ops-core`, branch `ops-core`
(cut from main `24755a3c9`). Handover notes and reviews: `docs/agents/ops_core_build/`.

## Order

1. L1a (log plan section 12, items 1 to 8), split into three builders: item 1 (golden
   mechanism, captured before any engine edit); items 2 to 4; items 5 to 8.
2. L1b (items 1 to 3). Then review L1a+L1b (fable52L, 2 to 5 rounds), train check, land, push.
3. Core step 1 (unchanged-behaviour fixtures, section 10 parts 1, 2 and 5).
4. S1 steps 2 to 5; review; scripted playtest and live proof (Haiku); train check; land.
5. S2 steps 6 to 8; same.
6. S3 steps 9 to 13 (step 11 its own commit and a security review); same.
7. Screenshot review page for the user; raise the card art task.

Landing: `tools/playtest/train-check.sh /data/be-ops-core <outdir> <port>` must end GREEN at the
hash merged; merge (not rebase) into main, push, then merge main back into `ops-core`.

## State (update after every step)

- 2026-11-23: worktree, brief and this note created.
- L1a item 1 DONE: `12cdea6b2`, `7121aa04e` (golden mechanism, two fixtures; note
  `ops_core_build/HANDOVER_L1a_1.md`). Orchestrator replay check was queued on the test lock.
- L1a items 2 to 4 DONE: `54c076858`, `5c5e64648` (events file, helper, secret registry; 42
  unit tests, golden replay 3 runs, access_model 125 runs, per its note `HANDOVER_L1a_2-4.md`;
  six small departures listed there for the reviewer to judge).
- Gotcha: never wrap `bin/ops-golden-compare` in `flock` (it self-locks; this deadlocked the
  shared lock for 50 minutes). Builders go over 150k if a wait is long: keep steps small.
- L1a items 5 to 8 DONE: `ecbbe549b`, `996f1cd51`, `e9be86ba4`, note `87f9e4208`
  (`HANDOVER_L1a_5-8.md`). L1a is built. Node tests need
  `PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH`.
- L1b BUILT: items 1 and 2 `1530fec5e`, `28c6f6cad`; item 3 `1a637d36e`, docs `66101d30d`
  (`scenarios/test_ops_logs/`, PLAYTEST.md not yet run in a browser; notes
  `HANDOVER_L1b_1-2.md`, `HANDOVER_L1b_3.md`).
- L1a R1 review: 0B 1M 17m, `ef5f8fff6` (`reviews/L1a_R1.md`); rulings in the brief.
- L1a R1 FIXED (18 of 18, unconfirmed): `d727f8fc2`, `fdc2b42a2`, `a278ac2e5`, outcomes
  `965e9a595`. L1b R1 review 0B 1M 6m `79e6ad133`; FIXED 6 of 7 (m5 was real: the granted
  badge row moved after the route-room gate): `49211abbb`, `a84ab7d02`, `40d47ac12`, outcomes
  `d950ed316`. Open: L1b m4 f (`save_limit: false` helper test, unowned).
- R2 delta review: ready to land (24 of 25 confirmed, 4 minors) `ed7f7d18f`; tidy pass
  `21fcce0fe`, `9f4cbaeed`. Playtest of `test_ops_logs` passed 7 of 7 (second run; game made
  with `swap-scenario-game.rb`). Schema convention fix `791609f2e`.
- **L1a and L1b LANDED on main and pushed: merge `13afcdf89`** (train check 2 at `791609f2e`
  in `/data/tmp/ops-core-train-2`: Rails 3724 runs 0 failures, smoke 3 games 0 failed, corpus
  0 of 201, rubocop clean, tree clean; RED only on JS, 3 of 993 files).
- **JS baseline on this machine** (fail or flake on main itself, branch touches no `public/`
  file): `capture-log.test.mjs`, `lockpick-mode-switch-roundtrip.test.mjs` (fail on main),
  `lab-ux-ui.test.mjs` (flaky on main). Landing rule here: no failure main does not have.
  Any OTHER failing JS file is ours. Reported to the user as a machine issue.
- **Train check on this machine** needs: `.bundle/config` copied from main into the worktree
  (done), node 22 first on PATH, and
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE=$HOME/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell`.
  Single JS files run as `bin/test-js test/js/<name>.test.mjs` (a bare name "fails" falsely).
- Core step 1 DONE: `0bf5c6744` (8 golden fixtures `core_<scenario>.json`; node fixtures in
  `test/js/fixtures/ops_unchanged/`; note `HANDOVER_core_1.md`; all three checks mutation
  proved). Ruling: part 2 covers the 8 network scenarios, the 6 pretext scenarios and m01, m02
  as controls (not every folder; the train's validator corpus covers the rest). Known: the
  checked-in graph of `test_access_networks` is stale against regeneration (not ours).
- S1 step 2 DONE: `046dff1ec` (schema rows, `NetworkModel` helpers, `check_network_ops`,
  `scripts/real_product_names.txt`, withheld names; note `HANDOVER_core_2.md`). The validator
  table `NETWORK_OPS_BUILT` has N13 false until step 5 flips it (the plan: a stage flips its
  entries when it lands). OWED BY STEP 5: the two `validate_network.rb` edits of plan 9.2
  (the same-label rule via `hosts_on` near VN:587; `carries` near VN:361-364).
- RUNNING in parallel, disjoint files: S1 step 3 server builder (Sonnet; Part A scan action,
  Part B rows and `cli` copies; note `HANDOVER_core_3.md`; may hand over after Part A) and S1
  step 4 client builder (Sonnet; `public/`, `test/js/` only; note `HANDOVER_core_4.md`; it
  lists the answer shapes it assumed, to check against step 3).
- Next: check the two halves agree on answer shapes; fable52L review R1 of steps 2 to 4
  ("review" in the description; a second fable52L reviewer for the client if the diff is
  large); step 5 (Sonnet: flip N13, the two `validate_network.rb` edits, `test_ops_scan` with
  PLAYTEST.md and graph, `collect_ops_secrets` in the leak scanner, verify-run ops lines,
  docs N13 and test-bridge); fixes; delta review; Haiku scripted playtest and live proof (game
  via `swap-scenario-game.rb`); train check with the machine settings above; land; push.

- 2026-11-23: the user pasted the planning session's build handover (whole ops layer, twelve
  steps). Its rules are folded into the brief. Scope here stays the core plan plus L1a and L1b;
  the later stages (S5a, S6, S8a, S7, S5b, S5c, L2a to L3, S8b, S8c, outline section 5) are not
  started and need the user's word. Start point for those: `docs/agents/OPS_LAYER_HANDOVER.md`
  section 0. That file's "Fable is no longer used" is overridden by the user's routing above.

- 2026-11-23: USER: "carry on into the later stages after S3, work through the whole build".
  Scope is now the whole ops layer, in the order of `OPS_LAYER_PLAN_OUTLINE.md` section 5:
  S5a; S6 (K1 to K4); S8a (M1a, M1b, M2, M3); S7 (C1, C2); S5b; S5c; L2a, L2b, L3; S8b (H1,
  H2); S8c (G1 to G4). Each from its own plan's stage table and section 12, same loop as the
  core stages (Sonnet builds, fable52L reviews, Haiku proofs, green train check, land, push).
  Before each plan: read its sections 3, 12, 14 and 15 only. Parked and out of scope: S0, S4,
  S10 to S12. Cracking (S7) drafting was stopped by safeguards during planning: if a builder
  is stopped, follow AGENTS.md (report to the user, offer one retry, never rerun unasked).

## Waiting on the user

- Nothing yet. Later: card art for `technique_card.png`; the final screenshot review.
