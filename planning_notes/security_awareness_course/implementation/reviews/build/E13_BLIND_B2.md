# E13 AI assistant: blind playtest, round B2

Blind run, second round (B2). Episode E13, `awareness_e13_ai_assistant` (full) and `awareness_e13_ai_assistant_defend`. Harness headless on :3001 (machine load about 5, no display needed). Tester read only the playtest skill, AGENTS.md "Housekeeping" and what a player sees. New since B1: Finish on the debrief shows an "Episode finished" panel and the bar's Close closes it (seen, works).

Question answered: unexpected behaviour and clarity from a player's seat (not solvability; no VM flags in this episode).

## Runs and evidence

| Run | Game | Session log (scratchpad `aw2/blind-e13-b2/`) | Time at a real reading pace (estimate) |
|---|---|---|---|
| 1 Do your best (full) | 5203 | `full1.jsonl` (to reload), `full1b.jsonl` (after reload) | about 15 min (harness wall clock 606 s, including a 4 min harness hang at the reload) |
| 2 Struggling (full) | 5215 | `full2.jsonl` | about 5 min (113 s harness; a rushed reader skips most text) |
| 3 Defend-only, persona 1 | 5219 | `defend.jsonl` | about 6 min |

Screenshots are in the same folder (`f*.png` run 1, `p2-*.png` run 2, `d-*.png` run 3).

verify-run.rb tail, game 5203 (run 1): `tasks 2 completed (plant_hidden_instruction 01:26:28Z, handle_assistant_inbox 01:34:08Z); globals phish_assist_reader_landed, episode_e13_ai_assistant_defend_done, episode_e13_ai_assistant_defend_pass; VERDICT: progress recorded - 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.`
Game 5215 (run 2): `tasks 2 completed; globals phish_assist_reader_plain_sent, episode_e13_ai_assistant_defend_done, episode_e13_ai_assistant_defend_pass; VERDICT: progress recorded ... 2 tasks completed.`
Game 5219 (run 3): `tasks 1 completed (handle_assistant_inbox); globals episode_e13_ai_assistant_defend_defend_done, ..._defend_pass; VERDICT: progress recorded ... 1 tasks completed.`

Earned-secrets table: no codes, passwords or flags to earn. "Rows marked no": none. Everything was fetched on screen.

## Run 1 timeline (Do your best)

| Step | What I thought the goal was |
|---|---|
| Opening: Objectives panel reads "Write the supplier brief" and "Handle what comes at you" | Two jobs. Not sure what "handle" means yet. |
| Gwen: "red team: write a supplier brief with a line hidden in it for the assistant ... a test is coming, I'll say when" | Write a booby-trapped email, then play defender. I expected Gwen to call the "test"; she never did (the Defend stage is the test, nothing announces it). |
| Kiosk, Brief, Start, mail client, Gwen's email, Compose | Goal clear: send one message. |
| Pretext dropdown: "Plain brief" or "Brief with a hidden line for the assistant" | Obvious pick (see decisions). Chose hidden. |
| Send ("first Send is final"), "It landed. The assistant acted on it." Reply in Inbox: summary says Mossgate "needs the full site contact list sent to a new address today" | Clear and a good moment: I saw my own planted line work. |
| Flip screen: "Show hidden text" reveals the line | Understood the mechanism. |
| Assistant window: summarise emails, strike out lines from a complaints log, draft a report | Three small tasks, "in any order". Struck the allergy and password lines, checked the source on the draft (99.4% was invented; real was 96.1%). Good. |
| Reload while the draft task was open (mid-way through the Assistant job) | See "Reload" below. |
| Inbox round: 6 messages, Trust/Report/Delete/Verify, tick what you noticed | Sorted 3 phish, 3 real; per-message feedback; result 97%. |
| Debrief, Finish, "Episode finished" panel, Close, then a full-screen "AI ASSISTANT: FINISHED" success screen with Return to missions / Close | Done. |

### Reload (mid-way through the Assistant job)
Progress partly lost. Kept: stage (resumed at "Your message"/flip screen), the sent brief, the completed write task. Lost: the Assistant window's finished sub-tasks (Summarise my emails and the complaints strike-out came back unticked and blank), and the player was moved back to the room start. I redid two quick tasks, about 1 minute. The inbox round warns up front that reload restarts it, which is fair. The Assistant window gives no such warning ("Try each task below, in any order, then close this window.").

## "Didn't know what to do" moments

| Where | How long | What I tried / what unstuck me |
|---|---|---|
| Write stage text says "Write one message using what you found" | about 10 s | I had found nothing. Read it as "using what you've just learned", moved on. Wording only. |
| Pretext dropdown picked "hidden line", but the preview (greeting, Ask, red-flag meter) did not change and the meter still said "0 / this reads clean so far" | about 20 s | Wondered whether the choice registered; Send was enabled so I sent. The player never sees the hidden line they "wrote" until the flip screen. |
| Defend stage: Gwen's "a test is coming, I'll say when" never pays off | about 15 s | I looked around for Gwen; nothing. Opened the kiosk and the Defend stage was already there. |
| Assistant window, after the three tasks: "then close this window" | about 10 s | Close button in the header, found it. Easy to miss that closing is the way forward. |
| Harness hang on reload with `bootstrap resume` (the known resume-overlay loop) | about 4 min | Not a player moment; I restarted the session on the same game with `?skip_resume=1`. Not reported as a finding. |

No stuck moment lasted more than 20 s for a player.

## Decisions

| Decision | Arguable or given away? | Consequence shown? |
|---|---|---|
| Write: plain brief vs brief with a hidden line | Given away by the task ("a line hidden in it") and wording. A real choice only for a player who wants to see the plain case. | Yes, both branches have their own flip text. |
| Complaints log: what to strike out | Arguable. Allergy and password are obvious to a careful reader; Leo's name and the weak "caller mentioned" line are good red herrings. | Yes: themes summary and tailored feedback. |
| Draft: Check source vs Send without checking | Mildly given away: a "Check source" button sits next to the invented "(source: Q3 logistics review)". | Yes (I saw the true figures). I did not read the Send-without-checking feedback in run 2. |
| Invoice 1 (hidden text): Report | Given away by the "Show hidden text" button. It exists only on the phishing invoice; the genuine invoice has none. | Yes. |
| Invoice 2 (genuine): Trust | Arguable. "same as every month" and the same sender make it easy, but only because nothing is off. | Yes. |
| Voicemail from an unknown number as Tom: Verify | Given away by "(not in your contacts)" plus money request. Fair, but not much of a decision. | Yes. |
| Tom's real voicemail: Trust | Given away by "in your contacts" and "asking for nothing". | Yes. |
| CEO/Finance video call: Ring back | Given away by the wording ("still confidential", "no time to go checking"). It reads like the textbook case. The EXTERNAL tag and look-alike domain add to that. | Yes. |
| Adaeze's call: Comply | Given away by "no rush". | Yes. |
| Colour: Trust has a green tick, Report amber, Delete a red X on every message | Mild tilt toward Trust being "the good button" for a rushed player, and Delete looking "wrong". Not a giveaway, but it pre-colours the verdict. | n/a |

## What I learned, in my own words

An AI assistant that summarises my inbox reads every line as an order, including a line hidden in white text, so something planted in an email can steer it. Do not paste passwords or private details (a child's allergy) into it, and check its figures against the real source, because it will invent a number and a source. A voice or a face on a call proves nothing; if a message wants money, a list or a sign-in, hang up and ring a number I already hold. Secrecy and "no time to check" are the pressure to notice. Reporting is fine even if it turns out harmless.

Lab-sheet questions: none supplied to this tester.

## Run 2 (Struggling player): does the debrief explain mistakes fairly?

Took the first or quickest option each time, skipped Gwen entirely (the kiosk is usable without talking to her), read almost nothing.

- Write: chose the plain brief. The flip text handled it well ("That is the difference one buried line makes"). The write task still completed.
- Assistant: summarised without striking out anything. Feedback said "A password slipped through, the worst one to leave in" and offered "Report the password". The allergy line was not named in that feedback. I sent the draft without checking, closed at once and did not read what came back.
- Inbox: Trust, Trust, Trust, Trust, Comply, Comply. Got Phish caught 0 of 3, 5 percent, 3 "answers let an attacker straight in ... 15 points off each".
- Tone: per-message "Not this time ... The right call was Report or Verify", "What would have happened: £200 goes to a stranger", then in the debrief the line "These messages are built to fool careful people, so a miss here says more about the attack than about you. The points only show where to look next time." This is fair and not blaming. The result title "Worth practising: here's where to look first" is good.
- Weak point: the debrief ("What happened") only covers the inbox. The password pasted into the assistant and the unchecked invented draft are not recapped there. The Monday paragraph mentions them in general terms only. A rushed player who closed the Assistant window early never learns that the 99.4% was invented.
- Weak point: with no flags ticked, the feedback text still says "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again", while the verdict is already locked and only "Next message" is offered. The instruction cannot be followed.
- Weak point: five red "Missed" items stacked for one call is a lot to read for someone who already got 0 of 100.
- The debrief round score was "5%" yet the episode recorded `defend_pass` and a 100 task score (see findings, I make no ruling on whether that is intended).

## Run 3 (Defend-only, persona 1)

Gwen's line is different and shorter ("Brightwell's switched on its assistant ... Some are real, some aren't."). The kiosk shows Brief, Defend, Debrief and goes straight to the same inbox round. It makes sense on its own for someone who never saw the full episode, with these gaps:
- The inbox intro says "Brightwell's inbox, beside the assistant", but there is no assistant on screen. The "Show hidden text" button on the first invoice and the "Hidden instruction for an AI" checkbox come with no setup. A reader who has never seen the red-team stage has to guess what "a line for the assistant" means. I only recognised it because I had played the full episode first.
- The report reply "IT Security: Thanks, we pulled the brief and warned anyone whose assistant summarises the shared inbox" refers to "the brief" the player never wrote.
- The assistant-side lessons (pasting, checking figures) are absent from the play but I did not read the Monday paragraph in this variant, so I can't say whether it still mentions them.
- Finish, "Episode finished" panel, Close all worked.

## Five best lines

1. "It landed. The assistant acted on it." (seeing your own planted line work)
2. "That's the way: you took out the child's health detail and the password, and the assistant still had everything it needed for the summary."
3. "Good. The 99.4% figure and its 'source' were made up ... The source said 96.1% and a fridge fault."
4. "These messages are built to fool careful people, so a miss here says more about the attack than about you."
5. "Both faces are perfect and both are fake; a video call is not proof of who is on it."

## Five worst lines

1. "Write one message using what you found." (found what?)
2. "Tick what made you decide, or choose 'Nothing looks wrong'. Then Confirm again." (shown after the verdict is locked)
3. "Gwen: ... a test is coming, I'll say when." (never said; no test is announced)
4. "Getting there: a few tells slipped past" shown at 97 percent and 95 percent (reads as a slight when the score is near perfect)
5. "using the route in the box below" in the Monday paragraph, when the box is a separate dotted box that a skimmer may not connect to it; and "we pulled the brief" in defend-only.

## Scores (1-5)

| Fun | Pacing | Clarity of goals | Openness of decisions | Teaching |
|---|---|---|---|---|
| 3 | 4 | 4 | 2 | 4 |

Fun is held down by the inbox round being six single-click decisions with obvious answers. Openness is low because wording and the hidden-text button give most answers away. Teaching is good, especially the planted line, the invented figures and the debrief tone.

## Findings

| # | Severity | Finding | Tag | Evidence |
|---|---|---|---|---|
| 1 | major | Feedback after a locked verdict still tells the player "Tick what made you decide ... Then Confirm again" when only "Next message" is available. Seen whenever Confirm was pressed with no flags ticked. | engine | run 2, `p2-2-trust.png`, `p2-3-callmiss.png`; log `full2.jsonl` |
| 2 | major | Reloading mid-way through the Assistant window loses its completed sub-tasks (and the Assistant window has no restart warning, unlike the inbox round). Stage and sent brief are kept. | engine | run 1 reload, `full1b.jsonl` |
| 3 | major | Debrief covers only the inbox round. For a player who skipped the assistant tasks or sent the draft unchecked (password pasted, invented figures), the debrief does not recap those mistakes; Monday paragraph is generic. | content | run 2 `p2-5-debrief.png`, `p2-6-debrief-bottom.png` |
| 4 | minor | "Show hidden text" appears only on the phish invoice, so the button itself gives the answer for that message. | content | run 1 `f13-msg1.png` vs genuine invoice |
| 5 | minor | "Gwen: a test is coming, I'll say when" is never followed up; she says nothing between stages or at the end. | content | run 1 |
| 6 | minor | Write stage: choosing the hidden-line pretext changes nothing in the preview (red-flag meter stays "0, reads clean", no hidden line shown); the player cannot see what they wrote until after Send. | engine/content | `f4-compose.png`, `f5-hidden.png` |
| 7 | minor | "Write one message using what you found" has nothing to refer to. | content | run 1 |
| 8 | minor | Defend-only: inbox intro says "beside the assistant" with no assistant, "Show hidden text"/"Hidden instruction for an AI" appear without setup, and the IT Security reply says "we pulled the brief" for a brief the player never wrote. | content | run 3 |
| 9 | minor | Result title "Getting there: a few tells slipped past" at 95-97 percent. | content | run 1 `f24-result.png`, run 3 |
| 10 | minor | Struggling run recorded `defend_pass` and task score 100 with a round score of 5 percent. I cannot tell whether a pass here is intended; flagging for a human ruling. | suspect engine/content | `full2.jsonl`, verify-run for 5215 |
| 11 | minor | Debrief for a fully missed call stacks five red "Missed/Look for" items; heavy for a rushed player. | content | `p2-3-callmiss.png`, `p2-5-debrief.png` |
| 12 | nit | Gwen's low-contrast subtitle "Try each task below, in any order, then close this window" is dark green on a near-black strip at the top of the Assistant window; barely readable. | engine (styling) | `f8-defend.png` |
| 13 | nit | Option colours (green tick on Trust, amber on Report, red X on Delete) pre-colour the verdict. | content | `f14-msg1.png` |
| 14 | nit | The player is moved back to the room start after a reload (position not saved). | engine | run 1 |

0 blockers, 3 majors, 8 minors, 3 nits.

Not reported by instruction: the Mission Brief popup on reload and the "Resume session?" overlay. The harness `bootstrap resume:"resume"` hang (about 4 min, game 5203) is the known resume-overlay loop and is not a game finding.

Process note: the three sessions ran as `5203`/`1` (restarted once after the hang), `5215`, `5219`. All three were stopped; session-stop confirmed each. Other agents' sessions (5212, 5217, 5218) were left alone.
