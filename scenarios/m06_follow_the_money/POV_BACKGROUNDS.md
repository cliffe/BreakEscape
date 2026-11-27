# m06 Follow the Money: POV conversation backgrounds

Made 2026-10-16 with the `room-pov-background` skill (D10 in `DECISIONS_PENDING.md`, approved by the user on 2026-10-16: whole mission, capped at 30 Gemini calls). Inputs per room: `pov_prep.py` strip and inventory, plus `lighting-tour.sh` (game 2515) for doors and mood. Gemini `pro` model, a fresh conversation per room. PixelLab pixflux at strength 500, seed 42, 400x400, no downscaling. Blended at 50% with `tools/blend_backgrounds.py`. The game uses the `_blended` files.

Lighting follows `LIGHTING_PLAN.md`: night, every working area lit. Ceiling panels throw light straight down, spreading evenly to both sides (the skill's 2026-10-16 rule). The only directional sources are the desk lamps (Satoshi, Irina) and the sconces (lobby, executive wing).

**Gemini calls: 21 of 30.** PixelLab: 11 generations (9 rooms plus 2 left views).

| Room | NPCs | Calls | Steps | File(s) | Faults accepted |
|---|---|---|---|---|---|
| trading_floor | Irina, trader (both 50% across) | 3 | generation; edit (pale grey dado band repainted dark); outpaint for a left view | `m06_trading_floor_blended.png`, `m06_trading_floor_left_blended.png` | Desk blocks run front-to-back, not across. The photocopier, coffee point, fridge and six-screen trading station moved to the back wall. Lower screen row has 6 screens, not 9. The ticker shows numbers, as the map's does. The lower wall is dark charcoal, not navy. The left view lost the west doorway (it would sit in the player's half, behind the portrait). |
| security_checkpoint | guard (40% across) | 3 | generation; relight, with the logo sign corrected from "GEHASHCHAIN" to "HASHCHAIN"; outpaint for a left view | `m06_security_checkpoint_blended.png`, `m06_security_checkpoint_left_blended.png` | The small gold-bordered sign is blank. The two-tone wall (navy over charcoal) is a little stronger than the map's skirting. Sign lettering is garbled at 400px. |
| satoshi_office | Satoshi (50%) | 2 | generation; relight | `m06_satoshi_office_blended.png` | Only one visitor chair in front of the desk. The floor round the rug is grey, not wood (cropped out). Downlight cones wash the wall: strong, but straight down and symmetrical. |
| blockchain_lab | Priya (60%) | 2 | generation; relight | `m06_blockchain_lab_blended.png` | The depth-chart screen is on the right side wall, not the back wall. The desk and table run front-to-back. The fire extinguisher is on the back wall. Haze is faint. |
| executive_wing | Kemal (60%) | 1 | generation | `m06_executive_wing_blended.png` | The north door sits at the back end of the right side wall, not in the back-right corner of the back wall; in the crop it reads the same. "PRIVATE" is garbled at 400px. Haze is faint (gallery lighting, ceiling off as planned). |
| reception_lobby | HaX at debrief (60%); the briefing and debrief pin `hq1.png` | 2 | generation; relight | `m06_reception_lobby_blended.png` | An extra door at the back end of the left wall (side doors can't be removed by an edit; it is in the player's half). The price board says PRICE. The display case and coin pedestal sit nearer the camera than in the map (mostly cropped). The logo lettering is garbled at 400px. |
| irina_office | none | 2 | generation; relight | `m06_irina_office_blended.png` | The desk runs front-to-back, left of centre. The east door is at the near end of the right wall, not the back corner. |
| server_room | none | 3 | shell; free-standing row (layered build); relight | `m06_server_room_blended.png` | 10 cabinets in the row, not 11. The UPS and near desks are left out. After the relight, the tops of the back-wall racks fade into the haze. |
| data_center | none | 3 | shell; cage and sign fix (layered build); relight | `m06_data_center_blended.png` | The cage stands only a little in front of the back-wall cabinets. A dark opening at the back of the left wall (an extra opening; the cage and fire panel cover most of it). The near desk, cylinders and UPS units are left out. |

## Views by the NPC's position

- **security_checkpoint:** `x [0, 0.55]` is the left view (notice board, water cooler and desk behind the guard, as in the map); `x [0.55, 1]` is the room-wide image.
- **trading_floor:** `x [0, 0.65]` is the left view (the market wall and the central aisle behind Irina and the trader); `x [0.65, 1]` is the room-wide image.

Both were made by `pov_view.py --shift` (0.35 and 0.25, from `--suggest`) and one outpaint call each.

## Checks

- `pov_chat_preview.py` on every concept and view: `build_evidence/pov/*_preview.png`.
- PixelLab results: `build_evidence/pov/pixelart_sheet.png`. No round blotches.
- In-game chat shots (`chat-background-shot.sh`, keyless :3001): `build_evidence/pov/<room>-chat.png`, contact sheet `chat_shots_sheet.png`. Every room loaded its background. The checkpoint and the trading floor picked their left views from the NPC's position. The three rooms with no NPC borrowed HaX.
- Validator (`--skip-ink --no-graph`): no errors.
- Tour shots used as references: `build_evidence/pov/<room>-a.png` (`-b` for motion rooms, lit).

## For the user (not changed)

Three conversations pin the generic `assets/backgrounds/background1.png`, which wins over the new room backgrounds:
- the guard's lockpick-seen scene (erb ~:1623);
- Kemal's `player_spotted` and lockpick-seen scenes (erb ~:2279, ~:2288).

Dropping those `background` lines would show the checkpoint and executive-wing backgrounds instead. The opening briefing and the closing debrief pin `hq1.png` (HQ), which is intended.
