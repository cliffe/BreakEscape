# E16 Insider risk: blind playtest B2

Blind run (second round). Games 5213 (persona 1, full), 5217 (persona 2, full), 5220 (defend-only, persona 1). Keyless :3001, headless (machine load about 30). Session logs and screenshots: scratchpad `aw2/blind-e16-b2/` (p1/p2/p3). Harness note: the kiosk's choice buttons (stage 2 choices, Next choice, Open the form, Start, Continue, Finish) are not in the harness control list; I used a DOM click on the visible button text. The inbox and form options were driven through the harness.

## Persona 1: "Do your best" (full)

Timeline, with what I thought the goal was:

1. Start in a training room with Anjali Rao and a kiosk. Goal: "talk to the person, use the kiosk". Anjali: "you're not here to catch anyone", start at the kiosk. Clear.
2. Kiosk Brief: authorised exercise, "keep your access to yourself, report what's offered, pass on facts, not a verdict". Goal: make calls, then raise a concern, then sort messages.
3. Choices (5, unscored): lend login (chose service desk), Craig's rumour (point him to security), anonymous offer (screenshot and report), Ross's export (route to manager), Samira (kind word plus tell manager).
4. Where it led: each choice shown with its alternative. Gentle ("You are not in trouble for being approached"). I thought: "this is the cause and effect, now something is asked of me."
5. Raise a concern form: pick facts. Reloaded here with two facts picked. After the Resume click and a fresh `bootstrap`, the kiosk reopened on the same stage ("Raise a concern"); the two picks were gone, as the intro text had warned ("If you close or reload, your picks start again"). Lost: about 30 s of picks. Stage progress kept.
6. Facts form redone, "Check my report" gave praise plus the "who to tell" note. Done.
7. Inbox of 6: offer text, Reuben's email, a late sign-in prompt, Ross's email, a fake IT migration email, Hana's call. Picked Report / Verify / Deny and report / Report / Report / Ring back, with ticks. 98%.
8. Debrief: per-message recap, "Seen, said, true" on Samira, three things to keep. Finish, then the "Episode finished" panel; the bar's Close closed it and then the mission-done screen appeared with its own Close. Both worked.

Reload result: no lost progress except the in-form picks, which the game says up front.

## Persona 2: struggling player (full)

Skipped Anjali. Took the quick option each time (lend login, add theory, reply, export, ask outright). Where it led showed each consequence plainly and without blame ("Harmless this time; a reset would have cost two minutes", "Rumours tend to land on the person already having the hardest week"). Form: picked the three verdicts and one vague fact; the checker said "Those facts are a good start. Add a couple more of the things you saw yourself, and leave the conclusion out" and I pressed Done anyway. Inbox: Delete, Trust, Approve, Trust, Trust, Comply, no ticks. 12%. Debrief explained each miss with "Look for" and "What could have happened", and said Reuben "means no harm". It reads fair and not scolding. I did not read the end of this debrief (my viewer cut at about 3,500 characters), so the "Seen, said, true" part is judged from persona 1 only.

## Defend-only (persona 1)

Brief names the exercise, Samira, Craig and Ross in one paragraph; it was enough to follow. Form then inbox then debrief worked and "Episode finished" appeared. Score 73% (I left ticks empty on the last five). Makes sense to someone who never saw the full episode, with one wobble (D3 below).

## "Didn't know what to do" moments

| # | Where | How long | Tried | Unstuck by |
|---|-------|----------|-------|-----------|
| 1 | Persona 2 inbox, after Confirm on a wrong answer | about 10 s | The text says "Tick what made you decide... Then Confirm again", but the score and "Next message" are already showing | I just pressed Next message. Real players may re-tick for nothing |
| 2 | After Check my report, Done vs picking more | a few seconds | n/a | "Done" is the only forward control |

No stuck moment over a minute. Server was slow once or twice (a few seconds), not stuck.

## Decisions

| Decision | Answer given away? |
|----------|--------------------|
| Choices 1-5 (stage 2) | Mostly arguable but the safe option is the more careful-sounding one every time; "add your own theory" and "export to personal email" read as wrong from wording. Choice 5 bundles two actions ("kind word; tell her manager if you're worried") so it is the obvious winner |
| Form: facts vs "what you think it means" | Given away by the heading and the "not a verdict" intro; fine for teaching |
| Opportunities text | Obvious (anonymous, cut of money) |
| Reuben | Arguable, good; "Verify" and "Report" both score full |
| Sign-in prompt | Obvious (23:51, unknown location outside the UK) |
| Ross export | Fairly obvious from wording |
| IT migration email | Wording gives it away (look-alike domain, "no need to raise a ticket"), but it is the one tested for header checks |
| Hana's call | Genuinely arguable and the best decision in the episode: a real colleague who accepts a ring-back |

Consequences show later in "Where it led" and in the debrief.

## What I learned (my words)

Don't lend your login even to a nice colleague, because it goes on your record. Report offers, don't reply. Deny unexpected sign-in prompts and say so. Check the sender domain. A hard-working colleague acting oddly is probably just having a bad week; give facts, not guesses, and tell the right person. Hana showed that checking back is not rude.

## Five best lines

1. "You are not in trouble for being approached."
2. "Rumours tend to land on the person already having the hardest week."
3. "Genuine and awkward, not a trick: she lets you ring back on the number on file."
4. "The hurry is real and human... What makes this one risky is the request to borrow your login, not the deadline." (extra tick not penalised)
5. "You don't have to be sure; you do have to be fair."

## Five worst lines

1. "You chose Comply... you did what they asked without checking" paired with "Score for this message: 100 of 100" (Hana).
2. "Tick what made you decide... Then Confirm again" shown after the score and Next message already appeared.
3. "Screenshotting it and reporting it, with no word back, is exactly right" when the defend-only player never screenshotted anything.
4. "Declining the personal-email export and asking his manager..." shown for a plain Report on Ross.
5. "Handled right: 5 of 5" on a six-message round (Hana counted separately, which is confusing).

## Scores

| Area | Score |
|------|-------|
| Fun | 3 |
| Pacing | 4 |
| Clarity of goals | 4 |
| Openness of decisions | 3 |
| Teaching | 4 |

## Times (estimated at a real reading pace)

| Run | Estimate |
|-----|----------|
| Persona 1 full | about 14 min (includes redoing the form after reload) |
| Persona 2 full | about 8 min |
| Defend-only | about 7 min |

## Findings

| # | Severity | Tag | Finding |
|---|----------|-----|---------|
| D1 | major | content | Hana's call: "Comply" gets 100 of 100, while the feedback says "you did what they asked without checking" and the result screen says "You complied this real one". The score and text disagree about whether it was a lapse. The 12% persona 2 round is inflated by this |
| D2 | minor | engine | On a wrong answer the feedback says "Tick what made you decide... Then Confirm again" even though the score is final and Next message is available |
| D3 | minor | content | The IT Security reply is one text per message whichever right option is picked, so it can describe an action the player did not take (Ross: "Declining... and asking his manager" after Report; the opportunity text: "Screenshotting it" in defend-only) |
| D4 | minor | content | Round summary "Handled right: 5 of 5" on a six-message round |
| D5 | minor | content | Form checker only praises or asks for "a couple more"; it does not say that the verdict picks were wrong. Persona 2 could press Done with "Craig reckons Samira's involved" in the report and move on. Also only one pick per category sticks (later pick replaces earlier), unannounced |
| D6 | minor | content | Choice 5 bundles "kind word" with "tell her manager if you're worried", so the safe option is a double-step against a single risky one |
| D7 | nit | engine | The kiosk's stage buttons are not in the harness control list (harness only, no player impact) |
| D8 | nit | content | Persona 2's debrief for the unticked round is clear about nothing to grade; "Next time, tick what you noticed" could say ticks add to the score |

Counts: 0 blockers, 1 major, 5 minors, 2 nits.

Not reported: the Mission Brief popup and Resume overlay on reload; Finish now showing the "Episode finished" panel and Close closing it (worked as intended, in all three runs).
