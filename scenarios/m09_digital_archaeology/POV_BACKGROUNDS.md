# m09 Digital Archaeology: conversation (POV) and cutscene backgrounds

Made 2026-10-22 with the `room-pov-background` skill, after room dressing (`ROOM_DRESSING.md`, rounds 1–4, R4 review "ready for lighting") and lighting (`LIGHTING_PLAN.md`, rounds 1–2) were signed off. The user approved the backgrounds and the front desk as the first one, then asked for the rest. Model record: `scenarios/m05_insider_trading/POV_BACKGROUNDS.md`.

Inputs per room: `pov_prep.py` strip and inventory (scratch), and the lit tour shots already in `lighting_r2/` (`-a`, or `-player-lit` for the motion rooms; `lighting_r1/staff_passage-b.png`; `dressing_r3/ingame/open_stacks-a.png` for the stacks, which `lighting_r2` doesn't cover). Gemini `pro` model, a fresh conversation per image. PixelLab pixflux at 400×400, strength 500, seed 42 unless noted, no downscaling. Blended at 50% with `tools/blend_backgrounds.py`. The game uses the `_blended` files.

Mood: night, after hours, every room drawn lit as it is once someone has walked in. Ceiling panels throw light straight down, spreading evenly; the only directional sources are the hub's and the cage's hanging work lights, the dock's sodium lamps and the desk lamps.

**Gemini calls: 25. PixelLab: 17 generations** (15 images, plus one strength retry and one reseed).

Contact sheet of all 15 blended images: `pov_sheet.png`.

## The images

There are 15, not the 16 the first plan said: eleven rooms (the open stacks as two spans), one extra view for the cage, and the two cutscenes.

| # | Image | Who it serves | Calls | PixelLab | Steps | Faults accepted |
|---|---|---|---|---|---|---|
| 1 | `rooms/m09_front_desk` | Noor (65%) | 3 | 2 (500, then 600) | generation; wall-line fix; relight | The north door is on the left side wall, not in the back wall's corner (the player's portrait covers it). The call point sits by that door. After PixelLab the chair is blue-grey, not teal, and RETURNS AND ENQUIRIES is garbled. A shade greyer than the concept |
| 2 | `m09_briefing` (C1) | the opening briefing | 1 | 1 | text-only generation, m08's operations-floor concept as the house-style reference | The meeting table runs front to back. Blue LED skirting copied from m08's house look. The pixel art has contour banding on the walls; the blend softens it |
| 3 | `rooms/m09_restricted_stacks` | Sorensen at the hatch (82%) | 1 | 1 | generation | The clock is above the sign, not beside it. The east door shows through the mesh. PixelLab added a round light pool on the floor below the crop band |
| 4a | `rooms/m09_open_stacks_west` (span 0–330 px) | Old Coyote's west half, Dillard (18%) | 1 | 1 | generation (wide-room span wording) | The free-standing second row came out as a run going front to back on the right (the known free-standing failure). It still reads as the stacks' shelving behind him |
| 4b | `rooms/m09_open_stacks_east` (span 310–640 px) | Old Coyote's east half | 1 | 1 | generation, the west concept as a style reference | The second row in front of bay 12 was dropped; a brick pilaster was invented; the left shelving runs front to back. Bay 12 with its label and the pulled-out H&L boxes, the camera, the door, the extinguisher and the pallet all match |
| 5 | `m09_hangar` (C2) | the debrief | 1 | 1 | text-only generation | None worth a call. The ramp and the lone crate sit right of centre, partly behind the speaker's portrait, as planned |
| 6a | `rooms/m09_restricted_cage_left` | Sorensen at the shredder (36%), `sorensen_door` (no position, so first view) | 1 (outpaint) | 1 | `pov_view.py --shift 0.37`, outpaint | None seen: seamless |
| 6b | `rooms/m09_restricted_cage` | the right half of the cage | 1 | 1 | generation | The camera sits a little high. The mesh stands as fence panels in front of the side walls |
| 7 | `rooms/m09_server_closet` | Tran (66%) | 1 | 2 (seed 42, then 7) | generation (small-room, glow wording) | The door is at the near end of the left wall (player's half). Two faint round rings on the right wall from the concept's cyan glow, behind Tran's portrait (seed 7 had two; seed 42 had three) |
| 8 | `rooms/m09_tape_room` | the Alpha recording (no position) | 5 | 1 | layered build: shell; row edit (failed: two changes in one edit gave only a floating shadow); row edit reworded; near items (deck, side table); relight | The front row is two units, not four. The corner door is on the left wall. A waist-height two-tone band stays on the side walls. The haze is strong and a little smoky over the shelves; PixelLab fanned it into symmetrical shafts |
| 9 | `rooms/m09_loading_dock` | none standing (cutscenes pin their own) | 1 | 1 | generation (exterior yard wording) | The pixel art drifted a little brown (the yellow bin went tan); the blend brings it back |
| 10 | `rooms/m09_reading_room` | none | 2 | 1 | generation; relight | **Reads cooler than the "only warm room" the lighting plan describes**: green-blue walls with small warm lamp pools. The camera is high. Warm wording in a relight tints the whole picture (skill lesson), so I didn't push it |
| 11 | `rooms/m09_sorensen_office` | none | 2 | 1 | generation; relight | The door is a little way along the right wall. After the relight the panelling is greyer than walnut and the coat stand fades into shadow. The pixel art greys the credenza |
| 12 | `rooms/m09_staff_passage` | none | 3 | 1 | generation; wall-line fix; relight | Mild haze with a small puff under the ceiling (cropped). "VIS / VISITOR" readable on the badge board, as the map's sprite has |
| 13 | `rooms/m09_salvage_cage` | none | 1 | 1 | generation | The cut door controller is on the left side wall, not the back wall. A grey band runs behind the desks |

The green line came out at dado height in three rooms (front desk, tape room, staff passage). A single-purpose edit fixed it twice ("Remove the green stripe … put one thin dark green line along the very bottom … directly on top of the dark brown skirting board"). Combined with a row edit in the tape room, it was ignored.

Files: `public/break_escape/assets/backgrounds/rooms/m09_<room>[_west|_east|_left]{_nonpixelart,,_blended}.png` and `public/break_escape/assets/backgrounds/m09_{briefing,hangar}{_nonpixelart,,_blended}.png`.

## Wiring (`scenario.json.erb`)

Only `chatBackground` lines were added, each right after the room's `type`; nothing else changed.

| Room | Wired | Value |
|---|---|---|
| front_desk | yes | `m09_front_desk_blended.png` |
| restricted_stacks | yes | `m09_restricted_stacks_blended.png` |
| open_stacks | yes | views: `x [0, 0.5]` west, `x [0.5, 1]` east |
| restricted_cage | yes | views: `x [0, 0.55]` left (first, so `sorensen_door` gets it), `x [0.55, 1]` room-wide |
| server_closet | yes | `m09_server_closet_blended.png` |
| tape_room | yes | `m09_tape_room_blended.png` |
| loading_dock | yes | `m09_loading_dock_blended.png` |
| reading_room | yes | `m09_reading_room_blended.png` |
| staff_passage | yes | `m09_staff_passage_blended.png` |
| salvage_cage | yes | `m09_salvage_cage_blended.png` |
| **sorensen_office** | **no** (the edit was refused by the session's permission check) | add after `"type": "room_m09_office",`: `"chatBackground": "assets/backgrounds/rooms/m09_sorensen_office_blended.png",` |
| **briefing_cutscene** | **no** (refused the same way) | `timedConversation.background` `assets/backgrounds/hq4.png` → `assets/backgrounds/m09_briefing_blended.png` |
| **closing_debrief** | **no** | both mappings' `background` `assets/backgrounds/hq2.png` → `assets/backgrounds/m09_hangar_blended.png` |

The two cutscene NPCs' `_comment`s still say "PLACEHOLDER background (ASSET_LIST §3)", and `ASSET_LIST.md` §3 still lists both as owed. Both need updating once the swaps land.

## Checks

- `pov_chat_preview.py` on the front desk and the briefing (both crops); the others were checked by eye against the map's band behind each NPC.
- Validator (`--skip-ink --no-graph`): exit 0, schema passes, no errors, and no warnings about the new background files.
- In-game chat shots (`chat-background-shot.sh`) **not taken**: the harness needs Node 20+ for Playwright, and this machine has Node 18.19.1.
- Every `_blended` file is 400×400 (asserted when the contact sheet was built).

## Order followed

front_desk, C1 briefing, restricted_stacks, open_stacks (west, east), C2 hangar, restricted_cage (room-wide, then left), server_closet, tape_room, loading_dock, reading_room, sorensen_office, staff_passage, salvage_cage.

## Notes

- `pov_prep.py --list-rooms` lists only nine m09 rooms: its regex expects `"type"` as a room's first key, and `reading_room` and `restricted_cage` open with a `_comment`. The tool was not changed.
- Old Coyote patrols, so the stacks' two views cover the whole width; the view under him when the chat opens is the one shown.
