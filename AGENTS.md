# How agents work on Break Escape

This file describes how an AI orchestrator (and the subagents it tasks) works on this repo: how work is split, which model does what, what gets decided without asking, what goes to the user, and how changes are checked and committed. It was written from the pass-3 mission work (m03–m08, October 2026) and the engine fixes that came out of it.

Read it alongside `README_scenario_design.md` (authoring rules), `README_ink_best_practices.md`, `tools/pass2/PASS2_LESSONS.md` and the current pass's brief and log (`docs/agents/PASS4_BRIEF.md`, `scenarios/PASS4_EDITORIAL_LOG.md`). Briefs from earlier passes are kept in `docs/agents/` because their engine rules still apply.

## The orchestrator's job

The orchestrator plans, tasks, reviews and decides. It does small, mechanical edits itself (a one-line fix, a log entry, a commit) and hands anything larger to a subagent. It owns:

- the shared brief every subagent reads (`docs/agents/PASSn_BRIEF.md`, holding the rules, recent engine behaviour and user decisions);
- a resume note (`docs/agents/RESUME.md`) updated after every significant step, so work can be picked up after a context reset or a usage limit;
- the pass's log, where every decision and every item needing the user is recorded with file:line evidence;
- `docs/IDEAS_BACKLOG.md`, where ideas beyond the task in hand are filed for the user;
- commits, made only when the user asks.

Keep these in the repo, not the session scratchpad: scratchpad files are lost when the session ends.

Subagent reports are not shown to the user. The orchestrator reads each one, checks the claims that matter (often by reading the code or a screenshot itself), and tells the user what happened in plain terms.

## The mission loop

Each mission goes through the same loop. Missions run in sequence, pipelined: one mission's playtests can run while the next mission is in planning.

1. **Plan** (Opus). A planner runs the relevant skill (e.g. `.claude/skills/mission-puzzle-chains/`) in full and writes the plan into the mission folder.
2. **Adversarial review, three rounds** (Opus, read-only). Each round is a fresh reviewer that verifies every claim against the code, citing file:line, tags findings blocker / major / minor, and ends with a verdict. The planner (resumed, so it keeps its context) folds the findings in. Wrong findings are recorded as "withdrawn" with the reason, not silently dropped. The third round is a confirmation that the earlier findings are closed.
3. **Implement** (Opus; often the planner itself, since it holds the context). Order matters: renames first, then a probe of any unproven engine path before building on it, then the rest. Static checks before handing back: ink compile, `ruby scripts/validate_scenario.rb`, `python3 scripts/check_door_alignment.py`, room depth, inkcheck/loopcheck over a state matrix, and assertions against the rendered JSON.
4. **Implementation review** (a fresh Opus agent, read-only), so the work gets independent eyes.
5. **Browser playtests** (Sonnet, split into short focused runs of 10–15 minutes, at least one with a mid-mission reload). Long single runs were cut off by safety checks and usage limits, so the scripts are split, and testers write findings into their report as they go.
6. **Fix, then a short confirmation run**, then mark the mission done in the log and commit it.

## Choosing a model

- **Opus** for open-ended work: planning, design, adversarial review, implementation of anything that needs judgement, engine work.
- **Sonnet** for every well-defined task: playtests from a script, mechanical edits with clear rules, audits with a checklist, re-tests, small polish items.
- Don't throttle concurrency to save usage. Run independent agents together. The economy that matters is model choice, not agent count.

## Writing a subagent prompt

- Point at files rather than restating them: the shared brief, the plan, the previous round's findings, the approval log. A subagent starts cold, so give it the exact paths it needs.
- State scope and limits explicitly: which files it may edit, which it must not (other missions, finished missions, `.claude/skills/*`, other repos), and "don't commit".
- Say what to return: a change list, test results, evidence (file:line, game ids, screenshots), and the questions for the next step.
- Ask for plans and long documents to be written **section by section with Edit**. A whole-file rewrite once got truncated and a plan was lost.
- Keep prose at game-design level. Refer to casualty figures, attack steps and similar security detail by citation rather than restating them, and keep briefs about lab-sheet or exploit content short ("carry out approved item L1 in the log"). Long, detailed briefs on those topics were stopped by a safety classifier.
- When parallel agents touch the same area, split them by file and tell each one to re-read any shared file just before editing it.

## Making judgements without asking

The orchestrator decides these itself and records them in the log:

- **Mission-local changes** (a mission's own scenario file, ink and docs) that make it better to play and keep it solvable and validator-clean.
- **Open design questions** left in a plan, where a sensible default exists. Pick one, say why in one line, and let the user overrule.
- **Small tidy-ups** found along the way: a stale line, a misplaced object, a credit that over-claims.
- **Withdrawing a reviewer's finding** after checking the code shows it's wrong.

Everything else goes into the approval log for the user: engine or server changes, shared minigames, other missions (especially finished ones with cached audio), SecGen, the lab sheets, image generation and anything that costs money.

## Asking the user for input

- Batch decisions and ask through the question tool with **checkbox options**: a short label, a one-line description of the trade-off, and the recommended option first. The user often answers in the free-text field, so read the answer carefully rather than assuming one of the boxes.
- Ask only when the answer changes what happens next. Otherwise pick the conventional default and mention it.
- When the user says "use your best judgement", decide, act, and say what you chose.
- Report outcomes plainly: what passed, what failed with evidence, what was skipped. A static check isn't a browser test, so say which one you ran.
- End each update with one-line assumptions the user might want to challenge.

## Standing user rules

- **Kit is cumulative** across missions (lockpick from m01, RFID cloner from m03, fingerprint kit from m04). The PIN cracker is rationed.
- **Renamed NPCs get renamed ids** (globals, ink files, knots, tasks, rooms), with a dated note on stale planning docs. The handler's id stays `agent_0x99`. m01 is left alone because its audio is cached.
- **Draft playtests run on the keyless server on :3001** (no Gemini key, so no TTS is generated). Use `PLAYTEST_PORT=3001` with `tools/playtest/new-game.rb`, and `tools/playtest/start-keyless-server.sh`. Never stop the user's server on :3000.
- **Spoken-line changes cost money.** The TTS cache is keyed on text plus voice, so list every spoken line a change touches.
- **Images are generated one at a time** (or in small batches once a style is approved), with feedback between. PixelLab is preferred (flat subscription), at the target size, never downscaled.
- **Minigames should be fun and educational, not hard.**
- UK English, plain writing, no AI-sounding filler. No attribution lines in commits.

## Verifying work

- A playtest isn't a pass until `tools/playtest/verify-run.rb` shows progress on the server. Testers keep an earned-secrets table: anything typed from the solution guide or set by console is "exercised, not earned".
- Engine changes get node tests (`test/js/`), the Rails suite (`bin/rails test`), the phone reopen check (`node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`) and a browser regression across the affected missions before they're committed.
- Ink rewrites get `scripts/ink_runtime_check/tagdiff.mjs` against the last commit: every changed tag, knot, variable, divert or choice condition must be explained.
- The bug classes that recurred across pass 4 are checked automatically: the validator's recurring-bug checks (lockpick catches that can't fire, opening cutscene without `waitForEvent`, sprite art, look-alikes, dead `VAR`s, undeclared `#set_global`, repeated bark lines) and `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<m>/` (fall-through choices, blank re-entry, popup on narration, phone prefixes, exits with no reply, stage cues). Clear or justify each finding before a mission goes to playtest; the rest of the list is in `README_scenario_design.md` ("Common bugs and how to avoid them") and the review skills. Use `--skip-ink --no-graph` to validate a mission someone else is editing without rewriting its files.
- Look at the screenshots yourself before calling UI work done.

## Housekeeping

- Agents that stop mid-run leave headless browsers and stuck harness commands behind. List them with `ps`, check what they are, and kill them **by PID**. Never use `pkill -f` with a pattern that also appears in your own command line, because it kills your own shell.
- When taking over from an agent that spawned children, list the live agents first and stop its children, or you get duplicate builders overwriting each other.
- Agents share one working tree. Never `git stash`, `git checkout -- <file>` or `git reset` to get a clean baseline, because that pulls other agents' unsaved work out from under them. Compare against `git show HEAD:<path>` or use a worktree instead.
- Give each parallel agent its own scratch subfolder (`<mission>-<role>/`). Agents that share the scratchpad root overwrite each other's helper scripts and check outputs.
- Delete stray files a harness writes into the repo root, after looking at them.
- Commit in logical groups (engine, tooling, docs, one commit per mission). Where a shared file mixes several fixes, commit them together rather than leaving an intermediate commit that doesn't run.
- If a usage limit is near, stop launching agents, write the resume note, and say that nothing restarts on its own.
