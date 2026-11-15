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
