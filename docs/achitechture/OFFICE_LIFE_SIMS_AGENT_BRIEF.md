# Office life sims showcase: brief for builder and reviewer agents

Read this first, then the plan `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` (your slice's
section, plus sections 3.3 to 3.5 and 6 where your slice needs them), the handover
`docs/achitechture/OFFICE_LIFE_SIMS_HANDOVER.md` and the build log
`docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md`.

## What this is

`scenarios/test_needs_sims` is the neutral office-life showcase (no security narrative): ordinary
people having an ordinary day, used to prove engine patterns the campaign missions (first m02)
then copy. `scenarios/test_needs_attack` is a probe scenario for SIMS-1. The aim is that every
behaviour the plan names is visibly, reliably shown and proved live.

## Where to work

- Worktree `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-sims`,
  branch `build/ol-sims`. Use absolute paths. Other worktrees belong to other sessions.
- Session scratchpad: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/officelife-sims/`.
  Use your own subfolder (`s1/`, `s2/`, `s2-review-design/` and so on) for scripts, reports and
  screenshots.

## Servers, games, browser

- Ports **3093, 3094, 3095 only**. Never touch :3000, :3001 or any other server. Your brief names
  your port. `tools/playtest/start-keyless-server.sh` is fixed to :3001, so do not use it; from the
  worktree root run its command with your port:
  `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true nohup bundle exec rails server -b 127.0.0.1 -p <port> -P tmp/pids/server-<port>.pid > tmp/keyless-<port>.log 2>&1 &`
  and wait for `curl http://127.0.0.1:<port>/` to answer. Stop it by its PID file when you finish.
  Restart it after any server-side (Ruby) change; engine JS is served fresh on reload.
- test_needs_sims games: `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=<port> bundle exec rails runner tools/playtest/new-game.rb test_needs_sims`.
- Scenarios without a Mission row (test_needs_attack, scratch V10 folders):
  `tools/playtest/swap-scenario-game.rb test_needs_sims <folder> [--unlock-all]` (read its header).
- **Never** run `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop`, `db:setup` or
  `db:seed`. The dev database is shared and has no backup.
- Headless chromium only: playwright-core from
  `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-9-2-h/node_modules`,
  executable `/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`.
  After popups: if `loop.actualFps` < 10 switch Phaser's rAF to setTimeout mode; then
  `g.loop.smoothStep=false; g.loop.minFps=1; world.setFPS(20)` with fixed steps ON (never
  `fixedStep=false`). `tools/playtest/needs-attack-probe.mjs` shows the pattern.
- Kill only your own browsers and servers, by PID. Never `pkill -f`.
- Full Rails suite, if you run it: `flock /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/tests.lock bin/rails test`.

## Proof rules

- Objectives are ticked by real interactions (the note read through the interaction path, the
  conversation opened and closed in its UI, the NPC really using the object). Never emit a trigger
  event through `window.eventDispatcher` to tick a task. Setting a need level through
  `window.__test.needs` to start a beat is fine and must be said.
- A proof that fixes a fault first reproduces it on the build as it stands.
- Look at your screenshots before calling a beat a pass. Record game ids and screenshot paths.
- A probe failure is not an engine failure: if a beat fails because the script did not set up the
  situation (the NPC was not where the beat needs it), fix the script and rerun.

## Repo rules

- Commit your own files before running live tests, fixes as follow-up commits:
  `git add <explicit paths>`, check `git diff --cached --stat`, then
  `git commit -m "..." -- <explicit paths>`. No globs, no `git add -A`. No attribution lines.
- Never bare `git stash`, never `git checkout -- <file>`, never `git reset`.
- Delete by moving into `tmp/delete/` (gitignored) and staging the removal; never `rm` or `git rm`.
- New static import in an engine JS module: add the file to each JS test harness copy list
  (grep `test/js` and `bin/test-js` for the copy lists), or node tests fail with
  ERR_MODULE_NOT_FOUND.
- Node tests: `bin/test-js <files>`. Validator: `ruby scripts/validate_scenario.rb <scenario.json.erb>`
  (use `--skip-ink --no-graph` on scenarios you do not own).
- No new gems. No image or sound generation: use stand-ins and list art requests in your report.
- Barks, chatter and exchanges are TTS-voiceable scenario JSON or ink text, never engine strings:
  one line each, 40 characters at most, no `{ }` variables, no speaker prefix. List every new
  spoken line count in your report.
- UK English, plain writing, no em or en dashes, no model names in repo files.
- Never open SecGen XML or the exploit field guides (not needed for this work).
- Do not edit other missions, `.claude/skills/*`, or other repos.
- Engine and server changes are allowed where the plan names them; list every one (file, function,
  what changed, why) in the build log's engine/server section.

## Context limit

When your context passes about 150k tokens (roughly 80 tool calls, fewer if you read many
screenshots), finish the step you are on, commit, write a handover note at
`docs/achitechture/OFFICE_LIFE_SIMS_HANDOVER_<slice>.md` (done, open, in progress, files, commits,
gotchas), stop your servers and browsers, report back and stop.

## Report back

At most 15 lines: status, commits, test and validator counts, game ids, screenshot paths, findings
counts (reviewers: B/M/m), engine/server changes, art requests, open questions. No long quotes.
