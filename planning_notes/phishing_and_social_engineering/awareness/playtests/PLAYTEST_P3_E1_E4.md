# Playtest P3: E1 invoice fraud, E2 CV lures, E3 helpdesk reset, E4 exec whaling (re-play after 9bba1f82e, ef267b2f1, ed843e392, fb3e9de43)

Date 2026-10-23. Keyless server :3001 only (:3000 untouched, no servers started or stopped), headless Chromium, Node 24, one browser at a time, a fresh game per run. Load average was 15 to 21 (other agents running), so timings below are not representative. No game files edited and no console state edits: the only `eval` calls were read-only (page text, end-of-mission state).

Questions answered: plumbing and learner experience (1 and 2 of the playtest skill). Not a solvability run: these episodes have no PINs, keys or VM flags, so the earned-secrets table is empty (0 secrets, 0 flags).

Personas. Careful: researches everything, ticks what is actually wrong, makes the sound verdict. Hurried: skips or skimps research, picks the weak pretext, a send that does not land, a refused call, and wrong verdicts (Trust on phish, Delete or Refuse on real items, Approve on the overnight prompt). I read the P2 report first, so I knew where P2 dead ends were.

## Runs and evidence

Session logs are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/p3/<run>.jsonl`. `verify-run.rb` was run for every game: all printed `VERDICT: progress recorded` (E1/E2/E3/E4 full episodes: 2 tasks completed; defend-only and check forms: 1 task completed). Game 3846 (a partial E1 run to chase a bug) shows 1 task and score 0, as expected.

| Run | Game | Persona and what I did | Driver time | Reading estimate |
| --- | --- | --- | --- | --- |
| E1 a | 3836 | careful: full research, calm email that landed, 5/5 right | 4:06 | about 15 min |
| E1 b | 3841 | hurried: Derek only, "monthly statement" send did not land, 3 wrong verdicts (69%) | 1:37 | about 12 min |
| E1 c | 3846 | partial: a second missed send, to read the inbox afterwards | n/a | n/a |
| E2 a | 3847 | careful: Colin, Fatima, careers and Friendface noted, CV docx landed, 97% | 2:50 | about 15 min |
| E2 b | 3853 | hurried: no research (then Fatima only), zip "introduce myself" did not land, Trust on all (67%) | 1:14 | about 12 min |
| E2 c | 3893 | draft persistence check only | n/a | n/a |
| E3 a | 3855 | careful: all research, winning call, 3 pushes, queue 97% | 3:28 | about 17 min |
| E3 b | 3866 | hurried: no research, call refused ("I'm going to stop there"), queue 25% | 1:55 | about 12 min |
| E4 a | 3872 | careful: events and bio noted, calm webmail email landed, 100% | 2:42 | about 16 min |
| E4 b | 3879 | hurried: diary email did not land, Delete/Trust/Trust/Report/Trust (34%) | 1:14 | about 12 min |
| Defend-only E3 | 3881 | Ring back, Comply (on the real caller), Ring back, Deny: 76% | 0:53 | about 8 min |
| Pre helpdesk ab | 3883 | all 10 items, a few deliberate slips: 99% | 1:57 | about 8 min |
| Post helpdesk ab | 3888 | all 10 items, Refuse on the COO-style call, Approve on the prompt: 84% | 1:10 | about 8.5 min |

Timing method. "Driver time" is the harness log span from first to last command. It includes my own gaps between commands and none of the human reading time, so it says nothing about how long a learner takes. "Reading estimate" uses the P2 method (unique on-screen lines of 25 characters or more at 200 words per minute, 3 s per click, 30 s per decision), so the figures compare with P2: E1 about 15 (P2 17), E2 about 15 (16), E3 about 17 (17.5), E4 about 16 (16). The full episodes are about 1 to 2 minutes shorter for E1 and E2 and no shorter for E3. E3 is still about 4 minutes over its 13-minute target.

## Status of each P2 finding

Quotes are on-screen text from this round.

| P2 item | Status | Evidence |
| --- | --- | --- |
| B1 (E1/E2/E4 research dead end) | fixed (re-checked) | E1 b/E2 b/E4 b: Write stage offers "Open the mail client" and "Back to research"; with nothing noted the composer says "No contacts yet — find someone first." and the sender blanks read "no evidence yet / A blank needs evidence you haven't found yet". Back to research recovers. |
| M1 (E2 Colin Mather) | fixed (re-checked) | E2 a: noting Colin from the Careers page ("Noted: Colin Mather is Tarrowby's Warehouse Manager and the hiring manager for the open warehouse roles.") puts "the hiring manager: Colin Mather" in the blank. |
| M2 (E4 travel address) | fixed (re-checked) | Events page gives catherine.merrin@inboxly.example; meter and flip both say "the free webmail travel address from her bio". The triage phish uses the different catherine.merrin.travel@ address. |
| m1 (E1 urgency tick) | **fixed** | E1 a: "Caught: Unexpected urgency or pressure to act fast ('Before today's payment run' ...)" for the "It's pushing me to hurry" tick. |
| m2 (E2 link vs look-alike) | **fixed** | E2 a: ticking only "The link goes somewhere else" gave "Caught: Link destination doesn't match the real site (look-alike domain)". Extra ticks no longer clash. See new N6 for the debrief side. |
| m3 (E2 flip has nothing to show for a careful email) | **not fixed** | E2 a flip, unchanged: "There's nothing extra to replay from this careful application, so there's nothing of yours to show from the other side." It is now also shown after a send that did not land (see N1). |
| m4 (E4 calm flip contradicts wording) | **fixed** | E4 a: subject "Contractor invoice to settle", body "nothing urgent", one webmail line under it, then "Tomás read it between setting up two meetings". Nothing says urgent. (E1 has the same shape of problem, see N2.) |
| m5 second half (E4 meter vs flip tell) | not reached | I sent the calm pretext (E4 a) and a message that did not land (E4 b), so no flip listed a tell the meter had missed. |
| m6 (Close behaves two ways) | fixed (re-checked) | Close in the composer returns to the kiosk Write stage; after Send, Close goes on to the flip. |
| m7 (real clock beside scenario times) | **fixed** | E1 flip `09:02` with inbox 09:02/09:05; E4 flip `08:41`; E3 prompts show 02:14 and 06:31/06:44/06:50. No 23:xx stamps. |
| m8 (E2 protected docx broad ticks) | **fixed** | E2 a: ticking sender address, no good reason and attachment on Jordan Kerr gave three "Not a flag here" lines and no penalty (score 80, same as a clean answer would get for the same catches). There is now a separate tick, "It asks me to turn on editing or content to see it". |
| t1 (round score on screen vs persisted) | not fixed (by design) | E3 b showed Round score 25%, `verify-run` score 100. Completion scoring. Not a defect unless the on-screen number is meant to be recorded. |
| t2 (Verify/Report stat reads like a miss) | **not fixed** | See N7: "Reported 67% of the phish" beside "Round score: 100%" (E4 a, E3 a), and "Escalated or reported rather than just refused 0 of 3" for a player who rang back every call correctly (defend-only). |
| t3 (converse repeats welcome line) | not fixed (probably harness) | Darren Price: the welcome line and "Any time." each print twice. |
| E3-1 (refused call goes on to "You have the password") | fixed (re-checked) | E3 b: "I'm going to stop there. I'll need to verify you before I do anything else." goes to "Now you're the one answering". |
| E3-1 (flip text after failed call) | **fixed** | E3 b flip: "Your call didn't get what it was after this time, so there's nothing of yours to replay. The defence is the same either way: next, the same kind of call comes in to the service desk, and you're the one answering." |
| E3-2 (skimmed research) | fixed (re-checked) | E3 b: card shows only lines without blanks and "Manager: nothing held yet" etc. No `____` any more (P2 N4 fixed). See N9 for a related leak. |
| E3-3 ("ASK OK needs -20 or better, now at 20") | **fixed** | E3 a: "ASK OK needs 0 or better, now at 20. She reset it on the manager's name and the staff reference, both of which are on the public site." |
| E3-4 (email copy on a phone queue) | fixed (re-checked) | Queue brief and buttons are call wording (Comply / Ring back / Escalate / Refuse; Approve / Deny / Deny and report). One stray: "You'll get feedback after each message." (N14). |
| E3-5 (raw ids as headings) | fixed (re-checked) | "Josh Henley, from the Head of Claims' office (withheld)". See N12 for two identical Gordon headings. |
| E3-6 (stepper ticks "Prompts" after a refused call) | **fixed** | E3 b stepper: "4 Prompts (skipped)". |
| E3-7 (player's lines in call 1 already say "ring you back") | **fixed** | Queue transcripts are caller lines only. The speaker label is a new problem, see N3. |
| E3-9 (debrief never returns to the call or MFA) | **mostly fixed** | E3 a debrief has "Why the call and the prompts worked" covering the call and the sign-in prompts ("one approval request after another, counting on a tired person tapping approve"). The player's own lines are not quoted, which is fine. |
| E3-11 (MFA is seven presses, no decision) | **partly fixed** | Now three pushes then "The target tapped Approve. The attacker is now signed in — this is MFA fatigue." (down from eight presses). Still no decision for the learner. |
| E3-T (length) | not fixed | About 17 min estimated against 13. |
| D3 (debrief says "You chose Verify/Report" for calls) | fixed (re-checked) | "You chose Ring back. Right call: ringing back on a number you already hold is how you check." |
| D1 (learner shown as a hooded figure) | **not fixed** | `P3_screenshots/e3_quayholt.png`: hooded sprite beside the kiosk, hearts HUD along the bottom. |
| N1 (P2: skipped MFA stage silent) | fixed | Stepper says "(skipped)". |
| N2 (P2: E4 only webmail address offered) | not fixed (trivial) | E4 a and b: the only address offered is catherine.merrin@inboxly.example, with or without her bio noted. |
| N3 (P2: closing the mail client discards the draft) | **fixed** | E2 c: chose a pretext, Close, reopened Compose, the pretext was still selected. |
| N4 (P2: unusable `____` lines on the card) | fixed | See E3-2. |
| Debrief only lists imperfect messages | fixed (re-checked) | E1 a, E2 a: "Nothing to pick over here" or only the missed items. |

Counts: of the 29 rows above, 18 fixed (including re-checked fixes), 2 partly or mostly fixed, 7 not fixed, 1 not reached, 1 by design.

## New findings

Severity: blocker (cannot finish or teaches the wrong thing), major (undermines what the episode measures or teaches), minor (reads wrong, unfair or confusing), trivial.

### Major

**N3. E3 queue, pre and post helpdesk checks: the speaker label gives the verdict away.** Genuine callers' transcript lines are labelled with their first name ("Gordon", "Sofia", "Ayaan", "Darren", "Niamh"); impostors' lines are labelled "Caller". E3 queue: call 1 (impostor) "Caller", call 2 (real Gordon) "Gordon", Josh Henley (impostor) "Caller". Pre check: Sofia "Sofia" (real), Owen "Caller" (impostor), Ayaan "Ayaan" (real). Post check: Niamh "Niamh" (real), Pauline "Caller" (impostor), Darren "Darren" (real). This comes from the "caller lines read without the player's side" change. It lets a learner sort calls without reading them and contaminates the pre/post measure, which is meant to show a skill change. Fix: label every line in a call the same way, either "Caller" throughout or the claimed name throughout (voicemails and the E4 voicemail already do this: both Catherine voicemails are labelled "Catherine").

### Minor

**N1. E2 and E4 flip after a send that did not land says "careful".** E2 b (zip "introduce myself", did not land) and E4 b (diary request, did not land) both show "There's nothing extra to replay from this careful application/message, so there's nothing of yours to show from the other side." The message was not careful, it failed. E1 b shows the right wording ("Your email didn't land this time, so there's nothing of yours to replay from the other side."). Fix: use the E1 did-not-land wording in E2 and E4, and keep the "careful" wording only for a send that landed with no tells (m3).

**N2. E1 (and E4): a calm pretext plus a "confirm" ask scores as urgency, and the flip then shows urgency under a message that says "No rush today".** E1 a: pretext "When you have a moment on invoice INV-2217: ... No rush today.", meter showed 0 red flags; after choosing the ask "Can you confirm once the new details are saved?" it became "1 Unexpected urgency or pressure to act fast", the sent-mail panel said "Advisory: That feels rushed.", and the flip listed "Unexpected urgency or pressure to act fast" under the calm message. E4 a repeats it for "Drop me a line here once it's gone through" (the "No rush" ask is 0). Fix: relabel what an ask adds ("Asks for a quick confirmation") or only count it when the pretext is urgent.

**N4. E1: a miss produces a reply from Adaeze that is meter text.** E1 c: after "It did not land." the inbox gets "New message from Adaeze Okafor: Re: Invoice INV-2217" whose body reads "No open invoice she can match this to, so no reason to act on it." That is the judge's reason, not something Adaeze would write, and a reply arriving at all sits oddly with "It did not land". Fix: a short in-voice reply ("Which invoice is this about?") or no reply.

**N5. E4 and E2: did-not-land reasons do not match what was sent.** E4 b sent a diary request; the panel said "No trip he can match this to, so a rushed payment from the road reads as odd." Nothing in the message was a payment. E2 b: "No vacancy she can match this to" is fine, but the advisory "That feels rushed." appeared on a CV introduction with no deadline. Fix: derive the reason from the pretext chosen.

**N6. Either-tick groups are listed twice in the debrief.** E2 b debrief, Liam Baxter: "Look for: Link or sender domain is a look-alike of the real one ...", "Look for: Claims an attachment ...", "Look for: Link destination doesn't match the real site (look-alike domain)". The per-message feedback (E2 b, same message) listed only two tells. E1 b debrief, "Updated bank details": "Look for: Sender address doesn't match..." and "Look for: Link or sender domain is a look-alike" for one forged address. Fix: show one entry per group in the debrief, as the message feedback already does.

**N7. Verify and Ring back read like misses in the stats.** E3 a: round 97% and "Reported 67% of the phish". Defend-only E3: every phish call rung back correctly, 76% "Getting there: a few tells slipped past", "Phish caught 3 of 3" beside "Escalated or reported rather than just refused 0 of 3" and "Reported 0% of the phish". E1 b: "Real mail handled right 1 of 3" while a Report and a Verify on real mail each scored 100. Carry-over of P2 t2, now with more examples. Fix: do not count Ring back or Verify against the report rate; define "handled right" the same way the per-message score does.

**N8. "Not a flag here" lines repeat a sentence.** E4 b: "Not a flag here: Asked to keep it secret or to skip the normal process. A diary move is an ordinary PA job. Nothing is kept from anyone and no step is skipped." followed by the same sentence again. Same on E1 (Purchase orders ..., Marsh End Eggs ...) and E2. The tick explanation and the "why it was real" paragraph share a sentence. Fix: drop the repeat.

**N9. E3 call card offers facts the learner never found.** E3 b, nothing researched: the card says "Use only details you have found. Do not invent one." and then offers "The Head of Claims needs me back online for a hearing this morning." and "I'm at a conference, I won't be at my desk phone". Neither was found. Fix: gate lines that rely on a fact (Head of Claims, conference) behind the note that supplies it, as the blank lines already are.

**N10. E3 call feedback names a tell the line did not contain.** E3 b, line "Honestly, skip the security questions, I really don't have time for this.": "-20 CALM ! Urgency. A rushed reset is the oldest pressure line on a service desk. Dodging the callback. The number on file is exactly what would catch this, so discouraging it is the tell." Nothing about a callback was said. Fix: split the entry or attach "Dodging the callback" only to lines that dodge it.

**N11. E3 flip says the caller "sounded rushed" after a calm call.** E3 a flip: "every answer right, and sounded rushed, so she reached for the reset." My call used none of the rushed lines. Fix: make the closing paragraph conditional on the pressure lines used.

**N13. Pre/post brief contradicts itself.** Pre and post helpdesk checks print "You'll see how you did at the end." and later "You'll see what you got right and wrong at the end." in one brief, next to "Finishing the check is what counts here". The result screen then shows only totals ("Real mail handled right 5 of 6") with no list of which items were right. Fix: one sentence, and say "a summary" if no per-item list is meant.

**N15. E1: the invoice number is given free.** E1 b and c: with Derek noted but no finance page read, the subject already says "Invoice INV-2217" and the body can use it; the judge then says "No open invoice she can match this to". Fix: hide the subject until INV-2217 is noted, or drop the subject from the check.

**N16. Genuine caller scores 100 on Comply.** Defend-only E3: Comply on real Gordon gave "Right call. This caller was genuine." and 100, with the explanation reading "Ring him back and reset it." and "The facts couldn't tell them apart; the callback could." Taking the call with no check is then rewarded, which is the behaviour the episode is teaching against. Fix: Comply on a genuine unverified caller should score like Verify minus the check (for example 70).

**N17. One fatal miss barely moves the post check.** Post check: Approve on the 23:52 prompt gave 84% "Getting there"; pre check scored 99% "Sharp" with a genuine notice reported and a pressure tell missed. Fix: cap the band when a prompt is approved or a reset is made for an impostor.

### Trivial

- N12. E3 debrief headings: the impostor call and the real caller are both headed "Gordon McLeish, Claims (calling from a mobile)". The queue list does the same. Add "(first call)", or leave them and note it is deliberate.
- N14. E3 queue brief: "You'll get feedback after each message." (it is calls).
- N18. E1 a debrief at 100%: "Nobody is marked down for a miss here." follows "You read every one of these the right way."
- N19. E1 b: "Sender address doesn't match ... (It signs off as Brightwell Accounts, but the address isn't a Brightwell one at all ...)" for brightwel1foods.example, which looks like a Brightwell address.
- N20. E1 a, Ravinder Sandhu message: ticking "There's no good reason I'd get this" gave "Not a flag here". A secret payment request to a payments inbox arguably has no good reason; the label is the only one the learner has for "this should not be sent to me".
- N21. HUD: hearts show in the training room (E3 screenshot), a combat meter in an exercise with no combat.

## What worked

- Research recovery, did-not-land flip (E1 and E3), skipped-stage stepper, call/MFA debrief, Ring back wording and the call transcripts (once labels are fixed) all read well.
- E2 and E4 phish for hurried players: "Missed" lists are short, the "What would have happened" lines are concrete, and the "Look for" debrief for a zero-tick Trust is clear.
- No score unfairness found from the "either tick counts" groups on the message screens: ticking the link or the look-alike alone is credited once and extra wrong ticks cost nothing.
- Draft now survives closing the mail client (E2 c).
- Mail stamps and scenario clock are consistent.
- All four end screens and both check end screens appeared ("First check done": "Your result is saved, ready for the second check to compare with."; "Second check done"). The post check, opened as a separate game here, correctly says "No baseline".

## Counts

New findings: **0 blockers, 1 major (N3), 14 minors (N1, N2, N4, N5, N6, N7, N8, N9, N10, N11, N13, N15, N16, N17), 6 trivials (N12, N14, N18, N19, N20, N21)**. N7 is a carry-over of P2 t2 with new evidence, so 13 of the minors are new.

Carried over still open from P2: m3, t1 (by design), t2 (N7), t3 (harness), E3-11 (partly), E3-T, D1 (major), E4 N2 (trivial).

## Limits

- No audio (no TTS on :3001): voicemails judged from transcripts.
- Defend-only run covered E3 only; the pre and post pair covered helpdesk ab only (the `ba` order and the other roles were not played).
- E5 to E7 are covered by the sibling report `PLAYTEST_P3_E5_E7.md`.
- The learner-time figures are estimates by the P2 method, not stopwatch readings; driver time includes my gaps.
- I did not run a mid-episode reload.
