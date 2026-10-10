# Task: iterative improvement of m03 "Ghost in the Machine"

You are the orchestrator for a full improvement pass on Break Escape mission **m03_ghost_in_the_machine** (`scenarios/m03_ghost_in_the_machine/`). Run it the way m02 "Ransomed Trust" and sis01 were brought up to standard in October 2026: skill-led reviews, a fixer acting on each review's findings, fresh re-reviews, then playtests, ending in a blind playtest. You plan, task, check and decide. Subagents do the reviewing, fixing and playtesting.

## Read first

1. `AGENTS.md`, all of it. It is binding: the mission loop, model choice, writing subagent prompts, what to decide without asking, standing user rules, verification and housekeeping.
2. `README_scenario_design.md` and `README_ink_best_practices.md`.
3. The skills you will run, in full before each phase, in `.claude/skills/`:
   - `mission-alignment-plan`
   - `mission-puzzle-chains`
   - `scenario-design-review`
   - `npc-dialog-review`
   - `playtest-scenario`, especially "The improvement loop", "Blind runs find what scripted runs can't" and the severity table in Step 5
   - `validate-scenario` and `walkthrough-scenario`, as needed
4. The models to copy:
   - `scenarios/m02_ransomed_trust/PLAYTEST_LOOP_LOG.md`, the most recent complete loop: severity tables per round, fixes, spoken lines and open items;
   - `docs/agents/SIS_IMPROVEMENT_PLAYBOOK.md`, a phase-by-phase account of the sis01 pass with lessons.
5. m03's history. These describe earlier passes and may be stale: verify any claim against `scenario.json.erb` and the ink before relying on it.
   - `ALIGNMENT_PLAN.md`
   - `PUZZLE_CHAINS_PLAN.md`
   - `DESIGN_REVIEW.md`
   - `DESIGN_REREVIEW_1.md`
   - `DIALOGUE_REVIEW.md`
   - `DIALOGUE_EDIT_NOTES.md`
   - `PASS2_IMPROVEMENTS.md`
   - `PASS4_PLAYTEST.md`
   - `TESTING_WALKTHROUGH.md`
   - `mission.json`
   - `git log -- scenarios/m03_ghost_in_the_machine`
6. `docs/agents/RESUME.md` and `docs/IDEAS_BACKLOG.md`.

m02 is now the gold standard. Where a skill says "compare with m01/m02", weight m02's current state most heavily.

## First, check the environment (this is a cloud session)

Before planning any phase, find out what this session can run, and record the answers in the log:

- **Ink and validator:** `bin/inklecate` (ink compile) and `ruby scripts/validate_scenario.rb`.
- **Static checks:** `node scripts/ink_runtime_check/dialoguelint.mjs`, `tagdiff.mjs`, `reopencheck.mjs`, plus inkcheck and loopcheck.
- **Test suites:** `node --test test/js/` and `bin/rails test`. The Rails suite needs a database.
- **Browser playtests:** `tools/playtest/start-keyless-server.sh` (port 3001), `tools/playtest/new-game.rb`, and the `session-start.sh` / `cmd.sh` / `session-stop.sh` harness, which needs a headless Chromium.
- **SecGen:** see "VM flags" below.

If browser playtests can't run here, do every phase's static work anyway. Replace each browser step with a written test script in `scenarios/m03_ghost_in_the_machine/PENDING_BROWSER_CHECKS.md`, as specific as the m02 confirmation checklists in its loop log, so the user can run them locally later. Say plainly in every report which checks were static and which were in a browser.

## Phases

Run the phases in order. Each phase is a loop of **at least three rounds**:

1. A fresh Opus reviewer runs the skill read-only and tags each finding blocker, major or minor, with file:line.
2. The fixer acts on the findings: Opus, resumed between rounds so it keeps its context.
3. A fresh reviewer re-reviews.

Round 3 is at minimum a confirmation that every earlier finding is closed or withdrawn with a reason. Keep going past round 3 while blockers or majors are still turning up, and stop at round 5: list anything left as open.

Record each round in the log as a severity table, with counts, and with each finding's outcome: fixed, withdrawn and why, or deferred and why.

1. **Mission alignment review** (`mission-alignment-plan`). Bring m03 up to the m01/m02 standard, covering:

   - music;
   - aims and objective staging, including aims revealing as soon as any task in them makes progress;
   - Agent HaX's progress-gated support hub;
   - stakes and moral choices with visible consequences;
   - rooms and layout;
   - canon with m02, whose events m03 follows: the St. Catherine's ransomware, Ghost, Zero Day Syndicate as the exploit seller.

   The skill produces a plan. Implementing it is the fix step of each round.
2. **Puzzle review** (`mission-puzzle-chains`): chain depth, lock ordering, kit progression (kit is cumulative: lockpick from m01, the RFID cloner introduced here, the PIN cracker rationed), whether the mission's choices are actually required, and the engine bug classes that make puzzles fail silently. Include the VM flag weaving below.
3. **Scenario design review** (`scenario-design-review`): solvability, clue distribution, educational coverage against `mission.json`'s CyBOK list, objectives scaffolding, KO resilience, and "does the player always know what to do next?".
4. **Dialogue review** (`npc-dialog-review`): judge two things.

   - **Writing:** dialogue that plays like a well-written TV spy thriller: natural spoken lines in each NPC's voice, subtext and tension, choices that matter, no lectures in characters' mouths, one person delivering each moral, distinct greetings.
   - **Structure:** dead variables, fall-through choices, exits with no reply.

   Take an ink snapshot before the fixer edits, so `tagdiff --old` can prove what changed. Keep a running list of every spoken line changed, old → new, because spoken-line changes cost money.
5. **Playtest loop** (`playtest-scenario`, "The improvement loop"):
   - **Testers:** Sonnet, in short runs of 10–15 minutes, with at least one mid-mission reload. Use a regression persona and a struggling-player persona, then fix, then a confirmation run.
   - **Rounds:** iterate while blockers or majors are found, for at most 3 rounds.
   - **Finish:** a fresh blind playtest with two personas ("do your best" with a reload at a risky moment, and "struggling player"). Each sees only student materials, and each reports scores for fun, pacing, clarity, openness and teaching.
   - **Blind-run findings:** these get one last fix pass and a short targeted browser check.

## VM flags (standing rule)

The SAFETYNET missions m01–m08 must require the VM flags to complete, and the flags must be woven into the story rather than bolted on. What is on each VM is defined in SecGen: `scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml` in https://github.com/cliffe/SecGen (master branch).

- If SecGen isn't in this environment, clone it read-only into the session scratchpad.
- If the m03 file isn't on the remote, say so in the log, and carry on with the game-side checks.

In the puzzle and design phases, cross-check every in-game reference to VM content against the SecGen XML: Agent HaX's flag texts, the hints, the documents, the credentials the game hands out, and the debrief. m02's VM turned out to describe an earlier draft of the story: a different insider, safe code, ransom and password. If m03's has drifted the same way:

- **Change SecGen to match the game**, not the other way round. Write each proposed SecGen change down, as text-only edits that keep the flag numbering, plus any credential that must match an in-game hint.
- **Don't edit SecGen.** SecGen changes need the user's approval, and this session may not be able to push there.

Playtests supply flags through the session policy, because there is no VM. That never blocks a run. In-game prerequisites, such as a password the game points to, must still be earned, and testers keep an earned-secrets table.

## Lessons from the m02 and sis01 loops (check these early)

- **Blind runs find what scripted runs can't.** m02 passed scripted confirmations with no blockers or majors, then its blind runs found:

  - a route nobody could find (server room through a guard's office);
  - a code only in one diary;
  - a dead end after a fight;
  - a title screen that ignored Space and Enter.

  Budget for a fix pass after the blind run.
- **Insider and deduction puzzles:** check that the answer isn't handed over by a task title, a toast, an NPC who names the culprit, or a reason option whose wording gives it away. Make the red herrings cost something.
- **Debrief and credits:** gate every line on what the player actually did and saw. Testers repeatedly caught lines claiming promises, deaths or discoveries the player never made. Check that the debrief and the credits agree with each other.
- **Next step on screen:** after every major beat there must be a visible task or toast, not only a line in the phone thread.
- **Static checks miss things.** Event mappings only exist once an NPC's room has loaded: relay through a start-room NPC, or mark the mapping `fireOnlyWhenLoaded`. Two cutscenes on one event cut each other off.
- **Check a claimed fix happened.** Subagents have reported fixes they hadn't made, and follow-up messages sometimes arrive after an agent has stopped. Grep the line, and resend if the file didn't change.
- **Playtesters and the permission layer:**
  - Tell testers to use only the checked-in harness scripts, with no wrapper or helper scripts, which the permission layer blocks.
  - Testers should keep DOM reads and clicks few, and only on visible controls.
  - If a tool call is refused, the tester stops and reports rather than retrying in another form.
  - If a tester's Write is refused, the tester puts the full report in its final message, and you save it to the scratchpad for the fixer.
- **Engine findings:** classify each finding as mission, engine or no-fix. Engine fixes are separate items with node tests, and the user approves them. Recent engine behaviour worth knowing:
  - skipped task status;
  - the brief shown once;
  - a hit closes the open minigame;
  - the examine view for text-only objects and no-action inventory items;
  - the held-barks release policy;
  - every portrait faces right.

## Decisions and the user

m03 is a SAFETYNET campaign mission, so it aims at a fun game with well-written TV spy thriller dialogue, and its VM flags are part of the story (AGENTS.md, "Kinds of game and what each aims for"). Make most judgements yourself against that aim, and log each one in a line with its reason.

When a question must come to the user, follow AGENTS.md "Asking the user for input". The pending-decisions file is `scenarios/m03_ghost_in_the_machine/DECISIONS_PENDING.md`.

If the user hasn't answered by the time a phase depends on the answer:

- take the recommended option if it's reversible and mission-local;
- otherwise park the item as open and carry on.

## Where things live

- **Log:** `scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md`. It holds one section per phase with each round's severity table, the decisions, the spoken lines changed (old → new) and open items. Keep it in the repo, not the scratchpad.
- **Resume note:** add a short m03 status line to `docs/agents/RESUME.md` after each phase.
- **Scratch:** give each subagent its own subfolder of the session scratchpad (`m03-<phase>-<role>/`), with the full path in its prompt.
- **Git:** work on a branch named `claude/m03-improvement-loop`.
  - Commit at the end of each phase, after its checks pass, as the user's standing permission for this task.
  - Commit engine changes separately, before the mission commits that rely on them.
  - Push the branch, and never merge to `main`.
  - No attribution lines in commits.

## Final report

When the blind playtest's fix pass is done, give the user:

- a table of each phase's rounds, with blocker, major and minor counts per round;
- the blind runs' scores and their worst stuck moments;
- the commits;
- the full list of spoken lines changed;
- the proposed SecGen changes;
- the engine items waiting for approval;
- which checks were browser-tested and which were static only.

Write it in UK English and plain prose, with no filler. End with one-line assumptions the user might want to challenge.
