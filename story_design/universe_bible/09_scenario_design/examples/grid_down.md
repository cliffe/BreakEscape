# Grid Down - Complete Scenario

> **Canon note (2026-08-30):** "Blackout" is **Dr. James Mercer**, per
> `03_entropy_cells/critical_mass.md`. This document previously called him Michael
> Bradford; the names have been reconciled. This file remains an illustrative design
> sketch — where it differs from the cell file or from `m07_architects_gambit`, those win.


## Scenario Overview

**Type**: Defensive Operations / Infrastructure Defense
**Difficulty**: Advanced
**Playtime**: 75 minutes
**CyBOK Areas**: ICS/SCADA Security, Incident Response, Network Security, Security Operations

**Infrastructure Type**: Power Grid (Regional Operations Center)
**Organization Type**: Infiltrated (Legitimate power company with insider threat)
**ENTROPY Cell**: Critical Mass
**Primary Villain**: "Blackout" (Tier 2 Cell Leader) - embedded as systems contractor
**Supporting Villain**: "SCADA Queen" (Tier 3 Specialist) - providing remote support
**Background**: The Architect (referenced in intercepted communications)

## Scenario Premise

A regional power grid operations center is under active cyber attack. What appeared to be routine system anomalies has escalated to a coordinated attempt to cause cascading failures across the power grid. Critical Mass has embedded an operative as a trusted systems contractor, who now has deep access to SCADA control systems. The attack is scheduled to reach critical mass (pun intended) during peak demand hours, potentially causing blackouts affecting 2 million people.

SAFETYNET has 90 minutes to identify the insider, stop the attack, and prevent catastrophic grid failure.

---

## Pre-Mission: Emergency Briefing

### En Route Briefing (Audio)

**Location**: SAFETYNET vehicle, 10 minutes from target
**Handler**: Agent 0x99 (urgent tone)
**Duration**: 2 minutes

> **Agent 0x99**: "Agent 0x00, we have an active crisis. Regional Power Grid Operations Center, downtown. SCADA systems are showing anomalous behavior—substations going offline, load balancing failing, safety systems not responding."
>
> **Agent 0x99**: "Initial assessment suggested technical glitch. But our monitoring picked up encrypted traffic to known Critical Mass infrastructure. This is an attack, and it's happening NOW."
>
> **Agent 0x99**: "You're being inserted as emergency federal inspector. Cover story: grid stability assessment after anomalies detected. Real mission: identify the attack vector, find the insider if there is one, and stop this before 2 million people lose power."
>
> **Agent 0x99**: "Timeline: Attack appears timed for 6 PM peak demand. That's 90 minutes from now. If substations go down during peak load, the cascade could black out the entire region. Hospitals, emergency services, everything."
>
> **Director Netherton**: "Per Emergency Protocol Omega-7: All necessary actions authorized. Priority one: prevent grid failure. Priority two: identify ENTROPY involvement. Priority three: evidence collection. Lives over intelligence, Agent."
>
> **Agent 0x99**: "Critical Mass signature is all over this. We believe someone inside has been compromised or inserted. Trust no one until verified. You're cleared for rapid response. ETA: 8 minutes. Stay sharp."

---

## Act 1: Assessment & Triage (15 minutes)

### Starting Location: Operations Center - Main Control Room

**Immediate Situation:**
- Alarm systems active but not critical (yet)
- Multiple monitors showing grid status
- Staff appears stressed but functioning
- Several substations showing yellow/amber status
- Primary systems still operational but degrading

**NPCs Present:**

**1. David Chen (Operations Manager)**
- Stressed, cooperative, wants help
- Innocent - genuinely doesn't understand what's happening
- Provides initial access and context
- "We thought it was equipment failure, but nothing makes sense!"

**2. Sarah Martinez (SCADA Engineer)**
- Technical, focused on systems
- Potentially compromised or innocent (player must determine)
- Has deep system access
- "The control logic is executing commands we didn't input"

**3. James Wheeler (IT Administrator)**
- Defensive, doesn't want outsiders in his systems
- Innocent but territorially protective
- Resists sharing access initially
- "This is a secure facility. Who authorized you?"

**4. Dr. James Mercer (Systems Contractor - actually BLACKOUT)**
- Calm, almost too helpful
- Offers to "assist" with investigation
- Subtly tries to steer player away from certain systems
- Critical Mass operative - primary villain

**Environmental Details:**
- Large control room with SCADA displays
- Multiple workstations
- Server room visible through glass wall (locked)
- Network operations center adjacent
- Security office down the hall

---

### Initial Assessment Challenges

**Visible Problems:**
- **Substation 7**: Offline, safety systems non-responsive
- **Substation 12**: Load shedding incorrectly
- **Substation 19**: Communications intermittent
- **Distribution Control**: Manual override not working

**Player Must Determine:**
1. Is this technical failure or attack? (Attack - evidence in logs)
2. Is attack ongoing or staged? (Ongoing - commands still being sent)
3. Is there an insider? (Yes - will discover Mercer)
4. How long until critical failure? (Countdown timer appears: 75 minutes)

---

### First Critical Choice: Immediate Response

**Situation**: Multiple substations showing problems. Can't address all simultaneously.

**Option A: Shut Down Compromised Systems**
- Immediately isolate affected substations
- Prevents further attack propagation
- Causes controlled outages (50,000 affected)
- Loses opportunity to trace attacker
- **Impact**: Safe approach, immediate casualties, loses intelligence

**Option B: Monitor and Investigate**
- Keep systems running while gathering evidence
- Risk of attack spreading
- Opportunity to identify attacker
- Population remains powered
- **Impact**: Risky approach, gather intelligence, might escalate

**Option C: Partial Isolation**
- Isolate critical systems only
- Balance safety and investigation
- Moderate service disruption (10,000 affected)
- Partial intelligence gathering
- **Impact**: Balanced approach, requires technical skill

**Choice determines Act 2 difficulty and available paths**

---

### Act 1 Objectives

**Primary:**
- ☐ Assess threat level (determine attack vs. failure)
- ☐ Identify compromised systems
- ☐ Establish communication with facility staff
- ☐ Locate SCADA control systems
- ☐ Begin evidence collection

**Bonus:**
- ★ Identify attack is timed for peak demand
- ★ Discover encrypted communications to Critical Mass

**Information Gathered:**
- Attack is real and ongoing
- Insider likely present
- Multiple systems compromised
- Timeline: ~75 minutes to peak demand crisis
- SCADA systems are attack target

---

## Act 2: Defense & Investigation (35 minutes)

### Phase 1: Active Defense (15 minutes)

### Room: SCADA Control Center

**Access**: Main control room, but advanced functions require credentials

**Challenges:**

**SCADA System Analysis:**
- **Educational Focus**: Understanding SCADA control logic
- Review control commands being executed
- Identify unauthorized logic insertion
- **Puzzle**: Distinguish legitimate automation from malicious commands
- **Discovery**: Commands sent from internal IP address (contractor workstation)

**Safety System Override:**
- Safety systems deliberately disabled
- **Educational Focus**: Industrial control safety principles
- Must re-enable without disrupting grid
- **Puzzle**: Navigate safety system restoration procedure
- **Risk**: Incorrect procedure could trip more substations

**Load Balancing Attack:**
- Malicious redistribution causing instability
- **Educational Focus**: Power grid load management
- Must rebalance while under attack
- **Puzzle**: Calculate and implement correct distribution
- **Time Pressure**: Load increasing toward peak demand

---

### Room: Network Operations Center

**Access**: Adjacent to control room, requires keycard (from Operations Manager)

**Discoveries:**

**Network Traffic Analysis:**
- Suspicious encrypted traffic to external IP
- Traffic matches Critical Mass patterns
- **Educational Focus**: Network forensics, traffic analysis
- **Puzzle**: Decrypt communications protocol (not content, just identify)
- **Evidence**: Communications with known Critical Mass infrastructure

**Access Log Review:**
- **Educational Focus**: Log analysis, timeline reconstruction
- Multiple unauthorized accesses
- Pattern shows insider with legitimate credentials
- **Puzzle**: Correlate access times with attack events
- **Discovery**: Contractor "Mercer" access aligns with every attack action

**Intrusion Detection:**
- Find how attacker maintains persistence
- **Educational Focus**: Backdoor detection
- Discover hidden remote access tools
- **Puzzle**: Locate and remove without alerting attacker
- **Risk**: Attacker may have dead man's switch

---

### Room: Server Room

**Access**: Locked (biometric OR emergency override from Operations Manager)

**Systems:**

**Primary SCADA Servers:**
- Core control systems
- Can view full command history
- **Educational Focus**: Industrial control architecture
- **Evidence**: Complete attack timeline
- **Puzzle**: Safely access without disrupting operations

**Backup Systems:**
- Potentially compromised
- **Educational Focus**: Backup integrity verification
- **Discovery**: Backups partially corrupted (attack planned thoroughly)
- **Challenge**: Determine which backups are safe

**Physical Network Infrastructure:**
- Can implement hardware-level isolation
- **Educational Focus**: Network segmentation, air gaps
- **Option**: Physically disconnect critical systems
- **Trade-off**: Maximum safety but manual operation required

---

### Phase 2: Identifying the Insider (15 minutes)

### Evidence Correlation

**Clue 1: Access Patterns**
- Mercer's credentials used during all attack events
- Location: Network Operations Center logs

**Clue 2: Technical Knowledge**
- Attack shows deep SCADA expertise
- Location: SCADA Control Center analysis

**Clue 3: Encrypted Communications**
- Outbound connection from contractor workstation
- Location: Network traffic analysis

**Clue 4: Behavioral Indicators**
- Mercer attempting to misdirect investigation
- Overly calm during crisis
- Offers to "help" in ways that slow player
- Location: Player observation during interactions

**Clue 5: Physical Evidence**
- USB device in contractor workspace (if investigated)
- Contains Critical Mass tools and documentation
- Location: Mercer's temporary office (requires investigation)

---

### Mercer (Blackout) Reveals Himself

**Trigger**: When player has gathered sufficient evidence and approaches Mercer OR attempts to access his workstation

**Scene: Confrontation Begins**

> **Player**: "Mercer, your access credentials match every attack event. The traffic from your workstation goes to known ENTROPY infrastructure. Who are you really?"
>
> **Mercer**: *Pause. Expression shifts from helpful to cold.* "I was wondering when you'd figure it out. Took you longer than I expected, Agent. Yes, SAFETYNET. I know who you are."
>
> **Mercer**: "Critical Mass. We don't attack infrastructure—we reveal its fragility. This grid has been vulnerable for years. We're just... demonstrating inevitability."

**Player realizes:**
- Mercer is "Blackout," Critical Mass cell leader
- Attack has been in motion for weeks
- Peak demand failure is deliberate timing
- Mercer has prepared multiple fallback attacks

---

### Major Player Choices During Investigation

**Choice 1: Innocent Staff Member Was Manipulated**

**Situation**: Sarah (SCADA Engineer) unknowingly helped Mercer by providing credentials when he claimed to be "testing backup systems."

**Options:**
- **A**: Report her (by the book, she may face consequences for negligence)
- **B**: Protect her (compassionate, she was tricked)
- **C**: Use her help to counter Mercer (strategic, requires her cooperation)

**Impact:**
- A: By the book, loses potential ally
- B: Protects innocent, earns loyalty
- C: Gains technical ally, morally grey manipulation

---

**Choice 2: Backup System Restoration**

**Situation**: Can restore from backups, but some are compromised. Safe backups are 3 weeks old (missing recent updates). Recent backups might be trojan horses.

**Options:**
- **A**: Use old safe backups (safe, lose 3 weeks of config changes)
- **B**: Use recent backups (faster recovery, might contain backdoors)
- **C**: Manual configuration (slowest, safest, requires expertise)

**Impact:**
- A: Service degradation but secure
- B: Fast but risky, might reintroduce vulnerabilities
- C: Time-consuming but thorough, requires technical mastery

---

**Choice 3: Public Notification**

**Situation**: 2 million people are potentially at risk. Notify public to prepare or keep quiet to avoid panic?

**Options:**
- **A**: Notify immediately (ethical, causes panic, Mercer might accelerate)
- **B**: Wait until attack stopped (practical, risk to unprepared citizens)
- **C**: Selective notification (hospitals, emergency services only)

**Impact:**
- A: Panic but preparedness, Mercer may escalate
- B: Calm but risky, focus on resolution
- C: Balanced, protects critical facilities

---

### LORE Fragments

**Fragment 1: Network Operations Center**
**Category**: ENTROPY Operations
**Content**: "Critical Mass philosophy: Infrastructure doesn't need destroying—it's already fragile. Every grid, pipeline, and network is one bad day from collapse. We just... schedule that day. Temperature regulation fails, entropy increases, chaos emerges. Thermodynamics is our ally."

**Fragment 2: SCADA Control Center**
**Category**: Technical Concept
**Content**: "ICS/SCADA Security Principles: Unlike IT systems, SCADA prioritizes availability over confidentiality. Taking a substation offline to patch it might save it from attack but could destabilize the grid. Defense requires understanding operational constraints, not just technical security."

**Fragment 3: Server Room (Hidden File)**
**Category**: The Architect
**Content**: "The Architect to Critical Mass cell leaders: 'Infrastructure attacks are demonstrations, not goals. Each successful attack proves societal fragility. When populations lose trust in essential services, chaos becomes self-sustaining. You need not destroy everything—only show it CAN be destroyed.'"

**Fragment 4: Mercer's Workstation (Encrypted)**
**Category**: Villain Background
**Content**: "'Blackout' (Real name: Dr. James Mercer): Former grid engineer, disillusioned after infrastructure vulnerabilities he reported were ignored for budget reasons. Recruited by Critical Mass when city experienced minor blackout due to exact vulnerabilities he'd warned about. Sees himself as prophet, not terrorist."

**Fragment 5: Physical Evidence (USB Device)**
**Category**: Historical Context
**Content**: "Previous Critical Mass operations: 2019 water treatment disruption (3 hours), 2021 rail switching manipulation (minor delays), 2023 traffic system compromise (6 cities). Pattern: Testing capabilities, escalating scope, demonstrating competence. This grid attack is largest scale yet."

---

### Act 2 Objectives

**Primary:**
- ☐ Stop attack on SCADA systems
- ☐ Identify insider threat (Mercer/Blackout)
- ☐ Secure backup systems
- ☐ Prevent grid cascade failure
- ☐ Gather evidence of ENTROPY involvement

**Bonus:**
- ★ Discover SCADA Queen remote support
- ★ Preserve all systems (zero outages)
- ★ Identify The Architect's involvement
- ★ Recruit Sarah as ongoing contact
- ★ Find all LORE fragments

**Time Remaining**: ~40 minutes to peak demand

---

## Act 3: Confrontation & Stabilization (15-20 minutes)

### The Final Attack Stage

**Situation**: Mercer realizes he's been discovered and activates final attack sequence

**Mercer's Monologue:**

> **Mercer**: "You think you've won? Agent, this isn't about one grid, one night. It's about inevitability. The second law of thermodynamics: entropy always increases. Order degrades to chaos. I'm just a catalyst."
>
> **Mercer**: "I reported vulnerabilities in this system three years ago. Ignored. Budget constraints. 'Acceptable risk.' Well, tonight we find out if it was acceptable."
>
> **Mercer**: "You can stop me. Maybe. But there are dozens like me in Critical Mass. Hundreds of vulnerable infrastructures. Eventually, entropy wins. It always does."

**Attack Escalation:**
- Remote access activated (SCADA Queen joining attack)
- Dead man's switch revealed (if Mercer arrested, attack accelerates)
- Multiple substations now targeted simultaneously
- Time to cascade: 25 minutes

---

### Technical Challenge: Multi-System Defense

**Challenge Type**: Time-pressure puzzle combining all learned skills

**Stage 1: Isolate Remote Access**
- SCADA Queen has backup connection
- **Puzzle**: Identify and sever connection without disrupting legitimate controls
- **Educational**: Network security, access control
- **Time Limit**: 8 minutes

**Stage 2: Restore Safety Systems**
- Multiple safety systems disabled
- **Puzzle**: Re-enable in correct sequence (wrong order causes problems)
- **Educational**: ICS safety principles, industrial control
- **Time Limit**: 7 minutes

**Stage 3: Rebalance Grid Load**
- Must manually redistribute load across healthy substations
- **Puzzle**: Calculate optimal distribution given current capacity
- **Educational**: Power grid operations, load balancing
- **Time Limit**: 10 minutes

**Failure States:**
- Complete failure: Regional blackout (bad ending)
- Partial failure: Some substations lost (moderate ending)
- Success: Grid stabilized (good ending)

---

### Confrontation with Mercer/Blackout

**Player Options:**

---

**Option A: Immediate Arrest**

> **Player**: "Mercer, you're under arrest. Security, restrain him now."

**Mechanics:**
- Mercer arrested before he can escalate
- Dead man's switch triggers (attack accelerates slightly)
- Must resolve technical challenges without his input
- Ethical, safe, harder technical path

**Mercer's Response:**
> "You're making a mistake, Agent. Only I know where all the backdoors are. But sure, do it your way. Good luck."

**Debrief Impact**:
> **Agent 0x99**: "Clean arrest. Mercer is in federal custody. The dead man's switch complicated things, but you handled it. Professional work under pressure."

---

**Option B: Force Cooperation**

> **Player**: "Help me stop this attack, Mercer. Now. Or I ensure you're charged with terrorism and 2 million counts of attempted manslaughter."

**Mechanics:**
- Coerced cooperation
- Mercer provides technical assistance
- Easier technical challenges
- Morally grey approach
- Mercer may sabotage if not watched

**Mercer's Response:**
> "Threatening me? Fine. I'll help. But this proves my point—even your agency uses force when systems fail. Chaos just beneath the order."

**Debrief Impact**:
> **Agent 0x99**: "Effective, if... aggressive. Coercing a terrorist to help fix his own attack. Creative problem-solving, questionable ethics. But 2 million people still have power."

---

**Option C: Negotiate/Recruit**

> **Player**: "Mercer, Critical Mass is using you. You reported these vulnerabilities—you wanted them fixed. Help me prove that's still possible. Work with us."

**Mechanics:**
- Requires evidence of Mercer's original warnings
- Appeal to his original intentions
- Can flip him against Critical Mass
- Highest difficulty social engineering
- Success: Ongoing asset, complete intelligence
- Failure: He refuses, leads to Option A or B

**Mercer's Response (Success):**
> "I... You read my reports. Three years ago. Before Critical Mass found me. Before I gave up on the system. Maybe... maybe it's not too late to fix this the right way."

**Mercer's Response (Failure):**
> "Nice try, Agent. But I chose this path with eyes open. The system can't be fixed from inside. Entropy is inevitable."

**Debrief Impact (Success)**:
> **Agent 0x99**: "Extraordinary. You recruited Blackout. Critical Mass cell leader. He's providing complete intelligence on their infrastructure targeting methodology. This is... unprecedented. Well done."

---

**Option D: Combat/Forceful Shutdown**

> **Player**: *Physically restrains Mercer and manually shuts down his systems*

**Mechanics:**
- Combat encounter (brief, Mercer is engineer not fighter)
- Immediate shutdown of his access
- Dead man's switch activates (attack worsens)
- Must resolve all technical challenges under maximum pressure
- Fastest resolution but hardest technical path

**Debrief Impact**:
> **Agent 0x99**: "Decisive action. Mercer neutralized, systems secured, grid stable. The use of force was... justified given the crisis. Effective crisis response, Agent."

---

### Mission Completion States

**Perfect Success:**
- All substations operational
- Zero service interruptions
- Mercer arrested or recruited
- Complete evidence collected
- SCADA Queen connection severed

**Good Success:**
- Minimal outages (< 10,000 affected)
- Grid stabilized
- Mercer dealt with
- Evidence secured

**Partial Success:**
- Significant outages but no cascade
- Grid ultimately stable
- Mercer arrested
- Some evidence lost

**Failure (Rare, requires very poor choices):**
- Regional blackout
- Cascading failures
- Mercer escapes in chaos
- Mission failure

---

### Act 3 Objectives

**Primary:**
- ☐ Stop final attack sequence
- ☐ Prevent grid cascade
- ☐ Deal with Mercer/Blackout
- ☐ Secure all SCADA systems
- ☐ Neutralize remote access (SCADA Queen)

**Bonus:**
- ★ Zero outages
- ★ Recruit Mercer as asset
- ★ Identify SCADA Queen's location
- ★ Recover all Critical Mass attack tools
- ★ Preserve evidence for prosecution

---

## Post-Mission: Debrief Variations

### Ending A: Perfect Defense

> **Agent 0x99**: "Incredible work, Agent 0x00. Zero casualties, zero service interruptions, grid completely stable, and Blackout in custody. 2 million people have power tonight because of you—and they'll never know how close they came."
>
> **Director Netherton**: "Textbook emergency response under unprecedented pressure. Lives saved, infrastructure protected, ENTROPY cell leader captured. Commendation logged."
>
> **Agent 0x99**: "Mercer is cooperating. His technical knowledge of infrastructure vulnerabilities is... concerning and valuable. He's identified six other grids with similar weaknesses. We're moving to secure them. I'm updating your specialization in ICS/SCADA Security and Incident Response."

---

### Ending B: Minimal Casualties

> **Agent 0x99**: "Grid is stable, Agent. We lost Substation 7—about 8,000 people without power for the next few hours. But you prevented the cascade. 1.99 million people still have electricity. That's a win."
>
> **Director Netherton**: "Acceptable losses given the timeline and scope. Critical Mass tested our response capabilities. You proved we can adapt and defend under pressure."
>
> **Agent 0x99**: "Mercer is in federal custody. Critical Mass lost a cell leader and their attack failed. The substations can be restored within 6 hours. Your work under pressure was solid."

---

### Ending C: Recruited Asset

> **Agent 0x99**: "You flipped Blackout. A Critical Mass cell leader. Agent, do you understand the intelligence value here?"
>
> **Director Netherton**: "Per Section 19, Paragraph 7: You are now responsible for this asset. Mercer will assist in securing infrastructure vulnerabilities while under SAFETYNET supervision. Risky. Bold. Potentially brilliant."
>
> **Agent 0x99**: "Mercer is providing complete infrastructure attack methodologies. We're learning how Critical Mass identifies targets, develops exploits, and times attacks. This could protect thousands of installations. Well done."

---

### Ending D: Hard-Won Victory

> **Agent 0x99**: "Grid is stable. Mercer is in custody. But we took damage—substations 7, 12, and 19 offline, about 50,000 people in the dark. The attack was stopped, but at a cost."
>
> **Director Netherton**: "The cascade was prevented. That was priority one. The local outages are inconvenient but manageable. Emergency services have backup power. You made hard calls under pressure."
>
> **Agent 0x99**: "Critical Mass demonstrated sophisticated SCADA capabilities. This was their largest operation yet. You stopped them, but they proved they could threaten major infrastructure. We need to take them seriously."

---

### Universal Closing

> **Agent 0x99**: "One more thing, Agent. We traced the remote access connection—SCADA Queen was operating from a Critical Mass safe house in [location]. Local authorities raided it, but she'd already evacuated. She's still out there."
>
> **Agent 0x99**: "Mercer's interrogation revealed this was a test. Critical Mass is mapping vulnerabilities across national infrastructure. Power grids, water systems, transportation networks—they're systematically identifying weaknesses. This wasn't about one blackout. It was about proving they COULD cause blackouts at will."
>
> **Agent 0x99**: "The Architect sent Mercer a message before the operation: 'Demonstrate fragility. Society's order is maintained by infrastructure they take for granted. Show them how thin that line is.' They're not trying to destroy civilization—they're trying to destabilize trust in it."
>
> **Agent 0x99**: "We're coordinating with infrastructure security across the country. Your work here created a defensive playbook. Rest up, Agent. Critical Mass won't stop with one failed operation."

---

## Educational Summary

### CyBOK Areas Covered

**ICS/SCADA Security:**
- Understanding industrial control systems
- SCADA control logic analysis
- Safety system principles
- Operational constraints vs security
- Load balancing and grid operations

**Incident Response:**
- Real-time threat assessment
- Triage under pressure
- Evidence collection during active defense
- Coordination with facility staff
- Post-incident analysis

**Network Security:**
- Traffic analysis and forensics
- Identifying command & control
- Network segmentation
- Access control
- Backdoor detection and removal

**Security Operations:**
- Log analysis across multiple systems
- Timeline reconstruction
- Insider threat detection
- Physical + cyber security convergence
- Crisis decision-making

### Learning Objectives

Players will:
1. Understand ICS/SCADA security principles and constraints
2. Practice incident response under time pressure
3. Learn to correlate evidence across multiple systems
4. Experience insider threat investigation in critical environment
5. Navigate ethical dilemmas with real-world consequences (service interruptions)
6. Apply comprehensive security knowledge in integrated scenario

---

## Implementation Notes

### Time Pressure Mechanic

**90-Minute Countdown:**
- Displayed prominently
- Accelerates during certain player actions
- Creates genuine tension
- Can be paused for complex puzzles (but acknowledged in-game as "time passing")

### SCADA Simulation

**Authentic but Accessible:**
- Based on real SCADA systems
- Simplified for gameplay
- Teaches real concepts
- Visually represents grid status

### Difficulty Scaling

**Advanced Scenario Elements:**
- Multiple simultaneous threats
- Time pressure throughout
- Technical complexity (SCADA systems)
- High stakes (millions affected)
- Insider threat complication
- Remote attacker (SCADA Queen)

**Accessibility:**
- Hints available (Operations Manager can provide guidance)
- Not all bonus objectives required
- Multiple paths to success
- Can sacrifice some objectives for others

---

*Grid Down demonstrates defensive operations and infrastructure security scenarios. The time pressure, high stakes, and technical complexity create an intense educational experience teaching ICS/SCADA security, incident response, and the real-world consequences of cybersecurity failures in critical infrastructure.*
