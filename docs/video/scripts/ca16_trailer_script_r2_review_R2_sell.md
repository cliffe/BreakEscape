# ca16 trailer script r2 rev R1: review R2 (sell and truth)

Reviewed: `docs/video/scripts/ca16_trailer_script_r2.md` at bf85d4324, against `scenarios/ca16_insider_risk/` and `scenarios/ca16_insider_risk_defend/` at e72cd2830, and `docs/video/recipes/course-trailer.md`. Read fresh: the R1 review files were not opened, only the dispositions table in the script. No frames viewed, no take played.

Counts: 0 Blocker, 4 Major, 7 Minor.

## Verdict

The owner's complaint is answered. A first viewer gets the term in twelve words at 9 s, three numbered cases that each end on what happened, one lesson, and a last shot that hands the first case back to them. Nothing reads as "watch your colleagues": the only thing reported is an outside offer, the two colleague chips are out of the form, and v28 says the opposite in so many words.

What is left is four places where the cut is still less clear or less exact than it could be: the third chip, the weak consequence in case 2, a rule reading that the script states too generously, and a spoken close that drops the word the CTA rule asks for.

## Major

### M1. Beats 8 and 9, chip `3 · ON PURPOSE: THE OFFER`

Problem. The definition promises "Sometimes on purpose", and the chip tells the viewer this is that case. What the footage shows is a stranger's message, a curious reply and more pressure. Nobody inside the firm does anything on purpose. The colon leaves the viewer to work out how "the offer" relates to "on purpose": is the offer the deliberate act, or is replying? The episode has the missing link in its debrief card ("A small part is deliberate, and it often starts with an approach from outside: money for access") and the trailer never says it. v25 then says the same thing from the buyer's side, so the chip only has to set it up.

`3 · FOR MONEY`, the script's short alternative, has the same gap and adds a worse one: it sits over the learner's own pick, and nobody takes money.

Fix. Chip on shots 8 and 9: `3 · ON PURPOSE STARTS HERE` (26 characters, one more than now). It is fair to the pick as well, because the episode says a reply "marks you as someone who might say yes" (`scenario.json.erb`, the offer's `ifTrusted`). If 26 characters crowd the panel at the first frame check, use `3 · FOR MONEY` in all three aspects as already planned, and accept the gap. Update the Chips paragraph and "Why this order works" to: "the third chip marks where the on-purpose kind begins, an offer from outside".

### M2. Beat 7, v12 "The client list sat in a personal inbox."

Problem. Direction for this round is each case with its consequence. Cases 1 and 3 have one a non-specialist feels (your name on someone else's click; they now think you might say yes). Case 2's spoken consequence is a location. "Sat in a personal inbox" leaves a first viewer asking "and?". The part that makes it a consequence, "outside the firm", is on screen but not in the voice or the caption, and the caption is what the silent viewer follows.

Fix. Replace v12 with a new line (new id, to voice): **"The client list has left the firm."** Seven words, estimate 3.15 s, slow read 3.47 s, start 31.5, slow end 34.97, gate 0.53 s, 2.2 words/s. Caption: "The client list / has left the firm." True of the episode: "sat in a personal inbox outside the firm" and "the firm's data left its protection" (`flipMontageByChoice.leaver_favour`). It also answers "leaver" in v24. Cost: one more line to voice; v12's cached clip is no longer used.

### M3. Beats 10, 13, 14 and owner question 8: the script says no scored item is answered, and that is not quite so

Problem. "How 'no answers on screen' is read here" ends: "No scored item is opened or answered." Three things in the cut go further than that sentence admits:

- The offer is row 1 of the scored inbox, and its correct handling is to report it. v26 says "Now you report that offer", and the pick card shows "Screenshot it and send it to security" as the unpicked row.
- v29 says "Then the same requests come back" over a list whose rows 2 and 4 are Reuben's login request and Ross's export. The trailer has just shown where lending and exporting led.
- Niamh's ask in the last shot is the tracked step-away choice (`kit_ca16_signin_choice`, and `kit_key_caught` is fed by the login item). Case 1 is its answer.

I think this is acceptable. The episode itself tells the learner all of it before the scored set (the brief says "keep your access to yourself, report what's offered to you"; Anjali says "Keep your login yours, tell me what gets offered to you"), and the trailer shows no tell, no verdict button and no tally. A trailer for this episode that withheld "report an offer, keep your login" would have nothing to say. But the owner should approve that with the facts in front of them, and question 8 as written does not give them.

Fix. Replace the last sentence of "How 'no answers on screen' is read here" with: "No scored item is opened and no verdict is shown. The cut does give away the pattern behind three scored items: an offer gets reported, a login is not lent, a handover does not go to personal email. The episode says all three in its brief and in Anjali's welcome, before the scored set." Add to question 8: "The narrator says 'Now you report that offer' and 'Then the same requests come back'; the offer, Reuben's login request and Ross's export are scored inbox items, and Niamh's ask is the tracked room choice. The episode states these habits before the set. Is giving the habit away in the trailer acceptable?" If the owner says no, v29 becomes "Then your inbox fills up." (5 words, fits the window) and `t05c`/`t05d` blank Reuben's preview again; v26 has to stay or the lesson has no object.

### M4. Beat 15, v30 "Make the choices, see where they lead, on Hacktivity.co.uk."

Problem. The plate carries "Learn on Hacktivity.co.uk", so the rule is met on screen. The voice is not: it gives the address without "Learn", and the line sells only the first half of the episode (choices and outcomes). A listener hears nothing about learning to handle it, which is the product. The line is being voiced fresh anyway, so matching the CTA costs nothing.

Fix. v30: **"See where your choices lead. Learn on Hacktivity.co.uk."** Eight words, estimate 3.58 s, slow read 4.26 s with the stop, start 66.8, slow end 71.06, gate 1.34 s, 2.2 words/s. Caption on three lines: "See where your / choices lead. / Learn on Hacktivity.co.uk." (14, 13, 26). The close card keeps "Make the choices" / "See where they lead" above the plate. If the owner reads the CTA rule as plate-only, v30 as written passes and this drops to Minor; I would still change it.

## Minor

### m1. Beat 6, v24 "A leaver wants his accounts emailed home."

"Accounts" straight after a login case reads as user accounts. The card has the same wording, and the next shot clears it up, so this is four seconds of doubt. Fix: "A leaver wants his client list emailed home." (8 words, slow read 3.96 s; start it at 26.9 by taking 0.1 s from `led_login`, whose gate is 1.04 s, for a 0.44 s gate). Caption "A leaver wants his client / list emailed home." (25, 18). Take it only with M2's line, where "client list" then lands twice on purpose: asked for, gone.

### m2. Beat 10, chip `YOUR TURN`

The narrator has said "your login", "your name" and "you" for thirty seconds; it has been the viewer's turn all along. Fix: `NOW REPORT IT` (13), which says what the second half is.

### m3. `define` card tab and seat label `YOUR CALLS`

The script drops v13 because "nothing earlier in this cut says 'calls' to the viewer", yet the tab on the `define` card and the left seat label read `YOUR CALLS`, and the close card says "choices". Fix: tab and left seat label `YOUR CHOICES` (12) for this episode, or keep `YOUR CALLS` and correct the claim in the v13 fallback paragraph.

### m4. Card says two kinds, chips count three

"Mostly accidents / Sometimes on purpose", then 1, 2, 3. It reads acceptably because chip 2 says "careless" and the debrief groups it the same way ("an accident or a careless favour"). No change recommended; a third body line would break the twelve words. Worth a line in question 1 so the owner sees it was a choice.

### m5. Beat 12, v27 "You don't have to solve anything."

True and the episode's own phrase, but with the rumour story cut there is no mystery on screen to solve. Optional: "You don't have to be sure." (6 words, same window), from the debrief's "You don't have to be sure; you do have to be fair." It answers the pick the viewer just watched, "Reply to find out who's really behind it". Either is fine; keep v27 if the owner likes it.

### m6. Beats 12 and 13, "Tuesday evening" against 19:42 with no day

Still open as row 4 of "Episode text changes requested". Both are on screen within six seconds. Not a trailer fault, and nobody will catch it at speed, but the cheapest cure is the episode one: "The message came in the evening, at 19:42". Ask for it before `t04c` is recorded so the retake does not have to be repeated.

### m7. Sources paragraph after e72cd2830

The script cites the episode at 1d161f53c. e72cd2830 moved Anjali's definition up to her first line and added "it often starts with an approach from outside" to the debrief card. Re-check the `ink/anjali_rao.ink` line numbers (the definition is now the line before "This week someone's leaving"), cite e72cd2830 in "What this round does" item 1, and name the debrief sentence as the source for chip 3.

## Checked and found sound

- **Definition.** Twelve words after the term. Matches the brief, both versions of Anjali's welcome ("Mostly by accident, sometimes on purpose") and the debrief card. "Mostly accidents" for "mostly by accident" is a fair shortening.
- **Truth of the other lines.** v22 (Reuben card), v23 ("clicked the wrong shortcut ... under your name, on the record"), v3 (offer card), v25 (`ifTrusted`: "marks you as someone who might say yes"), v26 (the form's one required fact is the offer), v28 ("facts, not a verdict on anyone" in the brief and debrief), v29 (inbox order is the offer, Reuben, a sign-in prompt, Ross, IT Service Desk, Hana; confirmed in the set). The three on-screen first sentences are word for word.
- **Chips 1 and 2.** `1 · BY ACCIDENT` sits over a deliberate lend for four seconds and is paid off by "clicked the wrong shortcut"; fair. `2 · A CARELESS FAVOUR` is the debrief's phrase and kinder than any alternative.
- **Reporting on colleagues.** No such reading survives. The thing reported is an outside offer; `THE OFFER, AS FACTS` names it; the colleague chips, conclusion chips, rumour and Samira cards and the launch paragraph are all excluded. "Not a verdict on anyone" tells the viewer this is not about accusing people. Keep "on anyone".
- **The outsider's side.** One beat (v25) and it is the best line in the cut. For a consequence-first episode the recipe says never to claim an attacker to play, so one beat is right. M1's chip makes that beat easier to read.
- **Hard rules.** No verdict buttons, tells, advisory lines or tallies in any specified window (the offer card's advisory second sentence is trimmed; the "0 of 6 sorted" header is handled per aspect). VO at or under 2.7 words/s. No em dashes in VO. Every card, chip and caption line is 28 characters or fewer, including the fixes above. UK English. No "Break Escape". CTA plate correct; spoken form is M4.
- **Proposed rules.** Term in 12 words: met. One stated lesson: met (v28; v26 names its object, v27 reassures). No in-game terms: met apart from m3. Defend half opens on the trick from the first half: met, the offer.

## Recommendations on the owner questions

1. **Definition wording.** Keep. It now matches the episode in three places.
2. **Hook.** Keep Niamh. The Anjali line sets up a hunt for the leaver, which is the muddle the owner named.
3. **Third chip.** Neither option as offered. `3 · ON PURPOSE STARTS HERE`; `3 · FOR MONEY` only if it will not fit (M1).
4. **Definition on a card.** Card. Speaking it over the first choice asks a silent viewer to read two things at once, and this is the one line the round exists for.
5. **Hiding the two colleague chips.** Agree. In the episode they are there to be left out; a trailer cannot explain that.
6. **Inbox shot.** Keep, subject to the answer on question 8 (M3). It is the only look at the scored half and it sets up Niamh.
7. **Close.** A fourth option: "See where your choices lead. Learn on Hacktivity.co.uk." (M4). Not v13.
8. **Rules.** Confirm all four proposed rules. Confirm the "no answers" reading only with the fuller statement in M3.
