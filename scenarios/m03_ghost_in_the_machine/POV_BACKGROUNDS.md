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
| reception_lobby (day) r2 | `m03_reception_lobby_nonpixelart.png` | s500 seed 42 | yes | yes | **round 2 installed** (replaces the signed-off round 1, same file names) |
| reception_lobby (night) r2 | `m03_reception_lobby_night_nonpixelart.png` | s600 seed 42 | yes | yes | **round 2 installed** |
| executive_wing_hallway: day, day `_left`, night, night `_left` | 4 files | s500 (night and day `_left` at seed 7) | yes | yes | wired: night views (condition) first, split at x 0.45 |
| danny_office (night only) | yes | s500 | yes | yes | wired (single image) |
| executive_office | yes | s500 | yes | yes | wired (single image) |
| main_hallway (day) | yes | s600 | yes | yes | wired (single image) |
| conference_room_01: day, night (one view shifted 0.25 so the screen sits behind Victoria) | 2 files | s500 (night seed 7) | yes | yes | wired: night view (condition) first |
| server_room (night, lit) | yes | s600 | yes | yes | wired (single image) |

Side-by-side with the tour shots: `build_evidence/pov/reception_lobby/reception_compare.png` (top row day, bottom row night: tour shot, concept, 400px, blended).

### reception_lobby log

- Gemini 1, generation from the back-wall strip (`pro`, conversation `m03-reception-pov`): matched the map first time. Back wall in order (door, trophy cabinet, slat wall with WHITEHAT sign, plaque, CCTV), black counter with cyan strip standing off the wall, brochure rack on the left, extinguisher and coffee table on the right, floor logo. Faults: the north door sits on the left side wall near the back corner instead of in the back wall (known Gemini limit; behind the player's portrait in the chat, accepted); the directory sign is large; the cyan skirting line also runs along the side walls; a fire bell and an exit sign were added on the right wall (small, accepted). Haze too faint.
- Gemini 2, daytime relight: strong shafts but greyed the walls and put a grey cloud over the counter. Rejected.
- Gemini 3, daytime relight re-worded ("must stay bright ... never grey", thin bright haze): bright walls kept, visible shafts onto the counter and the floor by the extinguisher. **Day concept.**
- Gemini 4, night relight of generation 1 (not of a relight, per the skill): panels off as pale panels, blue-grey dim room, cyan strips glowing, orange-gold cove wash at the top of the slats, one cool downlight over the counter. Colours held. **Night concept.**
- Behind Ffion (75% across, right of the counter): the NPC-speaking crop shows the WHITEHAT sign and the counter's right end to her left, the plaque, call point and extinguisher behind her, which is what stands round her in the map. No view by x needed. The night cove glow sits above the crop, so in the chat the night version reads as night through the dim walls and the glowing cyan strips.
- PixelLab: day s500 clean. Night s500 and s600 turned the sign into "UNITCHAT"/"WAITEHAT", seed 7 into "WHITCHAT"; took s600 seed 42 and repainted two pixels of the second letter (the A's apex) so it reads WHITEHAT, matching the day file's letter shape. No haze blotches in either.

**Round 2 (2026-10-12, after the user's sign-off; coordinator asked for the known faults to be fixed).** Each change was kept only where it beat round 1 item by item. Round 1 files are in `build_evidence/pov/reception_lobby/r1/`.
- Gemini 5, fresh generation with "exactly 1 door … both side walls have no doors", a small A4 directory and only the call point on the right wall: the door still landed on the left side wall, and the counter turned into a desk with a chair and a front-facing monitor. Lost to round 1; not used.
- Gemini 6, edit of round 1 to turn the side-wall door into wall and add one in the back corner: no change (the skill's known limit: edits can't move side doors). **Door accepted as it is**: it sits behind the player's portrait.
- Gemini 7, edit of round 1: fire bell removed, directory board shrunk to A4 size, side-wall cyan line turned into plain grey skirting. All three worked; the back wall's cyan line also went (mostly hidden by the counter and Ffion's portrait) and the small exit sign stayed. **Kept** (`r2_fix1`).
- Gemini 8, edit to remove the exit sign and restore the back-wall cyan line: added a slat panel on the right wall and deleted the call point. Rejected.
- Gemini 9, daytime relight of `r2_fix1`: bright, thin shafts. **Day concept.**
- Gemini 10, night relight of `r2_fix1` with the wash running further down the slats: only slightly further. Gemini 11, an edit for a stronger, longer wash: the slats glow down past the sign, but the white walls took a beige cast. Composited in PIL: the slat panel from 11 over 10 (a feathered rectangle on the panel's straight edges), so the slats glow and the walls stay cool. **Night concept.**
- PixelLab: day s500, night s600, both seed 42; both signs read WHITEHAT with no hand fix.
- In the chat (`r2_vs_r1_previews.png`, left round 1, right round 2): the night's warm slats now show beside Ffion and in the player's crop, and the directory no longer dominates the player's half. Installed over the same file names (wiring unchanged); browser re-check: day view by day, night view after a night reload (`shots/r2day`, `shots/r2night`).
- Left as they are: the door on the side wall, a small exit sign on the right wall, no cyan line on the back wall.

Calls used for reception: Gemini 11 (2 generations, 9 edits), PixelLab 6.

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

## 6. The other six rooms (2026-10-12)

Started after the coordinator cleared each room's layout (dressing cycle 6 for four rooms, cycle 7 for the conference and server rooms). Each room's working files are in `build_evidence/pov/<room>/`, with an in-chat preview per image.

### executive_wing_hallway (Terry, day and night)
- Gemini 1: generation from the strip, worded as a short, wide corridor bay with "exactly 2 doors". Back wall in order (call point, sideboard with jug and glasses, clock, landscape painting, PRIVATE plaque, door in the back-right corner), burgundy runner on navy carpet. The west door sits at the back of the left wall, not halfway; the call point is smaller than the map's. Accepted.
- Gemini 2: daytime relight (shafts onto the runner; the runner went a little lighter). Gemini 3: night relight (panels off, cool blue dark, one downlight pool on the wall round the painting, in the band behind Terry).
- Terry patrols 30-60% across. At his post (60%) the wide view puts the painting, PRIVATE plaque and door beside him, which matches the map. For his west dwell (30%) I made `_left` views: `pov_view.py --suggest` asked for a 0.46 shift; capped at 0.40 and outpainted (Gemini 4 day, 5 night), both seamless. The NPC crop then shows the door, call point, sideboard and clock round him. The player's crop in the left views is bare side wall (accepted; edits can't add a side door).
- PixelLab: the night downlight came out as a ghost-like blob on the wall behind Terry, and the day `_left` wall had smears; seed 7 fixed both (the skill's fix).
- Wiring: `[night x 0.45-1, night_left x 0-0.45, day x 0.45-1, day_left x 0-0.45]`, so with no position known the wide view is used.

### danny_office (night only)
- Gemini 1: lit generation from the wall strip (the room has a free-standing rack). The rack stands out on the floor as in the map; whiteboard and door drifted onto the left side wall (behind the player's portrait).
- Gemini 2: night relight, lamp only: correct but flat in Danny's crop (the lamp pool is in the player's half). Gemini 3: relight from the clean generation adding cold street light through the closed blinds as slanting stripes in pale haze, plus a stronger lamp pool. Danny's crop now has the lit window, haze and striped floor. Mini fridge lost in the shadow (minor). **Kept 3.**
- Single image: Danny is only ever there at night.

### executive_office (no conversation)
- Gemini 1: one generation, lit at night (panels just struck, brass lamp, decanter glint, trophy cabinet lit, windows dark). Matches the map: bookcase, window, gold-framed portrait, window, padlocked filing cabinet, desk with blue monitor on the navy rug, two chairs with their backs to us, drinks cabinet, globe, red-framed magazine cover, trophy cabinet cut off at the bottom right. One extra chair behind the desk. No relight needed; haze already present.

### main_hallway (no conversation; day)
- Gemini 1: back wall in order with exactly 3 doors (back-right corner, one on each side wall), but an invented navy feature panel behind the threat map, and the map's land drawn red. Gemini 2: an edit removed the panel and recoloured the map (navy and teal land, red arcs). Gemini 3: daytime relight, which also brought the walls back from blue-grey to near-white (the planter turned white; minor).

### conference_room_01 (Victoria, day and night)
- Gemini 1: the table ran front to back through the middle of the room (where Victoria stands), plus an invented navy half-wall, an extra side window and brown chairs. Rejected.
- Gemini 2: regenerated leaving the table out (it sits at the near edge of the map, mostly behind the camera), with the middle floor open. Plain back wall, credenza with phone, binders and orchid, whiteboard, screen, right window, flip chart, AV panel, brass drinks trolley, door near the back-right corner. The left window moved onto the left side wall (behind the player's portrait; accepted).
- Victoria stands in front of the screen at 50% across; the room-wide image would put the window and flip chart behind her. `--suggest` gave shift 0.25; outpainted (Gemini 3), seamless. The shift pushes the door and trolley off the right edge, but the screen now sits behind her shoulder with the whiteboard and credenza to her left. This one view is the room's only image.
- Gemini 4, day relight with "warm-white daylight": dark, beige haze. Rejected. Gemini 5, re-worded (silvery, keep brightness): bright, shafts through the blinds, striped pools on the carpet. **Day.** Gemini 6, night relight: lights still on, black windows behind the blinds, haze. **Night.**
- PixelLab: night seed 42 had round haze blotches; seed 7 clean.

### server_room (night, no conversation)
- Gemini 1: one generation; the second row of racks stands out on the floor with the aisle behind it (first time, without the layered build), back wall in order with the price board and RESTRICTED sign. The camera is turned slightly left of square-on, and the operator's monitor faces sideways. Accepted for a room with no conversations.
- Gemini 2: relight for haze returned the image unchanged (pov_diff 0.0%); not repeated. PixelLab at s600 added some haze of its own. The sign reads "BESTRICTED" in the raw 400px file and RESTRICTED in the blended file the game uses.

### Browser check (keyless :3001, `<scratch>/m03-pov/shots/all_rooms.sh`, screenshots looked at)

| | Day (game 2181) | Night after a reload (game 2182) |
|---|---|---|
| Ffion | `m03_reception_lobby_blended` | `m03_reception_lobby_night_blended` |
| Victoria | `m03_conference_room_01_blended` | `m03_conference_room_01_night_blended` |
| Terry at his post (x 0.6) | `m03_executive_wing_hallway_blended` | `m03_executive_wing_hallway_night_blended` |
| Terry at his west dwell (x 0.3) | `m03_executive_wing_hallway_left_blended` | `m03_executive_wing_hallway_night_left_blended` |
| Danny | (not present) | `m03_danny_office_blended` |

Validator: no chatBackground warnings.

## 7. Calls used (whole stage so far)

| Room | Gemini | PixelLab |
|---|---|---|
| reception_lobby (rounds 1 and 2) | 11 | 6 |
| executive_wing_hallway | 5 | 6 |
| danny_office | 3 | 2 |
| executive_office | 1 | 1 |
| main_hallway | 3 | 1 |
| conference_room_01 | 6 | 3 |
| server_room | 2 | 1 |
| **Total** | **31** | **20** |

## 8. Round 3: the open items (2026-10-12, after commit 35d33ab0)

Each new version was kept only where it beat the one before, item by item. Replaced files are in each room's `r1/` folder. File names didn't change, so the wiring is untouched. Before/after in-chat previews of every changed image: `build_evidence/pov/before_after_round3.png`.

### 1. Server room: square-on camera and haze
- Gemini 1: a square-on regeneration got the camera right but pushed the second rack row back against the wall, and the padlocked filing cabinet became a two-door cabinet. Rejected.
- Gemini 2-4, the skill's layered build: an empty shell (square-on, back wall exact, padlocked cabinet, door near the camera on the right, clear shafts of haze), then the free-standing UPS and rack island as an edit (it stands out on the floor with an aisle and the hazard stripe), then the operator desk and blue monitor as an edit. The chair sits on our side of the desk (minor). **Kept.**
- PixelLab s600: the sign reads RESTRICTED in the raw 400px file and in the blended one. The old "BESTRICTED" file is gone from `public/`; it is kept only in `r1/`. The monitor has a soft glow halo (minor).

### 2. Exec hallway `_left` views: the player's half was bare wall
- The only thing the map puts on that wall is the west door, and the concept had it as a sliver in the far corner. Edits can't move doors, so I masked the far door in magenta along with the outpaint strip and outpainted the left wall with the door halfway along it, where the map has it and in the player's band (Gemini 1 day, 2 night). The corner became plain wall.
- The night outpaint dropped the red call point left of the sideboard (in Terry's band); Gemini 3 added it back. **Both kept.** PixelLab seed 7; the day file has some contour banding on the back wall, which the blend softens (minor).

### 3. Conference room: the player-side crop
- The door and trolley can't come back without un-shifting the view, and that would put the window, not the screen, behind Victoria. Instead Gemini 1 added two things true to the map to the clean shifted base: the backs of the three high-backed chairs at the far side of the boardroom table (left of centre, near the camera), and the left-wall call point, which now sits beside the player's head. Gemini 2-3 redid the day and night relights with the wording that worked before. **Kept.** In game the chair backs show either side of Victoria. PixelLab seed 7; the day file's call point lost some red (minor).

### 4. Doors on side walls
- **Danny's office (Gemini 1-3):** a regeneration worded "moderate wide-angle; the back wall fills about 70% of the frame … everything in the reference is on the back wall" put the door into the back wall's left corner and moved the whiteboard and certificates back onto the back wall, in map order. The night relight with the street-light wording put a man at the desk (from "someone is sitting in it"); an edit removed him. PixelLab seed 42 gave the lamp side a brown cast and lost the rack's LEDs; seed 7 stayed cool and kept them. **Kept:** Danny's crop now shows certificates, bookcase, window, rack and binder shelf, and the player's crop the door, whiteboard and lamp. There is one sliver of an invented door at the far right edge, under Danny's portrait.
- **Reception (Gemini 1):** the same wording kept the door on the side wall, hung the trophy cabinet on the wall, and grew the counter across Ffion's spot. Rejected. That is the third failed regeneration for this door, so I'm stopping: the door sits behind the player's portrait, and round 2's fixes would be lost.

### Browser check (keyless :3001, screenshots looked at)
Day (game 2186): Ffion, Victoria, Terry at x 0.6 and x 0.3 each get the day view. Night after a reload (game 2187): all four get the night views, and Danny gets his office. Server room (borrowed NPC): `m03_server_room_blended.png`. Validator: no chatBackground warnings.

### Calls this round
Gemini 14 (server 4, exec hallway 3, conference 3, Danny 3, reception 1), PixelLab 7. **Stage total: Gemini 45, PixelLab 27.**

### Stop
Four improvement rounds so far in this stage (reception round 1, reception round 2, the six rooms, this round), within the 10 allowed. Nothing left is above minor: reception's door on the side wall, a small exit sign on its right wall, and no back-wall cyan line; the server room chair on our side of the desk and the monitor halo; contour banding in the exec-hallway day-left pixel file; the faded call point in the conference day pixel file; an invented door sliver at the right edge of Danny's office.
