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
| 87 | `mercer_fate = escaped / ko / ""`, and `mercer_ko` false | m10 | Mercer is at Tomb Gamma: "When the fourth submission is declined, agent, somebody does this." He runs the release schedule. A boss-level talk or fight in the server hall. | M | `m07_mercer_fate`, `m07_mercer_ko` ✱ |
| 88 | `mercer_fate = arrested`, or `mercer_ko` (knocked out, in custody and silent) | m10 | Arrested: his statement gave the bunker's server-hall layout; the briefing map shows it. Knocked out: in custody, no statement, no map line. | L | `m07_mercer_fate`, `m07_mercer_ko` ✱ |
| 89 | `mercer_stance`, `mercer_told_diversion` | dropped | Fine shading of one scene in m07; `mercer_fate` and `mercer_ko` carry the outcome. | – | – |
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

Mechanism and rules: `README_scenario_design.md` "Carrying choices between missions" and `docs/agents/CARRY_OVER_PLAN.md` §2. Every alias below is the default `mNN_<var>` form, so `as` can be left out. Every default matches the source's `globalVariables` default (checked against each erb on 2026-10-20: every ✱ name below exists there; the two ✱✱ names do not yet).

**The rule for both missions.** No import appears in `concludeRequires` or an `unlockCondition` (the validator errors on it anyway). Each import is one of five kinds, given in the **Use** column:

- **R** route: opens an extra way through. The way without it still works.
- **H** helper: a person or a fact that makes something quicker or clearer.
- **O** obstacle: makes something harder, and the same mission always offers a way round it.
- **P** presence: decides who is standing in a room. Every such room has a default occupant (§5.3), so the room works with the import at its default.
- **L** line: changes what someone says, or what a document reads.

Every mission also imports `completed` for each source (`m01_completed` … `m08_completed`; m10 adds `m09_completed`). Ink uses it to tell "never played" from "played and chose the default". A player who starts at m09 gets the default line everywhere, and the default line must stand on its own (it is new writing, so there is no older audio to preserve).

Imports are read-only: one shared ink include per mission (`m09_carryover_vars.ink`, `m10_carryover_vars.ink`) declares them all as `VAR`, and nothing assigns them.

### 3.1 m09 `importGlobals`

| Alias | From | Var | Default | Use | Rows (§2) |
|---|---|---|---|---|---|
| `m01_final_choice` | m01_first_contact | `final_choice` | `""` | L: Derek's file, the Reading | 1, 8, 12 |
| `m01_kevin_choice` | m01_first_contact | `kevin_choice` | `""` | L: the Reading | 5 |
| `m01_found_casualty_projections` | m01_first_contact | `found_casualty_projections` | `false` | L: the Reading | 4 |
| `m01_maya_ko` ✱ | m01_first_contact | `maya_ko` | `false` | O: the archive's Social Fabric plant calls in an extra guard; avoidable (he can be avoided, talked to, or put down). When false, HaX warns the player about him first | 6 |
| `m01_kevin_ko` ✱ | m01_first_contact | `kevin_ko` | `false` | L: the Reading's innocents line | 6 |
| `m01_sarah_ko` ✱ | m01_first_contact | `sarah_ko` | `false` | L: the Reading's innocents line | 6 |
| `m02_paid_ransom` | m02_ransomed_trust | `paid_ransom` | `false` | L: the ransom in the refit ledger | 17 |
| `m02_gary_protected` ✱ | m02_ransomed_trust | `gary_protected` | `false` | H: Gary on the phone about the archive's set-up | 23 |
| `m02_patient_assaulted` ✱ | m02_ransomed_trust | `patient_assaulted` | `false` | L: the Reading | 26 |
| `m02_insider_asset_arrested` | m02_ransomed_trust | `insider_asset_arrested` | `false` | L: Reeves' handler's contact sheet (fallback for `reeves_fate`) | 21–22 |
| `m02_reeves_fate` ✱✱ | m02_ransomed_trust | `reeves_fate` | `""` | L: as above, finer | 21 |
| `m03_victoria_fate` | m03_ghost_in_the_machine | `victoria_fate` | `""` | R on `recruited` (her comms protocols read the archive's internal mail: a second way to the restricted stacks); L on `arrested` / `ko` (the archive's company name) | 32, 34, 35 |
| `m03_danny_fate` | m03_ghost_in_the_machine | `danny_fate` | `""` | L | 36 |
| `m03_danny_ko` | m03_ghost_in_the_machine | `danny_ko` | `false` | L | 36 |
| `m03_directive_decoded` | m03_ghost_in_the_machine | `directive_decoded` | `false` | L: identity scene | 37 |
| `m04_lore_safehouse_address_found` ✱ | m04_critical_failure | `lore_safehouse_address_found` | `false` | L: briefing cold open | 55 |
| `m05_final_choice` | m05_insider_trading | `final_choice` | `""` | L: the gap on `combat_lethal` | 64 |
| `m05_torres_turned` | m05_insider_trading | `torres_turned` | `false` | H: Torres' address list shortens the sleeper search | 64 |
| `m05_recruiter_deal_accepted` | m05_insider_trading | `recruiter_deal_accepted` | `false` | L: what the Recruiter says on her call | 61 |
| `m05_recruiter_deal_confessed` ✱ | m05_insider_trading | `recruiter_deal_confessed` | `false` | L: HaX cuts in first | 61 |
| `m05_found_pipeline_list` ✱ | m05_insider_trading | `found_pipeline_list` | `false` | H: Noor Haddad helps (a door, a warning) | 62 |
| `m05_halloran_accused` ✱ | m05_insider_trading | `halloran_accused` | `false` | L: the Reading | 68 |
| `m06_architect_identity_found` | m06_follow_the_money | `architect_identity_found` | `false` | L: which first line the reveal gets | 70 |
| `m06_monitoring_enabled` | m06_follow_the_money | `monitoring_enabled` | `false` | H: the tagged payments on the briefing map; on the no-coordinate route they point at the bunker before the deed does | 71 |
| `m06_irina_recruited` | m06_follow_the_money | `irina_recruited` | `false` | L | 74 |
| `m06_minder_walked` ✱ | m06_follow_the_money | `minder_walked` | `false` | L: Kemal is the informant (default: an anonymous tip) | 77 |
| `m07_team_assignment` | m07_architects_gambit | `team_assignment` | `""` | L: the dispatch count in the briefing | 81, 83, 85 |
| `m07_team_redirected` | m07_architects_gambit | `team_redirected` | `false` | L | 82 |
| `m07_architect_echo_heard` | m07_architects_gambit | `architect_echo_heard` | `false` | L: identity scene | 97 |
| `m07_teacher_discussed` ✱✱ | m07_architects_gambit | `teacher_discussed` | `false` | L: where HaX's reveal starts | 98 |
| `m07_found_tomb_gamma` ✱ | m07_architects_gambit | `found_tomb_gamma` | `false` | L | 95 |
| `m08_nightshade_triple_agent` ✱ | m08_the_mole | `nightshade_triple_agent` | `false` | P + H: Nightshade's voice on the phone, naming which database entries guard the restricted stacks; and the "send him his file" choice | 104–106 |
| `m08_nightshade_arrested` ✱ | m08_the_mole | `nightshade_arrested` | `false` | L: Netherton's visit | 107 |
| `m08_nightshade_ko_before_fate` ✱ | m08_the_mole | `nightshade_ko_before_fate` | `false` | L: the briefing's "Not the bunker. Not yet." | 108 |
| `m08_tomb_gamma_location_known` ✱ | m08_the_mole | `tomb_gamma_location_known` | `false` | L: how the deed is framed. The no-coordinate branch is `m08_completed and not m08_tomb_gamma_location_known`; a player who never played m08 gets the neutral framing | 108 |
| `m08_debrief_stance` ✱ | m08_the_mole | `debrief_stance` | `""` | L: Netherton at the Montana order | 109 |
| `m08_netherton_ko` ✱ | m08_the_mole | `netherton_ko` | `false` | L | 110 |
| `m08_netherton_hostile` ✱ | m08_the_mole | `netherton_hostile` | `false` | L | 110 |
| `m08_hax_ko` ✱ | m08_the_mole | `hax_ko` | `false` | L | 111 |
| `m08_nightshade_tidied` ✱ | m08_the_mole | `nightshade_tidied` | `false` | P: the copy he sent ahead is an extra find in the restricted stacks | 113 |
| `m08_named_on_evidence` ✱ | m08_the_mole | `named_on_evidence` | `false` | L: the Reading | 114 |
| `m08_suspect_theory` ✱ | m08_the_mole | `suspect_theory` | `""` | L: the Reading | 114 |

42 variables plus eight `completed` imports. The deed to Tomb Gamma is a task for every player (it is also the paper half of the defence plans), so the no-coordinate route changes the briefing and HaX's emphasis, never what the player must do.

Task Force Null's wall in the briefing (row 57) is one object per earlier mission with text variants on these same imports; it needs no further names.

### 3.2 m10 `importGlobals`

| Alias | From | Var | Default | Use | Rows (§2) |
|---|---|---|---|---|---|
| `m01_final_choice` | m01_first_contact | `final_choice` | `""` | L: Tesseract's opening | 1 |
| `m01_player_launched_attack` | m01_first_contact | `player_launched_attack` | `false` | L: the Join offer comes to this player first (signposting unchanged, §4.3) | 2 |
| `m01_maya_ko` ✱ / `m01_kevin_ko` ✱ / `m01_sarah_ko` ✱ | m01_first_contact | as named | `false` | L: the innocents line | 6 |
| `m02_ghost_deal_accepted` | m02_ransomed_trust | `ghost_deal_accepted` | `false` | R (kept: Ghost opens the side door) / O (broken: Ghost locks it; main route unaffected) | 13, 14 |
| `m02_exposed_hospital` | m02_ransomed_trust | `exposed_hospital` | `false` | R with the above; L: talk-down argument | 13, 20 |
| `m02_ghost_deal_refused` ✱ | m02_ransomed_trust | `ghost_deal_refused` | `false` | H: Ghost's parley, one fact (the core's guard change) | 15 |
| `m02_ghost_keys_used` | m02_ransomed_trust | `ghost_keys_used` | `false` | L, plus O when the deal was also broken: Ghost watches the player's route (a camera alert that the security office can blind) | 16 |
| `m02_bed4_manually_stabilised` | m02_ransomed_trust | `bed4_manually_stabilised` | `false` | L: talk-down argument | 19 |
| `m02_patient_bed4_deceased` | m02_ransomed_trust | `patient_bed4_deceased` | `false` | L | 19 |
| `m02_reeves_fate` ✱✱ | m02_ransomed_trust | `reeves_fate` | `""` | P: Reeves on the door rota | 21 |
| `m02_insider_asset_arrested` / `m02_insider_asset_escaped` | m02_ransomed_trust | as named | `false` | P: fallback for the above | 22 |
| `m02_gary_protected` ✱ | m02_ransomed_trust | `gary_protected` | `false` | P + H: Gary in the bunker when unprotected (with `m02_completed` and not `m02_exposed_hospital`); talked round, he opens the plant-room door | 23 |
| `m02_patient_assaulted` ✱ | m02_ransomed_trust | `patient_assaulted` | `false` | L | 26 |
| `m03_victoria_fate` | m03_ghost_in_the_machine | `victoria_fate` | `""` | P: Victoria in the gallery (recruited or escaped) | 32, 33 |
| `m03_sterling_on_call_seen` ✱ | m03_ghost_in_the_machine | `sterling_on_call_seen` | `false` | O: recruited, she sells the raid (an alarm; avoidable, §4.4); escaped, she makes her stand-off. Without it: she holds and opens the core's outer lock (H), or recognises the player and leaves | 32, 33 |
| `m03_guard_bribed` | m03_ghost_in_the_machine | `guard_bribed` | `false` | L: HaX and Finance | 38 |
| `m04_voltage_captured` | m04_critical_failure | `voltage_captured` | `false` | H: the plant room marked on the briefing map; R: a route through the plant | 44 |
| `m04_voltage_escaped` | m04_critical_failure | `voltage_escaped` | `false` | P: Voltage at the switchgear | 45 |
| `m04_voltage_print_on_bypass` ✱ | m04_critical_failure | `voltage_print_on_bypass` | `false` | H: the proof that makes him stand down | 45, 53 |
| `m04_static_left` ✱ / `m04_static_left_alone` ✱ | m04_critical_failure | as named | `false` | P: Static at the plant (either value means Static is at large) | 46 |
| `m04_crew_lost` | m04_critical_failure | `crew_lost` | `false` | L: Tesseract's ledger | 47 |
| `m04_casualties_occurred` | m04_critical_failure | `casualties_occurred` | `false` | L | 47 |
| `m04_disclosure_choice` | m04_critical_failure | `disclosure_choice` | `""` | L: the strongest talk-down argument on `full`; epilogue | 48, 59 |
| `m04_vance_is_ally` ✱ | m04_critical_failure | `vance_is_ally` | `false` | H: Vance on the phone at the switchgear | 50 |
| `m04_robert_vance_ko` ✱ | m04_critical_failure | `robert_vance_ko` | `false` | L | 51 |
| `m05_entropy_program_exposed` | m05_insider_trading | `entropy_program_exposed` | `false` | L: the media room's story names the player (the optional objective exists for every Fracture-uncovered player) | 66 |
| `m05_elena_treatment_funded` | m05_insider_trading | `elena_treatment_funded` | `false` | L: epilogue | 65 |
| `m05_found_pipeline_list` ✱ | m05_insider_trading | `found_pipeline_list` | `false` | L: epilogue count of the forty-seven | 62 |
| `m06_assets_seized` | m06_follow_the_money | `assets_seized` | `false` | H: two empty guard posts and a gap in the fence | 72, 79, 80 |
| `m06_satoshi_stance` ✱ | m06_follow_the_money | `satoshi_stance` | `""` | L: how warmly the Join offer is made | 76 |
| `m07_team_assignment` | m07_architects_gambit | `team_assignment` | `""` | O on uncovered Austin: the backdoor is a live release channel (closing it is optional, §4.2); P on uncovered Fracture: Social Fabric in the media room | 81, 83, 84 |
| `m07_team_redirected` | m07_architects_gambit | `team_redirected` | `false` | O: a smaller backdoor channel | 82 |
| `m07_countdown_expired` ✱ | m07_architects_gambit | `countdown_expired` | `false` | L: "Seattle first. As scheduled." | 86 |
| `m07_mercer_fate` | m07_architects_gambit | `mercer_fate` | `""` | P: Mercer in the server hall | 87, 88 |
| `m07_mercer_ko` ✱ | m07_architects_gambit | `mercer_ko` | `false` | P: rules Mercer out (custody) | 87, 88 |
| `m07_elena_outcome` | m07_architects_gambit | `elena_outcome` | `""` | H: Elena Rodriguez on the phone about the release servers' feed | 90 |
| `m07_hollis_resolved` ✱ | m07_architects_gambit | `hollis_resolved` | `""` | P: Hollis on the gate on `evaded` | 92 |
| `m07_debrief_stance` ✱ | m07_architects_gambit | `debrief_stance` | `""` | L: Tesseract quotes the player; H on `hardened`: the projection desk | 99, 102 |
| `m07_architect_echo_heard` | m07_architects_gambit | `architect_echo_heard` | `false` | L: the extra recognition beat on the line | 120 |
| `m08_nightshade_triple_agent` ✱ | m08_the_mole | `nightshade_triple_agent` | `false` | P + H: Nightshade at the door | 104 |
| `m08_triple_agent_first_payment` ✱ | m08_the_mole | `triple_agent_first_payment` | `false` | H: the payment (today always equal to the above) | 104 |
| `m08_nightshade_arrested` ✱ | m08_the_mole | `nightshade_arrested` | `false` | L: HaX's visit in the epilogue | 107 |
| `m08_accused_vector` ✱ / `m08_accused_phantom` ✱ | m08_the_mole | as named | `false` | P: whether Vector and Phantom join | 112 |
| `m08_vector_apologised` ✱ / `m08_phantom_apologised` ✱ | m08_the_mole | as named | `false` | P: as above | 112 |
| `m08_vector_hostile` ✱ / `m08_phantom_hostile` ✱ | m08_the_mole | as named | `false` | P: as above (latches on a knock-out too) | 112 |
| `m09_nightshade_shown_file` | m09_digital_archaeology | `nightshade_shown_file` | `false` | H (shown: the override) / O (not shown, on the triple-agent branch: one door locks and the sleeper is warned; the security office opens it) | 105 |
| `m09_sleeper_named` | m09_digital_archaeology | `sleeper_named` | `false` | H: the sleeper is caught before the core | 117 |
| `m09_recruiter_secret` | m09_digital_archaeology | `recruiter_secret` | `""` | L: Tesseract's leverage line, and HaX's answer to it | 61 |
| `m09_reading_finished` | m09_digital_archaeology | `reading_finished` | `false` | L: one extra talk-down argument (the Reading's wrong prediction) | 101 |

56 variables plus nine `completed` imports. Victoria's KO branch, Voltage's capture and the rest of the "absent" values put the room's default occupant in place (§5.3).

### 3.3 Export additions to m01–m08

**JSON only, approved (F2–F4).** One line each in the source mission's `exportGlobals`; no ink, no audio. The orchestrator makes these when stage 9 builds the importing mission, not before. Each name is already a key in that mission's `globalVariables`.

| Source | Add to `exportGlobals` | Read by |
|---|---|---|
| m01 | `maya_ko`, `kevin_ko`, `sarah_ko` | m09, m10 |
| m02 | `ghost_deal_refused`, `gary_protected`, `patient_assaulted` | m09, m10 |
| m03 | `sterling_on_call_seen` | m10 |
| m04 | `voltage_print_on_bypass`, `static_left`, `static_left_alone`, `vance_is_ally`, `robert_vance_ko`, `lore_safehouse_address_found` | m09, m10 |
| m05 | `recruiter_deal_confessed`, `found_pipeline_list`, `halloran_accused` | m09, m10 |
| m06 | `satoshi_stance`, `minder_walked` | m09, m10 |
| m07 | `countdown_expired`, `hollis_resolved`, `found_tomb_gamma`, `debrief_stance`, `mercer_ko` | m09, m10 |
| m08 (new block; it has none) | `nightshade_arrested`, `nightshade_triple_agent`, `triple_agent_first_payment`, `nightshade_ko_before_fate`, `tomb_gamma_location_known`, `debrief_stance`, `netherton_ko`, `netherton_hostile`, `hax_ko`, `accused_vector`, `accused_phantom`, `vector_apologised`, `phantom_apologised`, `vector_hostile`, `phantom_hostile`, `nightshade_tidied`, `named_on_evidence`, `suspect_theory` | m09, m10 |

41 names across eight missions. After each addition, run the validator on the source (export names must stay stable from then on, CARRY_OVER_PLAN 2.9).

**Needing an ink change (for the user).** Neither changes a spoken line, so no audio is regenerated.

1. **m02 `reeves_fate`.** Add a string global (default `""`) set once in `m02_closing_debrief.ink` where the debrief already routes on five globals (`:646-665`): `arrested` / `exposed` / `ko` / `flagged` / `escaped` / `missed` / `unnoticed`. Then export it. Without it, m10 falls back to `insider_asset_arrested` / `insider_asset_escaped`, and "never caught" reads as absent (row 22).
2. **m07 `teacher_discussed`.** Promote the local ink `VAR` to a scenario global (add it to `globalVariables`, default `false`, and a `#set_global:teacher_discussed:true` beside `m07_phone_agent0x99.ink:777`). Then export it. Without it, every player gets HaX's longer reveal in m09, and the ones who already heard the start hear it again.

### 3.4 m09's exports, read by m10

| Var | Values | Set where | m10 use |
|---|---|---|---|
| `nightshade_shown_file` | `true` / `false` | the triple-agent branch only: the player sends Nightshade his own recruitment file from the restricted stacks | which way he tips the board at the door (row 105) |
| `sleeper_named` | `true` / `false` | the player matches the ledger's codename (VM flag 2) to a SAFETYNET personnel record in the archive. Optional | the sleeper caught before the core (row 117) |
| `recruiter_secret` | `""` (never sold the list) / `confessed` (owned up in m05) / `told` (told HaX on the Recruiter's m09 call) / `kept` (hung up and said nothing) | the Recruiter's call; m09 works the value out from its own imports and the call | Tesseract's leverage line and HaX's reply (row 61) |
| `reading_finished` | `true` / `false` | the player read the Reading to its last page, the prediction about them | an extra talk-down argument (§4.1) |

### 3.5 m10's exports

For a later season; nothing reads them yet. `ending` (`arrest` / `surrender` / `lethal` / `scorched` / `joined`), `database_outcome` (`secured` / `disclosed` / `both_wiped` / `published`), `sleeper_caught`, `partial_release` (`none` / `small` / `large`), `media_story_ran`. Stage 9 adds them; they cost nothing and stop the next season having to ask for an ink change.

## 4. m10 ending matrix

Five endings: three successes (arrest, surrender and cooperation, lethal force), Scorched Earth, and Join ENTROPY. All five come after the same four VM flags, so `concludeRequires` is the same for every ending (the technical work only) and the ending is a global the debrief and credits read.

### 4.1 The core sequence

The player reaches the core with all four flags in (§6). Tesseract is there in person, alone, at the release console. He has been expecting Agent 0x00 since the keyed door (row 119).

1. **His case.** A conversation, not a fight. He argues from the player's record (rows 1, 19, 47, 48, 76, 99) and the player answers. Each answer that lands is a **point**. He sets the Publication out plainly: the hour, the channels, his casualty sheet (1,100–2,600 in the first month), and why he thinks it is the last arms race.
2. **The Publication.** The player chooses: **stop it** (disarm the release at the console, success and Scorched Earth paths) or **hear the offer** (the first step towards Join, §4.3). Stopping it is one console action; he does not fight for it. "Then we do it the slow way."
3. **The database.** Three options at the same console:
   - **Secure** the stolen copy as evidence. SAFETYNET keeps its own master. The hoard stands. (`secured`)
   - **Disclose**: wipe Tomb Gamma's copy and send SAFETYNET's master to the vendors under a coordinated-disclosure schedule. Netherton authorises it on the line; he says what it will cost the service and signs. (`disclosed`)
   - **Wipe both**: Tomb Gamma still holds the live line into the Citadel's vault that Nightshade left open; through it the player can erase SAFETYNET's master as well. This is Scorched Earth (below). (`both_wiped`)
4. **Tesseract** (success paths only): **arrest**, **talk him into surrender and cooperation**, or **lethal force**. All three are always offered.

**Talk-down points.** Surrender and cooperation needs two points. The mission always offers at least three arguments of its own, so it is winnable by any player:

- the correction on his casualty sheet, found on the workshop floor or the projection desk: his model double-counts the hospitals' recovery time, and he signed it anyway;
- what HaX does with "Let it hurt afterwards, not during" (she tells the player in m09, and again on the line in m10 if they missed it): you keep your own hurt for afterwards so you can do the job, you never hand it to strangers (row 120);
- the gap between the Publication and his own rule: he has hidden every copy of himself for seven years and still won't put his own name on the release.

Carry-overs add arguments, and the best of them land harder (each counts as a point and can replace a weak one): `m04_disclosure_choice = full` ("And nobody died for it"), `m02_exposed_hospital`, `m02_bed4_manually_stabilised`, Voltage stood down on his print, Gary talked round, `m09_reading_finished` (the Reading's last page predicts the player will press the button; they didn't), `m07_debrief_stance = hardened` (the live casualty curve from the projection desk). A weak or hostile answer costs nothing but the point. With fewer than two, he declines: "Arrest me, then. I'll be quiet in a cell." Arrest and lethal force remain.

### 4.2 The Publication's channels and partial release

The Publication goes out through up to three channels. Only the first must be shut to stop it; the others decide the cost.

| Channel | Present when | Shut by | If left open |
|---|---|---|---|
| Tomb Gamma's own release servers | always | the core (step 2) | the Publication runs (Join only) |
| The Trojan Horse backdoor | `m07_team_assignment` not `trojan_horse` | an optional console task in the server hall (needs flag 2) | **partial release**: the batch already queued on the backdoor goes out when the core is shut. Small when `m07_team_redirected` (14 million systems), large when Austin was never covered (47 million) |
| Social Fabric's story machine | `m07_team_assignment` not `fracture` | an optional task in the media room | the "massacre in Montana" story runs; on `m05_entropy_program_exposed` it names SAFETYNET and the player's designation |

**The clock.** The raid has a generous visible clock to the 06:00 UTC release, as m07 did. If it runs out before the core is shut, the first city's batch goes out through whatever channels are open ("Seattle first. As scheduled."), and the mission carries on. Running out never ends the mission and never forces an ending. With Austin covered and the clock beaten, nothing is released at all.

### 4.3 Join ENTROPY: signposting

The one non-success ending. A deliberate choice the player makes three times, never a trap:

1. At step 2 the player chooses "I want to hear the offer." Tesseract makes it: Agent 0x00 presses the release, and walks out with him. The narrator says plainly what pressing it means. The next menu always includes "No. Stop it." and returns to step 2.
2. The player chooses "Show me." HaX, on the line, says the player's designation and asks them not to. The narrator states the cost again: the mission ends here, working for ENTROPY, with the casualty figure. "Step away" is offered again.
3. The release key is an object at the console, labelled, with its own confirmation ("Publish the database to everyone, now?"). Only that press sets the ending.

It cannot be reached by a misclick, a knock-out, the clock, a failed talk-down, or any import. `m01_player_launched_attack` and `m06_satoshi_stance = wondered` change how warmly Tesseract makes the offer, and nothing else. m01's LAUNCH button is the precedent.

### 4.4 What earlier choices change

The route through the bunker works with every import at its default. These change the cost and who is standing at the end.

| What changes | Better | Worse | In-mission way round for the worse case |
|---|---|---|---|
| Partial release (§4.2) | Austin covered in m07 | Austin never covered | the server-hall task, and beating the clock |
| Media story | Fracture covered in m07 | Fracture uncovered, and `m05_entropy_program_exposed` names the player | the media-room task |
| The sleeper (§5.2) | caught early: `m09_sleeper_named`, or a kept Nightshade names him at the door, or Phantom's list does | betrays the team at the core: he locks the core door behind the player and goes for the release key. Agent Marisol Quintero is hurt stopping him (wounded, not killed) | the security office's door log shows his badge where it shouldn't be; a player who reads it catches him there |
| Nightshade at the door | shown his file in m09: he gives the override he was saving | not shown: one door locks, the sleeper is warned | the security office reopens the door; the log above still catches the sleeper |
| Victoria (recruited and `sterling_on_call_seen`) | – | sells the raid: an alarm, reinforcements in the gallery | a kept Nightshade warns the player, or HaX's doubt in the briefing ("trust her as far as the gallery") lets the player skip the trap she sets |
| Ghost | deal kept: side door; refused: one fact | deal broken: side door shut; with the keys used, Ghost watches the route | the main route; the security office blinds the cameras |
| Plant route | Voltage captured (map), Vance or Elena on the phone, Voltage stood down on his print, Gary talked round | Voltage and Static at the switchgear | talk, fight, or the long way round through the workshop floor |
| Guards | `m06_assets_seized`: two posts empty, gap in the fence | full staffing | stealth and the cloner as in any mission |
| Who stands with the player | Vector and Phantom (not accused, or apologised to, and not hit) | they decline, and Netherton says why | the default raid team |

### 4.5 The endings

| Ending | Reached by | `ending` | Credits title |
|---|---|---|---|
| Arrest | stop, secure or disclose, arrest | `arrest` | MISSION COMPLETE |
| Surrender and cooperation | stop, secure or disclose, talk-down with two or more points | `surrender` | MISSION COMPLETE |
| Lethal force | stop, secure or disclose, lethal force | `lethal` | MISSION COMPLETE |
| Scorched Earth | stop, wipe both | `scorched` | MISSION COMPLETE, then AGENT 0x00: SUSPENDED |
| Join ENTROPY | the three steps of §4.3 | `joined` | MISSION FAILED, with the Publication's casualty projection (as m01's launch ending) |

**Scorched Earth.** Wiping SAFETYNET's master through the live line trips the Citadel's breach protocol and the bunker's own: the core's fire suppression dumps, the lights go, the blast doors cycle. In the dark Tesseract is gone by the service tunnel. The player gets out with the team. Nobody holds the map, SAFETYNET included. Netherton suspends the player: "I would have wanted to do the same. That is why you are suspended and I am not."

### 4.6 Epilogue beats

Every ending runs the same frame: the forward post at first light (or the Citadel for Join), a short scene, the closing card, the teaser slot (§7), then credits. The closing card draws its lines from §2's epilogue rows: Zero Day still trading, Ghost's last message or clean exit, Elena Torres' treatment, the forty-seven reached, Albion's inquiry, the $12.8M, dispatch in eleven counties, the off-screen m07 leaders by whether their site was covered.

| Ending | Tesseract | HaX | Netherton | Lines that change |
|---|---|---|---|---|
| Arrest | In a police van, says nothing. He nods to HaX through the window. | Watches the van go: "He taught me to keep it for afterwards. It's afterwards." | Signs the handover: "A trial. He will make speeches. Let him." | ENTROPY's cells keep running; "He is in a cell. The cells are not." |
| Surrender | Gives the cells' contact protocol on the bunker's own terminal. | Sits with him for one minute and does not say what they talked about. | Takes the protocol to the Council. | Two cells rolled up in the closing card (the ones the player's history left weakest). |
| Lethal force | One line: the player fires, he falls by the console. Nothing more on screen. | Long silence on the line, then: "Log it. I'll sign under you." | Covers it in writing and says so. | ENTROPY has a martyr; the cells go quiet, which is worse. A review board is named for after the credits. |
| Scorched Earth | Gone. A card on the console, his hand: "Afterwards, then." | Stands with the player at the hearing. | Suspends the player (above). | The service rebuilds its threat catalogue from nothing. The teaser slot, if used, sits after the suspension. |
| Join ENTROPY | Walks out with the player into the dark. | Her last message, unanswered: the player's designation, and nothing else. | Orders 0x00 brought in. | The casualty curve on the forward post's screen, climbing. |

The secure / disclose choice adds one beat in each success ending: secured, Netherton files the stolen copy in the vault beside the master ("Two maps now," HaX says); disclosed, the first vendor patches land on the morning of the Publication's hour, and HaX reads the count.

## 5. Cast

Sprite keys are the ones the shipped missions use (inventories A §2, B §m0N.2). New characters need sprites and the usual character pipeline at stage 9.

### 5.1 Returning characters

| Character (sprite) | m09 | m10 |
|---|---|---|
| Agent HaX (`agent_hax`) | §5.4 | §5.4 |
| Director Magnus Netherton (`netherton`) | §5.5 | §5.5 |
| Nightshade (`nightshade`) | Triple agent: a voice on the player's phone from a SAFETYNET room; the player may send him his file. Arrested: one Netherton line. Silent handover: absent. | Triple agent: at the bunker door with his payment, tipped by m09. Otherwise absent; HaX's visit in the epilogue on the arrested branch. |
| The Recruiter (phone only, no sprite) | Rings once inside her stacks; every player. What she says depends on m05. | Not present. The Initiative's status in the closing card. |
| Derek Lawson | His file only. | Quoted by Tesseract. |
| Gary Whitlock (`gary_whitlock`) | Protected: the expert on the phone. | Unprotected and quiet (m02 played): a technician in the bunker, talkable. |
| Graham Reeves (`graham_reeves`) | Arrested: his handler's contact sheet. | Escaped or never caught: on the door rota, courteous; talk past or knock out. |
| Ghost (terminal only) | – | On the network: side door, locked door, or parley. |
| Victoria Sterling (`victoria_sterling`) | Recruited: her protocols open a mail route. Arrested or KO: the archive's company name. | Recruited: inside as Zero Day's representative, holds or sells. Escaped: a buyer's agent in the gallery, stand-off or recognition. |
| Danny Foster | One HaX line by fate. | – |
| Voltage (`voltage`), Static (`operative_static`) | – | Escaped: at the switchgear, Static with him if left. Captured: his map in the briefing. |
| Robert Vance (`robert_vance`) | – | Ally: on the phone at the switchgear. KO'd: HaX's one line. |
| David Torres | Turned: his address list. Dead: the gap. | – |
| Kemal Aydin (`kemal_aydin`) | Walked: the informant who confirms Helena, by phone. | – |
| Irina Volkova | Recruited: one HaX line. | – |
| Dr James Mercer (`james_mercer`) | – | At large (not arrested, not knocked out): runs the release schedule in the server hall. |
| Elena Rodriguez (`elena_rodriguez`) | – | Turned: on the phone about the release servers' feed. |
| Ray Hollis (`ray_hollis`) | – | Evaded: on the gate. |
| Agent 0x23 Vector (`agent_vector`), Agent 0x88 Phantom (`agent_phantom`) | – | Not wronged in m08: with the raid team. Vector's annex badge opens a sealed door; Phantom's list names sleeper suspects. Wronged: they decline. |
| Dr Adrian Tesseract, the Architect | Voice only: his first call, to HaX, at the end. | In person at the core (new sprite `adrian_tesseract`). A man of 64, English; voice Sadaltager as in m07, without the distortion. |

### 5.2 New characters

Kept clear of the existing name clashes (Chen, Reeves, Park, Okafor/Okonkwo, the three Ghosts, Cipher).

| Name | Age, background | Mission | Role |
|---|---|---|---|
| Margaret "Peg" Sorensen | 66, white Montanan of Norwegian family, former county clerk | m09 | Director of the Helena archive and the Insider Threat Initiative's keeper of records. A true believer: "People are records. I keep them." She holds the archive's master keys and the Reading's shelf mark. Hostile in her office if pushed; arrest or knock-out. |
| Noor Haddad | 34, Lebanese-American, grew up in Dearborn | m09 | Records clerk, one of the forty-seven (a TalentStack placement she never knew about). If SAFETYNET warned her (`m05_found_pipeline_list`), she helps: a door, a warning about Sorensen. If not, she is a wary bystander, and the player can tell her she is in the ledger. |
| Jesse Tran | 29, Vietnamese-American | m09 | The archive's IT contractor and Social Fabric's plant: the name Maya's lost intelligence would have flagged (row 6). Calls in a guard if he sees the player. |
| Ernesto Villalobos | 24, Mexican-American | m09 | Night security guard. Innocent; a knock-out costs a line in the debrief. |
| Agent 0x19 Callum Fraser, Agent 0x6B Ana Lúcia Ferreira | 31, Scottish; 38, Brazilian | m09 (named) | The two agents killed at the unanswered m07 sites. Netherton reads both names before the Montana order. Never seen. |
| Agent 0x2D "Anchor", Marisol Quintero | 52, Mexican-American | m10 | Task Force Null's raid leader on the ground. Steady, dry, on the player's side. If the sleeper reaches the core she is the one hurt stopping him. |
| Agent 0x5E "Lantern", Tomasz Wierzbicki | 47, Polish-British | m10 | **The sleeper.** Task Force Null's breaching lead, recruited in Tesseract's intake twelve years ago and placed by the Initiative; the m09 ledger lists him only by his ledger codename. Likeable and useful until he isn't. Caught early by the routes in §4.4. |
| Dr Kwame Asante | 45, Ghanaian-British | m10 | Tomb Gamma's systems lead, who wrote the release pipeline. The server hall's default occupant when Mercer is not there. "I wrote it. I'd write it again." |
| Tomb Gamma's guards and technicians, Social Fabric's media crew | mixed | m10 | Generic sprites, varied. |

### 5.3 Default occupants

Every room that a carry-over can fill has a default occupant, so the route works with all imports at their defaults.

| Room (m10) | Default | Replaced or joined by |
|---|---|---|
| Gate | an ENTROPY gate guard | Ray Hollis |
| Blast-door tunnel | a guard on the door rota | Graham Reeves |
| Workshop floor | a technician with a cloneable card | Gary Whitlock |
| Plant room | an ENTROPY plant technician | Voltage, with Static |
| Server hall | Dr Kwame Asante | Dr James Mercer (Asante then works the media room's feed) |
| Gallery | two guards | Victoria Sterling |
| Media room | dark and empty | Social Fabric's crew |
| The door (raid team) | Quintero, Wierzbicki, two Task Force Null officers | Vector, Phantom, Nightshade |
| On the phone | HaX | Vance, Elena Rodriguez, Ghost (on a terminal) |

### 5.4 HaX's arc

m08 left her close to coming apart, texting "Same classroom, 0x00. Don't ask me whose yet." The finale is her reckoning with the man who taught her.

- **m09.** In person at the briefing, then on the line. In the identity scene she says the name (or the player learns that she has known since m06, row 70). On a quiet stretch in the archive she tells the player what "Let it hurt afterwards, not during" means to her: you keep your own hurt for afterwards so you can do the job; you never pass it to strangers. That is the version the player can use against him in m10. On `m08_hax_ko`: "You put me on the floor at the Citadel. I'm still running you." At the end Tesseract rings her, not the player. The player hears her side only: short answers, then "I'll bring them." She tells the player what he said after he hangs up.
- **m10.** At the forward post with Netherton, on the line all night. She knows the bunker's tricks because she knows his. At the core he talks to her through the player's handset; she does not decide for the player and says so. On `m09_recruiter_secret = kept`, Tesseract tells her about the forty-seven on the open line; she answers "I'll deal with that afterwards," and does, in the epilogue.
- **Endings.** §4.6. In every success ending she gets the last word before the card.

### 5.5 Netherton's role

- **m09.** Runs the briefing in Task Force Null's room. Brings the legal cover (Victoria's CPS case on that branch). Reads the two dead agents' names. Signs the Montana order in front of the player: on `m08_debrief_stance = owned`, with his own name beside Nightshade's file; on `defended`, with one quiet thank-you he doesn't explain. On `m08_netherton_ko`: "Before we start. My jaw is fine. I'm not asking for an apology."
- **m10.** Commands the raid from the forward post. Authorises disclosure if the player asks for it at the core (§4.1). Suspends the player on Scorched Earth. Orders the player brought in on Join. His m08 line "If he burns you, it is on my signature" comes due at the door on the triple-agent branch either way.

## 6. VM flags in story terms

The VM plan is written separately (`finale/FINALE_VM_PLAN.md`, by a Haiku agent); it decides how each flag is reached and must fit the meanings below. Every flag is required (`concludeRequires`), is wired through `targetFlags` with `setGlobal`, and is followed by a HaX line that says what it bought in story terms.

### 6.1 m09: the archive's servers

Submitted at the SAFETYNET drop terminal the player sets up in the reading room (the field laptop), except flag 4, which is submitted in the tape room beside the machine it came from.

| Flag | Story meaning | Unlocks in game |
|---|---|---|
| 1 | **A foothold on the archive's catalogue server**: the index of every box, tape and shelf, including the restricted series the public catalogue hides. | The shelf marks for the restricted stacks, and the first clue to the tape room's code. |
| 2 | **The Insider Threat Initiative's ledger**: every placement the Recruiter has made, the forty-seven and the twenty-three, each under a ledger codename. One entry is inside SAFETYNET. | The printed ledger in the restricted stacks becomes readable, and the optional cross-reference task (codename to personnel file) opens: `sleeper_named`. |
| 3 | **The owner of Tomb Beta's last server**: the machine was enrolled with a SAFETYNET staff credential, issued seven years ago and never revoked, in Dr Adrian Tesseract's name. With the handwriting on Nightshade's recruitment file, this is the proof. | The identity scene with HaX. |
| 4 | **Full control of Tomb Beta's server**: its job that still mirrors to Tomb Gamma, carrying the Publication's hour (06:00 UTC, day 13) and the list of defences built from the stolen database. | Tesseract's call to HaX, the raid order, and the mission's close. |

Together with the paper finds (the deed and construction file, the Reading, Nightshade's file), these give the four things §1.3 promises: the name, the ledger, the defences, the hour.

### 6.2 m10: Tomb Gamma's network

The forward post's terminal takes flag 1; the rest are submitted on terminals inside the bunker, where the player is standing when they get them.

| Flag | Story meaning | Unlocks in game |
|---|---|---|
| 1 | **A foothold on the bunker's security system**: the camera and door controller in the security office. | Camera feeds, the blast-door route, and the door log that can catch the sleeper. |
| 2 | **Inside the release pipeline**: the staging service that schedules the Publication by city. It lists the channels (§4.2). | The server-hall console: the optional task to close the backdoor channel; Asante's or Mercer's schedule turns readable. |
| 3 | **Out of the release service's box onto the machine beneath it**: the release host itself. | The core's inner door, and the disarm action at the console. |
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
| 1 | **Import load.** 42 imports in m09 and 56 in m10 is far more than any earlier mission. Ink VAR lists, test fixtures and the dialogue lint all grow with it. | One shared include per mission declares them (§3). Route drivers test three import profiles besides `none`: a "kind" run, a "hard" run and a mixed one, chosen at stage 8 to cover every presence slot in §5.3. |
| 2 | **Players who start at m09** (Hacktivity can assign missions out of order). | Every scene is written default-first; the default must read as a whole story without the earlier missions. Reviewers check the default path on its own. |
| 3 | **The two ✱✱ ink changes are refused.** | Fallbacks in §3.3: Reeves via the two booleans; HaX's reveal from the start for everyone. |
| 4 | **Join reached by accident**, or felt as a trap. | The three steps of §4.3. A blind playtest at stage 8 checks that no tester reaches it without meaning to. |
| 5 | **Lethal force tone.** | One narrated line, no detail, no lingering shot; HaX's silence carries it. Same level as m05's `combat_lethal`. |
| 6 | **Too many returning faces in m10.** A worst-case player meets Hollis, Reeves, Voltage and Static, Gary, Victoria, Mercer, Ghost and the sleeper. | Each sits in a room that exists anyway (§5.3), so the worst case is the same length as the default run; most are a talk-or-fight of under a minute. If stage 5 finds a room too crowded, the lowest-weight presence (Hollis, then Reeves) becomes a line instead. |
| 7 | **The clock.** A timer adds tension and also pressure on players who are slow with the VM. | Generous, visible, never fails the mission (§4.2). Stage 4 sets the length from the m07 timings. |
| 8 | **Local time.** 06:00 UTC on day 13 is around midnight in Montana, not dawn there. | Every in-game clock and line uses UTC, as the Citadel does; no line mentions dawn in local time. §1.5's "before dawn" is read as the Citadel's dawn. |
| 9 | **The Architect in person.** He has been a voice since m01. Seeing him could shrink him. | He is shown only in the core, after the four flags, and stays seated at the console until the endings. His portrait is chosen with the user at the character stage. |
| 10 | **"Disclose" as a fourth database option** goes beyond the brief's list. | Kept: it is the educational point of the finale (responsible disclosure against hoarding and full release) and it is a success variant, so the brief's ending list is unchanged. The user can cut it to two options. |
| 11 | **SAFETYNET's master reachable from the bunker** (the live line) is new canon. | Kept: it is how Scorched Earth can destroy both copies from one console, and it fits m08's open door. Stage 6 lore writes it into the Citadel's incident file. |
| 12 | **The sleeper's betrayal hurts Quintero.** It must not feel like punishment for skipping an optional task. | Wounded, never killed; the security office's door log is a visible, in-mission catch the HaX hub points to once the player has flag 1. |
| 13 | **m10's VM needs an earlier stage** (brief). | §6.2 gives flags 1–2 their story; the Haiku VM plan fits the modules to them. If it cannot, flag 1 moves to the security office terminal and the meanings stay. |
| 14 | **Titles and ids.** `m10_final_cipher` has nothing to do with a cipher. | Stage 0 proposes titles (per-mission files). A rename follows the rename rule, and m10's `importGlobals` entry for m09 uses whatever m09's final folder name is. |
| 15 | **The Recruiter stays faceless.** | Yes, phone only, as in m05. She is left at large for a later season. |
| 16 | **New sprites**: Tesseract, Sorensen, Haddad, Tran, Villalobos, Quintero, Wierzbicki, Asante. | Eight new characters across two missions, made through the usual pipeline at stage 9; the user approves each look first. |
| 17 | **Codename clash.** "Lantern" and "Anchor" have not been checked against every earlier mission's text. | Stage 1 greps the scenarios and the bible before fixing them. |

## 9. Decision log

Sections 1–2 (premise, timeline, thread allocation) are the earlier author's and stand as written, with one correction.

- **§2 rows 87–89 corrected.** Row 87 put Mercer at Tomb Gamma on `mercer_fate = ko`, but an actual knock-out sets `mercer_ko` and leaves him in custody (m07 erb:228-230). Rows 87–88 now read `m07_mercer_ko` (✱) and row 89 no longer drops it.
- **Five-kind use code for imports (R/H/O/P/L).** Makes the "never gates completion" rule checkable row by row.
- **One shared ink include per mission for imports.** Fifty-odd VAR lines repeated in every ink file would drift.
- **Imported `completed` for every source.** "Never played" needs its own neutral line, and m09 may be a player's first mission.
- **No-coordinate route via `m08_completed and not m08_tomb_gamma_location_known`.** The source default is false, so the import alone can't tell a knocked-out Nightshade from an unplayed m08.
- **The deed is a task for every player.** Keeps the no-coordinate route a change of framing, not of what the player must do.
- **`m04_static_left_alone` imported beside `static_left`.** Either value means Static is at large; §2 row 46 named only one.
- **m08 export list follows inventory B §m08.2, minus `nightshade_tipped_off`.** Only `nightshade_tidied` has a payoff (row 113).
- **Export additions made at stage 9, not now.** The brief forbids editing other missions in this stage; the list is ready.
- **m09 exports four values** (`nightshade_shown_file`, `sleeper_named`, `recruiter_secret`, `reading_finished`). Each has a concrete m10 use; `recruiter_secret` folds m05's confession and m09's call into one value m10 can read.
- **m10 exports five values for a later season.** Cheap now; an ink change later.
- **All endings after flag 4.** One `concludeRequires` for every ending, and the endings are choices, not failures of the technical work.
- **Stopping the Publication is one console action, unopposed.** The climax is the argument and the choices, not a boss fight with an old man.
- **Talk-down needs two points, with three always available in m10.** Winnable by any player; carry-overs make it easier and richer, never possible-only-with.
- **"Disclose" added as a success-path database option.** It is the responsible-disclosure answer the finale's argument is about, and it pays m04's disclosure choice.
- **Live line into the Citadel's vault.** Gives Scorched Earth a way to destroy both copies from the core and a reason for the chaos he escapes in.
- **Join needs three deliberate steps, the last a labelled key with its own confirmation.** The brief says never a trap; m01's LAUNCH button is the precedent.
- **Partial release comes from the m07 backdoor and the clock, not from failure.** Ties the cost to the player's m07 choice and keeps every route finishable.
- **Clock never fails the mission.** "Fun and educational, not hard"; m07's countdown set the pattern.
- **Every presence import has a default occupant.** The route works with all defaults, and a worst-case player's run is no longer than the default.
- **The sleeper is a new Task Force Null agent, not an existing character.** Making Vector or Phantom the sleeper would undo m08's verdict that they were innocent.
- **The sleeper wounds Quintero rather than killing anyone.** A missed optional task should cost, but a death would read as punishment.
- **Tesseract calls HaX, not the player, at the end of m09.** He is her teacher; the player overhearing one side is more tense than a monologue.
- **HaX's meaning of the line is told in m09.** It makes the line the player's own argument in m10 (row 120).
- **New cast varied in age and background**, and clear of the Chen/Reeves/Park/Okafor clashes. User rule.
- **Mercer's absence filled by Asante, not an empty hall.** The server hall needs someone who can explain the release.
- **The two dead agents named (Fraser, Ferreira).** Row 100 has Netherton read the names, so they need names.
- **Teaser behind a default-off global.** Planned slot, no dependency (brief).
- **Clocks in UTC only.** Avoids the local-midnight/dawn mismatch in §1.5.
- **Recommended titles: "Digital Archaeology" (m09, keep) and "Tomb Gamma" (m10).** Reasons in the per-mission stage 0 files.
