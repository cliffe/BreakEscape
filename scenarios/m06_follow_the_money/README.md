# Mission 6: Follow the Money

**Status:** Implemented — validator clean (0 errors, 0 warnings) **ENTROPY Cell:** Crypto Anarchists **SecGen Scenario:** Hackme and Crack Me (password cracking) **Difficulty:** Tier 2 (Intermediate)

## Mission Overview

Track cryptocurrency payments from M2 (hospital ransomware) and M5 (corporate espionage) to discover ENTROPY's complete financial network. Infiltrate HashChain Exchange, crack passwords to access backend servers, map blockchain transactions, and discover "The Architect's Fund" - $12.8M funding a coordinated attack across all ENTROPY cells.

## Key NPCs

- **Dr. Irina Volkova** (CTO) - Brilliant cryptographer, morally conflicted, can be recruited or arrested
- **"Satoshi Nakamoto II"** (CEO) - Crypto Anarchist leader, true believer in financial anarchism
- **Blockchain Analyst** - Innocent employee with transaction intelligence
- **Crypto Trader** - Discovers suspicious ENTROPY wallet activity

## Room Layout

```
Reception Lobby → Security Checkpoint → Trading Floor (central hub)
  ├─ Server Room (VM access, password required) → Data Center (Architect's Fund evidence)
  ├─ Blockchain Lab (transaction network analysis)
  ├─ Irina's Office (CTO, locked with RFID badge)
  └─ Executive Wing (executive badge required) → Satoshi's Office (confrontation, safe with intel)
```

## Critical Revelations

1. **ENTROPY Financial Network Mapped:** All cells funnel money through HashChain Exchange
2. **The Architect's Fund Discovered:** $12.8M for coordinated attack in 72 hours, 180-340 projected casualties
3. **Architect Identity Narrowed:** 87% probability = Dr. Adrian Tesseract (former SAFETYNET strategist)
4. **Cross-Mission Connections:** Direct links to M2 ransomware and M5 corporate espionage wallets

## Major Choices

1. **Asset Strategy:** Seize cryptocurrency (immediate impact, ends intelligence) vs. Monitor transactions (long-term intelligence, ENTROPY keeps funding)
2. **Irina Volkova:** Recruit (valuable cryptographer asset) vs. Arrest (eliminate criminal expertise)
3. **Public Exposure:** Warn cryptocurrency community vs. Quiet takedown

## Educational Objectives (CyBOK)

- **Applied Cryptography:** Cryptocurrency, blockchain, hash functions, password hashing
- **Security Operations:** Financial forensics, transaction analysis, asset seizure
- **Systems Security:** Password cracking, credential reuse, multi-server exploitation
- **Human Factors:** Undercover operations, recruitment tactics

## VM Integration

**SecGen Scenario:** Hackme and Crack Me

- Crack passwords on multiple backend servers
- Exploit credential reuse for lateral movement
- Access financial database with transaction records
- 4 flags revealing progressive intelligence

## Campaign Integration

**Connects to:**

- M2 "Ransomed Trust" - Hospital ransomware payment traced
- M5 "Insider Trading" - Corporate espionage payment traced
- M7 "The Architect's Gambit" - Fund distribution triggers coordinated attack
- M9 "Digital Archaeology" - Architect identity setup

**Post-Mission Hook:** Financial analysis reveals massive fund transfer in 72 hours to all cells. Coordinated multi-cell attack imminent. Player must choose which operation to stop in M7.

## Implementation Status

- [x] 7 Ink dialogue scripts written and compiled
- [x] Complete `scenario.json.erb` — 9 rooms, 6 NPCs, aims with `unlockCondition` chaining
- [x] Password cracking wired to 4 VM flags with `targetFlags` + handler `setGlobal` bridges
- [x] RFID (`cto_badge`, `executive_badge`), password (server room) and PIN (safe) locks
- [x] Field guides delivered on request via Agent HaX's `support_hub`, exposure-gated
- [x] KO resilience — `taskOnKO` + `globalVarOnKO` on every person NPC, with handler fallbacks
- [x] Opening cutscene (`timedConversation` + `skipIfGlobal`), closing debrief, credits
- [x] Schema, ink, objective-wiring and room-geometry validation all clean
- [ ] Playtest end-to-end against a live `hackme_crack_me_lab` VM

## Locks and Keys

| Lock | Type | Key | Clue location |
|------|------|-----|---------------|
| Server room door | `password` | `bitcoin2025` | IT New Starter Checklist, security checkpoint |
| Irina's office | `rfid` | `cto_badge` | Irina hands it over at trust ≥ 25, or clone it with the trading-floor cloner |
| Executive wing | `rfid` | `executive_badge` | Spare badge in the data centre |
| Executive safe (optional) | `pin` | `2140` | Architect's email (Irina's office) and the manifesto margin note |

## Field Guides

Offered by Agent HaX only after the player meets the thing each guide explains, and handed
over on request through a `support_hub` choice — never pushed into the inventory.

| Guide | Offered on | Lab sheet |
|-------|-----------|-----------|
| Password cracking | Picking up Irina's wordlist | `ssh-access-and-bruteforce` |
| Privilege escalation / credential reuse | Submitting flag 1 | `privilege-escalation` |
| Reconnaissance | First interacting with the VM launcher | `reconnaissance-and-network-mapping` |
| RFID cloning | Entering the security checkpoint | `rfid-cloning` |

## Design Notes

This mission is the financial hub connecting all previous operations and revealing the scope of The Architect's coordination. Password cracking theme teaches credential security. Irina Volkova is a recruitable asset who can provide ongoing intelligence if turned. The discovery of The Architect's Fund creates urgency leading into M7's crisis.

PIN code for the executive safe: **2140** — the year the last bitcoin is mined. Clued twice: in The Architect's email in Irina's office, and in the CEO's own margin note on the manifesto in his office.

The safe is optional. Skipping it costs the player The Architect's identity file, and the closing debrief acknowledges the gap rather than pretending they have it.
