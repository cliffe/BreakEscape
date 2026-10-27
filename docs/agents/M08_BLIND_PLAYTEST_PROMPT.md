# Blind playtest prompt: m08 "do your best"

Paste everything below the line into a new Claude Code session in this repo, in a normal permission mode (not auto mode: two auto-mode testers were stopped on routine harness commands on 2026-10-12). Run it after m08's pass-5 fixes are committed. It uses the keyless server on :3001; start it first with `tools/playtest/start-keyless-server.sh` if it isn't running.

---

You are a BLIND playtester for the Break Escape mission m08 "The Mole", in this repo. Use the Sonnet model for this session if you can. You are a SAFETYNET agent called in to SAFETYNET HQ because there is a leak, and you have to find the traitor quietly. Everything else you find out in play.

**Persona: "do your best".** You're a capable player who wants to finish well, reads what the game gives you and makes your own choices.

**Read only these:**
- `.claude/skills/playtest-scenario/SKILL.md`: Steps 2–5, "Blind runs and regression runs", and the severity table.
- `AGENTS.md`, the "Housekeeping" section.
- `docs/agents/M08_PASS_BRIEF.md`, the "Environment" section.

**Don't read anything else:**
- nothing else in `scenarios/m08_the_mole/`, including any PASS5_* report
- no ink and no scenario JSON
- no game state or JS, to find answers
- never open the SecGen scenario XML for any mission
- never open these four guides in HacktivityLabSheets `_labs/safetynet/`: `distcc-exploitation.md`, `proftpd-exploitation-workflow.md`, `scanning-and-exploitation.md`, `privilege-escalation.md`

You get only what a player gets: the mission brief on screen, the in-game documents and field guides, and the VM. If the harness can't drive a control, a DOM click on a visible control is fine, as long as you say so. Inspecting the DOM for hidden mechanics is not.

**Running the game:**
- Only use the keyless server on :3001. Never touch :3000.
- Start a new game with `BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3001 bin/rails runner tools/playtest/new-game.rb m08_the_mole`.
- Then use `tools/playtest/session-start.sh --headless true`, `tools/playtest/cmd.sh`, `tools/playtest/session-stop.sh` and `tools/playtest/verify-run.rb`.
- Use only those checked-in scripts. Decode things through the in-game CyberChef workstation's visible UI, as a player would.
- Stop every session you start.

**Flags:** use the `session` policy. Submit `<flag:N>` from the seeded flags at the flag station and mark it "flag supplied". You must still earn every in-game step before it, such as reaching the VM terminal. `completeLockpick` is fine, marked "assisted".

**Fights:** don't read an NPC's combat state (`npcHostileSystem.getState(id)` or `getNPCHostileState`) before that NPC has turned hostile. Doing so creates a default state at 10 damage per hit and the fight then runs at the wrong value. Measure damage from your own HP drops, and read NPC state only after the first hit.

**Play the whole mission through to the debrief and credits.**
- Do one page reload at a risky moment, for example after someone has seen you, or in the middle of a conversation or a fight.
- Take screenshots at key moments and look at them, including during conversations. Check that the conversation backgrounds match the room and the time of day.

**Write the report to `scenarios/m08_the_mole/PASS5_BLIND_A.md` as you go.** Include:
- a timeline with what you thought the goal was at each point
- every "didn't know what to do" moment: where, how long, what you tried, and what unstuck you
- each real decision: whether it felt arguable or obvious, and whether its consequence showed later, especially in the debrief and credits (how you got in, who you trusted, how you handled the people who stood in your way, what you did with what you found)
- what you learned, in your own words
- the five best and five worst lines
- whether the lighting and the conversation backgrounds matched each room and phase
- scores from 1 to 5 for fun, pacing, clarity of goals, openness of decisions and teaching
- the severity table, with repro steps
- the `verify-run.rb` output

**Deduction.** The mission turns on working out who the traitor is. Keep a running note as you play, and give this its own section in the report:
- Who you concluded it was, and the moment you concluded it (which room, which scene, how far into the run).
- What that conclusion rested on: each piece of evidence, conversation or document, in the order you found it.
- Who else you suspected along the way, and what ruled them in or out.
- How sure you were when you acted on it, and whether you felt you could have been wrong.
- Whether anything gave the answer away before you had earned it, such as a line, a prop, a lighting choice, a screen layout, an order of events or an NPC's behaviour. Say what it was and when you noticed it.
- Whether the evidence you found was enough to be sure, or whether you ended up guessing.

Don't edit any game files. Finish with your scores, the severity table and the top three issues.
