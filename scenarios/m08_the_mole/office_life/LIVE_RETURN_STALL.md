# Live run R4: the re-issue after return_resumed plans round bodies (code review R3 follow-up)

Added 2026-11-18, branch fix/needs-return-npc-stall at 3c465a21c (HEAD only). Keyless server on :3092 from the worktree, headless, throttleFps(20), fixed steps on, TTS aborted by pathname, Mission Brief closed. Four fresh games from new-game.rb (9564, 9566, 9567, 9568), three trips each with docs/achitechture/reviews/return-stall/drivers/trip4.js: natural, then Vector nudged to y 152.7 and y 157.0 with body.reset (immovable value kept: false, enable true, in `_dynamicBlockers()` on all 12).

Change under test: every `return_resumed` re-issue now passes `reroute: true` (npc-needs.js `_watchReturn`), so it plans ring, then tight, then plain. Before, the first re-issue was plain.

| Game | Trip | Vector y start -> end | Body when `returning` began | Plan tiers while returning | Lane hits (nearestBlockerOnPath, lane 13) | Return s | return_resumed | return_stuck | Holds over 3 s |
|---|---|---|---|---|---|---|---|---|---|
| 9564 | 1 natural | 153.6 -> 153.6 | 534.4,188.2 | plain, ring | none | 3.5 | 0 | 0 | 0 |
| 9564 | 2 y152.7 | 152.7 -> 152.7 | 532.7,194.9 | plain | none | 3.6 | 0 | 0 | 0 |
| 9564 | 3 y157.0 | 157 -> 157 | 526.1,182.9 | none logged | none | 3.1 | 0 | 0 | 0 |
| 9566 | 1 natural | 153.6 -> 153.6 | 531.2,189.1 | plain, ring | none | 3.5 | 0 | 0 | 0 |
| 9566 | 2 y152.7 | 152.7 -> 152.7 | 531.2,189.4 | ring | none | 3.6 | 0 | 0 | 0 |
| 9566 | 3 y157.0 | 157 -> 157 | 536,188.6 | ring | none | 3.5 | 0 | 0 | 0 |
| 9567 | 1 natural | 153.6 -> 153.6 | 528.4,184.1 | plain, ring | none | 3.6 | 0 | 0 | 0 |
| 9567 | 2 y152.7 | 152.7 -> 152.7 | 532.1,197.2 | plain, ring | none | 3.6 | 0 | 0 | 0 |
| 9567 | 3 y157.0 | 157 -> 157 | 527.2,184.9 | plain, ring | none | 3.6 | 0 | 0 | 0 |
| 9568 | 1 natural | 153.6 -> 153.5 | 532.9,194.3 | plain x3, ring, plain x2, ring | Vector lat 10.5 (twice), lat -7.9 (twice), all plain plans | 5.6 | 1 | 0 | 1 |
| 9568 | 2 y152.7 | 152.7 -> 150.7 | 534.5,187.6 | plain | none | 2.1 | 0 | 0 | 0 |
| 9568 | 3 y157.0 | 157 -> 157 | 516.2,172.2 | ring | none | 3.0 | 0 | 0 | 0 |

Result: 11 of 12 trips home in 2.1 to 3.6 s with no hold. No return_stuck and no return_abandoned on any. One trip held (9568 trip 1, hold snapshot at 3 s of stillness, 5.6 s home, one return_resumed). Longest search 17.5 ms.

The one hold, explained. It was not the re-issue. The first walk home (`_moveReroute` false, plain by design for a fresh return) planned along y 164 and, from the cell (508,164), the behaviour layer's own re-plans were plain too (nearest agent_vector lat 10.5, fwd 21.6, inside the 13 px lane), so local avoidance stopped her. The return_resumed that followed planned a ring plan along y 172 (nearest null) and she went home on it; the previous engine would have re-issued plain along y 164 again. The snapshot (body 505.8,163.5, velocity 0, no `_avoid`, path along y 172 already adopted) was taken after that ring plan was in hand. So the fix does what it should for the re-issue, and the remaining exposure is the first, non-rerouted walk home: its plain plan can start in a standing NPC's lane (here 1 of 12 trips, one stop of about 3 s, cleared by the first resume). Planning the first return ring-first would remove it; that changes every needs walk home and is left for the owner.

# Live contrast R3: f48c80af8 against the branch, instrumented (code review R3, m3)

Added 2026-11-18, branch fix/needs-return-npc-stall at 5bb5cf541 (engine) with the driver fix noted below. Keyless server on :3092 from the worktree, headless, throttleFps(20), fixed steps on, TTS aborted by pathname, Mission Brief closed. Six fresh games from new-game.rb, alternating f48c80af8 (its npc-pathfinding.js and npc-behavior.js served through the page.route hook, OLD=1; the hook previously served f48c80af8^), then HEAD, three games each, three trips per game with `drivers/trip4.js` (trip3.js plus the logs R3 asked for). Trip 1 of each game is natural (Vector where earlier play left him); trips 2 and 3 nudge only his y with `body.reset` to 152.7 and 157.0 (x kept, `immovable` as found). No globals set, no game row edited. Each trip started once she was home and idle plus 3 s, with thirst 5 on julian_sallow and agnieszka_duda.

Per-trip logs: before the trip, Vector's `body.immovable`, `body.enable`, velocity, whether `_dynamicBlockers()` holds `agent_vector`, her start body centre; at the start of `returning`, her body centre; after each return plan, `nearestBlockerOnPath(pos, path, _dynamicBlockers(), 42, 13, 0)`.

| Game | Engine | Trip | Vector body y at trip start -> end | immovable / enable / velocity / in _dynamicBlockers() | Her start (idle) | Her body when `returning` began | First return plan tier | nearestBlockerOnPath on the first return plan | Later plans with a lane hit | Return s | return_resumed | return_stuck | Hold snapshots |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 9529 | old | 1 | 153.6 -> 151.3 | false / true / 0,0 / true | 425,182 | 530.4,185.9 | plain | null | plain lat 12.7 | 4.1 | 0 | 0 | 0 |
| 9529 | old | 2 | 152.7 -> 152.7 | false / true / 0,0 / true | 425,182 | 521.9,176 | plain | null |  | 3.1 | 0 | 0 | 0 |
| 9529 | old | 3 | 157 -> 157 | false / true / 0,0 / true | 425,182 | 519.7,175.7 | plain | null |  | 3.2 | 0 | 0 | 0 |
| 9532 | new | 1 | 153.6 -> 153.4 | false / true / 0,0 / true | 425,182 | 532.6,192.7 | ring | null | plain lat -7.8; plain lat 10.6 | 9.6 | 2 | 0 | 1 |
| 9532 | new | 2 | 152.7 -> 152.7 | false / true / 0,0 / true | 425,182 | 515.9,171.9 | ring | null |  | 3.1 | 0 | 0 | 0 |
| 9532 | new | 3 | 157 -> 157 | false / true / 0,0 / true | 425,182 | 534,185.2 | - | null |  | 3.6 | 0 | 0 | 0 |
| 9536 | old | 1 | 153.6 -> 153.6 | false / true / 0,0 / true | 425,182 | 529.4,198 | ring | null |  | 3.6 | 0 | 0 | 0 |
| 9536 | old | 2 | 152.7 -> 152.7 | false / true / 0,0 / true | 425,182 | 532.7,194.1 | plain | null |  | 3.6 | 0 | 0 | 0 |
| 9536 | old | 3 | 157 -> 157 | false / true / 0,0 / true | 425,182 | 538,186.8 | plain | null |  | 3.5 | 0 | 0 | 0 |
| 9540 | new | 1 | 153.6 -> 153.6 | false / true / 0,0 / true | 425,182 | 532,191.8 | ring | null |  | 3.6 | 0 | 0 | 0 |
| 9540 | new | 2 | 152.7 -> 152.7 | false / true / 0,0 / true | 425,182 | 532.8,193.6 | plain | null |  | 3 | 0 | 0 | 0 |
| 9540 | new | 3 | 157 -> 157 | false / true / 0,0 / true | 425,182 | 532.5,191.4 | ring | null |  | 3.6 | 0 | 0 | 0 |
| 9542 | old | 1 | 153.6 -> 151.4 | false / true / 0,0 / true | 425,182 | 535.9,190.3 | plain | lat 12.6 fwd 21.6 | plain lat 12.6 | 4.1 | 0 | 0 | 0 |
| 9542 | old | 2 | 152.7 -> 152.7 | false / true / 0,0 / true | 425,182 | 532,192 | ring | null |  | 3.6 | 0 | 0 | 0 |
| 9542 | old | 3 | 157 -> 157 | false / true / 0,0 / true | 425,182 | 530.5,191.3 | ring | null |  | 3.5 | 0 | 0 | 0 |
| 9550 | new | 1 | 153.6 -> 153.6 | false / true / 0,0 / true | 425,182 | 532.3,192.2 | ring | null |  | 3.7 | 0 | 0 | 0 |
| 9550 | new | 2 | 152.7 -> 152.7 | false / true / 0,0 / true | 425,182 | 520.2,174 | ring | null |  | 3.1 | 0 | 0 | 0 |
| 9550 | new | 3 | 157 -> 157 | false / true / 0,0 / true | 425,182 | 525.7,183.2 | plain | null |  | 3.6 | 0 | 0 | 0 |

Reading.
- Vector was a lane blocker on every one of the 18 trips: `immovable` false, `enable` true, velocity 0, present in `_dynamicBlockers()`. So the R3 explanation 1 (Vector invisible to the lane check because he was an immovable body) is ruled out for this layout, on both engines. Placing him at 152.7 and 157.0 left those values as found.
- f48c80af8: 0 of 9 trips held (none over 3 s, no hold snapshot, no return_stuck), all home in 3.1 to 4.1 s. The first return plan had no lane blocker in 7 of 9 trips (`nearest` null: a ring plan, or a plain plan that leaves the y 164 leg), and a lane edge hit in 2 (lat 12.6 and 12.7, fwd 21.6) that she walked through without a stop. The stall needs a plain plan from the start cell (508,164) with Vector 10 to 11 px off the y 164 leg; none of the nine old-engine trips produced that plan. Her body when `returning` began varied from x 520 to 538, y 174 to 198, and with it the first plan; a thirst trip does not reproduce the old stall on demand. This closes m3 on the "log shows why it cannot" branch: the setup is sound (Vector a blocker, at the stalling height), the old engine simply was not given the plan that stalls it in these nine trips.
- HEAD: 8 of 9 trips home in 3.0 to 3.7 s. One trip held (game 9532 trip 1, Vector natural at y 153.6, her body 532.6,192.7 at the start of the return): home after 9.6 s, return_resumed twice, no return_stuck, one hold snapshot at 26.9 s (sprite 506,132.4, body 496..516 x 158.4..168.4, velocity 0, 12 of 12 frames in `_handleBlockerAhead`, `gaveUp` false). Plan record: the first plan was the ring plan (a y 172 path, `nearest` null). The walk stopped when the next plans, tier `plain` from (508,164), ran along y 164: `nearest` agent_vector lat 10.6, fwd 21.6, the lane stop. The ring re-plans (y 172, `nearest` null) came 2 to 3 s later and she walked home. So HEAD does not stall for 30 s, but it is not hold-free: a plain plan is still issued from the start of the return (the first `return_resumed` re-issue is plain by design) and it can put her back in Vector's lane. The pass condition "HEAD must not hold" is not met by this run; the old 30 s loop (return_stuck, 15 s back-off) did not occur.
- Driver fix made during the run: the first attempt logged `nbpLoaded: false` (the resource-timing list does not hold the dynamically imported npc-behavior.js); the aborted game 9524 (one trip) is not in the table. trip4.js now imports `/break_escape/js/systems/npc-behavior.js` directly (pure function, same engine file via the hook).

---

# Live contrast on m08, same session: old engine against the branch engine (code review R2, m3)

Added 2026-11-18, branch fix/needs-return-npc-stall at b8a345be7. Keyless server on :3092 from the worktree, headless, throttleFps(20), fixed steps on, TTS aborted by pathname, Mission Brief closed. Four fresh games made with new-game.rb, alternating engines (old, new, old, new), the audit read in play, then two trips per game with Vector's body placed through the bridge and Agnieszka's and Julian's thirst set to 5 once she was home and idle plus 3 s. The old engine is npc-pathfinding.js and npc-behavior.js from f48c80af8^ served through the page.route hook (OLD=1 in the playtest session). No globals set, no game row edited. Driver: `docs/achitechture/reviews/return-stall/drivers/trip3.js`, `runtrip3.sh` and `game3.sh` (a copy of diag.js with placement, the tier record and `performance.now()` round every plan from her position; it snapshots every body, blocker and path at any hold of 3 s).

| Game | Engine | Trip | Vector body centre | Return s | return_stuck | return_abandoned | return_resumed | Hold over 3 s | Tier seen |
|---|---|---|---|---|---|---|---|---|---|
| 9465 | old | 1 | 486.4, 152.7 | 3.6 | 0 | 0 | 0 | no | n/a |
| 9465 | old | 2 | 486.4, 157.0 | 3.6 | 0 | 0 | 0 | no | n/a |
| 9469 | new | 1 | 486.4, 152.7 | 3.5 | 0 | 0 | 0 | no | held detour |
| 9469 | new | 2 | 486.4, 157.0 | 3.6 | 0 | 0 | 0 | no | held detour |
| 9472 | old | 1 | 486.4, 152.7 | 3.6 | 0 | 0 | 0 | no | n/a |
| 9472 | old | 2 | 486.4, 157.0 | 3.6 | 0 | 0 | 0 | no | n/a |
| 9474 | new | 1 | 486.4, 152.7 | 3.6 | 0 | 0 | 0 | no | held detour |
| 9474 | new | 2 | 486.4, 157.0 | 3.6 | 0 | 0 | 0 | no | held detour |

Findings.
- No contrast. 4 of 4 old-engine trips and 4 of 4 new-engine trips went home in 3.5 to 3.6 s with no hold over 3 s, so no hold snapshot was taken on either engine. The old engine did not stall at the stalling height in this session, so these eight trips neither support nor weaken the earlier 4 of 9 stalls. The unit test (`m08: a rerouted walk home...`) remains the proof that the old planner puts the path inside the lane; it fails on f48c80af8.
- Vector did not move in any trip (body centre after equals before).
- Why the old engine stayed clear here is not established. Every trip began from the same start and made the same plan sequence (a plain first plan, then at most one ring plan of 0.2 to 0.6 ms), none was held, and no snapshot exists. The earlier stalls may need a different start cell or a wedge before the return; a thirst trip does not reproduce it on demand.
- The 6 s hold in game 9411 trip 1 (sprite (506,132), two return_resumed) did not recur in any of the eight trips, so there is no snapshot to explain it. It matches the diagnosed mechanism (two re-plans on the same path before the third found the way) and cleared without return_stuck; treat it as unconfirmed.
- Tier-chain time (`performance.now()` round every `findWorldPath` from her position, including nested callbacks): the first plan of a trip 5.7 to 14 ms (cold, plain, includes the first search on that grid), every later plan 0.1 to 0.6 ms (ring or plain). No failed search occurred in eight trips, so no flood was measured and no held, tight, moving chain ran past its first tier. The reviewer's bench figures for a failed flood (34 ms on 120x120, 190 ms on 300x300) stand; see OFFICE_LIFE_STUCK_RETURN.md.

---

# Live proof on m08: Agnieszka's return trip, new engine (f401b9ee0 and later)

Added 2026-11-18, branch fix/needs-return-npc-stall at 82466fa7d (engine as in f401b9ee0). Keyless server on :3092 from this worktree, headless, throttleFps(20), fixed steps on, TTS aborted by pathname, Mission Brief closed. Three fresh games made with new-game.rb, audit read in play (setup2.sh route), then each trip started by setting thirst to 5 on julian_sallow and agnieszka_duda, once she was home and idle plus 3 s. No globals set, no game row edited. Driver: docs/achitechture/reviews/return-stall/drivers/trip2.js and runtrip2.sh (trip.js plus Vector's body centre and the tier record `_planTier/_detourTier` sampled while she returns).

Why Vector's height matters (DIAGNOSIS_M08.md): the old return leg ran along body y 164, so it stalled only when Vector's body centre was at y 151 or more (within the 13 px lane). Body y 140 to 145 never stalled. Vector's body stood at y 153.6 at the start of games 9400 and 9404 with no help, and gets shoved up by her trips, so later trips cover the low-y case too. On game 9411 he was placed through the test bridge (`sprite.body.reset`, body centre x 486.4, y 152.7, 157 and 150) so the stalling height was exercised on purpose; those three rows say "placed".

| Game | Trip | Vector body centre at start | Placed | Return s | return_stuck | return_abandoned | return_resumed | Tier seen |
|---|---|---|---|---|---|---|---|---|
| 9400 | 1 | 486.4, 153.6 | no | 3.0 | 0 | 0 | 0 | held detour |
| 9400 | 2 | 486.4, 153.6 | no | 3.0 | 0 | 0 | 0 | held detour |
| 9400 | 3 | 486.4, 153.6 | no | 3.0 | 0 | 0 | 0 | held detour |
| 9400 | 4 | 486.4, 153.6 | no | 3.0 | 0 | 0 | 0 | held detour |
| 9400 | 5 | 486.3, 153.5 | no | 3.1 | 0 | 0 | 0 | held detour |
| 9404 | 1 | 486.4, 153.6 | no | 2.2 | 0 | 0 | 0 | none needed |
| 9404 | 2 | 486.4, 150.9 | no | 5.5 | 0 | 0 | 0 | held detour |
| 9404 | 3 | 486.4, 144.0 | no | 5.4 | 0 | 0 | 0 | ring, held detour |
| 9411 | 1 | 486.4, 152.7 | yes | 7.6 | 0 | 0 | 2 | ring, held detour |
| 9411 | 2 | 486.4, 157.0 | yes | 4.5 | 0 | 0 | 0 | ring |
| 9411 | 3 | 486.4, 150.0 | yes | 5.8 | 0 | 0 | 0 | ring |

11 trips, 11 home, 0 return_stuck, 0 return_abandoned. Eight trips began with Vector's body at y 151 or more (the case that stalled before: 4 of 9 trips on the earlier fixed engine, all about 30 s); six of them natural, two placed. No tight tier was needed on this layout: the ring tier, with standing NPCs no longer given the near-end softening, plans clear of his lane.

Longest hold while returning: game 9411 trip 1 (Vector at the stalling height 152.7), held about 6 s at sprite (506,132) with two return_resumed, then home at 7.6 s. That is the earlier hold spot (about (506,127) to (510,125)) but it cleared on the next re-plan; the earlier engine held there for 12 s, was flagged return_stuck, backed off 15 s and took 29 to 32 s. No other trip held longer than 3 s. Samples for every trip are in a scratch trips2.jsonl (not kept) (field `samples`).

Not shown: an unfixed contrast in this session. The earlier rows below are that contrast (1 of 9 unfixed and 4 of 9 stalled on the first fix; the diagnosis explains the spread by Vector's height).

---

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

Format: seconds from trip start, mode, sprite centre. The full samples for all 18 trips are in a scratch trips.jsonl (field `samples`, not kept in the repo).

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
Driver files: docs/achitechture/reviews/return-stall/drivers/ (game2.sh, setup2.sh, runtrip2.sh, trip2.js, rundiag.sh, diag.js), pt/playtest-session.js (copy with an OLD=1 page.route hook), trips.jsonl.
