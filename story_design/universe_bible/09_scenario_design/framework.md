# Scenario Design Framework

## Core Design Principles

### 1. Puzzle Before Solution
Always present challenges before providing the means to solve them.

**Good Design:**
- Player encounters locked door → searches area → finds key hidden in desk
- Player sees encrypted message → must locate CyberChef workstation → decodes message

**Bad Design:**
- Player finds key → wonders what it's for → finds door
- Player has CyberChef immediately available before encountering encoded data

### 2. Non-Linear Progression & Backtracking
Scenarios should require visiting multiple rooms to gather solutions, encouraging exploration and creating interconnected puzzle chains rather than linear sequences.

**Design Philosophy:**
Avoid simple linear progression where each room is completely self-contained and solved before moving to the next. Instead, create spatial puzzles where information, keys, or codes discovered in one area unlock progress in previously visited areas.

**Required Design Element:**
**Every scenario must include at least one backtracking puzzle chain** where the player:
1. Encounters a locked/blocked challenge early
2. Explores other areas and gathers clues/items
3. Returns to the earlier challenge with the solution
4. This creates satisfying "aha!" moments and rewards thorough exploration

**Good Non-Linear Design Examples:**

**Example 1: The PIN Code Hunt**
- **Room A (Office)**: Player finds safe with PIN lock (cannot open yet)
- **Room B (Reception)**: Player discovers note mentioning "meeting room calendar"
- **Room C (Conference Room)**: Calendar shows important date: 07/15
- **Return to Room A**: Player uses PIN 0715 to open safe
- **Result**: Player must visit 3 rooms to solve 1 puzzle

**Example 2: The Credential Chain**
- **Room A (Server Room)**: Locked, requires admin key card (blocked)
- **Room B (IT Office)**: Contains computer with admin scheduling system
- **Room C (Executive Office)**: Computer needs password, finds note "same as wifi"
- **Room D (Break Room)**: Wifi password on notice board: "SecureNet2024"
- **Return to Room C**: Access computer, discover admin is in Room E
- **Room E (Storage)**: Find admin's locker with key card inside
- **Return to Room A**: Finally access server room
- **Result**: 5 rooms interconnected, requires significant backtracking

**Example 3: The Fingerprint Triangle**
- **Room A (CEO Office)**: Biometric laptop (needs fingerprint)
- **Room B (IT Office)**: Obtain fingerprint dusting kit
- **Room C (Reception)**: CEO's coffee mug has fingerprints
- **Return to Room A**: Collect fingerprint from mug
- **Return to Room B**: Use dusting kit to lift print
- **Return to Room A**: Spoof biometric lock with collected print
- **Result**: Three rooms must be visited multiple times in specific sequence

**Poor Linear Design (Avoid This):**

**Bad Example: Simple Sequence**
- **Room A**: Find key → unlock door to Room B
- **Room B**: Find password → unlock computer → find keycard → unlock door to Room C
- **Room C**: Find PIN → unlock safe → mission complete
- **Problem**: Each room is self-contained, no backtracking, no spatial puzzle-solving

**Implementation Guidelines:**

**Minimum Backtracking Requirements per Scenario:**
- **At least 1 major backtracking puzzle chain** (3+ rooms interconnected)
- **2-3 minor backtracking elements** (return to previously locked door, etc.)
- **Fog of war reveals rooms gradually** (can't see entire map initially)

**Backtracking Design Patterns:**

**Pattern A: The Locked Door Hub**
- Central room with multiple locked doors
- Each requires different method/item to unlock
- Solutions found in various rooms beyond initial accessible areas
- Player returns repeatedly as new items/information discovered

**Pattern B: The Information Scatter**
- Single complex puzzle requires information from multiple sources
- Each room contains one piece (part of PIN, encryption key segment, etc.)
- Player must synthesize information from entire map
- Final solution location requires revisiting early area

**Pattern C: The Tool Unlock**
- Early areas have challenges requiring tools not yet acquired
- Tools found mid-game in secured locations
- Player must backtrack to apply new capabilities
- Example: Lockpicks enable accessing previously locked containers

**Pattern D: The Progressive Evidence Chain**
- Initial evidence raises questions answered in other rooms
- Each new room provides context that explains earlier mysteries
- Player reinterprets earlier findings with new knowledge
- May need to return to re-examine previous evidence

**Signposting for Backtracking:**

**Good Signposting:**
- "This safe requires a 4-digit PIN. You don't have it yet."
- "The door is locked with a biometric scanner. You'd need fingerprints."
- "This encrypted file needs a key. Search the office?"
- Clear indication that solution exists elsewhere

**Poor Signposting:**
- Locked door with no indication of what's needed
- Puzzle that seems solvable but has hidden requirements
- No reminder that previously locked areas might now be accessible

**Visual/UI Indicators:**
- Mark locked doors/items on map/inventory
- Notification when acquiring item that unlocks previous area
- Optional: Objective system hints at backtracking ("Return to the CEO's office")

**Balancing Backtracking:**

**Good Backtracking:**
- Purposeful (player understands why they're returning)
- Rewarding (new progress made, new areas unlocked)
- Limited running (room layouts minimize tedious travel)
- Reveals new information (previously locked areas contain substantial content)

**Bad Backtracking:**
- Excessive (constant running between distant rooms)
- Unclear (player doesn't know where to go next)
- Trivial (unlock door just to find empty room)
- Repetitive (same route multiple times with no variation)

**Scenario Flow Example (Non-Linear):**

```
START: Room A (Reception)
  ↓
Access Rooms B (Office 1) and C (Office 2)
  ↓
Room B: Find encrypted message, note about server room
Room C: Discover PIN lock on safe, find fingerprint kit
  ↓
Explore Room D (IT Office): Get Bluetooth scanner
Room D locked door leads to Room E (Server Room) - BLOCKED
  ↓
Return to Room C: Lift fingerprints from desk
Discover Room F (Executive Office) requires keycard - BLOCKED
  ↓
Return to Room B: Use clues to decrypt message
Message reveals Room E PIN code
  ↓
Return to Room E: Access server room
Find keycard and encryption key
  ↓
Return to Room F: Access executive office
Use encryption key on files
  ↓
Complete Mission
```

**Key Principle:** At any given time, player should have 2-3 accessible paths forward, but each path requires information/items from other areas, creating a web rather than a line.

### 3. Multiple Paths, Single Goal
Provide options while maintaining focus.

**Example:**
- **Goal**: Access CEO's computer
- **Path A**: Find password on post-it note
- **Path B**: Social engineer IT for credentials
- **Path C**: Exploit vulnerability on VM
- **Path D**: Dust for fingerprints to bypass biometric lock

### 4. Layered Security
Reflect real-world defence in depth.

**Example Security Chain:**
1. Physical: Locked door (requires key or lockpick)
2. Device: Biometric scanner (requires fingerprint spoofing)
3. System: Password-protected laptop (requires credential discovery)
4. Application: Encrypted files (requires CyberChef decryption)
5. Validation: Hash verification (requires MD5 calculation)

### 5. Scaffolded Difficulty
Build complexity through the scenario.

**Beginning**: Basic challenges (simple locks, obvious clues)
**Middle**: Combined challenges (encoded message + hidden location)
**End**: Complex chains (multi-stage decryption + social engineering + timing)

### 6. Meaningful Context
Every puzzle should make sense within the narrative.

**Good Contextualisation:**
- Encrypted message contains meeting location between ENTROPY agents
- Locked safe contains evidence of data exfiltration
- PIN code discovered through social engineering resistant employee

**Poor Contextualisation:**
- Random cipher with no explanation
- Lock that exists only to slow player down
- Puzzle that doesn't connect to scenario objectives

## Scenario Structure Template

Break Escape scenarios follow a **mandatory three-act structure** with flexible narrative elements within each act. This structure ensures consistent pacing while allowing creative freedom in storytelling and player choices.

**IMPORTANT FOR SCENARIO AUTHORS (Human and AI):** Before creating scenario JSON specifications, you MUST first outline the complete narrative structure following this template. The narrative should be logically connected across all three acts, with player choices affecting the story's progression and conclusion.

---

### Narrative Design Process

**Step 1: Outline First, Implement Second**

Before writing any JSON or designing puzzles, create a narrative outline that includes:

1. **Core Story**: What's the threat? Who's the villain? What's at stake?
2. **ENTROPY Cell & Villain**: Which cell? Controlled corp or infiltrated org?
3. **Key Revelations**: What twists will emerge? What will players discover?
4. **Player Choices**: What 3-5 major decisions will players face?
5. **Moral Ambiguity**: Where are the grey areas? What's the "license to hack" justification?
6. **Multiple Endings**: How do choices affect outcomes? (minimum 3 endings)
7. **LORE Integration**: What 3-5 fragments will be discoverable?
8. **Three-Act Breakdown**: Map narrative beats to acts

**Step 2: Map Technical Challenges to Narrative**

Once narrative is outlined:
- Identify where cryptography challenges fit
- Determine which rooms support which story beats
- Place LORE fragments to reward exploration
- Design puzzle chains that reveal narrative progression
- Ensure technical learning works in all narrative branches

**Step 3: Implement in JSON**

Only after narrative and technical design are complete should you begin JSON specification.

---

### The Morally Grey Framework: SAFETYNET Authorization

**CRITICAL DESIGN PRINCIPLE:** Players should feel empowered to make morally ambiguous choices. This is a game—players understand it's not real life—and they should enjoy the freedom to explore grey areas.

**The "License to Hack":**

SAFETYNET provides agents with broad operational authority, similar to James Bond's "license to kill." This authorization framework gives players permission to:

- Conduct offensive cyber operations against targets
- Use social engineering and manipulation tactics
- Exploit vulnerabilities without explicit permission
- Break into systems and physical locations
- Make pragmatic decisions that might be ethically questionable
- Prioritize mission success over perfect ethics

**Why This Matters for Design:**

1. **Player Permission**: The SAFETYNET framework removes guilt from player choices
2. **Moral Complexity**: Grey choices are MORE interesting than black-and-white ones
3. **Replayability**: Different moral approaches encourage multiple playthroughs
4. **Educational Value**: Real security work involves ethical dilemmas
5. **Fun**: Players enjoy being spy-movie secret agents with authority

**In Briefings, Emphasize Authorization:**
> "You are authorized under [REDACTED] protocols to conduct offensive operations..."
> "Per Section 7, Paragraph 23, your cover story provides legal framework for any necessary actions..."
> "The Field Operations Handbook grants broad discretion in achieving mission objectives..."

**In Debriefs, Acknowledge Choices Without Heavy Judgment:**
- "Effective but ethically complex..." (not "wrong")
- "Pragmatic approach..." (not "bad")
- "By the book..." (not "the only right way")
- All choices that succeed are valid; consequences differ but aren't morally condemned

**Design Imperative:** Make morally grey choices appealing, interesting, and FUN. Don't punish players for pragmatism or creativity. The debrief should reflect consequences and impact, not moral judgment.

---

### Act 1: Setup & Entry (15-20 minutes)

**Purpose:** Establish mission context, introduce setting, present initial challenges, and set up investigation threads that will pay off later.

**Mandatory Elements:**
- Mission briefing (cutscene at SAFETYNET HQ)
- Starting room with immediate interactions
- 2-3 primary objectives introduced
- At least 3 locked areas/mysteries visible early

**Narrative Elements to Consider:**

**Cold Open (Optional, 2-3 minutes):**
Before the briefing, consider opening with:
- **In Media Res**: Brief glimpse of the crisis (then cut to "12 hours earlier")
- **Enemy Action**: Show ENTROPY agent doing something suspicious
- **Victim Call**: Anonymous tip or distress call that triggers mission
- **ENTROPY Intercept**: Decoded message revealing the threat
- **Previous Agent**: Reference to failed mission or missing agent

*Example:* "Security footage shows someone in server room at 3 AM. Feed cuts out. Next morning, client data is on dark web. Cut to: SAFETYNET HQ."

**HQ Mission Briefing (Mandatory, 3-5 minutes):**
Handler (usually Agent 0x99 or Director Netherton) provides:
- **The Hook**: What's the immediate situation?
- **The Stakes**: Why does this matter? Who's at risk?
- **ENTROPY Intel**: What do we suspect about their involvement?
- **Cover Story**: What role is player assuming?
- **Authorization**: "You are authorized under [PROTOCOL] to conduct offensive operations..."
- **Equipment**: What tools are provided?
- **Field Operations Handbook Humor**: (Optional, max 1 absurd rule reference)

*Example:* "Per Section 7, Paragraph 23: You're authorized to identify yourself as a security consultant, which is technically true since you ARE consulting on their security... by breaking it."

**Starting Room Introduction (5-10 minutes):**

Consider including:

**Incoming Phone Messages/Voicemails:**
- Urgent message from handler with additional intel
- Voicemail from "anonymous tipster" providing first clue
- Message that reveals NPC personality or suspicious behavior
- Warning message: "Delete this after listening..."

*Timing:* Can trigger immediately on arrival, or after brief exploration

**Starting Room NPCs:**
- **Receptionist/Gatekeeper**: Establishes tone (hostile? helpful? suspicious?)
- **Friendly Contact**: Provides initial intel and hints
- **Suspicious Character**: Someone who doesn't belong or acts nervous
- **Authority Figure**: Someone player must convince or evade

**Environmental Storytelling:**
- Notice boards with company information
- Security alerts or warnings
- Photos revealing relationships
- Documents hinting at problems
- Calendar showing suspicious meetings

**Meaningful Branching from Start:**

Player's initial choices should matter:

**Approach to Entry:**
- Social engineering (smooth talker) → NPCs more trusting later
- Show credentials (authoritative) → Taken seriously but watched closely
- Sneak in (covert) → Harder to gather info but less suspicious
- Technical bypass (hacker) → Security alerted but direct access

**Initial NPC Interaction:**
- Build trust (high trust) → Easier info gathering, potential ally
- Professional distance (neutral) → Standard cooperation
- Suspicious/aggressive (low trust) → NPCs less helpful, more guarded

**First Discovery:**
- Investigate immediately → Player is thorough investigator archetype
- Report to handler → Player follows protocol by the book
- Explore further first → Player is independent, takes initiative

*Example:* If player social engineers receptionist successfully, she becomes ally who warns them later: "Security is acting weird today..." If player is suspicious/aggressive, she calls security immediately.

**Act 1 Objectives:**
- ☐ Establish presence/check in
- ☐ Initial recon (locate key areas)
- ☐ Meet initial NPCs
- ☐ Discover first piece of evidence
- ☐ Encounter first puzzle/locked door
- ★ Optional: Find first LORE fragment

**Act 1 Ends When:**
- Player has established base understanding
- Multiple investigation threads are opened
- First major locked door requires backtracking
- Player realizes something is suspicious/wrong

---

### Act 2: Investigation & Revelation (20-30 minutes)

**Purpose:** Deep investigation, puzzle solving, discovering ENTROPY involvement, plot twists, and major player narrative choices. Act 2 is the most flexible act and can include multiple story beats and phases.

**Mandatory Elements:**
- Multi-room investigation with backtracking
- Discovery that things aren't as they seemed
- ENTROPY agent identification or revelation
- 3-5 major player narrative choices with consequences
- 3-5 LORE fragments discoverable

**CRITICAL NOTE ON FLEXIBILITY:** Act 2 is the longest act and should have room for multiple story beats and phases. The structure below is suggestive, not prescriptive. Act 2 can include investigation, discovery, response, escalation, and working to stop discovered plans all within this act.

**Narrative Elements to Consider:**

**Phase 1: Investigation (Initial 10-15 minutes):**

**The Professional Mask:**
Early in Act 2, everything seems normal-ish:
- Employees are helpful (if infiltrated org)
- Security measures make sense
- Problems appear to be accidents or incompetence
- Evidence suggests conventional threat

**The Crack in the Facade (Mid-Act 2):**
Something doesn't add up:
- Security is TOO good for stated purpose
- Employee behavior doesn't match background
- Technical sophistication exceeds company size
- Encrypted communications way too advanced
- References to projects that don't officially exist

**Evidence Accumulation:**
Players piece together:
- Documents from multiple rooms
- Decoded messages
- Overheard conversations
- Computer logs
- Physical evidence (fingerprints, access logs)

*Example:* "This 'marketing manager' has military-grade encryption on his laptop. His LinkedIn says he studied poetry. The server logs show access to systems that don't appear in company directory..."

**Phase 2: Revelation - Things Aren't As They Seemed (Plot Twists):**

Consider revealing:

**The Helpful NPC is ENTROPY:**
- Employee who seemed innocent is actually insider
- Breadcrumb trail leads to their desk
- Trust betrayal creates emotional impact
- Choice: Confront now or gather more evidence?

**The Mission Parameters Are Wrong:**
- Not just corporate espionage—it's infrastructure attack
- Not one insider—it's an entire cell
- Target isn't the company—they're being used to attack someone else
- Company is controlled, not infiltrated (or vice versa)

**The Victim is Complicit:**
- CEO knows about ENTROPY presence
- Company is willingly cooperating
- "Victim" called SAFETYNET to eliminate rival cell
- Everyone is dirty

**It's Bigger Than Expected:**
- Single insider is part of network
- Small operation is test for larger attack
- This cell connects to others
- The Architect is personally involved

**Personal Stakes:**
- Previous agent worked this case (went missing)
- Handler has personal connection
- Recurring villain returns
- Player's own data has been compromised

**Phase 3: Discovery of Evil Plans (Optional Middle Act 2):**

Once ENTROPY involvement is confirmed, Act 2 can include discovering their specific plans:

**Finding the Plan:**
- Intercepted communications reveal timeline
- Discovered documents outline operation
- Compromised NPC explains under interrogation
- Server logs show attack preparation
- Physical evidence (diagrams, equipment, schedules)

**Example Evil Plans to Discover:**

**Infrastructure Attack:**
- Power grid shutdown scheduled for specific date
- Water treatment sabotage in progress
- Transportation system compromise planned
- Cascading failure across multiple systems

**Data Operation:**
- Mass data exfiltration nearly complete
- Ransomware deployment imminent
- Client data being sold on dark web
- Backup systems already compromised

**Supply Chain Compromise:**
- Backdoor in software update ready to deploy
- Hardware implants in devices shipping soon
- Vendor credentials stolen for client access
- Trusted certificates compromised

**Disinformation Campaign:**
- Deepfake videos scheduled for release
- Bot network ready to amplify false narrative
- Stolen credentials for legitimate news accounts
- Election interference operation in final stages

**Deep State Infiltration:**
- ENTROPY agents embedded throughout civil service
- Systematic bureaucratic sabotage causing dysfunction
- Critical permits and approvals deliberately delayed
- Regulations weaponised to create inefficiency
- Government systems compromised from within
- Policy recommendations designed to increase chaos
- Public trust in institutions deliberately eroded
- Legitimate government functions disrupted through red tape

**Summoning/Eldritch (Quantum Cabal):**
- Quantum computer calculation reaching critical point
- Ritual scheduled for astronomical event
- Reality barrier weakening due to experiments
- AI exhibiting increasingly impossible behaviors

**Discovery Creates New Objectives:**
- ☐ Determine attack timeline
- ☐ Identify attack vector
- ☐ Locate critical systems under threat
- ☐ Find method to stop operation
- ★ Discover secondary targets (bonus)

**Phase 4: Working to Stop the Plans (Optional Late Act 2):**

After discovering evil plans, Act 2 can include efforts to prevent them:

**Disruption Challenges:**

**Technical Challenges:**
- Disable attack infrastructure
- Patch critical vulnerabilities
- Decrypt attack code to understand methodology
- Locate and secure backup systems
- Identify and close backdoors

**Physical Challenges:**
- Access secured server rooms
- Disable hardware devices
- Secure physical evidence before destruction
- Prevent equipment from leaving facility

**Time Pressure:**
- Attack launches in [X] minutes
- Data deletion in progress
- Systems already compromised
- Countdown creates urgency

**Moral Dilemmas During Response:**

**Stop vs. Study:**
- Can stop attack NOW but lose intelligence
- OR let it progress while gathering evidence
- Risk: Attack might succeed beyond control

**Collateral Damage:**
- Stopping ENTROPY will disrupt legitimate operations
- Hospital systems offline during patch
- Financial systems frozen during investigation
- Transportation delayed while securing networks

**Partial Success:**
- Can stop primary attack but not secondary
- Can save some systems but not all
- Must prioritize: Which systems to protect first?

**Player Choices During Response:**

**Priority Selection:**
> Critical infrastructure is under attack in multiple locations. Which do you protect first?
- Power grid (affects most people)
- Hospital systems (life-critical)
- Financial systems (economic impact)
- Water treatment (long-term health)

**Method Selection:**
> How do you stop the attack?
- Immediate shutdown (stops attack, causes disruption)
- Surgical intervention (slower, minimal disruption)
- Coordinate with staff (safest, might alert ENTROPY)
- Let it fail safely (controlled damage)

**Evidence vs. Prevention:**
> You can stop the attack OR gather evidence for future operations
- Stop now (mission focused)
- Gather intel (strategic thinking)
- Attempt both (risky, might fail at both)

**Example Act 2 with Multiple Phases:**

*Minutes 0-10:* Investigation - gathering evidence, social engineering, accessing systems
*Minutes 10-15:* Revelation - discovering Head of Security is ENTROPY, not just selling data
*Minutes 15-20:* Discovery - finding ransomware deployment scheduled for midnight tonight
*Minutes 20-25:* Response - racing to disable ransomware before deployment while Head of Security realizes he's compromised
*Minutes 25-30:* Confrontation Setup - securing final evidence, making choices about how to handle situation, preparing for Act 3

**Phase 5: Villain Monologue/Revelation (Can Occur Anywhere in Act 2):**

When villain is discovered or confronted, consider:

**The Philosophical Villain:**
- Explains ENTROPY's entropy philosophy
- "I'm not destroying—I'm revealing inevitable chaos"
- Believes they're doing necessary work
- Quotes thermodynamic equations
- Makes player question assumptions

**The Pragmatic Villain:**
- "Everyone has a price. I found theirs."
- No ideology—just profitable chaos
- Business-like about destruction
- Makes player feel naive

**The Desperate Villain:**
- ENTROPY has leverage over them
- Family threatened, debt, blackmail
- "You'd do the same in my position"
- Makes player feel conflicted about stopping them

**The True Believer:**
- Cult-like devotion to ENTROPY
- Quantum Cabal-style mysticism
- "The calculations work. The entities are listening."
- Genuinely frightening conviction

**The Taunting Villain:**
- "You're too late. It's already in motion."
- Mocks player's methods
- "SAFETYNET sent a rookie? How insulting."
- Challenges player's competence

**The Regretful Villain:**
- "I didn't want this, but they gave me no choice."
- Explains how ENTROPY trapped them
- Genuine remorse but committed to operation
- Creates sympathy while remaining threat

**Villain Communication Methods:**
- Face-to-face confrontation (if player catches them)
- Video call (can't be caught yet, taunts from afar)
- Recorded message (villain already gone, left explanation)
- Through compromised NPC (possessed/controlled/forced to speak)
- Intercepted communication (not meant for player, overhead monologue)
- Environmental storytelling (player pieces together from journals, notes, recordings)

**LORE Reveals:**

Act 2 is prime LORE discovery time. Fragments can appear throughout all phases:

**Through Investigation:**
- Encrypted files on computers
- Hidden documents in secured locations
- Personal logs from ENTROPY agents
- Communications with cell leaders
- References to The Architect or Mx. Entropy

**Through NPCs:**
- Villain explains ENTROPY's methodology
- Compromised NPC reveals how they were recruited
- Friendly NPC shares rumors they heard
- Handler provides historical context via phone call

**Through Environment:**
- Whiteboards with occult symbols + code
- Research notes mixing quantum physics and mysticism
- Training materials for new ENTROPY recruits
- Evidence of previous operations
- Abandoned safe houses with intelligence

**Through Discovered Plans:**
- Attack documents reveal strategic objectives
- Communications show larger ENTROPY network
- Technical specifications reveal cell capabilities
- Timeline shows coordination with other cells

**LORE Fragment Placement:**
- 1-2 obvious (main investigation path)
- 2-3 hidden (thorough exploration rewards)
- 1 achievement-based (specific action or choice)

**Major Player Narrative Choices (3-5 Required Throughout Act 2):**

These should occur at different points across Act 2's phases:

**Choice 1: Ethical Hacking Dilemma (Early Act 2)**
- Discovered massive vulnerability unrelated to mission
- **Option A**: Report it properly (ethical, time-consuming)
- **Option B**: Exploit for mission advantage (pragmatic, questionable)
- **Option C**: Ignore it (fastest, leaves company vulnerable)
- **Consequence**: Affects company's future security and trust in SAFETYNET

**Choice 2: Innocent NPC in Danger (Mid Act 2)**
- Employee unknowingly helping ENTROPY, will be blamed
- **Option A**: Warn them (protects innocent, might alert ENTROPY)
- **Option B**: Use them as bait (effective, morally grey)
- **Option C**: Let them take the fall (mission first, they'll be okay eventually)
- **Consequence**: Affects NPC's fate and player's reputation

**Choice 3: Information vs. Action (After Plan Discovery)**
- Can stop attack NOW or gather intel for future operations
- **Option A**: Stop attack (saves immediate victims, loses intelligence)
- **Option B**: Let it proceed while gathering data (long-term gain, short-term harm)
- **Option C**: Compromise (partial stop, partial intel)
- **Consequence**: Affects debrief and future mission options

**Choice 4: Compromised NPC Discovery (Mid Act 2)**
- Found employee is ENTROPY but clearly being blackmailed
- **Option A**: Arrest them (by the book, harsh on victim)
- **Option B**: Offer protection (risky, compassionate)
- **Option C**: Force cooperation (effective, ethically dubious)
- **Consequence**: Affects information gained and NPC's future

**Choice 5: Collateral Damage Decision (During Response Phase)**
- Stopping ENTROPY will disrupt legitimate business
- **Option A**: Minimize disruption (slower, protects business)
- **Option B**: Maximum effectiveness (fast, causes chaos)
- **Option C**: Coordinate with leadership (political, time-consuming)
- **Consequence**: Affects company's recovery and future relationship

**Choice 6: Priority Under Pressure (If Multiple Threats)**
- Can't stop everything; must choose what to protect
- **Option A**: Protect most people (utilitarian)
- **Option B**: Protect critical systems (strategic)
- **Option C**: Protect evidence (future-focused)
- **Consequence**: Shows player's values, affects casualties

**Branching Narrative Logic:**

Track player choices throughout all Act 2 phases to affect:
- NPC dialogue and trust levels (changes in real-time)
- Available information sources (helpful NPCs share more)
- Difficulty of later challenges (security alerted or cooperative)
- Which ending is reached
- Debrief tone and content
- Amount of LORE discovered

*Example:* If player chose to warn innocent employee (Phase 2), that NPC later provides crucial intelligence about attack timeline (Phase 3). If player let them take the fall, that path is closed but security is less alert during response phase.

**Act 2 Structure Summary:**

Act 2 should feel like a journey with multiple stages:
1. Investigation (gather clues)
2. Revelation (discover ENTROPY)
3. Understanding (learn their plans) [optional]
4. Response (work to stop them) [optional]
5. Escalation (complications arise)
6. Setup for confrontation

**Not all scenarios need all phases.** Simple scenarios might just have Investigation → Revelation. Complex scenarios might have all phases with multiple challenges in each.

**The key is flexibility**: Act 2 adapts to the scenario's needs while maintaining narrative momentum and player engagement.

**Act 2 Objectives (Flexible based on phases included):**

**Core Objectives:**
- ☐ Access secured areas (requires backtracking)
- ☐ Identify ENTROPY involvement
- ☐ Gather evidence of operations
- ☐ Make 3-5 major narrative choices

**Investigation Phase:**
- ☐ Access security systems
- ☐ Identify data exfiltration method / attack vector
- ☐ Decrypt ENTROPY communications

**Discovery Phase:**
- ☐ Discover ENTROPY agent identity
- ☐ Learn scope of evil plans
- ☐ Determine attack timeline

**Response Phase (if included):**
- ☐ Disable attack infrastructure
- ☐ Secure critical systems
- ☐ Prevent imminent threat
- ☐ Gather evidence while responding

**Universal:**
- ☐ Discover 3-5 LORE fragments
- ☐ Prepare for final confrontation

**Bonus Objectives:**
- ★ Find all LORE fragments
- ★ Access both secured locations for complete picture
- ★ Identify the insider before confrontation
- ★ Complete response without collateral damage
- ★ Maintain cover throughout investigation (don't alert suspect)
- ★ Discover secondary evil plans
- ★ Identify additional ENTROPY contacts

**Act 2 Ends When:**
- Player has identified ENTROPY agent(s)
- Evil plans are discovered (and potentially disrupted if that's part of Act 2)
- Evidence is sufficient for confrontation
- Player has made key narrative choices
- Final revelation has occurred
- Player is ready for climactic action in Act 3

**Note:** In some scenarios, Act 2 might include stopping the evil plan entirely, leaving Act 3 focused on confronting the agent and securing evidence. In others, Act 2 is pure investigation/discovery, with stopping the plan as part of Act 3. Both approaches are valid—design based on pacing needs.

---

### Act 3: Confrontation & Resolution (10-15 minutes)

**Purpose:** Climactic confrontation with villain, final puzzle challenges, player's last major choice about how to handle the situation, and mission resolution.

**Mandatory Elements:**
- Confrontation with ENTROPY agent (with player choice)
- Final evidence secured
- Mission objectives completed
- Optional incoming phone messages
- HQ debrief reflecting all player choices

**Narrative Elements to Consider:**

**Optional: Incoming Phone Messages**

Before or during final confrontation:

**Handler Support:**
- "Agent, backup is en route. ETA 20 minutes."
- "We've identified the target. Proceed with caution."
- "Intel just came through—this is bigger than we thought."

**Time Pressure:**
- "Agent, ENTROPY is initiating the attack NOW."
- "Data deletion in progress. Stop it or it's lost forever."
- "Target is attempting to escape. Intercept immediately."

**Complication:**
- "Agent, the company CEO just called. They want to handle this internally."
- "Local authorities inbound. You need to wrap this up before they arrive."
- "We have a problem: Another cell is involved."

**Personal Stakes:**
- "Agent 0x42 tried this mission last year. They barely made it out."
- "This is the same cell that hit us last month."
- Recurring villain message: "Hello again, Agent 0x00..."

*Timing:* These can interrupt player or play at key moment for dramatic effect

**The Confrontation:**

When player faces ENTROPY agent, present clear choice:

**Option A: Practical Exploitation**
> "I know what you are. Unlock your evidence vault for me, or I call this in right now."

- Fastest option
- Uses villain as tool
- Morally grey—coercion of a criminal
- Villain cooperates under duress
- Risk: Villain might have dead man's switch

**Option B: By the Book Arrest**
> "It's over. You're under arrest for espionage. You have the right to remain silent."

- Most ethical approach
- Follows all protocols
- Must find evidence independently
- Takes longer but satisfying
- Earns respect from handler

**Option C: Aggressive Confrontation**
> "ENTROPY. You're done." [Combat]

- Immediate action
- No negotiation
- Triggers combat encounter
- Fast but loses interrogation opportunity
- Shows decisive nature

**Option D: Recruitment/Flip**
> "ENTROPY is burning their assets. You're exposed. Work with us—become a double agent—and we'll protect you."

- Requires evidence of villain's precarious position
- High-risk, high-reward
- Ongoing intelligence if successful
- Requires trust/leverage
- Can fail → leads to combat or escape

**Option E: Extract Information First**
> "Before we finish this, I need names. Who else is working for ENTROPY?"

- Interrogation before resolution
- Reveals additional cells/agents
- Shows patient investigation
- Takes most time
- Maximum intelligence gain

**Option F: Let Them Explain**
> "Why? Why do this?"

- Philosophical/personal discussion
- Understand motivation
- May reveal sympathetic circumstances
- Humanizes villain
- Player might feel conflicted about arrest

**Each choice leads to different mechanical resolution but all can succeed.**

**Final Challenges:**

Consider ending with:

**Time-Pressure Puzzle:**
- Data deletion in progress
- System lockout countdown
- Evacuation timer
- Requires quick thinking under pressure

**Multi-Stage Security:**
- Final safe with advanced locks
- Multiple authentication methods
- Combines all learned skills
- Final test of competency

**Escape Sequence:**
- Building lockdown initiated
- Security systems activated
- Must navigate out with evidence
- Action-oriented conclusion

**Moral Dilemma Resolution:**
- Choice from Act 2 pays off here
- NPC player helped/hurt returns
- Consequence of earlier decision
- Player sees impact of their choices

**Evidence Preservation:**
- Villain has dead man's switch
- Evidence will be destroyed
- Must choose: Arrest OR preserve evidence
- No perfect solution

**Final Revelation:**
- Evidence reveals larger conspiracy
- Villain is actually mid-level operative
- Real threat still out there
- Sets up future scenarios

**Mission Completion:**

All primary objectives must be completable regardless of choices:
- ✓ Evidence secured (method varies)
- ✓ ENTROPY agent dealt with (method varies)
- ✓ Threat neutralized (degree varies)
- ✓ Company protected (level varies)

**Optional Objectives Based on Choices:**
- ★ Recruited double agent
- ★ Identified additional cells
- ★ Protected all innocents
- ★ Completed without alerts
- ★ Found all LORE fragments

**Act 3 Ends With Mission Complete.**

---

### Post-Mission: HQ Debrief (3-5 minutes, outside core timer)

**Purpose:** Reflect player's narrative choices, reveal consequences, acknowledge methods used, provide closure, and tease future threats.

**Mandatory Elements:**
- Handler acknowledges mission success
- Reflection on player's methods and choices
- Impact on ENTROPY operations revealed
- Updates to player specializations (CyBOK areas)
- Connection to larger ENTROPY network
- (Optional) Teaser for future scenarios

**Debrief Structure:**

**Handler Opening:**
> "Welcome back, Agent 0x00. Let's debrief."

**Mission Results:**
Acknowledge what was accomplished:
- ENTROPY agent status (arrested/recruited/escaped)
- Evidence secured (complete/partial)
- Threat level (eliminated/reduced/ongoing)
- Company status (secure/damaged/compromised)

**Reflection on Methods:**

This is where player choices are acknowledged WITHOUT heavy moral judgment:

**If Pragmatic/Grey Choices:**
> "Your methods were... creative. Effective, but ethically complex. Results matter, though we'll be having a conversation about Section 19."

**If By-the-Book:**
> "Textbook operation. Professional, clean, minimal collateral. Director Netherton will be pleased."

**If Aggressive:**
> "Well, you certainly sent a message. The paperwork will be substantial, but the threat is neutralized."

**If Recruited Asset:**
> "Risky play, flipping an ENTROPY operative in the field. Bold. You'll be handling this asset going forward—don't mess it up."

**If Thorough Investigation:**
> "Patience and thoroughness. The additional intelligence you gathered will save months of investigation."

**If Mixed/Messy:**
> "Mission accomplished, though there were complications. Lessons learned for next time."

**Consequences Revealed:**

Show impact of player's specific choices:

**Company Fate:**
- Legitimate business: Recovering/grateful/traumatized/suing
- Controlled corp: Shut down/seized/under investigation

**NPC Outcomes:**
- Innocent employees: Protected/caught in crossfire/traumatized
- Compromised NPCs: Arrested/protected/recruited/deceased
- Helpful NPCs: Grateful/felt used/became long-term ally

**ENTROPY Impact:**
- Cell: Disrupted/destroyed/warned/ongoing
- Larger network: Intelligence gained/connections revealed/still mysterious

**Intelligence Gained:**

Handler reveals what was learned:
> "The vulnerability marketplace you uncovered? It's part of ENTROPY's Zero Day Syndicate operation. We've seen communications suggesting '0day' was buying the stolen assessments."

**Connection to Larger Threat:**
> "This wasn't an isolated operation. The [evidence type] suggests ENTROPY has similar operations at [number] other organizations. We'll be watching for their pattern."

**Reference to Masterminds:**
> "The Architect's signature is all over this operation. This was coordinated at the highest levels."

**Specialization Updates:**
> "Your [specific skills used] were solid. I'm updating your CyBOK specializations to reflect expertise in [relevant areas]."

**Field Operations Handbook Callback (Optional):**
> "Per Section 14, Paragraph 8: When missions succeed and protocols are followed, agents receive commendation. Though I'm not sure all protocols were followed..." [knowing look]

**Personal Touch from Handler:**
- Agent 0x99: "Between you and me, [personal observation]. Stay sharp."
- Director Netherton: "Per Protocol [number], [bureaucratic praise]. Well done."

**Teaser for Future (Optional):**
> "One more thing, Agent. [Foreshadowing of recurring villain / larger threat / connected operation]. We'll be seeing more of this pattern. Excellent work out there."

**Closing:**
> "Get some rest, Agent. Something tells me we'll need you again soon."

---

## Narrative Checklist for Scenario Authors

Before finalizing scenario, verify:

**Act 1:**
- [ ] Briefing establishes stakes and authorization
- [ ] Starting room has meaningful immediate interactions
- [ ] 3+ locked areas visible create investigation goals
- [ ] Player's initial choices matter (branching logic)
- [ ] Something suspicious is established

**Act 2:**
- [ ] "Things aren't as they seemed" revelation included
- [ ] Villain has voice/personality (monologue or evidence)
- [ ] 3-5 major player narrative choices presented
- [ ] 3-5 LORE fragments discoverable
- [ ] Choices affect NPC relationships and available paths
- [ ] Investigation builds to climactic confrontation

**Act 3:**
- [ ] Confrontation presents 5-6 distinct options
- [ ] All primary objectives completable in all paths
- [ ] Optional objectives vary by choices made
- [ ] Final challenges test learned skills
- [ ] Mission completion feels earned

**Debrief:**
- [ ] Acknowledges specific player choices
- [ ] Shows consequences without harsh judgment
- [ ] Reveals intelligence gained
- [ ] Connects to larger ENTROPY network
- [ ] Updates player specializations
- [ ] Provides closure with optional teaser

**Overall Narrative:**
- [ ] Story is logically connected across acts
- [ ] Moral grey areas are interesting and appealing
- [ ] SAFETYNET authorization provides player permission
- [ ] Technical challenges integrate with narrative
- [ ] Multiple endings reflect meaningful choices
- [ ] Educational content works in all branches

**The Golden Rule:** Outline narrative completely before implementing technical details. Story and puzzles must support each other.

---

## Organization Type Selection

Before designing the narrative, select the appropriate ENTROPY cell and antagonist(s) for your scenario.

**Selection Criteria:**

### 1. Match Educational Objectives to Cell Specialisation
- Teaching social engineering? → Digital Vanguard or Social Fabric
- Teaching SCADA/ICS security? → Critical Mass
- Teaching cryptography? → Zero Day Syndicate or Quantum Cabal
- Teaching AI security? → AI Singularity
- Teaching incident response? → Ransomware Incorporated
- Teaching insider threats? → Insider Threat Initiative

### 2. Match Scenario Type to Cell Operations
- Corporate infiltration → Digital Vanguard or Insider Threat Initiative
- Infrastructure defence → Critical Mass
- Research facility → Quantum Cabal or AI Singularity
- Dark web investigation → Zero Day Syndicate or Ghost Protocol
- Disinformation campaign → Social Fabric

### 3. Choose: Controlled Corporation vs. Infiltrated Organization

This is a critical design decision that significantly affects scenario tone and gameplay.

**Controlled Corporation Scenarios:**
- **When to Use**:
  * Player is infiltrating enemy territory
  * Want clear "us vs. them" dynamic
  * Scenario focused on stealth/evasion
  * Teaching offensive security techniques
  * Want to show full ENTROPY cell operations

- **Characteristics**:
  * Most/all employees are ENTROPY or coerced
  * Entire facility may be hostile
  * More potential for combat encounters
  * Can discover extensive operations
  * Victory = shutting down entire operation

- **Examples**:
  * Infiltrating Tesseract Research Institute
  * Raiding Paradigm Shift Consultants
  * Breaking into HashChain Exchange

- **NPC Dynamics**:
  * Few truly helpful NPCs
  * Most NPCs suspicious or hostile
  * Social engineering is high-risk
  * Cover story must be very convincing

**Infiltrated Organization Scenarios:**
- **When to Use**:
  * Player is investigating from within
  * Want social deduction elements
  * Teaching defensive security/detection
  * Scenario focused on investigation
  * Want ethical complexity

- **Characteristics**:
  * Most employees are innocent
  * Must identify who is ENTROPY
  * Detective work and evidence gathering
  * Protecting innocents while stopping threats
  * Victory = removing agents, organization continues

- **Examples**:
  * Nexus Consulting with corrupted Head of Security
  * University with compromised quantum researcher
  * Power company with insider threat

- **NPC Dynamics**:
  * Many helpful, innocent NPCs
  * 1-3 NPCs are secretly ENTROPY
  * Social engineering encouraged
  * Must build trust to identify suspects

**Hybrid Scenarios (Advanced):**
- **When to Use**:
  * Want to show ENTROPY network structure
  * Multi-location operations
  * Teaching about supply chain attacks
  * More complex narratives

- **Structure**:
  * Start at infiltrated organization
  * Evidence leads to controlled corporation
  * Or: Start at controlled corp, discover infiltrated clients

- **Examples**:
  * TalentStack (controlled) placing agents at defense contractor (infiltrated)
  * Consulting firm (controlled) steals data from clients (infiltrated)
  * Legitimate company unknowingly using ENTROPY vendor

**Decision Matrix:**

| Aspect | Controlled Corp | Infiltrated Org |
|--------|----------------|-----------------|
| **Player Role** | Infiltrator | Investigator |
| **Difficulty** | Higher (hostile) | Moderate (mixed) |
| **NPC Trust** | Low baseline | High baseline |
| **Evidence** | Everywhere | Concentrated |
| **Combat** | More likely | Less likely |
| **Moral Complexity** | Lower | Higher |
| **Victory Scope** | Shut down operation | Remove agents |
| **Educational Focus** | Offensive security | Defensive security |

### 4. Villain Tier Selection
- **Tier 1 (Masterminds)**: Background presence only, referenced in intel
- **Tier 2 (Cell Leaders)**: Main antagonist, can escape to recur
- **Tier 3 (Specialists)**: Supporting antagonist, can be defeated

### 5. Recurring vs. New Characters
- First scenario in a series: Introduce new cell leader
- Mid-series scenario: Feature recurring villain with character development
- Final scenario in arc: Resolve recurring villain storyline
- Standalone scenario: Use Tier 3 specialist or create one-off antagonist

**Example Selections:**

**Scenario**: "Grid Down" - Prevent power grid attack
**Organization Type**: Infiltrated (legitimate power company)
**Cell**: Critical Mass
**Primary Villain**: "Blackout" (Tier 2 Cell Leader) - embedded as contractor
**Supporting**: "SCADA Queen" (Tier 3 Specialist) - remote support
**Background**: The Architect (referenced in intercepted communications)
**Educational Focus**: ICS/SCADA security, incident response, insider threat detection
**Player Role**: Brought in as security consultant, must identify insider

**Scenario**: "Quantum Nightmare" - Stop eldritch summoning
**Organization Type**: Controlled (Tesseract Research Institute)
**Cell**: Quantum Cabal
**Primary Villain**: "The Singularity" (Tier 2 Cell Leader) - runs facility
**Supporting**: Cultist researchers (all ENTROPY)
**Background**: Mx. Entropy (referenced in research notes)
**Educational Focus**: Quantum cryptography, advanced encryption, atmospheric horror
**Player Role**: Infiltrating hostile facility, stealth-focused

**Scenario**: "Corporate Secrets" - Investigate data exfiltration
**Organization Type**: Infiltrated (legitimate consulting firm)
**Cell**: Digital Vanguard
**Primary Villain**: "Insider Trading" (Tier 3 Specialist) - mid-level manager
**Supporting**: Corrupted employees (2-3 NPCs compromised)
**Background**: The Liquidator (referenced as handler of insider)
**Educational Focus**: Social engineering, insider threat detection, data loss prevention
**Player Role**: Security auditor, must determine who is compromised

---

## Balancing Education and Gameplay

### Core Principle
Educational objectives must integrate naturally with gameplay without feeling like "homework."

**Good Integration:**
- Encrypted message contains crucial evidence (players want to decrypt it)
- Log analysis reveals insider threat (investigative necessity)
- Social engineering gets passwords (practical gameplay benefit)

**Poor Integration:**
- "Complete this cipher to proceed" (arbitrary gate)
- "Study this security concept" (academic interruption)
- "Answer quiz questions" (breaks immersion)

### Educational Content Delivery

**In-Game Integration:**
- LORE fragments teach concepts through narrative
- NPC dialogue explains techniques contextually
- Environmental clues demonstrate security principles
- Puzzles require applying learned skills

**Meta-Game Resources:**
- Post-mission briefings summarize CyBOK areas covered
- Optional "Technical Notes" expand on concepts
- Achievement system encourages exploring different approaches
- Scenario hints reference real security documentation

### Scaffolded Learning

**Beginner Scenarios:**
- Introduce one concept at a time
- Provide clear guidance and hints
- Simple encoding (Base64, hex)
- Basic social engineering
- Obvious clues

**Intermediate Scenarios:**
- Combine multiple concepts
- Less explicit guidance
- Symmetric encryption (AES)
- Multi-stage puzzles
- Evidence correlation

**Advanced Scenarios:**
- Complex multi-concept challenges
- Minimal guidance
- Asymmetric cryptography (RSA)
- VM exploitation
- Non-obvious solutions

### Testing and Iteration

**Playtest Questions:**
1. Can players complete educational objectives without external help?
2. Do puzzles feel like meaningful gameplay or arbitrary gates?
3. Is the difficulty appropriate for target skill level?
4. Do players learn concepts or just memorize solutions?
5. Does the narrative enhance or distract from learning?

**Iteration Based on Feedback:**
- Too difficult → Add contextual hints
- Too easy → Remove explicit solutions
- Confusing → Improve signposting
- Boring → Integrate better with narrative
- Educational value unclear → Add debrief summary

---

*This framework provides the foundation for creating engaging, educational, and narratively rich Break Escape scenarios. Use it as a guide, not a rigid template, to craft experiences that teach cybersecurity through compelling gameplay.*
