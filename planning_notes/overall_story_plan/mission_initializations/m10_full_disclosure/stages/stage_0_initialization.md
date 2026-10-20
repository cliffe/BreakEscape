# Scenario initialisation: m10 Full Disclosure (`m10_full_disclosure`)

Stage 0. Author: stage-0 author (Opus), 2026-10-20. Status: round 1 and 2 findings folded in (FINALE_ARC §10, §11); draft for review round 3. Renamed from the working id `m10_final_cipher`.

Shared design for both finale missions: `../../finale/FINALE_ARC.md` (premise §1, threads §2, imports §3, endings §4, cast §5, flags §6, teaser §7, risks §8). This file does not repeat it.

## 1. Overview

- **Title:** *Full Disclosure* (the user's choice, 2026-10-20). It names the finale's argument (hoarding, coordinated disclosure, full release) and the Publication itself. Id `m10_full_disclosure`, under the rename rule. The bunker keeps its name, Tomb Gamma.
- **Target tier:** 3.
- **Estimated duration:** long, about 100 minutes (the old outline's 90–120; m07 ships at 90).
- **Primary CyBOK areas:** Operating Systems and Virtualisation Security (a service boxed in on its host, and getting out of the box); Network Security (a segmented site, entered from outside); Law and Regulation with Human Factors (vulnerability disclosure: hoarding, coordinated disclosure, full release).
- **ENTROPY cells:** the Architect's own workshop, with representatives of every cell the player has met (§3).
- **Mission type:** raid and confrontation.
- **Place in the season:** night of day 12; the Publication is set for 06:00 UTC on day 13. FINALE_ARC §1.3–1.5.
- **What it owes the player:** the bunker, the database, the man, the plant on their own team, and a reckoning with eight missions of their own choices.

## 2. Technical challenges

### 2.1 VM flags (story meaning only)

Four flags, all required. Full meanings and unlocks: FINALE_ARC §6.2. The VM plan is written separately, and must add the earlier entry stage the brief asks for (flags 1–2).

1. A foothold on the security monitoring host that the camera and door systems report to: cameras, doors, and the door log.
2. The staging copy of the schedule, kept on the security monitoring host; the channels and the cells' early-access orders are in the text beside the flag.
3. Out of the release service's container onto the release host beneath it: the disarm action.
4. Full control of the core host: the stolen copy and the live line into the Citadel's vault.

Flag 1 at the forward post's terminal; flags 2 and 3 at the server-hall console (flag 3 arms the disarm, which the player carries to the core); flag 4 at the core's host terminal, after Tesseract has stopped the clock. The core holds one flag and the conversation.

### 2.2 In-game challenges

The finale adds no new kit. It asks the player to use all of it, in one place, under a raid clock that never fails them and stops at the core.

| Challenge | Where and why | Builds on |
|---|---|---|
| Patrolling guards and stealth | The security office, the tunnel, the gallery. Fewer on `m06_assets_seized`. | m02 on |
| Lockpicking | Store rooms, the workshop's cages, old Cold War cabinets, the core's outer lock (the long way). | m01 on |
| RFID cloning | A technician's card on the workshop floor (or Gary's); a gallery guard's card for the outer lock. | m03, m08 |
| PIN cracker | The bunker's original Cold War safes; the workshop where the crackers are made (row 29). | m09 |
| Fingerprint kit | The plant room's reader; Voltage's print on the bypass as proof (on that branch). | m04, m08 |
| Social engineering | The five full scenes (FINALE_ARC §5.3): Nightshade at the door (a deal, a payment, or one word), Gary at the workshop (consultant or recruit), Voltage at the plant (on the phone or at the switchgear), the gallery (Victoria or Vos), Ghost on the server-hall handset (talk Ghost out of selling the head start). Also Asante. Every one has a fight-or-sneak alternative. | m01 on |
| **The whodunit** | One of the raid team is WREN (m09). Three clues across the bunker: the door log shows Malhotra's cloned badge at the core's service door at 02:10; the alibi (Malhotra was on comms with HaX; Arakawa was with the player); the workshop bench's serial, which matches the cracker on the player's own belt. Nightshade or Phantom skip one step. **Accusing is a real choice**: right, she is held; wrong, the innocent officer is led off with a line, the team loses that officer's job, and the player can recall them on new evidence; none, she acts at the core. Skipped entirely if m09 already named her (FINALE_ARC §4.4). | m08 door audit, m09 ledger |
| **Victoria's offer** (recruited branch) | She offers to open the outer lock. Confront her with Zero Day's order from the schedule, trust her blind, or refuse her. Arrested branch: deal with her over Vos, or not. | m03 |
| Encoding (CyberChef) | Asante's or Mercer's schedule notes; the correction on the casualty sheet. | m01 on |
| Combat | Guards, the plant, Mercer if at large, the sleeper at the core if uncaught. Knock-outs throughout; lethal force only in the ending, and only when he reaches for the dead-man switch. | m01 on |
| Optional console tasks | Close the backdoor channel (server hall), kill the story (media room). They lower the cost; they never gate the ending. The schedule shows what is in the first batches, in plain words. | m07 triage |
| The argument | Tesseract's case (three record lines), then three exchanges: each of his claims has one matching rebuttal from the mission, up to two from the player's record, and decoys that answer a different question. Two of three to win; a miss is visibly a miss (FINALE_ARC §4.1). | m07 Mercer, m08 Nightshade |
| The choices at the core | Stop, or "Show me how it works"; secure, disclose or wipe both, each with its cost said first; then surrender, arrest, or the dead-man moment (FINALE_ARC §4). | every mission's endings |

### 2.3 Hybrid workflow

Briefing at the forward post (Netherton, HaX, the raid team in position; WREN detained here if named in m09; the cold-start version for a player who skipped m09; the door's full scene: Nightshade in some form) → **flag 1** from outside: cameras, doors, the door log → the blast door, keyed to open for Agent 0x00 by name → blast-door tunnel (Reeves on the rota sheet, by branch) → security office: the player's photo on the wall, Hollis on the duty board (by branch), the door log (clue 1) → workshop floor (Gary or a technician; the bench serial, clue 3) → plant room, on the main path (Voltage in person or on the phone; cut the gallery's shutter) → server hall (Asante or Mercer; Ghost on the handset): **flags 2 and 3**, the schedule, the channels, the disarm armed; optional backdoor task → media room (optional; the drafted story, or Social Fabric's crew) → HaX's last line before the jam → gallery, alone (Victoria or Vos) → the core's outer lock (picked, cloned off a gallery guard, opened by a Victoria who holds, or in Ghost's guard-change window) → the core: Tesseract stops the clock; **flag 4** at the host terminal; then his case, the three exchanges, the choices (FINALE_ARC §4.1) → endings → epilogue → teaser slot → credits. The accusation can be made any time after clue 1.

## 3. ENTROPY cells

### Selected: the Architect's workshop, all cells present

**Why.** Tomb Gamma is where "everything the cells field has been through first" (m07 dossier). A season finale should put the player in a room with the organisation's machinery, and the Publication is the one operation every cell has a stake in: the cells get the database two hours early, pushed from the core at 04:00 UTC, as their reward for the theft (FINALE_ARC §1.2). Each cell staged here is present through a person the player's history decides, or through its default stand-in (FINALE_ARC §5.3). Two cells the player met in m07 are not staged and appear only in the closing card.

| Cell | In the bunker | Through |
|---|---|---|
| The Architect (mastermind) | in person, at the core | every player |
| Critical Mass | the power plant; the release schedule | Voltage (and Static), Mercer; or plant technicians and Asante |
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

**Setting.** A 1960s command bunker on federal land, sold off in the nineties, refitted with ENTROPY's money. Nine playable rooms: forward post (the gate in view), security office, blast-door tunnel, power plant with old switchgear and a battery room, workshop floor, server hall in the old command room, media room, gallery above the core, the core itself. The service tunnel is a cutscene. Cover: a private data-storage company with a fence and a sign. Atmosphere: concrete, sodium lamps, the hum of a plant that was built for the end of the world. Stage 5 should try m04's `room_aes_*` plant, workshop and security tiles and m07's `room_pnw_*` tiles first.

**Inciting incident.** m09's flag 4 gave the hour; Tesseract's call to HaX gave the invitation ("Bring 0x00. I've kept a door."). He needs a SAFETYNET hand on the key, and his file says it will be 0x00's (FINALE_ARC §1.2). Netherton signs the raid knowing it is an invitation.

**Stakes.** Personal: the player's own record argued back at them; a plant on their own team; HaX facing her teacher. Organisational: SAFETYNET's whole map of weaknesses, and whether the service keeps hoarding it. Societal: 1,100–2,600 projected dead in the first month if it goes out; eleven counties' dispatch already failing on some branches. Urgency: the cells' head start goes at 04:00 UTC and the fallback at 06:00, whether anyone presses or not.

**Central conflict.** Getting in is the player against a fortress and a traitor; the core is the player against an argument they half agree with, made by a man who wants them to finish it for him.

**Arc.** Act 1: the forward post and the door's scene, flag 1, the blast door that knows the player's name, the tunnel, the first clue. Act 2: the workshop, the plant and the server hall, each with a full scene; the other two clues; the schedule and the disarm. Act 3: the gallery alone, the core, the clock stopped, Tesseract, the choices, the ending.

**Key NPCs.** Tesseract; HaX and Netherton; the raid team (Quintero, Kowalczyk, Malhotra, Arakawa; Vector and Phantom by branch); Asante; the five returning scenes and the rest by branch (FINALE_ARC §5).

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

**Scenario:** m10 *Full Disclosure*. Tier 3, about 100 minutes. The Architect's workshop, every staged cell present. Raid, whodunit and confrontation (§1).

### Technical challenges summary

1. **Security monitoring foothold (VM flag 1)**: cameras, doors, and the log that starts the whodunit.
2. **The staging schedule (VM flag 2)**: the Publication's schedule, what is in it, its channels and the cells' orders; optional work to shrink the cost.
3. **Out of the container (VM flag 3)**, at the server hall: onto the release host beneath it, arming the disarm.
4. **The core host (VM flag 4)**: the stolen copy and the line into the Citadel.
5. **The disclosure question**: secure, disclose or wipe, each with its cost; argued with the man who started it, and decided by the player.

### Recommended theme

Option 1, The Siege, with the keyed blast door and the quiet gallery from Option 2 (§5). Alternatives: The Invitation, Two Fronts.

### Next steps

- Stage 1–2: the cold-start briefing (read with no other mission in mind); Tesseract's case (three record lines by priority, FINALE_ARC §4.1); the three exchanges, their decoys and visible reactions; the five slots in every form; the three clues, the accused officer's line and the recall; WREN refused at the key; each ending's scene; HaX's last word.
- Stage 3: the core's choices with their stated costs and the Join signposting (FINALE_ARC §4.1–4.3); the accusation; Victoria's offer and the arrested-branch deal; Nightshade's deal on the arrested branch; talking Ghost out of the sale.
- Stage 4: the aims below; the raid clock with its 04:00 and 06:00 marks, stopped at the core.
- Stage 5: the nine rooms in §4 Option 1. Every presence slot has its default occupant (FINALE_ARC §5.3).
- Haiku VM plan: fit the modules to §2.1, adding the entry stage.

### Design notes (m01/m02 standard, `mission-alignment-plan`)

- **Opening and closing.** Briefing cutscene at the forward post with `skipIfGlobal`; the raid team by branch and in position; WREN detained on screen if m09 named her; a never-played-m09 version with the three facts (FINALE_ARC §4.0). Closing: one scene per ending, the closing card, the teaser slot (default off), credits; `bond_visualiser` conclusion on every ending, MISSION FAILED styling on Join (as m01's launch).
- **Aims, staged and spoiler-safe.** 1 Breach the perimeter (flag 1). 2 Get below ground (blast door, tunnel, security office). 3 Cut the power to the gallery (workshop, plant). 4 Find the release (server hall, flags 2–3; optional: close the backdoor, kill the story). 5 Reach the core (gallery, outer lock, flag 4). Optional throughout: find the plant on the team. `missionConclusion`: the core. `concludeRequires`: the four flags only. The endings and the accusation are globals the debrief reads, not tasks.
- **HaX's hub, progress-gated.** From the forward post and on the line: a nudge after each whodunit clue; the fence and the empty posts on `m06_assets_seized`; the plant after flag 1 ("Whoever's in the plant runs your lights."); "Get on his box. He'll keep." at the core; each returning face as the player meets them, the channels and the schedule's contents after flag 2, her doubt about Victoria before the gallery, "what the line means" if m09 didn't play it, Tesseract after the core opens. Field-guide offers gated per VM stage. Silent in the one-room gallery stretch, after a last line that names the next door.
- **Music.** Cutscene at the forward post; a driving raid track; threat on hostiles; the clock's last minutes before each mark; silence in the gallery; the clock's tick cut dead when he stops it; a held, low cue at the core, thinning on each landed point; one track per ending's close (victory for the successes, a cold variant for Scorched Earth and Join).
- **KO resilience.** Every NPC in the bunker can be knocked out with the route intact, the raid team included (a downed raid member is held at the forward post; it is not an accusation, and costs an epilogue line). Tesseract cannot be knocked out before the core's choices (he is seated behind the console, and the core sequence is a conversation), so the endings always run.
- **Carry-overs.** All imports, tiered, and their uses: FINALE_ARC §3.2; exports for a later season: §3.5. No import gates completion. Tier 1 is built and playtested first.
- **Spoken lines.** Tesseract's lines per import value are fixed strings; no printed variables.
- **Violence.** Knock-outs; lethal force as one narrated line in one ending, only when he reaches for the dead-man switch; Quintero wounded, never killed.

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
- [x] Stakes are specific: 1,100–2,600; dispatch in eleven counties; the database.
- [x] Villain with a spreadsheet and a monologue that is a real argument.
- [x] Evidence discovered in play (the casualty sheet and its correction, the door log, the schedule).
- [x] Endings decided by the player, signposted, never traps (FINALE_ARC §4.3); every database option has a stated cost.
- [x] The villain's plan holds together: he needs 0x00 at the key, which explains the invitation, the keyed door, his waiting, the paused clock and his refusal of WREN (FINALE_ARC §1.2, §4.4).
- [x] Mid-mission choices for every player: the accusation, talking Ghost out of the sale, the gallery's choice on Victoria's branches.
- [x] Five full-scene slots on the main path, filled on every combination; a won branch puts a person in the room too (FINALE_ARC §5.3).
- [x] The climax never runs against a clock or waits on VM work: he stops the clock, and the core holds one flag.
- [x] A cold start works: the briefing's never-played version (FINALE_ARC §4.0).

**Hybrid architecture**
- [x] One VM (the bunker's network), with the added entry stage; meanings in FINALE_ARC §6.2.
- [x] Flags have story meaning and a submission point.
- [x] Objectives track flags and in-game work together.
- [x] In-game work points at the VM (the door log, the channels) and back.

**Alignment rubric (m01/m02)**
- [x] Canon and stakes; staged aims; HaX's progress-gated hub; music; KO resilience; bookends and `bond_visualiser` (§6 design notes).
- [ ] Rooms and layout: stage 5.
- [ ] Field guides mapped to real lab sheets: after the VM plan.

**Finale rules**
- [x] No eldritch content; the teaser slot is empty and off by default (FINALE_ARC §7).
- [x] No import in `concludeRequires` or an `unlockCondition`.
- [x] Every presence import has a default occupant, and every present or penalising value that equals a default also needs that source's `completed`.
- [x] Violence at TV level.
