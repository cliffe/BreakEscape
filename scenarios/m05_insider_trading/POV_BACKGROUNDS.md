# m05 Insider Trading: conversation (POV) backgrounds

Made 2026-10-16 with the `room-pov-background` skill (D17 in `DECISIONS_PENDING.md`, approved by the user on 2026-10-16: whole mission, capped at 30 Gemini calls). Stage: art order, after dressing (`ROOM_DRESSING.md`, including the 2026-10-16 user-review changes: the lab's shower and first-aid cabinet on the walls, rolling trolleys and chairs) and lighting (`LIGHTING_PLAN.md`).

Inputs per room: `pov_prep.py` strip and inventory, and `lighting-tour.sh` on keyless :3001 (game 2559; the lit `-b` shot for the motion rooms). Gemini `pro` model, a fresh conversation per room. PixelLab pixflux at strength 500, seed 42, 400x400, no downscaling. Blended at 50% with `tools/blend_backgrounds.py`. The game uses the `_blended` files.

Mood: the evening before the naming (about 16:30 to 20:00), every room drawn lit, as it is when someone has walked in. Ceiling panels throw light straight down, spreading evenly to both sides (no slanting beams). The only directional source is Torres' brass desk lamp. The data centre's upload terminal glows amber with a progress bar, as it does while Torres is in the room (the `torres_identified` breathe).

Files: `public/break_escape/assets/backgrounds/rooms/m05_<room>[_left]{_nonpixelart,,_blended}.png`.

**Gemini calls: 23 of 30.** PixelLab: 12 generations (10 rooms plus 2 left views), no reseeds.

| Room | NPCs (x across) | Calls | Steps | File(s) | Faults accepted |
|---|---|---|---|---|---|
| research_lab | Halloran (60%) | 2 | generation; relight | `m05_research_lab_blended.png` | An extra purple door at the near end of the left wall (in the player's half, behind the portrait). The optical bench runs front-to-back, not across. Camera a little high. The near desks are left out (near edge). The lab sign's lettering is garbled at 400px. |
| patricia_office | Patricia (30%) | 4 | generation; wall fix and relight in one edit; outpaint for a left view (twice: the first try erased the door and plant outside the strip) | `m05_patricia_office_left_blended.png`, `m05_patricia_office_blended.png` | The desk runs front-to-back with the visitor chairs side-on. The west door is part-way along the left wall, not touching the back corner. The skirting is grey, not violet. Faint round rings on the large plain left wall of the left view (behind the player's portrait). |
| break_room | Lisa (40%) | 3 | generation; relight (with TV on); outpaint for a left view | `m05_break_room_left_blended.png`, `m05_break_room_blended.png` | After the relight the walls are a deeper green than the map's sage, with a little grey haze on the back wall. A dark projecting wall piece at the back of the left wall (both views; player's half). The east door sits a little way along the right wall. |
| open_office_area | Owen (60%) | 2 | generation; relight | `m05_open_office_area_blended.png` | The network whiteboard and the IT workbench are on the left side wall, not the back wall; the photocopier and filing cabinet stand against the back wall. The desk pair runs front-to-back. The west door is part-way along the left wall. The right side of the frame (planner, comms cabinet, back-right door) matches the map, and that is what shows behind Owen. |
| data_center | Torres (50%) | 1 | generation | `m05_data_center_blended.png` | A grey lower band on the walls under the red line (the map has only the red line). The suppression cylinders stand against the left wall. The near desk is left out. Haze is faint. Sign lettering garbled at 400px. The amber terminal sits just left of Torres' portrait, as in the map. |
| torres_office | none | 2 | generation; relight (wall fix in the same edit was ignored) | `m05_torres_office_blended.png` | A violet stripe at desk height on the walls. The clock is on the right side wall, not the back wall. One visitor chair, not two. The monitor faces away. |
| reception_lobby | none standing (briefing and debrief pin `hq1.png`) | 2 | generation; relight | `m05_reception_lobby_blended.png` | The back-left door is on the left side wall; the east door is at the near end of the right wall. The dispatch screen is on the right side wall. The teal bench is angled. The room reads narrower than the map. |
| main_corridor | none | 2 | generation; relight | `m05_main_corridor_blended.png` | An extra door at the back-left of the back wall; the side doors sit at the near ends of the side walls. "FIRST-AID" is readable on the poster. Round light pools on the carpet after PixelLab (low in the frame, cropped). |
| server_hallway | none | 2 | generation; relight | `m05_server_hallway_blended.png` | The north door is on the right side wall, not in the back wall's corner. The cable tray turns onto the left wall. The bay reads narrower than 6 m. "IT notice" readable. |
| server_room | none | 3 | shell; free-standing row (layered build); relight | `m05_server_room_blended.png` | The row stands only a little in front of the back-wall racks, and is about 13 cabinets across the middle half rather than 11 from the left wall. The north door is on the right side wall. The near desks and air-con unit are left out. After the relight the back-wall racks fade into the haze (as in m06). |

## Views by the NPC's position

- **patricia_office:** `x [0, 0.55]` is the left view (cork suspect board, coat stand, west door and plant behind Patricia, as in the map); `x [0.55, 1]` is the room-wide image.
- **break_room:** `x [0, 0.6]` is the left view (kettle, under-counter fridge and TV behind Lisa); `x [0.6, 1]` is the room-wide image.

Both were made by `pov_view.py --shift` (0.40 and 0.33, from `--suggest`) and outpainting. The left view comes first in each list, so a chat with no NPC position falls back to it. Torres (50%) needed no left view: the room-wide image already puts the amber terminal just left of his portrait.

## Checks

- `pov_chat_preview.py` on every concept and view: `build_evidence/pov/*_preview.png`.
- PixelLab results: `build_evidence/pov/*_px400.png`, contact sheet `pixelart_sheet.png`. No round blotches in the crop.
- In-game chat shots (`chat-background-shot.sh`, keyless :3001, games 2572-2582): `build_evidence/pov/<room>-chat.png`, contact sheet `chat_shots_sheet.png`. Every room loaded its background. Patricia's office and the break room picked their left views from the NPC's position. The four rooms with no NPC borrowed HaX.
- Validator (`--skip-ink --no-graph`): schema pass, no errors.
- Tour shots used as references: `build_evidence/pov/tour_<room>-a.png` (`-b` for motion rooms, lit).
- Only `chatBackground` lines were added to the ten room blocks in `scenario.json.erb`; no ink, dialogue or object fields changed.

## For the user (not changed)

- One conversation pins the generic `assets/backgrounds/background1.png`, which wins over the new data-centre background: Torres' `post_ko_choice` scene, on the `npc_ko:david_torres` event mapping (erb ~:2090 at the time of writing). Dropping that `background` line would show `m05_data_center_blended.png` instead, as m06 did for its three pins.
- The opening briefing (`opening_briefing` timed conversation) and the debrief pin `hq1.png` (HQ), which is intended.
- Lisa's opening narration says "by the break room window", but the break room has no window in the map or the background.
