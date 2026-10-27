# m10 Full Disclosure: stage 6 review, round 1 (writing)

## Scope and what was read

Reviewer: fresh, read-only, writing lens only. Subject: `lore_fragments.md` (stage 6 draft 1, 1,212 lines). Read against `docs/agents/FINALE_BRIEF.md`, `story_design/story_dev_prompts/06_lore_fragments.md`, m10 `stage_2/storytelling_elements.md` §2 (Tesseract's voice), m09 `stage_6/lore_fragments.md` (shared documents: `mirror_job_printout`, the Albion notice, the lease file), m07's `m07_architect_comms.ink` (his handset voice), and the shipped readables and credits in `scenarios/m07_architects_gambit/scenario.json.erb` and `scenarios/m08_the_mole/scenario.json.erb`. README "Closing card and credits" for the format. No VM material opened. Conditions, ids and engine claims were not re-checked (a structure reviewer covers those); a condition is mentioned here only where it changes which words a player reads.

Mechanical checks over the whole file: no em dashes in any player string, none of the banned words, no "Quantum", "Cabal" or other eldritch content (the teaser slot is wired empty on E1–E3 and E5 and nothing else anticipates it), "Ghost Protocol" absent from player text. "Dr" without a full stop throughout. The 92,460 total matches m08's catalogue (47,239 + 12,847 + 8,923 + 23,451).

Line references are to `lore_fragments.md`.

## Findings

No blockers. Seven majors, eighteen minors.

### Major

**W-01 (major). The incident file gives away the core's reveal at the first table.** L50, `incident_file` item 3. "It ends at the coordinate on the Montana order, and it is still open from that end. Whoever holds that end can reach the master." This is the forward post, the first readable of the night. The same fact is the core index's "vault line: Open. Their end is the Citadel." (L491) and HaX's flag-4 line "We left it open." A reader gets the whole thing in room one, so the later two only repeat it. The section also explains itself in a two-step "was not closed. It was watched, so that…" (the negative-parallel shape the style rules ban). **Fix:** at the forward post Netherton states the decision and nothing more: the line was left open and watched, on his signature, and it has been followed to Montana. Leave out "still open from that end" and "can reach the master" so the core index and HaX can say them. That way the forward post sets the question ("we left a door open") and the core answers it ("and it's still open, and it reaches us"). Rewrite in the passages section, P1.

**W-02 (major). The closing card reads as a status board.** §3.2, L738–811. Every card is four or five lines, and up to five of them follow one pattern, `Label: verdict.`: "Dr Adrian Tesseract: in a cell." / "The database: in the vault…" / "The head start: stopped." / "Cells broken: two…" / "Dispatch in eleven counties: still dropping calls." Five lines in the same shape, each about the same length, is what the user's rules call uniform rhythm, and the card is the one screen meant to land. The credits under it already use `NAME: clause` for over twenty lines, so the card adds nothing new in form. **Fix:** at most two lines keep the colon (the Architect and the database work as headlines). Write H, C and U as sentences, and let H be short where it can be. Several H values already have the right words in Tesseract's arrival lines (stage 2 §2.4): "Nothing went at four." / "Two cells have it." / "Zero Day has it." Reusing them makes the card answer him. P2 has a full card.

**W-03 (major). Human line 1a isn't human, and it repeats D.** L802. "Dispatch in eleven counties: a vendor workaround by the weekend. The fix is due in ninety days." It only shows on `disclosed` saves, where D has just said "Fixes due in ninety days." (L753), so "ninety days" appears twice on a five-line card. Then ELSEWHERE says it a third time (L1039) and the Carrow line a fourth (L1045). It's also a patch schedule, not a person, which loses the reason the line beats Albion and the forty-seven in the precedence. **Fix:** 1a becomes "Dispatch in eleven counties: calls getting through again by the weekend." (people reached, no date). Keep "ninety days" in D only, and give Carrow its own figure ("A fix is out by spring."), or just "Told nine years late."

**W-04 (major). ELSEWHERE repeats the card.** §3.5, L1039–1049. The section says it holds "every human line the card may have passed over… each once", but its conditions don't exclude the line the card did choose. On an Austin-uncovered save the dispatch line prints on the card and again in ELSEWHERE, and the same goes for the forty-seven and for Elena Torres. Separately, Victoria's `confronted` clause "The tap on Zero Day's brokers went dark at five." (L981) is repeated in ELSEWHERE as "The tap on Zero Day's brokers: dark since five." (L1060). Seeing the same sentence twice within a minute tells the player they're watching a template. **Fix:** give each ELSEWHERE copy of a U line the negation of the card's precedence for that line (stage 9 has the constants already), or change the wording so the second appearance adds a fact (for example, the card says "Elena Torres is in treatment. It's working." and ELSEWHERE, when the card took it, says nothing). Remove the ELSEWHERE tap line, since Victoria's clause carries it.

**W-05 (major). ELSEWHERE is a roll-call with no ending.** §3.5. A full-season save prints up to about fifteen lines (dispatch, Albion ×2, the forty-seven, Elena, the Recruiter, the placements, Seattle's batch, the utilities, Social Fabric ×2, Zero Day, Reeves, Hollis, Static, Vance) in table order, so the season ends on whichever loose end happens to be last, usually Static's tool roll or Robert Vance. The brief asks for this block to be moving, not a list. Each line is good on its own; the order is the problem. **Fix:** put it in three movements and keep them in that order. (1) What is still out there: Zero Day, the Recruiter, Reeves, Hollis, Static, Vance, Social Fabric. (2) What the night did to systems: Seattle's batch, the utilities, Albion, Carrow, the placements. (3) People, last: dispatch, the forty-seven, Elena Torres. The last thing on screen is then a person who is better or worse off because of a choice. With W-04's fix, movement 3 holds only the person-lines the card passed over. Where none is left, close on movement 1's "Zero Day: still trading.", which is a better last line for a season than Static.

**W-06 (major). IN THIS OPERATION repeats stock phrases until they read as a list.** §3.3. "Swept up at six." ends seven clauses (Imran 5, Voltage 8, Asante 4, Mercer 2, Vos 3 and 4, Fonoti 2). A quiet save where the player talked to few people prints five or six of them in one block. "Put on the floor…" opens thirteen clauses. The repeated KO wording is deliberate (every knock-out admitted, SE §9) and works as a sting for two or three lines. "Swept up at six" just becomes filler. The brief's test is whether a clause reads as a consequence, and the repeated ones read as status codes. **Fix:** keep "Swept up at six." for one person (Fonoti's "card or no card" is the best of them) and give each of the others a fact only they could have. P4 has rewrites for Imran, Voltage, Asante, Mercer and Vos.

**W-07 (major). The surrender card's cells line counts couriers as a cell.** L775, L794, L1015–1016. "Cells broken: three, among them the cells' couriers." Couriers and a quartermaster are functions, not cells, so "cells… cells'" in one short sentence reads like a mistake on the best ending's card. THE CELLS then lists "The cells' couriers: rolled up." and "Their quartermaster: rolled up." under a heading that says cells. **Fix:** on surrender, name what his protocol gave up instead of counting it as cells: "His protocol gave up their couriers and their quartermaster. Cells broken: one more." Or keep the count and change the name to "ENTROPY's couriers". In THE CELLS: "ENTROPY's couriers: rolled up. His protocol." / "ENTROPY's quartermaster: rolled up. His protocol."

### Minor

**W-08 (minor). Asante's coded note has no reason to exist.** L296. "Recovery counted twice, hospital rows. True range 2,100 to 3,600. My model is on the bench terminal, key DOUBLECOUNT. Abena Asante". She has already corrected the sheet openly (L277), so who is the encoded note for, and why sign it with her full name? The decode is the finale's only hands-on puzzle outside the VM, and what the player gets for it is a person. One clause of address would make her a quiet whistleblower and explain her "talked" branch. **Fix:** see P6.

**W-09 (minor). The core index slips out of his voice.** L497–498, L483. "Server left running in Helena, on purpose." and "Drafted nine years ago." A man who "uses numbers exactly" (SE §2.1) dates his own files and doesn't explain his motives to himself. "By someone else" (the `albion_notified` variant) is the author speaking. **Fix:** P5.

**W-10 (minor). "reading, 0x00" can be read two ways.** L499. In lower case and filed under the player's number, it reads like a psychological reading *of* 0x00 as easily as his Reading kept *for* 0x00. If the ambiguity is deliberate, keep it. If not: "Reading, for 0x00    A copy. The original went to Helena."

**W-11 (minor). The alarm log's one relative date.** L256. "Twelve days ago." in a log whose other entries say "Refit, week 34." and "Day 12, 20:00." The author's clock has got into the guard's book. **Fix:** "Day 1. Reader table reloaded…" (the four-site night is day 1 if tonight is day 13; stage 9 to confirm against OT's day count).

**W-12 (minor). UK words in American paperwork.** §0 says in-world American paperwork keeps American usage (and m09 stage 6 L13 applies that to spelling and words as well as place names). The bunker's guards and fitters are American hires, but their documents say "NIGHT ROTA" (L134), "GALLERY. NIGHT SHIFT" under the name "rota" (L232 ff.), "The kettle stays on the post." (L140), "FITTER. SPARES." (L260); Social Fabric's American headline copy says "a rural data centre" (L433) and "RELEASE ROTA" (L438); and the 1962 US drawings say "Plant room" (L93), which also cuts across §0's own "the power room, never the plant". **Fix:** in the document texts, ROTA → ROSTER (or SCHEDULE), kettle → coffee pot, FITTER. SPARES → MAINTENANCE. SPARES, data centre → data center, "6. Plant room." → "6. Power room.". The object names in the UI ("Tunnel Post Rota", "Fitter's Locker") are SAFETYNET's view and can stay UK. Nightshade's "DEFENCES" and Netherton's file are British and stay as written.

**W-13 (minor). The security office says "let them through" three times.** `wanted_photo` (L160: "0x00: to the core. Do not detain."), `duty_board` (L178: "Let them through to the core. Do not detain them."), and `alarm_panel` 3 (L193: "told to let you through"), all in one room. The photo in his hand is the strong one. **Fix:** the duty board's order points to the photo and keeps its own new fact: "From the top: the agent in the photo goes through to the core. Nobody else gets through."

**W-14 (minor). Nightshade's payment states the rules of the puzzle.** L586. "Refit work is marked as refit. Everything else is the 1962 build." That's the designer making the check fair, and it shows. **Fix:** P7 says the same thing in his voice.

**W-15 (minor). HaX's surrender clause is unclear, and the credits can't decide who the player is.** L845. "Sat with him in the van for a minute. Told him who taught you." Who told whom? (It reads as HaX telling Tesseract that she taught the player, but "who taught you" could equally be about Tesseract.) Across §3.3 the player is "0x00" (Netherton 1), "her agent" (HaX 6–7), "his own agent" (the KO clauses) and "you" (Vector 5, Vance, HaX 5). **Fix:** pick one: third person ("0x00" / "her agent"), as m07's shipped credits do ("AGENT 0x00: Defended the call"). Then HaX 5 as P10. Vector 5: "Declined the raid. Said 0x00 would know why." Vance: "Robert Vance: said no again."

**W-16 (minor). One phrase too many: "one word" and "you would know why".** HaX "Sent one word." (L840), HaX "Said one word." (L841), Nightshade "Said two words." (L858), Nightshade "Said one word, from the van." (L859). Only one of the HaX pair prints on a save, but next to Nightshade's it starts to sound like a device. "He said you would know why" (L867) and "Said you'd know why" (L1067) can print on the same save. **Fix:** quote Nightshade's words where they are short enough (stage 2 has them: "Manual." is the silent branch's one word), e.g. Nightshade 9: "Said 'Manual.' from the van. Nothing else." Vance as W-15.

**W-17 (minor). A stage direction inside the duty board.** L185. "Gate: two, hut and fence. R. Hollis (photo pinned), and one." The parenthesis is the author describing the board. **Fix:** describe the photo in the observation ("A photo pinned beside the gate line.") and keep the text as the board would read: "Gate: two, hut and fence. R. Hollis, and one."

**W-18 (minor). The shutter isolator's default is a hint written as narration.** L347. "Whoever runs this room can cut it, or someone on the line can talk you through it." (RL's wording, but it ends up on screen from this file.) **Fix:** "A key switch and a breaker row, labelled GALLERY SHUTTER. The key is in it." The talk-through belongs to HaX and Voltage.

**W-19 (minor). The bench copy has three additions, not two.** L266 says a player who read m09's sheet "sees the same page with two additions". There are three: the new header "Printing 3. Refit model.", the margin note, and "Seen. -- A." Correct the count. Also check that "A.A." next to "-- A." doesn't read as the Architect correcting himself. If playtests show it does, "A. Asante" in the margin still leaves the decode the corrected range and the key.

**W-20 (minor). Stock phrase at the gate.** L119. "and someone who'd rather be anywhere else". **Fix:** "A radio playing low inside, and a man in a parka reading the same page of a paperback."

**W-21 (minor). Join's ELSEWHERE is the full section.** L1083. After "MISSION FAILED" and "CORRECTED: 2,100 TO 3,600.", the save's good news still rolls ("The forty-seven: every one of them reached in time.", "Elena Torres is in treatment. It's working."). That could be poignant, but nobody chose it. **Fix:** decide on purpose. Either Join's ELSEWHERE keeps only what is still out there (movement 1 of W-05), or it keeps the person-lines and ends on one, with the irony intended.

**W-22 (minor). Wendell's two long clauses.** L959–960. "Put on the floor at his own panel. Dale walked into the raid at shift change; home by morning." and "Never told. Asked if he still gets paid for the week. Dale walked into the raid at shift change; home by morning." Three sentences and a semicolon in a credit clause. **Fix:** "Never told. Dale walked into the raid at shift change." / "Put on the floor at his own panel. Dale walked into the raid." The "paid for the week" joke can be his bark.

**W-23 (minor). Asante's default clause is vague.** L972. "Swept up at six. She'd write it again." Write what: the correction, or the model? **Fix:** with W-06, "Taken in with her corrected model in her bag."

**W-24 (minor). Netherton's incident file item 4 ends weakly.** L52. "Replacements are being sourced elsewhere." is passive, and it's the line that sends the player to Gallatin's batches. **Fix:** "Stores will buy elsewhere. They have not yet said where."

**W-25 (minor). The forward post's projection desk default.** L103. "Set up for numbers nobody asked for." This is good, but it shows on every non-`hardened` save, where the desk is dark and holds nothing. The player may click again expecting something. Keep the line, and give the text one more word so it's clearly empty: "The screen is dark. Nobody asked it anything."

## Worst passages, with rewrites

**P1. The incident file, item 3** (W-01, L50).

> 3. The decision. The door was not closed. It was watched, so that it could be followed to wherever the copy went. It has been followed. It ends at the coordinate on the Montana order, and it is still open from that end. Whoever holds that end can reach the master. Risk accepted, on my signature.

Rewrite:

> 3. The door. Left open, under watch, to follow the copy. Followed to the coordinate on the Montana order. Risk accepted, on my signature.

(The core index then says "Open. Their end is the Citadel." and HaX's flag-4 line says the rest.)

**P2. A full card, arrest, secured, head start stopped, two cells, Austin uncovered** (W-02, W-07, §3.2).

> Dr Adrian Tesseract: in a cell. Awaiting trial.
> The database: in the vault, both copies. Infusion pumps in 140 hospitals: still unpatched.
> The head start: stopped. The cells got nothing.
> Cells broken: two, among them Zero Day's UK desk.
> Dispatch in eleven counties: still dropping calls. Day thirteen.

Rewrite:

> Dr Adrian Tesseract: in a cell, awaiting trial.
> The database: back in the vault. Infusion pumps in 140 hospitals are still unpatched.
> Nothing went at four.
> Two cells broken. One was Zero Day's UK desk.
> Dispatch in eleven counties is still dropping calls. Day thirteen.

(Every piece is still a fixed string per condition; only the shapes vary. "Nothing went at four." is his own arrival line, so the card answers him.)

**P3. Human line 1a, on a disclosed save** (W-03, L753 with L802).

> The database: with the vendors. Forty have acknowledged. Fixes due in ninety days.
> …
> Dispatch in eleven counties: a vendor workaround by the weekend. The fix is due in ninety days.

Rewrite of 1a:

> Dispatch in eleven counties: calls getting through again by the weekend.

**P4. IN THIS OPERATION on a quiet save** (W-06).

> IMRAN SIDDIQUI: Never asked. Swept up at six.
> VOLTAGE: Swept up at six.
> DR ABENA ASANTE: Swept up at six. She'd write it again.
> DR JAMES MERCER: Swept up at six.
> PIETER VOS: Named. Swept up at six.
> SIONE FONOTI: Swept up at six, card or no card.

Rewrite (Fonoti keeps the phrase):

> IMRAN SIDDIQUI: Never asked. Still at his bench when the team came down.
> VOLTAGE: Found in the cable run behind the switchgear.
> DR ABENA ASANTE: Taken in with her corrected model in her bag.
> DR JAMES MERCER: Arrested on the uplink, mid-sentence.
> PIETER VOS: Named. Arrested with Zero Day's order still in his pocket.
> SIONE FONOTI: Swept up at six, card or no card.

(Details are the reviewer's guesses at what fits each person; the author should swap in true ones from SE §3.6.)

**P5. The core index** (W-09, L483, L497–498).

> beta              Closed. Server left running in Helena, on purpose.
> notice, albion    Drafted nine years ago. Not sent.
> (variant) notice, albion    Drafted nine years ago. Sent from Helena on day 12, by someone else.

Rewrite:

> beta              Closed. Server left running in Helena. For whoever came.
> notice, albion    2017. Drafted. Not sent.
> (variant) notice, albion    2017. Drafted. Sent from Helena, day 12. Not by me.

**P6. Asante's decoded strip** (W-08, L296).

> Recovery counted twice, hospital rows. True range 2,100 to 3,600. My model is on the bench terminal, key DOUBLECOUNT. Abena Asante

Rewrite:

> For whoever comes for him. Recovery counted twice, hospital rows. True range 2,100 to 3,600. My model is on the bench terminal, key DOUBLECOUNT. A. Asante

(The string must be re-encoded and re-checked against the B2 list. "Abena Asante" can stay if the decoded form needs her full name for the rebuttal's "Asante corrected your sheet".)

**P7. Nightshade's payment, header** (W-14, L585–586).

> TOMB GAMMA. THE DEFENCES, AS HE BRIEFED THEM TO ME.
> Each with the catalogue entry it was built from. Refit work is marked as refit. Everything else is the 1962 build.

Rewrite:

> TOMB GAMMA. THE DEFENCES, AS HE BRIEFED THEM TO ME.
> Where he rebuilt, I've said so, with the catalogue entry he built it from. The rest is as the Americans poured it in 1962.

**P8. The alarm log's reader entry** (W-11, L256).

> Twelve days ago. Reader table reloaded from a new personnel table: 1,206 SAFETYNET badges. The service door takes any of them. Blast door 1 takes one, by name.

Rewrite:

> Day 1. Reader table reloaded. New personnel table, 1,206 SAFETYNET badges. Service door: any of them. Blast door 1: one, by name.

**P9. The duty board's order and the Hollis variant** (W-13, W-17, L178, L185).

> From the top: one SAFETYNET agent is expected tonight. Let them through to the core. Do not detain them. Nobody else gets through.
> Gate: two, hut and fence. R. Hollis (photo pinned), and one.

Rewrite:

> From the top: the agent in the photo goes through to the core. Nobody else gets through.
> Gate: two, hut and fence. R. Hollis, and one.

**P10. HaX's surrender clause** (W-15, L845).

> AGENT HAX: Sat with him in the van for a minute. Told him who taught you.

Rewrite:

> AGENT HAX: Sat with him in the van for a minute. Told him what she'd taught 0x00 that he hadn't.

## What works

Keep these when the fixes go in.

- **The workshop reads as his, with no lecture in it.** The alarm log is the best document in the file: "Camera not wired. Do not wire it." and "On the test sheet, in his hand: Both copies, or nothing." show a careful man who builds his own way out, and nobody says so. The cracker rack's "A batch sticker inside each battery door: G-19." lands the supply chain with a sticker.
- **The casualty sheet chain** (sheet → strip → model) is the evidence the 06 prompt wants, and it's personal: "Under it, in the first hand: Seen. -- A." and "He thanked me. He signed the old number." are the two best lines in the file. They set up the first rebuttal without stating it.
- **Tesseract's voice holds.** Short, exact, courteous, and in his own hand only a handful of times (the photo, the test sheet, "Seen.", the index, "Afterwards, then."). It matches stage 2 §2.1 and the m07 handset ("I prefer to watch"). W-09 is the only slip.
- **The raid's paperwork sounds like paperwork.** The sign-out sheet, the door log ("alarm silenced at this desk, standing order") and the gallery rota are dry and exact, and the clues sit inside them without being pointed at. The whodunit's paper names nobody next to WREN, as §5 claims.
- **Threads paid off as objects, not name-checks.** Reeves "on leave tonight. Back day 14."; "POSTS UNMANNED: BUDGET… Do not ask again." for the m06 freeze; Seattle first in red tape on a Cold War board; "SAFETYNET disposition: retain." on entry 0001; Nightshade's payment ending on his m08 line. Each one is a choice the player made, turned into something in the room.
- **The executed screen** (L557–563) is the hardest-hitting thing in the mission: the one true paragraph, with no narrator line.
- **Join's card and credits** are right as they are: three lines, then "HIS FIGURE." and "CORRECTED: 2,100 TO 3,600." The cost is on screen with no comment.
- **Many credit clauses are excellent:** "Ran comms all night. His badge didn't." / "Rang his mate Dale. Dale stayed home." / "Went home. So did a friend." / "Consultant, SAFETYNET. Put on the floor by the agent who saved his career." / "Gone by the service door. He left a card." W-06 is about the stock phrases around them, not about these.
- **The card's D lines** are strong, especially secured's "Infusion pumps in 140 hospitals: still unpatched.", which carries the hoarding argument into the last screen.
- **Mechanics:** no em dashes, no banned vocabulary, no eldritch content, and the card is exactly one line per block, so the five-line cap never cuts anything.

## Verdict

**Revise, then round 2.** No blockers. The documents are the strong half: a careful villain's workshop and a raid's paperwork, carrying clues without lecturing, in a consistent Tesseract voice. Two lines tip into explaining (W-14, W-18), and one document, the incident file, reveals too early (W-01).

The closing sequence is the weak half, and all seven majors but W-01 are there. Each card fits in five lines, but it reads as a status board (W-02, W-07, and W-03's repeated "ninety days"). The "In this operation" clauses are mostly real consequences, but repeated stock phrases flatten them into a list on quiet saves (W-06). ELSEWHERE repeats the card and has no shape or last line, so it ends as a roll-call (W-04, W-05). The human-line precedence picks one line correctly and S6-11 is a sound change, but 1a isn't a human line.

The m01–m09 threads are paid off as objects and outcomes, not name-check lists. m01 and m06's Satoshi are carried in Tesseract's dialogue rather than in documents or credits, which is fine. No eldritch content outside the empty teaser slot. The US/UK slips are all one kind: British words in American staff's paperwork (W-12).

Round 2 should check the rewritten card on three saves (a rich arrest, a thin surrender, Scorched Earth), read a full ELSEWHERE in its new order, and check that no clause phrase appears more than twice in one IN THIS OPERATION block.
