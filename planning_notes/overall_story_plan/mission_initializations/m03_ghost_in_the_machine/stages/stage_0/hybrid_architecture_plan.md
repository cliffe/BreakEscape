# Mission 3: Hybrid Architecture Integration Plan

**Mission:** Ghost in the Machine
**Stage:** 0 - Scenario Initialization
**Document:** Hybrid Architecture (VM + ERB) Integration Specification
**Date:** 2025-12-24

---

## Overview

Mission 3 uses the **hybrid architecture** approach where VM challenges provide technical skill validation while ERB templates generate rich narrative content. The integration occurs through the **dead drop system**, where VM flags represent intercepted ENTROPY communications that unlock in-game resources.

---

## Architecture Components

### Component 1: VM/SecGen Scenario (Technical Validation)

**Scenario:** "Information Gathering: Scanning"
**Provider:** SecGen
**Stability:** Pre-built, unchanged (for assessment consistency)

**Purpose:**
- Validate network reconnaissance skills (nmap, netcat, distcc)
- Assess service exploitation competence (CVE-2004-2687)
- Provide technical skill benchmarks (CyBOK: NSS, SS)

**Challenges:**
1. Network Port Scanning (nmap)
2. Banner Grabbing (netcat FTP service)
3. HTTP Service Analysis (Base64 decoding)
4. distcc Exploitation (CVE-2004-2687)

**Flags Generated:**
- `flag{network_scan_complete}`
- `flag{ftp_intel_gathered}`
- `flag{pricing_intel_decoded}`
- `flag{distcc_legacy_compromised}`

---

### Component 2: ERB Narrative Content (Story & Context)

**Technology:** Embedded Ruby (ERB) templates in scenario.json.erb
**Flexibility:** High (can update narrative without modifying VMs)

**Purpose:**
- Provide narrative context for technical challenges
- Create encoded messages (ROT13, Hex, Base64) directly in game world
- Generate ENTROPY documents, emails, communications
- Enable storytelling without VM dependencies

**Content Types:**
1. **Encoded Messages:**
   - ROT13 whiteboard message
   - Hex-encoded client list
   - Base64 email draft
   - Double-encoded USB drive (ROT13 + Base64)

2. **LORE Fragments:**
   - Zero Day client roster (Hex)
   - Exploit catalog with pricing (safe)
   - The Architect's directives (double-encoded)
   - Victoria's manifesto (whiteboard)

3. **NPC Dialogues:**
   - Victoria Sterling conversations (Ink scripts)
   - James Park interactions (Ink scripts)
   - Agent 0x99 briefings/debrief (Ink scripts)

4. **Environmental Storytelling:**
   - Office documents, sticky notes
   - Computer files, email drafts
   - Whiteboards, posters
   - Physical evidence correlating with VM findings

---

### Component 3: Dead Drop System (Integration Layer)

**Purpose:** Bridge VM challenges and in-game narrative

**Mechanic:**
1. Player completes VM challenge → obtains flag
2. Flag represents intercepted ENTROPY communication
3. Player submits flag at in-game "drop-site terminal"
4. Submission unlocks in-game resources, intel, or access

**Implementation:**
- Drop-site terminal in server room
- Ink script handles flag submission
- `#complete_task:submit_[flag_name]` triggers objective completion
- Unlocks tied to specific flag submissions

---

## VM Challenge Integration

### Challenge 1: Network Port Scanning

**VM Component:**

**Objective:** Scan Zero Day's training network to identify open ports and services

**Tools:** nmap

**Commands:**
```bash
nmap 192.168.100.50           # Basic scan
nmap -sV 192.168.100.50       # Service version detection
nmap -A 192.168.100.50        # Full scan with OS detection
```

**Expected Output:**
```
PORT     STATE SERVICE     VERSION
21/tcp   open  ftp         vsftpd 3.0.3
22/tcp   open  ssh         OpenSSH 7.4
80/tcp   open  http        Apache httpd 2.4.6
3632/tcp open  distcc      distccd v1
```

**Flag:** `flag{network_scan_complete}`

**Narrative Context (ERB):**

**What flag represents:**
> "You've mapped Zero Day's training network. Their infrastructure is exposed."

**In-Game Tutorial (Agent 0x99):**
> "Access the VM terminal in the server room. Start with nmap to scan the network. Look for open ports and identify services. Those services are ENTROPY communication channels—find them, and you'll intercept their intelligence."

**Drop-Site Terminal Display (ERB Template):**
```erb
<%
if flag_network_scan_complete_submitted
  nmap_results = "Network Scan Results:\n"
  nmap_results += "192.168.100.50 (Zero Day Training Network)\n\n"
  nmap_results += "PORT     SERVICE     VERSION\n"
  nmap_results += "21/tcp   FTP         vsftpd 3.0.3 (Client comms)\n"
  nmap_results += "22/tcp   SSH         OpenSSH 7.4 (Secure access)\n"
  nmap_results += "80/tcp   HTTP        Apache 2.4.6 (Web interface)\n"
  nmap_results += "3632/tcp distcc      distccd v1 (Legacy exploit)\n\n"
  nmap_results += "ANALYSIS: All ports active. Proceed with banner grabbing."
end
%>
```

**Unlocks:**
- Server room workstation access
- Educational annotations for nmap output
- Next objective: Banner grabbing from identified services

**Educational Integration:**
- Agent 0x99 explains port numbers (21=FTP, 22=SSH, 80=HTTP, 3632=distcc)
- Drop-site terminal highlights relevant ports
- Context: "These services are dead drops for ENTROPY communications"

---

### Challenge 2: Banner Grabbing (FTP Service)

**VM Component:**

**Objective:** Connect to FTP service, extract intelligence from banner

**Tools:** netcat, ftp

**Commands:**
```bash
nc 192.168.100.50 21          # Netcat banner grab
ftp 192.168.100.50            # FTP client connection
```

**Banner Output:**
```
220 (vsFTPd 3.0.3)
220 Zero Day Syndicate Training Network
220 INTEL: Client codename "GHOST" - Last connection 2024-05-15
220 flag{ftp_intel_gathered}
```

**Flag:** `flag{ftp_intel_gathered}`

**Narrative Context (ERB):**

**What flag represents:**
> "You've intercepted FTP communications. Client codename 'GHOST' identified—that's Ransomware Incorporated."

**In-Game Intelligence Unlock (ERB Template):**
```erb
<%
ghost_intel = {
  "codename": "GHOST",
  "organization": "Ransomware Incorporated",
  "last_connection": "2024-05-15",
  "notes": "M2 hospital attack operator. Purchased exploits from Zero Day."
}

if flag_ftp_intel_submitted
  # Unlock client codename document on workstation
  client_codenames = "ZERO DAY SYNDICATE - CLIENT CODENAMES\n\n"
  client_codenames += "GHOST: Ransomware Incorporated (Healthcare sector)\n"
  client_codenames += "VANGUARD: Critical Mass (Infrastructure SCADA)\n"
  client_codenames += "CASCADE: Social Fabric (Social engineering ops)\n"
  client_codenames += "\nLast Activity: GHOST - 2024-05-15 (ProFTPD procurement)\n"
end
%>
```

**Unlocks:**
- Client codename list document (correlates with Hex client roster)
- M2 connection hint: "GHOST last active during hospital ransomware timeline"
- Next objective: HTTP service analysis

**Correlation Opportunity:**
- FTP banner mentions "GHOST"
- Hex client list (in-game) shows "Ransomware Incorporated"
- Player realizes: "GHOST = Ransomware Inc = Mission 2 hospital attacker!"

---

### Challenge 3: HTTP Service Analysis + Base64

**VM Component:**

**Objective:** Analyze HTTP service, decode Base64-encoded flag in HTML

**Tools:** curl, wget, browser, base64

**Commands:**
```bash
curl http://192.168.100.50    # Fetch HTML
# View source, find comment
echo "ZmxhZ3twcmljaW5nX2ludGVsX2RlY29kZWR9" | base64 -d
# Output: flag{pricing_intel_decoded}
```

**HTML Output:**
```html
<!DOCTYPE html>
<html>
<head><title>WhiteHat Security Services</title></head>
<body>
<h1>Training Network - Authorized Personnel Only</h1>
<!-- Pricing Intel (Encoded): ZmxhZ3twcmljaW5nX2ludGVsX2RlY29kZWR9 -->
</body>
</html>
```

**Flag:** `flag{pricing_intel_decoded}`

**Narrative Context (ERB):**

**What flag represents:**
> "You've decoded pricing intelligence from HTTP service. Zero Day's exploit pricing model exposed."

**In-Game Intelligence Unlock (ERB Template):**
```erb
<%
pricing_intel = Base64.strict_encode64("ZERO DAY EXPLOIT PRICING (Q3 2024)\n\nCRITICAL: $35,000\nHIGH: $18,000\nMEDIUM: $7,500\n\nSector Premiums:\nHealthcare: +30%\nEnergy: +40%\nFinance: +50%")

if flag_pricing_intel_submitted
  # Unlock pricing spreadsheet on workstation
  pricing_doc = Base64.strict_decode64(pricing_intel)
  # Also unlocks LORE Fragment 2 (Exploit Catalog in safe)
end
%>
```

**Unlocks:**
- Pricing spreadsheet document
- LORE Fragment 2 accessibility (safe PIN hint: 2010)
- Correlation with Victoria's Base64 email (in-game)

**Educational Integration:**
- Reinforces Base64 from M2
- Shows Base64 in web services (HTML comments)
- Connects to in-game Base64 email from Victoria

---

### Challenge 4: distcc Exploitation (CVE-2004-2687)

**VM Component:**

**Objective:** Exploit distcc vulnerability, gain shell, find operational logs

**Vulnerability:** distcc daemon RCE

**Tools:** Metasploit, manual exploitation

**Commands:**
```bash
# Metasploit
use exploit/unix/misc/distcc_exec
set RHOSTS 192.168.100.50
exploit

# Shell access
cd /var/logs/zeroday
cat operational_log.txt
```

**Operational Log Content:**
```
ZERO DAY SYNDICATE - OPERATIONAL LOG
OPERATION: ProFTPD Exploit Sale

Client: Ransomware Incorporated (GHOST)
Target: St. Catherine's Hospital
Exploit: CVE-2010-4652 (ProFTPD backdoor)
Price: $12,500 (Healthcare sector premium)
Payment: Confirmed 2024-05-15
Status: DELIVERED

flag{distcc_legacy_compromised}
```

**Flag:** `flag{distcc_legacy_compromised}`

**Narrative Context (ERB):**

**What flag represents:**
> "You've exploited Zero Day's legacy infrastructure and accessed operational logs. **CRITICAL INTEL:** ProFTPD exploit sold to GHOST for St. Catherine's Hospital attack!"

**In-Game Intelligence Unlock (ERB Template):**
```erb
<%
m2_connection_intel = {
  "exploit": "CVE-2010-4652 (ProFTPD backdoor)",
  "seller": "Zero Day Syndicate",
  "buyer": "Ransomware Incorporated (GHOST)",
  "target": "St. Catherine's Regional Medical Center",
  "price": "$12,500",
  "date": "2024-05-15",
  "casualties": "4-6 patient deaths (manual recovery path)"
}

if flag_distcc_submitted
  # Unlock Agent 0x99 "aha moment" dialogue
  # Set global variable: m2_connection_revealed = true
  # Trigger in-game revelation scene
end
%>
```

**Unlocks:**
- **MAJOR REVELATION:** Agent 0x99 contact via phone
  > "Agent, this is huge. You've found the connection. Zero Day sold the ProFTPD exploit used in Mission 2's hospital ransomware attack. ENTROPY cells are coordinating. This changes everything."

- M2 connection confirmed (campaign arc progression)
- Sets up closing debrief revelation

**Correlation Opportunity:**
- VM operational log shows "ProFTPD CVE-2010-4652"
- Player remembers M2: "ProFTPD was the vulnerability Ghost exploited!"
- Hex client list (in-game) shows "Ransomware Incorporated"
- FTP banner showed "GHOST"
- **Player realizes:** "Zero Day supplied the exploit that killed 4-6 patients!"

---

## ERB Narrative Content Integration

### Encoded Message 1: ROT13 Whiteboard

**Location:** Conference room (daytime accessible)

**ERB Template:**
```erb
<%
whiteboard_message_plain = "MEET WITH THE ARCHITECT - PRIORITIZE INFRASTRUCTURE EXPLOITS"
whiteboard_message_rot13 = whiteboard_message_plain.tr('A-Za-z', 'N-ZA-Mn-za-m')
# Output: "ZRRG JVGU GUR NEPUVGRPG - CEVBEVGVMR VASENFGEHPGHER RKCYBVGF"
%>

{
  "type": "whiteboard",
  "name": "Strategy Whiteboard",
  "location": "conference_room",
  "text": "<%= whiteboard_message_rot13 %>",
  "observations": "Whiteboard has encrypted message. Use CyberChef to decode ROT13."
}
```

**Correlation with VM:**
- VM flags teach network reconnaissance
- Whiteboard message (ROT13) mentions "THE ARCHITECT"
- Player decodes → discovers strategic priorities
- Connects to distcc operational log mentioning coordination

**Educational Value:**
- ROT13 classical cipher (easy difficulty)
- Pattern recognition (all caps, alphabetic)
- CyberChef usage (in-game workstation)

---

### Encoded Message 2: Hex Client List

**Location:** Victoria's computer (executive office)

**ERB Template:**
```erb
<%
client_list_plain = "ZERO DAY SYNDICATE CLIENT ROSTER\n\nCLIENTS:\nRansomware Incorporated\nCritical Mass\nSocial Fabric\nCrypto Anarchists"

client_list_hex = client_list_plain.unpack('H*').first
# Converts to hexadecimal encoding
%>

{
  "type": "computer",
  "name": "Victoria's Workstation",
  "location": "executive_office",
  "files": [
    {
      "filename": "CLIENT_LIST.txt",
      "content": "<%= client_list_hex %>",
      "observations": "File contains hexadecimal-encoded text. Decode to reveal client roster."
    }
  ]
}
```

**Correlation with VM:**
- FTP banner mentioned "GHOST" codename
- distcc log showed "Ransomware Incorporated"
- Hex client list shows ALL Season 1 cells
- **Player realizes:** "All ENTROPY cells are Zero Day clients!"

**Educational Value:**
- Hexadecimal encoding
- ASCII to hex conversion
- Multi-source intelligence correlation

---

### Encoded Message 3: Base64 Email

**Location:** Victoria's email client (computer)

**ERB Template:**
```erb
<%
victoria_email = "From: Victoria Sterling\nTo: Cipher\nSubject: Q3 Pricing Update\n\nCipher,\n\nQ3 exploit pricing updated:\n\nCRITICAL: $35,000 base\nHIGH: $18,000 base\n\nHealthcare premium: +30%\n\nProFTPD exploit sold to Ransomware Inc for $12,500 (healthcare premium).\n\n- Victoria"

victoria_email_base64 = Base64.strict_encode64(victoria_email)
%>

{
  "type": "email",
  "location": "executive_office_computer",
  "folder": "Drafts",
  "subject": "Q3 Pricing Update (Encoded)",
  "content": "<%= victoria_email_base64 %>",
  "observations": "Email draft is Base64-encoded. Decode to read contents."
}
```

**Correlation with VM:**
- HTTP service flag revealed pricing intelligence
- Base64 email shows actual pricing email
- **CRITICAL:** Email confirms "$12,500 ProFTPD sale to Ransomware Inc"
- Matches distcc operational log exactly

**Educational Value:**
- Base64 (reinforced from M2)
- Email forensics
- Evidence corroboration (VM + in-game sources agree)

---

### Encoded Message 4: Double-Encoded USB

**Location:** Hidden USB in Victoria's desk drawer (lockpick required)

**ERB Template:**
```erb
<%
architect_message_plain = "From: The Architect's Directives\n\nCipher, Future exploitation priorities for Q4:\n\n1. INFRASTRUCTURE EXPLOITS (PRIORITY)\n   Focus on healthcare sector SCADA systems\n   Energy grid ICS vulnerabilities\n\n2. CROSS-CELL COORDINATION\n   Provide Ransomware Inc with hospital targeted economy packages\n\n3. OPERATIONAL SECURITY\n   WhiteHat Security front must remain convinced\n   Victoria Sterling authorized to recruit double agents\n\n- The Architect"

# Step 1: ROT13
architect_message_rot13 = architect_message_plain.tr('A-Za-z', 'N-ZA-Mn-za-m')

# Step 2: Base64 (encode ROT13 output)
architect_message_double = Base64.strict_encode64(architect_message_rot13)
%>

{
  "type": "usb_drive",
  "name": "Encrypted USB Drive",
  "location": "executive_office_desk_drawer",
  "lockpick_difficulty": "medium",
  "contents": {
    "filename": "ARCHITECT_Q4_PRIORITIES.txt",
    "encoding": "Base64 (outer) + ROT13 (inner)",
    "content": "<%= architect_message_double %>",
    "observations": "USB drive contains double-encoded message. Decode Base64 first, then ROT13."
  }
}
```

**Correlation with VM:**
- distcc log showed coordination between cells
- Whiteboard mentioned "THE ARCHITECT"
- **MAJOR REVEAL:** First direct communication from The Architect
- References "Phase 2" (campaign arc setup)

**Educational Value:**
- Multi-stage decoding (advanced)
- Nested encoding patterns (Base64 outer, ROT13 inner)
- Critical thinking (must decode in correct order)
- Persistence (high-value intel requires effort)

---

## Integration Workflow

### Player Journey Flow

**Phase 1: Daytime Reconnaissance (In-Game Only)**
1. Arrive at WhiteHat Security as potential client
2. Meet Victoria Sterling (social engineering, RFID cloning)
3. Optional: Meet James Park (office layout intel)
4. Photograph whiteboard message (ROT13 - "THE ARCHITECT")
5. Build trust with Victoria (alternative paths)
6. Extract, plan nighttime infiltration

**Phase 2: Nighttime Infiltration (Hybrid: In-Game + VM)**
7. Return after hours, navigate guard patrol (in-game stealth)
8. Use cloned RFID card to access server room (in-game)
9. Access VM terminal, scan network (VM: nmap)
10. Submit flag{network_scan_complete} at drop-site (integration point)
11. Banner grab FTP service (VM: netcat) → Submit flag{ftp_intel_gathered}
12. HTTP analysis (VM: Base64 decode) → Submit flag{pricing_intel_decoded}
13. Exploit distcc (VM: CVE-2004-2687) → Submit flag{distcc_legacy_compromised}
14. Access unlocked workstation (in-game, unlocked by VM flags)
15. Lockpick executive office, access Victoria's computer (in-game)
16. Decode Hex client list using CyberChef (in-game)
17. Decode Base64 email using CyberChef (in-game)
18. Lockpick desk drawer, find USB drive (in-game)
19. Decode double-encoded USB (ROT13+Base64) using CyberChef (in-game)

**Phase 3: Correlation & Choice (In-Game Only)**
20. Correlate all evidence (VM flags + encoded messages)
21. Realize M2 connection: ProFTPD exploit sold to Ghost
22. Discover The Architect coordination pattern
23. Optional: Protect James Park choice
24. Victoria confrontation: Arrest vs. Double Agent choice
25. Closing debrief with Agent 0x99

### Integration Points (VM → In-Game Unlocks)

| VM Flag Submission | In-Game Unlock |
|--------------------|----------------|
| `flag{network_scan_complete}` | Server room workstation access, nmap tutorial display |
| `flag{ftp_intel_gathered}` | Client codename list document (correlates with Hex roster) |
| `flag{pricing_intel_decoded}` | Pricing spreadsheet, LORE Fragment 2 safe accessibility |
| `flag{distcc_legacy_compromised}` | **M2 connection reveal**, Agent 0x99 "aha moment" dialogue |

### Correlation Matrix

| Evidence Source | Type | Content | Correlates With |
|-----------------|------|---------|-----------------|
| FTP banner (VM) | Network | "GHOST" codename | Hex client list, distcc log |
| distcc log (VM) | File | ProFTPD sale to Ransomware Inc | Base64 email, M2 mission |
| ROT13 whiteboard (In-Game) | Physical | "THE ARCHITECT" mention | Double-encoded USB |
| Hex client list (In-Game) | Digital | All ENTROPY cells listed | FTP banner, operational logs |
| Base64 email (In-Game) | Digital | "$12,500 ProFTPD sale" | distcc log (exact match) |
| Double-encoded USB (In-Game) | Digital | Architect's Q4 priorities | ROT13 whiteboard, coordination proof |

**Player Correlation Experience:**
- Physical evidence (whiteboards, documents) + Digital evidence (VM flags) + Network evidence (banners, logs) all converge
- Multiple sources confirm same facts (ProFTPD sale mentioned in distcc log AND Base64 email)
- Pattern emerges: "All cells connected, The Architect coordinates, Zero Day supplies exploits"

---

## Educational Integration Approach

### Agent 0x99 Tutorial System

**RFID Cloning Tutorial (Pre-Mission Briefing):**
```
Agent 0x99: "Here's an RFID cloner. Corporate offices use RFID access control—keycards emit radio signals. When you meet Victoria, stay within 2 meters for 10 seconds. The cloner will copy her keycard signature. Watch the progress bar. If she walks away, you'll need to re-engage."
```

**Network Reconnaissance Tutorial (Server Room):**
```
Agent 0x99: "Access the VM terminal. Start with nmap—it's the industry standard for network scanning. Target is 192.168.100.50. Look for open ports: 21 is FTP, 22 is SSH, 80 is HTTP. Service version detection (-sV flag) reveals what's running. Those services are ENTROPY dead drops—scan them, and you'll intercept their communications."
```

**Banner Grabbing Tutorial (After Network Scan):**
```
Agent 0x99: "You've found open ports. Now use netcat to grab service banners. Connect to port 21: nc 192.168.100.50 21. Banners leak information—server versions, custom messages, sometimes even credentials. Zero Day uses banners for operational intelligence."
```

**Encoding Tutorial (CyberChef Workstation):**
```
Agent 0x99: "CyberChef is on this workstation. It's the Swiss Army knife for encoding challenges. You'll see ROT13 (classical cipher), Hex (hexadecimal encoding), and Base64 (binary-to-text). Pattern recognition helps: ROT13 is all caps alphabetic, Hex is 0-9 and A-F pairs, Base64 ends with = padding. Start simple, work up to multi-stage."
```

### In-Game Educational Feedback

**Drop-Site Terminal Educational Annotations:**
```
Network Scan Results (Annotated):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PORT     SERVICE     VERSION          NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
21/tcp   FTP         vsftpd 3.0.3     File transfer (banner grab for intel)
22/tcp   SSH         OpenSSH 7.4      Secure shell (password auth enabled)
80/tcp   HTTP        Apache 2.4.6     Web server (check HTML source)
3632/tcp distcc      distccd v1       Legacy service (VULNERABLE!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSIS:
- FTP (21): Connect with netcat for banner intelligence
- HTTP (80): Fetch page, inspect HTML comments
- distcc (3632): CVE-2004-2687 (Remote Code Execution)

NEXT STEPS: Banner grabbing → Service exploitation
```

### CyberChef Workstation Hints

**ROT13 Hint (After 2 failed attempts):**
```
HINT: ROT13 is a Caesar cipher with 13-position rotation. All uppercase letters suggest classical cipher. Try the ROT13 operation in CyberChef.
```

**Hex Hint (After 2 failed attempts):**
```
HINT: Hexadecimal uses 0-9 and A-F. Two-character pairs (4E 20 65) represent ASCII characters. Try "From Hex" operation in CyberChef.
```

**Double-Encoding Hint (After 3 failed attempts):**
```
HINT: This message is encoded TWICE. Decode Base64 first, then decode the result with ROT13. Multi-stage encoding requires patient analysis.
```

---

## Technical Specifications

### Drop-Site Terminal Implementation

**Ink Script Structure:**
```ink
=== dropsite_terminal ===
#speaker:system

Welcome to Intelligence Drop-Site Terminal.
Submit intercepted ENTROPY communications for analysis.

* [Submit Flag: Network Scan]
    -> submit_network_scan_flag

* [Submit Flag: FTP Intelligence]
    -> submit_ftp_flag

* [Submit Flag: Pricing Intel]
    -> submit_pricing_flag

* [Submit Flag: distcc Compromise]
    -> submit_distcc_flag

* [Exit Terminal]
    -> DONE

=== submit_network_scan_flag ===
Enter flag: {flag_network_scan_complete}

{
- flag_network_scan_complete:
    FLAG VERIFIED: flag\{network_scan_complete\}

    Network reconnaissance successful. Zero Day's infrastructure mapped.

    UNLOCKED: Server room workstation access
    UNLOCKED: Educational network analysis display

    #complete_task:submit_network_scan_flag
    #set_global:flag_network_scan_submitted:true
    #unlock_computer:server_room_workstation

    -> dropsite_terminal

- else:
    INVALID FLAG. Verify flag format and retry.
    -> dropsite_terminal
}
```

### CyberChef Workstation Implementation

**Computer Object:**
```json
{
  "type": "workstation",
  "name": "CyberChef Analysis Workstation",
  "location": "server_room",
  "requires": "flag_network_scan_submitted",
  "tools": [
    {
      "name": "ROT13 Decoder",
      "operation": "rot13",
      "description": "Classical Caesar cipher with 13-position rotation"
    },
    {
      "name": "Hex Decoder",
      "operation": "from_hex",
      "description": "Hexadecimal to ASCII text conversion"
    },
    {
      "name": "Base64 Decoder",
      "operation": "from_base64",
      "description": "Base64-encoded text decoder"
    },
    {
      "name": "Multi-Stage Decoder",
      "operation": "custom",
      "description": "For nested encoding patterns (Base64 + ROT13)"
    }
  ]
}
```

### Global Variables Tracking

```json
"globalVariables": {
  // VM Flag Submissions
  "flag_network_scan_submitted": false,
  "flag_ftp_intel_submitted": false,
  "flag_pricing_intel_submitted": false,
  "flag_distcc_submitted": false,

  // In-Game Encoded Messages Decoded
  "decoded_rot13_whiteboard": false,
  "decoded_hex_client_list": false,
  "decoded_base64_email": false,
  "decoded_double_usb": false,

  // Intelligence Correlation
  "m2_connection_revealed": false,
  "architect_discovered": false,
  "all_cells_identified": false,

  // LORE Fragments
  "lore_client_roster_found": false,
  "lore_exploit_catalog_found": false,
  "lore_architect_directives_found": false,
  "lore_victoria_manifesto_found": false,

  // NPC Trust
  "victoria_trust": 50,
  "james_trust": 30,

  // Moral Choices
  "arrested_victoria": false,
  "became_double_agent": false,
  "protected_james": false,

  // Mission Progress
  "rfid_card_cloned": false,
  "server_room_accessed": false,
  "evidence_collected": 0
}
```

---

## Success Metrics

### Technical Validation (VM Challenges)

**Player demonstrates competence in:**
- ✅ Port scanning (nmap fundamentals)
- ✅ Service enumeration (banner grabbing with netcat)
- ✅ Service exploitation (distcc CVE-2004-2687)
- ✅ Post-exploitation (file navigation, log analysis)

**CyBOK Areas Validated:**
- NSS: Network reconnaissance
- SS: Service exploitation, legacy systems
- SOC: Intelligence gathering, systematic investigation

### Narrative Integration (ERB Content)

**Player experiences:**
- ✅ Rich narrative context for technical challenges
- ✅ Encoded message puzzles (ROT13, Hex, Base64, nested)
- ✅ Intelligence correlation (physical + digital + network evidence)
- ✅ Campaign arc progression (M2 connection, Architect discovery)
- ✅ Meaningful choices (Victoria arrest/recruit, James protection)

**Educational Reinforcement:**
- ACS: Multiple encoding types, pattern recognition
- SOC: Evidence correlation, systematic analysis
- HF: Social engineering, trust exploitation

### Hybrid Architecture Benefits

**For Players:**
- VM challenges validate technical skills (consistent assessment)
- ERB narrative makes challenges meaningful (story context)
- Dead drop system creates satisfying progression (flags → unlocks)
- Correlation moments feel earned (evidence from multiple sources)

**For Educators:**
- Technical validation stable (VM unchanged)
- Narrative updates easy (ERB flexibility)
- CyBOK alignment clear (VM for technical, ERB for context)

**For Developers:**
- VM separation reduces complexity (pre-built scenarios)
- ERB templates enable rapid iteration (narrative changes)
- Ink scripts handle complexity (NPC dialogues, tutorials)

---

## Quality Assurance

### Integration Testing

**Verify:**
1. All VM flags submit correctly at drop-site terminal
2. Flag submissions unlock corresponding in-game resources
3. CyberChef workstation decodes all encoding types
4. Global variables track progress accurately
5. Correlation opportunities clear to players

**Test Cases:**
- Submit flags out of order (should work, objectives track individually)
- Decode in-game messages before submitting VM flags (should work, independent)
- Skip optional content (Victoria social engineering path, James protection)
- Complete perfect run (all flags, all LORE, all choices)

### Educational Validation

**Verify:**
1. Agent 0x99 tutorials appear at correct moments
2. CyberChef hints activate after failed attempts
3. Drop-site terminal annotations clarify nmap output
4. Correlation moments obvious (multiple sources point to same facts)

---

**Document Status:** ✅ COMPLETE
**Stage 0 Status:** ✅ ALL DOCUMENTS COMPLETE (4/4)
**Next Stage:** Stage 1 - Narrative Structure Development

---

## Stage 0 Completion Summary

### Documents Created (4/4):
1. ✅ `00_scenario_initialization.md` (820 lines) - Mission framework
2. ✅ `technical_challenges.md` (812 lines) - Challenge specifications
3. ✅ `narrative_themes.md` (600+ lines) - Storytelling elements
4. ✅ `hybrid_architecture_plan.md` (700+ lines) - VM + ERB integration

**Total:** ~2,900+ lines of Stage 0 documentation

### Ready for Stage 1:
- Narrative structure development (scene-by-scene breakdown)
- 3-act structure expansion (12-15 scenes)
- Emotional arc mapping
- Pacing chart design

---
