# World Rules & Tone

## Overview

Break Escape exists in a carefully balanced world where authentic cyber security sits at the heart of every story, but entertainment and player engagement remain paramount. This document establishes the hard boundaries of what's possible in this universe, the tone we maintain, and the rules that keep our world consistent.

---

## Core Narrative Rules

### Rule 1: Cyber Security First

**Every scenario must involve authentic cyber security concepts, tools, or challenges. The game is educational—accuracy matters more than convenience.**

**What This Means:**
- Real tools (CyberChef, Wireshark, Nmap, Metasploit)
- Authentic attack vectors (SQL injection, phishing, privilege escalation)
- Legitimate defensive measures (encryption, 2FA, network segmentation)
- Actual vulnerabilities (buffer overflows, XSS, weak credentials)
- Professional terminology (not Hollywood hacker nonsense)

**Boundaries:**
- NO magical hacking (typing fast doesn't breach systems)
- NO instant system compromise (real exploits take time)
- NO "I'm in" without showing how
- NO technobabble that sounds cool but means nothing
- NO impossible feats disguised as "advanced AI"

**Design Principle:**
If a real penetration tester or security researcher would call it unrealistic, don't include it.

---

### Rule 2: Physical-Cyber Convergence

**Modern threats span both domains. Most scenarios should require both physical and digital security engagement.**

The Break Escape world recognizes that:
- Physical access often enables cyber breaches
- Social engineering bridges both worlds
- Security badges unlock both doors and systems
- Shoulder surfing reveals credentials
- Dumpster diving discovers passwords
- Lock-picking provides network access

**Scenario Design:**
Require players to:
- Navigate physical spaces to reach digital targets
- Use social engineering in person
- Combine lockpicks with login credentials
- Manipulate both guards and firewalls
- Think like real-world penetration testers

---

### Rule 3: Self-Contained Stories

**Each scenario is a complete operation. Players should understand the beginning, middle, and end within one session (~1 hour).**

**Structure Requirements:**
- Clear briefing establishing stakes
- Complete investigation with discoveries
- Definitive resolution with consequences
- Post-mission debrief showing impact

**Continuity Elements:**
While each scenario is self-contained:
- Recurring villains can appear
- LORE fragments build broader narrative
- Player reputation (Hacker Cred) carries forward
- Organization mythology deepens over time
- References to past operations create world depth

---

### Rule 4: Legal Framework - The "License to Hack"

**CRITICAL DESIGN PRINCIPLE:** The SAFETYNET framework provides legal and moral authorization for player actions. This is the equivalent of James Bond's "license to kill"—players are authorized to take actions that would otherwise be illegal or ethically questionable.

#### Player Permission Structure

**Players are authorized to:**
- Conduct offensive cyber operations against targets
- Break into systems without explicit permission
- Manipulate NPCs through social engineering
- Exploit vulnerabilities for mission objectives
- Make morally grey choices without guilt
- Engage in spy activities with legal protection
- Use SAFETYNET authorization to bypass ethical constraints

#### Why This Matters for Design

1. **Player Enjoyment**: This is a GAME—players understand it's not real life and want to enjoy being secret agents
2. **Ethical Exploration**: Grey choices are MORE interesting and MORE fun than black-and-white ones
3. **Replayability**: Different moral approaches create distinct, enjoyable playthroughs
4. **Educational Value**: Real security work involves ethical dilemmas worth exploring
5. **Narrative Depth**: Moral complexity creates better, more memorable stories

#### Design Imperatives

- **Make morally grey choices APPEALING, INTERESTING, and FUN**
- Don't punish players for pragmatic/creative solutions
- All successful approaches are valid—consequences differ, but methods aren't condemned
- Debriefs acknowledge choices without heavy moral judgment
- Use language: "Effective but ethically complex" NOT "wrong" or "bad"
- "By the book" is ONE approach, NOT "the only right way"
- Players should feel empowered to explore different methods

#### In Every Briefing, Emphasize Authorization

> "You are authorized under [REDACTED] protocols to conduct offensive operations..."

> "Per Section [X], your cover story provides legal framework for any necessary actions..."

> "The Field Operations Handbook grants broad discretion in achieving mission objectives..."

This framework removes player guilt and enables them to fully enjoy the spy fantasy without worrying about real-world ethics. **Players know this is a game and should have fun with it.**

---

### Rule 5: Progressive Challenge

**Scenarios can be played by rookie or expert agents. NPC dialogue and optional objectives adapt to player's Hacker Cred and specializations.**

**Implementation:**
- Basic objectives accessible to beginners
- Optional objectives for experienced players
- NPC hints scale to player skill level
- Multiple solution paths of varying complexity
- Advanced techniques reward but aren't required

---

### Rule 6: Mandatory 3-Act Structure

**All scenarios follow the 3-act structure with flexible narrative elements. Narrative must be outlined completely before technical implementation begins.**

**Process:**
1. Design the story
2. Map technical challenges to narrative beats
3. Implement in JSON

No shortcuts. Story comes first.

---

## Tone Guidelines

### Primary Tone: Mostly Serious

The default tone is professional espionage grounded in realistic cyber security:
- Genuine threats with real consequences
- Professional terminology and procedures
- Authentic technical challenges
- Legitimate security concepts
- Serious stakes for mission failure

### Secondary Tone: Comedic Moments

Comedy appears strategically but never undermines tension:
- Quirky recurring characters
- Bureaucratic absurdities (Field Operations Handbook)
- Spy trope humor (gadget names, villain conventions)
- Self-aware moments that enhance rather than break immersion

### Comedy Rules

#### Comedy Rule 1: Punch Up
Mock bureaucracy, spy tropes, and villain incompetence—not security victims or real-world breaches.

**Good Targets:**
- SAFETYNET's bureaucracy
- Field Operations Handbook absurdities
- Villain over-the-top schemes
- Spy movie tropes
- Corporate security theater

**Bad Targets:**
- Real-world breach victims
- Actual security professionals
- Legitimate security failures
- People harmed by cybercrime

#### Comedy Rule 2: Recurring Gags
Maximum one instance per scenario of:
- Field Operations Handbook absurdity
- Character catchphrases
- ENTROPY naming conventions

**Why Limited:**
- Prevents gags from becoming annoying
- Maintains freshness
- Keeps focus on genuine moments

#### Comedy Rule 3: Never Undercut Tension
Don't break tension during puzzle-solving or revelations.

**Comedy appears in:**
- Mission briefings
- NPC conversations
- Item descriptions
- Post-mission debriefs

**Comedy does NOT appear during:**
- Critical revelations
- Puzzle solving moments
- Climactic confrontations
- Evidence discovery

#### Comedy Rule 4: Grounded Absurdity
Humor comes from realistic situations pushed slightly.

**Good Examples:**
- "OptimalChaos Advisory" (chaos engineering is real)
- Field Operations Handbook with contradictory rules
- Villain with elaborate but technically sound scheme

**Bad Examples:**
- "TotallyNotEvil Corp" (too on-the-nose)
- Impossible technology played for laughs
- Breaking established world rules for comedy

---

## The Field Operations Handbook

A never-fully-seen rulebook that SAFETYNET agents must follow. Source of recurring bureaucratic humor.

### Usage Guidelines
- Maximum ONE reference per scenario
- Should be relevant to situation
- Creates comedic but plausible bureaucracy
- Reflects spy fiction conventions
- Never undermines mission seriousness

### Sample Rules

**Section 7, Paragraph 23:**
"Agents must always identify themselves to subjects under investigation, unless doing so would compromise the mission, reveal the agent's identity, be inconvenient, or occur on days ending in 'y'."

**Protocol 404:**
"If a security system cannot be found in the building directory or network map, it does not exist. Therefore, bypassing non-existent security is both prohibited under Section 12 and mandatory under Protocol 401."

**Regulation 31337:**
"Use of 'l33tspeak' in official communications is strictly forbidden. Agents caught using such terminology will be required to complete Formal Language Remediation Training (FLRT) consisting of reading RFC 2119 aloud. This restriction does not apply to usernames, handles, or when it's really funny."

**Appendix Q, Item 17:**
"Social engineering is authorized when necessary for mission completion. However, agents must expense all coffee, meals, or gifts used in said social engineering. Expense reports must specify 'manipulation via caffeinated beverage' rather than 'coffee'."

**Emergency Protocol 0:**
"In the event of catastrophic mission failure, agents should follow standard extraction procedures as outlined in Section [PAGES MISSING]. Good luck."

**Directive 256:**
"Encryption is mandatory for all communications except when communicating about encryption, which must be done via unencrypted channels to avoid suspicion."

---

## Physics & Technology Limits

### What EXISTS in This World

**Current Technology (2025):**
- All real cyber security tools and techniques
- Modern encryption standards
- Contemporary network infrastructure
- Current AI capabilities (not sci-fi)
- Standard lockpicking and physical security
- Real social engineering methods
- Actual forensic techniques

**Bleeding Edge Technology:**
- Quantum computing (in research phase)
- Advanced AI (within current capabilities)
- Zero-day exploits (sophisticated but real)
- State-level surveillance tech
- Advanced biometrics
- Sophisticated social engineering AI

### What DOES NOT EXIST

**Forbidden Elements:**
- Sci-fi "technobabble" hacking
- Instant system compromise
- Magic disguised as technology
- Impossible AI capabilities
- Teleportation or time travel
- Actual supernatural powers (see Quantum Cabal section)
- Breaking laws of physics
- Hollywood-style hacking

### The Quantum Cabal Ambiguity

**Special Case: Deliberate Ambiguity**

The Quantum Cabal represents the ONE intentional grey area in our otherwise grounded world.

**What We Know:**
- They use quantum computing for experiments
- Their operations produce unexplained results
- They reference "eldritch entities" and "reality barriers"
- Their facilities contain occult symbols mixed with tech

**What We DON'T Know:**
- Are they actually summoning supernatural entities?
- Or using psychological operations with scientific results?
- Are the "anomalies" real or staged?
- Is it advanced technology or genuine supernatural?

**Design Principle:**
NEVER definitively answer whether supernatural elements are real. The ambiguity is intentional.

**Implementation:**
- Strange results can always be explained technically OR supernaturally
- NPCs disagree about what's really happening
- Evidence supports both interpretations
- Player decides what to believe
- Debriefs acknowledge ambiguity without resolving it

**Why This Works:**
- Adds mystery without breaking grounded tone
- Allows for atmospheric scenarios
- Tests player critical thinking
- Creates memorable experiences
- Maintains world consistency (tech is real, supernatural is ambiguous)

---

## Death & Violence

### Violence Rules

**SAFETYNET is NOT a violent organization:**
- Missions focus on intelligence gathering
- Combat is rare and treated seriously
- Lethal force is last resort
- Debriefs question violent approaches
- Non-lethal methods are preferred

**When Violence Occurs:**
- Contextually justified (self-defense, protection)
- Has narrative consequences
- Affects mission rating
- Influences NPC reactions
- May trigger investigation by SAFETYNET oversight

### Death Rules

**Player Death:**
- Possible but rare
- Clearly signposted dangers
- Results from poor planning or reckless choices
- Allows scenario restart
- Encourages careful approach

**NPC Death:**
- Civilians should not die in scenarios
- ENTROPY operatives may die if player chooses violence
- Deaths have consequences (investigations, complications)
- Game acknowledges moral weight
- Affects player reputation

---

## Collateral Damage

### System Damage
- Breaking systems has consequences
- Corporate targets suffer real losses
- Innocent employees may be affected
- Debriefs acknowledge impact
- "Clean" operations preferred but not required

### Information Exposure
- Exposing secrets creates ripples
- Whistleblowing may occur
- Public learns about breaches
- Companies face consequences
- Society responds to revelations

---

## Scale & Scope

### What SAFETYNET Can Do
- Conduct covert operations
- Infiltrate organizations
- Gather intelligence
- Neutralize ENTROPY cells
- Protect critical infrastructure

### What SAFETYNET CANNOT Do
- Prevent all attacks
- Operate publicly
- Enforce laws openly
- Defeat ENTROPY permanently
- Protect everyone everywhere

### Why Neither Side Wins

**ENTROPY's Advantages:**
- Decentralized structure (cutting one cell doesn't stop others)
- Operates in shadows
- Recruits continuously
- Adapts quickly
- No legal constraints

**SAFETYNET's Advantages:**
- Government resources
- Legal authorization
- Technical expertise
- Intelligence networks
- Defensive posture

**The Balance:**
Neither can eliminate the other completely. This creates ongoing conflict essential for the game's narrative.

---

## Inspirational Touchstones

### Get Smart
- Bureaucratic spy comedy
- Competent heroes, bumbling villains (sometimes)
- Recurring gags used sparingly
- Professional tone with comic moments

### James Bond
- Sophisticated espionage
- High-stakes infiltration
- License to operate outside normal rules
- Style and professionalism

### I Expect You To Die
- Environmental puzzle-solving
- Spy fantasy scenarios
- Villain presentations
- Death traps and clever escapes

### Real Cyber Security
- Actual tools and techniques
- Authentic attack vectors
- Legitimate defense measures
- Professional practices

---

## Consistency Guidelines

### Maintaining World Rules

**When Creating Scenarios:**
1. Check if new element respects established rules
2. Verify technology is plausible
3. Ensure tone matches guidelines
4. Confirm cyber security is authentic
5. Test if violence is justified narratively

**When Adding Characters:**
1. Do they fit organizational profiles?
2. Are their motivations consistent?
3. Do their skills match world technology?
4. Is their personality distinct but appropriate?

**When Introducing Tech:**
1. Does it exist in 2025?
2. Can it be explained realistically?
3. Does it serve gameplay or just sound cool?
4. Would real security professionals accept it?

---

## Edge Cases

### When Rules Seem to Conflict

**Example:** Rule says "be realistic" but also "make it fun"

**Resolution:** Fun comes first, but within realistic boundaries. Find creative solutions that satisfy both.

**Example:** Player wants to do something impossible but clever

**Resolution:** Reward creativity by finding plausible alternative that achieves similar result.

### Updating Rules

This document can evolve, but changes should:
- Be discussed and documented
- Apply consistently going forward
- Not break existing scenarios retroactively
- Enhance rather than restrict creativity

---

## Summary Checklist

Before finalizing any scenario, verify:

- [ ] Authentic cyber security at core
- [ ] Physical and digital security combined
- [ ] Self-contained story arc
- [ ] SAFETYNET authorization clear
- [ ] Progressive difficulty present
- [ ] 3-act structure implemented
- [ ] Tone appropriate (serious with strategic comedy)
- [ ] No impossible technology
- [ ] Quantum Cabal ambiguity maintained (if applicable)
- [ ] Violence justified and consequential
- [ ] World consistency maintained

---

**Version:** 1.0
**Last Updated:** November 2025
**Maintained by:** Break Escape Design Team
