# m01 office-life build report

Measured values only. Steps 0 to 4 so far; step 5 (Maya) and the remaining section 8 tests are added by the next agent.

| Step | Commit | Result | Measured |
|---|---|---|---|
| 0 Fatima, one-knot ink | 72afb4795 | pass | person NPC registers, talk, exit, re-talk, reload then talk; only 503s in console |
| 1 room tone | 377605400 | pass | validator 0 errors, lock diff empty |
| 2 desk PCs, seated extras | 85a96483e | pass | seated 0 px from chair centre; typing log count 2 at level 0.6; one pc sprite per Tiled pc |
| 3 leave after reveal, attacked texts, credits | 2b0cbe079 | static pass, live proof open | validator 0 errors, 21 warnings; lock diff empty |
| 4 cooler, thirst, breaks, exchanges | 33038138a | static pass, cooler live proof partial | validator 0 errors, 22 warnings; V1 9 NPCs, Fatima and Graham chatter 4, exchanges 2 |

## Step 4 live (game 7080, port 3094, real-time walking)
- Cooler: one object, id office_cooler, top-left (5.41, 8.19), 24x47.
- Fatima used it from body centre (5.65, 7.82), pose_drink facing up; Graham stood on the beside cell (6.87, 7.64). Both walked from desks in about 8 s (Fatima arrival t=25 from job start t=12 in needs ticks, Graham 9 s).
- ex_interns heard once (heard_ex_interns true) 54 needs-seconds after the first break; value kept after reload; heard_ex_biscuits still false in that run (second round pending, tools/playtest/m01-ol-exchanges.mjs).
- Sync during the run: 4 flushes, largest 1241 bytes, keys triggeredEvents, phoneState, scenarioClock, timedMessages, clientTs, globalVariables, notes (no growth).
- Step 0 503s: every "Completed 503" in tmp/server-3094.log pairs with a /break_escape/games/N/tts request (17 of 17 by path count); one stray pairing of a button.png line was an interleaved-log artefact (that request completed 200).
- Screenshots: screenshots/main-office-seated.png, screenshots/cooler-in-use.png.
- Spoken-line change: validator caps exchange bubbles at 40 characters, so SPOKEN_LINES 16, 21, 22 were shortened (38, 32, 39 characters); not voiced yet.
