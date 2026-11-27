# m08 The Mole: conversation (POV) backgrounds

Made 2026-10-16 with the `room-pov-background` skill, last in the art order (dressing closed after cycle 5, lighting closed 2026-10-14; the lobby includes the user's 2026-10-16 change with a fig on both sides, which stand behind the camera and so are out of shot). The user approved metered Gemini for this mission on 2026-10-16: whole mission, no stopping, capped at 30 calls. That approval stands in for the skill's first-room sign-off on a new setting (SAFETYNET HQ).

Inputs per room: `pov_prep.py` strip and inventory, plus `lighting-tour.sh` on keyless :3001 (game 2560; `-b` lit shots for the three motion rooms). Gemini `pro` model, a fresh conversation per room. PixelLab pixflux at strength 500, 400x400, no downscaling; seed 42 unless noted. Blended at 50% with `tools/blend_backgrounds.py`. The game uses the `_blended` files in `public/break_escape/assets/backgrounds/rooms/` (`m08_<room>_nonpixelart.png` concept, `m08_<room>.png` pixel art, `m08_<room>_blended.png`).

Mood follows `LIGHTING_PLAN.md`: night, Level Red. Ceiling panels throw light straight down and spread it evenly to both sides, with no slanting beams. Screens glow without shafts. The Director's office is the one room with `panels: false`, so it is lit by the desk-lamp pool and the laptop glow.

**Deduction rule.** No background picks out Nightshade's locker or desk. The break room's three lockers are drawn identical: same grey, blank label plates, no numbers, no stickers or tags, lit the same (the map's own stickers on 0X23 and the tag on 0X88 are left out on purpose). In the crypto lab every monitor glows at the same brightness and no desk is lit more than another.

**Interrogation suite: the pre-confrontation look** (house lights up, RECORDING lamp off, evidence wall showing three anonymous "?" cards). The confrontation scene pins `assets/backgrounds/hq2.png` on its event mapping, so this room background never shows during the confrontation. It shows only when the player talks to Nightshade again after the fate (`after_choice`), when the lighting is back to the normal ambient with the recording lights off, the same as before the confrontation. The case-file screen and disposition screen carry no readable state, so the image doesn't contradict the HANDOVER / RETAINED faces.

**Gemini calls: 19 of 30.** PixelLab: 14 generations (10 conversions plus 4 reseeds at seed 7).

| Room | NPCs (x across) | Calls | Steps | Wired as | Faults accepted |
|---|---|---|---|---|---|
| main_lobby | ATHENA (56%) | 3 | generation; edit moving the X-ray scanner and arch from the right (against the back wall) to the left, out on the floor; relight | single image | The north door in the back-left corner was dropped; the left-wall door is there. The arch stands close to the counter. The seal is a generic eagle seal; the wordmark is garbled at 400px. The counter is shorter than the map's, so the space behind ATHENA shows the memorial, the lilies and the LEVEL RED screen over bare wall instead of the counter's right end. |
| director_office | Netherton (68%) | 1 | generation | single image | A dark wainscot below the blue line, which the map doesn't have. The laptop has a fruit logo (lost in the crop). Faint haze (lamp-lit room, ceiling off as planned). |
| operations_floor | Cipher (52%), analyst (82%) | 2 | generation; relight | single image | The middle desk's monitors face away from us (the map has them facing south), and the near desk is the same; both sit under the crop. The photocopier stands against the back wall rather than 2 m out. The world-clock label reads NVC. |
| intel_analysis | Phantom (52%) | 2 | generation; relight | single image | The room reads a little tall and sparse (bare wall above the screens). Seed 7: faint rings on the plain walls remain (seed 42 had round blotches). |
| cryptography_lab | Nightshade (55%) | 2 | generation; relight | single image | The near desk runs front-to-back in the centre, not across. The security cabinet stands against the back wall rather than out on the floor. Camera slightly high. |
| break_room | HaX (30%), off-duty agent (66%) | 3 | generation; relight (it greyed the beige walls, so the final concept is a 55/45 PIL mix of the clean generation and the relight: colours kept, haze faint); left-view outpaint | views: `[0, 0.5]` left view, `[0.5, 1]` room-wide | The lockers stand touching, without gaps. The left view shows the edge of a locker at its right edge, under HaX's portrait. Seed 7 for both images; the plain beige walls still show soft rings, mostly behind the portraits and softened by the blend. |
| interrogation_room | Nightshade, after the fate only (50%) | 1 | generation | single image | The back-left corner door landed on the left side wall. The dark red line runs at dado height with darker blockwork below, where the map has it at the skirting. Faint haze. |
| server_room | none | 3 | empty shell; free-standing row edit (layered build); relight | single image | The row edit didn't build a second row: it added the air-con unit to the back row and pulled one black rack forward, so the room shows one row of racks plus a trolley (m07 accepted the same). The back row sits nearer the centre than in the map. Haze is strong but pale. |
| security_archives | none | 2 | generation; relight (added lit ceiling panels and haze) | single image | The third shelving unit turned onto the right side wall. The second desk, box trolleys and its chair stand behind the camera and are left out. |

## Views by the NPC's position

- **break_room:** HaX stands at 30% across, so the room-wide image would put the lockers behind him. The left view is the approved concept shifted right by 0.40 (`--suggest` gave 0.46, capped at 0.40) and outpainted with one call. It puts the kitchenette, espresso machine and fridge behind him, with the palm to his left, as in the map. The left view comes first in the list. The off-duty agent (66%) gets the room-wide image: lockers, poster and door, as in the map.
- The other NPCs stand between 52% and 82%, and the room-wide previews show the right things around them (checked with `pov_chat_preview.py`), so no other views were needed.

## Checks

- `pov_chat_preview.py` on every final blended file: `build_evidence/pov/<room>_preview.png`.
- PixelLab results: `build_evidence/pov/pixelart_sheet_seed42.png` and `pixelart_sheet_seed7_reseeds.png` (intel and both break-room images use seed 7).
- In-game chat shots (`chat-background-shot.sh`, keyless :3001): `build_evidence/pov/<room>-chat.png`, both break-room NPCs (`break_room_hax-chat.png`, `break_room_agent-chat.png`), contact sheet `chat_shots_sheet.png`. Every room loaded its background. The break room picked the left view for HaX and the room-wide view for the off-duty agent. The two rooms with no NPC (server room, archives) borrowed ATHENA. Every browser session was stopped (the scripts close their own).
- Tour shots used as references: `build_evidence/pov/<room>-a.png` (`-b` for motion rooms, lit). Rejected or intermediate images kept for reference: `main_lobby_gen1_rejected.png`, `break_room_relight_greyed.png`, `server_room_shell.png`.
- Validator (`--skip-ink --no-graph`): no errors; the warnings are the same as before (objective wiring, the confrontation mapping without `onceOnly`).
- Scenario change: only `chatBackground` lines added to the nine room blocks in `scenario.json.erb`. No ink, dialogue or object fields touched.

## For the orchestrator (not changed)

- **No scene pins the generic `background1.png`** in m08. Three scenes pin their own backgrounds, which win over the room backgrounds, as intended: the opening briefing (`hq1.png`, erb ~:588), the closing debrief (`hq3.png`, ~:1294) and the confrontation (`hq2.png`, ~:2047).
- **The Director's narration contradicts his office.** The opener seen in the chat shot (`ink/m08_director_netherton.ink:85`) reads "An inner office with no windows. Netherton stands facing a wall of amber threat maps, his back to the door." The dressed map (and so the background) has a window with closed blinds on the back wall and no threat maps. Either the narration or the room needs a small change; this is outside the background stage.
