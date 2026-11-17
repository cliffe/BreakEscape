# Phone calls plan: review R5 (final)

Reviewer: fresh adversarial reviewer, round 5. Plan: `docs/achitechture/PHONE_CALLS_PLAN.md`, draft 5 (8ed90df4b). Code checked at the worktree HEAD (8ed90df4b; the engine is unchanged since 5952f39e1). Binding: the user decisions in `docs/agents/PHONE_CALLS_LOG.md` (C2, C6, and the 2026-11-12 decisions on in-person debriefs, ring-out by default, the answer-delay variable and "Call back").

`js/` is `public/break_escape/js/`.

Counts: 0 blockers, 2 majors, 7 minors.

## 1. What checks out

- **`scriptedConversationActive()` is today's body, unchanged.** The sketch in 2.2 matches `_scriptedCallBusy()` line for line (`js/systems/npc-manager.js:740-748`), stale-clearing included. Only `_queueScriptedConversation` (`:683`) and the pump (`:776`) call `_scriptedCallBusy()`, so the busy rule (`callActive() || scriptedConversationActive()`) changes nothing while no ringer call is connected. The m01 walk-through holds: `endMinigame` nulls `currentMinigame` in its `finally` (`js/minigames/framework/minigame-manager.js:275-278`) before the bark layer and drain (`:300-303`). So when `first_ring` arrives, `scriptedConversationActive()` finds the briefing gone, clears the record and returns false. The two checks don't call each other.
- **`_resetAfterRingerCall()` can be built as sketched.** `callHomeKnot` and `PhoneChatConversation` are already imported (`js/minigames/phone-chat/phone-chat-minigame.js:12, 22`). `this.conversation.callKnots` is set for every voiced call (`:518-520`), and `homeKnot` is fixed at registration (`npc-manager.js:272`), so `callHomeKnot` never reads the call knot that `goToKnot` wrote into `npc.currentKnot` (`phone-chat-conversation.js:185-205`). `closeConversation` nulls `this.conversation` at `:1449`, after the point where the plan calls the reset. `cleanup` flushes (`:1635`) before it nulls (`:1650`).
- **The timer order on the story-end branches is right.** Two of the five branches save after `_releaseForcedCall()` returns (`:878-882`, `:1207-1210`), and the other three return at once (`:700-702`, `:818-820`, `:1194-1196`). Because the reset runs inside the `_releaseForcedCall` timer (`:1219-1224`), its save is the last write in every branch. The `_ringerResetDone` latch stops a second write when End is pressed during the timer. `complete()` doesn't save the story (`:1612-1624`; `base-minigame.js:85-110`).
- **Reopen after the reset shows the hub.** The restored story sits at the start of the home knot with no choices. `reopenWithCurrentGlobals` returns `renavigated: false` when there are no choices (`phone-chat-conversation.js:618-620`), the story hasn't ended, so `showCurrentChoices()` continues it (`phone-chat-minigame.js:672-695`).
- **The bring-in hand-off.** `closeConversation` and `#exit_conversation` complete inside the call's minigame, so `minigame_completed` and any `#set_global` fire while `callActive()` is still true. Every debrief opener in m01 and m03–m07 is a plain mapping with no `delayMs` (`scenarios/m01_first_contact/scenario.json.erb:1116-1124`, `m03…:1281-1289`, `m04…:1556-1564`, `m05…:1576-1585`, `m06…:1673-1682`, `m07…:1675-1686`), so each one queues behind the call and the pump opens it afterwards.
- **m01's line-level `#ending_check` works in a call.** With "Keep going", the batch's text and its `#exit_conversation` are dropped (`phone-chat-minigame.js:1151-1157`). The story has ended, so `_releaseForcedCall()` closes the ringer call and the reset puts it back on `support_hub`'s router. m01 has no optional bring-in task (grep), so M2 below doesn't reach it.
- **Protected content is unchanged.** `lab_social_engineering`, m09/m10's legacy voiced calls, m02's and `lab_tesseract_trials`' video calls: none of them gets `ring` or `call`, every end-path edit is gated on `params.ringerCall`, `callLaunch` isn't edited, and `callActive()` is never true there. The lab SE phone inks (`ruth_phone.ink`, `dev_service_desk.ink`) have no `Name:` prefix that the A1 id rule could catch (grep). The only key moves are the planned ones: A1's five delivery lines, m09 `m09_briefing.ink` (59), m10 `hax_post`/`hearing` own lines, and the lab_physical_pentest line.
- **7.6 lines are new.** None of the 14 planned bring-in lines appears in any ink today (grep), and "See you at HQ." / "Car's at … Two minutes." are gone from every row.

## 2. Majors

### V1. The `[On my way. #ending_check]` bracket asks every player, and lists the bring-in task itself (major, m03–m06)

C33 and the m03, m04, m05 and m06 bring-in rows of 7.2 move the ending question onto `[On my way. #ending_check]`, so it is asked before the choice is taken (1.9). Today the question comes from the debrief mapping's `endingCheck` (`scenarios/m03_ghost_in_the_machine/scenario.json.erb:1285`, `m04…:1562`, `m05…:1584`, `m06…:1680`). That mapping fires on the global that `extract_go` sets, and `extract_go` runs `#complete_task:call_in_after_sweep` first (`m03_phone_agent0x99.ink:617`, `m04_phone_agent0x99.ink:463`, `m05_phone_agent_0x99.ink:988`, `m06_phone_agent_0x99.ink:617`).

`call_in_after_sweep` is an **optional** task in all four missions (`m03…scenario.json.erb:481-488`, `m04…:495-500`, `m05…:585-590`, `m06…:600-605`). It is unlocked by the same event that opens the hub's bring-in choice: in m03 the `npc_ko` and `night_confrontation_ready` mappings (`:1099`, `:1216`) and the hub gate `victoria_ko and night_confrontation_ready` (`m03_phone_agent0x99.ink:112`); in m04 the `attack_prevented` mapping (`:1079`) and the gate `attack_prevented` (`m04_phone_agent0x99.ink:142`). `openOptionalObjectives` counts every task with `optional === true` and `status === 'active'` (`js/systems/ending-check.js:55-66`).

When the bracket asks, `call_in_after_sweep` is therefore active and not yet complete, so `endingNeedsAnswer()` is always true (`ending-check.js:170-175`). Every player gets "Before the mission ends … 1 optional objective is still open: Finish your sweep, then call HaX to bring you in", even a player who has done everything, and that objective is the thing they are doing. Today the task is already complete when the mapping asks, so a player with nothing left open is never asked. This goes beyond what C33 intends ("the question then comes before the last line").

There is a second change that C33 doesn't record. Today "Keep going" on the mapping holds the ending: the objectives panel gets an "End the mission" button, and the debrief opens by itself once nothing optional is left (`ending-check.js:221-226, 264-289`; `npc-manager.js:1027-1034`). The bracket form holds nothing. The player has to ring HaX again. That's acceptable inside a call and matches m01, but it should be a decision on record.

Fix (ink only, no engine change): in each of the four missions, move `#complete_task:call_in_after_sweep` out of `extract_go` and onto the line that answers `[Bring me in.]` (the 7.6 reply line, which runs before `extract_confirm`'s choice shows). The task then reads "done" when the bracket asks, so a player with nothing else open is never asked. Keep `#set_global` / `~ … = true` in `extract_go`. Then:

- update the four 7.2 bring-in rows and M4, M5, M7 and M10;
- add one line to C33: "Keep going" holds no ending; the player rings HaX again;
- in each bring-in proof (section 8 step 4), add a run with no optional objective open, where `[On my way.]` must not ask, and a "Keep going, End, ring again, choose `[On my way.]`" run.

The alternative is a small engine change: an `#ending_check:<taskId>` argument that leaves the named task out of the list. It needs tests in `ending-check`, and the ink move is simpler.

### V2. Ring targets reach `callStartKnots` only in A5, so A2b's incoming calls are silent and never reset (major, slice order)

3.1 says `ring` "implies `voiced: true`; writing both is fine". But the client's call knots come from `callStartKnots(npc)`. That function counts a mapping only when `m.voiced === true`, and a timed conversation only when `timed.voiced === true` (`js/minigames/phone-chat/phone-chat-speaker.js:198-209`). It reads the scenario's raw `npc.eventMappings`, not the config the mapping builder makes, so normalising `ring` there (`normaliseRing`, A2a) doesn't help. The plan adds `ring` targets to `callStartKnots` in 4.2 ("Client parity"), and the slice that builds 4.2's client and server changes is A5 ("`callStartKnots` (client) and `call_start_knots` (server) add every entry's knot (4.2)"; parity test in A5's accept list).

So from A2b to A4, a `ring` mapping written as the schema allows (no `voiced`) opens a call whose `this.conversation.callKnots` (`phone-chat-minigame.js:518-520`) lacks its own knot. Then:

- `_speakCallLine` skips every line (`:947`), so the call is silent;
- `_resetAfterRingerCall()` returns early on End mid-choice, because the current knot isn't in `callKnots`, and the A3 `caller_thread` proof shows the call's choices as texts;
- A2b's own acceptance can't pass: the `caller_basic` `/tts` requests and the "End / story-end / reset cases … for incoming calls".

The missions aren't hurt, because M1 passes `voiced: true` explicitly and every other `ring` migration needs A5. But A2b can't be done on its own as written, and an implementer would either add `voiced: true` everywhere in `test_phone_calls` (hiding the gap) or pull A5 work forward unreviewed.

Fix: move the `ring` half of 4.2 into A2b. That means client `callStartKnots` and server `call_start_knots` add the `targetKnot` of each `phone-chat` mapping with `ring` and the `timedConversation.targetKnot` with `ring`, and `voiced_phone_call?` is true for a `ring` contact. A5 keeps the `call` entries. Add the `ring` cases of `phone-call-knots-parity.test.mjs` to A2b's accept list, and have `test_phone_calls` write `ring` without `voiced` on at least `caller_basic`, so the proof exercises the implication. No scenario uses `ring` before M1, so the key-identity rule holds.

## 3. Minors

- **v3. A hit in the two seconds after a call's story ends turns a finished call into a miss.** For a ringer call, the story-end branches only schedule the close (`_releaseForcedCall`, `phone-chat-minigame.js:1219-1224`, `FORCED_CALL_END_CLOSE_MS` 2000). `_endedByCall` is set only inside that timer (2.5). A knockout in the gap closes the call through `complete(false)` (`player-damage-interrupt.js:156-172`), so `cleanup` sees no `_endedByCall` and takes row 32: a non-forced call leaves a callback for a conversation that is over, and a forced call (row 26) re-rings with `resume` on an ended story. A forced call also skips the reset in `cleanup`, so `npc.currentKnot` stays on the call knot (`phone-chat-conversation.js:194-199`), and a hand-opened thread's `restartAfterEnd` (`:276-286`) would replay the call as texts. Fix: set a `_callFinished` flag when `_releaseForcedCall` schedules the close of a ringer call. In `cleanup`, run `_resetAfterRingerCall()` when `ringerCall && (!forced || _callFinished)`, and have the end hook treat `_callFinished` as row 25. Add a case to `phone-outgoing-call.test.mjs`.
- **v4. `callActive()` has to go false synchronously, or held toasts stick.** `endMinigame` drains held barks at `minigame-manager.js:301-303`, and `drainDeferredBarks` returns early if `_shouldDefer()` is still true (`npc-barks.js:240-243`). 2.9 adds `callActive()` to `_shouldDefer`, while 2.2 has every hook re-check "through `queueMicrotask`". If the adapter clears its `connected` state in the microtask, the drain runs first, finds `callActive()` true, and the texts held during the call wait for the next minigame or popup close. The `caller_debrief` variant hides this, because the debrief's own close drains them. Fix: in 2.2, define `callActive()` from the live framework, true only while the call's minigame is `currentMinigame` and not `_ending` (or inside the open delay before it), not from the microtask state. Add a `phone-ring-layer.test.mjs` case: a text held during a call with nothing after it shows as soon as the call ends.
- **v5. The continue path has no `#exit_conversation` check.** Only the after-choice path checks for it (`phone-chat-minigame.js:1174-1186`). `_presentOutput` (`:820-883`) goes straight to choices or the story-end branch. So a call knot that ends with `#exit_conversation` before any choice still closes, but through the story-end branch, after `FORCED_CALL_END_CLOSE_MS`. Two such knots are m03's `{ revelation_heard: … }` guard (7.2) and any choice-free `first_ring`. 2.5 "Ending" ("`#exit_conversation` already saves and completes") and A5 ("the matching branch of the continue path") read as if both paths had the check. Fix: say so in 2.5, and cover both paths in `phone-outgoing-call.test.mjs`. For `#place_call`, A5 adds the tag check to `_presentOutput` itself, before its choices/story-end branch.
- **v6. A2a still says the adapter resets the story.** A2a (plan line 744) says "(row 25) ask the adapter to reset the story and reopen". 2.5, rows 25 and 32, A2b and C31 all say the adapter never touches the story. Fix: drop "reset the story and".
- **v7. `extract_call` naming isn't the same in every row.** The m04 row says `extract_call` is "renamed from `extract_offer`" and the m03 row says "`extract_offer` and its choices moved into call knots". The m05 and m06 rows use `extract_call` with neither note, while 7.6's header says "`extract_offer` or `closing_debrief`". Fix: state the same rename in all four rows (the `call` entry, the `#place_call:extract_call` tag and the knot name must agree; the validator errors otherwise, 4.3).
- **v8. Two bring-in openings share a shape.** In 7.6, m03 opens "Last look. Once you're out …" and m04 "Last look round the plant …". These aren't the same clip, but 3.6's "vary the shape" asks for more. Fix: change one opening (for example m04 "Past the gate it's forensics' site, not ours. Anything you want, take it now.").
- **v9. An existing queue test is missing from the must-pass list.** `test/js/scripted-conversation-queue.test.mjs` exercises `_scriptedCallQueue` and the drop and defer branches that the busy rule changes (`:207`, `:287-314`). It isn't in 5.1's list of existing tests that must still pass. Fix: add it to that list and to A2b's accept list.

## 4. R4 closures

Each was checked in the plan text, not only in `PHONE_CALLS_PLAN_R4_OUTCOMES.md`.

| R4 | Closed in the plan text? | Where, and note |
|---|---|---|
| W1 stale `_scriptedCall` holds the first ring | yes | 1.2 new bullet; 2.2 "The scripted-scene check" with the sketch and the m01 walk-through; `ringBlocked()`/`openBlocked()` lists; 2.9 busy rule; 5.1 `phone-ringer` (real `NPCManager` methods) and `phone-call-busy`; 5.3 `caller_basic` after a `timedConversation` briefing; A2b; C30. Checked against `npc-manager.js:740-748` and `minigame-manager.js:275-278` |
| W2 reset placed where no story is loaded | yes | 1.5a new bullets; 2.5 "Ending" (four call sites) and "Story position after a call" (sketch); rows 25 and 32; A2b; A3 accept; C31. Timer order checked (section 1). Edge case in the 2 s gap: v3 |
| W3 bring-in lines shared across missions | yes | 3.6 widened to the opening, the last line and every bring-in line; 7.2 bring-in rows name each line by file:line and are marked "rewrite"; 7.6 new; section 8 steps 2–3 (cross-mission key check); 7.4 recount. Grep confirms the 7.6 lines are new. Shape nit: v8 |
| w4 toast click during a call hangs up | yes | 2.9 "Text toasts during a call"; 5.1 `phone-ring-layer`; 5.3 `caller_debrief` variant; A2b; C32. Timing nit: v4 |
| w5 auto-challenges dropped silently | yes | 1.2 bullet; 2.9 "Auto-challenges during a call", with the corrected `_in_view` list; 5.1 `phone-call-busy`; 5.3 guard; A7 README; C32 |
| w6 m04 last line plays after "Keep going" | yes, but the fix causes V1 | the bracket form in the m03–m06 rows, 1.9, section 8 step 4, M4, C33. The bracket asks before `call_in_after_sweep` is complete, so it always asks (V1) |
| w7 m04 answer-delay line | yes | 7.2 m04 dial row (three fixed openings); 3.6 uses the same line and notes the 11–19 s window; 2.11's example is now `caller_basic`'s |
| w8 A2b acceptance needs later slices | yes | `caller_patient`'s declined run moved to A6; `caller_basic` has the `ring_again` lever. V2 is a different gap of the same kind |
| w9 VAR writer ignores the channel | yes | 2.11 "How they reach the ink" (three conditions, preview case); 5.1 `phone-call-vars` channel cases; A2b accept |

## 5. Slices

The order still holds (A0 → A1 → A2a → A2b → A2c → A3 → A4 → A5 → A6 → A7, A8 after A2b, and each M slice after the engine slices it names). The state table's slice column, the 5.3 rows and each slice's accept list agree, apart from the two places below. Every slice except A2b can be built and accepted from the text alone, and its proofs follow 5.4's real-path routes (a real door, a real console, a real reload; the bridge only sets preconditions).

- **A2b** needs V2: without the `ring` half of `callStartKnots`, its incoming calls are silent and its reset cases fail. With V2, A2b stands alone.
- **M4, M5, M7, M10** (the m03–m06 bring-ins) need V1 before their ink step, and one more proof run each: nothing optional open, so `[On my way.]` asks nothing.
- **A2a** has the stale wording of v6. A reviewer would catch it, but it invites an adapter "reset" hook the design doesn't have.

Contradiction sweep: the state table (2.3), the slice text (section 6), the schema (3.1–3.4, 4.1) and the Part B tables (7.2, 7.3, 7.6) agree on keys, rows and lines, apart from v6 and v7. The 7.3 totals (36 texts; 24 ink lines) match their rows. The 7.5 debrief table matches 7.2 (six placed bring-ins, m01 and m03–m07).

## 6. Verdict

**Revise.** No blockers. Two majors, each a short edit to the plan:

- V1 moves one `#complete_task` tag in four 7.2 rows, adds a sentence to C33 and adds a proof run;
- V2 moves the `ring` half of 4.2 from A5 to A2b.

Everything else in draft 5 holds against the code: `scriptedConversationActive()`, the synchronous reset and its timer order, the busy rule, the call VARs, the protected calls (lab SE, m09/m10, m02, `lab_tesseract_trials`) and the audio-key rule. Once V1 and V2 are in the text, the orchestrator can check those two edits directly without a sixth full round, and implementation can start with the minors below folded in.

## 7. Minors to fold in during implementation

- **v3** (A2b): a `_callFinished` flag set when a ringer call's story ends. `cleanup` resets when `!forced || _callFinished`, and the end hook treats `_callFinished` as row 25.
- **v4** (A2b): `callActive()` is read live from the framework, so the drain at `minigame-manager.js:301-303` releases texts held during the call; add a test.
- **v5** (A2b, A5): the continue path has no `#exit_conversation` check; say so in 2.5, test both paths, and put A5's `#place_call` check into `_presentOutput` itself.
- **v6** (A2a): drop "reset the story and" from the row 25 sentence.
- **v7** (M4, M5, M7, M10): one `extract_call` rename note in all four rows.
- **v8** (M4 or M7 ink step): vary one of the two "Last look" openings.
- **v9** (A2b): add `scripted-conversation-queue.test.mjs` to the must-pass list.
