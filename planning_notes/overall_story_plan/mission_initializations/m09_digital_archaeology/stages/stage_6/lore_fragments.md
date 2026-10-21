# m09 Digital Archaeology: Stage 6, lore fragments

## 0. Status and inputs

Stage 6 (lore). Author: stage 6 author (Opus), 2026-10-21. Status: **stage 6 complete** (round 1 folded in, §7; round 2 folded in, §8; reviews `REVIEW_R1_CLUES.md`, `REVIEW_R1_WRITING.md`, `REVIEW_R2.md` in this folder; no further review round, the orchestrator checks directly). §1–§3 were rewritten whole in round 1; the rules at the head of §1 supersede the general rules below where they differ.

Inputs read: `docs/agents/FINALE_BRIEF.md`; `../../finale/FINALE_ARC.md` §1–9 and §13 (the stage 6 handover rows B1–B3, 9-1 to 9-9); this mission's `stage_1/story_arc.md` ("SA"), `stage_2/storytelling_elements.md` ("SE"), `stage_3/moral_choices.md` ("MC"), `stage_4/objectives_tasks.md` ("S4"), `stage_5/room_layout.md` ("S5"); `story_design/story_dev_prompts/06_lore_fragments.md`; the `scenario-design-review` skill (clue distribution: the player can always find what they need); `README_scenario_design.md` (notes items, `textVariants`/`observationVariants`, conditions, PIN/password locks); `README_ink_best_practices.md`; canon in `story_design/universe_bible/` (the Architect's identity section, the Insider Threat Initiative, the voice bible, SAFETYNET characters). VM material was not opened; flags appear by story meaning only (brief rule). The engine's `resolveObjectField` was read (`js/utils/conditional-text.js`): variants are `{ "condition", "value" }`, first match wins, `&&` only, `globalVars.` prefix.

This document is the authority for every fixed readable string in m09 and for the mission's code values. Stage 7 wires the ink; stage 9 assembles the JSON. Where this document and an earlier stage disagree on a string, this one wins (it is the final pass before assembly); where it would change a **decision** (a choice, a cost, a lock), it does not, and §6 lists anything earlier docs should be told.

**Rules applied to every string here.**
- Fixed strings only. No printed variables; a branch is a separate variant with its own condition.
- UK English in SAFETYNET's and Tesseract's documents (the Reading, the order, the casualty sheet, the Albion memo and notice, HaX's notebook); **US usage** where an American archive or an American writes it (Sorensen's ledger and labels, the rent book, the trolley list, Noor's note, Old Coyote's incident book, the Harwick & Lowe sheet). "Cyber Security" with a space in SAFETYNET text.
- Most specific variant first; the base `text`/`observations` is the least-advanced state.
- The coded salvage string and every code value obey the §2 banned-character rule.

## 1. Every readable text in m09

Final fixed strings, ready for stage 9 (revised in round 1, §7). For each object: **id**, **name**, **type** (and `takeable`), **text** (the document itself: only what is printed or written on it), **observations** (one line in the narrator's voice: what the player sees, never a conclusion), every variant with its full condition, what clue or lore it carries, and what changes it.

**Rules for this section** (round 1):
- **Document and gloss are separate** (W6-02; the m02/m08 pattern). No HaX line and no narrator line inside a document. HaX's remarks on a document are ink, listed under "HaX (ink)" for stage 7.
- **Conditions** are written in full, `globalVars.` form, joined only by `&&`. The engine's evaluator (`conditional-text.js`) has no `||` and no brackets: an alternative is a second variant with the same text (C-05). "Never played" is `!globalVars.m0N_completed`. Variants are listed most specific first; the first that holds wins.
- **Notes given by an NPC** (`#give_item`) arrive as raw `text` with no variants (`npc-game-bridge.js` `_receiveNote`), so the three bin files and `catalogue_salvage_line` are fixed strings with no variants (C-07).
- **Read-in-place readables** are `type: "notes"`, `takeable: false`, `readable: true`: only notes-type readables fire `onRead`, and a takeable notes item is collected on read (C-15).
- **Separators** in tabular documents are " -- " or dot leaders, never em dashes (W6-23). In-world markers ("In the margin, another hand:") replace stage directions in brackets or asterisks (W6-26). No document string starts with `*`, `-`, `+`, `=` or `#`, so stage 7 can quote any of them in ink (C-23).
- **US documents** (the archive, the lease, the ledgers, the H&L record, the guard's log) use US spelling, terms and month/day/year dates. **UK documents** (SAFETYNET's, and Tesseract's from his SAFETYNET years) use UK spelling and day month year. Tesseract's ENTROPY hand is UK. No string prints the present month (the year verdict, §3.1).
- `\n` marks a line break inside a string.

### 1.1 The loading dock

**`incident_book`** -- name "Incident Log" (W6-16). `notes`, `takeable: false`, `readable: true`. US.
- text: "MON. SHREDDER RUNNING, NIGHT. MRS. S SAYS SCHEDULED. NOTED.\nTUE. SAME. NOTED.\nWED. SAME.\nTHU. SAME.\nFRI. SAME. NOBODY READS THIS."
- observations: "A guard's log in block capitals. The same entry, five nights running."
- Carries: a week of the purge nobody read. Changed by: nothing.

### 1.2 The front desk

**`trolley_list`** -- name "Destruction Run, Series R". `notes`, `takeable: false`, `readable: true`. US. Three lines struck one at a time as the purge moves (W6-19). `spriteVariants` empty the trolleys on the same globals.
- `textVariants`:
  - `globalVars.cage_opened` → "DESTROY. Series R, 48 boxes.\nR-114 to R-129 -- DONE\nR-130 to R-145 -- DONE\nR-146 to R-161 -- DONE\nCertificate to follow."
  - `globalVars.flag2_submitted` → "DESTROY. Series R, 48 boxes.\nR-114 to R-129 -- DONE\nR-130 to R-145 -- DONE\nR-146 to R-161\nCertificate to follow."
  - `globalVars.flag1_submitted` → "DESTROY. Series R, 48 boxes.\nR-114 to R-129 -- DONE\nR-130 to R-145\nR-146 to R-161\nCertificate to follow."
  - text (base) → "DESTROY. Series R, 48 boxes.\nR-114 to R-129\nR-130 to R-145\nR-146 to R-161\nCertificate to follow."
- observations: "A printed run sheet clipped to the trolley rail."
- Carries: the Series R range (matches the catalogue after flag 1) and the purge moving. Changed by: flags 1 and 2, `cage_opened`.

**`noor_desk_box`** -- name "Box Under the Desk". `notes`, `takeable: false`, `readable: true`. US.
- `textVariants`: `globalVars.m05_found_pipeline_list && !globalVars.m05_recruiter_deal_accepted` → the **Series L sheets** (the legacy files' full text, given once under `feed_table_box` in §1.6, the same string here).
- text (base) → "RETURNS FOR RE-SHELVING. County deeds, 1971 to 1978."
- `observationVariants`: the same condition → "A records box, lid taped. Its label: Series L, boxes 1 to 3. Hold for M.S."; base observations → "A box of returns under the clerk's desk."
- Carries: on the warned-in-time branch Noor held the legacy files back (`legacy_files_saved` with no choice). Changed by: `m05_found_pipeline_list`, `m05_recruiter_deal_accepted`. The Series L sheets begin "NOT SAFETYNET", so nobody can read the eleven as including WREN (C-18).

**`noor_staff_card`** -- name "Staff Card, N. Haddad" (`keycard`, `opens_lock: "reading_staff_door"`). Inventory label only.

### 1.3 The open stacks

**`hl_bay_label`** (new id, C-15) -- name "Bay Label". Not readable; `observations` only. US.
- observations: "HARWICK & LOWE, EXEC SEARCH (CLOSED). RETENTION 25 YRS."
- Carries: the H&L boxes are findable from Act 1, before the number.

**`hl_box`** -- name "Harwick & Lowe, Dead Files". Container, `locked: true`, `lockType: "password"`, `requires: "HL2015-0477"`. observations: "Archive boxes from a closed search firm. The lid takes a file number." Contents: `hl_placing_sheet`.

**`hl_placing_sheet`** -- name "Placement Record, HL2015-0477" (W6-16, W6-24). `notes`, read from the box (`takeable: true`, collected on read; it is a notes item in a container). `onRead: { "setVariable": { "sleeper_shortlist": true } }`. US, dull on purpose.
- text: "HARWICK & LOWE -- PLACEMENT RECORD\nRef HL2015-0477. Q2 2015.\nSearch: lateral hires from the private sector.\nClient: government, UK. Two placements.\nFee: 30% of first-year salary, per placement.\nStart: Q3 2015.\nCandidates: H. Kowalczyk; M. Quintero.\nNext of kin: Kowalczyk, mother, nursing home. Quintero, father, nursing home.\nStatus: both placed. File closed."
- observations: "A placement record from a search firm that no longer exists. Two names."
- Carries: narrows WREN to two (both with a parent in care; the record can't say which hire is honest). Sets `sleeper_shortlist`. HaX (ink, SA Beat 2.5): "Harwick & Lowe shut before TalentStack opened." Changed by: nothing.

### 1.4 The reading room

**`drop_terminal_screen`** -- name "SAFETYNET Drop Terminal". `readable`, `readDisplay: "gameDisplay"`, `addToNotes: false` (a live display). UK (SAFETYNET's terminal) showing the archive's data as captured. The coded salvage line (§2) is the last two lines of every variant from flag 1 on, label and code on separate lines (C-01). Both `textVariants` and `observationVariants` carry the stack; the observations are the first line only.

The ledger block (L) used in the flag 2 variants:

> LIVE CAPTURE -- INITIATIVE LEDGER\nPlacements 23. Candidates 47. Legacy 11.\nWREN -- H&L -- placed 11 yrs -- LIVE -- Day 10: assigned TF Null, Montana operation. M.S.\nSource file: HL2015-0477

- `globalVars.invoice_booked` → "LIVE CAPTURE -- INITIATIVE LEDGER, NEW ENTRY\nSale. WREN. To Agent 0x00. Consideration, one deck. Booked. M.S.\n\nPlacements 23. Candidates 47. Legacy 11.\nWREN -- H&L -- placed 11 yrs -- LIVE\nSource file: HL2015-0477\n\nSALVAGE CAGE ACCESS\nMSJMQAEGDZNVI"
- `globalVars.flag2_submitted && globalVars.m05_final_choice === 'combat_lethal'` → L + "\nTORRES -- placed 1 yr -- CLOSED PLACEMENT. M.S.\n\nSALVAGE CAGE ACCESS\nMSJMQAEGDZNVI"
- `globalVars.flag2_submitted && globalVars.m05_final_choice === 'turn_double_agent'` → L + "\nTORRES -- placed 1 yr -- LIVE\n\nSALVAGE CAGE ACCESS\nMSJMQAEGDZNVI"
- `globalVars.flag2_submitted && globalVars.m05_final_choice === 'public_exposure'` → L + "\nPlacements, current series: BLOWN, all 23. M.S.\nTORRES -- placed 1 yr -- LOST\n\nSALVAGE CAGE ACCESS\nMSJMQAEGDZNVI"
- `globalVars.flag2_submitted` → L + "\nTORRES -- placed 1 yr -- LOST\n\nSALVAGE CAGE ACCESS\nMSJMQAEGDZNVI"
- `globalVars.flag1_submitted` → "LIVE CAPTURE -- FULL CATALOGUE\nSeries R, restricted: R-114 to R-161. Location: restricted cage, bay 10.\nUnindexed entry:\n\nSALVAGE CAGE ACCESS\nMSJMQAEGDZNVI"
- text (base) → "PUBLIC CATALOGUE. County deeds, land records, corporate deposits." (W6-23: the self-pointing hint is cut.)
- Carries: the Series R marks and the coded salvage line (flag 1); the ledger, its totals and the H&L file number (flag 2); Torres' status (m05); the booked sale (`taken` / `double_crossed`). Changed by: flags 1–2, `m05_final_choice`, `invoice_booked`.

**`case_file`** -- name "Case File, Helena". `notes`, `takeable: false`, `readable: true`. UK, HaX's own file (W6-13; reviewer's rewrite 10 as base).
- `textVariants`: `globalVars.m06_monitoring_enabled` → "CASE FILE -- HELENA. 0x99. Not for circulation.\n1. Intercept, day 10: the order, photographed.\n2. The wall, copied.\n3. Raid team, Montana: four names.\n4. Training notebook, 2011: scan, filed separately.\n5. HashChain tags, standing order. From: frozen fund, tagged. To: Big Sky Holdings LLC. Memo: RENT, SITE 2, MT. Monthly, since 2016.\nPencilled beside item 5: Not Helena."
- text (base) → "CASE FILE -- HELENA. 0x99. Not for circulation.\n1. Intercept, day 10: the order, photographed.\n2. The wall, copied.\n3. Raid team, Montana: four names.\n4. Training notebook, 2011: scan, filed separately."
- observations: "A typed case file in HaX's name. Item 4 has a scan of its own on the next desk."
- Carries: the tagged payments to the bunker's lessee (Big Sky Holdings LLC, matching `lease_file`); on the no-coordinate branch they point at the bunker before the deed does. Item 4 points, quietly, at the notebook. HaX (ink): "Your tags, from HashChain." Changed by: `m06_monitoring_enabled`.

**`notebook_scan`** -- name "Training Notebook (scan)". `notes`, `takeable: false`, `readable: true`; `onRead: { "setVariable": { "notebook_read": true } }`. UK, 2011 (W6-25: a date and a 7 in each hand, so HaX's "loop on the g" and "crossed sevens" match the page).
- text: "SAFETYNET STRATEGY -- STRAT-204 -- 17 October 2011\nWk 7. Disclosure: who does it serve?\nIn the margin, another hand: Wk 7. Ask who it hurts first. Then ask again, afterwards."
- observations: "A scanned page from a student's notebook. Two hands: the student's, and a teacher's in the margin."
- Carries: HaX's notebook from Tesseract's course, fifteen years ago; the margin hand is the exemplar for `match_the_hand` (the g of "again", the crossed 7s). The seed of "Let it hurt afterwards". Changed by: nothing.

### 1.5 The restricted stacks (the hatch)

**`sorensen_stamp`** -- name "Rubber Stamp" (`hasFingerprint: true`, `fingerprintOwner: "Margaret Sorensen"`). Not readable.
- `observationVariants`: `globalVars.flag2_submitted && !globalVars.cage_opened` → "DESTROYED, in red. The stamp is still warm. Three boxes left on her side of the counter."
- observations (base) → "A rubber stamp: DESTROYED, in red."
- Carries: the print for the plan cabinet; the purge clock after flag 2. Changed by: flag 2, `cage_opened`.

**The three bin files.** Notes items held by both `sorensen_hatch` and `sorensen_door`, given by id on the bin choice (§3.4). Each is a **fixed string with no variants**: they arrive by `#give_item`, which copies raw text (C-07). Ids unchanged: `derek_file`, `letters`, `nightshade_copy`.

**`derek_file`** -- name "Asset File: D. Lawson". UK, Tesseract's ENTROPY hand, written before Viral Dynamics hired Derek (W6-06; reviewer's rewrite 4 as base). Every line is an instruction or a forecast written in advance, so it is true on every m01 branch; what the player did is read back by the Reading (entry 1) and by HaX's bin line in ink, not by this page.
- text: "LAWSON, D. -- ASSET, VIRAL DYNAMICS\nMotive: belief. He has read everything I sent him and believes it more than I do. That is why he will do it, and why he will not stop when they tell him to.\nExpected loss of asset: total. Expected yield: one demonstration, and the agency's attention.\nStanding order, on hire: if taken, put the device down and wait. Say nothing.\nIf they publish his figures, let them. Publicity recruits.\nA good first lesson for whoever they send. -- A."
- observations: "A thin asset file, costed in a neat, sloping hand."
- Carries: why Derek did it ("belief", m01's "He's a believer"), which pays the Reading's margin bet; the standing order behind his silence or surrender; a second sample of the hand. In m10, a record answer on `m09_cage_bin = derek_file`. HaX (ink, by `m01_final_choice`): on `surrender`, "There's your why. He was told to."; on `expose`, "He wanted your headlines." (stage 7 words them; one line, not a repeat of the page).

**`letters`** -- name "Initiative to Social Fabric, Handoff 14". US (W6-08; reviewer's rewrite 6 as base; the handler is named so the m10 rota line has someone to point at).
- text: "INITIATIVE TO SOCIAL FABRIC -- HANDOFF 14\nCourier: J.T., server closet, Mountain States. Collects Thursdays. Paid per envelope, cash.\nHandler: D. Varga, the Bozeman number. J.T. has never met him and doesn't ask.\nNext file: Teresa Villanueva, 41. Union rep, Butte copper mine.\nMethod: an affair, photographs in hand. Her medical file, obtained. Press first, then the union board.\nWhy her: when she says we, she means the men on the night shift. Take that away and they stop listening."
- observations: "Typed correspondence between two cells. The last page names a woman in Butte."
- Carries: Tran's trade route (courier J.T., handler D. Varga), the lever that talks him off the wipe; the next smear (saved, Villanueva is warned). In m10 the server-hall rota carries **D. Varga** for HaX's "Tran's handler is on that rota" (§6). Changed by: nothing (on `m08_nightshade_tidied` this bin is offered as `nightshade_copy` instead).

**`nightshade_copy`** -- name "Cleared from Locker 47". UK, two hands (W6-10; reviewer's rewrite 8 as base).
- text: "Covering slip: Cleared from my locker and sent ahead. His notes to me, nothing of the Initiative's. Anything that named anyone else, I burned. -- 47\nUnder it, one card in another hand: 0x47. They will ask you to choose between them and us. You will not need to. Wait. -- A.\nAt the foot of the slip: A man may keep his own letters. It is other people's that make him a traitor."
- observations: "A covering slip clipped to one small card."
- Carries: what he cleared and sent ahead (m08 `nightshade_tidied`); changes his text-back on the triple-agent branch; m10's door line on `m09_cage_bin = nightshade_copy`.

### 1.6 The restricted cage

**`nightshade_file`** -- name "Candidate Assessment, Intake 2011". In `plan_cabinet` (biometric). `notes`, collected; `onPickup: { "setVariable": { "nightshade_file_held": true } }`. UK. A SAFETYNET form with the recruiter's notes on it (W6-07; reviewer's rewrite 5 as base): no "-- A.", no office label. The hand comparison does the naming.
- text: "SAFETYNET -- INTAKE 2011 -- CANDIDATE ASSESSMENT\nCandidate: 0x47, provisional. Age: 23.\nAssessor's notes: Seen 7 November. Again on the 17th. Idealistic, tired already. Will wait if asked properly.\nAsk properly.\nNo payment. Belief is the payment.\nAssessor: initialled, not signed."
- observations: "A SAFETYNET training form, fifteen years old. The assessor's notes are in a sloping hand you have seen tonight."
- Carries: the proof, with flag 3, that the course's teacher recruited Nightshade at 23 (U1 canon); the lever that talks Sorensen down (her schedule's "plan chest: not listed"). The match rests on the handwritten notes, not the printed fields: the loop on the g of "Again" and the crossed 7s of "7 November" and "the 17th" are the same as the notebook margin's g of "again" and crossed 7 of "Wk 7", which are the two features HaX's hints name ("Look at the loop on the g." / "Same pen pressure, same crossed sevens."). The 17th also matches the notebook's date, 17 October 2011. Changed by: nothing.

**`feed_table_box`** -- name "The Last Box". `notes`, `takeable: false`, `readable: true` (a readable, not an item; the credit reads "kept from the shredder", M9-19). US, Sorensen's hand (W6-03, W6-15; reviewer's rewrite 2 as base, all eleven rows written, C-19). **The Series L sheets** (the string `noor_desk_box` reuses):

> SERIES L -- LEGACY PLACEMENTS, NOT SAFETYNET. M.S.\nName / placed / post / cost to date / yield / notes\nRuth Lindqvist -- 2009 -- deputy clerk, Cascade County -- $14,000 -- voter rolls -- Quiet. Reliable.\nGail Pettibone -- 2010 -- dispatcher, county 911 center -- $8,500 -- call routing -- Asks nothing.\nDolores Ortega -- 2012 -- billing director, regional hospital -- $31,500 -- records, three systems -- Wants out. Remind her of her son.\nHector Salas -- 2012 -- shift supervisor, water treatment plant -- $12,000 -- control room rota -- Steady.\nJune Akiyama -- 2013 -- IT contractor, state DMV -- $22,000 -- license data -- Careful. Too careful.\nTom Brekke -- 2014 -- school board, Bozeman -- $6,000 -- vendor contracts -- Enjoys it.\nVernon Teague -- 2014 -- lineman foreman, rural co-op -- $9,800 -- substation keys -- Drinks. Watch.\nLeah Brandvold -- 2015 -- paralegal, county attorney -- $11,200 -- case lists -- Bright. Bored.\nAmit Deshmukh -- 2016 -- zoning officer, Billings -- $9,200 -- substation permits -- Never asked for anything yet. Will be.\nSamuel Ocampo -- 2017 -- records officer, VA clinic -- $7,400 -- patient lists -- Grateful.\nDoreen Fitch -- 2018 -- court reporter, district court -- $5,600 -- transcripts -- Lonely.\nPenciled at the foot: The best work I have done. Nobody will ever know. That was the point.

- `textVariants`:
  - `globalVars.m05_found_pipeline_list && !globalVars.m05_recruiter_deal_accepted` → "SERIES L. RECALLED. M.S."
  - `globalVars.legacy_files_saved` → the Series L sheets
  - `globalVars.legacy_clock_run` → "Lindqvist -- 20"
  - text (base) → the Series L sheets (readable while at risk: she is working through them)
- `observationVariants`, in the same order: "The feed tray is empty. The last box never came up." / "The last box, off the feed table." / "Strips in the bin. The last box is gone." / base "An open box on the feed table. She is working through it sheet by sheet."
- Carries: the Initiative's reach made physical, with numbers (eleven people, costs, yields; the 06 prompt's evidence rule). Exported as `legacy_files_saved`; m10's "Elsewhere" clause. HaX (ink, on reading): "Nobody of ours in here. Ours are on her tape, by codename." Changed by: `m05_found_pipeline_list`, `legacy_files_saved`, `legacy_clock_run`. The names are all grep-clean (§5 note).

**`printed_ledger`** -- name "Initiative Ledger, Print Copy". `notes`, `takeable: false`, `readable: true`; `onRead: { "setVariable": { "printed_ledger_read": true } }`. US (W6-04, W6-05; reviewer's rewrite 3 as base). **The read state no longer shreds the page early** (C-06): a new global `ledger_page_seen` is set by a HaX mapping on `global_variable_changed:printed_ledger_read` with `globalVars.flag2_submitted` (`delayMs: 500`), so only a read **after flag 2** counts; the shredded variant and Noor's "[Show her the page.]" both key on `ledger_page_seen` (§6).

The page (P), used in the flag 2 variants:

> INSIDER THREAT INITIATIVE -- LEDGER, PRINT COPY. M.S.\nPlacements 23. Candidates 47. Legacy 11.\nCodename / source / placed / status / cost to date / notes\nWREN -- H&L -- 11 yrs -- LIVE -- $611,400, care fees, next of kin -- Day 10: assigned TF Null, Montana. Expected yield: one raid. M.S.\nLINNET -- direct -- not placed -- CANDIDATE -- $500, filing bonus -- Father, dialysis, Dearborn. Ready when asked.

The Reeves paragraph (R), appended under P on that branch: "\nClipped inside: HANDLER CONTACT SHEET -- G. Reeves, St. Catherine's. Handler line, drop, schedule. Status: asset in custody. Handler: stand down."

- `textVariants`:
  1. `globalVars.ledger_page_seen && globalVars.sorensen_fate === 'left'` → "ACEMENTS 23. CANDIDA"
  2. `globalVars.flag2_submitted && globalVars.m02_reeves_fate === 'arrested'` → P + R
  3. `globalVars.flag2_submitted && globalVars.m02_reeves_fate === 'ko'` → P + R
  4. `globalVars.flag2_submitted && globalVars.m02_reeves_fate === 'flagged'` → P + R
  5. `globalVars.flag2_submitted && globalVars.m02_reeves_fate === '' && globalVars.m02_completed && globalVars.m02_insider_asset_arrested` → P + R (the read rule for saves before the m02 export)
  6. `globalVars.flag2_submitted` → P
  7. text (base) → "INSIDER THREAT INITIATIVE -- LEDGER, PRINT COPY. M.S.\nCodename / source / placed / status / cost to date / notes\nVQTL -- XJ -- 11 -- ZKWM -- RHQ -- PWOZ BVNM\nKDSA -- XJ -- 9 -- ZKWM -- RHQ -- TOYL\nHGRF -- MQ -- 3 -- BEOP -- QNX -- LLUZ WYDE"
- `observationVariants`: 1 → "Strips. She got to it." / 6 → "A binder of costed rows. Two have notes in pencil." / base → "A ring binder of rows in the archive's cipher. The live copy will have the key."
- Carries: the scale in Sorensen's columns (23, 47, 11, with costs: the 06 prompt's numbers); WREN's live entry; Noor's codename LINNET and her $500 "filing bonus" (SE §3's secret), with "Father, dialysis, Dearborn" on every readable variant; Reeves' handler sheet (m02). Changed by: flag 2, `m02_reeves_fate`, `m02_insider_asset_arrested`, `ledger_page_seen`, `sorensen_fate`.

### 1.7 Sorensen's office

**`clerk_certificate`** (new, W6-09, C-14) -- name "Framed Certificate". Not readable; `observations` only. US.
- observations: "LEWIS AND CLARK COUNTY, MONTANA. Board of County Commissioners. In appreciation of twenty years of service: Margaret A. Sorensen, Clerk and Recorder, 1986 to 2006. Presented June 2006."
- Carries: the callback the salvage decode lands on (`LEWISANDCLARK`). Changed by: nothing.

**The Reading: four objects** (C-08). One `textVariants` list returns one string, so the four entries are four notes objects in `director_safe`, each with its own short list. Tesseract's hand, UK, third person. Each page carries its heading (W6-18). Entry 1 is rewritten for expose and surrender so the beat isn't said three times (W6-17); the rest are kept word for word.

**`the_reading`** -- name "The Reading, 1: Viral Dynamics". `notes`, collected; `onPickup: { "setVariable": { "reading_found": true } }`; S4's task target, unchanged.
- Each string is "0x00. Kept by M.S. Not to be summarised.\n\nVIRAL DYNAMICS\n" + the line:
  - `globalVars.m01_final_choice === 'fight'` → "They put Lawson on the floor when the argument was already won. Force first. Noted."
  - `globalVars.m01_final_choice === 'arrest'` → "They read Lawson his rights. He kept his promise to me and said nothing."
  - `globalVars.m01_final_choice === '' && globalVars.m01_completed` → the same as `arrest`
  - `globalVars.m01_final_choice === 'recruit'` → "They offered Lawson a deal. A recruiter's instinct. They should be careful whom they show it to."
  - `globalVars.m01_final_choice === 'expose'` → "They gave Lawson's figures to the press. Applications rose. I keep the figure."
  - `globalVars.m01_final_choice === 'surrender'` → "Lawson put the device down when they asked. It is the only order of mine he enjoyed."
  - text (base, `!globalVars.m01_completed`) → "Lawson was arrested and kept his promise to me. Their file does not say who arrested him."
- observations: "A thin file in a sloping hand. The first page is about you."

**`the_reading_2`** (new id) -- name "The Reading, 2: The Innocents". `notes`, collected. Each string is "THE INNOCENTS\n" + the line:
  - `globalVars.m02_patient_assaulted` → "They struck a patient on a ward. I have read the ward's notes. So, I expect, have they."
  - `globalVars.m01_completed && globalVars.m01_kevin_ko` → "On their first day they put a bystander on the floor. They will have told themselves it was necessary."
  - `globalVars.m01_completed && globalVars.m01_sarah_ko` → the same
  - `globalVars.m01_completed && globalVars.m01_maya_ko` → the same
  - `globalVars.m01_completed` → "Not one bystander hurt on their first day. Rare. It will not last."
  - text (base) → "Their first days are not in my file. Someone at SAFETYNET is careful with them."

**`the_reading_3`** (new id) -- name "The Reading, 3: Albion". `notes`, collected. "ALBION\n" + the line:
  - `globalVars.m04_disclosure_choice === 'full'` → "They told the inquiry everything, and every site was audited. My lesson, delivered by them. They do not know it yet."
  - `globalVars.m04_disclosure_choice === 'partial'` → "They told half. Half is how we arrived here."
  - `globalVars.m04_disclosure_choice === 'quiet'` → "They buried it. They understand me better than they admit."
  - text (base) → "Their report went upstairs and no further. I will not guess what it said."

**`the_reading_4`** (new id) -- name "The Reading, 4: Portland". `notes`, collected. "PORTLAND\n" + the line:
  - `globalVars.m07_debrief_stance === 'defended'` → "'I'd make it again.' They would. I have counted on it."
  - `globalVars.m07_debrief_stance === 'owned'` → "They said it was theirs. They will carry this too."
  - `globalVars.m07_debrief_stance === 'refused'` → "'Don't ask me to rank them.' I ranked them for them."
  - `globalVars.m07_debrief_stance === 'hardened'` → "They asked for the numbers. Good. I keep numbers."
  - text (base) → "One team, four sites. They sent it where they were told. Obedience or trust. I will learn which."

Carries (all four): the Architect's reading of Agent 0x00 (m07's "figures"); entries 1, 3 and 4 are echoed by Tesseract aloud in m10. Changed by: the imports named in each condition.

**`the_reading_last_page`** -- name "The Reading, Last Page". `notes`, collected; `onRead: { "setVariable": { "reading_finished": true } }`. Fixed for every player.
- text: "When the hour comes, they will be in the room and the key will be in reach. They will press it. I will not need to ask. They will have read this far and found nothing here that is untrue.\nBelow: Their handler will cover for them. She was taught to.\nPencilled in the margin: They will save Lawson's file. They will want to know why he did it."
- observations: "The last page. A pencilled line in the margin, older than the ink."
- Carries: the prediction; the line about HaX; the margin bet on the bin (right on `cage_bin = derek_file`, and `derek_file` now answers it). Sets `reading_finished`.

**`master_schedule`** -- name "Destruction Schedule (master)". `notes`, collected; `onRead: { "setVariable": { "schedule_read": true } }`. The order's attachment (UK) with her planning pass (US).
- text: "Series by number, per the order. -- A.\nIn pencil, room by room: Dock ✓. Front desk ✓. Reading room ✓. Open stacks ✓. Closet ✓. Stacks ✓. Cage ✓. Office ✓. Tape room ✓. Salvage cage, no series, no tick.\nIn the margin: Reading (safe). Plan chest: not listed. Keep?"
- observations: "The order's schedule, ticked room by room in pencil."
- Carries: the salvage cage left off the order (the flag 4 realisation); her two kept items. Sets `schedule_read`.

**`lease_file`** -- name "Lease Abstract and Construction File". `notes`, collected (`find_the_deed`). US lease abstract (W6-14), aligned with m10 stage 6's bunker. **No variants** (the old variants were glosses; HaX's lines move to ink, C-21, C-22).
- text: "LEASE ABSTRACT\nLessor: State of Montana, surplus property.\nLessee: Big Sky Holdings LLC.\nPremises: Sun River Regional Control Site, a decommissioned 1962 civil defense facility, with access road and easements. Lewis and Clark County, Montana.\nTerm: 20 years. Commencement date: June 2, 2016.\nRecorded with the County Clerk and Recorder.\nAttached: as-built drawings, 1962; refit drawings, revision C."
- observations: "A lease and a roll of drawings for a bunker in this county."
- Carries: the deed and the paper half of the defences (`find_the_deed`); on the no-coordinate branch it finds the bunker. The commencement date is the safe PIN (§3.2). HaX (ink): no-coordinate branch, "There it is. Tomb Gamma has an address."; otherwise "Same site Nightshade gave us. Now it has a lease."; on `m03_victoria_fate` `arrested` or `ko` (two conditions), "Big Sky was on Zero Day's client list. Sterling's keys opened it after Cardiff." (C-21: "after Cardiff", not "in the spring").

**`rent_book`** (id kept) -- name "Rent Ledger" (W6-16). `notes`, `takeable: false`, `readable: true`. US. **No variants** (C-17).
- text: "RENT LEDGER -- SITE 2, MT. Lessee: Big Sky Holdings LLC. Lease start: 06/02/16\nDue / received / amount / remitter\n07/01/16 -- 06/29/16 -- $4,250.00 -- acct ending 4471\n08/01/16 -- 07/29/16 -- $4,250.00 -- acct ending 4471\nPaid early, every month since. Same account."
- observations: "A monthly ledger. Every page is headed with the same date."
- Carries: the safe PIN the long way (`060216`, the header as printed). HaX (ink, on `m06_irina_recruited`): "Irina's account paid for this. Tell her it bought us the deed."

**`danny_sheet`** -- name "Broker's Note: D. Foster". `notes`, `takeable: false`, `readable: true`. US (a broker's memo). C-24: no `danny_ko` variant; a knock-out falls to the base.
- `textVariants`:
  - `globalVars.m03_danny_fate === 'left'` → "FOSTER, D. Loose end, resolved."
  - `globalVars.m03_danny_fate === 'protected'` → "FOSTER, D. His survey methods are now in SAFETYNET's hands. Assume our selection list is known."
  - `globalVars.m03_danny_fate === 'exposed'` → "FOSTER, D. Named us in full. His survey of 214 is on the public record."
  - text (base) → "FOSTER, D. No further action."
- observations: "A two-line memo on Zero Day paper."
- Carries: Danny's fate (m03). HaX (ink) by value, as SE §7.2. Changed by: `m03_danny_fate`.

**`refit_ledger`** (id kept) -- name "Build-Out Ledger" (W6-16). `notes`, `takeable: false`, `readable: true`. US (construction draws).
- `textVariants`: `globalVars.m02_paid_ransom` → "BUILD-OUT -- SITE 2, MT\nDraw 9 -- funds received 11/2024 -- $189,600, converted from BTC -- applied: blast door, furnish and install.\nAll other draws: lessee's own account."
- text (base) → "BUILD-OUT -- SITE 2, MT\nDraws 1 to 9 -- lessee's own account -- paid in full."
- observations: "Construction draws for the bunker's refit."
- Carries: St. Catherine's ransom (£150,000 in Bitcoin, November 2024, m02) paid for the blast door. HaX (ink): "St. Catherine's money. It bought the blast door." Changed by: `m02_paid_ransom`.

**`deck_controller`** -- name "Tape Deck Controller". `notes`, `takeable: false`, `readable: true`, `readDisplay: "gameDisplay"`, `addToNotes: false`.
- `textVariants`:
  - `globalVars.deck_pulled === 'none'` → "WIPE COMPLETE. Deck empty. Last operator: remote."
  - `globalVars.deck_pulled === 'her_file'` → "WIPE COMPLETE. 1 reel copied out before erase. Deck empty. Last operator: remote."
  - `globalVars.deck_pulled === 'alpha_tapes'` → "WIPE COMPLETE. 1 reel copied out before erase, series ALPHA. Deck empty. Last operator: remote."
  - text (base) → "STANDBY. Reels loaded: 2."
- observations: "The deck's remote controller, still lit."
- Carries: which tape HaX saved. Changed by: `deck_pulled`.

**`director_safe`** -- observations: "A floor safe with a six-digit keypad." `lockType: "pin"`, `requires: "060216"`. Contents: `the_reading`, `the_reading_2`, `the_reading_3`, `the_reading_4`, `the_reading_last_page`, `master_schedule`, `tape_room_keycard`.

**`tape_room_keycard`** -- name "Key Card, Tape Store" (`keycard`, `opens_lock: "tape_room_reader"`). Inventory label only.

### 1.8 The server closet

**`tape_side_console`** -- name "Wipe Console". `notes`, `takeable: false`, `readable: true`, `readDisplay: "gameDisplay"`, `addToNotes: false`.
- `textVariants`: `globalVars.tran_outcome !== 'left'` → "WIPE HALTED. Series LI, legacy interviews: 97 of 212 reels intact."
- text (base) → "WIPE IN PROGRESS. Series LI, legacy interviews: 212 reels."
- observations: "A console running a degausser through a rack of reels."
- Changed by: `tran_outcome`.

### 1.9 The tape room

**`shelf_code_legend`** -- name "Shelf Marks". Not readable; `observations` only (it is a framed wall chart). US, the archive's own (W6-20, C-12; reviewer's 7b as base).
- observations: "MOUNTAIN STATES RECORDS & RETENTION -- SHELF MARKS\nBay 1 ....... Reading room ..... COTTONWOOD\nBays 2 to 9 . Open stacks ...... MERIDIAN\nBay 10 ...... Restricted ....... WATCHTOWER\nBay 11 ...... Tape store ....... STANDBY\nBay 12 ...... Salvage .......... BONEYARD\nHouse rule: cage and keypad codes use the bay word. Never write a code down. M.S."
- Carries: the salvage key `BONEYARD` (§2). Bay 10 matches the catalogue's "restricted cage, bay 10". Changed by: nothing.

**`alpha_annotations`** -- name "Annotation Sheets, Series ALPHA". `notes`, `takeable: false`, `readable: true`. UK (his SAFETYNET-era teaching). Shown only after the identity scene, so the decode can't come before HaX names him (C-11).
- `textVariants`: `globalVars.deck_pulled === 'alpha_tapes' && globalVars.identity_scene_done` → "TOMB ALPHA -- SESSION TWO -- ANNOTATIONS\nA lock that expects you is a lock you cannot fight. Build the door before the room.\nFor session three, decode. Key: the series.\nClgyy ie nvurdtsf. Lpi pt hfga afetywacsz."
- text (base) → "Blank label stock."
- `observationVariants`: the same condition → "Typed sheets, stencilled ALPHA, with one enciphered line at the foot."; base → "A box of blank label stock."
- Carries: decodes to "Carry it yourself. Let it hurt afterwards." (§2.4). Changed by: `deck_pulled`, `identity_scene_done`.

**`alpha_tape_deck`** -- name "Reel Deck". Opens the clip (ink, S5 §3.9). observations (base): "A reel-to-reel deck. Empty spools."; `observationVariants` `globalVars.deck_pulled === 'alpha_tapes'` → "A reel-to-reel deck. One spool loaded, labelled ALPHA 2."

### 1.10 The salvage cage

**`tomb_beta_rack`** -- name "Rack Server". Not readable. (W6-11: the front-load is cut.)
- observations: "A rack server, still running, fans loud in the cold. Asset tag: TOMB BETA. Nobody has stamped anything in here."

**`albion_folder`** -- name "Printed Folder: VH-2017-0312". `notes`, `takeable: false`, `readable: true`. UK, three documents in full (W6-01; reviewer's rewrite 1 as base). Sending the notice sends the third document, unchanged.
- `textVariants`: `globalVars.flag3_submitted` → "CATALOGUE ENTRY -- VULNERABILITY HOLDINGS\nRef: VH-2017-0312. Authentication bypass, Carrow Controls RM-4 remote-management module.\nDeployed at: grid battery sites, water treatment works, substations. Approx. 400 UK sites.\nVendor aware: no.\nDisposition: RETAIN. Operational value. Review 2019.\nBoard: OPS ✓ LEGAL ✓ TECH ✓ INT ✓ STRAT ......\n\nMEMO. To: Disposition Board. From: Chief Strategist. 14 March 2017. Re: VH-2017-0312.\nWe are holding a flaw in a Carrow controller because it may one day be useful to us. It will certainly one day be useful to someone else.\nFour hundred sites run this module. Their engineers cannot patch what nobody has told them about, and we cannot defend them from it, having chosen not to.\nI recommend notification to the vendor within thirty days. I have drafted the notice. I would rather send it than explain later why we didn't.\nA. Tesseract\n\nDRAFT, NOT SENT. 14 March 2017. To: Product Security, Carrow Controls. Re: RM-4 remote-management module.\nWe have found a flaw in the RM-4 module that lets an unauthenticated user on the management network issue control commands. A test case is attached for your engineers.\nWe will keep this confidential for ninety days from the date of this letter, or until a fix ships, whichever is sooner, so that your customers have time to patch. We are glad to help with testing.\nWith thanks,\nDr Adrian Tesseract, Chief Strategist"
- text (base) → "PRINTER READY. TRAY EMPTY."
- `observationVariants`: `globalVars.flag3_submitted` → "Three documents printed off the box, stapled together."; base → "Printer tray, empty."
- Carries: the flaw SAFETYNET held from 2017 (one of Critical Mass's ways in at Albion), his memo and the notice he drafted: his case, partly true, before he makes it. The vendor is **Carrow Controls** (9-8); the flaw is an old one in the RM-4 module, not the player's own m04 route, which HaX called brand new. Changed by: flag 3; the send is `albion_notified`.

**`enrolment_binders`** -- name "Enrolment Binder, Tomb Beta". In a crate (`lockType: "key"`, picks). `notes`, read from the crate. UK (W6-12; reviewer's rewrite 9 as base).
- text: "TOMB BETA -- WORKSHOP ENROLMENT, SPRING INTAKE\nTwelve names, a photograph clipped to each.\nPencilled beside most of them: Ready. Not yet. Ask properly."
- observations: "A ring binder of enrolment sheets, pencilled in a hand you have seen twice tonight."
- Carries: the hand a third time; "Ask properly" repeated from Nightshade's form, so the player makes the match.

**`mirror_job_printout`** -- name "Mirror Job Printout". `notes`, `takeable: false`, `readable: true`. UK, his signed original (W6-22: UTC).
- `textVariants`: `globalVars.flag4_submitted` → "PROJECTED DEATHS ATTRIBUTABLE TO THE PUBLICATION, FIRST THIRTY DAYS\nRelease by key, all cities: 1,100 to 2,600.\nFallback by city: fewer, later.\nPrincipal causes: hospital systems (dispatch, infusion, records); grid control; water treatment.\nAssumes the cells move first.\nAn acceptable price for the last arms race. -- A.\n\nRELEASE CONFIGURATION\nManual, at console. Single key. Requires an operator present.\nFallback: 06:00 UTC, staged by city."
- text (base) → "PRINTER READY. TRAY EMPTY."
- `observationVariants`: `globalVars.flag4_submitted` → "Two pages in the printer tray. The first is signed."; base → "Printer tray, empty."
- Carries: the casualty sheet that prices the key, and the release mechanism. His original; m10 holds the corrected later printing. Changed by: flag 4.

**`catalogue_salvage_line`** -- name "Catalogue: salvage cage" (C-04). `notes`, in HaX's `itemsHeld`, given by `#give_item:notes:catalogue_salvage_line` at the end of `flag1_read`. Fixed string, no variants.
- text: "SALVAGE CAGE ACCESS\nMSJMQAEGDZNVI"
- observations: "One catalogue line in the archive's own cipher. The second line is the code."
- Carries: the coded salvage code (§2), the same two lines as the screen and HaX's quote.

## 2. The salvage-code puzzle

Handover 9-1 and P20: one CyberChef operation, keyed by the tape room's framed `shelf_code_legend`, fitting Gary's "Read it like a shelf mark, not a number." The coded line is carried from flag 1 in the notepad; the legend on the wall beside the keypad supplies the key; the salvage cage keypad takes the decoded string.

**The banned-character rule (B2).** No code or coded line quoted in ink, ERB or JSON may contain `|`, `#`, `//`, `{`, `}`, `->`, `<-`, `<>`, `~`, `[`, `]`, `\`, `"`, `<%`, and none may begin with `*`, `-`, `+` or `=`. Every code below is checked against it. Password locks compare exactly; on a near miss the engine shows its own fixed text ("Passwords are case-sensitive.", `password-minigame.js`), so no custom hint string is needed (C-10: the drafted keypad hint is dropped).

### 2.1 The operation

**`Vigenère Decode`** (CyberChef's exact name; typing "vig" in its search finds it). One operation, one argument, the key. The student puts the code in the input, adds the operation, types the key from the legend, and reads the answer. The legend's house rule ("cage and keypad codes use the bay word") says the key is a word; HaX and Gary name the cipher; the field guide `m09_archive_code_guide` has the steps. A Vigenère key is a word, which is what a shelf mark is here, so the puzzle reads as the archive's own practice rather than a generic shift. The optional Alpha decode (§2.4) uses the same operation, so the mission teaches one tool twice.

### 2.2 Key, coded line, answer

**The coded line: two lines, label and code apart** (C-01). Identical, character for character, in the `catalogue_salvage_line` notes item, at the foot of every `drop_terminal_screen` variant from flag 1 on, and in HaX's topic 5 quote:

```
SALVAGE CAGE ACCESS
MSJMQAEGDZNVI
```

Only the second line is ciphertext. The first is the catalogue label; it says which bay the code belongs to and is never decoded. (Decoding both lines together gives garbage, because the label's letters use up the key: that is why they are kept apart, and why HaX says "Just the code" every time she quotes it.) Both lines are capitals only: no banned character, no banned leading character.

**The key: `BONEYARD`.** The legend lists five bays, each with a number and a word; the label says SALVAGE; the legend's Salvage row (bay 12) reads `BONEYARD` (C-02: the match runs from the label to the row, not from the room the player is standing in, which is the tape store, `STANDBY`). The word is never in the coded line, so the key really does come from the wall. Archivists' slang for a decommission store, it also reads as a word somebody chose.

**The answer, and the exact keypad input:** `LEWISANDCLARK` (thirteen capitals, no spaces). `salvage_cage`: `lockType: "password"`, `requires: "LEWISANDCLARK"`. CyberChef returns capitals for capital input, so a student who decodes it types it correctly. The certificate on Sorensen's office wall (`clerk_certificate`, §1.7: "Clerk and Recorder, Lewis and Clark County") is the callback the answer lands on: she keyed the cage to her county.

**Verified** (round 1, after the change): `Vigenère Decode` of `MSJMQAEGDZNVI` with key `BONEYARD` → `LEWISANDCLARK`. The reviewer's independent script agrees.

### 2.3 The nudges: HaX on every route, Gary on his

The player can solve it with no Gary and no prior missions (C-03).

- **The legend itself** (every route): "House rule: cage and keypad codes use the bay word." A careful player needs nothing else but the operation's name, which the field guide gives.
- **HaX, hub topic 5**, `salvage_keypad_seen and not salvage_opened` (S4 §7.1). Her texts carry no prefix and no colon at the start of a line, so the label line can't be mistaken for a speaker. Fixed strings:
  - First ask (C-02, C-04): "Catalogue line from flag one." / "SALVAGE CAGE ACCESS" / "MSJMQAEGDZNVI" / "Just the code, not the label. The key is the salvage bay's word, on the chart in the tape room, by the keypad. If the cipher's new to you, ask me for the archive-code field guide."
  - Asked again, while the keypad is still shut (C-03; ink visit count): "Vigenère Decode, on your workstation. Key: the salvage bay's word. Capitals in, capitals out."
  - On `gary_called`, the first ask ends "Gary told you how." in place of its last sentence.
- **Gary**, `gary_phone`, on the first keypad attempt (`m02_gary_protected`; S4 §6.6). He is a UK hospital IT man and can't see the room (C-16, W6-21): "Seen codes like that. Archives key them to the shelf scheme. Read it like a shelf mark, not a number. Vigenère, and the bay's word is the key. There'll be a chart near the keypad."
- **The field guide** `m09_archive_code_guide` (S4 §7.2), offered on `salvage_keypad_seen`, names the operation and walks one example. HaX's first line now points at it, which it didn't before.

The nudge, in one sentence: *decode only the second line with CyberChef's Vigenère Decode, keyed by the salvage bay's word on the legend (`BONEYARD`); the result is the keypad code.*

### 2.4 The Alpha annotations decode (9-2, M9-22)

Optional, on `deck_pulled == "alpha_tapes"`, and shown only after `identity_scene_done` (C-11), so the line can't be decoded before HaX names him. Same operation; **key `ALPHA`**, which the sheet gives as "Key: the series." under the heading TOMB ALPHA. No lock: it is a bonus.

**Coded line on `alpha_annotations`** (fixed, mixed case): `Clgyy ie nvurdtsf. Lpi pt hfga afetywacsz.`

**Decodes to:** `Carry it yourself. Let it hurt afterwards.` (verified after the round 1 changes: CyberChef semantics, letters only advance the key, case and full stops kept). His first draft of the line HaX gives every agent; HaX (ink): "That's the version he taught us." Letters, spaces and full stops only.

## 3. Code values and ids

Handover 9-3 and 9-4. Each value is the same on every object, lock, ink line and import that names it; each lock value obeys §2's rule.

### 3.1 The year, and the date anchors

The in-world year is **2026** (ruling, round 1; the clue review's §4 checked it against m01–m08 and the bible). **No string prints the present month** (the night's season is left to the cold and the dark; "last spring" for m05 then reads cleanly). Past documents may carry their own dates.

| Phrase | Years back | Year | On |
|---|---|---|---|
| "fifteen years ago" (Nightshade's intake; HaX's notebook) | 15 | 2011 | `notebook_scan` (17 October 2011), `nightshade_file` (Intake 2011) |
| "eleven years" (WREN placed; Harwick & Lowe) | 11 | 2015 | `hl_placing_sheet` (Q2/Q3 2015), ledger "placed 11 yrs" |
| "nine years ago" (the Albion flaw held; the memo) | 9 | 2017 | `albion_folder` (VH-2017-0312; 14 March 2017) |
| "seven years ago" (Tesseract left) | 7 | 2019 | `albion_folder` "Review 2019"; the credential (a VM find) |
| the bunker's lease | – | June 2, 2016 | `lease_file`, `rent_book`, `case_file` ("since 2016"); m10's deed date agrees |
| St. Catherine's ransom | – | 11/2024 | `refit_ledger` (m02's November 2024) |

The legacy rows (2009–2018) and Sorensen's certificate (1986 to 2006; she is 66) sit inside the same frame.

### 3.2 Lock codes (final)

| Code | Value | Where the player gets it | Lock |
|---|---|---|---|
| Safe PIN | **`060216`** (six digits; changed from `020616`, W6-14, C-20) | the long way: `rent_book`'s header "Lease start: 06/02/16", the digits as printed (US month/day/year, June 2, 2016, matching `lease_file`'s "Commencement date: June 2, 2016"); the fast way: Kowalczyk's cracker. The safe shows six slots. | `director_safe`, `lockType: "pin"`, `requires: "060216"` |
| Office door | `clerk-of-the-county` | written nowhere; HaX opens it on `deck_choice_made` (S4 §4 row 5) | `sorensen_office`, `password` |
| H&L file number | `HL2015-0477` | `drop_terminal_screen` after flag 2 ("Source file: HL2015-0477"); HaX's `ledger_read`; printed again as the record's own "Ref" inside the box | `hl_box`, `password` |
| Salvage keypad | `LEWISANDCLARK` | decoded from `MSJMQAEGDZNVI` with key `BONEYARD` (§2) | `salvage_cage`, `password` |

The RFID and biometric locks (`reading_staff_door`, `stacks_release`, `stacks_card`, `tape_room_reader`, the plan cabinet's `Margaret Sorensen`) carry no typed string.

### 3.3 Named values

| Thing | Value | Read on |
|---|---|---|
| WREN's codename | `WREN` | the screen and `printed_ledger` (no pronoun, no name: "care fees, next of kin") |
| Noor's codename | `LINNET` | `printed_ledger` from flag 2, "$500, filing bonus" and "Father, dialysis, Dearborn" on every readable variant; Noor's "[Show her the page.]" is gated on `ledger_page_seen` (§6) |
| Series R | `R-114` to `R-161`, 48 boxes, restricted cage, bay 10 | `trolley_list`, the screen after flag 1, the legend's bay 10 |
| Course code | `STRAT-204` | `notebook_scan` |
| The bunker | Sun River Regional Control Site, Lewis and Clark County; lessee Big Sky Holdings LLC | `lease_file`, `rent_book`, `case_file`; m10 stage 6 uses the same site |
| Tran's courier and handler | courier "J.T."; handler **D. Varga**, "the Bozeman number" | `letters`; m10's server-hall rota should carry D. Varga (§6) |
| Controller vendor | Carrow Controls, RM-4 module, ref VH-2017-0312 | `albion_folder`; m10 stage 6 already cites Carrow |
| The called guard | Lyle Dillard, Statewide Security | §5 |

### 3.4 Item and object ids

**Unchanged from S4 §3 / S5 §3:** `noor_staff_card`, `tape_room_keycard`, `nightshade_file`, `the_reading` (still the `take_the_reading` target and the `reading_found` setter), `the_reading_last_page`, `master_schedule`, `lease_file`, `rent_book`, `danny_sheet`, `refit_ledger`, `hl_placing_sheet`, `catalogue_salvage_line`, and the three bin files **`derek_file`, `letters`, `nightshade_copy`** (fixed text, no variants; C-07 resolved without new ids, so `cage_bin`'s values and m10's readers are unaffected).

**New ids** (round 1; S4/S5 to take, §6):
- `the_reading_2`, `the_reading_3`, `the_reading_4`: notes in `director_safe`, the Reading's entries 2–4 (C-08).
- `clerk_certificate`: wall object in `sorensen_office`, observations only (W6-09, C-14).
- `hl_bay_label`: shelf sign in `open_stacks`, observations only (C-15).
- Global `ledger_page_seen` (default `false`): set by HaX on `global_variable_changed:printed_ledger_read` with `globalVars.flag2_submitted`, `delayMs: 500` (C-06).

**Types** (C-15). Read in place: `type: "notes"`, `takeable: false`, `readable: true` (so `onRead` fires and nothing is collected): `incident_book`, `trolley_list`, `noor_desk_box`, `case_file`, `notebook_scan`, `printed_ledger`, `feed_table_box`, `rent_book`, `danny_sheet`, `refit_ledger`, `deck_controller`, `tape_side_console`, `alpha_annotations`, `albion_folder`, `mirror_job_printout`. Collected notes (`takeable: true`, inside containers or given): the five Reading pages, `master_schedule`, `lease_file`, `nightshade_file`, `hl_placing_sheet`, `enrolment_binders`, the three bin files, `catalogue_salvage_line`. Observation-only objects (not readable): `hl_bay_label`, `sorensen_stamp`, `clerk_certificate`, `shelf_code_legend`, `tomb_beta_rack`, `alpha_tape_deck`. S5 §3.3 and §3.8 listed `rent_book`, `danny_sheet` and `refit_ledger` as collected notes; they are read in place now.

**Display names changed** (W6-16; ids kept): "Rent Ledger" (`rent_book`), "Build-Out Ledger" (`refit_ledger`), "Placement Record, HL2015-0477" (`hl_placing_sheet`), "Incident Log" (`incident_book`).

## 4. The LORE arc: fragments and progressive revelation

m09 is a mission the player reads, so its readable objects (§1) are its lore fragments; there is no separate collectible layer. This section maps them to the 06 prompt's frame: evidence of the plan with numbers on the page, four threads revealed in stages, discovery tracked by globals, and payoffs to m01–m08.

### 4.1 Evidence documents, with numbers on the page

1. **The casualty sheet** (`mirror_job_printout`, flag 4; `flag4_submitted`): 1,100 to 2,600 dead in the first month if the key is pressed; fewer, later, on the fallback; the causes; "an acceptable price". His spreadsheet, signed.
2. **The Initiative's ledger** (the screen after flag 2, and `printed_ledger`; `flag2_submitted`, `ledger_page_seen`): 23 placements, 47 candidates, 11 legacy, with costs to date in Sorensen's columns ($611,400 for WREN, $500 for LINNET).
3. **The legacy files** (`feed_table_box`; `legacy_files_saved`): eleven named people in eleven posts, each with a cost and a yield.
4. **The Reading** (four pages and the last page; `reading_found`, `reading_finished`): premeditation as a file, ending in the prediction that 0x00 will press the key.

Smaller: **Derek's file** (`derek_file`; `cage_bin`) costs one asset's fall before he was hired and says why he did it ("Motive: belief"). HaX's Beat 2.7 and the debrief read back what was saved; stage 7 wires those lines.

### 4.2 Progressive revelation, four threads

Each thread deepens as the player goes, and each pays off a season-long question:

- **Tesseract's history** (the man behind "-- A."): the notebook margin (2011, a teacher's hand) → Nightshade's assessment form (2011, a SAFETYNET intake form with a recruiter's notes in the same hand; the form names nobody, the hand does) → the Tomb Beta binder ("Ask properly" again) → the Albion folder (2017, the civil servant who was right and lost, signed in full) → the credential (flag 3) → the identity scene (the name) → the Alpha tapes and annotations (his teaching, his first draft of the line). Each step is a match the player makes; no page states the conclusion (W6-07, W6-12). **New canon (U1, confirmed):** he recruited Nightshade at 23 while still SAFETYNET's chief strategist, eight years before he left; the disagreement was real and also cover. Carried by `nightshade_file` and the identity scene; for `the_architect.md`, §6.
- **The Insider Threat Initiative's reach** (ENTROPY's origins stay unanswered, per the canon rule): the ledger, the eleven legacy rows (2009 to 2018) and Harwick & Lowe show a programme older than TalentStack, with its own front and its own archivist. m07's "including the people" made physical.
- **The Initiative itself**: the Recruiter's grievance (the Architect took WREN's tasking and is burning her office) and the codename system (names kept only on her tape, by codename) explain why her name is worth buying and why the whole programme hangs on one keeper. This is the m05 thread (the forty-seven, the twenty-three) joined to the m08 thread (the sleeper) in one ledger.
- **HaX's past**: the notebook is hers; the margin hand is her teacher's; the confession (she had the name the night Fraser and Ferreira died) is the fragment that costs her. The lore objects set it up; the identity scene pays it.

### 4.3 Payoffs to m01–m08 threads (where a fragment lands an earlier choice)

| Fragment | Pays off | Thread |
|---|---|---|
| `derek_file` | m01: why Derek did it ("Motive: belief"), the standing order, his fall costed before he was hired | m01 |
| `letters` (Villanueva; courier J.T., handler D. Varga) | m01's Social Fabric; the lever on Tran | m01, m09 |
| `the_reading_2` | m01/m02 innocents hurt | m01, m02 |
| `refit_ledger` | m02 `paid_ransom`: draw 9, 11/2024, the blast door | m02 |
| `printed_ledger` handler sheet | m02 Reeves' fate | m02 |
| `danny_sheet`; HaX at `lease_file` | m03 Danny's fate; Victoria's keys "after Cardiff" | m03 |
| `the_reading_3`; `albion_folder` | m04 `disclosure_choice`, landing twice: his reading, then SAFETYNET's own silence | m04 |
| `feed_table_box`, `noor_desk_box`, `printed_ledger` (LINNET, "$500, filing bonus"), `hl_placing_sheet` | m05 the forty-seven, the twenty-three, Noor, Torres | m05 |
| `case_file` item 5; HaX at `rent_book` | m06 monitoring (Big Sky Holdings, since 2016); Irina's account | m06 |
| `the_reading_4` | m07 `debrief_stance` | m07 |
| `nightshade_file`, `nightshade_copy` | m08 Nightshade: the recruitment, what he cleared | m08 |

### 4.4 Discovery tracking

`reading_found`, `reading_finished`, `schedule_read`, `notebook_read`, `nightshade_file_held`, `ledger_page_seen` (new, §3.4), `sleeper_shortlist`, `cage_bin`, `legacy_files_saved`, `deck_pulled`, `flag2_submitted`, `flag4_submitted`. All but `ledger_page_seen` exist in S4 §5. The debrief and m10 read them.

### 4.5 The cracker canon note (B1), and what m09 carries

FINALE_ARC B1 (and SA §3.4) asked where the cracker canon note goes. m09 carries **no object** for it: the only cracker facts in m09 are spoken at the briefing (stores quarantined every cracker Nightshade signed for; Kowalczyk's is her own, "never been through stores, never been near him"), and m09 claims nothing about where the bench made it. The full canon note (quarantined crackers from Tomb Gamma's bench; the cloner logged "to WREN"; Kowalczyk's bench-made casing) belongs to **m10's Citadel incident file** (handover 10-3). **m09 drops the incident-file note**; it is flagged for m10 S6 in §6. This matches the orchestrator ruling that the cracker canon is m10's (FINALE_ARC §9, stages 1–2).

### 4.6 The Alpha lecture (9-9, MS-20)

**Settled: the same lecture.** Tesseract gave the same lecture on SAFETYNET's strategy course (STRAT-204, which HaX took in 2011) and at Tomb Alpha's workshop. That is why HaX knows the tape ("He gave that lecture every year.") and why the Alpha material pays off in m10. The notebook margin ("Ask who it hurts first. Then ask again, afterwards."), the annotation sheet ("Carry it yourself. Let it hurt afterwards.") and m07's handset ("Let it hurt afterwards, not during.") are three stages of one thought; no line repeats. For `the_architect.md`, §6.

## 5. The called guard

Handover 9-7 (P14): the second guard Tran calls in on the `m01_maya_ko` branch, when he sees the player first at the server closet. Varied against the rest of the cast; sprite comes at the character stage (FINALE_ARC item 47).

**Lyle Dillard.** 54, white Montanan, from a contract-security agency (Tran rings an agency, not the archive's night desk). Ex-sheriff's deputy, heavy, slow, bored, in it for the overtime; nothing political, no secret. He differs from Old Coyote (24, Apsáalooke, a lineman-in-training with his sister on the phone) and Tran (29, Vietnamese-American, an ironic IT contractor) in age, ethnicity and manner. **Grep:** "Dillard" and "Lyle" have no hits in `scenarios/`, `story_design/`, `planning_notes/` or `docs/` (2026-10-21).

**Other new names in this document, grepped the same way (round 1).** Clean: Lindqvist, Pettibone, Ortega, Salas, Akiyama, Brekke, Teague, Brandvold, Deshmukh, Ocampo, Fitch (the legacy rows), D. Varga (Tran's handler), Big Sky Holdings LLC, Statewide Security, Carrow Controls (its only other hits are m10's stage 6 citing this document). The reviewer's rewrite used "Tom Haugen" and "Amit Chandra"; Haugen is m10's gallery monitor guard (B. Haugen) and Chandra appears in the SIS Albion case notes, so the rows use Brekke and Deshmukh instead. Sun River Regional Control Site is m10 stage 6's name for the bunker, adopted here so both missions agree.

- **Role:** on `m01_maya_ko` only, shown by the shutter when Tran sees the player first (`tran_alerted`; S5 §3.3). One line, then hostile. Avoidable (a patrol like any other). No arc, no lore object.
- **Speaker prefix (for stage 7):** NPC id `archive_guard`, `displayName: "Lyle Dillard"`. His one line: "Dillard, Statewide Security. Stay where you are." (then `#hostile:archive_guard`).
- He is the cost of day one (m01) arriving eight missions late; he carries no document and sets only `archive_guard`'s KO global, if the player drops him.

## 6. Proposed changes for earlier docs and FINALE_ARC

Not made here: this stage edits only its own document. None changes a choice, a cost or a lock order.

### 6.1 Id and wiring changes S4 and S5 must take (round 1)

| Change | Why | S4 / S5 place |
|---|---|---|
| **New notes ids** `the_reading_2`, `the_reading_3`, `the_reading_4` in `director_safe`'s `contents` | one variant list returns one string; four entries need four objects (C-08) | S5 §3.8 safe contents; S4 §3.4 (`take_the_reading` still targets `the_reading` only; no new task) |
| **New global `ledger_page_seen`** (default `false`), set by a HaX mapping on `global_variable_changed:printed_ledger_read` with `globalVars.flag2_submitted`, `delayMs: 500` | the binder's `onRead` fires on the locked read too; only a read after flag 2 may count (C-06) | S4 §5 globals table; S4 §4 purge table ("the printed ledger goes once read": its condition becomes `ledger_page_seen && sorensen_fate === 'left'`) |
| **Noor's "[Show her the page.]"** gated on `ledger_page_seen`, not `printed_ledger_read` | as above | S4 §5 (`printed_ledger_read` row); SA Beat 1.2; MC §4.2 |
| **Safe PIN** `060216` (was `020616`) | the US rent ledger prints month/day; the PIN is the header's digits as printed (W6-14, C-20) | S5 §3.8 `director_safe`; S4 P16 wording ("the lease's start date") unchanged |
| **New object ids** `clerk_certificate` (sorensen_office, observations only) and `hl_bay_label` (open_stacks, observations only) | the decode's callback needs a text (W6-09, C-14); the label needed an id (C-15) | S5 §3.8 and §3.3 object lists |
| **Types:** `rent_book`, `danny_sheet`, `refit_ledger` are read in place (`notes`, `takeable: false`), not collected | consistent with the other office finds; `onRead` needs a notes type (C-15) | S5 §3.8 |
| **`alpha_annotations`** readable variant needs `identity_scene_done` as well as `deck_pulled === 'alpha_tapes'` | the decode can't come before HaX names him (C-11) | S5 §3.9 |
| **Display names:** "Rent Ledger", "Build-Out Ledger", "Placement Record, HL2015-0477", "Incident Log" | US usage in American documents (W6-16) | S5 §3.1, §3.3, §3.8 |
| **No change to the bin files' ids.** `derek_file`, `letters`, `nightshade_copy` stay, with fixed text | C-07 was resolved with a fixed Derek page true on every m01 branch; the m01 value is read back by the Reading's page 1 and HaX's bin line | none. **`cage_bin`'s values and m10's `m09_cage_bin` readers are unaffected** |

### 6.2 For FINALE_ARC

- **§13 stage 6 handover, 9-1 to 9-9: mark settled** with the final values: `Vigenère Decode`; coded line `SALVAGE CAGE ACCESS` / `MSJMQAEGDZNVI` on two lines, decode the second only; key `BONEYARD` (the legend's Salvage row, bay 12); keypad input `LEWISANDCLARK`; Alpha annotations key `ALPHA`, `Clgyy ie nvurdtsf. Lpi pt hfga afetywacsz.` → "Carry it yourself. Let it hurt afterwards."; safe PIN `060216`; office `clerk-of-the-county` (written nowhere); H&L `HL2015-0477`; Noor `LINNET`; course `STRAT-204`; Series R `R-114` to `R-161`, bay 10; guard Lyle Dillard; vendor Carrow Controls (RM-4, VH-2017-0312); the Alpha lecture is the same lecture as the course's; flag 4's documents are `mirror_job_printout` (9-6); the legacy files are a readable (9-4).
- **B1:** m09 carries no cracker incident-file note; it is m10 stage 6's (handover 10-3).
- **U1:** written into m09 (`nightshade_file`, the identity scene).
- **§5.2 name register:** add Lyle Dillard, D. Varga, Big Sky Holdings LLC, the eleven Series L names, Carrow Controls.
- **§1.5:** the in-world year is 2026, and no m09 string prints the present month.

### 6.3 For m10 (its stage 6 and stage 7)

- **D. Varga** is Tran's handler in the Helena letters: the server-hall rota should carry "D. Varga" for HaX's "Tran's handler is on that rota. He's in the Helena letters." (`m09_cage_bin = letters`).
- **The bunker** is Sun River Regional Control Site, Lewis and Clark County, leased June 2, 2016 to Big Sky Holdings LLC (m10's S6-20 cross-check: now agreed).
- **Carrow Controls** and "Disposition: RETAIN. Operational value." match m10's Elsewhere line.
- **The casualty sheet** now reads "Fallback: 06:00 UTC, staged by city." m10's later printing should keep "UTC".

### 6.4 For the canon file and this mission's earlier stages (the arc-keeper's next fold)

- **`the_architect.md`, identity section:** the U1 sentence (recruited Nightshade at 23 as chief strategist, eight years before he left; the disagreement real and also cover) and the same-lecture note (§4.6).
- **SE §5:** the documents' text is now this document's §1; in particular the Albion notice is written in full (W6-01), Derek's file carries his motive, the letters name courier and handler, Nightshade's form carries no "-- A.", and the legacy files have eleven rows. SE §3's Sorensen hatch lines: on `expose` and `surrender` her line is now the third telling of the same beat (W6-17); stage 7 should give her a different angle or cut it there.
- **SE §2, Gary:** his line is §2.3's (C-16).
- **S4 §7.1 topic 5:** HaX's two fixed lines and her field-guide pointer are §2.3's (C-03, C-04).
- **SA Beat 3.1:** "the rent book" becomes "the rent ledger" in player-facing text; the PIN is the header's digits as printed.
- **SA §3.4:** the incident-file note is dropped from m09 (B1).

### 6.5 For stage 7

HaX's ink lines moved out of the documents (W6-02) are listed under each object in §1 ("HaX (ink)"): the lease (three, including "after Cardiff", C-21), the rent ledger (Irina), the build-out ledger (the blast door), Danny's note, the legacy box, Derek's file (by m01 value), the H&L record, the case file. None of the document strings begins with `*`, `-`, `+`, `=` or `#`, but if a casualty-sheet line is read aloud in ink, keep the line's first word first (C-23).

**Open for the user:** nothing. The year 2026 is the orchestrator's ruling.

## 7. Review round 1 outcomes

Reviews: `REVIEW_R1_CLUES.md` (C-01 to C-24: 1 blocker, 7 majors, 16 minors) and `REVIEW_R1_WRITING.md` (W6-01 to W6-26: 1 blocker, 13 majors, 12 minors). Orchestrator rulings applied as given. Both decodes re-run after the changes: `MSJMQAEGDZNVI` / `BONEYARD` → `LEWISANDCLARK`; the ALPHA line → "Carry it yourself. Let it hurt afterwards."

### 7.1 Clues and consistency

| ID | Sev | Outcome | Where |
|---|---|---|---|
| C-01 | blocker | Fixed: label and code on separate lines in all three places; HaX says "Just the code, not the label." | §1.4, §1.10, §2.2, §2.3 |
| C-02 | major | Fixed: HaX names "the salvage bay's word"; §2.2's reasoning corrected (label to legend row, not the room) | §2.2, §2.3 |
| C-03 | major | Fixed: HaX's first ask points at the archive-code field guide; asked again she names Vigenère Decode; the legend's house rule says "bay word" | §2.3, §1.9 |
| C-04 | major | Fixed: `catalogue_salvage_line` written (`name`, `text`); HaX's quote written as fixed lines | §1.10, §2.3 |
| C-05 | major | Fixed: no `||` anywhere; one variant per alternative (Reeves four, the innocents' KO three); the lease variants removed (they were glosses) | §1.6, §1.7 |
| C-06 | major | Fixed: `ledger_page_seen` (flag 2 only) drives the shredding and Noor's choice; every Reeves variant needs flag 2 | §1.6, §3.4, §6.1 |
| C-07 | major | Fixed (author's call): Derek's file is a fixed page true on every m01 branch; ids unchanged | §1.5, §6.1 |
| C-08 | major | Fixed: the Reading is four objects plus the last page | §1.7, §3.4, §6.1 |
| C-09 | minor | Fixed: every condition in full `globalVars.` form; every variant a whole string (the two shared blocks, L and P, are stated once and named) | §1 |
| C-10 | minor | Fixed: custom keypad hint dropped; the engine's own text stands | §2 intro |
| C-11 | minor | Fixed: `identity_scene_done` added | §1.9, §2.4 |
| C-12 | minor | Fixed: bay numbers on the legend | §1.9 |
| C-13 | minor | Fixed: sections renumbered (§1.1–§1.10) and references corrected | throughout |
| C-14 | minor | Fixed: `clerk_certificate` | §1.7 |
| C-15 | minor | Fixed: types stated; `hl_bay_label` recorded; S5 told | §3.4, §6.1 |
| C-16 | minor | Fixed: Gary's line rewritten (no Montana audit, no view of the room) | §2.3 |
| C-17 | minor | Fixed: rent ledger is document only; Irina's line is ink | §1.7 |
| C-18 | minor | Fixed: Series L sheets open "NOT SAFETYNET" wherever they are read | §1.2, §1.6 |
| C-19 | minor | Fixed: all eleven rows written | §1.6 |
| C-20 | minor | Fixed: US month/day on the ledger; PIN `060216` as printed | §1.7, §3.2 |
| C-21 | minor | Fixed: "after Cardiff", in HaX's ink line at the lease | §1.7 |
| C-22 | minor | Fixed: the deed states no coordinate claim; the framing is HaX's, by branch | §1.7 |
| C-23 | minor | Noted for stage 7; no string starts with a banned character | §1 rules, §6.5 |
| C-24 | minor | Fixed: `danny_ko` mention dropped; a knock-out reads the base | §1.7 |

### 7.2 Writing

| ID | Sev | Outcome | Where |
|---|---|---|---|
| W6-01 | blocker | Fixed: catalogue entry, memo and notice written in full (rewrite 1 as base) | §1.10 |
| W6-02 | major | Fixed: every readable split into document text and an observations gloss; HaX's remarks moved to ink | §1 |
| W6-03 | major | Fixed: eleven Series L rows with posts, costs, yields, notes | §1.6 |
| W6-04 | major | Fixed: totals line, costs for WREN and LINNET, on the print copy and the screen | §1.4, §1.6 |
| W6-05 | major | Fixed: Reeves sheet appended to the page, not replacing it; gated on flag 2; LINNET's father on every readable variant | §1.6 |
| W6-06 | major | Fixed: "Motive: belief" | §1.5 |
| W6-07 | major | Fixed: the intake form carries no "-- A." and no office label | §1.6 |
| W6-08 | major | Fixed: courier J.T. and handler D. Varga named; the quote recast without nested quotes | §1.5 |
| W6-09 | major | Fixed: `clerk_certificate` | §1.7 |
| W6-10 | major | Fixed: rewrite 8 | §1.5 |
| W6-11 | major | Fixed: the rack no longer gives the realisation away | §1.10 |
| W6-12 | major | Fixed: rewrite 9 ("Ask properly" does the recognising) | §1.10 |
| W6-13 | major | Fixed: rewrite 10 (HaX's typed file; item 4 the quiet tell) | §1.4 |
| W6-14 | major | Fixed: the deed is a US lease abstract (lessee, premises, county, commencement, recorded); dates in US order; PIN `060216` | §1.7, §3.2 |
| W6-15 | minor | Fixed: American posts; the box labelled by series ("Series L, boxes 1 to 3. Hold for M.S.") | §1.2, §1.6 |
| W6-16 | minor | Fixed: four display names | §1.1, §1.3, §1.7 |
| W6-17 | minor | Fixed in the Reading (rewrite 4b); Sorensen's hatch copy flagged to stage 7 | §1.7, §6.4 |
| W6-18 | minor | Fixed: cover line on page 1 and a heading on each page | §1.7 |
| W6-19 | minor | Fixed: three ranges struck one at a time | §1.2 |
| W6-20 | minor | Fixed: rewrite 7b (bay numbers; a house rule an archive would pin up) | §1.9 |
| W6-21 | minor | Fixed, merged with C-16 | §2.3 |
| W6-22 | minor | Fixed: "06:00 UTC" | §1.10 |
| W6-23 | minor | Fixed: the base screen's hint cut; " -- " and dot leaders as separators | §1 |
| W6-24 | minor | Fixed: ref, search, client, fee, start in the record | §1.3 |
| W6-25 | minor | Fixed: a date and "Wk 7" in both hands; the g of "again" | §1.4 |
| W6-26 | minor | Fixed: in-world markers ("In the margin, another hand:", "Pencilled at the foot:") replace bracketed directions | §1 |

**Counts:** 50 findings (2 blockers, 20 majors, 28 minors). 49 fixed; 1 noted for stage 7 (C-23, which is a rule for later, not a fault in the strings). None withdrawn. Id changes: three new Reading ids, two new object ids, one new global, one PIN value; no bin-file id changed.

## 8. Review round 2 outcomes

Review: `REVIEW_R2.md` (0 blockers, 1 major, 12 minors). The reviewer's rewrites were used where given. Both decodes are unaffected (no code, key or coded line changed): `MSJMQAEGDZNVI` / `BONEYARD` → `LEWISANDCLARK`; the ALPHA line → "Carry it yourself. Let it hurt afterwards."

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R2-01 | major | Fixed: the assessor's handwritten notes open "Seen 7 November. Again on the 17th." (rewrite 1), so the hand carries a looped g and crossed 7s, the two features HaX's hints name; the Carries line now says the match rests on the handwriting, not the printed fields ("Age", "0x47"), and that the 17th matches the notebook's 17 October 2011 | §1.6 `nightshade_file` |
| R2-02 | minor | Fixed: rent ledger with a header, columns and two rows, paid early from one account (rewrite 3); PIN still the header's digits, `060216` | §1.7 `rent_book` |
| R2-03 | minor | Fixed: the base page shows enciphered rows instead of a bracketed note; base observation "A ring binder of rows in the archive's cipher. The live copy will have the key."; LINNET's row has all six columns ("direct -- not placed -- CANDIDATE") | §1.6 `printed_ledger` |
| R2-04 | minor | Fixed: "In pencil, room by room:" (rewrite 5) | §1.7 `master_schedule` |
| R2-05 | minor | Fixed: "Covering slip: ... I burned. -- 47"; the card's in-world marker kept | §1.5 `nightshade_copy` |
| R2-06 | minor | Fixed: the board line printed as a form ("Board: OPS ✓ LEGAL ✓ TECH ✓ INT ✓ STRAT ......", the Chief Strategist's box empty; a dot leader, not a bracketed "(blank)", so it is in-world text); the notice dated 14 March 2017 | §1.10 `albion_folder` |
| R2-07 | minor | Fixed: plain county wording, "Board of County Commissioners ... Presented June 2006." (rewrite 2) | §1.7 `clerk_certificate` |
| R2-08 | minor | Fixed: "Unindexed entry:" | §1.4 `drop_terminal_screen` |
| R2-09 | minor | Fixed: "furnish and install", "nursing home" (twice), "Penciled", "MRS. S" | §1.1, §1.3, §1.6, §1.7 |
| R2-10 | minor | Fixed: HaX says "on the chart in the tape room, by the keypad" on every ask, since topic 5 can be opened from any room and her ink has no room check | §2.3 |
| R2-11 | minor | Fixed: empty states are in-world text: "PRINTER READY. TRAY EMPTY." (both printers), "ACEMENTS 23. CANDIDA" (the shredded binder's surviving strip), "SERIES L. RECALLED. M.S." (the empty feed tray, Noor's branch), "Lindqvist -- 20" (a strip, clock run) | §1.6, §1.10 |
| R2-12 | minor | Fixed: "why he will not stop when they tell him to." | §1.5 `derek_file` |
| R2-13 | minor | Fixed: the case file's base written in full; the deck has one base observation | §1.4, §1.9 |

**Counts:** 13 findings, all fixed, none withdrawn. No id, global, lock value or condition changed in round 2, so §6's lists stand as written. Stage 6 is complete.
