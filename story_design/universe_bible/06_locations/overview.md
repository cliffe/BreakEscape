# Location & Environment Overview

## Purpose
Break Escape scenarios rely heavily on carefully designed environments that serve multiple functions: storytelling, gameplay progression, educational content delivery, and atmospheric immersion. Every location should feel purposeful, believable, and integrated with both narrative and technical challenges.

## Core Location Philosophy

### The Office-Based Foundation
Break Escape primarily uses **office and corporate environments** with variations. This design choice is deliberate:
- **Relatable**: Most players understand office spaces
- **Versatile**: Offices exist in every industry
- **Realistic**: Actual cyber security work happens in these environments
- **Educational**: Mirrors real-world penetration testing scenarios
- **Scalable**: Can range from small startups to massive corporations

### Beyond Standard Offices
While offices form the foundation, the universe extends to:
- Research facilities and laboratories
- Critical infrastructure sites
- Underground networks and hidden bases
- Government and institutional buildings
- Hybrid spaces (corporate fronts concealing ENTROPY operations)

## Environment Categories

### 1. Corporate Environments
The bread and butter of Break Escape scenarios:
- Office buildings (small to enterprise scale)
- Tech companies and startups
- Financial institutions
- Consulting firms
- Co-working spaces

**Gameplay Function**: Social engineering, document investigation, computer access, evidence gathering

### 2. Research Facilities
Scientific and technical research spaces:
- University research departments
- Private R&D centers
- Pharmaceutical labs
- Quantum computing facilities
- Experimental technology sites

**Gameplay Function**: Advanced technical challenges, VM exploitation, specialized security systems

### 3. Infrastructure Sites
Critical systems and utilities:
- Power generation and distribution
- Water treatment facilities
- Data centers
- Telecommunications hubs
- Transportation control centers

**Gameplay Function**: High-stakes scenarios, SCADA systems, operational technology security

### 4. Underground Spaces
Hidden and secure locations:
- Server rooms and network operations centers
- Secure bunkers and vaults
- Secret ENTROPY bases
- Dark web marketplace physical locations
- Hidden sub-basements

**Gameplay Function**: Atmosphere, discovery, high-security challenges, narrative reveals

### 5. SAFETYNET Locations
Player-aligned spaces (limited direct gameplay):
- Headquarters (briefing cutscenes only)
- Safe houses (between-mission spaces)
- Field offices (mission prep areas)
- Training facilities (tutorial scenarios)

**Gameplay Function**: Framing device, mission context, player progression systems

### 6. ENTROPY Front Companies
Deliberately suspicious cover operations:
- "TotallyLegit Consulting Inc." style obvious fronts
- Legitimate-seeming businesses with hidden sections
- Abandoned buildings occupied secretly
- Co-opted legitimate organizations

**Gameplay Function**: Dark comedy, discovery mechanics, dual-layer investigation

## Environmental Design Principles

### Principle 1: Purposeful Placement
**Every room and object serves gameplay:**
- Advances narrative thread
- Presents puzzle or challenge
- Provides crucial clue
- Offers meaningful choice
- Creates atmosphere and immersion

**Implementation:**
- No "filler" rooms that exist just for space
- Every interactable object has purpose
- Environmental details tell stories
- Empty spaces create intentional tension

### Principle 2: Visual Storytelling
**Rooms communicate through details:**

| Environmental Cue | Story Implication |
|------------------|-------------------|
| Messy desk with coffee cups | Overworked or careless employee |
| Personal photos and memorabilia | Character motivation, connections |
| Whiteboard diagrams | Current projects and concerns |
| Empty office with active computer | Suspicious absence |
| Locked high-security door | Important secret behind it |
| Pristine executive office | Control, power, hidden dangers |
| IT office cluttered with cables | Helpful chaos, tech resources |

### Principle 3: Interconnected Spaces
**Logical spatial relationships:**
- Office layouts make architectural sense
- Related functions near each other (IT near server room)
- Executive areas separated from general workspace
- Security checkpoints at appropriate boundaries
- Emergency exits and maintenance access present
- Conference rooms near executive areas
- Break rooms and bathrooms create verisimilitude

### Principle 4: Progressive Disclosure
**Use fog of war effectively:**
- Initial area establishes tone and context
- Each new room provides new information
- Security levels increase with progression
- Late-game areas have highest security
- Final room(s) contain climactic confrontation
- Player builds mental map through exploration

### Principle 5: Multiple Paths
**Offer meaningful choices:**
- Front door vs. maintenance entrance
- Social engineering vs. stealth approach
- Technical exploit vs. physical bypass
- High security route vs. longer alternative path
- Different paths teach different concepts
- Convergent design (paths rejoin at key points)

### Principle 6: Environmental Consistency
**Maintain believable spaces:**
- Security measures match threat level
- Technology appropriate to organization type
- Cleanliness/maintenance reflects company status
- Personal effects reveal character personalities
- Abandoned areas show signs of disuse
- Active areas show signs of life

## Atmosphere & Tone by Location Type

### Corporate Professional
- Clean, organized environments
- Modern technology
- Professional signage and branding
- Security cameras visible
- Access control systems
- Minimal personal touches

**Example**: Legitimate pharmaceutical company

### Startup Chaos
- Open floor plans
- Casual atmosphere
- Tech clutter and cables everywhere
- Whiteboard walls covered in diagrams
- Communal spaces
- Less formal security

**Example**: Silicon Valley tech startup

### Government Institutional
- Bureaucratic signage and procedures
- Dated technology alongside modern systems
- Multiple security checkpoints
- Procedure-focused design
- Formal atmospheres
- Paper-heavy environments

**Example**: Regulatory agency office

### Underground/Secret
- Industrial or utilitarian aesthetic
- Harsh lighting or dim illumination
- Exposed infrastructure (pipes, cables)
- Heavy security doors
- Surveillance equipment
- Atmosphere of secrecy

**Example**: ENTROPY underground base

### Abandoned/Compromised
- Signs of neglect or hasty departure
- Flickering lights
- Disabled security systems
- Scattered evidence of previous occupants
- Eerie quiet
- Environmental storytelling through debris

**Example**: Raided ENTROPY front company

### Eldritch/Cult
- Unsettling combinations (modern + occult)
- Ritualistic spaces with quantum computers
- Symbolic markings and cryptography
- Atmospheric lighting (candles + LED)
- Reality-bending aesthetics
- Tension between science and mysticism

**Example**: Cryptographic cult research facility

## Standard Room Types

Break Escape uses a catalog of standard room types that can be combined and customized. Each room type serves specific gameplay functions and contains expected features with variations.

See detailed room type specifications in:
- `corporate_environments.md` - Office-based locations
- `research_facilities.md` - Labs and R&D centers
- `infrastructure_sites.md` - Critical infrastructure
- `underground_spaces.md` - Hidden and secure areas
- `safetynet_locations.md` - SAFETYNET facilities
- `notable_locations.md` - Specific recurring locations

## Spatial Design Guidelines

### Room Count & Scenario Length
- **Short scenarios (30-45 min)**: 5-7 rooms
- **Standard scenarios (45-75 min)**: 8-12 rooms
- **Extended scenarios (75-90 min)**: 13-15 rooms

### Layout Patterns

#### Linear Progression
```
Start → Room A → Room B → Room C → End
```
**Use when**: Tutorial scenarios, tightly guided narratives
**Drawback**: Limited player agency, less replayability

#### Hub-and-Spoke
```
        Room B
           |
Room A - Start - Room C
           |
        Room D
```
**Use when**: Investigation scenarios, evidence gathering
**Benefit**: Player chooses exploration order, natural backtracking

#### Layered Access
```
Public Area → Secure Area → High Security → Vault
```
**Use when**: Infiltration scenarios, progressive security challenges
**Benefit**: Clear escalation, earned access, mounting tension

#### Interconnected Network
```
Room A ←→ Room B
  ↕         ↕
Room C ←→ Room D
```
**Use when**: Complex investigations, multiple objectives
**Benefit**: Multiple paths, discovery-focused, high replayability

### Recommended: Hybrid Approach
Most scenarios should combine patterns:
- Hub area for player orientation
- Layered access for security progression
- Interconnected side areas for optional content
- At least 2-3 multi-room puzzle chains requiring backtracking

## Implementation Notes

### JSON Scenario Specification
Locations defined in scenario files should include:
- **Room type**: Standard categorization for asset loading
- **Connections**: North/south/east/west door definitions
- **Security**: Lock types, access requirements
- **Interactive objects**: Computers, filing cabinets, safes
- **NPCs**: Character positions and patrol routes
- **Lighting**: Atmosphere and stealth mechanics
- **Audio**: Ambient sounds, music cues

### Fog of War System
- Rooms start hidden until discovered
- Door interactions reveal adjacent rooms
- Map gradually builds player's mental model
- Some doors visible but locked (creates goals)
- Backtracking shows familiar spaces differently

### Environmental Interactivity
Every environment should include:
- **3-5 major interactive objects** (computers, safes, locked doors)
- **5-10 minor interactables** (drawers, notes, decorative objects)
- **1-2 NPCs** for social interaction (when appropriate)
- **Background details** that reward observation
- **Hidden secrets** for thorough explorers

## Scenario Integration

### Matching Location to Mission Type

| Mission Type | Ideal Locations |
|--------------|----------------|
| Infiltration & Investigation | Corporate offices, research facilities |
| Deep State Investigation | Government agencies, regulatory bodies |
| Incident Response | Data centers, compromised businesses |
| Penetration Testing | Any client organization |
| Defensive Operations | SAFETYNET facilities, critical infrastructure |
| Double Agent / Undercover | ENTROPY fronts, compromised organizations |
| Rescue / Extraction | Hostile territory, secret facilities |

### Location Continuity
Some locations can recur across scenarios:
- **Tesseract Research Institute** - Recurring research facility
- **ENTROPY "Safe" Houses** - Different cells' secret bases
- **SAFETYNET Regional Office** - Mission briefing location
- **The Architect's Previous Lairs** - Abandoned hideouts

This creates world continuity and rewards attentive players.

## Atmosphere & Player Experience

### Environmental Storytelling Checklist
- [ ] Room layout makes logical sense
- [ ] Security measures appropriate to value protected
- [ ] Personal details reveal character motivations
- [ ] Technology reflects organization type
- [ ] Discovered documents advance narrative
- [ ] Hidden areas reward exploration
- [ ] Atmosphere matches scenario tone

### Player Guidance Through Environment
Use environmental design to guide players:
- **Lighting**: Brighter areas draw attention
- **Color**: Red doors signal security, green signals safe zones
- **Sound**: Audio cues indicate interactive objects
- **NPC positions**: Block unintended paths naturally
- **Locked doors**: Create clear goals ("I need access here")
- **Visual focal points**: Draw eye to important elements

### Accessibility Considerations
- Clear visual indicators for interactable objects
- Text size and contrast for readability
- Audio cues paired with visual indicators
- Color-blind friendly design choices
- Multiple solution paths for spatial reasoning challenges

## Design Workflow

When designing a new location:

1. **Determine Mission Type** - What gameplay style?
2. **Select Environment Category** - Corporate, research, infrastructure, etc.
3. **Define Security Profile** - How much access control?
4. **Sketch Layout** - Hub, linear, layered, or network?
5. **Place Key Rooms** - Entry, climax, secure areas
6. **Design Puzzle Flow** - Where are locks, keys, and challenges?
7. **Add NPCs** - Who works here? Who's suspicious?
8. **Environmental Storytelling** - What details tell the story?
9. **Atmosphere Pass** - Lighting, audio, decorative details
10. **Playtest** - Navigation clear? Backtracking manageable?

## Conclusion

Locations in Break Escape are more than backdrops - they are active participants in gameplay, storytelling, and education. A well-designed environment should feel real, serve clear gameplay purposes, and immerse players in the world of corporate espionage and cyber security operations.

Every room should answer: **"Why is the player here, and what do they learn?"**
