# TECHNICAL DOCUMENTATION: Equilibrium.dll - SCADA Backdoor

**Classification:** ENTROPY INTERNAL - TECHNICAL SPECIALISTS ONLY
**Document ID:** TECH-TOOL-001
**Version:** 3.4 (Updated April 2024)
**Authors:** The Architect (original design), "SCADA Queen" - Critical Mass cell (implementation)
**Tool Name:** Equilibrium.dll
**Purpose:** SCADA system persistence and load manipulation backdoor

---

> **⚠️ SAFETYNET ANALYST ANNOTATION — 2026 threat reassessment.**
> The "Bypass Lists — Critical Infrastructure Protection" section below calls the hospital / emergency-services no-touch list "sacred" and "non-negotiable" — "If we cause deaths, we're terrorists, not demonstrators." That constraint has since been broken deliberately: Operation Resilience (Ransomware Incorporated, m02) targeted a hospital with patients on life support. The bypass list documents the founding ideal, not current rules of engagement. See `story_design/universe_bible/02_organisations/entropy/philosophy.md` §Propaganda vs. Operational Reality.

---

## Executive Summary

**Equilibrium.dll** is a Windows DLL side-loading backdoor designed for deployment on Industrial Control Systems (ICS) and SCADA environments controlling electrical grid operations.

**Primary Function:**
- Persist on SCADA workstations and HMI (Human-Machine Interface) systems
- Intercept and modify load balancing commands
- Enable coordinated rolling brownouts without equipment damage
- Remain undetected by antivirus and SIEM systems

**Deployment Status (April 2024):**
- Installed on 847 systems across 47 power utility operators
- Dormant since installation (awaiting Phase 3 activation)
- Zero detections by AV/EDR solutions
- C2 infrastructure tested and operational

---

## Strategic Context

### Why SCADA?

**Vulnerability:**
- SCADA systems average 15-20 years old
- Windows XP/7 Embedded still common (unpatched, unsupported)
- Air-gap assumptions false (90% connected to corporate networks)
- Security through obscurity mindset
- Patch cycles measured in years (risk-averse operations)

**Impact:**
- Critical infrastructure control
- Affects millions of residents
- Demonstrates centralized grid fragility
- High visibility, low actual harm potential (if controlled properly)

**Risk:**
- High legal exposure (critical infrastructure tampering)
- High technical complexity (ICS-specific protocols)
- High ethical stakes (power grid affects hospitals, emergency services)

**Mitigation:**
- Load manipulation only (no equipment damage)
- Hospital/emergency bypass lists (never touch critical loads)
- Rolling brownouts (2-hour max duration per region)
- Remote kill switch (can disable malware immediately)

---

## Technical Specifications

### Target Environment

**Operating Systems:**
- Windows XP Embedded (35% of targets)
- Windows 7 Embedded (50% of targets)
- Windows 10 IoT (15% of targets)

**Software:**
- Siemens SIMATIC WinCC
- GE iFIX
- Schneider Electric Wonderware
- ABB 800xA
- Custom utility-specific SCADA apps

**Network:**
- Corporate network connectivity (90% of targets)
- Direct internet access (15% of targets)
- Air-gapped (10% of targets - requires USB deployment)

### Delivery Mechanism

**Primary:** DLL Side-Loading

Many SCADA applications load unsigned DLLs from application directory. We exploit this.

**Vulnerable Application:** Siemens SIMATIC WinCC (most common)

Normal DLL load order for `CCProjectMgr.exe`:
1. Application directory
2. System32 directory
3. PATH directories

**Our Exploit:**
- Place `Equilibrium.dll` in application directory
- Rename to `version.dll` (commonly searched DLL)
- CCProjectMgr.exe loads our DLL instead of legitimate version.dll
- Our DLL loads legitimate version.dll from System32 (proxy execution)
- CCProjectMgr continues working normally, no errors

**Deployment:**
- Asset with admin rights places DLL in `C:\Program Files\Siemens\WinCC\bin\`
- Reboot or application restart triggers load
- Persistence: DLL loads every time SCADA app runs

---

## Code Architecture

### File Structure

```
Equilibrium.dll
├── Proxy Functions (version.dll exports)
├── Initialization Routine
├── Persistence Mechanism
├── C2 Communication Module
├── Load Manipulation Logic
├── Anti-Detection Mechanisms
└── Self-Destruct Function
```

### Proxy Functions

**Purpose:** Maintain application compatibility

```c
// Export all functions from legitimate version.dll
#pragma comment(linker, "/export:GetFileVersionInfoA=version_orig.GetFileVersionInfoA,@1")
#pragma comment(linker, "/export:GetFileVersionInfoW=version_orig.GetFileVersionInfoW,@2")
// ... (15 total exports)
```

Application calls GetFileVersionInfoA → Our DLL intercepts → Calls real version.dll → Returns result

Application never knows we're there.

### Initialization Routine

**Executed on DLL_PROCESS_ATTACH:**

```c
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved)
{
    if (fdwReason == DLL_PROCESS_ATTACH)
    {
        DisableThreadLibraryCalls(hinstDLL);

        // Load legitimate version.dll from System32
        LoadLibraryA("C:\\Windows\\System32\\version.dll");

        // Initialize our payload in separate thread (avoid blocking)
        CreateThread(NULL, 0, InitPayload, NULL, 0, NULL);
    }
    return TRUE;
}
```

**InitPayload() Function:**
1. Check if already running (mutex check)
2. Establish persistence (registry key)
3. Enumerate network interfaces
4. Connect to C2 server (if network available)
5. Load configuration (targets, bypass lists)
6. Hook SCADA control functions
7. Enter dormant state

---

## C2 Communication

### Infrastructure

**C2 Servers:**
- Primary: `maintenance-updates.scada-systems.com` (domain fronting via CloudFlare)
- Backup: `172.16.45.22` (hardcoded IP, dormant hosting)
- Emergency: USB dead drop instructions (if network unavailable)

**Protocol:**
- HTTPS (port 443, blends with legitimate traffic)
- SSL pinning (prevents MitM analysis)
- Traffic mimics Windows Update checks (user-agent, timing, packet size)

**Communication Frequency:**
- Dormant: Every 7 days (check-in only)
- Active: Every 30 minutes (status updates)
- Phase 3: Every 5 minutes (real-time coordination)

**Commands:**
- `STATUS`: Report system info, load state
- `CONFIG`: Update bypass lists, operational parameters
- `ACTIVATE`: Begin load manipulation (Phase 3 start)
- `STANDBY`: Stop manipulation, return to dormant
- `KILL`: Self-destruct and remove all traces

### Payload Encryption

**Asymmetric Encryption (C2 Commands):**
- RSA-2048 for command signing
- Public key embedded in DLL
- Commands signed by C2 server (prevents unauthorized commands)

**Symmetric Encryption (Data):**
- AES-256-GCM for status reports
- Per-session keys (ephemeral, negotiated via Diffie-Hellman)

**Purpose:** Even if network traffic captured, analysis reveals nothing useful.

---

## Load Manipulation Logic

### How Power Grids Work (Simplified)

**Basics:**
- Generation plants produce power
- Transmission lines distribute power
- Load balancing ensures supply = demand
- SCADA systems monitor and adjust in real-time

**If demand > supply:**
- Brownout (voltage reduction) or blackout (service interruption)
- Emergency load shedding (intentional outages to protect grid)

**Our Manipulation:**
- Don't reduce supply (don't turn off generators)
- Manipulate load distribution commands
- Create artificial "high load" signals
- SCADA system responds by load shedding
- Result: Rolling brownouts (controlled, reversible)

### Implementation

**Hook SCADA Function:**
```c
// Intercept load distribution command
BOOL WINAPI SetLoadDistribution(int zoneID, int loadPercentage)
{
    // Check if this zone is on bypass list (hospitals, emergency services)
    if (IsOnBypassList(zoneID))
    {
        // Never touch critical infrastructure
        return OriginalSetLoadDistribution(zoneID, loadPercentage);
    }

    // Check if manipulation active (Phase 3)
    if (g_ManipulationActive)
    {
        // Check if zone has been in brownout for >2 hours
        if (GetZoneBrownoutDuration(zoneID) > 7200) // 2 hours in seconds
        {
            // Rotate to different zone (rolling brownout)
            int targetZone = GetNextRotationZone();
            return OriginalSetLoadDistribution(targetZone, 0); // Shed load in new zone
        }
        else
        {
            // Continue current brownout
            return OriginalSetLoadDistribution(zoneID, 0); // Shed load
        }
    }

    // Not in Phase 3, pass through normally
    return OriginalSetLoadDistribution(zoneID, loadPercentage);
}
```

**Key Features:**
- Bypass list (hospitals, police, fire stations NEVER affected)
- Time limits (max 2 hours brownout per zone before rotation)
- Equipment protection (don't touch generation/transmission hardware)
- Reversibility (stop manipulation anytime, grid recovers immediately)

---

## Anti-Detection Mechanisms

### AV Evasion

**Signature Avoidance:**
- No known malware patterns (custom code)
- Encrypted strings (no plaintext "C2 server" etc.)
- Polymorphic code (each compilation slightly different)
- Code obfuscation (control flow flattening)

**Behavioral Evasion:**
- Mimics legitimate SCADA operations
- Low CPU/memory footprint
- No suspicious registry keys
- Network traffic looks like Windows Update

**Tested Against:**
- Windows Defender (Undetected)
- Symantec Endpoint Protection (Undetected)
- McAfee (Undetected)
- CrowdStrike Falcon (Undetected - as of March 2024)

**Detection Risk:**
- YARA rules: Possible if they search for DLL side-loading patterns
- EDR behavioral analysis: Possible if closely monitored
- Network analysis: Possible if HTTPS decrypted and analyzed

**Mitigation:**
- Deploy only on low-security environments (most SCADA are)
- Avoid high-security targets with advanced EDR
- Domain fronting makes C2 harder to attribute

### SIEM Evasion

**Log Manipulation:**
- DLL load events: Common, not alarming
- Network traffic: HTTPS to CDN (CloudFlare), looks normal
- No unusual process creation (runs in SCADA app process)

**Timing:**
- Check-ins randomized ±2 hours (not predictable pattern)
- Activity during business hours only (night silence to avoid detection)

---

## Bypass Lists - Critical Infrastructure Protection

**ABSOLUTE REQUIREMENT:**
NEVER affect life-safety systems. This is non-negotiable.

**Bypass Categories:**

**Category 1: Hospitals**
- All hospital zones
- Medical campuses
- Urgent care facilities
- Dialysis centers

**Category 2: Emergency Services**
- Police stations
- Fire stations
- 911 call centers
- Ambulance dispatch

**Category 3: Critical Infrastructure**
- Water treatment plants
- Wastewater processing
- Telecommunications hubs
- Data centers hosting 911/emergency systems

**Category 4: Government**
- Federal buildings
- Military installations (not targeted anyway)
- Emergency management centers

**Implementation:**
- Hardcoded zone IDs in DLL
- Updated via C2 configuration pushes
- Double-check before every load shed command
- If in doubt, bypass (err on side of caution)

**Ethical Imperative:**
If we cause deaths, we're terrorists, not demonstrators. The bypass list is sacred.

---

## Phase 3 Activation Sequence

### T-Minus 7 Days (July 8, 2025)

**C2 Command:** `CONFIG` (final bypass list update)

All installations receive:
- Final hospital bypass list (confirmed accurate)
- Final emergency services bypass list
- Updated timing parameters (2-hour rotation confirmed)
- Final status check (report installation health)

### T-Minus 1 Day (July 14, 2025, 23:00)

**C2 Command:** `ACTIVATE_STANDBY`

Payload switches from dormant to active mode:
- Increase check-in frequency (every 5 minutes)
- Load manipulation logic armed (awaiting final activate)
- Self-test bypass lists (verify no critical infrastructure on manipulation list)

### July 15, 2025, 06:00 EST (Activation)

**C2 Command:** `ACTIVATE_EXECUTE`

Begin load manipulation:
- Target zones identified (residential/commercial, non-critical)
- Load shedding initiated
- Rolling brownout begins

**Expected Impact:**
- 2.4 million residents experience 2-hour brownouts over 6-8 hour window
- Media coverage: "Power grid under cyberattack"
- Emergency services unaffected (bypass working)
- Economic disruption: minimal (brief inconvenience)

### July 15, 2025, 14:00 EST (Stand Down)

**C2 Command:** `STANDBY`

Cease manipulation:
- Stop load shedding
- Grid returns to normal operations
- Payload returns to dormant state
- Mission accomplished

**Expected Result:**
- 8-hour window of coordinated brownouts demonstrates grid vulnerability
- Zero casualties (bypass list worked)
- Reversible (grid recovered immediately)
- Point made, no need to continue

### July 20, 2025 (Clean Up)

**C2 Command:** `KILL`

Self-destruct:
- Delete Equilibrium.dll from disk
- Remove registry keys
- Clear logs
- Zero forensic traces
- Payload uninstalls itself

**Purpose:** Minimize post-operation forensic analysis.

---

## Risk Analysis

### Technical Risks

**Risk: Payload detected before Phase 3**
- Likelihood: Low (847 installations, zero detections to date)
- Impact: Operation aborted for detected systems, others proceed
- Mitigation: Dormancy, anti-detection mechanisms

**Risk: C2 infrastructure taken down**
- Likelihood: Medium (domain fronting helps but not perfect)
- Impact: No command/control, installations remain dormant
- Mitigation: Hardcoded activation date as fallback (built into DLL)

**Risk: Bypass list incomplete, critical infrastructure affected**
- Likelihood: Low (extensive verification)
- Impact: CATASTROPHIC (deaths, terrorism charges)
- Mitigation: Triple-checking bypass lists, err on side of caution

**Risk: Unintended equipment damage**
- Likelihood: Very Low (we don't touch generation/transmission hardware)
- Impact: High (financial liability, potential injuries)
- Mitigation: Load manipulation only, no equipment control

### Operational Risks

**Risk: Asset arrested before Phase 3**
- Likelihood: Low (compartmentalization, OPSEC)
- Impact: Medium (one installation lost, others continue)
- Mitigation: Multiple assets per utility, redundancy

**Risk: Insider asset defects, warns utility**
- Likelihood: Low (asset vetting, monitoring)
- Impact: High (targeted removal, investigation)
- Mitigation: Asset compartmentalization (one asset doesn't know others)

### Ethical Risks

**Risk: Despite precautions, someone dies (heart attack during stress, medical equipment failure, etc.)**
- Likelihood: Low but non-zero
- Impact: CATASTROPHIC (moral failure, terrorism classification)
- Mitigation: Bypass lists, 2-hour limits, real-time monitoring, abort criteria

**If deaths occur:**
- Abort immediately (KILL command sent to all installations)
- The Architect takes personal responsibility
- ENTROPY reputation destroyed, mission failed

**This is the ultimate failure mode. It must not happen.**

---

## Success Metrics

**Technical Success:**
- 60%+ of installations execute successfully
- C2 maintains connectivity throughout operation
- Bypass lists prevent critical infrastructure impact
- Zero equipment damage

**Operational Success:**
- 6-8 hour window of coordinated brownouts
- 2+ million residents affected
- Emergency services unaffected
- Grid recovers immediately after stand-down

**Strategic Success:**
- Media coverage: "Coordinated cyberattack on power grid"
- Public awareness of grid vulnerability
- Congressional hearings on infrastructure security
- Industry investment in security increases

**Ethical Success:**
- Zero casualties
- Zero life-safety system impacts
- Reversible damage only
- Public sees demonstration, not terrorism

---

## Lessons Learned (Pre-Phase 3)

**Development (2019-2023):**
- Side-loading is reliable attack vector (still works in 2024)
- SCADA environments have minimal security (true)
- Testing in lab environment was critical (found bugs before deployment)
- Asset training required significant time (SCADA complexity)

**Deployment (2020-2024):**
- Air-gapped systems overstated (90% connected)
- Antivirus in SCADA environments often disabled (operational stability prioritized)
- Patch cycles are years-long (Windows XP still common in 2024)
- Assets nervous but reliable (financial incentives work)

**Pre-Phase 3:**
- Bypass list verification took 6 months (worthwhile investment)
- Hospital/emergency service mapping more complex than expected
- C2 infrastructure domain fronting working well
- 847 installations exceed initial 500-installation goal

---

## Post-Phase 3 Analysis (Placeholder)

*To be filled after July 15, 2025*

**What worked:**
TBD

**What failed:**
TBD

**Lessons for future operations:**
TBD

**Casualties (if any):**
TBD

**Moral assessment:**
TBD

---

## Conclusion

**Equilibrium.dll represents:**
- 5 years of development (2019-2024)
- Collaboration between The Architect (design) and Critical Mass cell (implementation)
- Significant technical sophistication
- Careful ethical constraints
- High-risk, high-impact operation

**This tool is our most powerful and most dangerous.**

If used correctly: Demonstrates grid fragility, drives policy change, zero harm.

If used incorrectly: Causes casualties, destroys ENTROPY's legitimacy, terrorism charges.

**The bypass list is absolute. Life safety is absolute. No exceptions.**

July 15, 2025, we will know if 5 years of work achieved its purpose.

---

The Architect
"SCADA Queen" (Critical Mass)

---

**APPENDIX A:** Detailed Code (Encrypted Archive - Not Included)
**APPENDIX B:** C2 Server Setup Guide (See TECH-INFRA-002)
**APPENDIX C:** Asset Deployment Training (See TRAIN-TECHNICAL-001)

---

**Document Control:**
- Revision History: v1.0 (Sep 2019), v2.0 (Mar 2022), v3.4 (Apr 2024)
- Next Review: Post-Phase 3 (August 2025)
- Approval: The Architect, "Blackout" - Critical Mass Leader (Authenticated: PGP Signature 7A9B4C...)

**DESTROY AFTER PHASE 3 COMPLETION**

**END OF DOCUMENT**
