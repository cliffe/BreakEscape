# m03 Ghost in the Machine: improvement loop

Started 2026-10-04. Method: the m02 playtest loop (`scenarios/m02_ransomed_trust/PLAYTEST_LOOP_LOG.md`) and the sis01 playbook (`docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md`), under `AGENTS.md`. Shared agent brief: `docs/agents/M03_LOOP_BRIEF.md`. Branch: `claude/m03-improvement-loop`.

Phases, each at least three rounds (review → fix → fresh re-review), at most five: (1) mission alignment, (2) puzzle chains, (3) scenario design, (4) dialogue, (5) playtest loop ending in a blind playtest.

Scratch: `/tmp/claude-0/-home-user/2edb2328-aac7-5a76-b90c-d4a259c5be46/scratchpad/m03-<phase>-<role>/` (lost when the session ends; anything that matters is copied here).

## Environment (cloud session, 2026-10-04)

| Check | Status | Notes |
|---|---|---|
| Ink compile (`bin/inklecate`) | works | |
| Validator | works | needs `BUNDLE_FORCE_RUBY_PLATFORM=true LANG=C.UTF-8` and `bundle exec` (gem setup: libpq-dev installed, gems built for the ruby platform because the locked x86_64 sqlite3/nokogiri builds don't support Ruby 3.3) |
| dialoguelint, tagdiff, reopencheck, inkcheck, loopcheck | work | |
| Node tests | 300 pass, 1 fail | `engine-fixes-pass4.test.mjs` fails before any test runs: Node 22 makes `globalThis.navigator` a getter. Pre-existing, environmental |
| Rails suite | 491 runs, 0 failures, 1 skip | local Postgres 16 started, `deploy` role, peer auth relaxed to trust for local sockets |
| Keyless server :3001 | works | started with `bin/rails server` directly; `start-keyless-server.sh` misfires here because `ss` is missing (it then truncates its own log). Dev DB seeded; a `DemoUser` and a player preference created by hand (`new-game.rb` creates users with a `username` column that no longer exists, which only bites on an empty DB) |
| Browser harness | works headless | needs `--headless true` (no X server); Playwright pinned to 1.56.1 (`npm i --no-save`) to match the pre-installed Chromium 1194; the session proxy's CA added to Chromium's NSS store so Phaser loads from jsDelivr. Smoke test: game 1 reached the title screen with 4 flags configured |
| SecGen m03 XML | **missing** | `scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml` is not on SecGen master (master has m01, m02, m05, m06, m08). Game-side VM references can't be checked against a VM definition; proposals are written as text in "SecGen" below |

So browser playtests run in this session; every report says which checks were static and which were in a browser.

## Decisions (orchestrator, with reasons)

- Branch `claude/m03-improvement-loop`, as the task asks (the session default was `claude/practical-planck-fvt3ha`).
- Game ids in this session's database start at 5001, so flag XMLs written here can't collide with the user's committed game ids.

## SecGen

(see per-phase sections)

## Spoken lines changed (old → new)

(running list; filled per phase)

## Open items

(running list)
