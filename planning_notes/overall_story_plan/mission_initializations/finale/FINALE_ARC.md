# Finale arc: m09 and m10

Stage 0, shared document for both finale missions. Author: stage-0 author (Opus), 2026-10-20. Status: round 1–4 findings folded in (§10–12, §14); stage 1 handover in §13; stage 0 complete. Stages 1–2 changes from both missions folded in by the arc-keeper, 2026-10-21 (§15); stage 3 starts from this version.

Inputs: `docs/agents/FINALE_BRIEF.md`, the two carry-over inventories in this folder (A: m01–m04, B: m05–m08), `season_1_arc.md` Missions 9–10 (old intent only), `the_architect.md` identity section, m08's closing debrief ink. Per-mission stage 0 files point back here rather than repeating it:

- `../m09_digital_archaeology/stages/stage_0_initialization.md`
- `../m10_full_disclosure/stages/stage_0_initialization.md` (folder renamed from the working id `m10_final_cipher`)

The VM plan is written separately (`finale/FINALE_VM_PLAN.md`, by a Haiku agent). This document gives each flag's story meaning and where it is submitted, nothing more.

## 1. The shape of the finale

### 1.1 Where the player starts

m08 ends on day nine after Portland. Nightshade is in police hands, kept as a triple agent, or (rarely) handed over silent after a knock-out. The Global Threat Database, "every vulnerability SAFETYNET has ever catalogued", went to Tomb Gamma. Netherton: "Take your seventy-two hours. Then we go to Montana and we get it back." The coordinate (an old Cold War bunker in Montana) is known on every route except the knock-out before the fate. Nobody has said Tesseract's name aloud since m06, and only a player who opened Satoshi's safe heard HaX say it then, as his 87% guess. A player who asked Netherton about the line in m08 heard him promise not to say a name "until we can prove it"; most players never asked. HaX's last text, on every branch except the knock-out before the fate: "Same classroom, 0x00. Don't ask me whose yet." (That branch opens m09 on Netherton's line instead.)

So the finale owes the player four things: the name, said aloud and proved; the bunker; the database; and a reckoning with eight missions of their own choices.

### 1.2 What the Architect is doing: the Publication

He did not steal the database to sell it. The old outline's "global vulnerability auction" makes him a dealer, and nothing in m01–m08 sounds like a dealer. His last directive ended: "Entropy is inevitable. Systems decay. I merely publish the schedule. -- A." (m07 decode).

**The Publication:** Tomb Gamma gives the whole stolen database away, free, every entry with working detail, in one of two ways. By default it goes out **city by city, starting at 06:00 UTC** on day 13. A key at the core's release console sends **everything, everywhere, in the same minute**, and the key needs a hand on it (m09 §14 change 28). His case is the one he left SAFETYNET over: services like SAFETYNET hoard weaknesses instead of getting them fixed, the arms race speeds up the collapse it claims to prevent, and only a shock everyone feels at once forces the fix. "Let it hurt afterwards, not during" turned inside out: let it hurt now, everywhere, so that afterwards no one can hoard.

**Why he needs Agent 0x00.** The Publication only proves his point if a SAFETYNET agent presses the key: the service that hoarded the map gives it away with its own hand. His file on the player (the Reading, m09) ends with a prediction that 0x00 will be the one. That is why he invites the raid instead of moving the hour, why one door is keyed to the player's name, why he waits at the console and does not fight for it, why he is in no hurry when 0x00 walks into the core ("Take your time. It goes at six whatever we say. Or now, if someone presses this. I'd rather it was you."; he does not pause anything, m10 change 37), and why Join is on offer at all. If nobody presses, the fallback releases the database on its own from 06:00 UTC, city by city. That keeps the clock real for the raid and makes his lesson muddier, and he hates that. His own sleeper on the raid team doesn't count: "When they find out what you are, it proves nothing. It has to be one of theirs." (§4.4; m10 change 27.)

**The cells' share.** The cells get the database two hours early, as their reward for their parts in the theft: the head start is a push from the core set for 04:00 UTC on the raid's countdown. In play it is driven by story events, not wall-clock time (§4.2): it was always set for 04:00, flag 2 is where the player finds it, and it goes as the core's outer lock opens, unless the player stopped it at the server hall or the cells' shares were stopped in their scenes (m10 change 19). That is why Zero Day sends a representative and Ghost is selling the head start on. The bunker's guards are the cells' people, and nobody told them why the door opened for 0x00: "They think you're here to steal their head start. You are."

He has costed it, as he costs everything. His projection, signed in his hand, prices both modes: "Release by key, all cities: 1,100 to 2,600. Fallback by city: fewer, later." That is 1,100–2,600 dead in the first month if the key is pressed, as hospitals, grids and dispatch centres are hit by people who never had the skill before; the fallback kills fewer, and later. "An acceptable price for the last arms race." m09's flag 4 gives the player his original sheet; m10's workshop holds a later printing that carries Asante's correction (the model credits the hospitals' recovery twice, so it understates the dead) and his second signature under the unchanged figure (m09 changes 5, 28; m10 changes 12, 29, 42). That is the escalated canon's true believer with a spreadsheet, and it is also a real argument about vulnerability disclosure, which is the educational spine of the finale (responsible disclosure vs hoarding vs full release).

Why this works for the season:
- It explains the four-site night as theatre for the theft (m08) without retconning m07's "he measured you" reading: both were true.
- It makes the m02 Ghost ("Not the money. The lesson") and the m04 disclosure call into the same argument the player now has with the man who started it.
- It gives Scorched Earth a real logic: destroy both copies and nobody holds the map, SAFETYNET included. (Nobody fixes anything either; §4.5.)
- It gives Join ENTROPY a real logic: a player who agrees with him can press the button.

### 1.3 Purpose of each mission

**m09 Digital Archaeology: the name and the way in.** SAFETYNET has read Tesseract's order, "Burn Helena before the Publication. Schedule attached. -- A.", and let it go on so as not to tip him (m09 changes 2, 9). The day the leave is cut short, the player goes to Helena, Montana, to a commercial records archive that holds the bunker's deeds and construction file. It is also where the Insider Threat Initiative keeps its records, and where the Architect stored the papers of his two closed workshops, Tomb Alpha and Tomb Beta. The player digs through decommissioned records (paper stacks, a tape room, the archive's servers) to (1) confirm the Architect is Dr Adrian Tesseract, from his own hand; (2) find the Initiative's ledger of placements, which names a sleeper inside SAFETYNET; (3) get the plans of Tomb Gamma's defences; (4) learn the Publication's hour. On the way the player finds a flaw SAFETYNET catalogued nine years ago and never reported: one of the holes Critical Mass later came through at Albion (in the plant's control equipment). With it are Tesseract's memo from his last years as chief strategist, arguing it should go to the vendor, and the vendor notice he drafted and never sent. His case is partly true, and the player learns that before he makes it. The player can send the notice now, nine years late (optional; exported as `albion_notified`). The order's destruction schedule, in Sorensen's safe, leaves the tape room off: the server holding his credential, his memo, the hour and the defences is left running on purpose, because he wants to be known and wants them to come (m09 change 2). It ends with Tesseract's first call to HaX, and the raid order.

The night has its own clock: Tesseract has ordered Helena burned before the Publication. The purge is already running when the player arrives: Sorensen is shredding behind the mesh of the restricted cage and Jesse Tran is wiping tapes from the server closet. It moves on story events, not minutes, so being slow at the VM costs nothing. It is visible, and twice the player must save one of two things: at the cage (the other is gone when the cage opens) and at the end of the Recruiter's call (she fires the deck wipe herself as she hangs up, and HaX pulls one tape inside the call). Stopping Sorensen or Tran afterwards saves only what is left on that side (§6.1). Nothing required is ever lost. The raid team is introduced at the m09 briefing, and the ledger tells every player that one of them is a plant.

Feel: investigation under a purge, dread, a building full of other people's secrets including the player's own. Light combat. The player's file is in the archive. About 85 minutes with the field guides, 95–100 without; stage 8's playtests set the published figure (m09 change 14).

**m10 *Full Disclosure* (id `m10_full_disclosure`; the bunker is Tomb Gamma): the raid and the reckoning.** Task Force Null goes into the bunker the night before the Publication. The player's history decides which doors are already open, who is on the inside, who is waiting, and who turns. At the core they meet Tesseract in person, stop or allow the Publication, decide what happens to both copies of the database, and decide how it ends for him.

Feel: the season's biggest set piece, a siege in a Cold War bunker, with faces from earlier missions. Five full scenes run on every combination of choices, with different people by branch (§5.3): the door (Nightshade), the gallery (Victoria, or Pieter Vos), the power room (Voltage, or the technician Wendell Briggs), the workshop (Gary, or the technician Imran Siddiqui) and the network (Ghost). A player who won a branch meets that person as an ally or a prisoner; one who lost meets them as an obstacle. The rest are presences, props and lines. A short whodunit runs through it: which of the raid team is the sleeper, WREN. Not hard: every route works with all defaults, and the carry-overs mostly add help. About 105 minutes, ceiling 110 (m07 ships at 90); the media-room cut is planned unless stage 8's timed playtest comes in under 105 with it (m10 change 34).

### 1.4 Why not the old Tomb Alpha / Tomb Beta premise

The old outline (`season_1_arc.md` ~L815) sends the player to two abandoned bases before Tomb Gamma. Reworked, not dropped:

- m08's last line is "Montana in seventy-two hours. Tomb Gamma." A detour to two other countries' ruins first breaks the clock the player was just given. Helena is on the way: same state, same days.
- Nightshade's go-bag held a one-way ticket to Helena for the morning after Portland (m08). Helena is already in canon as the waypoint to the bunker.
- Two abandoned sites cost two maps for one mission. One archive with the Alpha and Beta material in it (their files, salvaged kit in a storage cage, Tomb Beta's last server racked in the tape room) keeps the archaeology and the history at one map's cost.
- "Everything the cells field has been through Gamma first. Including the people" (m07 dossier). The Initiative's records sitting next to the Architect's own is the "including the people" made physical, and it connects m05's forty-seven and m08's "there may be others" in one room.
- The no-coordinate route (Nightshade knocked out before his fate) gets its fallback for free: the archive holds the deed, so m09 finds the bunker for that player.

### 1.5 Timeline

The Citadel keeps UTC; days count from the Portland order (m08 CONTRACT).

| Day | Event |
|---|---|
| 9 | m08. |
| 10 | Leave starts. |
| 11 | m09: leave cut short when SAFETYNET reads Tesseract's order to burn Helena before the Publication and lets it go on (the courier label names the archive; how the courier was caught, by branch: the Calder Wharf courier account, else the HashChain tags, else the Helena ticket in Nightshade's go-bag). Briefing on the morning of day 11 (UTC). The night operation at the Helena archive is the local night of day 11, which is early day 12 on the Citadel's clock; in-game lines say "on day ten" for WREN's ledger update and "at the briefing" for the morning's events (m09 change 26). Ends with the Publication hour: 06:00 UTC on day 13, about twenty hours after the hangar debrief. |
| 12, night | m10: the raid on Tomb Gamma. The evening of day 12 in Montana; on the Citadel's clock, the early hours of day 13 (about 01:45–06:00 UTC), which is what every in-game screen shows. |
| After | Epilogue in each ending; then the teaser slot; then credits. |

Dispatch in eleven counties has been dropping calls since day nine for every player who finished m07 without covering Austin. That keeps running through both missions and is part of the stakes (§2, m07). A player who never played m07 gets m07's never-played canon (§3): Austin was covered and the dispatch line doesn't run.

### 1.6 Tone and difficulty

TV spy thriller, season finale. Violence at that level and brief: knock-outs, and two lethal-force choices (user decision F11), each described in one narrated line: a justified one when he makes a move that threatens lives, and a cold one offered separately, clearly labelled and confirmed (§4.1 step 5). No eldritch content anywhere, except the optional teaser (§7). Fun and educational, not hard: carry-overs add routes and help far more often than they add obstacles, and every obstacle a carry-over adds has an in-mission way round.

## 2. Thread allocation

One row per decision or thread from both inventories. **Pays off**: m09, m10, both, epilogue (the m10 debrief and closing beats), or dropped (with the reason). **Weight**: H / M / L, how much the player feels it. **Import** gives the name in the reading mission; a ✱ means the source mission must add it to `exportGlobals` first (§3.3), ✱✱ means that also needs an ink change, which goes to the user.

Three devices carry most of the payoffs, so the player meets their history as things happening, not a debrief roll-call:

- **The Reading** (m09). The Architect's own file on Agent 0x00 sits in the archive: his reading of the player, the thing he promised in m07 ("You'll have the figures too"). It is short: four entries at most, chosen by priority (m01 `final_choice`; the innocents line; m04 `disclosure_choice`; m07 `debrief_stance`), and a last page that predicts 0x00 will press the Publication's key (§1.2). Sorensen, bluffed or cornered, quotes one entry at the player aloud before they ever read it. Fixed strings, narrator voice or unvoiced.
- **Who is in the bunker** (m10). Five full scenes of two or three minutes run for every player, each on the main path, and each slot holds a different person by branch (§5.3): the door, the gallery, the power room, the workshop and the network. **Winning a branch puts a person in the room too**, each in their own room (§5.3): an arrested Nightshade is brought to the forward post in cuffs (the only slot there); a protected Gary is placed in the workshop; a captured Voltage is brought up after the breach and met at the power room; an arrested Victoria rings on a secure line in the server hall, and her information is used or withheld face to face with Vos in the gallery. The rest are presences (Mercer in the server hall), props (Reeves on the rota sheet, Hollis on the duty board) or lines. Every helper is named aloud as the player's doing at the moment it helps.
- **Tesseract's case, and the player's answers** (m10 confrontation). After the Publication and the offer, his evidence opens "I told you once I prefer to watch. I've watched." and uses three record lines at most, by priority (m04 disclosure, m01 final choice, m07 stance). The talk-down is three exchanges; under each of his claims the player may see up to two answers from their own record, so the player brings up their own history. Never a requirement.

### 2.1 m01 First Contact

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 1 | `final_choice` (fight / arrest / recruit / expose / surrender; `""` with `m01_completed` = Derek knocked out before he chose, which m01's debrief treated as an arrest) | both | m09: Derek's file in the archive, written before Viral Dynamics, costing his fall (filed in the restricted series, so the paper purge can reach it; §6.1). On surrender it answers "he still hasn't told us why": the Architect had ordered him to surrender if caught and wait. On expose, the file notes the coverage did ENTROPY's recruiting. The Reading's first entry. m10: second priority in Tesseract's case, one fixed line per value ("You beat a marketing manager and called it a war." / "You read him his rights. He kept his promise to me and said nothing."). | H | `m01_final_choice` |
| 2 | `player_launched_attack` | m10 | Tesseract: "You pressed it once, on your first day. You know what it costs, and you know you could press it." He offers the Publication button to that player first and most directly; the Join signposting (§4.3) still applies. | H | `m01_player_launched_attack` |
| 3 | `player_aborted_attack` | dropped | The normal win; carries nothing that `final_choice` doesn't. Fold into #1's neutral line. | – | – |
| 4 | `found_casualty_projections` | dropped (round 1) | The Reading is capped at four entries (D-06); this one didn't make the cut. | – | – |
| 5 | `kevin_choice` | dropped (round 1) | As row 4. | – | – |
| 6 | `maya_ko`, `kevin_ko`, `sarah_ko` (innocents hurt on day one) | both | m09: Jesse Tran, the archive's IT contractor running the tape wipe, is Social Fabric's plant. Maya Chen's names would have flagged him. With `m01_completed and not maya_ko`, HaX warns the player before they meet him ("Maya's list has a Tran on it"). Never played m01: a neutral warning ("Viral Dynamics' staff files have a Tran in them."). When `maya_ko` is true, HaX names the gap directly ("Maya Chen would have flagged him. We don't have Maya's names."), and he is a surprise: an extra guard call-in, avoidable. The Reading's innocents entry, worded only about what the imports know, and only with `m01_completed` (a player who never played m01 gets a neutral entry): "On your first day you hurt a receptionist." / "Not one bystander on your first day." m10: the same narrow line is a talk-down option for the clean player, on the same `m01_completed` condition. | M | `m01_maya_ko` ✱ `m01_kevin_ko` ✱ `m01_sarah_ko` ✱ |
| 7 | `confrontation_approach`, `operation_shatter_reported` | dropped | Minor tone flags; no story outcome to pay. | – | – |
| 8 | Derek's unexplained surrender | m09 | Covered by #1 (the standing order in his file). | M | (row 1) |
| 9 | "The Architect planned for this" | m09 | Derek's file shows it literally: a plan for his fall, dated before he was hired. | M | none (every player) |
| 10 | Kevin's frame-up | dropped | Settled in m01's debrief. | – | – |
| 11 | Social Fabric status; unnamed leader | m10 | Social Fabric's crew run the bunker's media room on uncovered-Fracture branches, with `m07_completed` (row 84). The leader stays unnamed: naming a new mastermind in the last hour is clutter. | L | via `m07_team_assignment` |
| 12 | Expose side effect, "they know what we know" | m09 | The Reading quotes the press coverage the player caused; one line. | L | `m01_final_choice` |

### 2.2 m02 Ransomed Trust

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 13 | Ghost at large; `ghost_deal_accepted` + `exposed_hospital` (deal kept) | m10 | One of the five full scenes, for every player: Ghost rings the security office's handset (the same unplaceable voice as in m02) while selling on the cells' head start (§1.2), and the player can talk Ghost out of the sale. Deal kept: Ghost has already refused to sell, opens a side door ("You kept your word. I keep mine."), and asks one question, "Did the board ever thank you?", whose answer comes back in Ghost's epilogue message. Never played m02: Ghost is a stranger selling the head start, and the talk is harder but open. Played m02 and never answered Ghost (`m02_completed` and neither deal value): "You never answered me. Answer this.", then as the broken deal without the locked door (m10 change 32). The sale is Ghost's leaving fee, which is the hook for the talk. | H | `m02_ghost_deal_accepted`, `m02_exposed_hospital` |
| 14 | Deal broken (`ghost_deal_accepted`, not exposed) | m10 | Ghost locks that side door and says why: "We said we'd be watching." The sale goes ahead unless the player talks Ghost out of it, which is harder on this branch. The main route is unaffected. | H | same |
| 15 | `ghost_deal_refused` | m10 | Ghost offers the parley it promised in m02: "I hope it's you leading it." Ghost asks one question back, "You turned me down. Why?", and the player's answer decides what Ghost gives: the time of the core guard's change (a window past the outer lock) or one camera blind on the route, which the player can take or decline. Then Ghost leaves the network for good, and doesn't sell. | M | `m02_ghost_deal_refused` ✱ |
| 16 | `ghost_keys_used` | m10 | Ghost has been inside networks since St. Catherine's: one of Tomb Gamma's systems shows a Ghost signature, and HaX knows it from m02. Extra intel line, plus an obstacle (Ghost watches the player's route) if the deal was also broken. | M | `m02_ghost_keys_used` |
| 17 | `paid_ransom` | m09 | The ransom money surfaces in the refit ledger in Sorensen's office: St. Catherine's payment helped pay the bunker's refit. "St. Catherine's money. It bought the blast door." | M | `m02_paid_ransom` |
| 18 | `ward_recovering` | dropped | Derived from the three above; adds no new fact. | – | – |
| 19 | `bed4_manually_stabilised` / `patient_bed4_deceased` | m10 | Saved: a record answer under his first claim (not part of his opening, D-08). Deceased: a ledger answer that he uses first; it stings and decides nothing (m10 §9.3). On a saved Pryce he answers: "You knelt by a stranger's bed and squeezed a bag for an hour. You don't believe in acceptable costs. That is your weakness." On deceased: "Six died at St. Catherine's. You chose the clean restore. You understand costing." One line either way. | M | `m02_bed4_manually_stabilised`, `m02_patient_bed4_deceased` |
| 20 | `exposed_hospital` (on its own) | m10 | Disclosure is the finale's argument. A player who published the board's cover-up gets a talk-down option: "I told the truth when it cost. It fixed forty hospitals. Nobody died for it." | H | `m02_exposed_hospital` |
| 21 | Graham Reeves' fate | both | A prop, not a scene (D-01). At large (`escaped`, `missed`, `unnoticed`, with `m02_completed`): his name on Tomb Gamma's door rota in the tunnel guard post, marked "on leave tonight", and HaX: "Reeves. From the hospital. He's theirs full time now." In custody (`arrested`, `ko`, `flagged`): m09's papers hold his handler's contact sheet (HaX: "Reeves' handler, from the hospital"). Kept apart from Michael Reeves: no relation. | L | `m02_reeves_fate` ✱✱ (approved, F5; set in m02's debrief) |
| 22 | `insider_asset_arrested` / `insider_asset_escaped` | both | The read rule whenever `m02_reeves_fate == ""` and `m02_completed`, which is every m02 run finished before the ink change: escaped → on the rota; arrested → in custody; neither → absent. | L | `m02_insider_asset_arrested`, `m02_insider_asset_escaped` |
| 23 | `gary_protected` | both | m09, protected: Gary Whitlock, now a Director of Cyber Security, rings in when the player first tries the tape room's keypad, because he recognises the archive's old tape library from a hospital he audited, and gives the decode hint for its code. m10, protected: the workshop's full scene with Gary on the player's side. He is SAFETYNET's consultant, brought up after the breach and at the workshop door as the player opens it, where he tells them in person "You saved my career." He recognises the bench's casing from the unlabelled case behind his rack at St. Catherine's, and then the default technician, Imran Siddiqui, whom he trained in St. Catherine's IT; the decision is to talk Imran round with Gary there (and leave him his phone, or take it) or take him in (m10 change 8). m10, unprotected and quiet (and m02 played, and not exposed): the same slot, the other way round. Gary is a technician on Tomb Gamma's workshop floor, recruited by the Initiative, Imran at the next bench. The player meets him in person; he can be talked round (listening is the argument), taken in, or walked past with his card cloned; talked round, he opens the power-room door ("Seven warnings, nobody listened. You're listening now?"). HaX's m02 line comes back on that branch. Imran's grievance branches on whether Gary is in work after m02, with a never-played line. | H | `m02_gary_protected` ✱, `m02_exposed_hospital`, `m02_completed` |
| 24 | `kim_guilt_revealed`, `advised_board_pay/refuse` | dropped | Dr Kim's arc closed in m02; her epilogue is complete. No place in a bunker for her. | – | – |
| 25 | `accused_wrong_suspect` / `val_accused` | dropped | Covered by Reeves' "never caught" branch (#21), which is the consequence. | – | – |
| 26 | `patient_assaulted` | both | Folds into the Reading's innocents entry (row 6): "You struck a patient on a ward." In m10 it takes away the clean-record talk-down option. | L | `m02_patient_assaulted` ✱ |
| 27 | Staff KOs (Val, Gary, Kim, nurses, Bernie) | dropped | Rolled into the innocents line (#6) only through `patient_assaulted`; exporting six more names for one line is poor value. | – | – |
| 28 | `cover_burned` | dropped | Minor; the player is burned anyway by m08. | – | – |
| 29 | Supply chain: who makes the PIN crackers | m10 | Tomb Gamma's workshop floor has the bench where they are made (racks of them). Since m08, stores have quarantined every cracker Nightshade signed for: those came from the bench, not every SAFETYNET cracker. Kowalczyk's cracker is her own ("This one's mine. Never been through stores, never been near him."), and in m10 its casing is the bench's. The bench logs crackers by supplier batch with no recipient, so it proves only that she carried a bench unit; the one unit logged "to WREN" is a cloner (§4.4; m09 change 10, m10 change 2, m10's version). The player, issued hers in m09 for the first time since St. Catherine's (where they may have picked one up), sees where it came from. Nightshade's "I chose what you went in without" pays here. | M | none (every player) |
| 30 | Ransomware Incorporated status | m10 | Covered by Ghost (#13–16). Epilogue: Ghost "clean exit, no trace" again, unless the parley ran, in which case Ghost sends one last message. | L | as #13–16 |
| 31 | "Not the money. The lesson." / "They're not wrong about the problem." | m10 | Tesseract uses Ghost's own words; HaX, on the line, remembers saying the second one. The season's moral question is now the confrontation's. | M | none |

### 2.3 m03 Ghost in the Machine

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 32 | `victoria_fate = recruited` (turned Zero Day insider, never used) | both | m09: her first package (the Architect's comms protocols) is the only way into Sorensen's mail, which holds the cage's maintenance code: a second way into the cage that replaces the print and the card. The route stays hers; Sorensen's office opens on the deck choice on every route (m09 change 29). m10: one of the five full scenes. She is in the gallery as Zero Day's representative, there for the cells' head start. HaX's "whether she stays turned is anyone's guess" is answered by a choice the player makes in m10: she offers to open the core's outer lock. The server hall's schedule (flag 2) lists Zero Day's early-access order with her name on it. Confront her with it and she holds, opens the lock and withdraws Zero Day's order ("Then you know I'm hedging. So is everyone."). Trust her without checking and she sells the raid (an alarm and reinforcements, avoidable; HaX's doubt and a kept Nightshade's warning both come before the gallery). Refuse her and take the lock the long way. | H | `m03_victoria_fate` |
| 33 | `victoria_fate = escaped` | m10 | One of the five full scenes. She is in the gallery on the same errand. With `sterling_on_call_seen` (she made the threat in m03) she keeps it, "I said I'd do it myself. I still might": a stand-off, talk-down or KO. Without it she recognises the player, weighs it out loud ("This is the rest."), and offers a trade for walking out: Zero Day's order withdrawn, and which gallery guard carries the lock card. Let her walk (Zero Day gets nothing; she is at large in the epilogue) or arrest her (she doesn't fight; Zero Day's order stands) (m10 change 6). | H | `m03_victoria_fate`, `m03_sterling_on_call_seen` ✱ |
| 34 | `victoria_fate = arrested` | both | m09: her CPS case gives Netherton the legal cover for the raid; one Netherton line in the briefing. Her keys opened Zero Day's client list in the spring, and the bunker's lease was on it: HaX's line at the lease file in Sorensen's office. (The archive's company name comes from the courier label for every player, §1.5.) m10: the gallery's full scene, in two parts. From custody, Victoria rings the player on a secure line in the server hall (its one non-HaX voice) and offers Pieter Vos's weakness for a reduced charge: he has been reselling Zero Day's early access to a second buyer and skimming the difference. The player deals or not, and either way she tells it. In the gallery, face to face with Vos, the player uses her information (he withdraws Zero Day's order to keep his secret and stands aside from the lock) or withholds it (the default branch) (m10 change 7). | M | `m03_victoria_fate` |
| 35 | `victoria_fate = ko` | both | m09: she says nothing (as m03 told the player); her seized devices opened Zero Day's client list, with the lease on it. m10: the gallery holds Zero Day's new broker, Pieter Vos, the man who filled her desk "by Monday" (row 42). He knows who put her in a hospital bed. | L | same |
| 36 | `danny_fate` / `danny_ko` | m09 | Protected or exposed: his survey methods match a document in the archive; HaX: "Danny's statement just became evidence." Left: the archive holds Zero Day's note on him ("loose end, resolved"); HaX checks; he is alive, hiding, and she says so with relief. KO / never found: no line. Protected, when Victoria is recruited or escaped: Danny was told Sterling would answer for it, and she hasn't; HaX: "Danny asked again last week. I didn't have an answer. Tonight I might." | L | `m03_danny_fate`, `m03_danny_ko` |
| 37 | `directive_decoded` | m09 | The Architect's annotation style is recognisable to a player who decoded the Phase 2 directive themselves; HaX: "You've read him before. Sterling's drive." (style, not handwriting; HaX's line, as row 97's is). Her first line in the identity scene when `m07_architect_echo_heard` is false (m09 change 20). | L | `m03_directive_decoded` |
| 38 | `guard_bribed` (Terry Mott's £500) | m10 | Finance's query about the £500 reaches HaX mid-raid, at a quiet moment. One line of relief. | L | `m03_guard_bribed` |
| 39 | `guard_told_safetynet`, Terry and Ffion KOs | dropped | Minor; the Reading already lists innocents through m01/m02 values. Five more exports for one line is poor value. | – | – |
| 40 | `named_target_selection`, `defended_danny`, `called_it_murder`, `handler_trust` | dropped | Small stance flags inside m03's own scenes; no finale scene would read differently. | – | – |
| 41 | "St. Catherine's was a proof of concept. You'll see the rest." | m10 | Victoria on the escaped branch repeats it at the bunker: "This is the rest." | L | (row 33) |
| 42 | "I'm a desk. They'll have it filled by Monday." (Zero Day survives; 0day untouched) | both | The desk was filled: Pieter Vos is Zero Day's representative in the gallery whenever Victoria isn't (arrested, KO'd, or never met). On the default branches he offers a trade: the gallery guard's lock card for the player's word that his name stays off the report; buy, refuse, or talk him out (m10 change 32). Zero Day's status in the closing card; 0day stays unmet (a Season 2 thread). | L | via `m03_victoria_fate` |
| 43 | "When do we go at the Architect directly?" | m09 | HaX answers it in the m09 briefing: "Now." | M | none |

### 2.4 m04 Critical Failure

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 44 | `voltage_captured` (interrogation never shown) | both | m09: a card on Task Force Null's wall (row 57). m10: Voltage wanted someone to check his sums. SAFETYNET did, and he gave the bunker's power layout. He is visible at the briefing, cuffed in the back of the second van and saying nothing (the only helper the briefing shows). He is brought up under guard after the breach and is waiting at the power room when the player arrives (placed there, not walked): the power room's full scene, with Voltage on the player's side, checking his own sums live ("You checked them. Now check this."). The decision: let him work his own switchgear (a faster cut, and he asks one thing for the inquiry) or do it by hand while he talks the player through it. An extra route through the power room. The phone slot is not used on this branch. | H | `m04_voltage_captured` |
| 45 | `voltage_escaped` | m10 | One of the five full scenes. Voltage runs Tomb Gamma's power room. The player meets him at the switchgear. If his print was lifted at Albion, the player can prove the bypass was his and he stands down ("It'll be waiting." It was.). Otherwise a fight or a talk; the talk can use the corrected casualty sheet from the workshop, since he knows his own figures to one decimal place (m10 change 13). Stood down or talked, he cuts the shutter and goes out cuffed. | H | `m04_voltage_escaped`, `m04_voltage_print_on_bypass` ✱ |
| 46 | `static_left` / `static_left_alone` | m10 | `static_left and not static_left_alone` (left with Voltage): Static is beside him in the power room, one more hostile. `static_left_alone` (Voltage was taken, Static slipped out): Static is a line instead, his kit on the power-room bench and HaX: "Static got out of Albion on his own. That's his." | L | `m04_static_left` ✱, `m04_static_left_alone` ✱ |
| 47 | `casualties_occurred` / `crew_lost` | m10 | Tesseract has read the Albion inquiry; on `crew_lost` the nine crew are a line in his ledger, and he reads the count back if the player argues from Albion in the talk-down. A harder conversation, not a harder level. | M | `m04_crew_lost`, `m04_casualties_occurred` |
| 48 | `disclosure_choice` (full / partial / quiet) | both | The finale's argument. m09: the Reading's third entry, and a wall card. The flaw the player finds catalogued and never reported is Albion's (§1.3), so this choice lands twice. m10: first priority in Tesseract's case. Full: "You told them the truth, and they audited every site. That was my lesson, delivered by you." It becomes the player's strongest talk-down option ("And nobody died for it"). Partial: "You told them half. Half is how we got here." Quiet: "You buried it. You understand me better than you admit." | H | `m04_disclosure_choice` |
| 49 | `crew_warned` | dropped | Implied by #47; no extra export. | – | – |
| 50 | `vance_is_ally` | m10 | The power room has one phone-expert slot (one non-HaX voice per room): Voltage if captured and kept on the phone (row 44), else Vance if an ally, else Elena Rodriguez if turned (row 90), else HaX. Vance talks the player through the old Cold War switchgear in his own Teesside voice. | M | `m04_vance_is_ally` ✱ |
| 51 | `robert_vance_ko` | m10 | HaX: "I rang Vance. He said no. He said you'd know why." | L | `m04_robert_vance_ko` ✱ |
| 52 | `promised_voltage_alive` | dropped | Only bites if Voltage then died, which can't happen in m04. | – | – |
| 53 | `voltage_print_on_bypass` | m10 | See #45. | M | ✱ |
| 54 | `cipher_walked`, operatives defeated | dropped | Minor operatives; no slot in the bunker that wouldn't be clutter. | – | – |
| 55 | Calder Wharf, Social Fabric's safehouse | m09 | In the m09 briefing, the first of the reasons Netherton gives for how the order was caught: Task Force Null raided Calder Wharf on day ten, and it held a courier account. Found by the player in m04: "Your card from Albion. Task Force Null went in yesterday. It held a courier account, and this was on it." Not found: the next reason by priority (the HashChain tags, else Nightshade's Helena ticket), and Calder Wharf goes unmentioned. Either way the courier label names the archive (§1.5). | M | `m04_lore_safehouse_address_found` ✱ |
| 56 | "Six cities" | dropped | Paid off by m07. | – | – |
| 57 | Task Force Null | both | m09's briefing (a cutscene) is held in Task Force Null's room, and it is the "previously on". The wall: one card per earlier mission, in the player's own outcomes, with a never-played version of each card that states the canon in one sentence; HaX walks along it in about sixty seconds. The m07 decode's "-- A." at the top carries the "who is the suspect" beat, with no name (m09 change 1): ENTROPY's planner, "every card on this wall has his initial on it somewhere"; one of ours once; "I will not say the name in this room until we can prove it." The name and Netherton's one sentence on who he was land in the identity scene (row 125), for cold starts too. The last two cards are Fraser and Ferreira, unread until the debrief (row 100). The m08 card carries the arrested-Nightshade branch. The raid team is in the room. m10 is Task Force Null's operation. | M | the wall's imports in §3.1 (m01 `final_choice`, m02 `exposed_hospital` and `ghost_deal_accepted`, m03 `victoria_fate`, m04 `voltage_captured`/`voltage_escaped` and `disclosure_choice`, m05 `final_choice`, m06 `monitoring_enabled`, m07 `team_assignment`, m08 Nightshade's fate) |
| 58 | "Above him it stops being a person you can arrest" | m10 | Answered in the ending choice: arrest, surrender, or lethal force (justified or cold). On `voltage_captured`, HaX quotes it as her line comes back at the core's door. | M | none |
| 59 | Disclosure fallout (inquest, Parliament) | epilogue | One line in the closing card. Full: the funding question finally answered. Partial with `crew_lost`: "The inquest heard the rest." Partial without: the half-statement, and the audits it never triggered. Quiet: no line. | L | `m04_disclosure_choice` |

### 2.5 m05 Insider Trading

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 60 | The Recruiter (free, "the next one might cost me more") | m09 | m09's ENTROPY cell is hers: the Helena archive is the Insider Threat Initiative's records office. She rings the player's handset in m09 (phone only, as in m05) once **flag 2 is in and the cage has been opened**, after a short delay, outside the cage and not during another conversation, so the player already knows from the ledger that WREN is on the team and Sorensen is never in the scene. Every player gets the call, and **every player gets her offer**. Her reason, as accounting: the Architect has taken WREN's *tasking* for Montana (WREN still reports to the Initiative and draws its money, but her orders now come from him), and his order is burning her records office, so she sells what she can no longer use (m09 change 8). The offer: WREN's name, now, always right (trusting her is never a trap), if the player lets her file be wiped. Her file is a tape on a deck she wipes herself, from the deck's controller in Sorensen's office, as she hangs up; it holds her handler list, which HaX names before the player answers: by m05's outcome, the handlers for the twenty-three placements; on `public_exposure` (the twenty-three were blown in m05) her handlers and the forty-seven; on `turn_double_agent` the names Torres couldn't give. The deck also holds Tomb Alpha's tapes, his recorded teaching at the first workshop with annotation sheets in his hand ("He teaches what he'll do. If he built the bunker the way he taught it, it's on there."; playback is stage 3's call; m09 change 16). The offer and the second purge choice are one decision (§6.1), made **inside the call**: HaX pulls one tape through the drop terminal on the player's word, also after a hang-up (m09 changes 3, 4). The call's first line sets the defaults (`recruiter_offer = "refused"`, nothing pulled, `recruiter_secret` by branch); its done-flag `deck_choice_made` is set on its last choice; a closed call rings again on leaving the room and resumes at the last unanswered choice (the forced-phone-scene rule, §6.1). Her threat, said before the choice, covers the deal only: "Take my name, and if anything else comes off that deck, I'll know before your plane does. Half my people will have moved by morning." **Take** the offer: she names Halina Kowalczyk (`sleeper_named`, set only when she has said the name), then HaX pulls the Alpha tapes or nothing (`taken` either way; on nothing the tapes are wiped with the rest), her file is wiped, and she walks free into a later season. Buying from her leaves **an invoice** in the Initiative's books, which m10's Tesseract reads (m09 change 30). **Refuse** (or hang up): she wipes her own file first and drops off, sure it's gone; HaX is a second ahead ("She thinks it's gone. Let her."), so the player can pull her file (`named`: she warns nobody, and her whole network is rolled up) or the Alpha tapes or nothing (`refused`: she stays at large), and do the cross-reference the long way. Refusing earns a clean record that m10 pays once. **Double-cross** (take the name, then pull her file anyway, priced aloud first): the name and the file, but she warns the handlers she can reach, and about half the network is rolled up ("About half of them. She warned the rest."; m09 change 4), with one line from her in the epilogue: "I'll remember the shape of you." What else she says depends on #61–62. | H | none for presence; m09 exports `recruiter_offer` |
| 61 | `recruiter_deal_accepted` + `recruiter_deal_confessed` | m09 | Sold and lied: she opens with the receipt and the offer in one breath ("Forty-seven names, and nothing points at you. Does your handler know? I'd like to give you one more name, and I'd like you to keep this one too."), and HaX is on the line. The player chooses there and then to own it on the open line (`told`) or hang up (`kept`, the default set on the call's first line); a hang-up keeps the deck pull, which HaX makes after the Recruiter drops off (m09 change 3). Exported to m10 as `recruiter_secret`. Sold and confessed: HaX cuts in first: "We've talked about that. She has nothing on you." The Recruiter's leverage dies on the line, and she goes straight to the offer. | H | `m05_recruiter_deal_accepted`, `m05_recruiter_deal_confessed` ✱ |
| 62 | `found_pipeline_list` | both | The list reached SAFETYNET only when the player found it and kept it from her: `found_pipeline_list and not recruiter_deal_accepted`. Then SAFETYNET warned the forty-seven candidates; one of them, Noor Haddad (§5.2), works in the archive and helps the player (a door, a warning about Sorensen) because SAFETYNET reached her first. Found, sold and confessed (`found_pipeline_list and recruiter_deal_accepted and recruiter_deal_confessed`): the list went in late ("some of those forty-seven will already have signed"), so Noor was warned only last week and gives the warning but not the door. Otherwise she is a wary bystander, and the player can tell her she is on the list. m10: the epilogue says how many of the forty-seven were reached, by the same two conditions. | M | `m05_found_pipeline_list` ✱, `m05_recruiter_deal_accepted`, `m05_recruiter_deal_confessed` ✱ |
| 63 | The forty-seven candidates / twenty-three placements | m09 | The Initiative's ledger (VM flag 2) holds the twenty-three placements, the forty-seven candidates, and an older section of legacy placements the m05 lists never held. By m05's outcome: on `public_exposure` the twenty-three are marked "blown"; on `turn_double_agent` Torres' own entry still reads as a live placement, because the Initiative doesn't know he is turned. One legacy entry, under the ledger codename WREN, is on Task Force Null's raid team (the sleeper, row 117); it carries a source code, "H&L", and a file number, which open the optional cross-reference. The m05 thread and the m08 thread become one document. | H | none |
| 64 | `final_choice` (Torres) / `torres_turned` | m09 | Turned: Torres' Initiative intelligence named the Helena archive's cover company months ago; nobody connected it until now. He says so himself on his call: "I gave you this address in the spring. It was a line in a list." Torres himself rings in from his desk, still in place inside the Initiative, as the player opens the Harwick & Lowe boxes after flag 2, or, if they never do, once on the walk to Sorensen's office (never before WREN exists; m09 change 6): he knows the legacy section's filing scheme (one step off the cross-reference) and says one thing only he would know about the forty-seven ("They pick people with someone to lose. Look for the ones with a sick parent."). Dead (`combat_lethal`): his name is in the ledger as a "closed placement", in Sorensen's hand, and HaX goes quiet for a moment; the player does the cross-reference the full way (no harder, one more read). | M | `m05_final_choice`, `m05_torres_turned` |
| 64a | m05 `final_choice` = `arrest` / `combat_nonlethal` / `public_exposure` | m09 | His ledger entry reads "lost", in Sorensen's hand; no line. | L | `m05_final_choice` |
| 65 | `elena_treatment_funded` | epilogue | One line in the closing card: Elena Torres' treatment. | L | `m05_elena_treatment_funded` |
| 66 | `entropy_program_exposed` / Netherton's two o'clock / "we'll be watching for their reply" | m10 | The reply arrives: on exposure, the bunker's media room (Social Fabric) has a story ready naming SAFETYNET and the player's designation, set to run at the Publication. Stopping it is an optional objective. | M | `m05_entropy_program_exposed` |
| 67 | `torres_arrested`, `torres_called_in` | dropped | Covered by `final_choice`. | – | – |
| 68 | `halloran_accused` | dropped (round 1) | The Reading is capped at four entries (D-06); the export addition is withdrawn with it. | – | – |
| 69 | `confront_stance`, `handler_trust`, staff KOs | dropped | Stance and a numeric trust score in one mission only; no finale scene reads differently. | – | – |

### 2.6 m06 Follow the Money

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 70 | `architect_identity_found` (read the 87% file) | m09 | Two first lines for the same reveal; the proof is the same. The forms are labelled by import, "m06 name found / not found" (m09 change 19; "the safe" in m09 is Sorensen's). m06 name found: HaX said the name in the m06 debrief as Satoshi's 87% guess (m09 change 17); now she says it again with proof in hand, as fact for the first time, and it costs her. Netherton says the name in the same scene (row 125). m06 name not found: the player hears the name for the first time, and HaX admits she has known since m06 ("There was a file on a crypto fund, with his name in it at eighty-seven per cent. I put it in a drawer."). Every form then reaches the wall: she had the name the night Fraser and Ferreira died, with Netherton listening (m09 change 15). With `m07_teacher_discussed` she adds that "keep it out of your notes" (m07) was her hiding it from them. | H | `m06_architect_identity_found`, `m07_teacher_discussed` ✱✱ |
| 71 | `monitoring_enabled` (fund watched) | m09 | The tagged payments are an object at the drop terminal: the player follows one tagged line from the fund to Tomb Beta's lease. HaX: "Your tags, from HashChain." On the no-coordinate route this alone finds the bunker. In the briefing it is the second reason by priority for how the order was caught ("Your tags lit up last night."). | M | `m06_monitoring_enabled` |
| 72 | `assets_seized` (fund frozen) | m10 | The Architect is short of money: Tomb Gamma is under-staffed, two guard posts are empty, the refit is unfinished (a gap in the fence). HaX says why the moment the player reaches the fence: "Two posts empty. That's your freeze. He couldn't make payroll." A "posts unmanned: budget" memo sits on the duty board. Tesseract, later: "You froze my bank. I had to economise on guards. I expect you noticed." | M | `m06_assets_seized` |
| 73 | `asset_decision_deferred` / never decided | m10 | Neutral: a fully staffed bunker (the default). | L | (default) |
| 74 | `irina_recruited` | m09 | Her condition "what I give you gets used, not buried" is honoured on screen: the account that paid her is the account that pays the archive's lease. HaX: "Irina's account. We're using it, tell her." | M | `m06_irina_recruited` |
| 75 | `irina_arrested` | dropped | No lead; the default line covers it. | – | – |
| 76 | `satoshi_stance` (`wondered`) | m10 | Tesseract: "You told a man in handcuffs that you sometimes wonder whether we're right. I liked that." It opens the Join offer more warmly for that player; signposting unchanged. `rejected`: "You told him no without thinking. Think now." | M | `m06_satoshi_stance` ✱ |
| 77 | `minder_walked` (Kemal Aydin at large) | m09 | A line, not a phone scene (D-17), at flag 4's read of the casualty sheet: "Kemal Aydin walked out on a smaller number than this." Default: no line. | L | `m06_minder_walked` ✱ |
| 78 | `irina_ko`, `satoshi_ko`, `cover_strained`, `console_tripped`, staff KOs, `analyst_told` | dropped | Small m06-local consequences already paid in m06's debrief; none changes a finale scene. | – | – |
| 79 | "The Architect keeps spares" | m10 | The bunker's second bank: a ledger showing the reserve that funds the Publication's servers. Freeze (#72) means it's nearly empty. On Scorched Earth the line turns: his spare is his memory ("He's one man with a memory now, not a map.", §4.6). | L | none |
| 80 | The $12.8M wallet (freeze) | epilogue | One of Netherton's two lines in the 06:00 cutscene: by default he returns it to the victims' fund (stage 3 confirms or flips it to the Council keeping it). | L | `m06_assets_seized` |

### 2.7 m07 The Architect's Gambit

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 81 | `team_assignment = trojan_horse and not team_redirected` (Austin covered, direct; the redirect also sets `trojan_horse`, so it must be excluded) | both | Dispatch still answering (m09 briefing line). In m10 the Publication cannot ride the Trojan Horse backdoor: Tesseract has to push it through his own servers, so the core has one fewer release channel and the cost of a partial release is smaller (§4.2). Tesseract: "You took Austin from me. I had to do this the slow way." | H | `m07_team_assignment` |
| 82 | `team_redirected` (Austin at 30%; `team_assignment` reads `trojan_horse` too) | both | Dispatch saved; 14 million systems still backdoored. In m10 the backdoor is a small live release channel the player can close (one optional console task, not a gate on completion). | M | `m07_team_redirected`, `m07_team_assignment` |
| 83 | Any other team / none (Austin uncovered), **with `m07_completed`** (`""` is also the never-played default; B1) | both | Dispatch in eleven counties has been dropping calls since day nine: a ticking line in each briefing ("Day eleven. Eleven counties." in m09; "Day thirteen. Eleven counties." in m10), and a clause in m10's "Elsewhere" credits. In m10 the backdoor in 47 million systems is the Publication's fastest channel. HaX gives a count once. | H | `m07_team_assignment` |
| 84 | Fracture uncovered, with `m07_completed` | m10 | Social Fabric holds 43 states' voter records and its story machine; in the bunker it runs the media room. When the raid starts, a fake story about a SAFETYNET "massacre in Montana" begins to run; the player can kill it in the media room (optional), and the epilogue says whether it ran. Fracture covered, or m07 never played: the media room is dark, and on its desk is the same story drafted and never run, with the player's photo on it. On the executed ending a new version goes out at 06:00 whatever happened here, its one true paragraph the shooting (§4.5; m10 change 40). The media room is the first planned cut; cut, its story becomes one HaX line and the draft a prop in the server hall. | M | `m07_team_assignment`, `m07_completed` |
| 85 | Meltdown uncovered, with `m07_completed` | m09 | HaX gives the hospital count once in the m09 briefing, in a line that isn't a statistic. | L | `m07_team_assignment` |
| 86 | `countdown_expired` (Seattle went dark) | m10 | Tesseract: "Seattle first. As scheduled." His fallback release runs by city, and Seattle is first again. | L | `m07_countdown_expired` ✱ |
| 87 | Mercer at large: `m07_completed and not mercer_ko and mercer_fate != "arrested"` (`""` alone is also the never-played default, so `m07_completed` is required) | m10 | A presence, not a full scene (D-01). Mercer is in the server hall in Asante's place, running the release schedule. One line, "When the fourth submission is declined, agent, somebody does this.", then he turns hostile. | M | `m07_mercer_fate`, `m07_mercer_ko` ✱ |
| 88 | `mercer_fate = arrested`, or `mercer_ko` (knocked out, in custody and silent) | m10 | Arrested: his statement gave the bunker's server-hall layout; the briefing map shows it. Knocked out: in custody, no statement, no map line. | L | `m07_mercer_fate`, `m07_mercer_ko` ✱ |
| 89 | `mercer_stance`, `mercer_told_diversion` | dropped | Fine shading of one scene in m07; `mercer_fate` and `mercer_ko` carry the outcome. | – | – |
| 90 | `elena_outcome = turned` | m10 | Elena Rodriguez fills the power room's phone slot when neither a captured Voltage nor an allied Vance holds it (row 50): she knows the release servers' power feed. "Analysis wants her. I have not decided" is answered: Netherton decided. | M | `m07_elena_outcome` |
| 91 | `elena_outcome = fled` / KO | dropped | She "took nothing and broke nothing"; no finale role that wouldn't be clutter. | – | – |
| 92 | `hollis_resolved = evaded` ("still on their payroll") | m10 | `evaded` only. m07 also calls him at large on `ko` without `hollis_ko` and on the unset value, but telling those apart needs `hollis_ko` exported too, and the payoff is a prop; one value keeps the export list short (B9). A prop (D-01): Ray Hollis's photo on the security office's duty board, on tonight's gate shift, and HaX: "Still on their payroll. Two kids. I hope he stays in the hut." | L | `m07_hollis_resolved` ✱ |
| 93 | `park_resolved` | dropped | Park and Hollis do the same job in the bunker; one returning guard is enough. Hollis is the more vivid (two children, bought). | – | – |
| 94 | `projection_revised` / `revision_found_open` / `redirect_declined` | dropped | Fine-grained; `team_redirected` carries the outcome, and Tesseract's "reading" (#99) carries the stance. | – | – |
| 95 | `found_tomb_gamma` (read the dossier) | m09 | The player who read "Including the people" in m07 hears HaX say "You bagged the dossier. This is the 'people' part." Low cost. | L | `m07_found_tomb_gamma` ✱ |
| 96 | `found_mole_evidence` | dropped | Paid in m08. | – | – |
| 97 | `architect_echo_heard` | both | m09: HaX's first line in the identity scene, before her form's first sentence: "You heard him say it in Portland. My line. His line." m10: the line finished (#120). | H | `m07_architect_echo_heard` |
| 98 | `teacher_discussed` (HaX already told this player) | m09 | The m09 opening branches on this and `m06_architect_identity_found` together. Both: "I told you on the handset he taught me", and she goes further, faster. Teacher discussed without the m06 file: "I told you somebody taught me that line. I didn't say who." Neither: she starts further back. Runs finished before the ink change read `false` (A22). | M | `m07_teacher_discussed` ✱✱ (approved, F5: local ink VAR → scenario global) |
| 99 | `debrief_stance` (defended / owned / refused / hardened) | both | m09: the Reading's fourth entry, quoting the player's words back. m10: third priority in Tesseract's case: "'I'd make it again.' You would. I counted on it." / "You said it was yours. You'll carry this too." (worded to fit both of m07's `owned` lines) / "'Don't ask me to rank them.' I ranked them for you." Hardened: m07 said only that Netherton would take it to the Council; in m10 Netherton tells the player the Council said yes ("You asked for the numbers. You have them."), and a projection desk on the forward post shows the Publication's casualty curve live, which the player can show Tesseract as an argument. | M | `m07_debrief_stance` ✱ |
| 100 | The two dead agents | m09 | Named on Task Force Null's wall in the m09 briefing; Netherton reads both names before the Montana go order at the end of m09. Every player has the same two. | M | none |
| 101 | The Architect's "figures" / reading of the player | both | The Reading (§2 intro): four entries and the prediction. m10: "Your file says I press it. Watch me." is a record answer under the third claim on `m09_reading_finished`, and after "Stop it" he answers it himself: "Then I was wrong about one thing." | H | rows 1, 6, 48, 99 |
| 102 | Netherton's Council meeting (`hardened`) | m10 | See #99. | L | (row 99) |
| 103 | Off-screen leaders: Michael Reeves, Jennifer Walsh, Marcus Ashford | epilogue | Named once in the closing card's cell status, by whether their site was covered (with `m07_completed`; a player who never played m07 gets the never-played card, §3). They don't appear: three new faces in the last hour is clutter, and Season 2 needs someone left. | L | `m07_team_assignment` |

### 2.8 m08 The Mole

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 104 | `nightshade_triple_agent` / `triple_agent_first_payment` | both | m09: he is a voice on the player's phone, competing with HaX, from a SAFETYNET room; he names which database entries guard the archive's restricted stacks and is right. m10: the door slot's full scene, at the forward post. He pays the first payment in full: each of Tomb Gamma's defences named with the database entry it came from. One entry is wrong. Was he lied to, or lying? m09's choice (#106) decides which way he tips the board. | H | `m08_nightshade_triple_agent` ✱, `m08_triple_agent_first_payment` ✱ |
| 105 | "For exactly as long as it suits me" | m10 | Shown his own recruitment file in m09: he learns Tesseract wrote off his life as a line item, and he tips the board on the Architect: the wrong entry was Tesseract's lie, and he gives the player the override he was saving, which is the security office's alarm panel (the guards below aren't raised by the breach; m10 change 10). The decision: take the override and leave him at the post, or take him in with the team (he asks to see Tesseract's face; stage 3). Not shown: he gives the payment warmly and says nothing of the wrong entry, which is a tripwire at the tunnel's inner door. The player can check the payment against the m09 defence list, and avoid it; unchecked, the door locks from the security office side, the bunker is warned, and WREN goes ahead a room early, at the workshop (m10 change 9). The security office reopens the door. | H | `m09_nightshade_shown_file` (m09's own export) |
| 106 | Nightshade's recruitment file, fifteen years ago | m09 | In the archive. Written in Tesseract's hand while he was SAFETYNET's chief strategist and Nightshade was 23 in his intake. This is the hard proof (with VM flag 3) that the teacher recruited him, "the man who put me here". On the triple-agent branch the player chooses whether to send it to him. | H | none (the find), `m09_nightshade_shown_file` (the choice) |
| 107 | `nightshade_arrested`, `nightshade_ko_before_fate`, or m08 never played | both | m09: Netherton visited him once and came back with nothing: "He said you'd know where to find him. He meant the door." m10: the door's full scene with Nightshade in cuffs. He is brought to the forward post, as he asked, and offers the defences for a deal (a reduced sentence). The player chooses: take the deal, and he names the entries with one wrong, as on the triple-agent branch; or refuse, and the defences are learned the long way (the m09 plans). He also knows ENTROPY's habits ("They always borrow a badge, and it's never the borrower's."), which replaces the alibi clue if dealt with. The arrested branch is `m08_nightshade_arrested and not m08_nightshade_ko_before_fate`, since m08's knock-out safety net sets both (m10 change 24; m09's Netherton visit line uses the same guard). Silent handover or never played: he sits in the van, cuffed to the rail, and says one word, "Door". Netherton asks whether to bring him to the blast door on a tether: brought, Arakawa walks him up at the breach (02:30, after his 02:10 alibi) and holds the door with a guard detail all night, and Nightshade's second word, "Manual.", opens the door by its hand crank without telling the bunker 0x00 is in; left, the door announces the player (m10 change 23). HaX's visit in the epilogue on the arrested branch. | M | `m08_nightshade_arrested` ✱, `m08_nightshade_ko_before_fate` ✱ |
| 108 | `nightshade_ko_before_fate` / `tomb_gamma_location_known` false | m09 | The archive holds the deed: m09 finds the bunker for this player. The briefing adds one line ("We have Helena. Not the bunker. Not yet.") and the deed becomes a task. On every other route the deed confirms what the player already has. | M | `m08_nightshade_ko_before_fate` ✱, `m08_tomb_gamma_location_known` ✱ |
| 109 | m08 `debrief_stance` (defended / owned Netherton's sealed warning) | m09 | Owned: Netherton signs the Montana order with his own name beside Nightshade's on the file, in front of the player. Defended: he carries it quietly; one line where he thanks the player and doesn't say for what. | M | `m08_debrief_stance` ✱ |
| 110 | `netherton_ko` / `netherton_hostile` | m09 | One narrator line in the briefing's cold open, never played for laughs: Netherton takes the chair furthest from the player's, and nobody mentions why (he said in m08 it would not be discussed, and it isn't; m09 stage 1 W-15, replacing "My jaw is fine"). | L | `m08_netherton_ko` ✱, `m08_netherton_hostile` ✱ |
| 111 | `hax_ko` | m09 | "You put me on the floor at the Citadel. I'm still running you." Then she gets on with it. | M | `m08_hax_ko` ✱ |
| 112 | `accused_vector` / `accused_phantom` / apologised / hostile | m10 | With `m08_completed` (every one of these defaults to `false`, so the default would otherwise put them on the team; B2), not accused, or apologised to, and not hit: they join the raid team, which also puts them on the whodunit's suspect list (row 117). Phantom (who ran his own mole hunt and has audited every kit sign-out since m08) brings his "list": tonight the breaching case went out with one more unit than its sheet lists, signed for by Kowalczyk and Arakawa, which replaces the cloner clue (m10 change 11). Vector brings the crypto annex's kit and opens one sealed door in the security office, a short cut to the workshop. Accused and not apologised, or hit: they decline, and Netherton says why in one line. | M | `m08_accused_vector` ✱ … (six names) |
| 113 | `nightshade_tipped_off` / `nightshade_tidied` | m09 | What he cleared from his locker is in the archive: the copy he sent ahead. HaX: "So that's what he had time to clear." A small, satisfying find. | L | `m08_nightshade_tidied` ✱ |
| 114 | `suspect_theory`, `named_on_evidence`, `named_by_hax`, `audit_*` | dropped (round 1) | The Reading is capped at four entries (D-06); both export additions are withdrawn. How the player catches a mole is tested again, in play, by m10's whodunit. | – | – |
| 115 | Floor KOs (off-duty agent, analyst, ATHENA), print/card | dropped | m08-local; the innocents line (#6) covers the type. | – | – |
| 116 | `go_bag_lining_known` (Helena ticket) | m09 | Every player hears it, as fact SAFETYNET found in his effects: Helena was his waypoint. No import needed. | M | none |
| 117 | Other sleepers ("there may be others") | both | **A whodunit the player knows about.** Player-facing text gives WREN no pronoun before the accusation, in both missions (m10 change 1). m09: the raid team is in the briefing room (Quintero, Kowalczyk, Malhotra, Arakawa; §5.2), each with one ordinary beat that reads differently later (m09 change 11): Quintero argued against tonight and says "Orders don't fall off couriers." (Netherton: "This one didn't. Noted, again."); Kowalczyk hands over the PIN cracker and is easy to like; Malhotra asks to run the Helena line himself; Arakawa has kept Helena's police off the archive's side of town ("Nobody asked who for."). The ledger (flag 2) is live, kept by Sorensen: WREN's legacy entry was updated on day 10, "assigned TF Null, Montana operation", which tells every player that one of the team is a plant and that the Initiative knows about the raid. WREN came to SAFETYNET eleven years ago as a lateral hire through Harwick & Lowe, an executive search firm long since closed. Nothing tied that firm to the Initiative until this ledger, and she was never in Tesseract's intake, which is why the screening after m08 missed her ("Harwick & Lowe shut before TalentStack opened."). The optional cross-reference narrows WREN to two: the firm's placing sheet lists two lateral hires to "a government client" in the same quarter eleven years ago, H. Kowalczyk and M. Quintero (an honest hire placed as cover), both with a parent in residential care (`m09_sleeper_shortlist`, set on reading the sheet). Only the Recruiter's offer names her (`m09_sleeper_named`; m09 change 6). Netherton keeps the team together on purpose: "If I bench four agents tonight, WREN knows we know. They come. You watch them." m10: the fact is told to the player privately at the van end after the briefing, the team in view and out of earshot: one of this team, "placed eleven years ago"; Netherton says nothing to them, "and neither will you" (m10 change 35). Then §4.4's three-clue whodunit, with a visible, recoverable cost for a wrong accusation. Already named in m09: she is detained at the briefing, and the private aside's named form is "She was the one the ledger meant. If there is a second, it doesn't show one. Watch anyway." | H | `m09_sleeper_named`, `m09_sleeper_shortlist`, `m08_nightshade_triple_agent` ✱, `m08_nightshade_arrested` ✱, Phantom (#112) |
| 118 | The PIN cracker | both | Kowalczyk's own, handed to the player at the m09 briefing, the first since St. Catherine's ("The long way is over," HaX). In m09 it opens Sorensen's safe, and she asks about it in the hangar ("Well? Did my toy earn its keep?"). Inventory doesn't carry between missions, so m10's start kit issues it again on every branch, its description saying who gave it (m10 change 26). m10's workshop is where its casing was made (#29); in m10 it is a suspicion beat and the accusation's last card, never a clue, and "The long way is over" comes back there (m10 change 2). | M | none |
| 119 | The player is burned | m10 | Tomb Gamma expects Agent 0x00: their photo on the security office wall; the blast door is keyed to open for them by name. Tesseract wants them at the console (§1.2); the cells' guards were never told why, and fight them anyway. | M | none |
| 120 | "Let it hurt afterwards, not during" (HaX, the Architect, Nightshade) | both | m09: after the deck, HaX rings unasked and gives three words and one sentence ("Afterwards. Not during." / "It's yours to carry. Nobody else signed for it."), then promises "the rest when this is over" (m09 change 15). m10: Tesseract starts the line in the third exchange. The mission's rebuttal there is the clean-hands argument (he needs the player's hand on the key so his own stays clean); what HaX does with the line is a record answer on `m09_completed` (m10 change 31). "Afterwards" is rationed to at most two uses in an m10 run (m10 change 39). | H | `m07_architect_echo_heard` (for the extra recognition beat) |
| 121 | Vector's annex, Phantom's Zurich list | m10 | Phantom's list pays in #117. Vector's annex badge opens a sealed door in #112. Both small. | L | (row 112) |
| 122 | Dr S. Okafor | dropped | Vindicated in m08. A line from her would add a fifth Okafor/Okonkwo name risk for little. | – | – |
| 123 | Marcus Tesseract (Adrian's brother) | dropped | Brief rule: nothing may depend on his institute. A brother with no institute would need new backstory to matter, and the finale has enough people. | – | – |
| 124 | Netherton's culpability | m09 | See #109. | M | (row 109) |
| 125 | Netherton's pledge, "We will not say one aloud until we can prove it" (an optional m08 hub topic; nothing records who heard it) | m09 | Every player: when flag 3 and the handwriting come together, Netherton, on the line from the aircraft taking Task Force Null to Montana, in its forward cabin with the door shut where WREN can't hear (m09 change 7), says the name aloud for the first time, in words that work whether or not the player heard the pledge: "I said we wouldn't name him until we could prove it. We can. Dr Adrian Tesseract." Then one sentence, for every player and cold starts most of all: "He was our chief strategist until seven years ago. He trained half my field officers." Then "HaX.", and nothing else. New to one player, a promise kept to another. | M | none |

### 2.9 Weight check

High-weight payoffs per mission, to show the load is shared:
- m09: the identity reveal (#70, #97, #98, #106, #125), the Reading (#101), the Recruiter and her offer (#60–61), the ledger and WREN (#63, #117), Nightshade's file (#104–106).
- m10, the five full scenes: Nightshade at the door (#104–105), Victoria (#32–33), Voltage (#44–45), Ghost (#13–16), Gary (#23). Plus disclosure (#20, #48), the m07 team (#81–83), the whodunit (#117), the line (#120).




## 3. Imports and exports

Mechanism and rules: `README_scenario_design.md` "Carrying choices between missions" and `docs/agents/CARRY_OVER_PLAN.md` §2. Every alias below is the default `mNN_<var>` form, so `as` can be left out. Every default matches the source's `globalVariables` default (checked against each erb on 2026-10-20: every ✱ name below exists there; the two ✱✱ names do not yet).

**The rule for both missions.** No import appears in `concludeRequires` or an `unlockCondition` (the validator errors on it anyway). Each import is one of five kinds, given in the **Use** column:

- **R** route: opens an extra way through. The way without it still works.
- **H** helper: a person or a fact that makes something quicker or clearer.
- **O** obstacle: makes something harder, and the same mission always offers a way round it.
- **P** presence: decides who is standing in a room. Every such room has a default occupant (§5.3), so the room works with the import at its default.
- **L** line: changes what someone says, or what a document reads.
- **L+** a line that sets the whole form of a scene (which version of the identity scene, the briefing or the Recruiter's call plays). Built and tested with Tier 1, because a wrong branch breaks a scene, not a sentence.

Every mission also imports `completed` for each source (`m01_completed` … `m08_completed`; m10 adds `m09_completed`). Ink uses it to tell "never played" from "played and chose the default". A player who starts at m09 gets the default line everywhere, and the default line must stand on its own (it is new writing, so there is no older audio to preserve). **Wherever a present, at-large or penalising value equals the import's default** (`m07_mercer_fate == ""`, `m02_reeves_fate == ""`, `m07_team_assignment == ""`, every m08 Vector/Phantom value, the m01 clean-record line), the condition also requires that source's `completed`, so a player who never played it meets the default and is told nothing false about a mission they never had.

**Never-played canon.** What a player who skipped a mission is treated as having lived through. Each wall card's never-played sentence (row 57) states it, and it matches the default occupant in §5.3:

| Source | Never-played canon | What it means in m09/m10 |
|---|---|---|
| m01 | Derek Lawson was arrested and said nothing. | Arrest line in his case; no innocents entry either way. |
| m02 | Ghost was never caught; the hospital recovered. | Ghost on the network as a stranger; the workshop's default technician, Imran Siddiqui, with his never-played grievance (a board that never read its emails); no Reeves. |
| m03 | Zero Day's London broker was never identified, and Zero Day kept trading. | Pieter Vos in the gallery. |
| m04 | Voltage disappeared after Albion. | Wendell Briggs, the power-room technician, at the switchgear; HaX in the phone slot. |
| m05 | Torres was arrested. | His ledger entry reads "lost". |
| m06 | The fund was found, then lost. | Full staffing at Tomb Gamma. |
| m07 | One team, four sites. Austin was reached in time; two of ours died at the others. (Matches m08's own never-played line, "one team to send".) | No dispatch line, no backdoor channel. The media room is dark for a different reason: Social Fabric kept its crew at home, and the story sits drafted and held on the desk. The closing card's cell lines read as if Austin was covered and the other sites were not. |
| m08 | The mole is in custody and saying nothing. | Nightshade in the van at the forward post: "Door.", with Netherton's tether decision (row 107). On a cold start of m10 with `not m08_completed`, Netherton says who he is first (§4.0). |
| m09 (for m10) | The name proved, the hour found, Tomb Gamma's defences on paper (the m09 plans, which every player holds and can check Nightshade's payment against), one of the team is WREN. | m10's cold-start briefing (§4.0): the name and the hour in front of the team, WREN at the private aside; no m09 callbacks (confession answer, Reading, Recruiter, Albion notice), and HaX reads the unsent notice off his box at flag 4. |

Imports are read-only: one shared ink include per mission (`m09_carryover_vars.ink`, `m10_carryover_vars.ink`) declares them all as `VAR`, and nothing assigns them.

**How R and P imports are built.** Imports are not available to the ERB (CARRY_OVER_PLAN §2.5), so a presence or route is a `game_loaded` eventMapping that shows or hides an NPC with `setVisible` (never `#remove_npc`), or opens a door or gives an item. Each one raises a validator warning by design (§2.6). Stage 8 expects one warning per R/P import and signs each off.

**Tiers** (round 1, D-07; boundary moved in round 2, R2-09). The user wants as many decisions as possible to carry, so the list stays broad, but not every import gets the same build effort:

- **Tier 1**: every import that puts a person, a prop, a helper, a route or an obstacle in a room (Use R, H, O, P), whatever its weight. Built first, and every condition is covered by at least one named route-driver profile at stage 8 (Mercer in the server hall gets a profile of its own).
- **Tier 2**: lines only (Use L): spoken lines, wall cards, document text, talk-down options and epilogue lines, written as fixed strings and said *to* the player at a moment. Checked by the dialogue lint and a read-through of each branch.
- **Tier 3**: cut, each with a reason (listed under each table). Cut names are withdrawn from §3.3's export additions.

Every R or H import has a HaX or NPC line that names the player's earlier choice at the moment it helps.

### 3.1 m09 `importGlobals`

**Tier 1** (19 variables)

| Alias | From | Var | Default | Use | Rows (§2) |
|---|---|---|---|---|---|
| `m06_architect_identity_found` | m06_follow_the_money | `architect_identity_found` | `false` | L+: which form the identity scene takes | 70 |
| `m07_teacher_discussed` ✱✱ | m07_architects_gambit | `teacher_discussed` | `false` | L+: where HaX's reveal starts (with the row above) | 70, 98 |
| `m07_architect_echo_heard` | m07_architects_gambit | `architect_echo_heard` | `false` | L+: identity scene | 97 |
| `m08_nightshade_triple_agent` ✱ | m08_the_mole | `nightshade_triple_agent` | `false` | P + H: Nightshade's voice on the phone, naming which database entries guard the restricted stacks; and the "send him his file" choice | 104–106 |
| `m08_nightshade_arrested` ✱ | m08_the_mole | `nightshade_arrested` | `false` | L+: Netherton's visit line, carried on the wall's m08 card; read as `m08_nightshade_arrested and not m08_nightshade_ko_before_fate` (m10 change 24) | 107 |
| `m08_nightshade_ko_before_fate` ✱ | m08_the_mole | `nightshade_ko_before_fate` | `false` | L+: the briefing's "Not the bunker. Not yet."; replaces HaX's "Same classroom" opening | 108 |
| `m08_tomb_gamma_location_known` ✱ | m08_the_mole | `tomb_gamma_location_known` | `false` | L+: how the deed and the briefing are framed. The no-coordinate branch is `m08_completed and not m08_tomb_gamma_location_known`; a player who never played m08 gets the neutral framing | 108 |
| `m05_recruiter_deal_accepted` | m05_insider_trading | `recruiter_deal_accepted` | `false` | L+: how the Recruiter's call opens; the tell-or-hang-up choice | 61 |
| `m05_recruiter_deal_confessed` ✱ | m05_insider_trading | `recruiter_deal_confessed` | `false` | L+: HaX cuts in first; Noor's late warning | 61, 62 |
| `m05_found_pipeline_list` ✱ | m05_insider_trading | `found_pipeline_list` | `false` | H: Noor Haddad helps, on `found_pipeline_list and not recruiter_deal_accepted` (smaller help when confessed) | 62 |
| `m05_torres_turned` | m05_insider_trading | `torres_turned` | `false` | H: Torres rings in from his desk, still in place, at the Harwick & Lowe boxes after flag 2 (or on the walk to the office); one step off the WREN cross-reference | 64 |
| `m05_final_choice` | m05_insider_trading | `final_choice` | `""` | Prop: his ledger entry, "closed placement" or "lost", in Sorensen's hand; wall card | 57, 64, 64a |
| `m03_victoria_fate` | m03_ghost_in_the_machine | `victoria_fate` | `""` | R on `recruited` (her comms protocols are the only way into Sorensen's mail, which holds the cage's maintenance code: a second way into the cage, replacing the print and the card); L on `arrested` / `ko` (the lease-file line); wall card | 32, 34, 35, 57 |
| `m02_gary_protected` ✱ | m02_ransomed_trust | `gary_protected` | `false` | H: Gary rings at the first attempt on the tape room's keypad, with the decode hint | 23 |
| `m01_maya_ko` ✱ | m01_first_contact | `maya_ko` | `false` | O: Tran is a surprise; after flag 1 he radios Old Coyote to check the reading room (the round passes the drop terminal once), and he calls in a second guard if he sees the player first (both avoidable). With `m01_completed and not m01_maya_ko`, HaX warns the player about him first; never played m01, a neutral warning | 6 |
| `m06_monitoring_enabled` | m06_follow_the_money | `monitoring_enabled` | `false` | H: the tagged payments, an object at the drop terminal; on the no-coordinate route they point at the bunker before the deed does; the briefing's second reason for how the order was caught; wall card | 57, 71 |
| `m02_insider_asset_arrested` | m02_ransomed_trust | `insider_asset_arrested` | `false` | Prop: Reeves' handler's contact sheet (read rule when `reeves_fate` is empty) | 21–22 |
| `m02_reeves_fate` ✱✱ | m02_ransomed_trust | `reeves_fate` | `""` | Prop: as above, finer | 21 |
| `m08_nightshade_tidied` ✱ | m08_the_mole | `nightshade_tidied` | `false` | P: the copy he sent ahead, an extra find in the restricted stacks (one side of the first purge choice) | 113 |

**Tier 2** (lines only: 24 variables)

| Alias | From | Var | Default | Use | Rows (§2) |
|---|---|---|---|---|---|
| `m01_final_choice` | m01_first_contact | `final_choice` | `""` | L: Derek's file; the Reading's first entry; wall card | 1, 8, 12, 57 |
| `m01_kevin_ko` ✱ | m01_first_contact | `kevin_ko` | `false` | L: the Reading's innocents entry | 6 |
| `m01_sarah_ko` ✱ | m01_first_contact | `sarah_ko` | `false` | L: the Reading's innocents entry | 6 |
| `m02_patient_assaulted` ✱ | m02_ransomed_trust | `patient_assaulted` | `false` | L: the Reading's innocents entry | 26 |
| `m02_exposed_hospital` | m02_ransomed_trust | `exposed_hospital` | `false` | L: wall card | 57 |
| `m02_ghost_deal_accepted` | m02_ransomed_trust | `ghost_deal_accepted` | `false` | L: wall card | 57 |
| `m02_paid_ransom` | m02_ransomed_trust | `paid_ransom` | `false` | L: the ransom in the refit ledger (Sorensen's office) | 17 |
| `m03_danny_fate` | m03_ghost_in_the_machine | `danny_fate` | `""` | L: the lease file (Zero Day's note on him), when neither Victoria's line nor Irina's applies | 36 |
| `m03_danny_ko` | m03_ghost_in_the_machine | `danny_ko` | `false` | L | 36 |
| `m03_directive_decoded` | m03_ghost_in_the_machine | `directive_decoded` | `false` | L: HaX's recognition line in the identity scene, when `m07_architect_echo_heard` is false | 37 |
| `m04_disclosure_choice` | m04_critical_failure | `disclosure_choice` | `""` | L: the Reading's third entry; wall card; HaX on the Albion flaw | 48, 57 |
| `m04_voltage_captured` | m04_critical_failure | `voltage_captured` | `false` | L: wall card | 44, 57 |
| `m04_voltage_escaped` | m04_critical_failure | `voltage_escaped` | `false` | L: wall card | 57 |
| `m04_lore_safehouse_address_found` ✱ | m04_critical_failure | `lore_safehouse_address_found` | `false` | L: the briefing's first reason for how the order was caught (the courier account) | 55 |
| `m06_irina_recruited` | m06_follow_the_money | `irina_recruited` | `false` | L: the lease file ("Irina's account paid for this.") | 74 |
| `m06_minder_walked` ✱ | m06_follow_the_money | `minder_walked` | `false` | L: HaX at flag 4's casualty sheet | 77 |
| `m07_team_assignment` | m07_architects_gambit | `team_assignment` | `""` | L: the dispatch count (with `m07_completed`); wall card | 57, 81, 83, 85 |
| `m07_team_redirected` | m07_architects_gambit | `team_redirected` | `false` | L | 82 |
| `m07_debrief_stance` ✱ | m07_architects_gambit | `debrief_stance` | `""` | L: the Reading's fourth entry | 99 |
| `m07_found_tomb_gamma` ✱ | m07_architects_gambit | `found_tomb_gamma` | `false` | L | 95 |
| `m08_debrief_stance` ✱ | m08_the_mole | `debrief_stance` | `""` | L: Netherton at the Montana order | 109 |
| `m08_netherton_ko` ✱ | m08_the_mole | `netherton_ko` | `false` | L | 110 |
| `m08_netherton_hostile` ✱ | m08_the_mole | `netherton_hostile` | `false` | L | 110 |
| `m08_hax_ko` ✱ | m08_the_mole | `hax_ko` | `false` | L | 111 |

**Tier 3, cut** (with reasons): `m01_kevin_choice`, `m01_found_casualty_projections`, `m05_halloran_accused`, `m08_named_on_evidence`, `m08_suspect_theory`. All five existed only as entries in the Reading, which is now capped at four (D-06). The last three were ✱ and are withdrawn from §3.3.

43 variables plus eight `completed` imports (unchanged by stages 1–2: every name the m09 stage 1–2 documents read is in these two tables). The deed to Tomb Gamma is a task for every player (it is also the paper half of the defence plans), so the no-coordinate route changes the briefing and HaX's emphasis, never what the player must do.

Task Force Null's wall in the briefing (row 57) is one object per earlier mission. Each card has a played version on the imports above and a never-played version that states the canon in one sentence.

### 3.2 m10 `importGlobals`

**Tier 1** (38 variables): the five full scenes, the whodunit, every presence, prop, helper and obstacle

| Alias | From | Var | Default | Use | Rows (§2) |
|---|---|---|---|---|---|
| `m08_nightshade_triple_agent` ✱ | m08_the_mole | `nightshade_triple_agent` | `false` | P + H: Nightshade in the door slot at the forward post (full scene); replaces the alibi clue | 104, 117 |
| `m09_nightshade_shown_file` | m09_digital_archaeology | `nightshade_shown_file` | `false` | H (shown: the override, the security office's alarm panel) / O (not shown, on the triple-agent branch: the tripwire at the tunnel's inner door unless the payment is checked; the door locks, the bunker and WREN are warned, and the security office reopens it) | 105 |
| `m09_sleeper_named` | m09_digital_archaeology | `sleeper_named` | `false` | H: the sleeper is detained at the briefing; the whodunit is off and `sleeper_caught` is true from the start | 117 |
| `m09_sleeper_shortlist` | m09_digital_archaeology | `sleeper_shortlist` | `false` | H: on `not m09_sleeper_named`, HaX at the private aside ("Two faces from Helena. Watch both."), which replaces the alibi clue (m09 change 23, m10 change 11) | 117 |
| `m03_victoria_fate` | m03_ghost_in_the_machine | `victoria_fate` | `""` | P: the gallery's full scene: Victoria in person (recruited: the trust choice; escaped: the stand-off, or without the threat a trade for walking out), or Pieter Vos (arrested: Victoria's secure-line deal in the server hall, then Vos face to face with her information; ko, or never played: Vos and his lock-card trade) | 32–35, 42 |
| `m04_voltage_captured` | m04_critical_failure | `voltage_captured` | `false` | P + H: Voltage placed at the power room after the breach; he works his own switchgear or talks the player through it (the player's choice); R: a route through the power room | 44 |
| `m04_voltage_escaped` | m04_critical_failure | `voltage_escaped` | `false` | P: Voltage at the switchgear (full scene); talkable with the corrected casualty sheet | 45 |
| `m04_voltage_print_on_bypass` ✱ | m04_critical_failure | `voltage_print_on_bypass` | `false` | H: the proof that makes him stand down | 45, 53 |
| `m02_ghost_deal_accepted` | m02_ransomed_trust | `ghost_deal_accepted` | `false` | R (kept: Ghost opens the side door) / O (broken: Ghost locks it; main route unaffected). With `m02_completed` and neither deal value, the "unanswered" branch | 13, 14 |
| `m02_exposed_hospital` | m02_ransomed_trust | `exposed_hospital` | `false` | R with the above; talk-down option | 13, 20 |
| `m02_ghost_deal_refused` ✱ | m02_ransomed_trust | `ghost_deal_refused` | `false` | R: Ghost's parley gives the guard change, a window past the outer lock; Ghost doesn't sell | 15 |
| `m02_ghost_keys_used` | m02_ransomed_trust | `ghost_keys_used` | `false` | O when the deal was also broken: Ghost watches the player's route (a camera alert that the security office can blind) | 16 |
| `m02_gary_protected` ✱ | m02_ransomed_trust | `gary_protected` | `false` | P + H: the workshop's full scene, both ways (with `m02_completed`): protected, Gary is SAFETYNET's consultant, at the workshop door, who asks the player to talk round or take in Imran Siddiqui, the technician he trained; unprotected and not `m02_exposed_hospital`, he is a technician on the floor and, talked round, opens the power-room door. With `m02_exposed_hospital`, also Imran's grievance (Gary in work or not) | 23 |
| `m02_reeves_fate` ✱✱ | m02_ransomed_trust | `reeves_fate` | `""` | Prop: Reeves on the rota sheet (at large: `escaped`, `missed`, `unnoticed`, with `m02_completed`) | 21 |
| `m02_insider_asset_arrested` / `m02_insider_asset_escaped` | m02_ransomed_trust | as named | `false` | Prop: the read rule when `reeves_fate` is empty | 22 |
| `m03_sterling_on_call_seen` ✱ | m03_ghost_in_the_machine | `sterling_on_call_seen` | `false` | O on `escaped` only: she keeps the m03 threat (a stand-off with a talk-down) | 33 |
| `m04_static_left` ✱ / `m04_static_left_alone` ✱ | m04_critical_failure | as named | `false` | P: Static beside Voltage on `static_left and not static_left_alone`; his kit on the bench (a prop) on `static_left_alone` | 46 |
| `m04_vance_is_ally` ✱ | m04_critical_failure | `vance_is_ally` | `false` | H: the power room's phone slot, after a captured Voltage | 50 |
| `m07_elena_outcome` | m07_architects_gambit | `elena_outcome` | `""` | H: the phone slot when neither Voltage nor Vance holds it | 90 |
| `m07_mercer_fate` | m07_architects_gambit | `mercer_fate` | `""` | P: Mercer in the server hall (with `m07_completed`, row 87) | 87, 88 |
| `m07_mercer_ko` ✱ | m07_architects_gambit | `mercer_ko` | `false` | P: rules Mercer out (custody) | 87, 88 |
| `m07_hollis_resolved` ✱ | m07_architects_gambit | `hollis_resolved` | `""` | Prop: Hollis on the duty board on `evaded` | 92 |
| `m07_debrief_stance` ✱ | m07_architects_gambit | `debrief_stance` | `""` | H on `hardened`: the projection desk; L: third line of Tesseract's case | 99, 102 |
| `m08_triple_agent_first_payment` ✱ | m08_the_mole | `triple_agent_first_payment` | `false` | H: the payment (today always equal to `nightshade_triple_agent`) | 104 |
| `m08_nightshade_arrested` ✱ | m08_the_mole | `nightshade_arrested` | `false` | P: the door's full scene in cuffs at the forward post; the deal. Read as `m08_nightshade_arrested and not m08_nightshade_ko_before_fate` (m10 change 24) | 107 |
| `m08_nightshade_ko_before_fate` ✱ | m08_the_mole | `nightshade_ko_before_fate` | `false` | P + R: silent in the van at the forward post ("Door."); brought to the blast door on a tether, "Manual." and the hand crank (m10 change 23) | 107 |
| `m07_team_assignment` | m07_architects_gambit | `team_assignment` | `""` | O: the backdoor channel when `m07_completed and (m07_team_assignment != "trojan_horse" or m07_team_redirected)` (§4.2); P on uncovered Fracture (with `m07_completed`): Social Fabric in the media room | 81, 83, 84 |
| `m07_team_redirected` | m07_architects_gambit | `team_redirected` | `false` | O: a smaller backdoor channel (the redirect also reads `trojan_horse`) | 82 |
| `m06_assets_seized` | m06_follow_the_money | `assets_seized` | `false` | H: two empty guard posts and a gap in the fence, named by HaX at the fence | 72, 79, 80 |
| `m04_disclosure_choice` | m04_critical_failure | `disclosure_choice` | `""` | L+: first line of Tesseract's case; the strongest talk-down option on `full` | 48, 59 |
| `m08_accused_vector` ✱ / `m08_accused_phantom` ✱ | m08_the_mole | as named | `false` | P: whether Vector and Phantom join the team and the suspect list (only with `m08_completed`) | 112 |
| `m08_vector_apologised` ✱ / `m08_phantom_apologised` ✱ | m08_the_mole | as named | `false` | P: as above | 112 |
| `m08_vector_hostile` ✱ / `m08_phantom_hostile` ✱ | m08_the_mole | as named | `false` | P: as above (latches on a knock-out too) | 112 |

**Tier 2** (lines only: 27 variables)

| Alias | From | Var | Default | Use | Rows (§2) |
|---|---|---|---|---|---|
| `m01_final_choice` | m01_first_contact | `final_choice` | `""` | L: second line of Tesseract's case (`""` with `m01_completed` reads as arrest) | 1 |
| `m01_player_launched_attack` | m01_first_contact | `player_launched_attack` | `false` | L: how directly the offer is made (signposting unchanged, §4.3) | 2 |
| `m01_maya_ko` ✱ / `m01_kevin_ko` ✱ / `m01_sarah_ko` ✱ | m01_first_contact | as named | `false` | L: whether the clean first-day talk-down option exists (with `m01_completed`) | 6 |
| `m02_patient_assaulted` ✱ | m02_ransomed_trust | `patient_assaulted` | `false` | L: as above | 26 |
| `m02_bed4_manually_stabilised` | m02_ransomed_trust | `bed4_manually_stabilised` | `false` | L: talk-down option | 19 |
| `m02_patient_bed4_deceased` | m02_ransomed_trust | `patient_bed4_deceased` | `false` | L: a ledger answer of his, which stings first and decides nothing | 19 |
| `m03_guard_bribed` | m03_ghost_in_the_machine | `guard_bribed` | `false` | L: HaX and Finance | 38 |
| `m04_crew_lost` | m04_critical_failure | `crew_lost` | `false` | L: his ledger answer, if the player argues from Albion (stings, decides nothing); the inquest line in "Elsewhere" | 47, 59 |
| `m04_robert_vance_ko` ✱ | m04_critical_failure | `robert_vance_ko` | `false` | L | 51 |
| `m05_entropy_program_exposed` | m05_insider_trading | `entropy_program_exposed` | `false` | L: the media room's story names the player (the optional objective exists for every Fracture-uncovered player) | 66 |
| `m05_elena_treatment_funded` | m05_insider_trading | `elena_treatment_funded` | `false` | L: epilogue | 65 |
| `m05_final_choice` | m05_insider_trading | `final_choice` | `""` | L: the epilogue's line on the twenty-three placements (blown on `public_exposure`; Torres' names on `turn_double_agent`) | 60, 63 |
| `m05_found_pipeline_list` ✱ | m05_insider_trading | `found_pipeline_list` | `false` | L: epilogue count of the forty-seven, with the two below | 62 |
| `m05_recruiter_deal_accepted` | m05_insider_trading | `recruiter_deal_accepted` | `false` | L: as above | 62 |
| `m05_recruiter_deal_confessed` ✱ | m05_insider_trading | `recruiter_deal_confessed` | `false` | L: as above | 62 |
| `m06_satoshi_stance` ✱ | m06_follow_the_money | `satoshi_stance` | `""` | L: how warmly the offer is made; a ledger answer | 76 |
| `m06_monitoring_enabled` | m06_follow_the_money | `monitoring_enabled` | `false` | L: names the HashChain tags as one of the operations disclosure would burn (§4.1) | 71 |
| `m07_countdown_expired` ✱ | m07_architects_gambit | `countdown_expired` | `false` | L: "Seattle first. As scheduled." | 86 |
| `m07_architect_echo_heard` | m07_architects_gambit | `architect_echo_heard` | `false` | L: the extra recognition beat on the line | 120 |
| `m09_recruiter_secret` | m09_digital_archaeology | `recruiter_secret` | `""` | L: Tesseract's leverage line, and HaX's answer to it (`kept`: "I'll deal with that when this is done."; `told` / `confessed`: "They told me. Next.") | 61 |
| `m09_recruiter_offer` | m09_digital_archaeology | `recruiter_offer` | `""` | L: closing card (the Recruiter named, her network rolled up, half rolled up, or in place); on `taken` / `double_crossed`, his ledger sting on the invoice; on `named` / `refused`, the clean-record answer under the second claim (stage 3 confirms; m09 change 30) | 60 |
| `m09_reading_finished` | m09_digital_archaeology | `reading_finished` | `false` | L: record answer under the third claim ("Your file says I press it. Watch me."); his "Then I was wrong about one thing." after "Stop it" | 101 |
| `m09_albion_notified` | m09_digital_archaeology | `albion_notified` | `false` | L: record answer under the second claim ("I sent your notice. Tonight, from Helena.") and his answer ("Nine years late. Sooner than I managed."); HaX's line at the database choice | §1.3 |
| `m09_hax_confession_answer` | m09_digital_archaeology | `hax_confession_answer` | `""` | L: the speaker answer "[HaX. You're on speaker.]" under the third claim on `same_in_your_place` or `afterwards` (on `afterwards`, HaX's own line first); on `should_have_told`, HaX's unasked line and "She learned that from you."; her briefing line on `afterwards` (§5.4; m09 change 24, m10 change 38) | §5.4 |
| `m09_deck_pulled` | m09_digital_archaeology | `deck_pulled` | `""` | L: on `alpha_tapes`, the record answer from his Tomb Alpha teaching notes under the third claim (m09 change 25, m10 change 31) | 60, §13 item 25 |

**Tier 3, cut:** `m04_casualties_occurred`. Without `crew_lost` it means the bank vented into an empty hall, and there is nothing left for Tesseract to argue with. (It was already exported, so no export change.)

65 variables plus nine `completed` imports (stages 1–2 added `m09_sleeper_shortlist` to Tier 1 and `m09_deck_pulled` to Tier 2). Victoria's KO branch, Voltage's capture and the rest of the "absent" values put the room's default occupant in place (§5.3).

### 3.3 Export additions to m01–m08

**JSON only, approved (F2–F4).** One line each in the source mission's `exportGlobals`; no ink, no audio. The orchestrator makes these when stage 9 builds the importing mission, not before. Each name is already a key in that mission's `globalVariables`.

| Source | Add to `exportGlobals` | Read by |
|---|---|---|
| m01 | `maya_ko`, `kevin_ko`, `sarah_ko` | m09, m10 |
| m02 | `ghost_deal_refused`, `gary_protected`, `patient_assaulted` | m09, m10 |
| m03 | `sterling_on_call_seen` | m10 |
| m04 | `voltage_print_on_bypass`, `static_left`, `static_left_alone`, `vance_is_ally`, `robert_vance_ko`, `lore_safehouse_address_found` | m09, m10 |
| m05 | `recruiter_deal_confessed`, `found_pipeline_list` | m09, m10 |
| m06 | `satoshi_stance`, `minder_walked` | m09, m10 |
| m07 | `countdown_expired`, `hollis_resolved`, `found_tomb_gamma`, `debrief_stance`, `mercer_ko` | m09, m10 |
| m08 (new block; it has none) | `nightshade_arrested`, `nightshade_triple_agent`, `triple_agent_first_payment`, `nightshade_ko_before_fate`, `tomb_gamma_location_known`, `debrief_stance`, `netherton_ko`, `netherton_hostile`, `hax_ko`, `accused_vector`, `accused_phantom`, `vector_apologised`, `phantom_apologised`, `vector_hostile`, `phantom_hostile`, `nightshade_tidied` | m09, m10 |

38 names across eight missions (round 1 withdrew `halloran_accused`, `named_on_evidence` and `suspect_theory`, Tier 3). After each addition, run the validator on the source (export names must stay stable from then on, CARRY_OVER_PLAN 2.9). JSON-only additions work for runs already finished, because a run's snapshot holds every one of its own globals.

**Ink changes, approved by the user (F5, 2026-10-20).** Neither changes a spoken line, so no audio is regenerated.

1. **m02 `reeves_fate`.** Add a string global (default `""`) set once in `m02_closing_debrief.ink` where the debrief already routes (`:646-668`). Values: `arrested`, `ko`, `flagged` (all in custody); `escaped`, `missed` (walked out; at large); `unnoticed` (still on staff; at large for the finale). Public exposure is not a separate route (it rides on arrested, `:677`), so it gets no value. Then export it.
2. **m07 `teacher_discussed`.** Promote the local ink `VAR` to a scenario global (add it to `globalVariables`, default `false`, and a `#set_global:teacher_discussed:true` beside `ink/m07_phone_agent_0x99.ink:777`). Then export it.

**Runs finished before the ink changes** have neither global, so they import `""` / `false`. The fallbacks are therefore the read rule for every existing save, not only a contingency: Reeves reads from `insider_asset_arrested` / `insider_asset_escaped` whenever `m02_reeves_fate == ""` and `m02_completed` (row 22); HaX's reveal for a pre-change m07 run uses the "teacher not discussed" form, with `m06_architect_identity_found` still choosing between the two openings (row 98).

### 3.4 m09's exports, read by m10

| Var | Values | Set where | m10 use |
|---|---|---|---|
| `nightshade_shown_file` | `true` / `false` | the triple-agent branch only: the player sends Nightshade his own recruitment file from the drop terminal, any time after finding it and before the debrief | which way he tips the board at the door: the override, or the tripwire (row 105) |
| `sleeper_named` | `true` / `false` | set only when the Recruiter has said the name (taken or double-crossed, Beat 2.4); the cross-reference no longer names her (m09 change 6) | the sleeper detained at the briefing; the whodunit off (row 117) |
| `sleeper_shortlist` | `true` / `false` | set on reading the Harwick & Lowe placing sheet in the open stacks (Kowalczyk and Quintero), whatever the order; optional (m09 change 6) | with m10's `not m09_sleeper_named`, HaX's "Two faces from Helena. Watch both." at the private aside, which replaces the alibi clue (§4.4) |
| `recruiter_offer` | `taken` (took the name; HaX pulled the Alpha tapes, or nothing; her file wiped) / `refused` (refused, or hung up; HaX pulled the Alpha tapes, or nothing; her file wiped) / `named` (refused, or hung up, and HaX pulled her file) / `double_crossed` (took the name, then pulled her file) / `""` (m09 not played). The call's first line sets `refused` (m09 change 4) | the Recruiter's call and the tape-deck choice that ends it, inside the call, every player | the closing card's one rule (§4.6): `named` names her and rolls up her network; `double_crossed` names her and rolls up about half of it; `taken` and `refused` leave her at large and her network in place (row 60). On `taken` / `double_crossed`, his ledger sting on the invoice; on `named` / `refused`, the clean-record answer (m09 change 30; stage 3 confirms both) |
| `deck_pulled` | `her_file` / `alpha_tapes` / `none` / `""` (m09 not played) | which tape HaX pulled at the deck (m09 change 25; replaces §13 item 25's working name `alpha_tapes_saved`, because `recruiter_offer` can't say whether the Alpha tapes were saved) | on `alpha_tapes`, the Tomb Alpha teaching-notes answer under the third claim (§4.1) |
| `albion_notified` | `true` / `false` | the player has HaX send Tesseract's unsent vendor notice from the drop terminal, any time after flag 3 and before the debrief (optional) | a record answer under the second claim and his answer; HaX's line at the database choice (§4.1) |
| `hax_confession_answer` | `should_have_told` / `same_in_your_place` / `afterwards` / `""` (m09 not played; never empty on an m09 save, because flag 4's read waits on the answer) | the player's answer to HaX's confession in the identity scene (§5.4). m06 name not found: "You should have told me." / "I'd have done the same in your place.". m06 name found: "You should have taken it to Netherton." / "I'd have sat on it too." (m09 change 19). On every form, a third answer, her own line back to her: "Afterwards. Not during." (`afterwards`, m09 change 24) | `same_in_your_place` or `afterwards`: the speaker answer "[HaX. You're on speaker.]" under the third claim, on `afterwards` with HaX's "All right. Let him hear it from me." first; `should_have_told`: HaX's unasked line at the core and "She learned that from you."; `afterwards` also gets her briefing line ("You gave me my own line back in Helena. I'm holding you to it."; m10 change 38). No answer is the wrong one |
| `recruiter_secret` | `""` (never sold the list, or m09 not played) / `confessed` (owned up in m05) / `told` (owned it on the Recruiter's m09 call) / `kept` (hung up and said nothing) | the Recruiter's call; its first line sets `kept` / `confessed` / `""` by branch, and owning it overwrites `kept` with `told` | Tesseract's leverage line and HaX's reply (row 61) |
| `reading_finished` | `true` / `false` | the player read the Reading (in Sorensen's safe) to its last page, the prediction about them | a record answer under the third claim, and his line after "Stop it" (§4.1) |

Nine exports in all (stages 1–2 added `sleeper_shortlist` and `deck_pulled`), plus `m09_completed`.

### 3.5 m10's exports

For a later season; nothing reads them yet. Seven values:

- `ending`: `arrest` / `surrender` / `lethal` (justified) / `executed` (cold; m10 change 20) / `scorched` / `joined`.
- `database_outcome`: `secured` / `disclosed` / `both_wiped` / `published`.
- `sleeper_caught`: true on a right accusation (face to face or on the line), and from the start on `m09_sleeper_named`; false if never named, including a knocked-out Kowalczyk nobody accused.
- `wrong_accusation`.
- `head_start_out`: `none` / `zero_day` / `ghost` / `both`.
- `partial_release`: `none` / `small` / `large`.
- `media_story_ran`: set true on `executed` whatever the media room's outcome (m10 change 40).

Stage 9 adds them; they cost nothing and stop the next season having to ask for an ink change. The local decision globals (the briefing stance on Quintero, each slot's decision, Ghost's outcome, the tasks, the accusation, the points landed, the core's choices) are named by stage 3 (m10 stage 1 §13).

## 4. m10 ending matrix

Six endings: four successes (arrest, surrender and cooperation, justified lethal force, and cold lethal force, the darkest), Scorched Earth, and Join ENTROPY. User decision F11 split lethal force in two, each signposted (m10 change 20). All six come after the same four VM flags, so `concludeRequires` is the same for every ending (the technical work only) and the ending is a global the debrief and credits read.

### 4.0 The opening and the route

**Start kit** (every branch; inventory doesn't carry between missions): the player's usual kit plus Kowalczyk's PIN cracker, its description saying who gave it (m10 change 26).

**Briefing** (a cutscene at the forward post, about four minutes; Netherton runs it in person, HaX beside him all night). Played m09: WREN detained on screen if m09 named her (Quintero cuffs her against the van; Arakawa then breaches alone, or Quintero if Arakawa takes silent Nightshade to the blast door); otherwise the kit check, with the breaching case open on the table and its sign-out sheet ("opened 01:52, Kowalczyk / Arakawa"). A captured Voltage is visible in the second van, the only helper the briefing shows. The stakes give both modes of the Publication and both lines of his sheet (§1.2). **Quintero objects** to going in tonight, for the second time in two days; the player may back her or Netherton ("Noted, Agent Quintero. Twice now. The record also says six o'clock."), and she answers it at the outer lock (m10 change 15). Netherton's handbook line goes here: the chapter on raids by invitation is one page long, and it says don't. Vector and Phantom are at the table or declined, by branch. Nothing about WREN is said in front of the team. **The private aside** (m10 change 35): Netherton and HaX take the player to the van end, the team in view and out of earshot. One of this team, "placed eleven years ago"; he keeps them together because benching four agents tells WREN they know; he will say nothing to them, "and neither will you". On `m09_sleeper_shortlist and not m09_sleeper_named`, HaX: "Two faces from Helena. Watch both." Named form on `m09_sleeper_named`: "She was the one the ledger meant. If there is a second, it doesn't show one. Watch anyway." **Never played m09** (R2-11): the same scene carries the three facts m09 would have given, in about 45 extra seconds. On `not m08_completed`, Netherton first says who Nightshade is. The name (Dr Adrian Tesseract, proved in Helena from his own hand, with HaX's one sentence: SAFETYNET's former chief strategist, who trained her and half the field, and walked out seven years ago) and the hour go in front of the team; the third fact, WREN, goes at the private aside. Kowalczyk hands over the cracker here ("This one's mine. Never been through stores, never been near him.", dropping the last clause on `not m08_completed`). Stage 2 reads this path with no other mission in mind.

**The night in UTC** (the Citadel's clock; in Montana it is the evening of day 12, on the Citadel's clock the early hours of day 13). The forward post is one room with two ends: the vans and the table at the road end, where Netherton, HaX and Malhotra stay all night, and the gate and its terminal at the other. From 01:45: the kit check, with the breaching case open on the table until the split; at 01:58 WREN copies Malhotra's badge, which lies by his headset, with a cloner from the case. **The pre-breach split** (R3-03), while the player works flag 1 at the gate terminal, so Arakawa's beat fills VM time (m10 change 16): Quintero and Kowalczyk recon the service tunnel, which forks, and both branches come out by the core's service door, so the fork decides nothing (m10 change 11). Arakawa holds the gate beside the player and, at 02:10 on the countdown object, makes a call off the net to his daughter in Billings; Malhotra, from the van end, logs it aloud ("Arakawa, you're off the net."), which puts both men where someone could see them. The pair come back about 02:20 (Quintero: "We split at the fork. I took the drain. It comes up by the service door anyway."; Kowalczyk: "Door end. Service door's real. Steel, a reader, a camera that doesn't move."). About 02:30: the breach, with Netherton and, where present, Vector and Phantom at the gate. The countdown objects then move on story beats (§4.2).

**Where the raid team stands after the breach** (R2-22). The engine has no friendly follow or escort, so companions are staged per room (N-14): each is placed (`setVisible`) in the room where they meet the player, with one line that covers the move. Quintero is placed in each main-path room as the player enters it, except the gallery; she catches up at the outer lock by the service side and **holds the lock** while Tesseract talks to 0x00 alone ("He wants you on your own. I'll be on this side of it."), coming in at the noise if WREN does (m10 change 30). Malhotra runs comms from the van. Arakawa and Kowalczyk are placed one room ahead, Kowalczyk breaching, which is why her badge turns up everywhere; on the silent-Nightshade branch Arakawa instead holds the blast door with Nightshade all night. Kowalczyk peels off in the server hall ("I'll take the service side and meet you at the lock."), and Arakawa has one line about it ("Service side. She always takes the door nobody's watching."), or Quintero if Arakawa is at the blast door. The player accuses face to face when the accused is in the room and **on the line** otherwise (m10 change 3). The raid net speaks through HaX's channel and counts as hers for the one-voice rule (Netherton, Malhotra, any accused or recalled officer).

**Why the readers log SAFETYNET badges.** Tesseract loaded SAFETYNET's own credentials from the stolen database, so the bunker's readers accept them; the blast door knows 0x00 the same way, and opens slowly for them by name (unless silent Nightshade's crank opens it). At 02:10, at the door end of the recon, WREN used the copy of Malhotra's badge on the core's service door and propped it: Tesseract's way out (Scorched Earth uses it) and, if 0x00 won't press the key, her own way back to the key (§4.4; m09 change 8, m10 change 27). The service door's camera is a dummy, a box on a bracket the refit never wired (m10 change 36). No 02:10 entry exists on the named-in-m09 branch.

**The route.** Forward post (flag 1) → blast door, keyed to 0x00 → tunnel → security office (Ghost's call on the duty handset) → workshop floor → power room → server hall (flags 2 and 3; the disarm is armed here; the head start is found here and can be stopped here; the gallery door opens only once flag 3 is in, so nobody reaches the lock without the chance to stop the head start or the core without the disarm; m10 change 19) → media room (optional, the first planned cut) → gallery → outer lock (the head start goes as it opens, unless stopped) → core (flag 4). The power room is on the main path (R2-13): the gallery's blast shutter runs off it, and the player has it cut at the switchgear, by whoever holds the power room's slot (§5.3) or by hand. HaX points the way after flag 1: "Whoever's in the power room runs your lights." In player-facing text "the plant" is never used for the room, and the sleeper is "WREN" or "the sleeper", never "the plant" (R3-10). **At most one non-HaX voice on the line per room** (R3-01).

### 4.1 The core sequence

The core is one room (D-16): the core host terminal on one side, Tesseract seated at the release console on the other. He has been expecting Agent 0x00 since the blast door opened for them by name (row 119), because he needs a SAFETYNET hand on the key (§1.2).

He is non-hostile and can't be knocked out before the choices; his hand rests beside the key.

0. **Arrival.** He doesn't pause anything, and says why there is no hurry (m10 change 37): "Take your time. It goes at six whatever we say. Or now, if someone presses this. I'd rather it was you." The core's countdown object holds the last beat's time; nothing moves while they talk. He greets HaX on the player's handset, "Ninety-nine. You've done well with them."; she refused the name on his m09 call ("It's HaX. It has been for seven years."), so here she answers "Still HaX." on every branch (m09 change 13, m10 change 17). Then, to the player: "Get on his box. He'll keep." The player takes flag 4 at the core host terminal; he is an NPC the player approaches. He has two or three idle lines on events the game sees (first use of the host terminal, a field-guide hint request, a failed submission), never on time, and HaX's field-guide offer keeps working. As flag 4 lands, HaX reads off his box: on `not m09_completed`, two lines carrying the fact exchange 2 rests on (he argued for the vendor nine years ago and lost; he wrote the notice and never sent it); on an m09 save, "The notice you read in Helena is on here too." Asked about the head start: released, "Two hours for people who'll waste it. They were always scenery."; stopped, "Good. I never liked paying them." (§13 item 19). (Flag 3 was taken earlier, at the server-hall console: R2-02.)
1. **His case** (gated on flag 4, m10 change 43: walking to him before it gets only "Finish on my box first. I'll keep."). A conversation, not a fight. First the Publication, plainly, in six lines at most: the hour, the fallback city by city, his figure from memory, why it ends the arms race. Then **the offer, which every player hears** (D-21): it has to be one of them; if he presses it, it's a crime, and if they press it, it's a confession. Then his evidence, opening on his m07 handset line turned round, "I told you once I prefer to watch. I've watched.", with at most three lines from the player's record, by priority: m04 `disclosure_choice`, then m01 `final_choice`, then m07 `debrief_stance` (D-08), each with a default, two at most before the player can answer; it closes "Since your first day." He never claims to have read the player's file. On `m09_recruiter_secret = kept`, he tells HaX on the open line that her agent never explained the receipt (she: "I'll deal with that when this is done."); on `told` or `confessed` she cuts him off ("They told me. Next."). On `m09_recruiter_offer` `taken` or `double_crossed`, one ledger sting on the invoice, which decides nothing: "You bought WREN from my Recruiter. You understand costing." (m09 change 30; stage 3 confirms.)
2. **The player's answers** (the talk-down): **three short exchanges**, one argument in three steps. Each time he makes a claim, the player picks an answer, and only an answer that meets that claim lands. He moves with the player: claims 2 and 3 each open on the exchange before (one opener after the rebuttal landed, one after a record answer landed, one after a miss), so he never concedes something that wasn't proved. **Four fixed slots per exchange** (m10 change 31): the mission's rebuttal; an evidence decoy about the same length, citing something found tonight against the wrong claim; and two record slots, where a plain decoy fills the first empty record slot. A record answer placed under the wrong claim takes a slot after slot 4. On a cold start the rebuttal is 2nd, 1st and 3rd of three buttons in the three exchanges, so no fixed button strategy reaches two points; the stage 1 play-through recorded a listener at 3 of 3 (m10 stage 1 §17). A landed point shows (D-20): he stops, looks at the console, a beat of silence, the music takes a step down, then a concession of exactly what was proved. A miss: he answers at once, dry, and nothing moves. **Two of three for surrender.** Still easy, but the player has to listen.
3. **The console.** **Stop it** (the disarm armed at the server hall) or **"Show me how it works"** (the first step towards Join, §4.3). Stopping it is one action and he doesn't fight it: "Then we do it the slow way. In court. I've a lot to say." On `m09_reading_finished`: "Then I was wrong about one thing." Any open backdoor channel releases its queued batch now (the partial release; "Seattle first. As scheduled." on `m07_countdown_expired`). If WREN is still free, she comes through the service door as the player reaches for the key (§4.4).
4. **The database** (needs flag 4). Netherton comes on the line to name the costs, and the two men speak for the first time in seven years: "Magnus." / "Adrian." (m10 change 28). Three options. HaX or Netherton says the cost of each on the line **before** the player chooses (D-05, R2-12):
   - **Secure** the stolen copy as evidence; SAFETYNET keeps its master. Gain: every operation that runs on those entries keeps running, and one pays off in the epilogue (§4.6). Cost: the hoard stands, and nothing gets fixed. HaX reads one entry aloud, the infusion-pump flaw in 140 hospitals he used in his second claim, "still live next year if we do this", so the choice is also an answer to him. (`secured`)
   - **Disclose**: wipe Tomb Gamma's copy and send SAFETYNET's master to the vendors on a coordinated-disclosure schedule. Cost: two live operations that run on those entries burn, and they are ones the player knows. Netherton names them, by branch, from: the watch on a recruited Victoria, the triple-agent channel to Nightshade, the HashChain tags (`m06_monitoring_enabled`). Defaults, live after the raid for every player: the watch on the buyers Ghost was selling the head start to tonight (every player hears the sale) and the tap SAFETYNET runs on Zero Day's brokers (Vos among them). Each burned operation gets an epilogue beat with a consequence (§4.6). He signs anyway (user-approved, F6). A player who sent the Albion notice in m09 has done this once already. (`disclosed`)
   - **Wipe both**. SAFETYNET left Nightshade's door into its vault open on purpose, as a trace to follow the theft here (D-13; canon, F7), and that line is still live. Through it the player can erase SAFETYNET's master too. Cost: nothing is fixed, and every flaw is still out there, now unmapped. This is Scorched Earth (§4.5). (`both_wiped`)
5. **Tesseract** (not after "wipe both"). User decision F11: two lethal-force versions, each signposted (m10 change 20).
   - **Two or more points:** he stands with his hands empty. "Ask me, then." The player accepts his cooperation (**surrender** ending), arrests him anyway (**arrest** ending), or takes the cold choice below. Justified lethal force is not offered here (D-11, reworded: it covers only the justified version).
   - **Fewer than two:** "Arrest me, then." The menu: arrest him, or the cold choice. On "arrest", as the player moves, **he makes a move that threatens lives**: his hand goes to the console, where one key sends the first city's list out anyway (an act he makes, not a dead-man switch). In that moment: **[Fire.]** (**justified lethal force**, `lethal`, one narrated line; HaX was a second behind: "I was a second behind you. Log it. I'll sign under you."), or **hold fire**, and HaX kills the feed through the host the player now controls, in time (**arrest** ending).
   - **The cold choice**, offered in both menus, clearly labelled and confirmed: "[Shoot him where he sits.]" on fewer than two points, "[Shoot him where he stands.]" on two or more. The narrator's warning says plainly that his hands are empty, he isn't moving, it would be an execution, and HaX is on the line. Then "[Do it.]" or "[Lower the weapon.]". Only "Do it." sets `ending = executed`. It can't be reached by a misclick, a knock-out, the clock, a failed talk-down or any import. The justified button's "[Fire.]" never shares words with the cold labels.

**The three exchanges.** Each has the mission's own rebuttal, always on the menu, so surrender is open to any player. Under it, at most two answers from the player's record, by the priority shown (lines in m10 stage 2 §2.3):

| His claim | The mission's rebuttal | From the record (priority order, two shown at most) |
|---|---|---|
| "The cost is acceptable." | Someone corrected his casualty sheet and he signed the old number: the bench copy on the workshop floor's critical path carries Asante's correction (the model credits the hospitals' recovery twice, so it understates the dead) and his second signature under the unchanged figure (m10 change 29). Decoding the margin note (optional) names Asante and sharpens the rebuttal. Evidence decoy: his schedule puts the hospitals first (order, not price). Plain decoy: he'll be in a cell before the month is out (about him). | `m07_debrief_stance = hardened` (the live curve on the projection desk); `m02_bed4_manually_stabilised`; the clean first day (with `m01_completed`, no m01 KOs, no `patient_assaulted`) |
| "Services like yours hoard. Only a shock fixes it." He gives it a victim: the infusion-pump flaw in 140 hospitals, known for three years and called an asset. | "Only a shock" is untested, because he never tried a letter: nine years ago he argued the Albion flaw should go to the vendor, lost, and never sent the notice he drafted (from the m09 papers, or HaX's flag 4 lines on a cold start). Evidence decoy: the pump flaw is on his own schedule (the price again). | `m04_disclosure_choice = full` ("And nobody died for it"); `m09_albion_notified` ("I sent your notice. Tonight, from Helena."); `m02_exposed_hospital`; on `m09_recruiter_offer` `named` or `refused`, the clean record ("Your Recruiter offered me a name for a file. I wouldn't buy a name from her."; m09 change 30, stage 3 confirms) |
| "Someone has to make it hurt. Better me, with clean hands." He starts the line ("Let it hurt afterwards, not during.") and ends "I'd rather it was me". | The clean-hands argument (m10 change 31): "Better you? You need my hand on that key so yours stays clean." His concession gives up exactly that ("Better me, I said. And I brought you."). Both decoys answer earlier claims ("target list"; "Nobody elected you"). | The speaker answer, "[HaX. You're on speaker.]" (`m09_hax_confession_answer` is `same_in_your_place` or `afterwards`, with HaX's "All right. Let him hear it from me." first on `afterwards`; m10 change 38); on `should_have_told`, HaX's unasked line ("My agent told me I sat on it. They were right. You never told me anything.") and then "She learned that from you."; what HaX does with the line, told in m09 (`m09_completed`): you keep your own hurt for afterwards so you can do the job, and you never hand it to strangers (row 120); `m09_reading_finished` ("Your file says I press it. Watch me."); his Tomb Alpha teaching notes (`m09_deck_pulled = alpha_tapes`); Voltage stood down; a technician talked round. On `m07_architect_echo_heard`, HaX has one beat as he says the line |

The decoys are fixed lines per exchange (an evidence decoy and a plain decoy), plus record answers placed under the wrong claim. He answers some of the player's lines from his ledger, which sting first and decide nothing: `m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`.

### 4.2 The Publication's channels and partial release

The Publication goes out through up to three channels, and the cells get their head start through a fourth. Only the first must be shut to stop the Publication; the others decide the cost.

| Channel | Present when | Shut by | If left open |
|---|---|---|---|
| Tomb Gamma's own release servers | always | the core (step 3) | the key is pressed (Join): everything, everywhere, in the same minute. The 06:00 fallback (city by city) stays on the countdown as menace and never fires before the core in normal play |
| The cells' head start | always | an optional task at the server-hall console, beside the backdoor (needs flag 2); or a slot-holder has already stopped their share in the scene. Zero Day's share: recruited Victoria confronted (she withdraws the order), escaped Victoria let walk on her trade, or arrested Victoria's information used on Vos (he withdraws it). Ghost's share: deal kept, parley, or Ghost talked out of the sale | always set for 04:00; flag 2 is where the player finds it (HaX: "It's set for four. It goes when the outer lock opens."); goes out **as the outer lock opens** (the lock's countdown object reads 04:00, then "EARLY ACCESS: RELEASED", with no voice to read it), so every gallery decision about Zero Day's share is in time (m10 change 19). HaX's warning as the player leaves the server hall: "Fifteen minutes to their head start. That console's your last chance at it." |
| The Trojan Horse backdoor | `m07_completed and (m07_team_assignment != "trojan_horse" or m07_team_redirected)` (the redirect also sets `trojan_horse`; never played m07 means no channel) | an optional console task in the server hall (needs flag 2) | **partial release**: the batch already queued on the backdoor goes out when the core is shut. Small on `m07_team_redirected` (14 million systems), large when Austin was never covered (47 million) |
| Social Fabric's story machine | `m07_completed and m07_team_assignment != "fracture"` | an optional task in the media room | the "massacre in Montana" story runs; on `m05_entropy_program_exposed` it names SAFETYNET and the player's designation |

**The clock** (R3-02; m10 change 25). Two marks, **04:00 UTC** (the cells' head start) and **06:00 UTC** (the fallback), driven by story events, not wall-clock time, so slow VM work never costs the player anything. There is no countdown engine feature: time is shown by lines and by a countdown object in each main-path room whose text reads a global set on story beats (orchestrator ruling; an engine feature may be proposed later with F10). The steps: 01:45 at the briefing, 02:10 at Arakawa's call, 02:45 at the security office, 03:00 the workshop, 03:15 the power room, 03:30 the server hall, 03:45 leaving it, 04:00 at the outer lock (stage 4 owns the exact values). People talk about it. The lock's object reads 04:00 as the lock opens, which is when the head start goes unless it was stopped; HaX warns the player twice (§4.2 table). Stepping out between flags 2 and 3, or visiting the media room, costs nothing. It never reaches 06:00 before the core; at the core the object holds the last beat's time while they talk (he doesn't pause it, m10 change 37), and on Join every object jumps to RELEASED. At 06:00, in the forward-post cutscene, the object on the table reaches 06:00 and nothing happens. The first city's batch ("Seattle first. As scheduled.") goes only through an open backdoor channel, as the partial release when the core is shut. Nothing on the clock ends the mission or forces an ending. With Austin covered directly and the head start stopped at the server hall, nothing is released at all.

**What the player sees of the database.** The server hall's schedule (flag 2) lists the first entries by city in plain words: a hospital group's infusion pumps, a county's dispatch software, a water utility's controllers (D-04). Closing the backdoor and killing the story are the hands-on version of "who gets hurt first", so the core's menu is the player's conclusion, not the lesson.

### 4.3 Join ENTROPY: signposting

The one non-success ending. A deliberate choice the player makes three times, never a trap:

Every player hears the offer as part of his case (step 1), so listening to the villain is never a step towards betrayal (D-21). Join starts only with an action:

1. At step 3 the player chooses **"Show me how it works."** He shows them the key. The narrator says plainly what pressing it means. The next menu always includes "Step back" and "Stop it."
2. The player chooses **"Give me the key."** HaX, on the line, says the player's designation and asks them not to. The narrator states the cost again: the mission ends here, working for ENTROPY, with the casualty figure. "Step away" is offered again.
3. The release key is an object at the console, labelled, with its own confirmation ("Publish the database to everyone, now?"). Only that press sets the ending, and it makes the Reading's prediction true. The key sends everything everywhere in the same minute; he says, quietly, "Thank you, Agent." and nothing else. WREN never comes through on this path.

It cannot be reached by a misclick, a knock-out, the clock, a failed talk-down, or any import. `m01_player_launched_attack` and `m06_satoshi_stance = wondered` change how warmly Tesseract makes the offer, and nothing else. m01's LAUNCH button is the precedent.

### 4.4 What earlier choices change

The route through the bunker works with every import at its default. These change the cost and who is standing at the end.

| What changes | Better | Worse | In-mission way round for the worse case |
|---|---|---|---|
| Partial release (§4.2) | Austin covered directly in m07 (`trojan_horse`, not redirected), or m07 never played | redirected (small channel); Austin never covered (large) | the server-hall task |
| The cells' head start (§4.2) | stopped at the server-hall console, or each cell's share stopped in its scene: Zero Day's by recruited Victoria confronted, escaped Victoria let walk on her trade, or arrested Victoria's information used on Vos; Ghost's by the kept deal, the parley, or talking Ghost out of the sale | the outer lock opens before it is stopped: it is out | the server-hall task, named by HaX when flag 2 goes in and again as the player leaves |
| Media story | Fracture covered in m07, or never played (the drafted story on the desk instead) | Fracture uncovered, and `m05_entropy_program_exposed` names the player | the media-room task. (On the executed ending a new version goes out at 06:00 whatever happened here, §4.5) |
| Nightshade (the door slot, at the forward post) | triple agent, shown his file in m09: he gives the override he was saving (the security office's alarm panel), then the player takes him in with the team or leaves him at the post. Arrested (`and not m08_nightshade_ko_before_fate`): brought from the second van in cuffs, offers the defences for a deal. The scene knows the player refused him one in m08 ("You said no deals. Netherton says otherwise tonight."), and refusing again is the first option. Silent or never played, brought to the blast door on a tether: "Manual.", and the crank opens it without announcing 0x00 | triple agent, not shown, payment unchecked: the tripwire at the tunnel's inner door (the door locks, the bunker and WREN are warned). Silent, left in the van: "Door." stays a word, and the door announces the player | check the payment against the m09 defence list; the security office reopens the door |
| Victoria, recruited | confronted with Zero Day's order from the schedule: she holds, opens the outer lock, and withdraws the order | trusted without checking: she sells the raid (an alarm, reinforcements in the gallery) | refuse her and take the lock the long way; HaX's doubt and a kept Nightshade's warning both come before the gallery's silent stretch |
| Victoria, escaped | without the m03 threat: a trade for walking out (Zero Day's order withdrawn, and which guard carries the lock card), or arrest her | with `sterling_on_call_seen`: a stand-off, a pistol held low | talk-down or knock-out |
| Victoria, arrested / KO'd / never played | arrested: rings on a secure line in the server hall and offers Vos's weakness (he resells Zero Day's early access and skims) for a reduced charge; deal or not, she tells it. In the gallery the player uses it (Vos withdraws the order and stands aside) or withholds it | KO'd or never played: Vos in the gallery, cold, with a trade (the lock card for his name off the report) | buy, refuse, or talk him out; the long way |
| Ghost (every player, on the security office's duty handset) | deal kept: side door, no sale, and Ghost's question; refused: Ghost's question back, then the guard-change window or a camera blind, no sale | deal broken: side door shut, a harder talk to stop the sale; with the keys used, Ghost watches the route. Unanswered (`m02_completed`, neither deal value): as broken, without the locked door. Stranger (never played): as unanswered | talk Ghost out of the sale; the main route; the security office blinds the cameras |
| Power room (main path) | Voltage captured: brought up after the breach and placed at the power room; the player lets him work his own switchgear (a faster cut; he could blind the gallery's camera and says he won't, and asks one thing for the inquiry) or does it by hand while he talks them through it. Otherwise the default technician Wendell Briggs at the panel, with Vance, else Elena, else HaX in the phone slot: tell Wendell what the servers are for (he cuts the shutter and asks to warn his colleague on the next shift) or work round him. Voltage escaped and stood down on his print, or talked down with the corrected sheet | Voltage escaped (and Static, if he left with him) at the switchgear | talk, fight, or cut the shutter by hand |
| Workshop | Gary protected: at the door as the player opens it ("You saved my career."); he recognises the bench's casing and the default technician Imran Siddiqui, whom he trained, and the player talks Imran round (leaving him his phone or not) or takes him in | Gary unprotected: on the floor beside Imran, talkable | talk, or clone the technician's card |
| Server hall | Asante, who can be talked into showing the schedule | Mercer at large (with `m07_completed`): a hostile boss with one line | fight, or sneak the schedule terminal while he is drawn off |
| Guards | `m06_assets_seized`: two posts empty, gap in the fence, named by HaX on arrival | full staffing | stealth and the cloner as in any mission |
| Who stands with the player | Vector and Phantom (with `m08_completed`; not accused, or apologised to, and not hit) | they decline, and Netherton says why | the default raid team |

**The whodunit** (row 117; R2-04, R2-06, R2-03; m10 stage 1 §8). Skipped on `m09_sleeper_named`, where `sleeper_caught` is true from the start: Kowalczyk is cuffed at the briefing, nobody props the service door, the door log has no 02:10 entry, the bench shows the cloner shipped "to WREN" and never used ("still in the case"), and the core has no WREN beat. Otherwise three clues, spread through the bunker. No clue names WREN on its own; clues 2 and 3 cross at one name. HaX's nudges say only what she can see and never name a suspect.

**What WREN did, and for whom** (m09 change 8, m10 change 27). The Initiative placed her eleven years ago; Tesseract took her tasking for tonight: see 0x00 safely to the core, and keep the core's service door open as his exit. She believes in the Publication, and her one goal at the core is the key. The suspects each have a visible reason, a beat, and something that clears them (m10 change 18): Quintero (argued against Helena and tonight; took the drain alone; the other Harwick & Lowe hire, father in care; cleared by clue 3), Kowalczyk (always a room ahead; took the door end; packed the case; cleared by nothing), Malhotra (his badge on the log; eleven years' service, the same as WREN's placement, m10 change 4; cleared by clue 2), Arakawa (a lateral hire who closed the county road, as he cleared Helena's police; packed the case; cleared by clue 2), and Vector and Phantom where present (cleared by clue 2).

1. **Door log** (security office, needs flag 1): at 02:10 the core's service door opened to a SAFETYNET badge, Malhotra's. HaX: "The log says Malhotra's badge. Malhotra was on with me at ten past." So somebody has a copy. Asked for the service door's camera: "That camera's a box on a bracket. Never wired." (m10 change 36.)
2. **Alibi** (on the line, any time after clue 1): who wasn't where somebody could see them at 02:10? The player saw Arakawa at the gate, on his call; HaX had Malhotra; Netherton had Vector and Phantom. That leaves the tunnel pair, Quintero and Kowalczyk, and since both branches of the fork come out by the service door, either could have opened it.
3. **The bench log** (workshop floor; m10 change 22): beside the supplier batches (the crackers Nightshade put into stores) is a cloner shipped "to WREN" in Task Force Null's breaching case, and the record it sent home: Malhotra's badge, copied at 01:58. At 01:58 the case was open on the kit-check table; its sign-out sheet on the forward-post table, readable any time and read out by HaX if asked, says "opened 01:52, Kowalczyk / Arakawa". Quintero was at the map with Netherton throughout, so the packers were the only hands in the case. The cracker is not a clue: the bench logs it by batch with no recipient (row 29).

**Helpers who replace a clue** (m10 change 11): Nightshade, kept or dealt, replaces clue 2, with ENTROPY's usual method, since he speaks before the split ("They always borrow a badge, and it's never the borrower's. Look for whoever went where nobody watches."); `m09_sleeper_shortlist` replaces clue 2 (HaX at the private aside, on `not m09_sleeper_named`); Phantom's list replaces clue 3 (the case went out with one more unit than its sheet lists, signed for by Kowalczyk and Arakawa). Imran, talked round, points at the bench log by name without replacing it. None is the answer on its own. A warned WREN (the tripwire) goes ahead a room early, at the workshop, so the face-to-face window is shorter (m10 change 9).

**Accusing**, any time after clue 1: face to face when the accused is in the room, **on the line** to HaX (passed to Netherton) when not, with the same outcomes (m10 change 3). Kowalczyk's last face-to-face moment is her peel-off in the server hall.
- **Right, face to face:** four cards in order, and she answers the first two with lies: the alibi ("Malhotra's badge, Malhotra's door. Ask him."), the cloner in the case ("I packed that case with Kenji. Ask him where he was at ten past."), Arakawa at the gate (broken from the player's memory), and her own words ("You said it never went through stores. Then it came straight off his bench."; on an m09 save, HaX's "The long way is over" comes back here). She cracks and is held at the forward post. `sleeper_caught` is true.
- **Right, on the line:** Netherton sends Quintero by the service side to take her at the door; Kowalczyk asks her question at 06:00 instead. With no Quintero to send, WREN reaches the core and the player stops her there; `sleeper_caught` is still true.
- **Wrong:** the innocent officer is led back with one line that is also a hint (Malhotra: "Eleven years. Check the log again."). The team loses that officer's job: without Malhotra, HaX's line drops one room early; without Arakawa, one more guard ahead (on the silent-Nightshade branch, the blast door's guard detail comes down with him and one more guard reaches the server hall behind the player; m10 change 23); without Quintero, nobody but the player stops WREN at the core; without Vector, his sealed door shuts; without Phantom, his list goes. `wrong_accusation` is true. Once the player holds the clearing evidence, Netherton **recalls** the officer over HaX's channel; their job returns from the next room. Never a death, never a blocked route.
- **None:** she acts at the core.

Knocking out a raid member holds them at the forward post but is **not** an accusation; it costs an epilogue line. A held raid member can still be accused on the line, with the same outcomes. A knocked-out Kowalczyk can't act at the core; if the player never names her, `sleeper_caught` stays false and the epilogue notes she was never named.

**WREN at the core.** If she is free (not caught, not knocked out, not on the Join path), the service door she propped opens as the player reaches for the key, and she comes through for it. Tesseract refuses her: "Not you, Halina. When they find out what you are, it proves nothing. It has to be one of theirs." The player hears his motive from his own mouth. She tries anyway. Quintero comes in from the lock at the noise and is wounded stopping her (a shoulder; she's talking at 06:00), or, with no Quintero, the player stops her (a knock-out). Either way the disarm goes through. WREN caught: he glances at the service door, nobody comes, "You found her. I wondered whether you would."; named on the line with no Quintero to send: "You found her. Too late to stop her walking in." On the Join path she never comes through: he already has the hand he wanted.

### 4.5 The endings

| Ending | Reached by | `ending` | Credits title |
|---|---|---|---|
| Arrest | stop; secure or disclose; then either two points and "arrest him anyway", or fewer than two, "arrest", and hold fire when his hand goes to the console | `arrest` | MISSION COMPLETE |
| Surrender and cooperation | stop; secure or disclose; two or more points; accept his cooperation | `surrender` | MISSION COMPLETE |
| Lethal force, justified | stop; secure or disclose; fewer than two points; "arrest"; [Fire.] when his hand goes to the console | `lethal` | MISSION COMPLETE |
| Lethal force, cold | stop; secure or disclose; either point count; the labelled cold choice, then "[Do it.]" (§4.1 step 5) | `executed` | MISSION COMPLETE, then AGENT 0x00: IN CUSTODY |
| Scorched Earth | stop; wipe both | `scorched` | MISSION COMPLETE, then AGENT 0x00: SUSPENDED |
| Join ENTROPY | the three steps of §4.3 | `joined` | MISSION FAILED, with the Publication's casualty projection (as m01's launch ending) |

**Lethal force, cold** (F11; m10 changes 20, 40). The darkest ending; its weight is the people who have to answer for it. One narrated line: his hands are empty, and the player fires. HaX says nothing for a long time, then the player's designation, once. No walkabout: Quintero comes in from the lock and takes the player's weapon without a word (if she is wounded or was sent back, Netherton's van team does it at the lock). At the forward post Netherton signs nothing: "I will not put my name under this one. You will be held until the board sits." HaX doesn't come to the van, and does not tell the player "the rest"; her last word is a later message: "I'll be at the board. I don't know what I'll say." At 06:00 Social Fabric sends a new version of its story with the player's photo on it, on every media-room branch (killed at the desk: sent from outside; running: updated; dark or cut: the draft goes out). There is no "massacre"; its one new paragraph, that a SAFETYNET agent shot an unarmed man in his own bunker, is true. Narrator: "At six the story goes out. Most of it is still a lie. The paragraph about the man you shot isn't." `media_story_ran` is true.

**Scorched Earth.** The chaos is his own dead-man purge (D-12), triggered by the wipe. He wired the core to purge itself if both copies died, because that is the one outcome where he can't win the argument and can't be made to answer for it. The core's fire suppression dumps, the lights go, the blast doors cycle, and in the dark he is gone by the service door WREN propped (or his own way, if she was caught). The player gets out with the team. Nobody holds the map, SAFETYNET included, and nobody fixes anything. At 06:00 Netherton suspends the player in front of the team: "I wanted to do the same. That is why you are suspended and I am not." A short hearing scene follows, with HaX beside the player.

### 4.6 Epilogue beats

Every ending except Join runs the same frame (m10 changes 5, 14, 33): the ending's own beat at the core, then **the forward post at 06:00**, as a cutscene under floodlights (nobody walks back up through nine rooms), then the close. Join's frame is the Citadel. **The close, in order:** the conclusion screen (`bond_visualiser`, titled by ending), the closing card, the teaser slot (§7), the credits roll.

**At 06:00.** First a short walkabout: the player picks whom to go to among the people the night left standing there, one line each, at most five, in this precedence: Quintero (on a stretcher if hurt, answering the briefing stance once more); Kowalczyk in the van if caught; a wrongly accused officer not recalled; HaX on `m09_recruiter_secret = kept` (the forty-seven); then Voltage, Gary and Imran, Wendell, Victoria. Then Netherton and HaX in a fixed order: Netherton's two lines with numbers (the head start, the partial release or the media story, the $12.8M on `m06_assets_seized`), the database's beat, the van on arrest and surrender, then HaX's promise from Helena, **"the rest"**, two lines: "The night he left, he asked me to go with him." / "I said no. It took me till morning." (m09 change 15, m10 changes 21, 39). Her last word comes as the table's countdown object reaches 06:00 and nothing happens. Two phone texts during the cutscene, unvoiced: Ghost's message, and the Recruiter's line on `double_crossed` ("I'll remember the shape of you."). The word "afterwards" is said at most twice in a run: his line in exchange 3, and HaX's "It's afterwards." on arrest; on Scorched Earth his card is its only use.

**Every promised payoff has a home** (m10 change 33): each person met tonight gets an outcome clause in the credits' "In this operation"; Elena Torres, the forty-seven, dispatch, Albion's inquiry, the m07 leaders' cells and anything else with nobody in m10 to carry it get one clause each in the credits' **"Elsewhere"** block (m10 change 41); Nightshade's fate is his "In this operation" clause, not a walkabout pick.

| Ending | Tesseract | HaX | Netherton | Lines that change |
|---|---|---|---|---|
| Arrest | Holds out his wrists before he is asked. At 06:00, in a police van; he nods to HaX through the window, and has the chapter exchange with Netherton ("I wrote that chapter, Magnus." / "I know. I kept it to one page."). | "You'll want a lawyer, Adrian. Get a good one. I'm testifying." As the van goes, "It's afterwards.", which opens the rest; the rest's last line is her last word. | Signs the handover: "A trial. He will make speeches. Let him." | ENTROPY's cells keep running; "He is in a cell. The cells are not." |
| Surrender | Types the cells' contact protocol into the bunker's own terminal himself, without hurrying; the chapter exchange through the van window. | Sits with him in the van for a minute and does not say what they talked about; the rest, then "He asked who taught you. I said I did." | Takes the protocol to the Council. | Two cells rolled up (stage 3 sets the rule for which two). |
| Lethal force, justified | One line: his hand on the key, the player fires, he falls by the console before it's pressed. | "I was a second behind you. Log it. I'll sign under you." At 06:00, the rest, then her board line. | Covers it in writing and says so: "He reached. I'll put that first." | Quieter than any other success. ENTROPY has a martyr; the cells go quiet, which is worse. A review board is named for after the credits. |
| Lethal force, cold | One line: his hands empty, the player fires. | Silence, then the designation once; no van, no rest; a message later (§4.5). | Refuses to sign; the player is held for the board (§4.5). | The story with the one true paragraph (§4.5); the card reads "shot unarmed". |
| Scorched Earth | Gone by the service door. A card on the console, his hand: "Afterwards, then." | Stands with the player at the hearing ("He still knows. He's one man with a memory now, not a map."), tells the rest there, and her last word is about the player (m10 stage 2 §3.1). | Suspends the player (§4.5), then: every flaw is still out there, and nobody can see them any more. | The service rebuilds its threat catalogue from nothing. The teaser slot, if used, sits after the suspension. |
| Join ENTROPY | "Thank you, Agent." Takes his coat and walks out with the player by the service door. | Her last message, unanswered: the player's designation, and nothing else. No rest. | Orders 0x00 brought in. | No 06:00 scene; the casualty curve on the forward post's screen, climbing. |

**The database choice in the epilogue** (R3-05). Each option gets a scene beat with a consequence, not only a name on the card:
- **Secured:** Netherton files the stolen copy in the vault beside the master ("Two maps now," HaX says). One kept operation pays off on screen: through Nightshade's channel, the watch on a recruited Victoria, the HashChain tags, or by default the tap on Zero Day's brokers, a cell is rolled up before the credits. The card notes the infusion-pump flaw still unpatched.
- **Disclosed:** the first vendor patches land within the hour and HaX reads the count. Each burned operation goes dark on screen: Nightshade's channel ("He's been moved. I can't reach him."); a recruited Victoria vanishes from her desk; the HashChain tags drop and the reserve bank empties; by default, the watch on Ghost's buyers loses them and the Zero Day tap goes silent.
- **Both wiped:** Scorched Earth's own beats (above): the flaws still out there, unmapped, and his memory as the only map.

**The head start** (R2-08, R3-02). Stopped at the server hall: "The cells got nothing." Otherwise by branch: Zero Day's share stopped in the gallery (Victoria confronted, escaped Victoria let walk, or Vos using arrested Victoria's information), Zero Day got nothing; Ghost talked out of the sale, deal kept, or parley, Ghost sold nothing. Otherwise: "Two cells have it. We'll be finding out which entries for a year."

**The closing card** (m10 change 33): five lines at most, fixed strings, arriving after the scenes have said most of it: the Architect by ending (in a cell; cooperating; dead, reaching; shot unarmed; at large, with his memory; with you); the database by `database_outcome`; the head start; the cells (a count and one name, by branch, including the m07 cells below); and one human line drawn from the "Elsewhere" set by the player's heaviest earlier choice (stage 3 sets the order). The Recruiter is named on it only if the rule below changes her state.

**The Recruiter and her network** (R2-20, C2, C14). One rule. `named`: she is named and her network rolled up. `double_crossed`: she is named, and "About half of them. She warned the rest." (m09 change 4). `taken` or `refused` (her file wiped): she stays at large and her network in place. What "her network" means depends on m05: the twenty-three placements by default ("Eleven are still at their desks" when it stays in place); on `public_exposure` the twenty-three were blown in m05, so it is her handlers and the forty-seven; on `turn_double_agent` it is the names Torres couldn't give.

The closing card's cells line, and the "Elsewhere" block, also cover the cells the finale doesn't stage, by branch (row 103), with `m07_completed`: Ghost Protocol (Michael Reeves) and Digital Vanguard (Marcus Ashford) by whether Fracture and Meltdown were covered in m07; Supply Chain Saboteurs (Jennifer Walsh) by Austin. Never played m07: the card follows m07's never-played canon (§3): Austin reached, the other sites not. Then Zero Day, and the Recruiter by the rule above.

## 5. Cast

Sprite keys are the ones the shipped missions use (inventories A §2, B §m0N.2). New characters need sprites and the usual character pipeline at stage 9.

### 5.1 Returning characters

| Character (sprite) | m09 | m10 |
|---|---|---|
| Agent HaX (`agent_hax`) | §5.4 | §5.4 |
| Director Magnus Netherton (`netherton`) | §5.5 | §5.5 |
| Nightshade (`nightshade`) | Triple agent: a voice on the player's phone from a SAFETYNET room, at flag 1; the player may send him his file. Arrested: Netherton's visit line, on the wall's m08 card. Silent handover: absent. | **Full scene, every branch.** Triple agent: at the forward post with his payment, tipped by m09 (the override and a decision whether to take him in; or the tripwire, unless checked); replaces the alibi clue. Arrested: brought from the second van in cuffs, offers the defences for a deal the player refused him in m08 ("You said no deals."). Silent handover or never played: in the van, one word, and Netherton's tether decision ("Manual." at the blast door). HaX's visit in the epilogue on the arrested branch; his fate is his "In this operation" credit. |
| The Recruiter (phone only, no sprite) | Rings once flag 2 is in and the cage is open; every player; makes every player the offer, and the deck choice is made inside her call (row 60). What else she says depends on m05. | Not present. Named or at large in the closing card by the one rule (§4.6); on `double_crossed`, her text at 06:00; the invoice in his ledger on `taken` / `double_crossed`. |
| Derek Lawson | His file only, in the restricted series (one side of the first purge choice). | Quoted by Tesseract. |
| Gary Whitlock (`gary_whitlock`) | Protected: rings at the tape room's keypad with the decode hint. | **Full scene, both ways.** Protected: SAFETYNET's consultant, at the workshop door as the player opens it ("You saved my career."), where he recognises Imran Siddiqui, whom he trained, and asks the player to talk him round or take him in. Unprotected and quiet (m02 played): a technician on the workshop floor beside Imran, talkable. |
| Graham Reeves (`graham_reeves`) | In custody: his handler's contact sheet. | Prop: at large, his name on the rota sheet ("on leave tonight"). Never met. |
| Ghost (voice and terminal) | – | **Full scene, every player** (on the security office's duty handset): the head-start sale, Ghost's leaving fee, and the player's chance to talk Ghost out of it; side door, locked door, parley (with Ghost's question back), "unanswered" or stranger, by branch. |
| Victoria Sterling (`victoria_sterling`) | Recruited: her protocols are the only way into Sorensen's mail (the cage's maintenance code). Arrested: her keys opened Zero Day's client list, with the lease on it. KO: the same from her seized devices; she says nothing. | **Full scene.** Recruited: in the gallery for Zero Day's head start; the trust choice. Escaped: same errand; stand-off (with the m03 threat) or a trade for walking out. Arrested: a secure line from custody in the server hall, bargaining over Vos's resale; the face-to-face beat is with Vos in the gallery. KO'd: absent; Vos holds her desk. |
| Danny Foster | One HaX line by fate, and his unanswered question on two branches (row 36). | – |
| Voltage (`voltage`), Static (`operative_static`) | Wall card. | **Full scene.** Escaped: Voltage at the switchgear; Static beside him only if he left with him; stood down on his print or talked down with the corrected sheet. Captured: seen cuffed in the second van at the briefing, then placed at the power room; he works his own switchgear or talks the player through it (the player's choice). |
| Robert Vance (`robert_vance`) | – | Ally: the power room's phone slot after a captured Voltage. KO'd: HaX's one line. |
| David Torres | Turned: rings in from his desk, still in place inside the Initiative, at the Harwick & Lowe boxes after flag 2 (or on the walk to the office); one step off the WREN search; the ledger shows him as a live placement. Dead: "closed placement" in the ledger. | – |
| Kemal Aydin | Walked: one HaX line at flag 4's casualty sheet ("walked out on a smaller number than this"). No call. | – |
| Irina Volkova | Recruited: one HaX line. | – |
| Dr James Mercer (`james_mercer`) | – | Presence: at large (with `m07_completed`), in the server hall in Asante's place; one line, then hostile. |
| Elena Rodriguez (`elena_rodriguez`) | – | Turned: the phone slot when neither Voltage nor Vance holds it. |
| Ray Hollis (`ray_hollis`) | – | Prop: evaded, his photo on the duty board. |
| Agent 0x23 Vector (`agent_vector`), Agent 0x88 Phantom (`agent_phantom`) | – | m08 played and not wronged: on the raid team and on the suspect list, at the van end with Netherton at 02:10. Vector's annex badge opens a sealed door in the security office; Phantom's list replaces the cloner clue. Wronged: they decline, with Netherton's line for each. |
| Dr Adrian Tesseract, the Architect | Never heard: his call to HaX at the end, and the player hears only her side (a narrator line: "A man's voice on her end, too low to make out."). Not voiced in m09 unless stage 3 makes the Alpha tapes playable. | In person at the core (new sprite `adrian_tesseract`). A man in his sixties whose origin stays unplaced, as the voice bible keeps it; voice Sadaltager as in m07, without the distortion. |

### 5.2 New characters

Kept clear of the existing name clashes (Chen, Reeves, Park, Okafor/Okonkwo, Wierzbicki, the three Ghosts, Cipher). Every name and codename below was grepped across `scenarios/`, `story_design/`, `planning_notes/overall_story_plan/` and `docs/` on 2026-10-20; the two default technicians added at stages 1–2 (Imran Siddiqui, Wendell Briggs) were grepped on 2026-10-21, with no hits outside the m10 and finale documents and the dev log. The only hits outside the finale documents are two uses of "Kevin Tran" (m05's stage 0 notes and an unused AI Singularity lore fragment); neither is in a shipped mission and neither shares a first name, so Jesse Tran stays.

| Name | Age, background | Mission | Role |
|---|---|---|---|
| Margaret "Peg" Sorensen | 66, white Montanan of Norwegian family, former county clerk | m09 | Director of the Helena archive and the Insider Threat Initiative's keeper of records. A true believer: "People are records. I keep them." Tonight she is carrying out the purge order: the shredder and the degausser in the restricted cage. She is behind the mesh feeding the shredder from before the player arrives, reachable only by talk until the cage opens; stopping her after that (arrest, knock-out, or a bluff that holds) saves only what she hasn't reached. She keeps the ledger live, and updated WREN's entry on day 10. She holds the Reading in her safe, with the master destruction schedule and her planning pass down its margin, and quotes the Reading's first entry at the player from memory when she ends the auditor bluff at the cage's hatch. Once the cage is open she keeps shredding and does not fight (a non-combat state); arrest or knock-out (m09 change 18). Twenty years a county clerk before this. |
| Noor Haddad | 34, Lebanese-American, grew up in Dearborn | m09 | Records clerk, one of the forty-seven candidates (on TalentStack's list without knowing it). Helps, warns or stays wary by row 62's condition; the player can tell her she is on the list. |
| Jesse Tran | 29, Vietnamese-American | m09 | The archive's IT contractor and Social Fabric's plant, the name Maya's lost intelligence would have flagged (row 6). He runs the rest of the purge's tape-wipe job from the server closet (the legacy recruitment interviews, never the deck); stopping him saves what is still on tape, and the Social Fabric letters let the player talk him off it. On `m01_maya_ko` he radios Old Coyote after flag 1 and calls in a second guard if he sees the player first. |
| Cody Old Coyote | 24, Apsáalooke (Crow), from Lodge Grass | m09 | Night security guard, working nights to pay for a lineman's course. Innocent; talk past him, or a knock-out costs a line in the debrief. |
| Agent 0x19 Callum Fraser, Agent 0x6B Ana Lúcia Ferreira | 31, Scottish; 38, Brazilian | m09 (named) | The two agents killed at the unanswered m07 sites. Netherton reads both names before the Montana order. Never seen. |
| Agent 0x2D "Anchor", Marisol Quintero | 52, Mexican-American | m09 briefing, m10 | Task Force Null's raid leader on the ground. Steady, dry, on the player's side, and a suspect like the others. She argued against the Helena job ("Orders don't fall off couriers.") and objects again at m10's briefing; she answers the player's stance on that at the outer lock, which she holds while he talks to 0x00. She is the other Harwick & Lowe hire, placed honestly as cover in the same quarter as Kowalczyk, and her father is in residential care (m09 change 6, m10 change 4). If the sleeper reaches the core she is the one wounded stopping her. |
| Agent 0x5E "Lantern", Halina Kowalczyk | 47, Polish-British woman | m09 briefing, m10 | **The sleeper, ledger codename WREN.** Task Force Null's breaching lead. She came to SAFETYNET eleven years ago as a lateral hire from the private sector through Harwick & Lowe, an executive search firm long since closed: one of the Initiative's older fronts, tied to it by nothing until the m09 ledger. She was never in Tesseract's intake, so the screening after m08 missed her, and Harwick & Lowe shut before TalentStack opened. Her mother's care home has had the Initiative's cheque every month for eleven years; for tonight the Architect has taken her tasking. She hands the player her own PIN cracker in m09, asks after it in the hangar, and is easy to like. Player-facing text gives WREN no pronoun before the accusation. |
| Officer Dev Malhotra | 33, British-Indian | m09 briefing, m10 | Task Force Null comms officer, in the van at the forward post. Eleven years' service, the same as WREN's placement. In m09 he asked to run the Helena line himself. A suspect; innocent; his badge was copied at the kit check and used on the core's service door. A wrong accusation sends him back, and HaX's line drops one room early. |
| Officer Kenji Arakawa | 41, Japanese-American | m09 briefing, m10 | Task Force Null tactical officer, the team's US liaison, ahead of the player with Kowalczyk. In m09 he kept Helena's police off the archive's side of town; in m10 he closed the county road, and again nobody asked who for. Packed the breaching case with Kowalczyk; at 02:10 beside the player at the gate, on a call to his daughter in Billings. A suspect; innocent. A wrong accusation leaves one more guard in the player's way. |
| Pieter Vos | 50s, Dutch | m10 | Zero Day's broker, who took Victoria's desk "by Monday". The gallery's default occupant (Victoria KO'd, or m03 never played), with a trade (the lock card for his name off the report), and the man she bargains over on the arrested branch: he has been reselling Zero Day's early access to a second buyer and skimming. Cold, practical, there for the head start. |
| Dr Abena Asante | 45, Ghanaian-British woman | m10 | Tomb Gamma's systems lead, who wrote the release pipeline and corrected his casualty sheet (the decoded margin note names her). The server hall's default occupant when Mercer is not there; can be talked into showing the schedule. "I wrote it. I'd write it again." |
| Imran Siddiqui | 26, British-Pakistani, from Sparkhill, Birmingham | m10 | The workshop's default technician on every branch (m10 change 8). Worked under Gary in St. Catherine's IT; his grievance turns on whether Gary is in work after m02, with a never-played version; the Initiative found him six months later. Holds a cloneable card for the power-room door. Talked round, he may keep his phone and send a friend on the gallery shift home. |
| Wendell Briggs | 63, white Montanan, from Great Falls | m10 | The power room's default technician (m10 change 8). Kept the plant running for the government in the eighties and came back for the refit money; thinks the servers belong to a data company. Told the truth, he cuts the shutter and asks to warn his colleague on the next shift. |
| Tomb Gamma's guards and technicians, Social Fabric's media crew | mixed | m10 | Generic sprites, varied. |

### 5.3 Default occupants

Every room that a carry-over can fill has a default occupant, so the route works with all imports at their defaults.

m10 has nine playable rooms (D-16): forward post (with the gate in view), security office (the gatehouse merged in), blast-door tunnel, workshop floor, power room, server hall, media room, gallery, core (with the host terminal). The service tunnel is a cutscene.

**The five full-scene slots** (R2-01). Each is on the main path (§4.0) and holds a person on every combination of choices; a won branch and a lost branch put different people there.

| Slot | Won or careful branch | Lost or careless branch | Default (never played, or neither) |
|---|---|---|---|
| The door (forward post) | Nightshade arrested (`and not m08_nightshade_ko_before_fate`): in cuffs, the deal. Triple agent, shown his file: the override (the alarm panel), and take him in or leave him | Triple agent, not shown: the board tipped against the player (the tripwire, unless the payment is checked) | Nightshade in the van: "Door."; bring him to the blast door on a tether ("Manual.") or leave him (m10 change 23) |
| The workshop | Gary protected: at the door; talk Imran Siddiqui round (his phone left or taken) or take him in | Gary unprotected and quiet: on the floor, recruited, beside Imran | Imran Siddiqui, with a cloneable card: talk him round, clone the card, or knock him out; the bench log (clue 3) |
| The power room | Voltage captured: placed at the power room after the breach; he works his own switchgear or talks the player through it (the player's choice) | Voltage escaped: at the switchgear (with Static if he left with him) | Wendell Briggs at the panel: tell him, or work round him; Vance, Elena or HaX on the phone |
| The gallery | Victoria arrested: her secure-line deal in the server hall, then Vos face to face in the gallery, her information used or withheld. Recruited and confronted: holds. Escaped without the threat: her trade for walking out | Recruited and trusted blind: sells the raid. Escaped with the threat: stand-off | Pieter Vos, with his lock-card trade |
| The network (the security office's handset) | Deal kept: no sale, a question for the player. Refused: Ghost's question back, then the window or a camera blind, no sale | Deal broken: the sale, harder to stop. Unanswered: the sale, and "Answer this." | Ghost as a stranger, selling |

**Other rooms.**

| Room (m10) | Default | Replaced or joined by |
|---|---|---|
| Security office | an ENTROPY duty guard; the duty board (with the "posts unmanned" memo on `m06_assets_seized`) | Hollis's photo on the board (prop) |
| Blast-door tunnel | a guard post with the rota sheet | Reeves' name on the sheet (prop) |
| Server hall | Dr Abena Asante | Dr James Mercer (presence; Asante then works the media room's feed) |
| Media room | dark, with the drafted "massacre in Montana" story and the player's photo on the desk | Social Fabric's crew (Fracture uncovered, `m07_completed`) |
| The raid team | Quintero, Kowalczyk, Malhotra, Arakawa | Vector, Phantom (`m08_completed`, not wronged). Kowalczyk is cuffed at the briefing if named in m09. Arakawa holds the blast door with Nightshade on the tether branch. Quintero holds the outer lock |
| Power room phone slot | HaX | Vance, else Elena Rodriguez (not used when a captured Voltage is in the room). One non-HaX voice per room in m10; the raid net counts as HaX's channel (§4.0). m09's rule is one non-HaX voice per scene, cutscenes exempt (m09 change 6) |

### 5.4 HaX's arc

m08 left her close to coming apart, texting "Same classroom, 0x00. Don't ask me whose yet." The finale is her reckoning with the man who taught her.

- **m09.** In person at the briefing, then on the line. At the briefing she holds the name back; on `m06_architect_identity_found` she reminds the player, alone, that she called it Satoshi's guess. After the deck she rings unasked, names what the purge cost, and gives three words and one sentence: "Afterwards. Not during." / "It's yours to carry. Nobody else signed for it."; then, as the beat's last line, "The rest when this is over." m09 never says what the rest is; m10 pays it (m09 change 15). In the identity scene (in the tape room, by phone, Netherton listening from the aircraft) she says the name as fact for the first time; her first line is the recognition line, if any (row 97 or row 37). The four forms are labelled by import (row 70). **Every form reaches the wall**: she had the name the night Fraser and Ferreira died, and she didn't say it. **The player answers her** (R2-19): m06 name not found, "You should have told me." / "I'd have done the same in your place."; m06 name found, "You should have taken it to Netherton." / "I'd have sat on it too." (m09 change 19); on every form, a third answer, her own line back to her, "Afterwards. Not during." (`afterwards`, m09 change 24). No answer is wrong; the answer is exported (`hax_confession_answer`). The Reading has one line about her ("Their handler will cover for them. She was taught to."), and her reply knows it if the player told her. At the debrief, last on the line, by answer: `should_have_told`, she tells the player everything from now on; `same_in_your_place`, a thank-you, once; `afterwards`, "You said afterwards. I'm holding you to it."; and the rest is still owed. On `m08_hax_ko`: "You put me on the floor at the Citadel. I'm still running you." At the end Tesseract rings her, not the player, and calls her "Ninety-nine", as on the course; she refuses it: "It's HaX. It has been for seven years." (m09 change 13). The player hears her side only, then "I'll bring them." She reports it in four short sentences: he called her Ninety-nine; the blast door will open for 0x00 by name; take your time getting there; and he asked whether they had liked his notes.
- **m10.** At the forward post with Netherton, on the line all night; at the briefing her "how are you" answer follows `m09_hax_confession_answer` (on `afterwards`: "You gave me my own line back in Helena. I'm holding you to it."). She knows the bunker's tricks because she knows his. Tesseract's jamming drops her line for one short, linear stretch (the gallery: one room, one obvious door). Her last line before the drop names what to do next, and any warning about Victoria comes before it (D-22). At the core he greets her, "Ninety-nine. You've done well with them.", and she answers "Still HaX." on every branch. He talks to her through the player's handset; she does not decide for the player and says so. On `same_in_your_place` or `afterwards`, "[HaX. You're on speaker.]" is one of the player's answers in the third exchange: the player hands her the floor, and she makes the argument only she can make, as his student (on `afterwards` she first says "All right. Let him hear it from me."; m10 change 38). On `should_have_told` she speaks once at the core, unasked: "My agent told me I sat on it. They were right. You never told me anything." That puts a different answer under the third claim ("She learned that from you."). No answer to her confession is the wrong one. Her one act on the failed talk-down (killing the feed when his hand goes to the console) stays. On `m09_recruiter_secret = kept`, Tesseract tells her on the open line that her agent never explained the receipt; she answers "I'll deal with that when this is done.", and does, as her own pick in the 06:00 walkabout. At 06:00 she pays m09's promise, "the rest", in two lines: "The night he left, he asked me to go with him." / "I said no. It took me till morning." (m10 changes 21, 39). "Afterwards" is said at most twice in a run.
- **Endings.** §4.6. In every success ending except the cold one she gets the last word before the card, and tells the rest; on executed and Join she does not.

### 5.5 Netherton's role

- **m09.** Runs the briefing in Task Force Null's room (a cutscene): the order, which SAFETYNET read and let go on ("We read it. Then we let it go on. If it hadn't arrived, he would know."), how it was caught (one reason by priority), the wall of cards as the "previously on", the suspect without the name ("I will not say the name in this room until we can prove it."), the raid team introduced. Brings the legal cover (Victoria's CPS case on that branch). On `m08_netherton_ko` or `m08_netherton_hostile`, a narrator line: he takes the chair furthest from the player's, and nobody mentions why (m09 stage 1, W-15). Says the name aloud for the first time when the proof comes together, from the aircraft's forward cabin with the door shut, in words that work whether or not the player heard his m08 pledge, with one sentence on who Tesseract was, then "HaX." and silence while she confesses (row 125; m09 change 7). The debrief is a cutscene in a hangar at Helena's airfield, Netherton in person: the hour ("Twenty hours. He has given us every one of them."); the player's stance on Tesseract's memo; a question hub (the archive, WREN, the Recruiter, the notice); he reads the two dead agents' names; he signs the Montana order in front of the player (on `m08_debrief_stance = owned`, with his own name beside Nightshade's file; on `defended`, with one quiet thank-you he doesn't explain) and answers the stance at the pen; last, why the raid team goes in together, WREN and all (row 117); he caps the pen.
- **m10.** Commands the raid from the forward post. Runs the briefing and the private aside (§4.0), answers Quintero's objection, and spends his handbook line there. On `m07_debrief_stance = hardened` he tells the player the Council said yes, and the projection desk is the result (row 99). Holds whoever the player accuses and recalls them over HaX's channel. At the database choice he and Tesseract name each other once ("Magnus." / "Adrian."), then he names the two live operations disclosure would burn, ones the player knows (§4.1), and authorises it anyway if the player chooses it. At 06:00, two lines with numbers, and the chapter exchange through the van window on arrest and surrender. Refuses to sign on the executed ending. Suspends the player on Scorched Earth. Orders the player brought in on Join. His m08 line "If he burns you, it is on my signature" comes due at the door on the triple-agent branch either way.

## 6. VM flags in story terms

The VM plan is written separately (`finale/FINALE_VM_PLAN.md`, by a Haiku agent); it decides how each flag is reached and must fit the meanings below. Every flag is required (`concludeRequires`), is wired through `targetFlags` with `setGlobal`, and is followed by a HaX line that says what it bought in story terms.

### 6.1 m09: the archive's servers

Two separate machines: the archive's catalogue server (flags 1–2) and the old Tomb Beta server racked in the tape room (flags 3–4). **Flags 1–2 are submitted at the SAFETYNET drop terminal** the player sets up in the reading room (the field laptop). **Flags 3–4 are submitted in the tape room**, beside the machine, through the field kit's link to the drop terminal; the tape room's station is the only one that accepts Tomb Beta's VM, and the reading room's accepts only the catalogue server's. The identity scene plays in the tape room, by phone (m09 changes 12, 22).

| Flag | Story meaning | Unlocks in game |
|---|---|---|
| 1 | **A foothold on the archive's catalogue server**: the index of every box, tape and shelf, including the restricted series the public catalogue hides. | The shelf marks for Series R, in the restricted cage; the reward opens the restricted stacks' outer door, so the cage can't come before flag 1; the first clue to the tape room's code (a catalogue entry in an old archive encoding). |
| 2 | **The Insider Threat Initiative's ledger**, kept live on the catalogue server: the twenty-three placements and the forty-seven candidates, each under a ledger codename, plus an older legacy section. WREN's legacy entry was updated on day 10: "assigned TF Null, Montana operation", with a source code "H&L" and a file number. Every player learns that much. | HaX reads it aloud. The printed ledger at the shelf becomes readable (optional, for the player who wants the page; it holds Reeves' handler's contact sheet on that branch and Noor's codename), and Sorensen shreds it once read if she is free (the flag holds it). The optional cross-reference opens: the Harwick & Lowe placing sheet in the open stacks narrows WREN to two (`sleeper_shortlist`). The Recruiter rings once flag 2 is in and the cage has been opened (m09 change 21). |
| 3 | **The owner of Tomb Beta's server**: Tomb Beta ran its enrolment under a web service account, and the credential text found beside the flag is a SAFETYNET staff credential issued to Dr Adrian Tesseract before he left seven years ago, never revoked. That text is the proof of ownership; with the handwriting on Nightshade's recruitment file (matched earlier against HaX's own training notebook, with his margin notes, and confirmed by Tomb Beta's enrolment binders in the salvage cage), it proves who he is. The same machine's files hold the catalogue entry for the Albion flaw marked "retain: operational value", his memo from the same month nine years ago arguing it should go to the vendor, and the vendor notice he drafted and never sent (§1.3). | The identity scene, by phone, with HaX and Netherton (row 125). Without Nightshade's file in hand, HaX holds the name until it is picked up. The optional "send the notice" action (`albion_notified`). |
| 4 | **Full control of Tomb Beta's server**: its job that still mirrors to Tomb Gamma, carrying what the Publication is and its two modes (city by city from 06:00 UTC on day 13; everywhere in the same minute by the key at Tomb Gamma's console, which needs a hand), the 04:00 head start, the list of defences built from the stolen database, and his original casualty sheet pricing the key (m09 changes 5, 28). | HaX's read of the hour (waits on the identity scene: "His file first. Then the rest of his box."), the realisation that this server was left off the destruction schedule on purpose (said by a player who read the schedule, else stated once by HaX), Tesseract's call to HaX, the raid order, and the mission's close. |

Together with the paper finds (the deed and construction file in the lease file, the Reading, Nightshade's file), these give the four things §1.3 promises: the name, the ledger, the defences, the hour.

**The night's order and what holds it** (m09 stage 1 §11). Aims gate nothing and `concludeRequires` is the four flags only, so each step is held by a lock or a condition: flag 1's reward opens the restricted stacks; the Recruiter's call waits on flag 2 **and** `cage_opened`; Sorensen's office opens on `deck_choice_made` (the Recruiter fired the wipe from the deck's controller there, and HaX traces it: "She fired it from Peg's office. I'm on the door."); the tape room's key card is in the office safe, with the Reading and the master destruction schedule; flags 3–4 only at the tape room's station; the identity scene fires on flag 3; flag 4's read waits on `identity_scene_done`; Tesseract's call waits on `hour_read_done`; the conclusion aim waits on `tesseract_call_done`.

**One rule for every forced phone scene** (both missions; orchestrator ruling). In m09: the Recruiter's call, the identity scene, flag 4's read and Tesseract's call. Each sets its defaults on its first line (by branch, where an export depends on it), and its done-flag on its last choice, or its last line if it has no choice, never on opening or closing. Closed before that, it re-rings when the player leaves the room (an unfinished identity scene also on flag 4's submission) and resumes at its last unanswered choice; a scene with no choice restarts from its first line. Nothing downstream keys on a conversation closing. Stage 5 adds "reload mid-call" to its engine checks. m10's ringing phone scenes (Ghost's handset, arrested Victoria's line) follow the same rule.

**The purge** (R2-10, B12, R3-04, C3, C15). It moves on story events, never on time, and it never touches what a flag yields or anything on the critical path. **One order, used in all three documents:** flag 1 → the cage → flag 2 (the ledger shelf optional) → the Recruiter's call → the tape deck.

1. **The cage.** The purge is already running when the player arrives (the order SAFETYNET let go on is why tonight): Sorensen is behind the mesh feeding the shredder from the start, reachable only by talk at the cage's hatch counter (staging is stage 5's, S-09). The cage needs her print (lifted off the stamp she leaves on the hatch shelf) and her stacks card (cloned from the reel at her hip while she talks; the office is on its own keypad, off the card system), or, on recruited Victoria's route, the maintenance code from Sorensen's mail. Two bins, and HaX names what each buys: Derek's file (by the hatch; the Architect's hand on the player's first case, his standing order, a second sample of the hand) and, on `m08_nightshade_tidied`, the copy Nightshade sent ahead, or by default the Initiative's letters to Social Fabric (Tran's trade route, a lever on him). The player can pull one bin through the hatch; she tips the other as they do. Opening the cage is the event: by the time it opens, the other bin is gone. If the player opens the cage without using the hatch (or walks past the bins on Victoria's route), Derek's file survives and the other is gone. Once open, she keeps shredding and doesn't fight; stopping her saves only what she hadn't reached.
2. **Flag 2.** HaX reads the ledger; WREN is on the raid team. If the player reads the printed ledger at the shelf and Sorensen is still free, she shreds it; nothing is lost, because the flag holds it. Nightshade's recruitment file is in a locked plan chest at the back of the cage, on the critical path, and never purged.
3. **The tape deck** (inside the Recruiter's call). The call comes after flag 2 and the cage, so her offer never gives away a plant the ledger hasn't. As she hangs up (or, on a refusal or hang-up, before she drops off) the Recruiter fires the wipe herself on the deck that holds her file (a tape: her handler list, §2 row 60) and Tomb Alpha's tapes (his recorded teaching, with annotation sheets in his hand). HaX pulls one through the drop terminal on the player's word; the other is wiped (`deck_pulled`). Take + Alpha tapes or take + nothing records `taken`; refuse + Alpha tapes or refuse + nothing records `refused`. Tran runs only the rest of the tape side (the Initiative's legacy recruitment interviews, optional lore), so stopping him early or late saves that, never the deck.

After the deck HaX rings once, unasked, and names what the purge cost: which bin and which tape are gone.

### 6.2 m10: Tomb Gamma's network

Flag 1 at the forward post's gate terminal (worked while the pre-breach split happens around the player); flags 2 and 3 at the server-hall console; flag 4 at the core's host terminal, after Tesseract has greeted 0x00 and HaX (§4.1 step 0; he pauses nothing). The core holds one flag and the conversation (R2-02); his case waits for flag 4.

| Flag | Story meaning | Unlocks in game |
|---|---|---|
| 1 | **A foothold on the security monitoring host that the camera and door systems report to.** | Camera feeds, the blast-door route, and the door log at the security office's desk (the whodunit's first clue). The service door's camera, if asked for, is a dummy that was never wired (m10 change 36). |
| 2 | **The staging copy of the schedule, kept on the security monitoring host.** The text beside the flag lists the channels (§4.2), the cells' early-access orders (Zero Day's among them, under Victoria's name or Vos's), and the first entries by city in plain words. | The server-hall console: the optional tasks to stop the head start and close the backdoor channel; the schedule readable (HaX reads three entries and stops); the evidence for the Victoria choice. |
| 3 | **Out of the release service's container onto the release host beneath it.** | The disarm action, armed at the server-hall console and carried to the core; the gallery door opens only once flag 3 is in (m10 change 19). Before it, HaX points at the bunker's own physical echo of the idea: the Cold War sealed section off the server hall, with a maintenance hatch into the machinery beneath it (R3-18). |
| 4 | **Full control of the core host**: the stolen copy, and the live line into the Citadel's vault. | His case (gated on it), and the database options at the core (§4.1). HaX's flag 4 lines carry the unsent notice on a cold start. |

Flags 1 and 2 are the earlier entry stage the brief asks for; 3 and 4 are the climax.

## 7. Teaser slot

- **Where.** m10 only, after the closing card and immediately before the final credits roll (the close runs conclusion screen, closing card, teaser, roll; m10 change 14). A few seconds. It is the last thing before the credits on every ending, Join included. Stage 9 confirms the engine can run the card after the conclusion screen.
- **What.** Decided later, by the user. Nothing in m09 or m10 sets it up, refers to it, or depends on it. No other eldritch content anywhere in either mission (brief, user decision 2026-10-20).
- **How it is built.** One extra step in the credits sequence (a short cutscene or a single credits card) behind one global, `teaser_enabled`, default `false`. With it false, the credits run straight after the closing card and nothing else changes. No voiced lines until the content is decided.
- **Constraints for whoever fills it.** No new characters from this season; no line that reads as a Season 1 loose end; it must make sense after all six endings.

## 8. Risks and open questions

Each has a default the later stages follow unless the user says otherwise.

| # | Risk or question | Default |
|---|---|---|
| 1 | **Import load.** 43 imports in m09 and 65 in m10 is far more than any earlier mission (m02 imports 3). | Tiered (§3, D-07, R2-09). Tier 1 is every import that changes a room (m09: 19, m10: 38), built first and covered by named route-driver profiles: a "kind" run, a "hard" run, a mixed run, a Mercer run, plus `none`, chosen at stage 8 to cover every Tier 1 condition and every slot in §5.3. Tier 2 is lines only, checked by the dialogue lint and a branch read-through. One shared include per mission declares them all. |
| 2 | **Players who start at m09** (Hacktivity can assign missions out of order). | The briefing's wall of cards is the "previously on", with a never-played version of every card and a "who is the suspect" beat with no name (row 57, D-15; m09 change 1). Netherton's sentence in the identity scene is the "who is Tesseract" beat for this player. Every scene is written default-first. At stage 2 a reviewer reads m09's default path with no other mission in mind. |
| 3 | **The two ink changes** (approved, F5) don't reach runs finished before them. | §3.3: the fallbacks are the read rule for every existing save. |
| 4 | **Join reached by accident**, or felt as a trap. | The offer is heard by everyone; Join starts only with an action, then two more confirmations (§4.3). A blind playtest at stage 8 checks that no tester reaches it without meaning to. |
| 5 | **Lethal force tone** (F11: two versions, each signposted). | Justified: offered only when he makes a move that threatens lives (his hand to the console, on "arrest" after fewer than two points), never after a successful talk-down (§4.1 step 5). Cold: a separate, clearly labelled, two-step choice in both step-5 menus, with the narrator's plain warning, `ending = executed`, and its weight carried by HaX's and Netherton's reactions and the true paragraph in the 06:00 story (§4.5). Each is one narrated line, no detail. The executed ending's story never says "massacre". |
| 6 | **Length and crowding.** | m09 about 85 minutes with the field guides, 95–100 without (m09 change 14); m10 about 105, ceiling 110, with the media-room cut planned unless stage 8's timed playtest comes in under 105 (m10 change 34; first-time players 108–115 before the cut). m10's cut order if long: the media room, the backdoor task, Tesseract's idle lines, Vector's and Phantom's lines, the briefing hub; never the five scenes, the three clues and the accusation, the three exchanges, the stated costs, HaX's last line before the jam, or an ending scene. Five full-scene slots in m10, each on the main path and filled on every combination (§5.3); the rest are presences, props and lines. Nine playable rooms in m10 (D-16). |
| 7 | **The clocks.** Real time must never turn slowness at the VM into a story cost. | m09's purge moves on story events only (§6.1). m10's countdown also moves on story events (R3-02): a countdown object per room reads a global set on beats (no engine feature; m10 change 25), is felt through what people say, and costs nothing by wall-clock time. The head start goes only if the outer lock opens before it was stopped (m10 change 19); Seattle's batch goes only through a backdoor left open; the 06:00 fallback never fires before the core. Stage 4 sets the objects' step values from the m07 and m09 timings. |
| 8 | **Local time.** 06:00 UTC on day 13 is around midnight in Montana, not dawn there. | Every in-game clock and line uses UTC, as the Citadel does; no line mentions dawn in local time. §1.5's "before dawn" is read as the Citadel's dawn. |
| 9 | **The Architect in person.** He has been a voice since m01. Seeing him could shrink him. | He is shown only in the core, seated, with a reason to wait (§1.2). His origin stays unplaced, as the voice bible keeps it (A15). His portrait is chosen with the user at the character stage. |
| 10 | **"Disclose" as a database option.** | Approved (F6). Each of the three options carries a cost said on the line before the choice (§4.1). |
| 11 | **SAFETYNET's master reachable from the bunker.** | Approved as canon (F7). SAFETYNET left the line open on purpose as a trace (D-13); stage 6 writes it into the Citadel's incident file. |
| 12 | **The sleeper's betrayal hurts Quintero**, and a wrong accusation costs an innocent officer's place. Neither must feel like punishment. | Wounded, never killed. Three clues spread across the bunker are always enough to accuse correctly; HaX nudges after each; a wrong accusation is visible (the officer's line) and can be undone by recalling the officer on new evidence (§4.4). |
| 13 | **m10's VM needs an earlier stage** (brief). | §6.2 gives flags 1–2 their story; the Haiku VM plan fits the modules to them. If it cannot, flag 1 moves to the security office terminal and the meanings stay. |
| 14 | **Titles and ids.** | m09 keeps *Digital Archaeology*. m10 is *Full Disclosure* (user choice, 2026-10-20), id `m10_full_disclosure`; the orchestrator renames the folder. m10's `importGlobals` entries for m09 use m09's final folder name. |
| 15 | **The Recruiter stays faceless.** | Yes, phone only, as in m05. She is named in the closing card on `named` or `double_crossed` (§4.6's one rule), but never caught or seen; she is left for a later season. |
| 16 | **New sprites**: Tesseract, Sorensen, Haddad, Tran, Old Coyote, Quintero, Kowalczyk, Asante, Malhotra, Arakawa, Vos, Imran Siddiqui, Wendell Briggs. | Thirteen new characters across two missions (the two default technicians added at stages 1–2), made through the usual pipeline at stage 9; the user approves each look first. Malhotra and Arakawa may use varied generic sprites if the budget is tight. |
| 17 | **New canon about Tesseract's past** (A16). He recruited Nightshade at 23 while still SAFETYNET's chief strategist (m08's "the man who put me here fifteen years ago"), so he was working for ENTROPY's ends eight years before he "walked out over a disagreement". | Kept, because m08 already implies it. Stage 6 adds it to `the_architect.md`'s identity section: the disagreement was real and the departure was also cover. The user may want to confirm. |
| 18 | **m09's purge** could make the investigation feel punishing. | Event-driven, visible, and two save-this-or-that choices (§6.1). Only optional finds are losable; stopping Sorensen or Tran saves only what is left on that side (§6.1); HaX names what was lost, once. |
| 19 | **The Albion flaw is new detail on m04** (B4). m04 speaks only of "the holes it came through". | Written as one of those holes (the plant's control equipment), catalogued nine years ago. Stage 6 keeps it apart from the player's own way into the m04 VM, which HaX called brand new. |
| 20 | **Ghost every player** (never-played m02 included). | Ghost is at large on every m02 branch, so a stranger Ghost selling the head start is canon-safe. |
| 21 | **Forced phone scenes skipped or broken by closing them** (m09 R3-02, R4-01). | One rule for both missions (§6.1): defaults on the first line, done-flag on the last choice or line, re-ring and resume; stage 5 adds "reload mid-call" to its engine checks. |
| 22 | **Engine gaps the stages 1–2 designs assume** (F10). | The core's music thinning per landed point and a silent gallery need an engine change (no silence or layer control); fallback: drop to silence on the second landed point. Companion moves are per-room staging with `setVisible` (N-14). Stage 9 confirms the closing card can run after the conclusion screen. |

## 9. Decision log

Sections 1–2 (premise, timeline, thread allocation) are the earlier author's. The first draft corrected one row; round 1 revised both sections where the reviews found errors or the design changed (§10).

- **§2 rows 87–89 corrected.** Row 87 put Mercer at Tomb Gamma on `mercer_fate = ko`, but an actual knock-out sets `mercer_ko` and leaves him in custody (m07 erb:228-230). Rows 87–88 now read `m07_mercer_ko` (✱) and row 89 no longer drops it.
- **Five-kind use code for imports (R/H/O/P/L).** Makes the "never gates completion" rule checkable row by row.
- **One shared ink include per mission for imports.** Fifty-odd VAR lines repeated in every ink file would drift.
- **Imported `completed` for every source.** "Never played" needs its own neutral line, and m09 may be a player's first mission.
- **No-coordinate route via `m08_completed and not m08_tomb_gamma_location_known`.** The source default is false, so the import alone can't tell a knocked-out Nightshade from an unplayed m08.
- **The deed is a task for every player.** Keeps the no-coordinate route a change of framing, not of what the player must do.
- **Static: with Voltage on `static_left and not static_left_alone`, a line on `static_left_alone`.** (Round 1, A11; replaces "either value means Static is at large".)
- **m08 export list follows inventory B §m08.2, minus `nightshade_tipped_off`, `named_on_evidence` and `suspect_theory`.** Only `nightshade_tidied` has a payoff of the tip-off pair; the other two fed the Reading's dropped entries.
- **Export additions made at stage 9, not now.** The brief forbids editing other missions in this stage; the list is ready.
- **m09 exports seven values** (`nightshade_shown_file`, `sleeper_named`, `recruiter_secret`, `recruiter_offer`, `reading_finished`, `albion_notified`, `hax_confession_answer`; §3.4). Each has a concrete m10 use; `recruiter_secret` folds m05's confession and m09's call into one value. (Superseded at stages 1–2: nine, adding `sleeper_shortlist` and `deck_pulled`, §3.4.)
- **m10 exports seven values for a later season** (§3.5). Cheap now; an ink change later.
- **All endings after flag 4.** One `concludeRequires` for every ending, and the endings are choices, not failures of the technical work.
- **Stopping the Publication is one console action, unopposed, because he wants a SAFETYNET hand on the key** (round 1, D-02). Explains the invitation, the keyed blast door, the seat at the console and the Join offer in one motive; the 06:00 fallback keeps the clock.
- **Talk-down needs two visible points, with three of the mission's own arguments always available** (D-20). Winnable by any player; carry-overs are options the player chooses.
- **His opening case uses three record lines at most, by priority** (D-08). The rest became the player's options, so the player brings up their own history.
- **"Disclose" kept as a success-path database option** (approved, F6), **with a stated cost for every option** (D-05): secure leaves flaws live, disclose burns two operations, wipe both fixes nothing.
- **Live line into the Citadel's vault, left open on purpose as a trace** (approved canon, F7; D-13).
- **Scorched Earth's chaos is his own dead-man purge** (D-12): the one outcome where he can't win the argument, wired to cover his exit.
- **Justified lethal force only when he makes a move that threatens lives, and never after a successful talk-down** (D-11, reworded at stages 1–2 to cover only the justified version). The trigger is an act, his hand going to the console where one key sends the first city's list out anyway, not a dead-man switch. The cold version follows user decision F11: a separate, clearly labelled, confirmed choice in both menus, `ending = executed` (§4.1 step 5, §4.5).
- **Every player hears the offer; Join starts only with an action, then two more confirmations** (D-21). Listening to the villain must not be a step towards betrayal; m01's LAUNCH button is the precedent.
- **Partial release comes from the m07 backdoor, not from failure or the clock.** The backdoor is present on `m07_completed and (m07_team_assignment != "trojan_horse" or m07_team_redirected)` (A1, B1).
- **Clocks never fail a mission**, in m10 (the fallback) or m09 (the purge). "Fun and educational, not hard."
- **Every presence import has a default occupant, and every at-large value that equals a default also needs `completed`** (A5).
- **Five full returning scenes in m10 (Nightshade, Victoria, Voltage, Ghost, Gary); the rest are presences, props or lines** (D-01). The five carry the most player choices each; Mercer, Reeves and Hollis become presence and props.
- **Lengths: m09 about 75 minutes, m10 about 100** (D-01, orchestrator). The old outline's ranges; m07 ships at 90. (Superseded at stages 1–2, orchestrator rulings: m09 about 85 with the field guides, 95–100 without; m10 about 105, ceiling 110.)
- **The sleeper is a new Task Force Null agent, introduced in m09 and found by a whodunit** (D-03). Making Vector or Phantom the sleeper would undo m08's verdict; meeting her in m09 gives the betrayal something to betray.
- **She came in as a lateral hire through Harwick & Lowe, an older front, not in Tesseract's intake** (D-03, A24, B3; the round 1 TalentStack route is withdrawn). Explains why the post-m08 screening missed her and why m05's lists never held her.
- **Renamed to Halina Kowalczyk, a woman** (A2, D-19). Wierzbicki is already an m05 name; the change also balances the new cast.
- **A wrong accusation costs an innocent's place on the team, not a life.** Accusing must be a real choice with a cost; the m10 evidence always allows a right answer.
- **The sleeper wounds Quintero rather than killing anyone.** A missed optional task should cost, but a death would read as punishment.
- **Victoria's loyalty is decided by an m10 choice (trust, confront, refuse), not by `sterling_on_call_seen`** (A4). That latch records exploring, not conduct; it now drives only the escaped branch's threat, which is what it means.
- **Every m09 player gets the Recruiter's offer** (D-09). A real mid-mission choice for a player on default branches.
- **m09's own clock is the purge, costing optional finds only** (D-10, D-24). Pressure inside the mission, a job for Sorensen and Tran, and the trigger for cutting the leave short.
- **The Albion flaw catalogued and never reported is found in m09** (D-04). The player meets the truth in Tesseract's case before he makes it, and the m04 choice lands twice.
- **The Reading capped at four entries plus the prediction, and Sorensen quotes one aloud** (D-06).
- **Tier the imports, keep the list broad** (D-07, orchestrator). Tier 3 cuts only what lost its payoff (the Reading's dropped entries, `casualties_occurred`); both approved ink changes stay in Tier 1 or 2.
- **One power-room phone slot (a captured Voltage kept on the phone, else Vance, else Elena, else HaX), and one non-HaX voice per room; Kemal a line; Gary's m09 call gives a hint the player uses** (D-17, R2-01, R3-01).
- **The wall of cards is the "previously on", with never-played cards** (D-15, A17).
- **m09's briefing is a cutscene; m10 has nine playable rooms** (D-16).
- **Tesseract's origin stays unplaced** (A15). The voice bible keeps it deliberately vague; nothing in the finale needs a birthplace.
- **Tesseract calls HaX, not the player, at the end of m09.** He is her teacher; the player overhearing one side is more tense than a monologue.
- **HaX's meaning of the line is told in m09.** It makes the line the player's own argument in m10 (row 120). (Changed at stages 1–2: in m09 it is cut to three words and one sentence after the deck; in m10 it is a record answer on `m09_completed`, and the third exchange's mission rebuttal is the clean-hands argument, m10 change 31.)
- **Netherton says the name in m09 (row 125)**, in words that work whether or not the player heard his optional m08 pledge (A27, B5). The scene where the proof comes together is his.
- **New cast varied in age, background and sex**, clear of the Chen/Reeves/Park/Okafor/Wierzbicki clashes, every name grepped (A2, D-19).
- **Mercer's absence filled by Asante, not an empty hall.** The server hall needs someone who can explain the release.
- **The two dead agents named (Fraser, Ferreira).** Row 100 has Netherton read the names, so they need names.
- **Teaser behind a default-off global.** Planned slot, no dependency (brief).
- **Clocks in UTC only.** Avoids the local-midnight/dawn mismatch in §1.5.
- **Titles: m09 *Digital Archaeology* (kept); m10 *Full Disclosure*** (user's choice, 2026-10-20; "Tomb Gamma" declined, F8), id `m10_full_disclosure`.

**Round 2** (orchestrator decisions applied as given; the rest are mine):

- **Every won branch puts a person in the bunker; five slots filled on every combination** (R2-01, orchestrator). Captured Voltage on the plant phone, protected Gary as consultant, arrested Nightshade in cuffs with a deal, arrested Victoria bargaining from custody, Ghost for everyone. A careful player's m10 is as full as a careless one's. (Superseded, rounds 3–4: each won branch has a decision and a face-to-face beat in its own room, §5.3; only the door slot is at the forward post.)
- **Pieter Vos fills Victoria's desk** when she is KO'd or never met. Pays m03's "filled by Monday" and keeps the gallery a scene on every branch.
- **He stops the clock when 0x00 walks in; flag 3 moves to the server hall** (R2-02, orchestrator). The climax is talk and choices; the clock presses on the raid only. (Superseded, round 3: the countdown runs on story events, §4.2. Superseded again at stages 1–2: he pauses nothing, "It goes at six whatever we say.", m10 change 37.)
- **He refuses WREN at the key** (R2-03). Turns the hole in his motive into its clearest statement.
- **Three clues, an alibi and the player's own cracker serial; a wrong accusation is visible and undoable; a knock-out is not an accusation** (R2-04, R2-06, orchestrator). (Clue 3 superseded at stages 1–2: the bench's cloner record and the breaching case's sign-out sheet; the cracker is a suspicion beat and the accusation's last card, m10 change 22.)
- **WREN came in through Harwick & Lowe, an older front** (B3, orchestrator). SAFETYNET has known TalentStack since m05; an older firm explains the miss.
- **The head start goes out at 04:00, on the same clock** (R2-08). The cells' fate becomes a payoff of m02 and m03 choices. (Superseded, rounds 3–4: found at flag 2, goes as the gallery door opens unless stopped at the server hall. Superseded again at stages 1–2: it goes as the outer lock opens, m10 change 19, §4.2.)
- **Tier 1 is every import that changes a room; Tier 2 is lines only** (R2-09, orchestrator). m09 19 + 24, m10 37 + 25 (26 after round 3 added `m05_final_choice` for C2).
- **The purge runs on story events, with two save-one choices** (R2-10, orchestrator). VM speed costs nothing; the loss is one the player picked.
- **m10 gets a cold-start briefing; never-played canon is stated once and matches the defaults** (R2-11, R2-16, B1, B2).
- **Disclose burns operations the player knows; the player sends Tesseract's unsent vendor notice in m09** (R2-12, orchestrator). Secure gains the operations; disclose costs them; coordinated disclosure is done once in play before the menu.
- **The power room is on the main path** (R2-13): the gallery's shutter runs off it. (Called "the plant room" before round 3.)
- **The talk-down is three exchanges, only the matching answer lands, two of three to win** (R2-15). Weak answers are visibly weak.
- **HaX's confession gets an answer that decides whether she speaks at the core** (R2-19).
- **The Recruiter's file holds the handler list; her name is always right; the double-cross is allowed** (R2-20).
- **Ghost rings the server hall and is selling the head start; the parley's fact opens a window past the outer lock** (R2-21, weak Tier 1 #3). (Superseded, round 3: the handset is in the security office.)
- **The Albion flaw is one of m04's holes, catalogued nine years ago** (B4, R2-07, orchestrator).
- **Hollis's prop stays on `evaded` only** (B9). One value, no new export, for a prop.
- **VM wording follows the orchestrator's story-level text** (two machines in m09; m10 flags 1–3 reworded). The VM plan itself stays with the Haiku agent.

**Round 3** (orchestrator decisions applied as given; the rest are mine):

- **Each won branch gets one decision and one face-to-face beat; one non-HaX voice per room** (R3-01, orchestrator). Captured Voltage: walk him to his switchgear or keep him on the phone. Protected Gary: in person at the workshop, talk round or take in the technician he trained. Refused Ghost: a question back, then the window or a camera blind. Arrested Victoria: face to face at the forward post. (Staging superseded, round 4, N-02: only the door slot is at the forward post; Voltage is placed at the power room; Victoria rings the server hall and the face-to-face beat is Vos in the gallery.) Arrested Nightshade's deal knows the player said "no deals".
- **The raid countdown runs on story events** (R3-02, orchestrator). The head start goes only if the gallery door opens before the player stops it at the server hall (round 4, N-05; the outer lock since stages 1–2); Seattle's batch only through an open backdoor; 06:00 never fires before the core.
- **The purge choice is forced by an event** (R3-04, orchestrator): the cage opening takes the other bin; the end of the Recruiter's call starts the wipe. Stopping the person saves only what is left. Her offer and the tape-deck choice are one decision.
- **One purge order in all three documents: flag 2 before her call** (C3, orchestrator). The ledger reveals WREN before the Recruiter can offer her name.
- **02:10 is a pre-breach recon split; the readers accept SAFETYNET badges because he loaded them from the stolen database; WREN propped the service door for her own exit** (R3-03, C4, orchestrator). Quintero and Kowalczyk took the tunnel; Arakawa was at the fence with the player. (Changed at stages 1–2: the door is Tesseract's exit and her way back to the key, not an exit with the stolen copy; WREN has one goal, the key, m09 change 8, m10 change 27.)
- **m07's never-played canon is "one team, four sites; Austin reached; two of ours died at the others"** (C1, orchestrator). Matches m08's shipped line and row 100. Gameplay defaults kept; the dark media room now has its own reason.
- **The Recruiter's "network" is gated by m05** (C2, orchestrator): placements by default, handlers and the forty-seven on exposure, Torres' missing names on the turned branch. m10 imports `m05_final_choice` for the epilogue.
- **Disclose's defaults are operations still live after the raid (the watch on Ghost's buyers, the Zero Day broker tap; round 4 replaced the handler watch), and every database option has an epilogue scene beat** (R3-05, orchestrator).
- **The double-cross rolls up only part of her network** (R3-07). Three answers, three outcomes.
- **Ghost's handset moves to the security office** (R3-12). One scene per room.
- **The notice is nine years late** (C11, R3-11). It was drafted with the memo.
- **"Power room", never "plant", for the room in player-facing text** (R3-10).
- **The safe-opened branch gets its own HaX confession; `should_have_told` gets its own beat at the core** (C18, R3-16). Neither answer is punished. (Stages 1–2: the forms are labelled "m06 name found / not found", and a third answer, `afterwards`, is added; m09 changes 19, 24.)
- **L+ is defined as a scene-shaping line built with Tier 1** (C16). Tier 1 counts unchanged.

**Stages 1–2** (arc-keeper, 2026-10-21; orchestrator rulings applied as given; each change is listed in §15):

- **The stage 1–2 documents are the authority where they and this one disagreed.** They are newer and reviewed four rounds each.
- **The Publication has two modes, and the casualty sheet prices the key** (m09 change 28, m10 change 42). City by city from 06:00; everywhere in the same minute by key. 1,100–2,600 is the key's price; the fallback kills fewer, later. It answers "why build a key at all?" and keeps the 06:00 clock honest.
- **WREN has one goal, the key** (orchestrator ruling). The Architect took her tasking for tonight; "plays both ends" and the copy for the Initiative are withdrawn everywhere.
- **The cracker canon is m10's** (orchestrator ruling, m10 R3-06): Kowalczyk's own, bench-made, logged by batch; the cloner is the unit logged "to WREN"; m09 claims nothing about where it was made.
- **No pause at the core** (m10 change 37). "Paused" contradicted the 06:00 fallback.
- **The head start goes at the outer lock** (m10 change 19, S1-01). Every gallery decision about Zero Day's share comes before it.
- **Two lethal endings** (F11). D-11 reworded to the justified version only.
- **One forced-phone-scene rule for both missions** (orchestrator ruling; §6.1).
- **Per-scene one-voice rule in m09, per-room in m10** (m09 change 6). m09's scenes are phone-heavy in shared rooms; m10's raid moves room by room.
- **The cross-reference narrows WREN to two; only the Recruiter names her** (m09 change 6). Keeps her offer a real trade and gives m10 a helper (`sleeper_shortlist`).
- **The m09 briefing holds the name back** (m09 change 1). The identity scene gets its weight.
- **`m09_deck_pulled` is Tier 2 in m10** (arc-keeper's call): its only m10 use is a record answer.

## 10. Review round 1 outcomes

Reviews: `REVIEW_STAGE0_R1_ACCURACY.md` (A1–A30) and `REVIEW_STAGE0_R1_DESIGN.md` (D-01–D-24). User answers F5–F8 and the orchestrator's decisions were applied as given.

### Accuracy

| ID | Sev | Outcome | Where |
|---|---|---|---|
| A1 | major | Fixed: backdoor on `team_assignment != "trojan_horse" or team_redirected`; row 81 excludes the redirect | §2 rows 81–82, §3.2, §4.2, §4.4, m10 stage 0 §3 |
| A2 | major | Fixed: sleeper renamed Halina Kowalczyk; all new names and codenames grepped | §5.2, §8 r16 |
| A3 | major | Fixed: Noor and the epilogue count use `found_pipeline_list and not recruiter_deal_accepted`, with a smaller version on a confession | §2 row 62, §3.1, §3.2, §5.2 |
| A4 | major | Fixed: recruited Victoria's loyalty is an m10 choice backed by flag 2 evidence; `sterling_on_call_seen` only drives the escaped threat | §2 rows 32–33, §3.2, §4.4 |
| A5 | major | Fixed: Mercer needs `m07_completed`; rule stated for every at-large value equal to a default | §2 row 87, §3 intro, §3.2 |
| A6 | major | Fixed: §1.1 "since m06"; row 70's safe-opened branch has HaX say it again, as fact | §1.1, §2 row 70, §5.4 |
| A7 | major | Fixed: the innocents line is narrowed to what the imports know ("on your first day") | §2 rows 6, 26, §4.1 |
| A8 | minor | Fixed: no KO value; `""` with `m01_completed` reads as arrest | §2 row 1, §3.2 |
| A9 | minor | Fixed: HaX names Maya and the missing names, no promise callback | §2 row 6 |
| A10 | minor | Fixed: "issued for the first time since St. Catherine's" | §2 rows 29, 118; m09 stage 0 |
| A11 | minor | Fixed: Static with Voltage only on `static_left and not static_left_alone` | §2 row 46, §3.2, §9 |
| A12 | minor | Fixed: knock-out branch has no "Same classroom" text; m09 opens on Netherton's line | §1.1, §3.1 |
| A13 | minor | Fixed: ARC's split kept (only flag 4 in the tape room); m09 stage 0 aligned | m09 stage 0 §2.1 |
| A14 | minor | Fixed: "His last directive ended…" | §1.2 |
| A15 | minor | Fixed: origin left unplaced | §5.1, §8 r9, §9 |
| A16 | minor | Fixed (a): "issued before he left seven years ago". (b) logged as new canon for stage 6 and the user | §6.1, §8 r17 |
| A17 | minor | Fixed: wall imports added to m09 Tier 2 | §2 row 57, §3.1 |
| A18 | minor | Fixed by removal: the Reading entry it concerned is cut (D-06) | §2 row 114 |
| A19 | minor | Fixed: opening branches on `m06_architect_identity_found` and `m07_teacher_discussed` | §2 row 98 |
| A20 | minor | Fixed: credited to m07, gated on `teacher_discussed` | §2 row 70 |
| A21 | minor | Fixed: `reeves_fate` values re-cut (custody / at large); `exposed` dropped | §2 row 21, §3.3 |
| A22 | minor | Fixed: fallbacks stated as the read rule for every pre-change save | §2 row 22, §3.3, §8 r3 |
| A23 | minor | Fixed: placements and candidates distinguished | §2 row 63, §5.2, §6.1 |
| A24 | minor | Fixed: sleeper is a legacy placement the m05 lists never held | §2 row 63, row 117, §5.2 |
| A25 | minor | Fixed: Ghost Protocol and Digital Vanguard added as closing-card rows | §4.6, m10 stage 0 §3 |
| A26 | minor | Fixed: mechanism and expected validator warnings stated | §3 intro |
| A27 | minor | Fixed: Netherton's pledge (row 125), `partial` lines (rows 48, 59), Danny's question (row 36) | §2 |
| A28 | minor | Fixed: the Council's yes is told by Netherton in m10 | §2 row 99, §5.5 |
| A29 | minor | Fixed: "We said we'd be watching." | §2 row 14 |
| A30 | minor | Fixed: path `ink/m07_phone_agent_0x99.ink` | §3.3 |

### Design

| ID | Sev | Outcome | Where |
|---|---|---|---|
| D-01 | major | Fixed (orchestrator): m09 ~75 min, m10 ~100; five full scenes, the rest presences, props, lines | §1.3, §2 intro, §5.1, §5.3, §8 r6 |
| D-02 | major | Fixed: the key must be pressed by a SAFETYNET agent; the Reading predicts 0x00; fallback at 06:00 | §1.2, §4.1, §4.3 |
| D-03 | major | Fixed: whodunit seeded in m09; TalentStack recruitment; accusing is a real choice | §2 row 117, §4.4, §5.2 |
| D-04 | major | Fixed: the unreported Albion flaw found in m09; the schedule shows entries by city in m10 | §1.3, §4.1, §4.2, §6 |
| D-05 | major | Fixed: each database option's cost said before the choice and paid in the epilogue | §4.1, §4.6 |
| D-06 | major | Fixed: Reading capped at four plus the prediction; Sorensen quotes one | §2 intro, rows 4, 5, 68, 114 |
| D-07 | major | Fixed (orchestrator: tier, keep broad): Tier 1 about 15 threads per mission, Tier 2 broad, Tier 3 five m09 names and one m10 name cut; the reviewer's wider cut list declined, because the user wants as many choices as possible carried | §3 |
| D-08 | major | Fixed: three record lines in his case; the rest are the player's options | §2 intro, §4.1 |
| D-09 | major | Fixed: the Recruiter's offer for every m09 player; the whodunit and the Victoria choice in m10 | §2 row 60, rows 32, 117 |
| D-10 | major | Fixed: the purge as m09's clock, optional finds only | §1.3, §6.1, §8 r18 |
| D-11 | major | Fixed: dead-man switch trigger; not offered after a successful talk-down | §4.1, §4.5 |
| D-12 | major | Fixed: his own dead-man purge; flaws unmapped; memory line | §4.5, §4.6 |
| D-13 | minor | Fixed: line left open on purpose as a trace | §4.1, §8 r11 |
| D-14 | minor | Fixed: cells get it hours early | §1.2, §2 row 13 |
| D-15 | major | Fixed: wall as "previously on", never-played cards, Tesseract beat | §2 row 57, §8 r2 |
| D-16 | minor | Fixed: m09 briefing a cutscene; m10 nine rooms, tunnel a cutscene. Tile reuse left to stage 5 | §5.3, stage 0 files |
| D-17 | minor | Fixed: one phone slot; Kemal a line; Gary's hint | §2 rows 23, 50, 77, 90 |
| D-18 | minor | Fixed: Tran runs the tape wipe | §2 row 6, §5.2 |
| D-19 | minor | Fixed: Villalobos replaced by Cody Old Coyote (Apsáalooke); Kowalczyk and Asante women | §5.2 |
| D-20 | minor | Fixed: visible reactions per landed point | §4.1 |
| D-21 | minor | Fixed: offer folded into his case; Join starts with "Show me how it works" | §4.1, §4.3 |
| D-22 | minor | Fixed: one-room silent stretch; warnings before the jam | §4.4, §5.4 |
| D-23 | minor | Withdrawn: the user approved `reeves_fate` (F5) and the orchestrator kept it. Reduced to a prop and a line (Tier 2), which meets the reviewer's cost concern | §2 row 21 |
| D-24 | minor | Fixed: the intercepted purge order cuts the leave short | §1.5 |

**Counts:** 53 fixed, 1 withdrawn (D-23), 0 deferred. The reviewer's broader Tier 3 list under D-07 was declined on the orchestrator's instruction; D-07 itself counts as fixed.

## 11. Review round 2 outcomes

Reviews: `REVIEW_STAGE0_R2_ACCURACY.md` (B1–B16, plus the A27 reopen) and `REVIEW_STAGE0_R2_DESIGN.md` (R2-01 to R2-24, plus R1 items D-03, D-05, D-10, D-14, D-15, D-20 reopened). The orchestrator's decisions and VM wording were applied as given.

### Accuracy

| ID | Sev | Outcome | Where |
|---|---|---|---|
| B1 | major | Fixed: every m07 team effect gated on `m07_completed`; m07's never-played canon stated (no channel, no dispatch line, media room dark) | §1.5, rows 83–84, §3 never-played table, §3.2, §4.2, §4.4, §5.3 |
| B2 | major | Fixed: Vector and Phantom need `m08_completed` | row 112, §3.2, §4.4, §5.1, §5.3 |
| B3 | major | Fixed: WREN came in through Harwick & Lowe, an older front tied to the Initiative only by the m09 ledger | row 117, §5.2, §9; m09 stage 0 |
| B4 | major | Fixed: one of m04's holes (the plant's control equipment), catalogued nine years ago, his memo from the same time; dates agree across all three documents | §1.3, §4.1, §6.1, §8 r19; m09 stage 0 |
| A27 (reopened) / B6 | minor | Fixed: `partial` with `crew_lost` "the inquest heard the rest"; without, the half-statement; "as he said he would" dropped | row 59 |
| B5 | minor | Fixed: Netherton's line works whether or not the pledge was heard; §1.1 no longer says it "stands" | §1.1, row 125, §5.5 |
| B7 | minor | Fixed: KO'd Victoria says nothing; the name comes from her seized devices | row 35, §5.1; m09 stage 0 |
| B8 | minor | Fixed: the late warning needs `found_pipeline_list` too | row 62 |
| B9 | minor | Fixed by keeping `evaded` only, with the reason stated | row 92 |
| B10 | minor | Fixed: "You said it was yours." | row 99 |
| B11 | minor | Fixed: the two "Kevin Tran" hits noted, with why they don't matter | §5.2 |
| B12 | minor | Fixed: Derek's file in the restricted series; the Recruiter's file survives until her call; purge order stated | row 1, §6.1 |
| B13 | minor | Fixed: "ENTROPY's money" | m10 stage 0 §4 |
| B14 | minor | Fixed: the clean first-day line and option need `m01_completed` | row 6, §3.2, §4.1 |
| B15 | minor | Fixed: orphan header rows removed | §3.1, §3.2 |
| B16 | minor | Fixed: the full condition in the `m07_team_assignment` row | §3.2 |

### Design: new findings

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R2-01 | major | Fixed (orchestrator): five slots filled on every combination, a won branch puts a person in the room | §1.3, §2 intro, rows 23, 34–35, 42, 44, 107, §5.1, §5.3 |
| R2-02 | major | Fixed (orchestrator): he stops the clock; flag 3 at the server hall; core holds flag 4 and the talk | §1.2, §4.0, §4.1, §4.2, §6.2 |
| R2-03 | major | Fixed: "Not you, Halina. You're mine." She turns on the disarm and the copy | §1.2, §4.4 |
| R2-04 | major | Fixed (orchestrator): three clues across the bunker, the alibi, the cracker serial; shortcuts skip a step only | §4.4, row 117 |
| R2-05 | minor | Fixed: Netherton's "You watch them" line | row 117, §4.0, §5.5 |
| R2-06 | major | Fixed (orchestrator): visible line, lost function by officer, recall on new evidence; KO not an accusation | §4.4 |
| R2-07 | minor | Fixed with B4 | §1.3, §4.1, §6.1 |
| R2-08 | major | Fixed: head start at 04:00 on the visible clock; epilogue by history | §1.2, §4.2, §4.4, §4.6, §3.5 |
| R2-09 | major | Fixed (orchestrator): every R/H/O/P import in Tier 1; Tier 2 lines only; a Mercer profile | §3, §8 r1 |
| R2-10 | major | Fixed (orchestrator): event-driven, visible, two save-one choices, both sides stoppable | §1.3, §6.1, §8 r18 |
| R2-11 | major | Fixed (orchestrator): m10 cold-start briefing | §4.0, §3 never-played table |
| R2-12 | major | Fixed (orchestrator): disclose burns operations the player knows; the m09 vendor notice, answered in m10 | §1.3, §3.4, §4.1 |
| R2-13 | major | Fixed (orchestrator): the plant is on the main path (the gallery's shutter) | §4.0, §4.4 |
| R2-14 | minor | Fixed: "Your file says I press it. Watch me."; his answer after "Stop it" | row 101, §4.1 |
| R2-15 | minor | Fixed: three exchanges, matching answers only, decoys, two of three | §4.1 |
| R2-16 | minor | Fixed: never-played canon matches defaults | §3 |
| R2-17 | minor | Fixed: "They think you're here to steal their head start. You are." | §1.2, row 119 |
| R2-18 | minor | Fixed: the drafted story on the media-room desk | row 84, §5.3 |
| R2-19 | minor | Fixed: the player answers HaX's confession; "Put me on speaker" | §5.4, §3.4, §4.1 |
| R2-20 | minor | Fixed: the handler list; always right; double-cross allowed | row 60, §3.4, §4.6 |
| R2-21 | minor | Fixed: Ghost rings the server hall and sells the head start; a question on the kept branch | rows 13–15, §4.4 |
| R2-22 | minor | Fixed: raid team positions | §4.0 |
| R2-23 | minor | Fixed: "In court. I've a lot to say." | §4.1 |
| R2-24 | minor | Fixed: the ledger is live, updated day 10 | row 117, §6.1 |
| Weak Tier 1 (assets seized, Torres, Ghost refused, monitoring) | – | Fixed: HaX at the fence and the memo; Torres rings in or "closed placement"; the guard-change window; the tagged-payments object | rows 15, 64, 71, 72 |

### Design: reopened round 1 items

| R1 | Outcome |
|---|---|
| D-03 | Closed by R2-03, R2-04, R2-05, R2-06 and B3: no single clue names her; the accusation is a real, recoverable choice. |
| D-05 | Closed by R2-12: secure keeps the operations and leaves the flaws live; disclose fixes them and burns operations the player knows. |
| D-10 | Closed by R2-10: event-driven purge with two choices. |
| D-14 | Closed by R2-08: the head start's timing and what stops it. |
| D-15 | Closed by R2-11 and R2-16: m10 cold start; cards match defaults. |
| D-20 | Closed by R2-15: misses are visibly misses, and the player has to listen. |

**Counts:** 16 accuracy findings (B1–B16; A27's reopen is B6) and 24 design findings, plus 6 reopened round 1 items: 46 fixed, 0 withdrawn, 0 deferred.

## 12. Review round 3 outcomes

Reviews: `REVIEW_STAGE0_R3_ACCURACY.md` (C1–C20) and `REVIEW_STAGE0_R3_DESIGN.md` (R3-01 to R3-19, plus its handover list, merged into §13). The orchestrator's decisions were applied as given. After the fixes, every term a fix touched was grepped across all three documents (`m07_team_assignment`, TalentStack, the pledge, the refit money line, Arakawa and Quintero, the purge order, "plant", the handset, "seven years"), and the stale copies were corrected.

### Accuracy

| ID | Sev | Outcome | Where |
|---|---|---|---|
| C1 | major | Fixed: never-played m07 is "one team, four sites; Austin reached; two of ours died at the others"; defaults kept; the dark media room has its own reason | §3 never-played table, §4.6 |
| C2 | major | Fixed: the Recruiter's network gated by m05 (`public_exposure`, `turn_double_agent`); m10 imports `m05_final_choice` | rows 60, 63, §3.2, §4.6 |
| C3 | major | Fixed: one order everywhere, flag 2 before her call | §1.3, row 60, §6.1; m09 stage 0 §2.2, §2.3 |
| C4 | major | Fixed: the alibi uses the pre-breach split (Arakawa at the fence with the player); post-breach positions unchanged | §4.0, §4.4; m10 stage 0 §2.2 |
| C5 | minor | Fixed: Torres rings from his desk, still in place; his ledger entry live; exact value names | rows 63, 64, 64a, §5.1 |
| C6 | minor | Fixed: "You said no deals. Netherton says otherwise tonight."; refusing is the first option | §4.4, §5.1 |
| C7 | minor | Fixed: "the same unplaceable voice as in m02" | row 13 |
| C8 | minor | Fixed: "You saved my career." | row 23, §5.1 |
| C9 | minor | Fixed: `m07_completed` on rows 85 and 103 and the closing card; never-played closing card; §9 backdoor line | rows 85, 103, §4.6, §9 |
| C10 | minor | Fixed: "placed in SAFETYNET eleven years ago, assigned to Task Force Null on day 10"; ransom line gated | m09 stage 0 §3 |
| C11 | minor | Fixed: nine years late, drafted with the memo | §1.3, §3.2 |
| C12 | minor | Fixed: "Netherton says the name" | row 70, §9 |
| C13 | minor | Fixed: export counts, Harwick & Lowe, slot order, pledge | §9 |
| C14 | minor | Fixed: one rule for naming her and her network, every value covered | §3.4, §4.6, §8 r15 |
| C15 | minor | Fixed: Nightshade's file in a locked plan chest in the restricted stacks (never purged); her file is a tape; the ledger shredded once read | §6.1; m09 stage 0 |
| C16 | minor | Fixed: L+ defined; the three m08 rows marked L+; counts unchanged | §3, §3.1 |
| C17 | minor | Fixed: "the core host terminal" | §4.1 |
| C18 | minor | Fixed: the safe-opened branch has its own confession and answers | §3.4, §5.4 |
| C19 | minor | Fixed: `m01_completed and not m01_maya_ko`; a neutral cold-start warning | row 6 |
| C20 | minor | Fixed: the timeline row says Montana evening, Citadel early hours of day 13 | §1.5, §4.0; m10 stage 0 §1 |

### Design

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R3-01 | major | Fixed (orchestrator): one decision and one face-to-face beat per won branch; one non-HaX voice per room | rows 15, 23, 44, 50, §4.0, §4.4, §5.1, §5.3 |
| R3-02 | major | Fixed (orchestrator): the countdown runs on story events; no wall-clock cost | §1.2, §4.2, §4.4, §4.6, §8 r7 |
| R3-03 | major | Fixed (orchestrator): pre-breach split, readers, WREN's purpose at 02:10 | §4.0, §4.4 |
| R3-04 | major | Fixed (orchestrator): the event takes the other item; stopping the person saves only what's left; one order | §1.3, row 60, §6.1 |
| R3-05 | major | Fixed (orchestrator): live default operations; a scene beat per database option | §4.1, §4.6 |
| R3-06 | minor | Fixed: "skips one whodunit step"; the door slot is at the forward post | row 104, §3.2, §5.1 |
| R3-07 | minor | Fixed: the double-cross rolls up only part of her network | row 60, §4.6 |
| R3-08 | minor | Fixed: the casualty sheet on the workshop's critical path; the decode sharpens the rebuttal | §4.1 |
| R3-09 | minor | Fixed: HaX's "who is Tesseract" sentence in m10's cold start | §4.0 |
| R3-10 | minor | Fixed: "power room" for the room; "WREN" or "the sleeper" for the person | §4.0, §5.1, §5.3; m10 stage 0 |
| R3-11 | minor | Fixed with C11 | §1.3, §3.2 |
| R3-12 | minor | Fixed: Ghost's handset in the security office | rows 13, §4.0, §4.4, §5.1, §5.3 |
| R3-13 | minor | Deferred to stage 1 (needs scene writing): a beat and a reason for suspicion for Quintero, Malhotra and Arakawa | §13 item 4 |
| R3-14 | minor | Fixed: a knocked-out Kowalczyk can't act and stays unnamed; her entrance timing; Vector and Phantom in the alibi with lost functions | §4.1, §4.4 |
| R3-15 | minor | Fixed: recall by Netherton's radio | §4.4 |
| R3-16 | minor | Fixed: `should_have_told` gets HaX's unasked line and its own option | §4.1, §5.4, §3.4 |
| R3-17 | minor | Fixed: idle lines on VM sub-progress; field-guide offer works in the core (the lines themselves at stage 7) | §4.1 |
| R3-18 | minor | Fixed: the five checklist lines in both stage 0 files; the sealed-section echo before flag 3 | §6.2; both stage 0 §7 |
| R3-19 | minor | Fixed with C15: her file is a tape | row 60, §6.1 |

**Counts:** 39 findings (C1–C20, R3-01 to R3-19): 38 fixed, 0 withdrawn, 1 deferred to the stage 1 handover (R3-13).

## 13. Handover to stage 1 (statuses updated after stages 1–2)

The design reviewer's 23-item list, merged with what round 3 deferred, deduplicated. Each item has an owner stage, and a status where stage 0 has already settled the design. Statuses were updated by the arc-keeper after stages 1–2 closed (from m09 stage 1 §12 and m10 stage 1 §12–13); items 33–40 are new, for stage 3 onwards.

| # | Item | Status | Owner |
|---|---|---|---|
| 1 | The night's UTC timeline and how the countdown display steps with story beats | Settled in design (§4.0, §4.2); the countdown objects' step values remain, and m09's night in UTC (local night of day 11, early day 12; the debrief's "twenty hours") is fixed in §1.5 | Stage 4 |
| 2 | Why the readers log SAFETYNET badges; what WREN did at 02:10 | Settled at stages 1–2 (§4.0): stolen credentials in the readers; WREN copied the badge at 01:58 and propped the door at 02:10 as his exit and her way back to the key | Stage 7 (lines) |
| 3 | What Kowalczyk's cracker is for, and whether every SAFETYNET cracker comes from Tomb Gamma's bench (row 29 implies all, a large canon claim about SAFETYNET's supply chain) | Settled at stages 1–2, m10's version (row 29, §4.4): stores quarantined Nightshade's crackers, which came from the bench; Kowalczyk's is her own and bench-made; the bench logs it by batch; the cloner is the unit logged "to WREN"; m10 reissues it in the start kit | Canon note at stage 6 |
| 4 | A beat and a reason for suspicion for Quintero, Malhotra and Arakawa (R3-13), for example Quintero argued against going in tonight | Settled at stages 1–2 (row 117, §4.4, §5.2): each suspect has a reason, a beat and a clearing, and m10 calls back m09's three | Stage 7 (lines) |
| 5 | WREN's entrance at step 3, the knock-out case, Vector and Phantom in the alibi | Settled at stages 1–2 (§4.1, §4.4): WREN has one goal; the line-accusation and no-Quintero cases are stated | Stage 7 (lines) |
| 6 | The purge's event order and the moment of each choice | Settled (§6.1) | – |
| 7 | The Recruiter's file on tape; the double-cross's cost | Settled (row 60, §6.1); the choice's wording | Stage 3 |
| 8 | The default source of the archive's company name for a player with none of the branch sources | Settled at stages 1–2 (§1.5, row 55): the courier label on the order SAFETYNET read and let go on; how the courier was caught, by priority (Calder Wharf, the HashChain tags, the Helena ticket) | – |
| 9 | The identity scene's load (flag 3, the handwriting, Netherton's name, HaX's confession and answer, the optional notice at one terminal); whether the notice moves to a later beat | Settled at stages 1–2 (§5.4, §6.1): the scene carries the proof, the name and one sentence, one recognition line, the confession with its cost, and the answer; the hand is matched earlier; the line's meaning and the notice have their own beats | – |
| 10 | "Seven" or "nine" years late | Settled: nine (§1.3) | – |
| 11 | The won-branch decision and face-to-face beat for each slot; one non-HaX voice per room | Settled at stages 1–2 (§4.4, §5.3): every slot and branch has a decision, including the silent door and Vos's default; m09 applies the rule per scene | Stage 3 (wording and costs) |
| 12 | Event-driven clock; §8 r7 rewritten | Settled (§4.2, §8 r7) | Stage 4 for the steps |
| 13 | Who is physically in the workshop and the power room on won branches | Settled: the default technicians stay in both rooms; Gary or Voltage join them | Stage 5 for placement |
| 14 | Disclose's live default operations and an epilogue beat per database option | Settled (§4.1, §4.6); costs finished | Stage 3, lines at stage 7 |
| 15 | The casualty-sheet correction on the path, the decode as a bonus | Settled (§4.1) | – |
| 16 | The "who is Tesseract" sentence in m10's cold start | Settled (§4.0); m09's equivalent is Netherton's sentence in the identity scene | Stage 8 reads both cold |
| 17 | Ghost's handset location | Settled: the security office (§4.0) | – |
| 18 | Tesseract's idle lines during flag 4, on VM progress | Rule settled (§4.1); the lines | Stage 7 |
| 19 | Why he pauses the cells' push too | Settled at stages 1–2 (§4.1 step 0): he pauses nothing; one optional exchange at the core ("Two hours for people who'll waste it. They were always scenery." / "Good. I never liked paying them.") | Stage 7 (lines) |
| 20 | HaX's `should_have_told` beat at the core | Settled (§5.4); write it | Stage 7 |
| 21 | Player-facing names: "WREN"/"the sleeper", "the power room" | Settled (§4.0); enforce in the lint read | Stage 7 |
| 22 | The five missing checklist lines | Done in both stage 0 §7 | – |
| 23 | An act-by-act time budget for m10 against m07's timings, and the order in which optional content is cut if it runs long (media room, then the backdoor task) | Settled at stages 1–2 (§8 r6): about 105, ceiling 110, act-level figures and the cut order; the per-beat figures remain | Stage 4 |
| 24 | Escaped Victoria without the m03 threat "recognises the player and leaves": give it a beat so it isn't the thinnest gallery branch | Settled at stages 1–2 (row 33): a trade for walking out | Stage 3 (wording) |
| 25 | N-06: refusing the Recruiter for the Alpha tapes buys nothing. Give the tapes a later use (for example Tesseract's first draft of "Let it hurt afterwards…" in his hand, exported as `alpha_tapes_saved`, a record answer under the third claim). "Pull nothing" already maps to `refused` | Partly settled at stages 1–2: m09's stake is "He teaches what he'll do"; the export is `deck_pulled` (§3.4), replacing `alpha_tapes_saved`; m10 reserves a record answer under the third claim citing his Tomb Alpha teaching notes. Open: whether the tapes play in m09 (a new voiced asset the user approves), decided before stage 7 | Stage 3 |
| 26 | N-11: HaX's unasked line now fits both confession branches ("My agent told me I sat on it."); check the voiced wording | Settled in design (§4.1) | Stage 7 |
| 27 | N-15: why the branch operations disclose would burn (Nightshade's channel, the watch on a recruited Victoria) survive the raid, for example Nightshade kept in the van out of the guards' sight and Victoria opening the lock with the gallery clear | Open; m10 stage 1 §13 item 5 suggests: a Victoria who held goes back to Zero Day as if nothing happened; Nightshade's channel survives because he never went below ground, unless taken in | Stage 3 |
| 28 | N-16: a decision for the triple-agent Nightshade who was shown his file: take the override and leave him at the post, or take him in with the team (he asks to see Tesseract's face) | The decision is in the door scene (row 105). Open: where he is placed if taken in; m10 stage 1 §13 item 1 suggests the outer lock with Quintero, and one line to Tesseract after the choices | Stage 3 |
| 29 | N-17: WREN on the Join path never comes through | Settled (§4.4) | Stage 3 checks it against the Join steps |
| 30 | N-14: the engine has no friendly follow or escort, so every companion beat is per-room staging (placed with `setVisible`, one line to cover the move). Stage 5 may propose a friendly-follow engine feature to the user, but the design must not depend on it | Settled in design (§4.0) | Stage 5 |
| 31 | N-10: the m09 lock order: the stamp at the hatch and the card cloned through the mesh before her office; whether the plan chest and the ledger shelf are inside the cage | Settled in design (§6.1 and its locks; the plan chest is at the back of the cage); placement open, including the cage staging (S-09: a hatch counter, or the bell fallback) and the option of flag 2's own station at the ledger shelf | Stage 5 |
| 32 | N-07: Quintero's "I took the drain, she took the door end" and Arakawa's line when Kowalczyk peels off | Settled at stages 1–2 (§4.0): written ("We split at the fork. I took the drain."; "Service side. She always takes the door nobody's watching.") | Stage 7 |
| 33 | m09's Recruiter invoice (`taken`, `double_crossed`) and refusing's clean record (`named`, `refused`): the suggested m10 homes are a ledger sting in his evidence and a record answer under the second claim (§4.1; m09 change 30) | Confirm, and rank the clean record among the second claim's record answers | Stage 3 |
| 34 | Surrender's two cells rolled up: the rule for which two | Open | Stage 3 |
| 35 | The $12.8M on `m06_assets_seized`: a Netherton decision the player hears; default "returned to the victims' fund" (row 80) | Confirm or flip | Stage 3 |
| 36 | The closing card's human line: the order of precedence among Elena Torres, dispatch, the forty-seven and Albion's inquiry | Open | Stage 3 |
| 37 | The cold lethal choice: confirm the two-step wording and that it is offered in both step-5 menus (§4.1) | Confirm | Stage 3 |
| 38 | m09 choices handed on: whether talk can stop Sorensen once the cage is open (not a turn); an m10 echo of the cage bin (Derek's standing order is the obvious one); W-26's optional fifth Reading note predicting the player's bin | Open | Stage 3 |
| 39 | The engine items both stage 1 documents list (m09 stage 1 §11's fifteen, including "reload mid-call"; m10 stage 1 §13's countdown objects, phone NPCs that ring on room entry, the release key object, Tesseract non-hostile and KO-proof, the 06:00, Scorched Earth and Join cutscenes) | Open | Stages 4–5 |
| 40 | Music the designs assume: near-silence for Tesseract's m09 call; the core's music stepping down per landed point and a silent gallery (F10, needs an engine change; fallback: silence on the second landed point) | Ask the user before adding a track; F10 pending | Stage 4, user |

## 14. Review round 4 outcomes

Review: `REVIEW_STAGE0_R4.md` (N-01 to N-17). A targeted pass: only these items were touched. After it, every changed term was grepped across all three documents ("forward post" beside Victoria, Voltage and Gary; "secure line"; "from custody"; "walked"; "behind the player"; "stays with the player"; "armed"; "leaves the server hall"; "Tran's wipe"; "as the call ends"; "handler watch"; "purge starts"; "mug"; "at her side"; "saves that side"; "office files"), and each stale copy was corrected or marked superseded.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| N-01 | major | Fixed: rows 23, 34, 44, the §2 intro and the two §3.2 rows now match §4.4 and §5.3 | §2, §3.2 |
| N-02 | major | Fixed (orchestrator): only the door slot at the forward post; Gary placed in the workshop; captured Voltage placed at the power room; arrested Victoria on a secure line in the server hall, with Vos in the gallery as the face-to-face beat; a short playable fence wait with Arakawa, which is his beat and lets the player live clue 2; one non-HaX voice per room | §2 intro, rows 23, 34, 44, §3.2, §4.0, §4.4, §5.1, §5.3; m10 stage 0 §2.2, §2.3 |
| N-03 | major | Fixed (orchestrator): the purge is already running when the player arrives (Sorensen behind the mesh, talk only); the Recruiter fires the deck wipe herself; Tran runs only the rest of the tape side; opening the cage without the hatch keeps the hatch bin | §1.3, row 60, §5.2, §6.1, §8 r18; m09 stage 0 §2.2, §2.3, §5, §6 |
| N-04 | major | Fixed (orchestrator): disclose's defaults are the watch on Ghost's resale buyers and the Zero Day tap; the handler watch is gone | §4.1, §4.6, §9 |
| N-05 | minor | Fixed: the head start goes as the gallery door opens; HaX warns on leaving the server hall; "armed" became "found" | §1.2, §4.0, §4.2, §4.4, §8 r7, §9; m10 stage 0 |
| N-06 | minor | "Pull nothing" mapped to `refused`; the Alpha tapes' later use handed over | §3.4, §6.1; §13 item 25 |
| N-07 | minor | Fixed: the tunnel pair split at a fork; Arakawa's line when Kowalczyk peels off | §4.0; §13 item 32 |
| N-08 | minor | Fixed: the cracker default includes the one issued to WREN | §13 item 3 |
| N-09 | minor | Fixed: §8 r18 matches §6.1 | §8 r18 |
| N-10 | minor | Fixed: office clause dropped; the ledger is shredded only if Sorensen is free; print from the stamp at the hatch, card cloned through the mesh | §6.1; m09 stage 0 §2.2; placement in §13 item 31 |
| N-11 | minor | Fixed: one line for both branches | §4.1, §5.4; §13 item 26 |
| N-12 | minor | Fixed: the import row carries row 6's condition | §3.1 |
| N-13 | minor | Fixed: the round-2 and round-3 lines that later rounds replaced are marked superseded | §9 |
| N-14 | minor | Fixed: companions are staged per room; Quintero catches up at the outer lock | §4.0, rows 23, 44, §5.1, §5.3; §13 item 30 |
| N-15 | minor | Handed over | §13 item 27 (stage 3) |
| N-16 | minor | Handed over | §13 item 28 (stage 3) |
| N-17 | minor | Fixed: on the Join path WREN never comes through | §4.4; §13 item 29 |

**Counts:** 17 findings: 15 fixed (N-06 partly fixed and partly handed over, counted here), 0 withdrawn, 2 handed over to §13 (N-15, N-16).

## 15. Stages 1–2 changes folded in

Arc-keeper pass, 2026-10-21, after both missions closed stages 1–2. Sources: `m09_digital_archaeology/stages/stage_1/story_arc.md` §14 (30 changes, with the reviewers' verdicts applied), its §13 "Stage 0 fixes" and §17 "For the arc-keeper and m10"; `m10_full_disclosure/stages/stage_1/story_arc.md` §14 (43 changes, with their "s0" sweeps). "m09 n" and "m10 n" in this document mean change n in those lists. Where the stage 1–2 documents and this one disagreed, the stage 1–2 documents won. The review records (§10–12, §14) keep their round's wording. "s0" is the mission's own stage 0 file. After the fold-in, the stale terms were grepped across this document and both stage 0 files ("everyone at once", "dead-man switch", "gallery door", "Put me on speaker", "Twelve", "stolen copy", "Safe opened / shut", "paused", "stops the clock", "75 minutes", "100 minutes", "intercepts", "who is Tesseract", "serial", "shelf mark", "Flags 1–3", "plays both ends", "My jaw"); what remains is in the history sections or reads correctly in its new sense.

### m09 (30 of 30 applied)

| Change | What | Where applied |
|---|---|---|
| m09 1 | The briefing holds the name back; "who is the suspect" | row 57, §5.5, §8 r2, §9; s0 §6 |
| m09 2 | The order read and let go on; the schedule in the safe shows the gap | §1.3, §1.5, row 55, §5.5, §6.1; s0 §1, §2.3, §4, §6 |
| m09 3 | Sold-and-lied opening carries the offer; a hang-up keeps the deck pull | row 61, §3.4 |
| m09 4 | Deck pull inside the call, defaults, re-ring; "About half of them" | row 60, §3.4, §4.6, §6.1; s0 §2.2 |
| m09 5 | Flag 4 carries his original casualty sheet | §1.2, §6.1 |
| m09 6 | One voice per scene in m09; Torres moves; the cross-reference narrows to two; `sleeper_shortlist` | rows 64, 117, §3.1, §3.4, §5.1, §5.2, §5.3, §9; s0 §2.2 |
| m09 7 | Netherton on the aircraft; debrief in a Helena hangar | row 125, §5.5; s0 §2.3, §6 |
| m09 8 | The Recruiter's reason; WREN's one goal; the service door as his exit and her way back to the key | row 60, §4.0, §4.4, §9; s0 §3 |
| m09 9 | The order names the Publication | §1.3; s0 §1 |
| m09 10 | The cracker, matched to m10 | rows 29, 118, §4.4, §13 item 3; s0 §2.2 |
| m09 11 | The raid team's suspicion beats | row 117, §5.2 |
| m09 12 | Flags 3–4 in the tape room; only its station takes Tomb Beta's VM | §6.1; s0 §2.1, §2.3 |
| m09 13 | "Ninety-nine", refused | §4.1 step 0, §5.4 |
| m09 14 | 85 minutes with field guides, 95–100 without | §1.3, §8 r6, §9; s0 §1, §6, §7 |
| m09 15 | HaX's promise after the deck; the confession's cost | row 70, row 120, §4.6, §5.4 |
| m09 16 | The Alpha tapes are his recorded teaching | row 60, §6.1, §13 item 25 |
| m09 17 | The m06 name came in the m06 debrief, as Satoshi's guess | row 70 (already matched; cited) |
| m09 18 | Sorensen: the Reading in her safe; keeps shredding, non-combat | §5.2 |
| m09 19 | Confession answers relabelled by import; "taken it to Netherton" | row 70, §3.4, §5.4, §9; s0 §2.2 |
| m09 20 | Row 37: "You've read him before", HaX's line | row 37, §3.1 |
| m09 21 | §6.1 flag 2: printed ledger optional; the call waits on flag 2 and the cage | §6.1 |
| m09 22 | §6.1 header: flags 1–2 at the drop terminal | §6.1; s0 §2.1 |
| m09 23 | m10 imports `m09_sleeper_shortlist` (Tier 1) and `m09_deck_pulled` | §3.2, §8 r1 |
| m09 24 | Third confession value `afterwards` | §3.2, §3.4, §4.1, §5.4; s0 §2.2 |
| m09 25 | `deck_pulled` exported; replaces `alpha_tapes_saved` | §3.2, §3.4, §13 item 25 |
| m09 26 | The night in UTC | §1.5, §13 item 1; s0 §1 |
| m09 27 | Stage 0 sweep (75 minutes, flag 3 place, "intercepted", the "who is Tesseract" beat, the debrief's place) | s0 §1, §2.1, §2.3, §4, §6, §7 |
| m09 28 | The Publication's two modes; the sheet prices the key | §1.2, §4.2, §6.1; both s0 |
| m09 29 | Row 32: Victoria's mail route stays hers; the office opens on the deck choice | row 32, §3.1, §5.1, §6.1; s0 §2.3 |
| m09 30 | The invoice; refusing's clean record | row 60, §3.2, §3.4, §4.1, §5.1, §13 item 33 |
| m09 §17 list | "Twelve" → "About half"; "to everyone at once"; "her own exit with the stolen copy"; "Safe opened / shut"; row 32; the invoice | rows 32, 60, §1.2, §3.4, §4.0, §4.1, §4.6, §5.4 |

### m10 (43 of 43 applied)

| Change | What | Where applied |
|---|---|---|
| m10 1 | No pronoun for WREN before the accusation | row 117, §5.2 |
| m10 2 | The cracker, m10's version; the cloner is the unit logged "to WREN" | rows 29, 118, §4.4, §13 item 3; s0 §2.2 |
| m10 3 | Accusations on the line; the raid net counts as HaX's channel | §4.0, §4.4 |
| m10 4 | Malhotra's eleven years; the placement told at the private aside; Quintero's hire the same quarter | row 117, §4.4, §5.2 |
| m10 5 | The epilogue at the forward post at 06:00, a cutscene | §4.6; s0 §2.3, §6 |
| m10 6 | Escaped Victoria's trade for walking out | row 33, §3.2, §4.2, §4.4, §4.6, §5.1, §5.3; s0 §2.2 |
| m10 7 | Arrested Victoria's information: Vos resells and skims | row 34, §4.2, §4.4, §5.2; s0 §2.2 |
| m10 8 | Default technicians Imran Siddiqui and Wendell Briggs | row 23, §1.3, §3 never-played, §3.2, §4.4, §5.2, §5.3, §8 r16; s0 §2.2, §2.3, §4 |
| m10 9 | A warned WREN goes ahead a room early | row 105, §4.4 |
| m10 10 | The shown Nightshade's override is the alarm panel | row 105, §3.2, §4.4, §5.3 |
| m10 11 | Helpers replace clues; the fork decides nothing | §3.2, §3.4, §4.0, §4.4, row 112; s0 §2.2 |
| m10 12 | Asante corrected the sheet | §1.2, §4.1, §5.2; s0 §2.2 |
| m10 13 | Escaped Voltage talked down with the corrected sheet | row 45, §3.2, §4.4, §5.1 |
| m10 14 | Close order; credits open "In this operation" | §4.6, §7; s0 §6 |
| m10 15 | Quintero objects at the briefing; answered at the lock | §4.0, §5.2 |
| m10 16 | Arakawa's 02:10 call; the road and the case | §4.0, §4.4, §5.2 |
| m10 17 | "Ninety-nine" / "Still HaX." | §4.1 step 0, §5.4 |
| m10 18 | Suspicion beats agree across both missions | §4.4, §5.2, §13 item 4 |
| m10 19 | The head start goes as the outer lock opens; the gallery door needs flag 3 | §1.2, §4.0, §4.2, §4.4, §4.6, §6.2, §8 r7, §9; s0 §2.2, §2.3, §6 |
| m10 20 | Two lethal endings (F11); D-11 reworded | §1.6, §3.5, §4 intro, §4.1, §4.5, §4.6, §8 r5, §9; s0 §2.2, §6 |
| m10 21 | HaX pays m09's promise at 06:00 | §4.6, §5.4 |
| m10 22 | Clue 3 is the cloner record and the sign-out sheet | §4.4, §9, §13 item 3; s0 §2.2 |
| m10 23 | The silent door's decision ("Manual."); wrong accusation of Arakawa's cost | row 107, §3.2, §4.0, §4.4, §5.1, §5.3 |
| m10 24 | Guard on the arrested branch | row 107, §3.1, §3.2, §4.4, §5.3 |
| m10 25 | No countdown engine feature; countdown objects | §4.2, §8 r7; s0 §2.2 |
| m10 26 | The cracker in m10's start kit | row 118, §4.0; s0 §2.2 |
| m10 27 | WREN's tasking; her refusal line | §1.2, §4.0, §4.4, §9 |
| m10 28 | "Magnus." / "Adrian."; the chapter at the van window | §4.1, §4.6, §5.5 |
| m10 29 | m09's sheet the original, m10's the later printing; new correction wording | §1.2, §4.1 |
| m10 30 | Quintero holds the outer lock; the van team takes the weapon if she's down | §4.0, §4.4, §4.5, §5.2, §5.3 |
| m10 31 | Exchange 3's clean-hands rebuttal; four fixed slots; the Alpha answer | row 120, §3.2, §4.1, §9, §13 item 25; s0 §2.2 |
| m10 32 | Vos's default trade; Ghost's "unanswered" branch | rows 13, 42, §3.2, §4.4, §5.1, §5.3 |
| m10 33 | Closing card five lines; every payoff has a home | row 80, §4.6; s0 §6 |
| m10 34 | About 105 minutes, ceiling 110 | §1.3, §8 r6, §9; s0 §1, §6, §7 |
| m10 35 | The WREN fact at the private aside | row 117, §4.0; s0 §2.2, §2.3, §6 |
| m10 36 | The service door's camera is a dummy | §4.0, §4.4, §6.2; s0 §2.2 |
| m10 37 | No pause at the core | §1.2, §4.1, §4.2, §6.2, §9; s0 §2.1, §2.3, §4, §6, §7 |
| m10 38 | `afterwards` at the core and the briefing; "[HaX. You're on speaker.]" | §3.2, §3.4, §4.1, §5.4 |
| m10 39 | "The rest" in two lines; "afterwards" rationed | row 120, §4.6, §5.4 |
| m10 40 | The executed ending's story; `media_story_ran` | row 84, §3.5, §4.4, §4.5 |
| m10 41 | The "Elsewhere" credits block | row 83, §4.6 |
| m10 42 | The two modes priced on his sheet | §1.2, §4.1; s0 §1, §4 |
| m10 43 | His case gated on flag 4 | §4.1, §6.2; s0 §2.1 |

### Also swept (stale copies of stage 1–2 decisions not on either list)

| Item | Source | Where applied |
|---|---|---|
| Netherton's m08 KO line is now a narrator line (the chair furthest away) | m09 stage 1 W-15 | row 110, §5.5 |
| Kemal's line moves to flag 4's casualty sheet | m09 stage 1 §12 item 8 | row 77, §3.1, §5.1 |
| The Albion answer is "Nine years late. Sooner than I managed."; the record button "I sent your notice. Tonight, from Helena." | m10 stage 2 §2.3 | §3.2, §4.1 |
| HaX's reply on `recruiter_secret = kept` is "I'll deal with that when this is done." (not "afterwards") | m10 stage 2 §3.1 | §3.2, §5.4 |
| Scorched Earth: gone by the service door; "I wanted to do the same." | m10 stage 1 §10.6 | §4.5, §4.6 |
| Ledger answers (`crew_lost`, `patient_bed4_deceased`, `satoshi_stance`) sting and decide nothing; `bed4_manually_stabilised` is a record answer | m10 stage 1 §9.3 | row 19, §3.2, §4.1 |
| The never-played m09 canon includes the defence list on paper | m10 stage 1 §7.1 | §3 never-played table |
| The m10 stage 0 hub's "what the line means if m09 didn't play it" removed (m10 makes it a record answer on `m09_completed` only) | m10 stage 1 §9.3 | m10 s0 §6 |
| §13 statuses and new items 33–40 | both stage 1 §12–13 | §13 |

### Conflicts settled

- **WREN's goal.** m09 8's original second half ("plays both ends") against m10 27 (one goal). Both now agree on one goal, the key (orchestrator ruling); m09 8 has withdrawn the phrase.
- **What the propped service door is for.** m09 8 says "her own way back to the key"; m10 27 and §8 say "his exit and her own way in". Both are kept: his exit (Scorched Earth uses it) and her way back to the key.
- **The cracker.** m09 10 was revised to m10 2's version (orchestrator: m10's version stands); applied as m10's.
- **The one-voice rule.** FA had one per room; m09 6 makes m09's per scene and leaves per room for m10. Both stand, each for its own mission (§5.3).
- **The speaker button.** FA's "Put me on speaker" against m10 38's "[HaX. You're on speaker.]"; m10's wording, now opened by `same_in_your_place` or `afterwards`.
- **`m09_deck_pulled`'s tier.** Neither list names one. Put in m10's Tier 2 (lines only), because its one m10 use is a record answer. Arc-keeper's call.
- **The pre-breach split's start.** FA had 01:50–02:20; m10 has the kit check from 01:45 "until the split", with WREN copying the badge at the table at 01:58, which can't fall inside a split starting at 01:50. §4.0 now gives no start time (after 01:58, back about 02:20); stage 4 sets it. Arc-keeper's call.
- **Which clue each helper replaces.** FA's "skips one step" against m10 11's named clues; m10's.
- **HaX's unasked line.** FA §5.4 had "I should have told them", §4.1 "I sat on it"; m10 stage 2 uses "I sat on it", now in both places.

### Counts after the fold-in

- m09 imports: 43 (Tier 1 19, Tier 2 24) plus eight `completed`; unchanged.
- m10 imports: 65 (Tier 1 38, Tier 2 27) plus nine `completed`; was 63 (37 + 26).
- m09 exports for m10: nine (`nightshade_shown_file`, `sleeper_named`, `sleeper_shortlist`, `recruiter_offer`, `deck_pulled`, `albion_notified`, `hax_confession_answer`, `recruiter_secret`, `reading_finished`); was seven.
- m10 exports for a later season: seven names; `ending` gains `executed` (six values).
- Export additions to m01–m08 (§3.3): 38, unchanged.

### Remaining inconsistencies (need edits to the stage 1–2 documents, not made here)

1. **m10's phone scenes have no forced-phone-scene rule.** The orchestrator ruled one rule for both missions, and this document and m10's stage 0 now apply it to Ghost's handset and arrested Victoria's secure line, but neither m10 stage 1 nor stage 2 states defaults, done-flags or re-ring for them (grep finds none). Owner: m10 stage 4–5, or a note in m10 stage 1 §13.
2. **m10 stage 1 §14 change 27** (m10 SA:518) still says the copy-for-the-Initiative line "differs from m09's change 8 second half ('plays both ends')". m09 has withdrawn that phrase (m09 §17 notes the two now agree), so the m10 sentence is stale.
3. **m09 stage 1 still words the two new exports as conditional**: §8's lead-in (SA:353, "plus `sleeper_shortlist` if §14 change 6 is taken"), §9 (SA:395, "if §14 changes 6 and 25 are taken") and change 23 ("Add `m09_deck_pulled` if change 25 is taken"). Both are now taken.
4. **m10 stage 1 §0** (SA:7) says FINALE_ARC wins "until a change in §14 is accepted"; all 43 are now in, so the line is out of date.
5. **The split's start time.** m10 stage 1 §3 and §8 give the kit check "01:45 to the split" and the copy at 01:58, but never say when the split starts; FA no longer gives one either. Stage 4 needs a time after 01:58 that still leaves the pair at the service door by 02:10.
6. **m10 stage 2 §2.2** (SE:118) gives Tesseract "Nobody fixes anything until it hurts everyone at once." It is his philosophy, not the mechanism, but it echoes the retired "to everyone at once" premise; stage 7 should check it can't be read as the 06:00 fallback.
7. **Correction wording.** m09 stage 2 (SE:433) says his model "double-counts"; m10 29 and this document say it "credits the hospitals' recovery twice, so it understates the dead". The meaning is the same; the m09 pointer could carry the fuller wording so the two missions' lines don't drift at stage 7.
