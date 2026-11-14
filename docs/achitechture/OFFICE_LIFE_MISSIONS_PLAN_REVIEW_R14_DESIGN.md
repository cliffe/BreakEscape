# Office life missions plan: design review, round 14

Plan reviewed: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md`, draft 15, at f2e53dc98 (branch plan/office-life-missions). Engine read at the same commit and compared with `build/ol-sims` (1591f2a4f), whose `npc-needs.js` differs only in the SIMS-2 arrival ids (`_arrivals` as a Map, `moveId` stamped in `_moveForPhase` and `_goHome`) and the object-level `offWhen` read; none of the functions 9.1 names (`_pickBark`, `_tickChats`, `_audience`, `_finishExchange`, `besideCell`, `cellBeside`, `routeLength`, `playerHears`) differs between the two. Round 13's design review was read only to avoid repeating settled points. The user's fixed decisions (Gary option (a), Ernie and Hodan with their voices, two tables, no radio run, E7 to E9 before stage 4) are taken as given.

## Verdict

0 blockers, 2 majors, 9 minors, 2 nits.

The E7 to E9 spec is close to buildable: every function, file and test it names exists where it says, `_audience` has exactly one caller (`npc-needs.js:3904`), `this.playerHears` (`:1674`) already returns `false` for a world with no `playerHears`, the restore is applied at use completion (`:3301` to `:3303`), so a coupling `set` during a use can never start a ping-pong of breaks, and the clip total (16 + 11 + 26 = 53) adds up. Nothing in the pilot moves a lock, key, task or story global, and the generic m02 mappings (`object_interacted`, `item_picked_up:notes`, `item_picked_up:id_badge`) are all conditioned on ids the pilot does not reuse.

The two majors are about what the player actually hears. E7 and E9 tie "heard" to the 160 px overhear radius around each speaker, which in a 10-tile room leaves the boiler's first user just out of earshot from the north and south doors, while the voice layer would have played the line anywhere in the room. And most crossings at walking pace meet the pair seated: of the four break mappings, only the ward arrival reliably puts a break under a player who does not stop.

## Blockers

None.

## Majors

### M1. E7 and E9 make "heard" mean 160 px from the speaker, which is narrower than the staff room, and the plan sets no radius

Section: 9.1 (E7, E9), 6.4, 6.5, 6.8.

Evidence. E7 decides "unheard" from `world.playerHears(speaker, radius)` (`npc-needs.js:4937` to `:4953`: same room, within `radius`, lit, clear line), with `radius = c.overhearRadius || pool.overhearRadius || OVERHEAR_RADIUS` and `OVERHEAR_RADIUS = 160` (`:47`). E9 starts an exchange only when `playerHears(ex.lines[0].speakerId, ...)` holds. The voice layer uses a different and wider rule: `NpcChatterVoice.say` plays a line whenever the speaker is in the player's room (`npc-needs-chatter.js:206`, `hearingLevel` in `room-hearing.js:9` returns 1 for the same room), at a volume of `1 - d / 400`, floor 0.35 (`npc-needs-chatter.js:243`). Today a line spoken 170 px away in the same room is voiced and audible; with E7 it becomes a picture bubble and nothing is said.

In the staff room (round 13's live positions, room-local px): boiler approach (164, 124), second user (196, 124); Kim's door about (272, 0), south door about (272, 246), IT door about (310, 80). From Kim's door the approach-cell user is 164 px away, and from the south door 163 px, both past 160. The west table's lanyard (tile 2.28, 7.75, about (73, 248)) is 175 px from the second-user cell. All four mapped boiler breaks set the porter's caffeine, so the porter usually arrives first and takes the approach cell: the porter is the speaker a player at the north or south door cannot "hear". Under E7 his pool turns there are pictures; under E9 an exchange whose first line is his does not start. 6.8 never says who speaks first in each exchange, and 6.8's own description of the burn exchange ("The source is the porter's radio") suggests the porter opens it.

What goes wrong. The plan's exit tests (6.4) were measured before E7 and E9, when either speaker in earshot started an exchange and every line was voiced in-room. On the engine with E7 and E9 the doorway crossings, which is where 6.4 says most crossings happen, will hear fewer lines than measured, and the burn exchange's straight-walk figure can fall below the 2 of 5 the exit test requires.

Fix.
1. In 6.5, give both chatter objects an `overhearRadius` (an affordance field the schema accepts, `scenario-schema.json:3749`, and the engine reads into the chat, `npc-needs.js:3870`): starting values 224 on `staff_boiler` and 256 on `staff_cooler`, set in stage 4 so that every walkable cell of the staff-room floor is in earshot of both users' cells. The same-room test still stops it carrying into IT, Kim's office or the corridor.
2. In 6.8, name the first speaker of each exchange, and put whatever the player must not miss in a first line spoken by whichever of the pair stands nearer the doors on the break that usually starts it.
3. In 9.1, state that E7's and E9's earshot is `playerHears` at the chat's radius (object, then pool, then 160), that this is deliberately stricter than the voice layer's same-room rule, and that an author widens it per object. Add a unit test to each: an object `overhearRadius` of 224 makes a speaker 200 px away "heard" for the E7 spend and for the E9 start.
4. In 6.4's exit test, add: from each of the four doorways, a pool line from each speaker is overheard (`npc_overheard:<id>` for both ids) on a break with the player standing in the doorway.

### M2. A player crossing at walking pace rarely meets a break, and the plan gives no figure for it

Section: 6.4 (what starts a boiler break, needs, exit test), 6.8 (totals).

Evidence.
- Mapping 1 (staff-room entry, `delayMs: 2000`) meets 3.9 to 4.3 s after entry (6.4). The crossings 6.4 measured take 2.5 to 4.5 s. So on any crossing the pair meet after the player has left; mapping 1 serves only a player who stops (the first visit, the burn stop).
- Mapping 3 (Kim's close) meets 3.9 s after the close. That is heard when the player stands at the IT door to unlock it, once; afterwards the IT door is open and the walk is shorter than 3.9 s.
- Mapping 2 (the burn) is heard on about 2 of 5 straight walks, before E9 (see m5).
- Mapping 4 (ward arrival) is the only one that reliably puts a break under a crossing player.
- The natural rhythm is one 30 s boiler break every 6 needs-minutes or so (see m4), a duty cycle near 9 per cent. Cooler breaks start at about 22 needs-minutes ((95 - 30) / 3), which in most runs falls in the late game, when the player is around the Security Office, the server room and the VM, whose minigame pauses the needs clock.

What goes wrong. 6.3's table says "on later crossings the pair are often at the boiler and, when they are, a line is waiting". With the mappings as written, most later crossings see two people sitting at their tables, and the 8 cooler clips are likely to go unheard in most runs, although they are paid for.

Fix.
1. Make mapping 4 a cooler break: on the porter, `{ "eventPattern": "room_entered:office_corridor", "condition": "data.previousRoom === 'ward_hall'", "fireOnlyWhenLoaded": true, "cooldown": 120000, "needs": { "set": { "thirst": 20 } } }`. The cooler stands by the south door, which is the door a player arriving from the ward comes through, so the pair are a tile or two from the player as they come in, and the cooler coupling brings the domestic. This depends on m6 (the pair must not block that door).
2. Raise the boiler's `useSeconds` from 30 to 50 (tea, brewed and drunk standing). With E7 a longer overlap spends no extra line: with a 2-minute cooldown each speaker still says one line a break, and picture chat fills the rest. A break started by an entry or by Kim's close is then still running when the player comes back through within the minute, as they do when going to IT or Kim and straight back out. Keep each exchange well inside the 60 s cap.
3. Start thirst at 65 instead of 95 for both (first cooler break at about 12 needs-minutes), so a cooler break falls in the middle of the mission, when the player is crossing the room most.
4. Add an exit test of the room as a player meets it: one scripted walkthrough at walking pace with office life on, logging every staff-room crossing, whether the pair were at an object, and every overheard line by pool. Targets to agree in stage 2, for example: the pair are at an object on at least a third of crossings; at least 6 different pool lines and 2 exchanges are overheard; no pool line is overheard twice. Record the needs-clock length of the walkthrough beside it, since it is not measured anywhere yet.

## Minors

### m1. E8: `routeLength` returns `null` both for "no path" and for "no answer", and the job fails after the leave has fired

Section 9.1, E8. `routeLength` (`npc-needs.js:4888` to `:4914`) returns `null` when the pathfinder is missing, when the call throws, when no callback arrived (no sync support) and when no path exists. `cellBeside`, which E8 copies, falls back to the first walkable side when none passes (`:5015` to `:5019`), and `reachable()` treats "no answer" as reachable (`:4879` to `:4881`, "unknown, so do not block the NPC"). With the fallback removed, a world whose pathfinder cannot answer synchronously would fail every second user with `no_beside_cell` and put the object on a 60 s cooldown. Separately, `_startJob` emits `npc_left_post` and places any left-behind items before it calls `_moveForPhase` (`:2962` to `:2970`), so a partner that fails at once has already "left": harmless in m02 (nothing left behind, nothing mapped on `npc_left_post`), but not in m06. Fix: in the E8 spec, fail only on a definite "no path" (add a `routeKnown` result to `routeLength`, or check `pf.enableSync` in `besideCell` and keep today's behaviour when it is missing), with a unit test for the no-answer case; and state that a `no_beside_cell` partner has already fired `npc_left_post`, or move the capacity-2 check before the leave in `_startJob`.

### m2. E7: with `pictures: false`, an unheard turn returns `null` and the pair give up for the rest of the meeting

Section 9.1, E7. `chatterPool` sets `pictures: false` when the scenario has `"chatter": false` while an NPC's own pool can still hold lines (`npc-needs.js:242` to `:251`). E7 returns `null` for an unheard turn there, and `_tickChats` counts every `null` turn and deletes the chat after 40 (`:3942` to `:3946`, about 20 s at `CHAT_GAP_MS` 500). A player who walks in after that finds a silent pair. No m02 setting hits this, but the skill will apply E7 everywhere. Fix: in the spec, an unheard `null` turn does not count towards the 40 (decrement `c.n` as the `wait` path does), with a unit test.

### m3. E9: the old heard rule is stated in more places than 9.1 lists

Section 9.1, E9, "Docs". Besides `NPC_NEEDS_SYSTEM.md` 5.6a, the old rule ("played to the end, or cut after a heard line") is written in the event reference (`NPC_NEEDS_SYSTEM.md:938` to `:939`), the `_finishExchange` docblock (`npc-needs.js:2740` to `:2746`), the voice adapter comment on exchange lines ("the exchange counts as heard ... when its lines are done or it is cut after a heard line (R5 m2)", near `:4960`), and `npc-world-bubbles.js:546` to `:548`. The showcase has two tasks on the event, `hear_parcel_exchange` and `hear_rota_exchange` (`test_needs_sims/scenario.json.erb:552`, `:659`); 9.1 names only the first. Fix: list all five places, add a "superseded by E9" line at the top of `EXCHANGE_HEARD_FIX_LOG.md`'s "The rule chosen", and check both showcase tasks live.

### m4. The coupled boiler rhythm is about every 6 needs-minutes, not 4, and the cooler's about every 10

Section 6.4, "Needs" and 6.3 table. The four-minute phase offset holds only until the first coupled break. After it, the first user is at about 35 + 40 = 75 and the partner, set to 20, at 60, so the partner is next urgent (35) after (60 - 35) / 5 = 5 minutes; that break leaves the other at 60 in turn. The cycle settles at 5 minutes plus the walk and the 30 s use, about 6 needs-minutes. The cooler settles the same way at (60 - 30) / 3 = 10 minutes plus the use. Fix: correct "about every four minutes" (6.3, 6.4) and "about every thirteen minutes", and redo the repeat estimate from the corrected rhythm (four heard boiler breaks is then about 24 minutes for a still player; the main repeat risk is a player who goes in and out, which mapping 1 turns into a break every 2 minutes of wall time).

### m5. The burn exit test's "2 of 5" was measured before E9

Section 6.4, exit test, second item. The 2 of 5 straight walks were measured when either speaker in earshot started the exchange. With E9 only the first speaker counts, and in one of the five measured runs the exchange started with its first speaker at 177 px. Fix: with M1's radius in place, keep "2 of 5"; without it, record the straight-walk figure rather than pass on it, and keep the pass bar on the 3 s stop (5 of 5) and on `heard_night_watch_burned` staying false whenever no line was overheard.

### m6. The cooler's cells sit beside the south door, the room's main entrance

Section 6.5, dressing checks. Round 13 measured the cooler's approach cell 20 px from the south doorway, and 6.5's check names only "queue and approach cells". With two NPCs standing at the cooler, the second user's cell can narrow or block the door the player uses most, and M2's fix 1 puts the pair there exactly as the player arrives. Fix: extend the check to the second user's cell, choose the cooler's `useFrom` on its north or west face so neither cell is within one tile of the doorway, and add an exit test: with both NPCs `using` the cooler, the player walks from the corridor into the staff room and on to Kim's door without stopping or being pushed.

### m7. Stage 4 needs stand-in sprites with seated frames, and the seat checks must run again on the real atlases

Section 6.3 (cast), stage 6, 6.4 exit test. NPCs sit only when their atlas has `sit_south_frame_000` (`seating.js:269`, `:1554`, `:1975`), and the seated position is corrected per atlas (`SIT_HIP`, `sitShift`, `seating.js:43` to `:81`). The PixelLab spend for the pair is not yet approved, so stage 4 will build and measure "return home and sit" on borrowed sprites. Fix: name in 6.3 the stand-in keys stage 4 uses (existing atlases with seated frames, not the key of any recurring character), and add to stage 6's closing check that the posts, the seat checks and the boiler and cooler pairings are measured again once the real atlases are imported.

### m8. Building E7 to E9 on `build/ol-sims` ties its merge to SIMS-1 to SIMS-3

Section 9.1, scope, and section 9, alignment. If the build starts from `build/ol-sims`, its branch carries SIMS-1 to SIMS-3, so it cannot reach main before they do, and SIMS-2 then lands before the pilot's stage 4, not stage 5 as section 9 says. Fix: state the merge order (SIMS-1 to SIMS-3 first, or in the same batch), have the E7 to E9 implementation reviews diff against the `build/ol-sims` tip it started from, and note that `_moveForPhase` is touched by both (SIMS-2's `moveId` stamping and E8's failure path).

### m9. Two test hooks the spec relies on do not exist yet

Section 9.1, E7 tests and live proof; 6.4 exit test. The voiced-chatter fixture's `playerHears` ignores the NPC id (`npc-voiced-chatter.test.mjs`, `office()`: `w.world.playerHears = () => ...`), so "a pair nobody hears does not take the speech lock: a heard pair at a second cooler speaks" needs a per-NPC hearing option added to the fixture. The exit tests read "the bag position" through `window.__test.needs`, which exposes no chatter bags (`test-bridge/index.js:2060` onwards). Fix: say the fixture gains a `hears(id)` form, and either add a bag getter to the bridge in the E7 item or name the direct read (`window.npcNeedsSystem._bags.get('night_porter|coffee')`).

## Nits

- n1. 6.1 lists "a mug of coffee 'still warm'" on the east table; 6.3 calls it "the porter's tea". Pick one, after checking the item's own text.
- n2. Every mapped break sets the porter's need. With the porter knocked out, the domestic gets only her natural breaks, alone and silent. 6.11 tests the domestic's knock-out only; add one line saying the porter's knock-out stops the room's mapped breaks, which is accepted.

## The planner's own choices

- **Cooler coupling both ways, thirst 20.** Sound. The `set` lands while the first user is mid-use and the restore is added at completion, so it never loops; it does pull the two thirst clocks together (m4). If M2's mapping 4 becomes a cooler break, the coupling carries it as written.
- **No `playerHears` keeps today's behaviour.** Correct for both: E7 then speaks as today, and E9's `this.playerHears` returns `false` as `_audience` does, so exchanges never start in such a world, as today. The node stubs that omit it (the sims fixture, the tick-cost tests) are unaffected. The social-pairing fixture supplies `playerHears` returning `overheard: false`, so its line-asserting tests do change, which 9.1 already lists.
- **E8 fails with `no_beside_cell`.** Sound, and better than standing on the first user's cell or walking to a timeout; it needs the no-answer guard and the ordering note in m1.
- **E9 replaces the `EXCHANGE_HEARD_FIX_LOG` rule.** Sound: the old reason ("the start already needs the player in earshot") held only for either speaker, and even with E9's start gate a first line that waits for the speech lock can still be spoken to an empty room, so `heardLines > 0` is the right test. The extra places to update are in m3.

## Other checks that held

- Clip count: 4 pools of 4 (16), exchanges 3 + 3 + 5 (11), conversations about 14 + 12 (26): 53; the fallback shape (12 + 11 + 26) is 49, and dropping the cooler pools gives 45. Player lines are not voiced (`tts_line_extractor.rb`, `resolve` returns nil for `player`), and the extractor's character registry spans every scenario NPC, so porter lines inside the domestic's exchange knots are keyed to the porter's voice.
- m02 text: the handover board is the Ward 3 / Exec board (`scenario.json.erb:3386`), which the pair can plausibly share; `cover_burned` is set by the `objective_task_completed:talk_to_gary` mapping (`:932` to `:938`), so a knock-out (`taskOnKO: talk_to_gary`) also burns cover without closing a conversation, and the burn break and print correctly do not fire; Val's own lines put security on the radio (`ink/m02_npc_security_guard.ink:257`, `:532`, `:705`), so the burn and cleared exchanges' source fits; Gary's seventh email was copied to the Board Secretariat (`scenario.json.erb:97`, `:2195`), so the secretariat's automatic reply on the copier tray fits; the debrief reads only its own KO globals (`ink/m02_closing_debrief.ink:34` to `:67`), so the new globals change no debrief line.
- Music: attacking the porter or the domestic switches to the threat playlist (`scenario.json.erb:146` to `:150`), as for any m02 NPC today; nothing new.
- Stage plan: tooling, E1, then E7 to E9, then stages 0 to 3, then 4 to 8 is in a workable order, with m7 and m8 the two gaps.

## Outcome notes

- m8 declined as written: the integrator decided E7 to E9 are built from main, not from `build/ol-sims`, so there is no merge order to state; plan 9.1 instead has `build/ol-sims` merge main afterwards, records the shared `_moveForPhase` edit, and has the implementation reviews diff against the main commit the branch started from.
