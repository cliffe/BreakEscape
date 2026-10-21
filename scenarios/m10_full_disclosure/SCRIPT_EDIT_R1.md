# m10 "Full Disclosure": script edit, round 1

## Verdict

**Revise.** There are no blockers. Everything compiles, the lint shows no errors, and loopcheck is clean on every hub I drove. The finale works as drama: his case and the three exchanges argue properly, every ending has a beat of its own, and the cold ending is heavy without anyone gloating. Seven majors stand between this and ship, and all of them are small edits:

1. 06:00 opens "at six" and ends with the screen turning to six (A-01).
2. Kowalczyk's credit says "Badge still active" on saves where she was taken at the core (A-02).
3. The WREN reveal at the core gets no reaction from anyone (A-03).
4. The Join epilogue's opening image doesn't hold up (A-04).
5. HaX's accusation list puts the right name first (B-01).
6. On the `taken` route, one of Kowalczyk's C18 answers quotes a laugh the player never saw (B-02).
7. Netherton's casualty line in the briefing reads like notes (B-03).

Counts:

| Group | Blocker | Major | Minor | Total |
|---|---|---|---|---|
| A | 0 | 4 | 22 | 26 |
| B | 0 | 3 | 11 | 14 |
| C | 0 | 0 | 10 | 10 |
| **All** | **0** | **7** | **43** | **50** |

The cross-read rulings (R-1 to R-7) are counted inside these numbers, under the file whose line changes.

The five that matter most: A-01, A-02, A-03, B-01, B-02.

## What was run

- **Compile:** all 33 `.ink` files, compiled to copies in the session scratchpad (the repo's `.json` files are untouched). No errors, no warnings, no loose ends.
- **dialoguelint** (`scenarios/m10_full_disclosure/`): 0 errors. Rules hit: blank-reentry 14, stage-cue-in-info 5, not-x-but-y 2, crowded-hub 1, us-spelling 1, stage-cue-density 1. Each is ruled in "Structure" below. Every file still shows `[person, unmapped]`, so I checked the phone cap and the phone prefixes by hand.
- **loopcheck** (200 steps × 6 strategies): `tesseract` (cold, and with all four flags and `core_greeted`), `six_oclock` (`arrest`; `scorched` + `both_wiped`), `agent_0x99` hub (flag 2 + door log), `director_netherton`, `kowalczyk` `so` with the door log, `nightshade` (unshown), `ghost_call`, `voltage` (escaped + sheet read). No runtime errors.
- **voicelines.mjs** on the five call files: HaX's calls about 29 distinct lines (plus her text hub), Ghost 26, Vance 10, Elena 10, Victoria 7. Total about 82, against the contract's 80.
- **Word caps:** no phone line over 25 words (the longest is HaX's `hatch_topic` at 25, which is text). No choice over 14 words.
- **Operators:** no `&&` or `||` in ink. `credits_sections.json` uses `&&` only, with no parentheses.
- **Read in full:** every m10 `.ink`, `credits_sections.json`, CONTRACT.md and FINALE_BRIEF.md. I also read the relevant parts of the voice bible, SE §2.2 and §3, MC §6.5, S6's bypass-panel and credits rows, the m07 `m07_architect_comms.ink` lines, m08 Netherton's forms of address, the m09 briefing ("stores" / "The long way is over.") and m04's debrief and Voltage ink for the callbacks. I did not open any VM material.

## The cross-read points: rulings

**R-1. Netherton naming the player. Ruling: the contract rule is wrong. All four lines stay.** CONTRACT §1.2 says only HaX and Tesseract may say "0x00" or "Agent". The shipped voice disagrees. The voice bible says Netherton "opens with the agent's designation" (its canonical m02 line is "Agent 0x00. Magnus Netherton -- I run this shop."), and m08's `m08_director_netherton.ink` calls the player "Agent" at L87, 108, 110, 139, 203, 222, 247, 373, 380, 394 and 436. A Director suspending an agent or ordering them into custody would use the designation. The rule exists to stop anyone giving the player a personal name or a gender. Reword it as: "Nobody uses a personal name or a gendered word for the player. SAFETYNET people may say 'Agent', 'Agent 0x00' or '0x00'." So `m10_tesseract.ink:825` "Agent.", `m10_six_oclock.ink:502` "Agent 0x00.", `:529` "Take 0x00 to the second van." and `m10_citadel.ink:23` "Find 0x00." all stand. Group B's header comment `m10_director_netherton.ink:14` ("Netherton never names the player") is stale; change it to match. B may give him one "Agent" in the briefing if it wants, but nothing is missing without it.

**R-2. Netherton's contractions. Ruling: unstress the ones that carry weight and let the quick ones through.** The voice bible says "few … 'I'll' or 'that's' in quick exchanges; full forms are his default". m08 has about 13 contractions in 139 lines. m10 has more, spread across all three groups. Change these:
- `m10_tesseract.ink:826` (A): "Half of these cannot be patched this year. The water controllers cannot be patched at all." This is a cost line, and the weight should land.
- `m10_six_oclock.ink:273` (A): "Two cells have it. We will be finding out which entries for a year."
- `m10_six_oclock.ink:385` (A): "Nightshade has been moved. I cannot reach him."
- `m10_nightshade.ink:137` (C): "I am keeping him. If he burns you twice, that is on my signature as well." This line echoes his m08 "it is on my signature", so it should use the m08 form.
- `m10_director_netherton.ink:233` (B): "If there is a second, it does not show one."

Keep "It's six." (if the line survives A-01), "I'll have his collected.", "I'll put that first.", "She'll have sold that too." and "You'll be at the lock without her." They're quick asides.

**R-3. Vector's 06:00 line. Ruling: needs a variant.** `m10_six_oclock.ink:163` "Twice now. I'll wait for the apology this time." is false unless `m08_accused_vector`. Write:
`{ m08_accused_vector: Agent 0x23 'Vector': Twice now. I'll wait for the apology this time. - else: Agent 0x23 'Vector': Check it properly next time. I'll wait for the apology. }`
The second form echoes his hub line ("Check it properly. Then say sorry properly."). The credit "Still waiting for an apology." works for both.

**R-4. Quintero's "that tunnel". Ruling: change it.** `m10_six_oclock.ink:97`. `quintero_ko` comes from `globalVarOnKO` on her field copies (`so`, `ws`, `pr`, `hall`, `lock`, `core`), and none of them is a tunnel. Her tunnel was the drain, before the breach, where she has no knockable copy. Rewrite: "Somebody put me on the floor down there. I know who. I'd like to know why, one day." The "I know who" stays: it's aimed at the player, and it's the best thing in the line.

**R-5. Kowalczyk's core lines. Ruling: change one, keep one.** `m10_kowalczyk_core.ink:20` "Talk to him, not me. That's what you came down for." is a non-villain "X, not Y". Rewrite: "He's the one you came down for. Go on." `:24` "Not here. Not in front of him." is a plain double negative, the way people really talk under strain. It isn't the AI contrast shape, so keep it.

**R-6. Voltage's "I said it'd be waiting. It was." Ruling: keep it. The setup exists.** HaX says it in m04's debrief, in the same words and under the same import: `m04_critical_failure/ink/m04_closing_debrief.ink:223` "His print's on that bypass module. When someone does find him, it'll be waiting." (the `voltage_print_on_bypass` and not-captured arm). The m10 option is gated on `m04_voltage_print_on_bypass and voltage_print_lifted` in the escaped knot, so any player who sees it heard the setup. Optional polish at `m10_voltage.ink:207`: "I told you it'd be waiting." The word "told" makes it a callback rather than a boast.

**R-7. `-> DONE` in HaX's phone file (raised by my own check, not the brief). Ruling: keep it.** CONTRACT §6.1 says "no END or DONE anywhere", but `m10_phone_agent0x99.ink` uses `-> DONE` 15 times, all after `#exit_conversation` on phone knots. m09's CONTRACT §7.2 rule 1 sanctions exactly this for phone threads (`restartAfterEnd()` brings the thread back to `start`, and HaX's jam and progress guards depend on that). The m10 contract should say "person-chat only", as m09's does.

## The finale as a whole

**His case and the three exchanges.** This is the strongest writing in the season. The case escalates cleanly: the Publication, then the price ("At the low end. I don't round down."), then the mechanism ("If I press it, it's a crime. If you press it, it's a confession."), then the record and "Since your first day." Each claim has a real rebuttal that removes exactly one leg:
1. He understated the price (he signed the old figure). That quietly turns his own "I don't round down" against him.
2. He never tried the slow way (he wrote the notice and kept it).
3. "Better me, with clean hands" needs the player's hand on the key.

His concessions give up exactly what was proved, and the exchange 2 and 3 openers ("Then the price is wrong. The reason isn't.") keep him standing on what wasn't.

- **The thoughtful player** finds every rebuttal on the evidence: the casualty sheet and Asante, HaX's flag 4 line about the notice, and his own words in exchange 3.
- **The cold-start player** gets the right [decoy, rebuttal, decoy] / [rebuttal, decoy, decoy] / [decoy, decoy, rebuttal] menus, and every rebuttal is reachable on what a cold player has heard. One soft spot: "You've seen the sheet" (`m10_tesseract.ink:322`) is asserted even when `casualty_sheet_read` is false (see A-12's note).
- **The button gamer** gets no help from position: always-first scores 1 and always-last scores 1 on a cold start. On a rich save the record answers make it easy to land two points, which suits "fun, not hard".

The only length tell left is A-14.

**The five scenes, won and lost.** Each scene has a resting line on its outcome global, an honest losing branch, and a 06:00 line that admits it:
- the table: shown / unshown / arrested / silent;
- Ghost: kept / refused / selling, with bait;
- the workshop: Imran or Gary, talked round, taken in or cloned;
- the power room: his hands / by hand / print / talk-down / fight / Wendell told or worked round;
- the gallery: Victoria's three branches, and Vos bought, refused or secret-used.

The losing beats land well: "Don't tell me about sums.", "Don't analyse me." with the pistol raised, "Then you're the board. Card's on my belt.", Ghost's "You don't get to ask me about hospitals." The by-hand cut has four voices on one shape and reads well in each, but see B-04 on "down".

**The whodunit.** The clue chain is fair and closes on one name. The door log is Malhotra's badge, and HaX had him on the line. The alibis leave Quintero and Kowalczyk. The sign-out leaves Kowalczyk and Arakawa, so only Kowalczyk is in both. The face-to-face crack is good: two lies, each broken by something the player has, then "Well. It was a good cracker." Two things weaken it. The line accusation lists her first (B-01). When the player never solves it, the reveal at the core has no one react (A-03).

**HaX's arc, and "the rest" at 06:00.** It works:
- "...back. 0x00." / "Ninety-nine." / "Still HaX."
- the speaker answer in exchange 3;
- "0x00. Don't.";
- "No. This one's yours. If I choose, I'll choose for the wrong reasons.";
- then "The night he left, he asked me to go with him. / I said no. It took me till morning." with the screen turning to six and nothing happening.

The arrest's "It's afterwards." and surrender's "He asked who taught you. I said I did." are the two best last words in the mission. The one structural flaw is that the scene contradicts itself about the time (A-01).

**Netherton.** He sounds right in the briefing ("It is one page long. It says don't."), at the core and at 06:00 ("I wanted to do the same. That is why you are suspended and I am not."), and in the van exchange ("I wrote that chapter, Magnus." / "I know. I kept it to one page."). His failings are the contractions (R-2) and the numbers line (B-03).

**The six endings and the epilogue.**
- **Arrest:** the van, HaX "I'm testifying.", "He is in a cell. The cells are not." Good.
- **Surrender:** "They'll work out who you are by Thursday. Be careful." is his one courtesy threat, as specified. Good.
- **Lethal:** "I was a second behind you. Log it. I'll sign under you." Good.
- **Executed:** one narrated line, a silence, the designation, Quintero takes the weapon without a word; at 06:00 Netherton "I will not put my name under this one." Heavy, and nobody gloats.
- **Scorched:** the purge, the card "Afterwards, then.", the suspension, then the hearing. Good. The hearing's first HaX line is a non-villain not-X (A-22).
- **Join:** "Thank you, Agent." / RELEASED / he holds the service door. Chilling, and HaX's silence after "0x00. Don't." helps. The Citadel scene that follows needs its opening fixed (A-04, A-05).

**Violence.** TV level throughout. Each shot is one narrated line, Quintero gets a shoulder wound and a dry line about it ("I've had worse from a door."), and knock-outs are admitted without detail.

**Voices across groups.** Every character who appears in more than one group's file:
- **HaX** (A, B, C): consistent; short, dry, fact first. Clean.
- **Netherton** (A, B, C): see R-1 and R-2. Otherwise consistent.
- **Kowalczyk** (A, B): consistent, West London ("your nan", "Mostly mud."). See R-5 and B-02.
- **Quintero** (A, B): consistent West Texas dryness. See R-4.
- **Nightshade** (A, B, C): consistent. See C-01 on "line item".
- **Vector and Phantom** (A, B): consistent. See R-3.
- **Malhotra and Arakawa** (A, B): consistent.
- **Voltage, Gary, Imran, Wendell, Victoria** at 06:00 (A, voices owned by C): A's lines match C's voices. Voltage's "March" pays off his "I found it in March" (`m10_voltage.ink`), and Gary's "Consistent, I'll give you that." is in voice.
- **Tesseract:** one writer. He matches m07: "Files are written by people who need you to be a shape" echoes m07's "a particular shape".
## Group A findings

Files: `m10_tesseract.ink`, `m10_six_oclock.ink`, `m10_hearing.ink`, `m10_citadel.ink`, `m10_kowalczyk_core.ink`, `m10_recruiter_phone.ink`, `m10_carryover_vars.ink`, `credits_sections.json`.

**A-01 (major) `m10_six_oclock.ink:37`, `:42`, `:452`: 06:00 contradicts itself about the time.** The scene opens "The forward post at six." Netherton then says "It's six. The arrests have started." (on `named`). The scene's last image is "On the table, the screen turns over to six. Nothing happens." That image is the payoff of the whole season, and it only works if six hasn't come yet. Fix:
- `:37` "The forward post, a few minutes before six. Floodlights, engines running, people sitting on bumpers with their jackets open."
- `:42` "The arrest teams are at the doors. They go on the hour." This keeps the aside's "The arrests start at six, and no sooner." (`m10_director_netherton.ink:218`) true.
- `:516` (executed) already avoids the clock ("isn't showing the clock any more"), so it can stay.

**A-02 (major) `credits_sections.json:41`, `:43`: Kowalczyk's credit says "Badge still active." on every E1–E5 save where nobody named her, but on all of those she is in custody.** In the router, `wren_beat` (step 8) fires whenever the console is stopped, `whodunit_live` holds, and she isn't held, knocked out or already at the core. So a free, un-named Kowalczyk always comes through the service door and is taken (`wren_at_core`), or is lying knocked out in the second van. `sleeper_caught` stays false in both cases, so the unconditional clause runs, and it's false. The double-cross clause (`:41`) leaves out that she was taken at the core (`double_cross_open` sets `wren_at_core`). Fix, in order:
1. `m09_recruiter_offer === 'double_crossed'` → "Former breaching lead. Walked off the apron in Helena. Taken at the core." (w)
2. `sleeper_caught === true` → keep "Badge returned."
3. **new** `wren_at_core === true` → "Breaching lead, Task Force Null, for eleven years. Stopped at the core with her hand out for his key." (w)
4. **new** `kowalczyk_ko === true` → "Breaching lead, Task Force Null, for eleven years. Woke in the second van. Nobody had named her." (w)
5. Unconditional → keep "Badge still active." It is now true only on a save where she was never reached. If no E1–E5 save can produce that, it is harmless as a fallback.

**A-03 (major) `m10_tesseract.ink:776-799` (`wren_beat`): the reveal lands and nobody reacts.** On the unsolved route this is the moment the player learns WREN is Kowalczyk. It plays as narrator, his refusal, "Adrian.", the takedown, then `-> core_router` → `database`, where HaX's next line is "Netherton's on the line. He wants to hear this." HaX has worked with Kowalczyk for years, and the player has no beat at all. Add one HaX line after each resolution, before the router. Default (Quintero wounded): "Agent HaX: Kowalczyk. *quietly* I signed her leave forms." On `alpha_tapes`, and after "[Stop her.]", the same line. Optionally, Quintero gets one line on the wounded arm, before HaX's: "Agent 0x2D 'Anchor': Shoulder. Leave it." (her 06:00 "Shoulder. I've had worse from a door." then lands as a callback). Leave out HaX's line when `sleeper_caught` is already true; his "You found her. Too late to stop her walking in." covers that case.

**A-04 (major) `m10_citadel.ink:16-17`: the Join epilogue's opening image doesn't hold up.** "HaX's desk is empty, her headset on the keyboard." HaX spent the night at the forward post in Montana (`hax_post`), so her Citadel desk was empty all night. The image reads as nothing, or as a continuity slip. "He said it had to be one of ours." Netherton never heard that: Join is decided at the console, before he joins the line at the database. Rewrite:
- `:16` "Narrator: The Citadel, an hour later. HaX's channel is still open on the wall. Nobody has spoken on it."
- `:17` "Director Magnus Netherton: He told her it had to be one of ours. He was right, and I signed for that agent myself." HaX heard it, and the line credits that.

**A-05 (minor) `m10_citadel.ink:20`: "On the wall screen, a line climbs."** is too vague for a player to know it's casualties, and it's the ending's only image of the cost. Rewrite: "Narrator: On the wall screen, the casualty count climbs. Nobody turns it off."

**A-06 (minor) `m10_six_oclock.ink:97`:** as R-4.

**A-07 (minor) `m10_six_oclock.ink:163`:** as R-3.

**A-08 (minor) `m10_tesseract.ink:826`, `m10_six_oclock.ink:273`, `:385`:** Netherton's contractions, as R-2.

**A-09 (minor) `m10_kowalczyk_core.ink:20`:** as R-5.

**A-10 (minor) `m10_tesseract.ink:101-125`: the same fact twice in a row, and "waste" twice.** He says "Two cells have it. They'll waste it."; two lines later HaX says "Their head start went. Both shares." The choice right after gets "Two hours for people who'll waste it." The contract wants her line because `what_went_out` reuses it, but here it repeats him. Two fixes:
- Give HaX a confirming form rather than a restatement: "Confirmed. Both shares went at the lock." / "Confirmed. Zero Day's went." / "Confirmed. The resale went." / "Confirmed. Nothing left the lock." Use the same words in the `what_went_out` text.
- Change `:102` to "Two cells have it. They'll squander it." or "Two cells have it. Much good may it do them."
See also the audio cut list, item 1.

**A-11 (minor) `m10_tesseract.ink:127`: the Voltage callback is clumsy.** "Voltage told you above him it stops being a person you can arrest. That's him." The "him" is ambiguous (Blackout, in m04). Rewrite: "Agent HaX: Voltage said above Blackout it stops being a person you can arrest. There's the person."

**A-12 (minor) `m10_tesseract.ink:205`: a fragment that reads as a note.** "Hospitals, dispatch, water. People who never had the skill before." Rewrite: "Hospitals, dispatch, water. In the hands of people who could never have got in before." Or cut it (see the audio cut list).

**A-13 (minor) `m10_tesseract.ink:322`: "You've seen the sheet." is asserted on every save.** A player who skipped the workshop's sheet hasn't seen it. Write `{ casualty_sheet_read: You've seen the sheet. You think the number's obscene. - else: You've heard the number. You think it's obscene. }` as two whole lines.

**A-14 (minor) `m10_tesseract.ink:496-501`: a length tell and a time slip.** "[I sent your notice. Tonight, from Helena.]" is 7 words, against 12–14 for the rest of that menu. Netherton and HaX both place Helena "last night" (`m10_director_netherton.ink:101`, `:132`). Rewrite: "[I sent your notice from Helena, nine years after you wrote it.]" (12 words). Then cut his "Nine years late." (`:499`), because the button now says it, and keep "*pause* Sooner than I managed."

**A-15 (minor) `m10_tesseract.ink:465-469`: a second narrator line on a landed point.** SE §2.1 and CONTRACT §5.4 say the narrator marks the first landed point only. The `else` gives "He doesn't answer for a while." Cut the `else`: use `-> first_landed ->` as every other landed answer does.

**A-16 (minor) `m10_tesseract.ink:653-662`, `:726-729`: Join can say the casualty figure twice.** "Show me how it works" → `join_1` (narrator gives the figure) → "[Step back.]" → `console_menu` → "Show me how it works" again → `join_1` plays his key line and the figure again. CONTRACT §5.5 says the figure is said once. Fix: in `console_menu`, `+ [Show me how it works.]` goes to `join_1` only on `join_step < 1`; otherwise "Dr Adrian Tesseract: You were asking how it works." and `-> join_1_menu`. That mirrors the `console` knot's own resume.

**A-17 (minor) `m10_tesseract.ink:831`: "The one he used on you."** On most saves the player can't place what he used on them. It's MC §6.5's line, but it puts an unanswered question into the database argument. Cut the middle sentence ("Infusion pumps in a hundred and forty hospitals. Still live next year if we do this."), or name it if MC has a referent.

**A-18 (minor) `m10_tesseract.ink:849` and `m10_six_oclock.ink:508`: Netherton uses the same rhythm twice.** "Not him, not us." at the core, then "Not him, not the buyers, not whoever sits in my chair next." at 06:00. The 06:00 one is the better line, and it only plays on Scorched Earth, right after this one. Trim the core line: "Then nobody has it, and nobody fixes anything either. We both answer for it."

**A-19 (minor) `m10_six_oclock.ink:59-63`: an unreachable narrator line.** "The floodlights hum. Somebody passes round a flask." `walk_back` always sets `six_quiet`, so the line never prints. Cut it, or keep it for a mid-walkabout reopen and accept that it's rare. It is still a voiced line on the list.

**A-20 (minor) `m10_six_oclock.ink:184`, `:207`, `:233`: the walkabout repeats a shape, and one line is unclear.** Voltage "You walked straight past my switchgear…" and Gary "You walked straight past my bench…" can both play in one walkabout. Change Gary's to "Nobody came to my bench all night. I'm used to that." Wendell's "Dale stayed home. His grandkids won't ever hear about tonight." doesn't say what it means. Rewrite: "Dale stayed home. Slept right through it, he says."

**A-21 (minor) `m10_six_oclock.ink:54`, `:68`: the player who never solved it never faces WREN.** `kow_here = sleeper_caught`, so a Kowalczyk stopped at the core un-named (`wren_at_core`, `not sleeper_caught`) isn't offered at the van. HaX's "Nobody named her before she did it herself." (`:439`) is all that player gets. Consider `kow_here = sleeper_caught or wren_at_core`. On that arm she asks C18 with a fourth answer, "[I didn't. Not till you came through his door.]", writing `worked_out`. Her reply "That's worse. That means I was good." still fits, and inverts nicely.

**A-22 (minor) `m10_hearing.ink:17`: HaX gets a not-X line.** "He's one man with a memory now, not a map." is a non-villain "like X, and not Y" (CONTRACT §5.6), even though it's FA's line. Rewrite: "He still knows. But the map's gone. He's one man with a memory now."

**A-23 (minor) `m10_tesseract.ink:1073`:** "He takes his coat from the back of the empty chair": he was sitting in that chair, so "empty" is odd. Rewrite: "He takes his coat from the back of his chair and holds the service door for you."

**A-24 (minor) `credits_sections.json:19`, `:56`:** "MARISOL QUINTERO" sits beside "AGENT 0x23 'VECTOR'" and "HALINA KOWALCZYK, 'WREN'". Pick one form for SAFETYNET staff. Either "AGENT 0x2D MARISOL QUINTERO", or plain names for Vector and Phantom too. "Raid lead, Task Force Null." is fine.

**A-25 (minor) `m10_six_oclock.ink:305`:** "We have officers in the second van with bruises ENTROPY did not give them." is plural on a single knock-out. Use "Someone in the second van has bruises ENTROPY did not give them. I will want that explained." That covers one or many, and names nobody.

**A-26 (minor) `m10_six_oclock.ink:448`: cold-start players don't get to ask for "the rest".** "[You said you'd tell me the rest.]" is gated on `m09_completed`. A cold-start player whom HaX promised at the post ("Ask me at six. I'll tell you then.", `m10_hax_post.ink:28-29`) gets only "(Stand with her.)". The post's flag is file-local. Either add a synced global (`hax_rest_promised`, set in `hax_post`) and gate on `m09_completed or hax_rest_promised`, or accept it: "(Stand with her.)" still plays the rest.

## Group B findings

Files: `m10_phone_agent0x99.ink`, `m10_hax_post.ink`, `m10_director_netherton.ink`, `m10_kowalczyk.ink`, `m10_quintero.ink`, `m10_arakawa.ink`, `m10_malhotra.ink`, `m10_vector.ink`, `m10_phantom.ink`, `m10_minders.ink`.

**B-01 (major) `m10_phone_agent0x99.ink:259-280` (`accuse_who`): the line accusation lists the answer first.** The order is Kowalczyk, Quintero, Arakawa, Malhotra, Vector, Phantom. A player who guesses picks the top name and wins. A careful player sees that the list starts with the person nobody has mentioned yet. Reorder so the list carries no hint. Put Malhotra first: his is the name on the log, so he's the obvious wrong guess. Then Arakawa, Kowalczyk, Quintero, Vector, Phantom. Kowalczyk ends up neither first nor last.

**B-02 (major) `m10_director_netherton.ink:238`, `m10_kowalczyk.ink:96`: on `taken`, one answer quotes a laugh that never happened.** "[At the briefing. You laughed too easily.]" On `taken` the briefing opens with Quintero cuffing her (`m10_director_netherton.ink:58`). The laugh in `:64` plays only on the default branch. Nor could the player have known "at the briefing" on this route: they found her in Helena. On both `taken` copies, write the `briefing` answer as "[Before Helena. I had a feeling about you.]" (still `kowalczyk_answer = "briefing"`). Her reply at 06:00, "*almost laughs* No, you didn't. But thank you.", fits it exactly. Leave the face-to-face (`m10_kowalczyk.ink:252`) and 06:00 (`m10_six_oclock.ink:134`) forms alone: they're only reached on routes where the laugh played.

**B-03 (major) `m10_director_netherton.ink:121`, `:123`: Netherton's casualty line reads as notes, not speech.** "His own sheet says. By key: 1,100 to 2,600. City by city from six: fewer, and later. Not few." It's a voiced cutscene line. The colons are list syntax, and the voice bible says he says numbers in full words ("two hundred and forty to three hundred and eighty-five"). Rewrite:
- `:121` "His own sheet says eleven hundred to twenty-six hundred, if the key is pressed. City by city, fewer, and later. Not few."
- `:123` "Signed it. Eleven hundred to twenty-six hundred, if the key is pressed. City by city, fewer, and later. Not few."
Both keep the "Not few." ending, which is the best part.

**B-04 (minor) `m10_phone_agent0x99.ink:200`, `:677` (and HaX's `:631`): "down" is ambiguous for a shutter.** "That has to come down before you reach him." / "That's the shutter. It's down." / "Shutter's already down." A shutter that comes down is a closed shutter, the thing blocking the gallery. The other voices say the opposite: Voltage "Shutter's dead.", Wendell "That door won't move again tonight.", Elena "That shutter won't close tonight." Make HaX match:
- `:200` "That has to be dead before you reach him."
- `:677` "That's the shutter. It's dead."
- `:631` "Shutter's already dead. Nothing left to do in there."
Do the same in Vance's `m10_vance_phone.ink:8` ("Shutter's dead already."), Elena's `:8` ("The shutter's already cut."), and A's `m10_six_oclock.ink:174` ("the shutter died first time").

**B-05 (minor) `m10_phone_agent0x99.ink:226`:** "on the phone to his girl" can read as girlfriend in UK English. Use "on the phone to his daughter". That matches his own "Your daughter?" topic (`m10_arakawa.ink`).

**B-06 (minor) `m10_phone_agent0x99.ink:529`:** "[Kill Ghost's buyers'.]" puts "Ghost" on screen, against CONTRACT §5.6 ("the console's catch is 'the resale share'"), and the double possessive reads badly. Use "[Kill the resale.]". That matches HaX's own "The resale went." The contract quoted the old button, so this counts as one of the fixed strings the brief lets me revise.

**B-07 (minor) `m10_phone_agent0x99.ink:608-610`: one warning too many.** On a recruited-Victoria save the gallery call carries the console warning plus two Sterling lines. MC §3.5 / CONTRACT §1.4 allow one warning before the last line. Keep the line that states a cost: "Sterling goes with whoever's winning. Show her the order, and she'll know we read Zero Day's mail." (19 words). Cut "Make sure it's us before you hand her anything."

**B-08 (minor) `m10_phone_agent0x99.ink:171`: HaX spends his reveal for him.** "He needs one of ours to press his key. Then the history books say SAFETYNET did it." That pre-empts his best line at the core ("If I press it, it's a crime. If you press it, it's a confession."). Rewrite: "He wants it to be one of ours. Ask him why. He'll enjoy telling you." Keep `:172`.

**B-09 (minor) `m10_director_netherton.ink:154`, `:351`, `:355`: brackets that aren't speech.** "[Say nothing.]" should be "(Say nothing.)", like every other silent option in the mission. "[Helena's plans.]" and "[Nightshade.]" are menu labels; make them spoken: "[Are Helena's plans any good?]" and "[What about Nightshade?]".

**B-10 (minor) `m10_director_netherton.ink:147`:** "Noted, Agent Quintero. Twice now." On which save did she object before? If it refers to m09, gate it on `m09_completed`. Otherwise cut "Twice now." so the line reads "Noted, Agent Quintero. The record also says six o'clock."

**B-11 (minor) `m10_director_netherton.ink:14`, `:233`:** the stale header comment (R-1), and the contraction (R-2).

**B-12 (minor) `m10_arakawa.ink:160` (menu re-entry), also `:130`, `:146`, `m10_quintero.ink:73`: the same line on every re-talk.** "Service side. She always takes the door nobody's watching." is the re-entry line every time the player talks to Arakawa after the peel-off, and it's also his room line and Quintero's. Say it once, through a file-local flag, then fall back to "I'm here. What do you need?"

**B-13 (minor) `m10_hax_post.ink:26`:** "I'm on your phone. Use that, not me." is a non-villain not-X. Rewrite: "I'm on your phone now. Ring me."

**B-14 (minor) `m10_phantom.ink:34`:** "Kowalczyk and Arakawa. I'd rather it had none." doesn't say anything clear. Phantom is an auditor, so give him an auditor's line: "Kowalczyk and Arakawa. Both signatures are good. The count isn't."

## Group C findings

Files: `m10_nightshade.ink`, `m10_ghost_phone.ink`, `m10_imran.ink`, `m10_gary.ink`, `m10_voltage.ink`, `m10_static.ink`, `m10_wendell.ink`, `m10_vance_phone.ink`, `m10_elena_phone.ink`, `m10_asante.ink`, `m10_mercer.ink`, `m10_victoria_line.ink`, `m10_victoria.ink`, `m10_vos.ink`, `m10_fonoti.ink`, `m10_guards.ink`. This is the cleanest group: the scenes are tight, the losing branches are written, and the voices hold. Wendell's "Uncle Sam all through the eighties" and Asante's "You lot have been asking nicely for thirty years" are the right kind of line.

**C-01 (minor) `m10_nightshade.ink:57`: the table spends the 06:00 payoff early.** "He wrote fifteen years of me as a line item." At 06:00 he says it to Tesseract's face: "You wrote me as a line item." / "You were a good one." (`m10_six_oclock.ink:423-424`). Said first at the table, the 06:00 exchange becomes a repeat. Rewrite `:57`: "He wrote fifteen years of me in his own hand. I'd know it anywhere. I learned to write like it."

**C-02 (minor) `m10_nightshade.ink:137`:** Netherton's contractions, as R-2.

**C-03 (minor) `m10_guards.ink:48`, `:79`, `:136`, `:58`: one guard line three times, and a British kettle.** "Nobody said let you through armed." plays for three different guards, and a player meets several. Keep it once (tunnel), and give the duty guard "I read it. It doesn't say let you past." and hall A "Core's past us. Nobody's going past us." "Kettle's on." is a British line in an American guard's mouth (CONTRACT §5.2). Use "Coffee's on. If you're my relief, you're early."

**C-04 (minor) `m10_ghost_phone.ink:102`, `:105`, `:143`: Ghost repeats himself in one call, and asks no question.** On the broken branch "We said we'd be watching. We were." opens the call and opens `hook_refused` again. Rewrite `:143`: "Not from you. You don't get to ask me about hospitals." At `:105`, "You never answered me. Answer this." is followed by no question. Rewrite: "You never answered me. You'll want to now."

**C-05 (minor) `m10_elena_phone.ink:66`, `m10_vance_phone.ink:67`: a shared phrase and a tidy ending.** Both voices close on "does what it's told", and Elena adds a neat aphorism ("People are harder."). Keep Vance's, which suits a grid man. Rewrite Elena's: "Done. That shutter won't close tonight. Go get him."

**C-06 (minor) `m10_victoria_line.ink:32`:** "He took my desk by Monday." Use "He had my desk by Monday." The rest of the line is very good.

**C-07 (minor) `m10_fonoti.ink:67` against `m10_guards.ink:169`: the same name, opposite results.** At the lock, "[Shift change. Netherton's orders.]" works on Fonoti; on the gallery, "[Netherton's orders.]" gets "Never heard of him." Neither guard would know SAFETYNET's director, and the player wouldn't name him to a hired guard. Change Fonoti's (a contract string, so this is a revision the brief allows) to "[Shift change. Orders from upstairs.]". His "Nobody tells me anything." then fits better.

**C-08 (minor) `m10_victoria.ink:191`, `m10_vos.ink:30`: two stock phrases in one room.** "Nothing personal. It never is." and "Business is business." can both play on the gallery. Vos's is in character for him. Change Victoria's: "Zero Day pays on time. You never did."

**C-09 (minor) `m10_gary.ink:28`:** "That casing on the rack. I had one of those behind my rack at St. Catherine's" uses "rack" twice. Use "behind my server cabinet at St. Catherine's".

**C-10 (minor) `m10_gary.ink:151`:** "[Cuff him.]": Gary is the only other person there, so the player is talking about him in the third person. Use "[You're coming in, Gary.]". His reply, "Then write it down.", still fits.

## Structure (skill, dialoguelint, runtime)

Most of the structure is sound. The lint flags, each ruled:

- **blank-reentry ×14: withdrawn.** Every one is a resting knot on the quiet pattern (`parked`, `finished`, `rest`) or a gated, silent phone home knot (`start` in Ghost, Vance, Elena, Victoria's line and the Recruiter, as PASS2 lesson 36 requires). The others are a phone `*_after` knot whose only job is "(Put the phone away.)". A re-talk of a person-chat re-routes before it prints anything (`m10_tesseract.ink:25-32`, `m10_kowalczyk_core.ink:41-48`, the closing scenes' `finished`).
- **stage-cue-in-info ×5: withdrawn.** None of the five lines has a number or a code. "You read your homework." and "It was a good cracker." carry no information the cue could hide.
- **not-x-but-y ×2:** `m10_tesseract.ink:621` "That isn't a lapse. It's a method." is the villain's one per scene: keep. `m10_phone_agent0x99.ink:516` "I can kill one feed, or follow one. Not both. Pick." states a constraint; it isn't the AI contrast. Keep. My own grep found four non-villain not-X lines the lint missed: R-5, A-22, B-13, and "Names, not stores." (`m10_imran.ink:77`). Keep Imran's: it's a clue, worded the way he'd say it.
- **crowded-hub (`support_hub`, 25 possible):** CONTRACT §1.4 leaves the ten-choice cap to OT §5. The gates are mutually exclusive by stage: the briefing questions retire at the breach, and the whodunit topics retire as clues land. I did not reconstruct the busiest save. Stage 9 should check it with a seeded state once the erb exists.
- **stage-cue-density (`m10_tesseract.ink`, 18 in 194):** mostly `*pause*`, which CONTRACT §5.3 makes the scene's one repeated cue. A route hears at most three, plus `*quietly*` on Join and `*breath*` on hold-fire. Justified.
- **us-spelling "gray" (`m10_elena_phone.ink:32`): withdrawn.** Elena's voice is en-US (voice bible: Californian), so "gray" and "labeled" are right for her.

The skill's checks:

- **Attribution:** every prefix is a §1.2 displayName. The † forms (`Agent 0x5E 'Lantern'`, `Agent 0x2D 'Anchor'`, `Officer …`, `Voltage (Critical Mass)`, `Minder`, `Guard`) still wait for stage 9 to confirm. No `#speaker:` tags. Phone files have no self-prefix; HaX speaks unprefixed in her own file and prefixed in everyone else's.
- **Hubs and exits:** every person-chat exit has a reply before `#exit_conversation` (no exit-no-reply hits). Every resting knot keeps a sticky option. loopcheck is clean (see "What was run"). No person-chat file uses `DONE`/`END`. HaX's phone file uses `-> DONE` on purpose (R-7).
- **Voiced calls:** `breach_call`, `inner_door_call`, `tripwire_call`, `ladder_call`, `stair_call`, `gallery_open_call` and `cut_call` (HaX); `ghost_call`; `cut_call` (Vance, Elena); `victoria_call`. All have no narrator line and no printed variable. Each ends `#exit_conversation`, and none diverts into `start` or `support_hub`. Note for stage 9: HaX's gallery call is named `gallery_open_call`, not the contract's `gallery_open` (an ink name clash with the global), and Tesseract's exchanges are `exch_1`…`exch_3`; the mappings must use these names. Ghost's call carries one HaX line as second speaker (`m10_ghost_phone.ink:89`): voiced, inside the one-voice rule, fine.
- **Phone rules:** no line over 25 words, no self-prefix, and the Recruiter's file is the silent home knot it should be.
- **`&&`:** JSON only; ink uses `and`/`or`/`not` throughout.
- **Stale status answers (2i):** HaX's `where_are_we` ladder and Netherton's hub re-entry branch down to the step the player is on. Clean.
- **Choices quoting what wasn't said (2i):** one hit, B-02. Kowalczyk's card 5 ("You said it never went through stores") is safe: m09's briefing has the line (`m09_briefing.ink:282`), and the cold start has it in m10's briefing.
- **Same fact twice in a row (2i):** A-10, C-04.
- **Asterisk cues:** every cue sits mid-line or after a prefix; none starts a line.

## The ten worst lines

Worst first, judged by what a player notices on screen or hears.

1. `m10_six_oclock.ink:37` "Narrator: The forward post at six. …" breaks the season's last image (A-01).
   → "Narrator: The forward post, a few minutes before six. Floodlights, engines running, people sitting on bumpers with their jackets open."
2. `credits_sections.json:43` "Breaching lead, Task Force Null, for eleven years. Badge still active." is false whenever she was stopped at the core (A-02).
   → add, above it: "Breaching lead, Task Force Null, for eleven years. Stopped at the core with her hand out for his key."
3. `m10_director_netherton.ink:121` "His own sheet says. By key: 1,100 to 2,600. City by city from six: fewer, and later. Not few." (B-03)
   → "His own sheet says eleven hundred to twenty-six hundred, if the key is pressed. City by city, fewer, and later. Not few."
4. `m10_director_netherton.ink:238` "[At the briefing. You laughed too easily.]" on `taken` (B-02).
   → "[Before Helena. I had a feeling about you.]"
5. `m10_citadel.ink:16` "Narrator: The Citadel, an hour later. HaX's desk is empty, her headset on the keyboard." (A-04)
   → "Narrator: The Citadel, an hour later. HaX's channel is still open on the wall. Nobody has spoken on it."
6. `m10_phone_agent0x99.ink:200` "That has to come down before you reach him." (B-04)
   → "That has to be dead before you reach him."
7. `m10_tesseract.ink:127` "Agent HaX: Voltage told you above him it stops being a person you can arrest. That's him." (A-11)
   → "Agent HaX: Voltage said above Blackout it stops being a person you can arrest. There's the person."
8. `m10_six_oclock.ink:97` "Agent 0x2D 'Anchor': Somebody put me on the floor in that tunnel. …" (R-4)
   → "Agent 0x2D 'Anchor': Somebody put me on the floor down there. I know who. I'd like to know why, one day."
9. `m10_tesseract.ink:205` "Dr Adrian Tesseract: Hospitals, dispatch, water. People who never had the skill before." (A-12)
   → "Dr Adrian Tesseract: Hospitals, dispatch, water. In the hands of people who could never have got in before."
10. `m10_kowalczyk_core.ink:20` "Agent 0x5E 'Lantern': Talk to him, not me. That's what you came down for." (R-5)
   → "Agent 0x5E 'Lantern': He's the one you came down for. Go on."

Near misses: `m10_six_oclock.ink:233` (Wendell's Dale line, A-20), `m10_ghost_phone.ink:105` "Answer this." (C-04), `m10_phantom.ink:34` (B-14), `m10_elena_phone.ink:66` (C-05).

## Audio: counts and cut list

**Distinct voiced lines per file.** Person-chat files: unique prefixed lines, Narrator included, with each `{&a|b}` alternation counted once (add about 35 for the alternations across the mission). Calls: `voicelines.mjs` on the compiled copies. HaX's hub, Netherton's lines inside her hub topics, every bark and every text are unvoiced and not counted.

| File | Distinct voiced | Of which Narrator | One route hears (estimate) |
|---|---|---|---|
| `m10_tesseract` | 227 | 40 | 80–90 (rich save), about 70 (cold) |
| `m10_six_oclock` | 110 | 13 | 25–30 |
| `m10_director_netherton` | 96 | 15 | 35–45 (briefing and aside; more on a cold start) |
| `m10_nightshade` | 58 | 0 | 10–14 |
| `m10_voltage` | 42 | 0 | 6–12 |
| `m10_kowalczyk` | 34 | 3 | 5–15 (the crack is 10) |
| `m10_quintero`, `m10_guards`, `m10_victoria`, `m10_imran`, `m10_gary`, `m10_arakawa` | 31, 31, 30, 30, 28, 27 | 0–2 | 3–10 each |
| HaX calls (`m10_phone_agent0x99`) | about 29 | 0 | 12–18 |
| `m10_ghost_phone` (call) | 26 | 0 | 6–9 |
| `m10_wendell`, `m10_vos`, `m10_vector`, `m10_hearing`, `m10_malhotra`, `m10_fonoti`, `m10_phantom`, `m10_hax_post`, `m10_asante` | 10–13 each | 4 in the hearing | 2–8 each |
| `m10_vance_phone`, `m10_elena_phone` (calls) | 10, 10 | 0 | 6–8 (one of the two) |
| `m10_victoria_line` (call), `m10_minders`, `m10_citadel`, `m10_static`, `m10_kowalczyk_core`, `m10_mercer` | 7, 5, 4, 2, 2, 1 | 2 in the Citadel | 1–5 |
| **Mission** | **about 940, plus about 35 alternations** | **about 90** | **one full run hears about 300** |

The heavy files are heavy because of import variants. One route through Tesseract hears about a third of his file, and through 06:00 about a quarter. His case at about 2 minutes and each exchange at about 2 minutes are on CONTRACT §5.7's targets, so I would not cut the argument. The cuts below take out duplicated or redundant lines and shorten the database scene, which is the slowest stretch on a single route.

**Cut list** (distinct lines saved / lines saved on one route):

1. `m10_tesseract.ink:116-125`: HaX's four head-start lines repeat his release line (A-10). Either cut them from the voiced scene (keep the words in her `what_went_out` text), or replace them with the "Confirmed…" forms. Cutting saves **−4 / −1**.
2. `m10_tesseract.ink:882-928` (`database_ops`): 18 fixed pairs. Restructure as two one-operation lines in a row, each chosen from eight fixed strings: "The watch on Sterling goes dark." / "Nightshade's channel goes dark." / "The HashChain tags go dark." / "The watch on Voltage's people goes dark." / "The watch on what's left of Voltage's crew goes dark." / "The Critical Mass watch goes dark." / "The watch on the head start's order book goes dark." / "Our tap on Zero Day's brokers goes dark." Open with "Director Magnus Netherton: Two operations go dark if you do this." only if the scene needs it. **−10 / +1** (or −9 / +2 with the opener). The biggest single saving.
3. `m10_tesseract.ink:826` + `:830`: merge Netherton's two cost lines: "Half of these cannot be patched this year, and the water controllers never. Send them out and every buyer knows where to hit." **−1 / −1**
4. `m10_tesseract.ink:837` + `:841`: merge HaX's two disclosure lines: "That's coordinated disclosure. Vendors first, quietly, with time to fix. The ones nobody can patch go to the operators, with workarounds." (24 words) **−1 / −1**. The `[What about the ones nobody can fix?]` / `[How quietly?]` choice between them then goes; the menu before "And if I wipe both copies?" still breaks the run.
5. `m10_tesseract.ink:205`: cut "Hospitals, dispatch, water…" (or rewrite it, A-12). **−1 / −1**
6. `m10_tesseract.ink:499`: "Nine years late." goes once the button says it (A-14). **−1 / −1** on that save.
7. `m10_tesseract.ink:468`: the second narrator line (A-15). **−1**
8. `m10_tesseract.ink:1061-1065`: Scorched Earth's narration. Fold the card into the chair line: "When the emergency lights come up, his chair is empty, and the service door is open. On the console, a card in his hand: 'Afterwards, then.'" (and the same for the `m09_sleeper_named` form). **−0 / −1**
9. `m10_six_oclock.ink:62`: the unreachable flask line (A-19). **−1**
10. `m10_six_oclock.ink:292-299`: four backdoor lines become two, plus one "Director Magnus Netherton: Seattle's went first." on `m07_countdown_expired`. **−1**
11. `m10_six_oclock.ink:326-331`: the `database_ask` beat ("He scrolls to the next page." and a flat choice). Netherton can go straight from the numbers to the database. **−1 / −1**
12. `m10_director_netherton.ink:211`, `:213`: the two near-identical bench replies. Give both choices `:211`'s reply. **−1**

Total: about −23 distinct lines (about 2.5% of the mission). On a single route Tesseract drops by about 5 and 06:00 by about 2. The bigger saving is in re-voicing risk: item 2 means any later change to the operation list costs one line, not eighteen.

**Re-voicing note.** No audio exists for m10 yet, so none of the rewrites in this report costs anything to re-voice. Make every change before the first `tts-audio` run.
