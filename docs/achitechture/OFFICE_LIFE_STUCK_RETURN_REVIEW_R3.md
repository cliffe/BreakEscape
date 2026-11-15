R3: 0 B, 1 M, 5 m

# Office life stuck return: code review R3

Scope: the R2 fix delta, `git diff e3267eb25..b0b2b9f2c -- public test tools` on build/ol-stuck-return (tip `b0b2b9f2c`), read against `OFFICE_LIFE_STUCK_RETURN_REVIEW_R2.md` (Outcomes) and the "Live re-check after code review R2" table in `OFFICE_LIFE_STUCK_RETURN.md`. User decisions in force: "Yes, improve NPC re-routing pathfinding." and "Yes, grumble lines should use same earshot approach." Read only; no servers started.

## Bounds walk (question 1)

**Walk home, wedged for good in one place.** Per return: stall 1 re-issues the plain path, stall 2 re-routes, stall 3 re-routes with a nudge (the place is marked `nudged`), stall 4 logs `return_stuck` once and backs off 15 s. The back-off seeds `s.stall` at tries 1, so each later round is one re-issue after the back-off, then re-routes at tries 2 and 3 and a back-off at 4. The third back-off is over `RETURN_STUCK_MAX_BACKOFFS` and abandons. First abandon: `replan: true`, a fresh walk home on the next tick, which runs the same cycle. Second abandon within reach: final, `late: 0`. Then three late walks 60 s apart (each a full cycle ending in a final abandon, `late` 1, 2, 3), then idle off its post until a job (`s.returnAbandon` is cleared at job pick, npc-needs.js:1519, and on arrival, :1475). Roughly 2 + 3 = 5 full cycles, each about 3 re-routes, 3 nudge requests (one per round), 2 back-offs and 1 abandon: some 15 re-routes, 10 back-offs, 5 abandons, 3 late re-plans, about 5 minutes of needs clock. Bounded in one place. Two gaps: m1 (two places) and m2 (the player as the blocker).

**Outbound leg.** Three re-routes per place (`job.stall`, nudge on the third), then `walk_stuck` once and re-watching until the job's deadline fails it (`timeout`, cooldown, walk home). A new place restarts the count, but the deadline bounds the leg, moved at most once by the m6 floor (`job.rerouteGrace`, a field of the job object, so a new job starts clean). Bounded; m3 covers the floor's one edge.

**Seating.** `POST_SEAT_RETRY_MAX` seat and `POST_FETCH_RETRY_MAX` fetch retries, then `seat_gave_up`. The give-up now expires after `SEAT_GIVE_UP_MS` or a later job, and the counts start again from 0. That bounds each window but not the session: m4.

## Findings

### M1. The nudge mark is set whether or not a nudge ran, so most wedges get the 56 px place

npc-needs.js:4098 (`if (tries === STUCK_TRIES) s.stall.nudged = true`) and npc-needs.js:4185 (the outbound twin) mark the place as soon as the third re-route asks for a nudge. Whether the body moves is decided later and elsewhere: `goToAndStay` nudges only when `_needsNudgeSafe` (npc-behavior.js:1417) passes, and `_nudgeToWalkable` (npc-behavior.js:1527) skips moves under 2 px. The guard added by R2 m1 refuses the common case on purpose: a body wedged against another body or a chair corner stands on a walkable cell of its own, and the nudge is skipped. The needs layer never learns that, so from the third stall onwards every place reaches `STUCK_SAME_PX + STUCK_NUDGE_REACH_PX` (56 px, 1.75 tiles), in `_stallTry` (:4144), `_watchWalk` (:4171) and `_abandonReturn` (:4113).

Two drifts widen it further:
- The back-off seed (:4084) re-centres the place on the current position and keeps the mark.
- `_abandonReturn` stores the latest position and makes the mark sticky across late walks (`nudged: nudged || (again && prev.nudged)`, :4122). A late walk with no nudge of its own still compares at 56 px.

Failure scenario (question 2): in a cluttered open plan, Hampshire's walk home wedges on a chair corner (stall 3, no nudge since her cell is walkable, place marked). After a back-off she threads 40 px on and wedges on the next desk's chair. That counts as the same place, at tries 2 or above, so she gets one re-route and then a back-off where she should have had a fresh three. She abandons, and her quick re-plan creeps another 40 px and abandons as final (within 56 px). Each late walk then gains 30 to 50 px and comes back `again`, so `late` climbs to 3 and she parks two tiles short of her desk until a job, after about four minutes of 15 s and 60 s waits. Before R2 the 24 px place kept those wedges apart. The M1 test (`npc-needs-stuck-walk.test.mjs`, "R2 M1") checks only that the move asked for a nudge (`homeMoves(w, sys).some(m => m.nudge)`), not that one ran, and no test checks that two wedges 25 to 56 px apart stay separate.

Fix:
1. Report the nudge back. `_nudgeToWalkable` already returns the landing point. Have `goToAndStay` keep `this._lastNudge = { dx, dy }` (or null), and have the world adapter's `moveTo` return it, or have the needs tick read it through `world`. Set `stall.nudged` (and the abandon's `nudged`) only when it is non-null.
2. Replace the flat 32 px reach with the nudge itself: keep the place's original centre plus the landing point, and count a stall as the same place when it is within `STUCK_SAME_PX` of either one. That covers the M1 case (back in the wedge, or where the nudge put it) and nothing between.
3. Do not re-centre on the back-off seed. Keep `x, y` from the first stall in the place.
4. Add a test: a refused nudge leaves the reach at 24 px, and two stalls 40 px apart with no nudge count as two places.

### m1. Late re-plans reset whenever an abandon lands in a different place, so two wedges can alternate for ever

npc-needs.js:4113 to 4123: `late` carries only when `again` (within reach of the previous abandon). Failure scenario: two routes home, each with a wedge, more than the reach apart (A in the doorway, B by the printer). A late walk from A, re-routed round held bodies, takes the B route and abandons at B: not `again`, so `late: 0, replan: true`. The quick re-plan wedges at B again (final, `late` 0). The next late walk takes the A route... Each minute one full cycle of searches and stall lines, for the session, with no cap. Cheap per minute but unbounded, and against the intent of R2 m2. Fix: count late walks per return, not per place. Keep `s.returnLate` cleared only on arrival home (:1475) and job pick (:1519), increment it in `_replanAbandoned` for every late try, and stop at `RETURN_FINAL_REPLANS` whatever the place.

### m2. A player standing in the way uses up the late re-plans, then the NPC parks off its post

npc-needs.js:1523 to 1526, :4131. The three late walks are spent 60 s apart regardless of why the walk failed. Failure scenario: the player stands in the kitchen doorway reading a board for four minutes. Tom's walk home abandons twice, takes his three late walks (all blocked by the player), and then stands in the kitchen until his next need fires, perhaps many minutes later in a quiet scenario. That is the "temporary blocker who steps away" case the R1 m2 late walk exists for. `_playerBeside` (npc-behavior.js:1425) already says when the player is the blocker. Fix: record `player: true` on the abandon when the player's body is within `NPC_STUCK_PLAYER_PX` of the NPC, and do not count a late walk that started under such an abandon toward the cap. Or, once the cap is reached, allow one more walk home when the player has moved more than two tiles from the abandon point. The tick already reads the player's position for the seating check.

### m3. The m6 floor can revive a leg whose deadline has already passed this tick

npc-needs.js:4188 to 4191 with :1501. `_watchWalk` runs before `_advanceJob`'s timeout check (:3410). On a tick where `clockMs >= job.deadline` and the stall watch also fires, `deadline - clockMs` is 0 or negative, below the floor, so the deadline moves to `clockMs + 10 s` and the job that should fail `timeout` now lives 10 s more. Once per job, so it is bounded, but for a borrow this is the version of the problem the full suite caught: the borrow's start window (:1856 skips the drop only while the job is live) closes during the extra 10 s, and the borrow is dropped and reported where it would have been re-picked. A queuer's `goto_target` also arrives 10 s late and is behind in the queue order. Fix: apply the floor only while the deadline is still ahead, `deadline > this.clockMs && deadline - this.clockMs < REROUTE_MIN_LEFT_MS`, and add the matching test (a stall that fires on the deadline tick times out). Separately, the live table ran tour rows 1, 3, 5 and 6 and the lab smoke on `c90193ecb`, which had the flat 15 s grace. Only row 2 run 3 ran on `36eda6c9d`, and row 2 is a walk home. The outbound floor has unit proof only, so the next live round should run one tour row with outbound re-routes on the tip.

### m4. The seat give-up expiry repeats every two minutes for the session, fetches included

seating.js:2067 to 2075. When the give-up expires, every count goes back to 0 and `_fetchTriedAt` is cleared, so a stop with a permanently unusable seat runs the full set again: up to 3 seat moves and 2 chair fetches every `SEAT_GIVE_UP_MS`, logging `seat_gave_up` each time. Failure scenario: Pierce's desk chair has been pushed under a table nobody can reach. Every two minutes he walks to a chair elsewhere and drags it back. Once `FETCH_CLAIM_MS` (60 s) has run out on that chair, a neighbour with the same problem can take it back on their own cycle, so two NPCs shuttle one chair for the session. Fix: on expiry, reset only the seat retries (sitting on chairs already at the post costs nothing), not the fetch count, or allow at most one fetch per stop per expiry. Also cap the expiries per stop key (for example 3) before a give-up lasts until the stop key changes. Optionally clear `_seatGaveUpAt` with `_seatGaveUp` on a new stop (:2062 to 2065), so the field never outlives the flag it dates (harmless today, since only :2090 sets the flag and :2091 sets the date with it).

### m5. Test gaps in the R2 additions

- `npc-needs-reroute-held.test.mjs:220`: the title says "settles and inserts a side step against a movable body", but `window.rooms = {}` means no room data, so no side step is inserted and the movable case does not assert one. The test does drive the live `handleNPCCollision` (imported from `public/break_escape/js/systems/npc-sprites.js`, not a copy) and reaches the `otherHeld` reads in the settle branch, so its m7 purpose holds. Fix: rename to "settles against a movable body; slides along a held one", or give it `roomData` with a walkable side cell and assert the insert.
- The M1 test: see M1, item 4.
- Exporting `handleNPCCollision` with `@private exported for unit tests` is acceptable. It only adds an export: the one in-file caller is unchanged and nothing else imports it. A grep for new importers belongs in the next review.

## Question 5: other checks, no finding

- The detour callback's early return (npc-behavior.js:1711) clears `a.pending` and leaves `this._avoid` alone, which is right: a replacement avoidance owns that field now.
- `job.rerouteGrace`, `job.stall.nudged` and `returnAbandon.late` live on per-job or per-return objects that a new job or arrival replaces. Needs state is not saved across a reload, so a reload starts every count at 0. The behaviour fields (`_seatGaveUp`, `_seatGaveUpAt`) are rebuilt with the behaviour.
- The comments on `RETURN_STUCK_MAX_BACKOFFS`, `RETURN_FINAL_REPLAN_MS`, `_abandonReturn` and `_watchWalk` match the code, apart from `_abandonReturn`'s "within STUCK_SAME_PX of the first", which now means within the widened reach of the previous abandon (update it with M1).
- `tools/playtest/lab-needs-smoke.mjs` hard-codes another worktree's `node_modules` and a Chromium path, as eight other playtest tools do. House style, so not a finding.
