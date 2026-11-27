# m10 Full Disclosure: stage 6 review, round 2

## Scope and what was read

Reviewer: fresh, read-only, 2026-10-21, both lenses (writing, and clues and consistency). Target: `lore_fragments.md` draft 2 ("LF", cited by line), after round 1's 47 findings were folded in.

Read: `docs/agents/FINALE_BRIEF.md`; LF in full, including §8; `REVIEW_R1_WRITING.md` and `REVIEW_R1_CLUES.md`; `stage_4/objectives_tasks.md` §6 and §16 ("OT"); `stage_5/room_layout.md` §2 ("RL"); `stage_3/moral_choices.md` §12 ("MC", for the value sets); README "Closing card and credits" (L1561–1593); `music/closing-sequence.js`, `music/scenario-music-events.js:35-55, 130-140`; `minigames/helpers/chat-helpers.js:456-512` (`#set_global`); `systems/npc-conversation-state.js:547-592` (ink variable sync); m09 `stage_6/lore_fragments.md` (shared facts). No VM material opened.

Mechanical checks over the whole of LF: no em dash in any player string (the only one is a table cell, L1230); none of the banned words; every backticked `globalVars` condition matches `!?globalVars.x ( ===|!== value)?` joined by `&&` only (a regex over all of them: no `||`, no parentheses, no arithmetic; the two templated rows, L788 and L829, take the same form).

Severity as round 1: **blocker** stops stage 7 or makes a branch unwinnable; **major** a wrong fact or a flaw a player will see on a reachable save; **minor** a gap, a stale claim or polish.

## 1. Round 1 findings: confirmation

Each finding checked at its landing place, and a grep run for the stale wording (none of "NIGHT ROTA", "kettle", "data centre", "Plant room", "Twelve days", "observationDisplay", "(12, 8)", "rather be anywhere", "being sourced", "who taught you", "still open from that end", "reach the master", "Two turns", "Nothing to read yet", "She wasn't there", "among them the cells" is left; "Swept up at six" only on Fonoti; "ninety days" only in D's disclosed line).

**Writing (W-01 to W-25): all resolved**, with two partial:

- W-01 incident file stops at "followed" (L51); the core index says "Open." (L502). Resolved.
- W-02 card shapes varied (§3.2). Resolved on rich saves; on thin saves the card still ends on the cells count (R2-03).
- W-03 "ninety days" once (L769); human lines all name people (L817–826). Resolved.
- W-04 ELSEWHERE never repeats the human line: every person-line the card can take carries `close_human !==` (L1106–1126), dispatch is gone from ELSEWHERE, the tap line is gone. Resolved for the human line. **New repeat found elsewhere**: the Architect's card line is repeated by his own credit (R2-01). LF L748's "No line of the card is repeated below it" is therefore not yet true.
- W-05 three movements, fixed last line (L1079–1129). Resolved.
- W-06 "Swept up at six" on Fonoti only; every other clause has its own detail (L963–1042). Resolved.
- W-07 "ENTROPY's couriers". Partly: the card still counts the couriers as a cell ("Three cells broken, ENTROPY's couriers among them."), and the trace and bait buyers are counted the same way (R2-11).
- W-08 to W-25: each at its landing place as §8 says (strip addressed "For whoever checks his sums.", index voice, "reading, for 0x00", "After the four-site night.", American words, duty board order, payment header, "0x00" in the credits, quoted Nightshade, Hollis photo in the observation, isolator default, three additions, gate hut, Join's movement 1, Wendell, Asante, item 4, projection desk). Resolved. The one "you" left in the close is Join's card (R2-10).

**Clues (R1C-M1 to M4, R1C-m1 to m18): all resolved**, with two partial:

- M1 sign-out split (L80–83): `taken` keeps "H.K., K.A.", `double_crossed` has "K.A." alone. Resolved.
- M2 `koImmune` table copies (S6-26, §5 L1230). Resolved for Kowalczyk and Quintero; the same gap remains for Arakawa (R2-07).
- M3 Scorched Earth D split (L770–771). Resolved.
- M4 HaX's feed clause on `head_start_killed` (L865–866). Resolved.
- m1 92,460 sourced as the sum (L382, §4.4); m2 Walsh line cut (L1066); m3 continuation lines carry the parent's condition and Carrow takes the rest (L1106–1113); m4 Malhotra on named saves (L929); m5 locals in S6-12; m6 Quintero row and "Phantom's list, with the sheet" (L1214, L1229, L1231); m7 strip is the code alone (L297); m8 empty defaults (L380, L492); m9 fields and positions; m10 payment frame (L600, L612); m12 trace name needs `head_start_killed != "ghost"`; m13 override tag; m15 Ghost clause 6; m16 `vos_outcome` default `""`; m17 ruled; m18 quote, Qureshi, panel default. All resolved.
- m11 (case open at 01:45): the kit table no longer says "open", but the sheet still shows 01:52 while every clock reads 01:45 for the whole briefing step (R2-07).
- m14 (Join and "at six"): Join arms added for six people; Voltage, named in the finding, has none (R2-05).

**Stale copies found:** L1277 still asks stage 9 to confirm `points_landed` "since the credits read it" (they no longer do; R2-09). L748's no-repeat claim (R2-01).

## 2. The closes, assembled

Three saves, run through `close_compute` (LF §3.1) by hand, then through the card and credits rows. Each of the six endings is shown on one of them.

**Careful save** (every mission played): m02 Ghost's deal kept; m03 Victoria recruited, `confronted` at the gallery; m04 `full`, Voltage captured; m05 list found, no deal, Elena funded; m06 assets seized, Hollis evaded; m07 `trojan_horse` (Austin covered); m08 Nightshade triple agent, shown the file; m09 `named`, notice sent, legacy files saved. Console kills Zero Day's share, so `head_start_out = none`; `secured`. Computed: `close_secure_cell = zd_uk`; `close_cells = c4` (secured 1, surrender 2, m07 1); `close_cell_name = couriers`; `close_human = albion_full_sent`; `close_zero_day = trading`.

E2 surrender card:

```
Dr Adrian Tesseract: cooperating. No trial.
The database: back in the vault. Infusion pumps in 140 hospitals are still unpatched.
Nothing went at four.
Four cells broken, ENTROPY's couriers among them.
The Albion inquiry made a minister answer for the plant's security, then asked SAFETYNET when it knew.
```

Credits: MISSION COMPLETE / FULL DISCLOSURE; IN THIS OPERATION reads well, each line its own (Netherton "Signed for all of it.", HaX in the van, Nightshade "Held the outer lock...", Victoria "Held, and opened the lock. The tap on Zero Day's brokers went dark at five."), and ends on **"DR ADRIAN TESSERACT: Cooperating. No trial."**, the card's first line again (R2-01). THE CELLS: couriers, quartermaster, Zero Day's UK desk, Walsh stopped, Reeves and Ashford standing; the four broken match `c4`. ELSEWHERE: the Recruiter's network, Hollis home with his kids, "Zero Day: still trading."; the placements; "Every one of the forty-seven was warned in time.", Elena Torres, the telescope. The Albion line is not repeated. **Reads as an ending; right note.** E1 on the same save: card line 4 becomes "Two cells broken, Zero Day's UK desk among them.", and his credit "Awaiting trial." echoes card line 1.

**Ruthless save**: m02 Reeves `escaped`; m03 Victoria `arrested` (Vos's branch); m04 `partial` with crew lost; m05 list not found; m07 `fracture` (Austin uncovered); m08 Nightshade arrested, no deal; m09 `refused`, notice not sent; Ghost selling; console skipped, so `head_start_out = both`; `secured`. Computed: `close_secure_cell = cm`; `close_cells = c2`; `close_cell_name = cm`; `close_human = dispatch_dropping`; `close_zero_day = vos_named`.

E4 executed card:

```
Dr Adrian Tesseract: shot unarmed.
The database: back in the vault. Infusion pumps in 140 hospitals are still unpatched.
Two cells have it.
Two cells broken, Critical Mass among them.
In eleven counties, people calling for help still get a dead line. Day thirteen.
```

Lines 3 and 4 both open "Two cells", which brings back the list rhythm W-02 removed (R2-11). Credits: MISSION COMPLETE, AGENT 0x00: IN CUSTODY; 0x00 "Held until the board sits.", Netherton "Would not sign.", HaX's designation line, Ghost "Sold the head start. Clean exit, no trace.", and Tesseract **"Shot unarmed."**, the card again (R2-01). THE CELLS: Critical Mass, Reeves's cell at Fracture, Walsh and Ashford standing. ELSEWHERE: Graham Reeves; "Social Fabric's story ran at six. One paragraph of it was true."; Zero Day and Vos; Albion's inquest (the card took dispatch, so it prints here); "None of the forty-seven were warned."; the telescope. **Ends on the right note**: the telescope after an execution reads as intended irony. E3 lethal on the same save: card line 1 "dead at his console, reaching for the key.", credit "Dead at his console, reaching." (R2-01).

**Cold start** (no imports): m07 unplayed reads Austin covered; Victoria `""` (Vos's branch); Ghost selling; console traces Zero Day's share, so `head_start_out = both` with `share_zero_day = traced`; `secured`. Computed: `close_secure_cell = book`; `close_cells = c3` (trace 1, secured 1, m07 1); `close_cell_name = book`; `close_human = none`; `close_zero_day = vos_named`.

E1 arrest card:

```
Dr Adrian Tesseract: in a cell, awaiting trial.
The database: back in the vault. Infusion pumps in 140 hospitals are still unpatched.
Two cells have it. We followed Zero Day's.
Three cells broken, the order book's largest buyer among them.
```

**Ends on a count, not a person** (R2-03). THE CELLS: the order book's buyer, Zero Day's four buyers, Walsh stopped, Reeves and Ashford standing. ELSEWHERE: Zero Day and Vos; the telescope.

E5 scorched, cold start, console skipped:

```
Dr Adrian Tesseract: gone, with everything he remembers.
The database: gone, both copies. The cells kept what they took at four.
Two cells have it.
One cell broken: Jennifer Walsh's cell.
```

Ends on "cell ... cell" and a count (R2-03, R2-11). Credits: MISSION COMPLETE, AGENT 0x00: SUSPENDED, then "AGENT 0x00: Suspended." and "DIRECTOR MAGNUS NETHERTON: Suspended 0x00, and not himself." (R2-04). Tesseract's credit "Gone by the service door. He left a card." differs from the card, as every ending's should.

E6 Join, any save: "Dr Adrian Tesseract: with you." / "The database: everywhere." / "Every cell has it." Then MISSION FAILED, his figure, the corrected figure, IN THIS OPERATION with Join arms, ELSEWHERE movement 1 ending "Zero Day: still trading." **Reads as an ending; right note.** The "you" is the only one in the close (R2-10); Voltage, on an m04 escaped save, prints "Still at his switchgear when the team came down." (R2-05).

**Mechanics across all six:** the card never exceeds five lines (A, D, H, C exactly once each on E1–E5; U at most once; Join three); the human line is never repeated in ELSEWHERE on any save walked (dispatch is not in ELSEWHERE, every other U line is guarded); the teaser slot is empty and off.

## 3. Conditions and `close_compute`

**How the card reads globals.** `scenario-music-events.js:135-139` calls `buildEndSequence(entry, window.gameState.globalVariables, cond => evaluateCondition(cond, data))`, and `evaluateCondition` (L35-55) evaluates each condition string with `globalVars` bound to `window.gameState.globalVariables` at the moment the `conversation_closed:<npc>` event fires. So anything written to `gameState.globalVariables` during the closing scene is seen by the card. Both ink write paths do that synchronously: the `#set_global` tag (`chat-helpers.js:456-505`) and a plain ink assignment to a declared global (`npc-conversation-state.js:556-592`, the `variableChangedEvent` observer, which writes `gameState`, broadcasts and emits). So `close_compute` is consistent with the card in its data path, provided the five globals are declared in `globalVariables` (S6-23 says all three legs are).

**The write mechanism** is the one soft spot (R2-06): LF says the function writes "by `#set_global`". A tag carries a fixed value, so a function would need one tagged line per value per branch, and nothing in the shipped ink emits `#set_global` from inside an `=== function` (grep over `scenarios/**/*.ink`: m07's functions return values, the one `#set_global` near a function, `m07_npc_james_mercer.ink:327`, is in a knot). Plain `~ close_cells = "c3"` assignments inside the function do the same job through the observer above, and need no tag support in functions.

**Inputs that could change after the compute.** None of the five derived strings reads a global the closing scenes write (`ending`, `database_outcome`, the head-start globals, `victoria_gallery`, `vos_outcome` and the imports are all settled before `six_oclock`). On E5 the compute runs again at the hearing, harmlessly.

**Conditions.** Every card and credits condition is `&&`-only `globalVars.` tests (§ "Scope"). The derived values are exclusive by construction: `c0` only with `none`; `none` only when m07 was played with no assignment and nothing else applies; the console term and the `bait`/`trace` names can't both hold (one `head_start_killed` value). The cells count matches THE CELLS on every save walked in §2.

## 4. The whodunit's paper and the margin strip

**Whodunit, every branch after the sign-out split.** Default, tether, tripwire, Arakawa-down, Malhotra-out, Vector/Phantom, Quintero-out, Nightshade-helper and m09-shortlist rows (LF §5) all still cross at Kowalczyk: the sheet's default names "Kowalczyk / Arakawa" and "H.K., K.A."; the bench log ties the WREN cloner to breaching case 2 and the 01:58 read; the door log gives 02:10 and Malhotra's badge; the alibi (or its helper) gives the tunnel pair. No document puts a name next to "WREN". The split variants live only where the whodunit is off (`whodunit_live` false on `taken` and `double_crossed`, OT §16), and neither now points at Arakawa: on `taken` the unused cloner sits in a case both of them packed. Malhotra's credit drops "His badge didn't." on those saves. **Fair on every branch**, with one residue: Arakawa's table copy is still knockable during the briefing step in which the sheet says he opened the case (R2-07).

**The Base64 strip** (LF L297). One line inside its own fenced block, nothing else on the line: 212 characters, letters and digits only, no padding. `base64 -d` gives exactly:

> For whoever checks his sums. Recovery counted twice, hospital rows. True range 2,100 to 3,600. My model is on the bench terminal, key DOUBLECOUNT. Abena Asante

Re-encoding that sentence gives the same string byte for byte. The key matches `model_terminal`'s `requires: "DOUBLECOUNT"`, the range matches `asante_model`, Join's credits and §4.4. The `text` is the code alone, so a whole-page paste decodes cleanly. Passes.

## 5. Findings

No blockers. Three majors, eight minors.

### Major

**R2-01 (major). The Architect's card line is repeated by his own credit.** LF L756–762 (card A) against L1044 (his IN THIS OPERATION clause). E2: card "cooperating. No trial." and credit "Cooperating. No trial.", word for word. E4: "shot unarmed." and "Shot unarmed.". E3: "dead at his console, reaching for the key." and "Dead at his console, reaching.". E1: "in a cell, awaiting trial." and "Awaiting trial.". Only E5 and E6 differ. This is W-04's problem (the same sentence twice inside a minute reads as a template) on the line that matters most, and it falsifies L748's "No line of the card is repeated below it". **Fix:** keep the card lines; give each credit a fact the card doesn't carry, in the way E5's "Gone by the service door. He left a card." already does. Suggestions (the author should take true details from SE §2): E1 "Walked to the van without being asked."; E2 "Gave up his couriers before the van door shut."; E3 "His key never went down." (w); E4 "Hands empty, in plain sight." (w), which picks up the executed screen's one true paragraph. Then L748 is true.

**R2-02 (major). "Four buyers" twice on a five-line card.** LF L780 (H: "Zero Day has it. We followed it to four buyers.") with L799 and L808 (C name `trace`, "Zero Day's four buyers"). Reachable wherever the trace is the C name and Zero Day's share went out traced: any `disclosed` arrest or lethal with a trace, and Scorched Earth with a trace. The card then reads "Zero Day has it. We followed it to four buyers." over "Two cells broken, Zero Day's four buyers among them.", the same W-03 fault ("ninety days" twice) that round 1 rated major. **Fix:** H's traced form becomes "Zero Day has it. We followed it." (the `both` form, "We followed Zero Day's.", already has no number); the count stays in THE CELLS ("Zero Day's share: four buyers followed. One was careless.").

**R2-03 (major). On thin saves the card ends on a count.** LF L827 (`close_human = none`: "no line; the card runs four") with L752 ("the last line is a person"). U is `none` on every cold start (no m04, no m05, m07 unplayed reads Austin covered), and on played saves with Austin covered, a `quiet` m04 and either no m05 or all forty-seven warned with Elena unfunded. The card then ends "Three cells broken, the order book's largest buyer among them." or, on a cold Scorched Earth, "One cell broken: Jennifer Walsh's cell." (§2). That is the status-board ending W-02 was raised to remove, on the save type a standalone player or a playtest S-save gets. **Fix:** give `none` a person. The cleanest is the season's last line, which is already true on every E1–E5 save: `close_human === 'none'` → "In Billings, a girl turns nine on Saturday. Her father is bringing a telescope." on the card, and ELSEWHERE's telescope row gains `globalVars.close_human !== 'none'`, so it never prints twice. ELSEWHERE on those saves then ends on its last movement 1 or 2 line ("Zero Day: still trading." on a cold start), which is the Join ending's accepted last line anyway. Alternatively write one new line about a person from tonight that holds on every E1–E5 save; the telescope has the advantage of existing and being checked.

### Minor

**R2-04 (minor). "Suspended" three times in the Scorched Earth roll.** LF L727 and L720 (title "AGENT 0x00: SUSPENDED"), L850 (0x00's clause "Suspended."), L858 (Netherton "Suspended 0x00, and not himself."). The title, then "AGENT 0x00: Suspended." a few lines later. E4 has the same shape milder ("IN CUSTODY", then "Held until the board sits.", which at least adds a fact). **Fix:** cut 0x00's clauses 3 and 4 (the title carries both), so the player's line prints only on Join and on `recruiter_secret = told`. While there, "Told their handler." is unreadable in the credits without its m09 context: "Told their handler about the Recruiter's call."

**R2-05 (minor). Voltage has no Join arm.** LF L972–981. R1C-m14 named Voltage escaped among the six-o'clock lines that print on Join; §8 (L1347) lists the Join arms added and Voltage isn't among them. On an m04 `escaped` save that joins, "Still at his switchgear when the team came down." describes a sweep that never happens. **Fix:** before clause 8, `globalVars.ending === 'joined' && globalVars.m04_voltage_escaped === true` → "Still at his switchgear." (Also worth a look on Join: Quintero's clause 3, "Talking by six.", if `quintero_wounded` can be true on a Join save.)

**R2-06 (minor). `close_compute`'s write mechanism.** LF L731 and S6-23 say the function writes its five strings "by `#set_global`". A tag is a fixed string, so a computed value needs a tagged line per value per branch, and no shipped ink emits `#set_global` from inside a function (§3). **Fix:** say in S6-23 that `close_compute` assigns the five declared globals with `~ close_x = "value"`; `npc-conversation-state.js:556-592` copies the change to `gameState.globalVariables` at once, which is what the card reads. Keep the letter-first values (harmless, and safe if anyone later writes them by tag).

**R2-07 (minor). The sign-out sheet and the briefing step.** LF L66, L125, L1230; OT §6 L346–347; RL L88. Two leftovers from R1C-m11 and R1C-M2. (a) The raid clock reads 01:45 for the whole briefing (`t0145` lasts until the split), and the sheet is readable throughout, so the player can read "Opened: 01:52." while every screen says 01:45. (b) `arakawa_post` is knockable at the table in that same step, so a player who floors him during the briefing later reads that he opened the case at 01:52. It doesn't mislead (he is innocent and the deduction still lands on Kowalczyk), but it is the "paper records an act by someone already down" bug that M2 fixed for the other two, and §5 L1230's "no paper ever records an act by someone the player had already put down" overclaims. **Fix:** add `arakawa_post` to S6-26's `koImmune` table copies (his gate copy stays knockable, so §5's Arakawa-down row still works), and add a sheet variant on `globalVars.raid_clock === 't0145'`, after the two m09 variants, reading "Opened: not yet." with the packers unchanged; from `t0200` the sheet reads 01:52.

**R2-08 (minor). The bench copy of the casualty sheet is not word for word with m09.** LF L275–281, L288. m09 stage 6's `mirror_job_printout` (its L288) now has a capitals heading line, "PROJECTED DEATHS ATTRIBUTABLE TO THE PUBLICATION, FIRST THIRTY DAYS", not a bold heading, and puts "Assumes the cells move first." and "An acceptable price for the last arms race. -- A." on separate lines. m10 sentence-cases the heading and joins the two lines, while L272 and L288 claim "the same five lines, the same line breaks". The schedule's "SAFETYNET disposition: retain." (L415) also differs from m09's "Disposition: RETAIN." (m09 L496 says the two match). **Fix:** copy m09's six lines exactly (the "Printing 3. Refit model." line and the three additions stay); correct L288's note; use "RETAIN" in capitals as m09 does.

**R2-09 (minor). Stale stage 9 check.** LF L1277: "that `points_landed` is a declared global, since the credits read it". After R1C-M4 no credit reads it. **Fix:** drop the clause.

**R2-10 (minor). Join's card says "you".** LF L1135: "Dr Adrian Tesseract: with you." §0 L19 and W-15 settled that the close calls the player 0x00 and never "you"; this is the only exception left. It may be deliberate (the defection is the one ending that speaks to the player), in which case say so in §3.6. Otherwise "Dr Adrian Tesseract: free." (his credit, "Walked out with 0x00.", already says who with).

**R2-11 (minor). The cells line's shape.** LF L805–809. (a) "One cell broken: Jennifer Walsh's cell." says "cell" twice in six words. (b) Groups that aren't cells are still counted as cells: "Three cells broken, ENTROPY's couriers among them." (W-07's remaining half), "One cell broken: the resale share's five buyers.", "Zero Day's four buyers". (c) On every save where H is "Two cells have it." and the count is two, lines 3 and 4 both open "Two cells" (§2, ruthless E4). **Fix:** lead with the name and let the count follow it, which removes all three: c1 "<Name> broken. No other cell."; c2–c5 "<Name> broken, and <one/two/three/four> more." With the m07 names as possessives ("Jennifer Walsh's cell broken. No other cell." reads badly, so name m07's as "Jennifer Walsh's people", "Michael Reeves's people", "Marcus Ashford's people" on the card; THE CELLS keeps "cell"). Examples: "ENTROPY's couriers broken, and two more." / "Zero Day's UK desk broken, and one more." / "Jennifer Walsh's people broken. No other cell." / `c0` unchanged.

## 6. Weakest passages, with rewrites

**P1. HaX's surrender clause** (L868). "Sat with him in the van for a minute. Told him what she'd taught 0x00 that he hadn't." Round 1's P10 fixed the ambiguity but the sentence now trips over "she'd ... that he hadn't". Rewrite: "Sat with him in the van for a minute. Told him 0x00 was hers, not his."

**P2. Nightshade, clause 1** (L877). "Held the outer lock. Moved under a new name, and unreachable." The ", and unreachable" hangs off a verb phrase. Rewrite: "Held the outer lock. Gone by morning, under a new name."

**P3. The player's own line** (L848). "Told their handler." Out of context the credits reader can't tell what was told. Rewrite: "Told their handler about the Recruiter's call." (R2-04.)

**P4. The cells line** (L807–809), on a cold Scorched Earth: "One cell broken: Jennifer Walsh's cell." Rewrite (R2-11): "Jennifer Walsh's people broken. No other cell."

**P5. Tesseract's credits** (L1044), E2: "Cooperating. No trial." printed under a card that opened with the same words. Rewrite (R2-01): "Gave up his couriers before the van door shut." The other endings likewise, as R2-01.

**US/UK.** Clean. American paperwork is American (ROSTER, coffee pot, civil defense, data center, MAINTENANCE. SPARES); SAFETYNET's papers and Nightshade's are British ("Fibre scope", "DEFENCES", "catalogue"). "Dr" without a full stop throughout. One judgement call, not a finding: the bunker's alarm log says "After the four-site night.", which is SAFETYNET's name for the attacks in an American guard's book; "After the attacks." would sit better if the author agrees.

**AI tells.** None of the banned words, no em dashes in player text, no "not X but Y". The card's rhythm is varied on rich saves; the "Two cells / Two cells" pairing (R2-11) is the one place the old list rhythm returns.

## 7. Verdict

**Not clean: 0 blockers, 3 majors, 8 minors. Fix, then round 3.**

Round 1's 47 findings are in, and all but four are fully resolved; the four partials are written up as R2-03, R2-05, R2-07 and R2-11. The documents, the codes, the Base64 strip and the whodunit hold on every branch. Every condition is `&&`-only, the card never exceeds five lines, and the human line is never repeated.

The three majors are all on the closing card, and each has a small fix. The Architect's card line comes back as his credit on four endings (R2-01). "Four buyers" appears twice on traced saves (R2-02). Thin and cold-start saves end the card on a count, where the design says it ends on a person (R2-03).

Round 3 should re-run the three saves in §2 (careful E2, ruthless E4, cold-start E1 and E5) and confirm three things: no card line reappears in the credits, every card ends on a person, and no two consecutive card lines open with the same words.
