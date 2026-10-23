# SAFETYNET Technology & Resources

## Overview

SAFETYNET provides field agents with a comprehensive suite of tools, technologies, and support resources. The organisation balances providing cutting-edge capabilities with maintaining operational security and plausible deniability. Equipment must be effective enough to complete missions but explainable if discovered.

## Standard Field Kit

Every 0x00 series agent receives a standard field kit containing essential tools for physical and digital security operations. The kit is designed to appear as legitimate security professional equipment.

### Physical Security Tools

**Lock-Pick Set**
- **Contents**: Standard pin tumbler picks, tension wrenches, rake picks
- **Cover Story**: Legitimate security professionals use these for physical security assessments
- **Limitations**: Effective on standard locks; high-security locks require advanced techniques or tools
- **Usage Notes**: Practice required to be effective; obvious to anyone watching
- **Requisition**: Standard issue for all field agents

**Bump Keys**
- **Contents**: Pre-cut keys for common lock types
- **Cover Story**: Used for authorised lock bypass testing
- **Limitations**: Doesn't work on all lock types; increasingly detected by modern locks
- **Usage Notes**: Faster than picking when applicable
- **Requisition**: Available in field kit or by request

**Fingerprint Dusting Kit**
- **Contents**: Powder, brushes, lifting tape, evidence cards
- **Cover Story**: Forensic analysis for security investigations
- **Limitations**: Time-consuming; requires relatively clean surfaces
- **Usage Notes**: Can reveal PIN codes, access patterns, frequently-touched surfaces
- **Requisition**: Standard issue

**Door Wedge and Shims**
- **Contents**: Various wedges and shim tools for door manipulation
- **Cover Story**: Testing physical security measures
- **Limitations**: Obvious when in use; doesn't work on properly secured doors
- **Usage Notes**: Quick access to doors with poor security
- **Requisition**: Standard issue

### Electronic Tools

**Bluetooth Scanner**
- **Model**: SAFETYNET-modified commercial BLE scanner
- **Capabilities**: Detect and enumerate Bluetooth devices; capture device names, MAC addresses, signal strength
- **Cover Story**: Standard security assessment tool
- **Limitations**: Limited range (typically 10-30 meters); can't break encryption
- **Usage Notes**: Useful for identifying Bluetooth-enabled locks, devices, and phones in area
- **Requisition**: Standard issue

**RFID/NFC Reader-Writer**
- **Model**: Commercial Proxmark-style device with SAFETYNET firmware
- **Capabilities**: Read, clone, and emulate various RFID/NFC cards and tags
- **Cover Story**: Security testing for access control systems
- **Limitations**: Requires physical proximity; some encrypted cards resist cloning
- **Usage Notes**: Essential for bypassing badge access systems
- **Requisition**: Standard issue for physical infiltration specialists

**USB Rubber Ducky**
- **Model**: Keystroke injection device appearing as USB drive
- **Capabilities**: Execute pre-programmed keystroke sequences when inserted
- **Cover Story**: Penetration testing tool (actually is one)
- **Limitations**: Requires physical access to unlocked computer; detected by some endpoint protection
- **Usage Notes**: Pre-load with appropriate payloads before mission
- **Requisition**: Standard issue; custom payloads from technical support

**WiFi Pineapple**
- **Model**: Rogue access point for man-in-the-middle attacks
- **Capabilities**: Capture credentials, intercept traffic, conduct phishing attacks
- **Cover Story**: Wireless security assessment tool (also actually is one)
- **Limitations**: Requires time to set up; increasingly detected by modern security
- **Usage Notes**: Useful for gathering credentials from unsuspecting users
- **Requisition**: By request; requires handler approval

## Advanced Tools

Advanced tools are available by requisition for specific mission requirements. These require justification and often handler approval.

### PIN Crackers and Bypass Tools

**Smart Lock Exploitation Kit**
- **Contents**: Various tools for exploiting electronic locks and access systems
- **Capabilities**: PIN code capture, signal replay, default credential database
- **Cover Story**: Advanced penetration testing equipment
- **Limitations**: Varies by lock type; sophisticated locks may resist exploitation
- **Usage Notes**: Research target lock type before mission for optimal success
- **Requisition**: By request with mission justification

**Thermal Imaging Camera**
- **Model**: Commercial FLIR-style thermal camera
- **Capabilities**: Detect heat signatures from recently-pressed keys or buttons
- **Cover Story**: Building security and energy audit tool
- **Limitations**: Only works on recently-used surfaces; environmental conditions affect accuracy
- **Usage Notes**: Can reveal PIN codes on keypads within minutes of use
- **Requisition**: By request; limited availability

### Surveillance and Monitoring

**Covert Cameras and Audio Devices**
- **Types**: Button cameras, pen cameras, USB charger cameras, etc.
- **Capabilities**: Video and audio capture with remote retrieval
- **Cover Story**: Physical security monitoring (legally questionable)
- **Limitations**: Battery life, storage capacity, legal implications
- **Usage Notes**: Placement is critical; recovery may be difficult
- **Requisition**: By request with handler approval; must be recovered or self-destruct

**GPS Trackers**
- **Types**: Magnetic vehicle trackers, asset trackers
- **Capabilities**: Real-time location monitoring
- **Cover Story**: Asset tracking for security purposes
- **Limitations**: Requires cellular connectivity; may be detected by counter-surveillance
- **Usage Notes**: Useful for tracking suspects or valuable assets
- **Requisition**: By request

### Network and Computer Access

**Network Tap Devices**
- **Types**: Ethernet taps, port mirrors, packet capture devices
- **Capabilities**: Passive network traffic capture
- **Cover Story**: Network security monitoring
- **Limitations**: Must be placed inline; may be discovered during network maintenance
- **Usage Notes**: Provides ongoing intelligence after agent extraction
- **Requisition**: By request; recovery plan required

**Hardware Keyloggers**
- **Types**: PS/2 and USB keyloggers
- **Capabilities**: Capture all keystrokes for later retrieval
- **Cover Story**: Security monitoring (with appropriate authorisation)
- **Limitations**: Physical installation required; must be retrieved
- **Usage Notes**: High-value targets only; discovery risk
- **Requisition**: By request with handler approval

## Encoding and Encryption Workstation

### CyberChef Access

**Platform**: Web-based encoding/decoding and cryptography tool
**Access**: Available via SAFETYNET VPN or offline installation
**Capabilities**:
- Encoding/decoding (Base64, Hex, URL encoding, etc.)
- Encryption/decryption (various algorithms)
- Data format conversion
- Hash calculation and analysis
- Data extraction and parsing

**Use Cases**:
- Decode obfuscated data found during operations
- Analyze captured communications
- Prepare data for exfiltration
- Reverse engineer encoded credentials

**Limitations**:
- Requires knowledge of what encoding/encryption is used
- Strong encryption may be unbreakable without keys
- Complex multi-layer encoding requires patience

**Training**: All agents receive basic CyberChef training; advanced techniques available through self-study

### Custom SAFETYNET Tools

**Credential Analyzer**
- **Purpose**: Test password strength and check against breach databases
- **Access**: Via secure portal
- **Usage**: Analyze recovered credentials for reuse across systems

**Hash Cracker Access**
- **Purpose**: Distributed hash cracking using SAFETYNET infrastructure
- **Access**: By request through handler
- **Usage**: Submit hashes for cracking; results typically within 24-72 hours depending on complexity

**Steganography Toolkit**
- **Purpose**: Hide and extract data in images, audio, and other files
- **Access**: Via secure portal or offline tools
- **Usage**: Exfiltrate data covertly or analyze suspect files for hidden content

## Remote Access and Infrastructure

### Virtual Machines for Testing

**Kali Linux VMs**
- **Access**: Via SAFETYNET VPN to cloud infrastructure
- **Capabilities**: Full penetration testing suite pre-installed
- **Use Cases**: Network exploitation, web application testing, password cracking
- **Limitations**: Internet-routable but firewalled; some tools disabled for legal reasons
- **Notes**: Isolated environment; nothing on these VMs is permanent

**Windows Testing VMs**
- **Access**: Via SAFETYNET VPN
- **Capabilities**: Windows environment for testing Windows-specific exploits and tools
- **Use Cases**: Active Directory attacks, Windows malware analysis, Office document testing
- **Limitations**: Isolated from production networks

**Malware Analysis Sandbox**
- **Access**: Via secure portal submission
- **Capabilities**: Automated malware analysis and behavior reporting
- **Use Cases**: Analyze suspicious files found during operations
- **Limitations**: Automated analysis may miss sophisticated malware techniques

### VPN and Secure Communications

**SAFETYNET VPN**
- **Purpose**: Secure encrypted tunnel for accessing SAFETYNET resources
- **Access**: Issued credentials per agent
- **Exit Nodes**: Multiple countries for operational flexibility
- **Limitations**: VPN metadata could theoretically reveal SAFETYNET affiliation
- **Usage Notes**: Required for accessing internal resources; optional for general internet use

**Secure Messaging**
- **Platform**: Custom encrypted messaging system for handler communication
- **Features**: End-to-end encryption, message expiry, anti-forensics
- **Access**: Mobile app and web interface
- **Limitations**: Requires internet connectivity; suspicious if discovered on device
- **Cover**: Can be disguised as various legitimate apps

**Emergency Communication Protocols**
- **Dead Drops**: Physical locations for leaving/retrieving messages when electronic communication is compromised
- **Duress Codes**: Specific phrases or codes that signal agent is compromised
- **Backup Contacts**: Alternative communication channels for emergencies

## Intelligence Database

### ENTROPY Operations Database

**Access**: Via secure portal, clearance-based access control
**Contents**:
- Known ENTROPY operatives and affiliations
- Previous ENTROPY operations and techniques
- Indicators of compromise associated with ENTROPY
- Technical signatures and malware samples
- Organisational charts and relationship mapping

**Search Capabilities**:
- Keyword search across all documents
- Relationship visualization
- Timeline analysis
- Geographic mapping

**Update Frequency**: Continuously updated as new intelligence is gathered
**Reliability**: Varies; most recent intelligence is most reliable

### Technical Knowledge Base

**Access**: Via secure portal
**Contents**:
- Vulnerability databases and exploit techniques
- Lock bypass methods and physical security weaknesses
- Social engineering templates and tactics
- Cover story templates and case studies
- After-action reports from previous missions (classified by clearance)

**Use Cases**:
- Research target technologies before mission
- Learn from previous operations
- Find techniques for specific objectives
- Understand ENTROPY methods and countermeasures

### Target Organisation Profiles

**Access**: Via secure portal, mission-specific access
**Contents**:
- Organisational structure and key personnel
- Network architecture and security measures
- Previous security incidents and vulnerabilities
- Relationship to ENTROPY (suspected or confirmed)
- Legal and regulatory context

**Quality**: Varies significantly; some targets are well-documented, others have minimal information
**Updates**: Intelligence analysts continuously update based on field reports

## Handler Support

### Mission Briefings

**Timing**: Before each mission
**Format**: Secure document or video call
**Contents**:
- Mission objectives and priorities
- Target organisation background
- Cover story and authorisation documents
- Known risks and security measures
- Available resources and support
- Extraction protocols

**Handler Preparation**: Handlers research targets and prepare briefings; quality varies by handler experience and available intelligence

### Real-Time Support

**Communication Channels**:
- Secure text messaging (primary)
- Encrypted voice calls (when necessary)
- Emergency protocols (duress situations)

**Handler Availability**:
- Assigned handler for ongoing operations
- 24/7 emergency handler on-call
- Technical support available by request

**Support Capabilities**:
- Answer questions about target or techniques
- Approve deviation from mission parameters
- Coordinate additional resources
- Provide real-time intelligence updates
- Authorize emergency extraction

**Limitations**:
- Handlers may not respond immediately
- Some decisions agents must make independently
- Handlers have limited information in fast-moving situations
- Can't solve puzzles for you—provide guidance only

### Post-Mission Debriefing

**Timing**: Within 48 hours of mission completion
**Format**: Secure meeting or detailed written report
**Contents**:
- Mission outcome and objectives achieved
- Intelligence gathered and evidence collected
- Techniques used and their effectiveness
- Problems encountered and lessons learned
- Recommendations for future operations

**Purpose**:
- Update intelligence databases
- Improve future mission planning
- Identify training needs
- Recognize successful techniques
- Learn from failures

## Equipment Requisition Process

### Standard Requisition

**Process**:
1. Submit requisition form via secure portal
2. Justify equipment need with mission objectives
3. Handler reviews and approves/denies
4. Approved equipment prepared and issued
5. Agent signs for equipment and acknowledges return responsibility

**Timeline**: 72 hours minimum for standard equipment; longer for specialized items

**Approval Criteria**:
- Relevance to mission objectives
- Proportionality (not requesting thermal camera to pick a lock)
- Availability in inventory
- Agent qualification and training
- Legal and political risk assessment

### Emergency Requisition

**Process**:
1. Contact handler via secure communication
2. Explain emergency need
3. Handler provides field authorization
4. Equipment delivered via courier or pickup
5. Paperwork filed retroactively

**Timeline**: As fast as logistics allow (hours to days)

**Justification**: "Would have died otherwise" is generally sufficient

### Returning Equipment

**Standard Return**:
- Equipment returned in serviceable condition
- Documentation of any damage with explanation
- Inventory verification
- Check-out completed

**Damaged/Lost Equipment**:
- Incident report explaining circumstances
- Investigation if circumstances are suspicious
- Replacement cost may be deducted from pay (theoretically)
- Heroes who sacrificed equipment for mission success are celebrated (and still file paperwork)

**Unreturned Equipment**:
- Equipment compromised during operation may be declared lost
- Justification must explain why recovery was impossible
- Deliberate abandonment requires handler approval

## Resource Limitations

### Budget Constraints

SAFETYNET's funding is compartmentalised and its sources are not disclosed, but it is not unlimited:
- Standard equipment is readily available
- Specialized tools require justification
- Consumables (lockpicks you break, USB devices you leave behind) come from finite pools
- Expensive equipment (thermal cameras, advanced electronics) limited quantity

### Legal Constraints

Some tools and techniques are legally restricted:
- Certain electronic warfare devices are illegal even for government use
- Surveillance equipment deployment has legal implications
- Offensive cyber tools may violate laws even with authorisation
- International operations face additional legal complexity

The Handbook addresses this with characteristic clarity: "Agents shall comply with all applicable laws, within reason."

### Operational Security

Not all tools can be used in all situations:
- Some equipment is obviously suspicious if discovered
- Certain tools might reveal SAFETYNET's existence or capabilities
- Advanced technology might compromise future operations if exposed
- Cover story must plausibly explain any equipment carried

### Technical Limitations

SAFETYNET's tools are good but not magic:
- Strong encryption remains unbreakable without keys
- Advanced security systems resist standard exploits
- Modern endpoint detection catches many standard tools
- Physical security improvements make lock-picking harder
- ENTROPY develops countermeasures to known SAFETYNET techniques

## Cross-References

- **Overview**: See [overview.md](./overview.md) for how technology supports SAFETYNET's mission
- **Agent Classification**: See [agent_classification.md](./agent_classification.md) for equipment access by agent level
- **Cover Operations**: See [cover_operations.md](./cover_operations.md) for equipment as part of cover
- **Rules of Engagement**: See [rules_of_engagement.md](./rules_of_engagement.md) for equipment usage regulations

## For Scenario Designers

### Equipping Players for Scenarios

**Initial Equipment**:
- Players should start with standard field kit appropriate to their cover
- Specialized equipment can be provided if mission requires it
- Some scenarios might restrict equipment based on cover story (can't carry lock-picks as new employee)

**Requisition During Mission**:
- Allow players to request additional tools if needed
- Handler can approve and arrange delivery
- Creates opportunities for strategic decision-making
- Adds realism and resource management

**Found Equipment**:
- Players might discover useful tools at target location
- ENTROPY might have their own equipment that can be co-opted
- Improvised tools from office supplies add creativity

### Balancing Tools and Challenge

**Don't Solve Puzzles With Equipment**:
- Tools enable approaches but shouldn't trivialize challenges
- Thermal camera reveals recent PIN use; player still needs access to keypad
- Lock-picks let you attempt lock-picking; success requires skill check or puzzle
- Network tap captures traffic; player must analyze it

**Equipment as Narrative Device**:
- Specific tools can be provided to signal intended approach
- Absence of tools can indicate cover story restrictions
- Equipment failure creates dramatic tension
- New equipment can enable progression when players are stuck

**Realistic Limitations**:
- Battery life for electronic tools
- Time required to use tools effectively
- Risk of detection when using obvious tools
- Skill requirements for advanced equipment

### Handler Dialogue About Equipment

**Providing Equipment**:
"I'm authorizing a thermal camera for this mission. The target uses PIN-protected locks and thermal might reveal recent codes. Just remember it's got about 4 hours of battery life."

**Denying Requests**:
"You want a WiFi Pineapple for a physical infiltration mission? Your cover is a compliance auditor, not a network pentester. Request denied."

**Equipment Failure**:
"Bad news—your Bluetooth scanner just died. Battery failure or interference, can't tell from here. You'll have to complete the objective without it."

**Creative Usage**:
"Did you seriously just use the fingerprint dusting kit to identify which keyboard keys are used most frequently to narrow down the password? That's... actually clever. Noted in your file."

### Common Equipment-Related Scenarios

**Lock-Picking Challenge**:
"You have a standard lock-pick set. The lock is a commercial-grade pin tumbler—nothing too sophisticated. You estimate it'll take 2-3 minutes if you don't rush it. The guard patrols past this door every 10 minutes. Your call."

**Tool Failure**:
"You connect the USB Rubber Ducky but nothing happens. The computer might have endpoint protection that's blocking USB devices. You'll need another approach."

**Resource Choice**:
"You can request either a network tap for ongoing intelligence gathering or a hardware keylogger for the CEO's computer. Handler can only authorize one—budget and risk assessment. Which do you want?"

**Found Equipment**:
"Searching the ENTROPY operative's desk, you find a Proxmark RFID cloner and several employee badges. Looks like they were planning to clone access credentials. This could be useful..."

### Common Pitfalls to Avoid

- **Magic Tools**: Don't let equipment solve challenges without player engagement
- **Unlimited Resources**: Some constraints create interesting choices
- **Ignoring Cover**: Players shouldn't have equipment their cover can't explain
- **Tool Soup**: Don't overwhelm players with too many options
- **Inconsistent Capabilities**: Maintain consistent rules for what tools can and can't do
- **Boring Equipment**: Tools should enable interesting approaches, not just be +1 bonuses

### Technology as World-Building

Equipment choices reinforce setting and tone:
- **Realistic Tools**: Using actual security tools (Proxmark, CyberChef) grounds the world
- **Modified Versions**: SAFETYNET modifications add flavor
- **Limitations**: Real tools have real limitations; honoring these adds authenticity
- **Bureaucracy**: Requisition processes reinforce organisational structure
- **Cover Constraints**: Equipment restrictions based on cover create interesting limitations

### Example Equipment-Driven Scenarios

**Scenario 1: The Right Tool for the Job**:
"The target facility uses RFID badge access. Your handler issued you a Proxmark and some blank cards. You need to clone a valid employee badge without them noticing. The question is: whose badge do you clone, and how do you get close enough?"

**Scenario 2: Resource Management**:
"Your Bluetooth scanner is showing three devices: two smart locks and one mobile phone. Your battery is at 15%—enough to interact with maybe one or two of them before it dies. Which do you investigate?"

**Scenario 3: Equipment Failure Adaptation**:
"The WiFi Pineapple you set up has been discovered and disabled by security. Your planned approach of capturing credentials is blown. You have your standard field kit and whatever you can improvise. How do you proceed?"

**Scenario 4: Found ENTROPY Equipment**:
"The ENTROPY agent you're tracking left a laptop in this conference room. Technical support could analyze it remotely, but that takes time. Or you could image the drive using your tools and keep moving. The agent might return any minute."
