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
- 2026-11-23, L2a server R1 rulings: M1, the holder rule becomes a stored marker, as the
  reviewer proposes: `badge_swipe` gains the detail `'flagged' => { count: 1, show: false }`
  written only when the identity is kept by the flag alone (`ops_badge_as` /
  `write_badge_swipe_ok!` in `game.rb`; the event line in `ops_log_events.rb`), and the
  reader shows `-` for a flagged row in a source without `showCardHolder`; the heuristic and
  its tests go, the new tests drive `/unlock`. m3, a no-route read under a foothold session
  answers as `/container` does (accepted; plan section 11 reworded). m5, a thing with no
  authored name is shown by its kind word, never by its raw id (plan lines 352 and 382).
- 2026-11-23, L2a client R1 rulings: F2, the client sends `relay` for a reader on a relay
  desktop (the server already reads it; the plan's route line gains the param). F4 and m9,
  the RESULT filter works on the result's base word, so `FAIL` matches `FAIL x3` and a filter
  never goes stale when a count grows; a filter whose value is gone is cleared and shown as
  cleared. m1, the stylesheet is linked from the page (`show.html.erb`) with the `?v=` stamp
  like its neighbours, not injected by the module. m11, `ops_log_terminal` joins
  `DESK_COMPUTER_TYPES` in `interaction-reach.js`. m12, `minigameData.title` leaves the
  schema entry: the title is the source's, from the server. The validator's sprite check
  exempts `ops_log_terminal` the way it exempts `capture_log` (the type reuses the log
  terminal's sprite), with a test.
- 2026-11-23, L2a R2 rulings: S1, a door's shown name is the room's `name`, then its
  `door_sign` (what the player reads on the door; campaign missions author that), then the
  kind word; never the raw id. S2 and N5, the plan's section 9 validator errors for a reader
  are built now in `scripts/validate_log_rows.rb` (no `id`; an undeclared `logSource`; a
  reader authored with `lockType: login`, which can never be read), each with a node test.
  S6, the leak check's `/log_rows` extension is built now with the rest of the scenario
  tooling. N4, no action.
- 2026-11-23, L2a R3 rulings: R3-5, the order for a door's shown name changes: the room's
  `door_sign` FIRST (it is what the game shows on an unopened door, so a denied swipe never
  shows a name the door does not), then the room's `name`, then the kind word. This replaces
  the order in the R2 ruling above. m10 is left (the reviewer's advice). R3-1 and R3-2 (the
  leak check judges IDENTITY on a successful or known-account sign-in row, and sees a
  stored-only key inside a detail string) are done now, with the other R3 minors, in one
  tidy pass after the playtest.
- 2026-11-23, L2b: THE FLAG GOES BACK TO THE PLAN. The orchestrator's L2b prompt said the
  flag must be judged on the server; that went beyond the plan and was a mistake. The plan as
  landed with L2a (section 7 and 5.2) says `anomaly.rowId`, `flagActions` and
  `completionActions` reach the browser and "the flag is checked on the client, best effort,
  the same standing as log-filter's anomaly today; a server check belongs to the investigator
  work". The review (`reviews/L2b_R1.md`) found the server-judged build enforced nothing (the
  browser still ran the actions) and could lose a right flag's actions for good. So: the
  route `POST /log_rows/flag`, its policy and role-test entries, the `opsLogFlagged` state key
  and the three strip calls are removed; the viewer compares the selected row's id with
  `anomaly.rowId` locally and reads "done" from the action's global, as log-filter does; the
  plan file is restored to its text on main; the leak check's rule goes back to what the
  plan's section 7 gives. The user was told and may still choose a server-judged flag, which
  would be planned as its own piece (the server applying the actions and owning the globals
  and tasks).
- 2026-11-23, L2b R2 rulings: all five minors are done in one tidy pass. N-2, when a
  reader opens with its done global true, the viewer re-runs the `complete_task` entries (a
  no-op when already done), so a task whose request once failed still completes. N-1, the
  validator WARNS (not an error) for an anomaly whose actions set no global to true, and for
  an anomaly with no actions at all. N-3, one docs sentence (a done global set by anything
  else marks the row). N-4, the playtest beat is reworded to what is asserted. N-5, the
  flagged row's look stays: the plan's "no row is ever tinted" is about telling rows apart
  BEFORE the player acts; a row the player has rightly flagged may be marked. The A24 text
  says so.
