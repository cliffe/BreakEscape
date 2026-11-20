# SIS scenario improvement playbook

How sis01_healthcare was taken from a first draft to a reviewed, playtested, fully cast serious game (October 2026), written so sis02_energy and sis03_cyber_insurance can follow the same path. Read `AGENTS.md` first; this file adds what is specific to the SIS games.

## What the SIS games are

They are standalone CyBOK Security-Informed Safety serious games, **not** part of the m01–m08 spy campaign. There is no SAFETYNET, no handler banter and no combat: `"disableAttacks": true` is set for sis01–03. Students play them, sometimes as 4–6 players split into IT and operational roles, to practise and then reflect on:
- risk management;
- safety cases (claim, argument, evidence);
- incident response;
- the sector's regulation.

Every reviewer and writer prompt must carry this framing, or agents fall back on the spy-campaign voice.

The source of truth for facts is the scenario's `information_pack.md`. The lab sheet `labsheet.md` sets out what the game must give students to reflect on. Both are published as byte-identical copies in `HacktivityLabSheets/_labs/security_informed_safety/`, front matter included. Edit the BreakEscape copy, `cp` it across, and confirm with `cmp`.

## Phases (in the order that worked)

### 1. Rooms and props
- Put the scenario on maps that suit its setting, and land every object on a real fixture (`position: "as-type:X"`; see `.claude/skills/mission-room-dressing/SKILL.md`).
- Check NPC positions and patrol points against furniture, and doors against furniture. sis01 dropped the player inside a filing cabinet.
- If a map is shared with a campaign mission, differentiate them with props that only one scenario claims, on conditional layers. Keep the other mission's slot audit identical.
- Run a browser layout playtest with screenshots.

### 2. Dialogue review, round 1 (Opus, review only)
- Use the `npc-dialog-review` skill with the serious-game framing. Judge teaching value (decisions over lectures), factual and regulatory accuracy against the information pack, credible professional voices, and structure (dead variables, crashes, conflicting facts).
- sis01's first review found 6 blockers, 37 majors and 24 minors. Expect similar.

### 3. Batch the user's decisions
Ask once, with checkbox options and the recommended option first. sis01 needed decisions on:
- the attack story (raised minimum);
- who does the safety-critical task;
- regulatory scope;
- where a misconception belongs (an NPC's arguable view rather than a game rule);
- whether to add new decision scenes;
- naming;
- risk-management beats.

Record the decisions at the top of the review file.

### 4. Fix pass (Opus)
- Rewrite the ink, add the decision scenes, and make the information pack, lab sheet and `mission.json` tell one story.
- Make minigames data-driven rather than hard-coding sis01 values.
- Use tagdiff against HEAD, keep a list of spoken lines changed, and run the static checks.

### 5. Review and playtest loop
- Run a fresh script-editor review and a Sonnet browser playtest side by side, and send both sets of findings to the same fixer.
- Repeat with short confirmation runs until clean. sis01 took four rounds.

### 6. Lab sheet
Write reflection sections on risk management, incident response and security-informed safety. Each has questions and exercises that produce something to hand in. Use the game's own facts, and apply the HacktivityLabSheets highlighting guide (`_labs/example_highlighting_guide.md`):
- `> Question:` blocks for questions;
- `> Action:` blocks for exercises;
- `==action:==` for getting-started steps;
- `{#anchors}` on headings.

### 7. Cast (`CAST_DESIGN.md`)
- Give each character a look, attire for their role, and an accent that fits the name and the setting.
- Gemini concepts go to the user for approval before any PixelLab spend. Then PixelLab busts, picked by the user (radio question per character).
- Then the talk sheet, visemes, walk character with the six animations, QA fixes and import (`pixellab-character-pipeline` skill). Patients or static NPCs get hand-painted sprites instead of walk characters.
- Make hand fixes before the talk and viseme stages, because those stages read the picked bust in `tmp/pixellab/<key>/bust/`.
- Wire `spriteSheet`, `spriteTalk` and `spriteVisemes`, then check in game.

### 8. Dialogue review, round 2 (Opus, fresh)
Teaching value plus natural spoken dialogue. The lines are voiced by TTS in each NPC's accent, so read every line as that person would say it. Look for:
- shared greetings;
- repeated morals;
- definitions in clinicians' mouths;
- names TTS mispronounces ("Priya S.", "m.blake");
- voice clashes;
- lab-sheet questions with no moment in play to point to.

Then the same fix, playtest and confirmation loop as phase 5.

### 9. Audio
Do this last, after the user approves the cost. The TTS cache key includes the voice style, so any voice change re-voices that character.

## Lessons from sis01 (check these early on sis02)

- **Mission conclusion.** The scenario needs an aim with `"missionConclusion": true` and a `concludeRequires`, or the credits never roll. The engine now saves before concluding, so a gate on a global is fine.
- **One cutscene per event.** Two person-chat cutscenes on the same event cut each other off. Use one cutscene; the other NPCs get a bark plus a pending scene played on the next talk. Event-opened conversations now keep the NPC's story state (engine).
- **Pending scenes check state when they play.** A late player otherwise meets stale or stacked scenes ("next is the restore" after the restore).
- **NPCs in rooms not yet loaded** don't hear events, and the validator now warns. Relay lasting effects through a start-room NPC, or catch up on `room_entered:<own room>`. Mark harmless cases `"fireOnlyWhenLoaded": true`.
- **Debrief lines must be gated** on what the player actually did and heard. sis01's debrief once quoted scenes the player never saw and judged decisions the player never made.
- **Pick one version of the story.** Contradictory facts creep in across the pack, ink, minigame data, documents and credits (sis01 had five drug-dose stories). One person should own the facts, and every round should search for each figure.
- **Characters must be where the narration says.** Move them with `patrolOverride` / `goToAndStay`. A nurse's override isn't saved across a reload yet (engine item).
- **Natural speech.** No textbook definitions or policy-speak from clinicians. Give each character their own greeting. One person delivers each moral.
- **PixelLab budget.** Check `python3 tools/pixellab_pipeline.py balance`, which shows generations *remaining*. A full walking character with lip sync costs about 125 generations, and a patient or bust-only character about 50. Ask before spending.

## sis02 specifics to settle first

- **Setting:** Albion Energy Storage, a 200 MWh lithium-ion battery facility in the East Midlands. The topics are SCADA/OT, IEC 62443, NIS for operators of essential services, and thermal runaway. Read its `information_pack.md`, `labsheet.md`, `TODO.md` and `planning_notes/sis_scenarios/case_2_energy_*`.
- **Rooms:** check which maps it uses (e.g. `scada_control_room`, `battery_hall_1`). There is no campaign map to borrow, so props or maps may be new work. `analog_thermometer` uses `spriteVariants`, which the validator doesn't know.
- **Lab sheet:** the published copies are probably stale in the same way sis01's were. Sync them with the same front-matter and highlighting treatment.
- **Cast:** a new `CAST_DESIGN.md` for an East Midlands site.
- **sis03:** it follows on from sis02's incident (Meridian Cyber Insurance claims team, T+48 hours), so keep facts consistent between the two.
