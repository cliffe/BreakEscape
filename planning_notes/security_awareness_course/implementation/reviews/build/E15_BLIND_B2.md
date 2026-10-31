# E15 Shadow IT: blind playtest B2

Second blind round, fresh tester (Sonnet). Question answered: can a non-technical player work it out, and is the debrief fair (a blind run, plus plumbing along the way). Headless browser, server :3001, machine load 25-35, so wall-clock timings are not representative.

Runs, session logs and verifier results (all three: "progress recorded, 1 task completed", score 100 on the game record):

| Run | Game | Session log | Notes |
| --- | --- | --- | --- |
| 1. Do your best, full | 5212 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e15-b2/run1-session.jsonl and run1b-session.jsonl | Reload mid-inbox. The first session hung (see D1), so I restarted the harness on the same game: run1b is the continuation. |
| 2. Struggling, full | 5225 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e15-b2/run2-session.jsonl | Round score 23%. |
| 3. Do your best, defend-only | 5232 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e15-b2/run3-session.jsonl | Round score 100%. |

verify-run.rb tail, run 1 (5212): tasks 1 completed (sort_shortcuts), globals episode_e15_shadow_it_defend_done and _pass, score 100, "VERDICT: progress recorded". Run 2 (5225): same, score 100 on the task. Run 3 (5232): same. The task is marked complete whatever the inbox score (run 2 scored 23% and the task still completed; I take that as intended for an awareness episode).

Screenshots are in /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e15-b2/ (r1-*, r2-*, r3-*).

Harness notes (not game findings): the Swap Shop and Choices radios are not in the control list, so I clicked the visible radio input with a DOM click on the visible control. Flags: none in this scenario.

## Timeline, run 1 (careful worker)

1. Training room, objective panel says "Sort the shortcuts". I thought: talk to the guard-looking man and use the kiosk. Nilesh (service desk) says ask IT first, "start at the kiosk, play out the Friday, then sort what's actually waiting". Clear.
2. Kiosk opens an episode runner with five numbered steps (Brief, Choices, Where it led, Defend, Debrief). Brief says it's an authorised exercise, fictional firm, "only the inbox is scored". Goal: get through five stages.
3. Choices: four ordinary dilemmas (personal email, free transfer site, USB in the post, free rota app). "Nothing here is scored." No feedback yet. I picked the cautious option each time.
4. Where it led: shows "six months later" for each choice. As a safe-route player each says "Your call: the safe route" plus what would have happened otherwise. Good.
5. Swap Shop: same four scenarios, match to four approved ways. Feedback after each card ("That's the one" plus reason). 4 of 4.
6. Defend: intro text then inbox of six messages. Reload after message 3: whole inbox round restarted from message 1 (as the page warned); stages 1-3 stayed done and the kiosk reopened on the Defend step. No lost progress beyond the warned round.
7. Inbox: Report x4 (stick x2, free tools x2), Trust x2 (genuine share link, genuine IT note). Score 100%.
8. Debrief (long scroll), Finish, "Episode finished" panel, bar Close closed it, then the "Shadow IT: finished" success screen with its own Close. Works as intended.

## Struggling player (run 2)

Quickest option every time: personal email, free site, plug in the stick, free app; Swap Shop always bin 1; inbox Trust, Trust, Delete, Trust, Delete, Verify, with no ticks.
- Where it led: tone is flat and factual, no blame ("The same stick reached four other firms; one plugged it in..." ). Fair.
- Swap Shop: a wrong card auto-places and says "Approved way: ...", later "Better: ...". Gentle.
- Inbox feedback after each message: "Not this time", "Safe, but not reported", "That one was real, and deleting it left a colleague ... unseen". Score 23%, headline "Worth practising: here's where to look first".
- Debrief ends with "a miss here says more about the pressure than about you". This is fair and blame-free.

## Defend-only (run 3)

Arrived cold. The brief says what the episode is, Nilesh explains. The Swap Shop cards are answerable from the bin labels alone. Inbox identical to full. Makes sense to someone who never saw the full episode; debrief reads fine. The brief says reporting or checking is "never marked down", which is looser than the full episode's "a real one does take a colleague's time".

## "Didn't know what to do" moments

| Where | Time | What I tried | What unstuck me |
| --- | --- | --- | --- |
| Inbox, no ticks (run 2) | about 20 s | Chose a verdict and pressed Confirm with nothing ticked. The panel showed the verdict, score and "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again." with a Next message button already there. Unclear whether I had to tick and re-confirm. | Clicked Next message; it advanced and the message was marked sorted. The "Confirm again" line is misleading. |
| Opening a message in the inbox | about 10 s (run 1) | The six items look like a list; nothing says click to read. | Clicked the first one. Minor. |
| First verdict on the Reception stick (run 1) | about 30 s | Report vs Verify: the stick should go to IT, but Verify says "ring the sender, or ask IT". | Picked Report. Run 2 and 3 then showed both are accepted ("The right call was Report or Verify"). |

No stuck moment lasted more than a minute of reading time. Harness hangs are listed as D1.

## Real decisions and whether the wording gave the answer away

| Decision | Gave away? |
| --- | --- |
| Choices 1-4 (stage 2) | Largely yes. The safe option always names IT, "with an end date" or "ask". It is not neutral wording. It is also stated as unscored. |
| Defend intro text | Yes: "A found or posted stick goes to IT unplugged; if the official way is slow, ask IT" is stated before the inbox, then repeated in the Swap Shop. A player who read the intro has the inbox answer. |
| Stick via Reception (inbox) | Less so: the sender is genuinely Tarrowby, only the content is a stick. Good one. |
| Chuckbox, PDFmangle | Domain names ending .example and the word "free" carry it. Easy. |
| Genuine share link and IT note | Fair: a careful player looks twice. Best decision in the episode; feedback explains that looking twice is fine. |
| Delete versus Report | Arguable, and the feedback tells the difference ("Safe, but not reported"). Good. |

Consequences show later: yes, Where it led shows each choice's outcome, and the debrief names every miss.

## What I learned (own words)

A free app or transfer site is not just inconvenient, it is outside the firm's control and can leak later. A stick in the post or from a stand goes to IT, not into my laptop. The "approved way" for each shortcut exists and IT will set it up quickly. If something real looks like a phish, it is fine to check it, and deleting a real message has a cost. Report rather than only delete, so others are warned.

## Five best lines

1. "Right to flag it. The service desk can set up an approved link that expires, and nobody is in trouble."
2. "A note's number proves nothing; the stick goes to IT."
3. "A share-link email is just what a phish copies, so it's fair to look twice. But this one is Tarrowby's own service on tarrowby.example..."
4. "These shortcuts are tempting when a deadline bites, so a miss here says more about the pressure than about you."
5. "Kindness and curiosity are why people plug these in, so the kind move is to hand it in rather than plug it in."

## Five worst lines

1. "When a message pressures you to move money, grant access, sign in or read back a code..." (debrief, "The habit to keep"): generic phishing text, nothing in this episode is about money or codes.
2. "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again." shown after the verdict is already locked.
3. "...report what you're unsure about using the route in the box below." The box is a dashed panel further down that just says to ask IT, so the instruction is circular.
4. "By reporting or checking 4 of these rather than acting on them, you kept a found stick or a risky shortcut away from the rest of your team." Counts the two genuine messages (one trusted) as reported or checked, which is not true.
5. "Right call is most of the score; naming what's wrong is the rest." Plain but the brief panel is a wall of rules before a first message.

## Scores (1-5)

| Fun | Pacing | Clarity of goals | Openness of decisions | Teaching |
| --- | --- | --- | --- | --- |
| 3 | 3 | 4 | 2 | 4 |

Pacing note: stages 2 and 3 and the Swap Shop cover the same four scenarios three times, so the middle drags. Openness is low because the answers are stated before they are asked.

## Times (estimated at a real person's reading pace)

| Run | Estimate | Target |
| --- | --- | --- |
| Full, careful | about 17-19 min | 15 |
| Full, struggling | about 9-10 min (skips reading) | 15 |
| Defend-only | about 9-10 min | 8 |

## Findings

| # | Severity | Tag | Finding | Evidence |
| --- | --- | --- | --- | --- |
| D1 | major | engine | After a reload at the title screen, the harness bootstrap with resume:"resume" looped for over 6 minutes and the session stopped answering. I had to stop the harness and start a new one on the same game. This is the known resume-overlay loop; I could not tell whether a real player's Continue would also stall (I used a synthetic Enter on the visible "Continue?" title, which worked). Not scored as a game blocker. | run1-session.jsonl seq 198 onward |
| D2 | minor | content | Inbox feedback after a no-tick Confirm says "Tick ... Then Confirm again" while the verdict is already locked and Next message is available. | r2-02-confirm-noticks.png |
| D3 | minor | content | Debrief "The habit to keep" is generic (money, access, codes) and does not match a shadow IT episode. | r1-16-debrief.png |
| D4 | minor | content | The answer to the Defend stage is stated in the stage intro, and the four Choices and four Swap Shop cards repeat the same scenarios. Decisions in stages 2-4 are not open. | r1-02, r1-05 text |
| D5 | minor | content | Defend-only brief says checking is "never marked down", full episode says a real one takes a colleague's time. Verify scored 100 on a genuine message in both, so there is never a cost to verifying everything. | run 2 and 3 |
| D6 | minor | content | "...by reporting or checking 4 of these rather than acting on them" counts the genuine messages. | r1-16-debrief.png |
| D7 | nit | content | "the box below" in the Monday paragraph points to a box that only says ask IT. | r1-16-debrief.png |
| D8 | nit | engine | Choices and Swap Shop radio options are not in the harness control list (needed a DOM click on the visible input); step pills on the "Episode finished" panel show no done marks (run 1 screenshot). | r1-17-finished.png |
| D9 | nit | content | After a reload mid-inbox the round restarts from message 1. The page warns of this, so not a bug; noted because it costs about 4 minutes of reading. | run 1 |

Counts: 0 blockers, 1 major (engine, harness-side, see D1), 5 minors, 3 nits.

Not reported by instruction: the Mission Brief popup after reload and the Resume overlay.

Reload result: stages 1-3 stayed done, task still open, the Defend step reopened at its intro; the inbox round restarted from the first message. No progress lost beyond that, as warned.

Finish check (new in this build): Finish on the debrief shows "Episode finished", the bar Close closes it, and the "Shadow IT: finished" success screen follows with its own Close. Both closed in all three runs.
