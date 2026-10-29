# E9 and E11 playtest P1 (Sam persona)

Run date 2026-10-29, repo HEAD 6ff3ce5d9 at start. Server :3001 keyless, headless, load average 12 to 22 the whole time, so measured times are inflated and the harness often needed two tries to bootstrap after a page load. Persona run, not blind: plumbing plus one unexpected-behaviour check (page reload mid-episode). Every step was driven through real clicks on visible controls (kiosk interact, browser rows, radio plus confirm, verdict cards, chip checkbox, Next); no globals set. No VMs, flags or PINs, so the earned-secrets table is empty.

**Persona (Sam, operations coordinator, 30s):** skims, picks fast, takes the risky option on purpose in at least two sandbox beats, and gets at least one defend item wrong on purpose.

## Evidence

| Run | Game id | Session log | Screenshots |
| --- | --- | --- | --- |
| E9 full | 4830 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e9-e11/e9-full-session.jsonl (277 commands) | e9f-01 to e9f-36 |
| E9 defend-only | 4831 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e9-e11/e9-defend-session.jsonl | e9d-01 to e9d-09 |
| E11 full | 4832 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e9-e11/e11-full-session.jsonl | e11f-01 to e11f-25 |
| E11 defend-only | 4833 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e9-e11/e11-defend-session.jsonl | e11d-01 to e11d-07 |

All screenshots are in /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e9-e11/. Game 4835 is a stray extra E9 game created by mistake and never played. Driver scripts (c.py, pick.sh, rad.sh, open.sh, fs.js) are in the same folder.

## Timings

Measured is wall clock with the harness clicking at speed on a loaded machine, so it is not what a learner takes. Estimate is reading about 250 words a minute while skimming, plus clicks, from the amount of text per screen.

| Run | Measured | Estimated for Sam | Target |
| --- | --- | --- | --- |
| E9 full | 17 min 07 s (incl. reload, slow reboot under load) | 14 to 16 min | 15 |
| E9 defend-only | 4 min 41 s | 8 to 9 min | 8 |
| E11 full | 10 min 50 s (incl. reload) | 13 to 14 min | 15 |
| E11 defend-only | 2 min 59 s | 8 to 9 min | 8 |

E9 full and both defend-only runs sit at or just over target. E9 full is the long one: the flip screen is about 190 words and the inbox brief 89, before eight messages with full feedback. Defend-only runs still spend four screens (episode brief, Defend card, inbox brief, Start) before item one, as in E19/E20 F-E19-6.

## Reload check (after the flip/montage, before the defend set)

| Episode | Reloaded at | Result |
| --- | --- | --- |
| E9 | "Defend / Open the inbox" card, straight after the "Now it's your phone" flip screen and Continue | PASS. Title screen and Resume overlay (expected), world returns, kiosk reopens on the Defend card with Brief, Research, Guess list, Your phone shown (done). Guesser and flip are not replayed. e9f-12-afterreload.png |
| E11 | "Defend / Open the inbox" card, after the "Six months later" montage and Continue | PASS, same behaviour, Brief, Choices, Where it led shown (done). e11f-10-afterreload.png |

Not tested: reload mid-inbox (brief says it restarts from message 1), reload during research or the guesser.

## Specific checks

| Check | Result |
| --- | --- |
| E11 montage shows "Your call" tags, no "Your choice." in body | PASS. Tags read "Your call" (amber bar, three picks) and "Your call: the safe route" (green bar); body text is the situation plus the outcome, no "Your choice." (e11f-07-montage.png). Minor leftovers in F-E11-6 and F-E11-12. |
| E9 flip no longer repeats itself | PARTLY. The old whole-paragraph repeat is gone, but three overlaps remain on the one screen, see F-E9-3. |
| Host lines over 30 words | Many. Kiosk prose blocks: E9 full brief 64, E9 flip explanation 61, E9 inbox brief 89, E9 Defend card 45, E11 full brief 64, E11 defend-only brief 84, E11 Defend card 55, E11 inbox brief 103. Only the E9 flip body (29) is under. I did not open the NPC conversations, so the Nilesh and Tomasz ink lines were not counted. |
| Fonts: addresses | PASS. Sender addresses (mail-from-address, E9 and E11) compute to Source Sans 3 at 16px. The E9 browser address bar was not measured. |
| Fonts: nothing under 13px | Two exceptions, both small: the stage-stepper number (aw-step-num) is 12px, and the objectives-panel tick glyphs (aim-icon 12px, task-icon 10px) are under 13px. Every text line is 13px or more. |
| Layout | Nothing cut off at 1400x1000; the debriefs scroll. |

## Verify-run output

```
--- 4830 (E9 full)
game            4830  (mission 143)
globals set     7: engine_tutorial_declined, episode_e9_passwords_defend_done, episode_e9_passwords_defend_pass, guess_e9_landed, se_intel_tarrowby_mather_forum, se_intel_tarrowby_mather_pet, se_intel_tarrowby_mather_team
tasks           2 in objectivesState, 2 completed (run_the_guesser 19:22:04Z, lock_the_account 19:34:07Z)
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
--- 4831 (E9 defend-only)
game            4831  (mission 148)
globals set     3: engine_tutorial_declined, episode_e9_passwords_defend_defend_done, episode_e9_passwords_defend_defend_pass
tasks           1 in objectivesState, 1 completed (lock_the_account 19:42:08Z)
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
--- 4832 (E11 full)
game            4832  (mission 144)
globals set     3: engine_tutorial_declined, episode_e11_misdirected_data_defend_done, episode_e11_misdirected_data_defend_pass
tasks           1 in objectivesState, 1 completed (sort_desk_inbox 19:55:50Z)
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
--- 4833 (E11 defend-only)
game            4833  (mission 142)
globals set     3: engine_tutorial_declined, episode_e11_misdirected_data_defend_defend_done, episode_e11_misdirected_data_defend_defend_pass
tasks           1 in objectivesState, 1 completed (sort_desk_inbox 20:08:57Z)
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

(Mission ids in the lines above are as printed by verify-run; the E9 full line is abridged to the lines that matter.) Note the pass global is set even at 39% (E9 full), as with the 53% E19 run: pass means "finished", not "scored well". Defend-only globals carry the doubled "_defend_defend_" name, as in E8/E19/E20.

## Severity counts

| Episode | Blocker | Major | Minor | Nit |
| --- | --- | --- | --- | --- |
| E9 | 0 | 1 | 9 | 2 |
| E11 | 0 | 3 | 9 | 2 |

## Findings, E9 "Passwords and password managers"

| ID | Sev | What happened | Expected | Screenshot | Type |
| --- | --- | --- | --- | --- | --- |
| F-E9-1 | Major | Result and debrief name the weakest skills as "The tells most often missed: MFA prompts, Spotting a message that asks you to type or read back a sign-in number and Secrecy (caught 0 of 1 each)." The list is garbled (one tell is a whole sentence), "MFA" is jargon for Sam, and "Secrecy" is scored on the fake IT message that never asks for secrecy (it says "just approve the next one"). Same family as F-E19-1. | Three short plain tell names that match what the messages did. | e9f-34-debrief.png | content (chip labels or mapping in scenario.json.erb / defend.json) |
| F-E9-2 | Minor | Question "This service offers three ways to sign in. Pick the strongest": Sam took the text code, then in the defend run the authenticator app. Both scored 0 of 100 and "Not the best choice", though the feedback says "both worth having" and the debrief calls the app "next". Jargon in the options: "passkey", "authenticator app with number matching". | Partial credit for the app, and a half-line saying what a passkey is before it is the answer. | e9f-29-q4fb.png, e9d-q | content |
| F-E9-3 | Minor | Flip screen ("Now it's your phone") still overlaps itself: the first line says "You watched a reused password open a colleague's account", the next says "It opened Colin's account in seconds"; the prompt caption says "Someone has your password but not your phone" and the explanation opens "Someone has a password of yours"; "The number is on their screen, not IT's" appears twice (message caption and explanation). About 190 words on one screen for a skimmer. | Say each thing once. Cut the explanation paragraph to two sentences. | e9f-10.png | content |
| F-E9-4 | Minor | Inbox brief runs to 89 words plus the verdict legend and the sign-in rules (Approve / Deny / Deny and report), about 170 words before Start. | Short brief; the card help is already on the cards. | e9f-13.png | content |
| F-E9-5 | Minor | Confirmation is said three times on a card: "Your verdict: Approve. Locked in.", then "Thanks for reporting. That warns everyone else.", then "You chose Deny and report. Right call: denied and reported." On question cards "Your verdict:" repeats the whole long option text ("A unique password the manager generates, used only on this portal. Locked in."). Same as F-E19-3. | One confirmation line; do not echo the long option. | e9d-q, e9f-25-q2fb.png | content and engine |
| F-E9-6 | Minor | A correct call shows "Missed:" and a score under 100 when no chip is ticked: Deny and report on the 02:40 prompt scored 60 of 100 with "Missed: An MFA prompt you didn't trigger". Sam read "Missed" as "I got it wrong". | "Right call. You could also have noticed..." or hold the chip score separately. | session log, game 4831, message 2 | content and engine |
| F-E9-7 | Minor | The message list marks Sam's wrong call on the IT message as "Trusted" and the real prompt as "Approved", the same style as a right call, so the list reads as a clean run while the score is 39%. Row labels in the question rows read "Question / Question Which password is stronger?" (the word twice). Same as F-E19-7. | Neutral mark for wrong calls; one "Question". | e9f-32 (text in session log) | engine |
| F-E9-8 | Minor | Result line "You trusted this real one: 'Tarrowby Sign-in'" for a prompt Sam approved. Approve is not Trust. | "You approved the real prompt." | e9f-33-result.png | content |
| F-E9-9 | Minor | Guess list row "A guess you could not build: you have not found the fact it needs. / not found" reads as an error to a skimmer. Sandbox question "the manager fills it in for you" does not say password manager (Sam has just met a warehouse manager). | "A guess you could not make: you did not find the fact." and "password manager". | e9f-09.png, e9f-26-q3.png | content |
| F-E9-10 | Minor | Debrief carries seven panels (How passwords get stolen, sign-in ladder, Browsers notes and managers, What a passkey is, The habit to keep, On Monday, How to report) after the per-message review. The debrief says a text code is "a last resort" while the question feedback said it is "worth having". | One headline lesson and a trimmed list; make the two agree. | e9f-34-debrief.png | content |
| F-E9-11 | Nit | Research step: the "Add to notes" link on the profile does nothing visible; notes only get added by clicking the post itself ("Noted: ..."). Sam hesitated about 10 seconds. The browser Close and the kiosk Close have the same label. | Label the posts "Note this" or make Add to notes work. | e9f-05b.png | content and engine |
| F-E9-12 | Nit | Stage-stepper number (12px) and objective tick icons (10 to 12px) under 13px. Defend-only debrief opener "These prompts and choices follow one reused password doing the rounds, and anyone can be caught out by them" is vague. | 13px minimum; plainer opener. | e9d-08.png | engine and content |

"Didn't know what to do" moments (E9): research browser (F-E9-11), about 10 seconds; the chip step ("What made you say that?"), skipped with "Nothing looks wrong", accepted; the sign-in question, where Sam did not know a passkey and guessed.

Five weakest lines, E9:

1. "The tells most often missed: MFA prompts, Spotting a message that asks you to type or read back a sign-in number and Secrecy (caught 0 of 1 each)."
2. "You chose Deny and report. Right call: denied and reported... Missed: An MFA prompt you didn't trigger" with a score of 60.
3. "Your verdict: A unique password the manager generates, used only on this portal. Locked in."
4. "These prompts and choices follow one reused password doing the rounds, and anyone can be caught out by them." (defend-only debrief opener)
5. "The authenticator app with number matching" as an answer option.

Lesson Sam left with: "Don't reuse a password; let the manager make a different one for everything, and if a login prompt I didn't start turns up, deny it and report it." That matches the intended point. The guesser run (reused password opens the account in seconds) lands well. The passkey point did not land.

## Findings, E11 "Misdirected data"

| ID | Sev | What happened | Expected | Screenshot | Type |
| --- | --- | --- | --- | --- | --- |
| F-E11-1 | Major | Sam Reported "I think this wasn't meant for me?" (Sam Whitlow telling the desk the overtime sheet reached him by mistake). Feedback says "Reported, and that's never wrong. For next time, here is why this one was fine", then explains it is a personal data breach to report to the DPO. The result and debrief then say "You reported one real one just in case, which is fine when unsure ... Its card showed what made it safe." and "What made it safe: ... That is a personal data breach". A breach is not "safe", and the report was the right call, not a hedge. The report acknowledgement also says "A colleague will check it and let it through." | The right call labelled right, no "just in case" or "fine" wording, no "let it through". | e11f-14-fb1.png, e11f-24-result.png | content and engine (the generic "reported a real one" template in the result screen is the cause) |
| F-E11-2 | Major | The data-protection items are not scored on the lesson. On the angry "I want EVERYTHING you hold" email (a subject access request) Trust, Report and Verify all score 100 "Right call. This one was real." The feedback then says to "Pass it to the DPO the same day ... do not gather or send anything yourself". On the Kestrel Court "laundry list" with a care-summary attachment, Trust again scores 100 and the feedback says "Tell the sender, report it, and delete it when the DPO says so. We now hold data we should not." The brief says these go to the DPO, but none of the four verdicts means "tell the DPO", and "Right call" appears next to advice to do something else. In the full run Sam trusted both and still got "Real calls and emails handled right 4 of 4". | A way to choose "pass to DPO" (or Report scoring higher than Trust on these two), and feedback that agrees with the score. | e11f-19-fb4.png, e11f-21-fb5.png | content and engine |
| F-E11-3 | Major | "DPO" is used about eight times in kiosk text (Defend card, inbox brief, feedback, debrief) and never explained. The only expansion I found is in the NPC (Tomasz) ink header. A skimming clerk does not know who the DPO is, and the debrief's last advice is "tell your DPO the same day". | "the data protection officer (DPO)" at first use in the brief and Defend card. | e11f-08.png, e11f-11.png | content |
| F-E11-4 | Minor | Verdict cards worded for phishing sit on data-protection items: "Report: This is a phish. Send it to security." on a misdirected spreadsheet and a subject access request; "Phish caught: 1 of 2", "Phish stopped for the team", "Real calls and emails handled right". Same family as F-E20-1. | Wording that fits the item, or a data-protection route on the card. | e11f-11.png, e11f-24-result.png | content and engine |
| F-E11-5 | Minor | Choice 3 and its montage entry use "DPO" as well ("Tell Martin those were given to sort claims, and ask the DPO first"; "Three days the DPO never had"). | Plain version ("our data protection lead"). | e11f-06, e11f-07-montage.png | content |
| F-E11-6 | Minor | Montage entries show the whole choice setup (the full scenario text) plus the outcome, but not which option Sam took, so "Your call" does not say what the call was. The order is overtime sheet, Carol, Martin, Hale, not the order Sam made them. | One line "You sent it to the first Sam" above the outcome; keep choice order. | e11f-07-montage.png | content and engine |
| F-E11-7 | Minor | The safe-route montage entry reads "The version where the list was exported: families ... complained. Asking first turned it into a proper sign-up box." The first sentence describes what Sam did not do. | Lead with what happened to Sam's pick. | e11f-07-montage.png | content |
| F-E11-8 | Minor | Two other people called Sam ("Sam in Payroll" / Sam Whitaker and Sam Whitlow of Hollinsbrook House) plus the Sam persona; hard to follow the overtime-sheet story even without the persona. | A different first name for one of them. | e11f-05.png | content |
| F-E11-9 | Minor | Header note jargon: "All three checks passed because the sender owns carrholme-payroll.example. A pass tells you which domain sent it, not that it is Carrholme." The three checks are never named. | "The message did pass the technical checks, but that only proves ... " in plain words. | e11f-17 (text in session log) | content |
| F-E11-10 | Minor | Debrief box repeats itself: "Behind every row is a person" then "Behind every row in a spreadsheet is a person. If it goes wrong, tell the DPO straight away." then, further down, "tell your DPO the same day". The generic "habit to keep" paragraph is about money, sign-ins and read-back codes, which is not this episode. | Say it once; swap in a data-handling habit. | e11f-25-debrief | content |
| F-E11-11 | Minor | The "laundry list" clue is only the attachment file name ("Kestrel-Court-residents-care-summary.xlsx"), shown small under the message. Sam trusted it. | Fine as a puzzle if the filename is more prominent, or accept Trust and say so. | e11f-20-msg5.png | content |
| F-E11-12 | Minor | Defend-only has four screens before the first item (episode brief 84 words, Defend card 55, inbox brief 103, Start). The brief and card both say "report or check anything that doesn't sit right"; the inbox brief says it a third time. | Two screens at most. Same as F-E19-6. | e11d-01 to e11d-04 | content and engine |
| F-E11-13 | Nit | First montage card has a 6px amber bar, the others 4px (likely the focus ring or a first-child rule). | Same width. | e11f-07-montage.png | engine |
| F-E11-14 | Nit | Stepper number 12px and objective tick icons 10 to 12px (same as E9). | 13px minimum. | e11f-25 | engine |

"Didn't know what to do" moments (E11): the first inbox item. None of Trust / Report / Delete / Verify says "tell the DPO", and the item is a mistake, not an attack; Sam picked Report by elimination (about 10 seconds). Same on the subject access request, where Sam picked Trust and was told "right call" and also "pass it to the DPO". The call card was clear.

Five weakest lines, E11:

1. "You reported one real one just in case, which is fine when unsure: 'I think this wasn't meant for me?' ... What made it safe: ... That is a personal data breach."
2. "You chose Trust. Right call. This one was real. ... Pass it to the DPO the same day ... do not gather or send anything yourself."
3. "Thanks for reporting. A colleague will check it and let it through." (on a data breach)
4. "...belong with the DPO..." / "goes to the DPO the same day" with DPO undefined (inbox brief and Defend card).
5. "Header note: All three checks passed because the sender owns carrholme-payroll.example."

Lesson Sam left with: "If someone else's data lands with me, or someone asks for their data, I tell the DPO the same day; and don't give a phone number to someone who rings." The second half is clear; the first half Sam can repeat but cannot act on without knowing who the DPO is, and the scoring told Sam that trusting both items was right.

## Defend-only notes

- E9 defend-only (game 4831): brief, Defend card, inbox brief, Start, eight items, result (65%), debrief. Sam denied and reported both prompts, reported the IT message, then took the wrong company-name password and the authenticator app on purpose (65%). The "Deny and report" on the real 08:12 prompt was scored 100 with a friendly note, which is right.
- E11 defend-only (game 4833): same six items. Sam reported, rang back the police caller, reported the payroll phish, and used Report/Verify on the three data-protection items; all three scored 100 regardless of verdict (F-E11-2). Result 87% "Getting there" because no chips were ticked.
- Both defend-only briefs state the answer more than once before the first item.

## Not tested

Mid-inbox reload, closing the runner mid-guesser or mid-choices, keyboard-only play, audio (keyless server), phone width, the NPC conversations (Nilesh, Tomasz) and their host lines, the E9 browser address-bar font.
