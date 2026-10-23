# Lighting pass brief: m02, sis02, sis01, m01, lab_tesseract_trials (2026-10-08)

Every subagent on this pass reads this file first, then:

- `AGENTS.md` (repo root): standing rules, verification, housekeeping.
- `docs/agents/LIGHTING_LOG.md`: how the lighting system works, decisions so far, known limits.
- `.claude/skills/mission-room-lighting/SKILL.md`: the method. Follow it.
- The comment block at the top of `public/break_escape/js/systems/lighting.js`: the config reference.

## Kind of game and aim

- **m02_ransomed_trust** is a SAFETYNET spy-thriller mission. Lighting adds tension and atmosphere: dark corridors that light up as you walk in, a server room that glows. It is the reference lighting other missions copy, so its round is "review and improve". The known limits in the log (light crossing side walls, LEDs and glows drawing over NPCs) are fair game.
- **m01_first_contact** (added by the user mid-pass) is a SAFETYNET spy-thriller mission like m02, and the first one players see. Its audio is cached: no ink or spoken-line changes, not even tags.
- **lab_tesseract_trials** (added by the user after the pass): a lab with SAFETYNET spy framing (`docs/agents/TESSERACT_TRIALS_BRIEF.md`): a short CyberChef escape room for first-year students. Atmosphere yes, but nothing a puzzle needs may be harder to read. Other files in its folder have someone else's uncommitted edits: touch only `scenario.json.erb` and `LIGHTING_PLAN.md`, and commit by explicit path.
- **sis01_healthcare** and **sis02_energy** are Security-Informed Safety serious games. Education comes first, they are often played by student teams, and there is no spy framing. Lighting makes the setting feel real (a hospital at the hour the incident happens, a battery storage site and its control room) and must never hide information a decision depends on, or make a room harder to read. Moderate atmosphere; no horror.
- Work out each mission's time of day and mood from its brief, opening cutscene/ink and `information_pack.md`, not from guesses. Cite where you found it.

## The loop per mission

1. Design (Opus): skill steps 1–4, `scenarios/<mission>/LIGHTING_PLAN.md`, written section by section with Edit (mood and its source; each room's mode and why; settings reused from other missions; new light sources; what the player sees entering each room).
2. Review (fresh Opus, read-only): blocker / major / minor with file:line. Designer folds them in.
3. Implement (Sonnet for scenario config; Opus for lighting.js), validator `--skip-ink --no-graph`, lighting tour.
4. Visual review (fresh Opus each round, read-only): looks at every screenshot, ranks improvements.
5. Improve: 2–4 rounds. After round two, stop once nothing is above minor.
6. Browser check (Sonnet, ~10 min, :3001, one reload).
7. Commit per mission; engine first, separately.

## Rules

- **Scope.** Without asking you may change: room modes, mood colours, flicker placement, extra `lights`, the `lighting` blocks in the scenario file, and anything inside `lighting.js` (EMITTERS, tuning, fixes to known limits). After a lighting.js change, check one other lit mission still looks right. Anything else (new scenario actions such as `set_lighting` or light switches, other engine systems, shared minigames, image generation, ink or spoken lines) goes in the mission's `DECISIONS_PENDING.md` as a proposal. Don't do it.
- **Flash safety.** No more than three flashes a second. `prefers-reduced-motion` stays respected. Never make a puzzle or decision depend on lighting; players can turn it off.
- **Servers.** Draft runs use the keyless server on :3001 only. Never stop or restart :3000.
- **Git.** Never `git stash`, `git checkout -- <file>` or `git reset`. Don't commit (the orchestrator does). Other work is uncommitted in the tree (lab_tesseract_trials, app/models/break_escape/mission.rb, the user's edits to the lighting skill): leave it alone. Compare against `git show HEAD:<path>`.
- **Shared files.** Only one agent edits `lighting.js` at a time; the orchestrator says who. Re-read any shared file just before editing it.
- **Scratch.** Use only the scratch subfolder your prompt gives you, by full path. Don't create a `scratchpad/` folder in the repo.
- **Processes.** Kill any headless browser or harness process you started, by PID, before you finish. Never `pkill -f`.
- **Evidence.** Report file:line for claims and screenshot paths for visual claims. Don't report a fix you haven't checked.
- UK English, plain writing.
