# E8 After the click: blind playtest B1

Blind run (puzzle and deduction question: can a player work this out unaided). Read only the playtest skill, AGENTS.md "Housekeeping" and what the screen shows. Headless, keyless server on :3001, fast speed, load average under 4. Questions answered: plumbing and unexpected behaviour. There are no secrets in this episode, so the earned-secrets table is empty (no PINs, codes or flags). The verifier shows the Defend sort round scored 100 on the server record in all three runs, including the run that scored 0% on screen (finding F5).

Harness notes (not findings): one DOM `keydown Enter` dispatch to clear the title screen after the reload (`pressKey` is refused while the title screen is a minigame); two `interact` calls needed on Anjali the first time (a `converse` first call reported `no-effect-confirmed`, the second opened her). `bootstrap` with `resume:"resume"` hung for 6+ minutes after the reload (the known resume-overlay loop); I killed that session by PID and started a new one on the same game id, which is equivalent to a reload.

| Run | Game | Log | Verifier |
|---|---|---|---|
| 1 Do your best (full) | 4992 | scratchpad/aw2/blind-e8/p1.jsonl (up to the reload), p1b.jsonl (after) | progress recorded, 2 tasks completed, score 100 |
| 2 Struggling (full) | 4997 | scratchpad/aw2/blind-e8/p2.jsonl | progress recorded, 2 tasks completed, score 100 |
| 3 Defend-only, persona 1 | 4999 | scratchpad/aw2/blind-e8/p3.jsonl | progress recorded, 1 task completed, score 100 |

(All under /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/. Screenshots in blind-e8/.) Verifier output was pasted into the run, tail only: globals included `phish_takeover_victim_landed` (run 1), none for run 2, and `episode_e8_after_the_click_defend_done/_pass` in runs 1 and 2; run 3 set `..._defend_defend_done/_pass`. Rooms beyond the first: 0 (single-room episode).

## Run 1: Do your best (about 15 min at a reading pace)

| Time (est.) | What happened | What I thought the goal was |
|---|---|---|
| 0:00 | Spawn in the training room. The Objectives panel shows "Send the takeover email" and "Sort the signs that follow". Spoke to Anjali Rao: "today is about the ten minutes after... Start at the kiosk: write the email first, then take the other seat." | Use the kiosk: write one email, then sort something. |
| 1:00 | Kiosk Brief page: red team first, then swap seats, "Only that second part is scored." | Clear. Two halves. |
| 1:30 | Research: browser with company site (Our people, Signing in, Company news) and Friendface. Clicked each item to note it (Ayaan's role and address, "IT notices come from the service desk", the SSO upgrade, the two Friendface posts). | Collect facts about Ayaan to make an email fit him. |
| 4:00 | Mail client. Read the red team lead's authorisation mail. Compose: picked the service desk name and address, the "your session has ended" pretext, the "before the end of the day" ask, and "single sign-on" for the blank. The meter showed red flags and said the From address was forged and the deadline was pressure. | Make the email believable; the meter is a hint tool. |
| 6:00 | Sent. "It landed. They acted on it." plus three "He would open it..." reasons. | Goal done. |
| 6:30 | "Now it lands on you": my email as Ayaan met it, a Sent item to a client with changed bank details, a sign-in prompt from outside the UK. Read, clicked Continue. | Now I'm the colleague. |
| 7:00 | RELOAD between stages. Progress kept: task 1 already ticked, kiosk reopened on the same "Now it lands on you" page. Nothing lost. | |
| 7:30 | Defend: six messages. Report on the Sent item, Report on the password confirmation, Deny and report on the sign-in prompt, Trust on Reuben, Report on the locked-files page, Trust on the maintenance notice. Ticked the matching reasons each time. All 100. | Sort real signs from ordinary mail and report what is wrong. |
| 12:00 | Result 100%. Debrief "What happened" with the five questions of a report, first steps, habit to keep, how to report here. Finish. | |
| 14:00 | End card: "You've seen both sides of a click." | Finished. |

**Reload:** no progress lost at a stage boundary. The Defend brief says closing or reloading mid-round restarts from the first message; I did not test a mid-round reload (not asked to, and the screen says what happens).

## Run 2: Struggling player (about 9 min)

Rushed, skipped Anjali, trusted anything that looked official.

- Skipped Anjali, opened the kiosk, pressed Start, opened the browser and closed it at once with nothing noted. That works; no gate in Research.
- Write: Compose said "Nobody to write to yet — find who to send it to first." Went back, noted only Ayaan. Compose again: the sender name and address showed "no evidence yet / A blank needs evidence you haven't found yet". Back again, noted the "Signing in" page. Picked the "session has ended" pretext: the sign-on blank needed evidence too ("which sign-on system: no evidence yet"). Instead of a third trip I switched to the newsletter pretext (no blank) and sent: "It did not land. ... No change he can match this to, so no reason to sign in again." Three trips to research for a player who does not read.
- The flip page became "Nothing to replay this time", then "next, you're the one whose account is being used". Smooth.
- Defend, quickest-looking answers, no ticks (Confirm accepts zero ticks): Trust the Sent item (0), Trust the password confirmation (0), Approve the sign-in prompt (0), Delete Reuben (70), Delete the locked-files page (30), Trust the maintenance notice (100). Round score 0%: "Worth practising: here's where to look first".
- Feedback was fair and blame-free: "Not this time", "The right call was Report or Verify", a "What would have happened" line each, and the debrief closes with "These messages are built to fool careful people, so a miss here says more about the attack than about you. The points only show where to look next time." The debrief names three answers that "let an attacker straight in" and costs 15 points each, which is clear.
- End card still said "You've seen both sides of a click: you took the red team's seat, then sorted the signs" after a 0% round, and the server score was 100 with a `_pass` global (F5).

## Run 3: Defend-only (about 6 min)

Made sense to someone who never saw the full episode. Anjali's line ("He clicked a convincing email, so someone else is in his account. Some signs are real, some ordinary. Report anything odd.") plus the kiosk Brief covered the setup. The Defend page here adds "the one move that works for every real sign is to report it and let the team act", which gives the strategy away (F1). I tried Verify on the password message (full marks, "Checking first is a sound habit") and Deny without Report on the prompt (70, "nobody was told"), both explained well. Result 95%. The tally read "Phish caught 4 of 4 (2 reported, 1 checked by another route, 1 deleted)" although I never deleted anything; the one deleted was my Deny (F6).

## Didn't know what to do

| Where | How long | What I tried | What unstuck me |
|---|---|---|---|
| Run 2, Compose with no recipient | about 20 s | Compose with nothing noted | The message "find who to send it to first" and the "Back to research" button |
| Run 2, sender and sign-on blanks showing "no evidence yet" | about 1 min, twice | Looking for a way to type the address | Guessing that the browser pages are the evidence; the text does not say where to look |
| Run 1, noting facts (research) | about 15 s | Clicking "Add to notes" (shown as text) | Clicking the fact itself, which gives "Noted" |

No stuck moment lasted more than a minute.

## Real decisions

| Decision | Arguable or obvious? | Consequence shown later? |
|---|---|---|
| Sender name and address (Write) | Obvious: one option each (only the service desk appears), so it is not a choice. | The meter says it is forged. |
| Pretext (reauth / softer reauth / newsletter) | Arguable at first look, but the "session has ended" and the SSO blank are the ones tied to evidence I had just read; the newsletter one has no link to what I found. | Yes: "It landed" vs "It did not land", with reasons. |
| Ask (before end of day / no rush) | Obvious from wording: the meter explains urgency as pressure. | Yes, in the meter and result. |
| Defend: Sent item, password confirmation, sign-in prompt, locked files | Mostly given away: the four signs read as bad as soon as you open them, and the tick list shows the exact signs by name (e.g. "Ransom note", "Sent item you didn't send"). | Yes, strong per-message feedback. |
| Defend: Reuben and maintenance notice | Obvious. They are the only two messages with nothing odd, and the feedback itself says "after a run of real signs it is tempting to report everything". | Yes. |
| Approve / Deny / Deny and report | Arguable only for the third: both Deny options work, the report is the bit that earns the last 30. Not given away by colour. | Yes. |

Nothing was given away by colour. Wording gave away the Defend answers (F1).

## What I learned, in my own words

A convincing email gets a person to sign in, and what follows is quiet: a sent item they never wrote, a password change they did not ask for, a sign-in prompt from a strange place. A real IT address on a message does not make it genuine, because it can be forged and the service desk never asks for a sign-in by email. If any of those things show up, do not tap Approve; deny, report straight away, change the password from the real site, and leave a locked device alone. Reporting a mistake quickly matters more than not having made it. Real-looking ordinary mail (a colleague asking for help, a planned outage) should still be handled normally.

## Five best lines

1. "The service desk never sends sign-in requests by email, whatever address they come from; that is the one thing that would have given it away."
2. "That was not carelessness: it was built to pass for the notice he acts on."
3. "Ayaan did not write this; it is in his Sent folder, sent while someone else was signed in as him."
4. "IT Security: Thanks. We've locked the account, warned the client not to pay, and started the recovery. You caught it from the Sent folder, which is exactly the sign."
5. "These messages are built to fool careful people, so a miss here says more about the attack than about you."

## Five worst lines

1. "A blank needs evidence you haven't found yet" / "no evidence yet": reads like system jargon and does not say where to look.
2. "Nothing to replay this time": vague about what was skipped and why.
3. "You read every one of these the right way. Nothing to pick over here.": the 100% debrief ends with no reflection on the player's own email or its pretext.
4. "the one move that works for every real sign is to report it and let the team act" (defend-only Defend intro): hands over the strategy before the first message.
5. "In real life a reply to this would land in Quayholt IT Service Desk's own inbox, not yours; here it comes to analyst@quayholt.example.": clumsy aside, and it shows even when the mail did not land.

## Scores (1-5)

Fun 3. Pacing 4. Clarity of goals 4. Openness of decisions 2. Teaching 4.

## Times (estimated at a real reading pace)

Run 1 full, about 15 min. Run 2 full (struggling), about 9 min. Run 3 defend-only, about 6 min (target 8). The full episode fits the 15-minute target but only with every research page read; a skimming player is faster.

## Severity table

| # | Severity | Finding | Tag | Where |
|---|---|---|---|---|
| F1 | major | Defend decisions are largely given away: the four real signs are obviously bad on opening, the two ordinary messages are obviously fine, the tick list names the exact signs ("Ransom note", "Sent item you didn't send"), and the defend-only intro says to report every real sign. Little left to deduce. | content | p1 lines 100-140 (Defend), p3 Defend page |
| F2 | minor | Write sender and sign-on blanks say "no evidence yet" without saying to go back to the browser; a skimming player makes three trips to research. | content | p2 compose |
| F3 | minor | Sender name, sender address and the sign-on blank each offer a single option, so they are not decisions. | content | p1 compose |
| F4 | minor | A 100% debrief says "Nothing to pick over here" and never returns to the email the player wrote (why it landed, what the pretext did). Teaching of the red-team half is only in the pre-send meter and the flip page. | content | p1 debrief |
| F5 | minor | After a 0% Defend round and a phish that did not land, the end card still says "You've seen both sides of a click: you took the red team's seat, then sorted the signs", and the server records score 100 with a `_pass` global. Suspect intended (completion, not pass/fail); flagging for a ruling. | content or engine | p2 end card, verify-run for game 4997 |
| F6 | minor | Defend tally counts a Deny as "1 deleted" ("2 reported, 1 checked by another route, 1 deleted") though nothing was deleted. | content or engine | p3 Defend result |
| F7 | minor | The Report button says "This is a phish" but is also the right call for a genuine password-change confirmation and a ransom note page; the label and the feedback ("This confirmation is genuine") contradict at the moment of choosing. | content | p1 Defend |
| F8 | minor | The debrief "Finish" button is partly cut off at the bottom of a 1400x1000 viewport and needs a scroll. | engine | p1 debrief |
| F9 | nit | "Phish stopped for the team: 0" counter at the start of Defend is jargon before anything has happened. | content | p1 Defend |
| F10 | nit | The state name `episode_e8_after_the_click_defend_defend_done` (doubled "defend") in the defend-only variant. Not visible to a player; seen through the verifier. | content | p3 verify-run |
| F11 | nit | Confirm accepts zero ticked reasons, so the "tick what you noticed" half of the score can be skipped without a prompt (the result does say "You didn't name any flags"). | content | p2 Defend |

0 blockers, 1 major, 7 minors, 3 nits.
