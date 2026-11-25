# CA pilot mechanics plan: design review, round 4 (delta)

Reviewed: `CA_PILOT_MECHANICS_PLAN.md` at d8005ef00 against R3 (`CA_PILOT_MECHANICS_REVIEW_R3_DESIGN.md`), diff from c21ea921f, with six code reads. Paths are relative to the worktree root; engine paths are under `public/break_escape/js/`.

Counts: 0 BLOCKER, 0 MAJOR, 6 MINOR (new). R3: 2 of 2 majors resolved, 9 of 9 minors resolved or partly resolved (N3-m5 and N3-m8 partly).

Verdict: both R3 majors are fixed in the plan and the fixes hold against the code. The field names now match `apply-actions.js`, and `returnPlayerTo` is a sound refactor of `leaveWorld`'s `placeAt`. What is left is timing wording, one test-order gap and three implementation details worth pinning before the build.

---

## Part A. R3 findings

| R3 | Status | Where | Note |
|---|---|---|---|
| N3-M1 `resumeOnDone` leaves the learner in open-plan | Resolved | 2.1 step 6, E3 "The spot", "One placement helper", "The watcher", 3 E3 (f), live (a)(b)(f), 5 risks | Look up records the kiosk spot apart from `origin`; `returnPlayerTo(spot, deps)` is `leaveWorld`'s `placeAt` path (`utils/world-play.js:33-37`, `:80-90`), so both episodes return by one function. A kiosk click first stops the watcher and clears the spot. `worldActive()` reads only `origin`, so it is unaffected. |
| N3-M2 wrong action field names | Resolved | E4 "Field names", 2.6 Nilesh 7, 1.7 Lorna 9-11, 3 E4 | `hint` reads `message` and `title` (`systems/apply-actions.js:292-303`), `remove_item` reads `item` (`:333-351`), `take_off` reads `itemId` (`:436-437`); the plan's records match. Per-action `condition` is already honoured (`:199-201`), so mapping 7's conditional hint works. The validator key table is added with the exact failing examples as tests. |
| N3-m1 take-back toast when never held | Resolved | 2.6 Nilesh 7 condition `ca15_drop_given && !ca15_drop_found`; routes and live (d) | |
| N3-m2 reload loses the return | Resolved in design | E3 "Reload", 3 E3 (f), test scenario | See R4-m5 for the criterion the plan leaves to implementation. |
| N3-m3 closed `red_stick` chat | Resolved | 2.1 step 2, 2.6 ink hub divert, `inkcheck` cases, routes | The divert reads `ca15_drop_offered` and not-given, not-done, so Carry on and a completed find both switch it off. |
| N3-m4 Joanne's line late | Resolved | 2.6 Joanne 2/3, 2.3 | The bark moves to `npc_use_started:ca15_ops_pc`. The emit at `systems/npc-needs.js:3647` sits on the shared use path after the visit branch returns, so a carry use reaches it. The payload is `{ npcId, objectId, need }`, as the plan's condition assumes. `npc_used` (`:3768-3771`) carries `tag` only when `job.carrying`, which is what Joanne 2 reads. The "check" in the plan can be closed. |
| N3-m5 `got_it` dead time | Partly | 1.1 steps 4-5, 1.7 `ca12_t_door_missed`, Delphine 2, live (l) | Timer added, but anchored differently from the prose. R4-m1. |
| N3-m6 `reported` flip line | Resolved | 1.7 `flipDefenderLineByGlobal` 4 before 5 | Order rationale is stated. |
| N3-m7 Camila `walkIn` | Resolved | 1.6, E4-adjacent VID1 note, step 6 | Explicit lobby `from`, tile left as a named implementation check, and the `openFor`-beats-fade agreement is a gate on step 6. |
| N3-m8 engine live proofs after TTS | Partly | 4 steps 1b, 5b, 14 | E1, E3 and E4 are proved early. E2 is not. R4-m2. |
| N3-m9 test gaps | Resolved | 3 | All listed cases are in E3 (f), E4, routes and live. |

Engine size estimates are consistent: E1 165-245, E2 90-120, E4 75-115, E5 15-30, E3 245-325 sum to 590-835, matching the scope line, the section 4 total and the E3/E4 headers (E4 35-55 plus 40-60 validator; E3 220-290 plus 25-35).

---

## Part B. New findings

### MINOR

#### R4-m1. The `got_it` miss timer starts when Delphine leaves the door, but the prose says 10 s after she is back at the desk

Section: 1.1 steps 4 and 5, 1.7 Delphine 2 and `ca12_t_door_missed`, 3 live (l), 5 risk "A missed held door".

Problem: Delphine mapping 2 sets `ca12_delphine_back` in the same action list that issues the `patrolOverride` back to the desk, so `ca12_t_door_missed` (`startOnGlobal: ca12_delphine_back`, 10000 ms) counts from the moment she leaves the door tile, not from her arrival. The walk back takes a few seconds, so the hold ends perhaps 6-8 s after she sits down. Her arrival at the desk deliberately does nothing (the flag is already false). Live (l) will measure "about 10 s after she is back" and fail or be argued away. The learner's real window is also shorter than stated, which matters for a learner who is slow to react.

Evidence: plan 1.7 Delphine 2 (the line setting `ca12_delphine_back`), `ca12_t_door_missed` entry, 1.1 step 4 ("10 s after she is back at the desk"), live (l).

Fix: either reword every mention to "10 s after she leaves the door" and check the number live, or move `ca12_delphine_back` to a third mapping on `npc_arrived:delphine_reception` with a `ca12_delphine_returning` flag set by mapping 2. The first is smaller. Either way make the timer 12-14 s if the intent is that the learner sees her sit down before the beat ends.

#### R4-m2. E2 (the world hold) has no live proof before step 14

Section: 4 steps 1b, 2, 5b, 14.

Problem: N3-m8 moved the E1, E3 and E4 live proofs early so engine faults do not send shells, dressing and voicing back round. E2 (hold, `holdMaxMs`, `_settleWorld` on reload, the open-minigame wait, `ca12_world_done` always written) is still first proved live on ca12 at step 14, after the shell, dressing and TTS. It is the piece every ca12 ending depends on. The `test_side_door_gate` scenario already has a gate and an opener, and E3's test scenario has an episode, so neither needs a voiced shell to host a hold beat.

Evidence: plan 4 (1b after E1, 5b after E3, nothing after step 2); E2 section "An open minigame" and reload rules.

Fix: add "2b. E2 live proof" using `test_side_door_gate` extended with a minimal episode (one call outcome, a hold, a 75 s cap shortened for the test): hold ends on the done global, ends at the cap, survives a reload, waits for an open chat. Or fold the E2 checks into `test_episode_world_beat` at 5b and say so in step 2.

#### R4-m3. `remove_world_item` has no stated way to find the floor stick's room, and the room may not be loaded

Section: E4 `remove_world_item`, 2.6 Nilesh 7, live (b) and (d).

Problem: the action takes `{ item, roomId? }`. The shell cannot name a `roomId` because the learner chooses where to drop. The plan does not say how the action finds the dropped object when `roomId` is absent, or what the dropped object's id is (item-drop persists a `player_drop` object; `systems/item-drop.js:378`). After a reload, the floor stick sits in open-plan room state while only the start room is loaded, so a sprite search finds nothing. The take-back would then leave the stick on the floor, takeable by a learner in the defend half, which is the N-M2 leak in a narrower form (it gives nothing, but the toast and the removal disagree).

Evidence: plan E4 line for `remove_world_item`; `systems/npc-needs.js:6221` takes an explicit room id; `systems/item-drop.js:378` is the only `player_drop` writer found.

Fix: state that without `roomId` the action scans the client's room-state mirror for a `player_drop` object with that item id (across all rooms, loaded or not), removes the sprite if present, and always sends the room-state delete. Pin the dropped object's id scheme in the plan (item id, or an item-id field on the object) and add a unit test: stick dropped in a room that is not loaded, action removes it. Add reload-then-timeout to live (b).

#### R4-m4. The action key table can drift from `apply-actions.js`

Section: E4 validator key table, 4 step 3 size estimate.

Problem: the table is written from `known_actions` (22 names, `scripts/validate_scenario.rb:3130-3134`), but required and optional keys live in the case bodies of `apply-actions.js`. Mapping `actions` make an unknown key an error, so a missing optional key in the table turns a correct new mapping into a build failure, and a new action added later is not covered. The 40-60 line estimate fits a plain data table but not a derivation.

Evidence: `scripts/validate_scenario.rb:3128-3134`; plan E4 "Validator, action keys".

Fix: add a unit test that parses the `case '<name>':` labels in `apply-actions.js` and asserts each is a key in the table (and each `known_actions` entry too), so drift fails a test. Keep the table as data; fill optional keys from the case bodies once.

#### R4-m5. The load-time watcher criterion is still an implementation check, and it is the whole of the N3-m2 fix

Section: E3 "Reload", 3 E3 (f).

Problem: "the beat is picked through Look up and the runner has not yet moved past it" depends on episode state the plan has not located (`[check during implementation]` twice). The rule must tell Look up from Carry on (both store the key) and tell "next stage started" from "not". If it misfires toward starting, a learner who picked Look up, finished the beat and carried on into the defend half would get a second automatic return and reopen at each reload; toward not starting, the N3-m2 case comes back.

Evidence: plan E3 "Reload" and its bracketed check.

Fix: define it in the plan as a pure function of saved state, for example `pickedBy[beat] === "lookup"` and `stage === beat.after` (the stage the beat sits after), with `pickedBy` a small map written at Look up and Carry on (one more scalar in the existing episode state, bounded by the number of beats). Unit-test the table: lookup and stage unchanged starts; lookup and stage advanced does not; carry on does not; nothing picked does not.

#### R4-m6. Mapping 7 and the hub divert read `ca15_drop_given`, which ink writes, from `globalVars`

Section: 2.6 Nilesh 7 hint condition, ink hub divert, E4 test (d)/(e).

Problem: the condition `globalVars.ca15_drop_given && !globalVars.ca15_drop_found` and the divert both depend on ink variables and scenario globals being the same store in both directions (ink writes `ca15_drop_given`, JS mappings write `ca15_drop_offered` and read it in ink). The plan lists the ink globals but does not say they are declared in the scenario `globalVars` or confirm the bridge. If ink's write does not reach `globalVars`, the toast never shows for a learner who had the stick, and the E4 test passes anyway because it sets the global directly.

Evidence: plan 2.6 ink paragraph and Nilesh 7; I did not trace the bridge in this round.

Fix: declare all `ca15_drop_*` ink globals in the scenario `globalVars` and add one `inkcheck` or live step that gives the stick and then reads `globalVars.ca15_drop_given` from the page. Cite the existing mission that already relies on the same bridge in the plan.

---

## Part C. Checked and fine

- **Order of implementation.** E4 (step 3) before E3 (step 5), whose test scenario uses mapping actions; E2 (step 2) before E3, both edit `world-play.js`; E1, E2, E4, E5 before the ca12 shell; the VID1 agreement gates step 6.
- **State that never clears.** The step-away spot is in-memory and cleared on return, on a kiosk click and on reload (a reload spawns in the start room). `ca12_wearing_hivis`, `ca12_gate_open` and `ca12_delphine_at_door` toggle and are reset by `ca12_world_done` or the turn-back mapping; the rest are monotonic.
- **Synced state.** One new boolean per beat in the episode state, all globals scalar, one delta per toggle, one room-state delete and one inventory removal per take-back. Nothing grows.
- **Reload.** Scenario timers resume (R3 part C); the E3 watcher restarts per R4-m5; the ca15 start room holds the kiosk, so a reload needs no move.
- **Reopen versus Fatima.** The return places the learner at the kiosk before the flip, so the defend set piece plays in view (R3 N3-M1's pass condition (f) is testable as written).
- **Mapping 3 bark and the grace.** The bark fires at the use start, the use runs 6 s, then the 4 s grace, so the line is heard in full.
- **Flip ordering.** `ca12_guard_alerted` before `ca12_challenged` is right for `reported`; `ca12_door_missed` cannot coexist with `ca12_entered` because the timer's condition excludes it.

---

## Part D. Fun and the offensive-perspective USP (brief)

- **ca12.** The `got_it` miss now teaches in the flip ("a held door lasts seconds") instead of a stall, which is the attacker's own lesson. Score: strong, once R4-m1's window is checked live.
- **ca15.** Returning the learner to the kiosk makes the find, the flip and Fatima's set piece one continuous story. Joanne's bark at the sit-down is the best placed line in the beat. Score: strong.
