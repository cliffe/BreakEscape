# m09 Digital Archaeology: Stage 6, lore fragments

## 0. Status and inputs

Stage 6 (lore). Author: stage 6 author (Opus), 2026-10-21. Status: **draft for review** (round 1 pending).

Inputs read: `docs/agents/FINALE_BRIEF.md`; `../../finale/FINALE_ARC.md` §1–9 and §13 (the stage 6 handover rows B1–B3, 9-1 to 9-9); this mission's `stage_1/story_arc.md` ("SA"), `stage_2/storytelling_elements.md` ("SE"), `stage_3/moral_choices.md` ("MC"), `stage_4/objectives_tasks.md` ("S4"), `stage_5/room_layout.md` ("S5"); `story_design/story_dev_prompts/06_lore_fragments.md`; the `scenario-design-review` skill (clue distribution: the player can always find what they need); `README_scenario_design.md` (notes items, `textVariants`/`observationVariants`, conditions, PIN/password locks); `README_ink_best_practices.md`; canon in `story_design/universe_bible/` (the Architect's identity section, the Insider Threat Initiative, the voice bible, SAFETYNET characters). VM material was not opened; flags appear by story meaning only (brief rule). The engine's `resolveObjectField` was read (`js/utils/conditional-text.js`): variants are `{ "condition", "value" }`, first match wins, `&&` only, `globalVars.` prefix.

This document is the authority for every fixed readable string in m09 and for the mission's code values. Stage 7 wires the ink; stage 9 assembles the JSON. Where this document and an earlier stage disagree on a string, this one wins (it is the final pass before assembly); where it would change a **decision** (a choice, a cost, a lock), it does not, and §6 lists anything earlier docs should be told.

**Rules applied to every string here.**
- Fixed strings only. No printed variables; a branch is a separate variant with its own condition.
- UK English in SAFETYNET's and Tesseract's documents (the Reading, the order, the casualty sheet, the Albion memo and notice, HaX's notebook); **US usage** where an American archive or an American writes it (Sorensen's ledger and labels, the rent book, the trolley list, Noor's note, Old Coyote's incident book, the Harwick & Lowe sheet). "Cyber Security" with a space in SAFETYNET text.
- Most specific variant first; the base `text`/`observations` is the least-advanced state.
- The coded salvage string and every code value obey the §2 banned-character rule.

## 1. Every readable text in m09

Final fixed strings, ready for stage 9. For each: object **id**, **name**, the **text** (base and every `textVariants`/`observationVariants` entry with its `condition` in `globalVars.` form, most specific first), what **clue or lore** it carries, and which **choice or import** changes it. Conditions use `&&` only (the engine's `evaluateGlobalCondition`). Documents stay short and characterful. The briefing wall, the order photograph and the "-- A." card are a cutscene (ink, stage 7), not world objects, so they are not here; their canon is §4.

### 1.1 The reading room (the building's paper, Act 1)

**`drop_terminal_screen`** — name "SAFETYNET Drop Terminal". `readable`, `readDisplay: "gameDisplay"`, `addToNotes: false` (a live display; S5 §3.5). The coded salvage line (§2) is appended to every variant from flag 1 on, so no later state hides it. `textVariants` and `observationVariants` both carry the stack (most specific first):

- `globalVars.invoice_booked` → "LIVE: Insider Threat Initiative ledger.\n\nSale. WREN. To Agent 0x00. Consideration, one deck. Booked. M.S.\n\nH&L file: HL2015-0477\n\nSALVAGE CAGE ACCESS MSJMQAEGDZNVI"
- `globalVars.flag2_submitted && globalVars.m05_final_choice === 'combat_lethal'` → "LIVE: Insider Threat Initiative ledger.\n\nWREN — legacy (H&L) — placed 11 yrs — LIVE. Day 10: assigned TF Null, Montana.\nTORRES, D. — closed placement.\n\nH&L file: HL2015-0477\n\nSALVAGE CAGE ACCESS MSJMQAEGDZNVI"
- `globalVars.flag2_submitted && globalVars.m05_final_choice === 'turn_double_agent'` → same, but "TORRES, D. — LIVE placement." (the Initiative never learned he turned)
- `globalVars.flag2_submitted && globalVars.m05_final_choice === 'public_exposure'` → same, but "23 PLACEMENTS — BLOWN. TORRES, D. — lost."
- `globalVars.flag2_submitted` → "LIVE: Insider Threat Initiative ledger.\n\nWREN — legacy (H&L) — placed 11 yrs — LIVE. Day 10: assigned TF Null, Montana.\nTORRES, D. — lost.\n\nH&L file: HL2015-0477\n\nSALVAGE CAGE ACCESS MSJMQAEGDZNVI"
- `globalVars.flag1_submitted` → "LIVE: full catalogue.\n\nSERIES R (restricted): R-114 to R-161. Location: restricted cage.\n\nSALVAGE CAGE ACCESS MSJMQAEGDZNVI"
- base → "Public catalogue only. County deeds, land records, corporate deposits. No restricted series listed."

Clue/lore: the Series R marks (flag 1), the ledger and the H&L file number (flag 2), the coded salvage line (every state from flag 1), and the booked sale (the invoice, `taken`/`double_crossed`). Changed by: flags 1–2, `m05_final_choice`, `invoice_booked` (set in Sorensen's office on `taken`/`double_crossed`, S4 §6.6).

**`case_file`** — name "HaX's Case File". `readable`. US/UK: SAFETYNET, UK English.

- `globalVars.m06_monitoring_enabled` → "The order, photographed. The wall from the briefing. The raid team.\n\nTagged payments (HashChain): a standing monthly transfer from the frozen fund to a property account. The account pays rent on a building in Montana. It is not this one."
- base → "The order, photographed. The wall from the briefing. The raid team. A scanned notebook, filed on its own."

Clue/lore: the tagged-payments page points at Tomb Gamma's lease (and, on the no-coordinate branch, finds the bunker). Changed by `m06_monitoring_enabled`. HaX reads it once (SA Beat 1.3).

**`notebook_scan`** — name "Training Notebook (scan)". `readable`; `onRead: { setVariable: { notebook_read: true } }`. UK English (a SAFETYNET course). Its own object (the hand exemplar; S5 §3.5).

- base → "SAFETYNET Strategy — STRAT-204 — 2011.\n\n*(a student's hand)* Disclosure: who does it serve?\n*(a second hand, in the margin)* Ask who it hurts first. Then ask again afterwards."

Clue/lore: HaX's own notebook from Tesseract's course, fifteen years ago; the margin hand is the exemplar the player matches against Nightshade's file (`match_the_hand`). The margin line is the seed of "Let it hurt afterwards". Course code and year fix the fifteen-year anchor. Not changed by any import.

**`trolley_list`** — name "Destruction Run — Series R". `readable`. US (American archive clerk's list). Empties in three steps so the purge is visible (S4 §4):

- `globalVars.cage_opened` → "Destroy: R-114 to R-161. Certificate to follow.\n\n*(every line crossed through)*"
- `globalVars.flag2_submitted` → "Destroy: R-114 to R-161. Certificate to follow.\n\n*(most lines crossed through)*"
- `globalVars.flag1_submitted` → "Destroy: R-114 to R-161. Certificate to follow.\n\n*(the first lines crossed through)*"
- base → "Destroy: R-114 to R-161. Certificate to follow."

`spriteVariants` empty the trolleys on the same globals. Clue/lore: the Series R range (matches the catalogue), and the purge moving. Changed by flags 1, 2, `cage_opened`.

**`noor_desk_box`** — name "Box under the desk". `readable`.

- `globalVars.m05_found_pipeline_list && !globalVars.m05_recruiter_deal_accepted` → "The last box of the run. Not sent to the cage. Insider Threat Initiative — legacy placements. Eleven names."
- base → "Returns for re-shelving. County deeds."

Clue/lore: on the warned-in-time branch Noor held the legacy files back (`legacy_files_saved` true without a choice). Changed by `m05_found_pipeline_list` + `m05_recruiter_deal_accepted`.

**`incident_book`** — name "Guard's Incident Book". `readable` (the dock; Old Coyote's). US, block capitals.

- base → "MON. SHREDDER RUNNING, NIGHT. MRS S SAYS SCHEDULED. NOTED.\nTUE. SAME. NOTED.\nWED. SAME.\nTHU. SAME.\nFRI. SAME. NOBODY READS THIS."

Clue/lore: a week of the purge nobody read (the Gary rhyme: warnings for nobody). Not changed.

**`noor_staff_card`** — name "Noor's Staff Card" (keycard, `opens_lock: reading_staff_door`). Item, handed over or cloned. No read text beyond the inventory label.

### 1.2 The open stacks (the cross-reference)

**Harwick & Lowe bay label** (object `hl_bay_label`, a shelf sign) — name "Bay Label". `observations`. US.

- base → "HARWICK & LOWE, EXEC SEARCH (CLOSED). RETENTION 25 YRS."

Clue/lore: makes the H&L boxes findable from Act 1. Not changed.

**`hl_placing_sheet`** — name "Harwick & Lowe — Placing Sheet". Contents of `hl_box` (keypad, `requires: "HL2015-0477"`). `readable`; `onRead: { setVariable: { sleeper_shortlist: true } }`. US (an American executive-search firm's file, dull on purpose).

- base → "Placing sheet, Q2 2015.\n\nCandidates: H. Kowalczyk; M. Quintero.\nPlacement: lateral, private sector.\nClient: government (UK).\nResult: both placed.\nNext of kin: Kowalczyk — mother, residential care. Quintero — father, residential care."

Clue/lore: narrows WREN to two (both with a parent in care; the file can't tell the honest hire from the sleeper). Sets `sleeper_shortlist`. Not changed by import; HaX's "H&L shut before TalentStack opened" is ink (SA Beat 2.5).

### 1.3 The restricted stacks (the hatch)

**`sorensen_stamp`** — name "Rubber Stamp" (`hasFingerprint: true`, `fingerprintOwner: "Margaret Sorensen"`). `observations` + `observationVariants`:

- `globalVars.flag2_submitted && !globalVars.cage_opened` → "DESTROYED, in red. Her stamp's still warm. She's three boxes from the bins."
- base → "A rubber stamp: DESTROYED, in red. The ink pad's nearly dry."

Clue/lore: lift the print here (opens the plan cabinet); the purge-clock line after flag 2. Changed by flag 2 + `cage_opened`.

**The bin files** — three notes items held by `sorensen_hatch` and `sorensen_door`, given by id on the bin choice (§3.4; S5 §3.6–3.7). Each short, in its writer's register.

**`derek_file`** — name "Derek Lawson — Asset File". Tesseract's hand, UK English, before Viral Dynamics. Variants by `m01_final_choice` add one closing line:

- base → "Lawson, Derek. Asset, Viral Dynamics.\n\nExpected loss of asset: total. Expected yield: one demonstration, and the agency's attention. A good first lesson for whoever they send. -- A."
- append on `globalVars.m01_final_choice === 'surrender'` → " *(standing order, same hand)* If taken, put the device down and wait. Say nothing. They will believe they talked you into it."
- append on `globalVars.m01_final_choice === 'expose'` → " *(margin note)* If they publish the figures, the coverage will do a month of recruiting for us. Let them."

Clue/lore: the Architect costed Derek's fall before anyone hired him (the m01 payoff, "The Architect planned for this"); a second sample of the hand. In m10 a record answer under his first claim on `m09_cage_bin = derek_file`. The default bin.

**`letters`** — name "Social Fabric — Correspondence". US (an ENTROPY cell's briefing). The default other bin.

- base → "Insider Threat Initiative → Social Fabric. Drop and handler as filed.\n\nNext: Teresa Villanueva, 41, union rep, Butte copper mine. A fabricated affair and a leaked medical file.\nFrom the brief: 'She says we when she means the men on the night shift.'"

Clue/lore: Tran's trade route (the lever on him), and the next smear target (saved → Villanueva warned). On `m01_maya_ko` it gives back the warning Maya's names would have given. In m10 a server-hall line on `m09_cage_bin = letters`.

**`nightshade_copy`** — name "What Nightshade Cleared". Replaces `letters` as the second bin on `m08_nightshade_tidied` (the bin buttons offer it in place of the letters). His own words, serene.

- base → "*(copied from his locker, in his hand)* His notes to me, not the Initiative's. I kept these. I'd have burned anything that named anyone else. Whatever else I was, I was careful about that."

Clue/lore: what he sent ahead; changes his text-back on the triple-agent branch. In m10 Nightshade's door line on `m09_cage_bin = nightshade_copy`.

**`nightshade_file`** — name "Recruitment File — Agent 0x47". In the `plan_cabinet` (biometric). `onPickup: { setVariable: { nightshade_file_held: true } }`. Tesseract's hand, 2011, while chief strategist. UK English. **New canon (U1):** he recruited at 23 while still SAFETYNET's chief strategist.

- base → "Intake 2011. Twenty-three. Idealistic, tired already. Will wait if asked properly. Ask properly. No payment: belief is the payment.\n\n*(filed by the chief strategist's office; his own hand)* -- A."

Clue/lore: the hard proof the teacher recruited him ("the man who put me here fifteen years ago"); the lever that talks Sorensen down (kept off her schedule). The hand matches the notebook margin and the credential. Not changed by import.

### 1.4 The restricted cage (the shredder line)

**`feed_table_box`** — name "The Last Box". `readable` (a readable, **not** a collectible item; 9-4, M9-19). The legacy placement files outside SAFETYNET, in Sorensen's hand; never names WREN (D-01). Variants most specific first:

- `globalVars.m05_found_pipeline_list && !globalVars.m05_recruiter_deal_accepted` → "Empty feed tray. The last box never came up." (Noor held it back)
- `globalVars.legacy_files_saved` → "Insider Threat Initiative — legacy placements, outside SAFETYNET. Eleven names, in her hand. None of ours: ours are on the Recruiter's tape, by codename.\n\nElsewhere: a school governor, a council clerk, a hospital trust secretary, a planning officer... eleven quiet people, placed and left."
- `globalVars.legacy_clock_run` → "Shredder strips. The last box is gone."
- base → "An open box on the feed table. She's working through it, sheet by sheet."

Clue/lore: the Initiative's scope made physical (eleven real placements); saved only by a knock-out before HaX's clock, or Noor holding it. Exported as `legacy_files_saved`; in m10 an "Elsewhere" clause. Changed by `m05_found_pipeline_list`, `legacy_files_saved`, `legacy_clock_run`.

**`printed_ledger`** — name "Initiative Ledger (printed)". `readable`; `onRead: { setVariable: { printed_ledger_read: true } }`. US (Sorensen's columns). The optional page in hand.

- `globalVars.printed_ledger_read && globalVars.sorensen_fate === 'left'` → "*(shredder strips where the binder was)*" (she shreds it once read, if free; the flag holds the content, so nothing is lost)
- `globalVars.m02_insider_asset_arrested || globalVars.m02_reeves_fate === 'arrested' || globalVars.m02_reeves_fate === 'ko' || globalVars.m02_reeves_fate === 'flagged'` → "Codename / source / placed / status / cost / notes.\nWREN — H&L — 11 yrs — LIVE.\nLINNET — candidate — not placed.\n\n*(clipped inside)* Handler contact sheet: G. Reeves, St. Catherine's. Handler line and drop."
- `globalVars.flag2_submitted` → "Codename / source / placed / status / cost / notes.\nWREN — H&L — 11 yrs — LIVE. Day 10: assigned TF Null, Montana. M.S.\nLINNET — candidate — not placed. Father, dialysis, Dearborn."
- base → "A locked binder. Codenames down the margin; no key to the names without the live copy."

Clue/lore: Reeves' handler sheet (on that branch); Noor's codename LINNET (for "[Show her the page.]"); WREN's live entry. Changed by flag 2, `m02_insider_asset_arrested`/`m02_reeves_fate`, `printed_ledger_read` + `sorensen_fate`.

### 1.6 Sorensen's office

**`the_reading`** — name "The Reading". In `director_safe`. Collected; `onPickup: { setVariable: { reading_found: true } }`. Tesseract's hand, UK English, third person about the agent ("they"). Four entries, each a heading and one or two lines; the never-played form is first-class writing. Variants are **per entry block**, assembled in one `text` with four `textVariants` stacks — or, in the build, four stacked variants that each render the whole file with that entry's line swapped. For clarity the entries are given here as the lines by value; stage 9 assembles one `text` with the four conditioned lines (most specific first within each entry).

*Entry 1 — Viral Dynamics* (`m01_final_choice`):
- `=== 'fight'` → "They put Lawson on the floor when the argument was already won. Force first. Noted."
- `=== 'arrest'`, or `=== ''` with `globalVars.m01_completed` → "They read Lawson his rights. He kept his promise to me and said nothing."
- `=== 'recruit'` → "They offered Lawson a deal. A recruiter's instinct. They should be careful whom they show it to."
- `=== 'expose'` → "They put Lawson's figures on every front page, and did a month of my recruiting for me."
- `=== 'surrender'` → "Lawson put the device down for them, as instructed. They believe they persuaded him."
- never played m01 → "Lawson was arrested and kept his promise to me. Their file does not say who arrested him."

*Entry 2 — the innocents* (first match wins):
- `globalVars.m02_patient_assaulted` → "They struck a patient on a ward. I have read the ward's notes. So, I expect, have they."
- a first-day KO (`globalVars.m01_kevin_ko || globalVars.m01_sarah_ko || globalVars.m01_maya_ko`) with `globalVars.m01_completed` → "On their first day they put a bystander on the floor. They will have told themselves it was necessary."
- clean, with `globalVars.m01_completed` → "Not one bystander hurt on their first day. Rare. It will not last."
- never played m01 → "Their first days are not in my file. Someone at SAFETYNET is careful with them."

*Entry 3 — Albion* (`m04_disclosure_choice`):
- `=== 'full'` → "They told the inquiry everything, and every site was audited. My lesson, delivered by them. They do not know it yet."
- `=== 'partial'` → "They told half. Half is how we arrived here."
- `=== 'quiet'` → "They buried it. They understand me better than they admit."
- `=== ''` or never played → "Their report went upstairs and no further. I will not guess what it said."

*Entry 4 — Portland* (`m07_debrief_stance`):
- `=== 'defended'` → "'I'd make it again.' They would. I have counted on it."
- `=== 'owned'` → "They said it was theirs. They will carry this too."
- `=== 'refused'` → "'Don't ask me to rank them.' I ranked them for them."
- `=== 'hardened'` → "They asked for the numbers. Good. I keep numbers."
- `=== ''` or never played → "One team, four sites. They sent it where they were told. Obedience or trust. I will learn which."

Clue/lore: the Architect's reading of Agent 0x00 (the m07 "figures"); entries 1, 3, 4 are echoed aloud by Tesseract in m10, so a reader hears them in his mouth. Changed by `m01_final_choice`, the innocents imports, `m04_disclosure_choice`, `m07_debrief_stance`, each with `m01_completed` on the clean/default lines. Sorensen quotes entry 1 at the hatch (ink, SE §3).

**`the_reading_last_page`** — name "The Reading — Last Page". Second notes object in the safe (`onRead` shadows `onPickup`, so it is split; S5 §3.8). `onRead: { setVariable: { reading_finished: true } }`.

- base → "When the hour comes, they will be in the room and the key will be in reach. They will press it. I will not need to ask. They will have read this far and found nothing here that is untrue.\n\n*(below, same hand)* Their handler will cover for them. She was taught to.\n\n*(in the margin, pencilled before tonight)* They will save Lawson's file. They will want to know why he did it."

Clue/lore: the prediction (§1.2 of the arc); the line about HaX (passed to her or kept); the margin bin-guess (W-26) — right on `cage_bin = derek_file`, which m10 pays ("one thing"/"two things"). Sets `reading_finished`. Not changed by import (fixed for every player; the margin line is the same for all).

**`master_schedule`** — name "Destruction Schedule (master)". In `director_safe`. `onRead: { setVariable: { schedule_read: true } }`. UK English (the order's attachment), with her US planning pass down the margin.

- base → "Series by number, per the order. -- A.\n\n*(her planning pass, by room)* Dock ✓. Front desk ✓. Reading room ✓. Open stacks ✓. Closet ✓. Stacks ✓. Cage ✓. Office ✓. Tape room ✓. Salvage cage — no series, no tick.\n*(in the margin)* Reading (safe); plan chest: not listed. Keep?"

Clue/lore: the salvage cage was left off the order on purpose (the server left running); her own two kept items. Sets `schedule_read`, which gives the flag-4 realisation choice. Not changed.

**`lease_file`** — name "Lease & Construction File". `collect_items` target `find_the_deed`; takeable. UK English. The bunker's deed.

- `!globalVars.m08_tomb_gamma_location_known && globalVars.m08_completed` → "Lease and deed, held for the lease-holder. Site: a decommissioned bunker, Montana. Grid reference on the plans.\n\nThere it is. Tomb Gamma has an address."
- `globalVars.m03_victoria_fate === 'arrested' || globalVars.m03_victoria_fate === 'ko'` → "Lease and deed, held for the lease-holder (Zero Day front). Site: the Montana bunker. This lease was on the client list Sterling's keys opened in the spring."
- base → "Lease and deed, held for the lease-holder (Zero Day front). Site: the Montana bunker. Same coordinate the team already has. Now it has a lease."

Clue/lore: the paper half of the defences; on the no-coordinate branch it finds the bunker. Deed start date 02/06/2016 = the safe PIN (§3.2). Changed by `m08_tomb_gamma_location_known`, `m03_victoria_fate`.

**`rent_book`** — name "Rent Book". `readable`. US (an accountant's monthly book). Every page headed with the lease start date (the PIN, the long way).

- `globalVars.m06_irina_recruited` → "Page header: Lease start 02/06/2016.\n\nEvery payment from the same account. *(HaX: Irina's account. It bought the deed.)*"
- base → "Page header: Lease start 02/06/2016.\n\nEvery month, the same account, paid on time."

Clue/lore: the PIN the careful reader finds without the cracker; on `m06_irina_recruited`, the account that paid (row 74). Changed by `m06_irina_recruited`.

**`danny_sheet`** — name "Broker's Note — D. Foster". `readable`. US (Zero Day broker's memo). Its own sheet (D-07), whatever Victoria's line says. By `m03_danny_fate`:

- `=== 'left'` → "Loose end, resolved."
- `=== 'protected'` → "Foster's survey methods: see attached. They match a document we hold."
- `=== 'exposed'` → "Foster named us in full. His survey is on record now."
- base (`=== '' `, `ko`, never played) → "D. Foster: no further action."

Clue/lore: Danny's fate (HaX's line by value, ink); on `left`, he is alive and hiding. Changed by `m03_danny_fate`, `m03_danny_ko`.

**`refit_ledger`** — name "Refit Ledger". `readable`. US (an accountant's).

- `globalVars.m02_paid_ransom` → "Refit costs, bunker. One receipt dated the day St. Catherine's paid. St. Catherine's money. It bought the blast door."
- base → "Refit costs, bunker. Paid in full."

Clue/lore: the ransom surfaced (row 17). Changed by `m02_paid_ransom`.

**`deck_controller`** — name "Tape Deck Controller". `readable` (the unit the Recruiter fired the wipe from). By `deck_pulled`:

- `=== 'none'` → "WIPE COMPLETE. Deck empty. Last operator: remote."
- `=== 'her_file'` → "WIPE COMPLETE — one reel pulled before erase. Deck otherwise empty."
- `=== 'alpha_tapes'` → "WIPE COMPLETE — one reel pulled before erase (series ALPHA). Deck otherwise empty."
- base → "Standby. One reel loaded."

Clue/lore: confirms which tape HaX saved. Changed by `deck_pulled` (set in the Recruiter's call).

### 1.7 The server closet

**`tape_side_console`** — name "Wipe Console". `readable`.

- `globalVars.tran_outcome !== 'left'` → "WIPE HALTED. Legacy recruitment interviews: partial."
- base → "WIPE IN PROGRESS. Legacy recruitment interviews."

Clue/lore: whether the tape side was saved. Changed by `tran_outcome` (talked/ko).

### 1.8 The tape room

**`shelf_code_legend`** — name "Shelf-Code Legend". `observations`, framed on the wall by the salvage keypad. US (the archive's own chart). The key to the salvage code (§2).

- base → "SHELF MARKS\nEach bay carries a number and a word. Access codes for a bay are keyed to its word.\nReading room — COTTONWOOD. Open stacks — MERIDIAN. Restricted — WATCHTOWER. Tape store — STANDBY. Salvage / decommissioned holdings — BONEYARD."

Clue/lore: supplies the Vigenère key `BONEYARD` for the salvage bay (where the player stands). The other bay words are chaff that read as an archive chart. Not changed. (Note: `BONEYARD` is not a code the player types and is not a lock input, so it is free text; it is listed here so stage 9 keeps the legend and the §2 key in sync.)

**`alpha_annotations`** — name "Annotation Sheets (series ALPHA)". `readable`, on `deck_pulled == 'alpha_tapes'` (else the deck/crate shows blank stock). The optional decode (§2.4).

- `globalVars.deck_pulled === 'alpha_tapes'` → "Typed sheets, stencilled ALPHA, his hand in the margin. One line, enciphered:\n\nClgyy ie nvurdtsf. Lpi pt hfga afetywacsz."
- base → "Blank label stock."

Clue/lore: decodes (Vigenère, key `ALPHA`) to "Carry it yourself. Let it hurt afterwards." — his first draft of the line. Changed by `deck_pulled`.

**`alpha_tape_deck`** — name "Reel Deck" — is an interactable that opens the Alpha-tapes clip (ink, S5 §3.9), not a readable with lore text; its spoken clip is stage 7's (two lines, F12). No fixed document string here beyond the deck's `observations`: "A reel-to-reel deck. One spool loaded." / on `deck_pulled !== 'alpha_tapes'`: "Empty spools. Degaussed."

### 1.9 The salvage cage

**`tomb_beta_rack`** — name "Tomb Beta Server". `observations`. Dressing with a line.

- base → "A rack server, still running, fans loud in the cold. A worn asset tag: TOMB BETA. It was left off the destruction schedule."

Clue/lore: the machine the finale turns on; the realisation it was left on purpose. Not changed (the credential that names its owner is a VM find, flag 3, not a readable here).

**`albion_folder`** — name "Albion Papers". `readable`, printed off the box; empty before flag 3. UK English (SAFETYNET and Tesseract, nine years ago). Three documents in one folder (P19).

- `globalVars.flag3_submitted` → "**Catalogue entry (2017).** Control-equipment flaw, Carrow Controls remote-management module. Runs at grid battery sites, water works and substations. Disposition: retain. Operational value. *(initialled by the board.)*\n\n**Memo, to the disposition board (2017).** We are holding a flaw in a Carrow controller because it may one day be useful to us. It will certainly one day be useful to someone else. I recommend notification to the vendor within thirty days. I have drafted the notice. I would rather send it than explain later why we didn't.\n\n**Notice (drafted, never sent).** To Carrow Controls. A coordinated-disclosure letter, ninety-day date, courteous. Signed, typed: Dr Adrian Tesseract, Chief Strategist."
- base → "Printer tray, empty."

Clue/lore: the flaw SAFETYNET catalogued nine years ago and never reported — one of the holes Critical Mass later came through at Albion; Tesseract's case, partly true, before he makes it. The **controller vendor is Carrow Controls** (9-8), kept apart from the player's own way into the m04 VM (which HaX called brand new): the catalogued flaw is an old auth-bypass in Carrow's remote-management module; the player's m04 route was a different, recent flaw. Sending the notice sends this drafted text unchanged, nine years late. Changed by flag 3; the send is `albion_notified` (HaX's hub / the debrief).

**`enrolment_binders`** — name "Tomb Beta Enrolment Binders". `readable`, in a picked crate (optional).

- base → "Enrolment records for Tomb Beta's workshop, annotated in the same hand as the recruitment file and the notebook margin. The hand that taught, enrolled and recruited."

Clue/lore: confirms the hand a third time (Beat 3.2). Not changed.

**`mirror_job_printout`** — name "Mirror Job — Configuration". `readable`, in the printer tray; empty before flag 4 (9-6; S5 §3.10). UK English, Tesseract's signed original. The flag-4 evidence document (numbers, per the 06 prompt).

- `globalVars.flag4_submitted` → "**Projected deaths attributable to the Publication, first thirty days.**\nRelease by key, all cities: 1,100 to 2,600.\nFallback by city: fewer, later.\nPrincipal causes: hospital systems (dispatch, infusion, records); grid control; water treatment.\nAssumes the cells move first. An acceptable price for the last arms race. -- A.\n\n**Release configuration.** Manual, at console. Single key. Requires an operator present. Fallback: 06:00, staged by city."
- base → "Printer tray, empty."

Clue/lore: the casualty sheet that prices the key (the "why build a key at all?" question), and the release mechanism (06:00 fallback, or everywhere by a hand on the key). His **original**; m10 holds the later printing with Asante's correction (FINALE_ARC §4.1). Read aloud by HaX in the flag-4 text scene. Changed by flag 4.

**`tape_room_keycard`** — name "Tape Room Key Card" (keycard, `opens_lock: tape_room_reader`). In `director_safe`. Inventory label only.

## 2. The salvage-code puzzle

Handover 9-1 and P20: one CyberChef operation, keyed by the tape room's framed `shelf_code_legend`, fitting Gary's "Read it like a shelf mark, not a number." The coded line is carried from flag 1 in the notepad; the legend on the wall beside the keypad supplies the key; the salvage cage keypad takes the decoded string.

**The banned-character rule (B2).** No code or coded line quoted in ink, ERB or JSON may contain `|`, `#`, `//`, `{`, `}`, `->`, `<-`, `<>`, `~`, `[`, `]`, `\`, `"`, `<%`, and none may begin with `*`, `-`, `+` or `=`. Password and keypad locks are case-sensitive (the engine compares `requires` to the typed string exactly; a case-mismatch hint is set on the lock), so each code's case is chosen and kept. Every string in this document is checked against that list.

### 2.1 The chosen operation

**Operation: Vigenère Decode** (CyberChef's exact name is `Vigenère Decode`). One operation, one argument (the key). It is a fair, teachable step: the student drops the coded token into the input, adds `Vigenère Decode`, and types the key the legend gives. No second operation is needed; Gary's and HaX's lines supply the one hint (which key, and that it is a keyed cipher, not a number).

Why Vigenère and not a Caesar/ROT: the legend supplies a **word** (a shelf-mark word), which is exactly a Vigenère key, and it lets the puzzle read as "the archive keyed its own salvage codes to the bay word" rather than a generic shift. It also keeps the Alpha-annotations decode (§2.3) in the same technique, so the mission teaches one tool twice.

### 2.2 The legend, the key, the coded string, the decoded code

**The key is `BONEYARD`**, read off the legend as the salvage bay's shelf-mark word. The legend (`shelf_code_legend`, §1.9) is the archive's shelf-code chart: each bay has a numeric series **and** a shelf-mark word, and archive access codes for a bay are keyed to that bay's word. The salvage/decommission bay — where the Tomb Alpha and Tomb Beta crates sit, stencilled ALPHA and BETA — is the one marked `BONEYARD` (archivists' slang for a decommission store; the legend spells it out). The player is standing in that bay, so the match is unambiguous. The coded line itself never contains the word `BONEYARD`, so the key genuinely comes from the legend.

**The coded line (identical everywhere, a fixed string):**

```
SALVAGE CAGE ACCESS MSJMQAEGDZNVI
```

Only the token `MSJMQAEGDZNVI` is ciphertext; `SALVAGE CAGE ACCESS` is the catalogue label that marks it as the salvage code and points at the right bay. The whole line is one string, carried as one notes item, shown on the drop terminal screen and quoted by HaX. It contains only letters and spaces: no banned character, and it does not begin with `*`, `-`, `+` or `=`.

**The decoded code (the keypad password, case-sensitive):**

```
LEWISANDCLARK
```

`Vigenère Decode` of `MSJMQAEGDZNVI` with key `BONEYARD` is `LEWISANDCLARK` (verified: standard Vigenère, CyberChef semantics, all uppercase in and out). Lewis and Clark County is where Sorensen was county clerk for twenty years — the certificate on her office wall (§1.6) is the planted callback, so the decode lands as "of course she keyed it to her county". The keypad on `salvage_cage` has `lockType: "password"`, `requires: "LEWISANDCLARK"`.

**The exact expected input:** `LEWISANDCLARK` — all uppercase, thirteen letters, no spaces. The lock is case-sensitive; a lowercase or spaced entry fails. The keypad carries a case-mismatch hint (engine: a hint shown on a near-miss), draft: "Capitals. No spaces. It reads like a shelf mark."

### 2.3 HaX's nudge, and Gary's

Both point at the same one operation and the same key, in the archive's terms, so the player never needs the VM or an exploit guide for the decode (it is game-side, `m09_archive_code_guide`, S4 §7.2).

- **HaX (hub topic 5, `salvage_keypad_seen and not salvage_opened`; S4 §7.1):** quotes the coded line as a fixed string, then: "That's an archive cipher, not a number. The chart on the wall beside you is the key — the word against this bay. Run the line through the workstation with it." On `gary_called`: "Gary told you how." (Her line is the fallback whenever Gary doesn't ring.)
- **Gary (`gary_phone`, on the first keypad attempt, `m02_gary_protected`; SE §2, S4 §6.6):** names the operation and points at the legend. Final wording for his third sample line (SE §2): "I audited a trust that ran that tape library. Their codes were in the shelf scheme. Read it like a shelf mark, not a number — the bay word's your key. Vigenère, on your workstation. The chart on your wall is the key."

So the nudge is: *the coded line needs CyberChef's Vigenère Decode; the key is the bay's shelf-mark word (`BONEYARD`), read off the framed legend; the result is the keypad code.*

### 2.4 The Alpha annotations decode (9-2, M9-22)

Optional, after the identity scene, on `deck_pulled == "alpha_tapes"` (`alpha_annotations`, §1.9). Same technique (`Vigenère Decode`), a different key so it reads as the tapes' own series key, not a reuse of the salvage key. **Key: `ALPHA`** (the Tomb Alpha series; the sheets are stencilled ALPHA, so the key is in front of the player, and no legend is needed — this one is a bonus, not a gated lock).

**Coded text on `alpha_annotations` (fixed string):**

```
Clgyy ie nvurdtsf. Lpi pt hfga afetywacsz.
```

**Decodes to:** `Carry it yourself. Let it hurt afterwards.` (verified: `Vigenère Decode`, key `ALPHA`, case and punctuation preserved). This is Tesseract's first draft of the line HaX gives every agent she runs (row 120; m10's "You told them to carry it"). HaX, after: "That's the version he taught us." The coded text is letters, spaces and full stops only: no banned character, no banned leading character. It is object text, not a lock input, so case need not be typed, but it is written mixed-case so the decode reproduces the sentence exactly.

## 3. Code values and ids

Handover 9-3 and 9-4. Every value is consistent across every object, lock, ink line and import that names it; where a value is a lock `requires`, it obeys §2's rule.

### 3.1 In-world present and the date anchors

The mission's present is day 11–13 after the Portland order; the in-world calendar year is **2026** (today's real date, and consistent with the shipped missions' recent setting). The "years" the documents carry are counted back from 2026:

| Phrase, where | Years | Year | Used on |
|---|---|---|---|
| "nine years ago" (the memo; the Albion flaw catalogued) | 9 | **2017** | the Albion catalogue entry and memo (§1.9); HaX's Albion lines |
| "eleven years" (WREN placed; Harwick & Lowe) | 11 | **2015** | the ledger (WREN's entry), the H&L placing sheet and bay label, HaX's lines |
| "seven years ago" (Tesseract left SAFETYNET) | 7 | **2019** | the credential (issued before he left), Netherton's and HaX's lines |
| "fifteen years ago" (Nightshade's intake; HaX's notebook) | 15 | **2011** | Nightshade's recruitment file, HaX's training notebook, the course code |

These are the only hard dates the player reads; they are kept apart from the safe PIN date (below) so no two "dates" collide.

### 3.2 Lock codes

| Code | Value | Format / length | Where it is, and where it is read | Lock |
|---|---|---|---|---|
| **Safe PIN** (Sorensen's floor safe) | `020616` | 6 digits, the lease's start date 02/06/2016 (2 June 2016; UK day-month order on the paper) | the long way: every page of `rent_book` is headed with the lease's start date; the fast way: Kowalczyk's cracker. Same date in `lease_file`'s deed. Nothing ties 2016 to the year anchors above. | `pin`, `requires: "020616"` (`director_safe`) |
| **Office door** (long password, written nowhere) | `clerk-of-the-county` | lowercase words joined by hyphens, not a banned leading char (`c`), no banned character | written nowhere in the world; HaX opens the door with `unlockDoor` on `deck_choice_made` (S4 §4 row 5). The player never types it; it exists only so the keypad can't be cracked (a `pin` would fall to the cracker; P11) | `password`, `requires: "clerk-of-the-county"` (`sorensen_office`) |
| **H&L file number** (`hl_box`) | `HL2015-0477` | letters, digits, one hyphen; no banned character; case-sensitive | on `drop_terminal_screen`'s ledger variant and in HaX's `ledger_read` (WREN's entry source `H&L`, this number); typed on the `hl_box` keypad in the open stacks | `password`, `requires: "HL2015-0477"` (`hl_box`) |
| **Salvage keypad** | `LEWISANDCLARK` | 13 uppercase letters (§2) | decoded from the coded line with the legend's key | `password`, `requires: "LEWISANDCLARK"` (`salvage_cage`) |

The staff door (`reading_staff_door`), the stacks outer door (`stacks_release`), the cage gate (`stacks_card`), the plan cabinet (`Margaret Sorensen` biometric) and the tape room (`tape_room_reader`) are RFID/biometric, not typed codes; their `requires` ids are S4/S5's and carry no secret string.

### 3.3 Named values

| Thing | Value | Where it is read, consistently |
|---|---|---|
| **WREN's ledger codename** | `WREN` | the ledger (flag 2) and `printed_ledger`; the H&L source code `H&L`; never a spoken name until the Recruiter says "Halina Kowalczyk" |
| **Noor's ledger codename** | `LINNET` | `printed_ledger`'s candidates page (the forty-seven, by codename); shown to Noor on "[Show her the page.]" (`printed_ledger_read`; SA Beat 1.2). Birds, like WREN; grep-clean |
| **The trolley list / Series R range** | `R-114` to `R-161` | `trolley_list`; `drop_terminal_screen`'s catalogue variant lists the same Series R marks; the H&L bay label is a different series | 
| **The notebook course code** | `STRAT-204` | the label on `notebook_scan` ("SAFETYNET Strategy, STRAT-204, 2011"); `onRead` sets `notebook_read`. 2011 = fifteen years, the intake HaX shared |
| **The H&L file number** | `HL2015-0477` | as §3.2 |

### 3.4 Item ids and object ids (checked against S4 §3 and S5 §3)

**Notes items the player collects or is given** (ids as S4 §3; stage 9 uses these in `targetItemIds` and `#give_item`):

`noor_staff_card` (keycard), `tape_room_keycard` (keycard), `nightshade_file` (notes), `the_reading` (notes), `the_reading_last_page` (notes), `master_schedule` (notes), `lease_file` (notes, takeable, the `find_the_deed` target), `catalogue_salvage_line` (notes, in HaX's `itemsHeld`, given by `#give_item:notes:catalogue_salvage_line`).

**The three bin files** (handover 9-4, M9-03): `derek_file`, `letters`, `nightshade_copy` — notes items, held in the `itemsHeld` of **both** `sorensen_hatch` and `sorensen_door`, each given by id, `cage_bin` written to the id of the one taken (S5 §3.6–3.7). Each is a notes item (goes to the notepad, not an inventory slot).

**Readables with no item id** (read in place, not collected; they are rewards for looking, and the engine resolves their `textVariants`): `rent_book`, `danny_sheet`, `refit_ledger`, `hl_placing_sheet` (`onRead` sets `sleeper_shortlist`), `printed_ledger`, `feed_table_box` (the legacy files; 9-4: a **readable**, not an item, so the credit reads "kept from the shredder", M9-19), `drop_terminal_screen`, `case_file`, `notebook_scan`, `incident_book`, `trolley_list`, `noor_desk_box`, `shelf_code_legend`, `alpha_annotations`, `albion_folder`, `mirror_job_printout`, `tape_side_console`, `tomb_beta_rack`, `enrolment_binders` (in a picked crate). `the_reading` and `master_schedule` are collected (safe contents) but also carry `onRead`/`onPickup` globals.

**`hl_placing_sheet`** is the contents of `hl_box` (the keypad container in the open stacks); it is a notes item read from the container, `onRead: { setVariable: { sleeper_shortlist: true } }` (S4, S5 §3.3).

All ids above match S4 §3's `targetItemIds` and S5 §3's object tables; §6 lists the one id the earlier docs left to stage 6 (the legacy-files readable's wording, now settled as `feed_table_box`, a readable).

## 4. The LORE arc: fragments and progressive revelation

m09 is a mission the player reads, so its readable objects (§1) **are** its LORE fragments: there is no separate collectible layer. This section maps them to the 06 prompt's frame — evidence of the plan with real numbers, progressive revelation across four threads, discovery tracked by globals, and payoffs to m01–m08. Nothing new is placed; this is the arc the §1 objects already form.

### 4.1 Evidence documents (the 06 prompt's "expose the evil", with numbers)

Three documents carry the plan in figures, discoverable through play and tracked:

1. **The casualty sheet** (`mirror_job_printout`, flag 4; tracked by `flag4_submitted`): 1,100–2,600 dead in the first month if the key is pressed, fewer and later on the fallback; causes named; "an acceptable price". The spreadsheet, in his hand.
2. **The Initiative's ledger** (flag 2; tracked by `flag2_submitted`, and `printed_ledger_read` for the page in hand): twenty-three placements, forty-seven candidates, eleven legacy placements — the scale of the infiltration, costed in Sorensen's columns ("cost / yield").
3. **The Reading** (`the_reading` / `_last_page`; tracked by `reading_found`, `reading_finished`): the villain's mind turned on the player — premeditation as a file, ending in a prediction that 0x00 will press the key.

A fourth, smaller: **Derek's file** (`derek_file`; tracked by `cage_bin`) prices one asset's fall before he was hired ("Expected loss of asset: total"). The debrief and HaX's Beat 2.7 read back what the player found and saved; stage 7 wires the acknowledgements (the arc already has HaX name the bin and the tape once, SA Beat 2.7).

### 4.2 Progressive revelation, four threads

Each thread deepens as the player goes, and each pays off a season-long question:

- **Tesseract's history** (the man behind "-- A."): the notebook margin (2011, a teacher's hand) → Nightshade's recruitment file (2011, the chief strategist recruiting at 23) → the Albion memo and notice (2017, the civil servant who was right and lost) → the credential (issued before he left, 2019) → the identity scene (the name) → the Alpha tapes/annotations (his teaching, his first draft of the line). The player assembles "chief strategist who worked to ENTROPY's ends for years, then left over a disagreement that was also cover" before Netherton says the name. **New canon (U1, confirmed):** he recruited Nightshade at 23 while still SAFETYNET's chief strategist — so he served ENTROPY's ends eight years before his departure; the disagreement was real **and** cover. Written into `nightshade_file` (§1.3) and the identity scene; added to `the_architect.md` (§6).
- **ENTROPY's origins / the Insider Threat Initiative**: the ledger and the legacy box show an infiltration programme eleven-plus years old, with its own front (Harwick & Lowe) and its own archivist (Sorensen). The "including the people" line from m07's Tomb Gamma dossier is made physical here — the Initiative's records sitting beside the Architect's own. ENTROPY's broad origin stays deliberately unanswered (canon rule); m09 reveals only the Initiative's shape, not ENTROPY's founding.
- **The Initiative itself**: the Recruiter's grievance (the Architect took WREN's tasking and is burning her office) and the codename system (names kept only on her tape, by codename) explain why her name is worth buying and why the whole programme hangs on one keeper. This is the m05 thread (the forty-seven, the twenty-three) joined to the m08 thread (the sleeper) in one ledger.
- **HaX's past**: the notebook is hers; the margin hand is her teacher's; the confession (she had the name the night Fraser and Ferreira died) is the fragment that costs her. The lore objects set it up; the identity scene pays it.

### 4.3 Payoffs to m01–m08 threads (where a fragment lands an earlier choice)

| Fragment | Pays off | Thread |
|---|---|---|
| `derek_file` | m01 `final_choice` (why Derek fell; the standing order; "the Architect planned for this") | m01 |
| `letters` (Villanueva) | m01 Social Fabric; the lever on Tran | m01, m09 |
| the Reading entry 2 | m01/m02 innocents hurt (`maya_ko`, `patient_assaulted`, …) | m01, m02 |
| `refit_ledger` | m02 `paid_ransom` ("it bought the blast door") | m02 |
| `printed_ledger` handler sheet | m02 Reeves' fate | m02 |
| `lease_file`, `danny_sheet` | m03 Victoria's fate, Danny's fate | m03 |
| the Reading entry 3; `albion_folder` | m04 `disclosure_choice` (the choice lands twice — his reading, then SAFETYNET's own silence) | m04 |
| `feed_table_box`, `hl_placing_sheet`, `noor_desk_box`, the Recruiter | m05 the forty-seven, the twenty-three, Noor, Torres | m05 |
| `case_file` tagged payments; `rent_book` | m06 monitoring, Irina's account | m06 |
| the Reading entry 4; the two names on the wall | m07 `debrief_stance`, the dead agents | m07 |
| `nightshade_file`, `nightshade_copy` | m08 Nightshade (the recruitment, what he cleared) | m08 |

### 4.4 Discovery tracking (globals the fragments set, for debrief/export)

`reading_found`, `reading_finished` (the Reading), `schedule_read` (the master schedule → the flag-4 realisation), `notebook_read` (the hand), `nightshade_file_held`, `printed_ledger_read`, `sleeper_shortlist` (the H&L sheet), `cage_bin` (which bin), `legacy_files_saved`, `deck_pulled` (which tape), `flag2_submitted`/`flag4_submitted` (the ledger and the sheet). These already exist (S4 §5); the fragments set them on read/pickup, and the debrief and m10 read them. No new global is needed for the lore layer.

### 4.5 The cracker canon note (B1), and what m09 carries

FINALE_ARC B1 (and SA §3.4) asked where the cracker canon note goes. m09 carries **no object** for it: the only cracker facts in m09 are spoken at the briefing (stores quarantined every cracker Nightshade signed for; Kowalczyk's is her own, "never been through stores, never been near him"), and m09 claims nothing about where the bench made it. The full canon note (quarantined crackers from Tomb Gamma's bench; the cloner logged "to WREN"; Kowalczyk's bench-made casing) belongs to **m10's Citadel incident file** (handover 10-3). **m09 drops the incident-file note**; it is flagged for m10 S6 in §6. This matches the orchestrator ruling that the cracker canon is m10's (FINALE_ARC §9, stages 1–2).

### 4.6 The Alpha lecture (9-9, MS-20)

**Settled: the same lecture.** Tesseract gave the same lecture on SAFETYNET's strategy course (STRAT-204, which HaX took in 2011) and at Tomb Alpha's workshop. That is why HaX recognises the Alpha tape ("He gave that lecture every year.") and why the Alpha material pays off in m10. The notebook margin, the Alpha tapes and the Alpha annotations are three records of one lecture, nine-to-fifteen years apart. No contradiction with canon: the course and the workshop taught the same thing because he taught the same thing everywhere (the voice bible's "every word carefully considered", repeated). Written into `the_architect.md`'s identity section (§6).

## 5. The called guard

Handover 9-7 (P14): the second guard Tran calls in on the `m01_maya_ko` branch, when he sees the player first at the server closet. Varied against the rest of the cast; sprite comes at the character stage (FINALE_ARC item 47).

**Lyle Dillard.** 54, white Montanan, from a rival contract-security firm (not the archive's own staff — Tran rings an agency, not the night desk). Ex-sheriff's deputy, heavy, slow, bored, in it for the overtime; nothing political, no secret. Chosen to differ from Old Coyote (24, Apsáalooke, a lineman-in-training with his sister on the phone) and Tran (29, Vietnamese-American, an ironic online IT contractor) in age, ethnicity and manner. **Grep:** "Dillard" and "Lyle" have no hits in `scenarios/`, `story_design/`, `planning_notes/` or `docs/` (checked 2026-10-21); no clash.

- **Role:** on `m01_maya_ko` only, shown by the shutter when Tran sees the player first (`tran_alerted`; S5 §3.3). One line, then hostile. Avoidable (a patrol like any other). No arc, no lore object.
- **Speaker prefix (for stage 7):** NPC id `archive_guard`, `displayName: "Lyle Dillard"`. His one line: "Dillard, Statewide Security. Stay where you are." (then `#hostile:archive_guard`).
- He is the cost of day one (m01) arriving eight missions late; he carries no document and sets only `archive_guard`'s KO global, if the player drops him.

## 6. Proposed changes for earlier docs and FINALE_ARC

Not made here (this stage edits only its own document). Each is a value or a name this stage fixed that an earlier doc left open or should now cite. None changes a choice, a cost or a lock.

**For FINALE_ARC:**
- **§13 handover 9-1 to 9-9: mark settled** with this doc's answers: encoding = `Vigenère Decode`, key `BONEYARD` (from the legend), coded line `SALVAGE CAGE ACCESS MSJMQAEGDZNVI`, decoded keypad input `LEWISANDCLARK` (case-sensitive); Alpha annotations = `Vigenère Decode`, key `ALPHA`, ciphertext `Clgyy ie nvurdtsf. Lpi pt hfga afetywacsz.` → "Carry it yourself. Let it hurt afterwards."; safe PIN `020616`; office password `clerk-of-the-county` (written nowhere); H&L file number `HL2015-0477`; Noor's codename `LINNET`; course code `STRAT-204`; Series R `R-114`–`R-161`; called guard **Lyle Dillard**; controller vendor **Carrow Controls**; Alpha lecture = the same at Tomb Alpha and on the SAFETYNET course.
- **B1 (cracker note):** record that **m09 drops** the Citadel-incident-file cracker note (no m09 object carries it); it is **m10 S6's** (handover 10-3). m10 S6 should cross-check Kowalczyk's "never been through stores, never been near him" against the bench canon it writes.
- **U1 (new canon):** confirm written in (brief says user-confirmed): Tesseract recruited Nightshade at 23 while still SAFETYNET's chief strategist; the departure seven years ago was real and also cover. m09 carries it in `nightshade_file` and the identity scene; the canon file is updated (below).
- **Cast list (§5.2, §8 r16):** add the called guard's name, **Lyle Dillard** (was "name to come"), and the controller vendor **Carrow Controls** to the finale name register.

**For `story_design/universe_bible/04_characters/entropy/masterminds/the_architect.md` (identity section):** add the U1 canon sentence — he recruited Nightshade at 23 as chief strategist, working to ENTROPY's ends ~eight years before he "walked out", the disagreement real and also cover — and the §4.6 note that the Tomb Alpha workshop lecture and the SAFETYNET strategy course (STRAT-204) were the same lecture, which is how HaX recognises the Alpha tape. (The canon file already has the Nightshade-at-23 line in `insider_threat_initiative.md`, 2026-10-21; this aligns the Architect file to it. The edit is the orchestrator's / a later pass's, per the brief's "don't edit other files".)

**For this mission's earlier stage docs (for the arc-keeper's next fold, not edited here):**
- **SE §5.3 and SA:** the legacy files are a **readable** (`feed_table_box`), not a collected item, so "picked up" wording is wrong; the credit reads "kept from the shredder" (already M9-19; confirm the object is a readable with `textVariants`, not an `itemsHeld` entry).
- **SE §5.2 / SA Beat 3.4:** name the controller vendor **Carrow Controls** in the Albion memo/notice (was unnamed), kept apart from the player's own m04 VM route.
- **S5 §3.9 / SE §5.3:** the shelf-code legend's full chart text (§1.8) and the confirmation that the key word `BONEYARD` is on the legend but **not** in the coded line.
- **SA §3.4 / stage 0:** the cracker incident-file note is dropped from m09 (see B1).
- **Stage 7 inputs:** Gary's finalized hint line (§2.3), HaX's hub-topic-5 nudge (§2.3), the called guard's prefix and line (§5), and the keypad case-mismatch hint (§2.2) are ready to drop into the ink.

**Open for the user (nothing blocking):** none specific to stage 6. The year anchor (present = 2026) and the lease date `020616` are choices this stage made to satisfy the "nine / eleven / seven / fifteen years" set without collision; if the season's canonical present year differs, the four anchor years and the PIN date shift together, and nothing else changes.
