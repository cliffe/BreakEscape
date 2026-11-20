# m07 The Architect's Gambit: scenario design review, pass 5, cycle 2

Reviewer: fresh Opus agent, read-only (2026-10-14). Skill: `scenario-design-review`. Static review. No browser session was started, because a Sonnet browser check runs alongside this one.

Sources: `scenario.json.erb` and the eight `.ink` files at HEAD 0d68c70a (round-1 fixes; the m07 folder is clean in the working tree), the compiled JSON (02:38, newer than every `.ink`), `DESIGN_REVIEW_P5_C1.md`, and the round-1 section of `IMPROVEMENT_LOOP_LOG.md`. Engine files read: `scenario-timer-dispatcher.js` (reload resume) and `interactions.js` `handleObjectInteraction` (the `object_interacted` payload). I did not open the SecGen XML or the four restricted field guides. Scratch output is in the session scratchpad, `m07-design-reviewer-c2/`.

## Verdict

All 18 round-1 findings are fixed as logged. I confirmed each one in the files. The "Where do I stand?" ladder names the right first unfinished step in every state I probed, and it never gives more than the per-stage hints already give. The expiry branch, the staggered aims, the T-20/T-30 reorder, the reload music and the timer comments are all correct. Every condition uses only `&&` and single-level `data.<name>`, and every `globalVars.*` name is declared.

I found four new minor issues and nothing above minor. Two are in the ladder's edge states, one is the Architect's taunt order for a player who ignores his calls, and one is the ladder holding on the commit.

**Counts: 0 blockers, 0 majors, 4 minors.** **Scenario design can close, pending the browser check.** The four minors are cheap ink edits and can go in a short fix round or with the dialogue stage.

## Tools

| Check | Result |
|---|---|
| Routes r1 to r23 (`m07_routes/route.js`) | All 23: `[result] all expectations met`, exit 0 |
| Validator, full (`--no-graph`) | Schema passed. No ❌. Geometry has no overlaps and door alignment is OK. 13 onceOnly-overlap notes, all known and disjoint by condition. The new `object_interacted` pair (Kali box, console) names different objects, so the overlap is a false positive, and so is the matching spacing note. Person-chat and credits notes are unchanged |
| dialoguelint | 0 errors. Totals unchanged: transition 1, not-x-but-y 1, you-after-choice 2, blank-reentry 6 (dialogue stage) |
| reopencheck | m07 HaX: 1800 reopens, 0 problems. The Architect: 476 reopens, 0 problems |
| Condition syntax (script over the erb) | No `\|\|`, no nested `data.a.b`. Every `globalVars.*` is declared (`flag<%= n %>` is ERB) |
| Working tree | Unchanged after every run |

Scratch probes (route-driver files in the scratchpad):
- `pA_architect_ignored`: the player ignores the Architect from the commit until after expiry. Gives N1.
- `pB_ladder_edges`: root in with the door never opened, then a missing flag after the fallback timer. Gives N2 and N3.
- `pC_uncommitted_ladder`: the player never commits and logs in, then reaches the debrief-requested state with the vault unvisited. Gives N4 and N2.

## Severity table (new findings)

| # | Sev. | Finding | Evidence | Fix |
|---|---|---|---|---|
| N1 | minor | **A player who ignores the Architect hears his taunts newest first.** `start` checks T-1, then T-5, then T-10, then T-20, and nothing retires an older taunt once a newer one has played (only T-10 is skipped after T-5). In probe pA, a player who commits, enters the ops floor, logs in at minute 12 and opens his thread at minute 28 hears T-1 ("One minute… He has hung up first every time"), then T-5, then on the next open T-20 with the first-contact opener ("Your handset lights without ringing"). The m4 fix covered T-20 against T-30 only. A struggling player is the one most likely to leave the phone unread. | architect ink 52-63 (`start`), 385 (`dead_air_choices`), 406 (`parked`), 133-139 | Retire stale taunts: gate the T-20 check (in `start`, `parked` and `dead_air_choices`) on `not architect_t5_played`, as T-10 already is. Give `taunt_t5` and `taunt_t1` the same `not heard_t30` first-contact opener as `taunt_t20`, and set `heard_t30`. In `taunt_t1`, set `heard_t5 = true` so T-5 doesn't follow it. Carry the echo line in `t5_close` when T-5 is first contact, so the teacher thread survives. Add a route modelled on pA. |
| N2 | minor | **After the debrief is requested, the ladder sends the player the wrong way.** (a) In the all-flags state, "Next door you go through, he's on the link." is followed by "The plant's south of the server hall, if you want to see how they got in. That part's optional." Walking to the plant goes through a door, which opens the debrief. The plant aim also says the building is the police's once the debrief is called. (b) After the fallback timer sets `debrief_requested` with a flag missing, the ladder says "Submit the rest, then call me." But "Bring me in" is gone, and HaX's own text says the debrief opens as soon as the last flag lands. | phone ink 327-332, 373-375; erb 458, 1238-1241 | Gate the plant line `{not vault_entered and server_hall_reached and not debrief_requested: …}`. Split the `grid_saved` missing-flags row on `debrief_requested`: when it is set, "Grid's held. Put the rest of what you took through the relay and he's on straight after." |
| N3 | minor | **With root in and the control room never entered, nothing mentions the door.** The flag-4 step adds "And you'll need the control room door open" only while flag 4 is missing. Once root is in, the ladder's `else` ("Root's in. Put the abort in at the console in the control room."), the clock answer and the flag-4 text all name the console and say nothing of the door. A player can reach this state: the credits have an ORDER line for logging in before the door, and probe pB reaches it. | phone ink 370-371, 147-148; erb 1002 | In the `else` row add `{not scada_door_reached: The door's north of the server hall. {scada_password_found: You've got the password.\|Their listener gives out the password.}}`. Do the same in the clock answer's `flag4_submitted` rows. The text can stay as it is. |
| N4 | minor | **The ladder holds on the commit and gives nothing else.** `not team_assigned` sits above every progress row, so a player who keeps putting the call off hears only "The team's still waiting on your call. Make it first." This holds even with the fifteen-minute clock running (probe pC). The commit isn't in `concludeRequires`, and the credits have a "Never committed" line. A player frozen by the choice, the one this topic is for, gets no next step. | phone ink 333-334; erb 200, 581-588 | Turn the commit row into a prefix line, `{not team_assigned and not grid_saved: The team's still waiting on your call. Make it first, then:}`, and drop the branch, so the first unfinished progress step still follows. Extend r22. |

## Round-1 findings: confirmation

| # | Round-1 finding | Confirmed at | Status |
|---|---|---|---|
| D1 | No progress-aware "Where do I stand?" | phone ink 305-306 (sticky), `report_progress` 325-376; every test reads a done-state (`badge_obtained`, `server_hall_reached`, `scada_door_reached`, flag globals). r21, r22 | Fixed (edge states N2, N3, N4) |
| D2 | Silent expiry, false clock answer, no display variant | erb 1018-1029 (two HaX texts, disjoint on `flag4_submitted`, 5 s after the 0.5 s bark); phone ink 142-153; display variant erb 1941, between `grid_saved` and `cascade_armed` | Fixed |
| D3 | Win console asks for a flag it can't accept | erb 1009-1014. `data.objectName` matches the object name (erb 1907) and the payload `interactions.js:624-628`, emitted before the lock screen. Flag task titles "…at the relay" (erb 428, 438, 548, 560). Engine half stays as E1 | Fixed mission-side |
| m1 | Five toasts on the ops floor | erb 461, 515 (`unlockCondition.globalVariable: server_hall_reached`); mapping 1044-1050 sets the global and `unlockAim`s both | Fixed |
| m2 | No commit pointer for an uncommitted skipper | erb 828-841 (split on `team_assigned`); aim description 366 | Fixed |
| m3 | Briefing story clock | briefing ink 79-94 (transit at the top of `delegation_intro`); `handoff` 297 keeps the building lines. The other story times still agree (desk summary 02:41, site notes "Console from 03:00") | Fixed |
| m4 | T-20 before first contact | architect ink 133-139, 173-176; ops-floor bark gated `!architect_t20_played` (erb 1446). r23 | Fixed (the general order is N1) |
| m5 | Stale engine comments | erb 12-19, 634-639; matches `scenario-timer-dispatcher.js:5-11, 82-90` | Fixed |
| m6 | Reload after the abort plays noir | erb 105-131 (`game_loaded` → `end` on `grid_saved`; `!grid_saved` on the three noir/cutscene rows) | Fixed |
| m7 | Console description false after opening | erb 1911 | Fixed |
| m8 | Mercer quotes Elena unmet | mercer ink 25, 136; Elena sets `elena_met` (elena ink 71) | Fixed |
| m9 | "Window: thirty minutes" | erb 2120, "Window: forty minutes." | Fixed |
| m10 | Cloner missing from the graph | erb 294-295; `dungeon_graph.md:122` `rfid_cloner -.-> door_server_room` | Fixed |
| m11 | RFID guide didn't mention cloning | phone ink 775 | Fixed |
| m12 | Commit possible after the abort | phone ink 228 | Fixed |
| m13 | "The console up there" | phone ink 153 | Fixed |
| m14 | Gendered credit | erb 254 | Fixed |
| m15 | Six guide choices on the hub | phone ink 301-302, `guide_waiting()` 379-380, `field_guides` 384-398 (sticky "Never mind.") | Fixed |

## The review points asked for

- **The ladder.** First unfinished step, in order: debrief state, commit, checkpoint and badge (four variants), Kali box, flag 1, flag 2, door, flag 3 with the redirect line, root with the expiry line, abort. The per-step text is no more detailed than `vm_hint_1` to `vm_hint_4`, which carry the same content (phone ink 698-733). It names no answer, no code and no password. The optional plant line appears only after the server hall. Edge states: N2, N3, N4.
- **Expiry.** `countdown_expired` can only follow `cascade_armed` (flag 3), so the ladder's expiry line sits correctly in the root step. The clock answer, the display and the credits all branch on it. T-1 after expiry says "Late. I did wonder."
- **Staggered aims.** The ops floor now unlocks only "Get Onto The Control Network". The server hall unlocks the control room and plant aims. Neither aim has a task that can complete earlier. For an uncommitted player, `breach_server_room` reveals the network aim at the door, as before.
- **T-20/T-30.** Correct for both the checkpoint hold and the unopened ops-floor bark (T-20 then carries the opener and the echo, and sets `architect_echo_heard`, which the hub's `topic_teacher` reads). The wider newest-first order is N1.
- **Timers on reload.** The dispatcher restores fired and cancelled timers and resumes started ones from their saved run time (`scenario-timer-dispatcher.js:45-90`). `cascade_zero` keeps its `!countdown_expired` guard. One engine edge, not raised: a trigger that fired after the last sync restarts its timer from the reload.
- **Condition syntax.** Clean (see Tools).

## For the browser check (already owed, unchanged)

- "Where do I stand?" at two or three stages.
- The field-guide sub-menu.
- The console click before flag 4: does the HaX toast show over the flag-station screen?
- One new aim on the ops floor and two in the server hall.
- The clock running out: the HaX text and the display variant.
- The end track after a reload following the abort.
- The hostile-Hollis controls texts and the clone choice (carried over from puzzle chains).

## Items for the user (unchanged, not re-raised)

E1 (flag lock with no `requires`, engine), E2 (field-guide titles, check refused in round 1), S1/U3 (VM claims, which need checking against SecGen by the user).
