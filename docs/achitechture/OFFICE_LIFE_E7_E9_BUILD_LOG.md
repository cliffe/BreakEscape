# Office life E7 to E9: build log

Spec: `OFFICE_LIFE_MISSIONS_PLAN.md` section 9.1 (branch `plan/office-life-missions`, c3f2878e9). Built from main d69c29089 on branch `build/ol-e7-e9`. Seed prototypes on `proto/ol-e7-e9` (09f3fe0b8, 512d51caf, 7850759d1) were read, not cherry-picked; where they differ from 9.1, 9.1 was followed (below).

## What changed

All engine changes are in `public/break_escape/js/systems/npc-needs.js`. No new import, so no test-harness copy list changes. No server, schema, validator or sync change.

| Item | Function | Change |
|---|---|---|
| E7 to E9 | `_chatRadius(c, speakerId)` (new) | The object's `overhearRadius`, else the speaker's pool's for the chat topic, else `OVERHEAR_RADIUS`. Used by the bark turn, the exchange start gate and the exchange-line heard check, and nowhere else. |
| E7 | `_pickBark` | New option `unheard`: skips the bark as if on cooldown (no `_bagNext`, no `chatterQuietUntil`, no `wait`), giving a picture or `null`. |
| E7 | `_tickChats`, bark branch | One `playerHears(c.speaker, _chatRadius(...))` call a turn, before `_pickBark`; `unheard` passed when the world has `playerHears` and the speaker is not heard; the same `h` feeds `overheard`, `playerDistance` and `npc_overheard`. An unheard turn that returns `null` (`pictures: false`) decrements `c.n` and passes the turn, so it does not count towards the 40 silent turns. The chattiness roll and its salt are unchanged. |
| E8 | `routeLength(from, to, opts)` (adapter) | `opts.detail` gives `{ length, known }`: `known` false for a missing pathfinder, a throw or no callback; true for a path, an empty or null path (`length: null`) and the same tile. Without `detail`, unchanged. |
| E8 | `besideCell(cell, taken, opts)` (adapter) | With `opts.from`, a free walkable side is passed over only on a definite no path; unknown counts as reachable; none passing gives `null`. Without `from`, unchanged. |
| E8 | `_moveForPhase` | Passes `{ from: npcPos(id), avoidRooms: _avoidRooms(s) }`; when the default cell is taken and `besideCell` gives `null`, `_failJob(s, 'no_beside_cell')` and return. |
| E9 | `_findExchange` | Returns `{ gated: true }` when an unheard entry was skipped only for its `requireGlobal`; `{ pending }` still wins; else `null`. Docblock lists the results. |
| E9 | `_tickChats`, exchange branch | Starts only on a result with `lines` and `playerHears(lines[0].speakerId, _chatRadius(...))`; `exDone` set only on `null`, so pending and gated look again next free turn. |
| E9 | `_tickChats`, exchange line | The heard check uses `_chatRadius(c, l.speakerId)`. |
| E9 | `_audience` | Removed (no caller). |
| E9 | `_finishExchange` | `heard = ex.heardLines > 0`; played to the end with no line heard logs `exchange_unheard { knot, of }`, sets nothing and fires nothing. Docblock rewritten. |
| E9 | comments | `speak` adapter comment, `npc-world-bubbles.js` `mustShowChatter` docblock. |

Where the prototypes differed from 9.1: E7's prototype gated barks on `_audience` (either speaker, object radius only) rather than the speaker at `_chatRadius`, and did not handle the `pictures: false` silent-turn count; E8's prototype took `besideCell(cell, taken, from, opts)` and fell back to the first walkable side when none was reachable, with no `known` distinction and no `no_beside_cell` failure; E9's prototype had no gated re-look, used the object radius only, and kept `_audience`.

Docs: `NPC_NEEDS_SYSTEM.md` 5.6 (second user's cell, the order of events on a failure), 5.6a (earshot and radius, spent only when heard, the first-speaker start gate, the gated re-look, the heard rule), the event reference (`npc_exchange_heard`, `npc_job_failed` `no_beside_cell`); `EXCHANGE_HEARD_FIX_LOG.md` marked superseded at the top of "The rule chosen".

Showcase (`scenarios/test_needs_sims`): Sanjay and Rosa, who already meet at the kitchen `water_cooler` for `social` and both have `cooler` pools, gain `chatterCooldownMin: 2` and `npc_use_started:water_cooler` couplings with an `npcId` condition both ways (cooldown 30 s, the scenario's convention for need sets). Pools unchanged (10 lines each). Validator: 0 errors, 32 warnings, the same warning set as main.

## Tests

New tests (each fails on main's engine except where marked as a guard):

- `npc-voiced-chatter.test.mjs`: E7 unheard picture, bag and cooldown untouched, then the twin's next bag line on the first heard turn; `chatterCooldownMin: 2` over a 28 s heard overlap (guard); a pair nobody hears does not take the speech lock (both pairings); object `overhearRadius` 224 at 200 px; `pictures: false` 60 unheard turns then a heard line. The determinism test is unchanged and passes.
- `npc-exchange-heard.test.mjs`: second speaker only heard; object radius 224 at 200 px (guard: main also passed it through the object radius); played to the end unheard (`exchange_unheard`, then line 1 at the next heard meeting); chained `heard_<first>` gate; gate opening mid-meeting; no entries or only entry heard looks once (guard); pool-only radius 224 at 200 px counts every line.
- `npc-needs-cell-beside.test.mjs`: the cooler layout (right taken, left cut off, below a wall, above reachable) gives above with `from`, left without; above cut off too gives `null`; a pathfinder that never calls back gives the first free side (guard); a taken side is never route-searched; `routeLength` `detail` for a missing pathfinder, a throw, no callback, null and empty paths, a path and the same tile.
- `npc-social-pairing.test.mjs`: E8 core, `no_beside_cell` on the job-start tick after that NPC's `npc_left_post`, the 60 s fail cooldown, the walk home, no pairing; with a reachable side they pair as before (guard).

Fixtures: both stub worlds gain a `distances: { id: px }` form (heard when within the radius asked for; an unlisted id is not heard) and a `hears(id, radius)` function form returning a boolean or `{ overheard, distance }`. The existing boolean and no-argument forms work as before.

Changed assertions in existing tests:

| Test | Change | Reason |
|---|---|---|
| social-pairing "two at a chatter cooler take turns" | world given an audience (`hears: HEARD`) | asserts one bark each; the default world hears nothing, so under E7 every turn was a picture (failed without it) |
| social-pairing "chattiness 0" | audience | asserts a voiced line (failed without it) |
| social-pairing "a short overlap gives fewer lines" | audience | about spoken lines; passed either way |
| social-pairing "hush" (both worlds) | audience | the hush pool's lines are meant to be spoken; passed either way |
| social-pairing "groups" (`same`, `open`) | audience | about chatting pairs; passed either way |
| exchange-heard "hush ... (R1 n3)" | comments only ("a turn ... a picture since E7") | the first out-of-earshot turn is now a picture, still setting the hush; assertions unchanged |

No existing assertion relied on `complete` alone: "completed", "root cause", "speech lock", "coffee queue", "room change" and the cut tests all had a heard line, and pass unchanged.

`bin/test-js -j 3` on b82e3e30c (engine and tests): 646 files passed, 0 failed. `npc-needs-tick-cost.test.mjs` unchanged and passing.

Validator (`ruby scripts/validate_scenario.rb`): test_needs_sims 0 errors (32 warnings, as main), m02_ransomed_trust 0 errors (29 warnings), lab_physical_pentest 0 errors (7 warnings), test_needs_leash 0 errors (2 warnings).

## Live proof

Keyless server from this worktree on :3088 (`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true`), headless Chromium, `setFPS(20)` with fixed steps on, games made with `tools/playtest/new-game.rb test_needs_sims`, `?skip_resume=1` and `tutorial_declined` (the bootstrap's `decline`/`new`). Driver: `tmp/e7e9-live-proof.mjs` in the worktree (not committed). The page wraps `npcNeedsSystem._emit` to record `npc_chatted`, `npc_overheard`, `npc_exchange_heard`, `npc_job_failed` and the use events with the needs clock and the player's room.

Two harness settings, both in the page only: the kitchen cooler's `useSeconds` is raised to 40 on the live object, and Sanjay's `social` is set to 10 once Rosa (sent first, from the lounge) is in the kitchen. Without them the preset's 15 s use, less the partner's walk, left 3 to 7 s of overlap: in game 4442 the pair had one picture turn together, and in game 4444 Sanjay's heard turn took a bag line whose bubble would have outlasted the overlap, so the chat ended with the line spent and not said (finding 2 below).

### E7

Rosa sent first, Sanjay once she is in the kitchen; the player waits in the office, off the doorway, then walks in after the first picture turns. Screenshots in the session scratchpad (`shots/e7-g<id>-office.png`, `shots/e7-g<id>-heard.png`).

| Game | Turns before the player is in earshot | Bags (`sanjay|cooler`, `rosa|cooler`) before and after those turns | First heard turn |
|---|---|---|---|
| 4445 | 2, both `picture:thirst`, `overheard: false` (player in the office at 326 px, then in the kitchen at 276 px) | null, null; unchanged | t 47000, Sanjay `cooler:9`, `overheard: true`, 42 px; the bubble shows in the screenshot |
| 4449 | 2 pictures (office, 334 and 385 px) | unchanged | t 32750, Sanjay `cooler:9`, overheard, 43 px |
| 4450 | 2 pictures (office, 341 and 381 px) | unchanged | t 32250, Sanjay `cooler:9`, overheard, 155 px |

Unheard lines spent per break: 0 in all three (on main's engine every pairing turn with a pool line took one whether heard or not). Cooler sharing: both `using` the cooler at once in all three, no `timeout`, no `no_beside_cell`. Before the harness moved the player off the office side of the kitchen doorway, game 4447 had Sanjay time out walking to the cooler (needs walks do not yield to the player, who stood in the doorway); that is the harness, not E8, and is recorded for whoever reruns it.

### E9

Positive, player placed by the first speaker (Sanjay, beside cell (-244, 276)) before the pair meet: games 4452 and 4455. In both the first turn was a heard Sanjay bark (`cooler:9`, the exchange story still loading), then `exchange_started exchange_rosa_rota` with line 0 heard at 51 px and line 1 (Rosa) heard at 80 px, so `heardLines` was at least 2. The runs stopped 9 s after the meeting, before the five-line exchange ended, so `heard_exchange_rosa_rota` and the `hear_rota_exchange` task were not yet set at the snapshot: the end of a heard exchange is covered by the node tests, not by these two runs.

Negative (player in earshot of the second speaker only): not achieved. In games 4451 and 4454 Rosa reached the approach cell first and Sanjay, the exchange's first speaker, took the beside cell to the east, so the only place out of his earshot and in Rosa's is west of her, against the kitchen wall. The move was refused there and the player stopped at about (-276, 240), in earshot of both, and the exchange started, correctly. A rerun needs Sanjay sent first (so Rosa stands east) and the player at about Rosa's cell plus 140 px east.

`exchange_tom_parcel` (`hear_parcel_exchange`) was not run live.

Exchanges marked heard with 0 lines: none seen; the node test for the empty-room case covers `exchange_unheard`.

### E8

Not run live in this session (handover below). The node proofs above cover the cooler layout with the live adapter's `besideCell` and stubbed pathfinding.

## Findings

1. Showcase overlap. On the kitchen cooler (preset `useSeconds` 15) a coupled partner's walk leaves only a few seconds of overlap, so the Sanjay and Rosa pair rarely gets more than one or two turns. m02 plans 25 s and 50 s uses, which is the fix there; the showcase could take an object-level `useSeconds` on its cooler if the live-proof table should reproduce without the harness setting.
2. A heard turn can spend a line it never says. `_tickChats` calls `_pickBark` (which takes the bag line and starts the cooldown) before checking that the line fits the overlap; when it does not, the chat ends with the line spent. 9.1 does not cover this; E7 makes it the only remaining way a pool line is spent without being heard. A fix would size the turn before drawing (for example draw only when at least `CHAT_MAX_MS` of overlap remains). Not changed here.
3. `besideCell` with no pathfinding manager returns `null` as before, which `_moveForPhase` now turns into `no_beside_cell`. A live world always has the manager; stub worlds without `besideCell` skip the block entirely.

## Handover

Stopped at the tool-call budget. Done: engine (b82e3e30c), showcase (0ba423c38), docs and this log (next commit), full `bin/test-js`, validators. Open, in order:

1. E9 live negative: Sanjay sent first, player about 140 px east of Rosa's cell; expect no `exchange_started` and Rosa's turns heard as barks. Then a positive run left to finish, checking `heard_exchange_rosa_rota` and the `hear_rota_exchange` task; and `exchange_tom_parcel` once (set `amara_opened_parcel`, send Amara and Tom to the office coffee with the player beside the first speaker, Tom).
2. E8 live: a throwaway copy of `test_needs_sims` (none was found from the prototype; `p-ol-e7e9` has no uncommitted copy) with a solid prop on the kitchen cooler's right side cell (-244, 276). First confirm in that copy that `pathfindingManager.findNearestWalkableWorldCell(-244, 276, 0)` is null, the left cell (-308, 276) is still walkable with `routeLength` null from both posts, and above (-276, 244) is routed. Load it with `tools/playtest/swap-scenario-game.rb test_needs_sims <dir>`. Five coupled breaks (expect the partner on the above cell, both `using`, no timeout), the before case once on main's engine, then a copy with above blocked too (expect `no_beside_cell` within a tick of `npc_left_post`, and the walk home). Save the copy's diff here.
3. Regressions on the keyless server: `test_needs_leash` live, and `lab_physical_pentest` `verify-run.rb` 100, with a line in the lab's `IMPROVEMENT_LOOP_LOG.md`.
4. Findings 1 and 2 above go to the orchestrator: neither is in 9.1.

Driver: `tmp/e7e9-live-proof.mjs` (modes `e7`, `e9neg`, `e9pos`; server on :3088 started from this worktree, PID in `test/dummy/tmp/pids/server-3088.pid`).
