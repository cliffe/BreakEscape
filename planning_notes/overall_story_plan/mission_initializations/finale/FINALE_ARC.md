# Finale arc: m09 and m10

Stage 0, shared document for both finale missions. Author: stage-0 author (Opus), 2026-10-20. Status: draft for review round 1.

Inputs: `docs/agents/FINALE_BRIEF.md`, the two carry-over inventories in this folder (A: m01–m04, B: m05–m08), `season_1_arc.md` Missions 9–10 (old intent only), `the_architect.md` identity section, m08's closing debrief ink. Per-mission stage 0 files point back here rather than repeating it:

- `../m09_digital_archaeology/stages/stage_0_initialization.md`
- `../m10_final_cipher/stages/stage_0_initialization.md`

The VM plan is written separately (`finale/FINALE_VM_PLAN.md`, by a Haiku agent). This document gives each flag's story meaning and where it is submitted, nothing more.

## 1. The shape of the finale

### 1.1 Where the player starts

m08 ends on day nine after Portland. Nightshade is in police hands, kept as a triple agent, or (rarely) handed over silent after a knock-out. The Global Threat Database, "every vulnerability SAFETYNET has ever catalogued", went to Tomb Gamma. Netherton: "Take your seventy-two hours. Then we go to Montana and we get it back." The coordinate (an old Cold War bunker in Montana) is known on every route except the knock-out before the fate. Nobody has said Tesseract's name aloud. HaX's last text: "Same classroom, 0x00. Don't ask me whose yet."

So the finale owes the player four things: the name, said aloud and proved; the bunker; the database; and a reckoning with eight missions of their own choices.

### 1.2 What the Architect is doing: the Publication

He did not steal the database to sell it. The old outline's "global vulnerability auction" makes him a dealer, and nothing in m01–m08 sounds like a dealer. Every directive he has signed ends the same way: "Entropy is inevitable. Systems decay. I merely publish the schedule. -- A." (m07 decode).

**The Publication:** at a set hour, Tomb Gamma releases the whole stolen database to everyone at once, free, every entry with working detail. His case is the one he left SAFETYNET over: services like SAFETYNET hoard weaknesses instead of getting them fixed, the arms race speeds up the collapse it claims to prevent, and only a shock everyone feels at once forces the fix. "Let it hurt afterwards, not during" turned inside out: let it hurt now, everywhere, so that afterwards no one can hoard.

He has costed it, as he costs everything. His projection, signed in his hand: 1,100–2,600 dead in the first month as hospitals, grids and dispatch centres are hit by people who never had the skill before. "An acceptable price for the last arms race." That is the escalated canon's true believer with a spreadsheet, and it is also a real argument about vulnerability disclosure, which is the educational spine of the finale (responsible disclosure vs hoarding vs full release).

Why this works for the season:
- It explains the four-site night as theatre for the theft (m08) without retconning m07's "he measured you" reading: both were true.
- It makes the m02 Ghost ("Not the money. The lesson") and the m04 disclosure call into the same argument the player now has with the man who started it.
- It gives Scorched Earth a real logic: destroy both copies and nobody holds the map, SAFETYNET included.
- It gives Join ENTROPY a real logic: a player who agrees with him can press the button.

### 1.3 Purpose of each mission

**m09 Digital Archaeology: the name and the way in.** The day after the leave is cut short, the player goes to Helena, Montana, to a commercial records archive that holds the bunker's deeds and construction file. It is also where the Insider Threat Initiative keeps its records, and where the Architect stored the papers of his two closed workshops, Tomb Alpha and Tomb Beta. The player digs through decommissioned records (paper stacks, a tape room, the archive's servers) to (1) confirm the Architect is Dr Adrian Tesseract, from his own hand; (2) find the Initiative's ledger of placements, which names a sleeper inside SAFETYNET; (3) get the plans of Tomb Gamma's defences; (4) learn the Publication's hour. It ends with Tesseract's first call to HaX, and the raid order.

Feel: investigation, quiet dread, a building full of other people's secrets including the player's own. Light combat. The player's file is in the archive.

**m10 Tomb Gamma (working id `m10_final_cipher`): the raid and the reckoning.** Task Force Null goes into the bunker the night before the Publication. The player's history decides which doors are already open, who is on the inside, who is waiting, and who turns. At the core they meet Tesseract in person, stop or allow the Publication, decide what happens to both copies of the database, and decide how it ends for him.

Feel: the season's biggest set piece, a siege in a Cold War bunker, with faces from every earlier mission. Not hard: every route works with all defaults, and the carry-overs mostly add help.

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
| 11 | m09: leave cut short. Night operation at the Helena archive. Ends with the Publication hour: 06:00 UTC on day 13. |
| 12, night | m10: the raid on Tomb Gamma, with the Publication due before dawn. |
| After | Epilogue in each ending; then the teaser slot; then credits. |

Dispatch in eleven counties has been dropping calls since day nine for every player who didn't cover Austin in m07. That keeps running through both missions and is part of the stakes (§2, m07).

### 1.6 Tone and difficulty

TV spy thriller, season finale. Violence at that level and brief: knock-outs, one lethal-force choice described in a line. No eldritch content anywhere, except the optional teaser (§7). Fun and educational, not hard: carry-overs add routes and help far more often than they add obstacles, and every obstacle a carry-over adds has an in-mission way round.

## 2. Thread allocation

One row per decision or thread from both inventories. **Pays off**: m09, m10, both, epilogue (the m10 debrief and closing beats), or dropped (with the reason). **Weight**: H / M / L, how much the player feels it. **Import** gives the name in the reading mission; a ✱ means the source mission must add it to `exportGlobals` first (§3.3), ✱✱ means that also needs an ink change, which goes to the user.

Three devices carry most of the payoffs, so the player meets their history as things happening, not a debrief roll-call:

- **The Reading** (m09). The Architect's own file on Agent 0x00 sits in the archive: his reading of the player, the thing he promised in m07 ("You'll have the figures too"). The player reads it at a terminal (object ink, branch per import, fixed strings, narrator voice or unvoiced). It is the one place that lists, and it lists in his voice, as evidence against the player. Everything it mentions comes back in person in m10.
- **Who is in the bunker** (m10). Earlier fates decide which faces are on the inside: Ghost on the network, Voltage at the power plant, Mercer, Gary, Reeves, Victoria. Each is an extra helper or obstacle on top of a route that works without them.
- **Tesseract's case against the player** (m10 confrontation). He argues from the player's own record. The player's answers draw on the same record. Choices from m01–m08 become arguments the player can use (extra options in the talk-down), never requirements.

### 2.1 m01 First Contact

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 1 | `final_choice` (fight / arrest / recruit / expose / surrender / KO) | both | m09: Derek's file in the archive, written before Viral Dynamics, costing his fall. On surrender it answers "he still hasn't told us why": the Architect had ordered him to surrender if caught and wait. On expose, the file notes the coverage did ENTROPY's recruiting. m10: Tesseract opens his case with the player's first mission, one fixed line per value ("You beat a marketing manager and called it a war." / "You read him his rights. He kept his promise to me and said nothing."). | H | `m01_final_choice` |
| 2 | `player_launched_attack` | m10 | Tesseract: "You pressed it once, on your first day. You know what it costs, and you know you could press it." He offers the Publication button to that player first and most directly; the Join signposting (§4.3) still applies. | H | `m01_player_launched_attack` |
| 3 | `player_aborted_attack` | dropped | The normal win; carries nothing that `final_choice` doesn't. Fold into #1's neutral line. | – | – |
| 4 | `found_casualty_projections` | m09 | The Reading: "Agent picked up the projection and read it. Most don't." A single line; the m10 casualty sheet for the Publication is laid out the same way, and HaX says so on that branch. | L | `m01_found_casualty_projections` |
| 5 | `kevin_choice` | m09 | The Reading notes whether the agent protected the man Derek framed. On `wrongly_accused`: "Accused the scapegoat. Promising." Read in Tesseract's dry voice, it lands as a sting. | L | `m01_kevin_choice` |
| 6 | `maya_ko`, `kevin_ko`, `sarah_ko` (innocents hurt on day one) | both | m09: HaX's m01 promise ("that gap shows up") finally shows: Maya's lost intelligence was the Social Fabric names that would have flagged one archive staffer; on `maya_ko` that staffer is a surprise obstacle (an extra guard call-in, avoidable), otherwise HaX warns the player ahead. m10: Tesseract: "Not one bystander, in eight operations. I confess that surprised me." vs "You hurt a receptionist on your first day. We are not so different." | M | `m01_maya_ko` ✱ `m01_kevin_ko` ✱ `m01_sarah_ko` ✱ |
| 7 | `confrontation_approach`, `operation_shatter_reported` | dropped | Minor tone flags; no story outcome to pay. | – | – |
| 8 | Derek's unexplained surrender | m09 | Covered by #1 (the standing order in his file). | M | (row 1) |
| 9 | "The Architect planned for this" | m09 | Derek's file shows it literally: a plan for his fall, dated before he was hired. | M | none (every player) |
| 10 | Kevin's frame-up | dropped | Settled in m01's debrief; #5 gives it a line. | – | – |
| 11 | Social Fabric status; unnamed leader | m10 | Social Fabric's crew run the bunker's media room on uncovered-Fracture branches (m07 row). The leader stays unnamed: naming a new mastermind in the last hour is clutter. | L | via `m07_team_assignment` |
| 12 | Expose side effect, "they know what we know" | m09 | The Reading quotes the press coverage the player caused; one line. | L | `m01_final_choice` |

### 2.2 m02 Ransomed Trust

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 13 | Ghost at large; `ghost_deal_accepted` + `exposed_hospital` (deal kept) | m10 | Ghost is on the bunker's network (selling the Publication's "early access" to its own cell, or watching). Deal kept: Ghost's terminal opens a side door: "You kept your word. I keep mine." An extra route, never the only one. | H | `m02_ghost_deal_accepted`, `m02_exposed_hospital` |
| 14 | Deal broken (`ghost_deal_accepted`, not exposed) | m10 | Ghost locks that side door and says why: "You'll remember I said I'd remember." The main route is unaffected; the player feels the closed door. | H | same |
| 15 | `ghost_deal_refused` | m10 | Ghost offers the parley it promised in m02: "I hope it's you leading it." A short terminal exchange; Ghost gives one fact (the hour the core's guard changes) and leaves the network for good. | M | `m02_ghost_deal_refused` ✱ |
| 16 | `ghost_keys_used` | m10 | Ghost has been inside networks since St. Catherine's: one of Tomb Gamma's systems shows a Ghost signature, and HaX knows it from m02. Extra intel line, plus an obstacle (Ghost watches the player's route) if the deal was also broken. | M | `m02_ghost_keys_used` |
| 17 | `paid_ransom` | m09 | The ransom money surfaces in the archive's ledgers: St. Catherine's payment helped pay the bunker's refit. HaX reads the date. | M | `m02_paid_ransom` |
| 18 | `ward_recovering` | dropped | Derived from the three above; adds no new fact. | – | – |
| 19 | `bed4_manually_stabilised` / `patient_bed4_deceased` | m10 | Tesseract's case: on a saved Pryce, "You knelt by a stranger's bed and squeezed a bag for an hour. You don't believe in acceptable costs. That is your weakness." On deceased: "Six died at St. Catherine's. You chose the clean restore. You understand costing." One line, and it becomes a talk-down argument either way. | M | `m02_bed4_manually_stabilised`, `m02_patient_bed4_deceased` |
| 20 | `exposed_hospital` (on its own) | m10 | Disclosure is the finale's argument. A player who published the board's cover-up gets a talk-down option: "I told the truth when it cost. It fixed forty hospitals. Nobody died for it." | H | `m02_exposed_hospital` |
| 21 | Graham Reeves' fate | m10 | Escaped / never caught: Reeves is on the bunker's door rota, courteous: "You should have looked harder." He can be talked past or knocked out. Arrested / exposed / KO'd: his handler's contact sheet is one of the papers m09 already holds (HaX: "Reeves' handler, from the hospital"). Kept apart from Michael Reeves: no relation, and Graham says so if asked. | M | `m02_reeves_fate` ✱✱ (derived global in m02's debrief) |
| 22 | `insider_asset_arrested` / `insider_asset_escaped` | m10 | Fallback for #21 if the ink change is refused: escaped → on the rota; arrested → absent. "Never caught" then reads as absent. | M | `m02_insider_asset_arrested`, `m02_insider_asset_escaped` |
| 23 | `gary_protected` | both | m09, protected: Gary Whitlock, now a Director of Cyber Security, is the outside expert on the phone who recognises the archive's set-up; he says "Tell your handler I got my career back." m10, unprotected and quiet (and m02 played, and not exposed): Gary is a technician in the bunker, recruited by the Initiative. The player meets him in person; he can be talked into opening the plant-room door ("Seven warnings, nobody listened. You're listening now?"). HaX's m02 line comes back on that branch. | H | `m02_gary_protected` ✱, `m02_exposed_hospital`, `m02_completed` |
| 24 | `kim_guilt_revealed`, `advised_board_pay/refuse` | dropped | Dr Kim's arc closed in m02; her epilogue is complete. No place in a bunker for her. | – | – |
| 25 | `accused_wrong_suspect` / `val_accused` | dropped | Covered by Reeves' "never caught" branch (#21), which is the consequence. | – | – |
| 26 | `patient_assaulted` | m09 | The Reading, one line: "Struck a patient on a ward." Tesseract repeats it in m10 only if also listed in #6's innocents line. | L | `m02_patient_assaulted` ✱ |
| 27 | Staff KOs (Val, Gary, Kim, nurses, Bernie) | dropped | Rolled into the innocents line (#6) only through `patient_assaulted`; exporting six more names for one line is poor value. | – | – |
| 28 | `cover_burned` | dropped | Minor; the player is burned anyway by m08. | – | – |
| 29 | Supply chain: who makes the PIN crackers | m10 | Tomb Gamma's workshop floor has the bench where they are made (racks of them). The player, finally carrying one (m09 issues it), sees where it came from. Nightshade's "I chose what you went in without" pays here. | M | none (every player) |
| 30 | Ransomware Incorporated status | m10 | Covered by Ghost (#13–16). Epilogue: Ghost "clean exit, no trace" again, unless the parley ran, in which case Ghost sends one last message. | L | as #13–16 |
| 31 | "Not the money. The lesson." / "They're not wrong about the problem." | m10 | Tesseract uses Ghost's own words; HaX, on the line, remembers saying the second one. The season's moral question is now the confrontation's. | M | none |

### 2.3 m03 Ghost in the Machine

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 32 | `victoria_fate = recruited` (turned Zero Day insider, never used) | both | m09: her first package (the Architect's comms protocols) is how SAFETYNET reads the archive's internal mail, an extra route to the restricted stacks. m10: she is inside the bunker as Zero Day's representative at the Publication. HaX's "whether she stays turned is anyone's guess" is answered by the player's m03 conduct: if `sterling_on_call_seen` she sells the raid to Tesseract at the worst moment (an alarm, avoidable with a warning from a kept Nightshade or by trusting HaX's doubt); otherwise she holds and opens the core's outer lock. | H | `m03_victoria_fate`, `m03_sterling_on_call_seen` ✱ |
| 33 | `victoria_fate = escaped` | m10 | She is at the bunker as a buyer's agent and keeps the promise "I said I'd do it myself. I still might" (only if `sterling_on_call_seen`): a short stand-off in the gallery, talk-down or KO, one minute. Without the threat she simply recognises the player and leaves. | H | same |
| 34 | `victoria_fate = arrested` | m09 | Her CPS case gives Netherton the legal cover for the raid; one Netherton line in the m09 briefing. Her keys opened Zero Day's client database in m03, which is how the archive's company name was found. | M | `m03_victoria_fate` |
| 35 | `victoria_fate = ko` | m09 | "She woke up in time to give one name": the archive's company name. Same fact as #34 by a different road. | L | same |
| 36 | `danny_fate` / `danny_ko` | m09 | Protected or exposed: his survey methods match a document in the archive; HaX: "Danny's statement just became evidence." Left: the archive holds Zero Day's note on him ("loose end, resolved"); HaX checks; he is alive, hiding, and she says so with relief. KO / never found: no line. | L | `m03_danny_fate`, `m03_danny_ko` |
| 37 | `directive_decoded` | m09 | The Architect's annotation style is recognisable to a player who decoded the Phase 2 directive themselves; HaX: "You've read his hand before. Sterling's drive." Extra line in the identity scene. | L | `m03_directive_decoded` |
| 38 | `guard_bribed` (Terry Mott's £500) | m10 | Finance's query about the £500 reaches HaX mid-raid, at a quiet moment. One line of relief. | L | `m03_guard_bribed` |
| 39 | `guard_told_safetynet`, Terry and Ffion KOs | dropped | Minor; the Reading already lists innocents through m01/m02 values. Five more exports for one line is poor value. | – | – |
| 40 | `named_target_selection`, `defended_danny`, `called_it_murder`, `handler_trust` | dropped | Small stance flags inside m03's own scenes; no finale scene would read differently. | – | – |
| 41 | "St. Catherine's was a proof of concept. You'll see the rest." | m10 | Victoria on the escaped branch repeats it at the bunker: "This is the rest." | L | (row 33) |
| 42 | "I'm a desk. They'll have it filled by Monday." (Zero Day survives; 0day untouched) | epilogue | Zero Day's status in the closing card; 0day stays unmet (a Season 2 thread, not a finale clutter). | L | none |
| 43 | "When do we go at the Architect directly?" | m09 | HaX answers it in the m09 briefing: "Now." | M | none |

### 2.4 m04 Critical Failure

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 44 | `voltage_captured` (interrogation never shown) | m10 | Voltage wanted someone to check his sums. SAFETYNET did, and he gave the bunker's power layout: the m10 briefing map has the plant room marked, and HaX: "From Voltage. He wanted his figures checked. We checked them." An extra route through the plant. | H | `m04_voltage_captured` |
| 45 | `voltage_escaped` | m10 | Voltage runs Tomb Gamma's power plant. The player meets him at the switchgear. If his print was lifted at Albion, the player can prove the bypass was his and he stands down ("It'll be waiting." It was.). Otherwise a fight or a talk. | H | `m04_voltage_escaped`, `m04_voltage_print_on_bypass` ✱ |
| 46 | `static_left` / `static_left_alone` | m10 | Static is with Voltage at the plant (one more hostile). | L | `m04_static_left` ✱ |
| 47 | `casualties_occurred` / `crew_lost` | m10 | Tesseract has read the Albion inquiry; on `crew_lost` the nine crew are a line in his ledger, and he reads the count to the player. A harder conversation, not a harder level. | M | `m04_crew_lost`, `m04_casualties_occurred` |
| 48 | `disclosure_choice` (full / partial / quiet) | m10 | The finale's argument. Full: Tesseract: "You told them the truth, and they audited every site. That was my lesson, delivered by you." It becomes the player's strongest talk-down option ("And nobody died for it"). Quiet: "You buried it. You understand me better than you admit." | H | `m04_disclosure_choice` |
| 49 | `crew_warned` | dropped | Implied by #47; no extra export. | – | – |
| 50 | `vance_is_ally` | m10 | Robert Vance on the phone at the bunker's battery plant: the Teesside engineer talks the player through the old Cold War switchgear, in his own voice. Extra helper on the plant route. | M | `m04_vance_is_ally` ✱ |
| 51 | `robert_vance_ko` | m10 | HaX: "I rang Vance. He said no. He said you'd know why." | L | `m04_robert_vance_ko` ✱ |
| 52 | `promised_voltage_alive` | dropped | Only bites if Voltage then died, which can't happen in m04. | – | – |
| 53 | `voltage_print_on_bypass` | m10 | See #45. | M | ✱ |
| 54 | `cipher_walked`, operatives defeated | dropped | Minor operatives; no slot in the bunker that wouldn't be clutter. | – | – |
| 55 | Calder Wharf, Social Fabric's safehouse | m09 | Cold open of the m09 briefing: Task Force Null finally raided it on day ten. Found by the player in m04: "Your card from Albion. We went in yesterday." It is where the Helena archive's courier address came from. Not found: "Somebody cleaned Calder Wharf out a week ago." Either way the Helena lead comes from elsewhere too (§1.4). | M | `m04_lore_safehouse_address_found` ✱ |
| 56 | "Six cities" | dropped | Paid off by m07. | – | – |
| 57 | Task Force Null | both | m09's briefing is held in Task Force Null's room. The wall: one card per earlier mission, in the player's own outcomes (art and object text, no dialogue cost), the m07 decode's "-- A." at the top. m10 is Task Force Null's operation. | M | several, via object variants (§3.1) |
| 58 | "Above him it stops being a person you can arrest" | m10 | Answered in the ending choice: arrest, surrender, or lethal force. On `voltage_captured`, HaX quotes it before the core door. | M | none |
| 59 | Disclosure fallout (inquest, Parliament) | epilogue | One line in the closing card on full disclosure: the funding question finally answered. | L | `m04_disclosure_choice` |

### 2.5 m05 Insider Trading

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 60 | The Recruiter (free, "the next one might cost me more") | m09 | m09's ENTROPY cell is hers: the Helena archive is the Insider Threat Initiative's records office. She rings the player's handset in m09 (phone only, as in m05) once they are inside her stacks. Every player gets the call; what she says depends on #61–62. | H | none for presence |
| 61 | `recruiter_deal_accepted` + `recruiter_deal_confessed` | m09 | Sold and lied: she rings with the receipt ("Forty-seven names, and nothing points at you. Does your handler know?"), and HaX is on the line. The player chooses there and then to tell HaX or hang up; HaX's response follows (exported to m10). Sold and confessed: HaX cuts in first: "We've talked about that. She has nothing on you." The Recruiter's leverage dies on the line. | H | `m05_recruiter_deal_accepted`, `m05_recruiter_deal_confessed` ✱ |
| 62 | `found_pipeline_list` (list kept from her) | both | m09: SAFETYNET warned the forty-seven; one of them, Noor Haddad (§5.2), works in the archive and helps the player (a door, a warning) because SAFETYNET reached her first. m10: the epilogue says how many of the forty-seven were reached. | M | `m05_found_pipeline_list` ✱ |
| 63 | The forty-seven / twenty-three placements | m09 | The Initiative's ledger (VM flag 2) holds the placements, including one inside SAFETYNET (the sleeper, §2.8 row "other sleepers"). The m05 thread and the m08 thread become one document. | H | none |
| 64 | `final_choice` (Torres) / `torres_turned` | m09 | Turned: Torres' Initiative intelligence named the Helena archive's cover company months ago; nobody connected it until now. HaX: "Torres gave us this address in the spring. It was a line in a list." Dead (`combat_lethal`): the gap shows: the sleeper's entry in the ledger is the one Torres would have named; the player has to find it the long way (no harder, one more read). | M | `m05_final_choice`, `m05_torres_turned` |
| 65 | `elena_treatment_funded` | epilogue | One line in the closing card: Elena Torres' treatment. | L | `m05_elena_treatment_funded` |
| 66 | `entropy_program_exposed` / Netherton's two o'clock / "we'll be watching for their reply" | m10 | The reply arrives: on exposure, the bunker's media room (Social Fabric) has a story ready naming SAFETYNET and the player's designation, set to run at the Publication. Stopping it is an optional objective. | M | `m05_entropy_program_exposed` |
| 67 | `torres_arrested`, `torres_called_in` | dropped | Covered by `final_choice`. | – | – |
| 68 | `halloran_accused` | m09 | The Reading: "Accused the wrong scientist. Cost them a month." One line. | L | `m05_halloran_accused` ✱ |
| 69 | `confront_stance`, `handler_trust`, staff KOs | dropped | Stance and a numeric trust score in one mission only; no finale scene reads differently. | – | – |

### 2.6 m06 Follow the Money

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 70 | `architect_identity_found` (read the 87% file) | m09 | Two first lines for the same reveal. Safe opened: a quiet click; HaX finally says the name aloud and it costs her. Safe shut: the player hears the name for the first time, and learns HaX has known since m06 ("keep it out of your notes" was hiding it from them). The scene's emotional weight differs; the proof is the same. | H | `m06_architect_identity_found` |
| 71 | `monitoring_enabled` (fund watched) | m09 | The tagged payments show every transfer into the Helena archive and the bunker: on the briefing map they are the lines from the fund to Helena. HaX: "Your tags, from HashChain." On the no-coordinate route this alone finds the bunker. | M | `m06_monitoring_enabled` |
| 72 | `assets_seized` (fund frozen) | m10 | The Architect is short of money: Tomb Gamma is under-staffed, two guard posts are empty, the refit is unfinished (a gap in the fence). Tesseract: "You froze my bank. I had to economise on guards. I expect you noticed." | M | `m06_assets_seized` |
| 73 | `asset_decision_deferred` / never decided | m10 | Neutral: a fully staffed bunker (the default). | L | (default) |
| 74 | `irina_recruited` | m09 | Her condition "what I give you gets used, not buried" is honoured on screen: the account that paid her is the account that pays the archive's lease. HaX: "Irina's account. We're using it, tell her." | M | `m06_irina_recruited` |
| 75 | `irina_arrested` | dropped | No lead; the default line covers it. | – | – |
| 76 | `satoshi_stance` (`wondered`) | m10 | Tesseract: "You told a man in handcuffs that you sometimes wonder whether we're right. I liked that." It opens the Join offer more warmly for that player; signposting unchanged. `rejected`: "You told him no without thinking. Think now." | M | `m06_satoshi_stance` ✱ |
| 77 | `minder_walked` (Kemal Aydin at large) | m09 | Kemal, who walked out over the casualty figure, rings HaX: he is the informant who confirms Helena. One short phone scene. Default: an anonymous tip. | L | `m06_minder_walked` ✱ |
| 78 | `irina_ko`, `satoshi_ko`, `cover_strained`, `console_tripped`, staff KOs, `analyst_told` | dropped | Small m06-local consequences already paid in m06's debrief; none changes a finale scene. | – | – |
| 79 | "The Architect keeps spares" | m10 | The bunker's second bank: a ledger showing the reserve that funds the Publication's servers. Freeze (#72) means it's nearly empty. | L | none |
| 80 | The $12.8M wallet (freeze) | epilogue | One line: Netherton returns it to the victims' fund, or the Council keeps it. | L | `m06_assets_seized` |

### 2.7 m07 The Architect's Gambit

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 81 | `team_assignment = trojan_horse` (Austin covered, direct) | both | Dispatch still answering (m09 briefing line). In m10 the Publication cannot ride the Trojan Horse backdoor: Tesseract has to push it through his own servers, so the core has one fewer release channel and the cost of a partial release is smaller (§4.2). Tesseract: "You took Austin from me. I had to do this the slow way." | H | `m07_team_assignment` |
| 82 | `team_redirected` (Austin at 30%) | both | Dispatch saved; 14 million systems still backdoored. In m10 the backdoor is a live release channel the player must close (one extra console task, not a gate on completion). | M | `m07_team_redirected` |
| 83 | Any other team / none (Austin uncovered) | both | Dispatch in eleven counties has been dropping calls since day nine: a ticking line in each briefing ("Day eleven. Eleven counties."). In m10 the backdoor in 47 million systems is the Publication's fastest channel. HaX gives a count once. | H | `m07_team_assignment` |
| 84 | Fracture uncovered | m10 | Social Fabric holds 43 states' voter records and its story machine; in the bunker it runs the media room. When the raid starts, a fake story about a SAFETYNET "massacre in Montana" begins to run; the player can kill it in the media room (optional), and the epilogue says whether it ran. | M | `m07_team_assignment` |
| 85 | Meltdown uncovered | m09 | HaX gives the hospital count once in the m09 briefing, in a line that isn't a statistic. | L | `m07_team_assignment` |
| 86 | `countdown_expired` (Seattle went dark) | m10 | Tesseract: "Seattle first. As scheduled." He schedules the Publication by city, and Seattle is first again. | L | `m07_countdown_expired` ✱ |
| 87 | `mercer_fate = escaped / ko / ""` | m10 | Mercer is at Tomb Gamma: "When the fourth submission is declined, agent, somebody does this." He runs the release schedule. A boss-level talk or fight in the server hall. | M | `m07_mercer_fate` |
| 88 | `mercer_fate = arrested` | m10 | His statement gave the bunker's server-hall layout; the briefing map shows it. | L | `m07_mercer_fate` |
| 89 | `mercer_stance`, `mercer_told_diversion`, `mercer_ko` | dropped | Fine shading of one scene in m07; `mercer_fate` carries the outcome. | – | – |
| 90 | `elena_outcome = turned` | m10 | Elena Rodriguez is on the phone at the plant route alongside, or instead of, Vance: she knows the release servers' power feed. "Analysis wants her. I have not decided" is answered: Netherton decided. | M | `m07_elena_outcome` |
| 91 | `elena_outcome = fled` / KO | dropped | She "took nothing and broke nothing"; no finale role that wouldn't be clutter. | – | – |
| 92 | `hollis_resolved = evaded` ("still on their payroll") | m10 | Ray Hollis is on the bunker's gate. He remembers the player. Talk-past or KO. | L | `m07_hollis_resolved` ✱ |
| 93 | `park_resolved` | dropped | Park and Hollis do the same job in the bunker; one returning guard is enough. Hollis is the more vivid (two children, bought). | – | – |
| 94 | `projection_revised` / `revision_found_open` / `redirect_declined` | dropped | Fine-grained; `team_redirected` carries the outcome, and Tesseract's "reading" (#99) carries the stance. | – | – |
| 95 | `found_tomb_gamma` (read the dossier) | m09 | The player who read "Including the people" in m07 hears HaX say "You bagged the dossier. This is the 'people' part." Low cost. | L | `m07_found_tomb_gamma` ✱ |
| 96 | `found_mole_evidence` | dropped | Paid in m08. | – | – |
| 97 | `architect_echo_heard` | both | m09: in the identity scene, HaX: "You heard him say it. My line. His line." m10: the line finished (#120). | H | `m07_architect_echo_heard` |
| 98 | `teacher_discussed` (HaX already told this player) | m09 | HaX's reveal opens "I told you on the handset he taught me", and goes further, faster. Without it she starts further back. | M | `m07_teacher_discussed` ✱✱ (local ink VAR → scenario global) |
| 99 | `debrief_stance` (defended / owned / refused / hardened) | m10 | Tesseract's reading quotes the player's words back: "'I'd make it again.' You would. I counted on it." / "'Mine to carry.' You'll carry this too." / "'Don't ask me to rank them.' I ranked them for you." / Hardened: Netherton's Council gave the player ENTROPY's projections early: in m10 a projection desk on the forward post shows the Publication's casualty curve updating live, and the player can show it to Tesseract as an argument. | M | `m07_debrief_stance` ✱ |
| 100 | The two dead agents | m09 | Named on Task Force Null's wall in the m09 briefing; Netherton reads both names before the Montana go order at the end of m09. Every player has the same two. | M | none |
| 101 | The Architect's "figures" / reading of the player | m09 | The Reading (§2 intro). | H | many |
| 102 | Netherton's Council meeting (`hardened`) | m10 | See #99. | L | (row 99) |
| 103 | Off-screen leaders: Michael Reeves, Jennifer Walsh, Marcus Ashford | epilogue | Named once in the closing card's cell status, by whether their site was covered. They don't appear: three new faces in the last hour is clutter, and Season 2 needs someone left. | L | `m07_team_assignment` |

### 2.8 m08 The Mole

| # | Thread / decision | Pays off | How the player feels it | Wt | Import |
|---|---|---|---|---|---|
| 104 | `nightshade_triple_agent` / `triple_agent_first_payment` | both | m09: he is a voice on the player's phone, competing with HaX, from a SAFETYNET room; he names which database entries guard the archive's restricted stacks and is right. m10: at the bunker door he pays the first payment in full: each of Tomb Gamma's defences named with the database entry it came from. One entry is wrong. Was he lied to, or lying? m09's choice (#106) decides which way he tips the board. | H | `m08_nightshade_triple_agent` ✱, `m08_triple_agent_first_payment` ✱ |
| 105 | "For exactly as long as it suits me" | m10 | Shown his own recruitment file in m09: he learns Tesseract wrote off his life as a line item, and he tips the board on the Architect: the wrong entry was Tesseract's lie, and he gives the player the override he was saving. Not shown: he tips it on SAFETYNET, one door locks and the sleeper is warned. An in-mission way round exists either way. | H | `m09_nightshade_shown_file` (m09's own export) |
| 106 | Nightshade's recruitment file, fifteen years ago | m09 | In the archive. Written in Tesseract's hand while he was SAFETYNET's chief strategist and Nightshade was 23 in his intake. This is the hard proof (with VM flag 3) that the teacher recruited him, "the man who put me here". On the triple-agent branch the player chooses whether to send it to him. | H | none (the find), `m09_nightshade_shown_file` (the choice) |
| 107 | `nightshade_arrested` | both | m09: Netherton visited him once and came back with nothing: "He said you'd know where to find him. He meant the door." m10: HaX keeps her promise and visits him; the closing card says what she said. The bunker's defences are learned the long way (the m09 plans). | M | `m08_nightshade_arrested` ✱ |
| 108 | `nightshade_ko_before_fate` / `tomb_gamma_location_known` false | m09 | The archive holds the deed: m09 finds the bunker for this player. The briefing adds one line ("We have Helena. Not the bunker. Not yet.") and the deed becomes a task. On every other route the deed confirms what the player already has. | M | `m08_nightshade_ko_before_fate` ✱, `m08_tomb_gamma_location_known` ✱ |
| 109 | m08 `debrief_stance` (defended / owned Netherton's sealed warning) | m09 | Owned: Netherton signs the Montana order with his own name beside Nightshade's on the file, in front of the player. Defended: he carries it quietly; one line where he thanks the player and doesn't say for what. | M | `m08_debrief_stance` ✱ |
| 110 | `netherton_ko` / `netherton_hostile` | m09 | One line in the briefing, never played for laughs: "Before we start. My jaw is fine. I'm not asking for an apology." | L | `m08_netherton_ko` ✱, `m08_netherton_hostile` ✱ |
| 111 | `hax_ko` | m09 | "You put me on the floor at the Citadel. I'm still running you." Then she gets on with it. | M | `m08_hax_ko` ✱ |
| 112 | `accused_vector` / `accused_phantom` / apologised / hostile | m10 | Not accused, or apologised to: Phantom (who ran his own mole hunt) joins the raid team, and his "list" turns out to be his own sleeper suspects, which helps catch the sleeper; Vector brings the crypto annex's kit and opens one sealed door. Accused and not apologised, or hit: they decline, and Netherton says why in one line. | M | `m08_accused_vector` ✱ … (six names) |
| 113 | `nightshade_tipped_off` / `nightshade_tidied` | m09 | What he cleared from his locker is in the archive: the copy he sent ahead. HaX: "So that's what he had time to clear." A small, satisfying find. | L | `m08_nightshade_tidied` ✱ |
| 114 | `suspect_theory`, `named_on_evidence`, `named_by_hax`, `audit_*` | m09 | The Reading, one line on how the player catches people: "Named the mole on evidence. Slow, and right." / "Named two innocents first." | L | `m08_named_on_evidence` ✱, `m08_suspect_theory` ✱ |
| 115 | Floor KOs (off-duty agent, analyst, ATHENA), print/card | dropped | m08-local; the innocents line (#6) covers the type. | – | – |
| 116 | `go_bag_lining_known` (Helena ticket) | m09 | Every player hears it, as fact SAFETYNET found in his effects: Helena was his waypoint. No import needed. | M | none |
| 117 | Other sleepers ("there may be others") | m10 | One of the raid team is a sleeper (§5.2). Caught early if: the player found the Initiative ledger entry in m09 (`m09_sleeper_named`); or a kept Nightshade names him at the door; or Phantom's list does. Otherwise he betrays the team at the core (an obstacle with an in-mission answer). | H | `m09_sleeper_named`, `m08_nightshade_triple_agent`, Phantom (#112) |
| 118 | The PIN cracker | both | Issued for the first time in m09 ("The long way is over," HaX). Used in both missions. m10's workshop is where they're made (#29). | M | none |
| 119 | The player is burned | m10 | Tomb Gamma expects Agent 0x00: their photo on the security office wall; one door is keyed to open for them by name (Tesseract's invitation). | M | none |
| 120 | "Let it hurt afterwards, not during" (HaX, the Architect, Nightshade) | m10 | Tesseract starts the line in the confrontation. The player can finish it, or say what HaX actually does with it (which HaX tells the player in m09). One choice that answers three missions; it is also a talk-down argument. | H | `m07_architect_echo_heard` (for the extra recognition beat) |
| 121 | Vector's annex, Phantom's Zurich list | m10 | Phantom's list pays in #117. Vector's annex badge opens a sealed door in #112. Both small. | L | (row 112) |
| 122 | Dr S. Okafor | dropped | Vindicated in m08. A line from her would add a fifth Okafor/Okonkwo name risk for little. | – | – |
| 123 | Marcus Tesseract (Adrian's brother) | dropped | Brief rule: nothing may depend on his institute. A brother with no institute would need new backstory to matter, and the finale has enough people. | – | – |
| 124 | Netherton's culpability | m09 | See #109. | M | (row 109) |

### 2.9 Weight check

High-weight payoffs per mission, to show the load is shared:
- m09: the identity reveal (#70, #97, #98, #106), the Reading (#101), the Recruiter (#60–61), Gary protected (#23), Torres and the ledger (#63–64), Nightshade's file (#104–106).
- m10: Ghost (#13–16), Victoria (#32–33), Voltage (#44–45), disclosure (#20, #48), m07 team (#81–83), Nightshade at the door (#104–105), the sleeper (#117), the line (#120), Derek (#1–2), Gary unprotected (#23).




## 3. Imports and exports

## 4. m10 ending matrix

## 5. Cast

## 6. VM flags in story terms

## 7. Teaser slot

## 8. Risks and open questions

## 9. Decision log
