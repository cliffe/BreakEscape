R1: 0/2/9

# Office life stuck return: code review R1

Reviewed: `git diff 97b8dbb25...HEAD` on build/ol-stuck-return at `67bf8502f` (engine files npc-behavior.js, npc-needs.js, npc-pathfinding.js, npc-sprites.js, seating.js; scenario test_needs_sims; the new and changed node tests). Read only; nothing was run.

## Reach of the change (context for every finding)

- No m01 to m10 scenario has an NPC with `needsHome` (grep of every `scenarios/m*/scenario.json.erb`). The needs walk watch, the re-route with `includeHeld`, the bounded give-up, the seating retries, the listen radius and the earshot gating only reach scenarios with needs NPCs: lab_physical_pentest and the test_* scenarios (test_needs_sims, test_npc_needs, test_seating, test_access_*, test_needs_attack, test_needs_leash, test_capture_log, test_clone_left_card).
- m01 to m10 see two changes only: `nearestBlockerOnPath` (every path-following walker) and the settle guard (`npc-sprites.js:1405`, NPCs with `immovable: true`: three in m02, one in m09; five in lab_physical_pentest, two in lab_social_engineering).
- Patrols in m02, m03, m04, m06, m07, m09 and m10 are all two-waypoint loops (m10 has five). I found no tailgate lever in m01 to m10 and no scripted `goToAndStay` route in their scenario files. The final approach to a route-action waypoint (`mustReach`, `npc-behavior.js:1336`) has one waypoint left, so it takes the heading check exactly as before. Hostile chases follow `chasePath` (`npc-behavior.js:2512`) and never call `_handleBlockerAhead`. A guard's stop at a corner for a player just past it is the only visible change, and that player is on the guard's path within 42 px anyway. I see no cutscene or patrol timing that stalls.
- Earshot gating: the only scenario mappings on these events are `npc_overheard_login:sam` (test_access_work, which `login_aloud` feeds and which stays spoken) and `see_printer_grumble` (test_needs_sims), which ticks on `npc_print_blocked`. That event is emitted before the grumble is picked (`npc-needs.js:3803`), so it is unaffected. The workaround runner's `lineSaid` (`npc-workarounds.js:224`) only reads the `login_aloud` topic. No ink is tied to a grumble. Nothing a mission relies on goes unheard.
- Spoken text: the engine diff adds log event names and comments only; no line of speech is in engine code.

## Findings

### M1. Every needs detour now avoids all chairs and seated bodies, with no fallback
`public/break_escape/js/systems/npc-behavior.js:1678` (`_requestDetour`)

`_requestDetour` passes `includeHeld: true` for every needs walk, the first detour round the player included, not only after a stall. With `includeHeld`, `_avoidDynamicPositions` blocks every chair body in `window.chairs` and every seated NPC, each with a one-cell ring (the ring is only open within two cells of the start and the goal). `_planMovePath` falls back to the plain search when that finds nothing (`npc-behavior.js:1700`); `_requestDetour` does not, and sets `a.gaveUp`.

Failure: in a furnished office (lab_physical_pentest, or test_needs_sims between the desks), a needs walker meets the player in an aisle lined with tucked-in chairs. Before this branch the detour could pass beside the chairs. Now the rings close the aisle, the search returns nothing, and after `AVOID_GIVEUP_MS` the walker squeezes into the player at reduced speed, then loops through the squeeze cooldown until the stall watch's re-route catches it. That is the bump this branch set out to remove, and it is worst in exactly the dense rooms the change targets.

Fix: in `_requestDetour`, run the `includeHeld` search only when `this._moveReroute` is set (as `_planMovePath` does), or on an empty result retry with plain `avoidDynamic` before setting `gaveUp`. Add a node test: a needs walker, a player ahead and chairs that close the only held-aware route; the detour should still be found.

### M2. The post seat retry and the post fetch retry never stop
`public/break_escape/js/systems/seating.js:2032` (retry), `:2053` (seat move), `:2061` (fetch)

At its post a standing needs NPC tries its chair again every 4 s of needs clock and fetches again every 15 s, for as long as it stands at that stop. Neither has a cap. When the seat cannot be reached the same way each time, that is an endless visible loop.

Failure: a chair within 36 px whose seat move ends `walk_stuck` against a desk corner (Tom's first fetch in 5413 to 5415 ended this way) is walked at and abandoned every 4 s for the rest of the session. A fetch whose push always ends short (the geometry the round 5 handover described) shoves the chair across the floor every 15 s for ever. Each fetch also emits `npc_fetching_chair`. A scenario with a mapping on that event fires it every 15 s.

Fix: count tries per stop (for example `behavior._seatTries`, cleared with `_fetchTriedAt` on a new stop key), and stop after about three seat tries and two fetch retries. Log a `seat_gave_up` line so a proof run can see it. Add a rig test in which the seat move always sticks, and check that the tries stop.

### m1. Back-offs are counted per return, not per place
`public/break_escape/js/systems/npc-needs.js:4055`

`_stallTry` resets the try count when a stall is more than 24 px from the last one, but `s.returnBackoffs` is only cleared by a fresh `_goHome` or by `_abandonReturn`. The comment says back-offs are counted in one place. Failure: a long walk home that is held for a while at a doorway, then by a queue, then by the player (three different places) hits `return_abandoned` on its third back-off although it never failed twice anywhere. Fix: reset `returnBackoffs` in `_watchReturn` when `_stallTry` starts a new place (tries back to 1 outside a back-off), or store the count on `s.stall`. The test "stalls in different places are not counted together" checks tries only; extend it to back-offs.

### m2. A final abandon leaves the NPC off its post with nothing to bring it home
`public/break_escape/js/systems/npc-needs.js:4088`

After a second abandon within 24 px, `returnAbandon.replan` is false and the NPC idles where it stands, `atPost` false, until the selector starts a job. Failure: the player stands in a corridor until Marek abandons twice, then walks away. Marek stays in the corridor, possibly in the only way to a desk or door, until a need runs out, which can take minutes. Seating gives him no stop (`needsStop` is null idle off-post), so he stands. Fix: let a final abandon re-arm one re-plan after a long quiet time (for example 60 s of needs clock), or as soon as nothing in `_dynamicBlockers` is within 48 px of where it gave up.

### m3. The needs stall watch pre-empts the behaviour layer's own stuck recovery
`public/break_escape/js/systems/npc-needs.js:4048`, `public/break_escape/js/systems/npc-behavior.js:1436`

The needs watch re-issues after `RETURN_YIELD_MS` (3 s). `_checkPathStuck` acts after `NPC_STUCK_MS` (4 s), and the re-issue gives it a new path and a search in progress, which re-arms its watch. So for a needs walk, `_recoverFromStuck` (with its attempt 2 `_nudgeToWalkable`, the step that frees a body standing in a grid-blocked cell) rarely or never runs, and the `_moveReroute = true` set there is mostly dead. I am not sure of this without a live trace. If it holds, a needs NPC wedged half inside a blocked cell keeps re-planning from the same start. Fix: make `RETURN_YIELD_MS` for the stall watch longer than `NPC_STUCK_MS` (for example 5 s), or run `_nudgeToWalkable` on the second re-route in `_watchReturn` and `_watchWalk`. Check `walk_rerouted` against the `🧱` recovery lines in a proof log.

### m4. The open ring near the ends also opens the player's clearance ring
`public/break_escape/js/systems/npc-pathfinding.js:465`, `:488`

`nearEnd` applies to every body that `avoidBody` sees, the player included, though the comment justifies it by chairs and seated neighbours. Failure: Marek starts a re-route standing beside the player (the wedge case). The ring cells round the player within two cells of his start are open, so the path can hug the player's body. The first leg can then pass within the 13 px lane, and `nearestBlockerOnPath` holds him again. Fix: apply the end exemption only to held NPC bodies and chairs (`avoidBody(body, npc, { soft: true })`), and keep the player's ring.

### m5. Per-frame allocations in `_handleBlockerAhead`
`public/break_escape/js/systems/npc-behavior.js:1574`, `:119`

Every path-following walker, every frame, copies the rest of its path (`path.slice(this.pathIndex)`, often dozens of points on a cross-office path), builds a `segs` array and spreads a hit object. With a dozen walkers at 60 fps that is about two thousand short-lived arrays a second, for a look-ahead that never needs more than the first few points. Fix: pass `(path, startIndex)` into `nearestBlockerOnPath` and read the points in place; stop building segments once `used >= lookAhead`, as it already does, and skip the spread until a better hit is found.

### m6. A chair parked short of its owner's post is free to any other fetcher, now every 15 s
`public/break_escape/js/systems/seating.js:2048`

`chairAtOtherPost` owns a chair for another post only when its foot is within 36 px of that post. A chair left 37 to 49 px from its owner's home cell (the push-short case in the round 5 handover) belongs to nobody, and any standing NPC with `fetch` preference within 192 px can take it on its 15 s retry. Failure: Tom and a second chairless fetcher both retry, and the chair is fetched back and forth while neither sits for long. Fix: also count a chair as another NPC's when it is nearer to that NPC's post than to this one's own home cell and within `FETCH_RANGE` of that post, or record the last fetcher on the chair (`chair.fetchedBy`) and let only that NPC re-fetch it while it is at its post.

### m7. Tests: the settle guard and the needs-layer interplay are untested
`public/break_escape/js/systems/npc-sprites.js:1405`; `test/js/npc-needs-stuck-walk.test.mjs`

The settle guard (the fix for the 70 s freeze in game 5347) has no test; `handleNPCCollision` is not exported and nothing drives it. The stuck-walk tests use the stub world and cover the counters well, but no test covers: a conversation freeze during a back-off (unfreeze calls a fresh `_goHome` and resets the counts: intended, but unproven); a job picked during a back-off (`returnStuckUntil` is left set); or `_watchWalk` during a deliberate behaviour-layer wait. The `nearestBlockerOnPath` tests do drive a walker (the 5443 shape), which is good. Fix: export a small `settleOnContact(npcBehavior, otherBody)` helper and test that it settles against a movable body and not against an immovable one; add the two back-off interplay cases.

### m8. `coffee_notice_beat` stays on if Marek never gets his cup
`scenarios/test_needs_sims/scenario.json.erb:713`

The beat clears only on `npc_used:office_coffee` by Marek. Failure: the player reads the notice, then switches the coffee off (row 3) before Marek pours, or Marek's walk ends `walk_stuck` and times out (5430). The global stays true, so every later Marek coffee run (row 1, the Activity Board) sets Sanjay's caffeine again: the game 5347 problem this beat was added to stop. Fix: also clear it on `npc_returned_post:marek`, or on `npc_job_failed:marek` with target `office_coffee`.

### m9. The doc's cross-mission note for the listen radius is wrong
`docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md:28`

The round 7 note says seated staff in m01 to m10 look round more. `listenTarget` is only called from `updateNeedsSeat` (`seating.js:1988`) with the needs system's speakers, and no m01 to m10 scenario has needs NPCs, so m01 to m10 are unaffected. The round 8 note on `nearestBlockerOnPath` and the settle guard is the real cross-mission surface. Fix: correct the note, and name lab_physical_pentest as the one player-facing scenario that gets the needs-layer changes, so the train smoke on m01 and m02 is not read as covering them. A lab_physical_pentest smoke (Sofia's BadUSB pickup with the player beside it, where `mustReach` and the new `includeHeld` detour meet) is the run that does.

## Checked and found sound

- `_moveReroute` is cleared on every new `goToAndStay`, `cancelMove` and stop, and set only for needs moves.
- `_watchWalk` skips queued, windup and synthetic-arrival legs. It keeps the job's deadline across a re-issue and handles `_moveForPhase` failing the job.
- The back-off cancels the move and does no searches while it waits, and the abandon chain is bounded by progress (a new place needs more than 24 px of movement).
- The post seat retry checks `inChatWith`; a script move sets `atPost` false, so `needsStop` is null and no retry fights it. A `needs: suspend` mapping at the post would still allow the retry, but no scenario uses one with seating.
- `collisionArrives` compares body centre with body-centre destinations, as the needs layer does, and keeps the old two-tile rule for other moves.
- The earshot gating takes no line from the bag when unheard, and the printer-off grumble now follows the same rule.
