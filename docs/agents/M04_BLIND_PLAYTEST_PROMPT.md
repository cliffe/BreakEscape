# Blind playtest prompt: m04 "do your best"

Paste everything below the line into a new Claude Code session in this repo, in a normal permission mode (not auto mode: two auto-mode testers were stopped on routine harness commands on 2026-10-12). Run it after m04's pass-5 stages are committed (2026-10-13). It uses the keyless server on :3001; start it first with `tools/playtest/start-keyless-server.sh` if it isn't running.

---

You are a BLIND playtester for the Break Escape mission m04 "Critical Failure", in this repo. Use the Sonnet model for this session if you can.

**Persona: "do your best".** You're a capable player who wants to finish well, reads what the game gives you and makes your own choices.

**Read only these:**
- `.claude/skills/playtest-scenario/SKILL.md`: Steps 2–5, "Blind runs and regression runs", and the severity table.
- `AGENTS.md`, the "Housekeeping" section.
- `docs/agents/M04_PASS_BRIEF.md`, the "Environment" section.

**Don't read anything else:**
- nothing else in `scenarios/m04_critical_failure/`, including any PASS5_* report
- no ink and no scenario JSON
- no game state or JS, to find answers

You get only what a player gets: the mission brief on screen, the in-game documents and field guides, and the VM. If the harness can't drive a control, a DOM click on a visible control is fine, as long as you say so. Inspecting the DOM for hidden mechanics is not.

**Running the game:**
- Only use the keyless server on :3001. Never touch :3000.
- Start a new game with `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3001 bin/rails runner tools/playtest/new-game.rb m04_critical_failure`.
- Then use `tools/playtest/session-start.sh --headless true`, `tools/playtest/cmd.sh`, `tools/playtest/session-stop.sh` and `tools/playtest/verify-run.rb`.
- Use only those checked-in scripts. Decode things through the in-game CyberChef workstation's visible UI, as a player would.

**Flags:** use the `session` policy. Submit `<flag:N>` from the seeded flags at the flag station and mark it "flag supplied". You must still earn every in-game step before it, such as reaching the VM terminal. `completeLockpick` is fine, marked "assisted".

**Play the whole mission through to the debrief and credits.**
- Do one page reload at a risky moment, for example after an operative has seen you, or while the clock is running.
- Take screenshots at key moments and look at them, including during conversations. Check that the conversation backgrounds match the room and the time of day.

**Write the report to `scenarios/m04_critical_failure/PASS5_BLIND_A.md` as you go.** Include:
- a timeline with what you thought the goal was at each point
- every "didn't know what to do" moment: where, how long, what you tried, and what unstuck you
- each real decision: whether it felt arguable or obvious, and whether its consequence showed later, especially in the debrief and credits (whether to warn the night crew, how you handled Vance and the operatives, Voltage)
- what you learned, in your own words
- the five best and five worst lines
- whether the night lighting and the conversation backgrounds matched each room and phase
- scores from 1 to 5 for fun, pacing, clarity of goals, openness of decisions and teaching
- the severity table, with repro steps
- the `verify-run.rb` output

Don't edit any game files. Finish with your scores, the severity table and the top three issues.
