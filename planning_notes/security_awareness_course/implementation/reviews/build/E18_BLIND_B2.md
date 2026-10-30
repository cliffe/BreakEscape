# E18 "Credential attacks at scale" — Blind playtest B2

Second blind run. Episode: `awareness_e18_credential_attacks_at_scale` (full) and `_defend` (defend-only). Tester read only the playtest skill, AGENTS.md Housekeeping, and what a player sees on screen. Nothing in `scenarios/`, no reviews, no earlier reports.

- Run type: blind. Questions answered: plumbing + unexpected-behaviour + "does it teach / read fairly".
- Server: keyless :3001, headless (machine load ~18, so timings are estimated at a human reading pace, not measured wall-clock).
- Games: full P1 = 5141, full P2 = 5150, defend-only = 5151.
- Session logs (kept out of the repo, in the session scratchpad):
  - `scratchpad/aw2/blind-e18-b2/p1-session.jsonl` (first attempt, stuck on reload — see note) and `p1-session-b.jsonl` (resumed run)
  - `scratchpad/aw2/blind-e18-b2/p2-session.jsonl`
  - `scratchpad/aw2/blind-e18-b2/defend-session.jsonl`
- No screenshots taken (no step failed where a screenshot would explain more than the state did).

## verify-run.rb output

Persona 1 full (game 5141):
```
unlocked rooms  1: training_room
inventory       1: Notepad
globals set     7: engine_tutorial_declined, episode_e18_credential_attacks_at_scale_defend_done,
                   episode_e18_credential_attacks_at_scale_defend_pass, guess_e18_landed,
                   se_intel_ms_email_pattern, se_intel_ms_projects, se_intel_ms_team_roster
tasks           2 in objectivesState, 2 completed
  run_the_campaign     "completed"  at 2026-10-30T00:01:08Z
  handle_the_alerts    "completed"  at 2026-10-30T00:09:41Z
score 100   social scenario true
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
```

Persona 2 full (game 5150):
```
globals set     4: engine_tutorial_declined, episode_e18_credential_attacks_at_scale_defend_done,
                   episode_e18_credential_attacks_at_scale_defend_pass, guess_e18_landed
tasks           2 in objectivesState, 2 completed
  run_the_campaign     "completed"  at 2026-10-30T00:11:35Z
  handle_the_alerts    "completed"  at 2026-10-30T00:13:13Z
score 100   social scenario true
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
```
(The record's `score 100` is objective-completion — both tasks done; it is NOT the defend round score, which was 20% for P2. Two different numbers, worth keeping distinct.)

Defend-only (game 5151):
```
globals set     3: engine_tutorial_declined, episode_e18_credential_attacks_at_scale_defend_defend_done,
                   episode_e18_credential_attacks_at_scale_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  handle_the_alerts    "completed"  at 2026-10-30T00:16:20Z
score 100   social scenario true
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

## Earned-secrets table

This episode has no PINs, keys, codes or VM flags. The only "secrets" are the OSINT facts the red-team half uses, and they are gathered in-game.

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Staff list + email pattern + a project word | (OSINT pins) | Merrin & Sallow website (Our people, Contact, Projects) and a Friendface post, inside the kiosk's Research browser | P1 research stage | yes |
| VM flags | — | none exist in this episode | — | n/a |

No rows marked "no". The campaign and defend stages are both fully exercisable in standalone; nothing in this episode depends on a VM.

---

## Timeline and what I thought the goal was

### Persona 1 "do your best" (full episode)

| Point | What I thought the goal was |
| --- | --- |
| Spawn, two tasks `run_the_campaign` / `handle_the_alerts` | Unclear — "run the campaign" sounded like I was the attacker; talked to Ama to find out |
| After Ama | Clear: play the red team on a safe copy (gather staff, build a word list, spray), then defend my own inbox; only the defend half is scored |
| Kiosk Brief | Confirmed the above; stage list Brief/Research/Campaign/Your inbox/Defend/Debrief made the shape obvious |
| Research | Gather 5 useful facts from the practice's public pages |
| Campaign | Watch one password sprayed once across everyone, plus a breach list stuffed across services |
| Flip / Your inbox | Now I'm the target; alerts arriving, some fake |
| Defend | Sort 6 messages: Trust / Report / Delete / Verify, then tick the tells |
| Debrief | Recap of spraying + stuffing, the one habit, what to do Monday |

Reload (persona 1): done at the flip transition, between Campaign and the inbox. After reload the game resumed at exactly that transition; the Brief, Research and Campaign stages stayed `done`, `run_the_campaign` stayed completed, and only `handle_the_alerts` remained open. No progress lost. (The player sprite respawned at the room entrance, which is cosmetic.)

### Persona 2 "struggling / rushed"

Skipped Ama, rushed to the kiosk. Closed the research browser with zero pins (it let me). Ran the campaign straight through. In Defend, trusted every message that looked official and ticked no tells. Result 20%: trusted all 3 phish, got the 3 genuine ones right. The per-message and debrief feedback explained each miss without blame (see below). Episode still completed.

### Defend-only (persona 1)

Ama's one-line intro and the kiosk Brief both set the context standalone ("Someone has run a password-guessing campaign across the whole practice, and now a wave of alerts is arriving"). The same 6 messages, same mechanics. Made all 6 correct calls, scored 100%. The debrief still teaches spraying and credential stuffing, so a player who never saw the red-team half still learns what the attack was. It makes sense on its own.

## "Didn't know what to do" moments

- Persona 1, at spawn: "run the campaign" read as if I were being asked to attack, which was briefly disorienting. Talking to Ama (the obvious nearby NPC) resolved it in one conversation, ~15 s. Not a stuck moment in practice — the NPC is right there and the task name is the only ambiguous bit.
- Research stage: clicking an individual person card returns "Nothing here you can use", so it took two or three clicks to learn that the *facts* to pin are the summary line, the email-pattern line and the project/post lines, not the person cards. ~30 s of trial. Mild, self-correcting.
- No stuck moment lasted minutes. No point where a player would be lost with no in-game way forward.

## Decisions — arguable, or given away?

The six defend decisions are the real decisions. Each has a defensible "right" call, and the episode accepts more than one safe answer (Report or Verify on a phish; Trust or "go to the site yourself" on a genuine one), which keeps them from feeling like a single forced click.

- The answer is "given away" only in the sense the teaching intends: the tells are in the message text (look-alike domain, "unlock through this link", "type your password"), and learning to read those tells is the point. There were no colour cues steering the answer, and no button was pre-highlighted.
- Nice nuance that stops the decisions being purely mechanical: on the fake lockout, ticking "It's pushing me to hurry" was marked "Not a flag here — the look-alike address and the unlock-through-a-link are what mark this one as fake, not the hurry by itself." So the episode distinguishes a real tell from a plausible-but-weak one.

## What I learned (in my own words)

Attackers don't crack one person; they take everyone's email addresses and a few words off the company website, then try one easy password (a project name, a season + year) once against every account, so nothing locks out. Separately they take password lists leaked from other sites and try them at work — reuse is what lets them in. The fix is one habit: a different password for every account, none of them a word off the website, kept in a manager. For the alerts afterwards: a genuine notice sends you to the real site the way you already reach it and never asks you to unlock or "review" through its link, and nothing legitimate asks you to type your password to "check" it. When in doubt, verify through a route you already trust, and reporting is always safe.

## Five best lines

1. "Attackers rarely pick one person and crack them. They scoop up everyone's names and a few words off the website, then try one password across the lot, so nothing locks." — the whole of spraying in two sentences.
2. "A different password for every account, not a word off the website, kept in a manager, breaks both: the spray has nothing predictable to try, and a stolen pair opens nothing else." — one habit, cause and effect.
3. "Nothing genuine asks for your password to tell you whether it has leaked. A real breach check uses only your email address, never your password." — exact, memorable rule.
4. "The 24-hour deletion deadline is there to rush you, and distrusting it is fair. What marks this one as fake, though, is the look-alike address and the unlock-through-a-link, not the hurry by itself." — teaches which tell actually counts.
5. "This one was built to look right. Here is what to look for next time." — the failure feedback, non-blaming and forward-looking.

(Honourable mention: "Reporting when you're unsure is always fine and never marked down.")

## Five worst lines

1. "A word you could not add: you have not found the fact it needs." (shown 2–3 times in the guesser) — reads as a system placeholder, not a sentence, and never says *which* fact, so a non-technical player can't act on it.
2. "A pass you could not run: the word or the staff list is still missing." — same opacity; "a pass" is jargon for a non-technical reader.
3. "The address list could not be built: half of it is still missing." (zero-research campaign) — "half" is odd when the player pinned nothing at all.
4. "0 of 0 accounts opened" / "did not work" — reads as a confusing double negative in the zero-research campaign.
5. Research prompt: "you need five useful facts before you close the browser" — overstates a requirement that isn't enforced (see F1).

## Scores (1–5)

| Dimension | Score | Note |
| --- | --- | --- |
| Fun | 4 | The guesser animation and the inbox-sorting loop are engaging for a training piece |
| Pacing | 4 | Brisk, no dead time; step-through is optional |
| Clarity of goals | 4 | Ama + Brief + stage list make the shape clear; only the "run_the_campaign" task name and the "5 facts" wording are slightly off |
| Openness of decisions | 4 | Genuinely arguable, multiple safe answers accepted; tells are discoverable from the text, as intended |
| Teaching | 5 | Concepts explained, consequences shown, non-blaming, concrete Monday actions, and it holds up in defend-only |

## Times (estimated, human reading pace)

- Persona 1 full: ~16–17 min (target ~15). The red-team half carries most of the reading.
- Persona 2 full (rushed): ~10–12 min — skips reading but hits more failure feedback.
- Defend-only: ~8–9 min (target ~8).

Measured wall-clock is not representative (headless on a loaded machine, plus a reload incident on P1).

## Findings

| # | Severity | Content/Engine | Finding | Evidence |
| --- | --- | --- | --- | --- |
| F1 | minor | content | Research stage says "you need five useful facts before you close the browser", but closing the browser with **zero** pins still completes Research and advances. A rushed player skips the OSINT entirely. (The campaign then degrades gracefully — "0 of 0 accounts opened", only the season+year word collected, breach-stuffing still lands — so the teaching survives, but the wording promises a gate that isn't there.) | p2-session.jsonl, research stage: opened browser, clicked Close with no pins, stage = `osint done` |
| F2 | minor | content | The guesser's "could not add / could not run / address list half missing" lines are opaque to a non-technical player: they don't name the missing fact or point back to what to pin, and "half" is wrong when nothing was found. | p2 campaign getState (zero-research run) |
| F3 | nit | content | Defend-only "Confirm" with no tell ticked shows the verdict and score, then nudges "Tick what made you decide… Then Confirm again" while also offering "Next message". "Then Confirm again" reads as mandatory, but ticking is optional and a player can proceed. | p2-session.jsonl, msg 1 confirm with no tick |
| F4 | nit | content | Defend-only mission writes globals with a doubled suffix: `episode_e18_credential_attacks_at_scale_defend_defend_done` / `_defend_pass`. Internal only, not player-facing, but likely unintended. | verify-run 5151 |
| F5 | nit | content | `episode_..._defend_pass` is set even on a 20% round (persona 2). Completion-based, which is probably right for awareness training, but flagging in case "pass" is meant to gate on score somewhere downstream. | verify-run 5150 (20% round) vs globals |

Counts: **0 blockers, 0 majors, 2 minors, 3 nits.**

### Boundary of what this run proves
No "no" rows in the earned-secrets table. The full episode, the reload-resume, and the defend-only variant were all played to completion with the server's own record confirming it. Persona 2 reached and exercised all three phish failure branches and the per-message/debrief feedback. Nothing in this episode is gated on a VM, so there is no unproven downstream.

### Note on the P1 reload incident (not a scenario finding)
My first attempt to drive the reload via `bootstrap … "resume":"resume"` hit the documented harness gotcha (bootstrap loops on the resume overlay). I killed and restarted the session on the same game; state had been synced, so I resumed cleanly and confirmed no progress was lost. This is a harness-driving note, not an episode defect, and the Mission Brief / "Resume session?" overlays are excluded from findings per the brief.
