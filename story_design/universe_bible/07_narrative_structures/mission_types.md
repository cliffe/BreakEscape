# Mission Types

## Overview
Break Escape scenarios follow distinct mission type patterns, each with unique gameplay loops, pacing, and educational focus. Understanding these mission types helps designers create varied experiences while maintaining structural coherence. Each type emphasizes different aspects of cybersecurity education and provides different gameplay experiences.

---

## Type 1: Infiltration & Investigation

**Core Loop**: Gain access → Investigate → Gather evidence → Expose ENTROPY

**Difficulty Range**: Beginner to Advanced

**Typical Duration**: 45-75 minutes

### Structure

**Act 1: Entry** (15-20 min)
- Begin outside facility or at reception
- Establish cover story (security audit, new employee, consultant)
- Initial access through social engineering or provided credentials
- First impressions of organization
- Identify 2-3 locked areas creating exploration goals

**Act 2: Investigation** (20-30 min)
- Progressive access through security layers
- Evidence scattered throughout multiple rooms
- Backtracking required (clues in Room A unlock Room B, return to Room A)
- NPC interactions reveal suspicious behaviors
- Pattern emerges: something is very wrong here
- Revelation: Discover ENTROPY involvement

**Act 3: Confrontation** (10-15 min)
- Confront insider threat or prevent imminent attack
- Player choices determine approach (expose, arrest, exploit, combat)
- Final objectives completable regardless of approach
- Escape or mission wrap-up
- Evidence secured for debrief

### Example Scenarios

**Corporate Data Exfiltration**
- **Setting**: Mid-size tech company
- **Cover**: Security consultant hired to assess systems
- **Evidence**: Encrypted files being uploaded to suspicious servers
- **ENTROPY Connection**: CTO is cell member stealing IP
- **Climax**: Confront CTO with evidence, multiple resolution options

**Research Facility Compromise**
- **Setting**: University research department
- **Cover**: Visiting researcher credential audit
- **Evidence**: Graduate students unknowingly recruited as mules
- **ENTROPY Connection**: Post-doc is handler recruiting students
- **Climax**: Expose recruitment operation, save students

**Financial Institution Insider Trading**
- **Setting**: Investment bank
- **Cover**: Compliance audit
- **Evidence**: Suspicious trading patterns, communications
- **ENTROPY Connection**: Analyst manipulating markets for profit + chaos
- **Climax**: Prevent major market manipulation event

### Key Elements

**Multi-Room Progression**
- 8-12 rooms typically
- Hub-and-spoke or layered access patterns
- Fog of war reveals space progressively
- At least 2-3 major backtracking opportunities

**Layered Physical and Digital Security**
- **Physical**: Locked doors, badge readers, biometrics
- **Digital**: Password-protected computers, encrypted files, network access
- **Social**: NPCs guarding information or access
- **Combined**: Physical key unlocks drawer containing password, etc.

**NPC Social Engineering Opportunities**
- Receptionist provides building intel
- IT staff can be befriended for tools/access
- Suspicious employee's behavior gives them away
- Helpful NPC becomes ally
- ENTROPY operative tries to mislead

**Evidence Collection Objectives**
- Find 5-7 pieces of evidence proving ENTROPY involvement
- Evidence types: emails, documents, encrypted files, logs, photos
- Some required, some optional (bonus objectives)
- Culminates in undeniable proof for confrontation

### Educational Focus
- **Human Factors**: Social engineering, trust relationships
- **Security Operations**: Evidence gathering, investigation methodology
- **Applied Cryptography**: Decrypting discovered files
- **Network Security**: Identifying suspicious traffic
- **Malware & Attack Technologies**: Recognizing attack indicators

### Design Considerations

**Pacing**
- Start slow (establish context, allow exploration)
- Build tension (evidence accumulates, pattern emerges)
- Accelerate (discovery moment, urgency increases)
- Climax (confrontation, resolution)

**Player Agency**
- Multiple paths to required evidence
- Optional evidence enriches but not required
- Approach flexibility (stealth, social engineering, technical)
- Confrontation resolution varies based on evidence gathered

**Replayability**
- Different evidence discovery order creates varied narrative experience
- NPC interactions change based on player approach
- Multiple confrontation resolutions
- Speedrun potential for mastery players

---

## Type 2: Deep State Investigation

**Core Loop**: Identify dysfunction → Investigate anomalies → Trace to infiltrators → Expose network

**Difficulty Range**: Intermediate to Advanced

**Typical Duration**: 60-90 minutes

### Structure

**Act 1: Something's Wrong** (20-25 min)
- Systems mysteriously failing or delayed
- Bureaucratic nightmares blocking critical operations
- Appears to be incompetence or underfunding
- Player brought in to investigate "inefficiency"
- Initial assumption: just bad management

**Act 2: It's Not Incompetence** (25-35 min)
- Investigation reveals patterns, not accidents
- Multiple "coincidental" failures at critical moments
- Behavioral analysis of "boring" employees
- Document analysis reveals coordination
- Revelation: This is deliberate sabotage
- Multiple infiltrators working together

**Act 3: Exposing the Network** (15-20 min)
- Identify all coordinated actors
- Gather evidence of deliberate actions
- Expose network without causing chaos
- Must prove malice vs. incompetence (legal/political challenge)
- Organization stabilization

### Example Scenarios

**Regulatory Body Weaponized**
- **Setting**: Government permit office
- **Dysfunction**: Critical infrastructure permits delayed indefinitely
- **Investigation**: Approval process mysteriously blocked
- **ENTROPY Network**: 3-4 employees coordinating delays
- **Climax**: Expose coordinated sabotage while preserving agency function

**Civil Service Cascade**
- **Setting**: County government offices
- **Dysfunction**: Multiple departments failing simultaneously
- **Investigation**: Pattern of key employees out sick/on leave at critical times
- **ENTROPY Network**: Sleeper cell activating for major operation
- **Climax**: Prevent complete government paralysis

**University Administration**
- **Setting**: Large university administrative offices
- **Dysfunction**: Critical research funding mysteriously denied/delayed
- **Investigation**: Targeting specific research (quantum, crypto, AI)
- **ENTROPY Network**: Administrators blocking rival research to advantage ENTROPY-friendly projects
- **Climax**: Expose academic espionage network

### Key Elements

**Detective Work and Pattern Recognition**
- Analyze failure timelines
- Cross-reference multiple incidents
- Identify common factors
- Statistical anomaly recognition
- Behavioral pattern analysis

**Navigating Bureaucratic Systems**
- Understanding organizational hierarchies
- Following paper trails
- Procedure and policy research
- Regulatory compliance documentation
- Jurisdictional complexity

**Behavioral Analysis of "Boring" Employees**
- Interviews reveal inconsistencies
- Work patterns show suspicious timing
- Personal backgrounds don't match records
- Communication patterns between suspects
- Psychological profiling

**Document Analysis and Audit Trails**
- Access logs (who accessed what, when)
- Email communications (coded language)
- Approval histories (pattern of denials)
- Financial records (unexplained payments)
- Personnel files (background check gaps)

**Evidence Buried in Legitimate Procedures**
- Sabotage disguised as policy enforcement
- Delays hidden in bureaucratic process
- Coordination masked as coincidence
- Requires understanding normal process to spot abnormal

**Multiple Suspects, Coordinated Activity**
- Not single rogue employee
- Network of 3-5 actors
- Each has limited role (compartmentalization)
- Must identify entire network, not just one person
- Removing one doesn't solve problem

### Educational Focus
- **Insider Threat Detection**: Behavioral indicators, access abuse
- **Behavioral Analysis**: Profiling, pattern recognition
- **Audit Trail Investigation**: Log analysis, forensic timeline construction
- **Access Control**: Least privilege violations, privilege creep
- **Background Checks**: Vetting processes, ongoing monitoring
- **Institutional Security**: Organizational risk management

### Design Notes

**Lower Action, Higher Investigation**
- More document reading than lock-picking
- Emphasis on analysis over execution
- Slower pace, cerebral challenges
- Reward careful observation

**NPCs Appear Mundane (Realistic)**
- Not stereotypical villains
- Blend into bureaucratic environment
- Behavior is subtly wrong, not obviously evil
- Player must distinguish incompetence from malice

**Evidence is Procedural and Systematic**
- Build case methodically
- Legal/administrative standard of proof
- Can't just "know" they're guilty - must prove it
- Documentation critical

**Moral Complexity: Dysfunction vs. Exposure**
- Exposing network may worsen short-term dysfunction
- Some employees may be coerced (blackmailed), not volunteers
- Organizational reputation damage
- Public trust implications
- Balancing security with operational continuity

**Unique Challenge: Proving Malice vs. Incompetence**
- Must demonstrate intent (legal threshold)
- Coordination evidence critical (proves not coincidence)
- Pattern analysis (statistical improbability)
- This is genuinely hard - reflects real-world challenge

---

## Type 3: Incident Response

**Core Loop**: Assess damage → Identify attack vector → Trace intrusion → Prevent further damage

**Difficulty Range**: Intermediate to Advanced

**Typical Duration**: 45-60 minutes (time pressure mechanic)

### Structure

**Act 1: Damage Assessment** (10-15 min)
- Called in after breach discovered
- Systems already compromised
- Immediate triage (what's affected, what's at risk)
- Establish baseline understanding
- Identify attack is ongoing

**Act 2: Investigation Under Pressure** (20-30 min)
- Analyze logs and forensics
- Identify attack vectors (how they got in)
- Trace intrusion path (where they are now)
- Discover persistence mechanisms (how they stay in)
- Race against attacker's progress
- Partial system access (some systems down/encrypted)

**Act 3: Containment and Prevention** (15 min)
- Stop ongoing attack
- Remove attacker access
- Prevent data exfiltration or destruction
- Secure compromised systems
- Evidence preservation for investigation

### Example Scenarios

**Ransomware in Progress**
- **Setting**: Hospital or critical business
- **Breach**: Encryption spreading through network
- **Investigation**: Find patient zero, identify ransomware variant
- **Pressure**: Critical systems going offline progressively
- **Climax**: Stop encryption spread, recover files vs. pay ransom decision

**Active Data Exfiltration**
- **Setting**: Research facility
- **Breach**: Terabytes of data being uploaded
- **Investigation**: Identify C2 server, trace backdoor installation
- **Pressure**: Most valuable data being stolen first
- **Climax**: Cut off exfiltration, secure remaining data

**Critical Infrastructure Compromise**
- **Setting**: Power grid control center
- **Breach**: SCADA systems manipulated
- **Investigation**: Identify attack vector, extent of compromise
- **Pressure**: Physical damage imminent if not stopped
- **Climax**: Regain control, prevent equipment destruction

**Supply Chain Attack Discovery**
- **Setting**: Software company
- **Breach**: Update mechanism compromised
- **Investigation**: Backdoor in legitimate update
- **Pressure**: Customers already infected
- **Climax**: Halt update distribution, warn customers

### Key Elements

**VM-Heavy Challenges**
- Access compromised systems through forensics VM
- Analyze malware samples safely
- Examine logs and network traffic
- Reverse engineer attack tools
- Memory forensics

**Log Analysis and Forensics**
- System logs (Windows Event Logs, syslog)
- Network traffic captures (packet analysis)
- Application logs (web servers, databases)
- Timeline reconstruction
- Indicator of Compromise (IOC) identification

**Damaged/Encrypted Systems**
- Some resources unavailable
- Partial access (view but not modify)
- Encrypted files (must decrypt or find backups)
- Corrupted data (forensic recovery)
- Offline systems (physical access only)

**Race Against Time Mechanic**
- Timer until next stage of attack
- Progressive damage visualization
- Urgency through narrative (NPCs panicking)
- Optional: Actual timer countdown
- Consequences for delay (more damage, harder recovery)

### Educational Focus
- **Incident Response**: NIST framework, triage methodology
- **Digital Forensics**: Evidence collection, chain of custody
- **Malware Analysis**: Behavioral analysis, reverse engineering basics
- **Log Analysis**: SIEM concepts, timeline reconstruction
- **Network Security**: Traffic analysis, C2 identification
- **Business Continuity**: Backup importance, disaster recovery

### Design Considerations

**Time Pressure Without Frustration**
- Generous timers (pressure, not panic)
- Clear progress indicators
- Save states before critical moments
- Alternative solutions if primary path blocked
- Can't softlock into failure

**Balancing Technical Depth**
- Realistic concepts simplified for gameplay
- Tool use abstracted (automated analysis with player interpretation)
- Focus on understanding, not executing technical details
- Guidance available (hints, helper NPCs)

**Partial Information**
- Not all logs available (deleted, corrupted)
- Attacker covering tracks
- Incomplete picture (educated guessing required)
- Multiple hypotheses possible
- Reflects real incident response challenges

---

## Type 4: Penetration Testing

**Core Loop**: Audit security → Document vulnerabilities → Exploit weaknesses → Report findings

**Difficulty Range**: Beginner to Intermediate

**Typical Duration**: 45-60 minutes

### Structure

**Act 1: Authorized Assessment Begins** (15-20 min)
- Contracted security assessment
- Rules of engagement established
- Test multiple security layers methodically
- Document everything discovered
- Professional, by-the-book approach

**Act 2: Discovery of Real Threats** (20-25 min)
- During testing, discover evidence of actual breach
- What started as simulation becomes real investigation
- Optional twist: Discover ENTROPY presence
- Shift from test to genuine threat response
- Balancing pen test objectives with incident response

**Act 3: Report and Response** (10-15 min)
- Complete security assessment
- Address discovered real threat
- Comprehensive report including ENTROPY evidence
- Client organization's reaction
- Implications of findings

### Example Scenarios

**Pre-Acquisition Security Audit**
- **Setting**: Target company for acquisition
- **Authorized Goal**: Assess security posture for valuation
- **Discovery**: Company already compromised by ENTROPY
- **Twist**: Acquisition target may be ENTROPY front
- **Climax**: Report findings, prevent acquisition or expose ENTROPY operation

**Compliance Testing Gone Wrong**
- **Setting**: Healthcare provider
- **Authorized Goal**: HIPAA compliance assessment
- **Discovery**: Patient data actively being exfiltrated
- **Twist**: "Compliance consultant" is ENTROPY
- **Climax**: Stop breach, secure patient data, restore compliance

**Red Team Exercise Becomes Real**
- **Setting**: Financial institution
- **Authorized Goal**: Simulate attack for training
- **Discovery**: Actual attackers using red team activity as cover
- **Twist**: Real and simulated attacks happening simultaneously
- **Climax**: Distinguish real from simulation, stop actual attack

### Key Elements

**Structured Testing Methodology**
- Follow recognized framework (PTES, OWASP, etc. simplified)
- Document each test and result
- Professional report format
- Ethical boundaries maintained
- Client communication throughout

**Multiple Vulnerability Types**
- Physical security weaknesses
- Technical vulnerabilities (network, system, application)
- Social engineering susceptibility
- Policy and procedure gaps
- Configuration errors

**Educational Focus on Proper Pen Testing**
- Authorization critical (always have permission)
- Scope definition (what's in/out of bounds)
- Documentation importance (clients need reports)
- Ethical considerations (responsible disclosure)
- Professional conduct (you're being paid to break things carefully)

**Surprise Revelation of Real Threats**
- Legitimate testing uncovers actual compromise
- Player must shift mindset (test → incident response)
- Ethical dilemma (complete paid test vs. address real threat)
- Client may not believe you (crying wolf problem)

### Educational Focus
- **Penetration Testing**: Methodology, tools, ethics
- **Vulnerability Assessment**: Identifying weaknesses systematically
- **Risk Assessment**: Prioritizing findings by impact
- **Reporting**: Communicating technical findings to management
- **Professional Ethics**: Responsible disclosure, authorization
- **Security Operations**: Defense in depth, layered security

### Design Notes

**Balancing Structure and Discovery**
- Pen test provides structure (checklist of tests)
- Discovery element prevents pure checklist gameplay
- Maintains educational value of systematic approach
- Surprise keeps engagement high

**Professional Tone**
- More formal than other mission types
- Player is consultant, not spy
- Client relationship matters
- Reputation at stake

**Twist Timing**
- Reveal real threat around 30-40% through mission
- Early enough to matter, late enough to establish pen test
- Clear shift in tone and objectives
- Player must adapt quickly

---

## Type 5: Defensive Operations

**Core Loop**: Defend location → Identify attackers → Secure vulnerabilities → Trace attack source

**Difficulty Range**: Intermediate to Advanced

**Typical Duration**: 45-75 minutes

### Structure

**Act 1: Alert and Initial Response** (10-15 min)
- Begins with alert or attack in progress
- Immediate threats require response
- Assess situation (what's under attack, who's attacking)
- Prioritize protection targets
- Establish defensive position

**Act 2: Active Defense** (25-35 min)
- Protect critical assets while investigating
- Identify attack vectors during defense
- Make triage decisions (can't save everything)
- Discover attacker methodology
- Trace attack back to source

**Act 3: Counterattack and Trace** (10-15 min)
- Secure immediate threats
- Follow attack back to ENTROPY source
- Optional: Turn defense into offensive operation
- Prevent future attacks
- Assess damage and recovery needs

### Example Scenarios

**SAFETYNET Facility Under Attack**
- **Setting**: Field office or safe house
- **Threat**: ENTROPY discovered location, direct assault
- **Objective**: Protect intelligence and personnel
- **Twist**: Mole revealed (how did ENTROPY find location?)
- **Climax**: Repel attack, evacuate compromised facility

**Protecting Witness or Asset**
- **Setting**: Safe house with protected informant
- **Threat**: ENTROPY hunting witness before testimony
- **Objective**: Keep witness alive until extraction
- **Twist**: Witness has information even SAFETYNET didn't know about
- **Climax**: Successful extraction or last stand

**Critical Infrastructure Defense**
- **Setting**: Power plant, water facility, data center
- **Threat**: Coordinated ENTROPY cyber-physical attack
- **Objective**: Prevent damage to critical systems
- **Twist**: Multiple attack vectors (digital + physical)
- **Climax**: Stop attack, maintain service continuity

**Data Destruction Prevention**
- **Setting**: Company under attack
- **Threat**: ENTROPY wiping evidence of their operations
- **Objective**: Preserve evidence while under attack
- **Twist**: Must choose what to save (can't save everything)
- **Climax**: Secure critical evidence, trace attackers

### Key Elements

**Time-Sensitive Objectives**
- Multiple threats with timers
- Prioritization required (can't do everything)
- Consequences for delays
- Dynamic situation (threats evolve)

**Multiple Simultaneous Threats**
- Digital attacks (network, systems)
- Physical attacks (infrastructure, personnel)
- Social attacks (manipulation, misdirection)
- Must address all fronts

**Resource Management**
- Limited tools or personnel
- Triage decisions matter
- Some losses inevitable (perfect defense impossible)
- Prioritize high-value targets

**Reactive Rather Than Proactive Gameplay**
- Responding to attacker's moves
- Less investigation, more action
- Quick decision-making
- Adaptation under pressure

### Educational Focus
- **Incident Response**: Triage, containment, recovery
- **Defensive Security**: Layered defense, fail-safes
- **Crisis Management**: Decision-making under pressure
- **Business Continuity**: Protecting critical functions
- **Threat Intelligence**: Understanding attacker methodology
- **Physical Security**: Perimeter defense, access control

### Design Notes

**Balancing Action and Strategy**
- Not purely combat (this isn't a shooter)
- Strategic decisions matter more than reflexes
- Planning and adaptation rewarded
- Multiple valid strategies

**Preventing Overwhelming Player**
- Clear priorities communicated
- Guidance from NPCs (but player decides)
- Save points before major decision moments
- No single failure causes complete loss

**Making Losses Meaningful**
- Can't save everything (realistic)
- Choices have consequences
- Saved assets matter in debrief
- Player feels weight of decisions

---

## Type 6: Double Agent / Undercover

**Core Loop**: Maintain cover → Gain insider access → Collect intelligence → Avoid detection

**Difficulty Range**: Advanced

**Typical Duration**: 60-90 minutes

### Structure

**Act 1: Establishing Cover** (20-25 min)
- Deep cover operation explained
- Must perform legitimate work convincingly
- Building trust with NPCs
- Secretcollection begins carefully
- Balancing dual objectives

**Act 2: Deeper Infiltration** (25-35 min)
- Access increases with earned trust
- Intelligence gathering accelerates
- Risk of detection increases
- Moral complexity (befriending targets)
- Suspicious moments (close calls)

**Act 3: Extraction or Exposure** (15-20 min)
- Mission concludes (planned or forced)
- Cover may be blown (choices determine)
- Confrontation or escape
- Revealed relationships matter
- Consequences of deception

### Example Scenarios

**Infiltrating ENTROPY Front Company**
- **Setting**: "TotallyLegit Consulting Inc."
- **Cover**: New hire, skilled hacker
- **Goal**: Document ENTROPY operations
- **Risk**: Actual ENTROPY recruiters assessing you
- **Climax**: Extract before cover blown, or flip the operation

**Undercover at Compromised Organization**
- **Setting**: Tech company with ENTROPY infiltration
- **Cover**: New employee in suspicious department
- **Goal**: Identify ENTROPY operatives
- **Risk**: ENTROPY suspects security audit
- **Climax**: Expose ENTROPY cell without revealing SAFETYNET operation

**Recruitment by ENTROPY (Double-Double Agent)**
- **Setting**: Dark web marketplace or ENTROPY recruitment
- **Cover**: Disgruntled security professional
- **Goal**: Get recruited to learn cell structure
- **Risk**: Tests of loyalty (unethical requests)
- **Climax**: Provide intelligence while extracting safely

### Key Elements

**Dual Objectives**
- Appear legitimate (maintain cover)
- Secret goals (gather intelligence)
- Must succeed at both
- Failure at either blows mission

**Trust Management with NPCs**
- Build relationships carefully
- Track trust levels with multiple characters
- Too suspicious = cover blown
- Too friendly = moral complications

**Consequences for Suspicious Behavior**
- NPCs notice inconsistencies
- Questions asked about background
- Tests of loyalty
- Increasing scrutiny

**Cover Story Maintenance**
- Consistent backstory
- Perform expected duties
- Avoid knowledge you shouldn't have
- Social engineering turned inward

### Educational Focus
- **Social Engineering**: Long-term manipulation, trust exploitation
- **Operational Security**: Cover story consistency, tradecraft
- **Human Factors**: Psychology, relationship building
- **Ethics**: Moral implications of deception
- **Counterintelligence**: Recognizing when you're being tested
- **Risk Management**: Balancing intelligence value vs. exposure risk

### Design Notes

**Moral Complexity**
- Befriending people you'll betray
- Some targets may be sympathetic
- Emotional weight of deception
- No easy answers

**Tension Through Relationship**
- NPCs you care about (by design)
- Revealing truth will hurt them
- Player feels consequences of choices
- More than abstract mission

**Pacing Matters**
- Slow burn (can't rush trust)
- Mounting tension (closer to discovery)
- Multiple close calls
- Earned access feels rewarding

**Multiple Endings Based on Trust**
- High trust with NPCs: painful betrayal reveal or recruitment possibility
- Low trust: suspected throughout, harder intelligence gathering
- Blown cover: emergency extraction or improvisation
- Perfect operation: extract without ever being suspected

---

## Type 7: Rescue / Extraction

**Core Loop**: Locate target → Plan extraction → Overcome security → Safely extract

**Difficulty Range**: Intermediate to Advanced

**Typical Duration**: 45-60 minutes

### Structure

**Act 1: Infiltration** (15-20 min)
- Asset or agent in danger
- Must locate in hostile environment
- Navigate security to reach target
- Gather information about captors
- Plan extraction route

**Act 2: Contact and Preparation** (15-20 min)
- Reach target
- Assess their condition
- Determine extraction options
- Prepare route (disable alarms, open paths)
- Timing is critical

**Act 3: Extraction** (15-20 min)
- Escape with target
- Security heightened after discovery
- Protect vulnerable target
- Multiple obstacles on exit
- Safe extraction or emergency backup

### Example Scenarios

**Extract Compromised Agent**
- **Setting**: ENTROPY facility
- **Threat**: Agent captured, interrogation imminent
- **Objective**: Rescue before intelligence compromised
- **Complication**: Agent injured, can't move quickly
- **Climax**: Fighting extraction or stealth escape

**Rescue Kidnapped Researcher**
- **Setting**: Secure ENTROPY location
- **Threat**: Researcher forced to work for ENTROPY
- **Objective**: Rescue researcher, prevent knowledge transfer
- **Complication**: Researcher conflicted (Stockholm syndrome, threatened family)
- **Climax**: Convince researcher to leave, overcome obstacles

**Secure Witness Before ENTROPY**
- **Setting**: Witness's workplace or home
- **Threat**: ENTROPY hit team en route
- **Objective**: Reach witness first, get them to safety
- **Complication**: Witness doesn't know they're target, won't trust easily
- **Climax**: Convince witness, evade ENTROPY, reach safe house

**Recover Stolen Intelligence**
- **Setting**: ENTROPY facility or fence
- **Threat**: Critical data or prototype stolen
- **Objective**: Recover asset before sold/used
- **Complication**: Asset's value means heavy security
- **Climax**: Secure asset, escape with it intact

### Key Elements

**Two-Phase Structure**
- Phase 1: Infiltrate to reach target (solo operation)
- Phase 2: Extract with target (escort mission)
- Different challenges each phase
- Return route differs from entry

**Escort Mechanics**
- Target follows player
- May be injured (slower movement)
- May be frightened (unreliable)
- May be asset (device to carry)
- Protection required

**Heightened Security After Target Located**
- Alarms may trigger
- Guards on alert
- Patrols increased
- Escape harder than entry
- Time pressure intensifies

**Multiple Exit Strategies**
- Primary route (ideal but risky)
- Secondary route (safer but longer)
- Emergency extraction (SAFETYNET backup)
- Improvised (create own exit)
- Consequences vary by choice

### Educational Focus
- **Operational Planning**: Route planning, contingencies
- **Physical Security**: Perimeter defense, access control
- **Risk Management**: Balancing speed vs. stealth
- **Crisis Management**: Adaptation when plans fail
- **Human Factors**: Gaining trust under pressure
- **Incident Response**: Emergency procedures, backup plans

### Design Notes

**Escort Without Frustration**
- AI companion reasonably smart
- Player can give basic commands
- Target doesn't actively sabotage mission
- Failure is player error, not AI stupidity

**Asymmetric Difficulty**
- Entry is standard difficulty
- Extraction is harder (time pressure, escort, alerts)
- Creates escalation naturally
- Rewards careful entry planning

**Emotional Stakes**
- Target is person (not just objective)
- Dialogue humanizes them
- Their fear/relief feels real
- Player cares about success

**Multiple Resolution Paths**
- Stealthy extraction (ideal)
- Fighting retreat (more action)
- Emergency evacuation (SAFETYNET backup)
- Negotiated release (unusual but possible)
- Each has different consequences

---

## Mission Type Design Framework

### Choosing Mission Type for Scenario

Consider:
1. **Educational objectives** - Which CyBOK areas?
2. **Difficulty level** - Target audience skill
3. **Desired pacing** - Action vs. investigation
4. **Tone** - Serious, absurd, horror, etc.
5. **Location type** - What setting?
6. **ENTROPY cell** - Which cell's methods?
7. **Variety** - Balance across campaign

### Hybridizing Mission Types

Pure types are rare - most scenarios blend:
- **Infiltration + Incident Response**: Discover breach during investigation
- **Pen Test + Defensive**: Test turns into defending against real attack
- **Investigation + Rescue**: Locate ENTROPY base to rescue agent
- **Undercover + Infiltration**: Deep cover operation during investigation

### Pacing Across Mission Types

| Type | Pacing | Action:Investigation Ratio |
|------|--------|----------------------------|
| Infiltration & Investigation | Moderate, building | 40:60 |
| Deep State Investigation | Slow, cerebral | 20:80 |
| Incident Response | Fast, urgent | 60:40 |
| Penetration Testing | Structured, steady | 50:50 |
| Defensive Operations | Very fast, reactive | 70:30 |
| Double Agent / Undercover | Slow burn, tense | 30:70 |
| Rescue / Extraction | Fast, escalating | 65:35 |

---

## Conclusion

Mission types provide structural frameworks that guide scenario design while allowing creative variation. By understanding the core loops, pacing, and educational focus of each type, designers can create cohesive missions that teach cybersecurity concepts through engaging gameplay.

The best scenarios often blend multiple mission types, using structure as foundation while allowing story and player choice to create unique experiences.

Every mission type should answer: **"What does the player learn, and how does the structure support that learning?"**
