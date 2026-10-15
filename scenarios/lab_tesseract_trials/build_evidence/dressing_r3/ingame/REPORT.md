# lab_tesseract_trials layout check, dressing round 3
Game 1630, keyless :3001, headless (load average 12), world x,y from the Phaser display list (x,y = sprite top-left unless noted). Session logs: `session1.jsonl` (foyer, common room, teaching lab, lecture theatre, staff office, untouched game), `session.jsonl` (everything else). verify-run: `verify-run.txt`. I used a scratch copy of the harness (`ps.js`) that only adds an `addInitScript` console hook (`window.__logs`), a `response`/`requestfailed` logger and nothing else; the repo harness was not touched.

**Server-side unlock (disclosed):** foyer and common room were looked at on the untouched game (plus teaching lab, lecture theatre, staff office, which are open anyway). Then I ran `game.unlock_room!` for all 11 rooms (`unlock.rb`), quit the session and reopened the same game (`?skip_resume=1`, `bootstrap resume:"resume"`) so the maps loaded fresh.

Screenshots use a camera trick (`stopFollow` + `setScroll`/`setZoom`, objectives panel hidden by CSS) so a whole room fits; this changes nothing in-game.

| # | Item | Result |
|---|---|---|
| 1 | 11 rooms screenshotted | PASS |
| 2 | Workshop | PASS |
| 3 | Common room | PASS (Megan's sleeve touches foosball handle tips, see 9) |
| 4 | Sidhu's office | PASS |
| 5 | Seminar room | PASS |
| 6 | Library slip/book text and taps | PASS |
| 7 | Floor Directory | PASS for any sensible tap, with one narrow menu sliver (below) |
| 8 | No pick-one menus except the pair | PASS |
| 9 | NPCs clear | PASS (two tight spots noted) |
| 10 | All doors walkable | PASS, 1 `enter` call each |
| 11 | Scene scan | PASS |
| 12 | Angled props | PASS, no room over two, none clearly overlapping a wall (kiosk borderline) |

## 1 Screenshots: PASS
foyer.png, teaching_lab.png, lecture_theatre.png, common_room.png, corridor.png, library_east.png, library_west.png, special_collections.png, sidhu_office.png, seminar_room.png, workshop.png, staff_office.png (all in this folder, id as filename). foyer.png/common_room.png/teaching_lab.png/staff_office.png/lecture_theatre.png are from session 1 (untouched game); the other seven from session 2. The special_collections.png safe is drawn blue because the pointer is hovering it (highlight tint), not a texture change.

## 2 Workshop: PASS
Room at (0,-384).
- `laser_cutter2` (196,-316) 46x60 depth -255.5, body; `it_workbench2` (128,-246) 52x60 depth -185.5, body, with the yellow/black hazard square around it (116..192 x -246..-172, floor art, drawn in the screenshot); `electronics_bench2` (208,-239) 42x55 body; `cnc_mill2` (32,-245) 41x57 body; `fire_alarm_point1` (292,-272) 16x20 on the east wall (depth -251.5). Also `printer_3d2` (32,-191) 38x57 and `component_drawers1` (32,-285). Not in your list but note `printer_3d2` is the replacement for the retired `printer_3d1`.
- `laser_cutter1`, `it_workbench1`, `electronics_bench1`, `cnc_mill1`, `printer_3d1`: absent from the full scene dump (358 sprites, `final_dump.txt`).
- `pc5` Relay Terminal (137,-255) 34x27 depth -185.49, sitting on the island bench (bench -185.5).
- Taps (tap.py, `moveToNear` then `interact`): Relay Terminal `direct` -> password pad (from player 163,-243; harness flags `wrong-target-opened`, the generic "Enter password for item" title, false positive); Hacktivity Scoreboard `direct` -> password pad (86,-340); Dr Schreuders' Build `direct` -> Examine "Dr Schreuders' Build" (109,-346); Cliffe `direct` -> person-chat (84,-213). No menu on any.
- Cliffe NPC (89.6,-191) (tile x 2.8, tile y 6.0 from the room's top edge); sprite box (50,-231)-(130,-151). Art: CNC/printer right edge x 73, Cliffe's sleeve about 8 px from it; hazard square left edge 116, his right side about 15 px from it. Clear but not generous.
- Island loop (moveTo waypoints, all `ok:true`, no block): SE (208,-183) -> S (158,-181) -> SW (120,-194) -> west lane beside Cliffe (107,-246) -> (107,-286) -> N (147,-296) -> NE (192,-293) -> east lane (199,-254) -> (200,-214) -> (225,-198). The east lane (hazard edge x 192 to electronics bench x 208) is 16 px wide and the player went through it with no snag; the west lane beside Cliffe passes too.

## 3 Common room: PASS
- `uni_sofa2` (364,214) 62x38, depth 252.5, no body; `uni_sofa1` absent. Front-on blue sofa in common_room.png.
- `foosball_table2` (360,139) 48x57 body depth 196.5 (replaces the retired foosball_table1).
- Megan NPC (419.2,151.4), box (379,111)-(459,191); Cliffe NPC (489.6,205.8), box (450,166)-(530,246). Zoomed crop (`_crop_common.png`): Megan is beside the foosball (her elbow meets the right handle tips, about 0-5 px), body not overlapping it; the sofa is well below. Cliffe is clear of the sofa (about 80 px) and the low table (about 20 px gap).
- Taps all `direct`: Snack Machine (player 405,62) Examine; Candidate Locker 4 (500,69) PIN pad; Coffee Station (560,119) Examine; Common Room Noticeboard (402,38) Examine; Dr Schreuders' Laptop (537,179) Examine; Megan person-chat; Cliffe person-chat.

## 4 Sidhu's office: PASS
Room at (320,-128).
- `smalldesk1` meeting table (418,3) 50x41 body with `hospital_chair2` (398,10) on its west side and `hospital_chair1` (472,10) on its east side: two chairs in the lower half. (Chairs flank the table; they are not above/below it.)
- `uni_poster8` (334,3) west wall; `plant-large11` (352,-26) 38x76 depth 50.5 SW corner; `fire_extinguisher1` (590,20); `fire_alarm_point1` (612,-8); `bin8` (542,-11) beside the desk (`smalldesk1` (514,-58)).
- Walk W door (arrive 337,-79) -> E/N door to the seminar room (arrive 592,-168) and back (arrive 592,-87) -> corridor (292,-79): each one `enter` call, nothing blocked.
- "Door Card" (386,-102): `direct`, opens a DOM display dialog ("Door Card ... Office hours: Tuesday 2-4"), no menu. The harness reports `no-effect-confirmed` because the dialog is a blocking-UI div, not a minigame; the text proves it opened. Dismiss with `dismiss Close`. "Handout: Hashes" (547,-53) `direct` -> Notes (player 518,-67).

## 5 Seminar room: PASS
Room at (320,-384).
- `uni_radiator1` (397,-335) and (523,-335) under `window_blinds1` (390,-366) and (516,-366); `wall_clock1` (572,-364); `fire_alarm_point1` (612,-272) east wall; `uni_timetable1` (334,-210) west wall; `chairs_stacked1` (392,-177) 20x45, between `water_cooler1` (360..384) and the south chair row (first chair x 424).
- Dr Selvarajan NPC (536,-296.6), box (496,-337)-(576,-257). The chair row's top is y -266 and the nearest chair x 506-522, he stands at x about 525-547: clear (gap in the screenshot about 8 px vertically and 3+ px horizontally; the closest he gets is the third chair's top-right).
- Taps `direct`: Ledger Whiteboard (player 466,-336) Examine; Sidhu (518,-305) person-chat.

## 6 Library: PASS
- Returns Slip `observations`: "Left on the returns counter, beside a returned copy of The Codebreakers. Trial VI. Shift: the number of this Trial." Book: "David Kahn's history of secret writing, just returned. A slip of paper lies further along the counter." (read from the live `scenarioData`; both are texts as requested).
- Book (-160,-55) and slip (-116,-42): from one standing spot (-134,-61), 26.9 and 26.2 px away, the book gave `direct` -> Examine "The Codebreakers (returned)" and the slip `direct` -> Notes "Returns Slip". No menu.

## 7 Corridor Floor Directory: key finding
Sprite `uni_directory1` (292,-18) 16x18, bounds 292..308 x -18..0, depth 0.5, no body. Sidhu door: `door_side_sheet_32`, centre (304,-48), bounds (288,-64)-(320,-32), door_sign "Dr S. Selvarajan".

Cause (from `gatherInteractablesNearClick` in `core/game.js`): a door joins the tap menu when the player is within 64 px of the door centre AND the tap is inside the door sprite or within 32 px (TILE_SIZE) of its centre. The directory's top strip lies within 32 px of the door centre, so a tap on the top few pixels of the directory raises a 2-entry menu.

**Menu contents (captured, `interactionMenu.items`), player at (279,-39) and (277,-27):**
1. "Floor Directory" (detail: "West: Library, Special Collections beyond. East: Dr S. Selvarajan, Seminar Room 2 beyond. North: Z. C. Schreuders, Workshop (knock). South: Foyer, Lecture Theatre 1 beyond.")
2. "Dr S. Selvarajan" (the Sidhu office door, no detail).

**Where it happens (`sweepA.txt`, a 2 px grid of taps over the sprite, M = menu, D = direct), player (279,-39), 9 columns x = 292,294,...,308:**
```
y=-18  D M M M M M M M M
y=-16  D D D D M M M M M
y=-14 .. 0   all D (direct, Examine opens)
```
Same grid from (277,-27): identical. So only the top ~2-4 px strip (y -18..-16, x 294+) raises the menu; the other 85 percent of the sprite, including its centre (300,-9), opens it directly. A human tap on the picture opens it directly; I did not get a menu from any tap at y >= -14.

**Position tests (clickAt on the sprite top-left (292,-18) unless noted):**
| Standing spot (player x,y) | Result |
|---|---|
| (276,-37), (276,-29), (276,-19), (276,-9), (276,-2), (276,6) (walking down the lane below the door) | direct, Examine opens, every time |
| (279,-32), (279,-39) right edge of the lane, below the door | direct for the top-left tap and centre taps; menu only for taps at y -18..-16 |
| (277,-27), (275,-27) | direct (harness `interact` and clickAt) |
| (276,-47)/(276,-74) beside/above the door | out of the directory's range (about 39+ px): the tap just walks the player, no menu, no open |
| (256,-43), (236,-35), (257,-38) left of it | out of range, walks only; the harness reports `no-effect-confirmed` |
| (67,-70) far west (harness `interact`, approach) | `approached-then-interacted`, Examine opened, no menu |

Harness `interact` on `floor_directory` (clicks the sprite top-left (292,-18), 0.3 px outside the door's 32 px radius) gave `direct` or `approached-then-interacted` in all 4 successful calls; it sits on the knife edge, so a sub-pixel camera/scale difference can tip it into the menu. That is the likely source of round 2's `via-interaction-menu`, taken from about (276,-38).

Verdict for the dressing: the directory is not boxed in by a general menu. A real tap on the picture opens it. A tap on its top 2-4 px (and from a standing spot with the Sidhu door within 64 px, which is most of the lane) adds "Dr S. Selvarajan" to a pick-one menu. If you want it gone: lower the sprite's top edge to y >= -12 (6 px down; room floor ends at 0, so it would hang over the bottom wall line, so cheaper is to shift it left/up away from x 294-308 by one tile), or reduce the door's tap radius. Not blocking.

Drop Box pair for reference: "Tag on the Drop Box" `via-interaction-menu` (player 213,-90, intended); "CryptoSecure Drop Box" opened `direct` from (242,-76) and via a no-effect first try from (188,-90).

## 8 Every scenario object opens directly: PASS
All via `moveToNear` + `interact`, minigame closed after each.
- foyer: Byte Wall `direct` (alarm-panel "Facility Alarm Panel", generic title, harness mismatch false positive), Display Plaque `direct` Examine, Poster: Powers of Two (first try `no-effect-confirmed` after the harness stopped at 190,38, 32.5 px; second try `direct` Examine), ASCII Chart Handout `direct` Notes, Punched Paper Tape `direct` Notes, CryptoSecure Lockbox `direct` password pad, Sign-up Laptop `direct` Examine, Jordan `direct` person-chat.
- teaching_lab: Your Lab Account `direct` (fires an event, no minigame confirmed), Keyholder Guest Terminal `direct` password pad.
- lecture_theatre: Dr Shaw's Whiteboard `direct` Examine; Tom `direct` person-chat.
- corridor: Trial V Poster `direct` Notes; Pigeonholes `direct` password pad; Drop Box `direct` password pad (from the east side); Tag `via-interaction-menu` (the intended pair); Floor Directory see 7.
- special_collections: Safe `direct` password pad.
- staff_office: Staff Photocopier `direct` (event, then the container "Staff Photocopier" opens); Oleg: `approached-then-interacted` person-chat (see quirks).
- Items 2-6 as above. No `via-interaction-menu` other than the Tag.

## 9 NPCs clear of furniture: PASS
Jordan (115.2,138.6): balloons `balloons1` x 66-98 are about 9 px from his body in foyer.png; desk (206..284) far. Tom (211.2,349.8), box (171,310)-(251,390): `desk1` (240,335) and `lectern1` (326,328), about 30 px clear in the screenshot. Megan: see 3. Cliffe common room: see 3. Sidhu: see 5. Cliffe workshop: see 2. Oleg (873.9,194.9), box (834,155)-(914,235): standing in the aisle between desk columns; chairs `hospital_chair_north` (791,188) and (941,188) 16 wide are 50+ px away: clear. No other on-stage NPCs (Agent HaX cutscene NPCs sit at 16000,16000 off map).

## 10 Doors: PASS (every crossing took 1 `enter` call, each preceded by `room`)
foyer->common_room, common_room->staff_office, staff_office->common_room (twice), common_room->foyer (twice), foyer->teaching_lab (twice), teaching_lab->foyer (twice), foyer->lecture_theatre (twice), lecture_theatre->foyer, foyer->corridor, corridor->library, library->special_collections, special_collections->library, library->corridor, corridor->sidhu_office, sidhu_office->seminar_room, seminar_room->sidhu_office, sidhu_office->corridor, corridor->workshop, workshop->corridor, corridor->foyer, ... Every `enter` returned `ok:true` with `attempts:1` and no `did-not-cross`; no manual walking was needed. (This is the harness the other agent is editing, so it may differ from round 2's behaviour.)

## 11 Scene scan: PASS
- Final scene dump (`final_dump.txt`, 358 sprites, all 11 rooms loaded in session 2) plus the session-1 dump (`lec_dump.txt`, 223 sprites): 0 `__MISSING`/`__DEFAULT` textures.
- Retired textures present: none (`foosball_table1`, `freshers_stall1`, `display_case1`, `display_case2`, `plan_chest1`, `printer_3d1`, `uni_sofa1`, `laser_cutter1`, `electronics_bench1`, `cnc_mill1`; also `it_workbench1`). Replacements in the scene: `foosball_table2`, `freshers_stall2`, `display_case3`, `plan_chest2`, `printer_3d2`, `uni_sofa2`, `laser_cutter2`, `it_workbench2`, `electronics_bench2`, `cnc_mill2`.
- Duplicates (same texture, same x,y): `door_sheet` stacked 4x at (-64,-128), (256,-128), (576,-128), (32,0), (32,256) (shared door frames, ignored). Only other: `female_spy_v2` x2 at (15960,15929) = the two off-map Agent HaX cutscene NPCs (not decor). No decor duplicates, no hover overlays at scan time.
- Console (`logs_s1.txt` 3089+ lines incl. session 1, `logs_s2.txt` 9297): 0 `console.error`, 0 page errors, 0 "No Tiled item found", 0 "random position". Warnings only: "Cannot update door pathfinding - room X not initialized" (on every room entry), "No path to target - finding nearest reachable cell" (harness moveTo), "Tables object layer not found or empty" (corridor, once), "Cannot disable main game input..." x114 (examine minigame, noise from the camera/minigame scene).
- Network 4xx/5xx: 25x `503 /games/1630/tts` (expected on keyless), nothing else; no `requestfailed`.

## 12 Two-angled-props rule: PASS
Judged by eye from the screenshots (the textures with three-quarter art; not measured):
- foyer: `briefcase11` on the desk (small, 3/4). 1.
- common_room: foosball and coffee station read as front-on; sofa front-on. 0.
- teaching_lab: `pc9` Keyholder Guest Terminal (slightly 3/4 monitor and keyboard). 1.
- lecture_theatre: `lectern1` (3/4). 1.
- corridor: `wet_floor_sign1` on the floor (3/4 A-frame). 1.
- library: `checkin_kiosk1` (-94,-68) with its screen tilted and `book_trolley1` (-372,-21) 3/4. 2, at the limit, not over. The kiosk's top edge (y -68) touches the wall base line (wall ends at y -64): borderline overlap, the base is on the floor and it draws in front of the wall (depth -7.5).
- special_collections: `display_case3` (-286,-179) glass case (3/4). 1.
- sidhu_office: 0 (desk, tables, chairs front-on; the bin is a slight 3/4 can).
- seminar_room: `flip_chart1` easel (3/4). 1. Beanbags are round, no angle.
- workshop: 0 (new front-on art is square to the walls; laser cutter lid is open but the body is front-on).
- staff_office: `photocopier1` (3/4). 1.
No room has more than two; the two in the library are the only room at two.

## Harness quirks (noted, not fixed)
- `moveToNear` for Oleg ("oleg_illiashenko") returned `ok:false` from (669,56), 248 px away; `interact` then walked there itself (`approached-then-interacted`), so it works, but `moveToNear` alone does not.
- `moveTo` often stops 30+ px short of its target (the target is a feet position; the player centre ends about 25-35 px above it), and `walk` is capped near 1.5 s. First `interact` straight after closing a minigame sometimes `no-effect-confirmed`.
- `mg close` after a container (photocopier) reports `no-active-minigame` while the container is still "Loading"; it closed on its own on the next door crossing.
- The Door Card opens a DOM display dialog (blockingUi), which the harness reports as `no-effect-confirmed`; dismiss it with `dismiss Close`.
- `window.__test.clickAt` is useful for tap-point tests, but a leftover interaction menu from one tap makes later taps report the same menu: call `window.closeInteractionMenu()` between taps (my first grid run was polluted by this; the numbers above come from the corrected sweep).
