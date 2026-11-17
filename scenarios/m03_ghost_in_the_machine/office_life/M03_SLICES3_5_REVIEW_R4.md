# m03 office life slices 3 to 5: review round 4 (delta)

Read in the detached worktree p-ol-m03-s3check at c35a10260. Static only: no server, no suites, no edits. Range 04dcf72ee..8304d2c55 for scenarios/m03_ghost_in_the_machine.

## Scope check

- `git diff 8304d2c55 c35a10260 -- scenarios/m03_ghost_in_the_machine` is empty. The merge of main touches nothing in m03.
- The delta is 8 changed lines in `scenario.json.erb` plus the R3 review and handover notes. Nothing else in the mission moved: no ink, no items, no locks, no keys.

## Severity table

| # | Severity | Finding |
|---|---|---|
| 1 | minor | Removing the two patrolOverride mappings shifts the handler index of the mappings after them on both staff (`scenario.json.erb` around :855 for Zainab, around :895 for Yusuf). The onceOnly dedup key is npc:pattern:handlerIndex (`npc-manager.js:1264`). Only Yusuf's "Zainab, ring someone. Now." bark (:895, onceOnly) is affected, moving up one index. I did not check whether `triggeredEvents` is saved with the game. If it is, a game saved before this commit could replay or skip that bark once. Unreleased mission, so low stakes; the old comment at :1361 ("Appended last so no saved onceOnly handler index moves") shows this was a known concern |
| 2 | nit | The shipped notes still describe the removed mappings: `office_life/R1_FIX_HANDOVER.md:9` lists them as in place. It is history, not a defect; the R3 fix log already records the removal |
| 3 | nit | p2c's M1/M2 prove "music is threat, then not threat" (`cutscene` after the turn). The scripted check cannot tell the cutscene track from a threat track that has been replaced by something else. That is the intended behaviour here, so no action |

No blockers, no majors.

## Major 1: send-home through the needs system (closed)

Diff: both `npc_ko:ffion_rees` patrolOverride mappings are gone (Zainab's and Yusuf's). Checked for reliance:

- Globals. Neither removed mapping set a global. `wh_staff_upset` is set by the separate mapping at :1368 on the same event (and by the attack and KO mappings at :1363 to :1366), so the machines still switch off. `zainab_attacked`, `yusuf_attacked`, `wh_staff_attacked` are set at :1363/:1364, untouched. `wh_staff_witnessed` is set at the two :1370-1374 mappings, untouched.
- Credits and the witnessed gate. Unchanged (R3 finding 3 accepted: the cooler case counts as witnessed, seen live in game 6642).
- Yusuf's "Zainab, ring someone" bark: still on `npc_ko:ffion_rees` with its `!zainab_ko && !yusuf_ko` condition, unchanged apart from the index shift (finding 1).
- No other file in the mission references the removed mappings except old handover notes and `PUZZLE_CHAINS_PLAN.md:520`, which discusses patrolOverride generally.

Engine behaviour once `wh_staff_upset` is true, `npc-needs.js`:

- Both machines carry `offWhen: "wh_staff_upset"` (`scenario.json.erb:649` laptop-side coffee station `reception_coffee`, `:1574` `hallway_cooler`).
- A staffer walking to a machine or queued at it: `_advanceJob` (`npc-needs.js:3436-3441`) sees `offWhen` hold and calls `_turnBack(s, 'off')`, which ends in `_goHome` (`:2095`). Home is the post, which is the seat, so they sit via the normal needs return.
- A staffer already using it: the same block applies only to `goto_target` and `queued`, so one in the `using` phase finishes and `_completeJob` returns them home. This matches the comment at :3435 ("One already using it finishes").
- No new break starts: every `needs.set` mapping that could trigger a trip is gated on `!globalVars.wh_staff_upset` (:853, :854, :893, :894), and the machines are off. `wh_staff_upset` is never cleared anywhere in the scenario, so the off state is permanent for the day.
- The only reason the old mappings suspended needs (no fight, no wander) no longer applies: with both machines off, the remaining needs-driven destinations are the post and room-local sources, and `needsRooms` keeps them in reception and the hallway. Live runs polled to 84 s show no wander.
- Hostile, KO'd and hidden staff are skipped by the needs system (`npc-needs.js:1023`, `:4575`, `:4617`), so a previously attacked staffer is still left to the hostile behaviour, as the old `!zainab_attacked` / `!yusuf_attacked` conditions did. Behaviour preserved without the conditions.

Screenshots (viewed):

- reception-case-a-6632.png: both seated at their posts, Zainab centred on the sofa, Yusuf in the club chair. Correct.
- reception-case-b-6641.png: mid-break start; Yusuf in the chair, Zainab on the sofa's other cushion (24 px east per the fix log, a valid seat of the same sofa), seated and upright, not standing in furniture. Correct.
- reception-case-c-6642.png: mid-break at the cooler; Zainab seated on the sofa, Yusuf seated in the chair but dark and clipped at the top. The fix log already says this shot is poor (lighting after the hallway round trip); the logged numbers (0 px from origin, polled to 84 s) carry the proof. Acceptable, though a brighter capture would be nicer.

Verdict on Major 1: closed. The R3 option 2 (scenario only) is what shipped, and it removes the tile-short problem at its source.

## Nit 4: "Reception had company" timing (closed)

`scenario.json.erb:1371` and `:1374`: both exclusive "company" mappings now use `delay: 6000`. "The receptionist's down" stays at 2500 (:1046). The p2c-6653 log shows the order: "The receptionist's down", then "Reception had company", then "Leave the staff alone". No wording changed.

## Minor 2: p2c live proof (closed, evidence is real)

`r3fix/p2c.mjs` and `p2c-6653.log`:

- Ffion KO via the debug shortcut (stated in the log), badge taken (inventory check true), player moved next to Zainab, facing set toward her, real key `f`. Log: "punch try 0 ... seated: true", and `wh_staff_attacked` true on the first try, so the punch landed through the real combat path (`npc_attacked`), not a debug call on Zainab.
- H1 PASS: exactly one "Leave the staff alone" message, `delivered: true`. H3 PASS: after the full route to the night turn the HaX list holds that text once, in the right order among the others.
- M1 PASS: music `threat` while Zainab is hostile. M2 PASS: after the turn Zainab is hostile, not KO, hidden (`vis` false, `hiddenMap` true), music `cutscene`, phase `act2_infiltration`.
- The R3 cause of the earlier failure (conference room never loaded, locked door, no badge) is fixed in the script: badge taken first, door opened via interact.
- Caveat: Victoria's KO and Ffion's KO use `debugKO`, which the log labels as a shortcut that converts to hostile without playing combat. Fine for these checks, which are about HaX text and music, not combat.

## Minor 3: accepted and recorded

The fix log records it as accepted by the orchestrator, seen live in game 6642 (witnessed true). Agreed. Leave it with the user to overrule.

## Other checks

- No new spoken lines. The only text lines touched are the two "Reception had company" delays; wording is identical to before and to `office_life/DIALOGUE_SAMPLE.md` per the R3 check.
- No `player_state` growth: two staff handlers removed, no new globals, no new handlers, no new item or visibility keys.
- Lock and key unchanged: the diff touches no lock, key, item or server-read global.
- Not covered by this delta: C2 and C3 (reload checks) on the final tip remain on the R3 handover's to-do list. The R3 fix log says they were not seen. That is a pending live check, not a finding.

## Verdict

Ready to merge on the scenario delta: no blockers, no majors. The one minor is the handler-index shift (finding 1); it matters only if saved games hold onceOnly state across this build, which I did not verify. Before the merge the handover's own pending items still stand: the C2/C3 reload rerun, the static checks on the merged tip, and the two suites run separately.

## Outcomes (orchestrator)

| Finding | Outcome |
|---|---|
| Minor 1, handler index shift | Withdrawn: Zainab and Yusuf are new on this branch, so no saved game holds onceOnly keys for their mappings. |
| Nit 2, R1 handover line | Fixed: the line now says the mappings were removed in R3. |
| Nit 3, music check | Accepted: intended behaviour. |
