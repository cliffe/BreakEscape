# m02 office life: stage 5 review, round 1

Subject: the first office-life mission, `m02_ransomed_trust`, with the night porter Ernesto Bautista and the night domestic Hodan Warsame in the staff room (the Night Handover room), Gary's mug and the IT copier. Branch `build/ol-m02` at cb3555849 (main merged). Review date 2026-11-16.

Scope: the live evidence in `STAGE5_LIVE.md` (rounds R1 to R3) and the stage 4 live files, the stage 4 reviews, `SPOKEN_LINES.md`, the office-life data in `scenario.json.erb` and the two inks, and the seat and pairing screenshots from the stage 5 runs. The VM part of m02 is out of scope. No server was started for this review. Static checks run here: the validator for m02 (current and pre-merge versions), and a fresh `inklecate` compile of both night-staff inks (both match the committed JSON).

## Verdict

Not yet ready to ship, for one reason: nobody has played m02 from start to finish with office life in it, on the real atlases, as a player would. Every part has been probed on its own and most probes pass, and the design is sound. The night staff add life to the hub, every line they speak is scenario data, the gating is right, and nothing found so far blocks the critical path. What is missing is one walked playthrough that joins these parts up (M1). A long walkthrough is running now. If it passes the bar in M1, the pilot can ship once the minors below have been fixed or declined.

## Answers to the review questions

**Life without getting in the way.** Yes, on the evidence so far. Both seats read well on the real art (Ernesto north of the east table facing south, cup in front of him; Hodan at the laptop desk seen from behind), and the pairs stand at the counter and the cooler without crowding a doorway (`out/boiler-pair-5541.png`, `out/cooler-pair-5541.png`, `out/microwave-5541.png`, `out/seat-room-5607.png`). Every clue and pickup in the room opened with the pair at the boiler or the porter at the microwave (`STAGE4_LIVE_R4.md` section 3). The three free cups were clickable with both seated and with the porter hostile. Crossings: cooler 5 of 5 walked, Kim exit 5 of 5, mapping 4 at the south doorway 1 of 1, all with no stop or push.

**Spoken lines.** Every spoken line is scenario data: pool lines in the NPC records (`scenario.json.erb:3511` to `:3514`, `:3547` to `:3550`), exchanges and conversations in the two inks. The HaX texts and credits lines are text only, by decision. Chatter is only drawn inside a two-NPC chat (`npc-needs.js:4391`), so Hodan's "My feet have given up, Ernesto." can never play to an empty room. Exchanges are heard once (`heard_<knot>` globals, set on the first overheard line, `npc-needs.js:3005` to `:3020`). The cleared exchange did not replay after a reload (`STAGE4_LIVE_R3.md` section 2). None of the 71 clips has been generated (owner decision D2).

**Paper and burn exchanges.** The gates are right. The burn exchange needs `cover_burned`, which Gary's ink sets during his conversation (`ink/m02_npc_gary_whitlock.ink:206` and four other places), so the condition on Ernesto's mapping 2 (`scenario.json.erb:3522`) and Gary's print mapping (`:2130`) are true when his conversation closes. In a running break the burn exchange plays when the player walks back (variant A, 5564). If the paper exchange has already played in that break, the burn exchange waits for the next meeting and then plays in full (variant B, 5593). The burn exchange's first line stands alone ("Radio says security want a visitor."), so a player who hears only that still gets the beat. The paper exchange's first line does not (m1).

**Earshot and the 36 dead cells.** There are no dead floor cells. R3 corrected the body-centre offset (R2 was off by up to 73 px) and cleared the 150 ms sight cache for each cell. Of the 36 cells that heard nobody, 20 are corridor cells at y 340 and 372 that the scan box took in, and 16 are the top row (y 20) and east column (x 308), which the path grid calls walkable but the player's body cannot reach (the walk stopped at y 45 and x 274 to 276). All 52 reachable cells heard both speakers at both objects, and the walked check heard both from 8 of 8 stopping points (`STAGE5_LIVE.md:94`). One side note for the engine, not m02: the path grid treats 16 wall-band cells as walkable, so an NPC route could plan through them. No job failed in any run.

**The 2-minute walk-in cooldown.** About right in length. The pair were at an object on 6 of 16 crossings (target at least a third), and a shorter cooldown would put them at the boiler on nearly every visit, which reads as two people who never work. It is the same length as the 2-minute `chatterCooldownMin`, though, so a walk-in that comes as soon as the cooldown allows often lands inside the quiet left by the last heard line. The player then sees only pictures (m3).

**Seats, posts and pairings on the real art.** Correct. Seated shifts (0, -1) and (0, -3); Ernesto at (223, 154) on `staff_room_hospital_chair_south_20`, whose chair shows at the table's north side when he is away; Hodan at (117, 176). Boiler, cooler and microwave pairings sit where they were measured. All 12 routes to the user cells exist. One cosmetic point: at the microwave, Ernesto stands in front of the fridge (m4).

**Needs walks and doors.** No door or required interaction is blocked on the evidence. The cooler cells are 160 px or more from every doorway. The microwave cell is 51 px from the east (IT) doorway's first floor cell, and no walked crossing into IT has been run while Ernesto stands there (m4).

**Can a player get stuck?** Nothing found that traps a player. Two things are open: the hostile porter or domestic after an attack (a hazard in the hub by design, leashed to the room, decided by the user), and the unexplained silence when talking to Hodan after the reload-after-attack run (m6).

**Validator, 33 warnings.** The two new warnings are not office life and are not caused by any data change. The pre-merge validator (e4bb34454) gives 31 on the current scenario. The current validator dropped one warning (top-level `validSprites` was unknown; the schema knows it now) and added three (`onceOnly` on the three `timers`, `scenario.json.erb:3744`, `:3754`, `:3764`, now flagged as ignored by the engine). Net +2. No change in m02 behaviour, but the handover baseline is stale (m7).

**Tone and canon.** Good fit. The lines agree with the room and the mission: "Lift's out again" matches the handover board's "Lift 2 still out"; the porter's "I'm the tubes now" and the paper exchange match a hospital running on paper; Hodan's bed list "on the back of a menu" matches her observation. The burn and cleared exchanges give dramatic irony without naming the player. Ernesto's told-security answer comes back in his radio topic. The KO and attack texts put HaX's voice where it belongs ("That is not who we came for."). Exchanges are gated off after Bed 4 dies. The cast adds two ages and backgrounds the mission did not have. One small fit question with the clerk's laptop (m8).

## Findings

### Blocker

None.

### Major

**M1. No walked end-to-end playthrough with office life on the real atlases; the whole-room run teleports and leaves out the story beats.**
Where: `STAGE5_LIVE.md:96` (R3 walkthrough counts, game 5608), the scratchpad script `m02-s5/walk3.mjs` (moves the player with `g.enter(room)`, sits 3 s in the staff room, never talks to Kim or Gary, never sets `cover_burned`), `STAGE4_LIVE.md:71` (stage 4 ran only the office-life touch points).
Failure scenario: each part passes on its own, but in a real run they come in one sequence: the player crosses the hub from Kim's office, a walk-in break begins, Gary's conversation closes into mapping 2, the HaX "Val can disprove your cover" text arrives 1.5 s after entering the staff room (`scenario.json.erb:978` to `:983`), and Val's corridor challenge fires as the player leaves south. No probe has run that sequence by walking, so a doorway stop, an exchange cut by the player's own route, or a missed burn break in natural play would only show up after release. The teleport run also cannot show physical blocking, and its counts (4 pool lines, 1 exchange line) say nothing either way about the targets.
Fix: hold the ship decision for the long walkthrough now running on :3090, and judge it against a stated bar: the player moves with `moveTo` between rooms (no `enterRoom`); real Kim and Gary conversations; the burn exchange overheard after the walk back from IT in natural play, with `cover_burned` set by Gary's ink, not seeded; no `npc_job_failed`; no stop or push at any staff-room doorway; at least 6 distinct pool lines and 2 exchanges overheard; no pool line repeated within one bag cycle; the mission completes. If any of these fails, open a stage 5 R2 item for it.

### Minor

**m1. The paper exchange is consumed by its first line, and that line is an unanswered question.** (Owner decision D1.)
Where: `ink/m02_npc_hodan_warsame.ink:105` to `:111`; heard rule `npc-needs.js:3000` to `:3020`; evidence `STAGE5_LIVE.md:96` (only `night_watch_paper:0` heard, then gone).
Failure scenario: the paper exchange is ungated, so it is the first exchange most players meet. PLAN 2.9 says a crossing hears one or two lines at most, and this is the five-line exchange. A player who walks through hears "How many lab runs is that now, Ernesto?", leaves, and the exchange is marked heard and never plays again. The pair's character beat ("Hospital runs on legs tonight. Ours." / "Don't let them hear you enjoying it.") is lost. The Kim-exit and stage 4 crossings heard 4 or 5 lines, so this is not every run, but it is the likely result for a player who keeps moving.
Fix, if the owner agrees to touch the approved sample: let the first line carry the beat on its own, for example Ernesto opening with "Eleven lab runs tonight. Every result in an envelope.", Hodan's menu line second, and the closing pair kept. That is a reorder, with one line reworded and no new clip count. Otherwise keep it as written and accept fragments.

**m2. Ernesto's radio topic is a once-only choice, so asking it before the cleared exchange loses the cleared read-back.**
Where: `ink/m02_npc_ernesto_bautista.ink:69` to `:86` (one `*` choice whose body branches on `heard_night_watch_cleared`). Hodan's ink does this right with two separate choices (`ink/m02_npc_hodan_warsame.ink:66`, `:71`).
Failure scenario: the natural order is to hear the burn exchange, ask Ernesto "Busy night on the radio?", then get cleared by Val. The choice is spent by then, so his "Your lot sorted it, I expect. Paying you nights after all." never plays, and that is the payoff of his told-security answer. R4 (5282, 5283) seeded both globals at game creation, so it never asked the question twice.
Fix: split it into `* {not night_staff_attacked && heard_night_watch_burned && not heard_night_watch_cleared} [Busy night on the radio?]` (the burned lines) and `* {not night_staff_attacked && heard_night_watch_cleared} [Did security find that visitor?]`, or another label of your choice (the cleared lines). Same clips, one new choice label (not voiced). Recompile and rerun inkcheck in the burned-then-cleared state.

**m3. The walk-in cooldown is exactly as long as the chatter quiet, so walk-ins often show only pictures.**
Where: `scenario.json.erb:3521` (`cooldown: 120000`, wall time) against `:3510` and `:3546` (`chatterCooldownMin: 2`, needs clock, which pauses while the VM is open); evidence `STAGE5_LIVE.md:74` (5561).
Failure scenario: the last heard pool line came some seconds into the previous break, so a walk-in allowed at 120 s starts its turns while the speaker's quiet still has seconds or more to run. A player who crosses in 3 s sees pictures only. With the VM open between visits the quiet runs longer still in wall time. This is designed behaviour, and the effect is fewer spoken lines on the visits the mapping was meant to fill.
Fix: raise the walk-in cooldown to 150000 ms (and mapping 3's at `:3523` to match), so the quiet has always run out when a mapped break begins. Leave `chatterCooldownMin` at the user's 2 minutes. Recheck the "pair at an object" share in the M1 run; it should stay at a third or more.

**m4. The microwave cell is near the IT doorway, and no walked crossing into IT has been run while Ernesto uses it; he also stands at the fridge rather than the microwave.**
Where: `scenario.json.erb:3645` to `:3648` (`useFrom { dx: 0.5, dy: 1.5 }`); 51 px from the east doorway's first floor cell (`HANDOVER.md:64`); `m02-s5/out/microwave-5541.png`.
Failure scenario: IT is the most visited room on the critical path after the hub. Needs walks do not yield to the player. A player heading for Gary while Ernesto heats food (about once every 30 minutes) passes within half a body width of him. There is no evidence either way whether the player is stopped or slides past. In the screenshot he faces the fridge and dishwasher about 20 world px right of the microwave, so the use does not read as the microwave.
Fix: run 5 walked crossings from the south door to the IT door with Ernesto `using` the microwave, logging any stop or push. Try `dx: 0.25` and recheck the 64 px gap to Hodan at the boiler approach cell. Keep 0.5 if the gap closes too far.

**m5. Several stage 5 PASSes rest on single tries or stand-in triggers.**
Where: `STAGE5_LIVE.md:79` (variant A: one try, `cover_burned` seeded, no `conversation_closed:gary_whitlock` seen), `:95` (variant B: one try, `cover_burned` set at the close by the harness rather than Gary's ink, `heard_night_watch_paper` read false 25 s in and not read again), `:75` (walk-in pool line: one game), `:42` (KO timing: one knock-out, the gap at exactly the 4 s limit), `:39` and `:40` (radio branches: seeded globals), `:18` (routes computed with `routeLength`, not walked), and stage 4 R2b mapping 4 at 1 of 1.
Failure scenario: a timing-sensitive fault (the mid-break absorption of mapping 2, the paper exchange's last line before the burn) passes once and fails one time in three in play.
Fix: let the M1 run cover the natural burn sequence. Rerun variants A and B to the plan's five tries each, with Gary's real conversation setting `cover_burned`, and read `heard_night_watch_paper` after the break ends. The others can stand as they are.

**m6. Talking to Hodan after the reload-after-attack run gave nothing, and it was logged as PASS without follow-up.**
Where: `STAGE5_LIVE.md:41` (5540: "Talking to Hodan straight after showed no line within 1.5 s (the hostile porter was close); not followed up").
Failure scenario: if a hostile NPC nearby stops any conversation from opening, a player who punched Ernesto cannot talk to Hodan while he stands between them. That is harmless for the mission (she is ambient), but it could look like a frozen interaction. If it was only the 1.5 s window, there is no fault.
Fix: repeat with a 5 s wait and the porter at more than 160 px, and record whether her wary greeting ("Don't come any nearer...") opens. If the engine blocks talk near a hostile on purpose, note that and close it.

**m7. The validator baseline in the handover is stale; the three timer `onceOnly` fields are now reported as ignored.**
Where: `HANDOVER.md:57` and `:73` (31 warnings), `STAGE5_LIVE.md:103` (33); `scenario.json.erb:3744`, `:3754`, `:3764`.
Failure scenario: the next agent sees 33 against 31, spends time hunting an office-life regression that does not exist, or misses a real new warning hidden in the gap.
Fix: record 33 as the new baseline in the handover, with the reason (the validator from main stopped flagging `validSprites` and started flagging timer `onceOnly`). Whether to remove `onceOnly` from the three timers is m02 data outside office life: a delay timer fires once anyway, so removing the field should change nothing, but check the timer code before removing it, and leave it to the m02 owner.

**m8. Hodan sits at the ward clerk's desk with her back to the player, facing the laptop the player is told to take.**
Where: `scenario.json.erb:3534` (her post), `:3612` to `:3618` (the laptop: "Take it."); `m02-s5/out/seat-hodan_warsame-5607.png`.
Failure scenario: the player lifts the only working machine in the building off the desk in front of a seated member of staff, and nothing reacts. In a room that now has people in it, that is the one moment where the office life works against the scene.
Fix (optional, cheap): add to the laptop's observation that it sits on the side of the desk the domestic is not using, or add a third line to Hodan's re-entry cycle once the laptop is taken (one new clip, and it needs a global set on pickup). Or accept it: the seat is set by the art and the existing tables.

## Owner decisions

- **D1 (m1).** Keep the paper exchange exactly as approved, or reorder it so its first line stands alone. The reorder changes one line's wording and the order of the approved sample.
- **D2.** Voicing: 71 office-life clips (16 pool, 11 exchange, 44 conversation, per `SPOKEN_LINES.md`), none generated. Decide whether the pilot ships voiced (generate and listen first) or text-only for now. Shipping text-only is possible, but the first office-life mission would then show its main feature, overheard talk, in silence.
- **Carried, still open:** the copier page's `takeable` (`HANDOVER.md:86`, dialogue R1 m10) and the struck-only credits line that hides a second victim (impl R1 m5). Neither blocks the ship.

## Evidence quality

Strong: seats and pairings on the real atlases (three games each, runtime frame plus screenshots); per-cell earshot after the R3 correction, with walked confirmation; the clue and cup interactions with the pair busy; the cooler and Kim crossings at 5 of 5; the reload checks on the round 2 ink; the attack and leash behaviour across stage 4 and 5.

Weak or partial: the items in m5; the whole-room counts (teleport, no story beats, M1); the R1 cell scan and the R2 partial scan, both superseded. The R1 "FAIL 2" and R2 "36 cells" were probe artefacts, and their write-ups say so.

## Checks run for this review

- `ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb --no-graph`: 0 errors, 33 warnings.
- The validator at e4bb34454 on the current scenario: 31 warnings; diff of warning lines as in m7.
- The current validator on the scenario at e4bb34454: the same warnings as on today's scenario (the scenario edits since then add none).
- `inklecate` on `m02_npc_ernesto_bautista.ink` and `m02_npc_hodan_warsame.ink`: output identical to the committed JSON.

Stage 5 R1: 0/1/8

## Outcomes (2026-11-16)

| Finding | Outcome |
|---|---|
| M1 | Done. The long walkthrough ran in R4 (`STAGE5_LIVE.md`, "R4 walkthrough", game 5626): moveTo between rooms, real Kim and Gary conversations, 26 PASS, 0 FAIL, 0 NOT RUN. The target caveats it raised are in that section. |
| m1 | D30 (a) built (2026-11-16): `night_watch_paper` is 4 lines, Ernesto opens, Hodan's question dropped. The heard rule part of D30 is not covered here. |
| m2 | Fixed (part 1). Ernesto's radio topic is two choices, burned and cleared; recompiled and checked in 5 states. |
| m3 | Fixed (part 1). Mappings 1 and 3 walk-in cooldown 150000 ms. Mapping 4 stays at 120 s, because the review named only 1 and 3. |
| m4 | Live check in `STAGE5_LIVE_R5.md` (separate run). |
| m5 | Live check in `STAGE5_LIVE_R5.md` (separate run). |
| m6 | No fault. The silence was the hostile porter knocking the player out during the wait (game-over screen blocked `interact`); the greeting opens in 245 ms after a reload (game 5673). No ink or engine change. |
| m7 | Fixed (part 1). Baseline recorded as 0 errors, 33 warnings; the timer `onceOnly` fields are left to the m02 owner. |
| m8 | Fixed (part 2). Hodan's seat cannot move, so she barks once when the clerk's laptop is taken: "Clerk'll want that back. Just saying." (37 characters; the first draft was 42, over the bubble limit). Proved live, game 5671. On the To voice list. |
| D1 | D30 (a) built. |
| D2 | Closed (2026-11-16): all 75 office-life clips are voiced and committed (the 76 less the dropped question). |
| Carried: copier page `takeable` | Open, does not block the ship. |
| Carried: struck-only credits line | Added to `docs/IDEAS_BACKLOG.md` as an office-life rollout item. |
