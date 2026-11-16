# m02 office life: stage 5 live checks (2026-11-15)

Branch `build/ol-m02`, after df1450933 (Ernesto and Hodan on `ernesto_bautista` and `hodan_warsame`). Keyless server on port 3092 (stopped at the end), headless Chromium, `setFPS(20)` with fixed steps on. Real punches (key f) and real dialogue choices. Every game was made with `tools/playtest/new-game.rb m02_ransomed_trust` just before it was driven (VM flags synthesised by the script, as in stage 4); globals for branches were seeded with `--set` at creation. Scripts, logs and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/m02-s5/` (`out/` holds the screenshots). Reload start room and the Mission Brief are by design, not logged.

Coordinates are live world pixels; the staff room's origin is (0, 0) in this build (`window.roomPositions.staff_room`), so they are also room-local.

## 1. Real atlases: seats, posts and pairings (PLAN stage 6)

| Check | Result | Game | Evidence |
|---|---|---|---|
| Seated offset per atlas (`seating.js` `sitShift`, from `sit_south_frame_000`) | PASS | 5534 | `ernesto_bautista`: columns 27 to 52, last row 70, shift (0, -1). `hodan_warsame`: columns 28 to 51, last row 68, shift (0, -3). Reference `female_hacker_hood_v2` (0, 0). Both atlases have all 8 seated facings |
| Ernesto sits at his post | PASS | 5534, 5539, 5541 | `sit_south_frame_000` on `staff_room_hospital_chair_south_20` (chair 215, 150), sprite (223, 154), after every break on all three games. Same sprite position as the stand-in in round 4 (223, 154) |
| Hodan sits at her post | PASS | 5534, 5539, 5541 | `sit_north_frame_000` on `staff_room_hospital_chair_north_14` (chair 109, 170), sprite (117, 176), after every break. Round 4 stand-in: (116, 174); the 1 to 2 px move is the per-atlas hip shift, the chair is the same |
| Boiler pairing | PASS | 5539, 5541, 5552 | Both `using` `staff_boiler`. Ernesto takes the approach cell (sprite 169.7, 92.5; cell 172, 92), Hodan the second-user cell east of him (sprite 195.9, 96 to 100; cell 196, 92). `out/boiler-pair-5541.png` |
| Cooler pairing | PASS | 5539, 5541, 5552 | Both `using` `staff_cooler`. Ernesto at the approach cell (276 to 277, 205 to 209; cell 276, 212), Hodan beside him to the west (236.5 to 237.9, 213; cell 236, 220). `out/cooler-pair-5541.png` |
| Microwave with the boiler in use | PASS | 5539, 5541 | Ernesto `using` `staff_microwave` (227.8, 95.8; cell 228, 92) while Hodan uses `staff_boiler` from its approach cell (164, 92.3; cell 164, 92). 64 px apart, no job failed. `out/microwave-5541.png` |
| Return home and sit after each break | PASS | 5534, 5539, 5541 | Both back on their chairs, seated frames, after the boiler, cooler and microwave breaks |
| Path search to the second-user cells from both posts | PASS | 5541 | `world.routeLength` from each seated post to each user cell (snapped to the walkable grid): all 12 found. From Ernesto's post 83 to 140 px, from Hodan's 141 to 199 px. The raw sprite points of the second user lie a few pixels off the grid and give no path until snapped (5539) |
| Post or seat coordinate changes | none needed | | Posts, chairs and cells match the stage 4 measurements; no scenario coordinate changed |

## 2. Talk on the real atlases

| Check | Result | Game | Evidence |
|---|---|---|---|
| Ernesto's portrait and visemes | PASS | 5534 | Viseme sheet `ernesto_bautista_visemes.png` loaded; over 2 s of "Evening. Or morning..." the viseme frame went 0, 2, 3, 0, 3 and the portrait canvas changed with it. `out/talk-ernesto_bautista-5534.png` shows his own art |
| Hodan's portrait and visemes | PASS | 5534 | `hodan_warsame_visemes.png` loaded; frames 0, 1, 3, 2, 0 through "You lost? Everyone's lost tonight." `out/talk-hodan_warsame-5534.png` |
| Headshots | PASS | 5539, 5541 | The engine's own lookup (`npc-headshot.js` `headshotCandidates` on each NPC record) gives `ernesto_bautista_headshot.png` and `hodan_warsame_headshot.png`; both load at 32 x 32 |

## 3. Carried from stage 4

| Check | Result | Game | Evidence |
|---|---|---|---|
| Step 4, Val's `lockpick_used_in_view` catch | PASS | 5537 | Tries 0 and 1 opened the lockpick minigame (Val at x 237 and 141); try 2 with Val at (121, 85) opened `PersonChatMinigame` with the Narrator, `val_caught_picking` true. `out/val-catch-5537.png` |
| Step 5, attack mid-exchange | PASS | 5538 | Struck Ernesto after `night_watch_paper:1` was overheard: hostile, `night_staff_attacked` true. `exchange_cut` reason `pair_ended`, line 2 of 5, `heardLines` 2; `heard_night_watch_paper` true; no further line. Hodan idle 47.2 s and seated 47.7 s after the hit (round 4: 111.5 s), no break or exchange in the next 60 s |
| The 40 s mid-break variants (burn exchange after a running break, with and without the paper exchange played) | NOT RUN | | Out of budget |
| Whole-room walkthrough counts (10.2) | NOT RUN | | Out of budget |
| A break left to run with the player outside | PASS | 5555, 5556 | Player in the corridor: `npc_chatted` showed only `picture:caffeine`, `picture:social` and `picture:work` ids with `overheard` false; both coffee bags were still unset afterwards (unchanged) |
| The player walks in and hears a pool line on the next turn | FAIL | 5555, 5556 | 5556: Hodan's next turn was overheard 2.1 s after entry, but as `picture:social`, not a pool line; Ernesto's turn just before was `picture:work`, not overheard. 5555 heard nothing in 40 s, but that walk-in started before the pair were home, so it does not count. On 5556 every turn of the cooler break before it was a picture too, with the player in the room at 88 to 109 px and `overheard` true. Possibly the `chatterCooldownMin` of 2 after the entry break; not chased |
| Radio branch, burned, not cleared, told security | PASS | 5544 | "Security put a call out for some visitor. That's their department." then "Your department too, I'd have thought. You'll hear before I do."; Hodan's "Anything happening on the radio?" offered |
| Radio branch, burned, not cleared, not told | PASS | 5546 | Same first line, then "Always someone looking for someone, a night like this." |
| Reload after an attack, staff room loaded | PASS | 5540 | Started in the staff room, Ernesto struck twice (hp 80, hostile, `night_staff_attacked` true, one HaX text queued). After `about:blank` and a reload: still hostile at hp 80, Hodan at her post (117, 176), no HaX text queued again, no use, exchange or chatter event in 60 s. Talking to Hodan straight after showed no line within 1.5 s (the hostile porter was close); not followed up |
| KO timing: HaX strike text to KO text, fast knock-out | PASS, with a note | 5535 | Hodan knocked out at her post by 9 presses in 4.6 s (hp 100, 90, 80, 55, 55, 35, 35, 10, 0). Strike text delivered 2.3 s after the first punch, KO text 4.0 s after that. Four seconds apart is at the validator's limit for stacked toasts (texts under 4 s apart warn). Punch cooldowns make this about the fastest knock-out, so the texts do not stack; nothing changed. She fell at (118.6, 153.5) in the staff room |

## 4. Earshot from every floor cell

The probe moves the player's body to each walkable cell (`findNearestWalkableWorldCell`, 32 px steps over the staff room) and calls the world's `playerHears` for each speaker at radius 360 with all three `heard_` globals set. The body's centre lands about 31 px up and left of the cell (the reset offset), the same for both speakers; the scan also picks up a column of IT cells at x 340 and 372.

| Check | Result | Game | Evidence |
|---|---|---|---|
| Both heard from every cell, boiler break | PASS | 5552 | 112 of 112 cells hear both |
| Both heard from every cell, cooler break | FAIL | 5552 | Hodan heard from 112 of 112; Ernesto from 0 of 112, the closest at 123 px. In a later real cooler break (5556) with the player at (198, 165), `playerHears` and `canSeePlayerToFace` were true for both and his turns came through with `overheard` true at 109 px. So the scan contradicts the live break; could be a probe artefact (his facing or the reset offset) or a real blind spot. Needs a rerun with the player walked to each cell |

## 5. Not run

The 40 s mid-break variants; the whole-room walkthrough counts (crossings, pool lines heard, repeats and the needs-clock length); a seat close-up screenshot (my crop missed the canvas scale, so the seat evidence above is the runtime frame, chair and position).

## 6. Findings

- Walk-in pool line: with the player present, every turn on 5556 was a `picture:` line, so the "pool line on the next turn" target is not met. Check whether the 2-minute `chatterCooldownMin` explains it before treating it as a fault.
- Cooler earshot scan: Ernesto unheard from every cell in the scan (5552), heard live (5556). Rerun by walking the player.
- Hodan's held use after a mid-exchange cut is now 47.7 s to seated (round 4: 111.5 s, round 2: 102 s).
- KO timing gap 4.0 s: at the limit, not under it; no change.

## 7. Housekeeping

Games made and driven in this run: 5532 (script fault, partial), 5533 (script fault before any punch), 5534, 5535, 5537, 5538, 5539, 5540, 5541, 5544, 5546, 5552, 5553 (script fault, staff room not loaded), 5555, 5556. The server on 3092 was stopped by its PID at the end.

## R2 (2026-11-15, same branch, tip 654ca5f87)

Keyless server on 3092 again, headless, `setFPS(20)`, fixed steps on. Scripts and logs in the same scratchpad folder: `f1.mjs` (`f1-5561.log`), `f2.mjs` (`f2-5563.log`), `mb.mjs` (`mbA-5564.log`), with `lib2.mjs` (the round 1 library plus a compact event capture). The round was cut short when the sessions were wound down.

| Check | Result | Game | Evidence |
|---|---|---|---|
| FAIL 1 explained: why overheard turns were pictures | designed, no fault | 5561 | Every `_pickBark` call logged with the speaker's cooldown left. `chatterCooldownMin: 2` runs on the needs clock, which kept pace with wall time here. A heard line starts that speaker's 2-minute quiet; every heard turn inside it is a picture. Load break: Ernesto `coffee:2` at clock 8 s, Hodan `coffee:1` at 41 s, then pictures. A boiler break started at 73 s: all 16 turns pictures (quiet 11 to 88 s left). A cooler break straight after: Ernesto `cooler:2` (his quiet had just run out), Hodan pictures (quiet 11 to 23 s left). This is PLAN 2.5 as written ("with the 2-minute cooldown each speaker says at most one pool line a break, pictures between"). On 5556 the cooler break and the walk-in both fell inside the quiet left by the heard break before them. The T79 earshot gate on grumbles and mutters plays no part: the pair have no grumble pools, and nothing but a taken chatter line sets `chatterQuietUntil`. No scenario or engine change |
| The player walks in and hears a pool line on the next turn (cooldown run out) | PASS | 5561 | Quiet waited out, boiler break run with the player in the corridor: 3 turns, all `unheard` pictures, no line taken. Walk-in: Hodan's first heard turn `coffee:0`, then Ernesto's `coffee:3`; pictures after that |
| FAIL 2 explained: Ernesto heard from 0 cells at the cooler | probe artefact | 5563 | `canSeePlayerToFace` (`npc-behavior.js`) caches its answer for 150 ms (`FACE_SIGHT_MS`), keyed on time, not position. The round 1 scan ran every cell in one synchronous call, so each speaker got whatever it had cached first. Reproduced: with the cache kept, the scan now gives 0 of 88 for both speakers at both objects |
| Earshot, player walked to cells | PASS | 5563 | Player walked (`moveTo`) to 5 cells around the room during each break (the NW, SW, NE, north and SE areas): both speakers heard from 5 of 5 at the cooler and 5 of 5 at the boiler |
| Earshot, every floor cell | NOT RUN (partial) | 5563 | With the cache cleared per cell: 52 of 88 cells hear both at each object, and both speakers miss the same 36 cells. The body still landed up to 73 px off the target cell (`maxOff`), so those 36 are not trusted. Some lie within 75 px of the speaker, while walked cells in the same areas all hear. Needs a scan with a correct centre offset, or a full walk |
| 10.2 mid-break, paper already heard: no new break, burn exchange heard in the running break | PASS, with a note | 5564 | `cover_burned` and `heard_night_watch_paper` seeded. Mapping-1 break: Ernesto `using` 3.3 s after entry. Gary's conversation opened and closed in IT 5.4 s after the use started, then the player walked straight back. No new `npc_use_started`. `night_watch_burned` lines 0 to 2 all overheard, then `coffee:1` and pictures; `heard_night_watch_burned` true. Note: the capture did not show a `conversation_closed:gary_whitlock` event, so this proves that the running break plays the gated exchange; it does not prove that mapping 2 was absorbed. One try, not five |
| 10.2 mid-break, paper exchange already played in that break | NOT RUN | | Script ready (`mb.mjs` mode B) |
| Whole-room walkthrough counts | NOT RUN | | |
| Seat close-up screenshots | NOT RUN | | Script ready (`seat.mjs`: world rect to CSS pixels by camera zoom times canvas display scale) |

Totals after R2: 22 PASS, 0 FAIL, 4 NOT RUN (the cut-short items above). Both round 1 FAILs are closed, as designed behaviour and as a probe artefact.

Games made and driven in R2: 5561, 5563, 5564. The server on 3092 was stopped by its PID.

## R3 (2026-11-15, same branch, tip 3ea9e76ff)

Keyless server on 3090, headless, `setFPS(20)`, fixed steps on. Scripts and logs are in the session scratchpad `m02-s5/`: `ear3.mjs` (`ear3-5580.log`), `ear4.mjs` (5581), `mb2.mjs` (`mbB-5593.log`), `seat.mjs` (5607), `walk3.mjs` (`walk3-5608.log`).

| Check | Result | Game | Evidence |
|---|---|---|---|
| Earshot from every floor cell | PASS, with a note | 5580, 5581 | The centre offset is now corrected by iterating `body.reset` until `body.center` is within 1 px of the cell (`maxOff` 0, R2's was 73), and `_faceSightAt` is cleared per cell. 88 cells scanned with both at the cooler and again at the boiler: 52 cells hear both speakers at each object, the same 52 each time. The 36 that hear neither are 20 cells at y 340 and 372 (the corridor, not the staff room) and 16 inside the room's grid: the top row (y 20, x 20 to 308) and the east column (x 308, y 116 to 276). Those 16 are wall cells the path search calls walkable; the player cannot stand there. Walked on 5581 during a boiler break, `moveTo` to each: the body stopped at y 45 (centre 76) for the top row and x 274 to 276 for the east column, and both speakers were heard from every stopping point (8 of 8 including the room's west edge at x 52) |
| 10.2 mid-break, paper exchange already played in that break | PASS | 5593 | Started with `cover_burned` false. Player in the room, Ernesto `using` 3.5 s after entry; the paper exchange played `night_watch_paper:0` to `:3`, all 4 lines overheard. Gary's conversation opened and closed in IT with `cover_burned` set at the close (stand-in for the HaX mapping), 33.0 s after the use began; `conversation_closed:gary_whitlock` was seen this time (1 event). Back in the staff room 2.1 s later: no new `npc_use_started`, no burn exchange in that meeting (`coffee:1` and pictures only), `heard_night_watch_burned` false. At the next meeting (caffeine 20) `night_watch_burned:0` to `:2` all heard and `heard_night_watch_burned` true. One try. Note: `heard_night_watch_paper` still read false when logged 25 s into the break, so the paper exchange may not have finished its last line then; not read again afterwards. Variant B needs `cover_burned` false at the start, because the pair take the burn exchange before the paper one when it is already true (`scenario.json.erb:3554` to `:3556`); an earlier try with it seeded true (5584, 5585) played the burn exchange only and is not evidence either way |
| Whole-room walkthrough counts | FAIL against the targets (as scripted) | 5608 | 8 round trips, corridor to staff room to Kim's office and back, 3 s in the staff room each crossing, 14 s in Kim's office and 20 s in the corridor; 16 crossings, 378 s of needs clock (377 s wall). Pair at an object on 6 of 16 crossings (37.5 percent, target at least a third: met). Heard: 4 distinct pool lines (`coffee:2`, `coffee:1`, `coffee:3`, `coffee:0`; target at least 6), 1 exchange, and only its first line (`night_watch_paper:0`; target 2 exchanges), plus 6 picture turns. Repeats: 0 pool lines heard twice. Why short: the script is about 6 minutes and spends 3 s a crossing in the room, `cover_burned` was never set so the burn exchange could not run, and two thirds of the time the pair were idle. The target is for a full walkthrough with Gary's conversation; this run does not cover that, so the 6 lines and 2 exchanges are not shown either way. Needs a long run with the Gary step |
| Seat close-ups: Ernesto Bautista, Hodan Warsame | PASS | 5607 | Ernesto `sit_south_frame_000` at (223.0, 154.0), facing the table, cup in front of him, both teal chairs either side. Hodan `sit_north_frame_000` at (117.0, 176.0), seen from behind at the laptop desk with the cup beside it, her chair under her. Images: `m02-s5/out/seat-ernesto_bautista-5607.png`, `m02-s5/out/seat-hodan_warsame-5607.png`, room view `m02-s5/out/seat-room-5607.png` |

Totals after R3: 25 PASS (R2's 22 plus earshot, variant B and the seat close-ups), 1 FAIL (walkthrough counts, as scripted), 0 NOT RUN.

Games made and driven in R3: 5567 (script fault, staff room not loaded), 5580, 5581, 5584 and 5585 (burn seeded, not evidence), 5589 and 5590 (script fault, player left in the corridor), 5593, 5600 and 5606 (script faults in `seat.mjs`), 5607, 5608. The server on 3090 was stopped by its PID.

Suites after R3 (tip 3ea9e76ff): scenario validator for m02, 0 errors, 33 warnings (HANDOVER recorded 31 before the main merge); `lock_key_diff.rb` against `baseline_locks.json`: empty, exit 0; `validate_office_life.rb`: silent, exit 0; `bin/test-js`: 678 passed, 0 failed. The regenerated `dungeon_graph` files showed no change in `git status`, so nothing was committed for them.
