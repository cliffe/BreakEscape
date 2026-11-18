# Live proof on m08: Agnieszka's return trip, unfixed against fixed engine

Branch fix/needs-return-npc-stall at e5bbe9694 (fix in f48c80af8). Keyless server on :3092 from this worktree. m08_the_mole, operations floor. Headless, throttleFps(20), TTS aborted by pathname, Mission Brief closed. Six fresh games made with new-game.rb, audit read in play (setup2.sh route), then trips started by setting thirst to 5 on julian_sallow and agnieszka_duda with window.__test.needs.set. Several trips per game, each started once she was home and idle plus 3 s. No globals set.

Unfixed engine: npc-pathfinding.js and npc-behavior.js from f48c80af8^ served through page.route (checked in page: no `tight` in the served file). Fixed engine: the files as on the branch.

Home is the `returned_post` event. "Return s" is time from first sampling as `returning` to home. Start was (427,141) on every trip but one (423,138). Vector stood at about (486,119 to 123).

## Per-trip results

| Engine | Game | Trip | Return began (s) | Home (s) | Return s | return_stuck | return_abandoned | return_resumed |
|---|---|---|---|---|---|---|---|---|
| unfixed | 9291 | 1 | 21.604 | 25.745 | 4.1 | 0 | 0 | 0 |
| unfixed | 9291 | 2 | 21.486 | 23.536 | 2.1 | 0 | 0 | 0 |
| unfixed | 9291 | 3 | 21.112 | 22.164 | 1.1 | 0 | 0 | 0 |
| unfixed | 9296 | 1 | 22.308 | 24.592 | 2.3 | 0 | 0 | 0 |
| unfixed | 9296 | 2 | 23.473 | 25.725 | 2.3 | 0 | 0 | 0 |
| unfixed | 9296 | 3 | 21.425 | 27.027 | 5.6 | 0 | 0 | 1 |
| unfixed | 9298 | 1 | 23.479 | 54.942 | 31.5 | 1 | 0 | 3 |
| unfixed | 9298 | 2 | 29.126 | 30.172 | 1 | 0 | 0 | 0 |
| unfixed | 9298 | 3 | 21.451 | 24.889 | 3.4 | 0 | 0 | 0 |
| fixed | 9305 | 1 | 21.611 | 54.021 | 32.4 | 1 | 0 | 3 |
| fixed | 9305 | 2 | 21.376 | 22.42 | 1 | 0 | 0 | 0 |
| fixed | 9305 | 3 | 21.088 | 23.106 | 2 | 0 | 0 | 0 |
| fixed | 9310 | 1 | 22.152 | 51.108 | 29 | 1 | 0 | 3 |
| fixed | 9310 | 2 | 22.838 | 26.018 | 3.2 | 0 | 0 | 0 |
| fixed | 9310 | 3 | 21.482 | 50.618 | 29.1 | 1 | 0 | 3 |
| fixed | 9320 | 1 | 21.668 | 26.051 | 4.4 | 0 | 0 | 0 |
| fixed | 9320 | 2 | 23.748 | 53.195 | 29.4 | 1 | 0 | 3 |
| fixed | 9320 | 3 | 21.811 | 25.164 | 3.4 | 0 | 0 | 0 |

Totals: unfixed 9 trips, 9 home, 1 stalled (return_stuck), 0 abandon. Fixed 9 trips, 9 home, 4 stalled (return_stuck), 0 abandon.

## Path samples every 1 s (the stalled trips)

Format: seconds from trip start, mode, sprite centre. The full samples for all 18 trips are in tmp/rs/trips.jsonl (field `samples`).

### unfixed game 9298

0s idle 427,141; 1s job:goto_target 422,132; 2s job:goto_target 460,149; 3s job:goto_target 520,153; 4s job:using 535,163; 6s job:using 535,163; 7s job:using 535,163; 8s job:using 535,163; 9s job:using 535,163; 10s job:using 535,163; 11s job:using 535,163; 12s job:using 535,163; 13s job:using 535,163; 14s job:using 535,163; 16s job:using 535,163; 17s job:using 535,163; 18s job:using 535,163; 19s job:using 535,163; 20s job:using 535,163; 21s job:using 535,163; 22s job:using 535,163; 23s returning 513,136; 25s returning 506,127; 26s returning 506,127; 27s returning 506,127; 28s returning 506,127; 29s returning 506,127; 30s returning 506,127; 31s returning 506,127; 32s returning 506,127; 34s returning 506,127; 35s returning 506,127; 36s returning 506,127; 37s returning 536,145; 38s returning 533,157; 39s returning 533,157; 40s returning 533,157; 41s returning 533,157; 43s returning 533,157; 44s returning 533,157; 45s returning 533,157; 46s returning 533,157; 47s returning 533,157; 48s returning 533,157; 49s returning 533,157; 50s returning 533,157; 52s returning 508,134; 53s returning 477,134; 54s returning 451,120; 55s idle 421,132

Events: level_set, urgent, job_start, windup, arrival, using, level_set, used, return_resumed, return_resumed, return_resumed, return_stuck, arrival, returned_post

### fixed game 9305

0s idle 427,141; 1s job:goto_target 422,132; 2s job:goto_target 489,157; 3s job:using 533,159; 4s job:using 533,159; 5s job:using 533,159; 6s job:using 533,159; 8s job:using 533,159; 9s job:using 533,159; 10s job:using 533,159; 11s job:using 533,159; 12s job:using 533,159; 13s job:using 533,159; 14s job:using 533,159; 15s job:using 533,159; 16s job:using 533,159; 17s job:using 533,159; 18s job:using 533,159; 19s job:using 533,159; 20s job:using 533,159; 22s returning 533,159; 23s returning 522,147; 24s returning 522,147; 25s returning 506,132; 26s returning 506,132; 27s returning 506,132; 28s returning 506,132; 29s returning 506,132; 30s returning 506,132; 31s returning 506,132; 33s returning 506,132; 34s returning 506,132; 35s returning 506,132; 36s returning 506,132; 37s returning 529,154; 38s returning 529,154; 39s returning 529,154; 40s returning 529,154; 41s returning 529,154; 42s returning 529,154; 43s returning 529,154; 45s returning 529,154; 46s returning 529,154; 47s returning 529,154; 48s returning 529,154; 49s returning 529,154; 50s returning 529,154; 51s returning 529,154; 52s returning 513,138; 53s returning 479,131; 54s idle 422,132

Events: level_set, urgent, job_start, windup, arrival, using, level_set, used, return_resumed, return_resumed, return_resumed, return_stuck, arrival, returned_post

### fixed game 9310

0s idle 427,141; 1s job:goto_target 422,132; 2s job:goto_target 496,154; 3s job:using 533,162; 4s job:using 533,162; 5s job:using 533,162; 6s job:using 533,162; 7s job:using 533,162; 9s job:using 533,162; 10s job:using 533,162; 11s job:using 533,162; 12s job:using 533,162; 13s job:using 533,162; 14s job:using 533,162; 15s job:using 533,162; 16s job:using 533,162; 17s job:using 533,162; 18s job:using 533,162; 19s job:using 533,162; 20s job:using 533,162; 21s job:using 533,162; 22s returning 523,148; 23s returning 506,132; 24s returning 506,132; 25s returning 506,132; 26s returning 506,132; 28s returning 506,132; 29s returning 506,132; 30s returning 506,132; 31s returning 506,132; 32s returning 508,133; 33s returning 508,133; 34s returning 508,133; 35s returning 532,157; 36s returning 532,157; 37s returning 532,157; 38s returning 532,157; 39s returning 532,157; 40s returning 532,157; 41s returning 532,157; 42s returning 532,157; 43s returning 532,157; 44s returning 532,157; 46s returning 532,157; 47s returning 532,157; 48s returning 532,157; 49s returning 532,157; 50s returning 502,139; 51s idle 454,128

Events: level_set, urgent, job_start, windup, arrival, using, level_set, used, return_resumed, return_resumed, return_resumed, return_stuck, arrival, returned_post

### fixed game 9310

0s idle 427,141; 1s job:goto_target 422,132; 2s job:goto_target 488,156; 3s job:using 534,161; 4s job:using 534,161; 6s job:using 534,161; 7s job:using 534,161; 8s job:using 534,161; 9s job:using 534,161; 10s job:using 534,161; 11s job:using 534,161; 12s job:using 534,161; 13s job:using 534,161; 14s job:using 534,161; 15s job:using 534,161; 16s job:using 534,161; 17s job:using 534,161; 18s job:using 534,161; 19s job:using 534,161; 20s job:using 534,161; 21s returning 525,150; 23s returning 509,131; 24s returning 509,131; 25s returning 509,131; 26s returning 509,131; 27s returning 509,131; 28s returning 509,131; 29s returning 509,131; 30s returning 508,133; 31s returning 508,133; 32s returning 508,133; 33s returning 508,133; 34s returning 520,145; 35s returning 529,154; 36s returning 529,154; 37s returning 529,154; 38s returning 529,154; 39s returning 529,154; 40s returning 529,154; 41s returning 529,154; 42s returning 529,154; 43s returning 529,154; 44s returning 529,154; 46s returning 529,154; 47s returning 529,154; 48s returning 529,154; 49s returning 529,154; 50s returning 464,139; 51s idle 422,132

Events: level_set, urgent, job_start, windup, arrival, using, used, return_resumed, return_resumed, return_resumed, return_stuck, arrival, returned_post

### fixed game 9320

0s idle 427,141; 1s job:goto_target 422,132; 2s job:goto_target 459,129; 3s job:goto_target 493,151; 5s job:using 528,166; 6s job:using 528,166; 7s job:using 528,166; 8s job:using 528,166; 9s job:using 528,166; 10s job:using 528,166; 11s job:using 528,166; 12s job:using 528,166; 13s job:using 528,166; 15s job:using 528,166; 16s job:using 528,166; 17s job:using 528,166; 18s job:using 528,166; 19s job:using 528,166; 20s job:using 528,166; 21s job:using 528,166; 23s job:using 528,166; 24s returning 528,166; 25s returning 510,125; 26s returning 510,125; 27s returning 510,125; 28s returning 510,125; 29s returning 510,125; 30s returning 510,125; 31s returning 510,125; 32s returning 510,125; 34s returning 510,125; 35s returning 510,125; 36s returning 510,125; 37s returning 528,144; 38s returning 532,156; 39s returning 532,156; 40s returning 532,156; 41s returning 532,156; 42s returning 532,156; 43s returning 532,156; 45s returning 532,156; 46s returning 532,156; 47s returning 532,156; 48s returning 532,156; 49s returning 532,156; 50s returning 532,156; 51s returning 532,156; 52s returning 493,148; 53s idle 449,135

Events: level_set, urgent, job_start, windup, arrival, using, used, return_resumed, return_resumed, return_resumed, return_stuck, arrival, returned_post

## Reading

- Pass criterion (fixed engine 8 of 8 home, no abandon loop): met. 9 of 9 home, return_abandoned never fired on either engine.
- The stall from game 9155 did reproduce, but only partly and not as the contrast we hoped for. On the unfixed engine 1 of 9 trips stalled (game 9298, first trip: held at about (506,127) for about 12 s, then (533,157) for about 15 s, home after 31.5 s, one return_stuck, three return_resumed). That is the same spot as the earlier log (508,125). The earlier 60 s loop with return_abandoned did not recur in 9 trips, so there is no unfixed abandon loop to contrast with.
- The fixed engine stalled MORE often in this sample: 4 of 9 trips (9305 trip 1, 9310 trips 1 and 3, 9320 trip 2), all the same shape: held at about (506 to 510, 125 to 133), then a second hold at about (529 to 533, 154 to 157), home after 29 to 32 s with one return_stuck and three return_resumed. Four of nine against one of nine is not a significant difference on this sample size, but it gives no support to the claim that the fix removes the stall in this room, and it does not show the fix making it worse either.
- Every stalled trip is recoverable within about 30 s on both engines; no trip needed more than one back-off. The two-hold shape (about (506,127) then about (533,157)) is the stuck/back-off/resume cycle of `_watchReturn`, not the abandon path.
- Not diagnosed here: whether the hold at about (506,127) is Vector's body at (486,~121) or the chair/desk objects nearer (earlier probes listed a chair near (520,112) and a desk at (556,131)). Because the fixed `tight` tier produced the same stall, the blocker may not be the ring search at all in this layout. A follow-up should log the planned path and the blocking body at the first hold on the fixed engine.
- Most stalls happened on a game's first trip or a trip after a clean one, with no clear pattern; 9 of 18 trips had a return under 5 s.

## Honest summary

No contrast was shown. The unfixed engine stalled once in 9 trips and never abandoned. The fixed engine got home 9 of 9 with no abandon loop, but stalled with a return_stuck in 4 of 9, so the fix is not shown to cure the m08 aisle stall. The synthetic test_npc_needs aisle proof and unit tests stand; this live m08 run neither confirms nor refutes them.

Games used: 9291, 9296, 9298 (unfixed); 9305, 9310, 9320 (fixed).
Driver files: tmp/rs/game.sh, setup2.sh, runtrip.sh, trip.js, pt/playtest-session.js (copy with an OLD=1 page.route hook), trips.jsonl.
