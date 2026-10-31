# E17 blind playtest, round B2 (Acceptable use, defend-only)

Tester: Sonnet 5.5, blind (no scenario, planning, bridge or report files read). Folder `awareness_e17_acceptable_use_defend`, the only E17 folder, so both personas ran on it. Headless, keyless :3001 (machine load about 19). Harness logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e17-b2/p1-session.jsonl` (game 5140) and `.../p2-session.jsonl` (game 5143). Screenshots in the same folder. Verifier output: both runs "progress recorded, 1 task completed", score 100, globals `episode_e17_acceptable_use_defend_defend_done` and `_defend_pass`.

## Runs and times

| Run | Game | Harness wall clock | Estimated real reading pace |
|---|---|---|---|
| 1. Do your best (with reload) | 5140 | 4 min 44 s | about 9 min (target 8) |
| 2. Struggling player | 5143 | 1 min 44 s | about 4 min |

Persona 1 doubled as the defend-only check (nothing else exists for E17).

## Timeline, persona 1 (what I thought the goal was)

1. Training room, objective "Sort the can I moments". Goal guess: do something at the kiosk with "can I" questions.
2. Talked to Nilesh: "Allowed, Not allowed, Ask first... Sort the cards, then a short inbox." Goal now clear: cards, then inbox.
3. Kiosk: Brief page (a fictional haulier, three answers), Start. Then "The 'can I?' sort", Open the cards, Start sorting.
4. Nine cards. Score 8 of 9, the one miss being the football-streaming card, answered Ask first and marked "Safe choice, never marked wrong". Felt fair.
5. Done, "Open the inbox", Start. Six messages. Did message 1 (Roomcall install, Verify, ticked Unapproved tool, 100). Reloaded here.
6. After reload (Resume clicked): Defend stage and the finished card sort were kept; the inbox restarted from 0 of 6, as the brief page warns. Lost about 1 message of progress, nothing else. Redid it.
7. Inbox: Roomcall Verify, Shauna personal lookup Report, Colin login Report, intranet monitoring notice Trust, HR reminder Trust, Formatmoor Report. 100%.
8. Debrief, Finish, objective complete toasts. No further instruction after that.

Persona 2: skipped Nilesh, Allowed on all nine cards (3 of 9 right), Trust on everything except Delete on the monitoring notice, no real ticks. Score 0%.

## Didn't-know-what-to-do moments

| Where | How long | Tried | Unstuck by |
|---|---|---|---|
| Start, objective "Sort the can I moments" | under 10 s | read the objective, looked for something to sort | Nilesh's line and the nearby kiosk; the objective text itself reads garbled (no quote marks around "can I?") |
| End of the debrief, after Finish | about 10 s | looked for what to do next | nothing; only two toasts and a narration line "the cards and the inbox are all done". No send-off, no "you can leave", no sign the episode is over |
| After reload | about 15 s | the Resume overlay (not counted as a finding) then reopened the kiosk | the kiosk's Defend page, which knew the cards were done |

No stuck moment lasted more than a few seconds.

## Real decisions and whether the answer was given away

| Decision | Arguable or obvious | Given away by |
|---|---|---|
| Card sort, football and bank on the work laptop | arguable; feedback is fair ("Safe choice, never marked wrong") | not given away |
| Card sort, PDF editor, USB stick, laptop abroad | mostly arguable between Not allowed and Ask first | hint "when not sure, Ask first" decides it for you |
| Card "Read out the code to IT on a call", "Wait and say nothing about a misdirected file" | obvious | wording ("wait and say nothing in case it was fine") |
| Inbox Roomcall (client asks you to install) | arguable, good | not given away |
| Inbox Shauna, Colin, Formatmoor | obvious once read; Colin ("You've got my password from last time") is a giveaway | wording |
| Inbox intranet and HR notices | obvious for a careful reader | tone is calm; the real ones are the dull ones |
| Report vs Verify vs Delete | blurred: Report is defined as "breaks a rule or needs a look" and the brief says "ask first, it's never the wrong answer, reporting is never marked down" | the brief page tells you to Report whenever unsure. Persona 1 scored 100 largely by Report/Verify everywhere |

Consequences showed: after each message ("What would have happened"), in the result page, in the debrief.

## What I learned (own words)

Ask first when unsure. Never share a login or read back a code. Don't install or upload to unapproved tools even if a client asks. Personal use in your own time is fine, and a notice about monitoring is real and is not a threat. Report a possible mistake straight away. Name the service desk for software, security team for anything suspicious, DPO for personal data. Monitoring has limits and staff have to be told.

## Five best lines

1. "Playing safe is never wrong. The clear-cut answer is Allowed." (football card)
2. "It reads like a warning, but it's the firm telling you plainly what it checks and why." (intranet notice)
3. "Rules are hard to carry in your head, so a miss here is no fault of yours." (debrief, struggling run)
4. "Installing it wasn't your call to make." (Roomcall)
5. "an honest mistake reported quickly is fixed, not punished." (debrief)

## Five worst lines

1. Objective title "Sort the can I moments" (missing quote marks, reads as a typo).
2. "You didn't tick anything you noticed" when I had ticked "Nothing looks wrong" (struggling run). Inaccurate.
3. "Deleting it is cautious, but reporting an unsure message is safer for everyone. The right call was Trust or Verify." Contradicts itself (reporting is safer, yet Report is not listed as right). The debrief adds "Reporting it only has someone re-confirm a genuine policy notice", pulling the other way.
4. "That costs 15 points off the round each, on top of the item itself" (struggling run). Scoring detail in the debrief reads as a penalty list, at odds with "no fault of yours".
5. "By reporting or checking 4 of these rather than just acting on them, you kept the firm on the right side of its own rules." Dense and a little pompous after a 100% result; the debrief overall is five paragraphs of policy summary.

## Scores (1-5)

| Dimension | Score | Note |
|---|---|---|
| Fun | 3 | calm, short, no tension; a sorting game and an inbox |
| Pacing | 4 | no clock, quick; the debrief is a wall of text |
| Clarity of goals | 4 | Nilesh states the two tasks; the objective title is garbled and the end gives no signal |
| Openness of decisions | 3 | brief page nudges to Report/Ask first; several cards and messages are obvious |
| Teaching | 4 | the reasons on screen after each answer are the strength; the monitoring limits and "who to ask" land well |

## Severity table

| # | Sev | Tag | Finding |
|---|---|---|---|
| 1 | minor | content | The brief page says "ask first, it's never the wrong answer, reporting is never marked down", then defines Report as "breaks a rule or needs a look". A player can Report everything. Scoring does mark a genuine message deleted (70) but there is no downside shown for over-reporting beyond one line. Decisions are less open than they look |
| 2 | minor | content | No end signal. After Finish: two toasts and a narration line; no Nilesh send-off, no instruction to leave, nothing says the episode is complete |
| 3 | minor | content | Objective title "Sort the can I moments" lacks the quote marks used everywhere else ("can I?") |
| 4 | minor | content | "You didn't tick anything you noticed" shown to a player who ticked "Nothing looks wrong" |
| 5 | minor | content | Contradictory Delete feedback: "reporting is safer than deleting", "right call was Trust or Verify", and "Reporting it only has someone re-confirm a genuine policy notice" |
| 6 | minor | content | The rules the cards are "answered from" are never shown. A player must guess Tarrowby's policy (bank on work laptop, football stream). Fair feedback, but it is guessing, not applying a known rule. A one-line policy summary on the Brief or on the room clipboard would fix it |
| 7 | minor | engine | The server records `_defend_pass` and score 100 for a 0% round. Probably by design (completion = pass), but a facilitator reading the record cannot see a struggling run |
| 8 | minor | content | Debrief is five dense policy blocks; hard to read for a rushed player. Struggling-run debrief does not recap the 6 missed cards at all, only the inbox |
| 9 | nit | content | Card 1 feedback text is duplicated in the live region ("Right. ... / Right. ...") when read by assistive tech or text extraction (the on-screen layout is fine) |
| 10 | nit | content | Inbox mixes "Requests handled the right way: 0" counter live during sort. It is a running score reveal, so after message 1 you know whether you were right before the feedback |
| 11 | nit | content | Nilesh's transcript repeats each line twice in text extraction (seen on-screen once) |

Counts: blocker 0, major 0, minor 8, nit 3 (content 10, engine 1).

## Reload (persona 1)

Reloaded mid-inbox after message 1 of 6. Resume restored the training room, the Defend stage and the finished card sort. The inbox restarted from the first message, as the Brief page says ("Closing or reloading before the end restarts this round"). I lost one message of work, no more. Not a finding beyond that it was disclosed.

## Defend-only sense check

Makes sense to someone who never saw a full episode: the Brief explains the setting, three answers and the inbox. The debrief refers to "the cards you just sorted", which is right here. No reference to an attack episode or a missing stage was seen.
