# sis02 improvement loop: shared brief for subagents

Every subagent on the sis02 "Albion Energy Storage" loop reads this first. The orchestrator owns it; don't edit it.

- Scenario: `scenarios/sis02_energy/` (`scenario.json.erb`, `ink/*.ink`, `mission.json`, `information_pack.md`, `labsheet.md`, `TODO.md`).
- Method: `docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md` (how sis01 was improved). Gold standard: `scenarios/sis01_healthcare/` in its current state (its `DIALOGUE_REVIEW.md` decisions, `SCRIPT_EDITOR_REVIEW.md`, `CAST_DESIGN.md`, `labsheet.md`).
- Log: `scenarios/sis02_energy/IMPROVEMENT_LOG.md` (orchestrator writes it; agents report to the orchestrator).
- Binding rules: `AGENTS.md` (all of it), `README_scenario_design.md`, `README_ink_best_practices.md`.
- Design sources: `planning_notes/sis_scenarios/case_2_energy_*`. Older docs in the scenario folder (`TESTING_WALKTHROUGH.md`, `VALIDATION_SUMMARY.md`, `TODO.md`, `ink/INK_DEVELOPMENT_SUMMARY.md`) may be stale: verify every claim against `scenario.json.erb` and the ink.

## What sis02 is for

A standalone CyBOK Security-Informed Safety serious game for university students, **not** part of the m01–m08 spy campaign: no SAFETYNET, no handler banter, no combat (`"disableAttacks": true`). Students play it, sometimes as 4–6 players split into IT and operational roles, to practise and then reflect on risk management, safety cases (claim, argument, evidence), incident response and the sector's regulation (NIS for operators of essential services, IEC 62443, SCADA/OT, thermal runaway in a 200 MWh lithium-ion battery site in the East Midlands). Judge everything by whether it teaches well and whether the people sound like real control-room engineers, OT vendors, site managers and NCSC officers.

The source of truth for facts is `information_pack.md`; `labsheet.md` sets what students must be able to reflect on. sis03 (`scenarios/sis03_cyber_insurance/`, Meridian Cyber Insurance, T+48 hours) follows on from this incident: keep facts consistent with it, and report any sis03 conflict rather than editing sis03.

## Standing rules

- Spoken-line changes cost money (TTS cache keyed on text + voice). Every agent that changes a spoken line lists it, old → new, in its report. Player choice text isn't voiced; `Narrator:` lines are.
- No printed variables in voiced lines (`{...}` that prints a value). Inline alternatives choosing between fixed strings are fine.
- UK English, plain writing, no AI filler, no em or en dashes in new text. "cyber security" is two words.
- Don't edit other scenarios, `.claude/skills/*`, engine code (`public/break_escape/js/**`, `app/**`, `lib/**`) or SecGen unless the orchestrator's prompt says so. Engine needs go back to the orchestrator as a separate item.
- Don't commit, stash, reset or `git checkout -- <file>`. Compare with `git show HEAD:<path>`.
- Write long documents section by section with Edit, not one big Write.
- Give file:line evidence for every finding and every claimed fix.
- `ink/npc_priya_sharma.ink.json` looks like a stale duplicate of `npc_priya_sharma.json`: check which one the scenario loads before touching either.

## Environment (this cloud session)

Run commands from `/home/user/BreakEscape` with `export BUNDLE_FORCE_RUBY_PLATFORM=true LANG=C.UTF-8`.

- Ink compile: `bin/inklecate -o <out.json> <file.ink>`.
- Validator: `bundle exec ruby scripts/validate_scenario.rb scenarios/sis02_energy/scenario.json.erb` (reviewers and anyone checking while another agent edits add `--skip-ink --no-graph`).
- Static checks: `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis02_energy/`, `node scripts/ink_runtime_check/tagdiff.mjs`, `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`, `python3 scripts/check_door_alignment.py`.
- Node tests `node --test test/js/*.test.*` (baseline 361 pass, 1 environmental fail in `engine-fixes-pass4.test.mjs`); Rails `bin/rails test` (baseline 502 runs, 0 failures).

### Browser playtests (headless)

- The keyless server runs on **:3001**. Don't run `start-keyless-server.sh`, never touch :3000.
- New game: `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3001 bin/rails runner tools/playtest/new-game.rb sis02_energy` (prints GAME_ID, URL, FLAGS_XML).
- Session: `tools/playtest/session-start.sh --url <URL> --headless true --flags <FLAGS_XML> --log <your scratch dir>/session.jsonl`; then `tools/playtest/cmd.sh <id> '<json>'`; finish with `tools/playtest/session-stop.sh <id>`.
- Verify: `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <id>`; paste the output into the report.
- Only these checked-in scripts; no wrapper or helper scripts. Few DOM reads, only on visible controls. If a tool call is refused, stop and report. If your Write is refused, put the full report in your final message.
- Scratch: `/tmp/claude-0/-home-user/2edb2328-aac7-5a76-b90c-d4a259c5be46/scratchpad/sis02-<role>/` (your own subfolder).
