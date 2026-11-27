# ca16 trailer script r2 rev R2: review R3 (sell and truth)

Reviewed: `docs/video/scripts/ca16_trailer_script_r2.md` at 5578145b1 ("round 2, rev R2"), with its R2 and R1 disposition tables. Checked against `scenarios/ca16_insider_risk/` and `scenarios/ca16_insider_risk_defend/` (scenario files and ink as at e72cd2830, unchanged since) and `docs/video/recipes/course-trailer.md`. Earlier review files were not read. No frames were viewed; framing, gates and take windows are the timing review's.

**Counts: 0 Blocker, 0 Major, 9 Minor.**

Verdict: the script is ready for the owner. A first viewer gets the definition in twelve words, three cases that each end on what happened, the buyer's reasoning once, one lesson, and a last shot that puts the first case back in front of them. Every narrator line, chip, card and caption is true of the episode. The Minors are a one-word change to v24, facts the owner should have in questions 5, 8 and 9, and housekeeping.

## Hard rules

| Rule | Result |
|---|---|
| No narration over verdict buttons | Pass. No verdict buttons are on screen in any beat |
| No answers to scored items, tells, advisory lines or tallies on screen | Pass on the script's stated reading. No scored item is opened, the tally is hidden, second sentences are trimmed. What is still given away is in m3 and m4 |
| VO at most 3.0 words/s | Pass. Word counts recounted for all 14 lines; highest is 2.3 |
| No em dashes in VO | Pass |
| At most 28 characters per card line | Pass for chips, captions, headings and the close card (all recounted; chip 3 is 26). One exception, the 40-character definition bullet in 16:9: see m6 |
| UK English | Pass |
| No "Break Escape" on screen | Pass |
| CTA "Learn on Hacktivity.co.uk" | Pass, on the plate and word for word in v30 |

Sum of durations recomputed: 72.4 s.

## Truth check

| Item | Episode source (found by search) | Result |
|---|---|---|
| v20, v21, define card | `scenario.json.erb:5`, `:629`; `ink/anjali_rao.ink:57`; debrief `:641`; both `mission.json` descriptions | True. The episode says "mostly by accident"; the card says "Mostly accidents". Same meaning |
| v22, beat 4 card and pick | `:458`, `:462` | True, card text word for word |
| v23, beat 5 sentence | `:672` first sentence | True |
| v24 | card `:509`; "client list" at `:353`, `:356`, `:680` | True in fact. One word works against the episode: m1 |
| v31, beat 7 sentence | `:680` first sentence; also `:353` "takes the firm's data outside its protection" | True. It is a consequence now, and "left the firm" sits well next to "a leaver" |
| v3, beat 8 card and pick | `:492`, `:496` | True |
| v25 | `:253` "marks you as someone who might say yes" | True. Source is a scored item's feedback line: m4 |
| beat 9 sentence | `:668` first sentence | True |
| Chip `1 · BY ACCIDENT` | `:672` "clicked the wrong shortcut" | True, once beat 5 arrives |
| Chip `2 · A CARELESS FAVOUR` | `:641` "an accident or a careless favour" | True |
| Chip `3 · ON PURPOSE STARTS HERE` | `:641` "A small part is deliberate, and it often starts with an approach from outside: money for access" | True, and fair to the learner's pick. Keep |
| Chip `NOW REPORT IT`, v26 | `:605`, `:607` "Anything offered to you, like this approach for access, belongs in the report"; required chip `:556`–`559` | True. "IT" has its object in v26 and its caption |
| Lesson card, v28 | `:629`, `:649`, `:641` "take the facts to the right person" | True, the episode's own words |
| Chip `THE OFFER, AS FACTS`, beat 12 | fact chips `:556`–`575` | True. All four remaining chips are about the offer: m3 |
| v27 | `:5`, `:629` "Your job is not to solve anything" | True |
| v29, beat 13 rows | set order `:233`, `:260`, `:301`, `:325`, `:367`, `:402` | True of three rows of six, and the row order in beat 13 matches the set |
| Hook and end lines | barks `:971`, `:1014` | True, word for word |
| v30, close card | brief "make this week's calls and see where each led" | True |

## Minors

### m1. Beat 6, v24: "his client list" hands Ross the list

Problem. "A leaver wants his client list emailed home." The card on screen says Ross asks for "his accounts ... 'for the handover'". The episode's point about this item is that "the client list belongs to the firm, not to whoever looked after it" (`erb:353`), and the one conclusion it tells the learner to leave out of a report is "Ross is stealing the client list" (`erb:590`). "His client list", with "for the handover" not spoken, leans the narrator towards that conclusion in a trailer whose lesson is "not a verdict on anyone". The repeat of "client list" into v31 is worth keeping.

Fix. v24 becomes "A leaver wants the client list emailed home." Same eight words, same estimate, slow read, start (26.9) and gate (0.44 s). Caption "A leaver wants the client / list emailed home." (25, 18). Change the text in the beat table, VO table, caption list, and the sentence under the VO table that quotes it. No timing change.

### m2. Question 9, v27: recommend keep, and give the owner the better reason

Problem. The script defends v27 only by a risk in the alternative ("be sure" heard as "unsure of your facts"). There is a positive reason in the cut itself: the learner's pick in beat 8 is "Reply to find out who's really behind it". That is an attempt to solve it, and beat 9 shows where it led. "You don't have to solve anything." four shots later answers that pick. "You don't have to be sure." has nothing on screen to answer, because the rumour is gone.

Recommendation: keep v27 as written.

Fix. In question 9, replace "With the rumour story cut there is no mystery on screen, so the sell reviewer offers" with "The learner's pick in the third case is 'Reply to find out who's really behind it', and the line answers it: you report the offer, you don't investigate it. The alternative on offer is". Keep the rest. Add one line to "Notes for the edit": "v27 answers the pick in `pick_offer`; if that pick changes, revisit v27."

### m3. Beat 12 and question 5: the form shot now shows only the right chips

Problem. `t04_concern_form` already hides the three conclusion chips (`.cf-conclusions`, line 17 of the take). `t04c` also hides the two "colleague" chips. What is left is the four chips that belong in the report (`fc_offer_what`, `_when`, `_where`, `_who`), under a chip that says `THE OFFER, AS FACTS`. Nothing is picked, and the form is not scored ("Only the set is scored", `erb:629`), so the brief's hard rule holds. The recipe's spoiler list does name "check-form answers", and this form's submit control is "Check my report". Question 5 asks the owner about hiding the colleague chips but does not say that the result is a screen of correct answers and nothing else. It is the right trade: the two colleague chips are the only place the cut could read as reporting on a colleague. The owner should make it knowingly.

Fix. Add to question 5, after the first sentence: "With the conclusion chips already hidden, the shot then shows only the four facts that belong in the report. The form is not scored and nothing is picked, but it is the form's answer in outline. The alternative, showing all six fact chips, puts 'A colleague has seemed to be having a hard week' in a report form one shot after the lesson." Add the same fact as a fourth bullet in question 8. Recommendation to the owner: agree to hide them.

### m4. Question 8: two give-aways are missing from the list, and the best evidence is not cited

Problem. Question 8 lists three give-aways. Two more belong there:

- v25 "Reply, and they know you might say yes." is the scored offer item's own feedback line, `ifTrusted` at `erb:253`, said from the buyer's side.
- Beat 9 shows "A reply drew more pressure, then a flood of sign-in prompts that night." and row 3 of the inbox four shots later is a sign-in prompt (`e16_mfa_storm`, `erb:301`). The viewer has been told where those prompts come from.

The list also rests on the episode brief and Anjali's welcome. The stronger source is the scored set's own brief, which the learner reads on the set's first screen: "Keep your login to yourself, report what gets offered to you, and deny any sign-in prompt you didn't start." (`erb:146`; the defend twin has the same text at its `:86`). The trailer says nothing the set does not say above its own items.

Recommendation on question 8: yes, accept the reading and keep v29 as written. What the cut withholds is what the set actually tests: the verdict on each row, the "tick what you noticed" tells, and which of the look-alike rows (IT Service Desk, Hana's call) is genuine. None of those is hinted at. The fallback "Then your inbox fills up." would cost the bookend, since Reuben's row is what makes Niamh's ask land.

Fix. In question 8 add the two bullets above, and replace the sentence beginning "The episode tells the learner all three before the scored set" with: "The scored set's own brief says the same above its items: 'Keep your login to yourself, report what gets offered to you, and deny any sign-in prompt you didn't start.' (`erb:146`). The brief and Anjali's welcome say it earlier still. What stays off screen is each row's verdict, every tell, and which of the service-desk and phone-call rows is genuine." Add `erb:146` to the "Sources in the episode" paragraph where the habits are cited.

### m5. Beat 8, v3: "Someone" undersells the outsider (optional)

Problem. The course's selling point is the other side's view. The trailer's case for it is beats 8 and 9, and it works: the card says "An unknown contact", the on-screen outcome shows the buyer's next move, and v25 gives the buyer's reasoning. With sound on and eyes off the card, v3's "Someone offers you money for access." does not say the offer comes from outside the firm, which is the link between "people who already have access" and "on purpose starts here": an outsider needs an insider.

Fix, only if the owner wants it, since v3 is voiced and cached: "A stranger offers money for access." (6 words, estimate 2.73 s, slow read 2.97 s), started 0.1 s after the cut at 35.6, slow end 38.57, gate 0.33 s, 2.2 words/s. Caption "A stranger offers / money for access." The seven-word form with "you" fails its gate (slow end 39.07 from 35.6) and is not offered. Default: keep v3. If kept, no change.

### m6. Beat 3 and question 4: the 40-character bullet is an exception nobody has approved

Problem. The owner's rule is 28 characters per card line. The definition's first bullet is 40 on one line in 16:9. The script argues for the exception under Cards and its R2 disposition T-m6 says it was "flagged to the orchestrator", but no owner question carries it. The same bullet already breaks 20 / 19 in 9:16 and 1:1, so the forced break would make all three aspects match and meet the rule.

Fix. Either add to question 4: "The first line of the definition is 40 characters on one line in 16:9, over the 28-character rule; it breaks 'Harm from people who / already have access' in the other two aspects. Hold it on one line in 16:9, or break it the same way everywhere?" with the default stated; or apply the break in all three aspects now, subject to the check the script already names (that `CaChapter` honours a line break inside a bullet). Recommended default: break it everywhere. Two short lines read faster than one long one under a voice, and the rule then has no exception.

### m7. Episode text changes, row 4: the twin has the same chip, and one more mismatch

Problem. Row 4 says the twin "was not checked for the same chip". It has it: `scenarios/ca16_insider_risk_defend/scenario.json.erb:486` "The message came on Tuesday evening", with the message time "19:42" and no day at `:189`. A second small mismatch sits in the same six seconds of trailer: the choice card quotes the offer as "We pay people at firms like yours for remote access. 25% of what we make. Totally anonymous. Interested?" (`erb:492`) and the inbox message body is "We pay people at firms like yours for remote access. 25%. Anonymous. Interested?" (`erb:239`). Beat 8 shows the first and beat 13's row 1 preview may show the start of the second. The shared opening sentence is identical, so v29 stays true.

Fix. In row 4, replace "the twin `ca16_insider_risk_defend` was not checked for the same chip" with "the twin has the same chip at its `:486` and the same time stamp at `:189`; change both files together". Add a row 7, status "Noted, does not block": "`erb:239` and `:492` quote the offer in two wordings; for the episode review. If row 1's preview in `t05c`/`t05d` runs past the first sentence, the difference is on screen; check the frame."

### m8. "Not checked", last bullet: the quote is in the episode

Problem. The script says the quote "the firm's data left its protection" "was not located and is not cited". It is at `erb:681`, in the safe-pick outcome ("The version where accounts went to a personal inbox: the firm's data left its protection."). That line is one of the "The version where..." lines the cut must never show, so it cannot be an on-screen source, but it is a fair second source for v31, with `erb:353`.

Fix. Replace that sentence with: "'the firm's data left its protection' is at `erb:681`, a safe-pick line that is never on screen; it and `erb:353` support v31." Add both to the v31 clause of "Sources in the episode".

### m9. "What this round does", item 1: "says the same thing" is close, not exact

Problem. Item 1 says the episode "now says the same thing" as the card. The episode's wording is "mostly by accident, sometimes on purpose" (brief, both `mission.json` descriptions, Anjali's line); the card and v21 say "Mostly accidents. Sometimes on purpose." Question 1 then tells the owner "a change here means a change there", which reads as if the two were word for word.

Fix. In item 1 change "The episode now says the same thing" to "The episode now says the same in its own words ('mostly by accident, sometimes on purpose')". In question 1 change "The episode says the same in its brief" to "The episode says 'mostly by accident, sometimes on purpose' in its brief". No change to the card or to v21: "Mostly accidents." is the better card line.

## Owner questions: recommendations

| Q | Recommendation |
|---|---|
| 1 Definition | Keep. It is the clearest twelve words available and matches the episode in meaning |
| 2 Hook | Keep Niamh. The hook is quiet on its own, and the last shot pays it off; the Anjali line set up a hunt for the leaver |
| 3 Chip 3 | Keep `3 · ON PURPOSE STARTS HERE`. It is the debrief's point and does not accuse the learner. `3 · FOR MONEY` does |
| 4 Definition card | Card. With m6's line break |
| 5 Colleague chips | Agree to hide, with m3's sentence added so the trade is stated |
| 6 Inbox shot | Keep. Reuben's row is what makes Niamh's ask an echo |
| 7 Close | As written: v30, the card, `YOUR CHOICES` |
| 8 Give-aways | Yes. Accept the reading, keep v29, add m4's two bullets and the `erb:146` citation |
| 9 v27 | Keep "You don't have to solve anything." for the reason in m2 |

## What holds, so it is not reopened

- **v31** "The client list has left the firm." is true (`erb:680`, `:353`, `:681`), states an outcome and does not overclaim: the twin's debrief says the export "has to be tracked down and recalled" (`defend erb:465`), so a stronger line such as "and it is not coming back" would be false.
- **v30** carries the call to action in the required words and describes what the cut has just shown.
- **Chip 1 over a deliberate pick.** For 4.1 s `1 · BY ACCIDENT` sits over the learner choosing to lend a login. Beat 5 resolves it with "clicked the wrong shortcut" and "wrong click". Leave it.
- **"Not a verdict on anyone" with the rumour cut.** No colleague is under suspicion anywhere in this cut, so the phrase reads as reassurance, which is the direction asked for. Bringing the rumour back to give it a target would bring back the hunt.
- **No reading that staff report on colleagues.** v26 names the offer, the form shot shows only offer facts, and the two colleagues in the inbox are requests made to you. In the episode even reporting Reuben's request ends "nobody is in trouble" (`erb:293`).
- **The attacker's side.** One case in three, 8.4 s, with the buyer's reasoning spoken and the buyer's next move on screen. That is the right share for an episode that is mostly about accidents, and it is the only place the cut can show it truthfully.
- **Balance.** 34.9 s of definition and cases against 17.2 s of defend runs against the recipe's "mostly defend gameplay". The owner's note on round 1 asked for exactly this, and the script says why.
