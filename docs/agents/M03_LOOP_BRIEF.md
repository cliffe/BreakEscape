# m03 improvement loop: shared brief for subagents

Every subagent on the m03 "Ghost in the Machine" loop reads this first. The orchestrator owns it; don't edit it.

- Mission: `scenarios/m03_ghost_in_the_machine/` (`scenario.json.erb`, `ink/*.ink`, `mission.json`).
- Log: `scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md` (orchestrator writes it; agents report to the orchestrator).
- Binding rules: `AGENTS.md` (all of it), `README_scenario_design.md`, `README_ink_best_practices.md`.
- Gold standard: m02 `scenarios/m02_ransomed_trust/` in its current state (loop closed 2026-10-04, `PLAYTEST_LOOP_LOG.md`), then m01. Where a skill says "compare with m01/m02", weight m02 most.
- Older m03 docs (`ALIGNMENT_PLAN.md`, `PUZZLE_CHAINS_PLAN.md`, `DESIGN_REVIEW.md`, `DESIGN_REREVIEW_1.md`, `DIALOGUE_REVIEW.md`, `DIALOGUE_EDIT_NOTES.md`, `PASS2_IMPROVEMENTS.md`, `PASS4_PLAYTEST.md`, `TESTING_WALKTHROUGH.md`) describe earlier passes and may be stale. Verify every claim against `scenario.json.erb` and the ink.

## What m03 is for

A SAFETYNET campaign mission: a fun game with dialogue that plays like a well-written TV spy thriller. Its VM flags are part of the story and must be required to complete it (standing rule for m01–m08). It follows m02: the St. Catherine's ransomware, Ghost, and Zero Day Syndicate as the exploit seller.

## Standing rules (from AGENTS.md and the user)

- Kit is cumulative: lockpick from m01, the RFID cloner is introduced in m03, the PIN cracker is rationed.
- Spoken-line changes cost money (TTS cache keyed on text + voice). Every agent that changes a spoken line lists it, old → new, in its report. Narration and stage cues aren't spoken unless voiced; say which.
- UK English, plain writing, no AI filler, no em or en dashes in new text. "cyber security" is two words.
- Don't edit other missions, `.claude/skills/*`, engine code (`public/break_escape/js/**`, `app/**`, `lib/**`) or SecGen unless the orchestrator's prompt says so. Engine needs go back to the orchestrator as a separate item.
- Don't commit, stash, reset or `git checkout -- <file>`. Compare with `git show HEAD:<path>`.
- Write long documents section by section with Edit, not one big Write.
- Give file:line evidence for every finding and every claimed fix.

## SecGen

`scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml` does **not** exist on SecGen master (checked 2026-10-04; master has m01, m02, m05, m06, m08). A read-only checkout of SecGen is at `/home/user/SecGen` (branch master content; don't edit it). Any in-game reference to VM content is therefore unverified against a real VM: proposals for SecGen go into the report as text only, keeping flag numbering, and the orchestrator files them for the user.

## Environment (this cloud session)

Run commands from `/home/user/BreakEscape` with:

```bash
export BUNDLE_FORCE_RUBY_PLATFORM=true LANG=C.UTF-8
```

- Ink compile: `bin/inklecate -o <out.json> <file.ink>` (the validator also compiles).
- Validator: `bundle exec ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb` (add `--skip-ink --no-graph` for a read-only check that doesn't rewrite `dungeon_graph.*` or the ink JSON). Reviewers always use `--skip-ink --no-graph`.
- Static checks: `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m03_ghost_in_the_machine/`, `node scripts/ink_runtime_check/tagdiff.mjs`, `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`, `scripts/ink_runtime_check/inkcheck.js`, `loopcheck.js`, `python3 scripts/check_door_alignment.py`.
- Node tests: `node --test test/js/*.test.*`. Baseline here: 300 pass, 1 fail (`engine-fixes-pass4.test.mjs` cannot set `globalThis.navigator` under Node 22; pre-existing and environmental).
- Rails: `bin/rails test` (baseline 491 runs, 0 failures, 1 skip).

### Browser playtests (work here, headless)

- The keyless server is already running on **:3001**. Don't run `start-keyless-server.sh` (it misreads the port check in this container and truncates the server log) and never touch :3000.
- New game: `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3001 bin/rails runner tools/playtest/new-game.rb m03_ghost_in_the_machine` (prints GAME_ID, URL, FLAGS_XML). Game ids start at 5001 here.
- Session: `tools/playtest/session-start.sh --url <URL> --headless true --flags <FLAGS_XML> --log <your scratch dir>/session.jsonl`. **`--headless true` is required** (no X server). Then `tools/playtest/cmd.sh <id> '<json>'`, and finish with `tools/playtest/session-stop.sh <id>` (don't send `quit` yourself first).
- Verify: `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <id>` and paste the output into the report.
- Use only these checked-in scripts. No wrapper or helper scripts; the permission layer blocks them. Keep DOM reads and clicks few, and only on visible controls. If a tool call is refused, stop and report rather than retrying in another form. If your Write is refused, put the full report in your final message.
