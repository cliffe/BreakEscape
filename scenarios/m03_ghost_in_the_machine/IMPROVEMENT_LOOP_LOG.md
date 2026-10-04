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

## Phase 1: mission alignment

### Round 1 review (fresh Opus, read-only)

Review copied to `m03-align-r1-review/REVIEW.md` in scratch. Counts: 1 blocker, 9 major, 11 minor.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P1-1 | major | "Ghost's logs named Zero Day" contradicts m02 (the invoice and analysts did) | to fixer |
| P1-2 | major | m02 Ghost claims they wrote their own exploit build; m03 never answers it | to fixer (Victoria says it at the confrontation) |
| P1-3 | major | Healthcare premium "on top" of $25,000 contradicts m02's invoice and m03's own catalogue | to fixer |
| P1-4 | minor | "Whether anyone died" contradicts m02 (every ending has a death); obituary line assumes several | to fixer |
| P1-5 | minor | Missed callbacks (214 hospitals survey, target selection, Ghost at large, supply chain) | to fixer |
| P1-6 | major | Four aims unlock at once mid-meeting | to fixer (act 2 unlocks at night) |
| P1-7 | major | Danny's choice reveals "Settle Accounts" early via reveal-on-progress; texts ignore Danny already settled | to fixer |
| P1-8 | minor | `find_operational_logs` is a duplicate tick | to fixer |
| P1-9 | minor | Perfect Stealth visible and open after being caught | to fixer (hidden until earned) |
| P1-10 | minor | Two lore titles name the find | to fixer |
| P1-11 | major | HaX hub not progress-gated; four guide choices at once | to fixer (m02 pattern) |
| P1-12 | major | Five stuck points with no hint | to fixer |
| P1-13 | minor | Debrief/credits gating checked: agree | no change needed |
| P1-14 | minor | No credit for the directive | to fixer |
| P1-15 | minor | Day KO of Victoria settles her fate only on re-entry, phone-only | to fixer |
| P1-16 | minor | No music cue for night or revelation; action track under the debrief | to fixer |
| P1-17 | minor | Exec wing has little line-of-sight cover | deferred to the playtest phase |
| P1-18 | major | Five beats land only as phone lines | to fixer |
| P1-19 | blocker | No SecGen m03 XML, so the flags can't be earned on a real VM | needs the user (D1 in `DECISIONS_PENDING.md`). Review's claim that a distcc module must be written is **withdrawn**: SecGen has `modules/vulnerabilities/unix/misc/distcc_exec` |
| P1-20 | minor | No top-level `flags` block with `vm_flags_json` | to fixer, if safe standalone |
| P1-21 | minor | Validator duplicate-mapping warnings, cutscene background, blank re-entry; lint items | to fixer; spoken lint items deferred to Phase 4 |

Decisions: night staging option (a); all canon fixes now, worded for every m02 ending; Perfect Stealth hidden until earned; Ghost's "own build" callback through Victoria. Reason: each is mission-local and reversible, and matches m02.

## SecGen

(see per-phase sections)

## Spoken lines changed (old → new)

(running list; filled per phase)

## Open items

(running list)
