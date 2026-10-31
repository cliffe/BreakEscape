# m09 Digital Archaeology: stages 1–2, review round 4 (final check)

Reviewer: fresh, read-only, 2026-10-21. Read: `docs/agents/FINALE_BRIEF.md`; `stage_1/story_arc.md` ("SA", current line numbers), especially §8, §11, §13, §14, §17; `stage_2/storytelling_elements.md` ("SE"); `REVIEW_R3.md`; the round 3 fix commit (0c54cc55). Did not open VM_SHAPE, FINALE_VM_PLAN, SECGEN_MODULE_PLAN, SecGen or the field guides. Severity as before: blocker / major (fix in this stage) / minor (in passing or handed on).

## 1. Round 3 confirmation

| ID | Fixed? | Evidence / leftover |
|---|---|---|
| R3-01 | Yes, one stale copy | Office on `deck_choice_made`, traced from the deck's controller (SA:181, 240, 469; SE:307; change 29). §13 stage 5 still says "The office door takes the code HaX reads from the mail" (SA:511): R4-02. |
| R3-02 | Partly | §11's one rule (SA:475), `recruiter_secret` by branch (SA:180, 360), `identity_scene_done` on the answer (SA:265), engine item 15. Flag 4's read is a fourth forced phone scene left outside the rule, and the call and conclusion aren't keyed to it: R4-01. |
| R3-03 | Yes | Threat narrowed (SA:195, SE:66); refuse wipes her own file first, "She thinks it's gone. Let her." (SA:197, SE:305). Hang-up route doesn't get the same reasoning: R4-06. |
| R3-04 | Yes | The receipt (SA:197, 204–205, 332; change 30). Wording clash with m05's "receipt": R4-08. |
| R3-05 | Yes | SA:270, SE:331. |
| R3-06 | Yes | SA:230, SE:268, SE:319, change 15. |
| R3-07 | Yes in Beat 3.1 and SE | SA:248, SE:459, change 2. §1's summary paragraph still has "ticked … as its series are reached" and the old query (SA:24): R4-03. |
| R3-08 | Yes, with a gap | SA:290, SE:359. Same-room close case: R4-04. |
| R3-09 | Yes | SA:470, change 12. |
| R3-10 | Yes | SA:216, SA:504. |
| R3-11 | Yes | SA:146. |
| R3-12 | Yes | SA:295, SE:427, change 28. |
| R3-13 | Partly | Gone from the WREN topic (SA:331), but the Recruiter cell now says "about half" twice on `double_crossed` (SA:332): R4-05. |
| R3-14 | Yes | SA:266, SE:26, change 7. |
| R3-15 | Yes for the eleven tabled lines | "at the briefing" (SA:22), 31 minutes (SA:236), payoff note (SA:43), W-14 superseded, "On every answer" (SA:339). FA and m10 items are listed for their owners (SA:712–727). New stale copies found: R4-02, R4-03. |
| Worst line 1 | Yes | SE:349. |
| Worst line 2 | Yes | SE:66, SA:195. |
| Worst line 3 | Yes in Beat 2.4 and SE | SA:196, SE:303. Change 16 still quotes "it's on that tape" (SA:549): R4-03. |
| Worst line 4 | Yes | SE:337. |
| Worst line 5 | Yes | SE:319, SA:230. |

## 2. Breaking the night

**Recruiter routes.**

| Route | Trade-off real? | Exports | Notes |
|---|---|---|---|
| Take + tapes | Yes: certainty and teaching against her network and the receipt | `taken`, `alpha_tapes`, name set | The receipt's cost is one m10 line (R4-08). |
| Take + nothing | No: strictly worse than take + tapes, and the table says it gets "his teaching" | `taken`, `none` | R4-07. |
| Double-cross | Yes | `double_crossed`, `her_file`, name set | |
| Refuse + file | Yes, and now explained | `named`, `her_file` | |
| Refuse + tapes | Yes: clean record against certainty (only if the receipt matters) | `refused`, `alpha_tapes` | |
| Refuse + nothing | Labelled honestly as a principle | `refused`, `none` | |
| Hang up (sold-and-lied) | Yes: the secret kept costs the name | `kept`, then HaX's pull | `named` on a hang-up has no stated reason to roll up the whole network (R4-06). |
| Sold-and-lied, own it | Yes | `told`, then the spine | |
| Sold-and-confessed | n/a | `confessed` on the first line | |
| Never played m05 | n/a | `recruiter_secret = ""`, correct for m10 | |

Can a call be skipped or leave an empty value? The Recruiter's call: no (defaults on the first line, done-flag on the last choice, the office keyed to it, re-ring on leaving the room, and the player must leave the room to reach the office). The identity scene: no for the export, but see R4-04. Flag 4's read and Tesseract's call: yes, see R4-01. All nine exports have a value on every route.

**Locks (§11).** Flag 1 → cage, cage → call, call → deck, deck → office, office → tape room and the one-station rule all hold against order and close attacks. Reload is engine item 15, correctly left to stage 5. Two leaks: the last row (R4-01) and the master card (R4-09).

## 3. Findings

Counts: **0 blockers, 1 major, 8 minors.**

| ID | Sev | Location | Problem | Fix |
|---|---|---|---|---|
| R4-01 | major | SA:290, 306, 312, 473, 475, 504 | Introduced by R3-08. Flag 4's read is a forced phone scene with a choice (the `schedule_read` options, SA:299), but §11's rule names only three scenes, so it has no done-flag and no resume. Tesseract's call waits on "flag 4 and `identity_scene_done`", not on the read. Route: skip the plan chest, submit flags 3 and 4 (both held), fetch the file, answer the confession. `identity_scene_done` then releases the read and the call at the same moment, in no stated order, and Tesseract's "take your time getting there" can come before the hour, the key and the sheet. A player who closes the read part-way also gets the call with the hour unheard. And the conclusion aim waits on `identity_scene_done` "as well as the call" (SA:312), but no row keys it to `tesseract_call_done`. Tesseract's call has no player choice, so "resumes at its last unanswered choice" means nothing for it. | Add flag 4's read to §11's list with its own done-flag (`hour_read_done`, set on its last line after the realisation). Key Tesseract's call to `hour_read_done`, and the conclusion aim to `tesseract_call_done`, in the locks table, Beat 3.6, SA:312 and §13 stage 4. Add a sentence to §11: a scene with no choice restarts from its first line. |
| R4-02 | minor | SA:511 (§13 stage 5) | Stale R3-01 copy: "The office door takes the code HaX reads from the mail." Stage 5 builds from this list. | "The office door opens on `deck_choice_made` (HaX on the door, traced from the deck's controller)." |
| R4-03 | minor | SA:24; SA:372; SA:537; SA:549 | Stale copies: §1 still has the ticks "as its series are reached" and the old query (R3-07); §8's note says choice 2 is forced by "the call ending" (R3-02: nothing keys on a call closing); change 4's first half says a closed call "resumes at the offer", which contradicts its own round 3 addendum; change 16 quotes "it's on that tape" (worst line 3). | Sweep: the planning pass and "Reading (safe); plan chest: not listed. Keep?"; "the call's last choice"; "resumes at the last unanswered choice"; "it's on there". |
| R4-04 | minor | SA:265, 290, 475; SE:359 | Flags 3 and 4 are both in the tape room, so an identity scene closed before the answer doesn't re-ring while the player stays to do flag 4. The hold line "His file first. Then the rest of his box." is then wrong for a player who already holds the file. | Make the identity scene also re-ring on flag 4's submission, and give the hold a second fixed line for a player who holds the file ("Finish with me first. Then his box."). |
| R4-05 | minor | SA:332 | R3-13 moved the repetition rather than removing it: on `double_crossed` the Recruiter cell gives "about half of it, 'and she knows it was you'" and then adds "About half of her network. She warned the rest." | One line: `double_crossed`, "About half of her network. She warned the rest, and she knows it was you." |
| R4-06 | minor | SA:187, 197 | On the hang-up route HaX pulls her file and records `named`, which pays the whole network, but R3-03's reason (she wipes her own file first and drops off, sure it's gone) is given for refuse only. | One clause in the hang-up branch: she wipes her own file first, as on a refusal; HaX gets "She thinks it's gone. Let her." there too. |
| R4-07 | minor | SA:197, 204 | The table's "Take, pull the tapes (or nothing)" row credits take + nothing with "his teaching". That route gets certainty only, and costs everything take + tapes costs. "She leaves the Alpha tapes running for the player" reads as if they survive the wipe, which contradicts "the tape not pulled is wiped" on take + nothing. | Give take + nothing its own row (certainty / everything else on the deck and the receipt). Reword to "she leaves the Alpha tapes for HaX to pull, and watches the deck". |
| R4-08 | minor | SA:197, 332, 547 (change 30); SA:187, S-25 note | "Receipt" now names two different things: m05's sale (the sold-and-lied opening, S-25's "HaX already heard the receipt") and m09's purchase. Stage 3, stage 7 and m10 will mix them up on sold-and-lied + taken. And refusing's "clean record" pays nothing anywhere: the only cost of taking is one villain line. | Rename m09's purchase ("an entry in her books", or "the invoice") in SA, the debrief line and change 30. Hand stage 3 one concrete m10 payoff for the clean record, or for the entry (for example, it changes the leverage Tesseract has in the talk-down). |
| R4-09 | minor | SA:146, 240 | The player clones Sorensen's "master card". A master card should open her own office, yet the office waits on `deck_choice_made` and HaX "on the door", and nothing says why the card won't do. | Call it her stacks card (the cage and the shredder line), or say the office is on its own PIN lock off the card system. |

Nothing else above minor was introduced by round 3. The route table, the threat wording, the planning-pass ticks, the cabin door and the priced sheet all read well and hold together.

## 4. Verdict

**Not clean: 0 blockers, 1 major (R4-01), 8 minors.** It is one sentence of locks: put flag 4's read under §11's rule, key Tesseract's call to the read and the conclusion to the call. The minors are sweeps and single clauses that can go in with it. Once R4-01 is fixed, stages 1–2 are ready for stage 3 without another round; the fixer can confirm it in §18.
