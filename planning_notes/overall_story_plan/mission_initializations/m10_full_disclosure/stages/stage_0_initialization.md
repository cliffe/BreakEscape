# Scenario initialisation: m10 Full Disclosure (`m10_full_disclosure`)

Stage 0. Author: stage-0 author (Opus), 2026-10-20. Status: round 1–4 findings folded in (FINALE_ARC §10–12, §14); stage 1 handover in FINALE_ARC §13; stage 0 complete. Renamed from the working id `m10_final_cipher`. Stages 1–2 changes swept in by the arc-keeper, 2026-10-21 (FINALE_ARC §15; the "s0" column of `stage_1/story_arc.md` §14). Where this file and the stage 1–2 documents still differ, those documents win. Stage 3 (`stage_3/moral_choices.md`, closed 2026-10-21) folded in on 2026-10-21 by the m10 author (its §14 changes that touch this file; the log is in `stage_1/story_arc.md` §19). From stage 4 on, stage 3 is the authority for every choice, cost and global. The stages 0–3 milestone fixes and the simplification pass were swept in on 2026-10-21 by the m10 fixer (log: `stage_1/story_arc.md` §20). Stages 4–5 (`stage_4/objectives_tasks.md`, "OT"; `stage_5/room_layout.md`, "RL"; closed 2026-10-21) were folded in the same day (their S4-/S5- changes that touch this file; log in `stage_1/story_arc.md` §21). From stage 6 on, OT and RL are the authority for aims, tasks, rooms, locks, positions, the clock and the wiring.

Shared design for both finale missions: `../../finale/FINALE_ARC.md` (premise §1, threads §2, imports §3, endings §4, cast §5, flags §6, teaser §7, risks §8). This file does not repeat it.

## 1. Overview

- **Title:** *Full Disclosure* (the user's choice, 2026-10-20). It names the finale's argument (hoarding, coordinated disclosure, full release) and the Publication itself. The irony is kept, but the mission says once, at the briefing, that real full disclosure (one researcher, one flaw, after the vendor stops answering) is not the Publication (every weapon at once), and the player's own option is named coordinated disclosure on the button (D-02; FA §1.2). Id `m10_full_disclosure`, under the rename rule. The bunker keeps its name, Tomb Gamma.
- **Target tier:** 3.
- **Estimated duration:** long, about 105 minutes end to end, ceiling 110 (the old outline's 90–120; m07 ships at 90). The media room is cut now (milestone D-05), the 06:00 walkabout is three people and the close is budgeted at about 8 minutes; first-time players run 105–110 (`stage_1/story_arc.md` §2).
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

Flag 1 at the forward post's gate terminal; flag 2 at the server hall's release console; flag 3 at its own station at the sealed section's hatch, the hall's east end (it arms the disarm, which the player carries to the core); the gallery stair opens only on flags 2 and 3 and the shutter cut (OT §4.4); flag 4 at the core's host terminal, after Tesseract has greeted the player and HaX (he pauses nothing: "It goes at six whatever we say."). Four stations, one flag each (RL §2). The core holds one flag and the conversation, and his case waits for all four flags, so in practice for flag 4.

### 2.2 In-game challenges

The finale adds no new kit. It asks the player to use all of it, in one place, under a raid clock that never fails them and holds still while they talk at the core.

| Challenge | Where and why | Builds on |
|---|---|---|
| Patrolling guards and stealth | The tunnel post (a timing pass or a talk in a one-room-wide corridor), the security office's patrol, the server hall's two patrols, the gallery (a talk or a fight, never stealth; RL §2.2, §2.7). The security office's second guard is gone on `m06_assets_seized`. | m02 on |
| Lockpicking | The shift fitter's locker in the security office, which holds a spare power-room card: the no-talk route through the workshop is a return trip here (RL §2.3; S5-10). | m01 on |
| RFID cloning | Imran's card on the workshop floor (or unprotected Gary's), for the power-room door; not on Ghost's watched branch. | m03, m08 |
| PIN cracker | Kowalczyk's own, issued again in the start kit on every branch (inventory doesn't carry). The core's outer lock, a PIN keypad, cracked while the lock guard's drawn sight cone is off it; the records cupboard in the security office; the workshop where its casing was made (row 29). | m09 |
| Fingerprint kit | The outer lock's keypad plate, on every save: dusted, it shows the four worn keys and the cracker finishes quickly; the power room's bypass panel on the escaped-Voltage branch, where his print matches the one lifted in m04 (RL §2.5, §2.7; S5-11, S5-12). | m04, m08 |
| Social engineering | The five full scenes (FINALE_ARC §5.3), each with one decision after the talk and a face-to-face beat on every branch, defaults included (stage 3 §3): the door slot at the forward post (Nightshade: shown his file, stay at the post or come and hold the outer lock; not shown, his map or Helena's plans, with a payment to check; arrested, the deal he was refused in m08; silent, one word and Netherton's tether decision); the workshop (protected Gary is at the door while the player talks round or takes in Imran Siddiqui, whom he trained; unprotected Gary is talked round, left in place or cuffed; by default Imran alone); the power room (captured Voltage is placed there after the breach and works his switchgear or talks the player through it; escaped Voltage stood down by his print or the sheet, or fought; by default Wendell Briggs, told the truth, which sends a warning call through the bunker's switchboard, or worked round); the gallery, two options per branch at most (Victoria, or Vos; recruited Victoria goes with whoever is winning, confront or trust; escaped Victoria's terms for walking out; arrested Victoria rings on a secure line in the server hall, optional, and her information is used on Vos automatically; Vos's own trade by default, deal or no); Ghost on the security office's duty handset, answered when the player clicks it (talk Ghost out of selling the head start, or let the sale run to see who buys; refused Ghost asks why and gives a gift, the outer lock's code or the lock guard's name; kept Ghost asks one question and gives the records cupboard's code). Also Asante. One non-HaX voice on the line per room; the raid net counts as HaX's. Every scene has a fight-or-sneak alternative, and every holder of a forced face-to-face scene is `koImmune` (RL §2; stage 3 rule 1.10). | m01 on |
| **The whodunit** | One of the raid team is WREN (m09); the player is told privately at the van end after the briefing, never in front of the team. At 01:58, at the kit check, WREN copied Malhotra's badge with a cloner from the breaching case. At 02:10, before the breach, the team was split: Quintero and Kowalczyk on the service tunnel recon (both branches of its fork come out by the service door), Arakawa at the gate beside the player on a call to his daughter, Malhotra on comms with HaX at the van end, Vector and Phantom with Netherton. Three clues across the bunker: the door log shows Malhotra's badge at the core's service door at 02:10 (the readers take SAFETYNET badges because Tesseract loaded them from the vault's personnel index, taken with the database (M-04); the door's camera is a dummy); the alibi, which clears Malhotra, Arakawa, Vector and Phantom; the workshop bench's record of a cloner shipped "to WREN" in the breaching case, crossed with the case's sign-out sheet (Kowalczyk and Arakawa). The cracker is a suspicion beat and the accusation's last card, not a clue. Nightshade or m09's shortlist replace clue 2, Phantom's list clue 3. **Accusing is a real choice**, face to face or on the line: right, she is held (four cards); wrong, the innocent officer is led off with a line, the team loses that officer's job, and Netherton recalls them once the player holds the clearing evidence (one wrong accusation live at a time); none, she acts at the core. Skipped entirely if m09 already named her, and on m09's double-cross branch, where she walked off in Helena and waits at the core beside Tesseract (FINALE_ARC §4.0, §4.4; stage 3 §5). | m08 door audit, m09 ledger |
| **Victoria's offer** | Recruited: she offers to open the outer lock, and goes with whoever is winning (safe to trust once Zero Day's share is dead). Confront her with Zero Day's order from the schedule, or trust her; left unanswered, she is refused by default. Escaped: a talk-down (with the m03 threat) or a trade for walking out (without it). Arrested: an optional secure line in the server hall after flag 2, with Vos's weakness (he resells Zero Day's early access), used on Vos in the gallery automatically. | m03 |
| **The head start** | Always set for 04:00; flag 2 is where the player finds it. At the server-hall console the player can kill one share or trace one (kill Zero Day's; kill Ghost's buyers' where Ghost sold; or let Zero Day's run and trace who gets it), never both; a share can also be stopped in its scene; whatever is live goes as the outer lock opens (HaX warns after flag 2 and as the player leaves the server hall; the gallery door opens only on flags 2 and 3 and the shutter cut), and Tesseract says what went as the player walks into the core, then HaX on her return (OT §4.5). A countdown object in each of the eight rooms shows the time from one string global, `raid_clock`, moved only by story events (`t0145` briefing, `t0200` the split, `t0210` Arakawa's call, `t0220` the pair back, `t0230` the breach, `t0245` security office, `t0300` workshop, `t0315` power room, `t0330` server hall, `t0345` leaving the hall, `t0400` the outer lock, `t0600` the 06:00 scene; OT §6), never by wall-clock time, and from flag 2 two status lines, one per share ("ZERO DAY: LIVE / STOPPED / TRACED / RELEASED", "SECOND BUYER: LIVE / STOPPED / NONE / RELEASED"; a traced share that went reads "OUT, TRACED"); HaX's hub has "[What's still live?]" (D-03). Object text reading a global works today (`observationVariants` / `textVariants`). | m07 clock |
| Encoding (CyberChef) | Asante's or Mercer's schedule notes; the margin note on the casualty sheet (the sheet itself, a later printing with Asante's correction and his second signature, is on the workshop's critical path; the decode names her and sharpens the talk-down rebuttal). | m01 on |
| Combat | Guards, the power room, Mercer if at large, the sleeper at the core if uncaught. Knock-outs throughout; lethal force only in the endings, in two signposted versions (F11): justified when he makes a move that threatens lives (his hand to the console), and a separate, labelled, confirmed cold choice. | m01 on |
| Optional console tasks | Close the backdoor channel (server hall). It lowers the cost; it never gates the ending. (The media room and its "kill the story" task are cut; Social Fabric's story is a prop in the server hall.) The schedule shows what is in the first batches, in plain words. | m07 triage |
| The argument | Tesseract's case (the Publication, the offer, then his evidence with three record lines), then three exchanges: four fixed slots each, with one matching rebuttal from the mission, up to two from the player's record, and decoys of the same length that answer a different question. Two of three to win; a miss is visibly a miss; no fixed button strategy wins on a cold start (FINALE_ARC §4.1). | m07 Mercer, m08 Nightshade |
| The choices at the core | All ink in his conversation; his key console is a prop, and Join's key confirmation is an ink choice (RL §2.8, §6 item 45). Stop, or "Show me how it works"; secure, disclose or wipe both, each with its cost to strangers said first (disclosure at its real speed: acknowledged tonight, fixed in about ninety days, a year to fit); then surrender (a deal: cells, and no public trial), arrest (a public trial, and no cells; with the justified lethal moment if he moves), or the labelled cold choice (FINALE_ARC §4; stage 3 §6, user decision F13). | every mission's endings |

### 2.3 Hybrid workflow

Briefing at the forward post (Netherton, HaX, the raid team, Quintero's objection; WREN detained here if m09 took her name (`m09_recruiter_offer == "taken"`; the double-cross checked first, MS-03), or an empty place at the table on m09's double-cross; the cold-start version, with who Tesseract is, for a player who skipped m09), then the private aside at the van end (WREN is on this team) → the door slot's full scene, closed by one choice at the table before the breach → **flag 1** at the gate terminal (HaX asks the player to start the gate console before the table, so it boots during the door scene) while the pre-breach split happens around the player: the split starts on the second of the table and the gate console's first use, then Arakawa's call (02:10), then the recon pair back (02:20) once his call and flag 1 are both in (events, not timers; OT §6): cameras, doors, the door log → the breach at 02:30, once the table, flag 1 and the pair back are all done (HaX's short voiced call carries Netherton's "Breach. Go.") → the blast door, keyed to open for Agent 0x00 by name → blast-door tunnel (Reeves on the rota sheet, by branch; on the tripwire, the guard post's ladder) → security office: the player's photo on the wall, Hollis on the duty board (by branch), the door log (clue 1), Ghost on the duty handset, which rings as the player enters and opens when they click it (the stair down opens when the call is answered), the records cupboard (a PIN lock; Ghost's or Vector's code, or the cracker; the gallery rota inside names the lock guard) and the shift fitter's locker (pickable; a spare power-room card) → workshop floor (Gary, or Imran Siddiqui; the corrected casualty sheet; the bench log, clue 3; the power-room door by a talked-round technician, a cloned card or the fitter's spare) → power room, on the main path (Voltage escaped or captured in person, or Wendell Briggs with a voice on the phone, which rings for a by-hand cut; cut the gallery's shutter) → server hall, a 4×2 command room (Asante or Mercer; arrested Victoria on the secure line, after flag 2, optional): **flag 2** at the release console (the schedule, the channels) and **flag 3** at the sealed hatch's own station at the hall's east end (the disarm armed; HaX points at the hatch before it); the console: kill one share of the head start or trace one; optional task: close the backdoor; Kowalczyk peels off (a room earlier, at the security office, when Arakawa is tethered to the blast door); Social Fabric's story on the uplink printer (a prop; the media room is cut); leaving the hall, HaX's sweep line → HaX's last line before the jam → gallery, a straight walkway, alone (Victoria or Vos), open only on flags 2 and 3 and the shutter cut → the core's outer lock at the walkway's east end, a PIN keypad with five ways through (the cracker while the lock guard's drawn cone is off the keypad; the dusted keypad plate and the cracker; the code card the guard carries, dropped, given by Vos, or given by the guard himself once the player can name who sent them; opened from inside by a Victoria who holds or a Vos who stands aside; Ghost's maintenance code), all caught by one `outer_lock_open` global (OT §4.5); every live share of the head start goes as it opens; Quintero holds it (a taken-in Nightshade holds it behind the player) → the core, east of the gallery: his first line says what the lock released; HaX returns inside his conversation; no pause ("It goes at six whatever we say."); **flag 4** at the host terminal; then his case (on all four flags), the three exchanges, the choices (FINALE_ARC §4.1) → the ending's beat → his conversation closes and the closing scene opens: the forward post at 06:00 (a cutscene; on Scorched Earth the hearing follows it; on Join, the Citadel) → `close_the_night` on the last scene's last line → conclusion screen → closing card → teaser slot → credits (OT §4.7, §7). The accusation can be made any time after clue 1, face to face or on the line.

## 3. ENTROPY cells

### Selected: the Architect's workshop, all cells present

**Why.** Tomb Gamma is where "everything the cells field has been through first" (m07 dossier). A season finale should put the player in a room with the organisation's machinery, and the Publication is the one operation every cell has a stake in: the cells get the database two hours early, pushed from the core at 04:00 UTC, as their reward for the theft (FINALE_ARC §1.2). Each cell staged here is present through a person the player's history decides, or through its default stand-in (FINALE_ARC §5.3). Two cells the player met in m07 are not staged and appear only in the closing card.

| Cell | In the bunker | Through |
|---|---|---|
| The Architect (mastermind) | in person, at the core | every player |
| Critical Mass | the power room; the release schedule | Voltage (and Static), Mercer; or power-room technicians and Asante |
| Zero Day Syndicate | the gallery, for the head start | Victoria Sterling, or Pieter Vos, who took her desk |
| Ransomware Incorporated | on the network, selling the head start on | Ghost, for every player |
| Social Fabric | the server hall's uplink printer (the media room is cut) | its story, a prop; run from outside on uncovered Fracture (`m07_completed`), held otherwise; no crew in the bunker |
| Supply Chain Saboteurs | the Trojan Horse backdoor as a release channel | when `m07_completed and (m07_team_assignment != "trojan_horse" or m07_team_redirected)` |
| Insider Threat Initiative | WREN on the raid team; Gary recruited | Halina Kowalczyk; Gary on that branch |
| Crypto Anarchists | the reserve bank paying for the servers | the ledger (row 79); nearly empty on a freeze |
| Ghost Protocol (Michael Reeves) | not staged | closing card and credits, by whether Fracture was covered, named by its leader ("Michael Reeves's cell") so it never sits beside Ghost's 06:00 text |
| Digital Vanguard (Marcus Ashford) | not staged | closing card and credits, by whether Meltdown was covered, named by its leader |

**Mastermind involvement:** major, in person for the first time.

**Philosophy in play.** "Entropy is inevitable. Systems decay. I merely publish the schedule." The Publication is that line made literal, and his casualty sheet is the true believer's spreadsheet (FINALE_ARC §1.2).

**Previous operations.** All of m01–m08.

**What survives.** Off-screen leaders (Michael Reeves, Jennifer Walsh, Marcus Ashford), named by leader in the closing card and credits; Zero Day's 0day; the Recruiter, who has no card line and gets one "Elsewhere" clause in the credits per `m09_recruiter_offer` value (MS-04). All left for a later season.

## 4. Theme options

The premise is fixed by FINALE_ARC §1.3 and §4; the options differ in how the raid is staged.

### Option 1: The Siege

**Logline.** Task Force Null goes into a Cold War bunker in the Montana hills the night before the Architect publishes every weakness SAFETYNET ever catalogued, and the faces from eight missions are waiting inside.

**Setting.** A 1960s command bunker on federal land, sold off in the nineties, refitted with ENTROPY's money. Eight playable rooms in one corridor, in this order (RL §1): forward post (4×2, the gate in view), blast-door tunnel (2×1), security office (2×2), down the stair to the workshop floor (2×2), the power room with old switchgear and a battery room (2×2), the server hall in the old command room (4×2, the largest room and the act's centre), the gallery (2×1, a straight walkway east of the hall, with slit windows down into the core), and the core (2×2, east of the gallery). No ninth room. (The media room was cut in the milestone pass, D-05.) The service tunnel is a cutscene; the core's service door and the guard post's ladder are objects. Cover: a private data-storage company with a fence and a sign. Atmosphere: concrete, sodium lamps, the hum of a plant that was built for the end of the world. Draft maps are m04's `room_aes_*` and m07's `room_pnw_*` at final size; three new maps (forward post, gallery walkway, core) and a dressed or new server hall come at dressing, with bunker-specific props first on the reused maps (RL §2; S5-7).

**Inciting incident.** m09's flag 4 gave the hour; Tesseract's call to HaX gave the invitation (as m09 reports it: he called her Ninety-nine, said the door will open for 0x00 by name, and told them to take their time getting there; MS-18). He needs a SAFETYNET hand on the key, and his file says it will be 0x00's (FINALE_ARC §1.2). Netherton signs the raid knowing it is an invitation.

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
- Stage 3 (done, `stage_3/moral_choices.md`, closed 2026-10-21; milestone pass the same day): 16 choices (nine dilemmas; C11 retired with the media room), ten forced for every player, about 18 picks on a rich save; every option's gain and cost and who says it first; the core's four menus with a resume rule; KO immunity by engine trial with KO safety nets as the fallback (since stages 4–5, static `koImmune` on every forced-scene holder and on Tesseract, nets dropped); the double-cross branch; the fixed cells rule; m10 imports 85 (Tier 1 40, Tier 2 45, after F16's knock-out pattern and M-12) plus nine `completed`; a stage 8 test plan of 35 runs, about 15 hours (three end to end, the rest act-start segments on the F15 bootstrap); FINALE_ARC §13 items 11, 14, 24, 25, 27–29 and 33–38 settled.
- Stage 4 (done, `stage_4/objectives_tasks.md`, closed 2026-10-21): six aims and an optional WREN aim, 28 tasks; the story-door pattern (an RFID lock no card opens, unlocked by HaX's `unlockDoor` mapping); the `raid_clock` steps and the eight countdown objects; HaX's hub by progress; the closing chain; the per-beat budget (105, the VM's 32 minutes still estimates until a timed run before stage 7); the 35 runs as bootstrap starting states; about 85 voiced phone lines under F20.
- Stage 5 (done, `stage_5/room_layout.md`, closed 2026-10-21): the eight rooms in §4 Option 1, positions, the lock graph, the kit's uses, the forty Tier 1 imports by room, engine verdicts. Every presence slot has its default occupant (FINALE_ARC §5.3).
- The VM plan (`../../finale/FINALE_VM_PLAN.md`, an `opus48` agent's) fits the modules to §2.1, adding the entry stage (MS-08).

### Design notes (m01/m02 standard, `mission-alignment-plan`)

- **Opening and closing.** Briefing cutscene at the forward post with `skipIfGlobal`; the raid team by branch and in position; WREN detained on screen on `m09_recruiter_offer == "taken"` (not on `m09_sleeper_named` alone, which is also true on the double-cross; MS-03); the private aside at the van end; a never-played-m09 version with the three facts, the third at the aside (FINALE_ARC §4.0). Closing: one scene per ending at the core, then the forward post at 06:00 as a cutscene (the Citadel on Join), then the conclusion screen (`bond_visualiser` on every ending, MISSION FAILED styling on Join, as m01's launch), the closing card (five lines at most), the teaser slot (default off; skipped after Join and the executed ending), and the credits ("In this operation", "Elsewhere", SAFETYNET, in memory); about 8 minutes from the ending's beat. The order at the end (OT §4.7, §7; m08's): the pick sets `ending`; the ending's beat plays inside his conversation; when it closes, the closing scene's own NPC opens the scene (the 06:00 cutscene; on Scorched Earth, the hearing chained after it; on Join, the Citadel); the last scene's last line completes `close_the_night`; its close plays the ending's track and carries the card and credits (the F14 `closingCard` / `section` format; D-09); then the visualiser runs card, teaser, credits.
- **Aims, staged and spoiler-safe** (OT §2). 1 Breach the perimeter (the briefing, the table, flag 1, the blast door). 2 Get below ground (the security office, the duty handset, the stair). 3 Cut the gallery's power (workshop, power room; the casualty sheet and its margin note optional). 4 Find the release (server hall, flags 2–3; optional: the console's kill-or-trace, close the backdoor). 5 Reach the core (gallery, outer lock, flag 4, hear him out). 6 End it (`missionConclusion`: his console, the database, his end, the report at the forward post). Optional, opened at the private aside: find the sleeper. `concludeRequires`: the four flag tasks only. The endings and the accusation are globals the debrief reads; the `end_it` tasks complete on any ending.
- **HaX's hub, progress-gated** (OT §5 has the topics, their gates and the "[Where are we?]" ladder; the briefing's question hub now lives here, S4-6). From the forward post and on the line: a nudge after each whodunit clue; the fence and the empty posts on `m06_assets_seized`; the power room after flag 1 ("Whoever's in the power room runs your lights."); the head start when flag 2 goes in, the "[What's still live?]" topic from then until the jam (D-03), and on leaving the server hall the console warning and the 06:00 sweep line (D-04); the sealed section's hatch before flag 3; "Get on his box. He'll keep." at the core, and the field-guide offer still working there; the unsent notice off his box at flag 4 on a cold start; each returning face as the player meets them, the channels and the schedule's contents after flag 2, her doubt about Victoria before the gallery, Tesseract after the core opens. Her nudges after the clues never name a suspect. Field-guide offers gated per VM stage. Silent in the one-room gallery stretch, after a last line that names the next door.
- **Music.** Cutscene at the forward post; a driving raid track; threat on hostiles; the countdown's tension rising with each story beat; true silence in the gallery (F10's `silence` playlist, committed); a held, low cue at the core, stepping down on each landed point, silence on the second; one track per ending's close, carried by the closing scene's music entry (`victory` for arrest, surrender and justified lethal; `end` for Scorched Earth, the executed ending and Join). OT §7 has the trigger table.
- **KO resilience.** Every NPC in the bunker can be knocked out with the route intact, the raid team included (a downed raid member is held at the forward post; it is not an accusation, and costs an epilogue line); every knockable slot-holder has a non-talk way past (RL §3). The holders of forced face-to-face scenes (Nightshade, Netherton, Malhotra, HaX in person, a captured Voltage, the taken-in Nightshade) are `koImmune`, a static key that works today, so their `npc_ko` nets are dropped (S5-8). Tesseract is `koImmune` for the whole core scene (S4-8), and his knock-out fallback (the hand disarm, the database menu at the host terminal, "[Cuff him.]") is withdrawn: every ending is reached through his conversation (FINALE_ARC §4.1).
- **Carry-overs.** All imports, tiered, and their uses: FINALE_ARC §3.2; exports for a later season: §3.5. No import gates completion. Tier 1 is built and playtested first.
- **Spoken lines.** Tesseract's lines per import value are fixed strings; no printed variables.
- **Violence.** Knock-outs; lethal force as one narrated line in each of two endings (F11): justified, only when he makes a move that threatens lives and never after a successful talk-down; cold, a separate, clearly labelled, confirmed choice (`executed`; "Lower the weapon." removes it for the rest of the scene); Quintero wounded, never killed (and nobody wounded at the core on m09's double-cross branch).
- **Phone scenes.** Ghost's call is answered, not sprung (OT §4.2): a bark says the duty handset is ringing as the player enters the security office; a click on the handset opens the call (`resume: true`), and re-entering the office re-rings it; the stair holds the player until it is answered. Codes said on a call go into the notepad (`#add_note`). Arrested Victoria's line is optional with a warned cost: one re-ring at the server hall's exit to the gallery stair, never into the gallery (stage 3 §3.5). The by-hand cut's phone voice rings on a stated trigger and re-rings on entering the power room (OT §4.9).
- **Voiced calls** (F17, F20; OT §13). Forced phone calls are voiced, and only what a voiced call opens is voiced (its knot and diverts up to the hub; hubs, topics and texts stay text): Ghost's handset (about 33 lines), arrested Victoria's line (9), the by-hand cut in three voices (24), and HaX's breach call, door calls, `gallery_open` and flag 4 lines (19): about 85 in all. The two 06:00 texts stay unvoiced.

## 7. Quality checklist

Checked against the 00 prompt's list and the alignment rubric. Ticks are the author's claim; reviewers verify.

**Technical challenges**
- [x] Each challenge maps to a CyBOK area (§1).
- [x] Tier 3 fits: a staged VM from outside to the core; all kit.
- [x] Clear learning aims (§6 summary); the disclosure question is the educational spine.
- [x] Implementable with existing mechanics; no new kit. The core's choices are ink, the key's confirmation included (his key console is a prop). The engine features this needs (F17 voiced calls, F18 reward door sprites, F19 `unlockDoor`, F10 `silence`) are committed (RL §6).
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
- [x] Mid-mission choices for every player: the door, Ghost, the workshop, the power room, the console and the gallery, each with a cost said first; the accusation (stage 3 §2).
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
- [ ] In-game challenges teach skills the VM needs (or the reverse): partly. Flag 3 is submitted at the sealed section's maintenance hatch, its own station, which HaX points at before flag 3: a physical echo of getting out of a container, at game-design level only. Owner: the lab sheet.
- [ ] Flexible learning paths (labs done separately): open. Owner: the lab-sheet stage (the VM-steps companion sheet).
- [ ] Scope achievable in about 105 minutes, ceiling 110: tight (four flags, five scenes, a three-clue whodunit, a core of about 32 minutes with flag 4). Stage 1 set the act figures (25 + 40 + 32 + 8 = 105 after the milestone pass cut the media room and budgeted the close at 8) and the cut order; stage 4 set the per-beat figures (OT §8), with the VM's 32 minutes estimated from m07/m08 until a timed VM run before stage 7 (M-14 open); worst real save about 109.

**Alignment rubric (m01/m02)**
- [x] Canon and stakes; staged aims; HaX's progress-gated hub; music; KO resilience; bookends and `bond_visualiser` (§6 design notes).
- [x] Rooms and layout: stage 5 (RL); door alignment and `predict_door_sides.py` re-run on the 4×2 hall at stage 9.
- [ ] Field guides mapped to real lab sheets: after the VM plan.

**Finale rules**
- [x] No eldritch content; the teaser slot is empty and off by default (FINALE_ARC §7).
- [x] No import in `concludeRequires` or an `unlockCondition`.
- [x] Every presence import has a default occupant, and every present or penalising value that equals a default also needs that source's `completed`.
- [x] Violence at TV level.
