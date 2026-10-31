# m09 Digital Archaeology: script edit, round 1

## Verdict

**Revise.** No blockers. The ink compiles, every entry knot survives loopcheck, the voiced knots obey the phone-call rules, and the big scenes are written at the level the season needs: the Recruiter's call, Netherton's three lines, the confession, the one-sided Tesseract call and the hangar all land. The revision is a tightening pass, not a rewrite:

- One canon break: Sorensen says the player "read Mr. Lawson his rights" (SAFETYNET can't arrest).
- Two places spend a reveal early or claim something that may not have happened: the briefing's "He was one of ours, once", and the debrief's "[It opened the safe.]". HaX's hub has a third: "[I decoded his annotation sheet.]".
- Group A's voiced calls run about 70 distinct lines against a budget of about 35, and the Recruiter has 17 against 14. The cuts below bring A to about 55 (48 new clips) and the Recruiter to 14. Getting A to 35 would mean cutting carry-over payoffs out of the identity scene, and I don't recommend that. Raise A's budget to about 48 new clips instead.
- Six Recruiter-call strings break the 25-word phone cap, and one HaX line in that call breaks even the 30-word face-to-face cap.
- A handful of fixed strings read badly and should change in both files that share them ("She watched the counter. Not the copy.", "Peg's office", the hand line in the identity scene).

## What was run and read

- `./scripts/compile-ink.sh m09_digital_archaeology`: 16 compiled, 0 failed, no loose ends.
- `dialoguelint.mjs`: 1 error (B1 L141, 33 words), 7 `not-x-but-y` warnings, 1 allowed `you-after-choice`. With no scenario file, the lint treats every file as face-to-face and skips unprefixed phone lines. I counted those by hand: six B1 lines and one A3 text are over 25 words (B-01, A-19).
- `loopcheck.js` on 17 entry states (A1 `start` cold and mid-mission, `identity_scene`, `tesseract_call`, `deck_resume`; B1 `call` cold and sold-and-lied; every person-chat hub; C1, C2, C6, B5): no runtime errors, no starved knots.
- The TTS walker (`app/services/break_escape/ink_line_walker.rb` L341–355, tts-audio skill L20) expands every branch of `{&a|b}` into whole lines, capped at 16. Shipped m05 and m08 use the same pattern.
- Not run: the validator, reopencheck, F20 walk and tagdiff. All need `scenario.json.erb` or a commit (CONTRACT §10.2).
- Read: the npc-dialog-review skill, PASS4_SCRIPT_EDITOR_PROMPT, FINALE_BRIEF, CONTRACT, every m09 `.ink` and `texts/*.md`, SE §1–4 and §8–9, MC §2–3. Voices were compared with m05's Recruiter and m08's HaX phone and debrief. S4/S6 were consulted only for the decode and the safe PIN. No VM material was opened; the `// VM-STEER` lines are out of scope.

## Rulings on the known items

1. **"[It opened the safe. Thank you.]"** (C2 L70). This is false when the safe opened on the PIN (`060216`, S6 §9; C7 note L111 admits it). Rule: reword both buttons so they hold on every route, and leave the credits' warm clause as it is (it stays true). Warm: "[Thank you. I was glad of it.]" → Kowalczyk "Course you were. I'll tell it you said so." Flat: "[It was in my pocket.]" → keep "High praise. I'll have it framed." Change C7 L57's default clause to "Asked after her cracker. Got a shrug." The alternative is a stage-9 latch (`safe_cracked` on the cracker's unlock) that shows the current pair only on that route. That doubles the buttons for a small gain, so I don't recommend it.
2. **Sorensen's "dear" twice** (B4 L28 and L49, one scene). Keep it at L49, "When I've finished, dear." That is her refusing the player while the shredder runs, which makes it her most dangerous moment. L28 becomes "It's only paper. The people are where they've always been, at their desks, doing what they were placed to do." (SE's sample is a candidate, so this needs no contract change; the contract's §3.3 B4 "fixed" quote should be updated to match.)
3. **Six Recruiter-call strings over 25 words** (B1 L82, L129, L131, L141, L144, L156). Trim or split all six (B-01 has the rewrites). The 25-word phone cap applies to voiced calls too: they show as phone bubbles, and the lint will fire on them once the scenario exists. Splits cost clips, so the line count below allows for them.
4. **Lint hits on fixed strings.**
   - "We have Helena. Not the bunker. Not yet." (C1 L50): keep. It narrows the claim and corrects nothing.
   - "No. Not about any of it." (C2 L103): keep. It is the player's denial.
   - "It isn't my call. It isn't yours either…" (A1 L468): keep. False positive.
   - "…it isn't Derek's handwriting on it. It's the only place…" (B3 L41, B5 L36): keep. False positive, and the hand-matching rests on it.
   - "She watched the counter. Not the copy. One of them. Now." (A1 L287, B1 L190): revise in both files (A-07). It is a real "Not X. Y." and the hardest line in the call to parse.
5. **The cold-start lease remark** (A3-22b). Rule: cold starts get A3-21, "There it is. Tomb Gamma has an address." A3-22b tells a never-played player "Same site Nightshade gave us". The cold briefing's m08 card has just said he is "in custody and saying nothing" (C1 L213), so the two contradict each other within the hour. Change A3-21's condition to `!globalVars.m08_tomb_gamma_location_known` (drop `m08_completed`), and delete A3-22b.
6. **The debrief's `{&…}` cycle vs the TTS walker** (C2 L144). Safe. The walker expands each branch of a `{&a|b|c}` sequence into its own full line, prefix included (`ink_line_walker.rb` L341). m05's Halloran and Lisa Park and m08's HaX ship the same pattern. Each alternative is a whole sentence, and that is the rule that matters. After a reload the cycle restarts, which is harmless. The same ruling covers the re-entry cycles in B2, B3, B4, B6 and B7. Their audio cost is in the cut list.
7. **Contract fixed strings I'd revise** (say so in CONTRACT): "She watched the counter…" (§3.1), "She fired it from Peg's office" (§3.1, A and B), the identity-scene hand line (§2.1), "You read Mr. Lawson his rights" (SE table, B3/B5), "You're not the auditor." (§3.4), "[Tell her what the bonus was.]" / "[Show her the page.]" (§3.2), "[Tell him the truth.]" (§3.4), "[I decoded his annotation sheet.]" (§2.1 topic 3b), A3-06a (§2.3, over the phone cap), the Recruiter's "cheque" (§3.1, US speaker), and "Somebody always asks me that. Now." (§4.1, optional).

## Group A: HaX's phone

HaX's voice holds from m08: dry, fact first, costs stated and left to sit, one crack at a time. The Tesseract call is the best scene in the mission. Hearing one side, ending on "And he asked if we'd liked his notes." and then going straight back to work is exactly right, so leave it alone. The `afterwards` loss lines are correct for every `cage_bin` × `deck_pulled` case. The status ladder names the next step on every reachable row. Files: A1 = `ink/m09_phone_agent0x99.ink`, A3 = `texts/A_hax_texts.md`.

| Id | Level | Where | Problem | Fix |
|---|---|---|---|---|
| A-01 | major | A1 L321–327 | The hand line interrupts HaX mid-read of the credential ("A SAFETYNET staff credential." / hand line / "Issued before he left us…"). Its pronouns don't track: "the hand on **his** file… It's **his**" puts Nightshade and the Architect behind the same "his". | Move it above L321, so the scene opens on it when `not hand_matched`. Put the `identity_scene_started` / `unlock_task` tags on whichever line comes first. Rewrite: "You never told me about the writing on Nightshade's file. I put it next to my notebook. It's his." |
| A-02 | major | A1 L343–362 | Four confession forms of 3–4 lines each make 14 distinct voiced lines, the biggest single overrun. L347 "He taught me to read people. I never once read him." is a neat chiasmus: an AI tell, and the only line in her confession that sounds written. "He was mine" appears in three forms. | Restructure to nine lines, each form two lines plus a shared close (audio list, item A-a). Cut L347 whatever else happens. |
| A-03 | major | A1 L448–451 | "[Then we send it.]" / "[Then it stays where it is.]" both lead to the same content and set nothing. It is a flat choice inside a voiced scene, costing 2 clips. | Cut both buttons and replies. The scene runs straight from the controller line to the watch line. |
| A-04 | major | A1 L431, L441–447, L461–467 | Albion repeats itself. "Four hundred" is said three times in five lines. On `full`, "Nobody told the vendor." (L443) repeats the landing line "The vendor never heard a word from us." (L431). The send cost takes three lines for one idea. | Controller, one line per form. `full`: "They audited every battery site. The controller's still in water works and substations. Four hundred sites." Else: "Albion fixed its own plant. That controller also runs water works and substations. Four hundred sites, still open." Send: "Send it and the vendor starts on a fix. They'll go over that kit, so we pull the watch." Then, on `full or m04_crew_lost` only, its own line: "And Albion's inquiry gets to ask when we knew." The inquiry stays a whole sentence, never a printed clause. |
| A-05 | major | A1 L638–641 | "[I decoded his annotation sheet.]" is gated on `alpha_clip_played`, but the decode is a separate, optional workstation step (S4 L407, S6 §2.4). A player who only played the tape is handed a line saying they decoded something they never opened. | Ask stage 9 for an `onRead` latch on `alpha_annotations` (`alpha_annotations_read`; it is only readable after the identity scene, S6 L263). Gate the topic on it, with the button "[His annotation sheets, with the tapes.]". Keep "That's the version he taught us." Update S4 L229's reader note. |
| A-06 | major | A1 L302 (and B1 L174, L184, L210, L219) | "She fired it from Peg's office." HaX never calls Sorensen "Peg" anywhere else, and the player only hears the name from Noor or Tran. A player who skipped both gets an unknown name on the line that opens the next door. | "She fired it from Sorensen's office. I'm on the door." Change it in all five places, character for character. |
| A-07 | major | A1 L287 (and B1 L190) | "She watched the counter. Not the copy. One of them. Now." is lint `not-x-but-y`, and it's four fragments where the player needs one instruction. | "She only watched the counter. I can pull one before it wipes. Which?" Same string in both files. |
| A-08 | minor | A1 L146–150 | "[Who else is inside?]" / "[Just the guard?]" give the same fact in different words (flat). "The director's in" next to Netherton, "the Director", is confusing. | Keep one button, "[Who else is inside?]", with its L147 reply. Cut L148–149. |
| A-09 | minor | A1 L207–210 | "[Anything else on the entry?]" and "[Then I'll find out myself.]" both deliver H&L and the file number (flat). | One button: "[What else is on the entry?]" → L208. |
| A-10 | minor | A1 L198 | "Your exposure did that." spells out what the player can work out from the word "blown". | Cut it, keeping "The twenty-three are all marked 'blown'." |
| A-11 | minor | A1 L517, L521 | "Four o'clock" reads as a local time (the mission is UTC only). | "Oh-four-hundred, UTC. Two hours ahead of everyone else." |
| A-12 | minor | A1 L557 | "Every one is an entry from our own database" repeats L518/L520 a few lines later (the same fact twice). | "They're ours, turned round. We wrote the manuals. He read them more carefully than we did." |
| A-13 | minor | A1 L617 | "Coming in." HaX isn't the one coming in. | "Bringing you in. Netherton's in the hangar." |
| A-14 | minor | A1 L609 | "Tran's still in the closet." is an unlucky idiom, and "closet" is American in a British mouth. | "Tran's still at his tapes. Arakawa's people can collect him." |
| A-15 | minor | A1 L815–816 | The `recruiter_call_started` row can't be reached: `start` guard 2 (or guard 1 after a hang-up) exits before the hub. | Delete it, or leave it and note it as dead. |
| A-16 | minor | A1 L852 | "Read the part about old accounts." makes a VM claim but has no `// VM-STEER` mark. | Mark it for the VM plan. |
| A-17 | minor | A1 L143–145 | The Quintero line sits between two choice beats with nothing to react to. | Move it to directly after "Night guard. Twenty-four…" (L137), where the danger is. |
| A-18 | minor | A3-06a (A3 L19) | 37 words, over the 25-word phone cap. | Two texts, 5 s apart: "That box behind her is the last of the night. The legacy files." / "She gets to it when you pass her for the cabinet, or leave the cage. She won't stop for asking." |
| A-19 | major | A3-22b (A3 L54) | The cold-start lease remark contradicts the cold briefing (ruling 5). | Cold starts get A3-21; drop A3-22b. |
| A-20 | minor | A3-18 (A3 L42) | "the ledger stage" is game talk. | "I've a field guide for the ledger, if you want it. Ask me." |
| OK | – | A1 L579–594 | The Tesseract call: no narration, the aside stands in for it, one `*beat*`, the done flag above the last report line. | Keep as written. |
| OK | – | A1 L383–419 | The answers set the full tag set wherever they're answered, and `identity_resume` routes past the wall only after `confession_heard`. | Keep. Audio trims only (item A-b). |

## Group B: the archive's people and the Recruiter

Strongest group for voice. The Recruiter is recognisably m05's woman: she prices, never threatens, and says "Sensible." again. "I work with him. Tonight he forgot the difference." is the best line she has had. Sorensen's new recognition angles on `expose` ("Thirty-eight of them, and he asked to see every one.") and `surrender` ("the cheapest line in my book") fix W6-17 well. Tran states his price before the player agrees. Noor's "Forty-eight boxes" matches R-114 to R-161. Files: B1 `m09_phone_recruiter.ink`, B2 `m09_noor_haddad.ink`, B3 `m09_sorensen_hatch.ink`, B4 `m09_sorensen_cage.ink`, B5 `m09_sorensen_door.ink`, B6 `m09_old_coyote.ink`, B7 `m09_jesse_tran.ink`.

| Id | Level | Where | Problem | Fix |
|---|---|---|---|---|
| B-01 | major | B1 L82, L129, L131, L141, L144, L156 | Six lines over the 25-word phone cap (28, 33, 45, 33, 28, 31). L141 also breaks the 30-word cap (lint error). | L82: "Forty-seven names, and nothing points at you. Does your handler know? I have one more name for you. Keep this one too." (22). L129: "One of your four is mine. Was mine, until your Architect took them for Montana. The name tonight, for the deck. All of it." (23). L131: "I can't see which tape you pull, only that you pulled one. Take the name and pull anything, and I call my placement." (22). The cost she drops ("half my people will have moved") is still said before the button, by HaX's yes-block "She warns the rest, and Kowalczyk runs." L141: split into the hang-up block's existing string "Her file is her network, all of it. The Alpha tapes are him teaching, recorded." (L198, so the clip is shared) plus "He teaches what he'll do. If he built the bunker the way he taught it, it's on there." L144: "Buy from her and we go in an ENTROPY ledger, next to his orders. He'll read the sale, and he'll quote it at you." (24). L153+L156: "Sensible. Halina Kowalczyk. Her mother's care home has had my check for eleven years." / "She gave you something at the briefing, I expect. She's generous. It's how we hired her." Keep both tags above the first. |
| B-02 | major | B1 L156; L97, L131 | "cheque" from an American (Gacrux, educated DC). "ring" is British too, though m05 let her say it once. | "check". "I thought it polite to call." "I call my placement." |
| B-03 | major | B1 L133–141 | The same fact twice in a row: the default m05 arm "Her file has the handlers for all twenty-three placements." then "Her file is her network, all of it." | Cut the `else` arm (L137–139). Keep the `turn_double_agent` and `public_exposure` arms; they add something. A has to sign off (contract B-2). |
| B-04 | major | B3 L40–65 | The hatch's order blunts its spike. HaX's two long bin lines come between the cover reply and Sorensen's recognition. The recognition is the scene's turn (SE §8: "Sorensen quotes the Reading → released by the bin choice"), so the bins should sit right before the buttons. B5 already runs recognition first. | Recognition → "You're not from the lease-holder…" → "...She's got a file on you." → HaX's two bin lines → `back`. Same strings. |
| B-05 | major | B3 L59–60, B5 L29–30 | "You read Mr. Lawson his rights": SAFETYNET has no arrest powers (contract §8.2, PASS2 lesson 39). | "Viral Dynamics. You handed Mr. Lawson to the police, and he kept his promise and said nothing. He was always good about promises." Change both files, and the SE §3 table. |
| B-06 | major | B6 L56 | "You're not the auditor." The truth button shows on the first challenge, before any cover, and after the contractor cover. In both cases he answers a claim nobody made. | "Figured. Auditors bring coffee. I'll be in the truck." |
| B-07 | major | B2 L101, L104; B6 L50, L88; B3 L109 | Stage-direction labels instead of the player's words (contract §8.2; skill §2b). | B2: "[That bonus wasn't for filing. She was sizing you up.]" / "[Read this. It's her ledger. You're on it.]". B6: "[I'm not an auditor. You don't want to see tonight.]". B3: "[What's in tonight's run?]" (clone tag unchanged; Noor's list question is the model). "[Walk past her.]" (B5 L71) and "[Hang up.]" stay: they are wordless acts. |
| B-08 | major | B4 L28 / L49 | "dear" twice in one scene. | Ruling 2. |
| B-09 | minor | B2 L34, L41, L75, L77, L108 | British in an American mouth: "round the side", "rang me… rang back", "trolleys", "Mind the trolleys." | "around the side", "called me… called back", "carts", "Watch the carts." (HaX's "trolleys" stays; she's British.) |
| B-10 | minor | B3 L112, L123; B4 L43, L67 | Sorensen says "Mind…" four times. It's British, and repetitive. | "Careful of the ink. It doesn't come out of a cuff." / "Watch the step on your way." / "Keep your sleeves away from the feed." / "The gate sticks." |
| B-11 | minor | B3 L114 | "Take the print if you like" answers a card clone. It works only because the stamp is in reach (S4 L84), and a player won't connect the two. | Keep. Optional: "Take what you like off me. By the time it matters, the shredder will have caught up." |
| B-12 | minor | B4 L53 | "[He kept his own papers off your list…]" while the player holds Nightshade's file: "he" could be Nightshade. | "[Your Architect kept his own papers off your list. Only yours burn.]" (11 words) |
| B-13 | minor | B1 L119–120 | Two lines before the grievance where one will do (audio). | "Margaret's shredding eleven years of my placements tonight, for his schedule. I'd like something back on the books." Contract B-2 asked for the tasking line here; the writer moved it into L129. That's fine. |
| B-14 | minor | B1 L121–126 | "[Why ring me?]" → "You're the one standing in it…" is a second stance with a weaker reply (audio). | Replace with "[Go on.]" and no reply. Keep "[He's ENTROPY's planner. You work for him.]" and its reply. |
| B-15 | minor | B1 L97–98 | Two cold-start lines (audio). | "Agent 0x00, with a card cloner, a safe cracker and a handler listening. You're standing in my filing system. I thought I'd call." (23) |
| B-16 | minor | B2, B3, B6, B7 re-entry and exit cycles | Filler variants are 14 of Old Coyote's 22 lines, 8 of Noor's 24. | Optional trims in the audio list. |
| OK | – | B4 L53–57, L64–65 | The pencil line, then only narration after it. B-5 is met. | Keep. |
| OK | – | B7 | The price before the deal; "the Bozeman number", so Netherton's "being watched, and knows it" holds. | Keep. |
| OK | – | B1 L44–76 | The restart guards, the `~` defaults and the hang-up route all write legal pairs. The three HaX blocks match A1 character for character. | Keep, and re-diff after A-06/A-07. |

## Group C: cutscenes, callers, clip, texts

Netherton is consistent with m08: formal, few contractions, verdicts. His card beat ("He doesn't look down for the second.") and "Dr Adrian Tesseract. It is easier to say in a hangar than it was on the plane." are the debrief's two best moments. The debrief's replay guards are sound. Gary and Nightshade sound like themselves. The closing card holds five lines on every route. Files: C1 `m09_briefing.ink`, C2 `m09_closing_debrief.ink`, C3–C5 the three callers, C6 `m09_alpha_recording.ink`, C7 `texts/C_texts_and_credits.md`.

| Id | Level | Where | Problem | Fix |
|---|---|---|---|---|
| C-01 | major | C2 L70–77; C7 L57 | "[It opened the safe.]" is false on the PIN route. | Ruling 1. |
| C-02 | major | C1 L231 | "He was one of ours, once." gives away the identity scene's first turn ("It's one of ours. A SAFETYNET staff credential.") hours early. SE §8: "Nothing she says earlier may pre-empt it." | Cut the sentence: "They call him the Architect. We have a suspect." |
| C-03 | minor | C1 L59 | "I'll tell you the rest on the plane" contradicts her close, "Line's open from wheels down." (L307). | "Sorry about the leave. This is why." |
| C-04 | minor | C4 L24, L25, L34 | "a line in a list / a line in her book / a line in her book" three times in a five-line call. | L34: "Safe enough. Please be quick." |
| C-05 | minor | C7 L78 | Tran's default credit, "went home", contradicts HaX's "Arakawa's people can collect him." | "Wiped the tape side. Nobody stopped him." |
| C-06 | minor | C2 L196; C7 L61 | "a concussion" names an injury (SE §1, contract §8.2). | "Mrs Sorensen woke up asking for a lawyer. She has not said a word since." / credit: "Stopped at the shredder. Asked for a lawyer." |
| C-07 | minor | C1 L264 | "Somebody always asks me that. Now." The one-word answer can be heard as "now (somebody asks)". | "Somebody always asks me that. This time it's now." (fixed string; optional) |
| C-08 | minor | C1 wall L97–221 | 44 distinct HaX lines for one montage. | The audio list merges four arms. |
| C-09 | minor | C1 L284 | "The long way is over." is opaque (SE's line, kept as fixed). Kowalczyk's comeback rescues it. | Leave, or "No more going the long way round." |
| OK | – | C2 L144 | The `{&…}` cycle. | Ruling 6. |
| OK | – | C2 L57–84 | double_crossed first; warm/flat; the narrator's silence on `sleeper_named` + flat. | Keep (after ruling 1's rewording). |
| OK | – | C3 L28 | Nightshade's aphorism ends the call as SE asks ("the last line turned into a general truth"). It sounds like him, and it's his one. | Keep. |
| OK | – | C6 | The clip, HaX's silence while it plays, the degaussed branch. | Keep. |

## The ten worst lines

| # | Where | Now | Rewrite |
|---|---|---|---|
| 1 | B1 L131 | "I can't see which tape you pull. I can see that you pulled one. Pull anything after you've had the name, and I'll ring my placement and tell them they've been sold. You'll have bought nothing, and half my people will have moved by morning." (45 words, on a phone) | "I can't see which tape you pull, only that you pulled one. Take the name and pull anything, and I call my placement." |
| 2 | B3 L60, B5 L30 | "Viral Dynamics. You read Mr. Lawson his rights, and he kept his promise and said nothing." | "Viral Dynamics. You handed Mr. Lawson to the police, and he kept his promise and said nothing." |
| 3 | A1 L325 | "You never told me about the hand on his file. I looked while you were busy. It's his." | "You never told me about the writing on Nightshade's file. I put it next to my notebook. It's his." (moved above the credential) |
| 4 | C1 L231 | "They call him the Architect. We have a suspect. He was one of ours, once." | "They call him the Architect. We have a suspect." |
| 5 | A1 L287, B1 L190 | "She watched the counter. Not the copy. One of them. Now." | "She only watched the counter. I can pull one before it wipes. Which?" |
| 6 | C2 L70 | "[It opened the safe. Thank you.]" | "[Thank you. I was glad of it.]" |
| 7 | A1 L347 | "He taught me to read people. I never once read him." | Cut. |
| 8 | B6 L56 | "You're not the auditor. Auditors bring coffee. I'll be in the truck." | "Figured. Auditors bring coffee. I'll be in the truck." |
| 9 | A1 L302 and B1 ×4 | "She fired it from Peg's office. I'm on the door." | "She fired it from Sorensen's office. I'm on the door." |
| 10 | B2 L101 | "[Tell her what the bonus was.]" | "[That bonus wasn't for filing. She was sizing you up.]" |

## Audio cut list and new counts

Counted as distinct voiced lines (one TTS clip each), by hand from the source, with `{&…}` alternatives counted one each. Phone texts and HaX's hub aren't voiced. Person-chats are voiced in full, Narrator included.

### Group A voiced knots (`deck_resume`, `identity_scene`, `identity_resume`, `tesseract_call`)

Now: **70** (HaX 67, Netherton 3). Seven `deck_resume` lines are B1's clips (same text), so **63 new**.

| Item | Lines | Change | Saves |
|---|---|---|---|
| A-a confession forms | L345–361 (14) | Nine lines. Found + teacher: "I gave you his name after HashChain and called it Satoshi's guess. It was mine as well." / "I told you on the handset he taught me. I put his name in a drawer." Found: L350 as is. Teacher: L354 and L356 as they are. Neither: L359 as is. Shared, on found and neither: "He taught me. The notebook in my case file is from his course. Those margins are his." (one string for L351 and L361). Close, on the found forms: "He was mine, and I wanted to be wrong."; on the eighty-seven-per-cent forms: "He was mine. I wanted the other thirteen." Cut L347, L348, L352 (merged into the close), L357, L360. | 5 |
| A-b answers | L387–418 (9) | Six lines. `should`: "Yes. I should have." / "You get all of it from now on." `same`: L404. `afterwards`: "...That's mine. You don't get to use it on me. *beat* Thank you." (L413 + L417). The Reading forms become one line said before the normal reply: `should` "He wrote that I'd cover for you. He'd know. He taught me."; `same` and `afterwards` "He wrote that I'd cover for you. Tonight you covered for me." Cut L401, L402, L414 (L392 and L416 are already the same strings). | 3 |
| A-c Albion buttons | L448–451 (2) | Cut (A-03). | 2 |
| A-d controller | L442–446 (4) | One line per form (A-04). | 2 |
| A-e watch | L454–459 (3) | One line: "That's where our watch is. If anyone tries that kit again, we see them." Voltage is lost here, but the wall card still carries it. | 2 |
| A-f send and inquiry | L461, L464, L466 (3) | "Send it and the vendor starts on a fix. They'll go over that kit, so we pull the watch." plus, conditionally, "And Albion's inquiry gets to ask when we knew." | 1 |
| A-g kept | – | `deck_resume` (8), opening (6, Netherton's three fixed), the recognition lines (2), the wall (2), back to work (1), `identity_resume` (1), the Tesseract call (9). | 0 |

New total: **55** (52 HaX, 3 Netherton), **48 new clips**. One playthrough hears about 35, which may be what the ~35 budget meant.

If the budget is distinct clips and must come lower (tier 2, to 49 / **42 new**), merge the four m04 landing lines into two (`full` / everything else, using L437's "This is the hole Critical Mass came through at Albion. We'd known about it for nine years."), saving 2. Drop the `m03_directive_decoded` recognition (L341), saving 1. Fold the teacher-discussed arms into the found / neither forms, saving 3. Each of those cuts a carry-over the user asked to feel. I'd stop at tier 1.

### The Recruiter's call (B1 `call`, `resume_name`)

Now: **Recruiter 17**, HaX 20 (7 shared with A1).

| Line | Change | Recruiter |
|---|---|---|
| L97 + L98 | merge (B-15) | −1 |
| L119 + L120 | merge (B-13) | −1 |
| L125 | cut, button becomes "[Go on.]" (B-14) | −1 |
| L153 + L156 | "Sensible." folded into the naming line, which splits in two (B-01) | 0 |
| L82, L129, L131 | trimmed to one line each (B-01) | 0 |
| HaX L137–139 | cut the default arm (B-03) | (HaX −1) |
| HaX L141 | becomes the L198 string (shared) plus one new line | (HaX 0) |

New: **Recruiter 14**, HaX 19.

### The briefing's wall (C1 L95–221)

Now: 44 HaX lines (cards, intro and the shared "rest" line). Merges, each a whole fixed sentence:

- m01: `m01_completed` with no named choice (L108) takes the cold line (L110) (−1).
- m04: two lines instead of seven sentences. "Albion. Voltage is in custody." / "Albion. Voltage got away." then "You told the inquiry everything about how Critical Mass got in." / "You told the inquiry half of how Critical Mass got in." / "The report said maintenance fault, and you let it.", with the cold L156 unchanged (7 → 6, −1, and each clip shorter).
- m05: `arrest` (L171) takes the cold line's wording, "…stole for the Recruiter to pay for his wife's treatment. Arrested.", for both (−1).
- m07: `trojan_horse` with `m07_team_redirected` (L191) takes L193 (−1). The nuance lost is "with the clock running".
- Optional: m02 exposed + deal (L116) folds into L118 (−1). This loses the deal carry, so I don't recommend it.

New: **40** (39 with the m02 merge). Briefing file total 97 → 93.

### Optional person-chat trims (re-entry and exit filler)

- B6 Old Coyote 22 → 15: one variant each for L29, L31, L33, L47; two for L72; one for L91.
- B2 Noor 24 → 21: two for L75 and L77; one for L108.
- B3 Sorensen hatch 34 → 30: one each for L75, L77, L112, L123.
- B7 Tran 14 → 12: two for L39; one for L57.

## Finding counts

| Group | Blocker | Major | Minor | Total |
|---|---|---|---|---|
| A | 0 | 8 (A-01–A-07, A-19) | 12 | 20 |
| B | 0 | 8 (B-01–B-08) | 8 | 16 |
| C | 0 | 2 (C-01, C-02) | 7 | 9 |

After the fixes: recompile, rerun dialoguelint, and run tagdiff on A1, B1, B3, B5 and C2 against this commit. Re-diff the three shared HaX blocks between A1 and B1 character for character. Update CONTRACT §2.1, §2.3, §3.1, §3.2, §3.4 and §4.1 for the revised fixed strings (ruling 7).
