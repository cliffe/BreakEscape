# E16 Insider risk: blind playtest B4

Fourth blind round, fresh tester. Episode `awareness_e16_insider_risk` (full) and `awareness_e16_insider_risk_defend`. Keyless server :3001, headless (load was about 7, other testers running). Blind rules kept: only the playtest skill, AGENTS.md "Housekeeping" and what a player sees on screen. The kiosk's radio options and checkboxes can't be clicked by label through the harness, so I DOM-clicked the visible option text (a helper that clicks the visible `label` containing the option text); I did not read any hidden attribute to choose.

Evidence (scratchpad `aw2/blind-e16-b4/`):

| Run | Game | Session log | Screenshots |
| --- | --- | --- | --- |
| 1 Do your best (full) | 125 | `run1.jsonl` | `r1-00` to `r1-16` |
| 2 Struggling player (full) | 127 | `run2.jsonl` | `r2-01` to `r2-03` |
| 3 Defend-only, persona 1 | 128 | `run3.jsonl` | `r3-00`, `r3-01` |

All paths are under `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e16-b4/`. `verify-run.rb` returned "progress recorded: 1 task completed" for 125, 127 and 128 (this scenario has no rooms, flags or objects beyond the kiosk). Earned-secrets table: no secrets, PINs or flags in this episode.

## Severity table

| # | Severity | Tag | Finding |
| --- | --- | --- | --- |
| 1 | minor | content | A report with the wrong facts still passes. In run 2 I picked "A colleague has seemed to be having a hard week" as "what happened" and never the outside offer; the game said "Good. Facts, not a verdict ... " and let me finish. The form is built around the offer, but nothing nudges you to include it. |
| 2 | minor | content | The debrief never mentions the Raise-a-concern step. Run 1 and run 2 both ended with a debrief that scores and discusses only the inbox and the five choices. The form's feedback appears inline, then disappears from the story. |
| 3 | minor | content | The 5 everyday choices are easy to read. The safe option is always the "go through the proper channel" one (service desk, security or manager, screenshot to security, check with manager, ask how her week is going). The risky one is the favour-doing, theory-adding or direct one. Wording gives the answer away. Acceptable because they aren't scored, but the "openness of decisions" is low. |
| 4 | minor | content | The inbox brief says "Reporting or checking when you're unsure is always fine and never marked down", which tells you to pick Report or Verify. Delete scored 30 and Trust 0, so the guidance matters, but it flattens the decision on messages 1, 3, 4, 5. Message 2 (Reuben) and 6 (Hana, genuine) are the only ones with real judgement. |
| 5 | minor | content | Defend-only: Anjali's only lines are "keep your login yours, tell me what you're offered, bring me facts". She doesn't say to use the kiosk (the full episode does: "Start at the kiosk"). The objective ("Handle the leaver week / Handle the messages") names no object. I went to the kiosk because the room has one white machine and Anjali pointed at it in the full run, but a cold player has no instruction. |
| 6 | minor | engine | The server records `..._pass` and score 100 for run 2 (round score 7%). Possibly by design (only the inbox is scored and pass means "completed"), but a facilitator reading the record would see a pass for a 7% round. Worth confirming that is intended. |
| 7 | minor | engine | A reload mid-form drops the form picks (the form says so on screen, so it is announced) and puts the player back at the room start, not where they stood. Stage progress is kept (I resumed on "Raise a concern", brief/choices/led all "done"). Not a lost-progress blocker. |
| 8 | nit | content | The debrief for a perfect round says "Risks handled right: 5 of 5 (4 reported, 1 checked by another route)" and "Checked by another route: 2" (Hana counts as the 2nd, but she is not one of the 5 risks). The numbers need a second read. |
| 9 | nit | content | Run 2's "weakest skills" line lists all six skills with "caught 0 of 1 each", so it doesn't prioritise. Reads like a list, not a coaching note. |
| 10 | nit | engine | After "Finish" then the bar's Close, a second end screen appears ("Insider risk episode done", with "Return to missions" and "Close", plus two toasts). The brief says the Close closes the panel, which it does; the second screen is a further step. Not wrong, but two end states in a row. |
| 11 | nit | content | In defend-only, Samira's father in hospital first appears in the debrief ("Seen, said, true"). It reads fine as a reveal, but the person has been introduced only as "a colleague, Samira" in the form prompt. |
| 12 | nit | content | The "Who was involved" option "A colleague on my team; I'd rather not say more than that" is a legal pick and gets praised, but it's a vague fact. Same family as finding 1. |

Counts: blocker 0, major 0, minor 7, nit 5. No blocker and no stuck moment over about 10 seconds in any run.

## Run 1: "Do your best" (full), game 125

Harness time 03:49 to 03:53 (about 4 min). Estimated real-person time: about 13 min (brief 1 min, five choices 2 min, where-it-led 1.5 min, form 2 min, six messages 4 min, debrief 2 min).

Timeline and what I thought the goal was:

- Start: room with Anjali and a white kiosk. Objectives panel says "Handle the leaver week / Handle the messages". Goal as I read it: do something about the week of a leaving colleague, probably through the kiosk. Walked to Anjali first.
- Anjali (about 20 s): "someone's leaving ... You're not here to catch anyone ... Start at the kiosk: make this week's calls first, then raise a concern and sort the messages." Goal clear: kiosk, in that order.
- Kiosk Brief: authorised exercise, fictional firm, "Only the set is scored". Clear.
- Everyday choices (5): picked service desk, route Craig's theory to security/manager, report the unknown contact, check with Ross's manager, ask Samira about her week. None are scored, the page says so.
- Where it led: only the safe outcomes shown, each with a one-line consequence. Good: no blame, "You are not in trouble for being approached."
- Raise a concern: picked the four facts about the offer (what, when, where, who). Left all three opinion buttons alone.
- **Reload here** (after 3 of 4 facts picked, 03:50:46). After the "Continue?" card the world reloaded, I walked back to the kiosk, and the kiosk opened on "Raise a concern" with Brief, Choices, Where it led shown as done. Lost: the three form picks (the screen said they would be). Did not lose any stage progress. Verdict: no real loss.
- Inbox, six messages: Report (offer), Verify (Reuben), Deny and report (sign-in at 23:51 from abroad), Report (Ross export), Report (look-alike IT address), Ring back (Hana). All 100. Result 100%, "Sharp: you read the offers and requests and knew why".
- Debrief: "Nothing to pick over here", "Seen, said, true" (Samira), three things to keep, the habit, "On Monday ...".
- Finish, then "Episode finished" panel, Close closed it. Then the success screen appeared.

Didn't-know-what-to-do moments: none over 10 seconds. The closest: after the form's "Done" the screen went to "Defend ... Open the inbox" with no mention that the report went anywhere (no one to tell, no acknowledgement). 5 to 10 seconds of "did that count?"; the on-screen "who to tell" note answered it.

Decisions:

| Decision | Arguable or obvious? | Consequence shown? |
| --- | --- | --- |
| Reuben asks for login | Obvious from "sit beside him" vs "service desk" wording | Yes, in Where it led |
| Craig's theory | Obvious (route vs "say you wondered too") | Yes |
| Unknown contact | Obvious ("Write back and ask what exactly is on offer" vs "send it to security") | Yes |
| Ross export | Obvious ("as asked" vs "check with manager") | Yes |
| Samira | Obvious (directly vs how is your week) | Yes, the kindest outcome |
| Inbox: Reuben | Arguable (Verify vs Report) | Both scored fine |
| Inbox: Hana (genuine) | Arguable, the best decision in the episode: refusing flat is not the aim, ring back or desk both score | Yes, feedback explains |
| Inbox: look-alike IT mail | Needs reading the address; the tick list names "look-alike" | Yes |

What I learned (my words): don't lend your login, don't reply to an offer, report it; if a sign-in prompt I didn't start arrives, deny it and tell security; send facts, not theories, to the right person; a rumour can land on someone having a bad week; genuine people also ask awkward things, so check by another route instead of refusing.

Lab-sheet questions: no lab sheet in scope for this blind run.

## Run 2: Struggling player (full), game 127

Harness time 03:54 to 03:56 (about 2 min). Estimated real-person time: about 8 min (skipped Anjali, skim-read the brief, rushed the inbox, read the debrief for about 3 min).

Took the quickest option each time: skipped Anjali and went straight to the kiosk; all five riskier choices (let him use the login, say I'd wondered, write back, export as asked, ask her directly); report with the colleague's hard week and the verdicts "Ross is stealing" then "Samira is in on it"; inbox: Delete, Trust, Approve, Trust, Trust (official-looking IT mail), Comply; ticked "Nothing looks wrong" on all.

- Where it led: consequences are shown plainly and kindly ("The question made a hard week harder", "Harmless this time; a reset would have cost two minutes"). No blame language.
- Form: the verdict buttons are exclusive (the second replaced the first), and the form says "Take the conclusion out before you finish". I took it out. Done is hidden until the conclusion is gone. Good gate and a gentle one.
- Inbox feedback: "Delete: Safe, but not reported" (30); "Trust ... The right call was Report or Verify" (0). Each message says what to look for and what could have happened. Phrases like "going along with it counts as a miss here, even though Reuben means no harm" are fair. Round score 7%, "Worth practising: here's where to look first", no mockery.
- Debrief answered "why" for each of the five risks, repeated each of my five choices with "The safer move was ...", and ended with "Offers and requests like these catch decent people ... a miss here is no judgement on anyone". Fair. It is long: reading it all is roughly 3 minutes; a rushed reader will skim.
- Gaps: no word on my report (finding 2) and "Weakest skills" lists six at once (finding 9).
- Finish gave "Episode finished"; Close closed it. The record shows pass and score 100 despite 7% (finding 6).

## Run 3: defend-only, persona 1, game 128

Harness time 03:56:44 to 03:57:44 (about 1 min). Estimated real-person time: about 7 min (brief 0.5, form 2, six messages 3.5, debrief 1).

- Opened the room, objective "Handle the leaver week / Handle the messages". Talked to Anjali (one short line, no pointer to the kiosk, finding 5). Went to the kiosk because it is the one object.
- Brief: "First you learn to raise a concern as facts ... then you sort a short set of messages ... Reporting or checking when you're unsure is always fine". Makes sense with no earlier stages.
- Raise a concern: the prompt introduces Samira, Craig and Ross as if known ("Samira has seemed to be having a hard week", "Craig floated a theory"). A cold player is told who they are in one line, enough. Tested the opinion gate (picked "Craig reckons Samira's involved", saw the removal prompt, took it out): same behaviour as the full run.
- Inbox: same six messages, same answers. On Hana I confirmed with nothing ticked and got "Tick what made you decide, or choose 'Nothing looks wrong'. Confirm again to move on." Confirmed again. Fine.
- Result 97% (secrecy tick missed on the IT mail; scored 80). Debrief opens with "The offers and the rumours here are the kind that catch decent people". Samira's backstory is given only here (finding 11). "Episode finished" appeared, Close closed it.
- Makes sense on its own. No stuck moment.

## Best five lines

1. "You are not in trouble for being approached." (Where it led, offer)
2. "Unusual is not the same as wrong, and a kind word comes first." (debrief)
3. "Genuine and awkward, not a trick: she lets you ring back on the number on file, which is the difference from an impostor." (Hana feedback)
4. "A report holds what you saw yourself, not what you think it means. Having a theory is normal; it belongs with the people whose job it is to look into it." (form gate)
5. "You don't have to be sure; you do have to be fair." (three things to keep)

## Worst five lines

1. "Your facts are exactly what's needed." shown after a report that omits the offer (finding 1).
2. "Risks handled right: 5 of 5 (4 reported, 1 checked by another route)" next to "Checked by another route: 2" (finding 8).
3. "Weakest skills: Recognising an offer for access or data, Spotting a request to share a login, MFA prompts, Spotting company data sent to a personal account, Secrecy and Sender address (caught 0 of 1 each)." (a list, not a priority, finding 9).
4. "Start at the kiosk: make this week's calls first, then raise a concern and sort the messages." appears twice in a row in the transcript on the first talk. The second may be the harness echoing the line before the choice; flagging in case it is on screen as a repeat.
5. "Approving let someone else into the account. They already have the password; the prompt was the last check." (true, but hard-edged beside the otherwise gentle tone, and the only line that reads as alarm).

## Scores (1 to 5)

| | Full | Defend-only |
| --- | --- | --- |
| Fun | 3 | 3 |
| Pacing | 4 | 4 |
| Clarity of goals | 4 | 3 (finding 5) |
| Openness of decisions | 2 | 3 (only the inbox) |
| Teaching | 4 | 4 |

Fun is limited by decisions being easy to read; the Hana and Reuben messages are the good ones.

## Times (real-person estimates)

| Run | Estimate | Target |
| --- | --- | --- |
| Full, persona 1 | about 13 min | about 15 |
| Full, struggling | about 8 min | about 15 (a skimmer finishes early) |
| Defend-only | about 7 min | about 8 |

## What did not break

Reload on the form kept the stage; Continue? card closed with Enter; Finish gave "Episode finished" and Close closed it in all three runs; no overlay hung; no stuck moment longer than about 10 seconds; no spoilers for the Resume or Mission Brief popups were reported, as instructed.
