# Playtest P5: E1 invoice fraud, E2 CV lures, E3 helpdesk reset, E4 exec whaling, plus finance and helpdesk/HR checks and an E1 defend-only shell (re-play after dbcb43f56, f89966e72, 34aa39495, a8caac8e0, 7a69e4254, bcafab78d, 4501b7c26, 1c8106fd1)

Date 2026-10-23. Keyless server :3001 only (:3000 untouched, no servers started or stopped, no other process killed, only my own sessions stopped), headless Chromium, Node 24, one browser at a time, a fresh game per run. TTS 503 as expected. No game files edited. The only state I changed outside the browser was the shared demo user's saved avatar (`PlayerPreference` id 1), set per run through `bin/rails runner` so each game loaded with a chosen, non-hooded avatar; I put it back to `male_hacker_hood_v2` (the original value) at the end. `verify-run.rb` printed `VERDICT: progress recorded` for every full game I ended through `end.sh` (2 tasks for the full episodes, 1 for the defend-only shell and the check forms).

Questions answered: plumbing and learner experience, and whether the new features read well and are correct. Not a solvability run (no PINs, keys or VM flags).

Personas. Careful: researches, ticks what is wrong, makes the sound verdict. Hurried: thin or no research, weak pretext, a send that does not land, a refused E3 call, wrong verdicts (Report on a genuine item, Trust on a phish email, Comply on a genuine caller, Approve on the overnight prompt, Delete or Verify on real items), Close mid-round.

## Runs, avatar and timing

Logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/p5/<tag>.jsonl`. Screenshots I kept are in `P5_screenshots/` (files prefixed `p5_`).

| Run | Tag | Game | Avatar | What I did | Driver time |
| --- | --- | --- | --- | --- | --- |
| E1 a | e1a | 4209 | female_office_worker_v2 | careful: all research, calm "when you have a moment" pretext, landed, 3 phish reported, 3 real trusted, 98% | 179 s |
| E1 b | e1b | 4212 | male_office_worker_v2 | hurried: Derek only, "monthly statement" did not land, Report on the real invoice, Trust x2 on phish, Delete on a real PO, Close mid-round then Keep going, 25% | 117 s |
| E1 c | e1c | 4238 | female_blowse_v2 | pretext variant only (urgent "following up on invoice"), stopped at the flip | not timed |
| E1 defend-only | e1d, e1e | 4253, 4256 | female_security_guard_v2 | Report on a real item, Trust on the calm look-alike, Close mid-round (confirm), 50%; second run for the tally pill | 36 s, 16 s |
| E2 a | e2a | 4215 | female_telecom_v2 | careful: Fatima, Colin and Careers noted, CV docx landed, 93% | 105 s |
| E2 b | e2b | 4218 | male_telecom_v2 | hurried: Fatima only, "introduce myself" plus zip did not land, Close anyway mid-round and resume, Report/Delete on real items, Trust x2 on phish, 32% | 61 s |
| E2 c, d | e2c, e2d | 4243, 4245 | various | pretext variants only (apply plus zip did not land; apply plus CV plus urgent ask landed) | not timed |
| E3 a | e3a | 4220 | female_security_guard_v2 | careful research; I picked the "Head of Claims" line by mistake and the ask was refused (a real refused call); careful defend, 80% | 141 s |
| E3 b | e3b | 4222 | female_scientist_v2 | hurried: no research, pushy lines, call refused, Comply x2, Refuse on the impostor, Approve on the 02:14 prompt, 0% | 68 s |
| E3 c | e3c | 4225 | male_security_guard_v2 | winning call (name, manager, staff reference, reset), three pushes, defend with a false alarm and a Deny without a report, 63% | 96 s |
| E4 a | e4a | 4229 | female_office_worker_v2 | careful: events, bio and Tomas noted, calm "I'm away at" webmail email landed, 100% | 91 s |
| E4 b | e4b | 4235 | male_office_worker_v2 | hurried: diary request did not land, Report on real itinerary, Trust x2 on phish, Delete on the voicemail phish, 16% | 64 s |
| E4 c | e4c | 4242 | n/a | pretext variant only (urgent plus secrecy), stopped at the flip | not timed |
| E4 defend-only | e4d | 4267 | female_telecom_v2 | all correct with ticks (100%), then talked to the NPC twice | 70 s |
| Pre finance `ab` | pre | 4247 | male_office_worker_v2 | 10 items, Trust on the CEO phish, Report on a real payment-run note, Delete on the real payslip, Verify on the real audit item, 66% | 69 s |
| Post finance `ab` | post | 4251 | female_telecom_v2 | all right except Report on the real broker renewal, 97%; left through Close, not Finish | 50 s |
| Post helpdesk `ba` | ph, ph2 | 4264, 4265 | female_telecom_v2 | Comply on the printer call (read the review card in ph2) | not timed |
| Pre HR `ba` | hr | 4266 | n/a | one Report with the hurry tick, rest Trust (read the card) | not timed |

Timing method. "Driver time" is wall-clock from the game being created to the last command, so it includes my gaps between commands and none of the human reading time. It says nothing about how long a learner takes. The machine had a load average of 17 to 18 (P4 was 26 to 121). I did not recompute the reading estimates, so E3-T (about 4 minutes over target at P3) is still unmeasured.

Harness notes (mine, not the game's). Two of my E3 menu clicks ran twice because my output filter hid the result (the extra "Head of Claims" line in E3 a was real, see above). `Close anyway` on the confirm closes the whole kiosk, which is expected: interacting with the kiosk again resumes the same stage.

## Status of every P4 finding

| P4 item | Status | Evidence this round |
| --- | --- | --- |
| P4-1 printer call scores 70 and the note contradicts it | **fixed (70 kept, note reconciled)** | ph2 Ayaan, Comply: "This caller was genuine, but you did what they asked without checking... A printer job asks for nothing that a caller could misuse, and he's calling from his own desk extension, so there's little an impostor could gain here. A quick check of who you're speaking to is still the habit that catches the calls that do matter." Score 70. Reads consistently now. |
| P4-2 hurry tick "not a flag" on "today" messages | **fixed** | E4 a Wrenfield "pay by transfer today": "Caught: Unexpected urgency or pressure to act fast ('Pay the balance by bank transfer today' ...)". Pre HR "New starters: bank details needed today": "Caught: Unexpected urgency ('Needed today', 'before 5' ...)". |
| P4-3 trusting a phish email not capped | **fixed** | E1 b: two phish trusted, "2 answers let an attacker straight in (trusting a phish email). That costs 15 points off the round each", 25%, "Worth practising". E2 b: 32%. E4 b: 16%. Pre finance with one trust: "One answer let an attacker straight in ... costs 15 points", 66% "Getting there". No "Sharp" with a trusted phish. |
| P4-4 subjects appear before their evidence | **fixed** | E2 b, Careers unread: Subject "Quick note" (the WHO-114 subject only appears after the Careers note, E2 a). E4: subject "Quick one" under the diary pretext, "Contractor invoice to settle" under the contractor pretexts; the sent email carried the matching subject (E4 a, E4 c flip). E1 b "Quick note" as before. |
| P4-5 miss replies uneven | **fixed (none anywhere)** | E1 b, E2 b, E4 b: no reply arrives; inbox shows only "Red team lead". |
| P4-6 "What would have happened" under a safe refusal | **fixed** | E3 b Refuse: "Safe, but nobody was warned." then "What this caller was after: ...". Deny on the prompt: "What this one was after: ...". |
| P4-7 flip heading repeats its body | **fixed** | E2 b / E4 b / E1 b: heading "Nothing to replay this time", body "The defence is the same either way: next, ..." (no repeat). |
| P4-8 "-10 reset password" reads as a failure | **fixed** | E3 c after a successful reset: "Last change: -10 for asking (reset password)" under "ASK OK needs 0 or better, now at 20". |
| P4-9 "No contacts yet" with someone noted | **fixed** | E1 b: "Nobody to write to yet — find who to send it to first." |
| P4-10 Back to research reopens on the last page | **fixed** | E1 b: "Back to research" opens on brightwellfoods.example (Our team). Same in E4 b. |

Carried from P3/P4:

| Item | Status | Evidence |
| --- | --- | --- |
| N5 (E4 did-not-land reason) | **fixed** | E4 b: "No trip he can match this to, so a message out of the blue reads as odd rather than something she'd send while she's away." No payment mentioned. |
| N7 (Verify and Ring back read like misses) | **fixed** | E3 a: "Escalated or reported rather than just refused 2 of 3, and 1 more checked by another route". E1 b: "0 of 3, and 1 more checked by another route". |
| N9 (E3 card offers facts never found) | **partly fixed** | With no research the card now shows only "Honestly, skip the security questions..." and "nothing held yet" blanks. But the call menu still offers "The Head of Claims needs me back online for a hearing this morning." and "I'm away from my desk phone — can you just do it now, not a callback?" (P5-7). |
| N10 (call feedback names an absent tell) | **fixed** | E3 b: "-20 CALM ! Urgency. ... Dodging the checks. A callback on the number on file, or the security questions, is exactly what would catch this, so steering you past it is the tell." |
| N12 (two identical Gordon headings) | not fixed (trivial) | Both calls "Gordon McLeish, Claims (calling from a mobile)". |
| N18 ("Nobody is marked down" after a perfect score) | **fixed** | E4 defend-only 100%: no no-blame line in the debrief. It appears only after misses (but see P5-5). |
| N20 ("no good reason" is "not a flag" on a secret payment) | not fixed (trivial) | E1 a Ravinder: "Not a flag here: There's no good reason I'd get this. It wasn't one of this message's tells." |
| D1 (learner shown as a hooded figure) | **fixed for a chosen avatar** | Map sprite and bottom-left HUD portrait follow the saved choice (seen for female_office_worker_v2 and male_office_worker_v2; the other avatars checked through `window.breakEscapeConfig.playerSprite`). A learner who has never chosen still gets the hooded default. |
| E3-11 (MFA has no decision) | unchanged | E3 c: three pushes, then "The target tapped Approve. The attacker is now signed in — this is MFA fatigue." |
| E3-T (E3 length) | unchanged, unmeasured | See the timing note. |
| E4 N2 (only the webmail address offered) | not re-checked | I picked "inboxly" by text and did not list the options. |
| t1 (round score vs persisted) | by design | Every run showed 0 to 100% on screen and `score 100` in verify-run. |
| t3 (converse repeats the welcome line) | **not reproduced** | E4 defend-only, Thandiwe, twice after the end card: "That's everything cleared, thanks. When it's money and it's in a hurry, ring her on the number you already have, or ask Yasmin." Same line both times, which is not the welcome line. |

Counts of P4 items: 10 of 10 P4 items fixed. Carried: N5, N7, N10, N18, D1, t3 fixed; N9 partly; N12, N20 not fixed (trivial); E3-11, E3-T unchanged; E4 N2 not re-checked; t1 by design.

## New features: do they read well and are they correct?

**Training room (props, logo, lighting).** Good. Each room has its own logo and palette: Brightwell Foods (beige carpet, water cooler), Tarrowby Logistics (grey concrete, cones, coffee machine, hi-vis), Quayholt Insurance (blue carpet, plant, help-desk workstation, LOCK sign), Merrin & Sallow (warm grey, plan chest, leather sofa, drafting chairs). No hearts or combat HUD. Evenly lit, no dark patches. Everything squares to the walls. Screenshot `P5_screenshots/p5_training_rooms_e1_e4.png`. The kiosk, the exit sign and the fire kit match in all four.

**Chosen avatar.** Map sprite and the HUD portrait bottom-left follow the choice (office worker, both sexes; checked by config for the rest). I could not see it "in chats": the NPC chats in these episodes are NPC monologues with no learner line (Adaeze: "Welcome to the Brightwell exercise...", Thandiwe's closing line), so there is nowhere for a player portrait to appear. The E3 phone chat shows Leila with a generic 👤 tile (`p5_e3_phone_chat.png`), and no learner image. Not a fault, but aw9's talk-portrait half is unobservable in E1-E4 (P5-15).

**Flip line follows the chosen pretext.** All correct and distinct:

- E1, calm "When you have a moment... No rush today": "The 'no rush today' is what let it through. Derek's name, the real invoice number and a quiet note to update the payee before the next run read as ordinary housekeeping".
- E1, urgent "Following up on invoice INV-2217...": "With the three o'clock payment run due, the team read it quickly. Derek's name was on it, the invoice number was real, and it asked them to change the payee before releasing payment".
- E1, "monthly statement" (did not land): "Nothing to replay this time / The defence is the same either way".
- E2, CV plus calm ask (landed, no tells): "It opened like any real application, with nothing off to pick up on."
- E2, CV plus "closing date today" ask (landed, urgency): "Fatima opened it between two interviews with forty applications still unread. It named the warehouse vacancy she was recruiting for and carried a CV, so it read as one more real applicant and she opened the attachment."
- E4, calm "I'm away at the Lisbon Design Forum... nothing urgent": "No deadline and no secrecy, just an invoice to settle from the practice account this week. That ease is what made it slip by".
- E4, urgent plus secrecy "about to board": "the rush to catch the slot plus 'keep it between us' left Tomás no room to check, so he opened the payment form."

**"The habit to keep" box.** Present in every debrief (E1-E4 and defend-only), one rule of thumb, with the "On Monday:" card per episode: "When a message pressures you to move money, grant access or read back a code, stop and check it using contact details you already have, rather than the ones the message gives you. Taking a minute to confirm is always a fair thing to do." Reads fine, though in E2 (CVs, nothing pressures anyone) the rule is generic and the specific advice is in the Monday card. Fine.

**"How to report here" box under the Monday card.** Present, dashed border, each Monday card ends "report... using the route in the box below" and the box says "Find out today how your organisation wants suspicious emails, calls and texts reported: ask your IT or security team... Until you know, tell IT or your manager straight away." Screenshot `p5_e1_debrief_boxes.png`. Correct and readable.

**Team tally pill and debrief line.** The pill ("Phish stopped for the team: N") is on the sort screen. It went 0 to 1 after the first report, stayed at 1 after a Report on a real item (correct: a false alarm did not count), and went to 2 after the second phish report. The debrief line matches: "Your reports and checks this round kept 3 phish away from the rest of your team." (E1 a), "kept one phish" (E1 d), "kept 2 phish" (E1 e). Verify on a phish also counts (E1 e: pill 1 after Verify), see P5-11. Not shown when nothing was reported (E4 b).

**Critical-miss line on a trusted phish email.** Present on the result: "2 answers let an attacker straight in (trusting a phish email). That costs 15 points off the round each, on top of the item itself." (E1 b, E2 b, E4 b), singular with one ("One answer let an attacker straight in ... costs 15 points off the round, on top of the item itself.", pre finance, E1 d). Call version: "(doing what an impostor asked on a call, or approving a sign-in you didn't start)". The per-message card does not repeat it (only "Not this time. This one was a phish." and "Score for this message: 0 of 100"), which is fine.

**Feedback on genuine items (trusted list, false-alarm line and cost).** Present on the result, the debrief and the check screens:

- Trusted list: "You trusted the real ones: 'Invoice INV-2217: September cartons', 'PO-4471 raised: Pennine Oat Mills' and 'Marsh End Eggs: new bank details (confirmed by phone)'." (E1 a).
- False alarm: "2 real ones were treated as phish: 'Invoice INV-2217: September cartons' (Report) and 'PO-4471 raised: Pennine Oat Mills' (Delete). Each card showed what made it safe." Debrief gives one line per item with "What made it safe: ...".
- Cost: "Reporting when you're unsure is never wrong, but a report on a real message has a cost: a colleague has to stop and check it, and the real request waits." and the delete version "a deleted or refused one can mean a missed payment or a colleague left waiting."
- Why both halves: "Both halves matter: catching a phish stops the attack, and trusting the real ones keeps work moving and leaves your security team time for the reports that count."
- No index or rate is shown for the genuine items, as requested. Pre/post results list each real item with "What made it safe" for the flagged ones.

Wording and counting problems are in P5-2, P5-3 and P5-4.

**Confirm on Close mid-round.** E1 b, E1 d, E2 b: "Close now and the answer you've given so far won't be kept. The round starts again from the first item next time." with "Keep going" and "Close anyway". Keep going returns to the same sort screen with the verdict intact. Close anyway closes the kiosk; reopening it resumes at the Defend stage with "0 of 6 sorted".

**"Back to research".** Works from the Write stage (E1 b, E4 b) and now opens on the home page (P4-10).

## New findings

Severity: blocker (cannot finish or teaches the wrong thing), major (undermines what the episode measures or teaches), minor (reads wrong, unfair or confusing), trivial.

### Blockers and majors

None found.

### Minor

**P5-1. The Finish button on the result screen of E1-E4 (and defend-only) is below the fold of a scroll area with no cue, so it is invisible.** In `e1a`, `e1b`, `e2a`, the result step shows score, grid and weakest skill, and no way forward. `.tri-finish` sits at y 645 to 702 inside `.tri-panel.tri-result` (146 to 628, `overflow: auto`, no visible scrollbar), so `document.elementFromPoint` at its centre returns the game container and it cannot be seen or clicked without scrolling the panel. Screenshots: `p5_e1_result_finish_hidden.png` (nothing at the bottom) against `p5_check_result_finish_scrolled.png` (the check form's taller panel, Finish visible after a scroll). The top-right Close does advance to the debrief (E2 a) and, on the check forms, finishes the task (post finance, left with Close: `tasks_completed 1`), so nobody is stuck. Fix: pin `.tri-result-bar` below the scrolling area (flex child outside the panel), or add a "Next: Finish" cue and a visible scrollbar.

**P5-2. "You trusted..." names items the learner verified or rang back.** E1 b: I chose Verify on "Marsh End Eggs: new bank details (confirmed by phone)" and the result says "You trusted this real one: 'Marsh End Eggs...'". Pre finance: Verify on "Year-end audit: request list" is listed under "You trusted these real ones". E3 a: Ring back on the real Gordon gives "You trusted the real ones: 'Gordon McLeish, Claims (calling from a mobile) · Incoming call'". The list is built from every full-score verdict in `TRUST_VERDICTS`. Fix: "You trusted or checked the real ones:", or two lines.

**P5-3. The result grid and the false-alarm sentence disagree about the same items.** E2 b: "Real mail handled right 3 of 4" next to "3 real ones were treated as phish: ... (Report), ... (Delete) and ... (Report)". E1 b: "2 of 3" next to "2 real ones were treated as phish". E3 c: "Real callers handled right 1 of 1" next to "One real one was treated as a phish: ... (Escalate)". Reporting counts as handled right (scored 100, "never wrong") but is also called "treated as a phish". Fix: count only Trust, Verify and Ring back in "handled right", or reword the sentence to "flagged though real" and split the grid ("trusted or checked 1, reported 2, deleted 1").

**P5-4. The briefs say a false alarm costs nothing, and the result says it has a cost.** Briefs: "Reporting a real message never costs you anything." (E1 defend-only, E2), "Ringing back a real caller never costs you anything." (E3), "Checking or reporting something real never costs you anything." (E4), "Reporting a real message never costs you anything." (pre/post). Result: "a report on a real message has a cost: a colleague has to stop and check it, and the real request waits." Fix: the brief should say "is never wrong" (the result's own phrase) or "costs you no points".

**P5-5. The no-blame closing line contradicts the score above it.** E1 b (25%, two trusted phish at 0 of 100, "15 points off"): "Nobody is marked down for a miss here." E2 b (32%): "No one is keeping score against you here." E4 b (16%): "There's no mark against you for a miss here." E3 a (80%): "Nothing here counts against you." The screen has just shown "That costs 15 points off the round each". Fix: "No one else sees this score" or "This round is for practice, not a mark on you."

**P5-6. "Thanks for reporting. That warns everyone else." is shown on genuine items.** E1 b, Report on the real Harlow invoice: "Thanks for reporting. That warns everyone else." then "Reported, and that's never wrong. For next time, here is why this one was fine." Same on E2 b (real shortlist) and E4 b (real itinerary). Reporting a real message warns no one of a phish. Fix: show the "warns everyone else" line only on phish items; for real ones say "Thanks. A colleague will check it."

**P5-7. The E3 call menu offers lines the prep card hides.** E3 b (nothing researched): the card shows only "Honestly, skip the security questions...", with every blank "nothing held yet", yet the call lists "1. The Head of Claims needs me back online for a hearing this morning." and "2. I'm away from my desk phone — can you just do it now, not a callback?" (the data note in f89966e72 says the lines are gated; only the card is). Fix: gate the call lines on the same held facts, or show them on the card.

**P5-8. The red-flag meter misses the secrecy tell in the E4 secrecy pretext.** E4 c, pretext "I'm about to board... Keep it between us for now, no need to trouble finance": the meter says "Red flags 1: Unexpected urgency or pressure to act fast". The flip line cites "'keep it between us'" and the defend card for the same wording lists "Asked to keep it secret". Fix: add the secrecy flag to the meter for that pretext.

**P5-9. The E1 defend-only brief says five messages and the inbox has six.** E1 defend-only (`e1d`): "You're covering the payments inbox this afternoon, and five messages are waiting." The sort screen shows "0 of 6 sorted". Fix: "six".

### Trivial

- **P5-10. "needs 0 or better, now at -5" when the panel shows Influence 5.** E3 a: after +10 +10 +10 -25 the panel read 5, then the refusal said "now at -5" because the -10 for asking is applied first. The panel's "Last change: -10 for asking" appears afterwards. Say "now at -5 after the cost of asking".
- **P5-11. Verify counts toward "Phish stopped for the team".** E1 e: Verify on a phish took the pill to 1 and the debrief says "reports and checks", but nobody else is warned by a Verify. Label or exclude.
- **P5-12. E3 result titles.** The result lists "Gordon McLeish, Claims (calling from a mobile) · Incoming call" (with the suffix), the debrief lists it without, and both Gordon calls share the heading (N12), so "You trusted the real ones: 'Gordon McLeish...'" cannot tell which Gordon.
- **P5-13. Stale kiosk text.** After the pre check is done, examining the kiosk still says "A touch-screen kiosk with ten messages from a payments inbox, ready for the first check." Same for E1: "...The message is written and the payments inbox is all dealt with." is fine, only the check kiosks are stale.
- **P5-14. "Not a flag here: Someone senior is invoked to skip a check" on the E4 managing-partner email.** E4 a, the Catherine webmail email. The sender is the senior person, so it is arguable, but the same tick is credited elsewhere ("Josh... Ngozi's signed it off"). Pick one reading.
- **P5-15. Avatar in chats not observable.** NPC chats in E1-E4 have no learner line; the E3 phone chat shows a generic 👤 for Leila. Nothing to fix unless a learner line is added.

## What worked

- Every P4 fix held in the real UI, and the new engine features (confirm on Close, tally pill, habit box, report box, critical-miss line, genuine-item feedback) all behave as described.
- Choice-aware flip lines are accurate for all pretexts tried, including the did-not-land cases.
- The training rooms look like four different workplaces and read as one family.
- Pre/post: "Item by item", the review step, "No baseline" on a post with no pre, and the false-alarm lines on the check results are consistent.
- The E1 mirror pair works: the calm Pennine look-alike ("no rush at all") is reportable on the domain hyphen alone, and its card explains why a calm tone is the tell.

## Counts

New findings this round: **0 blockers, 0 majors, 9 minors (P5-1 to P5-9), 6 trivials (P5-10 to P5-15)**.

P4 items: 10 of 10 fixed. Still open from earlier rounds: N9 (partly, folded into P5-7), N12 and N20 (trivial), E3-11 (no MFA decision), E3-T (length, unmeasured), E4 N2 (not re-checked).

## Limits

- No audio (TTS 503 on :3001): voicemails judged from transcripts.
- Not played this round: E5 to E7, the executive, general and mobile check pairs, the HR post check, a mid-episode reload. The finance pair and the helpdesk and HR checks were each played once (the finance pair in separate games, so "No baseline" was expected).
- Avatar: the map sprite and HUD portrait were seen on screen for two sprites; the others were confirmed through `window.breakEscapeConfig.playerSprite` only.
- Driver times include my gaps and the machine was loaded (load average 17 to 18). They are not learner times, and the reading estimates were not recomputed.
- The E1 b Pennine and the E2 b first-item review cards were read from `document.body.innerText`, not screenshots.
