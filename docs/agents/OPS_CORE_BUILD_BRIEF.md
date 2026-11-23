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

- Worktree `/data/be-ops-core` (also `/home/deploy/be-ops-core`), branch `ops-core`. Use
  absolute paths under it. Never edit or commit in `/home/deploy/BreakEscape` (main) or any
  other repo. Never edit `.claude/skills/*` or campaign missions (m01 to m10, sis*).
- Scratch files: the scratch folder your prompt names, never the repo.
- Read narrowly: the plan sections and line ranges your prompt names, and the code you edit.
  The plans are long (core 2120 lines, log rows 1296); do not read them whole. Digests of the
  existing code are in `docs/agents/ops_layer/digests/` (D1 to D6) if you need orientation.

## Rules

- **Database.** Every tree shares the development database and it has no backup. Never run
  `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop`, `db:setup` or `db:seed`.
  If a step seems to need a migration, stop and report.
- **Tests.** Rails tests share one test database: run them under the shared lock,
  `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>`, from the worktree root. Do not set
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
