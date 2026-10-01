# Mission 6: Follow the Money

**Status:** Implemented; pass 3 (puzzle chains) applied 2026-10-01, validator clean (0 errors) **ENTROPY Cell:** Crypto Anarchists **SecGen Scenario:** Hackme and Crack Me (password cracking) **Difficulty:** Tier 2 (Intermediate)

## Mission Overview

Track cryptocurrency payments from M2 (hospital ransomware) and M5 (corporate espionage) to discover ENTROPY's complete financial network. Infiltrate HashChain Exchange, crack passwords to access backend servers, map blockchain transactions, and discover "The Architect's Fund": advances already paid to six ENTROPY cells, and $12.8M in balances due out in 72 hours.

## Key NPCs

- **Dr. Irina Volkova** (CTO) - Brilliant cryptographer, morally conflicted, can be recruited or arrested
- **"Satoshi Nakamoto II"** (CEO) - public persona of "Satoshi's Ghost", the Crypto Anarchists' leader; the codename is on the fund's authorisation line
- **Checkpoint Guard** - contract guard on the trading-floor door; talk past him on the FCA cover, pick the lock in his blind window, or knock him out
- **Blockchain Analyst** - Innocent employee with transaction intelligence
- **Crypto Trader** - Discovers suspicious ENTROPY wallet activity

## Room Layout

```
Reception Lobby → Security Checkpoint (guard) → Trading Floor (key lock; central hub)
  ├─ Server Room (VM access, password required) → Data Center (Architect's Fund evidence)
  ├─ Blockchain Lab (transaction network analysis)
  ├─ Irina's Office (CTO, locked with RFID badge)
     Data Center → Executive Wing (executive badge from Irina) → Satoshi's Office (confrontation, safe with intel)
```

## Critical Revelations

1. **ENTROPY Financial Network Mapped:** All cells funnel money through HashChain Exchange
2. **The Architect's Fund Discovered:** per-cell advances already paid, $12.8M pending for 72 hours, each cell tied to an m07 operation; the cells' own projection is 350-600 dead
3. **Architect Identity Narrowed:** 87% probability = Dr. Adrian Tesseract (former SAFETYNET strategist)
4. **Cross-Mission Connections:** Direct links to M2 ransomware and M5 corporate espionage wallets

## Major Choices

1. **Asset Strategy:** Freeze the wallet (the pending balances stop; the advances are already gone; ENTROPY learns its bank is burned) vs. watch it (the balances reach the cells; every recipient is mapped). The debrief states the monitoring cost plainly.
2. **Irina Volkova:** Turn her (she gives up the mixer tonight; nothing carries into later missions) vs. detain her and hand her to the police. Her research notes give a low-trust player a way to turn her.

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
| Trading floor | `key` (4 pins, easy) | lockpick, or the guard's `#unlock_door` | Start-kit Lock Pick Kit; FCA cover + Irina's name to the guard |
| Irina's office | `rfid` | `cto_badge` | Irina lends it at trust ≥ 25, or clone it off her lanyard with the start-kit cloner, or pick up the dropped badge / ask HaX after a KO |
| Data centre | `pin` | `3110` | Door Controller Export, paid out for flag 3 |
| Executive wing | `rfid` | `executive_badge` | Irina hands over the spare once you've found the fund (export note DC-03 says it was signed out to her) |
| Executive safe (optional) | `pin` | `2140` | Architect's email P.S. (Irina's office) and the press clipping in the executive wing |

## Field Guides

Offered by Agent HaX only after the player meets the thing each guide explains, and handed
over on request through a `support_hub` choice — never pushed into the inventory.

| Guide | Offered on | Lab sheet |
|-------|-----------|-----------|
| SSH logins with cracked credentials | Picking up Irina's wordlist | `ssh-access-and-bruteforce` |
| distcc exploitation (the foothold) | First interacting with the VM launcher | `distcc-exploitation` |
| Privilege escalation / credential reuse | Submitting flag 1 | `privilege-escalation` |
| Reconnaissance | First interacting with the VM launcher | `reconnaissance-and-network-mapping` |
| RFID cloning | Entering the trading floor | `rfid-cloning` |

## Design Notes

This mission is the financial hub connecting all previous operations and revealing the scope of The Architect's coordination. Password cracking theme teaches credential security. Irina Volkova can be turned for what she gives up tonight; no later mission depends on it. The discovery of The Architect's Fund creates urgency leading into M7's crisis.

PIN code for the executive safe: **2140** — the year the last bitcoin is mined. Clued twice: The Architect's email P.S. in Irina's office names the safe without the digits, and the framed press clipping in the executive wing gives the year.

Start kit (capability arc): phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit. No PIN cracker. The fingerprint kit is carried and unused here.

The safe is optional. Skipping it costs the player The Architect's identity file, and the closing debrief acknowledges the gap rather than pretending they have it.
