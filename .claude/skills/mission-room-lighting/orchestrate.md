You are the orchestrator for a lighting pass on three Break Escape scenarios: m02_ransomed_trust, sis01_healthcare and sis02_energy. Plan, task subagents, review their work and decide. Do small mechanical edits yourself; hand anything larger to a subagent.

Read these before anything else:

- AGENTS.md: the mission loop, model choice, what to decide without asking, standing rules, verification, housekeeping.
- docs/agents/LIGHTING_LOG.md: how the lighting system works, decisions so far, known limits.
- .claude/skills/mission-room-lighting/SKILL.md: the method. Every designer and implementer follows it.
- The comment block at the top of public/break_escape/js/systems/lighting.js: the config reference.

Where things stand

- Lighting is committed (de79df45, 9c7feaba, 945714d5). m02 is lit as a night shift. sis01 and sis02 have no lighting yet.
- `ruby scripts/lighting_lookup.rb scenarios/<mission>` shows each room's type, whether people are in it, and what other missions did with the same room type. sis01 reuses m02's hospital maps (ward, IT office, meeting room), so its lookup will show m02's settings.
- `tools/playtest/lighting-tour.sh <mission> <out_dir>` screenshots every room, dark and lit, on the keyless :3001 server.

Kind of game and aim (put these in every subagent prompt)

- m02 is a SAFETYNET spy-thriller mission. Lighting should add tension and atmosphere: dark corridors that light up as you walk in, a server room that glows.
- sis01 and sis02 are Security-Informed Safety serious games. Education comes first, they are often played by student teams, and there is no spy framing. Lighting should make the setting feel real (a hospital at the hour the incident happens, a battery storage site and its control room) and must never hide information a decision depends on, or make a room harder to read. Moderate atmosphere; no horror.
- Work out each mission's time of day and mood from its brief, opening and information pack, not from guesses.

The loop, per mission

1. Design (Opus). Run the skill's steps 1–4. Write scenarios//LIGHTING_PLAN.md section by section with Edit: the mood and its source, each room's mode and why, settings reused from other missions, new light sources needed, and what the player should see on entering each room.
2. Review (a fresh Opus agent, read-only). Check the plan against the code, the lookup output and the game kind. Tag findings blocker, major or minor, citing file:line. The designer, resumed so it keeps its context, folds them in. Record findings you reject as "withdrawn" with the reason.
3. Implement (Sonnet for scenario config; Opus for anything in lighting.js). Then run the validator (`--skip-ink --no-graph`) and the lighting tour.
4. Visual review (a fresh Opus agent each round, read-only). It looks at every tour screenshot itself, judges them against the plan and the skill's step 5 checklist, and lists what to improve, most important first.
5. Improve, in rounds: send the findings back to the implementer, re-render and run a fresh visual review. Run at least two improvement rounds, even if a reviewer calls the first one clean, and at most four. After round two, stop as soon as a review finds nothing above minor. If round four still has major findings, stop anyway and list them for the user.
6. Browser check (Sonnet, about 10 minutes, on :3001). Walk the opening and the first few rooms of the real route. Check that every motion room strikes on entry, rooms with people start lit, the torch works, talk icons and markers stay readable, and nothing the player must find or read is lost in the dark. Include one page reload. Pass `--headless` if the machine's load is above about 10.
7. Commit the mission on its own once it's clean. Commit any engine change separately, before the missions that need it. No attribution lines in commits.

Order and parallelism

- Start the m02 review and the sis02 design together.
- m02 is the reference lighting. Treat its round as "review and improve": the known limits in the log (light crossing side walls, LEDs drawing over NPCs) are fair game.
- Run sis01 after m02's hospital rooms settle, so it reuses them through the lookup.
- Don't throttle agents. Give each one its own scratch subfolder under the session scratchpad (-/), and give the full scratchpad path.

Decide yourself (log each decision in one line with its reason, in docs/agents/LIGHTING_LOG.md under a dated heading per mission)

- room modes, mood colours, flicker placement and extra lights;
- adding sprites to the light-source list in lighting.js and tuning inside lighting.js. These are pre-approved for this pass; check one other lit mission still looks right after any change.

Put these in the mission's DECISIONS_PENDING.md and ask the user, through the question tool with checkbox options

- changes outside lighting.js and the scenario files: new scenario actions such as set_lighting or light switches, other engine systems, shared minigames;
- any image generation;
- any change to ink or spoken lines (lighting shouldn't need any).

Rules

- Flash safety: no more than three flashes a second, and reduced motion must stay respected. Never make a puzzle or decision depend on lighting; players can turn it off.
- Draft runs go to :3001 only. Never stop or restart :3000.
- Never use git stash, git checkout -- or git reset. Other work may be uncommitted in the tree, such as lab_tesseract_trials and app/models/break_escape/mission.rb; leave it alone.
- Check that every claimed fix actually happened, by grepping or by looking at the screenshot yourself.
- UK English, plain writing.
- Update docs/agents/RESUME.md after each significant step.

Report back to the user

- Per mission: what changed, how many improvement rounds ran and why it stopped, a before-and-after contact sheet path for a dark room and a lit room, the browser check result with its session log path, and the commit hash.
- Anything left pending, and a short assumptions list.
