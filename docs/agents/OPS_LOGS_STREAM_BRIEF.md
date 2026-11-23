# Ops log reader stream: brief

A second build stream, run beside the ops core build (user, 2026-11-23: "parallelise
further"). It builds stages L2a, L2b and L3 of `docs/achitechture/OPS_LOG_ROWS_PLAN.md`: the
log reader, seed rows and anomalies, then network and share rows. Their code prerequisites
(L1a, L1b) are on main; the plan's "after S5c" is an ordering wish, not a code dependency.

**Rules: read `docs/agents/OPS_CORE_BUILD_BRIEF.md` in this worktree and follow all of it,
with these differences, which win:**

- **This stream's worktree is `/data/be-ops-logs`, branch `ops-logs`.** Work only here, with
  absolute paths. Wherever that brief says `/data/be-ops-core`, read `/data/be-ops-logs`.
  Never edit, commit or run anything in `/data/be-ops-core` (the train tree),
  `/data/be-ops-build` (the core stream's build tree) or `/home/deploy/BreakEscape` (main).
- Handover notes and reviews for this stream go in `docs/agents/ops_logs_stream/`.
- Builders of one stage run side by side, split by file. A builder never edits a file outside
  the list in its prompt; if it needs a change there it reports it. Each commits only its
  own paths: `git commit -m "..." -- <path> <path>`.
- The core stream is editing the same repo on another branch (stages S2 and S3 of
  `OPS_CORE_PLAN.md`). Files both streams touch (the log plan's section 12 table, lines
  757-767): `app/controllers/break_escape/games_controller.rb` (the `set_game` and
  `with_game_lock` lists, `#container`), `config/routes.rb`, `lib/break_escape/ops_log_events.rb`,
  `public/break_escape/js/systems/interactions.js`,
  `public/break_escape/js/minigames/container/container-minigame.js`,
  `public/break_escape/js/core/game.js`, `scripts/scenario-schema.json`, the two docs. In
  those, make the smallest edit, add lines rather than rewrap or reorder existing ones, and
  never reformat, so the later merge is a keep-both.
- Tests: Rails tests under the shared lock, `flock /home/deploy/BreakEscape/tmp/tests.lock
  bin/rails test <files>`, from this worktree's root, no `BUNDLE_PATH`; the lock is shared
  with two other streams, so run few files at a time and expect to queue.
  `bin/ops-golden-compare` with NO outer `flock` after any engine edit; never re-record.
  Node tests: `PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH bin/test-js
  test/js/<name>.test.mjs`. Three JS files fail or flake on this machine without any change
  and are nobody's to fix: `capture-log`, `lockpick-mode-switch-roundtrip`, `lab-ux-ui`.
- Browser: `$HOME/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell`.
  Live checks use ports 3014 to 3016 only (the core stream uses 3011 to 3013; trains 3021).
  A game of `test_ops_logs` is made with
  `env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_logs`
  (it has no Mission row).
- A reviewer's findings must be in its findings file, in full, before it reports.

## Decisions

- 2026-11-23: the plan's section 15 questions are built as the plan is written (its
  recommended options); they stay open for the user to overrule.
- 2026-11-23, carried from the L1b review: `showCardHolder` is set per log source but a
  stored row is shared between sources, so the reader must hide the card holder's name for a
  source without the flag.
