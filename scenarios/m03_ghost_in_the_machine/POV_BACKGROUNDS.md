# m03 Ghost in the Machine: POV chat backgrounds

Stage 5 of `docs/agents/M03_PASS2_BRIEF.md`. Skill: `.claude/skills/room-pov-background/SKILL.md`. Started 2026-10-12, after room dressing (cycle 5) and lighting (cycle 4) were committed (6f23b707).

Scratch (lost at session end; approved files get copied into `public/`): `<session scratchpad>/m03-pov/<room_id>/`.

## 1. Who talks where, and when

Night is `globalVars.clone_call_done === true`, the same switch the lighting variants use (`LIGHTING_PLAN.md` section 2). Ffion's and Terry's ink branch on `mission_phase == "act2_infiltration"`, which flips at the clone while the player is still in the conference room; reception and the executive wing are only reached through the main hallway, where the night scene plays first, so in practice both switches agree there.

| Room (map) | Conversations that use the room's background | Day | Night | Pins that win over `chatBackground` |
|---|---|---|---|---|
| reception_lobby (`room_zds_reception`) | Ffion Rees, at 75% across, feet about 3 m out, standing on the floor right of the counter (`scenario.json.erb:632`) | yes (first scene of the mission) | yes (`m03_npc_ffion_rees.ink:36`, 151) | opening briefing and its HQ cast pin `hq1.png` (`:586`); fine |
| conference_room_01 (`room_zds_conference`) | Victoria Sterling at (5, 4), 50% across; the night confrontation also happens here ("the light's still on in the conference room", `m03_npc_victoria.ink:724`) | yes | yes | none |
| executive_wing_hallway (`room_zds_hall_exec`) | Terry Mott, patrolling (6,3) → (3,4) → (5,3), i.e. 30-60% across (`:1539`, patrol at `:1562`) | yes ("Afternoon. Executive wing's staff only") | yes, with his torch | his lockpick-catch mapping pins `background1.png`, a generic purple circuit board (`:1587`), so every catch scene, day or night, shows that instead of the corridor. Recommend dropping the pin (orchestrator/user call; not changed) |
| danny_office (`room_zds_office`) | Danny Foster at (6.5, 4), 65% across (`:1760`) | no (hidden until night) | yes, dark, lamp only | none |
| executive_office (`room_zds_ceo`) | none (Victoria never comes here; only a `room_entered` flag, `:1191`) | can be picked by day | usually reached at night | n/a |
| server_room (`room_zds_servers`) | none (no NPCs; RFID-locked to Sterling's card, so night only) | no | yes | n/a |
| main_hallway (`room_zds_hall`) | none: the night scene is a narrator scene pinned to `background1.png` (`:1230`) | walked through | walked through | `night_transition` pins `background1.png` |

## 2. Plan: which backgrounds, day and night

Every room gets one (skill, section 0). Rooms with conversations first, ranked by person-chat lines: Terry 663, Victoria 825, Ffion 366, Danny 149 ink lines.

| Room | Backgrounds | Why | Gemini (est.) |
|---|---|---|---|
| reception_lobby | **day** (bright cool white lobby, near full brightness) and **night** (relight of the day concept: dim blue-grey `#545c70`, ceiling panels off, the counter's cyan strip glowing, a warm concealed cove wash at the top of the slat wall, one cool pool over the counter) | Ffion is talked to in both halves and the lighting variant changes the room a lot | 2-3 + 1 relight |
| conference_room_01 | **day** (afternoon, lights on, daylight behind the blinds) and **night** (relight: lights still on, dark behind the closed blinds) | Lighting is the same both halves, but the back wall has two windows, and the night confrontation is a key scene | 2-3 + 1 relight |
| executive_wing_hallway | **day** (warm `#bcb6ae`, quiet end of the building) and **night** (dark blue `#343a50`, one low warm pool by the console). Terry walks 30-60% across, so check whether one room-wide view suits him; if his west dwell (30%) puts the wrong wall behind him, add a `_left` view by x | Terry talks in both halves | 2-3 + 1 relight (+1 outpaint if a left view is needed) |
| danny_office | **night only** (dark, his desk lamp's warm pool over the desk, PC glow, rack LEDs, window dark) | He appears only at night | 2-3 |
| executive_office | one, **lit** (tubes struck, desk lamp on, display cabinets glowing; window dark, since it is mostly entered at night) | No conversation today; drawn lit as the skill says (someone has walked in) | 2 |
| server_room | one, **night, lit after the strike** (cool, racks and marketplace board glowing) | Only reachable at night | 2 |
| main_hallway | one, **day, lit** | No conversation uses it; lit is the skill default and matches the afternoon walk-through | 2 |

Total estimate: about 17-22 Gemini calls and 10 PixelLab conversions (one per final image).

### How the night versions get shown

**Decided 2026-10-12 (user): option 1, a `condition` on views. Implemented; see section 4.**

#### Options considered

`chatBackground` today is a path or a list of views by the NPC's x (`public/break_escape/js/minigames/person-chat/person-chat-background.js`). Nothing in it can follow the time of day, and an NPC-level `chatBackground` is fixed too. Options:

1. **Recommended: a `condition` on views** (engine, needs approval). `pickRoomBackground` skips views whose `condition` is false against `globalVars`, the same pattern as the lighting `variants`. About 10 lines plus a node test and a validator check. Wiring then reads:
   ```json
   "chatBackground": [
     { "condition": "globalVars.clone_call_done === true", "image": "assets/backgrounds/rooms/m03_reception_lobby_night_blended.png" },
     { "image": "assets/backgrounds/rooms/m03_reception_lobby_blended.png" }
   ]
   ```
2. **Mission-local: `Background[...]` lines in the ink** at the top of Ffion's, Terry's and Victoria's night branches. No engine change and no spoken text changes, but the day background shows for a moment before the first line switches it, and each conversation entry point that can open at night needs the line (several hubs and re-entries).

Danny's office, the server room and the CEO office need no switch (one image each). Wiring waits for the user's sign-off on the reception style and the orchestrator's choice of option.

### Tooling note

`pov_prep.py`'s NPC list misreads NPCs that have `puzzle_graph_actions`: it lists the action id with "position not set" (Ffion as `clone_reception_badge_talk`, Victoria as `confront_victoria`). Their real positions are taken from the scenario above. Not fixed (shared tool).

## 3. Progress

Working files are kept in the repo at `build_evidence/pov/<room>/`; approved ones are copied to `public/break_escape/assets/backgrounds/rooms/`.

| Room | Concept | 400px | Blended | Preview | Status |
|---|---|---|---|---|---|
| reception_lobby (day) | `m03_reception_lobby_nonpixelart.png` | `m03_reception_lobby.png` (s500, seed 42) | `m03_reception_lobby_blended.png` | `m03_reception_lobby_preview.png` | signed off by the user 2026-10-12; in `public/`, wired |
| reception_lobby (night) | `m03_reception_lobby_night_nonpixelart.png` | `m03_reception_lobby_night.png` (s600, seed 42, one letter fixed by hand) | `m03_reception_lobby_night_blended.png` | `m03_reception_lobby_night_preview.png` | signed off 2026-10-12; in `public/`, wired (night view) |

Side-by-side with the tour shots: `build_evidence/pov/reception_lobby/reception_compare.png` (top row day, bottom row night: tour shot, concept, 400px, blended).

### reception_lobby log

- Gemini 1, generation from the back-wall strip (`pro`, conversation `m03-reception-pov`): matched the map first time. Back wall in order (door, trophy cabinet, slat wall with WHITEHAT sign, plaque, CCTV), black counter with cyan strip standing off the wall, brochure rack on the left, extinguisher and coffee table on the right, floor logo. Faults: the north door sits on the left side wall near the back corner instead of in the back wall (known Gemini limit; behind the player's portrait in the chat, accepted); the directory sign is large; the cyan skirting line also runs along the side walls; a fire bell and an exit sign were added on the right wall (small, accepted). Haze too faint.
- Gemini 2, daytime relight: strong shafts but greyed the walls and put a grey cloud over the counter. Rejected.
- Gemini 3, daytime relight re-worded ("must stay bright ... never grey", thin bright haze): bright walls kept, visible shafts onto the counter and the floor by the extinguisher. **Day concept.**
- Gemini 4, night relight of generation 1 (not of a relight, per the skill): panels off as pale panels, blue-grey dim room, cyan strips glowing, orange-gold cove wash at the top of the slats, one cool downlight over the counter. Colours held. **Night concept.**
- Behind Ffion (75% across, right of the counter): the NPC-speaking crop shows the WHITEHAT sign and the counter's right end to her left, the plaque, call point and extinguisher behind her, which is what stands round her in the map. No view by x needed. The night cove glow sits above the crop, so in the chat the night version reads as night through the dim walls and the glowing cyan strips.
- PixelLab: day s500 clean. Night s500 and s600 turned the sign into "UNITCHAT"/"WAITEHAT", seed 7 into "WHITCHAT"; took s600 seed 42 and repainted two pixels of the second letter (the A's apex) so it reads WHITEHAT, matching the day file's letter shape. No haze blotches in either.

Calls used: Gemini 4 (1 generation, 3 edits), PixelLab 4.

## 4. Engine: conditional chatBackground views (2026-10-12, user-approved)

Not committed (the orchestrator commits engine changes separately, before the mission).

- `public/break_escape/js/minigames/person-chat/person-chat-background.js`: a view may carry `condition` (globalVars syntax, evaluated with `evaluateGlobalCondition` from `utils/conditional-text.js`, as the lighting variants do). Views whose condition is false are dropped before the x match, so the fallback is the first view whose condition holds. A condition that throws counts as false. `personChatBackgroundFor` passes `window.gameState.globalVariables`. Plain paths and x-only lists behave exactly as before.
- `test/js/person-chat-background.test.mjs`: loads the module with its new import (temp copy, as the lighting test does); five new tests (day/night pick, condition + x, unconditional lists unchanged, all views false, live globals read by `personChatBackgroundFor`). 18/18 pass.
- `scripts/validate_scenario.rb`: warns when a view's `condition` isn't a `globalVars.` string, or names a global missing from `globalVariables`. Checked on a temp copy of m03 (both warnings fire); m01, m02, sis01 and lab_tesseract_trials give no chatBackground warnings.
- `README_scenario_design.md`: documents `condition` on views.
- Full node suite: 480/486. The 6 failures are in `credits-theme`, `engine-fixes-pass3`, `scada-historian-data`, `npc-ink-variables` (Victoria import) and `npc-hostility-persistence` (state sync wiring); none of them loads the files changed here (other agents' work in progress in the tree).

Browser checks (keyless :3001, `chat-background-shot.sh` and `<scratch>/m03-pov/shots/night_reload.sh`):

| Check | Result |
|---|---|
| m01 reception (x views, no condition) | `m01_reception_area_blended.png`, as before |
| m02 reception_lobby (plain path) | `m02_reception_lobby_blended.png`, as before |
| m03 Ffion by day | `m03_reception_lobby_blended.png` ("Afternoon! You'll be the three o'clock") |
| m03 night: set `clone_call_done`, sync, close the page, reopen the same game (2172) with resume, talk to Ffion | global restored `true`; `m03_reception_lobby_night_blended.png` ("Oh! You made me jump. I only came back for my charger.") |

## 5. Scenario changes (mission-local)

- `reception_lobby.chatBackground`: night view (`globalVars.clone_call_done === true`) first, then the day view.
- Terry's lockpick-catch mapping: `background1.png` pin removed (orchestrator's decision), so the catch scene uses the executive-wing background. Until that background exists the scene shows the plain frame.
