# m07 The Architect's Gambit: conversation (POV) backgrounds

Stage: art order, after dressing (closed 2026-10-14) and lighting (closed 2026-10-14). Skill: `.claude/skills/room-pov-background/`. Done 2026-10-16 under the user's approval of metered Gemini for this mission (whole mission, cap 20 calls). **Gemini calls used: 12 of 20.** PixelLab: 11 conversions (8 plus 3 reseeds).

Inputs per room: `pov_prep.py` strip and inventory, and a lighting tour on keyless :3001 (game 2514 for five rooms; game 2516 for the operations floor, taken last, just before its concept, so it shows the console "3" tag as it was at 18:25). Every image is the night mood from `LIGHTING_PLAN.md`: ceiling panels on in the checkpoint, server room, generator hall and vault, with the light falling straight down and spreading evenly (no slanting beams); screen glow only in the two rooms with `panels: false` (operations floor, SCADA control).

Files are in `public/break_escape/assets/backgrounds/rooms/`: `<name>_nonpixelart.png` (concept), `<name>.png` (400px PixelLab), `<name>_blended.png` (what the game uses). Evidence: `build_evidence/pov/` (concepts, 400px results, chat-frame previews, in-game chat shots).

No room reuses another mission's background: every `room_pnw_*` map is new to m07. The Netherton briefing scenes in the checkpoint pin `hq1.png` / `hq3.png` on purpose (HQ calls); left alone.

## Rooms

| Room | NPC (x across) | Wired as | Gemini calls | PixelLab |
|---|---|---|---|---|
| security_checkpoint | Hollis (35%) | views: `[0, 0.5]` left view, `[0.5, 1]` room-wide | 3 (generation, wall repaint and haze edit, left outpaint) | 2 (left view reseeded: 3) |
| server_room | Elena (30%) | views: `[0, 0.5]` left view, `[0.5, 1]` room-wide | 3 (empty shell, second-row edit, left outpaint) | 2 (left view reseeded: 3) |
| scada_control | Mercer (70%) | single image | 1 | 1 (reseeded: 2) |
| generator_room | none | single image, span x 200-540 (gensets and battery wall) | 2 (generation, cleanup edit rejected) | 1 |
| cable_vault | Park (45%) | single image | 1 | 1 |
| operations_floor | none | single image | 2 (two generations; the second kept) | 1 |

Left views: Hollis and Elena stand left of centre, so the room-wide image would put the far side of the room behind them. Each left view is the approved concept shifted right (0.38 and 0.40) and outpainted; the first view in the list is the left one, so a chat with no NPC position falls back to it.

## Faults accepted

- **security_checkpoint:** the east door is drawn in the back wall's right end, not on the right side wall near the corner (edits can't move doors; the NPC portrait covers it). Three waiting chairs in the left view, the map has two. The first generation turned the strip's floor band into terrazzo cladding on the lower walls; fixed by an edit (pale grey plaster to the floor, green skirting).
- **server_room:** the free-standing row of racks merged into the back row in place, and the two pale grey units (tape library, UPS) became a black rack and the navy BKP rack. It still reads as this rack room with the BKP rack at the right. The left-wall door is at the near end of the wall instead of near the back corner; extinguisher and suppression panel are in swapped order. The two desks sit nearer the centre than in the map.
- **scada_control:** the desk return came out as a long L-shaped extension; it sits beside Mercer, which matches where he stands in the map. The countdown shows its start face (SEQUENCE LOADED / AWAITING HOST) in every phase.
- **generator_room:** a fourth, cut-off genset at the right edge and two invented vertical conduits on the right of the wall; a dark green lower band on the wall where the map has only a skirting. The cleanup edit removed the third genset as well, so the first generation was kept.
- **cable_vault:** the north door is on the left side wall instead of in the back-left corner; the extinguisher hangs on the back wall's left end instead of the left wall.
- **operations_floor:** five consoles (three far, two near) instead of two rows of three, evenly spaced rather than two-plus-one with the aisle right of centre; the evergreen line runs at dado height instead of along the skirting. The video wall (two rows of five), wall map and both side doors near the back corners are right.
- **PixelLab:** faint round haze rings on the large plain left walls of both left views even after the reseed (seed 7 was better than 42); they sit behind the player's portrait and the blend softens them.

## Checks

- Validator (`--skip-ink --no-graph`): schema pass, no errors; the eventMapping warnings were there before this stage.
- In-game chat shots (`tools/playtest/chat-background-shot.sh`, keyless :3001): each room's background loaded; listed in `build_evidence/pov/`.
- No ink, dialogue or object fields changed; only `chatBackground` lines added to the six room blocks in `scenario.json.erb`.
