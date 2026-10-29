# E15 Shadow IT: blind playtest B1

Blind run, plumbing and player-side clarity. Harness on :3001, headless, fast speed (machine load about 3). Session logs (outside the repo): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e15/p1.jsonl` (game 5124, persona 1), `p2.jsonl` (game 5128, persona 2), `p3.jsonl` (game 5138, defend-only). I never opened scenarios, planning notes, JS or game state. I did read the `mg getState` visible text and made DOM clicks on visible labels and buttons (radio options, tick boxes, Finish, See result, Resume), because the harness cannot click them by label.

verify-run.rb: all three runs print "VERDICT: progress recorded" (1 task completed, 1 room, score 100). Persona 2 also records score 100 and `..._defend_pass` although the round showed 0%. Game 5124: played 309 s wall clock (includes reload).

## Timeline (persona 1, "do your best")

| Step | What I thought the goal was |
| --- | --- |
| Opening, training room | Objective panel says "Sort the shortcuts". No idea what a shortcut is yet. Nilesh has a speech bubble, but clicking him opens nothing. I walked to the white kiosk. |
| Kiosk brief | "Authorised exercise at Tarrowby, a fictional firm." Clear: this is a drill, nothing leaves the game. |
| 4 everyday choices | Pick what I would do. Told "nothing is scored". |
| Six months later | See each outcome. Clear and short. |
| Swap Shop | Match four shortcuts to approved ways. Reload happened here (see below). |
| Inbox, 6 messages | Trust / Report / Delete / Verify plus tick what you noticed. Clear after the first one. |
| Result and debrief | 100%. Then the "episode done" screen. |

## Reload test (persona 1)

I reloaded at the start of Swap Shop card 2, after the choices and outcomes were done. After clicking Resume and pressing Enter at the title, I was in the training room and the kiosk reopened at the Swap Shop intro. The earlier stages (brief, choices, where it led) stayed marked done. The Swap Shop cards had restarted, which the screen had warned ("If you close or reload, the cards start again from the top"). Lost: card 1 of the Swap Shop, about 20 seconds. No real progress lost. Not tested: reload inside the inbox round (the inbox also warns it restarts from message 1).

## "Didn't know what to do" moments

| Where | How long | Tried | What unstuck me |
| --- | --- | --- | --- |
| Start, training room | about 20 s | Clicked Nilesh (speech bubble over his head): nothing opens, no feedback | The kiosk was visible and the objective is the only hint. A non-technical player may click Nilesh several times. |
| Choices screen | about 10 s | Pressed "Next choice" with nothing selected: nothing happens, no message | Clicking an option first. No prompt that you must choose. |
| Swap Shop | about 10 s | Text says "Drop it on the approved way". The targets are buttons, not drop zones. I clicked them. | Trying a click. "Drop" wording is misleading on a click UI. |
| Inbox, after Confirm | 5 s | Instruction line "Tick what made you decide... Then Confirm again" stays on screen after the answer is already scored and no Confirm button exists (persona 2, no ticks) | Clicking Next message. |

No stuck moment lasted a minute.

## Real decisions and whether the answer was given away

| Decision | Arguable? | Given away by |
| --- | --- | --- |
| Choice 1, personal email vs remote access | Fairly obvious | The safe option is the longer, more specific one and mentions IT. The safe option is also the second one, every time. |
| Choice 2, free site vs file-sharing | Obvious | "to a named person, with an end date" reads like a security checklist. |
| Choice 3, plug in stick vs ring a number you already hold and give it to IT | Obvious | Same pattern; the safe wording spells out the procedure. |
| Choice 4, rota | Obvious | "ask IT to move it... remove the old access". |
| Swap Shop cards | Mostly clear from the card text | Fine for a teaching step. Card 1 has one other plausible target (hand it to IT). |
| Inbox items 1 to 4 | Arguable until the feedback | The four bad ones are all "free", "everyone's using it", "USB" or "posted"; once you have seen two, you know the pattern. The Benmoor expo stick is the best judgement call. |
| Inbox items 5 and 6 (real) | Arguable | A share-link email and an IT reply are what a phish copies. The task is "don't over-report". Good. |

On the choices: after I chose, "Six months later" labelled my route "Your call: the safe route". That label tells a player that they chose right, and persona 2 got a neutral "Your call" instead. That is fair and non-blaming for the unsafe path but gives the label away only afterwards, so no spoiler issue.

## What I learned, in my own words

Anything free, "everyone's using it", or arriving on a USB goes to IT, not into my machine. For big files there is an approved link that expires. If the official way is slow, ask IT: they say yes fast. Not every unexpected message is bad: a share from the firm's own service, and IT's reply, were fine, so check the sender domain and whether it is a colleague before reporting. I should not delete real messages. A note's phone number proves nothing; ring the number I already hold.

## Best five lines

1. "A note's number proves nothing; the stick goes to IT." (IT reply to the posted stick)
2. "Kindness and curiosity are why people plug these in, so the kind move is to hand it in rather than plug it in."
3. "Asking first is exactly what turns a workaround into a quick yes."
4. "These shortcuts are tempting when a deadline bites, so a miss here says more about the pressure than about you."
5. "'Everyone uses it' is how an unapproved tool spreads."

## Worst five lines

1. "You took the safe route on every one of these. Nothing to pick over here." (100% debrief; reads like a template and skips praise for the real ones)
2. "You asked IT for a tool and they've answered from Nilesh's real address" and "Thanks for asking rather than installing" (Nilesh reply). The player never asked for a PDF editor in any choice. Continuity gap in both variants.
3. "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again." (stale; answer is already scored and there is no Confirm)
4. "Reported as a scam, the Monday pack sits unread and the deadline slips" in the Delete debrief for the real Shauna share. The player Deleted; the text says Reported.
5. "When a message pressures you to move money, grant access, sign in or read back a code..." (habit to keep). Nothing in this episode involved money, sign-in or a code, so it is a generic line.

## Scores (1 to 5)

| Fun | Pacing | Clarity of goals | Openness of decisions | Teaching |
| --- | --- | --- | --- | --- |
| 3 | 4 | 4 | 2 | 4 |

Fun: tidy and quick but there is very little to do in the game world; all play is inside the kiosk and the room is decorative. Openness: the four everyday choices are unambiguous, and the real/fake in the inbox is the only real decision.

## Times (estimates at a real reading pace; harness times in brackets)

| Run | Estimate | Harness |
| --- | --- | --- |
| Persona 1, full | about 14 min | 4 min 35 s of driver time, kiosk to end screen |
| Persona 2, full (rushed, skipping text) | about 7 min | 1 min 20 s |
| Defend-only | about 8 min | 55 s |

Full is slightly under the 15 min target. Defend-only is on target.

## Persona 2 (struggling player)

Took option 1 each time in choices (all unsafe), the first card each time in Swap Shop (one of four right by luck), Trust on the four risky messages with no ticks, Delete on the real share, Trust on the real IT reply.

- Outcomes: "Your call" with no "safe route" label and concrete results (the stick reached four other firms, the temp could still edit the rota). Not blaming.
- Swap Shop: a wrong pick says only "Approved way: X" with no "not quite". Calm and clear. End summary "Better: X" is fair.
- Inbox: each miss gets "Not this time", "What would have happened" and "Look for". Fair. The tone is good ("nobody is in trouble").
- Result: **0%**. The four misses cost 15 points each "on top of the item itself", so 0, 0, 0, 0, 70, 100 plus penalties floors at 0. A player who got both real messages mostly right still sees "Score 0 percent". It reads harsh for a "no blame" product. The closing line ("a miss here says more about the pressure than about you") helps.
- Debrief for the Delete: "Deleting it is cautious, but reporting an unsure message is safer... The right call was Trust or Verify." The first half says reporting is better, the second half lists Trust or Verify. Contradictory.
- End screen appears after Finish; the game state records `defend_pass` and score 100 despite 0%.

## Defend-only run

Makes sense to someone who never saw the full episode. The intro says it is a fictional firm and what to do. The Swap Shop and inbox work the same. The Nilesh reply says "You asked IT for a tool", which a defend-only player never did, and in this variant the whole bridge is missing. The end card reads "Shortcuts sorted" and is fine.

## Findings

| # | Severity | Finding | Tag | Where |
| --- | --- | --- | --- | --- |
| 1 | major | Nilesh's reply and its feedback assume the player asked IT for a PDF editor ("You asked IT for a tool", "Thanks for asking rather than installing"). No choice in the full or defend-only run has the player ask. The real/trust message makes no sense on first read. | content | Inbox item 6, both variants |
| 2 | major | Persona 2 ends on "Score 0 percent" after two fair real-message calls, with penalties stacked on the per-item score. Harsh for a no-blame course. The game still records pass and score 100. | content | Result screen |
| 3 | minor | Stale instruction "Tick what made you decide... Then Confirm again" appears after the item is already scored with no Confirm button, when no tick was chosen. | engine | Inbox feedback |
| 4 | minor | Delete feedback on a real message: "Reported as a scam, the Monday pack sits unread" (player deleted), and "reporting is safer" then "right call was Trust or Verify". | content | Inbox item 5, debrief |
| 5 | minor | The safe option is always the longer, procedural wording and always placed second in the four choices. | content | Choices 1 to 4 |
| 6 | minor | Nilesh has a speech bubble but clicking him opens nothing. | content | Training room |
| 7 | minor | "Next choice" with nothing selected does nothing and says nothing. | engine | Choices |
| 8 | minor | "Drop it on the approved way" but targets are click buttons. | content | Swap Shop intro |
| 9 | minor | Habit-to-keep paragraph is generic (money, sign-in, read-back code) and does not match a shadow-IT episode. | content | Debrief |
| 10 | nit | Feedback for the Tarrowby File Share says "to you by name"; the email header is "you@tarrowby.example" and the greeting is "Hi,". | content | Inbox item 5 |
| 11 | nit | "Nothing to pick over here" on a 100% debrief; no praise. | content | Debrief |
| 12 | nit | Verdict banner reads "Verdict locked: Trust." above the finished list. Meaning unclear. | content | Inbox, after item 6 |
| 13 | nit | After a Resume, the player stands at the room start (192,198); fine, noted only. | engine | Reload |

0 blockers, 2 majors, 8 minors, 4 nits (counts include the nit rows above).

I did not classify any of these as game bugs. Rows tagged engine are where the behaviour looked like the interface rather than the writing; a human should rule.

## Not tested

Reload inside the inbox round; "Verify" as a choice (persona 1 used Report, persona 2 used Trust and Delete, so Verify's feedback was never seen); keyboard-only play; the Delete-on-a-risky-item branch; the exact feedback for persona 1 if the stick choice is Verify.
