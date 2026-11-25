# Scanner hardening with recorder tags: build brief

Worktree `/data/be-ops-skin`, branch `ops-hardening`, cut from `main` `0402ed2be` (1.0.22). This brief is the branch's first
commit. It is the stage plan after five design review rounds (Review log at the end; round 5 was the cap), with the units
laid out as waves for building. Sections 1 to 3 and 5 to 9 below are the plan as reviewed; "Waves and units" replaces the
plan's unit table.

Kind of work: lab/demo/test tooling for the ops layer (the playtest leak check). Nothing a player sees changes, except the
optional server key in U4. Aim: the leak check never passes a leak, and an honest scripted run passes without the tester
naming PCs by hand.

## Decisions (settled; do not reopen)

1. The scanner reads the recorder's `pc` and `hash` tags (section 3). The recorder (`response-capture.js`) is final and is not
   edited.
2. Tagged captures take no `--signin` and no `--logout` (exit 2 if given). `--resume` stays in both modes. Untagged captures
   need `--untagged` in the CLI and keep their entries (section 8).
3. The cross-PC refutation stays, on its own over-counting present map ("present now" wording, R5-m3). A sessions map that
   shows no session at a tagged PC is an end, never a refutation (R5-1). Only a `success: true` sign-in answer opens a window
   (R5-m1).
4. Owner questions (section 9) take the recommended answer until the owner says otherwise, **except question 1**: U4 (the
   server key `routeRoom`) is built only after the owner says yes. Without it U3's K1 reader is inert, and that is fine.
5. Recorded residuals (section 2.4) stay recorded; no unit closes them.

## Rules for every builder

- Sonnet unless the unit says otherwise. Start fresh from this brief plus the previous unit's handover note where one is named.
- Find every function by name (`grep -n "def <name>"`), never by line number. Only the line numbers in the plan header block
  and in the round 3 to round 5 log entries are on `0402ed2be`; the rest are a guide.
- "Scanner" is `tools/playtest/lib/access_leak_scanner.rb`; "CLI" is `tools/playtest/access-leak-check.rb`; "lock rules" is
  `tools/playtest/lib/lock_step_leak_rules.rb`.
- Touch only the files your unit lists. Re-read a shared file just before editing it (units of different waves share the
  scanner).
- Commit with explicit paths: `git commit -m "Ops hardening <unit>: <what>" -- <paths>`. Never `git add -A` or `git add .`.
- Tests: `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>` from `/data/be-ops-skin`. Never
  `ruby -Itest`. No `db:` tasks. Run only your own unit's tests plus any file you changed; the train runs the whole set.
- Past about 150k tokens, write `docs/agents/ops_core_build/HANDOVER_HARDEN_<unit>.md` (what is done, what is left, the
  base commit) and stop.
- No exploit content. Test ids are plain made-up names (`front_pc`, `hash_a`). Scratch goes under
  `/data/tmp/scratch/harden-<unit>/` and is removed at the end.
- Each "fails on `main`" claim is checked by running the new test against `git show main:tools/playtest/lib/access_leak_scanner.rb`
  (or the lock rules) in a scratch copy, and the result is written in the commit message.

## Waves and units

Units in one wave touch disjoint files and may be built side by side in the one worktree. A unit that "needs" another unit
of the same wave codes against the API named in section 3.1 and runs its tests only after that unit's commit has landed.

| Wave | Units | Files touched (disjoint inside the wave) |
|---|---|---|
| 1 | U1a, U3, U5, U6, (U4 if owner question 1 is yes) | scanner + two `recorder_tags_scanner_*` tests + one new test; lock rules + one new test; CLI + one new test; `test/fixtures/files/access_leak/tagged/`; `games_controller.rb` + its tests + `ops_unchanged` fixtures |
| 2 | U1b, U7 | scanner + one new test; the nine existing tag-setting test files |
| 3 | U2 | scanner + one new test (+ crack parts of `recorder_tags_scanner_crack_test.rb` if U1a left them) |
| 4 | U8, then the review (section 7), then the train | docs, PLAYTEST files, `SKILL.md`, scanner and lock rules header comments, `HARDEN_limits.md` |

The scanner is edited in waves 1 to 4 by exactly one unit per wave (U1a, U1b, U2, U8), in that order, never in parallel.

### Wave 1

#### U1a. Modes, refusals, and the `pc` tag in the privilege rules

**Model:** Sonnet. **Needs:** nothing.

**Files:** `tools/playtest/lib/access_leak_scanner.rb`; rewrite
`test/controllers/break_escape/recorder_tags_scanner_mfa_test.rb` and
`test/controllers/break_escape/recorder_tags_scanner_crack_test.rb` (today they assert that the scanner ignores the tags and
call `hand_tag_problem`; they now assert the new reading and `tag_problem`); new `test/unit/access_leak_scanner_tags_mode_test.rb`.

**Build:**
- 3.1 in full: the two tag-bearing route lists (copied from `response-capture.js` `PC_ROUTE_RE` and `CRACK_ROUTE_RE`, with a
  pin test that reads the recorder source); a file's mode; `AccessLeakScanner.tag_problem(files, mode)` replacing
  `hand_tag_problem` (top-level `login` refused, `pc`/`hash` on the wrong route refused, malformed values refused, mixed files
  and mixed runs refused); `scan(..., tags: :auto)` with `:required`/`:absent`/`:auto`; `ArgumentError` for a refusal and for
  `signins:`/`logouts:` given with a tagged file; `@tags_on`; `row_pc_tag(row)` and `row_hash_tag(row)` (nil when `@tags_on`
  is false). Keep `hand_tag_problem` as a thin alias only if the CLI still calls it before U5 lands; U5 removes the call.
- 3.2 for the privilege rules: `priv_signin_candidates` reads `row_pc_tag` in place of `login`, accepted only at a PC that
  admits `npcId`; the rejected-tag rule (`[admitting, false]`, `ops_tag` finding); `priv_logout_pcs` reads the tag
  (P3; `null` ends every PC); the lock row ends the tagged PC (P6; `null` and no answer `pcId` ends every PC); the 3.3
  cross-check of a `lock_session` answer's `pcId` against the tag. `mfa_row_pc_tag` keeps its name and calls `row_pc_tag`.

**Tests:** in the new mode test and the two rewrites: T1, T2 (library `:auto` half), T3, T4, T5, T8 (library half), T10,
T16; T6b's privilege half (finding, no `admin:<pc>`, the take-back of a step held at an admitting PC); P1, P3, P6 and P12
closures each with a "clean now" case and a "fails on `main`" record; the route-list pin; a query-beats-body row (`pc: null`)
treated as unplaced. Then run every existing `test/unit/access_leak_scanner_*` and `test/controllers/break_escape/*scanner*`
file: all pass with assertions unchanged under `:auto` except the files U7 owns, which may fail only where a hand-set
`login` key is now refused (list them in the handover note for U7).

**Done:** one commit; the new and rewritten tests pass; the untagged real fixtures (5.3) give the same findings as on `main`;
`docs/agents/ops_core_build/HANDOVER_HARDEN_U1a.md` records the base commit, the API as built (`@tags_on`, `row_pc_tag`,
`row_hash_tag`, `tag_problem` signature), and the U7 failure list.

#### U3. Lock rules: P11 and K1

**Model:** Sonnet. **Needs:** U1a's `@tags_on` and `row_pc_tag` (code against 3.1; run tests after U1a's commit).

**Files:** `tools/playtest/lib/lock_step_leak_rules.rb`; new
`test/controllers/break_escape/access_leak_scanner_lock_step_tags_test.rb`.

**Build:** 3.5. P11: `ls_pc_owns?` takes the row; in a tagged run an answer is the PC's only when the row's tag names a PC
with an open step of a kind the route serves, and a `null` tag is never the PC's. K1: `ls_note_rooms` treats an answer with
`routeRoom: true` as shut and un-marks it; the room re-opens only by a door open that proves it (as today) or a 200
`POST /unlock` `type: 'object'` answer whose gated-lock echo names a non-door subject id of exactly that room, matched
against `@ls_room_ids[room]` **less every id that is, or sits inside, a `takeable` or `needsTag` object at any depth** (R5-m2).
`@ls_room_ids` itself and the door proof stay as they are. A `GET room` opens nothing new. Untagged runs keep today's P11 rule.

**Tests:** T14, T15 (on rows from real server answers if C4 is not yet recorded, tagged by the recorder's rule); T17, T17b,
T17c, T17d with a synthetic scenario built in the test (a route room plus a lock step), including the nested `takeable` case
of T17d; a check that the K1 reader is inert on answers without the key (every existing lock-step test file passes
unchanged). Each new finding case also run against `main`'s lock rules and recorded.

**Done:** one commit; new tests pass; `test/controllers/break_escape/access_leak_scanner_lock_step*_test.rb` pass unchanged.

#### U5. CLI: modes and refusals

**Model:** Sonnet. **Needs:** U1a's `tag_problem` and `tags:` keyword (run tests after U1a's commit).

**Files:** `tools/playtest/access-leak-check.rb`; new `test/unit/access_leak_check_cli_tags_test.rb`.

**Build:** `--untagged` (passes `tags: :absent`); default `tags: :required`; `tag_problem` called in place of
`hand_tag_problem` (exit 2 with its string); `--signin`/`--logout` with a tagged file exit 2; `--resume` allowed in both
modes; usage text (`:79-81` as a guide) and the header (`:1-75` as a guide, including the `login` refusal line) rewritten
for the modes, the refusals and which entries go with which mode.

**Tests:** drive the real script (as `test/unit/access_leak_scanner_test.rb` and `access_leak_scanner_ops_real_test.rb` already do): T1 to T5 and T16 exit 2; T2 (all tags stripped) exits 2
without `--untagged`; T8 exits 2; an untagged real fixture with `--untagged` and its usual entries gives `main`'s output; a
tagged fixture with `--resume` runs; `unused_entries` still exits 2.

**Done:** one commit; new test passes; those two existing files pass (any case that runs untagged fixtures with entries get
`--untagged` only if they shell out with a tag-bearing untagged file, and each such change is listed in the commit message).

#### U6. Real tagged captures

**Model:** Haiku (a Sonnet run checks any "stuck"). **Needs:** the cut only.

**Files:** `test/fixtures/files/access_leak/tagged/*.jsonl`; `test/fixtures/files/access_leak/tagged/README.md`.

**Build:** record C1 to C5 (section 5.1). Each capture follows its scenario's own `PLAYTEST.md` setup: keyless server from
`/data/be-ops-skin` on that file's port range (never :3000, :3001, :3002, :3085 or :3086; `test_ops_mfa`,
`test_ops_privilege`, `test_ops_crack` use 3011 to 3013, `demo_ops_second_step` uses :3023, `demo_ops_passwords` a free port
the orchestrator names), games made with `swap-scenario-game.rb` and the host scenario that file names, never `new-game`.
`--capture-responses` on. Add the extra beats in 5.1's table where they can be driven (C1's two-PC order needs two panes or
the bridge; C2's claim sign-in for P12; a claim or relay sign-in followed by a reload before its desktop, for T6m, if any
scenario offers one). C5 is any one run on the 1.0.20 recorder (untagged).

**Tests:** none of its own. For each capture: `verify-run.rb --access` matches its `PLAYTEST.md` record. The leak check
itself is run in wave 4 (the scanner is not yet tag-aware in wave 1).

**Done:** one commit of the fixtures and the README. The README lists per file: scenario, game id, date, port, the
`/data/be-ops-skin` commit, the recorder commit, which beats were driven, and which were not (those fall back to
server-answer tests in U1b, U2 and U3, as 5.1 allows).

#### U4. Server key `routeRoom` (only if owner question 1 is yes)

**Model:** Sonnet; its review is Opus. **Needs:** the owner's yes.

**Files:** `app/controllers/break_escape/games_controller.rb` (the `GET room` branch, about `:584-598`, and the route-room
door-open answer); its controller tests (a new `test/controllers/break_escape/route_room_key_test.rb`); any golden or
unchanged-answer fixture that pins those two answers (grep `test/fixtures/files/ops_unchanged` and `bin/ops-golden-compare`).

**Build:** add `routeRoom: true` to both answers only while `in_npc_route_room?(room_id) && !unlockedRooms.include?(room_id)`
(the predicate of `object_in_unpromoted_route_room?`, `game.rb:337-342`); never in the both-lists interim. No other answer
changes.

**Tests:** the key present while unpromoted, absent after promotion, absent in the interim, absent for a non-route room;
`bin/ops-golden-compare` (never under flock) clean after the fixture updates; the payload scan and opened-state scan green.

**Done:** one commit; tests pass; the commit lists every fixture changed and why.

### Wave 2 (after U1a has landed)

#### U1b. Second-step rules and the tag refutation rule

**Model:** Sonnet, fresh, from `HANDOVER_HARDEN_U1a.md`. **Needs:** U1a.

**Files:** `tools/playtest/lib/access_leak_scanner.rb`; new `test/unit/access_leak_scanner_tags_mfa_test.rb`.

**Build:**
- 3.2 for the second-step rules: `mfa_place_signin` places a tagged sign-in (`@mfa_at`, and `@mfa_placed` like a confirmed
  name; no test relies on the `@mfa_placed` write); the rejected-tag rule (`@mfa_row_pcs = @priv_pcs.keys`,
  `@mfa_row_clear = mfa_admitting_pcs(npc)` or every PC); `mfa/verify`, `mfa/prompt`, `mfa/approve` rows placed at their
  tag; `mfa_count_wrong_code` reads `pc`; `mfa_verify_lockout_proved?` takes the row and, with a tag, uses the open code step
  at the tagged PC (P8 b); `@mfa_locked` still from the answer's `pcId`, cross-checked against the tag; in a tagged run the
  `mfa_required_answer_ok?` mismatch is replaced by one `ops_tag` finding.
- 3.3 in full, as a new tag rule that reads only the "what does this desktop show" helper and the window-closing triggers of
  the name machinery: the window opener (R5-m1: only a 200 `success: true` answer with `npcId` that completes a sign-in);
  the tagged-PC check (another account in a desktop or sessions map refutes; a 200 desktop with no session refutes only
  before the deadline less 2 s; **a sessions map with no session at the tagged PC is an end, R5-1**); the cross-PC check
  (first desktop row of any PC; same account by keyboard password at another PC where the present map does not hold it
  now); the window's closing events; the deadline kept by the tag rule itself; the present map (adds, removals, "holder
  unknown"), written whenever `@tags_on` is set and never read by earn rules. The privilege rules use the same rule.

**Tests:** T6, T6b's second-step half, T6c to T6m (T6c, T6d, T6e in four variants, T6f, T6h to T6k, T6l's first half and
T6m in all its variants must be clean; T6, T6g, T6l's second half and T6m's "another account" variant are findings), T9,
T15b, T7, and the P2, P5, P7, P8 (a) and (b), P10 closures, each with a "fails on `main`" record where the plan says so.
Use U6's captures where they exist, else rows from real server answers tagged by the recorder's rule (5.1).

**Done:** one commit; the new test passes; every test U1a ran still passes; the handover note lists each 3.3 path with the
test that covers it.

#### U7. Existing tests move from `login` to `pc`

**Model:** Sonnet (mechanical). **Needs:** U1a.

**Files:** exactly these nine (re-run `git grep -l "'login' =>" test` on the branch first; if it differs, stop and report):
`test/controllers/break_escape/access_leak_scanner_mfa_real_test.rb`,
`test/controllers/break_escape/access_leak_scanner_mfa_r2_test.rb`,
`test/controllers/break_escape/access_leak_scanner_mfa_fix_test.rb`,
`test/controllers/break_escape/access_leak_scanner_helpdesk_r1b_test.rb`,
`test/controllers/break_escape/demo_ops_recon_scenario_test.rb`,
`test/controllers/break_escape/ops_helpdesk_scenario_test.rb`,
`test/controllers/break_escape/demo_ops_second_step_scenario_test.rb`,
`test/unit/access_leak_scanner_harvest_test.rb`, `test/unit/access_leak_scanner_harvest_review_test.rb`.
Not `network_technique_hostile_test.rb`, `access_model_desktop_test.rb` or `recorder_tags_scanner_mfa_test.rb`.

**Build:** per scan call (not per file). (a) A case whose scan uses a tag: `'login' =>` becomes `'pc' => { 'pcId' => ... }`,
and every other tag-bearing row passed to that scan (fixture rows included) gets `'pc' => nil` (or `'hash' => nil` on
`/crack`); it passes no names. Helpers with request params tag by the recorder's own rule. A "delete the tag" case becomes
`r['pc'] = nil`. (b) A case whose scan uses `signins:`/`logouts:` stays untagged and passes `tags: :absent`.

**Tests:** the nine files pass. Assertions change only where a tag set to `nil` now means "unplaced"; each change is listed
in the commit message with its reason.

**Done:** one commit; nine files pass; the reviewer can diff every `assert*` line against the commit message's list.

### Wave 3 (after U1b has landed)

#### U2. The `hash` tag in the crack rules

**Model:** Sonnet, fresh. **Needs:** U1b (same file; in sequence).

**Files:** `tools/playtest/lib/access_leak_scanner.rb`; new `test/unit/access_leak_scanner_tags_crack_test.rb`; the crack
parts of `test/controllers/break_escape/recorder_tags_scanner_crack_test.rb` only if U1a's handover says it left them.

**Build:** 3.4. Per hash id: running credits, the current run's start (first `running` row since the scan began or since the
last `nomatch`/`cracked` for that id) and the `running`/`nomatch`/`infeasible` flags, replacing the run-wide values in
tagged mode only (both in `scan`'s setup and in `note_crack_earned`). `crack_grant(account, accounts, row)` narrows to the
tagged record, which must belong to `accountId`; a salted grant spends that record's credit only, and only at row `t` at
least run start `t` + `readyInSeconds` - 2. `crack_row_ok?`, `crack_wait_ok?` and `crack_answer_shape_ok?` (which takes the
row) judge against the tagged record. A tagged `cracked` row with `hash: null` or an unknown id earns nothing.

**Tests:** T11, T12, T12b, T13, and the H1 to H4 closures, on C3 if U6 recorded it, else on server-answer rows; each with a
"fails on `main`" record; `ops_crack_game85_net_sweep.jsonl` and the existing crack test files give `main`'s results under
`:auto`.

**Done:** one commit; new test and every `test/unit/access_leak_scanner_crack*` file pass.

### Wave 4 (after waves 1 to 3)

#### U8. Docs and headers

**Model:** Sonnet. **Needs:** U1b, U2, U3, U5.

**Files:** `.claude/skills/playtest-scenario/SKILL.md` ("Tags on capture rows" paragraph only);
`scenarios/test_ops_mfa/PLAYTEST.md`; `scenarios/test_ops_privilege/PLAYTEST.md`; `scenarios/demo_ops_passwords/PLAYTEST.md`;
`scenarios/demo_ops_second_step/PLAYTEST.md`; any other `scenarios/*/PLAYTEST*.md` or `.claude/skills/**` file the grep
below finds; `tools/playtest/README.md`; `docs/ACCESS_AND_NETWORKS.md` (Known limits); the header comments of the scanner and
the lock rules (comments only); new `docs/agents/ops_core_build/reviews/HARDEN_limits.md`.

**Build:** section 6. First run `grep -rn -- "--signin\|--logout" scenarios/*/PLAYTEST*.md .claude/skills tools/playtest/README.md`
and fix every hit that tells a tester to name a sign-in or sign-out for a new run; a line about an older capture keeps its
entries with `--untagged`. `HARDEN_limits.md` holds the section 2 table with each limit's outcome and the 2.4 residuals
(including the tag refutation residual and the K1 residuals).

**Tests:** `bin/test-js test/js/playtest-session-capture.test.mjs` (reads the skill's scripts); then, as the stage check,
`access-leak-check.rb <game> <files>` on each U6 capture with no entries: C1 to C4 exit 0 with 0 findings (C2 with its
`--resume` entry), C5 exits 2 under the default and passes with `--untagged` and its entries.

**Done:** one commit; the grep shows no new-run naming instruction; the stage check above as stated.

#### Review and train

The review follows section 7 (Opus 5.5, "review" in the launch description, 2 to 5 rounds). Then the train:
`tools/playtest/train-check.sh /data/be-ops-skin <outdir> <port>` must be GREEN, with each unit's new test counts listed.

**Files not to touch (any unit):** the recorder `response-capture.js`; `helpdesk_leak_rules.rb`; SecGen; every scenario file
other than the `PLAYTEST*.md` files U8 lists.

---

The plan as reviewed follows. Its section 4 unit table is superseded by "Waves and units" above; where the two differ, the
waves above win.

## 0. Plan header (base and line numbers)

Planner: Opus, 2026-11-25; revised after review rounds 1 to 5 (see the Review log at the end; round 5 was the last). Plan only; no code.

**Base update (round 3).** `main` is now `0402ed2be` (1.0.22). S5b/S5c has landed (merge `219e05b1a`; `git merge-base
--is-ancestor d7437165c main` is true), so the branch is cut from `main` (section 4). Functions on `0402ed2be`:
`priv_signin_candidates :3004` (login read `:3008`), `priv_logout_pcs :3097`, `note_privilege_signin :3124`,
`check_priv_signin_pending :3388`, `end_priv_session :3403`, `note_privilege_bootstrap :3419`, `crack_grant :3873`,
`crack_answer_shape_ok? :3933`, `mfa_row_pc_tag :4438`, `mfa_place_signin :4686`, `mfa_confirm_step :4751`,
`mfa_note_signin :4995`, `mfa_logout_pcs :5048`, `mfa_verify_lockout_proved? :1807`, `hand_tag_problem :344`; round 4
adds `note_privilege_ends :3172`, `remember_priv_resumable :3211`, `note_priv_desktop :3243`, `downgrade_priv_step :3269`,
`apply_priv_resume :3290`, `mfa_note_bodyless :4783`, `mfa_note_foreign_session :4969`.
**Only the line numbers in this block and in the round 3 and round 4 log entries are on `0402ed2be`.** Every other scanner
line number in sections 1 to 3 was taken on an older base and is a guide only (it sits lower on `0402ed2be`). Paths starting
`/data/be-ops-follow` or `/data/be-ops-logs` are the old follow-up and S5b/S5c worktrees, both now merged into `main`.
Builders find every function by name (`grep -n "def <name>"`), never by number.
"Scanner" is `tools/playtest/lib/access_leak_scanner.rb`; "CLI" is `tools/playtest/access-leak-check.rb`;
"lock rules" is `tools/playtest/lib/lock_step_leak_rules.rb`; "desk rules" is `tools/playtest/lib/helpdesk_leak_rules.rb`.

Kind of work: lab/demo/test tooling for the ops layer (playtest leak check). Aim: the leak check must never pass a leak, and
must let an honest scripted run pass without the tester naming PCs by hand.

## 1. Where things stand

### 1.1 What the recorder now writes (follow-up track C)

- Every `POST` row whose path ends `/login`, `/logout`, `/lock_session`, `/mfa/verify`, `/mfa/prompt` or `/mfa/approve` carries
  the key `pc`, value `{ "pcId": "<id>" }` or `null`; every `POST /crack` row carries `hash`, value `{ "hashId": "<id>" }` or
  `null` (`/data/be-ops-follow/.claude/skills/playtest-scenario/SKILL.md:344`;
  `/data/be-ops-follow/.claude/skills/playtest-scenario/scripts/response-capture.js:32-41`, `:106-144`, `:203-210`, `:222-223`).
- `null` means: no JSON object body, no non-empty string id of at most 200 characters, a `pc` body that names `target_type` or
  `target_id` (a lock step, not a PC), or the URL query names a field the route reads (`response-capture.js:36-39`, `:125-134`).
- No other request field is stored (no username, password, code, facts) (`SKILL.md:344`).
- The key is `pc`, not `login`, on purpose: the scanner does not read the tags yet, and the CLI refuses any capture with a
  `login` key (`response-capture.js:39-41`; `SKILL.md:344`).
- The server reads exactly these fields: `login` takes `params[:pc_id]` (`app/controllers/break_escape/games_controller.rb:1566`);
  `logout` and `lock_session` take `params[:pc_id]` (`:1728`, `:1746`); `mfa/prompt`, `mfa/verify` and `mfa/approve` take
  `params[:pc_id]` (`:1645`, `:1664`, `:1709`); `crack` takes `params[:hash_id]` (`:2118`). `lock_session` always answers `pcId`
  (`:1738-1741`).

### 1.2 What the scanner does with tags today

- It already honours a hand-written `login` tag in two readers:
  - `priv_signin_candidates` (scanner `:2983-3010`, tag read at `:2987`);
  - `mfa_row_pc_tag` (scanner `:4245-4248`), used at `:4348`, `:4500`, `:4663`, `:4680`, `:4749`, `:4764`, `:4851`.
- The CLI refuses any row with a `login` key (`AccessLeakScanner.hand_tag_problem`, scanner `:339-352`; called at CLI `:150-154`).
  The library does not refuse it, and eight test files set a `login` tag by hand on `main` (`grep -rl "'login' =>" test` gives
  ten; in `network_technique_hostile_test.rb:571` it is a route name and in `access_model_desktop_test.rb:90` an attempt-method
  name, not tags), plus five more on `ops-priv2` that pass `signins:` or
  `--signin` (section 4, U7). Examples:
  `test/controllers/break_escape/access_leak_scanner_mfa_real_test.rb:54`, `:100`, `:422-423`;
  `access_leak_scanner_mfa_r2_test.rb:120`, `:179`, `:214-217`, `:275`. The tests tag only the sign-in rows
  (`access_leak_scanner_mfa_real_test.rb:54`, `sign_in_row`); their logout, lock and `mfa/*` rows carry no key. Two files,
  `recorder_tags_scanner_mfa_test.rb` (`:53-69`) and `recorder_tags_scanner_crack_test.rb` (`:34`), assert that the scanner does
  not read `pc`/`hash` yet and call `hand_tag_problem`: this stage rewrites them.
- These paths never read a tag:
  - the privilege rules' sign-out, which ends every PC unless `--logout` names one (`priv_logout_pcs`, scanner `:3074-3090`);
  - the privilege rules' lock, which ends every PC when the answer lacks `pcId` (scanner `:3153`).
- The crack rules read no `hash` tag. A running answer is one run-wide credit (`@crack_running_credits`, scanner `:3663`,
  `:3700-3703`), and a cracked answer is judged per account (`crack_grant`, scanner `:3684-3703`).
- The CLI's hand-naming entries are `--signin`, `--resume` and `--logout` (CLI `:79-92`; header `:7-32`). The library takes
  them as `scan(lines, signins:, resumes:, logouts:)` (scanner `:526-536`).

## 2. The recorded limits, and what closes each

Source key: **A5** = `docs/agents/ops_core_build/reviews/S8a_R5.md`; **A1/A2/A4** = `S8a_scanner_R1/R2/R4.md`;
**B3** = `S8b_R3_scanner.md`; **B4** = `S8b_R4_delta.md`; **C4** = `S8c_R4_delta.md`; **C5** = `S8c_R5_final.md`;
**S5** = `/data/be-ops-logs/docs/agents/ops_core_build/reviews/S5bc_R5_final.md`; **S7** = `S7_scanner_R2.md` and `S7_R3.md`.
S7 is not on the list the stage was given. It is added because its limits are the ones the `hash` tag was written for.

Verdicts:
- **Close**: the tag or key settles it, and this stage builds the fix.
- **Narrow**: part of the limit closes; the rest stays recorded.
- **Stays**: no tag or key in this stage reaches it. The table says what would.

### 2.1 Closed or narrowed by the `pc` tag

| # | Limit (source) | Verdict | How |
|---|---|---|---|
| P1 | A sign-in that could be at more than one PC must be named with `--signin`; a wrong name is an error (A5:135 item 9; scanner header `:182-187`; CLI `:7-12`) | Close | A successful `POST /login` row's `pc.pcId` places the sign-in, in the privilege rules (`priv_signin_candidates`) and the second-step rules (`mfa_place_signin`, `:4493`). |
| P2 | An account that signs out and signs in again at one PC with no second step and no reload cannot be cleared by any entry (exit 2) (A5:130 item 7; A4:113-115 R4-L2) | Close | The logout row's tag places the sign-out (`mfa_logout_pcs` already reads it, `:4851`), and the second sign-in's tag places that sign-in. `@mfa_at` and `@mfa_placed` then show the PC empty between the two. |
| P3 | An unnamed sign-out ends every PC (scanner header `:191-193`; `priv_logout_pcs` `:3074-3090`; `mfa_logout_pcs` `:4847-4865`) | Close | `priv_logout_pcs` reads the tag the way `mfa_logout_pcs` does. A successful logout row with `pc: null` still ends every PC (fail closed). |
| P4 | A wrong `--logout` name can stand when another account replaces the session before any answer lists that PC (A5:138 item 12; A4 R3-4 a) | Close | Tagged captures take no names (section 3.2). |
| P5 | The "already held there" check knows only sessions that a confirmed name placed (A5:137 item 11; A4:117-125 R4-L5) | Close | Closed because names go: the check is `mfa_arm_confirm`'s `prior` (main `:4550`), which runs only for a named sign-in, and a tagged run takes no names (3.1). A tagged sign-in is placed by its row directly, so no "already held" guess is made. U1b may also write `@mfa_placed[pc]` on the tag path (main init `:4184`, confirmed-name write `:4591`) so that `mfa_unplace` (main `:4793`, called from `mfa_note_signin`, `:4822`) stays consistent, but in tagged mode nothing reads it for the check, and **no test may rely on that write** to prove P5. P5's test is: a tagged sign-out and sign-in again at one PC (P2's beat) is clean with no entries. |
| P6 | A lock with no `pcId` in its answer ends every PC (scanner header `:188`; `:3153`) | Close | A 200 `lock_session` row's `pc.pcId` names the PC. The server always answers `pcId` (`games_controller.rb:1738-1741`), so in practice this is a cross-check: if the answer's own `pcId` disagrees with the tag, that is a finding (section 3.3). The second-step side records `@mfa_locked` from the answer's `pcId` (`:4753`) and keeps doing so; the tag only cross-checks it there too. |
| P7 | A pass with panes open at two PCs, a step answer checked against its own row, and the single-PC close: the fixes work only on a tag that did not exist (A2:113-119 R2-L9; A1 R1-L12, R1-L13) | Close | Same code paths. The tag now exists, and the tests move from hand-set `login` to recorded `pc`. |
| P8 | A wrong code while two code steps are open makes both accounts' counts unknown, so a later lock is reported (A5:128 item 5; A1 R1-L6) | Narrow | Two parts, both in U1b. (a) The count: `mfa_count_wrong_code` already narrows by tag (`:4764-4766`); it now reads `pc`. (b) The lock credit: `mfa_verify_lockout_proved?` (`:1793-1806`) today takes no row and needs exactly one open code step across all PCs (`:1798-1799`), so an honest lock is reported whenever two code steps are open, even with every wrong code tagged. U1b passes the row to it; with a tag it selects the open code step at the tagged PC (none there: no credit); with `pc: null` it keeps the "exactly one open step" rule. Two steps open at the same PC (not a shape the server allows per PC) stay as now. The same change closes the tag half of A5 item 8 ("the allowance ignores a `login` tag ... on the lock row"). |
| P10 | A code step abandoned at one PC stays open for the rest of the run, which leads to P8 (A5:129 item 6) | Narrow | Narrowed through P8 only. The missing 300-second timeout stays (section 2.4). |
| P11 | With a PC push step open in a mixed scenario, an echo-less cancel or waiting prompt reads as the PC's (C5:86 item 2; C4:142; lock rules header `:29-31`; `ls_pc_owns?` `:642-654`) | Close | In a tagged capture, a `mfa/prompt` or `mfa/approve` row whose `pc` names a PC is the PC's. A row whose `pc` is `null` is not the PC's: the recorder writes `null` when the body named `target_type` or `target_id` (`response-capture.js:126-130`), so the lock rules judge it, and with no echo it is a finding (R1-L4, lock rules header `:19-21`). |
| P12 | An NPC's claim sign-in that places no PC empties the session map, so the check must name it with `--signin` or a later relay read is flagged (S5:71 item 11) | Close (S5b/S5c is in the `main` base since `219e05b1a`; on `0402ed2be` the readers are at `:3008` and `:4439`) | A claim sign-in is a `POST /login` row, so its tag places it. The limit and its code exist only on `ops-priv2` (`/data/be-ops-logs`). On that branch the `login` reads are the same two readers, moved: `priv2:3008` is inside `priv_signin_candidates` (`priv2:3004`) and `priv2:4432` inside `mfa_row_pc_tag` (`priv2:4431`); there are no extra readers. U1a covers P12 only because the branch is cut after S5b/S5c lands. |
| P13 | The library honours `login` while only the CLI refuses it (scanner `:335-352`) | Close | The library stops reading `login` and refuses it too (section 3.1). |

### 2.2 Closed or narrowed by the `hash` tag

| # | Limit (source) | Verdict | How |
|---|---|---|---|
| H1 | A cracked answer is checked per account, not per record; the link between a running answer and its record is lost (S7_scanner_R2.md:192-197 item 1; S7_R3.md:347-348 item 4) | Close | A `POST /crack` row's `hash.hashId` names the record. A running credit becomes per hash id, and a cracked answer must belong to the tagged record's account. |
| H2 | Two clicks during one record's wait leave a run-wide running credit that a later salted grant of another account spends (capture N4) (S7_scanner_R2.md:198-200 item 2; `@crack_running_credits` `:3663`, `:3700-3703`) | Close | Credits are kept per hash id, and a salted grant spends only its own record's credit. |
| H3 | The salted wait is not timed, so a server that grants before the wait is over passes (S7_scanner_R2.md:201-202 item 3) | Close | Per hash id the scanner keeps the start of the *current* run: the first `running` row for X, or the first after a `nomatch` or `cracked` row for X (the server clears `crackStarted` after the wait and starts a new run with a new `at` on the next post, `app/models/break_escape/ops_cracking.rb:180-183`, `:215-224`). A cracked answer for X counts only if its row `t` is at least that row's `t` plus that row's `readyInSeconds`, minus a 2-second tolerance (row `t` is response arrival time, `response-capture.js:192`; owner question 4). A `nomatch` or `cracked` row clears the current start. |
| H4 | The run-order flags are per run, not per record (S7_R3.md:107, :347) | Close | `@crack_running_seen` and the `nomatch` and `infeasible` flags (`:3663-3665`) are kept per hash id. A keyring row's `status` is then judged against its own record's flag (`crack_row_ok?`), and a 200 `infeasible` answer against its own record (`crack_answer_shape_ok?`, main `:3747`, `infeasible` branch `:3762`; see 3.4). |

### 2.3 Closed by one small non-secret server key

| # | Limit (source) | Verdict | How |
|---|---|---|---|
| K1 | **Route rooms.** An unpromoted route room counts as opened. Its `GET room` answers 200 without promoting it, and its door open is the same bytes as a real open, while a `POST /unlock` of a non-door target there is refused 403 (`games_controller.rb:1287`; the lock helpers `ops_rfid_in_reach?`, `uid_only_refusal?`, `pin_cracker_feedback`, `password_case_mismatch?` and `pin_dust_lock` apply the same gate inside it, `game.rb:4391`, `:4464`, `:5220`, `:5234`, `pin_dust.rb:36`) (C5:93-94 item 7; C4:145; `S8c_R3_scanner.md:123-133` R3-SCANNER5; `games_controller.rb:584-598`) | Narrow (owner question 1) | The server adds `routeRoom: true` to the `GET room/<id>` answer and the door-open answer only while the room is *unpromoted*: `in_npc_route_room?(room_id) && !unlockedRooms.include?(room_id)`, the same predicate as the 403 object gate (`object_in_unpromoted_route_room?`, `game.rb:337-342`, used at `games_controller.rb:1287-1290`), not `in_npc_route_room?` alone (`games_controller.rb:589`), because interims exist where a room is in both lists (`:1316-1318`, `migrate_soft_locked_route_rooms!`). `ls_note_rooms` (lock rules `:246`) treats a marked room as shut. Promotion through `viaPass` (`game.rb:506-524`) leaves no room answer, so the scanner may keep the room shut after a real promotion; a gate there is then reported (fails closed; this residual is why the verdict is Narrow). The room counts as opened again only by what opens it today: a door open that proves the room (lock rules `:249-252`, header `:37-38`). A `GET room` opens nothing new. U3 also accepts, as proof of promotion, a 200 `POST /unlock` of a non-door object of the room **only when the answer names that object** (round 3 note below), since that is the one recorded route that applies `object_in_unpromoted_route_room?` and answers 403 while unpromoted. No other 200 object answer counts. **Value is small:** by grep of `playerMayPassIf`, only `lab_physical_pentest` and `test_gate_tailgate` have route rooms, and neither has a `secondStep`, while the lock rules are inert without a lock step (lock rules header `:13`). So K1 changes no shipped scenario's result today; it guards future scenarios. **Round 3 (R3-2):** an object unlock counts as proof only when the answer itself names its target: the `targetType`/`targetId` echo that `lock_step_open_echo` adds for a gated lock (`app/controllers/break_escape/lock_step_requests.rb:94-99`, merged at `games_controller.rb:1347`), with `targetType` not `door` and `targetId` an authored id of exactly that room in `@ls_room_ids`, as `ls_note_rooms` proves a door (lock rules `:253-263`). An echo-less 200 object answer (`games_controller.rb:1343-1346` names no target) proves nothing, and an object added at runtime is never gated (`game.rb:336-337`). The rest is a recorded limit (section 2.4). |

The key is a boolean on answers that already name the room, so it carries no secret. It does show the client which rooms are
route rooms, but the player is already standing in one, served for the slip-in (`games_controller.rb:587-588`). Golden and
unchanged-answer fixtures that pin the shape of these answers will change. The unit lists them (section 4, unit U4).

### 2.4 Limits that stay (the stage lists them in the docs, section 6)

| Limit (source) | Why the tags do not reach it | What would |
|---|---|---|
| `--resume`: a session that survives a power cut is restored only by a tester's entry (scanner header `:195-200`) | The resume row is a `GET container/<pc>` desktop answer. It is untagged and already names its PC in the path. What is missing is proof that the step survived, not the PC. | A server mark on the 200 desktop answer that a session came back after `off`, such as `resumed: true`. Not in this stage (owner question 2). |
| Helpdesk stop rule depends on playtest order (B4:178-179, B3:150-158; desk rules header `:53-60`, limit 1) | A refusal row names no desk or username, and the recorder stores no username. | Desk rules header `:57-60` gives two options: (a) the client sends `desk_id` and `username` in the query; (b) the server adds one opaque key, such as a short keyed hash of `HelpdeskModel.tries_key` (`lib/break_escape/helpdesk_model.rb:64-66`), on `refused` with `triesLeft: 0`, on `blocked` and on `granted`. Owner question 3. This stage does not build either. |
| A pass answer's own word that the code or number was right; code values never checked (A1:154; A2:136; B4:184) | No request field is recorded, on purpose. | The `MfaModel.code` recompute that A1:140 describes. A separate item. |
| Owner approval not checked against prompt count or a knocked-out owner (A2:137) | Not a PC question. | — |
| Step timeout and five-wrong-codes closure not modelled (A5:129; A2:138) | Time, not place. | A rule on row `t`, separate. |
| A cancel, expiry or lockout closes every open step of its kind (A2:139) | Narrowed only where the row's tag names one PC: P8 covers `mfa/verify`, and P11 covers `mfa/prompt` and `mfa/approve`. An expiry is a GET answer, which is untagged. | — |
| P9 (A5:124-125 items 1, 2): a lock on `mfa/verify` is credited only when wrong codes alone reached it; a lock reached with a wrong password in the count, or a lock notice sent because wrong passwords locked the account while its code step was open, is reported | The server counts failures per PC *and* username (`game.rb:4709-4725`, `record_login_failure!(pc, key, ...)`). The scanner counts no refused sign-ins at all; it credits a `mfa/verify` lock only when its wrong-code count is exactly `max - 1` (`mfa_verify_lockout_proved?`, `:1793-1806`). A wrong password at another PC never spoiled the credit, and at the same PC the tag cannot name the account. Counting tagged refused logins would add a crediting path (codes + passwords = `max - 1`) that could credit a lock for the wrong account, which is looser. So nothing here changes. | A username key on the refused answer, or the recorder storing a keyed hash of the username. Not in this stage. |
| A5 item 3: the same lockout body on `mfa/prompt` or `mfa/approve` is reported; no rule credits it | The tag names the PC, but the credit needs a count of push failures the scanner does not keep. | A push-lockout crediting rule, separate. |
| A5 item 4: the wrong-code count is cleared only by a pass answer, so after a password unlock of a locked session a later honest lock by codes is reported | The unlock is not a PC question; the scanner needs to see the server's count clear. | A rule clearing the count on a 200 unlock of that PC's session, separate. |
| A5 item 8, second half: the lock allowance accepts `attemptsLeft` as `0.0` | Not a tag question (Ruby `0.0 == 0` at `:1796`). The first half (the allowance ignores a tag on the lock row) is closed by P8 (b). | An `Integer` check, a one-line separate fix. |
| A desktop is judged only for a keyboard password session, never again after a pass (A5:136 item 10; A4 R4-L3, R4-L4) | Desktop rows are GETs. | — |
| The host label of a remote sign-in is the answer's own word (A2:141) | A tag now gives the request's word too. Section 3.3 makes a mismatch a finding. Where the two agree, the label is still trusted as before. | — |
| `bodyText` and `dom` pages not read; sessions from before the first file (A1:158-159; A2:142-143; S5 item 9) | Not tag related. | — |
| Tag refutation residual (R3-1, widened by R4-1): a sign-in tag moved to admitting PC B is not refuted when the tag rule's over-counting present map holds the account at its real PC A (held now, or seen there with no later answer naming A that shows it gone: a lapsed token, a power cut, an unnamed sign-out, a 403 desktop), or when A is marked "holder unknown"; it can earn `admin:B` | The capture shows the real sign-in only through A's desktop, which is consistent with an earlier session at A; the map over-counts so that honest runs are never flagged (3.3). Any later answer about B showing another account or no session ends the step before that answer is judged (section 3.3). | One non-secret key: `pcId` (the PC's id) on the 200 sign-in answer. Today `login_session_answer` (`game.rb:4862-4890`) sends `npcId`, `username`, `displayName`, `via` and optional fields, and no `pcId` for a local sign-in; the client already knows the PC it posted. The tag is then cross-checked against it as for `lock_session` (3.3). Not in this stage; if wanted, its own small server unit with controller tests (every 200 sign-in path carries it) and golden-fixture updates. |
| K1 residual (R3-2): an ungated object unlock in a route room does not prove promotion, so after a real promotion that only such an unlock (or `viaPass`) shows, a later gate in that room is reported (fail closed) | The 200 object answer is `{ success: true, type: 'object' }` plus contents (`games_controller.rb:1343-1357`) and names no target unless the lock is gated; `POST /unlock` rows carry no request tag. The scanner would have to guess the room, which this plan does not do. | One non-secret key: `roomId` (the room of the unlocked authored object, from `login_scope_of(target_id)[:room_id]`, the lookup `object_in_unpromoted_route_room?` already does, `game.rb:338-344`) on the 200 object answer of `POST /unlock`. Not built here: no shipped scenario has a route room and a lock step, and the residual fails closed. Owner question 1 b. |
| P1c door open serving another room's data; door rewards share one station set (C5:84, :95 items 1, 8) | `POST /unlock` rows carry no tag. | A third recorder tag on `/unlock` (`target_id`), or a station id on the `unlock_door` answer. A later stage. |
| C5 items 3-6, 9-13; S5 items 1-10, 13-22; B4 items 1-9, 11-14 | Not about which PC or which hash. | Unchanged. |
| Routes matched by `/games/<any id>/`; only the CLI refuses another game's rows (A5:139 item 13) | Not tag related. | — |

## 3. Design

### 3.1 Capture modes (never looser than today)

- **Tag-bearing rows.** A `POST` row whose path matches the recorder's PC route list or `/crack`. The scanner holds the same two
  lists as `response-capture.js:106-107`, and a test reads the recorder source and checks that the two still match.
- **A file's mode.** A file is *tagged* when every tag-bearing row has its key (`pc` or `hash`). It is *untagged* when none does.
  A file with some rows of each is refused (`tag_problem`), and so are files of one run in different modes. A file with no
  tag-bearing rows fits either mode.
- **Refused shapes** (in the library and the CLI), all through a new `AccessLeakScanner.tag_problem(files, mode)` that replaces
  `hand_tag_problem` (scanner `:339-352`):
  - a top-level `login` key on any row (as `hand_tag_problem` checks today; a `login` key inside a response body, such as a
    route name, is not a tag and is not refused);
  - a top-level `pc` key on a row that is not a PC route, or a `hash` key on a row that is not `/crack`;
  - a tag value that is neither `null` nor exactly `{ "pcId": <string of 1 to 200 characters> }` (or `hashId` for `hash`).
- **What a refusal is.** `tag_problem` returns a problem string (or nil), as `hand_tag_problem` does; the CLI prints it and exits 2.
  Inside the library, `scan` calls it and raises `ArgumentError` with that string, as it does for a bad name, so the CLI's existing
  rescue also gives exit 2. A refused file produces no findings.
- **The reader API (named now, so U3 and U5 can start beside U1a).** `scan` sets `@tags_on` (true for a tagged run, false
  otherwise) after the mode check. `row_pc_tag(row)` and `row_hash_tag(row)` return nil whenever `@tags_on` is false. U3 reads only
  `@tags_on` and `row_pc_tag`.
- **The `tags:` keyword on `scan`**:
  - `:required`: the CLI default. An untagged file that holds any tag-bearing row is refused ("record again, or pass `--untagged`").
  - `:absent`: CLI `--untagged`. A tagged file is refused.
  - `:auto`: the library default, so the existing untagged-fixture tests run unchanged. A tagged file reads the tags; an
    untagged one behaves exactly as `main` does.
- **Names.** `signins:` and `logouts:` given with a tagged file raise `ArgumentError` (exit 2), so a name can never sit beside a
  tag. `resumes:` is allowed in both modes (section 2.4).
- **Stripping tags gains nothing.** A hand-stripped file is refused by the CLI. In the library it falls back to today's rules,
  which are fail closed.

### 3.2 Reading the `pc` tag

- One reader, `row_pc_tag(row)`, returns `pc.pcId` when it names a sign-in PC of the scenario (`@priv_pcs`), else nil. It
  replaces the `login` reads in `priv_signin_candidates` and `mfa_row_pc_tag`. On the S5b/S5c base these are the same two
  readers, moved (`priv2:3008` is in `priv_signin_candidates`, `priv2:4432` in `mfa_row_pc_tag`); there are no others.
  `mfa_row_pc_tag` keeps its name and calls it, so the desk rules (desk rules `:17`, `:655`) are unchanged.
- **A sign-in tag must name a PC that admits the account.** On a `POST /login` row, the tag is *accepted* only if
  `CredentialModel.pc_admits_account?(pc, npc)` holds for the answer's `npcId` (the `admitting` set that `priv_signin_candidates`
  already builds). Today `priv_signin_candidates` returns `[[tag], true]` before looking at `admitting` (main `:2986-2988`), and
  `mfa_place_signin` sets `@mfa_row_pcs = @mfa_row_clear = [tag]` (main `:4510`), while an untagged row is placed only among
  admitting PCs; without this check the tag would be looser than `main` (review M2).
- **One rule for a rejected tag** (a 200 row whose tag names a non-admitting PC, an id that is not a scenario PC, or an id that
  disagrees with the answer, 3.3). The row raises the `ops_tag` finding. It then **earns nothing** (no `admin:<pc>`, no exact
  placement, no `@mfa_at`/`@mfa_placed`, no exemption), and for every **end or take-back** it is handled exactly as `main`
  handles an untagged, unnamed row with no host label:
  - privilege rules: `priv_signin_candidates` returns `[admitting, false]` for a rejected tag: the candidate set of `main`'s
    untagged fallback (main `:3009`), never marked exact, so `note_privilege_signin` (main `:3103-3126`) takes back
    `admin:<pc>`, the deadline, the resumable mark, the kind and the session account at **every** admitting PC (`:3112-3119`)
    and earns no `admin:<pc>` even when only one PC admits the account (the earn at `:3121-3126` needs `exact`). This is
    stricter than `main`'s untagged row, which with one admitting PC is exact and may earn; the row already carries an
    `ops_tag` finding, so the extra strictness costs an honest run nothing;
  - second-step rules: `@mfa_row_pcs = @priv_pcs.keys` and `@mfa_row_clear = mfa_admitting_pcs(npc)` when the account has a
    step, else every PC (main `:4516-4517`), so `mfa_note_signin` (main `:4809-4822`) clears each of them.

  A rejected tag never narrows an end. (A non-admitting PC already earns no admin on `main`, `:3124`; the risk this rule closes
  is the take-back.) The same rule applies to a logout or lock row whose tag is rejected: it ends what a `pc: null` row ends.
- **Sign-in** (P1, P5, P12): the tag places the row in `priv_signin_candidates` (exact) and in `mfa_place_signin` (it writes
  `@mfa_at`, and `@mfa_placed` like a confirmed name). A successful row with `pc: null` is placed as today with no name: by the
  host label, else the single admitting PC, else nowhere (fail closed).
- **Sign-out** (P2, P3, P4): `priv_logout_pcs` reads the tag first, as `mfa_logout_pcs` does at `:4851`. With `pc: null` it ends
  every PC, as today.
- **Lock** (P6): `:3153` ends the tagged PC; with `pc: null` and no `pcId` in the answer, it ends every PC.
- **Step routes** (P7, P8, P10): `mfa/verify`, `mfa/prompt` and `mfa/approve` rows place their answer at the tagged PC wherever the
  rules now say "the one open step of that kind". This includes the lock credit: `mfa_verify_lockout_proved?` takes the row and,
  with a tag, uses the open code step at the tagged PC (P8 (b)). With `pc: null`, the rules work as today.
- **Wrong passwords** (P9): unchanged. Refused `POST /login` rows are still not counted (section 2.4).
- **The mfa lock record** (`@mfa_locked`, `:4753`) still comes from the answer's `pcId`; the tag is cross-checked against it
  (section 3.3).

### 3.3 Cross-checks (each is a finding, rule `ops_tag`, owner `tag:<route>`)

A finding names the rule, route, line and owner, never a value. These are the cases:

- a 200 row whose tag is not the **id** of a sign-in PC of the scenario. The server resolves `pc_id` by object id, by name or by
  client id (`find_login_pc`, `game.rb:3310`, through `login_scope_of` / `locate_object_in`, `:4677`), and answers 404 "Sign-in
  PC not found" only when none matches (`game.rb:3696`). So such a 200 means either the tag and the server disagree, or the
  client sent a name instead of an id. The scanner does **not** resolve names (it would have to copy `locate_object_in`); it
  reports the row (fail closed, so the only risk is a false finding). Why an honest run does not hit it: the browser sends ids
  (`unlock-system.js:668`, `const pcId = data.id`), and a keyring sign-in, whose `pcId` is the credential's `connectsTo`
  (`keyring.js:692`), answers 200 only when `connectsTo` equals the PC's id (`credential_login.rb:49`, "This connection is for
  another PC" otherwise), and the validator requires `connectsTo` to be a sign-in PC id (`scripts/validate_scenario.rb:7730-7731`,
  `pcs_by_id`). C1 to C4 confirm it on real runs;
- a 200 sign-in whose tag names a PC that does not admit the answer's `npcId` (section 3.2);
- a tag that disagrees with the answer's own word: the `pcId` of a `lock_session` answer (on either rule set), of an `mfaRequired`
  answer (desk rules `:618` reads it) or of a step answer, or the PC of a remote sign-in's `host` label. For `mfaRequired`, the
  existing false return in `mfa_required_answer_ok?` (`:4348-4349`) already reports a mismatch as that rule's finding; in a tagged
  run, U1b replaces it with the `ops_tag` finding, so the mismatch is reported once, never twice and never zero times;
- a tagged sign-in that a later answer **about the tagged PC** refutes, before any end there. A name is a guess, so for names
  the first desktop that follows is the only evidence and "the desktop right after a sign-in is another PC" refutes it (CLI
  header `:19-21`; `mfa_confirm_step` / `mfa_confirm_desktop`, main `:4565-4591`). A tag is the request's own word, so another
  PC's desktop says nothing against it: an honest run with panes at two PCs (P7, C1, C2) shows exactly that. For a tag:
  - **refutes:** the **first** answer about the tagged PC after the sign-in (its first desktop row, or the first sessions map)
    showing another account; or, **for a desktop row only**, a 200 desktop showing no session (a 403 desktop is an end, below) while the sign-in's own deadline has not passed (below);
  - **never refutes (R5-1): a sessions map that shows no session at the tagged PC.** That is always an end. On `main` the
    bootstrap ends every claim and relay session and prunes the onward sessions hanging from them (`end_claimed_sessions!`,
    `game.rb:3972-3985`; `reload_ended_session_ids`, `:3993-3997`; called from the scenario bootstrap at
    `games_controller.rb:491`), never lists them (`sessions_for_client`, `game.rb:4019-4040`), and sends no `endedPcIds`. So an
    honest tagged claim sign-in, relay sign-in, or foothold/`from` sign-in through a claimed pivot, followed by a reload before
    the PC's desktop row, shows the PC empty in the first answer about it. The sessions map closes the window as an end;
    only a sessions map showing **another account** at the tagged PC refutes;
  - **refutes (one cross-PC case):** when the **first** desktop row of **any** PC after the sign-in is a desktop of another
    PC, and it shows the same account by keyboard password, and the tag rule's own **present map** (below) **does not hold
    that account at that PC now** (R5-m3: "present now", with the map's removals, not "never seen"; this is what catches T6,
    a tag moved to the other admitting PC: an honest client opens the real PC's desktop at once,
    `password-minigame.js:2746`, `signInAccepted`);
  - **does not refute:** any other desktop or answer of another PC, and **any answer after the window has closed**.

  **What opens a window (R5-m1).** Only a 200 `POST` answer with `success: true` that holds `npcId` and completes a sign-in
  opens a window at its accepted tag: a `POST /login` success (the shape `mfa_place_signin` needs, scanner `:4687`), or a
  step pass that completes a sign-in (`mfa/verify` or `mfa/approve`; on the server `mfa_push_passed!` and `mfa_code_passed!`
  call `start_login_session!`, `mfa_sign_in.rb:320`, `:376`). An `mfaRequired` answer adds to the present map and opens
  nothing. A `pc: null` or rejected tag opens nothing (the rejected tag is already an `ops_tag` finding).

  **The window (round 3, R3-1; round 4, R4-1 item 5).** Each tagged sign-in opens one window. The tagged-PC check is spent on
  the first answer about the tagged PC; the cross-PC check is spent on the first desktop row of **any** PC, the tagged PC's own
  included (an honest client's first desktop is its own PC, so in an honest run the cross-PC check is spent at once and never
  fires). Both close, and the tag then stands, at the first of: any other `POST` sign-in, sign-out, lock or step answer (`login`, `logout`, `lock_session`, `mfa/*`, as
  `mfa_confirm_step` closes a name's window, scanner `:4751-4763`); an end at the tagged PC (a lock, an `endedPcIds` naming it,
  a sessions map showing no session there (R5-1), a 403 desktop, a passed deadline, a bodyless sign-in row); the capture's end. After the window, an answer about the tagged PC
  that shows another account or no session is an **end**, as on `main` (`note_priv_desktop` "R5-3: ends only", scanner
  `:3254`; `note_privilege_bootstrap` `:3425`), never a finding. That keeps honest session ends that leave no row of
  their own (the scanner comment above `note_privilege_ends`, `:3170-3171`: a token running out, a power cut, a dropped route, a hand-back naming no
  PC) out of `ops_tag`; for example a client-side token expiry (`pc-sessions.js:451`, `linkDropped([pcId], 'token_expired')`)
  followed by a reload.
  - **"No session" and the deadline.** Inside the window, a **desktop** answer showing no session at the tagged PC (a
    sessions map never refutes on absence, R5-1) refutes only when the
    sign-in's own deadline has not passed at that row's `t`. The deadline is read from the capture, from the tagged sign-in's
    own answer, by the formula the privilege rules already use: row `t` plus `expiresInS` when `kind` is `token`
    (`note_privilege_signin`, scanner `:3154-3157`; privilege rules end the session at it in `note_priv_deadlines`, `:3202-3206`,
    which runs before the answer is judged, so there the end already closed the window). The tag rule keeps this deadline itself,
    so it also works in a second-step scenario with no privilege rules (the second-step rules keep no deadline). A sign-in with
    no deadline (keyboard password) has none to pass. A row with no readable `t` cannot show the deadline unpassed, so "no
    session" on it ends and does not refute (fail towards no finding is safe here, because the session's credit is still taken
    back by the end). **Clock tolerance (R4-m1):** row `t` is response arrival, so the scanner's deadline falls later than the
    server's own. A "no session" row whose `t` is at or after the deadline minus 2 seconds is an end, not a refutation (the
    same 2 s as H3, owner question 4).
  - **The present map (round 4, R4-1), used only by the cross-PC check.** The earn-state sets (`@ops_session_accounts`,
    `@priv_resumable`, `@mfa_at`, `@mfa_held`) are **not** used: they under-count on purpose, which is fail closed for earning
    but flags honest runs when it decides a finding (on `0402ed2be`: `downgrade_priv_step(pc, keep: false)` from
    `note_priv_desktop` `:3255-3256` deletes `@priv_resumable[pc]` at `:3279-3281` for a non-admin account before
    `apply_priv_resume` can run, `:3261`; a 403 `unreachable` keeps no resumable record, `note_privilege_ends` `:3181-3184`,
    though the server still holds the session, `games_controller.rb:3589-3590` before `:3605-3606`; `mfa_note_bodyless`
    `:4783-4790` and `mfa_note_foreign_session` `:4969-4975` end every PC; and `@priv_active`/`@mfa_active`, `:2975`, `:4389`,
    leave both sets unwritten in scenarios with neither rule set). The tag rule keeps its own map, written whenever `@tags_on`
    is set, whatever rule sets are active. It **over-counts**: it may say an account is present where the server has ended it,
    never the reverse for anything the capture shows.
    - **Add** `account@pc` on: a 200 `POST /login` row (a `success` answer or an `mfaRequired` answer naming `npcId`) at its
      accepted tag; the same row with `pc: null` or a rejected tag at **every** PC that admits `npcId`; a 200 step answer that
      completes a sign-in, at its tag, or at every admitting PC when its tag is `null` or rejected; a 200 desktop or sessions-map
      answer showing the account at a PC; a 200 answer of any other route that holds a `session` naming `npcId` (the
      `mfa_note_foreign_session` shape), at the PC its host label names, else at **every** PC.
    - **Remove** `account@pc` only on an answer that names that PC and shows that account's session gone there: a 200 tagged
      `logout` or `lock_session` at that PC (lock by the answer's `pcId`); a 200 answer whose `endedPcIds` lists it; a 200
      desktop or sessions-map answer showing that PC with another account or with none. **Never** on an untagged or `pc: null`
      sign-out or lock, a fail-closed all-PC end, any 403 desktop answer (`off`, `not_responding` and `unreachable` keep the
      session on the server; a `no_session` reason is also sent with a session held by another route, `network_access.rb:1070`
      via `games_controller.rb:3603-3604`, so it proves nothing either), a downgrade, or a passed deadline.
    - **Holder unknown.** A bodyless `POST /login` row (or a bodyless step row) marks its tagged PC, or every PC when its tag is
      `null`, as "holder unknown". The same mark goes on every PC for a session-bearing answer of the foreign shape that names no
      `npcId`. A PC so marked is never refuted at, until a 200 desktop or sessions-map answer shows its holder, which clears the
      mark and sets the map for that PC.
    - A `--resume` entry is not needed by the map (a power cut removes nothing), so T6e is clean with or without one.
  - **Residual, recorded (widened in round 4).** A tag moved to admitting PC B is not refuted when the present map holds the
    account at its real PC A: held there now, or seen there earlier with no answer since that names A and shows it gone (a
    token that ran out, a power cut, an unnamed sign-out). It can earn `admin:B` where `main`'s unplaced row earns nothing. Any
    later answer about B that shows another account or no session ends it before that answer is judged
    (`note_privilege_before`, `:3191-3199`), so a desktop at B that serves data with no session there is still judged with no
    step held. Recorded in section 2.4 and the HARDEN_limits log, not closed.

  U1b writes this as a new tag rule and reuses from the name machinery only the "what does this desktop show" reading and its
  window-closing triggers. The present map is new state; it never feeds the earn rules. A refutation is an `ops_tag` finding and the scan continues (never exit 2). "Unconfirmed" (no answer
  about the tagged PC before the window closes) is silent, and the tag stands with no desktop row (owner question 6). The
  privilege rules use the same rule (not their name refutation).

### 3.4 Reading the `hash` tag (H1 to H4)

- `row_hash_tag(row)` returns `hash.hashId` when it is a registry hash id (`@crack_hash_ids`, scanner `:3605-3610`), else nil.
- Per hash id, the scanner keeps:
  - the running credits;
  - the current run's start: the row `t` and `readyInSeconds` of the first `running` row for that id since the scan began or
    since the last `nomatch` or `cracked` row for that id, which clear it (H3; a later `running` row in the same run answers the
    *remaining* wait, `ops_cracking.rb:217-218`, so only the first row of the run sets the bound);
  - whether `running`, `nomatch` or `infeasible` was seen.

  These replace the run-wide `@crack_running_credits`, `@crack_running_seen`, `@crack_runs_seen` and `@crack_infeasible_seen`
  in tagged mode. Both places change: the initialisation in `scan`'s setup (`:548-551`) and the updates in `note_crack_earned`
  (`:3656-3669`). Untagged mode keeps the run-wide values.
- `crack_grant(account, accounts, row)` (main `:3687`; it takes the row, not only the id, because H3's bound needs the row's
  `t`, and reads the id with `row_hash_tag(row)`) narrows `candidates` to the record whose id is the tag, which must belong to
  `accountId`. A salted grant spends that record's own credit only, and only once its row `t` is at least
  `run_start_t + run_start_readyInSeconds - 2` seconds for the *current* run (H3). With no current run (no `running` row since the
  last clear), a salted grant earns nothing.
- A batch (unsalted only) is judged as today for the partner accounts.
- In a tagged file, a 200 `cracked` row with `hash: null` or an unknown id earns nothing. `scan_crack_answer` then reports
  `crack_unearned` (`:3879-3881`).
- Keyring row status and the wait map are judged against the row's own record's flags (`crack_row_ok?`, `crack_wait_ok?`).
- The 200 answer shape check `crack_answer_shape_ok?(body)` (main `:3747`) takes the row too. Its `infeasible` branch (main
  `:3762`) uses the run-wide `@crack_runs_seen` and `crack_held_class?('strong')`; in tagged mode it requires that the *tagged*
  record is strong and that its own `nomatch` with `runs: 1` was seen. Its `nomatch runs: 1` branch (main `:3760-3761`) likewise
  checks the tagged record's class. With `hash: null` or an unknown id in a tagged file, `infeasible` fails the check.
  Untagged mode keeps the run-wide values.

### 3.5 Lock rules (P11, K1)

- **P11.** `ls_pc_owns?` (lock rules `:647-654`) takes the row. In a tagged file, an answer is the PC's only when the row's `pc`
  names a PC that has an open step of a kind the route serves. When the row's `pc` is `null`, the answer is never the PC's, so an
  echo-less lock-form answer is a finding (R1-L4). Untagged files keep today's rule.
- **K1.** `ls_note_rooms` (`:246`) and the door-open proof:
  - an answer with `routeRoom: true` never marks its room opened, and un-marks one that was;
  - a room marked this way stays shut until something proves it opened: a door open that proves the room, as today
    (lock rules `:249-252`, header `:37-38`), or a 200 `POST /unlock` answer with `type: 'object'` that **itself names** its
    target through the gated-lock echo (`targetType` not `door`, `targetId` an authored id of exactly that room in
    `@ls_room_ids`, matched as `ls_note_rooms` matches a door's ids, lock rules `:253-263`). **R4-m3:** `targetId` is the
    lock's *subject*, `info[:subject][:id]` (`lock_step_requests.rb:98`), which for an object is the resolved object's own id
    (`lock_step_info` `:102-107`, `lock_step_for` in `lock_second_step.rb:126`), not always the requested `target_id`. The
    match is against that subject id. `@ls_room_ids` already holds nested ids: it is built by `ls_server_ids`, which recurses
    into `contents` (`ls_server_content_ids`, lock rules `:198-215`), less movable objects (`:186-190`). A subject id in no
    room's set, or in two, proves nothing (fail closed). **R5-m2:** the movable cut at `:186-190` removes only **top-level**
    `needsTag`/`takeable` objects (with their contents); a `takeable` or `needsTag` item nested in a fixed container keeps
    its id in `@ls_room_ids`. U3 therefore matches the K1 echo against a narrower set: `@ls_room_ids[room]` less every id
    that is, or sits inside, a `takeable` or `needsTag` object **at any depth**. `@ls_room_ids` itself (and the door proof
    that reads it) is unchanged. That route applies
    `object_in_unpromoted_route_room?` and answers 403 while the room is unpromoted (`games_controller.rb:1287`). An object
    answer with no echo proves nothing: the scanner never places it by the player's room or by its contents ids (R3-2; the
    residual is in section 2.4). A bare `GET room` opens nothing it does not open today (only the awareness world room).

  Before the server change lands, no answer has the key, so this is inert. Unit U3 can therefore land without U4. Since no shipped
  scenario has both a route room and a lock step (section 2.3), T17 uses a synthetic scenario built in the test.

## 4. Units

**Setup.** Branch `ops-hardening` from `main` `0402ed2be`, worktree `/data/be-ops-skin` (already cut; the build brief is
its first commit). Earlier drafts said `ops-harden` and `/data/be-ops-harden`; read those as these. Both prerequisites have landed: the follow-ups (1.0.21, `9e5d56f70`) and S5b/S5c
(merged into `main` at `219e05b1a`, now 1.0.22, `0402ed2be`), so P12 and S5b/S5c's `login` reads and `signins:`/`--signin` test
files are in the base. Cut from `main` at or after `0402ed2be`. At the cut, the builder of U1a records the base
commit at the top of its handover note; every later unit finds functions by name on that base. Use one worktree,
`/data/be-ops-skin`.

**Rules for every builder.** Every builder is Sonnet unless noted. Each one gets:
- the handover rule: past about 150k tokens, write a note to `docs/agents/ops_core_build/HANDOVER_HARDEN_<unit>.md` and stop;
- "commit with explicit paths: `git commit -m ... -- <paths>`";
- "re-read a shared file just before editing it";
- "no `db:` tasks".

Each builder runs only its own tests. The train runs the whole set.

| Unit | Model | Files (only these) | Content | Depends on |
|---|---|---|---|---|
| U1a | Sonnet | `tools/playtest/lib/access_leak_scanner.rb`; rewrite `test/controllers/break_escape/recorder_tags_scanner_mfa_test.rb` and `test/controllers/break_escape/recorder_tags_scanner_crack_test.rb` (they assert that the scanner ignores tags and call `hand_tag_problem`; they now assert the new reading and `tag_problem`); new `test/unit/access_leak_scanner_tags_mode_test.rb` | 3.1 (modes, `tag_problem`, `ArgumentError` refusal, `tags:` keyword, `@tags_on`, `row_pc_tag`, top-level `login` refused) and 3.2 for the privilege rules (P1, P3, P6, P12, the admitting check, the rejected-tag rule for the privilege take-back); T6b's privilege half | — |
| U1b | Sonnet (fresh, from U1a's note) | the same scanner file; new `test/unit/access_leak_scanner_tags_mfa_test.rb` | 3.2 for the second-step rules (P2, P5 (closed by names going; the optional `@mfa_placed` write is not what any test relies on), P7, P8 (a) and (b), P10) the rejected-tag rule's second-step take-back, and 3.3 (the tag refutation rule with its window, deadline and 2 s tolerance, and its own present map, which never reads or writes earn state, with T6, T6b's second-step half, T6c to T6m; the window opener of R5-m1; a sessions map's "no session" always an end, R5-1; the `mfaRequired` finding replaced, not doubled) | U1a |
| U2 | Sonnet (fresh) | the same scanner file; new `test/unit/access_leak_scanner_tags_crack_test.rb`; the crack parts of the two `recorder_tags_scanner_*` files if U1a left them | 3.4 (H1 to H4, with the current-run bound) | U1b (same file: in sequence, never in parallel) |
| U3 | Sonnet | `tools/playtest/lib/lock_step_leak_rules.rb`; new `test/controllers/break_escape/access_leak_scanner_lock_step_tags_test.rb` | 3.5 (P11, and the K1 reader with its synthetic route-room-plus-lock-step scenario; nested movable ids left out of the K1 proof, R5-m2) | the U1a reader API (`@tags_on`, `row_pc_tag`, named in section 3.1, so it can start beside U1a; it rebases on U1a before its tests run) |
| U4 | Sonnet; **only after owner question 1 is answered yes** | `app/controllers/break_escape/games_controller.rb` (the `GET room` branch `:584-598` and the route-room door open `S8c_R3_scanner.md:125-126` cites); its controller tests; any golden or unchanged-answer fixture that pins those two answers (grep `test/fixtures/files/ops_unchanged` and `bin/ops-golden-compare`) | K1 server key `routeRoom: true`, emitted only while `in_npc_route_room? && !unlockedRooms.include?` (section 2.3) | — |
| U5 | Sonnet | `tools/playtest/access-leak-check.rb`; new `test/unit/access_leak_check_cli_tags_test.rb` | `--untagged`; `tags: :required` by default; entries refused on tagged files; `tag_problem` called in place of `hand_tag_problem`; usage text and the header (`:1-75`, including the `login` refusal on `:75`) rewritten | the U1a API |
| U6 | **Haiku** (a Sonnet run checks any "stuck") | `test/fixtures/files/access_leak/tagged/*.jsonl` and a `README.md` there (which beats, game, date, recorder commit) | Record the real tagged captures (section 5.1). Each capture follows its scenario's own `PLAYTEST.md` setup: keyless server on that file's port range (never :3000, :3001, :3002, :3085 or :3086; `test_ops_mfa`, `test_ops_privilege`, `test_ops_crack` use 3011 to 3013, `demo_ops_second_step` uses :3023, `demo_ops_passwords` uses the free port the orchestrator names), games made with `swap-scenario-game.rb` and the host scenario the file names, never `new-game`. The server runs from the `/data/be-ops-skin` worktree at the cut base (so it includes S5b/S5c's server and client changes); the README records that commit, the port, and the recorder commit | the cut (section 4 Setup) |
| U7 | Sonnet (mechanical) | the existing test files that set `login` by hand: `grep -rl "'login' =>" test` on the cut base, minus `network_technique_hostile_test.rb` (a route name), `access_model_desktop_test.rb` (an attempt-method name) and `recorder_tags_scanner_mfa_test.rb` (U1a owns it): seven on `main` today (`access_leak_scanner_mfa_real_test.rb`, `access_leak_scanner_mfa_r2_test.rb`, `access_leak_scanner_mfa_fix_test.rb`, `access_leak_scanner_helpdesk_r1b_test.rb`, `demo_ops_recon_scenario_test.rb`, `ops_helpdesk_scenario_test.rb`, `demo_ops_second_step_scenario_test.rb`); plus the two S5b/S5c files that set a tag through an `extra:` helper (`test/unit/access_leak_scanner_harvest_test.rb`, `test/unit/access_leak_scanner_harvest_review_test.rb`). **Round 3 (R3-m2), checked on `0402ed2be`:** U7 changes only files that set a tag, by `'login' =>` or by an `extra: { 'login' => ... }` helper (`git grep -l "'login' =>" test` gives exactly the nine above plus the three excluded). Files that only pass names (`access_leak_scanner_mfa_r3_test.rb`, `access_leak_scanner_privilege_real_test.rb`, `demo_ops_passwords_scenario_test.rb`, `access_leak_scanner_playtest173_test.rb`, `access_leak_scanner_playtest187_test.rb`) run unchanged under `:auto`, because no tag sits beside the names; adding `tags: :absent` to them is optional | A file that tags only its sign-in rows would be a *mixed* file under 3.1 and be refused. The rule is **per scan call**, not per file, because some files mix tag cases and name cases (`access_leak_scanner_mfa_fix_test.rb`: 3 `'login' =>`, 20 name uses; `access_leak_scanner_mfa_r2_test.rb`: 3 and 9) and insert one hand-tagged row among rows of an untagged real fixture whose rows hold no request (`mfa_r2_test.rb:179`, `:214-217`; `mfa_fix_test.rb:177`, `:182`, `:487`). (a) A case whose scan uses a tag: replace `'login' =>` with `'pc' => { 'pcId' => ... }`, and set `'pc' => nil` (or `'hash' => nil` on `/crack`) on **every other** tag-bearing row passed to that scan, fixture rows included; it passes no names. Where the helper does have request params (`rec`, `sign_in_row` and the like), it tags by the recorder's own rule (`pcTag`/`hashTag`, `response-capture.js:106-144`): `pc_id` present and well formed gives `{ 'pcId' => ... }`, else `nil`. A "delete the tag" case (for example `doctored(:plain_signin) { \|r\| r.delete('login') }`, `access_leak_scanner_mfa_real_test.rb:422`) becomes `r['pc'] = nil`. (b) A case whose scan uses `signins:`/`logouts:` stays untagged and passes `tags: :absent`, so no name sits beside a tag. Assertions change only where a tag set to `nil` now means "unplaced" instead of a refusal or a name; each such change is listed in the commit message with its reason. | U1a |
| U8 | Sonnet | `.claude/skills/playtest-scenario/SKILL.md` (the "Tags on capture rows" paragraph), `scenarios/test_ops_mfa/PLAYTEST.md`, `scenarios/test_ops_privilege/PLAYTEST.md`, `scenarios/demo_ops_passwords/PLAYTEST.md`, `scenarios/demo_ops_second_step/PLAYTEST.md`, any other `scenarios/*/PLAYTEST*.md` or `.claude/skills/**` file the grep below finds, `tools/playtest/README.md`, `docs/ACCESS_AND_NETWORKS.md` (Known limits), the scanner and rule-file header comments (after U1 to U3 merge, as a last commit) | Section 6. First, on the cut base, run `grep -rn -- "--signin\|--logout" scenarios/*/PLAYTEST*.md .claude/skills tools/playtest/README.md` (on `main` today: the four PLAYTEST files above and `SKILL.md`; S5b/S5c may add more) and fix every hit that tells a tester to name a sign-in or sign-out for a **new** run; a line about checking an older capture keeps its entries with `--untagged` | U1b, U2, U3, U5 |

**How the units run.**
- **Wave 1:** U1a, U3, U5, U6, and U4 if approved.
- **Wave 2:** U1b and U7.
- **Wave 3:** U2.
- **Wave 4:** U8, then the review (section 7), then the train (`tools/playtest/train-check.sh /data/be-ops-skin <outdir> <port>`).

**Files not to touch:**
- the recorder (`response-capture.js`), which is final in track C;
- `helpdesk_leak_rules.rb`, except that U1a may keep `mfa_row_pc_tag`'s name so the desk rules are untouched;
- SecGen and every scenario file other than the `PLAYTEST*.md` files U8 lists (the four named and any the U8 grep finds).

## 5. Tests

### 5.1 Real captures (U6, Haiku, recorder from 1.0.21)

Each capture is a full scripted run of the scenario's `PLAYTEST.md`, with `--capture-responses`. Every capture file is kept,
oldest first. Each capture must give:
- `verify-run.rb --access`, matching the record that `PLAYTEST.md` expects;
- `access-leak-check.rb <game> <files>` with **no entries**: exit 0 and 0 findings (except the `--resume` case in C2, which gives
  its entry).

| Capture | Scenario | Beats beyond the written playtest | Limits it proves |
|---|---|---|---|
| C1 | `test_ops_mfa` | after the written beats, sign out at `plain_pc` and sign in again with no reload; sign in at one PC, open the desktop of another PC where a session of a **different** account is held, then the desktop of the first (an honest two-PC order: must be clean, section 3.3; R3-m3: a successful sign-in opens its own desktop at once, `password-minigame.js:2746`, so this order needs two panes or the bridge; if neither drives it, T6c uses the fallback below with real server answers); a wrong code at one PC while a code step is open at another, then wrong codes at that PC up to the lock | P1, P2, P5, P7, P8 (a) and (b), the 3.3 refutation rule's honest case |
| C2 | `test_ops_privilege` | sign in at a PC that is one of two admitting the admin account (no `--signin`); lock, then log out at one PC while a session is held at another | P1, P3, P6, P12 (if its playtest has a claim sign-in on the S5b/S5c base; else the P12 test uses server answers) |
| C3 | `test_ops_crack` (and `demo_ops_passwords` once its fixtures are on `main`) | two clicks during one salted wait, then the grant after the wait; a salted miss (`nomatch`), a retry, and its grant after the second wait | H1, H2, H3 (both runs), H4 |
| C4 | `demo_ops_second_step` (the one shipped scenario with both PC steps and lock steps: 4 `secondStep`, 5 sign-in PCs) | cancel a PC push step, then cancel a lock push step | P11 |
| C5 | any one of the above, recorded on the 1.0.20 recorder (untagged) | — | `:required` refuses it; `--untagged` with today's entries passes |

If a beat cannot be driven, U6 says so and the unit test for that limit uses real server answers (as the `*_real_test.rb` files
do) with rows tagged the way `pcTag` and `hashTag` would tag them. The tagging is done by a test helper that calls the recorder's
own `pcTag` through node, or copies its rules with a pin test.

### 5.2 Tamper tests (each fails on `main`'s scanner, or is a refusal that `main` lacks; the review checks this)

| # | Change to a real tagged capture | Expected |
|---|---|---|
| T1 | delete the `pc` key from one PC-route row | refusal (mixed file) |
| T2 | delete every `pc` and `hash` key | CLI: refusal (`:required`); library `:auto`: today's result, never fewer findings than the same file on `main` |
| T3 | `pc` on a `GET container` row; `hash` on a `/login` row | refusal |
| T4 | `{ "pcId": 5 }`, `{ "pcId": "" }`, a 201-character id, an extra key, `{ "pcid": ... }` | refusal |
| T5 | a `login` key on any row | refusal in the library and the CLI |
| T6 | move a sign-in's tag to the other admitting PC (pick a sign-in whose account the capture never showed at its real PC before; the other shape is the recorded residual, 3.3) | `ops_tag` finding from the 3.3 rule: the real PC's desktop, the first desktop row after the sign-in, shows the account by keyboard password where the present map does not hold it now |
| T6b | move a 200 sign-in's tag to a scenario PC that does **not** admit the account | `ops_tag` finding; the row earns no `admin:<pc>` and exempts nothing; and an admin step held at an admitting PC before the row is **taken back** (the 3.2 rejected-tag rule; both halves fail on `main`'s tag reader, which places it at the tagged PC only) |
| T6c | C1's two-PC desktop beat as recorded (no change); if U6 could not drive it, rows from real server answers (a sign-in at A, a 200 desktop of B held by another account, a 200 desktop of A) tagged by `pcTag` as 5.1 allows, and the U6 README says which | clean: a desktop of another PC between a tagged sign-in and its own desktop is not a refutation |
| T6d | (honest, must stay clean) a tagged token sign-in at a PC, then a row past its `expiresInS` deadline, then a reload whose sessions map and desktop show that PC empty | clean: the deadline ended the session, so the empty PC is an end, not `ops_tag` (R3-1) |
| T6e | (honest, must stay clean) the same account signed in at PCs A and B; B power-cut (403 `off`) and resumed; a tagged sign-in of that account at A; B's 200 desktop is the first desktop row after it. Four variants: an admin account and a **non-admin** account, each with and without a `--resume` entry for B | clean in all four: the present map keeps the account at B through the 403 `off` (R3-1, R4-1 item 1) |
| T6h | (honest, must stay clean, R4-1 item 2) account X signs in at B (tagged); a remote open of B is refused 403 `unreachable`; X signs in at A (tagged); B's 200 desktop at the keyboard, showing X by password, is the first desktop row after it | clean: a 403 `unreachable` removes nothing from the present map |
| T6i | (honest, must stay clean, R4-1 item 3) in a second-step scenario: X signs in at B; a 200 technique answer holds a `session` whose host label names no PC; a bodyless `POST /login` row; then X signs in at A (tagged) and B's desktop is the first desktop row | clean: neither row removes X from B in the present map (they may only add or mark "holder unknown") |
| T6j | (honest, must stay clean, R4-1 item 4) T6e's two-PC beat, keyboard-password sign-ins, in a scenario with **neither** rule set active (no admin account and no `secondStep`; for example a synthetic copy of a crack or helpdesk test scenario) | clean: the present map runs whenever `@tags_on` is set |
| T6k | (honest, must stay clean, R4-1 item 5) a tagged sign-in at A, A's own desktop, then (no other POST) B's desktop showing the same account by password where the map has never seen it (a session from before the first capture file) | clean: A's own desktop spent the cross-PC check |
| T6l | (R4-m1) a tagged token sign-in, then a "no session" answer about the tagged PC 1 s before the scanner's deadline (row `t` + `expiresInS`) | clean (an end within the 2 s tolerance); the same row 3 s before the deadline is an `ops_tag` finding |
| T6f | (honest, must stay clean) a tagged sign-in at A, its desktop at A, then much later (after another sign-in or step answer) a desktop of A showing another account or no session | clean: the window has closed, so this is an end, as on `main` (R3-1) |
| T6g | a tagged sign-in whose first answer about the tagged PC is a 200 **desktop** row showing no session while its deadline (or no deadline) has not passed | `ops_tag` finding (the desktop form; the sessions-map form is T6m and is clean) |
| T6m | (honest, must stay clean, R5-1) a tagged claim sign-in at A, then a reload whose sessions map omits A (no `endedPcIds` anywhere), before any desktop row of A; separately, the same with a relay sign-in at A, and with a `from` sign-in through a claimed pivot. Rows from real server answers where U6 cannot drive it (5.1) | clean: a sessions map showing no session at the tagged PC is an end, never a refutation; the window closes there. A variant whose sessions map shows **another account** at A is still an `ops_tag` finding |
| T7 | point a logout's tag at a PC the account was not at | the real session stays held; the later leak or step check is a finding |
| T8 | tagged capture plus `--signin` or `--logout` | exit 2 |
| T9 | tag that disagrees with a `lock_session` answer's `pcId`, an `mfaRequired` answer's `pcId`, or a remote sign-in's host label | `ops_tag` finding |
| T10 | tag naming an id that is not a scenario PC on a 200 row | `ops_tag` finding |
| T11 | C3 with the N4 shape (running for one record, cracked for another account's salted record) | `crack_unearned` |
| T12 | C3 with the cracked row moved before the wait ends | `crack_unearned` |
| T12b | C3 miss, retry: the second run's cracked row moved before the *second* wait ends (but after the first run's bound) | `crack_unearned` |
| T13 | C3 with `hash` set to `null`, or to another record's id, on the cracked row | `crack_unearned` |
| T14 | C4 with the lock cancel's echo removed (row `pc: null`) while a PC push step is open | lock-step finding |
| T15 | C4 with the PC cancel's tag set to `null` | lock-step finding (the answer is no longer the PC's, and it has no echo) |
| T15b | C1 with two code steps open at different PCs and the lock's `mfa/verify` tag moved to the other PC | the lock is reported (no credit at a PC whose count is not `max - 1`) |
| T16 | a tagged file and an untagged file of the same game | refusal |
| T17 | (after U4; synthetic scenario with a route room and a lock step, since no shipped scenario has both) a route-room door open with `routeRoom: true`, then a gate for a lock in that room | lock-step finding |
| T17b | T17, then a bare 200 `GET room` without the mark | still a lock-step finding (a `GET room` opens nothing new) |
| T17c | T17, then a 200 object unlock with no echo (in another room, and again with contents ids of the route room), then a gate in the route room | still a lock-step finding (an echo-less object answer proves no room) |
| T17d | T17, then a 200 object unlock whose echo's `targetId` (the lock subject) is an authored object of the route room, once a top-level object and once an object nested in a container's `contents`, then a gate there | clean (the echo proves the room); the same echo naming an object of another room, a movable (`takeable`/`needsTag`) object (both a top-level one and, R5-m2, a `takeable` item nested in a fixed container), or an id in no room proves nothing for the route room |

### 5.3 Pins and regressions

- The scanner's route lists match `response-capture.js` `PC_ROUTE_RE` and `CRACK_ROUTE_RE` (the test reads the source).
- Every existing scanner test passes with assertions unchanged, apart from the U7 changes listed in its commit (a deleted tag
  now set to `nil`) and the two `recorder_tags_scanner_*` rewrites in U1a (the reviewer diffs every `assert*` line in the
  touched test files and checks each change against those lists).
- The untagged real fixtures (`test/fixtures/files/ops_mfa_real_capture_rows.jsonl`, `ops_privilege_run72_*.jsonl`,
  `ops_privilege_browser_run_*.jsonl`, `ops_helpdesk_*`, `ops_crack_game85_net_sweep.jsonl`) give the same findings as on
  `main` under `:auto` and `:absent`.
- Each new limit closure has a test that shows the old exit 2 or false finding is now clean, for example P2 on the C1 rows.
- Each closure also has a test that fails without the fix (the builder runs it against `git show main:` of the scanner and
  records the result).

## 6. Docs (U8)

- **`SKILL.md`, "Tags on capture rows"** (`/data/be-ops-follow/.claude/skills/playtest-scenario/SKILL.md:344`, on `main` after
  1.0.21):
  - the scanner reads the tags;
  - a tagged capture takes no `--signin` and no `--logout`;
  - `--resume` stays;
  - an older capture needs `--untagged` and its entries.
- **`scenarios/test_ops_mfa/PLAYTEST.md`, `scenarios/test_ops_privilege/PLAYTEST.md`, `scenarios/demo_ops_passwords/PLAYTEST.md`
  (`:23`, `:28-29`), `scenarios/demo_ops_second_step/PLAYTEST.md` (`:33`, `:36`), and every other hit of U8's grep:**
  - drop the `--signin` and `--logout` instructions for new runs, and keep one line saying how to check an older capture;
  - drop the "sign-out needs a reload" advice that A4 R4-L2 asked for.
- **CLI header** (`:1-75`) and **usage** (`:79-81`): the modes, the refusals, `--untagged`, which entries go with which mode.
- **Scanner header limit text:**
  - rewrite or remove the sentences that say no recorder tags a sign-in (`:182-187`, `:191-200`, `:4154-4159`);
  - replace the `hand_tag_problem` comment (`:335-338`);
  - lock rules header `:28-31` loses the P11 limit and gains the K1 rule;
  - crack header `:224-239` gains the per-record rule.
- **`docs/ACCESS_AND_NETWORKS.md` Known limits:** the section 2.4 list, replacing the items closed here.
- **`tools/playtest/README.md`:** one line on `--untagged`.
- **Stage log:** the section 2 table, with each limit's outcome. Put it in a new
  `docs/agents/ops_core_build/reviews/HARDEN_limits.md`, or in the stage's own log if the orchestrator keeps one.

## 7. What the review must check

**Model.** Opus 5.5, with "review" in the launch description; delta rounds go to Sonnet, except a delta that touches what the
server serves (U4), which goes to Opus. The review runs 2 to 5 rounds (AGENTS.md:41-43). Each review file is created within the
first few calls and appended to after each check.

1. **Never looser.** For every rule that changed, find any input the new code passes that `main` reported. Run every untagged
   fixture and every tamper test on both `main` and the branch. The branch must report at least what `main` reports on each
   untagged input. No `ops_tag` finding may appear on an honest input (T6c to T6f, T6h to T6k, T6m and T6l's first half must be clean; T6 and T6g must still be caught). Any honest-capture finding that disappears must be one that section 2 says closes.
2. **Fail closed on missing tags:**
   - T1 to T5 and T16 are refusals in the library and the CLI;
   - `:auto` never reads a tag in a file the mode check called untagged;
   - a `null` tag never places, credits or exempts anything.
3. **The tag is used only as the request's word.** Each place that reads a tag either places a row that the server's own route
   would have placed from `params[:pc_id]` (`games_controller.rb:1728`, `:1746`; `mfa` routes) or `params[:hash_id]` (`:2118`),
   or is cross-checked by section 3.3. A sign-in tag at a PC that does not admit the account places nothing and takes back at
   least what `main` takes back for an untagged row (T6b); no rejected tag narrows an end. Check the
   query-beats-body case: a row whose query names `pc_id` has `pc: null` from the
   recorder (`response-capture.js:125-126`), and the scanner must treat it as unplaced.
4. **Names and tags never mix.** T8 holds, `--resume` still works in both modes, and `unused_entries` still exits 2.
5. **Real captures.** C1 to C4 are clean with no entries. C5 is refused under `:required` and passes under `--untagged` with
   today's entries. Read the U6 README for which beats were really driven and which fell back to server-answer tests.
6. **Each closure in section 2 has a test that fails on `main`.** The reviewer reruns three of them against `main`'s scanner.
7. **K1 (if U4 ran):**
   - the key appears only while `in_npc_route_room? && !unlockedRooms.include?` holds (never in the both-lists interim);
   - no other answer shape changed (the payload scan, the golden compare and the opened-state scan stay green);
   - the scanner rule is inert without the key.
8. **Docs:**
   - no doc still tells a tester to name a sign-in or sign-out for a new capture;
   - section 2.4's list is in Known limits, and the closed items are gone from every header.
9. **Train:** GREEN, with the expected new test counts listed by each unit.

## 8. The command-line entries

| Entry | Tagged capture | Untagged capture | Recommendation |
|---|---|---|---|
| `--signin` | Not needed: the sign-in row's `pc` places it (P1, P12). Refused (exit 2). | Needed, unchanged. Allowed only with `--untagged`. | Keep, behind `--untagged`. The existing untagged fixtures and their tests depend on it, and so does any capture made before 1.0.21. Remove once those are retired (owner question 5). |
| `--logout` | Not needed (P3, P4). Refused. | Needed, unchanged; `--untagged` only. | Same as `--signin`. |
| `--resume` | **Still needed.** The tags do not reach it (section 2.4). | Needed, unchanged. | Keep in both modes. |

## 9. Owner questions

1. **Route-room key.** May the server add `routeRoom: true` to the `GET room` and door-open answers of an unpromoted route room
   (K1)? It is an engine change, and the approval list needs a yes (AGENTS.md:156). Its value today is small: only
   `lab_physical_pentest` and `test_gate_tailgate` have route rooms, neither has a lock step, and the lock rules are inert without
   one, so no shipped scenario's check changes; it guards future scenarios and churns golden fixtures. Recommended: yes, but low
   priority; a no is also reasonable. Without it, limit C5 item 7 stays, and U4 is dropped.
   **1 b (round 3).** A second, separate key would close the K1 residual: `roomId` on the 200 object answer of `POST /unlock`
   (section 2.4). Recommended: no for now (fails closed, no shipped scenario affected). If yes, it is its own small server unit
   with controller tests (key present only for an authored object, absent for a runtime one), plus a lock-rules reader and the
   T17c/T17d tests reworked for it.
2. **`--resume`.** Keep it as a tester's entry, or plan a later server mark (such as `resumed: true` on the desktop answer after
   `off`)? Recommended: keep it for now. No shipped mission depends on it.
3. **Helpdesk stop rule order.** Option (a), client query `desk_id`+`username`; option (b), one opaque server key; or keep it as a
   limit (desk rules `:53-60`)? Recommended: (b), in a later stage, because (a) puts typed usernames in URLs and logs.
4. **Crack wait tolerance.** A 2-second allowance on the recorder clock for H3. Recommended: 2 s. Choosing 0 would report honest
   grants whose response arrived late.
5. **Retiring `--signin` and `--logout`.** Keep them behind `--untagged` indefinitely, or remove them with the untagged fixtures
   in a later clean-up? Recommended: keep them.
6. **An unconfirmed tag stands.** A name today needs a desktop row to confirm it in second-step scenarios. This plan lets a tag
   stand with no desktop, and makes a later refutation a finding. Recommended as planned: the tag is the server's own input,
   with the same standing as `inv`. Overrule if you want the desktop confirmation kept for tags too, which is stricter but brings
   back "a sign-in whose desktop never opened cannot be checked" (A2:135).

## Review log

### Round 1 (`HARDENING_PLAN_REVIEW_R1.md`, Opus 5.5): 1 blocker, 6 major, 9 minor

Checked by the planner on `main` `9e5d56f70` and `ops-priv2` (`/data/be-ops-logs`, head `d7437165c`; `git merge-base
--is-ancestor ops-priv2 main` is false, so S5b/S5c is not landed).

| Item | Outcome | Where |
|---|---|---|
| B1 branch point skips S5b/S5c | Fixed. Cut after S5b/S5c lands (or from `ops-priv2` after its train, then merge `main`); P12 marked conditional on that base; the five S5bc test files added to U7; builders find functions by name. | header, P12, section 4 Setup, U7 |
| M1 mixed-file refusal vs U7 | Fixed. (a) Library refusal raises `ArgumentError` (exit 2 via the CLI rescue). (b) U7 tags every PC-route and crack row in the helpers by the recorder's rule; a deleted tag becomes `nil`; assertion changes listed in the commit. (c) The two `recorder_tags_scanner_*` files move to U1a as rewrites. Count corrected: of the ten grep hits, `network_technique_hostile_test.rb` and also `access_model_desktop_test.rb:90` (an attempt-method name) are not tags, so U7 has seven files on `main`, plus five from S5bc; `recorder_tags_scanner_crack_test.rb` has no `'login' =>` hit but asserts tags are ignored, so U1a rewrites it too. | 1.2, 3.1, U1a, U7, 5.3 |
| M2 tag at a non-admitting PC | Fixed. A sign-in tag counts only at a PC that admits `npcId`; otherwise `ops_tag` finding and no placement. T6b added. Verified `priv_signin_candidates` returns before `admitting` is used (`:2986-2988` on `9e5d56f70`). | 3.2, 3.3, T6b, section 7 item 3 |
| M3 P9 mechanism absent | Withdrawn as a closure: P9 moved to 2.4 ("Stays"), the "Wrong passwords" bullet now says unchanged, and C1 no longer claims P9. Verified `record_login_failure!(pc, key, account:)` at `game.rb:4709` and the `max - 1` credit at scanner `:1793-1806`. | 2.1, 2.4, 3.2, C1 |
| M4 P8 lock credit | Fixed. `mfa_verify_lockout_proved?` takes the row and uses the open code step at the tagged PC; `null` keeps "exactly one". Verified `open.size == 1` at `:1798-1799`. C1 gains the lock beat; T15b added. Also closes the tag half of A5 item 8. | P8, 3.2, C1, T15b |
| M5 H3 first-ever running row | Fixed. Bound is the current run's first `running` row, cleared by `nomatch` or `cracked`. Verified `crackStarted` with new `at` (`ops_cracking.rb:180-183`) and the clear and `nomatch` (`:215-224`); later `running` rows answer the remaining wait (`:217-218`). C3 gains a miss-and-retry beat; T12b added. | H3, 3.4, C3, T12b |
| M6 K1 predicate, re-open, value | Fixed. (a) Key only when `in_npc_route_room? && !unlockedRooms.include?` (`game.rb:337-342`, gate at `games_controller.rb:1287-1290`; interim comment `:1314-1318`). (b) Re-open only by a door open that proves the room, as today, or a 200 object action in the room; a `GET room` opens nothing new; T17b added. (c) K1 now "Narrow"; owner question 1 says no shipped scenario changes (route rooms only in `lab_physical_pentest` and `test_gate_tailgate`, neither with `secondStep`, verified by grep); T17 uses a synthetic scenario. | 2.3, 3.5, U4, T17, T17b, section 7 item 7, owner question 1 |
| m1 baseline drift | Fixed: header says line numbers are a guide and builders find by name. | header |
| m2 `@mfa_placed` lines | Fixed: `:4177` init, `:4584` write; U1b adds the write on the tag path. | P5, U1b |
| m3 crack init lines | Fixed: `:548-551` and `:3656-3669` both change. Verified `@crack_running_credits = 0` at `:548`. | 3.4 |
| m4 404 citation | Fixed: cites `game.rb:3670` ("Sign-in PC not found", `:not_found`). | 3.3 |
| m5 `login` anywhere | Fixed: top-level row key only. | 3.1 |
| m6 CLI header range | Fixed: `:1-75`, with the `login` refusal on `:75`. | U5, section 6 |
| m7 refutation vs unconfirmed | Fixed: for a tag only a refutation counts (as an `ops_tag` finding); unconfirmed is silent; the privilege rules' name refutation applies the same way. | 3.3 |
| m8 mfa lock path | Fixed: P6 is mostly a cross-check since the server always sends `pcId`; `@mfa_locked` still comes from the answer, cross-checked against the tag. | P6, 3.2 |
| m9 A5 items 3, 4, 8; `mfaRequired` double report; reader API | Fixed: items 3, 4 and 8 (second half) added to 2.4; in tagged runs the `ops_tag` finding replaces the `mfa_required_answer_ok?` mismatch; `@tags_on` and `row_pc_tag` named as the U1a API for U3/U5. | 2.4, 3.1, 3.3, U3 |

### Round 2 (`HARDENING_PLAN_REVIEW_R2.md`, Opus 5.5): 0 blockers, 4 major, 6 minor

Checked by the planner on `main` `9e5d56f70`: `priv_signin_candidates` falls back to `[admitting, admitting.size == 1]` at
`:3009`; `note_privilege_signin` (`:3103`) clears every candidate at `:3113-3120` and earns only at an admitting PC (`:3124`);
`mfa_place_signin` tag path `:4510`, fallback `:4516-4517`; `mfa_note_signin` `:4809-4822`; `crack_answer_shape_ok?` `:3747`,
`infeasible` `:3762`; `crack_grant(account, accounts)` `:3687`; `@mfa_placed` read only at `:4550` (`mfa_arm_confirm`) and
used by `mfa_unplace` `:4793`; the route-room gate in `games_controller.rb:1287` and `game.rb:4391`, `:4464`, `:5220`, `:5234`,
`pin_dust.rb:36` (all inside the unlock path); the four PLAYTEST setups (swap script, ports) and the `--signin` lines in
`demo_ops_passwords/PLAYTEST.md:23`, `:29` and `demo_ops_second_step/PLAYTEST.md:33`, `:36`.

| Item | Outcome | Where |
|---|---|---|
| N1 rejected tag takes back less | Fixed. One rule: a rejected tag raises `ops_tag`, earns nothing, and for every end or take-back is treated as an untagged unnamed row (privilege `[admitting, admitting.size == 1]`; second step `@priv_pcs.keys` / `mfa_admitting_pcs`). A rejected tag never narrows an end; logout and lock rows too. T6b now asserts the take-back. | 3.2, U1a, U1b, T6b, section 7 item 3 |
| N2 "another PC shown" refutes honest runs | Fixed. For a tag, only an answer about the tagged PC refutes it, plus one cross-PC case (same account by keyboard password at another PC where it is not held), which catches T6. C1 gains an honest two-PC desktop beat; T6c added. | 3.3, U1b, C1, T6, T6c |
| N3 U6 setup contradicts PLAYTESTs | Fixed. U6 follows each PLAYTEST's setup (swap script, its port range, never :3001), runs the server from the `ops-harden` worktree at the cut base, and records that commit. | U6 |
| N4 two more PLAYTESTs say `--signin` | Fixed. `demo_ops_passwords` and `demo_ops_second_step` PLAYTESTs added to U8 and the allowed list; U8 greps `--signin\|--logout` on the cut base and fixes every new-run instruction. | U8, section 4 not-touch list, section 6 |
| N5 U7 per file vs mixed files | Fixed. The rule is per scan call: a tag case sets `nil` on every other tag-bearing row (fixture rows included) and passes no names; a name case stays untagged with `tags: :absent`. | U7 |
| N6 P12 "two more" readers | Fixed. Same two readers, moved; none extra. | P12, 3.2 |
| N7 H4 misses `infeasible` check; `crack_grant` row | Fixed. `crack_answer_shape_ok?` takes the row; in tagged mode `infeasible` needs the tagged record strong with its own `nomatch runs: 1`. `crack_grant` takes the row. | H4, 3.4 |
| N8 K1 "every object action" too wide | Fixed. Only a 200 `POST /unlock` of a non-door target in the room proves promotion; the gate's callers named. | 2.3, 3.5 |
| N9 P5's `@mfa_placed` write does nothing | Fixed. P5 closes because names go; the write is optional for `mfa_unplace` consistency and no test relies on it. | P5, U1b |
| N10 line guide shift numbers | Fixed. Specific shift numbers dropped; "about" kept. | header |

Planner's verification pass (round 2, second revision), on `main` `9e5d56f70` (`ops-priv2` still not an ancestor of `main`):
every function the plan names resolves by `grep -n "def <name>"` (`priv_signin_candidates :2983`, `priv_logout_pcs :3076`,
`note_privilege_signin :3103`, `crack_grant :3687`, `crack_answer_shape_ok? :3747`, `mfa_row_pc_tag :4252`,
`mfa_place_signin :4500`, `mfa_arm_confirm :4547`, `mfa_confirm_step :4565`, `mfa_confirm_desktop :4579`, `mfa_unplace :4793`,
`mfa_note_signin :4809`, `mfa_logout_pcs :4862`, `mfa_verify_lockout_proved? :1793`); `@mfa_placed` is read only at `:4550`
and `:4822`; `object_in_unpromoted_route_room?` has exactly the six callers 2.3 names; `ops_cracking.rb:181` stores
`crackStarted`, `:217-218` answers the remaining wait, `:220` clears it. Two further changes came out of this pass:

| Item | Outcome | Where |
|---|---|---|
| N1 follow-up: "single admitting PC still exact" contradicted "earns nothing" | Fixed. A rejected tag gives `[admitting, false]` in the privilege rules: same take-back set as `main`'s fallback, never exact, so it earns no admin even with one admitting PC (the earn needs `exact`, `:3121-3126`). | 3.2 |
| U6 port for `demo_ops_passwords` (C3) unstated | Fixed. Its PLAYTEST (`:11`) says a free port the orchestrator names, never :3000-:3002, :3085, :3086. | U6 |
| U8 grep on `main` | Confirmed: hits in `test_ops_mfa`, `test_ops_privilege`, `demo_ops_passwords` (`:29`; `:88` says no names are needed and stays), `demo_ops_second_step` (`:33`, `:36`) PLAYTESTs and `SKILL.md:344`; none in `tools/playtest/README.md`. | U8 |


### Round 3 (`HARDENING_PLAN_REVIEW_R3.md`, Opus 5.5): 0 blockers, 2 major, 3 minor

Checked by the planner on `main` `0402ed2be` (1.0.22; S5b/S5c merged at `219e05b1a`, `d7437165c` is an ancestor). Function
lines on that commit are in the header.

| Item | Outcome | Where |
|---|---|---|
| R3-1 tag refutation has no time window | Fixed. Each tagged sign-in opens one window: the tagged-PC check is spent on the first answer about that PC (desktop or sessions map), the cross-PC check on the first desktop row of another PC; both close at any other sign-in, sign-out, lock or step answer, any end at the tagged PC, or the capture's end. After that an answer is an end, as on `main` (`note_priv_desktop` `:3254`, `note_privilege_bootstrap` `:3425`, "R5-3: ends only"). "No session" refutes only while the sign-in's own deadline (row `t` + `expiresInS` for `kind: token`, the formula at `:3154-3157`) has not passed; the tag rule keeps that deadline itself, because the second-step rules keep none (verified: no deadline state beside `@mfa_held`/`@mfa_at`, `:4366-4368`). Held sets named: `@ops_session_accounts` + `@priv_resumable` (privilege; `end_priv_session` `:3403-3416` drops the first and keeps the second on a 403 `off`), `@mfa_at`/`@mfa_held` (second step); the check runs after `apply_priv_resume` (`:3261`). Honest tests T6d (token expiry + reload), T6e (two PCs, power cut, resume), T6f (late end) added, plus tamper T6g. Client expiry with no request verified at `pc-sessions.js:451`; the sign-in opens its own desktop at `password-minigame.js:2746` (was `:2729`). New residual recorded: a tag moved to B while the account is already held at A is not refuted; the key that would close it is `pcId` on the 200 sign-in answer (verified absent from `login_session_answer`, `game.rb:4862-4890`). | 3.3, 2.4, U1b, T6c-T6g, section 7 item 1 |
| R3-2 K1 object-unlock proof not readable from the capture | Fixed by narrowing, not guessing. An object unlock proves a room only when its answer names the target through the gated-lock echo (`lock_step_open_echo`, `lock_step_requests.rb:94-99`, merged at `games_controller.rb:1347`; the answer is otherwise `{ success: true, type: 'object' }`, `:1343-1346`) and that id is an authored object of exactly that room in `@ls_room_ids` (as `ls_note_rooms` proves a door, lock rules `:253-263`). An echo-less answer proves nothing (runtime objects are never gated, `game.rb:336-337`). The rest is a recorded limit with the exact key that would close it: `roomId` on the 200 object answer, from the same `login_scope_of(target_id)[:room_id]` lookup `object_in_unpromoted_route_room?` does (`game.rb:338-344`); owner question 1 b, recommended no for now, and if yes, its own server unit with controller tests. T17c (echo-less unlock, still a finding) and T17d (echo proves the room) added. | 2.3, 2.4, 3.5, T17c, T17d, owner question 1 b |
| R3-m1 "a 200 with such a tag means disagreement" | Reworded. The server resolves `pc_id` by id, name or client id (`find_login_pc` `game.rb:3310`, `locate_object_in` `:4677`; 404 at `:3696`, was `:3670`). The scanner does not resolve names; the row is reported (fail closed). Confirmed safe for honest runs: the browser sends `data.id` (`unlock-system.js:668`), a keyring sign-in answers 200 only when `connectsTo` equals the PC id (`credential_login.rb:49`), and the validator requires `connectsTo` to be a sign-in PC id (`validate_scenario.rb:7730-7731`). | 3.3 |
| R3-m2 U7 file list | Fixed. U7 changes only files that set a tag (`'login' =>` or an `extra:` helper); on `0402ed2be` that is seven controller files plus the two harvest unit files. Name-only files (`mfa_r3`, `privilege_real`, `demo_ops_passwords_scenario`, `playtest173`, `playtest187`) run unchanged under `:auto`; `tags: :absent` is optional for them. | U7 |
| R3-m3 C1 two-PC order may not be drivable | Fixed. C1 names the need for two panes or the bridge and uses a different account at B; T6c names the fallback (real server answers tagged by `pcTag`, 5.1) and the U6 README records which was used. | C1, T6c |
| Base update | Section 4 Setup now cuts from `main` at or after `0402ed2be`; the "never cut while S5b/S5c is open" text is gone. U8's grep on `0402ed2be` still hits the four PLAYTEST files and `SKILL.md:344` (`test_ops_privilege` lines moved to `:66-75`, `:247`). | header, section 4 |

### Round 4 (`HARDENING_PLAN_REVIEW_R4.md`, Opus 5.5): 0 blockers, 1 major, 3 minor

Checked by the planner on `main` `0402ed2be`.

**Decision on R4-1: keep the cross-PC refutation, rebuilt on its own over-counting present map; do not drop it.** Reason: every
honest failure the review found came from reading the earn rules' state, which under-counts on purpose. A map that only adds
on capture evidence that the account was at a PC, and removes only on an answer that names that PC and shows the session gone,
can only miss refutations (honest direction), never invent one, and it is built entirely from what the capture holds. It still
catches T6 whenever the capture never showed the account at its real PC, which is the case the check exists for. What it
gives up (an account seen earlier at A with no naming end since) is folded into the already recorded residual, whose closing
key (`pcId` on the 200 sign-in answer) is unchanged. **Fallback for round 5:** if the reviewer finds any honest order the
present map still flags, the builder drops the cross-PC case (T6 then falls to the residual) and keeps the rest of 3.3; no
further redesign.

| Item | Outcome | Where |
|---|---|---|
| R4-1 (1) non-admin T6e | Fixed. Verified: `note_priv_desktop` `:3255-3256` calls `downgrade_priv_step(pc, keep: false)`, which deletes `@priv_resumable[pc]` at `:3279-3281` when no admin step was held, before `apply_priv_resume` (guarded by `.equal?(earlier)`, `:3261`). The cross-PC check no longer reads `@priv_resumable`; a 403 `off` removes nothing from the present map. T6e now has admin/non-admin x with/without `--resume`. | 3.3, T6e |
| R4-1 (2) 403 `unreachable` | Fixed. Verified: the session lookup (`games_controller.rb:3589-3590`) runs before the route refusal (`:3605-3606`), and `note_privilege_ends` keeps a resumable record only for `off`/`not_responding` (`:3181-3184`). No 403 desktop answer removes from the map. Also found: reason `no_session` is sent both for no session (`:3590`) and for a session held by another route (`network_access.rb:1070` via `games_controller.rb:3603-3604`), so it removes nothing either (stricter than the review's fix, which listed `no_session` and `expired` as removals). T6h added. | 3.3, T6h |
| R4-1 (3) second-step all-PC ends | Fixed. Verified `mfa_note_bodyless` `:4783-4790` and `mfa_note_foreign_session` `:4969-4975`. In the map, a foreign session-bearing answer only adds (at its label's PC, else every PC); a bodyless row only marks "holder unknown". T6i added. | 3.3, T6i |
| R4-1 (4) which held set | Fixed by removing the question: one map, run whenever `@tags_on`, whatever rules are active (verified `@priv_active` `:2975`, `@mfa_active` `:4389`). T6j added. | 3.3, U1b, T6j |
| R4-1 (5) window too long | Fixed. The cross-PC check is spent on the first desktop row of any PC, the tagged PC's own included. T6k added; T6 still caught (its first desktop is the real PC). | 3.3, T6, T6k |
| R4-m1 deadline tolerance | Fixed. "No session" at or after deadline minus 2 s is an end (same 2 s as H3, owner question 4). T6l added. | 3.3, T6l |
| R4-m2 header base | Fixed. The `ea0a70167` sentence is gone; the header says only its own block and the round 3/4 log are on `0402ed2be`, the rest is a guide. | header |
| R4-m3 echo `targetId` is the subject | Fixed. Verified `lock_step_open_echo` `lock_step_requests.rb:98` returns `info[:subject][:id]`; for an object that is the resolved object's id (`lock_step_info` `:102-107`; `lock_step_for`, `lock_second_step.rb:126`). `@ls_room_ids` already includes nested contents ids (`ls_server_ids` / `ls_server_content_ids`, lock rules `:198-212`), less movable objects (`:186-190`). An id in no room or two proves nothing. T17d names the top-level, nested, movable and unplaced cases. | 3.5, T17d |

### Round 5 (`HARDENING_PLAN_REVIEW_R5.md`, Opus 5.5, final): 0 blockers, 1 major, 3 minor

Checked by the planner on `main` `0402ed2be` (the `ops-hardening` branch head at the brief's cut). Every round 4 finding was
closed, and the review found no honest order that the present map flags, so the round 4 fallback (drop the cross-PC case) is
**not** taken. The major is in the tagged-PC half of 3.3.

| Item | Outcome | Where |
|---|---|---|
| R5-1 a sessions map's "no session" refutes honest claim and relay sign-ins after a reload | Fixed. A sessions map showing no session at the tagged PC is always an end, never a refutation; it closes the window. Only a sessions map showing another account refutes, plus the desktop forms (another account, or a 200 desktop with no session before the deadline). Verified: `end_claimed_sessions!` `game.rb:3972-3985` ends every claim and relay session (`reload_ended_session_ids` `:3993-3997`) and prunes onward sessions (`prune_unreachable_sessions!`), called at `games_controller.rb:491` in the scenario bootstrap; `sessions_for_client` `game.rb:4019-4040` omits them and the answer carries no `endedPcIds`. T6m added (claim, relay, and `from`-through-a-claimed-pivot variants, plus an "another account" variant that still refutes). T6g narrowed to its desktop form. Section 7 item 1 lists T6m as honest. | 3.3, T6g, T6m, U1b, section 7 |
| R5-m1 what opens a window | Fixed. Only a 200 answer with `success: true` holding `npcId` that completes a sign-in opens one: a `POST /login` success (`mfa_place_signin` returns early otherwise, scanner `:4687`) or a step pass that completes a sign-in (`mfa_push_passed!` `mfa_sign_in.rb:313`, sign-in at `:320`; `mfa_code_passed!` `:370`, sign-in at `:376`). An `mfaRequired` answer adds to the present map and opens nothing; a `null` or rejected tag opens nothing. | 3.3 |
| R5-m2 nested movable item stays in the K1 proof | Fixed in U3. Verified: the movable cut (lock rules `:186-190`) looks only at top-level `room['objects']`; nested ids come from `ls_server_content_ids` (`:207-215`). The K1 echo is matched against `@ls_room_ids[room]` less every id that is, or sits inside, a `takeable`/`needsTag` object at any depth; `@ls_room_ids` and the door proof are unchanged. T17d names the nested `takeable` case. | 3.5, U3, T17d |
| R5-m3 "never seen" or "present now" | Fixed: "present now" (the map with its removals), which catches more T6 shapes and is honest-safe (a removal needs an answer that shows the session gone; a later password session there needs a recorded sign-in, which adds again). 3.3's cross-PC bullet and T6's expected text now say "does not hold it now". | 3.3, T6 |
| Branch and worktree | The brief is cut on `ops-hardening` in `/data/be-ops-skin` (from `0402ed2be`), not `ops-harden` / `/data/be-ops-harden`. | section 4 Setup, U6, Wave 4 |
