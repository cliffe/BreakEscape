# lab_tesseract_trials layout check, dressing round 1
Game 1622, keyless :3001, headless, session log `session.jsonl` (this folder). Fresh game; coordinates below are world x,y (foyer origin 0,0; lecture theatre origin 0,256) unless "local".
Helpers: dump.sh (sprite dump of rooms[id]), tap.sh, shot.sh (centres camera on room, zoom-to-fit; restores follow).

## Item 2 Foyer: PASS
- foyer.png. Sprite dump: `freshers_stall1` at x 222, top y 194, 61x59 -> x 222-283, feet 253, depth 253.5 (purple stall, south-east, right of the `foyer_desk1_1` heritage table at x 167-245 feet 176). `display_case1`: 0 sprites in foyer dump (grep over all 14 sprites).
- Jordan Pike at (115, 139) sprite centre at spawn (player spawn 160,144), standing just NW of the lockbox/laptop desk (`foyer_desk1_2`, x 61-139, y 182-221), left of the player; not on the purple stall (that is 100+ px east). Unchanged after play.
- Taps (interact `mode` field, no `via-interaction-menu`): ascii_chart `direct` -> NotesMinigame; paper_tape `approached-then-interacted` -> NotesMinigame; signup_laptop `direct` -> ExamineMinigame; cryptosecure_lockbox `direct` -> PasswordMinigame. No pick-one menu on any. 
- South door: `enter lecture_theatre` from the lockbox position (not literally from spawn) crossed at once; room = lecture_theatre. Spawn-to-door walk was not done as a separate path (I was already near the lockbox).

## Item 7 Lecture theatre (partial, finished below)
- lecture_theatre.png: four ledges + four seat rows in two blocks (left x 92-275, right x 334-578); aisles: west x<92, centre x 275-334, east beyond 578.
- Tom Shaw at (211, 350) sprite centre = front left of the demonstration bench (desk1 at x 240, lectern at 326); `moveToNear` after one step south worked; `interact` mode `direct`, opens person-chat "Right then. You'll be one of mine..." (task "Get a lab laptop from Dr Shaw" ticked).
- Fourth-row block: standing below the seats at (142,532), `walk up 800` stopped at (142,474): sprite centre 474 -> body top 500, the underside of ledge 4 (body 3 px high at y 497-500). BLOCKED. PASS. (Note: the blocking is by the ledge bodies only; the seats themselves have no collision, so a player can stand in the seat band below the ledge, y 500-560.)
- Centre aisle: `walk up 2500` from (310,532) reached (310,348): open. West aisle: moveTo (65,380)->(65,520) walked down; `walk up` from (41,532) went to (41,155), i.e. out through the south door into the foyer: open. PASS.

## Item 4 Common room (fresh, before any unlock): PASS
- common_room.png (centre-zoom shot). `uni_tv1` at x 486-526, y 22-48 (top-left), above `student_lockers1` (x 480-530, y 70) and `candidate_locker_4` (x 530, y 70). Reads as a wall TV above the lockers in the screenshot.
- Megan: sprite centre (397, 212). Sofa `uni_sofa1`: top-left (364, 139), 60x51 -> bottom y 190, depth 190.5. Megan is below/in front of it (her head overlaps only the sofa's lower edge), not inside it.
- Cliffe (`cliffe_schreuders`) visible at (490, 206), between the low table (`smalldesk1` x 428, y 149) and the high table (`smalldesk1` x 540, y 199, laptop on it). Visible=true.
- Taps (all `interact` mode `direct`, none `via-interaction-menu`): megan_oyelaran -> person-chat; cliffe_schreuders -> person-chat; common_noticeboard -> Examine; common_vending_machine ("Snack Machine") -> Examine; coffee_station -> Examine; cliffe_laptop -> Examine. candidate_locker_4: mode `approached-then-interacted`, opened the PIN pad (`pin`, entity lockType pin). The harness flagged `mismatch:true wrong-target-opened` because the pad's generic title "Enter PIN for item" differs from the object name; it is the locker's own pad, no menu (harness false positive, same for the foyer lockbox `ok:false`).
- moveToNear on locker 4 reported `arrived-but-outside-plain-range` (arrived 468,164, twice) but `interact` then approached and opened it.

## Item 3 Teaching lab: PASS
- teaching_lab.png. Lab origin is world x -320 (west of the foyer), so coordinates are negative. Entered by the east door (arrived -22,53; side-door `enter` needed the usual retry in the other direction: foyer->lab worked first time, foyer->common needed two calls).
- Three benches (two `desk1` each at feet y 124/196/268; world y tops 85/157/229), PCs on each: pc12 x9 plus the two scenario PCs. Teal static chairs `hospital_chair_north` x12 (4 per bench) at y 122/194/266 (top-left), directly south of each bench's PCs. Lecturer's desk `hospital_desk1` at (-98,102) with `hospital_chair_south` at (-75,86) behind it (north side). Laptop `laptop1` and lamp on the desk.
- pc11 `lab_account_pc` "Your Lab Account": world (-159, 76), tex `pc11`, depth 124.52. pc9 `keyholder_guest_terminal` "Keyholder Guest Terminal": world (-163, 141), tex `pc9`, depth 196.51.
- Walked from the east door (-22,53). pc11: interact `direct`, container minigame "Your Lab Account" opened (after a short "loading" beat: the first `interact` returned `opened:null`/`item_unlocked` and the container appeared a moment later; the harness result looked like a failure but `mg getState` shows ContainerMinigame with private_key.pem, public_key.pem, README.txt). pc9: moveToNear short (arrived -142,78, outside plain range) but `interact` approached and opened the password pad directly (`mode approached-then-interacted`; harness `mismatch:true` is the generic "Enter password for item" title, locked terminal). No pick-one menu either time.
- Back (third) bench: walked the row east to west and back at player y 276 (x -41 -> -268 -> -41) and up again: free movement, no snag.
- Chairs static: all 13 chair sprites have no physics body, are not `interactable`, no `pushable`; positions of all 12 `hospital_chair_north` identical before and after walking across the rows at y 217 and 276 (list `-152,122 ... -152,266` unchanged). I did not directly push-test them (my walks passed below the chair rows); static is from the missing body/interactable evidence.
- Direct push test: walked left at player y 173 (body y 199-209, overlapping the whole second chair row y 194-220) from x -129 to -279; chair `hospital_chair_north_29` stayed at (-152,194) and the player passed through all four chairs. So they cannot be pushed (and they do not block either: no body).

## Item 9 Staff office: PASS
- staff_office.png. Reached from the common room east door (the 3-call `enter` retry again; the first call arrived at 589,51 and did not cross).
- Three face-to-face desk pods (x 760/910/1060, `desk1` pairs, chairs behind/in front). No bags in the middle of the floor. Two bags: `bag12` (grey backpack in the screenshot) at x 1140-1166, y 181-205, directly right of the east pod (pod x 1060-1138): matches "grey backpack beside the east pod". `bag18` (dark red/maroon backpack) at x 750-772, y 184-205, left of the west pod (an extra the brief did not mention; both at pod edges, not centre).
- Oleg (`oleg_illiashenko`) at (874, 195), centre aisle between pods 1 and 2. moveToNear first call `arrived-but-outside-plain-range` (767,143), second call succeeded (850,181); `interact` mode `direct` opened person-chat: "The sign on that door says staff only. You read it and came in anyway..." PASS.

## Server-side unlock (disclosed)
After the foyer/lab/lecture/common/staff checks (all done on the fresh, unmodified game), I unlocked `corridor`, `library`, `workshop` on game 1622 with `game.unlock_room!` from a rails runner (script `unlock.rb`). The client did not see it (doors still raised the password pad), so I stopped the session (`session.jsonl`, 435 cmds), reopened the same game id with `session-start.sh` (`session2.jsonl`, `?skip_resume=1`, bootstrap resume) and the corridor opened. The page reload put the player back at the foyer spawn (160,144).
Spawn -> south door -> lecture theatre was repeated from the real spawn after the reload: `enter lecture_theatre` crossed first try, and `walk up` from the door (45,321) returned straight through the south door and across the foyer to (45,38). PASS for the Item 2 walk.

## Item 5 Library: FAIL (one point: pick-one menu on the book/slip pair); the rest PASS
- library.png. White self-service kiosk `checkin_kiosk1` at x -94..-67, y -68..-8 (right side), depth -7.5. Dump has no safe of any kind (grep "safe" = 0 hits over all 11 sprites; book trolley, three bookcases, desk, chair, lamp). 
- FAIL: `codebreakers_book` (-167,-55, tex `book`) and `returns_slip` (-160,-42, tex `notes4`) are 15 px apart. With both in the room, `interact` on each came back `mode: via-interaction-menu` (the harness had to choose from a pick-one menu): book -> ExamineMinigame "The Codebreakers (returned)", slip -> NotesMinigame "Returns Slip". After the slip was read (it disappears from the scene, `unknown-entity:returns_slip`) the book opens `direct`. So the pair raises a menu, as a book tied to its slip; ROOMS_PLAN may accept it, but it is not "opens directly". I did not capture the menu's entries (the harness picks them).
- Walk east door -> north door: arrived at the east door (-13,-83), `moveToNear` book/slip fine, `enter special_collections` crossed first try, arrived (-46,-134) in special_collections. PASS.

## Item 8 Special Collections: PASS
- special_collections.png. `uni_portrait1` at x -130..-108, y -366..-338 (gilt frame in the screenshot), on the back wall right of the `uni_sign_special1` (x -220..-156), depth -319.45. Safe `special_collections_safe` (tex `safe1`, -96,-175): `interact` mode `direct`, PasswordMinigame opened (harness `mismatch:true` is the generic "Enter password for item" title again). No menu. Also present: gilt-free `display_case2` (-296,-191) west of the table, plan chest, four bookcases, conference table with two lamps and a book.

## Item 6 Sidhu's office: PASS
- sidhu_office.png. Back-wall `uni_certificate1` at (424,-98) 18x14, depth -63.46 (on the wall beside the door card at (386,-102) and the year planner). Desk `smalldesk1` (514,-58); `hospital_chair_north` at (523,-28) in front of the desk (visitor side, toward the room), `hospital_chair2` at (490,-40) angled at the desk's west end = visitor chair; pc7 and cup on the desk. Sidhu himself is not in the room list (no NPC in `room`).
- sidhu_door_card: `interact` mode `direct`; opens a display dialog "Door Card ... DR S. SELVARAJAN, Reader in Cyber Security. Office hours Tuesday 2-4. Seminar room through the back." (not a minigame, so the harness says `no-effect-confirmed`; dismissed with "Close"). fn07_desk_copy: mode `direct`, NotesMinigame "Handout: Hashes". No menu either.
- Walk: arrived at the west door via `enter` (corridor east door worked first try); `enter seminar_room` through the north door crossed first call, arrived (594,-131). PASS.
- Side doors by hand this run: library->corridor and common->foyer only crossed at feet-in-doorway y (door y - 34); `moveTo` to a y near the door sometimes landed in the neighbouring room's door passage (library north door).

## Item 1 Screenshots: PASS
foyer.png, teaching_lab.png, common_room.png, library.png, sidhu_office.png, lecture_theatre.png, special_collections.png, staff_office.png, corridor.png, seminar_room.png (all in this folder). foyer.png is the normal follow camera; the others are `shot.sh` (camera centred, zoom to fit, then restored). The viewport also shows neighbouring rooms because rooms are adjacent in world space.

## Item 10 Console / network
- Client console errors (harness collects `console.error` and pageerror): session 1 (435 cmds, game page 1): 21 x "Failed to load resource: 503 (Service Unavailable)" and nothing else. Matches the server log: exactly 21 `POST /break_escape/games/1622/tts` -> 503 (keyless server, expected). Only one `drain` was run in session 1 (at about command 317), so errors after that were not read, but the server-side TTS count for 1622 is 21 in total. Session 2 (305 cmds, reload for unlocks): `drain` returned `pageErrors: []`.
- The known `female_hacker_hood_v2_talk.png` 404 did not show as a client console error in either session. It is in the shared server log (many hits), but other playtests are running on :3001 (games 1621, 1623, 1624), and Rails does not tag log lines per request, so I cannot attribute the assets 404/503 in the log to game 1622. Also at 14:11:32/35 `GET games/1622/scenario` and `/ink` show a 503 in the log in the middle of the other games' load burst; the page loaded and played normally, so treat as server-busy noise, not verified as mine.
- Any other 4xx/5xx client-side: none seen.
- Missing textures: evaluated all seven rooms loaded in session 2 (foyer, lecture_theatre, corridor, library, special_collections, sidhu_office, seminar_room): 0 sprites with `__MISSING`/`__DEFAULT`/no texture, 0 in the whole scene display list. Duplicate sprites (same texture and x,y): 0 across those rooms. For lab, common room and staff office (session 1) I read the full sprite dumps by eye: no duplicates and no missing textures; screenshots show none.
- "No Tiled item found" / "random position" logs: NOT checked directly. The harness only keeps console errors, and `console.log`/`warn` text is not captured. Indirect evidence: every scenario object sits at a sensible spot in the dumps and screenshots (lockbox and laptop on the foyer desk, ASCII chart and tape on the heritage table, PCs on lab benches, book and slip on the library desk, safes/pins at their intended places). A real console-log capture would need a Playwright script outside the harness.

## Quirks hit
- `enter` through side doors needs 1-3 calls (foyer->common 2, common->staff 2, corridor->library 1, corridor->sidhu 1). It never reported the 4xx.
- `enter` fails with `no-known-doorway` once a door has opened and disappeared (special_collections->library, library->corridor); I walked by hand at door y - 34 (y 44-48 for the foyer row, -79 for the corridor row). `moveTo` near the library's side door once landed in the Special Collections doorway.
- Locked-object interactions (lockbox, locker 4, guest terminal, safe) come back `ok:false mismatch:true wrong-target-opened` because the lock minigame has a generic title ("Enter password/PIN for item"). They are the right targets.
- pc11 (container) returns `opened:null` first and the minigame appears a beat later; use `waitFor minigame`.
- Server-side `unlock_room!` is not seen by an open client; the page has to be reloaded (stop/start the session, `?skip_resume=1`, bootstrap resume) to see the unlocked doors.
- A tight 0.9 s `walk` can overshoot a 24 px door opening; `walk` of 60-75 ms steps worked for fine y alignment.

## Summary table
| # | Item | Result |
|---|---|---|
| 1 | Screenshots | PASS |
| 2 | Foyer | PASS |
| 3 | Teaching lab | PASS |
| 4 | Common room | PASS |
| 5 | Library | FAIL (book + returns slip raise a pick-one menu; kiosk and no-safe OK) |
| 6 | Sidhu's office | PASS |
| 7 | Lecture theatre | PASS |
| 8 | Special Collections | PASS |
| 9 | Staff office | PASS |
| 10 | Whole run | PASS on errors/textures/dups; log scan for "No Tiled item found" not captured |

Game id 1622. Logs: session.jsonl, session2.jsonl. verify-run output: verify-run.txt.
