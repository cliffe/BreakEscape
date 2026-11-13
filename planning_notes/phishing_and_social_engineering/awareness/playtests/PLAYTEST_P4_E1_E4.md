# Playtest P4: E1 invoice fraud, E2 CV lures, E3 helpdesk reset, E4 exec whaling, plus the helpdesk and HR check pairs (re-play after 0322276e0, b7881f594, 56e1e2b3c, 8fb2adfd7)

Date 2026-10-23. Keyless server :3001 only (:3000 untouched, no servers started or stopped, no other process killed), headless Chromium, Node 24, one browser at a time, a fresh game per run. No game files edited, no console state edits (the only `eval` calls read page text or watched a button for the "Saving…" check). `verify-run.rb` printed `VERDICT: progress recorded` for every game (full and defend episodes: 2 tasks completed for the full ones, 1 for defend-only and check forms; score 100 each, which is completion scoring, not the on-screen round score).

Questions answered: plumbing and learner experience (1 and 2 of the playtest skill). Not a solvability run: these episodes have no PINs, keys or VM flags, so the earned-secrets table is empty.

Personas. Careful: researches, ticks what is actually wrong, makes the sound verdict. Hurried: thin or no research, the weak pretext, a send that does not land, a refused E3 call, wrong verdicts (Trust on phish, Delete or Refuse on real items, Comply on a genuine caller, Approve on the overnight prompt). I read the P3 report first, so I knew where the P3 problems were.

## Runs and timing

Session logs (one JSON line per command): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/p4/<tag>.jsonl`.

| Run | Tag | Game | Persona and what I did | Driver time |
| --- | --- | --- | --- | --- |
| E1 a | e1a | 4026 | careful: Adaeze, Derek, invoice and Friendface noted, calm email landed, 5 right (97%) | 130 s |
| E1 b | e1b | 4028 | hurried: Derek only at first, "monthly statement" send did not land, Delete/Trust/Report/Verify/Trust (54%) | 127 s |
| E2 a | e2a | 4030 | careful: Fatima, Careers, Colin noted, CV docx landed, 97% | 134 s |
| E2 b | e2b | 4033 | hurried: Fatima only, "introduce myself" plus zip did not land, Trust on all (67%) | 101 s |
| E3 a | e3a | 4036 | careful: all research, calm winning call, 3 pushes, queue 97% | 182 s |
| E3 b | e3b | 4041 | hurried: no research, call refused, Refuse / Comply on genuine / Comply / Approve (0%) | 74 s |
| E4 a | e4a | 4043 | careful: events and bio noted, calm webmail email landed, 97% | 141 s |
| E4 b | e4b | 4049 | hurried: diary email did not land, Delete/Trust/Trust/Report/Trust (34%) | 107 s |
| Pre helpdesk `ba` | prehba | 4056 | all 10 items, slips: Trust on the "password resets" spoof, Comply on the genuine Niamh call, Approve on the 23:52 prompt (58%) | 120 s |
| Post helpdesk `ba` | posthba | 4061 | slips: Approve on the 02:14 prompt, Trust on the "MFA exemption list" spoof, Refuse on genuine Sofia, Comply on impostor Owen and genuine Ayaan (31%) | 87 s |
| Post helpdesk `ba` re-run | ph2 | 4068 | read the Ayaan review text only | n/a |
| Pre HR `ba` | prehrba | 4064 | one Delete on a real item, one Trust on the shortlist phish (83%) | 86 s |
| Post HR `ba` | posthrba | 4065 | one Trust on the passports phish (86%) | 71 s |
| Defend-only E4 | e4d | 4066 | Verify, Delete, Trust, Verify, Report (62%) | 44 s |

Timing method. "Driver time" is wall-clock from the game being created to the last command, so it includes my own gaps between commands and none of the human reading time. It says nothing about how long a learner takes. The machine was heavily loaded (load average about 26 at the start, 121 at the end), so even these figures are not representative. I did not recompute the P2/P3 reading estimates (unique on-screen lines of 25 characters or more at 200 wpm, 3 s per click, 30 s per decision). Carry-over from P3: E1 about 15 min, E2 about 15, E3 about 17 (target 13), E4 about 16. The E3 flip lines were trimmed in 0322276e0 and the E3 brief is otherwise unchanged, so E3 is probably still about 4 minutes over, but that is unmeasured.

Harness note, mine not the game's: my first `cl.sh` passed numeric controls as strings, so several early clicks in E1 b, E2 a/b, E3 a and E4 b missed (for example no notes taken, "No contacts yet"). I replayed the research each time before judging the game. Also, "Back to research" reopens the browser on the last page you visited, not on the home page, so index-based clicks land on the wrong page after a return (see P4-10).

## Status of each P3 finding

Quotes are on-screen text from this round.

| P3 item | Status | Evidence |
| --- | --- | --- |
| N1 (E2/E4 flip says "careful" after a send that did not land) | **fixed** | E2 b: "There's nothing of yours to replay from the other side this time." E4 b: same, no "careful". E1 b: "Your email didn't land this time, so there's nothing of yours to replay". E2 a (landed, no tells): "It got through, but there was nothing in it to pick apart this time". |
| N2 (calm ask scored as urgency) | **fixed** | E1 a: calm pretext plus "Can you confirm once the new details are saved?" gives "Red flags 0", and the flip lists no urgency tell. E4 a: "Drop me a line here once it's gone through." gives 0 and the flip lists none. |
| N3 (caller labels give the verdict away) | **fixed** | E3 queue: both Gordon calls labelled "Gordon", Josh's lines "Josh". Post helpdesk `ba`: "Sofia", "Owen", "Ayaan" for real and impostor alike. Every line in a call carries the claimed name. |
| N4 (E1 miss reply is meter text) | **fixed** | E1 b inbox: "Re: Quick note" from Adaeze, "Thanks, but I don't change payee details from an email. I'll ring Harlow on the number we already hold to check first." See P4-5 for a small mismatch. |
| N5 (did-not-land reasons do not match what was sent) | **half fixed** | E2 b: reason now "No vacancy she can match this to, so no reason to treat it as an application." and the "That feels rushed." advisory is gone. E4 b (diary request) still says "No trip he can match this to, so a rushed payment from the road reads as odd." Nothing was a payment. |
| N6 (either-tick groups listed twice in the debrief) | **fixed** | E1 a: "sender's address" plus "Link or sender domain" gave one "Caught: Sender address doesn't match…". E2 a: link plus look-alike gave one entry. E4 a and E4 defend-only: one entry. E1 b and E2 b debriefs list one "Look for" per tell. |
| N7 (Verify and Ring back read like misses in the stats) | **partly fixed** | A "Checked by another route: 2" line now appears. But E3 a (every call and the prompt right, 97%) still says "Reported 67% of the phish" and "Escalated or reported rather than just refused 2 of 3". Pre helpdesk: "Reported rather than just deleted 1 of 4" with two correct Ring backs. |
| N8 ("Not a flag here" repeats a sentence) | **fixed** | Every "Not a flag here" now reads "<tick>. It wasn't one of this message's tells." with no repeated reason (E2 a, E4 a, post HR). |
| N9 (E3 card offers facts never found) | **not fixed** | E3 b, nothing researched: card still offers "I'm at a conference, I won't be at my desk phone…" and "The Head of Claims needs me back online for a hearing this morning." The call then offers "1. The Head of Claims needs me back online…" and "2. I'm away from my desk phone — can you just do it now, not a callback?". With research, the full card (six facts) appears as designed. |
| N10 (call feedback names a tell the line did not contain) | **not fixed** | E3 b, "Honestly, skip the security questions, I really don't have time for this.": "-20 CALM ! Urgency. A rushed reset is the oldest pressure line on a service desk. Dodging the callback. The number on file is exactly what would catch this, so discouraging it is the tell." Nothing was said about a callback. |
| N11 (flip says "sounded rushed" after a calm call) | **fixed** | E3 a flip: "The caller had Gordon's name, team, manager and staff number, every answer right, so she reached for the reset." No "rushed". |
| N12 (two identical Gordon headings) | not fixed (trivial) | Queue list and review: "Gordon McLeish, Claims (calling from a mobile)" twice. |
| N13 (pre/post brief contradicts itself) | **fixed** | One sentence: "You'll see how you did at the end." The result screen has an "Item by item" list, for example "Reset my password and send it here · Report: right call". |
| N14 ("feedback after each message" on a call queue) | **fixed** | The brief now uses the noun ("after each call" pattern, `inbox-triage-minigame.js` line 380 builds it from the item kind). |
| N15 (E1 invoice number given free) | **fixed for E1** | E1 b, Derek noted, no invoice: Subject line blank in the composer; the pretext blanks need the invoice. See P4-4 for the same leak in E2 and E4. |
| N16 (genuine caller scores 100 on Comply) | **fixed** | E3 b: Comply on the real Gordon gave "This caller was genuine, but you did what they asked without checking. An impostor sounds just the same, so ring back on the number you hold first." and "Score for this message: 70 of 100". See P4-1 for the printer call. |
| N17 (one fatal miss barely moves the band) | **fixed for calls and prompts** | Pre helpdesk: Approve plus Comply gave 58% "Worth practising" and "One answer let an attacker straight in … That costs 15 points off the round each". Post: 31%. E3 b: 0%. Trusting a phish email is not capped (P4-3). |
| N18 ("Nobody is marked down" after a perfect score) | not reached | No 100% debrief this round (best was 97%). |
| N19 (look-alike wording "isn't a Brightwell one at all") | **fixed** | E1: "the address only looks like Brightwell's: it's brightwel1foods.example, a 1 in place of the l". |
| N20 ("no good reason" is "not a flag" on a secret payment request) | not fixed (trivial) | E1 a, Ravinder: "Not a flag here: There's no good reason I'd get this. It wasn't one of this message's tells." |
| N21 (hearts and combat HUD in the training room) | **fixed** | `P4_screenshots/e3_quayholt.png`: objectives panel and notes only, no hearts bar. |

Requested confirmations, one line each:

- Flip wording after a miss against a careful landing: both correct and distinct (N1).
- Calm ask not scored as urgency: confirmed (N2).
- Either-tick shown once: confirmed in E1, E2, E4 feedback and debriefs (N6).
- No meter text as a reply: confirmed. E1 gets an in-voice Adaeze reply, E3 b refusal reads "I'm going to stop there. I'll need to verify you before I do anything else." with the meter lines kept in the panel (N4).
- Comply on genuine scores 70 with its explanation: confirmed on a reset call (N16).
- Result grid agrees with item verdicts: checked on E1 b (Delete 70, Report 100, Verify 100 gives "Real mail handled right 2 of 3"), E3 b ("Real callers handled right 0 of 1" after Comply 70), pre/post helpdesk and HR (the "right call" and "worth another look" tags match the counts). No disagreement found.
- Header ticks behind "Show details": confirmed on the check forms (`headerPanel: collapsed`). On the Laptop swap email the tick list omits "The header checks failed or don't line up" and "The reply-to address differs from the From address" until Show details is opened, and says "Header checks are under 'Show details'. Go back and open them to tick a header tell." After opening, both appear. The episodes use `headerPanel: off`, so they never show it.
- "Saving…" on Finish: confirmed on all check forms and E4 defend-only. Watching the button with a MutationObserver after "See result": `Saving…` (disabled) for a fraction of a second, then `Finish` (enabled), on pre helpdesk, post helpdesk and post HR. The in-episode E1 to E4 rounds finish with no save state, which the code comment says is by design.
- Item-by-item list after a check: present on pre and post (Result step).
- "Both checks" wording on a post check without a pre: fixed. Post end card: "SECOND CHECK DONE … If you also sat the earlier check, the results are shown side by side." Result screen: "No baseline. There's no first check to compare with, so this round's result stands on its own."

Carried over from P2/P3:

| Item | Status | Evidence |
| --- | --- | --- |
| m3 (E2 flip has nothing to show for a careful email) | **fixed** | E2 a: "Nothing to replay this time. It got through, but there was nothing in it to pick apart this time, so there's nothing to replay." |
| t1 (round score vs persisted) | not fixed (by design) | E3 b showed 0%, `verify-run` score 100. |
| t2 (Verify/Report stat reads like a miss) | partly fixed | See N7. |
| t3 (converse repeats welcome line) | not re-tested | Not played this round. |
| E3-11 (MFA has no decision) | unchanged | E3 a: three pushes, then "The target tapped Approve. The attacker is now signed in — this is MFA fatigue." |
| E3-T (E3 length) | unchanged, unmeasured | See the timing note. |
| D1 (learner shown as a hooded figure) | not fixed | `P4_screenshots/e3_quayholt.png`: hooded sprite at the kiosk, hooded face as the player avatar bottom left. |
| E4 N2 (only the webmail address offered) | not fixed (trivial) | E4 a and b: the only address offered is catherine.merrin@lintbox.example. |

Counts: of the 21 P3 N items, 14 are fixed (N1, N2, N3, N4, N6, N8, N11, N13, N14, N15, N16, N17, N19, N21), 2 are partly fixed (N5, N7), 4 are not fixed (N9, N10 minor; N12, N20 trivial) and 1 was not reached (N18). Carried-over rows: m3 fixed, t1 by design, t2 partly, t3 not tested, E3-11 and E3-T unchanged, D1 and E4 N2 not fixed.

## New findings

Severity: blocker (cannot finish or teaches the wrong thing), major (undermines what the episode measures or teaches), minor (reads wrong, unfair or confusing), trivial.

### Blockers and majors

None found.

### Minor

**P4-1. A genuine printer call scores 70 for Comply, and the feedback contradicts itself.** Post helpdesk `ba`, Ayaan Warsame ("The second-floor printer is jammed again. Could someone have a look this afternoon?"), Comply:

> You chose Comply. This caller was genuine, but you did what they asked without checking. An impostor sounds just the same, so ring back on the number you hold first.
> A printer job asks for nothing that a caller could misuse, and he's calling from his own desk extension. Helping is the right call.
> Score for this message: 70 of 100

The result then lists "Ayaan Warsame · Incoming call · Comply: worth another look" and "Real mail handled right 4 of 6". The 70 for Comply-on-genuine (N16) is right for a password reset. Here the request is harmless and the item's own text says helping is right. Fix: mark the printer item as not needing a callback (Comply scores 100 and the "without checking" paragraph is skipped), or reword the scoring so the first paragraph only appears when the request is sensitive.

**P4-2. "It's pushing me to hurry" is "not a flag" on messages that say "today".** E4 a, "Lisbon hotel: card payment declined, please pay by transfer today" (body "To keep the room, please pay the balance of £1,860 by bank transfer today"): ticking the hurry tick gave "Not a flag here: It's pushing me to hurry. It wasn't one of this message's tells." Pre HR `ba`, "New starters: bank details needed today": same line for the hurry tick. In E1 ("Need this paid today") and E3 the same tick is credited. A learner who notices a deadline and ticks it is told they are wrong, with no reason given. Fix: either add urgency as a tell on these two items, or make the "not a flag" line for deadlines say why ("a deadline is routine on a payment run, the tell here is the changed account").

**P4-3. Trusting a phish email is not capped, so the band can read "Sharp" or "Getting there".** E2 b: 0 of 2 phish caught gives "Score 67 percent. Getting there: a few tells slipped past". E4 defend-only: Trust on the fake voicemail that says "don't ring back" gave 62% "Getting there". Post HR `ba`: Trust on "Starters Monday: need their passports now" (a phish) with 3 of 4 phish caught gave "Score 86 percent. Sharp: you caught the phish and knew why", and the same screen lists "Starters Monday: need their passports now · Trust: worth another look". The 15-point critical-miss rule (N17) only applies to approving a prompt or complying on a call. A sent passport scan is as serious. Fix: treat Trust on a phish that asks for payment, credentials or documents as a critical miss, or stop a band reading "Sharp" or "you caught the phish" while an item was trusted.

**P4-4. Subjects appear before the evidence for them.** E2 b, Fatima noted and Careers page never read: the composer shows "Subject: Application: Warehouse Operative (WHO-114)". The reference WHO-114 is only on the Careers page, so a hurried player gets it free (the E1 version was fixed in N15). E4 b: the subject reads "Contractor invoice to settle" before anything is picked, and stays that way under the "could you send me next week's diary?" pretext, so the sent email is a diary request under a payment subject. Fix: gate the E2 subject on the vacancy note as E1 does, and have the E4 subject follow the pretext (or offer a subject choice).

### Trivial

- **P4-5. Miss replies are uneven.** E1 b gets an in-voice Adaeze reply, but it answers a "monthly statement" pretext with "I don't change payee details from an email", which the email never asked for. E2 b and E4 b get no reply. Pick one: either a short in-voice reply per episode (matched to the pretext) or none.
- **P4-6. "What would have happened" under a safe refusal.** E3 b Refuse on the impostor: "Safe, but nobody was warned." then "What would have happened: The caller would have Gordon's account…" in the same card. The heading reads as if the refusal failed. Use "What this caller was after".
- **P4-7. E2 b and E4 b flip repeats itself.** Heading "Nothing to replay this time", body "There's nothing of yours to replay from the other side this time." Drop one.
- **P4-8. E3 phone panel after a successful reset.** E3 a: "Influence 20 … Last change: -10 reset password" under a green "All done. I've reset it". The -10 is the cost of the ask, but it reads as if the ask went badly.
- **P4-9. "No contacts yet — find someone first." when someone is noted.** E1 b: Derek (the sender) was noted but Adaeze (the recipient) was not, and the composer says "No contacts yet". Say "Nobody to write to yet" or "find who to send it to".
- **P4-10. "Back to research" reopens the browser on the last page visited.** E3 a, E4 b: after Close then "Back to research" you land on Friendface or Events, not the home page, so a learner who clicks the same people list again sees nothing. Not a defect for a human who looks at the screen, but worth landing on the home page.

## What worked

- Research recovery, the did-not-land flip, the skipped-stage stepper ("4 Prompts (skipped)"), and the "Why the call and the prompts worked" debrief.
- The calm-pretext route: E1 and E4 flips now show no urgency tell under a calm message.
- Call transcripts with one label per call: no longer sortable without reading. The queue reads as a genuine mix.
- Comply-on-impostor and approve-on-prompt are now costly in the round score, with a plain line saying why ("2 answers let an attacker straight in … 15 points off the round each").
- Pre/post: single-sentence brief, review step that shows each message's feedback, "Item by item" list at the end, "No baseline" and the post end card are both true without a pre check.
- Header details behind "Show details" with the header ticks hidden until opened.
- "Saving…" on Finish held the button for the save and cleared.

## Counts

New findings this round: **0 blockers, 0 majors, 4 minors (P4-1 to P4-4), 6 trivials (P4-5 to P4-10)**.

Still open from P3: minors N5 (E4 half), N7 (partly), N9, N10; trivials N12, N20. Still open from earlier: D1 (major since P2: hooded learner sprite), E3-T (length), E3-11 (no MFA decision), E4 N2 (trivial).

## Limits

- No audio (TTS 503 on :3001): voicemails judged from transcripts.
- Not re-tested: t3 (converse repeats the welcome line), N18 (no 100% debrief reached), a mid-episode reload, other roles' pairs beyond HR (finance, executive, general, mobile were not played here).
- Driver times include my gaps and ran at a load average of 26 to 121. They are not learner times, and the reading estimates were not recomputed.
- The P4-1 text came from a second playthrough of the same item (game 4068), because the first run's review page cleared at Finish.
