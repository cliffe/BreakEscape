# Carry-over inventory A: m01–m04

Phase A of the finale work (`docs/agents/FINALE_BRIEF.md`). What the player can carry out of m01 First Contact, m02 Ransomed Trust, m03 Ghost in the Machine and m04 Critical Failure into m09 and m10.

Sources: each mission's `scenario.json.erb` and `ink/*.ink` as they stand on 2026-10-20 (uncommitted `exportGlobals`/`importGlobals` included), `docs/agents/CARRY_OVER_PLAN.md` "Built", and the universe bible cell and character files. Line numbers are to those files. VM flags are named only as the game names them.

How to read it:
- **Exported** means the name is in the mission's `exportGlobals`, so m09/m10 can import it today as `m0N_<name>`.
- **Read by** lists the later missions that already import it.
- **Not exported** means the value exists in play but a finale import needs a one-line change to that mission's `exportGlobals` first (JSON only; m01's ink and audio stay untouched, per Q5).

---

## m01 First Contact (Social Fabric, Viral Dynamics Media)

### 1. Player decisions

| Global | Values and story meaning | Set at | Exported | Read by |
|---|---|---|---|---|
| `final_choice` | `fight`: player attacks Derek, he is beaten and restrained. `arrest`: by the book, he goes quietly and says nothing. `recruit`: player offers a deal, Derek refuses ("I will never betray ENTROPY") and is taken in. `expose`: player uploads the projections and targeting lists to the press, then backup takes him. `surrender`: only with the archive in hand; Derek puts the launch device down and says "The Architect planned for this". `""` with a finished run: Derek was knocked out before he chose. | `ink/m01_derek_confrontation.ink:272-286` | yes | m02 briefing (`m02_opening_briefing.ink:88-96`, one HaX line per value, incl. the undecided KO) |
| `kevin_choice` | `warn`: player warned Kevin of Derek's frame-up. `evidence`: player showed him the contingency file. `ignore`: player left it; Kevin was arrested under the frame-up, later cleared. `wrongly_accused`: player accused Kevin himself. `""`: never resolved. | `m01_npc_kevin.ink:257,266,563,572,600`; `m01_phone_agent0x99.ink:652,674,696` | yes | nobody |
| `found_casualty_projections` | Player picked up Derek's signed casualty spreadsheet (42–85 deaths). | `scenario.json.erb:1982` (onPickup) | yes | m02 debrief (`q_entropy_link`) |
| `player_launched_attack` | Player pressed LAUNCH on Derek's device. Operation Shatter went out; credits read MISSION FAILED, "ESTIMATED CASUALTIES: 42-85". | `scenario.json.erb:1397` | yes | m02 debrief |
| `player_aborted_attack` | Player pressed ABORT. The normal win. | `scenario.json.erb:1393` | yes | nobody |
| `derek_surrendered` | Surrender ending (also in `final_choice`). | `m01_derek_confrontation.ink:456` | no (covered by `final_choice`) | – |
| `derek_fight_triggered` | Fight ending (covered by `final_choice`). | `m01_derek_confrontation.ink:312` | no | – |
| `maya_ko` | Player knocked out Maya Chen, SAFETYNET's own informant. HaX: "we lost Maya's intelligence. That gap shows up in the next mission." | `scenario.json.erb:1828` (globalVarOnKO) | **no** | – |
| `kevin_ko` | Player knocked out Kevin Park (innocent IT manager). | `scenario.json.erb:1542` | **no** | – |
| `sarah_ko` | Player knocked out receptionist Sarah O'Brien. | `scenario.json.erb:572` | **no** | – |
| `kevin_protected` | Kevin protected from the frame-up (true on warn/evidence). | as `kevin_choice` | no (derivable from `kevin_choice`) | – |
| `confrontation_approach` | `aggressive` / `evidence_based` opening with Derek. Minor. | `m01_derek_confrontation.ink:46-58` | no | – |
| `operation_shatter_reported` | Player told HaX about Shatter before the end. Minor. | `m01_phone_agent0x99.ink:345` | no | – |

Dead variables, worth knowing so no one imports them: `derek_showed_remorse` (declared, never set; Derek never shows remorse by design), `found_target_database` and `maya_identity_protected` (declared, read by the debrief and credits, never written in play, so Maya's identity is always "protected" and the target database is never "found"). CARRY_OVER_PLAN §2.9 still lists `derek_showed_remorse` as an export; the shipped list does not.

**Matters but not exported:** `maya_ko` (HaX promised the loss would show up later; it never has), `kevin_ko`, `sarah_ko`. Together they say whether the player hurt innocents on day one.

### 2. Characters' end states

| Character | Role / cell | Sprite key | End state by branch | Later appearances |
|---|---|---|---|---|
| Derek Lawson | Social Fabric operations lead for Operation Shatter, cover "Senior Marketing Manager" | `male_office_worker_v2` | In SAFETYNET custody on every branch. Fight: beaten, "I'm a martyr now… The Architect will remember" (`m01_derek_confrontation.ink:324`). Arrest: silent. Recruit: refused, in custody. Expose: in custody, his documents public. Surrender: in custody, motive unexplained ("he's playing a longer game. We'll know when his lawyers start talking", `m01_closing_debrief.ink:814`). | m02 briefing line only. Never again. |
| Kevin Park | Innocent IT manager, Derek's planned scapegoat | `male_nerd_v2` | Protected (warn/evidence), arrested then cleared (ignore), wrongly accused by the player (wrongly_accused), KO'd, or unknown. Credits lines `scenario.json.erb:133-137`. | Never. |
| Maya Chen | Content analyst, anonymous tipster who brought SAFETYNET in | `female_scientist_v2` | Identity protected (always, see dead variables) or KO'd by the player ("our asset", intel lost). | Never. |
| Sarah O'Brien (id `sarah_martinez`) | Receptionist, innocent | `female_office_worker_v2` | Fine, or KO'd. | Never. |
| Agent HaX (`agent_0x99`) | Handler | `agent_hax` | – | Every mission. |
| Patricia Wells (bible only) | Former manager fired for investigating Derek (`social_fabric.md:28`) | – | Off-screen. | Never. |

### 3. Open threads

- **Derek's surrender.** "Fanatics don't surrender… either the evidence genuinely broke something in him, or he's calculating" (`m01_closing_debrief.ink:798-814`). m02's surrender line repeats it: "He still hasn't told us why." Never answered.
- **"The Architect planned for this"** (`m01_derek_confrontation.ink:449`) and "other cells… other architects of the inevitable" (`confrontation_choice`, ~L268). The second is paid off by m02–m08; the first is a promise the finale can keep: the Architect expected Derek to fall.
- **Maya's lost intelligence**: "That gap shows up in the next mission" (`m01_closing_debrief.ink:362`). Not paid off in m02–m08, and `maya_ko` is not exported.
- **Kevin's frame-up**: settled inside m01's debrief. No later echo.
- **Who is the Architect?** "We don't know… Every cell we disrupt… brings us closer" (`m01_closing_debrief.ink:850-866`). The season's spine; m06–m08 build the Tesseract lead, m09 confirms.
- **Social Fabric status at mission end**: Derek's operation broken; the cell itself survives. It reappears in m04 (Calder Wharf safehouse, disinformation queued for Albion), m06 (paid from the Architect's Fund) and m07 (Operation Fracture with Ghost Protocol, "The Social Fabric package went out ninety minutes later" on one branch, `m07_closing_debrief.ink:382`). No Social Fabric leader has ever been named in play.
- **Expose branch side-effect**: "ENTROPY read them too, so they know what we know" (m02 briefing). Never followed up.

### 4. Kit and capabilities

- Lockpicks (found in m01 storage; `has_lockpick`), the phone with HaX, the drop-site terminal habit, CyberChef for decoding, a Kali VM.
- VM work in-game: the server-room SSH foothold, Linux navigation, privilege escalation, and the third flag that arms or disarms the launch device (`shatter_server:flag_3`).
- The ENTROPY launch device (`launch-device`, launch/abort) is handed over and does not carry forward as kit.
- Social engineering under an IT-contractor cover; first combat (Derek fight, optional KOs).

### 5. Canon facts

- Cover company Viral Dynamics Media; Derek there about eighteen months; the player went in as an IT contractor doing a requested audit (`m01_opening_briefing.ink:103-121`).
- Operation Shatter: coordinated emergency disinformation to 2,347,832 people, projected 42–85 deaths (`scenario.json.erb` launch device text; credits).
- Derek is a true believer; named the Architect as the influence; the casualty projections carry the Architect's approval (`m01_closing_debrief.ink:167,809`).
- m01 is the player's first mission with HaX ("First mission complete", `m01_closing_debrief.ink:894,900`). Netherton does not appear until m02.
- Player sprite in m01 is `female_hacker_hood_v2`, name "Agent Zero"; m02 onwards use `male_hacker_hood_down_v2` / `hacker` and "Agent 0x00". The finale should not lean on a gendered player.
- Social Fabric's leader is unnamed in play (bible `social_fabric.md:15`).

---

## m02 Ransomed Trust (Ransomware Incorporated, St. Catherine's Regional Medical Center)

### 1. Player decisions

| Global | Values and story meaning | Set at | Exported | Read by |
|---|---|---|---|---|
| `paid_ransom` | St. Catherine's paid Ghost; wards back inside the hour, two died, Ransomware Inc "funded for their next two or three operations" (`m02_closing_debrief.ink:419-423`). | `scenario.json.erb:1231` (on `backup_recovery_source = ransom_payment`) | yes | m03 briefing (`m03_opening_briefing.ink:92`) |
| `ghost_keys_used` | Player took Ghost's free keys in exchange for promising to publish. Wards back inside the hour, one died, and Ghost can still walk back into that network (`m02_closing_debrief.ink:333-341`). | `scenario.json.erb:1260` | yes | m03 briefing (`:94`) |
| `ward_recovering` | Any fast restore (ransom, Ghost's keys, combined). With neither of the above true, it means the combined restore: two died, Ghost paid nothing. | `scenario.json.erb:1231,1250,1260` | yes | m03 briefing (`:96`) |
| `bed4_manually_stabilised` | On the slow offline-keys restore, the player hand-bagged Mr Pryce (Bed 4) and saved him. Five died, not six. | `m02_npc_roaming_nurse.ink:49-51`; `m02_npc_patient_bed4.ink:126-131` | yes | m03 briefing |
| `patient_bed4_deceased` | Mr Pryce died on the slow path (the visible countdown ran out). | `scenario.json.erb:3500` (timer `bed4_death_window`) | yes | nobody |
| `exposed_hospital` | Player published the board's cover-up and Gary's warnings at the press terminal. Inquiry, forty hospitals audit; Kim resigns. False: kept internal, budget tripled, sector unchanged. | `m02_object_press_terminal.ink:202-203,246-247` | yes | nobody |
| `ghost_deal_accepted` | Player shook on Ghost's deal. With `exposed_hospital` it means the promise was kept; without, Ghost "considers the deal broken. They'll remember that" (`m02_closing_debrief.ink:495`) and "now Ghost has a grievance" (`:925-926`). | `m02_phone_ghost.ink:598-599` | yes | nobody |
| `insider_asset_arrested` | Graham Reeves taken: quiet arrest, public exposure, handover, or after turning hostile. | `m02_npc_asset.ink:296,311,325,340` | yes | nobody |
| `insider_asset_escaped` | Reeves walked out: the press-terminal ambush, or the debrief's `insider_escaped` knot. | `m02_npc_asset.ink:377`; `m02_closing_debrief.ink:716`; `scenario.json.erb:1457` | yes | nobody |
| `backup_recovery_source` | `ransom_payment` / `offline_keys_only` / `combined_recovery` / `ghost_keys`. | minigame write, `scenario.json.erb:1228-1260` | **no** (deliberately: the validator can't see it set; the booleans above cover it) | – |
| `gary_protected` | Player documented Gary Whitlock's ignored warnings. Protected: promoted, "They gave me my career back". Unprotected and quiet: fired, blacklisted, on a college help desk at £26,000; HaX: "That's the injustice that radicalises people" (`m02_closing_debrief.ink:597-610`). | `m02_npc_gary_whitlock.ink:357,621`; `m02_npc_sarah_kim.ink:287,315` | **no** | – |
| `kim_guilt_revealed` | Dr Kim admitted choosing the MRI over Gary's £85K security ask. Changes her epilogue (public accountability or a private vow). | `m02_npc_sarah_kim.ink:81-118` | **no** | – |
| `advised_board_pay` / `advised_board_refuse` | What the player told Kim to do; the debrief pays it back ("She trusted your read", `:888-901`). | `m02_npc_sarah_kim.ink:437-457` | **no** | – |
| `ghost_deal_refused` | Player refused Ghost outright. Ghost: "When your agency comes for us… I hope it's you leading it" (`m02_phone_ghost.ink:625`). | `m02_phone_ghost.ink:620-621` | **no** | – |
| `insider_asset_exposed` | Reeves named publicly alongside the board. | `m02_npc_asset.ink:312` | **no** | – |
| `night_security_supervisor_ko` | Player knocked Reeves out (with or without knowing who he was). | `scenario.json.erb:2945` (globalVarOnKO) | **no** | – |
| `insider_identified` | Player identified Reeves; on the "flagged" route SAFETYNET picked him up afterwards. | asset/evidence ink | **no** | – |
| `accused_wrong_suspect` / `val_accused` | Player accused Gary, Kim or Val Okonkwo instead of Reeves; Reeves walked out unquestioned. | `m02_npc_gary_whitlock.ink:813`; `m02_npc_security_guard.ink:655-656`; `m02_npc_sarah_kim.ink:517` | **no** | – |
| `cover_burned` | Gary saw through the player's cover; Reeves made the phone call that slowed them. | `m02_npc_gary_whitlock.ink:201-373`; `scenario.json.erb:933` | no | – |
| `patient_assaulted` | Player struck a patient. | `scenario.json.erb:1331` | **no** | – |
| Staff KOs: `guard_knocked_out` (Val Okonkwo), `gary_ko`, `dr_kim_ko`, `ward_nurse_ko` (Sister Doyle), `raval_ko`, `receptionist_ko` (Bernie Nwosu), patient KOs | Each gets its own HaX line in the debrief (`m02_closing_debrief.ink:815-866`). | globalVarOnKO in the erb | **no** | – |

**Reeves' fate is not recoverable from the exports.** The debrief routes on five globals (`m02_closing_debrief.ink:646-665`). With only `insider_asset_arrested` and `insider_asset_escaped` exported, three different stories read as "both false": he was knocked out and contained, he was flagged and picked up by SAFETYNET, or he was never caught at all ("Still on staff, still trusted, still inside", `:755`) or walked out after the player accused the wrong person (`:742-746`). A derived `reeves_fate` string set in the debrief (arrested / exposed / ko / flagged / escaped / missed / unnoticed) would fix it in one export.

**Matters but not exported:** `gary_protected` (the strongest unexported hook in m02), `ghost_deal_refused`, `kim_guilt_revealed`, `advised_board_*`, Reeves' detail (above), `accused_wrong_suspect`, `patient_assaulted`, `guard_knocked_out` (Val).

### 2. Characters' end states

| Character | Role / cell | Sprite key | End state by branch | Later appearances |
|---|---|---|---|---|
| Ghost | Ransomware Incorporated cell leader; never seen, terminal handle only | none (avatar `npc_hacker.png`) | At large on every branch ("Clean exit. No trace", `m02_closing_debrief.ink:621-625`). Ghost's keys: still inside St. Catherine's network. Deal kept: got the public lesson free. Deal broken: holds a grievance. Refused: hopes the player leads the raid. Ransom paid: funded. | m03 briefing names Ghost as Zero Day's buyer; m03 debrief "Ghost's still out there" (`m03_closing_debrief.ink:560`). Not seen since; Ransomware Inc is absent from the Architect's Fund (m06) and m07. **Unresolved.** |
| Graham Reeves | Ghost's inside asset, night security supervisor, badge SC-4471; planted the device via a fake fire drill | `graham_reeves` | Arrested (4 ways), KO'd and contained, flagged and picked up, escaped (ambush or debrief), or never caught and still on staff. | Never. Note the m07 Ghost Protocol leader is a different Reeves (Michael). |
| Gary Whitlock | IT admin, warned the board seven times, the board's scapegoat | `gary_whitlock` | Protected: Director of Cyber Security (Royal Northern or St. Catherine's). Unprotected + exposed: fired, then rehired after the story. Unprotected + quiet: blacklisted, help desk, bitter. KO'd: "He knows. He hasn't said. That's a debt." | Never. |
| Dr Sarah Kim | Hospital CTO, chose an MRI over security | `sarah_kim` | Exposed: resigned, select committee, consulting. Quiet: kept her job, private reprimand. KO'd: "never named you". | Never. |
| Val Okonkwo | Uniformed security officer who logged Reeves for eight weeks and was told to drop it | `female_security_guard_v2` | Ally whose log becomes "the spine of the case" if Reeves was identified; KO'd ("the closest thing you had to an ally"); or logged the player picking her lock. | Never. (m06 has an unrelated Dani Okonkwo.) |
| Bernie Nwosu | Receptionist, early pointer to Reeves | `bernie_nwosu` | Fine, or KO'd. | Never. |
| Sister Doyle, Nurse Raval | Ward nurses | `female_nurse1_v2`, `female_nurse2_v2` | Fine, or KO'd. | Never. |
| Mr Pryce (Bed 4) | Ventilated cardiac patient, 67 | `bed4` | Lives on every fast restore; on the slow restore lives only if the player hand-bagged him; otherwise dies. | Named in m03's briefing branch. |
| Mrs Hargreaves (Bed 2), Ms Chen (Bed 5) | Patients | `bed2`, `bed5` | Never fatal. | Never. |
| Director Magnus Netherton | SAFETYNET director; first appearance | `male_spy_v2` (m02/m03), `netherton` (m04) | – | m03–m08. |
| Agent 0x47 Nightshade | Hardware analyst; first appearance, takes the recovered PIN cracker | `nightshade` | – | m03, m04, m08 (the device "still signed out to Nightshade since St. Catherine's", `m08_opening_briefing.ink:21`). |

### 3. Open threads

- **Ghost at large**, with branch-dependent leverage: funded (paid), still inside the hospital network (keys), aggrieved (deal broken), or invited the confrontation (refused, `m02_phone_ghost.ink:625`). "We'll be watching" on the accepted path (`:611`). Not paid off in m03–m08.
- **Gary's radicalisation risk.** HaX spells it out on the worst branch (`m02_closing_debrief.ink:607-610`). Never followed up; a natural recruit for ENTROPY by the finale.
- **Reeves**, if he escaped or was never caught: "a lead we'll be chasing cold now" (`:746`), "Still on staff, still trusted, still inside" (`:755`).
- **ENTROPY's supply chain.** Nightshade on the PIN cracker: "Somebody manufactures these at scale… the people you're chasing have a supply chain" (`m02_closing_debrief.ink:147-150`). m08 turns the same device into evidence against Nightshade. The manufacturer is never found.
- **Zero Day Syndicate next** (`:785,952`): paid off in m03.
- **Crypto Anarchists handle payments** (`:429,768`): paid off in m06.
- **The ransom money.** "We watched it move for about six hours" (`:419-423`). m06's briefing has Ransomware Inc's wallet receiving "$2.4 million in one payment this summer, hospital ransoms pooled" (`m06_opening_briefing.ink:67`), which could tie back but doesn't name St. Catherine's.
- **Ransomware Incorporated status at mission end**: intact, leader at large, possibly funded. Absent from m06's fund list and from m07. The bible's endgame note says "Ghost (if escaped) continues operations for other ENTROPY cells" (`ransomware_incorporated.md:484`).
- **Ghost's "Not the money. The lesson"** ideology and "They're not wrong about the problem" (HaX, `:610`): the season's moral question, ready for the Architect to echo.

### 4. Kit and capabilities

- Starts with lockpicks and phone (cumulative from m01).
- Finds the ENTROPY PIN cracker (Mastermind-style keypad oracle) and hands it to Nightshade at the debrief. It is not in the player's kit from m03 on.
- VM work in-game: map the backup server and its public files, an SSH foothold, the ProFTPD backdoor, recovering Ghost's operational log.
- Social engineering for keys and keycards, guard line-of-sight stealth, the offline escrow safe.
- First moral choice with a visible clock (Bed 4).

### 5. Canon facts

- St. Catherine's Regional Medical Center went dark at 02:47; 47 patients on life support; twelve hours of generator power (`m02_opening_briefing.ink:42-46`). Bible: November 2024, "Operation Resilience", 2.5 BTC (`ransomware_incorporated.md:26`).
- Initial access was a Zero Day Syndicate ProFTPD exploit (invoice ZDS-2024-0847 in m03); 214 hospitals scanned, 147 vulnerable, St. Catherine's recommended.
- Death counts by route (m03 briefing follows them): ransom two, Ghost's keys one, combined two, offline with Pryce saved five, offline six.
- Ghost's terminal closes with "GHOST PROTOCOL: CLOSED" (`m02_phone_ghost.ink`). Ghost Protocol is a different cell (Michael Reeves, m07). The finale must keep Ghost (Ransomware Inc), Ghost Protocol, Satoshi's Ghost (Crypto Anarchists, m06) and the two Reeveses apart.
- Bible: Ghost succeeded Ransomware Inc's founder "Cipher King" (Marcus Chen). "Marcus" is also the name of Marcus Tesseract and of a possible 0day alias; "Cipher" is also an m04 operative.
- Netherton's first scene is m02 ("I would rather we had met under better circumstances", `m02_opening_briefing.ink:36`).

---

## m03 Ghost in the Machine (Zero Day Syndicate, WhiteHat Security Services, Cardiff)

### 1. Player decisions

| Global | Values and story meaning | Set at | Exported | Read by |
|---|---|---|---|---|
| `victoria_fate` | `recruited`: Victoria Sterling (Sable) turned, stays inside Zero Day run by counter-intelligence, first package in (the Architect's comms protocols, payment rails, contacts at other cells); "Whether she stays turned is anyone's guess" (`m03_closing_debrief.ink:163-172`). Needs the Phase 2 drive. `arrested`: in custody, Netherton takes the file to the CPS himself; her keys open the client database. `escaped`: let her walk; "in the wind", on every watch list. `ko`: put down on site, in a guarded bed, says nothing. | `m03_npc_victoria.ink:768,780,792`; `scenario.json.erb:1059` | yes | m04 briefing (`mission_stakes`, one HaX line per value) |
| `danny_fate` | `protected`: Danny Foster (the consultant who drew the 214-hospital survey) comes in as a witness. `exposed`: player logs his part in full; he cooperates. `left`: decision handed back to him; phone off, HaX has someone watching his house. `ko`: knocked out, protective custody. `""`: never found. | `m03_danny_choice.ink:109,119,129`; `scenario.json.erb:1125` | yes | m04 debrief (Task Force Null file line) |
| `danny_ko` | Danny knocked out (before or after his choice). | `scenario.json.erb:1876` (globalVarOnKO) | yes | m04 debrief |
| `directive_decoded` | Player decoded the Architect's Phase 2 directive themselves on HaX's call (the drive in Sterling's desk). | `m03_phone_agent0x99.ink:569-570` | yes | nobody |
| `guard_bribed` | Player paid Terry Mott £500 of SAFETYNET's money. "Finance will want a receipt." | `m03_npc_terry_mott.ink:407` | yes | nobody |
| `guard_told_safetynet` | Player told Terry who they worked for; he rang Sterling. | `m03_npc_terry_mott.ink:420` | **no** | – |
| `guard_knocked_out` | Player knocked out Terry Mott. | `scenario.json.erb:1635` | **no** | – |
| `receptionist_ko` | Player knocked out Ffion Rees ("Concussed, and still trying to work out what she did to deserve it"). | `scenario.json.erb:673` | **no** | – |
| `named_target_selection` | Player confronted Victoria with "target selection, ten thousand" on her invoice; she called it "consultancy" on an open line. Strengthens the arrest case. | `m03_npc_victoria.ink:704-705` | **no** | – |
| `defended_danny` | Player spoke up for Danny to Victoria. | `m03_npc_victoria.ink:716-717` | **no** | – |
| `called_it_murder` | In the briefing the player said Zero Day put a price on it being a hospital. | `m03_opening_briefing.ink:136` | no | – |
| `sterling_on_call_seen` | Player was seen in Victoria's doorway at night; unlocks her threat. | `m03_npc_victoria.ink:802` | **no** | – |
| `handler_trust` | 0–100 running score with HaX. Minor. | debrief | no | – |

**Matters but not exported:** `sterling_on_call_seen` (whether Victoria's personal threat was made), `named_target_selection`, `guard_told_safetynet`, the Terry and Ffion KOs.

### 2. Characters' end states

| Character | Role / cell | Sprite key | End state by branch | Later appearances |
|---|---|---|---|---|
| Victoria Sterling ("Sable") | WhiteHat CEO, founded it 2010; runs Zero Day's front for 0day and the Architect | `victoria_sterling` | Recruited double agent inside Zero Day / in custody / at large / KO'd in a guarded bed. Every branch ends on a line about the Architect: "To the Architect I'm a line item" (`m03_npc_victoria.ink:733`). | m04 briefing line only. **Never again**, even though Zero Day supplies m07's Operation Meltdown. |
| Danny Foster | WhiteHat consultant who drew the hospital survey and took a raise to stay quiet | `danny_foster` | Witness / cooperating defendant / missing (phone off) / protective custody / never found. If recruited Victoria: "his statement stays sealed or she's burned inside a week" (`m03_closing_debrief.ink:316`). | m04 debrief line only. |
| Terry Mott | WhiteHat night guard (Sterling never learnt his name) | `terry_mott` | Bribed / talked past / told who you are and rang Sterling / KO'd / avoided. | Never. |
| Ffion Rees | WhiteHat receptionist; her badge is cloned | `ffion_rees` | Fine (badge cloned) or KO'd. | Never. |
| Netherton, Nightshade, HaX | SAFETYNET | `male_spy_v2`, `nightshade`, `agent_hax` | – | Continue. |
| 0day | Zero Day cell leader (bible) | – | Not met. Named in the briefing as Sterling's boss (`m03_opening_briefing.ink:150`). | Never met. |
| Ghost | Zero Day's buyer | – | Still at large (`m03_closing_debrief.ink:560`). | – |

### 3. Open threads

- **Victoria's personal threat**: "My associates offered to deal with you. I said I'd do it myself. I still might." (`m03_npc_victoria.ink:737`, only if `sterling_on_call_seen`). Live on the escaped branch; ironic on the recruited one. Never paid off.
- **"St. Catherine's was a proof of concept. You'll see the rest."** (escaped branch, `:790`). m04 and m07 deliver "the rest" without naming her.
- **A turned Zero Day insider.** On the recruited branch SAFETYNET has a source inside Zero Day from m03 onward, yet nothing in m04–m08 uses her, including m07's Zero Day–supplied Operation Meltdown. The finale can cash this in or burn it.
- **"I'm a desk. They'll have it filled by Monday."** (arrested, `:778`). Zero Day survives every branch.
- **Danny** on the left branch: "If Zero Day's people find him first, he's a loose end" (`m03_closing_debrief.ink:354`); on the recruited branch, Danny believes Sterling is going down and she isn't ("not yet", `:324`).
- **The Phase 2 directive** (grid storage, substations, hospitals on generator; "Zero Day supplies, Critical Mass executes. Winter, within weeks", `:250`): paid off in m04.
- **"When do we go at the Architect directly?"** (`:571`): the finale.
- **Zero Day status at mission end**: front exposed or (recruited) read in secret; 0day untouched; the cell sells again in m06's fund ($0.7M advance) and supplies m07's Meltdown.

### 4. Kit and capabilities

- Starts with lockpicks, phone and an **RFID cloner** (first appearance; clone badges in conversation or at range).
- Stealth around a patrolling guard with a torch; a night phase after a day phase.
- VM work in-game: map the training network, pull the FTP intelligence, decode the pricing intel, the legacy distcc service. The drop-site prints Zero Day's transaction log.
- Decoding layered encodings (Base64 over ROT13) on the directive drive.

### 5. Canon facts

- WhiteHat Security Services, Callaghan Square, Cardiff (`m03_opening_briefing.ink:293`); Operation Cyber Arsenal (`:37`). "You worked St. Catherine's last month" (`:87`).
- Victoria Sterling founded WhiteHat in 2010; sign-off name Sable; answers to 0day and the Architect (`:174-177`). She has never met the Architect ("all encrypted channels").
- Invoice ZDS-2024-0847: the ProFTPD backdoor sold to Ghost for twenty-five thousand (no currency stated), target selection ten thousand, St. Catherine's on the target line.
- The Architect's directive on Sterling's drive is SAFETYNET's first signed plan from him: "Until last night the Architect was a rumour. Now it's a signature on a plan" (`m03_closing_debrief.ink:270`).
- The bible's Zero Day file has no Victoria Sterling or Danny Foster entry yet.

---

## m04 Critical Failure (Critical Mass, Albion Energy Storage)

### 1. Player decisions

| Global | Values and story meaning | Set at | Exported | Read by |
|---|---|---|---|---|
| `voltage_captured` | Voltage taken alive: a peaceful arrest at the bench (`m04_npc_voltage.ink:405`), a surrender after Static is down (`:475`), or knocked out in a fight (`scenario.json.erb:1290`, `npc_ko:voltage`). "He'll talk. He wants someone to check his sums." | as listed | yes | m05 briefing (`m05_insider_trading_opening.ink:45`) |
| `voltage_escaped` | Player chose the shutdown button over Voltage; he went out through the dock ("I'll be long gone before anyone counts them", `m04_npc_voltage.ink:434-436`). | `m04_npc_voltage.ink:439` | yes | m05 briefing (`:47`) |
| `casualties_occurred` | Rack bank B vented (the trigger race or the alarm clock ran out). | `scenario.json.erb:2790,2868,2886` | yes | nobody |
| `crew_lost` | Bank B vented with the night crew still in Hall 2: nine dead. Vance: "Nine of mine. I'll be telling their families myself." | `scenario.json.erb:1035` | yes | nobody |
| `disclosure_choice` | `full`: public disclosure, Albion takes the hit, every storage site audited, "someone in Parliament finally answers for the funding" (`m04_closing_debrief.ink:489`). `quiet`: classified, quiet patching, "nothing makes the rest of the sector move". `partial`: incident admitted, details held back. Chosen in front of Vance. | `m04_closing_debrief.ink:468,498,538` | yes | nobody |
| `crew_warned` | Player had Vance sound the evacuation; Hall 2 empty when the bank went. | `m04_npc_robert_vance.ink:480`; `m04_phone_robert_vance.ink:247` | no (implied by `casualties_occurred` without `crew_lost`) | – |
| `vance_is_ally` / `vance_trust_level` | Player told Vance the truth and won him over (trust ≥70 changes his debrief lines). | `m04_npc_robert_vance.ink:604` | **no** | – |
| `robert_vance_ko` | Player knocked out Robert Vance. | `scenario.json.erb:1598` | **no** | – |
| `promised_voltage_alive` | Player promised HaX (briefing or phone) to bring Voltage in breathing. | `m04_opening_briefing.ink:178`; `m04_phone_agent0x99.ink:792` | **no** | – |
| `voltage_print_on_bypass` | Player lifted Voltage's print off the bypass module: court-proof if he's caught later ("When someone does find him, it'll be waiting"). | Voltage/kit mapping | **no** | – |
| `cipher_walked` | Player talked Cipher out of the hall; police picked him up on the access road, "He's talking". | `m04_npc_operative_cipher.ink:135` | **no** | – |
| `static_left` / `static_left_alone` | Static went with Voltage on the button route, or slipped out after Voltage was punched down. Static at large. | `scenario.json.erb:2548,2557` | **no** | – |
| `operative_cipher_defeated` / `_relay_defeated` / `_static_defeated` | Which operatives the player put down. | globalVarOnKO, `scenario.json.erb:2038,2292,2516` | **no** | – |
| `lore_safehouse_address_found` | Player decoded the go-bag card: Calder Wharf, Social Fabric's regional safehouse. | `scenario.json.erb:2728` | **no** | – |
| `lore_cross_cell_coordination_found` / `lore_architect_directive_found` | Paper proof of Critical Mass and Social Fabric on one job. | `scenario.json.erb:2654` | no | – |
| `voltage_six_cities` | Voltage told the player "The Architect has six cities lined up" (`m04_npc_voltage.ink:194-198`). | `m04_npc_voltage.ink:194` | no | – |
| `asked_the_number` | Player asked Voltage how many the hall takes ("forty-odd"). | Voltage ink | no | – |

`voltage_captured` does not say how: arrest, surrender and a KO all set it. If the finale wants Voltage to remember being beaten or being spared, it needs `voltage_fight_started` or a derived fate exported.

**Matters but not exported:** `vance_is_ally`/`vance_trust_level`, `robert_vance_ko`, `promised_voltage_alive`, `voltage_print_on_bypass`, `static_left`, `cipher_walked`, `lore_safehouse_address_found`.

### 2. Characters' end states

| Character | Role / cell | Sprite key | End state by branch | Later appearances |
|---|---|---|---|---|
| Voltage | Critical Mass site lead at Albion, ex-grid engineer; countersigned the casualty model | `voltage` | In custody (arrest, surrender, or KO) and talking only about his casualty figure; or escaped through the dock. | m05 briefing line only. In custody he "knows the chain above Blackout" (`m04_closing_debrief.ink:169`); that interrogation is never shown. |
| Dr James Mercer ("Blackout") | Critical Mass cell leader, signs the casualty models | (m07 sprite) | Not present in m04. | m07 (`mercer_fate`: arrested / escaped / ko). |
| Robert Vance | Albion operations manager and OT engineer, mid-fifties, Teesside voice | `robert_vance` | Ally (trust high), wary ally, never met, or KO'd. Grieving nine crew, or credited with saving the hall. Present on the line for the disclosure call. | Never. |
| Cipher | Critical Mass operative, Battery Hall 1 | `operative_cipher` | KO'd, or walked and picked up by police ("He's talking"). | Never. |
| Relay | Critical Mass operative, inverter room | `operative_relay` | KO'd, or bypassed (card cloned while she talked). | Never. |
| Static | Critical Mass operative, guards Voltage | `operative_static` | KO'd, stood aside, or left with Voltage / alone. At large on the last two. | Never. |
| Security guard (unnamed) | Albion gate guard | `security_guard` | Admitted the player, turned hostile, or KO'd. | Never. |
| Night crew (nine) | Albion staff in Hall 2 | – | Evacuated by Vance's alarm, or dead in the Bank B vent. | Never. |

### 3. Open threads

- **Task Force Null.** Netherton's standing team on the Architect; "Your name's on his list" (`m04_closing_debrief.ink:346-348`). The authoring comment says "Task Force Null, Voltage's interrogation and Calder Wharf are open threads; no later mission picks them up yet" (`:343-345`). m05 picks up Task Force Null ("three people and a whiteboard"; the m05 debrief pins the Insider Threat authorisation to its wall). **Voltage's interrogation and Calder Wharf are still unpaid.**
- **Calder Wharf**, Social Fabric's regional safehouse (`:237-238`): "That goes on the board." Never raided.
- **Voltage at large** (escaped branch): "Voltage is out there. So is The Architect." (`:697`). With his print on the bypass, "it'll be waiting".
- **"Six cities"** and OptiGrid's forty contracts (`:327-332`): partly paid off by m07's grid strike outside Portland, Oregon (Critical Mass's "Pacific Northwest grid control" line in m06's fund; OptiGrid appears in Ray Hollis's ink).
- **"This site was a rehearsal"** (`:317`): paid off in m07.
- **"Above him it stops being a person you can arrest"** (Voltage on what sits above Blackout, `m04_npc_voltage.ink:270`). A line the Architect confrontation can answer.
- **Disclosure fallout**: Vance's "I'll answer the rest at the inquest" (partial) and Parliament answering for the funding (full). Never followed up.
- **Critical Mass status at mission end**: Albion site stopped; Voltage taken or loose; Blackout untouched until m07; OptiGrid contracts under audit.

### 4. Kit and capabilities

- Starts with lockpicks, phone, RFID cloner, a regulator's ID badge cover and a workstation item.
- Finds the **fingerprint kit** (first appearance; lifting prints, Vance's and Voltage's). From m05 the start kit is fingerprint kit, lockpicks, phone and RFID cloner, unchanged to m08.
- First multi-opponent combat (three operatives plus Voltage, with HaX's clearance to use force) and a timed physical hazard (the hydrogen alarm and thermal runaway clocks).
- VM work in-game: the fake rack status page, the FTP intelligence file, a foothold on the BMS jump server, root on the jump server.
- Industrial control systems as a setting (SCADA, safety interlocks, emergency shutdown).

### 5. Canon facts

- Albion Energy Storage: 200 MWh of grid batteries, 240,000 people on that supply (`m04_opening_briefing.ink:64-70`). Eight in the morning launch window (`:151`). Critical Mass inside as maintenance contractors under the name OptiGrid Solutions (`:66`).
- Blackout is Dr James Mercer; Voltage runs Albion for him (`:134-136`). Three operatives: Cipher, Relay, Static (`:155`).
- Eleven on site: the nine night crew, Vance and the gate guard (`m04_closing_debrief.ink:425`, comment). Hospital at risk: the dialysis unit at Saint Aldate's (`m04_npc_voltage.ink:241`).
- SAFETYNET "detains and hands over"; new lines avoid saying SAFETYNET arrests (CARRY_OVER_PLAN, m03 → m04 canon note).
- Task Force Null is born in m04's debrief; the player is on it.
- Netherton's sprite key changes from `male_spy_v2` (m02/m03) to `netherton` (m04).

---

## Across m01–m04

### Exports with no reader yet

Already exported, so m09/m10 can import them with no change to the source mission:

- m01: `kevin_choice`, `player_aborted_attack` (and `final_choice`, `found_casualty_projections`, `player_launched_attack`, already read by m02).
- m02: `patient_bed4_deceased`, `exposed_hospital`, `ghost_deal_accepted`, `insider_asset_arrested`, `insider_asset_escaped`.
- m03: `directive_decoded`, `guard_bribed`.
- m04: `casualties_occurred`, `crew_lost`, `disclosure_choice`.

### Decisions that matter but are not exported

Ranked by how much the finale could do with them. Each needs one name added to the source mission's `exportGlobals` (and, where marked, a derived global set in that mission's debrief).

1. m02 `gary_protected`: Gary Whitlock saved or ground down. The only early character the game itself flags as a radicalisation risk.
2. m02 Reeves' full fate: needs a derived `reeves_fate` (see m02 §1). Today "never caught, still inside" and "KO'd and contained" look the same.
3. m02 `ghost_deal_refused`: Ghost's "I hope it's you leading it".
4. m03 `sterling_on_call_seen`: whether Victoria's personal threat was made.
5. m01 `maya_ko`, `kevin_ko`, `sarah_ko`: hurt innocents on the first mission; HaX promised Maya's loss would show.
6. m04 `vance_is_ally` (or `vance_trust_level`) and `robert_vance_ko`.
7. m04 `voltage_print_on_bypass`, `promised_voltage_alive`, and how Voltage was taken (`voltage_fight_started`).
8. m04 `lore_safehouse_address_found` (Calder Wharf known).
9. m04 `static_left` (Static at large with Voltage), `cipher_walked`.
10. m02 `kim_guilt_revealed`, `advised_board_pay`/`advised_board_refuse`, `accused_wrong_suspect`, `patient_assaulted`, `guard_knocked_out` (Val); m03 `named_target_selection`, `guard_told_safetynet`, Terry and Ffion KOs.

Never set in play, do not import: m01 `derek_showed_remorse`, `found_target_database`, `maya_identity_protected`.

### Naming hazards for the finale

- Three "Ghosts": Ghost (Ransomware Inc, m02), the Ghost Protocol cell (m07), Satoshi's Ghost (Crypto Anarchists, m06). m02's terminal prints "GHOST PROTOCOL: CLOSED" for Ghost, which collides with the cell.
- Two Reeveses: Graham (m02 asset) and Michael (Ghost Protocol leader, m07). Unrelated as written. A finale could tie them deliberately or keep them apart; it must not do it by accident.
- Chens: Maya Chen (m01), Ms Chen (m02 Bed 5), Dr Chen (SAFETYNET, no lines yet), Marcus Chen (bible alias for Cipher King and possibly 0day).
- Cipher: m04 operative, and "Cipher King" in the bible.
- Okonkwo: Val (m02) and Dani (m06), unrelated.
- Timeline: the bible dates St. Catherine's to November 2024 and m03 is "last month" after it, with Phase 2 "winter, within weeks"; m06's fund has advances paid on 4 August. Check the season calendar before the finale names a date.

---

## Finale payoff ideas

Ideas only; the stage-0 author decides. Weight is how much the player would feel it. "Needs export" means a source mission's `exportGlobals` has to grow first.

**Derek Lawson (m01 `final_choice`, `player_launched_attack`)**, high.
- m09's archive holds the Architect's file on Derek, written before Viral Dynamics: he expected Derek to fall and costed it. On the surrender branch this finally answers "He still hasn't told us why": the Architect ordered him to surrender if caught. On expose, the file notes the press coverage did ENTROPY's recruiting for it.
- m10: Tesseract quotes the player's own m01 ending back at them. "You knocked down a marketing manager and called it a war." / "You let Shatter go. I sent flowers to nobody." One line per `final_choice`, voiced as fixed strings.

**Maya, Kevin and Sarah (m01 KOs)**, medium. Needs export.
- In Tesseract's dossier on Agent 0x00 the Architect lists the innocents the player hurt, as proof SAFETYNET is no better. A clean player hears "Not one bystander. I confess that surprised me." HaX's m01 promise that Maya's loss "shows up" finally does: a gap in the archive where her missing names would have been.

**Ghost and Ransomware Incorporated (m02 `ghost_deal_accepted`, `exposed_hospital`, `ghost_keys_used`, `paid_ransom`; `ghost_deal_refused` needs export)**, high.
- Ghost is the one m01–m04 antagonist still loose, and absent from m06's fund. In m10 Ghost turns up at Tomb Gamma, or on its network as a terminal voice, and the m02 deal decides which way it leans:
  - deal kept: Ghost feeds the player a door code ("You kept your word. I keep mine.");
  - deal broken: Ghost locks one ("You'll remember I said I'd remember.");
  - refused: Ghost was waiting for the player to lead the raid, as promised, and offers a parley;
  - keys used: Ghost has been inside SAFETYNET-adjacent networks since St. Catherine's, a route or a threat;
  - ransom paid: the money resurfaces in Tomb Gamma's ledger.
- Weight high because it pays off four exported m02 values at once with no source change.

**Gary Whitlock (m02 `gary_protected`, needs export)**, high.
- Unprotected and quiet: Gary is the ENTROPY recruit the player meets in m09/m10, a technician who did everything right and was ground down, now working for the Architect. HaX's m02 line ("That's the injustice that radicalises people") comes back. Protected: Gary, now a Director of Cyber Security, is the outside expert who gets the player a way in, and says the line he asked HaX to pass on.

**Graham Reeves (m02, needs a derived `reeves_fate`)**, medium.
- Escaped or never caught: he is on Tomb Gamma's security rota, courteous as ever ("You should have looked harder" again). Arrested or exposed: his handler contacts are what m09 uses to find the archive. The two Reeveses could be revealed as brothers or as a shared alias, if the author wants it; otherwise keep them apart.

**Victoria Sterling (m03 `victoria_fate`; `sterling_on_call_seen` needs export)**, high.
- Recruited: she is the player's inside source for m10, and the finale decides whether she stays turned. Paying off HaX's "Whether she stays turned is anyone's guess" with a betrayal at the worst moment, or a save, lands either way.
- Escaped: she is selling to the Architect at Tomb Gamma, and makes good on "I said I'd do it myself. I still might."
- Arrested: the CPS case is the legal hook that lets Netherton authorise the raid. KO'd: she wakes up in time to give one name.

**Danny Foster (m03 `danny_fate`, `danny_ko`)**, low to medium.
- Protected or exposed: his testimony is the evidence that confirms Tesseract at m09. Left: Zero Day found him first; m09 finds his notes in the archive. Short beats, cheap to build.

**Terry Mott (m03 `guard_bribed`)**, low.
- A Finance query about the £500 lands on HaX's desk mid-m10. One line of relief in a tense run.

**Voltage and Critical Mass (m04 `voltage_captured`, `voltage_escaped`; `voltage_print_on_bypass`, `static_left` need export)**, high.
- Captured: Voltage's interrogation, never shown, is where Tomb Gamma's power layout comes from ("He wanted someone to check his sums. We did."). His line "Above him it stops being a person you can arrest" is the question the player answers in front of Tesseract.
- Escaped: Voltage runs Tomb Gamma's power plant, and if his print was lifted the player can prove it on the spot. Static with him if `static_left`.

**Albion's dead and the disclosure (m04 `crew_lost`, `casualties_occurred`, `disclosure_choice`)**, medium to high.
- Tesseract has read the Albion inquiry. Full disclosure: "You told them the truth, and they audited every site. That was my lesson, delivered by you." Quiet: "You buried it. You understand me better than you admit." The nine crew are named in his ledger on `crew_lost`. This is the season's argument about who the public deserves to hear from.

**Robert Vance (m04, needs `vance_is_ally`, `robert_vance_ko`)**, medium.
- Ally: Vance is the engineer who talks the player through Tomb Gamma's battery or grid plant over the phone, a returning helper with his own voice. KO'd: he refuses.

**Calder Wharf (m04 `lore_safehouse_address_found`, needs export)**, medium.
- m09 opens on the raid nobody ever ran. Found: the player is first through the door and finds a route to the archive. Not found: someone else found it first and cleaned it out.

**Task Force Null (m04, m05)**, medium.
- The finale is Task Force Null's operation. Its whiteboard in m09's briefing can carry a card per early choice (Derek, Ghost, Sterling, Voltage) in the player's own outcomes, a visual roll-call that costs no dialogue.

**The supply chain (m02 Nightshade's PIN cracker; m08 Nightshade fate)**, medium.
- Tomb Gamma is where the PIN crackers are made. Depending on m08, Nightshade either names the workshop or is the reason it's empty.
