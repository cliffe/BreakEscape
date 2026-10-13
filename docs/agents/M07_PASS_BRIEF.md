# m07 full improvement pass: shared brief for subagents (started 2026-10-13)

m07 "The Architect's Gambit" (`scenarios/m07_architects_gambit/`) has had pass 2, the pass-4 editorial loop and the cross-mission sprite renames, but never the full improvement loop in `AGENTS.md` ("Iterating": the five-phase loop, then the art order and characters) or the art and atmosphere work. This pass takes it through every stage.

## Kind of game and aim

A SAFETYNET campaign mission and the season's climax set-piece: a TV spy thriller. Four ENTROPY operations go live in the same sixty seconds. The player is the one agent in range, sent to a grid control facility outside Portland where a cascade sequence waits on the control system; the single tactical team can reach only one of the other three crises, the player chooses which, and the debrief reads out what happened at the two left unanswered. The player gets past badges and locks, takes the attack host apart, stops the cascade, and learns what the night was really measuring. The choice must cost something real and be paid off honestly. Kit is cumulative from m01-m06. Canon: follows m06 (the Architect's Fund); sets up m08's mole (the Portland deployment leaked before it was signed). SAFETYNET detains and hands over, it doesn't arrest. Backlog threads to weigh: the Architect's teacher line for m08, Sterling/Danny from m03 (`docs/IDEAS_BACKLOG.md`).

Read `AGENTS.md` first: "Iterating", "Making judgements without asking", "Standing user rules", "Verifying work" and "Housekeeping". It is binding. `docs/agents/M03_IMPROVEMENT_PROMPT.md` describes the phases in detail; where it says m03, read this mission.

m04's pass is complete and is the nearest worked example (m05 and m06 are running now) (`scenarios/m04_critical_failure/IMPROVEMENT_LOOP_LOG.md`, Pass 5). Copy its patterns:
- a whole-route driver with a clock model and `"reload": "page"` steps;
- a progress-gated HaX hub that checks whether a step is done, not how it was done;
- the sweep-then-call-in ending;
- sight challenges;
- debrief and credit lines gated on what the player actually did.

## VM flags

The SAFETYNET missions must require the VM flags, and the flags must be woven into the story. Reviewers judge only that: the flags are required, the story frames them, HaX reacts to each one, and the debrief reflects them. Read the in-game text (flag tasks, HaX's texts, `mission.json`). Don't describe or check what is on the VM. Any claim about VM content goes in the report as "needs checking against SecGen by the user".

## Stages, in order

The user approved the full review, design and develop cycle on 2026-10-13.

1. **Regression playtest.** Check the mission against today's engine:
   - lighting variants, toasts, the RFID denial hold, KO on reload;
   - sight challenges, the tutorial hold, the required-task `*` marker;
   - the renamed sprites `nightshade` and `agent_hax`, and HaX's new bust.
2. **Alignment, puzzle chains, scenario design.** Run `mission-alignment-plan`, then `mission-puzzle-chains`, then `scenario-design-review`. Each is a review-then-fix loop. Aim for about five cycles on design-heavy work. Close a stage when a round finds nothing above minor and a browser check confirms it.
3. **Dialogue** (`npc-dialog-review`). About five cycles, with a whole-route driver in `scripts/ink_runtime_check/m07_routes/`.
4. **Room dressing, lighting, POV backgrounds**, in that order:
   - `mission-room-dressing`: up to ten cycles while each still improves things.
   - `mission-room-lighting`.
   - `room-pov-background` last.

   The first room of a new setting needs the user's sign-off. Log it as pending and carry on with the other rooms.
5. **Characters** (`pixellab-character-pipeline`), for every NPC. This stage is **parked for user input**: concepts are metered Gemini images, and every pick is the user's. Write cast-look proposals in `DECISIONS_PENDING.md` (a diverse cast, matched to each voice style's accent and age). Don't generate any images until the user answers.
6. **Playtests.**
   - Sonnet regression and struggling-player runs.
   - A struggling-player blind run.
   - A "do your best" blind prompt file for the user to run outside auto mode.

Not in this pass: the lab sheet, audio, SecGen edits.

## Working without the user

User, 2026-10-13: carry on without the user's input. Anything that needs the user goes in `DECISIONS_PENDING.md` in the mission folder, with a recommendation, and work moves on to whatever isn't blocked. That covers:
- story direction that can't be decided against the aim;
- engine changes;
- character picks;
- first-room sign-off;
- SecGen checks.

The orchestrator makes mission-local, reversible choices and logs each one with its reason.

## Rules

- Everything goes into the repo (`scenarios/m07_architects_gambit/`), never only the scratchpad. Log each round in `IMPROVEMENT_LOOP_LOG.md` (create it, modelled on m03's): severity table with counts and each finding's outcome (fixed / withdrawn and why / deferred and why).
- Reviewers are read-only and cite file:line. Verify claims against `scenario.json.erb` and the ink, not the older design docs.
- `scenario.json.erb` is shared between stages: small, exact Edit replacements, re-read the region first. Dialogue edits stay in ink and NPC/dialogue fields; dressing edits room layout, objects and maps.
- Engine changes only with the orchestrator's approval; committed separately, before mission changes. Subagents don't commit unless told; the orchestrator commits.
- **Don't open these files** (a safety check has stopped agents reading their exploit detail, three times on 2026-10-13):
  - the SecGen scenario XML for any mission;
  - in HacktivityLabSheets `_labs/safetynet/`: `distcc-exploitation.md`, `proftpd-exploitation-workflow.md`, `scanning-and-exploitation.md`, `privilege-escalation.md`.
  Refer to those guides by title and published URL only. Grep for an exact option string or title if you must, but never read their bodies. For the VM side, work from the in-game text (HaX's flag texts, hints, documents, debrief). Anything that can only be checked against those files goes in your report as "needs checking against SecGen by the user". Propose SecGen text changes in writing only.
- Image generation: PixelLab is flat-rate; Gemini is metered (one image at a time, look at each; the orchestrator checks with the user before batches). Never downscale pixel art. Props square to the walls; one or two angled per room is fine.
- If a permission or safety check refuses an action, stop and report it. Don't route around it.

## Environment (local machine)

Repo: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`.

- Ink compile: `scripts/compile-ink.sh m07_architects_gambit`.
- Validator: `ruby scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb` (reviewers add `--skip-ink --no-graph`).
- Static checks: `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m07_architects_gambit/`, `tagdiff.mjs`, `reopencheck.mjs scripts/ink_runtime_check/missions.json`, `inkcheck.js`, `loopcheck.js`, `python3 scripts/check_door_alignment.py`.
- Browser playtests: Sonnet only, keyless server on **:3001** (start with `tools/playtest/start-keyless-server.sh` if down; never touch :3000). New game: `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3001 bin/rails runner tools/playtest/new-game.rb m07_architects_gambit`. Then `tools/playtest/session-start.sh --headless true`, `cmd.sh`, `session-stop.sh`, `verify-run.rb` as in the `playtest-scenario` skill. Use only the checked-in scripts. Runs of 10–15 minutes, at least one mid-mission reload. Stop every session you start.
- Scratch: the session scratchpad, a subfolder named `m07-<stage>-<role>/`. Reports go into the mission folder.
