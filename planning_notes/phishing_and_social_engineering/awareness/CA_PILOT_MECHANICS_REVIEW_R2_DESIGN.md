# CA pilot mechanics plan: design review, round 2

Reviewed: `CA_PILOT_MECHANICS_PLAN.md` (478 lines, as committed at 0ed4a2465), against R1 (`CA_PILOT_MECHANICS_REVIEW_R1_DESIGN.md`), with targeted engine reads. Paths are relative to the worktree root; engine paths are under `public/break_escape/js/`.

Counts: 1 BLOCKER, 4 MAJOR, 9 MINOR (new). R1: 16 of 18 resolved, 1 partly, 1 closed by a reasoned decision.

Verdict: R1's fixes went in properly. The E3 list design, the costume ownership rule, the hold that always ends with its global set, the hi-vis bark split and the stop-point notice rule are all correct against the code. What is left: the new gate is permanent scenario data and bars the learner from their own kiosk room outside the beat; E3 misses the success-screen hold; ca15 has no way back to the kiosk and no clean end on Carry on; and the flip text the plan writes has nothing in the engine to show it.

---

## Part A. R1 findings

| R1 | Status | Where in the plan | Note |
|---|---|---|---|
| B1 E3 on the step-away code | Resolved | 2.5 | Per-beat `readyGlobal`, `pickedKey`, `_steppedAway` set; tests (a)-(c) in section 3; hard pass ca15 (f). New gap in the same area: N-M1. |
| M1 hand-back strips the hi-vis | Resolved | 1.5 "Costume ownership", section 3 E2 test, live (g) | |
| M2 challenge ends the beat early | Resolved | 1.7 Yusuf 1-5, `ca12_gate_open`, route and live (c) | `start` talk no longer ends the beat (mapping 5 gated on `ca12_challenged`). |
| M3 timeout and reload never set the global | Resolved | 1.5 "The hold always ends with the global true", validator rule, live (e) | See N-m5 on timing against an open chat. |
| M4 notice from the stop point | Resolved | 2.1 step 3, 2.2 layout, 6, 9 Q1, needs-suite test | |
| M5 dead time in `reported` and no-vest | Resolved | 1.1 step 4, `ca12_t_novest`, `holdMaxMs` 75000, live (d)(e) | |
| M6 timeout while she holds the stick | Resolved | 2.6 timers `_t_found` on `!found`, `_t_used` backstop, route "found late" | |
| m1 Delphine in the walk line | Resolved | 1.2, `test_side_door_gate` | |
| m2 `walkThroughTarget` double offset | Resolved | 1.5 E1 (`g.cx`/`g.cy` separate) | |
| m3 `doors.js` touch points | Resolved | 1.5 E1 `doors.js` bullet, unit tests | |
| m4 Jun's loop never stops | Resolved | 1.3 Jun, 1.7 Jun, live (h) | |
| m5 unfound stick found during the step-away | Partly | 2.6 "The unfound stick is cleared" | Removal is still a check, the fallback leaves a window, and Carry on bypasses it entirely (N-M2, N-m8). |
| m6 hand-back cuts the pass moment | Resolved | `ca12_t_grace`, 6 | |
| m7 barred after teleport | Resolved | section 3 E1 test | |
| m8 session note give path | Resolved | 2.3 `itemsHeld`, 2.6 | |
| m9 defend twin never mentions a uniform | Closed by decision | 1.9, 6 | The twin's courier call already teaches the hi-vis pretext; reasoned and acceptable. |
| m10 tests missing | Resolved | section 3 | New gaps listed in N-m9. |
| m11 print errand config | Resolved | 2.3 notes, 6 (water cooler) | |

---

## Part B. New findings

### BLOCKER

#### N-B1. The ca12 gate is permanent and bars the learner from the studio, where the kiosk is, outside the beat

Plan section: 1.2, 1.7 ("Lobby door entry ... `gate: { ..., playerMayPassIf: "ca12_wearing_hivis" }`"), 1.7 Lorna's flip-time "Pop the hi-vis back in Jo's bag".

Problem: the gate block is static scenario data, so it is live for the whole episode, not just the 75 s hold. Outside the secured room, a player whose `playerMayPassIf` global is false is barred, and a bare click from outside never opens a gate "regardless of the underlying room's server lock state". Leaving the studio is never blocked. So a learner who walks east into the lobby without the hi-vis on cannot get back to the kiosk:
- after hand-back, during the flip, the defend half or Camila's step-away, once they have taken the hi-vis off (the plan asks them to);
- before the call, if they close the runner and wander out (confirm the kiosk can be closed at brief/OSINT; I did not check);
- in the `got_it`-without-vest and `reported` paths the hold ends by hand-back, so those are fine; the softlock comes from free walking afterwards.
The studio lock is `lockType: key` on `merrin_studio_badge`, which no item in the shell provides, so clone-as-entry cannot rescue them either. The only openers are Jun (stopped after `ca12_world_done`), Delphine (scripted) and Camila (once). A barred learner standing in the lobby near the door also turns Camila back at the step-away; `turnBackFromGate` skips the leg, and a one-shot route has no next cycle, so her set piece stalls.

Evidence: `systems/door-gates.js:39-44` (barred rule), `:58-64` (outside clicks never open), `:65-68` (leaving is free), `:69-72` (clone-as-entry needs the room's credential), `:94-101` (anti-tailgate, turn-back); `scenarios/ca12_visitor_tailgater/scenario.json.erb:1041-1052` (studio key lock, `merrin_studio_badge`, east to lobby), `:1739` (lobby unlocked).

Fix: make the gate bar the player only during the beat. Two workable forms:
- E1 adds an optional `activeIf: "<global>"` to the gate config: when the global is false, the gate opens for anyone like an ordinary unlocked door, or at least never bars the player. The shell sets `ca12_gate_live` true on the outcome (Lorna mapping 1) and false on `ca12_world_done`. About 10 lines plus a unit test. This is the better form, because the lobby is a shared map that other episodes may gate later.
- Data only: `playerMayPassIf: "ca12_may_pass"`, a scalar the shell keeps (true from the start; on `ca12_world_on` set to the current worn value; mirror `ca12_wearing_hivis` changes while the world is on; true again on `ca12_world_done`). More mappings and easier to get wrong.
Then confirm what the door does for the learner when the gate is inert: today it is a pin-tumbler key lock on the start room, which the server counts as unlocked. Prove it live: walk out to the lobby before the call and after the flip without the hi-vis, then walk back in. Add the case to `test_side_door_gate` (gate inert, unworn player passes) and to the ca12 live list. Add Camila's step-away with the learner standing in the lobby to live (h).

### MAJOR

#### N-M1. E3 does not cover `stepAwayOn`'s other callers, so ca15 loses the success-screen hold

Plan section: 2.5 (Legacy form, Per-beat paths), 2.6 ("Replace `stepAway: true` with the two-entry `stepAways` list").

Problem: ca15 stops setting `stepAway: true`. `stepAwayOn(episode)` also drives `stepAwayHeld`, the rule that keeps the mission success screen off the room until the step-away has run, and the post-defend panel condition. `stepAwayHeld` also reads `stepAwayBeatLive`, which matches only a `kit_<ep>_out`/`kit_<ep>_done` pair. The plan normalises the legacy form into the list but never says `stepAwayOn` and `stepAwayHeld` read the list. If they still read `stepAway === true`, ca15 gets no hold: the success screen can cover Fatima's set piece, the failure live proof ca15 (f) is meant to catch. The legacy beat's `doneGlobal: null` also differs from today's `kit_<ep>_done` rule. Separately, today's panel is shown only on the triage reopen (comment at `:412`); the post-`mistake` panel has to appear when the sort completes inside the runner, which is a new path.

Evidence: `minigames/episode-runner/episode-model.js:93-100` (`stepAwayBeatLive`), `:110-119` (`stepAwayHeld`), `minigames/episode-runner/episode-runner-minigame.js:412-418` (panel condition on `stepAwayOn`, `defend` done, stage `debrief`).

Fix: in E3, `stepAwayOn(episode)` is true for either form; `stepAwayHeld` and the post-defend panel read the post-defend beat from the normalised list; the legacy beat's done rule stays `stepAwayBeatLive` (or `doneGlobal: "kit_<ep>_done"` per beat); the `red_stick` beat never holds the success screen. State that the post-`mistake` panel is shown on the stage advance, not on a reopen. Unit tests: ca15's `stepAways` form holds the success screen exactly as a legacy shell does; the existing `stepAwayHeld` tests run unchanged.

#### N-M2. Carry on leaves the ca15 drop beat armed through the defend half and Fatima's set piece

Plan section: 2.5 Reopen ("the waiting panel ... with Carry on"), 2.1 step 5, 2.6 timers and Nilesh/Joanne mappings.

Problem: after Look up, the waiting panel offers Carry on while `ca15_drop_done` is false. Carry on stores `worldBeatPicked` and advances, but nothing sets `ca15_drop_done`, takes the stick back or disarms the mappings. Then:
- the stick is still in the inventory (or on the floor); a drop in `open_plan` during the step-away fires Nilesh mapping 3 (`onceOnly`, not gated on done), ticks `drop_the_stick` and starts the 90 s timer, so Nilesh's timeout bark or Joanne's pickup and use lines land over Fatima's found-stick beat;
- a stick dropped before Carry on keeps its timers running into the flip; "Nobody bit" can play over the flip panel;
- the learner holds an unlabelled "Red-team stick" through the defend triage, next to a lesson about found sticks. That muddles O3.
The same applies if the learner picks the stick back up after dropping it (`takeable: true`): the 90 s timeout fires, removes nothing and leaves the stick in the inventory.

Evidence: plan 2.5 Reopen and 2.6 (no Carry on write; Nilesh mapping 3 has no done gate; Joanne's mappings are gated on `!ca15_drop_done`, which never becomes true on this path).

Fix: E3: Carry on on a beat with a `doneGlobal` writes that global true (one scalar, once). Shell: a Nilesh mapping on `ca15_drop_done` true removes `ca15_red_stick` from the inventory (with a shown line such as Nilesh taking his kit back) and removes the dropped object (the same check as 2.6). Gate Nilesh mappings 3, 4 and 6 on `!globalVars.ca15_drop_done`. Routes and live: Look up, take the stick, Carry on; then drop it in `open_plan` during the step-away, and expect nothing.

#### N-M3. ca15 has no way back to the kiosk after the find or the timeout

Plan section: 2.1 steps 4-6, 2.5 Reopen.

Problem: ca12's hold hands the learner back automatically (E2). ca15's beat does not: after Joanne's use bark and the note, or after "Nobody bit", the learner stands in the open-plan with nothing telling them to return; the 30 s backstop ends the beat with no line at all. The resume depends on the learner choosing to walk back and click the kiosk. That is dead time with no prompt (rubric F2), and it leaves the trailer's payoff shot without an ending.

Evidence: plan 2.1 step 6 ("Reopening the kiosk once `ca15_drop_done` is true resumes at the flip"); 2.6 `ca15_drop_t_used` "no bark"; the call watcher's auto-reopen exists only for the write stage (`episode-runner-minigame.js:1410-1422`).

Fix: E3 adds an optional per-beat `resumeOnDone: true`. A watcher like `watchCall` reopens the runner at the next stage once `doneGlobal` is true and no minigame is open, after a short grace (3 s, so Joanne's bark finishes). Or, data only: on `ca15_drop_done` a Nilesh bark plus a toast that points back to the kiosk. Prefer the watcher; ca12 and ca15 then end the same way. Unit test and live: the runner reopens at the flip after the find, the timeout and the backstop.

#### N-M4. `strings.flipTailgate` has no reader, and the existing flip line describes the wrong path

Plan section: 1.7 Episode block `strings: flipTailgate`, 1.8 shown text, 1.7 check on `flipDefenderLine`.

Problem: the flip's defender line comes from `defenderLine()`, which reads `flipDefenderLineNoSpray`, `ByHost`, `ByChoice` (keyed by template id) and `flipDefenderLine`. Nothing reads `flipTailgate`, so the tailgate's payoff text never shows. The existing `flipDefenderLine` says Delphine buzzed them through and the courier wore a hi-vis, which is wrong for `walked_away` + tailgate, `reported` and no-vest. The plan's check only proposes making it neutral. Also `ca12_tailgated` is set on any worn entry, including `got_it`, where "Nobody had to say yes" is false.

Evidence: `minigames/episode-runner/flip-view.js:99-108`; `scenarios/ca12_visitor_tailgater/scenario.json.erb:632`; plan 1.7 Lorna mapping 4.

Fix: either extend `defenderLine` (about 10 lines, unit test) with `flipDefenderLineByGlobal: [{ global, line }]`, first truthy wins, and pass the globals in; or key a line by outcome, since the call outcome is already in state as `sent`. Give ca12 three lines: tailgated (outcome not `got_it`), desk buzzed, and stopped (challenged or timed out). Set `ca12_tailgated` only when the outcome is not `got_it`; `slip_past_guard` can still tick on both. This is the flip's main payoff, so the O1 and O3 scores depend on it.

### MINOR

#### N-m1. Yusuf's `reported` walk-over: wrong event in places, no condition, no way back

Plan 1.7 Yusuf 4. The arrival event is `npc_arrived:ca12_yusuf_demir`, emitted on every scripted `goToAndStay` arrival, with `owner` and `moveId` in the payload (`systems/npc-behavior.js:3632-3639`); arrival also stops his patrol (`:3622`). Condition the mapping on `ca12_guard_alerted && ca12_world_on && !ca12_world_done`, or a later arrival re-opens the challenge. Add a `patrolOverride` back to his post (and the patrol restart) on `ca12_world_done`, so he is not left by the desk for the defend half and Camila's step-away.

#### N-m2. Delphine's return override can loop

Plan 1.7 Delphine. "A timed second override back to the desk 8 s after arrival" on `npc_arrived:delphine_reception` also fires when she arrives back at the desk, so she re-targets the desk every 8 s for the rest of the episode. Make it `onceOnly`, or condition it on a `ca12_delphine_at_door` scalar set by the first override and cleared by the second. Add any new global to the 1.7 list.

#### N-m3. Nilesh mapping 2's "not yet walked" has no global

Plan 2.6 Nilesh 2 relies on a flag that is not in the globals list. Add `ca15_drop_walked` (monotonic) or make the mapping `onceOnly` on `ca15_drop_given`.

#### N-m4. `ca12_gate_open` mappings run for the whole episode

Plan 1.7 Lorna 6 and 7 are not gated on the beat, so every later gate open and close (Delphine, Camila, Jun's last pass) writes a synced global. The size stays bounded, but the writes are pointless and the value can be left stale. Gate both on `ca12_world_on && !ca12_world_done`.

#### N-m5. Write down how E2's hold ends when a chat or the kiosk is open

Plan 1.5 E2. Today's watcher hands back only when no minigame is open (`ended && !current`, `episode-runner-minigame.js:1410`) and stops itself if the runner is opened (`:1407`). E2 should state both for the hold: (a) a timeout at 75 s with Yusuf's chat open waits for it to close; the global is written at hand-back, and mapping 5 is then a no-op; (b) a learner who reaches the kiosk inside the 2.5 s grace stops the watcher, so the held path must still complete the write stage and write the global (through `_settleWorld`). Unit tests for both.

#### N-m6. Jun runs in `got_it` too

Plan 1.7 Lorna 2 sets `ca12_runner_go` on any outcome other than `reported`, but 1.1 step 4 gives Jun's loop only to `walked_away`. If that is intended (more life on screen), say so in 1.1 and check that Delphine's diagonal tile is not on Jun's route through the doorway; the first-open toast may then fire on Jun rather than Delphine. Otherwise use `=== "walked_away"`.

#### N-m7. Re-dropping after a pickup

Plan 2.6 Nilesh 3 is `onceOnly`. The 90 s timer counts from the first drop, so a learner who picks the stick back up to move it gets less time and no second credit. Acceptable; say so, or restart the clock with a `ca15_drop_moved` mapping. The take-back in N-M2 covers the stick left in the inventory.

#### N-m8. The fallback for clearing the unfound stick leaves a window

Plan 2.6. If a mapping cannot remove a `player_drop`, suspending Joanne on `kit_ca15_out` still lets her pick the stick up and use it silently during the flip and defend (her mappings are gated, the needs job is not). It is harmless but odd on screen. Prefer the removal; if only the fallback is possible, also drop her `noticeRooms` (or the interest) from a mapping on `ca15_drop_done`, if the schema allows it.

#### N-m9. Test gaps after this round

Section 3. Add:
- `test_side_door_gate`: the gate inert outside its live window, and an unworn player walking back in (N-B1);
- `test_episode_world_beat`: Carry on from the waiting panel writes the done global and disarms the beat (N-M2), `resumeOnDone` (N-M3), and the success-screen hold with the `stepAways` form (N-M1);
- `flip-view` unit test for the new line selection (N-M4);
- E2: timeout with a chat open, and a kiosk click inside the grace (N-m5);
- ca12 live: walk out to the lobby after the flip without the hi-vis and back in; Camila's step-away with the learner in the lobby;
- ca15 live: Carry on while holding the stick, then a drop during the step-away gives nothing.

---

## Part C. Checked and fine

- **Server-owned worn global** for `playerMayPassIf`: as planned; no new server code.
- **Hold always ends with its global set**, with the validator rule: correct, and it disarms every mapping gated on `!ca12_world_done`.
- **Pickup and use events**: `npc_picked_up:<itemId>` with `{ npcId, itemId, tag }` (`systems/npc-needs.js:3600`) and `item_dropped:<objectId>` with `roomId` (`systems/item-drop.js:516`) match the mapping patterns.
- **The anti-tailgate turn-back** gives the no-vest `got_it` path exactly the plan's corrected story (Delphine turned back, `door_gate_guard_turned_back` drives Yusuf 3).
- **Player-state sync**: new episode state is one boolean per beat, written once; every global is a scalar; the `player_drop` object is one row, removed on use or timeout. Nothing grows. N-M2's Carry on write is one scalar, once.
- **Mapping order**: everything is appended; Camila's edits are in place; the drift tool runs before each hash.
- **VID1 dependency**: limited to Camila (step 5); the rest ships without it. Its live proof needs N-B1's case (learner in the lobby) added.

---

## Part D. Fun and the offensive-perspective USP (brief)

- **ca12.** F: the bark-then-step-back-then-follow loop is the best moment in either episode. It asks the learner to watch, wait and time a move, and the no-vest and `reported` paths now end within 30 to 75 s with a reason given (F2 fixed). O1/O2: Jo's toasts and the authorisation letter put the learner in the tester's shoes in the tester's own words; "the desk is one layer, the door is another" is the right attacker read. Weak spot: the payoff on the flip (N-M4); without it, a learner who tailgated is told they were buzzed through. Score after the fix: strong.
- **ca15.** F: the stop-point rule makes the drop a small deduction puzzle (where do people pause?), and the corner miss is a fair failure with a teaching line. O2: "She was being kind" frames the weakness as human and procedural, the course's line. Weak spots: the ending (N-M3) and the Carry on leak (N-M2), which can put attacker kit into the defender's half. Score after the fixes: good. The beat is short, and its fun rests on Joanne's kettle timing, which needs live tuning.
- **Twin pairing (O3).** Both pairings read as one story told from two sides (you left a stick, then one is left for you; you wore the hi-vis, then you vet a courier). This holds once N-M2 keeps the attack kit out of the defend half.
