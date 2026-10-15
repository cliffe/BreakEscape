# Season 1 Quick Reference Guide

## Mission Overview

| # | Title | Cell | SecGen Scenario | Tier | Duration | Status |
|---|-------|------|----------------|------|----------|--------|
| 1 | First Contact | Social Fabric | **Intro to Linux** ✅ | 1 | 45-60m | Standalone |
| 2 | Ransomed Trust | Ransomware Inc | Rooting for a win | 1 | 50-70m | Standalone |
| 3 | Ghost in the Machine | Zero Day Syndicate | **Info Gathering: Scanning** ✅ | 2 | 60-75m | Standalone |
| 4 | Critical Failure | Critical Mass | Vulnerability Analysis | 2 | 60-80m | Standalone |
| 5 | Insider Trading | Insider Threat + Digital Vanguard | Feeling Blu | 2 | 70-90m | Standalone |
| 6 | Follow the Money | Crypto Anarchists | Hackme and Crack Me | 2 | 60-80m | Standalone |
| 7 | The Architect's Gambit | Multi-cell | Putting it together | 3 | 80-100m | Campaign pt 1 |
| 8 | The Mole | Insider Threat | Such a git | 2 | 60-75m | Campaign pt 2a |
| 9 | Digital Archaeology | Historical/Multi-cell | Nosferatu | 3 | 70-90m | Campaign pt 2b |
| 10 | The Final Cipher | All Cells | Post-exploitation | 3 | 90-120m | Campaign Finale |

## One-Sentence Summaries

1. **First Contact:** Infiltrate media company, brute force SSH passwords, intercept disinformation dead drops (tutorial mission)
2. **Ransomed Trust:** Hospital ransomware crisis, exploit ProFTPD to recover encryption keys
3. **Ghost in the Machine:** Scan Zero Day's training network, banner grab intelligence, discover cross-cell coordination
4. **Critical Failure:** Stop water treatment SCADA attack, first hostile combat
5. **Insider Trading:** Identify corporate mole, explore recruitment psychology
6. **Follow the Money:** Trace cryptocurrency funding network, expose ENTROPY financial hub
7. **The Architect's Gambit:** Choose which coordinated attack to stop, impossible choice
8. **The Mole:** Internal investigation reveals SAFETYNET traitor
9. **Digital Archaeology:** Explore abandoned ENTROPY bases, discover The Architect's identity
10. **The Final Cipher:** Final assault on Tomb Gamma, multiple endings

## Progressive Mechanic Introduction

### Break Escape Mechanics

| Mission | New Mechanics |
|---------|---------------|
| 1 | Lockpicking, NPC social engineering, VM hacking basics, evidence collection |
| 2 | Patrolling guards, PIN cracking, CyberChef workstation |
| 3 | RFID keycard cloning, advanced CyberChef, network scanning |
| 4 | Hostile NPCs, item drops, time pressure, multi-system investigation |
| 5 | Multi-NPC investigation web, evidence correlation, non-combat resolution |
| 6 | Password cracking minigames, multi-credential chains, financial networks |
| 7 | Branching mission paths, permanent consequences, real-time crisis |
| 8 | Ally investigation, timeline reconstruction, triple-agent mechanics |
| 9 | Environmental storytelling, historical reconstruction, cryptanalysis |
| 10 | Boss encounter, philosophical dialogue trees, multiple endings |

### VM/SecGen Skills

| Mission | Primary Skills Taught |
|---------|----------------------|
| 1 | **SSH brute force (Hydra), Linux basics, sudo privileges** ✅ |
| 2 | Service exploitation (ProFTPD), basic pentesting workflow |
| 3 | **Network scanning (nmap), banner grabbing (netcat), Base64 decoding, distcc exploitation** ✅ |
| 4 | Vulnerability scanning (Nmap NSE, Nessus), privilege escalation (sudo) |
| 5 | CMS exploitation (Bludit), organizational intelligence, privilege escalation |
| 6 | Password cracking (John the Ripper), multi-server lateral movement |
| 7 | Multi-stage integrated attack, NFS shares, privilege escalation |
| 8 | Version control exploitation (GitList), secret management failures |
| 9 | Web server exploitation (Nostromo), privilege escalation, forensics |
| 10 | Complete penetration test, all previous techniques combined |

## CyBOK Coverage

| Knowledge Area | Primary | Secondary |
|----------------|---------|-----------|
| **Human Factors** | M1, M5, M8 | M2, M3, M4 |
| **Applied Cryptography** | M1, M6, M9 | M2, M3, M10 |
| **Security Operations** | M1, M4, M8 | M2, M5, M6, M7, M10 |
| **Network Security** | M3, M4 | M7, M10 |
| **Malware & Attack Tech** | M2, M3, M4 | M7, M10 |
| **Cyber-Physical Systems** | M4 | M7 |
| **Systems Security** | M3, M4, M10 | M6, M8, M9 |
| **Web Security** | M5, M9 | M1, M3 |
| **Forensics** | M8, M9 | M5, M6 |
| **Incident Response** | M2, M4, M7 | M10 |

## Key NPCs

| Character | Role | Appears In | Arc |
|-----------|------|------------|-----|
| **Agent 0x99 "Haxolottle"** | Player's Handler | All missions | Mentor whose mentor betrayed SAFETYNET |
| **Dr. Adrian Tesseract** | The Architect (antagonist) | M7, M9, M10 | Brilliant defector, sympathetic villain |
| **Director Samantha Cross** | SAFETYNET Director | M8, M10 | Authority figure, crisis manager |
| **Agent 0x47 "Nightshade"** | The Mole | M8, M10 | Traitor, can be turned triple agent |
| **David Torres** | Corporate Insider | M5, (M10) | Recruited by ENTROPY, can be turned |
| **Irina Volkova** | Cryptographer | M6, (M10) | Crypto Anarchist, potential recruit |
| **Victoria "Vick" Sterling** | Zero Day Sales Lead | M3, (M10) | Can become double agent |
| **Maya Chen** | Journalist | M1 | Innocent caught in ENTROPY scheme |
| **Dr. Sarah Kim** | Hospital CTO | M2 | Crisis decision maker |

## ENTROPY Cell Roster

| Cell | Specialty | Cover Business | Difficulty |
|------|-----------|----------------|------------|
| Social Fabric | Disinformation | Viral Dynamics Media | Beginner |
| Ransomware Inc | Crypto-extortion | CryptoSecure Recovery | Beginner |
| Zero Day Syndicate | Exploit trading | WhiteHat Security Services | Intermediate |
| Critical Mass | Infrastructure attacks | OptiGrid Solutions | Intermediate |
| Insider Threat Initiative | Infiltration & recruitment | TalentStack Recruiting | Advanced |
| Digital Vanguard | Corporate espionage | Paradigm Shift Consultants | Intermediate |
| Crypto Anarchists | Cryptocurrency/blockchain | HashChain Exchange | Intermediate |
| Ghost Protocol | Surveillance & privacy destruction | DataVault Secure | Intermediate |
| Supply Chain Saboteurs | Supply chain attacks | Trusted Vendor Integration | Advanced |
| AI Singularity | Weaponized AI | Prometheus AI Labs | Advanced |
| Quantum Cabal | Advanced tech + cosmic horror | Tesseract Research Institute | Special |

## The Architect Mystery Timeline

| Mission | Revelation Level | Information Gained |
|---------|------------------|-------------------|
| M1 | First mention | Overheard in encrypted comms, "Architect's timeline" |
| M2 | Second mention | Ransomware deployed too precisely |
| M3 | Pattern emerging | "Architect's requirements" in communications |
| M4 | Coordination confirmed | Multi-cell coordination detected |
| M5 | Organization structure | "Architect's corporate strategy" |
| M6 | Central treasury | "The Architect's Fund" discovered |
| M7 | First contact | Direct communication, philosophy hinted |
| M8 | Plan revealed | Stole SAFETYNET global threat database |
| M9 | Identity revealed | Dr. Adrian Tesseract, former SAFETYNET strategist |
| M10 | Full confrontation | Complete understanding, philosophical debate |

## Major Choice Points

### M1: First Contact
**Choice:** Expose entire company vs. surgical strike
**Impact:** Corporate trust in M5

### M2: Ransomed Trust
**Choice:** Pay ransom vs. recover independently
**Impact:** Financial trail clarity in M6

### M3: Ghost in the Machine
**Choice:** Arrest Victoria vs. become double agent
**Impact:** M7 & M10 Zero Day cell presence

### M4: Critical Failure
**Choice:** Capture operatives vs. stop attack immediately
**Impact:** M7 Critical Mass capability

### M5: Insider Trading
**Choice:** Turn David Torres vs. arrest
**Impact:** M8 mole investigation, M10 support

### M6: Follow the Money
**Choice:** Seize assets vs. monitor transactions
**Impact:** M7 ENTROPY funding, M10 capability

### M7: The Architect's Gambit ⭐ MAJOR
**Choice:** Which operation to personally stop
- Infrastructure (civilian lives)
- Elections (democracy)
- Supply Chain (long-term security)
- Corporate (economic stability)

**Impact:** M10 cell presence and difficulty, campaign ending options

### M8: The Mole
**Choice:** Arrest Nightshade vs. turn triple agent
**Impact:** M10 intelligence quality and support

### M10: The Final Cipher ⭐⭐ ULTIMATE
**Choice:** How to resolve confrontation
- **Arrest** → Order Restored ending
- **Debate/Convince** → Redemption ending
- **Sabotage** → Scorched Earth ending
- **Join ENTROPY** → Entropy Wins (bad ending)
- **Kill** → The Void ending

**Impact:** Season 2 setup

## Campaign Arcs

### Act 1: Introduction (M1-3)
**Theme:** Learning the landscape
**Tone:** Espionage thriller
**Key Learning:** Individual ENTROPY cell operations

### Act 2: Recognition (M4-6)
**Theme:** Patterns emerge
**Tone:** Darker, higher stakes
**Key Learning:** Cross-cell coordination

### Act 3: Confrontation (M7-9)
**Theme:** The Architect revealed
**Tone:** Urgent, personal
**Key Learning:** Identity and motivation

### Act 4: Resolution (M10)
**Theme:** Final confrontation
**Tone:** Epic climax
**Key Learning:** Philosophical questions

## Difficulty Progression

```
Advanced ┤                                    ╭─M10─╮
         │                          ╭─M7────╮│     │
         │                     ╭─M9─╯       ││     │
Intermed ┤    ╭─M3──M4──M5──M6─╯             ││     │
         │╭─M2─╯                             ╰M8────╯
Beginner ┤M1
         └┬───┬───┬───┬───┬───┬───┬───┬───┬───┬─
          1   2   3   4   5   6   7   8   9  10
```

## Play Order Options

### Standalone Players
**Recommended:** M1, M2, M3, M4, M5, M6 (any order)
**Note:** M7 can adapt for standalone with reduced scope

### Campaign Players
**Required Order:** M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9 → M10

### Partial Campaign Options

#### Minimum Core Arc (5 missions)
M1 → M3 → M6 → M7 → M10

#### Extended Arc (8 missions)
M1 → M2 → M3 → M5 → M6 → M7 → M8 → M10

#### Complete Arc (10 missions)
M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9 → M10

## Estimated Playtime

- **Single Mission:** 45-120 minutes (average 70 minutes)
- **Standalone Play (M1-6):** 5-7 hours
- **Core Campaign:** 7-9 hours
- **Extended Campaign:** 9-11 hours
- **Complete Campaign:** 11-14 hours

## Location/Setting Variety

| Mission | Primary Setting | Atmosphere |
|---------|----------------|------------|
| M1 | Media office | Professional, corporate |
| M2 | Hospital | Crisis, urgent, medical |
| M3 | Security consulting firm | Corporate, high-tech |
| M4 | Water treatment facility | Industrial, SCADA systems |
| M5 | Tech company | Corporate, modern office |
| M6 | Cryptocurrency exchange | Fintech, sleek, modern |
| M7 | Varies by choice | Crisis mode, high pressure |
| M8 | SAFETYNET headquarters | Internal, paranoid |
| M9 | Abandoned ENTROPY bases | Archaeological, mysterious |
| M10 | Tomb Gamma (ENTROPY stronghold) | Hostile, fortress-like |

## Season 2 Setup Hooks

Depending on M10 ending:

- **Order Restored:** ENTROPY cells rebuild under new leadership
- **Redemption:** ENTROPY loyalists seek revenge for "betrayal"
- **Scorched Earth:** Power vacuum, new threats emerge
- **Entropy Wins:** Play as new agent hunting defector
- **The Void:** Chaos from leaderless ENTROPY

**Unexplored Threads:**
- Quantum Cabal's cosmic horror (barely touched)
- AI Singularity's autonomous systems (future threat)
- Deep State government infiltration (mentioned, not explored)
- Global vulnerability database consequences

## Design Philosophy Checklist

For each mission, ensure:

- ✅ **Episodic Accessibility:** Can play standalone
- ✅ **Serialized Depth:** Enhanced by campaign context
- ✅ **Three-Act Structure:** Setup → Investigation → Resolution
- ✅ **Mandatory Backtracking:** Non-linear exploration required
- ✅ **Educational Authenticity:** Real tools and techniques
- ✅ **Moral Complexity:** No "wrong" choices, only consequences
- ✅ **Character Development:** NPCs have arcs
- ✅ **LORE Integration:** World-building through gameplay
- ✅ **Player Agency:** Meaningful choices that matter
- ✅ **Professional Realism:** How real pentesters work

## File Organization

```
planning_notes/overall_story_plan/
├── season_1_arc.md (main plan, this reference source)
├── quick_reference.md (this file)
└── mission_seeds/
    ├── m01_first_contact_seed.md
    ├── m02_ransomed_trust_seed.md
    ├── m03_ghost_in_machine_seed.md
    ├── m04_critical_failure_seed.md
    ├── m05_insider_trading_seed.md
    ├── m06_follow_money_seed.md
    ├── m07_architects_gambit_seed.md
    ├── m08_the_mole_seed.md
    ├── m09_digital_archaeology_seed.md
    └── m10_final_cipher_seed.md
```

## Next Steps

For each mission:

1. **Stage 0: Initialization** ✅ (completed in season_1_arc.md)
2. **Stage 1: Narrative Structure** - Develop complete 3-act breakdown
3. **Stage 2-3: Game Design** - Map to rooms, puzzles, mechanics
4. **Stage 4: Player Objectives** - Define win conditions
5. **Stage 5: Room Layout** - Physical space design
6. **Implementation** - Build in game engine

Use the detailed mission breakdowns in `season_1_arc.md` as seeds for `story_design/story_dev_prompts/00_scenario_initialization.md` process.

---

## Quick Mission Selection Guide

**Want to teach basic mechanics?** → M1, M2
**Want social engineering focus?** → M1, M5, M8
**Want technical hacking focus?** → M3, M6, M10
**Want infrastructure/SCADA?** → M4, M7
**Want crisis/time pressure?** → M2, M4, M7
**Want investigation/detective work?** → M5, M8, M9
**Want moral dilemmas?** → M5, M7, M8, M10
**Want combat/action?** → M4, M7, M10
**Want multiple endings?** → M10
**Want cross-cell complexity?** → M5, M7, M10

---

*This quick reference accompanies the full Season 1 Arc Plan*
*Last Updated: 2025-11-30*
