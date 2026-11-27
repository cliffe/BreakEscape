# demo_ops_second_step: implementation review of the S8b and S8c appends, round 1

Scope: commits `7ab1aece8` (S-8b, helpdesk, M11 to M13) and `a69f0891a` (S-8c, second step on locks, M14 to M17), against SHOWCASE_PLAN.md 7.5, 7.6 and 8.4. Read: the scenario diff, the ink diff, BUILD_REPORT (both units), PLAYTEST Runs D and E, the new test cases. No browser run (no servers).

**Verdict: not clean.** The server side is sound and well tested; four small player-facing fixes are needed before Haiku Runs D and E (one major, three minor). None needs a plan change.

## Gates re-run by this review

| Gate | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_second_step/scenario.json.erb` | 0 errors, 37 warnings (matches BUILD_REPORT's count). Graph regenerated, no diff. |
| `scripts/compile-ink.sh demo_ops_second_step` | 9 compiled, 0 failed |
| `dialoguelint.mjs` | 0 ERROR (one advisory `crowded-hub`, as reported) |
| `bin/rails test test/controllers/break_escape/demo_ops_second_step_scenario_test.rb` (under the tests lock) | see the last section |

## What is right

- **Fields as the plan says.** `helpdesks.it_desk` matches 7.5 field for field. `creds.recovery` on exactly the four MFA-admitted accounts, `resetPassword` on Darren only, Niamh none. The form `darren_form` is in `darren_pc`'s contents (reachable from M8). The three helpdesk events joined `mfa_log.events`. Both doors are PIN plus a push step owned by Gwen; the safe is PIN plus a code step owned by Anjali; the case is a key lock plus a push step owned by Darren, takeable and droppable; the drawers are `"locked": false`. `prop_door` has both `door` and `prop`, the wedge is hidden on the declared `setGlobal`, and the global is declared.
- **Helpdesk rules used as the docs say.** The result global is only read for Thandiwe's next line (docs A23 "Three ways", 1); nothing gates on it. `desk_refuses` ticks from a mapping on `helpdesk_answered:it_desk` with `result === 'blocked'`. M13 uses `leaston`, never `dprice` or `ydemir` (the stop counts by typed username). Anjali is never re-enrolled (her fob stays live for M16), and a test pins that.
- **Lock rules used as the docs say.** Ticks are on client events, never on the browser-writable `setGlobal`: `door_propped:archive_store`, and `mfa_approved:<owner>` filtered by `targetType`/`targetId`. The probe in BUILD_REPORT traces the detail shape to `lock-step.js` and `mfa-client.js`. The `case_step` and `pestered` mappings on `mfa_approved:darren_price` cannot both pass (lock form has no `pcId`); the M17 test asserts the PC row count stays 0. P7 (a held step raises no frustration) was probed and asserted.
- **Two doors, not one.** M14 and M15 are on different doors, so neither empties the other (R2 M5). The M15 test proves the prop opens only the archive store and the records room still asks for both checks.
- **The test proves each server-side beat.** M11 (grant, stale old note, new password meets the step), M11 one-of-two refused with no name, M12 (own phone, old phone cannot approve), M12 Anjali untouched, M13 (stop, right answer then blocked, five minutes lift it), the form served only with Darren's session open, M14 (PIN gives a gate not a room; Gwen never approves; the held phone does), M15 (three cases), M16 (wrong code counted, fob code passes, nothing listed before the pass, fob live after S8b), M17 (count carries over two drops and pick-ups, third request approved, the pass alone opens nothing, the key opens it; no key refused). Rows in the log are asserted by `where.kind` door and object, so the teacher's view gets them.
- **The leak scan is honest.** All three scan cases assert `[]` over every finding of every rule; no filter at all, so nothing beyond 8.4 step 5 is used. The S8c exception did not arise and BUILD_REPORT says so, and says the docs line on the limit is still there. The rule 6 grep is recorded for the PINs, the recovery answers and the reset password.
- **Existing beats unchanged.** New Ama mappings are appended at the end (drift 0); one existing assertion changed only because the cast list grew. Ama's "What's next?" puts every append beat before "Nearly done. Tell me when to call it a day."
- **Office-life openings.** Darren's badge is a left-behind item (shown on every leave); Gwen's phone is left behind on a charger in the Office (loaded from M1, R3 m8); Gwen is reached by the coffee lever and not the lunch lever; Fatima's outage is her own resource with a wall switch and an Ama lever, not the printer (R1 M8).
- **Plan changes, each with a reason.** The case moved to Reception (item 1), the archive store became the second north door (item 2), the resource id became `index_service` (item 3). Each is argued in BUILD_REPORT and none loses a beat. Item 1 was chosen over filtering a scanner finding, which is the honest way round; the scanner gap it found (a lock in an ungated non-start room is always flagged, `lock_step_leak_rules.rb:233-252`) needs a ticket for the `tools/playtest/lib` owner.

## Findings

### F1 (major): the in-game "Things to try" board tells a player to call it a day before the appended beats

The board text (`tour_notice`, office) runs Morning, Midday, **Evening ("Ask Ama to call it a day ...")**, then Afternoon and Late. The objectives panel has the same order: `evening` is order 2, the new aims are orders 3 and 4. A teacher who follows the board in one sitting presses "Call it a day" before M11 to M17, and PLAYTEST says what that costs: "A tester who presses 'Call it a day.' first loses M17 (Darren goes home) and M16 (Anjali goes home with her fob)." The board should not lead a teacher straight into that. Runs D and E dodge it only because they start fresh and never press the lever.

Fix (scenario text only): move the "Afternoon:" and "Late:" blocks above "Evening:" on the board, and end the Evening line with "last: staff go home". Optionally renumber the aims to `afternoon_helpdesk` 2, `late_locks` 3, `evening` 4. The plan only says "new aim at the end", so either fix meets it. The board fix touches no test. Renumbering the aims does touch one: the S8c shape case asserts `late_locks` is the last aim in the array (test line 896), so either change only the `order` fields or update that assertion.

### F2 (minor): three new proximity warnings are in the 37 but have no reason in BUILD_REPORT

8.4 step 1 asks for a reason for every warning. BUILD_REPORT gives reasons for the others but not these three new S8c ones:
- `Darren's ID badge` (2.9, 3.5) and `Darren's desk drawer` (3.6, 3.4): 23 px apart. One click can open the other.
- The coffee machine's `Wall socket` (8.66, 6.06) and `Side table` (9.0, 5.5): 21 px apart. A player going for Gwen's phone (M14) can switch the office coffee off by accident. That changes everyone's coffee trips, Gwen's too, which is the opening M14 needs.
- `Side table` and `Gwen's phone`: 16 px apart. This one is intended (the phone sits on the table) and only needs its reason written down.

Fix: move `darren_drawer` about a tile (for example x 3.9, y 4.0, clear of Darren at 2, 4.2), move the side table and phone at least a tile from the coffee socket (for example y 4.3 and 3.9), and list the side-table/phone pair with its reason.

### F3 (minor): two of Ama's lines and one of Thandiwe's are not quite true

- Ama's hint for M14: "Facilities pinned two new door codes on the **kitchen board**." Her M11/M12 hints use "the kitchen board" for the *Staff board*. There are two boards in the kitchen, so the same words name two objects. Say "on the facilities notice in the kitchen".
- Ama's hint for M15: "Try that door first and close its pane with the X, **or the prop has nothing to skip**." Closing the pane makes no difference unless the player holds Gwen's phone and approves. Say "Try that door first, and don't approve it on Gwen's phone, or the prop has nothing to skip."
- Thandiwe's `reset_verdict` says "The new password is on your form." and ticks `reset_password` on any grant. The form lets the player choose "A sign-in approval reset" after "I need a password reset", and then the line is false and the wrong task ticks. The plan accepts a loose ink tick (the tasks gate nothing), but the line should stay true: "That matches. It's done: the form shows what changed." The same applies to `reenrol_verdict`'s "Their approvals come to your phone now." The ticks can stay as they are.

### F4 (minor): PLAYTEST is stale in two places

- Line 48: "The objectives panel has three aims, Morning, Midday and Evening." It now has five.
- Run D, step 3 signs in at Yusuf's PC "with the password you overheard (M3)", and step 2 tries Darren's old note (M2). Run D is "a fresh game", so it must first switch the printer off and wait for M2 and M3 (Run A's steps). Say so in Run D's preamble, or a blind Haiku run stalls at M12.

## Advisories (no change asked for)

- **Re-enrolling Darren breaks M5 and M17.** Both of Darren's answers are readable (badge and board), so the desk will also grant a sign-in approval reset for `dprice`. After that his approvals go to the player's own phone, and a lock never approves from an own-phone reset, so the case cannot pass. `resets` is per desk, so this cannot be blocked in the scenario. Ama's hint names Yusuf. Add one PLAYTEST line: "never ask an approval reset for `dprice`".
- **Positions are unrendered** (BUILD_REPORT item 4). In particular, check Fatima at (4.2, 9.2) near the Office's south door, and the wedge at (9.0, 2.2) against the right-hand north door, in Run E.
- **Run E timings are unmeasured** (item 5). Fatima's outage-to-prop time and Gwen's coffee trip need numbers in PLAYTEST after the Haiku run.
- **The log shows the prop only by absence:** a challenge and a request at `archive_store` with no approval row. The plan asks no more, and Thandiwe's log text does not mention it. A teacher may need Ama's recap line to read it.

## Scenario test

`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test test/controllers/break_escape/demo_ops_second_step_scenario_test.rb`: 36 runs, 706 assertions, 0 failures, 0 errors, 0 skips (matches BUILD_REPORT). `bin/ops-golden-compare` was not re-run by this review.

## To close

Fix F1 to F4 (scenario text, two positions, ink wording, PLAYTEST lines), re-run the validator (expect 34 warnings, or 35 with the side-table/phone pair kept and given its reason), ink compile and the scenario test, then play Haiku Runs D and E.
