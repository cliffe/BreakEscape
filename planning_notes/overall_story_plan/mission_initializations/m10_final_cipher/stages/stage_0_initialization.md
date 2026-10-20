# Scenario initialisation: m10 Tomb Gamma (working id `m10_final_cipher`)

Stage 0. Author: stage-0 author (Opus), 2026-10-20. Status: draft for review round 1.

Shared design for both finale missions: `../../finale/FINALE_ARC.md` (premise §1, threads §2, imports §3, endings §4, cast §5, flags §6, teaser §7, risks §8). This file does not repeat it.

## 1. Overview

- **Proposed title:** *Tomb Gamma*. Every mission since m07 has pointed at the name; the player has been told to go there for two missions. The working title *Final Cipher* promises a cipher the mission doesn't have. Folder becomes `m10_tomb_gamma` under the rename rule. Alternatives: *Afterwards* (from the line the season turns on; strong, but it gives the last scene away), *The Publication*.
- **Target tier:** 3.
- **Estimated duration:** long, 60–75 minutes.
- **Primary CyBOK areas:** Operating Systems and Virtualisation Security (a service boxed in on its host, and getting out of the box); Network Security (a segmented site, entered from outside); Law and Regulation with Human Factors (vulnerability disclosure: hoarding, coordinated disclosure, full release).
- **ENTROPY cells:** the Architect's own workshop, with representatives of every cell the player has met (§3).
- **Mission type:** raid and confrontation.
- **Place in the season:** night of day 12; the Publication is set for 06:00 UTC on day 13. FINALE_ARC §1.3–1.5.
- **What it owes the player:** the bunker, the database, the man, and a reckoning with eight missions of their own choices.

## 2. Technical challenges

### 2.1 VM flags (story meaning only)

Four flags, all required. Full meanings and unlocks: FINALE_ARC §6.2. The VM plan is written separately, and must add the earlier entry stage the brief asks for (flags 1–2).

1. A foothold on the bunker's security system: cameras, doors, and the door log.
2. Inside the release pipeline: the schedule by city and its channels.
3. Out of the release service's box onto the release host beneath it.
4. Full control of the core host: the stolen copy and the live line into the Citadel's vault.

Flag 1 at the forward post's terminal; flags 2–4 on terminals inside, where the player stands when they get them.

### 2.2 In-game challenges

The finale adds no new kit. It asks the player to use all of it, in one place, under a clock that never fails them.

| Challenge | Where and why | Builds on |
|---|---|---|
| Patrolling guards and stealth | The gate, the tunnel, the gallery. Fewer on `m06_assets_seized`. | m02 on |
| Lockpicking | Store rooms, the workshop's cages, old Cold War cabinets. | m01 on |
| RFID cloning | A technician's card on the workshop floor (or Gary's); a guard's card on the rota. | m03, m08 |
| PIN cracker | The bunker's original Cold War safes; the workshop where the crackers are made (row 29). | m09 |
| Fingerprint kit | The plant room's reader; Voltage's print on the bypass as proof (on that branch). | m04, m08 |
| Social engineering | Talk past Hollis or Reeves; talk Gary round; stand Voltage down; the stand-off with Victoria; Ghost on a terminal. Every one has a fight-or-sneak alternative. | m01 on |
| Encoding (CyberChef) | Asante's or Mercer's schedule notes; the correction on the casualty sheet. | m01 on |
| Correlation | The security office's door log against the raid team's badges: the in-mission way to catch the sleeper. | m08 door audit, m09 ledger |
| Combat | Guards, the plant, the sleeper at the core if uncaught. Knock-outs throughout; lethal force only as an ending choice. | m01 on |
| Optional console tasks | Close the backdoor channel (server hall), kill the story (media room). They lower the cost; they never gate the ending. | m07 triage |
| The argument | Tesseract's case and the player's answers (FINALE_ARC §4.1): earned points from the mission and from the record. | m07 Mercer, m08 Nightshade |
| The choices at the core | Stop or hear the offer; secure, disclose or wipe both; arrest, talk down or lethal force (FINALE_ARC §4). | every mission's endings |

### 2.3 Hybrid workflow

Briefing at the forward post (Netherton, HaX, the raid team; Nightshade at the door on that branch) → **flag 1** from outside: cameras and doors → gate and tunnel (Hollis or Reeves, or the defaults) → the blast door, keyed to open for Agent 0x00 by name → security office: the player's photo on the wall, the door log → workshop floor and plant room (Gary, Voltage, Vance or Elena on the phone) → server hall: **flag 2**, the schedule and the channels; optional backdoor task → media room (optional) → gallery (Victoria, or two guards) → the core's outer lock (picked, cloned off a gallery guard, or opened by a recruited Victoria who holds) → the core's antechamber, where the release host's terminal is: **flag 3** opens the inner door, **flag 4** gives the database → the core: Tesseract (FINALE_ARC §4.1) → endings → epilogue → teaser slot → credits.

## 3. ENTROPY cells

### Selected: the Architect's workshop, all cells present

**Why.** Tomb Gamma is where "everything the cells field has been through first" (m07 dossier). A season finale should put the player in a room with the whole organisation's machinery, and the Publication is the one operation every cell has a stake in. Each cell is present through a person the player's history decides, or through its default stand-in (FINALE_ARC §5.3).

| Cell | In the bunker | Through |
|---|---|---|
| The Architect (mastermind) | in person, at the core | every player |
| Critical Mass | the power plant; the release schedule | Voltage and Static, Mercer; or plant technicians and Asante |
| Zero Day Syndicate | the gallery: their representative at the Publication | Victoria Sterling, or two guards |
| Ransomware Incorporated | on the network | Ghost |
| Social Fabric | the media room | its crew, when Fracture was uncovered |
| Supply Chain Saboteurs | the Trojan Horse backdoor as a release channel | when Austin was uncovered |
| Insider Threat Initiative | the sleeper on the raid team; Gary recruited | Wierzbicki; Gary on that branch |
| Crypto Anarchists | the reserve bank paying for the servers | the ledger (row 79); nearly empty on a freeze |

**Mastermind involvement:** major, in person for the first time.

**Philosophy in play.** "Entropy is inevitable. Systems decay. I merely publish the schedule." The Publication is that line made literal, and his casualty sheet is the true believer's spreadsheet (FINALE_ARC §1.2).

**Previous operations.** All of m01–m08.

**What survives.** Off-screen leaders (Michael Reeves, Jennifer Walsh, Marcus Ashford), Zero Day's 0day, the Recruiter: named in the closing card by branch, left for a later season.

## 4. Theme options

The premise is fixed by FINALE_ARC §1.3 and §4; the options differ in how the raid is staged.

### Option 1: The Siege

**Logline.** Task Force Null goes into a Cold War bunker in the Montana hills the night before the Architect publishes every weakness SAFETYNET ever catalogued, and the faces from eight missions are waiting inside.

**Setting.** A 1960s command bunker on federal land, sold off in the nineties, refitted with the stolen money (m02's ransom, m06's fund): gatehouse, blast-door tunnel, security office, power plant with old switchgear and a battery room, a workshop floor, a server hall in the old command room, a media room, a gallery above the core, the core itself. Cover: a private data-storage company with a fence and a sign. Atmosphere: concrete, sodium lamps, the hum of a plant that was built for the end of the world.

**Inciting incident.** m09's flag 4 gave the hour; Tesseract's call to HaX gave the invitation ("Bring 0x00. I've kept a door."). Netherton signs the raid.

**Stakes.** Personal: the player's own record argued back at them; a sleeper beside them; HaX facing her teacher. Organisational: SAFETYNET's whole map of weaknesses, and whether the service keeps hoarding it. Societal: 1,100–2,600 projected dead in the first month if it goes out; eleven counties' dispatch already failing on some branches. Urgency: 06:00 UTC.

**Central conflict.** Getting in is the player against a fortress; the core is the player against an argument they half agree with.

**Arc.** Act 1: the forward post, flag 1, the gate and the tunnel. Act 2: the bunker's floors and the people in them (by branch); the schedule; the sleeper. Act 3: the core, Tesseract, the choices, the ending.

**Key NPCs.** Tesseract; HaX and Netherton; Quintero and Wierzbicki; Asante; returning faces by branch (FINALE_ARC §5).

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

**Option 1, The Siege**, with two pieces of Option 2: the keyed door that opens for Agent 0x00 by name, and a short stretch before the core where Tesseract's jamming drops HaX's line and the player walks the gallery alone; the line comes back at the core's door. The Siege is the only option that puts the player's history in the building as people, which is what the user asked the finale to do. The quiet stretch keeps the confrontation personal.

## 6. Initialisation summary

**Scenario:** m10 *Tomb Gamma*. Tier 3, 60–75 minutes. The Architect's workshop, every cell present. Raid and confrontation (§1).

### Technical challenges summary

1. **Security system foothold (VM flag 1)**: cameras, doors, and the log that can catch a traitor.
2. **The release pipeline (VM flag 2)**: the Publication's schedule and channels; optional work to shrink the cost.
3. **Out of the box (VM flag 3)**: from the boxed release service onto the host that runs it.
4. **The core host (VM flag 4)**: the stolen copy and the line into the Citadel.
5. **The disclosure question**: secure, disclose or wipe; argued with the man who started it, and decided by the player.

### Recommended theme

Option 1, The Siege, with the keyed door and the quiet gallery from Option 2 (§5). Alternatives: The Invitation, Two Fronts.

### Next steps

- Stage 1–2: Tesseract's case (one line per import value, FINALE_ARC §2), the talk-down, each ending's scene, HaX's last word.
- Stage 3: the core's three choices and the Join signposting (FINALE_ARC §4.1–4.3); the sleeper; Gary, Voltage, Victoria.
- Stage 4: the aims below; the clock.
- Stage 5: forward post, gatehouse, tunnel, security office, plant, workshop, server hall, media room, gallery, antechamber, core, service tunnel. Every presence slot has its default occupant (FINALE_ARC §5.3).
- Haiku VM plan: fit the modules to §2.1, adding the entry stage.

### Design notes (m01/m02 standard, `mission-alignment-plan`)

- **Opening and closing.** Briefing cutscene at the forward post with `skipIfGlobal`; the raid team by branch. Closing: one scene per ending, the closing card, the teaser slot (default off), credits; `bond_visualiser` conclusion on every ending, MISSION FAILED styling on Join (as m01's launch).
- **Aims, staged and spoiler-safe.** 1 Breach the perimeter (flag 1). 2 Get below ground (gate, tunnel, security office). 3 Find the release (server hall, flag 2; optional: close the backdoor, kill the story). 4 Reach the core (gallery, outer lock, antechamber, flags 3–4). `missionConclusion`: the core. `concludeRequires`: the four flags only. The endings are globals the debrief reads, not tasks.
- **HaX's hub, progress-gated.** From the forward post and on the line: the door log after flag 1 (the sleeper nudge), each returning face as the player meets them, the channels after flag 2, "what the line means" if m09 didn't play it, Tesseract after the core opens. Field-guide offers gated per VM stage. Silent in the gallery stretch.
- **Music.** Cutscene at the forward post; a driving raid track; threat on hostiles; the clock's last minutes; silence in the gallery; a held, low cue at the core; one track per ending's close (victory for the successes, a cold variant for Scorched Earth and Join).
- **KO resilience.** Every NPC in the bunker can be knocked out with the route intact; Tesseract cannot be knocked out before the core's choices (he is seated behind the console, and the core sequence is a conversation), so the endings always run.
- **Carry-overs.** All imports and their uses: FINALE_ARC §3.2; exports for a later season: §3.5. No import gates completion.
- **Spoken lines.** Tesseract's lines per import value are fixed strings; no printed variables.
- **Violence.** Knock-outs; lethal force as one narrated line in one ending; Quintero wounded, never killed.

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
- [x] The Architect's workshop justifies every cell being present (§3).
- [x] Pays off every earlier cell's thread through a person or a default.

**Theme**
- [x] Challenges feel necessary: each flag opens the next floor.
- [x] Stakes are specific: 1,100–2,600; dispatch in eleven counties; the database.
- [x] Villain with a spreadsheet and a monologue that is a real argument.
- [x] Evidence discovered in play (the casualty sheet and its correction, the door log, the schedule).
- [x] Endings decided by the player, signposted, never traps (FINALE_ARC §4.3).

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
- [x] Every presence import has a default occupant.
- [x] Violence at TV level.
