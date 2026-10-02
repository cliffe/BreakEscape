# Mission 5 "Insider Trading" - Planning Summary & Implementation Guide

## Mission Overview

**Mission ID:** M05
**Title:** Insider Trading
**Duration:** 70-90 minutes
**Difficulty:** Tier 2 (Intermediate)
**Type:** Investigation / Social Engineering / VM Exploitation

**ENTROPY Cell:** Insider Threat Initiative
**SecGen Scenario:** "Feeling Blu" (Bludit CMS exploitation)
**VM Flags:** 4 flags (reconnaissance, exploitation, data discovery, Architect communications)

---

## Executive Summary

Mission 5 "Insider Trading" is a corporate espionage investigation where players infiltrate **Quantum Dynamics Corporation** to identify and stop an insider exfiltrating classified quantum cryptography research. The insider, **David Torres**, was systematically targeted by ENTROPY's Insider Threat Initiative due to crushing medical debt ($180K) from his wife Elena's terminal cancer, then radicalized over 3 months with extremist "accelerationist" ideology.

**Key Design Innovation:** Torres is a **radicalized ENTROPY recruit** who knows his actions will cause 12-40 deaths but has rationalized it through extremist ideology ("corrupt system must collapse"). However, he's only 3 months into radicalization and shows cognitive dissonance - can be de-radicalized, arrested, or subdued depending on player approach.

**Core Gameplay Loop:**
1. **Investigation** - Review security logs, identify suspicious patterns
2. **Social Engineering** - Clone badges, interview employees, build trust
3. **Evidence Gathering** - Search Torres' office, discover medical bills/journal/communications
4. **VM Exploitation** - Hack Bludit CMS server for 4 flags proving ENTROPY involvement
5. **Evidence Correlation** - Synthesize physical + digital evidence at Evidence Board
6. **Confrontation** - Present evidence to Torres, reveal manipulation, make critical choice

**Five Endings:**
1. **Turn Double Agent** (S-Rank) - De-radicalize Torres, becomes SAFETYNET asset, helps expose 47 other targets
2. **Arrest** - By-the-book justice, Torres faces espionage charges
3. **Combat - Non-Lethal** - Subdue resisting Torres without killing
4. **Combat - Lethal** - Neutralize threat when Torres resists
5. **Public Exposure** - Leak to media, destroy ENTROPY's program + Torres' life

---

## Planning Documentation Index

### Stage 0: Initialization (888 lines)
**File:** `stages/stage_0_initialization.md`

**Key Content:**
- **Specific ENTROPY Threat:** 4.2 TB Project Heisenberg exfiltration (73% complete)
- **Body Count:** 12-40 intelligence officers will die if data reaches foreign governments
- **Financial Stakes:** $68M ENTROPY revenue, $4.2B DoD program wasted, $180K Torres' medical debt
- **The Insider Profile:** David Torres - PhD cryptographer, wife Stage 3 cancer, 2 children (Sofia 11, Miguel 8)
- **ENTROPY 4-Phase Plan:** Exfiltration (73%) → Analysis (2 weeks) → Distribution ($45-70M sales) → Deployment (casualties within 60-90 days)
- **The Recruiter's Radicalization:** Recruited Torres through financial desperation, then indoctrinated with ENTROPY extremist ideology

**Critical Numbers:**
- 847 pages classified quantum protocols
- 14 zero-day vulnerabilities in competitor systems
- 247 DoD facilities deployment database
- 22 active ENTROPY insider placements
- 47 total targets under evaluation

### Stage 1: Narrative Structure (1,378 lines)
**File:** `stages/stage_1/story_arc.md`

**Key Content:**
- **3-Act Structure:**
  - Act 1 (20-25 min): Corporate infiltration, narrow 8 suspects to 3
  - Act 2 (35-45 min): VM exploitation + evidence gathering, identify Torres
  - Act 3 (15-20 min): Confrontation, reveal truth, 4 branching choices
- **60+ Global Variables:** Tracks actual player actions, not vague "approaches"
- **Opening Briefing:** Agent 0x99 establishes stakes (12-40 casualties, specific data at risk)
- **Closing Debrief:** Reflects on choice, consequences for campaign, Torres' fate

**Key Story Beats:**
1. Arrival at Quantum Dynamics (Patricia Morgan briefing)
2. Security log analysis (identify pattern)
3. Badge cloning (social engineering)
4. Torres office discovery (medical bills, journal, briefcase)
5. Server room access (VM challenges)
6. Evidence correlation (synthesize findings)
7. Confrontation (reveal ENTROPY manipulation)
8. Critical choice (4 paths)
9. Stop upload (prevent final exfiltration)
10. Debrief (consequences)

### Stage 2: Atmosphere & Environment (535 lines)
**File:** `stages/stage_2/atmosphere_environment.md`

**Key Content:**
- **Tone:** Corporate noir thriller with moral complexity
- **Setting:** Modern Bay Area tech campus, late afternoon (4:30 PM)
- **Torres Characterization:** CRITICAL - He's a radicalized ENTROPY recruit
  - Recruited through financial desperation (Elena's cancer)
  - Radicalized with extremist ideology over 3 months
  - Knows data goes to foreign governments, knows about casualties
  - Has rationalized it but shows cognitive dissonance
  - Can be de-radicalized (turn), arrested, or subdued (lethal/non-lethal)

**5 Emotional Moments:**
1. Medical bills discovery - $380K crushing debt (the vulnerability ENTROPY exploited)
2. Journal reading - Rationalization visible ("system must fall... but Elena...")
3. Children's drawings - "Get well soon Mommy" (innocence contrasts radicalization)
4. Confrontation - Torres' cognitive dissonance breaks ("What did I become?")
5. The choice - De-radicalize, arrest, or combat

**Environmental Storytelling:**
- Torres' office: Family photos + medical bills = complete tragedy
- Break room: Empty coffee mug (Torres too stressed to drink)
- Server room: Technical precision contrasts human desperation
- Research lab: Cutting-edge tech shows value of stolen data

### Stage 4: Player Objectives (692 lines)
**File:** `stages/stage_4/objectives_tasks.md`

**Key Content:**
- **3 Objectives, 8 Aims, 32 Tasks** (24 required, 8 optional)

**Objective 1: Investigate the Threat**
- Aim 1.1: Gain Access (3 tasks)
- Aim 1.2: Initial Investigation (4 tasks)

**Objective 2: Gather Intelligence**
- Aim 2.1: Exploit Bludit Server (5 tasks - VM flags)
- Aim 2.2: Collect Physical Evidence (5 tasks)
- Aim 2.3: Interview Team Members (5 tasks - all optional)

**Objective 3: Stop Operation Schrödinger**
- Aim 3.1: Confront Insider (4 tasks - includes branching choice)
- Aim 3.2: Prevent Final Exfiltration (4 tasks)
- Aim 3.3: Report Mission Outcome (2 tasks)

**Success Ranks:**
- **S-Rank:** All required + 6/8 optional, all flags, Torres turned, zero-days patched
- **A-Rank:** All required + 4/8 optional, all flags
- **B-Rank:** All required + 2/8 optional, 3+ flags
- **C-Rank:** All required tasks, minimum 2 flags

**Evidence Level System:**
- Tracks investigation progress (0-7+)
- evidence_level >= 4 required to unlock confrontation
- Sources: Medical bills (+1), Journal (+1), Each VM flag (+1), Briefcase (+1), Interviews (+0-2)

### Stage 5: Room Layout Design (1,562 lines)
**File:** `stages/stage_5/room_layout.md`

**Key Content:**
- **11 Rooms:** Hub-and-spoke design with central corridor
- **Progressive Unlocking:** 5 unlock stages based on investigation progress
- **Lock Variety:** 5 types (PIN, Physical Key, RFID, Password, Biometric)
- **All 32 tasks mapped to specific room locations**

**Room List:**
1. Reception Lobby (10×8 GU) - Entry, meet Patricia
2. Main Corridor (15×6 GU) - Hub connecting all areas
3. Break Room (8×8 GU) - Optional social, LORE Fragment 1
4. Conference Room (10×8 GU) - Evidence Board, CyberChef workstation
5. Open Office Area (12×10 GU) - Security logs, employee files, interviews
6. Server Hallway (8×4 GU) - Badge-locked checkpoint
7. Server Room (10×10 GU) - VM terminal, drop-site, LORE Fragment 2
8. Torres' Office (8×8 GU) - Medical bills, journal, briefcase, server password
9. Research Lab (12×10 GU) - Dr. Chen, Project Heisenberg specs, LORE Fragment 3
10. Patricia's Office (8×7 GU) - Phone accessible, security monitors
11. Archive Storage (6×8 GU) - Torres' background, LORE Fragment 4

**Critical Path Lock Sequence:**
1. Filing Cabinet PIN (0415) → Employee directory → Identify Torres
2. Clone Employee Badge → Server hallway access
3. Find Torres Office Key → Access office
4. Torres Desk Key → Server password "Heisenberg2024"
5. Server Room Password → VM access
6. Torres Briefcase PIN (0811) → ENTROPY communications

**4 Required Backtracking Moments:**
1. Evidence Board - Correlate physical + digital evidence
2. Server Room - Return with password to access VM
3. Torres Office - Return after identifying suspect
4. Badge Cloning - Return to NPCs to get employee badge

### Stage 6: LORE Fragments (577 lines)
**File:** `stages/stage_6/lore_fragments.md`

**Key Content:**
- **4 LORE Fragments** (3 evidence, 1 technical context)

**Fragment 1: Recruiting Pamphlet** (Easy - Break Room)
- Shows systematic insider recruitment methodology
- 22 active placements, $180-240M annual revenue
- "Investigative journalists" cover story revealed
- Torres fits exact profile (medical debt, access, family crisis)

**Fragment 2: Architect's Protocol** (Medium - Server Room Cabinet)
- **CRITICAL EVIDENCE** - The Architect personally authorized operation
- Specific casualty projections: 12-40 intelligence officers
- Foreign sales: $28M China, $22M Russia, $18M Iran
- "Asset is expendable" - proves ENTROPY's cold calculation
- Timeline: 14 days to exfiltration complete, 60-90 days to first casualties

**Fragment 3: Heisenberg Specs** (Hard - Research Lab)
- Technical context about stolen quantum crypto research
- 847 pages QKD protocols, 14 zero-days, 247 facilities
- Shows why ENTROPY targeted this specifically
- Optional but enriches understanding

**Fragment 4: Target Selection Criteria** (Hard - Archive)
- **CRITICAL EVIDENCE** - Database of 47 profiled targets
- Torres listed as "QD-001" with exact vulnerability scores
- Shows other victims: Marcus (gambling), Rachel (son's treatment)
- Vulnerability scoring: Financial (35%), Access (40%), Psychological (25%)
- "Torres template effective" - implies they'll recruit more like him

**Debrief Integration:**
- Each fragment acknowledged by Agent 0x99
- Complete collection unlocks `lore_completionist` bonus
- Evidence supports "turn double agent" path (Torres sees manipulation)

---

## Character Profiles

### David Torres (Primary Antagonist - Radicalized ENTROPY Recruit)
**Role:** Cryptography Lead, Quantum Dynamics Corporation
**Age:** 38
**Family:** Wife Elena (Stage 3 cancer), Daughter Sofia (11), Son Miguel (8)
**Debt:** $180K medical bills
**Radicalization Status:** 3 months into ENTROPY indoctrination

**Characterization:**
- PhD in cryptography, top of his field
- Clean security record (TS/SCI clearance for 8 years) - made him valuable target
- Recruited through financial desperation, radicalized with extremist ideology
- Knows data goes to foreign governments (Russian GRU, Chinese MSS)
- Aware of casualty projections (12-40 intelligence officers will die)
- Has rationalized it: "Corrupt military-industrial complex must collapse, collateral is necessary"
- NOT fully radicalized yet - cognitive dissonance visible, can be de-radicalized

**Critical Design:** Torres is an **ENTROPY recruit undergoing radicalization**, NOT a sympathetic victim. He KNOWS his actions will kill people and has rationalized it through extremist ideology. However, he's only 3 months in - not fully committed, showing cognitive dissonance. Player must decide: de-radicalize (turn), arrest, combat (lethal/non-lethal), or expose.

**Voice:**
- Defensive initially ("The system is corrupt")
- Desperate rationalization ("Elena... what choice did I have?")
- Cognitive dissonance when confronted ("I knew. But... twelve to forty people. Real people.")
- Can break from radicalization ("What did I become?") or resist (combat)

### Patricia Morgan (Mission Handler - In-Person + Phone)
**Role:** Chief Security Officer, Quantum Dynamics
**Age:** 52
**Background:** Former USMC (1976-1996), corporate security veteran

**Characterization:**
- Professional, no-nonsense
- Frustrated by breach but composed
- Works with player as peer, not subordinate
- Provides authorization when stuck
- Military bearing, patriotic (safe PIN: 1776)

**Voice:**
- Direct, clear communication
- Tactical language ("status", "sitrep", "containment")
- Trusts player's expertise
- Concerned about DoD contracts, company reputation

### Dr. Sarah Chen (Optional NPC - Research Lab)
**Role:** Chief Scientist, Project Heisenberg Lead
**Age:** 45
**Expertise:** Quantum cryptography

**Characterization:**
- Brilliant, protective of research
- Understands what's at stake technically
- Shocked Torres is suspect (worked together 3 years)
- Can provide technical context and research badge access

**Voice:**
- Technical precision
- Educational (explains quantum crypto if asked)
- Disappointed in Torres (trusted him)
- Focused on research security, not people drama

### Kevin Park (Badge Clone Target - Open Office)
**Role:** IT Systems Administrator
**Age:** 29
**Relationship:** Tech ally, casual friend to Torres

**Characterization:**
- Helpful, casual tech guy
- Noticed Torres acting strange lately
- Has employee badge (cloneable via social engineering)
- Can provide lockpick if player builds rapport (influence >= 6)

**Voice:**
- Casual, friendly
- Tech jargon mixed with casual speech
- Gossips about office dynamics
- Willing to help if approached right

### Lisa Park (Optional NPC - Break Room)
**Role:** Marketing Coordinator
**Age:** 31
**Relationship:** Office observer, casual acquaintance to Torres

**Characterization:**
- Observant about office morale
- Noticed Torres stressed, distracted lately
- Provides humanizing details (coffee habits, family mentions)
- Optional social path for context

**Voice:**
- Conversational, empathetic
- Office gossip (not malicious, concerned)
- Humanizes Torres before player knows he's insider

### Agent 0x99 (Handler - Phone Only)
**Role:** SAFETYNET Mission Handler
**Background:** Player's primary contact throughout campaign

**Characterization:**
- Professional spymaster, cool under pressure
- Morally complex (understands Torres' dilemma)
- Strategic thinker (sees bigger picture - 47 other targets)
- Respects player's choices but provides guidance

**Voice:**
- Brief, tactical communication
- Acknowledges moral complexity
- Provides context (campaign continuity)
- Reflects on choices in debrief without judgment

---

## Technical Implementation Guide

### Global Variables (60+ tracked)

**Investigation Progress:**
```ink
VAR reviewed_security_logs = false
VAR identified_upload_pattern = false
VAR torres_identified = false
VAR evidence_level = 0  // 0-7+, gates confrontation at >= 4
```

**Evidence Discovery:**
```ink
VAR found_medical_bills = false
VAR found_torres_journal = false
VAR found_briefcase_comms = false
VAR found_usb_device = false
```

**VM Flags:**
```ink
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false  // Unlocks Architect communications
```

**LORE Discovery:**
```ink
VAR found_recruiting_pamphlet = false
VAR found_architect_protocol = false
VAR found_heisenberg_specs = false
VAR found_target_criteria = false
VAR lore_completionist = false  // All 4 fragments
```

**NPC Relationships:**
```ink
VAR patricia_trust = 5  // Starts moderate
VAR kevin_influence = 0  // Build to >= 6 for lockpick
VAR chen_trust = 0  // Build for research lab access
VAR lisa_rapport = 0
```

**Interviews Conducted:**
```ink
VAR interviewed_chen = false
VAR interviewed_kevin = false
VAR interviewed_lisa = false
VAR informed_patricia = false
```

**Critical Choice & Outcome:**
```ink
VAR final_choice = ""  // "turn_double_agent", "arrest", "combat_nonlethal", "combat_lethal", "public_exposure"
VAR torres_turned = false
VAR torres_arrested = false
VAR torres_killed = false
VAR elena_treatment_funded = false
VAR entropy_program_exposed = false
```

### Ink Tag Usage Examples

**Task Completion:**
```ink
=== review_security_logs ===
You access the security terminal. Badge access logs for past 30 days displayed.

+ [Filter for unusual late-night access]
    2-4 AM access pattern detected. Same badge, 47 occurrences.
    #complete_task:review_security_logs
    #increment:evidence_level
    ~ reviewed_security_logs = true
    -> identify_pattern
```

**Unlocking New Areas:**
```ink
=== clone_employee_badge ===
You successfully clone Kevin's employee badge.

#complete_task:clone_employee_badge
#unlock_room:server_hallway
The server hallway is now accessible.
-> DONE
```

**Evidence Level Gating:**
```ink
=== evidence_board_correlation ===
+ {evidence_level >= 4} [Correlate all evidence]
    Medical bills. Journal. VM flags. Briefcase communications.
    Everything points to David Torres.

    #complete_task:correlate_evidence
    #unlock_aim:stop_operation_schrodinger
    You know who the insider is. Time to confront him.
    -> DONE

+ {evidence_level < 4} [Try to correlate evidence]
    You don't have enough evidence yet.
    {not flag4_submitted: Complete the VM exploitation to find The Architect's communications.}
    -> DONE
```

**Branching Choice:**
```ink
=== confrontation_choice ===
Torres: *reading casualty projections* I... I knew. The Recruiter told me.

Torres: *defensive* The system is corrupt. The military-industrial complex—

Torres: *voice cracking* But Elena. Twelve to forty people. Real people.

You have the evidence. You know the truth. What do you do?

+ [You're not too far gone. Help us, and we'll help Elena.]
    #complete_task:make_critical_choice
    #set:final_choice:turn_double_agent
    ~ torres_turned = true
    -> turn_double_agent_path

+ [You're under arrest for espionage and treason.]
    #complete_task:make_critical_choice
    #set:final_choice:arrest
    ~ torres_arrested = true
    -> arrest_path

+ [Drop the philosophy. Fight or surrender. Your choice.]
    // Torres resists
    -> combat_choice

+ [Expose everything publicly. Burn ENTROPY's program.]
    #complete_task:make_critical_choice
    #set:final_choice:public_exposure
    ~ entropy_program_exposed = true
    -> public_exposure_path

=== combat_choice ===
Torres: You're not taking me.

+ [Subdue him non-lethally]
    #complete_task:make_critical_choice
    #set:final_choice:combat_nonlethal
    ~ torres_arrested = true
    -> combat_nonlethal_path

+ [Lethal force authorized - neutralize the threat]
    #complete_task:make_critical_choice
    #set:final_choice:combat_lethal
    ~ torres_killed = true
    -> combat_lethal_path
```

### NPC Dialogue Structure

**Patricia Morgan - Initial Meeting:**
```ink
=== meet_patricia_morgan ===
#speaker:patricia_morgan
#location:reception_lobby

A woman in her early 50s approaches. Military bearing, sharp eyes. Former Marine, you'd guess.

Patricia: You must be the SAFETYNET consultant. Patricia Morgan, Chief Security Officer.
Patricia: Thanks for coming on short notice.

+ [Glad to help. What's the situation?]
    Patricia: Data exfiltration. 4.2 terabytes over the past six weeks.
    Patricia: Project Heisenberg. Quantum cryptography research.
    -> briefing_details

+ [Let's skip the pleasantries. I need access.]
    Patricia: Direct. I like it.
    Patricia: Here's your visitor badge. Limited access for now.
    -> receive_badge

=== briefing_details ===
Patricia: The data's classified. DoD contracts. Quantum key distribution.
Patricia: If it reaches foreign governments...

+ [I understand the stakes. Who has access?]
    Patricia: Eight people with TS/SCI clearance. Cryptography division.
    -> suspect_list

+ [What's been exfiltrated so far?]
    Patricia: 73% of Project Heisenberg. 847 pages of protocols, zero-day exploits, deployment database.
    Patricia: We're on a timer.
    -> timer_urgency

=== receive_badge ===
#give_item:visitor_badge
#complete_task:obtain_security_badge

Patricia hands you a visitor badge.

Patricia: This gets you into public areas. For restricted zones, you'll need to... improvise.
Patricia: I'll be available by phone if you need authorization.

#complete_task:meet_patricia_morgan
#unlock_room:main_corridor

+ [Understood. Where should I start?]
    Patricia: Security logs in the open office area. Look for patterns.
    Patricia: And talk to people. Someone knows something.
    -> DONE
```

**Torres Confrontation - Turn Double Agent Path:**
```ink
=== turn_double_agent_path ===
You: I'm not here to arrest you, David.
You: I'm here to offer you a way out.

Torres: *looks up, hopeful but cautious* What do you mean?

You: Work for us. Feed ENTROPY false data. Help us identify the other 47 targets.

{found_target_criteria:
    You: Yes, I found the database. You're "QD-001." There are 46 others.
    Torres: *horrified* Forty-six more people like me?
}

Torres: And... Elena?

+ [We fund her treatment. Full coverage.]
    ~ elena_treatment_funded = true
    Torres: *voice breaking* You'd do that?
    You: Conditional on your cooperation. But yes.
    -> torres_accepts

+ [We can't make promises. But we'll see what we can do.]
    Torres: *desperate* That's not good enough.
    You: It's better than prison, David.
    -> torres_reluctantly_accepts

=== torres_accepts ===
Torres: *nods slowly* Okay. Okay, I'll do it.
Torres: What do you need from me?

You: First, stop the current upload. Then we'll debrief properly.
You: The Recruiter will contact you again. When they do, you come to us immediately.

Torres: And the 46 others?

You: We save them if we can.

#set:torres_turned_successfully=true
-> stop_upload_sequence
```

---

## Implementation Checklist

### Pre-Implementation Requirements

**Stage 7: Ink Scripting** (Not yet started)
- [ ] Opening cutscene (Agent 0x99 briefing)
- [ ] Patricia Morgan dialogues (initial meeting, phone support)
- [ ] Kevin Park dialogue (badge cloning, tech ally)
- [ ] Lisa Park dialogue (optional social, office gossip)
- [ ] Dr. Sarah Chen dialogue (technical expert, research lab)
- [ ] Torres confrontation (4 branching paths)
- [ ] Evidence discovery moments (medical bills, journal, briefcase)
- [ ] VM flag submission dialogues
- [ ] Evidence board correlation
- [ ] Stop upload sequence
- [ ] Closing debrief (4 variations based on choice)

**Stage 9: Scenario Assembly** (Not yet started)
- [ ] scenario.json.erb configuration
- [ ] Room definitions (11 rooms with exact coordinates)
- [ ] Container placements (19 containers, 8 locked)
- [ ] Lock configurations (13 locks, 5 types)
- [ ] NPC placements (6 NPCs, positions specified)
- [ ] Interactive object definitions
- [ ] Objectives/aims/tasks JSON structure
- [ ] Global variable initialization
- [ ] VM integration configuration

**Additional Requirements:**
- [ ] Sprite assets (Torres, Patricia, Chen, Kevin, Lisa, Agent 0x99)
- [ ] Background art (11 rooms - reception, corridor, offices, lab, server room)
- [ ] Audio (ambient office sounds, server room hum, tension music)
- [ ] UI elements (evidence board interface, CyberChef workstation)
- [ ] SecGen scenario "Feeling Blu" (Bludit CMS exploitation, 4 flags)

---

## Campaign Integration

### If Torres Turned (Double Agent Path):
**Impact on M6-M10:**
- Torres provides intelligence on 22 active insider placements
- Identifies 47 targets under evaluation
- SAFETYNET can warn/protect vulnerable employees before recruitment
- Torres' ongoing cooperation provides ENTROPY intel throughout campaign
- Elena's treatment funded (positive moral outcome)

**Mission 6+ References:**
```ink
=== m06_briefing ===
Agent 0x99: Thanks to Torres, we identified three more insiders before ENTROPY activated them.
Agent 0x99: His intelligence is proving invaluable.
{elena_treatment_funded:
    Agent 0x99: And his wife's treatment is going well. He's motivated to help.
}
```

### If Torres Arrested:
**Impact on M6-M10:**
- Standard espionage prosecution
- No ongoing intelligence from insider program
- ENTROPY continues recruiting (47 targets still vulnerable)
- By-the-book justice, but missed strategic opportunity

### If Torres Killed (Combat - Lethal):
**Impact on M6-M10:**
- No intelligence from insider program
- ENTROPY continues recruiting (47 targets still vulnerable)
- Elena becomes widow, children lose father
- Tactical success, strategic loss
- Moral weight acknowledged in later missions

### If Program Exposed Publicly:
**Impact on M6-M10:**
- ENTROPY's Insider Threat Initiative burned
- 22 active placements compromised
- 47 targets now aware, unlikely to be recruited
- Torres' life destroyed (public traitor)
- ENTROPY retaliates in future missions

---

## Mission Success Metrics

### S-Rank Requirements:
- All 24 required tasks completed
- At least 6 of 8 optional tasks completed
- All 4 VM flags submitted
- Torres turned (double agent path)
- Zero-days patched
- All 4 LORE fragments collected
- All interviews conducted

**Rewards:**
- Torres provides intelligence for M6-M10
- 22 insider placements exposed
- 47 potential targets warned
- Elena's treatment funded
- Maximum campaign impact

### A-Rank Requirements:
- All 24 required tasks completed
- At least 4 of 8 optional tasks completed
- All 4 VM flags submitted
- Any ending path

**Rewards:**
- Mission objectives achieved
- ENTROPY operation stopped
- Good campaign impact

### B-Rank Requirements:
- All 24 required tasks completed
- At least 2 of 8 optional tasks completed
- 3+ VM flags submitted

**Rewards:**
- Basic mission success
- Operation Schrödinger stopped
- Minimal campaign impact

### C-Rank Requirements:
- All 24 required tasks completed
- At least 2 VM flags submitted

**Rewards:**
- Mission technically complete
- Immediate threat stopped
- Limited understanding of broader threat

### Failure Conditions:
- Torres completes exfiltration (100% data stolen)
- Player discovered as SAFETYNET (cover blown)
- Data reaches foreign governments before intervention
- Player killed/captured

---

## Design Philosophy Summary

**Core Tension:** De-radicalization vs. Justice vs. Combat
**Moral Complexity:** ENTROPY are clearly evil radicals; Torres is radicalized recruit who can be saved
**Player Agency:** Choice matters - turn, arrest, or combat options, consequences tracked across campaign
**Evidence-Based Gameplay:** Investigation unlocks confrontation, not arbitrary timer
**Hybrid Architecture:** VM challenges correlate with physical evidence

**What Makes This Mission Unique:**
1. **ENTROPY as Clear Evil:** Radical extremists who calculate casualties and recruit through suffering
2. **Radicalized Recruit:** Torres knows his actions will kill people, has rationalized it, but can be de-radicalized (3 months in)
3. **Arrest/Combat Options:** Player can arrest peacefully or engage in combat (lethal/non-lethal) if Torres resists
4. **Concrete Stakes:** Specific casualties (12-40), specific victims (47 targets)
5. **Moral Choice:** De-radicalize (strategy + mercy), arrest (justice), combat (tactical), or expose (nuclear option)
6. **Campaign Impact:** Choice affects M6-M10 (Torres as asset, prisoner, casualty, or public witness)

---

**Mission 5 Planning: COMPLETE**
**Total Planning Documentation:** 5,632 lines across 6 stages
**Ready for:** Stage 7 (Ink Scripting) and Stage 9 (Scenario Assembly)

