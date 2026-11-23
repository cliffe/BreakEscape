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
- S1 step 3 DONE: `fb22fcedb`, `147f94bcd` (scan route, `network_ops.rb`, `opsDiscovered`,
  events, rows; 63 new tests; note `HANDOVER_core_3.md`; departures (a) to (h) sent to the
  reviewer, notably the foothold argument of `network_rows`/`host_row` left out until S3).
- S1 step 4 DONE: `559f36023` (`ops-model.js`, `perform` with guard and hooks, Sweep and Scan;
  32 new node tests; whole JS batch 996 of 999, only the 3 machine-baseline files failing;
  note `HANDOVER_core_4.md`). No browser proof yet.
- S1 reviews R1: server 0B 2M 7m `00f4b0beb` (`reviews/S1_server_R1.md`); client 0B 1M 7m
  `33a0b31d9` (`reviews/S1_client_R1.md`; the two halves agree, no mismatches). Rulings in the
  brief. Client FIXED 9 of 9 (unconfirmed): `7c3189229`, outcomes `ce3475104`.
- S1 step 5 DONE: `897d3e1bd` (`scenarios/test_ops_scan/` with PLAYTEST.md, N13 flipped to
  built, the two `validate_network.rb` edits, `collect_ops_secrets`, verify-run line, graph
  nodes for devices, docs N13; note `HANDOVER_core_5.md`). That builder ran to 257k tokens:
  split a step like this in two next time (scenario + tests / tooling + docs).
- S1 server R1 FIXED (unconfirmed): `50a325b76`, `1d58cf407`, `d735fefee` (M1, M2, m1, m5),
  `6cc0efa9a` (m3, m4, m6, m7). The reviewer had written only a header to its findings file;
  rebuilt from its report in `d55562487`. LESSON: check a findings file's length before
  committing it; the brief now says findings go in the file in full.
- S1 R2 delta: 19 of 19 R1 fixes confirmed; 1M 6m new + playtest P1 to P3 (`bc8295e0d`);
  fixed in `4d414c371`, `c06c5bc26`, `705fb6c27`, `3568149ab` (P3 not ours: a replant answers
  `first: false`, so the view does not auto-open; pre-dates this build; asked the user).
  Playtest + live proof of `test_ops_scan`: 12 of 12 (scratchpad `s1-playtest/`). R3 delta:
  ready to land, 3 minors (`reviews/S1_R3.md`): R3-1 to step 8's scanner work, R3-2 to step 7.
  Train 3 at `bb29363b8` found one JS failure of ours (`playtest-verify-run-access`), fixed
  in `13893a73d`.
- **TWO WORKTREES since 2026-11-23 (user: "parallelise further").** BUILD: `/data/be-ops-build`,
  branch `ops-build` (all agents work here; this note and the brief are maintained here).
  TRAIN: `/data/be-ops-core`, branch `ops-core`: I fast-forward it (`git merge --ff-only
  ops-build`) and run train checks there, so a train never blocks building. Land by merging
  `ops-core` into main at the trained hash, then `git merge main` in the build worktree.
  Disk: a worktree costs about 4.5 GB and /data has about 9 GB free: at most ONE more.
- **S1 LANDED on main and pushed: merge `11a274307`** (train 4 at `13893a73d`: Rails 3860
  runs 0 failures, shell-x 180 checked 0 failed, smoke 0 failed, corpus 0 of 202, JS 997 of
  1000 with only the 3 baseline files failing). Main merged back into `ops-build`
  (`d12357b8a`). S2 step 6b DONE: `1bb0a2207` (catalog loader; entries keep their `_` key, so
  the finding builder must copy named keys only). Not seeded: `test_ops_logs` and
  `test_ops_scan` have no Mission row (seeding republishes every mission: user's call).
- RUNNING: S2 builders side by side in the build tree, split by file: 6a server
  (`HANDOVER_core_6a.md`; parts A1 schema/model/validator, A2 routes and findings, A3 `cli`
  from the loader), 6b catalog loader (interface `RealismCatalog.lookup`, `.with_folder`,
  `.faults`), 7 client (`HANDOVER_core_7.md`). A Haiku reader is writing a dependency digest
  of the later plans to the scratchpad `deps/OPS_PARALLEL_DIGEST.md` (which stages can start
  now in a second stream).
- Next for S2: step 7's graph part (weakness nodes, 9.3) and step 8 split in two (8a
  `test_ops_findings` scenario + PLAYTEST + controller tests + flip N14; 8b graph + leak
  collector check-stage entries + R3-1 + verify-run + docs N14), launched when 6a reports;
  two fable52L reviews (server, client) as each half lands; fixes; delta; Haiku playtest;
  train in the train tree; land. If the digest shows an independent stage, open ONE second
  stream in a third worktree (own branch, own brief section, same loop).

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
