# m08 office life: plan-phase handover

Branch `plan/ol-m08` (worktree `.claude/worktrees/p-ol-m08`), base main `a5b0c4a96`. The first agent stopped at the context limit during Stage 1 (analysis). Nothing is built. No server was started.

## Done (Stage 0, saved in this folder)

- `validator_info_lines.txt`: validator 0 errors, 4 warnings on the base (two onceOnly overlap warnings on `agent_0x99` and `closing_debrief`, a cutscene without onceOnly at `interrogation_room/npcs[0]/eventMappings[1]`, the acknowledged `suite_code` clue). One info line (legacy desk boxes in all nine maps).
- `v1_summary_base.txt`: full `--office-summary` output (same format as m03's); V1 lists 12 NPCs, none with needs.
- `baseline_locks.json`: 8 lock nodes, 0 gates.
- Not yet done: the V6 rake (`app:break_escape:tts:office_lines[m08_the_mole]` with the env in `references/measurement-recipes.md` section 1) and `BASELINE.md`. Base scenario keys: no `gameClock`, no `disableAttacks`, no `officePresets`, no `roomTone`; start room `main_lobby`.

## Findings that shape the plan (Stage 1 so far)

1. **m08 is set at night, not by day.** The brief's "HQ by day, staff at desks" premise is wrong. Evidence: `ink/m08_receptionist_ai.ink:17` ("How may I help you tonight"), `ink/m08_background_analyst.ink:13` ("six times tonight"), `LIGHTING_PLAN.md:13` (night-shift ambient), Netherton and HaX lines throughout. The skill's rule for night is "a thinning office (a cleaner, one late worker) or nothing".
2. **The text already freezes the building.** The analyst refuses to leave her desk: "If I leave this desk, somebody writes down that I left this desk. I'll stay." (`m08_background_analyst.ink`). "Everyone's watching the door." ATHENA: "I log everything now." Staff wandering to coffee would contradict this.
3. **Facilities is a plot entity.** Badge audit (`scenario.json.erb:2027`) lists `0x61 FACILITIES` on the crypto lab door (IN 08:12, OUT 08:58); the USB print's `fingerprintCandidates` include "Facilities" (`:2554`); ATHENA's archives hint is "facilities spend most of the night near the kettle" (`m08_receptionist_ai.ink:31`), which points at the post-it, not a person. A facilities or cleaner NPC would become a fourth apparent suspect and turn the hint into "talk to them". Do not add one.
4. **Break room is crowded with mechanics.** The post-it with the archives password and badge PIN is on the coffee machine (`:2426` to `:2434`); three suspect lockers; the off-duty agent's LOS witness (`lockpick_used_in_view`, `:2411` to `:2414`) feeds the tip-off chain (`locker_seen_picked` to `nightshade_tipped_off`, HaX mappings `:1165` to `:1216`); HaX in person sits with a cold coffee (fixed by text). A needs NPC at the espresso machine would stand over the post-it, and extra bodies blur who saw the player at the lockers.
5. **Cast classes (all existing NPCs get no needs).** Suspects `agent_vector` (ops floor), `agent_phantom` (intel), `agent_nightshade` (crypto lab): plot-located. `director_netherton`: story-critical (brief, card clone). `background_agent` (break room): witness with LOS and testimony, fixed by text ("I'm sitting where I can see the door"). `background_analyst` (ops floor): fixed by text (won't leave her desk). `agent_0x99_person`: fixed by text. ATHENA records, `closing_debrief`, `nightshade_confrontation`, `opening_briefing_cutscene`, phone `agent_0x99`: cutscene, phone or several records of one character: never.
6. **Machines in the Tiled maps** (`public/break_escape/assets/rooms/room_hq_*.json`): break room `qdc_espresso1`, `kettle1`, `drinks_vending1`, `leather_sofa1`; ops floor `water_cooler1`, `photocopier1`; crypto lab `shredder1`; lobby `leather_sofa1`, `club_chair_e1`. None is declared. Room types are all custom `room_hq_*`, so room tone would need `roomToneTypes` (profiles: office, reception, it, quiet_office, meeting, kitchen, server in `js/data/room-tones.json`).
7. **Preset side effects if `officePresets: true`:** `nightshade_desk` (type `pc`, no `lockType`) and `cyberchef_workstation` (type `workstation`, not takeable) would gain the `desk_pc` preset. Opt out per object with `"affordance": false` (`js/systems/office-presets.js:51`), or leave presets off and author affordances directly.

## Direction the first agent was heading towards (not yet tested against a plan review)

Answer to the brief's question: a busier office **distracts** from this mole hunt. The puzzle is a closed list of three names in a frightened, still building; new walking, talking faces read as extra suspects, chatter competes with the off-duty agent's testimony, and bodies in the break room collide with the post-it, lockers and witness LOS. The immersion the mission wants is "being watched in a quiet building", which the existing text already sells.

Candidate tier: **0 to low 1**, to be decided in PLAN.md:
- Leave the break room, crypto lab, interrogation room, intel, director's office, archives and server room alone (each reason above).
- Possible small additions to weigh: room tone (night beds: server ventilation, a quiet ops floor, kitchen hum in the break room) via `roomTone` and `roomToneTypes`, no people, no lines; and at most one night-shift ambient on the ops floor (cooler and copier, leashed to the ops floor, awareness-course cast per D53) only if the plan can show it adds to the watched feeling without becoming a suspect. A lone NPC has no chatter, so that one adds movement and sound only. The first agent leaned towards room tone only, plus the lone ops-floor watch officer as an optional user pick.

## Next steps for the fresh agent

1. V6 rake and `BASELINE.md` (Stage 0 leftovers).
2. `ANALYSIS.md` from the findings above (cast table with file:line, rooms and machines, secrets list, tier paragraph).
3. `PLAN.md` in m02/m03 section order (`docs/achitechture/M03_OFFICE_LIFE_PLAN.md` is the shorter worked example), with the "busier office" verdict, what is left alone and why, open user questions (correct the day/night premise; room tone yes/no; the optional ops-floor watch officer and which awareness cast member; any art), spoken lines with a clip count (likely 0 for room tone only), and a build-size estimate.
4. `SPOKEN_LINES.md` (possibly empty) and `DIALOGUE_SAMPLE.md` only if lines are planned.
5. Commit with explicit paths; the five plan-review rounds are for the orchestrator.

## Second agent (2026-11-17)

- Stage 0 finished: V6 rake gave 0 clips (run with `bundle exec rake`; there is no `bin/rake`); `BASELINE.md` written.
- Checked: no room authors `ambientSound`, so the base has no room sound; `office_ambient` is air handling only (no murmur), `kitchen_tone` a fridge hum; typing loops need a `work` need, so none would play; profile beds do not bleed between rooms. Room tone with `roomToneTypes` adds no globals, objects or lines.
- Proposed mapping: lobby, director, intel `quiet_office`; ops floor and crypto lab `it`; server room `server`; break room `kitchen`; archives and interrogation unmapped (silent). Lobby avoids `reception` so no distant-phone spots ring at night.
- Writing `ANALYSIS.md` was refused by a tool guard ("Subagents should return findings as text, not write report files"). The analysis and plan content went to the orchestrator in the hand-back instead; `ANALYSIS.md`, `PLAN.md` and `SPOKEN_LINES.md` are not yet in this folder.

## Gotchas met

- The validator regenerates `dungeon_graph.*` on every run; on this base they came out unchanged (check `git status` before committing).
- Render the scenario to JSON with `RBENV_VERSION=2.7.8 ruby -rjson -rerb -rbase64 -e 'require "./lib/break_escape/scenario_binding"; ...BreakEscape::ScenarioBinding.render(File.read(path), {})'` from the worktree root.
- Room maps live under `public/break_escape/assets/rooms/`, not `assets/rooms/`.
