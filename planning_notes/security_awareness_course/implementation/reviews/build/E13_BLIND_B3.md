# E13 The AI assistant: blind playtest B3

Third blind round. Folder `awareness_e13_ai_assistant` (full) and `awareness_e13_ai_assistant_defend`. Keyless server :3001, headless (load average about 8, so timings are from a busy machine). Games 110 (persona 1, full), 112 and 115 (persona 2, full; 115 is a replay of the same rushed route to read the debrief text), 116 (defend-only, persona 1). Session logs and screenshots are in the scratchpad `aw2/blind-e13-b3/`. Blind rules kept: no scenario, planning or bridge files opened. I read visible on-screen text through the harness `mg getState` and, twice, a plain `innerText` read of an open overlay; no hidden mechanics were inspected. All clicks went through the harness `mg clickControl` on visible controls.

## What came back after the reload (persona 1)

Reloaded after answering four of the six messages (report, trust, verify, trust). Result:
- The "Continue?" card appeared. Bootstrap handled it and its trace read `title screen: Enter then click on "Continue?" -> closed`. That wording does not say whether Enter alone worked in that run (on a fresh game the same trace said just `Enter ... -> closed`).
- Whole recovery took about 7 s (03:35:14 to 03:35:21), not 20 s.
- Everything was kept. Kiosk reopened at "Defend", Open the inbox went straight to the list (no Start needed), header read "4 of 6 sorted", "Phish stopped for the team: 2", each answered row still showed its verdict (Reported, Trusted, Verified, Trusted) and reopening the first message showed its full feedback and "Score for this message: 100 of 100". I carried on with the last two and the round score was 100%. No progress lost. The earlier assistant-window stage was not redone (Defend showed 1-3 done).
- Keyboard test, done separately on game 116 (defend-only) after a reload: waited 12 s for the card ("Continue? Click, or press Space or Enter"), then sent synthetic Enter and Space keydown events from the page. The card closed and the world was up with no click. So the keyboard path works on a settled card. Caveat: the harness's own `pressKey` refuses while the title card is the active minigame (`minigame-active`), so I used dispatched events, not hardware keys. The Resume overlay also showed on that reload (not reported as a finding).

## Persona 1, "do your best" (full), timeline

Estimated at a real reading pace: about 14 minutes (harness wall time was about 6 minutes).

| When | What I thought the goal was |
| --- | --- |
| Gwen's opening | Write a supplier brief with a line hidden for the assistant, then use the assistant "for real" and handle what comes. Go to the kiosk. Clear. |
| Kiosk brief | Same again, nothing new, plus "only the second part is scored". Good to know. |
| Write | Open mail client, read Gwen's mail, compose. Picked "Brief with a hidden line". Meter said 0 red flags, "reads clean so far", which fits a hidden line the reader cannot see. Send was final, and I was told so. |
| Your message | Saw my brief through the assistant's eyes. The assistant turned my hidden line into "Mossgate needs the contact list sent to a new address". Clear and memorable. |
| Assistant window | Three tasks: summarise emails, themes in a complaints log (strike out what does not belong), client report (check source or send). Struck out the child's allergy and the password. Checked the source and found the 99.4% figure was invented. Closed the window. |
| Defend (inbox) | Six items. Hidden-text toggle, Trust/Report/Delete/Verify, tick what you noticed. Reload here. Finished at 100%. |
| Debrief | Round recap, "where the fakes came from", habit, "On Monday" box, how to report. Finish, "Episode finished" panel, bar Close closed it. A game end screen ("AI assistant: finished") then appeared with its own Close and Return to missions; I took that as the intended ending. |

### "Didn't know what to do" moments

None longer than a few seconds. Two small ones:
- Compose screen: the third drop-down ("Pretext: Choose how to word this...") is the real decision and is easy to read as a label. About 5 s. The lack of a visible Send block until it is chosen (Send with it empty just says "Choose how to word your message") sorted it out in persona 2.
- Assistant window: after the themes summary and the report check there is no obvious "I am finished" step; the page says "then close this window". Fine, but I closed it without choosing "Send without checking" and nothing complained. 3 s.

### Real decisions

| Decision | Arguable or given away? | Did the consequence show? |
| --- | --- | --- |
| Plain vs hidden-line brief | Given away by the task ("a line hidden in it") and by the option wording. Not a real decision. | Yes, both branches explain themselves. |
| What to strike out of the complaints log | Allergy and password are obvious by content ("her son Leo's nut allergy", "password Autumn2026!"). Easy. | Yes, summary shows what went through. |
| Check source vs send | Check source is the labelled safe route; wording ("Send without checking") gives it away. | Yes. The source says 96.1% and a fridge fault, no staffing cause. |
| Hidden-instruction invoice (Report) | Hidden text reveals it, and the earlier red-team step practically names it. Good teaching, not hard. | Yes, IT Security reply. |
| Real October invoice with a benign hidden note (Trust) | Genuinely arguable, and a good call: hidden text alone is not the tell. | Yes, feedback says so. |
| Unknown-number voicemail from "Tom" (Verify) | Clear: "not in your contacts", money request. | Yes. |
| Tom Reilly voicemail from a contact (Trust) | Easy. | Yes. |
| Board call with CEO and finance (Ring back) | Given away by "no time, fewer people who know the better" in the script. | Yes. |
| Adaeze internal call (Comply) | Easy: "no rush". | Yes. |

### What I learned (own words)

An AI assistant reads every line of an email the same, including white text I cannot see, so a line written for it can steer it into suggesting something I would never do. Keep passwords and children's details out of anything I paste in, and check figures against the source. A voice or a face does not prove who is calling; ring back on a number I already hold. Hidden text on its own is not a reason to panic.

### Best five lines
1. "You wrote that line to be read by a machine, and here it is, doing exactly what you meant."
2. "Both faces are perfect and both are fake; a video call is not proof of who is on it."
3. "Hidden text on its own is not the tell." (October invoice feedback)
4. "Reporting or checking when you're unsure is always fine and never marked down."
5. "These messages are built to fool careful people, so a miss here says more about the attack than about you." (persona 2 debrief)

### Worst five lines
1. The email body in "Now it is aimed at you" containing the option label itself: "Plain brief (just the invoice, nothing hidden)" / "Brief with a hidden line for the assistant (white text a person reading it never sees)". Reads as a placeholder left in.
2. "Fewer flags means harder to spot." shown beside a hidden-line brief that scores 0 flags; it does not tell the player anything useful there.
3. "A password slipped through, the worst one to leave in..." followed straight away by a near-identical red line "A password went into the assistant, and nothing it does needs one; now it's somewhere it shouldn't be." Says the same thing twice.
4. "The tell most often missed: Knowing a face or voice can't prove who's asking (caught 0 of 2)." Reads like a field label.
5. "Brief with a hidden line..." as the very first option makes the red-team half feel like a form with an obvious answer.

### Scores (1-5)
Fun 3, pacing 4, clarity of goals 5, openness of decisions 2, teaching 4.

## Persona 2, "struggling player" (full)

Estimated about 7 minutes. Sent the brief with no pretext chosen first (blocked with "Choose how to word your message", fair), then took the first option, the plain brief. Assistant window: summarised email, pasted the whole complaints log with nothing struck out, ignored "Report the password", sent the client report without checking. Inbox: Trust, Trust, Trust, Trust, Comply, Comply with no ticks (a first Confirm asks you to tick or choose "Nothing looks wrong", the second Confirm moves on).

- Round score 5%. Three phish got through (hidden-instruction invoice, cloned voicemail, fake board call) and all three real messages were handled right.
- Result card is honest and not blaming: "Worth practising: here's where to look first", names the three that let an attacker in, adds that each costs 15 points. The 5% is harsh but is explained.
- Per-message feedback each says what would have happened ("£200 goes to a stranger; the real Tom never called") without blaming. The debrief ends "These messages are built to fool careful people, so a miss here says more about the attack than about you."
- Does the debrief mention what happened in the assistant window? Yes. A section "In the assistant window: what to check next time" comes after the recap and covers the two things I did badly: "A password slipped through, the worst one to leave in" (complaints log) and "Two sentences would have gone out wrong: an invented 99.4% with a source that doesn't exist, and a line blaming agency staff that the figures don't support" (client report). The red-team brief result (plain brief, so nothing for the assistant to act on) is explained at the time but not repeated in the debrief. The child's health detail I also left in is not mentioned in either the window or the debrief; only the password is. It appears only in the general "On Monday" box as "personal details".
- Finished on the debrief: Finish gave the "Episode finished" panel, the bar's Close closed it.

### Persona 2 scores
Fun 3, pacing 4, clarity of goals 4, openness of decisions 2, teaching 4.

## Defend-only run (persona 1)

About 7 minutes estimated. Gwen: "Brightwell's switched on its assistant, and the kiosk has the inbox beside it". Kiosk brief explains the assistant in two sentences, and the inbox intro says what hidden text is and tells you to use Show hidden text. That was enough: the hidden-text task made sense without the red-team half. Reloaded after three answers (see above): kept. Finished 100%. Mismatches for someone who never saw the full episode:
- Feedback on the October invoice says "The assistant's summary of it matches the email." This player never saw any summary.
- "On Monday" box says "Keep passwords and personal details out of anything you paste into it, and check the figures and claims in what it writes" with no preceding pasting task; it reads as a new rule rather than a recap.
- The Mission Brief and tasks are consistent ("Handle the messages"), and the end screen "Messages done" fits.
Scores: fun 3, pacing 4, clarity 5, openness 2, teaching 3.

## Findings

| # | Severity | Finding | Tag |
| --- | --- | --- | --- |
| 1 | minor | In "Now it is aimed at you", the sent brief's email body contains the option label as text ("Plain brief (just the invoice, nothing hidden)" or the hidden-line label with the white-text explanation) instead of invoice prose. Looks like a placeholder. Screenshot p2-01-aimed-at-you.png | content |
| 2 | minor | Defend-only: October-invoice feedback refers to "the assistant's summary of it", and the "On Monday" box refers to pasting into the assistant, but this player never saw either. | content |
| 3 | minor | Complaints log: leaving the child's nut allergy in gets no feedback (only the password does), in the window or the debrief. | content |
| 4 | minor | On the CEO call, ticking "Someone senior is invoked to skip a check" is neither credited nor marked wrong; "Caught" lists only two of the three ticks. A player cannot tell if the tick was right. | content |
| 5 | nit | Password feedback appears twice in near-identical words (grey line then red line) in the themes task. | content |
| 6 | nit | Red-team half is not a real decision: task text and option labels say which to pick; the meter's "Fewer flags means harder to spot" does nothing for the hidden-line choice. | content |

Counts: 0 blockers, 0 majors, 4 minors, 2 nits.

Not findings: Mission Brief and "Resume session?" overlay on reload; the extra end screen after the kiosk's Close; `pressKey` refusing on the title card (harness limit). The bootstrap trace "Enter then click" cannot tell which input closed the card; the keyboard did work when tried separately on a settled card.

## Times (estimated real-player)
Persona 1 full about 14 min; persona 2 full about 7 min; defend-only about 7 min.
