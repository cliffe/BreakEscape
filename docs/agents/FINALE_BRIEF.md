# Finale brief: m09 and m10 (Licence to Hack, Season 1 close)

Every subagent on the finale reads this first. The orchestrator keeps it current. Log: `scenarios/FINALE_DEV_LOG.md`. Items for the user: `scenarios/FINALE_DECISIONS_PENDING.md`. Resume note: `docs/agents/RESUME.md`.

## Kind of game and aim

SAFETYNET campaign missions: a TV spy thriller. Tension, secrets, characters with their own agendas, sharp exchanges, reveals that land. Agent HaX (id `agent_0x99`) is the handler, ENTROPY the enemy. VM flags are required and woven into the story. Kit is cumulative. Combat allowed. Learning comes through the VM work and field guides, not lectures in dialogue. "Fun and educational, not hard." See `AGENTS.md` "Kinds of game".

m09 and m10 close Season 1 of SAFETYNET: Licence to Hack. They are the payoff for eight missions of player choices.

## User decisions (2026-10-20)

- **No eldritch content.** The Quantum Cabal / cosmic-horror direction for game 2 is not woven into m09–m10. The universe-bible pass is skipped for this work. The only exception is possibly a few seconds right before the final end credits, as a teaser for the next game; plan a slot for it, don't depend on it.
- **Carry everything that can be carried.** Every open thread from m01–m08 and as many of the player's decisions as possible carry into m09/m10, and the player should *feel* the impact of their earlier choices: who turns up, who helps, who betrays, what's possible, what's said to them. Not a list of name-checks in a debrief.
- **Endings (F1):** the full range stays. Success, with the player choosing how it ends for Tesseract (arrest / talk him into surrender and cooperation / lethal force); Scorched Earth (both databases destroyed, Tesseract escapes in the chaos, player suspended); and the Join ENTROPY bad ending, the one non-success path, built as a deliberate, clearly signposted choice and never a trap. Earlier choices shape the cost and who is standing at the end.
- **Approved (F2–F4):** SecGen drafts for m09/m10 by a Haiku agent once stage 0 fixes the flag plan; a teaser slot before the final credits; JSON-only `exportGlobals` additions to m01–m08 (m08 has none yet).
- **VM sizes** (`finale/VM_SHAPE.md`): m01–m08 VMs have about 4 flags each. The m10 container-escape basis has only 2 flags, both at the climax, so m10's VM needs an earlier entry stage added when SecGen is drafted.
- **Follow the full staged pipeline** (`story_design/story_dev_prompts/00`–`09`), then the iterative improvement loops in `AGENTS.md` (alignment, puzzle chains, scenario design, dialogue, playtests; then dressing, lighting, POV, characters, lab sheet, audio).

## Existing plans and canon (read, don't treat as final)

- Old outline: `planning_notes/overall_story_plan/season_1_arc.md` (Mission 9 ~L806, Mission 10 ~L887), `quick_reference.md`. Written before m01–m08 were rebuilt; where it disagrees with the shipped missions or the bible, the missions and bible win.
- `planning_notes/eldritch_hacker/DIRECTION.md` "Season 1 finale": the player succeeds, stopping the Architect and a number of cells. The eldritch parts of that section are now dropped (above).
- The Architect canon: `story_design/universe_bible/04_characters/entropy/masterminds/the_architect.md` (identity section ~L33: SAFETYNET's lead suspect since m06 is Dr. Adrian Tesseract; confirmation planned for m09). m07 plants his line "Let it hurt afterwards, not during" (`scenarios/PASS4_EDITORIAL_LOG.md` ~L34, L48). Marcus Tesseract (institute founder) is Adrian's younger brother.
- Tomb Gamma: dossier in m07 (`found_tomb_gamma`), coordinates (Montana) from Nightshade in m08 (`tomb_gamma_location_known`), or not if the player put him down first.
- Carrying choices between missions: `docs/agents/CARRY_OVER_PLAN.md` and `README_scenario_design.md` "Carrying choices between missions". `importGlobals` reads from the original source mission (m10 can import from m03 directly). m01–m07 have `exportGlobals`; **m08 has none yet**.
- Finale inventory (built in phase A): `planning_notes/overall_story_plan/mission_initializations/finale/`.
- VM: candidate modules in `docs/agents/SECGEN_MODULE_PLAN.md` "Finale". No SecGen scenario exists yet for m09/m10.

## Where the work goes

- Shared finale docs: `planning_notes/overall_story_plan/mission_initializations/finale/`
- Per mission, stage outputs: `planning_notes/overall_story_plan/mission_initializations/m09_digital_archaeology/stages/stage_N/` and `.../m10_final_cipher/stages/stage_N/` (same layout as m05's). Working ids stay until stage 0 settles titles; a rename later follows the rename rule.
- Each stage folder also holds its review rounds: `REVIEW_R1.md`, `REVIEW_R2.md`, ...
- Built mission (stage 9 on): `scenarios/m09_<slug>/`, `scenarios/m10_<slug>/`.

## Stages, and the newer skill to bring to each

The story_dev_prompts are older; the skills in `.claude/skills/` encode what later passes learned. Each stage's author reads its prompt **and** the listed skill(s) and applies the skill's standards where the two differ (the skill wins). Reviewers judge against both.

| Stage | Prompt | Also apply |
|---|---|---|
| 0 Initialisation | `00_scenario_initialization.md` | `mission-alignment-plan` (m01/m02 gold standard: music, aims, HaX's progress-gated hub, stakes); `CARRY_OVER_PLAN.md`; `mission-secgen-review` only for how VM flags are woven (do not open SecGen) |
| 1–2 Narrative and storytelling | `01`, `02` | `mission-alignment-plan`; `npc-dialog-review`; `README_ink_best_practices.md`; cast diversity (below) |
| 3 Moral choices | `03` | `npc-dialog-review` ("do choices matter"); `mission-puzzle-chains` ("are the mission's own choices required"); the carry-over inventory |
| 4 Objectives | `04` | `mission-alignment-plan` (objective staging); `scenario-design-review` ("does the player always know what to do next") |
| 5 Rooms | `05` | `mission-puzzle-chains` (lock order, cumulative kit, silent-failure engine bugs); `mission-room-dressing` constraints; `README_scenario_design.md` room rules |
| 6 Lore | `06` | `scenario-design-review` (clue distribution) |
| 7 Ink | `07` | `npc-dialog-review`; `README_ink_best_practices.md`; `tools/pass2/PASS2_LESSONS.md`; dialoguelint |
| 8 Review | `08` | `scenario-design-review`, `validate-scenario`, `walkthrough-scenario` |
| 9 Assembly | `09` + `mission_initializations/STAGE_9_PROMPT_IMPROVEMENTS.md` | validator, `check_door_alignment.py`, dungeon graph; then the AGENTS.md five-phase loop |

## How a stage runs

Author (Opus) writes the stage output section by section with Edit. A fresh Opus reviewer (read-only) checks every claim against the code and earlier stages, tags findings blocker / major / minor with file:line, and gives a verdict. The author (resumed) folds them in; wrong findings are recorded as withdrawn with the reason. Minimum three rounds, up to five while blockers or majors keep appearing; the narrative stages (1–3, 7) aim for about five real improvement cycles. Milestone reviews after stages 3, 5 and 8 revisit every earlier stage for both missions together.

## Rules for every agent

- Write documents section by section with Edit, never one whole-file rewrite.
- **VM content stays at game-design level.** Say "the VM's second flag (root on the archive server)", never exploit steps, CVE detail, commands or tool usage. Do not open SecGen files or the four exploit-detail field guides. VM technical writing goes to a Haiku agent the orchestrator runs.
- Cast diversity: vary ethnicity, age and look across each mission's cast; recurring characters keep their own sprite key.
- Spoken lines: no printed variables in voiced lines. Choose between fixed strings instead.
- UK English ("Cyber Security" with a space), plain writing, no AI filler (the user's style rules in `~/.claude/CLAUDE.md` apply to everything a human will read, including dialogue).
- Don't edit other missions, `.claude/skills/*`, other repos or this brief. Don't commit. Don't `git stash`, `git checkout --` or `git reset`.
- Scratch files go only in the scratch subfolder the orchestrator gives you (full path).
- Return: what you wrote (paths), the decisions you made with one-line reasons, open questions, and anything that needs the user.
