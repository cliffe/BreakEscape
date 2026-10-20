# Scenario initialisation: m09 Digital Archaeology

Stage 0. Author: stage-0 author (Opus), 2026-10-20. Status: round 1 findings folded in (FINALE_ARC §10); draft for review round 2.

Shared design for both finale missions: `../../finale/FINALE_ARC.md` (premise §1, threads §2, imports §3, cast §5, flags §6, risks §8). This file does not repeat it.

## 1. Overview

- **Proposed title:** *Digital Archaeology* (keep). The old outline's name still fits: the player digs through decommissioned records, paper and tape and servers, to find a man. Keeping it also keeps the folder id, so nothing is renamed. Alternatives: *The Reading* (the Architect's file on the player), *Paper Trail*.
- **Target tier:** 3.
- **Estimated duration:** long, about 75 minutes (the old outline's 70–90; m08 ships at 70).
- **Primary CyBOK areas:** Forensics (recovering and reading records across paper, tape and servers, against a purge); Human Factors (insider placement and recruitment); Authentication, Authorisation and Accountability (a staff credential nobody revoked); Law and Regulation (a flaw kept instead of reported).
- **ENTROPY cell:** Insider Threat Initiative, on the Architect's own ground (§3).
- **Mission type:** investigation and infiltration, at night, against a purge.
- **Place in the season:** day 11, Helena, Montana. The leave is cut short when SAFETYNET intercepts Tesseract's order to burn Helena before the hour. FINALE_ARC §1.3–1.5.
- **What it owes the player:** the name said aloud and proved; the ledger, which says one of the raid team is a plant; the bunker's defences; the Publication's hour; and the first proof that Tesseract's case against SAFETYNET is partly true.

## 2. Technical challenges

### 2.1 VM flags (story meaning only)

Four flags, all required. Full meanings and unlocks: FINALE_ARC §6.1. The VM plan is written separately.

1. A foothold on the archive's catalogue server: the index, restricted series included.
2. The Insider Threat Initiative's ledger: the twenty-three placements, the forty-seven candidates, and a legacy section in which WREN sits on Task Force Null's raid team.
3. The owner of Tomb Beta's last server: a SAFETYNET staff credential issued to Dr Adrian Tesseract before he left, never revoked. The same files hold his memo about the Albion flaw SAFETYNET kept.
4. Full control of that server: the mirror job to Tomb Gamma, with the Publication's hour, the fallback, and the list of defences.

Flags 1–3 are submitted at the drop terminal in the reading room, so the identity scene happens there with HaX; flag 4 is submitted in the tape room beside the machine. HaX says after each what it bought in story terms. The purge never destroys what a flag yields.

### 2.2 In-game challenges

Every type the player has used in m01–m08 is available. The PIN cracker is issued to the player for the first time since St. Catherine's (where they may have picked one up).

| Challenge | Where and why | Builds on |
|---|---|---|
| **PIN cracker (issued)** | Handed over at the briefing by Halina Kowalczyk ("The long way is over," HaX). Opens Sorensen's office safe, which holds the Reading's shelf mark and the tape room's key card. The PIN can also be found the long way (her desk). | m02 (optional pick-up), m02–m08 safes; m08's "I chose what you went in without" |
| **The purge (the night's clock)** | Sorensen shreds and degausses in the restricted cage; Jesse Tran runs a tape wipe from the server closet. The slower the player, the more optional finds are lost (Derek's file, Nightshade's tidied copy, the Recruiter's file, the printed ledger). Stopping Tran halts the tape side. Nothing required is ever lost. | m07's clock |
| Lockpicking | Archive doors, plan chests, the salvage cage holding Tomb Alpha's and Tomb Beta's kit. | m01 on |
| Patrolling guard | Cody Old Coyote on his rounds; Jesse Tran's call-in adds a second guard (avoidable). | m02 on |
| RFID cloning | Sorensen's master card, cloned at her side while she talks (the m08 technique), or Noor's card if she helps. | m03, m08 |
| Fingerprint kit | The restricted cage's reader takes Sorensen's print, lifted off her mug or her stamp. | m04, m08 |
| Social engineering | Noor (help, a warning, or telling her she is on the list), Old Coyote (talk past), Sorensen (bluff as an auditor until her own records show the bluff; she quotes one Reading entry at the player), Gary on the phone if protected (he gives the tape room's decode hint). | m01 on |
| Encoding (CyberChef workstation) | The tape room's code is written into the catalogue in an old archive encoding (clue from flag 1). Tomb Alpha's annotations, in the Architect's hand, decode to the line HaX recognises. | m01 on |
| Document correlation | The handwriting on Nightshade's recruitment file against the annotation style in the Alpha/Beta files and the m07 decode: one hand. With flag 3 this is the proof. Optional: WREN against the personnel records in the legacy files (`sleeper_named`). | m03 directive, m08 door audit |
| The kept flaw | The Albion flaw's catalogue entry, marked "retain: operational value" three years before Albion, and Tesseract's memo arguing it should go to the vendor. On the critical path (flag 3's files). | m04 disclosure choice |
| Combat (light) | Tran's called-in guard; Sorensen if pushed. Every NPC knock-out leaves the mission finishable. | m01 on |
| **A choice for every player** | The Recruiter's offer: WREN's name now, if the player leaves her file to burn. On some branches also: tell HaX about the m05 deal or hang up; send Nightshade his file or keep it. | m05, m08 |

### 2.3 Hybrid workflow

Briefing cutscene in Task Force Null's room (the wall of cards, the purge order, the raid team) → archive by the loading dock; the purge is already running → drop terminal in the reading room → **flag 1** gives the shelf marks → restricted stacks (cage: print, card, picks; Sorensen at the shredder) → the ledger shelf → **flag 2**: WREN is on the raid team; optional cross-reference → the Recruiter rings with her offer → Sorensen's office: safe (PIN cracker), the Reading, Derek's file, Nightshade's file → server closet (stop Tran's wipe, optional) → tape room (code from the catalogue, decoded with Gary's hint or the long way) → Tomb Beta's server → **flag 3**, the Albion memo and the handwriting: identity scene at the drop terminal, Netherton says the name → **flag 4**: the hour and the defences → Tesseract rings HaX → Netherton's Montana order → debrief.

## 3. ENTROPY cell

### Selected cell: Insider Threat Initiative, with the Architect's papers

**Why this cell.** The Helena archive is the Initiative's records office: placements, recruitment files, the people Tomb Gamma "fielded first". It closes m05's forty-seven and m08's "there may be others" in one room, and the cell's speciality (internal compromise, access that was never taken back) is what the player is investigating and what flag 3 turns out to be.

**Cell leader involvement:** minor but pointed. The Recruiter rings once, phone only, and makes every player an offer: WREN's name for her own file (FINALE_ARC rows 60–61). Sorensen is the cell's keeper on site, carrying out the purge.

**Mastermind involvement:** major, at a distance. The Architect is everywhere in the paper (Derek's file, Nightshade's file, the Reading, Tomb Alpha's annotations) and speaks once, to HaX, at the end.

**Cell philosophy in play.** People as records: every placement costed, every recruit's life a line item. Nightshade's file shows it from the inside; the Reading turns it on the player.

**Previous operations.** m05 (TalentStack, Torres), m08 (Nightshade, fifteen years in place), and WREN, an eleven-year-old TalentStack placement inside Task Force Null.

**Inter-cell connections.** Social Fabric's plant on the staff (Jesse Tran, m01's lost intelligence); Zero Day's front company on the lease (m03); the Crypto Anarchists' account that pays it (m06, Irina); Critical Mass's and Ransomware Inc's money in the refit ledger (m02, m04). Every earlier cell has a paper trail into this building.

## 4. Theme options

The premise is fixed by FINALE_ARC §1.3; the options differ in setting, cover and feel.

### Option 1: The Records Office (night)

**Logline.** On the night the leave is cut short, the player breaks into a Helena records archive where the Insider Threat Initiative files its people and the Architect filed his own past, to prove his name before he publishes every weakness SAFETYNET ever catalogued.

**Setting.** Mountain States Records & Retention, a commercial archive in a converted grain warehouse on the edge of Helena: open stacks, a restricted cage, a tape room, a salvage cage, a reading room. Cover: secure storage for law firms and county offices. ENTROPY's interest: deeds nobody reads and staff nobody checks. Atmosphere: dust, sodium light, a building full of other people's secrets, including the player's own file.

**Inciting incident.** SAFETYNET intercepts Tesseract's order to burn Helena before the hour. Behind it: Nightshade's one-way ticket to Helena; the archive's company name (Victoria's keys, Torres' list or Kemal's tip, by branch); the money trail from the fund. Task Force Null wants the bunker's construction file before it goes in, and whatever Helena holds before it is ash.

**Stakes.** Personal: the player's own file, and a plant on the team they will go into the bunker with, whom they met this morning. Organisational: SAFETYNET's former chief strategist, a flaw SAFETYNET kept that cost Albion, and its own map of weaknesses about to be released. Societal: 1,100–2,600 projected dead in the Publication's first month (his own figure, found tonight). Urgency: the purge is running now, and the hour is somewhere on these servers.

**Central conflict.** Archaeology against a fire: the evidence is old and scattered, and someone is destroying it while the player reads.

**Arc.** Act 1: get in, set up the drop terminal, find the restricted series while the shredder runs. Act 2: the ledger and WREN, the Recruiter's offer, the Reading, Nightshade's file, Tran's wipe. Act 3: Tomb Beta's server, the kept flaw, the name, the hour, his call to HaX.

**Key NPCs.** Sorensen, Noor Haddad, Jesse Tran, Cody Old Coyote; HaX and Netherton; the raid team in the briefing (Quintero, Kowalczyk, Malhotra, Arakawa); phone voices (the Recruiter for everyone; Nightshade and Gary by branch).

**Tone.** Dread, paranoid, intimate, under a running clock. The player reads more than they fight, and reads fast.

**Hybrid integration.** As §2.3: the VM is the archive's servers; each flag opens a shelf, a ledger, a name, an hour.

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

**Option 1, The Records Office (night), under a purge.** It keeps the clock m08 gave the player, adds one inside the mission, uses one map, and lets the evidence do the work: the player discovers the Architect's name, his casualty sheet and his reading of them in documents, as the stakes rules ask, rather than being told. A night building with a small staff gives room to evade a guard and to talk to three people properly. Take one thing from Option 2: Sorensen is in late, and the player can bluff her as an auditor sent by the lease-holder until her own records show the bluff.

## 6. Initialisation summary

**Scenario:** m09 *Digital Archaeology*. Tier 3, about 75 minutes. Insider Threat Initiative, with the Architect's papers. Investigation and infiltration at night, against a purge (§1).

### Technical challenges summary

1. **Catalogue foothold (VM flag 1)**: find what the public index hides.
2. **The ledger (VM flag 2)**: read the Initiative's placements, learn that WREN is on the raid team, and optionally match the codename to a SAFETYNET record.
3. **The credential nobody revoked (VM flag 3) and the handwriting**: prove who the Architect is from two directions, and find the flaw SAFETYNET kept.
4. **Tomb Beta's server (VM flag 4)**: the Publication's hour and Tomb Gamma's defences.
5. **Physical access with the full kit, under a clock**: picks, cloner, print kit, and the PIN cracker issued for the first time since St. Catherine's, while the purge runs.

### Recommended theme

Option 1, The Records Office (night), under a purge, with Option 2's auditor bluff for Sorensen (§5). Alternatives: The Audit (day), The Salvage (two sites).

### Next steps

- Stage 1–2 (narrative and storytelling): the briefing's "previously on" with never-played cards and the "who is Tesseract" beat; the identity scene in its forms (rows 70, 98, 125); the Reading's four entries and last page; the Recruiter's call; Tesseract's call to HaX. A reviewer reads the default path with no other mission in mind.
- Stage 3 (moral choices): the Recruiter's offer (every player), the m05 secret (by branch), Nightshade's file (by branch), Noor (tell her or not), Sorensen's fate, what to save from the purge.
- Stage 4 (objectives): the aims below; the purge's pacing.
- Stage 5 (rooms): loading dock, front desk, reading room, open stacks, restricted cage, salvage cage, Sorensen's office, tape room, server closet. The briefing is a cutscene, not a room.
- Haiku VM plan: fit the modules to §2.1.

### Design notes (m01/m02 standard, `mission-alignment-plan`)

- **Opening and closing.** Briefing cutscene in Task Force Null's room with `skipIfGlobal`: the wall of earlier missions as the "previously on" (row 57); the intercepted purge order; the dispatch count (rows 81–85); the raid team, with Kowalczyk handing over the PIN cracker. Closing debrief: Netherton reads the two dead agents' names, signs the Montana order, `bond_visualiser` conclusion.
- **Aims, staged and spoiler-safe.** 1 Get in and set up the drop terminal. 2 Find the restricted series before it burns (flag 1, the cage). 3 Read the Initiative's ledger (flag 2; optional: identify WREN). 4 Search the director's office (the safe, the Reading, the files). 5 Take Tomb Beta's server (flags 3–4). Optional: stop the tape wipe. `missionConclusion`: report to Netherton. `concludeRequires`: the four flags only.
- **HaX's hub, progress-gated.** Topics open on progress globals: Tran (a warning before the player meets him unless `m01_maya_ko`); the restricted series after flag 1; WREN and the cross-reference nudge after flag 2; the Recruiter after her call; "what the line means" on a quiet stretch after flag 2; the name after flag 3 (row 70's forms); what the purge has cost so far, once. Field-guide offers gated `_guide_offered` / `_hint_given` per VM stage.
- **Music.** Cutscene for the briefing; a tense investigation track with the shredder under it; threat on any hostile; a held cue for the identity scene; the Tesseract call under silence, then the closing track.
- **KO resilience.** Sorensen, Noor, Tran and Old Coyote can all be knocked out; a downed Tran stops the tape wipe; Sorensen's card drops when she is down and her print stays on her mug, and Noor's help always has the default route beside it.
- **Carry-overs.** All imports and their uses: FINALE_ARC §3.1. m09's exports: §3.4. No import gates completion.
- **Spoken lines.** The Reading is object text in the narrator's voice or unvoiced; every branch line is a fixed string, never a printed variable.

## 7. Quality checklist

Checked against the 00 prompt's list and the alignment rubric. Ticks are the author's claim; reviewers verify.

**Technical challenges**
- [x] Each challenge maps to a CyBOK area (§1).
- [x] Tier 3 fits: four VM stages and every kit type.
- [x] Clear learning aims per challenge (§6 summary).
- [x] Implementable with existing mechanics; the PIN cracker already exists in the engine, and the purge is timed visibility changes on optional objects (stage 4 checks the engine can do this).
- [x] Real concepts: unrevoked credentials, record correlation, insider placement.
- [x] Challenges build on each other (§2.3).

**ENTROPY cell**
- [x] Capabilities and philosophy fit (§3).
- [x] Adds to running threads: m05's forty-seven, m08's other sleepers.

**Theme**
- [x] Challenges feel necessary: each flag and lock opens a piece of the proof.
- [x] Stakes are specific: 1,100–2,600, his own figure; a sleeper on the team; the player's own file.
- [x] True-believer villains with a spreadsheet (Sorensen, the Architect).
- [x] Evidence discovered in play, not told.
- [x] Player choices that matter in m10 (FINALE_ARC §3.4), and one mid-mission choice for every player (the Recruiter's offer).
- [x] A clock inside the mission (the purge) that costs optional finds only.
- [x] A cold start works: the wall of cards is the "previously on".

**Hybrid architecture**
- [x] One VM (the archive's servers); meanings in FINALE_ARC §6.1.
- [x] Flags have story meaning and a submission point.
- [x] Objectives track flags and in-game finds together.
- [x] In-game work points at the VM (the catalogue clue, the ledger cross-reference) and back.

**Alignment rubric (m01/m02)**
- [x] Canon and stakes; staged aims; HaX's progress-gated hub; music; KO resilience; bookends and `bond_visualiser` (§6 design notes).
- [ ] Rooms and layout: stage 5.
- [ ] Field guides mapped to real lab sheets: after the VM plan.

**Finale rules**
- [x] No eldritch content.
- [x] No import in `concludeRequires` or an `unlockCondition`.
- [x] Every import has a default that plays as a whole story.
- [x] Violence at TV level.
