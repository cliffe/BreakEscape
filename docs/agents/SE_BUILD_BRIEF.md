# Build brief: social-engineering systems

Every agent on this build reads this file first. Started 2026-10-21.

## What is being built

The phishing and social-engineering systems planned in `planning_notes/phishing_and_social_engineering/`:
a mail client, a rules engine that judges phishing emails, an intel board, an OSINT browser, inbox
triage, pretext calls with an influence meter, a landing-page builder, then a student lab
(`lab_social_engineering`) and later an awareness product.

**Kind of game:** a lab game. Education first, browser-only, no VMs, no combat
(`"disableAttacks": true`), fictional companies only. Licence to Hack (m01 to m10) gets none of these
systems. Its only contact with this build is that Phase 0's engine changes must leave m01 to m08
playing exactly as before.

## Where things are

- The plan you are executing: `planning_notes/phishing_and_social_engineering/IMPLEMENTATION_PLAN.md`.
  Your packet id (for example P0-D) is in its §4 table. Read your packet's row, the phase section
  it belongs to, and the item rows it cites.
- The contract: `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md`. Where
  anything else disagrees with `00`, `00` wins.
- Decisions: `planning_notes/phishing_and_social_engineering/README.md` "## Key decisions".
- Engine experiments already done: `planning_notes/phishing_and_social_engineering/SPIKES.md`.
- Assets: `planning_notes/phishing_and_social_engineering/ASSETS.md`.
- The build log: `planning_notes/phishing_and_social_engineering/SE_BUILD_LOG.md`. Baselines and
  run reports go under `planning_notes/phishing_and_social_engineering/build_log/`.
- Repo-wide rules: `AGENTS.md`, `README_scenario_design.md`, `README_ink_best_practices.md`.

Paths in the plan are under `public/break_escape/js/` unless they start with `app/`, `scripts/`,
`test/`, `tools/`, `scenarios/` or a dot. Line numbers in the plan are pointers from 2026-10-21:
re-read the code before editing.

## Rules for every agent

- **Shared working tree.** Other agents (including a separate session working on m09 and m10) edit
  the same tree. Never `git stash`, `git checkout -- <file>`, `git reset` or `git clean`. Compare
  with `git show HEAD:<path>` or a throwaway `git worktree` under your scratch folder. Re-read a
  shared file just before editing it, and add only your own block.
- **Scope.** Edit only the files your packet names. Do not touch `docs/agents/FINALE_BRIEF.md`,
  anything under `planning_notes/overall_story_plan/`, m09 or m10 files, or any shipped mission's
  scenario, ink or audio (a regression is fixed in the engine, never in the mission). Do not edit
  `.claude/skills/*`.
- **Never open** SecGen XML, the SecGen repo, or the VM exploit field guides. This build needs none
  of them.
- **The landing-page builder** (`designs/07_landing_page_builder.md` and Phase 5) is handled by
  Haiku agents only. Any other agent does not open `07`.
- **Do not commit.** The orchestrator commits at the end of each design-implement-review iteration.
- **Scratch files** go in the scratch folder your prompt names, under
  `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-<packet>/`.
  Never create a `scratchpad/` folder inside the repo.
- **Checks without side effects.** The validator rewrites `dungeon_graph.*` and compiled ink unless
  given `--no-graph --skip-ink`; always pass both. Compile ink into your scratch folder.
- **Playtests** use only the keyless server on :3001 (`tools/playtest/start-keyless-server.sh`;
  `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <mission>`).
  Never stop or use the user's server on :3000. A run counts only once `verify-run.rb` shows
  progress. Keep an earned-secrets table: anything typed from a solution guide or set by console is
  "exercised, not earned". Kill any headless browser you started, by PID, before you finish.
- **Node tests:** `bundle exec node --test test/js/<file>.test.mjs`. New tests for this build are
  named `test/js/social-<module>.test.mjs` or `test/js/validator-<area>.test.mjs`. Tests use fixtures,
  never live mission content compared with HEAD.
- **Writing:** UK English, plain words, no filler. Write long documents section by section with Edit.
- **Report back** with: the files changed (`git diff --stat` limited to your scope), the tests run
  and their output summary, evidence for every claim that matters (file:line, game id, screenshot
  path), anything you found but did not fix, and any question for the orchestrator. Do not claim a
  fix you have not made; the orchestrator greps for each one.

## Models

Opus for engine work, judgement and reviews; Sonnet for packets with written-down scope and tests,
and for every browser playtest; Haiku for searches, mechanical edits and everything in the builder
(Phase 5). If a content safeguard stops you, stop and report exactly where.
