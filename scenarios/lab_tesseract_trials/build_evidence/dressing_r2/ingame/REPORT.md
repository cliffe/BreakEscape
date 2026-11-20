# lab_tesseract_trials layout check, dressing round 2
Game 1626, keyless :3001, headless, session log in scratch `playtest/session.jsonl`. World x,y; sprite dumps from the Phaser display list (x,y = top-left).

## 1 Foyer: PASS
- foyer.png. `uni_bunting1` (66,12) 104x10 depth 64.52; `uni_bunting2` (222,12) 64x10; `balloons1` top-left (66,137) 32x59, feet 196, depth 196.5, no body; `uni_banner_soc1` (70,192) 22x58, feet 250, depth 250.5, no body; CTF poster = `uni_poster3` (14,179) 16x21 west wall (a "HI!" poster `uni_poster1` at (14,115) above it). 0 duplicates, 0 missing.
- Jordan Pike sprite box (75,99)-(155,179), centre (115,139); balloons x 66-98 so the balloons sit at his left edge only, no overlap of his body in the screenshot.
- Spawn -> south door: `enter lecture_theatre` returned did-not-cross twice (arrivedAt 45,278 then 52,223); manual moveTo (48,270) + walk down crossed with no snag; walk up from the theatre returned to foyer (49,188). No snag on new items (no bodies).
- Side door foyer->common room: 2 `enter` calls (first did-not-cross at 269,53).

## 2 Common room (before any unlock): PASS
- common_room.png. `foosball_table1` top-left (360,115) 57x57, body, feet 172, depth 172.5 (tables layer). `uni_dartboard1` (333,140) 16x16 west wall, depth 156.5, no body. `uni_sofa1` (364,201) 60x51, feet 252, bottom-left, no body. Low table `smalldesk1` (426,209) 50x41; high table `smalldesk1` (540,199), laptop on it.
- Megan: NPC position (387.2,164.2); sprite box (347,124)-(427,204), centre (387,164), depth 204.7 > foosball 172.5, so she draws in front. Her feet (~196) are above the sofa top (201) and below the foosball bottom (172): she is between them, touching neither body in the screenshot (head overlaps only the foosball's lower edge visually).
- Cliffe: NPC (489.6,205.8), box (450,166)-(530,246); low table x 426-476, high table x 540-590: clear between them, as in the screenshot.
- Taps: Cliffe `approached-then-interacted` -> person-chat; Snack Machine `direct` -> Examine; Candidate Locker 4 `direct` -> PinMinigame (harness `mismatch:true wrong-target-opened`, generic title "Enter PIN for item", false positive); Dr Schreuders' Laptop: from the harness's moveToNear position (feet ~166, plain 62px) interact came back `no-effect-confirmed` twice (approach click landed, nothing opened); after a manual `walk down 150` to (563,185) `interact` was `direct` -> Examine "Dr Schreuders' Laptop". So it opens directly, with no menu; the failure was the harness stopping short on the north side of the desk. Megan `direct` -> person-chat, `converse` ran 8 turns and her chat works. No `via-interaction-menu` anywhere.
- Side door common->staff office: 3 `enter` calls (2 did-not-cross at 637,45 and 590,48). Return staff->common: `no-known-doorway` even after `room`; walked left 700 ms by hand, crossed fine.
- Side doors: foyer->teaching lab 2 calls (first did-not-cross); teaching lab->foyer walked by hand, crossed. Foyer->lecture theatre: 2 failed calls, by hand worked.
- Teaching lab->foyer crossed by hand first time; common room->foyer by hand first time.

## Server-side unlock (disclosed)
After the foyer/common checks on the unmodified game I unlocked `corridor`, `library`, `workshop` for game 1626 with `game.unlock_room!` (rails runner), stopped the session, and reopened the same game with `?skip_resume=1` + bootstrap resume (session2.jsonl). Console.log hook installed after load (window.__logs) to catch "No Tiled item found" style logs from room loads.

## 3 Corridor: PASS (one note)
- corridor.png. `uni_radiator1` (191,-80) 26x10; `uni_fountain1` (242,-92) 14x22; `uni_firedoor_sign1` (243,-109) 11x11 depth -63.47 (about 30 px left of the workshop door at x 272, y -96); `wet_floor_sign1` top-left (70,-33) 21x29 so feet y -4 = room y 124, x 70, depth -3.5, no body, on the floor. All no body. 0 missing; the only "duplicate" is `door_sheet` at (32,0), the foyer north / corridor south door shared position.
- Taps: Trial V Poster `direct` -> Notes (item then gone from scene); Pigeonholes `approached-then-interacted` -> password pad (locked; harness false-positive mismatch); CryptoSecure Drop Box `approached-then-menu` / `via-interaction-menu` -> password pad; Tag on the Drop Box `via-interaction-menu` -> Notes "Tag on the Drop Box" (the deliberate drop box/tag pair); Floor Directory: from the harness position (277,-58) `no-effect-confirmed` twice, after a manual `walk down` to (276,-38) it opened Examine but `via-interaction-menu` (probably paired with the nearby Sidhu door at 304,-48; the menu entries were not captured).
- Side door corridor->library: 2 `enter` calls (first did-not-cross at 50,-77).

## 4 Library: PASS
- library_east.png, library_west.png. Room is 20 tiles wide, x -640..0. East half: two `hospital_desk2` (-220,-52) and (-158,-52) with pc7 (-198,-66) and lamp, `checkin_kiosk1` (-94,-68) 27x60 depth -7.5 (no body), `uni_sign_returns1` (-154,-89), `uni_sign_library1` (-140,-108), bookcases x -304..-175. West reading room: `uni_sign_study1` (-412,-108) "STUDY AREA", three bookcases x -556..-427, `periodicals_rack1` (-606,-104) 48x52 depth -51.5, `study_carrels1` (-418,-82) 57x58 depth -23.5 with body (-408,-38.5, 37x14.5), two `desk1` reading tables (-588,-15),(-510,-15) with bodies, `journal_stack1`, two `bankers_lamp1`, four `hospital_chair_south` at y -42 (no body), `book_trolley1` (-372,-21) 38x43 no body, `uni_radiator1` (-354,-80). 0 duplicates, 0 missing.
- `codebreakers_book` at (-160,-55) (book NPC room-list position; table `hospital_desk2` at x -158) and `returns_slip` at (-116,-42): 44 px apart. Tapped book first: `approached-then-interacted` -> ExamineMinigame "The Codebreakers (returned)" with the slip still in the room, no menu. Slip: from the harness position (-119,-78) `no-effect-confirmed`, after `walk down 120` (-119,-58) `direct` -> NotesMinigame "Returns Slip". No pick-one menu at any point: PASS.
- Walks: east door -> west end: `walk left` is capped near 1.5 s (192 px); moveTo reached (-599,-90); back moveTo to (-130,-90) fine; no snag. Carrels: walking up from below at x -395 stopped at feet -19 (body bottom -24): solid; reading tables stop at feet ~29: solid. Trolley/chairs walk-through (no bodies; walking up at x -378 passed the trolley).
- East door -> north door: 2 `enter special_collections` calls (first did-not-cross at -12,-83), crossed to (-70,-154).

## 5 Workshop: PASS
- Entered from the corridor NE door: 2 `enter workshop` calls (first did-not-cross at 270,-90).
- workshop.png. `cliffe_build_screen` ("Dr Schreuders' Build"): texture `smartscreen2`, top-left (130,-368) 48x34 depth -319.45; the screenshot shows a dark floor-plan style screen (green outlined rooms, yellow dots), not a landscape. Its scenario `type` is still `info_screen1` (the sprite's `.type` field), the texture is `smartscreen2`. Beside it `hacktivity_scoreboard` is `conference_screen1` (70,-368), a blue UI screen. NOTE the Relay Terminal `pc5` (137,-254) on the IT workbench still shows a landscape wallpaper monitor; that is the pc5 art, not the build screen.
- Taps: build screen: first call `no-effect-confirmed` right after closing a person-chat, second call `direct` -> ExamineMinigame "Dr Schreuders' Build"; scoreboard `approached-then-interacted` -> password pad (locked; false-positive mismatch); Relay Terminal: from the harness's north-side position (137,-291, plain 37 px) `no-effect-confirmed` twice, after `walk down 60` to (137,-279) `direct` -> password pad (locked, expected). Cliffe `cliffe_workshop` `approached-then-interacted` -> person-chat.
- Cliffe NPC (89.6,-191), sprite box (50,-231)-(130,-151), feet ~ -160. Machines: `printer_3d1` x 24-58 y -190..-144, `cnc_mill1` x 24-65 y -238..-194, `it_workbench1` x 124-184 y -244..-186, `component_drawers1` x 28-65. Clear by about 20 px either side (his body is about x 80-100). Standing in the screenshot between the CNC/printer column and the yellow-hatched workbench. 0 duplicates, 0 missing textures.

## 6 Side-door `enter` calls
| Crossing | enter calls |
|---|---|
| foyer -> lecture theatre (south) | 2 failed, crossed by hand (moveTo + walk down) |
| foyer -> common room | 2 |
| common room -> staff office | 3 |
| foyer -> teaching lab | 2 |
| corridor -> library | 2 |
| library -> special collections (north) | 2 |
| corridor -> workshop (north) | 2 |
| back-crossings (common->foyer, lab->foyer, staff->common, library->corridor, theatre->foyer) | `enter` says `no-known-doorway` every time; by hand: first time except library->corridor, which needed 3 tries (see quirks) |
So the harness change does NOT cross first time: the first `enter` ends with the player standing at the near side of the door (did-not-cross, e.g. arrivedAt 269,53 then 637,45), and the next one crosses. Corridor -> Sidhu's office not crossed (not asked in the checklist of rooms to visit).

## 7 Whole run: PASS
- Console: a console.log/warn/error hook (window.__logs, installed after page load, so it misses the very first foyer load) recorded 2161 lines through corridor, library, special collections, workshop. 0 `console.error`; page errors `[]`; 1 TTS 503 ("[TTS] API error: 503", expected on keyless). No "No Tiled item found", no "random position" log lines. Only noise: "Tables object layer not found or empty" for the corridor (once, benign), "Cannot update door pathfinding - room X not initialized" (when entering rooms), "No path to target - finding nearest reachable cell" (harness moveTo).
- Missing textures: 0 `__MISSING`/`__DEFAULT` in the scene display list (135 sprites with a texture across all loaded rooms); the only no-texture items are four invisible 4x26 sprites at (0,0) depth 1000 (UI). Duplicates (same texture, x, y): `door_sheet` stacked 4x at the shared door positions (-64,-128), (256,-128), (32,0) (door frames drawn by two rooms, existing behaviour), and `pc5` x2 at (137,-254): the second is a depth-9000 alpha 0.18 `Image` highlight overlay on the hovered Relay Terminal, not a duplicate object. No duplicates among decor.
- Server-side unlock used: corridor, library, workshop (disclosed above). Foyer, common room, teaching lab, lecture theatre, staff office were played before any unlock.

## Harness quirks
- `enter` through every side door: first call walks to the near side and reports did-not-cross; second call crosses (staff office took 3). Return trips hit `no-known-doorway` even after `room`.
- `moveToNear` regularly stops 37-62 px from the target (plain-distance > 32) on the far side of tables (Cliffe's laptop, Returns Slip, Relay Terminal, Floor Directory): `interact` then returns `no-effect-confirmed`. A manual `walk down 60-150` toward the object, then `interact`, opens it `direct` each time. Not a layout fault (engineDistance 20-21).
- First `interact` straight after closing another minigame sometimes `no-effect-confirmed` (build screen); repeat works.
- `walk` is capped at about 1.5 s (192 px) however large `ms` is.
- Library east door (to corridor) only crossed with centre y about -75 (feet about -44); at -67/-87/-100 the player stopped at x -41 with the door gap not lined up. `moveTo` toward the door ended at y -100.
- Locked-object pads (pigeonholes, drop box, locker 4, scoreboard, relay) report `mismatch:true wrong-target-opened` because the pad title is generic: harness false positive.
- `screenshot` ignores my zoom-to-fit (the camera is re-centred on the player by the follow), so the PNGs are the normal follow view with the room in shot. Session tag for a URL with `?skip_resume=1` is `1`, not the game id.
- The sprite dump must not filter on `.type`: scenario objects carry their scenario type there (`info_screen1`, `pc`, ...).

## Summary table
| # | Item | Result |
|---|---|---|
| 1 | Foyer: bunting, balloons, banner, CTF poster, Jordan, door walk | PASS |
| 2 | Common room: foosball, dartboard, sofa, Megan, Cliffe, direct taps | PASS |
| 3 | Corridor: radiator, fountain, fire door sign, wet floor sign, taps | PASS (poster, drop box, tag, directory: menu only on drop box/tag pair and, near the Sidhu door, the directory) |
| 4 | Library: book and slip open directly, walks, carrels solid | PASS |
| 5 | Workshop: `smartscreen2`, taps, Cliffe clear | PASS |
| 6 | Side doors cross first time | FAIL as a harness claim: 2 calls (3 for staff office) every time |
| 7 | Whole run: errors, textures, duplicates, logs | PASS |

Game id 1626. Logs: scratch `playtest/session.jsonl` (235 commands), `session2.jsonl`. verify-run output: `verify-run.txt` here.
Screenshots: foyer.png, common_room.png, corridor.png, library_east.png, library_west.png, workshop.png.
