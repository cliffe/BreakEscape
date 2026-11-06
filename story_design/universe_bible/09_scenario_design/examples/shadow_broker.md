# Operation Shadow Broker - Complete Scenario

## Scenario Overview

**Type**: Infiltration & Investigation
**Difficulty**: Intermediate
**Playtime**: 60 minutes
**CyBOK Areas**: Applied Cryptography (AES), Human Factors (Social Engineering), Security Operations

**Organization Type**: Infiltrated (Nexus Consulting is a legitimate cybersecurity firm)
**ENTROPY Cell**: Zero Day Syndicate
**Primary Villain**: Head of Security (double agent, reveals as ENTROPY operative - Tier 3)
**Background Villain**: "0day" (Tier 2 Cell Leader, referenced as buyer of stolen vulnerabilities)
**Supporting**: Most employees are innocent; 1-2 may be compromised or unwitting accomplices

## Scenario Premise

Nexus Consulting is a legitimate cybersecurity firm with real clients and mostly innocent employees. However, their Head of Security has been corrupted by ENTROPY's Zero Day Syndicate and is selling client vulnerability assessments on the dark web. Most employees have no idea, though one or two may have been manipulated into helping without understanding the full scope.

---

## Pre-Mission: Briefing

### HQ Mission Briefing

**Location**: SAFETYNET HQ
**Handler**: Agent 0x99
**Duration**: 2-3 minutes

> **Agent 0x99**: "Agent 0x00, we have a situation at Nexus Consulting, a cybersecurity firm downtown. Ironic, right? Someone from inside their company contacted us anonymously, claiming there's a data broker selling client vulnerability assessments on the dark web."
>
> **Agent 0x99**: "Intelligence suggests this is connected to ENTROPY's Zero Day Syndicate—they've been buying vulnerability intel from corrupt security professionals. Here's the catch: Nexus itself is legitimate. Real company, real clients, mostly innocent employees. But someone inside is ENTROPY."
>
> **Agent 0x99**: "Your cover: you're conducting a routine compliance audit they scheduled months ago. Your real mission: identify the insider, secure evidence, and determine the extent of ENTROPY's infiltration. Most people there are innocent—don't spook them. But be careful: security professionals are hard to fool."
>
> **Director Netherton**: "Per Section 7, Paragraph 23, you're authorised to conduct offensive security operations under the guise of audit activities. Per Section 18, Paragraph 4: 'When operating within legitimate organizations, collateral damage to innocent parties must be minimized.' That means don't trash the place or arrest everyone. Find the ENTROPY agent. Stay sharp."

---

## Act 1: Arrival (15 minutes)

### Room: Reception

**NPCs:**
- **Sarah (Receptionist)**: Neutral NPC, genuinely helpful - innocent employee

**Layout:**
- Starting location
- Connections: North to General Office Area, East to Break Room
- **Locked areas visible**:
  - Server Room door (requires admin card - cannot open yet)
  - Security Office door (requires PIN - cannot open yet)

**Available Actions:**
- Social engineer receptionist (easy because this is a legitimate business)
- Access visitor logs (reveals suspicious late-night visits by Head of Security)
- Receptionist provides employee directory willingly for "auditor"
- Notice board with company information

**What Player Learns:**
- Most employees seem normal and helpful
- Something suspicious about Security team's late night activity
- Multiple locked areas to investigate later

---

### Room: General Office Area

**NPCs:**
- Multiple office worker NPCs (all innocent, most helpful)

**Discoveries:**
- Employees discuss work openly - they have nothing to hide
- Can social engineer easily for general information
- Find notes about "unusual behaviour" from security team - written by concerned employee
- Discover first encrypted message (Base64) on someone's desk - references "server logs"
- **Locked desk drawer** (requires key - not available yet)
- Overhear: "The Head of Security has been acting weird lately..."

**Environmental Storytelling:**
- Photo on desk shows Head of Security with family and dog named "Rex"
- Calendar with normal business meetings
- Evidence of normal, innocent business operations

---

### Room: Break Room

**NPCs:**
- 2-3 innocent employees discussing office matters

**Discoveries:**
- Overhear conversation: "Did you hear? Security changed the office code again without telling anyone."
- Find note on bulletin board: "New security office code starts with 7... ask Margaret for the rest"
- Coffee machine has sticky note: "IT borrowed my admin card again! -Sarah"
- Normal office environment, employees trust each other (perhaps too much)

---

### Act 1 Objectives

**Primary:**
- ☐ Check in at reception
- ☐ Locate security office (seen but cannot access yet)
- ☐ Access company directory
- ☐ Interview employees to identify suspicious behaviour

**Bonus:**
- ★ Read visitor logs without arousing suspicion
- ★ Gain trust of IT staff for later cooperation

**Puzzle State at End of Act 1:**
- Player knows Server Room exists (locked, need admin card)
- Player knows Security Office exists (locked, need PIN starting with 7)
- Player has encrypted message needing decryption
- Player has heard rumors about Head of Security acting strange
- Player recognizes most employees are innocent and helpful
- Player cannot solve any challenges yet - must explore further

---

## Act 2: Investigation (30 minutes)

### Room: IT Office

**NPCs:**
- **Marcus (IT Manager)**: Helpful, genuinely innocent, cooperative NPC

**Discoveries:**
- Eagerly discusses company systems because player is "official auditor"
- NPC mentions: "Someone keeps borrowing admin cards - I think it's the Head of Security"
- NPC volunteers: "We've had some weird server access patterns lately..."
- **Find Bluetooth scanner in supply drawer** (IT doesn't mind auditor using tools)
- Access to VM with partial logs (need server room access for complete logs)
- Through friendly conversation: Learn remaining PIN digits are "391"
- **BACKTRACK OPPORTUNITY**: Could return to Security Office now (PIN: 7391)

**Educational Focus**: Social engineering, building trust with technical staff

---

### Room: Standard Office #1 (General Employee - Jennifer)

**NPCs:**
- **Jennifer**: Innocent employee, very cooperative

**Discoveries:**
- Innocent employee's workspace with CyberChef on computer
- Employee: "Sure, use my computer for the audit. I've got nothing to hide!"
- **BACKTRACK REQUIRED**: Decrypt message from Act 1 (Base64 encoding)
- Decrypted message reveals: "Evidence in safe. Biometric access. Owner: Head of Security"
- Message also mentions: "Server logs show the full truth. Delete after reading."
- Find family photo of Head of Security with dog named "Rex"
- Employee explains: "That's our Head of Security. Nice enough guy, but he's been stressed lately."

**Educational Focus**: Base64 decoding using CyberChef, information correlation

---

### Room: Standard Office #2 (HR Manager - Robert)

**NPCs:**
- **Robert**: Away from desk, but workspace accessible during "audit"

**Discoveries:**
- Desk drawer contains **admin access card** left carelessly
- **BACKTRACK OPPORTUNITY**: Can now access Server Room (from Act 1)
- On desk: Personnel file (employee doing background check work) mentioning Head of Security birthday: 1985
- Post-it note: "Rex1985 - remind boss to change this!"
- Employee is doing legitimate work, no ENTROPY involvement

**Educational Focus**: Weak access control, password management failures

---

### Room: Server Room (Requires backtrack to Reception area)

**Access Requirements:**
- Admin keycard from Office #2

**Discoveries:**
- Restricted access achieved with borrowed admin card
- Server terminal with comprehensive logs
- VM access for detailed log analysis
- Discover evidence of data exfiltration - sophisticated, insider knowledge
- Find encrypted communication (AES-256-CBC) addressed to "0day"
- File header hints: "Key format: pet_name + year"
- **Player must remember**: Photo showed dog "Rex", file showed "1985"
- **BACKTRACK REQUIRED**: Return to Office #1 to use CyberChef with key "Rex1985"
- Log analysis shows: All suspicious access came from Security Office terminal

**Educational Focus**: Log analysis, AES-256-CBC decryption, key derivation

**VM Challenge:**
```
Linux server with logs showing:
- Unusual outbound connections to Tor network
- Large data transfers during off-hours
- Access patterns matching Head of Security's credentials
- Evidence of systematic client data exfiltration
```

---

### Room: Security Office (Requires PIN 7391 from Act 1 + Act 2 discoveries)

**Access Requirements:**
- PIN code: 7391 (discovered through IT Office conversation)

**Discoveries:**
- Head of Security's office (he's currently out)
- Computer password-protected (hints suggest password pattern: pet_name + year)
- Password: "Rex1985" (derived from photo in Office #1 + personnel file in Office #2)
- Safe requiring biometric lock
- Fingerprint dusting kit available in security equipment drawer
- Computer reveals when accessed:
  - Communications with "0day"
  - Dark web marketplace access logs
  - Client vulnerability assessment files
  - Evidence of systematic sales to ENTROPY

**Educational Focus**: Password patterns, biometric spoofing, evidence gathering

---

### Evidence Synthesis: Identifying the ENTROPY Agent

By combining information from multiple rooms, player realizes:

1. **Head of Security** has password "Rex1985" (family photo + personnel file)
2. All suspicious activity traces to **Security Office**
3. Encrypted communications with ENTROPY contact **"0day"**
4. Late-night access when no one else is around
5. Behavioral changes noted by coworkers

**But most importantly:**
- IT Manager: innocent, helpful
- Office employees: innocent, cooperative
- Other security staff: likely innocent
- **Only Head of Security shows ENTROPY indicators**

---

### Interconnected Puzzle Resolution

The core backtracking puzzles:

1. Player discovered family photo in Office #1 (dog: Rex)
2. Player discovered personnel file in Office #2 (year: 1985)
3. Player can now unlock Security Office computer: "Rex1985"
4. Player can also decrypt server logs with same info
5. Both paths reveal evidence pointing to Head of Security as ENTROPY agent
6. All other employees appear clean

---

### Act 2 Objectives

**Primary:**
- ☐ Access security systems (requires backtracking)
- ☐ Identify data exfiltration method (Server Room)
- ☐ Decrypt communications with ENTROPY (requires info from multiple rooms)
- ☐ Identify the insider threat (Head of Security)
- ☐ Gather sufficient evidence for confrontation

**Bonus:**
- ★ Find all 5 ENTROPY intelligence fragments (scattered across rooms)
- ★ Access both the Server Room AND Security Office for complete picture
- ★ Identify the insider before final confrontation (requires thorough investigation)
- ★ Maintain cover throughout investigation (don't alert suspect)

---

### LORE Fragments

**Fragment 1: IT Office (bulletin board)**
**Category**: ENTROPY Operations
**Content**: "Zero Day Syndicate recruitment methods: How they identify and compromise security professionals through appeals to greed, ideology, or leverage. Common profile: mid-career professionals with access but feeling undervalued."

**Fragment 2: Server Room (encrypted logs)**
**Category**: Cyber Security Concept
**Content**: "AES-CBC mode explanation: Each ciphertext block depends on all previous plaintext blocks. Identical plaintext blocks encrypt differently. Unlike ECB mode, which ENTROPY exploits when targets use weak encryption. CBC mode with proper IV is the minimum acceptable standard."

**Fragment 3: Security Office safe (after biometric bypass)**
**Category**: Character Background
**Content**: "Profile of '0day': ENTROPY's elite vulnerability broker and mysterious Zero Day Syndicate leader. Real identity unknown. Operates exclusively through encrypted channels. Has connections to all major dark web marketplaces. Net worth estimated in tens of millions from vulnerability sales."

**Fragment 4: Standard Office #1 locked drawer**
**Category**: Historical Context
**Content**: "Previous SAFETYNET operations against vulnerability marketplaces: Operation DARKHARVEST (2018) disrupted major exploit broker ring. Operation ZEROPOINT (2020) identified supply chain for zero-days. This syndicate appears to be evolution - more distributed, more professional, harder to trace."

**Fragment 5: Hidden in Break Room (behind coffee machine)**
**Category**: The Architect
**Content**: "Intercepted communication from The Architect to Zero Day Syndicate leadership: 'Systematic vulnerability collection is Phase 2. Defense contractors, critical infrastructure, research institutions - all must be assessed and catalogued. When Phase 3 begins, we will have complete understanding of their weaknesses. Continue acquiring penetration test results.'"

---

## Act 3: Confrontation (15 minutes)

### Room: Executive Conference Room

**Discoveries:**
- Locked briefcase with final evidence (requires PIN cracker or discovered code)
- Note found nearby: "Briefcase code is reversed security office code"
- **MEMORY/BACKTRACK ELEMENT**: Player must remember Security Office PIN was 7391, so briefcase is 1937
- Inside briefcase:
  - Encrypted files proving ENTROPY connection
  - Communication logs showing sales to ENTROPY cells
  - Complete client list of compromised organizations
  - Payment records (cryptocurrency transactions)

**Educational Focus**: Reverse engineering patterns, comprehensive evidence collection

---

### Confrontation Scene

**Discovery**: Evidence points conclusively to Head of Security as the broker

**The Reveal:**
Head of Security (Marcus Thompson) returns to find player accessing his evidence. He realizes he's been discovered.

**Player is presented with confrontation choices:**

---

### Option A: Practical Exploitation

> **Player**: "I know what you are, Thompson. Unlock your evidence vault for me, or I call this in right now. Your choice."

**Mechanics:**
- Head of Security provides access to hidden evidence cache
- Fast completion of objectives
- Questionable ethics - coercion of a criminal

**Response:**
> **Thompson**: "You're not giving me much choice, are you? Fine. But 0day will find out about this. And they don't forget."

**Debrief Impact:**
> **Agent 0x99**: "Effective, Agent, but we're not extortionists... officially. The intelligence you secured is valuable, but your methods were... creative. Results matter, though we'll be having a conversation about Section 19."

---

### Option B: By the Book Arrest

> **Player**: "It's over, Thompson. You're under arrest for espionage and data brokering."

**Mechanics:**
- Immediate arrest, standard procedure
- Must find evidence cache independently (requires additional puzzle solving)
- Takes longer but ethically sound

**Response:**
> **Thompson**: "I want a lawyer. I'm not saying anything."

**Debrief Impact:**
> **Agent 0x99**: "Clean arrest. Professional. Well done. The ENTROPY operative is in custody and already providing information under interrogation. Textbook operation, Agent."

---

### Option C: Combat

> **Player**: "ENTROPY. You're done."

**Mechanics:**
- Triggers combat encounter
- Most aggressive option
- Evidence secured after confrontation

**Response:**
> **Thompson**: *Attempts to escape or fight*

**Debrief Impact:**
> **Agent 0x99**: "That was intense. Perhaps we could have handled it more delicately? Still, the threat is neutralized and evidence secured. Please file your incident report."

---

### Option D: Recruitment Attempt

> **Player**: "ENTROPY is burning their assets, Thompson. You're exposed. Work with us—become a double agent—and we can protect you."

**Mechanics:**
- Requires high trust or strong leverage (having all evidence helps)
- Success: Ongoing intelligence operation, bonus LORE fragments
- Failure: Leads to combat or arrest

**Success Response:**
> **Thompson**: "You don't understand. 0day doesn't let people walk away. But... if you can protect my family... I'll tell you everything."

**Failure Response:**
> **Thompson**: "You think SAFETYNET can protect me? You have no idea what you're dealing with."

**Debrief Impact (Success):**
> **Agent 0x99**: "Risky play, but the intel we're getting is gold. Your new asset is providing valuable data on '0day' and the marketplace. I'm noting specialisation in Intelligence Operations and Asset Management."

---

### Option E: Interrogation First

> **Player**: "Before we finish this, I need names. Who else is working for ENTROPY? Who's 0day?"

**Mechanics:**
- Extract information before arrest/combat
- Reveals additional ENTROPY cells (bonus objective)
- Most time-consuming option

**Response:**
> **Thompson**: "0day? I've never met them face to face. All communication through encrypted channels. But I can tell you about the others... the marketplace has at least seven other brokers across different security firms."

**Debrief Impact:**
> **Agent 0x99**: "Patience paid off. The additional intelligence will help future operations. The network map you've uncovered shows Zero Day Syndicate has corrupted security professionals in at least seven other organisations."

---

### Act 3 Objectives

**Primary:**
- ☐ Secure broker's evidence cache
- ☐ Confront the Shadow Broker
- ☐ Confirm ENTROPY involvement

**Bonus:**
- ★ Complete without alerting other staff
- ★ Recover list of all affected clients
- ★ Identify additional ENTROPY contacts (interrogation path)
- ★ Establish ongoing double agent operation (recruitment path)

---

### Summary of Interconnected Design

**3 Major Locked Areas Presented Early:**
- Server Room door
- Security Office door
- Secured Drawer

**4+ Multi-Room Puzzle Chains:**
1. Encrypted message (Act 1) → Find CyberChef (Act 2) → Decrypt (backtrack)
2. Partial PIN (Act 1) → Complete through exploration (Act 2) → Unlock Security Office (backtrack)
3. Server Room seen early → Find admin card (Act 2) → Access server logs (backtrack)
4. Password/key hints across multiple rooms → Piece together → Apply (multiple backtracks)

**6+ Backtracking Moments Required:**
- To Reception area for locked doors
- To Office #1 for decryption
- To Security Office with PIN
- To Server Room with card
- To Conference Room with discovered code

**Non-Linear Exploration:**
- Player can choose to tackle Server Room or Security Office in either order once access is obtained

**Satisfying Connections:**
- Information from Act 1 (encrypted message, partial PIN) becomes useful in Act 2
- Pieces from different rooms (photo, personnel file) combine to unlock secrets

---

## Post-Mission: Debrief Variations

### Ending A: By the Book (Arrest + Minimal Collateral)

> **Agent 0x99**: "Excellent work, Agent 0x00. Clean arrest of the Head of Security, no disruption to Nexus Consulting's legitimate operations. The company's employees were shocked—they had no idea. We've secured evidence of the vulnerability sales, and '0day' from the Zero Day Syndicate is now cut off from this source."
>
> **Director Netherton**: "Textbook operation. Per Section 14, Paragraph 8: 'When all protocols are followed and the mission succeeds, the agent shall receive commendation.' Well done. Nexus Consulting will recover—they're cooperating fully and implementing our security recommendations."
>
> **Agent 0x99**: "The company is grateful. They're hiring a new Head of Security and reviewing all their processes. Your professional conduct protected innocent employees while removing the threat. I'm updating your specialisation in Applied Cryptography and Insider Threat Detection."

---

### Ending B: Pragmatic Victory (Exploitation + Fast Completion)

> **Agent 0x99**: "Mission accomplished, Agent. You leveraged the Head of Security's position to access his evidence vault before arrest. Efficient. The company is... disturbed by your methods, but they understand it prevented data destruction."
>
> **Director Netherton**: "Per Protocol 404: 'Creative interpretations of authority are permitted when expedient.' Results matter, but remember—Nexus is a legitimate business with innocent employees. They'll remember how we operated here."
>
> **Agent 0x99**: "The intelligence we recovered confirms Zero Day Syndicate's systematic vulnerability purchasing. Your technical work was excellent. The mission succeeded, and the company will recover. But relationships matter—they may be less cooperative with future SAFETYNET operations."

---

### Ending C: Aggressive Resolution (Combat + Decisive Action)

> **Agent 0x99**: "Well, Agent, that was intense. The Head of Security is neutralised, evidence secured, threat eliminated. But the company is shaken. Several employees witnessed the combat. We've had to do damage control."
>
> **Director Netherton**: "Per Section 29: 'Use of force is authorised when necessary.' You deemed it necessary in a building full of innocent civilians. Please file your incident report and review Section 31 on 'Proportional Response in Civilian Environments.'"
>
> **Agent 0x99**: "Zero Day Syndicate connection confirmed. The company will recover, but trust in security professionals took a hit. Your technical skills got you to the truth. Just remember: most people there were innocent. Collateral psychological impact matters."

---

### Ending D: Intelligence Victory (Double Agent Recruited)

> **Agent 0x99**: "Masterful, Agent 0x00. Flipping their Head of Security into a double agent? He's now providing intelligence on Zero Day Syndicate while maintaining his position at Nexus."
>
> **Director Netherton**: "Per Section 19, Paragraph 7: The company believes we concluded the investigation inconclusive—he's still employed. This is ongoing. You're handling this asset going forward. Don't mess it up."
>
> **Agent 0x99**: "Your asset is feeding us valuable data on '0day' and the marketplace. Nexus's employees still don't know—business as usual. You'll be managing this delicate situation. I'm noting specialisation in Intelligence Operations and Asset Management."

---

### Ending E: Thorough Investigation (Interrogation + Maximum Intel)

> **Agent 0x99**: "Exceptional work, Agent. You extracted every piece of intelligence before arrest. The additional Zero Day Syndicate contacts you identified will help us roll up this entire vulnerability marketplace."
>
> **Director Netherton**: "Patience and thoroughness. Nexus appreciated your careful approach—you gathered evidence without disrupting their business until the final arrest. The company is cooperating fully."
>
> **Agent 0x99**: "The network map shows Zero Day Syndicate has corrupted security professionals in at least seven other organisations. Your interrogation skills revealed the full scope. We're launching follow-up operations. All while keeping Nexus's innocent employees safe."

---

### Ending F: Mixed Outcome (Alerted Staff + Complications)

> **Agent 0x99**: "Mission accomplished, but... half of Nexus's staff knows something happened, and several employees are traumatised. The company is considering legal action for workplace disruption."
>
> **Director Netherton**: "Results: ENTROPY agent arrested, evidence secured. Methods: Louder than ideal. Per Section 42: 'Discretion is encouraged.' Next time: remember that legitimate businesses with innocent employees require different tactics than ENTROPY-controlled facilities."
>
> **Agent 0x99**: "The Head of Security is in custody. Your technical work was sound, but operational security needs improvement. Nexus will recover. The mission succeeded. Next time: lighter touch in civilian environments."

---

### Universal Closing (appears in all endings)

> **Agent 0x99**: "One more thing. This vulnerability marketplace is part of ENTROPY's Zero Day Syndicate operation. Communications suggest '0day' was buying the stolen assessments. The Head of Security was just one compromised professional in their network."
>
> **Agent 0x99**: "This syndicate systematically corrupts security professionals at legitimate companies. Nexus was infiltrated, but we believe there are others. Most companies don't know they're compromised. We'll be watching for this pattern. Meanwhile, Nexus is implementing new insider threat protocols. Your work here may have saved other companies from the same fate."

---

## Educational Summary

### CyBOK Areas Covered

**Applied Cryptography:**
- Base64 encoding/decoding
- AES-256-CBC encryption/decryption
- Key derivation from contextual information
- Understanding cipher modes (ECB vs CBC)

**Human Factors:**
- Social engineering legitimate employees
- Building trust with NPCs
- Cover story maintenance
- Distinguishing innocent from compromised employees

**Security Operations:**
- Log analysis for insider threat detection
- Evidence collection and correlation
- Incident investigation methodology
- Insider threat indicators

**Network Security:**
- Understanding access control weaknesses
- Network log analysis
- Identifying data exfiltration patterns

### Learning Objectives

By completing this scenario, players will:
1. Understand AES-CBC encryption and how to decrypt with discovered keys
2. Practice social engineering in low-risk environment
3. Learn to correlate evidence from multiple sources
4. Identify insider threat behavioral indicators
5. Experience realistic penetration testing as authorized auditor
6. Navigate ethical dilemmas in security operations

---

## Implementation Notes

### Room Graph (Cardinal Directions)

```
        [General Office]
               |
          [Reception]—[Break Room]
               |
        [IT Office]
               |
          [Server Room]

    [Office #1]   [Office #2]

         [Security Office]

      [Conference Room]
```

### Key Items and Locations

**Keys/Cards:**
- Admin keycard (Office #2) → unlocks Server Room
- Fingerprint kit (Security Office) → bypasses biometric safe

**Codes/Passwords:**
- PIN 7391 (pieced together from Break Room + IT Office) → Security Office door
- Password "Rex1985" (photo + personnel file) → Security Office computer AND Server Room decryption
- Briefcase code 1937 (reverse of 7391) → Conference Room briefcase

**Evidence:**
- Encrypted Base64 message (General Office) → hints at safe
- Server logs (Server Room) → exfiltration evidence
- ENTROPY communications (Security Office computer) → proves connection
- Client list (Conference Room briefcase) → complete evidence

### NPC Trust Levels

**High Trust (Helpful):**
- Sarah (Receptionist): 7/10 - Professional, cooperative
- Marcus (IT Manager): 8/10 - Technical ally, wants to help
- Jennifer (Office Worker): 7/10 - Innocent, trusting
- Robert (HR Manager): 6/10 - Away, but not suspicious

**Low Trust (Villain):**
- Marcus Thompson (Head of Security): 0/10 initially (unknown), becomes antagonist

### Puzzle Difficulty Curve

**Act 1**: Tutorial (Base64 encoding, simple social engineering)
**Act 2**: Intermediate (AES-256 decryption, multi-room correlation, log analysis)
**Act 3**: Synthesis (Applying all learned skills, confrontation choice)

---

*Operation Shadow Broker demonstrates the full scenario design framework in practice: non-linear exploration, backtracking puzzles, multi-room evidence correlation, morally grey choices, and authentic cybersecurity education wrapped in a compelling narrative about insider threats and the Zero Day Syndicate marketplace.*
