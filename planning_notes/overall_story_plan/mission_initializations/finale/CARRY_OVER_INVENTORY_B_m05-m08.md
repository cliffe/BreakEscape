# Carry-over inventory B: m05–m08

Phase A input for the Season 1 finale (m09, m10). Brief: `docs/agents/FINALE_BRIEF.md`. Companion: `CARRY_OVER_INVENTORY_A_m01-m04.md`.

Scope: m05 Insider Trading, m06 Follow the Money, m07 The Architect's Gambit, m08 The Mole, plus what the approval logs and the universe bible say about their threads. Citations are `file:line` from the repo root, or from `scenarios/<mission>/` where the mission is obvious. "erb" means that mission's `scenario.json.erb`. VM flags are named only by their in-game meaning.

How to read the decision tables: **Exp** = in that mission's `exportGlobals` today. **Read by** = later missions that already import it. An import is named `mNN_<var>` in the reader. `importGlobals` can read from any earlier mission directly, so m09 or m10 can import from m05 without m06–m08 passing it on.

---

## m05 Insider Trading

Quantum Dynamics Corporation (UK), an evening shift. David Torres, cryptography lead, is uploading the emergency-dispatch key-rotation schedule for ENTROPY's Insider Threat Initiative. The Architect signed off a casualty projection of 30–45 excess deaths as "an acceptable cost" (`ink/m05_phone_recruiter.ink:153-155`). Exports: `final_choice`, `torres_turned`, `torres_arrested`, `elena_treatment_funded`, `entropy_program_exposed`, `recruiter_deal_accepted` (erb:610-611). Imports `m04_voltage_captured`, `m04_voltage_escaped` (erb:606-609).

### m05.1 Player decisions

| Global | Values and meaning | Set at | Exp | Read by |
|---|---|---|---|---|
| `final_choice` | `turn_double_agent` (Torres turned, treatment paid, he feeds SAFETYNET the Initiative); `arrest` (handed to police, with or without talking first; also the Security call-in); `combat_nonlethal` (knocked out, player stayed with him, police and ambulance); `combat_lethal` (knocked out, player walked away, he died); `public_exposure` (Initiative on the front pages, Torres arrested next morning, player's cover burnt) | `ink/m05_torres_confrontation.ink:301, 355, 367, 429, 434, 506`; phone fight `ink/m05_phone_agent_0x99.ink:735, 744, 762` | Yes | m06 briefing, one HaX line per ending (`m06_follow_the_money/ink/m06_opening_briefing.ink:43-54`) |
| `torres_turned` | true only on the turn ending | `torres_confrontation.ink:298` | Yes | none |
| `torres_arrested` | true on arrest, nonlethal, exposure, call-in | `torres_confrontation.ink:353, 365, 427, 504`; phone `:733, 759` | Yes | none |
| `elena_treatment_funded` | SAFETYNET pays for Elena Torres's trial (turn, or arrest after he talks) | `torres_confrontation.ink:299, 339` | Yes | m06 briefing (splits arrest into "he talked" and "no deal") |
| `entropy_program_exposed` | public exposure ending | `torres_confrontation.ink:503` | Yes | none |
| `recruiter_deal_accepted` | the player sold the Recruiter the TalentStack list ("forty-seven names") in exchange for "nothing points at you" | `ink/m05_phone_recruiter.ink:232` (refused: `:257`) | Yes | none |
| `recruiter_deal_confessed` | took the deal, then admitted it to HaX in the debrief (HaX keeps it "between us", trust −10); lying costs −25 | `ink/m05_closing_debrief.ink:739` | **No** | none |
| `recruiter_deal_offered` / `recruiter_deal_decided` | heard her pitch / answered it. Offered but undecided is its own credit ("left unanswered") | `m05_phone_recruiter.ink:189, 233` | **No** | none |
| `found_pipeline_list` | the player read the envelope under Torres' keyboard (47 names). Decides whether SAFETYNET has the list | erb:2272 (`onRead`) | **No** | none |
| `torres_called_in` | player backed off a hostile Torres and HaX sent Security; nobody talked to him | `m05_phone_agent_0x99.ink:756` | **No** | m06 reads it only through `final_choice == "arrest"` |
| `confront_stance` | `sympathetic` / `hardline`: how the player read Torres | `torres_confrontation.ink:145, 149` | **No** | none |
| `halloran_accused` | the player wrongly named Dr Ruth Halloran first. She is suspended then cleared; the rotation window is lost ("East of England re-keyed a month early"); title becomes "AT A COST" | `ink/m05_npc_patricia_morgan.ink:402`, `ink/m05_phone_patricia.ink:168`, `ink/m05_phone_agent_0x99.ink:462`; credits erb:182, 187, 194 | **No** | none |
| `handler_trust` | number 0–100, HaX's confidence, built in the briefing, cut by friendly KOs and the Recruiter lie | `ink/m05_insider_trading_opening.ink:75-313`; `m05_closing_debrief.ink:158-176, 746, 752` | **No** | none (m05 is the only late mission with this variable) |
| `patricia_ko`, `owen_ko`, `lisa_ko`, `halloran_ko`, `torres_ko` | the player knocked out an innocent member of staff (or Torres) | erb:1639, 1690, 1949, 2028, 2166 (`globalVarOnKO`) | **No** | none |

Decisions that matter and aren't exported: `recruiter_deal_confessed` (and the lie), `found_pipeline_list`, `halloran_accused`, `torres_called_in`, `handler_trust`, `confront_stance`. The Recruiter's deal is the big one: a player who sold the list and lied to HaX has a secret the finale could spend.

### m05.2 Characters' end states

| Character | Role, cell, sprite | End states | Reappears |
|---|---|---|---|
| David Torres | QDC cryptography lead, Insider Threat Initiative placement ("QD-001"); `david_torres` | Turned (SAFETYNET asset, "We'll be leaning on him for months", `m05_closing_debrief.ink:795`); handed to police after talking; handed over silent; walked out by Security; detained after a fight, silent in hospital; dead on the data-centre floor; publicly named "The Quantum Traitor" and arrested | m06 briefing names his fate (one line). No later appearance |
| Elena Torres, Sofia (11), Miguel (8) | his wife (Stage 3 cancer) and children; no sprites | Treatment funded from Monday (turn, or arrest with cooperation); unfunded; widowed (lethal); family on the news (exposure) | never |
| The Recruiter ("R.") | runs TalentStack Executive Recruiting, the Initiative's front; phone only, a woman; no sprite | Always free. Offer refused, taken, taken and confessed, or left unanswered. Line goes dead at the end of her calls (`m05_phone_recruiter.ink:370, 384`) | never; nobody follows her up |
| Patricia Morgan | QDC Chief Security Officer; `patricia_morgan` | Ally; may be knocked out | never |
| Owen Gallagher, Lisa Park | sysadmin, marketing (Lisa ran the collection tin for Elena); `owen_gallagher`, `lisa_park` | Bystanders; may be knocked out | never |
| Dr Ruth Halloran | QDC Chief Scientist; `ruth_halloran` | Red herring; may be wrongly accused and suspended, then cleared; may be knocked out | never |
| Director Netherton | `male_spy_v2` in m05/m06 (m07/m08 use `netherton`) | Briefing cameo; wants the player "in his office at two" after public exposure (`m05_closing_debrief.ink:698, 701`) | every mission |
| Nightshade | `nightshade`; briefing cameo as the mole-catching expert ("Learn from him", `ink/m05_insider_trading_opening.ink:36`) | His "the calm of someone who's decided the rules don't apply to them" line (`:64`) is quoted back in m08 | m06, m08 |

### m05.3 Open threads

- **The forty-seven.** TalentStack's pipeline of 47 candidates "under evaluation" (`m05_phone_recruiter.ink:85`). Fate depends on the list and the deal: SAFETYNET "reached three of the forty-seven already" (list found and not sold, `m05_closing_debrief.ink:718, 727`); list left with her courier (deal taken, or never found). The Recruiter: "You won't reach all of them before I've closed on a few more" (`m05_phone_recruiter.ink:253`). Nobody in m06–m08 mentions the forty-seven again. m08's Nightshade was recruited by the same Initiative fifteen years earlier, which links the two without anyone saying so.
- **Twenty-three active placements** of the Initiative (`m05_insider_trading_opening.ink:190`). Turned Torres gives "the companies, and some of the names" (`m05_closing_debrief.ink:459`); exposure blows all 23 (`:671`). Nightshade (m08) was one of the Initiative's placements, and is the payoff the player didn't know they were chasing.
- **Torres as an asset.** The turn ending promises months of intelligence from inside the Initiative. Never picked up.
- **The Architect's authorisation** goes on Task Force Null's wall (`m05_closing_debrief.ink:783`), alongside the m04 thread. "Somebody pays the Architect, too. Next, we follow the money" (`:807`) leads into m06.
- **Public exposure** burnt the player's consultant cover and three newspapers want their source (`m05_closing_debrief.ink:692-701`). Netherton's two o'clock meeting is never shown.
- **The Recruiter's threat**: "The next one might cost me more, and I'll enjoy the work regardless" (`m05_phone_recruiter.ink:255`). She is the one named Initiative figure still free.
- **ENTROPY cell status at the end:** Insider Threat Initiative damaged in this country (most so on exposure: "finished in this country, for now", `m05_closing_debrief.ink:684`), the Recruiter free, TalentStack's offices empty only on exposure.

### m05.4 Kit and capabilities

Start kit: phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit (taken off the OptiGrid crew at Albion in m04). No PIN cracker (erb:623-651). Nothing new is added. The print kit opens the key vault with Torres' print off his mug (erb:647-650).

### m05.5 Canon facts

- SAFETYNET has no arrest powers; it hands people to the police and can't promise sentencing (`m05_closing_debrief.ink:16-17`).
- The Initiative was paid $847,000 for this job from the Architect's fund (`m05_closing_debrief.ink:779`); m06 traces that payment out of `1ARCHITECT9FUND` (PASS2_APPROVAL_LOG.md:560-566).
- Cells named so far, per HaX: Ransomware Incorporated, Zero Day Syndicate, Critical Mass, the Insider Threat Initiative; "The cells share suppliers, targets and a signature" (`m05_closing_debrief.ink:775-777`).
- SAFETYNET's work is deniable; "When this goes right, nobody hears about us at all" (`m05_closing_debrief.ink:692`).
- Three Elenas across m05–m07 (Elena Torres, the old Elena Volkov now Irina Volkova, Elena Rodriguez). Avoid a fourth.

---

## m06 Follow the Money

HashChain Exchange, a night under FCA cover. The Crypto Anarchists run ENTROPY's bank; their CEO "Satoshi Nakamoto II" signs the Architect's Fund as "Satoshi's Ghost" (`ink/m06_satoshi_confrontation.ink:117`). The fund: $3.2M in advances already paid, $12.8M pending, pre-signed to release in 72 hours to six cells (erb:78). Exports: `assets_seized`, `monitoring_enabled`, `asset_decision_deferred`, `irina_recruited`, `irina_arrested`, `architect_identity_found` (erb:599-600). Imports `m05_final_choice`, `m05_elena_treatment_funded` (erb:595-598). `irina_recruited` and `irina_arrested` are mutually exclusive (erb:580-582).

### m06.1 Player decisions

| Global | Values and meaning | Set at | Exp | Read by |
|---|---|---|---|---|
| `assets_seized` | froze the $12.8M into a SAFETYNET wallet before the payout. ENTROPY knows SAFETYNET was inside its bank; "We won't get in again" (`ink/m06_closing_debrief.ink:154`) | `ink/m06_satoshi_confrontation.ink:369`; by phone after a Satoshi KO `ink/m06_phone_agent_0x99.ink:564` | Yes | m07 briefing (Netherton's "Frozen or watched" line, `m07_architects_gambit/ink/m07_opening_briefing.ink:35`) |
| `monitoring_enabled` | left the payout running, tagged; "Every cell that took a payout is on our map, and they don't know it" (`m06_closing_debrief.ink:160`) | `m06_satoshi_confrontation.ink:412`; phone `:571` | Yes | m07 briefing (`:37`) |
| `asset_decision_deferred` | the player put the wallet decision off (before finding the slot or the keys). Not an ending on its own: the decision is still made later or the run never makes it | `m06_satoshi_confrontation.ink:320, 327, 352`; phone `:578, 583` | Yes | m07 via `m06_completed` only ("You never froze that fund", `m07_opening_briefing.ink:39`) |
| `irina_recruited` | Dr Irina Volkova, the mixer's designer, turned; gives the mixer, pool keys, wallet map, "the name on the account that pays me" (`ink/m06_npc_irina_volkova.ink:557`) | `m06_npc_irina_volkova.ink:545` | Yes | none |
| `irina_arrested` | detained and handed to the police with the laundering evidence | `m06_npc_irina_volkova.ink:570` | Yes | none |
| `architect_identity_found` | opened Satoshi's private safe (PIN 2140) and read his insurance file: 87% the Architect is Dr Adrian Tesseract | erb:2570 (`onPickup`) | Yes | m07 HaX `topic_teacher` (`m07_architects_gambit/ink/m07_phone_agent_0x99.ink:776-793`) |
| `satoshi_stance` | `rejected` / `wondered` / `refused`: the player's answer to "Do you ever wonder if we're right?" "Wondered" is told to the arresting officer, and HaX leaves it out of the file | `m06_satoshi_confrontation.ink:543, 547, 551` | **No** | none |
| `irina_ko` | Irina knocked down (before or after her fate). Untouched-fate KO: "We had a cryptographer inside ENTROPY's money. Now we have a defendant" | erb:1796 | **No** | none |
| `satoshi_ko` | Satoshi knocked out in his office ("Someone took a photo") | erb:2496 | **No** | none |
| `cover_strained` | HashChain rang the FCA; "that might cost us the next job" (`m06_closing_debrief.ink:370`) | erb:968, 1349, and the console strike mappings | **No** | none |
| `console_tripped` | the player brute-forced the custody console; "ENTROPY will know exactly where we looked" | erb:1413 | **No** | none |
| `minder_walked` | Kemal Aydin, Satoshi's minder, read the casualty line and walked out, still at large | `ink/m06_npc_minder.ink:170` | **No** | none |
| `minder_vouched` / `minder_hostile` / `minder_ko` | got past Kemal on Irina's word / he fought / knocked out | `m06_npc_minder.ink:144`; erb:2395, 2330 | **No** | none |
| `guard_ko`, `trader_ko`, `analyst_ko` | innocent HashChain staff knocked out (checkpoint guard, Dani Okonkwo, Priya Raghavan) | erb:1691, 1878, 2193 | **No** | none |
| `analyst_told` | the player went back and told Priya what her graph showed | Priya's ink | **No** | none |

Decisions that matter and aren't exported: `satoshi_stance` ("Sometimes. But I chose my side." is a confession Satoshi could repeat), `cover_strained`, `console_tripped`, `minder_walked` (a Crypto Anarchists operative at large who refused the casualty figure), `irina_ko`.

### m06.2 Characters' end states

| Character | Role, cell, sprite | End states | Reappears |
|---|---|---|---|
| "Satoshi Nakamoto II" / "Satoshi's Ghost" | HashChain CEO, Crypto Anarchists leader, the Architect's banker; `satoshi_nakamoto` | Always detained and handed to the police (no escape, PASS3 D5); conscious or knocked out. Parting shot: "You closed one exchange. The Architect keeps spares" (`m06_satoshi_confrontation.ink:586`). He'll make speeches at the trial | never |
| Dr Irina Volkova | HashChain CTO, designed the mixer, Crypto Anarchists; `irina_volkova` | Turned (asset, on the condition "what I give you tonight gets used. Not buried", `m06_npc_irina_volkova.ink:541`); detained; knocked down with or without a fate | never |
| Kemal Aydin | Satoshi's minder, Crypto Anarchists operative; `kemal_aydin` | Walked out, at large; talked past; let in on Irina's word; turned the player back; fought; knocked out (custody) | never |
| Dani Okonkwo (trader), Priya Raghavan (analyst), checkpoint guard | innocents; `dani_okonkwo`, `priya_raghavan`, `hashchain_guard` | Left alone or knocked out; Priya may be told what she drew | never |
| HaX | `agent_hax` | Personal beat on the Tesseract file: "...I was one of his students" (`m06_closing_debrief.ink:555`) | every mission |
| Nightshade | `nightshade`; briefing cameo, reads the transaction graph ("Money's just another protocol, and this one leaks", `ink/m06_opening_briefing.ink:32`) | Present in the room for the m06 briefing, so he heard what SAFETYNET knew about the fund | m08 |

### m06.3 Open threads

- **The Tesseract lead.** Satoshi's file (erb:2560-2570): "Dr. Adrian Tesseract (former SAFETYNET chief strategist, defected 7 years ago) ... Mentored several current SAFETYNET agents ... Believed the Cyber Security arms race accelerates collapse ... 87% probability". HaX: "Our chief strategist, once. Walked out seven years ago" (`m06_closing_debrief.ink:529`), "He wrote the training I gave you" (`m06_closing_debrief.ink:533`), "Satoshi doesn't round up" (`:536`), "...I was one of his students. ... If it's him... Let's leave it there for tonight" (`:555-559`). HaX's in-mission text on reading it: "Tesseract. ...Bring that page out with you. Don't read it to anyone else" (erb:1552). A player who left the safe shut hears "A man like that keeps insurance" (`m06_closing_debrief.ink:566`) and the credits say "IDENTITY: Unknown" (erb:237).
- **The money map.** Watched: every cell that takes a payout is tagged. Frozen: the mixer is dark and "Every cell needs a new bank" (`m06_closing_debrief.ink:339`). The fund document lists the six cells and their operations (erb:78), which are m07's four sites. The advances ($3.2M) were paid either way, which is why m07 happens on every branch.
- **Irina's leads.** The account that pays her; the pool keys and wallet map; her condition that it gets used. Never picked up.
- **Kemal at large** after `minder_walked`, a Crypto Anarchists operative who wouldn't stand behind 350–600 deaths. A possible defector.
- **"The Architect keeps spares."** A second exchange or bank exists.
- **HaX's close:** "Six cells, one fund, one seventy-two-hour clock. Somebody wrote one schedule for all of them" (`m06_closing_debrief.ink:578`), then "Get some rest. Keep your phone on" (`:593`). Pays off in m07.
- **The FCA letter** grades the player's findings; a strained cover means "The FCA wants to know who was using its name".
- **ENTROPY cell status at the end:** Crypto Anarchists lose their CEO and (unless turned) their best cryptographer, "Replacing her will take them months" (`m06_closing_debrief.ink:277`). Six funded cells are still live and three days from the operations m07 shows.

### m06.4 Kit and capabilities

Start kit: phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit (erb:603-639). No PIN cracker. Uses: badge clone off Irina's lanyard, Satoshi's thumb off his press clipping to open his signing case (the optional print payoff). No new kit carried forward. The player gains a $12.8M SAFETYNET-held wallet on the freeze branch (story asset, not an item).

### m06.5 Canon facts

- The Architect's lead suspect is **a lead, not a fact**. 87%, from an ENTROPY CEO's own analysis. Tesseract left SAFETYNET **seven years** ago over a philosophical disagreement; he **trained half the field**; HaX was his student.
- The fund: $12.8M pending, 72-hour clock, six cells (Critical Mass, Ghost Protocol, Social Fabric, Supply Chain Saboteurs, Digital Vanguard, Zero Day Syndicate), "The Architect's Masterpiece", 350–600 projected dead (erb:78; `m06_closing_debrief.ink:131-137`).
- Satoshi's Ghost is the Crypto Anarchists' leader, "Not Ghost Protocol" (`ink/m06_phone_agent_0x99.ink:554`).
- m06's player sprite is `hacker`; m05, m07 and m08 use `male_hacker_hood_down_v2`. The finale should use the latter.

---

## m07 The Architect's Gambit

Three days after m06. Four ENTROPY operations go live in the same minute; the player is inside Pacific Northwest Regional Grid Control (Portland) stopping Critical Mass's cascade, and has one tactical team to send to one of the other three. The Architect calls the player's handset five times. Exports: `team_assignment`, `team_redirected`, `grid_saved`, `mercer_fate`, `elena_outcome`, `architect_echo_heard` (erb:2386-2387). Imports `m06_assets_seized`, `m06_monitoring_enabled`, `m06_architect_identity_found`, `m06_completed` (erb:2380-2385). Identifier authority: `scenarios/m07_architects_gambit/CONTRACT.md`.

### m07.1 Player decisions

| Global | Values and meaning | Set at | Exp | Read by |
|---|---|---|---|---|
| `team_assignment` | `fracture` (Washington, election data: records lost, fake-fraud story stopped); `trojan_horse` (Austin, TechForge signing keys: no backdoor shipped); `meltdown` (San Francisco SOC: 4,200 hospitals had a normal night); `""` (team never sent, circled over Denver) | `ink/m07_opening_briefing.ink:287, 295, 303`; HaX `ink/m07_phone_agent_0x99.ink:189, 198, 207` | Yes | m08 briefing, ATHENA's day-nine line (`m08_the_mole/ink/m08_opening_briefing.ink:27-39`) |
| `team_redirected` | the player found the corrected projection (dormancy nine days, not ninety; dispatch and health-record keys on the manifest) and moved a committed team to Austin mid-run. Stopped at 30%; 14 million systems took the backdoor; dispatch keys reached first | `m07_phone_agent_0x99.ink:639-640` | Yes | m08 briefing |
| `grid_saved` | the abort held. **Always true on a finished run** (the debrief needs it, erb:73, 613) | erb:613 | Yes | none; low value as an import |
| `countdown_expired` | the 15-minute clock ran out before the abort: **step one ran and Seattle went dark** until the abort | erb:732 | **No** | none |
| `mercer_fate` | `arrested` (in custody and talking, or hollowed after being told he was a diversion); `escaped` ("He will surface"); `ko` (came at the player, then gone before the police arrived); `""` (left at the console, gone) | `ink/m07_npc_james_mercer.ink:327, 349, 377, 398` | Yes | none |
| `mercer_ko` | Mercer knocked out: custody, silent | erb:2063 | **No** (only implied by `mercer_fate`) | none |
| `mercer_stance` | `condemned` / `reasoned` / `silent`: how the player faced him | `m07_npc_james_mercer.ink:95, 104, 113` | **No** | none |
| `mercer_told_diversion` | the player told Mercer he was scenery for a bigger operation | `m07_npc_james_mercer.ink:250` | **No** | none |
| `elena_outcome` | `turned` (statement given; "Analysis wants her. I have not decided"); `fled` (gone, "took nothing and broke nothing"); `""` | `ink/m07_npc_elena_rodriguez.ink:306, 391, 402` | Yes | none |
| `elena_ko`, `elena_met` | knocked out (the one Critical Mass member who tried to stop it); spoken to but left at the rack | erb:1871; Elena's `opening` | **No** | none |
| `hollis_resolved` | `talked` (police at the gate; he gave the vault rule and Park); `evaded` ("still on their payroll"); `ko` (went for the agent, left standing); `""` | `ink/m07_npc_ray_hollis.ink:207, 255`; HaX mapping for `evaded` | **No** | none |
| `hollis_ko`, `hollis_cloned` | knocked out (in hospital); badge cloned off his belt, he never knew | erb:1424; Hollis ink | **No** | none |
| `park_resolved` | `talked` (switch left intact, walked into the cordon); `evaded` / `ko` (finished the cut and walked out) | `ink/m07_npc_thomas_park.ink:116, 149, 158` | **No** | none |
| `park_ko` | Thomas Park found unconscious in the vault | erb:2286 | **No** | none |
| `projection_revised`, `revision_found_open`, `revision_before_commit`, `redirect_declined` | the player found the correction; found it with the window still open; had it before committing; weighed a redirect and held. The debrief's "You knew. You found it and it did not move" (`ink/m07_closing_debrief.ink:401`) | flag 1 decode and Elena; erb:962, 969; `m07_phone_agent_0x99.ink:644, 653` | **No** | none |
| `found_tomb_gamma` | read the Tomb Gamma dossier in the cable vault | erb:2349 | **No** | none |
| `found_mole_evidence` | read the intercept from a safetynet.gov address, timestamped 51 minutes before the tasking order | erb:2363 | **No** | none (m08 assumes it) |
| `architect_echo_heard` | the Architect said HaX's line "Let it hurt afterwards, not during" on the player's handset | `ink/m07_architect_comms.ink:119` (and fallbacks `:186, 267, 327, 376`) | Yes | none |
| `teacher_discussed` | the player read the line back to HaX, who said "The man it names taught it to me" | `m07_phone_agent_0x99.ink:777`; **local ink VAR**, not a scenario global (CARRY_OVER_PLAN.md 2.9) | **No (can't be)** | none |
| `debrief_stance` | `defended` ("I'd make it again"), `owned` ("mine to carry"), `refused` ("Don't ask me to rank them"), `hardened` ("I want the numbers before he writes them"; Netherton takes it to the Council) | `ink/m07_closing_debrief.ink:663, 680, 687, 695, 708` | **No** | none (CONTRACT.md:325-329 says it exists "so the campaign layer can pick it up") |

Decisions that matter and aren't exported: `countdown_expired` (Seattle), `debrief_stance`, `found_tomb_gamma`, `found_mole_evidence`, `hollis_resolved`, `park_resolved`, `mercer_stance`, `mercer_ko`, `revision_found_open` (knew and didn't move the team), `teacher_discussed` (needs promoting to a scenario global first).

### m07.2 Characters' end states

| Character | Role, cell, sprite | End states | Reappears |
|---|---|---|---|
| The Architect | ENTROPY's planner; phone only, `the_architect`, no sprite; voice Sadaltager with distortion, "a man in his sixties" | Calls five times (T-30, T-20, T-10, T-5, T-1) and signs off after the abort: "I wasn't playing for tonight" (`ink/m07_architect_comms.ink:433`). Hangs up first every time | m08 by reference only |
| Dr James Mercer, "Blackout" | Critical Mass cell leader, 58, signed the 240–385 casualty projection; `james_mercer` | Arrested and talking; arrested and hollowed ("The grid is still fragile"); escaped; came at the player and vanished; knocked out and silent. Threat: "When the fourth submission is declined, agent, somebody does this" (`m07_npc_james_mercer.ink:411`, after the abort) | never |
| Elena Rodriguez | Critical Mass electrical engineer, the only sympathetic insider; `elena_rodriguez` | Turned (analysis wants her); fled; knocked out; left at the rack | never |
| Ray Hollis | facility guard, bought (renewed Mercer's credentials for money); 36, two children; `ray_hollis` | Talked and arrested at the gate; cloned and left "still on their payroll"; evaded; knocked out (hospital); went for the agent | never |
| Thomas Park | Critical Mass sabotage tech in the cable vault; `thomas_park` | Talked (switch intact); evaded or fought, finished the cut and walked; knocked out | never |
| Director Netherton | `netherton`; runs the briefing by tablet and the debrief in person | Declines to make the triage choice for the player ("I will log it, I will defend it"); ends suspecting level-five clearance | m08 lead |
| HaX | phone only in m07 | Strained; teaches the player "Let it hurt afterwards" (`m07_phone_agent_0x99.ink:691`), then hears it from the Architect | every mission |
| Named off-screen | Michael Reeves (Ghost Protocol lead, "does not attend"), Jennifer Walsh ("Trojan Horse", Supply Chain Saboteurs), Marcus Ashford ("The Liquidator", Digital Vanguard, "never with them") | Uncaught on every branch. Three Ghost Protocol operatives in custody on Fracture; two Digital Vanguard insiders on Meltdown (`ink/m07_closing_debrief.ink:171, 213`) | never |
| Two SAFETYNET field agents | unnamed | Dead at the unanswered sites, "Names withheld until the families are told" (`m07_closing_debrief.ink:365`) | m08 (motive for the mole hunt) |

### m07.3 Open threads

- **The four-site night.** Netherton reads out the sites the team didn't reach (`m07_closing_debrief.ink:329-427`):
  - **Fracture uncovered:** every voter record in 43 states gone, the Social Fabric fraud package published, two secretaries of state talking about postponing elections, 20–40 dead in the week's disorder, records on sale "permanently".
  - **Trojan Horse uncovered:** 47 million systems took a signed backdoor; **on day nine dispatch in eleven counties starts dropping calls**, 90–160 dead over the month, then 18,000 hospitals rebuild from bare metal.
  - **Meltdown uncovered:** futures down 14%, banking dark, ransomware in 4,200 hospitals, 80–140 patients projected dead this week.
  - **Covered:** Fracture keeps the story from running (records still lost); Trojan Horse direct stops it all; redirected stops it at 30% (14M systems, "a national programme, starting Monday") but saves dispatch; Meltdown leaves "eight of the twelve held clean", futures down 3%.
  - No team: all three read out, and Netherton wants a written explanation.
  - **Day nine** lands in m08: ATHENA says dispatch in eleven counties is still answering (Austin covered) or "has started dropping calls" (anyone else) (`m08_opening_briefing.ink:27-39`). m08 is set on day nine. Anything after m08 is day ten onwards: the Trojan Horse damage is live and growing for every player who didn't cover Austin, and the 18,000-hospital rebuild is ahead.
  - **The database theft** (m08) recasts the whole night as cover. PASS2_APPROVAL_LOG.md:738 leaves both readings standing ("measuring" the agent, and theatre for the theft) "for the m09 author".
- **Seattle.** If the clock ran out, step one ran and Seattle went dark until the abort (credits erb:196; debrief `:577`). Not exported.
- **The mole.** The intercept (erb:2356-2365): "Four targets, simultaneous. 0x00 to Portland. One team uncommitted -- they'll have to choose. Window: forty minutes." Sent from `[REDACTED]@safetynet.gov`, 51 minutes before the order. Netherton: "Level five clearance ... is a small room" (`m07_closing_debrief.ink:625`). Paid off in m08. A player who didn't read it gets the "thin" coda (no proof, only reasoning).
- **Tomb Gamma** (dossier, erb:2338-2352): "SITE DESIGNATION: TOMB GAMMA / STATUS: ACTIVE / CLASS: workshop / LOCATION: [REDACTED AT SOURCE]". Annotation: "The Architect's workshop. Where entropy is refined." "Everything the cells field has been through Gamma first. Including the people." The coordinate field is empty and deliberately so (CONTRACT.md:115-116). Netherton: "Somebody knows where it is. That somebody has been reading our tasking board" (`m07_closing_debrief.ink:637`). HaX: "Bag it. That's what we work from next" (`m07_phone_agent_0x99.ink:767`).
- **The Tesseract echo.** The Architect: "Let it hurt afterwards, not during. I expect you've been told that." (`m07_architect_comms.ink:122`). HaX in `topic_teacher`: "I say it to every agent I run" and, with m06's safe opened, "The man it names taught it to me" (`m07_phone_agent_0x99.ink:782-792`); else "Somebody taught it to me, a long time ago. Somebody who taught a lot of us." Then "keep it out of your notes for now." **HaX's reaction is optional** (the player has to raise it, and only if they heard the echo).
- **The Architect's promises:** "I'll have the figures from [the two left] by morning" and "You'll have the figures too. Then we'll both know the same thing about you" (`m07_architect_comms.ink:410-440`). "Probably in a room with a tablet in it." He was measuring the agent: "He measured you. He did not beat you" (`m07_closing_debrief.ink:595`). Netherton: "Uses it. That is next year's problem" (`:588`). The reading of the player is something the Architect holds.
- **The decode's signature:** "Entropy is inevitable. Systems decay. I merely publish the schedule. -- A." (erb:1969).
- **Netherton's next steps:** 72 hours' leave (`:642`), "a room without windows" (`:744`), stopping briefings until the leak is found. On `hardened`: "I will raise it with the Council on Monday" (`:725`).
- **Mercer escaped**, Elena fled, Hollis "still on their payroll", Park walked: four possible returns for a finale that wants faces from earlier nights.
- **ENTROPY cell status at the end:** Critical Mass loses its Portland operation; Mercer's fate varies. Ghost Protocol, Social Fabric, Supply Chain Saboteurs, Digital Vanguard and Zero Day Syndicate each either lost their operation (covered site) or completed it (uncovered). Every cell lead except possibly Mercer is free.

### m07.4 Kit and capabilities

Start kit: phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, plus a Threat Desk Summary (CONTRACT.md:32, 43). No PIN cracker ("Analysis still has it in pieces", `m07_opening_briefing.ink:54`). The player's handset has been hijacked by the Architect and leaves no log. Nothing new carried forward.

### m07.5 Canon facts

- The Architect is heard, never seen. Male, sixties, unplaceable educated English, short quiet lines, never angry or triumphant, never names himself, at most one "teacher" echo per mission (`story_design/universe_bible/04_characters/voice_bible.md:166-199`).
- He "hangs up first every time". He doesn't gloat when he loses: "Success was never the variable" (`m07_architect_comms.ink:14`, `:383`).
- The time base (m08 CONTRACT.md:206-208): the Citadel keeps UTC; T-0 is 10:41 UTC on the Portland night; m08 counts days from the Portland order.
- Projections: Portland 240–385 dead if the cascade ran; 8.4 million people, 147 substations.
- HaX's line is HaX's, taught to her by her teacher. HaX says it in her first call and in "How do you carry that?" (`m07_phone_agent_0x99.ink:691`; `hurt_line_said`, CONTRACT.md:36). The Architect echoes it minutes later.
- Netherton has run field operations for five years (m08 CONTRACT.md:283).
- "Marcus Chen", "Adrian Cross", "Specter", "The Professor" and others are cut names for m07 (CONTRACT.md:110-113). Don't reintroduce them.

---

## m08 The Mole

Day nine after Portland. SAFETYNET headquarters, the Citadel, at Level Red. Netherton gives the player three suspects with planning access: Agent 0x23 "Vector", Agent 0x88 "Phantom", Agent 0x47 "Nightshade". The VM is SAFETYNET's own unpatched code server; its four flags lead to the mole's mail to the Architect and the access logs. The player names the mole off the door audit, confronts Nightshade in the interrogation suite and decides his fate. **No `exportGlobals`.** Imports `m07_team_assignment`, `m07_team_redirected`, `m07_completed` (erb:2572-2576).

### m08.1 Player decisions

| Global | Values and meaning | Set at | Exp |
|---|---|---|---|
| `nightshade_arrested` | "No deals. The police get the file." Also forced by a knock-out before the fate | `ink/m08_nightshade_confrontation.ink:216`; KO mapping erb:1054 | **No** |
| `nightshade_triple_agent` | "No cell. A leash." He stays in place feeding SAFETYNET ENTROPY, on Netherton's countersignature: "for exactly as long as it suits me" | `m08_nightshade_confrontation.ink:223` | **No** |
| `triple_agent_first_payment` | his first payment: he knows which entries from SAFETYNET's own threat database were used for Tomb Gamma's defences, and will say "when you're standing at the door". Set on every triple-agent run, so it equals `nightshade_triple_agent` | `m08_nightshade_confrontation.ink:225, 228` | **No** |
| `nightshade_ko_before_fate` | knocked down before he answered; handed over "without a word of his own on the record". Needs a reload mid-scene, so rare | erb:1054 | **No** |
| `tomb_gamma_location_known` | the Montana coordinates (47.2382 N, 112.5156 W, "an old Cold War bunker"). Asked for in the hub, or volunteered after the fate. **False only after a knock-out before the fate** | `m08_nightshade_confrontation.ink:204, 206`; `lock_in` `:236-242` | **No** |
| `debrief_stance` | `defended` ("He's the crime, not you") or `owned` ("Own the gap, or it happens again"): the player's verdict on Netherton sealing Dr Okafor's warning about Nightshade a year ago | `ink/m08_closing_debrief.ink:86-87, 95-97` | **No** |
| `suspect_theory` | the first name the player gave Netherton: `vector`, `phantom` or `nightshade` | `ink/m08_director_netherton.ink:161, 166, 171` | **No** |
| `named_on_evidence` / `named_by_hax` / `audit_closed` / `audit_misread` | how the mole was named: off the door log to Netherton; read to HaX because Netherton was down or hostile; Netherton read it himself after three wrong readings (and tipped Nightshade off); got there after a misread | `m08_director_netherton.ink:406, 416, 397`; `ink/m08_phone_agent_0x99.ink:241-243` | **No** |
| `accused_vector`, `accused_phantom` | accused an innocent colleague to his face ("It will follow him longer than it follows you") | `ink/m08_suspect_vector.ink:154`; `ink/m08_suspect_phantom.ink:130` | **No** |
| `vector_apologised`, `phantom_apologised` | went back and apologised | `m08_suspect_vector.ink:108, 115`; `m08_suspect_phantom.ink:114, 119` | **No** |
| `vector_ko`/`vector_hostile`, `phantom_ko`/`phantom_hostile` | hit an innocent colleague | erb:1590, 1721 and the hostile mappings | **No** |
| `netherton_ko`, `netherton_hostile` | the player struck the Director ("My jaw is fine, thank you for asking") | erb:1431 and mappings | **No** |
| `hax_ko` | the player knocked out HaX in the break room | erb:2260 | **No** |
| `nightshade_tipped_off`, `tipoff_source`, `nightshade_tidied` | something warned him (an accusation, a witness at the lockers, a knock-out on the floor, ATHENA, the Director's questions) and he cleared his locker: "Whatever he had time to clear, we will never see now" | erb:700, 1124-1165; `m08_director_netherton.ink:397` | **No** |
| `go_bag_lining_known` | the holdall: a passport in another name, one-way e-ticket to Helena, Montana, for the morning after Portland | erb:2508; HaX text erb:1184 | **No** |
| `nightshade_print_lifted`, `netherton_card_cloned` | print off his USB stick; the Director's card cloned at his side | HaX mappings; erb:1071 | **No** |
| `offduty_agent_ko`, `analyst_ko`, `athena_ko`, `locker_seen_picked` | conduct on the floor; each also tips the mole off before the naming | `globalVarOnKO` erb:2289, 1646, 678 | **No** |
| `database_theft_understood` | the player knows the four attacks covered the theft of the Global Threat Database. Also set by the flag-4 mappings, so effectively always true on a finished run | confrontation `:196`; flag 4 | **No** |

### m08.2 Proposed m08 `exportGlobals`

For the finale, in priority order:

1. `nightshade_arrested`
2. `nightshade_triple_agent`
3. `nightshade_ko_before_fate` (tells a silent handover apart from the clean one)
4. `tomb_gamma_location_known`
5. `triple_agent_first_payment` (redundant with 2 today, but it names the promise the finale cashes; cheap to export, and safe if a later edit makes the payment optional)
6. `debrief_stance` (m08's: `defended` / `owned`; m09 would import it as `m08_debrief_stance`, distinct from `m07_debrief_stance`)
7. `netherton_ko`, `netherton_hostile` (Netherton remembers)
8. `hax_ko` (HaX remembers)
9. `accused_vector`, `accused_phantom`, `vector_apologised`, `phantom_apologised`, `vector_hostile`, `phantom_hostile` (whether Vector and Phantom will stand with the player)
10. `nightshade_tipped_off`, `nightshade_tidied` (what SAFETYNET never got from his locker)
11. `suspect_theory`, `named_on_evidence` (how well the player read the case; low weight)

`hax_ko` and `netherton_ko` latch on any knock-out, and `vector_hostile`/`phantom_hostile` latch on a knock-out too (erb comment, design C2), so `*_hostile` covers both "punched and left standing" and "knocked out" for those two.

Not worth exporting: `database_theft_understood` (always true by the end), `mole_identified`, `fate_decided` (always true), `go_bag_lining_known`, the guide and lock latches.

Remember the validator rule: every exported name must stay stable (CARRY_OVER_PLAN.md 2.9). m08's ink and audio don't change, because exports are JSON only.

### m08.3 Characters' end states

| Character | Role, cell, sprite | End states | Reappears |
|---|---|---|---|
| Agent 0x47 "Nightshade" | SAFETYNET cryptographic-hardware analyst, fifteen years' service, **taught the player's intake**; Insider Threat Initiative sleeper recruited in his own training at 23; `nightshade` (CONTRACT.md still says `male_scientist`; the erb uses `nightshade`); voice Enceladus | Handed to the police with the full case file; handed over after a knock-out, silent; **retained in place as a triple agent**, "No record of this entry leaves the building" (erb:2216). Says HaX's line to the player at the end: "And 0x00. Let it hurt afterwards, not during" (`m08_nightshade_confrontation.ink:261`) | the bible: "If turned, he may resurface as a live-wire asset in later missions" (`story_design/universe_bible/03_entropy_cells/insider_threat_initiative.md:81`) |
| Director Magnus Netherton | `netherton`; voice Charon | Admits he sealed Okafor's warning; signs whatever fate the player enters; may have been punched or knocked out; on the triple agent: "If he burns you, it is on my signature" (`m08_closing_debrief.ink:185`). "I shall spend the rest of my career reading our own files" | m09/m10 |
| Agent HaX | `agent_hax`, in person in the break room | Cold coffee, close to coming apart: "Don't say anything kind, I'll come apart" (`ink/m08_agent_0x99.ink:34`). On the fate: "You kept him. Then I'll be the one reading every word he sends us." / "Good. I'll visit him once. Then never again." (`:80`). Texts the player during the debrief: "Same classroom, 0x00. Don't ask me whose yet." (`m08_closing_debrief.ink:66`). May have been knocked out by the player | m09/m10 |
| Agent 0x23 "Vector" | innocent; socially awkward crypto specialist; holds a crypto-annex badge from an issuing authority that "will not confirm it", deferred by Netherton (erb:1530); `agent_vector` | Cleared by the door audit; may have been accused, apologised to, hit | possible ally |
| Agent 0x88 "Phantom" | innocent; running his own off-book mole hunt; `agent_phantom` | Cleared (travel desk has him on a Zurich flight); may have been accused, apologised to, hit. His locker: half a boarding pass to ZRH, "Usual place. Bring the list." (erb:2545) | possible ally |
| ATHENA | the Citadel's building AI, logs everyone; `athena` | Opening narrator and reception console; avatar may be knocked down | possible in a SAFETYNET scene |
| Dr S. Okafor | Psychology Division; wrote the sealed warning; off-screen | Vindicated | could be named |
| Junior analyst, off-duty agent | bystanders; `junior_analyst`, `offduty_agent` | May be knocked out | no |
| The two dead agents | unnamed SAFETYNET field agents killed at the unanswered m07 sites | Still unnamed | a finale could name them |

### m08.4 Open threads

- **Tomb Gamma, located.** "Forty-seven point two-three-eight-two north. One-twelve point five-one-five-six west." "An old Cold War bunker in Montana. The database went there, and so did the man who put me here fifteen years ago" (`m08_nightshade_confrontation.ink:204-205`). Netherton: "the first hard address we have ever had for The Architect's workshop, and it is where the database went. That is where this ends, or where we do. Take your seventy-two hours. Then we go to Montana and we get it back." (`m08_closing_debrief.ink:228-231`). Without the coordinate: "He has it in his head ... I will put the question to him before they do" (`:233-235`).
- **The Global Threat Database.** "Every vulnerability SAFETYNET has ever catalogued" walked out through a door Nightshade left open while the player and Netherton chose which fire to fight (`m08_nightshade_confrontation.ink:197-198`). Netherton: "Nine days ago we handed the enemy the map to every battle still coming" (`m08_closing_debrief.ink:213`). It went to Tomb Gamma, and Tomb Gamma's defences were built out of it (`:227`).
- **The triple agent's first payment**: which database entries guard Tomb Gamma, "owed on arrival" (credits erb:197). Plus his warning: "for exactly as long as it suits me. Never forget I told you that part." The finale owes the player either the payment or the betrayal, or both.
- **"The man who put me here fifteen years ago"** went to Tomb Gamma. Nightshade was recruited in SAFETYNET training fifteen years ago; Tesseract left seven years ago and trained half the field. Netherton: "whoever taught her taught him. There are not many people left who could have done both, and I do not like any of the names. We will not say one aloud until we can prove it." (`m08_closing_debrief.ink:219-220`). HaX: "Same classroom" (`:66`). Together these say the teacher recruited Nightshade, without saying it. The bible keeps the confirmation for m09 (`the_architect.md:40`).
- **Nightshade's Montana ticket.** He packed to leave for Helena the morning after Portland and stayed: "a man who runs has confessed" (`:187`). "Montana was always where I was going" (`:189`).
- **Other sleepers.** Netherton: "There may be others in this service, recruited the same way and still waiting" (`m08_closing_debrief.ink:206`). Ties back to the Initiative's forty-seven (m05) and twenty-three placements.
- **The player is burned.** Netherton: "the reason you're still useful to me after they burned you" (`m08_closing_debrief.ink:155`). m07's intercept handed ENTROPY the player by designation. The Architect has "read your file" (m07) and holds a "reading" of the agent.
- **Vector's annex** and **Phantom's Zurich list** are unexplained red herrings; either can be paid off or left.
- **The PIN cracker.** Signed out to Nightshade "since St. Catherine's" (m02) and kept on his bench: "I chose what you went in without" (`m08_nightshade_confrontation.ink:175-178`). With him gone, SAFETYNET can issue it.
- **Netherton's culpability** is on the record (owned) or forgiven by the player (defended).
- **ENTROPY cell status at the end:** the Insider Threat Initiative loses its best-placed sleeper (or SAFETYNET now owns him). The Architect has the database and a workshop address SAFETYNET now knows, unless the player knocked Nightshade out first. Every m07 cell lead is still free.

### m08.5 Kit and capabilities

Start kit: phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit (CONTRACT.md:209-210). No PIN cracker; ATHENA says it's signed out to Nightshade (`ink/m08_opening_briefing.ink:21`). New in m08: the cloner works on a MIFARE card beside its owner (Netherton's card, as m03's Victoria), and the print kit lifts a print off a carried item (Nightshade's USB stick) (erb:1410; CONTRACT.md:262-264). With Nightshade in custody or under SAFETYNET's control, the finale has a reason to hand the player the PIN cracker for the first time.

### m08.6 Canon facts

- Nightshade: fifteen years' service, recruited ideologically in training at 23, "Not with money" (`m08_nightshade_confrontation.ink:170-172`); taught the player's intake (`m08_director_netherton.ink:131`); HaX trained alongside him (voice_bible.md:143). He did the arithmetic of the two deaths "with my eyes open" and never apologises for the act.
- SAFETYNET has no arrest powers: "handed to the police with the case file" (PASS2_APPROVAL_LOG.md:737).
- The Architect is still unconfirmed at the end of m08. **SAFETYNET knows:** an 87% lead on Dr Adrian Tesseract (only if the player opened m06's safe); the Architect used HaX's teacher's line; Nightshade used it too; "whoever taught her taught him"; HaX says "Same classroom ... Don't ask me whose yet". **Nobody says the name aloud in m08** (`m08_closing_debrief.ink:216-222`, "a hedge, never a name"). A player who skipped the m06 safe has heard no name at all.
- The two dead are SAFETYNET field agents, unnamed.
- There is no Director Cross. "Director Cross" in m08's old text and the old season outline (`planning_notes/overall_story_plan/season_1_arc.md:771, 883, 942`, `quick_reference.md:84`) was rename residue; the director is Magnus Netherton (PASS2_APPROVAL_LOG.md:730; `scenarios/m08_the_mole/PASS2_IMPROVEMENTS.md:208`). The old outline's "Director Cross authorizes Tomb Gamma raid" should read Netherton.
- The Citadel keeps UTC; days count from the Portland order (CONTRACT.md:206-208). m08 is day nine.
- Psych evaluator is Dr S. Okafor (renamed from Chen to avoid three Chens).

---

## Threads across m05–m08

### The Tesseract lead

| Step | What the player has | Where |
|---|---|---|
| m06 | The name, 87%, from Satoshi's insurance file, **only if they opened the safe**. HaX: "I was one of his students." | erb:2560-2570; `m06_closing_debrief.ink:526-559` |
| m07 | The Architect says HaX's line on the handset. HaX, if asked: "The man it names taught it to me" (safe opened) or "Somebody who taught a lot of us" (not). Optional conversation; not recorded as a global (`teacher_discussed` is a local VAR) | `m07_architect_comms.ink:116-122`; `m07_phone_agent_0x99.ink:776-793` |
| m08 | Nightshade says the same line at the end. HaX: "I was taught that line ... Same classroom, 0x00. Don't ask me whose yet." Netherton: "whoever taught her taught him ... We will not say one aloud until we can prove it." Nightshade: Tomb Gamma holds "the man who put me here fifteen years ago". | `m08_nightshade_confrontation.ink:205, 261`; `m08_closing_debrief.ink:64-66, 219-220` |
| bible | Lead suspect, not confirmed; confirmation planned for m09; he is in his sixties, which fits | `the_architect.md:33-41` |
| bible only | **Marcus Tesseract**, Adrian's younger brother, founded the Tesseract Research Institute (2015). "The brothers are not known to be in contact." No mission mentions him | `story_design/universe_bible/06_locations/notable_locations.md:44`; PASS4_EDITORIAL_LOG.md:34 |

Two player groups reach the finale: those who have read the name (m06 safe) and those who haven't. Only `m06_architect_identity_found` tells them apart today. The Tesseract Research Institute is the bible's Quantum Cabal front (`03_entropy_cells/quantum_cabal.md:115`), so any use of Marcus has to stay clear of the eldritch material the user has ruled out.

### Tomb Gamma

- m07: a name, a class ("workshop"), "STATUS: ACTIVE", an empty coordinate field, "Including the people" (erb:2341-2350). Optional pickup (`found_tomb_gamma`, not exported).
- m08: the coordinates (47.2382 N, 112.5156 W, Montana, "an old Cold War bunker"), volunteered even if the player never asks, unless he is knocked out before the fate. The database went there; its defences were chosen from SAFETYNET's own database; Nightshade was flying to Helena the morning after Portland.
- The old outline (`season_1_arc.md:883`) has a raid on Tomb Gamma with a "global vulnerability auction scheduled in 48 hours". Not canon in the missions; one option for m09/m10.
- The bible's Tomb Gamma entry (`notable_locations.md:289-295`) is a stub: "Identity revealed (or ultimate mystery deepened)".

### The Global Threat Database

Stolen during the four-site night through a door Nightshade left open; "Every vulnerability SAFETYNET has ever catalogued" (m08). Taken to Tomb Gamma. Its entries built Tomb Gamma's defences (triple-agent line). m07 never mentions it; the approval log keeps both readings of the night (the Architect measuring the agent, and theatre for the theft) for the m09 author (PASS2_APPROVAL_LOG.md:738).

### Nightshade's "first payment"

Triple-agent runs only. "Tomb Gamma's defences were chosen out of our own threat database. I know which entries. Ask me when you're standing at the door." (`m08_nightshade_confrontation.ink:227`). Credits: "owed on arrival" (erb:197). He also warned: "for exactly as long as it suits me" (`:228`). Netherton: "If he burns you, it is on my signature." HaX: "I'll be the one reading every word he sends us." On a handover run SAFETYNET has no inside knowledge of the defences.

### The four-site night (m07) and day nine (m08)

| Team sent to | Uncovered | Consequence by day nine (m08) and after |
|---|---|---|
| Fracture | Trojan Horse, Meltdown | Dispatch in 11 counties "has started dropping calls" (day nine); 90–160 dead over the month; then 18,000 hospitals rebuild. Meltdown: hospitals ransomed, 80–140 projected dead that week, futures −14% |
| Trojan Horse (direct) | Fracture, Meltdown | Dispatch "still answering". Voter records for sale; disorder, 20–40 dead; elections possibly postponed. Meltdown as above |
| Trojan Horse (redirected) | Fracture, Meltdown | 14 million systems backdoored ("national programme"), dispatch saved. Fracture and Meltdown as above |
| Meltdown | Fracture, Trojan Horse | Dispatch failing from day nine; voter records for sale |
| none | all three | All of the above; Netherton wants a written explanation |

Constant on every branch: two SAFETYNET field agents dead at the unanswered sites; the player's deployment was leaked; the Architect has his "reading" of the agent.

### ENTROPY cells at the end of m08

| Cell | State |
|---|---|
| Insider Threat Initiative | The Recruiter free with or without her 47 names; 23 placements damaged (or blown on exposure); Torres gone or turned; Nightshade in police hands or SAFETYNET's |
| Crypto Anarchists | Satoshi and (unless turned) Irina in custody; HashChain shut (freeze) or watched; Kemal maybe at large; "The Architect keeps spares" |
| Critical Mass | Portland stopped; Mercer in custody or loose; Elena, Hollis, Park per branch. (Voltage per m04's import) |
| Ghost Protocol + Social Fabric | Fracture: stopped at the story, or completed. Reeves free |
| Supply Chain Saboteurs | Trojan Horse: stopped, stopped at 30%, or completed with a live nine-day backdoor. Walsh free |
| Digital Vanguard + Zero Day Syndicate | Meltdown: mostly stopped or completed. Ashford free |
| The Architect | Free. Has the Global Threat Database, a reading of the player, the player's identity. Workshop located (unless Nightshade went down first) |

---

## Decisions that matter but aren't exported (m05–m07)

These need a JSON-only `exportGlobals` addition in the source mission before m09/m10 can import them. Adding exports doesn't touch ink or audio, but it does edit those missions, so it's a decision for the orchestrator and the user. The carry-over engine handles booleans, strings and numbers (`app/models/break_escape/carry_over.rb:52-58`).

| Mission | Add to `exportGlobals` | Why |
|---|---|---|
| m05 | `recruiter_deal_confessed`, `recruiter_deal_offered`, `recruiter_deal_decided`, `found_pipeline_list` | Sold the list and lied, sold and confessed, refused with the list, never answered. The most personal secret in the late season |
| m05 | `halloran_accused`, `torres_called_in`, `confront_stance`, `handler_trust` | Wrong accusation; backed off; how the player reads people; HaX's trust as a number |
| m06 | `satoshi_stance`, `cover_strained`, `console_tripped`, `minder_walked`, `irina_ko`, `satoshi_ko` | "Do you ever wonder if we're right?"; the FCA cover; ENTROPY knows where SAFETYNET looked; a Crypto Anarchists defector at large |
| m07 | `countdown_expired`, `debrief_stance`, `found_tomb_gamma`, `found_mole_evidence` | Seattle; the player's own position on the triage (CONTRACT.md:325-329 says it was built for the campaign); whether the player saw the dossier and the intercept |
| m07 | `hollis_resolved`, `park_resolved`, `mercer_stance`, `mercer_ko`, `elena_ko`, `projection_revised`, `revision_found_open` | Who is still loose or bought; whether the player knew and didn't move the team |
| m07 | promote `teacher_discussed` from a local VAR in `m07_phone_agent_0x99.ink` to a synced scenario global, then export it | HaX has already admitted her teacher to this player. Needs a small ink change (declare it in `globalVariables` and add `#set_global`); no spoken line changes (CARRY_OVER_PLAN.md 2.9) |

---

## Finale payoff ideas

Ideas only; the stage-0 author decides. Weight is how much the player would feel it. Rules that apply to every idea: nothing can be gated on an import (the mission must finish with every import at its default), the never-played branch keeps a neutral line, voiced lines choose between fixed strings, and every branch costs TTS (README_scenario_design.md, "Carrying choices between missions").

### Nightshade, Tomb Gamma and the database

- **Triple agent at the door (high).** m09 puts Nightshade on the player's phone as a second voice, competing with HaX, at Tomb Gamma's perimeter. He pays the first payment: each defence named with the database entry it came from, which turns the VM's flags into "our own catalogued weaknesses, used against us". HaX reads every word, as she promised. In m10 the payment proves true except for one entry, and the player has to decide whether he lied or was lied to.
- **Triple agent's limit (high).** "For exactly as long as it suits me." In m10 he either tips the board over on the Architect (his stated wish, "just once, to be the one who tips the board over") or on SAFETYNET. What decides it could be how the player treated him: named on evidence and confronted cleanly, or knocked down in his lab and accused before proof. He told the player which way he leans; let the player find out they were right to listen.
- **Handed over (high).** No inside help. Netherton visits him in custody once and comes back with nothing: "He said you'd know where to find him. He meant the door." The defences are learned the long way (VM work), and HaX's "I'll visit him once. Then never again" can pay off with her doing it.
- **Knocked out before the fate (medium).** No coordinate. m09 opens by locating Tomb Gamma another way: the watched fund's tags (m06 `monitoring_enabled`) show who pays the bunker's bills, or Irina's account name (m06 turned), or Nightshade's Helena ticket. This gives the m06 choices a second payoff.
- **The database as the objective (high).** m09's aim: get the Global Threat Database back or burn it inside Tomb Gamma. If the Architect's endgame is selling or using it (the old outline's "auction in 48 hours"), every earlier vulnerability the player found in m01–m08 could appear on the auction list by name.

### The Architect and Tesseract

- **Two kinds of reveal (high).** For a player who opened m06's safe, m09's confirmation is a quiet click: HaX finally says the name aloud, and it costs her something. For one who didn't, it's the first time they hear it, and HaX's "keep it out of your notes" (m07) was hiding it from them. Same scene, two first lines.
- **The line, finished (high).** The Architect, Nightshade and HaX have all said "Let it hurt afterwards, not during." In m10 the Architect starts it again and the player can finish it, or say what HaX actually does with it. One choice that answers three missions.
- **His reading of the player (high).** The Architect said he'd "have the figures" on the player (m07). In m10 he builds the final dilemma out of the player's own record: where they sent the team (m07), whether they took the Recruiter's deal (m05), whether they froze or watched (m06), whether they kept Nightshade (m08). The player breaks the pattern or confirms it.
- **The man in his sixties, met (medium).** If m10 lets the player face him, keep the voice bible's register (short, quiet, faintly amused, never pleading) and the m07 voice (Sadaltager), without the handset distortion the first time he's in the room.
- **The brother (low).** Marcus Tesseract as a human lever: the one person who knew Adrian before SAFETYNET. Only if it can stay clear of the institute's Quantum Cabal material.

### The four-site night

- **Day nine keeps going (high).** For every player who didn't cover Austin, dispatch in eleven counties is failing through m09/m10. The Trojan Horse backdoor is still in 47 million systems, and the Architect can use it in the finale (a door already open); for an Austin player that door is shut and he has to go another way. The finale's "which routes exist" can follow `m07_team_assignment` directly.
- **Fracture and Meltdown (medium).** Uncovered Fracture: ENTROPY holds 43 states' voter records and Social Fabric's fraud machine, which can turn on SAFETYNET once the raid starts. Uncovered Meltdown: HaX or Netherton mentions the hospitals by count, once.
- **The two dead (medium).** Name them. A memorial board in the m09 briefing, or Netherton reading the names before the Montana go order. Every player has the same two, so it's one clip set.
- **Seattle (low).** One line from the Architect for a player whose clock ran out ("Seattle first. As scheduled." again, in a different building). Needs m07 to export `countdown_expired`.
- **m07 stance (medium).** "Hardened": Netherton's Council meeting happened and the player now gets ENTROPY's projections before the Architect writes them (an analysis desk, a new tool or a timed text). "Refused": Netherton remembers there's no exchange rate. "Owned"/"defended": the Architect quotes the player's own words back.

### People from m05–m07

- **Mercer at the bunker (medium).** Escaped Mercer turns up running Tomb Gamma's power ("When the fourth submission is declined ... somebody does this"). Arrested and talking: his statement gives the bunker's power layout. A turned Elena helps the player with it from the other side.
- **The Recruiter (medium-high).** She was never caught. If the player sold her the list and lied to HaX, she rings again in m10 with the receipt; HaX hears it. If the player confessed, HaX has already covered for them and says so. If the list went to SAFETYNET, one of the forty-seven, warned by SAFETYNET in m05, is now inside Tomb Gamma's staff and helps.
- **Torres (medium).** Turned Torres: his Initiative intelligence names a Tomb Gamma placement or a sleeper. Dead Torres: the gap shows (that sleeper goes unnamed), and Elena is a widow.
- **Irina (medium).** Turned: the account that paid her leads to the money behind Tomb Gamma, and her condition ("gets used. Not buried") is honoured on screen. Detained: no lead.
- **Frozen or watched (medium).** Frozen: Tomb Gamma is short of money and staff, rushed. Watched: SAFETYNET can see every payment into the bunker, which helps locate or map it.
- **Kemal (low).** The minder who walked out over the casualty figure resurfaces as an informant.
- **Hollis and Park (low).** "Still on their payroll": one of them is a guard or technician at Tomb Gamma, and he remembers the player.

### SAFETYNET

- **Other sleepers (high).** Netherton: "There may be others in this service." m10 can make one of the raid team a sleeper. A kept Nightshade can name them, maybe late; a handed-over one can't. A betrayal the player's m08 choice made possible to see coming.
- **Vector and Phantom (medium).** Not accused (or apologised to): Phantom joins the raid (he has been hunting the leak off-book; his "list" is his own suspects) and Vector brings the annex's hardware. Accused and not apologised: they decline, and Netherton says why.
- **Hitting your own side (medium).** `m08_netherton_ko` / `m08_hax_ko`: one line each, never played for laughs. HaX: "You put me on the floor at the Citadel. I'm still running you."
- **Netherton's culpability (low-medium).** "Owned": he signs the Montana order with his own name beside Nightshade's on the file. "Defended": he carries it quietly, and the player sees it once.
- **The PIN cracker (medium).** Nightshade kept it on his bench for six missions. With him gone, m09 issues it: the kit arc's last piece, and a line about "the long way" being over.
- **The burned agent (medium).** ENTROPY knows who 0x00 is. At Tomb Gamma the player is expected: their own photo on a wall, or a door that opens for them by name.
- **HaX's state of mind (high).** She is close to breaking at the end of m08 ("Don't say anything kind, I'll come apart"; "I'll sit here and un-know a friend"). In m09 she has to say her teacher's name; in m10 she has to run the player against him. Give her one line where the dryness slips, then let her get back to work, which is the voice bible's rule.

### Smaller links

- **Task Force Null's wall (low).** The wall of directives from m04/m05 becomes the m09 briefing room, with the m07 decode's "-- A." pinned at the top.
- **Satoshi's "wondered" (low).** The Architect: "You told a man in handcuffs you sometimes wonder. I liked that." Needs `satoshi_stance` exported.
- **Public exposure (low).** "We'll be watching for their reply" (m05). The reply arrives in m10: ENTROPY leaks SAFETYNET's name the same way.

---

## Discrepancies and notes for the finale author

- Netherton's sprite is `male_spy_v2` in m05 and m06 and `netherton` in m07 and m08. m06's player sprite is `hacker`. Use `netherton` and `male_hacker_hood_down_v2`.
- m08 CONTRACT.md §1 lists Nightshade's sprite as `male_scientist` and Vector as "Cipher"; the erb uses `nightshade` and `agent_vector`. The erb is current.
- Two Dr Okafors: m05's QDC staff directory has "Dr Amara Okafor" (m05 erb:1575) and m08 has "Dr S. Okafor" (psychology). m07 renamed its Okafor to Halvorsen because of m08 (m07 CONTRACT.md:51). Avoid a third.
- `season_1_arc.md` and `quick_reference.md` still name "Director Samantha Cross" for M8 and M10; she doesn't exist (see m08.6).
- The bible's Insider Threat Initiative file says Nightshade's fate is "Arrested (trial)"; the game's wording is a handover to the police (PASS2_APPROVAL_LOG.md:737).
- `grid_saved` (m07 export) is always true on a finished run, so it carries no choice. `database_theft_understood` (m08) is the same.
- `triple_agent_first_payment` always equals `nightshade_triple_agent` today.
- `tomb_gamma_location_known` is false only on the knock-out-before-fate path, which needs a reload mid-scene. Plan m09 for the known case and a short fallback.

