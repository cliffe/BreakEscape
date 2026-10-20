# Finale arc: m09 and m10

Stage 0, shared document for both finale missions. Author: stage-0 author (Opus), 2026-10-20. Status: round 1–3 findings folded in (§10–12); stage 1 handover in §13; draft for review round 4.

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

**The Publication:** at a set hour, Tomb Gamma releases the whole stolen database to everyone at once, free, every entry with working detail. His case is the one he left SAFETYNET over: services like SAFETYNET hoard weaknesses instead of getting them fixed, the arms race speeds up the collapse it claims to prevent, and only a shock everyone feels at once forces the fix. "Let it hurt afterwards, not during" turned inside out: let it hurt now, everywhere, so that afterwards no one can hoard.

**Why he needs Agent 0x00.** The Publication only proves his point if a SAFETYNET agent presses the key: the service that hoarded the map gives it away with its own hand. His file on the player (the Reading, m09) ends with a prediction that 0x00 will be the one. That is why he invites the raid instead of moving the hour, why one door is keyed to the player's name, why he waits at the console and does not fight for it, why he stops the clock when 0x00 walks into the core ("Take your time. I've paused it. I'd rather it was you."), and why Join is on offer at all. If nobody presses, a fallback releases the database on its own at 06:00 UTC, city by city. That keeps the clock real for the raid and makes his lesson muddier, and he hates that. His own plant on the raid team doesn't count: she is his, not theirs (§4.4).

**The cells' share.** The cells get the database two hours early, as their reward for their parts in the theft: the head start is a push from the core set for 04:00 UTC on the raid's countdown. In play it is driven by story events, not wall-clock time (§4.2): it is armed when the player submits flag 2 and goes when they leave the server hall, unless they stop it there. That is why Zero Day sends a representative and Ghost is selling the head start on. The bunker's guards are the cells' people, and nobody told them why the door opened for 0x00: "They think you're here to steal their head start. You are."

He has costed it, as he costs everything. His projection, signed in his hand: 1,100–2,600 dead in the first month as hospitals, grids and dispatch centres are hit by people who never had the skill before. "An acceptable price for the last arms race." That is the escalated canon's true believer with a spreadsheet, and it is also a real argument about vulnerability disclosure, which is the educational spine of the finale (responsible disclosure vs hoarding vs full release).

Why this works for the season:
- It explains the four-site night as theatre for the theft (m08) without retconning m07's "he measured you" reading: both were true.
- It makes the m02 Ghost ("Not the money. The lesson") and the m04 disclosure call into the same argument the player now has with the man who started it.
- It gives Scorched Earth a real logic: destroy both copies and nobody holds the map, SAFETYNET included. (Nobody fixes anything either; §4.5.)
- It gives Join ENTROPY a real logic: a player who agrees with him can press the button.

### 1.3 Purpose of each mission

**m09 Digital Archaeology: the name and the way in.** The day after the leave is cut short, the player goes to Helena, Montana, to a commercial records archive that holds the bunker's deeds and construction file. It is also where the Insider Threat Initiative keeps its records, and where the Architect stored the papers of his two closed workshops, Tomb Alpha and Tomb Beta. The player digs through decommissioned records (paper stacks, a tape room, the archive's servers) to (1) confirm the Architect is Dr Adrian Tesseract, from his own hand; (2) find the Initiative's ledger of placements, which names a sleeper inside SAFETYNET; (3) get the plans of Tomb Gamma's defences; (4) learn the Publication's hour. On the way the player finds a flaw SAFETYNET catalogued nine years ago and never reported: one of the holes Critical Mass later came through at Albion (in the plant's control equipment). With it are Tesseract's memo from his last years as chief strategist, arguing it should go to the vendor, and the vendor notice he drafted and never sent. His case is partly true, and the player learns that before he makes it. The player can send the notice now, nine years late (optional; exported as `albion_notified`). It ends with Tesseract's first call to HaX, and the raid order.

The night has its own clock: Tesseract has ordered Helena burned before the Publication. Sorensen is shredding in the restricted cage and Jesse Tran is wiping tapes from the server closet. The purge moves on story events, not minutes, so being slow at the VM costs nothing. It is visible, and twice the player must save one of two things: at the cage (the other is gone when the cage opens) and at the end of the Recruiter's call (the other is wiped as the call ends). Stopping Sorensen or Tran afterwards saves only what is left on that side (§6.1). Nothing required is ever lost. The raid team is introduced at the m09 briefing, and the ledger tells every player that one of them is a plant.

Feel: investigation under a purge, dread, a building full of other people's secrets including the player's own. Light combat. The player's file is in the archive. About 75 minutes.

**m10 *Full Disclosure* (id `m10_full_disclosure`; the bunker is Tomb Gamma): the raid and the reckoning.** Task Force Null goes into the bunker the night before the Publication. The player's history decides which doors are already open, who is on the inside, who is waiting, and who turns. At the core they meet Tesseract in person, stop or allow the Publication, decide what happens to both copies of the database, and decide how it ends for him.

Feel: the season's biggest set piece, a siege in a Cold War bunker, with faces from earlier missions. Five full scenes run on every combination of choices, with different people by branch (§5.3): the door (Nightshade), the gallery (Victoria or her replacement), the power room (Voltage), the workshop (Gary or a technician) and the network (Ghost). A player who won a branch meets that person as an ally or a prisoner; one who lost meets them as an obstacle. The rest are presences, props and lines. A short whodunit runs through it: which of the raid team is the sleeper, WREN. Not hard: every route works with all defaults, and the carry-overs mostly add help. About 100 minutes (m07 ships at 90).

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
| 11 | m09: leave cut short when SAFETYNET intercepts Tesseract's order to burn Helena before the hour (the courier address or the tagged payments, by branch). Night operation at the Helena archive. Ends with the Publication hour: 06:00 UTC on day 13. |
| 12, night | m10: the raid on Tomb Gamma. The evening of day 12 in Montana; on the Citadel's clock, the early hours of day 13 (about 01:45–06:00 UTC), which is what every in-game screen shows. |
| After | Epilogue in each ending; then the teaser slot; then credits. |

Dispatch in eleven counties has been dropping calls since day nine for every player who finished m07 without covering Austin. That keeps running through both missions and is part of the stakes (§2, m07). A player who never played m07 gets m07's never-played canon (§3): Austin was covered and the dispatch line doesn't run.

### 1.6 Tone and difficulty

TV spy thriller, season finale. Violence at that level and brief: knock-outs, one lethal-force choice described in a line. No eldritch content anywhere, except the optional teaser (§7). Fun and educational, not hard: carry-overs add routes and help far more often than they add obstacles, and every obstacle a carry-over adds has an in-mission way round.

## 2. Thread allocation

One row per decision or thread from both inventories. **Pays off**: m09, m10, both, epilogue (the m10 debrief and closing beats), or dropped (with the reason). **Weight**: H / M / L, how much the player feels it. **Import** gives the name in the reading mission; a ✱ means the source mission must add it to `exportGlobals` first (§3.3), ✱✱ means that also needs an ink change, which goes to the user.

Three devices carry most of the payoffs, so the player meets their history as things happening, not a debrief roll-call:

- **The Reading** (m09). The Architect's own file on Agent 0x00 sits in the archive: his reading of the player, the thing he promised in m07 ("You'll have the figures too"). It is short: four entries at most, chosen by priority (m01 `final_choice`; the innocents line; m04 `disclosure_choice`; m07 `debrief_stance`), and a last page that predicts 0x00 will press the Publication's key (§1.2). Sorensen, bluffed or cornered, quotes one entry at the player aloud before they ever read it. Fixed strings, narrator voice or unvoiced.
- **Who is in the bunker** (m10). Five full scenes of two or three minutes run for every player, each on the main path, and each slot holds a different person by branch (§5.3): the door, the gallery, the power room, the workshop and the network. **Winning a branch puts a person in the room too**: a captured Voltage talks the player through his own plant, a protected Gary is SAFETYNET's consultant at the forward post, an arrested Nightshade is brought to the door in cuffs, an arrested Victoria bargains from custody on the line. The rest are presences (Mercer in the server hall), props (Reeves on the rota sheet, Hollis on the duty board) or lines. Every helper is named aloud as the player's doing at the moment it helps.
- **Tesseract's case, and the player's answers** (m10 confrontation). His opening uses three record lines at most, by priority (m04 disclosure, m01 final choice, m07 stance). The talk-down is three exchanges; under each of his claims the player may see up to two answers from their own record, so the player brings up their own history. Never a requirement.

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
| 13 | Ghost at large; `ghost_deal_accepted` + `exposed_hospital` (deal kept) | m10 | One of the five full scenes, for every player: Ghost rings the security office's handset (the same unplaceable voice as in m02) while selling on the cells' head start (§1.2), and the player can talk Ghost out of the sale. Deal kept: Ghost has already refused to sell, opens a side door ("You kept your word. I keep mine."), and asks one question, "Did the board ever thank you?", whose answer comes back in Ghost's epilogue message. Never played m02: Ghost is a stranger selling the head start, and the talk is harder but open. | H | `m02_ghost_deal_accepted`, `m02_exposed_hospital` |
| 14 | Deal broken (`ghost_deal_accepted`, not exposed) | m10 | Ghost locks that side door and says why: "We said we'd be watching." The sale goes ahead unless the player talks Ghost out of it, which is harder on this branch. The main route is unaffected. | H | same |
| 15 | `ghost_deal_refused` | m10 | Ghost offers the parley it promised in m02: "I hope it's you leading it." Ghost asks one question back, "You turned me down. Why?", and the player's answer decides what Ghost gives: the time of the core guard's change (a window past the outer lock) or one camera blind on the route, which the player can take or decline. Then Ghost leaves the network for good, and doesn't sell. | M | `m02_ghost_deal_refused` ✱ |
| 16 | `ghost_keys_used` | m10 | Ghost has been inside networks since St. Catherine's: one of Tomb Gamma's systems shows a Ghost signature, and HaX knows it from m02. Extra intel line, plus an obstacle (Ghost watches the player's route) if the deal was also broken. | M | `m02_ghost_keys_used` |
| 17 | `paid_ransom` | m09 | The ransom money surfaces in the archive's ledgers: St. Catherine's payment helped pay the bunker's refit. HaX reads the date. | M | `m02_paid_ransom` |
| 18 | `ward_recovering` | dropped | Derived from the three above; adds no new fact. | – | – |
| 19 | `bed4_manually_stabilised` / `patient_bed4_deceased` | m10 | A talk-down option the player can choose (not part of his opening, D-08). On a saved Pryce he answers: "You knelt by a stranger's bed and squeezed a bag for an hour. You don't believe in acceptable costs. That is your weakness." On deceased: "Six died at St. Catherine's. You chose the clean restore. You understand costing." One line, and it becomes a talk-down argument either way. | M | `m02_bed4_manually_stabilised`, `m02_patient_bed4_deceased` |
| 20 | `exposed_hospital` (on its own) | m10 | Disclosure is the finale's argument. A player who published the board's cover-up gets a talk-down option: "I told the truth when it cost. It fixed forty hospitals. Nobody died for it." | H | `m02_exposed_hospital` |
| 21 | Graham Reeves' fate | both | A prop, not a scene (D-01). At large (`escaped`, `missed`, `unnoticed`, with `m02_completed`): his name on Tomb Gamma's door rota in the tunnel guard post, marked "on leave tonight", and HaX: "Reeves. From the hospital. He's theirs full time now." In custody (`arrested`, `ko`, `flagged`): m09's papers hold his handler's contact sheet (HaX: "Reeves' handler, from the hospital"). Kept apart from Michael Reeves: no relation. | L | `m02_reeves_fate` ✱✱ (approved, F5; set in m02's debrief) |
| 22 | `insider_asset_arrested` / `insider_asset_escaped` | both | The read rule whenever `m02_reeves_fate == ""` and `m02_completed`, which is every m02 run finished before the ink change: escaped → on the rota; arrested → in custody; neither → absent. | L | `m02_insider_asset_arrested`, `m02_insider_asset_escaped` |
| 23 | `gary_protected` | both | m09, protected: Gary Whitlock, now a Director of Cyber Security, rings in because he recognises the archive's old tape library from a hospital he audited, and gives the decode hint for the tape room's code. m10, protected: the workshop's full scene with Gary on the player's side. He is SAFETYNET's consultant at the forward post, where he tells the player in person "You saved my career." He comes in behind the player to the workshop, recognises the PIN-cracker bench, and recognises the technician on the floor as someone he once trained; he asks the player to talk them round or take them in (the decision). m10, unprotected and quiet (and m02 played, and not exposed): the same slot, the other way round. Gary is a technician on Tomb Gamma's workshop floor, recruited by the Initiative. The player meets him in person; he can be talked into opening the power-room door ("Seven warnings, nobody listened. You're listening now?"). HaX's m02 line comes back on that branch. | H | `m02_gary_protected` ✱, `m02_exposed_hospital`, `m02_completed` |
| 24 | `kim_guilt_revealed`, `advised_board_pay/refuse` | dropped | Dr Kim's arc closed in m02; her epilogue is complete. No place in a bunker for her. | – | – |
| 25 | `accused_wrong_suspect` / `val_accused` | dropped | Covered by Reeves' "never caught" branch (#21), which is the consequence. | – | – |
| 26 | `patient_assaulted` | both | Folds into the Reading's innocents entry (row 6): "You struck a patient on a ward." In m10 it takes away the clean-record talk-down option. | L | `m02_patient_assaulted` ✱ |
| 27 | Staff KOs (Val, Gary, Kim, nurses, Bernie) | dropped | Rolled into the innocents line (#6) only through `patient_assaulted`; exporting six more names for one line is poor value. | – | – |
| 28 | `cover_burned` | dropped | Minor; the player is burned anyway by m08. | – | – |
| 29 | Supply chain: who makes the PIN crackers | m10 | Tomb Gamma's workshop floor has the bench where they are made (racks of them). The player, issued one in m09 for the first time since St. Catherine's (where they may have picked one up), sees where it came from. Nightshade's "I chose what you went in without" pays here. | M | none (every player) |
| 30 | Ransomware Incorporated status | m10 | Covered by Ghost (#13–16). Epilogue: Ghost "clean exit, no trace" again, unless the parley ran, in which case Ghost sends one last message. | L | as #13–16 |
| 31 | "Not the money. The lesson." / "They're not wrong about the problem." | m10 | Tesseract uses Ghost's own words; HaX, on the line, remembers saying the second one. The season's moral question is now the confrontation's. | M | none |

### 2.3 m03 Ghost in the Machine

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 32 | `victoria_fate = recruited` (turned Zero Day insider, never used) | both | m09: her first package (the Architect's comms protocols) is how SAFETYNET reads the archive's internal mail, an extra route to the restricted stacks. m10: one of the five full scenes. She is in the gallery as Zero Day's representative, there for the cells' head start. HaX's "whether she stays turned is anyone's guess" is answered by a choice the player makes in m10: she offers to open the core's outer lock. The server hall's schedule (flag 2) lists Zero Day's early-access order with her name on it. Confront her with it and she holds and opens the lock ("Then you know I'm hedging. So is everyone."). Trust her without checking and she sells the raid (an alarm and reinforcements, avoidable; HaX's doubt and a kept Nightshade's warning both come before the gallery). Refuse her and take the lock the long way. | H | `m03_victoria_fate` |
| 33 | `victoria_fate = escaped` | m10 | One of the five full scenes. She is in the gallery on the same errand. With `sterling_on_call_seen` (she made the threat in m03) she keeps it, "I said I'd do it myself. I still might": a stand-off, talk-down or KO. Without it she recognises the player, weighs it, and leaves. | H | `m03_victoria_fate`, `m03_sterling_on_call_seen` ✱ |
| 34 | `victoria_fate = arrested` | both | m09: her CPS case gives Netherton the legal cover for the raid; one Netherton line in the briefing. Her keys opened Zero Day's client database in m03, which is how the archive's company name was found. m10: the gallery's full scene, from custody. Victoria rings the player on a secure line before the gallery and offers to name the broker who took her desk, and his weakness, for a charge reduced. The player chooses to deal or not; either way she is right about him. | M | `m03_victoria_fate` |
| 35 | `victoria_fate = ko` | both | m09: she says nothing (as m03 told the player); the company name comes from her seized devices. m10: the gallery holds Zero Day's new broker, Pieter Vos, the man who filled her desk "by Monday" (row 42). He knows who put her in a hospital bed. | L | same |
| 36 | `danny_fate` / `danny_ko` | m09 | Protected or exposed: his survey methods match a document in the archive; HaX: "Danny's statement just became evidence." Left: the archive holds Zero Day's note on him ("loose end, resolved"); HaX checks; he is alive, hiding, and she says so with relief. KO / never found: no line. Protected, when Victoria is recruited or escaped: Danny was told Sterling would answer for it, and she hasn't; HaX: "Danny asked again last week. I didn't have an answer. Tonight I might." | L | `m03_danny_fate`, `m03_danny_ko` |
| 37 | `directive_decoded` | m09 | The Architect's annotation style is recognisable to a player who decoded the Phase 2 directive themselves; HaX: "You've read his hand before. Sterling's drive." Extra line in the identity scene. | L | `m03_directive_decoded` |
| 38 | `guard_bribed` (Terry Mott's £500) | m10 | Finance's query about the £500 reaches HaX mid-raid, at a quiet moment. One line of relief. | L | `m03_guard_bribed` |
| 39 | `guard_told_safetynet`, Terry and Ffion KOs | dropped | Minor; the Reading already lists innocents through m01/m02 values. Five more exports for one line is poor value. | – | – |
| 40 | `named_target_selection`, `defended_danny`, `called_it_murder`, `handler_trust` | dropped | Small stance flags inside m03's own scenes; no finale scene would read differently. | – | – |
| 41 | "St. Catherine's was a proof of concept. You'll see the rest." | m10 | Victoria on the escaped branch repeats it at the bunker: "This is the rest." | L | (row 33) |
| 42 | "I'm a desk. They'll have it filled by Monday." (Zero Day survives; 0day untouched) | both | The desk was filled: Pieter Vos is Zero Day's representative in the gallery whenever Victoria isn't (arrested, KO'd, or never met). Zero Day's status in the closing card; 0day stays unmet (a Season 2 thread). | L | via `m03_victoria_fate` |
| 43 | "When do we go at the Architect directly?" | m09 | HaX answers it in the m09 briefing: "Now." | M | none |

### 2.4 m04 Critical Failure

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 44 | `voltage_captured` (interrogation never shown) | both | m09: a card on Task Force Null's wall (row 57). m10: Voltage wanted someone to check his sums. SAFETYNET did, and he gave the bunker's power layout. He is brought to the forward post under guard: the power room's full scene, with Voltage on the player's side, checking his own sums live ("You checked them. Now check this."). He asks to be walked to his own switchgear under Quintero's guard; the player takes him (a faster cut, and he asks one thing for the inquiry) or keeps him in the power room's phone slot, ahead of Vance. An extra route through the plant. | H | `m04_voltage_captured` |
| 45 | `voltage_escaped` | m10 | One of the five full scenes. Voltage runs Tomb Gamma's power room. The player meets him at the switchgear. If his print was lifted at Albion, the player can prove the bypass was his and he stands down ("It'll be waiting." It was.). Otherwise a fight or a talk. | H | `m04_voltage_escaped`, `m04_voltage_print_on_bypass` ✱ |
| 46 | `static_left` / `static_left_alone` | m10 | `static_left and not static_left_alone` (left with Voltage): Static is beside him in the power room, one more hostile. `static_left_alone` (Voltage was taken, Static slipped out): Static is a line instead, his kit on the plant-room bench and HaX: "Static got out of Albion on his own. That's his." | L | `m04_static_left` ✱, `m04_static_left_alone` ✱ |
| 47 | `casualties_occurred` / `crew_lost` | m10 | Tesseract has read the Albion inquiry; on `crew_lost` the nine crew are a line in his ledger, and he reads the count back if the player argues from Albion in the talk-down. A harder conversation, not a harder level. | M | `m04_crew_lost`, `m04_casualties_occurred` |
| 48 | `disclosure_choice` (full / partial / quiet) | both | The finale's argument. m09: the Reading's third entry, and a wall card. The flaw the player finds catalogued and never reported is Albion's (§1.3), so this choice lands twice. m10: first priority in Tesseract's case. Full: "You told them the truth, and they audited every site. That was my lesson, delivered by you." It becomes the player's strongest talk-down option ("And nobody died for it"). Partial: "You told them half. Half is how we got here." Quiet: "You buried it. You understand me better than you admit." | H | `m04_disclosure_choice` |
| 49 | `crew_warned` | dropped | Implied by #47; no extra export. | – | – |
| 50 | `vance_is_ally` | m10 | The power room has one phone-expert slot (one non-HaX voice per room): Voltage if captured and kept on the phone (row 44), else Vance if an ally, else Elena Rodriguez if turned (row 90), else HaX. Vance talks the player through the old Cold War switchgear in his own Teesside voice. | M | `m04_vance_is_ally` ✱ |
| 51 | `robert_vance_ko` | m10 | HaX: "I rang Vance. He said no. He said you'd know why." | L | `m04_robert_vance_ko` ✱ |
| 52 | `promised_voltage_alive` | dropped | Only bites if Voltage then died, which can't happen in m04. | – | – |
| 53 | `voltage_print_on_bypass` | m10 | See #45. | M | ✱ |
| 54 | `cipher_walked`, operatives defeated | dropped | Minor operatives; no slot in the bunker that wouldn't be clutter. | – | – |
| 55 | Calder Wharf, Social Fabric's safehouse | m09 | Cold open of the m09 briefing: Task Force Null finally raided it on day ten. Found by the player in m04: "Your card from Albion. We went in yesterday." It is where the Helena archive's courier address came from. Not found: "Somebody cleaned Calder Wharf out a week ago." Either way the Helena lead comes from elsewhere too (§1.4). | M | `m04_lore_safehouse_address_found` ✱ |
| 56 | "Six cities" | dropped | Paid off by m07. | – | – |
| 57 | Task Force Null | both | m09's briefing (a cutscene) is held in Task Force Null's room, and it is the "previously on". The wall: one card per earlier mission, in the player's own outcomes, with a never-played version of each card that states the canon in one sentence; Netherton or HaX walks along it in about sixty seconds, with a "who is Tesseract" beat for a player who never saw m06–m08 (former chief strategist, HaX's teacher, walked out seven years ago). The m07 decode's "-- A." at the top. The raid team is in the room. m10 is Task Force Null's operation. | M | the wall's imports in §3.1 (m01 `final_choice`, m02 `exposed_hospital` and `ghost_deal_accepted`, m03 `victoria_fate`, m04 `voltage_captured`/`voltage_escaped` and `disclosure_choice`, m05 `final_choice`, m06 `monitoring_enabled`, m07 `team_assignment`, m08 Nightshade's fate) |
| 58 | "Above him it stops being a person you can arrest" | m10 | Answered in the ending choice: arrest, surrender, or lethal force. On `voltage_captured`, HaX quotes it before the core door. | M | none |
| 59 | Disclosure fallout (inquest, Parliament) | epilogue | One line in the closing card. Full: the funding question finally answered. Partial with `crew_lost`: "The inquest heard the rest." Partial without: the half-statement, and the audits it never triggered. Quiet: no line. | L | `m04_disclosure_choice` |

### 2.5 m05 Insider Trading

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 60 | The Recruiter (free, "the next one might cost me more") | m09 | m09's ENTROPY cell is hers: the Helena archive is the Insider Threat Initiative's records office. She rings the player's handset in m09 (phone only, as in m05) once they are inside her stacks. She rings after flag 2, so the player already knows from the ledger that WREN is on the team. Every player gets the call, and **every player gets her offer**: WREN's name, now, if the player lets her file be wiped. Her file is a tape on the deck Tran's wipe reaches as the call ends, and it holds her handler list, which HaX names before the player answers: by m05's outcome, the handlers for the twenty-three placements; on `public_exposure` (the twenty-three were blown in m05) her handlers and the forty-seven; on `turn_double_agent` the names Torres couldn't give. The offer and the second purge choice are one decision (§6.1): the deck also holds Tomb Alpha's tapes, and the player can pull only one. Take the offer: the name comes cheap (`sleeper_named`, always right; trusting her is never a trap), the player pulls the Alpha tapes, her file is wiped, and she walks free into a later season. Refuse: pull her file (she is named and her network rolled up) or the Alpha tapes (she stays at large), and do the cross-reference the long way. Double-cross (take the name, then pull her file anyway): the name and the file, but she warns the handlers she can reach, and only part of the network is rolled up ("Twelve. She warned the rest."), with one line from her in the epilogue: "I'll remember the shape of you." What else she says depends on #61–62. | H | none for presence; m09 exports `recruiter_offer` |
| 61 | `recruiter_deal_accepted` + `recruiter_deal_confessed` | m09 | Sold and lied: she opens with the receipt ("Forty-seven names, and nothing points at you. Does your handler know?"), and HaX is on the line. The player chooses there and then to tell HaX or hang up; HaX's response follows (exported to m10 as `recruiter_secret`). Sold and confessed: HaX cuts in first: "We've talked about that. She has nothing on you." The Recruiter's leverage dies on the line, and she goes straight to the offer. | H | `m05_recruiter_deal_accepted`, `m05_recruiter_deal_confessed` ✱ |
| 62 | `found_pipeline_list` | both | The list reached SAFETYNET only when the player found it and kept it from her: `found_pipeline_list and not recruiter_deal_accepted`. Then SAFETYNET warned the forty-seven candidates; one of them, Noor Haddad (§5.2), works in the archive and helps the player (a door, a warning about Sorensen) because SAFETYNET reached her first. Found, sold and confessed (`found_pipeline_list and recruiter_deal_accepted and recruiter_deal_confessed`): the list went in late ("some of those forty-seven will already have signed"), so Noor was warned only last week and gives the warning but not the door. Otherwise she is a wary bystander, and the player can tell her she is on the list. m10: the epilogue says how many of the forty-seven were reached, by the same two conditions. | M | `m05_found_pipeline_list` ✱, `m05_recruiter_deal_accepted`, `m05_recruiter_deal_confessed` ✱ |
| 63 | The forty-seven candidates / twenty-three placements | m09 | The Initiative's ledger (VM flag 2) holds the twenty-three placements, the forty-seven candidates, and an older section of legacy placements the m05 lists never held. By m05's outcome: on `public_exposure` the twenty-three are marked "blown"; on `turn_double_agent` Torres' own entry still reads as a live placement, because the Initiative doesn't know he is turned. One legacy entry, under the ledger codename WREN, is on Task Force Null's raid team (the sleeper, row 117). The m05 thread and the m08 thread become one document. | H | none |
| 64 | `final_choice` (Torres) / `torres_turned` | m09 | Turned: Torres' Initiative intelligence named the Helena archive's cover company months ago; nobody connected it until now. HaX: "Torres gave us this address in the spring. It was a line in a list." Torres himself rings in from his desk, still in place inside the Initiative, when the player reaches the ledger: he knows the legacy section's filing scheme (one step off the cross-reference) and says one thing only he would know about the forty-seven ("They pick people with someone to lose. Look for the ones with a sick parent."). Dead (`combat_lethal`): his name is in the ledger as a "closed placement", in Sorensen's hand, and HaX goes quiet for a moment; the player does the cross-reference the full way (no harder, one more read). | M | `m05_final_choice`, `m05_torres_turned` |
| 64a | m05 `final_choice` = `arrest` / `combat_nonlethal` / `public_exposure` | m09 | His ledger entry reads "lost", in Sorensen's hand; no line. | L | `m05_final_choice` |
| 65 | `elena_treatment_funded` | epilogue | One line in the closing card: Elena Torres' treatment. | L | `m05_elena_treatment_funded` |
| 66 | `entropy_program_exposed` / Netherton's two o'clock / "we'll be watching for their reply" | m10 | The reply arrives: on exposure, the bunker's media room (Social Fabric) has a story ready naming SAFETYNET and the player's designation, set to run at the Publication. Stopping it is an optional objective. | M | `m05_entropy_program_exposed` |
| 67 | `torres_arrested`, `torres_called_in` | dropped | Covered by `final_choice`. | – | – |
| 68 | `halloran_accused` | dropped (round 1) | The Reading is capped at four entries (D-06); the export addition is withdrawn with it. | – | – |
| 69 | `confront_stance`, `handler_trust`, staff KOs | dropped | Stance and a numeric trust score in one mission only; no finale scene reads differently. | – | – |

### 2.6 m06 Follow the Money

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 70 | `architect_identity_found` (read the 87% file) | m09 | Two first lines for the same reveal; the proof is the same. Safe opened: HaX said the name in the m06 debrief as Satoshi's 87% guess; now she says it again with proof in hand, as fact for the first time, and it costs her. Netherton says the name in the same scene (row 125). Safe shut: the player hears the name for the first time, and HaX admits she has known since m06. With `m07_teacher_discussed` she adds that "keep it out of your notes" (m07) was her hiding it from them. | H | `m06_architect_identity_found`, `m07_teacher_discussed` ✱✱ |
| 71 | `monitoring_enabled` (fund watched) | m09 | The tagged payments are an object at the drop terminal: the player follows one tagged line from the fund to Tomb Beta's lease. HaX: "Your tags, from HashChain." On the no-coordinate route this alone finds the bunker. | M | `m06_monitoring_enabled` |
| 72 | `assets_seized` (fund frozen) | m10 | The Architect is short of money: Tomb Gamma is under-staffed, two guard posts are empty, the refit is unfinished (a gap in the fence). HaX says why the moment the player reaches the fence: "Two posts empty. That's your freeze. He couldn't make payroll." A "posts unmanned: budget" memo sits on the duty board. Tesseract, later: "You froze my bank. I had to economise on guards. I expect you noticed." | M | `m06_assets_seized` |
| 73 | `asset_decision_deferred` / never decided | m10 | Neutral: a fully staffed bunker (the default). | L | (default) |
| 74 | `irina_recruited` | m09 | Her condition "what I give you gets used, not buried" is honoured on screen: the account that paid her is the account that pays the archive's lease. HaX: "Irina's account. We're using it, tell her." | M | `m06_irina_recruited` |
| 75 | `irina_arrested` | dropped | No lead; the default line covers it. | – | – |
| 76 | `satoshi_stance` (`wondered`) | m10 | Tesseract: "You told a man in handcuffs that you sometimes wonder whether we're right. I liked that." It opens the Join offer more warmly for that player; signposting unchanged. `rejected`: "You told him no without thinking. Think now." | M | `m06_satoshi_stance` ✱ |
| 77 | `minder_walked` (Kemal Aydin at large) | m09 | A line, not a phone scene (D-17): HaX names the tip that confirmed Helena as Kemal's, the minder who walked out over the casualty figure. Default: an anonymous tip. | L | `m06_minder_walked` ✱ |
| 78 | `irina_ko`, `satoshi_ko`, `cover_strained`, `console_tripped`, staff KOs, `analyst_told` | dropped | Small m06-local consequences already paid in m06's debrief; none changes a finale scene. | – | – |
| 79 | "The Architect keeps spares" | m10 | The bunker's second bank: a ledger showing the reserve that funds the Publication's servers. Freeze (#72) means it's nearly empty. On Scorched Earth the line turns: his spare is his memory ("He's one man with a memory now, not a map.", §4.6). | L | none |
| 80 | The $12.8M wallet (freeze) | epilogue | One line: Netherton returns it to the victims' fund, or the Council keeps it. | L | `m06_assets_seized` |

### 2.7 m07 The Architect's Gambit

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 81 | `team_assignment = trojan_horse and not team_redirected` (Austin covered, direct; the redirect also sets `trojan_horse`, so it must be excluded) | both | Dispatch still answering (m09 briefing line). In m10 the Publication cannot ride the Trojan Horse backdoor: Tesseract has to push it through his own servers, so the core has one fewer release channel and the cost of a partial release is smaller (§4.2). Tesseract: "You took Austin from me. I had to do this the slow way." | H | `m07_team_assignment` |
| 82 | `team_redirected` (Austin at 30%; `team_assignment` reads `trojan_horse` too) | both | Dispatch saved; 14 million systems still backdoored. In m10 the backdoor is a small live release channel the player can close (one optional console task, not a gate on completion). | M | `m07_team_redirected`, `m07_team_assignment` |
| 83 | Any other team / none (Austin uncovered), **with `m07_completed`** (`""` is also the never-played default; B1) | both | Dispatch in eleven counties has been dropping calls since day nine: a ticking line in each briefing ("Day eleven. Eleven counties."). In m10 the backdoor in 47 million systems is the Publication's fastest channel. HaX gives a count once. | H | `m07_team_assignment` |
| 84 | Fracture uncovered, with `m07_completed` | m10 | Social Fabric holds 43 states' voter records and its story machine; in the bunker it runs the media room. When the raid starts, a fake story about a SAFETYNET "massacre in Montana" begins to run; the player can kill it in the media room (optional), and the epilogue says whether it ran. Fracture covered, or m07 never played: the media room is dark, and on its desk is the same story drafted and never run, with the player's photo on it. | M | `m07_team_assignment`, `m07_completed` |
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
| 97 | `architect_echo_heard` | both | m09: in the identity scene, HaX: "You heard him say it. My line. His line." m10: the line finished (#120). | H | `m07_architect_echo_heard` |
| 98 | `teacher_discussed` (HaX already told this player) | m09 | The m09 opening branches on this and `m06_architect_identity_found` together. Both: "I told you on the handset he taught me", and she goes further, faster. Teacher discussed without the m06 file: "I told you somebody taught me that line. I didn't say who." Neither: she starts further back. Runs finished before the ink change read `false` (A22). | M | `m07_teacher_discussed` ✱✱ (approved, F5: local ink VAR → scenario global) |
| 99 | `debrief_stance` (defended / owned / refused / hardened) | both | m09: the Reading's fourth entry, quoting the player's words back. m10: third priority in Tesseract's case: "'I'd make it again.' You would. I counted on it." / "You said it was yours. You'll carry this too." (worded to fit both of m07's `owned` lines) / "'Don't ask me to rank them.' I ranked them for you." Hardened: m07 said only that Netherton would take it to the Council; in m10 Netherton tells the player the Council said yes ("You asked for the numbers. You have them."), and a projection desk on the forward post shows the Publication's casualty curve live, which the player can show Tesseract as an argument. | M | `m07_debrief_stance` ✱ |
| 100 | The two dead agents | m09 | Named on Task Force Null's wall in the m09 briefing; Netherton reads both names before the Montana go order at the end of m09. Every player has the same two. | M | none |
| 101 | The Architect's "figures" / reading of the player | both | The Reading (§2 intro): four entries and the prediction. m10: "Your file says I press it. Watch me." is a talk-down option on `m09_reading_finished`, and after "Stop it" he answers it himself: "Then I was wrong about one thing." | H | rows 1, 6, 48, 99 |
| 102 | Netherton's Council meeting (`hardened`) | m10 | See #99. | L | (row 99) |
| 103 | Off-screen leaders: Michael Reeves, Jennifer Walsh, Marcus Ashford | epilogue | Named once in the closing card's cell status, by whether their site was covered (with `m07_completed`; a player who never played m07 gets the never-played card, §3). They don't appear: three new faces in the last hour is clutter, and Season 2 needs someone left. | L | `m07_team_assignment` |

### 2.8 m08 The Mole

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 104 | `nightshade_triple_agent` / `triple_agent_first_payment` | both | m09: he is a voice on the player's phone, competing with HaX, from a SAFETYNET room; he names which database entries guard the archive's restricted stacks and is right. m10: the door slot's full scene, at the forward post. He pays the first payment in full: each of Tomb Gamma's defences named with the database entry it came from. One entry is wrong. Was he lied to, or lying? m09's choice (#106) decides which way he tips the board. | H | `m08_nightshade_triple_agent` ✱, `m08_triple_agent_first_payment` ✱ |
| 105 | "For exactly as long as it suits me" | m10 | Shown his own recruitment file in m09: he learns Tesseract wrote off his life as a line item, and he tips the board on the Architect: the wrong entry was Tesseract's lie, and he gives the player the override he was saving. Not shown: he tips it on SAFETYNET, one door locks and the sleeper is warned. An in-mission way round exists either way. | H | `m09_nightshade_shown_file` (m09's own export) |
| 106 | Nightshade's recruitment file, fifteen years ago | m09 | In the archive. Written in Tesseract's hand while he was SAFETYNET's chief strategist and Nightshade was 23 in his intake. This is the hard proof (with VM flag 3) that the teacher recruited him, "the man who put me here". On the triple-agent branch the player chooses whether to send it to him. | H | none (the find), `m09_nightshade_shown_file` (the choice) |
| 107 | `nightshade_arrested`, `nightshade_ko_before_fate`, or m08 never played | both | m09: Netherton visited him once and came back with nothing: "He said you'd know where to find him. He meant the door." m10: the door's full scene with Nightshade in cuffs. He is brought to the forward post, as he asked, and offers the defences for a deal (a reduced sentence). The player chooses: take the deal, and he names the entries with one wrong, as on the triple-agent branch; or refuse, and the defences are learned the long way (the m09 plans). He also knows WREN's codename habits, one step off the whodunit if dealt with. Silent handover or never played: he sits in the van and says one word, "Door", and nothing else; a scene in a line. HaX's visit in the epilogue on the arrested branch. | M | `m08_nightshade_arrested` ✱, `m08_nightshade_ko_before_fate` ✱ |
| 108 | `nightshade_ko_before_fate` / `tomb_gamma_location_known` false | m09 | The archive holds the deed: m09 finds the bunker for this player. The briefing adds one line ("We have Helena. Not the bunker. Not yet.") and the deed becomes a task. On every other route the deed confirms what the player already has. | M | `m08_nightshade_ko_before_fate` ✱, `m08_tomb_gamma_location_known` ✱ |
| 109 | m08 `debrief_stance` (defended / owned Netherton's sealed warning) | m09 | Owned: Netherton signs the Montana order with his own name beside Nightshade's on the file, in front of the player. Defended: he carries it quietly; one line where he thanks the player and doesn't say for what. | M | `m08_debrief_stance` ✱ |
| 110 | `netherton_ko` / `netherton_hostile` | m09 | One line in the briefing, never played for laughs: "Before we start. My jaw is fine. I'm not asking for an apology." | L | `m08_netherton_ko` ✱, `m08_netherton_hostile` ✱ |
| 111 | `hax_ko` | m09 | "You put me on the floor at the Citadel. I'm still running you." Then she gets on with it. | M | `m08_hax_ko` ✱ |
| 112 | `accused_vector` / `accused_phantom` / apologised / hostile | m10 | With `m08_completed` (every one of these defaults to `false`, so the default would otherwise put them on the team; B2), not accused, or apologised to, and not hit: they join the raid team, which also puts them on the whodunit's suspect list (row 117). Phantom (who ran his own mole hunt) brings his "list", his own sleeper suspects, which narrows it; Vector brings the crypto annex's kit and opens one sealed door. Accused and not apologised, or hit: they decline, and Netherton says why in one line. | M | `m08_accused_vector` ✱ … (six names) |
| 113 | `nightshade_tipped_off` / `nightshade_tidied` | m09 | What he cleared from his locker is in the archive: the copy he sent ahead. HaX: "So that's what he had time to clear." A small, satisfying find. | L | `m08_nightshade_tidied` ✱ |
| 114 | `suspect_theory`, `named_on_evidence`, `named_by_hax`, `audit_*` | dropped (round 1) | The Reading is capped at four entries (D-06); both export additions are withdrawn. How the player catches a mole is tested again, in play, by m10's whodunit. | – | – |
| 115 | Floor KOs (off-duty agent, analyst, ATHENA), print/card | dropped | m08-local; the innocents line (#6) covers the type. | – | – |
| 116 | `go_bag_lining_known` (Helena ticket) | m09 | Every player hears it, as fact SAFETYNET found in his effects: Helena was his waypoint. No import needed. | M | none |
| 117 | Other sleepers ("there may be others") | both | **A whodunit the player knows about.** m09: the raid team is in the briefing room (Quintero, Kowalczyk, Malhotra, Arakawa; §5.2). Kowalczyk hands over the PIN cracker and is easy to like. The ledger (flag 2) is live, kept by Sorensen: WREN's legacy entry was updated on day 10, "assigned TF Null, Montana operation", which tells every player that one of the team is a plant and that the Initiative knows about the raid. WREN came to SAFETYNET eleven years ago as a lateral hire through Harwick & Lowe, an executive search firm long since closed. Nothing tied that firm to the Initiative until this ledger, and she was never in Tesseract's intake, which is why the screening after m08 missed her. The player can name WREN in m09 (the cross-reference, or the Recruiter's offer: `m09_sleeper_named`). Netherton keeps the team together on purpose: "If I bench four agents tonight, WREN knows we know. They come. You watch them." m10: §4.4's three-clue whodunit, with a visible, recoverable cost for a wrong accusation. Already named in m09: she is detained at the briefing. | H | `m09_sleeper_named`, `m08_nightshade_triple_agent` ✱, `m08_nightshade_arrested` ✱, Phantom (#112) |
| 118 | The PIN cracker | both | Issued to the player in m09 for the first time since St. Catherine's ("The long way is over," HaX). Used in both missions. m10's workshop is where they're made (#29). | M | none |
| 119 | The player is burned | m10 | Tomb Gamma expects Agent 0x00: their photo on the security office wall; the blast door is keyed to open for them by name. Tesseract wants them at the console (§1.2); the cells' guards were never told why, and fight them anyway. | M | none |
| 120 | "Let it hurt afterwards, not during" (HaX, the Architect, Nightshade) | m10 | Tesseract starts the line in the confrontation. The player can finish it, or say what HaX actually does with it (which HaX tells the player in m09). One choice that answers three missions; it is also a talk-down argument. | H | `m07_architect_echo_heard` (for the extra recognition beat) |
| 121 | Vector's annex, Phantom's Zurich list | m10 | Phantom's list pays in #117. Vector's annex badge opens a sealed door in #112. Both small. | L | (row 112) |
| 122 | Dr S. Okafor | dropped | Vindicated in m08. A line from her would add a fifth Okafor/Okonkwo name risk for little. | – | – |
| 123 | Marcus Tesseract (Adrian's brother) | dropped | Brief rule: nothing may depend on his institute. A brother with no institute would need new backstory to matter, and the finale has enough people. | – | – |
| 124 | Netherton's culpability | m09 | See #109. | M | (row 109) |
| 125 | Netherton's pledge, "We will not say one aloud until we can prove it" (an optional m08 hub topic; nothing records who heard it) | m09 | Every player: when flag 3 and the handwriting come together, Netherton (on the line from the Citadel) says the name aloud for the first time, in words that work whether or not the player heard the pledge: "I said we wouldn't name him until we could prove it. We can. Dr Adrian Tesseract." New to one player, a promise kept to another. | M | none |

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
| m02 | Ghost was never caught; the hospital recovered. | Ghost on the network as a stranger; the workshop's default technician; no Reeves. |
| m03 | Zero Day's London broker was never identified, and Zero Day kept trading. | Pieter Vos in the gallery. |
| m04 | Voltage disappeared after Albion. | A plant technician at the switchgear; HaX in the phone slot. |
| m05 | Torres was arrested. | His ledger entry reads "lost". |
| m06 | The fund was found, then lost. | Full staffing at Tomb Gamma. |
| m07 | One team, four sites. Austin was reached in time; two of ours died at the others. (Matches m08's own never-played line, "one team to send".) | No dispatch line, no backdoor channel. The media room is dark for a different reason: Social Fabric kept its crew at home, and the story sits drafted and held on the desk. The closing card's cell lines read as if Austin was covered and the other sites were not. |
| m08 | The mole is in custody and saying nothing. | Nightshade in the van at the forward post: "Door." |
| m09 (for m10) | The name proved, the hour found, one of the team is WREN. | m10's cold-start briefing (§4.0). |

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
| `m08_nightshade_arrested` ✱ | m08_the_mole | `nightshade_arrested` | `false` | L+: Netherton's visit; which briefing opening plays | 107 |
| `m08_nightshade_ko_before_fate` ✱ | m08_the_mole | `nightshade_ko_before_fate` | `false` | L+: the briefing's "Not the bunker. Not yet."; replaces HaX's "Same classroom" opening | 108 |
| `m08_tomb_gamma_location_known` ✱ | m08_the_mole | `tomb_gamma_location_known` | `false` | L+: how the deed and the briefing are framed. The no-coordinate branch is `m08_completed and not m08_tomb_gamma_location_known`; a player who never played m08 gets the neutral framing | 108 |
| `m05_recruiter_deal_accepted` | m05_insider_trading | `recruiter_deal_accepted` | `false` | L+: how the Recruiter's call opens; the tell-or-hang-up choice | 61 |
| `m05_recruiter_deal_confessed` ✱ | m05_insider_trading | `recruiter_deal_confessed` | `false` | L+: HaX cuts in first; Noor's late warning | 61, 62 |
| `m05_found_pipeline_list` ✱ | m05_insider_trading | `found_pipeline_list` | `false` | H: Noor Haddad helps, on `found_pipeline_list and not recruiter_deal_accepted` (smaller help when confessed) | 62 |
| `m05_torres_turned` | m05_insider_trading | `torres_turned` | `false` | H: Torres rings in from his desk, still in place; one step off the WREN cross-reference | 64 |
| `m05_final_choice` | m05_insider_trading | `final_choice` | `""` | Prop: his ledger entry, "closed placement" or "lost", in Sorensen's hand; wall card | 57, 64, 64a |
| `m03_victoria_fate` | m03_ghost_in_the_machine | `victoria_fate` | `""` | R on `recruited` (her comms protocols read the archive's internal mail: a second way to the restricted stacks); L on `arrested` / `ko`; wall card | 32, 34, 35, 57 |
| `m02_gary_protected` ✱ | m02_ransomed_trust | `gary_protected` | `false` | H: Gary rings with the tape room's decode hint | 23 |
| `m01_maya_ko` ✱ | m01_first_contact | `maya_ko` | `false` | O: Tran is a surprise and calls in an extra guard (avoidable). When false, HaX warns the player about him first | 6 |
| `m06_monitoring_enabled` | m06_follow_the_money | `monitoring_enabled` | `false` | H: the tagged payments, an object at the drop terminal; on the no-coordinate route they point at the bunker before the deed does; wall card | 57, 71 |
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
| `m02_paid_ransom` | m02_ransomed_trust | `paid_ransom` | `false` | L: the ransom in the refit ledger | 17 |
| `m03_danny_fate` | m03_ghost_in_the_machine | `danny_fate` | `""` | L | 36 |
| `m03_danny_ko` | m03_ghost_in_the_machine | `danny_ko` | `false` | L | 36 |
| `m03_directive_decoded` | m03_ghost_in_the_machine | `directive_decoded` | `false` | L: identity scene | 37 |
| `m04_disclosure_choice` | m04_critical_failure | `disclosure_choice` | `""` | L: the Reading's third entry; wall card; HaX on the Albion flaw | 48, 57 |
| `m04_voltage_captured` | m04_critical_failure | `voltage_captured` | `false` | L: wall card | 44, 57 |
| `m04_voltage_escaped` | m04_critical_failure | `voltage_escaped` | `false` | L: wall card | 57 |
| `m04_lore_safehouse_address_found` ✱ | m04_critical_failure | `lore_safehouse_address_found` | `false` | L: briefing cold open | 55 |
| `m06_irina_recruited` | m06_follow_the_money | `irina_recruited` | `false` | L | 74 |
| `m06_minder_walked` ✱ | m06_follow_the_money | `minder_walked` | `false` | L: whose tip confirmed Helena | 77 |
| `m07_team_assignment` | m07_architects_gambit | `team_assignment` | `""` | L: the dispatch count (with `m07_completed`); wall card | 57, 81, 83, 85 |
| `m07_team_redirected` | m07_architects_gambit | `team_redirected` | `false` | L | 82 |
| `m07_debrief_stance` ✱ | m07_architects_gambit | `debrief_stance` | `""` | L: the Reading's fourth entry | 99 |
| `m07_found_tomb_gamma` ✱ | m07_architects_gambit | `found_tomb_gamma` | `false` | L | 95 |
| `m08_debrief_stance` ✱ | m08_the_mole | `debrief_stance` | `""` | L: Netherton at the Montana order | 109 |
| `m08_netherton_ko` ✱ | m08_the_mole | `netherton_ko` | `false` | L | 110 |
| `m08_netherton_hostile` ✱ | m08_the_mole | `netherton_hostile` | `false` | L | 110 |
| `m08_hax_ko` ✱ | m08_the_mole | `hax_ko` | `false` | L | 111 |

**Tier 3, cut** (with reasons): `m01_kevin_choice`, `m01_found_casualty_projections`, `m05_halloran_accused`, `m08_named_on_evidence`, `m08_suspect_theory`. All five existed only as entries in the Reading, which is now capped at four (D-06). The last three were ✱ and are withdrawn from §3.3.

43 variables plus eight `completed` imports. The deed to Tomb Gamma is a task for every player (it is also the paper half of the defence plans), so the no-coordinate route changes the briefing and HaX's emphasis, never what the player must do.

Task Force Null's wall in the briefing (row 57) is one object per earlier mission. Each card has a played version on the imports above and a never-played version that states the canon in one sentence.

### 3.2 m10 `importGlobals`

**Tier 1** (37 variables): the five full scenes, the whodunit, every presence, prop, helper and obstacle

| Alias | From | Var | Default | Use | Rows (§2) |
|---|---|---|---|---|---|
| `m08_nightshade_triple_agent` ✱ | m08_the_mole | `nightshade_triple_agent` | `false` | P + H: Nightshade in the door slot at the forward post (full scene); skips one whodunit step | 104, 117 |
| `m09_nightshade_shown_file` | m09_digital_archaeology | `nightshade_shown_file` | `false` | H (shown: the override) / O (not shown, on the triple-agent branch: one door locks and the sleeper is warned; the security office opens it) | 105 |
| `m09_sleeper_named` | m09_digital_archaeology | `sleeper_named` | `false` | H: the sleeper is detained at the briefing | 117 |
| `m03_victoria_fate` | m03_ghost_in_the_machine | `victoria_fate` | `""` | P: the gallery's full scene: Victoria in person (recruited: the trust choice; escaped), on the line from custody (arrested: the deal), or Pieter Vos (ko, or never played) | 32–35, 42 |
| `m04_voltage_captured` | m04_critical_failure | `voltage_captured` | `false` | P + H: Voltage at the forward post, then walked to his switchgear or kept in the power room's phone slot (the player's choice); R: a route through the power room | 44 |
| `m04_voltage_escaped` | m04_critical_failure | `voltage_escaped` | `false` | P: Voltage at the switchgear (full scene) | 45 |
| `m04_voltage_print_on_bypass` ✱ | m04_critical_failure | `voltage_print_on_bypass` | `false` | H: the proof that makes him stand down | 45, 53 |
| `m02_ghost_deal_accepted` | m02_ransomed_trust | `ghost_deal_accepted` | `false` | R (kept: Ghost opens the side door) / O (broken: Ghost locks it; main route unaffected) | 13, 14 |
| `m02_exposed_hospital` | m02_ransomed_trust | `exposed_hospital` | `false` | R with the above; talk-down option | 13, 20 |
| `m02_ghost_deal_refused` ✱ | m02_ransomed_trust | `ghost_deal_refused` | `false` | R: Ghost's parley gives the guard change, a window past the outer lock; Ghost doesn't sell | 15 |
| `m02_ghost_keys_used` | m02_ransomed_trust | `ghost_keys_used` | `false` | O when the deal was also broken: Ghost watches the player's route (a camera alert that the security office can blind) | 16 |
| `m02_gary_protected` ✱ | m02_ransomed_trust | `gary_protected` | `false` | P + H: the workshop's full scene, both ways (with `m02_completed`): protected, Gary is SAFETYNET's consultant at the forward post and on comms at the bench; unprotected and not `m02_exposed_hospital`, he is the technician on the floor and, talked round, opens the plant-room door | 23 |
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
| `m08_nightshade_arrested` ✱ | m08_the_mole | `nightshade_arrested` | `false` | P: the door's full scene in cuffs at the forward post; the deal | 107 |
| `m08_nightshade_ko_before_fate` ✱ | m08_the_mole | `nightshade_ko_before_fate` | `false` | P: silent in the van at the forward post ("Door.") | 107 |
| `m07_team_assignment` | m07_architects_gambit | `team_assignment` | `""` | O: the backdoor channel when `m07_completed and (m07_team_assignment != "trojan_horse" or m07_team_redirected)` (§4.2); P on uncovered Fracture (with `m07_completed`): Social Fabric in the media room | 81, 83, 84 |
| `m07_team_redirected` | m07_architects_gambit | `team_redirected` | `false` | O: a smaller backdoor channel (the redirect also reads `trojan_horse`) | 82 |
| `m06_assets_seized` | m06_follow_the_money | `assets_seized` | `false` | H: two empty guard posts and a gap in the fence, named by HaX at the fence | 72, 79, 80 |
| `m04_disclosure_choice` | m04_critical_failure | `disclosure_choice` | `""` | L+: first line of Tesseract's case; the strongest talk-down option on `full` | 48, 59 |
| `m08_accused_vector` ✱ / `m08_accused_phantom` ✱ | m08_the_mole | as named | `false` | P: whether Vector and Phantom join the team and the suspect list (only with `m08_completed`) | 112 |
| `m08_vector_apologised` ✱ / `m08_phantom_apologised` ✱ | m08_the_mole | as named | `false` | P: as above | 112 |
| `m08_vector_hostile` ✱ / `m08_phantom_hostile` ✱ | m08_the_mole | as named | `false` | P: as above (latches on a knock-out too) | 112 |

**Tier 2** (lines only: 26 variables)

| Alias | From | Var | Default | Use | Rows (§2) |
|---|---|---|---|---|---|
| `m01_final_choice` | m01_first_contact | `final_choice` | `""` | L: second line of Tesseract's case (`""` with `m01_completed` reads as arrest) | 1 |
| `m01_player_launched_attack` | m01_first_contact | `player_launched_attack` | `false` | L: how directly the offer is made (signposting unchanged, §4.3) | 2 |
| `m01_maya_ko` ✱ / `m01_kevin_ko` ✱ / `m01_sarah_ko` ✱ | m01_first_contact | as named | `false` | L: whether the clean first-day talk-down option exists (with `m01_completed`) | 6 |
| `m02_patient_assaulted` ✱ | m02_ransomed_trust | `patient_assaulted` | `false` | L: as above | 26 |
| `m02_bed4_manually_stabilised` | m02_ransomed_trust | `bed4_manually_stabilised` | `false` | L: talk-down option | 19 |
| `m02_patient_bed4_deceased` | m02_ransomed_trust | `patient_bed4_deceased` | `false` | L: his answer if the player raises St. Catherine's | 19 |
| `m03_guard_bribed` | m03_ghost_in_the_machine | `guard_bribed` | `false` | L: HaX and Finance | 38 |
| `m04_crew_lost` | m04_critical_failure | `crew_lost` | `false` | L: his ledger, if the player argues from Albion; the inquest line | 47, 59 |
| `m04_robert_vance_ko` ✱ | m04_critical_failure | `robert_vance_ko` | `false` | L | 51 |
| `m05_entropy_program_exposed` | m05_insider_trading | `entropy_program_exposed` | `false` | L: the media room's story names the player (the optional objective exists for every Fracture-uncovered player) | 66 |
| `m05_elena_treatment_funded` | m05_insider_trading | `elena_treatment_funded` | `false` | L: epilogue | 65 |
| `m05_final_choice` | m05_insider_trading | `final_choice` | `""` | L: the epilogue's line on the twenty-three placements (blown on `public_exposure`; Torres' names on `turn_double_agent`) | 60, 63 |
| `m05_found_pipeline_list` ✱ | m05_insider_trading | `found_pipeline_list` | `false` | L: epilogue count of the forty-seven, with the two below | 62 |
| `m05_recruiter_deal_accepted` | m05_insider_trading | `recruiter_deal_accepted` | `false` | L: as above | 62 |
| `m05_recruiter_deal_confessed` ✱ | m05_insider_trading | `recruiter_deal_confessed` | `false` | L: as above | 62 |
| `m06_satoshi_stance` ✱ | m06_follow_the_money | `satoshi_stance` | `""` | L: how warmly the offer is made | 76 |
| `m06_monitoring_enabled` | m06_follow_the_money | `monitoring_enabled` | `false` | L: names the HashChain tags as one of the operations disclosure would burn (§4.1) | 71 |
| `m07_countdown_expired` ✱ | m07_architects_gambit | `countdown_expired` | `false` | L: "Seattle first. As scheduled." | 86 |
| `m07_architect_echo_heard` | m07_architects_gambit | `architect_echo_heard` | `false` | L: the extra recognition beat on the line | 120 |
| `m09_recruiter_secret` | m09_digital_archaeology | `recruiter_secret` | `""` | L: Tesseract's leverage line, and HaX's answer to it | 61 |
| `m09_recruiter_offer` | m09_digital_archaeology | `recruiter_offer` | `""` | L: closing card (the Recruiter named, the twenty-three rolled up or still at their desks) | 60 |
| `m09_reading_finished` | m09_digital_archaeology | `reading_finished` | `false` | L: talk-down option ("Your file says I press it. Watch me.") | 101 |
| `m09_albion_notified` | m09_digital_archaeology | `albion_notified` | `false` | L: talk-down option and his answer ("Nine years late. Still earlier than they would have.") | §1.3 |
| `m09_hax_confession_answer` | m09_digital_archaeology | `hax_confession_answer` | `""` | L: whether "Put me on speaker" is on the talk-down menu (§5.4) | §5.4 |

**Tier 3, cut:** `m04_casualties_occurred`. Without `crew_lost` it means the bank vented into an empty hall, and there is nothing left for Tesseract to argue with. (It was already exported, so no export change.)

63 variables plus nine `completed` imports. Victoria's KO branch, Voltage's capture and the rest of the "absent" values put the room's default occupant in place (§5.3).

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
| `nightshade_shown_file` | `true` / `false` | the triple-agent branch only: the player sends Nightshade his own recruitment file from the restricted stacks | which way he tips the board at the door (row 105) |
| `sleeper_named` | `true` / `false` | the player matches the ledger's codename WREN (VM flag 2) to a SAFETYNET personnel record in the archive, or takes the Recruiter's offer. Optional | the sleeper detained at the briefing (row 117) |
| `recruiter_offer` | `taken` (took the name; her file wiped) / `refused` (refused, or hung up; her file wiped because the player pulled the Alpha tapes) / `named` (refused, or hung up, and pulled her file) / `double_crossed` (took the name, then pulled her file) / `""` (m09 not played) | the Recruiter's call and the tape-deck choice that ends it, every player | the closing card's one rule (§4.6): `named` names her and rolls up her network; `double_crossed` names her and rolls up part of it; `taken` and `refused` leave her at large and her network in place (row 60) |
| `albion_notified` | `true` / `false` | the player sends Tesseract's unsent vendor notice from the drop terminal (optional) | a talk-down option and his answer (§4.1) |
| `hax_confession_answer` | `""` / `should_have_told` / `same_in_your_place` | the player's answer to HaX's confession (§5.4). Safe shut in m06: she has known the name since m06 ("You should have told me." / "I'd have done the same in your place."). Safe opened: she told the player in m06, so her confession is that she sat on it because he was hers ("You should have pushed." / "I'd have sat on it too."), exported as the same two values | `same_in_your_place`: "Put me on speaker" under the third claim; `should_have_told`: HaX speaks once at the core, unasked, with a different option under the third claim (§5.4). Neither answer is the wrong one |
| `recruiter_secret` | `""` (never sold the list) / `confessed` (owned up in m05) / `told` (told HaX on the Recruiter's m09 call) / `kept` (hung up and said nothing) | the Recruiter's call; m09 works the value out from its own imports and the call | Tesseract's leverage line and HaX's reply (row 61) |
| `reading_finished` | `true` / `false` | the player read the Reading to its last page, the prediction about them | an extra talk-down option (§4.1) |

### 3.5 m10's exports

For a later season; nothing reads them yet. `ending` (`arrest` / `surrender` / `lethal` / `scorched` / `joined`), `database_outcome` (`secured` / `disclosed` / `both_wiped` / `published`), `sleeper_caught`, `wrong_accusation`, `head_start_out` (`none` / `zero_day` / `ghost` / `both`), `partial_release` (`none` / `small` / `large`), `media_story_ran`. Stage 9 adds them; they cost nothing and stop the next season having to ask for an ink change.

## 4. m10 ending matrix

Five endings: three successes (arrest, surrender and cooperation, lethal force), Scorched Earth, and Join ENTROPY. All five come after the same four VM flags, so `concludeRequires` is the same for every ending (the technical work only) and the ending is a global the debrief and credits read.

### 4.0 The opening and the route

**Briefing** (a cutscene at the forward post). Played m09: the raid team by branch, WREN detained on screen if m09 named her, and Netherton's reason for keeping the team together: "If I bench four agents tonight, WREN knows we know. They come. You watch them." **Never played m09** (R2-11): the same briefing carries the three facts m09 would have given, in about 45 seconds, with the four suspects in view: the Architect is Dr Adrian Tesseract, proved in Helena; the Publication's hour is 06:00 UTC; one of this team is a plant the Initiative calls WREN. HaX adds one sentence on who he is: SAFETYNET's former chief strategist, who trained her and half the field, and walked out seven years ago. About 60 seconds. Stage 2 reads this path with no other mission in mind.

**The night in UTC** (the Citadel's clock; in Montana it is the evening of day 12, on the Citadel's clock the early hours of day 13). About 01:45: the team reaches the fence. **01:50–02:20, the pre-breach split** (R3-03): Quintero and Kowalczyk recon the service tunnel; Arakawa holds the fence with the player; Malhotra is on comms with HaX at the forward post; Vector and Phantom, where present, come up with Netherton at 02:30. About 02:30: flag 1 and the breach. The countdown display then moves on story events (§4.2).

**Where the raid team stands after the breach** (R2-22). Quintero stays with the player. Malhotra holds the forward post on comms. Arakawa and Kowalczyk leap-frog ahead, Kowalczyk breaching, which is why her badge turns up everywhere. The player accuses face to face.

**Why the readers log SAFETYNET badges.** Tesseract loaded SAFETYNET's own credentials from the stolen database, so the bunker's readers accept them; the blast door knows 0x00 the same way. At 02:10, during the recon, WREN used a clone of Malhotra's badge on the core's service door to prop it for her own exit with the stolen copy (§4.4).

**The route.** Forward post (flag 1) → blast door, keyed to 0x00 → tunnel → security office (Ghost's call on the duty handset) → workshop floor → power room → server hall (flags 2 and 3; the disarm order is armed here; the head start is stopped here or goes) → media room (optional) → gallery → outer lock → core (flag 4). The power room is on the main path (R2-13): the gallery's blast shutter runs off it, and the player has it cut at the switchgear, by whoever holds the power room's slot (§5.3) or by hand. HaX points the way after flag 1: "Whoever's in the power room runs your lights." In player-facing text "the plant" is never used for the room, and the sleeper is "WREN" or "the sleeper", never "the plant" (R3-10). **At most one non-HaX voice on the line per room** (R3-01).

### 4.1 The core sequence

The core is one room (D-16): the core host terminal on one side, Tesseract seated at the release console on the other. He has been expecting Agent 0x00 since the blast door opened for them by name (row 119), because he needs a SAFETYNET hand on the key (§1.2).

0. **Arrival.** **He stops the clock** as the player walks in: "Take your time. I've paused it. I'd rather it was you." From here the clock presses on nothing. The core host terminal is lit, and HaX says the obvious first move: "Get on his box. He'll keep." The player takes flag 4 there; he is an NPC the player approaches. He has two or three idle lines triggered by VM sub-progress (never by time), and HaX's field-guide offer keeps working in the core. His case starts when the player walks over to him. (Flag 3 was taken earlier, at the server-hall console: R2-02.)
1. **His case.** A conversation, not a fight. At most three lines from the player's record, by priority: m04 `disclosure_choice`, then m01 `final_choice`, then m07 `debrief_stance` (D-08), each with a default line for a player who never played it. Then the Publication itself, plainly: the hour, the fallback, the channels, his casualty sheet (1,100–2,600 in the first month), and **the offer, which every player hears** (D-21): it has to be one of them, and his file said it would be 0x00.
2. **The player's answers** (the talk-down): **three short exchanges**. Each time he makes a claim, the player picks a rebuttal, and only an answer that meets that claim lands. Each exchange offers three or four answers: the mission's own rebuttal, up to two from the player's record that fit this claim, and at least one that sounds strong but answers a different question. A landed point shows (D-20): he stops, looks at the console, a beat of silence, the music thins. A miss gets a dry dismissal ("That answers a question I didn't ask.") and is visibly a miss. **Two of three for surrender.** Still easy, but the player has to listen.
3. **The console.** **Stop it** (the disarm order armed at the server hall) or **"Show me how it works"** (the first step towards Join, §4.3). Stopping it is one action and he doesn't fight it: "Then we do it the slow way. In court. I've a lot to say." If WREN is still free, she comes through the service door as the player reaches for "Stop it" and tries to press the key first (§4.4).
4. **The database** (needs flag 4). Three options. HaX or Netherton says the cost of each on the line **before** the player chooses (D-05, R2-12):
   - **Secure** the stolen copy as evidence; SAFETYNET keeps its master. Gain: every operation that runs on those entries keeps running, and one pays off in the epilogue (§4.6). Cost: the hoard stands, and nothing gets fixed. HaX reads one entry aloud, an infusion-pump flaw in 140 hospitals, "still live next year if we do this". (`secured`)
   - **Disclose**: wipe Tomb Gamma's copy and send SAFETYNET's master to the vendors on a coordinated-disclosure schedule. Cost: two live operations that run on those entries burn, and they are ones the player knows. Netherton names them, by branch, from: the watch on a recruited Victoria, the triple-agent channel to Nightshade, the HashChain tags (`m06_monitoring_enabled`). Defaults, still live after the raid, for a player with none of those: the standing watch on the Initiative's handlers (the network the Recruiter's file maps) and the tap SAFETYNET runs on Zero Day's brokers (Vos among them). Each burned operation gets an epilogue beat with a consequence (§4.6). He signs anyway (user-approved, F6). A player who sent the Albion notice in m09 has done this once already. (`disclosed`)
   - **Wipe both**. SAFETYNET left Nightshade's door into its vault open on purpose, as a trace to follow the theft here (D-13; canon, F7), and that line is still live. Through it the player can erase SAFETYNET's master too. Cost: nothing is fixed, and every flaw is still out there, now unmapped. This is Scorched Earth (§4.5). (`both_wiped`)
5. **Tesseract** (not after "wipe both"):
   - **Two or more points:** he stands with his hands empty. "Ask me, then." The player accepts his cooperation (**surrender** ending) or arrests him anyway (**arrest** ending). Lethal force is not offered (D-11).
   - **Fewer than two:** "Arrest me, then." As the player moves, he reaches for a dead-man switch under the console that re-arms the fallback release for the first city. The player chooses in that moment: **fire** (**lethal force** ending, one narrated line), or **hold fire and trust the team**: HaX kills the switch's feed through the host the player now controls, a second before it matters (**arrest** ending).

**The three exchanges.** Each has the mission's own rebuttal, always on the menu, so surrender is open to any player. Under it, at most two answers from the player's record, by the priority shown:

| His claim | The mission's rebuttal | From the record (priority order, two shown at most) |
|---|---|---|
| "The cost is acceptable." | The correction on his casualty sheet, which lies on the workshop floor's critical path (or on the projection desk on `hardened`): his model double-counts the hospitals' recovery time, and he signed it anyway. Decoding the margin note (optional) gives a sharper version of the rebuttal. | `m07_debrief_stance = hardened` (the live curve); `m02_bed4_manually_stabilised`; the clean first day (with `m01_completed`, no m01 KOs, no `patient_assaulted`) |
| "Services like yours hoard. Only a shock fixes it." | The Albion papers (m09, with a copy in his files at the core for anyone who skipped m09): nine years ago he argued the flaw should go to the vendor, lost, and never sent the notice he drafted. Critical Mass came through that hole at Albion. | `m04_disclosure_choice = full` ("And nobody died for it"); `m09_albion_notified` ("I sent it. Tonight."); `m02_exposed_hospital` |
| "Someone has to make it hurt. Better me, with clean hands." | What HaX does with "Let it hurt afterwards, not during" (told in m09, or on the line now if missed): you keep your own hurt for afterwards so you can do the job, and you never hand it to strangers (row 120). | "Put me on speaker" (`m09_hax_confession_answer = same_in_your_place`; HaX makes the argument herself), or on `should_have_told` HaX's unasked line ("My agent told me I should have told them. They were right. You never told me anything.") and the option "She learned that from you."; `m09_reading_finished` ("Your file says I press it. Watch me."); Voltage stood down on his print; Gary talked round |

The decoy answers are the record answers placed under the wrong claim, plus one stock line per exchange. He answers some of the player's lines from his ledger: `m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`, `m09_recruiter_secret`. After "Stop it" he answers the Reading himself: "Then I was wrong about one thing."

### 4.2 The Publication's channels and partial release

The Publication goes out through up to three channels, and the cells get their head start through a fourth. Only the first must be shut to stop the Publication; the others decide the cost.

| Channel | Present when | Shut by | If left open |
|---|---|---|---|
| Tomb Gamma's own release servers | always | the core (step 3) | the key is pressed (Join). The 06:00 fallback stays on the countdown as menace and never fires before the core in normal play |
| The cells' head start | always | an optional task at the server-hall console, beside the backdoor (needs flag 2); or a slot-holder has already stopped their share (Victoria confronted and holding; Ghost talked out of the sale, kept deal, or parley) | armed when flag 2 goes in; goes out when the player leaves the server hall (the countdown reads 04:00 at that moment) |
| The Trojan Horse backdoor | `m07_completed and (m07_team_assignment != "trojan_horse" or m07_team_redirected)` (the redirect also sets `trojan_horse`; never played m07 means no channel) | an optional console task in the server hall (needs flag 2) | **partial release**: the batch already queued on the backdoor goes out when the core is shut. Small on `m07_team_redirected` (14 million systems), large when Austin was never covered (47 million) |
| Social Fabric's story machine | `m07_completed and m07_team_assignment != "fracture"` | an optional task in the media room | the "massacre in Montana" story runs; on `m05_entropy_program_exposed` it names SAFETYNET and the player's designation |

**The clock** (R3-02). A countdown on screen with two marks, **04:00 UTC** (the cells' head start) and **06:00 UTC** (the fallback), but it is driven by story events, not wall-clock time, so slow VM work never costs the player anything. The display steps forward as the player reaches each beat (the breach, the security office, the workshop, the power room, the server hall, the gallery), and people talk about it ("Ninety minutes, 0x00." "Under an hour."). It reads 04:00 as the player leaves the server hall, which is when the head start goes unless they stopped it there (§4.2 table). It never reaches 06:00 before the core, and Tesseract stops it when 0x00 walks in. The first city's batch ("Seattle first. As scheduled.") goes only through an open backdoor channel, as the partial release when the core is shut. Nothing on the clock ends the mission or forces an ending. With Austin covered directly and the head start stopped at the server hall, nothing is released at all.

**What the player sees of the database.** The server hall's schedule (flag 2) lists the first entries by city in plain words: a hospital group's infusion pumps, a county's dispatch software, a water utility's controllers (D-04). Closing the backdoor and killing the story are the hands-on version of "who gets hurt first", so the core's menu is the player's conclusion, not the lesson.

### 4.3 Join ENTROPY: signposting

The one non-success ending. A deliberate choice the player makes three times, never a trap:

Every player hears the offer as part of his case (step 1), so listening to the villain is never a step towards betrayal (D-21). Join starts only with an action:

1. At step 3 the player chooses **"Show me how it works."** He shows them the key. The narrator says plainly what pressing it means. The next menu always includes "Step back" and "Stop it."
2. The player chooses **"Give me the key."** HaX, on the line, says the player's designation and asks them not to. The narrator states the cost again: the mission ends here, working for ENTROPY, with the casualty figure. "Step away" is offered again.
3. The release key is an object at the console, labelled, with its own confirmation ("Publish the database to everyone, now?"). Only that press sets the ending, and it makes the Reading's prediction true.

It cannot be reached by a misclick, a knock-out, the clock, a failed talk-down, or any import. `m01_player_launched_attack` and `m06_satoshi_stance = wondered` change how warmly Tesseract makes the offer, and nothing else. m01's LAUNCH button is the precedent.

### 4.4 What earlier choices change

The route through the bunker works with every import at its default. These change the cost and who is standing at the end.

| What changes | Better | Worse | In-mission way round for the worse case |
|---|---|---|---|
| Partial release (§4.2) | Austin covered directly in m07 (`trojan_horse`, not redirected), or m07 never played | redirected (small channel); Austin never covered (large) | the server-hall task |
| The cells' head start (§4.2) | stopped at the server-hall console, or each cell's share stopped by its slot: Victoria confronted and holding (Zero Day gets nothing), Ghost talked out of the sale, deal kept, or parley (Ghost sells nothing) | the player leaves the server hall without stopping it: it is out | the server-hall task, named by HaX when flag 2 goes in |
| Media story | Fracture covered in m07, or never played (the drafted story on the desk instead) | Fracture uncovered, and `m05_entropy_program_exposed` names the player | the media-room task |
| Nightshade (the door slot, at the forward post) | triple agent, shown his file in m09: he gives the override he was saving. Arrested: brought to the forward post in cuffs, offers the defences for a deal. The scene knows the player refused him one in m08 ("You said no deals. Netherton says otherwise tonight."), and refusing again is the first option | triple agent, not shown: one door locks, the sleeper is warned. Silent handover or never played: "Door." | the security office reopens the door |
| Victoria, recruited | confronted with Zero Day's order from the schedule: she holds and opens the outer lock | trusted without checking: she sells the raid (an alarm, reinforcements in the gallery) | refuse her and take the lock the long way; HaX's doubt ("trust her as far as the gallery") and a kept Nightshade's warning both come before the gallery's silent stretch |
| Victoria, escaped | without the m03 threat: she leaves | with `sterling_on_call_seen`: a stand-off | talk-down or knock-out |
| Victoria, arrested / KO'd / never played | arrested: brought to the forward post under guard as Netherton's legal cover; face to face, she offers Pieter Vos's weakness for a reduced charge (deal or not); she is right either way | KO'd or never played: Vos in the gallery, cold | talk, or the long way |
| Ghost (every player, on the security office's duty handset) | deal kept: side door, no sale, and Ghost's question; refused: Ghost's question back, then the guard-change window or a camera blind, no sale | deal broken: side door shut, a harder talk to stop the sale; with the keys used, Ghost watches the route | talk Ghost out of the sale; the main route; the security office blinds the cameras |
| Power room (main path) | Voltage captured: brought to the forward post under guard. He asks to be walked to his own switchgear under Quintero's guard; the player chooses to take him (a faster cut, and he asks one thing for the inquiry) or keep him on the line. Else Vance, else Elena, in the phone slot. Voltage escaped and stood down on his print | Voltage escaped (and Static, if he left with him) at the switchgear | talk, fight, or cut the shutter by hand |
| Workshop | Gary protected: comes in behind the player, recognises the technician on the floor as someone he once trained, and asks the player to talk them round or take them in | Gary unprotected: on the floor, talkable | talk, or clone the default technician's card |
| Server hall | Asante, who can be talked into showing the schedule | Mercer at large (with `m07_completed`): a hostile boss with one line | fight, or sneak the schedule terminal while he is drawn off |
| Guards | `m06_assets_seized`: two posts empty, gap in the fence, named by HaX on arrival | full staffing | stealth and the cloner as in any mission |
| Who stands with the player | Vector and Phantom (with `m08_completed`; not accused, or apologised to, and not hit) | they decline, and Netherton says why | the default raid team |

**The whodunit** (row 117; R2-04, R2-06, R2-03). Skipped if m09 named WREN. Otherwise three clues, spread through the bunker, each narrowing the field, and HaX's hub nudges after each:

1. **Door log** (security office, flag 1): a badge opened the core's service door at 02:10, during the pre-breach recon (§4.0), and the badge is Malhotra's, cloned.
2. **Alibi** (on the line): at 02:10 Malhotra was on comms with HaX, who confirms it if asked; Arakawa was at the fence with the player; Vector and Phantom, where present, were at the forward post with Netherton. That leaves the two who took the service tunnel: Quintero and Kowalczyk.
3. **The bench** (workshop floor): the PIN-cracker bench logs a cracker issued "to WREN", with a serial. The player can check it against the cracker on their own belt, the one Kowalczyk handed them at the m09 briefing (or at m10's briefing for a player who skipped m09).

A kept Nightshade, an arrested Nightshade who took the deal, or Phantom's list each skips one step; none is the answer on its own. Vector and Phantom, where present, are on the suspect list too.

**Accusing** is a face-to-face choice, any time after the first clue:
- **Right:** she is held at the forward post.
- **Wrong:** the innocent officer gets one line as they are led off, which is also a hint (Malhotra: "Eleven years. Check the log again."). The team loses that officer's job: without Malhotra, HaX's line drops one room early; without Arakawa, one fewer guard is cleared ahead of the player; without Quintero, nobody stops WREN at the core, so the player does; without Vector, his sealed door shuts; without Phantom, his list is gone. Once the player holds the clearing evidence, Netherton **recalls** the accused officer by radio; their function returns from the next room on. Never a death, never a blocked route.
- **None:** she acts at the core.

Knocking out a raid member holds them at the forward post but is **not** an accusation; it costs an epilogue line. A knocked-out Kowalczyk can't act at the core, but `sleeper_caught` stays false, and the epilogue notes she was never named.

**WREN at the core.** If she is still free, she comes through the service door she propped at 02:10 as the player reaches for "Stop it", and tries to press the key first. Tesseract refuses her: "Not you, Halina. You're mine. It has to be one of theirs." The player hears his motive from his own mouth. She turns to wreck the disarm and take the stolen copy for the Initiative instead. Quintero is wounded stopping her (not killed), or, if Quintero was wrongly sent back, the player stops her (a knock-out).

### 4.5 The endings

| Ending | Reached by | `ending` | Credits title |
|---|---|---|---|
| Arrest | stop; secure or disclose; then either two points and "arrest him anyway", or fewer than two and hold fire at the dead-man switch | `arrest` | MISSION COMPLETE |
| Surrender and cooperation | stop; secure or disclose; two or more points; accept his cooperation | `surrender` | MISSION COMPLETE |
| Lethal force | stop; secure or disclose; fewer than two points; fire when he reaches for the dead-man switch | `lethal` | MISSION COMPLETE |
| Scorched Earth | stop; wipe both | `scorched` | MISSION COMPLETE, then AGENT 0x00: SUSPENDED |
| Join ENTROPY | the three steps of §4.3 | `joined` | MISSION FAILED, with the Publication's casualty projection (as m01's launch ending) |

**Scorched Earth.** The chaos is his own dead-man (D-12). He wired the core to purge itself if both copies died, because that is the one outcome where he can't win the argument and can't be made to answer for it. The core's fire suppression dumps, the lights go, the blast doors cycle, and in the dark he is gone by the service tunnel (a cutscene). The player gets out with the team. Nobody holds the map, SAFETYNET included, and nobody fixes anything. Netherton suspends the player: "I would have wanted to do the same. That is why you are suspended and I am not."

### 4.6 Epilogue beats

Every ending runs the same frame: the forward post at first light (or the Citadel for Join), a short scene, the closing card, the teaser slot (§7), then credits. The closing card draws its lines from §2's epilogue rows: Zero Day still trading, Ghost's last message or clean exit, Elena Torres' treatment, the forty-seven reached, Albion's inquiry, the $12.8M, dispatch in eleven counties, the off-screen m07 leaders by whether their site was covered.

| Ending | Tesseract | HaX | Netherton | Lines that change |
|---|---|---|---|---|
| Arrest | In a police van, says nothing. He nods to HaX through the window. | Watches the van go: "He taught me to keep it for afterwards. It's afterwards." | Signs the handover: "A trial. He will make speeches. Let him." | ENTROPY's cells keep running; "He is in a cell. The cells are not." |
| Surrender | Gives the cells' contact protocol on the bunker's own terminal. | Sits with him for one minute and does not say what they talked about. | Takes the protocol to the Council. | Two cells rolled up in the closing card (the ones the player's history left weakest). |
| Lethal force | One line: his hand on the switch, the player fires, he falls by the console. Nothing more on screen. | Long silence on the line, then: "Log it. I'll sign under you." | Covers it in writing and says so: "He reached. I'll put that first." | ENTROPY has a martyr; the cells go quiet, which is worse. A review board is named for after the credits. |
| Scorched Earth | Gone. A card on the console, his hand: "Afterwards, then." | Stands with the player at the hearing: "He still knows. He's one man with a memory now, not a map." | Suspends the player (above), then: "Every one of those flaws is still out there. We just can't see them any more." | The service rebuilds its threat catalogue from nothing. The teaser slot, if used, sits after the suspension. |
| Join ENTROPY | Walks out with the player into the dark. | Her last message, unanswered: the player's designation, and nothing else. | Orders 0x00 brought in. | The casualty curve on the forward post's screen, climbing. |

**The database choice in the epilogue** (R3-05). Each option gets a scene beat with a consequence, not only a name on the card:
- **Secured:** Netherton files the stolen copy in the vault beside the master ("Two maps now," HaX says). One kept operation pays off on screen: through Nightshade's channel, the watch on a recruited Victoria, the HashChain tags, or by default the tap on Zero Day's brokers, a cell is rolled up before the credits. The card notes the infusion-pump flaw still unpatched.
- **Disclosed:** the first vendor patches land on the morning of the Publication's hour and HaX reads the count. Each burned operation goes dark on screen: Nightshade's channel ("He's been moved. I can't reach him."); a recruited Victoria vanishes from her desk; the HashChain tags drop and the reserve bank empties; by default, the handler watch loses its marks and the Zero Day tap goes silent.
- **Both wiped:** Scorched Earth's own beats (above): the flaws still out there, unmapped, and his memory as the only map.

**The head start** (R2-08, R3-02). Stopped at the server hall: "The cells got nothing." Otherwise by branch: Victoria confronted and holding, Zero Day got nothing; Ghost talked out of the sale, deal kept, or parley, Ghost sold nothing. Otherwise: "Two cells have it. We'll be finding out which entries for a year."

**The Recruiter and her network** (R2-20, C2, C14). One rule. `named`: she is named and her network rolled up. `double_crossed`: she is named, and "Twelve. She warned the rest." `taken` or `refused` (her file wiped): she stays at large and her network in place. What "her network" means depends on m05: the twenty-three placements by default ("Eleven are still at their desks" when it stays in place); on `public_exposure` the twenty-three were blown in m05, so it is her handlers and the forty-seven; on `turn_double_agent` it is the names Torres couldn't give.

The closing card also lists the cells the finale doesn't stage, by branch (row 103), with `m07_completed`: Ghost Protocol (Michael Reeves) and Digital Vanguard (Marcus Ashford) by whether Fracture and Meltdown were covered in m07; Supply Chain Saboteurs (Jennifer Walsh) by Austin. Never played m07: the card follows m07's never-played canon (§3): Austin reached, the other sites not. Then Zero Day, and the Recruiter by the rule above.

## 5. Cast

Sprite keys are the ones the shipped missions use (inventories A §2, B §m0N.2). New characters need sprites and the usual character pipeline at stage 9.

### 5.1 Returning characters

| Character (sprite) | m09 | m10 |
|---|---|---|
| Agent HaX (`agent_hax`) | §5.4 | §5.4 |
| Director Magnus Netherton (`netherton`) | §5.5 | §5.5 |
| Nightshade (`nightshade`) | Triple agent: a voice on the player's phone from a SAFETYNET room; the player may send him his file. Arrested: one Netherton line. Silent handover: absent. | **Full scene, every branch.** Triple agent: at the forward post with his payment, tipped by m09; skips one whodunit step. Arrested: brought to the forward post in cuffs, offers the defences for a deal the player refused him in m08 ("You said no deals."). Silent handover or never played: in the van, one word. HaX's visit in the epilogue on the arrested branch. |
| The Recruiter (phone only, no sprite) | Rings once inside her stacks; every player; makes every player the offer (row 60). What else she says depends on m05. | Not present. Named or at large in the closing card, with the twenty-three. |
| Derek Lawson | His file only, in the restricted series (one side of the first purge choice). | Quoted by Tesseract. |
| Gary Whitlock (`gary_whitlock`) | Protected: rings with the tape room's decode hint. | **Full scene, both ways.** Protected: SAFETYNET's consultant at the forward post ("You saved my career."), then in person behind the player at the workshop, where he recognises a technician he once trained and asks the player to talk them round or take them in. Unprotected and quiet (m02 played): a technician on the workshop floor, talkable. |
| Graham Reeves (`graham_reeves`) | In custody: his handler's contact sheet. | Prop: at large, his name on the rota sheet ("on leave tonight"). Never met. |
| Ghost (voice and terminal) | – | **Full scene, every player** (on the security office's duty handset): the head-start sale, and the player's chance to talk Ghost out of it; side door, locked door, or parley (with Ghost's question back) by branch. |
| Victoria Sterling (`victoria_sterling`) | Recruited: her protocols open a mail route. Arrested: the archive's company name from her keys. KO: from her seized devices; she says nothing. | **Full scene.** Recruited: in the gallery for Zero Day's head start; the trust choice. Escaped: same errand; stand-off (with the m03 threat) or recognition. Arrested: under guard at the forward post as Netherton's legal cover, bargaining face to face over Vos. KO'd: absent; Vos holds her desk. |
| Danny Foster | One HaX line by fate, and his unanswered question on two branches (row 36). | – |
| Voltage (`voltage`), Static (`operative_static`) | Wall card. | **Full scene.** Escaped: Voltage at the switchgear; Static beside him only if he left with him. Captured: under guard at the forward post; he asks to be walked to his own switchgear, and the player takes him (face to face at the power room) or keeps him on the phone. |
| Robert Vance (`robert_vance`) | – | Ally: the power room's phone slot after a captured Voltage. KO'd: HaX's one line. |
| David Torres | Turned: rings in from his desk, still in place inside the Initiative; one step off the WREN search; the ledger shows him as a live placement. Dead: "closed placement" in the ledger. | – |
| Kemal Aydin | Walked: named as the source of the tip. A line, no call. | – |
| Irina Volkova | Recruited: one HaX line. | – |
| Dr James Mercer (`james_mercer`) | – | Presence: at large (with `m07_completed`), in the server hall in Asante's place; one line, then hostile. |
| Elena Rodriguez (`elena_rodriguez`) | – | Turned: the phone slot when neither Voltage nor Vance holds it. |
| Ray Hollis (`ray_hollis`) | – | Prop: evaded, his photo on the duty board. |
| Agent 0x23 Vector (`agent_vector`), Agent 0x88 Phantom (`agent_phantom`) | – | m08 played and not wronged: on the raid team and on the suspect list. Vector's annex badge opens a sealed door; Phantom's list narrows the suspects. Wronged: they decline. |
| Dr Adrian Tesseract, the Architect | Voice only: his first call, to HaX, at the end. | In person at the core (new sprite `adrian_tesseract`). A man in his sixties whose origin stays unplaced, as the voice bible keeps it; voice Sadaltager as in m07, without the distortion. |

### 5.2 New characters

Kept clear of the existing name clashes (Chen, Reeves, Park, Okafor/Okonkwo, Wierzbicki, the three Ghosts, Cipher). Every name and codename below was grepped across `scenarios/`, `story_design/`, `planning_notes/overall_story_plan/` and `docs/` on 2026-10-20. The only hits outside the finale documents are two uses of "Kevin Tran" (m05's stage 0 notes and an unused AI Singularity lore fragment); neither is in a shipped mission and neither shares a first name, so Jesse Tran stays.

| Name | Age, background | Mission | Role |
|---|---|---|---|
| Margaret "Peg" Sorensen | 66, white Montanan of Norwegian family, former county clerk | m09 | Director of the Helena archive and the Insider Threat Initiative's keeper of records. A true believer: "People are records. I keep them." Tonight she is carrying out the purge order: the shredder and the degausser in the restricted cage. Stopping her (arrest, knock-out, or a bluff that holds) halts the paper side of the purge. She keeps the ledger live, and updated WREN's entry on day 10. She holds the master keys and the Reading's shelf mark, and quotes one Reading entry at the player when bluffed or cornered. Hostile in her office if pushed; arrest or knock-out. |
| Noor Haddad | 34, Lebanese-American, grew up in Dearborn | m09 | Records clerk, one of the forty-seven candidates (on TalentStack's list without knowing it). Helps, warns or stays wary by row 62's condition; the player can tell her she is on the list. |
| Jesse Tran | 29, Vietnamese-American | m09 | The archive's IT contractor and Social Fabric's plant, the name Maya's lost intelligence would have flagged (row 6). He runs the purge's tape-wipe job from the server closet; stopping him saves the losable finds still on tape. Calls in a guard if he sees the player first. |
| Cody Old Coyote | 24, Apsáalooke (Crow), from Lodge Grass | m09 | Night security guard, working nights to pay for a lineman's course. Innocent; talk past him, or a knock-out costs a line in the debrief. |
| Agent 0x19 Callum Fraser, Agent 0x6B Ana Lúcia Ferreira | 31, Scottish; 38, Brazilian | m09 (named) | The two agents killed at the unanswered m07 sites. Netherton reads both names before the Montana order. Never seen. |
| Agent 0x2D "Anchor", Marisol Quintero | 52, Mexican-American | m09 briefing, m10 | Task Force Null's raid leader on the ground. Steady, dry, on the player's side, and a suspect like the others. If the sleeper reaches the core she is the one wounded stopping her. |
| Agent 0x5E "Lantern", Halina Kowalczyk | 47, Polish-British woman | m09 briefing, m10 | **The sleeper, ledger codename WREN.** Task Force Null's breaching lead. She came to SAFETYNET eleven years ago as a lateral hire from the private sector through Harwick & Lowe, an executive search firm long since closed: one of the Initiative's older fronts, tied to it by nothing until the m09 ledger. She was never in Tesseract's intake, so the screening after m08 missed her, and she is older than anything on m05's TalentStack lists. She hands the player the PIN cracker in m09 and is easy to like. |
| Officer Dev Malhotra | 33, British-Indian | m09 briefing, m10 | Task Force Null comms officer, at the forward post. A suspect; innocent; his badge was cloned for the core's service door. A wrong accusation sends him back, and HaX's line drops one room early. |
| Officer Kenji Arakawa | 41, Japanese-American | m09 briefing, m10 | Task Force Null tactical officer, the team's US liaison, ahead of the player with Kowalczyk. A suspect; innocent. A wrong accusation leaves one more guard in the player's way. |
| Pieter Vos | 50s, Dutch | m10 | Zero Day's broker, who took Victoria's desk "by Monday". The gallery's default occupant (Victoria KO'd, or m03 never played) and the man she bargains over on the arrested branch. Cold, practical, there for the head start. |
| Dr Abena Asante | 45, Ghanaian-British woman | m10 | Tomb Gamma's systems lead, who wrote the release pipeline. The server hall's default occupant when Mercer is not there; can be talked into showing the schedule. "I wrote it. I'd write it again." |
| Tomb Gamma's guards and technicians, Social Fabric's media crew | mixed | m10 | Generic sprites, varied. |

### 5.3 Default occupants

Every room that a carry-over can fill has a default occupant, so the route works with all imports at their defaults.

m10 has nine playable rooms (D-16): forward post (with the gate in view), security office (the gatehouse merged in), blast-door tunnel, workshop floor, power room, server hall, media room, gallery, core (with the host terminal). The service tunnel is a cutscene.

**The five full-scene slots** (R2-01). Each is on the main path (§4.0) and holds a person on every combination of choices; a won branch and a lost branch put different people there.

| Slot | Won or careful branch | Lost or careless branch | Default (never played, or neither) |
|---|---|---|---|
| The door (forward post) | Nightshade arrested: in cuffs, the deal. Triple agent, shown his file: the override | Triple agent, not shown: the board tipped against the player | Nightshade in the van: "Door." |
| The workshop | Gary protected: in person behind the player; talk the technician he trained round, or take them in | Gary unprotected and quiet: on the floor, recruited | a technician with a cloneable card; the bench and its WREN serial |
| The power room | Voltage captured: walked to his own switchgear under guard, or kept on the phone (the player's choice) | Voltage escaped: at the switchgear (with Static if he left with him) | a power-room technician; Vance, Elena or HaX on the phone |
| The gallery | Victoria arrested: met under guard at the forward post, the deal over Vos, then Vos in the gallery with her information in the player's hand. Recruited and confronted: holds | Recruited and trusted blind: sells the raid. Escaped: stand-off or a look | Pieter Vos |
| The network (the security office's handset) | Deal kept: no sale, a question for the player. Refused: Ghost's question back, then the window or a camera blind, no sale | Deal broken: the sale, harder to stop | Ghost as a stranger, selling |

**Other rooms.**

| Room (m10) | Default | Replaced or joined by |
|---|---|---|
| Security office | an ENTROPY duty guard; the duty board (with the "posts unmanned" memo on `m06_assets_seized`) | Hollis's photo on the board (prop) |
| Blast-door tunnel | a guard post with the rota sheet | Reeves' name on the sheet (prop) |
| Server hall | Dr Abena Asante | Dr James Mercer (presence; Asante then works the media room's feed) |
| Media room | dark, with the drafted "massacre in Montana" story and the player's photo on the desk | Social Fabric's crew (Fracture uncovered, `m07_completed`) |
| The raid team | Quintero, Kowalczyk, Malhotra, Arakawa | Vector, Phantom (`m08_completed`, not wronged). Kowalczyk is absent if named in m09 |
| Power room phone slot | HaX | Voltage (captured, if kept on the phone), else Vance, else Elena Rodriguez. One non-HaX voice per room |

### 5.4 HaX's arc

m08 left her close to coming apart, texting "Same classroom, 0x00. Don't ask me whose yet." The finale is her reckoning with the man who taught her.

- **m09.** In person at the briefing, then on the line. In the identity scene she says the name as fact for the first time. A player who opened Satoshi's safe heard her say it in m06 as his guess; one who didn't learns she has known since then (row 70). **The player answers her** (R2-19): "You should have told me." / "I'd have done the same in your place." On the safe-opened branch she told the player in m06, so her confession is that she sat on it because he was hers, and the answers are "You should have pushed." / "I'd have sat on it too." (same two exported values). The answer is exported (`hax_confession_answer`): on the second, she trusts the player with the moment at the core. On a quiet stretch in the archive she tells the player what "Let it hurt afterwards, not during" means to her: you keep your own hurt for afterwards so you can do the job; you never pass it to strangers. That is the version the player can use against him in m10. On `m08_hax_ko`: "You put me on the floor at the Citadel. I'm still running you." At the end Tesseract rings her, not the player. The player hears her side only: short answers, then "I'll bring them." She tells the player what he said after he hangs up.
- **m10.** At the forward post with Netherton, on the line all night. She knows the bunker's tricks because she knows his. Tesseract's jamming drops her line for one short, linear stretch (the gallery: one room, one obvious door). Her last line before the drop names what to do next, and any warning about Victoria comes before it (D-22). At the core he talks to her through the player's handset; she does not decide for the player and says so. On `same_in_your_place`, "Put me on speaker" is one of the player's answers in the third exchange: the player hands her the floor, and she makes the argument only she can make, as his student. On `should_have_told` she speaks once at the core, unasked: "My agent told me I should have told them. They were right. You never told me anything." That puts a different answer under the third claim ("She learned that from you."). Neither answer to her confession is the wrong one. Her one act on the failed talk-down (killing the switch's feed) stays as written. On `m09_recruiter_secret = kept`, Tesseract tells her about the forty-seven on the open line; she answers "I'll deal with that afterwards," and does, in the epilogue.
- **Endings.** §4.6. In every success ending she gets the last word before the card.

### 5.5 Netherton's role

- **m09.** Runs the briefing in Task Force Null's room (a cutscene): the wall of cards as the "previously on", the intercepted purge order that cuts the leave short, the raid team introduced. Brings the legal cover (Victoria's CPS case on that branch). Says the name aloud for the first time when the proof comes together, in words that work whether or not the player heard his m08 pledge (row 125). At the close he tells the player why the raid team goes in together, WREN and all (§4.0). Reads the two dead agents' names. Signs the Montana order in front of the player: on `m08_debrief_stance = owned`, with his own name beside Nightshade's file; on `defended`, with one quiet thank-you he doesn't explain. On `m08_netherton_ko`: "Before we start. My jaw is fine. I'm not asking for an apology."
- **m10.** Commands the raid from the forward post. On `m07_debrief_stance = hardened` he tells the player the Council said yes, and the projection desk is the result (row 99). Holds whoever the player accuses. Before the database choice he names the two live operations disclosure would burn, ones the player knows (§4.1), and authorises it anyway if the player chooses it. Suspends the player on Scorched Earth. Orders the player brought in on Join. His m08 line "If he burns you, it is on my signature" comes due at the door on the triple-agent branch either way.

## 6. VM flags in story terms

The VM plan is written separately (`finale/FINALE_VM_PLAN.md`, by a Haiku agent); it decides how each flag is reached and must fit the meanings below. Every flag is required (`concludeRequires`), is wired through `targetFlags` with `setGlobal`, and is followed by a HaX line that says what it bought in story terms.

### 6.1 m09: the archive's servers

Two separate machines: the archive's catalogue server (flags 1–2) and the old Tomb Beta server racked in the tape room (flags 3–4). Flags 1–3 are submitted at the SAFETYNET drop terminal the player sets up in the reading room (the field laptop), so the identity scene happens there; flag 4 is submitted in the tape room beside the machine it came from.

| Flag | Story meaning | Unlocks in game |
|---|---|---|
| 1 | **A foothold on the archive's catalogue server**: the index of every box, tape and shelf, including the restricted series the public catalogue hides. | The shelf marks for the restricted stacks, and the first clue to the tape room's code. |
| 2 | **The Insider Threat Initiative's ledger**, kept live on the catalogue server: the twenty-three placements and the forty-seven candidates, each under a ledger codename, plus an older legacy section. WREN's legacy entry was updated on day 10: "assigned TF Null, Montana operation". Every player learns that much. | The printed ledger at the shelf becomes readable, and is shredded once read (the flag holds it), and the optional cross-reference (codename to personnel file) opens: `sleeper_named`. The Recruiter rings next. |
| 3 | **The owner of Tomb Beta's server**: Tomb Beta ran its enrolment under a web service account, and the credential text found beside the flag is a SAFETYNET staff credential issued to Dr Adrian Tesseract before he left seven years ago, never revoked. That text is the proof of ownership; with the handwriting on Nightshade's recruitment file, it proves who he is. The same machine's files hold his memo from nine years ago arguing the Albion flaw should go to the vendor, and the vendor notice he drafted and never sent (§1.3). | The identity scene with HaX and Netherton (row 125); the optional "send the notice" action (`albion_notified`). |
| 4 | **Full control of Tomb Beta's server**: its job that still mirrors to Tomb Gamma, carrying the Publication's hour (06:00 UTC, day 13), the 04:00 head start, the fallback, and the list of defences built from the stolen database. | Tesseract's call to HaX, the raid order, and the mission's close. |

Together with the paper finds (the deed and construction file, the Reading, Nightshade's file), these give the four things §1.3 promises: the name, the ledger, the defences, the hour.

**The purge** (R2-10, B12, R3-04, C3, C15). It moves on story events, never on time, and it never touches what a flag yields or anything on the critical path. **One order, used in all three documents:** flag 1 → the cage → the ledger shelf → flag 2 → the Recruiter's call → the tape deck.

1. **The cage** (after flag 1). Sorensen is behind the mesh feeding the shredder. Two bins, and HaX names what is in each: Derek's file and, on `m08_nightshade_tidied`, the copy Nightshade sent ahead, or by default the Initiative's correspondence with Social Fabric. One bin can be reached through the hatch now. Opening the cage (print and card) is the event: by the time it opens, the other bin is gone. Stopping Sorensen afterwards saves only what she hadn't reached: her office files, so the Reading's shelf mark comes the easy way.
2. **Flag 2.** The player reads the printed ledger at the shelf, learns WREN is on the raid team, and then Sorensen shreds it; nothing is lost, because the flag holds it. Nightshade's recruitment file is in a locked plan chest in the restricted stacks, on the critical path, and never purged.
3. **The tape deck** (as the Recruiter's call ends). The call comes after flag 2, so her offer never gives away a plant the ledger hasn't. As it ends, Tran's wipe starts on the deck that holds her file (a tape: her handler list, §2 row 60) and Tomb Alpha's tapes (the Architect's early annotations). The player can pull one from the drop terminal; the other is wiped. Taking her offer means pulling the Alpha tapes. Stopping Tran afterwards saves only the rest of the tape side (the Initiative's legacy recruitment interviews, optional lore).

HaX names what was lost, once.

### 6.2 m10: Tomb Gamma's network

Flag 1 at the forward post's terminal; flags 2 and 3 at the server-hall console; flag 4 at the core's host terminal, after Tesseract has stopped the clock (§4.1 step 0). The core holds one flag and the conversation (R2-02).

| Flag | Story meaning | Unlocks in game |
|---|---|---|
| 1 | **A foothold on the security monitoring host that the camera and door systems report to.** | Camera feeds, the blast-door route, and the door log (the whodunit's first clue). |
| 2 | **The staging copy of the schedule, kept on the security monitoring host.** The text beside the flag lists the channels (§4.2), the cells' early-access orders (Zero Day's among them, under Victoria's name or Vos's), and the first entries by city in plain words. | The server-hall console: the optional task to close the backdoor channel; the schedule readable; the evidence for the Victoria choice. |
| 3 | **Out of the release service's container onto the release host beneath it.** | The disarm action, armed at the server-hall console and carried to the core. Before it, HaX points at the bunker's own physical echo of the idea: the Cold War sealed section off the server hall, with a maintenance hatch into the machinery beneath it (R3-18). |
| 4 | **Full control of the core host**: the stolen copy, and the live line into the Citadel's vault. | The database options at the core (§4.1). |

Flags 1 and 2 are the earlier entry stage the brief asks for; 3 and 4 are the climax.

## 7. Teaser slot

- **Where.** m10 only, after the closing card and immediately before the final credits roll. A few seconds. It is the last thing before the credits on every ending, Join included.
- **What.** Decided later, by the user. Nothing in m09 or m10 sets it up, refers to it, or depends on it. No other eldritch content anywhere in either mission (brief, user decision 2026-10-20).
- **How it is built.** One extra step in the credits sequence (a short cutscene or a single credits card) behind one global, `teaser_enabled`, default `false`. With it false, the credits run straight after the closing card and nothing else changes. No voiced lines until the content is decided.
- **Constraints for whoever fills it.** No new characters from this season; no line that reads as a Season 1 loose end; it must make sense after all five endings.

## 8. Risks and open questions

Each has a default the later stages follow unless the user says otherwise.

| # | Risk or question | Default |
|---|---|---|
| 1 | **Import load.** 43 imports in m09 and 63 in m10 is far more than any earlier mission (m02 imports 3). | Tiered (§3, D-07, R2-09). Tier 1 is every import that changes a room (m09: 19, m10: 37), built first and covered by named route-driver profiles: a "kind" run, a "hard" run, a mixed run, a Mercer run, plus `none`, chosen at stage 8 to cover every Tier 1 condition and every slot in §5.3. Tier 2 is lines only, checked by the dialogue lint and a branch read-through. One shared include per mission declares them all. |
| 2 | **Players who start at m09** (Hacktivity can assign missions out of order). | The briefing's wall of cards is the "previously on", with a never-played version of every card and a "who is Tesseract" beat (row 57, D-15). Every scene is written default-first. At stage 2 a reviewer reads m09's default path with no other mission in mind. |
| 3 | **The two ink changes** (approved, F5) don't reach runs finished before them. | §3.3: the fallbacks are the read rule for every existing save. |
| 4 | **Join reached by accident**, or felt as a trap. | The offer is heard by everyone; Join starts only with an action, then two more confirmations (§4.3). A blind playtest at stage 8 checks that no tester reaches it without meaning to. |
| 5 | **Lethal force tone.** | Offered only when he reaches for the dead-man switch, never after a successful talk-down (§4.1 step 5). One narrated line, no detail; HaX's silence carries it. |
| 6 | **Length and crowding.** | m09 about 75 minutes, m10 about 100 (D-01). Five full-scene slots in m10, each on the main path and filled on every combination (§5.3); the rest are presences, props and lines. Nine playable rooms in m10 (D-16). |
| 7 | **The clocks.** Real time must never turn slowness at the VM into a story cost. | m09's purge moves on story events only (§6.1). m10's countdown also moves on story events (R3-02): it steps forward at each beat, is felt through what people say and the display, and costs nothing by wall-clock time. The head start goes only if the player leaves the server hall without stopping it; Seattle's batch goes only through a backdoor left open; the 06:00 fallback never fires before the core. Stage 4 sets the display's steps from the m07 timings. |
| 8 | **Local time.** 06:00 UTC on day 13 is around midnight in Montana, not dawn there. | Every in-game clock and line uses UTC, as the Citadel does; no line mentions dawn in local time. §1.5's "before dawn" is read as the Citadel's dawn. |
| 9 | **The Architect in person.** He has been a voice since m01. Seeing him could shrink him. | He is shown only in the core, seated, with a reason to wait (§1.2). His origin stays unplaced, as the voice bible keeps it (A15). His portrait is chosen with the user at the character stage. |
| 10 | **"Disclose" as a database option.** | Approved (F6). Each of the three options carries a cost said on the line before the choice (§4.1). |
| 11 | **SAFETYNET's master reachable from the bunker.** | Approved as canon (F7). SAFETYNET left the line open on purpose as a trace (D-13); stage 6 writes it into the Citadel's incident file. |
| 12 | **The sleeper's betrayal hurts Quintero**, and a wrong accusation costs an innocent officer's place. Neither must feel like punishment. | Wounded, never killed. Three clues spread across the bunker are always enough to accuse correctly; HaX nudges after each; a wrong accusation is visible (the officer's line) and can be undone by recalling the officer on new evidence (§4.4). |
| 13 | **m10's VM needs an earlier stage** (brief). | §6.2 gives flags 1–2 their story; the Haiku VM plan fits the modules to them. If it cannot, flag 1 moves to the security office terminal and the meanings stay. |
| 14 | **Titles and ids.** | m09 keeps *Digital Archaeology*. m10 is *Full Disclosure* (user choice, 2026-10-20), id `m10_full_disclosure`; the orchestrator renames the folder. m10's `importGlobals` entries for m09 use m09's final folder name. |
| 15 | **The Recruiter stays faceless.** | Yes, phone only, as in m05. She is named in the closing card on `named` or `double_crossed` (§4.6's one rule), but never caught or seen; she is left for a later season. |
| 16 | **New sprites**: Tesseract, Sorensen, Haddad, Tran, Old Coyote, Quintero, Kowalczyk, Asante, Malhotra, Arakawa, Vos. | Eleven new characters across two missions, made through the usual pipeline at stage 9; the user approves each look first. Malhotra and Arakawa may use varied generic sprites if the budget is tight. |
| 17 | **New canon about Tesseract's past** (A16). He recruited Nightshade at 23 while still SAFETYNET's chief strategist (m08's "the man who put me here fifteen years ago"), so he was working for ENTROPY's ends eight years before he "walked out over a disagreement". | Kept, because m08 already implies it. Stage 6 adds it to `the_architect.md`'s identity section: the disagreement was real and the departure was also cover. The user may want to confirm. |
| 18 | **m09's purge** could make the investigation feel punishing. | Event-driven, visible, and two save-this-or-that choices (§6.1). Only optional finds are losable; stopping Sorensen or Tran saves that side's pair; HaX names what was lost, once. |
| 19 | **The Albion flaw is new detail on m04** (B4). m04 speaks only of "the holes it came through". | Written as one of those holes (the plant's control equipment), catalogued nine years ago. Stage 6 keeps it apart from the player's own way into the m04 VM, which HaX called brand new. |
| 20 | **Ghost every player** (never-played m02 included). | Ghost is at large on every m02 branch, so a stranger Ghost selling the head start is canon-safe. |

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
- **m09 exports seven values** (`nightshade_shown_file`, `sleeper_named`, `recruiter_secret`, `recruiter_offer`, `reading_finished`, `albion_notified`, `hax_confession_answer`; §3.4). Each has a concrete m10 use; `recruiter_secret` folds m05's confession and m09's call into one value.
- **m10 exports seven values for a later season** (§3.5). Cheap now; an ink change later.
- **All endings after flag 4.** One `concludeRequires` for every ending, and the endings are choices, not failures of the technical work.
- **Stopping the Publication is one console action, unopposed, because he wants a SAFETYNET hand on the key** (round 1, D-02). Explains the invitation, the keyed blast door, the seat at the console and the Join offer in one motive; the 06:00 fallback keeps the clock.
- **Talk-down needs two visible points, with three of the mission's own arguments always available** (D-20). Winnable by any player; carry-overs are options the player chooses.
- **His opening case uses three record lines at most, by priority** (D-08). The rest became the player's options, so the player brings up their own history.
- **"Disclose" kept as a success-path database option** (approved, F6), **with a stated cost for every option** (D-05): secure leaves flaws live, disclose burns two operations, wipe both fixes nothing.
- **Live line into the Citadel's vault, left open on purpose as a trace** (approved canon, F7; D-13).
- **Scorched Earth's chaos is his own dead-man purge** (D-12): the one outcome where he can't win the argument, wired to cover his exit.
- **Lethal force only when he reaches for a dead-man switch, and never after a successful talk-down** (D-11). Keeps the ending (F1) without shooting a seated, unarmed man.
- **Every player hears the offer; Join starts only with an action, then two more confirmations** (D-21). Listening to the villain must not be a step towards betrayal; m01's LAUNCH button is the precedent.
- **Partial release comes from the m07 backdoor, not from failure or the clock.** The backdoor is present on `m07_completed and (m07_team_assignment != "trojan_horse" or m07_team_redirected)` (A1, B1).
- **Clocks never fail a mission**, in m10 (the fallback) or m09 (the purge). "Fun and educational, not hard."
- **Every presence import has a default occupant, and every at-large value that equals a default also needs `completed`** (A5).
- **Five full returning scenes in m10 (Nightshade, Victoria, Voltage, Ghost, Gary); the rest are presences, props or lines** (D-01). The five carry the most player choices each; Mercer, Reeves and Hollis become presence and props.
- **Lengths: m09 about 75 minutes, m10 about 100** (D-01, orchestrator). The old outline's ranges; m07 ships at 90.
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
- **HaX's meaning of the line is told in m09.** It makes the line the player's own argument in m10 (row 120).
- **Netherton says the name in m09 (row 125)**, in words that work whether or not the player heard his optional m08 pledge (A27, B5). The scene where the proof comes together is his.
- **New cast varied in age, background and sex**, clear of the Chen/Reeves/Park/Okafor/Wierzbicki clashes, every name grepped (A2, D-19).
- **Mercer's absence filled by Asante, not an empty hall.** The server hall needs someone who can explain the release.
- **The two dead agents named (Fraser, Ferreira).** Row 100 has Netherton read the names, so they need names.
- **Teaser behind a default-off global.** Planned slot, no dependency (brief).
- **Clocks in UTC only.** Avoids the local-midnight/dawn mismatch in §1.5.
- **Titles: m09 *Digital Archaeology* (kept); m10 *Full Disclosure*** (user's choice, 2026-10-20; "Tomb Gamma" declined, F8), id `m10_full_disclosure`.

**Round 2** (orchestrator decisions applied as given; the rest are mine):

- **Every won branch puts a person in the bunker; five slots filled on every combination** (R2-01, orchestrator). Captured Voltage on the plant phone, protected Gary as consultant, arrested Nightshade in cuffs with a deal, arrested Victoria bargaining from custody, Ghost for everyone. A careful player's m10 is as full as a careless one's.
- **Pieter Vos fills Victoria's desk** when she is KO'd or never met. Pays m03's "filled by Monday" and keeps the gallery a scene on every branch.
- **He stops the clock when 0x00 walks in; flag 3 moves to the server hall** (R2-02, orchestrator). The climax is talk and choices; the clock presses on the raid only.
- **He refuses WREN at the key** (R2-03). Turns the hole in his motive into its clearest statement.
- **Three clues, an alibi and the player's own cracker serial; a wrong accusation is visible and undoable; a knock-out is not an accusation** (R2-04, R2-06, orchestrator).
- **WREN came in through Harwick & Lowe, an older front** (B3, orchestrator). SAFETYNET has known TalentStack since m05; an older firm explains the miss.
- **The head start goes out at 04:00, on the same clock** (R2-08). The cells' fate becomes a payoff of m02 and m03 choices.
- **Tier 1 is every import that changes a room; Tier 2 is lines only** (R2-09, orchestrator). m09 19 + 24, m10 37 + 25 (26 after round 3 added `m05_final_choice` for C2).
- **The purge runs on story events, with two save-one choices** (R2-10, orchestrator). VM speed costs nothing; the loss is one the player picked.
- **m10 gets a cold-start briefing; never-played canon is stated once and matches the defaults** (R2-11, R2-16, B1, B2).
- **Disclose burns operations the player knows; the player sends Tesseract's unsent vendor notice in m09** (R2-12, orchestrator). Secure gains the operations; disclose costs them; coordinated disclosure is done once in play before the menu.
- **The power room is on the main path** (R2-13): the gallery's shutter runs off it. (Called "the plant room" before round 3.)
- **The talk-down is three exchanges, only the matching answer lands, two of three to win** (R2-15). Weak answers are visibly weak.
- **HaX's confession gets an answer that decides whether she speaks at the core** (R2-19).
- **The Recruiter's file holds the handler list; her name is always right; the double-cross is allowed** (R2-20).
- **Ghost rings the server hall and is selling the head start; the parley's fact opens a window past the outer lock** (R2-21, weak Tier 1 #3).
- **The Albion flaw is one of m04's holes, catalogued nine years ago** (B4, R2-07, orchestrator).
- **Hollis's prop stays on `evaded` only** (B9). One value, no new export, for a prop.
- **VM wording follows the orchestrator's story-level text** (two machines in m09; m10 flags 1–3 reworded). The VM plan itself stays with the Haiku agent.

**Round 3** (orchestrator decisions applied as given; the rest are mine):

- **Each won branch gets one decision and one face-to-face beat; one non-HaX voice per room** (R3-01, orchestrator). Captured Voltage: walk him to his switchgear or keep him on the phone. Protected Gary: in person at the workshop, talk round or take in the technician he trained. Refused Ghost: a question back, then the window or a camera blind. Arrested Victoria: face to face at the forward post. Arrested Nightshade's deal knows the player said "no deals".
- **The raid countdown runs on story events** (R3-02, orchestrator). The head start goes only if the player leaves the server hall without stopping it; Seattle's batch only through an open backdoor; 06:00 never fires before the core.
- **The purge choice is forced by an event** (R3-04, orchestrator): the cage opening takes the other bin; the end of the Recruiter's call starts the wipe. Stopping the person saves only what is left. Her offer and the tape-deck choice are one decision.
- **One purge order in all three documents: flag 2 before her call** (C3, orchestrator). The ledger reveals WREN before the Recruiter can offer her name.
- **02:10 is a pre-breach recon split; the readers accept SAFETYNET badges because he loaded them from the stolen database; WREN propped the service door for her own exit** (R3-03, C4, orchestrator). Quintero and Kowalczyk took the tunnel; Arakawa was at the fence with the player.
- **m07's never-played canon is "one team, four sites; Austin reached; two of ours died at the others"** (C1, orchestrator). Matches m08's shipped line and row 100. Gameplay defaults kept; the dark media room now has its own reason.
- **The Recruiter's "network" is gated by m05** (C2, orchestrator): placements by default, handlers and the forty-seven on exposure, Torres' missing names on the turned branch. m10 imports `m05_final_choice` for the epilogue.
- **Disclose's defaults are operations still live after the raid (the handler watch, the Zero Day broker tap), and every database option has an epilogue scene beat** (R3-05, orchestrator).
- **The double-cross rolls up only part of her network** (R3-07). Three answers, three outcomes.
- **Ghost's handset moves to the security office** (R3-12). One scene per room.
- **The notice is nine years late** (C11, R3-11). It was drafted with the memo.
- **"Power room", never "plant", for the room in player-facing text** (R3-10).
- **The safe-opened branch gets its own HaX confession; `should_have_told` gets its own beat at the core** (C18, R3-16). Neither answer is punished.
- **L+ is defined as a scene-shaping line built with Tier 1** (C16). Tier 1 counts unchanged.

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

## 13. Handover to stage 1

The design reviewer's 23-item list, merged with what round 3 deferred, deduplicated. Each item has an owner stage, and a status where stage 0 has already settled the design.

| # | Item | Status | Owner |
|---|---|---|---|
| 1 | The night's UTC timeline and how the countdown display steps with story beats | Settled in design (§4.0, §4.2); the display's step values remain | Stage 4 |
| 2 | Why the readers log SAFETYNET badges; what WREN did at 02:10 | Settled (§4.0); write the lines | Stage 1, then 7 |
| 3 | What Kowalczyk's cracker is for, and whether every SAFETYNET cracker comes from Tomb Gamma's bench (row 29 implies all, a large canon claim about SAFETYNET's supply chain) | Open. Default: only the crackers Nightshade signed out came from the bench | Stage 1; canon note at stage 6 |
| 4 | A beat and a reason for suspicion for Quintero, Malhotra and Arakawa (R3-13), for example Quintero argued against going in tonight | Open | Stage 1 |
| 5 | WREN's entrance at step 3, the knock-out case, Vector and Phantom in the alibi | Settled (§4.1, §4.4); write the scene | Stage 1, then 7 |
| 6 | The purge's event order and the moment of each choice | Settled (§6.1) | – |
| 7 | The Recruiter's file on tape; the double-cross's cost | Settled (row 60, §6.1); the choice's wording | Stage 3 |
| 8 | The default source of the archive's company name for a player with none of the branch sources | Open. Default: Nightshade's Helena ticket plus the courier address on the intercepted purge order | Stage 1 |
| 9 | The identity scene's load (flag 3, the handwriting, Netherton's name, HaX's confession and answer, the optional notice at one terminal); whether the notice moves to a later beat | Open | Stage 1 |
| 10 | "Seven" or "nine" years late | Settled: nine (§1.3) | – |
| 11 | The won-branch decision and face-to-face beat for each slot; one non-HaX voice per room | Settled (§4.4, §5.3); write the scenes | Stages 1–2 |
| 12 | Event-driven clock; §8 r7 rewritten | Settled (§4.2, §8 r7) | Stage 4 for the steps |
| 13 | Who is physically in the workshop and the power room on won branches | Settled: the default technicians stay in both rooms; Gary or Voltage join them | Stage 5 for placement |
| 14 | Disclose's live default operations and an epilogue beat per database option | Settled (§4.1, §4.6); costs finished | Stage 3, lines at stage 7 |
| 15 | The casualty-sheet correction on the path, the decode as a bonus | Settled (§4.1) | – |
| 16 | The "who is Tesseract" sentence in m10's cold start | Settled (§4.0) | Stage 2 reads it cold |
| 17 | Ghost's handset location | Settled: the security office (§4.0) | – |
| 18 | Tesseract's idle lines during flag 4, on VM progress | Rule settled (§4.1); the lines | Stage 7 |
| 19 | Why he pauses the cells' push too | Moot under R3-02: the push goes or is stopped at the server hall before he pauses the clock. Optional beat for stage 1: he tells the player he let it go because the cells were always scenery | Stage 1 (optional) |
| 20 | HaX's `should_have_told` beat at the core | Settled (§5.4); write it | Stage 7 |
| 21 | Player-facing names: "WREN"/"the sleeper", "the power room" | Settled (§4.0); enforce in the lint read | Stage 7 |
| 22 | The five missing checklist lines | Done in both stage 0 §7 | – |
| 23 | An act-by-act time budget for m10 against m07's timings, and the order in which optional content is cut if it runs long (media room, then the backdoor task) | Open | Stage 4 |
| 24 | Escaped Victoria without the m03 threat "recognises the player and leaves": give it a beat so it isn't the thinnest gallery branch | Open | Stage 1 |

