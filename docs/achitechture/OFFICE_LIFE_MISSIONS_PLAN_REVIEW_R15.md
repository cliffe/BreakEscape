# Office life missions plan: design and engine review, round 15

Plan reviewed: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md`, draft 16, at 6a0fdbf1d (branch plan/office-life-missions). Engine, tests and scenarios read on main at d69c29089, from a fresh detached worktree. Round 14's design and server reviews were read to check each fix. The user's fixed decisions (Gary (a), Ernie Bautista and Hodan Warsame, two tables, no radio run, E7 to E9 before stage 4) and the integrator's (E7 to E9 built from main) are taken as given.

Live measurement: keyless server on :3087 from the main worktree, headless, `setFPS(20)` with fixed steps on (confirmed `[20, true]`), game 4424 of `test_needs_sims`. Server stopped by PID afterwards.

## Verdict

0 blockers, 1 major, 8 minors, 4 nits.

Round 14's fixes are all in, and the two majors are mostly solved. The radius fix works the way the plan says on main's code: `_maybePair` copies the object's `overhearRadius` into the chat (`npc-needs.js:3870`), the bark branch already reads object, then pool, then 160 (`:3954`), and the adapter's `playerHears` (`:4937` to `:4953`) is same room, radius, lit and walls-and-closed-doors only (`canSeePlayerToFace`, `npc-behavior.js:1043`), so tables do not block it. The ward-arrival cooler break is wired correctly: `room_entered` carries `previousRoom` (`core/rooms.js:3205`), the condition evaluator supports `data.previousRoom === 'ward_hall'` (`npc-manager.js:56` to `:110`), and the room ids match m02 (`office_corridor` south to `ward_hall`, north to `staff_room`). `fireOnlyWhenLoaded` is a validator opt-out with no game effect, which is what the mapping needs.

The one major is new in effect, though the mechanism is old: a need `set` that lands while the porter is already using the boiler is absorbed by the additive restore, and a chat decides at its first turn that there is no exchange for the meeting. Together they mean the `onceOnly` burn break can be spent with no break and no exchange, and the 50 s use makes that window wider. 6.4 describes it as a delay of up to 50 s, which is not what the code does.

**Is 9.1 ready to build?** It is buildable from main alone: every file, function, test file and showcase id it names exists on main, the line numbers hold to within a line or two, and nothing it needs is sims-only. It is ready once M1's choice is written into E9 (one small addition to `_tickChats`, recommended below) and m2 to m5 are folded in; none of those changes the item's scope or file list.

## Blockers

None.

## Majors

### M1. The burn break can be swallowed by a break already running, and the chat never looks for the burn exchange again that meeting

Section: 6.4 (mapping 2, the burn exit test), 9.1 (E9).

Evidence.
- A mapping `set` changes the level at once (`npc-needs.js:984` to `:996`), and use completion adds the restore to whatever the level is then (`:3301` to `:3303`). If the porter is `using` the boiler when Gary's conversation closes, mapping 2 sets his caffeine to 20, the use ends at 20 + 40 = 60, above `urgentAt` 35, and no new break starts. Mapping 2 is `onceOnly`, so it is spent.
- `_tickChats` looks for an exchange only while `!c.ex && !c.exDone`, and sets `c.exDone = true` the first time `_findExchange` returns `null` (`:3902` to `:3906`). `_findExchange` returns `null` when every entry is heard or gated (`:2689`, `continue` on a failed `requireGlobal`). So in a meeting that began after the paper exchange was heard and before `cover_burned`, the chat has already stopped looking; when `cover_burned` turns true mid-meeting, the burn exchange does not start, even with the player standing beside the pair.
- When is the porter likely to be mid-use at the close? The player reaches Gary through the staff room. Mapping 1 fires on that entry (if 2 minutes have passed), the pair meet about 4 s in, and with `useSeconds: 50` the break runs until about 54 s after the entry. A player who finishes the keycard conversation within about 50 s of crossing the staff room closes it during that break. The first visit sets mapping 1's cooldown too, so a quick second trip to IT inside 2 minutes may meet the tail of that break rather than a new one. Draft 15's 30 s use made the window smaller; draft 16's 50 s, chosen for M2 of round 14, widens it.
- 6.4, mapping 2, says "A Kim break still running when Gary's conversation closes delays this one by up to its 50 s". It does not delay it: no break follows. And it is any running break (mapping 1's, mapping 3's or a natural one), not only Kim's.

What goes wrong. On the runs where this happens, the walk straight out of IT meets the pair at the boiler (the break is still on) but hears a pool line or a picture, not the burn exchange, and the exchange waits for the next meeting the player hears, which can be minutes later. The exit test's "first line heard on at least 2 of 5 straight walks" will fail on exactly the quick runs that are most like a real player who knows where Gary is. Nothing is lost for good (E9 keeps the exchange unplayed), so this is not a blocker.

Fix (recommended: 1 and 3; 2 is the cheaper alternative).
1. In E9, look again for a gated exchange on later turns. In `_tickChats`, set `c.exDone` only when the pair has no exchange entries for each other at all (`_findExchange` can return a `{ none: true }` marker for that case), and leave it `false` when entries exist but are all heard or gated, so `_findExchange` runs again on the next free turn. Cost: a loop over at most a handful of entries per chat turn, every 0.5 s or more, only while a pair is meeting. Unit test in `npc-exchange-heard.test.mjs`: a gated exchange whose global turns true mid-meeting starts on the next heard turn; a pair with no entries still stops looking after the first turn. Add it to the existing tests' list in 9.1.
2. Or accept it, and say so in 6.4: replace the "delays this one" sentence with what happens (the break is absorbed, the exchange waits for the next meeting the player hears), and lower the straight-walk bar to "recorded, not passed" as 6.4 already allows without the radius.
3. Either way, add an exit-test case: close Gary's keycard conversation within 40 s of a mapping-1 break starting, then walk straight out. With fix 1 the burn exchange's first line is heard while the break runs; with fix 2 the case is recorded.

## Minors

### m1. Natural breaks alternate who reaches the boiler first, so the domestic is the approach-cell user on about half of them

Section: 6.4 ("What starts a break"), 6.8 (first speakers).

6.4's own rhythm says that after a coupled break "the partner is due next", which makes the natural breaks alternate: on about half, the domestic's caffeine turns urgent first, she takes the approach cell (164, 124) and the porter the second-user cell. 6.8's reason for opening every exchange with the domestic ("every mapped break sets the porter's need, so he usually reaches the object first") holds only for mapped breaks. With the radii of 6.5 covering the floor this matters little, but the text should say it, and stage 4's record of who takes which cell should cover natural breaks too, not only mapped ones.

### m2. E9's per-line heard check uses a different radius from E9's start gate

Section: 9.1 ("Earshot, for E7 and E9", E9).

The spec says E7 and E9 work out the radius "once per turn the same way for both: the chat's `overhearRadius`, else the speaker's pool's, else 160". The exchange-line check that counts `heardLines` (`:3918`) uses `c.overhearRadius || OVERHEAR_RADIUS`, with no pool step, and 9.1 does not change it. With a radius set on a pool but not on the object, an exchange would start because its first speaker is within the pool's radius, then count its lines against 160, finish with `heardLines` 0, be logged `exchange_unheard` and start again at every meeting. m02 sets the radius on the objects, so the pilot is not hit; the skill will apply this everywhere. Fix: one helper, for example `_chatRadius(c, speakerId)`, used by the E9 start gate, the exchange-line check at `:3918` and the bark branch, with a unit test of a pool-only radius in `npc-exchange-heard.test.mjs`.

### m3. The kitchen `water_cooler` cannot prove E8: its first side is reachable

Section: 9.1 (E8, showcase and live proof).

Measured on main (game 4424, kitchen loaded): approach cell (-276, 276); right side (-244, 276) walkable and routed from Amara, Tom, Grace, Sanjay and Marek (510 to 660 px); left side (-308, 276) walkable but `routeLength` `null` from all five; below, no walkable cell; above (-276, 244) routed. So one side is cut off, as 9.1 guesses, but `besideCell` tries right first and right is reachable, so a coupled pair there never reaches the skip or the failure path. Read literally, 9.1's "if it is, the coupled pair above proves E8 there" would be ticked off on a placement that exercises none of E8. Fix: say that the `water_cooler` pair proves E7 only, and that E8's showcase needs a capacity-2 object whose right side is cut off (the "catalogue cooler in a corner or nook" branch), with the five-break live proof run there.

### m4. "4-line `cooler` pools" cannot be had in `test_needs_sims` without touching the scenario pool

Section: 9.1 (E7, showcase).

`chatterPool` joins the scenario's pool and the NPC's own (`:242` to `:251`), and `test_needs_sims` has a scenario-level `cooler` pool of 8 lines (`scenario.json.erb:16`). Every speaker at the kitchen cooler therefore draws from 8 plus their own 2, not 4. The spec's checks (one line a break, nothing spent unheard, the bag unchanged) do not need 4 lines, so the fix is wording: give the pair `chatterCooldownMin: 2` and leave the pools as they are, or put the pair on an object with a topic of its own if a 4-line pool is wanted.

### m5. Both test fixtures need an id- and radius-aware `playerHears`, not only `hears(id)`

Section: 9.1 (E7 and E9 unit tests).

The voiced-chatter fixture returns `distance: 50` whatever the radius (`npc-voiced-chatter.test.mjs:45`), and the exchange-heard fixture does the same and ignores the id (`npc-exchange-heard.test.mjs:54`, `() => ({ overheard: !!hears(), distance: 50 })`). The E7 test "an object `overhearRadius` of 224 makes a speaker 200 px away heard" and the E9 tests "the player hears only the second speaker" and "224 with the first speaker 200 px away" all need a form that takes `(id, radius)` and compares a per-NPC distance with the radius. Fix: say both fixtures gain `hears(id, radius)` (or a `distances: { id: px }` option the stub compares with the radius), keeping the existing boolean and no-argument forms.

### m6. The ward-arrival break walks the pair towards the south door as the player comes through it

Section: 6.4 (mapping 4, exit test), 6.5 (dressing checks).

Mapping 4 is timed so the pair are moving to the cooler, beside the south door, as the player enters from it, and needs walks use `yieldToPlayer: false` (`_moveForPhase`, `npc-needs.js:3112`). The exit test covers the player passing with both NPCs already `using` the cooler, not the walk itself. Fix: add a case, the player entering from the ward at walking pace on a mapping-4 break, not stopped or pushed at the doorway, five tries.

### m7. The radii are tuned to a geometry the map does not quite match; a whole-room value is simpler

Section: 6.4 ("Hearing across the room"), 6.5.

The staff room's Tiled map (`room_hospital_staff.json`, 10 by 10 at 32 px) has wall rows 1 and 9 and floor rows 2 to 8, so the floor runs to about y 288, while 6.4 places the south door at about (272, 246), inside the floor. From the second-user cell (196, 124), the floor's south-west corner (about 40, 280) is about 221 px away, 3 px inside the 224 estimate, and the cooler's cells are not chosen yet. Since `playerHears` already requires the same room and a clear line, nothing is gained by a tight radius. Fix: set both objects to a value that spans the room from any cell (for example 360 px, the floor's diagonal and some margin), keep the stage 4 doorway test as the proof, and correct the door coordinates in 6.4 when stage 4 measures them.

### m8. The coupling pattern 9.1 points to is partly Marek's, not Sanjay's

Section: 9.1 ("What it may use on main").

The spec names "Sanjay's existing need-setting mappings (`npc_left_post:marek` with a target condition, `object_interacted` on the rota and the coffee notice)". On main, Sanjay has the two `npc_left_post:marek` mappings and an `object_interacted` on the Activity Board (`scenario.json.erb:656`, `:657`, `:660`); the Kitchen Rota and Coffee Notice mappings are Marek's (`:685`, `:686`). Fix: correct the attribution so the builder copies from the right NPC.

## Nits

- n1. 6.8, the burn exchange: "The source is the porter's radio ... the domestic's opening line reports what has just come over it" reads as her relaying his radio. 6.3 says both carry one; say "the radio" or "her radio".
- n2. Section 7, save ordering: `MAX_KEY_BYTES` is defined in `sync_ring.rb:27`, not `games_controller.rb`; the other three ring constants are in `games_controller.rb:2175` to `:2177`.
- n3. 9.1, E8 live proof: "gives `no_beside_cell` within one tick" is true of the stub world (no wind-up). Live, `_leavePost` runs after the wind-up (`:2884` to `:2893`), so say "within one tick of `npc_left_post`".
- n4. 6.4's doorway exit test: `playerHears` uses `currentPlayerRoom`, so "standing in the doorway" should be defined as the first floor cell inside the staff room, or the test can measure the neighbouring room.

## Round 14 fixes, checked

| Item | Folded in | Solves it? |
|---|---|---|
| Design M1 (radius) | 6.4, 6.5, 6.8, 9.1 earshot paragraph, E7 and E9 tests, doorway exit test | Yes on main's code; see m2 (pool radius), m5 (fixtures), m7 (geometry) |
| Design M2 (crossings) | ward arrival as a cooler break, `useSeconds: 50`, thirst 65, the walkthrough exit test | Yes for crossings; the 50 s use widens M1's window |
| Design m1 (`routeLength`) | `opts.detail`, unknown counts as reachable, order of events documented | Yes; matches `routeLength` at `:4888` to `:4914` and `reachable()` at `:4879` to `:4881` |
| Design m2 (silent turns) | unheard `null` turns decrement `c.n` | Yes (`:3942` to `:3946`) |
| Design m3 (old rule) | all five places and both showcase tasks | Yes; each place checked on main |
| Design m4 (rhythm) | about 6 and 11 needs-minutes, 24-minute repeat | Yes |
| Design m5 (2 of 5) | conditional bar kept | Yes, but see M1 |
| Design m6 (cooler by the door) | `useFrom` on the north or west face, door clearance check, exit test | Yes; see m6 for the walk |
| Design m7 (stand-ins) | `male_telecom_v2`, `female_telecom_v2` | Yes: both atlases have `sit_south_frame_000` and neither is used in m02 |
| Design m8 | declined by the integrator's decision; 9.1 records the shared `_moveForPhase` edit and the diff base | Yes |
| Design m9 (hooks) | `hears(id)` and the direct bag read | Partly; see m5 |
| Design n1, n2 | the cup named by the engine; porter knock-out accepted | Yes |
| Server m1 (ring) | 6.9 and section 7 | Yes; see n2 |
| Server m2 (non-monotonic) | section 7 | Yes |
| Server m3 (`triggeredEvents`) | row 645, 6.9, section 7 | Yes; constants and `merge_triggered_events!` (`game.rb:4842`, `:4849`) match |
| Server n1 (6a-1) | section 8, now a stage 4 precondition | Yes |

## Other checks that held

- 9.1's named functions are all on main where it says: `_pickBark` `:2637`, `_audience` `:2701` (one caller, `:3904`), `_finishExchange` `:2747`, `_tickChats` `:3883`, `_moveForPhase` second-user block `:3091` to `:3101`, `_leavePost` `:2957` to `:2970`, `_failJob` `:3490`, `routeLength` `:4888`, `playerHears` `:1674` and `:4937`, `cellBeside` `:5001`, `besideCell` `:5021`, `OVERHEAR_RADIUS` `:47`, `FAIL_COOLDOWN_MS` `:25`. `_moveForPhase` is also called on unfreeze (`:1306`) and from the queue front (`:4428`); E8's failure path there is the same `_failJob`, which is correct.
- Showcase ids on main: `water_cooler` (kitchen, (1, 7), cooler preset, capacity 2), `office_coffee` (capacity 1, queue, `coffee`), `exchange_tom_parcel` on Amara (`with: "tom"`, `requireGlobal: "amara_opened_parcel"`, completes `hear_parcel_exchange`), `exchange_rosa_rota` on Sanjay (completes `hear_rota_exchange`). All six named NPCs have `cooler` lines.
- The five test files exist; the social-pairing tests 9.1 lists do assert spoken lines under a default `overheard: false` world ("one bark each" in the take-turns test), so they will need an audience as 9.1 says. `_audience` has no test caller, so removing it breaks nothing.
- `lab_physical_pentest` has chatter pools and one exchange (`coffee_exchange`, at a capacity-1 coffee point with a queue), and nothing in its scenario or `verify-run.rb` reads `heard_coffee_exchange` or `npc_exchange_heard`, so E9's stricter rule cannot cost it a required step.
- E7's `pictures: false` fix, the `chattiness` salt and the determinism test: with the decrement, an unheard `null` turn reuses its salt on the next turn, which stays deterministic.
- No new contradiction found between 6.4, 6.5, 6.8, 6.9, 6.13 and 9.1 beyond M1's sentence and n1.

## Assumptions

- Assumption: I took the staff room's floor from the Tiled `walls` layer and did not load m02 live, so m7's distances are from the map, not from measured cells.
- Assumption: M1's timing (keycard conversation closed within about 50 s of a mapping-1 break) is reasoned from the code and 6.4's measured meeting times, not run; I rated it major because quick, informed players are the ones who hit it.
- Assumption: I treated the `routeLength` `null` on the kitchen cooler's left side as a definite "no path", because the same pathfinder answered for the other two sides in the same call.
