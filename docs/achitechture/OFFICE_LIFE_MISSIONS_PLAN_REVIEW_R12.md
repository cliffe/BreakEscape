# Office life missions plan: review, round 12

Reviewer: fresh adversarial design review of `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` at 8748f2bf8 (draft 12). Earlier review files and the handover doc were not read. Every claim below was checked against the code, and the timing claims were measured live in headless Chromium on a keyless server (port 3090), on m02 games whose scenario copy was patched with the pilot's fields (details under Live proof).

## Verdict

Not ready for stage 4. The skill's structure, the validator design (V5's lists match every `npc_*` literal in the tree), the sync sums, the canon analysis and Gary option (a) all hold up. Gary option (a) works exactly as claimed: his sprite never moved over 10 minutes of needs clock, the print lands 6.0 s after the conversation closes, and the copier sound plays.

The staff-room pair, which carries the pilot's whole claim that a player hears office life, does not behave as section 6.4 says. Four things go wrong, all measured:

1. a break started from the previous room is not running when the player crosses, and the pair's pool lines are spent where the player cannot hear them;
2. the cooler never pairs, because the second user's cell is inside the east wall;
3. the coupling mapping misses whenever a break follows another break;
4. two of the three exchanges cannot be heard on the walkthrough's talk route.

Each has a scenario-level fix, given below, so the pilot can still go ahead without an engine change. Section 6.4 needs rewriting around the measured numbers, though, and its exit test needs to be made honest.

Counts: 0 blockers, 4 majors, 7 minors, 3 nits.

## Blockers

None.

## Majors

### M1. A break started "one room earlier" spends the pair's pool lines unheard, and a 2 to 4 s crossing hears at most one line

Evidence:
- Plan 6.4 (lines 463 and 465) says the break starts on the entry before a crossing, so it is "under way as the player crosses the room ... with a voiced line or an exchange", and the exit test wants a voiced pool line or exchange line in at least half of such crossings.
- `npc-needs.js:2637-2643`: `_pickBark` takes a bark and starts the speaker's `chatterQuietUntil` cooldown whether or not anyone can hear. `_tickChats` (`:3940`) calls it at pairing with no audience check. Only an exchange waits for an audience (`:3904`, `_audience`).
- `npc-needs-chatter.js:243`: a line spoken while the player is in another room is not voiced (`other_room`), but the cooldown has already been spent.

Measured (game 3802, needs clock in seconds):
- **Corridor to Kim.** Corridor entry at 143.0; the porter leaves post at 144.0; the player enters the staff room at 145.5, 2.5 s after the trigger; the pair pair up at 146.25. The first bark, "D coffee two.", is spoken with `overheard: false` at 188 px, beyond the 160 px radius, so the domestic's two-minute cooldown is gone before the player is in range. One exchange line is overheard at 150.0, the same tick the player enters Kim's office. Crossing: 4.5 s.
- **IT to corridor** after a 60 s visit. The IT-entry break ran entirely while the player was in IT. The staff-room fallback was still on its 120 s cooldown. Nothing was said during the 3.25 s crossing.
- **Game 3799, first entry.** The fallback break's first bark was spent at 189 px. The exchange started 3.75 s later, once the player walked within range.

Entry triggers on IT, Kim's office and the Boardroom fire when the player arrives in a room where they then stay for a conversation (Gary, Kim, Reeves). By the time they leave, the 30 s break is over. The corridor trigger gives at most about 2.5 s of head start, because the corridor's ward door is about 260 px from the staff-room door. Once the reachable exchanges are used up (see M4), later crossings mostly show picture chat. The exit test would then fail over a whole walkthrough.

Fix (choose one, then rewrite 6.4 and its exit test from measured numbers):
- (a) **Recommended.** Add an engine item E7 for user approval: in `_tickChats`, give picture chat without taking a bark or starting the cooldown when `_audience` is false, so pool lines are kept for a player who can hear them. It is small, testable in `test_needs_sims`, and helps every later mission. It breaks the "no runtime engine change" line in section 9, which must then say so.
- (b) With no engine change: set `chatterCooldownMin` well under 1 on the pair, and accept that the 4-line bags cycle while unheard. Then rewrite the exit test as "on the first visit (walkthrough step 10, where the player lingers) the paper exchange plays in full; on later crossings the pair are seen at the boiler and sometimes heard".
- Either way, drop the IT, Kim and Boardroom entry triggers, or replace them with the M4 trigger. They fire into rooms the player does not leave for a minute or more.

### M2. The cooler never pairs: the second user's cell is inside the east wall

Evidence:
- Plan 6.5 (line 475) gives `staff_cooler` only the cooler preset, with no hand-written cell. The plan's cell checks cover queue and approach cells only: stage 4 slice 1 (line 218), and 6.5 "Dressing checks" (line 487). 6.4 (line 461) mentions the second-user cell only for which way it faces.
- `npc-needs.js:5021` `besideCell` tries east first. It needs only a walkable 8 px cell (radius 0) and does not test reachability. `:3106` gives a walk at least 20 s before it fails.

Measured (game 3828):
- The cooler's approach cell is (276, -12) world, room-local (276, 244). Its `besideCell` is (308, -12), local x 308 px (9.6 tiles), against the east wall. A path search from either NPC's post to it returns no path, while the boiler's beside cell (196, -132) is reached in 8 and 13 steps.
- With both NPCs at their posts, setting the domestic's thirst to 20 makes her leave at 75.5 and the coupled porter leave at 76.25. She uses the cooler from 77.5. He walks for 20 s and logs `job_failed ... reason: timeout` at tick 385 (96.25 s), then walks home. There was no chat, and the cooler is skipped for him for 60 s after that (`FAIL_COOLDOWN_MS`).

Every cooler break in the pilot is therefore solo, the porter's walk to the corner and 20 s wait look broken, and both NPCs' 4-line `cooler` pools are voiced and paid for but never spoken. V10 (line 296) cannot see this, and 6.10 (line 556) predicts "V10: nothing".

Fix:
- Give `staff_cooler` a hand-written `useFrom` that puts the approach cell west of the cooler front, so that `besideCell`'s first candidate is open floor that can be reached. Prove in stage 4 that both NPCs are `using` the cooler at once.
- Add "the second user's cell at every capacity-2 chatter object is reachable from both posts" to stage 4 slice 1, to 6.5's dressing checks and to 6.10. It is a live check through `window.npcNeedsSystem.world.besideCell` plus a path search, because the validator cannot see the walk grid.
- Note in section 4 that V10 is a static check and needs this live companion.

### M3. Coupling on `npc_left_post` misses whenever a break follows another break

Evidence:
- Plan section 2 (line 73) and 6.4 (lines 463 and 466) couple breaks on `npc_left_post:<partner>`. 6.4 says "entry breaks alternate between the two chatter objects and both pools are used".
- `npc-needs.js:2959`: `npc_left_post` is emitted only when the NPC leaves from its post (`s.atPost`). An NPC that goes straight from one job to the next, or is still walking home, emits nothing.

Measured:
- **Game 3802.** The Kim's-office entry set the domestic's thirst to 20 at 150.0, while she was at the boiler. At 176.5 she went straight from the boiler to the cooler and used it alone. The porter's coupling never fired because she was not at her post.
- **Game 3799** (a post that could not be reached, see m2). She stayed in `returning` for over 90 s. Every later leave emitted no `npc_left_post`, so the porter never joined her again.

Fix:
- Couple on `npc_use_started:<object>` with `condition: "data.npcId === '<partner>'"`. It fires on every use, whether the NPC came from its post or not. The partner starts about 1 s later than with `npc_left_post`, so the boiler's overlap stays near 27 s and the cooler's near 22 s.
- Or keep `npc_left_post` and add the `npc_use_started` mapping as a second trigger.
- State the at-post rule in section 2's "Talk needs a pair" paragraph, so later missions do not repeat the mistake.

### M4. `night_watch_burned` and `night_watch_cleared` cannot be heard on the talk route

Evidence:
- 6.8 (lines 523-529): `night_watch_burned` needs `cover_burned: true, cover_restored: false`, and `night_watch_cleared` needs `heard_night_watch_burned`.
- Walkthrough steps 20-21: after the burn the player leaves IT, crosses the staff room into the corridor, and Val opens `cover_challenge` on corridor entry. On the talk route `val_opens_office` sets `cover_restored`.
- An exchange starts only with the player in earshot (`npc-needs.js:3904`).

On the one crossing between the burn and Val's clearance (IT to corridor), nothing is running: M1's IT-exit measurement shows a silent 3.25 s crossing. If the staff-room fallback is off cooldown, it pairs the two about 3.25 s after entry (measured in games 3799 and 3802), and by then the player has gone. After Val clears the player, the gate for `night_watch_burned` never holds again, and `night_watch_cleared` depends on it. About 5 of the roughly 15 exchange clips are reachable on the recommended route; the other 10 are voiced and never heard. Only the pick or KO routes past Val, which leave `cover_restored` false, can reach them on a later crossing.

Fix:
- Start the burn break from the moment it belongs to: a porter mapping `{ "eventPattern": "conversation_closed:gary_whitlock", "condition": "globalVars.cover_burned === true", "onceOnly": true, "needs": { "set": { "caffeine": 20 } } }`. The pair are then pairing at the boiler as the player walks out of IT. Measured pairing is about 3.25 s after the trigger, against about 2 s to leave IT, so stage 4 must confirm the exchange starts with the player in the staff room; a `delayMs` of 0 to 2 s may be needed.
- Or loosen the gates so the pair can play burned then cleared, in order, on any later crossing: burned needs only `cover_burned`, and cleared also needs `cover_restored`.
- Either change adds at most one `onceOnly` key; update 6.9 (9 keys becomes 10) and V8's expectation.

## Minors

### m1. HOME_EPS is not what keeps Gary still, and the stage 4 proof would pass with a wrong `useFrom`

6.2 (a) (line 408) rests "never moves" on the 12 px tolerance. `npc-needs.js:3110` does not move an at-post job at all (`s.atPost && this._atOwnPost(s)`), whatever the distance. The tolerance only matters on `_goHome` without `stayPut` (`:3773`): the `resume` command, or the walk back after hostility.

Measured: with a `useFrom` 0.3 tile off, the home was 14.7 px from his body, and he still drifted 0 px over 10 minutes of needs clock (five sips, never seated). With the `useFrom` aimed at his body centre (dx 0.44, dy 1.39 from the mug at (187.5, 141)), the home was 3.4 px away, and `suspend` then `resume` left him at 0 px.

The proof in line 414 (2 px over 10 minutes) therefore cannot catch a wrong cell. Fix: say that the at-post rule keeps him still and the tolerance covers the resume and calm-down paths, and add a `suspend`/`resume` step to the stage 4 proof. Also note that an NPC's `position` is its body-centre (feet) point: Gary's (6.3, 5.8) is the body centre (201.6, 185.6), with the sprite centre 31 px above.

### m2. "The walkable cell in front of the chair" does not exist for either post

6.3 (lines 435-436). The porter's chair faces south at the east table's north edge, so in front of it is the table. The domestic's chair faces north, and directly behind it, 9 px away, is the west table (chair bottom y 6.25, west table top y 6.53, overlapping x 3.41 to 3.87).

Measured: a post at (3.66, 6.6) lay inside the west table. The domestic never got home; `return_resumed` fired every 3 s for over 90 s, and that broke M3's coupling. Posts at porter (6.97, 4.85) and domestic (4.2, 6.1) worked, and both NPCs sat (`npc_sat` after each break). Fix: describe the posts as "north of the porter's chair" and "east of the domestic's chair", with these coordinates as starting values. Add `npc_returned_post` after every break to the stage 4 exit test.

### m3. The pair do not exist until the staff-room door opens

On load only `office_corridor` was in `window.rooms` (probe of game 3795). The porter's corridor and IT mappings are registered only once the staff room loads, so the first corridor entry does nothing. The NPCs register as the door opens, and the `room_entered:staff_room` fallback then fires one tick later (registered at tick 29, `level_set` at tick 30, games 3799 and 3802). 6.4 should say that the first visit runs on the fallback, which is the visit where the player lingers.

### m4. The entry break makes the pair jump up as the player walks in

`npc_stood` came 0.1 to 0.4 s after `room_entered:staff_room` and after corridor entries (game 3802). Two seated people rising the moment a visitor enters reads as a reaction to the player. 6.4 or the dialogue review should accept this or soften it, for example with a short `delayMs` on the staff-room fallback.

### m5. Five-line exchanges on a crossing are mostly unheard

Plan 6.8 has "about 5 lines each". A cut after one overheard line counts as heard, and the rest plays to an empty room (schema `exchanges` description). Measured: crossing 1 overheard line 1 of 5; crossing 2 overheard line 4 of the same exchange. Fix: two to three lines for exchanges meant for crossings, with the 6.8 total and the V6 price updated.

### m6. The pilot's persona run asks for levers it does not have

Section 12.5 (line 760): "It uses the levers (cake, desk phone, breaker)". 6.7 records "no lever" for m02. Write "the mission's levers, if any", and for m02 "the IT door pick with the pair present, a KO of each, and a reload".

### m7. V10's "nothing" for m02 is a static claim

6.10 (line 556). Even after M2 is fixed, V10 cannot tell whether a pool is actually heard. Change it to say V10 passes, and point to the stage 4 live check from M2 as the real test.

## Nits

- n1. 6.4 (line 463): "A crossing takes about two seconds". Measured with the bridge's `enterRoom`, which aligns at each door: 4.5 s from the corridor to Kim's office, 2.5 s from Kim's office to the corridor, 3.25 s from IT to the corridor. Say "two to four seconds".
- n2. 6.2 (b) (line 418) and 6.3: the observation already disagrees with the narration about terminals ("Four dead terminals" against the ink's "Two dead terminals"). It is outside the pilot's scope, but worth one line on the stage 3 review page if lines are being touched anyway.
- n3. Section 2 "Staying put" (line 74) could state the measured result: own-post sips never move or seat the NPC, and they play `drink_gulp` (heard at volume 0.31).

## Answers to the five questions

1. **Would the pilot convince?** Partly. On the first visit (step 10) the pair are seen sitting, rising, walking to the boiler and talking, and the paper exchange plays in full if the player lingers; measured, all five lines were overheard in game 3799. On later crossings they are seen at the boiler, but at most one line is heard, the cooler half never pairs, and the burn exchange is not reached on the talk route (M1 to M4). Gary's sip and print are seen and heard as described.
2. **Canon, locks, keys, tasks, globals, Bernie, Gary, spoken text.** No break found. The pair hold nothing, have no sight and no `lockpick_used_in_view` mapping (`lockpick-catch.js` needs one), so the IT door pick stays unwatched. There is no phone, so Bernie's four phones (`m02_npc_receptionist.ink:282-284`) stand. Gary's print condition reads `cover_burned`, which is set inside the keycard conversation (measured before the close) and by the KO task mapping, which the `gary_ko` term covers. The cited lines (`:80`, `:351`, `:764`, `scenario.json.erb:201`, `:936`, `:2035`) match.
3. **Numbers.** The needs arithmetic is right: first breaks at 2 and 6 minutes, a return about 8 minutes after a break, and coupled partners next due 10 minutes later. Boiler overlap: claim 20 s or more, measured 28.25, 28.75 and 28.75 s. Cooler overlap: claimed, never formed (M2). Mapping cooldowns are on wall time (`npc-manager.js:1222-1224`), and non-`onceOnly` mappings persist nothing (`:1431`). Gary's print: claim 6 s after close, measured 6.02 s and 6.01 s, with `copier_run` at volume 0.22 in IT. Seating: Gary never seated; the pair sat at the corrected posts (m2). Posts: see m1 and m2.
4. **Consistency of stages, validator, voicing and review.** Mostly consistent. The gaps: no beside-cell check anywhere (M2), V10 claimed as proof of hearing (m7), the persona run's levers (m6), and the 6.8 clip count pays for unreachable exchanges (M4, m5).
5. **Standalone.** Yes, except 6.4, whose timing story an implementer would build and then find false. Rewrite 6.4 from the Live proof numbers below.

## Live proof

Setup:
- Keyless server from the worktree on 127.0.0.1:3090 (stopped afterwards).
- Games 3795, 3799, 3802, 3820, 3825 and 3828, created with `tools/playtest/new-game.rb m02_ransomed_trust` and head-start options (`--start-room office_corridor` or `it_department`, `--unlock it_department`).
- Each game's own `scenario_data` copy was patched by a runner script, as new-game.rb's head-start options do, adding the pilot's fields from 6.2 (a), 6.4, 6.5 and 6.12:
  - `officePresets`, `roomTone`, `roomToneTypes`;
  - the boiler, cooler, microwave, copier, page slot and `gary_mug`;
  - the kettle and Boardroom cooler opt-outs;
  - the porter and the domestic, with the plan's needs, cooldowns, entry and coupling mappings, and three exchanges;
  - Gary's mug post, leash, `swivel: false` and print mapping.
- I used this instead of a new Mission row, to avoid writing to the shared database. Throwaway ink for the pair lived in `scenarios/tmp_olm02_proto/ink/`, now moved to `tmp/delete/r12_proof/`, with the flags XML files. Nothing was committed.
- Headless Chromium, frame-throttle recipe applied, fixed steps on.
- Gary's need decay was raised to 10 per minute to get five sips in 10 minutes.
- Scripts and raw JSON: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/r12_proof/`.

| Claim (plan) | Measured |
|---|---|
| Boiler `useSeconds` 30, second arrival overlaps by 20 s or more (6.4) | First `using` 9.25, second 11.0, first done 39.25: overlap 28.25 s (game 3799); 28.75 s twice (game 3802) |
| An exchange plays in the overlap (6.4) | Yes: `night_watch_paper`, 5 lines from 14.75 to 36.25 s, all overheard with the player 70 to 78 px away; `heard_` set, `complete: true` |
| Cooler `useSeconds` 25, paired (6.4, 6.5) | Never paired: beside cell (308, -12) has no path; partner `job_failed timeout` after 20 s (game 3828) |
| Break started from the previous room is running at the crossing (6.4) | Corridor trigger: the pair pair up 0.75 s after the player enters; the first bark is spent at 188 px, unheard; one exchange line heard on the exit tick (game 3802). IT, Kim and Boardroom triggers: the break is over before the player leaves |
| Crossing about 2 s (6.4) | 4.5 s, 2.5 s, 3.25 s (bridge `enterRoom`) |
| Staff-room entry break starts too late (6.4) | Pairing 3.5 s after entry (game 3799), 3.25 s (game 3802) |
| Coupling brings the partner (6.4) | Works from post (boiler, 1.0 s after the leaver); missed when the leaver came from another job or a failed return (games 3802, 3799) |
| Gary never moves; home within HOME_EPS 12 px (6.2 a) | Drift 0 px over 10 min of needs clock, five sips, never seated; home distance 3.4 px with an aimed `useFrom`, 14.7 px with one 0.3 tile off (still 0 drift); `suspend`/`resume` 0 px at 3.4 px |
| Conversation opens at any moment (6.2 a) | Opened mid-sip and ran to the keycard (game 3820) |
| Print 6 s after the close, copier heard (6.2 a) | 6.02 s (game 3820), 6.01 s (game 3825); `copier_run` played in IT at volume 0.22; room tone not ducked by then; `it_copier_page_shown` true |
| Gary's sip shows a sound (6.0 table) | `drink_gulp` at volume 0.31 |

Not proved live: the cabinet catch with Gary on needs (regression step 5 of 6.11), the E1 attack paths, the microwave trip, the cup icon, and a full walkthrough.
