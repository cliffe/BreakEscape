> ⚠️ **SUPERSEDED (2026-08-21).** These stage documents describe the original **water-treatment**
> concept for m04 (chlorine dosing, Dec 2025). The mission was rebuilt as **grid battery storage**
> (Albion Energy Storage) and then aligned to the m01 standard. They are kept for historical
> reference only. The authoritative design is `scenarios/m04_critical_failure/ALIGNMENT_PLAN.md`;
> the current implementation is the scenario and ink files themselves.

# Mission 4: "Critical Failure" - Development Preparation

**Mission ID:** m04_critical_failure
**Title:** Critical Failure
**Status:** 🔄 READY FOR STAGE 0 INITIALIZATION
**Prepared:** 2025-12-28
**Development Process:** 9-Stage Scenario Development Workflow

---

## Executive Summary

Mission 4 "Critical Failure" is an infrastructure defense mission where players must prevent a catastrophic attack on a water treatment facility's SCADA systems. This mission introduces hostile NPCs (combat), time-pressure objectives, and multi-system investigation while reinforcing all previously learned mechanics.

**Key Metrics (Target):**
- **Difficulty:** Intermediate (Mission 4 of Season 1)
- **Estimated Playtime:** 60-80 minutes
- **ENTROPY Cell:** Critical Mass
- **SecGen Scenario:** "Vulnerability Analysis" (Nmap/Nessus scanning, distcc + sudo Baron privilege escalation)
- **CyBOK Areas:** Cyber-Physical Systems, Security Operations, Systems Security
- **New Mechanics:** Hostile NPCs (combat), item drops from enemies, time-pressure objectives, multi-system investigation

---

## Mission Overview from Season 1 Arc

### Story Premise

Water treatment facility's SCADA systems show suspicious activity. SAFETYNET suspects ENTROPY's Critical Mass cell is planning infrastructure attack. Player must infiltrate facility, secure systems, and prevent contamination crisis—all while facility remains operational.

### Core Challenges (Break Escape)

- **All previous mechanics** (lockpicking, guards, RFID, social engineering)
- **Hostile NPCs** (NEW) - ENTROPY operatives already infiltrated facility
- **Multi-stage investigation** - identify which systems compromised
- **Time pressure** - prevent scheduled attack

### VM Challenge Integration

**SecGen "Vulnerability Analysis":**
- Scan SCADA network to identify vulnerabilities
- Exploit distcc vulnerability to access compromised systems
- Escalate privileges using sudo Baron vulnerability
- Secure systems and identify attack timeline

**Narrative Context:**
- Critical Mass has already compromised facility systems
- Player must identify attack vector before scheduled chemical dosing attack
- VM challenges represent accessing and securing critical infrastructure
- Scanning and exploitation simulate defensive penetration testing under crisis

### Educational Objectives (CyBOK)

- **Cyber-Physical Systems:** SCADA security, ICS vulnerabilities, critical infrastructure
- **Security Operations:** Vulnerability scanning, threat hunting, defensive operations
- **Systems Security:** Privilege escalation, system hardening

### Narrative Arc (3 Acts)

**Act 1: Undercover Emergency (15-20%)**
- Emergency briefing - Critical Mass cell detected
- Infiltrate as "emergency security auditor"
- Discover facility already compromised

**Act 2: Investigation & Combat (50-60%)**
- Combat hostile ENTROPY operatives (first physical combat)
- Secure server room access
- Scan SCADA network
- Discover scheduled chemical dosing attack
- Exploit vulnerable systems to gain access and identify attack vector

**Act 3: Crisis & Choice (20-30%)**
- Race against time to disable attack
- Choice - subtle disabling (ENTROPY doesn't know) vs. obvious shutdown (secure but alerts cell)
- Confront or capture ENTROPY field team
- Consequences of choice affect facility operations

### Key NPCs

- **Robert Chen** (Facility Manager) - Initially suspicious of player, becomes ally
- **"Voltage" & Team** (Critical Mass operatives) - Hostile combatants, can be captured
- **Agent 0x99** (Remote support) - Provides real-time intelligence during crisis

---

## Game Mechanics Introduced

12. **Hostile NPCs (combat)** - First combat encounter with ENTROPY operatives
13. **Item drops from defeated enemies** - Keycards, passwords, intelligence docs
14. **Escalating urgency** - Attack progresses through stages as player investigates
15. **Multi-system investigation** - Correlate evidence from SCADA, network, and physical systems

---

## LORE Opportunities

- **Critical Mass Operational Plans** - Reference "OptiGrid Solutions" cover company
- **Cross-Cell Coordination** - Attack coordinated with Social Fabric disinformation (prepare public panic narrative)
- **Test Run Documentation** - Communications show attack is "test run" for larger operation
- **The Architect's Infrastructure Initiative** - Reference to broader ENTROPY infrastructure strategy

---

## Moral Complexity

**Major Choice:** Capture operatives for intel (risk attack proceeding) vs. stop attack immediately (operatives escape)

**Secondary Choice:** Publicly expose facility vulnerabilities (protect public, damage facility reputation) vs. quiet patch (facility reputation intact, public uninformed of risk)

**Tertiary Consideration:** SCADA security is woefully inadequate—is the real villain the facility's negligence?

---

## Success Outcomes

- **Full Success:** Attack prevented, operatives captured, vulnerabilities patched, no public panic
- **Partial Success:** Attack prevented but operatives escape, or minor contamination occurred
- **Minimal Success:** Attack prevented but significant consequences (public panic, facility damage)

---

## Connection to Campaign Arc

- **MAJOR REVELATION:** Critical Mass coordinating with Social Fabric (M1 cell) for combined infrastructure + disinformation attack
- Pattern confirmed: ENTROPY cells working together under coordination
- "The Architect" now central focus of investigation
- Sets up infrastructure theme for later missions

**Post-Mission Debrief Revelation:**
SAFETYNET intelligence shows similar coordinated attacks planned globally. The Architect is coordinating multi-cell operations on unprecedented scale. Player is assigned to "Task Force Null" - hunting The Architect.

---

## Technical Requirements

### SCADA/ICS Environment

**Facility Systems:**
- Water treatment SCADA control systems
- Chemical dosing automation
- Monitoring and telemetry systems
- Facility network infrastructure

**Security Concerns:**
- Legacy systems with known vulnerabilities
- Air-gapped networks (theoretically)
- Limited security monitoring
- Operational necessity vs. security trade-offs

### VM Network Topology

**Network Segments:**
- Corporate IT network (entry point)
- SCADA control network (target)
- Safety/monitoring systems (secondary)
- Backup/maintenance systems (intelligence source)

**Key Services:**
- distcc vulnerable service (exploitation target)
- sudo Baron privilege escalation (access control bypass)
- Nmap/Nessus scanning context (vulnerability assessment)

---

## Combat System Requirements

### Hostile NPC Behaviors

**"Voltage" (Leader):**
- Alert and tactical
- Calls for backup if player detected
- Attempts to trigger attack if cornered

**Field Operatives (2-3):**
- Patrol patterns in facility
- Guard critical systems
- Drop keycards and intelligence when defeated

### Combat Mechanics

**Player Options:**
- Stealth takedowns (non-lethal, silent)
- Direct combat (faster but alerts others)
- Avoidance (slower but safest)

**Consequences:**
- Alerted operatives trigger faster attack timeline
- Defeated operatives drop useful items
- Captured operatives provide intelligence

---

## Escalating Urgency System

### Progressive Threat Stages

**Stage-Based Urgency (No Real-Time Timer):**
- Attack progresses through narrative stages
- Player actions advance or delay attack preparation
- Visual/audio cues indicate progression (not countdown)
- Tension builds through story events, not clock

### Attack Progression Stages

**Stage 1: Infiltration (Discovery)**
- Player discovers facility compromised
- Attack scheduled but not yet initiated
- Operatives preparing systems

**Stage 2: System Compromise (Investigation)**
- SCADA systems show anomalies
- Chemical dosing parameters being altered
- Operatives become aware of player presence if detected

**Stage 3: Attack Preparation (Crisis)**
- Attack staging nearly complete
- Multiple system failures visible
- Robert Chen warns of critical timeline

**Stage 4: Final Intervention (Climax)**
- Attack initiation sequence started
- Player must disable attack mechanisms
- Combat with Voltage becomes unavoidable

**Stage 5: Resolution**
- Attack prevented or consequences occur
- Based on player effectiveness, not time elapsed

### Urgency Indicators (Non-Timer Based)

**Visual Cues:**
- SCADA system status indicators (green → yellow → red)
- Operative radio chatter increasing in urgency
- Facility alarm states changing
- Chemical dosing gauges moving toward danger zone

**Narrative Cues:**
- Robert Chen's dialogue reflects urgency
- Agent 0x99 provides intel on attack readiness
- Captured operatives reveal attack timeline verbally
- Found documents show attack stages

**Mechanical Pressure:**
- Delayed actions allow operatives to fortify positions
- Ignoring reconnaissance means harder final encounter
- Thorough investigation provides tactical advantages

**No Failure State from Delay:**
- Attack won't trigger automatically after X time
- Player can take time to explore and investigate
- Urgency created through narrative, not punishment
- Thoroughness rewarded with easier confrontation

---

## Room Design Considerations

### Facility Layout (7-8 Rooms)

1. **Main Entrance/Security** - Entry point, security checkpoint
2. **Administration Offices** - Robert Chen's office, employee areas
3. **Control Room** - SCADA monitoring, critical systems
4. **Server Room** - Network infrastructure, VM access point
5. **Chemical Storage** - Dosing systems (attack target)
6. **Treatment Floor** - Water treatment tanks and equipment
7. **Maintenance Wing** - Backup systems, hostile NPC stronghold
8. **Outdoor Access** (Optional) - Emergency exit, perimeter

### Critical Path

**Minimum Required:**
1. Enter facility (social engineering or stealth)
2. Locate compromised systems (investigation)
3. Access server room (lockpicking/RFID)
4. Scan and exploit network (VM challenges)
5. Identify attack vector
6. Disable attack mechanism (final challenge)
7. Confront or evade operatives

---

## Asset Requirements

### Character Models

**NPCs:**
- Robert Chen (Facility Manager) - Professional, stressed
- Agent 0x99 (Phone/Radio) - Remote support
- Voltage (Critical Mass Leader) - Tactical, hostile
- Critical Mass Operatives (×3) - Combat NPCs

**Player:**
- Combat animations (takedown, combat, defeat)

### Environment Assets

**Industrial Facility:**
- SCADA control panels and monitors
- Chemical storage tanks
- Water treatment equipment
- Industrial office spaces
- Server racks and network equipment

**UI Elements:**
- SCADA system status displays (visual urgency indicators)
- Combat indicators
- Attack progression stage indicator
- Alert levels

### Sound Design

**Combat:**
- Takedown sounds
- Alert notifications
- Operative communications
- Weapon/tool sounds (non-lethal)

**Environment:**
- Machinery hum
- Water processing sounds
- Chemical pump sounds
- Alarm systems

---

## Narrative Tone & Themes

### Tone Shifts

**Opening:** Urgent crisis response, professional
**Mid-Game:** Escalating tension, paranoia (facility already compromised)
**Combat:** Action-thriller intensity
**Climax:** Race-against-time desperation
**Resolution:** Reflection on infrastructure vulnerability

### Thematic Elements

**Primary Theme:** Critical infrastructure vulnerability in digital age
**Secondary Theme:** Cross-cell ENTROPY coordination (escalation from previous missions)
**Tertiary Theme:** Responsibility—whose fault is inadequate security?

**Questions Raised:**
- Is stopping individual attacks enough when infrastructure is fundamentally insecure?
- Should players expose vulnerabilities publicly to force change?
- Are profit-driven corners cut worth the security risks?

---

## Integration with Previous Missions

### Callbacks & Connections

**From M1 (First Contact):**
- Social Fabric mentioned in coordination documents
- Similar "acceptable losses" calculation for contamination
- Public panic strategy mirrors Operation Shatter

**From M2 (Ransomed Trust):**
- Similar crisis response scenario
- Infrastructure targeting pattern established
- Facility manager parallels hospital CTO's desperation

**From M3 (Ghost in the Machine):**
- Zero Day Syndicate potentially supplied exploits to Critical Mass
- Coordination between ENTROPY cells now explicit
- The Architect's role in planning confirmed

### Cross-Mission Consequences

**If M3 Victoria was recruited as double agent:**
- Victoria provides warning about Critical Mass operation
- Player arrives earlier, more time to prepare

**If M2 ransom was paid:**
- Financial trail connects to Critical Mass funding
- Additional intelligence available

---

## Development Roadmap Reference

### Stage Sequence (9-Stage Process)

- **Stage 0:** Mission initialization (this document) ✓
- **Stage 1:** Narrative structure and story arc
- **Stage 2:** Atmosphere and environment design
- **Stage 3:** Character development and NPC design
- **Stage 4:** Player objectives and task structure
- **Stage 5:** Room design and puzzle layout
- **Stage 6:** LORE fragments and collectibles
- **Stage 7:** Ink dialogue scripting
- **Stage 8:** Validation and quality review
- **Stage 9:** Scenario assembly and implementation

---

## Critical Innovations in M4

### New Elements

1. **Combat System** - First mission with hostile NPCs requiring combat
2. **Stage-Based Urgency** - Attack progresses through narrative stages, not real-time countdown
3. **Multi-System Investigation** - Correlate evidence from physical, network, and SCADA systems
4. **Item Drops** - Defeated enemies drop useful items
5. **Crisis Decision-Making** - Choose between tactical and strategic outcomes

### Risk Mitigation

**Combat Difficulty:**
- Make stealth viable alternative to combat
- Provide multiple approaches to each combat encounter
- Ensure defeat doesn't equal game over

**Urgency Balance:**
- Create tension through narrative progression, not time punishment
- Reward thorough investigation with tactical advantages
- No automatic failure from taking time to explore
- Visual/audio cues convey urgency without strict deadlines

**SCADA Complexity:**
- Abstract technical details appropriately for gameplay
- Provide in-game tutorials for SCADA concepts
- Make VM challenges accessible to intermediate players

---

## Success Criteria

### Gameplay Metrics

- **Completable:** 95%+ of playtesters complete mission in 60-80 minutes
- **Engaging Combat:** 80%+ report combat was fair and enjoyable
- **Narrative Urgency:** 70%+ report felt tension without time pressure frustration
- **Moral Choice:** 50/50 split on major choice (indicates balanced options)

### Educational Objectives

- **SCADA/ICS Awareness:** Players understand critical infrastructure vulnerabilities
- **Defensive Mindset:** Players think like defenders, not just attackers
- **Vulnerability Scanning:** Players learn proper use of Nmap/Nessus
- **Privilege Escalation:** Players understand sudo vulnerabilities

### Narrative Quality

- **Cross-Cell Coordination:** Players recognize pattern of ENTROPY cooperation
- **Rising Stakes:** Players feel urgency and higher stakes than M1-3
- **NPC Relationships:** Robert Chen arc feels authentic and earned
- **Campaign Impact:** Post-mission debrief sets up "Task Force Null" for M5-10

---

## Next Steps

1. **Proceed to Stage 1:** Develop detailed 3-act narrative structure
2. **Character Development:** Flesh out Robert Chen, Voltage, and operative personalities
3. **Combat Design:** Design combat encounters and stealth alternatives
4. **Urgency Progression:** Design attack progression stages and urgency indicators
5. **VM Integration:** Map SecGen scenarios to narrative context
6. **SCADA Research:** Ensure realistic but accessible portrayal of water treatment SCADA

---

**Mission Status:** Ready for Stage 0 → Stage 1 transition
**Development Priority:** High (Core season 1 escalation mission)
**Estimated Development Time:** 120-150 hours (combat system + SCADA complexity)

---

*Mission 4 initialization complete. This mission represents the transition from reconnaissance-focused missions to active crisis response with combat elements. Successfully implementing M4 establishes the combat system and narrative-driven urgency mechanics that will be refined in M7-10.*
