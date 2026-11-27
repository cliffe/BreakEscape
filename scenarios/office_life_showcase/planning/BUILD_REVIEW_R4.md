# office_life_showcase: build review R4 (delta)

Reviewed at `05c4fc1fe` (branch `plan/ol-showcase`), the diff `e235b2404..05c4fc1fe`: the R2 live check (`d5a5dca56`) and the R3 fixes (`05c4fc1fe`). Sources: `BUILD_REVIEW_R3.md`, the "R2 fixes: live check" and "R3 fixes" sections of `BUILD_REPORT.md`, the diff, `scenario.json.erb` (objectives and mappings), the compiled `ama_owusu.json`, `interactions.js` (game display body), the board screenshot `screens/r3fix-board.png`, and the two probes. Read-only; no servers started.

Checks run: `validate_scenario.rb --no-graph` gives 0 errors, 17 warnings (the known baseline). `tools/playtest/showcase-lines-check.mjs` gives PASS (every plan line matches the data word for word, caps hold). The compiled `ama_owusu.json` carries the new A31 text.

Severity: B blocker, M major, m minor.

## Verdicts on R3 findings

| R3 | Verdict | Notes |
|---|---|---|
| m1 (A31) | Fixed | `ama_owusu.ink:120`, `ama_owusu.json` (same text), PLAN 7a row A31 (70 characters, 12 words) and the R2 note at `PLAN.md:231`. "Seen everything you wanted?" is answered by "Yes, call it a day." and "Not yet." with no clash. See check 5. |
| m2 (Evening aim) | Fixed | `scenario.json.erb:82`. No longer says anything is closed. See check 3. |
| m3 (board lines) | Fixed | `scenario.json.erb:232`. "one at a time" and "at the socket" are back. One small loss: m1 below. |
| m4 (doc leftovers) | Fixed | `PLAN.md:136` row 3.3 now names `npc_used:*` with `need === 'caffeine'`; the ink header comment says first talk to `hub.choices`, later talks to `hub`. The comment is not in the compiled output, so nothing else changed. |

## Check 2: the tour_notice board

Text now (`scenario.json.erb:232`), as seen in `screens/r3fix-board.png`: nine lines, longest 47 characters, no scrollbar, nothing cut off (live metrics 379 of 379 body, 467 of 467 dialog).

- Coverage. Coffee queue: "Watch the coffee run: one at a time." (`see_queue`, `hear_queue_chat`). Socket: "Switch the coffee off at the socket." (`see_coffee_off`; the lever is `office_coffee_socket`, "Wall socket"). Mugs and cooler: "Note the mugs; hang about by the cooler." (`hear_cooler_exchange`; the mugs are an Ama hint with no task). Midday: lunch after the kitchen, open screen then owner (`use_open_screen`, `see_caught`), cake (`see_cake_eaten`). Evening: call it a day then see who stays (`see_who_stays`), kitchen lights follow you (no task, Ama A15). Every morning task has a board line, and each line names a real requirement. `hear_queue_chat` has no line of its own but it ticks while the viewer watches the queue, as before.
- The "while they queue" timing is gone. It is not needed for the tick (`npc_turned_back:*` with reason `off` fires for walkers too, `scenario.json.erb:253`) and A6 still says it. Fine.
- Empty observations. `"observations": ""` is handled: `gameDisplayParts` in `interactions.js:818` builds the body as `observations ? '<em>..</em>' : ''` and adds the blank-line separator only when both exist, so the body starts at "Morning:" with no stray blank line or empty `<em>`. The screenshot confirms it. The object is not takeable and `addToNotes` is false, so no empty notes entry appears.
- Spoken text: none (UI text only).

## Check 3: the Evening aim

"Home time for nearly all of them, and they don't come back, so finish the earlier tasks first. Each task ticks when you have seen that behaviour happen." In the evening Chidi, Jun, Graham and Agnieszka vanish and do not return, Zainab stays, the office dims. That is exactly "nearly all, and they don't come back". The advice no longer claims anything closes. It reads true. No finding.

## Check 4: Zainab's `see_who_stays`

Task title "See who stays late", Ama's evening hint "Everyone's gone home but one. See where she goes.", aim line "Each task ticks when you have seen that behaviour happen."

The task ticks as Zainab leaves her post for the machine (`npc_left_post:zainab_hussain` with `act_evening`), before she uses any coffee. Judged against what the player is told:

- The title promises seeing who stays late. The tick arrives when the viewer sees her get up and head off to the coffee, which is the first visible sign she is still there and acting. She is the only one left, and she is working late. True.
- Ama's hint says "See where she goes". The task ticks as she goes. True, and arguably a better fit than ticking on the cup, because the viewer has seen the choice being made.
- The aim sentence says "when you have seen that behaviour happen". The behaviour seen at the tick is her leaving the desk, with the destination a few seconds behind. Not misleading.
- Cases where it reads slightly early: none that confuse. If the machine is switched off during the walk, the tick still lands and her fallback to the kitchen follows, so the viewer sees the lever in action after the box is ticked, which is fine as a bonus beat.

Grade: reads true, no finding. The "decide whether that is wanted" note in the R2 live check can be closed as accepted. This also means the `npc_used:*` coffee mapping (`:265`) only matters if Zainab has already left her post before the turn; it is cheap insurance and harmless.

## Check 5: A31 and its choices

"They won't be back once they've gone home. Seen everything you wanted?" then "Yes, call it a day." / "Not yet." "Yes" confirms the question and the choice text names the action; "Not yet." answers "seen everything" naturally and the sticky choice loops to the hub. The stake is in the first sentence. Good aloud: 12 words, stresses fall on "gone home" and "wanted". The unvoiced "Call it a day." hub choice sits above it, so the viewer has just said the phrase. No finding.

## Findings

No blockers or majors.

### m1. The board lost the "before the kitchen" order for the mugs

`scenario.json.erb:232`, line "- Note the mugs; hang about by the cooler."

The merge saved a line but dropped "before the kitchen", which the earlier board and Ama's A8 both carried. The mugs are on the floor outside the kitchen; a viewer who walks in first and reads the board afterwards has no cue that order mattered. The `;` also reads as two tasks of equal weight.

Fix (UI text, 38 characters, within the 47-character longest line): "- Note the mugs, then go to the cooler." Replace the string `- Note the mugs; hang about by the cooler.` with `- Note the mugs, then go to the cooler.` The modal height is unchanged (one line).

### m2. The R2 probe still asserts the old A31 text, so a rerun fails

`tools/playtest/showcase-r2fix-proof.mjs:164-165`.

Line 164 matches `Any tasks still unticked first\?` and line 165 stores that string as `confirmText`. Against the current build the regex finds nothing, `confirmText` is null, and check m2 (A31 confirm, "Not yet." hub, no blank bubble) fails. This is a wrong fail, not a false pass, but it will mislead the next run and the saved evidence no longer matches the shipped line.

Fix: change both to the new text:
`/They won't be back once they've gone home\. Seen everything you wanted\?/` and `'They won\'t be back once they\'ve gone home. Seen everything you wanted?'`.

### m3. Probe check b1 reports PASS for a path it does not exercise

`tools/playtest/showcase-r2fix-proof.mjs:253`; `BUILD_REPORT.md` R2 live check row 1.

The check is titled as proving the switch-off-during-the-walk case and the kitchen fallback, and the verdict ANDs task completed, fell back, socket off and kitchen use logged. The task completes on the `npc_left_post` that fires when she leaves her post (the probe's own comment at `:233` says so), so the PASS holds whichever way the fallback behaves, and it says nothing about the `npc_used:*` mapping. `A.tickedBy` records the real trigger but is not part of the verdict. The report row says PASS under "see_who_stays ticks" without that caveat (the findings list beneath it does say it).

Fix: no new run needed. In the report row 1, "Result" column, change `PASS` to `PASS (the tick comes from npc_left_post on the walk, not from the kitchen use)`; and in the probe, either require `A.tickedBy` to be recorded in the result or rename the check title at `:191` to `'evening: coffee off while Zainab walks to it; kitchen fallback; see_who_stays ticked (by the walk)'`.

## Probes: other correctness points

- `showcase-r3fix-board.mjs`: PASS requires no body or dialog overflow, the dialog bottom inside the viewport, and both "Evening:" and "Walk into the kitchen" in the body text. That would catch the R2 failure (cut-off Evening lines). It does not assert the empty-observations case (no `<em>`, no leading blank), which I verified by reading the code and the screenshot; adding a check is optional. No false-pass risk.
- Route glob: neither probe uses `'**/tts**'`. Both rely on `showcase-s4-lib.mjs:17`, `page.route(u => /\/tts$/.test(u.pathname), ...)` that aborts only POST. Correct form.
- No edits to game rows; both probes use fresh games.

## The changed spoken line

| Line | Text | Verdict |
|---|---|---|
| A31 | They won't be back once they've gone home. Seen everything you wanted? | Fine to voice as written. Not yet voiced; it needs the user's yes first. |

No other spoken lines changed in this delta (the board, aim text and tasks are UI text).

## Counts and verdict

B 0, M 0, m 3.

All four R3 minors are fixed and introduce no problem. The board rewrite carries every morning task and each line matches its objective; the empty observation leaves clean text. The Evening aim agrees with the evening. `see_who_stays` ticking on the walk reads true to the player. A31 and its choices agree. Validator 0 errors with the 17 known warnings; the lines check passes. Text-only fixes for m1 to m3, none touching the engine.
