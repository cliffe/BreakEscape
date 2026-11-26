# demo_ops_second_step: guided tour, implementation review R1

Scope: SHOWCASE_TOUR_PLAN.md sections 1.3, 2.1, 2.6, 2.7 and 4 (with the R4 plan review), units U3 (`fb99fea54`) and U3b (`ad6481be0`), on branch `ops-showcase-tour` at `b8cf2c394` (main merged). Read-only review; no code changed.

**Verdict: not clean** (0 blockers, 3 majors, 6 minors).

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb ... --no-graph` | 0 errors, 39 warnings (the same list BUILD_REPORT gives: kiosk policy, loose phones, unreadable answers for Lorna and Anjali, four "callback not takeable", Fatima's prop, V8 budget, Darren's open-screen habit) |
| `scripts/compile-ink.sh demo_ops_second_step` | 11 compiled, 0 failed; the compiled JSON is identical to the committed files |
| `dialoguelint` | 0 ERROR; one CHECK `crowded-hub` (Ama, 11 choices), as before |
| `check_mapping_index_drift.rb main` | 0 failures; against main the only `-` mapping line is the last one regaining a trailing comma, so nothing moved or was deleted |
| Rails `demo_ops_second_step_scenario_test.rb` (under the test lock) | 46 runs, 1388 assertions, 0 failures |

## What holds

- Every beat in the plan's 2.6 table is in the guided path: M0 (in `give_lorna_card` plus the `pc_in_use:lorna_pc` bark), M1 to M17 with M13b, then M10. "What's next?" (`ink/ama_owusu.ink:79-172`), the objectives panel (aims 0 to 4, `scenario.json.erb:242-306`) and PLAYTEST's guided table follow the same order.
- The fixes are in: `autoLockSeconds: 50` on `darren_pc` with the 90 s leave threshold kept; the lock bark on `global_variable_changed:darren_pc_screen_locked`, gated on `act_midday` and `not pestered_done` (`:459`); `lever_lunch` refuses with "Not yet. Watch Darren's temper first." (`ama_owusu.ink:222-226`); the day-end gate lists the eight afternoon and late tasks including `desk_call` (`:243`); Niamh is "covering reception today" in her style and ink; the four voice changes are as plan 3.2; `ttsPregenerateChatter` is on.
- Measured waits are in PLAYTEST: temper note 50 s, coffee trips 25 s and 37 s (open), idle lock at 50 s, lunch locked at the leave with no wait.
- No beat is lost for good on the guided path: coffee is repeatable; a missed lunch is re-armed by Darren's `room_entered:office` hunger mapping; the gate holds the afternoon and late beats until done or skipped.
- The ticks read the right events: `reenrol` cannot tick on the M11 grant itself, because `helpdesk_answered` is emitted when the answer arrives (`helpdesk-client.js:131-135`), before Thandiwe's ink resumes and sets `reset_password_done`.
- The leak scan claims are honest. The pretext call is client-only (no server route; `person-chat-pretext.js:293-334`), so the U3b scan over boot, rooms, the phone take and the call-desk grant covers every server answer the route makes; the barks travel in the scanned boot payload, and the tour test also checks each bark against the secrets list.
- Voiced lines: no `{variable}` printed in any ink line, bark or call line; no stage direction; every line is under its cap (the longest call line is 15 words).

## Major

**J1. The board disagrees with the objectives and "What's next?" for the afternoon.**
- `tour_notice` (`scenario.json.erb:712`) says "Ask Thandiwe for a password reset for Darren and a sign-in approval reset for Yusuf." Ama's M12 pointer sends the player to the IT request form on Darren's desktop instead (`ama_owusu.ink:134`), and the board has no line at all for M13b (`desk_call`), which is in the panel (`:291`) and in "What's next?" (`:140-144`).
- Fix: rewrite the afternoon lines of the board to match: the reset in person with Thandiwe; the approval reset for Yusuf on the form on Darren's desktop during a coffee trip; the wrong answers for Lorna; meet Priya and ring the IT line holding Yusuf's phone.

**J2. M12: the "what you just saw" line is untrue on the in-person route, and the desktop route was not driven.**
- The bark on `reenrol_done` (`:453`) says "The form on a desktop goes to the same desk." It fires whichever route ticked the task, and Thandiwe's in-person route still ticks it (`thandiwe_moyo.ink`, `reenrol_verdict`). PLAYTEST offers that route twice as the alternative (`PLAYTEST.md:69`, `:153`), and today's board sends the player there (J1). A player who follows the board hears a line about a form on a desktop that they never used.
- The desktop route is the guided one, and nobody has played it. The form is served only while the player's session on `darren_pc` is open and unlocked (`helpdesk_access.rb:79`, `:172-177`). The player has to claim Darren's open screen, open the form, then type the username, the request and Yusuf's two answers from the kitchen board, all before Darren comes back. His measured coffee trips were 25 s and 37 s, and his return closes the desktop. BUILD_REPORT says "The desktop form was not driven live". The Rails test (`:728`) proves the server side only.
- Fix:
  - Drive the M12 route live on a keyless port, and write the measured margin into PLAYTEST.
  - Make the bark true on both routes. Either word it without the route ("Yusuf's approvals come to your phone now, and his own phone shows nothing. The desk never checked who was asking."), or set a route global in Thandiwe's `reenrol_verdict` and give each route its own bark.
  - If the window proves too tight, give the pointer the fallback: "If he's back too soon, ask Thandiwe."

**J3. The IT line says the call-back succeeded before any account is named.**
- `it_line.ink` `ask_reaction`, result 1: "One moment. We ring the number we hold for that account to check it's them. That came back fine. Fill in the form and it's done."
- Result 1 only means the ask was accepted. That opens the form (`person-chat-pretext.js:313-334`). The call-back is decided later, by the server, for the username typed into the form (`helpdesk_access.rb:216-217`, `held_friendface_phone`).
- So the line claims a check that has not happened yet, and it says "it's done" even when the desk then refuses. PLAYTEST's free play (`:218`) and Run D step 5 (`:162`) invite exactly that refusal, by asking for `dprice` or `leaston`. This is the line that teaches the call-back rule, so its order matters.
- Fix: say the order truly, as `test_ops_helpdesk/ink/it_line.ink:20` does in short. For example: "Fill in the form. We'll ring the number we hold for that account to check it's them." Regenerate VOICED_LINES.

## Minor

**n1. Late beats, M14 before M15.**
- "What's next?" and the panel play M14 first, so the player holds Gwen's phone when they reach the archive store door. PLAYTEST Run E says to play M15 first for exactly this reason (`PLAYTEST.md:172`), which contradicts PLAYTEST's own guided table (`:72-73`).
- Ama's M15 pointer warns "don't approve it on Gwen's phone". But if the player approves anyway, Fatima's prop still ticks `propped` (the server returns the room, `npc_frustration.rb:481`; the client emits `door_propped`, `npc-workarounds.js:388`), and then the bark "Nobody approved anything..." is false.
- Fix: swap the order to M15 then M14 in "What's next?", the late aim's tasks and the board (rule 2.1.2 allows reordering tasks within an aim), and drop the warning sentence. Or keep the order and make PLAYTEST Run E agree with it.

**n2. Stale-bark condition (plan 2.1.1) not applied.** No tour bark carries the "next step not yet done" condition. Every line is a timeless statement of what happened, so nothing goes stale today. Note it for any later bark that points forward (M2's "Read it on his sign-in screen when he's away" is the only forward-pointing one, and it stays true until M5).

**n3. Lines doubled.**
- M1 told to Ama: `tell_note`'s two lines and then the `see_note_done` bark, which says nearly the same thing.
- The lunch leave: "Darren's gone to lunch. His screen will be locked." and "Darren's screen has locked. Now try his PC." come together (BUILD_REPORT names this).
- Both are for the dialogue review (4.3) to fold.

**n4. The IT line's voice and style disagree.** The `it_line` voice is Sulafat with the style "in his 30s" (`scenario.json.erb:1156`). The series uses Sulafat as a woman's voice (`docs/agents/PASS3_VOICE_AUDIT.md:47`, Mrs Hargreaves). Use "her", or pick a male voice that is free in this showcase.

**n5. Routines and routes not measured.**
- Fatima's prop (M15) is still "not yet measured" (`PLAYTEST.md:176`).
- The M12 desktop form and the M13b call were not driven in a browser (U3 and U3b reports).
- Rule 2.1.3 and the 4.1 "Done" list want measured seconds. The validator's estimate of about 40 s plus the walk is likely fine, but it should be recorded.

**n6. The tour test leaves out M13b.** `TOUR_TASKS` in the test (`demo_ops_second_step_scenario_test.rb:1318`) has no `desk_call`, so the bark test does not check that bark's once-only flag, its word cap or that it holds no secret. Add `desk_call`.

## Not checked

- No live browser run: this was a read-only review, and the Haiku guided playthrough (4.2) covers that.
- I did not judge dialogue quality beyond truth and the voicing rules; that belongs to the dialogue review (4.3).
