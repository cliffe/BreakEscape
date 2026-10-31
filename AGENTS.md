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

## Kinds of game and what each aims for

Break Escape hosts more than one kind of game. Settle which kind you're working on first, because it sets the standard that reviews, fixes and judgements aim at. Put the kind and its aim in every reviewer's and writer's prompt. Without it, agents drift into the wrong voice: sis01's first reviewers fell back on the spy campaign.

- **SAFETYNET campaign missions (m01–m08):** a spy thriller.
  - The aim is a fun game with well-written dialogue in the style of a TV spy thriller: tension, secrets, characters with their own agendas, sharp exchanges and reveals that land. Agent HaX is the handler, ENTROPY the enemy.
  - The VM flags are required to complete each mission. They are woven into the story, and what the game says about the VMs must match SecGen (`scenarios/break_escape/safetynet/<mission>.xml` in the SecGen repo).
  - Kit is cumulative across missions. Combat is allowed.
  - The learning comes through the hands-on VM work and the linked field guides, not through lecturing in the dialogue.
- **Security-Informed Safety serious games (sis01–sis03):** education first.
  - They are CyBOK games on risk management, safety cases, incident response and the sector's regulation, played standalone, sometimes by student teams.
  - The aim is decisions that are genuinely arguable, professional voices that sound like the real job, facts that match the scenario's `information_pack.md`, and a debrief and lab sheet that give students something to reflect on.
  - There are no VMs, no spy framing and no combat (`"disableAttacks": true`).
  - See `docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md`.
- **Lab, demo and test scenarios** (`lab_*`, `crypto*`, `test*`, demos): small scenarios built around one lab topic or one engine feature. Keep them short and focused on that one thing. If a task needs their aims settled, ask the user, because they aren't written down yet.

Subagent reports are not shown to the user. The orchestrator reads each one, checks the claims that matter (often by reading the code or a screenshot itself), and tells the user what happened in plain terms.

## Iterating: pick the loops for the work

Most work here is iterative, and there is more than one loop. Decide which stages the task needs, run them in order, and loop on each stage until it's clean before moving on. A later stage can undo an earlier one (a dialogue fix can break a puzzle; a layout change means redoing a background), so order matters.

**How a round works, whatever the stage.** A fresh reviewer (Opus, read-only) runs the stage's skill in full and tags each finding blocker, major or minor with file:line. A fixer (Sonnet, unless a finding needs a design decision) acts on the findings; resume the same fixer between rounds so it keeps its context, until it passes about 300k tokens (see "Keep contexts short"). Then a new reviewer checks again. Record each round in the log as a severity table with counts, and give every finding an outcome: fixed, withdrawn and why, or deferred and why. Round 3 at least confirms that the earlier findings are closed. Keep going while blockers or majors still turn up, stop at round 5, and list whatever is left as open.

**Design-heavy stages want more cycles** (user, 2026-10-12). Dialogue, puzzle chains, room dressing and lighting improve with each full design → implement → review cycle, so aim for about five cycles there, not the three-round minimum. Each cycle should be a real improvement pass, not only a confirmation. Where cycles keep improving the work, going on to as many as ten before checking in with the user is fine (user, 2026-10-12: room dressing and the POV backgrounds); stop when a cycle finds nothing above minor. Mechanical stages (the character pipeline, audio, a pre-commit check) need only enough rounds to be correct.

### The five-phase improvement loop (an existing mission)

Use this to bring a playable mission up to standard. m03 was the first full run (`docs/agents/M03_IMPROVEMENT_PROMPT.md` is the reusable orchestrator prompt; `scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md` is the model log). m02 and sis02 went through the same stages.

1. **Alignment** (`mission-alignment-plan`): music, aims and objective staging, HaX's progress-gated hub, stakes and moral choices, rooms, canon with the missions either side.
2. **Puzzle chains** (`mission-puzzle-chains`): chain depth, lock order, cumulative kit, whether choices are required, the silent-failure engine bugs, VM flags woven in.
3. **Scenario design** (`scenario-design-review`): solvability, clue distribution, CyBOK coverage, objective scaffolding, "does the player always know what to do next?".
4. **Dialogue** (`npc-dialog-review`): the writing against the aim for the kind of game, and the ink structure. Snapshot the ink first so `tagdiff --old` proves what changed, and keep a list of spoken lines changed (old → new), because re-voicing costs money.
5. **Playtests** (`playtest-scenario`, "The improvement loop"): Haiku regression runs and Sonnet persona runs of 10–15 minutes with a reload, regression and struggling-player personas, at most 3 rounds, then a **blind playtest** with student materials only, one last fix pass and a targeted check.

### Other loops, by kind of work

- **A new mission or a planned change** (pass 3): plan → three adversarial review rounds → implement → implementation review → playtests → fix and confirm. See "The mission loop" below.
- **An editorial pass over several finished missions** (pass 4): design review → fixer → re-review and playtest → dialogue writer → script editor → dialogue playtest. See "The editorial loop" below.
- **A SIS game**: `docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md` (rooms, dialogue review, the user's decisions batched, fix pass, review and playtest loop, lab sheet, cast, a second dialogue review, audio). Judge against the SIS aims above, not the spy campaign.
- **Art and atmosphere, in this order:** `mission-room-dressing` (render → critique → fix → verify), then `mission-room-lighting` (design → review → implement → 2–4 visual review rounds, stopping after round two once nothing is above minor; `docs/agents/LIGHTING_PASS_BRIEF.md`), then `room-pov-background` last, because it copies the final layout and mood.
- **Characters** (`pixellab-character-pipeline`): every NPC gets the v2 pipeline (dialogue bust, talk sheet and/or visemes, 8-direction walk with the standard animations, facing checked). It can run alongside the other art stages because it touches only character assets, and it needs fewer review iterations: check each character's frames and facing once, repair, move on. A named recurring character gets art of their own (Nightshade's is `nightshade`, HaX's `agent_hax`), not a generic sprite another mission also uses. **Keep the cast diverse** (user, 2026-10-12): across a mission's cast, vary ethnicity, age and look, and say what you chose in the concept prompts. The text rarely specifies ethnicity, so don't default everyone to white British.
- **Lab sheet** (`mission-lab-sheet`): once the game has settled, followed by an independent audit against the game files.
- **Audio** (`tts-audio`): last of all, after the words have stopped changing, and only when the user agrees to the cost.

A whole mission usually runs the five phases, then the art order, then the lab sheet, then audio. A narrower task runs only the stages it touches, plus a playtest of whatever changed.

## The mission loop

For a new mission or a planned change to one (the pass-3 puzzle plans), each mission goes through this loop. Missions run in sequence, pipelined: one mission's playtests can run while the next mission is in planning.

1. **Plan** (Opus). A planner runs the relevant skill (e.g. `.claude/skills/mission-puzzle-chains/`) in full and writes the plan into the mission folder.
2. **Adversarial review, three rounds** (Opus, read-only). Each round is a fresh reviewer that verifies every claim against the code, citing file:line, tags findings blocker / major / minor, and ends with a verdict. The planner (resumed, so it keeps its context) folds the findings in. Wrong findings are recorded as "withdrawn" with the reason, not silently dropped. The third round is a confirmation that the earlier findings are closed.
3. **Implement** (Opus; often the planner itself, since it holds the context). Order matters: renames first, then a probe of any unproven engine path before building on it, then the rest. Static checks before handing back: ink compile, `ruby scripts/validate_scenario.rb`, `python3 scripts/check_door_alignment.py`, room depth, inkcheck/loopcheck over a state matrix, and assertions against the rendered JSON.
4. **Implementation review** (a fresh Opus agent, read-only), so the work gets independent eyes.
5. **Browser playtests** (Haiku for scripted regression runs, Sonnet for personas and for checking any Haiku "stuck" claim; split into short focused runs of 10–15 minutes, at least one with a mid-mission reload). Long single runs were cut off by safety checks and usage limits, so the scripts are split, and testers write findings into their report as they go.
6. **Fix, then a short confirmation run**, then mark the mission done in the log and commit it.

### The editorial loop (pass 4: design review, then dialogue)

For a pass over finished missions, every mission runs in parallel through the same stages, each gated on the one before:

1. **Design review** (Opus, read-only): the `scenario-design-review` skill in full, findings tagged blocker / major / minor, mission-local vs needs-approval.
2. **Design fixer** (Sonnet; findings that need a design decision go to an Opus fixer): implements the mission-local fixes, writes a short `PASS4_PLAYTEST.md` script for what changed.
3. **Fresh re-review** (Opus) and a **Haiku playtest** run side by side; their findings go back to the same fixer together, so the tester isn't playing a mission that's changing under it. Repeat until the re-review says "clean" and a short confirmation run passes.
4. **Dialogue writer** (Opus), from a shared prompt file (`docs/agents/PASS4_DIALOGUE_WRITER_PROMPT.md`), with a snapshot of the ink taken first so `tagdiff --old` can prove the structure is unchanged.
5. **Script editor** (Opus, fresh, `docs/agents/PASS4_SCRIPT_EDITOR_PROMPT.md`): verdict "ship" or "revise"; its notes go back to the same writer.
6. **Dialogue playtest** (Sonnet): reads the words on screen, checks hooks still fire, lists "didn't know what to do" moments and the ten worst lines. Fixes go back to the writer.
7. **Final or pre-commit check** (Haiku): a short targeted browser run of whatever the last round changed structurally, then commit the mission.

Calibrate first: put the first mission that's ready through the dialogue stage alone, show the user a short before/after sample, and roll the approach out only once they approve. Fold each round's lessons into the shared prompt files so later missions don't repeat them.

## Choosing a model

- **Default to Sonnet; choose Opus on purpose.** Set `model` on every Agent call: a `general-purpose` agent launched without one inherits Opus. Opus is for planning, adversarial review, dialogue writing, script editing and engine design. Fixers that act on a reviewer's tagged findings (design, alignment, pass-2, room dressing) run on Sonnet. Send only the findings that need a design decision to an Opus fixer.
- **Keep contexts short.** Context length is the main cost: every call re-reads the agent's whole context, and in October 2026 calls over 200k tokens were more than half of all spend. When a resumed fixer or builder passes about 300k tokens, have it write a handover note (what's done, what's open, the files it touched) and start a fresh agent from that note. Split large builds into one agent per stage or stage chunk, not one agent for a whole mission.
- **Opus** for planning and review work: scenario planning, design review, adversarial review, implementation of engine work or anything else that needs design judgement, architecture decisions, and dialogue writing. These tasks require understanding nuance, weighing trade-offs, and making open-ended judgements.
- **Sonnet** for well-defined executable tasks: blind, persona and dialogue playtests, mechanical edits with clear rules (e.g. renaming, replacing a pattern across files), audits with a checklist, re-tests, polish items, and any implementation task where the scope, rules and acceptance criteria are clear and documented. Sonnet excels at following a well-written spec.
- **Haiku** (5.5) for scripted browser playtests (regression and confirmation runs; a Sonnet run checks any "stuck" or "blocked" it reports before it counts as a bug), information retrieval and mechanical file operations: searching for symbols or patterns across the codebase, building lists of files matching criteria, find-and-replace operations, and simple data extraction. These tasks are fast, reliable, and cheap, freeing Opus and Sonnet for higher-level work.
- **Opus 5.5 orchestrates, as it always has** — for planning, review, design, dialogue and everything not touching the VM/technical layer. Opus 5.5 subagents (`general-purpose`, `Plan`, or any agent launched with `model: "opus"`) get the same work and the same limit.
- **The `opus48` agent type handles the VM/technical layer.** Opus 5.5's content safeguards are stricter than Opus 4.8's: they over-flag practice-VM and lab material, and have stopped VM-writing subagents. Opus 4.8 handles the same material fine. So send **SecGen scenario and module reads and edits, the VM technical-step writing and the technical lab-sheet companion to the `opus48` agent type** (`.claude/agents/opus48.md`: Opus 4.8, medium effort; launch it without a `model` override, which would put it back on Opus 5.5). Keep the game walkthrough and the VM technical steps in separate files (the `mission-lab-sheet` companion split), so the Opus 5.5 orchestrator and its subagents only ever handle the non-technical half. If a specific VM-dense doc still snags the orchestrator, isolate that doc from its reading rather than moving the orchestrator off Opus 5.5. This is model-fit, not evading a refusal: route the work so Opus 5.5 never has to read the material its filter rejects.
- **If a safety classifier stops an `opus48` VM or SecGen task, stop and offer the user a `sonnet-cvp` or Haiku retry. Don't run it yourself.** Report the exact stop message, what the agent had done, and the file or step it was on. If the message allows it, offer to rerun the **same task with the same prompt** on the selected model. The user decides after reading the message. If they agree, run it unchanged: no rewording to slip past the check, no stripped context, no wider reads. If that is stopped too, or either model declines the task itself, report it and stop: no further offers, no third model, no doing it yourself.
- Don't throttle concurrency to save usage. Run independent agents together. The economy that matters is model choice, not agent count.

## Writing a subagent prompt

- Point at files rather than restating them: the shared brief, the plan, the previous round's findings, the approval log. A subagent starts cold, so give it the exact paths it needs.
- State scope and limits explicitly: which files it may edit, which it must not (other missions, finished missions, `.claude/skills/*`, other repos), and "don't commit".
- Say what to return: a change list, test results, evidence (file:line, game ids, screenshots), and the questions for the next step.
- Ask for plans and long documents to be written **section by section with Edit**. A whole-file rewrite once got truncated and a plan was lost.
- Keep prose at game-design level. Refer to casualty figures, attack steps and similar detail by citation rather than restating them, and keep briefs that touch the lab sheets or the VM's technical content short ("carry out approved item L1 in the log"). Long, detailed briefs on those topics have been stopped mid-run before; where the task is the VM's technical content itself, hand it to the model chosen for that (see "Choosing a model").
- When parallel agents touch the same area, split them by file and tell each one to re-read any shared file just before editing it.

## Making judgements without asking

**In an iterative review-and-fix process** (the mission loop, an editorial pass, a playtest improvement loop), make most of the design and writing judgements yourself. Use the aim for the kind of game (above) as the test. Settle these without asking:
- pacing, and where each clue goes;
- how a scene plays, and a character's voice;
- line rewrites, and cutting what drags;
- the choice between workable options a reviewer raises.

Log each one in a line with its reason, so the user can overrule it later. This keeps the rounds moving. It does not cover one-off requests: when the user asks for a specific change, do what they asked, and check with them before going beyond it.

In any task, the orchestrator decides these itself and records them in the log:

- **Mission-local changes** (a mission's own scenario file, ink and docs) that make it better to play and keep it solvable and validator-clean.
- **Open design questions** left in a plan, where a sensible default exists. Pick one, say why in one line, and let the user overrule.
- **Small tidy-ups** found along the way: a stale line, a misplaced object, a credit that over-claims.
- **Withdrawing a reviewer's finding** after checking the code shows it's wrong.

Everything else goes into the approval log for the user: engine or server changes, shared minigames, other missions (especially finished ones with cached audio), SecGen, the lab sheets, image generation and anything that costs money.

## Asking the user for input

- Ask about the items in the approval list above. Also ask when two options would change the story or the teaching in ways the user would clearly care about.
- **When a question does need to come to the user, do these in order:**
  1. Write the full context to a pending-decisions file in the mission or pass folder (e.g. `scenarios/<mission>/DECISIONS_PENDING.md`): each question's background, the options with their trade-offs, your recommendation and the evidence (file:line). The user can then read it later, away from the session.
  2. Print a short form of the same on screen.
  3. Ask through the question tool with **checkbox options**: a short label, a one-line trade-off, the recommended option first, related questions batched into one call. The user often answers in the free-text field, so read the answer carefully rather than assuming one of the boxes.
  4. Carry on with independent work while waiting.
  5. When the user answers, move the item from the pending file into the log with their choice.
- **For visual picks, or many decisions at once, publish a review page** (the user's preferred way, 2026-10-22). Build one HTML artifact and send the link; it replaces the question tool for these. The first one was the lab bust picker (`https://claude.ai/artifact/51uFp9kwkZiVviLY7NBkwW`).
  - **When to use it:** choosing between images (bust variants, concepts, backgrounds, props), or a batch of decisions that each need a picture or a paragraph of context.
  - **What goes on it:**
    - One row per subject (character, room, finding), with the reference image (the concept, or the current state) beside the options.
    - Pixel art scaled up 2× with `image-rendering: pixelated`. This is a review thumbnail only, never a game asset.
    - Images embedded as data URIs.
    - Each option clickable, as a radio card with its variant id, plus a "none of these, make more" option.
    - A one-line note under each option giving the agent's view, with its recommendation marked "suggested". The user still makes every pick.
  - **How the user answers:** a "Copy picks" box at the bottom collects the answers for the user to paste back. Each line carries the question as well as the answer, `key (question title): choice — note`, so the pasted text makes sense on its own in the conversation and in any log it's copied into. Picks persist in localStorage, so the page can be reopened.
  - **When options are added:** republish the same file path. The link stays the same and a regenerating script builds the page again.
  - **Agents waiting on the picks:** pause any paid step that depends on them, then resume each agent with its picks.
- Ask only when the answer changes what happens next. Otherwise pick the conventional default and mention it.
- When the user says "use your best judgement", decide, act, and say what you chose.
- Report outcomes plainly: what passed, what failed with evidence, what was skipped. A static check isn't a browser test, so say which one you ran.
- End each update with one-line assumptions the user might want to challenge.

## Standing user rules

- **Kit is cumulative** across missions (lockpick from m01, RFID cloner from m03, fingerprint kit from m04). The PIN cracker is rationed.
- **Renamed NPCs get renamed ids** (globals, ink files, knots, tasks, rooms), with a dated note on stale planning docs. The handler's id stays `agent_0x99`. m01 is left alone because its audio is cached.
- **Draft playtests run on the keyless server on :3001** (no Gemini key, so no TTS is generated). Use `PLAYTEST_PORT=3001` with `tools/playtest/new-game.rb`, and `tools/playtest/start-keyless-server.sh`. Never stop the user's server on :3000.
- **Spoken-line changes cost money.** The TTS cache is keyed on text, voice, style wording, language and model, so list every spoken line a change touches. Generate a mission's audio only once its dialogue is signed off. Everything about voice audio (generating, checking, pruning, committing, voice styles) is in the `tts-audio` skill.
- **No printed variables in voiced lines** (user, 2026-10-04). A voiced line that prints `{player_name()}`, a count or any other variable gives different text per player and can never be cached. Use fixed wording; choosing between fixed strings with an inline conditional or alternative is fine.
- **Images are generated one at a time** (or in small batches once a style is approved), with feedback between. PixelLab is preferred (flat subscription), at the target size, never downscaled.
- **Minigames should be fun and educational, not hard.**
- UK English, plain writing, no AI-sounding filler. No attribution lines in commits.

## Verifying work

- A playtest isn't a pass until `tools/playtest/verify-run.rb` shows progress on the server. Testers keep an earned-secrets table: anything typed from the solution guide or set by console is "exercised, not earned".
- Engine changes get node tests (`test/js/`), the Rails suite (`bin/rails test`), the phone reopen check (`node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`) and a browser regression across the affected missions before they're committed.
- Ink rewrites get `scripts/ink_runtime_check/tagdiff.mjs` against the last commit: every changed tag, knot, variable, divert or choice condition must be explained.
- The bug classes that recurred across pass 4 are checked automatically: the validator's recurring-bug checks (lockpick catches that can't fire, opening cutscene without `waitForEvent`, sprite art, look-alikes, dead `VAR`s, undeclared `#set_global`, repeated bark lines) and `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<m>/` (fall-through choices, blank re-entry, popup on narration, phone prefixes, exits with no reply, stage cues). Clear or justify each finding before a mission goes to playtest; the rest of the list is in `README_scenario_design.md` ("Common bugs and how to avoid them") and the review skills. Use `--skip-ink --no-graph` to validate a mission someone else is editing without rewriting its files.
- **Check that a claimed fix happened.** Agents reported fixes they hadn't made several times in pass 4 (a clock line "made conditional", phone prefixes "removed", a flag call "no longer repeating"). Before accepting a report, grep or read the line for every claim that matters.
- **A follow-up message can arrive after an agent has stopped.** It then does nothing. After sending a follow-up, check the file changed before moving on, and resend if it didn't.
- **When a content safeguard stops an agent mid-run**, its work wasn't reviewed: check the diff yourself (files touched, validator, reopencheck) before building on it.
- **Blind and regression playtests.** Regression runs (answers known, but each secret fetched from its in-game source first) prove the route works; a blind run, with a script that doesn't name the answer, is needed once after any puzzle or deduction changes. See the playtest-scenario skill.
- **Before committing a mission whose last round changed structure** (new knots, moved objects, changed conditions), run a short targeted browser check of exactly those changes.
- Look at the screenshots yourself before calling UI work done.

## Reporting progress by stage

When the user asks for progress, or at the end of a long run, report by stage (the user's preferred format, 2026-10-22). Use one block per track (for example, a lab and its awareness episodes), in a fenced code block so the bars line up:

```
Stage             Progress    B/M/m open  Status
Scenario design   ██████████  0/0/0       5 of 5 cycles, closed
Dialogue          ████░░░░░░  0/0/2       cycle 2 done, cycle 3 review running
Rooms             ██░░░░░░░░  0/0/9       review done; fixes, lighting, POV to do
Lab sheet         ░░░░░░░░░░  –           last
```

- **Stages** are POLISH_PLAN's (or the mission loop's) stages, in order, plus any work stream running alongside them (characters, fun changes, check forms).
- **The bar** is ten blocks. Fill it by cycles or rounds done out of planned, or by a fair judgement for stages without cycles. A closed stage is full.
- **B/M/m open** counts the blockers, majors and minors still open from that stage's latest review or playtest. Count findings that are fixed but not yet confirmed as open, and add "fixing" to the status. Use `–` where no review has run yet. Leave trivials out of the column, and mention them in the status if they matter.
- **Status** is one short line: cycles done, what is running now, what is left.

After the blocks, add:
- a short table of the rounds completed in this session;
- a numbered "what's left" list, in the order the work will happen;
- anything waiting on the user (decisions, approvals, art to eyeball).

Take the counts from the review and playtest files and the logs, not from memory, and say where a count is an estimate.

## Housekeeping

- **Hacktivity plans live in Hacktivity.** Hacktivity platform details (courses, seeding, scoring, reporting routes, admin) are stored in the Hacktivity repo at `docs/awareness_course/`, not here. Put new platform detail there (Hacktivity repo, main; ask the user before any Hacktivity edit) and keep only feature-level facts in this repo.
- **The dev database is shared and has no backup.** The main tree, every worktree and the :3000/:3001/:3002 servers all use Postgres `break_escape_development`. Never run `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop` or `db:setup` without the user's say-so; `db:seed` is fine. A worktree agent's `schema:load` wiped every game on 2026-10-30.
- Agents that stop mid-run leave headless browsers and stuck harness commands behind. List them with `ps`, check what they are, and kill them **by PID**. Never use `pkill -f` with a pattern that also appears in your own command line, because it kills your own shell.
- When taking over from an agent that spawned children, list the live agents first and stop its children, or you get duplicate builders overwriting each other.
- Agents share one working tree. Never `git stash`, `git checkout -- <file>` or `git reset` to get a clean baseline, because that pulls other agents' unsaved work out from under them. Compare against `git show HEAD:<path>` or use a worktree instead.
- Give each parallel agent its own scratch subfolder (`<mission>-<role>/`) and give the full session scratchpad path in the prompt; "the session scratchpad" alone made some agents create a `scratchpad/` folder in the repo. Agents that share the scratchpad root overwrite each other's helper scripts and check outputs.
- **Shared files** (`scripts/ink_runtime_check/missions.json`, the voice bible, the brief): tell agents to edit only their own block, re-read just before editing, and never reformat the whole file. Validate shared JSON after any agent touches it.
- **Run checks without side effects.** The validator rewrites `dungeon_graph.*` on every run; agents checking a mission someone else is editing use `--skip-ink --no-graph`.
- Delete stray files a harness writes into the repo root, after looking at them.
- Commit in logical groups (engine, tooling, docs, one commit per mission). Where a shared file mixes several fixes, commit them together rather than leaving an intermediate commit that doesn't run. Commit engine changes before the missions that rely on them, and run the node and Rails suites before each engine commit.
- Don't leave a test that compares live content with HEAD: it fails whenever anyone edits that content. Test against fixtures.
- If a usage limit is near, stop launching agents, write the resume note, and say that nothing restarts on its own.
