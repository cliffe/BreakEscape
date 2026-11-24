# Ops follow-up, track C (tooling): build brief

Worktree `/data/be-ops-follow`, branch `ops-follow1`. Read `BUILDER_RULES.md` (session scratchpad) first.
This track changes two tools and nothing a player sees. Sonnet builds, one commit per unit by explicit
path, message starting `Ops follow-up C unit <n>:`.

**One rule in BUILDER_RULES is lifted for this track only.** The owner approved editing the playtest
recorder, so units C2 and C4 may edit exactly `.claude/skills/playtest-scenario/scripts/response-capture.js`
and `.claude/skills/playtest-scenario/SKILL.md`. No other file under `.claude/` is touched.

## Decisions (settled; do not reopen)

1. **Train lock.** `tools/playtest/train-check.sh` finds the shared test lock on old and new git; `TESTS_LOCK` still overrides.
2. **Not approved, leave alone:** `tools/wt-clean.sh`. **Not now:** the code device sprite.
3. **Recorder tags.** The recorder writes the PC id on sign-in, sign-out and resume rows and the hash id on crack rows, as tags. No request bodies.
4. **The leak scanner is not changed.** `tools/playtest/lib/access_leak_scanner.rb` and `tools/playtest/access-leak-check.rb` stay byte for byte as they are. Reading the tags is a later hardening stage.

## What the code does today

- **Lock path.** `tools/playtest/train-check.sh:63` runs `git -C "$WT" rev-parse --path-format=absolute --git-common-dir`.
  This machine has git 2.25.1, which does not know the flag: it prints the flag back as a first line, then the
  path, and exits 0. `dirname` then fails on the two-line text and prints nothing, so `TESTS_LOCK` becomes
  `/tmp/tests.lock`, a private file, not `/home/deploy/BreakEscape/tmp/tests.lock`. Line 49 has the same fault:
  `BUNDLE_PATH` becomes `/vendor/bundle` in a worktree with no `.bundle/config`.
  Lines 66 to 72 take the lock or, for `TESTS_LOCK=none`, warn. Header lines 9, 10, 34 and 35 describe it.
- **Recorder.** `.claude/skills/playtest-scenario/scripts/response-capture.js` writes one line per JSON answer.
  It tags two kinds of row from the request body: `npcId` on `/feed_post` (`feedPostNpcId`, line 51) and `inv`
  on `POST /inventory` (`inventoryTag`, line 74), wired in `onResponse` (lines 144 to 163). Sign-in, sign-out,
  lock, second-step and crack rows carry no tag. `playtest-session.js:86` and `:213` wire the module in.
- **What the requests send** (the fields the tags read): `api-client.js:185`, `:338` (`POST /login`, `pc_id`),
  `:270` (`POST /logout`, `pc_id`), `:278` (`POST /lock_session`, `pc_id`), `systems/mfa-client.js:69`
  (`POST /mfa/verify`, `/mfa/prompt`, `/mfa/approve`, `pc_id`, or `target_type` and `target_id` for a subject that
  is not a PC), `minigames/ops-cracker/ops-cracker-model.js:121` (`POST /crack`, `hash_id`). The controller reads
  the same names: `games_controller.rb:1533`, `:1598`, `:1615`, `:1648`, `:1669`, `:1687`, `:2059`.
- **Scanner, as it stands.** It honours a row key `login: { pcId }` (`access_leak_scanner.rb:2974`, `:4233`) but
  `hand_tag_problem` (`:338`) refuses any capture that holds a `login` key, and `access-leak-check.rb:150` exits 2
  on it. It reads no row key named `pc` or `hash`.

## Design choice this brief makes (flagged for the owner in the stage report)

The recorder must **not** write the key `login`. If it did, every capture made from now on would be refused by
the unchanged scanner, on this branch and on the three branches still changing it. So the tags go under two new
keys the scanner does not read today:

- `pc` on `POST` rows whose path ends `/login`, `/logout`, `/lock_session`, `/mfa/verify`, `/mfa/prompt` or
  `/mfa/approve`: `{ "pcId": "<id>" }`, or `null` when the id cannot be read.
- `hash` on `POST` rows whose path ends `/crack`: `{ "hashId": "<id>" }`, or `null`.

"Resume rows" is read as the rows that end or restart use of a held session by request: the lock
(`POST /lock_session`), the sign-in that follows it (`POST /login`) and the second-step rows. The desktop row a
`--resume` entry names is a `GET /container/<pc>`: the PC is already in its path and a GET has no body, so it
gets no tag.

## Wave 1 (four units, disjoint files, built side by side)

### C1. Train check finds the shared lock on any git

**Files:** `tools/playtest/train-check.sh`; new `test/js/train-check-lock-path.test.mjs`;
`docs/achitechture/TRAIN_CHECK_BUILD_LOG.md` (append one dated entry at the end; change nothing above it).

**Build:**
- Add one shell function near the top, used by both line 49 and line 63, that returns the main checkout:
  run `git -C "$WT" rev-parse --git-common-dir` (no `--path-format`); if the answer does not start with `/`,
  put `$WT/` in front; `cd` into it and take `pwd`; the main checkout is its parent. Old git answers `.git`
  in the main checkout and an absolute path in a worktree; new git may answer either. All three must work.
- Fail closed. If git fails, or the result is not an existing directory, print
  `cannot work out the main checkout from <worktree>: set TESTS_LOCK` to stderr and exit 2. A train never runs
  on a guessed or empty lock path. For `BUNDLE_PATH` the same failure also exits 2.
- `TESTS_LOCK` set to a path is used as given; `TESTS_LOCK=none` keeps today's warning and `NOLOCK_WARN`.
- Add a dry mode for the test and for people: with `TRAIN_CHECK_PRINT_LOCK=1` the script validates its
  arguments as now, works out the two paths, prints exactly two lines to stdout, `TESTS_LOCK=<path or none>`
  and `BUNDLE_PATH=<value or (unset)>`, and exits 0 before `exec 9>`, before `flock`, before any server, game
  or test. It creates no lock file in this mode.
- Update the header comment (lines 9, 10, 34, 35) to say how the default is found and name the dry mode.
- Nothing else in the script changes: steps, verdict lines, exit codes 0, 1, 2, 3, port rules.

**Tests** (`test/js/train-check-lock-path.test.mjs`, node, runs the real script with `spawnSync('bash', ...)`
and `TRAIN_CHECK_PRINT_LOCK=1`; a port such as 3999; `TESTS_LOCK` and `BUNDLE_PATH` removed from the child's
environment unless the case sets them):
1. A throwaway repository made in `mkdtempSync` with real git (`git init`, one commit with
   `-c user.name=t -c user.email=t@example.invalid`, then `git worktree add`): run with the **worktree** as
   `<worktree>`; `TESTS_LOCK` is `<main>/tmp/tests.lock` and `BUNDLE_PATH` is `<main>/vendor/bundle`
   (compare with `realpathSync` on both sides).
2. The same with the **main checkout** as `<worktree>` (git answers `.git`): the same two paths.
3. `TESTS_LOCK=/some/where/x.lock` is printed unchanged; `TESTS_LOCK=none` prints `none`.
4. A worktree holding `.bundle/config`, or `BUNDLE_PATH` already set: `BUNDLE_PATH` is not replaced.
5. A newer git, stood in for by a small `git` script first on `PATH` that answers `--git-common-dir` with the
   absolute path and passes every other call to the real git: same result as case 1. This shim is the only
   stand-in allowed, because this machine has no newer git; say so in a comment.
6. A `git` script that exits 128, and one that prints an empty line: exit 2, the stderr text above, no output
   on stdout, and no file named `tests.lock` created anywhere under the temp folder or at `/tmp/tests.lock`
   newer than the test's start.
7. The source no longer contains `--path-format`; no output line holds a newline inside a path or starts with `-`.
8. Dry mode leaves no lock file and starts nothing: the temp folder holds no `summary.txt`.
Remove the temp folders in `after`. The test must not run a real train, start a server or touch a reserved port.

**Stays unchanged:** `test/js/shell-x-check.test.mjs` passes as before; `bash -n tools/playtest/train-check.sh` is clean.

**Done:** the test file passes with `bin/test-js test/js/train-check-lock-path.test.mjs`; on this machine
`TRAIN_CHECK_PRINT_LOCK=1 tools/playtest/train-check.sh /data/be-ops-follow /data/tmp/scratch/follow-c1/out 3999`
prints `TESTS_LOCK=/home/deploy/BreakEscape/tmp/tests.lock` and `BUNDLE_PATH=/home/deploy/BreakEscape/vendor/bundle`.

### C2. Recorder writes the `pc` and `hash` tags

**Files:** `.claude/skills/playtest-scenario/scripts/response-capture.js`; `test/js/playtest-session-capture.test.mjs`.

**Build:**
- Add `pcTag(request, url = null)` and `hashTag(request, url = null)` beside `inventoryTag`, in the same
  style: never throw; read `request.postData()`; parse as JSON; anything else gives `null`.
  - `pcTag` returns `{ pcId }` when the body is a JSON object whose `pc_id` is a non-empty string of at most
    200 characters and the body names neither `target_type` nor `target_id`. Otherwise `null`.
  - `hashTag` returns `{ hashId }` when `hash_id` is a non-empty string of at most 200 characters (the
    controller's own limit, `games_controller.rb:2062`). Otherwise `null`.
  - Each declines (`null`) when the URL's query names a field the route reads, because Rails lets the query
    beat the body: `pc_id`, `target_type`, `target_id` for `pcTag`; `hash_id` for `hashTag`. Use the same
    kind of pattern as `INVENTORY_QUERY_RE` (split on `?`, `&` and `;`, decode first).
- In `onResponse`, for `POST` only: set `pc` on a path ending `/login`, `/logout`, `/lock_session`,
  `/mfa/verify`, `/mfa/prompt` or `/mfa/approve`; set `hash` on a path ending `/crack`. Like `inv`, the key is
  present on every such row and is `null` when unreadable; it is absent on every other row. Match the whole
  last path segments (`/login_accounts` and `GET /mfa/device` are not tagged).
- The tag holds the one id and nothing else. Username, password, `credential`, `claim`, `foothold`, `from`,
  `relay`, `number`, `deny`, the typed code and `facts` are never written.
- Write order in the line: after `inv`, before the body. Export the two functions. Extend the header comment
  (the line shape on line 7 and a paragraph like the `inv` one) and say plainly that the key is `pc`, not
  `login`, and why (the scanner refuses a `login` key until it is taught to read recorder tags).
- Do not touch `playtest-session.js`, `typed-redact.js` or any other script.

**Tests** (extend `test/js/playtest-session-capture.test.mjs`; it already drives the real module through its
`res()` helper, which is the only stub: a Playwright response object). Answer bodies come from real captured
rows, read from the fixtures, not written by hand: `test/fixtures/files/ops_privilege_browser_run_1.jsonl`
(`POST login`, `logout`, `lock_session`) and `test/fixtures/files/ops_mfa_real_capture_rows.jsonl`
(`POST mfa/*`). No crack answer exists as a fixture row, so the crack rows use a body from the same file for
the answer and the test says so; the tag never depends on the answer.
1. Each of the six PC routes with the body its client builds (see "What the requests send") gets `pc: { pcId }`.
2. `POST /crack` with `{ hash_id, facts }` gets `hash: { hashId }`.
3. Nothing but the id is written: a line whose request held a marker password, username, credential object,
   number and facts does not contain any of those markers anywhere in the file text.
4. `null`, with the key present, for: `postData` null, empty, form-encoded, a JSON string, `null`, an array, a
   throwing `postData`; `pc_id` or `hash_id` missing, empty, a number, an object, or 201 characters long; a
   body naming `target_type` or `target_id`.
5. `null` when the query names the field (`?pc_id=x`, `?x=1;pc_id=y`, `?hash_id=z`, `?target_type=a`); an
   unrelated query name does not decline.
6. Not tagged at all (key absent): `GET` on the same paths, `GET /login_accounts?pc_id=x`, `GET /mfa/device`,
   `GET /mfa/phone`, `POST /unlock`, `POST /inventory` (which keeps `inv` exactly as before), `/feed_post`
   (which keeps `npcId`).
7. No row ever carries a key named `login`.
8. Every existing test in the file passes unedited.

**Done:** `bin/test-js test/js/playtest-session-capture.test.mjs test/js/playtest-typed-redact.test.mjs` passes.

### C3. The unchanged scanner reads tagged captures exactly as before

**Files (both new; no existing file is edited):**
`test/controllers/break_escape/recorder_tags_scanner_mfa_test.rb`,
`test/controllers/break_escape/recorder_tags_scanner_crack_test.rb`.

**Build:** tests only. They prove decision 4 holds in practice: a capture from the new recorder is accepted and
judged the same by today's scanner. The tag format is fixed by this brief, so C3 does not wait for C2.
- `recorder_tags_scanner_mfa_test.rb` (`ActiveSupport::TestCase`): load
  `test/fixtures/files/ops_mfa_real_capture_rows.jsonl` and the `scenarios/test_ops_mfa` scenario the way
  `access_leak_scanner_mfa_r2_test.rb:10` to `:30` does (copy the three small helpers; do not require that
  file). Scan all rows in `n` order with its `NAMES` sign-ins. Then give every `POST` row on the six PC routes
  `'pc' => { 'pcId' => <the PC> }` (and one run with `'pc' => nil`), scan again with a fresh scanner, and assert:
  `AccessLeakScanner.hand_tag_problem` is nil; the findings (line, rule, owner, route) and `unused_entries`
  are equal to the untagged run's. Repeat on `ops_privilege_browser_run_1.jsonl` plus `_2` with the scenario
  and sign-in list `access_leak_scanner_privilege_real_test.rb:24`, `:115` and `:178` use, if that setup can be
  reused in under about 30 lines; if not, say so in the reply and leave it to the reviewer.
- `recorder_tags_scanner_crack_test.rb`: subclass `OpsCrackScannerRealAnswersTest`
  (`ops_crack_scanner_real_answers_test.rb`). Override `post` to call `super`, then, when the path ends
  `/crack`, set `captured.last['hash'] = { 'hashId' => <params hash_id> }`. The inherited whole run and its
  teardown then prove that honest play with tags gives no finding and every mutation is still a finding. Add
  one assertion that at least nine captured rows carry the tag.
- No test prepends to, aliases or redefines a method on an application class. Overriding `post` on the
  test's own subclass is not that.

**Tests:** `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test` on the two new files, then on
`access_leak_scanner_mfa_r2_test.rb`, `ops_crack_scanner_real_answers_test.rb` and
`access_leak_scanner_privilege_real_test.rb`, which must pass unedited.

**Done:** both files pass; `git diff --stat` shows no change under `tools/playtest/`.

### C4. Recorder docs

**Files:** `.claude/skills/playtest-scenario/SKILL.md` only.

**Build:** in the options table, extend the `--capture-responses` row (line 336) to name the two new tags in
one clause. In "Access model checks" (line 340 on), add one short paragraph: which rows carry `pc` and `hash`,
that a tag is the request's own word for the PC or hash record, that it is `null` when the request could not be
read, that nothing else from the request is stored, and that `access-leak-check.rb` does not read the tags yet,
so `--signin`, `--logout` and `--resume` entries are still needed exactly as each scenario's `PLAYTEST.md`
says. Do not add the tag to any command example. Under 12 added lines. UK English, plain words.

**Tests:** `bin/test-js test/js/playtest-session-capture.test.mjs` (it reads the skill's scripts; must still pass).

**Done:** the two places read correctly against the brief's tag format; no other line of the skill changes.

## Lessons built in (every unit)

- Tests drive the real script and the real module. The only stand-ins are the Playwright response object the
  capture test already uses and the `git` shim in C1 case 5 and 6.
- No new static JS import is added to the game, so no harness copy list changes. If a builder finds it needs
  one, stop and report.
- No scenario, catalogue, validator, server or client game file is edited. `bin/ops-golden-compare` (never
  under flock) must be clean at the end of the wave; the orchestrator runs it once after all four commits.
- No exploit content; test ids are plain made-up names (`front_pc`, `hash_a`). Bulk scratch goes under `/data/tmp/scratch/follow-c<unit>/` and is removed at the end.

## Click path

None. No unit changes anything a player sees or does; no scene, overlay, wording or route changes.

## Playtest outline for the stage (Haiku, scripted, after the wave lands)

Own games only, made with `tools/playtest/new-game.rb` in the run, on a keyless server on a free port that is
not 3000, 3001, 3002, 3085 or 3086.
1. `scenarios/test_ops_mfa/PLAYTEST.md` as written, with `--capture-responses`. Check in the capture: every
   `POST login`, `mfa/*`, `lock_session` and `logout` row has `pc` with the PC the step was done at; no row has
   `login`; the file text holds no typed password or code other than inside an answer `body`.
2. `scenarios/test_ops_crack/PLAYTEST.md` up to the first finished crack. Every `POST crack` row has `hash`
   with the record's id.
3. Run `access-leak-check.rb` on each capture exactly as that `PLAYTEST.md` says. Then strip the `pc` and
   `hash` keys into a copy and run it again. The two outputs and exit codes must be the same.
4. `TRAIN_CHECK_PRINT_LOCK=1` from this worktree and from the main checkout: both print the shared lock.
5. The orchestrator's next real train runs with no `TESTS_LOCK`; while it runs,
   `flock -n /home/deploy/BreakEscape/tmp/tests.lock true` must fail, and no new `/tmp/tests.lock` appears.

## What the later review must check

- `git diff main...HEAD --stat` touches only the files named above; `access_leak_scanner.rb`,
  `access-leak-check.rb`, `tools/wt-clean.sh` and `playtest-session.js` are unchanged.
- C1: break the function on a copy (put `--path-format=absolute` back) and see the test fail; the failure
  path exits 2 and never falls back to an unlocked or private lock; `TESTS_LOCK` override and `none` still work;
  the script is otherwise the same line for line.
- C2: remove each guard on a copy (the query check, the 200 limit, the `POST` check) and see a test fail; read
  the written lines for any request field other than the id; confirm a hostile body (a long string, a nested
  object as `pc_id`) gives `null`, not a dump.
- C3: the tests fail if `hand_tag_problem` is made to refuse `pc` (proves they would notice a scanner change).
- Docs say the scanner does not read the tags yet.
- Golden compare clean; the two Rails files and the capture test pass in the full train.

## Hand to

- **Later scanner hardening stage** (owns `access_leak_scanner.rb`, `access-leak-check.rb` and their tests):
  read `pc` and `hash`; decide whether the old `login` key and `hand_tag_problem` are retired or kept for
  hand-edited files; check a tag against the desktop that follows; close S8a_R5 points 7 and 9 and
  S8a_scanner_R2 R2-L1, R2-L2, R2-L9. Until then each `PLAYTEST.md` keeps its `--signin` entries.
- **Owner:** confirm the key names `pc` and `hash` and the reading of "resume rows" above.
- **Owner:** `/tmp/tests.lock` is the stray private lock earlier trains used; it can be deleted once no train
  started before this stage is still running. `AGENTS.md:201` already describes the right default and needs no edit.
- **Not this track:** `tools/wt-clean.sh`; the code device sprite.
