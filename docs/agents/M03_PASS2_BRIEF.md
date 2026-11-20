# m03 pass 2: shared brief for subagents (started 2026-10-12)

m03 "Ghost in the Machine" (`scenarios/m03_ghost_in_the_machine/`) closed its five-phase improvement loop on 2026-10-05 (`IMPROVEMENT_LOOP_LOG.md`). This pass brings it level with the missions that have since had art and atmosphere work (m01, m02, sis01, sis02, lab_tesseract_trials) and gives the dialogue a second round.

Read `AGENTS.md` first ("Iterating", "Making judgements without asking", "Standing user rules", "Verifying work"). It is binding.

## Kind of game and aim

A SAFETYNET campaign mission: a TV spy thriller. Tension, secrets, characters with their own agendas, sharp exchanges and reveals that land. Agent HaX is the handler, ENTROPY the enemy. The player infiltrates Zero Day Syndicate as a recruit (cover identity), clones Victoria Sterling's keycard, breaks into the server room at night, exploits the training VM (four flags, required), and links Zero Day to m02's St. Catherine's ransomware. Teaching comes through the VM work and the field guides, not lectures in dialogue. Kit is cumulative: lockpick from m01, RFID cloner introduced here.

## The VM side, at a high level (read this instead of the SecGen XML and the exploit guides)

Built from the in-game text and `mission.json` only. No commands; anything finer is "needs checking against SecGen by the user".

- **Where:** the VM terminal in the server room reaches Zero Day's isolated training network, where they rehearse the exploits they sell. Flags go in at the drop-site terminal.
- **Four flags, in story order:**
  1. **Scan** (`flag_scan_submitted`): sweep the training network and read the service banners. Teaches reconnaissance and banner grabbing.
  2. **FTP** (`flag_ftp_submitted`): an FTP service running a backdoored release (ProFTPD 1.3.3c, a supply-chain compromise with no CVE, deliberately). It's the same kind of exploit Zero Day sold for St. Catherine's.
  3. **Pricing intel** (`flag_http_submitted`): pull the pricing material off the web service and decode it (an encoding, not encryption). It shows the healthcare premium.
  4. **distcc** (`flag_distcc_submitted`): command execution through the legacy distcc daemon (CVE-2004-2687). The drop-site then prints the transaction log naming GHOST and St. Catherine's.
- **Field guides,** offered through HaX's phone hub. Refer to them by title only: RFID cloning, CyberChef, Reconnaissance and Network Mapping, ProFTPD exploitation, distcc exploitation, lockpicking.

## Stages, in order (user-approved 2026-10-12)

1. **Regression playtest** against today's engine (about 50 engine commits since m03 closed: lighting, room backgrounds, save state, aims, person-chat). Fix what breaks.
2. **Dialogue review round 2** (`npc-dialog-review`), about five full review → fix cycles. No audio exists for m03 yet, so changing spoken lines costs nothing; still keep an old → new list of spoken lines in the log.
3. **Room dressing** (`mission-room-dressing`), about five cycles. Runs alongside dialogue.
4. **Lighting** (`mission-room-lighting`), about five cycles, after dressing. m01 already lit room_office, room_reception and room_servers; reuse its settings where they fit. m03's mood: a daytime office visit, then the same building at night.
5. **POV chat backgrounds** (`room-pov-background`), after dressing and lighting are final.
6. **Characters** (`pixellab-character-pipeline`): every NPC. Scope set by the user separately.
7. **Fresh blind playtest** last.

Not in this pass (user: later): lab sheet, audio, engine triage, SecGen build/merge.

## Rules

- Write everything into the repo (`scenarios/m03_ghost_in_the_machine/`), never only into the scratchpad. Log each round in `IMPROVEMENT_LOOP_LOG.md` under "Pass 2 (2026-10-12)": a severity table with counts and each finding's outcome (fixed / withdrawn and why / deferred and why).
- Reviewers are read-only and cite file:line. Verify claims against `scenario.json.erb` and the ink, not the older design docs.
- Shared file: `scenario.json.erb` is edited by more than one stage. Use Edit with small, exact replacements and re-read the region first. Dialogue edits stay in the ink and NPC/dialogue fields; room dressing edits room layout, object placement and map files.
- Engine changes: only with the orchestrator's approval; commit engine changes separately, before mission changes. Don't commit; the orchestrator commits.
- Image generation: PixelLab is flat-rate; Gemini is metered (one image at a time, look at each). Never downscale pixel art: regenerate at the target size.
- Props square to the walls (top-down orthogonal); one or two angled props per room is fine.

## Environment (local machine)

Repo: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`.

- Validator: `ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb` (reviewers add `--skip-ink --no-graph`).
- Static checks: `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m03_ghost_in_the_machine/`, `node scripts/ink_runtime_check/tagdiff.mjs`, `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`, `python3 scripts/check_door_alignment.py`.
- Browser playtests: Sonnet only, keyless server on **:3001** (already running; never touch :3000). New game: `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3001 bin/rails runner tools/playtest/new-game.rb m03_ghost_in_the_machine`. Then `tools/playtest/session-start.sh`, `cmd.sh`, `session-stop.sh`, `verify-run.rb` as in the `playtest-scenario` skill. Runs of 10–15 minutes, at least one mid-mission reload. Skip the intro brief with Esc.
- Scratch: your session scratchpad, in a subfolder named for your role. Reports go into the mission folder.
