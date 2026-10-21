# Scenario initialisation: m10 Full Disclosure (`m10_full_disclosure`)

Stage 0. Author: stage-0 author (Opus), 2026-10-20. Status: round 1–4 findings folded in (FINALE_ARC §10–12, §14); stage 1 handover in FINALE_ARC §13; stage 0 complete. Renamed from the working id `m10_final_cipher`. Stages 1–2 changes swept in by the arc-keeper, 2026-10-21 (FINALE_ARC §15; the "s0" column of `stage_1/story_arc.md` §14). Where this file and the stage 1–2 documents still differ, those documents win.

Shared design for both finale missions: `../../finale/FINALE_ARC.md` (premise §1, threads §2, imports §3, endings §4, cast §5, flags §6, teaser §7, risks §8). This file does not repeat it.

## 1. Overview

- **Title:** *Full Disclosure* (the user's choice, 2026-10-20). It names the finale's argument (hoarding, coordinated disclosure, full release) and the Publication itself. Id `m10_full_disclosure`, under the rename rule. The bunker keeps its name, Tomb Gamma.
- **Target tier:** 3.
- **Estimated duration:** long, about 105 minutes, ceiling 110 (the old outline's 90–120; m07 ships at 90). First-time players run 108–115 before the planned media-room cut, which goes unless stage 8's timed playtest comes in under 105 with it.
- **Primary CyBOK areas:** Operating Systems and Virtualisation Security (a service boxed in on its host, and getting out of the box); Network Security (a segmented site, entered from outside); Law and Regulation with Human Factors (vulnerability disclosure: hoarding, coordinated disclosure, full release).
- **ENTROPY cells:** the Architect's own workshop, with representatives of every cell the player has met (§3).
- **Mission type:** raid and confrontation.
- **Place in the season:** the evening of day 12 in Montana; on the Citadel's clock, which every in-game screen shows, the early hours of day 13 (about 01:45–06:00 UTC). The Publication starts going out at 06:00 UTC, city by city; the key at the core's console sends it everywhere in the same minute. FINALE_ARC §1.2–1.5.
- **What it owes the player:** the bunker, the database, the man, the sleeper on their own team, and a reckoning with eight missions of their own choices.

## 2. Technical challenges

### 2.1 VM flags (story meaning only)

Four flags, all required. Full meanings and unlocks: FINALE_ARC §6.2. The VM plan is written separately, and must add the earlier entry stage the brief asks for (flags 1–2).

1. A foothold on the security monitoring host that the camera and door systems report to: cameras, doors, and the door log.
2. The staging copy of the schedule, kept on the security monitoring host; the channels and the cells' early-access orders are in the text beside the flag.
3. Out of the release service's container onto the release host beneath it: the disarm action.
4. Full control of the core host: the stolen copy and the live line into the Citadel's vault.

Flag 1 at the forward post's gate terminal; flags 2 and 3 at the server-hall console (flag 3 arms the disarm, which the player carries to the core, and opens the way to the gallery); flag 4 at the core's host terminal, after Tesseract has greeted the player and HaX (he pauses nothing: "It goes at six whatever we say."). The core holds one flag and the conversation, and his case waits for flag 4.

### 2.2 In-game challenges

The finale adds no new kit. It asks the player to use all of it, in one place, under a raid clock that never fails them and holds still while they talk at the core.

| Challenge | Where and why | Builds on |
|---|---|---|
| Patrolling guards and stealth | The security office, the tunnel, the gallery. Fewer on `m06_assets_seized`. | m02 on |
| Lockpicking | Store rooms, the workshop's cages, old Cold War cabinets, the core's outer lock (the long way). | m01 on |
| RFID cloning | A technician's card on the workshop floor (or Gary's); a gallery guard's card for the outer lock. | m03, m08 |
| PIN cracker | Kowalczyk's own, issued again in the start kit on every branch (inventory doesn't carry). The bunker's original Cold War safes; the workshop where its casing was made (row 29). | m09 |
| Fingerprint kit | The power room's reader; Voltage's print on the bypass as proof (on that branch). | m04, m08 |
| Social engineering | The five full scenes (FINALE_ARC §5.3), each with a decision and a face-to-face beat on every branch, defaults included: the door slot at the forward post (Nightshade: a deal he was refused in m08, a payment to check, the override, or one word and Netherton's tether decision); the workshop (protected Gary is at the door and asks the player to talk round or take in Imran Siddiqui, whom he trained; unprotected Gary is talked round; by default Imran alone); the power room (captured Voltage is placed there after the breach and works his switchgear or talks the player through it; escaped Voltage stood down, talked or fought; by default Wendell Briggs, told the truth or worked round); the gallery (Victoria, or Vos; escaped Victoria's trade for walking out; arrested Victoria rings on a secure line in the server hall, and the player uses or withholds her information face to face with Vos; Vos's own trade by default); Ghost on the security office's handset (talk Ghost out of selling the head start; refused Ghost asks why; an m02 player who never answered is asked to now). Also Asante. One non-HaX voice on the line per room; the raid net counts as HaX's. Every scene has a fight-or-sneak alternative. | m01 on |
| **The whodunit** | One of the raid team is WREN (m09); the player is told privately at the van end after the briefing, never in front of the team. At 01:58, at the kit check, WREN copied Malhotra's badge with a cloner from the breaching case. At 02:10, before the breach, the team was split: Quintero and Kowalczyk on the service tunnel recon (both branches of its fork come out by the service door), Arakawa at the gate beside the player on a call to his daughter, Malhotra on comms with HaX at the van end, Vector and Phantom with Netherton. Three clues across the bunker: the door log shows Malhotra's badge at the core's service door at 02:10 (the readers take SAFETYNET badges because Tesseract loaded them from the stolen database; the door's camera is a dummy); the alibi, which clears Malhotra, Arakawa, Vector and Phantom; the workshop bench's record of a cloner shipped "to WREN" in the breaching case, crossed with the case's sign-out sheet (Kowalczyk and Arakawa). The cracker is a suspicion beat and the accusation's last card, not a clue. Nightshade or m09's shortlist replace clue 2, Phantom's list clue 3. **Accusing is a real choice**, face to face or on the line: right, she is held (four cards); wrong, the innocent officer is led off with a line, the team loses that officer's job, and Netherton recalls them once the player holds the clearing evidence; none, she acts at the core. Skipped entirely if m09 already named her (FINALE_ARC §4.0, §4.4). | m08 door audit, m09 ledger |
| **Victoria's offer** | Recruited: she offers to open the outer lock. Confront her with Zero Day's order from the schedule, trust her blind, or refuse her. Escaped without the m03 threat: a trade for walking out. Arrested: she rings on a secure line in the server hall with Vos's weakness (he resells Zero Day's early access); the player uses or withholds it face to face with Vos in the gallery. | m03 |
| **The head start** | Always set for 04:00; flag 2 is where the player finds it; stopped by an optional task at the server-hall console, or a cell's share stopped in its scene, or it goes as the outer lock opens (HaX warns after flag 2 and as the player leaves the server hall; the gallery door opens only once flag 3 is in). A countdown object per room shows the time from a global set on story beats, never by wall-clock time; no engine feature. | m07 clock |
| Encoding (CyberChef) | Asante's or Mercer's schedule notes; the margin note on the casualty sheet (the sheet itself, a later printing with Asante's correction and his second signature, is on the workshop's critical path; the decode names her and sharpens the talk-down rebuttal). | m01 on |
| Combat | Guards, the power room, Mercer if at large, the sleeper at the core if uncaught. Knock-outs throughout; lethal force only in the endings, in two signposted versions (F11): justified when he makes a move that threatens lives (his hand to the console), and a separate, labelled, confirmed cold choice. | m01 on |
| Optional console tasks | Close the backdoor channel (server hall), kill the story (media room). They lower the cost; they never gate the ending. The schedule shows what is in the first batches, in plain words. | m07 triage |
| The argument | Tesseract's case (the Publication, the offer, then his evidence with three record lines), then three exchanges: four fixed slots each, with one matching rebuttal from the mission, up to two from the player's record, and decoys of the same length that answer a different question. Two of three to win; a miss is visibly a miss; no fixed button strategy wins on a cold start (FINALE_ARC §4.1). | m07 Mercer, m08 Nightshade |
| The choices at the core | Stop, or "Show me how it works"; secure, disclose or wipe both, each with its cost said first; then surrender, arrest (with the justified lethal moment if he moves), or the labelled cold choice (FINALE_ARC §4). | every mission's endings |

### 2.3 Hybrid workflow

Briefing at the forward post (Netherton, HaX, the raid team, Quintero's objection; WREN detained here if named in m09; the cold-start version, with who Tesseract is, for a player who skipped m09), then the private aside at the van end (WREN is on this team) → the door slot's full scene, the only won-branch beat here → **flag 1** at the gate terminal while the pre-breach split happens around the player (Arakawa's call at 02:10; the recon pair back about 02:20): cameras, doors, the door log → the breach at 02:30 → the blast door, keyed to open for Agent 0x00 by name → blast-door tunnel (Reeves on the rota sheet, by branch) → security office: the player's photo on the wall, Hollis on the duty board (by branch), the door log (clue 1), Ghost on the duty handset → workshop floor (Gary, or Imran Siddiqui; the corrected casualty sheet; the bench log, clue 3) → power room, on the main path (Voltage escaped or captured in person, or Wendell Briggs with a voice on the phone; cut the gallery's shutter) → server hall (Asante or Mercer; arrested Victoria on the secure line): **flags 2 and 3**, the schedule, the channels, the disarm armed (HaX points at the sealed section's hatch before flag 3); optional tasks: stop the head start, close the backdoor; Kowalczyk peels off → media room (optional, the first planned cut; the drafted story, or Social Fabric's crew) → HaX's last line before the jam → gallery, alone (Victoria or Vos), open only once flag 3 is in → the core's outer lock (picked, a gallery guard's card, opened by a Victoria who holds or a Vos who stands aside, or in Ghost's guard-change window); the head start goes as it opens, unless stopped; Quintero holds it → the core: no pause ("It goes at six whatever we say."); **flag 4** at the host terminal; then his case, the three exchanges, the choices (FINALE_ARC §4.1) → the ending's beat → the forward post at 06:00 (a cutscene) → conclusion screen → closing card → teaser slot → credits. The accusation can be made any time after clue 1, face to face or on the line.

## 3. ENTROPY cells

### Selected: the Architect's workshop, all cells present

**Why.** Tomb Gamma is where "everything the cells field has been through first" (m07 dossier). A season finale should put the player in a room with the organisation's machinery, and the Publication is the one operation every cell has a stake in: the cells get the database two hours early, pushed from the core at 04:00 UTC, as their reward for the theft (FINALE_ARC §1.2). Each cell staged here is present through a person the player's history decides, or through its default stand-in (FINALE_ARC §5.3). Two cells the player met in m07 are not staged and appear only in the closing card.

| Cell | In the bunker | Through |
|---|---|---|
| The Architect (mastermind) | in person, at the core | every player |
| Critical Mass | the power room; the release schedule | Voltage (and Static), Mercer; or power-room technicians and Asante |
| Zero Day Syndicate | the gallery, for the head start | Victoria Sterling, or Pieter Vos, who took her desk |
| Ransomware Incorporated | on the network, selling the head start on | Ghost, for every player |
| Social Fabric | the media room | its crew, when Fracture was uncovered (`m07_completed`); otherwise the drafted story on the desk |
| Supply Chain Saboteurs | the Trojan Horse backdoor as a release channel | when `m07_completed and (m07_team_assignment != "trojan_horse" or m07_team_redirected)` |
| Insider Threat Initiative | WREN on the raid team; Gary recruited | Halina Kowalczyk; Gary on that branch |
| Crypto Anarchists | the reserve bank paying for the servers | the ledger (row 79); nearly empty on a freeze |
| Ghost Protocol (Michael Reeves) | not staged | closing card, by whether Fracture was covered |
| Digital Vanguard (Marcus Ashford) | not staged | closing card, by whether Meltdown was covered |

**Mastermind involvement:** major, in person for the first time.

**Philosophy in play.** "Entropy is inevitable. Systems decay. I merely publish the schedule." The Publication is that line made literal, and his casualty sheet is the true believer's spreadsheet (FINALE_ARC §1.2).

**Previous operations.** All of m01–m08.

**What survives.** Off-screen leaders (Michael Reeves, Jennifer Walsh, Marcus Ashford), Zero Day's 0day, the Recruiter: named in the closing card by branch, left for a later season.

## 4. Theme options

The premise is fixed by FINALE_ARC §1.3 and §4; the options differ in how the raid is staged.

### Option 1: The Siege

**Logline.** Task Force Null goes into a Cold War bunker in the Montana hills the night before the Architect publishes every weakness SAFETYNET ever catalogued, and the faces from eight missions are waiting inside.

**Setting.** A 1960s command bunker on federal land, sold off in the nineties, refitted with ENTROPY's money. Nine playable rooms: forward post (the gate in view), security office, blast-door tunnel, the power room with old switchgear and a battery room, workshop floor, server hall in the old command room, media room, gallery above the core, the core itself. The service tunnel is a cutscene. Cover: a private data-storage company with a fence and a sign. Atmosphere: concrete, sodium lamps, the hum of a plant that was built for the end of the world. Stage 5 should try m04's `room_aes_*` plant, workshop and security tiles and m07's `room_pnw_*` tiles first.

**Inciting incident.** m09's flag 4 gave the hour; Tesseract's call to HaX gave the invitation ("Bring 0x00. I've kept a door."). He needs a SAFETYNET hand on the key, and his file says it will be 0x00's (FINALE_ARC §1.2). Netherton signs the raid knowing it is an invitation.

**Stakes.** Personal: the player's own record argued back at them; a sleeper on their own team; HaX facing her teacher. Organisational: SAFETYNET's whole map of weaknesses, and whether the service keeps hoarding it. Societal: his own sheet prices both modes: by key, all cities, 1,100–2,600 projected dead in the first month; by the 06:00 fallback, city by city, fewer and later; eleven counties' dispatch already failing on some branches. Urgency: the countdown objects show the cells' head start at 04:00 UTC and the fallback at 06:00; in play both move on story events, so the urgency is felt in what people say, never charged against slow VM work.

**Central conflict.** Getting in is the player against a fortress and a traitor; the core is the player against an argument they half agree with, made by a man who wants them to finish it for him.

**Arc.** Act 1: the forward post and the door's scene, flag 1, the blast door that knows the player's name, the tunnel, the first clue. Act 2: the workshop, the power room and the server hall, each with a full scene; the other two clues; the schedule and the disarm. Act 3: the gallery alone, the outer lock, the core with the hour still set for six and his hand by the key, Tesseract, the choices, the ending.

**Key NPCs.** Tesseract; HaX and Netherton; the raid team (Quintero, Kowalczyk, Malhotra, Arakawa; Vector and Phantom by branch); Asante; the default technicians Imran Siddiqui and Wendell Briggs; the five returning scenes and the rest by branch (FINALE_ARC §5).

**Tone.** Season-finale set piece: tense, crowded, then very quiet at the core.

**Hybrid integration.** §2.3: the VM is the bunker's network, staged from outside to the core.

### Option 2: The Invitation

**Logline.** Tesseract invites Agent 0x00 alone; the team waits at the fence with the comms jammed, and the player walks through a bunker that opens for them.

**Differences.** Lonelier, more psychological; fewer returning faces; HaX off the line for most of it.

**Why not.** It throws away the carry-over payoffs (who is on the team, who helps on the phone) that the user asked to feel, and losing HaX for most of the finale wastes her arc.

### Option 3: Two Fronts

**Logline.** The player raids the bunker while HaX defends the Citadel's master copy from Tesseract's live line, the two halves cutting together.

**Differences.** A second location and a playable or narrated HaX thread.

**Why not.** A second map and a second playable thread cost a mission's worth of work for a few scenes; the live line can do the same job from the core (FINALE_ARC §4.1, Scorched Earth).

## 5. Recommendation

**Option 1, The Siege**, with two pieces of Option 2: the blast door that opens for Agent 0x00 by name, and a short, linear stretch before the core (the gallery: one room, one obvious door) where Tesseract's jamming drops HaX's line. Her last line before the drop names what to do next, and her doubt about Victoria comes before it. The line comes back at the core's door. The Siege is the only option that puts the player's history in the building as people, which is what the user asked the finale to do. The quiet stretch keeps the confrontation personal.

## 6. Initialisation summary

**Scenario:** m10 *Full Disclosure*. Tier 3, about 105 minutes, ceiling 110. The Architect's workshop, every staged cell present. Raid, whodunit and confrontation (§1).

### Technical challenges summary

1. **Security monitoring foothold (VM flag 1)**: cameras, doors, and the log that starts the whodunit.
2. **The staging schedule (VM flag 2)**: the Publication's schedule, what is in it, its channels and the cells' orders; optional work to shrink the cost.
3. **Out of the container (VM flag 3)**, at the server hall: onto the release host beneath it, arming the disarm.
4. **The core host (VM flag 4)**: the stolen copy and the line into the Citadel.
5. **The disclosure question**: secure, disclose or wipe, each with its cost; argued with the man who started it, and decided by the player.

### Recommended theme

Option 1, The Siege, with the keyed blast door and the quiet gallery from Option 2 (§5). Alternatives: The Invitation, Two Fronts.

### Next steps

- Stage 1–2 (done, `stage_1/story_arc.md`, `stage_2/storytelling_elements.md`): the cold-start briefing (read with no other mission in mind); Tesseract's case (three record lines by priority, FINALE_ARC §4.1); the three exchanges, their decoys and visible reactions; the five slots in every form; the three clues, the accused officer's line and the recall; WREN refused at the key; each ending's scene; HaX's last word.
- Stage 3: the core's choices with their stated costs, the cold lethal choice's wording, and the Join signposting (FINALE_ARC §4.1–4.3); the accusation; Victoria's offer and the arrested-branch deal; Nightshade's deal on the arrested branch and the shown Nightshade taken in or left; talking Ghost out of the sale; FINALE_ARC §13 items 25, 27, 28 and 33–38.
- Stage 4: the aims below; the countdown objects' steps per story beat (04:00 as the outer lock opens; never 06:00 before the core); the per-beat time budget inside stage 1's act figures.
- Stage 5: the nine rooms in §4 Option 1. Every presence slot has its default occupant (FINALE_ARC §5.3).
- Haiku VM plan: fit the modules to §2.1, adding the entry stage.

### Design notes (m01/m02 standard, `mission-alignment-plan`)

- **Opening and closing.** Briefing cutscene at the forward post with `skipIfGlobal`; the raid team by branch and in position; WREN detained on screen if m09 named her; the private aside at the van end; a never-played-m09 version with the three facts, the third at the aside (FINALE_ARC §4.0). Closing: one scene per ending at the core, then the forward post at 06:00 as a cutscene (the Citadel on Join), then the conclusion screen (`bond_visualiser` on every ending, MISSION FAILED styling on Join, as m01's launch), the closing card (five lines at most), the teaser slot (default off), and the credits ("In this operation", "Elsewhere", SAFETYNET, in memory).
- **Aims, staged and spoiler-safe.** 1 Breach the perimeter (flag 1). 2 Get below ground (blast door, tunnel, security office). 3 Cut the power to the gallery (workshop, power room). 4 Find the release (server hall, flags 2–3; optional: stop the head start, close the backdoor, kill the story). 5 Reach the core (gallery, outer lock, flag 4). Optional throughout: find WREN. `missionConclusion`: the core. `concludeRequires`: the four flags only. The endings and the accusation are globals the debrief reads, not tasks.
- **HaX's hub, progress-gated.** From the forward post and on the line: a nudge after each whodunit clue; the fence and the empty posts on `m06_assets_seized`; the power room after flag 1 ("Whoever's in the power room runs your lights."); the head start when flag 2 goes in, and again on leaving the server hall; the sealed section's hatch before flag 3; "Get on his box. He'll keep." at the core, and the field-guide offer still working there; the unsent notice off his box at flag 4 on a cold start; each returning face as the player meets them, the channels and the schedule's contents after flag 2, her doubt about Victoria before the gallery, Tesseract after the core opens. Her nudges after the clues never name a suspect. Field-guide offers gated per VM stage. Silent in the one-room gallery stretch, after a last line that names the next door.
- **Music.** Cutscene at the forward post; a driving raid track; threat on hostiles; the countdown's tension rising with each story beat; silence in the gallery; a held, low cue at the core, stepping down on each landed point (both need an engine change, F10; fallback: silence on the second landed point); one track per ending's close (victory for the successes, a cold variant for Scorched Earth, Join and the executed ending).
- **KO resilience.** Every NPC in the bunker can be knocked out with the route intact, the raid team included (a downed raid member is held at the forward post; it is not an accusation, and costs an epilogue line). Tesseract cannot be knocked out before the core's choices (he is seated behind the console, and the core sequence is a conversation), so the endings always run.
- **Carry-overs.** All imports, tiered, and their uses: FINALE_ARC §3.2; exports for a later season: §3.5. No import gates completion. Tier 1 is built and playtested first.
- **Spoken lines.** Tesseract's lines per import value are fixed strings; no printed variables.
- **Violence.** Knock-outs; lethal force as one narrated line in each of two endings (F11): justified, only when he makes a move that threatens lives and never after a successful talk-down; cold, a separate, clearly labelled, confirmed choice (`executed`); Quintero wounded, never killed.
- **Phone scenes.** Ghost's handset and arrested Victoria's line follow the forced-phone-scene rule (FINALE_ARC §6.1).

## 7. Quality checklist

Checked against the 00 prompt's list and the alignment rubric. Ticks are the author's claim; reviewers verify.

**Technical challenges**
- [x] Each challenge maps to a CyBOK area (§1).
- [x] Tier 3 fits: a staged VM from outside to the core; all kit.
- [x] Clear learning aims (§6 summary); the disclosure question is the educational spine.
- [x] Implementable with existing mechanics; no new kit. The core's choices are ink plus one console object with a confirmation.
- [x] Real concepts: segmentation, isolation of a service from its host, disclosure policy.
- [x] Challenges build on each other (§2.3) and on m09's flags (the hour, the defences).

**ENTROPY cells**
- [x] The Architect's workshop, and the cells' head start, justify every staged cell being present (§3).
- [x] Pays off every earlier cell's thread through a person, a default or the closing card.

**Theme**
- [x] Challenges feel necessary: each flag opens the next floor.
- [x] Stakes are specific: 1,100–2,600 by key, fewer and later by the fallback; dispatch in eleven counties; the database.
- [x] Villain with a spreadsheet and a monologue that is a real argument.
- [x] Evidence discovered in play (the casualty sheet and its correction, the door log, the schedule).
- [x] Endings decided by the player, signposted, never traps (FINALE_ARC §4.3); every database option has a stated cost.
- [x] The villain's plan holds together: he needs 0x00 at the key, which explains the invitation, the keyed door, his waiting, his lack of hurry and his refusal of WREN (FINALE_ARC §1.2, §4.4).
- [x] Mid-mission choices for every player: the accusation, talking Ghost out of the sale, the gallery's choice on Victoria's branches.
- [x] Five full-scene slots on the main path, filled on every combination; a won branch puts a person in the room too, with one decision and one face-to-face beat (FINALE_ARC §5.3).
- [x] Slow VM work never costs a story outcome: the countdown moves on story events (FINALE_ARC §4.2).
- [x] The climax never runs against a clock or waits on VM work: the countdown holds still while they talk (it moves only on beats), and the core holds one flag, which his case waits for.
- [x] A cold start works: the briefing's never-played version (FINALE_ARC §4.0).

**Hybrid architecture**
- [x] One VM (the bunker's network), with the added entry stage; meanings in FINALE_ARC §6.2.
- [x] Flags have story meaning and a submission point.
- [x] Objectives track flags and in-game work together.
- [x] In-game work points at the VM (the door log, the channels) and back.
- [x] VM challenges complement rather than duplicate in-game ones: the VM opens the bunker's systems; the in-game work is people, locks and the whodunit, and they meet in the door log and the schedule.
- [x] ERB narrative content needs no VM changes: flag meanings are fixed in FINALE_ARC §6.2; every story variant lives in the ERB and ink.
- [ ] In-game challenges teach skills the VM needs (or the reverse): partly. The sealed section's maintenance hatch, which HaX points at before flag 3, is a physical echo of getting out of a container at game-design level only. Owner: stage 4, with the lab sheet.
- [ ] Flexible learning paths (labs done separately): open. Owner: the lab-sheet stage (the VM-steps companion sheet).
- [ ] Scope achievable in about 105 minutes, ceiling 110: tight (four flags, five scenes, a three-clue whodunit, a core of about 33 minutes with flag 4). Stage 1 set the act figures (25 + 45 + 33 + 5 = 108, about 105 after the planned media-room cut) and the cut order; owner of the per-beat figures: stage 4, against m07 and m09.

**Alignment rubric (m01/m02)**
- [x] Canon and stakes; staged aims; HaX's progress-gated hub; music; KO resilience; bookends and `bond_visualiser` (§6 design notes).
- [ ] Rooms and layout: stage 5.
- [ ] Field guides mapped to real lab sheets: after the VM plan.

**Finale rules**
- [x] No eldritch content; the teaser slot is empty and off by default (FINALE_ARC §7).
- [x] No import in `concludeRequires` or an `unlockCondition`.
- [x] Every presence import has a default occupant, and every present or penalising value that equals a default also needs that source's `completed`.
- [x] Violence at TV level.
