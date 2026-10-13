# m04 full improvement pass: shared brief for subagents (started 2026-10-13)

m04 "Critical Failure" (`scenarios/m04_critical_failure/`) has had pass 2 (PASS2_IMPROVEMENTS.md), the pass-4 editorial loop (DESIGN_REVIEW.md, PASS4_PLAYTEST.md) and cross-mission sprite renames, but never the five-phase improvement loop or the art and atmosphere work. This pass gives it both, to the standard m03 reached on 2026-10-13 (`scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md`, the model log).

Read `AGENTS.md` first ("Iterating", "Making judgements without asking", "Standing user rules", "Verifying work", "Housekeeping"). It is binding. `docs/agents/M03_IMPROVEMENT_PROMPT.md` describes the phases in detail; where it says m03, read m04.

## Kind of game and aim

A SAFETYNET campaign mission: a TV spy thriller. Tension, secrets, characters with their own agendas, sharp exchanges and reveals that land. Agent HaX is the handler, ENTROPY's Critical Mass cell the enemy. The player infiltrates Albion Energy Storage (200 MWh grid battery site) where the BMS and SCADA telemetry is falsified to drive the racks into thermal runaway before an 0800 trigger; eleven people on site, 240,000 on the feed. Confirm the lie against a physical instrument, work the OT network from the engineering workshop (VM flags, required and woven into the story), deal with the cell's operatives (Cipher, Relay, Static, Voltage), and reach the hardwired Emergency Shutdown. Teaching comes through the VM work and field guides, not lectures. Kit is cumulative: lockpick (m01), RFID cloner (m03), fingerprint kit; check what m04 introduces.

## Stages, in order (user-approved 2026-10-13: "all the review, design, develop steps")

1. **Regression playtest** against today's engine (lighting, toasts, RFID denial hold, KO on reload, sight challenges, sprite renames). Fix what breaks.
2. **Alignment** (`mission-alignment-plan`), **puzzle chains** (`mission-puzzle-chains`, including VM flag weaving checked against the SecGen scenario at a high level), **scenario design** (`scenario-design-review`): each a review → fix loop, about five cycles for design-heavy work.
3. **Dialogue** (`npc-dialog-review`), about five full cycles, with a whole-route driver like `scripts/ink_runtime_check/m03_routes/route.js` (use `"reload": "page"` steps: only synced globals survive a browser reload). No m04 audio on 3.8 yet, so spoken-line changes are cheap; still keep an old → new list.
4. **Room dressing** (`mission-room-dressing`), about five, up to ten cycles while improving. Runs alongside dialogue.
5. **Lighting** (`mission-room-lighting`) after dressing; m04's mood: a night shift at a battery plant heading towards thermal runaway. Room variants, NPC torches and `lighting-tour.sh` flags exist (see the skill).
6. **POV chat backgrounds** (`room-pov-background`) after dressing and lighting are final; the first room of a new setting needs the user's sign-off.
7. **Characters** (`pixellab-character-pipeline`): every NPC, fewer iterations; the user sees each pick (concept, bust); visemes from talk runs; keep the cast diverse; save chosen concepts beside each character.
8. **Playtests**: Sonnet regression and struggling-player runs, then a struggling-player blind run, and a "do your best" blind prompt file for the user to run outside auto mode.

Not in this pass: lab sheet, audio, SecGen edits.

## Rules

- Everything goes into the repo (`scenarios/m04_critical_failure/`), never only the scratchpad. Log each round in `IMPROVEMENT_LOOP_LOG.md` (create it, modelled on m03's): severity table with counts and each finding's outcome (fixed / withdrawn and why / deferred and why).
- Reviewers are read-only and cite file:line. Verify claims against `scenario.json.erb` and the ink, not the older design docs.
- `scenario.json.erb` is shared between stages: small, exact Edit replacements, re-read the region first. Dialogue edits stay in ink and NPC/dialogue fields; dressing edits room layout, objects and maps.
- Engine changes only with the orchestrator's approval; committed separately, before mission changes. Subagents don't commit unless told; the orchestrator commits.
- SecGen: don't open exploit-detail content in the SecGen XML (a safety check has stopped an agent doing that); work from the in-game text and the published field guides. Propose SecGen text changes in writing only.
- Image generation: PixelLab is flat-rate; Gemini is metered (one image at a time, look at each; the orchestrator checks with the user before batches). Never downscale pixel art. Props square to the walls; one or two angled per room is fine.
- If a permission or safety check refuses an action, stop and report it. Don't route around it.

## Environment (local machine)

Repo: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`.

- Ink compile: `scripts/compile-ink.sh m04_critical_failure`.
- Validator: `ruby scripts/validate_scenario.rb scenarios/m04_critical_failure/scenario.json.erb` (reviewers add `--skip-ink --no-graph`).
- Static checks: `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m04_critical_failure/`, `tagdiff.mjs`, `reopencheck.mjs scripts/ink_runtime_check/missions.json`, `inkcheck.js`, `loopcheck.js`, `python3 scripts/check_door_alignment.py`.
- Browser playtests: Sonnet only, keyless server on **:3001** (start with `tools/playtest/start-keyless-server.sh` if down; never touch :3000). New game: `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3001 bin/rails runner tools/playtest/new-game.rb m04_critical_failure`. Then `tools/playtest/session-start.sh --headless true`, `cmd.sh`, `session-stop.sh`, `verify-run.rb` as in the `playtest-scenario` skill. Use only the checked-in scripts. Runs of 10–15 minutes, at least one mid-mission reload. Stop every session you start.
- Scratch: the session scratchpad, a subfolder named `m04-<stage>-<role>/`. Reports go into the mission folder.
