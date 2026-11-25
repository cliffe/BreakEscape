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
- S2 ENGINE BUILT (build tree): 6a `eb8d443ba` (A1), `aa2d142a6` (A2), `71e8cf194` (A3;
  note `HANDOVER_core_6a.md`; that builder reached 252k tokens: split server steps in three
  for S3); 6b loader `1bb0a2207`; 7 client `35545f827` (`HANDOVER_core_7.md`; reads a decoy's
  reason through a fallback chain until the key is settled); graph `e8cde9ce0`.
- S2 BUILT: 8a `eea31ed86` (`scenarios/test_ops_findings/`, PLAYTEST beats 1 to 12 + run B,
  16 end-to-end tests, N14 flipped; `HANDOVER_core_8a.md`); 8b `98a5164fe`, `a499aff45`,
  `677354b7f`, `af14f9aeb` (scanner check stage + R3-1, verify-run `opsFindings` line, docs
  N14, flaky test fixed; `HANDOVER_core_8b.md`).
- S2 reviews R1: client 0B 1M 9m `0234fb86c` (halves agree; decoy reason key is
  `falseBecause`); server 0B 0M 17m `248ec9e75`. Rulings in the brief.
- S2 R1 FIXED (unconfirmed): client `74ad06f69` (9 fixed, m8 deferred to the live proof);
  server `9b2a8b1aa`, `17ea002c4`, `ce69609e7`, `612cd5509` (14 fixed + 4 tidy items; its m12
  and m13 hunks were swept into 9a's commit `a6f04bf8b`). Rulings: an item with no graph node
  draws no need edge (plan: no new node).
- S3 so far: 9a `a6f04bf8b` (schema, helpers, validator S3 rules; `HANDOVER_core_9a.md`;
  departures: one extra error, a literal `versions` rule the plan's own example may fail, a
  skipped warning now in the validator pass); 9b `45388615c` (placeholder PNG, tray test,
  keyring proof reads `player_state['opsUsed']`, an Array of finding ids); 10a `5f18daed2`
  (+ `dd31d52a1`): session record keywords, `client_access_level`, `opsUsed` registered.
- S2 R2 delta `f27ccf347` (21 of 27 R1 fixes confirmed, rest deferred; game code clean; 2
  majors in the leak scanner, 11 minors); FIXED `12aea0679`, `e77acb6fd`, `e87e53a4a`,
  `bb9f4f235`, `0f8b96517` (structural scanner rules, proved on the real scenario). BUT that
  fixer also LOOSENED the scanner (a string inside longer room text is not registered): being
  undone. S2 playtest: beats 1 to 11 + 8a passed (games 22, 24); beat 8b (a forged sync sent
  from the browser) was refused by the permission classifier twice: NOT retried, removed from
  the script, covered by Rails tests; told the user. Leak check had two findings: an authored
  clue naming a host (ruled: reword the clue, scanner stays strict) and a product string
  flagged after a resumed session (cause being proved). Items in `reviews/S2_PLAYTEST.md`
  (`e4d5b5926`). PT4 (card content floats in the middle of a stretched card) is CSS for a
  later client pass (12a owns the file now).
- S3: 10b `73c9cd798`, `d6b9e4168` (`POST /network/technique`, `use_technique!`, grants,
  events, `techniques` on `GET /network`; `HANDOVER_core_10b.md`; rulings in the brief: the
  step 11 builder folds 10b's two wrappers into `network_access.rb`).
- S2 follow-ups DONE: playtest items `f2677efc4`, `dac206901` (scanner strict again, clue
  reworded, resumed-session finding proved a judging mistake, beat 8b removed); validator
  pass `ee10c3860`. S2 left: PT4 CSS (card content floats in a stretched card) for the S3
  client fix pass; a short delta of the scanner at S3's delta round. A transient failure
  (confirm of an unchecked id answering `already`) was seen once during a mid-edit and did
  not reproduce in three quiet reruns.
- S3 BUILT so far: 9a `a6f04bf8b` (+ `ee10c3860`), 9b `45388615c`, 10a `5f18daed2`, 10b
  `73c9cd798`, 10c `13b8d9c76` (hostile and free tests, no engine fault), 11 `a756be26e`
  (ONE commit, access checks), 12a `9ed42428c`, `68529abee` (Techniques panel; bolt helper),
  12b `1b3e0da1c` (remote view, marks). Step 11 security review R1 `07198617b`: SAFE TO KEEP,
  0B 1M 7m; F1 = `record_borrow_done!` must keep a remote record (unassigned in the plan).
- TWO existing node tests fail after 12b and were left unedited: `pc-sessions.test.mjs` H-4
  (a remote password copy is no longer displaced when an NPC sits or borrows: plan 5.4) and
  `test-bridge-access.test.mjs` (key list gains `compromiseMarks`). 12b tried to edit them and
  the permission classifier DENIED it (its brief said no assertion edited). Told the user. The
  client reviewer is judging both independently; the edit goes in the client fix pass with an
  explicit instruction only if the review confirms the plan requires it.
- Rulings queued for the S3 client fix pass: static import of the bolt helper + copy lists;
  PT4 CSS; the two test updates above if confirmed. Open questions for the user: F4 (outage:
  keyboard desktop served, no-route folders refused); the validator rule proposed for room
  text naming a discovery host (not built).
- S3 reviews R1: server `ca8c48d35` 0B 1M 12m (M1: an expired token or relay record met the
  `session` need, so a step up could grant lasting admin); client `702942304` 1B 4M 10m (B1:
  the client dropped the body's top-level `techniques`, so no card was ever listed in a real
  game; tests passed on a wrong fixture shape). Security fixes DONE `8639775d1` (F1: a
  finished borrow keeps a remote record), `c37b04c3a` (T1 to T12, six mutation proofs).
  Graph `6eecdc03a`. 13b DONE `c30f5b413`, `aa7edcd1e`, `fc32a3d80` (scanner S3, verify-run
  lines, docs N15; `HANDOVER_core_13b.md`). The plan's section 10 part 3 itself allows the two
  `pc-sessions.test.mjs` edits; the bridge test is added to it by the world-side fixer.
- S3 R1 FIXES ALL IN (unconfirmed): server `7d535ab24` (M1: needs met only by live sessions
  and credentials) + 7 more; client world side `74cd8623e` (B1), `cd112e613`, `05af6be2e`,
  `a60384d0d`, `d29627282`; client view side `db006e737`, `f4c024b85`, `e023973c0` (m7). 13a
  DONE `eac3f42fe` (`scenarios/test_ops_access/`, 26 end-to-end tests, N15 flipped;
  `HANDOVER_core_13a.md`). Two fixers were stopped with TaskStop after their reports because
  they kept re-waking on leftover timers and re-sending the same report (about 130k to 180k
  tokens a wake): if a finished agent sends its report twice, stop it.
- **Main (with L2a) MERGED into `ops-build`: `b84870d2c`.** Conflicts in three files, resolved
  by hand as keep-both (controller `set_game` list, `policy_test` `DEVICE_ACTIONS`, three
  places in `access_leak_scanner.rb`). After the merge, on a quiet tree: 476 Rails runs 0
  failures (scanner tests, policy, log reader tests, the four technique files, `ops_log_test`),
  golden compare 12 runs 0 failures, six node files of both streams pass. This also cleared
  the one unread failure from the security fixer's run.
- S3 R2 delta `c0ad4b503`: every R1 finding confirmed, merge clean, nothing in the access
  checks; 1 major (leak scanner earned whole-game steps) + 8 minors; FIXED `872670b8f`
  (per-thing steps, fail closed when a grant cannot be attributed), `891514116` (PLAYTEST
  sends no hand-built request), `42865e185`, `d75930715` (the borrow fix tested through the
  real route). R2 did NOT read: the bodies of `ops_access_scenario_test.rb`, the scanner's
  unit tests and non-grant collectors, the graph commit beyond 9.3's row, docs N15 and the
  scenario except through a digest: the final delta must cover these.
- S3 live proof (game 29): 20 beats passed incl. keyboard-only select-then-Use; beat 13 stuck
  and beat 8 skipped (hand-built requests refused by the permission classifier / by policy);
  beat 19 and the phone panel not run; leak check 14 findings on `via` / `access` keys (to be
  decided by the plan: scanner rule or server). Items PL1 to PL5 in
  `reviews/S3_PLAYTEST.md` (`d81314cfc`). I looked at the panel and remote-view frame
  screenshots (good); the world mark could not be judged at that zoom.
- S3 since then: PL1 the 14 leak findings were scanner false positives (`1acac5791`); small
  client items `5d48eb768`, `ba079dcd3` (a world-opened remote view: share close reopens its
  desktop, sign-in close leaves to the world: my ruling); final delta R3 `eb3e6a772`: READY TO
  LAND, no blocker or major open or unconfirmed, 8 minors. Second live-proof run found the
  bolt mark invisible on a held PC (PL6): FIXED `88c926e43` (the bolt follows its sprite's
  visibility), seen by me in close clips (scratchpad `s3-bolt-fix/`); 776 leak findings were
  capture files judged out of time order: the tool now refuses that (`220100e9c`); a "Leave
  it that unplugs" was a tester mistake (PL8). Small delta R4 `0f81dd1c6`: READY TO LAND, 6
  minors. Old-scenario check (`test_access_networks` P1 to P4 on this branch, Sonnet): no
  regression, 0 console errors (scratchpad `s3-old-scenario-check/`). Phone width: the Use
  button is cut off at the bottom and the message after Use lands below the fold (minor).
- **L2b LANDED: merge `a44825e41`. S2 + S3 LANDED on main and pushed: merge `6afbe1496`**
  (train 5 at `f31eec919`: Rails 4279 runs 0 failures, shell-x 184 checked 0 failed, smoke 0
  failed, corpus 0 of 204, JS 1008 of 1011 with only the 3 baseline files, tree clean). THE
  CORE PLAN'S THREE STAGES (N13, N14, N15) ARE ON MAIN. `ops-build` and `ops-logs` both equal
  main. Old-scenario reruns: `test_access_networks`, `test_access_keyring`,
  `lab_physical_pentest` (network beats): no regression, 0 console errors.
- RUNNING (2026-11-23, after the landing), five agents:
  1. Review page builder (Sonnet): writes `index.html` + `img/` + `build.py` in the session
     scratchpad `ops-review-page/` (gallery of the view states, 18 decisions with stable keys,
     Copy answers box, localStorage key `be-ops-build-review-v1`). WHEN IT REPORTS: read
     `index.html`, then publish with the Artifact tool (`file_path` the html, `files` mapping
     each `img/<name>.png`, `icon: "checklist"`, a one-sentence description); give the user
     the link. Republish the SAME path to update. The owner's answers come back pasted as
     `KEY (title): choice — note` lines: record them in the brief and act.
  2. Tidy, client (Sonnet, build tree): bolt fade, marks tests, three rarer landings, phone
     scroll-into-view; browser check on port 3012.
  3. Tidy, scanner/tests/docs (Sonnet, build tree): six groups incl. widening
     `ops-unchanged-validator` to hash rendered graph files (a deliberate re-record).
  4. L3 part A (Sonnet, `ops-logs`): network and share rows: events, call sites,
     `session_admitting`, tests; note `ops_logs_stream/HANDOVER_L3a.md`.
  5. Haiku reader: S5a build digest to the scratchpad `deps/S5A_BUILD_DIGEST.md` (steps,
     line ranges, shared files, MISMATCHES between the privilege plan and what S3 built, a
     split into builders).
- Next: tidy → a Sonnet delta review of both tidy passes (nothing in them touches access
  checks; if the reviewer finds otherwise, fable52L) → train → land. L3 part B (reader rows in
  `test_ops_logs`: a jack, an access point, a share; PLAYTEST; docs) → fable52L review →
  playtest → train → land. S5a: rule on the digest's mismatches, write builder prompts split
  as it suggests, then the usual loop. Gem bump for Hacktivity after the tidy lands
  (`bump-version` skill; Hacktivity repo; the user's standing "push as you go").
- POST-LANDING TIDY (one Sonnet pass per group, then a Sonnet delta; none blocks landing):
  client: the bolt does not fade with its sprite behind a wall (R4-1), `v !== false` vs
  truthiness (R4-2), three rarer landings of a world-opened remote view (R3-2), phone width
  (scroll Use and the message into view); scanner: shared host label must fail closed
  (R3-1), untested rules (R3-6), an unswept-block structural guard (R3-7), the file-order
  guard's two gaps (R4-5), other-game files (R4-6); tests: weak lines in
  `ops_access_scenario_test.rb` (R3-5), an S3 real-run scanner test (R3-4), the plan-named
  graph test and node-id fold (R3-8), marks tests (R4-3), widen `ops-unchanged-validator` to
  hash the rendered `.md`/`.html` graph files (needs a deliberate re-record); docs: stale
  paragraphs (R3-9), `HANDOVER_core_13b.md`; N-M1 (the log reader shows an ops row's detail as
  `service: service`) to the log stream; the test_ops_access script's beat 19 should name
  PRE-EXISTING network scenarios, not this build's own.
- Open questions for the user (collect on the review page): F4 outage (keyboard desktop
  served, no-route folders refused); a validator warning for room text naming a discovery
  host (proposed, not built); the recorder tag in `.claude/skills/playtest-scenario` (needs
  the user's word; agents may not edit skills); `no_grant` wording against the plan's; the
  tint edge case (fingerprint-view red); L2a lock vs session-end label; whether a replant
  should open the view; the log plan's four section-15 questions; server-enforced log flag
  as a later piece.
- **SECOND STREAM opened 2026-11-23: the log reader (L2a, then L2b, then L3)** in a third
  worktree `/data/be-ops-logs`, branch `ops-logs` (cut from main `11a274307`), brief
  `docs/agents/OPS_LOGS_STREAM_BRIEF.md` on that branch, notes and reviews in
  `docs/agents/ops_logs_stream/` there, ports 3014 to 3016. Chosen from the dependency digest
  (scratchpad `deps/OPS_PARALLEL_DIGEST.md`): L2a, L3, S5c and H1 have their code
  prerequisites on main; the log chain shares the fewest files with S2 and S3. NOT startable
  early per the digest: S5a, M1a, C1, K1 (need core S1 to S3), S5b (needs S5a and S7). The
  digest flagged plan conflicts to check when those stages start (who adds the `access:`
  parameter, S5a or core; H1 ordered after M3 though it needs none of S8a; K1 gated on S3).
  L2a BUILT there: server `b0d5e98a8`, client `c6f27c685`, scenario step `56bcadf16` (2
  validator sprite errors, in the client fixer's list). Reviews R1: server 0B 1M 12m
  (`01ecc36e2`), FIXED `1bf1527c5`, `7874c1d2a` (stored `flagged` marker); client 0B 5M 12m
  (`b75add8da`). Client R1 FIXED `e262b6848`, `5f07c654b`, `140aef76e`, `17f9b9054` (16 fixed; F1 measured
  before/after; m10 left: needs one line in `childExtras()`); server R2 + scenario first read
  `e36dec28c` (R1 fixes confirmed; 3M 12m, rulings in the stream brief); scenario/docs/tooling
  fixes `3ed1f9667`, `549dcd14f`, `c587d49c4`, `9ad9caee6`. R2 server and validator fixes `896e832d1`, `83b549392`, `c956f2f73`. R3 delta `0a7845fbc`:
  ready to land after the playtest, 8 minors; ruling: a door shows `door_sign` first.
  Playtest 13 of 13 (game 23; items P1 to P4 in `reviews/L2a_R3.md`, `09d1ad64b`: phone-width
  layout broken, lock and session-end rows read the same). **L2a LANDED on main and pushed: merge `e61cfe5ae`** (train at `904056402`: Rails 3911 runs
  0 failures, shell-x 184 checked 0 failed, smoke 0 failed, corpus 0 of 202, JS 999 of 1002
  with only the 3 baseline files failing). R4 findings filed on the log branch. The train
  tree is back on `ops-core`. `ops-build` has NOT merged main yet (see above). Questions for
  the user from L2a: lock and session-end rows read the same (a `LOCK` label is the least
  invasive fix); the plan's four section-15 questions were built as recommended. L2b BUILT (`1bed4cf2e` to `e1829f45a`; the builder
  reached 317k tokens: split L3). MY MISTAKE: my prompt said the flag must be judged on the
  server; the plan says the browser checks it, best effort. Review R1 `146bdc4de` (0B 2M 11m)
  showed the server-judged build enforced nothing and could lose a right flag. RETURNED TO
  THE PLAN: `62105c898` (route, policy, state, strips removed; shared engine files equal main
  again), `6c868d7f9` (viewer checks in the browser; done read from the action's global),
  `06aee2c62` (leak check), minors and docs to `0bf994549`. Playtest on the old build: 19 of
  19. RUNNING there: delta review R2 (fable52L; `reviews/L2b_R2.md`); Haiku rerun of beats 14
  to 19 on port 3014 (scratchpad `l2b-playtest-2/`). NEXT there: commit findings (check
  LENGTH); look at the flagged-row and toast screenshots; fix pass if needed; merge main,
  train in the train tree (detached), land; then L3 in two builders (events + calls and
  tests / scenario + playtest + docs). Old line: L2a client builder
  (`HANDOVER_L2a_client.md`), split by file. Next there: L2a item 5 (reader in
  `test_ops_logs`, PLAYTEST, docs A24 read side), fable52L review, fixes, Haiku playtest,
  then train: fast-forward is not possible from a side branch, so to train it, merge main
  into `ops-logs`, then in the train tree `git checkout --detach ops-logs` (or a temp branch),
  run the check, merge to main at that hash, push, and merge main into `ops-build`. Only one
  train runs at a time. No disk for a fourth worktree (/data about 7 GB free).

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

### 2026-11-23: after S2+S3 landed (main `6afbe1496`)

- Landed and pushed on main: L1a+L1b, S1, L2a, L2b, S2+S3 (core plan N13, N14, N15).
- Post-landing tidy on `ops-build`: client half done (`b70dc59bf` to `5a8522300`); scanner, tests and
  docs half in progress (`9b2ddd017` to `e284d81b0` so far, docs group still open). Next: Sonnet delta
  review of both halves, fast-forward the train tree, train, land, push, merge main into `ops-build`
  and `ops-logs`.
- S5a: brief committed (`532d55db4`, `docs/agents/ops_core_build/S5A_BUILD_BRIEF.md`). Unit 01
  (fixtures) runs alone before any engine edit, after the tidy hash is trained. Owner question O1
  (relay session and step-up to admin) is open; builders build "no".
- Log stream (`ops-logs`): L3 part A built (`400e7fd35`, `fee3415b0`, `4f311c7ad`), review R1 running;
  L3 part B (scenario, tests, beats, docs) being built.
- Review page for the user: built in the session scratchpad (`ops-review-page/`), screenshots being
  retaken, not yet published.


## Update 2026-11-24 (read this first; the sections above are history)

### Landed on main (all pushed; gem 1.0.18 in both repos)

Core N13, N14, N15 (S1 to S3), the log plan L1a, L1b, L2a, L2b and L3, the post-landing tidy of S2 and S3, then S5a
(privilege and accounts, merge `7adc7062c`), S6 (`ops-skin`), S8a (`ops-mfa`) and S7 (`ops-crack`, last fixes
`cb7ba4466`). The gem bump to 1.0.18 is `2d9e963c8`. Main is the base of the follow-up branch.

### Open stage branches (not yet landed)

| Stage | Branch | Worktree | Ports | Round now | Open findings |
|---|---|---|---|---|---|
| S5b and S5c (cached accounts, collect, domains) | `ops-priv2` | `/data/be-ops-logs` | 3014-3016 | scanner R2 and client R1 reviewed; R2-L1 and R2-L2 fixed (`df61c632b`, `beb18da47`) | scanner R2 had 2 majors (both fixed, unconfirmed) and 6 minors; client R1 had 3 majors and 8 minors: check that each has a fix commit before the delta round. Beat 16 (a borrow) is not reachable by clicking; the relay step-up card was not checked |
| S8b (helpdesk, H1 and H2) | `ops-helpdesk` | `/data/be-ops-build` | 3011-3013 | R3 done, playtest 2 done; R3 core fixes `a56f443ae` unconfirmed | core R3 had 1 major (fixed, unconfirmed) and 3 minors; scanner R3 has 3 minors open (the `;` form of an owner named twice among them); the audit log's fourth FAIL row is explained (beat 5's old-password refusal merged into beat 1's row by the ops log), PLAYTEST says so |
| S8c (second-step locks, G1 to G4) | `ops-lock2` | `/data/be-ops-skin` | 3017-3018 | R2 done (server 0B 0M 8m, client 0B 1M 7m, scanner 0B 2M 3m); client R2 fixes in (`341406b26`, `2980e7105`) | scanner majors open: the room half of the lock-below-a-closed-container rule is not done, and gated room NPCs raise a new false alarm; the server minors are open; then the delta round |

Train tree: `/data/be-ops-core` (detached), port 3021. Follow-up tree `/data/be-ops-follow`: ports 3022-3024. Never 3000, 3001, 3002, 3085, 3086.

Each needs: finish the open fixes, a delta review, a Haiku playtest, merge main in, a train, landing as below.

### Follow-up tracks (worktree `/data/be-ops-follow`, branch `ops-follow1`, from main `2d9e963c8`)

The owner's decisions are in the scratchpad file `FOLLOWUP_DECISIONS.md`; they are settled, do not reopen.
- Track A (S7 cracker): a cracked password fills on the sign-in screen; the cracker also opens from a hash file and the "Hash collected" toast; keep the auto-finish but make its words truthful.
- Track B (S6 view and validator): Terminal available for the life of the view; one span per cell; the whole verb shown for the move that ends a trip; playtest tools default to the Panels view; catalog rules (a script must not mirror an advisory id, advisories frozen once a shipped scenario links them, wider telltale words, tidy nicknames in docs); a validator warning for a container a player cannot open. Real advisory ids and module paths live only in `config/break_escape/realism_catalog/*.json` (append-only).
- Track C (tooling): fix `tools/playtest/train-check.sh` lock detection so it works on old and new git (keep `TESTS_LOCK` as an override); the recorder writes PC tags on sign-in, sign-out and resume rows and hash ids on crack rows (the owner approved editing the recorder under `.claude/skills/playtest-scenario/` for this).
- Held back on purpose: the scanner hardening that reads those tags (a later stage, after the recorder tags, because three stages still change the scanner on other branches; this track must not touch `access_leak_scanner.rb`); the `tools/wt-clean.sh` fix (not approved); the code device sprite (needs the art pipeline and the owner's pick).

### Landing procedure now

1. Merge main into the stage branch (merge, never rebase).
2. Train the merged hash with `TESTS_LOCK=/home/deploy/BreakEscape/tmp/tests.lock` set explicitly (the script cannot find it on this machine's git). It must end green apart from the known JS baseline files.
3. In `/home/deploy/BreakEscape`: `git merge --ff-only` the trained hash, then push.
4. Bump the gem in both repos (`bump-version` skill) and push.
Never wrap `bin/ops-golden-compare` in `flock`. One train at a time.

### Disk rules

The root volume is nearly full (it has filled once and cut off two builders). Bulk scratch (anything over about 20 MB: captures, screenshots, run output) goes under `/data/tmp/scratch/<unit>/`, deleted afterwards. Never copy or clone the repository. Empty `test/dummy/log/*.log` before a train. Builder rules are in `BUILDER_RULES.md` (scratchpad): explicit-path commits, no amend, no `git add -A`, tests on the shared lock.

### Model routing (AGENTS.md "Choosing a model")

Opus 5.5 for planning, design and first reviews. Sonnet for fixers, clear builds and delta reviews from round 4 or after a clean Opus round; a delta that touches what the server serves, access checks or secrets goes to Opus. Haiku for scripted playtests and retrieval. Every builder gets the 150k-token handover line. Never send a message to a builder running inside a workflow: it starts a second copy. A finished agent that sends its report twice is stopped.

### Decisions taken by the orchestrator on reviewers' owner questions (the owner may overturn any)

The owner's own answers (decisions form, 2026-11-24) include: S5A-1 an admin session at a governed PC can override the USB policy through its port (`portOf`, built in S5bc unit 11); S5A-2 a relayed session has the relayed account's rights (unit 02); S5A-3 a validator warning for unopenable containers (follow-up Track B). The orchestrator then decided:

- S8c: a carried locked container gets an "Unlock" entry in the inventory tray menu (rather than making the briefcase not droppable).
- S8c: the answer that opens a gated lock names it (`targetType`, `targetId`), for gated locks only.
- S8c: G4 (refusing a hand-built request for a carried container that has left the player) is in force for gated scenarios only; inert elsewhere, so shipped scenarios are unchanged.
- S8c: a pane that passes on its first answer says nothing extra; the lock opening is the feedback.
- S8c scanner: the open of a locked room with no objects and no NPCs is not judged (nothing in it to protect); a prompt or approve refusal accepts any push-kind gate (judged sound in R2).
- S8c and S8b scanners: telling a cancelled PC step from a cancelled lock step, and the stop rule's dependence on playtest order, wait for the recorder tags (Track C) and the later scanner hardening stage.
- S8b: the reset password appears at once as a "Reset" entry in the capture log's Sign-ins list and fills on the sign-in screen.
- S8b: unknown usernames behave exactly as real accounts; try entries lapse after five quiet minutes, a live entry is never dropped, the cap is per desk, and a full desk judges nobody (R3-CORE1).
- S8b: sticky notes and overheard logins keep giving the old password after a reset; it is refused at sign-in. An account's old cracked entry stays listed after a reset and is refused likewise.
- S8b: a form send that gets no answer times out after 15 seconds; Close and Send work again.
- S8b scanner: the helpdesk rules may only make the S8a rules stricter (turn checking on, mark pairs unknown), never excuse an answer.
- S5bc scanner: a proved typed sign-in success earns that account's username; nothing else does. The server adds `pcId` to the collect answer.
- S8a scanner: a sign-out then sign-in at one PC with no reload cannot be cleared by entries until the recorder tags the PC (Track C, then the hardening stage).

### Recorded limits each stage will land with

- S5b/S5c: two borrowers at one PC share the done proof; admin log rows are earned by any earlier admin session at that PC (no timing); a harvested hash row is flagged when its collect is in an earlier capture file or its body was lost.
- S8b: Close is held until the desk answers (a request that never answers keeps the form open); the stop rule depends on playtest order.
- S8c: the test bridge's tray hint still lists only "Drop here" and "Examine", and the carried-item click listener is a pinned copy of two lines of `inventory.js`; the takeable-object limit above.
- S8a (landed): the sign-out and sign-in scanner limit above.

## Waiting on the user

- Nothing yet. Later: card art for `technique_card.png`; the final screenshot review.
