# Mission 7: "The Architect's Gambit" - Stage 0: Option C (Supply Chain Infection)

**Mission ID:** m07_architects_gambit **Branch:** Option C - Supply Chain Infection **Stage:** 0 - Initialization **Version:** 1.0 **Date:** 2026-01-10

---

## Mission Overview

**Title:** "The Architect's Gambit - Supply Chain Infection" **Duration:** 80-100 minutes **Target Tier:** 3 (Advanced) **Mission Type:** Crisis Defense - Time Limited **Focus:** Supply chain security, software integrity, backdoor detection

**CRITICAL CONTEXT:** This is ONE of FOUR simultaneous operations. Player chooses this option knowing the other three attacks will be handled by SAFETYNET teams—with mixed success.

---

## The Specific ENTROPY Threat

### Target: TechForge Software Distribution Platform

**Company Profile:**

- Leading software update distribution network
- Serves 2,400+ enterprise software vendors
- Distributes updates to 47 million systems nationwide
- Automated signing and deployment infrastructure
- Trusted by Fortune 500, government agencies, healthcare

**What They Do:** TechForge is the "CDN for software updates"—vendors upload patches, TechForge signs and distributes to end-users via automated channels. If compromised, attackers can inject malicious code into legitimate software updates.

### The Attack: "Operation Trojan Horse"

**SPECIFIC ATTACK BEING EXECUTED:**

**Phase 1: Infrastructure Infiltration (Completed - Before Player Arrives)**

- Supply Chain Saboteurs infiltrated TechForge 4 months ago
- Compromised code signing infrastructure
- Planted backdoors in update verification systems
- Obtained private signing keys for 840 software vendors

**Phase 2: Backdoor Injection (In Progress - 30 Minutes Until Deployment)**

- Automated system will inject backdoors into software updates for:
  - Enterprise security software (antivirus, firewalls, EDR)
  - Operating system patches (Windows, macOS, Linux)
  - Financial software (banking, trading platforms)
  - Healthcare systems (patient record management)
  - Government software (used by federal agencies)
- Backdoors are polymorphic (different for each vendor to avoid detection)
- Once deployed, ENTROPY gains persistent access to 47 million systems

**Phase 3: Long-Term Espionage (If Not Stopped)**

- Backdoors remain dormant for 90 days (avoid immediate detection)
- Then activate gradually:
  - Exfiltrate sensitive data (trade secrets, financial records, PII)
  - Enable remote access for future attacks
  - Create persistent presence on national infrastructure
- ENTROPY can sell access to nation-states: China, Russia, Iran, North Korea
- Estimated value: $800M-$1.2B over 5 years

**Specific Consequences if Supply Chain Saboteurs Succeed:**

1. **Immediate Infrastructure Compromise**
   - 47 million systems infected with backdoors
   - Includes: 18,000 hospitals, 12,000 financial institutions, 4,200 government agencies
   - Backdoors undetectable for 90+ days (stealth design)
   - Once discovered, cleaning requires rebuilding from scratch
1. **Long-Term National Security Threat**
   - Foreign adversaries gain access to US government systems
   - Military communications compromised
   - Industrial espionage on massive scale
   - Economic damage: $240-420 billion over 10 years (IP theft, remediation)
1. **Public Trust Collapse**
   - Software updates permanently viewed as untrustworthy
   - Organizations stop patching (security degradation)
   - Technology sector credibility destroyed
   - International competitors gain advantage
1. **Future Attack Platform**
   - ENTROPY can trigger coordinated attacks across 47M systems
   - Ransomware deployment at scale
   - Data destruction ("wiper" malware)
   - Critical infrastructure attacks
1. **ENTROPY Strategic Win**
   - Proof that supply chains are vulnerable
   - Establishes Supply Chain Saboteurs as elite threat
   - Generates massive revenue for continued operations
   - The Architect demonstrates long-term strategic thinking

---

## The Setting: TechForge Distribution Center

### Location

- Industrial campus outside Austin, Texas
- 6-story main building + underground server vaults
- High-security facility (defense contractor standards)
- 24/7 operations for global software distribution

### Security Measures

- Multi-factor badge access (RFID + biometric)
- Armed security (private military contractors)
- Server cages with separate access controls
- Code signing HSMs (Hardware Security Modules) in vault
- 147 surveillance cameras, motion sensors

### Critical Locations (Rooms)

1. **Lobby / Security Checkpoint**
   - Entry point after emergency breach
   - Private security (2 compromised by ENTROPY, 2 innocent)
   - Visitor management system
1. **Operations Floor**
   - 40 engineers monitoring software distribution
   - Real-time displays showing update deployments
   - Innocent staff unaware of compromise
1. **Code Signing Vault**
   - Hardware Security Modules (HSMs) storing signing keys
   - Physically isolated, biometric access
   - Supply Chain Saboteurs compromised HSM firmware
   - VM access point for exploitation challenges
1. **Update Staging Servers (PRIMARY TARGET)**
   - Servers where backdoors are being injected
   - Countdown timer showing deployment schedule
   - Must disable injection before updates deploy
   - Contains backdoor payload code
1. **Network Operations Center**
   - Central control for all distribution infrastructure
   - Can emergency-stop update deployments
   - Final confrontation location
1. **Evidence Server Room**
   - Logs of compromised updates
   - Intelligence about Supply Chain Saboteurs methods
   - Contains Tomb Gamma coordinates

---

## The Antagonist: Adrian Cross (Supply Chain Saboteurs Leader)

**Profile:**

- Age: 42
- Role: Supply Chain Saboteurs operations manager, former software engineer
- Background: Worked at major tech company, witnessed negligent security practices, radicalized
- Motivation: "The software industry is built on lies. Security theater. We're revealing the truth."
- Personality: Methodical, patient, views supply chain attacks as elegant solutions

**Combat Capability:**

- Not physically aggressive (prefers escape)
- Has dead man's switch (will deploy backdoors if killed)
- Excellent at social engineering and blending in
- Will attempt to recruit player (appeal to shared security concerns)

**Moral Complexity:**

- Adrian's criticisms of software industry are valid
- Supply chain vulnerabilities are real and widely ignored
- His methods are extreme but his technical arguments are sound
- Can be convinced to provide intelligence if shown ENTROPY casualty evidence

**Technical Expertise:**

- Deep knowledge of code signing infrastructure
- Understands cryptographic weaknesses in update systems
- Can guide player through disabling backdoors (if recruited)
- Valuable long-term intelligence asset if turned

---

## VM Challenge Integration: "Putting It Together"

**SecGen Scenario:** NFS shares, netcat, privilege escalation, multi-stage

**Challenge Flow:**

1. **NFS Share Discovery**
   - Backup server has exposed NFS shares with attack staging
   - Player mounts filesystem to find:
     - Backdoor payload source code
     - Deployment timeline and target vendor list
     - Signing key theft evidence
1. **Netcat Service Exploitation**
   - Supply Chain Saboteurs use netcat for C2
   - Enumerate services to find command channel
   - Intercept shutdown codes for injection system
1. **Privilege Escalation**
   - Update staging servers require root access
   - Exploit sudo misconfigurations or SUID binaries
   - Gain access to disable backdoor injection
1. **Multi-Stage Attack Neutralization**
   - Stage 1: Identify active injection processes
   - Stage 2: Extract deactivation codes from NFS shares
   - Stage 3: Terminate injection before updates deploy
   - Stage 4: Quarantine already-modified updates
   - Stage 5: Restore legitimate signing keys

**Flags to Submit:**

- Flag 1: NFS mount + backdoor payload discovery
- Flag 2: Netcat C2 access + deployment timeline
- Flag 3: Privilege escalation + root access
- Flag 4: Injection disabled + updates quarantined

---

## The Architect's Presence

**Communication Method:** Text messages injected into facility displays

**Taunt Progression:**

**T-minus 30 minutes:** "Supply chain attacks are beautiful. One compromise, millions infected. Efficiency."

**T-minus 20 minutes:** "You chose long-term threat over immediate deaths. Interesting priorities, Agent 0x00."

**T-minus 10 minutes:** "Adrian believes software security is a lie. He's correct. But he doesn't understand he's part of a larger collapse."

**T-minus 5 minutes:** "Even if you stop this, trust is already broken. Nobody will update software for years. Mission accomplished."

**T-minus 1 minute:** "47 million systems. Think about that scale. You can't save everyone tonight."

**After Success:** "Congratulations. You prevented future espionage. Meanwhile, present-day casualties mount at other targets."

---

## Success vs. Failure Outcomes

### If Player Succeeds (Disables Injection)

- Backdoors prevented from deploying
- Zero systems compromised
- Adrian Cross arrested or recruited (player choice)
- Supply Chain Saboteurs operations disrupted
- TechForge security improved (lessons learned)
- Intelligence recovered: Tomb Gamma location

### If Player Partially Succeeds (Common)

- Some backdoors prevented, others deployed
- Estimated 8-15 million systems compromised (instead of 47M)
- Long-term espionage capability reduced but not eliminated
- Partial economic damage over 10 years

### If Player Fails (Injection Completes)

- All 47 million systems infected with backdoors
- Backdoors remain dormant for 90 days
- Long-term national security catastrophe
- $240-420B economic damage over 10 years
- Software update trust permanently destroyed
- ENTROPY gains massive intelligence capability

### Other Operations (Unchosen - Deterministic)

Based on player choosing Option C:

- **Operation A (Infrastructure):** Partial success (Some blackouts prevented, others occur)
- **Operation B (Data Apocalypse):** Full success (SAFETYNET Team Bravo stops both attacks)
- **Operation D (Corporate):** Failure (Zero-day attacks succeed, economic damage)

---

## Key NPCs

### Hostile NPCs (Supply Chain Saboteurs)

1. **Adrian Cross** (Cell Leader)
   - Location: Network Operations Center
   - Combat: Non-violent, prefers escape or recruitment
   - Dialogue: Technical arguments, valid criticisms of industry
   - Arrest vs. Recruit choice (recruitable with evidence)
1. **Elena Vasquez** (Code Signing Specialist)
   - Location: Code Signing Vault
   - Role: Compromised HSM firmware, maintains signing keys
   - Combat: Non-violent, technical expert
   - Will cooperate if Adrian is turned
1. **James Park** (Security Guard - Compromised)
   - Location: Lobby
   - Role: Inside man, provides access to operatives
   - Combat: Armed, will shoot if exposed
   - Knows facility layout, can be interrogated
1. **Marcus Chen** (Network Engineer)
   - Location: Update Staging Servers
   - Role: Maintains injection system, monitors deployments
   - Combat: Will flee if confronted
   - Technical knowledge useful for disabling system

### Innocent NPCs (TechForge Staff)

1. **Rebecca Thompson** (Chief Security Officer)
   - Discovered the compromise 20 minutes ago
   - Called SAFETYNET immediately
   - Can provide facility access and technical guidance
   - Devastated by security failure
1. **Dr. Alan Foster** (Software Engineer)
   - Technical expert on update distribution systems
   - Can guide player through VM challenges
   - Wants to minimize damage to company reputation
1. **Sarah Kim** (Security Guard - Innocent)
   - Unaware of James Park's betrayal
   - Will help player if shown SAFETYNET credentials
   - Can disable cameras to aid infiltration

---

## Objectives System

### Aim 1: Emergency Breach & Assessment

- Task: Breach TechForge security (SAFETYNET authority)
- Task: Identify compromised vs. innocent security personnel
- Task: Access operations floor to assess attack progress
- Task: Locate code signing vault and update staging servers

### Aim 2: VM Exploitation & Intelligence

- Task: Access backup server in code signing vault
- Task: Complete VM challenge (NFS, netcat, privesc)
- Task: Extract backdoor payloads and shutdown codes
- Task: Submit all 4 flags to SAFETYNET

### Aim 3: Disable Backdoor Injection

- Task: Reach update staging servers before deployment
- Task: Confront Marcus Chen (network engineer)
- Task: Disable injection system using extracted codes
- Task: Quarantine already-modified updates

### Aim 4: Secure Signing Infrastructure

- Task: Access code signing vault
- Task: Confront Elena Vasquez (signing specialist)
- Task: Restore legitimate signing keys
- Task: Lock out ENTROPY access to HSMs

### Aim 5: Confront Leadership & Choices

- Task: Reach network operations center
- Task: Confront Adrian Cross (cell leader)
- Task: Choose: Arrest or Recruit (with casualty evidence)
- Task: Secure facility and prevent system restart

### Aim 6: Intelligence Recovery & Debrief

- Task: Search evidence server room for ENTROPY communications
- Task: Discover Tomb Gamma coordinates
- Task: Find SAFETYNET mole evidence
- Task: Emergency debrief with Agent 0x99

---

## Timer Mechanic Implementation

**Duration:** 30 minutes in-game time (deployment countdown)

**Visual Indicators:**

- Countdown timer on all facility displays
- Update deployment progress bar (vendors queued for backdoors)
- Staging server status: Shows % of updates modified
- Player phone overlay with persistent timer

**Pressure Escalation:**

- T-minus 25 min: Rebecca Thompson briefs player on compromise
- T-minus 20 min: The Architect begins taunting
- T-minus 15 min: Adrian Cross attempts to delay player
- T-minus 10 min: Elena attempts to accelerate deployment if detected
- T-minus 5 min: Marcus triggers failsafe (player must overcome)
- T-minus 1 min: Final confrontation with Adrian in NOC

**Failure State:** If timer reaches zero before player disables injection:

- Backdoors deploy to all queued software updates
- Cutscene: Map showing infections spreading nationwide
- Adrian escapes or arrested (depending on player position)
- Transition to failure debrief (long-term consequences revealed)

---

## LORE Reveals (Option C)

### Tomb Gamma Location

Adrian's encrypted notes:

- **Location:** Abandoned Cold War bunker, Montana wilderness
- **Coordinates:** 47.2382° N, 112.5156° W
- **Note:** "All cell leaders report to Tomb Gamma if operations fail. The Professor provides extraction."

### SAFETYNET Mole Evidence

Intercepted message on backup server:

- **From:** [REDACTED]@safetynet.gov
- **To:** <architect@entropy.onion>
- **Subject:** Simultaneous operations confirmed
- **Body:** "0x00 deployed to supply chain. Teams handle infrastructure/data/corporate. Proceed with all four operations."

### The Architect's Philosophy

Text message:

- "Supply chains are civilization's Achilles heel. One cut, everything bleeds."
- "Trust is fragile. Software trust even more so. Watch it shatter."

### Adrian's Recruitment Path (If Shown Evidence)

If player shows Adrian ENTROPY casualty projections:

- "Wait. The Architect said this was about exposing vulnerabilities. Not killing people."
- "Those casualty numbers... from coordinated attacks? That's not security research. That's terrorism."
- "I thought we were white-hat vigilantes. We're... tools for someone's war."
- *Recruitment success: Adrian provides intelligence on Supply Chain Saboteurs methods, becomes SAFETYNET consultant*

---

## Development Notes

**Priority Implementation:**

1. Timer mechanic with deployment progress visualization
2. Adrian Cross recruitment path (valuable long-term asset)
3. Technical authenticity (real supply chain attack methods)
4. Backdoor payload evidence (must feel tangible, not abstract)

**Technical Challenges:**

- Conveying scale (47M systems) without overwhelming player
- Making long-term consequences feel real despite no immediate deaths
- Balance difficulty of disabling multi-stage injection
- Ensure VM challenges integrate naturally with time pressure

**Playtesting Focus:**

- Does lack of immediate death feel less urgent? (It shouldn't)
- Is Adrian's recruitment arc compelling?
- Do supply chain concepts feel comprehensible to non-technical players?
- Is timer pressure appropriate given complexity?

**Narrative Consistency:**

- Supply chain attacks are REAL threat (SolarWinds, Kaseya examples)
- Adrian's motivations must be sympathetic (not purely evil)
- TechForge security failures must feel plausible
- The Architect should feel like strategic mastermind

**Educational Value:**

- Teach real supply chain security challenges
- Show how software trust can be weaponized
- Demonstrate scale of modern software distribution
- Explore ethics of prioritizing future vs. present threats

**Unique Challenge:**

- This option has NO immediate deaths if it fails
- Must make long-term consequences feel weighty
- Player must understand choosing this accepts present-day deaths elsewhere
- Moral complexity: 47M future victims vs. hundreds dying tonight
