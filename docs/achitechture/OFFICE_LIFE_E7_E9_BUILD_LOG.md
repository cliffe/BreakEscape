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

Keyless server from this worktree on :3088 (`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true`), headless Chromium, `setFPS(20)` with fixed steps on, games made with `tools/playtest/new-game.rb test_needs_sims`, `?skip_resume=1` and `tutorial_declined` (the bootstrap's `decline`/`new`). Driver: `tmp/e7e9-live-proof.mjs` in session 1, committed in session 2 as `tools/playtest/e7e9-live-proof.mjs`. The page wraps `npcNeedsSystem._emit` to record `npc_chatted`, `npc_overheard`, `npc_exchange_heard`, `npc_job_failed` and the use events with the needs clock and the player's room.

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

Positive, player placed by the first speaker (Sanjay, beside cell (-244, 276)) before the pair meet: games 4452 and 4455. In both the first turn was a heard Sanjay bark (`cooler:9`, the exchange story still loading), then `exchange_started exchange_rosa_rota` with line 0 heard at 51 px and line 1 (Rosa) heard at 80 px, so `heardLines` was at least 2. The runs stopped 9 s after the meeting, before the five-line exchange ended, so `heard_exchange_rosa_rota` and the `hear_rota_exchange` task were not yet set at the snapshot: the end of a heard exchange was not reached in these two runs (session 2's game 4462 below reaches it).

Negative, first attempt (games 4451 and 4454): not achieved. Rosa reached the approach cell first and Sanjay, the exchange's first speaker, took the beside cell to the east, so the only place out of his earshot and in Rosa's was against the kitchen's west wall; the player stopped in earshot of both and the exchange started, correctly.

The rest of this section and the E8 and regression sections below were run in a second session, on the same server set-up, with the driver committed as `tools/playtest/e7e9-live-proof.mjs` (modes `probe`, `e7`, `e9neg`, `e9pos`, `e9unheard`, `parcel`, `e8`, `regress`; `ENGINE=<rev>` serves that revision's `npc-needs.js` to the page by request interception, for before cases, with no file change). Screenshots: `shots/<mode>-g<id>.png` in that session's scratchpad. Every page-only harness setting is listed in the run's JSON (`harness`).

| Proof | Game | Set-up | Result |
|---|---|---|---|
| E9 negative | 4461 | Sanjay sent first, so he took the approach cell (-276, 276) and Rosa, by the coupling, the open east side (-244, 276); player at (-94, 276), 150 px east of Rosa | PASS. 9 turns over 25 s of meeting: Rosa heard on every turn (151 px; `cooler:1`, then pictures under her 2-minute cooldown), Sanjay never (183 px, pictures only). No `exchange_started`; Sanjay's `cooler` bag untouched (null); `heard_exchange_rosa_rota` false, `hear_rota_exchange` active |
| E9 positive, to the end | 4462 | Rosa first, player at Sanjay's cell + (40, 36) | PASS. `exchange_started`, all 5 lines `overheard: true` (50 and 77 px), `exchange_heard { complete: true }` at t 56500, `heard_exchange_rosa_rota` true, `hear_rota_exchange` completed |
| E9 played to the end unheard | 4465 | as 4462; the page moves the player to the office (90, 220) on the tick `_startExchange` runs, then holds them there | PASS. `exchange_started`, then lines 0 to 4 all `overheard: false` (314 to 367 px), `exchange_unheard { of: 5 }`, no `npc_exchange_heard`; `heard_exchange_rosa_rota` false, `hear_rota_exchange` still active. (Run 4463 is void: the hook was installed after the exchange had started during the player's walk.) |
| `exchange_tom_parcel` | 4466 | office only loaded; `amara_opened_parcel` set in the page; Amara sent to the office coffee, then Tom, who queues; player 40 px above Tom | PASS. Tom (first speaker) heard at 42 px, the exchange started, 4 lines heard (40 and 42 px), `exchange_heard { complete: true }`, `heard_exchange_tom_parcel` true, `hear_parcel_exchange` completed |

Console errors in the E9 runs: only `/tts` 503s from the keyless server, one per voiced exchange line (0 in 4461, where no exchange played).

### E8

Copies of `test_needs_sims` in `tmp/e8_right` and `tmp/e8_both` (not committed). A scenario object does not get a body unless it is a table, so each blocker is a dynamic table (`type: "table"` with `sprite`, `position` and `tableItems: []`), which `rooms.js` gives a static body: the bottom quarter of the sprite, inset 10 px. Diff of the first copy:

```diff
@@ -733,6 +733,14 @@ (kitchen objects, after water_cooler)
         {
+          "type": "table",
+          "sprite": "coat_stand1",
+          "id": "e8_block_right",
+          "name": "Coat Stand",
+          "position": { "x": 2.047, "y": 7.41 },
+          "tableItems": [],
+          "takeable": false,
+          "observations": "E8 live proof only: a dynamic table (static body) on the water cooler's right side cell (-244, 276)."
+        },
+        {
```

The second copy adds the same object again with `"id": "e8_block_above"` and `"position": { "x": 1.047, "y": 6.41 }`, on the above cell (-276, 244). Load either with `tools/playtest/swap-scenario-game.rb test_needs_sims tmp/e8_right`. (A `wet_floor_sign1` object at the right cell, tried first, gets no body and leaves the cell walkable.)

Set-up check (`probe`, game 4475, first copy): the coat stand's body is 1 x 11 px at (-244, 271); the right cell is not walkable (`findNearestWalkableWorldCell(-244, 276, 0)` null); the left cell (-308, 276) is walkable, behind the kitchen's west wall line, with `routeLength` `{ length: null, known: true }` from both Sanjay's and Rosa's posts; below (-276, 308) is not walkable; the approach cell (-276, 276) and the above cell (-276, 244) are routed from both posts (506 and 474 px from Sanjay's, 932 and 900 from Rosa's). The same probe on the plain scenario (game 4459) gives the right cell walkable and the rest the same.

| Proof | Game | Result |
|---|---|---|
| Five coupled breaks, right cell blocked | 4476 | PASS. Rosa (sent first) on the approach cell each time; Sanjay's `dest` (-276, 244), the above cell, in all 5; both `using` the cooler at once in all 5; no `timeout` or `no_beside_cell` for either. Screenshots `e8-g4476-break0..4.png`. One unrelated `job_failed` in the run: Grace, `rest` at `lounge_sofa`, `timeout` |
| Before case, same copy, main's engine (`ENGINE=d69c29089`) | 4487 | As 9.1 predicts: Sanjay left his post at t 20250 for the cooler and failed with `timeout` at t 40250, 20 s later, never using it |
| Above cell blocked too | 4485 | PASS. Probe: right and above both not walkable. Sanjay's `npc_left_post` (target `water_cooler`) and `npc_job_failed { reason: "no_beside_cell" }` on the same needs tick (t 20750); he never left the office and was idle at his post (92, 123) 0.75 s and 6.75 s later. Screenshot `e8above-g4485-walkhome.png`. The walk home is zero-length here: the failure lands before his first step |

### Regressions

`regress` mode: open the listed rooms with `enterRoom`, then watch for a fixed wall-clock window, recording the needs log counted by NPC and event, each needs NPC's room trail, completed tasks and console errors; once on this engine and once on main's (`ENGINE=d69c29089`).

| Scenario | Games (this engine, main's) | Window | Result |
|---|---|---|---|
| `test_needs_leash` (rooms maya_office, store, west_corridor, ravi_office) | 4478, 4481 | 150 s | PASS. Same on both: Ravi urgent, `job_start`, `using`, `used`, `return_resumed`, `returned_post`, trail ravi_office, west_corridor, store, west_corridor, ravi_office (never Maya's office), `see_long_way` completed. 0 console errors on both |
| `lab_physical_pentest` (rooms reception, hall, open_plan; Kieran, Hampshire, Lord, Pierce) | 4486, 4497 | 240 s | PASS. Event counts identical for all four NPCs except one `hampshire:private_skipped` on main's engine only, and the same room trails. That is an object-choice log line, outside the code E7 to E9 changed; It was not traced, so it is read as a timing difference until shown otherwise. No exchange started in either run. Console errors: 0 on this engine; 1 on main's, a `/tts` 503, consistent with main voicing a pool line that nobody heard (the E7 bug) |

The lab's `IMPROVEMENT_LOOP_LOG.md` was not updated and no `verify-run.rb` critical-path replay was run: the orchestrator's brief for this session asked for the needs NPCs only.

## Findings

1. Showcase overlap. On the kitchen cooler (preset `useSeconds` 15) a coupled partner's walk leaves only a few seconds of overlap, so the Sanjay and Rosa pair rarely gets more than one or two turns. m02 plans 25 s and 50 s uses, which is the fix there; the showcase could take an object-level `useSeconds` on its cooler if the live-proof table should reproduce without the harness setting.
2. A heard turn can spend a line it never says. `_tickChats` calls `_pickBark` (which takes the bag line and starts the cooldown) before checking that the line fits the overlap; when it does not, the chat ends with the line spent. 9.1 does not cover this; E7 makes it the only remaining way a pool line is spent without being heard. A fix would size the turn before drawing (for example draw only when at least `CHAT_MAX_MS` of overlap remains). Not changed here.
3. `besideCell` with no pathfinding manager returns `null` as before, which `_moveForPhase` now turns into `no_beside_cell`. A live world always has the manager; stub worlds without `besideCell` skip the block entirely.

## Handover

Session 1 stopped at the tool-call budget with live proofs open; session 2 ran them (tables above). Still open:

1. Findings 1 and 2 above go to the orchestrator: neither is in 9.1.
2. Not run: a full `lab_physical_pentest` critical-path replay with `verify-run.rb --tasks` (score 100) and its `IMPROVEMENT_LOOP_LOG.md` line; this session's brief covered the needs NPCs only.
3. Seen in passing, not investigated: Grace's `job_failed ... timeout` (dirty mugs at `washing_up_tray` in 4462, `rest` at `lounge_sofa` in 4476) and Tom's `caffeine` timeout at `kitchen_coffee` in 4487 (main's engine). None involves a chatter pair or a second user's cell.

Server: keyless, `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails server -b 127.0.0.1 -p 3088 -P tmp/pids/server-3088.pid` from this worktree, stopped by its PID after the runs.

## Review round 1 fixes

Against `OFFICE_LIFE_E7_E9_REVIEW_R1.md` (0 B, 2 M, 4 m).

- **M1, fixed.** `_pickBark` takes `maxMs`; `_tickChats` passes `overlapEnd - clockMs`. When less than `CHAT_MAX_MS` is left, the bag's next line is looked at with `_bagPeek` (pure: the same index `_bagNext` would give, nothing stored) and drawn only if its bubble fits; otherwise the turn is a picture if that fits, or the chat ends, with the bag and cooldown untouched. The review's simpler bound (no bark under `CHAT_MAX_MS` left) was tried first and broke the existing "exchange: plays with the player in earshot" test, whose first bark after an exchange fits in under 4 s, so the exact form went in. Tests in `npc-voiced-chatter.test.mjs`: 3 s left takes no line, 5 s takes it (fails on 2180042a4), and the peek matches the draw across rounds.
- **M2, the remaining parts.** The queue-chat gate test is in `npc-exchange-heard.test.mjs`, shaped on `lab_physical_pentest`'s `coffee_exchange`: the owner and first speaker uses the machine, only the queued partner is heard, no `exchange_started`; hearing the user too starts it (fails on d69c29089). The lab verify-run was not done: `tools/playtest/verify-run.rb` only scores a game that has already been played to the credits, and `tools/playtest` holds no committed critical-path driver for `lab_physical_pentest` (the score-100 runs in its `IMPROVEMENT_LOOP_LOG.md`, games 1026 and 1163, were driven from session scratch scripts). A full replay is a playtest-scenario run of its own, so it goes back to the orchestrator; the `regress` run above (games 4486, 4497) is the evidence for the lab so far.
- **m1, fixed.** The showcase cooler has an object-level `useSeconds` of 40, mirrored in `test/js/fixtures/needs-sims-world.mjs` and its `PRESET_OBJECTS`. The sims-day golden hash (shared by `npc-coffee-off`, `npc-left-behind`, `npc-avoidance` and `npc-needs-slots`) moves with it, and only with it: with the R1 engine and the old fixture all four still match the old hash. `office-presets`' overrides list gains `water_cooler`. The walk-plus-20 s rule is in `NPC_NEEDS_SYSTEM.md` 5.6 ("Coupled pairs"). The `mission-office-life` skill and `OFFICE_LIFE_MISSIONS_PLAN.md` are not on this branch, so the same line still has to go into the skill's stage 2 when it is written.
- **m2, fixed (doc).** 5.6a now says a bark turn nobody hears never takes the lock, and that an exchange voices every line through the lock whether heard or not. The optional engine change (an unheard exchange line shown without `_speak`) changes the voice rule and is left for the user.
- **m3, fixed.** `routeLength` returns `known: false` before calling `findWorldPath` when `worldPathfinder` or `worldGridBounds` is missing. Test in `npc-needs-cell-beside.test.mjs` (fails on 2180042a4), including `besideCell` keeping the first free side.
- **m4, fixed.** The three node gaps above, plus a node test of the stronger E7 bag form (a bag that exists after a heard meeting, unchanged by an unheard one), and the same live (below).

### Live rerun (keyless :3088 from this worktree, headless, `setFPS(20)` with fixed steps on)

The driver logs every `_bagNext` draw and, for every chat line, its bubble's end and the pair's overlap end, then checks that each draw is a line said on the same tick, heard, and ending inside the overlap (`drawCheck`). `COUPLED_ONLY=1`: only Rosa is sent; the scenario's coupling sends Sanjay; no page-side cooler setting.

| Game | Set-up | Draws | Drawn, not said | Drawn unheard | Past the overlap | Other |
|---|---|---|---|---|---|---|
| 4516 | e7, coupling only, `SECOND_BREAK=1` | 2 | 0 | 0 | 0 | met at 30750, overlap to 64000; second break unheard, 6 pictures, both bags unchanged (cooldowns still running) |
| 4517 | as 4516, both cooldowns cleared before the second break | 2 | 0 | 0 | 0 | 6 unheard pictures; both bags' `order`, `round` and `last` unchanged |
| 4539 | `LATE_MS=3200`: both uses trimmed to end 3.2 s after a turn, player placed beside the pair just before it | 0 | 0 | 0 | 0 | the heard turn (Rosa, 86 px) is `picture:social`; bags and cooldowns unchanged |
| 4540 | as 4539 on the round 1 engine (`ENGINE=2180042a4`) | 1 | 1 | 0 | 0 | the before case: Rosa's `cooler:1` drawn and never said, cooldown started (160250), the chat ended |
| 4541 | `LATE_MS=4500` | 1 | 0 | 0 | 0 | Rosa's `cooler:1` said, overheard, ending at 53000 against an overlap end of 54000 |

Games 4520, 4522, 4525 and 4526 are void: the first late-arrival placement missed the tail between turns or put the player inside the kitchen's bottom wall (no room), so no turn was heard. Console errors: `/tts` 503s only (keyless). Unrelated job failures seen: Sanjay `work` at `sanjay_pc` `timeout` (4516, 4517, after the harness's room moves) and Grace at `washing_up_tray` `timeout` (4539, 4541), as in session 2.
