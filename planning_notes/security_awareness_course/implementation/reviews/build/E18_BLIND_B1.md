# E18 Credential attacks at scale — blind playtest B1

Blind run, two personas on the full episode plus one defend-only run. Product: *Incident Simulations: Critical Cases*, awareness training for non-technical office staff. Tester read only the playtest skill, AGENTS.md "Housekeeping", and on-screen content; nothing in `scenarios/`, no earlier reviews, no JS/state used to find answers.

Episode is a template-level credential-attack exercise: opened accounts shown as a count, masked breach rows, no working credentials, tools, commands or thresholds anywhere on screen.

## Which question this run answers

Unexpected-behaviour and player-experience (blind). Not a solvability proof past VM work — there are no VM flags in this scenario, so nothing was gated on one.

## Sessions and game ids

| Run | Persona | Game | Session log | Lines |
| --- | --- | --- | --- | --- |
| Full episode | 1 "Do your best" (with mid-task reload) | 4994 | `blind-e18-r2/e18-full-session.jsonl` (pre-reload) + `e18-full-session-b.jsonl` (post-reload) | 157 + 114 |
| Full episode | 2 "Struggling player" | 5005 | `blind-e18-r2/e18-p2-session.jsonl` | 148 |
| Defend-only | 1 "Do your best" | 5010 | `blind-e18-r2/e18-defend-session.jsonl` | 96 |

Logs under `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e18-r2/` (kept out of the repo per brief).

### verify-run.rb (game 4994, full, persona 1, after reload + completion)

```
game            4994  (mission 165)
played for      824s of wall clock
current room    "training_room"
globals set     9: engine_tutorial_declined, episode_e18_credential_attacks_at_scale_defend_done,
                   episode_e18_credential_attacks_at_scale_defend_pass, guess_e18_landed,
                   se_intel_ms_email_pattern, se_intel_ms_motto, se_intel_ms_place,
                   se_intel_ms_projects, se_intel_ms_team_roster
tasks           2 in objectivesState, 2 completed
  run_the_campaign     "completed"  at 2026-10-29T21:29:58Z
  handle_the_alerts    "completed"  at 2026-10-29T21:40:05Z
tasks_completed 2
score           100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
```

### verify-run.rb (game 5005, full, persona 2 "struggling")

```
tasks           2 completed (run_the_campaign 21:42:35, handle_the_alerts 21:43:56)
score           100
VERDICT: progress recorded — 2 tasks completed.
```
(In-game `score` is the completion score; the struggling player's triage *round* scored 20%.)

### verify-run.rb (game 5010, defend-only, persona 1)

```
globals set     3: engine_tutorial_declined,
                   episode_e18_credential_attacks_at_scale_defend_defend_done,
                   episode_e18_credential_attacks_at_scale_defend_defend_pass
tasks           1 completed (handle_the_alerts 21:46:50)
score           100
VERDICT: progress recorded — 1 task completed.
```

## Earned-secrets table

No PINs, keys, codes, passphrases or flags exist in this episode — it is a template-level awareness exercise. The only "collectables" are five public-page facts gathered in the Research stage, each earned in-game before the Campaign used them.

| "Secret" | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- |
| Team roster | Our people page | Research | yes |
| Email-address pattern | Contact us page | Research | yes |
| Project names | Projects page | Research | yes |
| Strapline / motto | Home page | Research | yes |
| Studio location | Visit us page | Research | yes |

No rows marked "no". No VM flags, so the usual flag caveat does not apply; the exercise is fully playable end to end in standalone.

---

## Persona 1 "Do your best" — full episode

### Timeline (what I thought the goal was)

1. **Training room.** Saw a colleague (Ama) and a Training kiosk; tasks "run the campaign" / "handle the alerts". Goal guess: *learn something, then do a task at the kiosk.*
2. **Talk to Ama.** She explains attackers scoop up everyone's names + a few website words and try one password across the whole practice "so nothing locks", then I take my own seat and tell real alerts from fakes. Goal sharpened: *see the attack demonstrated, then defend my inbox — only the defend part is scored.*
3. **Kiosk → Brief.** Six stages (Brief, Research, Campaign, Your inbox, Defend, Debrief). Goal confirmed.
4. **Research.** Open a browser, read the practice's public pages, click five useful facts. Goal: *gather what an attacker would.* Clear.
5. **Campaign.** Step a made-up guesser through a colleague's guess list: website-word candidates open 3/5 accounts, a reused breach password opens the work email + supplier portal but not the wiki-only password, and a three-random-word passphrase survives. Goal: *watch why reuse + predictable words fail.* Clear.
6. **Your inbox (flip).** Two warm-up alerts already in the inbox; the attack set alarms ringing. Goal: *now I'm the target.*
7. **Defend.** Six alerts, each Trust / Report / Delete / Verify + tick what I noticed. The scored task. Did a mid-task reload here (2 of 6 sorted).
8. **Debrief.** Score, per-message review, spraying vs stuffing, "the one habit", what the practice does, and a concrete "on Monday" list.

Final triage score 100%; episode completed, both tasks done.

### "Didn't know what to do" moments

- **End of the Campaign stage (~1–2 min).** After "Run them all" finished, "Try the next guess" and "Run them all" went disabled, leaving only **Close** and **Stop the test**. There is no "Continue"/"Done" control. I first tried **Close** — it silently discarded the whole run and, on reopening the guesser, reset it to "20 to go" with no warning and no progress saved. I then reasoned that "Stop the test" (the only enabled action) must be the completion step, clicked it, and the stage advanced to "Your inbox". A careful player who reads "Stop the test" as *abort/cancel* could avoid it; a player who closes loses the run with no warning. See F1.

### Each real decision (and whether the answer was given away)

The core decisions are the six triage verdicts. All six are legitimate choices, but the discriminator is strongly signalled:

- **Look-alike sender domain is the main tell**, and the inbox warm-up pre-teaches it ("genuine ones send you to the real site, fakes to a look-alike"). Once you know to read the address, the two fake emails (`merrin-sallow.example`, `merrinsallow-studio.example`) and the one genuine (`merrinsallow.example`) sort themselves. The decision is more "spot the taught tell" than open judgement.
- **"Reporting when you're unsure is always fine and never marked down"** (stated up front and repeated in feedback) further lowers the stakes — Report is a safe default on anything suspicious, so a cautious player rarely risks points.
- Verify was never the *required* call on any message (feedback always offered Report or Verify as acceptable for the fakes, Trust or check-yourself for the genuine). So the four-way choice collapses in practice to a two-way "looks off → Report, looks clean → Trust".
- Consequence did show later: in the struggling run, trusting the two fake emails produced an explicit "this would hand your password to the attacker" and a visible score hit.

### What I learned, in my own words

Attackers don't crack one person; they take everyone's email pattern and a few words off the company website, then try one password across all accounts so nothing locks (spraying), and separately replay passwords stolen from other sites (stuffing). The fix is one unique, non-website password per account in a manager, plus MFA. When an alert pressures me to unlock/review/sign in through its link, I check it myself through a route I already trust, never type a password into a "checker", and a real breach check only ever needs my email address.

Lab-sheet-style questions this answers: *what is password spraying vs credential stuffing; why does one shared password across accounts avoid lockout; how do I tell a genuine security alert from a fake; why never type a password to "unlock" or "check" something.*

---

## Persona 2 "Struggling player" — full episode

Played rushed: skipped Ama, clicked the first facts without reading, ran the campaign without stepping, and in the inbox trusted every message and ticked "Nothing looks wrong" each time (the quickest option, trusting anything that looked official).

- Trusted all six: 3 genuine right, 3 phish missed (the fake lockout, the fake sign-in, the breach-checker page).
- **Round score 20%.** Scoring applied an extra penalty on top of the missed items: "2 answers let an attacker straight in (trusting a phish email)... That costs 15 points off the round each." The breach-checker *page* did not carry that straight-in penalty, only the two phish emails did.
- **The debrief is fair and non-blaming.** Wrong answers read "You chose Trust. Not this time. This one was a phish. The right call was Report or Verify," then list what was missed, why, and a "What would have happened" consequence. The result screen is headed "Worth practising: here's where to look first", credits the genuine ones handled right, and nudges "Next time, tick what looks off." No shaming language anywhere.
- **The episode still completes at any score.** The struggling player reaches the same full debrief (spraying, stuffing, the habit, the Monday actions) and both tasks complete. Good for training: nobody is locked out of the teaching for doing badly. Worth a design note that the in-game `score` global reads 100 regardless of the 20% round (F3).

---

## Defend-only run — persona 1

Stands alone well. Ama's intro is rewritten for this cut ("Your own seat now. After an attack the alerts come fast, some real, some fakes. Report the fakes, and never type a password to unlock or check anything."), and the kiosk Brief sets the scene without needing the campaign ("Someone has run a password-guessing campaign across the whole practice, and now a wave of alerts is arriving"). The three-stage flow (Brief → Defend → Debrief) is clear, and the debrief still explains spraying and stuffing in full, so a player who never saw the attack demo still gets the concepts. Scored 100%; task completed. End card reads "ALERTS HANDLED". No confusion points.

---

## The reload (persona 1, full)

Reloaded at 2 of 6 messages sorted, mid-way through the scored Defend round. The game had **warned** on the inbox start screen: "Closing or reloading before the end restarts this round from the first message." That is exactly what happened — on resume, the earlier stages stayed done (Brief, Research, Campaign and Your inbox all persisted; the five research facts and `run_the_campaign` were intact server-side), and only the two triage verdicts in the current round were lost, so I re-did the six messages from the top. Progress loss was limited, expected and signposted. Not filed as a finding (and per brief the resume overlay / mission-brief popup are not findings).

---

## Five best lines

1. "A different password for every account, not a word off the website, kept in a manager, breaks both: the spray has nothing predictable to try, and a stolen pair opens nothing else." (debrief — the single habit, tied straight to the two attacks)
2. "Each candidate is tried once on every account, so no single account is tried often enough to lock." (campaign — the clearest one-line account of why spraying evades lockout)
3. "A real breach check uses only your email address, never your password." (msg5 feedback — crisp, memorable rule)
4. "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you." (debrief — the transferable habit)
5. "Both halves matter: catching a phish stops the attack, and trusting the real ones keeps work moving and leaves your security team time for the reports that count." (debrief — rare and valuable: teaches that over-reporting has a cost too)

## Five worst lines

1. "Stop the test" (campaign button) — the *completion* action, but the wording reads as abort/cancel; it's the only way forward and isn't labelled as such. See F1.
2. "Not a flag here: It's pushing me to hurry. It wasn't one of this message's tells." (msg2 feedback) — contradicts the same screen's model answer, which says the 24-hour deletion threat "is only there to rush you." See F2.
3. "Authorised exercise at Merrin & Sallow Architects, a fictional company. In scope: a staff list and word list built from the practice's public pages, and the security alerts you handle afterwards." (kiosk Brief) — restates the scope the paragraph just above it already gave; reads as stacked boilerplate.
4. "An alert about a sign-in; genuine ones send you to the real site, fakes to a look-alike." (inbox warm-up) — hands the player the exact discriminator before they read a single message, which flattens the decisions that follow.
5. "Sharp: you caught the phish and knew why" (result heading) — the terse "Sharp:" prefix reads more gamified than the measured, grown-up tone of the rest of the copy.

## Scores (1–5)

| Axis | Score | Note |
| --- | --- | --- |
| Fun | 3 | Competent triage quiz with a satisfying interactive campaign demo; not especially playful. |
| Pacing | 4 | Short and brisk; stages are well-sized. Only drag is the campaign-end confusion. |
| Clarity of goals | 4 | Ama + staged kiosk make the goal explicit throughout; knocked by the unlabelled campaign completion step. |
| Openness of decisions | 3 | Verdicts are real, but the look-alike-domain tell is pre-taught and "Report when unsure is free", so the four-way choice collapses to looks-off/looks-clean. |
| Teaching | 5 | Strong: clear spraying-vs-stuffing split, fair non-blaming feedback at any score, concrete "on Monday" actions and a report-route box. |

## Times (estimated at a real reading pace)

| Run | Estimate | Target |
| --- | --- | --- |
| Full, persona 1 (careful) | ~15–16 min (brief+Ama 1.5, research 3, campaign 2.5, inbox warm-up 1.5, triage+feedback 5, debrief 2) | ~15 min ✓ |
| Full, persona 2 (rushed, skims) | ~7–8 min | n/a |
| Defend-only, persona 1 | ~8 min (brief 1, triage 5, debrief 2) | ~8 min ✓ |

## Severity table

| # | Severity | Content/Engine | Finding | Repro |
| --- | --- | --- | --- | --- |
| F1 | major | content | Campaign stage has no "Continue/Done" control; after "Run them all" only "Stop the test" advances it, but the label reads as abort. Pressing **Close** silently discards the whole guesser run and reopening resets to "20 to go" with no warning — unlike the Defend round, which warns before a reset. A cautious player can stall here (~1–2 min) or lose the run. | game 4994, full-session.jsonl around the campaign stage; reproduced reopen-resets behaviour |
| F2 | minor | content | msg2 feedback marks the ticked flag "It's pushing me to hurry" as "Not a flag here," while the same screen's model answer says the 24-hour deletion threat "is only there to rush you." Mixed message about whether urgency counts. No score impact. | game 4994/5005 msg2 feedback |
| F3 | minor | content | In-game `score` global = 100 for the struggling player whose triage round scored 20%; mission completion score doesn't reflect triage performance (may be intended). | verify-run game 5005 vs 20% result screen |
| F4 | minor | content | The flag taxonomy has close, overlapping options (e.g. "look-alike domain" vs "sender's address doesn't match who it says it is"); a plausibly-true extra tick is marked "Not a flag here" for msg2 and msg4. No penalty, but a non-technical player may find the distinction opaque. | game 4994 msg2 & msg4 feedback |
| F5 | nit | content | Scope/disclaimer sentence in the kiosk Brief duplicates the scope already stated in the paragraph above it. | game 4994 kiosk Brief text |

**Counts: 0 blockers, 1 major, 3 minors, 1 nit.**

No softlocks, no crashes, no unreachable debrief/credits. The episode completed cleanly on all three runs, at both 100% and 20%, and the defend-only cut is coherent on its own.
