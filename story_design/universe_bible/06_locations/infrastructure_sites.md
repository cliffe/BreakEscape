# Infrastructure Sites

## Overview
Critical infrastructure facilities represent the highest-stakes environments in Break Escape. These locations control essential services - power, water, transportation, communications - that entire communities depend on. When ENTROPY targets infrastructure, the consequences extend far beyond corporate espionage, threatening public safety and societal stability. These scenarios blend operational technology (OT) security, SCADA systems, and the unique challenges of protecting physical systems through digital means.

## Why Infrastructure Sites Matter

### The Stakes
- **Public safety** - Lives directly at risk
- **Economic impact** - Cascading failures affect entire regions
- **National security** - Critical infrastructure as strategic targets
- **Social stability** - Loss of essential services causes chaos
- **ENTROPY's goals** - Accelerating societal entropy through infrastructure collapse

### Unique Security Challenges
- **Legacy systems** - Decades-old equipment still operational
- **Operational continuity** - Can't shutdown for security updates
- **Physical-cyber convergence** - IT meets OT security
- **Safety protocols** - Cybersecurity vs. operational safety
- **Insider access** - Operational staff need broad permissions
- **Remote monitoring** - Wide attack surface
- **Regulatory compliance** - Sector-specific requirements

---

## Infrastructure Types

### Power Generation & Distribution

#### Facilities
- **Power plants** (coal, natural gas, nuclear, renewable)
- **Substations** and switching stations
- **Grid control centers**
- **Renewable energy farms** (solar, wind)
- **Emergency backup systems**

#### Standard Room Types

**Control Room**
- SCADA systems monitoring grid
- Multiple operator stations
- Real-time dashboards and alarms
- Communication systems (radio, phone, network)
- Shift handover logs
- Emergency procedures documentation
- Coffee station (operators work long shifts)

**Server Room / Network Operations**
- Historical data servers
- SCADA network equipment
- Remote terminal units (RTU) management
- Firewall and security appliances
- Backup systems
- Environmental monitoring

**Equipment Floor**
- Generators, turbines, or conversion equipment
- Control panels for physical systems
- Safety equipment and PPE
- Maintenance logs and schedules
- Hazard warnings and safety protocols
- Physical access to critical equipment

**Engineering Office**
- System documentation and schematics
- Maintenance planning
- Regulatory compliance records
- Vendor contact information
- Historical incident reports
- Safety training materials

#### Security Elements
- **Physical security** - Fences, guards, cameras
- **Badge access** with role-based permissions
- **Two-factor authentication** for SCADA
- **Air-gapped networks** (sometimes... poorly implemented)
- **Safety interlocks** preventing dangerous operations
- **Audit logging** of all system changes
- **Video surveillance** of critical areas
- **Redundant systems** for failover

#### Typical Puzzles
- **Gaining control room access** through social engineering
- **SCADA system analysis** - finding vulnerabilities
- **Reading engineering diagrams** to understand systems
- **Bypassing safety interlocks** (carefully - consequences!)
- **Network segmentation analysis** - finding bridges between IT/OT
- **Historical log analysis** for intrusion evidence
- **Physical-digital puzzles** - matching panel labels to system IDs

#### High-Stakes Scenarios
- **Grid manipulation** - blackouts or overloads
- **Safety system override** - disabling protections
- **Equipment damage** - physically destroying infrastructure
- **Cascading failures** - targeting interconnected systems
- **Ransomware** - operational technology held hostage
- **Insider threats** - disgruntled operators with access

#### Environmental Storytelling
- **Shift schedules** show staffing patterns (attack windows)
- **Maintenance backlog** indicates underfunding or negligence
- **Safety incident reports** reveal near-misses
- **Personal items** (family photos) humanize critical operators
- **Outdated systems** show cybersecurity challenges
- **Handwritten notes** on panels (procedures not in system)
- **Union notices** about disputes (insider threat potential)

---

### Water Treatment Facilities

#### Facilities
- **Water treatment plants** (drinking water purification)
- **Wastewater treatment** facilities
- **Pumping stations** and distribution
- **Reservoir control systems**
- **Water quality monitoring** stations

#### Standard Room Types

**Treatment Control Center**
- SCADA monitoring chemical levels
- Flow rate and pressure monitoring
- Water quality dashboards
- Automated treatment controls
- Alarm systems for quality issues
- Compliance monitoring (EPA, local regulations)

**Chemical Storage & Handling**
- Chlorine, fluoride, and treatment chemicals
- Safety equipment and spill containment
- Automated dosing systems
- Inventory tracking
- MSDS documentation
- Restricted access (hazardous materials)

**Laboratory**
- Water quality testing equipment
- Sample analysis stations
- Quality control procedures
- Compliance testing records
- Technician workstations
- Reference standards

**Operations Office**
- Shift logs and handover notes
- Maintenance schedules
- Regulatory compliance documentation
- System diagrams and manuals
- Emergency response procedures

#### Security Elements
- **Chemical security** - preventing contamination
- **Physical access control** - fences, gates, guards
- **Badge and PIN systems**
- **SCADA security** - often weak in older plants
- **Water quality alarms** - detecting contamination
- **Video surveillance**
- **Background checks** for operators

#### Typical Puzzles
- **Chemical dosing system analysis** - detecting manipulation
- **Water quality log review** - finding anomalies
- **SCADA exploitation** - identifying vulnerabilities
- **Accessing chemical storage** areas
- **Lab result verification** - detecting falsified data
- **Understanding treatment processes** for puzzle context

#### High-Stakes Scenarios
- **Chemical contamination** - adding harmful substances
- **Dosing manipulation** - incorrect treatment levels
- **Pressure manipulation** - pipe bursts or contamination
- **Quality monitoring bypass** - hiding contamination
- **Ransomware** - treatment process held hostage
- **Insider sabotage** - operator with dangerous access

#### Why ENTROPY Targets Water
- **Maximum chaos** with minimal effort
- **Public health impact** - widespread harm
- **Trust erosion** - society questions basic services
- **Economic disruption** - businesses shut down
- **Low security** - often underfunded municipalities
- **Psychological impact** - fear of essential services

---

### Data Centers

#### Facilities
- **Enterprise data centers**
- **Colocation facilities** (multiple tenants)
- **Cloud provider infrastructure**
- **Internet exchange points** (IXP)
- **Content delivery network** (CDN) nodes

#### Standard Room Types

**Server Floor / Cage Areas**
- Rows of server racks (hot/cold aisles)
- Network backbone equipment
- Customer cages (colocation)
- Environmental monitoring
- Fire suppression systems
- Power distribution units (PDU)

**Network Operations Center (NOC)**
- Monitoring dashboards (multiple screens)
- Ticket management systems
- Network traffic analysis
- Incident response stations
- 24/7 staffing
- Communication systems

**Security Operations Center (SOC)**
- Security event monitoring (SIEM)
- Intrusion detection systems
- Access control management
- Video surveillance monitoring
- Incident response procedures
- Security analyst stations

**Power Infrastructure**
- Uninterruptible power supplies (UPS)
- Backup generators
- Battery rooms
- Power distribution panels
- Environmental controls (cooling)
- Fuel storage (diesel generators)

**Loading Dock / Receiving**
- Equipment delivery and staging
- Asset tagging and inventory
- Security screening for equipment
- Supply chain verification
- Temporary storage
- Trash and recycling (data destruction)

#### Security Elements
- **Biometric access** (fingerprint, retinal, palm vein)
- **Man-traps** (double-door authentication)
- **Video surveillance** (comprehensive coverage)
- **Security guards** (24/7 presence)
- **Metal detectors** and screening
- **Asset tracking** (RFID, barcodes)
- **Network segmentation** (customer isolation)
- **Environmental alarms** (temperature, water, fire)

#### Typical Puzzles
- **Social engineering** NOC/SOC staff
- **Gaining cage access** (customer credentials)
- **Network traffic analysis** for specific targets
- **Physical access** to targeted servers
- **Bypassing multiple security layers** sequentially
- **Understanding network topology**
- **Exploiting shared infrastructure**

#### High-Stakes Scenarios
- **Multi-tenant attacks** - targeting one customer affects others
- **Internet backbone disruption** - affecting entire regions
- **Ransomware deployment** across hosted systems
- **Physical equipment tampering** - hardware backdoors
- **Supply chain attacks** - compromised equipment delivery
- **Environmental sabotage** - overheating, fire suppression activation
- **Insider threats** - staff with privileged access

---

### Telecommunications Facilities

#### Facilities
- **Central offices** (telephone switching)
- **Cell towers** and equipment shelters
- **Fiber optic junction points**
- **Satellite ground stations**
- **Network operations centers**

#### Standard Room Types

**Switching Center**
- Telecommunications equipment racks
- Routing and switching systems
- Legacy and modern equipment coexistence
- Patch panels and cable management
- Maintenance terminals
- Environmental controls

**Network Management Center**
- Topology monitoring
- Call routing systems
- Traffic analysis
- Fault management
- Performance monitoring
- Capacity planning stations

**Equipment Shelter (Cell Site)**
- Radio equipment
- Base station controllers
- Power backup systems
- Remote monitoring
- Climate control
- Minimal staffing (remote managed)

#### Security Elements
- **Physical security** (fencing, locks)
- **Remote monitoring** (often unmanned facilities)
- **Access logs** for site entry
- **Video surveillance**
- **Alarm systems** for intrusion
- **Network security** (often weak in legacy equipment)

#### Typical Puzzles
- **Gaining site access** (remote locations, minimal security)
- **Understanding telecom protocols** (simplified for gameplay)
- **Analyzing call routing** for data exfiltration
- **Accessing remote management systems**
- **Physical equipment tampering**
- **Intercepting communications** (wiretapping)

#### High-Stakes Scenarios
- **Communications disruption** - emergency services affected
- **Interception attacks** - mass surveillance
- **SS7 protocol exploitation** - routing manipulation
- **Cell tower spoofing** - false base stations
- **DoS attacks** on switching centers
- **GPS jamming** (for timing-dependent systems)

---

### Transportation Control Systems

#### Facilities
- **Traffic management centers**
- **Railway signal control** facilities
- **Airport traffic control** (supporting systems)
- **Port and shipping** control systems
- **Subway/metro** operations centers

#### Standard Room Types

**Traffic Operations Center**
- Video wall with camera feeds
- Traffic signal control systems
- Incident detection systems
- Emergency vehicle prioritization
- Communication systems (radio, phone)
- Historical traffic data analysis

**Rail Signal Control Room**
- Track monitoring systems
- Signal interlocking controls
- Train positioning displays
- Communication with operators
- Safety override systems
- Schedule management

**Emergency Response Coordination**
- Multi-agency communication
- Incident management systems
- Resource deployment
- Public notification systems
- Recorded communication logs

#### Security Elements
- **Physical security** (critical facility protection)
- **Badge access** with clearances
- **Video surveillance**
- **Redundant systems** for safety
- **Safety interlocks** preventing conflicts
- **Audit logging** of all control actions
- **Background checks** for operators

#### Typical Puzzles
- **Understanding system logic** (signals, priorities)
- **Accessing control systems** safely
- **Analyzing incident logs** for patterns
- **Detecting manipulation** of timing systems
- **Social engineering** operators
- **Physical-digital integration** (signals + computers)

#### High-Stakes Scenarios
- **Traffic chaos** - signal manipulation
- **Railway collisions** - signal override
- **Emergency response delays** - strategic blocking
- **Public panic** - false alerts or disruption
- **Economic impact** - transportation paralysis
- **Safety system bypass** - removing protections

---

## Design Principles for Infrastructure Scenarios

### Emphasize Operational Technology (OT) Security

Unlike IT-focused corporate scenarios, infrastructure scenarios should highlight OT unique challenges:

- **Legacy systems** - equipment decades old, no patches available
- **Physical consequences** - digital actions affect real-world systems
- **Safety vs. security** - sometimes conflicting priorities
- **Always-on operations** - can't reboot for security updates
- **Specialized protocols** - Modbus, DNP3, IEC 61850 (simplified for gameplay)
- **Limited network segmentation** - IT/OT boundaries often weak

### Educational Opportunities

Infrastructure scenarios teach:
- **SCADA security** fundamentals
- **Physical-cyber security** integration
- **Insider threat** in operational environments
- **Legacy system** vulnerabilities
- **Safety system** importance
- **Regulatory compliance** (NERC CIP, TSA directives, etc.)
- **Incident response** for OT environments
- **Supply chain security** for critical equipment

### Realistic Consequences

Unlike corporate scenarios (data theft, financial loss), infrastructure attacks have tangible impacts:
- **Blackouts** affecting hospitals, homes, businesses
- **Contaminated water** threatening public health
- **Communication outages** preventing emergency response
- **Transportation disruption** stranding people, blocking commerce
- **Cascading failures** across interconnected systems

This raises stakes and emphasizes why SAFETYNET exists.

### Moral Complexity

Infrastructure scenarios present unique ethical dilemmas:
- **Operator as victim** - good people put in impossible situations by ENTROPY
- **Disclosure challenges** - revealing vulnerabilities without causing panic
- **Lesser of evils** - choosing which service to protect/sacrifice
- **Insider threats** - distinguishing incompetence from malice
- **Systemic issues** - underfunding and neglect vs. active attacks

### Atmosphere

Infrastructure sites should feel:
- **Industrial** - functional, not decorative
- **Critical** - serious, high-stakes environment
- **Operational** - active systems, monitoring, alarms
- **Understaffed** - budget constraints visible
- **Vulnerable** - old equipment, weak security
- **Essential** - sense that society depends on this

---

## NPC Archetypes in Infrastructure

### The Experienced Operator
- Decades of experience
- Knows systems inside and out
- Suspicious of outsiders
- Protective of facility
- May bypass security for operational efficiency
- Valuable source of system knowledge

### The Overwhelmed Manager
- Underfunded and understaffed
- Frustrated with bureaucracy
- Aware of security issues but can't fix them
- Potential ally (wants help)
- May cut corners under pressure

### The Idealistic Engineer
- Cares about public service
- Technically competent
- Horrified by security vulnerabilities
- Willing to help SAFETYNET
- May have identified ENTROPY presence already

### The Compromised Insider
- ENTROPY recruit or coerced
- May be sympathetic (family threatened, blackmailed)
- Guilt and fear evident
- Potential for redemption or confrontation
- Knows exactly how to cause maximum damage

### The Contractor
- Third-party vendor with access
- Minimal security vetting
- Could be ENTROPY infiltrator
- Knows systems well
- May have unmonitored access

---

## Scenario Hooks by Infrastructure Type

### Power Grid
- **Coordinated blackout** - multiple substations targeted
- **Load balancing attack** - causing cascade failure
- **Smart meter manipulation** - millions of endpoints
- **Renewable integration** - unstable grid exploitation
- **Ransomware** - restoring power held hostage

### Water Systems
- **Chemical dosing sabotage** - contamination or under-treatment
- **Pressure manipulation** - pipe damage or backflow
- **Quality monitoring bypass** - hiding attacks
- **Source contamination** - reservoir targeting
- **Distribution network** - strategic valve control

### Data Centers
- **Targeted customer attack** - accessing specific hosted systems
- **Infrastructure sabotage** - environmental or power systems
- **Network traffic interception** - passive monitoring
- **Supply chain attack** - compromised equipment delivery
- **Physical access** - inside job or sophisticated infiltration

### Communications
- **Mass interception** - surveillance at infrastructure level
- **Selective disruption** - targeting specific communications
- **False base station** - cell tower spoofing
- **Protocol exploitation** - SS7, Diameter vulnerabilities
- **GPS timing attacks** - disrupting sync-dependent systems

### Transportation
- **Traffic signal manipulation** - creating gridlock or accidents
- **Railway signal attacks** - safety system compromise
- **Emergency response** - blocking critical vehicles
- **Public transportation** - subway/metro targeting
- **Economic disruption** - port or freight systems

---

## Design Checklist for Infrastructure Scenarios

- [ ] **Infrastructure type** clearly defined with appropriate systems
- [ ] **Public safety stakes** established (consequences beyond data loss)
- [ ] **SCADA or OT systems** present for technical challenges
- [ ] **Control room or operations center** for monitoring
- [ ] **Engineering or technical documentation** for context
- [ ] **Legacy systems** highlighted (realistic vulnerabilities)
- [ ] **Safety protocols** present (adds realism and puzzles)
- [ ] **Operational staff NPCs** (operators, engineers, managers)
- [ ] **Physical-digital integration** (puzzles spanning both domains)
- [ ] **Moral complexity** (operators as victims, not villains)
- [ ] **Cascading consequences** shown or prevented
- [ ] **ENTROPY motivation** clear (why target this infrastructure?)
- [ ] **Educational content** about OT security
- [ ] **Regulatory context** (NERC CIP, EPA, TSA, etc.)
- [ ] **Realistic attack vectors** (based on actual ICS vulnerabilities)

---

## Special Considerations

### Balancing Realism and Responsibility

Infrastructure scenarios must be:
- **Realistic enough** to educate about actual threats
- **Abstracted enough** not to be instruction manuals for attacks
- **Respectful** of real operators and facilities
- **Focused** on defense and prevention, not enabling attacks

### Time Pressure

Infrastructure scenarios naturally include urgency:
- Active attacks in progress
- Limited time before consequences
- Operational windows (shift changes, maintenance periods)
- Cascading timers (if X fails, Y will fail in 10 minutes)

### Player Impact

Show that player actions matter:
- **Prevented blackout** - lights stay on, hospital keeps power
- **Stopped contamination** - water supply remains safe
- **Maintained communications** - emergency services operational
- **Avoided traffic disaster** - prevented accidents or gridlock

This reinforces why SAFETYNET exists and makes players feel heroic.

---

## Conclusion

Infrastructure scenarios represent Break Escape at its most impactful. By targeting the systems society depends on, ENTROPY creates maximum chaos, and SAFETYNET agents become true defenders of public safety. These scenarios blend operational technology security education with high-stakes drama, showing players that cybersecurity isn't just about protecting data - it's about protecting people.

Every infrastructure scenario should answer: **"What breaks if ENTROPY succeeds, and who gets hurt?"**
