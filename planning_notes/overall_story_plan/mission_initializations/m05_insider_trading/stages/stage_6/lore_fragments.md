# Stage 6: LORE Fragments - Mission 5 "Insider Trading"

## Overview

**Mission:** M05 - Insider Trading
**ENTROPY Cell:** Insider Threat Initiative
**Fragment Count:** 4 (3 critical evidence, 1 technical context)
**Discovery Pattern:** Progressive revelation of ENTROPY's insider recruitment methodology

**LORE Arc:** Fragments reveal systematic nature of insider recruitment, showing Torres is not isolated incident but part of calculated program. Evidence documents expose targeting criteria, communication protocols, and broader ENTROPY network.

---

## Fragment Budget & Distribution

**Total Fragments:** 4

**Distribution by Difficulty:**
- **Easy (Always accessible):** 1 fragment (Break Room)
- **Medium (Investigation reward):** 1 fragment (Server Room cabinet)
- **Hard (Optional exploration):** 2 fragments (Research Lab, Archive Storage)

**Evidence Documents:** 3 fragments
**Technical Context:** 1 fragment

**Variable Tracking:**
```ink
VAR found_recruiting_pamphlet = false
VAR found_architect_protocol = false
VAR found_heisenberg_specs = false
VAR found_target_criteria = false
```

---

## Fragment 1: Insider Threat Initiative - Recruiting Pamphlet

**Category:** Operational Documents (Evidence)
**Difficulty:** Easy (Always accessible)
**Location:** Break Room - Lost & Found Box (2, 4)
**Discovery:** No prerequisites, player finds during initial exploration

**Purpose:**
- Establishes Insider Threat Initiative as systematic program
- Shows financial targeting of vulnerable employees
- Reveals recruiting narrative ("helping whistleblowers")
- Foreshadows Torres' manipulation

**Fragment ID:** `lore_insider_recruiting`
**Word Count:** ~180 words

### Content

```
═══════════════════════════════════════════════════════
INSIDER THREAT INITIATIVE - OPERATIONAL OVERVIEW
Classification: ENTROPY INTERNAL USE ONLY
Distribution: Cell Leaders, Recruitment Division
═══════════════════════════════════════════════════════

MISSION STATEMENT:
The Insider Threat Initiative identifies and recruits
high-value employees within target organizations suffering
financial or personal crises.

RECRUITMENT METHODOLOGY:

Phase 1: TARGET IDENTIFICATION
- Financial distress (medical debt, gambling, divorce)
- Access to classified/valuable data
- Clean security record (no prior flags)
- Emotional vulnerability (family crisis, substance abuse)

Phase 2: INITIAL CONTACT
- Approach via encrypted channels
- Offer financial compensation for data exfiltration
- Introduce "accelerationist" ideology (system must collapse)
- Frame target as freedom fighter against corrupt institutions

Phase 3: RADICALIZATION & ESCALATION
- Gradually indoctrinate with extremist philosophy
- Justify casualties as "necessary collateral for greater good"
- Increase payment amounts
- Create ideological + financial dependency
- Leverage compromising evidence if necessary

CURRENT OPERATIONS: 22 active placements
ANNUAL REVENUE: $180-240 million (stolen data sales)

TARGET SECTORS: Defense, Technology, Healthcare, Finance

[Handwritten note at bottom]:
"Remember - they're not criminals. They're desperate people
we're helping. The truth about buyers comes later."
- The Recruiter

[Another note, different handwriting]:
"Approved. Increase targeting budget by 40%. Priority:
quantum computing sector."
- [The Architect's symbol]
═══════════════════════════════════════════════════════
```

**Metadata:**
```json
{
  "type": "notes",
  "id": "lore_insider_recruiting",
  "name": "Insider Threat Initiative - Recruiting Pamphlet",
  "category": "lore_fragment",
  "subcategory": "operational_document",
  "takeable": true,
  "readable": true,
  "observations": "A folded document describing ENTROPY's insider recruitment program. Appears to have been discarded.",
  "onPickup": "#set_variable:found_recruiting_pamphlet=true",
  "loreValue": 10,
  "discoveryDialogue": "This document describes a systematic program for recruiting insiders. Torres wasn't a one-off target—this is a calculated operation."
}
```

**Design Notes:**
- First fragment player finds, establishes ENTROPY's methodology
- Shows Torres fits exact profile (medical debt, access, clean record, family crisis)
- "Investigative journalists" lie confirms Torres' journal entries about believing he was helping expose corruption
- 22 active placements = ongoing threat beyond this mission
- Handwritten notes add authenticity and reveal The Recruiter + The Architect's approval

---

## Fragment 2: The Architect's Communication Protocol

**Category:** Communications (Evidence)
**Difficulty:** Medium (Server Room cabinet - requires SERVER_CABINET_KEY)
**Location:** Server Room - Server Rack Cabinet (6, 6)
**Discovery:** After finding cabinet key during investigation

**Purpose:**
- Reveals The Architect's direct involvement in Operation Schrödinger
- Shows centralized ENTROPY command structure
- Provides specific casualty projections (12-40 intelligence officers)
- Proves this is not rogue operation but sanctioned by ENTROPY leadership

**Fragment ID:** `lore_architect_protocol`
**Word Count:** ~185 words

### Content

```
═══════════════════════════════════════════════════════
ENCRYPTED COMMUNICATION LOG - OPERATION SCHRÖDINGER
Classification: ARCHITECT EYES ONLY
From: [The Architect]
To: The Recruiter (Insider Threat Initiative)
Subject: Target Quantum Dynamics - Authorization
═══════════════════════════════════════════════════════

The Recruiter,

Authorization granted for Operation Schrödinger.

TARGET: Quantum Dynamics Corporation
OBJECTIVE: Exfiltrate Project Heisenberg quantum
cryptography research (4.2 TB)

ASSET: David Torres, PhD - Cryptography Lead
VULNERABILITY: Medical debt ($180K), wife terminal illness
RECRUITMENT STATUS: Active, 73% exfiltration complete

DISTRIBUTION PLAN:
- Primary buyer: Chinese MSS ($28 million)
- Secondary buyer: Russian GRU ($22 million)
- Tertiary buyer: Iranian MOIS ($18 million)
PROJECTED REVENUE: $68 million

STRATEGIC IMPACT ASSESSMENT:
- U.S. quantum crypto advantage: ELIMINATED
- Retroactive decryption of classified comms: ENABLED
- Projected intelligence officer casualties: 12-40
- DoD quantum program: $4.2 billion WASTED

RISK LEVEL: Medium-Low
- Asset informed of foreign government buyers (MSS, GRU, IRGC)
- Asset informed of casualty projections (12-40 officers)
- Asset has rationalized through "accelerationist" ideology
- Radicalization only 3 months - if compromised, may be salvageable
- Asset classified as EXPENDABLE if operation exposed

TIMELINE:
- Exfiltration completion: 14 days
- Analysis & packaging: 21 days
- Distribution to buyers: 35 days
- First casualties (retroactive decryption): 60-90 days

STATUS: Approved. Proceed as planned.

Do NOT inform asset of true buyers until data secured.
Maintain "whistleblowing" narrative for now.

If compromised: Asset is expendable. Prioritize data.

[The Architect's symbol]
═══════════════════════════════════════════════════════
```

**Metadata:**
```json
{
  "type": "notes",
  "id": "lore_architect_protocol",
  "name": "The Architect's Communication Protocol - Operation Schrödinger",
  "category": "lore_fragment",
  "subcategory": "classified_communication",
  "takeable": true,
  "readable": true,
  "observations": "Encrypted communication from The Architect authorizing Operation Schrödinger. Highly classified.",
  "onPickup": "#set_variable:found_architect_protocol=true #increment:evidence_level",
  "loreValue": 15,
  "discoveryDialogue": "The Architect personally authorized this operation. This proves ENTROPY leadership approved selling quantum crypto research to foreign governments, knowing it would cost lives."
}
```

**Design Notes:**
- **CRITICAL EVIDENCE** - proves Torres manipulated, didn't know about foreign governments
- Specific numbers: $68M revenue, 12-40 casualties, 4.2 TB data, $4.2B DoD program
- "Asset is expendable" - shows ENTROPY's cold calculation
- Timeline shows imminent threat (14 days to completion)
- Matches exactly with Stage 0 initialization details
- Finding this increases `evidence_level` (needed for confrontation)
- Player can show this to Torres in confrontation: "You thought you were helping journalists? They're selling to China, Russia, and Iran."

---

## Fragment 3: Project Heisenberg - Quantum Key Distribution Specifications

**Category:** Technical Context (Non-Evidence)
**Difficulty:** Hard (Research Lab cabinet - requires Dr. Chen's biometric authorization)
**Location:** Research Laboratory - Equipment Cabinet (8, 6)
**Discovery:** After gaining Dr. Chen's trust OR bypassing biometric security

**Purpose:**
- Provides technical context about what Torres stole
- Shows military/intelligence applications
- Explains why ENTROPY targeted this specifically
- Rewards thorough players with deep understanding

**Fragment ID:** `lore_heisenberg_specs`
**Word Count:** ~170 words

### Content

```
═══════════════════════════════════════════════════════
PROJECT HEISENBERG - TECHNICAL SPECIFICATIONS
Classification: DoD TOP SECRET // SCI // NOFORN
Quantum Dynamics Corporation - Defense Contract QD-2024-7731
Lead Scientist: Dr. Sarah Chen, PhD
═══════════════════════════════════════════════════════

PROJECT OVERVIEW:
Quantum Key Distribution (QKD) system for military/
intelligence communications encryption using entangled
photon pairs for theoretically unbreakable security.

CAPABILITIES:
- 847 pages of QKD protocols (classified methodology)
- 14 zero-day vulnerabilities in competitor systems
- 247 DoD facility deployment database
- Cryptographic key material from government testing

DEPLOYMENT STATUS:
- Phase 1 Complete: Laboratory validation
- Phase 2 In Progress: Field testing (8 military bases)
- Phase 3 Planned: Full deployment (247 facilities)

STRATEGIC VALUE:
Project Heisenberg provides U.S. intelligence community
with encryption immune to quantum computing attacks.
Compromise would enable adversaries to:
1. Decrypt retroactively stored communications
2. Expose human intelligence sources
3. Compromise field operative identities
4. Neutralize U.S. quantum crypto advantage for decade

SECURITY CLEARANCE REQUIRED: TS/SCI
NEED-TO-KNOW: Cryptography Division Only

[Handwritten note]:
"David Torres has full access. Background check clean.
Recommend continued clearance."
- Security Review Board, 6 months ago
═══════════════════════════════════════════════════════
```

**Metadata:**
```json
{
  "type": "notes",
  "id": "lore_heisenberg_specs",
  "name": "Project Heisenberg - Quantum Key Distribution Specifications",
  "category": "lore_fragment",
  "subcategory": "technical_document",
  "takeable": true,
  "readable": true,
  "observations": "Classified technical specifications for Project Heisenberg. Explains what David Torres was exfiltrating and why it matters.",
  "onPickup": "#set_variable:found_heisenberg_specs=true",
  "loreValue": 12,
  "discoveryDialogue": "This explains what Torres stole. Project Heisenberg is quantum encryption for intelligence communications. If foreign governments get this, they can decrypt everything—past and future."
}
```

**Design Notes:**
- NOT direct evidence of evil, but explains stakes
- Shows Torres had legitimate access (not hacking in)
- "Background check clean" makes his recruitment more tragic
- 247 facilities = massive deployment scale
- Optional fragment - enriches understanding but not required
- Helps player understand why ENTROPY targeted Quantum Dynamics specifically

---

## Fragment 4: Insider Threat Initiative - Target Selection Criteria

**Category:** Operational Documents (Evidence)
**Difficulty:** Hard (Archive Storage - Equipment Locker, requires LOCKER_KEY or lockpick)
**Location:** Archive / Storage Room - Equipment Locker (1, 1)
**Discovery:** Optional exploration, requires lockpick or locker key

**Purpose:**
- Reveals systematic profiling methodology
- Shows ENTROPY's cold calculation in targeting vulnerable people
- Provides database of active targets
- Demonstrates this is ongoing program, not isolated incident

**Fragment ID:** `lore_target_criteria`
**Word Count:** ~195 words

### Content

```
═══════════════════════════════════════════════════════
INSIDER THREAT INITIATIVE - TARGET SELECTION DATABASE
Classification: ENTROPY INTERNAL - RECRUITMENT DIVISION
Updated: [Current Date - 3 months ago]
Active Targets: 47 profiles under evaluation
═══════════════════════════════════════════════════════

VULNERABILITY SCORING SYSTEM (1-10):

FINANCIAL DISTRESS (Weight: 35%)
- Medical debt: 8-10 (terminal illness family member = 10)
- Gambling addiction: 6-9
- Divorce/child support: 5-8
- Underwater mortgage: 4-7

ACCESS LEVEL (Weight: 40%)
- Classified government contracts: 9-10
- Financial systems: 7-9
- Healthcare databases: 6-8
- Corporate R&D: 5-8

PSYCHOLOGICAL PROFILE (Weight: 25%)
- Ideological flexibility: 6-10 (willing to justify)
- Desperation threshold: 7-10 (will do anything)
- Risk tolerance: 4-7 (cautious but desperate)
- Loyalty fatigue: 5-9 (feels betrayed by system)

═══════════════════════════════════════════════════════
ACTIVE TARGET PROFILES - QUANTUM/CRYPTO SECTOR
═══════════════════════════════════════════════════════

TARGET QD-001: David Torres, PhD
Organization: Quantum Dynamics Corporation
Access Level: 10/10 (TS/SCI clearance, crypto lead)
Financial Distress: 10/10 (wife Stage 3 cancer, $180K debt)
Psychological: 8/10 (desperate, idealistic, "do right thing")
COMPOSITE SCORE: 94/100

RECRUITMENT STATUS: ACTIVE (73% exfiltration complete)
HANDLER: "The Recruiter"
COVER STORY: "Investigative journalists exposing defense corruption"
REVENUE POTENTIAL: $60-70 million
ASSESSMENT: Ideal candidate. Proceed to completion.

---

TARGET BB-004: Marcus Chen
Organization: Bluestone Bank (Financial Systems)
Access Level: 9/10 (wire transfer authority)
Financial Distress: 9/10 (gambling debt $240K to loan sharks)
Psychological: 7/10 (pragmatic, risk-averse but cornered)
COMPOSITE SCORE: 87/100

RECRUITMENT STATUS: APPROACH AUTHORIZED
HANDLER: TBD
TIMELINE: 30-45 days

---

TARGET MH-012: Dr. Rachel Okonkwo
Organization: Memorial Hospital (Healthcare Database Admin)
Access Level: 7/10 (patient records, insurance billing)
Financial Distress: 8/10 (son's experimental treatment $380K)
Psychological: 9/10 (will do anything for son)
COMPOSITE SCORE: 86/100

RECRUITMENT STATUS: SURVEILLANCE PHASE
HANDLER: TBD
ASSESSMENT: High success probability. Mother's desperation = leverage.

---

[22 additional profiles follow similar pattern]

═══════════════════════════════════════════════════════
RECRUITMENT DIVISION METRICS (CURRENT QUARTER)
═══════════════════════════════════════════════════════

Targets Identified: 47
Approaches Initiated: 18
Active Placements: 22
Successful Exfiltrations: 9
Failed/Caught: 3 (assets burned, acceptable loss)

PROJECTED ANNUAL REVENUE: $180-240 million
COST PER RECRUITMENT: $15-40K (compensation to asset)
ROI: 1200-1800%

[The Recruiter's Note]:
"David Torres (QD-001) is model success. Use similar
profile for future quantum/crypto sector targeting.
Medical debt + terminal illness family = maximum desperation."

[The Architect's Note]:
"Excellent work. Increase quantum sector targeting by 40%.
DoD quantum programs are priority. Torres template effective."
═══════════════════════════════════════════════════════
```

**Metadata:**
```json
{
  "type": "notes",
  "id": "lore_target_criteria",
  "name": "Insider Threat Initiative - Target Selection Criteria",
  "category": "lore_fragment",
  "subcategory": "operational_database",
  "takeable": true,
  "readable": true,
  "observations": "A database of ENTROPY's insider recruitment targets. Shows David Torres as 'QD-001' alongside 46 other vulnerable individuals being systematically profiled.",
  "onPickup": "#set_variable:found_target_criteria=true #increment:evidence_level",
  "loreValue": 15,
  "discoveryDialogue": "This is horrifying. ENTROPY has 47 people profiled for recruitment. They're targeting desperate people with sick family members and crushing debt. Torres is just one of dozens."
}
```

**Design Notes:**
- **CRITICAL EVIDENCE** - shows systematic targeting of vulnerable people
- Specific numbers: 47 targets, 22 active placements, $180-240M annual revenue
- Torres listed as "QD-001" with exact details from Stage 0 (wife cancer, $180K debt)
- Shows other victims: Marcus (gambling debt), Rachel (son's treatment) - humanizes broader impact
- "Mother's desperation = leverage" - reveals ENTROPY's cruel calculation
- ROI calculation (1200-1800%) shows pure financial motivation
- "Model success" and "Torres template" - implies they'll recruit more like him
- Finding this increases `evidence_level` (can be used in confrontation or debrief)

---

## Fragment Discovery Flow

**Progressive Revelation:**

```
Fragment 1 (Easy) → Player learns ENTROPY recruits insiders systematically
                  → "Investigative journalists" lie established

Fragment 2 (Medium) → Player learns The Architect authorized operation
                    → Specific casualty numbers revealed (12-40 deaths)
                    → Foreign government sales exposed ($68M)

Fragment 4 (Hard) → Player learns Torres is one of 47 targets
                  → ENTROPY's profiling methodology exposed
                  → Broader ongoing threat revealed

Fragment 3 (Optional) → Technical context about Project Heisenberg
                      → Explains strategic importance
                      → Shows Torres had legitimate access
```

**Discovery Sequence (Recommended):**
1. **Break Room exploration** → Fragment 1 (recruiting pamphlet)
2. **Server Room investigation** → Fragment 2 (Architect protocol)
3. **Archive Storage (optional)** → Fragment 4 (target database)
4. **Research Lab (optional)** → Fragment 3 (Heisenberg specs)

---

## Debrief Integration

**Agent 0x99's Debrief should acknowledge discovered LORE:**

```ink
=== debrief_lore_acknowledgment ===

{found_recruiting_pamphlet:
    Agent 0x99: You found the Insider Threat Initiative recruitment document.
    Agent 0x99: This proves Torres wasn't a random opportunity. He was systematically targeted.
}

{found_architect_protocol:
    Agent 0x99: The Architect's authorization is damning evidence.
    Agent 0x99: They calculated the casualties—12 to 40 intelligence officers—and approved anyway.
    Agent 0x99: "Asset is expendable." That's how they saw Torres. A tool.
}

{found_target_criteria:
    Agent 0x99: The target selection database... *shakes head*
    Agent 0x99: 47 people profiled. Medical debt, sick family members, desperation.
    Agent 0x99: ENTROPY weaponizes human suffering. They're not just criminals—they're predators.

    {torres_turned:
        Agent 0x99: At least Torres can help us identify the others. Maybe we can stop them before they're compromised.
    - else:
        Agent 0x99: We need to identify those 47 targets before ENTROPY recruits them.
    }
}

{found_heisenberg_specs:
    Agent 0x99: The Project Heisenberg specifications explain why this mattered so much.
    Agent 0x99: 247 military facilities were set to deploy this. Quantum crypto, unbreakable encryption.
    Agent 0x99: If foreign governments had gotten that data... we'd be blind for a decade.
}

{found_recruiting_pamphlet and found_architect_protocol and found_target_criteria:
    Agent 0x99: You found all the key evidence. The recruiting methodology, The Architect's approval, the target database.
    Agent 0x99: This isn't just about stopping Torres. We're exposing an entire recruitment program.

    // S-Rank bonus for complete LORE discovery
    ~ lore_completionist = true
}

-> debrief_continue
```

---

## LORE Fragment Summary

**Total Fragments:** 4
**Evidence Documents:** 3 (Fragments 1, 2, 4)
**Technical Context:** 1 (Fragment 3)

**Key Numbers Revealed:**
- 22 active ENTROPY insider placements
- 47 total targets under evaluation
- $180-240M annual revenue from insider program
- 12-40 projected intelligence officer casualties
- $68M sale price for Torres' stolen data
- 4.2 TB Project Heisenberg data exfiltrated
- 247 military facilities targeted for deployment
- $4.2B DoD quantum program wasted if compromised

**Tracked Variables:**
- `found_recruiting_pamphlet` - Shows recruiting methodology
- `found_architect_protocol` - Proves The Architect's approval + casualty projections
- `found_heisenberg_specs` - Technical context about stolen research
- `found_target_criteria` - Database of 47 targets, shows systematic profiling
- `lore_completionist` - All LORE fragments discovered (S-rank bonus)

**Debrief Impact:**
- Each fragment acknowledged by Agent 0x99
- Complete collection unlocks additional debrief dialogue
- Evidence supports multiple ending paths (especially "turn double agent" - Torres sees he was manipulated)

---

**Stage 6: LORE Fragments - COMPLETE**

**Next Stage:** Stage 7 - Asset Manifest (sprites, audio, UI requirements) OR Stage 8 - VM Integration

