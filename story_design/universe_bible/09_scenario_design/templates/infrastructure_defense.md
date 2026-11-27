# Infrastructure Defense Scenario Template

## Overview

**Scenario Type**: Defensive Operations / Incident Response
**Infrastructure Type**: [Power Grid / Water Treatment / Transportation / Hospital / Financial / Government]
**ENTROPY Cell**: Critical Mass (primary) or [other cell]
**Difficulty**: [Intermediate / Advanced]
**Estimated Playtime**: 60-90 minutes
**CyBOK Areas**: Security Operations, Network Security, Incident Management, ICS/SCADA Security

## Scenario Premise

[Description of the critical infrastructure under attack and why SAFETYNET is involved]

**Infrastructure Details:**
- **Organization**: [Utility company / Government facility / etc.]
- **Criticality**: [How many people/systems depend on it]
- **Current Status**: [Under active attack / Compromised but stable / Pre-attack warning]
- **Time Pressure**: [How long until catastrophic failure]

**ENTROPY Attack:**
- **Cell**: Critical Mass [or other]
- **Primary Villain**: "Blackout" / "SCADA Queen" / [Custom name]
- **Attack Method**: [SCADA compromise / Network infiltration / Physical sabotage]
- **Timeline**: [When attack reaches critical stage]
- **Scope**: [Local / Regional / National impact]

---

## Three-Act Narrative Structure

### Pre-Mission: Emergency Briefing

**Location**: SAFETYNET HQ (or en route)
**Handler**: Agent 0x99 or Director Netherton
**Urgency**: High - active threat or imminent attack

**Briefing Elements:**
- **The Crisis**: [What triggered the alert]
- **Current Status**: [Systems compromised, timeline to failure]
- **Stakes**: [Lives at risk, economic impact, cascading failures]
- **Cover Story**: [Emergency consultant, government inspector, etc.]
- **Authorization**: Emergency protocols invoked
- **Equipment**: Standard kit + [specialized tools for infrastructure]

**Example Briefing:**
> **Agent 0x99**: "Agent 0x00, we have an active situation. [Infrastructure type] is under cyber attack. ENTROPY signature all over it. You're 10 minutes out."
>
> **Agent 0x99**: "Current status: [specific systems] are compromised. If they reach [critical systems], we're looking at [catastrophic outcome] affecting [number] people. You have [time limit] before it goes critical."
>
> **Director Netherton**: "Per Emergency Protocol Omega-7: All necessary actions authorized. Stop this attack. Collateral damage to systems is acceptable. Collateral damage to people is not. Move fast."

---

### Act 1: Assessment & Triage (15-20 minutes)

**Objectives:**
- ☐ Assess current threat level
- ☐ Identify compromised systems
- ☐ Establish communication with facility staff
- ☐ Locate control systems
- ☐ Begin gathering evidence of attack vector
- ★ Determine if attack is ongoing or staged

**Starting Location: [Control Room / Security Office / Main Entrance]**

**Immediate Situation:**
[Describe the scene - alarms, panicked staff, systems failing, etc.]

**NPCs - Facility Staff:**
- **Operations Manager**: [Stressed, cooperative, technical knowledge]
- **IT Administrator**: [May be compromised or innocent]
- **SCADA Engineer**: [Critical ally or potential insider threat]
- **Security Chief**: [Suspicious of outsiders, wants to maintain control]

**Initial Assessment Challenges:**
- Determine which systems are compromised
- Identify attack timeline and progression
- Locate critical control systems
- Assess if insider threat exists

**Early Warning Signs:**
- [System A] showing [anomalous behavior]
- [System B] access logs indicate [suspicious pattern]
- [System C] has been [taken offline / locked / encrypted]

**First Critical Decision:**
**Choice: Immediate Action vs. Investigation**
- **Option A**: Shut down compromised systems NOW (stops attack, causes service disruption)
- **Option B**: Investigate while systems run (gather intelligence, risk attack progressing)
- **Option C**: Isolate compromised systems (balanced approach, technical challenge)
- **Impact**: Affects Act 2 difficulty and intelligence gathered

---

### Act 2: Defense & Investigation (25-40 minutes)

**Phase 1: Active Defense (10-15 minutes)**

**Defensive Challenges:**

**Critical System 1: [SCADA/Control System]**
- **Status**: [Compromised / Under attack / Vulnerable]
- **Threat**: [Specific malicious action ENTROPY is attempting]
- **Defense Options**:
  - Technical: [Patch vulnerability, close backdoor, restore from backup]
  - Physical: [Disconnect from network, manual override]
  - Social: [Coordinate with operations staff]
- **Educational Focus**: ICS/SCADA security principles

**Critical System 2: [Network Infrastructure]**
- **Status**: [Details]
- **Attack Vector**: [How ENTROPY gained access]
- **Defense**: [Specific actions required]
- **Educational Focus**: Network security, access control

**Critical System 3: [Backup/Failsafe Systems]**
- **Status**: [Already compromised? Still secure?]
- **Importance**: [Last line of defense]
- **Challenge**: [Ensure these remain operational]

**Time Pressure Mechanic:**
- [X minutes] until [specific failure]
- System status deteriorating
- Countdown creates urgency
- Optional: Multiple simultaneous threats requiring prioritization

**Phase 2: Threat Investigation (15-20 minutes)**

**Investigating the Attack:**

**Evidence Locations:**
1. **Network Logs**: [Where found, what they reveal]
2. **SCADA System Logs**: [Access patterns, unauthorized changes]
3. **Physical Access Records**: [Who entered restricted areas]
4. **Email/Communications**: [Phishing attempts, social engineering]
5. **Compromised Workstations**: [Malware, backdoors, credentials]

**Backtracking Puzzles:**

**Puzzle Chain 1: Tracing the Intrusion**
- **Start**: Notice anomalous traffic in [location A]
- **Investigate**: Check logs in [location B]
- **Discover**: Backdoor installed from [location C]
- **Backtrack**: Return to [location A] to close vulnerability
- **Educational**: Log analysis, forensics

**Puzzle Chain 2: Identifying Attack Vector**
- **Multiple Sources**: Information scattered across control room, IT office, maintenance area
- **Correlation**: Player must connect pieces
- **Solution**: Reveals how ENTROPY gained access
- **Backtrack**: Apply fix at original entry point

**Discovering the Insider (if applicable):**
- Evidence accumulates pointing to [specific NPC]
- Behavioral analysis: [Suspicious patterns]
- Technical evidence: [Credentials used, access times]
- Confrontation: [When and how to reveal]

**Phase 3: ENTROPY's Plan Revealed**

**Attack Objectives Discovery:**
- **Immediate Goal**: [System failure, data destruction, physical damage]
- **Long-term Goal**: [Cascading failures, demonstration attack, economic damage]
- **Motivation**: [Why this target? Critical Mass's strategy]
- **Evidence**: [Where full plan is discovered]

**Major Player Choices:**

**Choice 1: System Priority**
> Multiple systems failing. Which do you protect first?
- **Option A**: [System affecting most people]
- **Option B**: [Most critical system]
- **Option C**: [System you can actually save]
- **Impact**: Different systems saved/lost, affects debrief

**Choice 2: Innocent Staff Member Compromised**
> [NPC name] was socially engineered into helping ENTROPY unknowingly
- **Option A**: Report them (by the book, they may face consequences)
- **Option B**: Protect them (compassionate, may complicate investigation)
- **Option C**: Use them to trace back to ENTROPY (strategic but manipulative)
- **Impact**: NPC's fate, additional intelligence

**Choice 3: Collateral Damage**
> Stopping the attack requires [shutting down systems / disrupting service]
- **Option A**: Minimize disruption (slower, safer, attack may progress)
- **Option B**: Maximum effectiveness (fast, causes service interruption)
- **Option C**: Coordinate with facility (political, time-consuming)
- **Impact**: Service disruption level, civilian impact

**Choice 4: Evidence vs. Prevention**
> Can gather detailed forensics OR stop attack immediately
- **Option A**: Stop attack now (saves systems, loses intelligence)
- **Option B**: Document everything (intelligence gain, risk of more damage)
- **Option C**: Split focus (attempt both, may fail at both)
- **Impact**: Intelligence for future operations vs immediate protection

**LORE Fragments:**
1. **Control Room**: Critical Mass operations manual excerpt
2. **SCADA System**: Technical analysis of infrastructure vulnerabilities
3. **IT Office**: Communication from "Blackout" to The Architect
4. **Hidden Server**: Historical context - previous infrastructure attacks
5. **Compromised Workstation**: Insider recruitment methods

---

### Act 3: Confrontation & Stabilization (15-20 minutes)

**Final Challenge: Secure the Infrastructure**

**Last-Stage Attack:**
[ENTROPY's final attempt to cause damage before being expelled]
- **Dead Man's Switch**: [Automated failsafe if detected]
- **Final Payload**: [Ransomware / Wiper / Physical damage command]
- **Time Limit**: [Minutes to prevent catastrophic failure]

**Technical Challenge:**
- **Type**: [Multi-stage decryption / System restoration / Manual override]
- **Combines**: All skills learned during scenario
- **Difficulty**: High
- **Failure State**: Partial system loss (not complete failure)

**Confrontation Options:**

**If Insider Threat Identified:**

**Option A: Immediate Arrest**
> "It's over. You're under arrest for sabotage and terrorism."
- Secure arrest, find evidence independently
- Debrief: Professional conduct

**Option B: Force Cooperation**
> "Help me stop this attack, or you go down as the person who killed [number] people."
- Coercion, faster resolution
- Debrief: Effective but ethically questionable

**Option C: Recruitment**
> "ENTROPY will burn you. Help us, and we'll protect you from prosecution."
- Requires leverage
- Ongoing intelligence asset
- Debrief: Strategic thinking

**Option D: Combat**
> [If insider resists violently]
- Combat encounter
- Evidence secured after
- Debrief: Necessary force assessment

**If Remote Attack (No Physical Insider):**

**Trace the Attacker:**
- Follow network connections
- Identify command & control server
- Discover ENTROPY safe house / relay
- Option: Coordinate strike on physical location (sets up future scenario)

**Mission Completion:**
- ✓ Critical systems secured
- ✓ Attack stopped or contained
- ✓ Evidence of ENTROPY involvement gathered
- ✓ Facility operational (or minimally damaged)

**Optional Objectives:**
- ★ All systems protected (no casualties/service interruption)
- ★ Insider identified (if applicable)
- ★ Complete attack vector documentation
- ★ Traced attack to ENTROPY cell location
- ★ All LORE fragments collected

---

### Post-Mission: Debrief Variations

**Ending A: Perfect Defense**
> **Agent 0x99**: "Flawless, Agent. Zero casualties, minimal service disruption, attack completely stopped. The facility is already back to normal operations."
>
> **Director Netherton**: "Textbook emergency response. Lives saved, systems protected, evidence secured. Exemplary work."
>
> **Agent 0x99**: "[Number] people have no idea how close they came to [disaster]. You stopped Critical Mass cold. I'm updating your specialization in Incident Response and ICS Security."

**Ending B: Partial Success**
> **Agent 0x99**: "Attack stopped, but we took some damage. [Specific system] went down for [duration]. [X number] affected, but it could have been much worse."
>
> **Director Netherton**: "Per Protocol Emergency-12: Acceptable losses given the timeline. Not perfect, but sufficient."
>
> **Agent 0x99**: "Critical Mass attempted a [description] attack. You prevented the worst-case scenario. The [partial failures] will be learning experiences."

**Ending C: Messy but Successful**
> **Agent 0x99**: "Well, the attack is stopped. The facility is... recovering. There were complications, but the catastrophic outcome was prevented."
>
> **Director Netherton**: "Results matter. Lives saved: [number]. Systems damaged: [list]. Could have been cleaner, but given the circumstances, acceptable."
>
> **Agent 0x99**: "Critical Mass is regrouping. This was a test run for larger attacks. Your rapid response prevented disaster, even if it was chaotic."

**Ending D: Sacrificial Choice**
> **Agent 0x99**: "You made a hard call, Agent. [Specific system/area] was sacrificed to save [larger system]. [Number] affected, but [larger number] protected."
>
> **Director Netherton**: "Utilitarian calculus in emergency scenarios. Not every choice is clean. You saved the most lives possible given the constraints."
>
> **Agent 0x99**: "The [sacrificed element] can be rebuilt. The [protected element] cannot. History will judge your choice, but I believe you made the right one."

**Ending E: Intelligence Gathering**
> **Agent 0x99**: "You took extra time to document everything. The attack caused more damage than necessary, but the intelligence you gathered is invaluable."
>
> **Director Netherton**: "Strategic vs. tactical tradeoff. The [damage] is unfortunate, but understanding Critical Mass's methods will protect future targets."
>
> **Agent 0x99**: "Your forensics work revealed Critical Mass has [intelligence on other targets]. We're moving to protect them now. Your sacrifice of immediate protection for long-term intelligence may save more lives overall."

**Universal Closing:**
> **Agent 0x99**: "This was Critical Mass testing their capabilities against hardened infrastructure. The attack signature matches operations in [other locations]. ENTROPY is escalating. We'll need you again soon."
>
> **Agent 0x99**: "One more thing - the SCADA exploits they used are custom-developed. Someone inside Critical Mass has serious industrial control system expertise. We're adding this to The Architect's threat profile."

---

## Location Breakdown

### Control Room / Operations Center
**Function**: Primary defensive position, system monitoring
**Size**: Large
**NPCs**: Operations Manager, SCADA Engineers (2-3)
**Systems**:
- Master SCADA interface
- System status monitors
- Alert management
- Manual override controls
**Challenges**:
- Interpreting system status
- Coordinating with staff
- Responding to multiple alerts
- Maintaining critical operations

### IT/Network Operations Center
**Function**: Investigation, log analysis, network defense
**Size**: Medium
**NPCs**: IT Administrator, Network Engineer
**Systems**:
- Network monitoring tools
- Log servers
- VM access to compromised systems
- Firewall/IDS controls
**Challenges**:
- Log analysis for intrusion evidence
- Network traffic analysis
- Identifying attack vector
- VM exploitation/investigation

### Server Room / Data Center
**Function**: Physical infrastructure, backup systems
**Size**: Medium
**NPCs**: Usually empty (restricted access)
**Systems**:
- Primary servers
- Backup systems
- Environmental controls
**Security**: Keycard access, biometric locks
**Challenges**:
- Physical security bypass
- System restoration
- Backup integrity verification

### Maintenance / Engineering Area
**Function**: Physical system access, manual controls
**Size**: Medium-Large
**NPCs**: Maintenance staff
**Systems**:
- Physical control systems
- Manual override stations
- Emergency shutdown controls
**Challenges**:
- Physical challenges (not just cyber)
- Understanding industrial systems
- Manual operation under pressure

### Security Office
**Function**: Access control, surveillance, potential insider location
**Size**: Small-Medium
**NPCs**: Security Chief, Guards
**Systems**:
- Access logs
- Camera feeds
- Badging systems
**Evidence**:
- Who accessed restricted areas
- Timeline of physical intrusions
- Potential insider identified

---

## Critical Infrastructure Systems

### Primary Systems (Must Protect)

**System 1: [Core Operations]**
- **Function**: [Main purpose of infrastructure]
- **Failure Impact**: [Immediate catastrophic consequence]
- **ENTROPY Target**: [Why they're attacking this]
- **Defense Method**: [How to protect/restore]
- **Educational Focus**: SCADA security, control systems

**System 2: [Safety Systems]**
- **Function**: [Monitors and prevents dangerous conditions]
- **Failure Impact**: [Safety hazards, potential casualties]
- **ENTROPY Target**: [Increase damage from primary failure]
- **Defense Method**: [Verification, redundancy]
- **Educational Focus**: Safety-critical systems

**System 3: [Communication/Coordination]**
- **Function**: [Enables facility-wide response]
- **Failure Impact**: [Cannot coordinate response]
- **ENTROPY Target**: [Chaos and confusion]
- **Defense Method**: [Backup communication methods]

### Secondary Systems (Important but not Critical)

**System 4: [Monitoring/Logging]**
- **Function**: [Tracks operations, records events]
- **ENTROPY Target**: [Hide evidence of attack]
- **Defense Priority**: Lower, but useful for investigation

**System 5: [Backup/Redundancy]**
- **Function**: [Failover if primary systems compromised]
- **ENTROPY Target**: [Ensure no recovery possible]
- **Defense Priority**: High - preserve fallback options

---

## Attack Vectors

### Initial Compromise (How ENTROPY Got In)

**Option A: Social Engineering**
- Phishing email to [staff member]
- Credentials harvested
- Initial access gained
- **Evidence**: Email logs, compromised credentials

**Option B: Supply Chain**
- Backdoor in [vendor software/hardware]
- Legitimate update contained malware
- Widespread compromise
- **Evidence**: Update logs, suspicious code

**Option C: Insider Threat**
- [Staff member] recruited/coerced by ENTROPY
- Direct access provided
- Ongoing assistance
- **Evidence**: Access patterns, communications

**Option D: Physical Breach**
- ENTROPY agent gained physical access
- Hardware implants installed
- Network segmentation bypassed
- **Evidence**: Badge logs, physical evidence

### Attack Progression

**Stage 1: Reconnaissance** (Days/weeks before)
- Mapping network
- Identifying critical systems
- Testing defenses

**Stage 2: Positioning** (Hours before)
- Installing backdoors
- Establishing persistence
- Preparing payload

**Stage 3: Execution** (Active attack)
- Compromising control systems
- Disabling safety mechanisms
- Initiating destructive actions

**Stage 4: Obfuscation** (During/after)
- Deleting logs
- Creating false trails
- Dead man's switches

---

## Educational Focus

### ICS/SCADA Security
**Concepts Taught:**
- Difference between IT and OT security
- Air-gap vulnerabilities
- SCADA protocol weaknesses
- Safety system integrity
- Industrial control logic

**Implementation:**
- Hands-on SCADA interface interaction
- Understanding control system logic
- Recognizing anomalous SCADA behavior
- Manual override procedures

### Incident Response
**Concepts Taught:**
- Triage and prioritization
- Containment strategies
- Evidence preservation during active defense
- Coordination with facility staff
- Post-incident analysis

**Implementation:**
- Real-time decision making
- Multiple simultaneous incidents
- Balancing speed and thoroughness
- Documented response procedures

### Network Security
**Concepts Taught:**
- Network segmentation importance
- Traffic analysis
- Intrusion detection
- Access control failures
- Lateral movement prevention

**Implementation:**
- Log analysis puzzles
- Network diagram interpretation
- Identifying compromised hosts
- Closing backdoors

### Forensics & Log Analysis
**Concepts Taught:**
- Timeline reconstruction
- Correlation across multiple sources
- Identifying attack patterns
- Evidence chain of custody

**Implementation:**
- Multi-source log analysis
- Timeline correlation puzzles
- Distinguishing legitimate from malicious activity

---

## Variations

### Infrastructure Type Variations

**Power Grid:**
- SCADA systems controlling substations
- Load balancing attacks
- Cascading failure potential
- Regional blackout risk

**Water Treatment:**
- Chemical dosing system compromise
- Contamination risk
- Public health emergency
- Environmental monitoring

**Transportation:**
- Traffic control systems
- Rail switching compromise
- Airport systems
- Mass casualty potential

**Hospital:**
- Medical device networks
- Patient records systems
- Life support systems
- Immediate life/death stakes

**Financial:**
- Trading systems
- Transaction processing
- Market manipulation
- Economic destabilization

### Difficulty Scaling

**Intermediate:**
- Clear system status indicators
- Guided defense procedures
- Helpful facility staff
- Single attack vector
- More time to respond

**Advanced:**
- Complex multi-system interactions
- Ambiguous information
- Facility staff may be unhelpful/suspicious
- Multiple simultaneous attack vectors
- Strict time limits
- Insider threat complications

---

## Common Pitfalls to Avoid

- **Don't**: Make technical systems completely unrealistic
- **Don't**: Have unlimited time (eliminates tension)
- **Don't**: Ignore facility staff (they should be essential)
- **Don't**: Make all choices equally good (force difficult trade-offs)
- **Don't**: Forget the human impact (lives at stake)
- **Don't**: Make attack unstoppable (player must be able to succeed)
- **Don't**: Over-complicate SCADA interactions (keep functional)

---

*This template creates high-stakes defensive scenarios focused on protecting critical infrastructure. The time pressure, multiple simultaneous challenges, and difficult choices create intense, educational gameplay that teaches real-world incident response and ICS security.*
