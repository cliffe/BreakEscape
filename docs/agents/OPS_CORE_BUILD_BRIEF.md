# Ops core build: shared brief

Every builder, reviewer and tester on this build reads this first. Started 2026-11-23.

## What is being built

`docs/achitechture/OPS_CORE_PLAN.md` (stages S1 to S3, features N13 to N15), after its
prerequisite, stages L1a and L1b of `docs/achitechture/OPS_LOG_ROWS_PLAN.md`. The plans are the
spec. Build what your step names and nothing from a later step or another plan. Where the plan
and the code disagree, the plan's intent wins if it is clear; otherwise stop and report the
question rather than guessing.

Kind of work: engine and server features plus small test scenarios (`test_ops_*`). Prose stays
at game-design level. Products are invented. Do not open SecGen or the exploit-detail guides.

## Where to work

- **Build worktree: `/data/be-ops-build`** (also `/home/deploy/be-ops-build`), branch
  `ops-build`. All building, fixing and reviewing happens here; use absolute paths under it.
  `/data/be-ops-core` (branch `ops-core`) is now the TRAIN tree: the orchestrator fast-forwards
  it and runs train checks there. Never edit, commit or run anything in it. Older notes and
  prompts that say `/data/be-ops-core` mean the build worktree. Never edit or commit in
  `/home/deploy/BreakEscape` (main) or any other repo. Never edit `.claude/skills/*` or
  campaign missions (m01 to m10, sis*).
- Scratch files: the scratch folder your prompt names, never the repo.
- Read narrowly: the plan sections and line ranges your prompt names, and the code you edit.
  The plans are long (core 2120 lines, log rows 1296); do not read them whole. Digests of the
  existing code are in `docs/agents/ops_layer/digests/` (D1 to D6) if you need orientation.

## Rules

- **Database.** Every tree shares the development database and it has no backup. Never run
  `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop`, `db:setup` or `db:seed`.
  If a step seems to need a migration, stop and report.
- **Tests.** Rails tests share one test database: run them under the shared lock,
  `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>`, from the build worktree's root. Do not set
  `BUNDLE_PATH` (the gems are system gems). The lock is shared with other sessions' trains, so
  a run can queue for many minutes: that is normal, wait for it. After any edit to an engine
  file, also run `bin/ops-golden-compare` with NO outer `flock` (it takes the lock itself; wrapping it deadlocks the queue for every session) to prove old scenarios answer as
  before; see `docs/agents/ops_core_build/HANDOVER_L1a_1.md`. Never
  `ruby -Itest`. Run only the files your step touches plus those the plan's "proof before
  moving on" names; the orchestrator runs the full train check.
- **Servers.** Never touch ports 3000, 3085 or 3086. Live checks use a keyless server started
  from this worktree on a free port (`tools/playtest/start-keyless-server.sh`,
  `PLAYTEST_PORT`), make their own games with `tools/playtest/new-game.rb`, and stop only the
  server they started, by PID.
- **Git.** Never `git stash`, `git checkout -- <file>`, `git reset` or rebase. Commit only when
  your prompt says to, and then only your own files by explicit path:
  `git commit -m "..." -- <path> <path>`. No attribution lines. UK English, plain writing.
- **Shared files** (core plan 12.2): make the smallest edit, re-read just before editing, never
  reformat. `scripts/scenario-schema.json` has very long lines: edit only your block.
- **Delta sync.** Synced `player_state` must never grow and be re-sent whole; changes go as
  deltas (`SYNC_DELTAS_PLAN.md` section 11). New ops state is server-owned and is not a sync
  section. Reviewers check this every round.
- **No exploit content.** Abstract, fictional mechanics only. Real tool ids and module names
  live only in the realism catalog (`config/break_escape/realism_catalog/*.json`, the skin
  plan's), linked by a plain `realism: "<id>"`; catalog ids are append-only. This build makes
  only the loader and a test-only catalog under `test/fixtures/realism_catalog/`.
- **Games.** Never edit an existing game row. Live proofs make fresh games. A new `test_ops_*`
  scenario has no Mission row until it is seeded after landing, so `new-game.rb` cannot find
  it: make its game with
  `env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin <scenario_dir>`
  (prints `GAME_ID=`; no seed, no Mission row), run from the worktree root. Do not use
  `tools/playtest/new-game.sh` here (it sets a `BUNDLE_PATH` that fails).
- **Event mappings.** A new `eventMappings` entry goes last (the server keys them by index);
  `tools/check_mapping_index_drift.rb` must pass before landing.
- **New JS imports.** A new static import in an engine JS module is added to every JS test
  harness copy list.
- **Docs.** A landed feature is added to the `README_scenario_design.md` feature index and
  `docs/ACCESS_AND_NETWORKS.md` in the same stage.
- **The plan wins over older notes.** `docs/agents/OPS_LAYER_HANDOVER.md` section 5 and
  `OPS_LAYER_RESUME.md` hold rulings from earlier rounds, some since replaced (noise,
  `network_only`, `network_alerted` are not in the final core plan). Build from the plan text.
- **Claims.** Report only what you ran. Say which tests ran and their counts; a static check is
  not a browser test.
- **Context.** When your context passes about 150k tokens (roughly 80 tool calls), finish the
  edit in hand, write a handover note to `docs/agents/ops_core_build/HANDOVER_<step>.md` (done,
  open, in progress, files touched, commits, gotchas; point to code by file:line), report and
  stop. Write notes and findings files early and append as you go.
- **Report back** in at most 15 lines: status, commits, test counts, file paths, questions. No
  long quotes.
- If a safety check stops you, stop and report the exact message and where you were.

## Reviews

A reviewer is read-only apart from its findings file
(`docs/agents/ops_core_build/reviews/<STAGE>_R<n>.md`), created within the first few calls and
appended after each check. It checks the code against the plan sections named, verifies claims
at file:line, tags findings blocker / major / minor, and ends with a verdict. At least 2 rounds
and at most 5 per stage; later rounds are delta reviews.

A reviewer's findings must be IN the file, in full, before it reports: the report is a
summary, and fixers work from the file alone. (An S1 reviewer wrote only a header.)

## Orchestrator decisions

- 2026-11-23: L1a and L1b are built here first, because core step 1 needs L1a's golden
  mechanism and neither was on main.
- 2026-11-23: model routing: build steps on Sonnet; reviews and design-judgement work on
  `fable52L` (the user's substitute for Opus); scripted playtests and live proofs on Haiku.
- 2026-11-23, L1a R1 rulings: m4, the `credentials` secret source reads the fields the real
  schema and `CredentialModel` hold, tested with a real key; m12, the stored-id length check
  is narrowed to the plan's list; NPC passwords are registered wherever the schema lets an
  NPC carry `creds` (top-level `npcs` and `phoneNPCs` included); scenario `flags` values are
  registered as a secret source too (beyond the plan, the safe side).
- 2026-11-23, L1b: `alreadyOpen: true` on every rfid request at an open target is the plan's
  (section 12, L1b item 2), accepted. For L2a: `showCardHolder` is per source but a stored row
  is shared, so the reader must hide the holder for a source without the flag.
- 2026-11-23, L1b R1 rulings: M1, the code stands (a right password at a locked session
  merges into the earlier `signin_ok` row, as the plan's call sites give); the test, the
  playtest script and the notes are corrected to expect it and the test asserts the count.
  m1, a guest session's rows are written with `as` nil, and a test pins that. m5, if a forged
  rfid post can reach the gated route-room branch, the granted row moves after that gate; if
  it cannot, a test shows the refusal and the finding is withdrawn. m6, `alreadyOpen` on a
  card-less rfid post stays (the plan's build item; the client only words a toast by it), with
  a controller test and a line in the A24 doc saying so.
- 2026-11-23, R2 rulings: N3, literal flag answers on a flag station's own `flags` list are
  registered as secrets too. N1 (a redundant branch) stays. The log plan's section 10 now
  names the `alreadyOpen` exception.
- 2026-11-23, S1 server R1 rulings: M1, the limit is on the built foothold id (`jack_<id>`,
  `wifi_<network>`, `implant_<pc>`): in a scenario with `logSources` the validator refuses one
  over 40 characters (core plan section 0 now says so), with a node test per prefix; the
  route must not 500 on it either way. m1, the foothold id goes in now as an optional
  argument of `network_rows` and `host_row` at every call site, unused until S3. m7, the
  client never offers Sweep on a block with `route: "down"`.
- 2026-11-23, S1 client R1 rulings: server strings through `escapeHtml` template strings
  stay (plan 5.5 allows it; the hostile-string test covers it). m5, device rows get their own
  group, "Devices", listed after the PCs and before shares and other kinds. m4, focus stays on
  the control's row (or the next control) after a sweep or scan, and scroll is kept. A stale
  refetch answer must never overwrite a newer one (M1): drop it by an epoch counter.
- 2026-11-23 (user: "parallelise further"): builders of one stage run side by side, split by
  file, each told which files are its own. A builder NEVER edits a file outside its list; if
  it needs a change there it reports it. Each commits only its own paths. Shared single-line
  files (`ops_log_events.rb`, `config/routes.rb`, the controller lists, `game_policy.rb`,
  the schema) are edited by exactly one builder per stage, named in the prompts. Rails tests
  queue on the shared lock, so run few files at a time and expect waits. A test that fails
  only because a neighbour's half is not in yet is reported, not "fixed".
- For S2: R3-1 (the leak scanner checks a service's `name` and `port` too, by a structural
  rule) goes into step 8's scanner work; R3-2 (`_refetchDropped` initialised in the view's
  constructor) into step 7.
- 2026-11-23, S2 client R1 rulings: m1, a decoy's reason is the key `falseBecause` and only
  that; the client's fallbacks go. m2, the per-class default summary is the server's table
  (`CLASS_SUMMARIES`); the client's `CLASS_DEFAULT_LINE` and the tests and doc lines that pin
  it are removed. m7, a `severity` or `class` value reaches a class attribute only through a
  fixed allow-list map. m8 is settled in the live proof, not in this fix pass.
- 2026-11-23, S2 server R1 rulings: m9, the graph's need edges (a credential or item node
  into its weakness, plan 9.3) are built now, not left to S3. m3, a `credential` need is met
  by the keyring's own rule (the entry is one the keyring would serve), as plan 4.2 says, not
  by a bare proof check. m11, a `technique_card` itemType need fails closed (never met).
  m2, a finding's `cli` values are copied by type: strings and arrays of strings only, no
  nested objects, so no `_` key can ride along. m12, the server resolves a weakness before a
  decoy of the same id deterministically and the validator refuses the clash. The validator
  minors (m14, m15, and m12's validator half) wait until builder 9a is out of
  `scripts/validate_network_ops.rb`. From step 8b: the loader gains a small public method to
  list entry ids (the scanner stops using a private one); the scanner also judges JSON KEYS
  for a global's name; `scenarios/test_ops_findings/PLAYTEST.md` uses the `opsFindings`
  verify-run line and the scanner's check-stage tags now that they exist; the N13 doc
  paragraph that says N14 is "not built" is corrected.
- 2026-11-23, step 10a: a sync body's `globalVariables.opsUsed` is stored as an ordinary
  saved global, in the globals namespace; the server state key `player_state['opsUsed']` is
  separate and untouched. Accepted: existing behaviour for any global name. A test should pin
  that the keyring proof and `use_technique!` read only the state key.
- 2026-11-23, S2 R2 rulings: M1 and M2 (leak scanner) are fixed by STRUCTURAL rules, not
  strings: before `confirm:<id>` a finding row may carry only the unconfirmed key set
  (`needs`, `fixed`, `falseBecause` or a settled status there is a leak); the key names
  `fixedIf`, `grants`, `realism` (and any other key section 7 lists as never sent) are a leak
  wherever they appear in an answer; a gating global's name inside a finding row is a leak
  whatever is public elsewhere. N6, the `globalVariables` exemption applies only to the
  bootstrap's top-level map. N4 stays (sound, loose). N5 and N1 are S3's: noted for the S3
  scanner and needs work (a credential need met by an expired token or ended invite; labels
  tagged confirm). N10, beat 1's count is whatever the server lists: the script states the
  real number and what it counts.
- 2026-11-23, step 10b rulings: `techniques` goes into `WITHHELD_SCENARIO_KEYS` in
  `network_access.rb` (step 9 missed it; 10b's `withhold_network_keys!` override in
  `network_ops.rb` is then removed); the `access: "admin"` line on a held session's host row
  is folded into `host_row` itself and 10b's `host_row` wrapper removed; the `network_view`
  wrapper for the `techniques` map may stay in `network_ops.rb`. All three by the step 11
  builder, who owns `network_access.rb`. The `session` need's label is the PC's host label.
- 2026-11-23, S3 validator: a `worksOn.versions` entry that equals no version of that
  product in the scenario stays an ERROR (plan 9.2; it catches a typo that would make a card
  silently useless). The plan's section 4.3 example now lists only the version its example
  service has.
- 2026-11-23, S3 step 11 security R1 rulings: verdict "safe to keep". F1 (major, fails
  closed): `record_borrow_done!` in `npc_frustration.rb` deletes the player's record at that
  PC only when it has neither `foothold` nor `from` (plan 5.4); assigned to a Ruby fixer with
  test T8, plus T1 to T7 and T9 to T12, F3 and F7. F4 is left as built (the plan says no
  refusal is added: during an outage a technique session's keyboard desktop is served while
  its no-route folders are refused) and goes to the user as a question. F5 is noted for S5a.
  F6 and F8 stay. From 12a: the view imports `utils/compromise-bolt.js` STATICALLY, as the
  plan describes, with the module added to every harness copy list that copies the view; the
  dynamic `import()` goes (in the S3 client fix pass).
- 2026-11-23, S3 server R1 rulings: M1, a `session` need is met only by a LIVE session:
  the predicate applies the same expiry and relay tests every other session reader applies.
  The same goes for a `credential` need (S2 R2's N1): an expired token or an ended invite
  does not meet it; if the keyring's own rule already says so, call that. m1, `worksOn` is
  sent by named keys only (`class`, `product`, `versions`). m2, the schema's proof pattern
  allows a host part as long as a sign-in PC id may be. m3, the keyring serves a
  `technique_card` proof only for a `saved_connection` entry at run time too. m10, a
  `needs.session` on a device host is a validator error (a device has no sessions), so the
  empty label cannot occur. m11 is noted for S5a. m12 is step 13a's (the N15 flip).
- 2026-11-23, S3 client R1 rulings: B1, the client keeps the top-level `techniques` map of
  the `GET /network` body on the stored view (the server and plan line 1294 stand); a test
  uses the server's real body shape. M3, the three existing assertions are updated EXACTLY as
  the review's M3 section gives them (`pc-sessions.test.mjs:543` and `:568`,
  `test-bridge-access.test.mjs:36`): the plan requires both behaviour changes (lines 889-895,
  978-982, 1003-1004, 1543-1550); this instruction replaces "no existing assertion edited"
  for those three assertions only, and the plan's section 10 part 3 gains the bridge test's
  name. m1, a grant's `tokenExpiredPcIds` is applied as for any sign-in answer. m2, a repeat
  grant (`already: true`) re-records nothing and fires no sign-in or sign-out event. m5, with
  no card held the finding rows carry no select control. m6 and m8 are judged in the live
  proof; fix m6 if the cause is plain (Sign out on a world-click remote view returns to the
  world, not to the network view). The static bolt import needs the helper on two copy lists
  only (`network-view.test.mjs`, `network-view-ops.test.mjs`).
- 2026-11-23, S3 server fix pass: a card item's own `technique_card` registry key riding in
  room data before pickup is the plan's design (section 4.3: the id reaches the browser on
  the card item and should say nothing the card's face does not; the validator warns on a
  telling id). It stays; the registry's content stays withheld. M1 residue from the client
  fix pass (a fingerprint-view red on an unhighlighted sprite still counts as an authored
  tint, so that sprite gets only the bolt) is accepted for now and goes on the screenshot
  review list.
- 2026-11-23, S3 R2 rulings: N-13-1 and N-13-2, the leak scanner earns steps PER THING
  (a grant by its finding id, a session by its PC and foothold, a card by its item id), never
  one whole-game step. N-13-3, no playtest script sends a hand-built or forged request from
  the browser: those beats and the "Hostile requests" paragraph leave
  `scenarios/test_ops_access/PLAYTEST.md`, replaced by one line naming the Rails tests that
  make the checks; the only by-hand request a script may keep is the plain "an unearned id
  answers the same 404 as an invented one" read. N-C1 is judged in the live proof. N-M1 (the
  log reader shows an ops row's detail as `service: service`) goes to the log stream.
- 2026-11-23, S3 R2 N-C1 ruling: Option B. For a remote view opened by a click on the PC in the
  world (`trip.toWorld`), closing a share opened from that desktop reopens that desktop (the share
  is a step inside it), and closing the sign-in screen with no session held leaves to the world; a
  remote view opened from the network view keeps its landings. A player who clicked a PC in the
  world never opened the network view, so nothing lands them in it.
