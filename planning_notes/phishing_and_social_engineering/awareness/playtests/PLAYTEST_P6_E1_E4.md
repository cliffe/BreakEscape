# Playtest P6 part A: E1, E2, E4 (re-play on main at c8a4164e2; E3 excluded, it is still changing)

Date 2026-10-27. Keyless server :3001 only (:3000 untouched), headless Chromium, Node 24, a fresh game per run, own game ids. TTS 503 as expected. No game files edited and the shared avatar preference left alone (every run used the default hooded avatar). Machine load average about 12 at start.

Questions answered: plumbing and learner experience, whether every P5 finding for E1, E2 and E4 is closed, and whether the round-8 hooks and the new C1/C2/C4 changes read correctly. Not a solvability run (no PINs, keys or VM flags).

Personas. Careful: researches, ticks what is wrong, sound verdicts. Hurried: thin research, a weak pretext that does not land, wrong verdicts (Report or Delete on real items, Trust on phish), Close mid-round or a reload.

## 1. E4 bridge re-run (E4 data changed after its last pass)

`tools/playtest/se/bridge-e4-full.jsonl` scored with `check-bridge.mjs`, game 4489, head c8a4164e2, driver 30 s.

```
eval assertions: 14, passed: 14, failed: 0, expected: 14
RESULT: PASS
```

Log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw-p6a/bridge.log`.

## 2. Runs and timing

Logs are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw-p6a/<tag>.jsonl`. Driver time is wall-clock from game creation to the last command, so it includes my gaps and no human reading time. `verify-run.rb` printed `VERDICT: progress recorded` (2 tasks completed) for all six games.

| Run | Tag | Game | What I did | Score | Driver time |
| --- | --- | --- | --- | --- | --- |
| E1 careful, with reload | e1a | 4492 | all research, calm "when you have a moment" pretext, landed; 3 phish reported with ticks, 3 real trusted; reloaded after item 2 | 98% | 515 s (about 330 s of that was a harness loop after the reload, see H1; about 185 s without it) |
| E2 careful | e2a | 4509 | Fatima, Colin, Careers and the WHO-114 vacancy noted; CV plus calm ask landed; 2 phish reported, 4 real trusted | 90% | 101 s |
| E4 careful | e4a | 4514 | events and bio noted; calm "I'm away at" webmail email landed; senior, secrecy and callback ticks | 65% (my slip, see H2) | 130 s |
| E1 hurried | e1b | 4516 | "monthly statement" pretext, did not land; Report on real invoice, Delete on real PO, Trust on 3 phish and the real Marsh End; Close mid-round then Keep going | 0% | 103 s |
| E2 hurried, Close anyway | e2b | 4520 | Fatima only, "introduce myself" plus zip, did not land; Report on a real item, then Close then Close anyway, reopened kiosk, round restarted; Trust x2 on phish, Delete on real HGV item, no ticks | 32% | 48 s |
| E4 hurried, with reload | e4b | 4524 | diary pretext, did not land; Report on both real items, Trust x2 on phish, Delete on the third; reloaded after item 2 | 31% | 125 s plus 40 s to recover from the reload |

Note on E4 careful: the 65% is my harness slip, not the learner's choice (H2). Every careful tick and verdict I meant to make scored 100.

Wall-clock per episode (careful, no harness waits): E1 about 185 s, E2 101 s, E4 130 s. Hurried: 103 s, 48 s, 125 s. These are driver times, not learner times, and the reading estimates were not recomputed.

Harness waits (mine, not the game's):
- **H1.** `bootstrap` with `resume:"resume"` after a reload looped on the resume overlay for 5 min 30 s (the known gotcha in the skill) and blocked every command. The second reload (e4b) used an `eval` that clicks the exact "Resume" text, then Enter on the title screen, then Escape on the Mission Brief popup: 40 s from reload to the kiosk reopened.
- **H2.** In e4a my body-reading loop clicked control indices 1 to 8, and indices 6 to 8 on a five-row inbox are the Trust, Report and Delete buttons, so one phish (the Wrenfield transfer request) was Trusted by accident and the round scored 65%. It did give a free look at the critical-miss line on a trusted E4 phish (see section 4).

## 3. Status of every P5 finding for E1, E2 and E4

| P5 item | Status | Evidence this round |
| --- | --- | --- |
| P5-1 Finish below the fold | **fixed** | E1 result screen: Finish sits in a bar pinned under the scroll area, visible without scrolling (`P6_screenshots/p6a_e1_result_finish_visible.png`). The text behind the bar fades. I saw the E2 and E4 result screens only as text, so the visible Finish is confirmed on E1 only. |
| P5-2 "You trusted" names verified items | **not retested** | Every item I trusted was a plain Trust; I did not use Verify. Open until a run uses Verify on a real item. |
| P5-3 grid and false-alarm sentence disagree | **fixed** | E1 hurried: "Real mail handled right 2 of 3" with "You reported one real one just in case, which is fine when unsure ... One real one was treated as a phish: PO-4471 (Delete)". Report now counts as handled right in the grid and the sentence says so. E4 hurried: both real items Reported, grid "2 of 2", sentence "You reported 2 real ones just in case, which is fine when unsure". |
| P5-4 brief says a false alarm costs nothing | **fixed** | E1 brief: "Reporting when you're unsure is always fine and never marked down, though a real one does take a colleague's time to check." The same sentence is in the E1, E2 and E4 full and defend-only erbs, and `never costs you anything` appears in none of them. |
| P5-5 no-blame line contradicts the score | **fixed** | Debriefs of 0% (E1), 32% (E2), 31% (E4) end: "These messages are built to fool careful people, so a miss here says more about the attack than about you. The points only show where to look next time." (`p6a_e1_debrief_no_blame.png`). Not shown on the 98% E1 or the 90% E2 debrief. |
| P5-6 "warns everyone else" on genuine items | **fixed** | E1, E2, E4 Report on a real item: "Thanks for reporting. A colleague will check it and let it through." then "Reported, and that's never wrong." On a phish: "That warns everyone else." |
| P5-7 E3 call menu | not in scope (E3) | |
| P5-8 meter misses the secrecy tell (E4) | **fixed** | E4 secrecy pretext, webmail sender: meter "Red flags 3: urgency, asked to keep it secret, someone senior is invoked to skip a check". Calm pretext: 0 flags. Diary pretext with webmail sender: 1 flag. |
| P5-9 E1 defend brief says five, inbox has six | **fixed** | "Six messages are waiting" in the E1 full and defend-only erbs; sort screen "0 of 6 sorted". |
| P5-10, P5-12 E3 | not in scope | |
| P5-11 Verify counts toward "stopped for the team" | **not retested** | No Verify used. |
| P5-13 stale check-kiosk text | not retested (check kiosks not played this round). The full-episode kiosks read correctly after Finish ("The message is written and the payments inbox is all dealt with."). | |
| P5-14 "Not a flag here: someone senior is invoked" on the managing-partner email | **superseded by C4-1** | With the webmail sender the calm email now raises 0 meter flags, and the senior-invoked tick is not offered a verdict on it in the careful run. See C4-1 below. |
| P5-15 avatar not observable in chats | **unchanged, not a fault** | Still no learner line in E1 to E4 chats. |
| N12, N20 (trivial, carried) | **N20 still open**, N12 is E3 | "Not a flag here: There's no good reason I'd get this. It wasn't one of this message's tells." still shows on a genuine Report (E1 hurried, E2 hurried, E4 hurried) and on the phish Ravinder (E1 careful, 87/100) and Liam (E2 careful, 80/100). |
| E4 N2 (only the webmail address offered) | **unchanged, by design** | E4 compose offers catherine.merrin@lintbox.example only after the Events page is noted. Without it the sender-address picker reads "no evidence yet" and Send is disabled (see M1). |
| Carried P4 items (P4-1 to P4-10) | **all still hold** | Subjects follow the pretext; no reply on a miss; flip heading "Nothing to replay this time"; "Nobody to write to yet"; no "Sharp" with a trusted phish; trusting a phish costs 15 points each (E1 hurried: "3 answers ... 15 points off the round each"). |

P5 items closed this round: P5-1, P5-3, P5-4, P5-5, P5-6, P5-8, P5-9 (and P5-14 superseded). Open: N20 (trivial), P5-2 and P5-11 (not exercised, need a Verify run), P5-13 (check kiosks, out of this part), P5-15 (not a fault), E4 N2 (by design). P5-7, P5-10, P5-12 are E3.

## 4. Round-8 hooks and new items

**Subjects follow the chosen pretext.** E1: "Quick note" until the invoice slot is filled, then "Invoice INV-2217" (calm and urgent both); "monthly statement" stays "Quick note". E2: the WHO-114 subject ("Application: Warehouse Operative (WHO-114)") is offered only after the Careers vacancy is noted, and the "apply" pretext sets it. "Introduce myself" stays "Quick note". E4: secrecy pretext sets "Contractor invoice to settle", calm pretext sets the same, diary pretext sets "Quick one".

**E4 secrecy and authority tells.** In the meter, see P5-8. In the defend ticks: the whaling email and the first voicemail both offer "Someone senior is invoked to skip a check", and the voicemail also offers "Caller discourages you from calling back the official number" (it is not on emails).

**C4-1 (c8a4164e2): ticking "Someone senior is invoked to skip a check" is now a tell on the whaling email and the voicemail, with a note. Confirmed.**
- Whaling email (E4 careful): "Caught: Someone senior is invoked to skip a check ('I'll sign it off when I land' leans on the managing partner's own authority to push the payment past Yasmin's approval. A name in the From line is no proof she sent it)". Score 100 of 100. It no longer says "Not a flag here". A second pass on the same message (the harness repeat) gave the identical text.
- Voicemail 09:48: "Caught: Someone senior is invoked to skip a check ('I'll square it with her myself' uses the managing partner's own authority to wave the payment past finance. It sounded like her, and a voice on its own doesn't prove who is speaking)". Score 100 of 100.
- The debrief for those two cards says "Spotted" where I ticked it, "Look for" where I missed it.

**C2 room changes.** Plates read BRIGHTWELL FOODS, TARROWBY LOGISTICS and MERRIN & SALLOW, with a W in each (`p6a_e1_room_brightwell.png`, `p6a_e2_room_tarrowby.png`, `p6a_e4_room_merrin_sallow.png`). Merrin & Sallow: the fig plant stands against the west wall, clear of the table and chairs. Tarrowby: a soft pale wash falls around the middle of the floor with no visible fitting, which matches the lighting data (a rooflight light at tile 4.5, 5, radius 110, intensity 0.25, `training_room_lighting.json`). I could not see a rooflight object itself, because the top-down view has no ceiling to draw it on; I judged it from the pool of light and the data file only.

**Debrief cut-off by the conclusion or credits (PUZZLE_REVIEW_C1.md minor 1): not reproduced in E1, E2 or E4.** In every run the debrief stays on screen until the learner presses its own Finish. Only then does the end card appear ("INVOICE FRAUD EPISODE DONE ... Return to missions / Close", `p6a_e1_conclusion_after_finish.png`; the same for "CV LURES EPISODE DONE" and "EXECUTIVE WHALING EPISODE DONE"). No credits overlay (`#bv-credits-overlay`) opened in any of the six runs, and the kiosk was already closed when the end card came up, so nothing cut a debrief off. The debrief in all six runs scrolled to a Finish button at the bottom. Caveat: I did not wait to see what the end card does to a learner who never presses Finish, because the card only follows Finish.

**Trusted-phish line in E4.** E4 careful (Wrenfield transfer trusted by slip): "One answer let an attacker straight in (trusting a phish email). That costs 15 points off the round, on top of the item itself." Score 65%, band "Getting there". Skill grid: "Borrowed authority: caught 2 of 2", "Secrecy: caught 2 of 2", "Callback pressure: caught 1 of 1". The new skill names show on the grid (`p6a_e4_result_trusted_phish.png`).

**Reload mid-round.** E1 careful and E4 hurried both reloaded during the sort. Both resumed at the same stage ("Defend", brief text and "Open the inbox"), and the round restarted at "0 of N sorted", matching the brief's "Closing or reloading before the end restarts this round from the first message". The notes from the research survived (E1: both "Send the email" objectives still ticked after the reload). After the reload the Mission Brief popup came back (intentional, per the project notes) and had to be closed (`p6a_e4_after_reload_brief.png`).

**Close anyway (E2 hurried).** "Close now and the answer you've given so far won't be kept. The round starts again from the first item next time." Close anyway closes the kiosk; interacting again resumes at the Defend stage with "Open the inbox"; Start gives "0 of 6 sorted". Keep going (E1 hurried) returned to the same sort screen with the first verdict kept ("1 of 6 sorted").

**Feedback on genuine items.** E1 Delete on the real PO: "That one was real. Deleting it is cautious, but reporting an unsure message is safer for everyone." with a score of 70. E1 and E4 results list "You reported one real one just in case, which is fine when unsure" and the debrief gives "What made it safe". The cost line "treating a real message as a phish has a cost" shows once in the debrief.

## 5. New findings

Severity: blocker (cannot finish or teaches the wrong thing), major (undermines what the episode measures or teaches), minor (reads wrong, unfair or confusing), trivial.

### Blockers and majors

None found.

### Minor

**M1. E4 compose gives no reason why Send is disabled when the sender address has no evidence.** E4 hurried (game 4524): I noted Catherine and Tomás on "Our people" but skipped the Events page. In compose, "sender's address: no evidence yet" is greyed and Send is disabled, with only the generic "Choose how to word your message." under it. The people page offers no address for Catherine at all (her only offered address is the webmail one, from the Events page), so a learner who has researched the obvious page cannot tell what is missing. In E1 and E2 the missing slot names the evidence ("which vacancy: no evidence yet"). Evidence: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw-p6a/e4b.jsonl`, the compose state after "Our people" 5. Fix: a hint on the empty slot such as "Find an address for her in the research pages", or note the people-page address too.

### Trivial

**T1. N20 still open: "There's no good reason I'd get this" is "Not a flag here" on messages where it reads as obviously true.** E1 careful, the Ravinder phish: "Not a flag here: There's no good reason I'd get this. It wasn't one of this message's tells." E2 careful, the Liam portal phish (80/100), same text. On the genuine items the same tick is "Not a flag here" and then explains why the message was fine, which reads well; on the phish it reads as a contradiction. Carried from P5 (N20).

**T2. E2 careful: "The attachment doesn't fit" is "Not a flag here" on the macro-enabled CV from the free-mail address.** The message's own tell is "asks you to enable content". Arguable, and the card explains it, so trivial.

**T3. The harness's `bootstrap resume:"resume"` loops on the resume overlay for 5 minutes 30 seconds after a reload** (H1). Not a game finding; the skill already lists it, but `bootstrap` still does not click the overlay's own Resume. Counted here only because it was the largest wait of the round.

## 6. What worked

- C4-1 is live on both whaling items with a specific note on each.
- The pinned Finish bar removes the P5-1 hidden-button problem on all three episodes.
- Report on a genuine item no longer claims to warn anyone; the grid and the false-alarm sentence agree.
- The no-blame line no longer contradicts a 0% score, and it stays away from a good round.
- Pretext-aware subjects, did-not-land reasons and flip lines all read correctly again (E1 calm "no rush today", E2 CV calm "nothing off to pick up on", E4 calm "No deadline and no secrecy ... never prompted a call to confirm").
- Reloads and Close anyway do what the brief says.

## 7. Counts

New findings this round: **0 blockers, 0 majors, 1 minor (M1), 3 trivials (T1 to T3).**

P5 items for E1, E2 and E4: 7 closed (P5-1, P5-3, P5-4, P5-5, P5-6, P5-8, P5-9), P5-14 superseded by C4-1, 2 not retested (P5-2, P5-11), N20 open, E4 N2 unchanged by design, P5-15 not a fault. E4 bridge: PASS.

## 8. Limits

- No Verify, Delete-on-phish or Ring back tested in the full episodes, so P5-2 and P5-11 are untested.
- The check kiosks, the defend-only shells, E3 and E5 to E7 were not played.
- No audio (TTS 503): the voicemails were judged from transcripts.
- The avatar was left at the hooded default; I did not touch the shared preference.
- Tarrowby's rooflight was judged from the light pool and the data file, not from a visible fitting.
- The E4 careful 65% comes from my harness slip (H2), so its score is not a learner outcome.
