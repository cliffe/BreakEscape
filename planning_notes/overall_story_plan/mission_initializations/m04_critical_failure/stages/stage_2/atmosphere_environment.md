> ⚠️ **SUPERSEDED (2026-08-21).** These stage documents describe the original **water-treatment**
> concept for m04 (chlorine dosing, Dec 2025). The mission was rebuilt as **grid battery storage**
> (Albion Energy Storage) and then aligned to the m01 standard. They are kept for historical
> reference only. The authoritative design is `scenarios/m04_critical_failure/ALIGNMENT_PLAN.md`;
> the current implementation is the scenario and ink files themselves.

# Mission 4: "Critical Failure" - Stage 2: Atmosphere & Environment Design

**Mission ID:** m04_critical_failure
**Stage:** 2 - Atmosphere and Environment Design
**Version:** 1.0
**Date:** 2025-12-28

---

## Overview

This document defines the visual and audio atmosphere, facility layout, environmental storytelling, and design language for Mission 4 "Critical Failure." The environment must convey industrial authenticity, escalating urgency through visual/audio cues, and support both stealth and combat gameplay.

---

## Core Environmental Themes

### Primary Atmosphere: Industrial Functionality
- **Tone:** Working infrastructure facility, not glamorous or high-tech
- **Visual Language:** Practical, utilitarian, aging but operational
- **Color Palette:** Industrial blues, grays, safety yellows, warning oranges
- **Lighting:** Fluorescent overhead, emergency lighting, SCADA monitor glow

### Secondary Atmosphere: Escalating Crisis
- **Progression:** Normal operations → subtle anomalies → critical emergency
- **Visual Indicators:** SCADA screen colors, alarm lights, gauge positions
- **Audio Indicators:** Machinery hum → irregular sounds → alarm systems
- **Environmental Changes:** Lighting shifts, steam releases, pressure warnings

### Tertiary Atmosphere: Hostile Infiltration
- **Evidence of ENTROPY:** Tactical equipment, surveillance devices, tampered systems
- **Combat Spaces:** Cover opportunities, sight lines, tactical positioning
- **Stealth Opportunities:** Shadows, alternate routes, ventilation access

---

## Facility Layout

### Overall Structure: Single-Story Industrial Complex

**Total Rooms:** 8 interconnected areas
**Layout Type:** Industrial corridor system with branching specialized areas
**Size:** Medium-large (supports exploration and combat encounters)

**Conceptual Map:**
```
[Main Entrance]---[Administration]
      |                 |
[Security Office]  [Control Room]====[Server Room]
      |                 |
[Treatment Floor]--[Chemical Storage]
      |                 |
      +-----[Maintenance Wing]-----+
```

---

## Room-by-Room Design

### Room 1: Main Entrance & Security Checkpoint

**Function:** Entry point, first impression, security screening
**Size:** Medium (10m x 8m)
**Atmosphere:** Professional but minimal, underfunded security

**Visual Elements:**
- Security desk with aging computer terminal
- Metal detector archway (non-functional or bypassed)
- Employee sign-in clipboard (physical, not digital—budget constraints)
- Motivational safety posters ("X Days Without Incident")
- Faded company logo on wall
- Visitor badge rack
- Security camera (functional but old model)

**Lighting:**
- Fluorescent overhead (standard office lighting)
- Emergency exit signs (green)
- Security monitor glow (blue-white)

**Sound Design:**
- Quiet morning ambience
- Distant water treatment machinery hum
- Security radio occasional chatter
- Entry door airlock hiss

**Environmental Storytelling:**
- Sign-in sheet shows "OptiGrid Solutions" maintenance team (ENTROPY operatives)
- Security logs show normal activity (no red flags)
- Budget cut notice on bulletin board
- Employee safety training certificates (shows facility cares but lacks resources)

**Gameplay Elements:**
- Entry via credentials (social engineering) or bypass (stealth)
- Security guard NPC (passive, trusting)
- First SCADA monitor visible in background (green status—normal operations)

**Color Scheme:**
- Walls: Off-white/beige
- Floor: Gray linoleum
- Accents: Safety yellow (caution tape, signs)

---

### Room 2: Administration Offices

**Function:** Robert Chen's office, employee workspace, records access
**Size:** Large (15m x 10m, divided into cubicles + private office)
**Atmosphere:** Overworked administrative space, organized chaos

**Visual Elements:**

**Main Office Area:**
- Cubicle clusters (3-4 workstations)
- Filing cabinets (physical records—aging facility)
- Water cooler (small talk location)
- Whiteboard with facility maintenance schedule
- Employee mailboxes
- Coffee station (shows lived-in workplace)

**Robert Chen's Private Office:**
- Desk with computer (SCADA remote monitoring capability)
- Family photo (humanizes Chen)
- Engineering degree on wall
- Stack of budget reports and regulatory compliance documents
- Facility blueprints pinned to wall
- Window overlooking treatment floor

**Lighting:**
- Fluorescent overhead (bright administrative lighting)
- Desk lamps (warm glow in Chen's office)
- Computer monitor glow
- Natural light from windows (dawn breaking)

**Sound Design:**
- HVAC system hum
- Computer fans
- Coffee maker gurgling
- Distant machinery sounds from treatment floor
- Chen's voice (when present)—stressed but professional

**Environmental Storytelling:**
- Maintenance access logs on Chen's desk (shows OptiGrid Solutions entry)
- Budget cut memos (explains security gaps)
- Regulatory inspection notices (shows compliance burden)
- Employee time cards (shows shift patterns—3rd shift ending, day shift starting)
- Facility safety awards (Chen takes pride in safety record)

**Gameplay Elements:**
- Access employee records (investigation)
- Robert Chen conversation location
- Maintenance logs (clues to ENTROPY infiltration)
- Facility keycard obtainable (Chen provides)
- SCADA remote terminal (monitoring capability)

**Color Scheme:**
- Walls: Light gray
- Cubicles: Beige dividers
- Chen's office: Wood furniture, warmer tones
- Accents: Blue (corporate identity), yellow (caution notices)

---

### Room 3: Control Room (SCADA Central)

**Function:** Primary SCADA monitoring and control, mission's technical heart
**Size:** Large (12m x 10m)
**Atmosphere:** Mission-critical technical environment, increasingly urgent

**Visual Elements:**

**SCADA Monitoring Wall:**
- Large monitor array (4-6 screens)
- Real-time facility systems display
- Chemical dosing parameter readouts
- Network topology diagram
- Water quality metrics
- Pressure and flow gauges

**Operator Stations:**
- 2-3 workstations with keyboards and monitors
- Technical manuals and procedure binders
- Emergency shutdown procedures posted
- Radio communication system
- Logbook (handwritten shift notes)

**Emergency Systems:**
- Emergency shutdown panel (red protective cover)
- Fire suppression system controls
- Facility-wide PA system
- Alarm override panel

**Lighting:**
- Dimmer overhead lighting (reduces screen glare)
- SCADA monitor glow (dominant light source)
- Status indicator LEDs (green/yellow/red progression)
- Emergency lighting on standby

**Sound Design:**
- Quiet electronic hum (SCADA systems)
- Keyboard clicks (operators working)
- Radio chatter (facility communications)
- Alert beeps (increasing frequency as urgency rises)
- Alarm sounds (if attack progresses to Stage 4)

**Urgency Progression Visual Design:**

**Stage 1 (Normal):**
- SCADA monitors: Predominantly green indicators
- Readouts: Within normal parameters
- Lighting: Standard blue-white monitor glow
- No alarm lights active

**Stage 2 (Anomaly Detected):**
- SCADA monitors: Yellow warnings appearing
- Readouts: Parameters slowly drifting
- Lighting: Occasional yellow warning light flashes
- Pre-alarm indicator light (amber)

**Stage 3 (Critical Warning):**
- SCADA monitors: Multiple orange/red warnings
- Readouts: Parameters approaching danger thresholds
- Lighting: Persistent yellow/orange warning lights
- Chemical dosing gauges visibly moving
- Alarm light rotating (not sounding yet)

**Stage 4 (Emergency):**
- SCADA monitors: Red critical alerts, flashing
- Readouts: Danger zone exceeded
- Lighting: Red emergency lighting active
- Alarms sounding (klaxon)
- Emergency protocols activated

**Stage 5 (Stabilizing/Resolved):**
- SCADA monitors: Warnings clearing, returning to green
- Readouts: Parameters normalizing
- Lighting: Emergency lights deactivating
- Alarms silenced
- Cooldown indicators

**Environmental Storytelling:**
- Shift logs show normal operations until 2 days ago
- Sticky notes with unusual parameter values (operators noticed but didn't alarm)
- Coffee cups (operators working long hours to troubleshoot)
- Maintenance request forms (for "faulty" sensors—actually ENTROPY tampering)

**Gameplay Elements:**
- Primary SCADA monitoring location
- Robert Chen works here during crisis
- Visual urgency indicators (player can track attack progression)
- Remote system access point
- Emergency shutdown capability (risky—might trigger attack)

**Color Scheme:**
- Walls: Dark gray (reduces screen glare)
- Equipment: Industrial gray and black
- Monitors: Black backgrounds with green/yellow/red indicators
- Accents: Safety orange (emergency equipment)

---

### Room 4: Server Room

**Function:** Network infrastructure, VM challenge location, ENTROPY infiltration point
**Size:** Medium (10m x 8m)
**Atmosphere:** Technical, cool (climate controlled), evidence of intrusion

**Visual Elements:**

**Server Infrastructure:**
- Server rack rows (3-4 racks)
- Blinking status LEDs (green/amber)
- Cable management (some disorganized—signs of tampering)
- Cooling units (constant fan noise)
- Network switches with status lights
- Backup power supply (UPS units)

**Workstation Area:**
- Network administrator desk
- Terminal for server access (VM challenge location)
- Technical documentation binders
- Network topology diagrams on wall
- Tool kit (network testing equipment)

**Evidence of ENTROPY Intrusion:**
- Server rack panel open (tampered)
- Laptop left connected (ENTROPY remote access)
- Additional network cables (unauthorized connections)
- USB device plugged in (malware deployment)
- Security camera disabled (small detail—lens covered)

**Lighting:**
- Bright fluorescent overhead
- Server LED indicators (multi-colored, blinking)
- Monitor glow
- Green emergency exit lighting
- Cooler than other rooms (climate control for servers)

**Sound Design:**
- Server fan noise (constant, loud)
- Hard drive activity sounds
- Network switch clicks
- Cooling system hum
- Occasional electronic beeps
- Keyboard typing (if player interacting)

**Environmental Storytelling:**
- Network access logs showing unauthorized connections
- Maintenance badge left behind (OptiGrid Solutions—clue)
- Technical notes showing normal operations disrupted
- Encrypted files on terminal (VM challenge entry point)
- Backup logs showing data exfiltration

**Gameplay Elements:**
- VM challenge terminal location
- Flag station terminal (for submitting VM flags)
- Evidence collection (ENTROPY equipment)
- Network investigation starting point
- Keycard access required (Level 2—obtained from defeated operative or Chen)

**Color Scheme:**
- Walls: White (clean room aesthetic)
- Equipment: Black and gray
- Cables: Multi-colored (blue, yellow, red network cables)
- LED indicators: Green, amber, red

---

### Room 5: Treatment Floor

**Function:** Primary water treatment operations, industrial heart, first combat encounter
**Size:** Very Large (20m x 15m, high ceiling)
**Atmosphere:** Industrial scale, functional machinery, potential danger

**Visual Elements:**

**Treatment Equipment:**
- Large water treatment tanks (cylindrical, metal)
- Pipe systems (overhead and ground-level)
- Pumps and valves
- Filtration units
- Grated metal walkways and stairs
- Safety railings (yellow)
- Gauges and pressure indicators

**Industrial Details:**
- Concrete floor with drainage grates
- High ceiling with exposed beams
- Overhead crane system (for equipment maintenance)
- Catwalk access to upper levels
- Ladder access to tank tops
- Safety equipment stations (eye wash, first aid)

**Combat Space Design:**
- Large support columns (cover opportunities)
- Equipment clusters (hiding spots)
- Multiple elevation levels (tactical positioning)
- Sight line breaks (stealth opportunities)
- Open central area (if direct combat chosen)

**Lighting:**
- Industrial high-bay lighting (bright, harsh)
- Equipment indicator lights
- Shadows cast by large equipment (stealth areas)
- Emergency lighting along walkways
- Natural light from high windows (dawn)

**Sound Design:**
- Loud machinery operation (water pumps, filtration)
- Flowing water sounds
- Metal clanking (pipes expanding/contracting)
- Pump rhythmic thudding
- Echoing acoustics (large space)
- Alert—footsteps echo (combat stealth consideration)

**Environmental Storytelling:**
- Equipment maintenance tags (some forged by ENTROPY)
- Safety inspection records up to date (Chen runs tight ship)
- Tool caches (maintenance work areas)
- Employee break area (shows human element)
- Chemical safety data sheets posted

**Gameplay Elements:**
- First combat encounter location (Operative #1)
- Stealth opportunities via shadows and equipment
- Multiple navigation paths (ground level, catwalks, upper platforms)
- Environmental hazards (steam vents, slippery areas—atmospheric, not lethal)
- Connection to chemical storage (visible through windows/doors)

**Color Scheme:**
- Tanks/Equipment: Metallic gray, some rust
- Pipes: Color-coded (blue for water, yellow for chemicals, red for fire suppression)
- Floor: Industrial concrete
- Safety elements: Bright yellow
- Accents: Warning orange

---

### Room 6: Chemical Storage

**Function:** Chemical dosing systems, attack target, optional combat encounter
**Size:** Large (15m x 10m)
**Atmosphere:** Controlled danger, highly regulated, compromised security

**Visual Elements:**

**Chemical Storage:**
- Chemical tanks (chlorine, fluoride, other treatment chemicals)
- Labeled hazard signs (skull and crossbones, corrosive symbols)
- Secondary containment berms
- Ventilation systems (exhaust fans)
- Chemical delivery pumps
- Dosing control panels (attack targets)

**Safety Infrastructure:**
- Emergency shower station
- Eye wash station
- Chemical spill cleanup equipment
- Protective equipment storage (suits, masks, gloves)
- Ventilation monitors
- Gas detection sensors

**ENTROPY Modifications:**
- Bypass devices installed on dosing stations (visible if player investigates)
- Tampered control panels
- Unauthorized equipment (remote trigger hardware)
- Security camera disabled

**Lighting:**
- Bright overhead (safety requirement)
- Yellow hazard lighting
- Control panel indicator lights
- Emergency lighting prominent
- Strobe light (if chemical leak alarm)

**Sound Design:**
- Chemical pump operation
- Ventilation fan noise (loud, constant)
- Control panel beeps
- Safety system status tones
- Gas detection alarm (if triggered)
- Echoing metal clanks

**Environmental Storytelling:**
- Chemical delivery logs (shows when ENTROPY operatives had access)
- Safety inspection records (passed recently—no one suspected tampering)
- Emergency response procedures posted
- Dosing schedule charts (shows planned attack time—0800)
- Maintenance records (forged by ENTROPY)

**Gameplay Elements:**
- Attack vector identification (bypass devices on dosing stations)
- Optional combat encounter (Operative #2 guarding)
- Critical objective: Disable physical attack components
- Hazardous environment (careful movement required)
- Master keycard location (if operative defeated)

**Color Scheme:**
- Tanks: Yellow (hazard coding)
- Pipes: Yellow (chemical lines)
- Floor: Sealed concrete (chemical-resistant)
- Safety equipment: Bright yellow/green
- Warning signs: Yellow and black, red and white

---

### Room 7: Maintenance Wing

**Function:** ENTROPY stronghold, final confrontation location, backup systems
**Size:** Large (15m x 12m, irregular shape with alcoves)
**Atmosphere:** Industrial utility area, converted to tactical position

**Visual Elements:**

**Maintenance Equipment:**
- Tool benches and storage
- Spare parts inventory
- Electrical panels
- Backup generator
- HVAC system access
- Facility blueprints on walls
- Maintenance vehicle (small utility cart)

**ENTROPY Command Center:**
- Temporary setup—tactical equipment
- Laptop with SCADA remote access (attack trigger)
- Radio communication equipment
- Surveillance monitor feeds (facility cameras)
- Tactical gear (vests, equipment bags)
- Escape route prepared (loading dock access visible)

**Combat Space Design:**
- Irregular layout provides cover (tool storage, generator, equipment)
- Defensive position advantages (ENTROPY prepared here)
- Choke points (doorways, narrow passages)
- Elevation differences (raised platform for generator)
- Limited sight lines (favors prepared defender)

**Lighting:**
- Work lights (portable, bright)
- Generator indicator lights
- Laptop screen glow (in ENTROPY area)
- Emergency lighting
- Shadows in alcoves and behind equipment

**Sound Design:**
- Generator rumble (if running)
- HVAC system noise
- Radio static and chatter (ENTROPY communications)
- Tool clinking (if player moves carelessly)
- Electrical hum
- Loading dock sounds (outside traffic, if escape route used)

**Environmental Storytelling:**
- ENTROPY equipment reveals operational sophistication
- Facility blueprints marked with attack planning notes
- Communications log shows cross-cell coordination
- Laptop contains intelligence (if secured)
- Escape plan documents (routes, exfiltration timing)
- OptiGrid Solutions equipment cases (cover identity maintained)

**Gameplay Elements:**
- Final combat encounter (Voltage + Operative #3)
- Attack trigger laptop (critical objective)
- Capture vs. disable choice implementation
- Defensive combat (ENTROPY has positional advantage)
- Intelligence gathering (documents, laptop data)
- Escape route (Voltage's exit if not captured)

**Color Scheme:**
- Walls: Industrial gray/green
- Equipment: Metallic gray, yellow safety elements
- ENTROPY gear: Black tactical equipment
- Lighting: Harsh white work lights, blue laptop glow
- Accents: Orange electrical hazard warnings

---

### Room 8: Outdoor Loading Dock (Optional)

**Function:** Secondary entrance/exit, Voltage's escape route, environmental variety
**Size:** Medium (12m x 8m exterior platform)
**Atmosphere:** Transition space, dawn lighting, operational facility exterior

**Visual Elements:**

**Loading Area:**
- Concrete loading platform
- Delivery truck bay
- Forklift parking
- Chemical delivery equipment (pumps, hoses)
- Storage containers
- Facility perimeter fence (background)

**Dawn Environment:**
- Sunrise lighting (golden hour)
- Parking lot visible (employee cars arriving for day shift)
- Facility exterior architecture
- Industrial neighborhood surroundings
- Power lines and infrastructure

**Lighting:**
- Natural dawn light (primary)
- Security lights (bright, fading as sun rises)
- Delivery bay work lights
- Facility exterior illumination

**Sound Design:**
- Outdoor ambient (birds, distant traffic)
- Facility machinery audible from outside
- Employee conversations (shift change)
- Vehicle sounds (cars arriving, possible ENTROPY escape vehicle)

**Environmental Storytelling:**
- ENTROPY rental van (if Voltage escapes, license plate traceable)
- Tire tracks (recent activity)
- Chemical delivery schedule (shows normal operations)
- Employee shift change (oblivious to crisis inside)

**Gameplay Elements:**
- Optional area (not required for mission completion)
- Voltage's escape route (if not captured)
- Alternative entry point (if player chooses stealth approach)
- Witness NPC potential (day shift employees—complicates public disclosure choice)

**Color Scheme:**
- Concrete: Gray
- Dawn sky: Orange/pink/blue gradient
- Facility exterior: Industrial gray and white
- Parking lot: Asphalt black
- Vegetation: Greens (Pacific Northwest setting)

---

## SCADA Interface Design

### Visual Design Language

**Purpose:** Convey urgency progression without real-time countdown timer

**Design Principles:**
- Industrial HMI (Human-Machine Interface) aesthetic, not consumer software
- Color-coded status indicators (green/yellow/orange/red)
- Real-time parameter displays (numerical + graphical)
- Authentic SCADA UI patterns (based on real water treatment systems)

**Screen Layout:**

**Main SCADA Display:**
```
+------------------------------------------+
| FACILITY STATUS         [TIME: 05:47]   |
+------------------------------------------+
| TREATMENT TANKS:    [###] GREEN         |
| CHEMICAL DOSING:    [###] YELLOW        |  <- Changes based on urgency stage
| WATER QUALITY:      [###] GREEN         |
| SYSTEM PRESSURE:    [###] GREEN         |
+------------------------------------------+
| DOSING STATION 1:   45.2 ppm  [NORMAL]  |
| DOSING STATION 2:   45.8 ppm  [NORMAL]  |
| DOSING STATION 3:   47.3 ppm  [WARNING] |  <- Compromised station
+------------------------------------------+
| [ALERTS: 3]  [OVERRIDES: 0]             |
+------------------------------------------+
```

**Urgency Stage Visual Indicators:**

**Stage 1 (Normal Operations):**
- All indicators: Green
- Parameters: Within normal range
- Alert count: 0-1 (minor)
- Visual: Calm, stable displays

**Stage 2 (Anomaly Detected):**
- Chemical dosing: Yellow
- Parameters: Slowly increasing
- Alert count: 3-5
- Visual: Yellow warning banners appearing

**Stage 3 (Critical Warning):**
- Chemical dosing: Orange/Red
- Multiple systems: Yellow
- Parameters: Approaching danger threshold
- Alert count: 8-12
- Visual: Flashing warnings, urgent colors

**Stage 4 (Emergency):**
- Multiple systems: Red
- Parameters: Exceeding safe limits
- Alert count: 15+
- Visual: Flashing red, alarm indicators, emergency protocols active

**Stage 5 (Stabilizing):**
- Systems: Yellow → Green transition
- Parameters: Decreasing, returning to normal
- Alert count: Declining
- Visual: Warnings clearing, calming progression

**UI Elements:**

**Status Indicators:**
- Circular gauges (analog-style)
- Bar graphs (parameter trends)
- Numerical readouts (precise values)
- Color-coded zones (green/yellow/red bands)

**Alert Messages:**
- Scrolling alert log (bottom of screen)
- Priority color coding (info blue, warning yellow, critical red)
- Timestamp for each alert
- Acknowledgement status

**Control Elements:**
- Emergency shutdown button (large, red, protected)
- Override controls (manual parameter adjustment)
- System reset options
- Diagnostic tools

---

## Sound Design by Urgency Stage

### Stage 1: Normal Operations

**Ambient Sounds:**
- Machinery hum (low frequency, 40-60 Hz)
- Water flow (gentle, continuous)
- Pump rhythm (regular, predictable)
- Ventilation systems (white noise)
- Occasional radio chatter (routine)
- Computer fan noise (background)

**Tone:** Calm, operational, routine
**Volume:** Moderate background levels

### Stage 2: Anomaly Detected

**Added Sounds:**
- Alert beeps (occasional, not urgent)
- Irregular pump sounds (subtle changes)
- Increased radio chatter (concerns about readings)
- SCADA system warning tones (low priority)
- Robert Chen's voice (questioning anomalies)

**Tone:** Growing concern, investigation
**Volume:** Slightly increased, more variation

### Stage 3: Critical Warning

**Added Sounds:**
- Frequent alert tones (higher pitch)
- Alarm pre-warning (low klaxon)
- Chemical pump strain (irregular rhythm)
- Steam release sounds (pressure relief)
- Urgent radio communications
- Facility PA announcements (safety reminders)

**Tone:** Urgency, tension building
**Volume:** Noticeably louder, more chaotic

### Stage 4: Emergency

**Added Sounds:**
- Full alarm klaxon (loud, piercing)
- Emergency broadcast tones
- Multiple systems alerting simultaneously
- Chemical leak warnings (gas detection)
- Evacuation announcements
- Chen's urgent shouting (if present)

**Tone:** Crisis, maximum urgency
**Volume:** Very loud, overwhelming (intentionally stressful)

### Stage 5: Stabilizing

**Sounds Fading:**
- Alarms silencing
- Alert tones decreasing frequency
- Machinery returning to normal rhythm
- Steam releases ceasing
- Calm radio communications (all clear)
- Systems powering down warnings

**Tone:** Relief, resolution
**Volume:** Decreasing to normal levels

---

## Combat Encounter Sound Design

### Stealth Sounds

**Player Movement:**
- Footsteps (material-dependent: metal catwalks, concrete, grated platforms)
- Equipment rustle (if player has gear)
- Breathing (heavy if sprinting)

**Enemy Awareness:**
- Operative footsteps (patrol patterns)
- Radio check-ins (periodic)
- Equipment sounds (tactical gear)
- "Clear" confirmations (if player hidden)

**Stealth Takedown:**
- Brief scuffle sounds (non-lethal)
- Body lowering (player placing unconscious operative)
- Equipment drop (keycard, items)

### Direct Combat Sounds

**Combat Initiation:**
- "Contact!" shout (operative alert)
- Radio call for backup (if not prevented)
- Weapon drawing sounds

**Combat Actions:**
- Melee impacts (non-lethal combat)
- Grunt/effort sounds (player and enemies)
- Cover sounds (hiding behind equipment)
- Movement (tactical repositioning)

**Combat Resolution:**
- Defeat sounds (operative incapacitated)
- Item drops (clatter of keycard, equipment)
- Player heavy breathing (exertion)
- Alert sounds (if other operatives alerted)

---

## Environmental Storytelling Elements

### Facility Authenticity Details

**Budget Constraints Evidence:**
- Aging equipment with wear and tear
- Outdated computer systems (CRT monitors in some areas)
- Patched repairs (duct tape, improvised fixes)
- Budget cut memos
- Understaffed schedules

**Employee Humanity:**
- Personal items (lunch boxes, photos, coffee mugs)
- Shift notes (handwritten communications between teams)
- Safety award plaques (pride in safety record)
- Break room items (shows people work here)
- Employee of the month board

**Operational Excellence Despite Constraints:**
- Meticulous maintenance logs
- Safety compliance documentation
- Training certificates
- Emergency procedure drills recorded
- Clean, organized workspace (Chen's influence)

### ENTROPY Infiltration Evidence

**Physical Evidence:**
- OptiGrid Solutions branded equipment
- Tactical gear (hidden but discoverable)
- Surveillance equipment (small cameras, bugs)
- Tampered systems (subtle modifications)
- Unauthorized network equipment

**Digital Evidence:**
- Forged credentials in system
- Maintenance logs with false entries
- Security camera footage gaps
- Network access logs showing intrusion
- Encrypted communications (discoverable via VM challenges)

**Intelligence Documents:**
- Attack planning notes
- Facility vulnerability assessments
- Coordination communications (Critical Mass + Social Fabric)
- Escape route planning
- Casualty projections

---

## Lighting Design Summary

### Color Temperature Progression

**Normal Operations (Stages 1-2):**
- Cool white fluorescent (4000-5000K)
- Blue-white SCADA monitor glow
- Green emergency exit lighting
- Neutral industrial aesthetic

**Warning Progression (Stage 3):**
- Added yellow/amber warning lights
- Orange safety lighting activating
- Screen glow shifts warmer (yellow/orange warnings)
- Rotating amber beacons

**Emergency (Stage 4):**
- Red emergency lighting dominant
- Flashing red alarm lights
- Screen glow bright red (critical alerts)
- Strobe effects (alarms)

**Resolution (Stage 5):**
- Return to cool white
- Green "all clear" indicators
- Calm blue screen glow
- Emergency lights deactivating

### Shadow and Stealth Design

**Stealth-Viable Areas:**
- Treatment floor: Large equipment shadows, catwalks with limited lighting
- Chemical storage: Ventilation shadows, tank clusters
- Maintenance wing: Irregular lighting, alcove darkness
- Server room: Server rack shadows

**Lit Areas (Stealth Difficult):**
- Administration offices: Bright overhead
- Control room: Monitor glow reduces darkness
- Main entrance: Security lighting

---

## Asset Requirements Summary

### Environmental Assets

**Architecture:**
- Industrial facility tileset (walls, floors, ceilings)
- Metal grating (walkways, platforms)
- Concrete textures (floors, walls)
- Pipe systems (various sizes, colors)
- Doors (standard, secure, emergency)
- Windows (office, industrial high windows)
- Ceiling tiles (administrative areas)

**Equipment:**
- Water treatment tanks (large, metallic)
- Chemical storage tanks (yellow, hazard labels)
- Server racks (with LED indicators)
- SCADA control panels and monitors
- Pump systems
- Ventilation units
- Electrical panels
- Generator

**Furniture:**
- Office desks and chairs
- Cubicle dividers
- Filing cabinets
- Security desk
- Workbenches (maintenance)
- Break room furniture

**Safety Equipment:**
- Eye wash stations
- Emergency showers
- First aid kits
- Fire extinguishers
- Safety signage
- Emergency exit signs

**ENTROPY Equipment:**
- Tactical gear (vests, bags)
- Laptop computers
- Radio equipment
- Surveillance devices
- Bypass devices (attack hardware)

### UI Assets

**SCADA Interface:**
- Monitor screen frames
- Status indicators (green/yellow/red)
- Gauge displays
- Alert message panels
- Control buttons
- Graph displays

**Combat UI:**
- Stealth indicators
- Alert level displays
- Enemy awareness markers
- Combat prompts

**Mission UI:**
- Urgency stage indicator (not timer—stage progress)
- Objective updates
- Item acquisition notices

### Character Assets (Referenced, detailed in Stage 3)

**NPCs:**
- Robert Chen (facility manager)
- Voltage (ENTROPY leader)
- Critical Mass operatives (×3)
- Security guard
- Background employees (shift workers)

**Player:**
- Combat animations
- Stealth animations
- Interaction animations

### Sound Assets

**Ambient Loops:**
- Machinery hum (multiple variations)
- Water flow
- Ventilation systems
- Computer equipment
- Alarm systems (various levels)

**Sound Effects:**
- Footsteps (multiple surfaces)
- Doors opening/closing
- Equipment interactions
- Combat sounds
- Alert tones
- Radio chatter

**Voice Acting:**
- Robert Chen dialogue
- Voltage dialogue
- Operative radio communications
- Agent 0x99 briefing/support
- Facility PA announcements

---

## Atmosphere Pacing

### Act 1 Atmosphere (15-20 minutes)

**Environment:** Normal facility operations, early morning
**Lighting:** Standard industrial lighting, dawn breaking through windows
**Sound:** Routine operational sounds, quiet
**Tension:** Underlying unease, investigative calm
**Color Palette:** Cool blues and grays, professional

### Act 2 Atmosphere (40-50 minutes)

**Environment:** Escalating urgency, systems showing anomalies
**Lighting:** Progressive warning lights, yellows and oranges appearing
**Sound:** Increasing alert tones, irregular machinery, urgent communications
**Tension:** Active investigation, combat encounters, growing pressure
**Color Palette:** Adding yellows, oranges, warming atmosphere

### Act 3 Atmosphere (16-24 minutes)

**Environment:** Crisis peak, emergency protocols active
**Lighting:** Red emergency lighting, flashing alarms, critical alerts
**Sound:** Full alarm systems, urgent shouts, crisis communications
**Tension:** Maximum intensity, final confrontation, critical decisions
**Color Palette:** Dominant reds, high contrast, emergency aesthetic

### Resolution Atmosphere (Final minutes)

**Environment:** Stabilizing systems, returning to normal (or damaged if partial success)
**Lighting:** Emergency lights fading, returning to normal operations
**Sound:** Alarms silencing, machinery normalizing, calm communications
**Tension:** Relief, reflection, debrief
**Color Palette:** Returning to cool blues/greens, or lingering yellows if consequences

---

## Reference Materials

### Real-World Inspirations

**Water Treatment Facilities:**
- Industrial SCADA systems (Siemens, Allen-Bradley HMI designs)
- Municipal water treatment plant layouts
- Chemical dosing systems and safety protocols
- Control room configurations

**Industrial Architecture:**
- Utilitarian facility design
- Safety color coding (OSHA standards)
- Emergency equipment placement
- Operational efficiency layouts

**SCADA/ICS Security:**
- Authentic vulnerability patterns
- Real attack vectors (Stuxnet-inspired but fictional)
- Industrial control system aesthetics
- Cybersecurity incident response

### Artistic References

**Visual Style:**
- Industrial photography (authentic textures and lighting)
- Technical documentation aesthetics
- Safety and hazard signage design
- Utilitarian color palettes

**Audio References:**
- Industrial ambient soundscapes
- Alarm and warning system designs
- Radio communication audio quality
- Machinery operational sounds

---

## Success Criteria for Atmosphere

### Visual Clarity:
- 90%+ players can identify urgency stage from visual cues alone
- SCADA interface conveys technical authenticity without confusion
- Combat spaces provide clear cover and stealth opportunities

### Audio Effectiveness:
- 85%+ players report sound design enhanced tension
- Urgency progression feels natural, not forced
- Combat audio provides tactical information (enemy positions)

### Environmental Storytelling:
- 80%+ players notice ENTROPY infiltration evidence
- Facility feels authentic and lived-in
- Budget constraints visible but not cartoonish

### Atmosphere Cohesion:
- Visual, audio, and narrative elements reinforce each other
- Urgency progression feels organic, not scripted
- Environment supports both stealth and combat playstyles

---

## Stage 2 Completion Checklist

- [x] Facility layout designed (8 rooms with connections)
- [x] Room-by-room atmosphere defined
- [x] SCADA interface visual design specified
- [x] Sound design mapped to urgency stages
- [x] Combat space design considerations included
- [x] Environmental storytelling elements detailed
- [x] Lighting design progression planned
- [x] Asset requirements listed
- [x] Atmosphere pacing mapped to narrative acts
- [x] Success criteria defined

---

## Next Stage Preparation

**Stage 3: Character Development and NPC Design**
- Detailed character profiles for Robert Chen, Voltage, operatives
- Dialogue voice and personality traits
- NPC behavior patterns and patrol routes
- Character sprite and animation requirements
- Relationship dynamics with player

**Key Questions for Stage 3:**
- What makes Robert Chen's transformation from skeptical to ally feel earned?
- How do we make Voltage feel like a credible professional threat, not generic villain?
- What personality traits distinguish the three field operatives?
- How does player choice affect character relationships?

---

**Status:** Stage 2 Complete - Ready for Stage 3
**Estimated Development Time:** 10-12 hours for Stage 2 documentation complete
**Quality Assessment:** Comprehensive environmental design with integrated urgency progression, combat space considerations, and authentic industrial atmosphere

---

*Stage 2 establishes the complete visual and audio language for Mission 4, providing detailed specifications for environment artists, sound designers, and UI developers. The facility layout supports both narrative flow and gameplay mechanics, while the urgency progression system creates tension through environmental cues rather than countdown timers.*
