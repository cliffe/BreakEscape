# E16 Insider Risk: blind playtest B1

Blind run, Sonnet 5.5, headless (machine load about 3, headless chosen because other testers share the server). Keyless server :3001. Harness driven one command at a time. Radio-button choices on the kiosk could not be driven by `mg clickText`/`clickControl`, so I clicked the visible option label with a DOM `eval` (visible control only, noted here). Mission Brief popup and "Resume session?" overlay are not findings.

Games: full persona 1 = 5123, full persona 2 = 5129, defend-only = 5137.
Session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e16/p1-session.jsonl`, `p2-session.jsonl`, `p3-session.jsonl`. Screenshots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e16/`.
verify-run.rb for each: "progress recorded, 1 tasks completed" (social scenario, no rooms or flags expected). All three ended on the success screen. Session lengths: 247 commands in the first run.

## Timeline (persona 1, "do your best")

| Step | What I thought the goal was |
|---|---|
| Training room, Anjali Rao speaks | "Something about a leaver this week; I'm not here to catch anyone. Go to the kiosk." Clear. |
| Kiosk: Brief | "Make calls, see where they led, then messages and a concern." Clear. |
| Choices (5 unscored) | Pick what I'd do in five office moments. |
| Where it led | Read consequences of each choice. |
| Raise a concern (form) | Build a fact-only report of the contact offer. Reloaded mid-build here. |
| Inbox, 6 messages | Sort each: Trust/Report/Delete/Verify, tick what I noticed. |
| Debrief | Score, "Seen, said, true" on Samira, three things to keep. Success screen. |

Reload: done while the concern form had two facts ticked. The stage (defend) and everything before it was kept. The half-built report was lost, which the form warns about on screen ("If you close or reload, your picks start again"). No lost progress beyond that. After Resume the player sprite was back at its start position, which is harmless.

## Didn't-know-what-to-do moments

None longer than a few seconds as a player would feel it. Items:

1. Concern form versus brief order (about 10 s). Anjali and the Defend card both say messages first, then raise a concern. In both full and defend-only runs the concern form came first and the inbox second. Tried: nothing, just carried on. Unstuck by reading the next card. Content.
2. Wellbeing chip in the concern form (about 15 s). "A colleague has seemed to be having a hard week" sits under "What happened" next to the money offer. Unsure whether to tick it. I left it out because the form says to take wellbeing to a manager or HR, not the security report. Content.
3. Inbox tick list has no option for "data going to a personal email" (Ross) (about 10 s). I used "skip the normal process" and was marked as caught. Content.
4. "Who was involved: I don't know why, and it may well be nothing" sits under who-was-involved, which is odd but understandable. Nit, content.

## Real decisions

| Decision | Arguable or obvious | Consequence shown later |
|---|---|---|
| Reuben wants my login | Obvious: the safe option is longer and names the service desk | Yes, in "Where it led" and the inbox |
| Craig's rumour | Obvious by wording: the right answer is the long, advice-style one | Yes (reached Samira) |
| Unknown contact offer | Obvious by wording, "Screenshot it and report it, without replying" | Yes |
| Ross's export | Obvious by wording ("Ask what the handover actually needs...") | Yes |
| Samira in early, calls, HR | Obvious: "Offer a kind word" against "report her as a suspect" | Yes, with a kind outcome |
| Inbox: offer, Reuben, prompt, Ross | Fairly obvious from the briefing text ("keep your login to yourself, report offers, deny prompts") | Immediate feedback |
| Inbox: IT Service Desk look-alike | Genuinely arguable until the sender address is read | Yes |
| Inbox: Hana's call | Genuinely arguable (genuine, awkward). Ring back, which she accepts, is scored fully | Yes, handled fairly |

In the five Choices the right answer is always the longer option and always the second or the one with the hedge. Someone skimming could pick by length alone. Colour gave nothing away.

## What I learned (own words)

Don't lend your login even to a real colleague, it goes on your record. Report any offer of money for access and don't reply. Don't pass on theories, give facts to the right person. A leaver asking for data to go to a personal email is a manager or security matter. A sign-in prompt you didn't start gets denied and reported. A kind word to a colleague who seems off comes before suspicion, and Samira's story showed why. Unusual is not wrong.

## Persona 2, "struggling player" (game 5129)

Took the quickest option each time: logged in for Reuben, added to the theory, replied to the offer, sent to personal email, asked Samira outright. Concern form: ticked the colleague-hard-week fact and two verdict chips. Inbox: Delete, Trust, Approve, Trust, Trust, Comply, no ticks.

- "Where it led" was fair and not scolding. Lines like "Harmless this time; a reset would have cost two minutes" and "The question made a hard week harder" teach without blaming. Good.
- Concern form: feedback said "Those facts are a good start. Add a couple more of the things you saw yourself, and leave the conclusion out" and let me finish with a verdict chip still in. It allowed Done, so the lesson is soft. Minor, content.
- Inbox feedback after each message: each says what was missed, "What would have happened", and "The right call was Report or Verify". Fair, no blame, no "you failed".
- Round result: 0%, "Worth practising: here's where to look first", with "4 answers let a risk through" and a 15-point penalty each. That is blunt: the round showed 0% although Delete scored 30 and the Hana call scored 70. A rushed player sees 0% and may feel told off. The words are kind, the number is not. Content (majors for tone, see table).
- The card says "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again." on a message that already showed its score and a Next message button, so it reads as a second step that does nothing. Content or engine, minor.
- Handled right counts say "1 of 5 (1 deleted)" which counts a deleted offer as handled right while the card scored it 30 and said "Safe, but not reported". Confusing. Content.
- The ending still shows the success screen: "Insider risk episode done... handled the leaver week's messages yourself". With a 0% round it reads as congratulating a failure. verify-run lists `episode_e16_insider_risk_defend_pass` as set. Content or engine, major or minor depending on intent (completion may be meant to be unscored; if so the "pass" label and the "handled the messages yourself" copy mislead).
- Hana's genuine call: Comply scored 70 but Reuben's identical-shaped Trust scored 0. Comply on a real caller is penalised less than lending a login, which is defensible but unexplained.

Did reporting a colleague feel like suspicion or blame? No. Anjali opens with "You're not here to catch anyone" and the concern form, the inbox ("nobody is in trouble", "You are not in trouble for being approached") and the Samira reveal ("Unusual is not the same as wrong, and a kind word comes first") all reinforce it. The one pull the other way is the concern form listing "Samira is in on it with Ross" as a chip among the options; it is clearly labelled a conclusion, which helps. Reporting an outside offer felt like help; reporting a colleague's wellbeing to a manager or HR felt like care.

## Defend-only (game 5137), persona 1

- Anjali's first line differs from the full run and is self-contained. Brief card says "an authorised exercise... a leaver's last week", fine.
- The concern form opens on a defend-only player with no context: "an unknown contact offered you money for access" (they haven't seen the message yet) and chips "Ross is stealing the client list", "Samira is in on it", "Craig reckons Samira's involved", with no introduction to who Ross, Samira or Craig are. The player understands the shape but not the people. Minor to major, content.
- The concern form comes before the inbox again, against the Defend card's "Go through the messages... then raise a concern".
- Inbox and feedback worked well alone. Result 96%.
- The debrief intro says "the ones you were caught out by are shown below", though I had none. I did not read the rest of the defend-only debrief in full (read the opening lines only), so I cannot say whether it has the Samira story.
- Ending: "Leaver week handled" success screen.

## Five best lines

1. Anjali: "You're not here to catch anyone."
2. "You are not in trouble for being approached."
3. "Unusual is not the same as wrong, and a kind word comes first."
4. "The question made a hard week harder." (consequence of asking Samira outright)
5. "Genuine and awkward, not a trick: she lets you ring back on the number on file, which is the difference from an impostor."

## Five worst lines or moments

1. "Round score: 0%. Worth practising" after four real mistakes plus a 15-point-each penalty. The number is harsher than the tone.
2. "Tick what made you decide... Then Confirm again." on a card that already shows its score.
3. "Handled right: 1 of 5 (1 deleted)" for a deleted offer scored 30.
4. Success screen "handled the leaver week's messages yourself" after a 0% round.
5. The concern form's "who was involved: I don't know why, and it may well be nothing" as a chip under the wrong heading.

## Scores (1-5)

| | Persona 1 | Persona 2 |
|---|---|---|
| Fun | 3 | 3 |
| Pacing | 4 | 4 |
| Clarity of goals | 4 (5 without the order mismatch) | 4 |
| Openness of decisions | 2 (Choices are obvious by length and wording; inbox 3 to 4) | 2 |
| Teaching | 4 | 4 |

## Times (estimated at a real reading pace)

| Run | Estimate |
|---|---|
| Full, persona 1 | about 17 min (Anjali 1, brief 1, choices 2, where-led 2, concern form 3, inbox 6 to 7, debrief 2) |
| Full, persona 2 (skimming) | about 7 min |
| Defend-only | about 9 min |

## Severity table

| # | Finding | Severity | Tag |
|---|---|---|---|
| 1 | Round 0% plus success screen "handled... yourself" and a "_defend_pass" global for a rushed run; either completion is deliberately unscored (then the copy should say so) or it is a pass for failing | major | content (engine if the pass global is meant to be conditional) |
| 2 | Choices (five, unscored) are decided by length and wording: the right option is always the long hedged one | major | content |
| 3 | Concern form comes before the inbox, against Anjali's and the Defend card's wording, in both variants | minor | content |
| 4 | Defend-only concern form names Ross, Samira, Craig and a message the player has not met | minor | content |
| 5 | "Tick what made you decide... Confirm again" shown on a scored card | minor | content (engine if Confirm is meant to still work) |
| 6 | "Handled right: 1 of 5 (1 deleted)" contradicts the card's 30/100 and "not reported" | minor | content |
| 7 | Concern form lets a verdict chip through to Done after only a soft nudge | minor | content |
| 8 | No tick option for data going to a personal email (Ross) | minor | content |
| 9 | Comply on a genuine call scores 70, Trust on a genuine login request scores 0, unexplained | nit | content |
| 10 | "I don't know why, and it may well be nothing" sits under Who was involved | nit | content |
| 11 | Kiosk radio choices were not drivable with `mg clickText`/`clickControl` (needed a DOM click on the visible label); a real player is unaffected | nit | engine (harness) |
| 12 | Anjali's first line appears twice in the `converse` transcript | nit | engine (harness, not seen on screen; unverified) |

Severity counts: blocker 0, major 2, minor 6, nit 4.

## Assumptions

- Assumed headless and a first-option "quickest-looking" choice for the rushed persona (Log in, Add, Reply, Send, Ask).
- Assumed the rest of the persona 1 debrief, which I read in full, matches the full-run debrief for persona 2 (I read the first screens of persona 2's debrief and not the last).
- The defend-only debrief I read in part only.
