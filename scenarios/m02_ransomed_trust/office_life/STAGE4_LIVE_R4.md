# m02 office life: stage 4 live checks, round 4 (2026-11-15)

Branch `build/ol-m02` (worktree HEAD 0894dd0fb at the end of the run), keyless server on port 3092 (stopped at the end), headless Chromium, `setFPS(20)` with fixed steps on. Real punches (key f) and real dialogue choices. Scripts, logs and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/m02-live-r4/` (`out/` holds the screenshots, `*.log` the run output). No scenario, ink or engine edits. Reload puts the player in the start room, and the Mission Brief reappears: both by design, not logged.

Seeding: the globals for the ink branches were set at game creation with `new-game.rb --set` (`heard_night_watch_burned`, `heard_night_watch_cleared`, `cover_restored`, `insider_asset_escaped`, `insider_ambushed`), not through the `window.__test` bridge. A client-side write to `gameState.globalVariables` (done on 5269 and 5270 for `cover_restored`) did not start the cleared exchange in 240 s, so the games that needed it were seeded on the server side instead. Games for the pair were started in the corridor (unlocked staff room), games for the reload check in the staff room.

## 1. Round 2 ink (HANDOVER item 5)

| Check | Result | Game | Evidence |
|---|---|---|---|
| No greeting replay after a reload; a re-entry line plays (both NPCs) | PASS | 5269, 5270 | First talk gave the greeting once ("Evening. Or morning..." and "You lost? Everyone's lost tonight."). After a reload: Ernesto "Back again?", Hodan "Still after your bit of quiet?" (5269) and "You again." (5270); no greeting, no first-meeting question (`i1a.log`, `i1b.log`) |
| Ernesto radio topic, burned, not cleared, told security | PASS | 5269 | "Security put a call out for some visitor. That's their department." then "Your department too, I'd have thought. You'll hear before I do." |
| Ernesto radio topic, burned, not cleared, not told | PASS | 5270 | Same first line, then "Always someone looking for someone, a night like this." |
| Ernesto radio topic, cleared, told security | PASS | 5282 | "Security had a call out for some visitor. Stood down now." then "Your lot sorted it, I expect. Paying you nights after all." |
| Ernesto radio topic, cleared, not told | PASS | 5283 | "Stood down now." then "Fuss over nothing, like I said." |
| Hodan's cleared topic | PASS | 5282, 5283 | "Did security find their visitor?" offered; reply "Called off. A mix-up with a list, they reckon." Her burned-only topic "Anything happening on the radio?" showed on 5269 and 5270 before the cleared global was set |
| Quiet-seeker re-entry | PASS | 5269, 5270 | Answered "Just looking for somewhere quiet" (5269): her re-entry lines read "Still after your bit of quiet?" on the next talk and after the reload. Answered "I know where I'm going" (5270): that line never came up |
| Cleared exchange plays when its gates are met (control) | PASS | 5281 | `cover_restored` and `heard_night_watch_burned` seeded: `npc_exchange_heard` for `night_watch_cleared` within 240 s, `heard_night_watch_cleared` true |
| Cleared exchange does not play after Graham escapes | PASS | 5271 | `insider_asset_escaped` seeded with the same gates: in 240 s the only exchange was `night_watch_paper`; `heard_night_watch_cleared` stayed false |
| Cleared exchange does not play after the press-terminal ambush | PASS | 5273 | `insider_ambushed` seeded: only `night_watch_paper` in 240 s; `heard_night_watch_cleared` false |

## 2. Attack probe and crossings (HANDOVER item 4)

| Check | Result | Game | Evidence |
|---|---|---|---|
| Step 4 regression, Val's `lockpick_used_in_view` catch | PASS | 5284 | Picking the security office door in the corridor. Tries 0 and 1 opened the lockpick minigame (Val at x 239 and x 181, outside her view); try 2 with Val at (107.6, 85) opened `PersonChatMinigame` with the Narrator and `val_caught_picking` true. `out/val-catch-5284.png` |
| Step 4 regression, Gary's `on_cabinet_picked` | NOT RUN | | Covered in round 1 (5137, 5139 to 5143); not repeated here |
| Step 5, attack mid-exchange, cut-off timing | PASS, with a note | 5291 | Struck after `night_watch_paper:1` was overheard. Log: `exchange_cut` reason `pair_ended` at line 2 of 5, `heardLines` 2, `exchange_heard` complete false; `heard_night_watch_paper` true; `night_staff_attacked` true; no further line. Hodan did not return to idle within 90 s and sat 111.5 s after the hit (round 2 part B: 102 s). The porter's hostile reading in `mid5291.log` says false because my script passed no id to the check; the attack global and the later behaviour show the hit landed (`out/mid-5291.png`) |
| Kim crossing, five tries | PASS 5 of 5 (target 4 of 5) | 5285 to 5289 | After the Kim conversation, on entering the staff room both were `using` on every try, 0 failed jobs, lines heard each time: `night_watch_paper:0` to `:3` (5285, 5288) or `:0` to `:4` (5286, 5287, 5289) |
| Cooler crossing, five tries | PASS 5 of 5 | 5290 | Porter thirst set to 20 with the player in the corridor. Each try: both `using` `staff_cooler`, the player went from the staff room to Kim's door in 2.7 to 2.9 s, stopped at (48, -302), `npc_job_failed` 0 across all five |
| Reload after an attack, staff room loaded | PASS | 5293 | Started in the staff room, porter struck twice (hp 80, hostile, `night_staff_attacked` true, one HaX text). After `about:blank` and a reload the player was in the staff room: porter still hostile hp 80, Hodan idle at her post (116, 174), no HaX text re-queued, and in 60 s no use, exchange or chatter event |

## 3. Staff-room objects and cups (HANDOVER item 1)

| Check | Result | Game | Evidence |
|---|---|---|---|
| Handover board, snag list, noticeboard, laptop each open with both NPCs `using` the boiler | PASS | 5294 | Each opened (board and noticeboard as a display, snag list in the notes minigame, laptop as the crypto workstation); both stayed `using` `staff_boiler` throughout |
| Lanyard opens with both `using` the boiler | PASS | 5297 | Opened as a readable display (`mode via-interaction-menu`); both `using` throughout. The first attempt on 5294 failed with `blocking-ui` because my script had left the laptop screen open |
| Board, snag list, noticeboard open with the porter at the microwave | PASS | 5295 | Porter `using` `staff_microwave` for the board and the snag list, and until the noticeboard opened |
| Laptop and lanyard open with the porter at the microwave | PASS | 5298 | Porter `using` `staff_microwave` for both; `out/item1-microwave-5298.png` |
| Three cups clickable with both seated | PASS | 5299 | `office-misc-cup`, `office-misc-cup3`, `mugs_tray1`: each click was `ok` (mode direct), inventory +1 each time; porter idle at (223, 154), Hodan idle at (116, 174). 5295 does not count: the porter was using the boiler at the time |
| Three cups clickable with the porter hostile | PASS | 5296 | Porter hostile (hp 80), idle; the same three clicks `ok`, inventory 3 to 6 |
| `room-snapshot.mjs` before and after the clicks | PASS, with a note | 5294 | `snap-before.json` 390 sprites, `snap-after.json` 389, all 13 rooms. Every scenario object (board, snag list, noticeboard, laptop, lanyard, cups, mug) is present and unmoved. The diff reports `be_light_soft` pool sprites reordered and one removed (#29) and a `talk` sprite 5 px different, all in the staff room: lighting sprites, not scenario objects. The diff tool exits "FAIL" on these. The lighting work on this branch landed during the run (0894dd0fb), so I did not chase it |
| `playerHears` from every floor cell at both objects; path search to the second-user cells | NOT RUN | | Out of budget |

## 4. Copier page (HANDOVER item 3)

| Check | Result | Game | Evidence |
|---|---|---|---|
| Page at x 6.92 on the copier | PASS | 5303 | `out/copier-page-5303.png`: the page lies on the copier's top, visible, beside Gary at his desk, clear of the wet-floor sign. Sprite (541, -46, depth -3) over the copier (522, -50, depth -3.5) |

## 5. Not run

Whole-room walkthrough counts, the gap between the HaX strike text and the KO text for a fast four-punch knock-out, Gary's cabinet catch (above), `playerHears` from every floor cell, path search to the second-user cells.

## 6. Findings

- The domestic's use after a mid-exchange cut is long (111.5 s from the hit to seated, against about 60 s for a normal break). Same as round 2 part B. No wrong behaviour followed. A product fix would shorten the held use when the exchange is cut (`_finishExchange` hold); the user should decide.
- The room snapshot diff is not clean: lighting sprites (`be_light_soft`) reorder between two snapshots of the same game and one drops out. Probably a lighting-loop effect; worth a look by whoever owns the lighting.
- Harness notes, not game faults: a client-side write to `globalVariables` does not start the cleared exchange; the laptop screen needs `dismissBlockingUi('×')` before the next interaction.

## 7. Housekeeping

Two games were loaded by mistake with the wrong id (5276 and 5277, killed within seconds, nothing played) and one with a failed walk (5300). I did not make those games. The server on 3092 was stopped; some headless browser processes from killed or failed scripts may still be running and I did not kill any I could not tie to my runs.
