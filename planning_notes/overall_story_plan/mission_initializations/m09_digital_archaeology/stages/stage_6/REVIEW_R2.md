# m09 stage 6, review round 2: lore fragments and readables (both lenses)

## 0. Scope and method

Reviewer: fresh read-only reviewer (Opus), 2026-10-21. Target: `lore_fragments.md` ("L6"), with §7's round 1 outcomes. Read: `docs/agents/FINALE_BRIEF.md`; `REVIEW_R1_WRITING.md`; `REVIEW_R1_CLUES.md`; `stage_4/objectives_tasks.md` ("S4") and `stage_5/room_layout.md` ("S5") for ids, globals and locks; `stage_1/story_arc.md` Beat 2.2 (the hand hint); `README_scenario_design.md` (conditions, carrying choices). Engine read: `js/utils/conditional-text.js` (variant evaluator), `js/systems/interactions.js:1485-1500` (notes `onRead`), `js/minigames/notes/notes-minigame.js` (`autoAddToNotes`). Shipped `exportGlobals` for m01–m07 checked against the imports L6 reads. No VM material opened.

Greps run on L6: `020616`, `||`, `in the spring`, em dash (U+2014), en dash inside strings, `HaX`/`0x99`/second person inside document strings, and every `globalVars.` name against S4 and S5. Both decodes re-run with a script that copies CyberChef's `Vigenère Decode` (key lower-cased, only letters advance the key, case and punctuation kept).

Line numbers below are L6's.

## 1. Round 1 confirmation

**Stale copies (grep).**
- `020616`: only at L370 and L477, both saying it was replaced. Every live use is `060216` (L245, L370). Clean.
- `||`: only in the rule at L23 and the C-05 outcome row at L526. No condition uses it. Clean.
- "in the spring" for Sterling's keys: only in the C-21 note at L214 saying it was replaced; the ink line reads "after Cardiff". Clean.
- Em dashes: none in the file. En dashes: none inside any string (only in prose and table cells). Clean.
- HaX or narrator lines inside documents: no HaX line in any `text`. Three narrator markers remain inside document strings and go beyond the in-world markers W6-26 allows: "Her planning pass, by room:" (`master_schedule`, L207), "A slip, in Nightshade's hand:" (`nightshade_copy`, L117) and "Board initials: four of five boxes. The fifth is blank." (`albion_folder`, L277). See R2-04, R2-05, R2-06. Four empty-state `text` values are stage directions in brackets (R2-11).

**Clue findings (C-01 to C-24).**

| ID | Resolved? | Note |
|---|---|---|
| C-01 | yes | Label and code on separate lines in all three places (L82, L294, L331); "Just the code, not the label." |
| C-02 | yes | "the salvage bay's word" (L331); §2.2 reasons from label to legend row (L319). |
| C-03 | yes | First ask points at the field guide; the repeat names `Vigenère Decode` (L331-332). |
| C-04 | yes | `catalogue_salvage_line` written (L293-296); HaX's quote fixed (L331). |
| C-05 | yes | No `||`; Reeves four variants, KO three (L150-153, L180-182). |
| C-06 | yes | `ledger_page_seen` gated on flag 2. I checked the wiring: `onRead` emits `global_variable_changed` on **every** read, even when the value doesn't change (`interactions.js:1491-1499`), so a player who read the locked binder before flag 2 does trigger the mapping on the re-read after it. |
| C-07 | yes | Fixed Derek page, true on every m01 branch (L177). |
| C-08 | yes | Four objects plus the last page (L167-204). |
| C-09 | mostly | Two residues: `case_file`'s base is "items 1 to 4 only, as above" (L88), and `alpha_tape_deck` states two bases (L269). R2-13. |
| C-10 | yes | Custom hint dropped (L302). |
| C-11 | yes | `identity_scene_done` added (L264). |
| C-12 | yes | Bay numbers on the legend (L260). |
| C-13 | yes | Sections §1.1-§1.10; references resolve. |
| C-14 | yes | `clerk_certificate` (L161-163). Wording, see passage 2. |
| C-15 | yes | Types stated (L400); S5 told (§6.1). |
| C-16 | yes | Gary no longer audits Montana or sees the room (L334). |
| C-17 | yes | No HaX aside in the rent ledger. |
| C-18 | yes | Series L opens "NOT SAFETYNET" in both places. |
| C-19 | yes | Eleven rows. |
| C-20 | yes | "Lease start: 06/02/16" with PIN `060216`; agrees with "June 2, 2016" on the lease. |
| C-21 | yes | "after Cardiff". |
| C-22 | yes | Deed makes no coordinate claim; HaX frames it by branch. |
| C-23 | yes (noted) | No string starts with `*`, `-`, `+`, `=` or `#`. |
| C-24 | yes | `danny_ko` mention gone. |

**Writing findings (W6-01 to W6-26).**

| ID | Resolved? | Note |
|---|---|---|
| W6-01 | yes | All three Albion documents written. Two small faults left (R2-06). |
| W6-02 | mostly | Glosses are out of the text; three narrator markers remain (above). |
| W6-03 to W6-05 | yes | Eleven rows; totals and costs; Reeves appended under P and gated on flag 2. LINNET's row is one column short (R2-03). |
| W6-06 | yes | "Motive: belief." |
| W6-07 | yes | No "-- A.", no office label. |
| W6-08 | yes | Courier J.T. and handler D. Varga; no nested quotes. |
| W6-09 | yes | Certificate exists. |
| W6-10 to W6-13 | yes | Rewrites used. |
| W6-14 | yes | US lease abstract; dates in US order. |
| W6-15, W6-16 | yes | US posts and display names. A few US-usage slips remain elsewhere (R2-09). |
| W6-17, W6-18, W6-19, W6-20, W6-21, W6-22, W6-23, W6-24, W6-26 | yes | |
| W6-25 | **half** | The notebook now has a g ("again") and a 7 ("Wk 7") in the margin hand. The other sample, Nightshade's assessor notes, has neither: "Idealistic, tired already. Will wait if asked properly. / Ask properly. / No payment. Belief is the payment." L126's "the g of 'Age', the 7 of '0x47'" points at printed form fields. R2-01. |

## 2. Decodes and the cold start

**Decodes (re-run).**
- `MSJMQAEGDZNVI`, key `BONEYARD` → `LEWISANDCLARK`. Correct; matches `salvage_cage` `requires` (L373).
- `Clgyy ie nvurdtsf. Lpi pt hfga afetywacsz.`, key `ALPHA` → `Carry it yourself. Let it hurt afterwards.` Correct.
- Controls: the same code with the label word `SALVAGE` gives `USYRQUAODOSVC`, and with the tape store's `STANDBY` gives `UZJZNZGOKZASH`. Neither looks like an answer, so a wrong key fails visibly.

**Is the key findable?** Yes. The coded line's label says SALVAGE; the legend has one row reading "Bay 12 ...... Salvage .......... BONEYARD"; the house rule says "cage and keypad codes use the bay word". The label-to-row match is one step, and the legend hangs beside the keypad.

**Are HaX's two lines enough from a cold start?** Yes. The first ask quotes the code, says "Just the code, not the label", names the salvage bay's word on the chart, and points at the archive-code field guide for the cipher. Asked again, she names `Vigenère Decode`, the workstation (CyberChef is in the start kit, S5 L83) and the key. A cold-start player with no Gary gets the operation, the input and the key from her alone. One wording point: topic 5 shows whenever `salvage_keypad_seen and not salvage_opened`, wherever the player is, so "on the chart beside you" is wrong if she is asked from another room (R2-10).

A likely first wrong guess is typing `BONEYARD` itself into the keypad (the house rule says the code "uses" the bay word). That is harmless: the password lock allows retries and the engine's own near-miss text appears. No change needed.

**Alpha.** "Key: the series." under "TOMB ALPHA" gives `ALPHA`; the spool label "ALPHA 2" (L269) is a mild decoy that fails visibly. Fine for an optional bonus.

## 3. Ids and conditions

**Ids.** Every object id in L6 §1 appears in S5 (and the task targets in S4) except the five new ones: `hl_bay_label`, `clerk_certificate`, `the_reading_2`, `the_reading_3`, `the_reading_4`. All five are listed in §6.1 for the fold, as is the new global `ledger_page_seen`. The bin-file ids are unchanged, so `cage_bin` and m10's readers are unaffected. Locks agree with §3.2: `director_safe` pin `060216`, `hl_box` `HL2015-0477`, `salvage_cage` `LEWISANDCLARK`, `sorensen_office` `clerk-of-the-county`.

**Conditions.** Every condition in §1 is in `globalVars.` form and joined only by `&&`. I checked the forms the evaluator must parse:
- `=== ''` (`the_reading`, `printed_ledger` variant 5): `parseLiteral` strips the quotes and returns `''`. Works, provided the import declares the global with a `""` default.
- `!==` (`tape_side_console`, `tran_outcome !== 'left'`): `tran_outcome` defaults to `"left"` (S4 L193), so the console reads "WIPE IN PROGRESS" until Tran is dealt with. Works.
- `sorensen_fate === 'left'` in the shredded ledger variant: the default is `"left"`, so the page shreds on the first read after it is seen unless Sorensen has already been dealt with. This matches the purge design S4 §4 states; noting it so stage 9 doesn't "fix" it.

**Globals against S4/S5.** Every local global L6 reads is in S4 or S5 except `ledger_page_seen` (new, in §6.1). The imports `m01_completed`, `m02_completed` follow the `completed` convention (`README_scenario_design.md` ~L1516). `m01_kevin_ko`, `m01_sarah_ko`, `m02_patient_assaulted`, `m02_reeves_fate`, `m05_found_pipeline_list` and `m07_debrief_stance` are not in the shipped `exportGlobals`; all are FINALE_ARC §3's planned JSON-only exports (the brief's F4), as round 1 recorded for `m02_reeves_fate`. Not new; they depend on that change landing.

## 4. Findings

Counts: **0 blockers, 1 major, 12 minors.**

| ID | Sev | Location | Problem | Fix |
|---|---|---|---|---|
| R2-01 | major | `nightshade_file` L124, L126; SA Beat 2.2 and S4 §7.1 topic 11 (HaX: "Look at the loop on the g. Then look again." / "Same pen pressure, same crossed sevens.") | W6-25 half done. The notebook margin now has a g and a 7 in the teacher's hand, but the handwritten part of Nightshade's form has neither letter: the assessor's notes contain no g and no 7. L126 says the match rests on "the g of 'Age', the 7 of '0x47'", which are a printed field label and a form field. `match_the_hand` is a required aim-2 task, and HaX's two hints send the player to look for letters that aren't in the hand they are comparing. | Put a g and a 7 in the assessor's notes. Passage 1 below. Then update L126 to name them. |
| R2-02 | minor | `rent_book` L217 | "Every month: received in full, same remitting account." is a summary of a ledger, not a ledger (the W6 complaint, on a document R1 didn't reach). The observation "Every page is headed with the same date" is the only sign of pages. | Show the header and two rows. Passage 3. The PIN still comes from the header as printed. |
| R2-03 | minor | `printed_ledger` L144, L155-156 | (a) The base text ends "(every row in house cipher; the live copy holds the key)", a bracketed direction inside the document; the base observation says "A locked ring binder. Codenames down the margin." but the base text shows no codenames, and nothing about it is locked. (b) LINNET's row has five fields against a six-column header (no status). | (a) Base text: "INSIDER THREAT INITIATIVE -- LEDGER, PRINT COPY. M.S.\nCodename / source / placed / status / cost to date / notes\nVQTL -- XJ -- 11 -- ZKWM -- ... (every row the same)"; or keep it plain and move the cipher to the observation: "A ring binder of rows in the archive's cipher. The live copy will have the key." (b) "LINNET -- direct -- not placed -- CANDIDATE -- $500, filing bonus -- Father, dialysis, Dearborn. Ready when asked." |
| R2-04 | minor | `master_schedule` L207 | "Her planning pass, by room:" is the narrator inside the document (whose "her"?). | "In pencil, room by room: Dock ✓. ..." |
| R2-05 | minor | `nightshade_copy` L117 | "A slip, in Nightshade's hand:" names the writer for the player; the in-world markers W6-26 allows describe the paper, not who wrote it. The observation can carry the attribution, or the slip can sign itself. | "Covering slip: Cleared from my locker and sent ahead. ... I burned. -- 47" and keep "Under it, one card in another hand:". |
| R2-06 | minor | `albion_folder` L277 | (a) "Board initials: four of five boxes. The fifth is blank." describes the form instead of printing it. (b) The notice promises "ninety days from the date of this letter" and carries no date. | Passage 4. |
| R2-07 | minor | `clerk_certificate` L162 | "The county's memory, kept." is a writer's flourish, not certificate wording; a county certificate names who presents it. | Passage 2. |
| R2-08 | minor | `drop_terminal_screen` flag 1, L82 | "Unindexed entry, one line:" is followed by two lines since C-01 split them. A careful student may read "one line" as "decode both". | "Unindexed entry:" |
| R2-09 | minor | US documents | US-usage slips left: "supply and fit" (`refit_ledger` L231; US "furnish and install"); "residential care" twice (`hl_placing_sheet` L65; US "nursing home"); "Pencilled at the foot" inside Sorensen's US sheet (L130; "Penciled"); "MRS S" in the guard's log (L33; "MRS. S"). | Swap as given. |
| R2-10 | minor | §2.3 L331 (HaX topic 5, first ask) | "on the chart beside you" is wrong when topic 5 is opened from another room, which its condition allows. | "on the chart beside the keypad". |
| R2-11 | minor | `feed_table_box` L133, L135; `printed_ledger` L149; `albion_folder` L278; `mirror_job_printout` L289 | Empty states are bracketed directions in `text`: "(empty tray)", "(shredder strips)", "(shredder strips where the binder was)", "(printer tray empty)". A read-in-place notes item opens the notes minigame, which adds the text to the notepad (`autoAddToNotes`, `notes-minigame.js:45, 660`), so the player's notepad collects "(empty tray)" entries. | Give each an in-world string: the printers "PRINTER READY. TRAY EMPTY."; the shredded binder a surviving strip, "ACEMENTS 23. CANDIDA"; the feed tray a slip on the empty tray, "SERIES L. RECALLED. M.S." (Noor's branch) and a strip, "Lindqvist -- 20" (clock run). The observations already describe the scene. |
| R2-12 | minor | `derek_file` L107 | "why he will not stop when told" sits beside "Standing order, on hire: if taken, put the device down" and the surrender Reading ("the only order of mine he enjoyed"). In Tesseract's hand, "told" reads as "told by me". | "and why he will not stop when they tell him to." |
| R2-13 | minor | `case_file` L88; `alpha_tape_deck` L269 | C-09 residue: the case file's base is given by reference ("items 1 to 4 only, as above"); the deck gives both a plain `observations` and a base inside `observationVariants`. | Write the base string in full; give the deck one base ("A reel-to-reel deck. Empty spools."). |

Nothing new reaches blocker. R2-01 is the only finding above minor.

## 5. Weakest passages, with rewrites

The new full documents mostly read as real paper now. The Albion memo and notice, the eleven Series L rows, Derek's file, the letters and the H&L record each sound like their writer, carry numbers on the page, and end on a human note. These five are the weakest. Each rewrite keeps to the §2 banned-character rule.

**1. Nightshade's assessment form (R2-01).** Was: "...Assessor's notes: Idealistic, tired already. Will wait if asked properly.\nAsk properly.\nNo payment. Belief is the payment.\nAssessor: initialled, not signed."

> SAFETYNET -- INTAKE 2011 -- CANDIDATE ASSESSMENT\nCandidate: 0x47, provisional. Age: 23.\nAssessor's notes: Seen 7 November. Again on the 17th. Idealistic, tired already. Will wait if asked properly.\nAsk properly.\nNo payment. Belief is the payment.\nAssessor: initialled, not signed.

Two crossed sevens and the g of "Again" in the hand itself, the same features as the notebook's "Wk 7" and "again". The 17th also quietly matches the notebook's date. L126 then reads "the g of 'Again', the 7s of the interview dates".

**2. The certificate (R2-07).** Was: "...Clerk and Recorder, 1986 to 2006. The county's memory, kept."

> LEWIS AND CLARK COUNTY, MONTANA. Board of County Commissioners. In appreciation of twenty years of service: Margaret A. Sorensen, Clerk and Recorder, 1986 to 2006. Presented June 2006.

Plain, the way a county does it. The callback only needs the county's name.

**3. The rent ledger (R2-02).** Was: "RENT LEDGER -- SITE 2, MT. Lessee: Big Sky Holdings LLC.\nLease start: 06/02/16\nEvery month: received in full, same remitting account."

> RENT LEDGER -- SITE 2, MT. Lessee: Big Sky Holdings LLC. Lease start: 06/02/16\nDue / received / amount / remitter\n07/01/16 -- 06/29/16 -- $4,250.00 -- acct ending 4471\n08/01/16 -- 07/29/16 -- $4,250.00 -- acct ending 4471\nPaid early, every month since. Same account.

Real rows, paid two days early by the same account, which gives HaX's Irina line something to land on. The header date is still the first date on the page.

**4. The Albion catalogue entry and notice (R2-06).** Was: "Board initials: four of five boxes. The fifth is blank." and an undated "DRAFT, NOT SENT. To: ..."

> Board: OPS ✓ LEGAL ✓ TECH ✓ INT ✓ STRAT (blank)

> DRAFT, NOT SENT. 14 March 2017. To: Product Security, Carrow Controls. Re: RM-4 remote-management module.

The blank box is now visibly the Chief Strategist's, so the memo below explains it without anyone saying so. Role abbreviations avoid putting Netherton or any named director on a 2017 board.

**5. The master schedule (R2-04).** Was: "Series by number, per the order. -- A.\nHer planning pass, by room: Dock ✓. ..."

> Series by number, per the order. -- A.\nIn pencil, room by room: Dock ✓. Front desk ✓. Reading room ✓. Open stacks ✓. Closet ✓. Stacks ✓. Cage ✓. Office ✓. Tape room ✓. Salvage cage, no series, no tick.\nIn the margin: Reading (safe). Plan chest: not listed. Keep?

## 6. Verdict

**Not clean: one major (R2-01), twelve minors.** Every round 1 finding is resolved or reduced to a small residue, the stale-copy greps are clean, both decodes are correct, the key is findable from the legend, and HaX's two lines carry a cold-start player to the answer. Ids and conditions agree with S4/S5 or are listed in §6.1. The one real gap is the hand comparison: the handwritten sample on Nightshade's form has no g and no 7, so HaX's hints point at nothing. Passage 1 fixes it in one line. With R2-01 folded in, the document is ready for stage 7; the minors can go in the same pass.
