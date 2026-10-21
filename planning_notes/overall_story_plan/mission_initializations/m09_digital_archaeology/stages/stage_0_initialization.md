# Scenario initialisation: m09 Digital Archaeology

Stage 0. Author: stage-0 author (Opus), 2026-10-20. Status: round 1–4 findings folded in (FINALE_ARC §10–12, §14); stage 1 handover in FINALE_ARC §13; stage 0 complete. Stages 1–2 changes swept in by the arc-keeper, 2026-10-21 (FINALE_ARC §15; `stage_1/story_arc.md` §13 "Stage 0 fixes" and §14 change 27). Stage 3 (`stage_3/moral_choices.md` §11 change 24, and its sweep) folded in, 2026-10-21. Stages 0–3 milestone fixes applied 2026-10-21 (listed in `stage_1/story_arc.md` §20). Where this file and the stage 1–3 documents still differ, those documents win (stage 3 newest).

Shared design for both finale missions: `../../finale/FINALE_ARC.md` (premise §1, threads §2, imports §3, cast §5, flags §6, risks §8). This file does not repeat it.

## 1. Overview

- **Title:** *Digital Archaeology* (kept). The old outline's name still fits: the player digs through decommissioned records, paper and tape and servers, to find a man. Keeping it also keeps the folder id, so nothing is renamed. Alternatives: *The Reading* (the Architect's file on the player), *Paper Trail*.
- **Target tier:** 3.
- **Estimated duration:** long, about 85 minutes with the field guides, 95–100 without (the old outline's 70–90; m08 ships at 70); stage 8's playtests set the published figure.
- **Primary CyBOK areas:** Forensics (recovering and reading records across paper, tape and servers, against a purge); Human Factors (insider placement and recruitment); Authentication, Authorisation and Accountability (a staff credential nobody revoked); Law and Regulation (a flaw kept instead of reported).
- **ENTROPY cell:** Insider Threat Initiative, on the Architect's own ground (§3).
- **Mission type:** investigation and infiltration, at night, against a purge.
- **Place in the season:** day 11, Helena, Montana. The leave is cut short when SAFETYNET reads Tesseract's order, "Burn Helena before the Publication. Schedule attached. -- A.", and lets it go on so as not to tip him. The night is the local night of day 11, early day 12 UTC. FINALE_ARC §1.3–1.5.
- **What it owes the player:** the name said aloud and proved; the ledger, which says one of the raid team is a plant; the bunker's defences; the Publication's hour; and the first proof that Tesseract's case against SAFETYNET is partly true.

## 2. Technical challenges

### 2.1 VM flags (story meaning only)

Four flags, all required, on two separate machines: the archive's catalogue server (flags 1–2) and the old Tomb Beta server (flags 3–4). Full meanings and unlocks: FINALE_ARC §6.1. The VM plan is written separately.

1. A foothold on the archive's catalogue server: the index, restricted series included.
2. The Insider Threat Initiative's live ledger: the twenty-three placements, the forty-seven candidates, and a legacy section in which WREN's entry, updated on day 10, puts her on Task Force Null's raid team.
3. The owner of Tomb Beta's server: Tomb Beta ran its enrolment under a web service account, and the credential text beside the flag is a SAFETYNET staff credential issued to Dr Adrian Tesseract before he left, never revoked. The same files hold his memo from nine years ago about the Albion flaw SAFETYNET kept, and his unsent vendor notice.
4. Full control of that server: the mirror job to Tomb Gamma, with what the Publication is and its two modes (city by city from 06:00 UTC; everywhere in the same minute by a key that needs a hand), the 04:00 head start, the list of defences, and his original casualty sheet pricing the key.

Flags 1–2 are submitted at the drop terminal in the reading room. Flags 3–4 are submitted in the tape room beside Tomb Beta's server, whose station is the only one that accepts that machine; the identity scene plays there, by phone, with HaX and Netherton (stage 1 §14 changes 12, 22). HaX says after each what it bought in story terms. The purge never destroys what a flag yields.

### 2.2 In-game challenges

Every type the player has used in m01–m08 is available. The PIN cracker is issued to the player for the first time since St. Catherine's (where they may have picked one up).

| Challenge | Where and why | Builds on |
|---|---|---|
| **PIN cracker (issued)** | Halina Kowalczyk hands over her own at the briefing ("This one's mine. Never been through stores, never been near him."; "The long way is over," HaX). Stores have quarantined every cracker Nightshade signed for since m08. Opens Sorensen's office safe, which holds the Reading, the master destruction schedule and the tape room's key card. The PIN can also be found the long way (her desk). Nothing in m09 ties the cracker to WREN. | m02 (optional pick-up), m02–m08 safes; m08's "I chose what you went in without" |
| **The purge (the night's clock)** | Sorensen shreds and degausses in the restricted cage; Jesse Tran runs a tape wipe from the server closet. It moves on story events in one order (flag 1, the cage, flag 2, the Recruiter's call once flag 2 is in and the cage is open, the tape deck), never on minutes, so VM speed costs nothing. Two forced save-one choices, with HaX naming what is in each and what it buys: at the cage, Derek's file or Nightshade's copy (default: the Initiative's letters to Social Fabric), and the other is gone when the cage opens; inside the Recruiter's call, the deck: her price for WREN's name is the whole deck, so a deal wipes it all; a refusal or a hang-up lets HaX save one tape on the player's word, her file or Tomb Alpha's tapes (his recorded teaching), and the other is wiped (`deck_pulled`). Sorensen's office opens on the deck choice. Once the cage is open, the last box of the night (the Initiative's legacy placement files outside SAFETYNET) is on her shredder's feed table; only knocking her out before the player opens the plan chest or first leaves the cage saves it, and talk (with Nightshade's file as the lever) stops her without saving it. Stopping Tran saves the rest of the tape side, never the deck. Nothing required is ever lost (FINALE_ARC §6.1). | m07's clock |
| Lockpicking | Archive doors, plan chests, the salvage cage holding Tomb Alpha's and Tomb Beta's kit. | m01 on |
| Patrolling guard | Cody Old Coyote on his rounds; Jesse Tran's call-in adds a second guard (avoidable). | m02 on |
| RFID cloning | Sorensen's stacks card (the cage and the shredder line; her office is on its own keypad), cloned from the reel at her hip while she talks at the hatch (the m08 technique), or Noor's card for the open stacks' side door if she helps. | m03, m08 |
| Fingerprint kit | The restricted cage's reader takes Sorensen's print, lifted off the stamp she leaves at the hatch. | m04, m08 |
| Social engineering | Noor (help, a warning, or telling her what the bonus was, which makes her a witness who can't ring her father), Old Coyote (talk past, or tell him the truth), Sorensen (bluff as an auditor until she ends it herself by quoting the player's file from memory; once the cage is open, talked down with Nightshade's file), Tran (talked off the wipe with the Social Fabric letters, at the price of letting him walk), Gary on the phone if protected (he gives the tape room's decode hint at its keypad). | m01 on |
| Encoding (CyberChef workstation) | The tape room's code is written into the catalogue in an old archive encoding (clue from flag 1). Tomb Alpha's annotations, in the Architect's hand, decode to the line HaX recognises (optional, if the tapes are saved from the purge). | m01 on |
| Document correlation | The handwriting on Nightshade's recruitment file against the margin notes in HaX's own training notebook (in her case file on the drop terminal), with Derek's costing page as a second sample if saved, confirmed by Tomb Beta's enrolment binders in the salvage cage: one hand. With flag 3 this is the proof. Optional: WREN's ledger entry ("H&L", a file number) against Harwick & Lowe's placing sheet in the open stacks, which narrows WREN to two (`sleeper_shortlist`); only the Recruiter names her. | m03 directive, m08 door audit |
| The kept flaw, and coordinated disclosure done once | The catalogue entry for one of the holes Critical Mass later came through at Albion (the plant's control equipment), marked "retain: operational value" nine years ago; Tesseract's memo from the same year arguing it should go to the vendor; and the vendor notice he drafted and never sent. On the critical path (flag 3's files). The flaw is in the vendor's controller, which also runs in water works and substations: about four hundred sites, still open, where SAFETYNET's watch on Critical Mass runs. The player may send the notice from the drop terminal (optional, `albion_notified`); if it is unsent at the debrief, Netherton hands the decision to the player, so everyone decides. Sending starts the realistic clock (the vendor acknowledges tonight, about ninety days to a fix, a year to roll out) and SAFETYNET pulls the watch; on m04 `full` or `m04_crew_lost` it also puts SAFETYNET's nine years in front of Albion's inquiry. He answers it in m10. At flag 4, HaX says once what separates this from the Publication: real full disclosure is one researcher publishing one flaw after the vendor stops answering, his notice is the coordinated kind (vendor first), and the Publication is every weapon released at once (milestone D-02). | m04 disclosure choice |
| Combat (light) | Tran's called-in guard; Sorensen if pushed. Every NPC knock-out leaves the mission finishable. | m01 on |
| **Choices for every player** | The Recruiter's offer, after flag 2 and the cage: WREN's name now (always right), and the price is the deck: taking it means the whole deck is wiped (her file, a tape holding her handler list, gated by m05's outcome, with the SAFETYNET placements on it by codename only, and Tomb Alpha's tapes), and leaves an invoice in the Initiative's books; refusing lets HaX save her file or the Alpha tapes; a double-cross (pulling her file after the name), priced aloud first, rolls up about half her network and voids the name (she warns WREN, who walks off the apron at Helena). The cage choice (Derek's file against the letters, or Nightshade's copy). HaX's confession, with the player's answer (m06 name not found: "You should have told me." / "I'd have done the same in your place."; m06 name found: "You should have taken it to Netherton." / "I'd have sat on it too."; on every form, "Afterwards. Not during."). The stance on Tesseract's memo at the debrief, then the vendor notice if still unsent. On some branches also: own the m05 deal, deny it, or hang up; send Nightshade his file or keep it. | m05, m08 |

### 2.3 Hybrid workflow

Briefing cutscene in Task Force Null's room (the order SAFETYNET read and let go on, the wall of cards, the suspect without the name, the raid team, the cracker) → archive by the loading dock → drop terminal in the reading room → **flag 1** gives the shelf marks and opens the restricted stacks; the purge has been running since before the player arrived → the restricted cage (Sorensen at the shredder behind the mesh, reachable only by talk at the hatch: save one bin through the hatch; opening the cage with print and card, or Victoria's maintenance code, takes the other) → Nightshade's file in a locked plan chest at the back of the cage; the hand matched against HaX's notebook → **flag 2** at the drop terminal: the ledger; WREN is on the raid team; the printed ledger at the shelf optional (shredded once read if Sorensen is free); optional cross-reference at the Harwick & Lowe boxes, narrowing WREN to two (Torres rings in there on that branch) → the Recruiter rings with her offer once the player is out of the opened cage; she fires the deck wipe herself, and on a refusal or hang-up HaX saves one tape inside the call (a deal wipes it all) → HaX rings: "Afterwards. Not during." → server closet (optional: stop Tran, saving the rest of the tape side, never the deck) → Sorensen's office, which opens on the deck choice: safe (PIN cracker): the Reading, the master destruction schedule, the tape room's key card; the lease and refit files → tape room (code from the catalogue, decoded with Gary's hint or the long way) and the salvage cage → Tomb Beta's server → **flag 3** in the tape room: identity scene by phone, Netherton says the name from the aircraft, HaX's confession and the player's answer; the Albion papers; optionally send the vendor notice → **flag 4** in the tape room: the hour, the key, the defences and his casualty sheet; the server left off the schedule on purpose → Tesseract rings HaX → debrief in a hangar at Helena's airfield: Netherton asks the memo stance, hands the player the notice if it is unsent, reads the two names, signs the Montana order, and says why the team goes in together.

## 3. ENTROPY cell

### Selected cell: Insider Threat Initiative, with the Architect's papers

**Why this cell.** The Helena archive is the Initiative's records office: placements, recruitment files, the people Tomb Gamma "fielded first". It closes m05's forty-seven and m08's "there may be others" in one room, and the cell's speciality (internal compromise, access that was never taken back) is what the player is investigating and what flag 3 turns out to be.

**Cell leader involvement:** minor but pointed. The Recruiter rings once, phone only, and makes every player an offer: WREN's name for her own file (FINALE_ARC rows 60–61). She sells because the Architect has taken WREN's tasking for Montana and is burning her records office. Sorensen is the cell's keeper on site, carrying out the purge.

**Mastermind involvement:** major, at a distance. The Architect is everywhere in the paper (Derek's file, Nightshade's file, the Reading, Tomb Alpha's annotations, his casualty sheet) and rings HaX once, at the end; the player hears only her side.

**Cell philosophy in play.** People as records: every placement costed, every recruit's life a line item. Nightshade's file shows it from the inside; the Reading turns it on the player.

**Previous operations.** m05 (TalentStack, Torres), m08 (Nightshade, fifteen years in place), and WREN, placed in SAFETYNET eleven years ago through Harwick & Lowe, an older front nobody had tied to the Initiative before tonight, and assigned to Task Force Null's Montana operation on day 10.

**Inter-cell connections.** Social Fabric's agent on the staff (Jesse Tran, m01's lost intelligence); Zero Day's front company on the lease (m03); the Crypto Anarchists' account that pays it (m06, Irina); ENTROPY's money in the refit ledger (St. Catherine's ransom, where it was paid). Every earlier cell has a paper trail into this building.

## 4. Theme options

The premise is fixed by FINALE_ARC §1.3; the options differ in setting, cover and feel.

### Option 1: The Records Office (night)

**Logline.** On the night the leave is cut short, the player breaks into a Helena records archive where the Insider Threat Initiative files its people and the Architect filed his own past, to prove his name before he publishes every weakness SAFETYNET ever catalogued.

**Setting.** Mountain States Records & Retention, a commercial archive in a converted grain warehouse on the edge of Helena: open stacks, a restricted cage, a tape room, a salvage cage, a reading room. Cover: secure storage for law firms and county offices. ENTROPY's interest: deeds nobody reads and staff nobody checks. Atmosphere: dust, sodium light, a building full of other people's secrets, including the player's own file.

**Inciting incident.** SAFETYNET reads Tesseract's order to burn Helena before the Publication and lets it go on so as not to tip him. The courier label names the archive's company; how the courier was caught is one reason by branch (the Calder Wharf courier account, else the HashChain tags, else Nightshade's one-way ticket to Helena). The other confirmations come later, where they help: Victoria's keys at the lease file, Torres' address line on his call, Kemal at the casualty sheet. Task Force Null wants the bunker's construction file before it goes in, and whatever Helena holds before it is ash.

**Stakes.** Personal: the player's own file, and a plant on the team they will go into the bunker with, whom they met at the briefing. Organisational: SAFETYNET's former chief strategist, a flaw SAFETYNET kept that cost Albion, and its own map of weaknesses about to be released. Societal: 1,100–2,600 projected dead in the Publication's first month if the key is pressed, fewer and later by the city-by-city fallback (his own sheet, found tonight). Urgency: the purge is running now, and the hour is somewhere on these servers.

**Central conflict.** Archaeology against a fire: the evidence is old and scattered, and someone is destroying it while the player reads.

**Arc.** Act 1: get in, set up the drop terminal, find the restricted series while the shredder runs. Act 2: the cage, Nightshade's file, the ledger and WREN, the Recruiter's offer and the deck wipe. Act 3: Sorensen's office and the Reading, Tomb Beta's server, the name, the kept flaw, the hour and the key, his call to HaX.

**Key NPCs.** Sorensen, Noor Haddad, Jesse Tran, Cody Old Coyote; HaX and Netherton; the raid team in the briefing (Quintero, Kowalczyk, Malhotra, Arakawa), and Kowalczyk again at the hangar debrief; phone voices (the Recruiter for everyone; Nightshade, Torres and Gary by branch). One non-HaX voice per scene during play; cutscenes exempt.

**Tone.** Dread, paranoid, intimate, with the shredder always audible. The player reads more than they fight, and chooses what to save.

**Hybrid integration.** As §2.3: the VM is two machines, the catalogue server and Tomb Beta's server; each flag opens a shelf, a ledger, a name, an hour, and each pushes the purge on.

**Lore.** Tomb Alpha and Tomb Beta, through their files and salvaged kit; the Architect before ENTROPY; the Initiative's method.

### Option 2: The Audit (day)

**Logline.** The player walks into the same archive in daylight as a SAFETYNET-arranged auditor, and has one business day to find what they need under the staff's eyes.

**Setting.** As Option 1, open for business: staff at desks, visitors in the reading room.

**Differences.** Social engineering carries most of the mission; fewer locks, more bluffing; the reveal happens in a building full of people. Sorensen is the auditee, polite and stalling.

**Why not.** Tension from discovery is less than tension from the clock; it plays too like m05 (an office, a shift, an insider); and a day mission breaks §1.5's night operation.

### Option 3: The Salvage (two sites)

**Logline.** The player visits Tomb Beta's decommissioned shell outside Helena, then the archive, following the Architect's kit from one to the other.

**Differences.** Closer to the old outline's two abandoned bases; more "archaeology" in the literal sense.

**Why not.** Two maps for one mission (FINALE_ARC §1.4 dropped this for cost); the bunker-shaped location would also steal m10's set piece.

## 5. Recommendation

**Option 1, The Records Office (night), under a purge.** It keeps the clock m08 gave the player, adds one inside the mission, uses one map, and lets the evidence do the work: the player discovers the Architect's name, his casualty sheet and his reading of them in documents, as the stakes rules ask, rather than being told. A night building with a small staff gives room to evade a guard and to talk to three people properly. Take one thing from Option 2: Sorensen is in late, behind the cage mesh, and the player can bluff her through it as an auditor sent by the lease-holder until her own records show the bluff.

## 6. Initialisation summary

**Scenario:** m09 *Digital Archaeology*. Tier 3, about 85 minutes with the field guides (95–100 without). Insider Threat Initiative, with the Architect's papers. Investigation and infiltration at night, against a purge (§1).

### Technical challenges summary

1. **Catalogue foothold (VM flag 1)**: find what the public index hides.
2. **The ledger (VM flag 2)**: read the Initiative's placements, learn that WREN is on the raid team, and optionally match the codename to a SAFETYNET record.
3. **The credential nobody revoked (VM flag 3) and the handwriting**: prove who the Architect is from two directions, find the flaw SAFETYNET kept, and choose whether to send the vendor notice he never sent (coordinated disclosure, done once).
4. **Tomb Beta's server (VM flag 4)**: the Publication's hour and its key, his casualty sheet, and Tomb Gamma's defences.
5. **Physical access with the full kit, against a purge**: picks, cloner, print kit, and the PIN cracker issued for the first time since St. Catherine's, while the purge moves on with each story beat.

### Recommended theme

Option 1, The Records Office (night), under a purge, with Option 2's auditor bluff for Sorensen (§5). Alternatives: The Audit (day), The Salvage (two sites).

### Next steps

- Stage 1–2 (narrative and storytelling; done, `stage_1/story_arc.md`, `stage_2/storytelling_elements.md`): the briefing's "previously on" with never-played cards and the suspect beat without the name; the identity scene in its forms (rows 70, 98, 125); the Reading's four entries and last page; the Recruiter's call; Tesseract's call to HaX. A reviewer reads the default path with no other mission in mind.
- Stage 3 (moral choices; done, `stage_3/moral_choices.md`): fourteen choices, five of them forced for every player (the cage bin, the Recruiter's offer and the deck, the confession answer, the notice, the memo stance). The Recruiter's price is the whole deck; the double-cross voids the name; the notice is asked at the debrief if unsent; talk stops Sorensen with Nightshade's file; the Alpha tapes play one voiced clip (F12); new exports `cage_bin` and `legacy_files_saved`.
- Stage 4 (objectives): the aims below; the purge's event triggers.
- Stage 5 (rooms): loading dock, front desk, reading room, open stacks, restricted cage, salvage cage, Sorensen's office, tape room, server closet. The briefing is a cutscene, not a room.
- The VM plan (`../../finale/FINALE_VM_PLAN.md`) fits the modules to §2.1.

### Design notes (m01/m02 standard, `mission-alignment-plan`)

- **Opening and closing.** Briefing cutscene in Task Force Null's room with `skipIfGlobal`: the purge order, read and let go on; the wall of earlier missions as the "previously on" (row 57), with the suspect beat and no name; the dispatch count (rows 81–85); the raid team, with Kowalczyk handing over the PIN cracker. Closing debrief: a cutscene in a hangar at Helena's airfield, where Task Force Null's aircraft has landed; Kowalczyk asks after her cracker; Netherton gives the hour, takes the player's stance on the memo, reads the two dead agents' names, signs the Montana order, and tells the player the raid team goes in together ("They come. You watch them."); `bond_visualiser` conclusion.
- **Aims, staged and spoiler-safe.** 1 Get in and set up the drop terminal. 2 Find the restricted series before it burns (flag 1, the cage). 3 Read the Initiative's ledger (flag 2; optional: identify WREN). 4 Search the director's office (the safe, the Reading, the files). 5 Take Tomb Beta's server (flags 3–4). Optional: stop Sorensen; stop the tape wipe; send the vendor notice. `missionConclusion`: report to Netherton. `concludeRequires`: the four flags only.
- **HaX's hub, progress-gated.** Topics open on progress globals: Tran (a warning before the player meets him with `m01_completed and not m01_maya_ko`, a neutral one on a cold start); the restricted series after flag 1; WREN and the cross-reference nudge after flag 2; the Recruiter's file before the player answers her (what taking the offer would cost); the Recruiter after her call; "what the line means" (three words and one sentence after the deck, and in her hub once for a player who closed the call early); the name after flag 3 (row 70's forms); what is in each bin at each purge choice (and what the legacy box on Sorensen's feed table is, and when it goes), and what the purge has cost, once. Field-guide offers gated `_guide_offered` / `_hint_given` per VM stage.
- **Music.** Cutscene for the briefing; a tense investigation track with the shredder under it; threat on any hostile; a held cue for the identity scene; the Tesseract call under near-silence (ask the user before adding a track), then the closing track on the pen.
- **Forced phone scenes.** The Recruiter's call, the identity scene, flag 4's read and Tesseract's call follow one rule: defaults on the first line, a done-flag on the last choice or line, re-ring and resume if closed early (FINALE_ARC §6.1).
- **KO resilience.** Sorensen, Noor, Tran and Old Coyote can all be knocked out; a downed Sorensen stops what is left of the shredding and a downed Tran stops the rest of the tape side (never the deck, which the Recruiter wipes); Sorensen's card drops when she is down and her print stays on her stamp, and Noor's help always has the default route beside it. A knocked-out Noor (`noor_ko`) leaves any box she held back on her desk, so `legacy_files_saved` is unchanged, and gets one debrief line (milestone M-02).
- **Carry-overs.** All imports and their uses: FINALE_ARC §3.1. m09's exports: §3.4. No import gates completion.
- **Spoken lines.** The Reading is object text in the narrator's voice or unvoiced; every branch line is a fixed string, never a printed variable. Tesseract is never heard live in m09; on the Alpha-tapes route one voiced clip of his old lecture plays at the tape room's station (F12).

## 7. Quality checklist

Checked against the 00 prompt's list and the alignment rubric. Ticks are the author's claim; reviewers verify.

**Technical challenges**
- [x] Each challenge maps to a CyBOK area (§1).
- [x] Tier 3 fits: four VM stages and every kit type.
- [x] Clear learning aims per challenge (§6 summary).
- [x] Implementable with existing mechanics; the PIN cracker already exists in the engine, and the purge is visibility changes on optional objects driven by global-variable events (stage 4 checks the engine can do this).
- [x] Real concepts: unrevoked credentials, record correlation, insider placement.
- [x] Challenges build on each other (§2.3).

**ENTROPY cell**
- [x] Capabilities and philosophy fit (§3).
- [x] Adds to running threads: m05's forty-seven, m08's other sleepers.

**Theme**
- [x] Challenges feel necessary: each flag and lock opens a piece of the proof.
- [x] Stakes are specific: 1,100–2,600 if the key is pressed, his own figure; a sleeper on the team; the player's own file.
- [x] True-believer villains with a spreadsheet (Sorensen, the Architect).
- [x] Evidence discovered in play, not told.
- [x] Player choices that matter in m10 (FINALE_ARC §3.4, eleven exports since stage 3), and mid-mission choices for every player (the cage, the Recruiter's offer and the deck, the answer to HaX, the memo stance, the notice). Each is forced by an event or a lock (the office opens on the deck choice; flag 4's read waits on the answer), so stopping Sorensen or Tran first can't skip it.
- [x] A clock inside the mission (the purge) that runs on story events in one order, costs optional finds only, and is visible.
- [x] A cold start works: the wall of cards is the "previously on".

**Hybrid architecture**
- [x] One VM scenario with two target machines (the catalogue server and Tomb Beta's server); meanings in FINALE_ARC §6.1.
- [x] Flags have story meaning and a submission point.
- [x] Objectives track flags and in-game finds together.
- [x] In-game work points at the VM (the catalogue clue, the ledger cross-reference) and back.
- [x] VM challenges complement rather than duplicate in-game ones: the VM reads the servers (index, ledger, credential, mirror job); the in-game work is paper, locks and people, and the two meet in correlation (the handwriting against the credential).
- [x] ERB narrative content needs no VM changes: the flags' meanings are fixed in FINALE_ARC §6.1, and every story variant lives in the ERB and ink.
- [ ] In-game challenges teach skills the VM needs (or the reverse): partly. The catalogue encoding and the record correlation point at the VM work without teaching it. Owner: stage 4, with the lab sheet.
- [ ] Flexible learning paths (labs done separately): open. Owner: the lab-sheet stage (the VM-steps companion sheet).
- [x] Scope achievable in about 85 minutes with the field guides (95–100 without): nine rooms, four flags, two forced purge choices and a forced confession answer; m08 ships at 70 with a lighter load.

**Alignment rubric (m01/m02)**
- [x] Canon and stakes; staged aims; HaX's progress-gated hub; music; KO resilience; bookends and `bond_visualiser` (§6 design notes).
- [ ] Rooms and layout: stage 5.
- [ ] Field guides mapped to real lab sheets: after the VM plan.

**Finale rules**
- [x] No eldritch content.
- [x] No import in `concludeRequires` or an `unlockCondition`.
- [x] Every import has a default that plays as a whole story.
- [x] Violence at TV level.
