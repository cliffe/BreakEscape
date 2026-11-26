# demo_ops_second_step: tour dialogue review R1

Reviewer: `npc-dialog-review` in full (with the 2l concision check) and the `tts-audio` standing rules, for the guided tour (SHOWCASE_TOUR_PLAN.md 2.6, units U3 and U3b). This round is also the concision check before voicing. Worktree `/data/be-ops-follow`, branch `ops-showcase-tour` at `b8cf2c394`. No code changed.

**Verdict: not signed off.** No blockers, 6 majors and 9 minors. Four of the majors are teaching-truth problems: a recap line that contradicts its own bark, a hub choice that is only offered when it is false, an IT-line reply that promises a check the server has not run yet, and a recap that claims a change the guided order has already made. The other two are about voicing: the IT line is not voiced at all as configured, and two barks say the same thing at the same moment.

## Step 1: compile, validator, lint, runtime

- `./scripts/compile-ink.sh demo_ops_second_step`: 11 files compiled, 0 failed, no "apparent loose end" warnings. Every file gets the `-> END` warning, and each one is an `#exit_conversation` exit (it_line's is on `[Hang up]`), so they are not escalated.
- `validate_scenario.rb`: 0 errors and 39 warnings. None of them is about dialogue: no speaker prefix fails to resolve, there are no `//` or `*` hazards, and `#give_item:text_file` is above its line. The "callback not takeable" warnings for Lorna, Niamh, Darren and Anjali are expected, because only Yusuf's phone can be held. There is one note that matters to the writing. The validator says `yusuf_phone` is "gone for good once taken", so Ama's "You've still got Yusuf's phone" (M13b) is true for anyone who did M7.
- `dialoguelint.mjs`: one finding, the existing `crowded-hub` CHECK on Ama's hub (11 choices). The lint still measures **0 lines** in every person-chat file, because they use `# speaker:npc` with no `Name:` prefix (earlier R1 m1, not fixed). So I counted line lengths by hand. The longest spoken line is 25 words (Ama's M12 second line) and the longest bark is 23 words (reset_password). Every line is under its cap (30 face to face, 25 on the phone).
- `loopcheck.js` on all 11 stories at `start`: no runtime errors and no starved knots. Every hub has a sticky exit with an NPC reply.
- `tts-audio` rules: no voiced line prints a variable (Thandiwe reads `helpdesk_it_desk_result` only in conditions), there are no inline stage directions, there are no `#delivery:` notes, and no line contains a password, PIN, code or recovery answer. No speaker shares a voice name with anyone else in this showcase.
- 2h (KO) does not apply (`disableAttacks`). 2f (influence) does not apply to the staff. it_line's `it_line_influence` belongs to the pretext engine and needs no ink tags.

## Findings

### Major

**M1. The note recap contradicts the note bark and teaches the opposite.** `ama_owusu.ink:282`
The bark (`scenario.json.erb:444`) says "The second step is what stands between that note and her desktop." The recap says "the second step can't help once the password's on show." Anjali's PC is on the `finance` policy (`mfa: code`), so the fob step still holds after the note is read. That is the lesson of the whole showcase, and the recap gets it backwards.
Rewrite: `A note under a keyboard gives the password away, so the second step is all that's left.` (16 words)

**M2. "I read Anjali's note." is only offered when it is false, and it ticks the task.** `ama_owusu.ink:57-58`, `tell_note` `:184-192`
`see_note` now ticks by mapping the moment the note is seen (`pc_signin_shown:anjali_pc` with `hasPostit`, `scenario.json.erb:423`), and `see_note_done` is synced in when a conversation opens. So the choice shows only to a player who has **not** read the note. Picking it ticks `see_note`, fires the M1 bark and plays "Good. A password on a note…" for something that never happened (2i, "choices that answer what wasn't said"). The ink header (`:4`, "Ticks by ink: see_note") is out of date.
Fix: remove the hub choice and the `tell_note` knot, which cuts two voiced lines before they are voiced, and update the header comment. Check `demo_ops_second_step_scenario_test.rb` for a `tell_note` assertion first. If the ink route has to stay as a fallback, gate it on something only reading the note can set, but the mapping already covers it.

**M3. The IT line says the call-back check passed before any account is named.** `it_line.ink:22-24`
`pretext_ask` returning 1 only **opens** the `call_desk` form (`person-chat-pretext.js:313-334`). The call-back check runs on the server when the form is sent (`helpdesk_access.rb:219`), and the username is typed into the form. So "One moment. We ring the number we hold for that account to check it's them." / "That came back fine. Fill in the form and it's done." is said before there is an account to ring. A player who names `dprice` hears "came back fine… it's done" and then gets refused, which is the exact case PLAYTEST.md:218 lists as free play. The line also gives away the lesson that the bark is there to deliver.
Rewrite (one line, 16 words): `Fill in the form, and we'll ring the number we hold for that account to check.`

**M4. The IT line is not voiced as configured, and its voice does not match its style.** `scenario.json.erb:1149-1157`
`TtsLineExtractor.voiced_phone_call?` (`tts_line_extractor.rb:184-191`) voices a phone contact only with `voiced: true` on the contact, a voiced or ringing mapping, or a `call` entry. `it_line` has none of these, so its lines play as silent text in a thread while reading as a call ("you're through to the desk", "One moment", `[Hang up]`, which is a 2j mismatch). VOICED_LINES.md:291-298 and plan 3.3 list them as voiced. Its `voice.name` is Sulafat, a female voice (`m07_architects_gambit/office_life/PLAN.md:49`), but the style says "in **his** 30s".
Fix: add `"voiced": true` to the `it_line` contact (the extractor's comment at `:182` names exactly this case, "a pretext call from a desk phone"), then check in a playtest that the call screen shows and `/tts` goes out under `it_line`. Change the style to "in her 30s", or pick a male voice that nobody else in the showcase uses (the series table in plan 3.2 leaves several free, for example Charon). If it becomes a voiced call, apply 2j's knot shape where the pretext engine allows it (`// lint: call-knot` on `start`). Otherwise drop the voice block and the VOICED_LINES rows and rewrite the three lines as texts.

**M5. M13b's pointer and recap claim a change that the guided order has already made.** `ama_owusu.ink:144`, recap `:330`
In the tour, M12 has already moved Yusuf's approvals to the player's phone, so M13b's grant is idempotent (BUILD_REPORT U3b, "Idempotency"). Ama's "Ask them to move his approvals" asks for something already done. The recap's "The phone line **moved** Yusuf's approvals" is false for every guided player. The pointer's "The desk rings his phone to check, and you hold it." also gives away the bark's lesson before the beat (P2/P6).
Rewrites:
- `:144`: `Keep Yusuf's phone on you, and ask the line for an approval reset for him.` (15 words, true whether or not M12 ran.)
- `:330`: `The phone line trusted a call-back to Yusuf's phone, and you were the one holding it.` (16 words)

**M6. Two barks at the lunch leave say the same thing.** `scenario.json.erb:436` and `:459`
At lunch Darren's screen locks at the leave (PLAYTEST.md:81), so "Darren's gone to lunch. His screen will be locked." and "Darren's screen has locked. Now try his PC." play one after the other, every guided run (P2, strong). The lock bark has to stay because it also covers the idle-lock case. The lunch bark can be changed in place (its index stays, rule 2.1.2).
Rewrite `:436` bark: `Darren's gone to lunch, and he'll be a while.` (9 words)

### Minor

**m1. The IT-line choice is a menu label, not the player's words (2b).** `it_line.ink:16` `[Ask them to move an account's approvals to your phone]`
ca03's pretext desk uses spoken choices ("Can you reset my password now?").
Rewrite: `[Can you move an account's approvals to my phone?]`. `[Hang up]` is a non-verbal action and is fine.

**m2. The M2 bark points to the wrong window.** `scenario.json.erb:445` "Read it on his sign-in screen when he's away."
His coffee trips leave the screen open (M8), so the sign-in screen and its note only show once the screen has locked, which in the tour means at lunch. A player who follows the bark on a coffee trip gets his desktop.
Rewrite: `Frustrated people write things down. You'll see it on his sign-in screen at lunch.` (14 words)

**m3. Niamh gives the wrong reason the kiosk has no second step.** `niamh_doherty.ink:19` "I'm covering reception, so it's only a password for me"
The account is exempt by policy, not because she is covering. The line also repeats her opener (P2).
Rewrite: `Guests sign in there. The desk account is only a password, no phone needed.` (14 words)

**m4. "That matches. It is done: the form shows what changed."** `thandiwe_moyo.ink:58`, `:84` (P13 colon, stiff "It is done")
Rewrite: `That matches. Done, and the form shows what changed.` Both branches give the same text, so it stays one clip.

**m5. Priya's line splits "call … back" awkwardly.** `priya_nair.ink:20`
Rewrite: `Ring it and we'll move an account's approvals, once we've rung the number we hold to check it's really them.` (21 words)

**m6. "Facilities pinned … on the facilities notice."** `ama_owusu.ink:147` (P8)
Rewrite: `Two new door codes are on the facilities notice in the kitchen. The records room also wants Gwen's approval.` (19 words)

**m7. The M12 pointer lists every click.** `ama_owusu.ink:134-136` (45 words, six instructions)
This is against plan 2.1.1 ("what to do, not which button"). Suggested cut:
- `This time use the IT request form on Darren's desktop, while he's out for coffee.` (15 words)
- `Ask for an approval reset for Yusuf. His answers are on the kitchen board.` (14 words)
(The sign-in at Yusuf's PC with your own phone is the bark's payoff: "his own phone shows nothing".)

**m8. The M7 bark is choppy (P9).** `scenario.json.erb:450` "The number on screen had to match the phone. A wrong pick cancels. Holding his phone, you could match it."
Rewrite: `The number on screen had to match his phone, and a wrong pick cancels. With his phone in your hand, you could match it.` (24 words)

**m9. The lunch refusal doesn't say what to do.** `ama_owusu.ink:224` "Not yet. Watch Darren's temper first."
Rewrite: `Not yet. Switch the printer off and let Darren's temper run first.` (12 words)

## Choices that matter (2d), state (2e)

The cast is a demo host plus staff, so this is mostly OK. Each staff hub offers one question that gives a distinct, useful hint (fob, phone at the coffee machine, Lorna ignores requests, Gwen's charger, Fatima's index, Priya's call-back) and an exit. That is the right level for guiding without listing clicks. Ama's levers change world state, which is what they are for. Every `#set_global` (`see_note_done`, `printer_off`, `act_midday`, `records_index_off`, `act_evening`, `reset_password_done`, `reenrol_done`) is declared and read. The one broken promise is M2. Nothing on the critical path is withheld. The day-end refusal offers "Skip them…".

## Teaching truth (checked against the scenario and the engine)

True: M0 (device in use), M3, M4 (`approvesPrompts: never`, `n >= 2`), M5, M6, M8, M9, M11, M12 (the bark's "his own phone shows nothing" holds, because the player holds it), M13, M14 to M17, the M10 burst. Wrong or misleading: M1 recap (M1), `tell_note` (M2), the IT line (M3), the M13b pointer and recap (M5), the M2 bark (m2), Niamh's reason (m3).

## Concision (2l)

Mannerisms: Ama is warm and practical, so she gets the full check. Darren is flustered and his lines are already short. Thandiwe is dry and Priya is brisk, and both are already short. No speaker was skipped.

Counts: P2 ×5 (strong 2: M6 and the M13b pointer in M5; mild 3: recap against bark for open_screen, desk_refuses and pestered), P5 ×2 (mild), P8 ×1 (m6), P9 ×2 (m8, short_version "And the helpdesk…"), P13 ×1 (m4). Strong findings are listed above. No line is too long to voice.

- **Recap against barks (plan 4.3 asks).** No recap line repeats a bark word for word. Three are close: open_screen (bark `:448` and recap `:298` both say "guards the sign-in, not an open screen"), desk_refuses (`:454`/`:326`) and pestered (`:431`/`:310`). The recap is spoken, so each is a second clip of the same point. Consider making the recap add the reason instead, for example open_screen: `Darren's open screen asked for nothing, so lock your screen when you step away.`
- **P5, mild:** `recap` once every beat is done is 19 lines with no choice. The plan keeps it by design as the read-back, and each line is one beat, so it is acceptable.
- **P5/P9, mild:** `short_version`, six lines, with `:366` opening "And". Join it to `:364` or drop the "And": `The helpdesk can undo it for anyone who can answer facts from a badge and a board.`
- **Cross-NPC repeats:** the "wear him down / make it stop" thread (Darren `:19-21`, the M5 bark, the recap and the M10 recap) is a deliberate set-up and payoff. Keep it.

## Priority list

- **Must fix:** none.
- **Should fix (majors):** M1 note recap, M2 `tell_note` false claim, M3 IT-line check order, M4 IT line not voiced and voice/style mismatch, M5 M13b pointer and recap, M6 double lunch bark.
- **Worth considering:** m1 to m9, and the recap lines that sit close to their barks.

After the fixes, run `tagdiff.mjs --old` against this commit's ink (M2 removes a knot, so explain the difference), regenerate VOICED_LINES.md from the extractor (plan 3.3), and confirm it_line's lines appear in the batch list.
