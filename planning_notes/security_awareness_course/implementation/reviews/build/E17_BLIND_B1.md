# E17 blind playtest B1 (Acceptable use, defend-only)

Blind run, Sonnet tester, headless (machine load about 30). E17 exists only as `awareness_e17_acceptable_use_defend`, so both personas ran on it; there is no separate defend-only run. Server :3001 (keyless).

Evidence: session logs in the scratchpad `aw2/blind-e17/`: `p1-session.jsonl` (seq 1-156, ends in a stuck bootstrap, see S1), `p1b-session.jsonl` (relaunched, 117 commands), `p2-session.jsonl`. verify-run.rb: game 4955 "progress recorded ... 1 tasks completed", score 100, 509 s wall clock; game 4961 "progress recorded ... 1 tasks completed", score 100, 75 s wall clock. Neither game unlocked a room or flag (none exist in this episode). Screenshot: `p1-after-reload.png` (title screen "Awareness E17: Acceptable use / Continue?").

## Run 1: "Do your best" (game 4955)

### Timeline and what I thought the goal was
| Real-time estimate | What happened | Goal as I understood it |
|---|---|---|
| 0:00 | Landed in a training room: Nilesh (NPC) and a kiosk. Open task list showed one item. Brief popup (not reported). | "Use the kiosk." |
| 0:20 | Nilesh: one line, "Every rule here has a 'because'. Allowed, Not allowed, Ask first... Sort the cards, then a short inbox." One choice, "Thanks, Nilesh." | Sort cards, then inbox. Clear. |
| 0:40 | Kiosk: Brief screen, Start, then Defend, "Open the cards", "Start sorting". | Same. |
| 1:00-3:30 | 9 cards. Each answered with the reason on screen at once. I got 8 of 9 (put "Install a game on your work phone" in Not allowed; correct was Ask first). | Learn the firm's rules from the reasons. |
| 3:30 | "Where the cards went" summary lists every card with Right or Best answer plus reason. | |
| 3:45 | Inbox, 6 messages, Trust / Report / Delete / Verify plus a "what did you notice" tick list. | Decide what to do with each message. |
| 5:00 | Reloaded here, message 2 open, 1 verdict locked (see Reload). | |
| 5:30-9:00 | Redid message 1, then 2-6. Score 95%. | |
| 9:00 | Debrief, then a success screen "Acceptable use done". | Done. |

### Reload
Reloaded the page after verdict 1 with message 2 open. Result: title screen "Continue?", Enter, Mission Brief (ignored per instructions), player back at the spawn point. The kiosk reopened at the Defend stage (the card sort stayed done, "sort_can_i" intact), but the inbox restarted at "0 of 6 sorted". I lost one verdict (about 40 s of work). The screen said this in advance ("Closing or reloading before the end restarts this round from the first message"), so it is fair. The sort cards have the same warning ("If you close or reload, the cards start again"), yet my reload kept the sort as done. That is the better behaviour; the text just undersells it.

### "Didn't know what to do" moments
- S1, harness-only (not a player finding): `bootstrap` with `resume:"resume"` after the reload hung for over 2 minutes (the known resume loop in the skill). I killed the session by PID and relaunched, and the page then resumed fine with Enter. No bearing on the game.
- None for a player. The longest hesitation was the two-click entry (Start, then "Open the cards"/"Open the inbox", then "Start"/"Start sorting"): three consecutive start buttons, about 5 s of "didn't I already start?". Minor.
- Message 5 (HR reminder) and 4 (intranet) had no obvious cue that "Trust" was allowed to be the answer on an all-policy inbox. Took about 15 s each.

### Real decisions: given away?
- Cards: wording mostly arguable. "Install a game on your work phone" read as Not allowed to me; Ask first was the answer, and "Not sure? Ask first" being the third bin is a fair reason. "Check your own bank account on the work laptop at lunch" is a real judgement call and a good one. The last card ("Can you wait and say nothing...?") is obvious from the wording (a yes/no question mapped on to three bins).
- Inbox: Harlow's install request, Shauna's personal lookup, Colin's shared login are all "obviously wrong" once the sentence is read, but they are plausible, not marked by colour. Verify or Report both score full marks, so the decision is open. Intranet and HR are real and the debrief pays off the "scary monitoring email" well. Formatmoor: Delete scored 70, with "Safe, but not reported", which is arguable and explained. Consequence shows immediately in the feedback, not later.

### What I learned (own words)
Allowed / Not allowed / Ask first, and Ask first is the safe default. Do not install apps, do not log in as someone else, do not look people up for personal reasons, use the approved route (service desk, remote desktop). Monitoring exists, is limited, and I should be told. Report your own mistakes quickly and you will not be punished.

### Best five lines
1. "Every rule here has a 'because'." (Nilesh)
2. "Fine, but say less: your return date and who to contact, not where you are."
3. "Your login is you; a shared password hides who did what."
4. "It reads like a warning, but it's the firm telling you plainly what it checks and why."
5. "Safe, but not reported. Deleting protects you; reporting warns everyone else."

### Worst five lines
1. "Round score: 95%. Sharp: you caught the phish and knew why. Phish caught: 4 of 4" (no phish in this episode; debrief).
2. "The habit to keep: When a message pressures you to move money, grant access, sign in or read back a code..." (generic phishing paragraph, none of the six messages did that).
3. "Both halves matter: catching a phish stops the attack..." (same carry-over).
4. "Find out today how your organisation wants suspicious emails, calls and texts reported" (nothing in this episode was a suspicious call or text).
5. "Requests handled the right way: 4 of 4" and "Reported rather than just deleted: 0 of 4" on a 6-message inbox (denominators unexplained).

## Run 2: "Struggling player" (game 4961)
Rushed. Skipped Nilesh. Answered Allowed on every card, Trust on every message except Report for the scary intranet one, no clues ticked.

- Cards: 4 of 9 right (the draw was different from run 1: badge lending, football streaming, guest Wi-Fi, team chat, social media post, famous customer lookup, own laptop; so cards are drawn from a larger pool). Each wrong answer said "Not this one. It goes in Not allowed/Ask first. [reason]" with no blame.
- Inbox: Trust on Harlow (0), Shauna (0), Colin (0), Formatmoor (0). Each feedback block said "Not this time." and gave a one-line "What would have happened", which is fair and concrete. Reporting the genuine intranet mail scored 100 and the card said "Reported, and that's never wrong", then explained why it was fine.
- Debrief: "Round score: 0%. Worth practising: here's where to look first." Per-message "Here is what to look for next time" with a "What could have happened" line. Tone is not blaming. But:
  - "The tell most often missed: Spotting an unapproved tool or app (caught 0 of 2)" is fine.
  - "You didn't name any flags on these messages" (jargon; the tick list is called "what you noticed" on screen).
  - "The review cards show what gave each fake one away." and "These messages are built to fool careful people, so a miss here says more about the attack than about you." The messages are not fakes or attacks; a colleague asking to share a login is not an attack. Tone is blameless but the framing is wrong for this episode.
  - The 5 wrong cards (4 of 9) do not appear in the debrief at all. A player who closed the "Where the cards went" screen quickly gets no recap of the card mistakes, only of the inbox.
- Ending: "Acceptable use done / You've sorted the 'can I?' moments and handled the inbox, and finished this episode", shown after a 0%. Completion is not tied to passing, which is fine for training, but the success screen after 0% and "4 answers missed something that needed reporting" feels mismatched.

## Scores (1-5)
| | Run 1 | Run 2 |
|---|---|---|
| Fun | 3 | 3 |
| Pacing | 4 | 4 |
| Clarity of goals | 5 | 5 |
| Openness of decisions | 3 | 3 |
| Teaching | 4 | 3 |

## Times (estimated real-person pace, not harness time)
Run 1: about 9 min (includes about 1 min redoing message 1 after the reload); target 8, slightly over. Run 2: about 4 min (skipping Nilesh and the reading).

## Severity table
| # | Sev | Type | Finding |
|---|---|---|---|
| 1 | major | content | Debrief and result copy are phishing text reused on an acceptable-use episode: "you caught the phish", "Phish caught: N of 4", "The habit to keep" (move money, read back a code), "How to report here" (suspicious emails, calls, texts), "built to fool careful people... says more about the attack", "what gave each fake one away". Not one message is a phish. Seen in both runs. |
| 2 | minor | content | Card sort mistakes (run 2: 5 wrong) are not carried into the debrief; only the inbox is recapped. |
| 3 | minor | content | Score block is confusing: "Requests handled the right way 4 of 4" and "Reported rather than just deleted 0 of 4" on a 6-message inbox; run 2 reads "0 of 4" next to a reported genuine message that scored 100. |
| 4 | minor | content | "You didn't name any flags" is jargon; the on-screen heading is "what did you notice". |
| 5 | minor | engine | After a reload the sort stays done but the inbox restarts. Both warnings say "restarts from the top". The sort warning is wrong in the (better) direction; align the text or the behaviour. |
| 6 | nit | content | Three start buttons in a row per stage (Start, Open the cards, Start sorting). |
| 7 | nit | content | Last card is phrased as a yes/no question ("Can you wait and say nothing...?") on a three-bin sort. |
| 8 | nit | content | Message 1 "Caught" text describes "a free app or online service with no contract" for a client-requested meeting tool. |
| 9 | nit | content | Success screen after a 0% round with no mention of the score. |
| 10 | nit | engine | Dialogue transcript from `converse` repeats lines (Nilesh's opening and "Any time" each twice). Probably the harness; not seen on screen. |

Blockers: 0. Majors: 1. Minors: 4. Nits: 5 (plus 1 harness-only item, S1, not counted).
