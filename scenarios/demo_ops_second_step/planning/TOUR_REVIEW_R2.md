# demo_ops_second_step: guided tour, review R2 (implementation and dialogue)

Scope: the round 1 fix `e79f985da` against `TOUR_IMPL_REVIEW_R1.md` and `TOUR_DIALOGUE_REVIEW_R1.md`, plus every line to be voiced, read again with `npc-dialog-review` (2j and the 2l concision check) and the `tts-audio` standing rules. This round is the dialogue sign-off before voicing. Worktree `/data/be-ops-follow`, branch `ops-showcase-tour`. Read-only review: no code changed.

**Implementation verdict: clean** (0 blockers, 0 majors, 2 minors).
**Dialogue verdict: signed off** (0 blockers, 0 majors, 3 minors, none of which changes a line's words except two optional recap rewrites given verbatim below).

## Checks run

| Check | Result |
|---|---|
| `bin/inklecate` on all 11 `.ink` files, into the scratchpad | 11 compiled, 0 errors; every output is identical (parsed JSON) to the committed `.json` |
| `ruby scripts/validate_scenario.rb ... --no-graph` | 0 errors, 38 warnings (the R1 list less one); none about dialogue or the tour |
| `dialoguelint.mjs scenarios/demo_ops_second_step/` | Totals by rule: none (Ama's hub is down to 10 choices, so `crowded-hub` has gone). Person-chat files still measure 0 lines (the `# speaker:npc` form; a lint limit, not a scenario fault), so line lengths below were counted by hand |
| `loopcheck.js <file> start`, all 11 stories | no runtime errors over 200 steps x 6 strategies |
| Rails `demo_ops_second_step_scenario_test.rb` (under the test lock) | 47 runs, 1448 assertions, 0 failures |

## Round 1 findings: closed or not

### Implementation review R1

| Finding | Status | Evidence |
|---|---|---|
| J1 board disagrees with panel and "What's next?" | Closed | `tour_notice` (`scenario.json.erb:712`) now has Thandiwe for Darren's reset, Thandiwe (or the desktop form while his screen is open) for Yusuf, Lorna's wrong answers, and "Meet Priya ... ring the IT line ... while holding Yusuf's phone" (M13b). Morning has M8 second, late has M15 before M14. New test asserts the whats_next order equals the panel order task by task, and the board's afternoon and late lines. |
| J2 M12 bark untrue on the in-person route; desktop route not driven | Closed | Bark (`:453`) names no route: "Yusuf's approvals come to your phone now, and his own phone shows nothing. The desk never checked who was asking." The desktop form was driven live (game 298): it only sends while Darren's session is open, and his trips measured 14 to 18 s, so the guided M12 is now Thandiwe in person (`ama_owusu.ink:75`), with the form named as the other route. Recorded as a deviation from plan 2.6 in BUILD_REPORT; the measurement justifies it. |
| J3 IT line claims the call-back before an account is named | Closed | `it_line.ink`: "Fill in the form, and we'll ring the number we hold for that account to check." The header comment explains why it never reports the outcome. Test asserts "came back fine" is gone. Live: `dprice` then refused. |
| n1 late order M14 before M15 | Closed | Late aim tasks `propped, door_step, safe_step, case_step`; whats_next and board agree; the "don't approve it on Gwen's phone" sentence is gone; PLAYTEST Run E states the same order. |
| n2 stale-bark guard | Closed by reasoning | The one forward-pointing bark (M2, "You'll see it on his sign-in screen at lunch") stays true until M5, and the lunch lever waits for M2. Agreed. |
| n3 doubled lines | Closed | `tell_note` and its hub choice removed; the lunch-leave bark is now "Darren's gone to lunch, and he'll be a while.", so it no longer repeats the lock bark. |
| n4 IT line voice and style disagree | Closed | Voice Charon (male; used by no one else in this scenario), style "in his 30s". |
| n5 routines not measured | Partly open, see i1 | M8 trips, the temper note (50 s, 53 s), the overhear (about 38 s) and the M12 desktop window are now measured. Fatima's prop and the M13b grant with Yusuf's phone held are still not driven live. |
| n6 tour test leaves out M13b | Closed | `desk_call` is in `TOUR_TASKS`, so its once-only flag, word cap and secret scan are checked. |

### Dialogue review R1

| Finding | Status |
|---|---|
| M1 note recap contradicts the bark | Closed: "A note under a keyboard gives the password away, so the second step is all that's left." Agrees with the bark. |
| M2 "I read Anjali's note." offered only when false | Closed: choice and knot removed; header says every task ticks by mapping; test asserts no `#complete_task:` in Ama's ink. |
| M3 IT line order | Closed (as J3). |
| M4 IT line not voiced; voice/style mismatch | Closed: `"voiced": true`, Charon; test asserts `TtsLineExtractor.voiced_phone_call?`; fixer reports ON CALL and `/tts` under `it_line` on the keyless server. |
| M5 M13b pointer and recap claim a change already made | Closed: "Keep Yusuf's phone on you, and ask the line for an approval reset for him." and "The phone line trusted a call-back to Yusuf's phone, and you were the one holding it." Both true whether or not M12 ran. |
| M6 two barks at the lunch leave | Closed (as n3). |
| m1 menu-label choice | Closed: "[Can you move an account's approvals to my phone?]" |
| m2 M2 bark points to the wrong window | Closed. |
| m3 Niamh's reason | Closed: "Guests sign in there. The desk account is only a password, no phone needed." |
| m4 Thandiwe "It is done:" | Closed: "That matches. Done, and the form shows what changed." (one clip, both knots) |
| m5 Priya's split call-back | Closed as proposed. |
| m6 "Facilities pinned ..." | Closed (the line was rewritten with the M14/M15 swap). |
| m7 M12 pointer lists every click | Closed: two lines, 15 and 17 words. |
| m8 M7 bark choppy | Closed. |
| m9 lunch refusal says what to do | Closed, with a second branch for "printer already off". |
| Recaps close to barks (open_screen, pestered, desk_refuses) | Closed: each recap now adds the reason or the habit. |
| short_version "And ..." | Closed. |

## Findings

### Implementation, minor

**i1. Two beats still not measured live (carried from R1 n5).** Fatima's prop (M15) has only the validator's estimate (about 40 s of outage plus the walk), and the M13b grant with Yusuf's phone held has not been driven in a browser (its refusal path and the call screen were). The Rails test proves the server side of both. Fix: have the guided Haiku playthrough record the seconds from "Switch the records index off" to the prop, and the M13b grant and its bark, into PLAYTEST.md. Not a blocker for voicing: neither measurement can change a line.

**i2. Plan deviation to carry upward.** The guided M12 is now Thandiwe in person, not the desktop form (plan 2.6). The measurement (14 to 18 s trips; a form sent after his return is refused) justifies it, and BUILD_REPORT records it. The open-screen-gives-desk-access idea is now only named in the pointer and the board, not played on the guided path. Note it in SHOWCASE_TOUR_PLAN.md when the plan is next touched; no change needed here.

### Dialogue, minor

**d1. "Skip them and call it a day anyway" asks a second time, with the same warning.** `ama_owusu.ink`, `lever_day_refused` diverts the skip to `lever_day_end`, which with `skip_late` set plays "Seen everything you wanted? Staff won't be back once they've gone home." and asks Yes / Not yet again. The refusal line just said "staff won't be back once they've gone home" (P2, strong within one exchange), and the player has already chosen to skip. The passwords showcase fixed the same shape in its round 1 (m3: "the skip goes straight home, with no second warning"). Fix: move the Yes branch's lines into a `day_end_go` knot and send the skip there. No voiced text changes, so no clip is added or orphaned; this does not hold up voicing.

**d2. Two recaps still echo their barks (P2, mild).** The recap is heard on request, later, so this is optional:
- `desk_call`: bark "...and you were holding it.", recap "...and you were the one holding it." Optional rewrite that adds the reason: `A call-back only proves who holds the phone, not who owns it.` (12 words)
- `reenrol`: bark "Yusuf's approvals come to your phone now...", recap "Yusuf's approvals went to your phone, so his second step now answers to you." Optional rewrite: `Once Yusuf's approvals came to you, his second step answered to whoever held your phone.` (15 words). Keep the current line if the shorter one reads better aloud; both are true.
If the fixer takes either, the words above are signed off as written; any other wording needs a look before the batch.

**d3. The call-back is told three times around M13b (P2, mild; keep).** Priya ("once we've rung the number we hold to check it's really them"), the IT line ("we'll ring the number we hold for that account to check") and the bark ("The desk that calls back only trusts the owner's phone"). These are set-up, in-call promise and lesson, each a different point in a minute of play, so I would keep them. Listed so nobody adds a fourth.

## Voicing rules (tts-audio) and concision (2l), all voiced lines

- Read in order: Ama's ink (start, hub, whats_next, levers, day end, recap, short_version), Thandiwe, Priya, Niamh, Darren, Anjali, Yusuf, Lorna, Gwen, Fatima, the IT line, and all 25 bark mappings on Ama plus Lorna's return bark.
- No `{variable}` printed in any voiced line (Thandiwe reads `helpdesk_it_desk_result` only in conditions); no inline stage direction; no `#delivery:` notes; no password, PIN, code or recovery answer in any line.
- Caps: longest face-to-face line 25 words (short_version, "It gives way to a worn-down approver ..."); longest bark 24 words (M7); longest IT-line line 16 words (cap 25 on the phone). All within caps.
- Voices: 11 voice blocks, 11 distinct names; Charon's "in his 30s" matches a male voice. The IT line's style carries the fixed southern-English accent sentence (7 of the 11 styles do; the standing rules do not require it, and no style changed this round except the IT line's voice name).
- 2j: the IT line is a voiced pretext call whose whole story is the call (no text thread, no home knot that reads as texts), so voicing every line is right. It ends `[Hang up] #exit_conversation -> END` without `// lint: call-knot`; that rule is for ring and `call` entries, the sister `test_ops_helpdesk` pretext line has the same shape, and neither the validator nor dialoguelint flags it. No change.
- Mannerisms: Ama warm and practical (full check); Darren flustered and short; Thandiwe dry; Priya brisk; Niamh friendly. No P1, P3, P4, P9 or P13 left in the changed lines. Ama's recap (one line per beat) and short_version (six lines) are long by design as the read-back, as R1 accepted.
- VOICED_LINES.md is still the hand-kept change log; plan 3.3 regenerates the batch list from `TtsLineExtractor` after this sign-off, and the it_line lines must appear in it.

## Priority list

- Must fix before voicing: none.
- Should do: i1 (measure in the Haiku playthrough).
- Worth doing: d1 (no clip change), d2 (optional, wording given), i2 (plan note).
