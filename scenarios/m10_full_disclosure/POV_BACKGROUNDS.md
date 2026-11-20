# m10 Full Disclosure: conversation (POV) and cutscene backgrounds

Made 2026-10-22 with the `room-pov-background` skill, after room dressing (`ROOM_DRESSING.md`, rounds 1–4, R4 review "ready for lighting") and lighting (`LIGHTING_PLAN.md`, rounds 1–2). The user approved the backgrounds and m09's method and results (`scenarios/m09_digital_archaeology/POV_BACKGROUNDS.md`), then asked for the full set.

Inputs per room: the `pov_prep.py` strip and inventory (scratch), and the lit tour shots in `lighting_r2/` (`-a`; `power_room-b.png` for the power room, which is a motion room). Gemini `pro` model, a fresh conversation per image. Only the back-wall strip and a written inventory went to Gemini, never the top-down map. The three scene backgrounds are text-only generations, with m08's operations-floor concept as the house-style reference for the two Citadel rooms. PixelLab pixflux at 400×400, strength 500, seed 42, no downscaling. Blended at 50% with `tools/blend_backgrounds.py`. The game uses the `_blended` files.

Mood: night throughout, as the lighting plan says (01:45 to 06:00 UTC, still dark in Montana). Each room is drawn lit, the way it looks once someone has walked in. The forward post is a cold blue yard where the sodium lamp, the work lamp and the vans' open doors give the only warm light. The tunnel, gallery and core are lit by caged bulbs. The security office, workshop and power room have fluorescent tubes, and the server hall has bulbs plus the backlit plotting board.

**Gemini calls: 21. PixelLab: 17 generations** (17 images, no retries).

Contact sheet of all 17 blended images: `pov_sheet.png`.

## The list

Eight rooms: three views of the forward post, two each for the workshop, power room, server hall and gallery, one each for the tunnel, security office and core. Plus three scene backgrounds: the 06:00 relight, the Citadel and the hearing. ASSET_LIST §3's briefing is the forward post's west view (Netherton stands at x 0.3), so it shares that file and has no image of its own. As §3 suggests, the 06:00 scene is that same concept relit.

| # | Image | Who it serves | Calls | PixelLab | Steps | Faults accepted |
|---|---|---|---|---|---|---|
| 1 | `rooms/m10_forward_post_west` | Netherton and the briefing, HaX, Vector, Voltage, Kowalczyk at the van, Phantom, Malhotra, the minder (x < 0.45) | 2 | 1 | room-wide generation; `pov_view.py --crop -0.24 0.51`, then an outpaint of the left 32% | The camera sits high, so the folding table falls low in the frame, below the chat's middle band. The table stands right of centre in the concept (the map has it left of centre). The map board moved left onto the crates' stretch of fence |
| 2 | `rooms/m10_forward_post_centre` | Kowalczyk at the post, Quintero (x 0.45–0.7) | 0 | 1 | `--crop 0.03 0.78` of the room-wide concept | As 1. The gate tables are behind Quintero, though the map has the map board there |
| 3 | `rooms/m10_forward_post_east` | Arakawa at the gate and the blast door, the blast-door minder, Nightshade at the gate (x ≥ 0.7) | 0 | 1 | `--crop 0.25 1.0` | The blast door leaf stands open into the yard, not flat against the east wall. The barrier is a long jersey barrier, not a short trestle one |
| 4 | `m10_six_oclock` (06:00 scene) | `six_oclock` (every ending but Join) | 1 | 1 | relight edit of view 1: floodlights from behind the camera, headlights, exhaust vapour | **Floodlit but still dark-skied.** Daylight would contradict LIGHTING_PLAN §1 and its m13 ruling (06:00 UTC is about 23:00 in Montana). The ink's "people sitting on bumpers" can't be drawn (no people in backgrounds). One floodlight head shows at the top right |
| 5 | `rooms/m10_blast_tunnel` | tunnel guard (0.4), the guard at the kettle (0.7) | 1 | 1 | generation (short wide bay wording) | **Warm and a little sepia**: the caged bulbs gave the whole picture an amber cast, and PixelLab pushed it further. The bulbs hang in a line down the vault, front to back, not along the back wall. The vault is long and arched where the map shows a flat ceiling. "DUTY ROTA" is legible on the board |
| 6 | `rooms/m10_security_office` | both duty guards, Vector | 2 | 1 | generation; night relight | The room reads narrower and deeper than 6×6 m. The alarm board sits above LEVEL 1, not left of the notice board. The cupboard stands near the door at the back of the left wall, not halfway along it |
| 7a | `rooms/m10_workshop_floor` | Imran (0.6), Gary in the tech copy (0.8) | 2 | 1 | generation; night relight | The east door is in the back wall's right end, not on the right wall. The benches stand closer to the back wall than the 2 m the map has. A small smoke puff by the desk lamp |
| 7b | `rooms/m10_workshop_floor_left` | Gary in the consultant copy (0.3), the workshop guard (0.2) | 1 | 1 | `--shift 0.38`, outpaint | Seamless. The pixel art garbles WORKSHOP; the blend softens it |
| 8a | `rooms/m10_power_room` | Wendell (0.6, 0.8), Static (0.7) | 1 | 1 | generation | The 1960s switchgear stands near the back-left corner, not halfway along the left wall. The caged bulbs hang from the ceiling and are drawn unlit, as the lighting plan has them. Haze is mild and sits under the ceiling |
| 8b | `rooms/m10_power_room_left` | Voltage (0.4, 0.5) | 1 | 1 | `--shift 0.3`, outpaint | Seamless |
| 9a | `rooms/m10_server_hall_left` | Asante or Mercer (0.55), the hall guards on their beat west of 0.7 | 1 | 1 | `--shift 0.22`, outpaint | Seamless |
| 9b | `rooms/m10_server_hall` | the hall guards east of 0.7 | 1 | 1 | room-wide generation | The 12 m wall came out at about 7 m (the console desk fills the middle). The plotting board is drawn as a pale backlit grid, not dark perspex. The racks stand behind the desk, centre, not right of it. Kept room-wide because it already reads at a believable size in the chat crop (a crop made the racks huge) |
| 10a | `rooms/m10_gallery_left` | Victoria, Vos, Farah, the monitor guard, Nightshade at the lock (x < 0.6) | 1 | 1 | `--shift 0.22`, outpaint | Seamless. PixelLab mangled LEVEL 2 into "LEVEL 3" |
| 10b | `rooms/m10_gallery` | the lock guard (0.79), Quintero and the minder at the lock (0.7) | 1 | 1 | generation | **Warmer than the lighting plan's cold walkway**: the bulbs' pools came out amber-brown over the concrete, and PixelLab fanned them into symmetrical cones. The lock panel sits beside the windows, not further east |
| 11 | `rooms/m10_core` | Tesseract (0.6), both Kowalczyk copies (0.8), Quintero (0.5) | 2 | 1 | generation; edit removing the executive chair (Tesseract sits in it, so his portrait stands in for it) | The key console sits at the centre, not right of centre. The service door and its camera are at the back end of the right wall (the map has them near the camera). Two retro terminals on the left, where the map has one desk terminal and the field console |
| 12 | `m10_citadel` | `citadel` (Join only) | 2 | 1 | text-only generation with m08's house style; edit flattening the voice-channel waveform to silence | The right screen shows the field post (table, lamp, van) and no Netherton. In the chat his portrait stands over that screen, so the screen reads as his video link. Two doors, where one was asked for |
| 13 | `m10_hearing` | `hearing` (Scorched Earth only) | 2 | 1 | text-only generation with m08's house style; relight | The panel's three chairs are empty (backgrounds have no people). The near chair sits under HaX's portrait, which matches "the chair beside yours" |

Files: `public/break_escape/assets/backgrounds/rooms/m10_<room>[_west|_centre|_east|_left]{_nonpixelart,,_blended}.png` and `public/break_escape/assets/backgrounds/m10_{six_oclock,citadel,hearing}{_nonpixelart,,_blended}.png`.

## Method notes

- The forward post and server hall are 20 tiles wide. For the forward post, the room-wide concept was cropped into three views by NPC position (`--suggest`). A crop costs no Gemini call, and only the west view needed an outpaint. The 768 px crops are above the 400 px floor.
- The server hall's room-wide concept already read at the right size in the chat preview, so it was shifted (with an outpaint) rather than cropped.
- Views were made for every room where NPCs stand left of centre: the workshop, power room, server hall and gallery.
- No room got a layered build: the only tall free-standing items are the vans, and an outdoor yard has no wall for them to drift onto.

## Wiring (`scenario.json.erb`)

The file was re-read just before the edit, and one Python pass with a uniqueness assert on each anchor changed only background fields. The other differences in the file (voice styles) belong to another agent.

| Where | Field | Value |
|---|---|---|
| forward_post | `chatBackground` | views `x [0, 0.45]` west, `[0.45, 0.7]` centre, `[0.7, 1]` east |
| blast_tunnel | `chatBackground` | `m10_blast_tunnel_blended.png` |
| security_office | `chatBackground` | `m10_security_office_blended.png` |
| workshop_floor | `chatBackground` | views `[0.5, 1]` room-wide (first: Imran), `[0, 0.5]` left |
| power_room | `chatBackground` | views `[0.5, 1]` room-wide (first: Wendell), `[0, 0.5]` left |
| server_hall | `chatBackground` | views `[0, 0.7]` left (first: Asante or Mercer and the guards), `[0.7, 1]` room-wide |
| gallery | `chatBackground` | views `[0, 0.6]` left (first: Victoria and Vos), `[0.6, 1]` room-wide |
| core | `chatBackground` | `m10_core_blended.png` |
| `director_netherton` | `timedConversation.background` | `assets/backgrounds/rooms/m10_forward_post_west_blended.png` (the briefing). His other mappings fall back to the room's west view, since he stands at x 0.3 |
| `six_oclock` | `background` on both mappings in the ERB ending loop | `assets/backgrounds/m10_six_oclock_blended.png` (it stood at (500, 500) with no background, so it would have taken the forward post's first view) |
| `hearing` | both mappings' `background` | `assets/backgrounds/hq3.png` → `assets/backgrounds/m10_hearing_blended.png` |
| `citadel` | both mappings' `background` | `assets/backgrounds/hq1.png` → `assets/backgrounds/m10_citadel_blended.png` |

Left for the owners of those fields: the ERB comment above Netherton's `timedConversation` still says "ASSET_LIST 3: no background yet". `ASSET_LIST.md` §3 still lists all four scenes as placeholders.

## Checks

- `pov_chat_preview.py` on the forward post's views and on the tunnel and server hall concepts. The others were checked by eye against the map's band behind each NPC.
- Validator (`--skip-ink --no-graph`): exit 0, schema passes, no errors, and no warnings about the background files or view ranges.
- Every `_blended` file is 400×400 (asserted when the contact sheet was built).
- In-game chat shots (`chat-background-shot.sh`) were not taken: the harness needs Node 20+ for Playwright, and this machine has Node 18 (as for m09).
- No PixelLab blotches seen. The gallery's bulb pools fanned into cones; nothing else.

## Order followed

forward_post (room-wide, west outpaint, centre and east crops), the 06:00 relight, blast_tunnel, security_office, workshop_floor (room-wide, left), power_room (room-wide, left), server_hall (room-wide, left), gallery (room-wide, left), core, Citadel, hearing. All PixelLab conversions ran at the end, once every concept was settled.

## Notes

- `pov_prep.py --list-rooms` listed all eight m10 rooms. None of them opens with a `_comment` key, so the skip bug didn't bite here.
- Hidden scene NPCs (`six_oclock`, `hearing`, `citadel`) live in the forward post at (500, 500). Without an explicit `background` they get the forward post's first view, which is why `six_oclock` now carries its own.
